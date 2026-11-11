/**
 * Pasien AI: Claude memerankan pasien lewat kapabilitas `sample` (Artifact claude.ai).
 *
 * Prinsip keamanan konten:
 *  - Claude TIDAK diberi "kebenaran" kasus (diagnosis, gejala, hasil lab). Ia hanya
 *    tahu identitas, gaya bicara, dan keluhan awal pasien.
 *  - Fakta anamnesis hanya bisa didapat lewat alat halaman (`cari_fakta`), yang
 *    menjalankan mesin permainan yang sama dengan mode lokal (applyIntents). Jadi
 *    apa yang terungkap tercatat & dinilai persis sama, dan pengungkapan tetap bertahap.
 *  - Claude menulis ulang jawaban rujukan dengan gaya pasien, memakai konteks percakapan
 *    untuk memahami rumusan pertanyaan yang beragam.
 *
 * Bila kapabilitas tidak tersedia, ditolak, atau gagal, pemanggil memakai NLU lokal.
 */
import { applyIntents, recordExchange } from '../../core/encounter';
import type { Intent } from '../../core/nlu';
import type { EncounterState, GameContent } from '../../core/types';

/* Bentuk minimal API `sample` yang dipakai (lihat definisi tipe platform). */
interface SampleTool {
  name: string;
  description: string;
  inputSchema?: { type: 'object'; properties?: Record<string, unknown>; required?: string[] };
  execute(input: Record<string, unknown>, context: { signal: AbortSignal }): unknown;
}
interface SampleFn {
  (input: string, options?: { tools?: SampleTool[]; modelTier?: 'quick' | 'default' | 'complex'; signal?: AbortSignal }): Promise<{ text: string; truncated: boolean }>;
  limits?: () => Promise<{ tools?: { maxCount: number } }>;
}
interface ClaudeGlobal {
  use(name: string): Promise<unknown>;
}

export type AiAvailability = 'checking' | 'ready' | 'unavailable';

let samplePromise: Promise<SampleFn | null> | null = null;

/** Namespace `sample` (null bila tidak dijalankan di claude.ai / tidak diizinkan / tanpa dukungan alat). */
export function getSample(): Promise<SampleFn | null> {
  if (samplePromise) return samplePromise;
  samplePromise = (async () => {
    try {
      const claude = (window as unknown as { claude?: ClaudeGlobal }).claude;
      if (!claude || typeof claude.use !== 'function') return null;
      const sample = (await claude.use('sample')) as SampleFn | null;
      if (!sample) return null;
      if (typeof sample.limits === 'function') {
        const limits = await sample.limits();
        if (!limits.tools) return null;
      }
      return sample;
    } catch {
      return null;
    }
  })();
  return samplePromise;
}

/** Kode galat yang berarti fitur AI harus dimatikan untuk sesi ini. */
const PERMANENT = new Set(['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed', 'tools_unavailable']);

export interface AiAnswer {
  state: EncounterState;
  reply: string;
  /** Intent yang diambil lewat alat (dasar bahasa tubuh pasien 3D) & potongan jawabannya. */
  intents: Intent[];
  parts: string[];
}

export class AiError extends Error {
  constructor(
    readonly code: string,
    readonly permanent: boolean,
  ) {
    super(code);
  }
}

const MAX_HISTORY = 14;

function personaPrompt(state: EncounterState, content: GameContent, question: string): string {
  const c = state.case;
  const p = c.patient;
  const personality = content.personalitiesById.get(p.personalityId)!;
  const history = state.log
    .filter((e) => e.kind === 'doctor' || e.kind === 'patient')
    .slice(-MAX_HISTORY)
    .map((e) => `${e.kind === 'doctor' ? 'Dokter' : 'Pasien'}: ${'text' in e ? e.text : ''}`)
    .join('\n');
  return [
    'Kamu memerankan PASIEN di sebuah simulasi edukasi praktik dokter umum di Indonesia. Pemain adalah dokter.',
    '',
    'IDENTITAS PASIEN',
    `- Nama: ${p.name} (dipanggil ${p.address}), ${p.age} tahun, ${p.sex === 'male' ? 'laki-laki' : 'perempuan'}, ${p.occupationLabel.toLowerCase()}.`,
    `- Gaya bicara: ${personality.label} — ${personality.impression}. Contoh cara dia bicara: "${personality.symptomYes[0]}", "${personality.symptomNo[0]}".`,
    `- Keluhan yang sudah dia ceritakan di awal: "${c.complaint}"`,
    '',
    'ATURAN (WAJIB)',
    '1. Kamu TIDAK tahu apa pun tentang kesehatanmu selain keluhan awal di atas. Untuk SETIAP pertanyaan tentang gejala, riwayat, obat, alergi, keluarga, kebiasaan, lingkungan, atau detail keluhan, panggil alat `cari_fakta` dulu, lalu jawab HANYA berdasarkan "jawaban_rujukan" yang dikembalikan.',
    '2. Jangan menambah, mengarang, atau menyimpulkan fakta medis. Jangan menyebut nama penyakit/diagnosis. Jangan menyebut gejala yang tidak ditanyakan.',
    '3. Bila rujukan berkata tidak ada / tidak tahu, sampaikan itu. Bila pertanyaan diulang, jawab konsisten dengan jawaban sebelumnya.',
    '4. Pahami maksud dokter walau rumusannya tidak baku, bahasa daerah ringan, salah ketik, atau merujuk percakapan sebelumnya ("yang tadi itu sejak kapan?"). Pilih topik/gejala yang paling sesuai.',
    '5. Pertanyaan yang bukan soal kesehatan (basa-basi, salam): jawab singkat dan sopan tanpa memanggil alat.',
    '6. Jawab dalam Bahasa Indonesia sehari-hari sesuai gaya bicara pasien, 1–3 kalimat, satu paragraf, tanpa tanda kutip, tanpa awalan "Pasien:". Jangan menulis apa pun sebelum memanggil alat.',
    '',
    'PERCAKAPAN SEJAUH INI',
    history || '(belum ada)',
    '',
    `PERTANYAAN DOKTER SEKARANG: ${question}`,
  ].join('\n');
}

function factTool(content: GameContent, onIntents: (intents: Intent[]) => string[]): SampleTool {
  const topics = content.anamnesis.map((t) => t.id);
  const symptoms = content.symptoms.map((s) => s.id);
  const reviews = content.reviews.map((r) => r.id);
  const detailTopics = ['onset', 'lokasi', 'karakter', 'durasi', 'keparahan', 'pola', 'progresi', 'pemberat_peringan'];
  const topicHelp = content.anamnesis.map((t) => `${t.id}=${t.label}`).join('; ');
  return {
    name: 'cari_fakta',
    description:
      'Ambil jawaban rujukan pasien dari rekam kasus. Isi satu atau beberapa kunci sesuai pertanyaan dokter (maks. 4 butir total). ' +
      'topik: aspek anamnesis keluhan utama/riwayat. gejala: tanya apakah ada gejala tertentu. detail: aspek keluhan untuk gejala tertentu yang BUKAN keluhan awal. ' +
      'tinjauan: pertanyaan umum per sistem (mis. "BAB-nya bagaimana?"). Mengembalikan daftar {butir, jawaban_rujukan}. ' +
      `Topik: ${topicHelp}.`,
    inputSchema: {
      type: 'object',
      properties: {
        topik: { type: 'array', items: { type: 'string', enum: topics } },
        gejala: { type: 'array', items: { type: 'string', enum: symptoms } },
        detail: {
          type: 'array',
          items: {
            type: 'object',
            properties: { gejala: { type: 'string', enum: symptoms }, topik: { type: 'string', enum: detailTopics } },
            required: ['gejala', 'topik'],
          },
        },
        tinjauan: { type: 'array', items: { type: 'string', enum: reviews } },
      },
    },
    execute(input) {
      const list = (v: unknown) => (Array.isArray(v) ? v.map(String) : typeof v === 'string' ? [v] : []);
      const intents: Intent[] = [];
      for (const t of list(input.topik)) if (content.anamnesisById.has(t)) intents.push({ kind: 'topic', topic: t });
      for (const s of list(input.gejala)) if (content.symptomsById.has(s)) intents.push({ kind: 'symptom', symptom: s });
      for (const d of Array.isArray(input.detail) ? input.detail : []) {
        const g = String((d as Record<string, unknown>)?.gejala ?? '');
        const t = String((d as Record<string, unknown>)?.topik ?? '');
        if (content.symptomsById.has(g) && detailTopics.includes(t)) intents.push({ kind: 'symptom_detail', topic: t, symptom: g });
      }
      for (const r of list(input.tinjauan)) if (content.reviewsById.has(r)) intents.push({ kind: 'review', group: r });
      if (intents.length === 0) throw new Error('Tidak ada topik/gejala yang dikenali. Gunakan id dari daftar enum.');
      const limited = intents.slice(0, 4);
      const parts = onIntents(limited);
      return limited.map((it, i) => ({ butir: describeIntent(it), jawaban_rujukan: parts[i] ?? '' }));
    },
  };
}

function describeIntent(it: Intent): string {
  switch (it.kind) {
    case 'topic':
      return `topik:${it.topic}`;
    case 'symptom':
      return `gejala:${it.symptom}`;
    case 'symptom_detail':
      return `detail:${it.symptom}/${it.topic}`;
    case 'review':
      return `tinjauan:${it.group}`;
    default:
      return it.kind;
  }
}

/** Ambil paragraf jawaban terakhir (dengan alat, teks tiap ronde digabung dengan baris kosong). */
function finalParagraph(text: string): string {
  const blocks = text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  const last = blocks.at(-1) ?? '';
  return last.replace(/^(pasien|jawaban)\s*:\s*/i, '').replace(/^["“](.*)["”]$/s, '$1').trim();
}

/**
 * Tanyakan ke pasien AI. Mengembalikan state baru (dengan pertukaran tercatat) dan jawabannya.
 * `fallbackIntents` = hasil NLU lokal; dipakai bila Claude menjawab tanpa memanggil alat
 * padahal pertanyaannya jelas klinis (mencegah jawaban karangan).
 */
export async function askAiPatient(
  sample: SampleFn,
  state: EncounterState,
  question: string,
  content: GameContent,
  fallbackIntents: readonly Intent[],
  signal?: AbortSignal,
): Promise<AiAnswer & { usedTools: boolean }> {
  let working = state;
  let usedTools = false;
  const usedIntents: Intent[] = [];
  const usedParts: string[] = [];
  const tool = factTool(content, (intents) => {
    usedTools = true;
    const r = applyIntents(working, intents, content);
    working = r.state;
    usedIntents.push(...intents);
    usedParts.push(...r.parts);
    return r.parts;
  });
  let text: string;
  try {
    const result = await sample(personaPrompt(state, content, question), { tools: [tool], modelTier: 'quick', signal });
    text = finalParagraph(result.text);
  } catch (e) {
    const code = typeof e === 'object' && e && 'code' in e ? String((e as { code: unknown }).code) : 'upstream_error';
    throw new AiError(code, PERMANENT.has(code));
  }
  if (!usedTools && fallbackIntents.length > 0) {
    // Claude tidak mengambil fakta untuk pertanyaan klinis → pakai jawaban mesin agar tetap konsisten.
    const r = applyIntents(state, fallbackIntents, content);
    const reply = r.parts.join(' ');
    return { state: recordExchange(r.state, question, reply), reply, usedTools: false, intents: [...fallbackIntents], parts: r.parts };
  }
  if (!text) throw new AiError('empty_completion', false);
  return { state: recordExchange(working, question, text), reply: text, usedTools, intents: usedIntents, parts: usedParts };
}
