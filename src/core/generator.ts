/**
 * Generator kasus pasien.
 *
 * Dari satu templat penyakit + seed, hasilkan pasien lengkap beserta
 * "kebenaran tersembunyi"-nya: demografi, hari sakit, trait laten, gejala,
 * dialog, jawaban anamnesis, dan hasil SEMUA pemeriksaan.
 *
 * Urutan langkah penting karena tiap langkah boleh bergantung pada langkah
 * sebelumnya (mis. gejala bergantung pada trait):
 *   demografi → hari sakit → trait → gejala → konteks teks → dialog → temuan
 *
 * Setiap langkah memakai RNG turunan (fork) sendiri, sehingga menambah
 * konten di satu bagian tidak mengubah hasil bagian lain untuk seed yang sama.
 */
import type { ConditionContext } from './conditions';
import { matchesCondition } from './conditions';
import { buildCategoryAnswer, buildComplaint } from './dialogue';
import { type FindingSource, generateToolFindings, linkFindings } from './findings';
import { createRng, type Rng } from './rng';
import { durationText, fillTemplate, numberToWords } from './text';
import type {
  DiseaseTemplate,
  EconomyClass,
  GameConfig,
  GameContent,
  NameEntry,
  OccupationDef,
  PatientCase,
  PatientProfile,
  Sex,
  SymptomRule,
  TraitRule,
} from './types';

/** Usia di bawah ini disapa "Mas/Mbak", selebihnya "Pak/Bu". */
const YOUNG_ADDRESS_MAX_AGE = 29;
/** Maksimal komorbiditas tambahan per pasien (selain yang sudah dimodelkan oleh penyakit utama). */
const MAX_COMORBIDITIES = 2;

interface Demographics {
  sex: Sex;
  age: number;
  occupation: OccupationDef;
}

function occupationFits(o: OccupationDef, sex: Sex, minAge: number, maxAge: number): boolean {
  return (!o.sex || o.sex === sex) && o.age[1] >= minAge && o.age[0] <= maxAge;
}

/** Pilih jenis kelamin, pekerjaan, lalu usia yang konsisten dengan keduanya dan dengan penyakit. */
function sampleDemographics(disease: DiseaseTemplate, content: GameContent, config: GameConfig, rng: Rng): Demographics {
  const demo = disease.demographics;
  const sex: Sex = rng.chance(demo.maleRatio) ? 'male' : 'female';
  const { minAge, maxAge } = config.patient;
  const all = content.population.occupations.filter((o) => occupationFits(o, sex, minAge, maxAge));

  for (let attempt = 0; attempt < 30; attempt++) {
    // 1) Pekerjaan: dari daftar berisiko penyakit (bias) atau populasi umum.
    let occupation: OccupationDef | undefined;
    const risky = (demo.occupations ?? [])
      .map((r) => ({ occ: content.occupationsById.get(r.id), weight: r.weight }))
      .filter((r): r is { occ: OccupationDef; weight: number } => !!r.occ && all.includes(r.occ));
    if (risky.length > 0 && attempt < 20 && rng.chance(demo.occupationBias ?? 0)) {
      occupation = rng.weighted(risky, (r) => r.weight).occ;
    } else {
      occupation = rng.weighted(all, (o) => o.weight);
    }

    // 2) Usia: kelompok usia penyakit yang beririsan dengan rentang usia pekerjaan.
    const lo = Math.max(minAge, occupation.age[0]);
    const hi = Math.min(maxAge, occupation.age[1]);
    const bands = demo.ageBands.filter((b) => b.weight > 0 && b.max >= lo && b.min <= hi);
    if (bands.length === 0) continue; // pekerjaan tidak cocok dengan usia khas penyakit → coba lagi
    const band = rng.weighted(bands, (b) => b.weight);
    const age = rng.int(Math.max(band.min, lo), Math.min(band.max, hi));
    return { sex, age, occupation };
  }
  // Fallback (seharusnya tidak terjadi dengan konten valid).
  const occupation = rng.pick(all);
  return { sex, age: rng.int(Math.max(minAge, occupation.age[0]), Math.min(maxAge, occupation.age[1])), occupation };
}

function sampleEconomy(occupation: OccupationDef, config: GameConfig, rng: Rng): { economy: EconomyClass; budget: number } {
  const economy = rng.weighted(occupation.economy, (e) => config.economy.classes[e].weight);
  const [lo, hi] = config.economy.classes[economy].budget;
  const step = config.economy.budgetRounding;
  const budget = Math.max(lo, Math.floor(rng.int(lo, hi) / step) * step);
  return { economy, budget };
}

function nameOf(entry: NameEntry): { name: string; call: string } {
  if (typeof entry === 'string') return { name: entry, call: entry.split(' ')[0]! };
  return entry;
}

/**
 * Evaluasi aturan berurutan: untuk tiap id, aturan PERTAMA yang kondisinya
 * cocok menentukan (dengan peluangnya). Aturan berikutnya untuk id yang sama diabaikan.
 */
function sampleRules(rules: readonly (TraitRule | SymptomRule)[], ctx: ConditionContext, rng: Rng, into: Set<string>): void {
  const decided = new Set<string>();
  for (const rule of rules) {
    if (decided.has(rule.id)) continue;
    // ctx.traits adalah Set yang sedang diisi, jadi trait berikutnya bisa bergantung pada trait sebelumnya.
    if (!matchesCondition(rule.when, ctx)) continue;
    decided.add(rule.id);
    if (rng.chance(rule.probability)) into.add(rule.id);
  }
}

export interface GenerateCaseOptions {
  diseaseId: string;
  seed: number;
}

export function generateCase(content: GameContent, config: GameConfig, options: GenerateCaseOptions): PatientCase {
  const disease = content.diseasesById.get(options.diseaseId);
  if (!disease) throw new Error(`Penyakit tidak dikenal: ${options.diseaseId}`);
  const rng = createRng(options.seed);

  // --- Demografi & profil -----------------------------------------------
  const demoRng = rng.fork('demografi');
  const { sex, age, occupation } = sampleDemographics(disease, content, config, demoRng);
  const { economy, budget } = sampleEconomy(occupation, config, demoRng);
  const personality = demoRng.weighted(content.personalities, (p) => p.weight);
  const { name, call } = nameOf(demoRng.pick(content.population.names[sex]));
  const honorific = age <= YOUNG_ADDRESS_MAX_AGE ? (sex === 'male' ? 'Mas' : 'Mbak') : sex === 'male' ? 'Pak' : 'Bu';

  const patient: PatientProfile = {
    name,
    callName: call,
    address: `${honorific} ${call}`,
    age,
    sex,
    occupationId: occupation.id,
    occupationLabel: occupation.label,
    economy,
    budget,
    personalityId: personality.id,
  };

  // --- Hari sakit, trait, gejala -----------------------------------------
  const day = rng.fork('hari').int(disease.presentationDay[0], disease.presentationDay[1]);
  const traits = new Set<string>();
  const baseCtx: ConditionContext = { day, sex, age, occupationId: occupation.id, traits };
  sampleRules(disease.traits ?? [], baseCtx, rng.fork('trait'), traits);

  // --- Komorbiditas & temuan insidental (id-nya ikut menjadi trait) -------
  const comorbidities = sampleComorbidities(disease, content, baseCtx, rng.fork('komorbid'));
  for (const c of comorbidities) traits.add(c.id);
  const incidentals = sampleIncidentals(content, baseCtx, rng.fork('insidental'));
  for (const id of incidentals) traits.add(id);

  const symptoms = new Set<string>();
  sampleRules(disease.symptoms, baseCtx, rng.fork('gejala'), symptoms);
  for (const c of comorbidities) {
    const def = content.comorbiditiesById.get(c.id)!;
    sampleRules(def.symptoms ?? [], baseCtx, rng.fork(`gejala:${c.id}`), symptoms);
  }
  const fullCtx: ConditionContext = { ...baseCtx, symptoms };
  const complications = (disease.complications ?? []).filter((x) => traits.has(x.trait)).map((x) => x.id);
  const allergyRng = rng.fork('alergi');
  const allergy =
    content.allergies.length > 0 && allergyRng.chance(config.patient.allergyRate) ? allergyRng.pick(content.allergies) : null;

  // --- Nilai placeholder teks --------------------------------------------
  const ctxRng = rng.fork('konteks');
  const context: Record<string, string> = {};
  for (const [key, values] of Object.entries({ ...content.population.context, ...(disease.context ?? {}) })) {
    if (values.length > 0) context[key] = ctxRng.pick(values);
  }
  Object.assign(context, {
    hari: String(day),
    hariTeks: numberToWords(day),
    lamaSakit: durationText(day),
    nama: name,
    sapaan: patient.address,
    usia: String(age),
    pekerjaan: occupation.intro,
    salahKira: ctxRng.pick(disease.misattributions),
    ketakutan: ctxRng.pick(disease.fears?.length ? disease.fears : ['penyakit yang parah']),
  });

  // --- Keluhan utama (sengaja tidak lengkap) ------------------------------
  const ccRng = rng.fork('keluhan');
  const primary = disease.chiefComplaint.primary.filter((id) => symptoms.has(id)).slice(0, 1);
  // Sisakan minimal satu gejala yang harus digali (keluhan tidak pernah lengkap di awal).
  const maxExtra = Math.max(0, Math.min(personality.complaintExtra, symptoms.size - primary.length - 1));
  const extras = ccRng
    .shuffle((disease.chiefComplaint.extraPool ?? []).filter((id) => symptoms.has(id) && !primary.includes(id)))
    .slice(0, maxExtra);
  let chiefComplaintSymptoms = [...primary, ...extras];
  if (chiefComplaintSymptoms.length === 0) chiefComplaintSymptoms = [...symptoms].slice(0, 1);

  const complaint = buildComplaint(
    chiefComplaintSymptoms.map((id) => content.symptomsById.get(id)!),
    personality,
    context,
    ccRng,
  );
  const greeting = fillTemplate(ccRng.pick(personality.greetings), context);

  // Gejala lain akan disebut (sebagian) saat ditanya "keluhan lain"; gejala yang
  // tidak disebut sukarela (mis. BAB hitam) hanya terungkap bila ditanya spesifik.
  const others = [...symptoms].filter((id) => !chiefComplaintSymptoms.includes(id));
  const volunteers = (id: string) => content.symptomsById.get(id)?.volunteer !== false;
  const revealOrder = rng.fork('urutan').shuffle(others.filter(volunteers));
  const hiddenSymptoms = others.filter((id) => !volunteers(id));

  // --- Jawaban anamnesis --------------------------------------------------
  const answers: PatientCase['answers'] = {};
  for (const cat of content.anamnesis) {
    if (cat.type !== 'static') continue;
    if (cat.id === 'alergi') {
      answers[cat.id] = allergy
        ? { text: `Saya alergi ${allergy}, Dok. Dulu pernah gatal-gatal dan bengkak.`, clue: `Alergi ${allergy}` }
        : { text: 'Nggak ada alergi, Dok.' };
      continue;
    }
    answers[cat.id] = buildCategoryAnswer(
      cat.id,
      disease.anamnesis[cat.id],
      cat.fallback,
      personality,
      fullCtx,
      context,
      rng.fork(`anamnesis:${cat.id}`),
    );
  }

  mergeComorbidityHistory(answers, comorbidities, content, rng.fork('riwayat_komorbid'));

  // --- Hasil semua pemeriksaan --------------------------------------------
  const ruleSets: FindingSource[] = [
    { origin: disease.id, rules: disease.findings },
    ...comorbidities.map((c) => ({ origin: c.id, rules: content.comorbiditiesById.get(c.id)!.findings })),
    ...incidentals.map((id) => ({ origin: id, rules: content.incidentalsById.get(id)!.findings })),
  ];
  const findings: PatientCase['findings'] = {};
  for (const tool of content.tools) {
    findings[tool.id] = generateToolFindings(tool, ruleSets, fullCtx, config, rng.fork(`temuan:${tool.id}`));
  }
  linkFindings(content.tools, findings, { sex, age });

  return {
    seed: options.seed >>> 0,
    diseaseId: disease.id,
    patient,
    day,
    traits: [...traits],
    symptoms: [...symptoms],
    chiefComplaintSymptoms,
    revealOrder,
    hiddenSymptoms,
    greeting,
    complaint,
    answers,
    findings,
    context,
    comorbidities,
    incidentals,
    complications,
    allergy,
  };
}

/** Komorbiditas yang memenuhi syarat usia/jenis kelamin & tidak bertabrakan dengan penyakit utama (maks. 2). */
function sampleComorbidities(
  disease: DiseaseTemplate,
  content: GameContent,
  ctx: ConditionContext,
  rng: Rng,
): { id: string; known: boolean }[] {
  const out: { id: string; known: boolean }[] = [];
  for (const c of rng.shuffle(content.comorbidities)) {
    if (out.length >= MAX_COMORBIDITIES) break;
    if (!fitsPopulation(c.when, ctx)) continue;
    if (c.excludePrimary?.includes(disease.id)) continue;
    if (c.excludeTraits?.some((t) => ctx.traits.has(t))) continue;
    const cRng = rng.fork(c.id);
    if (!cRng.chance(c.probability)) continue;
    out.push({ id: c.id, known: cRng.chance(c.knownProbability) });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

function sampleIncidentals(content: GameContent, ctx: ConditionContext, rng: Rng): string[] {
  for (const inc of rng.shuffle(content.incidentals)) {
    if (!fitsPopulation(inc.when, ctx)) continue;
    if (rng.fork(inc.id).chance(inc.probability)) return [inc.id];
  }
  return [];
}

function fitsPopulation(when: { ageMin?: number; ageMax?: number; sex?: Sex } | undefined, ctx: ConditionContext): boolean {
  if (!when) return true;
  if (when.ageMin !== undefined && ctx.age < when.ageMin) return false;
  if (when.ageMax !== undefined && ctx.age > when.ageMax) return false;
  if (when.sex && when.sex !== ctx.sex) return false;
  return true;
}

/** Jawaban "negatif" (tidak ada / belum) yang harus DIGANTI, bukan ditambah, bila ada riwayat komorbid. */
const NEGATIVE_ANSWER = /^(nggak|tidak|belum)\b/i;

/**
 * Tambahkan riwayat komorbiditas ke jawaban anamnesis agar konsisten:
 * riwayat penyakit & obat hanya bila pasien TAHU; kebiasaan & keluarga selalu.
 */
function mergeComorbidityHistory(
  answers: PatientCase['answers'],
  comorbidities: { id: string; known: boolean }[],
  content: GameContent,
  rng: Rng,
): void {
  const add = (topic: string, sentence: string | undefined, clue: string) => {
    if (!sentence) return;
    const current = answers[topic];
    if (!current || NEGATIVE_ANSWER.test(current.text)) {
      answers[topic] = { text: sentence, clue };
    } else {
      answers[topic] = { ...current, text: `${current.text} ${sentence}`, clue: current.clue ?? clue };
    }
  };
  for (const c of comorbidities) {
    const def = content.comorbiditiesById.get(c.id)!;
    if (c.known) {
      add('riwayat_penyakit', def.history.known || undefined, `Riwayat ${def.name.toLowerCase()}`);
      add('riwayat_obat', def.history.medication, `Obat rutin untuk ${def.name.toLowerCase()}`);
    }
    add('kebiasaan', def.history.habit, `Faktor risiko ${def.name.toLowerCase()}`);
    if (rng.fork(c.id).chance(0.5)) add('riwayat_keluarga', def.history.family, `Riwayat keluarga ${def.name.toLowerCase()}`);
  }
}
