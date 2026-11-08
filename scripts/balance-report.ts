/**
 * Laporan keseimbangan: biaya pemeriksaan vs budget, dan simulasi bot pemain.
 * Jalankan setelah mengubah src/data/config.ts:  npm run balance-report
 */
import { idealWorkupCost, toolPrice, wrongPenalty } from '../src/core/scoring';
import { simulateBot } from '../src/core/simulate';
import { formatRupiah } from '../src/core/text';
import { ECONOMY_CLASSES } from '../src/core/types';
import { GAME_CONFIG, loadDefaultContent } from '../src/data';

const content = loadDefaultContent();
const cfg = GAME_CONFIG;
const pad = (s: string | number, n: number) => String(s).padEnd(n);

console.log('\n=== Biaya pemeriksaan ideal vs budget ===');
console.log(ECONOMY_CLASSES.map((e) => `${e}: ${formatRupiah(cfg.economy.classes[e].budget[0])}–${formatRupiah(cfg.economy.classes[e].budget[1])}`).join(' · '));
console.log(`\n${pad('Penyakit', 44)}${pad('Ideal', 12)}${pad('Termurah informatif', 34)}${pad('Penalti', 8)}Petunjuk anamnesis`);
for (const d of content.diseases) {
  const cheapest = d.findings
    .filter((f) => (f.probability ?? 1) >= 0.5)
    .map((f) => ({ tool: f.tool, price: toolPrice(f.tool, cfg) }))
    .sort((a, b) => a.price - b.price)[0];
  const clueCats = Object.values(d.anamnesis).filter((v) => v.some((x) => x.clue)).length;
  const toolName = cheapest ? `${content.toolsById.get(cheapest.tool)?.name} (${formatRupiah(cheapest.price)})` : '-';
  console.log(`${pad(d.name.slice(0, 42), 44)}${pad(formatRupiah(idealWorkupCost(d, cfg)), 12)}${pad(toolName.slice(0, 32), 34)}${pad('-' + wrongPenalty(d, cfg), 8)}${clueCats} kategori`);
}

console.log('\n=== Simulasi bot (300 sesi, maks. 60 pasien) ===');
console.log(`${pad('Akurasi', 10)}${pad('Game over', 12)}${pad('Median pasien', 16)}Reputasi akhir rata-rata`);
for (const accuracy of [1 / content.diseases.length, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]) {
  const r = simulateBot(content, cfg, { accuracy, runs: 300, maxPatients: 60, seed: 1 });
  console.log(`${pad(Math.round(accuracy * 100) + '%', 10)}${pad(Math.round(r.gameOverRate * 100) + '%', 12)}${pad(r.medianPatientsToGameOver ?? '-', 16)}${r.averageFinalReputation.toFixed(1)}`);
}
console.log('\nCatatan: bot tidak membeli pemeriksaan (bonus hemat selalu penuh), jadi permainan nyata sedikit lebih sulit.\n');
