/**
 * Hasilkan REVIEW.md — lembar tinjauan konten medis untuk dokter reviewer.
 * Isinya diambil langsung dari file data, jadi selalu sinkron.
 *
 * Jalankan: npm run review-sheet
 */
import { writeFileSync } from 'node:fs';
import type { Condition, DiseaseTemplate, FindingRule, GameContent, ParamDef } from '../src/core/types';
import { idealWorkupCost } from '../src/core/scoring';
import { formatNumber, formatRupiah } from '../src/core/text';
import { GAME_CONFIG, loadDefaultContent } from '../src/data';

const content: GameContent = loadDefaultContent();
const out: string[] = [];
const line = (s = '') => out.push(s);
const pct = (p: number | undefined) => `${Math.round((p ?? 1) * 100)}%`;
const esc = (s: string) => s.replace(/\|/g, '\\|');

function cond(c: Condition | undefined): string {
  if (!c) return '—';
  const parts: string[] = [];
  if (c.dayMin !== undefined || c.dayMax !== undefined) parts.push(`hari ${c.dayMin ?? '…'}–${c.dayMax ?? '…'}`);
  if (c.ageMin !== undefined || c.ageMax !== undefined) parts.push(`usia ${c.ageMin ?? '…'}–${c.ageMax ?? '…'}`);
  if (c.sex) parts.push(c.sex === 'male' ? 'laki-laki' : 'perempuan');
  if (c.traits?.length) parts.push(`trait: ${c.traits.join(' + ')}`);
  if (c.notTraits?.length) parts.push(`tanpa: ${c.notTraits.join(', ')}`);
  if (c.symptoms?.length) parts.push(`gejala: ${c.symptoms.join(' + ')}`);
  if (c.notSymptoms?.length) parts.push(`tanpa gejala: ${c.notSymptoms.join(', ')}`);
  if (c.occupations?.length) parts.push(`pekerjaan: ${c.occupations.join(', ')}`);
  return parts.join('; ');
}

function findingValue(f: FindingRule, param: ParamDef | undefined): string {
  if (f.range) {
    const dec = param?.kind === 'numeric' ? param.decimals : 0;
    const unit = param?.kind === 'numeric' ? ` ${param.unit}` : '';
    return `${formatNumber(f.range[0], dec)}–${formatNumber(f.range[1], dec)}${unit}`;
  }
  return (f.values ?? []).join(' / ');
}

function diseaseSection(d: DiseaseTemplate): void {
  line(`## ${d.name}`);
  line();
  line(`- **id**: \`${d.id}\` · **SKDI**: ${d.skdiLevel} · **bahaya**: ${d.danger} · **sistem**: ${d.system} · **status**: \`${d.review.status}\``);
  line(`- **Hari sakit saat datang**: ${d.presentationDay[0]}–${d.presentationDay[1]}`);
  line(`- **Demografi**: laki-laki ${pct(d.demographics.maleRatio)}; usia ${d.demographics.ageBands.map((b) => `${b.min}–${b.max} (bobot ${b.weight})`).join(', ')}`);
  if (d.demographics.occupations?.length) {
    line(`- **Pekerjaan berisiko** (bias ${pct(d.demographics.occupationBias ?? 0)}): ${d.demographics.occupations.map((o) => content.occupationsById.get(o.id)?.label ?? o.id).join(', ')}`);
  }
  line(`- **Pemeriksaan ideal**: ${d.idealWorkup.map((t) => content.toolsById.get(t)?.name ?? t).join(', ')} (${formatRupiah(idealWorkupCost(d, GAME_CONFIG))})`);
  line();
  line(`> ${d.summary}`);
  line();

  if (d.traits?.length) {
    line('**Trait laten** (aturan pertama yang cocok per id dipakai)');
    line();
    line('| Trait | Peluang | Kondisi | Keterangan |');
    line('|---|---|---|---|');
    for (const t of d.traits) line(`| ${t.id} | ${pct(t.probability)} | ${esc(cond(t.when))} | ${esc(d.traitLabels?.[t.id] ?? '')} |`);
    line();
  }

  line('**Gejala**');
  line();
  line('| Gejala | Peluang | Kondisi |');
  line('|---|---|---|');
  for (const s of d.symptoms) line(`| ${content.symptomsById.get(s.id)?.label ?? s.id} | ${pct(s.probability)} | ${esc(cond(s.when))} |`);
  line();
  line(`Keluhan utama (prioritas): ${d.chiefComplaint.primary.join(' → ')}; tambahan: ${(d.chiefComplaint.extraPool ?? []).join(', ') || '—'}. Salah kaprah pasien: ${d.misattributions.join(', ')}.`);
  line();

  line('**Temuan pemeriksaan abnormal** (parameter lain = normal)');
  line();
  line('| Alat · parameter | Kondisi | Peluang | Nilai |');
  line('|---|---|---|---|');
  for (const f of d.findings) {
    const tool = content.toolsById.get(f.tool);
    const param = tool?.params.find((p) => p.id === f.param);
    const prob = `${pct(f.probability)}${f.diagnostic ? ' (sensitivitas)' : ''}`;
    const c = [cond(f.when), f.requires ? `jika ${f.requires} abnormal` : ''].filter((x) => x && x !== '—').join('; ') || '—';
    line(`| ${tool?.name ?? f.tool} · ${param?.label ?? f.param} | ${esc(c)} | ${prob} | ${esc(findingValue(f, param))} |`);
  }
  line();

  line('**Petunjuk anamnesis** (jawaban bertanda petunjuk)');
  line();
  for (const [cat, variants] of Object.entries(d.anamnesis)) {
    for (const v of variants.filter((x) => x.clue)) line(`- _${cat}_: "${v.text}" → **${v.clue}**`);
  }
  line();
  line('**Temuan khas (layar edukasi)**');
  line();
  for (const k of d.keyFindings) line(`- ${k}`);
  line();
  if (d.review.notes?.length) {
    line('**Catatan pengembang**');
    line();
    for (const n of d.review.notes) line(`- ${n}`);
    line();
  }
  if (d.review.references?.length) {
    line('**Rujukan**');
    line();
    for (const r of d.review.references) line(`- ${r}`);
    line();
  }
  line('**Checklist reviewer**');
  line();
  for (const item of [
    'Nama, alias, tingkat SKDI, dan tingkat bahaya sudah tepat',
    'Demografi & faktor risiko sesuai epidemiologi Indonesia',
    'Probabilitas gejala masuk akal',
    'Rentang nilai lab & sensitivitas tes sesuai literatur',
    'Jawaban anamnesis & petunjuk realistis (bahasa awam)',
    'Temuan khas, catatan pembelajaran, dan cara membedakan akurat',
  ]) {
    line(`- [ ] ${item}`);
  }
  line();
  line('---');
  line();
}

line('# Lembar Tinjauan Konten Medis — Meja Praktek');
line();
line('> ⚠️ Dibuat otomatis oleh `npm run review-sheet` dari file di `src/data`. Jangan edit manual —');
line('> perbaiki file JSON-nya, lalu jalankan ulang skrip ini.');
line();
line('Seluruh konten berstatus **BELUM DITINJAU DOKTER**. Setelah ditinjau, ubah `review.status` di file');
line('JSON penyakit menjadi `DISETUJUI` dan isi `reviewer` serta `date`.');
line();
line('## Ringkasan');
line();
line('| Penyakit | SKDI | Bahaya | Status |');
line('|---|---|---|---|');
for (const d of content.diseases) line(`| ${d.name} | ${d.skdiLevel} | ${d.danger} | \`${d.review.status}\` |`);
line();
line('## Alat pemeriksaan, harga, dan nilai rujukan');
line();
line('| Alat | Kategori | Harga | Parameter (rujukan) | Positif palsu |');
line('|---|---|---|---|---|');
for (const t of content.tools) {
  const params = t.params
    .map((p) => {
      if (p.kind === 'numeric') return `${p.label}: ${p.refText ?? `${formatNumber(p.ref[0], p.decimals)}–${formatNumber(p.ref[1], p.decimals)}`}${p.unit ? ` ${p.unit}` : ''}`;
      return `${p.label}: ${p.refText ?? p.normal.join(' / ')}`;
    })
    .join('<br>');
  const fp = t.params.filter((p) => p.falsePositiveRate).map((p) => `${p.label} ${pct(p.falsePositiveRate)}`).join('<br>') || '—';
  line(`| ${t.name} | ${t.category} | ${formatRupiah(GAME_CONFIG.toolPrices[t.id] ?? 0)} | ${esc(params)} | ${esc(fp)} |`);
}
line();
for (const d of content.diseases) diseaseSection(d);

writeFileSync('REVIEW.md', out.join('\n'));
console.log(`✓ REVIEW.md ditulis (${content.diseases.length} penyakit, ${out.length} baris).`);
