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
  yang ditanyakan dan mengingat pertanyaan sebelumnya (jawaban konsisten bila diulang).
  - **Mode lokal (bawaan, tanpa kuota Claude):** pemahaman bahasa berjalan di perangkat. Paham
    singkatan & bahasa gaul ("brp", "gmn", "udh"), salah ketik, imbuhan (*-nya*, *di-*, *ber-*),
    tinjauan sistem ("BAB-nya bagaimana?"), beberapa pertanyaan sekaligus, dan **pertanyaan
    lanjutan**: "Ada batuk?" → "Sejak kapan?" ditanyakan untuk batuknya. Pasien bisa mengulang
    jawabannya ("Bisa diulang?"), menanggapi lama sakit yang Anda sebut ("Sudah 3 hari?" → "Lebih
    lama dari itu, Dok."), dan menjawab perkenalan serta pendapat, kekhawatiran, dan harapannya.
    Pada pertanyaan baru yang belum pernah dilihat, ± 80% dipahami persis (mesin lama ± 58%) —
    rinciannya di [`docs/nlu-benchmark.md`](docs/nlu-benchmark.md).
  - **Pasien AI (opsional, mati secara bawaan):** saat dibuka sebagai Artifact di claude.ai, pemain
    bisa mengaktifkannya di Pengaturan; **memakai kuota Claude akun pemain**. Semua jawaban memakai
    model **Claude Haiku 5.5** (`claude-haiku-5-5`) — cepat dan hemat kuota; bila platform tidak bisa
    memakainya, platform menjawab dengan tier tercepat dan label "pasien AI · tier cepat" tampil. Claude **tidak diberi
    kunci kasus** — fakta hanya bisa diambil lewat alat halaman yang memakai mesin yang sama, sehingga
    pengungkapan tetap bertahap dan penilaian tetap sama. Bila gagal, otomatis kembali ke mode lokal.
- **Pasien kompleks:** komorbiditas (hipertensi, DM, obesitas, anemia, dislipidemia — kadang belum
  diketahui pasien), temuan insidental (batu empedu, fatty liver, kista ginjal), komplikasi
  tersembunyi, gejala yang tidak disebut sukarela (mis. BAB hitam), alergi.
- **Pemeriksaan fisik per sistem (gratis)** dengan **paket tanda vital** (TD, nadi, napas, suhu, SpO₂).
- **Penunjang dengan tujuan klinis** (identifikasi, fungsi organ, struktur, komplikasi, skrining),
  termasuk eGFR CKD-EPI 2021, USG, BNO, CT. Hasil bergantung hari sakit; bisa negatif/positif palsu.
  Laboratorium dikelompokkan (hematologi, kimia, urin/feses, tes cepat & serologi, mikroskopis); tab
  Fisik dan Penunjang punya **kolom cari** (nama alat, organ, atau penyakit yang dicurigai).
- **Papan diagnosis banding** (diagnosis kerja / dipertimbangkan / disingkirkan) dan **keputusan akhir**
  (diagnosis kerja, komplikasi, masalah lain, disposisi: rawat jalan · observasi · rujuk spesialis · rujuk segera).
- **Penilaian berbobot** — anamnesis 25 · fisik 15 · penunjang 20 · diagnosis banding 20 ·
  komplikasi/tanda bahaya 10 · diagnosis akhir & tata laksana 10 — dengan umpan balik rinci: topik
  yang terlewat, keluhan yang tidak digali, pemeriksaan yang kurang/tidak perlu, banding yang
  terlewat atau disingkirkan tanpa bukti, komplikasi yang tidak dinilai, asumsi keliru (mis. "fungsi
  ginjal normal menyingkirkan batu"), pendekatan yang dianjurkan, dan rekomendasi.
- **Mode Latihan OSCE** (persiapan ujian): stasiun bertimer (10/15/20 menit) dengan lembar tugas,
  rubrik 7 tugas × skor 0–1–2 (total /14 → Superior/Lulus/Tidak lulus) seperti OSCE komprehensif,
  **penulisan resep** (dosis, frekuensi, lama, jumlah angka Romawi; alergi & obat berbahaya = kesalahan
  kritis), tatalaksana non-farmakologi, **KIE**, interpretasi hasil penunjang (penanda abnormal
  disembunyikan), perilaku profesional, 11 **stasiun prosedur** (kateter, tampon hidung, IUD, Pap smear,
  ACLS, resusitasi cairan, bidai, dll.), serta simulasi beberapa stasiun berurutan. Lihat
  [`docs/osce.md`](docs/osce.md).
- **Mode Dokter Jaga IGD** (kegawatdaruratan): pasien datang bertahap lewat pintu IGD — berjalan,
  dipapah, kursi roda, brankar paramedis, atau digendong — ke ruang IGD 3D dengan bed resusitasi/akut,
  monitor hidup, troli emergensi, defibrilator, ventilator, dan meja perawat. Triase ATS, survei ABCDE,
  anamnesis dari pasien/keluarga/saksi/paramedis, penunjang yang butuh waktu, instruksi tindakan & dosis
  ke perawat (yang berjalan dan memeragakannya: infus, obat, RJP, BVM), konsul spesialis, disposisi.
  **Fisiologi dinamis**: pasien memburuk bila terlambat/salah, membaik bila tepat, bisa henti jantung
  atau meninggal — terlihat pada monitor, napas, ekspresi, kesadaran, warna kulit, dan tubuh pasien.
  32 skenario berbasis pedoman (asma, anafilaksis, STEMI, VF, SVT, AV blok, stroke, ICH, status
  epileptikus, KAD, trauma multipel, tension pneumotoraks, cedera kepala, luka bakar, keracunan,
  syok septik, perdarahan, DSS, eklampsia, HPP, kasus ringan, dll.), 3 mode (latihan, jaga, jaga
  sibuk), penilaian proses (triase, penilaian awal, diagnosis, penunjang, tindakan kritis & kecepatan,
  terapi & dosis, hasil) dengan debrief dan grafik perjalanan pasien. Lihat [`docs/igd.md`](docs/igd.md).
- **Luka & perdarahan realistis** (IGD dan poliklinik): luka digambar langsung di kulit 3D dan ikut
  menekuk bersama tubuh — laserasi, luka bacok menganga sampai otot, lecet, memar sesuai umurnya, luka
  bakar derajat I–III (bula, eskar, jelaga), petekie, urtikaria, ulkus, racoon eyes, epistaksis,
  deformitas fraktur femur. Darah dihitung dalam mililiter dari fisiologi pasien: **pancaran arteri
  berdenyut sesuai nadi & tekanan darah**, rembesan vena, aliran yang mengikuti gravitasi, pakaian
  basah, tetesan berfisika, jejak dan genangan di lantai/sprei/brankar yang makin luas. Bebat tekan,
  torniket, kain darurat, jahitan, perlak HPP, dan bengkok berisi muntah darah tampak di tubuh/bed;
  kamera mendekat saat Anda memeriksa luka.
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
| `npm run nlu-benchmark` | Akurasi pemahaman bahasa mode lokal pada korpus pertanyaan dokter berlabel |

## Konten saat ini

**146 penyakit — seluruh 144 penyakit tingkat kemampuan 4A SKDI 2012** ditambah 2 penyakit 3A
(angina pektoris stabil, batu saluran kemih) yang sengaja dipertahankan sebagai pengecoh. Daftar
lengkap per sistem organ beserta id datanya ada di **`docs/skdi-4a.md`**.

| Sistem organ | Contoh penyakit |
|---|---|
| Mata (13) | konjungtivitis, hordeolum, mata kering, kelainan refraksi, buta senja |
| THT & saluran napas atas (13) + pernapasan (6) | OMA, serumen prop, rinitis alergi, epistaksis, faringitis/tonsilitis, pertusis, TB paru, asma |
| Saraf & jiwa (8) | kejang demam, tetanus, migren, BPPV, Bell's palsy, insomnia |
| Pencernaan (18) | gastroenteritis, disentri, cacingan, hepatitis A, hemoroid, GERD, gastritis, dispepsia |
| Infeksi tropis, darah & imunologi (9) | dengue, malaria, tifoid, leptospirosis, filariasis, HIV, anafilaksis |
| Endokrin & metabolik (9) + kardiovaskular (2) | DM tipe 1 & 2, hipoglikemia, gizi buruk, dislipidemia, gout, hipertensi |
| Kulit & kelamin (46) + kelamin & reproduksi (8) + saluran kemih (3) | tinea, skabies, kusta, sifilis, dermatitis, akne, gonore, vaginitis, ISK, pielonefritis |
| Obstetri (7) | kehamilan normal, anemia kehamilan, ruptur perineum, mastitis, masalah puting |
| Trauma & forensik (4) | vulnus, luka bakar derajat 1–2, luka akibat kekerasan tumpul & tajam (dokumentasi/VeR) |

Pasien berusia **0–75 tahun**. Pasien di bawah 10 tahun datang bersama pengantar (ibu/ayah/nenek)
yang menjawab anamnesis (**alloanamnesis**); di ruang 3D, bayi & batita digendong lalu dipangku,
anak yang lebih besar duduk di kursi pasien sementara pengantar duduk di sampingnya. Nilai rujukan
tanda vital & antropometri menyesuaikan usia.

80 alat pemeriksaan (30 pemeriksaan fisik gratis per sistem — termasuk mata, THT, saraf, kulit/status
lokalis, genital, obstetri, payudara, anak — dan 50 penunjang berbayar), 171 gejala, topik anamnesis
yang dinilai + tinjauan sistem, komorbiditas & temuan insidental, 144 kondisi tambahan untuk papan
diagnosis banding, 5 kepribadian pasien.

**Mode latihan per sistem organ:** di layar judul pilih *Pasien yang datang* untuk hanya menerima pasien
dari satu sistem organ (mis. hanya penyakit mata). Papan diagnosis banding dapat disaring per sistem.

**Mode Dokter Jaga IGD:** 32 skenario kegawatdaruratan, 75 diagnosis kerja, 60 obat (dosis per rute &
infus), 39 tindakan, 24 pemeriksaan penunjang, 13 pemeriksaan fisik ABCDE/sekunder — lihat `docs/igd.md`.

**Mode OSCE:** setiap penyakit punya kunci stasiun (formularium 164 obat — oral, topikal, tetes
mata/telinga, semprot hidung, injeksi, vaksin & serum, MDT kusta, OAT anak), ditambah 11 stasiun prosedur.
Lihat `docs/osce.md`.

Detail untuk reviewer ada di **`REVIEW.md`**.

## Main tanpa GitHub: satu file HTML

```bash
npm run build:single
```

Hasilnya di `dist-single/`:

| File | Kegunaan |
|---|---|
| `meja-praktek.html` | Seluruh game dalam **satu file** (± 3,2 MB, termasuk mesin 3D, luka & perdarahan 3D, dan 146 penyakit). Buka langsung di browser — tanpa server, tanpa internet. Bisa dikirim lewat WhatsApp/Drive/flashdisk, atau diunggah ke hosting statis mana pun tanpa akun GitHub (mis. Netlify Drop, Cloudflare Pages *direct upload*, itch.io sebagai game HTML). |
| `meja-praktek-artifact.html` | Versi yang sama tanpa kerangka `<html>/<head>/<body>`, untuk dipublikasikan sebagai Artifact di claude.ai (deklarasikan kapabilitas `sample` agar pasien AI bisa diaktifkan di Pengaturan; bawaannya tetap mode lokal tanpa kuota). |

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
    igd/scenarios/*.ts  skenario IGD (fisiologi awal, narasumber, tindakan kritis, rencana pakar, debrief)
  core/                 LOGIKA PERMAINAN (TypeScript murni, tanpa DOM, teruji)
    types.ts            semua tipe data
    rng.ts              pengacak ber-seed (kasus bisa direproduksi)
    generator.ts        generator kasus pasien dari templat penyakit
    findings.ts         hasil pemeriksaan (normal / abnormal / positif palsu)
    dialogue.ts         keluhan & jawaban pasien sesuai kepribadian
    appearance.ts       penampilan & bahasa tubuh pasien dari kasus (isyarat terlihat, gestur, gerak mulut)
    injury.ts           cedera yang tampak (luka, luka bakar, memar, perdarahan) + laju perdarahan (ml/menit)
    nlu.ts              pemahaman pertanyaan bebas (normalisasi, frasa terpanjang, intent)
    encounter.ts        satu konsultasi: anamnesis bebas, pemeriksaan, papan banding, keputusan
    evaluation.ts       penilaian proses klinis berbobot + umpan balik
    scoring.ts          harga alat & reputasi
    run.ts              sesi permainan: antrean pasien, game over, statistik
    simulate.ts         bot pemain berbasis kemampuan (untuk balancing)
    validate.ts         validator integritas konten
    igd/                mode Dokter Jaga IGD: fisiologi dinamis, katalog obat/tindakan/penunjang,
                        temuan & anamnesis, mesin shift (waktu, perawat, bed, henti jantung), penilaian
  ui/                   TAMPILAN (DOM tanpa framework)
    ai/patientAi.ts     pasien AI lewat kapabilitas `sample` claude.ai (dengan fallback lokal)
    three/              tampilan 3D: stage (kamera/loop), room (ruang praktik), actor (animasi
                        prosedural), director (adegan datang/pamit), dan karakter modular:
                        geo (pembangun permukaan "loft" + bobot tulang), body (torso, leher, lengan,
                        kaki, pakaian), head (tengkorak, hidung, telinga, rambut, hijab, kacamata),
                        face (ekspresi), extremities (tangan, sepatu/sandal), character (perakit);
                        igdRoom/igdProps/igdScene: ruang IGD, brankar/kursi roda/alat, sutradara adegan IGD;
                        decal/woundTextures/wounds/bloodFx: luka di kulit, darah, balutan, genangan
    igd/                panel IGD: controller (jam, aksi), views, monitorDraw (EKG berjalan), looks
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
