/**
 * Satu konsultasi (encounter): anamnesis bebas, pemeriksaan, penalaran, dan keputusan.
 *
 * Semua fungsi murni: menerima state lama dan mengembalikan state BARU
 * (state lama tidak diubah). Aksi yang tidak sah melempar EncounterError;
 * UI sebaiknya memeriksa dulu dengan fungsi can*() untuk menampilkan alasannya.
 *
 * Anamnesis tidak dibatasi jumlahnya. Pasien "ingat" apa yang sudah ditanyakan:
 * pertanyaan yang diulang dijawab konsisten dengan awalan "seperti tadi saya bilang".
 */
import {
  answerOtherComplaints,
  answerReview,
  answerSymptomDetail,
  answerSymptomQuestion,
  chiefComplaintReply,
  conversationReply,
  durationReaction,
  symptomOnsetDays,
} from './dialogue';
import { evaluateEncounter } from './evaluation';
import { DETAIL_TOPICS, type Intent, type Interpretation, interpretQuestion } from './nlu';
import { fillTemplate } from './text';
import { toolPrice } from './scoring';
import type {
  ClinicalDecision,
  DdxStatus,
  EncounterState,
  GameConfig,
  GameContent,
  LogEntry,
  PatientCase,
} from './types';

export class EncounterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EncounterError';
  }
}

export interface Check {
  ok: boolean;
  /** Alasan (Bahasa Indonesia) jika tidak boleh. */
  reason?: string;
}

const OK: Check = { ok: true };

export function startEncounter(c: PatientCase): EncounterState {
  return {
    case: c,
    budgetRemaining: c.patient.budget,
    spent: 0,
    questionCount: 0,
    askedTopics: [],
    askedSymptoms: [],
    revealedSymptoms: [...c.chiefComplaintSymptoms],
    examsDone: [],
    ddx: [],
    log: [
      { kind: 'patient', text: c.greeting },
      { kind: 'patient', text: c.complaint },
    ],
    status: 'active',
  };
}

function checkActive(state: EncounterState): Check {
  return state.status === 'active' ? OK : { ok: false, reason: 'Konsultasi sudah selesai.' };
}

function assertOk(check: Check): void {
  if (!check.ok) throw new EncounterError(check.reason ?? 'Aksi tidak diizinkan.');
}

// ---------------------------------------------------------------------------
// Anamnesis bebas
// ---------------------------------------------------------------------------

export interface IntentAnswer {
  state: EncounterState;
  /** Potongan jawaban pasien, satu per intent. */
  parts: string[];
}

const uniq = (items: string[]) => [...new Set(items)];

/** Info tambahan dari pertanyaan dokter (mis. lama sakit yang disebut untuk dikonfirmasi). */
export interface QuestionHints {
  durationDays?: number;
}

/** Jawaban pasien terakhir (tanpa awalan "tadi saya bilang" agar tidak bertumpuk). */
function lastPatientAnswer(state: EncounterState, content: GameContent): string {
  for (let i = state.log.length - 1; i >= 0; i--) {
    const e = state.log[i]!;
    if (e.kind !== 'patient') continue;
    let text = e.text;
    for (const t of content.conversation.repeatAsked) {
      const prefix = fillTemplate(t, state.case.context);
      if (text.startsWith(prefix)) text = text.slice(prefix.length).trim();
    }
    return text;
  }
  return '';
}

/**
 * Terapkan satu atau beberapa intent ke state: tandai topik/gejala yang ditanyakan,
 * ungkap gejala, dan susun potongan jawaban pasien. Dipakai oleh jalur lokal (NLU)
 * maupun pasien AI (tool calls) agar keduanya mencatat hal yang sama.
 */
export function applyIntents(state: EncounterState, intents: readonly Intent[], content: GameContent, hints: QuestionHints = {}): IntentAnswer {
  const c = state.case;
  let askedTopics = [...state.askedTopics];
  let askedSymptoms = [...state.askedSymptoms];
  let revealed = [...state.revealedSymptoms];
  const parts: string[] = [];
  const salt = String(state.questionCount);
  let focus = state.focus;
  /** Gejala yang ADA & dibicarakan menjadi rujukan pertanyaan lanjutan berikutnya. */
  const setFocus = (symptom: string | undefined) => {
    focus = symptom && c.symptoms.includes(symptom) ? { symptom, turn: state.questionCount } : undefined;
  };
  /** "Sudah 3 hari?" → pasien membenarkan atau mengoreksi sebelum menjawab. */
  const withDuration = (text: string, actualDays: number) =>
    hints.durationDays === undefined ? text : `${durationReaction(c, hints.durationDays, actualDays, content, salt)} ${text}`;

  const answerTopic = (topic: string) => {
    const cat = content.anamnesisById.get(topic);
    if (!cat) return;
    const repeated = askedTopics.includes(topic);
    if (cat.type === 'chief') {
      parts.push(chiefComplaintReply(c, content));
    } else if (cat.type === 'dynamic') {
      const result = answerOtherComplaints(c, revealed, content);
      revealed = uniq([...revealed, ...result.revealed]);
      parts.push(result.text);
      // "Ada keluhan lain?" → "Batuk, Dok." → "Sejak kapan?" merujuk gejala yang baru disebut.
      if (result.revealed.length) setFocus(result.revealed.at(-1));
    } else {
      const answer = c.answers[topic];
      const base = answer?.text ?? 'Hmm, saya kurang tahu, Dok.';
      const told = repeated ? `${conversationReply('repeat', c, content, `${topic}:${salt}`)} ${base}` : base;
      // Tanggapan atas angka dokter didahulukan: "Bukan, Dok, sudah lebih lama. Seperti yang saya bilang tadi: …"
      parts.push(topic === 'onset' ? withDuration(told, c.day) : told);
      revealed = uniq([...revealed, ...(answer?.reveals ?? [])]);
    }
    askedTopics = uniq([...askedTopics, topic]);
  };

  for (const intent of intents) {
    switch (intent.kind) {
      case 'topic':
        // Rujukan gejala tetap disimpan; kedaluwarsanya diatur jarak giliran di interpretInContext.
        answerTopic(intent.topic);
        break;
      case 'symptom': {
        if (revealed.includes(intent.symptom)) {
          parts.push(conversationReply('alreadySaid', c, content, `${intent.symptom}:${salt}`));
        } else {
          const r = answerSymptomQuestion(c, intent.symptom, content);
          parts.push(r.text);
          if (r.revealed) revealed = uniq([...revealed, intent.symptom]);
        }
        askedSymptoms = uniq([...askedSymptoms, intent.symptom]);
        setFocus(intent.symptom);
        break;
      }
      case 'symptom_detail': {
        if (c.chiefComplaintSymptoms.includes(intent.symptom)) {
          answerTopic(intent.topic);
        } else {
          const r = answerSymptomDetail(c, intent.topic, intent.symptom, content);
          parts.push(intent.topic === 'onset' && r.revealed ? withDuration(r.text, symptomOnsetDays(c, intent.symptom)) : r.text);
          if (r.revealed) revealed = uniq([...revealed, intent.symptom]);
          askedSymptoms = uniq([...askedSymptoms, intent.symptom]);
        }
        setFocus(intent.symptom);
        break;
      }
      case 'review': {
        const group = content.reviewsById.get(intent.group);
        if (!group) break;
        const r = answerReview(c, intent.group, content);
        const repeatedAll = r.revealed.length > 0 && r.revealed.every((id) => revealed.includes(id));
        parts.push(repeatedAll ? `${conversationReply('repeat', c, content, `${intent.group}:${salt}`)} ${r.text}` : r.text);
        revealed = uniq([...revealed, ...r.revealed]);
        askedSymptoms = uniq([...askedSymptoms, ...group.symptoms]);
        setFocus(r.revealed[0]);
        break;
      }
      case 'repeat':
        parts.push(`${conversationReply('repeatAsked', c, content, salt)} ${lastPatientAnswer(state, content)}`.trim());
        break;
      case 'greeting':
      case 'thanks':
      case 'consent':
        parts.push(conversationReply(intent.kind, c, content, salt));
        break;
    }
  }
  const next: EncounterState = { ...state, askedTopics, askedSymptoms, revealedSymptoms: revealed };
  if (focus) next.focus = focus;
  else delete next.focus;
  return { state: next, parts };
}

/**
 * Tafsirkan pertanyaan dalam konteks percakapan. Pertanyaan lanjutan yang hanya berisi aspek
 * keluhan ("Sejak kapan?", "Seberapa berat?") dirujukkan ke gejala yang baru saja dibicarakan
 * — sama seperti percakapan sungguhan ("Ada batuk?" "Iya, Dok." "Sejak kapan?").
 */
export function interpretInContext(state: EncounterState, question: string, content: GameContent, config: GameConfig): Interpretation {
  const interp = interpretQuestion(question, content, config.anamnesis.maxIntentsPerQuestion);
  const focus = state.focus;
  if (!focus || interp.intents.length === 0) return interp;
  const gap = state.questionCount - focus.turn;
  const recent = gap <= 1 || (interp.deictic && gap <= 3);
  const onlyAspects = interp.intents.every((i) => i.kind === 'topic' && DETAIL_TOPICS.has(i.topic));
  // "Sakitnya/keluhannya sejak kapan?" merujuk keluhan utama, kecuali dokter menunjuk ("yang tadi").
  const mentionsChief = /\b(sakit|nyeri|keluhan)\b/.test(interp.normalized) && !interp.deictic;
  if (!recent || !onlyAspects || mentionsChief) return interp;
  const intents: Intent[] = interp.intents.map((i) => ({ kind: 'symptom_detail', topic: (i as { topic: string }).topic, symptom: focus.symptom }));
  return { ...interp, intents };
}

/** Catat satu pertukaran tanya-jawab di log percakapan. */
export function recordExchange(state: EncounterState, question: string, answer: string): EncounterState {
  const entries: LogEntry[] = [
    { kind: 'doctor', text: question },
    { kind: 'patient', text: answer },
  ];
  return { ...state, questionCount: state.questionCount + 1, log: [...state.log, ...entries] };
}

export interface QuestionResult {
  state: EncounterState;
  reply: string;
  intents: Intent[];
  /** Potongan jawaban per intent (urutan sama dengan `intents`). */
  parts: string[];
  understood: boolean;
}

/** Ajukan pertanyaan bebas (pemahaman bahasa lokal tanpa AI). */
export function askQuestion(state: EncounterState, question: string, content: GameContent, config: GameConfig): QuestionResult {
  assertOk(checkActive(state));
  const text = question.trim();
  if (!text) throw new EncounterError('Pertanyaan masih kosong.');
  const { intents, durationDays } = interpretInContext(state, text, content, config);
  if (intents.length === 0) {
    const reply = conversationReply('unknown', state.case, content, String(state.questionCount));
    return { state: recordExchange(state, text, reply), reply, intents, parts: [], understood: false };
  }
  const answered = applyIntents(state, intents, content, durationDays === undefined ? {} : { durationDays });
  const reply = answered.parts.join(' ');
  return { state: recordExchange(answered.state, text, reply), reply, intents, parts: answered.parts, understood: true };
}

/** Topik inti yang belum ditanyakan (untuk saran pertanyaan di UI). */
export function unaskedCoreTopics(state: EncounterState, content: GameContent): string[] {
  return content.anamnesis.filter((t) => t.core && !state.askedTopics.includes(t.id)).map((t) => t.id);
}

// ---------------------------------------------------------------------------
// Pemeriksaan (fisik gratis; penunjang memotong budget pasien)
// ---------------------------------------------------------------------------

export function canPerformExam(state: EncounterState, toolId: string, content: GameContent, config: GameConfig): Check {
  const active = checkActive(state);
  if (!active.ok) return active;
  if (!content.toolsById.has(toolId)) return { ok: false, reason: 'Alat tidak dikenal.' };
  if (state.examsDone.includes(toolId)) return { ok: false, reason: 'Sudah diperiksa.' };
  if (toolPrice(toolId, config) > state.budgetRemaining) return { ok: false, reason: 'Budget pasien tidak cukup.' };
  return OK;
}

export function performExam(
  state: EncounterState,
  toolId: string,
  content: GameContent,
  config: GameConfig,
): EncounterState {
  assertOk(canPerformExam(state, toolId, content, config));
  const cost = toolPrice(toolId, config);
  const entry: LogEntry = { kind: 'exam', toolId, cost };
  return {
    ...state,
    budgetRemaining: state.budgetRemaining - cost,
    spent: state.spent + cost,
    examsDone: [...state.examsDone, toolId],
    log: [...state.log, entry],
  };
}

/** true jika tidak ada lagi pemeriksaan BERBAYAR yang terjangkau budget. */
export function isBudgetExhausted(state: EncounterState, content: GameContent, config: GameConfig): boolean {
  return content.tools
    .filter((t) => toolPrice(t.id, config) > 0)
    .every((t) => state.examsDone.includes(t.id) || toolPrice(t.id, config) > state.budgetRemaining);
}

// ---------------------------------------------------------------------------
// Penalaran: papan diagnosis banding
// ---------------------------------------------------------------------------

/**
 * Tambah/ubah/hapus kondisi di papan diagnosis banding. Hanya satu kondisi
 * boleh berstatus "utama"; menandai yang baru sebagai utama menurunkan yang lama
 * menjadi "mungkin". status null = hapus dari papan.
 */
export function setDdx(state: EncounterState, conditionId: string, status: DdxStatus | null, content: GameContent): EncounterState {
  assertOk(checkActive(state));
  if (!content.catalogById.has(conditionId)) throw new EncounterError(`Kondisi tidak dikenal: ${conditionId}`);
  if (status === null) return { ...state, ddx: state.ddx.filter((d) => d.id !== conditionId) };
  const ddx = state.ddx.map((d) => (status === 'utama' && d.status === 'utama' && d.id !== conditionId ? { ...d, status: 'mungkin' as const } : d));
  const index = ddx.findIndex((d) => d.id === conditionId);
  if (index >= 0) ddx[index] = { id: conditionId, status };
  else ddx.push({ id: conditionId, status });
  return { ...state, ddx };
}

// ---------------------------------------------------------------------------
// Keputusan akhir
// ---------------------------------------------------------------------------

export function canSubmitDecision(state: EncounterState, decision: Partial<ClinicalDecision>, content: GameContent): Check {
  const active = checkActive(state);
  if (!active.ok) return active;
  if (!decision.primary) return { ok: false, reason: 'Tentukan diagnosis kerja (utama).' };
  if (!content.catalogById.has(decision.primary)) return { ok: false, reason: 'Diagnosis utama tidak dikenal.' };
  if (!decision.disposition) return { ok: false, reason: 'Pilih tata laksana/disposisi pasien.' };
  return OK;
}

export function submitDecision(
  state: EncounterState,
  decision: ClinicalDecision,
  content: GameContent,
  config: GameConfig,
): EncounterState {
  assertOk(canSubmitDecision(state, decision, content));
  const finalDecision: ClinicalDecision = {
    ...decision,
    secondary: uniq(decision.secondary.filter((id) => id !== decision.primary && content.catalogById.has(id))),
    complications: uniq(decision.complications),
  };
  const evaluation = evaluateEncounter(state, finalDecision, content, config);
  const name = content.catalogById.get(finalDecision.primary)!.name;
  // Penutup: dokter menjelaskan, pasien berpamitan (dipakai juga oleh adegan pasien keluar ruangan).
  const closing = conversationReply('closing', state.case, content, 'akhir');
  const farewell = conversationReply(finalDecision.disposition === 'rujuk_segera' ? 'farewellReferral' : 'farewell', state.case, content, 'akhir');
  return {
    ...state,
    status: 'finished',
    decision: finalDecision,
    evaluation,
    log: [
      ...state.log,
      { kind: 'system', text: `Diagnosis kerja: ${name}. ${closing}` },
      { kind: 'patient', text: farewell },
    ],
  };
}
