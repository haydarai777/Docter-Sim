# Benchmark pemahaman bahasa mode lokal (offline)

Mode lokal adalah **bawaan**: pasien dijawab oleh mesin di perangkat pemain, tanpa memakai kuota
Claude. Dokumen ini mencatat cara mengukur seberapa baik mesin memahami pertanyaan dokter yang
diketik bebas, beserta hasilnya.

Jalankan:

```bash
npm run nlu-benchmark   # akurasi per korpus + daftar pertanyaan yang meleset
npm test                # tests/nluBenchmark.test.ts menjaga ambang akurasi
```

## Metode

- Setiap butir korpus = pertanyaan dokter + **himpunan maksud** yang benar
  (`T:onset`, `S:demam`, `D:batuk/onset` = detail gejala, `R:bab` = tinjauan sistem,
  `greeting`/`thanks`/`consent`/`repeat`; daftar kosong = memang di luar konteks).
  Butir dihitung benar hanya bila himpunan maksud **persis sama** (tidak kurang, tidak lebih).
- **Korpus penyetelan** (`tests/fixtures/nluCorpus.ts`, 315 butir) dipakai saat menyetel kata kunci dan aturan.
- **Korpus uji terpisah** (`nluHoldout*.ts`) ditulis "buta" — tanpa melihat daftar kata kunci — dan
  **diukur sekali sebelum dipakai menyetel**. Angka pengukuran pertama itulah perkiraan jujur untuk
  rumusan pertanyaan pemain yang belum pernah dilihat. Setelah diukur, kegagalannya dipakai untuk
  perbaikan, lalu ronde berikutnya ditulis dengan gaya berbeda (bahasa daerah, istilah medis,
  kalimat baku, negasi, salah ketik ganda, pertanyaan iseng).
- Pertanyaan ganda antar-korpus dibuang (tes `korpus tidak berisi pertanyaan ganda`), sehingga angka
  di bawah dihitung pada butir unik.

## Hasil

| Korpus | Butir | Mesin lama | Mesin baru, pengukuran buta pertama | Mesin baru, akhir |
|---|---:|---:|---:|---:|
| Penyetelan | 315 | 231 (73,3%) | — (dipakai menyetel) | 315 (100%) |
| Uji terpisah ronde 1 | 146 | 88 (60,3%) | 117 (80,1%) | 146 (100%) |
| Uji terpisah ronde 2 | 168 | 94 (56,0%) | 128 (76,2%) | 168 (100%) |
| Uji terpisah ronde 3 | 143 | 85 (59,4%) | 119 (83,2%) | 142 (99,3%) |
| **Total uji terpisah** | **457** | **267 (58,4%)** | **364 (79,7%)** | **456 (99,8%)** |

Cara membaca:

- **Kolom "pengukuran buta pertama"** adalah angka yang paling mewakili pertanyaan baru dari pemain:
  sekitar **4 dari 5 rumusan yang belum pernah dilihat langsung dipahami persis**, naik dari sekitar
  3 dari 5 pada mesin lama. Sisanya biasanya tetap dijawab sebagian (mis. satu dari dua maksud) atau
  pasien meminta pertanyaan diulang — pasien tidak mengarang fakta.
- **Kolom "akhir"** adalah angka setelah kegagalan diperbaiki; korpus kini berfungsi sebagai tes
  regresi, bukan ukuran generalisasi.
- Satu label ronde 3 dikoreksi setelah pengukuran: "Perut begah?" di konten berarti rasa penuh
  setelah makan (`cepat_kenyang`, sesuai KBBI), bukan `kembung`. Angka buta 119/143 tetap menghitungnya
  sebagai meleset.
- Yang masih meleset: "Demamnya tinggi?" (ambigu antara menanyakan adanya demam tinggi atau derajat
  demam yang sudah diketahui).

Kecepatan: indeks kata kunci dibangun sekali (± 70 ms), lalu ± 30 µs per pertanyaan di laptop
pengembang — tidak terasa di HP.

## Yang membuat mesin baru lebih paham

1. **Normalisasi**: singkatan & bahasa gaul (`brp`, `gmn`, `udh`, `gak`, `bgt`, `ngopi`), huruf
   berulang (`sakiiit`), kata ulang (`pusing2`, `batuk-batuk`), frasa (`terus-terusan`).
2. **Imbuhan dua arah**: kata berimbuhan → kata dasar di kosakata (`batuknya` → `batuk`,
   `bersendawa` → `sendawa`), dan sebaliknya bentuk tanpa awalan → kata kunci berimbuhan
   (`rasakan` → `dirasakan`).
3. **Koreksi salah ketik** terjaga: hanya untuk kata yang tidak dikenal (kosakata konten + daftar
   kata umum), huruf awal sama, jarak Damerau–Levenshtein kecil, dan tidak ambigu; huruf yang
   terlewat diutamakan (`batk` → batuk, bukan "baik"). Kata sah seperti "kesehatan" atau "kucing"
   tidak "dikoreksi" menjadi istilah medis.
4. **Frasa kunci lentur**: boleh disisipi kata pengisi (`cepat [merasa] kenyang`,
   `tinja [berwarna] hitam`), frasa paling spesifik menang, dan frasa lain untuk maksud yang sama
   memperluas bentangnya (`sering kencing malam`).
5. **Aturan konteks**: pertanyaan keluarga/kontak ("Tetangga ada yang sakit serupa?"), nama obat
   ("obat pereda nyeri"), pemicu bersyarat ("Kalau jalan tambah sakit?" = faktor pemberat), topik
   umum yang mengalah pada topik yang lebih tepat ("Menurut Ibu ini sakit apa?" = pendapat pasien),
   "nama kucing" ≠ nama pasien, cuaca ≠ demam, dan pertanyaan di luar konteks.
6. **Percakapan kontekstual** (di `encounter.ts`): "Ada batuk?" → "Sejak kapan?" ditanyakan untuk
   batuknya; rujukan kedaluwarsa setelah satu giliran kecuali dokter menunjuk ("yang tadi itu");
   "Sakitnya sejak kapan?" tetap merujuk keluhan utama. Pasien mengulang jawabannya ("Bisa
   diulang?") dan menanggapi lama sakit yang disebut dokter ("Sudah 3 hari?" → "Lebih lama dari itu,
   Dok.").
7. **Topik percakapan baru** (tidak dinilai): nama, umur, pekerjaan, status keluarga, pendapat,
   kekhawatiran, dan harapan pasien, serta haid & kehamilan.

## Menambah butir

Tambahkan butir ke korpus penyetelan saat menambah kata kunci. Untuk mengukur generalisasi lagi,
tulis korpus uji terpisah baru **sebelum** mengubah mesin, ukur sekali, catat angkanya di tabel di atas,
baru setelah itu perbaiki kegagalannya.
