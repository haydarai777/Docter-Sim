/**
 * Penilaian & debrief mode IGD.
 *
 * Menilai SELURUH proses, bukan hanya diagnosis/kelangsungan hidup:
 *   triase 10 · penilaian awal 15 · diagnosis kerja 10 · penunjang 10 ·
 *   tindakan kritis & kecepatan 30 · terapi & dosis 10 · hasil & disposisi 15
 * dikurangi penalti keselamatan (tindakan berbahaya/tanpa indikasi).
 */
import { ATS_TARGET_MIN, DISPOSITIONS_BY_ID, ED_DIAGNOSES_BY_ID, EXAMS_BY_ID, TESTS_BY_ID } from './catalog';
import { DRUGS_BY_ID, GENERIC_HARMS } from './drugs';
import type { EdContext } from './engine';
import { firstTime } from './match';
import type { ActionMatch, Ats, Disposition, EdPatient, EdScenario, EdShift, ExamId, TestId, VitalSample } from './types';

export type PartId = 'triase' | 'awal' | 'diagnosis' | 'penunjang' | 'tindakan' | 'terapi' | 'hasil';

export interface EvalPart {
  id: PartId;
  label: string;
  score: number;
  max: number;
  notes: string[];
}

export interface CriticalResult {
  id: string;
  label: string;
  why: string;
  byMin: number;
  /** Menit sejak tiba saat dilakukan (null = tidak). */
  atMin: number | null;
  status: 'tepat_waktu' | 'terlambat' | 'tidak_dilakukan';
  weight: number;
}

export interface HarmResult {
  label: string;
  why: string;
  severity: 'ringan' | 'sedang' | 'berat';
  atMin: number;
  action: string;
}

export interface EdEvaluation {
  patientId: string;
  scenarioId: string;
  title: string;
  variantLabel: string | null;
  patientLabel: string;
  total: number;
  grade: string;
  parts: EvalPart[];
  penalty: number;
  critical: CriticalResult[];
  harms: HarmResult[];
  good: string[];
  missed: string[];
  outcome: EdPatient['outcome'];
  disposition: Disposition | null;
  timeline: VitalSample[];
  actions: { atMin: number; label: string; harm: boolean; dose?: 'kurang' | 'lebih' | 'tepat' }[];
  notes: { atMin: number; text: string; kind: 'buruk' | 'baik' | 'info' }[];
  debrief: EdScenario['debrief'];
  /** Ringkasan keputusan pemain vs kunci. */
  answers: { triage: Ats | null; triageKey: Ats; diagnosis: string | null; diagnosisKey: string[]; dispositionKey: Disposition[] };
}

const HARM_PENALTY = { ringan: 2, sedang: 5, berat: 10 } as const;

export function gradeOf(total: number): string {
  if (total >= 85) return 'Sangat baik';
  if (total >= 70) return 'Baik';
  if (total >= 55) return 'Cukup';
  if (total >= 40) return 'Kurang';
  return 'Perlu belajar lagi';
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const minOf = (p: EdPatient, t: number) => Math.max(0, (t - p.arriveAt) / 60);

/** Obat yang dianggap berindikasi pada skenario (eksplisit + yang disebut di tindakan kritis). */
function indicatedDrugs(sc: EdScenario): Set<string> {
  const out = new Set(sc.indicatedDrugs ?? []);
  const walk = (m: ActionMatch) => {
    if (m.kind === 'drug') out.add(m.id);
    if (m.kind === 'any' || m.kind === 'all') m.of.forEach(walk);
  };
  sc.critical.forEach((c) => walk(c.match));
  return out;
}

export function evaluatePatient(shift: EdShift, patient: EdPatient, ctx: EdContext): EdEvaluation {
  const sc = ctx.scenarios.get(patient.scenarioId)!;
  const variant = sc.variants?.find((v) => v.id === patient.variant) ?? null;
  const atsKey: Ats = variant?.ats ?? sc.ats;
  const dispoKey = variant?.disposition ?? sc.disposition;
  const end = patient.endedAt ?? shift.time;
  const parts: EvalPart[] = [];
  const good: string[] = [];
  const missed: string[] = [];

  // ---- 1. Triase ---------------------------------------------------------------
  {
    const notes: string[] = [];
    let score = 0;
    const ats = patient.ats;
    if (ats === null) notes.push('Pasien tidak ditriase.');
    else {
      const diff = ats - atsKey;
      if (diff === 0) {
        score = 10;
        good.push(`Triase tepat (ATS ${ats}).`);
      } else if (sc.atsAcceptable?.includes(ats)) {
        score = 7;
        notes.push(`ATS ${ats} masih dapat diterima (kunci ATS ${atsKey}).`);
      } else if (diff === -1) {
        score = 6;
        notes.push(`Over-triage: ATS ${ats} (kunci ATS ${atsKey}).`);
      } else if (diff === 1) {
        score = 3;
        notes.push(`Under-triage: ATS ${ats} (kunci ATS ${atsKey}) — pasien berisiko menunggu terlalu lama.`);
      } else notes.push(`Triase jauh meleset: ATS ${ats} (kunci ATS ${atsKey}).`);
      const delay = minOf(patient, patient.triagedAt ?? end);
      if (delay > 5 && atsKey <= 2) {
        score = Math.max(0, score - 3);
        notes.push(`Triase terlambat (${Math.round(delay)} menit setelah tiba).`);
      }
      const bed = shift.config.beds.find((b) => b.id === patient.bedId);
      if (bed?.kind === 'kursi' && atsKey <= 2) {
        score = Math.max(0, score - 2);
        notes.push('Pasien gawat ditempatkan di kursi observasi.');
      }
      if (bed?.kind === 'resusitasi' && atsKey >= 4) {
        score = Math.max(0, score - 1);
        notes.push('Bed resusitasi dipakai untuk kasus tidak urgen.');
      }
    }
    parts.push({ id: 'triase', label: 'Triase', score, max: 10, notes });
  }

  // ---- 2. Penilaian awal -------------------------------------------------------
  {
    const notes: string[] = [];
    let score = 0;
    const doneExam = (e: ExamId) => firstTime(patient, { kind: 'exam', id: e }, end) !== null;
    // Anamnesis singkat (AMPLE): alergi + minimal satu dari obat/riwayat/kejadian.
    const asked = new Set(patient.askedTopics);
    const ample = (asked.has('alergi') ? 1 : 0) + (['riwayat_obat', 'riwayat_penyakit', 'kejadian', 'onset'].some((t) => asked.has(t)) ? 1 : 0);
    score += ample;
    if (ample < 2) notes.push('Anamnesis singkat (AMPLE: alergi, obat, riwayat, makan terakhir, kejadian) belum lengkap.');
    if (atsKey <= 3) {
      const abcde = (['A', 'B', 'C', 'D', 'E'] as const).filter(doneExam);
      score += (abcde.length / 5) * 6;
      const skipped = (['A', 'B', 'C', 'D', 'E'] as const).filter((e) => !doneExam(e));
      if (skipped.length) {
        notes.push(`Survei primer tidak lengkap: ${skipped.join(', ')} tidak dinilai.`);
        missed.push(...skipped.map((e) => `Penilaian ${EXAMS_BY_ID.get(e)?.label ?? e}.`));
      } else good.push('Survei primer ABCDE lengkap.');
      const mon = firstTime(patient, { kind: 'any', of: [{ kind: 'proc', id: 'monitor' }, { kind: 'proc', id: 'pad_defib' }] }, end);
      if (atsKey <= 2) {
        if (mon !== null && minOf(patient, mon) <= 10) score += 2;
        else notes.push('Monitor tanda vital tidak dipasang dalam 10 menit.');
      } else score += 2;
    } else {
      const any = Object.keys(patient.exams).length > 0;
      score += any ? 8 : 0;
      if (!any) notes.push('Tidak ada pemeriksaan fisik terarah.');
    }
    const target = ATS_TARGET_MIN[atsKey];
    const seen = patient.firstSeenAt;
    if (seen === null) notes.push('Pasien tidak pernah diperiksa dokter.');
    else {
      const wait = minOf(patient, seen);
      const allowed = Math.max(2, target);
      if (wait <= allowed) {
        score += 5;
        good.push(`Respons dokter ${Math.round(wait)} menit (target ATS ${atsKey}: ≤ ${target} menit).`);
      } else {
        score += Math.max(0, 5 * (1 - (wait - allowed) / (allowed + 10)));
        notes.push(`Dokter pertama kali menangani setelah ${Math.round(wait)} menit (target ≤ ${target} menit).`);
      }
    }
    parts.push({ id: 'awal', label: 'Penilaian awal', score: round1(score), max: 15, notes });
  }

  // ---- 3. Diagnosis kerja ------------------------------------------------------
  {
    const notes: string[] = [];
    let score = 0;
    const dx = patient.diagnosis.primary;
    const secondaryKey = sc.diagnosis.secondary ?? [];
    const primaryMax = secondaryKey.length ? 8 : 10;
    if (!dx) notes.push('Diagnosis kerja tidak dicatat.');
    else if (sc.diagnosis.primary.includes(dx)) {
      score += primaryMax;
      good.push(`Diagnosis kerja tepat: ${ED_DIAGNOSES_BY_ID.get(dx)?.name ?? dx}.`);
    } else if (sc.diagnosis.acceptable?.includes(dx)) {
      score += primaryMax * 0.7;
      notes.push(`Diagnosis "${ED_DIAGNOSES_BY_ID.get(dx)?.name ?? dx}" mendekati; yang paling tepat: ${sc.diagnosis.primary.map((d) => ED_DIAGNOSES_BY_ID.get(d)?.name ?? d).join(' / ')}.`);
    } else notes.push(`Diagnosis kerja "${ED_DIAGNOSES_BY_ID.get(dx)?.name ?? dx}" tidak tepat; seharusnya ${sc.diagnosis.primary.map((d) => ED_DIAGNOSES_BY_ID.get(d)?.name ?? d).join(' / ')}.`);
    if (secondaryKey.length) {
      const all = [dx, ...patient.diagnosis.secondary];
      const hit = secondaryKey.filter((d) => all.includes(d) && !(sc.diagnosis.primary.includes(d) && d === dx));
      if (hit.length || secondaryKey.every((d) => sc.diagnosis.primary.includes(d) && all.includes(d))) score += 2;
      else {
        notes.push(`Masalah penyerta belum dicatat: ${secondaryKey.map((d) => ED_DIAGNOSES_BY_ID.get(d)?.name ?? d).join(', ')}.`);
        missed.push(`Masalah penyerta: ${secondaryKey.map((d) => ED_DIAGNOSES_BY_ID.get(d)?.name ?? d).join(', ')}.`);
      }
    }
    parts.push({ id: 'diagnosis', label: 'Diagnosis kerja', score: round1(score), max: 10, notes });
  }

  // ---- 4. Penunjang -------------------------------------------------------------
  {
    const notes: string[] = [];
    const ordered = new Set(patient.tests.map((t) => t.id));
    const indicated = sc.indicatedTests;
    const allowed = new Set<TestId>([...indicated, ...(sc.optionalTests ?? [])]);
    const got = indicated.filter((t) => ordered.has(t));
    let score = indicated.length ? (got.length / indicated.length) * 7 : 7;
    const lacking = indicated.filter((t) => !ordered.has(t));
    if (lacking.length) {
      notes.push(`Penunjang berindikasi yang tidak diminta: ${lacking.map((t) => TESTS_BY_ID.get(t)?.label ?? t).join(', ')}.`);
      missed.push(...lacking.map((t) => `Pemeriksaan ${TESTS_BY_ID.get(t)?.label ?? t}.`));
    }
    const extra = [...ordered].filter((t) => !allowed.has(t));
    let bonus = 3 - extra.length * 1.5;
    if (extra.length) notes.push(`Penunjang tanpa indikasi: ${extra.map((t) => TESTS_BY_ID.get(t)?.label ?? t).join(', ')} (waktu, biaya, risiko).`);
    if (!extra.length && !lacking.length && indicated.length) good.push('Pemilihan penunjang tepat sesuai indikasi.');
    score += Math.max(0, bonus);
    bonus = 0;
    parts.push({ id: 'penunjang', label: 'Pemeriksaan penunjang', score: round1(Math.max(0, score)), max: 10, notes });
  }

  // ---- 5. Tindakan kritis & kecepatan -----------------------------------------------
  const critical: CriticalResult[] = [];
  {
    const notes: string[] = [];
    let sum = 0;
    let weights = 0;
    for (const c of sc.critical) {
      if (c.onlyIf && !c.onlyIf(patient)) continue;
      const t = firstTime(patient, c.match, end);
      const atMin = t === null ? null : round1(minOf(patient, t));
      let factor = 0;
      let status: CriticalResult['status'] = 'tidak_dilakukan';
      if (atMin !== null) {
        if (atMin <= c.byMin + 0.05) {
          factor = 1;
          status = 'tepat_waktu';
        } else {
          factor = Math.max(0.3, 1 - (atMin - c.byMin) / (c.byMin * 2 + 10));
          status = 'terlambat';
        }
      }
      sum += factor * c.weight;
      weights += c.weight;
      critical.push({ id: c.id, label: c.label, why: c.why, byMin: c.byMin, atMin, status, weight: c.weight });
      if (status === 'tepat_waktu') good.push(`${c.label} — menit ke-${atMin}.`);
      else if (status === 'terlambat') notes.push(`${c.label}: terlambat (menit ke-${atMin}, target ≤ ${c.byMin}).`);
      else notes.push(`${c.label}: tidak dilakukan.`);
    }
    const score = weights ? (30 * sum) / weights : 30;
    parts.push({ id: 'tindakan', label: 'Tindakan kritis & kecepatan', score: round1(score), max: 30, notes });
  }

  // ---- 6. Terapi & dosis ---------------------------------------------------------------
  {
    const notes: string[] = [];
    let score = 10;
    const ok = indicatedDrugs(sc);
    const seen = new Set<string>();
    for (const a of patient.actions) {
      if (a.type !== 'drug') continue;
      const name = DRUGS_BY_ID.get(a.id)?.name ?? a.id;
      if (!ok.has(a.id) && !seen.has(a.id)) {
        score -= 1.5;
        notes.push(`${name}: tidak berindikasi pada kasus ini.`);
      }
      if (a.doseNote === 'kurang') {
        score -= 1;
        notes.push(`${a.label}: dosis kurang.`);
      } else if (a.doseNote === 'lebih') {
        score -= 2;
        notes.push(`${a.label}: dosis berlebih.`);
      }
      seen.add(a.id);
    }
    // Terapi farmakologis yang diperlukan (obat di tindakan kritis yang berlaku) tidak diberikan sama sekali.
    const needed = new Set<string>();
    const walk = (m: ActionMatch) => {
      if (m.kind === 'drug') needed.add(m.id);
      if (m.kind === 'any' || m.kind === 'all') m.of.forEach(walk);
    };
    sc.critical.filter((c) => !c.onlyIf || c.onlyIf(patient)).forEach((c) => walk(c.match));
    if (needed.size && ![...needed].some((d) => seen.has(d))) {
      score = 0;
      notes.push('Terapi farmakologis yang diperlukan tidak diberikan.');
    }
    parts.push({ id: 'terapi', label: 'Ketepatan terapi & dosis', score: round1(Math.max(0, score)), max: 10, notes });
  }

  // ---- 7. Hasil & disposisi ------------------------------------------------------------
  {
    const notes: string[] = [];
    let score = 0;
    const outcome = patient.outcome;
    if (outcome === 'stabil') {
      score += 9;
      good.push('Pasien stabil saat meninggalkan IGD.');
    } else if (outcome === 'tidak_stabil') {
      score += 3;
      notes.push('Pasien belum stabil saat meninggalkan IGD/akhir jaga.');
    } else if (outcome === 'meninggal') notes.push(`Pasien meninggal${patient.physio.deathCause ? ` (${patient.physio.deathCause})` : ''}.`);
    const d = patient.disposition?.to ?? null;
    if (!d) notes.push('Belum ada disposisi.');
    else if (d === 'meninggal') {
      /* tanpa poin disposisi */
    } else if (dispoKey.best.includes(d)) {
      score += 6;
      good.push(`Disposisi tepat: ${DISPOSITIONS_BY_ID.get(d)?.label}.`);
    } else if (dispoKey.acceptable?.includes(d)) {
      score += 4;
      notes.push(`Disposisi ${DISPOSITIONS_BY_ID.get(d)?.label} dapat diterima; paling tepat: ${dispoKey.best.map((x) => DISPOSITIONS_BY_ID.get(x)?.label).join(' / ')}.`);
    } else notes.push(`Disposisi ${DISPOSITIONS_BY_ID.get(d)?.label} kurang tepat; seharusnya ${dispoKey.best.map((x) => DISPOSITIONS_BY_ID.get(x)?.label).join(' / ')}.`);
    parts.push({ id: 'hasil', label: 'Hasil & disposisi', score, max: 15, notes });
  }

  // ---- Keselamatan ----------------------------------------------------------------------
  const harms: HarmResult[] = [];
  for (const a of patient.actions) {
    for (const h of a.harms ?? []) {
      const rule = sc.harmful?.find((x) => x.id === h);
      const g = GENERIC_HARMS[h];
      const info = rule ? { label: rule.label, why: rule.why, severity: rule.severity } : g ? { label: g.label, why: g.why, severity: g.severity } : null;
      if (!info) continue;
      if (harms.some((x) => x.label === info.label)) continue;
      harms.push({ ...info, atMin: round1(minOf(patient, a.t)), action: a.label });
    }
  }
  const penalty = Math.min(30, harms.reduce((s, h) => s + HARM_PENALTY[h.severity], 0));

  // ---- Informasi yang terlewat -------------------------------------------------------------
  const asked = new Set(patient.askedTopics);
  const informantTopics = new Set(Object.values(sc.informants).flatMap((i) => Object.keys(i?.topics ?? {})));
  const important: [string, string][] = [
    ['alergi', 'Riwayat alergi (sebelum memberi obat).'],
    ['riwayat_obat', 'Obat yang dikonsumsi.'],
    ['riwayat_penyakit', 'Riwayat penyakit.'],
    ['kejadian', 'Kronologi kejadian/mekanisme.'],
  ];
  for (const [topic, label] of important) {
    if (topic === 'alergi' || informantTopics.has(topic)) {
      if (!asked.has(topic)) missed.push(`Anamnesis: ${label}`);
    }
  }
  for (const [exam, text] of Object.entries(sc.findings ?? {}) as [ExamId, unknown][]) {
    if (!patient.exams[exam] && typeof text === 'string') missed.push(`Temuan ${EXAMS_BY_ID.get(exam)?.label ?? exam}: ${text}`);
  }

  const raw = parts.reduce((s, p) => s + p.score, 0);
  const total = Math.max(0, Math.min(100, Math.round(raw - penalty)));
  return {
    patientId: patient.id,
    scenarioId: sc.id,
    title: sc.title,
    variantLabel: variant?.label ?? null,
    patientLabel: `${patient.name}, ${patient.age < 1 ? 'bayi' : `${patient.age} th`}, ${patient.sex === 'male' ? 'laki-laki' : 'perempuan'}`,
    total,
    grade: gradeOf(total),
    parts,
    penalty,
    critical,
    harms,
    good,
    missed,
    outcome: patient.outcome,
    disposition: patient.disposition?.to ?? null,
    timeline: patient.timeline,
    actions: patient.actions
      .filter((a) => a.type !== 'ask')
      .map((a) => ({ atMin: round1(minOf(patient, a.t)), label: a.label, harm: !!a.harms?.length, ...(a.doseNote ? { dose: a.doseNote } : {}) })),
    notes: patient.notes.map((n) => ({ atMin: round1(minOf(patient, n.t)), text: n.text, kind: n.kind })),
    debrief: sc.debrief,
    answers: { triage: patient.ats, triageKey: atsKey, diagnosis: patient.diagnosis.primary, diagnosisKey: sc.diagnosis.primary, dispositionKey: dispoKey.best },
  };
}

export interface ShiftSummary {
  patients: number;
  seen: number;
  stable: number;
  died: number;
  average: number;
  grade: string;
  harms: number;
  /** Rata-rata menit tiba → ditangani dokter. */
  meanResponse: number | null;
  evaluations: EdEvaluation[];
}

export function evaluateShift(shift: EdShift, ctx: EdContext): ShiftSummary {
  const arrived = shift.patients.filter((p) => p.status !== 'akan_datang');
  const evaluations = arrived.map((p) => evaluatePatient(shift, p, ctx));
  const responses = arrived.filter((p) => p.firstSeenAt !== null).map((p) => (p.firstSeenAt! - p.arriveAt) / 60);
  const average = evaluations.length ? Math.round(evaluations.reduce((s, e) => s + e.total, 0) / evaluations.length) : 0;
  return {
    patients: arrived.length,
    seen: arrived.filter((p) => p.firstSeenAt !== null).length,
    stable: arrived.filter((p) => p.outcome === 'stabil').length,
    died: arrived.filter((p) => p.outcome === 'meninggal').length,
    average,
    grade: gradeOf(average),
    harms: evaluations.reduce((s, e) => s + e.harms.length, 0),
    meanResponse: responses.length ? Math.round((responses.reduce((a, b) => a + b, 0) / responses.length) * 10) / 10 : null,
    evaluations,
  };
}
