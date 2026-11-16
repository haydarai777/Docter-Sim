/**
 * Konten mode OSCE: formularium, kunci tatalaksana per penyakit, dan stasiun prosedur.
 *
 * ⚠ BELUM DITINJAU DOKTER — dosis & langkah prosedur wajib diverifikasi dengan pedoman terbaru.
 * Berkas kasus selain 13 kasus awal dibuat oleh scripts/content-gen/osce_build.py.
 */
import { buildOsceContent, type OsceContent } from '../../core/osce/content';
import type { FormularyFile, OsceCaseDef, ProceduresFile } from '../../core/osce/types';
import alergiMakanan from './cases/alergi_makanan.json';
import anemiaDefisiensiBesi from './cases/anemia_defisiensi_besi.json';
import anginaStabil from './cases/angina_stabil.json';
import askariasis from './cases/askariasis.json';
import asma from './cases/asma.json';
import astigmatisma from './cases/astigmatisma.json';
import batuSaluranKemih from './cases/batu_saluran_kemih.json';
import bellsPalsy from './cases/bells_palsy.json';
import bendaAsingKonjungtiva from './cases/benda_asing_konjungtiva.json';
import bendaAsingTht from './cases/benda_asing_tht.json';
import blefaritis from './cases/blefaritis.json';
import bppv from './cases/bppv.json';
import bronkitisAkut from './cases/bronkitis_akut.json';
import butaSenja from './cases/buta_senja.json';
import cacingTambang from './cases/cacing_tambang.json';
import demamTifoid from './cases/demam_tifoid.json';
import dengue from './cases/dengue.json';
import disentri from './cases/disentri.json';
import dispepsia from './cases/dispepsia.json';
import dmTipe2 from './cases/dm_tipe2.json';
import episkleritis from './cases/episkleritis.json';
import epistaksis from './cases/epistaksis.json';
import faringitis from './cases/faringitis.json';
import filariasis from './cases/filariasis.json';
import furunkelHidung from './cases/furunkel_hidung.json';
import gangguanSomatoform from './cases/gangguan_somatoform.json';
import gastritis from './cases/gastritis.json';
import gastroenteritisAkut from './cases/gastroenteritis_akut.json';
import gerd from './cases/gerd.json';
import hemoroid from './cases/hemoroid.json';
import hepatitisA from './cases/hepatitis_a.json';
import hipermetropia from './cases/hipermetropia.json';
import hipertensi from './cases/hipertensi.json';
import hiv from './cases/hiv.json';
import hordeolum from './cases/hordeolum.json';
import infeksiUmbilikus from './cases/infeksi_umbilikus.json';
import influenza from './cases/influenza.json';
import insomnia from './cases/insomnia.json';
import intoleransiMakanan from './cases/intoleransi_makanan.json';
import isk from './cases/isk.json';
import kandidiasisMulut from './cases/kandidiasis_mulut.json';
import kejangDemam from './cases/kejang_demam.json';
import keracunanMakanan from './cases/keracunan_makanan.json';
import konjungtivitis from './cases/konjungtivitis.json';
import laringitis from './cases/laringitis.json';
import leptospirosis from './cases/leptospirosis.json';
import limfadenitis from './cases/limfadenitis.json';
import mabukPerjalanan from './cases/mabuk_perjalanan.json';
import malaria from './cases/malaria.json';
import mataKering from './cases/mata_kering.json';
import migren from './cases/migren.json';
import miopia from './cases/miopia.json';
import otitisEksterna from './cases/otitis_eksterna.json';
import otitisMediaAkut from './cases/otitis_media_akut.json';
import parotitis from './cases/parotitis.json';
import perdarahanSubkonjungtiva from './cases/perdarahan_subkonjungtiva.json';
import pertusis from './cases/pertusis.json';
import pneumonia from './cases/pneumonia.json';
import presbiopia from './cases/presbiopia.json';
import reaksiAnafilaktik from './cases/reaksi_anafilaktik.json';
import rinitisAkut from './cases/rinitis_akut.json';
import rinitisAlergi from './cases/rinitis_alergi.json';
import rinitisVasomotor from './cases/rinitis_vasomotor.json';
import serumenProp from './cases/serumen_prop.json';
import skistosomiasis from './cases/skistosomiasis.json';
import strongiloidiasis from './cases/strongiloidiasis.json';
import taeniasis from './cases/taeniasis.json';
import tbParu from './cases/tb_paru.json';
import tensionHeadache from './cases/tension_headache.json';
import tetanus from './cases/tetanus.json';
import tonsilitis from './cases/tonsilitis.json';
import trikiasis from './cases/trikiasis.json';
import ulkusMulut from './cases/ulkus_mulut.json';
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
  anemiaDefisiensiBesi,
  hiv,
  limfadenitis,
  reaksiAnafilaktik,
  filariasis,
  leptospirosis,
  hipertensi,
  gangguanSomatoform,
  insomnia,
  bellsPalsy,
  bppv,
  kejangDemam,
  migren,
  tensionHeadache,
  tetanus,
  alergiMakanan,
  astigmatisma,
  bendaAsingKonjungtiva,
  blefaritis,
  butaSenja,
  episkleritis,
  hipermetropia,
  hordeolum,
  konjungtivitis,
  mataKering,
  miopia,
  perdarahanSubkonjungtiva,
  presbiopia,
  trikiasis,
  askariasis,
  cacingTambang,
  disentri,
  gastroenteritisAkut,
  hemoroid,
  hepatitisA,
  infeksiUmbilikus,
  intoleransiMakanan,
  kandidiasisMulut,
  keracunanMakanan,
  parotitis,
  skistosomiasis,
  strongiloidiasis,
  taeniasis,
  ulkusMulut,
  bronkitisAkut,
  influenza,
  pertusis,
  bendaAsingTht,
  epistaksis,
  faringitis,
  furunkelHidung,
  laringitis,
  mabukPerjalanan,
  otitisEksterna,
  otitisMediaAkut,
  rinitisAkut,
  rinitisAlergi,
  rinitisVasomotor,
  serumenProp,
  tonsilitis,
];

export function loadOsceContent(): OsceContent {
  return buildOsceContent(formulary as unknown as FormularyFile, OSCE_CASE_FILES as OsceCaseDef[], procedures as unknown as ProceduresFile);
}
