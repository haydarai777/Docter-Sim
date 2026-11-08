/**
 * Satu konsultasi (encounter): anamnesis, pemeriksaan berbayar, dan diagnosis.
 *
 * Semua fungsi murni: menerima state lama dan mengembalikan state BARU
 * (state lama tidak diubah). Aksi yang tidak sah melempar EncounterError;
 * UI sebaiknya memeriksa dulu dengan fungsi can*() untuk menampilkan alasannya.
 */
import { answerOtherComplaints, answerSymptomQuestion, doctorQuestion } from './dialogue';
import { evaluateDiagnosis, toolPrice } from './scoring';
import type { EncounterState, GameConfig, GameContent, LogEntry, PatientCase } from './types';

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
    questionsUsed: 0,
    askedCategories: [],
    askedSymptoms: [],
    revealedSymptoms: [...c.chiefComplaintSymptoms],
    examsDone: [],
    log: [
      { kind: 'patient', text: c.greeting },
      { kind: 'patient', text: c.complaint },
    ],
    status: 'active',
  };
}

// ---------------------------------------------------------------------------
// Anamnesis (gratis, dibatasi jumlah pertanyaan)
// ---------------------------------------------------------------------------

export function questionsLeft(state: EncounterState, config: GameConfig): number {
  return Math.max(0, config.anamnesis.maxQuestions - state.questionsUsed);
}

function checkActive(state: EncounterState): Check {
  return state.status === 'active' ? OK : { ok: false, reason: 'Konsultasi sudah selesai.' };
}

export function canAskCategory(state: EncounterState, categoryId: string, config: GameConfig): Check {
  const active = checkActive(state);
  if (!active.ok) return active;
  if (state.askedCategories.includes(categoryId)) return { ok: false, reason: 'Sudah ditanyakan.' };
  if (questionsLeft(state, config) <= 0) return { ok: false, reason: 'Jatah pertanyaan anamnesis habis.' };
  return OK;
}

export function canAskSymptom(state: EncounterState, symptomId: string, config: GameConfig): Check {
  const active = checkActive(state);
  if (!active.ok) return active;
  if (state.askedSymptoms.includes(symptomId)) return { ok: false, reason: 'Sudah ditanyakan.' };
  if (state.revealedSymptoms.includes(symptomId)) return { ok: false, reason: 'Pasien sudah menyebutkan gejala ini.' };
  if (questionsLeft(state, config) <= 0) return { ok: false, reason: 'Jatah pertanyaan anamnesis habis.' };
  return OK;
}

function assertOk(check: Check): void {
  if (!check.ok) throw new EncounterError(check.reason ?? 'Aksi tidak diizinkan.');
}

export function askCategory(
  state: EncounterState,
  categoryId: string,
  content: GameContent,
  config: GameConfig,
): EncounterState {
  assertOk(canAskCategory(state, categoryId, config));
  const category = content.anamnesisById.get(categoryId);
  if (!category) throw new EncounterError(`Kategori anamnesis tidak dikenal: ${categoryId}`);

  const question = doctorQuestion(category.question, state.case);
  let answer: string;
  let revealed: string[] = [];
  if (category.type === 'dynamic') {
    const result = answerOtherComplaints(state.case, state.revealedSymptoms, content);
    answer = result.text;
    revealed = result.revealed;
  } else {
    const result = state.case.answers[categoryId];
    answer = result?.text ?? 'Hmm, saya kurang tahu, Dok.';
    // Gejala yang ikut disebut di jawaban ini dianggap sudah diketahui dokter.
    revealed = (result?.reveals ?? []).filter((id) => !state.revealedSymptoms.includes(id));
  }

  return {
    ...state,
    questionsUsed: state.questionsUsed + 1,
    askedCategories: [...state.askedCategories, categoryId],
    revealedSymptoms: [...state.revealedSymptoms, ...revealed],
    log: [...state.log, { kind: 'doctor', text: question }, { kind: 'patient', text: answer }],
  };
}

export function askSymptom(
  state: EncounterState,
  symptomId: string,
  content: GameContent,
  config: GameConfig,
): EncounterState {
  assertOk(canAskSymptom(state, symptomId, config));
  const symptom = content.symptomsById.get(symptomId);
  if (!symptom) throw new EncounterError(`Gejala tidak dikenal: ${symptomId}`);
  const result = answerSymptomQuestion(state.case, symptomId, content);

  return {
    ...state,
    questionsUsed: state.questionsUsed + 1,
    askedSymptoms: [...state.askedSymptoms, symptomId],
    revealedSymptoms: result.revealed ? [...state.revealedSymptoms, symptomId] : state.revealedSymptoms,
    log: [...state.log, { kind: 'doctor', text: symptom.question }, { kind: 'patient', text: result.text }],
  };
}

// ---------------------------------------------------------------------------
// Pemeriksaan berbayar (memotong budget pasien)
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

/**
 * true jika tidak ada lagi pemeriksaan yang terjangkau budget.
 * Pada kondisi ini pemain wajib memutuskan diagnosis (anamnesis gratis tetap boleh).
 */
export function isBudgetExhausted(state: EncounterState, content: GameContent, config: GameConfig): boolean {
  return content.tools.every(
    (t) => state.examsDone.includes(t.id) || toolPrice(t.id, config) > state.budgetRemaining,
  );
}

// ---------------------------------------------------------------------------
// Diagnosis
// ---------------------------------------------------------------------------

export function submitDiagnosis(
  state: EncounterState,
  diseaseId: string,
  content: GameContent,
  config: GameConfig,
): EncounterState {
  assertOk(checkActive(state));
  const disease = content.diseasesById.get(diseaseId);
  if (!disease) throw new EncounterError(`Diagnosis tidak dikenal: ${diseaseId}`);
  const outcome = evaluateDiagnosis(state.case.diseaseId, diseaseId, state.spent, content, config);
  return {
    ...state,
    status: 'diagnosed',
    outcome,
    log: [...state.log, { kind: 'system', text: `Diagnosis Anda: ${disease.name}.` }],
  };
}
