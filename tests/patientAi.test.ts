import { describe, expect, it } from 'vitest';
import { startEncounter } from '../src/core/encounter';
import { generateCase } from '../src/core/generator';
import { AiError, askAiPatient } from '../src/ui/ai/patientAi';
import { config, content } from './helpers';

/** Pasien AI dengan `sample` tiruan: jalur alat, jawaban tanpa alat, dan klasifikasi galat. */

const enc = startEncounter(generateCase(content, config, { diseaseId: 'dengue', seed: 7 }));

type Sample = Parameters<typeof askAiPatient>[0];
const sampleOf = (impl: (input: string, opts: { tools?: { execute(i: Record<string, unknown>, c: { signal: AbortSignal }): unknown }[]; signal?: AbortSignal }) => Promise<{ text: string; truncated: boolean }>) =>
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
