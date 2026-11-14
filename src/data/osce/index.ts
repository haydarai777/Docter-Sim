/**
 * Konten mode OSCE: formularium, kunci tatalaksana per penyakit, dan stasiun prosedur.
 *
 * ⚠ BELUM DITINJAU DOKTER — dosis & langkah prosedur wajib diverifikasi dengan pedoman terbaru.
 */
import { buildOsceContent, type OsceContent } from '../../core/osce/content';
import type { FormularyFile, OsceCaseDef, ProceduresFile } from '../../core/osce/types';
import anginaStabil from './cases/angina_stabil.json';
import asma from './cases/asma.json';
import batuSaluranKemih from './cases/batu_saluran_kemih.json';
import demamTifoid from './cases/demam_tifoid.json';
import dengue from './cases/dengue.json';
import dispepsia from './cases/dispepsia.json';
import dmTipe2 from './cases/dm_tipe2.json';
import gastritis from './cases/gastritis.json';
import gerd from './cases/gerd.json';
import isk from './cases/isk.json';
import malaria from './cases/malaria.json';
import pneumonia from './cases/pneumonia.json';
import tbParu from './cases/tb_paru.json';
import formulary from './formulary.json';
import procedures from './procedures.json';

export const OSCE_CASE_FILES: unknown[] = [
  dengue,
  demamTifoid,
  malaria,
  gerd,
  anginaStabil,
  dispepsia,
  gastritis,
  isk,
  batuSaluranKemih,
  dmTipe2,
  tbParu,
  pneumonia,
  asma,
];

export function loadOsceContent(): OsceContent {
  return buildOsceContent(formulary as unknown as FormularyFile, OSCE_CASE_FILES as OsceCaseDef[], procedures as unknown as ProceduresFile);
}
