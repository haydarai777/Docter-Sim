"""Perluasan formularium OSCE untuk 144 penyakit SKDI 4A.

Jalankan: python3 -I osce_formulary.py <repo>
Menambah kelas & obat baru (id yang sudah ada dilewati, sediaan baru ditambahkan ke obat lama).
"""
import json
import sys

REPO = sys.argv[1] if len(sys.argv) > 1 else "/home/user/Docter-Sim"
PATH = f"{REPO}/src/data/osce/formulary.json"

NEW_CLASSES = {
    "antivirus": "Antivirus",
    "arv": "Antiretrovirus (ARV)",
    "antijamur": "Antijamur oral",
    "antijamur_topikal": "Antijamur topikal",
    "antiparasit": "Antelmintik & antiparasit",
    "antiparasit_topikal": "Skabisida & pedikulisida",
    "antibiotik_topikal": "Antibiotik topikal",
    "kortikosteroid_topikal": "Kortikosteroid topikal",
    "dermatologi": "Obat kulit lain (keratolitik, akne, emolien, pelindung)",
    "luka": "Perawatan luka & antiseptik",
    "obat_mata": "Obat mata",
    "obat_telinga": "Obat telinga",
    "obat_hidung": "Obat hidung",
    "antihistamin": "Antihistamin",
    "antitusif": "Batuk & ekspektoran",
    "neurologi": "Obat saraf (antivertigo, antimigren, antikonvulsan)",
    "psikiatri": "Obat jiwa (ansiolitik, hipnotik, antidepresan)",
    "antihipertensi": "Antihipertensi",
    "hematinik": "Hematinik (zat besi & asam folat)",
    "antihiperurisemia": "Penurun asam urat",
    "insulin": "Insulin",
    "gawat_darurat": "Obat gawat darurat",
    "vaksin_serum": "Vaksin & serum",
    "kusta": "Multi Drug Therapy (MDT) kusta",
    "antidiare": "Antidiare & probiotik",
    "laksatif": "Pencahar & obat wasir",
    "obat_vagina": "Obat vagina",
    "uterotonika": "Uterotonika",
}

NEW_ALLERGY = {}  # alergi populasi tetap; golongan baru cukup diberi groups yang sama (penisilin, sulfa, oains)


def form(id, label, strength, unit, du, route, package=None):
    f = {"id": id, "label": label, "strength": strength, "unit": unit, "dosageUnit": du, "route": route}
    if package:
        f["package"] = package
    return f


def tab(id, mg, label=None, du="tablet", route="oral"):
    return form(id, label or f"tab {str(mg).replace('.', ',')} mg", mg, "mg", du, route)


def kap(id, mg, label=None):
    return form(id, label or f"kaps {str(mg).replace('.', ',')} mg", mg, "mg", "kapsul", "oral")


def syr(id, mg, label):
    return form(id, label, mg, "mg", "sendok takar 5 mL", "oral", package=12)


def krim(id, label, package=30, du="oles", unit="oles"):
    """Topikal: 1 satuan = 1 kali oles; satu tube ± `package` kali oles."""
    return form(id, label, 1, unit, du, "topikal", package=package)


def tetes(id, label, route, package=100):
    return form(id, label, 1, "tetes", "tetes", route, package=package)


def D(id, name, cls, forms, aliases=None, groups=None, maxDaily=None, note=None):
    d = {"id": id, "name": name}
    if aliases:
        d["aliases"] = aliases
    d["class"] = cls
    if groups:
        d["groups"] = groups
    d["forms"] = forms
    if maxDaily:
        d["maxDaily"] = maxDaily
    if note:
        d["note"] = note
    return d


DRUGS = [
    # ---------------- analgesik & tambahan sediaan obat lama
    D("parasetamol", "Parasetamol", "analgesik", [form("parasetamol-drop", "drops 100 mg/mL (15 mL)", 100, "mg", "mL", "oral", package=15)]),
    D("ibuprofen", "Ibuprofen", "oains", [syr("ibuprofen-syr", 100, "sirup 100 mg/5 mL"), tab("ibuprofen-tab200", 200)]),
    D("amoksisilin", "Amoksisilin", "antibiotik", [syr("amoksisilin-syr125", 125, "sirup kering 125 mg/5 mL"), syr("amoksisilin-syr250", 250, "sirup kering forte 250 mg/5 mL")]),
    D("kotrimoksazol", "Kotrimoksazol", "antibiotik", [syr("kotrimoksazol-syr", 240, "suspensi 240 mg/5 mL")]),
    D("sefiksim", "Sefiksim", "antibiotik", [kap("sefiksim-kap200", 200)]),
    D("metilprednisolon", "Metilprednisolon", "kortikosteroid", [tab("metilprednisolon-tab16", 16)]),
    D("prednison", "Prednison", "kortikosteroid", [tab("prednison-tab20", 20, "tab 20 mg")]),
    D("oralit", "Oralit", "vitamin", []),
    # ---------------- antibiotik oral & injeksi
    D("amoksisilin_klavulanat", "Amoksisilin-klavulanat", "antibiotik", [tab("amoksiklav-tab625", 625, "tab 625 mg (500/125)")],
      aliases=["Co-amoxiclav", "Amoksiklav"], groups=["penisilin"]),
    D("eritromisin", "Eritromisin", "antibiotik", [tab("eritromisin-tab500", 500), syr("eritromisin-syr200", 200, "sirup 200 mg/5 mL")], groups=["makrolid"], maxDaily=4000),
    D("azitromisin", "Azitromisin", "antibiotik", [syr("azitromisin-syr200", 200, "sirup kering 200 mg/5 mL")]),
    D("sefadroksil", "Sefadroksil", "antibiotik", [kap("sefadroksil-kap500", 500), syr("sefadroksil-syr125", 125, "sirup 125 mg/5 mL")], groups=["sefalosporin"]),
    D("dikloksasilin", "Dikloksasilin", "antibiotik", [kap("dikloksasilin-kap250", 250)], aliases=["Kloksasilin", "Flukloksasilin"], groups=["penisilin"]),
    D("doksisiklin", "Doksisiklin", "antibiotik", [kap("doksisiklin-kap100", 100)], groups=["tetrasiklin"], note="Kontraindikasi: hamil, menyusui, anak < 8 tahun."),
    D("tetrasiklin", "Tetrasiklin", "antibiotik", [kap("tetrasiklin-kap250", 250), kap("tetrasiklin-kap500", 500)], groups=["tetrasiklin"]),
    D("metronidazol", "Metronidazol", "antibiotik", [tab("metronidazol-tab500", 500), syr("metronidazol-syr125", 125, "suspensi 125 mg/5 mL")], aliases=["Flagyl"]),
    D("klindamisin", "Klindamisin", "antibiotik", [kap("klindamisin-kap300", 300), kap("klindamisin-kap150", 150)]),
    D("seftriakson", "Seftriakson", "antibiotik", [form("seftriakson-vial1g", "vial 1 g (injeksi)", 1000, "mg", "vial", "intramuskular")], groups=["sefalosporin"]),
    D("benzatin_penisilin", "Benzatin penisilin G", "antibiotik", [form("bpg-vial24", "vial 2,4 juta IU (injeksi IM)", 2400000, "IU", "vial", "intramuskular")],
      aliases=["Benzathine penicillin", "BPG"], groups=["penisilin"]),
    D("dapson", "Dapson", "antibiotik", [tab("dapson-tab100", 100)], groups=["sulfon"], note="Alternatif profilaksis PCP bila alergi kotrimoksazol."),
    D("ampisilin", "Ampisilin", "antibiotik", [form("ampisilin-vial1g", "vial 1 g (injeksi)", 1000, "mg", "vial", "intravena")], groups=["penisilin"]),
    D("gentamisin_inj", "Gentamisin injeksi", "antibiotik", [form("gentamisin-amp80", "ampul 80 mg/2 mL", 80, "mg", "ampul", "intramuskular")], groups=["aminoglikosida"]),
    D("doksisiklin_profilaksis", "Doksisiklin (profilaksis)", "antibiotik", [], groups=["tetrasiklin"]),
    # ---------------- antivirus & ARV
    D("asiklovir", "Asiklovir", "antivirus", [tab("asiklovir-tab400", 400), tab("asiklovir-tab800", 800), syr("asiklovir-syr200", 200, "suspensi 200 mg/5 mL")], aliases=["Acyclovir"], maxDaily=4000),
    D("asiklovir_krim", "Asiklovir krim 5%", "antivirus", [krim("asiklovir-krim5", "krim 5% (5 g)", package=25)]),
    D("tle", "Tenofovir-lamivudin-efavirenz (TLE)", "arv", [tab("tle-tab", 1, "tab KDT 300/300/600 mg")], aliases=["ARV KDT", "TDF/3TC/EFV"]),
    D("tld", "Tenofovir-lamivudin-dolutegravir (TLD)", "arv", [tab("tld-tab", 1, "tab KDT 300/300/50 mg")], aliases=["TDF/3TC/DTG"]),
    # ---------------- antijamur
    D("griseofulvin", "Griseofulvin", "antijamur", [tab("griseofulvin-tab500", 500, "tab 500 mg (fine)"), tab("griseofulvin-tab125", 125, "tab 125 mg (fine)")]),
    D("terbinafin", "Terbinafin", "antijamur", [tab("terbinafin-tab250", 250)]),
    D("itrakonazol", "Itrakonazol", "antijamur", [kap("itrakonazol-kap100", 100)], maxDaily=400),
    D("flukonazol", "Flukonazol", "antijamur", [kap("flukonazol-kap150", 150), kap("flukonazol-kap50", 50)]),
    D("ketokonazol_tab", "Ketokonazol tablet", "antijamur", [tab("ketokonazol-tab200", 200)], note="Hepatotoksik — tidak dianjurkan untuk infeksi jamur kulit superfisial."),
    D("nistatin", "Nistatin suspensi oral", "antijamur", [form("nistatin-susp", "suspensi 100.000 IU/mL (12 mL)", 100000, "IU", "mL", "oral", package=12)], aliases=["Mycostatin"]),
    D("mikonazol_krim", "Mikonazol krim 2%", "antijamur_topikal", [krim("mikonazol-krim2", "krim 2% (10 g)")], aliases=["Mikonazol", "Daktarin"]),
    D("ketokonazol_krim", "Ketokonazol krim 2%", "antijamur_topikal", [krim("ketokonazol-krim2", "krim 2% (10 g)")]),
    D("klotrimazol_krim", "Klotrimazol krim 1%", "antijamur_topikal", [krim("klotrimazol-krim1", "krim 1% (10 g)")]),
    D("terbinafin_krim", "Terbinafin krim 1%", "antijamur_topikal", [krim("terbinafin-krim1", "krim 1% (10 g)")]),
    D("ketokonazol_sampo", "Ketokonazol sampo 2%", "antijamur_topikal", [krim("ketokonazol-sampo", "sampo 2% (60 mL)", package=12, du="kali keramas", unit="oles")]),
    D("selenium_sulfida", "Selenium sulfida sampo 1,8%", "antijamur_topikal", [krim("selsun-sampo", "sampo/losio 1,8% (60 mL)", package=12, du="kali pakai", unit="oles")], aliases=["Selsun"]),
    D("klotrimazol_vagina", "Klotrimazol tablet vagina", "obat_vagina", [form("klotrimazol-vag500", "tab vagina 500 mg", 500, "mg", "tablet vagina", "vaginal"), form("klotrimazol-vag100", "tab vagina 100 mg", 100, "mg", "tablet vagina", "vaginal")]),
    # ---------------- antiparasit
    D("albendazol", "Albendazol", "antiparasit", [tab("albendazol-tab400", 400), syr("albendazol-syr", 200, "suspensi 200 mg/5 mL")]),
    D("mebendazol", "Mebendazol", "antiparasit", [tab("mebendazol-tab100", 100), tab("mebendazol-tab500", 500)]),
    D("pirantel", "Pirantel pamoat", "antiparasit", [tab("pirantel-tab125", 125, "tab 125 mg (basa)")]),
    D("ivermektin", "Ivermektin", "antiparasit", [tab("ivermektin-tab12", 12), tab("ivermektin-tab3", 3)]),
    D("prazikuantel", "Prazikuantel", "antiparasit", [tab("prazikuantel-tab600", 600)]),
    D("dec", "Dietilkarbamazin (DEC)", "antiparasit", [tab("dec-tab100", 100)], aliases=["DEC", "Diethylcarbamazine"]),
    D("permetrin_krim", "Permetrin krim 5%", "antiparasit_topikal", [krim("permetrin-krim5", "krim 5% (30 g)", package=1, du="kali oles seluruh tubuh", unit="oles")], aliases=["Permetrin", "Scabimite"]),
    D("permetrin_losion", "Permetrin losion 1%", "antiparasit_topikal", [krim("permetrin-losion1", "losion/sampo 1% (60 mL)", package=1, du="kali pakai", unit="oles")]),
    # ---------------- antihistamin, batuk, hidung
    D("setirizin", "Setirizin", "antihistamin", [tab("setirizin-tab10", 10), syr("setirizin-syr", 5, "sirup 5 mg/5 mL")], aliases=["Cetirizine"]),
    D("loratadin", "Loratadin", "antihistamin", [tab("loratadin-tab10", 10)]),
    D("ctm", "Klorfeniramin maleat (CTM)", "antihistamin", [tab("ctm-tab4", 4)], aliases=["CTM", "Chlorpheniramine"], maxDaily=24),
    D("difenhidramin", "Difenhidramin injeksi", "antihistamin", [form("difenhidramin-amp10", "ampul 10 mg/mL", 10, "mg", "ampul", "intramuskular")]),
    D("dimenhidrinat", "Dimenhidrinat", "antihistamin", [tab("dimenhidrinat-tab50", 50)], aliases=["Antimo", "Dramamine"], maxDaily=400),
    D("gg", "Gliseril guaiakolat", "antitusif", [tab("gg-tab100", 100)], aliases=["GG", "Guaifenesin"]),
    D("dekstrometorfan", "Dekstrometorfan", "antitusif", [tab("dmp-tab15", 15)], aliases=["DMP"]),
    D("pseudoefedrin", "Pseudoefedrin", "obat_hidung", [tab("pseudoefedrin-tab60", 60)], maxDaily=240),
    D("oksimetazolin", "Oksimetazolin semprot hidung 0,05%", "obat_hidung", [form("oksimetazolin-spray", "semprot hidung 0,05% (10 mL)", 1, "semprot", "semprot tiap lubang", "semprot_hidung", package=60)]),
    D("mometason_nasal", "Mometason furoat semprot hidung", "obat_hidung", [form("mometason-nasal", "semprot hidung 50 mcg/semprot (120 semprot)", 50, "mcg", "semprot", "semprot_hidung", package=120)], aliases=["Steroid semprot hidung", "Flutikason semprot"]),
    D("nacl_nasal", "NaCl 0,9% cuci/semprot hidung", "obat_hidung", [form("nacl-nasal", "larutan NaCl 0,9% (semprot)", 1, "semprot", "semprot tiap lubang", "semprot_hidung", package=100)]),
    # ---------------- mata
    D("kloramfenikol_tm", "Kloramfenikol tetes mata 0,5%", "obat_mata", [tetes("kloramfenikol-tm", "tetes mata 0,5% (5 mL)", "tetes_mata")], aliases=["Cendo fenicol"]),
    D("kloramfenikol_sm", "Kloramfenikol salep mata 1%", "obat_mata", [form("kloramfenikol-sm", "salep mata 1% (3,5 g)", 1, "oles", "oles", "tetes_mata", package=30)]),
    D("gentamisin_tm", "Gentamisin tetes mata 0,3%", "obat_mata", [tetes("gentamisin-tm", "tetes mata 0,3% (5 mL)", "tetes_mata")], groups=["aminoglikosida"]),
    D("levofloksasin_tm", "Levofloksasin tetes mata 0,5%", "obat_mata", [tetes("levofloksasin-tm", "tetes mata 0,5% (5 mL)", "tetes_mata")], groups=["kuinolon"]),
    D("air_mata_buatan", "Air mata buatan", "obat_mata", [tetes("airmata-tm", "tetes mata (15 mL)", "tetes_mata", package=300)], aliases=["Artificial tears", "Hidroksipropil metilselulosa", "Cendo lyteers"]),
    D("olopatadin_tm", "Olopatadin tetes mata 0,1%", "obat_mata", [tetes("olopatadin-tm", "tetes mata 0,1% (5 mL)", "tetes_mata")], aliases=["Antihistamin tetes mata"]),
    D("fluorometolon_tm", "Fluorometolon tetes mata 0,1%", "obat_mata", [tetes("fml-tm", "tetes mata 0,1% (5 mL)", "tetes_mata")], aliases=["FML", "Steroid tetes mata"], groups=["steroid_mata"]),
    D("deksametason_tm", "Deksametason-neomisin tetes mata", "obat_mata", [tetes("deksa-tm", "tetes mata (5 mL)", "tetes_mata")], aliases=["Steroid-antibiotik tetes mata"], groups=["steroid_mata"]),
    D("vitamin_a", "Vitamin A kapsul", "vitamin", [form("vita-100rb", "kapsul 100.000 IU (biru)", 100000, "IU", "kapsul", "oral"), form("vita-200rb", "kapsul 200.000 IU (merah)", 200000, "IU", "kapsul", "oral")]),
    # ---------------- telinga
    D("ofloksasin_tt", "Ofloksasin tetes telinga 0,3%", "obat_telinga", [tetes("ofloksasin-tt", "tetes telinga 0,3% (5 mL)", "tetes_telinga")], groups=["kuinolon"]),
    D("karbogliserin", "Karbogliserin 10% tetes telinga", "obat_telinga", [tetes("karbogliserin-tt", "tetes telinga 10% (10 mL)", "tetes_telinga", package=200)], aliases=["Carbolic glycerin", "Pelunak serumen"]),
    # ---------------- kulit
    D("hidrokortison_krim", "Hidrokortison krim", "kortikosteroid_topikal", [krim("hidrokortison-krim1", "krim 1% (5 g)"), krim("hidrokortison-krim25", "krim 2,5% (5 g)")], groups=["steroid_topikal"]),
    D("betametason_krim", "Betametason valerat krim 0,1%", "kortikosteroid_topikal", [krim("betametason-krim01", "krim 0,1% (5 g)")], groups=["steroid_topikal"]),
    D("mometason_krim", "Mometason furoat krim 0,1%", "kortikosteroid_topikal", [krim("mometason-krim01", "krim 0,1% (10 g)")], groups=["steroid_topikal"]),
    D("mupirosin", "Mupirosin salep 2%", "antibiotik_topikal", [krim("mupirosin-salep2", "salep 2% (5 g)")]),
    D("asam_fusidat", "Asam fusidat krim 2%", "antibiotik_topikal", [krim("fusidat-krim2", "krim 2% (5 g)")], aliases=["Fucidin"]),
    D("klindamisin_gel", "Klindamisin gel 1%", "antibiotik_topikal", [krim("klindamisin-gel1", "gel 1% (15 g)")]),
    D("metronidazol_gel", "Metronidazol gel 0,75%", "antibiotik_topikal", [krim("metronidazol-gel", "gel/krim 0,75% (15 g)")]),
    D("eritromisin_topikal", "Eritromisin gel 2%", "antibiotik_topikal", [krim("eritromisin-gel2", "gel 2% (15 g)")]),
    D("tretinoin", "Tretinoin krim 0,025%", "dermatologi", [krim("tretinoin-krim", "krim 0,025% (20 g)")], aliases=["Retinoid topikal", "Asam retinoat"]),
    D("benzoil_peroksida", "Benzoil peroksida gel", "dermatologi", [krim("bpo-gel25", "gel 2,5% (15 g)"), krim("bpo-gel5", "gel 5% (15 g)")]),
    D("asam_salisilat", "Asam salisilat", "dermatologi", [krim("salisilat-salep", "salep 3–5% (bedak/salep)"), krim("salisilat-veruka", "larutan kutil 16,7% + asam laktat (10 mL)", package=60)]),
    D("kalamin", "Losion kalamin", "dermatologi", [krim("kalamin-losion", "losion kalamin (60 mL)", package=30)], aliases=["Caladine"]),
    D("zinc_oxide", "Salep zinc oxide", "dermatologi", [krim("zno-salep", "salep/pasta ZnO 10% (25 g)", package=40)], aliases=["Pasta ZnO", "Salep pelindung"]),
    D("emolien", "Emolien (urea/vaselin)", "dermatologi", [krim("urea-krim10", "krim urea 10% (40 g)", package=40), krim("vaselin", "vaselin album (25 g)", package=40)], aliases=["Pelembap", "Vaselin", "Urea krim"]),
    D("perak_sulfadiazin", "Perak sulfadiazin krim 1%", "luka", [krim("ssd-krim1", "krim 1% (25 g)", package=10)], aliases=["Silver sulfadiazine", "Burnazin"], groups=["sulfa"]),
    D("povidon_iodin", "Povidon iodin 10%", "luka", [krim("pvp-larutan", "larutan 10% (30 mL)", package=30)], aliases=["Betadine"]),
    D("kompres_nacl", "NaCl 0,9% untuk kompres", "luka", [krim("nacl-kompres", "larutan NaCl 0,9% (500 mL)", package=20, du="kali kompres", unit="oles")]),
    # ---------------- saraf & jiwa
    D("diazepam_rektal", "Diazepam rektal", "neurologi", [form("diazepam-rek5", "tube rektal 5 mg", 5, "mg", "tube rektal", "rektal"), form("diazepam-rek10", "tube rektal 10 mg", 10, "mg", "tube rektal", "rektal")], aliases=["Stesolid"], groups=["benzodiazepin"]),
    D("diazepam", "Diazepam", "psikiatri", [tab("diazepam-tab2", 2), tab("diazepam-tab5", 5), form("diazepam-amp10", "ampul 10 mg/2 mL", 10, "mg", "ampul", "intravena")], groups=["benzodiazepin"]),
    D("lorazepam", "Lorazepam", "psikiatri", [tab("lorazepam-tab05", 0.5), tab("lorazepam-tab1", 1)], groups=["benzodiazepin"]),
    D("amitriptilin", "Amitriptilin", "psikiatri", [tab("amitriptilin-tab25", 25)]),
    D("fluoksetin", "Fluoksetin", "psikiatri", [kap("fluoksetin-kap20", 20)], aliases=["SSRI"]),
    D("betahistin", "Betahistin", "neurologi", [tab("betahistin-tab6", 6), tab("betahistin-tab24", 24)], maxDaily=48),
    D("flunarizin", "Flunarizin", "neurologi", [kap("flunarizin-kap5", 5)]),
    D("propranolol", "Propranolol", "antihipertensi", [tab("propranolol-tab10", 10)], groups=["penyekat_beta"]),
    # ---------------- kardiovaskular, metabolik
    D("amlodipin", "Amlodipin", "antihipertensi", [tab("amlodipin-tab5", 5), tab("amlodipin-tab10", 10)], maxDaily=10),
    D("kaptopril", "Kaptopril", "antihipertensi", [tab("kaptopril-tab25", 25)], groups=["ace_inhibitor"]),
    D("lisinopril", "Lisinopril", "antihipertensi", [tab("lisinopril-tab10", 10)], groups=["ace_inhibitor"]),
    D("hidroklorotiazid", "Hidroklorotiazid", "antihipertensi", [tab("hct-tab25", 25)], aliases=["HCT", "HCTZ"], groups=["tiazid"]),
    D("kandesartan", "Kandesartan", "antihipertensi", [tab("kandesartan-tab8", 8)], groups=["arb"]),
    D("alopurinol", "Alopurinol", "antihiperurisemia", [tab("alopurinol-tab100", 100), tab("alopurinol-tab300", 300)], maxDaily=900),
    D("kolkisin", "Kolkisin", "antihiperurisemia", [tab("kolkisin-tab05", 0.5)]),
    D("gemfibrozil", "Gemfibrozil", "statin", [kap("gemfibrozil-kap300", 300)], groups=["fibrat"]),
    D("insulin_nph", "Insulin NPH (kerja menengah)", "insulin", [form("insulin-nph", "pen 100 IU/mL (3 mL)", 1, "IU", "unit", "subkutan", package=300)]),
    D("insulin_reguler", "Insulin reguler (kerja pendek)", "insulin", [form("insulin-reg", "pen 100 IU/mL (3 mL)", 1, "IU", "unit", "subkutan", package=300)]),
    D("dekstrosa", "Dekstrosa 40%", "gawat_darurat", [form("d40-flakon", "flakon 25 mL (10 g)", 10, "g", "flakon", "intravena")], aliases=["D40", "Glukosa 40%"]),
    D("adrenalin", "Adrenalin (epinefrin) 1 mg/mL", "gawat_darurat", [form("adrenalin-amp1", "ampul 1 mg/mL", 1, "mg", "mL", "intramuskular")], aliases=["Epinefrin"], maxDaily=1.5),
    D("htig", "Human tetanus immunoglobulin (HTIG)", "vaksin_serum", [form("htig-250", "vial 250 IU", 250, "IU", "vial", "intramuskular")], aliases=["Imunoglobulin tetanus"]),
    D("toksoid_tetanus", "Vaksin tetanus-difteri (Td)", "vaksin_serum", [form("td-amp", "ampul 0,5 mL", 0.5, "mL", "ampul", "intramuskular")], aliases=["TT", "Toksoid tetanus", "Td"]),
    # ---------------- darah & vitamin
    D("sulfas_ferosus", "Sulfas ferosus", "hematinik", [tab("sf-tab300", 300, "tab 300 mg (Fe elemental 60 mg)"), syr("sf-syr", 15, "sirup besi elemental 15 mg/5 mL")], aliases=["Tablet tambah darah", "Ferrous sulfate", "Zat besi"]),
    D("tablet_tambah_darah", "Tablet tambah darah (Fe 60 mg + asam folat 0,4 mg)", "hematinik", [tab("ttd-tab", 60, "tab Fe elemental 60 mg + asam folat 400 mcg")], aliases=["TTD"]),
    D("asam_folat", "Asam folat", "hematinik", [tab("asamfolat-tab1", 1, "tab 1 mg"), tab("asamfolat-tab04", 0.4, "tab 400 mcg")]),
    D("kalsium", "Kalsium karbonat", "vitamin", [tab("kalsium-tab500", 500)]),
    D("vitamin_b_kompleks", "Vitamin B kompleks", "vitamin", [tab("bkompleks-tab", 1, "tab")], aliases=["Neurobion", "Vitamin B1 B6 B12"]),
    D("tiamin", "Tiamin (vitamin B1)", "vitamin", [tab("tiamin-tab50", 50)]),
    D("vitamin_c", "Vitamin C", "vitamin", [tab("vitc-tab100", 100)]),
    D("zinc", "Zinc", "antidiare", [tab("zinc-tab20", 20, "tab dispersibel 20 mg")], aliases=["Zinkid"]),
    D("kalium_iodida", "Iodium (kapsul minyak beriodium)", "vitamin", [form("iodium-kap200", "kapsul 200 mg", 200, "mg", "kapsul", "oral")]),
    D("f100", "Formula terapeutik F-75/F-100", "vitamin", [form("f75", "F-75 (sachet)", 1, "sachet", "sachet", "oral")], aliases=["F-100", "F-75", "RUTF"]),
    # ---------------- GI
    D("loperamid", "Loperamid", "antidiare", [tab("loperamid-tab2", 2)], maxDaily=16),
    D("laktulosa", "Laktulosa", "laksatif", [form("laktulosa-syr", "sirup 3,3 g/5 mL (60 mL)", 3.3, "g", "sendok takar 5 mL", "oral", package=12)]),
    D("bisakodil", "Bisakodil", "laksatif", [tab("bisakodil-tab5", 5)]),
    D("supp_hemoroid", "Supositoria hemoroid (lidokain-steroid)", "laksatif", [form("supp-hemoroid", "supositoria", 1, "paket", "supositoria", "rektal")], aliases=["Ultraproct", "Anusol"]),
    D("triamsinolon_orabase", "Triamsinolon asetonid 0,1% in orabase", "dermatologi", [krim("triamsinolon-orabase", "pasta gigi/oral 0,1% (5 g)")], aliases=["Kenalog in orabase", "Steroid oral topikal"]),
    D("klorheksidin_kumur", "Klorheksidin 0,2% obat kumur", "dermatologi", [form("klorheksidin-kumur", "obat kumur 0,2% (150 mL)", 1, "oles", "kali kumur (10 mL)", "topikal", package=15)], aliases=["Minosep", "Obat kumur antiseptik"]),
    D("ampisilin", "Ampisilin", "antibiotik", [form("ampisilin-larutan", "vial 1 g dilarutkan 4 mL (250 mg/mL)", 250, "mg", "mL", "intramuskular")], groups=["penisilin"]),
    D("gentamisin_inj", "Gentamisin injeksi", "antibiotik", [form("gentamisin-ml", "ampul 80 mg/2 mL (40 mg/mL)", 40, "mg", "mL", "intramuskular")], groups=["aminoglikosida"]),
    D("seftriakson", "Seftriakson", "antibiotik", [form("seftriakson-ml", "vial 1 g dilarutkan 4 mL (250 mg/mL)", 250, "mg", "mL", "intramuskular")], groups=["sefalosporin"]),
    D("sefiksim", "Sefiksim", "antibiotik", [syr("sefiksim-syr", 100, "sirup kering 100 mg/5 mL")]),
    D("oralit", "Oralit", "vitamin", []),
    D("vitamin_c", "Vitamin C", "vitamin", [tab("vitc-tab500", 500)]),
    D("oat_kdt_anak", "OAT KDT anak fase intensif (RHZ 75/50/150 mg)", "oat", [form("oat-anak-rhz", "tab dispersibel RHZ 75/50/150 mg", 1, "tablet", "tablet", "oral")], aliases=["KDT anak", "OAT anak"]),
    D("metoklopramid", "Metoklopramid", "prokinetik", []),
    # ---------------- obstetri
    D("oksitosin", "Oksitosin", "uterotonika", [form("oksitosin-amp10", "ampul 10 IU/mL", 10, "IU", "ampul", "intramuskular")]),
    D("metilergometrin", "Metilergometrin", "uterotonika", [tab("metergin-tab0125", 0.125)]),
    # ---------------- kusta (paket MDT per hari; 1 blister = 28 hari)
    D("mdt_pb", "MDT-PB dewasa (rifampisin + dapson)", "kusta", [form("mdt-pb-dewasa", "blister PB dewasa (28 dosis)", 1, "paket", "dosis harian", "oral", package=28)], aliases=["MDT PB"]),
    D("mdt_mb", "MDT-MB dewasa (rifampisin + klofazimin + dapson)", "kusta", [form("mdt-mb-dewasa", "blister MB dewasa (28 dosis)", 1, "paket", "dosis harian", "oral", package=28)], aliases=["MDT MB"]),
]


def main():
    data = json.load(open(PATH))
    data["classes"].update({k: v for k, v in NEW_CLASSES.items() if k not in data["classes"]})
    by_id = {d["id"]: d for d in data["drugs"]}
    for d in DRUGS:
        if d["id"] in by_id:
            existing = by_id[d["id"]]
            have = {f["id"] for f in existing["forms"]}
            existing["forms"].extend(f for f in d["forms"] if f["id"] not in have)
            continue
        if not d["forms"]:
            continue
        data["drugs"].append(d)
        by_id[d["id"]] = d
    forms = [f["id"] for d in data["drugs"] for f in d["forms"]]
    assert len(forms) == len(set(forms)), [f for f in forms if forms.count(f) > 1]
    data["review"]["notes"] = [
        "Formularium latihan OSCE: sediaan umum di Indonesia (Fornas/obat generik). Bukan daftar obat lengkap.",
        "Kekuatan sediaan dipakai untuk menghitung dosis per kali dari jumlah tablet/puff/tetes yang ditulis pemain.",
        "Topikal & tetes: 1 satuan = 1 kali oles/tetes; jumlah kemasan dihitung dari perkiraan pemakaian per tube/botol.",
    ]
    json.dump(data, open(PATH, "w"), ensure_ascii=False, indent=2)
    print("obat:", len(data["drugs"]), "sediaan:", len(forms))


if __name__ == "__main__":
    main()
