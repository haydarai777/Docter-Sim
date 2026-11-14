/**
 * Validasi konten OSCE: kunci tiap penyakit, obat & sediaan yang dirujuk, kondisi trait,
 * kategori KIE, dan prosedur.
 */
import type { Condition, GameContent } from '../types';
import type { OsceContent } from './content';
import { KIE_CATEGORIES } from './types';

export function validateOsceContent(osce: OsceContent, content: GameContent): string[] {
  const errors: string[] = [];
  const err = (p: string, m: string) => errors.push(`${p}: ${m}`);

  for (const d of osce.drugs) {
    if (!osce.formulary.classes[d.class]) err(`obat.${d.id}`, `kelas "${d.class}" tidak ada`);
    if (!d.forms.length) err(`obat.${d.id}`, 'tidak punya sediaan');
    for (const f of d.forms) if (!(f.strength > 0)) err(`obat.${d.id}.${f.id}`, 'kekuatan sediaan harus > 0');
  }
  for (const [label, groups] of Object.entries(osce.formulary.allergyGroups)) {
    if (!(content.population as { allergies?: string[] }).allergies?.includes(label)) err(`alergi.${label}`, 'bukan alergi di populasi');
    for (const g of groups) if (!osce.drugs.some((d) => d.groups?.includes(g))) err(`alergi.${label}`, `golongan "${g}" tidak dipakai obat mana pun`);
  }

  for (const disease of content.diseases) {
    const def = osce.casesById.get(disease.id);
    const path = `osce.${disease.id}`;
    if (!def) {
      err(path, 'kunci OSCE belum ada');
      continue;
    }
    const traits = new Set((disease.traits ?? []).map((t) => t.id));
    const symptoms = new Set(disease.symptoms.map((s) => s.id));
    const checkCond = (p: string, w: Condition | undefined) => {
      if (!w) return;
      for (const t of [...(w.traits ?? []), ...(w.notTraits ?? [])]) if (!traits.has(t)) err(p, `trait "${t}" tidak ada di penyakit`);
      for (const s of [...(w.symptoms ?? []), ...(w.notSymptoms ?? [])]) if (!symptoms.has(s)) err(p, `gejala "${s}" tidak ada di penyakit`);
    };
    if (!def.therapy.items.some((i) => i.role === 'utama')) err(path, 'tidak ada butir terapi utama');
    const itemIds = new Set<string>();
    for (const item of def.therapy.items) {
      const ip = `${path}.terapi.${item.id}`;
      if (itemIds.has(item.id)) err(ip, 'id ganda');
      itemIds.add(item.id);
      checkCond(ip, item.when);
      if (!item.options.length) err(ip, 'tanpa pilihan obat');
      for (const o of item.options) {
        const drug = osce.drugsById.get(o.drug);
        if (!drug) {
          err(ip, `obat "${o.drug}" tidak ada di formularium`);
          continue;
        }
        for (const f of o.forms ?? []) if (!drug.forms.some((x) => x.id === f)) err(ip, `sediaan "${f}" bukan milik ${o.drug}`);
        if (!o.dose && !o.dosePerKg && !o.unitsByWeight) err(ip, `${o.drug}: dosis tidak ditentukan`);
        if (!o.schedules.length) err(ip, `${o.drug}: jadwal kosong`);
        if (o.schedules.includes('rutin') && !o.days) err(ip, `${o.drug}: jadwal rutin perlu lama hari`);
        if (o.schedules.some((s) => s !== 'tunggal') && !o.timesPerDay) err(ip, `${o.drug}: frekuensi kosong`);
        for (const r of [o.dose, o.dosePerKg, o.timesPerDay, o.days]) if (r && r[0] > r[1]) err(ip, `${o.drug}: rentang terbalik`);
        if (drug.maxDaily && o.dose && o.timesPerDay && o.dose[0] * o.timesPerDay[0] > drug.maxDaily) err(ip, `${o.drug}: dosis kunci melebihi dosis harian maksimum`);
      }
    }
    for (const r of def.therapy.avoid ?? []) {
      checkCond(`${path}.hindari`, r.when);
      for (const id of r.drugs ?? []) if (!osce.drugsById.has(id)) err(`${path}.hindari`, `obat "${id}" tidak ada`);
      for (const c of r.classes ?? []) if (!osce.formulary.classes[c]) err(`${path}.hindari`, `kelas "${c}" tidak ada`);
      // Obat kunci tidak boleh sekaligus terlarang.
      for (const item of def.therapy.items) {
        for (const o of item.options) {
          const drug = osce.drugsById.get(o.drug);
          if (!drug || r.when || item.when) continue;
          const hit = r.drugs?.includes(drug.id) || r.classes?.includes(drug.class) || r.groups?.some((g) => drug.groups?.includes(g));
          if (hit) err(`${path}.hindari`, `obat kunci "${drug.id}" sekaligus dilarang`);
        }
      }
    }
    for (const [kind, list] of [['nonfarmako', def.nonPharm], ['kie', def.education]] as const) {
      const ids = new Set<string>();
      for (const a of list) {
        const ap = `${path}.${kind}.${a.id}`;
        if (ids.has(a.id)) err(ap, 'id ganda');
        ids.add(a.id);
        checkCond(ap, a.when);
        for (const w of a.whenAny ?? []) checkCond(ap, w);
        if (kind === 'kie' && a.kind === 'benar' && !a.category) err(ap, 'KIE benar wajib berkategori');
        if (a.category && !KIE_CATEGORIES.includes(a.category)) err(ap, `kategori "${a.category}" tidak dikenal`);
      }
      if (!list.some((a) => a.kind === 'berbahaya' || a.kind === 'pengecoh')) err(`${path}.${kind}`, 'perlu minimal satu pilihan pengecoh/berbahaya');
    }
    for (const k of def.kieRequired ?? []) {
      if (!def.education.some((a) => a.kind === 'benar' && a.category === k)) err(`${path}.kie`, `kategori wajib "${k}" tidak punya pilihan benar`);
    }
    if (!def.education.some((a) => a.kind === 'benar' && a.category === 'tanda_bahaya')) err(`${path}.kie`, 'belum ada edukasi tanda bahaya');
  }
  for (const id of osce.casesById.keys()) if (!content.diseasesById.has(id)) err(`osce.${id}`, 'penyakit tidak ada');

  for (const p of osce.procedures) {
    const pp = `prosedur.${p.id}`;
    const ids = new Set<string>();
    for (const x of [...p.steps, ...p.distractors]) {
      if (ids.has(x.id)) err(pp, `id ganda "${x.id}"`);
      ids.add(x.id);
    }
    if (p.steps.length < 5) err(pp, 'langkah terlalu sedikit');
    for (const q of p.questions) if (q.answer < 0 || q.answer >= q.options.length) err(pp, `jawaban "${q.id}" di luar pilihan`);
  }
  return errors;
}
