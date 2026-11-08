# 🩺 Meja Praktek

Game simulasi single-player: Anda adalah dokter umum di meja praktek. Pasien datang
satu per satu dengan keluhan yang sering kabur, tidak lengkap, atau menyesatkan.
Gali informasi lewat anamnesis dan pemeriksaan (berbayar, memotong budget pasien),
lalu tetapkan diagnosis. Reputasi naik jika tepat, turun jika salah.

> ⚠️ **Penafian.** Game ini untuk **hiburan dan edukasi**, **bukan alat diagnosis medis**.
> Seluruh konten medis **belum ditinjau dokter** (status `BELUM_DITINJAU_DOKTER` di setiap
> file data) dan tidak boleh dirilis ke publik sebelum ditinjau. Lihat `src/data/README.md`.

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
| `npm run preview` | Menyajikan hasil build |
| `npm run validate-content` | Memeriksa integritas semua file data (id, rentang, placeholder, harga) |
| `npm run sample-cases` | Mencetak contoh kasus hasil generator (untuk review dokter). Opsi: `-- --n 5 --disease malaria --seed 123` |
| `npm run format-data` | Merapikan format file JSON di `src/data` |

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
