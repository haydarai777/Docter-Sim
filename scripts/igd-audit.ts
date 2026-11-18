/**
 * Audit skenario IGD: jalankan alur pakar (harus stabil, tanpa tindakan berbahaya) dan alur
 * lalai (hanya triase) untuk setiap skenario & varian. Cetak perjalanan tanda vital ringkas.
 *
 *   npx tsx scripts/igd-audit.ts [id-skenario] [--detail]
 */
import { vitalsOf } from '../src/core/igd/engine';
import { runPlan } from '../src/core/igd/sim';
import { loadDefaultContent } from '../src/data';
import { ED_SCENARIOS } from '../src/data/igd';

const content = loadDefaultContent();
const ctx = { scenarios: new Map(ED_SCENARIOS.map((s) => [s.id, s])), content };
const only = process.argv.slice(2).find((a) => !a.startsWith('--'));
const detail = process.argv.includes('--detail');
let problems = 0;
for (const sc of ED_SCENARIOS) {
  if (only && sc.id !== only) continue;
  const variants = sc.variants?.map((v) => v.id) ?? [undefined];
  for (const variant of variants) {
    for (const seed of [1, 2, 3]) {
      const r = runPlan(ctx, sc.id, variant, sc.expert, 150, seed);
      const p = r.patient;
      const v = vitalsOf(p, r.shift.time);
      const harms = p.actions.flatMap((a) => a.harms ?? []);
      const bad = p.outcome !== 'stabil' || harms.length > 0 || r.failures.length > 0;
      if (bad) problems++;
      console.log(`${bad ? '✗' : '✓'} ${sc.id}${variant ? `/${variant}` : ''} #${seed} pakar: ${p.outcome ?? p.status} @${Math.round(r.shift.time / 60)}m · TD ${v.sbp}/${v.dbp} N ${v.hr} RR ${v.rr} SpO₂ ${v.spo2} GCS ${v.gcs.total}${harms.length ? ` · BAHAYA: ${harms.join(',')}` : ''}${r.failures.length ? ` · GAGAL: ${r.failures.join(' | ')}` : ''}`);
      if (detail || bad) for (const n of p.notes) console.log(`     ${Math.round((n.t - p.arriveAt) / 60)}m ${n.kind}: ${n.text}`);
      if (detail) for (const s of p.timeline.filter((_, i) => i % 10 === 0)) console.log(`     t${Math.round(s.t / 60)} TD ${s.sbp}/${s.dbp} N ${s.hr} RR ${s.rr} SpO₂ ${s.spo2} GCS ${s.gcs} ${s.rhythm}`);
    }
    const n = runPlan(ctx, sc.id, variant, [sc.expert[0]!], 90, 1);
    const nv = vitalsOf(n.patient, n.shift.time);
    const deadMin = n.patient.notes.find((x) => /meninggal|henti jantung/i.test(x.text));
    console.log(`  lalai: ${n.patient.physio.dead ? 'MENINGGAL' : n.patient.physio.arrest ? 'HENTI JANTUNG' : 'hidup'}${deadMin ? ` (${Math.round((deadMin.t - n.patient.arriveAt) / 60)}m ${deadMin.text})` : ''} · TD ${nv.sbp}/${nv.dbp} N ${nv.hr} RR ${nv.rr} SpO₂ ${nv.spo2} GCS ${nv.gcs.total}`);
    if (detail) for (const s of n.patient.timeline.filter((_, i) => i % 10 === 0)) console.log(`     t${Math.round(s.t / 60)} TD ${s.sbp}/${s.dbp} N ${s.hr} RR ${s.rr} SpO₂ ${s.spo2} GCS ${s.gcs} ${s.rhythm}`);
  }
}
console.log(problems ? `\n${problems} masalah.` : '\nSemua alur pakar stabil tanpa tindakan berbahaya.');
process.exit(problems ? 1 : 0);
