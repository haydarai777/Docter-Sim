/**
 * Validator integritas konten.
 *
 * Memeriksa bahwa semua file JSON saling konsisten: id yang dirujuk ada,
 * rentang angka masuk akal, placeholder teks dikenal, harga tiap alat ada, dll.
 * Dijalankan oleh unit test, `npm run validate-content`, dan saat mode dev.
 *
 * Mengembalikan daftar pesan kesalahan (kosong = valid).
 */
import { ADDRESS_WORDS, normalizeQuestion } from './nlu';
import { findUnfilledPlaceholders } from './text';
import type {
  Condition,
  DiseaseTemplate,
  EvidenceRef,
  FindingRule,
  GameConfig,
  GameContent,
  ParamDef,
  PlanItem,
  Range,
  ToolDef,
} from './types';
import { DANGER_LEVELS, DISPOSITIONS, ECONOMY_CLASSES, OBJECTIVES, TOOL_CATEGORIES } from './types';

/** Placeholder yang selalu tersedia di teks kasus (diisi oleh generator). */
export const BUILTIN_PLACEHOLDERS = [
  'hari',
  'hariTeks',
  'lamaSakit',
  'nama',
  'sapaan',
  'usia',
  'pekerjaan',
  'salahKira',
  'ketakutan',
] as const;

const REVIEW_STATUSES = ['BELUM_DITINJAU_DOKTER', 'SEDANG_DITINJAU', 'DISETUJUI'];
const PHRASE_STYLES = ['lay', 'vague', 'exaggerated', 'downplayed'];

const isProbability = (p: unknown): boolean => typeof p === 'number' && p >= 0 && p <= 1;
const isRange = (r: unknown): r is Range =>
  Array.isArray(r) && r.length === 2 && typeof r[0] === 'number' && typeof r[1] === 'number' && r[0] <= r[1];
const within = (inner: Range, outer: Range): boolean => inner[0] >= outer[0] && inner[1] <= outer[1];

function lowerFirst(key: string): string {
  return key[0]!.toLowerCase() + key.slice(1);
}

export function validateContent(content: GameContent, config: GameConfig): string[] {
  const errors: string[] = [];
  const err = (path: string, msg: string) => errors.push(`${path}: ${msg}`);

  validateTools(content, config, err);
  validateSymptoms(content, err);
  validateAnamnesis(content, err);
  validatePersonalities(content, err);
  validatePopulation(content, config, err);
  validateConversation(content, err);
  validateExtras(content, err);
  validateEvaluationConfig(config, err);

  const globalPlaceholders = new Set<string>([
    ...BUILTIN_PLACEHOLDERS,
    ...Object.keys(content.population.context),
  ]);
  // Teks umum hanya boleh memakai placeholder global.
  const checkText = (path: string, text: string, allowed: Set<string>) => {
    for (const key of findUnfilledPlaceholders(text)) {
      if (!allowed.has(key) && !allowed.has(lowerFirst(key))) err(path, `placeholder tidak dikenal {${key}}`);
    }
  };
  for (const cat of content.anamnesis) {
    checkText(`anamnesis.${cat.id}.question`, cat.question, globalPlaceholders);
    cat.fallback.forEach((v, i) => checkText(`anamnesis.${cat.id}.fallback[${i}]`, v.text, globalPlaceholders));
  }
  for (const p of content.personalities) {
    const texts = [
      ...p.greetings,
      ...p.complaintFrames,
      ...(p.answerPrefixes ?? []),
      ...(p.answerSuffixes ?? []),
    ];
    // {keluhan} & {gejala} hanya bermakna di bingkai keluhan / jawaban gejala.
    const allowed = new Set([...globalPlaceholders, 'keluhan', 'gejala']);
    texts.forEach((t, i) => checkText(`kepribadian.${p.id}[${i}]`, t, allowed));
    [...p.symptomYes, ...p.symptomNo, ...(p.symptomUncertain ?? [])].forEach((t, i) =>
      checkText(`kepribadian.${p.id}.jawabanGejala[${i}]`, t, allowed),
    );
  }

  for (const disease of content.diseases) {
    validateDisease(disease, content, config, globalPlaceholders, err, checkText);
  }
  return errors;
}

type ErrFn = (path: string, msg: string) => void;

function validateTools(content: GameContent, config: GameConfig, err: ErrFn): void {
  for (const tool of content.tools) {
    const path = `alat.${tool.id}`;
    if (!TOOL_CATEGORIES.includes(tool.category)) err(path, `kategori tidak valid "${tool.category}"`);
    if (!tool.name) err(path, 'nama kosong');
    if (tool.params.length === 0) err(path, 'tidak punya parameter');
    const price = config.toolPrices[tool.id];
    if (price === undefined) err(path, 'harga belum diatur di config.toolPrices');
    else if (!Number.isInteger(price) || price < 0) err(path, `harga tidak valid (${price})`);
    else if (tool.category !== 'fisik' && price === 0) err(path, 'pemeriksaan penunjang harus berbayar (harga > 0)');
    else if (tool.category === 'fisik' && price !== 0) err(path, 'pemeriksaan fisik seharusnya gratis (harga 0)');
    if (tool.category === 'fisik' && !tool.group) err(path, 'pemeriksaan fisik butuh group (sistem organ)');
    if (tool.category !== 'fisik') {
      if (!tool.objectives?.length) err(path, 'pemeriksaan penunjang butuh objectives (tujuan klinis)');
      if (!tool.purpose) err(path, 'pemeriksaan penunjang butuh purpose');
    }
    for (const o of tool.objectives ?? []) if (!OBJECTIVES.includes(o)) err(path, `objective tidak dikenal "${o}"`);

    const paramIds = new Set<string>();
    for (const param of tool.params) {
      const pPath = `${path}.${param.id}`;
      if (paramIds.has(param.id)) err(pPath, 'id parameter ganda');
      paramIds.add(param.id);
      validateParam(param, pPath, err);
    }
    for (const param of tool.params) {
      const pPath = `${path}.${param.id}`;
      if (param.kind === 'numeric' && param.copyFrom) {
        const [t, pid] = param.copyFrom.split('.');
        const src = content.toolsById.get(t ?? '')?.params.find((x) => x.id === pid);
        if (!src || src.kind !== 'numeric') err(pPath, `copyFrom "${param.copyFrom}" tidak menunjuk parameter numerik`);
      }
      if (param.kind === 'numeric' && param.compute) {
        const refs = param.compute.type === 'weightFromBmi' ? [param.compute.bmi, param.compute.heightCm] : [param.compute.creatinine];
        for (const ref of refs) {
          const src = tool.params.find((x) => x.id === ref);
          if (!src || src.kind !== 'numeric') err(pPath, `compute merujuk "${ref}" yang bukan parameter numerik di alat ini`);
          else if (tool.params.indexOf(src) > tool.params.indexOf(param)) err(pPath, `compute merujuk "${ref}" yang tercantum sesudahnya`);
        }
      }
      if (param.kind === 'text' && param.bands) {
        const src = tool.params.find((x) => x.id === param.bands!.from);
        if (!src || src.kind !== 'numeric') err(pPath, `bands.from "${param.bands.from}" bukan parameter numerik di alat ini`);
        if (!param.bands.ranges.length || param.bands.ranges.at(-1)!.max !== undefined) err(pPath, 'bands.ranges harus diakhiri rentang tanpa max');
      }
    }
    for (const group of tool.groups ?? []) {
      for (const id of group.params) if (!paramIds.has(id)) err(`${path}.groups`, `parameter "${id}" tidak ada`);
      if (!group.params.includes(group.remainder)) err(`${path}.groups`, `remainder "${group.remainder}" tidak ada di params`);
    }
  }
  for (const id of Object.keys(config.toolPrices)) {
    if (!content.toolsById.has(id)) err(`config.toolPrices.${id}`, 'alat tidak ada di tools.json (salah ketik?)');
  }
}

function validateParam(param: ParamDef, path: string, err: ErrFn): void {
  if (param.falsePositiveRate !== undefined && !isProbability(param.falsePositiveRate)) {
    err(path, 'falsePositiveRate harus 0..1');
  }
  if (param.kind === 'numeric') {
    if (!isRange(param.ref)) err(path, 'ref tidak valid');
    if (param.refFemale && !isRange(param.refFemale)) err(path, 'refFemale tidak valid');
    if (!Number.isInteger(param.decimals) || param.decimals < 0) err(path, 'decimals tidak valid');
    if (param.normal) {
      if (!isRange(param.normal)) err(path, 'normal tidak valid');
      else if (isRange(param.ref) && !within(param.normal, param.ref)) err(path, 'rentang normal keluar dari nilai rujukan');
    }
    if (param.normalFemale) {
      const ref = param.refFemale ?? param.ref;
      if (!isRange(param.normalFemale)) err(path, 'normalFemale tidak valid');
      else if (isRange(ref) && !within(param.normalFemale, ref)) err(path, 'rentang normalFemale keluar dari rujukan');
    }
    if ((param.falsePositiveRate ?? 0) > 0 && !isRange(param.falsePositiveRange)) {
      err(path, 'falsePositiveRate > 0 tetapi falsePositiveRange kosong');
    }
  } else {
    if (!Array.isArray(param.normal) || param.normal.length === 0) err(path, 'nilai normal kosong');
    if ((param.falsePositiveRate ?? 0) > 0 && !(param.falsePositiveValues?.length)) {
      err(path, 'falsePositiveRate > 0 tetapi falsePositiveValues kosong');
    }
    for (const v of param.falsePositiveValues ?? []) {
      if (param.normal.includes(v)) err(path, `nilai positif palsu "${v}" sama dengan nilai normal`);
    }
  }
}

function validateSymptoms(content: GameContent, err: ErrFn): void {
  for (const s of content.symptoms) {
    const path = `gejala.${s.id}`;
    if (!s.label) err(path, 'label kosong');
    if (!s.question) err(path, 'pertanyaan kosong');
    if (!s.system) err(path, 'sistem kosong');
    if (!s.phrases?.lay?.length) err(path, 'frasa awam (lay) kosong');
    if (!s.keywords?.length) err(path, 'keywords kosong (gejala tidak bisa dikenali dari pertanyaan bebas)');
    for (const [style, list] of Object.entries(s.phrases ?? {})) {
      if (!PHRASE_STYLES.includes(style)) err(path, `gaya frasa tidak dikenal "${style}"`);
      if (!Array.isArray(list) || list.length === 0) err(path, `frasa "${style}" kosong`);
    }
  }
}

function validateAnamnesis(content: GameContent, err: ErrFn): void {
  if (!content.anamnesisById.has('keluhan_lain')) err('anamnesis', 'topik "keluhan_lain" wajib ada');
  for (const cat of content.anamnesis) {
    const path = `anamnesis.${cat.id}`;
    if (cat.type === 'static' && cat.fallback.length === 0) err(path, 'kategori statis harus punya fallback');
    if (cat.type === 'dynamic') {
      if (!cat.dynamicTemplates?.found.length || !cat.dynamicTemplates.none.length) {
        err(path, 'kategori dinamis harus punya dynamicTemplates.found & none');
      }
    }
    if (!['static', 'dynamic', 'chief'].includes(cat.type)) err(path, `tipe tidak valid "${cat.type}"`);
    if (!cat.keywords?.length) err(path, 'keywords kosong (topik tidak bisa dikenali dari pertanyaan bebas)');
    for (const k of cat.keywords ?? []) if (ADDRESS_WORDS.has(normalizeQuestion(k))) err(path, `kata kunci "${k}" sama dengan sapaan (salah tangkap)`);
    if (!cat.label || !cat.rubric || !cat.why) err(path, 'label/rubric/why wajib diisi');
    if (cat.weight !== undefined && !(cat.weight > 0)) err(path, 'weight harus > 0');
    for (const v of cat.fallback) for (const r of v.reveals ?? []) err(path, `fallback tidak boleh mengungkap gejala ("${r}")`);
  }
}

function validateConversation(content: GameContent, err: ErrFn): void {
  for (const r of content.reviews) {
    const path = `anamnesis.reviews.${r.id}`;
    if (!r.keywords.length || !r.normal.length || !r.symptoms.length) err(path, 'keywords/normal/symptoms wajib diisi');
    for (const s of r.symptoms) if (!content.symptomsById.has(s)) err(path, `gejala "${s}" tidak ada`);
  }
  const conv = content.conversation;
  for (const key of ['greeting', 'thanks', 'consent', 'unknown', 'repeat', 'alreadySaid', 'chief'] as const) {
    if (!conv?.[key]?.length) err(`anamnesis.conversation.${key}`, 'kosong');
  }
  if (!conv?.detail?.default?.length) err('anamnesis.conversation.detail.default', 'kosong');
  for (const [topic, list] of Object.entries(conv?.detail ?? {})) {
    if (topic !== 'default' && !content.anamnesisById.has(topic)) err(`anamnesis.conversation.detail.${topic}`, 'topik tidak ada');
    for (const t of list) if (!t.includes('{gejala}')) err(`anamnesis.conversation.detail.${topic}`, `templat harus memuat {gejala}: "${t}"`);
  }
  for (const t of conv?.chief ?? []) {
    if (!t.includes('{keluhanAwal}')) err('anamnesis.conversation.chief', `templat harus memuat {keluhanAwal}: "${t}"`);
  }
}

/** Bukti (topik/gejala/alat) yang dirujuk harus ada. */
function checkEvidence(path: string, ref: EvidenceRef | undefined, content: GameContent, err: ErrFn, required = true): void {
  if (!ref) {
    if (required) err(path, 'bukti kosong');
    return;
  }
  const count = (ref.topics?.length ?? 0) + (ref.symptoms?.length ?? 0) + (ref.tools?.length ?? 0);
  if (required && count === 0) err(path, 'bukti kosong');
  for (const t of ref.topics ?? []) if (!content.anamnesisById.has(t)) err(path, `topik "${t}" tidak ada`);
  for (const s of ref.symptoms ?? []) if (!content.symptomsById.has(s)) err(path, `gejala "${s}" tidak ada`);
  for (const t of ref.tools ?? []) if (!content.toolsById.has(t)) err(path, `alat "${t}" tidak ada`);
}

/** Aturan temuan (penyakit, komorbiditas, insidental) harus menunjuk parameter yang benar. */
function checkFindingRule(fPath: string, f: FindingRule, content: GameContent, err: ErrFn): ToolDef | undefined {
  const tool = content.toolsById.get(f.tool);
  if (!tool) {
    err(fPath, 'alat tidak ada');
    return undefined;
  }
  const param = tool.params.find((p) => p.id === f.param);
  if (!param) {
    err(fPath, 'parameter tidak ada');
    return undefined;
  }
  if (f.probability !== undefined && !isProbability(f.probability)) err(fPath, 'probability harus 0..1');
  if (param.kind === 'numeric' && (param.compute || param.copyFrom)) err(fPath, 'parameter turunan (compute/copyFrom) tidak boleh diatur aturan');
  if (param.kind === 'numeric') {
    if (!isRange(f.range)) err(fPath, 'parameter numerik butuh range yang valid');
    if (f.values) err(fPath, 'parameter numerik tidak boleh memakai values');
  } else {
    if (!f.values?.length) err(fPath, 'parameter teks butuh values');
    if (f.range) err(fPath, 'parameter teks tidak boleh memakai range');
  }
  if (f.requires) {
    const idx = tool.params.findIndex((p) => p.id === f.requires);
    if (idx < 0 || idx >= tool.params.indexOf(param)) err(fPath, `requires "${f.requires}" harus parameter alat yang sama dan tercantum lebih awal`);
  }
  return tool;
}

function validateExtras(content: GameContent, err: ErrFn): void {
  const diseaseIds = new Set(content.diseases.map((d) => d.id));
  for (const c of content.comorbidities) {
    const path = `komorbiditas.${c.id}`;
    if (!c.name || !c.summary) err(path, 'nama/summary kosong');
    if (!isProbability(c.probability) || !isProbability(c.knownProbability)) err(path, 'probability/knownProbability harus 0..1');
    for (const id of c.excludePrimary ?? []) if (!diseaseIds.has(id)) err(path, `excludePrimary "${id}" bukan penyakit kasus`);
    for (const s of c.symptoms ?? []) {
      if (!content.symptomsById.has(s.id)) err(path, `gejala "${s.id}" tidak ada`);
      if (!isProbability(s.probability)) err(path, `probability gejala "${s.id}" harus 0..1`);
    }
    if (!c.findings.length) err(path, 'findings kosong');
    c.findings.forEach((f, i) => {
      checkFindingRule(`${path}.findings[${i}] (${f.tool}.${f.param})`, f, content, err);
      if (f.when?.traits || f.when?.symptoms) err(`${path}.findings[${i}]`, 'kondisi komorbiditas hanya boleh demografi/hari');
    });
    checkEvidence(`${path}.detectBy`, c.detectBy, content, err);
    if (!c.management.length) err(path, 'management kosong');
    if (!c.history) err(path, 'history wajib ada');
  }
  for (const inc of content.incidentals) {
    const path = `insidental.${inc.id}`;
    if (!isProbability(inc.probability)) err(path, 'probability harus 0..1');
    if (!inc.findings.length) err(path, 'findings kosong');
    inc.findings.forEach((f, i) => checkFindingRule(`${path}.findings[${i}] (${f.tool}.${f.param})`, f, content, err));
    checkEvidence(`${path}.detectBy`, inc.detectBy, content, err);
    if (!inc.note) err(path, 'note kosong');
  }
  const seen = new Set<string>([...diseaseIds, ...content.comorbidities.map((c) => c.id), ...content.incidentals.map((i) => i.id)]);
  for (const c of content.conditions) {
    const path = `kondisi.${c.id}`;
    if (seen.has(c.id)) err(path, 'id sudah dipakai penyakit/komorbiditas/insidental');
    if (!c.name || !c.summary) err(path, 'nama/summary kosong');
    if (!DANGER_LEVELS.includes(c.danger)) err(path, `tingkat bahaya tidak valid "${c.danger}"`);
  }
  for (const e of content.catalog) if (!e.aliases) err(`katalog.${e.id}`, 'aliases wajib ada (boleh kosong)');
}

function validateEvaluationConfig(config: GameConfig, err: ErrFn): void {
  const w = config.evaluation.weights;
  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 100) > 1e-9) err('config.evaluation.weights', `total bobot harus 100 (sekarang ${sum})`);
  if (!config.evaluation.grades.length) err('config.evaluation.grades', 'kosong');
}

function validatePersonalities(content: GameContent, err: ErrFn): void {
  if (content.personalities.length === 0) err('kepribadian', 'kosong');
  for (const p of content.personalities) {
    const path = `kepribadian.${p.id}`;
    if (!(p.weight > 0)) err(path, 'weight harus > 0');
    if (!PHRASE_STYLES.includes(p.complaintStyle)) err(path, `complaintStyle tidak valid "${p.complaintStyle}"`);
    for (const key of ['vagueRate', 'uncertainAbsentRate', 'affixRate'] as const) {
      if (!isProbability(p[key])) err(path, `${key} harus 0..1`);
    }
    if (p.uncertainAbsentRate > 0 && !p.symptomUncertain?.length) err(path, 'uncertainAbsentRate > 0 tetapi symptomUncertain kosong');
    if (p.affixRate > 0 && !p.answerPrefixes?.length && !p.answerSuffixes?.length) err(path, 'affixRate > 0 tetapi prefix/suffix kosong');
    for (const key of ['greetings', 'complaintFrames', 'symptomYes', 'symptomNo'] as const) {
      if (!p[key]?.length) err(path, `${key} kosong`);
    }
    if (!p.complaintFrames.every((f) => /\{[kK]eluhan\}/.test(f))) err(path, 'setiap complaintFrames harus memuat {keluhan}');
    for (const c of p.affixCategories ?? []) {
      if (!content.anamnesisById.has(c)) err(path, `affixCategories: kategori "${c}" tidak ada`);
    }
  }
}

function validatePopulation(content: GameContent, config: GameConfig, err: ErrFn): void {
  const pop = content.population;
  if (!pop.names.male.length || !pop.names.female.length) err('populasi.names', 'daftar nama kosong');
  for (const o of pop.occupations) {
    const path = `populasi.pekerjaan.${o.id}`;
    if (!isRange(o.age)) err(path, 'rentang usia tidak valid');
    if (!o.economy.length) err(path, 'status ekonomi kosong');
    for (const e of o.economy) if (!ECONOMY_CLASSES.includes(e)) err(path, `status ekonomi tidak valid "${e}"`);
    if (!(o.weight > 0)) err(path, 'weight harus > 0');
  }
  // Setiap kombinasi jenis kelamin × usia harus punya minimal satu pekerjaan.
  for (const sex of ['male', 'female'] as const) {
    for (let age = config.patient.minAge; age <= config.patient.maxAge; age++) {
      const ok = pop.occupations.some((o) => (!o.sex || o.sex === sex) && age >= o.age[0] && age <= o.age[1]);
      if (!ok) err('populasi.pekerjaan', `tidak ada pekerjaan untuk ${sex} usia ${age}`);
    }
  }
}

function validateDisease(
  d: DiseaseTemplate,
  content: GameContent,
  config: GameConfig,
  globalPlaceholders: Set<string>,
  err: ErrFn,
  checkText: (path: string, text: string, allowed: Set<string>) => void,
): void {
  const path = `penyakit.${d.id}`;
  if (!d.name) err(path, 'nama kosong');
  if (!DANGER_LEVELS.includes(d.danger)) err(path, `tingkat bahaya tidak valid "${d.danger}"`);
  if (!(d.prevalenceWeight > 0)) err(path, 'prevalenceWeight harus > 0');
  if (!isRange(d.presentationDay) || d.presentationDay[0] < 1) err(path, 'presentationDay tidak valid');
  if (!REVIEW_STATUSES.includes(d.review?.status)) err(path, 'review.status wajib diisi');
  if (!d.summary) err(path, 'summary kosong');
  if (!d.keyFindings?.length) err(path, 'keyFindings kosong');
  if (!d.misattributions?.length) err(path, 'misattributions kosong');

  // Demografi
  const demo = d.demographics;
  if (!isProbability(demo.maleRatio)) err(`${path}.demographics`, 'maleRatio harus 0..1');
  if (demo.occupationBias !== undefined && !isProbability(demo.occupationBias)) err(`${path}.demographics`, 'occupationBias harus 0..1');
  if (!demo.ageBands.length || demo.ageBands.every((b) => !(b.weight > 0))) err(`${path}.demographics`, 'ageBands kosong');
  for (const band of demo.ageBands) {
    if (band.min > band.max) err(`${path}.demographics`, `ageBand ${band.min}-${band.max} terbalik`);
    if (band.min < config.patient.minAge || band.max > config.patient.maxAge) {
      err(`${path}.demographics`, `ageBand ${band.min}-${band.max} di luar rentang usia config`);
    }
  }
  for (const o of demo.occupations ?? []) {
    if (!content.occupationsById.has(o.id)) err(`${path}.demographics`, `pekerjaan "${o.id}" tidak ada`);
  }

  // Trait
  const traitIds = new Set((d.traits ?? []).map((t) => t.id));
  const symptomIds = new Set(d.symptoms.map((s) => s.id));
  const checkCond = (p: string, cond: Condition | undefined, allowSymptoms: boolean) => {
    if (!cond) return;
    for (const t of [...(cond.traits ?? []), ...(cond.notTraits ?? [])]) {
      if (!traitIds.has(t)) err(p, `trait "${t}" tidak didefinisikan`);
    }
    if (!allowSymptoms && (cond.symptoms || cond.notSymptoms)) err(p, 'kondisi gejala tidak boleh dipakai di sini (gejala belum di-sample)');
    for (const s of [...(cond.symptoms ?? []), ...(cond.notSymptoms ?? [])]) {
      if (!symptomIds.has(s)) err(p, `gejala "${s}" bukan gejala penyakit ini`);
    }
    for (const o of cond.occupations ?? []) if (!content.occupationsById.has(o)) err(p, `pekerjaan "${o}" tidak ada`);
  };
  (d.traits ?? []).forEach((t, i) => {
    if (!isProbability(t.probability)) err(`${path}.traits[${i}]`, 'probability harus 0..1');
    checkCond(`${path}.traits[${i}]`, t.when, false);
  });
  for (const key of Object.keys(d.traitLabels ?? {})) {
    if (!traitIds.has(key)) err(`${path}.traitLabels`, `trait "${key}" tidak ada`);
  }

  // Gejala
  d.symptoms.forEach((s, i) => {
    if (!content.symptomsById.has(s.id)) err(`${path}.symptoms[${i}]`, `gejala "${s.id}" tidak ada di symptoms.json`);
    if (!isProbability(s.probability)) err(`${path}.symptoms[${i}]`, 'probability harus 0..1');
    checkCond(`${path}.symptoms[${i}]`, s.when, false);
  });
  const cc = d.chiefComplaint;
  if (!cc.primary.length) err(`${path}.chiefComplaint`, 'primary kosong');
  for (const s of [...cc.primary, ...(cc.extraPool ?? []), ...(d.clueSymptoms ?? [])]) {
    if (!symptomIds.has(s)) err(`${path}.chiefComplaint/clueSymptoms`, `gejala "${s}" bukan gejala penyakit ini`);
  }
  const guaranteed = cc.primary.some((id) => {
    const first = d.symptoms.find((s) => s.id === id && !s.when);
    return first?.probability === 1;
  });
  if (!guaranteed) err(`${path}.chiefComplaint`, 'minimal satu gejala primary harus pasti ada (probability 1 tanpa kondisi)');

  // Anamnesis
  const allowedText = new Set([...globalPlaceholders, ...Object.keys(d.context ?? {})]);
  for (const [catId, variants] of Object.entries(d.anamnesis)) {
    const cat = content.anamnesisById.get(catId);
    if (!cat) err(`${path}.anamnesis`, `kategori "${catId}" tidak ada`);
    else if (cat.type !== 'static') err(`${path}.anamnesis`, `kategori "${catId}" dinamis, tidak boleh diisi`);
    variants.forEach((v, i) => {
      const vPath = `${path}.anamnesis.${catId}[${i}]`;
      if (!v.text) err(vPath, 'teks kosong');
      if (v.weight !== undefined && !(v.weight >= 0)) err(vPath, 'weight tidak valid');
      checkCond(vPath, v.when, true);
      checkText(vPath, v.text, allowedText);
      for (const r of v.reveals ?? []) {
        if (!v.when?.symptoms?.includes(r)) err(vPath, `reveals "${r}" harus juga ada di when.symptoms`);
      }
    });
  }

  // Temuan pemeriksaan
  const defaultSeen = new Set<string>();
  d.findings.forEach((f, i) => {
    const fPath = `${path}.findings[${i}] (${f.tool}.${f.param})`;
    if (!checkFindingRule(fPath, f, content, err)) return;
    checkCond(fPath, f.when, true);
    const key = `${f.tool}.${f.param}`;
    if (defaultSeen.has(key)) err(fPath, 'aturan tidak akan pernah terpakai (ada aturan tanpa kondisi sebelumnya)');
    if (!f.when && !f.requires) defaultSeen.add(key);
  });

  // Diagnosis banding
  if (d.differentials.length < 2) err(`${path}.differentials`, 'minimal dua diagnosis banding');
  const diffIds = new Set<string>();
  for (const diff of d.differentials) {
    const dp = `${path}.differentials.${diff.id}`;
    if (diffIds.has(diff.id)) err(dp, 'ganda');
    diffIds.add(diff.id);
    if (diff.id === d.id) err(dp, 'tidak boleh merujuk diri sendiri');
    else if (!content.catalogById.has(diff.id)) err(dp, 'kondisi tidak ada di katalog');
    if (!diff.howToDistinguish) err(dp, 'howToDistinguish kosong');
    checkEvidence(`${dp}.excludeBy`, diff.excludeBy, content, err);
  }
  if (!d.differentials.some((x) => x.mustNotMiss)) err(`${path}.differentials`, 'minimal satu diagnosis "mustNotMiss"');

  // Komplikasi
  const cxIds = new Set<string>();
  for (const cx of d.complications ?? []) {
    const cp = `${path}.complications.${cx.id}`;
    if (cxIds.has(cx.id)) err(cp, 'id ganda');
    cxIds.add(cx.id);
    if (!traitIds.has(cx.trait)) err(cp, `trait "${cx.trait}" tidak didefinisikan`);
    if (!cx.name || !cx.explanation) err(cp, 'nama/explanation kosong');
    checkEvidence(`${cp}.assess`, cx.assess, content, err);
  }

  // Rencana pemeriksaan
  const checkPlan = (kind: 'exams' | 'tests', items: PlanItem[]) => {
    const seen = new Set<string>();
    items.forEach((it, i) => {
      const ip = `${path}.plan.${kind}[${i}] (${it.tool})`;
      const tool = content.toolsById.get(it.tool);
      if (!tool) return err(ip, 'alat tidak ada');
      if (kind === 'exams' && tool.category !== 'fisik') err(ip, 'plan.exams hanya untuk pemeriksaan fisik');
      if (kind === 'tests' && tool.category === 'fisik') err(ip, 'plan.tests hanya untuk pemeriksaan penunjang');
      if (!['kunci', 'pendukung', 'komplikasi'].includes(it.role)) err(ip, `role tidak valid "${it.role}"`);
      if (!it.reason) err(ip, 'reason kosong');
      if (seen.has(it.tool) && !it.when) err(ip, 'alat ganda tanpa kondisi');
      seen.add(it.tool);
      checkCond(ip, it.when, true);
    });
  };
  if (!d.plan) err(path, 'plan wajib diisi');
  else {
    checkPlan('exams', d.plan.exams ?? []);
    checkPlan('tests', d.plan.tests ?? []);
    if (!d.plan.exams.length && !d.plan.tests.length) err(`${path}.plan`, 'exams & tests kosong');
    for (const t of d.plan.keyTopics ?? []) {
      if (!content.anamnesisById.get(t)?.core) err(`${path}.plan.keyTopics`, `topik "${t}" tidak ada / bukan topik inti`);
    }
    const planned = new Set(d.plan.tests.map((t) => t.tool));
    for (const u of d.plan.unnecessary ?? []) {
      if (!content.toolsById.has(u.tool)) err(`${path}.plan.unnecessary`, `alat "${u.tool}" tidak ada`);
      if (planned.has(u.tool)) err(`${path}.plan.unnecessary`, `alat "${u.tool}" juga ada di plan.tests`);
      if (!u.reason) err(`${path}.plan.unnecessary`, `alasan "${u.tool}" kosong`);
    }
  }

  // Disposisi, tata laksana, pendekatan
  if (!d.disposition?.length) err(`${path}.disposition`, 'kosong');
  else {
    d.disposition.forEach((r, i) => {
      const rp = `${path}.disposition[${i}]`;
      if (!DISPOSITIONS.includes(r.value)) err(rp, `disposisi tidak valid "${r.value}"`);
      for (const a of r.alsoAccept ?? []) if (!DISPOSITIONS.includes(a)) err(rp, `alsoAccept tidak valid "${a}"`);
      if (!r.reason) err(rp, 'reason kosong');
      checkCond(rp, r.when, true);
    });
    if (d.disposition.at(-1)!.when) err(`${path}.disposition`, 'aturan terakhir harus tanpa kondisi (default)');
  }
  if (!d.management?.length) err(`${path}.management`, 'kosong');
  if (!d.approach?.length) err(`${path}.approach`, 'kosong');
  for (const [trait, id] of Object.entries(d.traitComorbidities ?? {})) {
    if (!traitIds.has(trait)) err(`${path}.traitComorbidities`, `trait "${trait}" tidak ada`);
    if (!content.comorbiditiesById.has(id)) err(`${path}.traitComorbidities`, `komorbiditas "${id}" tidak ada`);
  }
  (d.pitfalls ?? []).forEach((pf, i) => {
    const pp = `${path}.pitfalls[${i}]`;
    const w = pf.when;
    if (!pf.text) err(pp, 'text kosong');
    for (const id of [w.excluded, w.primaryIs, w.notConsidered]) if (id && !content.catalogById.has(id)) err(pp, `kondisi "${id}" tidak ada di katalog`);
    for (const t of [w.toolDone, w.toolNormal]) if (t && !content.toolsById.has(t)) err(pp, `alat "${t}" tidak ada`);
    if (w.topicNotAsked && !content.anamnesisById.has(w.topicNotAsked)) err(pp, `topik "${w.topicNotAsked}" tidak ada`);
    for (const t of [...(w.traits ?? []), ...(w.notTraits ?? [])]) if (!traitIds.has(t)) err(pp, `trait "${t}" tidak ada`);
  });
}
