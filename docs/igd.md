# Mode Dokter Jaga IGD

Mode ini menempatkan pemain sebagai **dokter jaga Instalasi Gawat Darurat**: menerima pasien yang datang
bertahap, melakukan triase, survei primer ABCDE, anamnesis (dari pasien, keluarga, saksi, atau
paramedis), memilih pemeriksaan penunjang, memberi instruksi tindakan & obat kepada perawat,
berkonsultasi dengan spesialis, lalu memutuskan disposisi. Kondisi pasien berubah **dinamis** setiap
detik permainan menurut model fisiologi; terlambat atau salah tindakan membuat pasien memburuk, terapi
yang tepat membuatnya membaik. Mode praktik (poliklinik) dan OSCE tetap ada tanpa perubahan.

> ⚠️ **BELUM DITINJAU DOKTER.** Skenario, angka fisiologi, dosis, dan kunci penilaian disusun dari
> pedoman yang tercantum di bawah, tetapi belum diverifikasi oleh dokter/konsultan kegawatdaruratan.
> Ini permainan edukasi — **bukan alat bantu keputusan klinis**. Selalu ikuti pedoman terbaru dan
> kebijakan institusi Anda.

## Cara bermain

1. Halaman awal → **🚑 Dokter Jaga IGD**, pilih mode:
   - **Latihan satu kasus** — satu pasien (bisa dipilih), perburukan lebih lambat, petunjuk dosis &
     sediaan tampil.
   - **Jaga malam** — 4 pasien datang bertahap dengan kegawatan berbeda, 3 perawat.
   - **Jaga sibuk** — 7 pasien, beberapa datang hampir bersamaan, hanya 2 perawat, perburukan lebih
     cepat.
2. Jam permainan berjalan (×1, ×2, ×4, ×8, jeda dengan spasi, atau lompat +1 menit untuk menunggu
   hasil/efek terapi).
3. **Papan IGD** (kiri) menampilkan semua pasien: kategori ATS, lama menunggu, tanda vital ringkas,
   dan alarm. Pilih pasien di papan — atau **ketuk bed/pasiennya di ruangan 3D**.
4. Panel RME (kanan) berisi tab **Triase · ABCDE · Anamnesis · Penunjang · Tindakan · Obat & cairan ·
   Tim · Catatan**, monitor pasien (bila monitor terpasang), dan tombol cepat saat henti jantung.
5. Tetapkan **diagnosis kerja** dan **disposisi** (pulang, bangsal, HCU/ICU, kamar operasi,
   kateterisasi, rujuk, meninggal). Disposisi ke unit spesialistik memerlukan konsultasi yang diterima.
6. Setelah jaga selesai, **debrief** per pasien: nilai per aspek, grafik perjalanan tanda vital,
   tindakan kritis (tepat/terlambat/terlewat), peringatan keselamatan, informasi yang terlewat,
   tatalaksana yang dianjurkan, jebakan umum, dan referensi.

## Ruang IGD 3D

Memakai mesin 3D & karakter yang sama dengan ruang praktik (prosedural, tanpa berkas aset):

- **Ruangan**: 2 bed resusitasi (troli emergensi merah, defibrilator, ventilator, rak alat jalan napas),
  3 bed akut (troli tindakan), 2 kursi observasi, panel gas medis (O₂ + flowmeter, suction) dan monitor
  dinding per bed yang menampilkan EKG/SpO₂/TD/RR **langsung**, tiang infus dengan kantong cairan/darah
  yang benar-benar tergantung, gorden pemisah, meja perawat dengan komputer RME dan **monitor sentral**
  seluruh bed, papan IGD, poster ACLS & triase, kursi tunggu, meja triase, pintu geser masuk dengan
  ambulans (lampu rotator menyala saat pasien brankar datang), dan pintu ke radiologi/rawat inap.
- **Kedatangan sesuai skenario**: berjalan sendiri, **dipapah keluarga**, **kursi roda** didorong
  keluarga, **brankar** didorong dua paramedis, atau anak **digendong** orang tua. Pasien menunggu di
  kursi tunggu/parkir brankar sampai mendapat bed, lalu dipindahkan (transfer brankar → bed, dari kursi
  roda, atau berjalan lalu berbaring).
- **Perawat** berjalan ke pasien sesuai instruksi dan memeragakan tugasnya (mengukur TTV, memasang
  infus, mengambil darah, memberi obat IM/IV/nebulisasi, memasang monitor/pad, **RJP berirama
  110×/menit**, **ventilasi BVM**), menjawab "Baik, Dok", lalu kembali ke meja perawat. Porter membawa
  pasien ke radiologi dan kembali, atau keluar IGD sesuai disposisi (jenazah ditutup kain).
- **Kondisi klinis terlihat dan berubah**: kesadaran (mata terbuka/setengah/tertutup, kontak mata,
  kepala lunglai), frekuensi & kedalaman napas, sesak (posisi tripod saat duduk), ekspresi nyeri/cemas,
  gelisah, **kejang tonik-klonik**, **henti jantung** (tanpa napas, lemas), kolaps ke lantai bila
  terjadi sebelum mendapat bed, **sentakan saat defibrilasi** (dengan kilatan), warna kulit (sianosis,
  pucat/syok, kemerahan anafilaksis), posisi (telentang, setengah duduk, duduk, miring kiri, tungkai
  diangkat) dan perlengkapan di tubuh (kanul nasal, sungkup, NRM, NIV, OPA, ETT + selang ventilator,
  BVM, collar servikal, pad defibrilator, elektroda & klip SpO₂, kanul IV + selang infus, torniket,
  bidai, pelvic binder).
- **Kamera mata dokter** berpindah halus ke bed pasien terpilih, mendekat saat Anda memeriksa atau
  mengerjakan tindakan; tanpa pasien terpilih, pandangan umum dari meja perawat. Seret untuk melihat
  sekeliling. Pasien yang ditanya menggerakkan mulut sesuai jawabannya.
- Tanpa WebGL, mode IGD tetap dapat dimainkan sepenuhnya lewat panel.

## Grafis realistis (tubuh, kulit, wajah, cahaya)

Seluruhnya prosedural (tanpa berkas model/tekstur), sehingga tetap satu berkas HTML offline:

- **Pencahayaan berbasis citra**: ruang IGD dipotret ke enam arah (tanpa orang) lalu diburamkan
  menurut kekasaran (PMREM) dan dipakai sebagai cahaya ambien & pantulan; lampu panel langit-langit
  menjadi sorotan di mata, kulit berkeringat, dan logam. Cahaya kunci datang dari arah kepala bed
  sehingga bayangan lembut di bawah tulang selangka, otot dada, dan lutut membentuk tubuh.
- **Oklusi ambien layar (GTAO)** di perangkat desktop: bayangan halus di lekuk & titik kontak
  (ketiak, bawah dagu, antara tubuh dan kasur). Dimatikan otomatis bila frame melambat; ponsel
  tidak memakainya. Bisa dimatikan dengan `?ao=0`.
- **Kulit** (`skin.ts`): hamburan bawah permukaan per kanal warna (merah menembus paling jauh →
  batas terang–gelap hangat seperti kulit sungguhan), dua lobus kilap (kulit + lapisan minyak tipis),
  pori & garis kulit halus serta tonjolan lembut (triplanar di ruang ikat, memudar sesuai jarak),
  bercak warna alami, bintik/tahi lalat, bulu halus di tepi siluet, warna regional (areola & puting,
  pusar, siku, lutut), dan **keringat dingin** (lapisan basah mengilap) saat syok, hipoglikemia,
  keracunan organofosfat, demam, atau nyeri hebat.
- **Anatomi permukaan** (`anatomy.ts`): tulang selangka & lekuk di atasnya, otot dada (atau
  payudara), alur tulang dada, lengkung iga & iga samping (orang kurus), otot perut & garis
  tengahnya, pusar, puting, belikat & alur tulang belakang; deltoid, biseps, triseps, siku, otot
  lengan bawah, tonjolan ulna; paha depan & "tetesan" vastus medialis, tempurung lutut, lekuk lutut,
  tulang kering, dua kepala betis, tendon Achilles, mata kaki; otot leher & jakun. Besarnya mengikuti
  jenis kelamin, usia, dan IMT (berotot, kurus bertulang, atau gemuk membulat). Pakaian mengikuti
  bentuk besar tubuh secara samar.
- **Wajah** (`head.ts`): relief 3D — rongga mata, tulang alis & pangkal hidung, tulang pipi, lekuk
  bawah mata, lipatan nasolabial, filtrum, bibir atas & bawah, garis mulut, lekuk di atas dagu,
  pelipis; cuping & lubang hidung; telinga berpahat (heliks, antiheliks, konka, tragus, lobus).
  Pasien memakai kisi wajah rapat (± 2–3 mm), staf/keluarga kisi standar.
- **Mata 3D** (`eyes.ts`): bola mata bertekstur (sklera dengan pembuluh halus, limbus, iris berserat,
  kornea basah yang memantulkan lampu), kelopak atas & bawah yang berkedip/menyipit/terbelalak dan
  bertemu membentuk celah almond, garis bulu mata, karunkel. **Pupil mengikuti fisiologi**:
  pin-point pada intoksikasi opioid, miosis pada organofosfat, midriasis pada atropin/cedera otak
  berat/henti jantung lama, **anisokor** pada herniasi — sama dengan teks pemeriksaan pupil.
  Sklera ikterik & mata merah mengikuti isyarat klinis.
- **Rambut** (`hair.ts`): tekstur helai halus dengan gumpalan, sorotan anisotropik Kajiya–Kay dua
  lobus (kilau "pita" rambut), tepi garis rambut menipis menjadi helai, lapisan helai luar yang
  melembutkan siluet.
- **Kain** (`cloth.ts`): kilau serat (sheen), tenunan/rajutan/kepar halus, lipatan & kerut lembut,
  warna yang tidak rata — untuk baju, celana, hijab, sprei, selimut, dan bantal.
- **Tangan** lebih halus (buku jari, ibu jari dengan otot tenar) dan menyambung landai ke pergelangan.

Pratinjau pengembang: `npm run dev` lalu `/devbody.html?view=face&skin=c48a5e&hc=15110f`
(parameter: `mode=lie|stand`, `view=face|face3|eyes|torso|chest|abdomen|arm|hand|knee|calf|full`,
`bare=1`, `sex`, `age`, `kg`, `hair`, `hc` warna rambut, `skin` warna kulit, `igd=<skenario>`,
`light=side` untuk menguji bentuk dengan cahaya samping keras, `fov`).

## Luka & perdarahan 3D

Cedera yang tampak ditulis per skenario (`injuries` di `src/data/igd/scenarios/*.ts`, tipe di
`src/core/injury.ts`) dan per kasus poliklinik (`caseInjuries`), lalu digambar langsung **di kulit**
karakter: decal diproyeksikan ke geometri tubuh dalam pose ikat, dipotong per segitiga, dan memakai
bobot tulang yang sama dengan kulit, sehingga luka, darah, dan rembesan ikut menekuk persis bersama
anggota gerak (berbaring, berjalan, mengulurkan lengan).

- **Jenis luka** (tekstur prosedural per piksel + peta normal & kekasaran): laserasi/vulnus dengan tepi
  tidak rata dan jembatan jaringan, luka bacok menganga yang memperlihatkan lapisan dermis–lemak
  kuning–otot, luka iris bertepi rata, luka tusuk, ekskoriasi (lecet bergaris, titik perdarahan,
  krusta), memar yang **warnanya mengikuti umur** (merah-ungu → biru → hijau-kuning), hematoma,
  jejas, **luka bakar derajat I / II superfisial (bula utuh & pecah) / II dalam (merah-putih berbercak,
  slough) / III (keras seperti kulit, jelaga, retakan, vena trombosis)** termasuk sirkumferensial,
  petekie, urtikaria, ulkus tungkai dengan granulasi & fibrin, bekas suntikan (needle tracks), bengkak,
  hematoma, dan emfisema subkutis (permukaan kulit benar-benar terangkat).
- **Wajah**: racoon eyes, lecet pipi, luka bakar wajah dengan jelaga di lubang hidung, alis terbakar,
  bibir bengkak (angioedema), kemerahan, dan darah yang menetes dari hidung (epistaksis) atau mulut
  (hematemesis).
- **Deformitas**: fraktur femur — tungkai memendek dan berotasi eksternal; pakaian dibuka/digunting
  sesuai survei E (badan tanpa baju, lengan baju pendek, celana digunting setinggi luka).
- **Volume darah nyata**: laju perdarahan tiap sumber dihitung dari fisiologi (`v.bleed` × volume
  darah taksiran 70 ml/kg dewasa, 80 ml/kg anak) atau laju ml/menit dengan waktu paruh untuk luka
  vena/kapiler. Darah yang keluar dicatat per luka dan menentukan luas **lapisan darah basah** di
  sekitar luka, **aliran darah mengikuti gravitasi** (ke bawah saat berdiri, ke samping-belakang saat
  berbaring), **rembesan di pakaian**, serta **genangan** di sprei, bantal, brankar, kursi, dan lantai
  (± 6 cm²/ml di kain, 4 cm²/ml di lantai; kelebihan > 650 ml menetes ke lantai).
- **Pola perdarahan**: arteri **memancar berdenyut sinkron dengan nadi pasien** (tinggi pancaran
  mengikuti tekanan sistolik, melemah saat syok, berhenti saat henti jantung), vena mengalir/menetes
  stabil, kapiler merembes. Tetesan adalah partikel berfisika (gravitasi, hambatan udara, memanjang
  searah gerak) yang meninggalkan **cipratan & jejak darah** di lantai saat pasien berjalan.
- **Tindakan terlihat**: kain darurat batik basah darah dari warga, **bebat tekan** (kasa + perban elastis
  yang perlahan merembes merah), **torniket** dengan windlass & label jam (tungkai distal memucat),
  irigasi & luka bersih, **jahitan** benang nilon biru dengan simpul, pendinginan luka bakar.
- **Perdarahan lain**: HPP — perlak (underpad) di bawah bokong dengan genangan & bekuan yang terus
  bertambah, celana basah darah di selangkangan; SCBA — bengkok berisi darah di samping kepala, darah
  di sudut mulut, dan noda muntahan di baju.
- **Kamera inspeksi**: memeriksa **Luka**/**Exposure** mendekatkan mata dokter ke luka utama (yang
  berdarah didahulukan); di poliklinik, pemeriksaan **status lokalis**/kulit membuat pasien mengulurkan
  lengan sambil kamera memperbesar ke luka.
- Teks pemeriksaan selaras dengan yang tampak (mis. "Luka" pada luka bakar menyebut lokasi & derajat,
  kepala-leher pada cedera kepala tidak menulis "tidak ada jejas").

## Mekanisme klinis

- **Fisiologi dinamis** (`src/core/igd/physiology.ts`): variabel tersembunyi (volume darah, perdarahan,
  kebocoran kapiler, tonus vaskular, pompa jantung, obstruksi, pneumotoraks, pirau, V/Q, bronkospasme,
  jalan napas, dorongan napas, TIK, glukosa, keton, kalium, laktat, dll.) berubah menurut laju
  penyakit dan efek terapi (onset–plateau–offset). Tanda vital dihitung dari model curah jantung,
  resistensi, refleks baroreseptor, ventilasi/PaCO₂, persamaan gas alveolar, kurva disosiasi O₂,
  GCS, dan pemicu henti jantung (hipotensi berat, hipoksia, herniasi, hipo/hiperkalemia, iskemia).
  Henti jantung dikelola dengan RJP, irama yang dapat dikejut, ROSC berkala, dan batas resusitasi.
- **Triase** memakai Australasian Triage Scale (ATS 1–5, target waktu 0/10/30/60/120 menit).
- **Pemeriksaan** ABCDE + survei sekunder memberi temuan sesuai keadaan saat itu (bukan teks statis).
- **Anamnesis** bebas atau pertanyaan cepat (SAMPLE). Narasumber: pasien (bila mampu bicara — sesak
  berat memotong kalimat), keluarga, saksi, paramedis (pergi setelah ± 25 menit).
- **Penunjang** memerlukan waktu (sampel diambil perawat, laboratorium/radiologi memproses); CT pada
  pasien tidak stabil adalah tindakan berisiko. Hasil konsisten dengan fisiologi saat sampel diambil.
- **Tindakan & obat** diberikan lewat perawat (atau dokter untuk prosedur tertentu), dengan dosis,
  rute, dan laju infus; dosis kurang/berlebih, kontraindikasi, dan tindakan berbahaya tercatat.
- **Sumber daya terbatas**: jumlah bed, perawat (tugas mengantre; RJP/BVM berkelanjutan), ventilator,
  dan waktu dokter.

## Penilaian

| Aspek | Bobot |
|---|---|
| Triase (kategori & waktu) | 10 |
| Penilaian awal (ABCDE, AMPLE, monitor, waktu respons dokter) | 15 |
| Diagnosis kerja | 10 |
| Pemeriksaan penunjang (yang diindikasikan vs. tidak perlu) | 10 |
| Tindakan kritis & kecepatan (terlambat = nilai berkurang) | 30 |
| Ketepatan terapi & dosis | 10 |
| Hasil (stabil/tidak) & disposisi | 15 |

Penalti keselamatan (ringan 2 · sedang 5 · berat 10, maksimal 30) untuk tindakan tidak diindikasikan
atau berbahaya. Predikat: ≥ 85 Sangat baik · ≥ 70 Baik · ≥ 55 Cukup · ≥ 40 Kurang · < 40 Perlu belajar
lagi. Kalibrasi: rencana "dokter ahli" untuk setiap skenario/varian harus stabil tanpa peringatan
dengan skor ≥ 85; pasien yang dibiarkan harus memburuk dengan skor ≤ 35 (`npm run -s igd-audit`,
`npm run -s igd-score`, dan `tests/igd.test.ts`).

## Skenario (32) dan rujukan pedoman

| Skenario | Kategori | ATS | Cara datang | Varian | Rujukan |
|---|---|---|---|---|---|
| Asma eksaserbasi berat | pernapasan | 2 | dipapah | Eksaserbasi berat; Mengancam nyawa | GINA 2024 — Global Strategy for Asthma Management and Prevention (Box 9-4, 9-5: penanganan eksaserbasi di IGD); PDPI — Asma: Pedoman Diagnosis & Penatalaksanaan di Indonesia |
| Anafilaksis (syok anafilaktik) setelah makan makanan laut | syok | 1 | dipapah | Anafilaksis; Syok anafilaktik | World Allergy Organization Anaphylaxis Guidance 2020 (Cardona et al., WAO Journal 2020); Resuscitation Council UK — Emergency treatment of anaphylaxis (2021); EAACI Anaphylaxis Guidelines 2021 |
| Edema paru akut kardiogenik (hipertensif) | pernapasan | 2 | kursi roda | — | ESC 2021 Guidelines for the diagnosis and treatment of acute and chronic heart failure (+ update 2023); PERKI — Pedoman Tatalaksana Gagal Jantung 2023 |
| Sumbatan jalan napas benda asing pada anak | anak | 1 | digendong | — | ERC Guidelines 2021 — Paediatric Life Support (foreign body airway obstruction); AHA 2020 Guidelines — Pediatric Basic and Advanced Life Support |
| STEMI anterior | jantung | 2 | dipapah | STEMI tanpa komplikasi; STEMI dengan VF | ESC 2023 Guidelines for the management of acute coronary syndromes; PERKI — Pedoman Tatalaksana Sindrom Koroner Akut 2024; AHA 2020 Guidelines for CPR and ECC — Adult Advanced Life Support |
| Henti jantung VF di ruang IGD (disaksikan) | henti_jantung | 2 | jalan | — | AHA 2020 Guidelines for CPR and ECC — Adult Basic & Advanced Life Support (+ 2023 focused update); ERC Guidelines 2021 — Adult Advanced Life Support |
| Takikardia supraventrikular (SVT) stabil | jantung | 2 | jalan | — | ESC 2019 Guidelines for the management of supraventricular tachycardia; AHA 2020 Guidelines — Adult Tachycardia With a Pulse Algorithm; REVERT trial (Appelboam et al., Lancet 2015) — modified Valsalva |
| AV blok total simtomatik | jantung | 2 | kursi roda | — | AHA 2020 Guidelines — Adult Bradycardia Algorithm; ESC 2021 Guidelines on cardiac pacing and cardiac resynchronization therapy |
| Stroke iskemik akut dalam jendela trombolisis | stroke | 2 | kursi roda | TD < 185/110; TD > 185/110 (harus diturunkan sebelum trombolisis) | AHA/ASA 2019 Guidelines for the Early Management of Acute Ischemic Stroke (Powers et al.); ESO 2021 Guidelines on intravenous thrombolysis for acute ischaemic stroke; PERDOSSI — Pedoman Tatalaksana Stroke |
| Stroke perdarahan intraserebral hipertensif | stroke | 1 | brankar | — | AHA/ASA 2022 Guideline for the Management of Patients With Spontaneous Intracerebral Hemorrhage (Greenberg et al.); INTERACT2 & INTERACT3 trials |
| Status epileptikus konvulsif | kesadaran | 1 | brankar | — | American Epilepsy Society 2016 — Evidence-Based Guideline: Treatment of Convulsive Status Epilepticus (Glauser et al.); ESETT trial (Kapur et al., NEJM 2019); PERDOSSI — Pedoman Tatalaksana Epilepsi |
| Hipoglikemia berat akibat sulfonilurea | kesadaran | 2 | brankar | — | ADA Standards of Care in Diabetes 2025 — Section 6: Glycemic Goals and Hypoglycemia; PERKENI — Pedoman Pengelolaan DM Tipe 2 di Indonesia 2021 |
| Ketoasidosis diabetik dengan hipokalemia | kesadaran | 2 | dipapah | — | ADA/EASD/JBDS/AACE/DTS 2024 Consensus Report — Hyperglycemic Crises in Adults With Diabetes (Umpierrez et al., Diabetes Care 2024); PERKENI — Pedoman Pengelolaan DM Tipe 1 |
| Tension pneumotoraks pascatrauma dada | trauma | 1 | brankar | — | ATLS® 10th Edition (American College of Surgeons, 2018) — Chapter 4: Thoracic Trauma; ERC Guidelines 2021 — Cardiac arrest in special circumstances (traumatic cardiac arrest) |
| Multitrauma dengan syok hemoragik (fraktur pelvis & femur) | trauma | 1 | brankar | — | ATLS® 10th Edition (2018) — Chapter 3: Shock; Chapter 5: Abdominal & Pelvic Trauma; CRASH-2 trial (Lancet 2010); European guideline on management of major bleeding and coagulopathy following trauma, 6th ed. (Rossaint et al., Crit Care 2023) |
| Cedera kepala berat dengan perdarahan epidural | trauma | 1 | brankar | — | Brain Trauma Foundation — Guidelines for the Management of Severe TBI, 4th ed. (2016); ATLS® 10th Edition (2018) — Chapter 6: Head Trauma; CRASH trial (Lancet 2004/2005) |
| Perdarahan arteri femoralis superfisial akibat luka bacok | perdarahan | 1 | dipapah | — | ATLS® 10th Edition (2018) — Chapter 8: Musculoskeletal Trauma (life-threatening extremity hemorrhage); Stop the Bleed / Hartford Consensus; European guideline on management of major bleeding and coagulopathy following trauma, 6th ed. (2023) |
| Luka bakar luas dengan trauma inhalasi | trauma | 1 | brankar | — | ATLS® 10th Edition (2018) — Chapter 9: Thermal Injuries; ISBI Practice Guidelines for Burn Care (Burns 2016, 2018); American Burn Association — Advanced Burn Life Support Course 2018 |
| Intoksikasi opioid (heroin) dengan depresi napas | toksikologi | 1 | brankar | — | AHA 2023 Focused Update on Adult Advanced Cardiovascular Life Support (toxicology: opioid poisoning); WHO — Community management of opioid overdose (2014) |
| Keracunan pestisida organofosfat | toksikologi | 1 | brankar | — | Eddleston M, et al. Management of acute organophosphorus pesticide poisoning. Lancet 2008;371:597–607; WHO — Clinical management of acute pesticide intoxication (2008) |
| Syok septik akibat pneumonia | syok | 2 | kursi roda | — | Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2021 (Evans et al.); Sepsis-3 definitions (Singer et al., JAMA 2016) |
| Perdarahan saluran cerna atas — pecah varises esofagus (sirosis) | perdarahan | 2 | kursi roda | — | Baveno VII — Renewing consensus in portal hypertension (J Hepatol 2022); AASLD 2023 Practice Guidance on risk stratification and management of portal hypertension and varices in cirrhosis; HALT-IT trial (Lancet 2020) |
| Dengue shock syndrome pada anak | anak | 2 | digendong | — | WHO — Handbook for Clinical Management of Dengue (2012); Kemenkes RI — Pedoman Nasional Pelayanan Kedokteran Tata Laksana Infeksi Dengue Anak & Remaja (2021) |
| Diare akut dengan dehidrasi berat pada anak | anak | 2 | digendong | — | WHO — The treatment of diarrhoea: a manual for physicians (2005) & Pocket Book of Hospital Care for Children (2013); Kemenkes RI — Lintas Diare / MTBS |
| Eklampsia pada kehamilan 35 minggu | obstetri | 1 | brankar | — | POGI — PNPK Diagnosis dan Tata Laksana Pre-eklamsia (2016); WHO recommendations for prevention and treatment of pre-eclampsia and eclampsia (2011, update 2018); ACOG Practice Bulletin No. 222 (2020) — Gestational Hypertension and Preeclampsia |
| Perdarahan pascapersalinan akibat atonia uteri | obstetri | 1 | brankar | — | WHO recommendations on the assessment of postpartum blood loss and use of a treatment bundle for PPH (2023); WOMAN trial (Lancet 2017); POGI — PNPK Perdarahan Pascasalin (2016) |
| Kolik renal (batu ureter) | ringan | 3 | jalan | — | EAU Guidelines on Urolithiasis 2024; IAUI — Panduan Penatalaksanaan Klinis Batu Saluran Kemih |
| Luka robek telapak tangan (vulnus laceratum) | ringan | 4 | jalan | — | ATLS® 10th Edition (2018) — Chapter 8: Musculoskeletal Trauma; Kemenkes RI — Pedoman Penatalaksanaan Tetanus & Profilaksis Luka |
| Sprain pergelangan kaki (Ottawa ankle rule negatif) | ringan | 4 | jalan | — | Stiell IG, et al. Ottawa ankle rules. JAMA 1993/1994; NICE CKS — Sprains and strains (2022) |
| Faringitis akut viral | ringan | 5 | jalan | — | NICE NG84 — Sore throat (acute): antimicrobial prescribing (2018); IDSA Clinical Practice Guideline for Group A Streptococcal Pharyngitis (2012) |
| Serangan panik dengan hiperventilasi | ringan | 3 | dipapah | — | ESC 2023 ACS Guidelines (evaluasi nyeri dada); NICE CG113 — Generalised anxiety disorder and panic disorder in adults (2011, update 2020) |
| Gastroenteritis akut tanpa dehidrasi berat | ringan | 4 | jalan | — | WHO — The treatment of diarrhoea (2005); IDSA 2017 Guidelines for the Diagnosis and Management of Infectious Diarrhea |

Rujukan umum: Australasian College for Emergency Medicine — *Guidelines on the Implementation of the
Australasian Triage Scale in Emergency Departments* (G24); ATLS® 10th ed. (2018); AHA 2020 Guidelines
for CPR & ECC (+ 2023 focused update); Kemenkes RI — PMK No. 47/2018 tentang Pelayanan Kegawatdaruratan.

## Untuk pengembang

- Mesin: `src/core/igd/` (types, physiology, catalog, drugs, assessment, anamnesis, engine,
  evaluation, shift, sim, validate). Skenario: `src/data/igd/scenarios/*.ts`.
- UI: `src/ui/igd/` (controller, views, monitorDraw, looks). 3D: `src/ui/three/igdRoom.ts`,
  `igdProps.ts`, `igdScene.ts`, dan perluasan `actor.ts` (berbaring, keadaan klinis, tangan staf).
- Realisme tubuh: `skin.ts` (bahan kulit), `anatomy.ts` (pahat otot/tulang), `eyes.ts`, `hair.ts`,
  `cloth.ts`, relief wajah di `head.ts`, IBL & GTAO di `stage.ts`. Uji: `npx vitest run tests/realism.test.ts`.
- Luka & darah: `src/core/injury.ts` (model cedera, laju perdarahan), `src/ui/three/decal.ts`
  (proyeksi decal ke kulit skinned, bahan "muncul bertahap"), `woundTextures.ts` (tekstur prosedural),
  `wounds.ts` (penempatan anatomis, balutan, torniket, kain darurat), `bloodFx.ts` (pancaran,
  tetesan, noda & genangan). Pratinjau: `npm run dev` lalu
  `/devwound.html?igd=perdarahan_eksternal&mode=lie&focus=bacok_paha&dist=0.45` (parameter lain:
  `mode=lie|stand|seated`, `focus=<idLuka>|head|hips`, `rate`, `lost`, `pressure=1`, `tq=1`,
  `sutured=1`, `cleaned=1`, `wrap=1`, `cooled=1`, `hema`, `vag`, `disease=&traits=` untuk kasus
  poliklinik). Uji: `npx vitest run tests/injury.test.ts`.
- Audit: `npm run -s igd-audit` (validasi + simulasi pakar/lalai semua skenario & varian),
  `npm run -s igd-score` (sebaran skor), uji `npx vitest run tests/igd.test.ts`.
