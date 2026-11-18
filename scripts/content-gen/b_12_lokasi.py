"""Penyempurnaan: jawaban 'Di bagian mana?' (topik lokasi) untuk penyakit yang belum punya.

Tanpa jawaban ini pasien memakai jawaban cadangan umum "Rasanya seluruh badan" — keliru untuk keluhan
lokal (telinga, kulit, kemaluan). Lokasi disamakan dengan temuan pemeriksaan (status dermatologis/lokalis,
telinga, mata) agar anamnesis & pemeriksaan konsisten. Dijalankan sesudah batch penyakit (urutan nama berkas).
"""
import lib
from lib import NT, T, W

L = {
    "abortus_komplit": [("Dari jalan lahir, Dok, perut bawah juga mulas.", None)],
    "abses_folikel": [("Di punggung atas, Dok, dulu ada benjolan kecil di situ.", T("kista_sebelumnya")), ("Di ketiak kanan, Dok.", NT("kista_sebelumnya"))],
    "akne_vulgaris": [("Di muka, Dok, dahi, pipi, sama dagu.", None)],
    "alergi_makanan": [("Bentolnya di muka, leher, badan, sampai tangan kaki, Dok.", None)],
    "anemia_defisiensi_besi": [("Nggak sakit di satu tempat, Dok, badan lemas semua, gampang capek.", None)],
    "anemia_kehamilan": [("Nggak ada yang sakit, Dok, cuma badan lemas dan kepala kliyengan.", None)],
    "astigmatisma": [("Dua-duanya, Dok, jauh maupun dekat agak berbayang.", None)],
    "benda_asing_tht": [("Di lubang hidung kanan, Dok.", T("di_hidung")), ("Di telinga kanan, Dok.", NT("di_hidung"))],
    "blefaritis": [("Di pinggir kelopak mata, Dok, atas dan bawah, dua-duanya.", None)],
    "bppv": [("Bukan sakit, Dok, kepala rasanya muter kalau nengok atau bangun dari tidur.", None)],
    "bronkitis_akut": [("Batuknya dari dada, Dok, dada terasa berat kalau batuk terus.", None)],
    "buta_senja": [("Matanya, Dok, dua-duanya. Kalau sore menjelang magrib dia nabrak-nabrak.", None)],
    "cacing_tambang": [("Nggak ada yang sakit di satu tempat, Dok, lemas dan pucat saja. Kadang ulu hati nggak enak.", None)],
    "cracked_nipple": [("Di puting, Dok, terutama yang kanan.", None)],
    "cutaneous_larva_migrans": [("Di telapak dan punggung kaki kanan, Dok. Garisnya pindah-pindah tiap hari.", None)],
    "defisiensi_mineral": [("Di leher depan, Dok, ada benjolan.", T("iodium")), ("Kramnya di betis dan tangan, Dok.", NT("iodium"))],
    "defisiensi_vitamin": [("Gusinya gampang berdarah, Dok, kaki juga ada bintik-bintik.", T("skorbut")),
                           ("Di sudut bibir pecah-pecah, lidah perih, Dok.", T("b_kompleks")),
                           ("Kaki terasa kesemutan dan lemah, Dok, betis pegal.", T("beriberi"))],
    "dermatitis_kontak_iritan": [("Di punggung tangan dan sela-sela jari, Dok, dua-duanya. Pas di bagian yang kena air sabun.", None)],
    "dermatitis_numularis": [("Di tungkai bawah dan punggung tangan, Dok.", None)],
    "disentri": [("Perutnya melilit di bagian bawah, Dok, mau BAB terus.", None)],
    "dislipidemia": [("Nggak ada yang sakit, Dok. Cuma hasil cek kolesterolnya tinggi.", None)],
    "dm_tipe1": [("Nggak sakit di mana-mana, Dok. Cuma haus terus dan bolak-balik kencing.", None)],
    "erisipelas": [("Di pipi kanan, Dok.", T("wajah")), ("Di tungkai bawah kanan, Dok.", NT("wajah"))],
    "eritrasma": [("Di lipat paha kanan-kiri, Dok, sela jari kaki juga.", None)],
    "erupsi_obat": [("Di bibir bawah dan punggung tangan kanan, Dok, tempat yang sama seperti dulu.", T("fde")),
                    ("Di badan sampai tangan dan kaki, Dok, rata kiri-kanan.", NT("fde"))],
    "faringitis": [("Di tenggorokan, Dok, terutama kalau menelan.", None)],
    "filariasis": [("Di kaki kanan, Dok, bengkaknya dari betis sampai punggung kaki.", None)],
    "fimosis": [("Di ujung kemaluan, Dok, kulupnya nggak bisa ditarik.", None)],
    "furunkel_hidung": [("Di ujung hidung sebelah dalam, Dok, lubang kanan.", None)],
    "furunkel_karbunkel": [("Di tengkuk, Dok, besar dan banyak mata nanahnya.", T("karbunkel")), ("Di bokong kanan, Dok.", NT("karbunkel"))],
    "gastroenteritis_akut": [("Perutnya mules di sekitar pusar, Dok, hilang-timbul sebelum mencret.", None)],
    "gonore": [("Dari ujung kemaluan, Dok, keluar nanah.", NT("perempuan")), ("Dari jalan lahir, Dok, keputihan, kencing juga perih.", T("perempuan"))],
    "hemoroid": [("Di dubur, Dok, darahnya menetes waktu BAB.", None)],
    "hepatitis_a": [("Mata sama kulitnya kuning, Dok. Perut kanan atas juga agak pegal.", None)],
    "herpes_simpleks": [("Di bibir bawah kanan, Dok.", NT("genitalis")), ("Di kemaluan, Dok.", T("genitalis"))],
    "hipermetropia": [("Matanya, Dok, dua-duanya. Paling terasa kalau baca lama.", None)],
    "hipertensi": [("Kadang tengkuk saja yang tegang, Dok. Selebihnya nggak ada yang sakit.", None)],
    "hiperurisemia": [("Di pangkal jempol kaki kanan, Dok.", None)],
    "hipoglikemia": [("Nggak sakit di satu tempat, Dok. Badan gemetar, keringat dingin.", None)],
    "hiv": [("Nggak ada yang sakit di satu tempat, Dok.", T("skrining_pasangan")), ("Nggak ada yang sakit khusus, Dok, badan saja yang makin kurus dan lemas.", NT("skrining_pasangan"))],
    "impetigo": [("Di sekitar hidung, mulut, sama dagu, Dok.", NT("bulosa")), ("Di ketiak, badan, sama lipatan, Dok.", T("bulosa"))],
    "infeksi_umbilikus": [("Di pusarnya, Dok.", None)],
    "influenza": [("Badan pegal semua, Dok, kepala juga pusing.", None)],
    "insomnia": [("Nggak ada yang sakit, Dok, cuma susah tidur.", None)],
    "intoleransi_makanan": [("Perutnya kembung di tengah, Dok, sekitar pusar.", None)],
    "inverted_nipple": [("Puting yang kanan, Dok, masuk ke dalam.", None)],
    "kandidiasis_mulut": [("Di lidah dan bagian dalam pipi, Dok, ada putih-putih.", None)],
    "kandidosis_kutis": [("Di sela jari tangan, Dok.", T("interdigital_tangan")), ("Di lipatan bawah payudara dan lipat paha, Dok.", W(nt=["interdigital_tangan"], sex="female")),
                         ("Di lipat paha dan lipatan perut, Dok.", W(nt=["interdigital_tangan"], sex="male"))],
    "kehamilan_normal": [("Nggak ada yang sakit, Dok. Mau periksa kehamilan.", None)],
    "kejang_demam": [("Seluruh badannya kaku lalu kelojotan, Dok, kedua tangan dan kaki.", NT("kompleks")),
                     ("Mulainya di tangan kanan, Dok, terus seluruh badan.", T("kompleks"))],
    "keracunan_makanan": [("Perutnya mules di ulu hati sampai bawah, Dok.", None)],
    "konjungtivitis": [("Matanya, Dok, awalnya satu terus pindah ke yang satunya.", T("virus")), ("Dua-duanya, Dok.", NT("virus"))],
    "kusta": [("Di lengan kiri atas dan punggung, Dok.", NT("mb")), ("Di muka, badan, tangan, dan kaki, Dok, banyak.", T("mb"))],
    "laringitis": [("Di tenggorokan, Dok, suaranya serak.", None)],
    "lipoma": [("Di punggung kanan atas, Dok.", NT("multipel")), ("Ada beberapa, Dok, di punggung dan lengan.", T("multipel"))],
    "luka_bakar": [("Di dada, perut, dan kedua lengan, Dok.", T("luas")), ("Di betis kanan, Dok, kena knalpot.", W(t=["knalpot"], nt=["luas"])),
                   ("Di dada dan lengan kanan atas, Dok, kena air panas.", W(t=["tersiram_anak"], nt=["luas"])),
                   ("Di punggung tangan dan lengan bawah kiri, Dok.", W(nt=["luas", "knalpot", "tersiram_anak"]))],
    "mabuk_perjalanan": [("Bukan sakit di satu tempat, Dok. Perut mual dan kepala pusing kalau naik kendaraan.", None)],
    "malnutrisi_energi_protein": [("Nggak ada yang sakit, Dok. Badannya kurus, beratnya nggak naik-naik.", None)],
    "mata_kering": [("Dua-duanya, Dok, terasa kering, perih, kayak berpasir.", None)],
    "miliaria": [("Di leher, dada, punggung, dan lipatan, Dok.", NT("kristalina")), ("Di dahi, leher, sama badan atas, Dok.", T("kristalina"))],
    "miopia": [("Matanya, Dok, dua-duanya. Paling kabur kalau lihat papan tulis atau tulisan jauh.", None)],
    "napkin_eczema": [("Di pantat dan kemaluan, Dok, bagian yang kena popok.", NT("kandida")), ("Di pantat, kemaluan, sampai lipatan paha, Dok.", T("kandida"))],
    "obesitas": [("Nggak ada yang sakit, Dok, cuma berat badan terus naik. Lutut kadang pegal.", None)],
    "otitis_eksterna": [("Di telinga kanan, Dok, liangnya.", None)],
    "parafimosis": [("Di kepala kemaluan, Dok, kulupnya terjepit di belakang.", None)],
    "parotitis": [("Di depan telinga sampai rahang, Dok, dua-duanya.", T("bilateral")), ("Di depan telinga kanan sampai rahang, Dok.", NT("bilateral"))],
    "pedikulosis_kapitis": [("Di kepala bagian belakang dan belakang telinga, Dok.", None)],
    "pedikulosis_pubis": [("Di rambut kemaluan, Dok, sampai paha dalam.", None)],
    "perdarahan_subkonjungtiva": [("Di bagian putih mata, Dok, sebelah luar.", None)],
    "pertusis": [("Batuknya dari dada, Dok, sampai mukanya merah.", None)],
    "pielonefritis": [("Di pinggang kanan, Dok, sampai ke perut bawah.", None)],
    "pitiriasis_versikolor": [("Di punggung, dada, dan leher, Dok.", None)],
    "presbiopia": [("Matanya, Dok, dua-duanya, kalau baca tulisan kecil dari dekat.", None)],
    "reaksi_anafilaktik": [("Bentolnya di seluruh badan, Dok, muka, bibir, sampai tangan kaki.", None)],
    "rinitis_akut": [("Di hidung, Dok, dua-duanya mampet dan meler.", None)],
    "rinitis_alergi": [("Di hidung, Dok, mata juga ikut gatal.", None)],
    "rinitis_vasomotor": [("Di hidung, Dok, gantian kiri-kanan mampetnya.", None)],
    "ruptur_perineum": [("Di jalan lahir sampai dekat dubur, Dok, bekas melahirkan.", None)],
    "serumen_prop": [("Di telinga kanan, Dok.", None)],
    "sifilis": [("Di badan, Dok, sampai telapak tangan dan kaki.", T("stadium2")), ("Di kemaluan, Dok.", NT("stadium2"))],
    "skistosomiasis": [("Perut kanan atas dan ulu hati, Dok, kadang seluruh perut.", None)],
    "skrofuloderma": [("Di leher kanan, Dok.", None)],
    "strongiloidiasis": [("Di ulu hati, Dok.", T("dominan_ulu_hati")), ("Perutnya di sekitar pusar, Dok. Kadang di bokong ada garis gatal.", NT("dominan_ulu_hati"))],
    "taeniasis": [("Perutnya nggak enak di sekitar pusar, Dok. Dari dubur kadang keluar potongan cacing.", None)],
    "tetanus": [("Rahang kaku susah buka mulut, Dok, leher dan perut juga kaku.", None)],
    "tinea_barbae": [("Di janggut dan dagu, Dok.", None)],
    "tinea_fasialis": [("Di pipi kanan, Dok.", NT("steroid_topikal")), ("Di pipi kanan, Dok, sekarang melebar ke dagu.", T("steroid_topikal"))],
    "tinea_kapitis": [("Di kepala bagian belakang, Dok.", NT("kerion")), ("Di kepala bagian atas, Dok, bengkak bernanah.", T("kerion"))],
    "tinea_korporis": [("Di punggung dan lengan atas, Dok.", NT("luas")), ("Di badan, bokong, sampai kedua kaki, Dok.", T("luas"))],
    "tinea_unguium": [("Di kuku jempol dan telunjuk kaki, Dok, kanan dan kiri.", None)],
    "tonsilitis": [("Di tenggorokan, Dok, amandelnya, kanan dan kiri.", None)],
    "trikiasis": [("Di mata, Dok, kelopak bawah, rasanya ada yang menusuk.", None)],
    "ulkus_mulut": [("Di gusi, langit-langit, dan bibir, Dok.", T("herpetik")), ("Di bibir bagian dalam, Dok.", NT("herpetik"))],
    "ulkus_tungkai": [("Di atas mata kaki kiri, Dok, sebelah dalam.", None)],
    "uretritis_non_gonore": [("Dari ujung kemaluan, Dok.", NT("perempuan")), ("Dari jalan lahir, Dok.", T("perempuan"))],
    "urtikaria_akut": [("Di badan, lengan, sama kaki, Dok, pindah-pindah.", None)],
    "vaginitis": [("Di kemaluan, Dok, bibir luarnya merah dan gatal.", None)],
    "vaginosis_bakterialis": [("Dari jalan lahir, Dok, keputihan berbau.", None)],
    "vulnus": [("Di telapak kaki kanan, Dok.", T("punctum")), ("Di lengan bawah kanan, Dok.", NT("punctum"))],
    "vulvitis": [("Di kemaluan bagian luar, Dok.", None)],
}

by_id = {d["id"]: d for d in lib.DISEASES}
missing = [i for i in L if i not in by_id]
assert not missing, missing
for did, variants in L.items():
    d = by_id[did]
    traits = {t["id"] for t in d.get("traits", [])}
    out = []
    for text, when in variants:
        v = {"text": text}
        if when:
            for t in when.get("traits", []) + when.get("notTraits", []):
                assert t in traits, (did, t)
            v["when"] = when
        out.append(v)
    if "lokasi" not in d["anamnesis"]:
        d["anamnesis"]["lokasi"] = out
