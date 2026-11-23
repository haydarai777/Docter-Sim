/**
 * Pembantu penulisan skenario IGD (kriteria aksi, target stabil, langkah pakar).
 *
 * ⚠ Konten klinis mode IGD BELUM DITINJAU DOKTER — lihat docs/igd.md untuk pedoman rujukan.
 */
import type { ActionMatch, Ats, Disposition, EdAction, EdPatient, ExamId, ExpertStep, FluidId, PhysioState, ProcId, Route, Specialty, TestId, Vitals } from '../../core/igd/types';

export const exam = (id: ExamId): ActionMatch => ({ kind: 'exam', id });
export const test = (id: TestId): ActionMatch => ({ kind: 'test', id });
export const proc = (id: ProcId, param?: string): ActionMatch => (param === undefined ? { kind: 'proc', id } : { kind: 'proc', id, param });
export const drug = (id: string, opt: { routes?: Route[]; dose?: [number, number]; perKg?: [number, number] } = {}): ActionMatch => ({ kind: 'drug', id, ...opt });
export const o2 = (minFio2 = 0.3): ActionMatch => ({ kind: 'oxygen', minFio2 });
export const fluid = (minMlPerKg: number, ids: FluidId[] = ['nacl', 'rl']): ActionMatch => ({ kind: 'fluid', ids, minMlPerKg });
export const fluidMl = (minMl: number, ids: FluidId[]): ActionMatch => ({ kind: 'fluid', ids, minMl });
export const consult = (id: Specialty): ActionMatch => ({ kind: 'consult', id });
export const any = (...of: ActionMatch[]): ActionMatch => ({ kind: 'any', of });
export const all = (...of: ActionMatch[]): ActionMatch => ({ kind: 'all', of });

/** Steroid sistemik apa pun. */
export const STEROID = any(drug('metilprednisolon'), drug('hidrokortison'), drug('deksametason'));
export const BENZO = any(drug('diazepam'), drug('midazolam'));
export const ANTIBIOTIC = any(drug('seftriakson'), drug('meropenem'));
export const OPIOID = any(drug('morfin'), drug('fentanil'));
export const ANALGESIC = any(drug('morfin'), drug('fentanil'), drug('ketorolak'), drug('parasetamol'));
export const P2Y12 = any(drug('klopidogrel', { dose: [300, 600] }), drug('tikagrelor', { dose: [180, 180] }));
export const ANTICOAG = any(drug('heparin'), drug('enoksaparin'));
export const MONITOR = any(proc('monitor'), proc('pad_defib'));

// --- Target stabil -----------------------------------------------------------

export const alive = (v: Vitals, p: PhysioState) => !p.dead && !p.arrest && v.pulse;
export const oxygenated = (v: Vitals, min = 92) => (v.spo2 ?? 0) >= min;
export const perfused = (v: Vitals, sbp = 90) => (v.sbp ?? 0) >= sbp;

// --- Langkah pakar -----------------------------------------------------------

export const at = (atMin: number, action: EdAction | ((p: EdPatient) => EdAction), when?: ExpertStep['when']): ExpertStep => (when ? { atMin, action, when } : { atMin, action });
/** Dosis per kg (dibulatkan) dengan batas atas. */
export const perKg = (mgPerKg: number, cap = Infinity, round = 1) => (p: EdPatient) => Math.min(cap, Math.round((mgPerKg * p.weightKg) / round) * round);
export const triage = (ats: Ats, bedId = 'R1'): EdAction => ({ type: 'triase', ats, bedId });
export const ex = (e: ExamId): EdAction => ({ type: 'periksa', exam: e });
export const order = (t: TestId): EdAction => ({ type: 'penunjang', test: t });
export const doProc = (id: ProcId, param?: string): EdAction => (param === undefined ? { type: 'tindakan', proc: id } : { type: 'tindakan', proc: id, param });
export const give = (d: string, route: Route, dose: number): EdAction => ({ type: 'obat', drug: d, route, dose });
export const drip = (d: string, rate: number): EdAction => ({ type: 'infus_obat', drug: d, rate });
export const infuse = (f: FluidId, volumeMl: number, overMin: number): EdAction => ({ type: 'cairan', fluid: f, volumeMl, overMin });
export const call = (s: Specialty): EdAction => ({ type: 'konsul', specialty: s });
export const dx = (primary: string, ...secondary: string[]): EdAction => ({ type: 'diagnosis', primary, secondary });
export const dispo = (to: Disposition): EdAction => ({ type: 'disposisi', to });
export const ask = (topic: string, who: 'pasien' | 'keluarga' | 'paramedis' | 'saksi' = 'pasien'): EdAction => ({ type: 'tanya', who, text: topic, topic });

/** Survei primer ABCDE lengkap mulai menit `t`. */
export const primary = (t: number): ExpertStep[] => (['A', 'B', 'C', 'D', 'E'] as const).map((e, i) => at(t + i * 0.1, ex(e)));

/** Masih dalam keadaan tertentu (untuk langkah bersyarat). */
export const still = (fn: (v: Vitals, p: EdPatient) => boolean) => (p: EdPatient, v: Vitals) => fn(v, p);

/** Langkah ACLS bersyarat tiap menit dalam rentang (untuk rencana pakar yang mungkin mengalami henti jantung). */
export function acls(from: number, to: number, opts: { shockable?: boolean } = {}): ExpertStep[] {
  const steps: ExpertStep[] = [];
  const arrest = (p: EdPatient) => !!p.physio.arrest;
  for (let t = from; t <= to; t += 1) {
    steps.push(at(t, doProc('rjp'), (p) => arrest(p) && !p.devices.cpr));
    steps.push(at(t + 0.05, doProc('pad_defib'), (p) => arrest(p) && !p.devices.pads));
    steps.push(at(t + 0.1, doProc('bvm'), (p) => arrest(p) && p.devices.assist === 'none'));
    if (opts.shockable !== false) steps.push(at(t + 0.2, doProc('defibrilasi', '200'), (p) => arrest(p) && (p.physio.arrest!.rhythm === 'vf' || p.physio.arrest!.rhythm === 'vt') && p.devices.pads));
    steps.push(at(t + 0.3, doProc('io'), (p) => arrest(p) && p.devices.ivCount === 0 && !p.devices.io));
    steps.push(
      at(t + 0.4, give('adrenalin', 'iv', 1), (p) => {
        const a = p.physio.arrest;
        if (!a) return false;
        const due = a.shocks >= 2 || a.rhythm === 'pea' || a.rhythm === 'asistol';
        const now = p.timeline.at(-1)?.t ?? p.arriveAt;
        return due && (a.lastAdrenalineAt === null || now - a.lastAdrenalineAt >= 230);
      }),
    );
    steps.push(at(t + 0.5, give('amiodaron', 'iv', 300), (p) => arrest(p) && p.physio.arrest!.shocks >= 3 && p.physio.arrest!.amiodaroneMg === 0));
  }
  return steps;
}

/** Ulangi pemasangan IV bila gagal. */
export const ivAgain = (t: number): ExpertStep => at(t, doProc('iv'), (p) => p.devices.ivCount === 0 && !p.devices.io);

/** Vasopresor bila MAP < 65 (dicek tiap 3 menit dalam rentang). */
export function pressor(from: number, to: number, rate = 0.08): ExpertStep[] {
  const steps: ExpertStep[] = [];
  for (let t = from; t <= to; t += 3) {
    steps.push(at(t, drip('noradrenalin', rate), (p, v) => !p.physio.arrest && (v.map ?? 0) < 65 && !p.infusions.some((i) => i.ref === 'noradrenalin' && i.stoppedAt === null)));
    steps.push(at(t + 0.1, drip('noradrenalin', rate * 2), (p, v) => !p.physio.arrest && (v.map ?? 0) < 60 && p.infusions.some((i) => i.ref === 'noradrenalin' && i.stoppedAt === null && i.ratePerMin < rate * 2)));
  }
  return steps;
}
