/**
 * Validasi integritas seluruh konten.  Jalankan: npm run validate-content
 */
import { validateContent } from '../src/core/validate';
import { GAME_CONFIG, loadDefaultContent } from '../src/data';

const content = loadDefaultContent();
const errors = validateContent(content, GAME_CONFIG);
if (errors.length > 0) {
  console.error(`✗ ${errors.length} masalah konten ditemukan:\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `✓ Konten valid: ${content.diseases.length} penyakit, ${content.tools.length} alat, ` +
    `${content.symptoms.length} gejala, ${content.personalities.length} kepribadian.`,
);
