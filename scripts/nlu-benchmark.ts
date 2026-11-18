/**
 * Benchmark pemahaman bahasa lokal (mode offline): jalankan korpus pertanyaan dokter
 * dan laporkan akurasi beserta butir yang meleset.
 *
 * - Korpus penyetelan (tests/fixtures/nluCorpus.ts): dipakai saat menyetel kata kunci.
 * - Korpus uji terpisah (tests/fixtures/nluHoldout*.ts): ditulis "buta" sebelum dipakai menyetel →
 *   angka pertama kalinya adalah ukuran generalisasi yang jujur.
 *
 *   npm run nlu-benchmark
 */
import { interpretQuestion } from '../src/core/nlu';
import { GAME_CONFIG, loadDefaultContent } from '../src/data';
import { NLU_CORPUS } from '../tests/fixtures/nluCorpus';
import { NLU_HOLDOUT } from '../tests/fixtures/nluHoldout';
import { NLU_HOLDOUT_2 } from '../tests/fixtures/nluHoldout2';
import { NLU_HOLDOUT_3 } from '../tests/fixtures/nluHoldout3';
import { scoreCorpus } from '../tests/fixtures/nluScore';

const content = loadDefaultContent();
const interpret = (q: string) => interpretQuestion(q, content, GAME_CONFIG.anamnesis.maxIntentsPerQuestion).intents;

for (const [name, cases] of [
  ['Korpus penyetelan', NLU_CORPUS],
  ['Korpus uji terpisah ronde 1', NLU_HOLDOUT],
  ['Korpus uji terpisah ronde 2', NLU_HOLDOUT_2],
  ['Korpus uji terpisah ronde 3', NLU_HOLDOUT_3],
] as const) {
  const s = scoreCorpus(cases, interpret);
  console.log(`${name}: ${s.ok}/${s.total} (${(s.accuracy * 100).toFixed(1)}%)`);
  for (const m of s.misses) console.log(`  ✗ ${m.q.padEnd(48)} ingin ${m.want.join(' ') || '(kosong)'} · dapat ${m.got.join(' ') || '(kosong)'}`);
}
