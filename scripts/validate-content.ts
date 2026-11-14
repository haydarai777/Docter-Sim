/**
 * Validasi integritas seluruh konten (termasuk konten mode OSCE).  Jalankan: npm run validate-content
 */
import { validateOsceContent } from '../src/core/osce/validate';
import { validateContent } from '../src/core/validate';
import { GAME_CONFIG, loadDefaultContent } from '../src/data';
import { loadOsceContent } from '../src/data/osce';

const content = loadDefaultContent();
const osce = loadOsceContent();
const errors = [...validateContent(content, GAME_CONFIG), ...validateOsceContent(osce, content)];
if (errors.length > 0) {
  console.error(`✗ ${errors.length} masalah konten ditemukan:\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `✓ Konten valid: ${content.diseases.length} penyakit, ${content.tools.length} alat, ` +
    `${content.symptoms.length} gejala, ${content.personalities.length} kepribadian; ` +
    `OSCE: ${osce.drugs.length} obat, ${osce.cases.length} kunci stasiun, ${osce.procedures.length} prosedur.`,
);
