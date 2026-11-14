/**
 * Titik masuk konten permainan.
 *
 * ⚠ PERINGATAN: seluruh konten medis di folder ini BELUM DITINJAU DOKTER.
 *   Jangan dirilis ke publik sebelum ditinjau (lihat REVIEW.md).
 */
import { buildContent } from '../core/content';
import type {
  AnamnesisFile,
  AppearanceFile,
  ComorbiditiesFile,
  ConditionsFile,
  DiseaseTemplate,
  GameContent,
  PersonalitiesFile,
  PopulationFile,
  SymptomsFile,
  ToolsFile,
} from '../core/types';
import anamnesis from './anamnesis.json';
import appearance from './appearance.json';
import comorbidities from './comorbidities.json';
import conditions from './conditions.json';
import { DISEASE_FILES } from './diseases';
import personalities from './personalities.json';
import population from './population.json';
import symptoms from './symptoms.json';
import tools from './tools.json';

export { GAME_CONFIG } from './config';

/** Muat konten bawaan. Bentuk JSON diperiksa oleh validateContent() di tes & mode dev. */
export function loadDefaultContent(): GameContent {
  return buildContent({
    tools: tools as unknown as ToolsFile,
    symptoms: symptoms as unknown as SymptomsFile,
    anamnesis: anamnesis as unknown as AnamnesisFile,
    personalities: personalities as unknown as PersonalitiesFile,
    population: population as unknown as PopulationFile & { allergies: string[] },
    diseases: DISEASE_FILES as DiseaseTemplate[],
    comorbidities: comorbidities as unknown as ComorbiditiesFile,
    conditions: conditions as unknown as ConditionsFile,
    appearance: appearance as unknown as AppearanceFile,
  });
}
