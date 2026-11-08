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
