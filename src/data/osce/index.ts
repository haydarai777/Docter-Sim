/**
 * Konten mode OSCE: formularium, kunci tatalaksana per penyakit, dan stasiun prosedur.
 *
 * ⚠ BELUM DITINJAU DOKTER — dosis & langkah prosedur wajib diverifikasi dengan pedoman terbaru.
 * Berkas kasus selain 13 kasus awal dibuat oleh scripts/content-gen/osce_build.py.
 */
import { buildOsceContent, type OsceContent } from '../../core/osce/content';
import type { FormularyFile, OsceCaseDef, ProceduresFile } from '../../core/osce/types';
import abortusKomplit from './cases/abortus_komplit.json';
import absesFolikel from './cases/abses_folikel.json';
import akneVulgaris from './cases/akne_vulgaris.json';
import alergiMakanan from './cases/alergi_makanan.json';
import anemiaDefisiensiBesi from './cases/anemia_defisiensi_besi.json';
import anemiaKehamilan from './cases/anemia_kehamilan.json';
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
import crackedNipple from './cases/cracked_nipple.json';
import cutaneousLarvaMigrans from './cases/cutaneous_larva_migrans.json';
import defisiensiMineral from './cases/defisiensi_mineral.json';
import defisiensiVitamin from './cases/defisiensi_vitamin.json';
import demamTifoid from './cases/demam_tifoid.json';
import dengue from './cases/dengue.json';
import dermatitisAtopik from './cases/dermatitis_atopik.json';
import dermatitisKontakIritan from './cases/dermatitis_kontak_iritan.json';
import dermatitisNumularis from './cases/dermatitis_numularis.json';
import dermatitisPerioral from './cases/dermatitis_perioral.json';
import dermatitisSeboroik from './cases/dermatitis_seboroik.json';
import disentri from './cases/disentri.json';
import dislipidemia from './cases/dislipidemia.json';
import dispepsia from './cases/dispepsia.json';
import dmTipe1 from './cases/dm_tipe1.json';
import dmTipe2 from './cases/dm_tipe2.json';
import ektima from './cases/ektima.json';
import episkleritis from './cases/episkleritis.json';
import epistaksis from './cases/epistaksis.json';
import erisipelas from './cases/erisipelas.json';
import eritrasma from './cases/eritrasma.json';
import erupsiObat from './cases/erupsi_obat.json';
import faringitis from './cases/faringitis.json';
import filariasis from './cases/filariasis.json';
import fimosis from './cases/fimosis.json';
import folikulitis from './cases/folikulitis.json';
import furunkelHidung from './cases/furunkel_hidung.json';
import furunkelKarbunkel from './cases/furunkel_karbunkel.json';
import gangguanSomatoform from './cases/gangguan_somatoform.json';
import gastritis from './cases/gastritis.json';
import gastroenteritisAkut from './cases/gastroenteritis_akut.json';
import gerd from './cases/gerd.json';
import gonore from './cases/gonore.json';
import hemoroid from './cases/hemoroid.json';
import hepatitisA from './cases/hepatitis_a.json';
import herpesSimpleks from './cases/herpes_simpleks.json';
import herpesZoster from './cases/herpes_zoster.json';
import hidradenitisSupurativa from './cases/hidradenitis_supurativa.json';
import hipermetropia from './cases/hipermetropia.json';
import hipertensi from './cases/hipertensi.json';
import hiperurisemia from './cases/hiperurisemia.json';
import hipoglikemia from './cases/hipoglikemia.json';
import hiv from './cases/hiv.json';
import hordeolum from './cases/hordeolum.json';
import impetigo from './cases/impetigo.json';
import infeksiUmbilikus from './cases/infeksi_umbilikus.json';
import influenza from './cases/influenza.json';
import insomnia from './cases/insomnia.json';
import intoleransiMakanan from './cases/intoleransi_makanan.json';
import invertedNipple from './cases/inverted_nipple.json';
import isk from './cases/isk.json';
import kandidiasisMulut from './cases/kandidiasis_mulut.json';
import kandidosisKutis from './cases/kandidosis_kutis.json';
import kehamilanNormal from './cases/kehamilan_normal.json';
import kejangDemam from './cases/kejang_demam.json';
import kekerasanTajam from './cases/kekerasan_tajam.json';
import kekerasanTumpul from './cases/kekerasan_tumpul.json';
import keracunanMakanan from './cases/keracunan_makanan.json';
import konjungtivitis from './cases/konjungtivitis.json';
import kusta from './cases/kusta.json';
import laringitis from './cases/laringitis.json';
import leptospirosis from './cases/leptospirosis.json';
import limfadenitis from './cases/limfadenitis.json';
import lipoma from './cases/lipoma.json';
import lukaBakar from './cases/luka_bakar.json';
import mabukPerjalanan from './cases/mabuk_perjalanan.json';
import malaria from './cases/malaria.json';
import malnutrisiEnergiProtein from './cases/malnutrisi_energi_protein.json';
import mastitis from './cases/mastitis.json';
import mataKering from './cases/mata_kering.json';
import migren from './cases/migren.json';
import miliaria from './cases/miliaria.json';
import miopia from './cases/miopia.json';
import moluskumKontagiosum from './cases/moluskum_kontagiosum.json';
import morbili from './cases/morbili.json';
import napkinEczema from './cases/napkin_eczema.json';
import obesitas from './cases/obesitas.json';
import otitisEksterna from './cases/otitis_eksterna.json';
import otitisMediaAkut from './cases/otitis_media_akut.json';
import parafimosis from './cases/parafimosis.json';
import parotitis from './cases/parotitis.json';
import pedikulosisKapitis from './cases/pedikulosis_kapitis.json';
import pedikulosisPubis from './cases/pedikulosis_pubis.json';
import perdarahanSubkonjungtiva from './cases/perdarahan_subkonjungtiva.json';
import pertusis from './cases/pertusis.json';
import pielonefritis from './cases/pielonefritis.json';
import pitiriasisRosea from './cases/pitiriasis_rosea.json';
import pitiriasisVersikolor from './cases/pitiriasis_versikolor.json';
import pneumonia from './cases/pneumonia.json';
import presbiopia from './cases/presbiopia.json';
import reaksiAnafilaktik from './cases/reaksi_anafilaktik.json';
import reaksiGigitanSerangga from './cases/reaksi_gigitan_serangga.json';
import rinitisAkut from './cases/rinitis_akut.json';
import rinitisAlergi from './cases/rinitis_alergi.json';
import rinitisVasomotor from './cases/rinitis_vasomotor.json';
import rupturPerineum from './cases/ruptur_perineum.json';
import salpingitis from './cases/salpingitis.json';
import serumenProp from './cases/serumen_prop.json';
import sifilis from './cases/sifilis.json';
import skabies from './cases/skabies.json';
import skistosomiasis from './cases/skistosomiasis.json';
import skrofuloderma from './cases/skrofuloderma.json';
import strongiloidiasis from './cases/strongiloidiasis.json';
import taeniasis from './cases/taeniasis.json';
import tbParu from './cases/tb_paru.json';
import tensionHeadache from './cases/tension_headache.json';
import tetanus from './cases/tetanus.json';
import tineaBarbae from './cases/tinea_barbae.json';
import tineaFasialis from './cases/tinea_fasialis.json';
import tineaKapitis from './cases/tinea_kapitis.json';
import tineaKorporis from './cases/tinea_korporis.json';
import tineaKruris from './cases/tinea_kruris.json';
import tineaManus from './cases/tinea_manus.json';
import tineaPedis from './cases/tinea_pedis.json';
import tineaUnguium from './cases/tinea_unguium.json';
import tonsilitis from './cases/tonsilitis.json';
import trikiasis from './cases/trikiasis.json';
import ulkusMulut from './cases/ulkus_mulut.json';
import ulkusTungkai from './cases/ulkus_tungkai.json';
import uretritisNonGonore from './cases/uretritis_non_gonore.json';
import urtikariaAkut from './cases/urtikaria_akut.json';
import vaginitis from './cases/vaginitis.json';
import vaginosisBakterialis from './cases/vaginosis_bakterialis.json';
import varisela from './cases/varisela.json';
import verukaVulgaris from './cases/veruka_vulgaris.json';
import vulnus from './cases/vulnus.json';
import vulvitis from './cases/vulvitis.json';
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
  defisiensiMineral,
  defisiensiVitamin,
  dislipidemia,
  dmTipe1,
  hiperurisemia,
  hipoglikemia,
  malnutrisiEnergiProtein,
  obesitas,
  filariasis,
  leptospirosis,
  hipertensi,
  gangguanSomatoform,
  insomnia,
  fimosis,
  gonore,
  parafimosis,
  salpingitis,
  uretritisNonGonore,
  vaginitis,
  vaginosisBakterialis,
  vulvitis,
  bellsPalsy,
  bppv,
  kejangDemam,
  migren,
  tensionHeadache,
  tetanus,
  absesFolikel,
  akneVulgaris,
  alergiMakanan,
  cutaneousLarvaMigrans,
  dermatitisAtopik,
  dermatitisKontakIritan,
  dermatitisNumularis,
  dermatitisPerioral,
  dermatitisSeboroik,
  ektima,
  erisipelas,
  eritrasma,
  erupsiObat,
  folikulitis,
  furunkelKarbunkel,
  herpesSimpleks,
  herpesZoster,
  hidradenitisSupurativa,
  impetigo,
  kandidosisKutis,
  kusta,
  lipoma,
  miliaria,
  moluskumKontagiosum,
  morbili,
  napkinEczema,
  pedikulosisKapitis,
  pedikulosisPubis,
  pitiriasisRosea,
  pitiriasisVersikolor,
  reaksiGigitanSerangga,
  sifilis,
  skabies,
  skrofuloderma,
  tineaBarbae,
  tineaFasialis,
  tineaKapitis,
  tineaKorporis,
  tineaKruris,
  tineaManus,
  tineaPedis,
  tineaUnguium,
  ulkusTungkai,
  urtikariaAkut,
  varisela,
  verukaVulgaris,
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
  pielonefritis,
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
  kekerasanTajam,
  kekerasanTumpul,
  lukaBakar,
  vulnus,
];

export function loadOsceContent(): OsceContent {
  return buildOsceContent(formulary as unknown as FormularyFile, OSCE_CASE_FILES as OsceCaseDef[], procedures as unknown as ProceduresFile);
}
