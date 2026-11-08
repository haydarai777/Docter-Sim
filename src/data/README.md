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
| `anamnesis` | Varian jawaban per kategori. `clue` = petunjuk diagnostik (dinilai di ringkasan). `reveals` = gejala yang ikut terungkap |
| `findings` | Nilai abnormal per (alat, parameter). Aturan pertama yang cocok dipakai; `probability` = sensitivitas/prevalensi tanda; `diagnostic: true` = sensitivitas tes (selalu 100% jika akurasi realistis dimatikan) |
| `differentials` | Diagnosis banding yang ada di game + cara membedakannya |
| `keyFindings`, `teachingPoints`, `idealWorkup` | Bahan layar edukasi; `idealWorkup` juga dasar bonus hemat |

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
