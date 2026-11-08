/**
 * Sesi permainan: antrean pasien, reputasi, riwayat, dan game over.
 */
import { startEncounter, submitDiagnosis } from './encounter';
import { generateCase } from './generator';
import { createRng, deriveSeed } from './rng';
import { applyReputation, isGameOver } from './scoring';
import type { EncounterState, GameConfig, GameContent, PatientRecord, RunState } from './types';

export function createRun(runSeed: number, config: GameConfig): RunState {
  return {
    runSeed: runSeed >>> 0,
    patientIndex: 0,
    reputation: config.reputation.initial,
    history: [],
    encounter: null,
    status: 'playing',
  };
}

/** Seed pasien ke-n dalam sesi (deterministik dari seed sesi). */
export function patientSeed(run: RunState, index: number): number {
  return deriveSeed(run.runSeed, `pasien:${index}`);
}

/** Pilih penyakit pasien berikutnya (berbobot prevalensi, hindari pengulangan langsung). */
export function chooseNextDisease(run: RunState, content: GameContent, config: GameConfig): string {
  const rng = createRng(deriveSeed(run.runSeed, `penyakit:${run.patientIndex}`));
  const last = run.history[run.history.length - 1]?.diseaseId;
  let pool = content.diseases;
  if (config.queue.avoidImmediateRepeat && last && pool.length > 1) {
    pool = pool.filter((d) => d.id !== last);
  }
  return rng.weighted(pool, (d) => d.prevalenceWeight).id;
}

/** Panggil pasien berikutnya. */
export function startNextPatient(run: RunState, content: GameContent, config: GameConfig): RunState {
  if (run.status !== 'playing') throw new Error('Permainan sudah berakhir.');
  if (run.encounter && run.encounter.status === 'active') throw new Error('Masih ada pasien yang sedang diperiksa.');
  const diseaseId = chooseNextDisease(run, content, config);
  const c = generateCase(content, config, { diseaseId, seed: patientSeed(run, run.patientIndex) });
  return { ...run, patientIndex: run.patientIndex + 1, encounter: startEncounter(c) };
}

/** Ganti state konsultasi saat ini (setelah tanya/periksa). */
export function updateEncounter(run: RunState, encounter: EncounterState): RunState {
  return { ...run, encounter };
}

/** Kirim diagnosis untuk pasien saat ini; perbarui reputasi, riwayat, dan status game over. */
export function diagnoseCurrent(run: RunState, diseaseId: string, content: GameContent, config: GameConfig): RunState {
  if (!run.encounter) throw new Error('Tidak ada pasien.');
  const encounter = submitDiagnosis(run.encounter, diseaseId, content, config);
  const outcome = encounter.outcome!;
  const reputation = applyReputation(run.reputation, outcome.reputationDelta, config);
  const record: PatientRecord = {
    index: run.patientIndex - 1,
    seed: encounter.case.seed,
    diseaseId: outcome.trueId,
    chosenId: outcome.chosenId,
    correct: outcome.correct,
    spent: outcome.spent,
    budget: encounter.case.patient.budget,
    reputationDelta: reputation - run.reputation,
    reputationAfter: reputation,
    patientName: encounter.case.patient.name,
  };
  return {
    ...run,
    reputation,
    encounter,
    history: [...run.history, record],
    status: isGameOver(reputation, config) ? 'game_over' : 'playing',
  };
}

export interface RunStats {
  patientsSeen: number;
  correct: number;
  accuracy: number;
  totalSpent: number;
  /** Penyakit berbahaya (tinggi/kritis) yang terlewat. */
  dangerousMisses: number;
  bestStreak: number;
}

export function runStats(run: RunState, content: GameContent): RunStats {
  let best = 0;
  let current = 0;
  let dangerousMisses = 0;
  for (const r of run.history) {
    if (r.correct) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 0;
      const danger = content.diseasesById.get(r.diseaseId)?.danger;
      if (danger === 'tinggi' || danger === 'kritis') dangerousMisses++;
    }
  }
  const correct = run.history.filter((r) => r.correct).length;
  return {
    patientsSeen: run.history.length,
    correct,
    accuracy: run.history.length ? correct / run.history.length : 0,
    totalSpent: run.history.reduce((s, r) => s + r.spent, 0),
    dangerousMisses,
    bestStreak: best,
  };
}
