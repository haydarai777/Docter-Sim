"""Tulis konten batch SKDI 4A ke src/data. Jalankan: python3 -I build.py b_mata b_tht ...  (atau tanpa argumen = semua)"""
import glob
import importlib
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import lib  # noqa: E402

batches = sys.argv[1:] or sorted(os.path.basename(p)[:-3] for p in glob.glob(f"{HERE}/b_*.py"))
for b in batches:
    importlib.import_module(b)

DATA = lib.DATA


def load(name):
    return json.load(open(f"{DATA}/{name}"))


def save(name, data):
    json.dump(data, open(f"{DATA}/{name}", "w"), ensure_ascii=False, indent=2)


# 1. gejala --------------------------------------------------------------------
sym = load("symptoms.json")
by = {s["id"]: i for i, s in enumerate(sym["symptoms"])}
for sid, d in lib.SYMPTOMS.items():
    if sid in by:
        sym["symptoms"][by[sid]] = d
    else:
        sym["symptoms"].append(d)
# "ruam"/"bercak merah" kini milik ruam_kulit (bukan petekie).
for s in sym["symptoms"]:
    if s["id"] == "bintik_merah" and "ruam_kulit" in lib.SYMPTOMS:
        s["keywords"] = [k for k in s["keywords"] if k not in ("ruam", "bercak merah")]
        s["phrases"]["vague"] = ["kulit saya ada bintik-bintik halus"]
    # "BAB berdarah" kini milik bab_darah (darah merah/lendir); bab_hitam = melena.
    if s["id"] == "bab_hitam" and "bab_darah" in lib.SYMPTOMS:
        s["keywords"] = [k for k in s["keywords"] if k not in ("bab berdarah", "berak darah")]
# Kata kunci tambahan agar pertanyaan baku tiap gejala (dan rumusan umum dokter) dipahami
# sebagai gejala itu — bukan topik lain atau gejala yang lebih umum.
EXTRA_KEYWORDS = {
    "heartburn": ["terbakar di dada", "panas atau terbakar di dada", "panas terbakar di dada"],
    "batuk_darah": ["batuk keluar darah", "batuk ada darah", "batuk bercampur darah"],
    "disuria": ["perih saat buang air kecil", "sakit saat buang air kecil", "nyeri saat buang air kecil", "sakit atau perih saat buang air kecil", "sakit atau perih saat kencing"],
    "bab_hitam": ["bab berwarna hitam", "hitam seperti aspal", "seperti aspal", "berak berwarna hitam"],
    "kabur_jauh": ["melihat benda yang jauh", "melihat benda jauh", "lihat benda jauh", "sulit melihat jauh", "susah melihat jauh", "pandangan jauh kabur"],
    "rabun_senja": ["melihat saat senja", "saat senja", "kalau senja", "tempat gelap", "melihat di tempat gelap", "melihat malam hari", "sulit melihat malam"],
    "bercak_darah_mata": ["darah di putih mata", "merah di putih mata", "bercak merah seperti darah", "bagian putih mata merah", "putih mata ada darah"],
    "hidung_bengkak_nyeri": ["nyeri di hidung", "bisul yang nyeri di hidung", "bengkak atau bisul di hidung", "hidung sakit dan bengkak"],
    "mata_tidak_menutup": ["mata tidak bisa menutup rapat", "tidak bisa menutup rapat", "mata bisa ditutup rapat", "ditutup rapat", "menutup rapat", "mata menutup rapat"],
    "gatal_anus": ["gatal di sekitar dubur", "dubur terasa gatal", "gatal di sekitar anus"],
    "perut_membuncit": ["perut makin membesar", "perut makin buncit", "perut membesar atau buncit"],
    "rewel": ["rewel atau menangis", "sering rewel", "menangis terus menerus"],
    "malas_menyusu": ["malas menyusu atau malas minum", "malas menyusu atau minum", "malas minum", "susah menyusu", "nggak mau menyusu", "kuat menyusu"],
    "bb_tidak_naik": ["berat badan susah naik", "susah naik berat badan", "berat badan tidak bertambah", "berat badan naik sesuai umur", "berat badan sesuai umur"],
    "gatal_kemaluan": ["gatal di daerah kemaluan", "gatal di area kemaluan", "gatal di kelamin", "kelamin gatal"],
    "nyeri_senggama": ["berhubungan suami istri", "nyeri saat berhubungan suami istri", "sakit saat berhubungan suami istri", "sakit waktu berhubungan suami istri", "nyeri saat bersenggama", "sakit saat bersenggama"],
    "sendi_bengkak": ["sendi yang bengkak", "sendi bengkak merah", "sendi yang bengkak merah", "bengkak di persendian"],
    "benjolan_leher_depan": ["benjolan di leher bagian depan", "leher bagian depan", "benjolan leher depan"],
    "bengkak_bibir_mata": ["bibir atau kelopak mata bengkak", "bibir atau mata bengkak", "bibir dan kelopak mata bengkak", "bibir atau kelopak matanya bengkak"],
    "benjolan_kelopak": ["benjolan atau bengkak di kelopak mata", "bengkak di kelopak mata", "benjolan di kelopak mata", "kelopak mata bengkak", "kelopak mata membengkak"],
    "gatal_malam": ["gatal lebih berat di malam hari", "gatal lebih berat malam hari", "gatal lebih berat malam", "gatal makin berat malam", "gatal terutama malam", "gatal paling berat malam"],
    "bercak_mati_rasa": ["kulit yang terasa baal", "bercak yang baal", "bercak yang mati rasa", "bercak di kulit yang mati rasa", "bercak di kulit yang terasa baal", "kulit terasa baal"],
    "lepuh_bibir": ["lepuh kecil berkelompok di bibir", "berkelompok di bibir", "lepuh kecil di bibir", "bintil berair di bibir"],
    "bintik_merah": ["bintik merah di kulit", "bintik bintik merah di kulit", "bintik merah di badan"],
    "kencing_merah": ["kencing kemerahan", "air kencing kemerahan", "kencing berwarna merah", "kencing warna merah", "pipis kemerahan"],
    "perdarahan_pervaginam": ["keluar darah dari jalan lahir", "darah dari jalan lahir", "berdarah dari jalan lahir"],
    "kabur_dekat": ["baca dekat kabur", "dekat kabur", "baca dekat", "lihat dekat kabur"],
    "bintil_bernanah": ["bernanah", "ada nanah"],
    "kulup_sempit": ["kulup susah ditarik", "kulup penis susah ditarik", "susah ditarik ke belakang", "menggelembung saat kencing", "kulup menggelembung"],
    "nyeri_luka": ["bagian yang cedera terasa nyeri", "bagian yang cedera", "yang cedera terasa nyeri", "cedera terasa nyeri", "cedera sakit", "luka terasa nyeri", "lukanya nyeri", "bekas luka sakit"],
}
for s in sym["symptoms"]:
    for k in EXTRA_KEYWORDS.get(s["id"], []):
        if k not in s["keywords"]:
            s["keywords"].append(k)
save("symptoms.json", sym)

disease_ids = {d["id"] for d in lib.DISEASES}

# 2. kondisi banding -------------------------------------------------------------
cond = load("conditions.json")
existing = {c["id"] for c in cond["conditions"]}
cond["conditions"] = [c for c in cond["conditions"] if c["id"] not in disease_ids]
for cid, c in lib.CONDITIONS.items():
    if cid in disease_ids:
        continue
    cond["conditions"] = [x for x in cond["conditions"] if x["id"] != cid] + [c]
save("conditions.json", cond)

# 3. penyakit ----------------------------------------------------------------------
for d in lib.DISEASES:
    json.dump(d, open(f"{DATA}/diseases/{d['id']}.json", "w"), ensure_ascii=False, indent=2)

files = sorted(os.path.basename(p)[:-5] for p in glob.glob(f"{DATA}/diseases/*.json"))
systems = {}
for f in files:
    d = json.load(open(f"{DATA}/diseases/{f}.json"))
    systems.setdefault(d["system"], []).append(f)


def camel(s):
    parts = s.split("_")
    v = parts[0] + "".join(p.capitalize() for p in parts[1:])
    return "d_" + v if v[0].isdigit() else v


lines = [
    "/**",
    " * Daftar file penyakit (dibuat ulang otomatis oleh generator konten; urut per sistem organ).",
    " *",
    " * CARA MENAMBAH PENYAKIT BARU:",
    " *  1. Salin salah satu file JSON di folder ini sebagai templat.",
    " *  2. Isi semua field (lihat tipe DiseaseTemplate di src/core/types.ts).",
    " *  3. Daftarkan di array DISEASE_FILES di bawah.",
    " *  4. Tambahkan harga alat baru (jika ada) di src/data/config.ts.",
    " *  5. Jalankan `npm test` — tes integritas data akan menunjukkan kesalahan.",
    " *",
    " * ⚠ Semua konten medis berstatus BELUM_DITINJAU_DOKTER sampai ditinjau dokter.",
    " */",
]
order = []
for system in sorted(systems):
    lines.append(f"// {system}")
    for f in systems[system]:
        lines.append(f"import {camel(f)} from './{f}.json';")
        order.append(f)
lines.append("")
lines.append("export const DISEASE_FILES: unknown[] = [")
for f in order:
    lines.append(f"  {camel(f)},")
lines.append("];")
open(f"{DATA}/diseases/index.ts", "w").write("\n".join(lines) + "\n")

# 4. penampilan -----------------------------------------------------------------------
app = load("appearance.json")
have = {(c["symptom"], c["cue"]) for c in app["symptomCues"]}
for c in lib.SYM_CUES:
    if (c["symptom"], c["cue"]) not in have:
        app["symptomCues"].append(c)
for s, site in lib.SYM_SITES.items():
    app["sites"][s] = site
save("appearance.json", app)

# 5. tinjauan sistem ---------------------------------------------------------------------
an = load("anamnesis.json")
groups = {g["id"]: g for g in an["reviews"]}
for g in lib.NEW_REVIEWS:
    if g["id"] in groups:
        groups[g["id"]].update(g)
    else:
        an["reviews"].append(g)
        groups[g["id"]] = g
for gid, ss in lib.REVIEW_ADD.items():
    for s in ss:
        if s not in groups[gid]["symptoms"]:
            groups[gid]["symptoms"].append(s)
# Rumusan umum dokter untuk topik yang konten penyakitnya disimpan di kategori tertentu
# (imunisasi & kebiasaan higiene di "kebiasaan", salep di "riwayat_obat", HPHT di "haid_kehamilan", dst.).
EXTRA_TOPIC_KEYWORDS = {
    "kebiasaan": ["imunisasi", "diimunisasi", "vaksin", "divaksin", "vaksinasi", "suntik tetanus", "tetanus", "posyandu", "sabun", "pakai sabun",
                  "berenang", "mengorek telinga", "korek telinga", "cotton bud", "kondom", "pasangan lain", "berganti pasangan", "ganti ganti pasangan",
                  "hubungan seksual", "berhubungan seks", "berhubungan badan", "berhubungan dengan", "pekerja seks", "menyusui", "asi", "minum asi",
                  "susu formula", "popok", "ganti popok", "makan banyak", "porsi makan", "ngemil", "banyak pikiran", "stres", "beban pikiran",
                  "cuci tangan", "kebersihan", "alas kaki", "sandal", "sepatu"],
    "riwayat_obat": ["salep", "krim", "pakai salep", "pakai krim", "dioles", "oles", "tetes mata", "obat tetes", "kacamata", "lensa kontak",
                     "tablet tambah darah", "ttd", "tablet besi", "obat cacing"],
    "haid_kehamilan": ["hpht", "haid terakhir", "gerakan janin", "gerak janin", "janin", "hamil ke", "periksa kehamilan", "kontrol kehamilan",
                       "usia kehamilan", "melahirkan", "nifas", "keguguran"],
    "riwayat_penyakit": ["berat lahir", "lahir di", "lahirnya", "riwayat kelahiran", "lahir cukup bulan", "ditolong siapa", "lahir normal"],
    "riwayat_keluarga": ["pasangan ada", "pasangan ada keluhan", "pasangan juga", "pasangan sakit"],
    "harapan": ["lapor polisi", "polisi", "visum", "melapor", "surat visum"],
    "onset": ["kena apa", "kronologi", "siapa yang memukul", "dipukul siapa", "pelaku", "luka karena apa", "kenapa bisa luka"],
    "keparahan": ["bisa digerakkan", "digerakkan", "bisa ditekuk", "bisa jalan"],
    "pola": ["kapan paling berat", "paling berat kapan", "paling parah kapan", "kapan paling parah", "kapan paling gatal", "paling sakit kapan", "kapan paling sakit"],
}
# Jawaban cadangan yang peka waktu: luka/keluhan hari pertama tidak "makin hari makin nggak enak".
FALLBACK_OVERRIDES = {
    "progresi": [{"text": "Dari tadi kurang lebih sama, Dok.", "when": {"dayMax": 1}},
                 {"text": "Ya begitu-begitu saja, Dok, belum ada perubahan berarti.", "when": {"dayMin": 2}}],
    "durasi": [{"text": "Dari tadi terasa terus, Dok.", "when": {"dayMax": 1}},
               {"text": "Nggak tentu, Dok. Pokoknya terasa terus.", "when": {"dayMin": 2}}],
}
for cat in an["categories"]:
    if cat["id"] in FALLBACK_OVERRIDES:
        cat["fallback"] = FALLBACK_OVERRIDES[cat["id"]]
EXTRA_REVIEW_KEYWORDS = {"makan": ["mau makan", "makannya mau", "mau minum", "minumnya bagaimana"]}
for cat in an["categories"]:
    for k in EXTRA_TOPIC_KEYWORDS.get(cat["id"], []):
        if k not in cat["keywords"]:
            cat["keywords"].append(k)
for rv in an["reviews"]:
    for k in EXTRA_REVIEW_KEYWORDS.get(rv["id"], []):
        if k not in rv.setdefault("keywords", []):
            rv["keywords"].append(k)
save("anamnesis.json", an)

# 6. komorbiditas yang kini juga penyakit kasus -----------------------------------------------
com = load("comorbidities.json")
EXCL = getattr(lib, "COMORBID_EXCLUDE", {})
for c in com["comorbidities"]:
    ex = set(c.get("excludePrimary", []))
    if c["id"] in disease_ids:
        ex.add(c["id"])
    ex |= {d for d in EXCL.get(c["id"], []) if d in disease_ids or d in files}
    if ex:
        c["excludePrimary"] = sorted(ex)
save("comorbidities.json", com)

print(f"OK: {len(lib.DISEASES)} penyakit ditulis, {len(lib.SYMPTOMS)} gejala, {len(lib.CONDITIONS)} kondisi; total file penyakit {len(files)}")
