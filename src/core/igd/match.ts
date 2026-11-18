/**
 * Pencocokan aksi pemain dengan kriteria (tindakan kritis, kejadian terjadwal, aturan bahaya).
 */
import type { ActionMatch, ActionRecord, EdPatient } from './types';

/** Apakah satu catatan aksi memenuhi kriteria non-kumulatif. */
export function recordMatches(m: ActionMatch, r: ActionRecord, patient: EdPatient): boolean {
  switch (m.kind) {
    case 'exam':
      return r.type === 'exam' && r.id === m.id;
    case 'test':
      return r.type === 'test' && r.id === m.id;
    case 'proc':
      return r.type === 'proc' && r.id === m.id && (m.param === undefined || r.param === m.param);
    case 'drug': {
      if (r.type !== 'drug' || r.id !== m.id) return false;
      if (m.routes && (!r.route || !m.routes.includes(r.route))) return false;
      const dose = r.dose ?? 0;
      if (m.dose && (dose < m.dose[0] - 1e-9 || dose > m.dose[1] + 1e-9)) return false;
      if (m.perKg) {
        const perKg = dose / patient.weightKg;
        if (perKg < m.perKg[0] * 0.9 || perKg > m.perKg[1] * 1.1) return false;
      }
      return true;
    }
    case 'oxygen':
      return (r.type === 'oxygen' && (r.fio2 ?? 0) >= (m.minFio2 ?? 0.3)) || (r.type === 'proc' && (r.id === 'bvm' || r.id === 'intubasi'));
    case 'fluid':
      return r.type === 'fluid' && (!m.ids || (!!r.fluid && m.ids.includes(r.fluid)));
    case 'consult':
      return r.type === 'consult' && r.id === m.id;
    case 'triage':
      return r.type === 'triage';
    case 'any':
      return m.of.some((x) => recordMatches(x, r, patient));
    case 'all':
      return false;
  }
}

/** Waktu (detik) pertama kali kriteria terpenuhi, atau null. Kumulatif untuk cairan & "all". */
export function firstTime(patient: EdPatient, m: ActionMatch, until = Infinity): number | null {
  const acts = patient.actions.filter((r) => r.t <= until && r.type !== 'stop');
  switch (m.kind) {
    case 'fluid': {
      const need = Math.max(m.minMl ?? 0, (m.minMlPerKg ?? 0) * patient.weightKg);
      let total = 0;
      for (const r of acts) {
        if (!recordMatches(m, r, patient)) continue;
        total += r.volumeMl ?? 0;
        if (total >= need - 1e-6) return r.t;
      }
      return null;
    }
    case 'any': {
      const times = m.of.map((x) => firstTime(patient, x, until)).filter((x): x is number => x !== null);
      return times.length ? Math.min(...times) : null;
    }
    case 'all': {
      let latest = -Infinity;
      for (const x of m.of) {
        const tt = firstTime(patient, x, until);
        if (tt === null) return null;
        latest = Math.max(latest, tt);
      }
      return latest;
    }
    default: {
      const hit = acts.find((r) => recordMatches(m, r, patient));
      return hit ? hit.t : null;
    }
  }
}

export function done(patient: EdPatient, m: ActionMatch, until = Infinity): boolean {
  return firstTime(patient, m, until) !== null;
}
