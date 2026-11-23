/**
 * Menjalankan rencana aksi terjadwal pada satu pasien (tes otomatis, audit skenario,
 * dan alat pengembang). Aksi dokter yang tertunda karena dokter sibuk dicoba ulang.
 */
import { DEFAULT_BEDS } from './catalog';
import { act, advance, createShift, type EdContext, vitalsOf } from './engine';
import type { EdPatient, EdShift, ExpertStep, ShiftConfig } from './types';

export interface PlanRun {
  shift: EdShift;
  patient: EdPatient;
  /** Aksi yang gagal (pesan). */
  failures: string[];
}

export function singleConfig(scenarioId: string, variant: string | undefined, minutes: number, deterioration = 1): ShiftConfig {
  return {
    mode: 'latihan',
    beds: [...DEFAULT_BEDS],
    nurses: 3,
    deterioration,
    hints: true,
    arrivals: [{ scenarioId, ...(variant ? { variant } : {}), atMin: 0 }],
    startClock: 19 * 60,
    durationMin: minutes,
  };
}

export function runPlan(ctx: EdContext, scenarioId: string, variant: string | undefined, plan: readonly ExpertStep[], minutes: number, seed = 1, deterioration = 1): PlanRun {
  const shift = createShift(singleConfig(scenarioId, variant, minutes + 30, deterioration), seed, ctx);
  advance(shift, 1, ctx);
  const patient = shift.patients[0]!;
  const failures: string[] = [];
  const steps = [...plan].sort((a, b) => a.atMin - b.atMin);
  for (const st of steps) {
    const t = st.atMin * 60 + 1;
    if (shift.time < t) advance(shift, t - shift.time, ctx);
    if (shift.status !== 'berjalan' || patient.status === 'keluar' || patient.status === 'meninggal') break;
    if (st.when && !st.when(patient, vitalsOf(patient, shift.time))) continue;
    const action = typeof st.action === 'function' ? st.action(patient) : st.action;
    let r = act(shift, patient.id, action, ctx);
    for (let i = 0; i < 60 && !r.ok && /sedang|tunggu|sibuk|akses IV|pad defibrilator|terintubasi/i.test(r.message); i++) {
      // Klinisi yang wajar mengulang tindakan prasyarat yang gagal (IV, intubasi).
      const pending = (proc: string) => shift.tasks.some((t) => t.patientId === patient.id && t.action.kind === 'proc' && t.action.id === proc);
      if (/akses IV/i.test(r.message) && !pending('iv')) act(shift, patient.id, { type: 'tindakan', proc: 'iv' }, ctx);
      if (/terintubasi/i.test(r.message) && !pending('intubasi')) act(shift, patient.id, { type: 'tindakan', proc: 'intubasi' }, ctx);
      advance(shift, 10, ctx);
      r = act(shift, patient.id, action, ctx);
    }
    if (!r.ok) failures.push(`${st.atMin} mnt ${action.type}: ${r.message}`);
  }
  const end = minutes * 60;
  while (shift.time < end && shift.status === 'berjalan' && patient.status !== 'keluar' && patient.status !== 'meninggal') advance(shift, Math.min(60, end - shift.time), ctx);
  return { shift, patient, failures };
}
