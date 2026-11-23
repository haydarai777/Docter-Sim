/**
 * Penilaian tab Tatalaksana mode praktik: resep (obat, dosis per kali/per kgBB, aturan, lama, jumlah),
 * saran non-farmakologi, dan KIE — memakai kunci terapi per penyakit yang sama dengan mode OSCE
 * (src/data/osce/cases, BELUM DITINJAU DOKTER).
 *
 * Skor tatalaksana = farmakologi × split.farmakologi + non-farmakologi × split.nonfarmakologi + KIE × split.kie.
 * Keselamatan resep juga memengaruhi reputasi (config.reputation):
 *   - obat yang membuat pasien alergi      → skor resep 0, reputasi −allergyDrugPenalty;
 *   - obat berbahaya (kontraindikasi kritis kasus / melebihi dosis harian maksimum)
 *                                          → skor resep 0, reputasi −harmfulDrugPenalty;
 *   - antibiotik sistemik di luar kunci terapi kasus
 *                                          → skor resep × unindicatedAntibioticFactor, reputasi −unindicatedAntibioticPenalty.
 */
import { matchesCondition, type ConditionContext } from './conditions';
import { adviceApplies, DEFAULT_KIE_REQUIRED, KIE_LABEL } from './osce/advice';
import type { OsceContent } from './osce/content';
import { evaluatePrescription, expectedQuantity, signaText, toRoman } from './osce/prescription';
import { KIE_CATEGORIES, type AdviceOption, type KieCategory, type PrescriptionLine, type TreatmentWork } from './osce/types';
import type { EncounterState, FeedbackItem, GameConfig } from './types';

export const EMPTY_TREATMENT: TreatmentWork = { prescription: [], nonPharm: [], education: [] };

/**
 * Kelas obat yang dihitung sebagai antibiotik sistemik (bukan topikal/tetes): antibiotik umum, OAT
 * (rifampisin, isoniazid, …), dan MDT kusta (rifampisin, dapson, klofazimin).
 */
const SYSTEMIC_ANTIBIOTIC_CLASSES = new Set(['antibiotik', 'oat', 'kusta']);

export interface TreatmentOutcome {
  /** false = data terapi penyakit ini belum tersedia → tidak dinilai. */
  scored: boolean;
  /** 0..1 gabungan ketiga bagian. */
  fraction: number;
  parts: { farmakologi: number; nonfarmakologi: number; kie: number };
  good: FeedbackItem[];
  missed: FeedbackItem[];
  /** Kunci jawaban ringkas (resep, saran, KIE yang dianjurkan). */
  answerKey: string[];
  safety: { allergy: string[]; harmful: string[]; antibiotic: string[] };
  /** Perubahan reputasi dari kesalahan resep (≤ 0). */
  reputation: number;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const fmt = (n: number) => (Math.round(n * 100) / 100).toLocaleString('id-ID');

/** Teks satu baris resep, mis. "R/ Parasetamol tab 500 mg No. XV — S 3 dd tab I p.c.". */
export function prescriptionText(line: PrescriptionLine, osce: OsceContent): string {
  const entry = osce.formsById.get(line.form);
  if (!entry) return line.drug;
  return `R/ ${entry.drug.name} ${entry.form.label} No. ${toRoman(line.quantity)} — ${signaText(line, entry.form)}`;
}

/** Jumlah otomatis untuk baris resep (dipakai UI & bot). */
export function lineQuantity(line: Omit<PrescriptionLine, 'quantity'>, osce: OsceContent): number {
  const entry = osce.formsById.get(line.form);
  return entry ? expectedQuantity(line, entry.form) : 1;
}

function adviceScore(
  options: readonly AdviceOption[],
  chosenIds: readonly string[],
  ctx: ConditionContext,
): { chosen: AdviceOption[]; correct: AdviceOption[]; harmful: AdviceOption[]; distract: AdviceOption[]; applicable: AdviceOption[] } {
  const chosen = options.filter((a) => chosenIds.includes(a.id));
  return {
    chosen,
    correct: chosen.filter((a) => adviceApplies(a, ctx)),
    harmful: chosen.filter((a) => a.kind === 'berbahaya'),
    distract: chosen.filter((a) => a.kind !== 'berbahaya' && !adviceApplies(a, ctx)),
    applicable: options.filter((a) => adviceApplies(a, ctx)),
  };
}

export function evaluateTreatment(state: EncounterState, work: TreatmentWork, osce: OsceContent, ctx: ConditionContext, config: GameConfig): TreatmentOutcome {
  const c = state.case;
  const def = osce.casesById.get(c.diseaseId);
  const empty = { allergy: [], harmful: [], antibiotic: [] };
  if (!def) {
    return {
      scored: false,
      fraction: 0,
      parts: { farmakologi: 0, nonfarmakologi: 0, kie: 0 },
      good: [],
      missed: [{ text: 'Data terapi untuk penyakit ini belum tersedia — tatalaksana tidak dinilai.', detail: 'Bobotnya dibagi ke komponen lain sehingga total tetap 100.' }],
      answerKey: [],
      safety: empty,
      reputation: 0,
    };
  }
  const T = config.evaluation.treatment;
  const R = config.reputation;
  const good: FeedbackItem[] = [];
  const missed: FeedbackItem[] = [];
  const lines = work.prescription;
  const weighed = state.examsDone.includes('timbangan');
  const ev = evaluatePrescription(lines, def, c, ctx, osce, weighed);
  const drugOf = (i: number) => osce.drugsById.get(lines[i]!.drug);
  const drugName = (i: number) => drugOf(i)?.name ?? lines[i]!.drug;

  // ---------------------------------------------------------------- Keselamatan resep
  const allergy = ev.allergy.map((a) => `${a.drug.name} pada pasien dengan alergi ${a.allergy}`);
  const harmfulLines = new Set<number>();
  const harmful: string[] = [];
  for (const a of ev.avoided) {
    if (a.rule.severity !== 'kritis') continue;
    harmfulLines.add(a.line);
    harmful.push(`${a.drug.name}: ${a.rule.reason}`);
  }
  for (const o of ev.overdose) {
    harmfulLines.add(o.line);
    harmful.push(`Dosis harian ${o.drug.name} ${fmt(o.daily)} melebihi batas aman ${fmt(o.max)}.`);
  }
  // Baris yang dipakai butir terapi kasus (termasuk baris lain dengan obat yang sama).
  const usedDrugs = new Set(ev.items.filter((it) => it.line !== null).map((it) => lines[it.line!]!.drug));
  const antibioticLines = lines
    .map((_, i) => i)
    .filter((i) => SYSTEMIC_ANTIBIOTIC_CLASSES.has(drugOf(i)?.class ?? '') && !usedDrugs.has(lines[i]!.drug) && !harmfulLines.has(i));
  const antibiotic = antibioticLines.map((i) => drugName(i));

  // ---------------------------------------------------------------- Farmakologi
  let farmakologi: number;
  const scoredItems = ev.items.filter((it) => it.item.role !== 'opsional');
  const extrasOther = ev.extras.filter((i) => !antibioticLines.includes(i));
  const avoidedOther = ev.avoided.filter((a) => a.rule.severity === 'salah' && !antibioticLines.includes(a.line));
  if (allergy.length || harmful.length) {
    farmakologi = 0;
  } else if (scoredItems.length === 0) {
    // Kasus tanpa obat wajib (mis. kelainan refraksi): obat yang tidak perlu mengurangi skor.
    farmakologi = 1 - 0.25 * (extrasOther.length + avoidedOther.length);
  } else {
    const weight = (role: string) => (role === 'utama' ? 3 : 1);
    let earned = 0;
    let total = 0;
    for (const it of scoredItems) {
      const w = weight(it.item.role);
      total += w;
      earned += it.status === 'tepat' ? w : it.status === 'kurang_tepat' ? w * 0.5 : 0;
    }
    farmakologi = earned / total;
    farmakologi -= 0.1 * ev.items.filter((it) => it.item.role === 'opsional' && it.status === 'kurang_tepat').length;
    farmakologi -= 0.2 * avoidedOther.length;
    farmakologi -= 0.1 * Math.max(0, extrasOther.length - 1);
    farmakologi -= Math.min(0.15, 0.05 * ev.quantityIssues.length);
  }
  if (antibioticLines.length) farmakologi *= T.unindicatedAntibioticFactor;
  farmakologi = clamp01(farmakologi);

  for (const a of allergy) missed.push({ text: `KESELAMATAN PASIEN: meresepkan ${a}.`, detail: 'Selalu tanyakan riwayat alergi obat sebelum menulis resep.' });
  for (const x of harmful) missed.push({ text: `KESELAMATAN PASIEN: ${x}` });
  for (const name of antibiotic) {
    missed.push({ text: `Antibiotik tanpa indikasi: ${name}`, detail: 'Antibiotik yang tidak diperlukan memicu resistansi dan efek samping.' });
  }
  for (const it of ev.items) {
    if (it.status === 'tepat') good.push({ text: `${it.item.label}: ${drugName(it.line!)} tepat`, detail: it.item.reason });
    else if (it.status === 'kurang_tepat') missed.push({ text: `${it.item.label}: ${drugName(it.line!)} — ${it.problems.join('; ')}`, detail: it.item.reason });
    else if (it.item.role !== 'opsional') missed.push({ text: `${it.item.label} (${it.item.role}) belum diresepkan`, detail: it.item.reason });
  }
  for (const a of avoidedOther) missed.push({ text: `${a.drug.name} kurang tepat`, detail: a.rule.reason });
  for (const i of extrasOther) missed.push({ text: `${drugName(i)} tidak diperlukan pada kasus ini` });
  for (const q of ev.quantityIssues) missed.push({ text: `Jumlah (No.) ${drugName(q.line)} seharusnya ${q.expected} sesuai aturan pakai` });
  if (ev.unweighedWeightDosing) missed.push({ text: 'Dosis berbasis berat badan diberikan tanpa menimbang pasien.', detail: 'Lakukan Timbangan & antropometri sebelum menghitung dosis per kgBB.' });
  if (!lines.length && scoredItems.length === 0 && !allergy.length) good.push({ text: 'Tidak memberi obat yang tidak diperlukan.' });

  // ---------------------------------------------------------------- Non-farmakologi
  const np = adviceScore(def.nonPharm, work.nonPharm, ctx);
  const need = Math.min(3, np.applicable.length);
  const nonfarmakologi = np.harmful.length ? 0 : clamp01((need === 0 ? 1 : Math.min(1, np.correct.length / need)) - 0.15 * np.distract.length);
  for (const a of np.correct) good.push({ text: `Saran tepat: ${a.text}` });
  for (const a of np.harmful) missed.push({ text: `Saran berbahaya: ${a.text}`, detail: a.why });
  for (const a of np.distract) missed.push({ text: `Saran kurang tepat: ${a.text}`, detail: a.why });
  const npMissing = np.applicable.filter((a) => !work.nonPharm.includes(a.id));
  if (np.correct.length < need && npMissing.length) missed.push({ text: `Saran non-farmakologi yang belum diberikan: ${npMissing.map((a) => a.text).join('; ')}` });

  // ---------------------------------------------------------------- KIE
  const ed = adviceScore(def.education, work.education, ctx);
  const covered = new Set(ed.correct.map((a) => a.category).filter((x): x is KieCategory => !!x));
  const required = def.kieRequired ?? DEFAULT_KIE_REQUIRED;
  const missingCats = required.filter((k) => !covered.has(k));
  const kie = ed.harmful.length ? 0 : clamp01((required.length ? (required.length - missingCats.length) / required.length : 1) - 0.15 * ed.distract.length);
  for (const k of KIE_CATEGORIES.filter((x) => covered.has(x))) good.push({ text: `KIE: ${KIE_LABEL[k]} ✓` });
  for (const a of ed.harmful) missed.push({ text: `Edukasi keliru/berbahaya: ${a.text}`, detail: a.why });
  for (const a of ed.distract) missed.push({ text: `Edukasi kurang tepat: ${a.text}`, detail: a.why });
  if (missingCats.length) missed.push({ text: `KIE yang belum disampaikan: ${missingCats.map((k) => KIE_LABEL[k].toLowerCase()).join(', ')}` });

  // ---------------------------------------------------------------- Kunci jawaban
  const items = def.therapy.items.filter((i) => matchesCondition(i.when, ctx));
  const answerKey = [
    ...(items.length ? items.map((i) => `Resep — ${i.label} (${i.role}): ${i.options.map((o) => o.label).join(' ATAU ')}`) : ['Resep — tidak ada obat yang wajib diberikan.']),
    ...(def.therapy.note ? [`Catatan: ${def.therapy.note}`] : []),
    ...np.applicable.map((a) => `Non-farmakologi: ${a.text}`),
    ...ed.applicable.map((a) => `KIE (${KIE_LABEL[a.category ?? 'diagnosis'].toLowerCase()}): ${a.text}`),
  ];

  const S = T.split;
  const fraction = clamp01(S.farmakologi * farmakologi + S.nonfarmakologi * nonfarmakologi + S.kie * kie);
  const reputation = 0 - ((allergy.length ? R.allergyDrugPenalty : 0) + (harmful.length ? R.harmfulDrugPenalty : 0) + (antibiotic.length ? R.unindicatedAntibioticPenalty : 0));
  return {
    scored: true,
    fraction,
    parts: { farmakologi, nonfarmakologi, kie },
    good,
    missed,
    answerKey,
    safety: { allergy, harmful, antibiotic },
    reputation,
  };
}
