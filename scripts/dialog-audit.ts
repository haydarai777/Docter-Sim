/**
 * Audit dialog pasien: wawancara standar + pertanyaan baku setiap gejala untuk semua penyakit.
 * Mendeteksi: pertanyaan baku gejala yang disalahpahami, gejala yang ada tetapi tidak terungkap,
 * placeholder tersisa, kalimat ganda, suara pengantar ("badan saya" dari orang tua), jawaban haid
 * untuk laki-laki, dan pertanyaan standar yang tidak dipahami.
 *
 *   npm run dialog-audit                 # ringkasan
 *   npm run dialog-audit -- --out audit  # juga tulis transkrip per penyakit ke folder audit/
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { askQuestion, startEncounter } from '../src/core/encounter';
import { generateCase } from '../src/core/generator';
import { interpretQuestion, stripChildReference } from '../src/core/nlu';
import type { EncounterState } from '../src/core/types';
import { GAME_CONFIG as config, loadDefaultContent } from '../src/data/index';

const content = loadDefaultContent();
const outIdx = process.argv.indexOf('--out');
const out = outIdx > 0 ? process.argv[outIdx + 1] : null;
const BATTERY = [
  'Selamat pagi, ada keluhan apa?', 'Sejak kapan?', 'Di bagian mana?', 'Rasanya seperti apa?', 'Apa yang membuat lebih berat atau lebih ringan?',
  'Makin lama makin parah atau tidak?', 'Seberapa berat keluhannya?', 'Ada keluhan lain?', 'Pernah seperti ini sebelumnya?', 'Ada riwayat penyakit lain?',
  'Sedang minum obat apa?', 'Ada alergi obat?', 'Di keluarga ada yang sakit serupa?', 'Kebiasaan sehari-hari bagaimana? Merokok?', 'Habis bepergian ke mana?',
  'Pekerjaannya apa?', 'Apa yang dikhawatirkan?', 'Harapannya apa?', 'Haidnya teratur?', 'Ada demam?', 'Nafsu makan bagaimana?', 'BAB dan kencingnya bagaimana?',
];
const issues: string[] = [];
const unknown = new Map<string, number>();
if (out) mkdirSync(out, { recursive: true });

for (const s of content.symptoms) {
  const ints = interpretQuestion(stripChildReference(s.question), content, 3).intents;
  if (!ints.some((i) => (i.kind === 'symptom' || i.kind === 'symptom_detail') && i.symptom === s.id)) issues.push(`pertanyaan baku ${s.id}: "${s.question}" → ${JSON.stringify(ints)}`);
}
for (const d of content.diseases) {
  const lines: string[] = [];
  // 4 kasus acak + (bila ada) satu kasus hari sakit pertama, agar frasa "tadi/baru tadi" ikut teraudit.
  const seeds = [1, 2, 3, 4];
  const dayOf = (seed: number) => generateCase(content, config, { diseaseId: d.id, seed: seed * 101 }).day;
  if (!seeds.some((x) => dayOf(x) === 1)) {
    const first = Array.from({ length: 60 }, (_, i) => i + 5).find((x) => dayOf(x) === 1);
    if (first) seeds.push(first);
  }
  for (const seed of seeds) {
    const c = generateCase(content, config, { diseaseId: d.id, seed: seed * 101 });
    let st: EncounterState = startEncounter({ ...c, patient: { ...c.patient, budget: 9e9 } });
    lines.push(`## ${d.id} #${seed} — ${c.patient.name}, ${c.patient.age} th, ${c.patient.sex}${c.patient.companion ? ` (diantar ${c.patient.companion.relation})` : ''} · hari ${c.day} · ${c.traits.join(', ')}`, `P: ${c.complaint}`);
    const ask = (q: string) => {
      const r = askQuestion(st, q, content, config);
      st = r.state;
      lines.push(`D: ${q}`, `P: ${r.reply}`);
      if (!r.understood) unknown.set(q, (unknown.get(q) ?? 0) + 1);
      const tag = `${d.id}#${seed} «${q}»`;
      if (/\{[A-Za-z]/.test(r.reply)) issues.push(`placeholder ${tag}: ${r.reply}`);
      if (c.day === 1 && /\b(sehari (?:lalu|ini)|sudah sehari)\b/i.test(r.reply)) issues.push(`hari pertama berbunyi "sehari" ${tag}: ${r.reply}`);
      const sents = r.reply.split(/(?<=[.!?])\s+/).map((x) => x.trim().toLowerCase()).filter((x) => x.length > 12);
      if (new Set(sents).size < sents.length) issues.push(`kalimat ganda ${tag}: ${r.reply}`);
      if (c.patient.companion && /\b(badan|kepala|perut|mata|telinga|kulit|kaki|tangan|dada|leher|gigi|mulut) saya\b/i.test(r.reply)) issues.push(`suara pengantar ${tag}: ${r.reply}`);
      if (c.patient.sex === 'male' && /\b(haid|menstruasi)\b/i.test(r.reply) && !/nggak|tidak|bukan|laki/i.test(r.reply)) issues.push(`laki-laki haid ${tag}: ${r.reply}`);
    };
    for (const q of BATTERY) ask(q);
    for (const s of d.symptoms) {
      const def = content.symptomsById.get(s.id)!;
      ask(def.question);
      if (c.symptoms.includes(s.id) && !st.revealedSymptoms.includes(s.id)) issues.push(`gejala ada tetapi tidak terungkap ${d.id}#${seed} ${s.id} «${def.question}»`);
    }
    lines.push('');
  }
  if (out) writeFileSync(`${out}/${d.id}.md`, lines.join('\n'));
}
for (const [q, n] of [...unknown].sort((a, b) => b[1] - a[1])) issues.push(`tidak dipahami ×${n}: ${q}`);
console.log(issues.length ? issues.join('\n') : '✓ Tidak ada temuan.');
console.log(`\n${content.diseases.length} penyakit × 4–5 kasus (termasuk hari sakit pertama bila mungkin) diaudit; ${issues.length} temuan.`);
process.exit(issues.length ? 1 : 0);
