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
  DiseaseTemplate,
  GameConfig,
  NumericParamDef,
  ParamDef,
  ParamResult,
  Range,
  ResultSource,
  Sex,
  ToolDef,
} from './types';

/** Nilai rujukan sesuai jenis kelamin. */
export function referenceRange(param: NumericParamDef, sex: Sex): Range {
  return sex === 'female' && param.refFemale ? param.refFemale : param.ref;
}

/** Rentang nilai normal yang di-generate (default: rujukan dipersempit 10% di tiap sisi). */
export function normalRange(param: NumericParamDef, sex: Sex): Range {
  if (sex === 'female' && param.normalFemale) return param.normalFemale;
  if (param.normal && !(sex === 'female' && param.refFemale)) return param.normal;
  const [lo, hi] = referenceRange(param, sex);
  const margin = (hi - lo) * 0.1;
  return [lo + margin, hi - margin];
}

function roundToStep(value: number, param: NumericParamDef): number {
  const step = param.step ?? Math.pow(10, -param.decimals);
  const rounded = Math.round(value / step) * step;
  return Number(rounded.toFixed(param.decimals));
}

function sampleNumeric(rng: Rng, range: Range, param: NumericParamDef): number {
  return roundToStep(rng.float(range[0], range[1]), param);
}

export function numericFlag(value: number, param: NumericParamDef, sex: Sex): 'H' | 'L' | null {
  const [lo, hi] = referenceRange(param, sex);
  if (value < lo) return 'L';
  if (value > hi) return 'H';
  return null;
}

export function formatReference(param: ParamDef, sex: Sex): string | undefined {
  if (param.refText) return param.refText;
  if (param.kind === 'text') return undefined;
  const [lo, hi] = referenceRange(param, sex);
  return `${formatNumber(lo, param.decimals)}–${formatNumber(hi, param.decimals)}`;
}

function makeResult(param: ParamDef, value: number | string, source: ResultSource, sex: Sex): ParamResult {
  if (param.kind === 'numeric') {
    const num = value as number;
    return {
      paramId: param.id,
      label: param.label,
      value: num,
      display: formatNumber(num, param.decimals),
      unit: param.unit,
      refText: formatReference(param, sex),
      flag: numericFlag(num, param, sex),
      source,
    };
  }
  const text = value as string;
  return {
    paramId: param.id,
    label: param.label,
    value: text,
    display: text,
    refText: formatReference(param, sex),
    flag: param.normal.includes(text) ? null : '+',
    source,
  };
}

function generateParam(
  param: ParamDef,
  tool: ToolDef,
  disease: DiseaseTemplate,
  ctx: ConditionContext,
  config: GameConfig,
  rng: Rng,
): ParamResult {
  const realistic = config.tests.realisticAccuracy;
  const rule = disease.findings.find(
    (f) => f.tool === tool.id && f.param === param.id && matchesCondition(f.when, ctx),
  );

  if (rule) {
    const p = rule.diagnostic && !realistic ? 1 : (rule.probability ?? 1);
    if (rng.chance(p)) {
      const value = param.kind === 'numeric' ? sampleNumeric(rng, rule.range!, param) : rng.pick(rule.values!);
      return makeResult(param, value, 'disease', ctx.sex);
    }
  } else if (realistic && (param.falsePositiveRate ?? 0) > 0 && rng.chance(param.falsePositiveRate!)) {
    const value =
      param.kind === 'numeric'
        ? sampleNumeric(rng, param.falsePositiveRange!, param)
        : rng.pick(param.falsePositiveValues!);
    return makeResult(param, value, 'false_positive', ctx.sex);
  }

  const normalValue =
    param.kind === 'numeric' ? sampleNumeric(rng, normalRange(param, ctx.sex), param) : rng.pick(param.normal);
  return makeResult(param, normalValue, 'normal', ctx.sex);
}

/**
 * Terapkan kelompok "jumlah tetap" (mis. hitung jenis = 100%).
 * Parameter remainder diisi sisa; jika sisa negatif, parameter lain diskalakan turun.
 */
function applyGroups(tool: ToolDef, results: ParamResult[], sex: Sex): void {
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
        Object.assign(r, makeResult(p, scaled, r.source, sex));
      }
      othersSum = others.reduce((sum, r) => sum + (r.value as number), 0);
    }
    const value = roundToStep(Math.max(0, group.sumTo - othersSum), remParam);
    const source: ResultSource = others.some((r) => r.source === 'disease') ? 'disease' : remainder.source;
    Object.assign(remainder, makeResult(remParam, value, source, sex));
  }
}

/** Hasilkan semua parameter satu alat. */
export function generateToolFindings(
  tool: ToolDef,
  disease: DiseaseTemplate,
  ctx: ConditionContext,
  config: GameConfig,
  rng: Rng,
): ParamResult[] {
  const results = tool.params.map((param) => generateParam(param, tool, disease, ctx, config, rng.fork(param.id)));
  applyGroups(tool, results, ctx.sex);
  return results;
}
