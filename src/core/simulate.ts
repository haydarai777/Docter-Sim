/**
 * Simulasi "bot pemain" untuk membantu balancing.
 *
 * Bot memainkan alur klinis lengkap memakai mesin permainan yang sama dengan
 * pemain: anamnesis (lewat intent), pemeriksaan fisik & penunjang (memotong
 * budget), papan diagnosis banding, lalu keputusan akhir. Tingkat kemampuan
 * `skill` (0..1) menentukan peluang bot melakukan tiap langkah yang benar;
 * `accuracy` menentukan peluang diagnosis utamanya tepat.
 */
import { applyIntents, canPerformExam, performExam, setDdx } from './encounter';
import { caseContext, caseSecondaryProblems, expectedDisposition, hasEvidence } from './evaluation';
import { matchesCondition } from './conditions';
import { createRng, type Rng } from './rng';
import { createRun, finishCurrent, startNextPatient } from './run';
import type { ClinicalDecision, EncounterState, GameConfig, GameContent } from './types';
import { DISPOSITIONS } from './types';

export interface BotOptions {
  /** Ketelitian proses klinis 0..1. */
  skill: number;
  /** Peluang diagnosis utama benar (default = skill). */
  accuracy?: number;
}

/** Bot memainkan satu konsultasi sampai siap memutuskan. */
export function playEncounterBot(
  start: EncounterState,
  options: BotOptions,
  rng: Rng,
  content: GameContent,
  config: GameConfig,
): { state: EncounterState; decision: ClinicalDecision } {
  const skill = options.skill;
  const accuracy = options.accuracy ?? skill;
  const c = start.case;
  const disease = content.diseasesById.get(c.diseaseId)!;
  const ctx = caseContext(start);
  let state = start;

  // --- Anamnesis -------------------------------------------------------------
  for (const topic of content.anamnesis) {
    if (topic.core && rng.chance(skill)) state = applyIntents(state, [{ kind: 'topic', topic: topic.id }], content).state;
  }
  if (rng.chance(skill)) state = applyIntents(state, [{ kind: 'topic', topic: 'keluhan_lain' }], content).state;
  for (const s of new Set([...(disease.clueSymptoms ?? []), ...c.hiddenSymptoms])) {
    if (rng.chance(skill * 0.8)) state = applyIntents(state, [{ kind: 'symptom', symptom: s }], content).state;
  }

  // --- Pemeriksaan -------------------------------------------------------------
  const tryExam = (tool: string) => {
    if (canPerformExam(state, tool, content, config).ok) state = performExam(state, tool, content, config);
  };
  if (rng.chance(Math.min(1, skill + 0.3))) tryExam('tanda_vital');
  for (const it of disease.plan.exams) if (matchesCondition(it.when, ctx) && rng.chance(skill)) tryExam(it.tool);
  const tests = [...disease.plan.tests].sort((a, b) => (a.role === 'kunci' ? -1 : 0) - (b.role === 'kunci' ? -1 : 0));
  for (const it of tests) if (matchesCondition(it.when, ctx) && rng.chance(skill)) tryExam(it.tool);
  // Bot kurang terampil kadang memesan pemeriksaan acak.
  const paid = content.tools.filter((t) => t.category !== 'fisik');
  for (let i = 0; i < 3; i++) if (rng.chance((1 - skill) * 0.3)) tryExam(rng.pick(paid).id);

  // --- Diagnosis banding ----------------------------------------------------------
  const correct = rng.chance(accuracy);
  const wrongPool = disease.differentials.map((d) => d.id).filter((id) => content.catalogById.has(id));
  const primary = correct || wrongPool.length === 0 ? disease.id : rng.pick(wrongPool);
  for (const diff of disease.differentials) {
    if (diff.id === primary || !rng.chance(skill)) continue;
    const exclude = hasEvidence(diff.excludeBy, state) && rng.chance(skill);
    state = setDdx(state, diff.id, exclude ? 'disingkirkan' : 'mungkin', content);
  }
  if (primary !== disease.id && rng.chance(skill)) state = setDdx(state, disease.id, 'mungkin', content);
  state = setDdx(state, primary, 'utama', content);

  // --- Keputusan -------------------------------------------------------------
  const secondary = caseSecondaryProblems(state, disease, content)
    .filter((p) => hasEvidence(p.detectBy, state) && rng.chance(skill))
    .map((p) => p.id);
  const complications = primary === disease.id ? c.complications.filter(() => rng.chance(skill)) : [];
  const expected = expectedDisposition(disease, ctx).value;
  const disposition = rng.chance(skill) ? expected : rng.pick(DISPOSITIONS);
  return { state, decision: { primary, secondary, complications, disposition } };
}

export interface SimulationResult {
  skill: number;
  accuracy: number;
  runs: number;
  /** Persentase sesi yang berakhir game over sebelum maxPatients. */
  gameOverRate: number;
  /** Median jumlah pasien sampai game over (null jika tidak ada yang game over). */
  medianPatientsToGameOver: number | null;
  /** Rata-rata reputasi akhir. */
  averageFinalReputation: number;
  /** Rata-rata skor klinis per pasien. */
  averageScore: number;
}

export function simulateBot(
  content: GameContent,
  config: GameConfig,
  options: BotOptions & { runs: number; maxPatients: number; seed: number },
): SimulationResult {
  const rng = createRng(options.seed);
  const deaths: number[] = [];
  let reputationSum = 0;
  let scoreSum = 0;
  let scoreCount = 0;
  for (let r = 0; r < options.runs; r++) {
    let run = createRun(rng.int(0, 0x7fffffff), config);
    let patients = 0;
    while (run.status === 'playing' && patients < options.maxPatients) {
      run = startNextPatient(run, content, config);
      const played = playEncounterBot(run.encounter!, options, rng.fork(`bot:${r}:${patients}`), content, config);
      run = finishCurrent({ ...run, encounter: played.state }, played.decision, content, config);
      scoreSum += run.history.at(-1)!.score;
      scoreCount++;
      patients++;
    }
    if (run.status === 'game_over') deaths.push(patients);
    reputationSum += run.reputation;
  }
  deaths.sort((a, b) => a - b);
  return {
    skill: options.skill,
    accuracy: options.accuracy ?? options.skill,
    runs: options.runs,
    gameOverRate: deaths.length / options.runs,
    medianPatientsToGameOver: deaths.length ? deaths[Math.floor(deaths.length / 2)]! : null,
    averageFinalReputation: reputationSum / options.runs,
    averageScore: scoreCount ? scoreSum / scoreCount : 0,
  };
}
