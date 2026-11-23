"""Batch KULIT A — infeksi kulit, IMS kulit & tumor jinak (18 penyakit)."""
from lib import C, CX, D, F, PF, T, NT, SY, W, X, REF_PPK

SYS = "Kulit & kelamin"
REF_KK = [REF_PPK, "PERDOSKI. Panduan Praktik Klinis bagi Dokter Spesialis Dermatologi dan Venereologi Indonesia (2021)"]
REF_IMS = [REF_PPK, "Kemenkes RI. Pedoman Nasional Penanganan Infeksi Menular Seksual (2016)"]

def DS(lok, efl, khusus=None, p=None, when=None, diag=True):
    """Status dermatologis ringkas: lokasi, efloresensi, tanda khusus."""
    out = [F("status_dermatologis", "lokasi", lok, when=when, p=p), F("status_dermatologis", "efloresensi", efl, when=when, p=p, diag=diag)]
    if khusus:
        out.append(F("status_dermatologis", "tanda_khusus", khusus, when=when, p=p))
    return out

C("penyakit_arteri_perifer", "Penyakit arteri perifer", "Jantung & pembuluh darah", "tinggi", "Klaudikasio, kaki dingin pucat, pulsasi lemah, ABI < 0,9; ulkus arterial nyeri di ujung jari. Rujuk.")
C("kista_epidermoid", "Kista epidermoid (ateroma)", SYS, "rendah", "Benjolan kistik subkutan melekat ke kulit dengan punctum di tengah.")
C("sarkoma_jaringan_lunak", "Sarkoma jaringan lunak", SYS, "tinggi", "Massa > 5 cm, dalam, keras, cepat membesar, nyeri. Rujuk.")
C("klavus", "Klavus (mata ikan)", SYS, "rendah", "Penebalan kulit berinti di titik tekanan, nyeri saat ditekan langsung, garis kulit tetap.")
C("karsinoma_sel_skuamosa_kulit", "Keganasan kulit (KSS/KSB)", SYS, "tinggi", "Nodul/ulkus kulit yang tumbuh progresif, mudah berdarah, tidak sembuh, pada kulit terpapar matahari/luka kronik. Rujuk biopsi.")
C("rubela", "Rubela", SYS, "sedang", "Demam ringan, ruam makulopapular halus, KGB retroaurikular/oksipital; berbahaya bagi ibu hamil.")
C("eksantema_subitum", "Eksantema subitum (roseola)", SYS, "rendah", "Bayi demam tinggi 3 hari, ruam muncul setelah demam turun.")
C("mpox", "Mpox (cacar monyet)", SYS, "tinggi", "Lesi vesikopustul dalam stadium SAMA, umbilikasi, limfadenopati menonjol, riwayat kontak; lapor & isolasi.")
C("ulkus_mole", "Ulkus mole (chancroid)", SYS, "sedang", "Ulkus genital multipel, NYERI, tepi bergaung, dasar kotor, bubo inguinal nyeri.")
C("vitiligo", "Vitiligo", SYS, "rendah", "Makula depigmentasi putih susu berbatas tegas, sensibilitas normal.")
C("reaksi_kusta", "Reaksi kusta", SYS, "tinggi", "Lesi lama meradang/nodus eritema nyeri, neuritis (nyeri & fungsi saraf turun), demam — prednison & rujuk.")
C("selulitis", "Selulitis", SYS, "sedang", "Infeksi dermis-subkutis: eritema batas tidak tegas, hangat, nyeri, edema, demam.")
C("fasiitis_nekrotikans", "Fasiitis nekrotikans", SYS, "kritis", "Nyeri hebat tidak sebanding temuan, bula hemoragik, krepitasi, syok. Rujuk segera untuk debridemen.")
C("ssss", "Staphylococcal scalded skin syndrome", SYS, "kritis", "Anak dengan eritema generalisata nyeri, bula kendur luas, Nikolsky (+). Rujuk segera.")
C("antraks_kulit", "Antraks kulit", SYS, "kritis", "Papul → vesikel → eskar hitam tidak nyeri dengan edema luas, kontak ternak/daging. Lapor & rujuk.")

# 1 ---------------------------------------------------------------------------------- ulkus tungkai
D(id="ulkus_tungkai", name="Ulkus pada tungkai (ulkus vena)", aka=["Borok kaki", "Ulkus varikosum", "Ulkus venosum", "Luka kaki menahun"],
  sys=SYS, prev=0.8, danger="sedang",
  summary="Ulkus kronik (> 4–6 minggu) di tungkai bawah, tersering akibat insufisiensi vena: dangkal, tepi landai ireguler, dasar granulasi dengan eksudat, di atas maleolus medial; kulit sekitar hiperpigmentasi, dermatitis stasis, edema, varises. Bedakan dari ulkus arterial (nyeri, pulsasi lemah, ABI < 0,9) dan diabetik (neuropati, di titik tekanan). ABI ≥ 0,8 diperlukan sebelum kompresi.",
  day=(30, 180), ages=[(40, 59, 3), (60, 75, 4)], male=0.45,
  occ=[("pedagang_pasar", 2), ("guru", 1), ("satpam", 1)], bias=0.3,
  traits=[("infeksi_sekunder", 0.3), ("dm_menyertai", 0.15)],
  tl={"infeksi_sekunder": "Infeksi sekunder/selulitis sekitar ulkus.", "dm_menyertai": "DM menyertai."},
  tc={"dm_menyertai": "dm_tipe2"},
  sym=[("luka_sulit_sembuh", 1), ("bengkak_kaki", 0.7), ("varises", 0.75), ("gatal_kulit", 0.4), ("demam", 0.5, T("infeksi_sekunder"))],
  cc=["luka_sulit_sembuh"], ex=["bengkak_kaki"], mis=["luka biasa", "kena kutu air", "guna-guna"], fears=["diamputasi", "kencing manis"],
  ana={
      "onset": [("Sudah tiga bulan, Dok, luka di mata kaki kiri nggak sembuh-sembuh, makin lebar.", "Ulkus kronik > 6 minggu")],
      "pola": [("Kalau berdiri lama kaki bengkak dan pegal, Dok, diangkat ke atas enakan.", "Memberat berdiri lama, membaik dengan elevasi (vena)")],
      "kebiasaan": [("Kerja saya berdiri seharian, Dok, jualan di pasar.", "Berdiri lama"), ("Saya nggak merokok, Dok.", "Tanpa merokok", None, None, 0.5)],
      "riwayat_penyakit": [("Dari dulu urat di kaki saya menonjol berkelok-kelok, Dok.", "Varises", None, "varises"),
                           ("Saya nggak pernah sakit kaki kalau jalan jauh, Dok.", "Tanpa klaudikasio (bukan arterial)")],
      "keparahan": [("Sekarang lukanya bernanah, sekitarnya merah, badan meriang, Dok.", "Tanda infeksi sekunder", T("infeksi_sekunder"), "demam"),
                    ("Lukanya basah tapi nggak terlalu sakit, Dok.", "Nyeri ringan (khas vena)", NT("infeksi_sekunder"))],
  },
  f=[
      F("status_lokalis", "luka", "Ulkus dangkal 3 × 4 cm di atas maleolus medial kiri, dasar jaringan granulasi dengan fibrin, eksudat sedang", diag=True),
      F("status_lokalis", "tepi_dasar", "Tepi landai ireguler; kulit sekitar hiperpigmentasi coklat, indurasi (lipodermatosklerosis)", when=NT("infeksi_sekunder")),
      F("status_lokalis", "tepi_dasar", "Tepi ireguler dengan pus; eritema & hangat meluas 2 cm di sekitar ulkus", when=T("infeksi_sekunder")),
      F("status_lokalis", "distal", "Pulsasi dorsalis pedis & tibialis posterior teraba kuat; sensorik baik"),
      F("ekstremitas_kulit", "edema", "Edema pitting tungkai bawah kiri"),
      F("ekstremitas_kulit", "kulit", "Varises tungkai kiri, dermatitis stasis"),
      F("abi_doppler", "abi", (0.95, 1.15)),
      F("tanda_vital", "suhu", (37.8, 38.6), when=SY("demam")),
      F("gula_darah", "gds", (220, 300), when=T("dm_menyertai")),
      F("darah_lengkap", "leukosit", (11500, 15500), when=T("infeksi_sekunder")),
  ],
  dd=[
      X("penyakit_arteri_perifer", "Ulkus arterial: nyeri hebat terutama malam/elevasi, di ujung jari/tumit, kaki dingin pucat, pulsasi lemah, ABI < 0,9.", ["abi_doppler", "status_lokalis"], must=True),
      X("dm_tipe2", "Ulkus diabetik: di titik tekanan telapak, neuropati (monofilamen −), gula darah tinggi.", ["gula_darah", "kaki_diabetik"]),
      X("karsinoma_sel_skuamosa_kulit", "Ulkus Marjolin: ulkus kronik yang tepinya meninggi keras, mudah berdarah — biopsi.", ["status_lokalis"]),
  ],
  key=["Ulkus kronik dangkal di atas maleolus medial dengan dasar granulasi", "Varises, edema, hiperpigmentasi/dermatitis stasis", "Pulsasi teraba, ABI normal"],
  teach=["Terapi utama ulkus vena adalah KOMPRESI + elevasi — pastikan ABI ≥ 0,8 terlebih dulu."],
  plan=dict(topics=["onset", "pola", "kebiasaan", "riwayat_penyakit", "keparahan", "keluhan_lain"],
            exams=[("status_lokalis", "kunci", "Deskripsi ulkus & neurovaskular distal."), ("ekstremitas_kulit", "kunci", "Edema, varises, kulit sekitar."),
                   ("kaki_diabetik", "pendukung", "Neuropati & pulsasi.")],
            tests=[("abi_doppler", "kunci", "Menyingkirkan penyakit arteri sebelum kompresi."), ("gula_darah", "pendukung", "Skrining DM."),
                   ("darah_lengkap", "komplikasi", "Infeksi sekunder.", T("infeksi_sekunder"))]),
  disp=[("rawat_jalan", "Perawatan luka lembap, kompresi & elevasi, antibiotik bila infeksi; kontrol 1–2 minggu; rujuk bila tidak membaik 12 minggu.", None, ["rujuk_spesialis"])],
  mg=["Bersihkan dengan NaCl 0,9%, debridemen jaringan nekrotik, balutan lembap sesuai eksudat.", "Kompresi (perban elastis/stoking) bila ABI ≥ 0,8; elevasi tungkai saat istirahat.",
      "Antibiotik sistemik bila selulitis/infeksi; emolien/steroid ringan untuk dermatitis stasis.", "Kelola DM, berat badan, aktivitas jalan kaki; rujuk bila tidak membaik."],
  ap=["Tentukan etiologi: vena vs arteri vs diabetik dari lokasi, nyeri, pulsasi, ABI.", "Nilai infeksi sekunder."],
  refs=REF_KK)

# 2 ---------------------------------------------------------------------------------- lipoma
D(id="lipoma", name="Lipoma", aka=["Benjolan lemak", "Tumor lemak jinak"],
  sys=SYS, prev=0.7,
  summary="Tumor jinak jaringan lemak subkutan tersering: benjolan lunak-kenyal, berbatas tegas, mudah digerakkan, tidak nyeri, tumbuh lambat, kulit di atasnya normal; sering di punggung, bahu, lengan, leher. Waspadai keganasan bila > 5 cm, keras, terfiksir, cepat membesar, atau nyeri. Eksisi bila mengganggu.",
  day=(60, 720), ages=[(25, 39, 3), (40, 60, 4), (61, 70, 1)], male=0.5,
  traits=[("multipel", 0.15)], tl={"multipel": "Lipoma multipel."},
  sym=[("benjolan_kulit", 1)],
  cc=["benjolan_kulit"], mis=["kelenjar", "daging tumbuh", "kanker"], fears=["kanker", "tumor ganas"],
  ana={
      "onset": [("Sudah dua tahunan, Dok, benjolan di punggung, makin lama sedikit membesar pelan-pelan.", "Tumbuh sangat lambat dalam tahun")],
      "karakter": [("Lunak, Dok, nggak sakit, bisa digeser-geser.", "Lunak, mobile, tidak nyeri")],
      "keparahan": [("Nggak mengganggu sih, Dok, cuma malu kalau pakai baju tipis.", "Keluhan kosmetik")],
      "progresi": [("Nggak pernah tiba-tiba membesar cepat atau jadi merah, Dok.", "Tanpa pertumbuhan cepat/tanda radang")],
      "riwayat_keluarga": [("Bapak saya juga punya benjolan begini di lengan, Dok.", "Riwayat keluarga lipoma", T("multipel")), ("Di keluarga nggak ada yang begini, Dok.", None, NT("multipel"))],
  },
  f=[
      F("status_lokalis", "benjolan", "Benjolan subkutan 4 cm di punggung kanan atas, lunak-kenyal, berbatas tegas, mobile, tidak nyeri, kulit di atasnya normal, tanpa punctum", diag=True),
      F("usg_superfisial", "lesi", "Massa subkutan ovoid isoekoik berkapsul tipis, tanpa vaskularisasi"), F("usg_superfisial", "kesan", "Sesuai lipoma"),
  ],
  dd=[
      X("sarkoma_jaringan_lunak", "Sarkoma: > 5 cm, keras, terfiksir, dalam, cepat membesar/nyeri — rujuk.", ["status_lokalis", "progresi"], must=True),
      X("kista_epidermoid", "Kista epidermoid: melekat ke kulit dengan punctum, isi seperti bubur.", ["status_lokalis"]),
      X("abses_folikel", "Abses: nyeri, merah, hangat, fluktuasi, akut.", ["karakter", "status_lokalis"]),
  ],
  key=["Benjolan subkutan lunak, berbatas tegas, mobile, tidak nyeri, tumbuh lambat", "Kulit di atasnya normal, tanpa punctum"],
  teach=["Red flag keganasan jaringan lunak: > 5 cm, di bawah fasia, keras, terfiksir, cepat membesar."],
  plan=dict(topics=["onset", "karakter", "keparahan", "progresi", "riwayat_keluarga", "keluhan_lain"],
            exams=[("status_lokalis", "kunci", "Ukuran, konsistensi, mobilitas, punctum.")],
            opt=[("usg_superfisial", "Bila ragu (kista/abses) atau lokasi dalam.")]),
  disp=[("rawat_jalan", "Observasi atau eksisi elektif (bedah minor) bila mengganggu; rujuk bila curiga keganasan.", None, ["rujuk_spesialis"])],
  mg=["Edukasi: jinak; observasi bila kecil & asimtomatik.", "Eksisi bedah minor dengan anestesi lokal bila kosmetik/nyeri/membesar; kirim PA bila atipikal.",
      "Rujuk bila > 5 cm, keras, dalam, atau cepat membesar."],
  ap=["Palpasi ukuran, konsistensi, mobilitas, hubungan dengan kulit.", "Cari tanda keganasan."],
  refs=REF_KK)

# 3 ---------------------------------------------------------------------------------- veruka vulgaris
D(id="veruka_vulgaris", name="Veruka vulgaris", aka=["Kutil", "Common wart", "Kutil biasa"],
  sys=SYS, prev=0.9,
  summary="Infeksi HPV pada epidermis: papul/nodul berbatas tegas, permukaan kasar verukosa keabuan, sering di punggung tangan, jari, periungual, lutut; titik hitam (kapiler trombosis). Menular melalui kontak dan autoinokulasi (fenomena Koebner). Dapat hilang spontan; terapi keratolitik (asam salisilat), krioterapi, atau elektrokauter.",
  day=(30, 365), ages=[(5, 9, 3), (10, 25, 4), (26, 50, 2)], male=0.5,
  occ=[("pelajar", 2), ("anak_sd", 2)], bias=0.3,
  traits=[("periungual", 0.3), ("koebner", 0.3)], tl={"periungual": "Veruka periungual.", "koebner": "Autoinokulasi/Koebner (suka digigit/digaruk)."},
  sym=[("kutil", 1)],
  cc=["kutil"], mis=["mata ikan", "tahi lalat", "kapalan"], fears=["kanker kulit", "menular"],
  ana={
      "onset": [("Sudah beberapa bulan, Dok, mulai satu lalu jadi banyak.", "Bertambah jumlah dalam bulan")],
      "lokasi": [("Di punggung jari tangan kanan, Dok, ada juga di pinggir kuku.", "Jari & periungual")],
      "karakter": [("Kasar, keras, nggak sakit, Dok. Ada titik-titik hitamnya.", "Permukaan kasar, titik hitam, tidak nyeri")],
      "kebiasaan": [("Suka saya gigit-gigit dan korek, Dok.", "Menggigit/mengorek (autoinokulasi)", T("koebner")), ("Nggak saya apa-apain, Dok.".replace("apa-apain", "otak-atik"), None, NT("koebner"))],
      "riwayat_keluarga": [("Adik saya juga ada kutil, Dok.", "Kontak penderita kutil", None, None, 0.5), ("Di rumah cuma saya yang begini, Dok.", None)],
  },
  f=DS("Punggung jari II–III tangan kanan & periungual", "Papul-nodul verukosa multipel 3–8 mm, permukaan kasar keabuan, dengan titik-titik hitam",
       "Tersusun linear di bekas garukan (fenomena Koebner)", ) [:2] + [F("status_dermatologis", "tanda_khusus", "Tersusun linear di bekas garukan (fenomena Koebner)", when=T("koebner"))],
  dd=[
      X("karsinoma_sel_skuamosa_kulit", "Keganasan: lesi tunggal cepat membesar, ulserasi, mudah berdarah, usia lanjut — biopsi.", ["status_dermatologis"], must=True),
      X("klavus", "Klavus: di titik tekanan, berinti, garis kulit tetap, nyeri ditekan langsung.", ["lokasi", "status_dermatologis"]),
      X("moluskum_kontagiosum", "Moluskum: papul kubah mengkilap dengan delle, bukan permukaan kasar.", ["status_dermatologis"]),
  ],
  key=["Papul/nodul verukosa permukaan kasar dengan titik hitam", "Di tangan/jari/periungual, tidak nyeri", "Autoinokulasi"],
  teach=["Kutil dapat hilang spontan dalam 1–2 tahun; terapi untuk mempercepat & mencegah penyebaran."],
  plan=dict(topics=["onset", "lokasi", "karakter", "kebiasaan", "riwayat_keluarga", "keluhan_lain"],
            exams=[("status_dermatologis", "kunci", "Morfologi & distribusi lesi.")]),
  disp=[("rawat_jalan", "Keratolitik topikal ± krioterapi/elektrokauter; kontrol 2–4 minggu.")],
  mg=["Asam salisilat 17–40% topikal (rendam & kikis dulu) tiap malam ± oklusi, beberapa minggu.", "Krioterapi nitrogen cair atau elektrokauter/bedah listrik untuk lesi membandel.",
      "Jangan digigit/digaruk; handuk & alat pribadi terpisah."],
  ap=["Inspeksi morfologi khas; bedakan dari klavus & keganasan."],
  refs=REF_KK)

# 4 ---------------------------------------------------------------------------------- moluskum kontagiosum
D(id="moluskum_kontagiosum", name="Moluskum kontagiosum", aka=["Moluskum", "Molluscum contagiosum"],
  sys=SYS, prev=0.8,
  summary="Infeksi poxvirus pada kulit, tersering anak (kontak kulit, kolam renang) dan dewasa aktif seksual (genital). Papul kubah kecil 2–5 mm, putih/warna kulit, mengkilat seperti mutiara dengan cekungan di tengah (delle), bila ditekan keluar massa putih seperti nasi (badan moluskum). Lesi luas/besar pada dewasa: pikirkan imunokompromais (HIV). Swasirna dalam bulan; dapat dienukleasi.",
  day=(30, 180), ages=[(2, 9, 5), (10, 18, 2), (19, 40, 2)], male=0.5,
  occ=[("anak_tk", 2), ("anak_sd", 2)], bias=0.4,
  traits=[("genital_dewasa", 0.4, W(amin=18))], tl={"genital_dewasa": "Moluskum genital pada dewasa (IMS)."},
  sym=[("bintil_mutiara", 1), ("gatal_kulit", 0.3), ("risiko_ims", 0.8, T("genital_dewasa"))],
  cc=["bintil_mutiara"], mis=["kutil", "biang keringat", "jerawat"], fears=["menular", "cacar"],
  ana={
      "onset": [("Sudah dua bulan, Dok, bintilnya makin banyak.", "Bertambah dalam bulan")],
      "lokasi": [("Di badan, lipatan ketiak, dan wajah, Dok.", "Badan, lipatan, wajah", NT("genital_dewasa")),
                 ("Di sekitar kemaluan dan paha dalam, Dok.", "Anogenital", T("genital_dewasa"))],
      "karakter": [("Bintilnya kecil mengkilap, tengahnya ada lekukan, kalau dipencet keluar putih-putih, Dok.", "Papul mengkilat dengan delle & massa putih")],
      "riwayat_keluarga": [("Teman di sekolah/kolam renang juga ada yang begini, Dok.", "Kontak (kolam renang/teman)", NT("genital_dewasa")),
                           ("Pasangan saya juga ada bintil begini, Dok.", "Pasangan seksual", T("genital_dewasa"), "risiko_ims")],
      "riwayat_penyakit": [("Saya nggak pernah sakit berat atau berat badan turun, Dok.", "Tanpa tanda imunokompromais")],
  },
  f=DS("Badan, aksila, wajah", "Papul kubah multipel 2–4 mm, putih mengkilat seperti mutiara dengan delle di tengah; ditekan keluar massa putih (badan moluskum)", when=NT("genital_dewasa"))
    + DS("Pubis, paha medial, genital", "Papul kubah multipel 2–4 mm, putih mengkilat dengan delle; ditekan keluar badan moluskum", when=T("genital_dewasa")),
  dd=[
      X("hiv", "Moluskum luas/besar/wajah pada dewasa: curigai imunokompromais — tawarkan tes HIV.", ["riwayat_penyakit", "kebiasaan"], must=True),
      X("veruka_vulgaris", "Veruka: permukaan kasar tanpa delle.", ["status_dermatologis"]),
      X("varisela", "Varisela: vesikel akut dengan demam, berbagai stadium.", ["onset", "status_dermatologis"]),
  ],
  key=["Papul kubah mengkilat dengan delle (umbilikasi)", "Massa putih (badan moluskum) bila ditekan", "Anak; dewasa: genital (IMS)"],
  teach=["Moluskum anak umumnya swasirna 6–18 bulan; enukleasi mempercepat & mengurangi penularan."],
  plan=dict(topics=["onset", "lokasi", "karakter", "riwayat_keluarga", "riwayat_penyakit", "keluhan_lain"],
            exams=[("status_dermatologis", "kunci", "Morfologi khas (delle)."), ("pemeriksaan_genital", "pendukung", "Lesi genital & IMS lain.", T("genital_dewasa"))],
            tests=[("tes_hiv", "pendukung", "Moluskum genital dewasa: skrining IMS/HIV.", T("genital_dewasa"))]),
  disp=[("rawat_jalan", "Enukleasi/kuretase atau observasi; edukasi penularan; kontrol 2–4 minggu.")],
  mg=["Enukleasi dengan ekstraktor komedo/jarum steril (antiseptik setelahnya) atau krioterapi.", "Alternatif topikal: KOH 10%, tretinoin.",
      "Jangan digaruk, handuk terpisah, hindari berbagi kolam renang saat lesi aktif.", "Dewasa genital: skrining IMS/HIV & pasangan."],
  ap=["Kenali morfologi delle; nilai luas & lokasi.", "Pada dewasa genital/lesi luas: IMS & HIV."],
  refs=REF_KK)

# 5 ---------------------------------------------------------------------------------- herpes zoster
D(id="herpes_zoster", name="Herpes zoster tanpa komplikasi", aka=["Cacar ular", "Dompo", "Shingles", "Herpes zoster"],
  sys=SYS, prev=1.2, danger="sedang",
  summary="Reaktivasi virus varisela-zoster di ganglion sensoris, umumnya usia > 50 tahun atau imunokompromais. Nyeri/terbakar/gatal prodromal di satu dermatom 1–3 hari, lalu vesikel berkelompok di atas dasar eritema UNILATERAL mengikuti dermatom, tidak melewati garis tengah. Komplikasi: neuralgia pascaherpetika, herpes zoster oftalmikus (tanda Hutchinson — rujuk). Asiklovir dalam 72 jam.",
  day=(2, 6), ages=[(20, 49, 2), (50, 64, 3), (65, 75, 3)], male=0.5,
  traits=[("oftalmikus", 0.08), ("imunokompromais", 0.06, W(amax=49))],
  tl={"oftalmikus": "Herpes zoster oftalmikus (dermatom V1).", "imunokompromais": "Usia muda — pertimbangkan imunokompromais (HIV)."},
  sym=[("nyeri_terbakar_kulit", 1), ("lepuh_kulit", 1), ("demam", 0.3), ("lemas", 0.3), ("gatal_kulit", 0.3), ("mata_merah", 1, T("oftalmikus"))],
  cc=["lepuh_kulit", "nyeri_terbakar_kulit"], ex=["nyeri_terbakar_kulit"], mis=["digigit serangga", "kena racun tomcat", "dompo kena guna-guna"], fears=["kalau melingkar pinggang bisa meninggal", "menular"],
  ana={
      "onset": [("Tiga hari lalu dada kiri sampai punggung perih kayak terbakar, Dok, kemarin muncul bintil berair berkelompok.", "Nyeri prodromal 1–3 hari lalu vesikel berkelompok")],
      "lokasi": [("Cuma di sebelah kiri, Dok, dari punggung melingkar ke dada, nggak sampai ke kanan.", "Unilateral mengikuti dermatom", NT("oftalmikus")),
                 ("Di dahi kanan sampai ke kelopak mata dan ujung hidung, Dok, matanya merah.", "Dermatom V1 dengan mata merah (oftalmikus)", T("oftalmikus"), "mata_merah")],
      "riwayat_penyakit": [("Waktu kecil pernah cacar air, Dok.", "Riwayat varisela"),
                           ("Akhir-akhir ini sering sakit dan berat badan turun, Dok.", "Curiga imunokompromais", T("imunokompromais"))],
      "keparahan": [("Perihnya sampai nggak bisa tidur, Dok, kena baju saja sakit.", "Nyeri neuropatik berat")],
      "riwayat_obat": [("Belum minum obat apa pun, Dok, cuma dikasih bedak.".replace("apa pun", "khusus"), None)],
  },
  f=DS("Dermatom T5 kiri, unilateral, tidak melewati garis tengah", "Vesikel berkelompok di atas dasar eritema, sebagian pustul & krusta", when=NT("oftalmikus"))
    + DS("Dermatom V1 kanan: dahi, kelopak atas, ujung hidung (tanda Hutchinson +)", "Vesikel berkelompok di atas dasar eritema dengan edema kelopak", when=T("oftalmikus"))
    + [F("segmen_anterior", "konjungtiva_bulbi", "Injeksi konjungtiva & siliar kanan", when=T("oftalmikus")),
       F("tzanck", "hasil", "Sel datia berinti banyak (+)", diag=True, p=0.8),
       F("kepala_leher", "kgb", "KGB regional membesar nyeri tekan", p=0.4)],
  dd=[
      X("sindrom_koroner_akut", "Nyeri prodromal dada sebelum ruam dapat menyerupai SKA — nilai karakter nyeri & EKG bila ruam belum muncul.", ["status_dermatologis", "keluhan_lain"], must=True),
      X("herpes_simpleks", "Herpes simpleks: kelompok kecil, berulang di tempat sama (bibir/genital), tidak dermatomal luas.", ["status_dermatologis", "episode_sebelumnya"]),
      X("dermatitis_kontak_iritan", "Dermatitis kontak (mis. paederus/tomcat): lesi linear di area kontak, rasa terbakar, tidak mengikuti dermatom.", ["status_dermatologis"]),
  ],
  key=["Nyeri prodromal lalu vesikel berkelompok di atas dasar eritema", "Unilateral mengikuti satu dermatom, tidak melewati garis tengah", "Usia > 50 tahun/imunokompromais"],
  teach=["Asiklovir paling efektif bila dimulai < 72 jam sejak lesi muncul.", "Lesi di ujung hidung (tanda Hutchinson) = risiko keterlibatan mata — rujuk dokter mata."],
  cx=[CX("oftalmikus", "Herpes zoster oftalmikus", "oftalmikus", ["status_dermatologis", "segmen_anterior"], "Keterlibatan N. V1 dengan risiko keratitis/uveitis — asiklovir & rujuk dokter mata.")],
  plan=dict(topics=["onset", "lokasi", "riwayat_penyakit", "keparahan", "keluhan_lain"],
            exams=[("status_dermatologis", "kunci", "Distribusi dermatomal & morfologi."), ("segmen_anterior", "pendukung", "Keterlibatan mata.", T("oftalmikus"))],
            opt=[("tzanck", "Bila diagnosis klinis ragu."), ("tes_hiv", "Zoster pada usia muda/berulang (dengan konseling).")]),
  disp=[("rujuk_spesialis", "Zoster oftalmikus: asiklovir lalu rujuk dokter mata.", T("oftalmikus"), ["rujuk_segera"]),
        ("rawat_jalan", "Asiklovir 7 hari, analgesik, perawatan lesi; kontrol 1 minggu.")],
  mg=["Asiklovir 5 × 800 mg selama 7 hari (atau valasiklovir 3 × 1 g) dalam 72 jam.", "Analgesik (parasetamol/ibuprofen); nyeri neuropatik: amitriptilin/gabapentin dosis rendah.",
      "Kompres/bedak kalamin, vesikel jangan dipecah, pakaian longgar.", "Hindari kontak dengan ibu hamil/bayi/orang yang belum pernah cacar air sampai lesi berkrusta."],
  ap=["Kenali nyeri prodromal + ruam dermatomal.", "Nilai keterlibatan mata & imunokompromais."],
  refs=REF_KK)

# 6 ---------------------------------------------------------------------------------- morbili
D(id="morbili", name="Morbili (campak) tanpa komplikasi", aka=["Campak", "Measles", "Rubeola", "Tampek"],
  sys=SYS, prev=0.9, danger="sedang",
  summary="Infeksi virus campak sangat menular pada anak yang belum diimunisasi. Stadium prodromal 3–4 hari: demam tinggi, batuk, pilek, konjungtivitis (3C), bercak Koplik di mukosa pipi. Lalu ruam makulopapular eritematosa mulai di belakang telinga/wajah menyebar ke badan & ekstremitas; ruam menghilang meninggalkan hiperpigmentasi & deskuamasi. Komplikasi: pneumonia, diare, otitis, ensefalitis, xeroftalmia. Vitamin A wajib; laporkan (PD3I).",
  day=(4, 7), ages=[(0, 0, 1), (1, 5, 5), (6, 9, 3), (10, 20, 1)], male=0.5, infant=("bulan", (9, 11)),
  occ=[("balita", 2), ("anak_tk", 2), ("anak_sd", 2)], bias=0.4,
  traits=[("tidak_imunisasi", 0.85), ("pneumonia", 0.08), ("kontak_campak", 0.7)],
  tl={"tidak_imunisasi": "Belum imunisasi campak/MR.", "pneumonia": "Komplikasi pneumonia.", "kontak_campak": "Kontak dengan penderita campak."},
  sym=[("demam", 1), ("ruam_kulit", 1), ("batuk", 0.9), ("pilek", 0.8), ("mata_merah", 0.8), ("mata_berair", 0.5), ("diare", 0.3), ("rewel", 0.6, W(amax=5)),
       ("nafsu_makan_turun", 0.6), ("sesak_napas", 1, T("pneumonia"))],
  cc=["ruam_kulit", "demam"], ex=["demam", "batuk"], mis=["alergi", "biang keringat", "masuk angin"], fears=["campak", "anaknya buta", "menular ke adiknya"],
  ana={
      "onset": [("Empat hari lalu panas tinggi, batuk pilek, matanya merah berair, Dok. Kemarin muncul bintik merah di belakang telinga, sekarang sampai badan.",
                 "Prodromal 3C lalu ruam mulai di belakang telinga menyebar ke bawah", None, ["batuk", "mata_merah"])],
      "lokasi": [("Merahnya mulai dari belakang telinga dan muka, Dok, terus turun ke dada dan kaki.", "Penyebaran sefalokaudal")],
      "kebiasaan": [("Imunisasinya nggak lengkap, Dok, campak belum.", "Belum imunisasi campak/MR", T("tidak_imunisasi")), ("Imunisasinya lengkap, Dok.", None, NT("tidak_imunisasi"))],
      "riwayat_keluarga": [("Di kampung banyak anak yang lagi campak, Dok.", "Kontak/KLB campak", T("kontak_campak")), ("Belum tahu ada yang sakit sama, Dok.", None, NT("kontak_campak"))],
      "keparahan": [("Sekarang napasnya cepat dan sesak, Dok.", "Sesak (curiga pneumonia)", T("pneumonia"), "sesak_napas"),
                    ("Masih mau minum, Dok, nggak sesak, nggak kejang.", "Tanpa tanda komplikasi", NT("pneumonia"))],
  },
  f=DS("Belakang telinga, wajah, leher, badan, ekstremitas (sefalokaudal)", "Makula-papul eritematosa sebagian konfluens (morbiliformis)")
    + [F("pemeriksaan_tenggorok", "mukosa_mulut", "Bercak Koplik: bintik putih keabuan di mukosa bukal setinggi molar", diag=True, p=0.7),
       F("segmen_anterior", "konjungtiva_bulbi", "Injeksi konjungtiva bilateral, berair"),
       F("tanda_vital", "suhu", (38.8, 40.0)), F("kepala_leher", "kgb", "KGB servikal kecil multipel", p=0.5),
       F("pemeriksaan_paru", "auskultasi", "Ronkhi basah halus (+/+)", when=T("pneumonia")),
       F("tanda_vital", "napas", (42, 55), when=T("pneumonia")), F("tanda_vital", "spo2", (90, 93), when=T("pneumonia"))],
  dd=[
      X("dengue", "Dengue: demam tinggi dengan ruam/petekie, uji tourniquet (+), trombositopenia, tanpa 3C & Koplik.", ["uji_tourniquet", "pemeriksaan_tenggorok"], must=True),
      X("rubela", "Rubela: lebih ringan, demam ringan, KGB retroaurikular/oksipital, tanpa Koplik.", ["kepala_leher", "pemeriksaan_tenggorok"]),
      X("erupsi_obat", "Erupsi obat: riwayat obat 1–2 minggu sebelumnya, gatal, tanpa prodromal 3C.", ["riwayat_obat"]),
      X("pneumonia", "Pneumonia (komplikasi): takipnea, retraksi, ronki — rujuk.", ["tanda_vital", "pemeriksaan_paru"], must=True),
  ],
  key=["Demam tinggi + batuk + pilek + konjungtivitis (3C) 3–4 hari", "Bercak Koplik; ruam makulopapular sefalokaudal", "Belum imunisasi, kontak campak"],
  teach=["Vitamin A dosis sesuai umur 2 hari berturut-turut pada setiap anak campak mengurangi kematian & komplikasi mata.", "Campak adalah penyakit wajib lapor (PD3I) — lakukan surveilans."],
  cx=[CX("pneumonia", "Pneumonia campak", "pneumonia", ["tanda_vital", "pemeriksaan_paru"], "Takipnea, ronki, SpO2 turun — rujuk segera.")],
  plan=dict(topics=["onset", "lokasi", "kebiasaan", "riwayat_keluarga", "keparahan", "keluhan_lain"],
            exams=[("status_dermatologis", "kunci", "Morfologi & penyebaran ruam."), ("pemeriksaan_tenggorok", "kunci", "Bercak Koplik."),
                   ("pemeriksaan_paru", "kunci", "Komplikasi pneumonia."), ("segmen_anterior", "pendukung", "Konjungtivitis/xeroftalmia."), ("uji_tourniquet", "pendukung", "Menyingkirkan dengue.")]),
  disp=[("rujuk_segera", "Campak dengan pneumonia/komplikasi berat: rujuk.", T("pneumonia")),
        ("rawat_jalan", "Vitamin A 2 hari, antipiretik, cairan & nutrisi, isolasi; laporkan; kontrol bila sesak/diare/kejang.")],
  mg=["Vitamin A: < 6 bln 50.000 IU, 6–11 bln 100.000 IU, ≥ 12 bln 200.000 IU, hari 1 & 2.", "Antipiretik (parasetamol), cairan & nutrisi cukup.",
      "Isolasi hingga 4 hari setelah ruam muncul; laporkan ke Puskesmas/Dinkes.", "Imunisasi MR untuk kontak & catch-up."],
  ap=["Kenali prodromal 3C + Koplik + pola ruam.", "Nilai komplikasi (pneumonia, diare, otitis, mata)."],
  refs=REF_KK + ["Kemenkes RI. Petunjuk Teknis Surveilans Campak-Rubela"])

# 7 ---------------------------------------------------------------------------------- varisela
D(id="varisela", name="Varisela tanpa komplikasi", aka=["Cacar air", "Chickenpox", "Varicella"],
  sys=SYS, prev=1.1,
  summary="Infeksi primer virus varisela-zoster, tersering anak 2–12 tahun. Demam ringan dan lesu, lalu vesikel dinding tipis di atas dasar eritema ('tetesan embun di kelopak mawar') yang muncul bergelombang sehingga tampak papul, vesikel, pustul, dan krusta bersamaan (polimorf), sentripetal (badan > ekstremitas), sangat gatal, juga di kulit kepala & mukosa. Menular hingga semua lesi berkrusta. Remaja/dewasa lebih berat — asiklovir.",
  day=(1, 4), ages=[(1, 5, 4), (6, 9, 4), (10, 18, 2), (19, 40, 1)], male=0.5,
  occ=[("anak_tk", 2), ("anak_sd", 3), ("pelajar_sd", 2)], bias=0.4,
  traits=[("infeksi_sekunder", 0.15), ("kontak_cacar", 0.75), ("dewasa", 1, W(amin=13))],
  tl={"infeksi_sekunder": "Infeksi bakteri sekunder.", "kontak_cacar": "Kontak penderita cacar air.", "dewasa": "Remaja/dewasa (cenderung lebih berat)."},
  sym=[("lepuh_kulit", 1), ("gatal_kulit", 0.9), ("demam", 0.8), ("lemas", 0.4), ("nafsu_makan_turun", 0.4)],
  cc=["lepuh_kulit"], ex=["demam", "gatal_kulit"], mis=["biang keringat", "digigit serangga", "alergi"], fears=["bopeng", "menular ke adik"],
  ana={
      "onset": [("Kemarin agak demam, Dok, terus muncul bintil berair di badan, sekarang makin banyak sampai ke muka dan kepala.", "Demam ringan lalu vesikel menyebar cepat")],
      "lokasi": [("Paling banyak di badan, Dok, tangan-kaki sedikit. Di dalam mulut juga ada.", "Sentripetal, mukosa terlibat")],
      "karakter": [("Ada yang baru bintil, ada yang berair, ada yang sudah kering jadi koreng, Dok. Gatal sekali.", "Lesi berbagai stadium (polimorf), gatal")],
      "riwayat_keluarga": [("Teman sekelasnya dua minggu lalu cacar air, Dok.", "Kontak 10–21 hari sebelumnya", T("kontak_cacar")), ("Belum tahu ketularan dari mana, Dok.", None, NT("kontak_cacar"))],
      "kebiasaan": [("Belum pernah vaksin cacar air, Dok, belum pernah cacar sebelumnya.", "Belum vaksin/belum pernah varisela")],
      "progresi": [("Beberapa bintilnya jadi bernanah, merah, dan sakit, Dok.", "Infeksi sekunder", T("infeksi_sekunder")), ("Yang lama mulai kering, Dok.", None, NT("infeksi_sekunder"))],
  },
  f=DS("Badan (sentripetal), wajah, kulit kepala; ekstremitas lebih sedikit", "Vesikel dinding tipis di atas dasar eritema (tetesan embun) bersama papul, pustul & krusta dalam berbagai stadium")
    + [F("pemeriksaan_tenggorok", "mukosa_mulut", "Beberapa vesikel/erosi kecil di palatum", p=0.5),
       F("tanda_vital", "suhu", (37.8, 38.8), when=SY("demam")),
       F("status_dermatologis", "tanda_khusus", "Beberapa lesi menjadi pustul dengan eritema & nyeri (infeksi sekunder)", when=T("infeksi_sekunder")),
       F("tzanck", "hasil", "Sel datia berinti banyak (+)", p=0.8)],
  dd=[
      X("mpox", "Mpox: lesi dalam stadium SAMA, umbilikasi, limfadenopati menonjol, kontak/perilaku berisiko — lapor & isolasi.", ["status_dermatologis", "kepala_leher"], must=True),
      X("herpes_zoster", "Herpes zoster: vesikel berkelompok unilateral dermatomal pada usia tua.", ["status_dermatologis"]),
      X("impetigo", "Impetigo bulosa: bula kendur/krusta madu terlokalisasi tanpa demam.", ["status_dermatologis"]),
      X("reaksi_gigitan_serangga", "Gigitan serangga: papul urtikaria di area terbuka tanpa demam & tanpa vesikel menyeluruh.", ["status_dermatologis"]),
  ],
  key=["Demam ringan lalu vesikel 'tetesan embun' polimorf (berbagai stadium)", "Distribusi sentripetal, mukosa & kulit kepala terlibat, gatal", "Kontak penderita 10–21 hari sebelumnya"],
  teach=["Hindari aspirin pada anak dengan varisela (sindrom Reye) — gunakan parasetamol.", "Isolasi sampai semua lesi berkrusta (± 5–7 hari)."],
  plan=dict(topics=["onset", "lokasi", "karakter", "riwayat_keluarga", "kebiasaan", "progresi", "keluhan_lain"],
            exams=[("status_dermatologis", "kunci", "Morfologi polimorf & distribusi."), ("pemeriksaan_tenggorok", "pendukung", "Lesi mukosa."),
                   ("kepala_leher", "pendukung", "Limfadenopati (bedakan mpox).")],
            opt=[("tzanck", "Bila diagnosis ragu.")]),
  disp=[("rawat_jalan", "Simptomatik, isolasi; asiklovir pada remaja/dewasa atau risiko; kontrol bila komplikasi.")],
  mg=["Parasetamol untuk demam (bukan aspirin); antihistamin oral & bedak salisil/kalamin untuk gatal.", "Asiklovir 5 × 800 mg 7 hari (dewasa) / 20 mg/kg 4 × sehari (anak berisiko) dalam 24–72 jam.",
      "Potong kuku, jangan digaruk/dipecah; mandi tetap boleh.", "Isolasi sampai semua lesi berkrusta; jauhkan dari ibu hamil/bayi/imunokompromais."],
  ap=["Kenali vesikel polimorf sentripetal.", "Nilai infeksi sekunder & kelompok risiko."],
  refs=REF_KK)

# 8 ---------------------------------------------------------------------------------- herpes simpleks
D(id="herpes_simpleks", name="Herpes simpleks tanpa komplikasi", aka=["Herpes labialis", "Herpes genitalis", "Dampa", "Cold sore", "HSV"],
  sys=SYS, prev=1.0,
  summary="Infeksi HSV-1 (orolabial) atau HSV-2 (genital). Prodromal rasa terbakar/gatal lalu vesikel berkelompok di atas dasar eritema yang cepat pecah menjadi erosi dangkal NYERI, lalu berkrusta dan sembuh 7–14 hari. Rekuren di tempat yang sama dipicu stres, demam, paparan matahari, haid. Herpes genital primer lebih berat (demam, disuria, limfadenopati inguinal nyeri). Terapi asiklovir; genital: konseling IMS & pasangan.",
  day=(1, 5), ages=[(10, 25, 3), (26, 45, 3), (46, 65, 1)], male=0.5,
  traits=[("genitalis", 0.4, W(amin=18)), ("rekuren", 0.6), ("primer_berat", 0.4, NT("rekuren"))],
  tl={"genitalis": "Herpes genitalis.", "rekuren": "Episode rekuren.", "primer_berat": "Episode primer dengan gejala sistemik."},
  sym=[("lepuh_bibir", 1, NT("genitalis")), ("luka_kemaluan", 1, T("genitalis")), ("nyeri_terbakar_kulit", 0.6), ("demam", 0.8, T("primer_berat")),
       ("disuria", 0.5, T("genitalis")), ("benjolan_kgb", 0.5, T("genitalis")), ("risiko_ims", 0.8, T("genitalis"))],
  cc=["lepuh_bibir", "luka_kemaluan"], ex=["nyeri_terbakar_kulit"], mis=["panas dalam", "sariawan", "digigit serangga"], fears=["penyakit kelamin", "kanker"],
  ana={
      "onset": [("Dua hari lalu bibir saya terasa panas dan gatal, Dok, terus muncul bintil berair berkelompok.", "Prodromal terbakar lalu vesikel berkelompok", NT("genitalis")),
                ("Tiga hari lalu kemaluan saya perih, Dok, terus muncul lepuh kecil-kecil yang pecah jadi luka.", "Vesikel berkelompok → erosi nyeri di genital", T("genitalis"), "luka_kemaluan")],
      "episode_sebelumnya": [("Sering kambuh di tempat yang sama, Dok, apalagi kalau capek atau mau haid.", "Rekuren di tempat yang sama dengan pencetus", W(t=["rekuren"], sex="female")),
                             ("Sering kambuh di tempat yang sama, Dok, apalagi kalau capek, kurang tidur, atau kena panas matahari.", "Rekuren di tempat yang sama dengan pencetus", W(t=["rekuren"], sex="male")),
                             ("Baru pertama kali, Dok, badan juga demam.", "Episode primer dengan demam", T("primer_berat"), "demam"),
                             ("Baru pertama kali, Dok.", "Episode pertama", W(nt=["rekuren", "primer_berat"]))],
      "karakter": [("Lukanya perih sekali, Dok, bukan luka yang nggak sakit.", "Erosi nyeri (bedakan dari sifilis)")],
      "kebiasaan": [("Saya pernah berhubungan dengan pasangan baru tanpa kondom, Dok.", "Hubungan seks berisiko", T("genitalis"), "risiko_ims"),
                    ("Nggak ada yang aneh, Dok, cuma lagi banyak kerjaan dan kurang tidur.", "Stres/kurang tidur sebagai pencetus", NT("genitalis"))],
  },
  f=DS("Vermilion bibir bawah kanan", "Vesikel berkelompok di atas dasar eritema, sebagian pecah menjadi erosi dangkal berkrusta", when=NT("genitalis"))
    + [F("pemeriksaan_genital", "lesi_genital", "Vesikel berkelompok & erosi dangkal multipel nyeri di atas dasar eritema, tanpa indurasi", when=T("genitalis"), diag=True),
       F("pemeriksaan_genital", "kgb_inguinal", "KGB inguinal bilateral membesar, nyeri tekan", when=T("genitalis"), p=0.6),
       F("tzanck", "hasil", "Sel datia berinti banyak (+)", diag=True, p=0.8),
       F("tanda_vital", "suhu", (37.8, 38.6), when=SY("demam"))],
  dd=[
      X("sifilis", "Sifilis primer: ulkus tunggal TIDAK nyeri, indurasi, dasar bersih; serologi sifilis.", ["karakter", "tes_sifilis", "pemeriksaan_genital"], must=True),
      X("impetigo", "Impetigo: krusta kuning madu, sering anak, sekitar hidung-mulut.", ["status_dermatologis"]),
      X("ulkus_mulut", "Stomatitis aftosa: ulkus intraoral tanpa vesikel di kulit bibir.", ["status_dermatologis"]),
  ],
  key=["Prodromal terbakar lalu vesikel berkelompok di atas dasar eritema → erosi nyeri", "Rekuren di tempat yang sama dengan pencetus", "Tzanck: sel datia berinti banyak"],
  teach=["Penularan dapat terjadi saat asimtomatik; herpes genital: kondom & edukasi pasangan; ibu hamil dengan herpes genital aktif menjelang persalinan dirujuk."],
  plan=dict(topics=["onset", "episode_sebelumnya", "karakter", "kebiasaan", "keluhan_lain"],
            exams=[("status_dermatologis", "kunci", "Morfologi vesikel berkelompok.", NT("genitalis")), ("pemeriksaan_genital", "kunci", "Lesi genital & KGB inguinal.", T("genitalis"))],
            tests=[("tzanck", "pendukung", "Sel datia berinti banyak."), ("tes_sifilis", "pendukung", "Menyingkirkan sifilis pada ulkus genital.", T("genitalis")),
                   ("tes_hiv", "pendukung", "Skrining HIV pada IMS.", T("genitalis"))]),
  disp=[("rawat_jalan", "Asiklovir, analgesik, kompres; genital: konseling IMS & pasangan.")],
  mg=["Episode primer: asiklovir 5 × 200 mg (atau 3 × 400 mg) 7–10 hari; rekuren: 5 hari dimulai saat prodromal.", "Kompres NaCl/antiseptik, analgesik; jaga lesi kering.",
      "Genital: kondom/abstinensi saat lesi aktif, obati & edukasi pasangan, skrining IMS/HIV.", "Hindari pencetus (stres, paparan matahari—tabir surya bibir)."],
  ap=["Kenali vesikel berkelompok nyeri & rekurensi.", "Ulkus genital: singkirkan sifilis & IMS lain."],
  refs=REF_IMS)

# 9 ---------------------------------------------------------------------------------- impetigo
D(id="impetigo", name="Impetigo", aka=["Impetigo krustosa", "Impetigo bulosa", "Koreng kuning", "Pioderma superfisial"],
  sys=SYS, prev=1.2,
  summary="Pioderma superfisial menular (S. aureus/Streptococcus) tersering anak 2–10 tahun. Krustosa: makula eritema → vesikel/pustul cepat pecah menjadi krusta kuning seperti madu, sering di sekitar hidung & mulut. Bulosa: bula kendur berisi cairan jernih-keruh (hipopion) yang pecah meninggalkan koleret, di badan/aksila/lipatan. Higiene buruk, gigitan serangga, dermatitis atopik sebagai pintu masuk. Terapi antibiotik topikal (luas: sistemik).",
  day=(3, 10), ages=[(1, 5, 4), (6, 9, 4), (10, 18, 2), (19, 40, 1)], male=0.5,
  occ=[("anak_tk", 2), ("anak_sd", 2), ("balita", 2)], bias=0.4,
  traits=[("bulosa", 0.25), ("luas", 0.2)], tl={"bulosa": "Impetigo bulosa.", "luas": "Lesi luas/multipel (butuh antibiotik sistemik)."},
  sym=[("koreng", 1, NT("bulosa")), ("lepuh_kulit", 1, T("bulosa")), ("gatal_kulit", 0.6), ("demam", 0.1)],
  cc=["koreng", "lepuh_kulit"], mis=["kudis", "alergi", "kena air kotor"], fears=["menular ke saudara", "bekas luka"],
  ana={
      "onset": [("Seminggu lalu awalnya bintil merah di bawah hidung, Dok, terus pecah jadi koreng kuning dan menyebar.", "Mulai bintil → krusta kuning menyebar", NT("bulosa")),
                ("Beberapa hari ini muncul lepuh berisi air di ketiak dan badan, Dok, gampang pecah.", "Bula kendur mudah pecah", T("bulosa"))],
      "karakter": [("Korengnya kuning kayak madu, Dok, gatal, kalau digaruk makin menyebar.", "Krusta madu, gatal, autoinokulasi", NT("bulosa"))],
      "kebiasaan": [("Dia suka main tanah dan jarang mandi sore, Dok. Kukunya panjang.", "Higiene kurang")],
      "riwayat_keluarga": [("Adiknya juga mulai ada koreng begitu, Dok.", "Kontak serumah", None, None, 0.5), ("Yang lain di rumah belum, Dok.", None)],
      "keparahan": [("Nggak demam, Dok, masih main seperti biasa.", "Tanpa gejala sistemik")],
  },
  f=DS("Sekitar lubang hidung, perioral, dagu", "Krusta tebal kuning seperti madu di atas dasar eritema; erosi basah bila krusta diangkat", when=NT("bulosa"))
    + DS("Aksila, badan, lipatan", "Bula kendur berisi cairan jernih-keruh (hipopion), sebagian pecah meninggalkan erosi dengan koleret", when=T("bulosa"))
    + [F("gram_sekret", "bakteri", "Kokus Gram positif bergerombol (+)", diag=True, p=0.85), F("gram_sekret", "pmn", "10–20 /LPB"),
       F("kepala_leher", "kgb", "KGB submandibula kecil nyeri tekan", when=NT("bulosa"), p=0.3)],
  dd=[
      X("ssss", "SSSS: anak dengan eritema generalisata nyeri, bula luas, Nikolsky (+), demam — rujuk segera.", ["status_dermatologis", "keparahan"], must=True),
      X("herpes_simpleks", "Herpes simpleks: vesikel berkelompok nyeri, rekuren, tanpa krusta madu tebal.", ["status_dermatologis"]),
      X("ektima", "Ektima: krusta tebal coklat-hitam dengan ulkus 'punched-out' di bawahnya, di tungkai.", ["status_dermatologis"]),
  ],
  key=["Anak dengan krusta kuning madu di sekitar hidung-mulut (krustosa) atau bula kendur (bulosa)", "Menular, autoinokulasi", "Gram: kokus Gram positif"],
  teach=["Lepaskan krusta dengan kompres sebelum mengoles antibiotik topikal agar obat menembus lesi."],
  plan=dict(topics=["onset", "karakter", "kebiasaan", "riwayat_keluarga", "keparahan", "keluhan_lain"],
            exams=[("status_dermatologis", "kunci", "Krusta madu/bula, luas lesi, Nikolsky."), ("kepala_leher", "pendukung", "KGB regional.")],
            opt=[("gram_sekret", "Konfirmasi kokus Gram positif bila ragu.")]),
  disp=[("rawat_jalan", "Kompres & lepaskan krusta, antibiotik topikal (sistemik bila luas), higiene; kontrol 1 minggu.")],
  mg=["Kompres NaCl 0,9%/permanganat kalium encer untuk melepas krusta.", "Mupirosin/asam fusidat salep 3 × sehari 7 hari.",
      "Lesi luas/multipel/bulosa luas: antibiotik oral (amoksisilin-klavulanat/dikloksasilin/sefaleksin) 7 hari.", "Potong kuku, mandi sabun, handuk terpisah; libur sekolah 24–48 jam setelah terapi."],
  ap=["Kenali krusta madu/bula kendur; nilai luas lesi.", "Singkirkan SSSS & herpes."],
  refs=REF_KK)

# 10 ---------------------------------------------------------------------------------- ektima
D(id="ektima", name="Impetigo ulseratif (ektima)", aka=["Ektima", "Ecthyma", "Koreng dalam"],
  sys=SYS, prev=0.6,
  summary="Pioderma lebih dalam (umumnya Streptococcus) yang menembus dermis: krusta tebal coklat-kehitaman melekat; bila diangkat tampak ulkus dangkal berbentuk 'punched-out' dengan tepi meninggi eritematosa. Tersering di tungkai bawah anak/lansia dengan higiene buruk, bekas gigitan serangga/garukan. Sembuh dengan jaringan parut. Terapi antibiotik topikal + sistemik, perawatan luka.",
  day=(7, 21), ages=[(3, 9, 3), (10, 25, 2), (26, 59, 2), (60, 75, 2)], male=0.55,
  traits=[("bekas_gigitan", 0.6), ("dm_curiga", 0.08, W(amin=40))], tl={"bekas_gigitan": "Bermula dari bekas gigitan serangga/garukan.", "dm_curiga": "Faktor risiko diabetes."},
  sym=[("koreng", 1), ("luka_sulit_sembuh", 0.6), ("gatal_kulit", 0.4), ("benjolan_kgb", 0.3)],
  cc=["koreng"], ex=["luka_sulit_sembuh"], mis=["kudis", "luka biasa", "korengan karena kotor"], fears=["bekas luka", "infeksi"],
  ana={
      "onset": [("Sudah dua minggu, Dok, awalnya bentol digigit nyamuk saya garuk, jadi koreng tebal hitam.", "Bermula dari gigitan serangga yang digaruk", T("bekas_gigitan")),
                ("Sudah dua minggu, Dok, ada koreng tebal di kaki yang nggak sembuh.", "Krusta tebal menetap", NT("bekas_gigitan"))],
      "karakter": [("Kalau korengnya lepas, di bawahnya luka bolong dangkal, pinggirnya merah, Dok.", "Ulkus punched-out di bawah krusta")],
      "lokasi": [("Di tungkai bawah kanan dan kiri, Dok.", "Tungkai bawah")],
      "kebiasaan": [("Jarang mandi pakai sabun, Dok, sering main di kebun.", "Higiene kurang")],
  },
  f=DS("Tungkai bawah kanan & kiri", "Krusta tebal coklat kehitaman melekat; bila diangkat tampak ulkus dangkal 'punched-out' dengan tepi meninggi eritematosa")
    + [F("gram_sekret", "bakteri", "Kokus Gram positif berantai (+)", diag=True, p=0.8),
       F("pemeriksaan_genital", "kgb_inguinal", "KGB inguinal kanan teraba, nyeri tekan", p=0.3),
       F("gula_darah", "gds", (220, 290), when=T("dm_curiga"))],
  dd=[
      X("ulkus_tungkai", "Ulkus vena: di maleolus medial dengan varises/edema, kronik, pada dewasa-lansia.", ["status_dermatologis", "ekstremitas_kulit"]),
      X("impetigo", "Impetigo krustosa: krusta kuning madu superfisial tanpa ulkus.", ["status_dermatologis"]),
      X("fasiitis_nekrotikans", "Infeksi dalam/nekrotikans: nyeri hebat, bula hemoragik, demam tinggi — rujuk segera.", ["tanda_vital", "status_dermatologis"], must=True),
  ],
  key=["Krusta tebal coklat-hitam di tungkai", "Ulkus dangkal punched-out dengan tepi meninggi di bawah krusta", "Higiene buruk, bekas gigitan/garukan"],
  teach=["Ektima sembuh dengan sikatriks karena mengenai dermis — berbeda dengan impetigo."],
  plan=dict(topics=["onset", "karakter", "lokasi", "kebiasaan", "keluhan_lain"],
            exams=[("status_dermatologis", "kunci", "Krusta & ulkus punched-out."), ("ekstremitas_kulit", "pendukung", "Edema/varises (bedakan ulkus vena).")],
            opt=[("gram_sekret", "Konfirmasi streptokokus."), ("gula_darah", "Lesi berulang/dewasa: skrining DM.")]),
  disp=[("rawat_jalan", "Kompres & debridemen krusta, antibiotik topikal + sistemik 7–10 hari; kontrol 1 minggu.")],
  mg=["Kompres NaCl, angkat krusta, bersihkan ulkus.", "Antibiotik topikal (mupirosin/asam fusidat) + oral (amoksisilin/sefadroksil/dikloksasilin) 7–10 hari.",
      "Higiene, cegah gigitan serangga, potong kuku."],
  ap=["Angkat krusta untuk melihat ulkus.", "Bedakan dari ulkus vena & infeksi dalam."],
  refs=REF_KK)

# 11 ---------------------------------------------------------------------------------- folikulitis
D(id="folikulitis", name="Folikulitis superfisialis", aka=["Folikulitis", "Radang folikel rambut", "Bisul kecil"],
  sys=SYS, prev=0.9,
  summary="Infeksi superfisial folikel rambut, tersering S. aureus: pustul kecil berdinding tipis yang ditembus rambut di tengahnya dengan dasar eritema, gatal atau perih, di area berambut yang tergesek/dicukur (janggut, kulit kepala, paha, bokong, tungkai). Faktor: mencukur, pakaian ketat, keringat, oklusi, kolam/air hangat. Bedakan dari akne, miliaria, folikulitis Malassezia, dan furunkel (nodul dalam).",
  day=(3, 21), ages=[(12, 25, 3), (26, 50, 3), (51, 65, 1)], male=0.6,
  occ=[("ojek_online", 2), ("pekerja_proyek", 1), ("satpam", 1)], bias=0.2,
  traits=[("mencukur", 0.4), ("berulang", 0.3)], tl={"mencukur": "Dipicu mencukur.", "berulang": "Folikulitis berulang."},
  sym=[("bintil_bernanah", 1), ("gatal_kulit", 0.6)],
  cc=["bintil_bernanah"], ex=["gatal_kulit"], mis=["jerawat", "biang keringat", "alergi celana"], fears=["bisul", "penyakit kulit menular"],
  ana={
      "onset": [("Seminggu ini, Dok, muncul bintil-bintil bernanah kecil.", "Subakut")],
      "lokasi": [("Di janggut dan dagu, Dok, sejak cukur pakai silet.", "Area janggut setelah mencukur", W(t=["mencukur"], sex="male")),
                 ("Di ketiak dan betis, Dok, sejak cukur bulu pakai silet.", "Area yang dicukur", W(t=["mencukur"], sex="female")),
                 ("Di paha dan bokong, Dok, mungkin karena celana ketat dan duduk lama di motor.", "Paha & bokong (gesekan, oklusi)", NT("mencukur"))],
      "karakter": [("Bintilnya kecil-kecil, tiap bintil ada rambutnya di tengah, agak gatal dan perih, Dok.", "Pustul folikular ditembus rambut")],
      "episode_sebelumnya": [("Sering kambuh begini, Dok.", "Berulang", T("berulang")), ("Baru kali ini, Dok.", None, NT("berulang"))],
      "keparahan": [("Nggak ada benjolan besar yang sakit, Dok, nggak demam.", "Tanpa nodus dalam/demam (bukan furunkel)")],
  },
  f=DS("Paha posterior & bokong", "Pustul folikular kecil multipel dengan dasar eritema, ditembus rambut di tengahnya", when=NT("mencukur"))
    + DS("Janggut & dagu", "Pustul folikular kecil multipel dengan dasar eritema, ditembus rambut di tengahnya", when=T("mencukur"))
    + [F("gram_sekret", "bakteri", "Kokus Gram positif bergerombol (+)", p=0.8)],
  dd=[
      X("furunkel_karbunkel", "Furunkel/karbunkel: nodus dalam nyeri dengan mata bisul, kadang demam — butuh antibiotik sistemik/insisi.", ["status_dermatologis", "keparahan"], must=True),
      X("akne_vulgaris", "Akne: komedo, papul-pustul di wajah/dada/punggung, bukan terutama folikel area cukur/gesekan.", ["status_dermatologis"]),
      X("miliaria", "Miliaria pustulosa: vesikel/pustul kecil non-folikular di area berkeringat.", ["status_dermatologis"]),
  ],
  key=["Pustul kecil folikular ditembus rambut dengan dasar eritema", "Area cukur/gesekan/oklusi", "Tanpa nodus dalam"],
  teach=["Folikulitis berulang: periksa karier S. aureus di hidung dan hentikan kebiasaan mencukur searah/berlawanan arah rambut."],
  plan=dict(topics=["onset", "lokasi", "karakter", "episode_sebelumnya", "keparahan", "keluhan_lain"],
            exams=[("status_dermatologis", "kunci", "Pustul folikular & distribusi.")],
            opt=[("gram_sekret", "Bila berulang/ragu.")]),
  disp=[("rawat_jalan", "Antiseptik, antibiotik topikal, hindari pencetus; kontrol 1–2 minggu.")],
  mg=["Kompres/antiseptik (klorheksidin), antibiotik topikal (mupirosin/asam fusidat/eritromisin) 2–3 × sehari 7–10 hari.",
      "Hindari mencukur sementara, pakaian longgar dari bahan menyerap keringat.", "Antibiotik oral bila luas/berulang."],
  ap=["Kenali pustul folikular; cari pencetus.", "Bedakan dari furunkel, akne, miliaria."],
  refs=REF_KK)

# 12 ---------------------------------------------------------------------------------- furunkel & karbunkel
D(id="furunkel_karbunkel", name="Furunkel dan karbunkel", aka=["Bisul", "Furunkel", "Karbunkel", "Udun"],
  sys=SYS, prev=1.2, danger="sedang",
  summary="Infeksi S. aureus pada folikel rambut dan jaringan sekitarnya (perifolikulitis). Furunkel: nodus eritematosa nyeri dengan pustul di puncak (mata bisul) yang kemudian berfluktuasi & pecah. Karbunkel: kumpulan furunkel yang menyatu membentuk plak indurasi dengan beberapa lubang drainase, sering disertai demam & malaise, di tengkuk/punggung/paha. Faktor: DM, obesitas, higiene, karier S. aureus. Furunkel matang diinsisi; karbunkel/demam/wajah: antibiotik sistemik.",
  day=(2, 7), ages=[(12, 30, 3), (31, 59, 4), (60, 75, 1)], male=0.6,
  traits=[("karbunkel", 0.3), ("dm_curiga", 0.15, W(amin=35)), ("berulang", 0.3)],
  tl={"karbunkel": "Karbunkel.", "dm_curiga": "Faktor risiko diabetes.", "berulang": "Furunkulosis berulang."},
  sym=[("bisul", 1), ("demam", 0.8, T("karbunkel")), ("demam", 0.15), ("lemas", 0.5, T("karbunkel")), ("haus", 0.4, T("dm_curiga")), ("sering_kencing", 0.4, T("dm_curiga"))],
  cc=["bisul"], ex=["demam"], mis=["panas dalam", "kebanyakan makan telur", "kotor"], fears=["infeksi menyebar", "kencing manis"],
  ana={
      "onset": [("Empat hari ini, Dok, benjolan merah sakit di tengkuk, sekarang ada nanahnya.", "Akut, nodus nyeri dengan pus")],
      "karakter": [("Benjolannya besar dan banyak lubang nanahnya, Dok, badan saya demam.", "Plak dengan multipel lubang drainase + demam (karbunkel)", T("karbunkel"), "demam"),
                   ("Satu benjolan, Dok, cenut-cenut, ujungnya ada mata bisulnya.", "Nodus tunggal dengan mata bisul (furunkel)", NT("karbunkel"))],
      "episode_sebelumnya": [("Sering sekali bisulan, Dok, hampir tiap bulan.", "Berulang", T("berulang")), ("Jarang bisulan, Dok.", None, NT("berulang"))],
      "riwayat_penyakit": [("Belakangan saya sering haus dan bolak-balik kencing, Dok.", "Gejala klasik DM", T("dm_curiga"), ["haus", "sering_kencing"]),
                           ("Belum pernah dibilang kencing manis, Dok.", None, NT("dm_curiga"))],
      "riwayat_obat": [("Sudah saya pencet tapi malah makin bengkak, Dok.", "Dipencet sendiri")],
  },
  f=DS("Tengkuk", "Plak indurasi eritematosa 6 cm dengan multipel pustul & lubang drainase berisi pus", when=T("karbunkel"))
    + DS("Bokong kanan", "Nodus eritematosa 2 cm nyeri tekan dengan pustul di puncak, berfluktuasi", when=NT("karbunkel"))
    + [F("tanda_vital", "suhu", (38.2, 39.2), when=SY("demam")),
       F("gula_darah", "gds", (230, 330), when=T("dm_curiga")),
       F("darah_lengkap", "leukosit", (12000, 17000), when=T("karbunkel")),
       F("kepala_leher", "kgb", "KGB servikal posterior membesar nyeri tekan", when=T("karbunkel"), p=0.6)],
  dd=[
      X("antraks_kulit", "Antraks kulit: eskar hitam TIDAK nyeri dengan edema luas, kontak ternak/daging — lapor & rujuk.", ["status_dermatologis", "bepergian_lingkungan"], must=True),
      X("hidradenitis_supurativa", "Hidradenitis: nodus berulang di aksila/inguinal dengan sinus & parut.", ["status_dermatologis", "episode_sebelumnya"]),
      X("abses_folikel", "Kista sebasea terinfeksi: ada riwayat benjolan lama dengan punctum.", ["onset", "status_dermatologis"]),
  ],
  key=["Nodus eritematosa nyeri dengan mata bisul (furunkel) atau plak dengan banyak lubang drainase + demam (karbunkel)", "Faktor risiko: DM, higiene, berulang"],
  teach=["Furunkulosis berulang/karbunkel: periksa gula darah.", "Jangan memencet bisul di segitiga bahaya wajah."],
  plan=dict(topics=["onset", "karakter", "episode_sebelumnya", "riwayat_penyakit", "riwayat_obat", "keluhan_lain"],
            exams=[("status_dermatologis", "kunci", "Ukuran, fluktuasi, jumlah lubang drainase."), ("kepala_leher", "pendukung", "KGB regional.")],
            tests=[("gula_darah", "pendukung", "Skrining DM pada karbunkel/berulang.", T("karbunkel")), ("gula_darah", "pendukung", "Skrining DM pada bisul berulang.", T("berulang")),
                   ("darah_lengkap", "komplikasi", "Leukositosis pada karbunkel.", T("karbunkel"))]),
  disp=[("rawat_jalan", "Kompres hangat, insisi drainase bila fluktuasi, antibiotik sistemik untuk karbunkel/demam; kontrol 2–3 hari.", None, ["rujuk_spesialis"])],
  mg=["Kompres hangat 3–4 × sehari; insisi & drainase bila berfluktuasi.", "Antibiotik sistemik (dikloksasilin/sefaleksin 4 × 500 mg 7–10 hari) untuk karbunkel, demam, selulitis, atau lokasi wajah.",
      "Antibiotik topikal sekitar lesi; higiene, handuk terpisah.", "Berulang: skrining DM, dekolonisasi (mupirosin intranasal)."],
  ap=["Furunkel vs karbunkel; nilai fluktuasi & tanda sistemik.", "Cari faktor risiko (DM)."],
  refs=REF_KK)

# 13 ---------------------------------------------------------------------------------- eritrasma
D(id="eritrasma", name="Eritrasma", aka=["Erythrasma", "Infeksi Corynebacterium kulit"],
  sys=SYS, prev=0.5,
  summary="Infeksi superfisial Corynebacterium minutissimum di daerah lipatan (lipat paha, aksila, sela jari kaki IV–V, submamaria), sering pada obesitas, DM, iklim lembap. Makula/patch coklat kemerahan berbatas tegas dengan skuama halus, tanpa tepi aktif/vesikel, gatal ringan. Lampu Wood: fluoresensi merah bata (coral red); KOH negatif.",
  day=(30, 180), ages=[(18, 39, 2), (40, 65, 4)], male=0.55,
  traits=[("dm_curiga", 0.2), ("obesitas_menyertai", 0.4)], tl={"dm_curiga": "Diabetes menyertai.", "obesitas_menyertai": "Obesitas."},
  tc={"obesitas_menyertai": "obesitas"},
  sym=[("ruam_kulit", 1), ("gatal_kulit", 0.4)],
  cc=["ruam_kulit"], ex=["gatal_kulit"], mis=["panu", "kurap", "daki"], fears=["penyakit kelamin", "jamur menahun"],
  ana={
      "onset": [("Sudah beberapa bulan, Dok, di lipat paha ada bercak coklat kemerahan.", "Kronik")],
      "karakter": [("Bercaknya rata, agak bersisik halus, cuma sedikit gatal, Dok. Pinggirnya nggak ada bintil-bintil.", "Patch coklat-merah skuama halus tanpa tepi aktif")],
      "riwayat_obat": [("Sudah pakai salep jamur dari warung, Dok, nggak ada perubahan.", "Tidak respons antijamur")],
      "kebiasaan": [("Kerja di tempat panas, sering keringatan, Dok.", "Lembap & berkeringat")],
      "riwayat_penyakit": [("Saya kencing manis, Dok.", "DM", T("dm_curiga")), ("Belum pernah cek gula, Dok.", None, NT("dm_curiga"))],
  },
  f=DS("Lipat paha kanan & kiri, sela jari kaki IV–V", "Patch coklat kemerahan berbatas tegas dengan skuama halus, tanpa tepi aktif/vesikel")
    + [F("lampu_wood", "fluoresensi", "Fluoresensi merah bata (coral red)", diag=True), F("kerokan_koh", "hasil", "Tidak ditemukan hifa, spora, maupun pseudohifa"),
       F("gula_darah", "gds", (210, 280), when=T("dm_curiga")), F("timbangan", "imt", (27, 32), when=T("obesitas_menyertai"))],
  dd=[
      X("dm_tipe2", "Eritrasma luas/berulang sering pada DM — skrining gula darah.", ["gula_darah"], must=True),
      X("tinea_kruris", "Tinea kruris: tepi aktif polisiklik dengan vesikel/papul, gatal, KOH hifa (+).", ["status_dermatologis", "kerokan_koh"]),
      X("kandidosis_kutis", "Kandidosis intertriginosa: eritema basah dengan lesi satelit, KOH pseudohifa.", ["status_dermatologis", "kerokan_koh"]),
  ],
  key=["Patch coklat-merah berbatas tegas skuama halus di lipatan", "Lampu Wood: merah bata; KOH negatif", "Obesitas/DM, lembap"],
  teach=["Lampu Wood membedakan eritrasma (merah bata) dari pitiriasis versikolor (kuning keemasan) dan tinea (umumnya tanpa fluoresensi)."],
  plan=dict(topics=["onset", "karakter", "riwayat_obat", "kebiasaan", "riwayat_penyakit", "keluhan_lain"],
            exams=[("status_dermatologis", "kunci", "Morfologi & lokasi lipatan."), ("timbangan", "pendukung", "Obesitas.")],
            tests=[("lampu_wood", "kunci", "Fluoresensi merah bata."), ("kerokan_koh", "pendukung", "Menyingkirkan jamur."), ("gula_darah", "pendukung", "Skrining DM.")]),
  disp=[("rawat_jalan", "Eritromisin oral/klindamisin topikal, jaga area kering; kontrol 2 minggu.")],
  mg=["Eritromisin 4 × 250 mg 14 hari, atau eritromisin/klindamisin topikal, atau asam fusidat krim.", "Jaga lipatan kering, sabun antibakteri, pakaian longgar menyerap keringat.",
      "Kelola DM & berat badan."],
  ap=["Lesi lipatan tanpa tepi aktif → lampu Wood & KOH.", "Skrining DM."],
  refs=REF_KK)

# 14 ---------------------------------------------------------------------------------- erisipelas
D(id="erisipelas", name="Erisipelas", aka=["Erysipelas", "Infeksi kulit streptokokus", "St. Anthony's fire"],
  sys=SYS, prev=0.8, danger="sedang",
  summary="Infeksi Streptococcus β-hemolitikus grup A pada dermis superfisial & pembuluh limfe: plak eritematosa merah terang, edema, hangat, nyeri, berbatas TEGAS & meninggi, tersering di tungkai bawah (pintu masuk tinea pedis/luka) atau wajah. Disertai demam, menggigil, malaise, limfadenopati regional. Berbeda dari selulitis (lebih dalam, batas tidak tegas). Terapi penisilin/amoksisilin, elevasi, obati pintu masuk.",
  day=(1, 4), ages=[(18, 44, 2), (45, 59, 3), (60, 75, 3)], male=0.5,
  traits=[("tinea_pedis_portal", 0.4), ("wajah", 0.2), ("limfedema", 0.15)],
  tl={"tinea_pedis_portal": "Pintu masuk tinea pedis/sela jari.", "wajah": "Erisipelas wajah.", "limfedema": "Limfedema kronik (faktor risiko)."},
  sym=[("kulit_merah_panas", 1), ("demam", 0.9), ("menggigil", 0.6), ("lemas", 0.5), ("benjolan_kgb", 0.4)],
  cc=["kulit_merah_panas"], ex=["demam"], mis=["keseleo", "asam urat", "digigit serangga"], fears=["harus diamputasi", "infeksi menyebar"],
  ana={
      "onset": [("Kemarin tiba-tiba menggigil dan demam, Dok, terus kaki kanan merah, panas, bengkak, makin lebar.", "Onset mendadak dengan demam/menggigil", NT("wajah")),
                ("Kemarin demam menggigil, Dok, terus pipi kanan merah, panas, bengkak.", "Onset mendadak di wajah", T("wajah"))],
      "karakter": [("Pinggir merahnya jelas, agak timbul, panas dan nyeri, Dok.", "Batas tegas meninggi, panas, nyeri")],
      "riwayat_penyakit": [("Sela jari kaki saya memang sering gatal lecet kena kutu air, Dok.", "Pintu masuk tinea pedis", T("tinea_pedis_portal")),
                           ("Kaki saya memang sudah lama bengkak, Dok.", "Limfedema kronik", T("limfedema")),
                           ("Ada luka kecil di kaki minggu lalu, Dok.", "Pintu masuk luka", W(nt=["tinea_pedis_portal", "limfedema"]))],
      "keparahan": [("Sakitnya sesuai yang kelihatan, Dok, nggak ada lepuh hitam, masih bisa jalan pelan.", "Tanpa tanda infeksi dalam/nekrotikans")],
  },
  f=DS("Tungkai bawah kanan", "Plak eritematosa merah terang, edema, berbatas tegas & meninggi, hangat, nyeri tekan", when=NT("wajah"))
    + DS("Pipi kanan", "Plak eritematosa merah terang, edema, berbatas tegas & meninggi, hangat, nyeri tekan", when=T("wajah"))
    + [F("tanda_vital", "suhu", (38.4, 39.6), when=SY("demam")), F("tanda_vital", "nadi", (98, 112), when=SY("demam")),
       F("darah_lengkap", "leukosit", (11500, 17000), diag=True, p=0.8), F("darah_lengkap", "neutrofil_segmen", (75, 85)),
       F("pemeriksaan_genital", "kgb_inguinal", "KGB inguinal kanan membesar, nyeri tekan", when=NT("wajah"), p=0.5),
       F("status_dermatologis", "tanda_khusus", "Maserasi & skuama di sela jari kaki IV–V (tinea pedis)", when=T("tinea_pedis_portal"))],
  dd=[
      X("fasiitis_nekrotikans", "Fasiitis nekrotikans: nyeri hebat tidak sebanding temuan, bula hemoragik, krepitasi, syok — rujuk segera.", ["keparahan", "tanda_vital"], must=True),
      X("trombosis_vena_dalam", "DVT: bengkak betis unilateral, nyeri, tanpa plak merah berbatas tegas & tanpa demam tinggi.", ["status_dermatologis"], must=True),
      X("selulitis", "Selulitis: lebih dalam, batas tidak tegas, kurang meninggi.", ["status_dermatologis"]),
      X("hiperurisemia", "Gout: nyeri sendi dengan eritema di atas sendi.", ["status_dermatologis"]),
  ],
  key=["Plak merah terang berbatas tegas meninggi, hangat, nyeri, di tungkai/wajah", "Demam, menggigil, leukositosis", "Pintu masuk: tinea pedis, luka, limfedema"],
  teach=["Obati tinea pedis sebagai pintu masuk untuk mencegah erisipelas berulang."],
  plan=dict(topics=["onset", "karakter", "riwayat_penyakit", "keparahan", "keluhan_lain"],
            exams=[("status_dermatologis", "kunci", "Batas, warna, pintu masuk."), ("ekstremitas_kulit", "pendukung", "Edema, perfusi.")],
            tests=[("darah_lengkap", "pendukung", "Leukositosis.")]),
  disp=[("rawat_jalan", "Antibiotik oral 10–14 hari, elevasi, analgesik-antipiretik, obati pintu masuk; kontrol 48–72 jam.", None, ["rujuk_spesialis"])],
  mg=["Amoksisilin/penisilin V oral 10–14 hari (eritromisin/klindamisin bila alergi).", "Elevasi tungkai, kompres, analgesik-antipiretik, cukup minum.",
      "Obati pintu masuk (antijamur untuk tinea pedis, rawat luka).", "Rujuk bila sepsis, tidak membaik 48–72 jam, atau curiga infeksi dalam."],
  ap=["Kenali plak batas tegas + demam.", "Singkirkan infeksi nekrotikans & DVT; cari pintu masuk."],
  refs=REF_KK)

# 15 ---------------------------------------------------------------------------------- skrofuloderma
D(id="skrofuloderma", name="Skrofuloderma", aka=["TB kulit", "Tuberkulosis kutis kolikuatifa", "Scrofuloderma"],
  sys=SYS, prev=0.4, danger="sedang",
  summary="Tuberkulosis kulit akibat penjalaran langsung dari fokus di bawahnya (tersering limfadenitis TB servikal): KGB membesar tidak nyeri, berkonglomerasi, melunak (abses dingin), pecah membentuk ulkus dengan tepi bergaung (undermined) kebiruan, fistel, dan sikatriks berjembatan. Gejala sistemik ringan (subfebris, keringat malam, BB turun). Terapi OAT 6 bulan; skrining TB paru & HIV.",
  day=(60, 180), ages=[(5, 18, 3), (19, 40, 3), (41, 60, 1)], male=0.45,
  traits=[("kontak_tb", 0.5), ("tb_paru_aktif", 0.2)], tl={"kontak_tb": "Kontak penderita TB.", "tb_paru_aktif": "TB paru aktif menyertai."},
  sym=[("benjolan_kgb", 1), ("luka_sulit_sembuh", 0.9), ("demam", 0.5), ("keringat_malam", 0.5), ("berat_badan_turun", 0.5), ("batuk", 1, T("tb_paru_aktif"))],
  cc=["benjolan_kgb"], ex=["luka_sulit_sembuh"], mis=["kelenjar biasa", "bisul", "guna-guna"], fears=["kanker kelenjar", "TBC"],
  ana={
      "onset": [("Sudah tiga bulan, Dok, benjolan di leher nggak sakit, lama-lama lunak lalu pecah jadi luka bernanah encer.", "Benjolan kronik tidak nyeri → abses dingin → ulkus/fistel")],
      "karakter": [("Lukanya nggak sembuh-sembuh, pinggirnya kebiruan, ada beberapa lubang yang keluar nanah, Dok.", "Ulkus bergaung & fistel")],
      "riwayat_keluarga": [("Kakek saya di rumah sedang minum obat TBC, Dok.", "Kontak TB serumah", T("kontak_tb")), ("Setahu saya di rumah tidak ada yang TBC, Dok.", None, NT("kontak_tb"))],
      "keparahan": [("Badan sumeng tiap sore, keringat malam, berat badan turun, Dok.", "Gejala sistemik TB", None, ["demam", "keringat_malam"])],
      "riwayat_penyakit": [("Saya juga batuk lebih dari tiga minggu, Dok.", "Batuk kronik (TB paru)", T("tb_paru_aktif"), "batuk"), ("Nggak batuk lama, Dok.", None, NT("tb_paru_aktif"))],
  },
  f=[F("kepala_leher", "kgb", "KGB servikal kanan multipel, konglomerasi, kenyal, tidak nyeri", diag=True)]
    + DS("Leher kanan", "Ulkus dengan tepi bergaung (undermined) kebiruan, dasar granulasi pucat, multipel fistel dengan pus encer, sikatriks berjembatan")
    + [F("tes_mantoux", "indurasi", (15, 22), diag=True), F("darah_lengkap", "led", (40, 80)), F("darah_lengkap", "limfosit", (40, 50), p=0.5),
       F("rontgen_thorax", "pulmo", "Infiltrat di apeks paru kanan", when=T("tb_paru_aktif")), F("rontgen_thorax", "kesan", "Sesuai TB paru aktif", when=T("tb_paru_aktif")),
       F("tanda_vital", "suhu", (37.5, 38.0), when=SY("demam"))],
  dd=[
      X("limfoma", "Limfoma: KGB keras/kenyal progresif tanpa ulkus bergaung & fistel — biopsi.", ["kepala_leher", "status_dermatologis"], must=True),
      X("limfadenitis", "Limfadenitis bakteri akut: nyeri, merah, hangat, onset hari.", ["onset"]),
      X("hiv", "Koinfeksi HIV pada TB ekstraparu: tawarkan tes HIV.", ["tes_hiv"]),
  ],
  key=["KGB servikal konglomerasi tidak nyeri → abses dingin → ulkus bergaung & fistel", "Gejala sistemik TB ringan, kontak TB", "Mantoux kuat positif, LED tinggi"],
  teach=["Skrofuloderma adalah TB ekstraparu — tata laksana OAT kategori 1 selama 6 bulan dan wajib skrining TB paru & HIV."],
  plan=dict(topics=["onset", "karakter", "riwayat_keluarga", "keparahan", "riwayat_penyakit", "keluhan_lain"],
            exams=[("kepala_leher", "kunci", "KGB leher."), ("status_dermatologis", "kunci", "Ulkus bergaung & fistel."), ("pemeriksaan_paru", "kunci", "TB paru menyertai.")],
            tests=[("tes_mantoux", "kunci", "Infeksi TB."), ("darah_lengkap", "pendukung", "LED."), ("rontgen_thorax", "pendukung", "TB paru."), ("tes_hiv", "pendukung", "Koinfeksi HIV.")]),
  disp=[("rawat_jalan", "OAT kategori 1 6 bulan, perawatan luka, skrining kontak & HIV; kontrol bulanan.", None, ["rujuk_spesialis"])],
  mg=["OAT kategori 1: 2RHZE/4RH (KDT sesuai BB) selama 6 bulan.", "Perawatan luka & fistel, nutrisi.", "Skrining TB paru, HIV; investigasi kontak; PMO."],
  ap=["Kenali KGB konglomerasi + ulkus bergaung/fistel.", "Konfirmasi TB & cari TB paru/HIV."],
  refs=REF_KK + ["Kemenkes RI. PNPK Tata Laksana Tuberkulosis (2020)"])

# 16 ---------------------------------------------------------------------------------- kusta
D(id="kusta", name="Lepra (kusta)", aka=["Kusta", "Morbus Hansen", "Lepra PB", "Lepra MB"],
  sys=SYS, prev=0.6, danger="sedang",
  summary="Infeksi kronik Mycobacterium leprae pada kulit & saraf tepi. Tanda kardinal: (1) bercak hipopigmentasi/eritema yang MATI RASA, (2) penebalan saraf tepi dengan gangguan fungsi, (3) BTA positif pada slit skin smear. PB: 1–5 lesi, 1 saraf, BTA negatif. MB: > 5 lesi atau > 1 saraf atau BTA positif. Terapi MDT (12 blister MB / 6 blister PB), pencegahan cacat, pemeriksaan kontak.",
  day=(60, 365), ages=[(10, 25, 3), (26, 50, 4), (51, 70, 2)], male=0.6,
  occ=[("petani", 2), ("nelayan", 1), ("buruh_pabrik", 1)], bias=0.3,
  traits=[("mb", 0.5), ("cacat", 0.2), ("reaksi", 0.08), ("kontak_kusta", 0.5)],
  tl={"mb": "Kusta multibasiler.", "cacat": "Disabilitas (claw hand/ulkus plantar).", "reaksi": "Reaksi kusta.", "kontak_kusta": "Kontak penderita kusta."},
  sym=[("bercak_mati_rasa", 1), ("bercak_putih_kulit", 1, NT("mb")), ("ruam_kulit", 1, T("mb")), ("kesemutan", 0.5), ("luka_sulit_sembuh", 0.8, T("cacat")),
       ("nyeri_otot_sendi", 0.6, T("reaksi")), ("demam", 0.7, T("reaksi"))],
  cc=["bercak_putih_kulit", "ruam_kulit"], ex=["bercak_mati_rasa"], mis=["panu", "kurap", "kena guna-guna"], fears=["kusta", "dikucilkan", "jari putus"],
  ana={
      "onset": [("Sudah setahun, Dok, ada bercak keputihan di lengan dan punggung, nggak gatal.", "Bercak kronik tidak gatal", NT("mb")),
                ("Sudah setahun, Dok, bercak kemerahan banyak di badan dan muka, cuping telinga menebal.", "Lesi eritema multipel & infiltrat cuping telinga", T("mb"))],
      "karakter": [("Bercaknya mati rasa, Dok, kena air panas atau tersundut rokok nggak terasa.", "Anestesi pada bercak", None, "bercak_mati_rasa")],
      "progresi": [("Jari kelingking dan manis tangan kanan jadi bengkok, telapak kaki ada luka nggak sakit, Dok.", "Kecacatan (claw hand, ulkus plantar)", T("cacat"), "luka_sulit_sembuh"),
                   ("Sekarang bercaknya merah meradang, nyeri, dan badan demam, Dok.", "Lesi meradang + demam (reaksi kusta)", T("reaksi"), ["demam"]),
                   ("Tangan dan kaki masih kuat, Dok.", "Tanpa kecacatan", W(nt=["cacat", "reaksi"]))],
      "riwayat_keluarga": [("Paman saya dulu juga sakit kusta, Dok, tinggal serumah.", "Kontak serumah penderita kusta", T("kontak_kusta")), ("Nggak ada yang sakit kulit di rumah, Dok.", None, NT("kontak_kusta"))],
      "riwayat_obat": [("Sudah dikasih salep panu, Dok, nggak sembuh.", "Tidak respons antijamur")],
  },
  f=DS("Lengan atas kiri & punggung (2–4 lesi)", "Makula hipopigmentasi berbatas tegas, kering, tidak berkeringat, rambut rontok di atasnya", when=NT("mb"))
    + DS("Wajah, badan, ekstremitas simetris (> 5 lesi)", "Makula-plak eritematosa multipel batas kurang tegas, infiltrat cuping telinga", when=T("mb"))
    + [F("status_dermatologis", "sensibilitas_lesi", "Anestesi raba, nyeri, & suhu pada lesi", diag=True),
       F("status_dermatologis", "saraf_tepi", "Penebalan N. auricularis magnus kiri, tidak nyeri", when=NT("mb")),
       F("status_dermatologis", "saraf_tepi", "Penebalan N. ulnaris & N. peroneus bilateral, nyeri tekan (−)", when=T("mb"), diag=True),
       F("status_dermatologis", "rambut_kuku", "Madarosis alis lateral", when=T("mb"), p=0.5),
       F("bta_kulit", "hasil", "BTA positif (IB 2+)", when=T("mb"), diag=True), F("bta_kulit", "hasil", "BTA negatif (IB 0)", when=NT("mb")),
       F("neurologis", "motorik", "Kelemahan otot intrinsik tangan kanan (claw hand jari IV–V)", when=T("cacat")),
       F("status_lokalis", "luka", "Ulkus plantar tidak nyeri di kaput metatarsal I kiri", when=T("cacat")),
       F("tanda_vital", "suhu", (37.8, 38.6), when=T("reaksi"))],
  dd=[
      X("reaksi_kusta", "Reaksi kusta: lesi meradang/ENL, neuritis akut (nyeri & fungsi saraf turun), demam — prednison & rujuk.", ["progresi", "status_dermatologis"], must=True),
      X("pitiriasis_versikolor", "Pitiriasis versikolor: skuama halus, sensibilitas NORMAL, Wood kuning keemasan, KOH positif.", ["status_dermatologis"]),
      X("tinea_korporis", "Tinea korporis: tepi aktif gatal, KOH hifa positif, sensibilitas normal.", ["status_dermatologis"]),
      X("vitiligo", "Vitiligo: depigmentasi putih susu, sensibilitas normal, tanpa penebalan saraf.", ["status_dermatologis"]),
  ],
  key=["Bercak hipopigmentasi/eritema dengan anestesi", "Penebalan saraf tepi ± gangguan fungsi", "PB: ≤ 5 lesi, BTA negatif; MB: > 5 lesi/> 1 saraf/BTA positif"],
  teach=["Setiap bercak kulit yang mati rasa di daerah endemis harus dicurigai kusta.", "Penderita yang sudah minum MDT tidak menular; MDT gratis dari program."],
  cx=[CX("cacat", "Disabilitas kusta", "cacat", ["neurologis", "status_lokalis"], "Claw hand/ulkus plantar — pencegahan cacat (POD) & perawatan diri."),
      CX("reaksi", "Reaksi kusta", "reaksi", ["status_dermatologis", "tanda_vital"], "Neuritis & lesi meradang — prednison, istirahat, rujuk.")],
  plan=dict(topics=["onset", "karakter", "progresi", "riwayat_keluarga", "riwayat_obat", "keluhan_lain"],
            exams=[("status_dermatologis", "kunci", "Lesi, sensibilitas, saraf tepi."), ("neurologis", "kunci", "Fungsi motorik & sensorik (POD).")],
            tests=[("bta_kulit", "kunci", "Klasifikasi PB/MB.")]),
  disp=[("rujuk_spesialis", "Reaksi kusta berat/neuritis: prednison & rujuk.", T("reaksi"), ["rawat_jalan"]),
        ("rawat_jalan", "MDT sesuai tipe, POD, edukasi perawatan diri, pemeriksaan kontak & kemoprofilaksis; kontrol bulanan.")],
  mg=["MDT-MB 12 blister (rifampisin 600 mg + klofazimin 300 mg + dapson 100 mg bulanan diawasi; klofazimin 50 mg + dapson 100 mg harian).",
      "MDT-PB 6 blister sesuai pedoman program.", "Pencegahan cacat: periksa fungsi saraf rutin, rawat diri tangan-kaki-mata.",
      "Periksa kontak serumah & beri kemoprofilaksis rifampisin dosis tunggal; edukasi untuk mengurangi stigma."],
  ap=["Uji sensibilitas setiap bercak, raba saraf tepi, slit skin smear.", "Klasifikasi PB/MB; nilai kecacatan & reaksi."],
  refs=REF_KK + ["Kemenkes RI. Pedoman Nasional Program Pengendalian Penyakit Kusta (2012)"])

# 17 ---------------------------------------------------------------------------------- sifilis
D(id="sifilis", name="Sifilis stadium 1 dan 2", aka=["Raja singa", "Sifilis primer", "Sifilis sekunder", "Lues"],
  sys=SYS, prev=0.7, danger="tinggi",
  summary="IMS Treponema pallidum. Stadium 1 (± 3 minggu pascapajanan): ulkus durum — ulkus tunggal TIDAK nyeri, bersih, indurasi, dengan limfadenopati inguinal tidak nyeri. Stadium 2 (6–12 minggu): ruam papuloskuamosa tidak gatal termasuk telapak tangan & kaki, kondiloma lata, mucous patch, alopesia 'moth-eaten', limfadenopati generalisata, demam ringan. RPR/VDRL & TPHA reaktif. Terapi benzatin penisilin G 2,4 juta IU IM; obati pasangan; tes HIV.",
  day=(10, 60), ages=[(18, 30, 4), (31, 50, 3)], male=0.65,
  traits=[("stadium2", 0.45), ("lsl", 0.3, W(sex="male"))], tl={"stadium2": "Sifilis sekunder.", "lsl": "Laki-laki seks dengan laki-laki."},
  sym=[("luka_kemaluan", 1, NT("stadium2")), ("ruam_kulit", 1, T("stadium2")), ("benjolan_kgb", 0.7), ("risiko_ims", 0.9), ("demam", 0.4, T("stadium2")),
       ("rambut_rontok", 0.25, T("stadium2")), ("sariawan", 0.3, T("stadium2"))],
  cc=["luka_kemaluan", "ruam_kulit"], ex=["benjolan_kgb"], mis=["lecet biasa", "alergi", "panu"], fears=["raja singa", "HIV", "menular ke istri"],
  ana={
      "onset": [("Dua minggu lalu muncul luka di kemaluan, Dok, nggak sakit sama sekali, pinggirnya keras.", "Ulkus tunggal tidak nyeri dengan indurasi", NT("stadium2")),
                ("Dua minggu ini muncul bintik kemerahan di badan sampai telapak tangan dan kaki, Dok, nggak gatal.", "Ruam papuloskuamosa termasuk telapak, tidak gatal", T("stadium2"))],
      "riwayat_penyakit": [("Dua bulan lalu ada luka di kemaluan yang nggak sakit, Dok, sembuh sendiri.", "Riwayat chancre (S1) sebelumnya", T("stadium2")),
                           ("Belum pernah sakit kelamin sebelumnya, Dok.", None, NT("stadium2"))],
      "kebiasaan": [("Saya pernah berhubungan dengan sesama jenis tanpa kondom, Dok.", "LSL tanpa kondom", T("lsl"), "risiko_ims"),
                    ("Sebulan lalu saya berhubungan dengan pekerja seks tanpa kondom, Dok.", "Seks berisiko tanpa kondom", NT("lsl"), "risiko_ims")],
      "karakter": [("Lukanya bersih, nggak bernanah, nggak sakit, Dok.", "Ulkus bersih tidak nyeri", NT("stadium2")),
                   ("Bintiknya nggak gatal, Dok, rambut juga rontok tambal-tambal.", "Tidak gatal, alopesia", T("stadium2"))],
      "riwayat_keluarga": [("Istri/pasangan saya belum diperiksa, Dok.", "Pasangan perlu diperiksa")],
  },
  f=[F("pemeriksaan_genital", "lesi_genital", "Ulkus tunggal 1 cm, bulat, bersih, dasar merah daging, tepi indurasi (keras), tidak nyeri", when=NT("stadium2"), diag=True),
     F("pemeriksaan_genital", "kgb_inguinal", "KGB inguinal bilateral membesar, kenyal, tidak nyeri", diag=True, when=NT("stadium2")),
     F("pemeriksaan_genital", "lesi_genital", "Kondiloma lata (papul datar basah) di perianal", when=T("stadium2"), p=0.4)]
    + DS("Badan, telapak tangan & kaki", "Makula-papul eritematosa-tembaga dengan skuama halus (papuloskuamosa), tidak gatal", when=T("stadium2"))
    + [F("status_dermatologis", "rambut_kuku", "Alopesia 'moth-eaten'", when=T("stadium2"), p=0.25),
       F("kepala_leher", "kgb", "Limfadenopati generalisata kecil, kenyal, tidak nyeri", when=T("stadium2")),
       F("tes_sifilis", "rpr", "Reaktif 1:32", when=T("stadium2"), diag=True), F("tes_sifilis", "tpha", "Reaktif", when=T("stadium2"), diag=True),
       F("tes_sifilis", "rpr", "Reaktif 1:8", when=NT("stadium2"), diag=True, p=0.8), F("tes_sifilis", "tpha", "Reaktif", when=NT("stadium2"), diag=True, p=0.85)],
  dd=[
      X("hiv", "Koinfeksi HIV sangat sering pada sifilis — tes HIV wajib dengan konseling.", ["tes_hiv"], must=True),
      X("herpes_simpleks", "Herpes genital: vesikel berkelompok & erosi NYERI, rekuren.", ["karakter", "pemeriksaan_genital"]),
      X("ulkus_mole", "Ulkus mole: ulkus multipel nyeri, kotor, tepi bergaung, bubo nyeri.", ["karakter"]),
      X("pitiriasis_rosea", "Pitiriasis rosea: herald patch, susunan pohon cemara, tidak di telapak, serologi negatif.", ["status_dermatologis", "tes_sifilis"]),
  ],
  key=["S1: ulkus tunggal tidak nyeri berindurasi + KGB inguinal tidak nyeri", "S2: ruam papuloskuamosa tidak gatal termasuk telapak, kondiloma lata, limfadenopati", "RPR & TPHA reaktif"],
  teach=["Ruam di telapak tangan & kaki pada dewasa aktif seksual: selalu periksa serologi sifilis.", "Edukasi reaksi Jarisch-Herxheimer (demam, menggigil) beberapa jam setelah penisilin."],
  plan=dict(topics=["onset", "riwayat_penyakit", "kebiasaan", "karakter", "riwayat_keluarga", "keluhan_lain"],
            exams=[("pemeriksaan_genital", "kunci", "Ulkus, kondiloma lata, KGB inguinal."), ("status_dermatologis", "kunci", "Ruam sekunder.", T("stadium2")),
                   ("kepala_leher", "pendukung", "Limfadenopati.")],
            tests=[("tes_sifilis", "kunci", "RPR & TPHA."), ("tes_hiv", "pendukung", "Koinfeksi HIV.")]),
  disp=[("rawat_jalan", "Benzatin penisilin G dosis tunggal, obati pasangan, tes HIV; kontrol serologi 6 & 12 bulan.")],
  mg=["Benzatin penisilin G 2,4 juta IU IM dosis tunggal (alergi penisilin: doksisiklin 2 × 100 mg 14 hari).", "Notifikasi & terapi pasangan; abstinensi/kondom.",
      "Konseling & tes HIV, hepatitis B; ibu hamil wajib skrining.", "Pantau RPR 6 & 12 bulan (target turun ≥ 4 kali)."],
  ap=["Anamnesis seksual & riwayat lesi sebelumnya.", "Pemeriksaan ulkus/ruam & KGB; serologi sifilis & HIV."],
  refs=REF_IMS)

# 18 ---------------------------------------------------------------------------------- abses folikel/kelenjar sebasea
D(id="abses_folikel", name="Abses folikel rambut/kelenjar sebasea", aka=["Abses kulit", "Kista sebasea terinfeksi", "Ateroma meradang", "Bisul besar"],
  sys=SYS, prev=0.8, danger="sedang",
  summary="Kumpulan pus di dermis/subkutis yang berasal dari folikel rambut atau kista sebasea/epidermoid yang terinfeksi: benjolan merah, hangat, nyeri, berfluktuasi, kadang dengan punctum di tengah; pada kista yang meradang ada riwayat benjolan lama tidak nyeri. Tata laksana utama: insisi & drainase; antibiotik bila selulitis luas, demam, atau imunokompromais; eksisi kista setelah radang reda.",
  day=(2, 7), ages=[(15, 30, 3), (31, 55, 4), (56, 70, 1)], male=0.55,
  traits=[("kista_sebelumnya", 0.6), ("selulitis_sekitar", 0.2)], tl={"kista_sebelumnya": "Berasal dari kista sebasea/epidermoid lama.", "selulitis_sekitar": "Selulitis di sekitar abses."},
  sym=[("bisul", 1), ("demam", 0.3), ("demam", 0.8, T("selulitis_sekitar")), ("benjolan_kulit", 1, T("kista_sebelumnya"))],
  cc=["bisul"], ex=["benjolan_kulit"], mis=["bisul biasa", "panas dalam", "salah urat"], fears=["kanker", "harus operasi besar"],
  ana={
      "onset": [("Tiga hari ini benjolan di punggung jadi merah, panas, dan sakit sekali, Dok.", "Akut, benjolan meradang")],
      "riwayat_penyakit": [("Sebenarnya benjolannya sudah ada setahun, Dok, kecil nggak sakit, ada titik hitam di tengahnya.", "Kista lama dengan punctum yang kemudian meradang",
                            T("kista_sebelumnya"), "benjolan_kulit"),
                           ("Sebelumnya nggak ada benjolan, Dok, mulai dari bintil kecil.", "Bermula dari folikel", NT("kista_sebelumnya"))],
      "karakter": [("Sekarang tengahnya terasa lunak dan berdenyut, Dok.", "Fluktuasi (abses matang)")],
      "keparahan": [("Merahnya melebar dan badan saya demam, Dok.", "Selulitis sekitar & demam", T("selulitis_sekitar"), "demam"),
                    ("Nggak demam, Dok, cuma sakit di benjolannya.", None, NT("selulitis_sekitar"))],
      "riwayat_obat": [("Sudah saya pencet tapi nggak keluar, Dok.", "Dipencet sendiri")],
  },
  f=[F("status_lokalis", "benjolan", "Benjolan 3 cm di punggung atas, eritema, hangat, nyeri tekan, berfluktuasi, dengan punctum di tengah", when=T("kista_sebelumnya"), diag=True),
     F("status_lokalis", "benjolan", "Benjolan 2,5 cm di aksila kanan, eritema, hangat, nyeri tekan, berfluktuasi", when=NT("kista_sebelumnya"), diag=True),
     F("status_lokalis", "tepi_dasar", "Eritema & indurasi meluas 4 cm di sekitar abses", when=T("selulitis_sekitar")),
     F("tanda_vital", "suhu", (37.8, 38.8), when=SY("demam")),
     F("usg_superfisial", "lesi", "Kumpulan cairan hipoekoik berdinding tebal dengan debris (abses)"), F("usg_superfisial", "kesan", "Abses subkutan")],
  dd=[
      X("fasiitis_nekrotikans", "Infeksi nekrotikans: nyeri hebat, bula hemoragik, krepitasi, syok — rujuk segera.", ["keparahan", "tanda_vital"], must=True),
      X("lipoma", "Lipoma: lunak, tidak nyeri, tidak merah.", ["karakter", "status_lokalis"]),
      X("hidradenitis_supurativa", "Hidradenitis: nodus berulang di aksila/inguinal dengan sinus & parut.", ["riwayat_penyakit"]),
  ],
  key=["Benjolan merah, hangat, nyeri, berfluktuasi", "Riwayat kista lama dengan punctum (kista sebasea/epidermoid) atau folikulitis", "Tanpa tanda infeksi dalam"],
  teach=["Abses berfluktuasi diobati dengan INSISI & DRAINASE — antibiotik saja tidak cukup.", "Eksisi kista dilakukan setelah radang reda untuk mencegah kambuh."],
  plan=dict(topics=["onset", "riwayat_penyakit", "karakter", "keparahan", "riwayat_obat", "keluhan_lain"],
            exams=[("status_lokalis", "kunci", "Ukuran, fluktuasi, punctum, selulitis sekitar.")],
            opt=[("usg_superfisial", "Bila fluktuasi meragukan.")]),
  disp=[("rawat_jalan", "Insisi & drainase dengan anestesi lokal, antibiotik bila selulitis/demam; kontrol 2 hari; eksisi kista elektif.", None, ["rujuk_spesialis"])],
  mg=["Insisi & drainase dengan anestesi lokal (lidokain 1%), evakuasi pus, irigasi NaCl, pasang drain/tampon bila perlu.", "Antibiotik oral (dikloksasilin/sefadroksil) bila selulitis, demam, wajah, atau imunokompromais.",
      "Analgesik; ganti balutan; eksisi kista lengkap dengan kapsul setelah radang reda."],
  ap=["Tentukan fluktuasi & asal (kista vs folikel).", "Nilai selulitis & tanda infeksi dalam."],
  refs=REF_KK)

# Rujukan maju (penyakit kulit berikutnya)
C("hidradenitis_supurativa", "Hidradenitis supurativa", SYS, "rendah", "Nodus/abses berulang di aksila/inguinal dengan sinus & parut.")
C("akne_vulgaris", "Akne vulgaris", SYS, "rendah", "Komedo, papul, pustul di wajah/dada/punggung.")
C("miliaria", "Miliaria", SYS, "rendah", "Biang keringat.")
C("tinea_kruris", "Tinea kruris", SYS, "rendah", "Infeksi dermatofita lipat paha.")
C("tinea_korporis", "Tinea korporis", SYS, "rendah", "Infeksi dermatofita kulit badan.")
C("kandidosis_kutis", "Kandidosis kutis", SYS, "rendah", "Infeksi kandida kulit lipatan.")
C("pitiriasis_versikolor", "Pitiriasis versikolor", SYS, "rendah", "Panu.")
C("pitiriasis_rosea", "Pitiriasis rosea", SYS, "rendah", "Herald patch lalu erupsi sekunder.")
C("dermatitis_kontak_iritan", "Dermatitis kontak iritan", SYS, "rendah", "Dermatitis akibat iritan.")
C("erupsi_obat", "Erupsi obat", SYS, "sedang", "Reaksi obat di kulit.")
