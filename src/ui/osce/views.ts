/**
 * Tampilan mode OSCE: menu, lembar tugas, HUD bertimer, tab Tatalaksana (resep, non-farmakologi,
 * KIE), stasiun prosedur, lembar rubrik hasil, dan rekap rangkaian.
 */
import { drugSearchText } from '../../core/osce/content';
import { expectedQuantity, patientWeight, signaText, toRoman } from '../../core/osce/prescription';
import { procedureCards } from '../../core/osce/procedure';
import { CATEGORY_LABEL } from '../../core/osce/station';
import type { AdviceOption, OsceCategory, PrescriptionLine, ProcedureResult } from '../../core/osce/types';
import { createRng } from '../../core/rng';
import { normalizeForSearch, patientAgeText } from '../../core/text';
import type { EncounterState } from '../../core/types';
import type { App } from '../app';
import { modal } from '../components/modal';
import { cx, h } from '../dom';
import { SEX_LABEL } from '../labels';
import { clusters, formatClock, secondsLeft, sessionSummary, type StationOutcome } from './session';

const TASKS = [
  'Anamnesis lanjutan (termasuk tanda bahaya)',
  'Pemeriksaan fisik spesifik',
  'Usulan & interpretasi pemeriksaan penunjang (tandai hasil abnormal)',
  'Diagnosis kerja & minimal 2 diagnosis banding',
  'Tatalaksana farmakologi & penulisan resep',
  'Tatalaksana non-farmakologi & disposisi',
  'Komunikasi, informasi & edukasi (KIE)',
];

/** Persen gaya Indonesia: 57,1%. */
export function pct(n: number): string {
  return `${n.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`;
}

function badge(cat: OsceCategory): HTMLElement {
  return h('span', { class: `osce-badge osce-badge--${cat}` }, CATEGORY_LABEL[cat]);
}

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

export function renderOsceMenu(app: App): HTMLElement {
  const s = app.osceSetup;
  const osce = app.osceContent;
  const option = (name: string, value: string, label: string, checked: boolean, onchange: () => void) =>
    h('label', { class: 'radio' }, h('input', { type: 'radio', name, value, checked, onchange }), ` ${label}`);
  const history = app.osceHistory();
  return h(
    'main',
    { class: 'osce-menu' },
    h('h1', null, 'Latihan OSCE'),
    h(
      'p',
      { class: 'hint' },
      'Format stasiun mengikuti rubrik OSCE komprehensif: 7 tugas dinilai 0–1–2 (total /14). Superior ≥ 90%, Lulus 70–89%, Tidak lulus < 70% atau ada kesalahan kritis (salah diagnosis, obat berbahaya, pasien gawat dipulangkan).',
    ),
    h(
      'fieldset',
      null,
      h('legend', null, 'Jenis stasiun'),
      option('jenis', 'klinis', 'Klinis — pasien simulasi (anamnesis s/d KIE)', s.type === 'klinis', () => app.patchOsceSetup({ type: 'klinis' })),
      option('jenis', 'prosedur', 'Prosedur — keterampilan klinis (urutan langkah)', s.type === 'prosedur', () => app.patchOsceSetup({ type: 'prosedur' })),
      option('jenis', 'campuran', 'Campuran (simulasi ujian)', s.type === 'campuran', () => app.patchOsceSetup({ type: 'campuran' })),
    ),
    s.type !== 'prosedur'
      ? h(
          'fieldset',
          null,
          h('legend', null, 'Kelompok kasus klinis'),
          option('klaster', 'semua', 'Semua kelompok (acak)', s.cluster === 'semua', () => app.patchOsceSetup({ cluster: 'semua' })),
          clusters(osce).map((c) => option('klaster', c, c, s.cluster === c, () => app.patchOsceSetup({ cluster: c }))),
          h('p', { class: 'hint' }, 'Diagnosis tidak diberitahukan — sama seperti ujian.'),
        )
      : null,
    s.type !== 'klinis'
      ? h(
          'fieldset',
          null,
          h('legend', null, 'Prosedur'),
          h(
            'select',
            { class: 'select', 'aria-label': 'Pilih prosedur', onchange: (e: Event) => app.patchOsceSetup({ procedureId: (e.target as HTMLSelectElement).value }) },
            h('option', { value: 'acak', selected: s.procedureId === 'acak' }, 'Acak'),
            osce.procedures.map((p) => h('option', { value: p.id, selected: s.procedureId === p.id }, `${p.title} (${p.system})`)),
          ),
        )
      : null,
    h(
      'fieldset',
      null,
      h('legend', null, 'Jumlah stasiun'),
      [1, 4, 8, 12].map((n) => option('jumlah', String(n), n === 1 ? '1 stasiun' : `${n} stasiun berurutan`, s.count === n, () => app.patchOsceSetup({ count: n }))),
    ),
    h(
      'fieldset',
      null,
      h('legend', null, 'Waktu per stasiun'),
      [10, 15, 20].map((m) => option('waktu', String(m), `${m} menit`, s.minutes === m, () => app.patchOsceSetup({ minutes: m }))),
      option('waktu', 'bebas', 'Tanpa batas (belajar)', s.minutes === null, () => app.patchOsceSetup({ minutes: null })),
    ),
    h(
      'div',
      { class: 'title-actions' },
      h('button', { class: 'btn btn--primary btn--lg', type: 'button', onclick: () => app.startOsce() }, 'Mulai stasiun'),
      h('button', { class: 'btn', type: 'button', onclick: () => app.backToTitle() }, 'Kembali'),
    ),
    history.length
      ? h(
          'section',
          { class: 'osce-history' },
          h('h2', { class: 'section-title' }, 'Riwayat latihan'),
          h(
            'ul',
            { class: 'plain-list' },
            history.slice(0, 8).map((r) => h('li', null, badge(r.category), ` ${r.title} — ${pct(r.percent)} `, h('span', { class: 'hint' }, r.date))),
          ),
        )
      : null,
  );
}

// ---------------------------------------------------------------------------
// Lembar tugas & HUD
// ---------------------------------------------------------------------------

export function briefingDialog(app: App): HTMLElement {
  const session = app.osce!;
  const spec = session.stations[session.index]!;
  const minutes = session.setup.minutes;
  const head = `Stasiun ${session.index + 1} dari ${session.stations.length}`;
  if (spec.kind === 'prosedur') {
    const p = app.osceContent.proceduresById.get(spec.procedureId)!;
    return modal({
      title: `${head} · Prosedur`,
      wide: true,
      body: h(
        'div',
        { class: 'briefing' },
        h('p', null, h('strong', null, p.title), ` · ${p.system} · SKDI ${p.skdi}`),
        h('p', null, p.scenario),
        h('h3', { class: 'section-title' }, 'Tugas'),
        h('ol', null, h('li', null, 'Susun langkah tindakan secara berurutan (hati-hati: ada langkah yang keliru/berbahaya).'), h('li', null, 'Jawab pertanyaan kritis penguji.')),
        h('p', { class: 'hint' }, minutes ? `Waktu: ${minutes} menit, dimulai saat Anda menekan "Mulai".` : 'Tanpa batas waktu.'),
      ),
      actions: [h('button', { class: 'btn btn--primary', type: 'button', 'data-autofocus': true, onclick: () => app.beginStation() }, 'Mulai')],
      onClose: () => app.beginStation(),
    });
  }
  const enc = app.encounter!;
  const c = enc.case;
  const def = app.osceContent.casesById.get(c.diseaseId)!;
  return modal({
    title: `${head} · ${def.station}`,
    wide: true,
    body: h(
      'div',
      { class: 'briefing' },
      h('p', null, h('strong', null, 'Skenario: '), c.patient.companion
        ? `${c.patient.name}, ${patientAgeText(c.patient)}, ${SEX_LABEL[c.patient.sex].toLowerCase()}, dibawa ${c.patient.companion.relation}nya ke ${def.setting}. Pengantar akan menyampaikan keluhan anaknya (alloanamnesis).`
        : `${c.patient.name}, ${patientAgeText(c.patient)}, ${SEX_LABEL[c.patient.sex].toLowerCase()}, ${c.patient.occupationLabel.toLowerCase()}, datang ke ${def.setting} dengan keluhan yang akan ia sampaikan sendiri.`),
      h('h3', { class: 'section-title' }, 'Tugas peserta'),
      h('ol', null, TASKS.map((t) => h('li', null, t))),
      h(
        'p',
        { class: 'hint' },
        'Perilaku profesional ikut dicatat: beri salam & perkenalkan diri, konfirmasi identitas, minta izin sebelum memeriksa (mis. ketik "Permisi, saya periksa dulu ya"), tunjukkan empati, dan tutup konsultasi. Di mode OSCE penanda abnormal hasil penunjang disembunyikan — Anda yang menandainya.',
      ),
      h('p', { class: 'hint' }, minutes ? `Waktu: ${minutes} menit, mulai saat Anda menekan "Mulai". Bila waktu habis, stasiun dinilai apa adanya.` : 'Tanpa batas waktu (mode belajar).'),
    ),
    actions: [h('button', { class: 'btn btn--primary', type: 'button', 'data-autofocus': true, onclick: () => app.beginStation() }, 'Mulai')],
    onClose: () => app.beginStation(),
  });
}

export function osceHudItems(app: App): HTMLElement[] {
  const session = app.osce!;
  const left = secondsLeft(session, Date.now());
  return [
    h('span', { class: 'hud__patient' }, `OSCE · Stasiun ${session.index + 1}/${session.stations.length}`),
    h(
      'span',
      { class: cx('osce-timer', left !== null && left <= 120 && 'osce-timer--low'), 'data-osce-timer': true, role: 'timer', 'aria-label': 'Sisa waktu stasiun' },
      left === null ? (session.setup.minutes === null ? '∞' : '--:--') : formatClock(left),
    ),
  ];
}

// ---------------------------------------------------------------------------
// Tab Tatalaksana
// ---------------------------------------------------------------------------

function shuffledAdvice(list: readonly AdviceOption[], seed: number): AdviceOption[] {
  const out = [...list];
  const rng = createRng(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function prescriptionLineText(app: App, line: PrescriptionLine): { r: string; s: string } {
  const entry = app.osceContent.formsById.get(line.form);
  if (!entry) return { r: line.drug, s: '' };
  return { r: `R/ ${entry.drug.name} ${entry.form.label} No. ${toRoman(line.quantity)}`, s: signaText(line, entry.form) };
}

/**
 * Tab Tatalaksana (mode OSCE & mode praktik): resep, saran non-farmakologi, dan KIE.
 * Mode praktik menyimpan isinya di konsultasi; mode OSCE di sesi stasiun.
 */
export function treatmentTab(app: App, enc: EncounterState): HTMLElement {
  const work = app.treatmentWork;
  const c = enc.case;
  const def = app.osceContent.casesById.get(c.diseaseId);
  const weighed = enc.examsDone.includes('timbangan');
  const kg = patientWeight(c);
  const disabled = !app.canInteract;
  if (!def) {
    return h(
      'div',
      { class: 'tab-panel osce-treatment' },
      h(
        'p',
        { class: 'banner banner--info', role: 'status' },
        'Data terapi untuk penyakit ini belum tersedia — tab Tatalaksana tidak dinilai pada pasien ini. Bobotnya dibagi ke komponen lain sehingga total tetap 100.',
      ),
      h('p', { class: 'hint' }, 'Lanjutkan ke tab Keputusan untuk menetapkan diagnosis & disposisi.'),
    );
  }
  const allergyAsked = enc.askedTopics.includes('alergi');
  return h(
    'div',
    { class: 'tab-panel osce-treatment' },
    h(
      'p',
      { class: 'hint' },
      'Tuliskan resep, saran non-farmakologi, dan edukasi (KIE). Tanyakan alergi obat & timbang pasien bila dosis berbasis berat badan. Lalu tetapkan diagnosis & disposisi di tab Keputusan.',
    ),
    app.osce ? null : h('p', { class: 'hint' }, 'Dinilai: resep tepat (obat, dosis, aturan pakai, lama, jumlah), saran non-farmakologi, dan KIE. Obat yang membuat pasien alergi, obat berbahaya, atau antibiotik tanpa indikasi menurunkan skor dan reputasi.'),
    h(
      'section',
      { class: 'rx' },
      h('h3', { class: 'section-title' }, 'Resep'),
      h(
        'div',
        { class: 'rx__paper' },
        h('p', { class: 'rx__head' }, app.osce ? `${def.setting.toUpperCase()} · dr. (Anda) · SIP 000/DU/OSCE` : 'PRAKTIK DOKTER UMUM · dr. (Anda) · SIP 000/DU'),
        work.prescription.length
          ? work.prescription.map((line, i) => {
              const t = prescriptionLineText(app, line);
              return h(
                'div',
                { class: 'rx__line' },
                h('div', null, h('div', { class: 'rx__r' }, t.r), h('div', { class: 'rx__s' }, `${t.s} ———— (paraf)`)),
                h('button', { class: 'btn btn--small btn--ghost', type: 'button', disabled, 'aria-label': 'Hapus obat', onclick: () => app.removeRxLine(i) }, 'Hapus'),
              );
            })
          : h('p', { class: 'hint' }, 'Belum ada obat. Tambahkan di bawah (atau biarkan kosong bila memang tidak perlu obat).'),
        h('p', { class: 'rx__pro' }, `Pro: ${c.patient.companion ? 'An. ' : ''}${c.patient.name} (${patientAgeText(c.patient).replace(' tahun', ' th')}) · BB: ${weighed && kg ? `${String(kg).replace('.', ',')} kg` : '— (belum ditimbang)'}`),
        h('p', { class: 'rx__pro' }, `Alergi obat: ${allergyAsked ? (c.allergy ?? 'tidak ada') : '— (belum ditanyakan)'}`),
      ),
      drugForm(app, disabled, weighed ? kg : null),
    ),
    adviceChecklist(app, 'Tatalaksana non-farmakologi', shuffledAdvice(def.nonPharm, c.seed), work.nonPharm, (id) => app.toggleOsceAdvice('nonPharm', id), disabled),
    adviceChecklist(app, 'Komunikasi, informasi & edukasi (KIE)', shuffledAdvice(def.education, c.seed + 1), work.education, (id) => app.toggleOsceAdvice('education', id), disabled),
    h('div', { class: 'tab-next' }, h('button', { class: 'btn btn--primary', type: 'button', onclick: () => app.setTab('keputusan') }, 'Lanjut ke Keputusan ▸')),
  );
}

function adviceChecklist(app: App, title: string, options: AdviceOption[], chosen: string[], toggle: (id: string) => void, disabled: boolean): HTMLElement {
  void app;
  return h(
    'section',
    { class: 'osce-check' },
    h('h3', { class: 'section-title' }, title),
    h('p', { class: 'hint' }, 'Pilih semua yang tepat untuk pasien ini. Ada pilihan yang keliru atau berbahaya.'),
    h(
      'ul',
      { class: 'plain-list' },
      options.map((o) =>
        h(
          'li',
          null,
          h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: chosen.includes(o.id), disabled, onchange: () => toggle(o.id) }), ` ${o.text}`),
        ),
      ),
    ),
  );
}

/** Satuan kekuatan sediaan yang bisa dihitung per kgBB. */
const PER_KG_UNITS = new Set(['mg', 'mcg', 'g', 'IU', 'mL']);

const num1 = (n: number) => (Math.round(n * 100) / 100).toLocaleString('id-ID');

/** Hitungan dosis draf: per kali, per hari, dan per kgBB (hanya hitungan — tidak menilai benar/salah). */
function doseCheck(d: { units: number; schedule: PrescriptionLine['schedule']; timesPerDay: number }, form: { strength: number; unit: string }, kg: number | null): HTMLElement | null {
  if (!PER_KG_UNITS.has(form.unit) || !(d.units > 0)) return null;
  const perDose = d.units * form.strength;
  const perDay = perDose * (d.schedule === 'tunggal' ? 1 : d.timesPerDay);
  const parts = [`Per kali ${num1(perDose)} ${form.unit}`];
  if (d.schedule !== 'tunggal') parts.push(`per hari ${num1(perDay)} ${form.unit}`);
  return h(
    'p',
    { class: 'hint rx-field--wide rx-dose', 'aria-live': 'polite' },
    `${parts.join(' · ')}`,
    kg
      ? ` · ≈ ${num1(perDose / kg)} ${form.unit}/kgBB per kali${d.schedule !== 'tunggal' ? ` (${num1(perDay / kg)} ${form.unit}/kgBB/hari)` : ''} untuk BB ${num1(kg)} kg`
      : ' · timbang pasien (tab Fisik → Timbangan) untuk menghitung dosis per kgBB',
  );
}

function drugForm(app: App, disabled: boolean, kg: number | null): HTMLElement {
  const osce = app.osceContent;
  const d = app.rxDraft;
  const q = normalizeForSearch(d.query);
  const matches = q ? osce.drugs.filter((x) => normalizeForSearch(drugSearchText(x)).includes(q)).slice(0, 8) : [];
  const drug = d.drug ? osce.drugsById.get(d.drug) : undefined;
  const form = drug && d.form ? drug.forms.find((f) => f.id === d.form) : undefined;
  const auto = form ? expectedQuantity(d, form) : 0;
  const quantity = d.quantity ?? auto;
  const num = (label: string, value: number, step: number, min: number, onchange: (v: number) => void) =>
    h(
      'label',
      { class: 'rx-field' },
      h('span', null, label),
      h('input', { class: 'input', type: 'number', inputmode: 'decimal', value: String(value), step: String(step), min: String(min), disabled, onchange: (e: Event) => onchange(Number((e.target as HTMLInputElement).value)) }),
    );
  return h(
    'div',
    { class: 'rx-form' },
    h('label', { class: 'rx-field rx-field--wide' }, h('span', null, 'Cari obat'), h('input', {
      class: 'input',
      type: 'search',
      placeholder: 'mis. parasetamol, omeprazol, OAT…',
      value: d.query,
      disabled,
      'data-focus-key': 'cari-obat',
      oninput: (e: Event) => app.patchRxDraft({ query: (e.target as HTMLInputElement).value }, false),
      onchange: () => app.patchRxDraft({}),
    })),
    matches.length && !drug
      ? h('div', { class: 'chip-row' }, matches.map((m) => h('button', { class: 'chip', type: 'button', disabled, onclick: () => app.patchRxDraft({ drug: m.id, form: m.forms[0]!.id, query: m.name, quantity: null }) }, m.name)))
      : null,
    drug
      ? h(
          'div',
          { class: 'rx-grid' },
          h('p', { class: 'rx-field--wide' }, h('strong', null, drug.name), ' ', h('button', { class: 'btn btn--small btn--ghost', type: 'button', onclick: () => app.patchRxDraft({ drug: null, form: null, query: '' }) }, 'ganti')),
          h(
            'label',
            { class: 'rx-field' },
            h('span', null, 'Sediaan'),
            h('select', { class: 'select', disabled, onchange: (e: Event) => app.patchRxDraft({ form: (e.target as HTMLSelectElement).value, quantity: null }) }, drug.forms.map((f) => h('option', { value: f.id, selected: f.id === d.form }, f.label))),
          ),
          num(`Per kali (${form?.dosageUnit ?? 'satuan'})`, d.units, 0.25, 0.25, (v) => app.patchRxDraft({ units: v > 0 ? v : 1, quantity: null })),
          h(
            'label',
            { class: 'rx-field' },
            h('span', null, 'Aturan'),
            h(
              'select',
              { class: 'select', disabled, onchange: (e: Event) => app.patchRxDraft({ schedule: (e.target as HTMLSelectElement).value as PrescriptionLine['schedule'], quantity: null }) },
              h('option', { value: 'rutin', selected: d.schedule === 'rutin' }, 'Rutin'),
              h('option', { value: 'prn', selected: d.schedule === 'prn' }, 'Bila perlu (p.r.n.)'),
              h('option', { value: 'tunggal', selected: d.schedule === 'tunggal' }, 'Dosis tunggal'),
            ),
          ),
          d.schedule !== 'tunggal' ? num('Kali sehari', d.timesPerDay, 1, 1, (v) => app.patchRxDraft({ timesPerDay: Math.max(1, Math.round(v)), quantity: null })) : null,
          d.schedule !== 'tunggal' ? num('Lama (hari)', d.days, 1, 1, (v) => app.patchRxDraft({ days: Math.max(1, Math.round(v)), quantity: null })) : null,
          form ? doseCheck(d, form, kg) : null,
          h(
            'label',
            { class: 'rx-field' },
            h('span', null, 'Waktu minum'),
            h(
              'select',
              { class: 'select', disabled, onchange: (e: Event) => app.patchRxDraft({ timing: (e.target as HTMLSelectElement).value as PrescriptionLine['timing'] }) },
              (['', 'sebelum makan', 'sesudah makan', 'saat makan', 'malam hari'] as const).map((t) => h('option', { value: t, selected: d.timing === t }, t || '—')),
            ),
          ),
          num(`Jumlah (No. ${toRoman(quantity)})`, quantity, 1, 1, (v) => app.patchRxDraft({ quantity: Math.max(1, Math.round(v)) })),
          h('button', { class: 'btn btn--primary rx-field--wide', type: 'button', disabled, onclick: () => app.addRxLine() }, 'Tambahkan ke resep'),
        )
      : null,
  );
}

// ---------------------------------------------------------------------------
// Stasiun prosedur
// ---------------------------------------------------------------------------

export function renderProcedure(app: App): HTMLElement {
  const session = app.osce!;
  const spec = session.stations[session.index]!;
  if (spec.kind !== 'prosedur') return h('div');
  const p = app.osceContent.proceduresById.get(spec.procedureId)!;
  const cards = procedureCards(p, spec.seed);
  const { attempt, phase } = session.procedure;
  const textOf = new Map(cards.map((c) => [c.id, c.text]));
  const left = secondsLeft(session, Date.now());
  return h(
    'main',
    { class: 'osce-proc' },
    h(
      'header',
      { class: 'osce-proc__head' },
      h('span', null, `OSCE · Stasiun ${session.index + 1}/${session.stations.length} · Prosedur`),
      h('span', { class: cx('osce-timer', left !== null && left <= 120 && 'osce-timer--low'), 'data-osce-timer': true, role: 'timer' }, left === null ? (session.setup.minutes === null ? '∞' : '--:--') : formatClock(left)),
    ),
    h('h1', null, p.title),
    h('p', { class: 'hint' }, `${p.system} · SKDI ${p.skdi}`),
    h('p', null, p.scenario),
    phase === 'urutan'
      ? h(
          'div',
          { class: 'osce-proc__grid' },
          h(
            'section',
            null,
            h('h2', { class: 'section-title' }, 'Pilihan langkah'),
            h('p', { class: 'hint' }, 'Ketuk langkah sesuai urutan yang Anda lakukan. Langkah yang keliru/berbahaya jangan dipilih.'),
            h(
              'ul',
              { class: 'plain-list proc-cards' },
              cards.filter((c) => !attempt.sequence.includes(c.id)).map((c) => h('li', null, h('button', { class: 'proc-card', type: 'button', disabled: session.startedAt === null, onclick: () => app.procPick(c.id) }, c.text))),
            ),
          ),
          h(
            'section',
            null,
            h('h2', { class: 'section-title' }, `Urutan Anda (${attempt.sequence.length})`),
            attempt.sequence.length
              ? h('ol', { class: 'proc-seq' }, attempt.sequence.map((id, i) => h('li', null, h('span', null, textOf.get(id) ?? id), h('button', { class: 'btn btn--small btn--ghost', type: 'button', 'aria-label': 'Batalkan langkah', onclick: () => app.procRemove(i) }, '✕'))))
              : h('p', { class: 'hint' }, 'Belum ada langkah.'),
            h('button', { class: 'btn btn--primary', type: 'button', disabled: attempt.sequence.length === 0, onclick: () => app.procToQuestions() }, 'Lanjut ke pertanyaan penguji'),
          ),
        )
      : h(
          'section',
          null,
          h('h2', { class: 'section-title' }, 'Pertanyaan penguji'),
          p.questions.map((q) =>
            h(
              'fieldset',
              { class: 'proc-q' },
              h('legend', null, q.question),
              q.options.map((o, i) => h('label', { class: 'radio' }, h('input', { type: 'radio', name: q.id, checked: attempt.answers[q.id] === i, onchange: () => app.procAnswer(q.id, i) }), ` ${o}`)),
            ),
          ),
          h('div', { class: 'title-actions' }, h('button', { class: 'btn', type: 'button', onclick: () => app.procBack() }, '◂ Ubah urutan'), h('button', { class: 'btn btn--primary', type: 'button', onclick: () => app.finishProcedure() }, 'Selesai')),
        ),
  );
}

// ---------------------------------------------------------------------------
// Hasil stasiun & rekap
// ---------------------------------------------------------------------------

function list(items: string[], cls: string): HTMLElement | null {
  return items.length ? h('ul', { class: cx('plain-list', cls) }, items.map((t) => h('li', null, t))) : null;
}

function procedureResultView(app: App, r: ProcedureResult): HTMLElement {
  const p = app.osceContent.proceduresById.get(r.procedureId)!;
  return h(
    'div',
    null,
    r.critical.length ? h('div', { class: 'osce-critical' }, h('strong', null, 'Kesalahan kritis'), list(r.critical, 'osce-bad')) : null,
    h('p', null, `Ketepatan urutan: ${Math.round(r.orderScore * 100)}% · Pertanyaan benar: ${r.questionResults.filter((q) => q.correct).length}/${r.questionResults.length}`),
    r.missingSteps.length ? h('div', null, h('h3', { class: 'section-title' }, 'Langkah terlewat'), list(r.missingSteps.map((s) => s.text + (s.critical ? ' (kritis)' : '')), 'osce-bad')) : null,
    r.outOfOrder.length ? h('div', null, h('h3', { class: 'section-title' }, 'Langkah tidak berurutan'), list(r.outOfOrder.map((s) => s.text), 'osce-warn')) : null,
    r.wrongActions.length ? h('div', null, h('h3', { class: 'section-title' }, 'Tindakan keliru'), list(r.wrongActions.map((d) => `${d.text} — ${d.why}`), 'osce-bad')) : null,
    h('h3', { class: 'section-title' }, 'Pertanyaan penguji'),
    h('ul', { class: 'plain-list' }, r.questionResults.map((q) => h('li', { class: q.correct ? 'osce-good' : 'osce-bad' }, `${q.correct ? '✓' : '✗'} ${q.question.question} — jawaban: ${q.question.options[q.question.answer]}. ${q.question.why}`))),
    h('h3', { class: 'section-title' }, 'Urutan yang benar'),
    h('ol', null, p.steps.map((s) => h('li', null, s.text, s.critical ? h('strong', null, ' (kritis)') : null))),
    h('h3', { class: 'section-title' }, 'Poin kunci'),
    list(p.keyPoints, ''),
    h('p', { class: 'hint' }, `Sumber: ${p.source}`),
  );
}

function clinicalResultView(app: App, o: Extract<StationOutcome, { kind: 'klinis' }>): HTMLElement {
  const r = o.result;
  const disease = app.content.diseasesById.get(r.diseaseId)!;
  return h(
    'div',
    null,
    h('p', null, `Pasien: ${o.patientName} · Diagnosis sebenarnya: `, h('strong', null, disease.name)),
    r.critical.length ? h('div', { class: 'osce-critical' }, h('strong', null, 'Kesalahan kritis (otomatis tidak lulus)'), list(r.critical, 'osce-bad')) : null,
    h(
      'table',
      { class: 'osce-rubric' },
      h('thead', null, h('tr', null, h('th', null, 'No'), h('th', null, 'Komponen'), h('th', null, 'Skor'), h('th', null, 'Kriteria'))),
      h('tbody', null, r.tasks.map((t) => h('tr', { class: `osce-row osce-row--${t.score}` }, h('td', null, String(t.no)), h('td', null, t.label), h('td', { class: 'osce-score' }, `${t.score}/2`), h('td', null, t.criteria[t.score])))),
      h('tfoot', null, h('tr', null, h('td', null, ''), h('th', null, 'Total'), h('th', { class: 'osce-score' }, `${r.total}/${r.max}`), h('td', null, `${pct(r.percent)} · ${CATEGORY_LABEL[r.category]}`))),
    ),
    r.tasks.map((t) =>
      h(
        'details',
        { class: 'frame', open: t.score < 2 },
        h('summary', null, `${t.no}. ${t.label} — ${t.score}/2`),
        t.done.length ? h('div', null, h('strong', null, 'Sudah baik'), list(t.done, 'osce-good')) : null,
        t.missed.length ? h('div', null, h('strong', null, 'Perlu diperbaiki'), list(t.missed, 'osce-bad')) : null,
        h('div', null, h('strong', null, 'Kunci jawaban'), list(t.key_answer, 'osce-key')),
      ),
    ),
    h(
      'details',
      { class: 'frame', open: true },
      h('summary', null, `Perilaku profesional — ${r.professional.score}/2 (dicatat terpisah)`),
      list(r.professional.done.map((x) => `✓ ${x}`), 'osce-good'),
      list(r.professional.missed.map((x) => `✗ ${x}`), 'osce-bad'),
    ),
    o.work.prescription.length
      ? h(
          'details',
          { class: 'frame' },
          h('summary', null, 'Resep Anda'),
          h('div', { class: 'rx__paper' }, o.work.prescription.map((line) => {
            const t = prescriptionLineText(app, line);
            return h('div', { class: 'rx__line' }, h('div', null, h('div', { class: 'rx__r' }, t.r), h('div', { class: 'rx__s' }, t.s)));
          })),
        )
      : null,
    h('p', { class: 'hint' }, `Penilaian klinis lengkap (skala praktik): ${o.clinical.total}/100.`),
  );
}

export function renderOsceResult(app: App): HTMLElement {
  const session = app.osce!;
  const o = session.outcomes.at(-1)!;
  const last = session.index >= session.stations.length - 1;
  const title = o.kind === 'klinis' ? o.result.stationTitle : app.osceContent.proceduresById.get(o.result.procedureId)!.title;
  const used = o.kind === 'klinis' ? o.result.secondsUsed : null;
  return h(
    'main',
    { class: 'osce-result' },
    h('p', { class: 'hint' }, `OSCE · Stasiun ${session.index + 1}/${session.stations.length}${session.timeUp ? ' · ⏰ waktu habis' : ''}${used !== null ? ` · waktu ${formatClock(used)}` : ''}`),
    h('h1', null, title, ' ', badge(o.result.category)),
    h('p', { class: 'osce-percent' }, pct(o.result.percent)),
    o.kind === 'klinis' ? clinicalResultView(app, o) : procedureResultView(app, o.result),
    h(
      'div',
      { class: 'title-actions' },
      last
        ? h('button', { class: 'btn btn--primary', type: 'button', onclick: () => app.osceFinish() }, session.stations.length > 1 ? 'Lihat rekap' : 'Selesai')
        : h('button', { class: 'btn btn--primary', type: 'button', onclick: () => app.osceNext() }, 'Stasiun berikutnya ▸'),
      h('button', { class: 'btn', type: 'button', onclick: () => app.osceRetry() }, 'Ulangi stasiun ini'),
      h('button', { class: 'btn btn--ghost', type: 'button', onclick: () => app.openOsceMenu() }, 'Menu OSCE'),
    ),
  );
}

export function renderOsceFinal(app: App): HTMLElement {
  const session = app.osce!;
  const sum = sessionSummary(session.outcomes);
  return h(
    'main',
    { class: 'osce-result' },
    h('h1', null, 'Rekap simulasi OSCE'),
    h('p', { class: 'osce-percent' }, pct(sum.average)),
    h('p', null, `${sum.passed} dari ${sum.total} stasiun lulus · ${sum.superior} superior`),
    h(
      'table',
      { class: 'osce-rubric' },
      h('thead', null, h('tr', null, h('th', null, 'No'), h('th', null, 'Stasiun'), h('th', null, 'Nilai'), h('th', null, 'Kategori'))),
      h(
        'tbody',
        null,
        session.outcomes.map((o, i) =>
          h(
            'tr',
            null,
            h('td', null, String(i + 1)),
            h('td', null, o.kind === 'klinis' ? `${o.result.stationTitle} (${app.content.diseasesById.get(o.result.diseaseId)?.name})` : app.osceContent.proceduresById.get(o.result.procedureId)!.title),
            h('td', { class: 'osce-score' }, o.kind === 'klinis' ? `${o.result.total}/${o.result.max} (${pct(o.result.percent)})` : pct(o.result.percent)),
            h('td', null, badge(o.result.category)),
          ),
        ),
      ),
    ),
    h(
      'div',
      { class: 'title-actions' },
      h('button', { class: 'btn btn--primary', type: 'button', onclick: () => app.openOsceMenu() }, 'Menu OSCE'),
      h('button', { class: 'btn', type: 'button', onclick: () => app.backToTitle() }, 'Halaman awal'),
    ),
  );
}
