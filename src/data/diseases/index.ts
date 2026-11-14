/**
 * Daftar file penyakit.
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
// Infeksi tropis (demam akut)
import dengue from './dengue.json';
import demamTifoid from './demam_tifoid.json';
import malaria from './malaria.json';
// Nyeri dada / ulu hati
import gerd from './gerd.json';
import anginaStabil from './angina_stabil.json';
import dispepsia from './dispepsia.json';
import gastritis from './gastritis.json';
// Keluhan berkemih / pinggang
import isk from './isk.json';
import batuSaluranKemih from './batu_saluran_kemih.json';
import dmTipe2 from './dm_tipe2.json';
// Batuk / sesak
import tbParu from './tb_paru.json';
import pneumonia from './pneumonia.json';
import asma from './asma.json';

export const DISEASE_FILES: unknown[] = [
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
