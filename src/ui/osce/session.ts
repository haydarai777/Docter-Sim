/**
 * Sesi latihan OSCE: rangkaian stasiun (klinis/prosedur), batas waktu, pekerjaan pemain, dan hasil.
 * Murni data (tanpa DOM) agar mudah diuji.
 */
import type { OsceContent } from '../../core/osce/content';
import type { OsceResult, OsceWork, PrescriptionLine, ProcedureAttempt, ProcedureResult, Schedule } from '../../core/osce/types';
import { createRng, deriveSeed } from '../../core/rng';
import type { EvaluationResult, GameContent } from '../../core/types';

export type StationSpec = { kind: 'klinis'; diseaseId: string; seed: number } | { kind: 'prosedur'; procedureId: string; seed: number };

export interface OsceSetup {
  type: 'klinis' | 'prosedur' | 'campuran';
  /** Kelompok stasiun klinis ('semua' atau label stasiun, mis. "Penyakit Dalam — demam akut"). */
  cluster: string;
  /** Prosedur tertentu ('acak' = acak). */
  procedureId: string;
  count: number;
  /** Menit per stasiun; null = tanpa batas waktu. */
  minutes: number | null;
}

export const DEFAULT_SETUP: OsceSetup = { type: 'klinis', cluster: 'semua', procedureId: 'acak', count: 1, minutes: 15 };

export type StationOutcome =
  | { kind: 'klinis'; spec: StationSpec; result: OsceResult; clinical: EvaluationResult; work: OsceWork; patientName: string }
  | { kind: 'prosedur'; spec: StationSpec; result: ProcedureResult; attempt: ProcedureAttempt };

/** Draf baris resep di formulir "tambah obat". */
export interface DraftLine {
  query: string;
  drug: string | null;
  form: string | null;
  units: number;
  schedule: Schedule;
  timesPerDay: number;
  days: number;
  timing: PrescriptionLine['timing'];
  /** Jumlah diubah manual (null = ikut hitungan otomatis). */
  quantity: number | null;
}

export const EMPTY_DRAFT: DraftLine = { query: '', drug: null, form: null, units: 1, schedule: 'rutin', timesPerDay: 3, days: 5, timing: '', quantity: null };

export interface OsceSession {
  setup: OsceSetup;
  stations: StationSpec[];
  index: number;
  outcomes: StationOutcome[];
  work: OsceWork;
  draft: DraftLine;
  /** Waktu mulai stasiun berjalan (ms epoch); null = belum mulai (lembar tugas masih dibaca). */
  startedAt: number | null;
  timeUp: boolean;
  /** Stasiun prosedur. */
  procedure: { attempt: ProcedureAttempt; phase: 'urutan' | 'pertanyaan' };
}

/** Daftar kelompok stasiun klinis yang tersedia. */
export function clusters(osce: OsceContent): string[] {
  return [...new Set(osce.cases.map((c) => c.station))];
}

function shuffled<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  const rng = createRng(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Susun rangkaian stasiun sesuai pengaturan (tanpa pengulangan sampai semua pernah muncul). */
export function planStations(setup: OsceSetup, content: GameContent, osce: OsceContent, seed: number): StationSpec[] {
  const diseases = osce.cases.filter((c) => content.diseasesById.has(c.disease) && (setup.cluster === 'semua' || c.station === setup.cluster)).map((c) => c.disease);
  const procedures = setup.procedureId !== 'acak' && osce.proceduresById.has(setup.procedureId) ? [setup.procedureId] : osce.procedures.map((p) => p.id);
  const count = Math.max(1, Math.min(16, Math.round(setup.count)));
  const dq = diseases.length ? shuffled(diseases, deriveSeed(seed, 'penyakit')) : [];
  const pq = procedures.length ? shuffled(procedures, deriveSeed(seed, 'prosedur')) : [];
  const out: StationSpec[] = [];
  for (let i = 0; i < count; i++) {
    const wantProcedure = setup.type === 'prosedur' || (setup.type === 'campuran' && i % 2 === 1) || dq.length === 0;
    const stationSeed = deriveSeed(seed, `stasiun:${i}`);
    if (wantProcedure && pq.length) out.push({ kind: 'prosedur', procedureId: pq[i % pq.length]!, seed: stationSeed });
    else if (dq.length) out.push({ kind: 'klinis', diseaseId: dq[i % dq.length]!, seed: stationSeed });
  }
  return out;
}

export function emptyWork(): OsceWork {
  return { prescription: [], nonPharm: [], education: [], abnormalMarks: [] };
}

export function newSession(setup: OsceSetup, stations: StationSpec[]): OsceSession {
  return {
    setup,
    stations,
    index: 0,
    outcomes: [],
    work: emptyWork(),
    draft: { ...EMPTY_DRAFT },
    startedAt: null,
    timeUp: false,
    procedure: { attempt: { sequence: [], answers: {} }, phase: 'urutan' },
  };
}

/** Sisa detik stasiun (null bila tanpa batas waktu atau belum mulai). */
export function secondsLeft(s: OsceSession, now: number): number | null {
  if (s.setup.minutes === null || s.startedAt === null) return null;
  return Math.max(0, Math.round(s.setup.minutes * 60 - (now - s.startedAt) / 1000));
}

export function secondsUsed(s: OsceSession, now: number): number | null {
  if (s.startedAt === null) return null;
  const used = Math.round((now - s.startedAt) / 1000);
  return s.setup.minutes === null ? used : Math.min(used, s.setup.minutes * 60);
}

export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/** Rekap rangkaian: rata-rata persen dan jumlah lulus. */
export function sessionSummary(outcomes: readonly StationOutcome[]): { average: number; passed: number; superior: number; total: number } {
  const total = outcomes.length;
  const percents = outcomes.map((o) => o.result.percent);
  const average = total ? Math.round((percents.reduce((a, b) => a + b, 0) / total) * 10) / 10 : 0;
  const passed = outcomes.filter((o) => o.result.category !== 'tidak_lulus').length;
  const superior = outcomes.filter((o) => o.result.category === 'superior').length;
  return { average, passed, superior, total };
}
