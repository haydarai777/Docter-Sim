"""Ringkasan penyakit untuk menulis kunci OSCE: python3 -I dz_summary.py id1 id2 ..."""
import json, sys
R = "/home/user/Docter-Sim/src/data/diseases"
def cond(w):
    if not w: return ""
    return " [" + ",".join(f"{k}={v}" for k, v in w.items()) + "]"
for i in sys.argv[1:]:
    d = json.load(open(f"{R}/{i}.json"))
    ages = ";".join(f"{b['min']}-{b['max']}" for b in d["demographics"]["ageBands"])
    tl = d.get("traitLabels", {})
    traits = " | ".join(f"{t['id']}{cond(t.get('when'))}:{tl.get(t['id'],'')[:40]}" for t in d.get("traits", []))
    disp = " | ".join(f"{x['value']}{cond(x.get('when'))}" for x in d["disposition"])
    tests = ",".join(t["tool"] for t in d["plan"]["tests"])
    print(f"## {i} ({d['danger']}) age {ages} m{d['demographics']['maleRatio']}\n  T: {traits}\n  D: {disp}\n  tests: {tests}\n  mg: {' / '.join(d['management'])[:500]}")
