/**
 * Layar konsultasi: kartu pasien, percakapan, dan panel aksi mengikuti alur klinis:
 * Anamnesis → Pemeriksaan fisik → Penunjang → Penalaran (diagnosis banding) → Keputusan.
 */
import { canPerformExam, isBudgetExhausted, unaskedCoreTopics } from '../../core/encounter';
import { DISPOSITION_LABEL } from '../../core/evaluation';
import { reputationTitle, toolPrice } from '../../core/scoring';
import { doctorQuestion } from '../../core/dialogue';
import { formatRupiah, normalizeForSearch } from '../../core/text';
import type { CatalogEntry, DdxStatus, EncounterState, LogEntry, ToolDef } from '../../core/types';
import { DISPOSITIONS } from '../../core/types';
import type { ActionTab, App } from '../app';
import { avatarElement } from '../components/avatar';
import { modal } from '../components/modal';
import { resultCard } from '../components/resultCard';
import { cx, h, replaceChildren } from '../dom';
import { CATALOG_KIND_LABEL, CATEGORY_LABEL, DDX_STATUS_LABEL, ECONOMY_LABEL, OBJECTIVE_LABEL, PHYSICAL_GROUP_LABEL, SEX_LABEL } from '../labels';

export function renderConsult(app: App): HTMLElement {
  const enc = app.encounter!;
  return h(
    'div',
    { class: 'consult' },
    topBar(app),
    patientStrip(app, enc),
    chatLog(app, enc),
    actionPanel(app, enc),
    app.ui.confirmDecision ? confirmDialog(app) : null,
  );
}

// ---------------------------------------------------------------------------

function topBar(app: App): HTMLElement {
  const run = app.run!;
  const { reputation } = app.config;
  const pct = ((run.reputation - reputation.min) / (reputation.max - reputation.min)) * 100;
  const danger = run.reputation < reputation.gameOverBelow + 10;
  return h(
    'header',
    { class: 'topbar' },
    h('span', { class: 'topbar__brand' }, '🩺', h('span', { class: 'topbar__brand-text' }, ' Meja Praktek')),
    h('span', { class: 'topbar__patient' }, `Pasien #${run.patientIndex}`),
    h('span', { class: 'topbar__title' }, reputationTitle(run.reputation, app.config)),
    h(
      'div',
      { class: cx('rep', danger && 'rep--danger'), title: `Game over jika reputasi di bawah ${reputation.gameOverBelow}` },
      h('span', { class: 'rep__label' }, 'Reputasi'),
      h(
        'span',
        { class: 'meter', role: 'meter', 'aria-valuemin': reputation.min, 'aria-valuemax': reputation.max, 'aria-valuenow': run.reputation, 'aria-label': 'Reputasi' },
        h('span', { class: 'meter__fill', style: `width:${pct}%` }),
        h('span', { class: 'meter__mark', style: `left:${((reputation.gameOverBelow - reputation.min) / (reputation.max - reputation.min)) * 100}%` }),
      ),
      h('strong', { class: 'rep__value' }, String(run.reputation)),
    ),
    h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Panduan bermain', title: 'Panduan bermain', onclick: () => app.openDialog('tutorial') }, '?'),
    h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Pengaturan', title: 'Pengaturan', onclick: () => app.openDialog('settings') }, '⚙'),
  );
}

function patientStrip(app: App, enc: EncounterState): HTMLElement {
  const p = enc.case.patient;
  const budgetPct = p.budget > 0 ? (enc.budgetRemaining / p.budget) * 100 : 0;
  return h(
    'section',
    { class: 'patient', 'aria-label': 'Data pasien' },
    h('div', { class: 'patient__avatar' }, avatarElement(p, enc.case.seed, 52)),
    h(
      'div',
      { class: 'patient__info' },
      h('h2', { class: 'patient__name' }, p.name),
      h('p', { class: 'patient__meta' }, `${p.age} th · ${SEX_LABEL[p.sex]} · ${p.occupationLabel}`),
      h(
        'p',
        { class: 'patient__meta' },
        h('span', { class: cx('badge', `badge--${p.economy}`) }, ECONOMY_LABEL[p.economy]),
        h('button', { class: 'btn btn--small btn--ghost', type: 'button', onclick: () => app.openDialog('record') }, '📋 Rekam medis'),
      ),
    ),
    h(
      'div',
      { class: 'patient__stats' },
      h(
        'div',
        { class: 'stat' },
        h('span', { class: 'stat__label' }, 'Budget'),
        h('strong', { class: 'stat__value' }, formatRupiah(enc.budgetRemaining)),
        h('span', { class: 'stat__sub' }, `/ ${formatRupiah(p.budget)}`),
        h('span', { class: 'meter meter--budget', 'aria-hidden': 'true' }, h('span', { class: 'meter__fill', style: `width:${budgetPct}%` })),
      ),
      h(
        'div',
        { class: 'stat' },
        h('span', { class: 'stat__label' }, 'Pertanyaan'),
        h('strong', { class: 'stat__value' }, String(enc.questionCount)),
        h('span', { class: 'stat__sub' }, aiLabel(app)),
      ),
    ),
  );
}

function aiLabel(app: App): string {
  if (!app.settings.aiPatient) return 'mode lokal';
  if (app.ai === 'checking') return 'memeriksa AI…';
  return app.ai === 'ready' ? 'pasien AI' : 'mode lokal';
}

// ---------------------------------------------------------------------------

function chatLog(app: App, enc: EncounterState): HTMLElement {
  const personality = app.content.personalitiesById.get(enc.case.patient.personalityId);
  const entries = enc.log.map((entry, i) => {
    const el = chatEntry(app, enc, entry);
    if (i >= app.newLogFrom) el.classList.add('is-new');
    return el;
  });
  return h(
    'section',
    { class: 'chat', 'data-chat': true, 'data-keep-scroll': 'chat', 'aria-label': 'Percakapan', 'aria-live': 'polite' },
    h(
      'div',
      { class: 'bubble bubble--system' },
      `${enc.case.patient.name} masuk ke ruang praktek.`,
      personality ? ` Kesan umum: ${personality.impression.toLowerCase()}.` : null,
    ),
    entries,
    app.pendingQuestion
      ? [
          h('div', { class: 'bubble bubble--doctor is-new' }, h('span', { class: 'bubble__who' }, 'Anda'), app.pendingQuestion),
          h(
            'div',
            { class: 'bubble bubble--patient bubble--typing', 'aria-label': 'Pasien sedang menjawab' },
            h('span', { class: 'bubble__who' }, enc.case.patient.callName),
            h('span', { class: 'typing' }, h('span'), h('span'), h('span')),
          ),
        ]
      : null,
  );
}

function chatEntry(app: App, enc: EncounterState, entry: LogEntry): HTMLElement {
  switch (entry.kind) {
    case 'doctor':
      return h('div', { class: 'bubble bubble--doctor' }, h('span', { class: 'bubble__who' }, 'Anda'), entry.text);
    case 'patient':
      return h('div', { class: 'bubble bubble--patient' }, h('span', { class: 'bubble__who' }, enc.case.patient.callName), entry.text);
    case 'system':
      return h('div', { class: 'bubble bubble--system' }, entry.text);
    case 'exam': {
      const tool = app.content.toolsById.get(entry.toolId)!;
      return resultCard(tool, enc.case.findings[entry.toolId] ?? [], entry.cost);
    }
  }
}

// ---------------------------------------------------------------------------

const TABS: { id: ActionTab; label: string; step: string }[] = [
  { id: 'anamnesis', label: 'Anamnesis', step: '1' },
  { id: 'fisik', label: 'Fisik', step: '2' },
  { id: 'penunjang', label: 'Penunjang', step: '3' },
  { id: 'penalaran', label: 'Penalaran', step: '4' },
  { id: 'keputusan', label: 'Keputusan', step: '5' },
];

function actionPanel(app: App, enc: EncounterState): HTMLElement {
  const tab = app.ui.actionTab;
  const exhausted = isBudgetExhausted(enc, app.content, app.config);

  let body: HTMLElement;
  switch (tab) {
    case 'anamnesis':
      body = anamnesisTab(app, enc);
      break;
    case 'fisik':
      body = physicalTab(app, enc);
      break;
    case 'penunjang':
      body = investigationTab(app, enc);
      break;
    case 'penalaran':
      body = reasoningTab(app, enc);
      break;
    case 'keputusan':
      body = decisionTab(app, enc);
      break;
  }

  return h(
    'section',
    { class: 'actions', 'aria-label': 'Tindakan' },
    h(
      'nav',
      { class: 'tabs', role: 'tablist' },
      TABS.map((t) =>
        h(
          'button',
          {
            class: cx('tab', t.id === tab && 'is-active', t.id === 'keputusan' && 'tab--dx'),
            role: 'tab',
            type: 'button',
            'aria-selected': t.id === tab ? 'true' : 'false',
            onclick: () => app.setTab(t.id),
          },
          h('span', { class: 'tab__step', 'aria-hidden': 'true' }, t.step),
          t.label,
        ),
      ),
    ),
    exhausted && tab === 'penunjang'
      ? h('div', { class: 'banner banner--warn', role: 'status' }, 'Budget pasien tidak cukup untuk pemeriksaan penunjang lagi. Anamnesis & pemeriksaan fisik tetap bisa.')
      : null,
    app.ui.notice ? h('div', { class: 'banner banner--info', role: 'status' }, app.ui.notice) : null,
    h('div', { class: 'actions__body', 'data-keep-scroll': tab }, body),
  );
}

// --- 1. Anamnesis ------------------------------------------------------------

function anamnesisTab(app: App, enc: EncounterState): HTMLElement {
  const waiting = app.ui.waiting;
  const input = h('textarea', {
    class: 'ask__input',
    rows: 2,
    placeholder: 'Tulis pertanyaan… mis. "Sejak kapan?"',
    'aria-label': 'Pertanyaan untuk pasien',
    'data-ask-input': true,
    'data-focus-key': 'ask',
    disabled: waiting,
    oninput: (e: Event) => app.setDraft((e.target as HTMLTextAreaElement).value),
    onkeydown: (e: Event) => {
      const k = e as KeyboardEvent;
      if (k.key === 'Enter' && !k.shiftKey && !k.isComposing) {
        e.preventDefault();
        void app.ask();
      }
    },
  });
  input.value = app.ui.draft;

  const unasked = new Set(unaskedCoreTopics(enc, app.content));
  const topics = app.content.anamnesis.filter((t) => t.core);
  const rubrics = [...new Set(topics.map((t) => t.rubric))];
  const asked = topics.length - unasked.size;

  return h(
    'div',
    { class: 'tab-panel' },
    h(
      'form',
      {
        class: 'ask',
        onsubmit: (e: Event) => {
          e.preventDefault();
          void app.ask();
        },
      },
      input,
      h('button', { class: 'btn btn--primary ask__send', type: 'submit', disabled: waiting }, waiting ? '…' : 'Tanya'),
    ),
    h(
      'p',
      { class: 'hint' },
      app.aiActive
        ? 'Pasien diperankan Claude: tanyakan dengan bahasa Anda sendiri. Pasien hanya menjawab yang ditanyakan dan ingat jawaban sebelumnya.'
        : 'Ketik pertanyaan bebas (tanpa batas). Pasien menjawab sesuai yang ditanyakan dan konsisten bila ditanya ulang.',
    ),
    h(
      'details',
      { class: 'frame', open: asked < topics.length },
      h('summary', null, `Kerangka anamnesis · ${asked}/${topics.length} topik ditanyakan`),
      h('p', { class: 'hint' }, 'Ketuk topik untuk menanyakan dengan kalimat standar.'),
      rubrics.map((rubric) =>
        h(
          'div',
          { class: 'frame__group' },
          h('span', { class: 'frame__rubric' }, rubric),
          h(
            'div',
            { class: 'chip-row' },
            topics
              .filter((t) => t.rubric === rubric)
              .map((t) =>
                h(
                  'button',
                  {
                    class: cx('chip', !unasked.has(t.id) && 'is-done'),
                    type: 'button',
                    disabled: waiting,
                    title: t.why,
                    onclick: () => void app.ask(doctorQuestion(t.question, enc.case)),
                  },
                  unasked.has(t.id) ? t.label : `✓ ${t.label}`,
                ),
              ),
          ),
        ),
      ),
    ),
  );
}

// --- 2. Pemeriksaan fisik ------------------------------------------------------

function toolButton(app: App, enc: EncounterState, tool: ToolDef, extra?: HTMLElement | null): HTMLElement {
  const check = canPerformExam(enc, tool.id, app.content, app.config);
  const done = enc.examsDone.includes(tool.id);
  const price = toolPrice(tool.id, app.config);
  return h(
    'li',
    null,
    h(
      'button',
      { class: cx('pick', done && 'is-done'), type: 'button', disabled: !check.ok || app.ui.waiting, title: check.reason, onclick: () => app.performExam(tool.id) },
      h('span', { class: 'pick__main' }, done ? `✓ ${tool.name}` : tool.name),
      h('span', { class: 'pick__sub' }, tool.purpose ?? tool.description),
      extra ?? null,
      h('span', { class: cx('pick__price', !done && price > enc.budgetRemaining && 'is-over') }, done ? 'sudah' : price > 0 ? formatRupiah(price) : 'gratis'),
    ),
  );
}

function physicalTab(app: App, enc: EncounterState): HTMLElement {
  const tools = app.content.tools.filter((t) => t.category === 'fisik');
  const groups = [...new Set(tools.map((t) => t.group ?? 'umum'))];
  return h(
    'div',
    { class: 'tab-panel' },
    h('p', { class: 'hint' }, 'Gratis. Mulai dari tanda vital lengkap (TD, nadi, napas, suhu, SpO₂), lalu periksa terarah sesuai keluhan dan kecurigaan komplikasi.'),
    groups.map((g) =>
      h(
        'section',
        { class: 'tool-group' },
        h('h3', { class: 'section-title' }, PHYSICAL_GROUP_LABEL[g] ?? g),
        h('ul', { class: 'pick-list' }, tools.filter((t) => (t.group ?? 'umum') === g).map((t) => toolButton(app, enc, t))),
      ),
    ),
  );
}

// --- 3. Penunjang ------------------------------------------------------------

function investigationTab(app: App, enc: EncounterState): HTMLElement {
  const categories = (['lab', 'pencitraan', 'lainnya'] as const).filter((c) => app.content.tools.some((t) => t.category === c));
  return h(
    'div',
    { class: 'tab-panel' },
    h(
      'p',
      { class: 'hint' },
      `Biaya dipotong dari budget pasien (sisa ${formatRupiah(enc.budgetRemaining)}). Pilih sesuai tujuan: memastikan diagnosis, menilai fungsi organ, struktur, atau komplikasi.`,
    ),
    categories.map((cat) =>
      h(
        'section',
        { class: 'tool-group' },
        h('h3', { class: 'section-title' }, CATEGORY_LABEL[cat]),
        h(
          'ul',
          { class: 'pick-list' },
          app.content.tools
            .filter((t) => t.category === cat)
            .map((t) =>
              toolButton(
                app,
                enc,
                t,
                t.objectives?.length ? h('span', { class: 'pick__tags' }, t.objectives.map((o) => h('span', { class: `tag tag--${o}` }, OBJECTIVE_LABEL[o]))) : null,
              ),
            ),
        ),
      ),
    ),
  );
}

// --- 4. Penalaran (diagnosis banding) ------------------------------------------------

const STATUS_ORDER: DdxStatus[] = ['utama', 'mungkin', 'disingkirkan'];
const DDX_SHORT_LABEL: Record<DdxStatus, string> = { utama: 'Kerja', mungkin: 'Mungkin', disingkirkan: 'Singkirkan' };

function catalogMatches(app: App, query: string, filter?: (e: CatalogEntry) => boolean): CatalogEntry[] {
  const q = normalizeForSearch(query);
  return app.content.catalog
    .filter((e) => !filter || filter(e))
    .filter((e) => !q || normalizeForSearch(`${e.name} ${e.aliases.join(' ')} ${e.system}`).includes(q))
    .sort((a, b) => a.name.localeCompare(b.name, 'id'));
}

function findingsSummary(app: App, enc: EncounterState): HTMLElement {
  const symptoms = enc.revealedSymptoms.map((id) => app.content.symptomsById.get(id)?.label ?? id);
  const denied = enc.askedSymptoms.filter((id) => !enc.revealedSymptoms.includes(id)).map((id) => app.content.symptomsById.get(id)?.label ?? id);
  const abnormal = enc.examsDone.flatMap((t) =>
    (enc.case.findings[t] ?? [])
      .filter((r) => r.flag)
      .map((r) => `${app.content.toolsById.get(t)?.name ?? t} — ${r.label}: ${r.display}${r.unit ? ` ${r.unit}` : ''}`),
  );
  const normalTools = enc.examsDone.filter((t) => !(enc.case.findings[t] ?? []).some((r) => r.flag)).map((t) => app.content.toolsById.get(t)?.name ?? t);
  return h(
    'details',
    { class: 'frame', open: true },
    h('summary', null, 'Data yang sudah terkumpul'),
    h('p', null, h('strong', null, 'Gejala: '), symptoms.join(', ') || '—'),
    denied.length ? h('p', { class: 'muted' }, h('strong', null, 'Disangkal: '), denied.join(', ')) : null,
    abnormal.length ? h('ul', { class: 'plain-list plain-list--compact' }, abnormal.map((a) => h('li', { class: 'abnormal' }, a))) : null,
    normalTools.length ? h('p', { class: 'muted' }, h('strong', null, 'Normal: '), normalTools.join(', ')) : null,
    !abnormal.length && !normalTools.length ? h('p', { class: 'muted' }, 'Belum ada pemeriksaan.') : null,
  );
}

function reasoningTab(app: App, enc: EncounterState): HTMLElement {
  const board = enc.ddx;
  const list = h('ul', { class: 'pick-list' });
  const renderList = () => {
    const onBoard = new Set(board.map((d) => d.id));
    const items = catalogMatches(app, app.ui.catalogQuery, (e) => !onBoard.has(e.id)).map((e) =>
      h(
        'li',
        null,
        h(
          'button',
          { class: 'pick', type: 'button', disabled: app.ui.waiting, onclick: () => app.setDdx(e.id, 'mungkin') },
          h('span', { class: 'pick__main' }, `+ ${e.name}`),
          h('span', { class: 'pick__sub' }, `${e.system} · ${CATALOG_KIND_LABEL[e.kind]}`),
        ),
      ),
    );
    replaceChildren(list, items.length ? items : h('li', { class: 'empty' }, 'Tidak ada kondisi yang cocok.'));
  };
  renderList();

  return h(
    'div',
    { class: 'tab-panel' },
    h(
      'p',
      { class: 'hint' },
      'Susun diagnosis banding — termasuk yang berbahaya — lalu tandai satu sebagai diagnosis kerja dan singkirkan yang lain DENGAN bukti (anamnesis/pemeriksaan pembeda).',
    ),
    findingsSummary(app, enc),
    h('h3', { class: 'section-title' }, `Papan diagnosis banding (${board.length})`),
    board.length
      ? h(
          'ul',
          { class: 'ddx-board' },
          [...board]
            .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))
            .map((d) => {
              const e = app.content.catalogById.get(d.id)!;
              return h(
                'li',
                { class: cx('ddx', `ddx--${d.status}`) },
                h('div', { class: 'ddx__name' }, h('strong', null, e.name), h('span', { class: 'muted' }, ` · ${CATALOG_KIND_LABEL[e.kind]}`)),
                h(
                  'div',
                  { class: 'seg', role: 'group', 'aria-label': `Status ${e.name}` },
                  STATUS_ORDER.map((st) =>
                    h(
                      'button',
                      {
                        class: cx('seg__btn', d.status === st && 'is-active', `seg__btn--${st}`),
                        type: 'button',
                        'aria-pressed': d.status === st ? 'true' : 'false',
                        title: DDX_STATUS_LABEL[st],
                        disabled: app.ui.waiting,
                        onclick: () => app.setDdx(d.id, st),
                      },
                      DDX_SHORT_LABEL[st],
                    ),
                  ),
                  h('button', { class: 'seg__btn seg__btn--remove', type: 'button', 'aria-label': `Hapus ${e.name}`, disabled: app.ui.waiting, onclick: () => app.setDdx(d.id, null) }, '×'),
                ),
              );
            }),
        )
      : h('p', { class: 'empty' }, 'Belum ada. Tambahkan kondisi dari daftar di bawah.'),
    h('h3', { class: 'section-title' }, 'Tambah kondisi'),
    h('input', {
      class: 'search',
      type: 'search',
      placeholder: `Cari dari ${app.content.catalog.length} kondisi… (nama atau istilah awam)`,
      'aria-label': 'Cari kondisi',
      'data-focus-key': 'catalog',
      value: app.ui.catalogQuery,
      oninput: (e: Event) => {
        app.setCatalogQuery((e.target as HTMLInputElement).value);
        renderList();
      },
    }),
    list,
  );
}

// --- 5. Keputusan ------------------------------------------------------------

function decisionTab(app: App, enc: EncounterState): HTMLElement {
  const d = app.ui.decision;
  const primary = d.primary ? app.content.catalogById.get(d.primary) : undefined;
  const disease = d.primary ? app.content.diseasesById.get(d.primary) : undefined;
  const blocker = app.decisionBlocker();

  // Pilihan diagnosis kerja: kondisi di papan dulu, lalu seluruh katalog.
  const boardIds = enc.ddx.filter((x) => x.status !== 'disingkirkan').map((x) => x.id);
  const select = h(
    'select',
    {
      class: 'select',
      'aria-label': 'Diagnosis kerja',
      onchange: (e: Event) => {
        const id = (e.target as HTMLSelectElement).value || null;
        if (id) app.setDdx(id, 'utama');
        else app.patchDecision({ primary: null, complications: [], noComplication: false });
      },
    },
    h('option', { value: '' }, '— pilih diagnosis kerja —'),
    boardIds.length
      ? h('optgroup', { label: 'Dari papan diagnosis banding' }, boardIds.map((id) => h('option', { value: id, selected: id === d.primary }, app.content.catalogById.get(id)!.name)))
      : null,
    h(
      'optgroup',
      { label: 'Semua kondisi' },
      catalogMatches(app, '')
        .filter((e) => !boardIds.includes(e.id))
        .map((e) => h('option', { value: e.id, selected: e.id === d.primary }, e.name)),
    ),
  );

  const secondaryList = h('ul', { class: 'pick-list pick-list--short' });
  const renderSecondary = () => {
    const items = catalogMatches(app, app.ui.secondaryQuery, (e) => e.id !== d.primary && !d.secondary.includes(e.id))
      .sort((a, b) => Number(b.kind === 'komorbiditas' || b.kind === 'insidental') - Number(a.kind === 'komorbiditas' || a.kind === 'insidental'))
      .slice(0, app.ui.secondaryQuery ? 30 : 8)
      .map((e) =>
        h(
          'li',
          null,
          h(
            'button',
            { class: 'pick', type: 'button', onclick: () => app.toggleSecondary(e.id) },
            h('span', { class: 'pick__main' }, `+ ${e.name}`),
            h('span', { class: 'pick__sub' }, CATALOG_KIND_LABEL[e.kind]),
          ),
        ),
      );
    replaceChildren(secondaryList, items.length ? items : h('li', { class: 'empty' }, 'Tidak ada yang cocok.'));
  };
  renderSecondary();

  return h(
    'div',
    { class: 'tab-panel decision' },
    h('p', { class: 'hint' }, 'Keputusan akhir dinilai bersama seluruh proses: anamnesis, pemeriksaan, diagnosis banding, komplikasi, dan disposisi.'),

    h('fieldset', { class: 'decision__block' }, h('legend', null, '1. Diagnosis kerja'), select),

    h(
      'fieldset',
      { class: 'decision__block' },
      h('legend', null, '2. Komplikasi & tanda bahaya'),
      !primary
        ? h('p', { class: 'muted' }, 'Pilih diagnosis kerja dulu.')
        : disease?.complications?.length
          ? h(
              'div',
              { class: 'checks' },
              disease.complications.map((cx_) =>
                h(
                  'label',
                  { class: 'check' },
                  h('input', { type: 'checkbox', checked: d.complications.includes(cx_.id), onchange: () => app.toggleComplication(cx_.id) }),
                  ` ${cx_.name}`,
                  cx_.redFlag ? h('span', { class: 'tag tag--danger' }, 'tanda bahaya') : null,
                ),
              ),
              h(
                'label',
                { class: 'check check--none' },
                h('input', {
                  type: 'checkbox',
                  checked: d.noComplication,
                  onchange: (e: Event) => app.patchDecision({ noComplication: (e.target as HTMLInputElement).checked, complications: [] }),
                }),
                ' Tanpa komplikasi (tidak berkomplikasi)',
              ),
            )
          : h('p', { class: 'muted' }, 'Tidak ada daftar komplikasi untuk kondisi ini.'),
    ),

    h(
      'fieldset',
      { class: 'decision__block' },
      h('legend', null, '3. Masalah lain (komorbiditas / temuan insidental)'),
      d.secondary.length
        ? h(
            'div',
            { class: 'chip-row' },
            d.secondary.map((id) =>
              h('button', { class: 'chip is-active', type: 'button', 'aria-label': `Hapus ${app.content.catalogById.get(id)?.name}`, onclick: () => app.toggleSecondary(id) }, `${app.content.catalogById.get(id)?.name ?? id} ×`),
            ),
          )
        : h('p', { class: 'muted' }, 'Belum ada. Catat masalah lain yang Anda temukan, misalnya tekanan darah tinggi atau temuan USG.'),
      h('input', {
        class: 'search',
        type: 'search',
        placeholder: 'Cari masalah lain…',
        'aria-label': 'Cari masalah lain',
        'data-focus-key': 'secondary',
        value: app.ui.secondaryQuery,
        oninput: (e: Event) => {
          app.setSecondaryQuery((e.target as HTMLInputElement).value);
          renderSecondary();
        },
      }),
      secondaryList,
    ),

    h(
      'fieldset',
      { class: 'decision__block' },
      h('legend', null, '4. Tata laksana / disposisi'),
      h(
        'div',
        { class: 'checks' },
        DISPOSITIONS.map((v) =>
          h(
            'label',
            { class: 'check' },
            h('input', { type: 'radio', name: 'disposisi', value: v, checked: d.disposition === v, onchange: () => app.patchDecision({ disposition: v }) }),
            ` ${DISPOSITION_LABEL[v]}`,
          ),
        ),
      ),
    ),

    h(
      'div',
      { class: 'decision__submit' },
      blocker ? h('p', { class: 'hint' }, blocker) : null,
      h('button', { class: 'btn btn--primary btn--lg', type: 'button', disabled: !!blocker || app.ui.waiting, onclick: () => app.openConfirmDecision() }, 'Selesaikan konsultasi'),
    ),
  );
}

function confirmDialog(app: App): HTMLElement {
  const d = app.ui.decision;
  const name = (id: string) => app.content.catalogById.get(id)?.name ?? id;
  const disease = d.primary ? app.content.diseasesById.get(d.primary) : undefined;
  const cxName = (id: string) => disease?.complications?.find((c) => c.id === id)?.name ?? id;
  return modal({
    title: 'Selesaikan konsultasi?',
    body: h(
      'div',
      null,
      h('dl', { class: 'record-qa' },
        h('dt', null, 'Diagnosis kerja'), h('dd', null, d.primary ? name(d.primary) : '—'),
        h('dt', null, 'Komplikasi'), h('dd', null, d.noComplication ? 'Tanpa komplikasi' : d.complications.map(cxName).join(', ') || '—'),
        h('dt', null, 'Masalah lain'), h('dd', null, d.secondary.map(name).join(', ') || '—'),
        h('dt', null, 'Disposisi'), h('dd', null, d.disposition ? DISPOSITION_LABEL[d.disposition] : '—'),
      ),
      h('p', { class: 'hint' }, 'Setelah ini Anda tidak bisa bertanya atau memeriksa lagi.'),
    ),
    actions: [
      h('button', { class: 'btn', type: 'button', onclick: () => app.cancelDecision() }, 'Batal'),
      h('button', { class: 'btn btn--primary', type: 'button', 'data-autofocus': true, onclick: () => app.submitDecision() }, 'Ya, selesaikan'),
    ],
    onClose: () => app.cancelDecision(),
  });
}
