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
  /** Rata-rata skor klinis terbaik dalam satu sesi (minimal 3 pasien). */
  bestAverageScore: number;
  runsPlayed: number;
}

const EMPTY_RECORDS: Records = { bestCorrect: 0, bestStreak: 0, bestPatients: 0, bestAverageScore: 0, runsPlayed: 0 };

export function loadRecords(): Records {
  return { ...EMPTY_RECORDS, ...readJson<Partial<Records>>('rekor', {}) };
}

/** Perbarui rekor dengan hasil satu sesi. Mengembalikan rekor baru + daftar rekor yang terpecahkan. */
export function updateRecords(result: { correct: number; bestStreak: number; patients: number; bestScore?: number }): {
  records: Records;
  broken: (keyof Records)[];
} {
  const old = loadRecords();
  const records: Records = {
    bestCorrect: Math.max(old.bestCorrect, result.correct),
    bestStreak: Math.max(old.bestStreak, result.bestStreak),
    bestPatients: Math.max(old.bestPatients, result.patients),
    bestAverageScore: Math.max(old.bestAverageScore, result.patients >= 3 ? Math.round(result.bestScore ?? 0) : 0),
    runsPlayed: old.runsPlayed + 1,
  };
  const broken: (keyof Records)[] = [];
  if (result.correct > old.bestCorrect) broken.push('bestCorrect');
  if (result.bestStreak > old.bestStreak) broken.push('bestStreak');
  if (records.bestAverageScore > old.bestAverageScore) broken.push('bestAverageScore');
  writeJson('rekor', records);
  return { records, broken };
}

// ---------------------------------------------------------------------------
// Pengaturan
// ---------------------------------------------------------------------------

export type ThemeSetting = 'system' | 'light' | 'dark';

export interface Settings {
  theme: ThemeSetting;
  /** false = mode latihan: tes diagnostik selalu akurat. */
  realisticTests: boolean;
  tutorialSeen: boolean;
  /** true = pasien diperankan Claude (bila tersedia); false = pemahaman bahasa lokal. */
  aiPatient: boolean;
}

const DEFAULT_SETTINGS: Settings = { theme: 'system', realisticTests: true, tutorialSeen: false, aiPatient: true };

export function loadSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...readJson<Partial<Settings>>('pengaturan', {}) };
}

export function saveSettings(settings: Settings): void {
  writeJson('pengaturan', settings);
}

/** Terapkan tema: 'system' mengikuti preferensi OS (via media query di CSS). */
export function applyTheme(theme: ThemeSetting): void {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}

// ---------------------------------------------------------------------------
// Simpan & lanjutkan sesi
// ---------------------------------------------------------------------------

const SESSION_VERSION = 2;

export interface SavedSession<TRun> {
  version: number;
  /** Sidik jari konten; sesi lama dibuang bila konten (penyakit/alat) berubah. */
  contentKey: string;
  savedAt: string;
  run: TRun;
}

export function saveSession<TRun>(run: TRun, contentKey: string): void {
  const data: SavedSession<TRun> = { version: SESSION_VERSION, contentKey, savedAt: new Date().toISOString(), run };
  writeJson('sesi', data);
}

export function loadSession<TRun>(contentKey: string): SavedSession<TRun> | null {
  const data = readJson<SavedSession<TRun> | null>('sesi', null);
  if (!data || data.version !== SESSION_VERSION || data.contentKey !== contentKey || !data.run) return null;
  return data;
}

export function clearSession(): void {
  removeKey('sesi');
}
