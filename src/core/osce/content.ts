/**
 * Konten mode OSCE terindeks: formularium, kunci tatalaksana per penyakit, dan prosedur.
 */
import type { DrugDef, DrugForm, FormularyFile, OsceCaseDef, ProcedureDef, ProceduresFile } from './types';

export interface OsceContent {
  formulary: FormularyFile;
  drugs: DrugDef[];
  drugsById: Map<string, DrugDef>;
  formsById: Map<string, { drug: DrugDef; form: DrugForm }>;
  cases: OsceCaseDef[];
  casesById: Map<string, OsceCaseDef>;
  procedures: ProcedureDef[];
  proceduresById: Map<string, ProcedureDef>;
}

function indexById<T extends { id: string }>(items: readonly T[], what: string): Map<string, T> {
  const map = new Map<string, T>();
  for (const it of items) {
    if (map.has(it.id)) throw new Error(`${what}: id ganda "${it.id}"`);
    map.set(it.id, it);
  }
  return map;
}

export function buildOsceContent(formulary: FormularyFile, cases: OsceCaseDef[], procedures: ProceduresFile): OsceContent {
  const formsById = new Map<string, { drug: DrugDef; form: DrugForm }>();
  for (const drug of formulary.drugs) {
    for (const form of drug.forms) {
      if (formsById.has(form.id)) throw new Error(`Sediaan: id ganda "${form.id}"`);
      formsById.set(form.id, { drug, form });
    }
  }
  const casesById = new Map<string, OsceCaseDef>();
  for (const c of cases) {
    if (casesById.has(c.disease)) throw new Error(`Kunci OSCE ganda untuk "${c.disease}"`);
    casesById.set(c.disease, c);
  }
  return {
    formulary,
    drugs: formulary.drugs,
    drugsById: indexById(formulary.drugs, 'Obat'),
    formsById,
    cases,
    casesById,
    procedures: procedures.procedures,
    proceduresById: indexById(procedures.procedures, 'Prosedur'),
  };
}

/** Nama obat untuk pencarian (nama + alias, huruf kecil tanpa tanda baca). */
export function drugSearchText(drug: DrugDef): string {
  return [drug.name, ...(drug.aliases ?? [])].join(' ').toLowerCase();
}
