/**
 * Penilaian diagnosis dan perhitungan reputasi.
 * Semua angka berasal dari config.reputation (src/data/config.ts).
 */
import type { DiagnosisOutcome, DiseaseTemplate, GameConfig, GameContent } from './types';

/** Harga satu alat menurut config (0 jika tidak ada). */
export function toolPrice(toolId: string, config: GameConfig): number {
  return config.toolPrices[toolId] ?? 0;
}

/** Total biaya pemeriksaan ideal untuk suatu penyakit. */
export function idealWorkupCost(disease: DiseaseTemplate, config: GameConfig): number {
  return disease.idealWorkup.reduce((sum, id) => sum + toolPrice(id, config), 0);
}

/**
 * Bonus hemat (bilangan bulat 0..efficiencyBonusMax).
 *  - Penuh jika biaya <= biaya ideal.
 *  - Turun linear sampai 0 pada biaya = efficiencyZeroAtMultiplier × biaya ideal.
 * Dibandingkan dengan biaya ideal (bukan sisa budget) agar adil untuk pasien miskin & kaya.
 */
export function efficiencyBonus(spent: number, idealCost: number, config: GameConfig): number {
  const { efficiencyBonusMax: max, efficiencyZeroAtMultiplier: zeroAt } = config.reputation;
  if (idealCost <= 0) return spent <= 0 ? max : 0;
  if (spent <= idealCost) return max;
  const zeroCost = idealCost * zeroAt;
  if (spent >= zeroCost) return 0;
  return Math.round((max * (zeroCost - spent)) / (zeroCost - idealCost));
}

/** Penalti diagnosis salah, berdasarkan tingkat bahaya penyakit yang TERLEWAT. */
export function wrongPenalty(missed: DiseaseTemplate, config: GameConfig): number {
  return Math.round(config.reputation.wrongBase * config.reputation.dangerMultiplier[missed.danger]);
}

export function evaluateDiagnosis(
  trueId: string,
  chosenId: string,
  spent: number,
  content: GameContent,
  config: GameConfig,
): DiagnosisOutcome {
  const disease = content.diseasesById.get(trueId);
  if (!disease) throw new Error(`Penyakit tidak dikenal: ${trueId}`);
  if (!content.diseasesById.has(chosenId)) throw new Error(`Diagnosis tidak dikenal: ${chosenId}`);

  const idealCost = idealWorkupCost(disease, config);
  const correct = trueId === chosenId;
  const dangerMultiplier = config.reputation.dangerMultiplier[disease.danger];

  if (correct) {
    const base = config.reputation.correctBase;
    const bonus = efficiencyBonus(spent, idealCost, config);
    return {
      chosenId,
      trueId,
      correct,
      spent,
      idealCost,
      reputationDelta: base + bonus,
      breakdown: { base, efficiencyBonus: bonus, penalty: 0, dangerMultiplier },
    };
  }
  const penalty = wrongPenalty(disease, config);
  return {
    chosenId,
    trueId,
    correct,
    spent,
    idealCost,
    reputationDelta: -penalty,
    breakdown: { base: 0, efficiencyBonus: 0, penalty, dangerMultiplier },
  };
}

/** Terapkan perubahan reputasi dengan batas min/max. */
export function applyReputation(current: number, delta: number, config: GameConfig): number {
  const { min, max } = config.reputation;
  return Math.min(max, Math.max(min, current + delta));
}

export function isGameOver(reputation: number, config: GameConfig): boolean {
  return reputation < config.reputation.gameOverBelow;
}
