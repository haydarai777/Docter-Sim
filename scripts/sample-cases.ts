/**
 * Cetak contoh kasus hasil generator — untuk ditinjau dokter / pengembang.
 *
 * Pemakaian:
 *   npm run sample-cases                      # 3 kasus per penyakit
 *   npm run sample-cases -- --n 5             # 5 kasus per penyakit
 *   npm run sample-cases -- --disease malaria # hanya satu penyakit
 *   npm run sample-cases -- --seed 1234       # seed awal tertentu
 */
import { generateCase } from '../src/core/generator';
import { deriveSeed } from '../src/core/rng';
import { formatRupiah } from '../src/core/text';
import { GAME_CONFIG, loadDefaultContent } from '../src/data';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const content = loadDefaultContent();
const n = Number(arg('n') ?? 3);
const baseSeed = Number(arg('seed') ?? 2024);
const only = arg('disease');

for (const disease of content.diseases) {
  if (only && disease.id !== only) continue;
  console.log(`\n${'='.repeat(78)}\n${disease.name}  [SKDI ${disease.skdiLevel} · bahaya ${disease.danger}]\n${'='.repeat(78)}`);
  for (let i = 0; i < n; i++) {
    const seed = deriveSeed(baseSeed, `${disease.id}:${i}`);
    const c = generateCase(content, GAME_CONFIG, { diseaseId: disease.id, seed });
    const p = c.patient;
    console.log(`\n--- Kasus ${i + 1} (seed ${seed}) ---`);
    console.log(
      `${p.name}, ${p.age} th, ${p.sex === 'male' ? 'L' : 'P'}, ${p.occupationLabel}, ${p.economy} ` +
        `(budget ${formatRupiah(p.budget)}), kepribadian: ${p.personalityId}`,
    );
    console.log(`Hari sakit ke-${c.day} · trait: ${c.traits.join(', ') || '-'}`);
    console.log(`Gejala: ${c.symptoms.join(', ')}`);
    console.log(`> ${c.greeting}`);
    console.log(`> ${c.complaint}`);
    for (const [cat, a] of Object.entries(c.answers)) {
      console.log(`  [${cat}] ${a.text}${a.clue ? `   ← PETUNJUK: ${a.clue}` : ''}`);
    }
    for (const tool of content.tools) {
      const abn = c.findings[tool.id]!.filter((r) => r.flag !== null);
      if (abn.length) {
        const txt = abn.map((r) => `${r.label}=${r.display}${r.unit ? ' ' + r.unit : ''} (${r.flag}${r.source === 'false_positive' ? ', POSITIF PALSU' : ''})`);
        console.log(`  <${tool.name}> ${txt.join('; ')}`);
      }
    }
  }
}
