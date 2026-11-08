/**
 * Ringkasan edukatif setelah diagnosis: diagnosis yang benar, petunjuk kunci
 * di kasus ini (ditemukan/terlewat), pemeriksaan paling berguna, pemeriksaan
 * yang kurang berguna, hasil positif palsu, dan cara membedakan dengan
 * diagnosis yang dipilih pemain.
 */
import { idealWorkupCost, toolPrice } from './scoring';
import type { DiagnosisOutcome, DiseaseTemplate, EncounterState, GameConfig, GameContent } from './types';

export interface ClueItem {
  text: string;
  found: boolean;
  source: 'Anamnesis' | 'Gejala' | 'Pemeriksaan';
}

export interface WorkupItem {
  toolId: string;
  name: string;
  cost: number;
  done: boolean;
}

export interface EncounterSummary {
  disease: DiseaseTemplate;
  chosen: DiseaseTemplate;
  outcome: DiagnosisOutcome;
  day: number;
  caseNotes: string[];
  clues: ClueItem[];
  falsePositives: string[];
  idealWorkup: WorkupItem[];
  lowYieldExams: WorkupItem[];
  differentialNote: string | null;
  budget: number;
  idealCost: number;
}

function formatAbnormal(label: string, display: string, unit?: string): string {
  return unit ? `${label} ${display} ${unit}` : `${label}: ${display}`;
}

export function buildSummary(state: EncounterState, content: GameContent, config: GameConfig): EncounterSummary {
  const outcome = state.outcome;
  if (!outcome) throw new Error('Ringkasan hanya tersedia setelah diagnosis.');
  const c = state.case;
  const disease = content.diseasesById.get(c.diseaseId)!;
  const chosen = content.diseasesById.get(outcome.chosenId)!;

  // Catatan kasus dari trait yang punya label edukatif.
  const caseNotes = c.traits.map((t) => disease.traitLabels?.[t]).filter((x): x is string => !!x);

  // Petunjuk dari anamnesis (dedupe teks yang sama).
  const clues: ClueItem[] = [];
  const seen = new Set<string>();
  for (const [catId, answer] of Object.entries(c.answers)) {
    if (!answer.clue || seen.has(answer.clue)) continue;
    seen.add(answer.clue);
    clues.push({ text: answer.clue, found: state.askedCategories.includes(catId), source: 'Anamnesis' });
  }
  // Petunjuk dari gejala khas yang ada pada kasus ini.
  for (const id of disease.clueSymptoms ?? []) {
    if (!c.symptoms.includes(id)) continue;
    const label = content.symptomsById.get(id)?.label ?? id;
    clues.push({ text: label, found: state.revealedSymptoms.includes(id), source: 'Gejala' });
  }
  // Petunjuk dari temuan abnormal yang disebabkan penyakit (satu baris per alat).
  const falsePositives: string[] = [];
  for (const tool of content.tools) {
    const results = c.findings[tool.id] ?? [];
    const abnormal = results.filter((r) => r.source === 'disease' && r.flag !== null);
    if (abnormal.length > 0) {
      const detail = abnormal.map((r) => formatAbnormal(r.label, r.display, r.unit)).join('; ');
      clues.push({ text: `${tool.name} — ${detail}`, found: state.examsDone.includes(tool.id), source: 'Pemeriksaan' });
    }
    if (state.examsDone.includes(tool.id)) {
      for (const r of results.filter((x) => x.source === 'false_positive')) {
        falsePositives.push(`${tool.name}: ${formatAbnormal(r.label, r.display, r.unit)}`);
      }
    }
  }

  const idealWorkup: WorkupItem[] = disease.idealWorkup.map((id) => ({
    toolId: id,
    name: content.toolsById.get(id)?.name ?? id,
    cost: toolPrice(id, config),
    done: state.examsDone.includes(id),
  }));

  // Pemeriksaan yang dilakukan, bukan bagian workup ideal, dan tidak menunjukkan kelainan akibat penyakit.
  const lowYieldExams: WorkupItem[] = state.examsDone
    .filter((id) => !disease.idealWorkup.includes(id))
    .filter((id) => !(c.findings[id] ?? []).some((r) => r.source === 'disease' && r.flag !== null))
    .map((id) => ({ toolId: id, name: content.toolsById.get(id)?.name ?? id, cost: toolPrice(id, config), done: true }));

  let differentialNote: string | null = null;
  if (!outcome.correct) {
    differentialNote =
      disease.differentials.find((d) => d.id === chosen.id)?.howToDistinguish ??
      chosen.differentials.find((d) => d.id === disease.id)?.howToDistinguish ??
      null;
  }

  return {
    disease,
    chosen,
    outcome,
    day: c.day,
    caseNotes,
    clues,
    falsePositives,
    idealWorkup,
    lowYieldExams,
    differentialNote,
    budget: c.patient.budget,
    idealCost: idealWorkupCost(disease, config),
  };
}
