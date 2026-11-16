"""Pustaka ringkas penyusun konten penyakit SKDI 4A (dipakai oleh berkas batch b_*.py).

Setiap batch mendaftarkan gejala (S), kondisi banding (C), dan penyakit (D). build.py menulis JSON.
"""
import json
import os

ROOT = os.environ.get("ROOT", "/home/user/Docter-Sim")
DATA = f"{ROOT}/src/data"

TOOLS = {t["id"]: t for t in json.load(open(f"{DATA}/tools.json"))["tools"]}
ANAM = {c["id"]: c for c in json.load(open(f"{DATA}/anamnesis.json"))["categories"]}

SYMPTOMS = {}      # id -> def (gejala baru / diganti)
CONDITIONS = {}    # id -> def (kondisi banding baru)
DISEASES = []      # daftar penyakit (urut)
SYM_CUES = []      # isyarat penampilan 3D
SYM_SITES = {}     # gejala -> lokasi tubuh yang dipegang
REVIEW_ADD = {}    # tinjauan sistem -> gejala tambahan
NEW_REVIEWS = []   # tinjauan sistem baru

REF_PPK = "Kemenkes RI. Panduan Praktik Klinis bagi Dokter di Fasilitas Pelayanan Kesehatan Tingkat Pertama (KMK HK.01.07/MENKES/1186/2022)"
REF_SKDI = "Konsil Kedokteran Indonesia. Standar Kompetensi Dokter Indonesia (2012) — tingkat kemampuan 4A"


# ----------------------------------------------------------------------------- gejala
def S(id, label, system, q, lay, vague=None, exa=None, down=None, kw=None, vol=True, cue=None, site=None):
    """cue: (cue_id, level) isyarat 3D; site: lokasi yang dipegang pasien saat membicarakannya."""
    ph = {"lay": lay}
    if vague:
        ph["vague"] = vague
    if exa:
        ph["exaggerated"] = exa
    if down:
        ph["downplayed"] = down
    d = {"id": id, "label": label, "system": system, "question": q, "phrases": ph, "keywords": kw}
    if not vol:
        d["volunteer"] = False
    SYMPTOMS[id] = d
    if cue:
        c = {"symptom": id, "cue": cue[0], "level": cue[1]}
        if len(cue) > 2:
            c["site"] = cue[2]
        SYM_CUES.append(c)
    if site:
        SYM_SITES[id] = site
    return id


def C(id, name, system, danger, summary, aliases=()):
    CONDITIONS[id] = {"id": id, "name": name, "aliases": list(aliases), "system": system, "danger": danger, "summary": summary}


def review_add(group, *symptoms):
    REVIEW_ADD.setdefault(group, []).extend(symptoms)


# ----------------------------------------------------------------------------- kondisi (when)
def T(*traits):
    return {"traits": list(traits)}


def NT(*traits):
    return {"notTraits": list(traits)}


def SY(*symptoms):
    return {"symptoms": list(symptoms)}


def NSY(*symptoms):
    return {"notSymptoms": list(symptoms)}


def W(**kw):
    out = {}
    for k, v in kw.items():
        key = {"t": "traits", "nt": "notTraits", "s": "symptoms", "ns": "notSymptoms", "sex": "sex",
               "amin": "ageMin", "amax": "ageMax", "dmin": "dayMin", "dmax": "dayMax", "occ": "occupations"}[k]
        out[key] = list(v) if isinstance(v, (list, tuple)) else v
    return out


# ----------------------------------------------------------------------------- penyusun
def A(text, clue=None, when=None, rev=None, w=None):
    a = {"text": text}
    if w is not None:
        a["weight"] = w
    when = dict(when) if when else None
    if rev:
        rev = list(rev) if isinstance(rev, (list, tuple)) else [rev]
        when = when or {}
        syms = list(when.get("symptoms", []))
        for r in rev:
            if r not in syms:
                syms.append(r)
        when["symptoms"] = syms
        a["reveals"] = rev
    if when:
        a["when"] = when
    if clue:
        a["clue"] = clue
    return a


def F(tool, param, v, p=None, when=None, diag=False, req=None):
    assert tool in TOOLS, tool
    assert any(x["id"] == param for x in TOOLS[tool]["params"]), (tool, param)
    f = {"tool": tool, "param": param}
    if when:
        f["when"] = when
    if p is not None:
        f["probability"] = p
    if diag:
        f["diagnostic"] = True
    if req:
        f["requires"] = req
    if isinstance(v, tuple):
        f["range"] = [v[0], v[1]]
    else:
        f["values"] = v if isinstance(v, list) else [v]
    return f


def evidence(items):
    out = {}
    for x in items:
        if x in TOOLS:
            out.setdefault("tools", []).append(x)
        elif x in ANAM:
            out.setdefault("topics", []).append(x)
        else:
            out.setdefault("symptoms", []).append(x)
    return out


def X(id, how, by, must=False):
    d = {"id": id, "howToDistinguish": how}
    if must:
        d["mustNotMiss"] = True
    d["excludeBy"] = evidence(by)
    return d


def CX(id, name, trait, assess, expl, red=True):
    return {"id": id, "name": name, "trait": trait, "redFlag": red, "assess": evidence(assess), "explanation": expl}


def PF(text, **when):
    m = {"excluded": "excluded", "wrong": "wrongPrimary", "primary": "primaryIs", "done": "toolDone",
         "normal": "toolNormal", "notasked": "topicNotAsked", "t": "traits", "nt": "notTraits", "notcons": "notConsidered"}
    w = {}
    for k, v in when.items():
        w[m[k]] = v
    return {"when": w, "text": text}


def _plan_items(items):
    out = []
    for it in items:
        tool, role, reason = it[0], it[1], it[2]
        assert tool in TOOLS, tool
        d = {"tool": tool, "role": role}
        if len(it) > 3 and it[3]:
            d["when"] = it[3]
        if len(it) > 4 and it[4]:
            d["group"] = it[4]
        d["reason"] = reason
        out.append(d)
    return out


PRICES = {}


def load_prices():
    import re
    src = open(f"{DATA}/config.ts").read()
    block = src[src.index("toolPrices"):src.index("tests:")]
    for m in re.finditer(r"(\w+):\s*([\d_]+)", block):
        PRICES[m.group(1)] = int(m.group(2).replace("_", ""))


load_prices()

EXP_REASON = {
    "ct_abdomen": "CT-scan mahal dan tidak diindikasikan untuk keluhan ini.",
    "usg_abdomen": "Tidak ada kecurigaan kelainan organ intraabdomen.",
    "rontgen_thorax": "Tidak ada keluhan atau temuan paru/jantung.",
    "foto_bno": "Tidak ada kecurigaan batu saluran kemih.",
    "usg_obstetri": "Tidak ada kecurigaan kehamilan atau kelainan pelvis.",
    "rontgen_ekstremitas": "Tidak ada cedera tulang/sendi.",
    "usg_superfisial": "Tidak ada benjolan jaringan lunak yang perlu dicitrakan.",
    "cd4": "CD4 hanya untuk pasien HIV yang sudah terdiagnosis.",
    "profil_besi": "Mahal dan tidak menjawab keluhan ini.",
    "fungsi_tiroid": "Tidak ada kecurigaan gangguan tiroid.",
    "igm_leptospira": "Tidak ada demam akut dengan riwayat paparan banjir/tikus.",
    "igm_anti_hav": "Tidak ada kecurigaan hepatitis akut.",
    "serologi_dengue": "Tidak ada demam akut yang mengarah ke dengue.",
    "ns1_dengue": "Tidak ada demam akut yang mengarah ke dengue.",
    "tubex": "Tidak ada demam lama yang mengarah ke tifoid.",
    "hba1c": "HbA1c tidak membantu diagnosis keluhan ini.",
    "tcm_tb": "Tidak ada gejala yang mengarah ke TB.",
    "swab_antigen": "Tidak ada gejala infeksi saluran napas akut.",
    "tes_h_pylori": "Tidak ada keluhan dispepsia.",
}


def D(**k):
    """Susun satu penyakit. Kunci ringkas — lihat dokumentasi di bawah setiap batch."""
    did = k["id"]
    traits = []
    for t in k.get("traits", []):
        d = {"id": t[0], "probability": t[1]}
        if len(t) > 2 and t[2]:
            d["when"] = t[2]
        traits.append(d)
    syms = []
    for s in k["sym"]:
        assert s[0] in SYMPTOMS or s[0] in EXISTING_SYMPTOMS, (did, s[0])
        d = {"id": s[0], "probability": s[1]}
        if len(s) > 2 and s[2]:
            d["when"] = s[2]
        syms.append(d)
    sym_ids = []
    for s in syms:
        if s["id"] not in sym_ids:
            sym_ids.append(s["id"])
    cc = k["cc"]
    clue = k.get("clue")
    if clue is None:
        clue = [s for s in sym_ids if s not in cc][:6]
    ana = {}
    import re as _re
    denial = _re.compile(r"apa-apa|sehat semua|^(?:.*\.\s)?nggak ada, dok\.|nggak tahu", _re.I)
    for cat, variants in k.get("ana", {}).items():
        assert cat in ANAM and ANAM[cat]["type"] == "static", (did, cat)
        vs = []
        for v in variants if isinstance(variants, list) else [variants]:
            if isinstance(v, str):
                vs.append({"text": v})
            elif isinstance(v, tuple):
                vs.append(A(*v))
            else:
                vs.append(v)
        if cat in ("riwayat_penyakit", "riwayat_obat", "riwayat_keluarga", "kebiasaan"):
            for v in vs:
                assert not denial.search(v["text"]), (did, cat, v["text"], "penyangkalan mutlak bertentangan dengan riwayat komorbid")
        ana[cat] = vs
    demo = {"ageBands": [{"min": a, "max": b, "weight": w} for a, b, w in k["ages"]], "maleRatio": k.get("male", 0.5)}
    if k.get("occ"):
        demo["occupations"] = [{"id": o, "weight": w} for o, w in k["occ"]]
        demo["occupationBias"] = k.get("bias", 0.4)
    if k.get("infant"):
        demo["infantAge"] = {"unit": k["infant"][0], "range": list(k["infant"][1])}
    plan = k["plan"]
    tests = _plan_items(plan.get("tests", []))
    exams = _plan_items(plan.get("exams", []))
    planned = {t["tool"] for t in tests}
    optional = [{"tool": t, "reason": r} for t, r in plan.get("opt", [])]
    opt_ids = {o["tool"] for o in optional}
    unn = [{"tool": t, "reason": r} for t, r in plan.get("unn", [])]
    unn_ids = {u["tool"] for u in unn}
    for tid, reason in EXP_REASON.items():
        if tid not in planned and tid not in opt_ids and tid not in unn_ids and tid not in k.get("allow", []):
            unn.append({"tool": tid, "reason": reason})
    key_topics = plan.get("topics")
    if key_topics is None:
        key_topics = ["onset", "keluhan_lain"] + [c for c in ana if ANAM[c]["core"] and c not in ("onset", "keluhan_lain")][:4]
    plan_out = {"keyTopics": key_topics, "exams": exams, "tests": tests}
    if unn:
        plan_out["unnecessary"] = unn
    if optional:
        plan_out["optional"] = optional
    disp = []
    for d in k["disp"]:
        r = {"value": d[0], "reason": d[1]}
        if len(d) > 2 and d[2]:
            r["when"] = d[2]
        if len(d) > 3 and d[3]:
            r["alsoAccept"] = d[3]
        disp.append(r)
    out = {
        "id": did,
        "name": k["name"],
        "aliases": k.get("aka", []),
        "system": k["sys"],
        "skdiLevel": k.get("skdi", "4A"),
        "danger": k.get("danger", "rendah"),
        "prevalenceWeight": k.get("prev", 1),
        "summary": k["summary"],
        "presentationDay": list(k["day"]),
        "demographics": demo,
    }
    if traits:
        out["traits"] = traits
    if k.get("tl"):
        out["traitLabels"] = k["tl"]
    out["symptoms"] = syms
    out["chiefComplaint"] = {"primary": cc, **({"extraPool": k["ex"]} if k.get("ex") else {})}
    if clue:
        out["clueSymptoms"] = clue
    out["misattributions"] = k["mis"]
    if k.get("fears"):
        out["fears"] = k["fears"]
    out["anamnesis"] = ana
    out["findings"] = k["f"]
    out["differentials"] = k["dd"]
    if k.get("odd"):
        out["otherDifferentials"] = k["odd"]
    out["keyFindings"] = k["key"]
    if k.get("teach"):
        out["teachingPoints"] = k["teach"]
    out["review"] = {
        "status": "BELUM_DITINJAU_DOKTER",
        "notes": k.get("notes", ["Probabilitas gejala & temuan adalah estimasi pengembang; mohon diverifikasi dokter."]),
        "references": k.get("refs", [REF_PPK]),
    }
    if k.get("cx"):
        out["complications"] = k["cx"]
    out["plan"] = plan_out
    if k.get("tc"):
        out["traitComorbidities"] = k["tc"]
    out["disposition"] = disp
    out["management"] = k["mg"]
    out["approach"] = k["ap"]
    if k.get("pf"):
        out["pitfalls"] = k["pf"]
    if k.get("ctx"):
        out["context"] = k["ctx"]
    DISEASES.append(out)
    return out


EXISTING_SYMPTOMS = {s["id"] for s in json.load(open(f"{DATA}/symptoms.json"))["symptoms"]}
COMORBID_EXCLUDE = {}
