/**
 * Penyusun shift jaga IGD: latihan (satu pasien, waktu longgar, petunjuk dosis),
 * jaga (4 pasien bertahap), dan sibuk (7 pasien dengan kedatangan berdekatan,
 * perawat lebih sedikit, perburukan lebih cepat).
 */
import { createRng, deriveSeed } from '../rng';
import { DEFAULT_BEDS } from './catalog';
import type { EdCategory, EdScenario, ShiftConfig, ShiftMode } from './types';

export interface ShiftOptions {
  /** Latihan: skenario tertentu (kosong = acak). */
  scenarioId?: string | null;
  variant?: string | null;
  /** Saring kategori (kosong = semua). */
  categories?: readonly EdCategory[];
}

export const MODE_INFO: Record<ShiftMode, { label: string; desc: string }> = {
  latihan: { label: 'Latihan satu kasus', desc: 'Satu pasien, perburukan lebih lambat, petunjuk dosis & sediaan tampil. Cocok untuk mempelajari skenario tertentu.' },
  jaga: { label: 'Jaga malam', desc: '4 pasien datang bertahap dengan kegawatan berbeda, 3 perawat, 5 bed + 2 kursi observasi.' },
  sibuk: { label: 'Jaga sibuk', desc: '7 pasien, beberapa datang hampir bersamaan, hanya 2 perawat, perburukan lebih cepat. Uji kemampuan memprioritaskan.' },
};

export function buildShiftConfig(mode: ShiftMode, seed: number, scenarios: readonly EdScenario[], opts: ShiftOptions = {}): ShiftConfig {
  const rng = createRng(deriveSeed(seed, `shift-${mode}`));
  const pool = scenarios.filter((s) => !opts.categories?.length || opts.categories.includes(s.category));
  const usable = pool.length ? pool : [...scenarios];
  const base = { beds: [...DEFAULT_BEDS], startClock: 19 * 60 + rng.int(0, 50) };
  if (mode === 'latihan') {
    const sc = (opts.scenarioId && scenarios.find((s) => s.id === opts.scenarioId)) || rng.pick(usable);
    return {
      ...base,
      mode,
      nurses: 3,
      deterioration: 0.85,
      hints: true,
      arrivals: [{ scenarioId: sc.id, ...(opts.variant ? { variant: opts.variant } : {}), atMin: 0 }],
      durationMin: 150,
    };
  }
  const by = (lo: number, hi: number) => usable.filter((s) => s.ats >= lo && s.ats <= hi);
  const picked: EdScenario[] = [];
  const take = (cands: EdScenario[]) => {
    const fresh = cands.filter((c) => !picked.includes(c));
    const list = fresh.length ? fresh : usable.filter((c) => !picked.includes(c));
    if (!list.length) return;
    picked.push(rng.pick(list));
  };
  if (mode === 'jaga') {
    take(by(1, 1));
    take(by(2, 2));
    take(by(2, 3));
    take(by(3, 5));
    const order = rng.shuffle(picked);
    const times = [0, rng.int(6, 10), rng.int(16, 22), rng.int(28, 36)];
    return { ...base, mode, nurses: 3, deterioration: 1, hints: false, arrivals: order.map((s, i) => ({ scenarioId: s.id, atMin: times[i]! })), durationMin: 160 };
  }
  take(by(1, 1));
  take(by(1, 1));
  take(by(2, 2));
  take(by(2, 2));
  take(by(2, 3));
  take(by(3, 5));
  take(by(4, 5));
  const order = rng.shuffle(picked);
  const times = [0, rng.int(2, 4), rng.int(9, 12), rng.int(13, 16), rng.int(22, 26), rng.int(27, 30), rng.int(38, 45)];
  return { ...base, mode, nurses: 2, deterioration: 1.1, hints: false, arrivals: order.map((s, i) => ({ scenarioId: s.id, atMin: times[i]! })), durationMin: 190 };
}
