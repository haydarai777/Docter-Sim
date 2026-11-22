/**
 * Tampilan mode Dokter Jaga IGD: menu, layar jaga (HUD, papan pasien, monitor pasien bertab)
 * dan debrief. Aturan permainan ada di src/core/igd — berkas ini hanya menampilkan & meneruskan aksi.
 */
import { QUICK_QUESTIONS, informants } from '../../core/igd/anamnesis';
import { gcsText, oxygenText, speech } from '../../core/igd/assessment';
import { ATS_LABEL, ATS_TARGET_MIN, DISPOSITIONS, DISPOSITIONS_BY_ID, ED_DIAGNOSES, ED_DIAGNOSES_BY_ID, EXAMS, FLUIDS, FLUIDS_BY_ID, PROCS, type ProcGroup, SPECIALTIES, TESTS, TESTS_BY_ID } from '../../core/igd/catalog';
import { DRUGS, DRUGS_BY_ID, type DrugGroup } from '../../core/igd/drugs';
import { clockText, doctorBusy, freeBeds, minuteOf, nurseOf, scenarioOf, supportOf, tasksOf, visibleVitals, vitalsOf } from '../../core/igd/engine';
import type { EdEvaluation } from '../../core/igd/evaluation';
import { MODE_INFO } from '../../core/igd/shift';
import type { Ats, EdCategory, EdPatient, EdShift, ExamId, ProcId, Route, ShiftMode, TestId, Vitals } from '../../core/igd/types';
import { normalizeForSearch, parseDecimal } from '../../core/text';
import { ED_SCENARIOS } from '../../data/igd';
import type { App } from '../app';
import { disclaimer } from '../components/disclaimer';
import { cx, h } from '../dom';
import { type IgdController, type IgdTab, SPEEDS } from './controller';
import { drawMonitor, monitorStateOf } from './monitorDraw';

export { monitorStateOf };

export const CATEGORY_LABEL: Record<EdCategory, string> = {
  pernapasan: 'Gangguan napas',
  jantung: 'Nyeri dada & aritmia',
  henti_jantung: 'Henti jantung',
  stroke: 'Stroke',
  trauma: 'Trauma',
  perdarahan: 'Perdarahan',
  syok: 'Syok',
  kesadaran: 'Gangguan kesadaran',
  toksikologi: 'Keracunan',
  obstetri: 'Obstetri',
  anak: 'Anak',
  ringan: 'Kasus ringan (latihan triase)',
};

const ROUTE_LABEL: Record<Route, string> = { iv: 'IV', io: 'IO', im: 'IM', sc: 'SK', po: 'Oral', sl: 'Sublingual', neb: 'Nebulisasi', in: 'Intranasal', pr: 'Rektal', infus: 'Infus' };
const STATUS_LABEL: Record<EdPatient['status'], string> = { akan_datang: 'Akan datang', triase: 'Menunggu triase', menunggu_bed: 'Menunggu bed', dirawat: 'Ditangani', pindah: 'Akan dipindahkan', keluar: 'Keluar IGD', meninggal: 'Meninggal' };

const fmtMin = (m: number) => (m < 1 ? '< 1 mnt' : `${Math.floor(m)} mnt`);
const avpu = (v: Vitals) => (v.gcs.total >= 14 ? 'A (sadar)' : v.gcs.total >= 9 ? 'V (respons suara)' : v.gcs.total >= 4 ? 'P (respons nyeri)' : 'U (tidak respons)');

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

export function renderIgdMenu(app: App): HTMLElement {
  const c = app.igd;
  const m = c.ui.menu;
  const saved = c.saved();
  const history = c.history();
  const byCat = new Map<EdCategory, typeof ED_SCENARIOS>();
  for (const s of ED_SCENARIOS) byCat.set(s.category, [...(byCat.get(s.category) ?? []), s]);
  const startOpts = () => (m.mode === 'latihan' ? { scenarioId: m.scenarioId || null } : { categories: m.category ? [m.category] : [] });
  return h(
    'main',
    { class: 'igd-menu' },
    h(
      'div',
      { class: 'title-card igd-menu__card' },
      h('div', { class: 'title-logo', 'aria-hidden': 'true' }, '🚑'),
      h('h1', { class: 'title-name' }, 'Dokter Jaga IGD'),
      h('p', { class: 'title-tagline' }, 'Terima, triase, stabilkan, dan selamatkan pasien gawat darurat.'),
      h(
        'ol',
        { class: 'title-howto' },
        h('li', null, 'Pasien datang bertahap. Baca kartu kedatangan, tentukan kategori triase (ATS 1–5), dan tempatkan di bed yang sesuai.'),
        h('li', null, 'Nilai dengan pendekatan ABCDE, tanyai pasien/keluarga/paramedis, pasang monitor, beri instruksi ke perawat.'),
        h('li', null, 'Waktu terus berjalan: kondisi pasien berubah sesuai penyakit & tindakan Anda. Pemeriksaan butuh waktu — tentukan prioritas.'),
        h('li', null, 'Tetapkan diagnosis kerja, konsultasikan, lalu disposisi. Proses penanganan dinilai lengkap di akhir jaga.'),
      ),
      h(
        'fieldset',
        { class: 'igd-modes' },
        h('legend', { class: 'section-title' }, 'Pilih mode'),
        (['latihan', 'jaga', 'sibuk'] as ShiftMode[]).map((mode) =>
          h(
            'label',
            { class: cx('igd-mode', m.mode === mode && 'is-active') },
            h('input', { type: 'radio', name: 'igd-mode', value: mode, checked: m.mode === mode, onchange: () => c.patch({ menu: { ...m, mode } }) }),
            h('span', { class: 'igd-mode__name' }, MODE_INFO[mode].label),
            h('span', { class: 'igd-mode__desc' }, MODE_INFO[mode].desc),
          ),
        ),
      ),
      m.mode === 'latihan'
        ? h(
            'label',
            { class: 'title-focus' },
            h('span', null, 'Kasus latihan'),
            h(
              'select',
              { class: 'select', 'aria-label': 'Pilih kasus latihan', onchange: (e: Event) => c.patch({ menu: { ...m, scenarioId: (e.target as HTMLSelectElement).value } }) },
              h('option', { value: '', selected: !m.scenarioId }, `Acak dari ${ED_SCENARIOS.length} kasus (diagnosis dirahasiakan)`),
              [...byCat.entries()].map(([cat, list]) =>
                h(
                  'optgroup',
                  { label: CATEGORY_LABEL[cat] },
                  list.map((s) => h('option', { value: s.id, selected: m.scenarioId === s.id }, `${s.title} · ATS ${s.ats} · ${'★'.repeat(s.difficulty)}`)),
                ),
              ),
            ),
          )
        : h(
            'label',
            { class: 'title-focus' },
            h('span', null, 'Kelompok kasus'),
            h(
              'select',
              { class: 'select', 'aria-label': 'Saring kelompok kasus', onchange: (e: Event) => c.patch({ menu: { ...m, category: (e.target as HTMLSelectElement).value as EdCategory | '' } }) },
              h('option', { value: '', selected: !m.category }, 'Campuran semua kegawatan'),
              [...byCat.keys()].map((cat) => h('option', { value: cat, selected: m.category === cat }, `${CATEGORY_LABEL[cat]} (${byCat.get(cat)!.length})`)),
            ),
          ),
      h(
        'div',
        { class: 'title-actions' },
        saved
          ? h('button', { class: 'btn btn--primary btn--lg', type: 'button', onclick: () => app.resumeIgd() }, `Lanjutkan jaga (${clockText(saved.shift)}, ${saved.shift.patients.filter((p) => p.status !== 'akan_datang').length} pasien)`)
          : null,
        h('button', { class: cx('btn btn--lg', !saved && 'btn--primary'), type: 'button', onclick: () => app.startIgd(m.mode, startOpts()) }, m.mode === 'latihan' ? 'Mulai latihan' : 'Mulai jaga'),
        h('button', { class: 'btn', type: 'button', onclick: () => app.backToTitle() }, '← Menu utama'),
      ),
      history.length
        ? h(
            'details',
            { class: 'frame', 'data-keep-open': 'igd-riwayat' },
            h('summary', null, `Riwayat jaga (${history.length})`),
            h('ul', { class: 'plain-list plain-list--compact' }, history.map((x) => h('li', null, `${x.date} · ${MODE_INFO[x.mode].label} · skor rata-rata ${x.average} · ${x.patients} pasien${x.died ? ` · ${x.died} meninggal` : ''}`))),
          )
        : null,
      h('p', { class: 'hint' }, 'Kontrol: ⏸/▶ menjeda jam (tombol spasi), ×1–×8 mengatur laju waktu. Semua skenario mengikuti pedoman (AHA/ERC, ATLS, GINA, WAO, SSC, ADA, AHA/ASA, WHO, POGI) — lihat referensi di debrief.'),
      disclaimer(),
    ),
  );
}

// ---------------------------------------------------------------------------
// Layar jaga
// ---------------------------------------------------------------------------

export function renderIgd(app: App): HTMLElement {
  const c = app.igd;
  const shift = c.shift!;
  const p = c.selected;
  c.live = () => liveUpdate(app);
  ensureMonitorLoop(c);
  return h('div', { class: 'room-ui igd-ui' }, igdHud(app, shift), board(app, shift), p ? patientPanel(app, shift, p) : emptyPanel(shift));
}

function igdHud(app: App, shift: EdShift): HTMLElement {
  const c = app.igd;
  const busy = doctorBusy(shift);
  const freeN = shift.nurses.filter((n) => n.taskId === null).length;
  return h(
    'header',
    { class: 'hud igd-hud' },
    h('span', { class: 'hud__brand' }, '🚑', h('span', { class: 'hud__brand-text' }, ' IGD')),
    h('strong', { class: 'igd-clock', 'data-igd-clock': true, 'aria-label': 'Jam jaga' }, clockText(shift)),
    h(
      'div',
      { class: 'igd-speed', role: 'group', 'aria-label': 'Laju waktu' },
      h('button', { class: cx('igd-speed__btn', c.ui.paused && 'is-active'), type: 'button', 'aria-pressed': c.ui.paused ? 'true' : 'false', title: 'Jeda / lanjut (spasi)', 'aria-label': c.ui.paused ? 'Lanjutkan waktu' : 'Jeda', onclick: () => c.togglePause() }, c.ui.paused ? '▶' : '❚❚'),
      SPEEDS.map((sp, i) => h('button', { class: cx('igd-speed__btn', !c.ui.paused && c.ui.speed === i && 'is-active'), type: 'button', title: `1 detik nyata = ${sp} detik jaga`, onclick: () => c.setSpeed(i) }, `×${sp}`)),
      h('button', { class: 'igd-speed__btn', type: 'button', title: 'Lewati 1 menit', onclick: () => c.skip(60) }, '+1′'),
    ),
    h('span', { class: cx('igd-staff', busy.busy && 'is-busy'), 'data-igd-doctor': true }, busy.busy ? `Dokter: ${busy.label ?? 'sibuk'} (${Math.ceil(busy.left)} dtk)` : 'Dokter: siap'),
    h('span', { class: 'igd-staff' }, `Perawat bebas ${freeN}/${shift.nurses.length}`),
    h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Pengaturan', title: 'Pengaturan', onclick: () => app.openDialog('settings') }, '⚙'),
    h('button', { class: 'btn btn--small', type: 'button', onclick: () => app.confirmEndIgd() }, 'Akhiri jaga'),
  );
}

function miniVitals(p: EdPatient, now: number): string {
  const vis = visibleVitals(p, now);
  if (!vis) return 'TTV belum diukur';
  const v = vis.vitals;
  if (!v.pulse) return '⚠ TANPA NADI';
  return `N ${v.hr} · TD ${v.sbp ?? '—'}/${v.dbp ?? '—'} · SpO₂ ${v.spo2 ?? '—'}${vis.live ? '' : ' (manual)'}`;
}

function alarmOf(p: EdPatient, now: number): boolean {
  const vis = visibleVitals(p, now);
  if (p.physio.arrest && (vis?.live || p.status !== 'akan_datang')) return true;
  if (!vis?.live) return false;
  const v = vis.vitals;
  return (v.spo2 ?? 0) < 90 || v.hr > 140 || v.hr < 45 || (v.sbp ?? 0) < 90 || v.rr > 32 || v.rr < 8;
}

function board(app: App, shift: EdShift): HTMLElement {
  const c = app.igd;
  const now = shift.time;
  const visible = shift.patients.filter((p) => p.status !== 'akan_datang');
  const order = (p: EdPatient) => (p.status === 'keluar' || p.status === 'meninggal' ? 9 : p.ats === null ? 0 : p.ats);
  const list = [...visible].sort((a, b) => order(a) - order(b) || a.arriveAt - b.arriveAt);
  const upcoming = shift.patients.filter((p) => p.status === 'akan_datang').length;
  const logs = shift.log.slice(-7).reverse();
  return h(
    'aside',
    { class: 'igd-board', 'aria-label': 'Papan pasien IGD' },
    h('h2', { class: 'igd-board__title' }, 'Papan IGD', h('span', { class: 'igd-board__count' }, `${visible.filter((p) => p.status !== 'keluar' && p.status !== 'meninggal').length} aktif${upcoming ? ` · ${upcoming} akan datang` : ''}`)),
    h(
      'ul',
      { class: 'igd-cards' },
      list.map((p) => {
        const sc = scenarioOf(c.ctx, p);
        const done = p.status === 'keluar' || p.status === 'meninggal';
        const wait = minuteOf(p, now);
        const late = !done && p.ats !== null && p.firstSeenAt === null && wait > ATS_TARGET_MIN[p.ats];
        return h(
          'li',
          null,
          h(
            'button',
            {
              class: cx('igd-card', `ats-${p.ats ?? 0}`, c.ui.selected === p.id && 'is-selected', done && 'is-done', alarmOf(p, now) && 'is-alarm', late && 'is-late'),
              type: 'button',
              'data-igd-card': p.id,
              onclick: () => c.select(p.id),
            },
            h('span', { class: 'igd-card__ats' }, p.ats === null ? 'Triase?' : `ATS ${p.ats}`),
            h('span', { class: 'igd-card__name' }, `${p.name}`, h('small', null, ` ${p.age < 1 ? 'bayi' : `${p.age} th`} ${p.sex === 'male' ? 'L' : 'P'}`)),
            h('span', { class: 'igd-card__bed' }, p.bedId ?? (done ? '' : 'Pintu')),
            h('span', { class: 'igd-card__cc' }, sc.arrival.complaint),
            h('span', { class: 'igd-card__meta' }, h('span', { 'data-igd-wait': p.id }, done ? STATUS_LABEL[p.status] : `${STATUS_LABEL[p.status]} · ${fmtMin(wait)}`), h('span', { class: 'igd-card__vitals', 'data-igd-mini': p.id }, done ? (p.outcome === 'stabil' ? '✓ stabil' : p.outcome === 'meninggal' ? '✝' : '⚠ belum stabil') : miniVitals(p, now))),
          ),
        );
      }),
      visible.length ? null : h('li', { class: 'empty' }, 'Menunggu pasien datang…'),
    ),
    h(
      'details',
      { class: 'igd-log', open: true, 'data-keep-open': 'igd-log' },
      h('summary', null, 'Kejadian terbaru'),
      h('ul', null, logs.map((l) => h('li', { class: `log--${l.kind}` }, h('time', null, clockText(shift, l.t)), ' ', l.text))),
    ),
  );
}

function emptyPanel(shift: EdShift): HTMLElement {
  return h(
    'aside',
    { class: 'monitor igd-monitor', 'aria-label': 'Monitor pasien' },
    h('div', { class: 'monitor__bar' }, h('span', { class: 'monitor__led', 'aria-hidden': 'true' }), h('span', { class: 'monitor__name' }, 'RME IGD')),
    h('div', { class: 'monitor__body' }, h('p', { class: 'empty' }, shift.patients.some((p) => p.status !== 'akan_datang') ? document.documentElement.classList.contains('no-3d') ? 'Pilih pasien di papan IGD.' : 'Pilih pasien di papan IGD — atau ketuk bed/pasiennya di ruangan. Seret ruangan untuk melihat sekeliling.' : 'Belum ada pasien. Jam berjalan — pasien akan datang.')),
  );
}

const TABS: { id: IgdTab; label: string }[] = [
  { id: 'triase', label: 'Triase' },
  { id: 'periksa', label: 'ABCDE' },
  { id: 'anamnesis', label: 'Anamnesis' },
  { id: 'penunjang', label: 'Penunjang' },
  { id: 'tindakan', label: 'Tindakan' },
  { id: 'obat', label: 'Obat & cairan' },
  { id: 'tim', label: 'Dx & disposisi' },
  { id: 'catatan', label: 'Catatan' },
];

function patientPanel(app: App, shift: EdShift, p: EdPatient): HTMLElement {
  const c = app.igd;
  const tab = c.ui.tab;
  let body: HTMLElement;
  switch (tab) {
    case 'triase':
      body = triageTab(app, shift, p);
      break;
    case 'periksa':
      body = examTab(app, shift, p);
      break;
    case 'anamnesis':
      body = historyTab(app, shift, p);
      break;
    case 'penunjang':
      body = testsTab(app, shift, p);
      break;
    case 'tindakan':
      body = procTab(app, shift, p);
      break;
    case 'obat':
      body = drugTab(app, shift, p);
      break;
    case 'tim':
      body = teamTab(app, shift, p);
      break;
    case 'catatan':
      body = notesTab(app, shift, p);
      break;
  }
  const done = p.status === 'keluar' || p.status === 'meninggal';
  return h(
    'aside',
    { class: cx('monitor igd-monitor', c.ui.monitorSmall && 'monitor--small'), 'aria-label': `Monitor pasien ${p.name}` },
    h(
      'div',
      { class: 'monitor__bar' },
      h('span', { class: 'monitor__led', 'aria-hidden': 'true' }),
      h('span', { class: 'monitor__name' }, `RME IGD · ${p.bedId ? shift.beds.find((b) => b.id === p.bedId)?.label : 'Area triase'}`),
      h('button', { class: 'monitor__toggle', type: 'button', onclick: () => c.patch({ monitorSmall: !c.ui.monitorSmall }) }, c.ui.monitorSmall ? '▴ Buka' : '▾ Kecilkan'),
    ),
    patientHeader(app, shift, p),
    vitalsStrip(app, shift, p),
    p.physio.arrest && !done ? arrestBar(app, p) : null,
    h(
      'nav',
      { class: 'tabs igd-tabs', role: 'tablist' },
      TABS.map((t) => h('button', { class: cx('tab', tab === t.id && 'is-active'), type: 'button', role: 'tab', 'aria-selected': tab === t.id ? 'true' : 'false', onclick: () => c.setTab(t.id) }, t.label)),
    ),
    c.ui.notice ? h('div', { class: cx('banner', c.ui.noticeOk ? 'banner--info' : 'banner--warn'), role: 'status' }, c.ui.notice) : null,
    h('div', { class: 'monitor__body', 'data-keep-scroll': `igd-${tab}` }, done ? h('div', { class: 'banner banner--info' }, `${p.address} sudah ${p.status === 'meninggal' ? 'meninggal' : 'meninggalkan IGD'}. Catatan tetap dapat dilihat.`) : null, body),
  );
}

function patientHeader(app: App, shift: EdShift, p: EdPatient): HTMLElement {
  const sc = scenarioOf(app.igd.ctx, p);
  return h(
    'div',
    { class: 'patient igd-patient' },
    h(
      'div',
      { class: 'patient__row' },
      h('strong', { class: 'patient__name' }, p.name),
      h('span', { class: cx('igd-ats-badge', `ats-${p.ats ?? 0}`) }, p.ats ? ATS_LABEL[p.ats].name.split(' — ')[0] : 'Belum triase'),
    ),
    h(
      'p',
      { class: 'patient__meta' },
      `${p.age < 1 ? 'Bayi' : `${p.age} th`} · ${p.sex === 'male' ? 'laki-laki' : 'perempuan'} · ± ${p.weightKg} kg · tiba ${clockText(shift, p.arriveAt)} (${fmtMin(minuteOf(p, shift.time))} lalu)${p.comorbid.length && p.askedTopics.includes('riwayat_penyakit') ? ` · ${p.comorbid.map((x) => x.text).join(', ')}` : ''}`,
    ),
    h('p', { class: 'igd-patient__cc' }, sc.arrival.complaint),
  );
}

function vitalsStrip(app: App, shift: EdShift, p: EdPatient): HTMLElement {
  const vis = visibleVitals(p, shift.time);
  const devices: string[] = [];
  const d = p.devices;
  if (d.ivCount) devices.push(`IV ×${d.ivCount}`);
  if (d.io) devices.push('IO');
  if (d.oxygen !== 'udara' || d.assist !== 'none') devices.push(oxygenText(supportOf(p, shift.time)));
  if (d.adjunct !== 'none') devices.push(d.adjunct === 'ett' ? 'ETT' : d.adjunct.toUpperCase());
  if (d.cpr) devices.push('RJP berjalan');
  if (d.pacing) devices.push(`Pacu ${d.pacing}`);
  if (d.collar) devices.push('Collar');
  if (d.binder) devices.push('Pelvic binder');
  if (d.tourniquet) devices.push('Torniket');
  for (const inf of p.infusions.filter((i) => i.stoppedAt === null)) devices.push(inf.label);
  return h(
    'div',
    { class: 'igd-vitals' },
    vis?.live ? h('canvas', { class: 'igd-vitals__canvas', 'data-igd-monitor': p.id, width: 720, height: 230, 'aria-label': 'Monitor tanda vital', role: 'img' }) : null,
    vis?.live
      ? null
      : h(
          'div',
          { class: 'igd-vitals__manual' },
          vis ? h('span', null, `TTV manual ${clockText(shift, vis.t)}: ${vitalText(vis.vitals)}`) : h('span', null, 'Tanda vital belum diketahui.'),
          p.status === 'dirawat' || p.status === 'pindah'
            ? h('button', { class: 'btn btn--small', type: 'button', onclick: () => app.igd.do({ type: 'tindakan', proc: 'monitor' }) }, 'Pasang monitor')
            : null,
        ),
    devices.length ? h('p', { class: 'igd-devices' }, devices.join(' · ')) : null,
  );
}

function vitalText(v: Vitals): string {
  return `TD ${v.sbp ?? '—'}/${v.dbp ?? '—'} · N ${v.pulse ? v.hr : 'tidak teraba'} · RR ${v.rr} · SpO₂ ${v.spo2 ?? '—'}% · S ${v.temp.toFixed(1)}°C · GCS ${gcsText(v)}`;
}

function arrestBar(app: App, p: EdPatient): HTMLElement {
  const c = app.igd;
  const a = p.physio.arrest!;
  const d = p.devices;
  const btn = (label: string, action: Parameters<IgdController['do']>[0], primary = false) => h('button', { class: cx('btn btn--small', primary && 'btn--primary'), type: 'button', onclick: () => c.do(action) }, label);
  return h(
    'div',
    { class: 'igd-arrest', role: 'alert' },
    h('strong', null, `⚠ HENTI JANTUNG${d.monitor || d.pads ? ` — ${a.rhythm.toUpperCase()}` : ''} · ${fmtMin((app.igd.shift!.time - a.since) / 60)}`),
    h(
      'div',
      { class: 'igd-arrest__btns' },
      d.cpr ? btn('Cek irama/nadi', { type: 'tindakan', proc: 'hentikan_rjp' }) : btn('Mulai RJP', { type: 'tindakan', proc: 'rjp' }, true),
      d.pads ? null : btn('Pasang pad', { type: 'tindakan', proc: 'pad_defib' }, true),
      d.pads ? btn('Kejut 200 J', { type: 'tindakan', proc: 'defibrilasi', param: '200' }, true) : null,
      d.assist === 'none' ? btn('BVM', { type: 'tindakan', proc: 'bvm' }) : null,
      d.ivCount || d.io ? btn('Adrenalin 1 mg IV', { type: 'obat', drug: 'adrenalin', route: d.ivCount ? 'iv' : 'io', dose: 1 }) : btn('Akses IO', { type: 'tindakan', proc: 'io' }),
      d.ivCount || d.io ? btn('Amiodaron 300 mg', { type: 'obat', drug: 'amiodaron', route: d.ivCount ? 'iv' : 'io', dose: 300 }) : null,
      btn('Nyatakan meninggal', { type: 'tindakan', proc: 'nyatakan_meninggal' }),
    ),
  );
}

// --- Tab: Triase -----------------------------------------------------------------

function impression(p: EdPatient, v: Vitals, shift: EdShift): string[] {
  const out: string[] = [];
  const ph = p.physio;
  if (ph.arrest) return ['Tidak berespons, tidak bernapas normal'];
  if (ph.seizure) out.push('Kejang seluruh tubuh');
  if (v.gcs.total <= 8) out.push('Tidak sadar');
  else if (v.gcs.total <= 13) out.push('Kesadaran menurun / bingung');
  const sp = speech(ph, v, supportOf(p, shift.time), shift.time);
  if (sp === 'kata') out.push('Sesak berat, hanya bisa 1–2 kata');
  else if (sp === 'frasa') out.push('Sesak, bicara terputus-putus');
  if ((v.spo2 ?? 100) < 85) out.push('Bibir kebiruan');
  if (v.perfusion < 0.7) out.push('Pucat, berkeringat dingin');
  if (ph.v.pain > 0.6) out.push('Tampak kesakitan');
  if (ph.v.anxiety > 0.7) out.push('Gelisah/panik');
  if (ph.v.reaction > 0.3) out.push('Bentol merah di seluruh tubuh, bibir bengkak');
  return out.length ? out : ['Tampak sakit ringan, sadar, bicara lancar'];
}

function triageTab(app: App, shift: EdShift, p: EdPatient): HTMLElement {
  const c = app.igd;
  const sc = scenarioOf(c.ctx, p);
  const v = p.arrivalVitals;
  const how = { jalan: 'Berjalan sendiri', dipapah: 'Dipapah keluarga', kursi_roda: 'Kursi roda', brankar: 'Brankar', digendong: 'Digendong' }[p.arrivalMode];
  const by = { sendiri: 'datang sendiri', keluarga: 'diantar keluarga', ambulans: 'ambulans', warga: 'diantar warga', polisi: 'diantar polisi' }[sc.arrival.by];
  const beds = freeBeds(shift);
  const suggestBed = (ats: Ats) => {
    const want = ats === 1 ? ['resusitasi', 'akut'] : ats === 2 ? ['resusitasi', 'akut'] : ats === 3 ? ['akut', 'kursi'] : ['kursi', 'akut'];
    for (const k of want) {
      const b = beds.find((x) => x.kind === k);
      if (b) return b.id;
    }
    return beds[0]?.id ?? '';
  };
  const bedSel = c.ui.triageBed && beds.some((b) => b.id === c.ui.triageBed) ? c.ui.triageBed : '';
  return h(
    'div',
    { class: 'tab-panel' },
    h(
      'section',
      { class: 'igd-arrival' },
      h('h3', { class: 'section-title' }, 'Kartu kedatangan'),
      h('dl', { class: 'igd-dl' },
        h('dt', null, 'Cara datang'), h('dd', null, `${how}, ${by}`),
        h('dt', null, 'Keluhan'), h('dd', null, sc.arrival.complaint),
        sc.arrival.mechanism ? [h('dt', null, 'Mekanisme'), h('dd', null, sc.arrival.mechanism)] : null,
        sc.arrival.prehospital ? [h('dt', null, 'Pra-RS'), h('dd', null, sc.arrival.prehospital)] : null,
        h('dt', null, 'Kesan umum'), h('dd', null, impression(p, vitalsOf(p, shift.time), shift).join('; ')),
        h('dt', null, 'TTV triase'), h('dd', null, `${vitalText(v)} · AVPU ${avpu(v)}`),
      ),
    ),
    p.ats === null
      ? h(
          'section',
          null,
          h('h3', { class: 'section-title' }, 'Kategori triase (ATS)'),
          h(
            'label',
            { class: 'igd-field' },
            h('span', null, 'Tempatkan di'),
            h(
              'select',
              { class: 'select', 'aria-label': 'Bed tujuan', onchange: (e: Event) => c.patch({ triageBed: (e.target as HTMLSelectElement).value }, false) },
              h('option', { value: '', selected: !bedSel }, 'Otomatis sesuai kategori'),
              beds.map((b) => h('option', { value: b.id, selected: bedSel === b.id }, b.label)),
              h('option', { value: '-' }, 'Ruang tunggu (belum ada bed)'),
            ),
          ),
          h(
            'div',
            { class: 'igd-ats-list' },
            ([1, 2, 3, 4, 5] as Ats[]).map((ats) =>
              h(
                'button',
                {
                  class: cx('igd-ats-btn', `ats-${ats}`),
                  type: 'button',
                  onclick: () => {
                    const choice = c.ui.triageBed === '-' ? null : c.ui.triageBed || suggestBed(ats) || null;
                    c.do({ type: 'triase', ats, bedId: choice });
                  },
                },
                h('strong', null, ATS_LABEL[ats].name),
                h('span', null, ATS_LABEL[ats].desc),
              ),
            ),
          ),
        )
      : h(
          'section',
          null,
          h('p', null, h('span', { class: cx('igd-ats-badge', `ats-${p.ats}`) }, ATS_LABEL[p.ats].name), ` · triase pukul ${clockText(shift, p.triagedAt ?? p.arriveAt)}`),
          h(
            'label',
            { class: 'igd-field' },
            h('span', null, p.bedId ? 'Pindah bed' : 'Tempatkan di bed'),
            h(
              'select',
              { class: 'select', 'aria-label': 'Pindah bed', onchange: (e: Event) => c.do({ type: 'pindah', bedId: (e.target as HTMLSelectElement).value }) },
              h('option', { value: '', selected: true, disabled: true }, p.bedId ? `Sekarang: ${shift.beds.find((b) => b.id === p.bedId)?.label}` : 'Pilih bed kosong'),
              beds.map((b) => h('option', { value: b.id }, b.label)),
            ),
          ),
        ),
  );
}

// --- Tab: Pemeriksaan ---------------------------------------------------------------

function examTab(app: App, shift: EdShift, p: EdPatient): HTMLElement {
  const c = app.igd;
  const btn = (id: ExamId, label: string) => {
    const done = p.exams[id];
    return h('button', { class: cx('igd-exam-btn', done && 'is-done'), type: 'button', title: EXAMS.find((e) => e.id === id)?.hint, onclick: () => c.do({ type: 'periksa', exam: id }) }, done ? `✓ ${label}` : label);
  };
  const findings = EXAMS.filter((e) => p.exams[e.id]).sort((a, b) => p.exams[b.id]!.t - p.exams[a.id]!.t);
  return h(
    'div',
    { class: 'tab-panel' },
    h('h3', { class: 'section-title' }, 'Survei primer'),
    h('div', { class: 'igd-abcde' }, EXAMS.filter((e) => e.survey === 'primer').map((e) => btn(e.id, e.short))),
    h('h3', { class: 'section-title' }, 'Survei sekunder'),
    h('div', { class: 'igd-secondary' }, EXAMS.filter((e) => e.survey === 'sekunder').map((e) => btn(e.id, e.short))),
    !(p.devices.monitor || p.devices.pads) && p.bedId ? h('button', { class: 'btn btn--small', type: 'button', onclick: () => c.do({ type: 'tindakan', proc: 'ttv' }) }, 'Minta perawat mengukur TTV') : null,
    h('h3', { class: 'section-title' }, 'Hasil pemeriksaan'),
    findings.length
      ? h('ul', { class: 'igd-findings' }, findings.map((e) => h('li', null, h('strong', null, `${e.short} `), h('time', null, clockText(shift, p.exams[e.id]!.t)), h('p', null, p.exams[e.id]!.text))))
      : h('p', { class: 'empty' }, 'Belum ada pemeriksaan. Mulai dari A (airway).'),
  );
}

// --- Tab: Anamnesis -------------------------------------------------------------------

function historyTab(app: App, shift: EdShift, p: EdPatient): HTMLElement {
  const c = app.igd;
  const sc = scenarioOf(c.ctx, p);
  const list = informants(p, sc, vitalsOf(p, shift.time), supportOf(p, shift.time), shift.time);
  const who = list.find((i) => i.id === c.ui.who && i.available) ? c.ui.who : (list.find((i) => i.available)?.id ?? c.ui.who);
  const whoName = (w: string) => (w === 'dokter' ? 'Anda' : w === 'sistem' ? 'Konsulen' : (list.find((i) => i.id === w)?.label ?? w));
  const send = () => {
    const text = c.ui.draft.trim();
    if (!text) return;
    c.ui.draft = '';
    c.do({ type: 'tanya', who, text });
  };
  return h(
    'div',
    { class: 'tab-panel' },
    h(
      'div',
      { class: 'igd-informants', role: 'group', 'aria-label': 'Narasumber' },
      list.map((i) => h('button', { class: cx('chip', who === i.id && 'is-active'), type: 'button', disabled: !i.available, title: i.reason ?? '', onclick: () => c.patch({ who: i.id }) }, `${i.label}${i.available ? '' : ` (${i.reason})`}`)),
    ),
    h('div', { class: 'igd-quick' }, QUICK_QUESTIONS.map((q) => h('button', { class: 'btn btn--small', type: 'button', disabled: !list.some((i) => i.id === who && i.available), onclick: () => c.do({ type: 'tanya', who, text: q.question, topic: q.topic }) }, q.label))),
    h(
      'form',
      { class: 'ask', onsubmit: (e: Event) => { e.preventDefault(); send(); } },
      h('input', { class: 'search ask__input', type: 'text', placeholder: 'Tanya bebas, mis. "Sejak kapan sesaknya?"', 'aria-label': 'Pertanyaan', 'data-focus-key': 'igd-ask', value: c.ui.draft, oninput: (e: Event) => c.patch({ draft: (e.target as HTMLInputElement).value }, false) }),
      h('button', { class: 'btn btn--primary ask__send', type: 'submit' }, 'Tanya'),
    ),
    h(
      'div',
      { class: 'chat igd-chat', 'aria-live': 'polite' },
      p.chat.length
        ? p.chat.map((m) => h('div', { class: cx('bubble', m.who === 'dokter' ? 'bubble--doctor' : m.who === 'sistem' ? 'bubble--system' : 'bubble--patient') }, h('span', { class: 'bubble__who' }, `${whoName(m.who)} · ${clockText(shift, m.t)}`), m.text))
        : h('p', { class: 'empty' }, 'Belum ada percakapan.'),
    ),
  );
}

// --- Tab: Penunjang -------------------------------------------------------------------

function testsTab(app: App, shift: EdShift, p: EdPatient): HTMLElement {
  const c = app.igd;
  const groups = [...new Set(TESTS.map((t) => t.group))];
  const status = (id: TestId) => [...p.tests].reverse().find((o) => o.id === id);
  const orders = [...p.tests].reverse();
  return h(
    'div',
    { class: 'tab-panel' },
    h('h3', { class: 'section-title' }, 'Hasil'),
    orders.length
      ? h(
          'ul',
          { class: 'igd-results' },
          orders.map((o, i) =>
            h(
              'li',
              { class: cx(o.status === 'selesai' && o.abnormal && 'is-abnormal') },
              h('strong', null, TESTS_BY_ID.get(o.id)?.label ?? o.id),
              h(
                'span',
                { class: 'igd-results__status', 'data-igd-eta': `${p.id}:${p.tests.length - 1 - i}` },
                o.status === 'selesai' ? `hasil ${clockText(shift, o.readyAt ?? o.orderedAt)}` : o.status === 'menunggu' ? 'menunggu sampel/perawat' : `diproses — ± ${Math.max(1, Math.ceil(((o.readyAt ?? shift.time) - shift.time) / 60))} mnt`,
              ),
              o.status === 'selesai' ? h('p', null, o.result) : null,
            ),
          ),
        )
      : h('p', { class: 'empty' }, 'Belum ada pemeriksaan penunjang. Pilih sesuai indikasi — setiap pemeriksaan butuh waktu.'),
    groups.map((g) =>
      h(
        'section',
        { class: 'tool-group' },
        h('h3', { class: 'section-title' }, g),
        h(
          'div',
          { class: 'igd-test-grid' },
          TESTS.filter((t) => t.group === g).map((t) => {
            const st = status(t.id);
            const busy = st && st.status !== 'selesai';
            return h(
              'button',
              { class: cx('igd-test', st?.status === 'selesai' && 'is-done'), type: 'button', disabled: !!busy, onclick: () => c.do({ type: 'penunjang', test: t.id }) },
              h('span', null, t.label),
              h('small', null, t.awayMin ? `pasien ke radiologi ± ${t.awayMin} mnt · hasil ± ${t.turnaround} mnt` : t.turnaround <= 1 ? 'segera' : `± ${t.turnaround} mnt`),
            );
          }),
        ),
      ),
    ),
  );
}

// --- Tab: Tindakan --------------------------------------------------------------------

const PROC_GROUPS: ProcGroup[] = ['Airway', 'Breathing', 'Circulation', 'Henti jantung', 'Perdarahan & trauma', 'Umum'];

function procTab(app: App, shift: EdShift, p: EdPatient): HTMLElement {
  const c = app.igd;
  const running = tasksOf(shift, p.id);
  const hidden = new Set<ProcId>(['ambil_darah', 'hentikan_rjp']);
  return h(
    'div',
    { class: 'tab-panel' },
    running.length
      ? h(
          'section',
          null,
          h('h3', { class: 'section-title' }, 'Sedang dikerjakan'),
          h(
            'ul',
            { class: 'igd-tasks' },
            running.map((t) => {
              const who = t.performer === 'dokter' ? 'Anda' : (nurseOf(shift, t) ?? 'antre — semua perawat sibuk');
              const pct = t.continuous || t.startedAt === null ? null : Math.min(100, Math.max(0, ((shift.time - t.startedAt) / t.duration) * 100));
              return h(
                'li',
                null,
                h('span', null, t.label, h('small', null, ` · ${who}`)),
                pct === null ? null : h('span', { class: 'igd-progress' }, h('span', { class: 'igd-progress__bar', 'data-igd-task': t.id, style: `width:${pct}%` })),
                t.continuous ? h('button', { class: 'btn btn--small', type: 'button', onclick: () => c.do({ type: 'hentikan_tugas', taskId: t.id }) }, 'Hentikan') : null,
              );
            }),
          ),
        )
      : null,
    PROC_GROUPS.map((g) =>
      h(
        'section',
        { class: 'tool-group' },
        h('h3', { class: 'section-title' }, g),
        h(
          'ul',
          { class: 'igd-procs' },
          PROCS.filter((x) => x.group === g && !hidden.has(x.id)).map((x) => {
            const param = c.ui.params[x.id] ?? x.params?.options[0]?.id;
            return h(
              'li',
              null,
              h('div', { class: 'igd-proc__text' }, h('strong', null, x.label), h('small', null, `${x.performer === 'dokter' ? 'Dokter' : 'Perawat'} · ± ${x.seconds >= 60 ? `${Math.round(x.seconds / 60)} mnt` : `${x.seconds} dtk`}${x.continuous ? ' · berkelanjutan' : ''} — ${x.hint}`)),
              x.params
                ? h(
                    'select',
                    { class: 'select select--small', 'aria-label': x.params.label, onchange: (e: Event) => c.patch({ params: { ...c.ui.params, [x.id]: (e.target as HTMLSelectElement).value } }, false) },
                    x.params.options.map((o) => h('option', { value: o.id, selected: o.id === param }, o.label)),
                  )
                : null,
              h('button', { class: 'btn btn--small', type: 'button', onclick: () => c.do({ type: 'tindakan', proc: x.id, ...(x.params ? { param: c.ui.params[x.id] ?? x.params.options[0]!.id } : {}) }) }, x.performer === 'dokter' ? 'Lakukan' : 'Instruksikan'),
            );
          }),
        ),
      ),
    ),
  );
}

// --- Tab: Obat & cairan ----------------------------------------------------------------

const DRUG_GROUPS: DrugGroup[] = ['Resusitasi & vasoaktif', 'Antiaritmia', 'Pernapasan & alergi', 'Antikonvulsan & sedatif', 'Analgesik', 'Kardiovaskular', 'Metabolik & elektrolit', 'Antimikroba', 'Antidot', 'Perdarahan & obstetri', 'Lain-lain'];

function drugTab(app: App, shift: EdShift, p: EdPatient): HTMLElement {
  const c = app.igd;
  const d = c.ui.drug;
  const hints = shift.config.hints;
  const q = normalizeForSearch(d.query);
  const drug = d.id ? DRUGS_BY_ID.get(d.id) : undefined;
  const route = drug && d.route && drug.routes.includes(d.route) ? d.route : drug?.routes[0] ?? null;
  const running = p.infusions.filter((i) => i.stoppedAt === null);
  const fluid = FLUIDS_BY_ID.get(c.ui.fluid.id)!;
  return h(
    'div',
    { class: 'tab-panel' },
    running.length
      ? h(
          'section',
          null,
          h('h3', { class: 'section-title' }, 'Infus berjalan'),
          h(
            'ul',
            { class: 'igd-tasks' },
            running.map((i) =>
              h(
                'li',
                null,
                h('span', null, i.label, i.kind === 'cairan' ? h('small', null, ` · ${Math.round(i.givenMl)}/${i.volumeMl} ml`) : null),
                h('button', { class: 'btn btn--small', type: 'button', onclick: () => c.do({ type: 'hentikan_infus', infusionId: i.id }) }, 'Hentikan'),
              ),
            ),
          ),
        )
      : null,
    h('h3', { class: 'section-title' }, 'Obat'),
    h(
      'div',
      { class: 'igd-drug-pick' },
      h('input', { class: 'search', type: 'search', placeholder: `Cari obat (${DRUGS.length})…`, 'aria-label': 'Cari obat', 'data-focus-key': 'igd-drug-q', value: d.query, oninput: (e: Event) => c.patch({ drug: { ...d, query: (e.target as HTMLInputElement).value } }) }),
      h(
        'select',
        { class: 'select', 'aria-label': 'Pilih obat', size: 1, onchange: (e: Event) => c.patch({ drug: { ...d, id: (e.target as HTMLSelectElement).value || null, route: null, dose: '', rate: '' } }) },
        h('option', { value: '', selected: !d.id }, '— pilih obat —'),
        DRUG_GROUPS.map((g) => {
          const items = DRUGS.filter((x) => x.group === g && (!q || normalizeForSearch(`${x.name} ${x.sediaan} ${x.group}`).includes(q)));
          return items.length ? h('optgroup', { label: g }, items.map((x) => h('option', { value: x.id, selected: d.id === x.id }, x.name))) : null;
        }),
      ),
    ),
    drug
      ? h(
          'div',
          { class: 'igd-drug-form' },
          h('p', { class: 'hint' }, `Sediaan: ${drug.sediaan}${hints ? ` · ${drug.hint}` : ''}`),
          drug.routes.length
            ? h(
                'form',
                {
                  class: 'igd-inline',
                  onsubmit: (e: Event) => {
                    e.preventDefault();
                    // Isian bukan angka → NaN → mesin menolak dengan pesan (bukan dibaca angka lain).
                    const dose = parseDecimal(String(c.ui.drug.dose)) ?? NaN;
                    if (route) c.do({ type: 'obat', drug: drug.id, route, dose });
                  },
                },
                h('select', { class: 'select select--small', 'aria-label': 'Rute', onchange: (e: Event) => c.patch({ drug: { ...d, route: (e.target as HTMLSelectElement).value as Route } }, false) }, drug.routes.map((r) => h('option', { value: r, selected: r === route }, ROUTE_LABEL[r]))),
                h('input', { class: 'search igd-num', type: 'text', inputmode: 'decimal', placeholder: 'dosis', 'aria-label': `Dosis (${drug.unit})`, 'data-focus-key': 'igd-dose', value: d.dose, oninput: (e: Event) => c.patch({ drug: { ...c.ui.drug, dose: (e.target as HTMLInputElement).value } }, false) }),
                h('span', { class: 'igd-unit' }, drug.unit),
                h('button', { class: 'btn btn--primary btn--small', type: 'submit' }, 'Instruksikan'),
              )
            : null,
          drug.infusion
            ? h(
                'form',
                {
                  class: 'igd-inline',
                  onsubmit: (e: Event) => {
                    e.preventDefault();
                    c.do({ type: 'infus_obat', drug: drug.id, rate: parseDecimal(String(c.ui.drug.rate)) ?? NaN });
                  },
                },
                h('span', null, 'Infus kontinu'),
                h('input', { class: 'search igd-num', type: 'text', inputmode: 'decimal', placeholder: 'laju', title: 'Isi 0 untuk menghentikan infus', 'aria-label': `Laju (${drug.infusion.unit}; 0 = hentikan)`, 'data-focus-key': 'igd-rate', value: d.rate, oninput: (e: Event) => c.patch({ drug: { ...c.ui.drug, rate: (e.target as HTMLInputElement).value } }, false) }),
                h('span', { class: 'igd-unit' }, drug.infusion.unit),
                h('button', { class: 'btn btn--small', type: 'submit' }, running.some((i) => i.ref === drug.id) ? 'Ubah laju' : 'Mulai infus'),
                hints ? h('small', { class: 'hint' }, drug.infusion.hint) : null,
              )
            : null,
        )
      : h('p', { class: 'hint' }, hints ? 'Mode latihan: sediaan & dosis lazim ditampilkan setelah memilih obat.' : 'Pilih obat, rute, dan tuliskan dosisnya — dosis dinilai terhadap berat badan pasien.'),
    h('h3', { class: 'section-title' }, 'Cairan & darah'),
    h(
      'form',
      {
        class: 'igd-inline igd-fluid',
        onsubmit: (e: Event) => {
          e.preventDefault();
          c.do({ type: 'cairan', fluid: c.ui.fluid.id, volumeMl: parseDecimal(String(c.ui.fluid.volume)) ?? NaN, overMin: parseDecimal(String(c.ui.fluid.over)) ?? NaN });
        },
      },
      h('select', { class: 'select select--small', 'aria-label': 'Jenis cairan', onchange: (e: Event) => c.patch({ fluid: { ...c.ui.fluid, id: (e.target as HTMLSelectElement).value as typeof c.ui.fluid.id } }) }, FLUIDS.map((f) => h('option', { value: f.id, selected: f.id === fluid.id }, f.label))),
      h('input', { class: 'search igd-num', type: 'text', inputmode: 'numeric', 'aria-label': 'Volume (ml)', 'data-focus-key': 'igd-vol', value: c.ui.fluid.volume, oninput: (e: Event) => c.patch({ fluid: { ...c.ui.fluid, volume: (e.target as HTMLInputElement).value } }, false) }),
      h('span', { class: 'igd-unit' }, 'ml dalam'),
      h('input', { class: 'search igd-num', type: 'text', inputmode: 'numeric', 'aria-label': 'Lama (menit)', 'data-focus-key': 'igd-over', value: c.ui.fluid.over, oninput: (e: Event) => c.patch({ fluid: { ...c.ui.fluid, over: (e.target as HTMLInputElement).value } }, false) }),
      h('span', { class: 'igd-unit' }, 'menit'),
      h('button', { class: 'btn btn--small', type: 'submit' }, 'Pasang'),
    ),
    h('p', { class: 'hint' }, `Berat badan ± ${p.weightKg} kg → 10 ml/kg = ${Math.round(p.weightKg * 10)} ml; 20 ml/kg = ${Math.round(p.weightKg * 20)} ml.`),
  );
}

// --- Tab: Diagnosis, tim & disposisi ------------------------------------------------------

function teamTab(app: App, shift: EdShift, p: EdPatient): HTMLElement {
  const c = app.igd;
  const q = normalizeForSearch(c.ui.dxQuery);
  const dx = p.diagnosis;
  const matches = ED_DIAGNOSES.filter((d) => !q || normalizeForSearch(`${d.name} ${d.group} ${(d.aliases ?? []).join(' ')}`).includes(q)).slice(0, q ? 30 : 0);
  const setPrimary = (id: string) => c.do({ type: 'diagnosis', primary: id, secondary: dx.secondary.filter((x) => x !== id) });
  const toggleSecondary = (id: string) => c.do({ type: 'diagnosis', primary: dx.primary, secondary: dx.secondary.includes(id) ? dx.secondary.filter((x) => x !== id) : [...dx.secondary, id] });
  const confirm = c.ui.confirmDispo;
  return h(
    'div',
    { class: 'tab-panel' },
    h('h3', { class: 'section-title' }, 'Diagnosis kerja'),
    h('p', null, dx.primary ? h('strong', null, ED_DIAGNOSES_BY_ID.get(dx.primary)?.name) : h('span', { class: 'empty' }, 'Belum ditetapkan'), dx.secondary.length ? ` + ${dx.secondary.map((d) => ED_DIAGNOSES_BY_ID.get(d)?.name).join(', ')}` : ''),
    h('input', { class: 'search', type: 'search', placeholder: `Cari diagnosis (${ED_DIAGNOSES.length})…`, 'aria-label': 'Cari diagnosis', 'data-focus-key': 'igd-dx', value: c.ui.dxQuery, oninput: (e: Event) => c.patch({ dxQuery: (e.target as HTMLInputElement).value }) }),
    matches.length
      ? h(
          'ul',
          { class: 'pick-list igd-dx-list' },
          matches.map((d) =>
            h(
              'li',
              null,
              h('span', { class: 'igd-dx-name' }, d.name, h('small', null, ` · ${d.group}`)),
              h('button', { class: 'btn btn--small', type: 'button', onclick: () => setPrimary(d.id) }, dx.primary === d.id ? '✓ utama' : 'Utama'),
              h('button', { class: 'btn btn--small btn--ghost', type: 'button', disabled: dx.primary === d.id, onclick: () => toggleSecondary(d.id) }, dx.secondary.includes(d.id) ? '✓ penyerta' : '+ penyerta'),
            ),
          ),
        )
      : q
        ? h('p', { class: 'empty' }, 'Tidak ada diagnosis yang cocok.')
        : null,
    h('h3', { class: 'section-title' }, 'Konsultasi'),
    h(
      'div',
      { class: 'igd-consults' },
      SPECIALTIES.map((s) => {
        const cons = [...p.consults].reverse().find((x) => x.specialty === s.id);
        return h('button', { class: cx('chip', cons?.answered && (cons.accepted ? 'is-ok' : 'is-muted')), type: 'button', disabled: !!cons && !cons.answered, onclick: () => c.do({ type: 'konsul', specialty: s.id }) }, `${s.label.split(' (')[0]}${cons ? (cons.answered ? (cons.accepted ? ' ✓' : ' ✕') : ' …') : ''}`);
      }),
    ),
    p.consults.filter((x) => x.answered).map((x) => h('p', { class: cx('igd-advice', x.accepted && 'is-ok') }, h('strong', null, `${SPECIALTIES.find((s) => s.id === x.specialty)?.label}: `), x.advice)),
    h('h3', { class: 'section-title' }, 'Tim jaga'),
    h('ul', { class: 'plain-list plain-list--compact' }, shift.nurses.map((n) => {
      const t = shift.tasks.find((x) => x.id === n.taskId);
      const pt = t ? shift.patients.find((x) => x.id === t.patientId) : null;
      return h('li', null, `${n.name}: ${t ? `${t.label} (${pt?.address})` : 'bebas'}`);
    })),
    h('h3', { class: 'section-title' }, 'Disposisi'),
    p.disposition
      ? h('p', null, `${DISPOSITIONS_BY_ID.get(p.disposition.to)?.label} — berangkat ${clockText(shift, p.disposition.leaveAt)}.`)
      : confirm
        ? h(
            'div',
            { class: 'banner banner--warn igd-confirm' },
            h('p', null, `Tetapkan disposisi: ${DISPOSITIONS_BY_ID.get(confirm)?.label}? Pasien tetap tanggung jawab Anda sampai dijemput.`),
            h('button', { class: 'btn btn--primary btn--small', type: 'button', onclick: () => { c.ui.confirmDispo = null; c.do({ type: 'disposisi', to: confirm }); } }, 'Ya, tetapkan'),
            h('button', { class: 'btn btn--small', type: 'button', onclick: () => c.patch({ confirmDispo: null }) }, 'Batal'),
          )
        : h(
            'div',
            { class: 'igd-dispo' },
            DISPOSITIONS.filter((d) => d.id !== 'meninggal' || p.physio.dead).map((d) => h('button', { class: 'btn btn--small', type: 'button', onclick: () => c.patch({ confirmDispo: d.id }) }, d.label + (d.needsConsult ? ' *' : ''))),
            h('p', { class: 'hint' }, '* butuh persetujuan konsulen.'),
          ),
  );
}

// --- Tab: Catatan ------------------------------------------------------------------------

function notesTab(_app: App, shift: EdShift, p: EdPatient): HTMLElement {
  const items = [
    ...p.notes.map((n) => ({ t: n.t, text: n.text, kind: n.kind as string })),
    ...p.actions.filter((a) => a.type !== 'ask').map((a) => ({ t: a.t, text: `▸ ${a.label}`, kind: 'aksi' })),
  ].sort((a, b) => b.t - a.t);
  return h(
    'div',
    { class: 'tab-panel' },
    h('h3', { class: 'section-title' }, 'Catatan & instruksi'),
    items.length ? h('ul', { class: 'igd-notes' }, items.map((x) => h('li', { class: `log--${x.kind}` }, h('time', null, clockText(shift, x.t)), ' ', x.text))) : h('p', { class: 'empty' }, 'Belum ada catatan.'),
  );
}

// ---------------------------------------------------------------------------
// Pembaruan langsung & monitor
// ---------------------------------------------------------------------------

function liveUpdate(app: App): void {
  const c = app.igd;
  const shift = c.shift;
  if (!shift) return;
  const now = shift.time;
  document.querySelectorAll<HTMLElement>('[data-igd-clock]').forEach((el) => (el.textContent = clockText(shift)));
  for (const p of shift.patients) {
    const card = document.querySelector<HTMLElement>(`[data-igd-card="${p.id}"]`);
    if (!card) continue;
    const done = p.status === 'keluar' || p.status === 'meninggal';
    if (done) continue;
    const wait = document.querySelector<HTMLElement>(`[data-igd-wait="${p.id}"]`);
    if (wait) wait.textContent = `${STATUS_LABEL[p.status]} · ${fmtMin(minuteOf(p, now))}`;
    const mini = document.querySelector<HTMLElement>(`[data-igd-mini="${p.id}"]`);
    if (mini) mini.textContent = miniVitals(p, now);
    card.classList.toggle('is-alarm', alarmOf(p, now));
    card.classList.toggle('is-late', p.ats !== null && p.firstSeenAt === null && minuteOf(p, now) > ATS_TARGET_MIN[p.ats]);
  }
  const busy = doctorBusy(shift);
  document.querySelectorAll<HTMLElement>('[data-igd-doctor]').forEach((el) => {
    el.textContent = busy.busy ? `Dokter: ${busy.label ?? 'sibuk'} (${Math.ceil(busy.left)} dtk)` : 'Dokter: siap';
    el.classList.toggle('is-busy', busy.busy);
  });
  for (const t of shift.tasks) {
    const bar = document.querySelector<HTMLElement>(`[data-igd-task="${t.id}"]`);
    if (bar && t.startedAt !== null) bar.style.width = `${Math.min(100, Math.max(0, ((now - t.startedAt) / t.duration) * 100))}%`;
  }
  const p = c.selected;
  if (p) {
    p.tests.forEach((o, i) => {
      const el = document.querySelector<HTMLElement>(`[data-igd-eta="${p.id}:${i}"]`);
      if (el && o.status === 'diproses') el.textContent = `diproses — ± ${Math.max(1, Math.ceil(((o.readyAt ?? now) - now) / 60))} mnt`;
    });
  }
}

let monitorLoop = 0;
let loopController: IgdController | null = null;

function ensureMonitorLoop(c: IgdController): void {
  loopController = c;
  if (monitorLoop) return;
  const frame = (ms: number) => {
    const canvas = document.querySelector<HTMLCanvasElement>('[data-igd-monitor]');
    const ctrl = loopController;
    if (!canvas || !ctrl?.shift) {
      monitorLoop = 0;
      return;
    }
    const p = ctrl.shift.patients.find((x) => x.id === canvas.dataset.igdMonitor);
    const g = canvas.getContext('2d');
    if (g && p) drawMonitor(g, canvas.width, canvas.height, monitorStateOf(p, ctrl.shift.time), ms / 1000);
    monitorLoop = requestAnimationFrame(frame);
  };
  monitorLoop = requestAnimationFrame(frame);
}

// ---------------------------------------------------------------------------
// Debrief
// ---------------------------------------------------------------------------

export function renderIgdDebrief(app: App): HTMLElement {
  const c = app.igd;
  const sum = c.summary!;
  return h(
    'main',
    { class: 'igd-debrief' },
    h(
      'section',
      { class: 'igd-sheet igd-summary' },
      h('h1', null, 'Hasil jaga IGD'),
      h('p', { class: 'igd-summary__score' }, h('strong', null, String(sum.average)), ` / 100 · ${sum.grade}`),
      h(
        'ul',
        { class: 'igd-summary__stats' },
        h('li', null, h('strong', null, String(sum.patients)), ' pasien'),
        h('li', null, h('strong', null, String(sum.stable)), ' stabil'),
        h('li', null, h('strong', null, String(sum.died)), ' meninggal'),
        h('li', null, h('strong', null, sum.meanResponse === null ? '—' : `${sum.meanResponse} mnt`), ' rerata respons dokter'),
        h('li', null, h('strong', null, String(sum.harms)), ' tindakan berisiko'),
      ),
      h(
        'div',
        { class: 'title-actions' },
        h('button', { class: 'btn btn--primary', type: 'button', onclick: () => app.openIgdMenu() }, 'Jaga lagi'),
        h('button', { class: 'btn', type: 'button', onclick: () => app.backToTitle() }, 'Menu utama'),
      ),
    ),
    sum.evaluations.map((e) => evaluationCard(app, e)),
  );
}

function evaluationCard(app: App, e: EdEvaluation): HTMLElement {
  const c = app.igd;
  const open = c.ui.debriefOpen === e.patientId || app.igd.summary!.evaluations.length === 1;
  const statusLabel = { tepat_waktu: '✓ tepat waktu', terlambat: '◷ terlambat', tidak_dilakukan: '✕ tidak dilakukan' } as const;
  return h(
    'section',
    { class: 'igd-sheet igd-eval' },
    h(
      'button',
      { class: 'igd-eval__head', type: 'button', 'aria-expanded': open ? 'true' : 'false', onclick: () => c.patch({ debriefOpen: open ? null : e.patientId }) },
      h('span', { class: 'igd-eval__score' }, String(e.total)),
      h('span', { class: 'igd-eval__title' }, h('strong', null, e.title), h('small', null, `${e.patientLabel}${e.variantLabel ? ` · ${e.variantLabel}` : ''} · ${e.outcome === 'stabil' ? 'stabil' : e.outcome === 'meninggal' ? 'meninggal' : 'belum stabil'} · ${e.grade}`)),
      h('span', { 'aria-hidden': 'true' }, open ? '▴' : '▾'),
    ),
    open
      ? h(
          'div',
          { class: 'igd-eval__body' },
          h('div', { class: 'igd-parts' }, e.parts.map((p) => h('div', { class: 'igd-part' }, h('span', null, p.label), h('span', { class: 'igd-part__bar' }, h('span', { style: `width:${(p.score / p.max) * 100}%` })), h('strong', null, `${Math.round(p.score)}/${p.max}`)))),
          e.penalty ? h('p', { class: 'banner banner--warn' }, `Penalti keselamatan −${e.penalty}`) : null,
          timelineChart(e),
          h('h3', { class: 'section-title' }, 'Tindakan kritis'),
          h('ul', { class: 'igd-critical' }, e.critical.map((x) => h('li', { class: `is-${x.status}` }, h('strong', null, statusLabel[x.status]), ` ${x.label}`, h('small', null, `${x.atMin !== null ? ` — menit ke-${x.atMin}` : ''} (target ≤ ${x.byMin} mnt). ${x.why}`)))),
          e.harms.length ? [h('h3', { class: 'section-title' }, 'Kesalahan & tindakan berisiko'), h('ul', { class: 'igd-harms' }, e.harms.map((x) => h('li', null, h('strong', null, `${x.label} `), h('small', null, `(menit ke-${x.atMin}, ${x.severity}: ${x.action}) — ${x.why}`))))] : null,
          e.good.length ? [h('h3', { class: 'section-title' }, 'Yang sudah tepat'), h('ul', { class: 'plain-list plain-list--compact' }, e.good.map((x) => h('li', null, `✓ ${x}`)))] : null,
          [h('h3', { class: 'section-title' }, 'Catatan penilaian'), h('ul', { class: 'plain-list plain-list--compact' }, e.parts.flatMap((p) => p.notes.map((n) => h('li', null, n))))],
          e.missed.length ? [h('h3', { class: 'section-title' }, 'Informasi penting yang terlewat'), h('ul', { class: 'plain-list plain-list--compact' }, e.missed.map((x) => h('li', null, x)))] : null,
          h('h3', { class: 'section-title' }, 'Kunci jawaban'),
          h('p', null, `Triase ATS ${e.answers.triageKey} (Anda: ${e.answers.triage ?? '—'}) · Diagnosis: ${e.answers.diagnosisKey.map((d) => ED_DIAGNOSES_BY_ID.get(d)?.name ?? d).join(' / ')} (Anda: ${e.answers.diagnosis ? ED_DIAGNOSES_BY_ID.get(e.answers.diagnosis)?.name : '—'}) · Disposisi: ${e.answers.dispositionKey.map((d) => DISPOSITIONS_BY_ID.get(d)?.label).join(' / ')}`),
          h('h3', { class: 'section-title' }, 'Ringkasan kasus'),
          h('p', null, e.debrief.ringkasan),
          h('h3', { class: 'section-title' }, 'Tatalaksana yang seharusnya'),
          h('ol', { class: 'igd-steps' }, e.debrief.tatalaksana.map((x) => h('li', null, x))),
          e.debrief.jebakan?.length ? [h('h3', { class: 'section-title' }, 'Jebakan umum'), h('ul', { class: 'plain-list plain-list--compact' }, e.debrief.jebakan.map((x) => h('li', null, x)))] : null,
          h('details', { class: 'frame' }, h('summary', null, `Linimasa tindakan (${e.actions.length})`), h('ul', { class: 'igd-notes' }, e.actions.map((a) => h('li', { class: cx(a.harm && 'log--buruk') }, h('time', null, `${a.atMin}′`), ` ${a.label}${a.dose && a.dose !== 'tepat' ? ` (dosis ${a.dose})` : ''}`)))),
          h('h3', { class: 'section-title' }, 'Referensi pedoman'),
          h('ul', { class: 'plain-list plain-list--compact igd-refs' }, e.debrief.referensi.map((r) => h('li', null, r))),
        )
      : null,
  );
}

/** Grafik perjalanan tanda vital + penanda tindakan (SVG). */
function timelineChart(e: EdEvaluation): HTMLElement {
  const W = 640;
  const H = 210;
  const pad = { l: 34, r: 10, t: 12, b: 24 };
  const pts = e.timeline;
  const wrap = h('figure', { class: 'igd-chart' });
  if (pts.length < 2) {
    wrap.append(h('p', { class: 'empty' }, 'Data tanda vital tidak cukup.'));
    return wrap;
  }
  const t0 = pts[0]!.t;
  const t1 = pts.at(-1)!.t;
  const x = (t: number) => pad.l + ((t - t0) / Math.max(60, t1 - t0)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - Math.min(200, Math.max(0, v)) / 200) * (H - pad.t - pad.b);
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Perjalanan tanda vital selama di IGD');
  const el = (tag: string, attrs: Record<string, string | number>) => {
    const n = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
    svg.append(n);
    return n;
  };
  for (const g of [0, 50, 100, 150, 200]) {
    el('line', { x1: pad.l, x2: W - pad.r, y1: y(g), y2: y(g), class: 'igd-chart__grid' });
    el('text', { x: 4, y: y(g) + 4, class: 'igd-chart__axis' }).textContent = String(g);
  }
  const series: { key: 'hr' | 'sbp' | 'spo2' | 'rr'; label: string; cls: string }[] = [
    { key: 'hr', label: 'Nadi', cls: 'is-hr' },
    { key: 'sbp', label: 'TDS', cls: 'is-sbp' },
    { key: 'spo2', label: 'SpO₂', cls: 'is-spo2' },
    { key: 'rr', label: 'Napas', cls: 'is-rr' },
  ];
  for (const s of series) {
    let d = '';
    let pen = false;
    for (const pt of pts) {
      const v = pt[s.key];
      if (v === null || v === undefined) {
        pen = false;
        continue;
      }
      d += `${pen ? 'L' : 'M'}${x(pt.t).toFixed(1)},${y(v).toFixed(1)}`;
      pen = true;
    }
    el('path', { d, class: `igd-chart__line ${s.cls}` });
  }
  for (const a of e.actions.filter((a) => a.harm || /RJP|Kejut|Defibrilasi|Adrenalin|Intubasi|Dekompresi|Torniket|Disposisi/i.test(a.label))) {
    const xx = pad.l + ((a.atMin * 60) / Math.max(60, t1 - t0)) * (W - pad.l - pad.r);
    el('line', { x1: xx, x2: xx, y1: pad.t, y2: H - pad.b, class: cx('igd-chart__mark', a.harm && 'is-harm') ?? '' });
    el('title', {}).textContent = `${a.atMin}′ ${a.label}`;
  }
  el('text', { x: pad.l, y: H - 6, class: 'igd-chart__axis' }).textContent = '0′';
  el('text', { x: W - pad.r - 30, y: H - 6, class: 'igd-chart__axis' }).textContent = `${Math.round((t1 - t0) / 60)}′`;
  wrap.append(svg, h('figcaption', { class: 'igd-chart__legend' }, series.map((s) => h('span', { class: `igd-chart__key ${s.cls}` }, s.label)), h('span', { class: 'igd-chart__key is-mark' }, 'tindakan penting')));
  return wrap;
}
