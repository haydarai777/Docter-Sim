/**
 * Titik masuk konten permainan.
 *
 * ⚠ PERINGATAN: seluruh konten medis di folder ini BELUM DITINJAU DOKTER.
 *   Jangan dirilis ke publik sebelum ditinjau (lihat REVIEW.md).
 */
import { buildContent } from '../core/content';
import type {
  AnamnesisFile,
  DiseaseTemplate,
  GameContent,
  PersonalitiesFile,
  PopulationFile,
  SymptomsFile,
  ToolsFile,
} from '../core/types';
import anamnesis from './anamnesis.json';
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
    population: population as unknown as PopulationFile,
    diseases: DISEASE_FILES as DiseaseTemplate[],
  });
}
