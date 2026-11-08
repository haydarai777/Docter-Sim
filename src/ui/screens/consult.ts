/**
 * Layar konsultasi: kartu pasien, percakapan, dan panel aksi
 * (anamnesis, pemeriksaan per kategori, diagnosis).
 */
import { canAskCategory, canAskSymptom, canPerformExam, isBudgetExhausted, questionsLeft } from '../../core/encounter';
import { toolPrice } from '../../core/scoring';
import { formatRupiah, normalizeForSearch } from '../../core/text';
import type { EncounterState, LogEntry } from '../../core/types';
import type { ActionTab, App } from '../app';
import { resultCard } from '../components/resultCard';
import { cx, h, replaceChildren } from '../dom';
import { avatarEmoji, CATEGORY_LABEL, ECONOMY_LABEL, SEX_LABEL } from '../labels';

export function renderConsult(app: App): HTMLElement {
  const enc = app.encounter!;
  return h(
    'div',
    { class: 'consult' },
    topBar(app),
    patientStrip(app, enc),
    chatLog(app, enc),
    actionPanel(app, enc),
    app.ui.confirmDx ? confirmDialog(app, app.ui.confirmDx) : null,
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
    h('span', { class: 'topbar__brand' }, '🩺 Meja Praktek'),
    h('span', { class: 'topbar__patient' }, `Pasien #${run.patientIndex}`),
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
  );
}

function patientStrip(app: App, enc: EncounterState): HTMLElement {
  const p = enc.case.patient;
  const budgetPct = p.budget > 0 ? (enc.budgetRemaining / p.budget) * 100 : 0;
  const qLeft = questionsLeft(enc, app.config);
  return h(
    'section',
    { class: 'patient', 'aria-label': 'Data pasien' },
    h('div', { class: 'patient__avatar', 'aria-hidden': 'true' }, avatarEmoji(p.sex, p.age)),
    h(
      'div',
      { class: 'patient__info' },
      h('h2', { class: 'patient__name' }, p.name),
      h('p', { class: 'patient__meta' }, `${p.age} th · ${SEX_LABEL[p.sex]} · ${p.occupationLabel}`),
      h('p', { class: 'patient__meta' }, h('span', { class: cx('badge', `badge--${p.economy}`) }, ECONOMY_LABEL[p.economy])),
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
        h('span', { class: 'stat__label' }, 'Anamnesis'),
        h('strong', { class: 'stat__value' }, `${qLeft}/${app.config.anamnesis.maxQuestions}`),
        h('span', { class: 'stat__sub' }, 'sisa'),
      ),
    ),
  );
}

// ---------------------------------------------------------------------------

function chatLog(app: App, enc: EncounterState): HTMLElement {
  const personality = app.content.personalitiesById.get(enc.case.patient.personalityId);
  return h(
    'section',
    { class: 'chat', 'data-chat': true, 'aria-label': 'Percakapan', 'aria-live': 'polite' },
    h(
      'div',
      { class: 'bubble bubble--system' },
      `${enc.case.patient.name} masuk ke ruang praktek.`,
      personality ? ` Kesan umum: ${personality.impression.toLowerCase()}.` : null,
    ),
    enc.log.map((entry) => chatEntry(app, enc, entry)),
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

const TABS: { id: ActionTab; label: string }[] = [
  { id: 'anamnesis', label: 'Anamnesis' },
  { id: 'fisik', label: 'Fisik' },
  { id: 'lab', label: 'Lab' },
  { id: 'penunjang', label: 'Penunjang' },
  { id: 'diagnosis', label: 'Diagnosis' },
];

function actionPanel(app: App, enc: EncounterState): HTMLElement {
  const tab = app.ui.actionTab;
  const exhausted = isBudgetExhausted(enc, app.content, app.config);
  const noQuestions = questionsLeft(enc, app.config) === 0;

  let body: HTMLElement;
  if (tab === 'anamnesis') body = anamnesisTab(app, enc);
  else if (tab === 'diagnosis') body = diagnosisTab(app);
  else body = toolsTab(app, enc, tab);

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
            class: cx('tab', t.id === tab && 'is-active', t.id === 'diagnosis' && 'tab--dx'),
            role: 'tab',
            type: 'button',
            'aria-selected': t.id === tab ? 'true' : 'false',
            onclick: () => app.setTab(t.id),
          },
          t.label,
        ),
      ),
    ),
    exhausted && tab !== 'diagnosis'
      ? h(
          'div',
          { class: 'banner banner--warn', role: 'status' },
          noQuestions
            ? 'Budget dan jatah anamnesis habis. Tetapkan diagnosis dengan informasi yang ada.'
            : 'Budget pasien habis untuk pemeriksaan. Anamnesis masih bisa, lalu tetapkan diagnosis.',
          h('button', { class: 'btn btn--small', type: 'button', onclick: () => app.setTab('diagnosis') }, 'Ke diagnosis'),
        )
      : null,
    app.ui.notice ? h('div', { class: 'banner banner--info', role: 'status' }, app.ui.notice) : null,
    h('div', { class: 'actions__body', 'data-keep-scroll': tab }, body),
  );
}

function anamnesisTab(app: App, enc: EncounterState): HTMLElement {
  const categories = app.content.anamnesis.map((cat) => {
    const check = canAskCategory(enc, cat.id, app.config);
    const asked = enc.askedCategories.includes(cat.id);
    return h(
      'button',
      {
        class: cx('chip', asked && 'is-done'),
        type: 'button',
        disabled: !check.ok,
        title: check.ok ? cat.question.replace('{sapaan}', enc.case.patient.address) : check.reason,
        onclick: () => app.askCategory(cat.id),
      },
      asked ? `✓ ${cat.label}` : cat.label,
    );
  });

  const list = h('ul', { class: 'pick-list' });
  const renderList = () => {
    const q = normalizeForSearch(app.ui.symptomQuery);
    const items = app.content.symptoms
      .filter((s) => !q || normalizeForSearch(`${s.label} ${s.question} ${s.system}`).includes(q))
      .map((s) => {
        const check = canAskSymptom(enc, s.id, app.config);
        const status = enc.revealedSymptoms.includes(s.id)
          ? '✓ ada'
          : enc.askedSymptoms.includes(s.id)
            ? '— disangkal'
            : '';
        return h(
          'li',
          null,
          h(
            'button',
            { class: 'pick', type: 'button', disabled: !check.ok, title: check.reason, onclick: () => app.askSymptom(s.id) },
            h('span', { class: 'pick__main' }, s.question),
            h('span', { class: 'pick__sub' }, status ? `${s.system} · ${status}` : s.system),
          ),
        );
      });
    replaceChildren(list, items.length ? items : h('li', { class: 'empty' }, 'Tidak ada gejala yang cocok.'));
  };
  renderList();

  return h(
    'div',
    { class: 'tab-panel' },
    h('p', { class: 'hint' }, `Gratis, tetapi hanya ${app.config.anamnesis.maxQuestions} pertanyaan per pasien. Pilih yang paling berguna.`),
    h('div', { class: 'chip-grid' }, categories),
    h('h3', { class: 'section-title' }, 'Tanya gejala spesifik'),
    h('input', {
      class: 'search',
      type: 'search',
      placeholder: 'Cari gejala… (mis. mimisan, menggigil)',
      'aria-label': 'Cari gejala',
      value: app.ui.symptomQuery,
      oninput: (e: Event) => {
        app.setSymptomQuery((e.target as HTMLInputElement).value);
        renderList();
      },
    }),
    list,
  );
}

function toolsTab(app: App, enc: EncounterState, category: Exclude<ActionTab, 'anamnesis' | 'diagnosis'>): HTMLElement {
  const tools = app.content.tools.filter((t) => t.category === category);
  if (tools.length === 0) {
    return h('div', { class: 'tab-panel' }, h('p', { class: 'empty' }, 'Belum ada alat di kategori ini.'));
  }
  return h(
    'div',
    { class: 'tab-panel' },
    h('p', { class: 'hint' }, `${CATEGORY_LABEL[category]} — biaya dipotong dari budget pasien. Sisa: ${formatRupiah(enc.budgetRemaining)}.`),
    h(
      'ul',
      { class: 'pick-list' },
      tools.map((tool) => {
        const check = canPerformExam(enc, tool.id, app.content, app.config);
        const done = enc.examsDone.includes(tool.id);
        const price = toolPrice(tool.id, app.config);
        return h(
          'li',
          null,
          h(
            'button',
            { class: cx('pick', done && 'is-done'), type: 'button', disabled: !check.ok, title: check.reason, onclick: () => app.performExam(tool.id) },
            h('span', { class: 'pick__main' }, done ? `✓ ${tool.name}` : tool.name),
            h('span', { class: 'pick__sub' }, tool.description),
            h('span', { class: cx('pick__price', !done && price > enc.budgetRemaining && 'is-over') }, done ? 'sudah' : formatRupiah(price)),
          ),
        );
      }),
    ),
  );
}

function diagnosisTab(app: App): HTMLElement {
  const systems = [...new Set(app.content.diseases.map((d) => d.system))];
  const list = h('ul', { class: 'pick-list' });
  const renderList = () => {
    const q = normalizeForSearch(app.ui.dxQuery);
    const items = app.content.diseases
      .filter((d) => !app.ui.dxSystem || d.system === app.ui.dxSystem)
      .filter((d) => !q || normalizeForSearch(`${d.name} ${d.aliases.join(' ')}`).includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, 'id'))
      .map((d) =>
        h(
          'li',
          null,
          h(
            'button',
            { class: 'pick', type: 'button', onclick: () => app.openDiagnosis(d.id) },
            h('span', { class: 'pick__main' }, d.name),
            h('span', { class: 'pick__sub' }, `${d.system} · ${d.aliases.slice(0, 3).join(', ')}`),
          ),
        ),
      );
    replaceChildren(list, items.length ? items : h('li', { class: 'empty' }, 'Tidak ada penyakit yang cocok.'));
  };
  renderList();

  return h(
    'div',
    { class: 'tab-panel' },
    h('p', { class: 'hint' }, 'Pilih diagnosis akhir. Konsultasi akan selesai dan hasilnya langsung dinilai.'),
    h('input', {
      class: 'search',
      type: 'search',
      placeholder: 'Cari penyakit… (nama atau istilah awam)',
      'aria-label': 'Cari penyakit',
      value: app.ui.dxQuery,
      oninput: (e: Event) => {
        app.setDxQuery((e.target as HTMLInputElement).value);
        renderList();
      },
    }),
    systems.length > 1
      ? h(
          'div',
          { class: 'chip-row', role: 'group', 'aria-label': 'Filter sistem organ' },
          h('button', { class: cx('chip chip--filter', !app.ui.dxSystem && 'is-active'), type: 'button', onclick: () => app.setDxSystem(null) }, 'Semua'),
          systems.map((s) =>
            h('button', { class: cx('chip chip--filter', app.ui.dxSystem === s && 'is-active'), type: 'button', onclick: () => app.setDxSystem(s) }, s),
          ),
        )
      : null,
    list,
  );
}

function confirmDialog(app: App, diseaseId: string): HTMLElement {
  const disease = app.content.diseasesById.get(diseaseId)!;
  return h(
    'div',
    { class: 'modal-backdrop', onclick: (e: Event) => e.target === e.currentTarget && app.cancelDiagnosis() },
    h(
      'div',
      { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'dx-title', onkeydown: (e: Event) => (e as KeyboardEvent).key === 'Escape' && app.cancelDiagnosis() },
      h('h2', { id: 'dx-title' }, 'Tetapkan diagnosis?'),
      h('p', { class: 'modal__dx' }, disease.name),
      h('p', { class: 'hint' }, 'Konsultasi akan selesai. Anda tidak bisa bertanya atau memeriksa lagi.'),
      h(
        'div',
        { class: 'modal__actions' },
        h('button', { class: 'btn', type: 'button', onclick: () => app.cancelDiagnosis() }, 'Batal'),
        h('button', { class: 'btn btn--primary', type: 'button', 'data-autofocus': true, onclick: () => app.confirmDiagnosis() }, 'Ya, tetapkan'),
      ),
    ),
  );
}
