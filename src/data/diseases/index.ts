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
// Anak
import infeksiUmbilikus from './infeksi_umbilikus.json';
import malnutrisiEnergiProtein from './malnutrisi_energi_protein.json';
// Darah & imunologi
import anemiaDefisiensiBesi from './anemia_defisiensi_besi.json';
// Endokrin & metabolik
import defisiensiMineral from './defisiensi_mineral.json';
import defisiensiVitamin from './defisiensi_vitamin.json';
import dislipidemia from './dislipidemia.json';
import dmTipe1 from './dm_tipe1.json';
import dmTipe2 from './dm_tipe2.json';
import hipoglikemia from './hipoglikemia.json';
import obesitas from './obesitas.json';
// Infeksi & imunologi
import hiv from './hiv.json';
import limfadenitis from './limfadenitis.json';
import reaksiAnafilaktik from './reaksi_anafilaktik.json';
// Infeksi tropis
import demamTifoid from './demam_tifoid.json';
import dengue from './dengue.json';
import filariasis from './filariasis.json';
import leptospirosis from './leptospirosis.json';
import malaria from './malaria.json';
// Jantung & pembuluh darah
import anginaStabil from './angina_stabil.json';
import hipertensi from './hipertensi.json';
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
// Kulit & kelamin
import alergiMakanan from './alergi_makanan.json';
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
// Obstetri & ginekologi
import abortusKomplit from './abortus_komplit.json';
import anemiaKehamilan from './anemia_kehamilan.json';
import crackedNipple from './cracked_nipple.json';
import invertedNipple from './inverted_nipple.json';
import kehamilanNormal from './kehamilan_normal.json';
import mastitis from './mastitis.json';
import rupturPerineum from './ruptur_perineum.json';
// Otot & sendi
import hiperurisemia from './hiperurisemia.json';
// Pencernaan
import askariasis from './askariasis.json';
import cacingTambang from './cacing_tambang.json';
import disentri from './disentri.json';
import dispepsia from './dispepsia.json';
import gastritis from './gastritis.json';
import gastroenteritisAkut from './gastroenteritis_akut.json';
import gerd from './gerd.json';
import hemoroid from './hemoroid.json';
import hepatitisA from './hepatitis_a.json';
import intoleransiMakanan from './intoleransi_makanan.json';
import kandidiasisMulut from './kandidiasis_mulut.json';
import keracunanMakanan from './keracunan_makanan.json';
import parotitis from './parotitis.json';
import skistosomiasis from './skistosomiasis.json';
import strongiloidiasis from './strongiloidiasis.json';
import taeniasis from './taeniasis.json';
import ulkusMulut from './ulkus_mulut.json';
// Pernapasan
import asma from './asma.json';
import bronkitisAkut from './bronkitis_akut.json';
import influenza from './influenza.json';
import pertusis from './pertusis.json';
import pneumonia from './pneumonia.json';
import tbParu from './tb_paru.json';
// Saluran kemih
import batuSaluranKemih from './batu_saluran_kemih.json';
import isk from './isk.json';
// Saluran kemih & kelamin
import fimosis from './fimosis.json';
import gonore from './gonore.json';
import parafimosis from './parafimosis.json';
import pielonefritis from './pielonefritis.json';
import salpingitis from './salpingitis.json';
import uretritisNonGonore from './uretritis_non_gonore.json';
import vaginitis from './vaginitis.json';
import vaginosisBakterialis from './vaginosis_bakterialis.json';
import vulvitis from './vulvitis.json';
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
  infeksiUmbilikus,
  malnutrisiEnergiProtein,
  anemiaDefisiensiBesi,
  defisiensiMineral,
  defisiensiVitamin,
  dislipidemia,
  dmTipe1,
  dmTipe2,
  hipoglikemia,
  obesitas,
  hiv,
  limfadenitis,
  reaksiAnafilaktik,
  demamTifoid,
  dengue,
  filariasis,
  leptospirosis,
  malaria,
  anginaStabil,
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
  abortusKomplit,
  anemiaKehamilan,
  crackedNipple,
  invertedNipple,
  kehamilanNormal,
  mastitis,
  rupturPerineum,
  hiperurisemia,
  askariasis,
  cacingTambang,
  disentri,
  dispepsia,
  gastritis,
  gastroenteritisAkut,
  gerd,
  hemoroid,
  hepatitisA,
  intoleransiMakanan,
  kandidiasisMulut,
  keracunanMakanan,
  parotitis,
  skistosomiasis,
  strongiloidiasis,
  taeniasis,
  ulkusMulut,
  asma,
  bronkitisAkut,
  influenza,
  pertusis,
  pneumonia,
  tbParu,
  batuSaluranKemih,
  isk,
  fimosis,
  gonore,
  parafimosis,
  pielonefritis,
  salpingitis,
  uretritisNonGonore,
  vaginitis,
  vaginosisBakterialis,
  vulvitis,
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
