/**
 * Hasilkan REVIEW.md — lembar tinjauan konten medis untuk dokter reviewer.
 * Isinya diambil langsung dari file data, jadi selalu sinkron.
 *
 * Jalankan: npm run review-sheet
 */
import { writeFileSync } from 'node:fs';
import { DISPOSITION_LABEL } from '../src/core/evaluation';
import { planTestCost } from '../src/core/scoring';
import type { Condition, DiseaseTemplate, EvidenceRef, FindingRule, GameContent, ParamDef } from '../src/core/types';
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

const toolName = (id: string) => content.toolsById.get(id)?.name ?? id;
const catalogName = (id: string) => content.catalogById.get(id)?.name ?? id;

function evidence(ref: EvidenceRef | undefined): string {
  if (!ref) return '—';
  return [
    ...(ref.topics ?? []).map((t) => `anamnesis: ${content.anamnesisById.get(t)?.label ?? t}`),
    ...(ref.symptoms ?? []).map((x) => `gejala: ${content.symptomsById.get(x)?.label ?? x}`),
    ...(ref.tools ?? []).map(toolName),
  ].join('; ');
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
  line(`- **Biaya penunjang kunci**: ${formatRupiah(planTestCost(d, GAME_CONFIG))} · semua sesuai rencana: ${formatRupiah(planTestCost(d, GAME_CONFIG, ['kunci', 'pendukung', 'komplikasi']))}`);
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
  line('**Rencana pemeriksaan sesuai indikasi** (dasar penilaian)');
  line();
  line('| Jenis | Pemeriksaan | Peran | Kondisi | Alasan |');
  line('|---|---|---|---|---|');
  for (const it of d.plan.exams) line(`| Fisik | ${toolName(it.tool)} | ${it.role} | ${esc(cond(it.when))} | ${esc(it.reason)} |`);
  for (const it of d.plan.tests) line(`| Penunjang | ${toolName(it.tool)}${it.group ? ` _(grup ${it.group})_` : ''} | ${it.role} | ${esc(cond(it.when))} | ${esc(it.reason)} |`);
  for (const u of d.plan.unnecessary ?? []) line(`| Tidak perlu | ${toolName(u.tool)} | — | — | ${esc(u.reason)} |`);
  if (d.plan.keyTopics?.length) line(`\nTopik anamnesis kunci: ${d.plan.keyTopics.map((t) => content.anamnesisById.get(t)?.label ?? t).join(', ')}.`);
  line();

  line('**Diagnosis banding**');
  line();
  line('| Kondisi | Wajib disingkirkan | Bukti untuk menyingkirkan | Cara membedakan |');
  line('|---|---|---|---|');
  for (const x of d.differentials) line(`| ${catalogName(x.id)} | ${x.mustNotMiss ? 'Ya' : '—'} | ${esc(evidence(x.excludeBy))} | ${esc(x.howToDistinguish)} |`);
  line();

  if (d.complications?.length) {
    line('**Komplikasi & tanda bahaya**');
    line();
    line('| Komplikasi | Trait | Tanda bahaya | Cara menilai | Penjelasan |');
    line('|---|---|---|---|---|');
    for (const x of d.complications) line(`| ${x.name} | ${x.trait} | ${x.redFlag ? 'Ya' : '—'} | ${esc(evidence(x.assess))} | ${esc(x.explanation)} |`);
    line();
  }

  line('**Disposisi** (aturan pertama yang cocok)');
  line();
  for (const r of d.disposition) {
    const also = r.alsoAccept?.length ? ` (juga diterima: ${r.alsoAccept.map((a) => DISPOSITION_LABEL[a]).join(', ')})` : '';
    line(`- ${cond(r.when)} → **${DISPOSITION_LABEL[r.value]}**${also}: ${r.reason}`);
  }
  line();
  line('**Prinsip tata laksana** (tanpa dosis)');
  line();
  for (const m of d.management) line(`- ${m}`);
  line();
  line('**Langkah penalaran yang dianjurkan**');
  line();
  d.approach.forEach((a, i) => line(`${i + 1}. ${a}`));
  line();
  if (d.pitfalls?.length) {
    line('**Jebakan penalaran (umpan balik)**');
    line();
    for (const p of d.pitfalls) line(`- \`${JSON.stringify(p.when)}\` → ${p.text}`);
    line();
  }

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
    'Rencana pemeriksaan (kunci/pendukung/komplikasi) & pemeriksaan "tidak perlu" sesuai praktik layanan primer',
    'Komplikasi, tanda bahaya, dan aturan disposisi/rujukan tepat',
    'Prinsip tata laksana & jebakan penalaran akurat',
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
line('| Alat | Kategori | Tujuan | Harga | Parameter (rujukan) | Positif palsu |');
line('|---|---|---|---|---|---|');
for (const t of content.tools) {
  const params = t.params
    .map((p) => {
      if (p.kind === 'numeric') return `${p.label}: ${p.refText ?? `${formatNumber(p.ref[0], p.decimals)}–${formatNumber(p.ref[1], p.decimals)}`}${p.unit ? ` ${p.unit}` : ''}`;
      return `${p.label}: ${p.refText ?? p.normal.join(' / ')}`;
    })
    .join('<br>');
  const fp = t.params.filter((p) => p.falsePositiveRate).map((p) => `${p.label} ${pct(p.falsePositiveRate)}`).join('<br>') || '—';
  const purpose = [t.objectives?.join(', '), t.purpose].filter(Boolean).join(' — ') || '—';
  line(`| ${t.name} | ${t.category} | ${esc(purpose)} | ${formatRupiah(GAME_CONFIG.toolPrices[t.id] ?? 0)} | ${esc(params)} | ${esc(fp)} |`);
}
line();
line('## Komorbiditas (dapat menyertai penyakit utama)');
line();
line('| Kondisi | Peluang | Syarat | Pasien tahu | Gejala | Temuan | Dideteksi dengan |');
line('|---|---|---|---|---|---|---|');
for (const c of content.comorbidities) {
  const findings = c.findings.map((f) => `${toolName(f.tool)} · ${f.param}: ${findingValue(f, content.toolsById.get(f.tool)?.params.find((p) => p.id === f.param))}`).join('<br>');
  const syarat = [c.when ? cond(c.when) : '', c.excludePrimary?.length ? `bukan pada ${c.excludePrimary.join(', ')}` : ''].filter(Boolean).join('; ') || '—';
  line(`| ${c.name} | ${pct(c.probability)} | ${esc(syarat)} | ${pct(c.knownProbability)} | ${(c.symptoms ?? []).map((x) => `${x.id} ${pct(x.probability)}`).join(', ') || '—'} | ${esc(findings)} | ${esc(evidence(c.detectBy))} |`);
}
line();
line('## Temuan insidental');
line();
line('| Kondisi | Peluang | Syarat | Temuan | Catatan |');
line('|---|---|---|---|---|');
for (const i of content.incidentals) {
  const findings = i.findings.map((f) => `${toolName(f.tool)} · ${f.param}: ${findingValue(f, content.toolsById.get(f.tool)?.params.find((p) => p.id === f.param))}`).join('<br>');
  line(`| ${i.name} | ${pct(i.probability)} | ${esc(i.when ? cond(i.when) : '—')} | ${esc(findings)} | ${esc(i.note)} |`);
}
line();
line('## Kondisi khusus diagnosis banding (tidak muncul sebagai pasien)');
line();
line('| Kondisi | Sistem | Bahaya | Ringkasan |');
line('|---|---|---|---|');
for (const c of content.conditions) line(`| ${c.name} | ${c.system} | ${c.danger} | ${esc(c.summary)} |`);
line();
line('## Topik anamnesis');
line();
line('| Topik | Rubrik | Inti | Bobot | Mengapa penting |');
line('|---|---|---|---|---|');
for (const a of content.anamnesis) line(`| ${a.label} | ${a.rubric} | ${a.core ? 'Ya' : '—'} | ${a.weight ?? 1} | ${esc(a.why)} |`);
line();
line('## Penampilan pasien 3D: isyarat klinis yang TERLIHAT');
line();
line('Yang terlihat pada pasien (postur, perilaku, warna kulit) hanya muncul bila gejala/temuannya ada pada kasus.');
line('Gejala yang tidak tercantum di sini hanya bisa diketahui lewat anamnesis atau pemeriksaan.');
line();
line('| Sumber | Syarat | Isyarat yang terlihat | Kekuatan |');
line('|---|---|---|---|');
for (const r of content.appearance.symptomCues) {
  const label = r.cue === 'pegang' && r.site ? `sesekali memegang ${r.site.replace('_', ' ')}` : content.appearance.cueLabels[r.cue];
  line(`| Gejala | ${content.symptomsById.get(r.symptom)?.label ?? r.symptom} | ${esc(label)} | ${pct(r.level)} |`);
}
for (const r of content.appearance.findingCues) {
  const tool = content.toolsById.get(r.tool);
  const param = tool?.params.find((x) => x.id === r.param);
  const syarat = r.match !== undefined ? `hasil abnormal memuat "${r.match}"` : r.min !== undefined ? `≥ ${r.min}` : r.max !== undefined ? `≤ ${r.max}` : 'abnormal';
  line(`| Temuan: ${tool?.name ?? r.tool} · ${param?.label ?? r.param} | ${esc(syarat)} | ${esc(content.appearance.cueLabels[r.cue])} | ${pct(r.level)} |`);
}
line();
line('Selain itu: tinggi & bentuk badan mengikuti hasil antropometri kasus (TB, IMT); laju napas mengikuti frekuensi napas pada tanda vital;');
line('pakaian mengikuti pekerjaan (mis. seragam sekolah); pasien demam/menggigil cenderung datang berjaket.');
line();
line('**Lokasi yang ditunjuk pasien saat membicarakan gejala**');
line();
line(Object.entries(content.appearance.sites).map(([sym, site]) => `${content.symptomsById.get(sym)?.label ?? sym} → ${site.replace('_', ' ')}`).join(' · '));
line();
for (const d of content.diseases) diseaseSection(d);

writeFileSync('REVIEW.md', out.join('\n'));
console.log(`✓ REVIEW.md ditulis (${content.diseases.length} penyakit, ${out.length} baris).`);
