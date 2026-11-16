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
import pneumonia from './pneumonia.json';
import tbParu from './tb_paru.json';
// Saluran kemih
import batuSaluranKemih from './batu_saluran_kemih.json';
import isk from './isk.json';

export const DISEASE_FILES: unknown[] = [
  dmTipe2,
  demamTifoid,
  dengue,
  malaria,
  anginaStabil,
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
  pneumonia,
  tbParu,
  batuSaluranKemih,
  isk,
];
