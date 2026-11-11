/**
 * Pembuat hasil pemeriksaan (temuan objektif) untuk satu kasus.
 *
 * Aturan per parameter:
 *  1. Cari aturan penyakit PERTAMA untuk (alat, parameter) yang kondisinya cocok.
 *  2. Jika ada: lempar peluang `probability` (sensitivitas / prevalensi tanda).
 *     Berhasil → nilai abnormal dari aturan (source 'disease').
 *     Gagal    → nilai normal (negatif palsu / tanda tidak muncul).
 *  3. Jika tidak ada aturan yang cocok: peluang positif palsu dari definisi alat
 *     (hanya jika akurasi realistis aktif), selain itu nilai normal.
 *
 * Dengan begitu pemeriksaan yang tidak relevan tetap memberi hasil (biasanya normal).
 */
import type { ConditionContext } from './conditions';
import { matchesCondition } from './conditions';
import type { Rng } from './rng';
import { formatNumber } from './text';
import type {
  AgeReference,
  FindingRule,
  GameConfig,
  NumericParamDef,
  ParamDef,
  ParamResult,
  Range,
  ResultSource,
  Sex,
  ToolDef,
} from './types';

/** Pasien untuk rujukan & perhitungan turunan yang bergantung pada usia & jenis kelamin. */
export interface PatientBasics {
  sex: Sex;
  age: number;
}

/** Kelompok rujukan usia yang berlaku (anak/remaja), atau undefined untuk rujukan dewasa. */
function ageBand(param: NumericParamDef, who: PatientBasics): AgeReference | undefined {
  return param.refByAge?.find((b) => who.age <= b.maxAge);
}

function adultReference(param: NumericParamDef, sex: Sex): Range {
  return sex === 'female' && param.refFemale ? param.refFemale : param.ref;
}

/** Nilai rujukan sesuai jenis kelamin dan (bila ada) kelompok usia. */
export function referenceRange(param: NumericParamDef, who: PatientBasics): Range {
  const band = ageBand(param, who);
  if (band) return who.sex === 'female' && band.refFemale ? band.refFemale : band.ref;
  return adultReference(param, who.sex);
}

/** Rentang nilai normal yang di-generate (default: rujukan dipersempit 10% di tiap sisi). */
export function normalRange(param: NumericParamDef, who: PatientBasics): Range {
  const band = ageBand(param, who);
  const src = band ?? param;
  if (who.sex === 'female' && src.normalFemale) return src.normalFemale;
  if (src.normal && !(who.sex === 'female' && src.refFemale)) return src.normal;
  const [lo, hi] = referenceRange(param, who);
  const margin = (hi - lo) * 0.1;
  return [lo + margin, hi - margin];
}

/**
 * Aturan penyakit ditulis untuk rujukan DEWASA. Untuk pasien anak/remaja dengan rujukan
 * khusus usia, nilai digeser agar maknanya tetap sama: nilai di atas batas atas dewasa
 * tetap di atas batas atas usia (dengan selisih yang sama), demikian pula batas bawah;
 * nilai di dalam rujukan dipetakan linear ke rujukan usia.
 */
export function ageAdjust(value: number, param: NumericParamDef, who: PatientBasics): number {
  if (!ageBand(param, who)) return value;
  const [aLo, aHi] = adultReference(param, who.sex);
  const [lo, hi] = referenceRange(param, who);
  if (value > aHi) return hi + (value - aHi);
  if (value < aLo) return lo - (aLo - value);
  return aHi === aLo ? lo : lo + ((value - aLo) / (aHi - aLo)) * (hi - lo);
}

function roundToStep(value: number, param: NumericParamDef): number {
  const step = param.step ?? Math.pow(10, -param.decimals);
  const rounded = Math.round(value / step) * step;
  return Number(rounded.toFixed(param.decimals));
}

function sampleNumeric(rng: Rng, range: Range, param: NumericParamDef): number {
  return roundToStep(rng.float(range[0], range[1]), param);
}

export function numericFlag(value: number, param: NumericParamDef, who: PatientBasics): 'H' | 'L' | null {
  const [lo, hi] = referenceRange(param, who);
  if (value < lo) return 'L';
  if (value > hi) return 'H';
  return null;
}

export function formatReference(param: ParamDef, who: PatientBasics): string | undefined {
  if (param.kind === 'text') return param.refText;
  if (param.refText && !ageBand(param, who)) return param.refText;
  const [lo, hi] = referenceRange(param, who);
  return `${formatNumber(lo, param.decimals)}–${formatNumber(hi, param.decimals)}`;
}

/** Satu sumber aturan temuan: penyakit utama, komorbiditas, atau temuan insidental. */
export interface FindingSource {
  /** Id sumber (id penyakit / komorbiditas / insidental); disimpan di ParamResult.origin. */
  origin: string;
  rules: readonly FindingRule[];
}

function makeResult(param: ParamDef, value: number | string, source: ResultSource, who: PatientBasics, origin?: string): ParamResult {
  const result = makeBaseResult(param, value, source, who);
  if (origin) result.origin = origin;
  return result;
}

function makeBaseResult(param: ParamDef, value: number | string, source: ResultSource, who: PatientBasics): ParamResult {
  if (param.kind === 'numeric') {
    const num = value as number;
    return {
      paramId: param.id,
      label: param.label,
      value: num,
      display: formatNumber(num, param.decimals),
      unit: param.unit,
      refText: formatReference(param, who),
      flag: numericFlag(num, param, who),
      source,
    };
  }
  const text = value as string;
  return {
    paramId: param.id,
    label: param.label,
    value: text,
    display: text,
    refText: formatReference(param, who),
    flag: param.normal.includes(text) ? null : '+',
    source,
  };
}

function generateParam(
  param: ParamDef,
  tool: ToolDef,
  ruleSets: readonly FindingSource[],
  ctx: ConditionContext,
  config: GameConfig,
  rng: Rng,
  earlier: readonly ParamResult[],
): ParamResult {
  const realistic = config.tests.realisticAccuracy;
  const who: PatientBasics = { sex: ctx.sex, age: ctx.age };
  let matchedAny = false;
  // Tiap sumber (penyakit utama, lalu komorbiditas, lalu insidental): aturan PERTAMA yang cocok
  // diundi; bila gagal, sumber berikutnya masih boleh memberi nilai abnormal.
  // Parameter "combine" (mis. Kesan USG) merangkum kelainan dari SEMUA sumber, bukan hanya yang pertama.
  const combined: { value: string; origin: string }[] = [];
  for (const { origin, rules } of ruleSets) {
    const rule = rules.find(
      (f) =>
        f.tool === tool.id &&
        f.param === param.id &&
        matchesCondition(f.when, ctx) &&
        // requires: parameter lain di alat yang sama abnormal karena SUMBER YANG SAMA.
        (!f.requires || earlier.some((r) => r.paramId === f.requires && r.source === 'disease' && r.origin === origin)),
    );
    if (!rule) continue;
    matchedAny = true;
    const p = rule.diagnostic && !realistic ? 1 : (rule.probability ?? 1);
    if (rng.chance(p)) {
      const value =
        param.kind === 'numeric' ? roundToStep(ageAdjust(sampleNumeric(rng, rule.range!, param), param, who), param) : rng.pick(rule.values!);
      if (param.kind === 'text' && param.combine) {
        combined.push({ value: value as string, origin });
        continue;
      }
      return makeResult(param, value, 'disease', who, origin);
    }
  }
  if (combined.length > 0) {
    return makeResult(param, combined.map((x) => x.value).join('; '), 'disease', who, combined[0]!.origin);
  }
  if (!matchedAny && realistic && (param.falsePositiveRate ?? 0) > 0 && rng.chance(param.falsePositiveRate!)) {
    const value =
      param.kind === 'numeric'
        ? roundToStep(ageAdjust(sampleNumeric(rng, param.falsePositiveRange!, param), param, who), param)
        : rng.pick(param.falsePositiveValues!);
    return makeResult(param, value, 'false_positive', who);
  }

  const normalValue =
    param.kind === 'numeric' ? sampleNumeric(rng, normalRange(param, who), param) : rng.pick(param.normal);
  return makeResult(param, normalValue, 'normal', who);
}

/**
 * Terapkan kelompok "jumlah tetap" (mis. hitung jenis = 100%).
 * Parameter remainder diisi sisa; jika sisa negatif, parameter lain diskalakan turun.
 */
function applyGroups(tool: ToolDef, results: ParamResult[], who: PatientBasics): void {
  for (const group of tool.groups ?? []) {
    const members = results.filter((r) => group.params.includes(r.paramId));
    const remainder = members.find((r) => r.paramId === group.remainder);
    const others = members.filter((r) => r.paramId !== group.remainder);
    if (!remainder) continue;
    const remParam = tool.params.find((p) => p.id === group.remainder) as NumericParamDef;

    let othersSum = others.reduce((sum, r) => sum + (r.value as number), 0);
    if (othersSum > group.sumTo) {
      // Skalakan turun agar total tetap sumTo (jarang terjadi; hanya jika konten berlebihan).
      const factor = group.sumTo / othersSum;
      for (const r of others) {
        const p = tool.params.find((x) => x.id === r.paramId) as NumericParamDef;
        const scaled = roundToStep((r.value as number) * factor, p);
        Object.assign(r, makeResult(p, scaled, r.source, who, r.origin));
      }
      othersSum = others.reduce((sum, r) => sum + (r.value as number), 0);
    }
    const value = roundToStep(Math.max(0, group.sumTo - othersSum), remParam);
    const driver = others.find((r) => r.source === 'disease');
    const source: ResultSource = driver ? 'disease' : remainder.source;
    Object.assign(remainder, makeResult(remParam, value, source, who, driver?.origin ?? remainder.origin));
  }
}

/**
 * Hitung parameter turunan dalam satu alat:
 *  - compute (mis. berat badan = IMT × tinggi²)
 *  - bands   (teks dari angka, hanya jika parameter teks itu tidak diatur penyakit)
 */
/**
 * eGFR dengan persamaan CKD-EPI 2021 (tanpa koefisien ras).
 * eGFR = 142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^−1,200 × 0,9938^usia × 1,012 [perempuan]
 * κ = 0,7 (P) / 0,9 (L); α = −0,241 (P) / −0,302 (L). Scr dalam mg/dL.
 */
export function egfrCkdEpi2021(creatinine: number, age: number, sex: Sex): number {
  const female = sex === 'female';
  const kappa = female ? 0.7 : 0.9;
  const alpha = female ? -0.241 : -0.302;
  const ratio = creatinine / kappa;
  return 142 * Math.pow(Math.min(ratio, 1), alpha) * Math.pow(Math.max(ratio, 1), -1.2) * Math.pow(0.9938, age) * (female ? 1.012 : 1);
}

function applyDerived(tool: ToolDef, results: ParamResult[], who: PatientBasics): void {
  const { sex } = who;
  const byId = new Map(results.map((r) => [r.paramId, r]));
  for (const param of tool.params) {
    const target = byId.get(param.id)!;
    if (param.kind === 'numeric' && param.compute?.type === 'weightFromBmi') {
      const bmi = byId.get(param.compute.bmi)?.value as number;
      const heightM = (byId.get(param.compute.heightCm)?.value as number) / 100;
      Object.assign(target, makeResult(param, roundToStep(bmi * heightM * heightM, param), 'normal', who));
    }
    if (param.kind === 'numeric' && param.compute?.type === 'egfrCkdEpi2021') {
      const scr = byId.get(param.compute.creatinine);
      const egfr = roundToStep(egfrCkdEpi2021(scr?.value as number, who.age, sex), param);
      Object.assign(target, makeResult(param, egfr, scr?.source ?? 'normal', who, scr?.origin));
    }
    if (param.kind === 'text' && param.bands && target.source === 'normal') {
      const source = byId.get(param.bands.from)?.value as number;
      const band = param.bands.ranges.find((b) => b.max === undefined || source <= b.max);
      if (band) Object.assign(target, makeResult(param, band.value, 'normal', who));
    }
  }
}

/**
 * Tautkan nilai antar-alat (copyFrom), lalu hitung ulang parameter turunan.
 * Dipanggil setelah semua alat di-generate.
 */
export function linkFindings(tools: readonly ToolDef[], findings: Record<string, ParamResult[]>, who: PatientBasics): void {
  for (const tool of tools) {
    let changed = false;
    for (const param of tool.params) {
      if (param.kind !== 'numeric' || !param.copyFrom) continue;
      const [srcTool, srcParam] = param.copyFrom.split('.');
      const src = findings[srcTool!]?.find((r) => r.paramId === srcParam);
      const target = findings[tool.id]?.find((r) => r.paramId === param.id);
      if (!src || !target) continue;
      Object.assign(target, makeResult(param, src.value as number, src.source, who, src.origin));
      changed = true;
    }
    if (changed) applyDerived(tool, findings[tool.id]!, who);
  }
}

/**
 * Hasilkan semua parameter satu alat.
 * `ruleSets` = aturan temuan penyakit utama, lalu tiap komorbiditas, lalu temuan insidental
 * (urutan = prioritas; dalam satu sumber, aturan pertama yang cocok per parameter dipakai).
 */
export function generateToolFindings(
  tool: ToolDef,
  ruleSets: readonly FindingSource[],
  ctx: ConditionContext,
  config: GameConfig,
  rng: Rng,
): ParamResult[] {
  const results: ParamResult[] = [];
  for (const param of tool.params) {
    results.push(generateParam(param, tool, ruleSets, ctx, config, rng.fork(param.id), results));
  }
  applyGroups(tool, results, { sex: ctx.sex, age: ctx.age });
  applyDerived(tool, results, { sex: ctx.sex, age: ctx.age });
  return results;
}
