/**
 * Penyimpanan lokal (localStorage) yang aman: semua akses dibungkus try/catch
 * karena localStorage bisa tidak tersedia (mode privat, pengaturan browser).
 * Game tetap berjalan normal tanpa penyimpanan.
 */

const PREFIX = 'meja-praktek:';

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Abaikan: penyimpanan tidak tersedia.
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    // Abaikan.
  }
}

/** Rekor terbaik antar-sesi. */
export interface Records {
  bestCorrect: number;
  bestStreak: number;
  bestPatients: number;
  runsPlayed: number;
}

const EMPTY_RECORDS: Records = { bestCorrect: 0, bestStreak: 0, bestPatients: 0, runsPlayed: 0 };

export function loadRecords(): Records {
  return { ...EMPTY_RECORDS, ...readJson<Partial<Records>>('rekor', {}) };
}

/** Perbarui rekor dengan hasil satu sesi. Mengembalikan rekor baru + daftar rekor yang terpecahkan. */
export function updateRecords(result: { correct: number; bestStreak: number; patients: number }): {
  records: Records;
  broken: (keyof Records)[];
} {
  const old = loadRecords();
  const records: Records = {
    bestCorrect: Math.max(old.bestCorrect, result.correct),
    bestStreak: Math.max(old.bestStreak, result.bestStreak),
    bestPatients: Math.max(old.bestPatients, result.patients),
    runsPlayed: old.runsPlayed + 1,
  };
  const broken: (keyof Records)[] = [];
  if (result.correct > old.bestCorrect) broken.push('bestCorrect');
  if (result.bestStreak > old.bestStreak) broken.push('bestStreak');
  writeJson('rekor', records);
  return { records, broken };
}
