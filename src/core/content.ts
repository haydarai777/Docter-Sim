import type {
  AnamnesisFile,
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
  population: PopulationFile;
  diseases: DiseaseTemplate[];
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
 * Gabungkan file konten mentah menjadi GameContent yang terindeks.
 * Validasi isi dilakukan terpisah oleh validateContent() (lihat validate.ts).
 */
export function buildContent(raw: RawContent): GameContent {
  return {
    tools: raw.tools.tools,
    toolsById: indexById(raw.tools.tools, 'Alat'),
    symptoms: raw.symptoms.symptoms,
    symptomsById: indexById(raw.symptoms.symptoms, 'Gejala'),
    anamnesis: raw.anamnesis.categories,
    anamnesisById: indexById(raw.anamnesis.categories, 'Kategori anamnesis'),
    personalities: raw.personalities.personalities,
    personalitiesById: indexById(raw.personalities.personalities, 'Kepribadian'),
    population: raw.population,
    occupationsById: indexById(raw.population.occupations, 'Pekerjaan'),
    diseases: raw.diseases,
    diseasesById: indexById(raw.diseases, 'Penyakit'),
  };
}
