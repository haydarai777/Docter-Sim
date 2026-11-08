# Lembar Tinjauan Konten Medis — Meja Praktek

> ⚠️ Dibuat otomatis oleh `npm run review-sheet` dari file di `src/data`. Jangan edit manual —
> perbaiki file JSON-nya, lalu jalankan ulang skrip ini.

Seluruh konten berstatus **BELUM DITINJAU DOKTER**. Setelah ditinjau, ubah `review.status` di file
JSON penyakit menjadi `DISETUJUI` dan isi `reviewer` serta `date`.

## Ringkasan

| Penyakit | SKDI | Bahaya | Status |
|---|---|---|---|
| Infeksi Dengue (Demam Dengue / DBD) | 4A | tinggi | `BELUM_DITINJAU_DOKTER` |
| Demam Tifoid | 4A | sedang | `BELUM_DITINJAU_DOKTER` |
| Malaria (tanpa komplikasi) | 4A | tinggi | `BELUM_DITINJAU_DOKTER` |
| Penyakit Refluks Gastroesofageal (GERD) | 4A | rendah | `BELUM_DITINJAU_DOKTER` |
| Angina Pektoris Stabil | 3A | kritis | `BELUM_DITINJAU_DOKTER` |
| Dispepsia / Gastritis | 4A | rendah | `BELUM_DITINJAU_DOKTER` |
| Infeksi Saluran Kemih Bawah (Sistitis) | 4A | rendah | `BELUM_DITINJAU_DOKTER` |
| Batu Saluran Kemih dengan Kolik (Urolitiasis) | 3A | sedang | `BELUM_DITINJAU_DOKTER` |
| Diabetes Melitus Tipe 2 | 4A | sedang | `BELUM_DITINJAU_DOKTER` |
| Tuberkulosis Paru | 4A | tinggi | `BELUM_DITINJAU_DOKTER` |
| Pneumonia Komunitas | 4A | tinggi | `BELUM_DITINJAU_DOKTER` |
| Asma Bronkial (Serangan Ringan–Sedang) | 4A | sedang | `BELUM_DITINJAU_DOKTER` |

## Alat pemeriksaan, harga, dan nilai rujukan

| Alat | Kategori | Harga | Parameter (rujukan) | Positif palsu |
|---|---|---|---|---|
| Termometer | fisik | Rp5.000 | Suhu aksila: 36,5–37,5 °C | — |
| Tensimeter & tanda vital | fisik | Rp5.000 | Tekanan darah sistolik: 90–139 mmHg<br>Tekanan darah diastolik: 60–89 mmHg<br>Nadi: 60–100 ×/menit<br>Frekuensi napas: 12–20 ×/menit | — |
| Stetoskop (auskultasi) | fisik | Rp10.000 | Jantung: Bunyi jantung I–II reguler, murmur (−), gallop (−)<br>Paru: Suara napas vesikuler, ronkhi −/−, wheezing −/−<br>Bising usus: Bising usus normal | — |
| Senter (mata, pupil, tenggorok, lidah) | fisik | Rp5.000 | Konjungtiva: Tidak anemis<br>Sklera: Tidak ikterik<br>Pupil: Isokor, refleks cahaya +/+<br>Faring & tonsil: Faring tidak hiperemis, tonsil T1–T1<br>Lidah: Bersih, tidak ada kelainan | — |
| Pemeriksaan abdomen (palpasi & perkusi) | fisik | Rp10.000 | Inspeksi & perkusi: Datar, supel, timpani<br>Nyeri tekan: Tidak ada nyeri tekan<br>Hepar: Tidak teraba<br>Lien (limpa): Tidak teraba<br>Nyeri ketok CVA: Negatif kanan dan kiri | — |
| Uji tourniquet (Rumple–Leede) | fisik | Rp10.000 | Hasil: Positif jika ≥ 10 petekie per 2,5 × 2,5 cm | Hasil 8% |
| Timbangan & pita ukur | fisik | Rp5.000 | Tinggi badan: — cm<br>Indeks massa tubuh (IMT): 18,5–22,9 (kriteria Asia-Pasifik) kg/m²<br>Berat badan: — kg<br>Lingkar perut: < 90 (L) / < 80 (P) cm | — |
| Oksimeter nadi (SpO₂) | fisik | Rp5.000 | Saturasi oksigen (SpO₂): 95–100 % | — |
| Peak flow meter (APE) | fisik | Rp15.000 | APE (% nilai prediksi): ≥ 80% % | — |
| Darah lengkap + hitung jenis | lab | Rp70.000 | Hemoglobin: 13,0–17,0 g/dL<br>Hematokrit: 40–50 %<br>Leukosit: 4.000–10.000 /µL<br>Trombosit: 150.000–400.000 /µL<br>LED: 0–15 mm/jam<br>Basofil: 0–1 %<br>Eosinofil: 1–3 %<br>Neutrofil batang: 2–6 %<br>Neutrofil segmen: 50–70 %<br>Limfosit: 20–40 %<br>Monosit: 2–8 % | — |
| Tes cepat NS1 dengue | lab | Rp150.000 | Antigen NS1 dengue: Negatif | Antigen NS1 dengue 2% |
| Tes cepat (RDT) malaria | lab | Rp60.000 | P. falciparum (HRP-2): Negatif<br>Pan-malaria (pLDH): Negatif | P. falciparum (HRP-2) 1%<br>Pan-malaria (pLDH) 1% |
| Tes Widal | lab | Rp40.000 | S. typhi O: ≤ 1/80<br>S. typhi H: ≤ 1/80 | S. typhi O 12%<br>S. typhi H 10% |
| Tubex TF (IgM anti-Salmonella) | lab | Rp150.000 | Skor Tubex TF: ≤ 2 negatif · 3 meragukan · ≥ 4 positif | Skor Tubex TF 5% |
| Gula darah sewaktu (GDS) | lab | Rp25.000 | Glukosa darah sewaktu: < 140 · ≥ 200 + gejala klasik = DM mg/dL | — |
| HbA1c | lab | Rp150.000 | HbA1c: < 5,7 normal · ≥ 6,5 = DM % | — |
| Urinalisis (urin lengkap) | lab | Rp40.000 | Warna & kejernihan: Kuning jernih<br>Berat jenis: 1,005–1,030<br>pH: 4,5–8,0<br>Protein: Negatif<br>Glukosa: Negatif<br>Keton: Negatif<br>Darah (dipstik): Negatif<br>Leukosit esterase: Negatif<br>Nitrit: Negatif<br>Sedimen leukosit: 0–5 /LPB<br>Sedimen eritrosit: 0–2 /LPB<br>Bakteri: Negatif<br>Kristal: Negatif | Darah (dipstik) 4%<br>Leukosit esterase 5%<br>Nitrit 2%<br>Sedimen leukosit 4%<br>Bakteri 4%<br>Kristal 5% |
| Fungsi hati | lab | Rp80.000 | SGOT (AST): 5–40 U/L<br>SGPT (ALT): 5–41 U/L<br>Bilirubin total: 0,2–1,2 mg/dL | — |
| Fungsi ginjal | lab | Rp70.000 | Ureum: 10–50 mg/dL<br>Kreatinin: 0,7–1,3 mg/dL | — |
| Profil lipid | lab | Rp100.000 | Kolesterol total: < 200 mg/dL<br>Kolesterol LDL: < 130 mg/dL<br>Kolesterol HDL: 40–100 mg/dL<br>Trigliserida: < 150 mg/dL | — |
| Serologi dengue IgM/IgG | lab | Rp175.000 | IgM anti-dengue: Negatif<br>IgG anti-dengue: Negatif | — |
| Apusan darah tebal–tipis (malaria) | lab | Rp50.000 | Hasil: Tidak ditemukan parasit malaria | Hasil 1% |
| BTA sputum (mikroskopis) | lab | Rp50.000 | Hasil BTA: Negatif | Hasil BTA 1% |
| Tes Cepat Molekuler (TCM) TB | lab | Rp150.000 | Hasil TCM: MTB not detected | — |
| Elektrokardiografi (EKG) 12 sadapan | penunjang | Rp120.000 | Irama: Sinus ritme<br>Frekuensi: 60–100 ×/menit<br>Aksis: Normal<br>Gelombang P & interval PR: Normal<br>Kompleks QRS: Normal<br>Segmen ST: Isoelektrik<br>Gelombang T: Normal<br>Kesan: EKG dalam batas normal | — |
| Rontgen thorax (PA) | penunjang | Rp175.000 | Cor: Tidak membesar (CTR < 50%)<br>Pulmo: Corakan bronkovaskular normal, tidak tampak infiltrat<br>Sinus & diafragma: Sinus kostofrenikus tajam, diafragma licin<br>Tulang: Tulang-tulang intak<br>Kesan: Cor dan pulmo dalam batas normal | — |
| USG abdomen | penunjang | Rp300.000 | Hepar: Ukuran dan ekogenisitas normal, tidak tampak lesi<br>Kandung empedu: Dinding tidak menebal, tidak tampak batu<br>Lien: Ukuran normal<br>Ginjal kanan & kiri: Ukuran normal, tidak tampak batu maupun hidronefrosis<br>Vesika urinaria: Dinding licin, tidak tampak batu<br>Cairan bebas: Tidak tampak<br>Kesan: Tidak tampak kelainan pada organ intraabdomen yang terperiksa | — |

## Infeksi Dengue (Demam Dengue / DBD)

- **id**: `dengue` · **SKDI**: 4A · **bahaya**: tinggi · **sistem**: Infeksi tropis · **status**: `BELUM_DITINJAU_DOKTER`
- **Hari sakit saat datang**: 2–6
- **Demografi**: laki-laki 50%; usia 18–30 (bobot 5), 31–45 (bobot 3), 46–60 (bobot 2), 61–75 (bobot 1)
- **Pekerjaan berisiko** (bias 30%): Mahasiswa, Pegawai kantor swasta, Ibu rumah tangga, Buruh pabrik
- **Pemeriksaan ideal**: Termometer, Uji tourniquet (Rumple–Leede), Darah lengkap + hitung jenis, Tes cepat NS1 dengue (Rp235.000)

> Infeksi virus dengue yang ditularkan nyamuk Aedes aegypti. Ditandai demam tinggi mendadak 2–7 hari, nyeri kepala, nyeri belakang bola mata, nyeri otot/sendi, dan manifestasi perdarahan (uji tourniquet positif, petekie, mimisan). Pada DBD terjadi kebocoran plasma (hematokrit meningkat). Fase kritis biasanya justru saat demam mulai turun (sekitar hari ke-3 sampai ke-7), sehingga pasien perlu dipantau ketat.

**Trait laten** (aturan pertama yang cocok per id dipakai)

| Trait | Peluang | Kondisi | Keterangan |
|---|---|---|---|
| fase_kritis | 85% | hari 4–… | Pasien datang pada fase kritis: demam mulai turun, tetapi risiko kebocoran plasma dan syok justru paling tinggi. |
| fase_kritis | 35% | hari 3–3 | Pasien datang pada fase kritis: demam mulai turun, tetapi risiko kebocoran plasma dan syok justru paling tinggi. |
| trombositopenia | 90% | hari 3–… | Trombositopenia (trombosit < 150.000/µL; pada fase kritis sering ≤ 100.000/µL). |
| trombositopenia | 30% | — | Trombositopenia (trombosit < 150.000/µL; pada fase kritis sering ≤ 100.000/µL). |
| kebocoran_plasma | 75% | trait: fase_kritis | Ada tanda kebocoran plasma (hemokonsentrasi) — memenuhi kriteria DBD. |
| leukopenia | 70% | — | Leukopenia. |
| perdarahan_spontan | 35% | trait: trombositopenia | Ada manifestasi perdarahan spontan (petekie / mimisan / gusi berdarah). |
| hepatomegali | 30% | trait: fase_kritis | Hepatomegali. |
| tanda_bahaya | 25% | trait: fase_kritis | Ada tanda bahaya (nyeri perut hebat / muntah terus-menerus) — perlu rawat inap. |
| efusi_pleura | 25% | trait: kebocoran_plasma | Efusi pleura minimal akibat kebocoran plasma. |
| usg_kebocoran | 60% | trait: kebocoran_plasma | USG: penebalan dinding kandung empedu dan asites minimal — tanda kebocoran plasma. |
| transaminitis | 70% | — | Peningkatan SGOT/SGPT (sering pada dengue, SGOT > SGPT). |
| infeksi_sekunder | 50% | — | Infeksi dengue sekunder (IgG positif sejak awal) — risiko DBD lebih tinggi. |

**Gejala**

| Gejala | Peluang | Kondisi |
|---|---|---|
| Demam | 100% | — |
| Nyeri kepala | 80% | — |
| Nyeri belakang bola mata (retro-orbital) | 50% | — |
| Nyeri otot/sendi (mialgia/artralgia) | 80% | — |
| Lemas | 80% | — |
| Nafsu makan menurun | 70% | — |
| Mual/muntah | 95% | trait: tanda_bahaya |
| Mual/muntah | 50% | — |
| Nyeri perut | 90% | trait: tanda_bahaya |
| Nyeri perut | 25% | — |
| Bintik merah di kulit (petekie) | 60% | trait: perdarahan_spontan |
| Bintik merah di kulit (petekie) | 25% | hari 3–…; trait: trombositopenia |
| Mimisan / gusi berdarah | 80% | trait: perdarahan_spontan |
| Menggigil | 20% | — |
| Diare | 10% | — |
| Batuk | 10% | — |

Keluhan utama (prioritas): demam; tambahan: nyeri_kepala, nyeri_otot_sendi, lemas, mual_muntah. Salah kaprah pasien: masuk angin, tipes, kecapekan.

**Temuan pemeriksaan abnormal** (parameter lain = normal)

| Alat · parameter | Kondisi | Peluang | Nilai |
|---|---|---|---|
| Termometer · Suhu aksila | trait: fase_kritis | 100% | 36,9–38,0 °C |
| Termometer · Suhu aksila | — | 100% | 38,4–40,0 °C |
| Tensimeter & tanda vital · Nadi | trait: kebocoran_plasma | 100% | 96–118 ×/menit |
| Tensimeter & tanda vital · Nadi | — | 100% | 88–110 ×/menit |
| Tensimeter & tanda vital · Tekanan darah sistolik | trait: kebocoran_plasma | 100% | 98–112 mmHg |
| Tensimeter & tanda vital · Tekanan darah diastolik | trait: kebocoran_plasma | 100% | 65–78 mmHg |
| Uji tourniquet (Rumple–Leede) · Hasil | trait: trombositopenia | 65% (sensitivitas) | Positif (petekie ≥ 10 per 2,5 × 2,5 cm) |
| Uji tourniquet (Rumple–Leede) · Hasil | — | 45% (sensitivitas) | Positif (petekie ≥ 10 per 2,5 × 2,5 cm) |
| Darah lengkap + hitung jenis · Trombosit | hari 3–…; trait: trombositopenia | 100% | 20.000–100.000 /µL |
| Darah lengkap + hitung jenis · Trombosit | trait: trombositopenia | 100% | 105.000–148.000 /µL |
| Darah lengkap + hitung jenis · Trombosit | — | 100% | 150.000–230.000 /µL |
| Darah lengkap + hitung jenis · Leukosit | trait: leukopenia | 100% | 1.800–3.900 /µL |
| Darah lengkap + hitung jenis · Leukosit | — | 100% | 4.000–6.500 /µL |
| Darah lengkap + hitung jenis · Hematokrit | laki-laki; trait: kebocoran_plasma | 100% | 51–56 % |
| Darah lengkap + hitung jenis · Hematokrit | perempuan; trait: kebocoran_plasma | 100% | 47–52 % |
| Darah lengkap + hitung jenis · Hemoglobin | laki-laki; trait: kebocoran_plasma | 100% | 16,8–18,8 g/dL |
| Darah lengkap + hitung jenis · Hemoglobin | perempuan; trait: kebocoran_plasma | 100% | 15,6–17,0 g/dL |
| Darah lengkap + hitung jenis · Limfosit | — | 60% | 38–52 % |
| Tes cepat NS1 dengue · Antigen NS1 dengue | hari …–3 | 90% (sensitivitas) | Positif |
| Tes cepat NS1 dengue · Antigen NS1 dengue | hari 4–5 | 65% (sensitivitas) | Positif |
| Tes cepat NS1 dengue · Antigen NS1 dengue | hari 6–… | 35% (sensitivitas) | Positif |
| Pemeriksaan abdomen (palpasi & perkusi) · Hepar | trait: hepatomegali | 100% | Teraba 2 jari di bawah arkus kosta, tepi tajam, nyeri tekan (+) |
| Pemeriksaan abdomen (palpasi & perkusi) · Nyeri tekan | trait: tanda_bahaya | 100% | Nyeri tekan epigastrium dan kuadran kanan atas |
| Pemeriksaan abdomen (palpasi & perkusi) · Nyeri tekan | trait: hepatomegali | 60% | Nyeri tekan ringan kuadran kanan atas |
| Senter (mata, pupil, tenggorok, lidah) · Faring & tonsil | — | 30% | Faring hiperemis ringan, tonsil T1–T1 |
| Senter (mata, pupil, tenggorok, lidah) · Konjungtiva | — | 20% | Tidak anemis, tampak hiperemis (kemerahan) |
| Stetoskop (auskultasi) · Paru | trait: efusi_pleura | 100% | Suara napas menurun di basal paru kanan |
| Rontgen thorax (PA) · Sinus & diafragma | trait: efusi_pleura | 100% | Sinus kostofrenikus kanan tumpul |
| Rontgen thorax (PA) · Kesan | trait: efusi_pleura | 100% | Efusi pleura kanan minimal |
| USG abdomen · Kandung empedu | trait: usg_kebocoran | 100% | Dinding kandung empedu menebal (edema) |
| USG abdomen · Cairan bebas | trait: usg_kebocoran | 100% | Cairan bebas minimal di Morison pouch |
| USG abdomen · Hepar | trait: hepatomegali | 100% | Hepatomegali ringan, ekogenisitas normal |
| USG abdomen · Kesan | trait: usg_kebocoran | 100% | Penebalan dinding kandung empedu dan asites minimal, sesuai kebocoran plasma |
| USG abdomen · Kesan | trait: hepatomegali | 100% | Hepatomegali ringan |
| Fungsi hati · SGOT (AST) | trait: transaminitis | 100% | 60–250 U/L |
| Fungsi hati · SGPT (ALT) | trait: transaminitis | 100% | 45–160 U/L |
| Serologi dengue IgM/IgG · IgM anti-dengue | hari 5–… | 80% (sensitivitas) | Positif |
| Serologi dengue IgM/IgG · IgM anti-dengue | hari 4–… | 50% (sensitivitas) | Positif |
| Serologi dengue IgM/IgG · IgM anti-dengue | — | 15% (sensitivitas) | Positif |
| Serologi dengue IgM/IgG · IgG anti-dengue | trait: infeksi_sekunder | 90% | Positif |

**Petunjuk anamnesis** (jawaban bertanda petunjuk)

- _onset_: "Panasnya mulai {hariTeks} hari yang lalu, Dok. Datangnya mendadak, langsung tinggi." → **Demam tinggi yang muncul mendadak**
- _onset_: "Sudah {hariTeks} hari, Dok. Tiba-tiba saja badan panas tinggi, padahal paginya masih sehat." → **Demam tinggi yang muncul mendadak**
- _lokasi_: "Paling terasa di belakang bola mata, Dok, pegal sekali kalau melirik." → **Nyeri belakang bola mata (retro-orbital)**
- _karakter_: "Panasnya tinggi, Dok. Badan kayak remuk, linu-linu semua sampai ke tulang." → **Nyeri otot/sendi hebat ('break-bone fever')**
- _pola_: "Kemarin-kemarin panasnya tinggi, Dok. Hari ini sudah agak turun, tapi badan malah makin lemas." → **Demam turun tetapi pasien makin lemas — curiga fase kritis**
- _riwayat_keluarga_: "Tetangga sebelah rumah baru dirawat karena demam berdarah minggu lalu, Dok." → **Ada kasus DBD di lingkungan sekitar**
- _riwayat_keluarga_: "Di kantor ada yang kena DBD juga katanya, Dok." → **Ada kasus DBD di lingkungan sekitar**
- _bepergian_lingkungan_: "Nggak ke mana-mana, Dok. Di sekitar rumah banyak nyamuk, apalagi sekarang musim hujan, banyak genangan." → **Lingkungan banyak nyamuk dan genangan air (musim hujan)**
- _bepergian_lingkungan_: "Di rumah saja, Dok. Bak mandi memang jarang dikuras sih." → **Tempat perindukan nyamuk di rumah (bak mandi jarang dikuras)**

**Temuan khas (layar edukasi)**

- Demam tinggi mendadak 2–7 hari
- Nyeri kepala, nyeri belakang bola mata, nyeri otot/sendi
- Uji tourniquet positif atau perdarahan spontan (petekie, mimisan, gusi berdarah)
- Trombosit ≤ 100.000/µL dan leukopenia
- Hematokrit meningkat ≥ 20% (kebocoran plasma) pada DBD
- NS1 positif pada hari 1–5 demam
- Serologi IgM positif mulai hari ke-4–5; USG dapat menunjukkan penebalan dinding kandung empedu/asites (kebocoran plasma)

**Catatan pengembang**

- Probabilitas gejala dan rentang nilai lab adalah estimasi pengembang; mohon diverifikasi.
- Level SKDI perlu dicek: demam dengue/DBD tanpa syok vs sindrom syok dengue.
- Penyederhanaan: DD dan DBD digabung menjadi satu diagnosis di game.

**Rujukan**

- WHO. Dengue: guidelines for diagnosis, treatment, prevention and control (2009)
- WHO SEARO. Comprehensive guidelines for prevention and control of dengue and dengue haemorrhagic fever (2011)
- Kemenkes RI. Panduan Praktik Klinis bagi Dokter di Fasyankes Primer — Demam Dengue dan DBD

**Checklist reviewer**

- [ ] Nama, alias, tingkat SKDI, dan tingkat bahaya sudah tepat
- [ ] Demografi & faktor risiko sesuai epidemiologi Indonesia
- [ ] Probabilitas gejala masuk akal
- [ ] Rentang nilai lab & sensitivitas tes sesuai literatur
- [ ] Jawaban anamnesis & petunjuk realistis (bahasa awam)
- [ ] Temuan khas, catatan pembelajaran, dan cara membedakan akurat

---

## Demam Tifoid

- **id**: `demam_tifoid` · **SKDI**: 4A · **bahaya**: sedang · **sistem**: Infeksi tropis · **status**: `BELUM_DITINJAU_DOKTER`
- **Hari sakit saat datang**: 5–14
- **Demografi**: laki-laki 50%; usia 18–25 (bobot 5), 26–35 (bobot 3), 36–50 (bobot 2), 51–75 (bobot 1)
- **Pekerjaan berisiko** (bias 40%): Mahasiswa, Buruh pabrik, Pengemudi ojek online, Pedagang kaki lima
- **Pemeriksaan ideal**: Termometer, Tensimeter & tanda vital, Senter (mata, pupil, tenggorok, lidah), Darah lengkap + hitung jenis, Tubex TF (IgM anti-Salmonella) (Rp235.000)

> Infeksi sistemik oleh Salmonella enterica serotipe Typhi yang ditularkan lewat makanan/minuman tercemar (fekal–oral). Demam meningkat bertahap terutama sore–malam dan berlangsung lebih dari seminggu, disertai keluhan saluran cerna (konstipasi atau diare, nyeri perut), lidah kotor, dan kadang bradikardia relatif. Komplikasi berbahaya: perdarahan dan perforasi usus (biasanya minggu ke-2–3).

**Trait laten** (aturan pertama yang cocok per id dipakai)

| Trait | Peluang | Kondisi | Keterangan |
|---|---|---|---|
| demam_saat_periksa | 80% | — |  |
| bradikardia_relatif | 35% | — | Bradikardia relatif: nadi tidak naik sebanding dengan suhu. |
| lidah_kotor | 60% | — | Lidah kotor (coated tongue). |
| hepatomegali | 30% | — | Hepatomegali ringan. |
| splenomegali | 20% | — | Splenomegali ringan. |
| leukopenia | 25% | — | Leukopenia. |
| konstipasi | 45% | — | Keluhan cerna berupa konstipasi (lebih sering pada dewasa). |
| diare | 35% | tanpa: konstipasi | Keluhan cerna berupa diare. |
| aneosinofilia | 55% | — | Aneosinofilia (eosinofil 0%). |
| meteorismus | 30% | — | Meteorismus (perut kembung). |
| transaminitis | 50% | — | Peningkatan ringan SGOT/SGPT (hepatitis tifosa ringan). |

**Gejala**

| Gejala | Peluang | Kondisi |
|---|---|---|
| Demam | 100% | — |
| Nyeri kepala | 75% | — |
| Lemas | 85% | — |
| Nafsu makan menurun | 85% | — |
| Nyeri perut | 55% | — |
| Mual/muntah | 50% | — |
| Sulit buang air besar (konstipasi) | 100% | trait: konstipasi |
| Diare | 100% | trait: diare |
| Nyeri otot/sendi (mialgia/artralgia) | 30% | — |
| Batuk | 20% | — |
| Menggigil | 20% | — |

Keluhan utama (prioritas): demam; tambahan: nyeri_perut, nafsu_makan_turun, lemas, nyeri_kepala. Salah kaprah pasien: masuk angin, maag, kecapekan, DBD.

**Temuan pemeriksaan abnormal** (parameter lain = normal)

| Alat · parameter | Kondisi | Peluang | Nilai |
|---|---|---|---|
| Termometer · Suhu aksila | trait: demam_saat_periksa | 100% | 38,0–39,6 °C |
| Termometer · Suhu aksila | — | 100% | 37,4–38,0 °C |
| Tensimeter & tanda vital · Nadi | trait: bradikardia_relatif | 100% | 68–84 ×/menit |
| Tensimeter & tanda vital · Nadi | — | 100% | 90–108 ×/menit |
| Senter (mata, pupil, tenggorok, lidah) · Lidah | trait: lidah_kotor | 100% | Lidah kotor (selaput putih di tengah), tepi dan ujung hiperemis / Lidah kotor (coated tongue), ujung hiperemis, tremor halus |
| Pemeriksaan abdomen (palpasi & perkusi) · Nyeri tekan | gejala: nyeri_perut | 70% | Nyeri tekan epigastrium / Nyeri tekan periumbilikal / Nyeri tekan ringan regio epigastrium dan periumbilikal |
| Pemeriksaan abdomen (palpasi & perkusi) · Hepar | trait: hepatomegali | 100% | Teraba 1–2 jari di bawah arkus kosta, kenyal, nyeri tekan ringan |
| Pemeriksaan abdomen (palpasi & perkusi) · Lien (limpa) | trait: splenomegali | 100% | Teraba Schuffner I |
| Pemeriksaan abdomen (palpasi & perkusi) · Inspeksi & perkusi | trait: meteorismus | 100% | Sedikit cembung, meteorismus (hipertimpani) |
| Stetoskop (auskultasi) · Bising usus | trait: diare | 100% | Bising usus meningkat |
| Stetoskop (auskultasi) · Bising usus | trait: konstipasi | 50% | Bising usus menurun |
| Darah lengkap + hitung jenis · Leukosit | trait: leukopenia | 100% | 2.800–3.900 /µL |
| Darah lengkap + hitung jenis · Leukosit | — | 100% | 4.200–8.500 /µL |
| Darah lengkap + hitung jenis · Trombosit | — | 20% | 110.000–149.000 /µL |
| Darah lengkap + hitung jenis · Eosinofil | trait: aneosinofilia | 100% | 0–0 % |
| Darah lengkap + hitung jenis · Limfosit | — | 40% | 38–48 % |
| Darah lengkap + hitung jenis · Hemoglobin | laki-laki | 15% | 11,5–12,9 g/dL |
| Darah lengkap + hitung jenis · Hemoglobin | perempuan | 15% | 10,5–11,9 g/dL |
| Darah lengkap + hitung jenis · LED | laki-laki | 50% | 16–30 mm/jam |
| Darah lengkap + hitung jenis · LED | perempuan | 50% | 21–35 mm/jam |
| Tes Widal · S. typhi O | hari 7–… | 70% (sensitivitas) | 1/320 / 1/320 / 1/640 |
| Tes Widal · S. typhi O | — | 45% (sensitivitas) | 1/160 / 1/320 |
| Tes Widal · S. typhi H | — | 50% (sensitivitas) | 1/160 / 1/320 |
| Tubex TF (IgM anti-Salmonella) · Skor Tubex TF | — | 80% (sensitivitas) | 4 (positif lemah) / 6 (positif) / 6 (positif) / 8 (positif kuat) / 10 (positif kuat) |
| Fungsi hati · SGOT (AST) | trait: transaminitis | 100% | 42–110 U/L |
| Fungsi hati · SGPT (ALT) | trait: transaminitis | 100% | 42–100 U/L |
| USG abdomen · Hepar | trait: hepatomegali | 100% | Hepatomegali ringan, ekogenisitas normal |
| USG abdomen · Lien | trait: splenomegali | 100% | Splenomegali ringan |
| USG abdomen · Kesan | trait: hepatomegali + splenomegali | 100% | Hepatosplenomegali ringan |
| USG abdomen · Kesan | trait: hepatomegali | 100% | Hepatomegali ringan |
| USG abdomen · Kesan | trait: splenomegali | 100% | Splenomegali ringan |

**Petunjuk anamnesis** (jawaban bertanda petunjuk)

- _onset_: "Sudah sekitar {hariTeks} hari, Dok. Awalnya cuma meriang biasa, lama-lama makin panas." → **Demam yang naik bertahap, lebih dari 5 hari**
- _onset_: "Kurang lebih {hariTeks} hari, Dok. Pelan-pelan, tiap hari rasanya makin parah." → **Demam yang naik bertahap, lebih dari 5 hari**
- _lokasi_: "Perut bagian tengah sama ulu hati nggak enak, Dok." → **Nyeri perut/ulu hati yang menyertai demam**
- _pola_: "Pagi sampai siang agak mendingan, Dok. Tapi sore sampai malam panasnya naik lagi." → **Demam terutama sore–malam hari**
- _pola_: "Panasnya kayak naik tangga, Dok, tiap hari naik sedikit. Paling tinggi malam hari." → **Demam terutama sore–malam hari**
- _riwayat_keluarga_: "Teman satu kos ada yang sakit tipes bulan lalu, Dok." → **Kontak dengan penderita tifoid**
- _bepergian_lingkungan_: "Dua minggu lalu sempat mudik ke kampung, Dok. Di sana air sumurnya agak keruh, diminum juga." → **Kemungkinan sumber air minum tercemar**
- _kebiasaan_: "Saya sering jajan di pinggir jalan, Dok. Es campur, gorengan, apa saja." → **Sering jajan makanan/minuman yang kebersihannya kurang terjamin**
- _kebiasaan_: "Makan siang di warung dekat tempat kerja tiap hari, Dok. Cuci tangan? Jarang sih." → **Higiene makanan dan cuci tangan kurang**

**Temuan khas (layar edukasi)**

- Demam ≥ 5–7 hari yang naik bertahap, terutama sore–malam
- Keluhan saluran cerna: konstipasi (dewasa) atau diare, mual, nyeri perut
- Lidah kotor (coated tongue), bradikardia relatif, hepato/splenomegali ringan
- Leukosit normal atau rendah, aneosinofilia, limfositosis relatif
- Tubex TF / IgM anti-Salmonella positif; baku emas: kultur darah

**Catatan pengembang**

- Probabilitas gejala dan rentang nilai lab adalah estimasi pengembang; mohon diverifikasi.
- Sensitivitas Tubex/Widal di game disederhanakan.

**Rujukan**

- Kemenkes RI. Pedoman Pengendalian Demam Tifoid (2006)
- Kemenkes RI. Panduan Praktik Klinis bagi Dokter di Fasyankes Primer — Demam Tifoid
- WHO. Background document: the diagnosis, treatment and prevention of typhoid fever (2003)

**Checklist reviewer**

- [ ] Nama, alias, tingkat SKDI, dan tingkat bahaya sudah tepat
- [ ] Demografi & faktor risiko sesuai epidemiologi Indonesia
- [ ] Probabilitas gejala masuk akal
- [ ] Rentang nilai lab & sensitivitas tes sesuai literatur
- [ ] Jawaban anamnesis & petunjuk realistis (bahasa awam)
- [ ] Temuan khas, catatan pembelajaran, dan cara membedakan akurat

---

## Malaria (tanpa komplikasi)

- **id**: `malaria` · **SKDI**: 4A · **bahaya**: tinggi · **sistem**: Infeksi tropis · **status**: `BELUM_DITINJAU_DOKTER`
- **Hari sakit saat datang**: 2–7
- **Demografi**: laki-laki 75%; usia 18–30 (bobot 4), 31–45 (bobot 4), 46–60 (bobot 2), 61–75 (bobot 0.5)
- **Pekerjaan berisiko** (bias 70%): Pekerja tambang, Anggota TNI, Pekerja proyek bangunan, Pekerja perkebunan sawit, Sopir truk, Nelayan, Pegawai kantor swasta
- **Pemeriksaan ideal**: Termometer, Pemeriksaan abdomen (palpasi & perkusi), Tes cepat (RDT) malaria (Rp75.000)

> Infeksi parasit Plasmodium yang ditularkan nyamuk Anopheles. Khas dengan demam paroksismal (menggigil → panas tinggi → berkeringat), riwayat tinggal atau bepergian ke daerah endemis (mis. Papua, NTT, Maluku), anemia, dan splenomegali. Malaria falciparum dapat cepat berkembang menjadi malaria berat, sehingga diagnosis dini penting.

**Trait laten** (aturan pertama yang cocok per id dipakai)

| Trait | Peluang | Kondisi | Keterangan |
|---|---|---|---|
| falciparum | 55% | — | Spesies: Plasmodium falciparum (malaria tropika) — berisiko berkembang menjadi malaria berat. |
| vivax | 100% | tanpa: falciparum | Spesies: Plasmodium vivax (malaria tertiana) — dapat kambuh (relaps) dari hipnozoit di hati. |
| sedang_demam | 70% | — |  |
| di_sela_serangan | 100% | tanpa: sedang_demam | Pasien datang di sela serangan demam, sehingga suhu bisa normal saat diperiksa. |
| anemia | 55% | trait: falciparum | Anemia akibat hemolisis eritrosit terinfeksi. |
| anemia | 35% | — | Anemia akibat hemolisis eritrosit terinfeksi. |
| splenomegali | 50% | — | Splenomegali. |
| hepatomegali | 25% | — | Hepatomegali. |
| trombositopenia | 60% | — | Trombositopenia — juga sering pada malaria, bukan hanya dengue. |
| ikterik_ringan | 15% | trait: falciparum | Subikterik. |
| riwayat_malaria | 35% | trait: vivax | Pernah sakit malaria sebelumnya. |
| riwayat_malaria | 15% | — | Pernah sakit malaria sebelumnya. |

**Gejala**

| Gejala | Peluang | Kondisi |
|---|---|---|
| Demam | 100% | — |
| Menggigil | 90% | — |
| Berkeringat banyak | 75% | — |
| Nyeri kepala | 80% | — |
| Nyeri otot/sendi (mialgia/artralgia) | 60% | — |
| Lemas | 80% | — |
| Nafsu makan menurun | 60% | — |
| Mual/muntah | 40% | — |
| Nyeri perut | 15% | — |
| Diare | 15% | — |
| Mata/kulit kuning (ikterus) | 60% | trait: ikterik_ringan |
| Batuk | 10% | — |

Keluhan utama (prioritas): demam; tambahan: menggigil, nyeri_kepala, lemas. Salah kaprah pasien: masuk angin, tipes, DBD, kecapekan.

**Temuan pemeriksaan abnormal** (parameter lain = normal)

| Alat · parameter | Kondisi | Peluang | Nilai |
|---|---|---|---|
| Termometer · Suhu aksila | trait: sedang_demam | 100% | 38,5–40,2 °C |
| Termometer · Suhu aksila | — | 100% | 36,6–37,4 °C |
| Tensimeter & tanda vital · Nadi | trait: sedang_demam | 100% | 96–118 ×/menit |
| Senter (mata, pupil, tenggorok, lidah) · Konjungtiva | trait: anemia | 80% | Anemis (pucat) |
| Senter (mata, pupil, tenggorok, lidah) · Sklera | trait: ikterik_ringan | 100% | Subikterik |
| Pemeriksaan abdomen (palpasi & perkusi) · Lien (limpa) | trait: splenomegali | 100% | Teraba Schuffner I / Teraba Schuffner II |
| Pemeriksaan abdomen (palpasi & perkusi) · Hepar | trait: hepatomegali | 100% | Teraba 1–2 jari di bawah arkus kosta |
| Pemeriksaan abdomen (palpasi & perkusi) · Nyeri tekan | trait: splenomegali | 30% | Nyeri tekan ringan kuadran kiri atas |
| Darah lengkap + hitung jenis · Hemoglobin | laki-laki; trait: anemia | 100% | 9,0–12,5 g/dL |
| Darah lengkap + hitung jenis · Hemoglobin | perempuan; trait: anemia | 100% | 8,5–11,5 g/dL |
| Darah lengkap + hitung jenis · Hematokrit | laki-laki; trait: anemia | 100% | 28–38 % |
| Darah lengkap + hitung jenis · Hematokrit | perempuan; trait: anemia | 100% | 26–35 % |
| Darah lengkap + hitung jenis · Trombosit | trait: trombositopenia | 100% | 50.000–140.000 /µL |
| Darah lengkap + hitung jenis · Leukosit | — | 30% | 3.200–4.500 /µL |
| Tes cepat (RDT) malaria · P. falciparum (HRP-2) | trait: falciparum | 95% (sensitivitas) | Positif |
| Tes cepat (RDT) malaria · Pan-malaria (pLDH) | trait: falciparum | 85% (sensitivitas) | Positif |
| Tes cepat (RDT) malaria · Pan-malaria (pLDH) | trait: vivax | 85% (sensitivitas) | Positif |
| Uji tourniquet (Rumple–Leede) · Hasil | trait: trombositopenia | 15% | Positif (petekie ≥ 10 per 2,5 × 2,5 cm) |
| Apusan darah tebal–tipis (malaria) · Hasil | trait: falciparum | 95% (sensitivitas) | Ditemukan P. falciparum stadium tropozoit (bentuk cincin), ± 2.400 parasit/µL / Ditemukan P. falciparum stadium tropozoit dan gametosit (bentuk pisang) |
| Apusan darah tebal–tipis (malaria) · Hasil | trait: vivax | 95% (sensitivitas) | Ditemukan P. vivax stadium tropozoit (amoeboid) dan skizon / Ditemukan P. vivax stadium tropozoit, eritrosit terinfeksi membesar |
| Fungsi hati · Bilirubin total | trait: ikterik_ringan | 100% | 1,6–3,2 mg/dL |
| Fungsi hati · SGOT (AST) | — | 30% | 42–80 U/L |
| USG abdomen · Lien | trait: splenomegali | 100% | Splenomegali |
| USG abdomen · Hepar | trait: hepatomegali | 100% | Hepatomegali ringan |
| USG abdomen · Kesan | trait: hepatomegali + splenomegali | 100% | Hepatosplenomegali |
| USG abdomen · Kesan | trait: splenomegali | 100% | Splenomegali |
| USG abdomen · Kesan | trait: hepatomegali | 100% | Hepatomegali ringan |

**Petunjuk anamnesis** (jawaban bertanda petunjuk)

- _onset_: "Sudah {hariTeks} hari ini, Dok. Mulainya menggigil hebat, terus panas tinggi." → **Demam yang diawali menggigil hebat**
- _karakter_: "Menggigilnya sampai gemetaran, Dok. Pakai selimut tebal juga masih dingin, habis itu panas tinggi." → **Menggigil hebat (rigor)**
- _pola_: "Panasnya nggak tentu, Dok, kadang tiap hari. Menggigil dulu, terus panas, habis itu keringetan banyak, lalu agak enakan." → **Demam paroksismal: menggigil → panas → berkeringat**
- _pola_: "Kayak ada jadwalnya, Dok. Selang sehari kumat: menggigil, panas tinggi, terus keringat banjir, habis itu enakan." → **Demam paroksismal berselang sehari (pola tertiana)**
- _pola_: "Hilang timbul, Dok. Kalau kumat, menggigil dulu, terus panas tinggi." → **Demam hilang-timbul yang diawali menggigil**
- _pola_: "Hari ini panas, besok agak mendingan, lusa panas lagi, Dok." → **Demam berselang sehari (pola tertiana)**
- _pola_: "Panasnya naik turun, Dok, hilang timbul." → **Demam hilang-timbul**
- _pemberat_peringan_: "Habis keringetan biasanya badan enakan, Dok. Nanti kumat lagi." → **Membaik setelah berkeringat, lalu kambuh lagi**
- _riwayat_penyakit_: "Dulu waktu kerja di sana pernah kena malaria juga, Dok. Sudah diobati." → **Riwayat malaria sebelumnya**
- _riwayat_keluarga_: "Teman-teman satu barak di sana ada yang sakit kayak gini juga, Dok." → **Rekan di daerah endemis mengalami sakit serupa**
- _riwayat_keluarga_: "Rekan kerja di sana ada yang pernah sakit kayak gini, Dok." → **Rekan di daerah endemis mengalami sakit serupa**
- _bepergian_lingkungan_: "Saya baru pulang kerja dari {daerahEndemis}, Dok, kira-kira dua minggu lalu." → **Riwayat bepergian/bekerja di daerah endemis malaria**
- _bepergian_lingkungan_: "Saya kerja di {daerahEndemis}, Dok. Ini lagi pulang cuti seminggu." → **Riwayat bepergian/bekerja di daerah endemis malaria**
- _bepergian_lingkungan_: "Bulan lalu saya tugas tiga minggu di {daerahEndemis}, Dok." → **Riwayat bepergian/bekerja di daerah endemis malaria**
- _kebiasaan_: "Di sana tidurnya di barak, Dok, jarang pakai kelambu. Nyamuknya banyak sekali kalau malam." → **Tidak memakai kelambu di daerah endemis**
- _kebiasaan_: "Di sana nginap di mes, Dok. Kalau malam sering duduk-duduk di luar, nyamuknya banyak, nggak pakai obat nyamuk." → **Tidak memakai pelindung dari gigitan nyamuk di daerah endemis**
- _kebiasaan_: "Saya merokok, Dok. Di sana sering kerja sampai malam di luar." → **Sering beraktivitas di luar rumah pada malam hari (jam gigit Anopheles)**

**Temuan khas (layar edukasi)**

- Demam paroksismal: menggigil, panas tinggi, lalu berkeringat
- Riwayat tinggal/bepergian ke daerah endemis (Papua, NTT, Maluku, dsb.)
- Anemia (konjungtiva pucat), splenomegali, kadang subikterik
- Trombositopenia juga sering pada malaria — jangan langsung menyimpulkan dengue
- Apusan darah tebal–tipis (baku emas, sekaligus menentukan spesies) atau RDT malaria positif

**Catatan pengembang**

- Probabilitas gejala dan rentang nilai lab adalah estimasi pengembang; mohon diverifikasi.
- Proporsi spesies (falciparum vs vivax) disederhanakan; kenyataannya berbeda antar wilayah.
- Malaria berat sengaja tidak dimodelkan (pasien selalu tanpa komplikasi).

**Rujukan**

- Kemenkes RI. Pedoman Nasional Pelayanan Kedokteran Tata Laksana Malaria
- Kemenkes RI. Buku Saku Tatalaksana Kasus Malaria
- WHO. Guidelines for malaria

**Checklist reviewer**

- [ ] Nama, alias, tingkat SKDI, dan tingkat bahaya sudah tepat
- [ ] Demografi & faktor risiko sesuai epidemiologi Indonesia
- [ ] Probabilitas gejala masuk akal
- [ ] Rentang nilai lab & sensitivitas tes sesuai literatur
- [ ] Jawaban anamnesis & petunjuk realistis (bahasa awam)
- [ ] Temuan khas, catatan pembelajaran, dan cara membedakan akurat

---

## Penyakit Refluks Gastroesofageal (GERD)

- **id**: `gerd` · **SKDI**: 4A · **bahaya**: rendah · **sistem**: Pencernaan · **status**: `BELUM_DITINJAU_DOKTER`
- **Hari sakit saat datang**: 14–120
- **Demografi**: laki-laki 50%; usia 18–30 (bobot 3), 31–45 (bobot 4), 46–60 (bobot 3), 61–75 (bobot 1)
- **Pekerjaan berisiko** (bias 40%): Pegawai kantor swasta, Mahasiswa, Karyawan bank, Manajer perusahaan, Pengemudi ojek online
- **Pemeriksaan ideal**: Tensimeter & tanda vital, Timbangan & pita ukur, Elektrokardiografi (EKG) 12 sadapan (Rp130.000)

> Refluks isi lambung ke esofagus yang menimbulkan heartburn (rasa terbakar di belakang tulang dada) dan regurgitasi asam, terutama setelah makan, saat berbaring, atau membungkuk. Dapat disertai batuk kronik, suara serak, atau nyeri dada non-kardiak. Diagnosis terutama klinis (mis. kuesioner GERD-Q); pemeriksaan penunjang umumnya normal. Pada keluhan nyeri dada, penyebab jantung harus disingkirkan lebih dahulu.

**Trait laten** (aturan pertama yang cocok per id dipakai)

| Trait | Peluang | Kondisi | Keterangan |
|---|---|---|---|
| obesitas | 35% | — | Obesitas — meningkatkan tekanan intraabdomen dan refluks. |
| makan_larut | 60% | — | Kebiasaan makan larut malam lalu langsung berbaring. |
| batuk_kronik | 25% | — | Manifestasi ekstraesofageal: batuk kronik. |
| perokok | 45% | laki-laki |  |

**Gejala**

| Gejala | Peluang | Kondisi |
|---|---|---|
| Rasa terbakar di dada (heartburn) | 100% | — |
| Regurgitasi asam | 75% | — |
| Nyeri/perih ulu hati (epigastrium) | 40% | — |
| Kembung / cepat kenyang | 35% | — |
| Mual/muntah | 20% | — |
| Batuk | 100% | trait: batuk_kronik |
| Nyeri dada (berat/tertekan) | 15% | — |

Keluhan utama (prioritas): heartburn; tambahan: regurgitasi, nyeri_ulu_hati, batuk. Salah kaprah pasien: masuk angin, maag, angin duduk, jantung.

**Temuan pemeriksaan abnormal** (parameter lain = normal)

| Alat · parameter | Kondisi | Peluang | Nilai |
|---|---|---|---|
| Timbangan & pita ukur · Indeks massa tubuh (IMT) | trait: obesitas | 100% | 25,5–32,0 kg/m² |
| Timbangan & pita ukur · Lingkar perut | laki-laki; trait: obesitas | 100% | 92–108 cm |
| Timbangan & pita ukur · Lingkar perut | perempuan; trait: obesitas | 100% | 82–98 cm |
| Pemeriksaan abdomen (palpasi & perkusi) · Nyeri tekan | — | 30% | Nyeri tekan ringan epigastrium |
| Senter (mata, pupil, tenggorok, lidah) · Faring & tonsil | trait: batuk_kronik | 50% | Faring hiperemis ringan |

**Petunjuk anamnesis** (jawaban bertanda petunjuk)

- _lokasi_: "Di belakang tulang dada, Dok, kayak ada yang naik dari ulu hati." → **Rasa terbakar retrosternal yang naik dari ulu hati**
- _karakter_: "Panas, kayak terbakar, Dok. Kadang mulut jadi asam." → **Rasa terbakar (heartburn) dan regurgitasi asam — bukan rasa ditekan**
- _karakter_: "Panas, kayak terbakar, Dok. Bukan kayak ditekan." → **Rasa terbakar (heartburn), bukan rasa ditekan**
- _pola_: "Biasanya habis makan, apalagi kalau langsung tiduran, Dok. Malam-malam sering kebangun karena dada panas." → **Muncul setelah makan dan saat berbaring**
- _pemberat_peringan_: "Makan pedas, gorengan, kopi, atau tiduran habis makan bikin makin parah. Kalau jalan jauh atau naik tangga malah biasa saja, Dok." → **Memberat setelah makan/berbaring, TIDAK dipicu aktivitas fisik**
- _riwayat_obat_: "Kadang minum obat maag cair, Dok, langsung enakan." → **Membaik dengan antasida**
- _kebiasaan_: "Saya sering makan malam larut, Dok, habis itu langsung tidur. Kopi juga tiap hari." → **Makan larut malam lalu langsung berbaring; kopi**
- _kebiasaan_: "Merokok setengah bungkus sehari, Dok. Kopi juga." → **Merokok dan kopi memperberat refluks**

**Temuan khas (layar edukasi)**

- Heartburn: rasa terbakar di belakang tulang dada yang naik dari ulu hati
- Regurgitasi asam/pahit ke mulut
- Muncul setelah makan, saat berbaring atau membungkuk; membaik dengan antasida
- Dapat disertai batuk kronik, suara serak, atau nyeri dada non-kardiak
- Diagnosis klinis (mis. GERD-Q); EKG dan pemeriksaan lain normal

**Catatan pengembang**

- Probabilitas gejala adalah estimasi pengembang; mohon diverifikasi.

**Rujukan**

- Kemenkes RI. Panduan Praktik Klinis bagi Dokter di Fasyankes Primer — Penyakit Refluks Gastroesofageal
- PGI. Revisi Konsensus Nasional Penatalaksanaan GERD di Indonesia (2022)

**Checklist reviewer**

- [ ] Nama, alias, tingkat SKDI, dan tingkat bahaya sudah tepat
- [ ] Demografi & faktor risiko sesuai epidemiologi Indonesia
- [ ] Probabilitas gejala masuk akal
- [ ] Rentang nilai lab & sensitivitas tes sesuai literatur
- [ ] Jawaban anamnesis & petunjuk realistis (bahasa awam)
- [ ] Temuan khas, catatan pembelajaran, dan cara membedakan akurat

---

## Angina Pektoris Stabil

- **id**: `angina_stabil` · **SKDI**: 3A · **bahaya**: kritis · **sistem**: Jantung & pembuluh darah · **status**: `BELUM_DITINJAU_DOKTER`
- **Hari sakit saat datang**: 7–90
- **Demografi**: laki-laki 75%; usia 38–45 (bobot 1), 46–55 (bobot 3), 56–65 (bobot 4), 66–75 (bobot 3)
- **Pekerjaan berisiko** (bias 50%): Pensiunan, Pengusaha, Sopir truk, Manajer perusahaan, Pegawai kantor swasta, Pegawai negeri
- **Pemeriksaan ideal**: Tensimeter & tanda vital, Timbangan & pita ukur, Elektrokardiografi (EKG) 12 sadapan (Rp130.000)

> Nyeri dada akibat iskemia miokard yang dipicu aktivitas fisik atau emosi dan membaik dengan istirahat (atau nitrat) dalam beberapa menit. Rasa berat/tertekan/diremas di belakang tulang dada, dapat menjalar ke lengan kiri, leher, atau rahang, kadang disertai sesak dan keringat dingin. Faktor risiko: laki-laki usia lanjut, merokok, hipertensi, diabetes, dislipidemia, obesitas, riwayat keluarga. EKG istirahat sering normal. Dokter umum perlu mengenali dan merujuk (SKDI 3A) karena dapat berkembang menjadi sindrom koroner akut.

**Trait laten** (aturan pertama yang cocok per id dipakai)

| Trait | Peluang | Kondisi | Keterangan |
|---|---|---|---|
| perokok | 70% | laki-laki | Faktor risiko: merokok. |
| perokok | 10% | — | Faktor risiko: merokok. |
| hipertensi | 55% | — | Faktor risiko: hipertensi. |
| diabetes | 25% | — | Faktor risiko: diabetes melitus. |
| dislipidemia | 60% | — | Faktor risiko: dislipidemia. |
| obesitas | 40% | — | Faktor risiko: obesitas. |
| riwayat_keluarga_pjk | 35% | — | Faktor risiko: riwayat keluarga penyakit jantung koroner dini. |
| ekg_iskemia | 40% | — | EKG istirahat menunjukkan tanda iskemia (pada banyak pasien angina stabil EKG istirahat justru normal). |
| lvh | 30% | trait: hipertensi | Hipertrofi ventrikel kiri akibat hipertensi lama. |
| kardiomegali | 25% | trait: hipertensi | Kardiomegali ringan pada foto toraks. |

**Gejala**

| Gejala | Peluang | Kondisi |
|---|---|---|
| Nyeri dada (berat/tertekan) | 100% | — |
| Nyeri menjalar ke lengan kiri/leher/rahang | 55% | — |
| Sesak napas | 45% | — |
| Keringat dingin | 35% | — |
| Mual/muntah | 15% | — |
| Lemas | 20% | — |
| Rasa terbakar di dada (heartburn) | 10% | — |

Keluhan utama (prioritas): nyeri_dada; tambahan: sesak_napas, keringat_dingin. Salah kaprah pasien: masuk angin, maag, angin duduk, kecapekan.

**Temuan pemeriksaan abnormal** (parameter lain = normal)

| Alat · parameter | Kondisi | Peluang | Nilai |
|---|---|---|---|
| Tensimeter & tanda vital · Tekanan darah sistolik | trait: hipertensi | 100% | 145–175 mmHg |
| Tensimeter & tanda vital · Tekanan darah diastolik | trait: hipertensi | 100% | 90–105 mmHg |
| Tensimeter & tanda vital · Nadi | — | 100% | 68–92 ×/menit |
| Timbangan & pita ukur · Indeks massa tubuh (IMT) | trait: obesitas | 100% | 25,5–33,0 kg/m² |
| Timbangan & pita ukur · Lingkar perut | laki-laki; trait: obesitas | 100% | 92–110 cm |
| Timbangan & pita ukur · Lingkar perut | perempuan; trait: obesitas | 100% | 82–100 cm |
| Elektrokardiografi (EKG) 12 sadapan · Segmen ST | trait: ekg_iskemia | 100% | Depresi ST horizontal 1 mm di V4–V6 |
| Elektrokardiografi (EKG) 12 sadapan · Gelombang T | trait: ekg_iskemia | 100% | Inversi gelombang T di V4–V6 |
| Elektrokardiografi (EKG) 12 sadapan · Kompleks QRS | trait: lvh | 100% | Voltase QRS meningkat (kriteria LVH Sokolow–Lyon) |
| Elektrokardiografi (EKG) 12 sadapan · Kesan | trait: ekg_iskemia + lvh | 100% | Hipertrofi ventrikel kiri dengan iskemia anterolateral |
| Elektrokardiografi (EKG) 12 sadapan · Kesan | trait: ekg_iskemia | 100% | Iskemia anterolateral |
| Elektrokardiografi (EKG) 12 sadapan · Kesan | trait: lvh | 100% | Hipertrofi ventrikel kiri (LVH) |
| Profil lipid · Kolesterol total | trait: dislipidemia | 100% | 215–290 mg/dL |
| Profil lipid · Kolesterol LDL | trait: dislipidemia | 100% | 140–210 mg/dL |
| Profil lipid · Kolesterol HDL | laki-laki; trait: dislipidemia | 100% | 28–39 mg/dL |
| Profil lipid · Kolesterol HDL | perempuan; trait: dislipidemia | 100% | 35–49 mg/dL |
| Profil lipid · Trigliserida | trait: dislipidemia | 60% | 155–280 mg/dL |
| Gula darah sewaktu (GDS) · Glukosa darah sewaktu | trait: diabetes | 100% | 200–320 mg/dL |
| HbA1c · HbA1c | trait: diabetes | 100% | 7,0–9,5 % |
| Rontgen thorax (PA) · Cor | trait: kardiomegali | 100% | Membesar ringan (CTR 53%) |
| Rontgen thorax (PA) · Kesan | trait: kardiomegali | 100% | Kardiomegali ringan |

**Petunjuk anamnesis** (jawaban bertanda petunjuk)

- _lokasi_: "Di tengah dada, Dok, di belakang tulang dada. Kadang sampai ke lengan kiri dan rahang." → **Nyeri retrosternal yang menjalar ke lengan kiri/rahang**
- _lokasi_: "Di tengah dada, Dok, di belakang tulang dada." → **Nyeri retrosternal**
- _karakter_: "Rasanya berat, kayak ditindih atau diremas, Dok. Bukan perih." → **Nyeri seperti ditekan/diremas (bukan rasa terbakar)**
- _pola_: "Munculnya kalau saya jalan cepat atau naik tangga, Dok. Paling lama lima sampai sepuluh menit." → **Dipicu aktivitas fisik, berlangsung < 15 menit**
- _pemberat_peringan_: "Kalau berhenti dan istirahat sebentar, hilang sendiri, Dok. Kalau lagi marah atau stres juga bisa muncul." → **Membaik dengan istirahat; bisa dipicu emosi**
- _riwayat_penyakit_: "Saya punya darah tinggi, Dok, tapi jarang minum obat." → **Hipertensi tidak terkontrol**
- _riwayat_penyakit_: "Saya kencing manis, Dok, sudah lima tahun." → **Diabetes melitus**
- _riwayat_penyakit_: "Kata dokter dulu kolesterol saya tinggi, Dok." → **Dislipidemia**
- _riwayat_obat_: "Sudah minum obat maag sama pakai balsem, Dok. Nggak ngaruh." → **Tidak membaik dengan obat maag**
- _riwayat_keluarga_: "Bapak saya meninggal karena serangan jantung umur lima puluhan, Dok." → **Riwayat keluarga penyakit jantung koroner dini**
- _kebiasaan_: "Saya merokok sebungkus sehari, Dok, sudah dari muda. Olahraga jarang." → **Perokok berat dan kurang aktivitas fisik**
- _kebiasaan_: "Nggak merokok, Dok, tapi jarang olahraga. Makan suka yang bersantan dan gorengan." → **Kurang aktivitas fisik, pola makan tinggi lemak**

**Temuan khas (layar edukasi)**

- Nyeri dada retrosternal seperti ditekan/diremas
- Dipicu aktivitas fisik atau emosi, membaik dengan istirahat dalam < 15 menit
- Dapat menjalar ke lengan kiri, leher, atau rahang; disertai sesak atau keringat dingin
- Faktor risiko: laki-laki > 45 tahun, merokok, hipertensi, DM, dislipidemia, obesitas, riwayat keluarga
- EKG istirahat sering normal; bisa tampak depresi ST/inversi T. Konfirmasi dengan uji latih jantung (rujuk)

**Catatan pengembang**

- Level SKDI angina pektoris stabil (3A) mohon diverifikasi.
- Proporsi EKG istirahat abnormal disederhanakan.

**Rujukan**

- PERKI. Pedoman Tatalaksana Sindrom Koroner Kronis (2022)
- Kemenkes RI. Panduan Praktik Klinis bagi Dokter di Fasyankes Primer — Angina Pektoris Stabil
- ESC Guidelines for the management of chronic coronary syndromes (2019)

**Checklist reviewer**

- [ ] Nama, alias, tingkat SKDI, dan tingkat bahaya sudah tepat
- [ ] Demografi & faktor risiko sesuai epidemiologi Indonesia
- [ ] Probabilitas gejala masuk akal
- [ ] Rentang nilai lab & sensitivitas tes sesuai literatur
- [ ] Jawaban anamnesis & petunjuk realistis (bahasa awam)
- [ ] Temuan khas, catatan pembelajaran, dan cara membedakan akurat

---

## Dispepsia / Gastritis

- **id**: `dispepsia` · **SKDI**: 4A · **bahaya**: rendah · **sistem**: Pencernaan · **status**: `BELUM_DITINJAU_DOKTER`
- **Hari sakit saat datang**: 3–60
- **Demografi**: laki-laki 45%; usia 18–30 (bobot 4), 31–45 (bobot 4), 46–60 (bobot 2), 61–75 (bobot 1)
- **Pekerjaan berisiko** (bias 40%): Mahasiswa, Pegawai kantor swasta, Pengemudi ojek online, Buruh pabrik, Pekerja proyek bangunan
- **Pemeriksaan ideal**: Tensimeter & tanda vital, Pemeriksaan abdomen (palpasi & perkusi) (Rp15.000)

> Kumpulan keluhan nyeri atau rasa tidak nyaman di ulu hati, rasa penuh setelah makan, cepat kenyang, kembung, dan mual. Gastritis (peradangan mukosa lambung) sering dipicu obat antinyeri golongan OAINS, alkohol, stres, pola makan tidak teratur, atau infeksi H. pylori. Pemeriksaan penunjang umumnya normal. Waspadai tanda alarm (berat badan turun, muntah darah, BAB hitam, anemia, usia > 55 tahun dengan keluhan baru) yang memerlukan rujukan untuk endoskopi.

**Trait laten** (aturan pertama yang cocok per id dipakai)

| Trait | Peluang | Kondisi | Keterangan |
|---|---|---|---|
| oains | 35% | — | Pemicu: konsumsi obat antinyeri (OAINS/jamu pegal linu) rutin. |
| makan_tidak_teratur | 60% | — | Pemicu: pola makan tidak teratur dan kopi berlebihan. |
| stres | 40% | — | Pemicu: stres psikologis. |

**Gejala**

| Gejala | Peluang | Kondisi |
|---|---|---|
| Nyeri/perih ulu hati (epigastrium) | 100% | — |
| Kembung / cepat kenyang | 75% | — |
| Mual/muntah | 55% | — |
| Nafsu makan menurun | 40% | — |
| Rasa terbakar di dada (heartburn) | 25% | — |

Keluhan utama (prioritas): nyeri_ulu_hati; tambahan: kembung, mual_muntah. Salah kaprah pasien: masuk angin, asam lambung, kecapekan, maag.

**Temuan pemeriksaan abnormal** (parameter lain = normal)

| Alat · parameter | Kondisi | Peluang | Nilai |
|---|---|---|---|
| Pemeriksaan abdomen (palpasi & perkusi) · Nyeri tekan | — | 80% | Nyeri tekan epigastrium |

**Petunjuk anamnesis** (jawaban bertanda petunjuk)

- _lokasi_: "Di ulu hati, Dok, perut atas bagian tengah." → **Nyeri terlokalisasi di epigastrium**
- _karakter_: "Perih, Dok, kayak ditusuk-tusuk. Perut juga begah." → **Perih ulu hati disertai rasa penuh/begah**
- _pola_: "Kalau telat makan langsung kambuh, Dok. Tapi habis makan sedikit sudah kenyang." → **Terkait waktu makan; cepat kenyang**
- _pemberat_peringan_: "Makan pedas, kopi, atau telat makan bikin kambuh. Minum obat maag biasanya mendingan, Dok." → **Dipicu makanan pedas/kopi/telat makan; membaik dengan antasida**
- _riwayat_obat_: "Saya sering minum obat pegal linu, Dok, hampir tiap hari. Habis kerja badan pegal semua." → **Konsumsi obat antinyeri (OAINS) rutin**
- _kebiasaan_: "Makan saya nggak teratur, Dok. Sering nggak sarapan, kopi tiga gelas sehari." → **Pola makan tidak teratur, kopi berlebihan**
- _kebiasaan_: "Lagi banyak pikiran, Dok, kerjaan numpuk." → **Stres psikologis**

**Temuan khas (layar edukasi)**

- Nyeri/perih ulu hati, kembung, cepat kenyang, mual
- Dipicu telat makan, makanan pedas/asam, kopi, stres, atau obat antinyeri (OAINS)
- Nyeri tekan epigastrium; pemeriksaan lain umumnya normal
- Tanpa tanda alarm (BB turun, muntah darah, BAB hitam, anemia, sulit menelan)

**Catatan pengembang**

- Dispepsia dan gastritis digabung menjadi satu diagnosis di game.

**Rujukan**

- Kemenkes RI. Panduan Praktik Klinis bagi Dokter di Fasyankes Primer — Dispepsia & Gastritis
- PGI. Konsensus Nasional Penatalaksanaan Dispepsia dan Infeksi Helicobacter pylori (2021)

**Checklist reviewer**

- [ ] Nama, alias, tingkat SKDI, dan tingkat bahaya sudah tepat
- [ ] Demografi & faktor risiko sesuai epidemiologi Indonesia
- [ ] Probabilitas gejala masuk akal
- [ ] Rentang nilai lab & sensitivitas tes sesuai literatur
- [ ] Jawaban anamnesis & petunjuk realistis (bahasa awam)
- [ ] Temuan khas, catatan pembelajaran, dan cara membedakan akurat

---

## Infeksi Saluran Kemih Bawah (Sistitis)

- **id**: `isk` · **SKDI**: 4A · **bahaya**: rendah · **sistem**: Saluran kemih · **status**: `BELUM_DITINJAU_DOKTER`
- **Hari sakit saat datang**: 1–5
- **Demografi**: laki-laki 15%; usia 18–30 (bobot 4), 31–45 (bobot 4), 46–60 (bobot 2), 61–75 (bobot 2)
- **Pekerjaan berisiko** (bias 40%): Ibu rumah tangga, Pegawai kantor swasta, Guru, Buruh pabrik, Pedagang pasar
- **Pemeriksaan ideal**: Termometer, Pemeriksaan abdomen (palpasi & perkusi), Urinalisis (urin lengkap) (Rp55.000)

> Infeksi bakteri (tersering E. coli) pada kandung kemih. Gejala khas: nyeri/perih saat berkemih (disuria), sering dan anyang-anyangan dengan volume sedikit (frekuensi & urgensi), nyeri suprapubik, kadang urin keruh/berbau atau kemerahan. Jauh lebih sering pada perempuan (uretra pendek), terutama usia aktif seksual, kehamilan, dan kurang minum. Biasanya tanpa demam tinggi; demam tinggi dengan nyeri pinggang mengarah ke pielonefritis.

**Trait laten** (aturan pertama yang cocok per id dipakai)

| Trait | Peluang | Kondisi | Keterangan |
|---|---|---|---|
| kurang_minum | 50% | — | Faktor risiko: kurang minum. |
| menahan_kencing | 40% | — | Faktor risiko: kebiasaan menahan berkemih. |
| hematuria | 35% | — | Hematuria (sistitis hemoragik ringan). |
| demam_ringan | 20% | — | Demam ringan — bila demam tinggi + nyeri pinggang, pikirkan pielonefritis. |
| nitrit_positif | 50% | — |  |

**Gejala**

| Gejala | Peluang | Kondisi |
|---|---|---|
| Nyeri/perih saat berkemih (disuria) | 100% | — |
| Sering berkemih | 90% | — |
| Nyeri perut bawah (suprapubik) | 60% | — |
| Urin keruh/berbau | 50% | — |
| Kencing berwarna merah (hematuria) | 40% | trait: hematuria |
| Demam | 100% | trait: demam_ringan |
| Mual/muntah | 10% | — |

Keluhan utama (prioritas): disuria; tambahan: sering_kencing, nyeri_suprapubik. Salah kaprah pasien: panas dalam, kurang minum, masuk angin, kecapekan.

**Temuan pemeriksaan abnormal** (parameter lain = normal)

| Alat · parameter | Kondisi | Peluang | Nilai |
|---|---|---|---|
| Termometer · Suhu aksila | trait: demam_ringan | 100% | 37,6–38,2 °C |
| Pemeriksaan abdomen (palpasi & perkusi) · Nyeri tekan | gejala: nyeri_suprapubik | 80% | Nyeri tekan suprapubik |
| Urinalisis (urin lengkap) · Warna & kejernihan | gejala: urin_keruh | 100% | Kuning keruh |
| Urinalisis (urin lengkap) · Leukosit esterase | — | 85% (sensitivitas) | +1 / +2 / +3 |
| Urinalisis (urin lengkap) · Nitrit | trait: nitrit_positif | 100% | Positif |
| Urinalisis (urin lengkap) · Sedimen leukosit | — | 90% (sensitivitas) | 10–50 /LPB |
| Urinalisis (urin lengkap) · Bakteri | — | 80% (sensitivitas) | Positif (+) / Positif (++) |
| Urinalisis (urin lengkap) · Darah (dipstik) | trait: hematuria | 100% | +1 / +2 |
| Urinalisis (urin lengkap) · Sedimen eritrosit | trait: hematuria | 100% | 5–25 /LPB |
| Urinalisis (urin lengkap) · Protein | — | 30% | Trace / +1 |
| Darah lengkap + hitung jenis · Leukosit | — | 25% | 9.500–12.000 /µL |

**Petunjuk anamnesis** (jawaban bertanda petunjuk)

- _onset_: "Baru {hariTeks} hari, Dok, mendadak." → **Onset akut (hari)**
- _lokasi_: "Di perut bawah, di atas kemaluan, Dok. Pinggang sih nggak sakit." → **Nyeri suprapubik tanpa nyeri pinggang**
- _lokasi_: "Perihnya pas kencing saja, Dok. Pinggang nggak sakit." → **Tanpa nyeri pinggang/kolik**
- _karakter_: "Perih dan panas kalau kencing, Dok, terus rasanya nggak tuntas." → **Disuria dan rasa tidak tuntas (anyang-anyangan)**
- _pola_: "Sebentar-sebentar mau kencing, Dok, tapi keluarnya sedikit-sedikit." → **Sering kencing dengan volume sedikit (bukan poliuria)**
- _kebiasaan_: "Saya jarang minum, Dok, paling dua gelas sehari." → **Kurang minum**
- _kebiasaan_: "Di tempat kerja saya sering menahan kencing, Dok, toiletnya jauh." → **Kebiasaan menahan berkemih**

**Temuan khas (layar edukasi)**

- Disuria, frekuensi, urgensi, rasa tidak tuntas (anyang-anyangan)
- Nyeri suprapubik; tanpa nyeri pinggang/kolik dan tanpa demam tinggi
- Lebih sering pada perempuan; faktor risiko kurang minum, menahan kencing
- Urinalisis: leukosit esterase (+), leukosituria (> 5/LPB), bakteriuria, nitrit (+)

**Catatan pengembang**

- Probabilitas temuan urinalisis adalah estimasi pengembang; mohon diverifikasi.

**Rujukan**

- Kemenkes RI. Panduan Praktik Klinis bagi Dokter di Fasyankes Primer — Infeksi Saluran Kemih
- IAUI. Guideline Penatalaksanaan Infeksi Saluran Kemih dan Genitalia Pria (2021)

**Checklist reviewer**

- [ ] Nama, alias, tingkat SKDI, dan tingkat bahaya sudah tepat
- [ ] Demografi & faktor risiko sesuai epidemiologi Indonesia
- [ ] Probabilitas gejala masuk akal
- [ ] Rentang nilai lab & sensitivitas tes sesuai literatur
- [ ] Jawaban anamnesis & petunjuk realistis (bahasa awam)
- [ ] Temuan khas, catatan pembelajaran, dan cara membedakan akurat

---

## Batu Saluran Kemih dengan Kolik (Urolitiasis)

- **id**: `batu_saluran_kemih` · **SKDI**: 3A · **bahaya**: sedang · **sistem**: Saluran kemih · **status**: `BELUM_DITINJAU_DOKTER`
- **Hari sakit saat datang**: 1–3
- **Demografi**: laki-laki 70%; usia 25–35 (bobot 3), 36–50 (bobot 5), 51–65 (bobot 2), 66–75 (bobot 1)
- **Pekerjaan berisiko** (bias 50%): Sopir truk, Pekerja proyek bangunan, Satpam, Pengemudi ojek online, Petani
- **Pemeriksaan ideal**: Pemeriksaan abdomen (palpasi & perkusi), Urinalisis (urin lengkap), USG abdomen (Rp350.000)

> Batu di ginjal atau ureter yang menyumbat aliran urin. Khas dengan nyeri kolik hebat hilang-timbul di pinggang yang menjalar ke perut bawah atau lipat paha, pasien gelisah mencari posisi, sering disertai mual-muntah dan hematuria. Faktor risiko: laki-laki usia 30–50 tahun, kurang minum, bekerja di lingkungan panas, riwayat batu sebelumnya. Komplikasi: hidronefrosis, infeksi (urosepsis), dan gangguan fungsi ginjal.

**Trait laten** (aturan pertama yang cocok per id dipakai)

| Trait | Peluang | Kondisi | Keterangan |
|---|---|---|---|
| sisi_kanan | 50% | — | Batu di sisi kanan. |
| sisi_kiri | 100% | tanpa: sisi_kanan | Batu di sisi kiri. |
| hidronefrosis | 60% | — | Sumbatan menyebabkan hidronefrosis. |
| kurang_minum | 70% | — | Faktor risiko: kurang minum. |
| kerja_panas | 80% | pekerjaan: sopir_truk, pekerja_proyek, satpam, ojek_online, petani, nelayan, pekerja_sawit, pedagang_kaki_lima | Faktor risiko: bekerja di lingkungan panas (dehidrasi kronik). |
| riwayat_batu | 30% | — | Pernah mengalami batu sebelumnya (risiko kambuh tinggi). |
| batu_distal | 30% | — | Batu di ureter distal — dapat menimbulkan keluhan berkemih (frekuensi/urgensi). |
| hematuria_makro | 30% | — |  |

**Gejala**

| Gejala | Peluang | Kondisi |
|---|---|---|
| Nyeri pinggang | 100% | — |
| Mual/muntah | 60% | — |
| Kencing berwarna merah (hematuria) | 100% | trait: hematuria_makro |
| Sering berkemih | 80% | trait: batu_distal |
| Nyeri/perih saat berkemih (disuria) | 40% | trait: batu_distal |

Keluhan utama (prioritas): nyeri_pinggang; tambahan: mual_muntah, kencing_merah. Salah kaprah pasien: salah urat, encok, masuk angin, maag.

**Temuan pemeriksaan abnormal** (parameter lain = normal)

| Alat · parameter | Kondisi | Peluang | Nilai |
|---|---|---|---|
| Tensimeter & tanda vital · Nadi | — | 100% | 88–108 ×/menit |
| Tensimeter & tanda vital · Tekanan darah sistolik | — | 50% | 130–150 mmHg |
| Pemeriksaan abdomen (palpasi & perkusi) · Nyeri ketok CVA | trait: sisi_kanan | 85% | Positif kanan |
| Pemeriksaan abdomen (palpasi & perkusi) · Nyeri ketok CVA | trait: sisi_kiri | 85% | Positif kiri |
| Pemeriksaan abdomen (palpasi & perkusi) · Nyeri tekan | trait: sisi_kanan | 40% | Nyeri tekan ringan regio lumbal–inguinal kanan |
| Pemeriksaan abdomen (palpasi & perkusi) · Nyeri tekan | trait: sisi_kiri | 40% | Nyeri tekan ringan regio lumbal–inguinal kiri |
| Urinalisis (urin lengkap) · Warna & kejernihan | trait: hematuria_makro | 100% | Merah muda, keruh |
| Urinalisis (urin lengkap) · Darah (dipstik) | trait: hematuria_makro | 100% | +3 |
| Urinalisis (urin lengkap) · Darah (dipstik) | — | 80% (sensitivitas) | +1 / +2 |
| Urinalisis (urin lengkap) · Sedimen eritrosit | trait: hematuria_makro | 100% | 50–100 /LPB |
| Urinalisis (urin lengkap) · Sedimen eritrosit | — | 80% (sensitivitas) | 6–40 /LPB |
| Urinalisis (urin lengkap) · Kristal | — | 40% | Kalsium oksalat (+) / Asam urat (+) |
| Urinalisis (urin lengkap) · Sedimen leukosit | — | 30% | 6–12 /LPB |
| Urinalisis (urin lengkap) · Berat jenis | trait: kurang_minum | 100% | 1,025–1,030  |
| USG abdomen · Ginjal kanan & kiri | trait: sisi_kanan + hidronefrosis | 90% (sensitivitas) | Hidronefrosis ringan ginjal kanan; tampak batu di ureter proksimal kanan ± 6 mm |
| USG abdomen · Ginjal kanan & kiri | trait: sisi_kiri + hidronefrosis | 90% (sensitivitas) | Hidronefrosis ringan ginjal kiri; tampak batu di ureter proksimal kiri ± 6 mm |
| USG abdomen · Ginjal kanan & kiri | trait: sisi_kanan | 70% (sensitivitas) | Tampak batu di pelvis ginjal kanan ± 5 mm, tanpa hidronefrosis |
| USG abdomen · Ginjal kanan & kiri | trait: sisi_kiri | 70% (sensitivitas) | Tampak batu di pelvis ginjal kiri ± 5 mm, tanpa hidronefrosis |
| USG abdomen · Kesan | trait: hidronefrosis; jika ginjal abnormal | 100% | Urolitiasis dengan hidronefrosis ringan |
| USG abdomen · Kesan | jika ginjal abnormal | 100% | Nefrolitiasis tanpa hidronefrosis |
| Fungsi ginjal · Kreatinin | laki-laki; trait: hidronefrosis | 20% | 1,4–1,7 mg/dL |
| Darah lengkap + hitung jenis · Leukosit | — | 30% | 10.500–13.000 /µL |

**Petunjuk anamnesis** (jawaban bertanda petunjuk)

- _onset_: "Mulai {hariTeks} hari lalu, Dok, mendadak sakit sekali." → **Nyeri mendadak dan hebat**
- _lokasi_: "Di pinggang kanan, Dok, terus menjalar ke perut bawah sampai selangkangan." → **Nyeri pinggang menjalar ke perut bawah/lipat paha**
- _lokasi_: "Di pinggang kiri, Dok, terus menjalar ke perut bawah sampai selangkangan." → **Nyeri pinggang menjalar ke perut bawah/lipat paha**
- _karakter_: "Sakitnya melilit, datang dan pergi, Dok. Kalau datang saya sampai nggak bisa diam, guling-guling." → **Nyeri kolik; pasien gelisah mencari posisi**
- _pola_: "Hilang timbul, Dok. Tiap setengah jam kambuh lagi." → **Kolik hilang-timbul**
- _riwayat_penyakit_: "Dua tahun lalu pernah keluar batu kecil waktu kencing, Dok." → **Riwayat batu saluran kemih sebelumnya**
- _riwayat_keluarga_: "Bapak saya dulu operasi batu ginjal, Dok." → **Riwayat keluarga batu saluran kemih**
- _kebiasaan_: "Kerja di bawah panas seharian, Dok, minumnya jarang. Kencing juga kuning pekat." → **Kurang minum dan bekerja di lingkungan panas**
- _kebiasaan_: "Saya jarang minum air putih, Dok. Lebih sering kopi dan teh manis." → **Kurang minum air putih**

**Temuan khas (layar edukasi)**

- Nyeri kolik hebat hilang-timbul di pinggang, menjalar ke perut bawah/lipat paha
- Pasien gelisah, berguling mencari posisi; sering mual-muntah
- Nyeri ketok CVA positif pada sisi yang sakit
- Urinalisis: hematuria (makro/mikroskopis), kadang kristal
- USG: batu dan/atau hidronefrosis

**Catatan pengembang**

- Level SKDI batu saluran kemih (3A) mohon diverifikasi.
- Sensitivitas USG untuk batu ureter disederhanakan.

**Rujukan**

- IAUI. Panduan Penatalaksanaan Klinis Batu Saluran Kemih (2018)
- EAU Guidelines on Urolithiasis

**Checklist reviewer**

- [ ] Nama, alias, tingkat SKDI, dan tingkat bahaya sudah tepat
- [ ] Demografi & faktor risiko sesuai epidemiologi Indonesia
- [ ] Probabilitas gejala masuk akal
- [ ] Rentang nilai lab & sensitivitas tes sesuai literatur
- [ ] Jawaban anamnesis & petunjuk realistis (bahasa awam)
- [ ] Temuan khas, catatan pembelajaran, dan cara membedakan akurat

---

## Diabetes Melitus Tipe 2

- **id**: `dm_tipe2` · **SKDI**: 4A · **bahaya**: sedang · **sistem**: Endokrin & metabolik · **status**: `BELUM_DITINJAU_DOKTER`
- **Hari sakit saat datang**: 14–180
- **Demografi**: laki-laki 45%; usia 30–40 (bobot 1), 41–55 (bobot 4), 56–75 (bobot 4)
- **Pekerjaan berisiko** (bias 50%): Pensiunan, Pengusaha, Ibu rumah tangga, Pegawai negeri, Pegawai kantor swasta, Pedagang pasar
- **Pemeriksaan ideal**: Tensimeter & tanda vital, Timbangan & pita ukur, Gula darah sewaktu (GDS) (Rp35.000)

> Gangguan metabolik akibat resistansi insulin dan defisiensi insulin relatif, ditandai hiperglikemia kronik. Gejala klasik: poliuria, polidipsia, polifagia, dan penurunan berat badan tanpa sebab jelas; keluhan lain: lemas, kesemutan, luka sulit sembuh, pandangan kabur. Banyak pasien tanpa gejala. Kriteria diagnosis (PERKENI): GDS ≥ 200 mg/dL dengan gejala klasik, GDP ≥ 126 mg/dL, TTGO 2 jam ≥ 200 mg/dL, atau HbA1c ≥ 6,5%.

**Trait laten** (aturan pertama yang cocok per id dipakai)

| Trait | Peluang | Kondisi | Keterangan |
|---|---|---|---|
| obesitas | 60% | — | Faktor risiko: obesitas sentral. |
| riwayat_keluarga_dm | 55% | — | Faktor risiko: riwayat keluarga DM. |
| neuropati | 35% | — | Komplikasi awal: neuropati perifer (kesemutan/kebas). |
| hipertensi | 40% | — | Komorbid: hipertensi. |
| dislipidemia | 50% | — | Komorbid: dislipidemia (trigliserida tinggi, HDL rendah). |
| glukosuria | 75% | — | Glukosuria (glukosa darah melebihi ambang ginjal ± 180 mg/dL). |

**Gejala**

| Gejala | Peluang | Kondisi |
|---|---|---|
| Sering berkemih | 85% | — |
| Lemas | 100% | — |
| Sering haus (polidipsia) | 80% | — |
| Sering lapar (polifagia) | 50% | — |
| Berat badan turun | 60% | — |
| Kesemutan/kebas di tangan atau kaki | 90% | trait: neuropati |
| Pandangan kabur | 25% | — |
| Luka lama sembuh | 20% | — |

Keluhan utama (prioritas): sering_kencing → lemas; tambahan: lemas, kesemutan, berat_badan_turun. Salah kaprah pasien: kecapekan, kurang minum, asam urat, anyang-anyangan.

**Temuan pemeriksaan abnormal** (parameter lain = normal)

| Alat · parameter | Kondisi | Peluang | Nilai |
|---|---|---|---|
| Timbangan & pita ukur · Indeks massa tubuh (IMT) | trait: obesitas | 100% | 25,5–34,0 kg/m² |
| Timbangan & pita ukur · Lingkar perut | laki-laki; trait: obesitas | 100% | 93–115 cm |
| Timbangan & pita ukur · Lingkar perut | perempuan; trait: obesitas | 100% | 83–105 cm |
| Tensimeter & tanda vital · Tekanan darah sistolik | trait: hipertensi | 100% | 140–165 mmHg |
| Tensimeter & tanda vital · Tekanan darah diastolik | trait: hipertensi | 100% | 90–100 mmHg |
| Gula darah sewaktu (GDS) · Glukosa darah sewaktu | trait: glukosuria | 95% (sensitivitas) | 220–420 mg/dL |
| Gula darah sewaktu (GDS) · Glukosa darah sewaktu | — | 80% (sensitivitas) | 200–260 mg/dL |
| HbA1c · HbA1c | — | 95% (sensitivitas) | 6,6–11,5 % |
| Urinalisis (urin lengkap) · Glukosa | trait: glukosuria | 100% | +1 / +2 / +3 |
| Urinalisis (urin lengkap) · Keton | trait: glukosuria | 10% | +1 |
| Profil lipid · Trigliserida | trait: dislipidemia | 100% | 160–320 mg/dL |
| Profil lipid · Kolesterol HDL | laki-laki; trait: dislipidemia | 100% | 28–39 mg/dL |
| Profil lipid · Kolesterol HDL | perempuan; trait: dislipidemia | 100% | 34–49 mg/dL |
| Profil lipid · Kolesterol LDL | trait: dislipidemia | 60% | 135–190 mg/dL |

**Petunjuk anamnesis** (jawaban bertanda petunjuk)

- _karakter_: "Kencingnya banyak, Dok, tapi nggak perih sama sekali. Malam bisa bangun tiga-empat kali." → **Poliuria & nokturia tanpa disuria**
- _pola_: "Gampang haus, Dok, minum terus tapi tetap haus." → **Polidipsia**
- _pemberat_peringan_: "Cepat lapar, Dok. Makan banyak, tapi berat badan malah turun." → **Polifagia dengan penurunan berat badan**
- _pemberat_peringan_: "Cepat lapar, Dok, makannya jadi banyak." → **Polifagia**
- _riwayat_penyakit_: "Saya darah tinggi, Dok, obatnya kadang lupa." → **Hipertensi (komorbid)**
- _riwayat_keluarga_: "Ibu saya kencing manis, Dok, sampai jari kakinya diamputasi." → **Riwayat keluarga DM**
- _kebiasaan_: "Saya suka yang manis-manis, Dok, teh manis tiap hari. Olahraga hampir nggak pernah." → **Pola makan tinggi gula dan kurang aktivitas fisik**
- _kebiasaan_: "Makan biasa, Dok, tapi memang jarang gerak." → **Kurang aktivitas fisik**

**Temuan khas (layar edukasi)**

- Poliuria (sering & banyak kencing, terutama malam), polidipsia, polifagia
- Penurunan berat badan tanpa sebab jelas, lemas, kesemutan
- Faktor risiko: usia > 40 tahun, obesitas sentral, riwayat keluarga DM, hipertensi, kurang aktivitas fisik
- GDS ≥ 200 mg/dL dengan gejala klasik, atau HbA1c ≥ 6,5% (kriteria PERKENI)
- Glukosuria pada urinalisis

**Catatan pengembang**

- Rentang GDS/HbA1c adalah estimasi pengembang.

**Rujukan**

- PERKENI. Pedoman Pengelolaan dan Pencegahan Diabetes Melitus Tipe 2 Dewasa di Indonesia (2021)
- Kemenkes RI. Panduan Praktik Klinis bagi Dokter di Fasyankes Primer — Diabetes Melitus Tipe 2

**Checklist reviewer**

- [ ] Nama, alias, tingkat SKDI, dan tingkat bahaya sudah tepat
- [ ] Demografi & faktor risiko sesuai epidemiologi Indonesia
- [ ] Probabilitas gejala masuk akal
- [ ] Rentang nilai lab & sensitivitas tes sesuai literatur
- [ ] Jawaban anamnesis & petunjuk realistis (bahasa awam)
- [ ] Temuan khas, catatan pembelajaran, dan cara membedakan akurat

---

## Tuberkulosis Paru

- **id**: `tb_paru` · **SKDI**: 4A · **bahaya**: tinggi · **sistem**: Pernapasan · **status**: `BELUM_DITINJAU_DOKTER`
- **Hari sakit saat datang**: 14–90
- **Demografi**: laki-laki 60%; usia 18–30 (bobot 4), 31–45 (bobot 4), 46–60 (bobot 3), 61–75 (bobot 2)
- **Pekerjaan berisiko** (bias 40%): Buruh pabrik, Pekerja proyek bangunan, Sopir truk, Pekerja tambang, Pedagang pasar, Pengemudi ojek online
- **Pemeriksaan ideal**: Timbangan & pita ukur, Stetoskop (auskultasi), Tes Cepat Molekuler (TCM) TB (Rp165.000)

> Infeksi Mycobacterium tuberculosis pada paru yang menular lewat percikan dahak. Gejala utama batuk ≥ 2 minggu (berdahak, kadang berdarah), disertai demam subfebris sore/malam, keringat malam tanpa aktivitas, nafsu makan dan berat badan turun, serta lemas. Faktor risiko: kontak serumah dengan penderita TB, hunian padat berventilasi buruk, DM, HIV, merokok, gizi kurang. Diagnosis bakteriologis dengan Tes Cepat Molekuler (TCM) atau BTA sputum; foto toraks mendukung. Indonesia termasuk negara dengan beban TB tertinggi di dunia.

**Trait laten** (aturan pertama yang cocok per id dipakai)

| Trait | Peluang | Kondisi | Keterangan |
|---|---|---|---|
| kontak_tb | 50% | — | Ada kontak serumah dengan penderita TB. |
| hunian_padat | 60% | — | Faktor risiko: hunian padat dengan ventilasi buruk. |
| perokok | 60% | laki-laki | Faktor risiko: merokok. |
| perokok | 5% | — | Faktor risiko: merokok. |
| dm_komorbid | 10% | — | Komorbid DM — meningkatkan risiko TB dan memperberat perjalanannya. |
| hemoptisis | 20% | — | Hemoptisis (batuk darah). |
| lesi_rontgen | 92% | — |  |
| kavitas | 35% | trait: lesi_rontgen | Foto toraks menunjukkan kavitas — biasanya sangat menular (BTA sering positif). |
| ronkhi_apeks | 60% | — |  |

**Gejala**

| Gejala | Peluang | Kondisi |
|---|---|---|
| Batuk | 100% | — |
| Berat badan turun | 70% | — |
| Keringat malam | 60% | — |
| Demam | 60% | — |
| Nafsu makan menurun | 70% | — |
| Lemas | 70% | — |
| Batuk darah (hemoptisis) | 100% | trait: hemoptisis |
| Sesak napas | 25% | — |
| Nyeri dada saat bernapas/batuk (pleuritik) | 20% | — |

Keluhan utama (prioritas): batuk; tambahan: lemas, berat_badan_turun, batuk_darah. Salah kaprah pasien: batuk biasa, masuk angin, kebanyakan rokok, asma.

**Temuan pemeriksaan abnormal** (parameter lain = normal)

| Alat · parameter | Kondisi | Peluang | Nilai |
|---|---|---|---|
| Termometer · Suhu aksila | gejala: demam | 100% | 37,6–38,3 °C |
| Timbangan & pita ukur · Indeks massa tubuh (IMT) | gejala: berat_badan_turun | 100% | 15,8–18,4 kg/m² |
| Tensimeter & tanda vital · Frekuensi napas | — | 30% | 21–24 ×/menit |
| Tensimeter & tanda vital · Nadi | — | 100% | 84–100 ×/menit |
| Stetoskop (auskultasi) · Paru | trait: ronkhi_apeks | 100% | Ronkhi basah kasar di apeks paru kanan / Ronkhi basah di lapang atas paru kiri / Suara napas bronkial dan ronkhi di apeks kanan |
| Senter (mata, pupil, tenggorok, lidah) · Konjungtiva | — | 30% | Anemis (pucat) |
| Darah lengkap + hitung jenis · LED | — | 80% | 40–90 mm/jam |
| Darah lengkap + hitung jenis · Hemoglobin | laki-laki | 40% | 10,5–12,8 g/dL |
| Darah lengkap + hitung jenis · Hemoglobin | perempuan | 40% | 9,8–11,8 g/dL |
| Darah lengkap + hitung jenis · Limfosit | — | 40% | 38–46 % |
| BTA sputum (mikroskopis) · Hasil BTA | trait: kavitas | 85% (sensitivitas) | Positif 2+ / Positif 3+ |
| BTA sputum (mikroskopis) · Hasil BTA | — | 50% (sensitivitas) | Positif 1+ / Scanty (1–9 BTA/100 lapang pandang) |
| Tes Cepat Molekuler (TCM) TB · Hasil TCM | — | 90% (sensitivitas) | MTB detected, Rif resistance not detected |
| Rontgen thorax (PA) · Pulmo | trait: kavitas | 100% | Infiltrat di lapangan atas paru kanan dengan kavitas |
| Rontgen thorax (PA) · Pulmo | trait: lesi_rontgen | 100% | Infiltrat dan bercak fibrotik di lapangan atas kedua paru / Infiltrat di lapangan atas paru kanan |
| Rontgen thorax (PA) · Kesan | trait: kavitas | 100% | TB paru aktif dengan kavitas |
| Rontgen thorax (PA) · Kesan | trait: lesi_rontgen | 100% | Gambaran TB paru aktif |
| Gula darah sewaktu (GDS) · Glukosa darah sewaktu | trait: dm_komorbid | 100% | 210–320 mg/dL |

**Petunjuk anamnesis** (jawaban bertanda petunjuk)

- _onset_: "Batuknya sudah {lamaSakit}, Dok, nggak sembuh-sembuh." → **Batuk ≥ 2 minggu**
- _karakter_: "Batuknya berdahak, Dok, kental. Kemarin malah ada darahnya." → **Batuk berdahak dengan hemoptisis**
- _pola_: "Siang lumayan, Dok. Malam batuknya lebih sering, terus keringetan sampai baju basah padahal nggak gerah." → **Keringat malam tanpa aktivitas**
- _pola_: "Sore-sore badan suka meriang, Dok, tapi nggak terlalu panas." → **Demam subfebris sore hari**
- _pemberat_peringan_: "Sudah minum obat batuk dari warung dua botol, Dok, nggak mempan." → **Tidak membaik dengan obat batuk biasa**
- _riwayat_penyakit_: "Saya kencing manis, Dok, tapi jarang kontrol." → **Diabetes melitus (meningkatkan risiko TB)**
- _riwayat_keluarga_: "Bapak mertua yang tinggal serumah dulu minum obat TBC, Dok, tapi berhenti di tengah jalan." → **Kontak serumah dengan penderita TB**
- _riwayat_keluarga_: "Teman sekamar di mes batuk-batuk lama juga, Dok." → **Kontak erat dengan orang yang batuk lama**
- _bepergian_lingkungan_: "Saya tinggal di kontrakan sempit, Dok, satu kamar berlima, jendelanya kecil." → **Hunian padat dengan ventilasi buruk**
- _kebiasaan_: "Merokok sebungkus sehari, Dok." → **Merokok**
- _kebiasaan_: "Makan seadanya, Dok, kadang sehari sekali." → **Asupan gizi kurang**

**Temuan khas (layar edukasi)**

- Batuk ≥ 2 minggu, berdahak, kadang berdarah
- Demam subfebris sore/malam, keringat malam tanpa aktivitas
- Nafsu makan dan berat badan turun, lemas
- Kontak serumah dengan penderita TB, hunian padat
- Ronkhi di apeks; foto toraks: infiltrat/kavitas di lapangan atas; LED meningkat
- TCM (Xpert MTB/RIF) atau BTA sputum positif

**Catatan pengembang**

- Sensitivitas BTA/TCM disederhanakan.
- TB ekstraparu dan TB resistan obat tidak dimodelkan.

**Rujukan**

- Kemenkes RI. Pedoman Nasional Pelayanan Kedokteran Tata Laksana Tuberkulosis
- Kemenkes RI. Panduan Praktik Klinis bagi Dokter di Fasyankes Primer — Tuberkulosis Paru
- WHO consolidated guidelines on tuberculosis: diagnosis

**Checklist reviewer**

- [ ] Nama, alias, tingkat SKDI, dan tingkat bahaya sudah tepat
- [ ] Demografi & faktor risiko sesuai epidemiologi Indonesia
- [ ] Probabilitas gejala masuk akal
- [ ] Rentang nilai lab & sensitivitas tes sesuai literatur
- [ ] Jawaban anamnesis & petunjuk realistis (bahasa awam)
- [ ] Temuan khas, catatan pembelajaran, dan cara membedakan akurat

---

## Pneumonia Komunitas

- **id**: `pneumonia` · **SKDI**: 4A · **bahaya**: tinggi · **sistem**: Pernapasan · **status**: `BELUM_DITINJAU_DOKTER`
- **Hari sakit saat datang**: 2–7
- **Demografi**: laki-laki 60%; usia 18–40 (bobot 2), 41–60 (bobot 3), 61–75 (bobot 4)
- **Pekerjaan berisiko** (bias 30%): Pensiunan, Pekerja proyek bangunan, Sopir truk, Petani
- **Pemeriksaan ideal**: Termometer, Tensimeter & tanda vital, Oksimeter nadi (SpO₂), Stetoskop (auskultasi), Rontgen thorax (PA) (Rp200.000)

> Infeksi akut parenkim paru yang didapat di masyarakat (tersering Streptococcus pneumoniae). Demam tinggi, menggigil, batuk berdahak purulen (kuning-hijau atau seperti karat), sesak napas, dan nyeri dada pleuritik. Pemeriksaan: takipnea, takikardia, ronkhi basah halus atau suara napas bronkial di daerah konsolidasi; saturasi O₂ dapat turun. Leukositosis dengan pergeseran ke kiri; foto toraks menunjukkan infiltrat/konsolidasi. Nilai derajat keparahan (mis. CURB-65) untuk menentukan perlunya rujuk/rawat inap.

**Trait laten** (aturan pertama yang cocok per id dipakai)

| Trait | Peluang | Kondisi | Keterangan |
|---|---|---|---|
| perokok | 50% | laki-laki | Faktor risiko: merokok. |
| lobus_kanan | 60% | — | Konsolidasi di lobus bawah paru kanan. |
| lobus_kiri | 100% | tanpa: lobus_kanan | Konsolidasi di lobus bawah paru kiri. |
| hipoksia | 45% | — | Hipoksemia (SpO₂ < 94%) — tanda pneumonia berat, pertimbangkan rujuk. |
| leukositosis | 80% | — | Leukositosis dengan pergeseran ke kiri (infeksi bakteri). |

**Gejala**

| Gejala | Peluang | Kondisi |
|---|---|---|
| Demam | 100% | — |
| Batuk | 100% | — |
| Sesak napas | 75% | — |
| Nyeri dada saat bernapas/batuk (pleuritik) | 50% | — |
| Menggigil | 60% | — |
| Lemas | 80% | — |
| Nafsu makan menurun | 60% | — |
| Nyeri kepala | 30% | — |
| Nyeri otot/sendi (mialgia/artralgia) | 30% | — |
| Mual/muntah | 15% | — |

Keluhan utama (prioritas): demam; tambahan: batuk, sesak_napas. Salah kaprah pasien: masuk angin, flu, tipes, bronkitis.

**Temuan pemeriksaan abnormal** (parameter lain = normal)

| Alat · parameter | Kondisi | Peluang | Nilai |
|---|---|---|---|
| Termometer · Suhu aksila | — | 100% | 38,5–40,0 °C |
| Tensimeter & tanda vital · Frekuensi napas | — | 100% | 24–30 ×/menit |
| Tensimeter & tanda vital · Nadi | — | 100% | 100–120 ×/menit |
| Oksimeter nadi (SpO₂) · Saturasi oksigen (SpO₂) | trait: hipoksia | 100% | 88–93 % |
| Oksimeter nadi (SpO₂) · Saturasi oksigen (SpO₂) | — | 100% | 94–96 % |
| Stetoskop (auskultasi) · Paru | trait: lobus_kanan | 90% | Ronkhi basah halus dan suara napas bronkial di basal paru kanan |
| Stetoskop (auskultasi) · Paru | trait: lobus_kiri | 90% | Ronkhi basah halus dan suara napas bronkial di basal paru kiri |
| Darah lengkap + hitung jenis · Leukosit | trait: leukositosis | 100% | 12.000–20.000 /µL |
| Darah lengkap + hitung jenis · Neutrofil batang | trait: leukositosis | 100% | 7–12 % |
| Darah lengkap + hitung jenis · Limfosit | trait: leukositosis | 100% | 8–17 % |
| Darah lengkap + hitung jenis · LED | — | 60% | 30–70 mm/jam |
| Rontgen thorax (PA) · Pulmo | trait: lobus_kanan | 100% | Konsolidasi di lobus bawah paru kanan dengan air bronchogram |
| Rontgen thorax (PA) · Pulmo | trait: lobus_kiri | 100% | Konsolidasi di lobus bawah paru kiri dengan air bronchogram |
| Rontgen thorax (PA) · Kesan | trait: lobus_kanan | 100% | Pneumonia lobus bawah kanan |
| Rontgen thorax (PA) · Kesan | trait: lobus_kiri | 100% | Pneumonia lobus bawah kiri |

**Petunjuk anamnesis** (jawaban bertanda petunjuk)

- _onset_: "Baru {hariTeks} hari, Dok. Mendadak demam tinggi pakai menggigil, terus batuk." → **Demam tinggi akut dengan menggigil dan batuk**
- _onset_: "Baru {hariTeks} hari, Dok. Demam tinggi, terus batuk." → **Demam tinggi akut disertai batuk**
- _lokasi_: "Dada kanan bawah sakit kalau tarik napas dalam atau batuk, Dok." → **Nyeri dada pleuritik**
- _lokasi_: "Dada kiri bawah sakit kalau tarik napas dalam atau batuk, Dok." → **Nyeri dada pleuritik**
- _karakter_: "Batuknya berdahak, Dok, warnanya kuning kehijauan, kadang kayak karat." → **Dahak purulen / berwarna karat**
- _pola_: "Makin hari makin sesak, Dok, napasnya pendek-pendek." → **Sesak napas progresif**
- _riwayat_penyakit_: "Seminggu sebelumnya sempat pilek-pilek biasa, Dok." → **Didahului infeksi saluran napas atas**
- _kebiasaan_: "Merokok, Dok, sehari sebungkus." → **Merokok (faktor risiko)**

**Temuan khas (layar edukasi)**

- Demam tinggi akut, menggigil, batuk berdahak purulen
- Sesak napas dan nyeri dada pleuritik
- Takipnea, takikardia, SpO₂ dapat menurun
- Ronkhi basah halus / suara napas bronkial lokal
- Leukositosis dengan pergeseran ke kiri; foto toraks: konsolidasi/infiltrat

**Catatan pengembang**

- Level SKDI pneumonia komunitas mohon diverifikasi.
- Pneumonia berat/sepsis tidak dimodelkan terpisah.

**Rujukan**

- PDPI. Pneumonia Komuniti: Pedoman Diagnosis dan Penatalaksanaan di Indonesia (2022)
- Kemenkes RI. Panduan Praktik Klinis bagi Dokter di Fasyankes Primer — Pneumonia

**Checklist reviewer**

- [ ] Nama, alias, tingkat SKDI, dan tingkat bahaya sudah tepat
- [ ] Demografi & faktor risiko sesuai epidemiologi Indonesia
- [ ] Probabilitas gejala masuk akal
- [ ] Rentang nilai lab & sensitivitas tes sesuai literatur
- [ ] Jawaban anamnesis & petunjuk realistis (bahasa awam)
- [ ] Temuan khas, catatan pembelajaran, dan cara membedakan akurat

---

## Asma Bronkial (Serangan Ringan–Sedang)

- **id**: `asma` · **SKDI**: 4A · **bahaya**: sedang · **sistem**: Pernapasan · **status**: `BELUM_DITINJAU_DOKTER`
- **Hari sakit saat datang**: 1–3
- **Demografi**: laki-laki 45%; usia 18–30 (bobot 5), 31–45 (bobot 3), 46–60 (bobot 2), 61–75 (bobot 1)
- **Pekerjaan berisiko** (bias 30%): Buruh pabrik, Pengemudi ojek online, Mahasiswa, Pekerja proyek bangunan
- **Pemeriksaan ideal**: Tensimeter & tanda vital, Oksimeter nadi (SpO₂), Stetoskop (auskultasi), Peak flow meter (APE) (Rp35.000)

> Penyakit inflamasi kronik saluran napas dengan hiperreaktivitas bronkus. Episode berulang sesak napas, mengi, dada terasa sempit, dan batuk (terutama malam/dini hari) yang dipicu alergen, debu, asap, udara dingin, infeksi virus, atau olahraga, dan membaik spontan atau dengan bronkodilator. Sering ada riwayat atopi (rinitis alergi, eksim) dan riwayat keluarga. Di luar serangan pemeriksaan bisa normal; saat serangan arus puncak ekspirasi (APE) menurun.

**Trait laten** (aturan pertama yang cocok per id dipakai)

| Trait | Peluang | Kondisi | Keterangan |
|---|---|---|---|
| atopi | 60% | — | Riwayat atopi (rinitis alergi/eksim). |
| riwayat_keluarga_asma | 50% | — | Riwayat keluarga asma. |
| pemicu_debu | 45% | — | Pemicu serangan: debu/asap. |
| pemicu_dingin | 50% | tanpa: pemicu_debu | Pemicu serangan: udara dingin/kehujanan. |
| serangan_sedang | 50% | — | Serangan derajat sedang (APE 50–69% prediksi). |
| eosinofilia | 60% | trait: atopi | Eosinofilia ringan (latar belakang alergi). |
| hiperinflasi | 25% | — |  |

**Gejala**

| Gejala | Peluang | Kondisi |
|---|---|---|
| Sesak napas | 100% | — |
| Mengi (wheezing) | 85% | — |
| Batuk | 75% | — |
| Lemas | 20% | — |

Keluhan utama (prioritas): sesak_napas; tambahan: batuk, mengi. Salah kaprah pasien: masuk angin, jantung, kecapekan, paru-paru basah.

**Temuan pemeriksaan abnormal** (parameter lain = normal)

| Alat · parameter | Kondisi | Peluang | Nilai |
|---|---|---|---|
| Tensimeter & tanda vital · Frekuensi napas | — | 100% | 22–28 ×/menit |
| Tensimeter & tanda vital · Nadi | — | 100% | 96–115 ×/menit |
| Oksimeter nadi (SpO₂) · Saturasi oksigen (SpO₂) | trait: serangan_sedang | 100% | 92–95 % |
| Oksimeter nadi (SpO₂) · Saturasi oksigen (SpO₂) | — | 100% | 95–97 % |
| Stetoskop (auskultasi) · Paru | — | 90% | Wheezing ekspirasi di kedua lapang paru, ekspirasi memanjang |
| Peak flow meter (APE) · APE (% nilai prediksi) | trait: serangan_sedang | 95% (sensitivitas) | 50–69 % |
| Peak flow meter (APE) · APE (% nilai prediksi) | — | 90% (sensitivitas) | 65–79 % |
| Darah lengkap + hitung jenis · Eosinofil | trait: eosinofilia | 100% | 5–9 % |
| Rontgen thorax (PA) · Pulmo | trait: hiperinflasi | 100% | Hiperinflasi ringan, tidak tampak infiltrat |
| Rontgen thorax (PA) · Kesan | trait: hiperinflasi | 100% | Hiperinflasi paru ringan |

**Petunjuk anamnesis** (jawaban bertanda petunjuk)

- _onset_: "Kambuh sejak {hariTeks} hari ini, Dok. Sebenarnya dari kecil sudah sering begini." → **Sesak berulang sejak masa kanak-kanak**
- _lokasi_: "Dada rasanya sempit, Dok, kayak diikat." → **Dada terasa sempit/berat**
- _karakter_: "Napas saya bunyi ngik-ngik, Dok, susah buang napas." → **Mengi dengan ekspirasi memanjang**
- _pola_: "Paling parah malam sampai subuh, Dok. Batuk-batuk sampai kebangun." → **Memberat pada malam/dini hari**
- _pola_: "Paling parah malam sampai subuh, Dok." → **Memberat pada malam/dini hari**
- _pemberat_peringan_: "Kambuhnya kalau kena debu atau asap, Dok. Kemarin habis bersih-bersih gudang." → **Dipicu debu/asap**
- _pemberat_peringan_: "Kalau udara dingin atau habis kehujanan, langsung kambuh, Dok." → **Dipicu udara dingin**
- _pemberat_peringan_: "Kalau capek atau habis olahraga suka kambuh, Dok." → **Dipicu aktivitas fisik**
- _riwayat_penyakit_: "Saya alergi debu, Dok, sering bersin-bersin pagi. Dulu waktu kecil juga eksim." → **Riwayat atopi (rinitis alergi, eksim)**
- _riwayat_penyakit_: "Dari kecil memang sering sesak begini, Dok." → **Riwayat serangan sesak berulang**
- _riwayat_obat_: "Biasanya pakai obat semprot, Dok, tapi habis. Kalau pakai, sesaknya cepat hilang." → **Membaik dengan bronkodilator (inhaler)**
- _riwayat_keluarga_: "Ibu saya juga asma, Dok." → **Riwayat keluarga asma**
- _bepergian_lingkungan_: "Di tempat kerja banyak debu, Dok, apalagi kalau angin kencang." → **Paparan debu di lingkungan kerja**
- _kebiasaan_: "Saya nggak merokok, Dok, tapi orang rumah ada yang merokok." → **Paparan asap rokok**

**Temuan khas (layar edukasi)**

- Sesak napas, mengi, dada sempit, batuk — episodik dan berulang
- Memberat malam/dini hari; dipicu debu, asap, udara dingin, infeksi, atau aktivitas
- Riwayat atopi dan riwayat keluarga asma
- Wheezing ekspirasi difus, ekspirasi memanjang, takipnea
- APE < 80% prediksi; membaik dengan bronkodilator

**Catatan pengembang**

- Serangan berat / status asmatikus tidak dimodelkan.

**Rujukan**

- PDPI. Asma: Pedoman Diagnosis dan Penatalaksanaan di Indonesia
- Kemenkes RI. Panduan Praktik Klinis bagi Dokter di Fasyankes Primer — Asma Bronkial
- Global Initiative for Asthma (GINA) report

**Checklist reviewer**

- [ ] Nama, alias, tingkat SKDI, dan tingkat bahaya sudah tepat
- [ ] Demografi & faktor risiko sesuai epidemiologi Indonesia
- [ ] Probabilitas gejala masuk akal
- [ ] Rentang nilai lab & sensitivitas tes sesuai literatur
- [ ] Jawaban anamnesis & petunjuk realistis (bahasa awam)
- [ ] Temuan khas, catatan pembelajaran, dan cara membedakan akurat

---
