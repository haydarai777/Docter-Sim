/**
 * Simulasi "bot pemain" untuk membantu balancing.
 *
 * Bot tidak benar-benar bernalar: ia menebak diagnosis yang benar dengan
 * peluang `accuracy`, selain itu memilih penyakit lain secara acak. Tujuannya
 * mengukur seberapa pemaaf sistem reputasi pada berbagai tingkat kemampuan.
 * Bot tidak membeli pemeriksaan (bonus hemat selalu penuh), jadi hasil ini
 * sedikit lebih mudah daripada permainan sungguhan.
 */
import { createRng } from './rng';
import { createRun, diagnoseCurrent, startNextPatient } from './run';
import type { GameConfig, GameContent } from './types';

export interface SimulationResult {
  accuracy: number;
  runs: number;
  /** Persentase sesi yang berakhir game over sebelum maxPatients. */
  gameOverRate: number;
  /** Median jumlah pasien sampai game over (null jika tidak ada yang game over). */
  medianPatientsToGameOver: number | null;
  /** Rata-rata reputasi akhir. */
  averageFinalReputation: number;
}

export function simulateBot(
  content: GameContent,
  config: GameConfig,
  options: { accuracy: number; runs: number; maxPatients: number; seed: number },
): SimulationResult {
  const rng = createRng(options.seed);
  const deaths: number[] = [];
  let reputationSum = 0;
  for (let r = 0; r < options.runs; r++) {
    let run = createRun(rng.int(0, 0x7fffffff), config);
    let patients = 0;
    while (run.status === 'playing' && patients < options.maxPatients) {
      run = startNextPatient(run, content, config);
      const trueId = run.encounter!.case.diseaseId;
      const choice = rng.chance(options.accuracy)
        ? trueId
        : rng.pick(content.diseases.filter((d) => d.id !== trueId)).id;
      run = diagnoseCurrent(run, choice, content, config);
      patients++;
    }
    if (run.status === 'game_over') deaths.push(patients);
    reputationSum += run.reputation;
  }
  deaths.sort((a, b) => a - b);
  return {
    accuracy: options.accuracy,
    runs: options.runs,
    gameOverRate: deaths.length / options.runs,
    medianPatientsToGameOver: deaths.length ? deaths[Math.floor(deaths.length / 2)]! : null,
    averageFinalReputation: reputationSum / options.runs,
  };
}
