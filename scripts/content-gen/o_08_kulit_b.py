"""Kunci OSCE — kulit B: dermatofitosis, jamur superfisial, parasit, gigitan serangga (15)."""
from osce_lib import (ADULT, AND, ANTIHISTAMIN, AV, CASE, CHILD, E, IT, NP, NT, O, PPK, T, W)

REF = [PPK, "PERDOSKI. Panduan Praktik Klinis Dermatologi dan Venereologi (2021)"]
JAMUR = "Kulit — infeksi jamur"
PARASIT = "Kulit — gatal & parasit"

AZOL = [O("mikonazol_krim", "Mikonazol 2% krim 2 × sehari selama 2–4 minggu (lanjut 1–2 minggu setelah sembuh)", 1, "rutin", (2, 2), (14, 42)),
        O("ketokonazol_krim", "Ketokonazol 2% krim 1–2 × sehari selama 2–4 minggu", 1, "rutin", (1, 2), (14, 42)),
        O("klotrimazol_krim", "Klotrimazol 1% krim 2 × sehari selama 2–4 minggu", 1, "rutin", (2, 2), (14, 42)),
        O("terbinafin_krim", "Terbinafin 1% krim 1–2 × sehari selama 1–2 minggu", 1, "rutin", (1, 2), (7, 28))]
ORAL_DEWASA = [O("terbinafin", "Terbinafin 1 × 250 mg selama 2–4 minggu", 250, "rutin", (1, 1), (14, 42)),
               O("griseofulvin", "Griseofulvin 500–1000 mg/hari sesudah makan berlemak selama 2–4 minggu", (500, 1000), "rutin", (1, 2), (14, 42), forms="griseofulvin-tab500")]
GRISEO_ANAK = O("griseofulvin", "Griseofulvin 10–25 mg/kgBB/kali 1–2 × sehari (20–25 mg/kgBB/hari) sesudah makan berlemak", None, "rutin", (1, 2), (14, 56),
                forms="griseofulvin-tab125", perkg=(10, 25))
NO_STEROID_TOP = AV("Kortikosteroid topikal memperberat & menyamarkan infeksi jamur (tinea inkognito).", classes=["kortikosteroid_topikal"])
NO_KETO_ORAL = AV("Ketokonazol oral hepatotoksik — tidak untuk infeksi jamur kulit.", drugs=["ketokonazol_tab"])
NP_KERING = NP("kering", "Jaga kulit tetap kering; pakaian menyerap keringat; handuk tidak dipakai bersama")
NP_KRIM_CAMPUR = NP("krim_campur", "Pakai krim campuran steroid-antijamur-antibiotik yang dijual bebas", "berbahaya", "Steroid memperberat infeksi jamur & atrofi kulit.")
E_STOP_DINI = E("stop_dini", "Hentikan obat jamur begitu gatal hilang", "pengobatan", "berbahaya", "Jamur belum tuntas → kambuh.")


def jamur_edu(dx, durasi="2–4 minggu, lanjutkan 1–2 minggu setelah kulit tampak sembuh", extra=None):
    return [E("dx", dx, "diagnosis"),
            E("obat", f"Obat dipakai teratur {durasi}", "pengobatan"),
            E("bahaya", "Kembali bila meluas, bernanah/bengkak merah nyeri, demam, atau tidak membaik setelah 2 minggu", "tanda_bahaya"),
            E("kontrol", "Kontrol 2 minggu", "kontrol"),
            E("cegah", "Keringkan badan setelah mandi & jangan berbagi handuk/pakaian", "pencegahan"),
            *(extra or []), E_STOP_DINI]


CASE("tinea_kapitis", JAMUR,
     [IT("griseofulvin", "Antijamur oral", "utama", "Tinea kapitis wajib antijamur oral (topikal tidak menembus folikel).", [dict(GRISEO_ANAK, days=[42, 56],
         label="Griseofulvin 20–25 mg/kgBB/hari sesudah makan berlemak selama 6–8 minggu")]),
      IT("sampo", "Sampo antijamur", "opsional", "Mengurangi penularan spora.",
         [O("ketokonazol_sampo", "Sampo ketokonazol 2% 2–3 × seminggu", 1, "rutin", (1, 1), (14, 56)), O("selenium_sulfida", "Sampo selenium sulfida 2–3 × seminggu", 1, "rutin", (1, 1), (14, 56))]),
      IT("kerion", "Kortikosteroid oral singkat", "opsional", "Kerion (pertimbangkan rujuk).", [O("prednison", "Prednison 1 mg/kgBB/hari selama 1–2 minggu", (10, 20), "rutin", (1, 1), (7, 14))], T("kerion"))],
     [NP("sisir", "Sisir, topi, & bantal tidak dipakai bersama; obati anggota keluarga/hewan peliharaan"),
      NP("sekolah", "Boleh tetap sekolah setelah terapi dimulai"),
      NP("insisi", "Jangan insisi kerion", when=T("kerion")),
      NP("kucing", "Bawa kucing peliharaan ke dokter hewan", when=T("kontak_kucing")),
      NP("cukur_bakar", "Cukur gundul lalu oles minyak tanah", "berbahaya", "Iritasi & luka bakar kimia.")],
     jamur_edu("Ini tinea kapitis: infeksi jamur kulit kepala & rambut", "6–8 minggu sesudah makan (berlemak) tanpa putus",
               [E("es", "Griseofulvin dapat menyebabkan sakit kepala/mual & kulit sensitif cahaya", "efek_samping")]),
     avoid=[NO_STEROID_TOP, NO_KETO_ORAL], refs=REF)

CASE("tinea_barbae", JAMUR,
     [IT("oral", "Antijamur oral", "utama", "Infeksi folikel janggut/kumis.", [dict(o, days=[28, 42]) for o in ORAL_DEWASA]),
      IT("topikal", "Antijamur topikal", "opsional", "Terapi tambahan.", AZOL)],
     [NP("cukur", "Hindari mencukur selama terapi"), NP("kompres", "Kompres bila banyak pus"),
      NP("ternak", "Obati/periksakan hewan ternak sumber penularan", when=T("ternak")), NP_KRIM_CAMPUR],
     jamur_edu("Ini tinea barbae: infeksi jamur di area janggut", "4–6 minggu tanpa putus"),
     avoid=[NO_STEROID_TOP, NO_KETO_ORAL], refs=REF)

CASE("tinea_fasialis", JAMUR,
     [IT("topikal", "Antijamur topikal", "utama", "Tinea fasialis.", AZOL)],
     [NP("stop_steroid", "Hentikan krim steroid", when=T("steroid_topikal")), NP("tabir", "Gunakan tabir surya"), NP_KERING, NP_KRIM_CAMPUR],
     jamur_edu("Ini infeksi jamur kulit wajah (tinea fasialis)"),
     avoid=[NO_STEROID_TOP, NO_KETO_ORAL], refs=REF)

CASE("tinea_korporis", JAMUR,
     [IT("topikal", "Antijamur topikal", "utama", "Tinea korporis terbatas.", AZOL, NT("luas")),
      IT("oral", "Antijamur oral", "utama", "Lesi luas.", ORAL_DEWASA, AND(T("luas"), ADULT)),
      IT("oral_anak", "Antijamur oral (anak)", "utama", "Lesi luas.", [GRISEO_ANAK], AND(T("luas"), CHILD)),
      IT("topikal_luas", "Antijamur topikal tambahan", "opsional", "Tambahan pada lesi luas.", AZOL, T("luas"))],
     [NP_KERING, NP("keluarga", "Periksa & obati anggota keluarga/hewan yang tertular", when=T("kontak_serumah")),
      NP("pakaian", "Pakaian longgar menyerap keringat, ganti bila basah"), NP_KRIM_CAMPUR],
     jamur_edu("Ini kurap (tinea korporis): infeksi jamur di kulit badan"),
     avoid=[NO_STEROID_TOP, NO_KETO_ORAL], refs=REF)

CASE("tinea_manus", JAMUR,
     [IT("oral", "Antijamur oral", "utama", "Tinea manus (kulit telapak tebal).", ORAL_DEWASA),
      IT("topikal", "Antijamur topikal", "opsional", "Terapi tambahan.", AZOL),
      IT("pedis", "Antijamur topikal kaki", "pendukung", "Obati tinea pedis sekaligus.", AZOL, T("tinea_pedis_menyertai"))],
     [NP("sarung_tangan", "Sarung tangan untuk pekerjaan basah; keringkan tangan"),
      NP("keratolitik", "Keratolitik/urea untuk kulit tebal bersisik"), NP_KRIM_CAMPUR],
     jamur_edu("Ini infeksi jamur kulit telapak tangan (tinea manus)"),
     avoid=[NO_STEROID_TOP, NO_KETO_ORAL], refs=REF)

CASE("tinea_unguium", JAMUR,
     [IT("oral", "Antijamur oral", "utama", "Onikomikosis: terapi sistemik jangka panjang.",
         [O("terbinafin", "Terbinafin 1 × 250 mg selama 12 minggu (kuku kaki) / 6 minggu (kuku tangan)", 250, "rutin", (1, 1), (42, 84)),
          O("itrakonazol", "Itrakonazol 2 × 200 mg selama 7 hari/bulan (terapi denyut) 2–3 siklus", 200, "rutin", (2, 2), (7, 7), forms="itrakonazol-kap100")]),
      IT("pedis", "Antijamur topikal kaki", "pendukung", "Obati tinea pedis sekaligus.", AZOL, T("tinea_pedis_menyertai"))],
     [NP("kuku", "Potong & kikir kuku pendek, kaki kering, sepatu berventilasi"),
      NP("gula", "Periksa & kendalikan gula darah", when=T("dm_curiga")),
      NP("cabut", "Cabut paksa kuku yang rusak di rumah", "berbahaya", "Perdarahan & infeksi.")],
     jamur_edu("Ini infeksi jamur kuku (tinea unguium/onikomikosis)", "selama 6–12 minggu; kuku baru tumbuh sehat dalam beberapa bulan",
               [E("es", "Laporkan mual hebat, kulit/mata kuning, atau gangguan pengecapan (cek fungsi hati)", "efek_samping")]),
     avoid=[NO_STEROID_TOP, NO_KETO_ORAL], refs=REF)

CASE("tinea_kruris", JAMUR,
     [IT("topikal", "Antijamur topikal", "utama", "Tinea kruris.", AZOL),
      IT("pedis", "Antijamur topikal kaki", "pendukung", "Obati tinea pedis sekaligus.", AZOL, T("tinea_pedis_menyertai"))],
     [NP("katun", "Celana dalam katun longgar, ganti bila lembap; keringkan setelah mandi"),
      NP("kaus_kaki", "Pakai kaus kaki dulu sebelum celana dalam", when=T("tinea_pedis_menyertai")),
      NP("bb", "Turunkan berat badan", when=T("obesitas_menyertai")), NP_KRIM_CAMPUR],
     jamur_edu("Ini infeksi jamur di lipat paha (tinea kruris/selangkangan)"),
     avoid=[NO_STEROID_TOP, NO_KETO_ORAL], refs=REF)

CASE("tinea_pedis", JAMUR,
     [IT("topikal", "Antijamur topikal", "utama", "Tinea pedis.", [dict(o, days=[28, 42]) for o in AZOL[:3]] + [AZOL[3]]),
      IT("ab_oral", "Antibiotik sistemik", "utama", "Infeksi bakteri sekunder.",
         [O("dikloksasilin", "Dikloksasilin 4 × 500 mg selama 7 hari", 500, "rutin", (4, 4), (7, 10)),
          O("sefadroksil", "Sefadroksil 2 × 500 mg selama 7 hari", 500, "rutin", (2, 2), (7, 10), forms="sefadroksil-kap500"),
          O("klindamisin", "Klindamisin 3 × 300 mg selama 7 hari", 300, "rutin", (3, 3), (7, 10), forms="klindamisin-kap300")], T("infeksi_sekunder"))],
     [NP("sela_jari", "Keringkan sela jari setelah mandi; kaus kaki katun diganti tiap hari"),
      NP("sepatu", "Sepatu berventilasi/bergantian; sandal di kamar mandi umum"),
      NP("bot", "Lepas sepatu bot saat istirahat & keringkan kaki", when=T("sepatu_boot")),
      NP_KRIM_CAMPUR],
     jamur_edu("Ini kutu air (tinea pedis): infeksi jamur di sela jari & telapak kaki", "minimal 4 minggu"),
     avoid=[NO_STEROID_TOP, NO_KETO_ORAL], refs=REF)

CASE("pitiriasis_versikolor", JAMUR,
     [IT("topikal", "Antijamur topikal", "utama", "Malassezia.",
         [O("ketokonazol_sampo", "Sampo ketokonazol 2% dioles ke lesi 10–15 menit lalu dibilas, setiap hari 1–2 minggu", 1, "rutin", (1, 1), (7, 14)),
          O("selenium_sulfida", "Selenium sulfida dioles ke lesi 10–15 menit lalu dibilas, setiap hari 1–2 minggu", 1, "rutin", (1, 1), (7, 14)),
          *AZOL[:3]]),
      IT("profilaksis", "Antijamur oral", "opsional", "Luas/sering kambuh.", [O("flukonazol", "Flukonazol 300 mg dosis tunggal per minggu × 2 minggu", 300, "tunggal", forms="flukonazol-kap150")],
         T("kambuhan"))],
     [NP("mandi", "Mandi setelah berkeringat; pakaian menyerap keringat"),
      NP("berbagi", "Tidak berbagi pakaian/handuk"),
      NP("bercak", "Bercak putih memerlukan waktu berbulan-bulan untuk kembali normal"),
      NP("cuka", "Gosok panu dengan cuka/lengkuas sampai lecet", "berbahaya", "Iritasi & luka kulit.")],
     jamur_edu("Ini panu (pitiriasis versikolor): infeksi jamur ragi pada kulit", "1–2 minggu; warna kulit pulih bertahap dalam beberapa bulan",
               [E("profilaksis", "Pemakaian sampo antijamur sebulan sekali dapat mencegah kambuh", "pencegahan", when=T("kambuhan"))]),
     avoid=[NO_STEROID_TOP, NO_KETO_ORAL], refs=REF)

CASE("kandidosis_kutis", JAMUR,
     [IT("topikal", "Antijamur topikal", "utama", "Kandidosis kutis.", AZOL[:3])],
     [NP("kering", "Jaga lipatan tetap kering (kain katun di lipatan)"),
      NP("sarung", "Sarung tangan untuk pekerjaan basah", when=T("interdigital_tangan")),
      NP("dm", "Kendalikan gula darah & berat badan", whenAny=[T("dm_curiga"), T("obesitas_menyertai")]), NP_KRIM_CAMPUR],
     jamur_edu("Ini infeksi jamur Candida di lipatan kulit", "2 minggu, lanjutkan 1 minggu setelah sembuh"),
     avoid=[NO_STEROID_TOP, NO_KETO_ORAL], refs=REF)

CASE("cutaneous_larva_migrans", PARASIT,
     [IT("antelmintik", "Antelmintik", "utama", "Membunuh larva cacing tambang hewan.",
         [O("albendazol", "Albendazol 400 mg 1 × sehari selama 3 hari", 400, "rutin", (1, 1), (3, 3), forms="albendazol-tab400"),
          O("ivermektin", "Ivermektin 200 mcg/kgBB dosis tunggal", None, "tunggal", forms="ivermektin-tab3", perkg=(0.17, 0.25))]),
      *[dict(i, role="opsional") for i in ANTIHISTAMIN(reason="Gatal.")]],
     [NP("alas", "Pakai alas kaki di pantai/tanah & alas saat duduk di pasir"),
      NP("hewan", "Beri obat cacing untuk anjing/kucing peliharaan"),
      NP("garuk", "Potong kuku & jangan digaruk"),
      NP("es_bakar", "Bakar/sundut jalur larva dengan rokok/es batu kering", "berbahaya", "Luka bakar; larva berada di depan jalur.")],
     [E("dx", "Ini creeping eruption: larva cacing tambang hewan yang berjalan di kulit", "diagnosis"),
      E("obat", "Obat cacing diminum sesuai dosis; gatal berkurang dalam beberapa hari", "pengobatan"),
      E("bahaya", "Kembali bila bernanah, kemerahan meluas, demam, atau batuk/sesak", "tanda_bahaya"),
      E("kontrol", "Kontrol 1 minggu", "kontrol"),
      E("cegah", "Gunakan alas kaki di pantai & tanah lembap", "pencegahan"),
      E("menular", "Penyakit ini menular ke keluarga lewat sentuhan", "diagnosis", "pengecoh", "Tidak menular antarmanusia.")],
     avoid=[NO_STEROID_TOP], refs=REF)

PERMETRIN1 = O("permetrin_losion", "Permetrin 1% dioles di rambut kering 10 menit lalu dibilas; ulang hari ke-7–10", 1, "tunggal")
CASE("pedikulosis_kapitis", PARASIT,
     [IT("pedikulisida", "Pedikulisida", "utama", "Membunuh kutu kepala.", [PERMETRIN1]),
      IT("ab_topikal", "Antibiotik topikal", "pendukung", "Impetiginisasi kulit kepala.",
         [O("mupirosin", "Mupirosin 2% salep 3 × sehari selama 7 hari", 1, "rutin", (2, 3), (7, 10)), O("asam_fusidat", "Asam fusidat 2% krim 3 × sehari selama 7 hari", 1, "rutin", (2, 3), (7, 10))],
         T("infeksi_sekunder"))],
     [NP("serit", "Sisir serit tiap hari setelah keramas"),
      NP("keluarga", "Periksa & obati seluruh anggota keluarga/teman sekamar serentak"),
      NP("cuci", "Cuci sarung bantal, topi, & sisir dengan air panas; jangan berbagi"),
      NP("minyak_tanah", "Siram rambut dengan minyak tanah/insektisida semprot", "berbahaya", "Luka bakar kimia, keracunan, & risiko terbakar.")],
     [E("dx", "Ini kutu rambut (pedikulosis kapitis)", "diagnosis"),
      E("obat", "Obat dioles sesuai petunjuk lalu dibilas; ulangi seminggu kemudian untuk membunuh kutu yang baru menetas", "pengobatan"),
      E("bahaya", "Kembali bila kulit kepala bernanah, bengkak kelenjar leher, atau demam", "tanda_bahaya"),
      E("kontrol", "Kontrol 1–2 minggu (periksa telur hidup)", "kontrol"),
      E("cegah", "Jangan berbagi sisir, topi, atau bantal", "pencegahan"),
      E("kotor", "Kutu rambut hanya menyerang anak yang jarang mandi", "diagnosis", "pengecoh", "Menular lewat kontak kepala, tidak terkait kebersihan semata.")],
     kie=["diagnosis", "pengobatan", "tanda_bahaya", "kontrol", "pencegahan"], refs=REF)

CASE("pedikulosis_pubis", PARASIT,
     [IT("pedikulisida", "Pedikulisida", "utama", "Kutu kemaluan.",
         [dict(PERMETRIN1, label="Permetrin 1% di area pubis & berambut lain 10 menit lalu dibilas; ulang hari ke-7–10"),
          O("permetrin_krim", "Permetrin 5% krim di area pubis 8–12 jam lalu dibilas; ulang hari ke-7–10", 1, "tunggal")]),
      IT("bulu_mata", "Oklusif bulu mata", "utama", "Kutu di bulu mata (jangan permetrin).",
         [O("emolien", "Vaselin album dioles tebal di tepi kelopak 2 × sehari selama 10 hari", 1, "rutin", (2, 2), (10, 10), forms="vaselin")], T("bulu_mata"))],
     [NP("pasangan", "Obati pasangan seksual"), NP("cuci", "Cuci pakaian & sprei dengan air panas"),
      NP("ims", "Skrining IMS (HIV, sifilis, gonore)"),
      NP("cukur_bakar", "Bakar rambut kemaluan/oles minyak tanah", "berbahaya", "Luka bakar.")],
     [E("dx", "Ini kutu kemaluan (pedikulosis pubis), umumnya menular lewat hubungan seksual", "diagnosis"),
      E("obat", "Obat dioles sesuai petunjuk & diulang seminggu kemudian; pasangan juga diobati", "pengobatan"),
      E("bahaya", "Kembali bila kulit bernanah, ada luka/keputihan di kelamin, atau mata merah", "tanda_bahaya"),
      E("kontrol", "Kontrol 1–2 minggu", "kontrol"),
      E("cegah", "Setia pada pasangan & gunakan kondom; skrining IMS", "pencegahan"),
      E("toilet", "Tertular karena duduk di toilet umum", "diagnosis", "pengecoh", "Penularan utama kontak tubuh/seksual.")],
     kie=["diagnosis", "pengobatan", "tanda_bahaya", "kontrol", "pencegahan"], refs=REF + ["Kemenkes RI. Pedoman Nasional Penanganan IMS (2016)"])

CASE("skabies", PARASIT,
     [IT("skabisida", "Skabisida", "utama", "Membunuh tungau Sarcoptes; ulang 1 minggu.",
         [O("permetrin_krim", "Permetrin 5% krim dari leher ke bawah malam hari, bilas setelah 8–12 jam; ulang 1 minggu", 1, "tunggal")]),
      *[dict(i, role="pendukung") for i in ANTIHISTAMIN(reason="Gatal (dapat bertahan 2–4 minggu setelah terapi).")],
      IT("ab_topikal", "Antibiotik topikal", "utama", "Pioderma sekunder.",
         [O("mupirosin", "Mupirosin 2% salep 3 × sehari selama 7 hari", 1, "rutin", (2, 3), (7, 10)), O("asam_fusidat", "Asam fusidat 2% krim 3 × sehari selama 7 hari", 1, "rutin", (2, 3), (7, 10))],
         T("infeksi_sekunder"))],
     [NP("kontak", "Obati semua anggota keluarga/teman sekamar serentak walau tidak gatal"),
      NP("cuci", "Cuci pakaian, sprei, & handuk air panas lalu jemur, atau simpan dalam plastik tertutup 3 hari"),
      NP("pesantren", "Koordinasi pengobatan massal di pesantren/asrama", when=T("pesantren")),
      NP("garuk", "Potong kuku & hindari garukan"),
      NP("air_garam", "Mandi air garam/belerang panas sampai kulit melepuh", "berbahaya", "Luka bakar & iritasi.")],
     [E("dx", "Ini kudis (skabies), disebabkan tungau yang menular lewat kontak erat", "diagnosis"),
      E("obat", "Krim dioles malam hari ke seluruh tubuh dari leher ke bawah, dibilas pagi; ulangi seminggu kemudian", "pengobatan"),
      E("bahaya", "Kembali bila kulit bernanah luas, demam, atau bengkak/kencing seperti teh", "tanda_bahaya"),
      E("kontrol", "Kontrol 1–2 minggu; gatal bisa bertahan 2–4 minggu walau tungau sudah mati", "kontrol"),
      E("cegah", "Semua kontak diobati bersamaan agar tidak saling menulari", "pencegahan"),
      E("sekali", "Cukup diobati penderita yang gatal saja", "pengobatan", "pengecoh", "Kontak tanpa gejala menjadi sumber reinfeksi.")],
     avoid=[NO_STEROID_TOP], kie=["diagnosis", "pengobatan", "tanda_bahaya", "kontrol", "pencegahan"], refs=REF)

CASE("reaksi_gigitan_serangga", PARASIT,
     [IT("steroid_top", "Kortikosteroid topikal", "utama", "Reaksi inflamasi lokal.",
         [O("hidrokortison_krim", "Hidrokortison 1–2,5% krim 2 × sehari selama 5–7 hari", 1, "rutin", (2, 2), (5, 7)),
          O("betametason_krim", "Betametason 0,1% krim 2 × sehari selama 5–7 hari (lesi tebal, bukan wajah)", 1, "rutin", (2, 2), (5, 7))], NT("infeksi_sekunder")),
      *ANTIHISTAMIN(reason="Gatal."),
      IT("ab_topikal", "Antibiotik topikal", "utama", "Infeksi sekunder akibat garukan.",
         [O("mupirosin", "Mupirosin 2% salep 3 × sehari selama 7 hari", 1, "rutin", (2, 3), (7, 10)), O("asam_fusidat", "Asam fusidat 2% krim 3 × sehari selama 7 hari", 1, "rutin", (2, 3), (7, 10))],
         T("infeksi_sekunder"))],
     [NP("sengat", "Lepaskan sengat dengan mengerok (jangan dipencet)", when=T("sengatan")),
      NP("kompres", "Cuci & kompres dingin"),
      NP("cegah", "Kelambu, repelan, bersihkan kasur (kutu busuk)"),
      NP("garuk", "Potong kuku & hindari garukan"),
      NP("minyak_tanah", "Oleskan minyak tanah/odol pada bentol", "berbahaya", "Iritasi & luka bakar kimia.")],
     [E("dx", "Ini reaksi kulit akibat gigitan/sengatan serangga", "diagnosis"),
      E("obat", "Krim dioles tipis 2 × sehari beberapa hari; obat gatal bila perlu", "pengobatan"),
      E("bahaya", "Segera ke IGD bila sesak, bengkak bibir/wajah, pusing/pingsan setelah gigitan/sengatan", "tanda_bahaya"),
      E("kontrol", "Kontrol bila tidak membaik 1 minggu atau bernanah", "kontrol"),
      E("racun_hisap", "Isap racun sengatan dengan mulut", "pengobatan", "berbahaya", "Tidak efektif & berisiko infeksi.")],
     refs=REF)
