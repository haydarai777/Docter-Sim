/**
 * Validasi integritas skenario IGD (rujukan id pemeriksaan, obat, tindakan, diagnosis, gejala).
 */
import type { GameContent } from '../types';
import { QUICK_QUESTIONS } from './anamnesis';
import { ED_DIAGNOSES_BY_ID, EXAMS_BY_ID, FLUIDS_BY_ID, PROCS_BY_ID, SPECIALTIES_BY_ID, TESTS_BY_ID } from './catalog';
import { DRUGS_BY_ID } from './drugs';
import type { ActionMatch, EdAction, EdScenario } from './types';

const EXTRA_TOPICS = new Set(['makan_terakhir', 'kejadian', ...QUICK_QUESTIONS.map((q) => q.topic)]);

export function validateScenarios(scenarios: readonly EdScenario[], content: GameContent): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const topicIds = new Set([...content.anamnesis.map((c) => c.id), ...EXTRA_TOPICS]);
  for (const sc of scenarios) {
    const where = `igd:${sc.id}`;
    const err = (m: string) => errors.push(`${where}: ${m}`);
    if (ids.has(sc.id)) err('id ganda');
    ids.add(sc.id);
    if (![1, 2, 3, 4, 5].includes(sc.ats)) err(`ATS tidak valid ${sc.ats}`);
    if (sc.patient.age[0] > sc.patient.age[1]) err('rentang usia terbalik');
    for (const d of [...sc.diagnosis.primary, ...(sc.diagnosis.acceptable ?? []), ...(sc.diagnosis.secondary ?? [])]) if (!ED_DIAGNOSES_BY_ID.has(d)) err(`diagnosis tidak dikenal: ${d}`);
    for (const t of [...sc.indicatedTests, ...(sc.optionalTests ?? [])]) if (!TESTS_BY_ID.has(t)) err(`penunjang tidak dikenal: ${t}`);
    for (const d of sc.indicatedDrugs ?? []) if (!DRUGS_BY_ID.has(d)) err(`obat tidak dikenal: ${d}`);
    for (const s of sc.disposition.consult ?? []) if (!SPECIALTIES_BY_ID.has(s)) err(`konsulen tidak dikenal: ${s}`);
    for (const [who, inf] of Object.entries(sc.informants)) {
      for (const k of Object.keys(inf?.topics ?? {})) if (!topicIds.has(k)) err(`topik anamnesis tidak dikenal (${who}): ${k}`);
      for (const k of Object.keys(inf?.symptoms ?? {})) if (!content.symptomsById.has(k)) err(`gejala tidak dikenal (${who}): ${k}`);
    }
    if (sc.arrival.by === 'ambulans' && !sc.informants.paramedis) err('kedatangan ambulans tanpa narasumber paramedis');
    if (sc.patient.age[1] < 4 && !sc.informants.keluarga) err('anak kecil tanpa pengantar');
    const checkMatch = (m: ActionMatch, ctx: string) => {
      switch (m.kind) {
        case 'exam':
          if (!EXAMS_BY_ID.has(m.id)) err(`${ctx}: pemeriksaan ${m.id}`);
          break;
        case 'test':
          if (!TESTS_BY_ID.has(m.id)) err(`${ctx}: penunjang ${m.id}`);
          break;
        case 'proc':
          if (!PROCS_BY_ID.has(m.id)) err(`${ctx}: tindakan ${m.id}`);
          else if (m.param !== undefined) {
            const opts = PROCS_BY_ID.get(m.id)!.params?.options.map((o) => o.id) ?? [];
            if (!opts.includes(m.param)) err(`${ctx}: parameter ${m.id}=${m.param}`);
          }
          break;
        case 'drug': {
          const d = DRUGS_BY_ID.get(m.id);
          if (!d) err(`${ctx}: obat ${m.id}`);
          else for (const r of m.routes ?? []) if (r !== 'infus' && !d.routes.includes(r)) err(`${ctx}: rute ${m.id}/${r}`);
          break;
        }
        case 'fluid':
          for (const f of m.ids ?? []) if (!FLUIDS_BY_ID.has(f)) err(`${ctx}: cairan ${f}`);
          break;
        case 'consult':
          if (!SPECIALTIES_BY_ID.has(m.id)) err(`${ctx}: konsulen ${m.id}`);
          break;
        case 'any':
        case 'all':
          m.of.forEach((x) => checkMatch(x, ctx));
          break;
        default:
          break;
      }
    };
    for (const c of sc.critical) {
      checkMatch(c.match, `kritis ${c.id}`);
      if (c.byMin <= 0 || c.weight <= 0) err(`kritis ${c.id}: tenggat/bobot tidak valid`);
    }
    for (const h of sc.harmful ?? []) checkMatch(h.match, `bahaya ${h.id}`);
    for (const ev of sc.events ?? []) for (const m of ev.unless ?? []) checkMatch(m, `kejadian ${ev.id}`);
    const checkAction = (a: EdAction, i: number) => {
      const ctx = `pakar #${i}`;
      if (a.type === 'periksa' && !EXAMS_BY_ID.has(a.exam)) err(`${ctx}: pemeriksaan ${a.exam}`);
      if (a.type === 'penunjang' && !TESTS_BY_ID.has(a.test)) err(`${ctx}: penunjang ${a.test}`);
      if (a.type === 'tindakan' && !PROCS_BY_ID.has(a.proc)) err(`${ctx}: tindakan ${a.proc}`);
      if ((a.type === 'obat' || a.type === 'infus_obat') && !DRUGS_BY_ID.has(a.drug)) err(`${ctx}: obat ${a.drug}`);
      if (a.type === 'obat' && DRUGS_BY_ID.has(a.drug) && !DRUGS_BY_ID.get(a.drug)!.routes.includes(a.route)) err(`${ctx}: rute ${a.drug}/${a.route}`);
      if (a.type === 'infus_obat' && DRUGS_BY_ID.has(a.drug) && !DRUGS_BY_ID.get(a.drug)!.infusion) err(`${ctx}: ${a.drug} bukan infus`);
      if (a.type === 'diagnosis' && a.primary && !ED_DIAGNOSES_BY_ID.has(a.primary)) err(`${ctx}: diagnosis ${a.primary}`);
      if (a.type === 'konsul' && !SPECIALTIES_BY_ID.has(a.specialty)) err(`${ctx}: konsulen ${a.specialty}`);
    };
    sc.expert.forEach((st, i) => {
      if (typeof st.action !== 'function') checkAction(st.action, i);
    });
    if (!sc.debrief.referensi.length) err('tanpa referensi pedoman');
    if (!sc.debrief.tatalaksana.length) err('tanpa tatalaksana debrief');
  }
  return errors;
}
