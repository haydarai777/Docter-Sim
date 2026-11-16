"""Tulis kunci OSCE dari batch o_*.py dan regenerasi src/data/osce/index.ts.
Jalankan: python3 -I osce_build.py   (semua batch o_*.py)"""
import glob, importlib, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import osce_lib
REPO = osce_lib.REPO
here = os.path.dirname(os.path.abspath(__file__))
mods = sys.argv[1:] or sorted(os.path.basename(p)[:-3] for p in glob.glob(f"{here}/o_*.py"))
for m in mods:
    importlib.import_module(m)
out = f"{REPO}/src/data/osce/cases"
written = []
for c in osce_lib.CASES:
    json.dump(c, open(f"{out}/{c['disease']}.json", "w"), ensure_ascii=False, indent=2)
    written.append(c["disease"])
# index.ts: 13 kasus asli dahulu (urutan lama), lalu kasus baru urut sistem penyakit
ORIG = ["dengue", "demam_tifoid", "malaria", "gerd", "angina_stabil", "dispepsia", "gastritis", "isk", "batu_saluran_kemih", "dm_tipe2", "tb_paru", "pneumonia", "asma"]
allc = sorted(os.path.basename(p)[:-5] for p in glob.glob(f"{out}/*.json"))
def sys_of(i):
    return json.load(open(f"{REPO}/src/data/diseases/{i}.json"))["system"]
rest = sorted((i for i in allc if i not in ORIG), key=lambda i: (sys_of(i), i))
order = ORIG + rest
camel = lambda s: re.sub(r"_([a-z0-9])", lambda m: m.group(1).upper(), s)
imports = "\n".join(f"import {camel(i)} from './cases/{i}.json';" for i in sorted(order))
body = f"""/**
 * Konten mode OSCE: formularium, kunci tatalaksana per penyakit, dan stasiun prosedur.
 *
 * ⚠ BELUM DITINJAU DOKTER — dosis & langkah prosedur wajib diverifikasi dengan pedoman terbaru.
 * Berkas kasus selain 13 kasus awal dibuat oleh scripts/content-gen/osce_build.py.
 */
import {{ buildOsceContent, type OsceContent }} from '../../core/osce/content';
import type {{ FormularyFile, OsceCaseDef, ProceduresFile }} from '../../core/osce/types';
{imports}
import formulary from './formulary.json';
import procedures from './procedures.json';

export const OSCE_CASE_FILES: unknown[] = [
{chr(10).join(f'  {camel(i)},' for i in order)}
];

export function loadOsceContent(): OsceContent {{
  return buildOsceContent(formulary as unknown as FormularyFile, OSCE_CASE_FILES as OsceCaseDef[], procedures as unknown as ProceduresFile);
}}
"""
open(f"{REPO}/src/data/osce/index.ts", "w").write(body)
print(f"OK: {len(written)} kasus ditulis; total kasus {len(order)}")
