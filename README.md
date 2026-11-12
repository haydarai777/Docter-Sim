# 🩺 Meja Praktek

Simulator praktik klinis dokter umum (single-player) dengan **ruang praktik 3D sudut pandang
orang pertama**: Anda duduk di belakang meja periksa, pasien masuk lewat pintu, menyapa, lalu duduk
di hadapan Anda. Pasien datang satu per satu dengan
keluhan yang kabur, tidak lengkap, dan sering lebih dari satu masalah. Alurnya mengikuti
praktik nyata: **anamnesis → pemeriksaan fisik → penunjang → diagnosis banding → penyingkiran
→ penilaian komplikasi → diagnosis akhir & disposisi**. Yang dinilai adalah **proses penalaran
klinis**, bukan sekadar tebakan diagnosis.

> ⚠️ **Penafian.** Game ini untuk **hiburan dan edukasi**, **bukan alat diagnosis medis**.
> Seluruh konten medis **belum ditinjau dokter** (status `BELUM_DITINJAU_DOKTER` di setiap
> file data) dan tidak boleh dirilis ke publik sebelum ditinjau. Lihat `src/data/README.md`.

## Fitur

- **Ruang praktik 3D first-person** (three.js, seluruhnya prosedural tanpa berkas aset): meja dokter di
  latar depan, kursi pasien, pintu, lemari alat, tempat tidur periksa, jendela, jam dinding yang
  berjalan, kipas, tirai, dan bayangan. Seret layar untuk melihat sekeliling.
- **Pasien NPC hidup**: masuk lewat pintu, berjalan ke kursi, menyapa, duduk, dan setelah konsultasi
  berdiri, berpamitan, lalu keluar. Saat duduk pasien bernapas, berkedip, melirik, dan mengubah posisi.
- **Karakter modular berbentuk manusia** dari satu kerangka tulang: tubuh berupa permukaan menyatu
  (*skinned*) dengan anatomi jelas — bahu, dada, pinggang, pinggul, lengan & kaki berotot wajar, tangan
  berjari, sepatu/sandal — yang menekuk halus di sendi. Kepala berbentuk tengkorak manusia (dahi, pipi,
  rahang, dagu) dengan hidung & telinga 3D, rambut bervolume (11 gaya) atau hijab berjuntai, dan kacamata
  3D. Variasinya: gender, kelompok usia (anak, remaja, dewasa, lansia), tinggi & bentuk badan (dari
  antropometri kasus: kurus sampai gemuk), warna kulit, bentuk wajah per pasien (rahang, mata, hidung,
  bibir, alis), serta pakaian sesuai pekerjaan (kaos, kemeja berkerah & berkancing, baju dimasukkan +
  ikat pinggang, jaket beritsleting, seragam sekolah).
- **Manifestasi klinis yang terlihat — selalu konsisten dengan kasus**: napas cepat/berat (laju napas =
  tanda vital), batuk, memegang perut/pinggang, gelisah karena kolik, menggigil, lemas, pucat, ikterik,
  mata merah, petekie, pincang, badan kurus/gemuk. Gejala yang tidak tampak tetap harus ditanyakan.
- **Ekspresi & bahasa tubuh kontekstual**: mulut bergerak sinkron dengan teks jawaban; pasien menunjuk
  lokasi nyeri, memperagakan batuk/sesak, mengangguk, menggeleng, berpikir, atau tampak bingung sesuai
  isi jawaban; ekspresi cemas, kesakitan, lesu, tenang mengikuti kepribadian & kondisi.
- **Monitor RME di meja** memuat seluruh tindakan (riwayat percakapan, pemeriksaan, penalaran,
  keputusan); jawaban pasien juga tampil sebagai teks berjalan di ruangan.
- **Ringan**: ± 16 ribu segitiga, satu pasien dalam satu waktu (sumber daya dibuang saat pasien pergi),
  resolusi & bayangan menyesuaikan kemampuan perangkat; tanpa WebGL game tetap bisa dimainkan (2D).
- **Anamnesis bebas tanpa batas.** Ketik pertanyaan dengan bahasa sendiri. Pasien hanya menjawab
  yang ditanyakan, mengingat pertanyaan sebelumnya (jawaban konsisten bila diulang), dan memahami
  rumusan berbeda, slang, akhiran *-nya*, serta tinjauan sistem ("BAB-nya bagaimana?").
  - **Pasien AI (opsional):** saat dibuka sebagai Artifact di claude.ai, Claude memerankan pasien.
    Claude **tidak diberi kunci kasus** — fakta hanya bisa diambil lewat alat halaman yang memakai
    mesin yang sama, sehingga pengungkapan tetap bertahap dan penilaian tetap sama.
  - **Mode lokal:** di luar claude.ai (atau bila ditolak/gagal), pemahaman bahasa memakai NLU lokal.
- **Pasien kompleks:** komorbiditas (hipertensi, DM, obesitas, anemia, dislipidemia — kadang belum
  diketahui pasien), temuan insidental (batu empedu, fatty liver, kista ginjal), komplikasi
  tersembunyi, gejala yang tidak disebut sukarela (mis. BAB hitam), alergi.
- **Pemeriksaan fisik per sistem (gratis)** dengan **paket tanda vital** (TD, nadi, napas, suhu, SpO₂).
- **Penunjang dengan tujuan klinis** (identifikasi, fungsi organ, struktur, komplikasi, skrining),
  termasuk eGFR CKD-EPI 2021, USG, BNO, CT. Hasil bergantung hari sakit; bisa negatif/positif palsu.
- **Papan diagnosis banding** (diagnosis kerja / dipertimbangkan / disingkirkan) dan **keputusan akhir**
  (diagnosis kerja, komplikasi, masalah lain, disposisi: rawat jalan · observasi · rujuk spesialis · rujuk segera).
- **Penilaian berbobot** — anamnesis 25 · fisik 15 · penunjang 20 · diagnosis banding 20 ·
  komplikasi/tanda bahaya 10 · diagnosis akhir & tata laksana 10 — dengan umpan balik rinci: topik
  yang terlewat, keluhan yang tidak digali, pemeriksaan yang kurang/tidak perlu, banding yang
  terlewat atau disingkirkan tanpa bukti, komplikasi yang tidak dinilai, asumsi keliru (mis. "fungsi
  ginjal normal menyingkirkan batu"), pendekatan yang dianjurkan, dan rekomendasi.
- **Reputasi & game over** dari skor klinis, penalti bila penyakit berbahaya terlewat atau pasien
  gawat dipulangkan. Layar akhir dengan grafik, statistik, rekor.
- Rekam medis & transkrip, panduan bermain, tema terang/gelap, simpan & lanjutkan sesi, PWA offline.

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

32 alat pemeriksaan (11 fisik, 14 lab, 4 pencitraan, EKG, spirometri), 43 gejala, 16 topik anamnesis
+ 6 tinjauan sistem, 5 komorbiditas, 3 temuan insidental, 23 kondisi khusus diagnosis banding
(mis. leptospirosis, sindrom koroner akut, pielonefritis, massa saluran kemih, kanker paru), 5 kepribadian.
Detail lengkap untuk reviewer ada di **`REVIEW.md`**.

## Main tanpa GitHub: satu file HTML

```bash
npm run build:single
```

Hasilnya di `dist-single/`:

| File | Kegunaan |
|---|---|
| `meja-praktek.html` | Seluruh game dalam **satu file** (± 1 MB, termasuk mesin 3D). Buka langsung di browser — tanpa server, tanpa internet. Bisa dikirim lewat WhatsApp/Drive/flashdisk, atau diunggah ke hosting statis mana pun tanpa akun GitHub (mis. Netlify Drop, Cloudflare Pages *direct upload*, itch.io sebagai game HTML). |
| `meja-praktek-artifact.html` | Versi yang sama tanpa kerangka `<html>/<head>/<body>`, untuk dipublikasikan sebagai Artifact di claude.ai (deklarasikan kapabilitas `sample` agar pasien AI aktif). |

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
    anamnesis.json      topik anamnesis (kata kunci, alasan), templat percakapan, tinjauan sistem
    appearance.json     penampilan pasien 3D: palet, pakaian per pekerjaan, aturan isyarat yang terlihat
    comorbidities.json  komorbiditas & temuan insidental
    conditions.json     kondisi khusus diagnosis banding (tidak muncul sebagai pasien)
    personalities.json  gaya bicara pasien (kooperatif, cemas, meremehkan, pelupa, sok tahu)
    population.json     nama, pekerjaan, konteks teks
    diseases/*.json     satu file per penyakit
  core/                 LOGIKA PERMAINAN (TypeScript murni, tanpa DOM, teruji)
    types.ts            semua tipe data
    rng.ts              pengacak ber-seed (kasus bisa direproduksi)
    generator.ts        generator kasus pasien dari templat penyakit
    findings.ts         hasil pemeriksaan (normal / abnormal / positif palsu)
    dialogue.ts         keluhan & jawaban pasien sesuai kepribadian
    appearance.ts       penampilan & bahasa tubuh pasien dari kasus (isyarat terlihat, gestur, gerak mulut)
    nlu.ts              pemahaman pertanyaan bebas (normalisasi, frasa terpanjang, intent)
    encounter.ts        satu konsultasi: anamnesis bebas, pemeriksaan, papan banding, keputusan
    evaluation.ts       penilaian proses klinis berbobot + umpan balik
    scoring.ts          harga alat & reputasi
    run.ts              sesi permainan: antrean pasien, game over, statistik
    simulate.ts         bot pemain berbasis kemampuan (untuk balancing)
    validate.ts         validator integritas konten
  ui/                   TAMPILAN (DOM tanpa framework)
    ai/patientAi.ts     pasien AI lewat kapabilitas `sample` claude.ai (dengan fallback lokal)
    three/              tampilan 3D: stage (kamera/loop), room (ruang praktik), actor (animasi
                        prosedural), director (adegan datang/pamit), dan karakter modular:
                        geo (pembangun permukaan "loft" + bobot tulang), body (torso, leher, lengan,
                        kaki, pakaian), head (tengkorak, hidung, telinga, rambut, hijab, kacamata),
                        face (ekspresi), extremities (tangan, sepatu/sandal), character (perakit)
tests/                  unit test
scripts/                alat bantu pengembang (validasi, contoh kasus, format data)
```

Pratinjau pasien 3D untuk pengembang/reviewer (saat `npm run dev`):
`http://localhost:5173/dev3d.html?disease=asma&want=trait:serangan_berat` — parameter lain: `seed`,
`mode=seated|stand|walk|leave`, `want=group:anak,sex:female,hijab:1,hair:ikal,cue:kuning,…`,
`gesture=[…]`, `say=…`. Untuk memeriksa bentuk karakter dari segala arah: `studio=1` (tanpa perabot) dan
`cam=jarak,tinggi,sudut°[,fov[,tinggiTarget]]`, mis. `?mode=stand&studio=1&cam=3.3,0.9,35`.

Aturan main: **UI tidak berisi aturan permainan.** Semua aturan ada di `src/core`,
semua angka di `src/data/config.ts`, semua konten medis di file JSON.

## Penilaian, reputasi & balancing

Semua angka ada di `src/data/config.ts`. Ekspektasi tiap kasus berasal dari data penyakit
(`plan`, `differentials`, `complications`, `disposition`, `pitfalls`), jadi penilaian spesifik kasus:

- **Anamnesis (25):** topik inti (bobot ekstra untuk topik kunci kasus, keluhan lain, episode
  sebelumnya) + keluhan tambahan yang berhasil digali (gejala tersembunyi bernilai lebih).
- **Fisik (15):** tanda vital + pemeriksaan terarah sesuai rencana kasus & komorbiditas.
- **Penunjang (20):** pemeriksaan kunci/pendukung/komplikasi sesuai indikasi, **disesuaikan budget
  pasien**; pemeriksaan tidak perlu dikurangi; catatan interpretasi positif/negatif palsu.
- **Diagnosis banding (20):** diagnosis benar ada di papan; banding penting (terutama yang
  berbahaya) dipertimbangkan dan disingkirkan **dengan bukti**.
- **Komplikasi (10):** tanda bahaya dinilai dan komplikasi diklasifikasikan dengan benar.
- **Keputusan (10):** diagnosis kerja, masalah lain yang sudah ditemukan, disposisi
  (under-triage = 0; pasien gawat tidak dirujuk = penalti keselamatan).

Reputasi awal **50** (0–100), **game over < 20**. Per pasien: `(skor − 50) × 0,25`, lalu
−4 × pengali bahaya bila diagnosis utama salah (×1 / ×1,5 / ×2,5 / ×3,5) dan −6 bila pasien
yang perlu rujuk segera tidak dirujuk.

Simulasi bot (`npm run balance-report`): kemampuan 0,4 hampir selalu game over; 0,5 bertahan
± 15 pasien; ≥ 0,7 hampir selalu bertahan; bot sempurna rata-rata skor ≥ 90.
`tests/balance.test.ts` menjaga keseimbangan ini.

## Cara kerja kasus pasien

Setiap penyakit adalah *templat*. Dari templat + seed acak, generator membuat pasien:

1. **Demografi**: jenis kelamin, pekerjaan (dengan bias faktor risiko), usia yang
   konsisten dengan pekerjaan & penyakit, status ekonomi → budget, kepribadian.
2. **Hari sakit** (mis. dengue hari 2–6) — memengaruhi hasil (NS1 makin sering negatif setelah hari 5).
3. **Trait laten** (mis. `fase_kritis`, `falciparum`, `anemia`) — menghubungkan gejala dan temuan agar konsisten.
4. **Gejala** dengan probabilitas.
5. **Komorbiditas, temuan insidental, komplikasi, alergi** — ikut mengubah jawaban riwayat dan hasil pemeriksaan.
   Pasien anak (10–12 th) & remaja muncul pada dengue, tifoid, dan asma, dengan rujukan tanda vital &
   antropometri menurut usia (`refByAge`, disederhanakan — perlu tinjauan pediatri).
6. **Dialog**: keluhan utama hanya menyebut sebagian gejala; sebagian gejala tidak pernah disebut sukarela.
7. **Hasil semua pemeriksaan** — tiap kelainan mencatat asalnya (penyakit utama / komorbiditas /
   insidental); alat yang tidak relevan tetap memberi hasil (biasanya normal, kadang positif palsu).
8. **Penampilan 3D** diturunkan dari kasus yang sama (`core/appearance.ts`): yang terlihat tidak pernah
   bertentangan dengan gejala & hasil pemeriksaan (dijaga oleh `tests/appearance.test.ts`).

Setiap kasus punya **kode kasus** (seed) yang tampil di layar ringkasan, sehingga kasus aneh bisa direproduksi.

## Menambah penyakit

Lihat petunjuk di `src/data/diseases/index.ts` dan `src/data/README.md`. Singkatnya: salin
salah satu file JSON, isi, daftarkan, tambahkan harga alat baru di `config.ts`, lalu jalankan
`npm test` — tes integritas akan menunjukkan rujukan yang salah.
