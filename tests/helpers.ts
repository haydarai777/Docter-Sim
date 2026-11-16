import type { GameConfig } from '../src/core/types';
import { GAME_CONFIG, loadDefaultContent } from '../src/data';

export const content = loadDefaultContent();
export const config = GAME_CONFIG;

/** Salinan config dengan sebagian nilai diganti (untuk tes). */
export function configWith(patch: {
  [K in keyof GameConfig]?: Partial<GameConfig[K]>;
}): GameConfig {
  const copy = structuredClone(GAME_CONFIG);
  for (const [key, value] of Object.entries(patch)) {
    Object.assign((copy as unknown as Record<string, object>)[key]!, value);
  }
  return copy;
}

export const DISEASE_IDS = content.diseases.map((d) => d.id);

/**
 * Jumlah kasus per penyakit untuk tes "banyak kasus": total dijaga setara dengan saat konten
 * berisi 13 penyakit agar waktu tes tidak membengkak saat penyakit bertambah (minimal `min`).
 */
export function perDisease(n: number, min = 6): number {
  return Math.max(min, Math.round((n * 13) / DISEASE_IDS.length));
}
