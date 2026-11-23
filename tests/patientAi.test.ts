import { describe, expect, it } from 'vitest';
import { startEncounter } from '../src/core/encounter';
import { generateCase } from '../src/core/generator';
import { AI_PATIENT_MODEL, AiError, askAiPatient, patientSampleOptions } from '../src/ui/ai/patientAi';
import { config, content } from './helpers';

/** Pasien AI dengan `sample` tiruan: jalur alat, jawaban tanpa alat, dan klasifikasi galat. */

const enc = startEncounter(generateCase(content, config, { diseaseId: 'dengue', seed: 7 }));

type Sample = Parameters<typeof askAiPatient>[0];
type Opts = { tools?: { execute(i: Record<string, unknown>, c: { signal: AbortSignal }): unknown }[]; signal?: AbortSignal; model?: string; modelTier?: string };
const sampleOf = (impl: (input: string, opts: Opts) => Promise<{ text: string; truncated: boolean; modelApplied?: string }>) =>
  impl as unknown as Sample;

async function codeOf(p: Promise<unknown>): Promise<{ code: string; permanent: boolean }> {
  try {
    await p;
  } catch (e) {
    expect(e).toBeInstanceOf(AiError);
    return { code: (e as AiError).code, permanent: (e as AiError).permanent };
  }
  throw new Error('tidak melempar');
}

describe('pasien AI', () => {
  it('fakta diambil lewat alat dan dicatat seperti jalur lokal', async () => {
    const sample = sampleOf(async (_input, opts) => {
      const res = (await opts.tools![0]!.execute({ topik: ['onset'], gejala: ['batuk'] }, { signal: new AbortController().signal })) as { jawaban_rujukan: string }[];
      return { text: `Hmm.\n\n${res.map((r) => r.jawaban_rujukan).join(' ')}`, truncated: false };
    });
    const r = await askAiPatient(sample, enc, 'Sejak kapan? Ada batuk?', content, []);
    expect(r.usedTools).toBe(true);
    expect(r.intents.map((i) => i.kind)).toEqual(['topic', 'symptom']);
    expect(r.state.questionCount).toBe(enc.questionCount + 1);
    expect(r.state.askedTopics).toContain('onset');
    expect(r.reply).not.toContain('Hmm.');
  });

  it('pertanyaan klinis yang dijawab tanpa alat memakai jawaban mesin (tidak mengarang)', async () => {
    const sample = sampleOf(async () => ({ text: 'Saya rasa ini tifus, Dok.', truncated: false }));
    const r = await askAiPatient(sample, enc, 'Ada demam?', content, [{ kind: 'symptom', symptom: 'demam' }]);
    expect(r.usedTools).toBe(false);
    expect(r.reply).not.toContain('tifus');
    expect(r.state.askedSymptoms).toContain('demam');
  });

  it('pembatalan (batas waktu/pasien berganti) dilaporkan sebagai "cancelled", bukan galat lain', async () => {
    const controller = new AbortController();
    const sample = sampleOf(
      (_input, opts) =>
        new Promise((_, reject) => {
          opts.signal!.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        }),
    );
    const pending = askAiPatient(sample, enc, 'Ada batuk?', content, [], controller.signal);
    controller.abort();
    expect(await codeOf(pending)).toEqual({ code: 'cancelled', permanent: false });
    // DOMException punya `code` numerik (20) — tidak boleh terbaca sebagai kode galat.
    const domOnly = sampleOf(async () => {
      throw new DOMException('Aborted', 'AbortError');
    });
    expect((await codeOf(askAiPatient(domOnly, enc, 'Ada batuk?', content, []))).code).toBe('cancelled');
  });

  it('kode galat platform diteruskan; izin ditolak bersifat permanen', async () => {
    const failing = (code: unknown) =>
      sampleOf(async () => {
        throw Object.assign(new Error('x'), { code });
      });
    expect(await codeOf(askAiPatient(failing('rate_limited'), enc, 'Ada batuk?', content, []))).toEqual({ code: 'rate_limited', permanent: false });
    expect(await codeOf(askAiPatient(failing('not_granted'), enc, 'Ada batuk?', content, []))).toEqual({ code: 'not_granted', permanent: true });
    expect((await codeOf(askAiPatient(failing(42), enc, 'Ada batuk?', content, []))).code).toBe('upstream_error');
  });
});

describe('model pasien AI: Claude Haiku 5.5', () => {
  it('setiap panggilan menamai claude-haiku-5-5, dengan tier cepat hanya sebagai cadangan platform', async () => {
    expect(AI_PATIENT_MODEL).toBe('claude-haiku-5-5');
    expect(patientSampleOptions([])).toEqual({ tools: [], model: 'claude-haiku-5-5', modelTier: 'quick' });
    const seen: Opts[] = [];
    const sample = sampleOf(async (_input, opts) => {
      seen.push(opts);
      return { text: 'Iya, Dok.', truncated: false, modelApplied: 'claude-haiku-5-5' };
    });
    for (const q of ['Selamat pagi', 'Ada batuk?', 'Kucingnya siapa namanya?']) await askAiPatient(sample, enc, q, content, []);
    expect(seen).toHaveLength(3);
    for (const o of seen) {
      expect(o.model).toBe('claude-haiku-5-5');
      expect(o.modelTier).toBe('quick');
    }
  });

  it('melaporkan model yang benar-benar menjawab (Haiku atau tier cadangan)', async () => {
    const haiku = sampleOf(async () => ({ text: 'Iya, Dok.', truncated: false, modelApplied: 'claude-haiku-5-5' }));
    expect((await askAiPatient(haiku, enc, 'Selamat pagi', content, [])).model).toBe('claude-haiku-5-5');
    const fallback = sampleOf(async () => ({ text: 'Iya, Dok.', truncated: false }));
    expect((await askAiPatient(fallback, enc, 'Selamat pagi', content, [])).model).toBeNull();
    // Jawaban klinis tanpa alat tetap memakai mesin, tetapi model yang dipanggil tetap dicatat.
    const noTool = sampleOf(async () => ({ text: 'Karangan.', truncated: false, modelApplied: 'claude-haiku-5-5' }));
    const r = await askAiPatient(noTool, enc, 'Ada demam?', content, [{ kind: 'symptom', symptom: 'demam' }]);
    expect(r.reply).not.toContain('Karangan');
    expect(r.model).toBe('claude-haiku-5-5');
  });
});
