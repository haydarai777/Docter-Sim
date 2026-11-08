/**
 * Pengacak (RNG) deterministik ber-seed.
 *
 * Kenapa tidak memakai Math.random()?
 *  - Tes bisa deterministik (seed sama → kasus sama).
 *  - Kasus yang aneh bisa direproduksi dari "kode kasus" (seed).
 *
 * Algoritma: mulberry32 (cepat, kualitas cukup untuk game).
 * `fork(label)` membuat RNG turunan yang independen, sehingga menambah
 * alat baru tidak mengubah hasil alat lain untuk seed yang sama.
 */

export interface Rng {
  readonly seed: number;
  /** Bilangan acak [0, 1). */
  next(): number;
  /** Bilangan bulat acak [min, max] inklusif. */
  int(min: number, max: number): number;
  /** Bilangan real acak [min, max]. */
  float(min: number, max: number): number;
  /** true dengan peluang p. */
  chance(p: number): boolean;
  /** Pilih satu elemen secara seragam. Melempar error jika array kosong. */
  pick<T>(items: readonly T[]): T;
  /** Pilih satu elemen sesuai bobot. Melempar error jika semua bobot 0. */
  weighted<T>(items: readonly T[], weightOf: (item: T) => number): T;
  /** Salinan array yang diacak (Fisher–Yates). */
  shuffle<T>(items: readonly T[]): T[];
  /** RNG turunan yang independen, ditentukan oleh seed induk + label. */
  fork(label: string): Rng;
}

/** Hash string → bilangan 32-bit (FNV-1a). */
export function hashString(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Turunkan seed baru dari seed induk dan label. */
export function deriveSeed(seed: number, label: string): number {
  return hashString(`${seed >>> 0}:${label}`);
}

/** Seed acak untuk sesi baru (satu-satunya tempat yang non-deterministik). */
export function randomSeed(): number {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    return crypto.getRandomValues(new Uint32Array(1))[0]!;
  }
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

export function createRng(seed: number): Rng {
  const baseSeed = seed >>> 0;
  let state = baseSeed;

  const next = (): number => {
    // mulberry32
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const rng: Rng = {
    seed: baseSeed,
    next,
    int(min, max) {
      if (max < min) throw new Error(`rng.int: max (${max}) < min (${min})`);
      return min + Math.floor(next() * (max - min + 1));
    },
    float(min, max) {
      if (max < min) throw new Error(`rng.float: max (${max}) < min (${min})`);
      return min + next() * (max - min);
    },
    chance(p) {
      if (p <= 0) return false;
      if (p >= 1) return true;
      return next() < p;
    },
    pick(items) {
      if (items.length === 0) throw new Error('rng.pick: array kosong');
      return items[Math.floor(next() * items.length)]!;
    },
    weighted(items, weightOf) {
      let total = 0;
      for (const item of items) total += Math.max(0, weightOf(item));
      if (total <= 0) throw new Error('rng.weighted: total bobot 0');
      let roll = next() * total;
      for (const item of items) {
        roll -= Math.max(0, weightOf(item));
        if (roll < 0) return item;
      }
      // Fallback karena pembulatan floating point: elemen terakhir berbobot > 0.
      for (let i = items.length - 1; i >= 0; i--) {
        if (weightOf(items[i]!) > 0) return items[i]!;
      }
      throw new Error('rng.weighted: tidak ada elemen terpilih');
    },
    shuffle(items) {
      const copy = items.slice();
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j]!, copy[i]!];
      }
      return copy;
    },
    fork(label) {
      return createRng(deriveSeed(baseSeed, label));
    },
  };
  return rng;
}
