# 🩺 Meja Praktek

Game simulasi single-player: Anda adalah dokter umum di meja praktek. Pasien datang
satu per satu dengan keluhan yang sering kabur, tidak lengkap, atau menyesatkan.
Gali informasi lewat anamnesis dan pemeriksaan (berbayar, memotong budget pasien),
lalu tetapkan diagnosis. Reputasi naik jika tepat, turun jika salah.

> ⚠️ **Penafian.** Game ini untuk **hiburan dan edukasi**, **bukan alat diagnosis medis**.
> Seluruh konten medis **belum ditinjau dokter** (status `BELUM_DITINJAU_DOKTER` di setiap
> file data) dan tidak boleh dirilis ke publik sebelum ditinjau. Lihat `src/data/README.md`.

## Fitur

- **Pasien NPC** dengan bahasa awam yang kabur/menyesatkan dan 5 gaya bicara
  (kooperatif, cemas, meremehkan, pelupa, sok tahu), avatar unik, dan demografi
  yang konsisten dengan faktor risiko penyakitnya.
- **Anamnesis** terbatas (11 kategori + tanya gejala spesifik), **27 pemeriksaan**
  berbayar dengan hasil objektif (nilai lab + rujukan, auskultasi, EKG, rontgen, USG).
- **Hasil realistis**: bergantung hari sakit, bisa negatif/positif palsu (bisa dimatikan
  di Pengaturan → mode latihan).
- **Ringkasan edukatif** setelah diagnosis: petunjuk yang ditemukan/terlewat, pemeriksaan
  paling berguna, cara membedakan dengan diagnosis Anda.
- **Reputasi & game over**, gelar dokter, layar akhir dengan grafik & statistik, rekor.
- **Rekam medis** (ringkasan temuan dengan istilah medis), panduan bermain, tema
  terang/gelap, simpan & lanjutkan sesi otomatis, bisa dipasang & dimainkan offline (PWA).

## Menjalankan

Butuh Node.js ≥ 20.19.

```bash
npm install
npm run dev          # buka http://localhost:5173
```

Mencoba di HP (satu jaringan Wi-Fi dengan komputer):

```bash
npm run dev -- --host   # lalu buka alamat "Network: http://192.168.x.x:5173" di HP
```

Perintah lain:

| Perintah | Fungsi |
|---|---|
| `npm test` | Menjalankan semua unit test (Vitest) |
| `npm run build` | Typecheck + build statis ke `dist/` (bisa di-hosting di mana saja) |
| `npm run build:single` | Build seluruh game menjadi satu file HTML di `dist-single/` (lihat di bawah) |
| `npm run preview` | Menyajikan hasil build |
| `npm run validate-content` | Memeriksa integritas semua file data (id, rentang, placeholder, harga) |
| `npm run sample-cases` | Mencetak contoh kasus hasil generator (untuk review dokter). Opsi: `-- --n 5 --disease malaria --seed 123` |
| `npm run format-data` | Merapikan format file JSON di `src/data` |
| `npm run review-sheet` | Membuat ulang `REVIEW.md` (lembar tinjauan untuk dokter) dari file data |
| `npm run balance-report` | Laporan keseimbangan: biaya vs budget per penyakit + simulasi bot pemain |

## Konten saat ini

12 penyakit dalam 4 klaster yang sengaja saling mengecoh:

| Klaster | Penyakit | Contoh jebakan |
|---|---|---|
| Demam akut | Infeksi dengue, demam tifoid, malaria | Trombosit turun pada dengue **dan** malaria; Widal sering positif palsu |
| Nyeri dada / ulu hati | GERD, angina pektoris stabil*, dispepsia/gastritis | "Dada nggak enak, kayak masuk angin"; EKG istirahat angina sering normal |
| Berkemih / pinggang | ISK bawah, batu saluran kemih*, DM tipe 2 | "Sering kencing" bisa ISK (sedikit-sedikit, perih) atau poliuria DM |
| Batuk / sesak | TB paru, pneumonia komunitas, asma | Batuk + BB turun: TB atau DM? |

\* Tingkat SKDI 3A (bukan 4A) — sengaja dimasukkan karena dokter umum wajib mengenalinya.

27 alat pemeriksaan (fisik, laboratorium, penunjang), 40 gejala, 5 kepribadian pasien.
Detail lengkap untuk reviewer ada di **`REVIEW.md`**.

## Main tanpa GitHub: satu file HTML

```bash
npm run build:single
```

Hasilnya di `dist-single/`:

| File | Kegunaan |
|---|---|
| `meja-praktek.html` | Seluruh game dalam **satu file** (± 220 KB). Buka langsung di browser — tanpa server, tanpa internet. Bisa dikirim lewat WhatsApp/Drive/flashdisk, atau diunggah ke hosting statis mana pun tanpa akun GitHub (mis. Netlify Drop, Cloudflare Pages *direct upload*, itch.io sebagai game HTML). |
| `meja-praktek-artifact.html` | Versi yang sama tanpa kerangka `<html>/<head>/<body>`, untuk dipublikasikan sebagai Artifact di claude.ai. |

Simpan permainan, rekor, dan pengaturan tetap tersimpan di browser (localStorage) masing-masing perangkat.
Di HP, cara paling andal adalah membuka versi yang di-hosting (Artifact/Netlify/dll.); sebagian
aplikasi pengelola file di HP membuka HTML lokal tanpa menjalankan JavaScript.

## Pindah ke layanan git lain

Seluruh riwayat ada di folder `.git`. Untuk memindahkan proyek ke GitLab, Codeberg, Bitbucket, dsb.:

```bash
git remote set-url origin <URL-repo-baru>
git push -u origin --all
```

## Hosting di GitHub Pages (main di HP tanpa komputer)

Workflow `.github/workflows/ci.yml` menjalankan validasi konten, tes, dan build di setiap push.
Saat ada push ke branch `main`, hasil build otomatis dipublikasikan ke GitHub Pages:

1. Gabungkan (merge) branch pengembangan ke `main`.
2. Di GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Setelah workflow selesai, game tersedia di `https://<username>.github.io/<nama-repo>/`.
   (Untuk repo privat, GitHub Pages membutuhkan paket berbayar.)

## Struktur kode

```
src/
  data/                 KONTEN (data-driven, tanpa logika)
    config.ts           ← SEMUA angka balancing: harga alat, budget, reputasi, ambang game over
    tools.json          alat pemeriksaan + parameter + nilai rujukan
    symptoms.json       kosakata gejala + frasa awam (biasa/kabur/dilebihkan/diremehkan)
    anamnesis.json      kategori pertanyaan anamnesis + jawaban cadangan
    personalities.json  gaya bicara pasien (kooperatif, cemas, meremehkan, pelupa, sok tahu)
    population.json     nama, pekerjaan, konteks teks
    diseases/*.json     satu file per penyakit
  core/                 LOGIKA PERMAINAN (TypeScript murni, tanpa DOM, teruji)
    types.ts            semua tipe data
    rng.ts              pengacak ber-seed (kasus bisa direproduksi)
    generator.ts        generator kasus pasien dari templat penyakit
    findings.ts         hasil pemeriksaan (normal / abnormal / positif palsu)
    dialogue.ts         keluhan & jawaban pasien sesuai kepribadian
    encounter.ts        satu konsultasi: anamnesis, potong budget, diagnosis
    scoring.ts          penilaian diagnosis & reputasi
    run.ts              sesi permainan: antrean pasien, game over, statistik
    summary.ts          ringkasan edukatif setelah diagnosis
    validate.ts         validator integritas konten
  ui/                   TAMPILAN (DOM tanpa framework)
tests/                  unit test
scripts/                alat bantu pengembang (validasi, contoh kasus, format data)
```

Aturan main: **UI tidak berisi aturan permainan.** Semua aturan ada di `src/core`,
semua angka di `src/data/config.ts`, semua konten medis di file JSON.

## Reputasi & balancing

Semua angka ada di `src/data/config.ts`. Nilai saat ini:

- Reputasi awal **50** (0–100). **Game over jika < 20.**
- Diagnosis tepat: **+8**, plus bonus hemat **0–4** (penuh bila biaya ≤ biaya pemeriksaan
  ideal penyakit itu, turun linear hingga 0 pada 2× biaya ideal).
- Diagnosis salah: **−6 × pengali bahaya** penyakit yang terlewat
  (rendah ×1, sedang ×1,5, tinggi ×2,5, kritis ×3,5 → −6, −9, −15, −21).
- Gelar dokter berdasarkan reputasi (Dokter teladan, terpercaya, umum, diragukan, …).

Hasil simulasi (`npm run balance-report`): penebak acak game over di sekitar pasien ke-4;
akurasi ±60% kira-kira impas; akurasi ≥ 70% hampir selalu bertahan. Tes `tests/balance.test.ts`
menjaga agar perubahan config tidak merusak keseimbangan ini tanpa disadari.

## Cara kerja kasus pasien

Setiap penyakit adalah *templat*. Dari templat + seed acak, generator membuat pasien:

1. **Demografi**: jenis kelamin, pekerjaan (dengan bias faktor risiko), usia yang
   konsisten dengan pekerjaan & penyakit, status ekonomi → budget, kepribadian.
2. **Hari sakit** (mis. dengue hari 2–6) — memengaruhi hasil (NS1 makin sering negatif setelah hari 5).
3. **Trait laten** (mis. `fase_kritis`, `falciparum`, `anemia`) — menghubungkan gejala dan temuan agar konsisten.
4. **Gejala** dengan probabilitas.
5. **Dialog**: keluhan utama hanya menyebut sebagian gejala, dengan gaya kepribadian.
6. **Hasil semua pemeriksaan** — alat yang tidak relevan tetap memberi hasil (biasanya normal,
   kadang positif palsu bila "akurasi realistis" aktif di config).

Setiap kasus punya **kode kasus** (seed) yang tampil di layar ringkasan, sehingga kasus aneh bisa direproduksi.

## Menambah penyakit

Lihat petunjuk di `src/data/diseases/index.ts` dan `src/data/README.md`. Singkatnya: salin
salah satu file JSON, isi, daftarkan, tambahkan harga alat baru di `config.ts`, lalu jalankan
`npm test` — tes integritas akan menunjukkan rujukan yang salah.
