"""Pembantu kunci OSCE per penyakit (src/data/osce/cases/<id>.json).

Pola: setiap batch memanggil CASE(...) lalu osce_build.py menulis berkas & index.ts.
Lint ringan di sini menangkap kesalahan umum lebih awal daripada validator TypeScript.
"""
import json
import os
import re

REPO = os.environ.get("REPO", "/home/user/Docter-Sim")
FORMULARY = json.load(open(f"{REPO}/src/data/osce/formulary.json"))
DRUGS = {d["id"]: d for d in FORMULARY["drugs"]}
FORMS = {f["id"]: (d, f) for d in FORMULARY["drugs"] for f in d["forms"]}
ALLERGY_GROUPS = FORMULARY["allergyGroups"]

CASES = []
REVIEW_NOTE = "Kunci jawaban latihan OSCE; dosis wajib diverifikasi dengan pedoman terbaru sebelum dipakai klinis."
PPK = "Kemenkes RI. Panduan Praktik Klinis bagi Dokter di Fasyankes Primer (KMK HK.01.07/MENKES/1186/2022)"

CHILD = {"ageMax": 11}
ADULT = {"ageMin": 12}


def T(*t):
    return {"traits": list(t)}


def NT(*t):
    return {"notTraits": list(t)}


def W(**kw):
    out = {}
    for k, v in kw.items():
        key = {"t": "traits", "nt": "notTraits", "s": "symptoms", "ns": "notSymptoms", "sex": "sex",
               "amin": "ageMin", "amax": "ageMax", "dmin": "dayMin", "dmax": "dayMax"}[k]
        out[key] = list(v) if isinstance(v, (list, tuple)) else v
    return out


def AND(*conds):
    out = {}
    for c in conds:
        if not c:
            continue
        for k, v in c.items():
            if isinstance(v, list):
                out[k] = out.get(k, []) + v
            else:
                assert k not in out or out[k] == v, (k, out, c)
                out[k] = v
    return out


def O(drug, label, dose=None, sched="rutin", tpd=None, days=None, forms=None, perkg=None, ubw=None):
    """Satu pilihan dosis. dose/perkg = (lo, hi) per kali; tpd = (lo, hi) kali sehari; days = (lo, hi)."""
    assert drug in DRUGS, f"obat {drug} tidak ada"
    if isinstance(sched, str):
        sched = [sched]
    o = {"drug": drug, "label": label, "schedules": sched}
    if forms:
        forms = [forms] if isinstance(forms, str) else forms
        for f in forms:
            assert f in FORMS and FORMS[f][0]["id"] == drug, f"sediaan {f} bukan milik {drug}"
        o["forms"] = forms
    if dose is not None:
        dose = (dose, dose) if isinstance(dose, (int, float)) else dose
        o["dose"] = list(dose)
        form = FORMS[forms[0]][1] if forms else DRUGS[drug]["forms"][0]
        units = dose[0] / form["strength"]
        step = 20 if form["dosageUnit"] == "mL" else 4  # mL boleh 0,05; lainnya kelipatan ¼
        assert abs(units * step - round(units * step)) < 1e-6 and units > 0, f"{drug}: dosis {dose[0]} tidak kelipatan 1/{step} sediaan {form['id']}"
        if DRUGS[drug].get("maxDaily") and tpd:
            assert dose[0] * tpd[0] <= DRUGS[drug]["maxDaily"], f"{drug}: melebihi dosis harian maksimum"
    if perkg is not None:
        o["dosePerKg"] = list(perkg)
        assert forms, f"{drug}: dosis per kgBB wajib membatasi sediaan (sirup/drops) agar bisa ditakar"
    if ubw is not None:
        o["unitsByWeight"] = [{"minKg": a, "maxKg": b, "units": u} for a, b, u in ubw]
    if any(s != "tunggal" for s in sched):
        assert tpd, f"{drug}: frekuensi kosong"
        o["timesPerDay"] = list((tpd, tpd) if isinstance(tpd, int) else tpd)
    if "rutin" in sched:
        assert days, f"{drug}: rutin perlu lama hari"
    if days is not None:
        o["days"] = list((days, days) if isinstance(days, int) else days)
    assert o.get("dose") or o.get("dosePerKg") or o.get("unitsByWeight"), f"{drug}: dosis kosong"
    return o


def IT(id, label, role, reason, opts, when=None, separate=False):
    it = {"id": id, "label": label, "role": role, "reason": reason, "options": opts}
    if when:
        it["when"] = when
    if separate:
        it["separateLine"] = True
    return it


def AV(reason, drugs=None, groups=None, classes=None, sev="salah", when=None):
    r = {}
    if drugs:
        r["drugs"] = drugs
    if groups:
        r["groups"] = groups
    if classes:
        r["classes"] = classes
    r["reason"] = reason
    r["severity"] = sev
    if when:
        r["when"] = when
    return r


def NP(id, text, kind="benar", why=None, when=None, whenAny=None):
    a = {"id": id, "text": text, "kind": kind}
    if why:
        a["why"] = why
    if when:
        a["when"] = when
    if whenAny:
        a["whenAny"] = whenAny
    return a


def E(id, text, cat=None, kind="benar", why=None, when=None):
    a = {"id": id, "text": text, "kind": kind}
    if cat:
        a["category"] = cat
    if why:
        a["why"] = why
    if when:
        a["when"] = when
    return a


def _hits(rule, drug):
    return drug["id"] in rule.get("drugs", []) or drug["class"] in rule.get("classes", []) or any(g in drug.get("groups", []) for g in rule.get("groups", []))


def _causes_allergy(drug, allergy):
    groups = ALLERGY_GROUPS.get(allergy, [])
    if any(g in drug.get("groups", []) for g in groups):
        return True
    a = allergy.lower()
    return any(a in n.lower() or n.lower() in a for n in [drug["id"], drug["name"], *drug.get("aliases", [])])


def CASE(disease, station, items, np, edu, avoid=None, note=None, setting="Puskesmas", kie=None, refs=None):
    path = f"{REPO}/src/data/diseases/{disease}.json"
    assert os.path.exists(path), f"penyakit {disease} tidak ada"
    dz = json.load(open(path))
    traits = {t["id"] for t in dz.get("traits", [])}
    symptoms = {s["id"] for s in dz["symptoms"]}

    def chk(where, w):
        if not w:
            return
        for t in w.get("traits", []) + w.get("notTraits", []):
            assert t in traits, f"{disease} {where}: trait {t} tidak ada ({sorted(traits)})"
        for s in w.get("symptoms", []) + w.get("notSymptoms", []):
            assert s in symptoms, f"{disease} {where}: gejala {s} tidak ada"

    ids = set()
    for it in items:
        assert it["id"] not in ids, f"{disease}: butir ganda {it['id']}"
        ids.add(it["id"])
        chk(it["id"], it.get("when"))
        for allergy in ALLERGY_GROUPS:
            if all(_causes_allergy(DRUGS[o["drug"]], allergy) for o in it["options"]):
                raise AssertionError(f"{disease}.{it['id']}: semua pilihan memicu alergi {allergy} — tambahkan alternatif")
        for o in it["options"]:
            for r in avoid or []:
                if _hits(r, DRUGS[o["drug"]]) and not (r.get("when") and it.get("when")):
                    raise AssertionError(f"{disease}.{it['id']}: {o['drug']} terkena aturan hindari '{r['reason']}'")
    if not any(i["role"] == "utama" for i in items):
        assert note, f"{disease}: tanpa butir utama wajib ada catatan"
    for r in avoid or []:
        chk("hindari", r.get("when"))
    for kind, lst in (("nonfarmako", np), ("kie", edu)):
        seen = set()
        for a in lst:
            assert a["id"] not in seen, f"{disease}.{kind}: id ganda {a['id']}"
            seen.add(a["id"])
            chk(f"{kind}.{a['id']}", a.get("when"))
            for w in a.get("whenAny", []):
                chk(f"{kind}.{a['id']}", w)
            if kind == "kie" and a["kind"] == "benar":
                assert a.get("category"), f"{disease}.kie.{a['id']}: kategori wajib"
        assert any(a["kind"] != "benar" for a in lst), f"{disease}.{kind}: perlu pengecoh/berbahaya"
    assert any(a["kind"] == "berbahaya" for a in np), f"{disease}: nonfarmako perlu pilihan berbahaya"
    for k in kie or ["diagnosis", "pengobatan", "tanda_bahaya", "kontrol"]:
        assert any(a["kind"] == "benar" and a.get("category") == k and not a.get("when") for a in edu), f"{disease}: KIE {k} tanpa pilihan benar tanpa syarat"
    for a in np + edu:
        assert not re.search(r"\s{2,}", a["text"]), a["text"]
    c = {"disease": disease, "setting": setting, "station": station, "therapy": {"items": items}}
    if avoid:
        c["therapy"]["avoid"] = avoid
    if note:
        c["therapy"]["note"] = note
    c["nonPharm"] = np
    c["education"] = edu
    if kie:
        c["kieRequired"] = kie
    c["review"] = {"status": "BELUM_DITINJAU_DOKTER", "notes": [REVIEW_NOTE], "references": refs or [PPK]}
    CASES.append(c)
    return c


# ---------------------------------------------------------------------------- pilihan obat umum (dipakai ulang)

def PCT_ADULT(prn=True):
    return O("parasetamol", "Parasetamol 3–4 × 500–1000 mg bila nyeri/demam", (500, 1000), ["prn", "rutin"], (3, 4), (3, 5), forms="parasetamol-tab500")


def PCT_CHILD():
    return O("parasetamol", "Parasetamol 10–15 mg/kgBB/kali, 3–4 × sehari bila demam/nyeri", None, ["prn", "rutin"], (3, 4), (3, 5),
             forms=["parasetamol-syr", "parasetamol-drop"], perkg=(10, 15))


def IBU_ADULT():
    return O("ibuprofen", "Ibuprofen 3 × 400 mg sesudah makan", 400, ["prn", "rutin"], (3, 3), (3, 5), forms="ibuprofen-tab400")


def MEF_ADULT():
    return O("asam_mefenamat", "Asam mefenamat 3 × 500 mg sesudah makan", 500, ["prn", "rutin"], (3, 3), (3, 5))


def ANALGESIK(adult=True, child=True, reason="Mengurangi nyeri/demam.", role="pendukung", when=None, id="analgesik", label="Analgesik-antipiretik"):
    out = []
    if adult:
        out.append(IT(id if not child else f"{id}_dewasa", label, role, reason, [PCT_ADULT(), IBU_ADULT(), MEF_ADULT()], AND(when, ADULT) if child else when))
    if child:
        out.append(IT(f"{id}_anak" if adult else id, f"{label} (anak)", role, reason, [PCT_CHILD()], AND(when, CHILD) if adult else when))
    return out


def ANTIHISTAMIN(role="pendukung", reason="Mengurangi gatal/gejala alergi.", when=None, child=True, adult=True, id="antihistamin"):
    out = []
    a = [O("setirizin", "Setirizin 1 × 10 mg", 10, ["rutin", "prn"], (1, 1), (5, 14), forms="setirizin-tab10"),
         O("loratadin", "Loratadin 1 × 10 mg", 10, ["rutin", "prn"], (1, 1), (5, 14)),
         O("ctm", "CTM 3 × 4 mg", 4, ["rutin", "prn"], (2, 3), (5, 14))]
    c = [O("setirizin", "Setirizin sirup 0,25 mg/kgBB/kali, 1–2 × sehari (2–5 th: 2,5 mg; 6–11 th: 5 mg)", None, ["rutin", "prn"], (1, 2), (5, 14),
           forms="setirizin-syr", perkg=(0.15, 0.35))]
    if adult:
        out.append(IT(id if not child else f"{id}_dewasa", "Antihistamin", role, reason, a, AND(when, ADULT) if child else when))
    if child:
        out.append(IT(f"{id}_anak" if adult else id, "Antihistamin (anak)", role, reason, c, AND(when, CHILD) if adult else when))
    return out


def TOPIKAL(drug, label, tpd=(2, 2), days=(14, 28), forms=None, sched="rutin"):
    return O(drug, label, 1, sched, tpd, days, forms=forms)


def STEROID_TOP(potent=False, face=False, days=(7, 14), tpd=(2, 2)):
    if face:
        return [TOPIKAL("hidrokortison_krim", f"Hidrokortison krim 1–2,5% {tpd[0]} × sehari", tpd, days)]
    opts = [TOPIKAL("betametason_krim", f"Betametason valerat 0,1% krim {tpd[0]} × sehari", tpd, days),
            TOPIKAL("mometason_krim", "Mometason furoat 0,1% krim 1 × sehari", (1, 1), days)]
    if not potent:
        opts.append(TOPIKAL("hidrokortison_krim", f"Hidrokortison krim 2,5% {tpd[0]} × sehari", tpd, days, forms="hidrokortison-krim25"))
    return opts


# KIE pengecoh/berbahaya umum
def E_ANTIBIOTIK_BEBAS(cat="pengobatan"):
    return E("ab_bebas", "Beli antibiotik sendiri di warung bila keluhan muncul lagi", cat, "berbahaya", "Mendorong resistansi & menunda diagnosis.")


def E_HABIS_STOP(cat="pengobatan"):
    return E("stop_dini", "Obat boleh dihentikan begitu keluhan berkurang", cat, "berbahaya", "Terapi tidak tuntas → kambuh/resistansi.")


def NP_JAMU():
    return NP("ramuan", "Oleskan ramuan tradisional/pasta gigi pada bagian yang sakit", "berbahaya", "Iritasi & infeksi sekunder.")
