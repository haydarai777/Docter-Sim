/** Skor evaluasi alur pakar & lalai per skenario (kalibrasi penilaian). npx tsx scripts/igd-score.ts [id] [--detail] */
import { evaluatePatient } from '../src/core/igd/evaluation';
import { runPlan } from '../src/core/igd/sim';
import { loadDefaultContent } from '../src/data';
import { ED_SCENARIOS } from '../src/data/igd';

const ctx = { scenarios: new Map(ED_SCENARIOS.map((s) => [s.id, s])), content: loadDefaultContent() };
const only = process.argv.slice(2).find((a) => !a.startsWith('--'));
for (const sc of ED_SCENARIOS) {
  if (only && sc.id !== only) continue;
  const r = runPlan(ctx, sc.id, sc.variants?.[0]?.id, sc.expert, 150, 1);
  const e = evaluatePatient(r.shift, r.patient, ctx);
  const n = runPlan(ctx, sc.id, sc.variants?.[0]?.id, [sc.expert[0]!], 90, 1);
  const en = evaluatePatient(n.shift, n.patient, ctx);
  console.log(`${sc.id.padEnd(30)} pakar ${String(e.total).padStart(3)} (${e.parts.map((p) => `${p.id[0]}${Math.round(p.score)}`).join(' ')} −${e.penalty}) · lalai ${String(en.total).padStart(3)}`);
  if (process.argv.includes('--detail')) {
    for (const p of e.parts) for (const x of p.notes) console.log(`    [${p.id}] ${x}`);
    for (const m of e.missed) console.log(`    terlewat: ${m}`);
  }
}
