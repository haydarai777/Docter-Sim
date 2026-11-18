"""Kunci OSCE — MATA (13)."""
from osce_lib import AV, CASE, E, IT, NP, NT, O, PPK, T, TOPIKAL, W, ANALGESIK

REF = [PPK, "PERDAMI. Panduan Praktik Klinis Oftalmologi"]
MERAH = "Mata — mata merah"
KELOPAK = "Mata — kelopak mata"
VISUS = "Mata — gangguan penglihatan"

AB_TETES = [O("kloramfenikol_tm", "Kloramfenikol 0,5% tetes mata 1 tetes 4–6 × sehari selama 5–7 hari", 1, "rutin", (4, 6), (5, 7)),
            O("gentamisin_tm", "Gentamisin 0,3% tetes mata 1 tetes 4–6 × sehari selama 5–7 hari", 1, "rutin", (4, 6), (5, 7)),
            O("levofloksasin_tm", "Levofloksasin 0,5% tetes mata 1 tetes 4–6 × sehari selama 5–7 hari", 1, "rutin", (4, 6), (5, 7))]
AB_SALEP = [O("kloramfenikol_sm", "Kloramfenikol 1% salep mata 3 × sehari selama 5–7 hari", 1, "rutin", (2, 4), (5, 14))] + AB_TETES
AIR_MATA = O("air_mata_buatan", "Air mata buatan 1 tetes 4–6 × sehari", 1, "rutin", (4, 6), (7, 30))
STEROID_MATA = AV("Steroid tetes mata tanpa pemeriksaan slit lamp berisiko keratitis herpes, glaukoma & katarak.", groups=["steroid_mata"])
E_TETES_ORANG = E("tetes_sisa", "Boleh memakai tetes mata sisa milik keluarga", "pengobatan", "berbahaya", "Obat bisa terkontaminasi/tidak sesuai (mis. steroid).")
NP_HERBAL = NP("herbal", "Teteskan air sirih/ASI/obat herbal ke mata", "berbahaya", "Iritasi & infeksi kornea.")

CASE("benda_asing_konjungtiva", MERAH,
     [IT("ab_topikal", "Antibiotik topikal mata", "utama", "Mencegah infeksi setelah pengangkatan benda asing/abrasi.", AB_SALEP)],
     [NP("angkat", "Ekstraksi benda asing setelah anestesi topikal & irigasi NaCl 0,9% (eversi kelopak bila di tarsal)"),
      NP("ucek", "Jangan mengucek mata"),
      NP("pelindung", "Pakai kacamata pelindung saat menggerinda/memalu"),
      NP("bekal_anestesi", "Bekali tetes anestesi (pantokain) untuk dipakai di rumah bila perih", "berbahaya", "Menghambat penyembuhan epitel & menutupi keluhan → ulkus kornea."),
      NP_HERBAL],
     [E("dx", "Ada benda asing kecil di selaput mata yang sudah diangkat", "diagnosis"),
      E("obat", "Gunakan salep/tetes antibiotik sesuai aturan sampai habis", "pengobatan"),
      E("bahaya", "Segera kembali bila penglihatan kabur, nyeri makin hebat, atau mata makin merah bernanah", "tanda_bahaya"),
      E("kontrol", "Kontrol 1–2 hari untuk menilai penyembuhan kornea", "kontrol"),
      E("cegah", "Selalu pakai kacamata pelindung saat bekerja", "pencegahan"),
      E_TETES_ORANG],
     avoid=[STEROID_MATA], refs=REF)

CASE("konjungtivitis", MERAH,
     [IT("ab_tetes", "Antibiotik tetes mata", "utama", "Konjungtivitis bakteri (sekret mukopurulen).", AB_TETES, T("bakteri")),
      IT("antialergi", "Antihistamin/stabilisator sel mast tetes mata", "utama", "Konjungtivitis alergi.",
         [O("olopatadin_tm", "Olopatadin 0,1% tetes mata 1 tetes 2 × sehari selama 7–14 hari", 1, "rutin", (2, 2), (7, 14))], T("alergi")),
      IT("pelumas", "Air mata buatan", "utama", "Konjungtivitis virus: suportif (swasirna).", [AIR_MATA], T("virus"))],
     [NP("kompres", "Kompres dingin pada kelopak mata"),
      NP("higiene", "Cuci tangan sering, handuk & sarung bantal terpisah", when=NT("alergi")),
      NP("libur", "Tidak masuk sekolah/kerja sampai mata tidak merah berair (sangat menular)", when=T("virus")),
      NP("alergen", "Hindari pencetus alergi (debu, bulu hewan) dan jangan mengucek", when=T("alergi")),
      NP("kacamata_hitam", "Pakai kacamata hitam agar tidak menular lewat pandangan", "pengecoh", "Penularan lewat kontak tangan/benda, bukan pandangan."),
      NP_HERBAL],
     [E("dx", "Ini radang selaput bening mata (konjungtivitis); penyebabnya dinilai dari gejala", "diagnosis"),
      E("obat", "Gunakan obat tetes sesuai aturan; jangan berbagi obat tetes", "pengobatan"),
      E("bahaya", "Segera kembali bila penglihatan kabur, silau, atau nyeri hebat", "tanda_bahaya"),
      E("kontrol", "Kontrol bila tidak membaik dalam 5–7 hari", "kontrol"),
      E("cegah", "Penyakit ini mudah menular lewat tangan dan handuk", "pencegahan", when=NT("alergi")),
      E_TETES_ORANG],
     avoid=[STEROID_MATA, AV("Antibiotik tetes tidak diperlukan pada konjungtivitis virus/alergi.", drugs=["kloramfenikol_tm", "gentamisin_tm", "levofloksasin_tm", "kloramfenikol_sm"], when=NT("bakteri"))],
     refs=REF)

CASE("perdarahan_subkonjungtiva", MERAH, [],
     [NP("kompres", "Kompres dingin 24 jam pertama, lalu kompres hangat"),
      NP("tensi", "Periksa & kendalikan tekanan darah"),
      NP("antikoag", "Tinjau obat pengencer darah bersama dokter yang meresepkan (jangan dihentikan sendiri)", when=T("antikoagulan")),
      NP("ab_tetes", "Beri tetes mata antibiotik agar merahnya cepat hilang", "pengecoh", "Tidak ada infeksi; darah diserap sendiri."),
      NP("stop_obat", "Hentikan sendiri obat pengencer darah", "berbahaya", "Risiko stroke/trombosis.")],
     [E("dx", "Pembuluh darah kecil di selaput mata pecah; tidak mengganggu penglihatan", "diagnosis"),
      E("obat", "Tidak perlu obat; akan hilang sendiri dalam 1–3 minggu dan warnanya berubah kekuningan", "pengobatan"),
      E("bahaya", "Segera kembali bila penglihatan kabur, nyeri, atau muncul perdarahan di tempat lain", "tanda_bahaya"),
      E("kontrol", "Kontrol 2 minggu atau bila berulang", "kontrol"),
      E("menular", "Hindari bertemu orang karena mata merah ini menular", "pencegahan", "pengecoh", "Tidak menular.")],
     avoid=[STEROID_MATA], note="Tidak memerlukan obat (swasirna). Air mata buatan hanya bila terasa mengganjal; atasi hipertensi bila ada.", refs=REF)

CASE("mata_kering", MERAH,
     [IT("pelumas", "Air mata buatan", "utama", "Menggantikan lapisan air mata.", [AIR_MATA])],
     [NP("2020", "Istirahatkan mata (aturan 20-20-20) & sering berkedip saat menatap layar"),
      NP("ac", "Hindari hembusan AC/kipas langsung ke mata; cukup minum"),
      NP("kompres", "Kompres hangat kelopak bila disertai blefaritis"),
      NP("vasokon", "Pakai tetes mata 'penghilang merah' (vasokonstriktor) setiap hari", "berbahaya", "Rebound hiperemia & memperparah mata kering."),
      NP_HERBAL],
     [E("dx", "Mata kering karena produksi/kualitas air mata berkurang", "diagnosis"),
      E("obat", "Air mata buatan dipakai rutin, boleh lebih sering bila perlu", "pengobatan"),
      E("bahaya", "Segera kembali bila penglihatan kabur, nyeri hebat, atau silau", "tanda_bahaya"),
      E("kontrol", "Kontrol 2–4 minggu untuk menilai respons", "kontrol"),
      E("sembuh_sekali", "Cukup ditetes beberapa hari lalu sembuh total", "pengobatan", "pengecoh", "Kondisi kronik; perlu kebiasaan & pelumas jangka panjang.")],
     avoid=[STEROID_MATA], refs=REF)

CASE("blefaritis", KELOPAK,
     [IT("ab_salep", "Salep antibiotik tepi kelopak", "utama", "Mengurangi kolonisasi stafilokokus di tepi kelopak.",
         [O("kloramfenikol_sm", "Kloramfenikol 1% salep mata dioles di tepi kelopak 2–3 × sehari selama 1–2 minggu", 1, "rutin", (2, 3), (7, 14))])],
     [NP("kompres", "Kompres hangat 5–10 menit lalu bersihkan tepi kelopak dengan sampo bayi encer 2 × sehari"),
      NP("ketombe", "Atasi ketombe dengan sampo antiketombe", when=T("seboroik")),
      NP("kosmetik", "Hindari maskara/eyeliner selama peradangan"),
      NP("cabut", "Cabuti bulu mata agar kelopak bersih", "berbahaya", "Trauma folikel & trikiasis.")],
     [E("dx", "Radang menahun pada tepi kelopak mata", "diagnosis"),
      E("obat", "Kebersihan kelopak adalah pengobatan utama; salep dioles tipis di tepi kelopak", "pengobatan"),
      E("bahaya", "Segera kembali bila penglihatan kabur atau mata sangat merah dan nyeri", "tanda_bahaya"),
      E("kontrol", "Kontrol 2 minggu; kebersihan kelopak dilanjutkan jangka panjang", "kontrol"),
      E("sekali_sembuh", "Setelah salep habis tidak perlu membersihkan kelopak lagi", "pengobatan", "pengecoh", "Kronik kambuhan; higiene kelopak berkelanjutan.")],
     avoid=[STEROID_MATA], refs=REF)

CASE("hordeolum", KELOPAK,
     [IT("ab_salep", "Antibiotik topikal mata", "utama", "Infeksi stafilokokus kelenjar kelopak.", AB_SALEP)],
     [NP("kompres", "Kompres hangat 10–15 menit 3–4 × sehari"),
      NP("jangan_pencet", "Jangan memencet benjolan"),
      NP("gula", "Periksa gula darah karena sering berulang", when=T("berulang")),
      NP("pencet", "Pencet benjolan agar nanahnya cepat keluar", "berbahaya", "Infeksi menyebar (selulitis orbita).")],
     [E("dx", "Ini bintitan: infeksi kelenjar di kelopak mata", "diagnosis"),
      E("obat", "Oleskan/teteskan antibiotik sesuai aturan", "pengobatan"),
      E("bahaya", "Segera kembali bila kelopak bengkak merah meluas, demam, atau penglihatan terganggu", "tanda_bahaya"),
      E("kontrol", "Kontrol bila tidak pecah/mengecil dalam 2 hari (mungkin perlu insisi)", "kontrol"),
      E("cegah", "Jaga kebersihan kelopak dan jangan mengucek mata dengan tangan kotor", "pencegahan"),
      E("menular_lihat", "Bintitan muncul karena suka mengintip", "diagnosis", "pengecoh", "Mitos; disebabkan infeksi bakteri.")],
     avoid=[STEROID_MATA], refs=REF)

CASE("trikiasis", KELOPAK,
     [IT("ab_salep", "Salep antibiotik mata", "utama", "Erosi kornea akibat gesekan bulu mata.", [AB_SALEP[0]], T("erosi_kornea")),
      IT("pelumas", "Air mata buatan", "pendukung", "Melindungi permukaan kornea.", [AIR_MATA], T("erosi_kornea"))],
     [NP("epilasi", "Epilasi bulu mata yang salah arah dengan pinset"),
      NP("rujuk", "Rujuk untuk koreksi entropion", when=T("entropion_curiga")),
      NP("ab_saja", "Cukup tetes antibiotik jangka panjang tanpa mencabut bulu mata", "pengecoh", "Penyebab (bulu mata) tidak diatasi."),
      NP("gunting", "Gunting sendiri bulu mata di rumah dengan gunting kuku", "berbahaya", "Ujung tajam makin melukai kornea.")],
     [E("dx", "Bulu mata tumbuh mengarah ke bola mata dan menggesek kornea", "diagnosis"),
      E("obat", "Bulu mata dicabut; bisa tumbuh lagi sehingga perlu diulang/tindakan permanen", "pengobatan"),
      E("bahaya", "Segera kembali bila penglihatan kabur, nyeri hebat, atau mata bernanah", "tanda_bahaya"),
      E("kontrol", "Kontrol 4–6 minggu (bulu mata tumbuh kembali)", "kontrol"),
      E("biarkan", "Dibiarkan saja karena bulu mata akan berbalik arah sendiri", "pengobatan", "pengecoh", "Tidak akan membaik sendiri.")],
     note="Tatalaksana utama tindakan (epilasi); obat hanya bila ada erosi kornea.", avoid=[STEROID_MATA], refs=REF)

CASE("episkleritis", MERAH,
     [IT("pelumas", "Air mata buatan", "utama", "Suportif; episkleritis umumnya swasirna.", [AIR_MATA]),
      IT("oains", "OAINS oral", "pendukung", "Episkleritis nodular/nyeri.",
         [O("ibuprofen", "Ibuprofen 3 × 400 mg sesudah makan 5–7 hari", 400, "rutin", (3, 3), (5, 7), forms="ibuprofen-tab400"),
          O("asam_mefenamat", "Asam mefenamat 3 × 500 mg sesudah makan 5–7 hari", 500, "rutin", (3, 3), (5, 7)),
          O("natrium_diklofenak", "Natrium diklofenak 2 × 50 mg sesudah makan 5–7 hari", 50, "rutin", (2, 3), (5, 7))], T("nodular"))],
     [NP("kompres", "Kompres dingin pada mata"),
      NP("autoimun", "Rujuk untuk mencari penyakit autoimun karena berulang", when=T("berulang")),
      NP("ab", "Beri antibiotik tetes mata", "pengecoh", "Bukan infeksi."),
      NP_HERBAL],
     [E("dx", "Radang lapisan tipis di permukaan putih mata; umumnya jinak", "diagnosis"),
      E("obat", "Biasanya sembuh sendiri 1–2 minggu dengan obat pelumas", "pengobatan"),
      E("bahaya", "Segera kembali bila nyeri hebat menembus ke dalam, penglihatan kabur, atau silau (curiga skleritis/uveitis)", "tanda_bahaya"),
      E("kontrol", "Kontrol 1–2 minggu", "kontrol"),
      E("steroid_sendiri", "Beli tetes mata steroid sendiri bila kambuh", "pengobatan", "berbahaya", "Risiko glaukoma & katarak.")],
     avoid=[STEROID_MATA, AV("Antibiotik tidak diperlukan.", drugs=["kloramfenikol_tm", "gentamisin_tm", "levofloksasin_tm", "kloramfenikol_sm"])], refs=REF)


def refraksi(id, koreksi, salah, extra_np=None, extra_edu=None):
    CASE(id, VISUS, [],
         [NP("kacamata", koreksi),
          NP("istirahat", "Istirahatkan mata saat kerja dekat lama dengan pencahayaan cukup"),
          *(extra_np or []),
          NP("tetes_herbal", "Tetes mata herbal/vitamin untuk 'menyembuhkan' kelainan refraksi", "berbahaya", "Tidak memperbaiki refraksi; risiko iritasi/infeksi."),
          NP("salah", salah, "pengecoh", "Koreksi tidak tepat memicu astenopia/sakit kepala.")],
         [E("dx", "Penglihatan kabur karena kelainan pembiasan cahaya pada mata (bukan penyakit berbahaya)", "diagnosis"),
          E("obat", "Kacamata dipakai sesuai anjuran; ukuran dapat berubah sehingga perlu diperiksa ulang", "pengobatan"),
          E("bahaya", "Segera periksa bila penglihatan turun mendadak, nyeri mata, kilatan cahaya, atau bayangan hitam", "tanda_bahaya"),
          E("kontrol", "Periksa mata ulang 6–12 bulan sekali", "kontrol"),
          *(extra_edu or []),
          E("lepas", "Sering melepas kacamata agar mata 'terlatih' dan minusnya berkurang", "pengobatan", "pengecoh", "Mitos; tidak menurunkan ukuran.")],
         note="Tatalaksana dengan kacamata koreksi — tidak memerlukan obat.", refs=REF)


refraksi("miopia", "Resepkan kacamata sferis negatif (minus) TERKECIL yang memberi visus terbaik 6/6",
         "Resepkan lensa minus terbesar agar terlihat paling tajam",
         [NP("luar", "Perbanyak aktivitas di luar ruangan & batasi kerja dekat", when=W(amax=18))],
         [E("cegah", "Aktivitas luar ruang ≥ 2 jam/hari membantu memperlambat progresi miopia pada anak", "pencegahan", when=W(amax=18))])
refraksi("hipermetropia", "Resepkan kacamata sferis positif (plus) TERBESAR yang memberi visus terbaik",
         "Resepkan lensa plus terkecil saja",
         [NP("anak_rujuk", "Rujuk bila visus anak tidak mencapai 6/6 dengan koreksi (risiko ambliopia/juling)", when=W(amax=12))])
refraksi("astigmatisma", "Resepkan kacamata dengan koreksi silinder (dan sferis bila perlu) sesuai hasil uji",
         "Resepkan lensa sferis saja tanpa silinder")
refraksi("presbiopia", "Resepkan kacamata baca dengan addisi sesuai usia (± +1,00 D usia 40; +2,00 D usia 50; +3,00 D usia ≥ 60) dicoba pada jarak 33 cm",
         "Resepkan kacamata baca berkekuatan setinggi mungkin",
         [NP("skrining", "Skrining tekanan bola mata (glaukoma) dan gula darah")])

CASE("buta_senja", VISUS,
     [IT("vit_a", "Vitamin A dosis terapi", "utama", "Xeroftalmia: hari 1, hari 2, dan hari 15.",
         [O("vitamin_a", "Vitamin A 200.000 IU (kapsul merah) hari ke-1 dan ke-2, dosis ke-3 hari ke-15 (usia ≥ 1 tahun)", 200000, "rutin", (1, 1), (2, 2), forms="vita-200rb")])],
     [NP("gizi", "Perbaikan gizi: hati, telur, sayur hijau, buah berwarna oranye; lanjutkan ASI"),
      NP("penyerta", "Obati penyakit penyerta (diare, cacingan, campak) & pantau status gizi"),
      NP("rujuk", "Rujuk segera setelah dosis pertama vitamin A karena kornea terkena", when=T("xerosis_kornea")),
      NP("lemak", "Hindari makanan berlemak agar mata cepat sembuh", "berbahaya", "Vitamin A larut lemak — butuh lemak untuk diserap.")],
     [E("dx", "Rabun senja karena kekurangan vitamin A", "diagnosis"),
      E("obat", "Kapsul vitamin A diberikan 3 kali: hari ini, besok, dan 2 minggu lagi", "pengobatan"),
      E("bahaya", "Segera kembali bila mata merah, nyeri, silau, atau ada bercak keruh di bagian hitam mata", "tanda_bahaya"),
      E("kontrol", "Kontrol hari ke-15 untuk dosis ketiga & menilai gizi", "kontrol"),
      E("cegah", "Ikuti pemberian vitamin A rutin bulan Februari & Agustus di posyandu", "pencegahan"),
      E("wortel", "Cukup makan wortel, kapsul vitamin A tidak perlu", "pengobatan", "pengecoh", "Defisiensi klinis perlu dosis terapi.")],
     avoid=[AV("Bukan infeksi; antibiotik tetes tidak menggantikan vitamin A.", drugs=["kloramfenikol_tm", "gentamisin_tm"])],
     kie=["diagnosis", "pengobatan", "tanda_bahaya", "kontrol", "pencegahan"], refs=REF + ["WHO. Xerophthalmia and night blindness — treatment schedule"])
