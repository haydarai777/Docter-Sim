# Konten medis — ⚠️ BELUM DITINJAU DOKTER

Semua file di folder ini adalah **draf pengembang** dan wajib ditinjau dokter sebelum rilis.
Setiap file punya blok `review` dengan `status`:

- `BELUM_DITINJAU_DOKTER` — draf awal (semua konten saat ini)
- `SEDANG_DITINJAU`
- `DISETUJUI` — isi juga `reviewer` dan `date`

## Anatomi file penyakit (`diseases/*.json`)

| Field | Isi |
|---|---|
| `id`, `name`, `aliases` | Identitas & nama yang bisa dicari pemain (termasuk istilah awam) |
| `system`, `skdiLevel`, `danger` | Kelompok organ (filter), tingkat SKDI (perlu verifikasi), tingkat bahaya (`rendah`/`sedang`/`tinggi`/`kritis` → pengali penalti) |
| `presentationDay` | Rentang hari sakit saat pasien datang |
| `demographics` | Kelompok usia berbobot, rasio laki-laki, pekerjaan berisiko |
| `traits` | Variabel laten. Aturan **pertama** yang kondisinya cocok untuk suatu id menentukan peluangnya |
| `symptoms` | Gejala + probabilitas (+ kondisi opsional). Aturan pertama yang cocok per id dipakai |
| `chiefComplaint` | Gejala yang disebut pertama (sisanya harus digali) |
| `anamnesis` | Varian jawaban per topik anamnesis. `clue` = petunjuk diagnostik (topik ini jadi "kunci" saat penilaian). `reveals` = gejala yang ikut terungkap |
| `findings` | Nilai abnormal per (alat, parameter). Aturan pertama yang cocok dipakai; `probability` = sensitivitas/prevalensi tanda; `diagnostic: true` = sensitivitas tes (selalu 100% jika akurasi realistis dimatikan) |
| `differentials` | Diagnosis banding (id katalog: penyakit, komorbiditas, atau `conditions.json`) + `howToDistinguish`, `mustNotMiss` (berbahaya), `excludeBy` (bukti sah untuk menyingkirkan: topik/gejala/alat) |
| `plan` | Rencana pemeriksaan sesuai indikasi: `keyTopics`, `exams` (fisik) & `tests` (penunjang) dengan peran `kunci`/`pendukung`/`komplikasi`, `group` (saling menggantikan), `when`; `unnecessary` = pemeriksaan yang tidak tepat + alasan |
| `complications` | Komplikasi/tanda bahaya: `trait` (ada bila trait ada), `redFlag`, `assess` (cara menilainya), `explanation` |
| `disposition` | Aturan disposisi berurutan (`when` → `value`, `alsoAccept`, `reason`); aturan terakhir tanpa kondisi |
| `management`, `approach` | Prinsip tata laksana (tanpa dosis) & langkah penalaran yang dianjurkan |
| `pitfalls` | Umpan balik asumsi keliru (mis. menyingkirkan batu karena fungsi ginjal normal) |
| `traitComorbidities` | Trait yang sebenarnya komorbiditas (mis. `hipertensi` pada angina) — diharapkan dicatat sebagai masalah lain |
| `keyFindings`, `teachingPoints` | Bahan layar edukasi |

## File lain

| File | Isi |
|---|---|
| `comorbidities.json` | Komorbiditas (peluang, syarat usia, gejala, temuan, riwayat yang diketahui pasien, `detectBy`, tata laksana) & temuan insidental |
| `conditions.json` | Kondisi yang hanya muncul sebagai diagnosis banding (tidak pernah menjadi pasien) |
| `anamnesis.json` | Topik anamnesis (kata kunci untuk pertanyaan bebas, bobot, alasan), templat percakapan, tinjauan sistem |
| `tools.json` | Alat: kategori (`fisik`/`lab`/`pencitraan`/`lainnya`), `group` (sistem organ, fisik), `objectives` & `purpose` (penunjang) |

Parameter yang **tidak** disebut di `findings` otomatis bernilai normal.

## Kondisi (`when`)

`dayMin`, `dayMax`, `ageMin`, `ageMax`, `sex`, `occupations`, `traits`, `notTraits`,
`symptoms`, `notSymptoms`. Semua yang diisi harus terpenuhi.

## Placeholder teks

`{hari}`, `{hariTeks}`, `{nama}`, `{sapaan}`, `{usia}`, `{pekerjaan}`, `{salahKira}`,
`{ketakutan}`, `{waktu}`, `{kotaWisata}`, dan kunci `context` milik penyakit
(mis. `{daerahEndemis}`). Huruf pertama kapital (`{Keluhan}`) = nilai dikapitalkan.

## Rujukan utama

- Kemenkes RI. *Panduan Praktik Klinis bagi Dokter di Fasilitas Pelayanan Kesehatan Tingkat Pertama.*
- Konsil Kedokteran Indonesia. *Standar Kompetensi Dokter Indonesia (SKDI) 2012.*
- Pedoman nasional/WHO per penyakit (tercantum di `review.references` tiap file).
