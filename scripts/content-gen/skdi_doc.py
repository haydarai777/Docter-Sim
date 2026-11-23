"""Tulis docs/skdi-4a.md: pemetaan penyakit SKDI tingkat 4A ke penyakit di game (dibuat dari file data).

Jalankan dari akar repo: python3 -I scripts/content-gen/skdi_doc.py
"""
import glob
import json
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
dz = [json.load(open(p)) for p in sorted(glob.glob(f"{ROOT}/src/data/diseases/*.json"))]
osce = {os.path.basename(p)[:-5] for p in glob.glob(f"{ROOT}/src/data/osce/cases/*.json")}
by_sys = {}
for d in dz:
    by_sys.setdefault(d["system"], []).append(d)
lvl4 = [d for d in dz if d.get("skdiLevel") == "4A"]
out = [
    "# Cakupan SKDI tingkat kemampuan 4A",
    "",
    f"Game memuat **{len(dz)} penyakit**: **{len(lvl4)} penyakit tingkat 4A** (seluruh daftar 4A SKDI 2012) ditambah "
    f"{len(dz) - len(lvl4)} penyakit tingkat 3A yang sengaja dipertahankan sebagai pengecoh klinis. Setiap penyakit dapat "
    "dimainkan di mode praktek (pilih *Pasien yang datang* di layar judul untuk berlatih satu sistem organ) dan memiliki "
    "kunci stasiun OSCE (resep, non-farmakologi, KIE).",
    "",
    "> ⚠ Daftar mengacu pada **Standar Kompetensi Dokter Indonesia (SKDI) 2012 — Perkonsil No. 11/2012**. Bila terbit "
    "revisi SKDI, cocokkan ulang daftar ini. Seluruh konten **belum ditinjau dokter** — lihat `REVIEW.md`.",
    "",
    "Tabel dibuat otomatis oleh `scripts/content-gen/skdi_doc.py` dari `src/data/diseases/*.json`.",
    "",
    "| Sistem organ | Jumlah |",
    "|---|---|",
]
for sys_name in sorted(by_sys, key=lambda s: s.lower()):
    out.append(f"| {sys_name} | {len(by_sys[sys_name])} |")
out.append(f"| **Total** | **{len(dz)}** |")
n = 0
for sys_name in sorted(by_sys, key=lambda s: s.lower()):
    out += ["", f"## {sys_name}", "", "| No. | Penyakit | Id data | SKDI | Tingkat bahaya | Kunci OSCE |", "|---|---|---|---|---|---|"]
    for d in sorted(by_sys[sys_name], key=lambda x: x["name"].lower()):
        n += 1
        out.append(f"| {n} | {d['name']} | `{d['id']}` | {d.get('skdiLevel', '-')} | {d['danger']} | {'✓' if d['id'] in osce else '—'} |")
out += ["", "## Catatan pemetaan", "",
        "- Beberapa butir SKDI digabung menjadi satu penyakit bila presentasi & tatalaksananya sama di layanan primer, mis. "
        "benda asing di telinga & hidung (`benda_asing_tht`), vulnus laseratum & punctum (`vulnus`), exanthematous drug "
        "eruption & fixed drug eruption (`erupsi_obat`), disentri basiler & amuba (`disentri`), defisiensi iodium & kalsium "
        "(`defisiensi_mineral`). Varian dibedakan lewat *trait* kasus sehingga keduanya muncul dalam permainan.",
        "- Butir dengan batasan (\"ringan\", \"tanpa komplikasi\", \"derajat 1–2\") dimodelkan dalam batasan itu; kasus yang "
        "berkembang menjadi komplikasi muncul sebagai trait berbahaya yang wajib dikenali & dirujuk.",
        "- Angina pektoris stabil & batu saluran kemih (3A) dipertahankan sebagai diagnosis banding yang wajib dikenali.", ""]
open(f"{ROOT}/docs/skdi-4a.md", "w").write("\n".join(out))
print("docs/skdi-4a.md:", len(dz), "penyakit,", len(lvl4), "4A")
