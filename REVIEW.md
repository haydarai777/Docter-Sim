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
| Malaria | 4A | tinggi | `BELUM_DITINJAU_DOKTER` |
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

| Alat | Kategori | Tujuan | Harga | Parameter (rujukan) | Positif palsu |
|---|---|---|---|---|---|
| Tanda vital lengkap | fisik | — | Rp0 | Tekanan darah sistolik: 90–139 mmHg<br>Tekanan darah diastolik: 60–89 mmHg<br>Nadi: 60–100 ×/menit<br>Frekuensi napas: 12–20 ×/menit<br>Suhu aksila: 36,5–37,5 °C<br>Saturasi oksigen (SpO₂): 95–100 % | — |
| Keadaan umum | fisik | — | Rp0 | Kesadaran: Compos mentis (GCS 15)<br>Kesan sakit: Tampak sakit ringan<br>Status hidrasi: Mukosa bibir lembap, turgor kulit baik<br>Status gizi (kesan): Kesan gizi cukup | — |
| Antropometri (timbangan & pita ukur) | fisik | — | Rp0 | Tinggi badan: — cm<br>Indeks massa tubuh (IMT): 18,5–22,9 (kriteria Asia-Pasifik) kg/m²<br>Berat badan: — kg<br>Lingkar perut: < 90 (L) / < 80 (P) cm | — |
| Kepala & leher | fisik | — | Rp0 | Konjungtiva: Tidak anemis<br>Sklera: Tidak ikterik<br>Pupil: Isokor, refleks cahaya +/+<br>Faring & tonsil: Faring tidak hiperemis, tonsil T1–T1<br>Lidah: Bersih, tidak ada kelainan<br>Kelenjar getah bening leher: Tidak teraba pembesaran<br>Tekanan vena jugularis (JVP): Tidak meningkat (5 − 2 cmH₂O) | — |
| Thorax — paru | fisik | — | Rp0 | Inspeksi: Gerak dada simetris, tidak ada retraksi<br>Palpasi: Fremitus taktil simetris kanan dan kiri<br>Perkusi: Sonor di kedua lapang paru<br>Auskultasi: Suara napas vesikuler, ronkhi −/−, wheezing −/− | — |
| Thorax — jantung | fisik | — | Rp0 | Inspeksi & palpasi: Iktus kordis teraba di ICS V linea midklavikula kiri<br>Perkusi: Batas jantung dalam batas normal<br>Auskultasi: Bunyi jantung I–II reguler, murmur (−), gallop (−) | — |
| Abdomen | fisik | — | Rp0 | Inspeksi: Datar, tidak tampak distensi<br>Bising usus: Bising usus normal<br>Palpasi — nyeri tekan: Supel, tidak ada nyeri tekan<br>Hepar: Tidak teraba<br>Lien (limpa): Tidak teraba<br>Perkusi: Timpani, shifting dullness (−)<br>Nyeri ketok CVA: Negatif kanan dan kiri<br>Tanda khusus: Murphy (−), McBurney (−), defans muskular (−) | — |
| Ekstremitas & kulit | fisik | — | Rp0 | Akral: Hangat, kering<br>Capillary refill time (CRT): < 2 detik<br>Edema: Tidak ada edema<br>Kulit: Tidak tampak petekie, ruam, atau luka | — |
| Pemeriksaan kaki diabetik | fisik | — | Rp0 | Inspeksi kaki: Kulit utuh, tidak ada luka atau kalus<br>Monofilamen 10 g: Sensibilitas normal (10/10 titik)<br>Pulsasi a. dorsalis pedis & tibialis posterior: Teraba kuat, simetris | — |
| Neurologis singkat | fisik | — | Rp0 | Rangsang meningeal: Kaku kuduk (−)<br>Motorik: Kekuatan 5 di keempat ekstremitas<br>Sensorik: Sensibilitas raba normal | — |
| Uji tourniquet (Rumple–Leede) | fisik | — | Rp0 | Hasil: Positif jika ≥ 10 petekie per 2,5 × 2,5 cm | Hasil 8% |
| Darah lengkap + hitung jenis | lab | identifikasi, komplikasi — Infeksi/peradangan (leukosit, hitung jenis), anemia (Hb, MCV), trombositopenia, dan hemokonsentrasi (hematokrit). | Rp70.000 | Hemoglobin: 13,0–17,0 g/dL<br>MCV: 80–100 fL<br>Hematokrit: 40–50 %<br>Leukosit: 4.000–10.000 /µL<br>Trombosit: 150.000–400.000 /µL<br>LED: 0–15 mm/jam<br>Basofil: 0–1 %<br>Eosinofil: 1–3 %<br>Neutrofil batang: 2–6 %<br>Neutrofil segmen: 50–70 %<br>Limfosit: 20–40 %<br>Monosit: 2–8 % | — |
| Tes cepat NS1 dengue | lab | identifikasi — Antigen dengue untuk diagnosis dini (hari 1–5). Negatif setelah hari ke-5 TIDAK menyingkirkan dengue. | Rp150.000 | Antigen NS1 dengue: Negatif | Antigen NS1 dengue 2% |
| Serologi dengue IgM/IgG | lab | identifikasi — Antibodi dengue: IgM positif mulai hari ke-4–5; IgG menandakan infeksi sekunder/lampau. | Rp175.000 | IgM anti-dengue: Negatif<br>IgG anti-dengue: Negatif | — |
| Tes cepat (RDT) malaria | lab | identifikasi — Antigen Plasmodium (tes cepat). Positif mendukung malaria; konfirmasi spesies dengan mikroskopis. | Rp60.000 | P. falciparum (HRP-2): Negatif<br>Pan-malaria (pLDH): Negatif | P. falciparum (HRP-2) 1%<br>Pan-malaria (pLDH) 1% |
| Apusan darah tebal–tipis (malaria) | lab | identifikasi, komplikasi — Baku emas malaria: spesies dan kepadatan parasit (hiperparasitemia = tanda malaria berat). | Rp50.000 | Hasil: Tidak ditemukan parasit malaria | Hasil 1% |
| Tes Widal | lab | identifikasi — Titer antibodi Salmonella. Murah tetapi spesifisitas rendah di daerah endemis; titer tunggal kurang dapat diandalkan. | Rp40.000 | S. typhi O: ≤ 1/80<br>S. typhi H: ≤ 1/80 | S. typhi O 12%<br>S. typhi H 10% |
| Tubex TF (IgM anti-Salmonella) | lab | identifikasi — IgM anti-Salmonella O9 — lebih spesifik daripada Widal untuk demam tifoid. | Rp150.000 | Skor Tubex TF: ≤ 2 negatif · 3 meragukan · ≥ 4 positif | Skor Tubex TF 5% |
| Gula darah sewaktu (GDS) | lab | identifikasi, skrining — Hiperglikemia/DM; juga skrining komorbid pada pasien berisiko. | Rp25.000 | Glukosa darah sewaktu: < 140 · ≥ 200 + gejala klasik = DM mg/dL | — |
| HbA1c | lab | identifikasi, komplikasi — Rerata glukosa 2–3 bulan: diagnosis DM dan menilai kendali gula. | Rp150.000 | HbA1c: < 5,7 normal · ≥ 6,5 = DM % | — |
| Urinalisis (urin lengkap) | lab | identifikasi, komplikasi — Kelainan urin: infeksi (leukosit esterase, nitrit, bakteri), hematuria, glukosuria, dan proteinuria (tanda kerusakan ginjal). | Rp40.000 | Warna & kejernihan: Kuning jernih<br>Berat jenis: 1,005–1,030<br>pH: 4,5–8,0<br>Protein: Negatif<br>Glukosa: Negatif<br>Keton: Negatif<br>Darah (dipstik): Negatif<br>Leukosit esterase: Negatif<br>Nitrit: Negatif<br>Sedimen leukosit: 0–5 /LPB<br>Sedimen eritrosit: 0–2 /LPB<br>Bakteri: Negatif<br>Kristal: Negatif | Darah (dipstik) 4%<br>Leukosit esterase 5%<br>Nitrit 2%<br>Sedimen leukosit 4%<br>Bakteri 4%<br>Kristal 5% |
| Fungsi hati | lab | fungsi_organ, komplikasi — Fungsi & kerusakan hati (SGOT, SGPT, bilirubin). | Rp80.000 | SGOT (AST): 5–40 U/L<br>SGPT (ALT): 5–41 U/L<br>Bilirubin total: 0,2–1,2 mg/dL | — |
| Fungsi ginjal | lab | fungsi_organ, komplikasi — Fungsi ginjal (ureum, kreatinin, eGFR). Fungsi ginjal NORMAL tidak menyingkirkan batu atau infeksi saluran kemih. | Rp70.000 | Ureum: 10–50 mg/dL<br>Kreatinin: 0,7–1,3 mg/dL<br>eGFR (CKD-EPI 2021): ≥ 90 normal · 60–89 menurun ringan · < 60 penurunan fungsi ginjal mL/menit/1,73 m² | — |
| Profil lipid | lab | skrining — Faktor risiko kardiovaskular (kolesterol, LDL, HDL, trigliserida). | Rp100.000 | Kolesterol total: < 200 mg/dL<br>Kolesterol LDL: < 130 mg/dL<br>Kolesterol HDL: 40–100 mg/dL<br>Trigliserida: < 150 mg/dL | — |
| BTA sputum (mikroskopis) | lab | identifikasi — Mikroskopis BTA dahak. Murah; sensitivitas sedang — negatif tidak menyingkirkan TB. | Rp50.000 | Hasil BTA: Negatif | Hasil BTA 1% |
| Tes Cepat Molekuler (TCM) TB | lab | identifikasi — Tes cepat molekuler M. tuberculosis + resistansi rifampisin. Lebih sensitif dari BTA. | Rp150.000 | Hasil TCM: MTB not detected | — |
| Rontgen thorax (PA) | pencitraan | struktur, komplikasi — Infiltrat/konsolidasi, kavitas, efusi pleura, hiperinflasi, kardiomegali. | Rp175.000 | Cor: Tidak membesar (CTR < 50%)<br>Pulmo: Corakan bronkovaskular normal, tidak tampak infiltrat<br>Sinus & diafragma: Sinus kostofrenikus tajam, diafragma licin<br>Tulang: Tulang-tulang intak<br>Kesan: Cor dan pulmo dalam batas normal | — |
| USG abdomen (termasuk ginjal) | pencitraan | struktur, komplikasi — Batu, sumbatan (hidronefrosis), massa, ukuran organ, dan cairan bebas. Batu ureter distal kadang sulit terlihat. | Rp300.000 | Hepar: Ukuran dan ekogenisitas normal, tidak tampak lesi<br>Kandung empedu: Dinding tidak menebal, tidak tampak batu<br>Lien: Ukuran normal<br>Ginjal kanan & kiri: Ukuran normal, tidak tampak batu maupun hidronefrosis<br>Vesika urinaria: Dinding licin, tidak tampak batu<br>Cairan bebas: Tidak tampak<br>Kesan: Tidak tampak kelainan pada organ intraabdomen yang terperiksa | — |
| Foto polos abdomen (BNO/KUB) | pencitraan | struktur — Batu radioopak (± 75–90% batu saluran kemih). Batu radiolusen (mis. asam urat) tidak tampak, jadi BNO normal tidak menyingkirkan batu. | Rp120.000 | Bayangan batu: Tidak tampak bayangan radioopak sepanjang traktus urinarius<br>Kesan: Tidak tampak kelainan | — |
| CT-scan abdomen non-kontras (rujukan) | pencitraan | struktur, komplikasi — Baku emas batu saluran kemih (sensitivitas > 95%): ukuran & letak batu, sumbatan, dan penyebab lain seperti massa. | Rp1.200.000 | Ginjal & ureter: Tidak tampak batu, sumbatan, maupun massa<br>Kesan: Tidak tampak kelainan pada traktus urinarius | — |
| Elektrokardiografi (EKG) 12 sadapan | lainnya | identifikasi, komplikasi — Iskemia, aritmia, dan hipertrofi ventrikel kiri (kerusakan organ target hipertensi). EKG istirahat normal tidak menyingkirkan angina. | Rp75.000 | Irama: Sinus ritme<br>Frekuensi: 60–100 ×/menit<br>Aksis: Normal<br>Gelombang P & interval PR: Normal<br>Kompleks QRS: Normal<br>Segmen ST: Isoelektrik<br>Gelombang T: Normal<br>Kesan: EKG dalam batas normal | — |
| Spirometri sederhana (APE & reversibilitas) | lainnya | fungsi_organ, identifikasi — Obstruksi saluran napas dan reversibilitasnya (kenaikan ≥ 12–20% mendukung asma). Bukan tanda vital. | Rp25.000 | APE (% nilai prediksi): ≥ 80% %<br>Reversibilitas setelah bronkodilator: Tidak bermakna (kenaikan < 12%) | — |

## Komorbiditas (dapat menyertai penyakit utama)

| Kondisi | Peluang | Syarat | Pasien tahu | Gejala | Temuan | Dideteksi dengan |
|---|---|---|---|---|---|---|
| Hipertensi | 30% | usia 40–… | 55% | — | Tanda vital lengkap · td_sistolik: 142–168 mmHg<br>Tanda vital lengkap · td_diastolik: 90–102 mmHg | Tanda vital lengkap |
| Diabetes Melitus Tipe 2 | 12% | usia 40–…; bukan pada dm_tipe2 | 50% | sering_kencing 40%, haus 35% | Gula darah sewaktu (GDS) · gds: 210–330 mg/dL<br>HbA1c · hba1c: 7,2–10,0 %<br>Urinalisis (urin lengkap) · glukosa: +1 / +2 | Gula darah sewaktu (GDS); HbA1c; Urinalisis (urin lengkap) |
| Obesitas | 22% | — | 0% | — | Antropometri (timbangan & pita ukur) · imt: 25,5–33,0 kg/m²<br>Antropometri (timbangan & pita ukur) · lingkar_perut: 92–110 cm<br>Antropometri (timbangan & pita ukur) · lingkar_perut: 82–100 cm<br>Keadaan umum · gizi: Kesan gizi lebih (obesitas) | Antropometri (timbangan & pita ukur); Keadaan umum |
| Anemia Defisiensi Besi | 18% | usia …–50; perempuan; bukan pada malaria | 30% | lemas 60%, nyeri_kepala 25% | Darah lengkap + hitung jenis · hb: 9,0–11,4 g/dL<br>Darah lengkap + hitung jenis · mcv: 63–77 fL<br>Darah lengkap + hitung jenis · hematokrit: 28–35 %<br>Kepala & leher · konjungtiva: Anemis (pucat) | Darah lengkap + hitung jenis; Kepala & leher |
| Dislipidemia | 15% | usia 35–… | 30% | — | Profil lipid · kolesterol: 215–280 mg/dL<br>Profil lipid · ldl: 140–200 mg/dL<br>Profil lipid · tg: 155–260 mg/dL | Profil lipid |

## Temuan insidental

| Kondisi | Peluang | Syarat | Temuan | Catatan |
|---|---|---|---|---|
| Batu Empedu Asimtomatik | 7% | usia 35–… | USG abdomen (termasuk ginjal) · kandung_empedu: Tampak batu multipel di kandung empedu (± 8 mm), dinding tidak menebal<br>USG abdomen (termasuk ginjal) · kesan: Kolelitiasis (batu kandung empedu) tanpa tanda radang | Temuan insidental yang tidak menjelaskan keluhan saat ini. Batu empedu tanpa gejala umumnya cukup edukasi dan observasi; rujuk bila timbul kolik bilier atau komplikasi. |
| Perlemakan Hati (Fatty Liver) | 10% | usia 30–… | USG abdomen (termasuk ginjal) · hepar: Ukuran normal, ekogenisitas meningkat (fatty liver)<br>USG abdomen (termasuk ginjal) · kesan: Fatty liver (perlemakan hati) | Sering berkaitan dengan obesitas, DM, dan dislipidemia. Bukan penyebab keluhan akut; perlu modifikasi gaya hidup dan evaluasi faktor risiko metabolik. |
| Kista Ginjal Sederhana | 5% | usia 40–… | USG abdomen (termasuk ginjal) · ginjal: Kista sederhana ± 1,5 cm di kutub atas ginjal kiri; tidak tampak batu maupun hidronefrosis<br>USG abdomen (termasuk ginjal) · kesan: Kista ginjal sederhana | Kista ginjal sederhana sering ditemukan pada usia > 40 tahun dan umumnya tidak berbahaya; tidak memerlukan tindakan bila memenuhi kriteria kista sederhana. |

## Kondisi khusus diagnosis banding (tidak muncul sebagai pasien)

| Kondisi | Sistem | Bahaya | Ringkasan |
|---|---|---|---|
| Leptospirosis | Infeksi tropis | tinggi | Demam akut setelah paparan banjir/air tercemar urin tikus; nyeri betis, injeksi konjungtiva, ikterik, gangguan ginjal. |
| Chikungunya | Infeksi tropis | rendah | Demam akut dengan nyeri sendi hebat (poliartralgia) dan ruam; trombositopenia jarang berat. |
| Influenza | Pernapasan | rendah | Demam akut, nyeri otot, batuk, pilek; sembuh sendiri dalam 1 minggu. |
| ISPA / Common cold | Pernapasan | rendah | Infeksi saluran napas atas ringan: pilek, nyeri tenggorok, batuk; demam ringan. |
| COVID-19 | Pernapasan | sedang | Infeksi SARS-CoV-2: demam, batuk, anosmia; dapat berat pada lansia/komorbid. |
| Bronkitis Akut | Pernapasan | rendah | Batuk akut (berdahak) pasca-ISPA tanpa konsolidasi pada pemeriksaan. |
| PPOK | Pernapasan | sedang | Sesak & batuk kronik progresif pada perokok lama; obstruksi tidak reversibel penuh. |
| Kanker Paru | Pernapasan | kritis | Batuk lama, hemoptisis, BB turun pada perokok usia lanjut; massa pada foto toraks. |
| Gagal Jantung | Jantung & pembuluh darah | tinggi | Sesak saat aktivitas/berbaring, edema tungkai, JVP meningkat, ronkhi basal, kardiomegali. |
| Sindrom Koroner Akut | Jantung & pembuluh darah | kritis | Nyeri dada saat istirahat > 20 menit, makin berat/sering; perubahan EKG; gawat darurat. |
| Nyeri Dada Muskuloskeletal | Otot & sendi | rendah | Nyeri dada terlokalisasi, bertambah saat ditekan atau bergerak. |
| Tukak Peptik | Pencernaan | sedang | Nyeri ulu hati terkait makan; komplikasi perdarahan (melena) atau perforasi. |
| Keganasan Lambung | Pencernaan | kritis | Dispepsia baru pada usia > 55 tahun dengan BB turun, anemia, muntah, atau disfagia (tanda alarm). |
| Kolik Bilier / Kolesistitis | Pencernaan | sedang | Nyeri kuadran kanan atas setelah makan berlemak, Murphy sign (+), kadang demam. |
| Pankreatitis Akut | Pencernaan | tinggi | Nyeri epigastrium hebat menjalar ke punggung, muntah; amilase/lipase meningkat. |
| Apendisitis Akut | Pencernaan | tinggi | Nyeri periumbilikal berpindah ke kanan bawah, demam, McBurney (+). |
| Gastroenteritis Akut | Pencernaan | sedang | Diare & muntah akut; risiko dehidrasi. |
| Hepatitis A | Pencernaan | sedang | Demam, mual, ikterik, urin gelap; transaminase sangat tinggi. |
| Pielonefritis Akut | Saluran kemih | tinggi | Demam tinggi, menggigil, nyeri pinggang, nyeri ketok CVA, leukosituria. |
| Massa / Tumor Saluran Kemih | Saluran kemih | kritis | Hematuria tanpa nyeri, sumbatan (hidronefrosis) tanpa batu yang jelas; pikirkan pada usia lanjut/perokok. |
| Uretritis (Infeksi Menular Seksual) | Saluran kemih | sedang | Disuria dengan duh uretra; riwayat hubungan seksual berisiko. |
| Kehamilan Ektopik Terganggu | Kebidanan | kritis | Perempuan usia subur, terlambat haid, nyeri perut bawah mendadak, syok; tes kehamilan positif. |
| Sepsis | Infeksi tropis | kritis | Infeksi dengan disfungsi organ: hipotensi, takikardia, takipnea, penurunan kesadaran. |

## Topik anamnesis

| Topik | Rubrik | Inti | Bobot | Mengapa penting |
|---|---|---|---|---|
| Keluhan utama | Keluhan utama | — | 1 | Keluhan utama adalah titik awal; dengarkan dulu dengan kata-kata pasien sendiri. |
| Onset | Keluhan utama | Ya | 1 | Onset & lama sakit membedakan proses akut (infeksi, kolik) dari kronik (TB, DM, GERD). |
| Lokasi & penjalaran | Keluhan utama | Ya | 1 | Lokasi dan penjalaran mengarahkan ke organ sumber (retrosternal → jantung/esofagus; pinggang ke lipat paha → ureter). |
| Sifat keluhan | Keluhan utama | Ya | 1 | Kualitas keluhan (terbakar, ditekan, kolik, perih) adalah pembeda utama. |
| Durasi tiap episode | Keluhan utama | Ya | 1 | Lama tiap episode (mis. angina < 15 menit, kolik hilang-timbul) membantu membedakan penyebab. |
| Keparahan | Keluhan utama | Ya | 1 | Keparahan & dampak pada aktivitas menunjukkan derajat penyakit dan kebutuhan rujukan. |
| Pola & waktu | Keluhan utama | Ya | 1 | Pola waktu (sore–malam, berkala, malam/dini hari) adalah petunjuk klasik. |
| Perjalanan penyakit | Keluhan utama | Ya | 1 | Perjalanan penyakit (memburuk/membaik/makin sering) menilai progresivitas dan kemungkinan komplikasi. |
| Pemberat & peringan | Keluhan utama | Ya | 1 | Faktor pemberat/peringan (aktivitas vs makan vs posisi) memisahkan angina, GERD, dispepsia, dan kolik. |
| Keluhan lain | Gejala penyerta | Ya | 2 | Gejala penyerta sering tidak disebut spontan; banyak petunjuk penting tersembunyi di sini. |
| Episode sebelumnya | Riwayat | Ya | 1.5 | Episode serupa sebelumnya menandakan penyakit berulang (asma, batu, ISK berulang, malaria relaps) atau riwayat yang relevan. |
| Riwayat penyakit dahulu | Riwayat | Ya | 1 | Penyakit lain (hipertensi, DM, dll.) mengubah risiko, diagnosis banding, dan tata laksana. |
| Riwayat obat | Riwayat | Ya | 1 | Obat yang sudah diminum (OAINS, antibiotik, obat rutin) memengaruhi gejala, hasil tes, dan pilihan terapi. |
| Alergi | Riwayat | Ya | 1 | Riwayat alergi wajib ditanyakan sebelum memberi obat apa pun. |
| Riwayat keluarga | Riwayat | Ya | 1 | Riwayat keluarga & kontak serumah menunjukkan risiko genetik (DM, PJK, asma) atau penularan (TB, dengue). |
| Bepergian, pekerjaan & lingkungan | Sosial & lingkungan | Ya | 1 | Riwayat bepergian, pekerjaan, dan lingkungan mengarahkan ke penyakit endemis atau paparan tertentu. |
| Kebiasaan & gaya hidup | Sosial & lingkungan | Ya | 1 | Gaya hidup (rokok, pola makan, aktivitas, minum) adalah faktor risiko dan pemicu banyak penyakit. |

## Penampilan pasien 3D: isyarat klinis yang TERLIHAT

Yang terlihat pada pasien (postur, perilaku, warna kulit) hanya muncul bila gejala/temuannya ada pada kasus.
Gejala yang tidak tercantum di sini hanya bisa diketahui lewat anamnesis atau pemeriksaan.

| Sumber | Syarat | Isyarat yang terlihat | Kekuatan |
|---|---|---|---|
| Gejala | Batuk | sesekali batuk | 60% |
| Gejala | Batuk darah (hemoptisis) | sesekali batuk | 70% |
| Gejala | Sesak napas | napas tampak cepat/berat | 30% |
| Gejala | Mengi (wheezing) | napas tampak cepat/berat | 30% |
| Gejala | Lemas | tampak lemas, postur kurang tegap | 35% |
| Gejala | Berkeringat banyak | berkeringat | 60% |
| Gejala | Keringat dingin | berkeringat | 30% |
| Gejala | Nyeri otot/sendi (mialgia/artralgia) | bergerak pelan dan kaku | 50% |
| Gejala | Nyeri pinggang | sesekali memegang pinggang | 90% |
| Gejala | Nyeri perut | sesekali memegang perut | 60% |
| Gejala | Nyeri/perih ulu hati (epigastrium) | sesekali memegang ulu hati | 45% |
| Gejala | Nyeri perut bawah (suprapubik) | sesekali memegang perut bawah | 40% |
| Gejala | Nyeri dada saat bernapas/batuk (pleuritik) | sesekali memegang dada | 35% |
| Gejala | Nyeri kepala | sesekali memegang kepala | 30% |
| Gejala | Nyeri belakang bola mata (retro-orbital) | sesekali memegang mata | 25% |
| Gejala | Rasa terbakar di dada (heartburn) | sesekali memegang dada | 20% |
| Gejala | Mual/muntah | sesekali memegang mulut | 15% |
| Temuan: Tanda vital lengkap · Suhu aksila | ≥ 38 | wajah kemerahan seperti demam | 70% |
| Temuan: Tanda vital lengkap · Frekuensi napas | ≥ 25 | napas tampak cepat/berat | 100% |
| Temuan: Tanda vital lengkap · Frekuensi napas | ≥ 21 | napas tampak cepat/berat | 60% |
| Temuan: Tanda vital lengkap · Saturasi oksigen (SpO₂) | ≤ 93 | napas tampak cepat/berat | 100% |
| Temuan: Keadaan umum · Kesan sakit | hasil abnormal memuat "membungkuk" | duduk membungkuk bertumpu pada tangan | 100% |
| Temuan: Keadaan umum · Kesan sakit | hasil abnormal memuat "sesak berat" | napas tampak cepat/berat | 100% |
| Temuan: Keadaan umum · Kesan sakit | hasil abnormal memuat "cuping hidung" | napas tampak cepat/berat | 100% |
| Temuan: Keadaan umum · Kesan sakit | hasil abnormal memuat "tampak sesak" | napas tampak cepat/berat | 60% |
| Temuan: Keadaan umum · Kesan sakit | hasil abnormal memuat "napas agak cepat" | napas tampak cepat/berat | 50% |
| Temuan: Keadaan umum · Kesan sakit | hasil abnormal memuat "menggigil" | menggigil | 100% |
| Temuan: Keadaan umum · Kesan sakit | hasil abnormal memuat "gelisah" | gelisah, sering berganti posisi | 100% |
| Temuan: Keadaan umum · Kesan sakit | hasil abnormal memuat "enggan bergerak" | duduk kaku menahan nyeri, enggan bergerak | 100% |
| Temuan: Keadaan umum · Kesan sakit | hasil abnormal memuat "sakit berat" | tampak lemas, postur kurang tegap | 90% |
| Temuan: Keadaan umum · Kesan sakit | hasil abnormal memuat "lemas" | tampak lemas, postur kurang tegap | 70% |
| Temuan: Keadaan umum · Kesan sakit | hasil abnormal memuat "sakit kronik" | tampak lemas, postur kurang tegap | 50% |
| Temuan: Keadaan umum · Kesan sakit | hasil abnormal memuat "pucat" | tampak pucat | 100% |
| Temuan: Keadaan umum · Kesadaran | abnormal | tampak mengantuk, respons lambat | 100% |
| Temuan: Kepala & leher · Konjungtiva | hasil abnormal memuat "anemis (pucat)" | tampak pucat | 100% |
| Temuan: Kepala & leher · Konjungtiva | hasil abnormal memuat "hiperemis" | mata tampak kemerahan | 100% |
| Temuan: Kepala & leher · Sklera | hasil abnormal memuat "subikterik" | mata/kulit tampak kekuningan | 50% |
| Temuan: Kepala & leher · Sklera | hasil abnormal memuat "ikterik" | mata/kulit tampak kekuningan | 100% |
| Temuan: Ekstremitas & kulit · Kulit | hasil abnormal memuat "kekuningan" | mata/kulit tampak kekuningan | 60% |
| Temuan: Ekstremitas & kulit · Kulit | hasil abnormal memuat "petekie" | bintik-bintik merah di lengan dan tungkai | 100% |
| Temuan: Ekstremitas & kulit · Kulit | hasil abnormal memuat "luka di telapak kaki kanan" | berjalan pincang (kaki kanan) | 100% |
| Temuan: Ekstremitas & kulit · Edema | abnormal | kedua pergelangan kaki tampak bengkak | 100% |

Selain itu: tinggi & bentuk badan mengikuti hasil antropometri kasus (TB, IMT); laju napas mengikuti frekuensi napas pada tanda vital;
pakaian mengikuti pekerjaan (mis. seragam sekolah); pasien demam/menggigil cenderung datang berjaket.

**Lokasi yang ditunjuk pasien saat membicarakan gejala**

Nyeri kepala → kepala · Nyeri belakang bola mata (retro-orbital) → mata · Mata/kulit kuning (ikterus) → mata · Pandangan kabur → mata · Mimisan / gusi berdarah → mulut · Mual/muntah → ulu hati · Sulit menelan (disfagia) → tenggorokan · Regurgitasi asam → tenggorokan · Batuk → dada · Batuk darah (hemoptisis) → dada · Sesak napas → dada · Mengi (wheezing) → dada · Nyeri dada (berat/tertekan) → dada · Nyeri dada saat bernapas/batuk (pleuritik) → dada · Rasa terbakar di dada (heartburn) → dada · Nyeri menjalar ke lengan kiri/leher/rahang → lengan · Nyeri/perih ulu hati (epigastrium) → ulu hati · Kembung / cepat kenyang → perut · Nyeri perut → perut · Diare → perut · Sulit buang air besar (konstipasi) → perut · Nyeri perut bawah (suprapubik) → perut bawah · Nyeri/perih saat berkemih (disuria) → perut bawah · Nyeri pinggang → pinggang · Bintik merah di kulit (petekie) → lengan · Nyeri otot/sendi (mialgia/artralgia) → lengan · Kesemutan/kebas di tangan atau kaki → kaki · Luka lama sembuh → kaki

## Infeksi Dengue (Demam Dengue / DBD)

- **id**: `dengue` · **SKDI**: 4A · **bahaya**: tinggi · **sistem**: Infeksi tropis · **status**: `BELUM_DITINJAU_DOKTER`
- **Hari sakit saat datang**: 2–6
- **Demografi**: laki-laki 50%; usia 10–12 (bobot 1.5), 13–17 (bobot 2.5), 18–30 (bobot 5), 31–45 (bobot 3), 46–60 (bobot 2), 61–75 (bobot 1)
- **Pekerjaan berisiko** (bias 30%): Mahasiswa, Pegawai kantor swasta, Ibu rumah tangga, Buruh pabrik, Pelajar SMP/SMA, Pelajar SD
- **Biaya penunjang kunci**: Rp70.000 · semua sesuai rencana: Rp70.000

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
| syok_dengue | 0% | — | Tanda syok tidak ada pada kasus ini, tetapi wajib dinilai. |

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
| Tanda vital lengkap · Suhu aksila | trait: fase_kritis | 100% | 36,9–38,0 °C |
| Tanda vital lengkap · Suhu aksila | — | 100% | 38,4–40,0 °C |
| Tanda vital lengkap · Nadi | trait: kebocoran_plasma | 100% | 96–118 ×/menit |
| Tanda vital lengkap · Nadi | — | 100% | 88–110 ×/menit |
| Tanda vital lengkap · Tekanan darah sistolik | trait: kebocoran_plasma | 100% | 98–112 mmHg |
| Tanda vital lengkap · Tekanan darah diastolik | trait: kebocoran_plasma | 100% | 65–78 mmHg |
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
| Abdomen · Hepar | trait: hepatomegali | 100% | Teraba 2 jari di bawah arkus kosta, tepi tajam, nyeri tekan (+) |
| Abdomen · Palpasi — nyeri tekan | trait: tanda_bahaya | 100% | Nyeri tekan epigastrium dan kuadran kanan atas |
| Abdomen · Palpasi — nyeri tekan | trait: hepatomegali | 60% | Nyeri tekan ringan kuadran kanan atas |
| Kepala & leher · Faring & tonsil | — | 30% | Faring hiperemis ringan, tonsil T1–T1 |
| Kepala & leher · Konjungtiva | — | 20% | Tidak anemis, tampak hiperemis (kemerahan) |
| Thorax — paru · Auskultasi | trait: efusi_pleura | 100% | Suara napas menurun di basal paru kanan |
| Rontgen thorax (PA) · Sinus & diafragma | trait: efusi_pleura | 100% | Sinus kostofrenikus kanan tumpul |
| Rontgen thorax (PA) · Kesan | trait: efusi_pleura | 100% | Efusi pleura kanan minimal |
| USG abdomen (termasuk ginjal) · Kandung empedu | trait: usg_kebocoran | 100% | Dinding kandung empedu menebal (edema) |
| USG abdomen (termasuk ginjal) · Cairan bebas | trait: usg_kebocoran | 100% | Cairan bebas minimal di Morison pouch |
| USG abdomen (termasuk ginjal) · Hepar | trait: hepatomegali | 100% | Hepatomegali ringan, ekogenisitas normal |
| USG abdomen (termasuk ginjal) · Kesan | trait: usg_kebocoran | 100% | Penebalan dinding kandung empedu dan asites minimal, sesuai kebocoran plasma |
| USG abdomen (termasuk ginjal) · Kesan | trait: hepatomegali | 100% | Hepatomegali ringan |
| Fungsi hati · SGOT (AST) | trait: transaminitis | 100% | 60–250 U/L |
| Fungsi hati · SGPT (ALT) | trait: transaminitis | 100% | 45–160 U/L |
| Serologi dengue IgM/IgG · IgM anti-dengue | hari 5–… | 80% (sensitivitas) | Positif |
| Serologi dengue IgM/IgG · IgM anti-dengue | hari 4–… | 50% (sensitivitas) | Positif |
| Serologi dengue IgM/IgG · IgM anti-dengue | — | 15% (sensitivitas) | Positif |
| Serologi dengue IgM/IgG · IgG anti-dengue | trait: infeksi_sekunder | 90% | Positif |
| Keadaan umum · Kesan sakit | trait: tanda_bahaya | 100% | Tampak sakit sedang, lemas, lebih banyak berbaring |
| Keadaan umum · Kesan sakit | — | 60% | Tampak sakit ringan–sedang, lemas |
| Keadaan umum · Status hidrasi | trait: kebocoran_plasma | 100% | Mukosa bibir agak kering |
| Ekstremitas & kulit · Kulit | gejala: bintik_merah | 100% | Petekie di lengan bawah dan tungkai |
| Thorax — paru · Perkusi | trait: efusi_pleura | 100% | Redup di basal paru kanan |
| Thorax — paru · Palpasi | trait: efusi_pleura | 100% | Fremitus menurun di basal paru kanan |

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
- _keparahan_: "Berat, Dok. Lemas sekali, makan-minum susah, dari kemarin cuma bisa tiduran." → **Lemas berat & sulit makan-minum (tanda bahaya)**
- _progresi_: "Makin parah, Dok. Sekarang perut ikut sakit dan muntah terus." → **Nyeri perut & muntah persisten (tanda bahaya)**
- _progresi_: "Panasnya sudah turun sejak kemarin, Dok, tapi badan malah makin lemas." → **Demam turun tetapi kondisi memburuk (fase kritis)**
- _episode_sebelumnya_: "Waktu kecil katanya pernah dirawat karena demam berdarah, Dok." → **Riwayat infeksi dengue sebelumnya (infeksi sekunder cenderung lebih berat)**

**Rencana pemeriksaan sesuai indikasi** (dasar penilaian)

| Jenis | Pemeriksaan | Peran | Kondisi | Alasan |
|---|---|---|---|---|
| Fisik | Uji tourniquet (Rumple–Leede) | pendukung | — | Manifestasi perdarahan (bagian kriteria klinis dengue). |
| Fisik | Ekstremitas & kulit | komplikasi | — | Petekie, akral, dan CRT (tanda syok). |
| Fisik | Abdomen | komplikasi | — | Nyeri tekan & hepatomegali (tanda bahaya). |
| Fisik | Thorax — paru | komplikasi | — | Efusi pleura (kebocoran plasma). |
| Penunjang | Darah lengkap + hitung jenis | kunci | — | Trombosit, leukosit, dan hematokrit — diagnosis sekaligus pemantauan kebocoran plasma. |
| Penunjang | Tes cepat NS1 dengue _(grup konfirmasi_dengue)_ | kunci | hari …–5 | Konfirmasi dini pada hari 1–5 demam. |
| Penunjang | Serologi dengue IgM/IgG _(grup konfirmasi_dengue)_ | kunci | hari 5–… | IgM positif mulai hari 4–5 saat NS1 mulai negatif. |
| Penunjang | USG abdomen (termasuk ginjal) | komplikasi | trait: kebocoran_plasma | Asites/penebalan dinding kandung empedu bila curiga kebocoran plasma. |
| Penunjang | Rontgen thorax (PA) | komplikasi | trait: kebocoran_plasma | Efusi pleura bila curiga kebocoran plasma. |
| Tidak perlu | Elektrokardiografi (EKG) 12 sadapan | — | — | Tidak ada keluhan yang mengarah ke jantung. |
| Tidak perlu | CT-scan abdomen non-kontras (rujukan) | — | — | CT-scan mahal dan tidak diindikasikan untuk keluhan ini. |
| Tidak perlu | Foto polos abdomen (BNO/KUB) | — | — | Tidak ada kecurigaan batu saluran kemih. |
| Tidak perlu | Profil lipid | — | — | Profil lipid adalah skrining risiko kardiovaskular, tidak menjawab keluhan akut ini. |
| Tidak perlu | HbA1c | — | — | HbA1c tidak membantu diagnosis keluhan akut ini. |
| Tidak perlu | Tes Cepat Molekuler (TCM) TB | — | — | Tidak ada gejala yang mengarah ke TB. |
| Tidak perlu | BTA sputum (mikroskopis) | — | — | Tidak ada gejala yang mengarah ke TB. |
| Tidak perlu | Spirometri sederhana (APE & reversibilitas) | — | — | Tidak ada keluhan sesak/obstruksi saluran napas. |

Topik anamnesis kunci: Onset, Pola & waktu, Perjalanan penyakit, Keluhan lain, Bepergian, pekerjaan & lingkungan.

**Diagnosis banding**

| Kondisi | Wajib disingkirkan | Bukti untuk menyingkirkan | Cara membedakan |
|---|---|---|---|
| Demam Tifoid | — | anamnesis: Onset; anamnesis: Pola & waktu; Tubex TF (IgM anti-Salmonella) | Tifoid: demam naik bertahap lebih dari 5–7 hari terutama sore–malam, keluhan saluran cerna, dan lidah kotor; trombosit biasanya normal atau hanya sedikit turun. Dengue: demam tinggi mendadak, nyeri otot/sendi dan belakang mata, trombositopenia nyata, hemokonsentrasi, NS1 positif di awal sakit. |
| Malaria | Ya | anamnesis: Bepergian, pekerjaan & lingkungan; Tes cepat (RDT) malaria; Apusan darah tebal–tipis (malaria) | Malaria: riwayat tinggal/bepergian ke daerah endemis, demam menggigil–berkeringat berkala, anemia dan splenomegali; RDT/mikroskopis positif. Trombositopenia bisa terjadi pada keduanya, jadi riwayat bepergian sangat menentukan. |
| Pneumonia Komunitas | — | Thorax — paru; Rontgen thorax (PA) | Pneumonia: batuk berdahak, sesak, ronkhi/konsolidasi, leukositosis. Dengue: tanpa keluhan napas yang menonjol, leukopenia dan trombositopenia. |
| Leptospirosis | Ya | anamnesis: Bepergian, pekerjaan & lingkungan | Leptospirosis: riwayat banjir/selokan/kontak tikus, nyeri betis, ikterik, gangguan ginjal. Dengue: tanpa paparan tersebut, dengan trombositopenia & hemokonsentrasi. |
| Chikungunya | — | Darah lengkap + hitung jenis | Chikungunya: nyeri & bengkak sendi sangat menonjol; trombosit biasanya normal atau hanya sedikit turun. |
| Influenza | — | gejala: Batuk; Darah lengkap + hitung jenis | Influenza: batuk-pilek menonjol, trombosit normal. |

**Komplikasi & tanda bahaya**

| Komplikasi | Trait | Tanda bahaya | Cara menilai | Penjelasan |
|---|---|---|---|---|
| Tanda bahaya (warning signs) | tanda_bahaya | Ya | gejala: Nyeri perut; gejala: Mual/muntah; gejala: Mimisan / gusi berdarah; Abdomen; Darah lengkap + hitung jenis | Nyeri perut hebat, muntah persisten, perdarahan mukosa, letargi, hepatomegali, atau hematokrit naik disertai trombosit turun cepat → rawat inap. |
| Kebocoran plasma (DBD) | kebocoran_plasma | Ya | Darah lengkap + hitung jenis; USG abdomen (termasuk ginjal); Rontgen thorax (PA); Thorax — paru | Hemokonsentrasi (hematokrit naik ≥ 20%), efusi pleura, asites, atau penebalan dinding kandung empedu. |
| Perdarahan spontan | perdarahan_spontan | Ya | gejala: Mimisan / gusi berdarah; gejala: Bintik merah di kulit (petekie); Ekstremitas & kulit; Uji tourniquet (Rumple–Leede) | Mimisan, gusi berdarah, petekie spontan menandakan gangguan hemostasis dan perlu pemantauan ketat. |
| Syok (sindrom syok dengue) | syok_dengue | Ya | Tanda vital lengkap; Ekstremitas & kulit | Nadi cepat & lemah, tekanan nadi ≤ 20 mmHg, akral dingin, CRT > 2 detik. Wajib dinilai pada setiap pasien dengue. |

**Disposisi** (aturan pertama yang cocok)

- trait: tanda_bahaya → **Rujuk segera / IGD**: Dengue dengan tanda bahaya memerlukan rawat inap dan pemantauan cairan.
- trait: kebocoran_plasma → **Rujuk segera / IGD**: DBD dengan kebocoran plasma memerlukan rawat inap.
- trait: perdarahan_spontan → **Rujuk segera / IGD**: Perdarahan spontan pada dengue memerlukan rawat inap.
- — → **Rawat jalan dengan pemantauan ketat / kontrol ulang**: Dengue tanpa tanda bahaya: rawat jalan dengan kontrol harian (klinis, hematokrit, trombosit) sampai melewati fase kritis.

**Prinsip tata laksana** (tanpa dosis)

- Cukupi cairan oral; pantau asupan dan jumlah kencing.
- Antipiretik parasetamol; hindari aspirin/OAINS karena risiko perdarahan.
- Edukasi tanda bahaya dan kontrol harian sampai 24–48 jam setelah demam turun.
- Rawat inap bila ada tanda bahaya, kebocoran plasma, atau perdarahan.

**Langkah penalaran yang dianjurkan**

1. Demam akut: tanyakan onset, pola demam, gejala penyerta, dan riwayat bepergian (singkirkan malaria).
2. Periksa tanda vital lengkap dan tanda perdarahan (uji tourniquet, petekie).
3. Darah lengkap: trombositopenia + leukopenia + hemokonsentrasi mendukung dengue; NS1 pada hari 1–5, IgM setelahnya.
4. Tentukan fase (demam, kritis, pemulihan) lalu cari tanda bahaya, kebocoran plasma, dan tanda syok.
5. Putuskan rawat jalan dengan kontrol harian atau rawat inap.

**Jebakan penalaran (umpan balik)**

- `{"excluded":"dengue","toolNormal":"ns1_dengue"}` → NS1 negatif tidak menyingkirkan dengue, terutama setelah hari ke-5; nilai trombosit, hematokrit, dan IgM.
- `{"wrongPrimary":true,"traits":["fase_kritis"]}` → Demam yang mulai turun pada hari ke-3–7 justru bisa fase kritis dengue — jangan dianggap membaik.
- `{"primaryIs":"demam_tifoid","toolDone":"widal"}` → Titer Widal tunggal sering positif palsu di daerah endemis; tidak cukup untuk mendiagnosis tifoid.
- `{"primaryIs":"malaria","topicNotAsked":"bepergian_lingkungan"}` → Trombositopenia saja tidak cukup untuk menyimpulkan malaria; tanpa riwayat daerah endemis, dengue jauh lebih mungkin.

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
- Pasien anak (10–12 th) & remaja (13–17 th) memakai konten yang sama dengan dewasa, dengan rujukan tanda vital/antropometri menurut usia yang disederhanakan — perlu tinjauan khusus pediatri.

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
- [ ] Rencana pemeriksaan (kunci/pendukung/komplikasi) & pemeriksaan "tidak perlu" sesuai praktik layanan primer
- [ ] Komplikasi, tanda bahaya, dan aturan disposisi/rujukan tepat
- [ ] Prinsip tata laksana & jebakan penalaran akurat

---

## Demam Tifoid

- **id**: `demam_tifoid` · **SKDI**: 4A · **bahaya**: sedang · **sistem**: Infeksi tropis · **status**: `BELUM_DITINJAU_DOKTER`
- **Hari sakit saat datang**: 5–14
- **Demografi**: laki-laki 50%; usia 10–12 (bobot 1.2), 13–17 (bobot 2.5), 18–25 (bobot 5), 26–35 (bobot 3), 36–50 (bobot 2), 51–75 (bobot 1)
- **Pekerjaan berisiko** (bias 40%): Mahasiswa, Buruh pabrik, Pengemudi ojek online, Pedagang kaki lima, Pelajar SMP/SMA, Pelajar SD
- **Biaya penunjang kunci**: Rp220.000 · semua sesuai rencana: Rp110.000

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
| perdarahan_usus | 6% | hari 10–… | Komplikasi: perdarahan saluran cerna (BAB hitam, Hb turun). |
| perforasi | 3% | hari 10–…; tanpa: perdarahan_usus | Komplikasi: perforasi usus (akut abdomen) — kegawatan bedah. |

**Gejala**

| Gejala | Peluang | Kondisi |
|---|---|---|
| BAB hitam (melena) | 90% | trait: perdarahan_usus |
| Nyeri perut | 100% | trait: perforasi |
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
| Darah lengkap + hitung jenis · Hemoglobin | trait: perdarahan_usus | 100% | 8,5–10,5 g/dL |
| Tanda vital lengkap · Nadi | trait: perdarahan_usus | 100% | 106–120 ×/menit |
| Kepala & leher · Konjungtiva | trait: perdarahan_usus | 100% | Anemis (pucat) |
| Keadaan umum · Kesan sakit | trait: perforasi | 100% | Tampak sakit berat, menahan nyeri, enggan bergerak |
| Keadaan umum · Kesan sakit | trait: perdarahan_usus | 100% | Tampak sakit sedang, pucat |
| Abdomen · Tanda khusus | trait: perforasi | 100% | Defans muskular (+), nyeri lepas (+) |
| Abdomen · Palpasi — nyeri tekan | trait: perforasi | 100% | Nyeri tekan di seluruh lapang perut |
| Abdomen · Bising usus | trait: perforasi | 100% | Bising usus menurun |
| Tanda vital lengkap · Suhu aksila | trait: demam_saat_periksa | 100% | 38,0–39,6 °C |
| Tanda vital lengkap · Suhu aksila | — | 100% | 37,4–38,0 °C |
| Tanda vital lengkap · Nadi | trait: bradikardia_relatif | 100% | 68–84 ×/menit |
| Tanda vital lengkap · Nadi | — | 100% | 90–108 ×/menit |
| Kepala & leher · Lidah | trait: lidah_kotor | 100% | Lidah kotor (selaput putih di tengah), tepi dan ujung hiperemis / Lidah kotor (coated tongue), ujung hiperemis, tremor halus |
| Abdomen · Palpasi — nyeri tekan | gejala: nyeri_perut | 70% | Nyeri tekan epigastrium / Nyeri tekan periumbilikal / Nyeri tekan ringan regio epigastrium dan periumbilikal |
| Abdomen · Hepar | trait: hepatomegali | 100% | Teraba 1–2 jari di bawah arkus kosta, kenyal, nyeri tekan ringan |
| Abdomen · Lien (limpa) | trait: splenomegali | 100% | Teraba Schuffner I |
| Abdomen · Inspeksi | trait: meteorismus | 100% | Sedikit cembung |
| Abdomen · Perkusi | trait: meteorismus | 100% | Hipertimpani (meteorismus), shifting dullness (−) |
| Abdomen · Bising usus | trait: diare | 100% | Bising usus meningkat |
| Abdomen · Bising usus | trait: konstipasi | 50% | Bising usus menurun |
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
| USG abdomen (termasuk ginjal) · Hepar | trait: hepatomegali | 100% | Hepatomegali ringan, ekogenisitas normal |
| USG abdomen (termasuk ginjal) · Lien | trait: splenomegali | 100% | Splenomegali ringan |
| USG abdomen (termasuk ginjal) · Kesan | trait: hepatomegali + splenomegali | 100% | Hepatosplenomegali ringan |
| USG abdomen (termasuk ginjal) · Kesan | trait: hepatomegali | 100% | Hepatomegali ringan |
| USG abdomen (termasuk ginjal) · Kesan | trait: splenomegali | 100% | Splenomegali ringan |
| Keadaan umum · Kesan sakit | — | 60% | Tampak sakit sedang, lemas |

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
- _kebiasaan_: "Sering jajan di kantin sama pinggir jalan dekat sekolah, Dok. Cuci tangan? Jarang sih." → **Higiene makanan dan cuci tangan kurang**
- _keparahan_: "Berat, Dok. Kemarin sempat pusing mau pingsan waktu berdiri." → **Pusing saat berdiri (curiga perdarahan saluran cerna)**
- _keparahan_: "Sakit sekali, Dok, perut keras dan nggak bisa bergerak." → **Nyeri perut hebat (curiga perforasi usus)**
- _progresi_: "Dari tadi pagi perut tiba-tiba sakit sekali, Dok, makin parah." → **Nyeri perut hebat mendadak pada minggu ke-2–3 (curiga perforasi)**
- _progresi_: "Makin hari makin panas, Dok, nggak sembuh-sembuh." → **Demam progresif lebih dari seminggu**

**Rencana pemeriksaan sesuai indikasi** (dasar penilaian)

| Jenis | Pemeriksaan | Peran | Kondisi | Alasan |
|---|---|---|---|---|
| Fisik | Kepala & leher | pendukung | — | Lidah kotor (coated tongue). |
| Fisik | Abdomen | kunci | — | Nyeri tekan, hepatosplenomegali, dan tanda perforasi. |
| Penunjang | Darah lengkap + hitung jenis | kunci | — | Leukosit normal/rendah, aneosinofilia; Hb untuk mendeteksi perdarahan. |
| Penunjang | Tubex TF (IgM anti-Salmonella) _(grup serologi_tifoid)_ | kunci | — | Konfirmasi serologis yang lebih spesifik daripada Widal. |
| Penunjang | Tes Widal _(grup serologi_tifoid)_ | pendukung | — | Bila Tubex tidak tersedia — interpretasi hati-hati. |
| Penunjang | Fungsi hati | komplikasi | trait: transaminitis | Menilai hepatitis tifosa. |
| Tidak perlu | Elektrokardiografi (EKG) 12 sadapan | — | — | Tidak ada keluhan yang mengarah ke jantung. |
| Tidak perlu | CT-scan abdomen non-kontras (rujukan) | — | — | CT-scan mahal dan tidak diindikasikan untuk keluhan ini. |
| Tidak perlu | Foto polos abdomen (BNO/KUB) | — | — | Tidak ada kecurigaan batu saluran kemih. |
| Tidak perlu | Profil lipid | — | — | Profil lipid adalah skrining risiko kardiovaskular, tidak menjawab keluhan akut ini. |
| Tidak perlu | HbA1c | — | — | HbA1c tidak membantu diagnosis keluhan akut ini. |
| Tidak perlu | Tes Cepat Molekuler (TCM) TB | — | — | Tidak ada gejala yang mengarah ke TB. |
| Tidak perlu | BTA sputum (mikroskopis) | — | — | Tidak ada gejala yang mengarah ke TB. |
| Tidak perlu | Spirometri sederhana (APE & reversibilitas) | — | — | Tidak ada keluhan sesak/obstruksi saluran napas. |
| Tidak perlu | Rontgen thorax (PA) | — | — | Tanpa keluhan napas, foto toraks tidak diperlukan. |

Topik anamnesis kunci: Onset, Pola & waktu, Perjalanan penyakit, Kebiasaan & gaya hidup, Keluhan lain.

**Diagnosis banding**

| Kondisi | Wajib disingkirkan | Bukti untuk menyingkirkan | Cara membedakan |
|---|---|---|---|
| Infeksi Dengue (Demam Dengue / DBD) | — | Darah lengkap + hitung jenis; Tes cepat NS1 dengue | Dengue: demam tinggi mendadak dengan nyeri otot/sendi dan belakang mata, trombositopenia nyata dan hemokonsentrasi; NS1 positif di awal. Tifoid: demam bertahap lebih dari seminggu, keluhan cerna, lidah kotor, trombosit umumnya normal. |
| Malaria | Ya | anamnesis: Bepergian, pekerjaan & lingkungan; Tes cepat (RDT) malaria; Apusan darah tebal–tipis (malaria) | Malaria: riwayat ke daerah endemis, demam menggigil–berkeringat berkala, anemia dan splenomegali, RDT positif. Tifoid: tanpa riwayat daerah endemis malaria, demam sore–malam, keluhan cerna, Tubex positif. |
| Gastroenteritis Akut | — | anamnesis: Onset; anamnesis: Pola & waktu | Gastroenteritis: diare/muntah akut beberapa hari, demam ringan, tanpa demam bertahap lebih dari seminggu. |
| Hepatitis A | — | Fungsi hati; Kepala & leher | Hepatitis A: ikterik, urin gelap, transaminase sangat tinggi; demam biasanya turun saat kuning muncul. |
| Leptospirosis | Ya | anamnesis: Bepergian, pekerjaan & lingkungan | Leptospirosis: riwayat banjir/kontak tikus, nyeri betis, ikterik, gangguan ginjal. |
| Apendisitis Akut | — | Abdomen | Apendisitis: nyeri berpindah ke kanan bawah, McBurney (+); demam tidak berlangsung seminggu lebih. |

**Komplikasi & tanda bahaya**

| Komplikasi | Trait | Tanda bahaya | Cara menilai | Penjelasan |
|---|---|---|---|---|
| Perdarahan saluran cerna | perdarahan_usus | Ya | gejala: BAB hitam (melena); Darah lengkap + hitung jenis; Tanda vital lengkap | BAB hitam, Hb turun, nadi cepat — biasanya minggu ke-2–3; rujuk segera. |
| Perforasi usus | perforasi | Ya | Abdomen | Nyeri perut hebat mendadak, defans muskular, bising usus menurun — kegawatan bedah. |
| Hepatitis tifosa ringan | transaminitis | — | Fungsi hati | Peningkatan SGOT/SGPT ringan; umumnya membaik dengan terapi tifoid. |

**Disposisi** (aturan pertama yang cocok)

- trait: perforasi → **Rujuk segera / IGD**: Perforasi usus adalah kegawatan bedah.
- trait: perdarahan_usus → **Rujuk segera / IGD**: Perdarahan saluran cerna pada tifoid memerlukan rawat inap.
- — → **Rawat jalan, edukasi & kontrol** (juga diterima: Rawat jalan dengan pemantauan ketat / kontrol ulang): Tifoid tanpa komplikasi dapat dirawat jalan bila masih bisa makan-minum.

**Prinsip tata laksana** (tanpa dosis)

- Istirahat, asupan cairan & kalori cukup, diet lunak.
- Antibiotik sesuai pedoman — keputusan dokter.
- Edukasi tanda bahaya: nyeri perut hebat, BAB hitam, penurunan kesadaran → segera ke rumah sakit.
- Higiene makanan dan cuci tangan untuk mencegah penularan.

**Langkah penalaran yang dianjurkan**

1. Demam lebih dari 5–7 hari: tanyakan pola (sore–malam), keluhan cerna, kebiasaan makan & higiene.
2. Periksa lidah kotor, bradikardia relatif, nyeri tekan abdomen, dan hepatosplenomegali.
3. Darah lengkap + Tubex/IgM Salmonella; interpretasi Widal dengan hati-hati.
4. Cari komplikasi: BAB hitam, nyeri perut hebat/defans, penurunan kesadaran.
5. Singkirkan dengue (onset mendadak, trombositopenia) dan malaria (riwayat bepergian).

**Jebakan penalaran (umpan balik)**

- `{"excluded":"demam_tifoid","toolNormal":"widal"}` → Widal negatif, terutama di minggu pertama, tidak menyingkirkan tifoid.
- `{"topicNotAsked":"keluhan_lain","traits":["perdarahan_usus"]}` → BAB hitam tidak disebut spontan oleh pasien — gali keluhan lain dan tanyakan spesifik warna BAB pada demam lama.

**Temuan khas (layar edukasi)**

- Demam ≥ 5–7 hari yang naik bertahap, terutama sore–malam
- Keluhan saluran cerna: konstipasi (dewasa) atau diare, mual, nyeri perut
- Lidah kotor (coated tongue), bradikardia relatif, hepato/splenomegali ringan
- Leukosit normal atau rendah, aneosinofilia, limfositosis relatif
- Tubex TF / IgM anti-Salmonella positif; baku emas: kultur darah

**Catatan pengembang**

- Probabilitas gejala dan rentang nilai lab adalah estimasi pengembang; mohon diverifikasi.
- Sensitivitas Tubex/Widal di game disederhanakan.
- Pasien anak (10–12 th) & remaja (13–17 th) memakai konten yang sama dengan dewasa, dengan rujukan tanda vital/antropometri menurut usia yang disederhanakan — perlu tinjauan khusus pediatri.

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
- [ ] Rencana pemeriksaan (kunci/pendukung/komplikasi) & pemeriksaan "tidak perlu" sesuai praktik layanan primer
- [ ] Komplikasi, tanda bahaya, dan aturan disposisi/rujukan tepat
- [ ] Prinsip tata laksana & jebakan penalaran akurat

---

## Malaria

- **id**: `malaria` · **SKDI**: 4A · **bahaya**: tinggi · **sistem**: Infeksi tropis · **status**: `BELUM_DITINJAU_DOKTER`
- **Hari sakit saat datang**: 2–7
- **Demografi**: laki-laki 75%; usia 18–30 (bobot 4), 31–45 (bobot 4), 46–60 (bobot 2), 61–75 (bobot 0.5)
- **Pekerjaan berisiko** (bias 70%): Pekerja tambang, Anggota TNI, Pekerja proyek bangunan, Pekerja perkebunan sawit, Sopir truk, Nelayan, Pegawai kantor swasta
- **Biaya penunjang kunci**: Rp50.000 · semua sesuai rencana: Rp120.000

> Infeksi parasit Plasmodium yang ditularkan nyamuk Anopheles. Khas dengan demam paroksismal (menggigil → panas tinggi → berkeringat), riwayat tinggal atau bepergian ke daerah endemis (mis. Papua, NTT, Maluku), anemia, dan splenomegali. Malaria falciparum dapat cepat berkembang menjadi malaria berat, sehingga diagnosis dini penting.

**Trait laten** (aturan pertama yang cocok per id dipakai)

| Trait | Peluang | Kondisi | Keterangan |
|---|---|---|---|
| falciparum | 55% | — | Spesies: Plasmodium falciparum (malaria tropika) — berisiko berkembang menjadi malaria berat. |
| malaria_berat | 10% | trait: falciparum | Malaria berat: penurunan kesadaran, ikterik, anemia berat, gangguan ginjal, hiperparasitemia. |
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
| Urin gelap seperti teh | 80% | trait: malaria_berat |
| Mata/kulit kuning (ikterus) | 80% | trait: malaria_berat |
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
| Keadaan umum · Kesadaran | trait: malaria_berat | 100% | Apatis, GCS 14 (E4M6V4) |
| Keadaan umum · Kesan sakit | trait: malaria_berat | 100% | Tampak sakit berat |
| Kepala & leher · Sklera | trait: malaria_berat | 100% | Ikterik |
| Darah lengkap + hitung jenis · Hemoglobin | trait: malaria_berat | 100% | 5,8–7,0 g/dL |
| Fungsi hati · Bilirubin total | trait: malaria_berat | 100% | 3,2–6,0 mg/dL |
| Fungsi ginjal · Kreatinin | trait: malaria_berat | 100% | 2,6–4,0 mg/dL |
| Fungsi ginjal · Ureum | trait: malaria_berat | 100% | 80–140 mg/dL |
| Apusan darah tebal–tipis (malaria) · Hasil | trait: malaria_berat | 100% | Ditemukan P. falciparum stadium tropozoit, kepadatan tinggi (± 8% eritrosit terinfeksi) |
| Urinalisis (urin lengkap) · Warna & kejernihan | trait: malaria_berat | 100% | Coklat gelap seperti teh |
| Tanda vital lengkap · Suhu aksila | trait: sedang_demam | 100% | 38,5–40,2 °C |
| Tanda vital lengkap · Suhu aksila | — | 100% | 36,6–37,4 °C |
| Tanda vital lengkap · Nadi | trait: sedang_demam | 100% | 96–118 ×/menit |
| Kepala & leher · Konjungtiva | trait: anemia | 80% | Anemis (pucat) |
| Kepala & leher · Sklera | trait: ikterik_ringan | 100% | Subikterik |
| Abdomen · Lien (limpa) | trait: splenomegali | 100% | Teraba Schuffner I / Teraba Schuffner II |
| Abdomen · Hepar | trait: hepatomegali | 100% | Teraba 1–2 jari di bawah arkus kosta |
| Abdomen · Palpasi — nyeri tekan | trait: splenomegali | 30% | Nyeri tekan ringan kuadran kiri atas |
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
| USG abdomen (termasuk ginjal) · Lien | trait: splenomegali | 100% | Splenomegali |
| USG abdomen (termasuk ginjal) · Hepar | trait: hepatomegali | 100% | Hepatomegali ringan |
| USG abdomen (termasuk ginjal) · Kesan | trait: hepatomegali + splenomegali | 100% | Hepatosplenomegali |
| USG abdomen (termasuk ginjal) · Kesan | trait: splenomegali | 100% | Splenomegali |
| USG abdomen (termasuk ginjal) · Kesan | trait: hepatomegali | 100% | Hepatomegali ringan |
| Keadaan umum · Kesan sakit | trait: sedang_demam | 100% | Tampak sakit sedang, menggigil |
| Ekstremitas & kulit · Kulit | trait: ikterik_ringan | 100% | Kulit tampak kekuningan |

**Petunjuk anamnesis** (jawaban bertanda petunjuk)

- _onset_: "Sudah {hariTeks} hari ini, Dok. Mulainya menggigil hebat, terus panas tinggi." → **Demam yang diawali menggigil hebat**
- _karakter_: "Menggigilnya sampai gemetaran, Dok. Pakai selimut tebal juga masih dingin, habis itu panas tinggi." → **Menggigil hebat (rigor)**
- _pola_: "Panasnya nggak tentu, Dok, kadang tiap hari. Menggigil dulu, terus panas, habis itu keringetan banyak, lalu agak enakan." → **Demam paroksismal: menggigil → panas → berkeringat**
- _pola_: "Kayak ada jadwalnya, Dok. Selang sehari kumat: menggigil, panas tinggi, terus keringat banjir, habis itu enakan." → **Demam paroksismal berselang sehari (pola tertiana)**
- _pola_: "Hilang timbul, Dok. Kalau kumat, menggigil dulu, terus panas tinggi." → **Demam hilang-timbul yang diawali menggigil**
- _pola_: "Hari ini panas, besok agak mendingan, lusa panas lagi, Dok." → **Demam berselang sehari (pola tertiana)**
- _pola_: "Panasnya naik turun, Dok, hilang timbul." → **Demam hilang-timbul**
- _pemberat_peringan_: "Habis keringetan biasanya badan enakan, Dok. Nanti kumat lagi." → **Membaik setelah berkeringat, lalu kambuh lagi**
- _riwayat_keluarga_: "Teman-teman satu barak di sana ada yang sakit kayak gini juga, Dok." → **Rekan di daerah endemis mengalami sakit serupa**
- _riwayat_keluarga_: "Rekan kerja di sana ada yang pernah sakit kayak gini, Dok." → **Rekan di daerah endemis mengalami sakit serupa**
- _bepergian_lingkungan_: "Saya baru pulang kerja dari {daerahEndemis}, Dok, kira-kira dua minggu lalu." → **Riwayat bepergian/bekerja di daerah endemis malaria**
- _bepergian_lingkungan_: "Saya kerja di {daerahEndemis}, Dok. Ini lagi pulang cuti seminggu." → **Riwayat bepergian/bekerja di daerah endemis malaria**
- _bepergian_lingkungan_: "Bulan lalu saya tugas tiga minggu di {daerahEndemis}, Dok." → **Riwayat bepergian/bekerja di daerah endemis malaria**
- _kebiasaan_: "Di sana tidurnya di barak, Dok, jarang pakai kelambu. Nyamuknya banyak sekali kalau malam." → **Tidak memakai kelambu di daerah endemis**
- _kebiasaan_: "Di sana nginap di mes, Dok. Kalau malam sering duduk-duduk di luar, nyamuknya banyak, nggak pakai obat nyamuk." → **Tidak memakai pelindung dari gigitan nyamuk di daerah endemis**
- _kebiasaan_: "Saya merokok, Dok. Di sana sering kerja sampai malam di luar." → **Sering beraktivitas di luar rumah pada malam hari (jam gigit Anopheles)**
- _durasi_: "Sekali kumat bisa beberapa jam, Dok: menggigil, panas, lalu keringetan, habis itu enakan." → **Serangan berlangsung beberapa jam lalu mereda (paroksismal)**
- _durasi_: "Tiap kumat beberapa jam, Dok, habis itu agak enakan." → **Serangan berlangsung beberapa jam lalu mereda (paroksismal)**
- _keparahan_: "Berat sekali, Dok. Kata keluarga, tadi pagi saya sempat bicara ngelantur, kencing juga gelap." → **Penurunan kesadaran ringan & urin gelap (curiga malaria berat)**
- _keparahan_: "Berat sekali, Dok. Kata keluarga, tadi pagi saya sempat bicara ngelantur." → **Penurunan kesadaran ringan (curiga malaria berat)**
- _progresi_: "Makin parah, Dok. Sekarang badan kuning dan lemas sekali." → **Perburukan dengan ikterik (curiga malaria berat)**
- _episode_sebelumnya_: "Dulu waktu kerja di sana pernah kena malaria juga, Dok. Sudah diobati." → **Riwayat malaria sebelumnya (kemungkinan relaps atau reinfeksi)**

**Rencana pemeriksaan sesuai indikasi** (dasar penilaian)

| Jenis | Pemeriksaan | Peran | Kondisi | Alasan |
|---|---|---|---|---|
| Fisik | Kepala & leher | pendukung | — | Konjungtiva anemis dan sklera ikterik. |
| Fisik | Abdomen | kunci | — | Splenomegali. |
| Fisik | Keadaan umum | komplikasi | — | Kesadaran (tanda malaria berat). |
| Penunjang | Apusan darah tebal–tipis (malaria) _(grup konfirmasi_malaria)_ | kunci | — | Baku emas: spesies & kepadatan parasit. |
| Penunjang | Tes cepat (RDT) malaria _(grup konfirmasi_malaria)_ | kunci | — | Konfirmasi parasitologis cepat. |
| Penunjang | Darah lengkap + hitung jenis | pendukung | — | Anemia dan trombositopenia. |
| Penunjang | Fungsi ginjal | komplikasi | trait: malaria_berat | Gangguan ginjal pada malaria berat. |
| Penunjang | Fungsi hati | komplikasi | trait: malaria_berat | Ikterik/bilirubin pada malaria berat. |
| Tidak perlu | Elektrokardiografi (EKG) 12 sadapan | — | — | Tidak ada keluhan yang mengarah ke jantung. |
| Tidak perlu | CT-scan abdomen non-kontras (rujukan) | — | — | CT-scan mahal dan tidak diindikasikan untuk keluhan ini. |
| Tidak perlu | Foto polos abdomen (BNO/KUB) | — | — | Tidak ada kecurigaan batu saluran kemih. |
| Tidak perlu | Profil lipid | — | — | Profil lipid adalah skrining risiko kardiovaskular, tidak menjawab keluhan akut ini. |
| Tidak perlu | HbA1c | — | — | HbA1c tidak membantu diagnosis keluhan akut ini. |
| Tidak perlu | Tes Cepat Molekuler (TCM) TB | — | — | Tidak ada gejala yang mengarah ke TB. |
| Tidak perlu | BTA sputum (mikroskopis) | — | — | Tidak ada gejala yang mengarah ke TB. |
| Tidak perlu | Spirometri sederhana (APE & reversibilitas) | — | — | Tidak ada keluhan sesak/obstruksi saluran napas. |

Topik anamnesis kunci: Bepergian, pekerjaan & lingkungan, Pola & waktu, Durasi tiap episode, Episode sebelumnya.

**Diagnosis banding**

| Kondisi | Wajib disingkirkan | Bukti untuk menyingkirkan | Cara membedakan |
|---|---|---|---|
| Infeksi Dengue (Demam Dengue / DBD) | — | Tes cepat NS1 dengue; Darah lengkap + hitung jenis | Dengue: tanpa riwayat ke daerah endemis malaria, nyeri otot/sendi dan belakang mata menonjol, hemokonsentrasi, NS1 positif. Malaria: menggigil–berkeringat berkala, anemia, splenomegali, RDT/mikroskopis positif. |
| Demam Tifoid | — | anamnesis: Pola & waktu; Tubex TF (IgM anti-Salmonella) | Tifoid: demam naik bertahap terutama sore–malam lebih dari seminggu, dengan keluhan cerna dan lidah kotor. Malaria: demam paroksismal dengan menggigil hebat dan riwayat daerah endemis. |
| Leptospirosis | Ya | anamnesis: Bepergian, pekerjaan & lingkungan | Leptospirosis: paparan banjir/tikus, nyeri betis, ikterik, gangguan ginjal; parasit malaria negatif. |
| Sepsis | Ya | Tanda vital lengkap; Keadaan umum | Sepsis: sumber infeksi jelas dengan hipotensi, takikardia, penurunan kesadaran; parasit negatif. |
| Influenza | — | gejala: Batuk | Influenza: batuk-pilek menonjol, demam tidak paroksismal, tanpa riwayat daerah endemis. |

**Komplikasi & tanda bahaya**

| Komplikasi | Trait | Tanda bahaya | Cara menilai | Penjelasan |
|---|---|---|---|---|
| Malaria berat | malaria_berat | Ya | gejala: Urin gelap seperti teh; Keadaan umum; Darah lengkap + hitung jenis; Fungsi ginjal; Fungsi hati; Apusan darah tebal–tipis (malaria) | Penurunan kesadaran, ikterik, anemia berat (Hb < 7), gangguan ginjal, hiperparasitemia, atau urin gelap → rujuk segera. |
| Anemia | anemia | — | Darah lengkap + hitung jenis; Kepala & leher | Anemia akibat hemolisis; berat bila Hb < 7 g/dL. |

**Disposisi** (aturan pertama yang cocok)

- trait: malaria_berat → **Rujuk segera / IGD**: Malaria berat memerlukan terapi parenteral dan rawat inap.
- — → **Rawat jalan, edukasi & kontrol** (juga diterima: Rawat jalan dengan pemantauan ketat / kontrol ulang): Malaria tanpa komplikasi: rawat jalan dengan konfirmasi parasitologis, pengobatan sesuai pedoman, dan kontrol.

**Prinsip tata laksana** (tanpa dosis)

- Konfirmasi parasitologis (mikroskopis/RDT) sebelum terapi.
- Terapi antimalaria sesuai pedoman nasional dan spesies — keputusan dokter.
- Pantau tanda malaria berat; rujuk segera bila muncul.
- Edukasi kelambu/repelan bila kembali ke daerah endemis.

**Langkah penalaran yang dianjurkan**

1. Pada setiap pasien demam, tanyakan riwayat tinggal/bepergian ke daerah endemis.
2. Gali pola demam paroksismal dan riwayat malaria sebelumnya.
3. Periksa anemia, ikterik, splenomegali, dan tingkat kesadaran.
4. Konfirmasi dengan mikroskopis atau RDT.
5. Nilai tanda malaria berat (kesadaran, Hb, bilirubin, kreatinin, kepadatan parasit) sebelum memutuskan rawat jalan.

**Jebakan penalaran (umpan balik)**

- `{"primaryIs":"dengue","traits":["trombositopenia"]}` → Trombositopenia juga sering pada malaria — riwayat daerah endemis seharusnya mengarahkan ke pemeriksaan parasit.
- `{"excluded":"malaria","topicNotAsked":"bepergian_lingkungan"}` → Malaria disingkirkan tanpa menanyakan riwayat bepergian atau tempat tinggal.
- `{"excluded":"malaria","traits":["di_sela_serangan"]}` → Suhu normal saat diperiksa tidak menyingkirkan malaria — pasien bisa datang di sela serangan.
- `{"primaryIs":"demam_tifoid","toolDone":"widal"}` → Titer Widal tunggal sering positif palsu di daerah endemis; tidak cukup untuk mendiagnosis tifoid.

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
- [ ] Rencana pemeriksaan (kunci/pendukung/komplikasi) & pemeriksaan "tidak perlu" sesuai praktik layanan primer
- [ ] Komplikasi, tanda bahaya, dan aturan disposisi/rujukan tepat
- [ ] Prinsip tata laksana & jebakan penalaran akurat

---

## Penyakit Refluks Gastroesofageal (GERD)

- **id**: `gerd` · **SKDI**: 4A · **bahaya**: rendah · **sistem**: Pencernaan · **status**: `BELUM_DITINJAU_DOKTER`
- **Hari sakit saat datang**: 14–120
- **Demografi**: laki-laki 50%; usia 18–30 (bobot 3), 31–45 (bobot 4), 46–60 (bobot 3), 61–75 (bobot 1)
- **Pekerjaan berisiko** (bias 40%): Pegawai kantor swasta, Mahasiswa, Karyawan bank, Manajer perusahaan, Pengemudi ojek online
- **Biaya penunjang kunci**: Rp75.000 · semua sesuai rencana: Rp75.000

> Refluks isi lambung ke esofagus yang menimbulkan heartburn (rasa terbakar di belakang tulang dada) dan regurgitasi asam, terutama setelah makan, saat berbaring, atau membungkuk. Dapat disertai batuk kronik, suara serak, atau nyeri dada non-kardiak. Diagnosis terutama klinis (mis. kuesioner GERD-Q); pemeriksaan penunjang umumnya normal. Pada keluhan nyeri dada, penyebab jantung harus disingkirkan lebih dahulu.

**Trait laten** (aturan pertama yang cocok per id dipakai)

| Trait | Peluang | Kondisi | Keterangan |
|---|---|---|---|
| obesitas | 35% | — | Obesitas — meningkatkan tekanan intraabdomen dan refluks. |
| makan_larut | 60% | — | Kebiasaan makan larut malam lalu langsung berbaring. |
| batuk_kronik | 25% | — | Manifestasi ekstraesofageal: batuk kronik. |
| perokok | 45% | laki-laki |  |
| alarm | 10% | — | Tanda alarm (disfagia, BB turun) → perlu endoskopi. |

**Gejala**

| Gejala | Peluang | Kondisi |
|---|---|---|
| Sulit menelan (disfagia) | 90% | trait: alarm |
| Berat badan turun | 60% | trait: alarm |
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
| Antropometri (timbangan & pita ukur) · Indeks massa tubuh (IMT) | trait: obesitas | 100% | 25,5–32,0 kg/m² |
| Antropometri (timbangan & pita ukur) · Lingkar perut | laki-laki; trait: obesitas | 100% | 92–108 cm |
| Antropometri (timbangan & pita ukur) · Lingkar perut | perempuan; trait: obesitas | 100% | 82–98 cm |
| Abdomen · Palpasi — nyeri tekan | — | 30% | Nyeri tekan ringan epigastrium |
| Kepala & leher · Faring & tonsil | trait: batuk_kronik | 50% | Faring hiperemis ringan |

**Petunjuk anamnesis** (jawaban bertanda petunjuk)

- _lokasi_: "Di belakang tulang dada, Dok, kayak ada yang naik dari ulu hati." → **Rasa terbakar retrosternal yang naik dari ulu hati**
- _karakter_: "Panas, kayak terbakar, Dok. Kadang mulut jadi asam." → **Rasa terbakar (heartburn) dan regurgitasi asam — bukan rasa ditekan**
- _karakter_: "Panas, kayak terbakar, Dok. Bukan kayak ditekan." → **Rasa terbakar (heartburn), bukan rasa ditekan**
- _pola_: "Biasanya habis makan, apalagi kalau langsung tiduran, Dok. Malam-malam sering kebangun karena dada panas." → **Muncul setelah makan dan saat berbaring**
- _pemberat_peringan_: "Makan pedas, gorengan, kopi, atau tiduran habis makan bikin makin parah. Kalau jalan jauh atau naik tangga malah biasa saja, Dok." → **Memberat setelah makan/berbaring, TIDAK dipicu aktivitas fisik**
- _riwayat_obat_: "Kadang minum obat maag cair, Dok, langsung enakan." → **Membaik dengan antasida**
- _kebiasaan_: "Saya sering makan malam larut, Dok, habis itu langsung tidur. Kopi juga tiap hari." → **Makan larut malam lalu langsung berbaring; kopi**
- _kebiasaan_: "Merokok setengah bungkus sehari, Dok. Kopi juga." → **Merokok dan kopi memperberat refluks**
- _keparahan_: "Berat badan saya turun, Dok, makan juga makin susah ditelan." → **Disfagia (tanda alarm)**
- _progresi_: "Makin parah, Dok, sekarang menelan juga kadang nyangkut." → **Disfagia progresif (tanda alarm)**
- _episode_sebelumnya_: "Sering kambuh begini, Dok, sudah lama. Kalau minum obat maag mendingan." → **Keluhan berulang lama yang membaik dengan antasida**

**Rencana pemeriksaan sesuai indikasi** (dasar penilaian)

| Jenis | Pemeriksaan | Peran | Kondisi | Alasan |
|---|---|---|---|---|
| Fisik | Thorax — jantung | pendukung | — | Pemeriksaan jantung pada keluhan dada. |
| Fisik | Abdomen | pendukung | — | Nyeri tekan epigastrium. |
| Fisik | Antropometri (timbangan & pita ukur) | pendukung | — | IMT (obesitas memperberat refluks). |
| Penunjang | Elektrokardiografi (EKG) 12 sadapan | kunci | — | Singkirkan iskemia pada keluhan dada, terutama bila ada faktor risiko. |
| Tidak perlu | CT-scan abdomen non-kontras (rujukan) | — | — | CT-scan mahal dan tidak diindikasikan untuk keluhan ini. |
| Tidak perlu | Foto polos abdomen (BNO/KUB) | — | — | Tidak ada kecurigaan batu saluran kemih. |
| Tidak perlu | Tes cepat NS1 dengue | — | — | Tidak ada demam akut yang mengarah ke dengue. |
| Tidak perlu | Serologi dengue IgM/IgG | — | — | Tidak ada demam akut yang mengarah ke dengue. |
| Tidak perlu | Tes cepat (RDT) malaria | — | — | Tidak ada demam/riwayat daerah endemis. |
| Tidak perlu | Apusan darah tebal–tipis (malaria) | — | — | Tidak ada demam/riwayat daerah endemis. |
| Tidak perlu | Tubex TF (IgM anti-Salmonella) | — | — | Tidak ada demam lama yang mengarah ke tifoid. |
| Tidak perlu | Tes Widal | — | — | Tidak ada demam lama yang mengarah ke tifoid. |
| Tidak perlu | Tes Cepat Molekuler (TCM) TB | — | — | Tidak ada gejala yang mengarah ke TB. |
| Tidak perlu | BTA sputum (mikroskopis) | — | — | Tidak ada gejala yang mengarah ke TB. |
| Tidak perlu | Spirometri sederhana (APE & reversibilitas) | — | — | Tidak ada keluhan sesak/obstruksi saluran napas. |
| Tidak perlu | USG abdomen (termasuk ginjal) | — | — | USG tidak menilai refluks esofagus. |

Topik anamnesis kunci: Sifat keluhan, Pemberat & peringan, Pola & waktu, Lokasi & penjalaran.

**Diagnosis banding**

| Kondisi | Wajib disingkirkan | Bukti untuk menyingkirkan | Cara membedakan |
|---|---|---|---|
| Angina Pektoris Stabil | Ya | anamnesis: Pemberat & peringan; Elektrokardiografi (EKG) 12 sadapan | Angina: rasa berat/tertekan di dada saat aktivitas fisik atau emosi, membaik dengan istirahat dalam beberapa menit, sering pada pasien dengan faktor risiko kardiovaskular, dapat menjalar ke lengan kiri/rahang. GERD: rasa terbakar terkait makan dan berbaring, regurgitasi asam, membaik dengan antasida. |
| Dispepsia / Gastritis | — | anamnesis: Lokasi & penjalaran; anamnesis: Sifat keluhan | Dispepsia: nyeri/perih di ulu hati, kembung, cepat kenyang. GERD: dominan rasa terbakar di belakang tulang dada dan regurgitasi asam, memberat saat berbaring/membungkuk. |
| Sindrom Koroner Akut | Ya | anamnesis: Durasi tiap episode; anamnesis: Pemberat & peringan; Elektrokardiografi (EKG) 12 sadapan | SKA: nyeri dada saat istirahat > 20 menit, keringat dingin, perubahan EKG. GERD: rasa terbakar terkait makan, membaik dengan antasida. |
| Tukak Peptik | — | gejala: BAB hitam (melena) | Tukak peptik: nyeri ulu hati terkait makan, dapat disertai BAB hitam. |
| Kolik Bilier / Kolesistitis | — | Abdomen | Kolik bilier: nyeri kanan atas setelah makan berlemak, Murphy (+). |

**Komplikasi & tanda bahaya**

| Komplikasi | Trait | Tanda bahaya | Cara menilai | Penjelasan |
|---|---|---|---|---|
| Tanda alarm (disfagia, BB turun, perdarahan) | alarm | Ya | gejala: Sulit menelan (disfagia); gejala: Berat badan turun; gejala: BAB hitam (melena) | Disfagia, penurunan berat badan, anemia, atau perdarahan saluran cerna → rujuk untuk endoskopi. |

**Disposisi** (aturan pertama yang cocok)

- trait: alarm → **Rujuk ke spesialis (tidak darurat)**: Tanda alarm → rujuk untuk endoskopi.
- — → **Rawat jalan, edukasi & kontrol**: GERD tanpa tanda alarm: terapi empiris dan modifikasi gaya hidup di layanan primer.

**Prinsip tata laksana** (tanpa dosis)

- Modifikasi gaya hidup: makan porsi kecil, jangan berbaring 2–3 jam setelah makan, tinggikan kepala tempat tidur, turunkan berat badan, kurangi kopi dan rokok.
- Terapi empiris penekan asam selama beberapa minggu — keputusan dokter.
- Rujuk untuk endoskopi bila ada tanda alarm atau tidak membaik.

**Langkah penalaran yang dianjurkan**

1. Keluhan dada: bedakan sumber jantung dan esofagus lewat karakter, pemicu (makan vs aktivitas), dan faktor risiko.
2. Singkirkan penyebab jantung bila ada faktor risiko (EKG).
3. Cari tanda alarm: disfagia, BB turun, anemia, perdarahan.
4. GERD adalah diagnosis klinis; tata laksana dengan modifikasi gaya hidup dan terapi empiris.

**Jebakan penalaran (umpan balik)**

- `{"primaryIs":"angina_stabil","toolNormal":"ekg"}` → Rasa terbakar yang dipicu makan/berbaring dan membaik dengan antasida lebih mengarah ke GERD, bukan angina.
- `{"notConsidered":"angina_stabil"}` → Pada keluhan dada, penyebab jantung (angina/SKA) wajib dipertimbangkan dan disingkirkan.

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
- [ ] Rencana pemeriksaan (kunci/pendukung/komplikasi) & pemeriksaan "tidak perlu" sesuai praktik layanan primer
- [ ] Komplikasi, tanda bahaya, dan aturan disposisi/rujukan tepat
- [ ] Prinsip tata laksana & jebakan penalaran akurat

---

## Angina Pektoris Stabil

- **id**: `angina_stabil` · **SKDI**: 3A · **bahaya**: kritis · **sistem**: Jantung & pembuluh darah · **status**: `BELUM_DITINJAU_DOKTER`
- **Hari sakit saat datang**: 7–90
- **Demografi**: laki-laki 75%; usia 38–45 (bobot 1), 46–55 (bobot 3), 56–65 (bobot 4), 66–75 (bobot 3)
- **Pekerjaan berisiko** (bias 50%): Pensiunan, Pengusaha, Sopir truk, Manajer perusahaan, Pegawai kantor swasta, Pegawai negeri
- **Biaya penunjang kunci**: Rp75.000 · semua sesuai rencana: Rp200.000

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
| kresendo | 12% | — | Pola angina memburuk (kresendo / saat istirahat) — curiga angina tidak stabil. |

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
| Tanda vital lengkap · Tekanan darah sistolik | trait: hipertensi | 100% | 145–175 mmHg |
| Tanda vital lengkap · Tekanan darah diastolik | trait: hipertensi | 100% | 90–105 mmHg |
| Tanda vital lengkap · Nadi | — | 100% | 68–92 ×/menit |
| Antropometri (timbangan & pita ukur) · Indeks massa tubuh (IMT) | trait: obesitas | 100% | 25,5–33,0 kg/m² |
| Antropometri (timbangan & pita ukur) · Lingkar perut | laki-laki; trait: obesitas | 100% | 92–110 cm |
| Antropometri (timbangan & pita ukur) · Lingkar perut | perempuan; trait: obesitas | 100% | 82–100 cm |
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
| Thorax — jantung · Perkusi | trait: kardiomegali | 100% | Batas jantung kiri melebar ke lateral |
| Thorax — jantung · Inspeksi & palpasi | trait: kardiomegali | 100% | Iktus kordis bergeser ke lateral (ICS VI) |
| Keadaan umum · Status gizi (kesan) | trait: obesitas | 100% | Kesan gizi lebih (obesitas) |

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
- _durasi_: "Sekarang bisa lima belas menit lebih, Dok." → **Episode makin lama (curiga angina tidak stabil)**
- _durasi_: "Paling lama lima sampai sepuluh menit, Dok. Habis istirahat hilang." → **Episode singkat < 15 menit yang reda dengan istirahat**
- _keparahan_: "Makin berat, Dok. Kemarin malam muncul waktu saya lagi tiduran." → **Nyeri muncul saat istirahat (curiga angina tidak stabil)**
- _progresi_: "Makin sering, Dok. Dulu seminggu sekali, sekarang hampir tiap hari, jalan dekat saja sudah muncul." → **Angina kresendo: makin sering dan makin berat (tanda bahaya)**
- _progresi_: "Sama saja, Dok. Munculnya selalu kalau capek." → **Pola stabil: selalu dipicu aktivitas dengan ambang yang sama**

**Rencana pemeriksaan sesuai indikasi** (dasar penilaian)

| Jenis | Pemeriksaan | Peran | Kondisi | Alasan |
|---|---|---|---|---|
| Fisik | Thorax — jantung | kunci | — | Bunyi jantung, murmur, pembesaran jantung. |
| Fisik | Thorax — paru | pendukung | — | Ronkhi basal (tanda gagal jantung). |
| Fisik | Ekstremitas & kulit | pendukung | — | Edema tungkai. |
| Fisik | Antropometri (timbangan & pita ukur) | pendukung | — | IMT & lingkar perut (faktor risiko). |
| Penunjang | Elektrokardiografi (EKG) 12 sadapan | kunci | — | Tanda iskemia/LVH; EKG normal tidak menyingkirkan angina. |
| Penunjang | Gula darah sewaktu (GDS) | pendukung | — | Skrining DM sebagai faktor risiko. |
| Penunjang | Profil lipid | pendukung | — | Faktor risiko kardiovaskular. |
| Penunjang | Rontgen thorax (PA) | komplikasi | trait: kardiomegali | Kardiomegali / bendungan paru. |
| Tidak perlu | CT-scan abdomen non-kontras (rujukan) | — | — | CT-scan mahal dan tidak diindikasikan untuk keluhan ini. |
| Tidak perlu | Foto polos abdomen (BNO/KUB) | — | — | Tidak ada kecurigaan batu saluran kemih. |
| Tidak perlu | Tes cepat NS1 dengue | — | — | Tidak ada demam akut yang mengarah ke dengue. |
| Tidak perlu | Serologi dengue IgM/IgG | — | — | Tidak ada demam akut yang mengarah ke dengue. |
| Tidak perlu | Tes cepat (RDT) malaria | — | — | Tidak ada demam/riwayat daerah endemis. |
| Tidak perlu | Apusan darah tebal–tipis (malaria) | — | — | Tidak ada demam/riwayat daerah endemis. |
| Tidak perlu | Tubex TF (IgM anti-Salmonella) | — | — | Tidak ada demam lama yang mengarah ke tifoid. |
| Tidak perlu | Tes Widal | — | — | Tidak ada demam lama yang mengarah ke tifoid. |
| Tidak perlu | Tes Cepat Molekuler (TCM) TB | — | — | Tidak ada gejala yang mengarah ke TB. |
| Tidak perlu | BTA sputum (mikroskopis) | — | — | Tidak ada gejala yang mengarah ke TB. |
| Tidak perlu | Spirometri sederhana (APE & reversibilitas) | — | — | Tidak ada keluhan sesak/obstruksi saluran napas. |
| Tidak perlu | USG abdomen (termasuk ginjal) | — | — | USG abdomen tidak menilai nyeri dada iskemik. |

Topik anamnesis kunci: Lokasi & penjalaran, Sifat keluhan, Durasi tiap episode, Pemberat & peringan, Perjalanan penyakit, Riwayat keluarga, Kebiasaan & gaya hidup.

**Diagnosis banding**

| Kondisi | Wajib disingkirkan | Bukti untuk menyingkirkan | Cara membedakan |
|---|---|---|---|
| Sindrom Koroner Akut | Ya | anamnesis: Perjalanan penyakit; anamnesis: Durasi tiap episode; Elektrokardiografi (EKG) 12 sadapan | SKA: nyeri saat istirahat > 20 menit, makin berat, perubahan EKG akut. Angina stabil: dipicu aktivitas, < 15 menit, reda dengan istirahat. |
| Penyakit Refluks Gastroesofageal (GERD) | — | anamnesis: Pemberat & peringan; anamnesis: Sifat keluhan | GERD: rasa terbakar di dada terkait makan dan berbaring, regurgitasi asam, membaik dengan antasida, tidak dipicu aktivitas fisik. Angina: rasa berat/tertekan saat aktivitas, membaik dengan istirahat, faktor risiko kardiovaskular, dapat menjalar ke lengan kiri/rahang. |
| Dispepsia / Gastritis | — | anamnesis: Lokasi & penjalaran; Abdomen | Dispepsia: nyeri/perih ulu hati terkait makan, kembung, nyeri tekan epigastrium, tidak dipicu aktivitas fisik. Angina: nyeri retrosternal saat aktivitas pada pasien dengan faktor risiko. |
| Nyeri Dada Muskuloskeletal | — | anamnesis: Sifat keluhan; anamnesis: Pemberat & peringan | Nyeri muskuloskeletal: terlokalisasi, bertambah saat ditekan atau bergerak, tidak terkait aktivitas berat. |
| Gagal Jantung | — | Kepala & leher; Ekstremitas & kulit; Thorax — paru | Gagal jantung: sesak saat berbaring, edema tungkai, JVP meningkat, ronkhi basal, kardiomegali. |
| Asma Bronkial (Serangan Ringan–Sedang) | — | anamnesis: Pemberat & peringan; anamnesis: Episode sebelumnya; Thorax — paru; Spirometri sederhana (APE & reversibilitas) | Asma: sesak dengan mengi episodik sejak muda, ada pemicu alergen/udara dingin, membaik dengan bronkodilator. Angina: rasa berat di dada saat aktivitas pada usia lanjut dengan faktor risiko, tanpa mengi. |

**Komplikasi & tanda bahaya**

| Komplikasi | Trait | Tanda bahaya | Cara menilai | Penjelasan |
|---|---|---|---|---|
| Angina tidak stabil (pola memburuk) | kresendo | Ya | anamnesis: Perjalanan penyakit; anamnesis: Pola & waktu; anamnesis: Durasi tiap episode; anamnesis: Keparahan | Nyeri saat istirahat, makin sering/berat, atau > 20 menit → curiga sindrom koroner akut, rujuk segera. |
| Kerusakan organ target: hipertrofi ventrikel kiri | lvh | — | Elektrokardiografi (EKG) 12 sadapan | Hipertensi lama menyebabkan LVH; menambah risiko kardiovaskular. |
| Kardiomegali | kardiomegali | — | Rontgen thorax (PA); Thorax — jantung | Pembesaran jantung; nilai kemungkinan gagal jantung. |

**Disposisi** (aturan pertama yang cocok)

- trait: kresendo → **Rujuk segera / IGD**: Pola angina memburuk atau muncul saat istirahat: curiga sindrom koroner akut.
- — → **Rujuk ke spesialis (tidak darurat)**: Angina stabil (SKDI 3A): tata laksana awal & modifikasi faktor risiko, lalu rujuk spesialis jantung untuk stratifikasi risiko.

**Prinsip tata laksana** (tanpa dosis)

- Kendalikan faktor risiko: berhenti merokok, tekanan darah, gula darah, lipid, berat badan.
- Edukasi: hentikan aktivitas saat nyeri; segera ke IGD bila nyeri > 20 menit atau muncul saat istirahat.
- Terapi antiangina dan pencegahan sekunder sesuai pedoman — keputusan dokter.
- Rujuk spesialis jantung untuk stratifikasi risiko (uji latih jantung).

**Langkah penalaran yang dianjurkan**

1. Nyeri dada: karakter (ditekan vs terbakar), lokasi & penjalaran, pemicu (aktivitas/emosi), durasi, dan pereda (istirahat).
2. Gali faktor risiko kardiovaskular dan riwayat keluarga.
3. Tanda vital lengkap, pemeriksaan jantung–paru, dan EKG istirahat.
4. Singkirkan sindrom koroner akut: nyeri saat istirahat, makin sering, atau > 20 menit.
5. Catat kerusakan organ target dan komorbid (hipertensi, DM, dislipidemia, obesitas).

**Jebakan penalaran (umpan balik)**

- `{"excluded":"angina_stabil","toolNormal":"ekg"}` → EKG istirahat normal TIDAK menyingkirkan angina stabil — anamnesis yang khas lebih menentukan.
- `{"primaryIs":"gerd"}` → Keluhan "masuk angin/angin duduk" yang dipicu aktivitas dan reda dengan istirahat pada pasien berisiko harus dianggap angina.
- `{"primaryIs":"dispepsia"}` → Nyeri dada/epigastrium yang dipicu aktivitas pada pasien berisiko harus dianggap jantung sampai terbukti bukan.

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
- [ ] Rencana pemeriksaan (kunci/pendukung/komplikasi) & pemeriksaan "tidak perlu" sesuai praktik layanan primer
- [ ] Komplikasi, tanda bahaya, dan aturan disposisi/rujukan tepat
- [ ] Prinsip tata laksana & jebakan penalaran akurat

---

## Dispepsia / Gastritis

- **id**: `dispepsia` · **SKDI**: 4A · **bahaya**: rendah · **sistem**: Pencernaan · **status**: `BELUM_DITINJAU_DOKTER`
- **Hari sakit saat datang**: 3–60
- **Demografi**: laki-laki 45%; usia 18–30 (bobot 4), 31–45 (bobot 4), 46–60 (bobot 2), 61–75 (bobot 1)
- **Pekerjaan berisiko** (bias 40%): Mahasiswa, Pegawai kantor swasta, Pengemudi ojek online, Buruh pabrik, Pekerja proyek bangunan
- **Biaya penunjang kunci**: Rp0 · semua sesuai rencana: Rp0

> Kumpulan keluhan nyeri atau rasa tidak nyaman di ulu hati, rasa penuh setelah makan, cepat kenyang, kembung, dan mual. Gastritis (peradangan mukosa lambung) sering dipicu obat antinyeri golongan OAINS, alkohol, stres, pola makan tidak teratur, atau infeksi H. pylori. Pemeriksaan penunjang umumnya normal. Waspadai tanda alarm (berat badan turun, muntah darah, BAB hitam, anemia, usia > 55 tahun dengan keluhan baru) yang memerlukan rujukan untuk endoskopi.

**Trait laten** (aturan pertama yang cocok per id dipakai)

| Trait | Peluang | Kondisi | Keterangan |
|---|---|---|---|
| oains | 35% | — | Pemicu: konsumsi obat antinyeri (OAINS/jamu pegal linu) rutin. |
| makan_tidak_teratur | 60% | — | Pemicu: pola makan tidak teratur dan kopi berlebihan. |
| stres | 40% | — | Pemicu: stres psikologis. |
| perdarahan_saluran_cerna | 15% | trait: oains | Komplikasi: perdarahan saluran cerna atas (melena, anemia). |
| perdarahan_saluran_cerna | 5% | — | Komplikasi: perdarahan saluran cerna atas (melena, anemia). |

**Gejala**

| Gejala | Peluang | Kondisi |
|---|---|---|
| BAB hitam (melena) | 95% | trait: perdarahan_saluran_cerna |
| Lemas | 100% | trait: perdarahan_saluran_cerna |
| Nyeri/perih ulu hati (epigastrium) | 100% | — |
| Kembung / cepat kenyang | 75% | — |
| Mual/muntah | 55% | — |
| Nafsu makan menurun | 40% | — |
| Rasa terbakar di dada (heartburn) | 25% | — |

Keluhan utama (prioritas): nyeri_ulu_hati; tambahan: kembung, mual_muntah. Salah kaprah pasien: masuk angin, asam lambung, kecapekan, maag.

**Temuan pemeriksaan abnormal** (parameter lain = normal)

| Alat · parameter | Kondisi | Peluang | Nilai |
|---|---|---|---|
| Abdomen · Palpasi — nyeri tekan | — | 80% | Nyeri tekan epigastrium |
| Darah lengkap + hitung jenis · Hemoglobin | laki-laki; trait: perdarahan_saluran_cerna | 100% | 8,0–10,5 g/dL |
| Darah lengkap + hitung jenis · Hemoglobin | perempuan; trait: perdarahan_saluran_cerna | 100% | 7,5–10,0 g/dL |
| Kepala & leher · Konjungtiva | trait: perdarahan_saluran_cerna | 100% | Anemis (pucat) |
| Tanda vital lengkap · Nadi | trait: perdarahan_saluran_cerna | 100% | 102–116 ×/menit |
| Keadaan umum · Kesan sakit | trait: perdarahan_saluran_cerna | 100% | Tampak pucat dan lemas |

**Petunjuk anamnesis** (jawaban bertanda petunjuk)

- _lokasi_: "Di ulu hati, Dok, perut atas bagian tengah." → **Nyeri terlokalisasi di epigastrium**
- _karakter_: "Perih, Dok, kayak ditusuk-tusuk. Perut juga begah." → **Perih ulu hati disertai rasa penuh/begah**
- _pola_: "Kalau telat makan langsung kambuh, Dok. Tapi habis makan sedikit sudah kenyang." → **Terkait waktu makan; cepat kenyang**
- _pemberat_peringan_: "Makan pedas, kopi, atau telat makan bikin kambuh. Minum obat maag biasanya mendingan, Dok." → **Dipicu makanan pedas/kopi/telat makan; membaik dengan antasida**
- _riwayat_obat_: "Saya sering minum obat pegal linu, Dok, hampir tiap hari. Habis kerja badan pegal semua." → **Konsumsi obat antinyeri (OAINS) rutin**
- _kebiasaan_: "Makan saya nggak teratur, Dok. Sering nggak sarapan, kopi tiga gelas sehari." → **Pola makan tidak teratur, kopi berlebihan**
- _kebiasaan_: "Lagi banyak pikiran, Dok, kerjaan numpuk." → **Stres psikologis**
- _keparahan_: "Lemas sekali, Dok, kepala kliyengan kalau berdiri." → **Lemas & pusing saat berdiri (curiga perdarahan saluran cerna)**
- _episode_sebelumnya_: "Sudah sering kambuh, Dok, dari zaman sekolah." → **Keluhan berulang lama (dispepsia kronik)**

**Rencana pemeriksaan sesuai indikasi** (dasar penilaian)

| Jenis | Pemeriksaan | Peran | Kondisi | Alasan |
|---|---|---|---|---|
| Fisik | Abdomen | kunci | — | Nyeri tekan epigastrium; singkirkan kolik bilier dan apendisitis. |
| Fisik | Kepala & leher | pendukung | — | Konjungtiva anemis (tanda alarm). |
| Penunjang | Darah lengkap + hitung jenis | komplikasi | trait: perdarahan_saluran_cerna | Anemia akibat perdarahan. |
| Penunjang | Elektrokardiografi (EKG) 12 sadapan | pendukung | usia 45–… | Pada usia > 45 tahun, nyeri epigastrium bisa berasal dari iskemia inferior. |
| Tidak perlu | CT-scan abdomen non-kontras (rujukan) | — | — | CT-scan mahal dan tidak diindikasikan untuk keluhan ini. |
| Tidak perlu | Foto polos abdomen (BNO/KUB) | — | — | Tidak ada kecurigaan batu saluran kemih. |
| Tidak perlu | Tes cepat NS1 dengue | — | — | Tidak ada demam akut yang mengarah ke dengue. |
| Tidak perlu | Serologi dengue IgM/IgG | — | — | Tidak ada demam akut yang mengarah ke dengue. |
| Tidak perlu | Tes cepat (RDT) malaria | — | — | Tidak ada demam/riwayat daerah endemis. |
| Tidak perlu | Apusan darah tebal–tipis (malaria) | — | — | Tidak ada demam/riwayat daerah endemis. |
| Tidak perlu | Tubex TF (IgM anti-Salmonella) | — | — | Tidak ada demam lama yang mengarah ke tifoid. |
| Tidak perlu | Tes Widal | — | — | Tidak ada demam lama yang mengarah ke tifoid. |
| Tidak perlu | Tes Cepat Molekuler (TCM) TB | — | — | Tidak ada gejala yang mengarah ke TB. |
| Tidak perlu | BTA sputum (mikroskopis) | — | — | Tidak ada gejala yang mengarah ke TB. |
| Tidak perlu | HbA1c | — | — | HbA1c tidak membantu diagnosis keluhan akut ini. |
| Tidak perlu | Spirometri sederhana (APE & reversibilitas) | — | — | Tidak ada keluhan sesak/obstruksi saluran napas. |
| Tidak perlu | USG abdomen (termasuk ginjal) | — | — | Tanpa tanda alarm atau nyeri kanan atas, USG tidak diperlukan. |
| Tidak perlu | Rontgen thorax (PA) | — | — | Tidak ada keluhan napas. |

Topik anamnesis kunci: Lokasi & penjalaran, Pemberat & peringan, Riwayat obat, Keluhan lain.

**Diagnosis banding**

| Kondisi | Wajib disingkirkan | Bukti untuk menyingkirkan | Cara membedakan |
|---|---|---|---|
| Penyakit Refluks Gastroesofageal (GERD) | — | anamnesis: Lokasi & penjalaran; anamnesis: Sifat keluhan | GERD: dominan rasa terbakar di belakang tulang dada dan regurgitasi asam, memberat saat berbaring. Dispepsia: nyeri/perih di ulu hati, kembung, cepat kenyang, nyeri tekan epigastrium. |
| Angina Pektoris Stabil | Ya | anamnesis: Pemberat & peringan; Elektrokardiografi (EKG) 12 sadapan | Angina: rasa berat di dada saat aktivitas fisik, membaik dengan istirahat, ada faktor risiko kardiovaskular. Dispepsia: terkait makan, ada nyeri tekan epigastrium. |
| Demam Tifoid | — | Tanda vital lengkap | Tifoid: keluhan perut disertai DEMAM lebih dari seminggu (sore–malam) dan lidah kotor. Dispepsia: tanpa demam. |
| Tukak Peptik | — | anamnesis: Riwayat obat; gejala: BAB hitam (melena) | Tukak peptik: nyeri ulu hati lebih menetap, sering pada pengguna OAINS; dapat berdarah (BAB hitam). |
| Kolik Bilier / Kolesistitis | — | Abdomen | Kolik bilier: nyeri kanan atas setelah makan berlemak, Murphy (+). |
| Pankreatitis Akut | — | anamnesis: Keparahan; anamnesis: Lokasi & penjalaran | Pankreatitis: nyeri epigastrium sangat hebat menjalar ke punggung, muntah. |
| Keganasan Lambung | Ya | gejala: Berat badan turun; gejala: BAB hitam (melena) | Keganasan lambung: usia > 55 tahun, BB turun, anemia, muntah, disfagia. |

**Komplikasi & tanda bahaya**

| Komplikasi | Trait | Tanda bahaya | Cara menilai | Penjelasan |
|---|---|---|---|---|
| Perdarahan saluran cerna atas | perdarahan_saluran_cerna | Ya | gejala: BAB hitam (melena); Darah lengkap + hitung jenis; Kepala & leher; Tanda vital lengkap | BAB hitam (melena), anemia, takikardia → rujuk segera untuk endoskopi. |

**Disposisi** (aturan pertama yang cocok)

- trait: perdarahan_saluran_cerna → **Rujuk segera / IGD**: Perdarahan saluran cerna atas memerlukan penanganan di rumah sakit.
- usia 56–… → **Rujuk ke spesialis (tidak darurat)** (juga diterima: Rawat jalan, edukasi & kontrol): Dispepsia baru pada usia > 55 tahun perlu endoskopi.
- — → **Rawat jalan, edukasi & kontrol**: Dispepsia tanpa tanda alarm dikelola di layanan primer.

**Prinsip tata laksana** (tanpa dosis)

- Hindari pemicu: OAINS/jamu pegal linu, kopi, makanan pedas/asam; makan teratur porsi kecil.
- Terapi simptomatik/penekan asam — keputusan dokter.
- Rujuk endoskopi bila ada tanda alarm atau usia > 55 tahun dengan keluhan baru.

**Langkah penalaran yang dianjurkan**

1. Nyeri ulu hati: lokasi, karakter, hubungan dengan makan, dan obat antinyeri.
2. Cari tanda alarm: BAB hitam, muntah darah, BB turun, anemia, disfagia.
3. Pemeriksaan abdomen; pada usia > 45 tahun dengan faktor risiko, pikirkan iskemia (EKG).
4. Tanpa tanda alarm, diagnosis klinis — tidak perlu pemeriksaan mahal.

**Jebakan penalaran (umpan balik)**

- `{"topicNotAsked":"riwayat_obat","traits":["oains"]}` → Konsumsi OAINS/jamu pegal linu tidak ditanyakan — penyebab gastritis yang sering dan meningkatkan risiko perdarahan.
- `{"traits":["perdarahan_saluran_cerna"],"topicNotAsked":"keluhan_lain"}` → BAB hitam jarang disebut spontan — tanyakan gejala penyerta dan warna BAB secara spesifik.

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
- [ ] Rencana pemeriksaan (kunci/pendukung/komplikasi) & pemeriksaan "tidak perlu" sesuai praktik layanan primer
- [ ] Komplikasi, tanda bahaya, dan aturan disposisi/rujukan tepat
- [ ] Prinsip tata laksana & jebakan penalaran akurat

---

## Infeksi Saluran Kemih Bawah (Sistitis)

- **id**: `isk` · **SKDI**: 4A · **bahaya**: rendah · **sistem**: Saluran kemih · **status**: `BELUM_DITINJAU_DOKTER`
- **Hari sakit saat datang**: 1–5
- **Demografi**: laki-laki 15%; usia 18–30 (bobot 4), 31–45 (bobot 4), 46–60 (bobot 2), 61–75 (bobot 2)
- **Pekerjaan berisiko** (bias 40%): Ibu rumah tangga, Pegawai kantor swasta, Guru, Buruh pabrik, Pedagang pasar
- **Biaya penunjang kunci**: Rp40.000 · semua sesuai rencana: Rp40.000

> Infeksi bakteri (tersering E. coli) pada kandung kemih. Gejala khas: nyeri/perih saat berkemih (disuria), sering dan anyang-anyangan dengan volume sedikit (frekuensi & urgensi), nyeri suprapubik, kadang urin keruh/berbau atau kemerahan. Jauh lebih sering pada perempuan (uretra pendek), terutama usia aktif seksual, kehamilan, dan kurang minum. Biasanya tanpa demam tinggi; demam tinggi dengan nyeri pinggang mengarah ke pielonefritis.

**Trait laten** (aturan pertama yang cocok per id dipakai)

| Trait | Peluang | Kondisi | Keterangan |
|---|---|---|---|
| pielonefritis | 15% | — | Infeksi naik ke ginjal (pielonefritis). |
| isk_berulang | 30% | — | ISK berulang. |
| kurang_minum | 50% | — | Faktor risiko: kurang minum. |
| menahan_kencing | 40% | — | Faktor risiko: kebiasaan menahan berkemih. |
| hematuria | 35% | — | Hematuria (sistitis hemoragik ringan). |
| demam_ringan | 20% | tanpa: pielonefritis | Demam ringan — bila demam tinggi + nyeri pinggang, pikirkan pielonefritis. |
| nitrit_positif | 50% | — |  |

**Gejala**

| Gejala | Peluang | Kondisi |
|---|---|---|
| Demam | 100% | trait: pielonefritis |
| Menggigil | 70% | trait: pielonefritis |
| Nyeri pinggang | 90% | trait: pielonefritis |
| Mual/muntah | 40% | trait: pielonefritis |
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
| Tanda vital lengkap · Suhu aksila | trait: pielonefritis | 100% | 38,5–39,6 °C |
| Tanda vital lengkap · Nadi | trait: pielonefritis | 100% | 98–112 ×/menit |
| Abdomen · Nyeri ketok CVA | trait: pielonefritis | 90% | Positif kanan / Positif kiri |
| Darah lengkap + hitung jenis · Leukosit | trait: pielonefritis | 100% | 12.000–17.000 /µL |
| Darah lengkap + hitung jenis · Neutrofil batang | trait: pielonefritis | 100% | 6–10 % |
| Keadaan umum · Kesan sakit | trait: pielonefritis | 100% | Tampak sakit sedang, menggigil |
| Tanda vital lengkap · Suhu aksila | trait: demam_ringan | 100% | 37,6–38,2 °C |
| Abdomen · Palpasi — nyeri tekan | gejala: nyeri_suprapubik | 80% | Nyeri tekan suprapubik |
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
- _keparahan_: "Berat, Dok. Badan panas menggigil, pinggang juga sakit." → **Demam tinggi + nyeri pinggang (curiga pielonefritis)**
- _progresi_: "Awalnya cuma perih kencing, Dok, sekarang malah demam tinggi dan pinggang sakit." → **Perburukan menjadi demam & nyeri pinggang (infeksi naik ke ginjal)**
- _episode_sebelumnya_: "Dulu pernah kayak gini juga, Dok, setahun ini sudah dua kali." → **ISK berulang (cari faktor penyulit)**

**Rencana pemeriksaan sesuai indikasi** (dasar penilaian)

| Jenis | Pemeriksaan | Peran | Kondisi | Alasan |
|---|---|---|---|---|
| Fisik | Abdomen | kunci | — | Nyeri tekan suprapubik dan nyeri ketok CVA (singkirkan pielonefritis). |
| Penunjang | Urinalisis (urin lengkap) | kunci | — | Leukosituria, nitrit, bakteriuria, hematuria. |
| Penunjang | Darah lengkap + hitung jenis | komplikasi | trait: pielonefritis | Leukositosis pada pielonefritis. |
| Tidak perlu | CT-scan abdomen non-kontras (rujukan) | — | — | CT-scan mahal dan tidak diindikasikan untuk keluhan ini. |
| Tidak perlu | Foto polos abdomen (BNO/KUB) | — | — | Tidak ada kecurigaan batu saluran kemih. |
| Tidak perlu | Elektrokardiografi (EKG) 12 sadapan | — | — | Tidak ada keluhan yang mengarah ke jantung. |
| Tidak perlu | Tes cepat NS1 dengue | — | — | Tidak ada demam akut yang mengarah ke dengue. |
| Tidak perlu | Serologi dengue IgM/IgG | — | — | Tidak ada demam akut yang mengarah ke dengue. |
| Tidak perlu | Tes cepat (RDT) malaria | — | — | Tidak ada demam/riwayat daerah endemis. |
| Tidak perlu | Apusan darah tebal–tipis (malaria) | — | — | Tidak ada demam/riwayat daerah endemis. |
| Tidak perlu | Tubex TF (IgM anti-Salmonella) | — | — | Tidak ada demam lama yang mengarah ke tifoid. |
| Tidak perlu | Tes Widal | — | — | Tidak ada demam lama yang mengarah ke tifoid. |
| Tidak perlu | Tes Cepat Molekuler (TCM) TB | — | — | Tidak ada gejala yang mengarah ke TB. |
| Tidak perlu | BTA sputum (mikroskopis) | — | — | Tidak ada gejala yang mengarah ke TB. |
| Tidak perlu | HbA1c | — | — | HbA1c tidak membantu diagnosis keluhan akut ini. |
| Tidak perlu | Profil lipid | — | — | Profil lipid adalah skrining risiko kardiovaskular, tidak menjawab keluhan akut ini. |
| Tidak perlu | Spirometri sederhana (APE & reversibilitas) | — | — | Tidak ada keluhan sesak/obstruksi saluran napas. |
| Tidak perlu | USG abdomen (termasuk ginjal) | — | — | ISK bawah tanpa komplikasi tidak memerlukan USG. |
| Tidak perlu | Rontgen thorax (PA) | — | — | Tidak ada keluhan napas. |

Topik anamnesis kunci: Sifat keluhan, Pola & waktu, Episode sebelumnya, Kebiasaan & gaya hidup, Keluhan lain.

**Diagnosis banding**

| Kondisi | Wajib disingkirkan | Bukti untuk menyingkirkan | Cara membedakan |
|---|---|---|---|
| Batu Saluran Kemih dengan Kolik (Urolitiasis) | — | anamnesis: Lokasi & penjalaran; anamnesis: Sifat keluhan; Abdomen | Batu: nyeri kolik hebat hilang-timbul di pinggang yang menjalar ke perut bawah/lipat paha, pasien gelisah, hematuria; nyeri ketok CVA positif, USG tampak batu/hidronefrosis. ISK: disuria dan anyang-anyangan tanpa kolik; leukosituria, nitrit dan bakteri positif. |
| Diabetes Melitus Tipe 2 | — | anamnesis: Sifat keluhan; Gula darah sewaktu (GDS); Urinalisis (urin lengkap) | DM: kencing BANYAK (poliuria) terutama malam tanpa perih, disertai haus, lapar, BB turun; gula darah tinggi, glukosuria. ISK: kencing sering tapi SEDIKIT-SEDIKIT dan perih. |
| Pielonefritis Akut | Ya | Tanda vital lengkap; Abdomen | Pielonefritis: demam tinggi, menggigil, nyeri pinggang, nyeri ketok CVA. ISK bawah: tanpa demam tinggi atau nyeri pinggang. |
| Uretritis (Infeksi Menular Seksual) | — | anamnesis: Kebiasaan & gaya hidup | Uretritis IMS: duh uretra, riwayat hubungan seksual berisiko. |

**Komplikasi & tanda bahaya**

| Komplikasi | Trait | Tanda bahaya | Cara menilai | Penjelasan |
|---|---|---|---|---|
| Pielonefritis (ISK atas) | pielonefritis | Ya | gejala: Demam; gejala: Nyeri pinggang; Tanda vital lengkap; Abdomen | Demam tinggi, menggigil, nyeri pinggang, nyeri ketok CVA, leukositosis. |

**Disposisi** (aturan pertama yang cocok)

- trait: pielonefritis → **Rawat jalan dengan pemantauan ketat / kontrol ulang** (juga diterima: Rujuk ke spesialis (tidak darurat)): Pielonefritis ringan dapat rawat jalan dengan kontrol ketat 48–72 jam; rujuk bila muntah, sepsis, atau tidak membaik.
- — → **Rawat jalan, edukasi & kontrol**: ISK bawah tanpa komplikasi: rawat jalan, edukasi minum cukup dan tidak menahan kencing.

**Prinsip tata laksana** (tanpa dosis)

- Minum cukup, jangan menahan kencing, higiene genital.
- Antibiotik empiris sesuai pedoman — keputusan dokter.
- Cari faktor penyulit bila berulang, pada laki-laki, hamil, atau DM.

**Langkah penalaran yang dianjurkan**

1. Disuria + sering kencing: tanyakan volume kencing (sedikit-sedikit vs banyak), demam, nyeri pinggang, episode sebelumnya.
2. Periksa suhu, nyeri tekan suprapubik, dan nyeri ketok CVA.
3. Urinalisis: leukosituria, nitrit, bakteriuria.
4. Bedakan ISK bawah, pielonefritis, batu, dan DM.

**Jebakan penalaran (umpan balik)**

- `{"excluded":"isk","toolDone":"urinalisis","notTraits":["nitrit_positif"]}` → Nitrit negatif tidak menyingkirkan ISK — sensitivitasnya hanya sekitar 50%.
- `{"traits":["pielonefritis"],"notConsidered":"pielonefritis"}` → Demam tinggi dengan nyeri pinggang pada ISK harus memicu pertimbangan pielonefritis.

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
- [ ] Rencana pemeriksaan (kunci/pendukung/komplikasi) & pemeriksaan "tidak perlu" sesuai praktik layanan primer
- [ ] Komplikasi, tanda bahaya, dan aturan disposisi/rujukan tepat
- [ ] Prinsip tata laksana & jebakan penalaran akurat

---

## Batu Saluran Kemih dengan Kolik (Urolitiasis)

- **id**: `batu_saluran_kemih` · **SKDI**: 3A · **bahaya**: sedang · **sistem**: Saluran kemih · **status**: `BELUM_DITINJAU_DOKTER`
- **Hari sakit saat datang**: 1–3
- **Demografi**: laki-laki 70%; usia 25–35 (bobot 3), 36–50 (bobot 5), 51–65 (bobot 2), 66–75 (bobot 1)
- **Pekerjaan berisiko** (bias 50%): Sopir truk, Pekerja proyek bangunan, Satpam, Pengemudi ojek online, Petani
- **Biaya penunjang kunci**: Rp340.000 · semua sesuai rencana: Rp530.000

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
| batu_tampak_usg | 80% | trait: hidronefrosis | Batu terlihat jelas pada USG. |
| batu_tampak_usg | 60% | — | Batu terlihat jelas pada USG. |
| radioopak | 80% | — | Batu radioopak (tampak pada foto polos BNO). |
| infeksi_obstruktif | 10% | trait: hidronefrosis | Infeksi pada saluran kemih yang tersumbat — kegawatan urologi. |
| gangguan_fungsi_ginjal | 20% | trait: hidronefrosis | Gangguan fungsi ginjal akibat sumbatan. |

**Gejala**

| Gejala | Peluang | Kondisi |
|---|---|---|
| Demam | 100% | trait: infeksi_obstruktif |
| Menggigil | 70% | trait: infeksi_obstruktif |
| Nyeri pinggang | 100% | — |
| Mual/muntah | 60% | — |
| Kencing berwarna merah (hematuria) | 100% | trait: hematuria_makro |
| Sering berkemih | 80% | trait: batu_distal |
| Nyeri/perih saat berkemih (disuria) | 40% | trait: batu_distal |

Keluhan utama (prioritas): nyeri_pinggang; tambahan: mual_muntah, kencing_merah. Salah kaprah pasien: salah urat, encok, masuk angin, maag.

**Temuan pemeriksaan abnormal** (parameter lain = normal)

| Alat · parameter | Kondisi | Peluang | Nilai |
|---|---|---|---|
| Tanda vital lengkap · Suhu aksila | trait: infeksi_obstruktif | 100% | 38,3–39,4 °C |
| Tanda vital lengkap · Nadi | trait: infeksi_obstruktif | 100% | 105–120 ×/menit |
| Darah lengkap + hitung jenis · Leukosit | trait: infeksi_obstruktif | 100% | 14.000–19.000 /µL |
| Urinalisis (urin lengkap) · Leukosit esterase | trait: infeksi_obstruktif | 100% | +2 / +3 |
| Urinalisis (urin lengkap) · Sedimen leukosit | trait: infeksi_obstruktif | 100% | 20–50 /LPB |
| Urinalisis (urin lengkap) · Bakteri | trait: infeksi_obstruktif | 100% | Positif (++) |
| Fungsi ginjal · Kreatinin | laki-laki; trait: gangguan_fungsi_ginjal | 100% | 1,5–2,2 mg/dL |
| Fungsi ginjal · Kreatinin | perempuan; trait: gangguan_fungsi_ginjal | 100% | 1,3–1,9 mg/dL |
| Fungsi ginjal · Ureum | trait: gangguan_fungsi_ginjal | 100% | 55–80 mg/dL |
| Keadaan umum · Kesan sakit | trait: infeksi_obstruktif | 100% | Tampak sakit berat, menggigil |
| Tanda vital lengkap · Nadi | — | 100% | 88–108 ×/menit |
| Tanda vital lengkap · Tekanan darah sistolik | — | 50% | 130–150 mmHg |
| Abdomen · Nyeri ketok CVA | trait: sisi_kanan | 85% | Positif kanan |
| Abdomen · Nyeri ketok CVA | trait: sisi_kiri | 85% | Positif kiri |
| Abdomen · Palpasi — nyeri tekan | trait: sisi_kanan | 40% | Nyeri tekan ringan regio lumbal–inguinal kanan |
| Abdomen · Palpasi — nyeri tekan | trait: sisi_kiri | 40% | Nyeri tekan ringan regio lumbal–inguinal kiri |
| Urinalisis (urin lengkap) · Warna & kejernihan | trait: hematuria_makro | 100% | Merah muda, keruh |
| Urinalisis (urin lengkap) · Darah (dipstik) | trait: hematuria_makro | 100% | +3 |
| Urinalisis (urin lengkap) · Darah (dipstik) | — | 80% (sensitivitas) | +1 / +2 |
| Urinalisis (urin lengkap) · Sedimen eritrosit | trait: hematuria_makro | 100% | 50–100 /LPB |
| Urinalisis (urin lengkap) · Sedimen eritrosit | — | 80% (sensitivitas) | 6–40 /LPB |
| Urinalisis (urin lengkap) · Kristal | — | 40% | Kalsium oksalat (+) / Asam urat (+) |
| Urinalisis (urin lengkap) · Sedimen leukosit | — | 30% | 6–12 /LPB |
| Urinalisis (urin lengkap) · Berat jenis | trait: kurang_minum | 100% | 1,025–1,030  |
| Darah lengkap + hitung jenis · Leukosit | — | 30% | 10.500–13.000 /µL |
| USG abdomen (termasuk ginjal) · Ginjal kanan & kiri | trait: sisi_kanan + hidronefrosis + batu_tampak_usg | 100% | Hidronefrosis ringan ginjal kanan; tampak batu di ureter proksimal kanan ± 6 mm |
| USG abdomen (termasuk ginjal) · Ginjal kanan & kiri | trait: sisi_kanan + hidronefrosis | 100% | Hidronefrosis ringan ginjal kanan; penyebab sumbatan tidak tampak (ureter distal sulit dinilai) |
| USG abdomen (termasuk ginjal) · Ginjal kanan & kiri | trait: sisi_kanan + batu_tampak_usg | 100% | Tampak batu di pelvis ginjal kanan ± 5 mm, tanpa hidronefrosis |
| USG abdomen (termasuk ginjal) · Ginjal kanan & kiri | trait: sisi_kiri + hidronefrosis + batu_tampak_usg | 100% | Hidronefrosis ringan ginjal kiri; tampak batu di ureter proksimal kiri ± 6 mm |
| USG abdomen (termasuk ginjal) · Ginjal kanan & kiri | trait: sisi_kiri + hidronefrosis | 100% | Hidronefrosis ringan ginjal kiri; penyebab sumbatan tidak tampak (ureter distal sulit dinilai) |
| USG abdomen (termasuk ginjal) · Ginjal kanan & kiri | trait: sisi_kiri + batu_tampak_usg | 100% | Tampak batu di pelvis ginjal kiri ± 5 mm, tanpa hidronefrosis |
| USG abdomen (termasuk ginjal) · Kesan | trait: hidronefrosis + batu_tampak_usg | 100% | Urolitiasis dengan hidronefrosis ringan |
| USG abdomen (termasuk ginjal) · Kesan | trait: hidronefrosis | 100% | Hidronefrosis ringan; penyebab sumbatan belum tampak — pertimbangkan batu ureter distal atau massa |
| USG abdomen (termasuk ginjal) · Kesan | trait: batu_tampak_usg | 100% | Nefrolitiasis tanpa hidronefrosis |
| Foto polos abdomen (BNO/KUB) · Bayangan batu | trait: sisi_kanan + radioopak | 100% | Bayangan radioopak ± 6 mm pada proyeksi ureter/ginjal kanan |
| Foto polos abdomen (BNO/KUB) · Bayangan batu | trait: sisi_kiri + radioopak | 100% | Bayangan radioopak ± 6 mm pada proyeksi ureter/ginjal kiri |
| Foto polos abdomen (BNO/KUB) · Kesan | trait: radioopak | 100% | Suspek batu saluran kemih radioopak |
| CT-scan abdomen non-kontras (rujukan) · Ginjal & ureter | trait: sisi_kanan + hidronefrosis | 100% | Batu ureter kanan ± 6 mm dengan hidronefrosis ringan; tidak tampak massa |
| CT-scan abdomen non-kontras (rujukan) · Ginjal & ureter | trait: sisi_kanan | 100% | Batu pelvis ginjal kanan ± 5 mm tanpa sumbatan; tidak tampak massa |
| CT-scan abdomen non-kontras (rujukan) · Ginjal & ureter | trait: sisi_kiri + hidronefrosis | 100% | Batu ureter kiri ± 6 mm dengan hidronefrosis ringan; tidak tampak massa |
| CT-scan abdomen non-kontras (rujukan) · Ginjal & ureter | trait: sisi_kiri | 100% | Batu pelvis ginjal kiri ± 5 mm tanpa sumbatan; tidak tampak massa |
| CT-scan abdomen non-kontras (rujukan) · Kesan | — | 100% | Urolitiasis |
| Keadaan umum · Kesan sakit | — | 100% | Tampak kesakitan, gelisah berganti-ganti posisi |

**Petunjuk anamnesis** (jawaban bertanda petunjuk)

- _onset_: "Mulai {hariTeks} hari lalu, Dok, mendadak sakit sekali." → **Nyeri mendadak dan hebat**
- _lokasi_: "Di pinggang kanan, Dok, terus menjalar ke perut bawah sampai selangkangan." → **Nyeri pinggang menjalar ke perut bawah/lipat paha**
- _lokasi_: "Di pinggang kiri, Dok, terus menjalar ke perut bawah sampai selangkangan." → **Nyeri pinggang menjalar ke perut bawah/lipat paha**
- _karakter_: "Sakitnya melilit, datang dan pergi, Dok. Kalau datang saya sampai nggak bisa diam, guling-guling." → **Nyeri kolik; pasien gelisah mencari posisi**
- _pola_: "Hilang timbul, Dok. Tiap setengah jam kambuh lagi." → **Kolik hilang-timbul**
- _riwayat_keluarga_: "Bapak saya dulu operasi batu ginjal, Dok." → **Riwayat keluarga batu saluran kemih**
- _kebiasaan_: "Kerja di bawah panas seharian, Dok, minumnya jarang. Kencing juga kuning pekat." → **Kurang minum dan bekerja di lingkungan panas**
- _kebiasaan_: "Saya jarang minum air putih, Dok. Lebih sering kopi dan teh manis." → **Kurang minum air putih**
- _durasi_: "Sekali serangan bisa setengah jam sampai sejam, Dok, lalu reda, terus datang lagi." → **Nyeri kolik hilang-timbul**
- _keparahan_: "Sakit sekali, Dok, paling sakit seumur hidup. Sampai muntah-muntah." → **Nyeri sangat hebat disertai muntah**
- _progresi_: "Dari semalam badan juga panas menggigil, Dok." → **Demam pada sumbatan saluran kemih (curiga infeksi obstruktif — gawat)**
- _episode_sebelumnya_: "Dua tahun lalu pernah keluar batu kecil waktu kencing, Dok." → **Riwayat batu sebelumnya (penyakit kambuhan)**

**Rencana pemeriksaan sesuai indikasi** (dasar penilaian)

| Jenis | Pemeriksaan | Peran | Kondisi | Alasan |
|---|---|---|---|---|
| Fisik | Abdomen | kunci | — | Nyeri ketok CVA; singkirkan apendisitis (McBurney) dan kolik bilier (Murphy). |
| Fisik | Keadaan umum | pendukung | — | Pasien kolik tampak gelisah berganti posisi. |
| Penunjang | Urinalisis (urin lengkap) | kunci | — | Hematuria, kristal, dan tanda infeksi. |
| Penunjang | USG abdomen (termasuk ginjal) | kunci | — | Batu, hidronefrosis (sumbatan), dan massa. |
| Penunjang | Fungsi ginjal | komplikasi | — | Menilai komplikasi pada fungsi ginjal (normal tidak menyingkirkan batu). |
| Penunjang | Foto polos abdomen (BNO/KUB) | pendukung | — | Batu radioopak. |
| Penunjang | Darah lengkap + hitung jenis | komplikasi | trait: infeksi_obstruktif | Leukositosis pada infeksi obstruktif. |
| Penunjang | CT-scan abdomen non-kontras (rujukan) | pendukung | trait: hidronefrosis; tanpa: batu_tampak_usg | Sumbatan tanpa batu yang tampak: cari batu ureter distal atau massa. |
| Tidak perlu | Elektrokardiografi (EKG) 12 sadapan | — | — | Tidak ada keluhan yang mengarah ke jantung. |
| Tidak perlu | Tes cepat NS1 dengue | — | — | Tidak ada demam akut yang mengarah ke dengue. |
| Tidak perlu | Serologi dengue IgM/IgG | — | — | Tidak ada demam akut yang mengarah ke dengue. |
| Tidak perlu | Tes cepat (RDT) malaria | — | — | Tidak ada demam/riwayat daerah endemis. |
| Tidak perlu | Apusan darah tebal–tipis (malaria) | — | — | Tidak ada demam/riwayat daerah endemis. |
| Tidak perlu | Tubex TF (IgM anti-Salmonella) | — | — | Tidak ada demam lama yang mengarah ke tifoid. |
| Tidak perlu | Tes Widal | — | — | Tidak ada demam lama yang mengarah ke tifoid. |
| Tidak perlu | Tes Cepat Molekuler (TCM) TB | — | — | Tidak ada gejala yang mengarah ke TB. |
| Tidak perlu | BTA sputum (mikroskopis) | — | — | Tidak ada gejala yang mengarah ke TB. |
| Tidak perlu | Profil lipid | — | — | Profil lipid adalah skrining risiko kardiovaskular, tidak menjawab keluhan akut ini. |
| Tidak perlu | HbA1c | — | — | HbA1c tidak membantu diagnosis keluhan akut ini. |
| Tidak perlu | Spirometri sederhana (APE & reversibilitas) | — | — | Tidak ada keluhan sesak/obstruksi saluran napas. |
| Tidak perlu | Rontgen thorax (PA) | — | — | Tidak ada keluhan napas. |

Topik anamnesis kunci: Lokasi & penjalaran, Sifat keluhan, Durasi tiap episode, Episode sebelumnya, Kebiasaan & gaya hidup.

**Diagnosis banding**

| Kondisi | Wajib disingkirkan | Bukti untuk menyingkirkan | Cara membedakan |
|---|---|---|---|
| Infeksi Saluran Kemih Bawah (Sistitis) | — | anamnesis: Lokasi & penjalaran; anamnesis: Sifat keluhan; Urinalisis (urin lengkap) | ISK: disuria dan anyang-anyangan dengan nyeri suprapubik, tanpa kolik pinggang; leukosituria dan bakteriuria. Batu: kolik hebat hilang-timbul di pinggang yang menjalar ke lipat paha, hematuria, nyeri ketok CVA, USG tampak batu/hidronefrosis. |
| Pielonefritis Akut | Ya | Tanda vital lengkap; Urinalisis (urin lengkap) | Pielonefritis: demam tinggi, menggigil, leukosituria berat; nyeri pinggang tumpul menetap, bukan kolik. |
| Apendisitis Akut | Ya | Abdomen | Apendisitis: nyeri berpindah ke kanan bawah, McBurney (+), demam ringan; urinalisis umumnya normal. |
| Kolik Bilier / Kolesistitis | — | Abdomen; USG abdomen (termasuk ginjal) | Kolik bilier: nyeri kanan atas setelah makan berlemak, Murphy (+); USG tampak batu empedu. |
| Massa / Tumor Saluran Kemih | Ya | USG abdomen (termasuk ginjal); CT-scan abdomen non-kontras (rujukan) | Massa saluran kemih: hematuria tanpa nyeri pada usia lanjut/perokok, sumbatan tanpa batu yang jelas; perlu CT. |
| Dispepsia / Gastritis | — | anamnesis: Lokasi & penjalaran; anamnesis: Sifat keluhan; Urinalisis (urin lengkap) | Dispepsia: perih ulu hati terkait makan dengan nyeri tekan epigastrium. Batu: nyeri pinggang kolik menjalar ke lipat paha, nyeri ketok CVA, hematuria. |

**Komplikasi & tanda bahaya**

| Komplikasi | Trait | Tanda bahaya | Cara menilai | Penjelasan |
|---|---|---|---|---|
| Sumbatan / hidronefrosis | hidronefrosis | — | USG abdomen (termasuk ginjal); CT-scan abdomen non-kontras (rujukan) | Batu menyumbat aliran urin; perlu evaluasi urologi. Sumbatan tanpa batu yang tampak → cari batu distal atau massa. |
| Infeksi pada saluran kemih yang tersumbat | infeksi_obstruktif | Ya | gejala: Demam; Tanda vital lengkap; Darah lengkap + hitung jenis; Urinalisis (urin lengkap) | Demam + sumbatan = kegawatan (pionefrosis/urosepsis); perlu dekompresi segera. |
| Gangguan fungsi ginjal | gangguan_fungsi_ginjal | — | Fungsi ginjal | Kreatinin naik/eGFR turun akibat sumbatan. Fungsi ginjal normal TIDAK menyingkirkan batu. |

**Disposisi** (aturan pertama yang cocok)

- trait: infeksi_obstruktif → **Rujuk segera / IGD**: Sumbatan dengan infeksi adalah kegawatan urologi.
- trait: hidronefrosis → **Rujuk ke spesialis (tidak darurat)**: Sumbatan/hidronefrosis atau gangguan fungsi ginjal: rujuk urologi.
- — → **Rujuk ke spesialis (tidak darurat)** (juga diterima: Rawat jalan dengan pemantauan ketat / kontrol ulang, Rawat jalan, edukasi & kontrol): Batu saluran kemih (SKDI 3A): atasi nyeri, lalu rujuk urologi untuk evaluasi; batu kecil tanpa sumbatan dapat diobservasi.

**Prinsip tata laksana** (tanpa dosis)

- Atasi nyeri kolik (analgesik) — keputusan dokter.
- Minum air cukup; saring urin untuk menangkap batu.
- Rujuk urologi untuk evaluasi; segera bila demam/infeksi, gangguan fungsi ginjal, atau nyeri tidak teratasi.

**Langkah penalaran yang dianjurkan**

1. Nyeri pinggang kolik: tanyakan penjalaran, pola hilang-timbul, hematuria, episode sebelumnya, dan kebiasaan minum.
2. Periksa nyeri ketok CVA dan singkirkan akut abdomen (apendisitis, kolik bilier; pada perempuan, kehamilan ektopik).
3. Urinalisis (hematuria, kristal, infeksi) dan USG (batu, hidronefrosis, massa).
4. Fungsi ginjal menilai komplikasi — hasil normal TIDAK menyingkirkan batu.
5. Sumbatan tanpa batu yang tampak → pikirkan batu ureter distal atau massa; lanjutkan dengan BNO/CT.

**Jebakan penalaran (umpan balik)**

- `{"excluded":"batu_saluran_kemih","toolNormal":"fungsi_ginjal"}` → Fungsi ginjal normal tidak menyingkirkan batu saluran kemih — ginjal sisi lain mengompensasi.
- `{"excluded":"batu_saluran_kemih","toolNormal":"foto_bno"}` → BNO normal tidak menyingkirkan batu: batu radiolusen (mis. asam urat) tidak tampak.
- `{"traits":["hidronefrosis"],"notTraits":["batu_tampak_usg"],"toolDone":"usg_abdomen","notConsidered":"massa_saluran_kemih"}` → Sumbatan (hidronefrosis) tanpa batu yang tampak harus memicu pertimbangan penyebab lain, termasuk massa — lanjutkan dengan pencitraan.

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
- [ ] Rencana pemeriksaan (kunci/pendukung/komplikasi) & pemeriksaan "tidak perlu" sesuai praktik layanan primer
- [ ] Komplikasi, tanda bahaya, dan aturan disposisi/rujukan tepat
- [ ] Prinsip tata laksana & jebakan penalaran akurat

---

## Diabetes Melitus Tipe 2

- **id**: `dm_tipe2` · **SKDI**: 4A · **bahaya**: sedang · **sistem**: Endokrin & metabolik · **status**: `BELUM_DITINJAU_DOKTER`
- **Hari sakit saat datang**: 14–180
- **Demografi**: laki-laki 45%; usia 30–40 (bobot 1), 41–55 (bobot 4), 56–75 (bobot 4)
- **Pekerjaan berisiko** (bias 50%): Pensiunan, Pengusaha, Ibu rumah tangga, Pegawai negeri, Pegawai kantor swasta, Pedagang pasar
- **Biaya penunjang kunci**: Rp25.000 · semua sesuai rencana: Rp385.000

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
| ulkus_kaki | 25% | trait: neuropati | Komplikasi: ulkus kaki diabetik. |
| nefropati | 25% | — | Komplikasi: nefropati diabetik (proteinuria, eGFR turun). |
| hiperglikemia_berat | 5% | — | Hiperglikemia berat dengan ketosis — perlu rujuk segera. |

**Gejala**

| Gejala | Peluang | Kondisi |
|---|---|---|
| Luka lama sembuh | 100% | trait: ulkus_kaki |
| Luka lama sembuh | 10% | — |
| Mual/muntah | 80% | trait: hiperglikemia_berat |
| Sering berkemih | 85% | — |
| Lemas | 100% | — |
| Sering haus (polidipsia) | 80% | — |
| Sering lapar (polifagia) | 50% | — |
| Berat badan turun | 60% | — |
| Kesemutan/kebas di tangan atau kaki | 90% | trait: neuropati |
| Pandangan kabur | 25% | — |

Keluhan utama (prioritas): sering_kencing → lemas; tambahan: lemas, kesemutan, berat_badan_turun. Salah kaprah pasien: kecapekan, kurang minum, asam urat, anyang-anyangan.

**Temuan pemeriksaan abnormal** (parameter lain = normal)

| Alat · parameter | Kondisi | Peluang | Nilai |
|---|---|---|---|
| Gula darah sewaktu (GDS) · Glukosa darah sewaktu | trait: hiperglikemia_berat | 100% | 420–560 mg/dL |
| Urinalisis (urin lengkap) · Keton | trait: hiperglikemia_berat | 100% | +2 |
| Keadaan umum · Status hidrasi | trait: hiperglikemia_berat | 100% | Mukosa kering, turgor kulit menurun |
| Keadaan umum · Kesan sakit | trait: hiperglikemia_berat | 100% | Tampak lemas, napas agak cepat |
| Urinalisis (urin lengkap) · Protein | trait: nefropati | 100% | +1 / +2 |
| Fungsi ginjal · Kreatinin | laki-laki; trait: nefropati | 100% | 1,3–1,8 mg/dL |
| Fungsi ginjal · Kreatinin | perempuan; trait: nefropati | 100% | 1,1–1,5 mg/dL |
| Fungsi ginjal · Ureum | trait: nefropati | 100% | 45–65 mg/dL |
| Antropometri (timbangan & pita ukur) · Indeks massa tubuh (IMT) | trait: obesitas | 100% | 25,5–34,0 kg/m² |
| Antropometri (timbangan & pita ukur) · Lingkar perut | laki-laki; trait: obesitas | 100% | 93–115 cm |
| Antropometri (timbangan & pita ukur) · Lingkar perut | perempuan; trait: obesitas | 100% | 83–105 cm |
| Tanda vital lengkap · Tekanan darah sistolik | trait: hipertensi | 100% | 140–165 mmHg |
| Tanda vital lengkap · Tekanan darah diastolik | trait: hipertensi | 100% | 90–100 mmHg |
| Gula darah sewaktu (GDS) · Glukosa darah sewaktu | trait: glukosuria | 95% (sensitivitas) | 220–420 mg/dL |
| Gula darah sewaktu (GDS) · Glukosa darah sewaktu | — | 80% (sensitivitas) | 200–260 mg/dL |
| HbA1c · HbA1c | — | 95% (sensitivitas) | 6,6–11,5 % |
| Urinalisis (urin lengkap) · Glukosa | trait: glukosuria | 100% | +1 / +2 / +3 |
| Urinalisis (urin lengkap) · Keton | trait: glukosuria | 10% | +1 |
| Profil lipid · Trigliserida | trait: dislipidemia | 100% | 160–320 mg/dL |
| Profil lipid · Kolesterol HDL | laki-laki; trait: dislipidemia | 100% | 28–39 mg/dL |
| Profil lipid · Kolesterol HDL | perempuan; trait: dislipidemia | 100% | 34–49 mg/dL |
| Profil lipid · Kolesterol LDL | trait: dislipidemia | 60% | 135–190 mg/dL |
| Pemeriksaan kaki diabetik · Inspeksi kaki | trait: ulkus_kaki | 100% | Ulkus ± 1,5 cm di telapak kaki kanan, dasar merah, tanpa nanah |
| Pemeriksaan kaki diabetik · Monofilamen 10 g | trait: neuropati | 100% | Sensibilitas menurun (6/10 titik) di kedua telapak kaki |
| Pemeriksaan kaki diabetik · Pulsasi a. dorsalis pedis & tibialis posterior | trait: ulkus_kaki | 40% | Pulsasi a. dorsalis pedis kanan melemah |
| Neurologis singkat · Sensorik | trait: neuropati | 100% | Hipestesia distal kedua tungkai (pola kaus kaki) |
| Keadaan umum · Status gizi (kesan) | trait: obesitas | 100% | Kesan gizi lebih (obesitas) |
| Ekstremitas & kulit · Kulit | trait: ulkus_kaki | 100% | Luka di telapak kaki kanan |

**Petunjuk anamnesis** (jawaban bertanda petunjuk)

- _karakter_: "Kencingnya banyak, Dok, tapi nggak perih sama sekali. Malam bisa bangun tiga-empat kali." → **Poliuria & nokturia tanpa disuria**
- _pola_: "Gampang haus, Dok, minum terus tapi tetap haus." → **Polidipsia**
- _pemberat_peringan_: "Cepat lapar, Dok. Makan banyak, tapi berat badan malah turun." → **Polifagia dengan penurunan berat badan**
- _pemberat_peringan_: "Cepat lapar, Dok, makannya jadi banyak." → **Polifagia**
- _riwayat_penyakit_: "Saya darah tinggi, Dok, obatnya kadang lupa." → **Hipertensi (komorbid)**
- _riwayat_keluarga_: "Ibu saya kencing manis, Dok, sampai jari kakinya diamputasi." → **Riwayat keluarga DM**
- _kebiasaan_: "Saya suka yang manis-manis, Dok, teh manis tiap hari. Olahraga hampir nggak pernah." → **Pola makan tinggi gula dan kurang aktivitas fisik**
- _kebiasaan_: "Makan biasa, Dok, tapi memang jarang gerak." → **Kurang aktivitas fisik**
- _keparahan_: "Lemas sekali, Dok, mual, haus terus nggak berhenti." → **Lemas berat & mual (curiga dekompensasi metabolik)**
- _progresi_: "Pelan-pelan makin lemas, Dok, berat badan juga turun." → **Penurunan berat badan progresif**

**Rencana pemeriksaan sesuai indikasi** (dasar penilaian)

| Jenis | Pemeriksaan | Peran | Kondisi | Alasan |
|---|---|---|---|---|
| Fisik | Antropometri (timbangan & pita ukur) | kunci | — | IMT dan lingkar perut (obesitas sentral). |
| Fisik | Pemeriksaan kaki diabetik | komplikasi | — | Neuropati, ulkus, dan pulsasi kaki. |
| Fisik | Neurologis singkat | pendukung | — | Sensibilitas distal. |
| Penunjang | Gula darah sewaktu (GDS) _(grup gula)_ | kunci | — | Diagnosis: GDS ≥ 200 mg/dL dengan gejala klasik. |
| Penunjang | HbA1c | pendukung | — | Konfirmasi dan menilai kendali gula 2–3 bulan. |
| Penunjang | Urinalisis (urin lengkap) | komplikasi | — | Glukosuria, ketonuria, proteinuria. |
| Penunjang | Fungsi ginjal | komplikasi | — | eGFR (nefropati diabetik). |
| Penunjang | Profil lipid | pendukung | — | Faktor risiko kardiovaskular. |
| Tidak perlu | CT-scan abdomen non-kontras (rujukan) | — | — | CT-scan mahal dan tidak diindikasikan untuk keluhan ini. |
| Tidak perlu | Foto polos abdomen (BNO/KUB) | — | — | Tidak ada kecurigaan batu saluran kemih. |
| Tidak perlu | Tes cepat NS1 dengue | — | — | Tidak ada demam akut yang mengarah ke dengue. |
| Tidak perlu | Serologi dengue IgM/IgG | — | — | Tidak ada demam akut yang mengarah ke dengue. |
| Tidak perlu | Tes cepat (RDT) malaria | — | — | Tidak ada demam/riwayat daerah endemis. |
| Tidak perlu | Apusan darah tebal–tipis (malaria) | — | — | Tidak ada demam/riwayat daerah endemis. |
| Tidak perlu | Tubex TF (IgM anti-Salmonella) | — | — | Tidak ada demam lama yang mengarah ke tifoid. |
| Tidak perlu | Tes Widal | — | — | Tidak ada demam lama yang mengarah ke tifoid. |
| Tidak perlu | Tes Cepat Molekuler (TCM) TB | — | — | Tidak ada gejala yang mengarah ke TB. |
| Tidak perlu | BTA sputum (mikroskopis) | — | — | Tidak ada gejala yang mengarah ke TB. |
| Tidak perlu | Spirometri sederhana (APE & reversibilitas) | — | — | Tidak ada keluhan sesak/obstruksi saluran napas. |
| Tidak perlu | USG abdomen (termasuk ginjal) | — | — | USG tidak diperlukan untuk diagnosis DM. |
| Tidak perlu | Rontgen thorax (PA) | — | — | Tidak ada keluhan napas. |

Topik anamnesis kunci: Sifat keluhan, Keluhan lain, Riwayat keluarga, Kebiasaan & gaya hidup.

**Diagnosis banding**

| Kondisi | Wajib disingkirkan | Bukti untuk menyingkirkan | Cara membedakan |
|---|---|---|---|
| Infeksi Saluran Kemih Bawah (Sistitis) | — | anamnesis: Sifat keluhan; Urinalisis (urin lengkap) | ISK: kencing sering tapi sedikit-sedikit dan perih (disuria), nyeri suprapubik; urinalisis leukosituria. DM: poliuria tanpa perih, haus, lapar, BB turun; gula darah tinggi dan glukosuria. |
| Tuberkulosis Paru | Ya | gejala: Batuk; gejala: Keringat malam; Rontgen thorax (PA) | TB: berat badan turun disertai batuk ≥ 2 minggu, keringat malam, demam subfebris; BTA/TCM positif. DM: poliuria, polidipsia, polifagia; gula darah tinggi. Keduanya bisa bersamaan — DM meningkatkan risiko TB. |

**Komplikasi & tanda bahaya**

| Komplikasi | Trait | Tanda bahaya | Cara menilai | Penjelasan |
|---|---|---|---|---|
| Neuropati diabetik | neuropati | — | gejala: Kesemutan/kebas di tangan atau kaki; Pemeriksaan kaki diabetik; Neurologis singkat | Kesemutan/kebas dengan sensibilitas monofilamen menurun — risiko ulkus kaki. |
| Nefropati diabetik | nefropati | — | Urinalisis (urin lengkap); Fungsi ginjal | Proteinuria dan/atau penurunan eGFR; perlu pengendalian gula & tekanan darah yang ketat. |
| Ulkus kaki diabetik | ulkus_kaki | Ya | Pemeriksaan kaki diabetik | Luka di kaki pasien DM berisiko infeksi & amputasi; perlu perawatan luka dan evaluasi vaskular. |
| Hiperglikemia berat / ketosis | hiperglikemia_berat | Ya | Gula darah sewaktu (GDS); Urinalisis (urin lengkap); Keadaan umum | GDS sangat tinggi dengan ketonuria dan dehidrasi → rujuk segera. |

**Disposisi** (aturan pertama yang cocok)

- trait: hiperglikemia_berat → **Rujuk segera / IGD**: Hiperglikemia berat dengan ketosis memerlukan penanganan di rumah sakit.
- trait: ulkus_kaki → **Rujuk ke spesialis (tidak darurat)** (juga diterima: Rawat jalan, edukasi & kontrol): Ulkus kaki diabetik: perawatan luka dan evaluasi; rujuk bila infeksi/iskemia.
- — → **Rawat jalan, edukasi & kontrol** (juga diterima: Rawat jalan dengan pemantauan ketat / kontrol ulang): DM tipe 2 tanpa komplikasi akut dikelola di layanan primer (edukasi, nutrisi, aktivitas, farmakoterapi).

**Prinsip tata laksana** (tanpa dosis)

- Edukasi, terapi nutrisi medis, dan aktivitas fisik.
- Farmakoterapi sesuai pedoman PERKENI — keputusan dokter.
- Skrining komplikasi berkala: kaki, ginjal (eGFR, albuminuria), mata, kardiovaskular.
- Kendalikan komorbid: tekanan darah, lipid, dan berat badan.

**Langkah penalaran yang dianjurkan**

1. Poliuria/polidipsia/polifagia/BB turun: tanyakan volume kencing, riwayat keluarga, dan gaya hidup.
2. Antropometri, tanda vital, dan pemeriksaan kaki.
3. GDS ≥ 200 dengan gejala klasik atau HbA1c ≥ 6,5% untuk diagnosis.
4. Nilai komplikasi: neuropati, ulkus, nefropati (urinalisis, eGFR), hiperglikemia berat.
5. Catat komorbid: hipertensi, dislipidemia, obesitas.

**Jebakan penalaran (umpan balik)**

- `{"excluded":"dm_tipe2","toolNormal":"urinalisis"}` → Glukosuria tidak selalu ada; diagnosis DM ditegakkan dengan gula darah atau HbA1c.
- `{"traits":["neuropati"],"notConsidered":"dm_tipe2"}` → Kesemutan pada pasien dengan poliuria adalah petunjuk komplikasi DM.

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
- [ ] Rencana pemeriksaan (kunci/pendukung/komplikasi) & pemeriksaan "tidak perlu" sesuai praktik layanan primer
- [ ] Komplikasi, tanda bahaya, dan aturan disposisi/rujukan tepat
- [ ] Prinsip tata laksana & jebakan penalaran akurat

---

## Tuberkulosis Paru

- **id**: `tb_paru` · **SKDI**: 4A · **bahaya**: tinggi · **sistem**: Pernapasan · **status**: `BELUM_DITINJAU_DOKTER`
- **Hari sakit saat datang**: 14–90
- **Demografi**: laki-laki 60%; usia 18–30 (bobot 4), 31–45 (bobot 4), 46–60 (bobot 3), 61–75 (bobot 2)
- **Pekerjaan berisiko** (bias 40%): Buruh pabrik, Pekerja proyek bangunan, Sopir truk, Pekerja tambang, Pedagang pasar, Pengemudi ojek online
- **Biaya penunjang kunci**: Rp50.000 · semua sesuai rencana: Rp320.000

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
| efusi_pleura_tb | 10% | — | Efusi pleura TB. |
| gizi_buruk | 30% | — | Malnutrisi (IMT < 17). |
| riwayat_oat | 10% | — | Riwayat pengobatan TB tidak tuntas — curiga TB resistan obat. |
| kgb_leher | 15% | — |  |

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
| Antropometri (timbangan & pita ukur) · Indeks massa tubuh (IMT) | trait: gizi_buruk | 100% | 14,8–16,9 kg/m² |
| Thorax — paru · Auskultasi | trait: efusi_pleura_tb + ronkhi_apeks | 100% | Ronkhi di apeks kanan; suara napas menurun di basal paru kanan |
| Thorax — paru · Auskultasi | trait: efusi_pleura_tb | 100% | Suara napas menurun di basal paru kanan |
| Rontgen thorax (PA) · Kesan | trait: efusi_pleura_tb | 100% | TB paru aktif dengan efusi pleura kanan |
| Tanda vital lengkap · Suhu aksila | gejala: demam | 100% | 37,6–38,3 °C |
| Antropometri (timbangan & pita ukur) · Indeks massa tubuh (IMT) | gejala: berat_badan_turun | 100% | 15,8–18,4 kg/m² |
| Tanda vital lengkap · Frekuensi napas | — | 30% | 21–24 ×/menit |
| Tanda vital lengkap · Nadi | — | 100% | 84–100 ×/menit |
| Thorax — paru · Auskultasi | trait: ronkhi_apeks | 100% | Ronkhi basah kasar di apeks paru kanan / Ronkhi basah di lapang atas paru kiri / Suara napas bronkial dan ronkhi di apeks kanan |
| Kepala & leher · Konjungtiva | — | 30% | Anemis (pucat) |
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
| Thorax — paru · Perkusi | trait: efusi_pleura_tb | 100% | Redup di basal paru kanan |
| Thorax — paru · Palpasi | trait: efusi_pleura_tb | 100% | Fremitus menurun di basal paru kanan |
| Rontgen thorax (PA) · Sinus & diafragma | trait: efusi_pleura_tb | 100% | Sinus kostofrenikus kanan tumpul |
| Kepala & leher · Kelenjar getah bening leher | trait: kgb_leher | 100% | Teraba KGB leher kanan multipel, kenyal, tidak nyeri |
| Keadaan umum · Status gizi (kesan) | trait: gizi_buruk | 100% | Kesan gizi kurang |
| Keadaan umum · Kesan sakit | gejala: berat_badan_turun | 100% | Tampak sakit kronik, kurus |

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
- _progresi_: "Makin lama makin kurus, Dok, batuk juga nggak berkurang." → **Batuk kronik dengan berat badan turun progresif**
- _episode_sebelumnya_: "Dulu pernah minum obat paru enam bulan, Dok, tapi berhenti di bulan ketiga." → **Riwayat pengobatan TB tidak tuntas (risiko TB resistan obat)**

**Rencana pemeriksaan sesuai indikasi** (dasar penilaian)

| Jenis | Pemeriksaan | Peran | Kondisi | Alasan |
|---|---|---|---|---|
| Fisik | Thorax — paru | kunci | — | Ronkhi apeks dan tanda efusi. |
| Fisik | Antropometri (timbangan & pita ukur) | kunci | — | Status gizi (IMT). |
| Fisik | Kepala & leher | pendukung | — | Pembesaran KGB leher. |
| Penunjang | Tes Cepat Molekuler (TCM) TB _(grup bakteriologis)_ | kunci | — | Diagnosis bakteriologis + resistansi rifampisin. |
| Penunjang | BTA sputum (mikroskopis) _(grup bakteriologis)_ | kunci | — | Diagnosis bakteriologis bila TCM tidak tersedia. |
| Penunjang | Rontgen thorax (PA) | pendukung | — | Infiltrat/kavitas dan efusi. |
| Penunjang | Gula darah sewaktu (GDS) | pendukung | — | Skrining DM pada pasien TB. |
| Penunjang | Darah lengkap + hitung jenis | pendukung | — | LED, anemia. |
| Tidak perlu | Elektrokardiografi (EKG) 12 sadapan | — | — | Tidak ada keluhan yang mengarah ke jantung. |
| Tidak perlu | CT-scan abdomen non-kontras (rujukan) | — | — | CT-scan mahal dan tidak diindikasikan untuk keluhan ini. |
| Tidak perlu | Foto polos abdomen (BNO/KUB) | — | — | Tidak ada kecurigaan batu saluran kemih. |
| Tidak perlu | Tes cepat NS1 dengue | — | — | Tidak ada demam akut yang mengarah ke dengue. |
| Tidak perlu | Serologi dengue IgM/IgG | — | — | Tidak ada demam akut yang mengarah ke dengue. |
| Tidak perlu | Tes cepat (RDT) malaria | — | — | Tidak ada demam/riwayat daerah endemis. |
| Tidak perlu | Apusan darah tebal–tipis (malaria) | — | — | Tidak ada demam/riwayat daerah endemis. |
| Tidak perlu | Tubex TF (IgM anti-Salmonella) | — | — | Tidak ada demam lama yang mengarah ke tifoid. |
| Tidak perlu | Tes Widal | — | — | Tidak ada demam lama yang mengarah ke tifoid. |
| Tidak perlu | Profil lipid | — | — | Profil lipid adalah skrining risiko kardiovaskular, tidak menjawab keluhan akut ini. |
| Tidak perlu | USG abdomen (termasuk ginjal) | — | — | Tidak ada keluhan perut. |

Topik anamnesis kunci: Onset, Keluhan lain, Episode sebelumnya, Riwayat keluarga, Bepergian, pekerjaan & lingkungan.

**Diagnosis banding**

| Kondisi | Wajib disingkirkan | Bukti untuk menyingkirkan | Cara membedakan |
|---|---|---|---|
| Pneumonia Komunitas | — | anamnesis: Onset; Rontgen thorax (PA) | Pneumonia: akut (beberapa hari), demam tinggi, sesak, nyeri dada pleuritik, ronkhi/konsolidasi lobus bawah, leukositosis. TB: kronik (≥ 2 minggu), keringat malam, BB turun, infiltrat/kavitas di lapangan atas, BTA/TCM positif. |
| Asma Bronkial (Serangan Ringan–Sedang) | — | anamnesis: Episode sebelumnya; anamnesis: Pola & waktu | Asma: sesak dan mengi episodik dengan pemicu, sejak muda, di luar serangan normal; tanpa demam atau BB turun. TB: batuk terus-menerus ≥ 2 minggu dengan gejala sistemik. |
| Diabetes Melitus Tipe 2 | — | Gula darah sewaktu (GDS) | DM: BB turun disertai poliuria, polidipsia, polifagia; gula darah tinggi. TB: BB turun disertai batuk lama dan keringat malam. Keduanya sering bersamaan — periksa gula darah pada pasien TB. |
| Penyakit Refluks Gastroesofageal (GERD) | — | anamnesis: Pemberat & peringan; anamnesis: Sifat keluhan; Rontgen thorax (PA) | GERD dapat menyebabkan batuk kronik, tetapi disertai heartburn/regurgitasi, tanpa demam, keringat malam, atau BB turun. |
| Kanker Paru | Ya | Rontgen thorax (PA); Tes Cepat Molekuler (TCM) TB | Kanker paru: perokok usia lanjut, batuk darah, BB turun; massa pada foto toraks, bakteriologis TB negatif. |
| PPOK | — | Spirometri sederhana (APE & reversibilitas) | PPOK: perokok lama, sesak progresif, obstruksi tidak reversibel penuh pada spirometri. |

**Komplikasi & tanda bahaya**

| Komplikasi | Trait | Tanda bahaya | Cara menilai | Penjelasan |
|---|---|---|---|---|
| Efusi pleura | efusi_pleura_tb | — | Thorax — paru; Rontgen thorax (PA) | Redup & suara napas menurun di basal; foto toraks tampak sinus tumpul. |
| Malnutrisi | gizi_buruk | — | Antropometri (timbangan & pita ukur) | IMT < 17 memperburuk prognosis dan perlu dukungan nutrisi. |
| Hemoptisis | hemoptisis | — | gejala: Batuk darah (hemoptisis) | Batuk darah; hemoptisis masif adalah kegawatan. |
| Curiga TB resistan obat | riwayat_oat | Ya | anamnesis: Episode sebelumnya; anamnesis: Riwayat obat | Riwayat OAT tidak tuntas → periksa TCM (resistansi rifampisin) dan rujuk ke layanan TB resistan obat. |

**Disposisi** (aturan pertama yang cocok)

- trait: riwayat_oat → **Rujuk ke spesialis (tidak darurat)**: Curiga TB resistan obat: TCM dan rujuk ke fasyankes rujukan TB-RO.
- trait: efusi_pleura_tb → **Rawat jalan, edukasi & kontrol** (juga diterima: Rujuk ke spesialis (tidak darurat)): TB dengan efusi pleura: OAT di layanan primer, evaluasi efusi dapat dirujuk.
- — → **Rawat jalan, edukasi & kontrol**: TB paru tanpa komplikasi diobati di layanan primer (program TB); lapor dan investigasi kontak serumah.

**Prinsip tata laksana** (tanpa dosis)

- Konfirmasi bakteriologis (TCM) dan pengobatan OAT sesuai program nasional — keputusan dokter.
- Pengawas menelan obat (PMO) dan edukasi kepatuhan.
- Investigasi kontak serumah; skrining DM dan HIV.
- Etika batuk dan ventilasi rumah untuk mencegah penularan.

**Langkah penalaran yang dianjurkan**

1. Batuk ≥ 2 minggu = terduga TB: tanyakan dahak/darah, keringat malam, BB turun, kontak serumah, riwayat OAT.
2. Nilai status gizi dan periksa paru.
3. Konfirmasi bakteriologis (TCM lebih sensitif daripada BTA); foto toraks mendukung.
4. Skrining komorbid DM; tanyakan pengobatan sebelumnya (TB resistan obat).
5. Bedakan dengan pneumonia (akut), asma (episodik), dan keganasan paru.

**Jebakan penalaran (umpan balik)**

- `{"excluded":"tb_paru","toolNormal":"bta_sputum"}` → BTA negatif tidak menyingkirkan TB — gunakan TCM yang lebih sensitif.
- `{"topicNotAsked":"episode_sebelumnya","traits":["riwayat_oat"]}` → Riwayat pengobatan TB sebelumnya tidak ditanyakan — penting untuk mendeteksi TB resistan obat.

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
- [ ] Rencana pemeriksaan (kunci/pendukung/komplikasi) & pemeriksaan "tidak perlu" sesuai praktik layanan primer
- [ ] Komplikasi, tanda bahaya, dan aturan disposisi/rujukan tepat
- [ ] Prinsip tata laksana & jebakan penalaran akurat

---

## Pneumonia Komunitas

- **id**: `pneumonia` · **SKDI**: 4A · **bahaya**: tinggi · **sistem**: Pernapasan · **status**: `BELUM_DITINJAU_DOKTER`
- **Hari sakit saat datang**: 2–7
- **Demografi**: laki-laki 60%; usia 18–40 (bobot 2), 41–60 (bobot 3), 61–75 (bobot 4)
- **Pekerjaan berisiko** (bias 30%): Pensiunan, Pekerja proyek bangunan, Sopir truk, Petani
- **Biaya penunjang kunci**: Rp175.000 · semua sesuai rencana: Rp315.000

> Infeksi akut parenkim paru yang didapat di masyarakat (tersering Streptococcus pneumoniae). Demam tinggi, menggigil, batuk berdahak purulen (kuning-hijau atau seperti karat), sesak napas, dan nyeri dada pleuritik. Pemeriksaan: takipnea, takikardia, ronkhi basah halus atau suara napas bronkial di daerah konsolidasi; saturasi O₂ dapat turun. Leukositosis dengan pergeseran ke kiri; foto toraks menunjukkan infiltrat/konsolidasi. Nilai derajat keparahan (mis. CURB-65) untuk menentukan perlunya rujuk/rawat inap.

**Trait laten** (aturan pertama yang cocok per id dipakai)

| Trait | Peluang | Kondisi | Keterangan |
|---|---|---|---|
| perokok | 50% | laki-laki | Faktor risiko: merokok. |
| lobus_kanan | 60% | — | Konsolidasi di lobus bawah paru kanan. |
| lobus_kiri | 100% | tanpa: lobus_kanan | Konsolidasi di lobus bawah paru kiri. |
| hipoksia | 45% | — | Hipoksemia (SpO₂ < 94%) — tanda pneumonia berat, pertimbangkan rujuk. |
| leukositosis | 80% | — | Leukositosis dengan pergeseran ke kiri (infeksi bakteri). |
| curb_berat | 50% | usia 65–… | Pneumonia berat: CURB-65 ≥ 2. |
| curb_berat | 15% | — | Pneumonia berat: CURB-65 ≥ 2. |
| efusi_parapneumonik | 10% | — | Efusi parapneumonik. |
| bingung | 40% | trait: curb_berat | Kebingungan (komponen C pada CURB-65). |

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
| Fungsi ginjal · Ureum | trait: curb_berat | 100% | 45–75 mg/dL |
| Tanda vital lengkap · Frekuensi napas | trait: curb_berat | 100% | 30–34 ×/menit |
| Tanda vital lengkap · Tekanan darah sistolik | trait: curb_berat | 30% | 85–89 mmHg |
| Keadaan umum · Kesadaran | trait: bingung | 100% | Somnolen ringan, sedikit bingung (GCS 14) |
| Keadaan umum · Kesan sakit | trait: hipoksia | 100% | Tampak sesak, napas cuping hidung |
| Thorax — paru · Inspeksi | trait: hipoksia | 100% | Napas cepat, retraksi interkostal ringan |
| Rontgen thorax (PA) · Kesan | trait: efusi_parapneumonik + lobus_kanan | 100% | Pneumonia lobus bawah kanan dengan efusi parapneumonik |
| Rontgen thorax (PA) · Kesan | trait: efusi_parapneumonik + lobus_kiri | 100% | Pneumonia lobus bawah kiri dengan efusi parapneumonik |
| Tanda vital lengkap · Suhu aksila | — | 100% | 38,5–40,0 °C |
| Tanda vital lengkap · Frekuensi napas | — | 100% | 24–30 ×/menit |
| Tanda vital lengkap · Nadi | — | 100% | 100–120 ×/menit |
| Tanda vital lengkap · Saturasi oksigen (SpO₂) | trait: hipoksia | 100% | 88–93 % |
| Tanda vital lengkap · Saturasi oksigen (SpO₂) | — | 100% | 94–96 % |
| Thorax — paru · Auskultasi | trait: lobus_kanan | 90% | Ronkhi basah halus dan suara napas bronkial di basal paru kanan |
| Thorax — paru · Auskultasi | trait: lobus_kiri | 90% | Ronkhi basah halus dan suara napas bronkial di basal paru kiri |
| Darah lengkap + hitung jenis · Leukosit | trait: leukositosis | 100% | 12.000–20.000 /µL |
| Darah lengkap + hitung jenis · Neutrofil batang | trait: leukositosis | 100% | 7–12 % |
| Darah lengkap + hitung jenis · Limfosit | trait: leukositosis | 100% | 8–17 % |
| Darah lengkap + hitung jenis · LED | — | 60% | 30–70 mm/jam |
| Rontgen thorax (PA) · Pulmo | trait: lobus_kanan | 100% | Konsolidasi di lobus bawah paru kanan dengan air bronchogram |
| Rontgen thorax (PA) · Pulmo | trait: lobus_kiri | 100% | Konsolidasi di lobus bawah paru kiri dengan air bronchogram |
| Rontgen thorax (PA) · Kesan | trait: lobus_kanan | 100% | Pneumonia lobus bawah kanan |
| Rontgen thorax (PA) · Kesan | trait: lobus_kiri | 100% | Pneumonia lobus bawah kiri |
| Thorax — paru · Perkusi | trait: lobus_kanan | 100% | Redup di basal paru kanan |
| Thorax — paru · Perkusi | trait: lobus_kiri | 100% | Redup di basal paru kiri |
| Thorax — paru · Palpasi | trait: lobus_kanan | 100% | Fremitus meningkat di basal paru kanan |
| Thorax — paru · Palpasi | trait: lobus_kiri | 100% | Fremitus meningkat di basal paru kiri |
| Rontgen thorax (PA) · Sinus & diafragma | trait: efusi_parapneumonik | 100% | Sinus kostofrenikus sisi yang sakit tumpul |
| Keadaan umum · Kesan sakit | — | 100% | Tampak sakit sedang |

**Petunjuk anamnesis** (jawaban bertanda petunjuk)

- _onset_: "Baru {hariTeks} hari, Dok. Mendadak demam tinggi pakai menggigil, terus batuk." → **Demam tinggi akut dengan menggigil dan batuk**
- _onset_: "Baru {hariTeks} hari, Dok. Demam tinggi, terus batuk." → **Demam tinggi akut disertai batuk**
- _lokasi_: "Dada kanan bawah sakit kalau tarik napas dalam atau batuk, Dok." → **Nyeri dada pleuritik**
- _lokasi_: "Dada kiri bawah sakit kalau tarik napas dalam atau batuk, Dok." → **Nyeri dada pleuritik**
- _karakter_: "Batuknya berdahak, Dok, warnanya kuning kehijauan, kadang kayak karat." → **Dahak purulen / berwarna karat**
- _pola_: "Makin hari makin sesak, Dok, napasnya pendek-pendek." → **Sesak napas progresif**
- _riwayat_penyakit_: "Seminggu sebelumnya sempat pilek-pilek biasa, Dok." → **Didahului infeksi saluran napas atas**
- _kebiasaan_: "Merokok, Dok, sehari sebungkus." → **Merokok (faktor risiko)**
- _keparahan_: "Berat, Dok. Napas sesak, ngomong panjang saja capek." → **Sesak berat (curiga hipoksemia)**
- _progresi_: "Makin parah, Dok. Awalnya pilek biasa, sekarang demam tinggi dan batuk berdahak." → **Perburukan akut setelah ISPA**

**Rencana pemeriksaan sesuai indikasi** (dasar penilaian)

| Jenis | Pemeriksaan | Peran | Kondisi | Alasan |
|---|---|---|---|---|
| Fisik | Thorax — paru | kunci | — | Tanda konsolidasi: redup, fremitus meningkat, ronkhi/suara bronkial. |
| Fisik | Keadaan umum | komplikasi | — | Kesadaran (komponen CURB-65). |
| Penunjang | Rontgen thorax (PA) | kunci | — | Konfirmasi infiltrat/konsolidasi dan efusi. |
| Penunjang | Darah lengkap + hitung jenis | pendukung | — | Leukositosis dengan pergeseran ke kiri. |
| Penunjang | Fungsi ginjal | komplikasi | — | Ureum untuk CURB-65. |
| Tidak perlu | CT-scan abdomen non-kontras (rujukan) | — | — | CT-scan mahal dan tidak diindikasikan untuk keluhan ini. |
| Tidak perlu | Foto polos abdomen (BNO/KUB) | — | — | Tidak ada kecurigaan batu saluran kemih. |
| Tidak perlu | Profil lipid | — | — | Profil lipid adalah skrining risiko kardiovaskular, tidak menjawab keluhan akut ini. |
| Tidak perlu | HbA1c | — | — | HbA1c tidak membantu diagnosis keluhan akut ini. |
| Tidak perlu | Tubex TF (IgM anti-Salmonella) | — | — | Tidak ada demam lama yang mengarah ke tifoid. |
| Tidak perlu | Tes Widal | — | — | Tidak ada demam lama yang mengarah ke tifoid. |
| Tidak perlu | Spirometri sederhana (APE & reversibilitas) | — | — | Tidak ada keluhan sesak/obstruksi saluran napas. |
| Tidak perlu | USG abdomen (termasuk ginjal) | — | — | Tidak ada keluhan perut. |

Topik anamnesis kunci: Onset, Sifat keluhan, Keluhan lain, Kebiasaan & gaya hidup.

**Diagnosis banding**

| Kondisi | Wajib disingkirkan | Bukti untuk menyingkirkan | Cara membedakan |
|---|---|---|---|
| Tuberkulosis Paru | — | anamnesis: Onset; Rontgen thorax (PA) | TB: batuk ≥ 2 minggu, keringat malam, BB turun, demam subfebris, infiltrat/kavitas lapangan atas, BTA/TCM positif. Pneumonia: akut, demam tinggi, sesak, konsolidasi lobus bawah, leukositosis. |
| Asma Bronkial (Serangan Ringan–Sedang) | — | anamnesis: Episode sebelumnya; Thorax — paru | Asma: sesak dengan mengi, tanpa demam tinggi, riwayat serangan berulang, membaik dengan bronkodilator. Pneumonia: demam tinggi, dahak purulen, ronkhi basah lokal, konsolidasi pada foto toraks. |
| Infeksi Dengue (Demam Dengue / DBD) | — | Darah lengkap + hitung jenis | Dengue: demam tinggi tanpa batuk produktif/sesak yang menonjol, leukopenia dan trombositopenia. Pneumonia: batuk berdahak, sesak, ronkhi lokal, leukositosis. |
| Bronkitis Akut | — | Thorax — paru; Rontgen thorax (PA) | Bronkitis akut: batuk tanpa tanda konsolidasi, foto toraks normal. |
| Gagal Jantung | Ya | Kepala & leher; Ekstremitas & kulit; Thorax — jantung | Gagal jantung: ortopnea, edema tungkai, JVP meningkat, kardiomegali; demam tidak menonjol. |
| Sepsis | Ya | Tanda vital lengkap; Keadaan umum | Sepsis: infeksi dengan hipotensi, takikardia, dan penurunan kesadaran. |

**Komplikasi & tanda bahaya**

| Komplikasi | Trait | Tanda bahaya | Cara menilai | Penjelasan |
|---|---|---|---|---|
| Hipoksemia (SpO₂ < 94%) | hipoksia | Ya | Tanda vital lengkap | Saturasi oksigen rendah adalah indikasi rawat inap. |
| Pneumonia berat (CURB-65 ≥ 2) | curb_berat | Ya | Tanda vital lengkap; Fungsi ginjal; Keadaan umum | CURB-65: Confusion, Urea > 42 mg/dL, Respiratory rate ≥ 30, Blood pressure < 90/60, usia ≥ 65. Skor ≥ 2 → rawat inap. |
| Efusi parapneumonik | efusi_parapneumonik | — | Thorax — paru; Rontgen thorax (PA) | Cairan pleura menyertai pneumonia; dapat berkembang menjadi empiema. |

**Disposisi** (aturan pertama yang cocok)

- trait: hipoksia → **Rujuk segera / IGD**: Hipoksemia memerlukan oksigen dan rawat inap.
- trait: curb_berat → **Rujuk segera / IGD**: CURB-65 ≥ 2: pneumonia berat, rawat inap.
- — → **Rawat jalan, edukasi & kontrol** (juga diterima: Rawat jalan dengan pemantauan ketat / kontrol ulang): CURB-65 0–1 tanpa hipoksemia: rawat jalan dengan kontrol 48–72 jam.

**Prinsip tata laksana** (tanpa dosis)

- Nilai derajat keparahan (CURB-65, SpO₂) untuk menentukan tempat perawatan.
- Antibiotik empiris sesuai pedoman — keputusan dokter.
- Hidrasi, antipiretik, edukasi tanda perburukan; kontrol 48–72 jam.
- Berhenti merokok; vaksinasi pada kelompok risiko.

**Langkah penalaran yang dianjurkan**

1. Batuk + demam akut + sesak: tanyakan onset, dahak, nyeri dada pleuritik, ISPA sebelumnya, dan rokok.
2. Tanda vital lengkap termasuk frekuensi napas dan SpO₂ — sering terlupa.
3. Pemeriksaan paru untuk tanda konsolidasi; foto toraks untuk konfirmasi.
4. Hitung CURB-65 (kesadaran, ureum, napas, tekanan darah, usia) dan nilai hipoksemia.
5. Bedakan dengan TB (kronik), asma (mengi episodik), dan gagal jantung.

**Jebakan penalaran (umpan balik)**

- `{"primaryIs":"tb_paru"}` → Onset akut beberapa hari dengan demam tinggi dan konsolidasi lobus bawah lebih sesuai pneumonia; TB berlangsung ≥ 2 minggu.
- `{"traits":["curb_berat"],"toolDone":"tanda_vital"}` → Frekuensi napas ≥ 30 dan ureum tinggi adalah komponen CURB-65 — pneumonia ini termasuk berat.

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
- [ ] Rencana pemeriksaan (kunci/pendukung/komplikasi) & pemeriksaan "tidak perlu" sesuai praktik layanan primer
- [ ] Komplikasi, tanda bahaya, dan aturan disposisi/rujukan tepat
- [ ] Prinsip tata laksana & jebakan penalaran akurat

---

## Asma Bronkial (Serangan Ringan–Sedang)

- **id**: `asma` · **SKDI**: 4A · **bahaya**: sedang · **sistem**: Pernapasan · **status**: `BELUM_DITINJAU_DOKTER`
- **Hari sakit saat datang**: 1–3
- **Demografi**: laki-laki 45%; usia 10–12 (bobot 1.5), 13–17 (bobot 2.5), 18–30 (bobot 5), 31–45 (bobot 3), 46–60 (bobot 2), 61–75 (bobot 1)
- **Pekerjaan berisiko** (bias 30%): Buruh pabrik, Pengemudi ojek online, Mahasiswa, Pekerja proyek bangunan, Pelajar SMP/SMA, Pelajar SD
- **Biaya penunjang kunci**: Rp25.000 · semua sesuai rencana: Rp25.000

> Penyakit inflamasi kronik saluran napas dengan hiperreaktivitas bronkus. Episode berulang sesak napas, mengi, dada terasa sempit, dan batuk (terutama malam/dini hari) yang dipicu alergen, debu, asap, udara dingin, infeksi virus, atau olahraga, dan membaik spontan atau dengan bronkodilator. Sering ada riwayat atopi (rinitis alergi, eksim) dan riwayat keluarga. Di luar serangan pemeriksaan bisa normal; saat serangan arus puncak ekspirasi (APE) menurun.

**Trait laten** (aturan pertama yang cocok per id dipakai)

| Trait | Peluang | Kondisi | Keterangan |
|---|---|---|---|
| serangan_berat | 10% | — | Serangan asma berat — rujuk segera. |
| atopi | 60% | — | Riwayat atopi (rinitis alergi/eksim). |
| riwayat_keluarga_asma | 50% | — | Riwayat keluarga asma. |
| pemicu_debu | 45% | — | Pemicu serangan: debu/asap. |
| pemicu_dingin | 50% | tanpa: pemicu_debu | Pemicu serangan: udara dingin/kehujanan. |
| serangan_sedang | 50% | tanpa: serangan_berat | Serangan derajat sedang (APE 50–69% prediksi). |
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
| Tanda vital lengkap · Saturasi oksigen (SpO₂) | trait: serangan_berat | 100% | 88–91 % |
| Tanda vital lengkap · Frekuensi napas | trait: serangan_berat | 100% | 30–34 ×/menit |
| Tanda vital lengkap · Nadi | trait: serangan_berat | 100% | 121–130 ×/menit |
| Spirometri sederhana (APE & reversibilitas) · APE (% nilai prediksi) | trait: serangan_berat | 100% | 35–49 % |
| Keadaan umum · Kesan sakit | trait: serangan_berat | 100% | Tampak sesak berat, duduk membungkuk, bicara per kata |
| Thorax — paru · Auskultasi | trait: serangan_berat | 100% | Wheezing di kedua lapang paru, suara napas melemah |
| Thorax — paru · Inspeksi | trait: serangan_berat | 100% | Retraksi interkostal & penggunaan otot bantu napas |
| Tanda vital lengkap · Frekuensi napas | — | 100% | 22–28 ×/menit |
| Tanda vital lengkap · Nadi | — | 100% | 96–115 ×/menit |
| Tanda vital lengkap · Saturasi oksigen (SpO₂) | trait: serangan_sedang | 100% | 92–95 % |
| Tanda vital lengkap · Saturasi oksigen (SpO₂) | — | 100% | 95–97 % |
| Thorax — paru · Auskultasi | — | 90% | Wheezing ekspirasi di kedua lapang paru, ekspirasi memanjang |
| Spirometri sederhana (APE & reversibilitas) · APE (% nilai prediksi) | trait: serangan_sedang | 95% (sensitivitas) | 50–69 % |
| Spirometri sederhana (APE & reversibilitas) · APE (% nilai prediksi) | — | 90% (sensitivitas) | 65–79 % |
| Darah lengkap + hitung jenis · Eosinofil | trait: eosinofilia | 100% | 5–9 % |
| Rontgen thorax (PA) · Pulmo | trait: hiperinflasi | 100% | Hiperinflasi ringan, tidak tampak infiltrat |
| Rontgen thorax (PA) · Kesan | trait: hiperinflasi | 100% | Hiperinflasi paru ringan |
| Keadaan umum · Kesan sakit | trait: serangan_sedang | 100% | Tampak sesak, bicara per frasa |
| Keadaan umum · Kesan sakit | — | 100% | Tampak sesak ringan, masih bisa bicara dalam kalimat |
| Thorax — paru · Inspeksi | trait: serangan_sedang | 100% | Penggunaan otot bantu napas ringan |
| Thorax — paru · Perkusi | — | 30% | Hipersonor di kedua lapang paru |
| Spirometri sederhana (APE & reversibilitas) · Reversibilitas setelah bronkodilator | — | 85% (sensitivitas) | Meningkat 18% setelah bronkodilator (reversibel) / Meningkat 25% setelah bronkodilator (reversibel) |

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
- _bepergian_lingkungan_: "Kamar saya memang agak berdebu, Dok, banyak karpet sama boneka." → **Paparan debu di rumah**
- _kebiasaan_: "Saya nggak merokok, Dok, tapi orang rumah ada yang merokok." → **Paparan asap rokok**
- _durasi_: "Kalau kambuh bisa berjam-jam, Dok. Kalau pakai obat semprot cepat hilang." → **Serangan reda dengan bronkodilator**
- _keparahan_: "Berat... sekali... Dok." → **Bicara terputus per kata (serangan berat)**
- _episode_sebelumnya_: "Sering, Dok. Dari kecil sudah begini, setahun bisa beberapa kali kambuh." → **Serangan berulang sejak kecil (penyakit episodik)**

**Rencana pemeriksaan sesuai indikasi** (dasar penilaian)

| Jenis | Pemeriksaan | Peran | Kondisi | Alasan |
|---|---|---|---|---|
| Fisik | Thorax — paru | kunci | — | Wheezing, ekspirasi memanjang; singkirkan tanda pneumotoraks/konsolidasi. |
| Fisik | Keadaan umum | komplikasi | — | Derajat serangan (cara bicara, posisi). |
| Penunjang | Spirometri sederhana (APE & reversibilitas) | kunci | — | APE untuk derajat serangan dan reversibilitas setelah bronkodilator. |
| Penunjang | Rontgen thorax (PA) | komplikasi | trait: serangan_berat | Singkirkan pneumotoraks/pneumonia pada serangan berat. |
| Tidak perlu | CT-scan abdomen non-kontras (rujukan) | — | — | CT-scan mahal dan tidak diindikasikan untuk keluhan ini. |
| Tidak perlu | Foto polos abdomen (BNO/KUB) | — | — | Tidak ada kecurigaan batu saluran kemih. |
| Tidak perlu | Tes cepat NS1 dengue | — | — | Tidak ada demam akut yang mengarah ke dengue. |
| Tidak perlu | Serologi dengue IgM/IgG | — | — | Tidak ada demam akut yang mengarah ke dengue. |
| Tidak perlu | Tes cepat (RDT) malaria | — | — | Tidak ada demam/riwayat daerah endemis. |
| Tidak perlu | Apusan darah tebal–tipis (malaria) | — | — | Tidak ada demam/riwayat daerah endemis. |
| Tidak perlu | Tubex TF (IgM anti-Salmonella) | — | — | Tidak ada demam lama yang mengarah ke tifoid. |
| Tidak perlu | Tes Widal | — | — | Tidak ada demam lama yang mengarah ke tifoid. |
| Tidak perlu | Profil lipid | — | — | Profil lipid adalah skrining risiko kardiovaskular, tidak menjawab keluhan akut ini. |
| Tidak perlu | HbA1c | — | — | HbA1c tidak membantu diagnosis keluhan akut ini. |
| Tidak perlu | Tes Cepat Molekuler (TCM) TB | — | — | Tidak ada gejala yang mengarah ke TB. |
| Tidak perlu | BTA sputum (mikroskopis) | — | — | Tidak ada gejala yang mengarah ke TB. |
| Tidak perlu | USG abdomen (termasuk ginjal) | — | — | Tidak ada keluhan perut. |

Topik anamnesis kunci: Onset, Episode sebelumnya, Pemberat & peringan, Riwayat obat, Riwayat penyakit dahulu, Riwayat keluarga.

**Diagnosis banding**

| Kondisi | Wajib disingkirkan | Bukti untuk menyingkirkan | Cara membedakan |
|---|---|---|---|
| Pneumonia Komunitas | — | Tanda vital lengkap; Thorax — paru | Pneumonia: demam tinggi, dahak purulen, ronkhi basah lokal, leukositosis, konsolidasi pada foto toraks. Asma: sesak dengan mengi difus, riwayat serangan berulang, ada pemicu, tanpa demam tinggi. |
| Tuberkulosis Paru | — | anamnesis: Onset; anamnesis: Episode sebelumnya | TB: batuk ≥ 2 minggu dengan keringat malam dan BB turun. Asma: serangan sesak episodik dengan pemicu, di luar serangan normal. |
| Angina Pektoris Stabil | — | anamnesis: Pemberat & peringan; Thorax — paru | Angina: rasa berat di dada saat aktivitas pada usia lanjut dengan faktor risiko kardiovaskular, tanpa mengi. Asma: mengi, riwayat atopi, sejak muda, membaik dengan bronkodilator. |
| PPOK | — | anamnesis: Kebiasaan & gaya hidup; Spirometri sederhana (APE & reversibilitas) | PPOK: perokok lama usia > 40, sesak progresif, obstruksi tidak reversibel penuh. |
| Gagal Jantung | Ya | Kepala & leher; Ekstremitas & kulit; Thorax — jantung | Gagal jantung ("asma kardiale"): ortopnea, edema, JVP meningkat, ronkhi basal, usia lanjut. |
| Bronkitis Akut | — | anamnesis: Episode sebelumnya | Bronkitis akut: batuk pasca-ISPA tanpa riwayat serangan berulang. |

**Komplikasi & tanda bahaya**

| Komplikasi | Trait | Tanda bahaya | Cara menilai | Penjelasan |
|---|---|---|---|---|
| Serangan asma berat | serangan_berat | Ya | Tanda vital lengkap; Keadaan umum; Spirometri sederhana (APE & reversibilitas) | Bicara per kata, napas ≥ 30×/menit, nadi > 120, SpO₂ < 92%, APE < 50% → rujuk segera. |
| Serangan derajat sedang | serangan_sedang | — | Tanda vital lengkap; Keadaan umum; Spirometri sederhana (APE & reversibilitas) | Bicara per frasa, APE 50–69%; tangani di klinik dan nilai respons. |

**Disposisi** (aturan pertama yang cocok)

- trait: serangan_berat → **Rujuk segera / IGD**: Serangan asma berat memerlukan penanganan di rumah sakit.
- — → **Rawat jalan, edukasi & kontrol** (juga diterima: Rawat jalan dengan pemantauan ketat / kontrol ulang): Serangan ringan–sedang yang membaik dengan bronkodilator: rawat jalan, rencana aksi asma, dan kontrol.

**Prinsip tata laksana** (tanpa dosis)

- Bronkodilator inhalasi segera dan nilai respons — keputusan dokter.
- Rencana aksi asma tertulis dan teknik inhaler yang benar.
- Hindari pemicu (debu, asap rokok, udara dingin); kontrol rutin.
- Rujuk segera bila serangan berat atau tidak membaik.

**Langkah penalaran yang dianjurkan**

1. Sesak + mengi: tanyakan episode sebelumnya, pemicu, respons inhaler, riwayat atopi & keluarga.
2. Nilai derajat serangan: cara bicara, posisi, frekuensi napas, nadi, SpO₂, APE.
3. Spirometri/APE untuk obstruksi dan reversibilitas.
4. Singkirkan pneumonia (demam, ronkhi lokal), gagal jantung, dan PPOK (perokok tua).

**Jebakan penalaran (umpan balik)**

- `{"excluded":"asma","toolNormal":"rontgen_thorax"}` → Foto toraks normal tidak menyingkirkan asma; diagnosis asma bersifat klinis + spirometri.
- `{"topicNotAsked":"episode_sebelumnya"}` → Riwayat serangan serupa sebelumnya adalah kunci diagnosis asma — selalu tanyakan episode sebelumnya.

**Temuan khas (layar edukasi)**

- Sesak napas, mengi, dada sempit, batuk — episodik dan berulang
- Memberat malam/dini hari; dipicu debu, asap, udara dingin, infeksi, atau aktivitas
- Riwayat atopi dan riwayat keluarga asma
- Wheezing ekspirasi difus, ekspirasi memanjang, takipnea
- APE < 80% prediksi; membaik dengan bronkodilator

**Catatan pengembang**

- Serangan berat / status asmatikus tidak dimodelkan.
- Pasien anak (10–12 th) & remaja (13–17 th) memakai konten yang sama dengan dewasa, dengan rujukan tanda vital/antropometri menurut usia yang disederhanakan — perlu tinjauan khusus pediatri.

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
- [ ] Rencana pemeriksaan (kunci/pendukung/komplikasi) & pemeriksaan "tidak perlu" sesuai praktik layanan primer
- [ ] Komplikasi, tanda bahaya, dan aturan disposisi/rujukan tepat
- [ ] Prinsip tata laksana & jebakan penalaran akurat

---
