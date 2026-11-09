import type {
  AnamnesisFile,
  CatalogEntry,
  ComorbiditiesFile,
  ConditionsFile,
  DiseaseTemplate,
  GameContent,
  PersonalitiesFile,
  PopulationFile,
  SymptomsFile,
  ToolsFile,
} from './types';

/** Isi mentah file-file konten (hasil import JSON). */
export interface RawContent {
  tools: ToolsFile;
  symptoms: SymptomsFile;
  anamnesis: AnamnesisFile;
  personalities: PersonalitiesFile;
  population: PopulationFile & { allergies?: string[] };
  diseases: DiseaseTemplate[];
  comorbidities: ComorbiditiesFile;
  conditions: ConditionsFile;
}

function indexById<T extends { id: string }>(items: readonly T[], what: string): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    if (map.has(item.id)) throw new Error(`${what}: id ganda "${item.id}"`);
    map.set(item.id, item);
  }
  return map;
}

/**
 * Katalog terpadu untuk papan diagnosis banding dan keputusan akhir.
 * Urutan prioritas bila id sama: penyakit kasus > komorbiditas > insidental > kondisi banding
 * (mis. "dm_tipe2" adalah penyakit kasus sekaligus komorbiditas — cukup satu entri).
 */
function buildCatalog(raw: RawContent): CatalogEntry[] {
  const entries = new Map<string, CatalogEntry>();
  const put = (e: CatalogEntry) => {
    if (!entries.has(e.id)) entries.set(e.id, e);
  };
  for (const d of raw.diseases) put({ id: d.id, name: d.name, aliases: d.aliases, system: d.system, kind: 'penyakit', danger: d.danger });
  for (const c of raw.comorbidities.comorbidities) put({ id: c.id, name: c.name, aliases: c.aliases, system: c.system, kind: 'komorbiditas', danger: 'sedang' });
  for (const i of raw.comorbidities.incidentals) put({ id: i.id, name: i.name, aliases: i.aliases, system: i.system, kind: 'insidental', danger: 'rendah' });
  for (const c of raw.conditions.conditions) put({ id: c.id, name: c.name, aliases: c.aliases, system: c.system, kind: 'banding', danger: c.danger });
  return [...entries.values()];
}

/**
 * Gabungkan file konten mentah menjadi GameContent yang terindeks.
 * Validasi isi dilakukan terpisah oleh validateContent() (lihat validate.ts).
 */
export function buildContent(raw: RawContent): GameContent {
  const catalog = buildCatalog(raw);
  return {
    tools: raw.tools.tools,
    toolsById: indexById(raw.tools.tools, 'Alat'),
    symptoms: raw.symptoms.symptoms,
    symptomsById: indexById(raw.symptoms.symptoms, 'Gejala'),
    anamnesis: raw.anamnesis.categories,
    anamnesisById: indexById(raw.anamnesis.categories, 'Topik anamnesis'),
    conversation: raw.anamnesis.conversation,
    reviews: raw.anamnesis.reviews ?? [],
    reviewsById: indexById(raw.anamnesis.reviews ?? [], 'Tinjauan sistem'),
    personalities: raw.personalities.personalities,
    personalitiesById: indexById(raw.personalities.personalities, 'Kepribadian'),
    population: raw.population,
    occupationsById: indexById(raw.population.occupations, 'Pekerjaan'),
    diseases: raw.diseases,
    diseasesById: indexById(raw.diseases, 'Penyakit'),
    comorbidities: raw.comorbidities.comorbidities,
    comorbiditiesById: indexById(raw.comorbidities.comorbidities, 'Komorbiditas'),
    incidentals: raw.comorbidities.incidentals,
    incidentalsById: indexById(raw.comorbidities.incidentals, 'Temuan insidental'),
    conditions: raw.conditions.conditions,
    catalog,
    catalogById: new Map(catalog.map((e) => [e.id, e])),
    allergies: raw.population.allergies ?? [],
  };
}
