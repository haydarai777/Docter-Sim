/**
 * Temuan pemeriksaan & hasil penunjang mode IGD, dihitung dari fisiologi SAAT pemeriksaan
 * dilakukan (+ temuan statis skenario). Karena bersumber dari variabel yang sama dengan
 * tanda vital, temuan selalu konsisten dengan monitor dan perjalanan pasien.
 */
import { EXAMS_BY_ID, TESTS_BY_ID } from './catalog';
import { airwayPatency, eff, rhythmLabel } from './physiology';
import type { EdPatient, EdScenario, ExamId, PhysioState, ResultContext, Support, TestId, Vitals } from './types';

const fmt = (n: number, d = 0) => n.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
const opposite = (s: 'kiri' | 'kanan') => (s === 'kiri' ? 'kanan' : 'kiri');

export function oxygenText(s: Support): string {
  if (s.assist === 'ventilator') return 'ventilator';
  if (s.assist === 'bvm') return 'BVM + O₂';
  switch (s.oxygen) {
    case 'udara':
      return 'udara ruangan';
    case 'nasal':
      return `kanul nasal ${s.flow} L/m`;
    case 'sungkup':
      return `sungkup ${s.flow} L/m`;
    case 'nrm':
      return `NRM ${s.flow} L/m`;
    case 'niv':
      return 'CPAP/NIV';
  }
}

/** Kemampuan bicara (A & anamnesis). */
export function speech(p: PhysioState, v: Vitals, s: Support, t: number): 'kalimat' | 'frasa' | 'kata' | 'tidak' {
  if (p.arrest || v.gcs.total <= 8 || s.adjunct === 'ett' || p.seizure) return 'tidak';
  if (p.airwayCause === 'benda_asing' && eff(p, 'airway', t) < 0.5) return 'tidak';
  const work = eff(p, 'spasm', t) + 0.5 * eff(p, 'reaction', t) + eff(p, 'edema', t) * 0.8 + eff(p, 'angioedema', t) * 0.8;
  if (work > 0.72 || v.rr > 36 || (v.spo2 ?? 100) < 82) return 'kata';
  if (work > 0.42 || v.rr > 28 || (v.spo2 ?? 100) < 90) return 'frasa';
  return 'kalimat';
}

function pupils(p: PhysioState, t: number): string {
  const sed = eff(p, 'sedation', t);
  const chol = eff(p, 'cholinergic', t);
  const icp = eff(p, 'icp', t);
  if (p.arrest && t - p.arrest.since > 300) return 'midriasis bilateral, refleks cahaya negatif';
  if (eff(p, 'brainInjury', t) > 0.65) return 'midriasis bilateral, refleks cahaya lambat/negatif';
  if (icp > 0.92) return 'midriasis bilateral, refleks cahaya negatif';
  if (icp > 0.55 && p.brainSide) return `anisokor — pupil ${p.brainSide} 5 mm, ${opposite(p.brainSide)} 3 mm; refleks cahaya ${p.brainSide} menurun`;
  if (chol > 0.3) return 'miosis 1–2 mm kedua mata, refleks cahaya lambat';
  if (sed > 0.35 && p.v.sedation > 0.3) return 'pin-point (± 1 mm) isokor';
  if (p.doses.atropin && chol < 0.2) return 'midriasis 5 mm isokor, refleks cahaya lambat';
  return 'isokor 3/3 mm, refleks cahaya +/+';
}

function skin(p: PhysioState, v: Vitals, t: number): string {
  const parts: string[] = [];
  const perf = v.perfusion;
  const tone = eff(p, 'tone', t) - 0.6 * eff(p, 'reaction', t) - 0.5 * eff(p, 'infection', t);
  if (p.arrest) return 'pucat keabuan, dingin';
  if ((v.spo2 ?? 100) < 85) parts.push('sianosis sentral (bibir & lidah kebiruan)');
  if (eff(p, 'reaction', t) > 0.2) parts.push('eritema & urtikaria menyeluruh');
  if (perf < 0.45) parts.push('mottled (bercak keunguan) di lutut');
  if (perf < 0.78 && tone >= 0.8) parts.push('pucat, dingin, lembap');
  else if (tone < 0.8 && eff(p, 'temp', t) > 37.8 && perf > 0.5) parts.push('hangat, kemerahan');
  else if (perf < 0.78) parts.push('dingin di ujung-ujung jari');
  if (eff(p, 'cholinergic', t) > 0.3) parts.push('basah berkeringat, fasikulasi otot');
  else if (eff(p, 'glucose', t) < 60 || eff(p, 'ischemia', t) > 0.3 || eff(p, 'pain', t) > 0.6) parts.push('berkeringat dingin');
  if (p.dehydration > 0.35) parts.push('turgor menurun, mukosa kering');
  return parts.length ? parts.join('; ') : 'hangat, kering, kemerahan normal';
}

function breathSounds(p: PhysioState, s: Support, t: number): string {
  const spasm = eff(p, 'spasm', t) + 0.55 * eff(p, 'reaction', t);
  const parts: string[] = [];
  const side = p.chestSide;
  const collapse = eff(p, 'ptx', t) + eff(p, 'obstruction', t);
  if (side && collapse > 0.25) {
    parts.push(`suara napas ${side} ${collapse > 0.55 ? 'tidak terdengar' : 'menurun'}, perkusi ${side} hipersonor`);
    if (eff(p, 'obstruction', t) > 0.4) parts.push(`trakea deviasi ke ${opposite(side)}`);
  }
  if (spasm > 0.82) parts.push('suara napas sangat lemah di kedua paru (silent chest)');
  else if (spasm > 0.2) parts.push(`mengi ekspiratoar ${spasm > 0.5 ? 'difus' : 'di kedua lapang paru'}, ekspirasi memanjang`);
  const edema = eff(p, 'edema', t);
  if (edema > 0.15) parts.push(`ronki basah halus ${edema > 0.5 ? 'hingga apeks kedua paru' : edema > 0.3 ? 'hingga setengah lapang paru' : 'di basal kedua paru'}`);
  if (eff(p, 'cholinergic', t) > 0.35) parts.push('ronki kasar difus (bronkorea)');
  if (eff(p, 'shunt', t) > 0.12 && eff(p, 'infection', t) > 0.1) parts.push('ronki basah kasar & suara napas bronkial di basal kanan');
  if (!parts.length) parts.push('vesikuler +/+, ronki −/−, mengi −/−');
  if (s.assist !== 'none') parts.push(`ventilasi dibantu ${s.assist === 'ventilator' ? 'ventilator' : 'BVM'}`);
  return parts.join('; ');
}

function pulseQuality(p: PhysioState, v: Vitals, t: number): string {
  if (!v.pulse) return 'nadi karotis TIDAK teraba';
  const irregular = v.rhythm === 'af_rvr';
  const pp = (v.sbp ?? 0) - (v.dbp ?? 0);
  const tone = eff(p, 'tone', t) - 0.55 * eff(p, 'infection', t) - 0.6 * eff(p, 'reaction', t);
  const strength = (v.map ?? 0) < 55 ? 'sangat lemah (filiformis), hanya teraba di karotis/femoral' : pp < 25 ? 'lemah' : tone < 0.8 && pp > 45 ? 'kuat (bounding)' : 'kuat angkat';
  return `nadi ${v.hr} x/menit ${irregular ? 'ireguler' : 'reguler'}, ${strength}`;
}

function jvp(p: PhysioState, t: number): string {
  if (eff(p, 'obstruction', t) > 0.3) return 'vena leher distensi';
  if (eff(p, 'edema', t) > 0.25 && eff(p, 'pump', t) < 0.85) return 'JVP meningkat (5+4 cmH₂O)';
  if (eff(p, 'volume', t) < 0.85) return 'vena leher kolaps';
  return 'JVP 5−2 cmH₂O';
}

function lateral(p: PhysioState, t: number): string {
  const parts: string[] = [];
  if (p.stroke) {
    const weak = opposite(p.stroke.side);
    const power = p.stroke.severity > 0.7 ? '0–1' : p.stroke.severity > 0.4 ? '2' : '3–4';
    parts.push(`hemiparesis ${weak} (kekuatan ${power}/5), wajah mencong ke ${p.stroke.side}`);
    if (p.stroke.aphasia) parts.push('afasia motorik (paham perintah, sulit berbicara)');
  } else if (eff(p, 'icp', t) > 0.45 && p.brainSide) parts.push(`kesan hemiparesis ${opposite(p.brainSide)}`);
  else parts.push('tidak ada lateralisasi yang jelas');
  return parts.join('; ');
}

export function gcsText(v: Vitals): string {
  const g = v.gcs;
  return g.intubated ? `E${g.e}VTM${g.m}` : `E${g.e}V${g.v}M${g.m} = ${g.total}`;
}

function staticFinding(sc: EdScenario, id: ExamId, ctx: ResultContext): string | null {
  const f = sc.findings?.[id];
  if (!f) return null;
  return typeof f === 'function' ? f(ctx) : f;
}

/** Teks hasil satu komponen pemeriksaan. */
export function examFinding(id: ExamId, patient: EdPatient, sc: EdScenario, v: Vitals, s: Support, t: number): string {
  const p = patient.physio;
  const ctx: ResultContext = { vitals: v, physio: p, patient, minute: (t - patient.arriveAt) / 60 };
  const extra = staticFinding(sc, id, ctx);
  const add = (base: string) => (extra ? `${base}. ${extra}` : base);
  if (patient.awayUntil !== null && t < patient.awayUntil) return 'Pasien sedang di ruang radiologi.';
  switch (id) {
    case 'A': {
      if (p.arrest) return add('Tidak berespons, tidak ada usaha napas spontan');
      if (s.adjunct === 'ett') return add('Terintubasi ETT, terfiksasi; tidak ada kebocoran');
      const parts: string[] = [];
      const patency = airwayPatency(p, s, t);
      const sp = speech(p, v, s, t);
      if (p.airwayCause === 'benda_asing' && eff(p, 'airway', t) < 0.5) parts.push('tidak bisa bicara/batuk, memegang leher (choking sign), stridor lemah — SUMBATAN BENDA ASING');
      else if (sp === 'kalimat') parts.push('paten — pasien berbicara kalimat utuh');
      else if (sp === 'frasa') parts.push('paten — bicara terputus-putus (frasa pendek)');
      else if (sp === 'kata') parts.push('paten, tetapi hanya mampu mengucap 1–2 kata');
      const ang = eff(p, 'angioedema', t);
      if (ang > 0.15) parts.push(`bibir & lidah bengkak${ang > 0.4 ? ', suara serak, stridor inspirasi' : ''}`);
      if (v.gcs.total <= 10 && s.adjunct === 'none' && patency < 0.9) parts.push('terdengar snoring — pangkal lidah jatuh');
      if (s.adjunct === 'opa' || s.adjunct === 'npa' || s.adjunct === 'manuver') parts.push(`jalan napas dibantu ${s.adjunct === 'manuver' ? 'manuver chin lift/jaw thrust' : s.adjunct.toUpperCase()}`);
      const secret = eff(p, 'cholinergic', t) > 0.25 || p.airwayCause === 'sekret';
      if (secret) parts.push(s.suctioned ? 'sekret berkurang setelah suction' : 'gurgling — banyak sekret/hipersalivasi di orofaring');
      if (p.airwayCause === 'inhalasi') parts.push('bulu hidung terbakar, jelaga di rongga mulut, suara serak');
      if (!parts.length) parts.push(patency > 0.85 ? 'paten' : 'jalan napas tidak paten');
      return add(cap(parts.join('; ')));
    }
    case 'B': {
      if (p.arrest) return add(`Tidak ada napas spontan${s.assist !== 'none' ? `; ventilasi ${s.assist === 'ventilator' ? 'ventilator' : 'BVM'}` : ''}`);
      const effort: string[] = [];
      const spasm = eff(p, 'spasm', t) + 0.55 * eff(p, 'reaction', t);
      if (eff(p, 'keto', t) > 0.35) effort.push('napas cepat & dalam (Kussmaul), bau keton');
      else if (v.rr <= 9) effort.push('napas lambat & dangkal');
      if (spasm > 0.45 || v.rr > 30 || eff(p, 'edema', t) > 0.35) effort.push('retraksi suprasternal & interkostal, otot bantu napas aktif');
      if (eff(p, 'fatigue', t) > 0.35) effort.push('tampak kelelahan, napas makin lemah');
      const chest = p.chestSide && eff(p, 'ptx', t) + eff(p, 'obstruction', t) > 0.3 ? `gerak dada ${p.chestSide} tertinggal` : 'gerak dada simetris';
      return add(`RR ${v.rr} x/menit, SpO₂ ${v.spo2 === null ? 'tidak terbaca' : `${v.spo2}%`} (${oxygenText(s)}). ${cap([...effort, chest].join('; '))}. Auskultasi: ${breathSounds(p, s, t)}`);
    }
    case 'C': {
      if (p.arrest) return add('Nadi karotis TIDAK teraba');
      const bp = v.sbp === null ? 'tidak terukur' : `${v.sbp}/${v.dbp} mmHg`;
      const heart = eff(p, 'edema', t) > 0.3 ? ', S3 gallop' : v.rhythm === 'af_rvr' ? ', bunyi jantung ireguler' : '';
      return add(`${cap(pulseQuality(p, v, t))}; TD ${bp}; CRT ${fmt(v.crt, 1)} detik; akral ${skin(p, v, t)}; ${jvp(p, t)}${heart}`);
    }
    case 'D': {
      if (p.arrest) return add(`GCS E1V1M1; pupil ${pupils(p, t)}`);
      const parts = [`GCS ${gcsText(v)}`, `pupil ${pupils(p, t)}`];
      if (p.seizure) parts.push('KEJANG UMUM TONIK-KLONIK sedang berlangsung');
      else if (eff(p, 'postictal', t) > 0.3) parts.push('pascaiktal, somnolen');
      parts.push(lateral(p, t));
      return add(cap(parts.join('; ')));
    }
    case 'E': {
      return add(`Suhu ${fmt(v.temp, 1)} °C; kulit ${skin(p, v, t)}`);
    }
    case 'kepala_leher':
      return add(cap(`${jvp(p, t)}; trakea ${p.chestSide && eff(p, 'obstruction', t) > 0.4 ? `deviasi ke ${opposite(p.chestSide)}` : 'di tengah'}; ${eff(p, 'angioedema', t) > 0.15 ? 'angioedema bibir & lidah' : 'tidak ada jejas yang tampak'}`));
    case 'dada': {
      const heart = eff(p, 'edema', t) > 0.3 ? 'S1-S2, S3 gallop' : v.rhythm === 'af_rvr' ? 'bunyi jantung ireguler' : p.arrest ? 'bunyi jantung tidak terdengar' : 'S1-S2 reguler, murmur (−), gallop (−)';
      return add(`Paru: ${breathSounds(p, s, t)}. Jantung: ${heart}`);
    }
    case 'abdomen':
      return add(eff(p, 'keto', t) > 0.35 ? 'Nyeri tekan difus ringan, tanpa defans; bising usus menurun' : 'Supel, nyeri tekan (−), defans (−), bising usus normal');
    case 'pelvis_ekstremitas':
      return add(cap(`${eff(p, 'edema', t) > 0.3 && eff(p, 'pump', t) < 0.85 ? 'edema pitting kedua tungkai' : 'tidak ada edema'}; nadi distal ${v.pulse ? ((v.map ?? 0) < 60 ? 'lemah' : 'teraba') : 'tidak teraba'}`));
    case 'punggung':
      return add('Log roll: tidak ada jejas atau nyeri tekan tulang belakang');
    case 'neurologis': {
      if (p.arrest) return add('Tidak dapat dinilai (henti jantung)');
      const mening = eff(p, 'infection', t) > 0.5 && sc.category === 'syok' ? 'kaku kuduk (−)' : 'kaku kuduk (−)';
      return add(cap(`GCS ${gcsText(v)}; pupil ${pupils(p, t)}; ${lateral(p, t)}; ${mening}`));
    }
    case 'obstetri':
      return add(patient.sex === 'female' ? 'Tidak ada temuan obstetri khusus' : 'Tidak relevan (pasien laki-laki)');
    case 'luka':
      return add('Tidak ada luka terbuka');
  }
}

export function examLabel(id: ExamId): string {
  return EXAMS_BY_ID.get(id)?.label ?? id;
}

const cap = (s: string) => (s ? s[0]!.toUpperCase() + s.slice(1) : s);

// ---------------------------------------------------------------------------
// Penunjang
// ---------------------------------------------------------------------------

export interface TestResult {
  text: string;
  abnormal: boolean;
}

function ekgText(p: PhysioState, v: Vitals, t: number): { text: string; abnormal: boolean } {
  const parts: string[] = [];
  let abnormal = false;
  if (p.arrest) {
    const r = p.arrest.rhythm;
    if (r === 'vf') return { text: 'Gelombang kacau tanpa kompleks QRS yang jelas — fibrilasi ventrikel (VF).', abnormal: true };
    if (r === 'vt') return { text: 'QRS lebar reguler ± 180 x/menit — takikardia ventrikel (TANPA nadi).', abnormal: true };
    if (r === 'asistol') return { text: 'Garis datar di dua sadapan (gain dinaikkan) — asistol.', abnormal: true };
    return { text: 'Kompleks QRS terorganisasi ± 44 x/menit, tetapi nadi tidak teraba — PEA.', abnormal: true };
  }
  switch (v.rhythm) {
    case 'svt':
      parts.push(`Takikardia QRS sempit reguler ${v.hr} x/menit, gelombang P tidak tampak — SVT`);
      abnormal = true;
      break;
    case 'af_rvr':
      parts.push(`Irama ireguler tanpa gelombang P, laju ${v.hr} x/menit — fibrilasi atrium respons cepat`);
      abnormal = true;
      break;
    case 'vt':
      parts.push(`QRS lebar (> 0,12 s) reguler ${v.hr} x/menit, disosiasi AV — takikardia ventrikel`);
      abnormal = true;
      break;
    case 'av_blok_total':
      parts.push(`Gelombang P (± 80 x/menit) tidak berhubungan dengan QRS; laju ventrikel ${v.hr} x/menit, QRS lebar — AV blok total`);
      abnormal = true;
      break;
    case 'sinus_bradikardia':
      parts.push(`Sinus bradikardia ${v.hr} x/menit`);
      abnormal = true;
      break;
    case 'sinus_takikardia':
      parts.push(`Sinus takikardia ${v.hr} x/menit, aksis normal`);
      abnormal = true;
      break;
    default:
      parts.push(`Irama sinus ${v.hr} x/menit, aksis normal`);
  }
  if (v.k >= 6.2) {
    parts.push('gelombang T tinggi runcing, QRS melebar');
    abnormal = true;
  } else if (v.k <= 3.0) {
    parts.push('gelombang U, ST depresi landai');
    abnormal = true;
  }
  if (!abnormal && eff(p, 'ischemia', t) < 0.05) parts.push('tidak ada perubahan ST-T');
  return { text: `${parts.join('; ')}.`, abnormal };
}

function cbc(p: PhysioState, v: Vitals, t: number): { text: string; abnormal: boolean } {
  const wbc = 7.6 + 15 * eff(p, 'infection', t) + 3.5 * Math.min(1, eff(p, 'pain', t) + eff(p, 'anxiety', t) * 0.5) + (p.seizure || eff(p, 'postictal', t) > 0.3 ? 4 : 0);
  const plt = 260 - 60 * eff(p, 'infection', t);
  const abnormal = v.hb < 11 || v.hb > 17.5 || wbc > 11 || plt < 150;
  return { text: `Hb ${fmt(v.hb, 1)} g/dL · Ht ${v.hct}% · leukosit ${fmt(wbc, 1)} ×10³/µL · trombosit ${Math.round(plt)} ×10³/µL`, abnormal };
}

/** Hasil penunjang (dihitung saat sampel diambil/pemeriksaan dilakukan). */
export function testResult(id: TestId, patient: EdPatient, sc: EdScenario, v: Vitals, s: Support, t: number): TestResult {
  const p = patient.physio;
  const ctx: ResultContext = { vitals: v, physio: p, patient, minute: (t - patient.arriveAt) / 60 };
  const spec = sc.tests?.[id];
  const resolve = (x: string | ((c: ResultContext) => string) | undefined) => (x === undefined ? undefined : typeof x === 'function' ? x(ctx) : x);
  const override = resolve(spec?.text);
  const extra = resolve(spec?.extra);
  const base = override !== undefined ? { text: override, abnormal: !/normal|negatif|tidak tampak|tidak ada/i.test(override) || /abnormal/i.test(override) } : computed(id, p, v, s, t);
  return { text: extra ? `${base.text} ${extra}` : base.text, abnormal: base.abnormal || !!extra };
}

function computed(id: TestId, p: PhysioState, v: Vitals, s: Support, t: number): TestResult {
  switch (id) {
    case 'gds':
      return { text: `GDS ${v.glucose} mg/dL`, abnormal: v.glucose < 70 || v.glucose > 200 };
    case 'ekg':
      return ekgText(p, v, t);
    case 'agd': {
      const be = Math.round((v.hco3 - 24.4 + 14.8 * (v.ph - 7.4)) * 10) / 10;
      const sa = v.spo2 ?? Math.round(100 / (1 + 23400 / (v.pao2 ** 3 + 150 * v.pao2)));
      const abnormal = v.ph < 7.35 || v.ph > 7.45 || v.paco2 > 45 || v.paco2 < 35 || v.pao2 < 70 || v.lactate > 2;
      return { text: `pH ${fmt(v.ph, 2)} · PaCO₂ ${v.paco2} · PaO₂ ${v.pao2} mmHg (${oxygenText(s)}) · HCO₃ ${fmt(v.hco3, 1)} · BE ${fmt(be, 1)} · SaO₂ ${sa}% · laktat ${fmt(v.lactate, 1)} mmol/L · K ${fmt(v.k, 1)}`, abnormal };
    }
    case 'keton': {
      const k = eff(p, 'keto', t);
      const bhb = k > 0.08 ? 0.6 + 6.5 * k : 0.2;
      return { text: `β-hidroksibutirat ${fmt(bhb, 1)} mmol/L${bhb >= 3 ? ' (tinggi)' : bhb >= 1.5 ? ' (meningkat)' : ' (normal)'}`, abnormal: bhb >= 1.5 };
    }
    case 'darah_lengkap':
      return cbc(p, v, t);
    case 'elektrolit':
      return { text: `Na ${v.na} · K ${fmt(v.k, 1)} · Cl ${Math.round(v.na - 36 - (24 - v.hco3) * 0.3)} mmol/L`, abnormal: v.k < 3.5 || v.k > 5.2 || v.na < 133 || v.na > 147 };
    case 'fungsi_ginjal': {
      const cr = 0.85 + Math.max(0, eff(p, 'lactate', t) - 2) * 0.25 + p.dehydration * 1.4 + eff(p, 'keto', t) * 0.6;
      const ur = 28 + (cr - 0.85) * 45;
      return { text: `Ureum ${Math.round(ur)} mg/dL · kreatinin ${fmt(cr, 2)} mg/dL`, abnormal: cr > 1.3 };
    }
    case 'fungsi_hati':
      return { text: 'SGOT 24 · SGPT 21 U/L · bilirubin total 0,7 mg/dL · albumin 4,1 g/dL', abnormal: false };
    case 'troponin': {
      const isch = eff(p, 'ischemia', t);
      return isch > 0.2 ? { text: `hs-cTnI ${Math.round(40 + 900 * isch)} ng/L (meningkat; batas atas 26 ng/L)`, abnormal: true } : { text: 'hs-cTnI 6 ng/L (normal)', abnormal: false };
    }
    case 'laktat':
      return { text: `Laktat ${fmt(v.lactate, 1)} mmol/L`, abnormal: v.lactate > 2 };
    case 'kultur_darah':
      return { text: 'Sampel kultur 2 set dikirim — hasil 2–3 hari (tidak tersedia selama jaga).', abnormal: false };
    case 'urinalisis': {
      const keto = eff(p, 'keto', t);
      return keto > 0.2 ? { text: `Glukosa +4, keton +${keto > 0.5 ? 3 : 2}, BJ 1.030, leukosit (−), nitrit (−)`, abnormal: true } : { text: 'BJ 1.015, protein (−), glukosa (−), keton (−), leukosit 0–2/LPB, eritrosit 0–1/LPB, nitrit (−)', abnormal: false };
    }
    case 'bhcg':
      return { text: 'β-hCG urin negatif', abnormal: false };
    case 'crossmatch':
      return { text: 'Golongan darah O Rh(+), crossmatch kompatibel — 4 kolf PRC siap di bank darah.', abnormal: false };
    case 'koagulasi':
      return { text: 'PT 12,8 detik (kontrol 12,0) · APTT 31 detik (kontrol 30) · INR 1,06', abnormal: false };
    case 'kolinesterase':
      return { text: 'Kolinesterase serum dalam batas normal', abnormal: false };
    case 'ns1':
      return { text: 'NS1 negatif, IgM/IgG anti-dengue negatif', abnormal: false };
    case 'rontgen_thorax': {
      const parts: string[] = [];
      const edema = eff(p, 'edema', t);
      const collapse = eff(p, 'ptx', t) + eff(p, 'obstruction', t);
      if (p.chestSide && collapse > 0.15) parts.push(`pneumotoraks ${p.chestSide} ${collapse > 0.5 ? 'luas dengan paru kolaps' : 'sebagian'}${eff(p, 'obstruction', t) > 0.4 ? ', mediastinum terdorong ke ' + opposite(p.chestSide) : ''}`);
      if (edema > 0.15) parts.push(`kardiomegali, sefalisasi, edema interstisial–alveolar ${edema > 0.4 ? '(bat-wing)' : ''}`.trim());
      if (eff(p, 'shunt', t) > 0.12 && eff(p, 'infection', t) > 0.1) parts.push('konsolidasi lobus bawah kanan dengan air bronchogram');
      if (eff(p, 'spasm', t) > 0.4) parts.push('hiperinflasi kedua paru');
      if (s.adjunct === 'ett') parts.push('ujung ETT ± 4 cm di atas karina');
      return parts.length ? { text: `${cap(parts.join('; '))}.`, abnormal: true } : { text: 'Cor dan pulmo dalam batas normal.', abnormal: false };
    }
    case 'rontgen_pelvis':
      return { text: 'Tidak tampak fraktur pelvis.', abnormal: false };
    case 'rontgen_ekstremitas':
      return { text: 'Tidak tampak fraktur atau dislokasi.', abnormal: false };
    case 'ct_kepala':
      return eff(p, 'icp', t) > 0.3 ? { text: 'Lesi hiperdens intrakranial dengan efek massa.', abnormal: true } : { text: 'Tidak tampak perdarahan, infark akut belum tampak, garis tengah tidak bergeser.', abnormal: false };
    case 'ct_abdomen':
      return { text: 'Tidak tampak cairan bebas atau cedera organ padat.', abnormal: false };
    case 'fast': {
      const parts: string[] = [];
      if (p.chestSide && eff(p, 'ptx', t) + eff(p, 'obstruction', t) > 0.2) parts.push(`lung sliding ${p.chestSide} menghilang (curiga pneumotoraks)`);
      if (eff(p, 'edema', t) > 0.3) parts.push('B-lines difus kedua paru');
      if (eff(p, 'volume', t) < 0.8) parts.push('vena kava inferior kolaps > 50%');
      return parts.length ? { text: `${cap(parts.join('; '))}. Tidak ada cairan bebas intraabdomen/perikardium.`, abnormal: true } : { text: 'Tidak ada cairan bebas di Morison, splenorenal, pelvis; perikardium normal; lung sliding +/+.', abnormal: false };
    }
    case 'usg_obstetri':
      return { text: 'Tidak ada kehamilan intrauterin.', abnormal: false };
  }
}

export function testLabel(id: TestId): string {
  return TESTS_BY_ID.get(id)?.label ?? id;
}

/** Ringkasan irama untuk monitor/log. */
export function rhythmText(v: Vitals): string {
  return rhythmLabel(v.rhythm);
}
