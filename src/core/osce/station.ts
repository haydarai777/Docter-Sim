/**
 * Penilaian stasiun OSCE: 7 tugas (LT) diskor 0–1–2 → total /14 → Superior / Lulus / Tidak lulus.
 *
 * LT1–LT4 memakai penilaian klinis yang sudah ada (evaluation.ts) lalu dipetakan ke skala 0–2;
 * LT5–LT7 (farmakologi + resep, non-farmakologi, KIE) dinilai dari kunci per penyakit.
 * Kesalahan kritis (salah diagnosis kerja, obat berbahaya/alergi, pasien gawat dipulangkan)
 * menyebabkan tidak lulus apa pun totalnya — sesuai rubrik OSCE komprehensif.
 */
import { matchesCondition, type ConditionContext } from '../conditions';
import { caseContext, dispositionCredit, evaluateEncounter, expectedDisposition } from '../evaluation';
import type { ClinicalDecision, EncounterState, EvaluationResult, GameConfig, GameContent } from '../types';
import type { OsceContent } from './content';
import { evaluatePrescription, scorePrescription } from './prescription';
import { type AdviceOption, KIE_CATEGORIES, type KieCategory, type LtKey, type LtResult, type OsceCategory, type OsceResult, type OsceWork } from './types';

export const KIE_LABEL: Record<KieCategory, string> = {
  diagnosis: 'Penjelasan penyakit',
  pengobatan: 'Pengobatan & kepatuhan',
  efek_samping: 'Efek samping obat',
  tanda_bahaya: 'Tanda bahaya (kapan segera kembali)',
  kontrol: 'Jadwal kontrol',
  pencegahan: 'Pencegahan',
};

const DEFAULT_KIE_REQUIRED: KieCategory[] = ['diagnosis', 'pengobatan', 'tanda_bahaya', 'kontrol'];

export const LT_INFO: Record<LtKey, { no: number; label: string; criteria: [string, string, string] }> = {
  anamnesis: { no: 1, label: 'Anamnesis', criteria: ['Tidak dilakukan / sangat kurang', 'Sebagian poin penting', 'Lengkap & terarah (termasuk tanda bahaya)'] },
  fisik: { no: 2, label: 'Pemeriksaan fisik', criteria: ['Tidak dilakukan', 'Pemeriksaan umum saja / kurang terarah', 'Lengkap: tanda vital + pemeriksaan spesifik'] },
  penunjang: { no: 3, label: 'Usulan & interpretasi penunjang', criteria: ['Salah usul / salah interpretasi', 'Usul atau interpretasi sebagian', 'Usul tepat indikasi & interpretasi benar'] },
  diagnosis: { no: 4, label: 'Diagnosis kerja & banding', criteria: ['Diagnosis kerja salah', 'Diagnosis benar tanpa ≥ 2 banding relevan', 'Diagnosis benar + ≥ 2 diagnosis banding relevan'] },
  farmakologi: { no: 5, label: 'Tatalaksana farmakologi & resep', criteria: ['Obat salah / berbahaya / tidak diberikan', 'Obat utama benar, dosis/aturan/pendukung kurang', 'Obat, dosis, aturan pakai & jumlah tepat'] },
  nonfarmakologi: { no: 6, label: 'Tatalaksana non-farmakologi & disposisi', criteria: ['Tidak ada / ada saran berbahaya', 'Sebagian saran tepat / disposisi kurang tepat', 'Saran lengkap & disposisi tepat'] },
  kie: { no: 7, label: 'Komunikasi, informasi & edukasi (KIE)', criteria: ['Tidak ada / edukasi keliru', 'KIE sebagian', 'KIE lengkap: penyakit, pengobatan, tanda bahaya, kontrol'] },
};

/** Saran yang benar untuk kasus ini (memperhitungkan kondisi when/whenAny). */
export function adviceApplies(a: AdviceOption, ctx: ConditionContext): boolean {
  if (a.kind !== 'benar') return false;
  if (a.when && !matchesCondition(a.when, ctx)) return false;
  if (a.whenAny && !a.whenAny.some((w) => matchesCondition(w, ctx))) return false;
  return true;
}

function bucket(fraction: number, full: number, half: number): 0 | 1 | 2 {
  return fraction >= full ? 2 : fraction >= half ? 1 : 0;
}

function lt(key: LtKey, score: 0 | 1 | 2, done: string[], missed: string[], keyAnswer: string[]): LtResult {
  const info = LT_INFO[key];
  return { key, no: info.no, label: info.label, score, criteria: info.criteria, done, missed, key_answer: keyAnswer };
}

/** Parameter penunjang abnormal pada pemeriksaan berbayar yang sudah dilakukan ("alat.param"). */
export function abnormalParams(state: EncounterState, content: GameContent, config: GameConfig): string[] {
  const out: string[] = [];
  for (const t of state.examsDone) {
    const tool = content.toolsById.get(t);
    if (!tool || tool.category === 'fisik' || (config.toolPrices[t] ?? 0) <= 0) continue;
    for (const r of state.case.findings[t] ?? []) if (r.flag !== null) out.push(`${t}.${r.paramId}`);
  }
  return out;
}

/** Penilaian perilaku profesional dari transkrip (salam, identitas, izin periksa, empati/penutup). */
export function professionalBehaviour(state: EncounterState): OsceResult['professional'] {
  const doctor = state.log.filter((e) => e.kind === 'doctor').map((e) => (e as { text: string }).text.toLowerCase());
  const firstExam = state.log.findIndex((e) => e.kind === 'exam');
  const before = (state.log.slice(0, firstExam < 0 ? state.log.length : firstExam).filter((e) => e.kind === 'doctor') as { text: string }[]).map((e) => e.text.toLowerCase());
  const done: string[] = [];
  const missed: string[] = [];
  const check = (ok: boolean, good: string, bad: string) => (ok ? done.push(good) : missed.push(bad));
  check(
    doctor.slice(0, 3).some((t) => /\b(selamat (pagi|siang|sore|malam)|halo|assalamu|permisi|perkenalkan|saya (dokter|dr)\b)/.test(t)),
    'Membuka dengan salam/perkenalan diri',
    'Belum memberi salam & memperkenalkan diri di awal',
  );
  check(state.askedTopics.includes('identitas_nama') || state.askedTopics.includes('identitas_umur'), 'Mengonfirmasi identitas pasien', 'Belum mengonfirmasi identitas pasien (nama/umur)');
  check(
    firstExam >= 0 && before.some((t) => /\b(izin|ijin|permisi|boleh saya|saya (akan )?periksa|kita periksa|periksa dulu)\b/.test(t)),
    'Meminta izin sebelum memeriksa',
    firstExam < 0 ? 'Tidak melakukan pemeriksaan fisik' : 'Belum meminta izin/persetujuan sebelum memeriksa (informed consent)',
  );
  check(
    doctor.some((t) => /(saya (mengerti|paham)|turut prihatin|jangan (khawatir|cemas)|tidak perlu khawatir|semoga lekas|semoga cepat|terima kasih|ada yang (ingin|mau) ditanyakan)/.test(t)),
    'Menunjukkan empati / menutup konsultasi dengan baik',
    'Belum menunjukkan empati atau menutup konsultasi (mis. "Ada yang ingin ditanyakan?")',
  );
  const score: 0 | 1 | 2 = done.length >= 3 ? 2 : done.length >= 1 ? 1 : 0;
  return { score, done, missed };
}

export interface StationTiming {
  secondsUsed: number | null;
  timeUp: boolean;
}

export function categoryOf(percent: number, critical: readonly string[]): OsceCategory {
  if (critical.length > 0) return 'tidak_lulus';
  if (percent >= 90) return 'superior';
  if (percent >= 70) return 'lulus';
  return 'tidak_lulus';
}

export const CATEGORY_LABEL: Record<OsceCategory, string> = { superior: 'Superior', lulus: 'Lulus', tidak_lulus: 'Tidak lulus' };

export function evaluateStation(
  state: EncounterState,
  decision: ClinicalDecision,
  work: OsceWork,
  content: GameContent,
  osce: OsceContent,
  config: GameConfig,
  timing: StationTiming = { secondsUsed: null, timeUp: false },
): { result: OsceResult; clinical: EvaluationResult } {
  const c = state.case;
  const disease = content.diseasesById.get(c.diseaseId)!;
  const caseDef = osce.casesById.get(c.diseaseId);
  if (!caseDef) throw new Error(`Kunci OSCE untuk "${c.diseaseId}" belum ada.`);
  const ctx = caseContext(state);
  const clinical = evaluateEncounter(state, decision, content, config);
  const comp = (key: string) => clinical.components.find((x) => x.key === key)!;
  const frac = (key: string) => {
    const x = comp(key);
    return x.max > 0 ? x.score / x.max : 1;
  };
  const texts = (items: { text: string; detail?: string }[]) => items.map((i) => (i.detail ? `${i.text} — ${i.detail}` : i.text));
  const critical: string[] = [];
  const tasks: LtResult[] = [];
  const topicLabel = (id: string) => content.anamnesisById.get(id)?.label ?? id;
  const toolLabel = (id: string) => content.toolsById.get(id)?.name ?? id;

  // LT1 — Anamnesis
  {
    const x = comp('anamnesis');
    const keyTopics = [...new Set([...(disease.plan.keyTopics ?? []), ...Object.entries(disease.anamnesis).filter(([, v]) => v.some((a) => a.clue)).map(([k]) => k)])];
    tasks.push(lt('anamnesis', bucket(frac('anamnesis'), 0.8, 0.45), texts(x.good), texts(x.missed), [`Topik kunci: ${keyTopics.map(topicLabel).join(', ')}`]));
  }
  // LT2 — Pemeriksaan fisik
  {
    const x = comp('fisik');
    const exams = ['tanda_vital', ...disease.plan.exams.filter((e) => matchesCondition(e.when, ctx)).map((e) => e.tool)];
    tasks.push(lt('fisik', bucket(frac('fisik'), 0.85, 0.5), texts(x.good), texts(x.missed), [`Pemeriksaan yang diharapkan: ${[...new Set(exams)].map(toolLabel).join(', ')}`]));
  }
  // LT3 — Penunjang & interpretasi (tandai hasil abnormal)
  {
    const x = comp('penunjang');
    const abnormal = abnormalParams(state, content, config);
    const performed = new Set(state.examsDone);
    const marks = work.abnormalMarks.filter((m) => performed.has(m.split('.')[0]!));
    const truePos = marks.filter((m) => abnormal.includes(m)).length;
    const precision = marks.length ? truePos / marks.length : abnormal.length ? 0 : 1;
    const recall = abnormal.length ? truePos / abnormal.length : 1;
    const interp = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    const f = frac('penunjang');
    const score: 0 | 1 | 2 = f >= 0.75 && interp >= 0.8 ? 2 : f >= 0.4 || interp >= 0.5 ? 1 : 0;
    const label = (m: string) => {
      const [t, p] = m.split('.');
      const r = c.findings[t!]?.find((q) => q.paramId === p);
      return r ? `${toolLabel(t!)}: ${r.label} ${r.display}` : m;
    };
    const missedMarks = abnormal.filter((m) => !marks.includes(m)).map((m) => `Hasil abnormal tidak dikenali: ${label(m)}`);
    const wrongMarks = marks.filter((m) => !abnormal.includes(m)).map((m) => `Ditandai abnormal padahal normal: ${label(m)}`);
    const done = [...texts(x.good), ...(truePos ? [`Mengenali ${truePos} hasil abnormal dengan benar`] : [])];
    const tests = disease.plan.tests.filter((t) => matchesCondition(t.when, ctx)).map((t) => `${toolLabel(t.tool)} (${t.role})`);
    tasks.push(lt('penunjang', score, done, [...texts(x.missed), ...missedMarks, ...wrongMarks], [tests.length ? `Penunjang sesuai indikasi: ${tests.join(', ')}` : 'Diagnosis klinis — penunjang tidak wajib bila tanpa tanda bahaya']));
  }
  // LT4 — Diagnosis kerja & banding
  {
    const relevant = new Set([...disease.differentials.map((d) => d.id)]);
    const ddOnBoard = state.ddx.filter((d) => d.id !== c.diseaseId && relevant.has(d.id));
    const correct = decision.primary === c.diseaseId;
    const score: 0 | 1 | 2 = !correct ? 0 : ddOnBoard.length >= 2 ? 2 : 1;
    if (!correct) critical.push(decision.primary ? `Diagnosis kerja salah (${content.catalogById.get(decision.primary)?.name ?? decision.primary}).` : 'Diagnosis kerja tidak ditetapkan.');
    const name = (id: string) => content.catalogById.get(id)?.name ?? id;
    const done = correct ? [`Diagnosis kerja tepat: ${disease.name}`] : [];
    if (ddOnBoard.length) done.push(`Diagnosis banding relevan: ${ddOnBoard.map((d) => name(d.id)).join(', ')}`);
    const missed = correct ? [] : [`Diagnosis kerja seharusnya ${disease.name}`];
    if (ddOnBoard.length < 2) missed.push(`Diagnosis banding relevan kurang dari 2 (ada ${ddOnBoard.length})`);
    tasks.push(lt('diagnosis', score, done, missed, [`${disease.name}; banding: ${disease.differentials.slice(0, 4).map((d) => name(d.id)).join(', ')}`]));
  }
  // LT5 — Farmakologi & resep
  {
    const ev = evaluatePrescription(work.prescription, caseDef, c, ctx, osce, state.examsDone.includes('timbangan'));
    const { score, critical: crit } = scorePrescription(ev, work.prescription, osce);
    critical.push(...crit);
    const drugName = (i: number) => osce.drugsById.get(work.prescription[i]!.drug)?.name ?? work.prescription[i]!.drug;
    const done: string[] = [];
    const missed: string[] = [...crit];
    for (const it of ev.items) {
      if (it.status === 'tepat') done.push(`${it.item.label}: ${drugName(it.line!)} tepat`);
      else if (it.status === 'kurang_tepat') missed.push(`${it.item.label}: ${drugName(it.line!)} — ${it.problems.join('; ')}`);
      else if (it.item.role !== 'opsional') missed.push(`${it.item.label} (${it.item.role}) belum diresepkan — ${it.item.reason}`);
    }
    for (const a of ev.avoided) if (a.rule.severity === 'salah') missed.push(`${a.drug.name} tidak tepat: ${a.rule.reason}`);
    for (const i of ev.extras) missed.push(`${drugName(i)} tidak diperlukan pada kasus ini`);
    for (const q of ev.quantityIssues) missed.push(`Jumlah (No.) ${drugName(q.line)} seharusnya ${q.expected} sesuai aturan pakai`);
    const items = caseDef.therapy.items.filter((i) => matchesCondition(i.when, ctx));
    const keyAnswer = items.map((i) => `${i.label} (${i.role}): ${i.options.map((o) => o.label).join(' ATAU ')}`);
    if (caseDef.therapy.note) keyAnswer.push(caseDef.therapy.note);
    tasks.push(lt('farmakologi', score, done, missed, keyAnswer));
  }
  // LT6 — Non-farmakologi & disposisi
  {
    const chosen = caseDef.nonPharm.filter((a) => work.nonPharm.includes(a.id));
    const applicable = caseDef.nonPharm.filter((a) => adviceApplies(a, ctx));
    const correct = chosen.filter((a) => adviceApplies(a, ctx));
    const harmful = chosen.filter((a) => a.kind === 'berbahaya');
    const distract = chosen.filter((a) => a.kind !== 'berbahaya' && !adviceApplies(a, ctx));
    const exp = expectedDisposition(disease, ctx);
    const dispOk = dispositionCredit(decision.disposition, exp.value, exp.alsoAccept) === 1;
    if (clinical.unsafe) critical.push(`Pasien yang perlu ${exp.value.replace('_', ' ')} justru ${decision.disposition.replace('_', ' ')}.`);
    const need = Math.min(3, applicable.length);
    const score: 0 | 1 | 2 = harmful.length ? 0 : correct.length >= need && dispOk && distract.length <= 1 ? 2 : correct.length >= 1 || dispOk ? 1 : 0;
    const done = correct.map((a) => a.text);
    if (dispOk) done.push(`Disposisi tepat: ${decision.disposition.replace('_', ' ')}`);
    const missed = [
      ...harmful.map((a) => `Saran berbahaya: ${a.text}${a.why ? ` — ${a.why}` : ''}`),
      ...distract.map((a) => `Kurang tepat: ${a.text}${a.why ? ` — ${a.why}` : ''}`),
      ...applicable.filter((a) => !work.nonPharm.includes(a.id)).map((a) => `Belum disarankan: ${a.text}`),
    ];
    if (!dispOk) missed.push(`Disposisi seharusnya ${exp.value.replace('_', ' ')} — ${exp.reason}`);
    tasks.push(lt('nonfarmakologi', score, done, missed, [...applicable.map((a) => a.text), `Disposisi: ${exp.value.replace('_', ' ')} — ${exp.reason}`]));
  }
  // LT7 — KIE
  {
    const chosen = caseDef.education.filter((a) => work.education.includes(a.id));
    const correct = chosen.filter((a) => adviceApplies(a, ctx));
    const harmful = chosen.filter((a) => a.kind === 'berbahaya');
    const distract = chosen.filter((a) => a.kind !== 'berbahaya' && !adviceApplies(a, ctx));
    const covered = new Set(correct.map((a) => a.category).filter((x): x is KieCategory => !!x));
    const required = caseDef.kieRequired ?? DEFAULT_KIE_REQUIRED;
    const missingCats = required.filter((k) => !covered.has(k));
    const score: 0 | 1 | 2 = harmful.length ? 0 : missingCats.length === 0 && distract.length <= 1 ? 2 : covered.size >= 2 ? 1 : 0;
    const done = KIE_CATEGORIES.filter((k) => covered.has(k)).map((k) => `${KIE_LABEL[k]} ✓`);
    const missed = [
      ...harmful.map((a) => `Edukasi keliru/berbahaya: ${a.text}${a.why ? ` — ${a.why}` : ''}`),
      ...distract.map((a) => `Kurang tepat: ${a.text}`),
      ...missingCats.map((k) => `Belum menyampaikan: ${KIE_LABEL[k]}`),
    ];
    const applicable = caseDef.education.filter((a) => adviceApplies(a, ctx));
    tasks.push(lt('kie', score, done, missed, applicable.map((a) => `${KIE_LABEL[a.category ?? 'diagnosis']}: ${a.text}`)));
  }

  const total = tasks.reduce((s, t) => s + t.score, 0);
  const max = tasks.length * 2;
  const percent = Math.round((total / max) * 1000) / 10;
  const result: OsceResult = {
    stationTitle: caseDef.station,
    diseaseId: c.diseaseId,
    tasks,
    total,
    max,
    percent,
    category: categoryOf(percent, critical),
    critical,
    professional: professionalBehaviour(state),
    secondsUsed: timing.secondsUsed,
    timeUp: timing.timeUp,
  };
  return { result, clinical };
}
