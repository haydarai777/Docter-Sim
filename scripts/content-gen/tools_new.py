"""Tambah alat pemeriksaan baru untuk 144 penyakit SKDI 4A + rujukan usia anak 0–9 tahun.

Idempoten: alat dengan id yang sama diganti. Harga dicetak ke config (lihat PRICES).
Jalankan: python3 -I tools_new.py /home/user/Docter-Sim
"""
import json
import sys

ROOT = sys.argv[1]
PATH = f"{ROOT}/src/data/tools.json"
data = json.load(open(PATH))


def T(pid, label, normal, **kw):
    d = {"kind": "text", "id": pid, "label": label, "normal": normal if isinstance(normal, list) else [normal]}
    d.update(kw)
    return d


def N(pid, label, unit, decimals, ref, normal=None, **kw):
    d = {"kind": "numeric", "id": pid, "label": label, "unit": unit, "decimals": decimals, "ref": ref}
    if normal:
        d["normal"] = normal
    d.update(kw)
    return d


def phys(tid, name, group, desc, action, params):
    return {"id": tid, "name": name, "category": "fisik", "group": group, "description": desc, "action": action, "params": params}


def test(tid, name, cat, desc, action, params, objectives, purpose):
    return {"id": tid, "name": name, "category": cat, "description": desc, "action": action, "params": params,
            "objectives": objectives, "purpose": purpose}


MALE_ONLY = "Tidak dilakukan (pasien laki-laki)"

NEW = [
    # ------------------------------------------------------------------ MATA
    phys("visus", "Tajam penglihatan & refraksi (Snellen)", "mata",
         "Visus jauh tiap mata dengan kartu Snellen, uji pinhole, koreksi lensa coba, dan penglihatan dekat (Jaeger).",
         "Anda meminta pasien membaca kartu Snellen dari jarak 6 meter, tiap mata bergantian, lalu dengan pinhole dan lensa coba.",
         [
             T("visus_od", "Visus mata kanan (OD)", "6/6"),
             T("visus_os", "Visus mata kiri (OS)", "6/6"),
             T("pinhole", "Uji pinhole", "Tidak diperlukan (visus sudah 6/6)"),
             T("koreksi", "Koreksi lensa coba", "Tidak memerlukan koreksi"),
             T("visus_dekat", "Penglihatan dekat (kartu Jaeger)", "Membaca J1 tanpa kacamata"),
         ]),
    phys("segmen_anterior", "Mata luar & segmen anterior", "mata",
         "Palpebra, bulu mata, konjungtiva (termasuk eversi kelopak), kornea dengan uji fluoresein, bilik mata depan, iris, pupil, lensa, dan tekanan bola mata per palpasi.",
         "Anda memeriksa mata pasien dengan senter dan loupe, membalik kelopak atas, meneteskan fluoresein, lalu meraba tekanan bola mata.",
         [
             T("palpebra", "Palpebra", "Tidak edema, tidak hiperemis, tidak ada benjolan"),
             T("silia", "Silia & tepi kelopak", "Tumbuh teratur mengarah keluar, tepi kelopak bersih"),
             T("konjungtiva_tarsal", "Konjungtiva tarsal (eversi)", "Tenang, tidak ada papil, folikel, maupun benda asing"),
             T("konjungtiva_bulbi", "Konjungtiva bulbi", "Tenang, tidak ada injeksi maupun perdarahan"),
             T("sekret_mata", "Sekret", "Tidak ada sekret"),
             T("kornea", "Kornea & uji fluoresein", "Jernih, uji fluoresein (−)"),
             T("bmd_iris_pupil", "Bilik mata depan, iris & pupil", "BMD dalam & jernih; iris tenang; pupil bulat, refleks cahaya +/+"),
             T("lensa", "Lensa", "Jernih"),
             T("tio_palpasi", "Tekanan bola mata (palpasi)", "Normal per palpasi kedua mata"),
         ]),
    phys("funduskopi", "Funduskopi (oftalmoskopi direk)", "mata",
         "Refleks fundus, papil saraf optik, pembuluh darah retina, dan makula.",
         "Ruangan diredupkan; Anda memeriksa fundus kedua mata pasien dengan oftalmoskop.",
         [
             T("refleks_fundus", "Refleks fundus", "Positif cemerlang kedua mata"),
             T("papil", "Papil N. II", "Batas tegas, warna normal, C/D 0,3"),
             T("retina", "Pembuluh darah & retina", "A/V 2/3, tidak ada perdarahan maupun eksudat"),
             T("makula", "Makula", "Refleks fovea positif"),
         ]),
    test("tes_schirmer", "Uji Schirmer I", "lainnya",
         "Produksi air mata: panjang kertas Schirmer yang basah dalam 5 menit tanpa anestesi.",
         "Kertas Schirmer diselipkan di kelopak bawah kedua mata pasien selama 5 menit.",
         [N("schirmer", "Panjang basah kertas Schirmer", "mm/5 menit", 0, [10, 35], [12, 25], refText="≥ 10 mm")],
         ["identifikasi"], "Mata kering (< 10 mm, berat < 5 mm). Tidak menilai infeksi maupun refraksi."),
    # ------------------------------------------------------------------ THT
    phys("pemeriksaan_telinga", "Telinga (otoskopi & tes penala)", "tht",
         "Aurikula & tragus, liang telinga, membran timpani dengan otoskop, serta tes penala Rinne–Weber.",
         "Anda menarik daun telinga, memeriksa liang telinga dan gendang telinga dengan otoskop, lalu melakukan tes penala 512 Hz.",
         [
             T("aurikula", "Aurikula & tragus", "Bentuk normal, nyeri tarik aurikula & tekan tragus (−)"),
             T("liang_telinga", "Liang telinga (MAE)", "Lapang, tidak hiperemis, tidak edema, tidak ada serumen padat maupun sekret"),
             T("membran_timpani", "Membran timpani", "Intak, warna putih mutiara, refleks cahaya (+) kedua telinga"),
             T("tes_penala", "Tes penala (Rinne/Weber)", "Rinne (+) kedua telinga, Weber tidak ada lateralisasi"),
         ]),
    phys("pemeriksaan_hidung", "Hidung & sinus (rinoskopi anterior)", "tht",
         "Hidung luar, vestibulum, mukosa & konka, sekret, septum, kavum nasi, dan nyeri tekan sinus paranasal.",
         "Anda memeriksa hidung pasien dengan spekulum hidung dan lampu kepala, lalu menekan daerah sinus.",
         [
             T("hidung_luar", "Hidung luar & vestibulum", "Bentuk normal, vestibulum tenang tanpa bisul"),
             T("mukosa_konka", "Mukosa & konka", "Mukosa merah muda, konka eutrofi"),
             T("sekret_hidung", "Sekret hidung", "Tidak ada sekret"),
             T("septum", "Septum", "Lurus, tidak ada sumber perdarahan"),
             T("kavum_nasi", "Kavum nasi", "Lapang, tidak ada massa maupun benda asing"),
             T("sinus", "Sinus paranasal", "Nyeri tekan sinus (−)"),
         ]),
    phys("pemeriksaan_tenggorok", "Mulut, faring, tonsil & laring", "tht",
         "Bibir dan mukosa mulut, gusi, kelenjar ludah, dinding faring, tonsil, dan laring (laringoskopi indirek).",
         "Anda memeriksa rongga mulut dengan senter dan spatel lidah, lalu melihat laring dengan kaca laring.",
         [
             T("mukosa_mulut", "Bibir & mukosa mulut", "Mukosa basah merah muda, tidak ada ulkus maupun bercak putih"),
             T("kelenjar_ludah", "Kelenjar parotis & submandibula", "Tidak membesar, muara duktus tenang"),
             T("dinding_faring", "Dinding faring", "Tidak hiperemis, tidak granular, tidak ada pseudomembran"),
             T("tonsil", "Tonsil", "T1–T1, tidak hiperemis, kripta tidak melebar, detritus (−)"),
             T("laring", "Laring (laringoskopi indirek)", "Plika vokalis putih, tidak edema, gerak simetris"),
         ]),
    # ------------------------------------------------------------------ SARAF & JIWA
    phys("saraf_kranial", "Saraf kranial", "saraf",
         "Gerak bola mata (N. III, IV, VI), sensibilitas wajah (N. V), otot wajah (N. VII), pendengaran (N. VIII), serta uvula & lidah (N. IX, X, XII).",
         "Anda meminta pasien mengikuti jari dengan mata, mengerutkan dahi, menutup mata, tersenyum, menjulurkan lidah, lalu menguji rasa raba wajah.",
         [
             T("n_okulomotor", "Gerak bola mata (N. III, IV, VI)", "Bebas ke segala arah, tidak ada diplopia"),
             T("n_trigeminus", "N. V (trigeminus)", "Sensibilitas wajah normal, refleks kornea (+)"),
             T("n_fasialis", "N. VII (fasialis)", "Simetris saat istirahat, mengerutkan dahi, menutup mata, dan tersenyum"),
             T("n_vestibulokoklearis", "N. VIII", "Tes gesek jari terdengar kedua telinga"),
             T("n_bulbar", "N. IX, X, XII", "Uvula di tengah, refleks muntah (+), lidah tidak deviasi"),
         ]),
    phys("tes_vestibular", "Keseimbangan & uji vertigo", "saraf",
         "Nistagmus spontan, uji Romberg, jalan tandem, dan manuver Dix–Hallpike.",
         "Anda mengamati gerak bola mata, meminta pasien berdiri dengan mata tertutup dan berjalan lurus, lalu melakukan manuver Dix–Hallpike.",
         [
             T("nistagmus", "Nistagmus spontan", "Tidak ada"),
             T("romberg", "Uji Romberg", "Negatif"),
             T("tandem", "Jalan tandem", "Baik, tidak jatuh"),
             T("dix_hallpike", "Manuver Dix–Hallpike", "Negatif kanan dan kiri"),
         ]),
    phys("refleks_tonus", "Refleks, tonus & koordinasi", "saraf",
         "Refleks fisiologis dan patologis, tonus otot, kekakuan/spasme, serta koordinasi.",
         "Anda mengetuk tendon dengan palu refleks, menggores telapak kaki, menilai tonus, dan meminta pasien menunjuk hidung.",
         [
             T("refleks_fisiologis", "Refleks fisiologis", "+2 dan simetris"),
             T("refleks_patologis", "Refleks patologis", "Babinski (−) kedua sisi"),
             T("tonus", "Tonus & kekakuan otot", "Normal, tidak ada trismus maupun spasme"),
             T("koordinasi", "Koordinasi", "Tes jari–hidung baik"),
         ]),
    phys("status_mentalis", "Status mentalis", "saraf",
         "Penampilan, mood & afek, proses pikir, persepsi, orientasi, dan tilikan.",
         "Anda mengamati pasien sambil bercakap, lalu menilai suasana perasaan, alur pikir, persepsi, dan pemahamannya tentang sakitnya.",
         [
             T("penampilan", "Penampilan & perilaku", "Rapi, sesuai usia, kontak mata baik, kooperatif"),
             T("mood_afek", "Mood & afek", "Eutimik, afek luas dan serasi"),
             T("proses_pikir", "Proses & isi pikir", "Koheren, tidak ada waham"),
             T("persepsi", "Persepsi", "Tidak ada halusinasi"),
             T("tilikan", "Tilikan", "Baik"),
         ]),
    # ------------------------------------------------------------------ GENITALIA, OBSTETRI, PAYUDARA, ANUS
    phys("pemeriksaan_genital", "Genitalia eksterna & KGB inguinal", "genital",
         "Inspeksi genitalia eksterna (preputium, orifisium uretra, vulva), duh tubuh, lesi kelamin, dan kelenjar inguinal.",
         "Dengan persetujuan pasien dan didampingi perawat, Anda memakai sarung tangan dan memeriksa genitalia eksterna serta lipat paha.",
         [
             T("genital_luar", "Genitalia eksterna",
               "Penis & skrotum normal, preputium dapat ditarik, OUE tenang",
               normalFemale=["Vulva & introitus tenang, tidak ada lesi"]),
             T("duh_genital", "Duh tubuh", "Tidak ada duh"),
             T("lesi_genital", "Lesi kelamin", "Tidak ada ulkus, vesikel, maupun kutil"),
             T("kgb_inguinal", "KGB inguinal", "Tidak teraba pembesaran"),
         ]),
    phys("inspekulo_bimanual", "Inspekulo & pemeriksaan dalam", "genital",
         "Dinding vagina, serviks, duh vagina, perineum, dan pemeriksaan bimanual (nyeri goyang serviks, uterus, adneksa). Hanya untuk pasien perempuan.",
         "Dengan persetujuan pasien dan didampingi perawat, Anda memasang spekulum, memeriksa serviks, lalu melakukan pemeriksaan bimanual.",
         [
             T("perineum", "Perineum", MALE_ONLY, normalFemale=["Utuh, tidak ada robekan"]),
             T("dinding_vagina", "Dinding vagina", MALE_ONLY, normalFemale=["Rugae normal, tidak hiperemis"]),
             T("serviks", "Serviks & OUE", MALE_ONLY, normalFemale=["Tenang, OUE tertutup, tidak ada perdarahan"]),
             T("duh_vagina", "Duh vagina", MALE_ONLY, normalFemale=["Sedikit, jernih keputihan, tidak berbau"]),
             T("bimanual", "Bimanual", MALE_ONLY,
               normalFemale=["Nyeri goyang serviks (−), uterus normal, adneksa tidak nyeri & tidak teraba massa"]),
         ]),
    phys("pemeriksaan_obstetri", "Pemeriksaan obstetri (TFU, Leopold, DJJ)", "genital",
         "Tinggi fundus uteri, manuver Leopold, denyut jantung janin dengan Doppler, dan kontraksi.",
         "Anda meraba perut bawah pasien, mengukur tinggi fundus dengan pita ukur, lalu mendengarkan denyut jantung janin dengan Doppler.",
         [
             T("tfu", "Tinggi fundus uteri", "Uterus tidak teraba di atas simfisis"),
             T("leopold", "Leopold", "Tidak dilakukan (tidak hamil)"),
             T("djj", "Denyut jantung janin", "Tidak terdengar (tidak hamil)"),
             T("kontraksi", "Kontraksi uterus", "Tidak ada"),
         ]),
    phys("pemeriksaan_payudara", "Payudara & aksila", "genital",
         "Inspeksi dan palpasi payudara, puting & areola, serta kelenjar aksila.",
         "Dengan persetujuan pasien dan didampingi perawat, Anda menginspeksi dan meraba kedua payudara serta ketiak.",
         [
             T("inspeksi_payudara", "Inspeksi payudara", "Simetris, kulit tidak kemerahan, tidak ada retraksi"),
             T("puting", "Puting & areola", "Menonjol, tidak lecet, tidak ada retraksi maupun cairan"),
             T("palpasi_payudara", "Palpasi payudara", "Tidak nyeri, tidak teraba massa maupun fluktuasi"),
             T("kgb_aksila", "KGB aksila", "Tidak teraba pembesaran"),
         ]),
    phys("pemeriksaan_anus", "Perianal & colok dubur", "genital",
         "Inspeksi perianal (saat istirahat & mengedan), colok dubur, dan sarung tangan.",
         "Dengan persetujuan pasien, Anda memposisikan pasien miring, menginspeksi daerah anus, lalu melakukan colok dubur.",
         [
             T("perianal", "Inspeksi perianal", "Tenang, tidak ada benjolan, fisura, maupun ekskoriasi"),
             T("colok_dubur", "Colok dubur", "Tonus sfingter baik, mukosa licin, tidak ada massa"),
             T("sarung_tangan", "Sarung tangan", "Feses kuning kecoklatan, darah (−), lendir (−)"),
         ]),
    # ------------------------------------------------------------------ KULIT, LUKA, ANAK, MUSKULOSKELETAL
    phys("status_dermatologis", "Status dermatologis", "kulit",
         "Lokasi & distribusi lesi, efloresensi (primer & sekunder), tanda khusus, rambut & kuku, sensibilitas lesi, dan saraf tepi.",
         "Anda memeriksa seluruh kulit pasien di bawah cahaya terang dengan loupe, meraba lesi, menguji rasa raba di lesi, dan meraba saraf tepi.",
         [
             T("lokasi", "Lokasi & distribusi", "Tidak ditemukan lesi kulit"),
             T("efloresensi", "Efloresensi", "Tidak ada"),
             T("tanda_khusus", "Tanda khusus", "Tidak ada"),
             T("rambut_kuku", "Rambut & kuku", "Rambut dan kuku normal"),
             T("sensibilitas_lesi", "Sensibilitas lesi", "Tidak ada bercak mati rasa"),
             T("saraf_tepi", "Saraf tepi", "Tidak menebal, tidak nyeri"),
         ]),
    phys("status_lokalis", "Status lokalis (luka & benjolan)", "kulit",
         "Deskripsi luka (jenis, lokasi, ukuran, tepi, dasar, jembatan jaringan, benda asing), luka bakar (luas & kedalaman), benjolan, dan status neurovaskular distal.",
         "Anda memeriksa bagian yang dikeluhkan di bawah lampu periksa, mengukur luka dengan penggaris, lalu menilai sensorik, motorik, dan denyut di sebelah distal.",
         [
             T("luka", "Luka", "Tidak ada luka"),
             T("tepi_dasar", "Tepi, dasar & sekitar luka", "—"),
             T("luka_bakar", "Luka bakar", "Tidak ada luka bakar"),
             T("benjolan", "Benjolan", "Tidak teraba benjolan"),
             T("distal", "Neurovaskular distal", "Sensorik, motorik, dan pulsasi distal baik"),
         ]),
    phys("pemeriksaan_anak", "Pemeriksaan khusus anak", "anak",
         "Ubun-ubun, tanda dehidrasi (WHO), status gizi menurut z-skor WHO, umbilikus, dan perkembangan (KPSP).",
         "Anda meraba ubun-ubun, menilai mata, air mata, dan cubitan kulit perut, memplot berat dan panjang badan di grafik WHO, lalu memeriksa pusar.",
         [
             T("ubun_ubun", "Ubun-ubun", "Datar"),
             T("dehidrasi_anak", "Tanda dehidrasi (WHO)", "Tanpa dehidrasi: sadar, mata tidak cekung, minum biasa, cubitan kulit perut kembali segera"),
             T("status_gizi", "Status gizi (z-skor WHO)", "Gizi baik (BB/TB antara −2 dan +2 SD)"),
             T("umbilikus", "Umbilikus", "Tenang, tidak kemerahan, tidak berbau"),
             T("perkembangan", "Perkembangan (KPSP)", "Sesuai usia"),
         ]),
    phys("muskuloskeletal", "Sendi & otot", "ekstremitas",
         "Inspeksi dan palpasi sendi (bengkak, merah, hangat, nyeri), lingkup gerak, tofus, dan nyeri tekan otot (mis. betis).",
         "Anda melihat dan meraba sendi-sendi yang dikeluhkan, menggerakkannya, lalu menekan otot betis pasien.",
         [
             T("sendi", "Inspeksi & palpasi sendi", "Tidak bengkak, tidak kemerahan, tidak hangat, tidak nyeri"),
             T("lingkup_gerak", "Lingkup gerak sendi", "Bebas, tidak nyeri"),
             T("tofus", "Tofus", "Tidak ada"),
             T("otot", "Nyeri tekan otot", "Tidak ada (betis tidak nyeri)"),
         ]),
    # ------------------------------------------------------------------ LABORATORIUM
    test("feses_rutin", "Feses rutin (makroskopis & mikroskopis)", "lab",
         "Konsistensi, lendir, darah, leukosit, eritrosit, telur/larva cacing, dan protozoa (amuba, Giardia).",
         "Pasien diberi pot sampel tinja; sampel segar diperiksa langsung dengan mikroskop (sediaan lugol & eosin).",
         [
             T("makroskopis", "Makroskopis", "Lembek, coklat, lendir (−), darah (−)"),
             T("leukosit_feses", "Leukosit", "0–2 /LPB", falsePositiveRate=0.03, falsePositiveValues=["5–10 /LPB"]),
             T("eritrosit_feses", "Eritrosit", "0–1 /LPB"),
             T("telur_cacing", "Telur cacing", "Tidak ditemukan"),
             T("larva", "Larva / proglotid", "Tidak ditemukan"),
             T("protozoa", "Protozoa", "Tidak ditemukan"),
         ],
         ["identifikasi"], "Diare inflamasi (leukosit/eritrosit), cacing (telur, larva, proglotid), dan protozoa (amuba, Giardia)."),
    test("elektrolit", "Elektrolit serum (Na, K, Cl, Ca)", "lab",
         "Natrium, kalium, klorida, dan kalsium serum.",
         "Darah pasien dikirim ke laboratorium untuk pemeriksaan elektrolit.",
         [
             N("natrium", "Natrium", "mmol/L", 0, [135, 145], [137, 143]),
             N("kalium", "Kalium", "mmol/L", 1, [3.5, 5.0], [3.7, 4.8]),
             N("klorida", "Klorida", "mmol/L", 0, [98, 107], [99, 105]),
             N("kalsium", "Kalsium total", "mg/dL", 1, [8.5, 10.5], [8.8, 10.1]),
         ],
         ["fungsi_organ", "komplikasi"], "Gangguan elektrolit akibat muntah/diare berat, kejang, atau kelemahan otot. Tidak menentukan penyebab penyakit."),
    test("asam_urat", "Asam urat serum", "lab",
         "Kadar asam urat darah.", "Anda memeriksa asam urat darah kapiler dengan alat strip.",
         [N("asam_urat", "Asam urat", "mg/dL", 1, [3.5, 7.0], [4.0, 6.5], refFemale=[2.6, 6.0], normalFemale=[3.0, 5.6])],
         ["identifikasi", "skrining"], "Hiperurisemia (> 7 mg/dL laki-laki, > 6 mg/dL perempuan). Kadar bisa normal saat serangan gout akut."),
    test("tes_kehamilan", "Tes kehamilan urin (β-hCG)", "lab",
         "Deteksi hormon β-hCG di urin dengan strip.", "Urin pasien diteteskan pada strip tes kehamilan.",
         [T("hcg", "β-hCG urin", "Negatif")],
         ["identifikasi", "skrining"], "Kehamilan (positif ± 10–14 hari setelah konsepsi). Wajib sebelum obat/rontgen tertentu dan pada nyeri perut/perdarahan perempuan usia subur."),
    test("tes_hiv", "Tes HIV (rapid 3 metode)", "lab",
         "Pemeriksaan antibodi HIV dengan tiga reagen berbeda sesuai strategi nasional, didahului konseling dan persetujuan.",
         "Setelah konseling pra-tes dan persetujuan pasien, darah diperiksa dengan reagen tes cepat HIV.",
         [T("hasil", "Hasil", "Non-reaktif")],
         ["identifikasi", "skrining"], "Infeksi HIV (reaktif pada ketiga reagen). Periode jendela 3 bulan dapat memberi hasil non-reaktif palsu."),
    test("cd4", "Hitung CD4 (rujukan)", "lab",
         "Jumlah sel T-CD4 untuk menilai derajat imunodefisiensi pada HIV.", "Darah pasien dikirim ke laboratorium rujukan untuk hitung CD4.",
         [N("cd4", "CD4", "sel/µL", 0, [500, 1500], [600, 1200], step=5)],
         ["komplikasi", "fungsi_organ"], "Derajat imunosupresi pada HIV (< 200 sel/µL berisiko infeksi oportunistik). Bukan alat diagnosis HIV."),
    test("tes_sifilis", "Tes sifilis (RPR & TPHA)", "lab",
         "RPR/VDRL (nontreponemal, titer aktivitas) dan TPHA (treponemal, konfirmasi).", "Serum pasien diperiksa dengan tes RPR dan TPHA.",
         [T("rpr", "RPR/VDRL", "Non-reaktif"), T("tpha", "TPHA", "Non-reaktif")],
         ["identifikasi", "skrining"], "Sifilis: TPHA reaktif + RPR reaktif = sifilis aktif. Pada chancre dini serologi bisa masih negatif."),
    test("hbsag", "HBsAg (tes cepat)", "lab",
         "Antigen permukaan virus hepatitis B.", "Darah pasien diperiksa dengan tes cepat HBsAg.",
         [T("hasil", "HBsAg", "Non-reaktif")],
         ["identifikasi", "skrining"], "Infeksi hepatitis B. Bagian skrining tripel eliminasi pada ibu hamil."),
    test("igm_anti_hav", "IgM anti-HAV", "lab",
         "Antibodi IgM terhadap virus hepatitis A (infeksi akut).", "Serum pasien dikirim untuk pemeriksaan IgM anti-HAV.",
         [T("hasil", "IgM anti-HAV", "Non-reaktif")],
         ["identifikasi"], "Konfirmasi hepatitis A akut. Tidak menilai beratnya kerusakan hati."),
    test("igm_leptospira", "Tes cepat IgM leptospira", "lab",
         "Antibodi IgM terhadap Leptospira (positif mulai hari ke-5–7).", "Serum pasien diperiksa dengan tes cepat IgM leptospira.",
         [T("hasil", "IgM leptospira", "Negatif")],
         ["identifikasi"], "Leptospirosis. Bisa negatif pada minggu pertama; diagnosis awal tetap klinis-epidemiologis."),
    test("apusan_darah_tepi", "Apusan darah tepi", "lab",
         "Morfologi eritrosit, leukosit, dan trombosit di bawah mikroskop.", "Sediaan apus darah tepi pasien diwarnai dan diperiksa di mikroskop.",
         [
             T("eritrosit", "Eritrosit", "Normositik normokrom"),
             T("leukosit_morfologi", "Leukosit", "Jumlah kesan normal, morfologi normal"),
             T("trombosit_morfologi", "Trombosit", "Jumlah kesan cukup, morfologi normal"),
         ],
         ["identifikasi"], "Jenis anemia (mis. hipokrom mikrositer pada defisiensi besi), sel muda, atau kelainan morfologi lain."),
    test("profil_besi", "Profil besi (rujukan)", "lab",
         "Serum iron, TIBC, saturasi transferin, dan feritin.", "Darah pasien dikirim ke laboratorium rujukan untuk profil besi.",
         [
             N("serum_iron", "Serum iron", "µg/dL", 0, [60, 170], [70, 150]),
             N("tibc", "TIBC", "µg/dL", 0, [250, 450], [270, 400]),
             N("saturasi_transferin", "Saturasi transferin", "%", 0, [20, 50], [24, 42]),
             N("feritin", "Feritin", "ng/mL", 0, [30, 300], [50, 220], refFemale=[15, 150], normalFemale=[25, 120]),
         ],
         ["identifikasi"], "Membuktikan defisiensi besi (feritin rendah). Mahal; di layanan primer biasanya cukup dengan klinis, darah lengkap, dan apusan."),
    test("fungsi_tiroid", "Fungsi tiroid (TSH & FT4, rujukan)", "lab",
         "TSH dan tiroksin bebas.", "Darah pasien dikirim ke laboratorium rujukan untuk pemeriksaan TSH dan FT4.",
         [N("tsh", "TSH", "mIU/L", 2, [0.4, 4.5], [0.8, 3.5]), N("ft4", "FT4", "ng/dL", 2, [0.8, 1.8], [0.95, 1.6])],
         ["fungsi_organ"], "Hipotiroid/hipertiroid. Pada gondok endemik akibat kurang yodium biasanya eutiroid."),
    test("kerokan_koh", "Kerokan kulit/kuku/rambut + KOH", "lab",
         "Sediaan langsung kerokan dengan KOH 10–20% untuk mencari jamur.",
         "Anda mengerok tepi lesi (atau kuku/rambut) dengan skalpel tumpul, meneteskan KOH, lalu memeriksanya di mikroskop.",
         [T("hasil", "Hasil", "Tidak ditemukan hifa, spora, maupun pseudohifa")],
         ["identifikasi"], "Infeksi jamur: hifa bersepta (dermatofita), spaghetti & meatball (Malassezia), pseudohifa & blastospora (Candida)."),
    test("lampu_wood", "Pemeriksaan lampu Wood", "lainnya",
         "Fluoresensi kulit/rambut di bawah sinar ultraviolet A di ruangan gelap.",
         "Ruangan digelapkan; Anda menyinari lesi pasien dengan lampu Wood.",
         [T("fluoresensi", "Fluoresensi", "Tidak ada fluoresensi khas")],
         ["identifikasi"], "Kuning keemasan (pitiriasis versikolor), merah bata/koral (eritrasma), hijau terang (tinea kapitis Microsporum)."),
    test("kerokan_skabies", "Kerokan kulit (tungau Sarcoptes)", "lab",
         "Kerokan pada terowongan/papul untuk mencari tungau, telur, atau skibala.",
         "Anda meneteskan minyak mineral pada terowongan kulit, mengeroknya, lalu memeriksanya di mikroskop.",
         [T("hasil", "Hasil", "Tidak ditemukan tungau, telur, maupun skibala")],
         ["identifikasi"], "Konfirmasi skabies. Sensitivitas rendah — hasil negatif TIDAK menyingkirkan skabies."),
    test("tzanck", "Tes Tzanck", "lab",
         "Kerokan dasar vesikel dengan pewarnaan Giemsa.", "Anda memecah vesikel, mengerok dasarnya, dan membuat sediaan Giemsa.",
         [T("hasil", "Hasil", "Tidak ditemukan sel datia berinti banyak")],
         ["identifikasi"], "Infeksi virus herpes (HSV/VZV): sel datia berinti banyak. Tidak membedakan HSV dari VZV."),
    test("gram_sekret", "Pewarnaan Gram (duh/pus)", "lab",
         "Sediaan langsung duh uretra/serviks, pus, atau krusta dengan pewarnaan Gram.",
         "Anda mengambil duh/pus dengan swab steril, membuat sediaan, lalu mewarnainya dengan Gram.",
         [T("pmn", "Leukosit PMN", "< 5 /LPB"), T("bakteri", "Bakteri", "Tidak ditemukan bakteri patogen")],
         ["identifikasi"], "Diplokokus Gram negatif intrasel (gonore), PMN tanpa diplokokus (uretritis non-gonore), kokus Gram positif (pioderma)."),
    test("sediaan_basah_vagina", "Sediaan basah duh vagina (pH, tes amin, NaCl & KOH)", "lab",
         "pH vagina, tes amin (whiff), clue cells, Trichomonas, dan pseudohifa Candida.",
         "Anda mengambil duh dari forniks dengan swab, mengukur pH, lalu membuat sediaan NaCl dan KOH.",
         [
             N("ph_vagina", "pH vagina", "", 1, [3.8, 4.5], [4.0, 4.5], step=0.5),
             T("whiff", "Tes amin (whiff)", "Negatif"),
             T("clue_cell", "Clue cells", "Tidak ditemukan"),
             T("trikomonas", "Trichomonas vaginalis", "Tidak ditemukan"),
             T("pseudohifa", "Pseudohifa / blastospora", "Tidak ditemukan"),
         ],
         ["identifikasi"], "Vaginosis bakterial (pH > 4,5, whiff +, clue cells), trikomoniasis, dan kandidiasis vulvovaginal."),
    test("bta_kulit", "Slit skin smear (BTA kulit)", "lab",
         "Kerokan jaringan kulit dari lesi & cuping telinga dengan pewarnaan Ziehl–Neelsen.",
         "Anda menjepit dan menyayat kecil kulit lesi serta cuping telinga, lalu membuat sediaan BTA.",
         [T("hasil", "Indeks bakteri", "BTA negatif (IB 0)")],
         ["identifikasi"], "Kusta: menentukan tipe PB/MB (BTA positif = MB). Hasil negatif tidak menyingkirkan kusta."),
    test("mikroskopis_filaria", "Apusan darah malam (mikrofilaria)", "lab",
         "Sediaan darah tebal yang diambil pukul 20.00–24.00, diwarnai Giemsa.",
         "Darah ujung jari pasien diambil malam hari dan dibuat sediaan tebal untuk mencari mikrofilaria.",
         [T("hasil", "Mikrofilaria", "Tidak ditemukan")],
         ["identifikasi"], "Filariasis limfatik aktif (mikrofilaremia). Sering negatif pada fase kronis/limfedema."),
    test("tes_mantoux", "Uji tuberkulin (Mantoux)", "lainnya",
         "Indurasi 48–72 jam setelah suntikan PPD intradermal.",
         "Anda menyuntikkan 0,1 mL PPD intradermal di lengan bawah; pasien kembali 72 jam kemudian untuk dibaca.",
         [N("indurasi", "Indurasi", "mm", 0, [0, 9], [0, 4], refText="< 10 mm")],
         ["identifikasi"], "Infeksi TB (≥ 10 mm, ≥ 5 mm pada imunokompromais). Tidak membedakan infeksi laten dari penyakit aktif."),
    test("abi_doppler", "Ankle–brachial index (Doppler)", "lainnya",
         "Rasio tekanan sistolik pergelangan kaki terhadap lengan.",
         "Anda mengukur tekanan darah di lengan dan pergelangan kaki pasien dengan Doppler genggam.",
         [N("abi", "ABI", "", 2, [0.9, 1.3], [0.98, 1.2])],
         ["struktur", "komplikasi"], "Penyakit arteri perifer (ABI < 0,9). Sebelum terapi kompresi pada ulkus tungkai, ABI harus ≥ 0,8."),
    test("swab_antigen", "Swab antigen SARS-CoV-2 & influenza", "lab",
         "Tes cepat antigen dari swab nasofaring.", "Anda mengambil swab nasofaring pasien dan memeriksanya dengan kaset antigen.",
         [T("sars_cov2", "Antigen SARS-CoV-2", "Negatif"), T("influenza", "Antigen influenza A/B", "Negatif")],
         ["identifikasi"], "Membedakan COVID-19 dan influenza pada ISPA. Sensitivitas antigen influenza sedang."),
    # ------------------------------------------------------------------ PENCITRAAN
    test("usg_obstetri", "USG obstetri & pelvis", "pencitraan",
         "Uterus, kantong gestasi, janin, plasenta, ketuban, dan adneksa.",
         "Anda mengoleskan gel di perut bawah pasien dan melakukan USG transabdominal.",
         [
             T("uterus", "Uterus", "Ukuran normal, kavum uteri kosong, endometrium tipis"),
             T("janin", "Kantong gestasi & janin", "Tidak tampak kantong gestasi"),
             T("adneksa", "Adneksa & cairan bebas", "Tidak tampak massa maupun cairan bebas"),
             T("kesan", "Kesan", "Uterus dan adneksa dalam batas normal", combine=True),
         ],
         ["struktur", "identifikasi", "komplikasi"], "Viabilitas & usia kehamilan, sisa konsepsi, kehamilan ektopik, massa pelvis."),
    test("rontgen_ekstremitas", "Rontgen bagian tubuh yang cedera", "pencitraan",
         "Foto polos dua posisi pada daerah cedera.", "Bagian tubuh pasien yang cedera difoto rontgen dua posisi.",
         [
             T("tulang", "Tulang & sendi", "Tidak tampak fraktur maupun dislokasi"),
             T("jaringan_lunak", "Jaringan lunak", "Tidak tampak benda asing radioopak maupun udara bebas"),
             T("kesan", "Kesan", "Tidak tampak kelainan tulang", combine=True),
         ],
         ["struktur", "komplikasi"], "Fraktur, dislokasi, dan benda asing radioopak pada luka. Tidak diperlukan bila tidak ada kecurigaan klinis."),
    test("usg_superfisial", "USG jaringan lunak", "pencitraan",
         "USG benjolan atau jaringan lunak superfisial.", "Anda mengoleskan gel pada benjolan dan memeriksanya dengan USG probe linear.",
         [T("lesi", "Lesi", "Tidak tampak lesi abnormal"), T("kesan", "Kesan", "Jaringan lunak dalam batas normal", combine=True)],
         ["struktur"], "Membedakan massa padat, kista, lipoma, dan abses (kumpulan cairan). Tidak wajib bila diagnosis klinis jelas."),
]

PRICES = {
    "tes_schirmer": 25_000,
    "feses_rutin": 40_000,
    "elektrolit": 90_000,
    "asam_urat": 30_000,
    "tes_kehamilan": 25_000,
    "tes_hiv": 75_000,
    "cd4": 300_000,
    "tes_sifilis": 60_000,
    "hbsag": 50_000,
    "igm_anti_hav": 180_000,
    "igm_leptospira": 200_000,
    "apusan_darah_tepi": 50_000,
    "profil_besi": 250_000,
    "fungsi_tiroid": 250_000,
    "kerokan_koh": 35_000,
    "lampu_wood": 20_000,
    "kerokan_skabies": 35_000,
    "tzanck": 50_000,
    "gram_sekret": 40_000,
    "sediaan_basah_vagina": 50_000,
    "bta_kulit": 50_000,
    "mikroskopis_filaria": 50_000,
    "tes_mantoux": 50_000,
    "abi_doppler": 50_000,
    "swab_antigen": 150_000,
    "usg_obstetri": 200_000,
    "rontgen_ekstremitas": 150_000,
    "usg_superfisial": 200_000,
}

# ---------------------------------------------------------------- rujukan anak 0–9 tahun
CHILD_BANDS = {
    ("tanda_vital", "td_sistolik"): [(0, [70, 100], [75, 95]), (2, [85, 105], [88, 102]), (5, [90, 110], [92, 106]), (9, [95, 115], [96, 112])],
    ("tanda_vital", "td_diastolik"): [(0, [40, 65], [45, 60]), (2, [45, 70], [50, 65]), (5, [50, 72], [52, 68]), (9, [55, 75], [58, 72])],
    ("tanda_vital", "nadi"): [(0, [100, 160], [110, 150]), (2, [90, 150], [100, 140]), (5, [80, 130], [86, 120]), (9, [70, 120], [76, 110])],
    ("tanda_vital", "napas"): [(0, [30, 50], [32, 44]), (2, [24, 40], [26, 34]), (5, [20, 30], [22, 28]), (9, [18, 26], [19, 24])],
    ("timbangan", "tb"): [(0, [45, 80], [62, 75]), (2, [70, 98], [76, 92]), (5, [88, 120], [94, 114]), (9, [106, 142], [114, 136])],
    ("timbangan", "imt"): [(0, [13, 19], [15, 18]), (2, [14, 18.5], [15, 17.5]), (5, [13.5, 17.5], [14.3, 16.5]), (9, [13.5, 19], [14.5, 17.5])],
    ("timbangan", "bb"): [(0, [2.5, 11.5], None), (2, [7, 17], None), (5, [11, 25], None), (9, [15, 40], None)],
    ("timbangan", "lingkar_perut"): [(0, [32, 50], [38, 46]), (2, [40, 54], [43, 50]), (5, [44, 58], [47, 55]), (9, [48, 66], [51, 62])],
    ("darah_lengkap", "hb"): [(0, [10.5, 13.5], [11, 13]), (5, [11, 14], [11.5, 13.5]), (9, [11.5, 14.5], [12, 14])],
    ("darah_lengkap", "leukosit"): [(0, [6000, 17500], [7000, 15000]), (5, [5500, 15500], [6000, 13000]), (9, [4500, 13500], [5000, 12000])],
}


def add_child_bands():
    tools = {t["id"]: t for t in data["tools"]}
    for (tid, pid), bands in CHILD_BANDS.items():
        p = next(p for p in tools[tid]["params"] if p["id"] == pid)
        old = [b for b in p.get("refByAge", []) if b["maxAge"] > 9]
        new = []
        for max_age, ref, normal in bands:
            b = {"maxAge": max_age, "ref": ref}
            if normal:
                b["normal"] = normal
            new.append(b)
        p["refByAge"] = new + old


def main():
    ids = {t["id"] for t in NEW}
    data["tools"] = [t for t in data["tools"] if t["id"] not in ids] + NEW
    add_child_bands()
    notes = data["review"].setdefault("notes", [])
    note = "Alat untuk 144 penyakit SKDI 4A (mata, THT, saraf, genital/obstetri, kulit, luka, anak, lab tambahan) disusun pengembang; nilai rujukan anak 0–9 tahun disederhanakan."
    if note not in notes:
        notes.append(note)
    json.dump(data, open(PATH, "w"), ensure_ascii=False, indent=2)
    print(json.dumps(PRICES))


main()

# EKG: frekuensi mengikuti rujukan nadi menurut usia (agar nadi anak normal tidak ditandai takikardia).
data = json.load(open(PATH))
tv = next(t for t in data["tools"] if t["id"] == "tanda_vital")
nadi = next(p for p in tv["params"] if p["id"] == "nadi")
ekg = next(t for t in data["tools"] if t["id"] == "ekg")
fr = next(p for p in ekg["params"] if p["id"] == "frekuensi")
fr["refByAge"] = [{k: v for k, v in b.items()} for b in nadi["refByAge"]]
json.dump(data, open(PATH, "w"), ensure_ascii=False, indent=2)
