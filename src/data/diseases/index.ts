/**
 * Daftar file penyakit (dibuat ulang otomatis oleh generator konten; urut per sistem organ).
 *
 * CARA MENAMBAH PENYAKIT BARU:
 *  1. Salin salah satu file JSON di folder ini sebagai templat.
 *  2. Isi semua field (lihat tipe DiseaseTemplate di src/core/types.ts).
 *  3. Daftarkan di array DISEASE_FILES di bawah.
 *  4. Tambahkan harga alat baru (jika ada) di src/data/config.ts.
 *  5. Jalankan `npm test` — tes integritas data akan menunjukkan kesalahan.
 *
 * ⚠ Semua konten medis berstatus BELUM_DITINJAU_DOKTER sampai ditinjau dokter.
 */
// Endokrin & metabolik
import dmTipe2 from './dm_tipe2.json';
// Infeksi tropis
import demamTifoid from './demam_tifoid.json';
import dengue from './dengue.json';
import malaria from './malaria.json';
// Jantung & pembuluh darah
import anginaStabil from './angina_stabil.json';
// Jiwa
import gangguanSomatoform from './gangguan_somatoform.json';
import insomnia from './insomnia.json';
// Kepala & saraf
import bellsPalsy from './bells_palsy.json';
import bppv from './bppv.json';
import kejangDemam from './kejang_demam.json';
import migren from './migren.json';
import tensionHeadache from './tension_headache.json';
import tetanus from './tetanus.json';
// Mata
import astigmatisma from './astigmatisma.json';
import bendaAsingKonjungtiva from './benda_asing_konjungtiva.json';
import blefaritis from './blefaritis.json';
import butaSenja from './buta_senja.json';
import episkleritis from './episkleritis.json';
import hipermetropia from './hipermetropia.json';
import hordeolum from './hordeolum.json';
import konjungtivitis from './konjungtivitis.json';
import mataKering from './mata_kering.json';
import miopia from './miopia.json';
import perdarahanSubkonjungtiva from './perdarahan_subkonjungtiva.json';
import presbiopia from './presbiopia.json';
import trikiasis from './trikiasis.json';
// Pencernaan
import dispepsia from './dispepsia.json';
import gastritis from './gastritis.json';
import gerd from './gerd.json';
// Pernapasan
import asma from './asma.json';
import influenza from './influenza.json';
import pertusis from './pertusis.json';
import pneumonia from './pneumonia.json';
import tbParu from './tb_paru.json';
// Saluran kemih
import batuSaluranKemih from './batu_saluran_kemih.json';
import isk from './isk.json';
// Telinga, hidung & tenggorok
import bendaAsingTht from './benda_asing_tht.json';
import epistaksis from './epistaksis.json';
import faringitis from './faringitis.json';
import furunkelHidung from './furunkel_hidung.json';
import laringitis from './laringitis.json';
import mabukPerjalanan from './mabuk_perjalanan.json';
import otitisEksterna from './otitis_eksterna.json';
import otitisMediaAkut from './otitis_media_akut.json';
import rinitisAkut from './rinitis_akut.json';
import rinitisAlergi from './rinitis_alergi.json';
import rinitisVasomotor from './rinitis_vasomotor.json';
import serumenProp from './serumen_prop.json';
import tonsilitis from './tonsilitis.json';

export const DISEASE_FILES: unknown[] = [
  dmTipe2,
  demamTifoid,
  dengue,
  malaria,
  anginaStabil,
  gangguanSomatoform,
  insomnia,
  bellsPalsy,
  bppv,
  kejangDemam,
  migren,
  tensionHeadache,
  tetanus,
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
  dispepsia,
  gastritis,
  gerd,
  asma,
  influenza,
  pertusis,
  pneumonia,
  tbParu,
  batuSaluranKemih,
  isk,
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
