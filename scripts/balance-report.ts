/**
 * Laporan keseimbangan: biaya pemeriksaan sesuai rencana vs budget, dan simulasi bot pemain.
 * Jalankan setelah mengubah src/data/config.ts:  npm run balance-report
 */
import { planTestCost, wrongPenalty } from '../src/core/scoring';
import { simulateBot } from '../src/core/simulate';
import { formatRupiah } from '../src/core/text';
import { ECONOMY_CLASSES } from '../src/core/types';
import { GAME_CONFIG, loadDefaultContent } from '../src/data';

const content = loadDefaultContent();
const cfg = GAME_CONFIG;
const pad = (s: string | number, n: number) => String(s).padEnd(n);

console.log('\n=== Biaya pemeriksaan penunjang (rencana kasus) vs budget ===');
console.log(ECONOMY_CLASSES.map((e) => `${e}: ${formatRupiah(cfg.economy.classes[e].budget[0])}–${formatRupiah(cfg.economy.classes[e].budget[1])}`).join(' · '));
console.log(`\n${pad('Penyakit', 40)}${pad('Kunci', 12)}${pad('+Pendukung', 12)}${pad('Semua', 12)}${pad('Penalti', 9)}Banding / komplikasi`);
for (const d of content.diseases) {
  const key = planTestCost(d, cfg, ['kunci']);
  const support = planTestCost(d, cfg, ['kunci', 'pendukung']);
  const all = planTestCost(d, cfg, ['kunci', 'pendukung', 'komplikasi']);
  console.log(
    `${pad(d.name.slice(0, 38), 40)}${pad(formatRupiah(key), 12)}${pad(formatRupiah(support), 12)}${pad(formatRupiah(all), 12)}${pad('-' + wrongPenalty(d, cfg), 9)}${d.differentials.length} / ${(d.complications ?? []).length}`,
  );
}

console.log('\n=== Simulasi bot (200 sesi, maks. 40 pasien) ===');
console.log(`${pad('Skill', 8)}${pad('Akurasi', 10)}${pad('Skor rata2', 12)}${pad('Game over', 12)}${pad('Median pasien', 16)}Reputasi akhir rata-rata`);
for (const [skill, accuracy] of [
  [0.2, 1 / content.diseases.length],
  [0.3, 0.3],
  [0.5, 0.5],
  [0.6, 0.6],
  [0.7, 0.7],
  [0.8, 0.8],
  [0.9, 0.9],
  [1, 1],
] as const) {
  const r = simulateBot(content, cfg, { skill, accuracy, runs: 200, maxPatients: 40, seed: 1 });
  console.log(
    `${pad(skill, 8)}${pad(Math.round(accuracy * 100) + '%', 10)}${pad(r.averageScore.toFixed(1), 12)}${pad(Math.round(r.gameOverRate * 100) + '%', 12)}${pad(r.medianPatientsToGameOver ?? '-', 16)}${r.averageFinalReputation.toFixed(1)}`,
  );
}
console.log('');
