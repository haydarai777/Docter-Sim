# Mode Latihan OSCE

Mode ini menyiapkan mahasiswa kedokteran untuk OSCE komprehensif. Format penilaiannya mengikuti
modul & rubrik OSCE yang dipakai sebagai acuan (Penyakit Dalam infeksi/non-infeksi, pulmonologi,
neurologi, kardiologi-ACLS, resusitasi cairan, muskuloskeletal, urologi, obgin, kulit, THT, mata,
psikiatri).

> ⚠️ Kunci jawaban (obat, dosis, langkah prosedur) **belum ditinjau dokter**. Dosis disusun dari
> pedoman nasional yang umum dipakai dan harus diverifikasi dengan pedoman terbaru serta kebijakan
> institusi masing-masing. Rubrik resmi UKMPPD tidak dapat diakses saat pengembangan; format di sini
> mengikuti rubrik fakultas yang dijadikan contoh (7 tugas × skor 0–1–2).

## Cara bermain

1. Halaman awal → **🎓 Latihan OSCE**.
2. Pilih jenis stasiun (klinis, prosedur, atau campuran), kelompok kasus, jumlah stasiun (1, 4, 8, 12),
   dan waktu (10/15/20 menit atau tanpa batas untuk belajar).
3. Baca **lembar tugas**, tekan *Mulai* — waktu berjalan.
4. Stasiun klinis memakai ruang praktik 3D yang sama dengan mode praktik, ditambah:
   - **Tab Tatalaksana**: menulis resep (cari obat → sediaan → per kali → aturan → frekuensi → lama →
     jumlah dalam angka Romawi), memilih saran non-farmakologi, dan poin KIE. Ada pilihan pengecoh dan
     pilihan berbahaya.
   - **Interpretasi penunjang**: penanda ↑/↓ pada hasil lab/pencitraan disembunyikan; Anda yang
     menandai parameter abnormal.
5. Bila waktu habis, stasiun dinilai apa adanya.
6. Hasil tampil sebagai **lembar rubrik** lengkap dengan alasan, kunci jawaban, dan perilaku profesional.
   Rangkaian beberapa stasiun diakhiri rekap.

## Pemetaan rubrik

| No | Komponen rubrik (dokumen acuan) | Yang dinilai di game | Skor 2 bila |
|---|---|---|---|
| 1 | Anamnesis lanjutan komprehensif | Topik kunci, gejala tersembunyi, tanda bahaya, riwayat | ≥ 80% topik/gejala yang diharapkan tergali |
| 2 | Pemeriksaan fisik spesifik | Tanda vital + pemeriksaan per sistem sesuai kasus | ≥ 85% pemeriksaan yang diharapkan |
| 3 | Usulan & interpretasi penunjang | Penunjang sesuai indikasi (tanpa pemborosan) + menandai hasil abnormal | Usulan ≥ 75% tepat & interpretasi (F1) ≥ 0,8 |
| 4 | Diagnosis kerja & banding | Diagnosis kerja + papan diagnosis banding | Diagnosis tepat + ≥ 2 banding relevan |
| 5 | Tatalaksana farmakologi & resep | Obat, dosis per kali (termasuk berbasis BB), frekuensi, lama, jumlah, sediaan | Obat utama & pendukung tepat, tanpa obat salah/berlebih, jumlah sesuai |
| 6 | Tatalaksana non-farmakologi | Saran gaya hidup/tindakan + disposisi (rawat jalan/observasi/rujuk) | ≥ 3 saran tepat (atau semua bila < 3), tanpa saran berbahaya, disposisi tepat |
| 7 | KIE | Penjelasan penyakit, pengobatan & kepatuhan, efek samping, tanda bahaya, kontrol, pencegahan | Semua kategori wajib kasus tercakup tanpa edukasi keliru |
| — | Perilaku profesional (dicatat terpisah) | Salam & perkenalan, konfirmasi identitas, izin sebelum memeriksa, empati/penutup | ≥ 3 dari 4 |

Total = jumlah skor / 14. **Superior ≥ 90%** (13–14), **Lulus 70–89%** (10–12), **Tidak lulus < 70%**.

**Kesalahan kritis** membuat stasiun tidak lulus berapa pun totalnya, sesuai kriteria "tidak lulus"
pada rubrik acuan: diagnosis kerja salah/tidak ditetapkan, obat yang membuat pasien alergi, obat
berbahaya untuk kasus (mis. OAINS pada dengue, OAINS pada gastritis), dosis harian melebihi batas aman,
serta pasien gawat yang dipulangkan.

## Isi

- **13 stasiun klinis** (semua penyakit kasus): dengue, demam tifoid, malaria, GERD, angina pektoris
  stabil, dispepsia fungsional, gastritis akut, ISK, batu saluran kemih, DM tipe 2, TB paru, pneumonia
  komunitas, asma. Setiap stasiun punya kunci terapi (dengan alternatif yang diterima), daftar obat
  yang harus dihindari, saran non-farmakologi & KIE (benar, pengecoh, berbahaya).
- **Formularium latihan 44 obat** dengan sediaan, golongan alergi (penisilin, sulfa, metamizol,
  ibuprofen), dan dosis harian maksimum. Dosis berbasis berat badan (DHP, OAT KDT, primakuin,
  parasetamol anak) dinilai dari BB pasien — timbang dulu.
- **11 stasiun prosedur** dari modul acuan: kateterisasi uretra pria, tampon hidung anterior, ekstraksi
  benda asing hidung (anak), ekstraksi benda asing kornea, Pap smear, pemasangan IUD CuT 380A, kerokan
  kulit KOH, slit-skin smear kusta, resusitasi henti jantung VT tanpa nadi (ACLS), resusitasi cairan syok
  hipovolemik, dan pemasangan bidai fraktur distal radius. Pemain menyusun langkah dari kartu acak
  (ada langkah keliru & berbahaya), lalu menjawab pertanyaan penguji. Nilai = 70% ketepatan urutan +
  30% pertanyaan − penalti tindakan keliru; tindakan berbahaya atau langkah kritis terlewat = tidak lulus.

## Belum tersedia (rencana)

Kasus berikut di dokumen acuan baru tersedia sebagai **prosedur** atau belum ada sebagai pasien
simulasi, karena memerlukan alat pemeriksaan & tampilan klinis baru: penyakit Graves, sirosis hati,
Bell's palsy, fraktur Smith (pasien), sindrom koroner akut (pasien), syok hipovolemik (pasien), retensi
urin BPH (pasien), ANC kunjungan pertama, konseling kontrasepsi, kusta & tinea (pasien), skizofrenia
paranoid (status mentalis), epistaksis & benda asing (pasien).

## Untuk pengembang

- Kunci per penyakit: `src/data/osce/cases/<id>.json`; formularium: `src/data/osce/formulary.json`;
  prosedur: `src/data/osce/procedures.json`.
- Mesin: `src/core/osce/` (`station.ts` rubrik, `prescription.ts` resep, `procedure.ts` prosedur,
  `validate.ts` validasi). `npm run validate-content` ikut memeriksa konten OSCE.
- Tes `tests/osce.test.ts` memastikan "pemain ideal" mendapat Superior di semua penyakit dan
  kesalahan kritis selalu terdeteksi.
