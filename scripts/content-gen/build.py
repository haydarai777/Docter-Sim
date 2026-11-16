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
