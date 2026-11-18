/**
 * Model fisiologi pasien IGD.
 *
 * Variabel tersembunyi (volume, tonus vaskular, fungsi pompa, pirau paru, bronkospasme,
 * dorongan napas, TIK, glukosa, dst.) berubah mengikuti perjalanan penyakit dan terapi.
 * Tanda vital, analisa gas darah, GCS, dan hasil lab DIHITUNG dari variabel tersebut
 * sehingga semua yang dilihat pemain konsisten satu sama lain.
 *
 * Kalibrasi (lihat tes):
 *  - Hemodinamik: preload × pompa × tonus dengan kompensasi baroreseptor, ditala agar
 *    kehilangan darah kelas I–IV (ATLS) menghasilkan pola nadi/tekanan darah yang sesuai.
 *  - Oksigenasi: persamaan gas alveolar, gangguan V/Q (responsif O₂) dan pirau (refrakter),
 *    kurva disosiasi Severinghaus, campuran darah vena.
 *  - Ventilasi: PaCO₂ = 40 × produksi CO₂ / ventilasi alveolar relatif.
 */
import type { ArrestCause, ArrestRhythm, Gcs, Mod, PhysioBase, PhysioInit, PhysioState, Rhythm, Support, VarKey, VarRecord, Vitals } from './types';
import type { Sex } from '../types';

export const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

export const VAR_DEFAULTS: VarRecord = {
  volume: 1,
  rbc: 1,
  bleed: 0,
  leak: 0,
  tone: 1,
  pump: 1,
  obstruction: 0,
  ptx: 0,
  shunt: 0.02,
  vq: 0,
  spasm: 0,
  airway: 1,
  drive: 1,
  icp: 0,
  glucose: 104,
  keto: 0,
  k: 4.1,
  na: 139,
  temp: 36.8,
  pain: 0,
  anxiety: 0.15,
  sedation: 0,
  cholinergic: 0,
  ischemia: 0,
  reaction: 0,
  infection: 0,
  edema: 0,
  postictal: 0,
  brainInjury: 0,
  lactate: 1.1,
  fatigue: 0,
  atony: 0,
  mg: 2.0,
  hypertension: 0,
  angioedema: 0,
};

export const VAR_RANGES: Record<VarKey, [number, number]> = {
  volume: [0.2, 1.5],
  rbc: [0.15, 1.5],
  bleed: [0, 0.1],
  leak: [0, 0.05],
  tone: [0.25, 2.2],
  pump: [0.1, 1.3],
  obstruction: [0, 1],
  ptx: [0, 1],
  shunt: [0, 0.85],
  vq: [0, 0.9],
  spasm: [0, 1],
  airway: [0, 1],
  drive: [0, 1.6],
  icp: [0, 1.05],
  glucose: [8, 950],
  keto: [0, 1],
  k: [1.5, 8.5],
  na: [110, 172],
  temp: [32, 43],
  pain: [0, 1],
  anxiety: [0, 1],
  sedation: [0, 1],
  cholinergic: [0, 1],
  ischemia: [0, 1],
  reaction: [0, 1],
  infection: [0, 1],
  edema: [0, 1],
  postictal: [0, 1],
  brainInjury: [0, 1],
  lactate: [0.5, 22],
  fatigue: [0, 1],
  atony: [0, 1],
  mg: [0.5, 14],
  hypertension: [0, 1],
  angioedema: [0, 1],
};

/** Nilai dasar tanda vital menurut usia (dipersonalisasi sedikit oleh skenario). */
export function baseForAge(age: number, sex: Sex): PhysioBase {
  const hb = age < 1 ? 11.5 : age < 12 ? 12.3 : sex === 'male' ? 14.6 : 12.9;
  if (age < 1) return { hr: 135, map: 58, pp: 36, rr: 36, temp: 36.9, hb };
  if (age < 6) return { hr: 112, map: 68, pp: 38, rr: 26, temp: 36.9, hb };
  if (age < 13) return { hr: 92, map: 76, pp: 40, rr: 20, temp: 36.8, hb };
  if (age >= 65) return { hr: 74, map: 98, pp: 52, rr: 17, temp: 36.6, hb: hb - 0.6 };
  return { hr: 78, map: 92, pp: 42, rr: 16, temp: 36.8, hb };
}

export interface PhysioPatient {
  age: number;
  sex: Sex;
  weightKg: number;
  betaBlocker: boolean;
}

/** Buat state fisiologi awal dari inisialisasi skenario (+ varian). */
export function createPhysio(inits: readonly (PhysioInit | undefined)[], pt: PhysioPatient, deterioration: number, now: number): PhysioState {
  const base = baseForAge(pt.age, pt.sex);
  const p: PhysioState = {
    v: { ...VAR_DEFAULTS },
    rate: {},
    mods: [],
    ramps: [],
    scheduled: [],
    rhythm: 'sinus',
    rhythmRate: null,
    seizure: false,
    seizureEndsAt: null,
    arrest: null,
    dead: false,
    deathCause: null,
    base,
    weightKg: pt.weightKg,
    ageYears: pt.age,
    sex: pt.sex,
    betaBlocker: pt.betaBlocker,
    airwayCause: null,
    stroke: null,
    chestSide: null,
    brainSide: null,
    counters: { lowMap: 0, lowSat: 0, herniation: 0, hypoK: 0 },
    memo: { gcs: 15, pao2: 95, map: base.map, sa: 0.97, perfusion: 1 },
    deterioration,
    dehydration: 0,
    drip: {},
    doses: {},
  };
  for (const init of inits) {
    if (!init) continue;
    Object.assign(p.v, init.v ?? {});
    Object.assign(p.rate, init.rate ?? {});
    Object.assign(p.base, init.base ?? {});
    if (init.rhythm) p.rhythm = init.rhythm;
    if (init.rhythmRate !== undefined) p.rhythmRate = init.rhythmRate;
    if (init.seizure !== undefined) {
      p.seizure = init.seizure;
      p.seizureEndsAt = init.seizure && init.seizureMin ? now + init.seizureMin * 60 : null;
    }
    if (init.airwayCause !== undefined) p.airwayCause = init.airwayCause;
    if (init.stroke !== undefined) p.stroke = init.stroke;
    if (init.chestSide) p.chestSide = init.chestSide;
    if (init.brainSide) p.brainSide = init.brainSide;
    if (init.dehydration !== undefined) p.dehydration = init.dehydration;
    if (init.arrest) startArrest(p, init.arrest, init.arrestCause ?? 'primer', now);
  }
  p.memo.map = p.base.map;
  return p;
}

// ---------------------------------------------------------------------------
// Pengaruh sementara & bertahap
// ---------------------------------------------------------------------------

function envelope(m: Mod, t: number): number {
  if (t <= m.t0 || t >= m.t3) return 0;
  if (t < m.t1) return (t - m.t0) / Math.max(1, m.t1 - m.t0);
  if (t <= m.t2) return 1;
  return (m.t3 - t) / Math.max(1, m.t3 - m.t2);
}

export function modSum(p: PhysioState, key: Mod['key'], t: number): number {
  let sum = p.drip[key] ?? 0;
  for (const m of p.mods) if (m.key === key) sum += m.value * envelope(m, t);
  return sum;
}

/** Nilai efektif variabel (nilai dasar + pengaruh obat/manuver yang sedang bekerja). */
export function eff(p: PhysioState, key: VarKey, t: number): number {
  const [lo, hi] = VAR_RANGES[key];
  return clamp(p.v[key] + modSum(p, key, t), lo, hi);
}

/**
 * Tambah pengaruh sementara: onset (menit), lama puncak (menit), lama hilang (menit).
 */
export function addMod(p: PhysioState, key: Mod['key'], value: number, now: number, onsetMin: number, plateauMin: number, offsetMin: number, source: string): void {
  const t0 = now;
  const t1 = t0 + Math.max(1, onsetMin * 60);
  const t2 = t1 + plateauMin * 60;
  p.mods.push({ key, value, t0, t1, t2, t3: t2 + Math.max(1, offsetMin * 60), source });
}

/** Perubahan permanen bertahap mulai `delayMin` selama `overMin`. */
export function addRamp(p: PhysioState, key: VarKey, total: number, now: number, delayMin: number, overMin: number, source: string): void {
  const t0 = now + delayMin * 60;
  p.ramps.push({ key, total, t0, t1: t0 + Math.max(1, overMin * 60), source });
}

export function schedule(p: PhysioState, atSec: number, key: VarKey, target: 'v' | 'rate', op: 'set' | 'add' | 'mul', value: number, source: string): void {
  p.scheduled.push({ at: atSec, key, target, op, value, source });
}

// ---------------------------------------------------------------------------
// Perhitungan tanda vital
// ---------------------------------------------------------------------------

/** Kurva disosiasi oksihemoglobin (Severinghaus). */
export function satFromPo2(po2: number): number {
  const x = Math.max(0.1, po2);
  return 1 / (23400 / (x * x * x + 150 * x) + 1);
}

/** Kebalikan kurva disosiasi (pencarian biner). */
export function po2FromSat(sat: number): number {
  let lo = 1;
  let hi = 700;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (satFromPo2(mid) < sat) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

const GCS_SPLIT: Record<number, [number, number, number]> = {
  15: [4, 5, 6],
  14: [4, 4, 6],
  13: [3, 4, 6],
  12: [3, 3, 6],
  11: [3, 3, 5],
  10: [2, 3, 5],
  9: [2, 2, 5],
  8: [2, 2, 4],
  7: [1, 2, 4],
  6: [1, 1, 4],
  5: [1, 1, 3],
  4: [1, 1, 2],
  3: [1, 1, 1],
};

function gcsFrom(total: number, intubated: boolean, aphasia: boolean): Gcs {
  const t = clamp(Math.round(total), 3, 15);
  let [e, v, m] = GCS_SPLIT[t]!;
  if (aphasia && v > 2) v = 2;
  if (intubated) v = 1;
  return { e, v, m, total: e + v + m, intubated };
}

/** Patensi jalan napas efektif setelah manuver/alat bantu. */
export function airwayPatency(p: PhysioState, s: Support, t: number): number {
  if (s.adjunct === 'ett') return 1;
  let a = eff(p, 'airway', t) - 0.75 * eff(p, 'angioedema', t);
  // Lidah jatuh pada penurunan kesadaran (GCS langkah sebelumnya).
  const g = p.memo.gcs;
  // Saat kejang tonik-klonik tonus otot tinggi: masalahnya ventilasi tidak efektif & sekret, bukan lidah jatuh.
  const tongue = p.seizure ? 0 : g <= 6 ? 0.36 : g <= 8 ? 0.26 : g <= 10 ? 0.1 : 0;
  a -= tongue;
  // Sekret/muntahan (kolinergik, kejang).
  const secret = 0.4 * eff(p, 'cholinergic', t) + (p.airwayCause === 'sekret' ? 0.12 : 0);
  a -= s.suctioned ? secret * 0.35 : secret;
  // Manuver & alat bantu hanya mengatasi lidah jatuh (bukan benda asing/angioedema).
  const relief = s.adjunct === 'opa' || s.adjunct === 'npa' ? 0.94 : s.adjunct === 'manuver' ? 0.86 : 0;
  if (relief > 0) a += tongue * relief;
  if (s.position === 'miring_kiri') a += tongue * 0.45 + secret * 0.3;
  return clamp(a, 0, 1);
}

export function computeVitals(p: PhysioState, s: Support, t: number): Vitals {
  const e = (k: VarKey) => eff(p, k, t);
  const temp = e('temp');
  const pain = e('pain');
  const anxiety = e('anxiety');
  const sedation = e('sedation');
  const cholinergic = e('cholinergic');
  const icp = e('icp');
  const glucose = e('glucose');
  const keto = e('keto');
  const lactate = e('lactate');
  const volume = e('volume');
  const intubated = s.adjunct === 'ett';

  // --- Sirkulasi -------------------------------------------------------------
  const loss = 1 - volume;
  let preload = loss <= 0.1 ? 1 + Math.min(0.08, -loss * 0.25) : 1 - 1.55 * (loss - 0.1);
  if (s.position === 'kaki_diangkat' && loss > 0.08) preload += 0.06;
  if ((s.position === 'duduk' || s.position === 'semi_fowler') && loss > 0.15) preload -= 0.05;
  if (s.assist === 'ventilator') preload *= 0.96;
  preload *= 1 - 0.88 * e('obstruction');
  preload = clamp(preload, 0.08, 1.12);
  let pump = e('pump') * (1 - 0.32 * e('ischemia'));
  if (p.memo.pao2 < 40) pump *= 0.72;
  pump = clamp(pump, 0.08, 1.3);
  const tone = clamp(e('tone') - 0.6 * e('reaction') - 0.55 * Math.pow(e('infection'), 1.2) + 0.7 * e('hypertension'), 0.25, 2.3);

  const perfRaw = preload * pump;
  let gain = p.betaBlocker ? 0.45 : 1;
  if (p.ageYears >= 70) gain *= 0.8;
  let hr = p.base.hr * (1 + gain * (1.5 * Math.max(0, 1 - perfRaw) + 0.9 * Math.max(0, 1 - tone)));
  hr += 9.5 * Math.max(0, temp - 37.2) + 28 * pain + 14 * anxiety + 32 * clamp(e('spasm') + 0.5 * e('reaction'), 0, 1) + 18 * e('edema') + modSum(p, 'hr', t);
  if (p.memo.pao2 < 55) hr += (55 - p.memo.pao2) * 0.6;
  if (p.seizure) hr += 35;
  hr *= (1 - 0.48 * cholinergic) * (1 - 0.15 * sedation);
  if (p.memo.pao2 < 28) hr *= 0.6;
  if (icp > 0.75) hr *= 1 - 0.55 * Math.min(1, (icp - 0.75) / 0.25);

  let rhythm: Rhythm = p.rhythm;
  const fixed = p.rhythmRate ?? 0;
  if (rhythm === 'svt' || rhythm === 'af_rvr' || rhythm === 'vt') hr = fixed || (rhythm === 'svt' ? 190 : rhythm === 'vt' ? 170 : 140);
  else if (rhythm === 'av_blok_total') hr = (fixed || 35) + Math.max(0, modSum(p, 'hr', t)) * 0.7;
  else if (rhythm === 'sinus_bradikardia' && fixed) hr = Math.min(hr, fixed + Math.max(0, modSum(p, 'hr', t)));
  if (s.pacing && (rhythm === 'av_blok_total' || rhythm === 'sinus_bradikardia' || hr < s.pacing)) hr = s.pacing;
  hr = clamp(hr, 22, 230);
  if (rhythm === 'sinus' || rhythm === 'sinus_takikardia' || rhythm === 'sinus_bradikardia') {
    rhythm = hr >= 100 ? 'sinus_takikardia' : hr < 55 ? 'sinus_bradikardia' : 'sinus';
  }

  const fill = hr <= 125 ? 1 : clamp(1 - (hr - 125) / 210, 0.45, 1);
  const rhythmEff = rhythm === 'svt' ? 0.86 : rhythm === 'af_rvr' ? 0.88 : rhythm === 'vt' ? 0.62 : 1;
  const hrRel = hr / p.base.hr;
  const co = preload * pump * (hrRel < 1 ? Math.pow(hrRel, 0.75) : 1 + 0.35 * (hrRel - 1)) * fill * rhythmEff;
  const svr = tone * (1 + 0.5 * Math.min(1, tone) * Math.max(0, 1 - preload * pump * Math.min(1, hrRel)));
  let map = p.base.map * co * svr + modSum(p, 'map', t);
  map = clamp(map, 10, 210);
  let pp = p.base.pp * clamp(preload * pump * fill * (tone < 0.9 ? 1.2 : 1) * (1 + 0.9 * e('hypertension')), 0.25, 1.9);
  if (rhythm === 'av_blok_total') pp *= 1.25;
  let perfusion = clamp((map / p.base.map) * Math.sqrt(Math.max(0.01, co)), 0, 1.3);

  // --- Ventilasi --------------------------------------------------------------
  const airway = airwayPatency(p, s, t);
  let drive = e('drive') - 0.85 * sedation - 0.5 * e('fatigue') - (icp > 0.85 ? (icp - 0.85) * 3 : 0) - Math.max(0, e('mg') - 9) * 0.15;
  drive = clamp(drive, 0, 1.6);
  const spasm = clamp(e('spasm') + 0.55 * e('reaction') + 0.4 * cholinergic, 0, 1);
  const collapse = clamp(e('ptx') + 0.9 * e('obstruction'), 0, 1);
  const edema = e('edema');
  const mechanical = Math.pow(airway, 1.3) * (1 - 0.66 * Math.pow(spasm, 1.8)) * (1 - 0.45 * collapse) * (p.seizure ? 0.68 : 1) * (s.oxygen === 'niv' ? 1.12 : 1);
  // Opioid/sedatif menumpulkan respons terhadap hipoksia.
  const hypox = (p.memo.pao2 < 60 ? clamp((60 - p.memo.pao2) / 25, 0, 1.4) : 0) * (1 - 0.8 * sedation);
  const acid = clamp(keto + (lactate > 2 ? (lactate - 2) / 8 : 0), 0, 1.3);
  const fever = Math.max(0, temp - 37.5);
  const stimVe = 1 + 0.8 * hypox + 1.3 * acid + 0.3 * pain + 0.3 * anxiety + 0.3 * spasm + 0.2 * fever;
  const stimRr = 1 + 0.7 * hypox + 0.9 * acid + 0.4 * pain + 0.4 * anxiety + 0.7 * spasm + 0.25 * fever + 0.6 * edema + 0.45 * collapse + 0.35 * Math.max(0, 1 - perfusion);
  let ve = drive * stimVe * mechanical;
  let rr = p.base.rr * clamp(drive, 0.05, 1.6) * stimRr;
  if (s.assist === 'bvm') {
    const seal = airway >= 0.05 && p.airwayCause !== 'benda_asing' ? Math.max(airway, s.adjunct === 'none' ? 0.62 : 0.85) : airway;
    ve = Math.max(ve, 0.88 * seal * (1 - 0.5 * Math.pow(spasm, 1.8)));
    rr = Math.max(rr, 10);
  } else if (s.assist === 'ventilator') {
    ve = Math.max(ve, 1.0 * (1 - 0.45 * Math.pow(spasm, 1.8)));
    rr = 14;
  }
  rr = clamp(rr, 0, 70);
  const co2 = 1 + 0.25 * fever + (p.seizure ? 0.6 : 0) + 0.15 * pain;
  let paco2 = clamp((40 * co2) / Math.max(ve, 0.06), 12, 160);
  // CO₂ menumpuk perlahan saat hipoventilasi/apnea (± 3–10 mmHg/menit), tetapi cepat dibuang
  // begitu ventilasi pulih.
  if (p.memoT !== undefined && p.memo.paco2 !== undefined && !p.arrest) {
    const dtm = Math.max(0, t - p.memoT);
    const tau = paco2 > p.memo.paco2 ? (p.ageYears < 8 ? 360 : 600) : 45;
    paco2 = p.memo.paco2 + (paco2 - p.memo.paco2) * (1 - Math.exp(-dtm / tau));
  }

  // --- Oksigenasi -------------------------------------------------------------
  const fio2 = s.assist !== 'none' ? Math.max(s.fio2, s.assist === 'ventilator' ? 0.6 : 0.21) : s.fio2;
  const pAO2 = Math.max(0, fio2 * 713 - paco2 * 1.25);
  const vq = clamp(e('vq') + 0.5 * spasm + 0.35 * edema + 0.25 * collapse, 0, 0.92);
  const pc = pAO2 * (1 - vq);
  const sc = satFromPo2(pc);
  const edemaShunt = 0.45 * edema * (s.oxygen === 'niv' || s.assist === 'ventilator' ? 0.55 : 1);
  const shunt = clamp(e('shunt') + edemaShunt + 0.4 * collapse + (airway < 0.25 ? (0.25 - airway) * 1.6 : 0), 0, 0.92);
  const sv = clamp(0.74 - 0.3 * Math.max(0, 1 - perfusion) - 0.04 * fever, 0.3, 0.8);
  let sa = (1 - shunt) * sc + shunt * sv;
  sa = clamp(sa, 0.05, 0.995);
  // Cadangan oksigen tubuh (paru & darah): saturasi bergerak bertahap menuju nilai seimbangnya,
  // tidak seketika — desaturasi saat apnea/sumbatan butuh puluhan detik (lebih cepat pada anak),
  // pemulihan dengan oksigen sedikit lebih cepat.
  if (p.memoT !== undefined && !p.arrest) {
    const dtm = Math.max(0, t - p.memoT);
    const child = p.ageYears < 8;
    const tau = sa < p.memo.sa ? (child ? 18 : 40) : child ? 9 : 15;
    sa = p.memo.sa + (sa - p.memo.sa) * (1 - Math.exp(-dtm / tau));
  }
  let pao2 = po2FromSat(sa);
  if (sa > 0.985) pao2 = Math.max(pao2, pc * (1 - shunt * 2.2));

  // --- Kimia darah ------------------------------------------------------------
  const hco3 = clamp(24 - 24 * keto - 1.6 * Math.max(0, lactate - 1.2) - 120 * e('leak'), 3, 40);
  let ph = 6.1 + Math.log10(hco3 / (0.03 * paco2));
  ph = clamp(ph, 6.6, 7.75);
  const hb = clamp((p.base.hb * e('rbc')) / Math.max(volume, 0.3), 2, 24);
  const k = clamp(e('k') + 0.6 * Math.max(0, 7.4 - ph), 1.5, 9);

  // --- Kesadaran --------------------------------------------------------------
  let deficit = 0;
  if (map < 60) deficit += (60 - map) / 3.5;
  if (pao2 < 50) deficit += (50 - pao2) / 3.5;
  if (paco2 > 65) deficit += (paco2 - 65) / 7;
  if (glucose < 60) deficit += (60 - glucose) / 3.6;
  if (glucose > 500) deficit += (glucose - 500) / 120;
  deficit += Math.max(0, keto - 0.4) * 5;
  deficit += 12.5 * Math.pow(icp, 1.6);
  deficit += 12 * Math.pow(sedation, 1.3);
  deficit += 8 * e('postictal');
  deficit += 3 * cholinergic;
  deficit += 10 * e('brainInjury');
  if (temp > 40.5) deficit += (temp - 40.5) * 3;
  let gcsTotal = 15 - deficit;
  if (p.seizure) gcsTotal = Math.min(gcsTotal, 6);
  let gcs = gcsFrom(gcsTotal, intubated, !!p.stroke?.aphasia);

  let pulse = true;
  let sbp: number | null = map + (2 / 3) * pp;
  let dbp: number | null = Math.max(10, map - pp / 3);
  let mapOut: number | null = map;
  let spo2: number | null = Math.round(sa * 100);
  let etco2: number | null = intubated ? Math.round(clamp(paco2 - 4, 5, 120) * Math.min(1, perfusion + 0.2)) : null;
  let crt = clamp(1.5 + 3.5 * Math.max(0, 0.95 - perfusion) + (temp < 35 ? 1 : 0), 1, 7);
  if (p.arrest) {
    pulse = false;
    rhythm = p.arrest.rhythm;
    hr = rhythm === 'pea' ? 44 : rhythm === 'vt' ? 180 : 0;
    sbp = dbp = mapOut = null;
    spo2 = null;
    rr = s.assist !== 'none' ? 10 : 0;
    gcs = gcsFrom(3, intubated, false);
    perfusion = s.cpr ? 0.25 : 0;
    etco2 = intubated ? (s.cpr ? 14 : 4) : null;
    crt = 7;
    paco2 = clamp(paco2 + 20, 40, 160);
    ph = clamp(ph - 0.2, 6.6, 7.4);
    // Tanpa sirkulasi efektif darah arteri tidak teroksigenasi normal (RJP + ventilasi: sebagian).
    pao2 = Math.min(pao2, s.cpr && s.assist !== 'none' ? 70 : s.cpr ? 45 : 25);
  } else if (map < 40) {
    // Nadi perifer & saturasi sulit terbaca pada syok berat.
    spo2 = map < 32 ? null : spo2;
  }

  return {
    rawSa: sa,
    rawPaco2: paco2,
    hr: Math.round(hr),
    pulse,
    rhythm,
    sbp: sbp === null ? null : Math.round(sbp),
    dbp: dbp === null ? null : Math.round(dbp),
    map: mapOut === null ? null : Math.round(mapOut),
    rr: Math.round(rr),
    spo2,
    temp: Math.round(temp * 10) / 10,
    gcs,
    pao2: Math.round(pao2),
    paco2: Math.round(paco2),
    ph: Math.round(ph * 100) / 100,
    hco3: Math.round(hco3 * 10) / 10,
    lactate: Math.round(lactate * 10) / 10,
    glucose: Math.round(glucose),
    hb: Math.round(hb * 10) / 10,
    hct: Math.round(hb * 3),
    k: Math.round(k * 10) / 10,
    na: Math.round(e('na')),
    etco2,
    crt: Math.round(crt * 10) / 10,
    perfusion,
  };
}

// ---------------------------------------------------------------------------
// Henti jantung
// ---------------------------------------------------------------------------

export function startArrest(p: PhysioState, rhythm: ArrestRhythm, cause: ArrestCause, now: number): void {
  if (p.arrest || p.dead) return;
  p.arrest = { rhythm, since: now, noFlow: 0, cprSeconds: 0, shocks: 0, adrenalineDoses: 0, lastAdrenalineAt: null, amiodaroneMg: 0, cause, nextCheckAt: now + 120 };
  p.seizure = false;
}

/** Penyebab henti jantung (4H 4T) sudah dikoreksi? */
export function causeCorrected(p: PhysioState, s: Support, t: number): boolean {
  const a = p.arrest;
  if (!a) return true;
  switch (a.cause) {
    case 'hipoksia':
      return s.assist !== 'none' && airwayPatency(p, s, t) > 0.5 && s.fio2 >= 0.6;
    case 'hipovolemia':
      return eff(p, 'volume', t) >= 0.82 && eff(p, 'bleed', t) < 0.004;
    case 'tension':
      return eff(p, 'obstruction', t) < 0.2;
    case 'hipo_hiperkalemia':
      return eff(p, 'k', t) > 2.9 && eff(p, 'k', t) < 6.3;
    case 'toksin':
      return eff(p, 'sedation', t) < 0.35 && eff(p, 'cholinergic', t) < 0.35 && s.assist !== 'none';
    case 'asidosis':
      return eff(p, 'keto', t) < 0.5;
    case 'herniasi':
      return false;
    case 'iskemia':
    case 'primer':
      return true;
  }
}

export function rosc(p: PhysioState, now: number): void {
  if (!p.arrest) return;
  p.arrest = null;
  p.rhythm = 'sinus';
  p.rhythmRate = null;
  // Pasca-ROSC: miokardium "terpana" dan vasodilatasi sementara.
  addMod(p, 'pump', -0.18, now, 0.1, 15, 30, 'pasca-ROSC');
  addMod(p, 'tone', -0.12, now, 0.1, 10, 20, 'pasca-ROSC');
  p.counters.lowMap = 0;
  p.counters.lowSat = 0;
}

export interface ShockResult {
  outcome: 'rosc' | 'tidak_berubah' | 'konversi' | 'vf_terpicu' | 'tanpa_indikasi';
}

/** Kejut listrik: defibrilasi (tidak tersinkron) atau kardioversi (tersinkron). */
export function deliverShock(p: PhysioState, s: Support, joules: number, synchronized: boolean, now: number, rand: () => number): ShockResult {
  const a = p.arrest;
  if (a) {
    a.shocks++;
    if (a.rhythm !== 'vf' && a.rhythm !== 'vt') return { outcome: 'tanpa_indikasi' };
    if (synchronized) return { outcome: 'tidak_berubah' };
    const noFlowMin = a.noFlow / 60;
    let chance = 0.55 * Math.exp(-noFlowMin * 0.18);
    if (a.amiodaroneMg > 0) chance *= 1.25;
    if (a.adrenalineDoses > 0 && a.shocks >= 2) chance *= 1.1;
    if (a.cause === 'hipo_hiperkalemia' && !causeCorrected(p, s, now)) chance *= 0.35;
    if (a.cause === 'iskemia') chance *= 0.95;
    const adultish = p.weightKg >= 30;
    if (adultish && joules < 120) chance *= 0.6;
    if (!adultish && joules < 2 * p.weightKg) chance *= 0.6;
    if (rand() < chance) {
      rosc(p, now);
      return { outcome: 'rosc' };
    }
    return { outcome: 'tidak_berubah' };
  }
  // Pasien bernadi.
  const r = p.rhythm;
  if (!synchronized) {
    // Kejut tidak tersinkron pada pasien bernadi dapat jatuh pada gelombang T → VF.
    if (rand() < 0.5 || r === 'sinus' || r === 'sinus_takikardia') {
      startArrest(p, 'vf', 'primer', now);
      return { outcome: 'vf_terpicu' };
    }
  }
  if (r === 'svt' || r === 'af_rvr' || r === 'vt') {
    const chance = r === 'af_rvr' ? (joules >= 120 ? 0.75 : 0.45) : joules >= 50 ? 0.85 : 0.5;
    if (rand() < chance) {
      p.rhythm = 'sinus';
      p.rhythmRate = null;
      return { outcome: 'konversi' };
    }
    return { outcome: 'tidak_berubah' };
  }
  return { outcome: 'tanpa_indikasi' };
}

// ---------------------------------------------------------------------------
// Langkah waktu
// ---------------------------------------------------------------------------

export interface PhysioEvent {
  kind: 'henti_jantung' | 'rosc' | 'kejang_mulai' | 'kejang_berhenti' | 'meninggal' | 'irama';
  text: string;
}

const RATE_SCALED: ReadonlySet<VarKey> = new Set<VarKey>(['spasm', 'icp', 'ischemia', 'infection', 'obstruction', 'edema', 'reaction', 'keto', 'bleed', 'leak', 'atony']);

/**
 * Majukan fisiologi `dt` detik (sebaiknya ≤ 5 detik per langkah).
 * `rand` = sumber acak deterministik dari mesin.
 */
export function stepPhysio(p: PhysioState, s: Support, dt: number, now: number, rand: () => number): PhysioEvent[] {
  const events: PhysioEvent[] = [];
  if (p.dead) return events;
  const dtMin = dt / 60;
  const t0 = now;
  const t1 = now + dt;

  // 1. Perubahan terjadwal.
  if (p.scheduled.length) {
    const keep = [];
    for (const sc of p.scheduled) {
      if (sc.at > t1) {
        keep.push(sc);
        continue;
      }
      const rec = sc.target === 'v' ? p.v : p.rate;
      const cur = (rec as Record<string, number | undefined>)[sc.key] ?? 0;
      const next = sc.op === 'set' ? sc.value : sc.op === 'add' ? cur + sc.value : cur * sc.value;
      (rec as Record<string, number>)[sc.key] = next;
    }
    p.scheduled = keep;
  }

  // 2. Perubahan bertahap.
  if (p.ramps.length) {
    const keep = [];
    for (const r of p.ramps) {
      const a = Math.max(t0, r.t0);
      const b = Math.min(t1, r.t1);
      if (b > a) p.v[r.key] += (r.total * (b - a)) / (r.t1 - r.t0);
      if (r.t1 > t1) keep.push(r);
    }
    p.ramps = keep;
  }
  p.mods = p.mods.filter((m) => m.t3 > t0);

  // 3. Perjalanan alami penyakit.
  for (const [key, rate] of Object.entries(p.rate) as [VarKey, number][]) {
    if (!rate) continue;
    const scale = RATE_SCALED.has(key) && rate > 0 ? p.deterioration : 1;
    p.v[key] += rate * scale * dtMin;
  }

  // 4. Kopling antarvariabel.
  const v0 = computeVitals(p, s, now);
  const bleed = eff(p, 'bleed', now);
  const leak = eff(p, 'leak', now);
  const vol = Math.max(0.25, p.v.volume);
  p.v.rbc -= bleed * (p.v.rbc / vol) * dtMin;
  p.v.volume -= (bleed + leak) * dtMin;
  if (leak > 0) p.dehydration = clamp(p.dehydration + leak * dtMin * 6, 0, 1);
  // Kelebihan cairan pada jantung lemah → edema paru.
  const pumpEff = eff(p, 'pump', now) * (1 - 0.32 * eff(p, 'ischemia', now));
  if (pumpEff < 0.8 && p.v.volume > 1.02) p.v.edema += (p.v.volume - 1.02) * (0.8 - pumpEff) * 1.6 * dtMin;
  if (p.v.volume > 1.3) p.v.edema += (p.v.volume - 1.3) * 0.25 * dtMin;
  // Laktat: produksi saat hipoperfusi/kejang, bersihan saat perfusi baik.
  const perf = v0.perfusion;
  if (perf < 0.8 || p.seizure) p.v.lactate += ((perf < 0.8 ? (0.8 - perf) * 0.7 : 0) + (p.seizure ? 0.3 : 0)) * dtMin;
  else p.v.lactate -= 0.06 * (p.v.lactate - 1) * dtMin;
  // Kelelahan otot napas pada bronkospasme berat yang berkepanjangan.
  const spasmNow = eff(p, 'spasm', now) + 0.55 * eff(p, 'reaction', now);
  if (spasmNow > 0.55 && s.assist === 'none') p.v.fatigue += (spasmNow - 0.55) * 0.022 * dtMin * p.deterioration;
  else p.v.fatigue -= 0.01 * dtMin;
  // Angioedema mengikuti reaksi anafilaksis (edema jalan napas akibat luka bakar berjalan sendiri).
  if (p.airwayCause !== 'inhalasi') p.v.angioedema += (eff(p, 'reaction', now) * 0.9 - p.v.angioedema) * 0.12 * dtMin;
  // Cedera otak sekunder: hipoksia/hipotensi memperberat TIK.
  if (p.v.icp > 0.15 && ((v0.spo2 ?? 0) < 90 || (v0.sbp ?? 0) < 90)) p.v.icp += 0.007 * dtMin;
  if (p.seizure) {
    p.v.postictal = 1;
    p.v.temp += 0.02 * dtMin;
  } else p.v.postictal -= 0.045 * dtMin;
  // Kerusakan otak.
  let injury = 0;
  if (v0.pao2 < 40 && !p.arrest) injury += 0.025;
  if (eff(p, 'glucose', now) < 35) injury += 0.012;
  if (p.v.icp > 0.9) injury += 0.02;
  if (p.arrest) injury += s.cpr ? 0.012 : 0.1;
  if (p.seizure) injury += 0.006;
  p.v.brainInjury += injury * dtMin;
  // Magnesium dieliminasi ginjal; kadar toksik menekan napas.
  p.v.mg -= (p.v.mg - 2) * 0.004 * dtMin;
  // Kalium < 2,5 berkepanjangan → aritmia.
  if (v0.k < 2.5 || v0.k > 7) p.counters.hypoK += dt;
  else p.counters.hypoK = Math.max(0, p.counters.hypoK - dt);

  // 5. Batas nilai.
  for (const key of Object.keys(p.v) as VarKey[]) {
    const [lo, hi] = VAR_RANGES[key];
    p.v[key] = clamp(p.v[key], lo, hi);
  }

  // 6. Kejang berhenti spontan.
  if (p.seizure && p.seizureEndsAt !== null && t1 >= p.seizureEndsAt) {
    p.seizure = false;
    p.seizureEndsAt = null;
    events.push({ kind: 'kejang_berhenti', text: 'Kejang berhenti spontan.' });
  }

  // 7. Henti jantung.
  const v1 = computeVitals(p, s, t1);
  if (!p.arrest) {
    const map = v1.map ?? 0;
    p.counters.lowMap = map < 35 ? p.counters.lowMap + dt : Math.max(0, p.counters.lowMap - dt * 2);
    const sa = v1.spo2 === null ? (map < 32 ? 0.5 : 0.9) : (v1.rawSa ?? v1.spo2 / 100);
    // Hipoksemia berat menumpuk "utang" oksigen: makin rendah PaO₂ makin cepat (PaO₂ 30 → ± 3 menit
    // menuju henti jantung, PaO₂ 24 → ± 1,5 menit); pulih hanya bila oksigenasi benar-benar membaik.
    const pa = v1.pao2;
    if (pa < 36) p.counters.lowSat += dt * Math.min(3, (36 - pa) / 6);
    else if (pa >= 45) p.counters.lowSat = Math.max(0, p.counters.lowSat - dt * 2);
    p.counters.herniation = p.v.icp >= 0.98 ? p.counters.herniation + dt : Math.max(0, p.counters.herniation - dt);
    let cause: ArrestCause | null = null;
    let rhythm: ArrestRhythm = 'pea';
    if (p.counters.lowSat > 180) {
      cause = 'hipoksia';
      rhythm = 'pea';
    } else if (p.counters.lowMap > 150) {
      cause = eff(p, 'obstruction', t1) > 0.5 ? 'tension' : p.v.volume < 0.72 ? 'hipovolemia' : eff(p, 'keto', t1) > 0.7 ? 'asidosis' : 'primer';
      rhythm = 'pea';
    } else if (p.counters.herniation > 240) {
      cause = 'herniasi';
      rhythm = 'asistol';
    } else if (p.counters.hypoK > 120 && rand() < 0.08 * dtMin * 60 / 60) {
      cause = 'hipo_hiperkalemia';
      rhythm = 'vf';
    } else {
      const isch = eff(p, 'ischemia', t1);
      if (isch > 0.3 && rand() < 0.0016 * isch * dtMin * p.deterioration) {
        cause = 'iskemia';
        rhythm = 'vf';
      }
    }
    if (p.rhythm === 'vt' && p.v.ischemia > 0.5 && rand() < 0.01 * dtMin) {
      cause = 'iskemia';
      rhythm = 'vf';
    }
    if (cause) {
      startArrest(p, rhythm, cause, t1);
      events.push({ kind: 'henti_jantung', text: `Henti jantung — irama ${rhythmLabel(rhythm)}.` });
    }
    p.memo = { gcs: v1.gcs.total, pao2: v1.pao2, map: v1.map ?? 0, sa, perfusion: v1.perfusion, paco2: v1.rawPaco2 ?? v1.paco2 };
    p.memoT = t1;
  } else {
    const a = p.arrest;
    if (s.cpr) a.cprSeconds += dt;
    else a.noFlow += dt;
    const elapsed = t1 - a.since;
    // VF tanpa kejut lama-lama menjadi asistol.
    if (a.rhythm === 'vf' && elapsed > 12 * 60 && a.shocks === 0) {
      a.rhythm = 'asistol';
      events.push({ kind: 'irama', text: 'Irama berubah menjadi asistol.' });
    }
    const futile = elapsed > 30 * 60 || a.noFlow > 10 * 60 || p.v.brainInjury >= 0.98;
    if (t1 >= a.nextCheckAt) {
      a.nextCheckAt += 120;
      if (s.cpr && !futile) {
        let chance = a.rhythm === 'vf' || a.rhythm === 'vt' ? 0.02 : 0.03;
        if (a.lastAdrenalineAt !== null && t1 - a.lastAdrenalineAt < 300) chance += 0.08;
        chance += causeCorrected(p, s, t1) ? (a.rhythm === 'pea' ? 0.3 : 0.12) : -0.02;
        if (a.rhythm === 'asistol') chance *= 0.5;
        if (a.cause === 'herniasi') chance = 0;
        if (rand() < Math.max(0, chance)) {
          rosc(p, t1);
          events.push({ kind: 'rosc', text: 'ROSC — nadi kembali teraba.' });
        }
      }
    }
    if (p.arrest && elapsed > 45 * 60) {
      p.dead = true;
      p.deathCause = `henti jantung (${causeLabel(a.cause)}) tanpa ROSC`;
      events.push({ kind: 'meninggal', text: 'Pasien meninggal.' });
    }
    p.memo = { gcs: 3, pao2: 30, map: 0, sa: 0.4, perfusion: 0, paco2: 70 };
    p.memoT = t1;
  }
  return events;
}

/**
 * Mantapkan keadaan awal saat pasien tiba: umpan balik kesadaran ↔ jalan napas ↔ oksigenasi
 * diselaraskan (tanpa lonjakan di detik pertama). Kejadian akut (sumbatan, apnea) belum
 * menghabiskan cadangan oksigen: saturasi awal tidak di bawah 80%, lalu turun bertahap.
 */
export function settlePhysio(p: PhysioState, s: Support, t: number): void {
  p.memoT = undefined;
  let v = computeVitals(p, s, t);
  for (let i = 0; i < 6; i++) {
    p.memo = { gcs: v.gcs.total, pao2: v.pao2, map: v.map ?? 0, sa: v.rawSa ?? (v.spo2 ?? 90) / 100, perfusion: v.perfusion };
    v = computeVitals(p, s, t);
  }
  // Kejadian akut: cadangan O₂ belum habis & CO₂ belum sempat menumpuk.
  p.memo.sa = Math.max(0.8, Math.min(p.memo.sa, 0.99));
  p.memo.paco2 = Math.min(v.rawPaco2 ?? v.paco2, 78);
  p.memoT = t;
  for (let i = 0; i < 4; i++) {
    v = computeVitals(p, s, t);
    p.memo = { gcs: v.gcs.total, pao2: v.pao2, map: v.map ?? 0, sa: p.memo.sa, perfusion: v.perfusion, paco2: p.memo.paco2 };
  }
}

export function rhythmLabel(r: Rhythm): string {
  switch (r) {
    case 'sinus':
      return 'irama sinus';
    case 'sinus_takikardia':
      return 'sinus takikardia';
    case 'sinus_bradikardia':
      return 'sinus bradikardia';
    case 'svt':
      return 'takikardia supraventrikular (SVT)';
    case 'af_rvr':
      return 'fibrilasi atrium respons cepat';
    case 'av_blok_total':
      return 'AV blok total';
    case 'vt':
      return 'takikardia ventrikel';
    case 'vf':
      return 'fibrilasi ventrikel (VF)';
    case 'pea':
      return 'PEA (aktivitas listrik tanpa nadi)';
    case 'asistol':
      return 'asistol';
  }
}

export function causeLabel(c: ArrestCause): string {
  return {
    hipoksia: 'hipoksia',
    hipovolemia: 'hipovolemia',
    hipo_hiperkalemia: 'gangguan kalium',
    tension: 'tension pneumotoraks',
    iskemia: 'iskemia miokard',
    toksin: 'toksin',
    herniasi: 'herniasi otak',
    asidosis: 'asidosis berat',
    primer: 'kardiak',
  }[c];
}
