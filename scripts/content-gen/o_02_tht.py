"""Kunci OSCE — THT & saluran napas atas (15)."""
from osce_lib import (ADULT, AND, ANALGESIK, ANTIHISTAMIN, AV, CASE, CHILD, E, E_ANTIBIOTIK_BEBAS, E_HABIS_STOP, IT, NP, NT, O, PCT_ADULT, PCT_CHILD,
                      PPK, T, W)

REF = [PPK, "PERHATI-KL. Panduan Praktik Klinis THT-KL"]
TELINGA = "THT — keluhan telinga"
HIDUNG = "THT — keluhan hidung"
TENGGOROK = "THT — nyeri tenggorok & batuk"
UMUM = "THT — keluhan umum"

AMOX_DEWASA = O("amoksisilin", "Amoksisilin 3 × 500 mg selama 7–10 hari", 500, "rutin", (3, 3), (7, 10), forms="amoksisilin-tab500")
AMOX_ANAK = O("amoksisilin", "Amoksisilin 15–30 mg/kgBB/kali 3 × sehari (≈ 50–90 mg/kgBB/hari) selama 7–10 hari", None, "rutin", (3, 3), (7, 10),
              forms=["amoksisilin-syr125", "amoksisilin-syr250"], perkg=(13, 30))
AZI_DEWASA = O("azitromisin", "Azitromisin 1 × 500 mg selama 3–5 hari (alergi penisilin)", 500, "rutin", (1, 1), (3, 5), forms="azitromisin-tab500")
AZI_ANAK = O("azitromisin", "Azitromisin 10 mg/kgBB 1 × sehari selama 3–5 hari (alergi penisilin)", None, "rutin", (1, 1), (3, 5), forms="azitromisin-syr200", perkg=(8, 12))
ERI_DEWASA = O("eritromisin", "Eritromisin 4 × 500 mg selama 10 hari (alergi penisilin)", 500, "rutin", (4, 4), (7, 10), forms="eritromisin-tab500")
ERI_ANAK = O("eritromisin", "Eritromisin 10–12,5 mg/kgBB/kali 4 × sehari (alergi penisilin)", None, "rutin", (4, 4), (7, 10), forms="eritromisin-syr200", perkg=(9, 14))
NO_AB = AV("Infeksi virus/non-bakteri: antibiotik tidak diperlukan.", classes=["antibiotik"])
NO_AB_COND = lambda w: AV("Tidak ada indikasi antibiotik.", classes=["antibiotik"], when=w)
NP_KOREK = NP("korek", "Bersihkan telinga dengan cotton bud/lidi lebih dalam setiap hari", "berbahaya", "Mendorong serumen & melukai liang/membran timpani.")


def ab_item(id, label, reason, when=None, days=(7, 10)):
    a = [dict(AMOX_DEWASA, days=list(days)), AZI_DEWASA, ERI_DEWASA,
         O("amoksisilin_klavulanat", "Amoksisilin-klavulanat 3 × 625 mg", 625, "rutin", (2, 3), days)]
    c = [dict(AMOX_ANAK, days=list(days)), AZI_ANAK, ERI_ANAK]
    return [IT(f"{id}_dewasa", label, "utama", reason, a, AND(when, ADULT)), IT(f"{id}_anak", f"{label} (anak)", "utama", reason, c, AND(when, CHILD))]


CASE("otitis_eksterna", TELINGA,
     [IT("tetes_ab", "Antibiotik tetes telinga", "utama", "Otitis eksterna difus.",
         [O("ofloksasin_tt", "Ofloksasin 0,3% tetes telinga 5–10 tetes 2 × sehari selama 7 hari", (5, 10), "rutin", (2, 2), (7, 10))], NT("sirkumskripta", "jamur")),
      IT("ab_oral", "Antibiotik oral antistafilokokus", "utama", "Furunkel liang telinga.",
         [O("dikloksasilin", "Dikloksasilin 4 × 500 mg selama 5–7 hari", 500, "rutin", (4, 4), (5, 7)),
          O("sefadroksil", "Sefadroksil 2 × 500 mg selama 5–7 hari", 500, "rutin", (2, 2), (5, 7), forms="sefadroksil-kap500"),
          O("klindamisin", "Klindamisin 3 × 300 mg selama 5–7 hari", 300, "rutin", (3, 3), (5, 7), forms="klindamisin-kap300")], AND(T("sirkumskripta"), ADULT)),
      IT("ab_oral_anak", "Antibiotik oral antistafilokokus (anak)", "utama", "Furunkel liang telinga.",
         [O("sefadroksil", "Sefadroksil 15 mg/kgBB/kali 2 × sehari selama 5–7 hari", None, "rutin", (2, 2), (5, 7), forms="sefadroksil-syr125", perkg=(12, 18))],
         AND(T("sirkumskripta"), CHILD)),
      IT("antijamur", "Antijamur topikal liang telinga", "utama", "Otomikosis.",
         [O("klotrimazol_krim", "Klotrimazol 1% dioles tipis di liang telinga 2 × sehari selama 1–2 minggu", 1, "rutin", (2, 2), (7, 14)),
          O("mikonazol_krim", "Mikonazol 2% dioles di liang telinga 2 × sehari selama 1–2 minggu", 1, "rutin", (2, 2), (7, 14))], T("jamur")),
      *ANALGESIK(role="pendukung", reason="Nyeri telinga.")],
     [NP("toilet", "Bersihkan liang telinga (aural toilet) dengan hati-hati"),
      NP("kering", "Jaga telinga tetap kering; hindari berenang 1–2 minggu"),
      NP("kompres", "Kompres hangat pada telinga", when=T("sirkumskripta")),
      NP("gula", "Periksa gula darah (waspada otitis eksterna maligna)", when=T("dm_curiga")),
      NP_KOREK],
     [E("dx", "Ini radang kulit liang telinga", "diagnosis"),
      E("obat", "Gunakan obat sesuai aturan sampai habis walau nyeri sudah berkurang", "pengobatan"),
      E("bahaya", "Segera kembali bila bengkak meluas ke wajah/belakang telinga, demam tinggi, atau pendengaran sangat turun", "tanda_bahaya"),
      E("kontrol", "Kontrol 1 minggu", "kontrol"),
      E("cegah", "Jangan mengorek telinga dan keringkan telinga setelah mandi/berenang", "pencegahan"),
      E("minyak", "Teteskan minyak kayu putih agar telinga hangat", "pengobatan", "berbahaya", "Iritasi kulit liang telinga.")],
     refs=REF)

CASE("otitis_media_akut", TELINGA,
     [*ab_item("ab", "Antibiotik", "OMA stadium supurasi/perforasi atau gejala berat: amoksisilin lini pertama."),
      IT("tetes_telinga", "Antibiotik tetes telinga", "pendukung", "Stadium perforasi (otore).",
         [O("ofloksasin_tt", "Ofloksasin 0,3% tetes telinga 5–10 tetes 2 × sehari selama 7–10 hari (setelah cuci telinga)", (5, 10), "rutin", (2, 2), (7, 10))], T("perforasi")),
      *ANALGESIK(role="pendukung", reason="Nyeri telinga & demam.")],
     [NP("kering", "Jaga telinga tetap kering (sumbat kapas saat mandi)", when=T("perforasi")),
      NP("cuci", "Cuci telinga dengan H2O2 3% sebelum tetes telinga", when=T("perforasi")),
      NP("asi", "Menyusui/minum dalam posisi kepala lebih tinggi", when=W(amax=2)),
      NP("rokok", "Jauhkan dari asap rokok"),
      NP("korek_kapas", "Bersihkan cairan telinga dengan memasukkan kapas lidi dalam-dalam", "berbahaya", "Melukai liang telinga & membran timpani.")],
     [E("dx", "Ini infeksi telinga tengah, sering setelah batuk pilek", "diagnosis"),
      E("obat", "Antibiotik diminum teratur sampai habis", "pengobatan"),
      E("bahaya", "Segera kembali bila bengkak/nyeri di belakang telinga, kejang, kaku kuduk, atau demam tinggi menetap", "tanda_bahaya"),
      E("kontrol", "Kontrol 3 hari untuk menilai respons, lalu setelah antibiotik habis", "kontrol"),
      E("cegah", "Lengkapi imunisasi dan hindari asap rokok", "pencegahan"),
      E_HABIS_STOP()],
     refs=REF)

CASE("serumen_prop", TELINGA,
     [IT("pelunak", "Pelunak serumen", "utama", "Melunakkan serumen keras sebelum ekstraksi/irigasi.",
         [O("karbogliserin", "Karbogliserin 10% tetes telinga 3–5 tetes 3 × sehari selama 3–5 hari", (3, 5), "rutin", (3, 3), (3, 5))])],
     [NP("ekstraksi", "Ekstraksi serumen dengan pengait/kuret di bawah penerangan"),
      NP("irigasi", "Irigasi liang telinga dengan air hangat suhu tubuh", when=NT("riwayat_perforasi")),
      NP("tanpa_irigasi", "Jangan irigasi; ekstraksi kering (curiga perforasi)", when=T("riwayat_perforasi")),
      NP("lilin", "Membersihkan telinga dengan lilin telinga (ear candling)", "berbahaya", "Luka bakar & sumbatan lilin."),
      NP_KOREK],
     [E("dx", "Telinga tersumbat kotoran telinga yang mengeras", "diagnosis"),
      E("obat", "Teteskan obat pelunak sesuai aturan, lalu kembali untuk dibersihkan", "pengobatan"),
      E("bahaya", "Segera kembali bila keluar cairan/darah, nyeri hebat, atau pusing berputar", "tanda_bahaya"),
      E("kontrol", "Kembali 3–5 hari untuk ekstraksi/irigasi", "kontrol"),
      E("cegah", "Hentikan cotton bud — telinga membersihkan dirinya sendiri", "pencegahan"),
      E("tiap_hari", "Bersihkan telinga dengan cotton bud setiap hari agar tidak tersumbat lagi", "pencegahan", "berbahaya", "Justru mendorong serumen ke dalam.")],
     avoid=[AV("Tidak ada infeksi — antibiotik tidak diperlukan.", classes=["antibiotik"], drugs=["ofloksasin_tt"])], refs=REF)

CASE("mabuk_perjalanan", UMUM,
     [IT("antimabuk", "Antihistamin antimabuk", "utama", "Diminum 30–60 menit sebelum berangkat.",
         [O("dimenhidrinat", "Dimenhidrinat 50 mg 30–60 menit sebelum berangkat, dapat diulang tiap 4–6 jam", (50, 100), ["tunggal", "prn"], (1, 4), (1, 3))], ADULT),
      IT("antimabuk_anak", "Antihistamin antimabuk (anak)", "utama", "Diminum 30–60 menit sebelum berangkat.",
         [O("dimenhidrinat", "Dimenhidrinat 12,5–25 mg (¼–½ tablet) 30–60 menit sebelum berangkat", (12.5, 25), ["tunggal", "prn"], (1, 3), (1, 3))], CHILD)],
     [NP("posisi", "Duduk di depan/tengah kendaraan dan pandang horizon"),
      NP("hp", "Jangan membaca atau bermain HP selama perjalanan"),
      NP("makan", "Makan ringan sebelum berangkat, hindari makanan berlemak; ventilasi baik"),
      NP("alkohol", "Minum obat antimabuk bersama alkohol agar cepat tidur", "berbahaya", "Depresi SSP berlebihan.")],
     [E("dx", "Mabuk perjalanan karena ketidaksesuaian sinyal keseimbangan & penglihatan", "diagnosis"),
      E("obat", "Obat diminum 30–60 menit SEBELUM berangkat", "pengobatan"),
      E("es", "Obat dapat menyebabkan kantuk — jangan menyetir/mengoperasikan mesin", "efek_samping"),
      E("bahaya", "Periksakan bila pusing berputar/muntah terjadi tanpa perjalanan atau disertai sakit kepala hebat/lemah anggota gerak", "tanda_bahaya"),
      E("kontrol", "Kontrol bila keluhan tidak membaik dengan pencegahan", "kontrol"),
      E("saat_muntah", "Obat paling baik diminum setelah mulai muntah", "pengobatan", "pengecoh", "Kurang efektif bila diminum setelah gejala muncul.")],
     kie=["diagnosis", "pengobatan", "efek_samping", "tanda_bahaya", "kontrol"], refs=REF)

CASE("furunkel_hidung", HIDUNG,
     [IT("ab_topikal", "Antibiotik topikal", "utama", "Infeksi stafilokokus folikel rambut hidung.",
         [O("mupirosin", "Mupirosin 2% salep 3 × sehari selama 7 hari", 1, "rutin", (2, 3), (7, 10)),
          O("asam_fusidat", "Asam fusidat 2% krim 3 × sehari selama 7 hari", 1, "rutin", (2, 3), (7, 10))]),
      IT("ab_oral", "Antibiotik oral antistafilokokus", "pendukung", "Sudah dipencet/meluas — cegah penyebaran.",
         [O("dikloksasilin", "Dikloksasilin 4 × 500 mg selama 5–7 hari", 500, "rutin", (4, 4), (5, 7)),
          O("sefadroksil", "Sefadroksil 2 × 500 mg selama 5–7 hari", 500, "rutin", (2, 2), (5, 7), forms="sefadroksil-kap500"),
          O("klindamisin", "Klindamisin 3 × 300 mg selama 5–7 hari", 300, "rutin", (3, 3), (5, 7), forms="klindamisin-kap300")], T("dipencet")),
      *ANALGESIK(child=False, reason="Nyeri.")],
     [NP("kompres", "Kompres hangat 3–4 × sehari"),
      NP("jangan_pencet", "Jangan memencet bisul di hidung (segitiga bahaya wajah)"),
      NP("gula", "Periksa gula darah", when=T("dm_curiga")),
      NP("pencet", "Pencet bisul agar nanah cepat keluar", "berbahaya", "Infeksi dapat menjalar ke sinus kavernosus.")],
     [E("dx", "Ini bisul (infeksi folikel rambut) di lubang hidung", "diagnosis"),
      E("obat", "Oleskan salep/obat sesuai aturan sampai habis", "pengobatan"),
      E("bahaya", "Segera kembali bila bengkak meluas ke mata, mata menonjol/sulit digerakkan, demam tinggi, atau sakit kepala hebat", "tanda_bahaya"),
      E("kontrol", "Kontrol 3 hari", "kontrol"),
      E("cegah", "Hentikan kebiasaan mencabut bulu hidung atau mengorek hidung", "pencegahan"),
      E_ANTIBIOTIK_BEBAS()],
     refs=REF)

SIMPTOMATIK_DEWASA = [PCT_ADULT(), O("pseudoefedrin", "Pseudoefedrin 3 × 60 mg (≤ 3–5 hari)", 60, ["rutin", "prn"], (3, 3), (3, 5)),
                      O("setirizin", "Setirizin 1 × 10 mg", 10, ["rutin", "prn"], (1, 1), (3, 7), forms="setirizin-tab10"),
                      O("ctm", "CTM 3 × 4 mg", 4, ["rutin", "prn"], (3, 3), (3, 7)),
                      O("nacl_nasal", "NaCl 0,9% semprot hidung 2 semprot tiap lubang 3 × sehari", (1, 2), ["rutin", "prn"], (2, 4), (5, 7))]
SIMPTOMATIK_ANAK = [PCT_CHILD(), O("nacl_nasal", "NaCl 0,9% semprot/tetes hidung 1–2 semprot tiap lubang 3 × sehari", (1, 2), ["rutin", "prn"], (2, 4), (5, 7)),
                    O("setirizin", "Setirizin sirup 0,25 mg/kgBB/kali", None, ["rutin", "prn"], (1, 2), (3, 7), forms="setirizin-syr", perkg=(0.15, 0.35))]

CASE("rinitis_akut", HIDUNG,
     [IT("simptomatik", "Terapi simptomatik", "utama", "Pilek virus swasirna: pereda gejala.", SIMPTOMATIK_DEWASA, ADULT),
      IT("simptomatik_anak", "Terapi simptomatik (anak)", "utama", "Pilek virus swasirna: pereda gejala.", SIMPTOMATIK_ANAK, CHILD)],
     [NP("istirahat", "Istirahat dan cukup cairan"),
      NP("cuci", "Cuci hidung dengan NaCl 0,9%"),
      NP("etiket", "Etiket batuk-bersin, masker, cuci tangan"),
      NP("ab", "Minta antibiotik agar ingus kuning cepat hilang", "berbahaya", "Ingus kental bagian perjalanan alami infeksi virus; antibiotik tidak bermanfaat.")],
     [E("dx", "Ini pilek biasa karena virus; sembuh sendiri 7–10 hari", "diagnosis"),
      E("obat", "Obat hanya meringankan gejala; antibiotik tidak diperlukan", "pengobatan"),
      E("bahaya", "Segera kembali bila sesak, demam tinggi > 3 hari, nyeri wajah/telinga, atau > 10 hari tidak membaik", "tanda_bahaya"),
      E("kontrol", "Kontrol bila tidak membaik dalam 10 hari", "kontrol"),
      E_ANTIBIOTIK_BEBAS()],
     avoid=[NO_AB, AV("Dekongestan oral tidak untuk anak kecil.", drugs=["pseudoefedrin"], when=CHILD)], refs=REF)

STEROID_NASAL = O("mometason_nasal", "Mometason furoat semprot hidung 1–2 semprot (50–100 mcg) tiap lubang 1 × sehari", (50, 100), "rutin", (1, 1), (14, 30))

CASE("rinitis_vasomotor", HIDUNG,
     [IT("steroid_nasal", "Kortikosteroid intranasal", "utama", "Mengurangi hiperreaktivitas mukosa.", [dict(STEROID_NASAL, dose=[100, 100], label="Mometason furoat semprot hidung 2 semprot (100 mcg) tiap lubang 1 × sehari")]),
      IT("cuci", "Cuci hidung NaCl", "opsional", "Membersihkan sekret.", [O("nacl_nasal", "NaCl 0,9% semprot hidung 2 semprot tiap lubang 2–3 × sehari", (1, 2), ["rutin", "prn"], (2, 3), (7, 30))])],
     [NP("pencetus", "Hindari pencetus (AC langsung, asap rokok, bau menyengat)"),
      NP("stop_dekongestan", "Hentikan semprot dekongestan yang dipakai berkepanjangan", when=T("pakai_semprot_dekongestan")),
      NP("olahraga", "Olahraga teratur"),
      NP("semprot_terus", "Lanjutkan semprot dekongestan setiap hari agar hidung lega", "berbahaya", "Rinitis medikamentosa (rebound).")],
     [E("dx", "Hidung tersumbat/berair karena saraf hidung terlalu peka (bukan alergi/infeksi)", "diagnosis"),
      E("obat", "Semprot steroid dipakai rutin setiap hari, efek penuh setelah 1–2 minggu", "pengobatan"),
      E("bahaya", "Periksa segera bila mimisan berulang, ingus berdarah/berbau, atau nyeri wajah", "tanda_bahaya"),
      E("kontrol", "Kontrol 2–4 minggu", "kontrol"),
      E("ab", "Pilek menahun ini perlu antibiotik", "pengobatan", "pengecoh", "Bukan infeksi bakteri.")],
     avoid=[AV("Dekongestan topikal > 5 hari memicu rinitis medikamentosa.", drugs=["oksimetazolin"]), NO_AB], refs=REF)

CASE("rinitis_alergi", HIDUNG,
     [*[dict(i, role="utama") for i in ANTIHISTAMIN(reason="Antihistamin H1 generasi kedua.")],
      IT("steroid_nasal", "Kortikosteroid intranasal", "utama", "Rinitis alergi persisten/sedang-berat.", [STEROID_NASAL], T("persisten"))],
     [NP("alergen", "Hindari alergen: jemur kasur, sarung bantal anti tungau, kurangi karpet/boneka berbulu"),
      NP("cuci", "Cuci hidung dengan NaCl 0,9%"),
      NP("asma", "Kendalikan asma yang menyertai", when=T("asma_menyertai")),
      NP("dekongestan_terus", "Pakai semprot dekongestan setiap hari jangka panjang", "berbahaya", "Rinitis medikamentosa.")],
     [E("dx", "Pilek & bersin karena alergi (paling sering debu/tungau)", "diagnosis"),
      E("obat", "Obat dipakai teratur saat gejala; semprot steroid efektif setelah beberapa hari", "pengobatan"),
      E("es", "Antihistamin dapat menyebabkan kantuk ringan", "efek_samping"),
      E("bahaya", "Segera periksa bila sesak/mengi, nyeri wajah dengan ingus kental, atau mimisan berulang", "tanda_bahaya"),
      E("kontrol", "Kontrol 2–4 minggu untuk menilai kendali gejala", "kontrol"),
      E("sembuh", "Alergi akan sembuh total setelah obat habis", "pengobatan", "pengecoh", "Penyakit kronik — fokus pengendalian.")],
     avoid=[NO_AB, AV("Steroid oral tidak diperlukan pada rinitis alergi.", groups=["steroid"])], refs=REF + ["ARIA Guidelines 2019/2020"])

CASE("benda_asing_tht", UMUM, [],
     [NP("fiksasi", "Fiksasi kepala anak dengan aman (dipangku/dibedong) sebelum tindakan"),
      NP("periksa_semua", "Periksa kedua lubang hidung & kedua telinga (benda asing multipel)"),
      NP("mother_kiss", "Coba teknik tiupan orang tua (mother's kiss) atau ekstraksi dengan pengait", when=T("di_hidung")),
      NP("serangga", "Matikan serangga dengan minyak mineral sebelum ekstraksi", when=T("serangga")),
      NP("organik", "Jangan irigasi benda organik (dapat mengembang); ekstraksi dengan pengait", when=T("organik")),
      NP("baterai", "Rujuk segera — baterai kancing menyebabkan nekrosis cepat", when=T("baterai")),
      NP("lidi", "Keluarkan sendiri di rumah dengan lidi/jepit rambut", "berbahaya", "Benda terdorong lebih dalam & perlukaan.")],
     [E("dx", "Ada benda asing di hidung/telinga yang perlu dikeluarkan", "diagnosis"),
      E("obat", "Setelah benda dikeluarkan umumnya tidak perlu obat lanjutan", "pengobatan"),
      E("bahaya", "Segera kembali bila sesak, ingus berbau/berdarah dari satu sisi, nyeri, atau keluar cairan telinga", "tanda_bahaya"),
      E("kontrol", "Kontrol bila keluhan menetap 2–3 hari", "kontrol"),
      E("cegah", "Jauhkan benda kecil & baterai kancing dari jangkauan anak", "pencegahan"),
      E("tunggu", "Tunggu saja, benda akan keluar sendiri saat bersin", "pengobatan", "berbahaya", "Risiko aspirasi/infeksi.")],
     avoid=[AV("Antibiotik tidak diperlukan setelah benda dikeluarkan tanpa infeksi.", classes=["antibiotik"])],
     note="Tatalaksana dengan tindakan ekstraksi — tidak memerlukan resep obat.", refs=REF)

CASE("epistaksis", UMUM, [],
     [NP("tekan", "Duduk tegak condong ke depan dan tekan cuping hidung 10–15 menit"),
      NP("kompres", "Kompres dingin pada pangkal hidung"),
      NP("tampon", "Pasang tampon anterior (vasokonstriktor) bila masih berdarah; kauterisasi sumber anterior"),
      NP("tensi", "Ukur & tatalaksana tekanan darah", when=T("hipertensi_terkait")),
      NP("rujuk", "Rujuk segera untuk tampon posterior", when=T("posterior")),
      NP("tengadah", "Tengadahkan kepala ke belakang dan berbaring telentang", "berbahaya", "Darah tertelan/teraspirasi, perdarahan tersamar.")],
     [E("dx", "Mimisan dari pembuluh darah di hidung", "diagnosis"),
      E("obat", "Umumnya tidak perlu obat; lakukan penekanan bila berulang", "pengobatan"),
      E("bahaya", "Segera ke IGD bila perdarahan > 20 menit walau ditekan, darah mengalir ke tenggorok, pucat/lemas, atau berulang", "tanda_bahaya"),
      E("kontrol", "Kontrol bila berulang untuk mencari penyebab", "kontrol"),
      E("cegah", "Jangan mengorek hidung; jaga kelembapan hidung", "pencegahan"),
      E("aspirin", "Minum aspirin bila pusing setelah mimisan", "pengobatan", "berbahaya", "Memperberat perdarahan.")],
     avoid=[AV("Antiplatelet/OAINS memperberat perdarahan.", groups=["oains"])],
     note="Tatalaksana dengan tindakan (penekanan, tampon, kauterisasi) — tidak memerlukan resep obat; atasi hipertensi bila ada.", refs=REF)

CASE("influenza", TENGGOROK,
     [IT("simptomatik", "Antipiretik-analgesik", "utama", "Demam & nyeri otot.", [PCT_ADULT(), O("ibuprofen", "Ibuprofen 3 × 400 mg sesudah makan", 400, ["prn", "rutin"], (3, 3), (3, 5), forms="ibuprofen-tab400")], ADULT),
      IT("simptomatik_anak", "Antipiretik (anak)", "utama", "Demam & nyeri.", [PCT_CHILD()], CHILD)],
     [NP("istirahat", "Istirahat & banyak minum"),
      NP("isolasi", "Masker, etiket batuk, isolasi mandiri hingga demam reda 24 jam"),
      NP("vaksin", "Vaksin influenza tahunan untuk kelompok risiko"),
      NP("ab", "Minum antibiotik agar flu cepat sembuh", "berbahaya", "Infeksi virus; mendorong resistansi.")],
     [E("dx", "Ini flu (influenza), infeksi virus yang menular lewat percikan", "diagnosis"),
      E("obat", "Obat meredakan demam & nyeri; antibiotik tidak diperlukan", "pengobatan"),
      E("bahaya", "Segera kembali bila sesak, nyeri dada, bibir kebiruan, kejang, atau demam kembali setelah sempat turun", "tanda_bahaya"),
      E("kontrol", "Kontrol bila tidak membaik dalam 3–5 hari", "kontrol"),
      E("cegah", "Vaksin influenza tahunan & cuci tangan", "pencegahan"),
      E_ANTIBIOTIK_BEBAS()],
     avoid=[NO_AB_COND(NT("pneumonia_sekunder")), AV("Aspirin pada anak dengan infeksi virus berisiko sindrom Reye.", drugs=["aspirin_rendah"], sev="kritis", when=CHILD)],
     note="Oseltamivir dipertimbangkan pada kelompok risiko tinggi/berat sesuai pedoman (umumnya di FKRTL).", refs=REF)

CASE("pertusis", TENGGOROK,
     [IT("makrolid", "Antibiotik makrolid", "utama", "Eradikasi B. pertussis & mengurangi penularan.",
         [O("azitromisin", "Azitromisin 500 mg hari 1 lalu 250 mg hari 2–5", (250, 500), "rutin", (1, 1), (5, 5), forms="azitromisin-tab500"),
          O("eritromisin", "Eritromisin 4 × 500 mg selama 14 hari", 500, "rutin", (4, 4), (14, 14), forms="eritromisin-tab500")], ADULT),
      IT("makrolid_anak", "Antibiotik makrolid (anak)", "utama", "Eradikasi B. pertussis & mengurangi penularan.",
         [O("azitromisin", "Azitromisin 10 mg/kgBB hari 1 lalu 5 mg/kgBB hari 2–5", None, "rutin", (1, 1), (5, 5), forms="azitromisin-syr200", perkg=(4.5, 11)),
          O("eritromisin", "Eritromisin 10–12,5 mg/kgBB/kali 4 × sehari selama 14 hari", None, "rutin", (4, 4), (14, 14), forms="eritromisin-syr200", perkg=(9, 14))], CHILD)],
     [NP("nutrisi", "Makan/minum porsi kecil tapi sering"),
      NP("asap", "Hindari asap & pencetus batuk"),
      NP("profilaksis", "Profilaksis makrolid untuk kontak serumah & lengkapi imunisasi DPT"),
      NP("rujuk", "Rujuk segera bayi dengan apnea/sianosis", when=T("apnea_bayi")),
      NP("obat_batuk", "Beri obat penekan batuk (kodein/dekstrometorfan) agar batuk berhenti", "berbahaya", "Tidak efektif & berbahaya pada anak.")],
     [E("dx", "Ini batuk rejan (pertusis), sangat menular", "diagnosis"),
      E("obat", "Antibiotik diminum sampai habis untuk mengurangi penularan; batuk dapat menetap berminggu-minggu", "pengobatan"),
      E("bahaya", "Segera ke IGD bila henti napas, kebiruan, kejang, sulit minum, atau sesak", "tanda_bahaya"),
      E("kontrol", "Kontrol 3–5 hari", "kontrol"),
      E("cegah", "Lengkapi imunisasi DPT anak di rumah", "pencegahan"),
      E("tidak_menular", "Batuk ini tidak menular sehingga anak boleh langsung bersekolah", "pencegahan", "berbahaya", "Menular hingga 5 hari terapi.")],
     avoid=[AV("Antitusif tidak bermanfaat & berbahaya pada anak.", classes=["antitusif"])], refs=REF + ["IDAI. Pedoman Pelayanan Medis — Pertusis"])

CASE("faringitis", TENGGOROK,
     [*ab_item("ab", "Antibiotik", "Faringitis streptokokus (Centor tinggi): cegah demam rematik.", T("streptokokus"), days=(10, 10)),
      *[dict(i, role="utama") for i in ANALGESIK(reason="Faringitis virus: simptomatik.", when=NT("streptokokus"))],
      *ANALGESIK(id="analgesik_strep", reason="Nyeri tenggorok & demam.", when=T("streptokokus"))],
     [NP("kumur", "Kumur air garam hangat & minum hangat"),
      NP("istirahat", "Istirahat, makanan lunak"),
      NP("es", "Hindari minum es & gorengan selamanya", "pengecoh", "Tidak terbukti menjadi penyebab."),
      NP("ab_sisa", "Minum antibiotik sisa milik keluarga", "berbahaya", "Dosis & jenis tidak tepat; resistansi.")],
     [E("dx", "Ini radang tenggorokan; penyebab dinilai dari gejala (virus/bakteri)", "diagnosis"),
      E("obat", "Minum obat sesuai aturan; antibiotik (bila diberikan) dihabiskan 10 hari", "pengobatan"),
      E("bahaya", "Segera kembali bila sulit membuka mulut, tidak bisa menelan ludah, sesak, atau leher bengkak", "tanda_bahaya"),
      E("kontrol", "Kontrol bila tidak membaik dalam 3 hari", "kontrol"),
      E_HABIS_STOP()],
     avoid=[NO_AB_COND(NT("streptokokus"))], refs=REF)

CASE("tonsilitis", TENGGOROK,
     [*ab_item("ab", "Antibiotik", "Tonsilitis bakteri (GABHS).", days=(10, 10)),
      *ANALGESIK(reason="Nyeri menelan & demam.")],
     [NP("kumur", "Kumur air garam hangat, cukup minum, makanan lunak"),
      NP("rujuk", "Rujuk ke THT untuk evaluasi tonsilektomi", when=T("kronik_eksaserbasi")),
      NP("pijat", "Pijat/kerok leher agar amandel mengecil", "berbahaya", "Tidak bermanfaat; risiko cedera.")],
     [E("dx", "Ini radang amandel (tonsil) karena infeksi", "diagnosis"),
      E("obat", "Antibiotik dihabiskan 10 hari walau sudah tidak nyeri (cegah demam rematik)", "pengobatan"),
      E("bahaya", "Segera kembali bila sulit membuka mulut, suara seperti mengulum, ngorok/sesak, atau leher bengkak", "tanda_bahaya"),
      E("kontrol", "Kontrol setelah antibiotik habis", "kontrol"),
      E_HABIS_STOP()],
     refs=REF)

CASE("laringitis", TENGGOROK,
     [*[dict(i, role="opsional") for i in ANALGESIK(child=False, reason="Hanya bila nyeri/demam.")]],
     [NP("istirahat_suara", "Istirahat suara (jangan berbisik paksa)"),
      NP("uap", "Banyak minum & inhalasi uap hangat"),
      NP("rokok", "Berhenti merokok", when=T("perokok")),
      NP("teriak", "Latih suara dengan berteriak agar pita suara kuat", "berbahaya", "Memperberat cedera pita suara.")],
     [E("dx", "Ini radang pita suara, umumnya karena virus atau pemakaian suara berlebih", "diagnosis"),
      E("obat", "Kunci pengobatan adalah istirahat suara; obat hanya bila nyeri/demam", "pengobatan"),
      E("bahaya", "Segera kembali bila sesak, napas berbunyi (stridor), atau sulit menelan", "tanda_bahaya"),
      E("kontrol", "Periksa ulang bila serak > 3 minggu (singkirkan tumor laring)", "kontrol"),
      E_ANTIBIOTIK_BEBAS()],
     avoid=[NO_AB], note="Tidak memerlukan antibiotik; analgesik-antipiretik hanya bila nyeri/demam.", refs=REF)
