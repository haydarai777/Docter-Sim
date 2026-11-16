/**
 * Penilaian resep OSCE: obat yang tepat, dosis per kali, frekuensi, lama, jumlah (No.), sediaan,
 * kontraindikasi, alergi pasien, dan dosis harian maksimum.
 */
import { matchesCondition, type ConditionContext } from '../conditions';
import type { PatientCase } from '../types';
import type { OsceContent } from './content';
import type { AvoidRule, DoseOption, DrugDef, DrugForm, OsceCaseDef, PrescriptionLine, TherapyItem } from './types';

/** Berat badan pasien (kg) dari hasil timbangan (selalu tersedia di data kasus). */
export function patientWeight(c: PatientCase): number | null {
  const bb = c.findings.timbangan?.find((r) => r.paramId === 'bb')?.value;
  return typeof bb === 'number' ? bb : null;
}

/** Angka Romawi untuk jumlah obat di resep (No. XV). */
export function toRoman(n: number): string {
  let x = Math.max(0, Math.round(n));
  if (x === 0) return '0';
  const table: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let out = '';
  for (const [v, s] of table) {
    while (x >= v) {
      out += s;
      x -= v;
    }
  }
  return out;
}

/** Jumlah yang seharusnya diserahkan untuk satu baris resep. */
export function expectedQuantity(line: Pick<PrescriptionLine, 'units' | 'schedule' | 'timesPerDay' | 'days'>, form: DrugForm): number {
  const total = line.schedule === 'tunggal' ? line.units : line.units * line.timesPerDay * Math.max(1, line.days);
  if (form.package) return Math.max(1, Math.ceil(total / form.package));
  return Math.max(1, Math.ceil(total - 1e-9));
}

/** Teks signa, mis. "S 3 dd tab I p.c." */
export function signaText(line: PrescriptionLine, form: DrugForm): string {
  const units = Number.isInteger(line.units) ? toRoman(line.units) : String(line.units).replace('.', ',');
  const unit = form.dosageUnit === 'tablet' ? 'tab' : form.dosageUnit === 'kapsul' ? 'caps' : form.dosageUnit;
  const timing = line.timing === 'sebelum makan' ? ' a.c.' : line.timing === 'sesudah makan' ? ' p.c.' : line.timing === 'malam hari' ? ' h.s.' : line.timing === 'saat makan' ? ' d.c.' : '';
  if (line.schedule === 'tunggal') return `S 1 dd ${unit} ${units} (dosis tunggal)${timing}`;
  const prn = line.schedule === 'prn' ? ' p.r.n.' : '';
  return `S ${line.timesPerDay} dd ${unit} ${units}${timing}${prn}`;
}

export type ItemStatus = 'tepat' | 'kurang_tepat' | 'tidak_ada';

export interface ItemEvaluation {
  item: TherapyItem;
  status: ItemStatus;
  /** Indeks baris resep yang dinilai untuk butir ini. */
  line: number | null;
  problems: string[];
}

export interface PrescriptionEvaluation {
  items: ItemEvaluation[];
  /** Obat yang tidak boleh / berbahaya untuk kasus ini. */
  avoided: { line: number; rule: AvoidRule; drug: DrugDef }[];
  /** Obat yang membuat pasien alergi. */
  allergy: { line: number; drug: DrugDef; allergy: string }[];
  /** Dosis harian melebihi batas aman. */
  overdose: { line: number; drug: DrugDef; daily: number; max: number }[];
  /** Baris yang tidak termasuk rencana terapi. */
  extras: number[];
  /** Jumlah (No.) tidak sesuai aturan pakai. */
  quantityIssues: { line: number; expected: number }[];
  /** Ada butir yang dosisnya berbasis BB padahal pasien belum ditimbang. */
  unweighedWeightDosing: boolean;
}

function amountOf(line: PrescriptionLine, form: DrugForm): number {
  return line.units * form.strength;
}

function fmt(n: number): string {
  return (Math.round(n * 100) / 100).toLocaleString('id-ID');
}

/** Masalah satu baris resep terhadap satu pilihan dosis (kosong = tepat). */
export function lineProblems(line: PrescriptionLine, option: DoseOption, form: DrugForm, weightKg: number | null, weighed: boolean): string[] {
  const problems: string[] = [];
  if (option.forms && !option.forms.includes(line.form)) problems.push(`sediaan ${form.label} kurang tepat`);
  if (!option.schedules.includes(line.schedule)) {
    const want = option.schedules.map((s) => (s === 'prn' ? 'bila perlu' : s === 'tunggal' ? 'dosis tunggal' : 'rutin')).join('/');
    problems.push(`aturan pakai seharusnya ${want}`);
  }
  const amount = amountOf(line, form);
  if (option.dose) {
    const [lo, hi] = option.dose;
    if (amount < lo * 0.99 || amount > hi * 1.01) problems.push(`dosis per kali ${fmt(amount)} ${form.unit} (seharusnya ${fmt(lo)}${hi !== lo ? `–${fmt(hi)}` : ''} ${form.unit})`);
  }
  if (option.dosePerKg && weightKg) {
    const [lo, hi] = option.dosePerKg;
    const perKg = amount / weightKg;
    if (perKg < lo * 0.9 || perKg > hi * 1.1) problems.push(`dosis ${fmt(perKg)} ${form.unit}/kgBB (seharusnya ${fmt(lo)}–${fmt(hi)} ${form.unit}/kgBB untuk BB ${fmt(weightKg)} kg)`);
    if (!weighed) problems.push('berat badan belum ditimbang (dosis berbasis BB)');
  }
  if (option.unitsByWeight && weightKg) {
    const band = option.unitsByWeight.find((b) => weightKg >= b.minKg && weightKg < b.maxKg + 1);
    if (band && Math.abs(band.units - line.units) > 0.01) problems.push(`jumlah ${fmt(line.units)} ${form.dosageUnit} per kali (BB ${fmt(weightKg)} kg → ${fmt(band.units)} ${form.dosageUnit})`);
    if (!weighed) problems.push('berat badan belum ditimbang (dosis berbasis BB)');
  }
  if (line.schedule !== 'tunggal' && option.timesPerDay) {
    const [lo, hi] = option.timesPerDay;
    if (line.timesPerDay < lo || line.timesPerDay > hi) problems.push(`frekuensi ${line.timesPerDay}× sehari (seharusnya ${lo}${hi !== lo ? `–${hi}` : ''}× sehari)`);
  }
  if (line.schedule === 'rutin' && option.days) {
    const [lo, hi] = option.days;
    if (line.days < lo || line.days > hi) problems.push(`lama ${line.days} hari (seharusnya ${lo}${hi !== lo ? `–${hi}` : ''} hari)`);
  }
  return problems;
}

function ruleHits(rule: AvoidRule, drug: DrugDef): boolean {
  if (rule.drugs?.includes(drug.id)) return true;
  if (rule.classes?.includes(drug.class)) return true;
  if (rule.groups?.some((g) => drug.groups?.includes(g))) return true;
  return false;
}

/** Golongan obat yang membuat pasien alergi. */
export function allergyGroupsOf(allergy: string | null, osce: OsceContent): string[] {
  if (!allergy) return [];
  return osce.formulary.allergyGroups[allergy] ?? [];
}

export function drugCausesAllergy(drug: DrugDef, allergy: string | null, osce: OsceContent): boolean {
  if (!allergy) return false;
  const groups = allergyGroupsOf(allergy, osce);
  if (groups.some((g) => drug.groups?.includes(g))) return true;
  const a = allergy.toLowerCase();
  return [drug.id, drug.name, ...(drug.aliases ?? [])].some((n) => a.includes(n.toLowerCase()) || n.toLowerCase().includes(a));
}

export function evaluatePrescription(
  lines: readonly PrescriptionLine[],
  caseDef: OsceCaseDef,
  c: PatientCase,
  ctx: ConditionContext,
  osce: OsceContent,
  weighed: boolean,
): PrescriptionEvaluation {
  const weightKg = patientWeight(c);
  const used = new Set<number>();
  const items: ItemEvaluation[] = [];
  let unweighedWeightDosing = false;
  for (const item of caseDef.therapy.items) {
    if (!matchesCondition(item.when, ctx)) continue;
    let best: ItemEvaluation = { item, status: 'tidak_ada', line: null, problems: [] };
    // Urutan preferensi: tepat > kurang tepat; baris yang belum dipakai butir lain; masalah paling sedikit.
    const rank = (e: ItemEvaluation) => (e.status === 'tepat' ? 0 : 1000) + (e.line !== null && used.has(e.line) ? 100 : 0) + e.problems.length;
    lines.forEach((line, i) => {
      if (item.separateLine && used.has(i)) return;
      const options = item.options.filter((o) => o.drug === line.drug);
      const entry = osce.formsById.get(line.form);
      if (!options.length || !entry) return;
      for (const option of options) {
        const problems = lineProblems(line, option, entry.form, weightKg, weighed);
        const candidate: ItemEvaluation = { item, status: problems.length ? 'kurang_tepat' : 'tepat', line: i, problems };
        if (best.status === 'tidak_ada' || rank(candidate) < rank(best)) best = candidate;
      }
    });
    if (best.line !== null) {
      used.add(best.line);
      const line = lines[best.line]!;
      const opt = item.options.find((o) => o.drug === line.drug);
      if (!weighed && (opt?.unitsByWeight || opt?.dosePerKg)) unweighedWeightDosing = true;
    }
    items.push(best);
  }
  // Baris lain dengan obat yang sama untuk butir yang sudah terpakai tetap dianggap bagian butir itu.
  lines.forEach((line, i) => {
    if (used.has(i)) return;
    if (items.some((it) => it.line !== null && lines[it.line]!.drug === line.drug)) used.add(i);
  });

  const avoided: PrescriptionEvaluation['avoided'] = [];
  const allergy: PrescriptionEvaluation['allergy'] = [];
  const overdose: PrescriptionEvaluation['overdose'] = [];
  const quantityIssues: PrescriptionEvaluation['quantityIssues'] = [];
  const extras: number[] = [];
  lines.forEach((line, i) => {
    const entry = osce.formsById.get(line.form);
    const drug = osce.drugsById.get(line.drug);
    if (!entry || !drug) return;
    for (const rule of caseDef.therapy.avoid ?? []) {
      if (matchesCondition(rule.when, ctx) && ruleHits(rule, drug)) avoided.push({ line: i, rule, drug });
    }
    if (drugCausesAllergy(drug, c.allergy, osce)) allergy.push({ line: i, drug, allergy: c.allergy! });
    if (drug.maxDaily) {
      const daily = amountOf(line, entry.form) * (line.schedule === 'tunggal' ? 1 : line.timesPerDay);
      if (daily > drug.maxDaily * 1.001) overdose.push({ line: i, drug, daily, max: drug.maxDaily });
    }
    const expected = expectedQuantity(line, entry.form);
    const okQuantity =
      line.schedule === 'prn' ? line.quantity >= line.units && line.quantity <= Math.max(expected, line.units * 30) : Math.abs(line.quantity - expected) < 0.01;
    if (!okQuantity) quantityIssues.push({ line: i, expected });
    if (!used.has(i) && !avoided.some((a) => a.line === i)) extras.push(i);
  });
  return { items, avoided, allergy, overdose, extras, quantityIssues, unweighedWeightDosing };
}

/** Skor LT farmakologi 0–2 beserta kesalahan kritisnya. */
export function scorePrescription(ev: PrescriptionEvaluation, lines: readonly PrescriptionLine[], osce: OsceContent): { score: 0 | 1 | 2; critical: string[] } {
  const critical: string[] = [];
  for (const a of ev.allergy) critical.push(`Meresepkan ${a.drug.name} pada pasien dengan alergi ${a.allergy}.`);
  for (const a of ev.avoided) if (a.rule.severity === 'kritis') critical.push(`Meresepkan ${a.drug.name}: ${a.rule.reason}`);
  for (const o of ev.overdose) critical.push(`Dosis harian ${o.drug.name} ${fmt(o.daily)} melebihi batas aman ${fmt(o.max)}.`);
  if (critical.length) return { score: 0, critical };
  const utama = ev.items.filter((i) => i.item.role === 'utama');
  const pendukung = ev.items.filter((i) => i.item.role === 'pendukung');
  const opsional = ev.items.filter((i) => i.item.role === 'opsional');
  const allUtamaPresent = utama.every((i) => i.status !== 'tidak_ada');
  if (!allUtamaPresent) return { score: 0, critical };
  const extraAntibiotic = ev.extras.some((i) => osce.drugsById.get(lines[i]!.drug)?.class === 'antibiotik');
  // Kasus tanpa obat (mis. kelainan refraksi): resep apa pun tidak diperlukan.
  if (ev.items.length === 0) return { score: lines.length === 0 ? 2 : extraAntibiotic || lines.length > 1 ? 0 : 1, critical };
  const perfect =
    utama.every((i) => i.status === 'tepat') &&
    pendukung.every((i) => i.status === 'tepat') &&
    opsional.every((i) => i.status !== 'kurang_tepat') &&
    ev.avoided.length === 0 &&
    !extraAntibiotic &&
    ev.extras.length <= 1 &&
    ev.quantityIssues.length === 0;
  if (perfect) return { score: 2, critical };
  return { score: utama.length > 0 || lines.length > 0 ? 1 : 0, critical };
}
