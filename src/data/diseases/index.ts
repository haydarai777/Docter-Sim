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
import dengue from './dengue.json';
import demamTifoid from './demam_tifoid.json';
import malaria from './malaria.json';

export const DISEASE_FILES: unknown[] = [dengue, demamTifoid, malaria];
