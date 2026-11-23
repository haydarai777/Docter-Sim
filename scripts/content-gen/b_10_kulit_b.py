"""Batch KULIT B — dermatofitosis, jamur lain, parasit kulit & gigitan serangga (15 penyakit)."""
from lib import C, CX, D, F, PF, T, NT, SY, W, X, REF_PPK

SYS = "Kulit & kelamin"
REF_KK = [REF_PPK, "PERDOSKI. Panduan Praktik Klinis bagi Dokter Spesialis Dermatologi dan Venereologi Indonesia (2021)"]
KOH_DERM = "Hifa panjang bersepta bercabang & artrospora (+)"


def DS(lok, efl, khusus=None, when=None, p=None, diag=True):
    out = [F("status_dermatologis", "lokasi", lok, when=when, p=p), F("status_dermatologis", "efloresensi", efl, when=when, p=p, diag=diag)]
    if khusus:
        out.append(F("status_dermatologis", "tanda_khusus", khusus, when=when, p=p))
    return out


C("alopesia_areata", "Alopesia areata", SYS, "rendah", "Bercak botak bulat licin tanpa skuama/radang, rambut tanda seru di tepi.")
C("lupus_kutan", "Lupus eritematosus kutan", SYS, "tinggi", "Ruam kupu-kupu/plak diskoid fotosensitif dengan atrofi & parut; dapat sistemik. Rujuk.")
C("psoriasis", "Psoriasis", SYS, "sedang", "Plak eritematosa berbatas tegas dengan skuama tebal putih keperakan (Auspitz, Koebner), di siku/lutut/kulit kepala; kuku pitting.")
C("melanoma_subungual", "Melanoma subungual", SYS, "tinggi", "Pita hitam-coklat di kuku yang melebar, pigmen meluas ke lipatan kuku (tanda Hutchinson). Rujuk biopsi.")
C("pitiriasis_alba", "Pitiriasis alba", SYS, "rendah", "Bercak hipopigmentasi batas tidak tegas dengan skuama halus di wajah anak atopik.")
C("skabies_krustosa", "Skabies krustosa (Norwegia)", SYS, "tinggi", "Skabies dengan krusta tebal luas berisi ribuan tungau pada imunokompromais/lansia — sangat menular. Rujuk.")

# --------------------------------------------------------------------------- tinea kapitis
D(id="tinea_kapitis", name="Tinea kapitis", aka=["Kurap kepala", "Ringworm kepala", "Kerion"],
  sys=SYS, prev=0.7,
  summary="Infeksi dermatofita (Microsporum, Trichophyton) pada kulit kepala & rambut, hampir selalu pada anak prapubertas, sering tertular dari kucing/anjing atau teman. Bercak bersisik dengan rambut patah-patah (gray patch), black dot, atau kerion (massa radang lunak bernanah — sering salah dikira abses). Lampu Wood hijau (Microsporum), KOH spora pada rambut. Terapi HARUS oral (griseofulvin 6–8 minggu) + sampo antijamur.",
  day=(14, 90), ages=[(3, 9, 5), (10, 13, 2)], male=0.6,
  occ=[("anak_tk", 2), ("anak_sd", 3), ("pelajar_sd", 2)], bias=0.5,
  traits=[("kerion", 0.15), ("kontak_kucing", 0.5)], tl={"kerion": "Kerion (tipe inflamasi).", "kontak_kucing": "Kontak kucing/hewan peliharaan."},
  sym=[("rambut_rontok", 1), ("gatal_kepala", 0.8), ("kulit_bersisik", 0.7), ("bisul", 1, T("kerion")), ("benjolan_kgb", 0.6, T("kerion"))],
  cc=["rambut_rontok"], ex=["gatal_kepala"], mis=["ketombe", "kutu", "bisul kepala"], fears=["botak permanen", "menular ke teman"],
  ana={
      "onset": [("Sudah sebulan, Dok, ada bagian rambut yang botak bulat bersisik, makin lebar.", "Kronik, bercak alopesia bersisik meluas")],
      "karakter": [("Rambutnya patah-patah pendek di bagian itu, gatal, ada sisik abu-abu, Dok.", "Rambut patah dengan skuama keabuan", NT("kerion")),
                   ("Sekarang bagian itu bengkak lunak, bernanah, sakit, Dok.", "Massa radang bernanah (kerion)", T("kerion"), "bisul")],
      "bepergian_lingkungan": [("Di rumah pelihara kucing, Dok, sering dipeluk.", "Kontak kucing", T("kontak_kucing")), ("Teman sekelasnya ada yang begitu juga, Dok.", "Kontak teman", NT("kontak_kucing"))],
      "riwayat_obat": [("Sudah dikasih salep jamur dari warung, Dok, nggak sembuh.", "Gagal dengan topikal saja")],
  },
  f=DS("Kulit kepala oksipital", "Plak alopesia bulat berskuama keabuan dengan rambut patah-patah pendek (gray patch)", when=NT("kerion"))
    + DS("Kulit kepala parietal", "Massa eritematosa lunak (boggy) dengan pustul & pus, rambut mudah dicabut (kerion)", when=T("kerion"))
    + [F("status_dermatologis", "rambut_kuku", "Rambut di area lesi patah, kusam, mudah dicabut"),
       F("lampu_wood", "fluoresensi", "Fluoresensi hijau terang pada batang rambut (Microsporum)", p=0.6),
       F("kerokan_koh", "hasil", "Spora ektotriks di sekeliling batang rambut & hifa (+)", diag=True),
       F("kepala_leher", "kgb", "KGB oksipital & servikal posterior membesar", when=T("kerion"))],
  dd=[
      X("furunkel_karbunkel", "Kerion sering dikira abses/furunkel — JANGAN diinsisi; KOH & lampu Wood membedakan.", ["kerokan_koh", "status_dermatologis"], must=True),
      X("alopesia_areata", "Alopesia areata: bercak botak licin tanpa skuama/radang, rambut tanda seru, KOH negatif.", ["status_dermatologis", "kerokan_koh"]),
      X("dermatitis_seboroik", "Dermatitis seboroik: skuama kekuningan berminyak difus tanpa rambut patah/alopesia.", ["status_dermatologis"]),
  ],
  key=["Anak dengan bercak alopesia bersisik & rambut patah, gatal", "Kerion: massa radang bernanah", "KOH spora pada rambut; Wood hijau (Microsporum)"],
  teach=["Tinea kapitis tidak sembuh dengan obat topikal saja — perlu antijamur oral.", "Cari & obati sumber (hewan peliharaan, saudara)."],
  plan=dict(topics=["onset", "karakter", "bepergian_lingkungan", "riwayat_obat", "keluhan_lain"],
            exams=[("status_dermatologis", "kunci", "Alopesia, skuama, kerion.")],
            tests=[("kerokan_koh", "kunci", "Spora/hifa pada rambut."), ("lampu_wood", "pendukung", "Fluoresensi hijau Microsporum.")]),
  disp=[("rawat_jalan", "Griseofulvin oral 6–8 minggu + sampo antijamur; kontrol 2–4 minggu.", None, ["rujuk_spesialis"])],
  mg=["Griseofulvin 20–25 mg/kg/hari (microsize) dengan makanan berlemak selama 6–8 minggu.", "Sampo ketokonazol 2%/selenium sulfida 2–3 × seminggu (mengurangi penularan).",
      "Kerion: tambahkan kortikosteroid oral singkat (pertimbangkan rujuk); jangan diinsisi.", "Obati hewan/anggota keluarga; sisir & topi tidak dipakai bersama; boleh sekolah setelah terapi dimulai."],
  ap=["Kenali alopesia bersisik pada anak; KOH rambut & lampu Wood.", "Bedakan kerion dari abses."],
  refs=REF_KK)

# --------------------------------------------------------------------------- tinea barbae
D(id="tinea_barbae", name="Tinea barbae", aka=["Kurap janggut", "Tinea sycosis"],
  sys=SYS, prev=0.3,
  summary="Infeksi dermatofita pada kulit & folikel rambut janggut/kumis laki-laki dewasa, sering tertular dari hewan ternak (zoofilik). Plak eritematosa dengan papul-pustul folikular, kadang nodus mirip kerion, rambut janggut mudah dicabut; tepi berskuama. Sering salah diobati sebagai folikulitis bakteri. KOH rambut/kerokan positif. Terapi antijamur oral 4–6 minggu.",
  day=(14, 60), ages=[(18, 40, 3), (41, 65, 3)], male=1.0,
  occ=[("petani", 3), ("pekerja_sawit", 1)], bias=0.5,
  traits=[("ternak", 0.6)], tl={"ternak": "Kontak hewan ternak."},
  sym=[("bintil_bernanah", 1), ("gatal_kulit", 0.6), ("rambut_rontok", 0.5), ("ruam_kulit", 0.6)],
  cc=["bintil_bernanah"], ex=["gatal_kulit"], mis=["jerawat", "iritasi cukur", "bisul"], fears=["infeksi menyebar ke muka"],
  ana={
      "onset": [("Sudah tiga minggu, Dok, di janggut muncul bintil bernanah, merah, makin lebar.", "Subakut di area janggut")],
      "riwayat_obat": [("Sudah minum antibiotik dari warung, Dok, nggak sembuh.", "Tidak respons antibiotik")],
      "bepergian_lingkungan": [("Saya pelihara sapi, Dok, tiap hari memandikan sapi.", "Kontak ternak (zoofilik)", T("ternak")), ("Kerja biasa, Dok.", None, NT("ternak"))],
      "karakter": [("Bulu janggutnya gampang dicabut di bagian yang merah, Dok.", "Rambut mudah dicabut")],
  },
  f=DS("Janggut & dagu", "Plak eritematosa dengan papul-pustul folikular, tepi aktif berskuama, rambut janggut mudah dicabut")
    + [F("kerokan_koh", "hasil", "Hifa bersepta & spora pada rambut janggut (+)", diag=True)],
  dd=[
      X("furunkel_karbunkel", "Furunkel/karbunkel: nodus dalam nyeri dengan mata bisul, kokus Gram positif, respons antibiotik.", ["status_dermatologis", "kerokan_koh"], must=True),
      X("folikulitis", "Folikulitis bakteri/pseudofolikulitis: pustul folikular tanpa plak bertepi aktif, KOH negatif.", ["kerokan_koh"]),
      X("akne_vulgaris", "Akne: komedo, wajah luas, usia remaja.", ["status_dermatologis"]),
  ],
  key=["Laki-laki dewasa dengan plak eritematosa berpustul folikular di area janggut", "Rambut mudah dicabut, tidak respons antibiotik", "KOH positif"],
  plan=dict(topics=["onset", "riwayat_obat", "bepergian_lingkungan", "karakter", "keluhan_lain"],
            exams=[("status_dermatologis", "kunci", "Plak & pustul folikular.")], tests=[("kerokan_koh", "kunci", "Hifa/spora pada rambut.")]),
  disp=[("rawat_jalan", "Antijamur oral 4–6 minggu + topikal; hindari mencukur; kontrol 2 minggu.")],
  mg=["Terbinafin 250 mg/hari atau griseofulvin 500–1000 mg/hari selama 4–6 minggu.", "Antijamur topikal tambahan, kompres bila banyak pus.", "Hindari mencukur selama terapi; obati sumber hewan."],
  ap=["Pustul janggut yang tidak sembuh dengan antibiotik → KOH."],
  refs=REF_KK)

# --------------------------------------------------------------------------- tinea fasialis
D(id="tinea_fasialis", name="Tinea fasialis", aka=["Kurap wajah", "Tinea faciei"],
  sys=SYS, prev=0.4,
  summary="Dermatofitosis kulit wajah (non-janggut): plak eritematosa anular dengan tepi aktif papul-skuama dan bagian tengah lebih tenang, gatal, memberat setelah terpapar matahari/berkeringat. Sering salah diagnosis sebagai dermatitis dan diobati krim steroid sehingga gambaran kabur (tinea inkognito). KOH positif.",
  day=(14, 90), ages=[(5, 9, 2), (10, 30, 3), (31, 60, 2)], male=0.5,
  traits=[("steroid_topikal", 0.35)], tl={"steroid_topikal": "Sudah memakai krim steroid (tinea inkognito)."},
  sym=[("ruam_kulit", 1), ("gatal_kulit", 0.7)],
  cc=["ruam_kulit"], ex=["gatal_kulit"], mis=["alergi kosmetik", "flek", "panu"], fears=["bekas di wajah", "lupus"],
  ana={
      "onset": [("Sudah sebulan, Dok, bercak merah di pipi makin lebar melingkar.", "Bercak anular meluas perlahan")],
      "pemberat_peringan": [("Kalau kena matahari atau keringat makin gatal, Dok.", "Memberat dengan keringat/matahari")],
      "riwayat_obat": [("Saya kasih krim campur steroid dari salon, Dok, awalnya enakan terus makin lebar.", "Krim steroid memperburuk (tinea inkognito)", T("steroid_topikal")),
                       ("Belum pakai obat, Dok.", None, NT("steroid_topikal"))],
      "riwayat_penyakit": [("Nggak ada nyeri sendi, sariawan, atau rambut rontok, Dok.", "Tanpa gejala sistemik lupus")],
  },
  f=DS("Pipi kanan", "Plak eritematosa anular berbatas tegas dengan tepi aktif papul & skuama, bagian tengah lebih tenang", when=NT("steroid_topikal"))
    + DS("Pipi kanan meluas ke dagu", "Plak eritematosa luas dengan batas samar, sedikit skuama, papul-pustul (tinea inkognito)", when=T("steroid_topikal"))
    + [F("kerokan_koh", "hasil", KOH_DERM, diag=True), F("status_dermatologis", "sensibilitas_lesi", "Sensibilitas lesi normal")],
  dd=[
      X("lupus_kutan", "Lupus kutan: plak fotosensitif dengan atrofi/parut, ruam kupu-kupu, gejala sistemik — rujuk.", ["riwayat_penyakit", "kerokan_koh"], must=True),
      X("dermatitis_seboroik", "Dermatitis seboroik: skuama kekuningan berminyak di lipatan nasolabial/alis, KOH negatif.", ["status_dermatologis", "kerokan_koh"]),
      X("kusta", "Kusta: bercak dengan anestesi, penebalan saraf.", ["status_dermatologis"]),
  ],
  key=["Plak anular wajah dengan tepi aktif & central healing", "Gatal memberat dengan keringat/matahari", "KOH positif; riwayat krim steroid (inkognito)"],
  teach=["Jangan memberi krim steroid pada lesi anular bersisik sebelum KOH — memicu tinea inkognito."],
  plan=dict(topics=["onset", "pemberat_peringan", "riwayat_obat", "riwayat_penyakit", "keluhan_lain"],
            exams=[("status_dermatologis", "kunci", "Morfologi anular, sensibilitas.")], tests=[("kerokan_koh", "kunci", "Hifa dermatofita.")]),
  disp=[("rawat_jalan", "Antijamur topikal 2–4 minggu, hentikan steroid; oral bila luas; kontrol 2 minggu.")],
  mg=["Krim antijamur (mikonazol/ketokonazol/terbinafin) 2 × sehari 2–4 minggu, lanjut 1–2 minggu setelah sembuh klinis.", "Hentikan krim steroid; tabir surya.",
      "Antijamur oral bila luas/inkognito."],
  ap=["Lesi anular wajah → KOH sebelum terapi."],
  refs=REF_KK)

# --------------------------------------------------------------------------- tinea korporis
D(id="tinea_korporis", name="Tinea korporis", aka=["Kurap", "Ringworm", "Kadas", "Dermatofitosis badan"],
  sys=SYS, prev=1.6,
  summary="Dermatofitosis kulit badan & ekstremitas: plak eritematosa anular/polisiklik berbatas tegas dengan tepi aktif (papul, vesikel, skuama) dan central healing, sangat gatal terutama saat berkeringat. Penularan dari manusia, hewan, atau tanah; faktor lembap, pakaian ketat, berbagi handuk. KOH: hifa bersepta. Terapi antijamur topikal 2–4 minggu; oral bila luas.",
  day=(14, 90), ages=[(5, 9, 2), (10, 30, 4), (31, 60, 3), (61, 75, 1)], male=0.55,
  occ=[("pekerja_proyek", 2), ("pelajar", 2), ("buruh_pabrik", 2)], bias=0.3,
  traits=[("luas", 0.25), ("kontak_serumah", 0.4)], tl={"luas": "Lesi luas (indikasi antijamur oral).", "kontak_serumah": "Anggota keluarga mengalami hal serupa."},
  sym=[("ruam_kulit", 1), ("gatal_kulit", 1), ("kulit_bersisik", 0.6)],
  cc=["ruam_kulit"], ex=["gatal_kulit"], mis=["alergi", "eksim", "panu"], fears=["menular", "kusta"],
  ana={
      "onset": [("Sudah sebulan, Dok, bercak merah melingkar di punggung, makin lebar.", "Bercak anular meluas perlahan")],
      "karakter": [("Pinggirnya merah ada bintil-bintil dan sisik, tengahnya mulai pudar, Dok.", "Tepi aktif dengan central healing")],
      "pemberat_peringan": [("Gatal sekali kalau keringatan, Dok.", "Gatal memberat saat berkeringat")],
      "kebiasaan": [("Handuk sering pakai bergantian dengan adik, Dok, bajunya juga sering lembap.", "Berbagi handuk & lembap")],
      "riwayat_keluarga": [("Adik saya juga ada bercak begitu, Dok.", "Kontak serumah", T("kontak_serumah")), ("Yang lain di rumah kulitnya baik, Dok.", None, NT("kontak_serumah"))],
  },
  f=DS("Punggung & lengan atas", "Plak eritematosa anular polisiklik berbatas tegas dengan tepi aktif (papul, vesikel, skuama) & central healing", when=NT("luas"))
    + DS("Badan, bokong, kedua tungkai (luas)", "Plak eritematosa anular polisiklik multipel dengan tepi aktif & central healing", when=T("luas"))
    + [F("kerokan_koh", "hasil", KOH_DERM, diag=True), F("status_dermatologis", "sensibilitas_lesi", "Sensibilitas lesi normal")],
  dd=[
      X("kusta", "Kusta: bercak anestesi tanpa gatal, penebalan saraf, KOH negatif.", ["status_dermatologis"], must=True),
      X("dermatitis_numularis", "Dermatitis numularis: plak koin bervesikel basah tanpa central healing, KOH negatif.", ["status_dermatologis", "kerokan_koh"]),
      X("pitiriasis_rosea", "Pitiriasis rosea: herald patch, skuama koleret, susunan pohon cemara.", ["status_dermatologis"]),
      X("psoriasis", "Psoriasis: plak skuama tebal keperakan di siku/lutut/kulit kepala, Auspitz (+).", ["status_dermatologis"]),
  ],
  key=["Plak anular polisiklik bertepi aktif dengan central healing", "Gatal memberat saat berkeringat", "KOH: hifa bersepta"],
  teach=["Lanjutkan antijamur topikal 1–2 minggu setelah lesi bersih untuk mencegah kekambuhan.", "Hindari kombinasi krim steroid-antijamur yang dijual bebas."],
  plan=dict(topics=["onset", "karakter", "pemberat_peringan", "kebiasaan", "riwayat_keluarga", "keluhan_lain"],
            exams=[("status_dermatologis", "kunci", "Morfologi & sensibilitas lesi.")], tests=[("kerokan_koh", "kunci", "Hifa dermatofita.")]),
  disp=[("rawat_jalan", "Antijamur topikal 2–4 minggu (oral bila luas), higiene; kontrol 2–4 minggu.")],
  mg=["Krim mikonazol/ketokonazol/terbinafin 2 × sehari minimal 2–4 minggu, lanjut 1–2 minggu setelah sembuh.", "Lesi luas: griseofulvin 500 mg/hari atau terbinafin 250 mg/hari 2–4 minggu.",
      "Keringkan kulit, pakaian menyerap keringat, handuk tidak dipakai bersama; obati anggota keluarga/hewan."],
  ap=["Lesi anular gatal → KOH.", "Uji sensibilitas untuk menyingkirkan kusta."],
  refs=REF_KK)

# --------------------------------------------------------------------------- tinea manus
D(id="tinea_manus", name="Tinea manus", aka=["Kurap tangan", "Tinea manuum"],
  sys=SYS, prev=0.4,
  summary="Dermatofitosis telapak/punggung tangan, khas UNILATERAL dengan skuama difus & hiperkeratosis telapak yang menonjolkan garis tangan, sering bersama tinea pedis bilateral ('two feet–one hand'). Gatal ringan. KOH positif. Karena hiperkeratosis, sering perlu antijamur oral + keratolitik.",
  day=(30, 180), ages=[(18, 40, 3), (41, 65, 3)], male=0.6,
  traits=[("tinea_pedis_menyertai", 0.7)], tl={"tinea_pedis_menyertai": "Tinea pedis menyertai."},
  sym=[("kulit_bersisik", 1), ("gatal_kulit", 0.5)],
  cc=["kulit_bersisik"], ex=["gatal_kulit"], mis=["kulit kering", "eksim", "kena sabun"], fears=["menular", "kulit rusak"],
  ana={
      "onset": [("Sudah beberapa bulan, Dok, telapak tangan kanan kering bersisik, garis-garisnya jadi jelas.", "Kronik, telapak bersisik")],
      "lokasi": [("Cuma tangan kanan, Dok, yang kiri bagus. Telapak kaki juga bersisik dua-duanya.", "Unilateral tangan + kedua kaki (two feet–one hand)")],
      "kebiasaan": [("Kaki saya sering saya garuk pakai tangan kanan, Dok, kutu air.", "Autoinokulasi dari tinea pedis", T("tinea_pedis_menyertai")),
                    ("Kerjaan saya nggak banyak kena air atau sabun, Dok.", "Bukan pekerjaan basah", NT("tinea_pedis_menyertai"))],
      "riwayat_obat": [("Sudah pakai pelembap, Dok, nggak membaik.", "Tidak membaik dengan emolien")],
  },
  f=DS("Telapak tangan kanan (unilateral) & kedua telapak kaki", "Skuama difus & hiperkeratosis telapak dengan aksentuasi garis tangan, tepi berbatas tegas")
    + [F("kerokan_koh", "hasil", KOH_DERM, diag=True)],
  dd=[
      X("sifilis", "Sifilis sekunder: lesi papuloskuamosa telapak tangan & kaki bilateral, tidak gatal, serologi reaktif.", ["status_dermatologis", "kebiasaan"], must=True),
      X("dermatitis_kontak_iritan", "Dermatitis kontak iritan: bilateral, pekerjaan basah/sabun, KOH negatif.", ["lokasi", "kerokan_koh"]),
      X("psoriasis", "Psoriasis palmoplantar: plak skuama tebal bilateral, lesi di tempat lain, pitting kuku.", ["status_dermatologis"]),
  ],
  key=["Skuama & hiperkeratosis telapak UNILATERAL", "Tinea pedis bilateral menyertai", "KOH positif"],
  plan=dict(topics=["onset", "lokasi", "kebiasaan", "riwayat_obat", "keluhan_lain"],
            exams=[("status_dermatologis", "kunci", "Distribusi unilateral & kaki.")], tests=[("kerokan_koh", "kunci", "Hifa dermatofita.")]),
  disp=[("rawat_jalan", "Antijamur oral + topikal & keratolitik; obati tinea pedis; kontrol 2–4 minggu.")],
  mg=["Terbinafin 250 mg/hari 2–4 minggu atau griseofulvin; antijamur topikal tambahan.", "Keratolitik (asam salisilat 3–5%/urea 10–20%) untuk hiperkeratosis.", "Obati tinea pedis sekaligus."],
  ap=["Pola two feet–one hand; KOH kerokan telapak."],
  refs=REF_KK)

# --------------------------------------------------------------------------- tinea unguium
D(id="tinea_unguium", name="Tinea unguium (onikomikosis)", aka=["Jamur kuku", "Onikomikosis", "Kuku rusak karena jamur"],
  sys=SYS, prev=0.7,
  summary="Infeksi dermatofita pada kuku, tersering kuku kaki orang dewasa/lansia: kuku menebal, kekuningan/keputihan, rapuh, onikolisis, hiperkeratosis subungual; sering bersama tinea pedis. KOH dari debris subungual positif. Terapi oral lama (terbinafin 12 minggu kuku kaki) atau topikal untuk kasus ringan; angka kambuh tinggi.",
  day=(90, 720), ages=[(25, 44, 2), (45, 75, 4)], male=0.55,
  traits=[("tinea_pedis_menyertai", 0.6), ("dm_curiga", 0.12)], tl={"tinea_pedis_menyertai": "Tinea pedis menyertai.", "dm_curiga": "Diabetes menyertai."},
  sym=[("kuku_rusak", 1), ("gatal_kulit", 0.3)],
  cc=["kuku_rusak"], mis=["kuku tua", "kurang kalsium", "kena benturan"], fears=["kuku lepas", "menular"],
  ana={
      "onset": [("Sudah setahun lebih, Dok, kuku jempol kaki tebal dan kuning, makin lama makin rapuh.", "Kronik progresif")],
      "kebiasaan": [("Seharian pakai sepatu tertutup, kaki keringatan, Dok.", "Sepatu tertutup & lembap")],
      "riwayat_penyakit": [("Sela jari kaki saya juga sering gatal mengelupas, Dok.", "Tinea pedis menyertai", T("tinea_pedis_menyertai")),
                           ("Saya kencing manis, Dok.", "DM", T("dm_curiga")), ("Nggak ada penyakit lain, Dok.".replace("Nggak ada penyakit lain", "Saya sehat-sehat saja"), None, W(nt=["tinea_pedis_menyertai", "dm_curiga"]))],
      "karakter": [("Nggak ada garis hitam di kuku, Dok, cuma kuning keruh dan bawahnya banyak serpihan.", "Tanpa pita pigmen (bukan melanoma)")],
  },
  f=[F("status_dermatologis", "rambut_kuku", "Kuku ibu jari kaki kanan & kiri menebal, kekuningan, rapuh, onikolisis dengan hiperkeratosis subungual", diag=True),
     F("status_dermatologis", "lokasi", "Kuku jari I–II kaki kanan & kiri"),
     F("status_dermatologis", "efloresensi", "Maserasi & skuama sela jari IV–V", when=T("tinea_pedis_menyertai")),
     F("kerokan_koh", "hasil", "Hifa bersepta pada debris subungual (+)", diag=True, p=0.85),
     F("gula_darah", "gds", (210, 290), when=T("dm_curiga"))],
  dd=[
      X("melanoma_subungual", "Melanoma subungual: pita coklat-hitam yang melebar, pigmen meluas ke lipatan kuku — rujuk biopsi.", ["karakter", "status_dermatologis"], must=True),
      X("psoriasis", "Psoriasis kuku: pitting, oil drop, lesi psoriasis di kulit; KOH negatif.", ["status_dermatologis", "kerokan_koh"]),
      X("kandidosis_kutis", "Onikomikosis kandida/paronikia: lipatan kuku bengkak merah, sering kuku tangan pada pekerjaan basah.", ["status_dermatologis"]),
  ],
  key=["Kuku menebal, kekuningan, rapuh, hiperkeratosis subungual", "Tinea pedis menyertai, sepatu tertutup", "KOH debris subungual positif"],
  teach=["Periksa fungsi hati sebelum & selama terapi terbinafin/itrakonazol jangka panjang bila ada risiko."],
  plan=dict(topics=["onset", "kebiasaan", "riwayat_penyakit", "karakter", "keluhan_lain"],
            exams=[("status_dermatologis", "kunci", "Kuku & sela jari.")], tests=[("kerokan_koh", "kunci", "Hifa pada debris subungual.")],
            opt=[("fungsi_hati", "Sebelum terapi oral jangka panjang bila ada risiko gangguan hati."), ("gula_darah", "Skrining DM.")]),
  disp=[("rawat_jalan", "Terbinafin oral 12 minggu atau topikal (ringan), potong kuku, obati tinea pedis; kontrol bulanan.")],
  mg=["Terbinafin 250 mg/hari 12 minggu (kuku kaki) / 6 minggu (kuku tangan) atau itrakonazol pulse.", "Kasus ringan (< 50% kuku, tanpa matriks): siklopiroks/amorolfin topikal.",
      "Potong & kikir kuku pendek, kaki kering, sepatu berventilasi; obati tinea pedis."],
  ap=["KOH sebelum terapi lama; singkirkan melanoma subungual & psoriasis."],
  refs=REF_KK)

# --------------------------------------------------------------------------- tinea kruris
D(id="tinea_kruris", name="Tinea kruris", aka=["Kurap selangkangan", "Jock itch", "Gatal lipat paha"],
  sys=SYS, prev=1.4,
  summary="Dermatofitosis lipat paha, perineum, & bokong, tersering laki-laki dewasa, obesitas, banyak berkeringat, celana ketat. Plak eritematosa-kecoklatan berbatas tegas dengan tepi aktif polisiklik (papul, vesikel, skuama), central healing, sangat gatal; skrotum biasanya TIDAK terkena (berbeda dari kandidosis). KOH positif. Terapi topikal 2–4 minggu, jaga kering, obati tinea pedis sebagai sumber.",
  day=(14, 90), ages=[(16, 30, 3), (31, 55, 4), (56, 70, 1)], male=0.75,
  occ=[("ojek_online", 2), ("sopir_truk", 2), ("pekerja_proyek", 2)], bias=0.3,
  traits=[("tinea_pedis_menyertai", 0.4), ("obesitas_menyertai", 0.35)], tl={"tinea_pedis_menyertai": "Tinea pedis menyertai.", "obesitas_menyertai": "Obesitas."},
  tc={"obesitas_menyertai": "obesitas"},
  sym=[("gatal_kulit", 1), ("ruam_kulit", 1)],
  cc=["gatal_kulit"], ex=["ruam_kulit"], mis=["biang keringat", "penyakit kelamin", "alergi celana"], fears=["penyakit kelamin", "menular ke istri"],
  ana={
      "onset": [("Sudah sebulan, Dok, selangkangan gatal sekali, merah kecoklatan, makin melebar ke bokong.", "Subakut, meluas")],
      "lokasi": [("Di lipat paha kanan-kiri sampai bokong, Dok. Buah zakarnya sih nggak kena.", "Lipat paha & bokong, skrotum tidak terkena")],
      "pemberat_peringan": [("Kalau keringatan atau duduk lama di motor makin gatal, Dok.", "Memberat dengan keringat/oklusi")],
      "kebiasaan": [("Seharian pakai celana jins ketat, jarang ganti celana dalam, Dok.", "Celana ketat & lembap"),
                    ("Sela jari kaki saya juga sering gatal mengelupas, Dok.", "Tinea pedis (sumber)", T("tinea_pedis_menyertai"))],
      "riwayat_penyakit": [("Belum pernah dibilang kencing manis, Dok.", None)],
  },
  f=DS("Lipat paha kanan & kiri meluas ke bokong; skrotum tidak terkena", "Plak eritematosa-kecoklatan berbatas tegas dengan tepi aktif polisiklik (papul, vesikel, skuama) & central healing")
    + [F("kerokan_koh", "hasil", KOH_DERM, diag=True), F("lampu_wood", "fluoresensi", "Tidak ada fluoresensi khas"),
       F("timbangan", "imt", (27, 32), when=T("obesitas_menyertai"))],
  dd=[
      X("dm_tipe2", "Infeksi jamur lipatan luas/berulang: pertimbangkan DM — tanyakan & periksa gula darah.", ["riwayat_penyakit", "gula_darah"], must=True),
      X("kandidosis_kutis", "Kandidosis: eritema merah terang basah dengan lesi satelit, skrotum ikut terkena, KOH pseudohifa.", ["status_dermatologis", "kerokan_koh"]),
      X("eritrasma", "Eritrasma: patch coklat-merah tanpa tepi aktif, Wood merah bata.", ["lampu_wood", "status_dermatologis"]),
  ],
  key=["Plak lipat paha bertepi aktif polisiklik dengan central healing, sangat gatal", "Skrotum tidak terkena", "KOH positif"],
  plan=dict(topics=["onset", "lokasi", "pemberat_peringan", "kebiasaan", "riwayat_penyakit", "keluhan_lain"],
            exams=[("status_dermatologis", "kunci", "Tepi aktif, keterlibatan skrotum."), ("timbangan", "pendukung", "Obesitas.")],
            tests=[("kerokan_koh", "kunci", "Hifa dermatofita."), ("lampu_wood", "pendukung", "Menyingkirkan eritrasma.")]),
  disp=[("rawat_jalan", "Antijamur topikal 2–4 minggu, jaga kering; kontrol 2 minggu.")],
  mg=["Krim antijamur (mikonazol/ketokonazol/terbinafin) 2 × sehari 2–4 minggu.", "Bedak antijamur, celana dalam katun longgar, ganti bila lembap; keringkan setelah mandi.",
      "Obati tinea pedis (pakai kaus kaki dulu sebelum celana dalam)."],
  ap=["Lesi lipat paha gatal → periksa skrotum, KOH, Wood."],
  refs=REF_KK)

# --------------------------------------------------------------------------- tinea pedis
D(id="tinea_pedis", name="Tinea pedis", aka=["Kutu air", "Athlete's foot", "Kurap kaki"],
  sys=SYS, prev=1.3,
  summary="Dermatofitosis kaki, tersering tipe interdigital (maserasi putih, fisura, skuama di sela jari IV–V), juga tipe moccasin (skuama difus telapak) dan vesikobulosa. Gatal, bau, perih bila fisura. Faktor: sepatu tertutup, kaus kaki lembap, kamar mandi umum, banjir. Menjadi pintu masuk erisipelas/selulitis. KOH positif. Antijamur topikal 4 minggu & menjaga kaki kering.",
  day=(14, 180), ages=[(15, 30, 3), (31, 55, 4), (56, 70, 2)], male=0.65,
  occ=[("satpam", 2), ("tni", 1), ("pekerja_proyek", 2), ("petani", 1)], bias=0.4,
  traits=[("infeksi_sekunder", 0.1), ("sepatu_boot", 0.6)], tl={"infeksi_sekunder": "Infeksi bakteri sekunder.", "sepatu_boot": "Sepatu tertutup/sepatu bot seharian."},
  sym=[("gatal_kulit", 1), ("kulit_bersisik", 0.8), ("nyeri_luka", 0.3), ("kulit_merah_panas", 1, T("infeksi_sekunder"))],
  cc=["gatal_kulit"], ex=["kulit_bersisik"], mis=["kutu air biasa", "kena air banjir", "alergi sepatu"], fears=["infeksi kaki", "bau kaki permanen"],
  ana={
      "onset": [("Sudah dua bulan, Dok, sela jari kaki gatal, putih basah, mengelupas, kadang perih.", "Kronik interdigital")],
      "lokasi": [("Paling parah di sela jari manis dan kelingking kaki kanan-kiri, Dok.", "Sela jari IV–V bilateral")],
      "kebiasaan": [("Kerja pakai sepatu bot seharian, kaki selalu lembap, Dok.", "Sepatu tertutup & lembap", T("sepatu_boot")),
                    ("Sering kena air banjir dan pakai sandal basah, Dok.", "Kaki lembap", NT("sepatu_boot"))],
      "keparahan": [("Sekarang punggung kakinya merah, bengkak, panas, Dok.", "Selulitis sekunder", T("infeksi_sekunder"), "kulit_merah_panas"),
                    ("Cuma gatal dan bau, Dok.", None, NT("infeksi_sekunder"))],
  },
  f=DS("Sela jari kaki IV–V kanan & kiri", "Maserasi putih, fisura, & skuama di sela jari dengan eritema, berbau")
    + [F("kerokan_koh", "hasil", KOH_DERM, diag=True), F("lampu_wood", "fluoresensi", "Tidak ada fluoresensi khas"),
       F("ekstremitas_kulit", "kulit", "Punggung kaki kanan eritema, edema, hangat", when=T("infeksi_sekunder"))],
  dd=[
      X("erisipelas", "Erisipelas/selulitis (komplikasi): plak merah panas meluas, demam — antibiotik sistemik.", ["status_dermatologis", "tanda_vital"], must=True),
      X("eritrasma", "Eritrasma interdigital: Wood merah bata, KOH negatif.", ["lampu_wood"]),
      X("dermatitis_kontak_iritan", "Dermatitis kontak (sepatu/karet): di punggung kaki area kontak, KOH negatif.", ["lokasi", "kerokan_koh"]),
  ],
  key=["Maserasi, fisura, skuama sela jari IV–V, gatal & bau", "Sepatu tertutup/lembap", "KOH positif"],
  teach=["Tinea pedis adalah pintu masuk tersering erisipelas tungkai — obati & cegah."],
  plan=dict(topics=["onset", "lokasi", "kebiasaan", "keparahan", "keluhan_lain"],
            exams=[("status_dermatologis", "kunci", "Sela jari & telapak."), ("ekstremitas_kulit", "pendukung", "Selulitis sekunder.")],
            tests=[("kerokan_koh", "kunci", "Hifa dermatofita."), ("lampu_wood", "pendukung", "Menyingkirkan eritrasma.")]),
  disp=[("rawat_jalan", "Antijamur topikal 4 minggu, kaki kering; antibiotik bila infeksi sekunder; kontrol 2–4 minggu.")],
  mg=["Krim antijamur (terbinafin/mikonazol/ketokonazol) 2 × sehari 4 minggu; bedak antijamur di kaus kaki/sepatu.",
      "Keringkan sela jari, kaus kaki katun diganti tiap hari, sepatu berventilasi/bergantian; sandal di kamar mandi umum.", "Antibiotik sistemik bila selulitis."],
  ap=["Inspeksi sela jari, KOH, Wood.", "Nilai infeksi sekunder."],
  refs=REF_KK)

# --------------------------------------------------------------------------- pitiriasis versikolor
D(id="pitiriasis_versikolor", name="Pitiriasis versikolor", aka=["Panu", "Tinea versikolor"],
  sys=SYS, prev=1.6,
  summary="Infeksi superfisial Malassezia (flora normal kulit) pada iklim panas-lembap, remaja & dewasa muda, banyak berkeringat: makula hipo-/hiperpigmentasi multipel berbatas tegas dengan skuama halus (tampak saat digores — evoked scale), di dada, punggung, leher, lengan atas; gatal ringan saat berkeringat. Lampu Wood: kuning keemasan; KOH: 'spaghetti & meatballs'. Kambuh sering; warna kulit pulih berbulan-bulan.",
  day=(30, 180), ages=[(12, 25, 4), (26, 45, 3), (46, 60, 1)], male=0.6,
  occ=[("pelajar", 2), ("mahasiswa", 2), ("ojek_online", 2), ("pekerja_proyek", 1)], bias=0.3,
  traits=[("kambuhan", 0.5)], tl={"kambuhan": "Sering kambuh."},
  sym=[("bercak_putih_kulit", 1), ("gatal_kulit", 0.4)],
  cc=["bercak_putih_kulit"], ex=["gatal_kulit"], mis=["kurap", "kurang vitamin", "kusta"], fears=["kusta", "belang permanen"],
  ana={
      "onset": [("Sudah dua bulan, Dok, ada bercak putih-putih di punggung dan dada.", "Kronik")],
      "pemberat_peringan": [("Kalau keringatan agak gatal, Dok. Habis olahraga kelihatan lebih jelas.", "Gatal ringan saat berkeringat")],
      "karakter": [("Bercaknya kalau digaruk keluar sisik halus kayak bedak, Dok. Masih terasa kalau disentuh.", "Skuama halus saat digores; sensibilitas normal")],
      "episode_sebelumnya": [("Tiap tahun kambuh, Dok, apalagi musim panas.", "Kambuh berulang", T("kambuhan")), ("Baru kali ini, Dok.", None, NT("kambuhan"))],
      "kebiasaan": [("Kerja di luar, sering keringatan, mandi sekali sehari, Dok.", "Berkeringat banyak")],
  },
  f=DS("Punggung, dada, leher", "Makula hipopigmentasi multipel berbatas tegas, sebagian konfluens, dengan skuama halus (evoked scale +)")
    + [F("lampu_wood", "fluoresensi", "Fluoresensi kuning keemasan", diag=True),
       F("kerokan_koh", "hasil", "Hifa pendek & spora bergerombol (spaghetti and meatballs)", diag=True),
       F("status_dermatologis", "sensibilitas_lesi", "Sensibilitas lesi normal")],
  dd=[
      X("kusta", "Kusta: bercak hipopigmentasi ANESTESI tanpa skuama halus, penebalan saraf.", ["status_dermatologis"], must=True),
      X("vitiligo", "Vitiligo: depigmentasi putih susu tanpa skuama, Wood putih terang (bukan kuning).", ["lampu_wood", "status_dermatologis"]),
      X("pitiriasis_alba", "Pitiriasis alba: anak atopik, wajah, batas tidak tegas, KOH negatif.", ["kerokan_koh"]),
  ],
  key=["Makula hipo/hiperpigmentasi berskuama halus di badan atas", "Wood kuning keemasan; KOH spaghetti & meatballs", "Sensibilitas normal"],
  teach=["Edukasi: setelah jamur hilang, warna kulit perlu berbulan-bulan untuk kembali normal; profilaksis sebulan sekali mencegah kambuh."],
  plan=dict(topics=["onset", "pemberat_peringan", "karakter", "episode_sebelumnya", "kebiasaan", "keluhan_lain"],
            exams=[("status_dermatologis", "kunci", "Morfologi, skuama, sensibilitas.")], tests=[("kerokan_koh", "kunci", "Malassezia."), ("lampu_wood", "pendukung", "Fluoresensi kuning keemasan.")]),
  disp=[("rawat_jalan", "Antijamur topikal (sampo/krim); oral bila luas/sering kambuh; kontrol 2–4 minggu.")],
  mg=["Sampo ketokonazol 2%/selenium sulfida 2,5% dioles ke lesi 10–15 menit lalu dibilas, setiap hari 1–2 minggu; atau krim azol.",
      "Luas/kambuhan: flukonazol 300 mg/minggu selama 2 minggu; profilaksis sebulan sekali.", "Mandi setelah berkeringat, pakaian menyerap keringat, tidak berbagi pakaian/handuk."],
  ap=["Bercak putih bersisik → Wood & KOH; uji sensibilitas (singkirkan kusta)."],
  refs=REF_KK)

# --------------------------------------------------------------------------- kandidosis kutis
D(id="kandidosis_kutis", name="Kandidosis mukokutan ringan (kandidosis kutis)", aka=["Kandidiasis kulit", "Intertrigo kandida", "Jamur lipatan", "Erosio interdigitalis"],
  sys=SYS, prev=0.9,
  summary="Infeksi Candida pada kulit lipatan (submamaria, lipat paha, aksila, sela jari tangan pekerja basah) atau mukosa ringan: eritema merah terang, basah, berbatas tegas dengan lesi SATELIT (papul-pustul di sekitarnya), maserasi, perih & gatal. Faktor: obesitas, DM, kelembapan, antibiotik, steroid, pekerjaan basah. KOH: pseudohifa & blastospora. Terapi antijamur topikal & menjaga kering.",
  day=(7, 60), ages=[(18, 39, 2), (40, 75, 4)], male=0.35,
  occ=[("ibu_rumah_tangga", 3), ("pedagang_kaki_lima", 1)], bias=0.3,
  traits=[("interdigital_tangan", 0.3), ("dm_curiga", 0.18), ("obesitas_menyertai", 0.4, NT("interdigital_tangan"))],
  tl={"interdigital_tangan": "Erosio interdigitalis blastomisetika (pekerjaan basah).", "dm_curiga": "Diabetes menyertai.", "obesitas_menyertai": "Obesitas."},
  tc={"obesitas_menyertai": "obesitas"},
  sym=[("ruam_kulit", 1), ("gatal_kulit", 0.8), ("nyeri_terbakar_kulit", 0.5)],
  cc=["ruam_kulit"], ex=["gatal_kulit"], mis=["biang keringat", "lecet", "alergi"], fears=["menular", "infeksi"],
  ana={
      "onset": [("Sudah dua minggu, Dok, kulit di lipatan merah, basah, perih dan gatal.", "Subakut", NT("interdigital_tangan")),
                ("Sudah dua minggu, Dok, sela jari tangan merah, putih basah, perih.", "Sela jari tangan", T("interdigital_tangan"))],
      "kebiasaan": [("Seharian cuci piring dan baju, tangan basah terus, Dok.", "Pekerjaan basah", T("interdigital_tangan")),
                    ("Saya gemuk, Dok, lipatan di bawah payudara selalu keringatan.", "Lipatan lembap (obesitas)", T("obesitas_menyertai")),
                    ("Sering keringatan, Dok.", None, W(nt=["interdigital_tangan", "obesitas_menyertai"]))],
      "riwayat_penyakit": [("Saya kencing manis, Dok, gulanya sering tinggi.", "DM tidak terkontrol", T("dm_curiga")), ("Belum pernah cek gula, Dok.", None, NT("dm_curiga"))],
      "riwayat_obat": [("Nggak minum antibiotik atau steroid belakangan ini, Dok.", None)],
  },
  f=DS("Lipat submamaria & lipat paha", "Eritema merah terang basah berbatas tegas dengan lesi satelit papul-pustul di sekitarnya, maserasi", when=NT("interdigital_tangan"))
    + DS("Sela jari tangan III–IV", "Maserasi putih dengan erosi dasar merah terang & tepi bersisik", when=T("interdigital_tangan"))
    + [F("kerokan_koh", "hasil", "Pseudohifa & blastospora (+)", diag=True), F("gula_darah", "gds", (210, 300), when=T("dm_curiga")),
       F("timbangan", "imt", (28, 34), when=T("obesitas_menyertai"))],
  dd=[
      X("dm_tipe2", "Kandidosis kulit luas/berulang: periksa gula darah.", ["riwayat_penyakit", "gula_darah"], must=True),
      X("tinea_kruris", "Tinea kruris: tepi aktif dengan central healing tanpa satelit, skrotum tidak terkena, KOH hifa.", ["status_dermatologis", "kerokan_koh"]),
      X("dermatitis_kontak_iritan", "Dermatitis kontak iritan: tanpa lesi satelit, KOH negatif.", ["kerokan_koh"]),
  ],
  key=["Eritema merah terang basah di lipatan dengan lesi satelit", "Faktor: obesitas, DM, pekerjaan basah", "KOH: pseudohifa & blastospora"],
  plan=dict(topics=["onset", "kebiasaan", "riwayat_penyakit", "riwayat_obat", "keluhan_lain"],
            exams=[("status_dermatologis", "kunci", "Lesi satelit & lokasi."), ("timbangan", "pendukung", "Obesitas.")],
            tests=[("kerokan_koh", "kunci", "Pseudohifa."), ("gula_darah", "pendukung", "Skrining DM.")]),
  disp=[("rawat_jalan", "Antijamur topikal 2 minggu, jaga kering, kendalikan faktor risiko; kontrol 2 minggu.")],
  mg=["Krim mikonazol/klotrimazol/nistatin 2 × sehari 2 minggu; bedak antijamur.", "Jaga lipatan kering (kain katun di lipatan), sarung tangan untuk pekerjaan basah.",
      "Flukonazol oral bila luas; kendalikan DM & berat badan."],
  ap=["Lesi lipatan basah dengan satelit → KOH; skrining DM."],
  refs=REF_KK)

# --------------------------------------------------------------------------- CLM
D(id="cutaneous_larva_migrans", name="Cutaneous larva migrans", aka=["CLM", "Creeping eruption", "Cacing tanah di kulit"],
  sys=SYS, prev=0.6,
  summary="Infestasi larva cacing tambang hewan (Ancylostoma braziliense dari kotoran anjing/kucing) yang menembus kulit saat kontak dengan pasir/tanah tercemar (pantai, kebun) tetapi tidak dapat menembus dermis: lesi linear serpiginosa (berkelok) eritematosa sedikit meninggi yang bergerak beberapa mm–cm per hari, sangat gatal, di kaki, bokong, atau tangan. Diagnosis klinis. Terapi albendazol/ivermektin.",
  day=(5, 30), ages=[(4, 9, 3), (10, 30, 3), (31, 60, 2)], male=0.55,
  traits=[("pantai", 0.5)], tl={"pantai": "Paparan pasir pantai."},
  sym=[("garis_berkelok", 1), ("gatal_kulit", 1)],
  cc=["garis_berkelok"], ex=["gatal_kulit"], mis=["digigit serangga", "alergi", "kurap"], fears=["cacing masuk ke badan"],
  ana={
      "onset": [("Seminggu lalu, Dok, muncul garis merah gatal di telapak kaki, tiap hari makin panjang berkelok.", "Lesi linear yang memanjang tiap hari")],
      "bepergian_lingkungan": [("Dua minggu lalu liburan ke pantai, jalan tanpa alas kaki di pasir, Dok.", "Kontak pasir pantai tanpa alas kaki", T("pantai")),
                               ("Main di kebun tanpa sandal, Dok, banyak kucing dan anjing di sana.", "Kontak tanah tercemar kotoran hewan", NT("pantai"))],
      "karakter": [("Gatalnya bukan main, Dok, terutama malam.", "Sangat gatal")],
      "riwayat_penyakit": [("Nggak ada diare atau sakit ulu hati, Dok, garisnya nggak muncul di dubur.", "Tanpa gejala GI/larva currens perianal")],
  },
  f=DS("Telapak & punggung kaki kanan", "Lesi eritematosa linear serpiginosa (berkelok) sedikit meninggi ± 5 cm dengan vesikel di ujung, ekskoriasi")
    + [F("darah_lengkap", "eosinofil", (5, 9), p=0.5)],
  dd=[
      X("strongiloidiasis", "Larva currens (Strongyloides): bergerak sangat cepat (cm/jam) di bokong/perianal dengan gejala GI & eosinofilia — butuh terapi sistemik & evaluasi.",
        ["riwayat_penyakit", "status_dermatologis"], must=True),
      X("reaksi_gigitan_serangga", "Gigitan serangga: papul urtikaria berkelompok, tidak berjalan.", ["status_dermatologis"]),
      X("tinea_pedis", "Tinea pedis: skuama/maserasi sela jari, KOH positif.", ["status_dermatologis"]),
  ],
  key=["Lesi linear serpiginosa yang berpindah beberapa mm–cm/hari, sangat gatal", "Kontak pasir/tanah tanpa alas kaki", "Diagnosis klinis"],
  plan=dict(topics=["onset", "bepergian_lingkungan", "karakter", "riwayat_penyakit", "keluhan_lain"], exams=[("status_dermatologis", "kunci", "Morfologi serpiginosa.")]),
  disp=[("rawat_jalan", "Albendazol 3 hari atau ivermektin dosis tunggal, antihistamin; kontrol 1 minggu.")],
  mg=["Albendazol 400 mg/hari selama 3 hari (anak ≥ 2 th) atau ivermektin 200 µg/kg dosis tunggal.", "Antihistamin oral untuk gatal; antibiotik topikal bila infeksi sekunder.",
      "Pakai alas kaki di pantai/tanah, alas saat duduk di pasir; obat cacing untuk hewan peliharaan."],
  ap=["Kenali lesi berjalan berkelok; tanyakan paparan pasir/tanah."],
  refs=REF_KK)

# --------------------------------------------------------------------------- pedikulosis kapitis
D(id="pedikulosis_kapitis", name="Pedikulosis kapitis", aka=["Kutu rambut", "Kutuan", "Head lice"],
  sys=SYS, prev=1.0,
  summary="Infestasi Pediculus humanus capitis pada kulit kepala, tersering anak perempuan usia sekolah dan penghuni asrama. Gatal kulit kepala terutama oksipital & belakang telinga; telur (nits) putih keabuan melekat erat di batang rambut dekat kulit kepala; kutu dewasa terlihat. Ekskoriasi dapat terinfeksi sekunder (impetigo) dengan KGB oksipital. Terapi permetrin 1% diulang hari ke-7–10, sisir serit, obati kontak.",
  day=(7, 60), ages=[(3, 9, 5), (10, 15, 3)], male=0.25,
  occ=[("anak_tk", 2), ("anak_sd", 3), ("pelajar_sd", 2), ("pelajar", 2)], bias=0.5,
  traits=[("infeksi_sekunder", 0.2), ("asrama", 0.3, W(amin=10))], tl={"infeksi_sekunder": "Impetiginisasi kulit kepala.", "asrama": "Tinggal di asrama/pesantren."},
  sym=[("gatal_kepala", 1), ("kutu_rambut", 0.9), ("koreng", 0.8, T("infeksi_sekunder")), ("benjolan_kgb", 0.5, T("infeksi_sekunder"))],
  cc=["gatal_kepala"], ex=["kutu_rambut"], mis=["ketombe", "kurang keramas", "alergi sampo"], fears=["menular ke kakak/adik", "harus dibotak"],
  ana={
      "onset": [("Sudah sebulan, Dok, kepalanya gatal terus, garuk-garuk terutama belakang kepala.", "Gatal kulit kepala kronik, oksipital")],
      "karakter": [("Ada telur putih-putih nempel di rambut, Dok, susah dilepas, kadang kelihatan kutunya.", "Nits melekat erat & kutu terlihat", None, "kutu_rambut")],
      "riwayat_keluarga": [("Kakaknya dan teman sekelas juga kutuan, Dok.", "Kontak serumah/sekolah"),
                           ("Di asrama banyak yang kutuan, Dok, sisir dan bantal suka dipakai bareng.", "Asrama & berbagi barang", T("asrama"))],
      "progresi": [("Kulit kepalanya sekarang luka-luka bernanah, Dok.", "Infeksi sekunder", T("infeksi_sekunder"), "koreng"), ("Cuma gatal, Dok.", None, NT("infeksi_sekunder"))],
  },
  f=[F("status_dermatologis", "lokasi", "Kulit kepala oksipital & retroaurikular"),
     F("status_dermatologis", "rambut_kuku", "Telur (nits) putih keabuan melekat erat pada batang rambut dekat kulit kepala, kutu dewasa (+)", diag=True),
     F("status_dermatologis", "efloresensi", "Ekskoriasi & papul eritematosa bekas garukan", when=NT("infeksi_sekunder")),
     F("status_dermatologis", "efloresensi", "Ekskoriasi dengan krusta kekuningan & pustul (impetiginisasi)", when=T("infeksi_sekunder")),
     F("kepala_leher", "kgb", "KGB oksipital membesar nyeri tekan", when=T("infeksi_sekunder"))],
  dd=[
      X("impetigo", "Infeksi sekunder (impetiginisasi): krusta madu & pustul — perlu antibiotik.", ["status_dermatologis"], must=True),
      X("dermatitis_seboroik", "Ketombe: skuama mudah lepas dari rambut (nits melekat erat), tanpa kutu.", ["status_dermatologis"]),
      X("tinea_kapitis", "Tinea kapitis: alopesia bersisik dengan rambut patah, KOH positif.", ["status_dermatologis"]),
  ],
  key=["Gatal kulit kepala oksipital/retroaurikular", "Nits melekat erat di batang rambut, kutu dewasa", "Kontak serumah/sekolah/asrama"],
  teach=["Permetrin tidak membunuh semua telur — ulangi pada hari ke-7–10; tidak perlu mencukur gundul."],
  plan=dict(topics=["onset", "karakter", "riwayat_keluarga", "progresi", "keluhan_lain"],
            exams=[("status_dermatologis", "kunci", "Kutu & nits, infeksi sekunder."), ("kepala_leher", "pendukung", "KGB oksipital.")]),
  disp=[("rawat_jalan", "Permetrin 1% diulang 7–10 hari, sisir serit, obati anggota keluarga; kontrol 2 minggu.")],
  mg=["Permetrin 1% losion/krim bilas di rambut kering 10 menit lalu dibilas; ulang hari ke-7–10.", "Sisir serit tiap hari setelah keramas; periksa & obati seluruh anggota keluarga serentak.",
      "Cuci sarung bantal, topi, sisir dengan air panas; jangan berbagi sisir/topi.", "Infeksi sekunder: antibiotik topikal/oral."],
  ap=["Temukan kutu/nits; nilai infeksi sekunder & kontak."],
  refs=REF_KK)

# --------------------------------------------------------------------------- pedikulosis pubis
D(id="pedikulosis_pubis", name="Pedikulosis pubis", aka=["Kutu kemaluan", "Crab louse", "Phthiriasis"],
  sys=SYS, prev=0.4,
  summary="Infestasi Phthirus pubis pada rambut pubis (juga aksila, bulu mata), ditularkan terutama melalui kontak seksual. Gatal hebat di daerah pubis, kutu & telur melekat di rambut, makula serulea (bercak kebiruan) di perut bawah/paha, bercak darah kecil di celana dalam. Termasuk IMS — skrining IMS lain, obati pasangan.",
  day=(7, 30), ages=[(18, 30, 4), (31, 50, 2)], male=0.6,
  traits=[("bulu_mata", 0.1)], tl={"bulu_mata": "Terkena bulu mata."},
  sym=[("gatal_kemaluan", 1), ("kutu_rambut", 0.8), ("risiko_ims", 0.85)],
  cc=["gatal_kemaluan"], ex=["kutu_rambut"], mis=["kurap", "biang keringat", "alergi sabun"], fears=["penyakit kelamin", "ketahuan pasangan"],
  ana={
      "onset": [("Dua minggu ini, Dok, rambut kemaluan gatal sekali, ada kutu kecil kayak ketombe yang bergerak.", "Gatal pubis dengan kutu terlihat", None, "kutu_rambut")],
      "kebiasaan": [("Sebulan lalu saya berhubungan dengan pasangan baru, Dok.", "Kontak seksual baru", None, "risiko_ims")],
      "karakter": [("Di celana dalam ada bercak darah kecil-kecil, Dok, di perut bawah ada bercak kebiruan.", "Bercak darah & makula serulea")],
      "riwayat_keluarga": [("Pasangan saya juga mengeluh gatal di bawah, Dok.", "Pasangan bergejala")],
  },
  f=[F("pemeriksaan_genital", "lesi_genital", "Kutu & telur melekat di rambut pubis, ekskoriasi; tidak ada ulkus/kutil", diag=True),
     F("status_dermatologis", "lokasi", "Rambut pubis & paha medial"), F("status_dermatologis", "efloresensi", "Ekskoriasi & makula serulea (bercak kebiruan) di perut bawah"),
     F("segmen_anterior", "silia", "Kutu & telur melekat di bulu mata", when=T("bulu_mata"))],
  dd=[
      X("hiv", "Pedikulosis pubis adalah IMS — skrining HIV & IMS lain dengan konseling.", ["tes_hiv"], must=True),
      X("skabies", "Skabies: papul & terowongan di sela jari/genital, gatal malam, keluarga ikut.", ["status_dermatologis"]),
      X("tinea_kruris", "Tinea kruris: plak bertepi aktif tanpa kutu/nits.", ["status_dermatologis"]),
  ],
  key=["Gatal pubis hebat dengan kutu & nits di rambut pubis", "Makula serulea, bercak darah di celana", "Kontak seksual"],
  plan=dict(topics=["onset", "kebiasaan", "karakter", "riwayat_keluarga", "keluhan_lain"],
            exams=[("pemeriksaan_genital", "kunci", "Kutu & nits, lesi IMS lain."), ("status_dermatologis", "pendukung", "Makula serulea, lokasi lain.")],
            tests=[("tes_hiv", "pendukung", "Skrining HIV."), ("tes_sifilis", "pendukung", "Skrining sifilis.")]),
  disp=[("rawat_jalan", "Permetrin topikal diulang 7–10 hari, obati pasangan, skrining IMS; kontrol 1–2 minggu.")],
  mg=["Permetrin 1% (atau 5%) di area pubis & berambut lain 10 menit lalu dibilas, ulang hari ke-7–10.", "Bulu mata: oleskan vaselin tebal 2 × sehari 10 hari (jangan permetrin).",
      "Obati pasangan seksual; cuci pakaian & sprei air panas.", "Skrining IMS (HIV, sifilis, gonore)."],
  ap=["Temukan kutu/nits; anamnesis seksual; skrining IMS."],
  refs=REF_KK)

# --------------------------------------------------------------------------- skabies
D(id="skabies", name="Skabies", aka=["Kudis", "Gudik", "Budukan", "Scabies"],
  sys=SYS, prev=1.6,
  summary="Infestasi tungau Sarcoptes scabiei var. hominis yang sangat menular melalui kontak kulit erat/barang. Empat tanda kardinal (diagnosis bila ≥ 2): pruritus nokturna, mengenai sekelompok orang (keluarga, pesantren, asrama), terowongan (kunikulus) di predileksi (sela jari tangan, pergelangan, siku, aksila, areola, umbilikus, genital, bokong), dan tungau ditemukan. Sering infeksi sekunder (pioderma). Terapi permetrin 5% seluruh tubuh untuk SEMUA kontak serentak.",
  day=(14, 60), ages=[(1, 9, 3), (10, 20, 4), (21, 50, 2), (51, 75, 1)], male=0.55,
  occ=[("pelajar", 3), ("anak_sd", 2), ("pelajar_sd", 2), ("balita", 1)], bias=0.4,
  traits=[("pesantren", 0.4, W(amin=10, amax=20)), ("infeksi_sekunder", 0.25)],
  tl={"pesantren": "Tinggal di pesantren/asrama.", "infeksi_sekunder": "Pioderma sekunder."},
  sym=[("gatal_malam", 1), ("gatal_kulit", 1), ("ruam_kulit", 0.8), ("bintil_bernanah", 1, T("infeksi_sekunder")), ("sulit_tidur", 0.4)],
  cc=["gatal_malam"], ex=["gatal_kulit", "ruam_kulit"], mis=["alergi", "biang keringat", "kurang mandi"], fears=["menular ke keluarga", "penyakit kulit menahun"],
  ana={
      "onset": [("Sudah tiga minggu, Dok, gatal sekali terutama malam, sampai nggak bisa tidur.", "Pruritus nokturna")],
      "lokasi": [("Paling gatal di sela jari tangan, pergelangan, ketiak, pusar, dan kemaluan, Dok.", "Predileksi khas skabies")],
      "riwayat_keluarga": [("Teman sekamar di pondok juga banyak yang gatal begini, Dok.", "Mengenai sekelompok orang (pesantren)", T("pesantren")),
                           ("Adik dan ibu saya di rumah juga gatal, Dok.", "Mengenai anggota keluarga", NT("pesantren"))],
      "kebiasaan": [("Handuk, baju, dan kasur sering dipakai bergantian, Dok.", "Berbagi barang pribadi")],
      "progresi": [("Sekarang banyak yang bernanah karena digaruk, Dok.", "Infeksi sekunder", T("infeksi_sekunder"), "bintil_bernanah"), ("Makin banyak bintilnya, Dok.", None, NT("infeksi_sekunder"))],
  },
  f=DS("Sela jari tangan, pergelangan, siku, aksila, umbilikus, genital, bokong",
       "Papul eritematosa & terowongan (kunikulus) keabuan berkelok dengan vesikel di ujungnya, ekskoriasi", when=NT("infeksi_sekunder"))
    + DS("Sela jari tangan, pergelangan, aksila, umbilikus, genital, bokong",
         "Papul & terowongan keabuan, ekskoriasi, disertai pustul & krusta (pioderma sekunder)", when=T("infeksi_sekunder"))
    + [F("kerokan_skabies", "hasil", "Ditemukan tungau Sarcoptes scabiei & telur", diag=True, p=0.5)],
  dd=[
      X("skabies_krustosa", "Skabies krustosa: krusta tebal luas pada imunokompromais/lansia, sangat menular — rujuk.", ["status_dermatologis"], must=True),
      X("dermatitis_atopik", "Dermatitis atopik: lesi fleksural kronik, riwayat atopi, tanpa terowongan & tanpa kelompok tertular.", ["riwayat_keluarga", "status_dermatologis"]),
      X("reaksi_gigitan_serangga", "Gigitan serangga: papul urtikaria di area terbuka, tanpa terowongan & predileksi khas.", ["lokasi", "status_dermatologis"]),
      X("pedikulosis_pubis", "Pedikulosis pubis: kutu & nits di rambut pubis.", ["status_dermatologis"]),
  ],
  key=["Pruritus nokturna, mengenai sekelompok orang", "Papul & terowongan di predileksi (sela jari, pergelangan, umbilikus, genital)", "Tungau/telur pada kerokan (sensitivitas rendah)"],
  teach=["Diagnosis skabies bila ≥ 2 dari 4 tanda kardinal — kerokan negatif TIDAK menyingkirkan.", "Kunci keberhasilan: semua anggota keluarga/kontak diobati SERENTAK."],
  plan=dict(topics=["onset", "lokasi", "riwayat_keluarga", "kebiasaan", "progresi", "keluhan_lain"],
            exams=[("status_dermatologis", "kunci", "Terowongan & distribusi predileksi.")], opt=[("kerokan_skabies", "Konfirmasi tungau (hasil negatif tidak menyingkirkan).")]),
  disp=[("rawat_jalan", "Permetrin 5% seluruh tubuh untuk pasien & semua kontak serentak, ulang 1 minggu; dekontaminasi barang; kontrol 2 minggu.")],
  mg=["Permetrin 5% krim dari leher ke bawah (bayi & lansia termasuk kepala) malam hari, bilas setelah 8–12 jam; ulang 1 minggu.",
      "Alternatif: salep 2-4 (sulfur 4%) 3 malam berturut-turut, benzil benzoat 25%; bayi < 2 bulan: sulfur presipitatum.",
      "Obati semua kontak serentak; cuci pakaian/sprei/handuk air panas & jemur, atau simpan dalam plastik tertutup 3 hari.",
      "Antihistamin untuk gatal (dapat bertahan 2–4 minggu); antibiotik bila pioderma."],
  ap=["Gali 4 tanda kardinal.", "Periksa predileksi; nilai pioderma; data kontak."],
  refs=REF_KK)

# --------------------------------------------------------------------------- reaksi gigitan serangga
D(id="reaksi_gigitan_serangga", name="Reaksi gigitan serangga", aka=["Gigitan serangga", "Prurigo", "Urtikaria papular", "Sengatan tawon"],
  sys=SYS, prev=1.1,
  summary="Reaksi kulit terhadap gigitan/sengatan serangga (nyamuk, kutu busuk, semut, tawon, lebah, ulat): papul-urtika gatal dengan punktum di tengah, sering berkelompok di area terbuka; pada anak dapat menjadi urtikaria papular berulang. Sengatan tawon/lebah menimbulkan bengkak lokal nyeri. Waspadai reaksi sistemik/anafilaksis. Terapi simtomatik: kompres dingin, antihistamin, steroid topikal ringan.",
  day=(1, 7), dayt=[("sengatan", (1, 1))], ages=[(1, 9, 4), (10, 30, 3), (31, 60, 2)], male=0.5,
  traits=[("sengatan", 0.3), ("infeksi_sekunder", 0.15)], tl={"sengatan": "Sengatan tawon/lebah dengan reaksi lokal besar.", "infeksi_sekunder": "Infeksi sekunder akibat garukan."},
  sym=[("bentol_gigitan", 1), ("gatal_kulit", 0.9), ("nyeri_luka", 0.8, T("sengatan")), ("koreng", 0.8, T("infeksi_sekunder"))],
  cc=["bentol_gigitan"], ex=["gatal_kulit"], mis=["alergi makanan", "biduran", "cacar"], fears=["alergi berat", "infeksi"],
  ana={
      "onset": [("Kemarin sore, Dok, habis main di kebun muncul bentol-bentol gatal di kaki dan tangan.", "Akut setelah aktivitas luar", NT("sengatan")),
                ("Tadi pagi disengat tawon di lengan, Dok, sekarang bengkak merah dan sakit.", "Sengatan tawon dengan reaksi lokal", T("sengatan"), "nyeri_luka")],
      "lokasi": [("Cuma di tangan dan kaki yang terbuka, Dok, badan nggak.", "Area tubuh terbuka")],
      "keparahan": [("Nggak sesak, nggak pusing, bibir nggak bengkak, Dok.", "Tanpa tanda reaksi sistemik/anafilaksis")],
      "riwayat_keluarga": [("Yang lain di rumah nggak gatal-gatal, Dok, gatalnya nggak terutama malam.", "Tidak mengenai kelompok (bukan skabies)")],
      "bepergian_lingkungan": [("Di kamar banyak nyamuk, Dok, kasurnya juga sudah lama.", "Paparan nyamuk/kutu busuk")],
  },
  f=DS("Lengan & tungkai (area terbuka)", "Papul-urtika eritematosa dengan punktum di tengah, berkelompok, sebagian ekskoriasi", when=NT("sengatan"))
    + DS("Lengan bawah kanan", "Edema eritematosa lokal ± 6 cm dengan punktum sengatan di tengah, hangat, nyeri tekan", when=T("sengatan"))
    + [F("status_dermatologis", "tanda_khusus", "Ekskoriasi dengan krusta kekuningan (impetiginisasi)", when=T("infeksi_sekunder"))],
  dd=[
      X("reaksi_anafilaktik", "Anafilaksis: urtikaria luas DISERTAI sesak, mengi, hipotensi, atau angioedema — adrenalin IM.", ["keparahan", "tanda_vital", "pemeriksaan_paru"], must=True),
      X("skabies", "Skabies: gatal malam, predileksi khas, terowongan, keluarga tertular.", ["riwayat_keluarga", "lokasi"]),
      X("varisela", "Varisela: vesikel menyeluruh berbagai stadium dengan demam.", ["status_dermatologis"]),
  ],
  key=["Papul-urtika gatal dengan punktum di area terbuka", "Riwayat paparan serangga", "Tanpa tanda sistemik"],
  plan=dict(topics=["onset", "lokasi", "keparahan", "riwayat_keluarga", "bepergian_lingkungan", "keluhan_lain"],
            exams=[("status_dermatologis", "kunci", "Morfologi & distribusi."), ("pemeriksaan_paru", "pendukung", "Mengi (reaksi sistemik).")]),
  disp=[("rawat_jalan", "Kompres dingin, antihistamin, steroid topikal ringan; edukasi tanda alergi berat.")],
  mg=["Lepaskan sengat lebah (kerok, jangan dipencet); cuci, kompres dingin.", "Krim kortikosteroid ringan-sedang (hidrokortison/betametason) 2 × sehari beberapa hari; antihistamin oral.",
      "Cegah garukan, potong kuku; antibiotik topikal bila infeksi sekunder.", "Pencegahan: kelambu, repelan, bersihkan kasur (kutu busuk); kembali segera bila sesak/bengkak wajah."],
  ap=["Pastikan tidak ada reaksi sistemik.", "Bedakan dari skabies & varisela."],
  refs=REF_KK)

# Rujukan maju
C("dermatitis_numularis", "Dermatitis numularis", SYS, "rendah", "Plak koin eksematosa.")
C("dermatitis_atopik", "Dermatitis atopik", SYS, "rendah", "Eksim atopik kronik.")
