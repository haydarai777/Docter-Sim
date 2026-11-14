/**
 * Harga alat dan perhitungan reputasi.
 * Penilaian proses klinis ada di evaluation.ts; semua angka dari src/data/config.ts.
 */
import type { CatalogEntry, DiseaseTemplate, GameConfig } from './types';

/** Harga satu alat menurut config (0 jika tidak ada). */
export function toolPrice(toolId: string, config: GameConfig): number {
  return config.toolPrices[toolId] ?? 0;
}

/** Penalti diagnosis salah, berdasarkan tingkat bahaya penyakit yang TERLEWAT. */
export function wrongPenalty(missed: Pick<DiseaseTemplate | CatalogEntry, 'danger'>, config: GameConfig): number {
  return Math.round(config.reputation.wrongBase * config.reputation.dangerMultiplier[missed.danger]);
}

/** Terapkan perubahan reputasi dengan batas min/max. */
export function applyReputation(current: number, delta: number, config: GameConfig): number {
  const { min, max } = config.reputation;
  return Math.min(max, Math.max(min, current + delta));
}

export function isGameOver(reputation: number, config: GameConfig): boolean {
  return reputation < config.reputation.gameOverBelow;
}

/** Gelar dokter untuk nilai reputasi tertentu (dari config.reputation.titles). */
export function reputationTitle(reputation: number, config: GameConfig): string {
  const sorted = [...config.reputation.titles].sort((a, b) => b.min - a.min);
  return (sorted.find((t) => reputation >= t.min) ?? sorted[sorted.length - 1])?.label ?? '';
}

/**
 * Perkiraan biaya pemeriksaan penunjang sesuai rencana kasus (untuk laporan balancing).
 * Item dengan group yang sama dihitung sekali (yang termurah). Item bersyarat (when) diabaikan.
 */
export function planTestCost(
  disease: Pick<DiseaseTemplate, 'plan'>,
  config: GameConfig,
  roles: readonly ('kunci' | 'pendukung' | 'komplikasi')[] = ['kunci'],
): number {
  const groups = new Map<string, number>();
  for (const item of disease.plan.tests) {
    if (item.when || !roles.includes(item.role)) continue;
    const key = item.group ?? `alat:${item.tool}`;
    const price = toolPrice(item.tool, config);
    groups.set(key, Math.min(groups.get(key) ?? Infinity, price));
  }
  return [...groups.values()].reduce((a, b) => a + b, 0);
}
