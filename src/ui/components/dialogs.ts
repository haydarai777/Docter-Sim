/**
 * Dialog: panduan bermain, pengaturan, dan rekam medis pasien.
 */
import { formatRupiah } from '../../core/text';
import type { App } from '../app';
import { doctorQuestion } from '../../core/dialogue';
import { type Child, cx, h } from '../dom';
import { modal } from './modal';
import { SEX_LABEL } from '../labels';

// ---------------------------------------------------------------------------
// Panduan bermain
// ---------------------------------------------------------------------------

interface TutorialStep {
  icon: string;
  title: string;
  points: string[];
}

export function tutorialSteps(app: App): TutorialStep[] {
  const { config } = app;
  return [
    {
      icon: '🩺',
      title: 'Selamat datang di meja praktek',
      points: [
        'Anda adalah dokter umum. Pasien datang satu per satu dengan keluhan sehari-hari.',
        'Tugas Anda: menemukan diagnosis yang tepat dengan informasi yang terbatas.',
        'Game ini hiburan & edukasi, bukan alat medis. Kontennya belum ditinjau dokter.',
      ],
    },
    {
      icon: '💬',
      title: 'Dengarkan pasien',
      points: [
        'Pasien bicara dengan bahasa awam yang sering kabur atau menyesatkan, misalnya "dada nggak enak, kayak masuk angin".',
        'Gaya bicara berbeda: ada yang cemas, meremehkan, pelupa, atau sok tahu. Perhatikan "kesan umum" di awal percakapan.',
        'Keluhan pertama TIDAK pernah lengkap — Anda harus menggali.',
      ],
    },
    {
      icon: '❓',
      title: 'Anamnesis (gratis, terbatas)',
      points: [
        `Anda hanya punya ${config.anamnesis.maxQuestions} pertanyaan per pasien. Pilih kategori (onset, pola, bepergian, kebiasaan, …) atau tanyakan gejala spesifik.`,
        '"Keluhan lain" bisa mengungkap beberapa gejala sekaligus.',
        'Tips: pada pasien demam, riwayat bepergian sering menentukan.',
      ],
    },
    {
      icon: '🧪',
      title: 'Pemeriksaan (berbayar)',
      points: [
        'Setiap pemeriksaan memotong budget pasien. Pasien ekonomi lemah hanya mampu sedikit pemeriksaan — pilih yang paling berguna.',
        'Pemeriksaan yang tidak relevan tetap memberi hasil (biasanya normal) — budget bisa terbuang.',
        'Seperti di dunia nyata, tes bisa negatif palsu atau positif palsu (bisa dimatikan di Pengaturan → mode latihan).',
        'Buka "Rekam medis" untuk melihat ringkasan temuan dengan istilah medis.',
      ],
    },
    {
      icon: '⭐',
      title: 'Diagnosis & reputasi',
      points: [
        `Diagnosis tepat: +${config.reputation.correctBase} reputasi, plus bonus bila hemat biaya.`,
        'Diagnosis salah: reputasi turun — jauh lebih besar bila penyakit berbahaya yang terlewat.',
        `Reputasi di bawah ${config.reputation.gameOverBelow}: praktek ditutup (game over).`,
        'Setelah diagnosis, pelajari ringkasannya: petunjuk yang terlewat dan cara membedakan penyakit.',
      ],
    },
  ];
}

export function tutorialDialog(app: App): HTMLElement {
  const steps = tutorialSteps(app);
  const i = Math.min(app.ui.tutorialStep, steps.length - 1);
  const step = steps[i]!;
  const last = i === steps.length - 1;
  return modalShell(
    app,
    'Panduan bermain',
    h(
      'div',
      { class: 'tutorial' },
      h('div', { class: 'tutorial__icon', 'aria-hidden': 'true' }, step.icon),
      h('h3', null, step.title),
      h('ul', { class: 'plain-list' }, step.points.map((p) => h('li', null, p))),
      h(
        'p',
        { class: 'tutorial__dots', 'aria-label': `Langkah ${i + 1} dari ${steps.length}` },
        steps.map((_, j) => h('span', { class: cx('dot', j === i && 'is-active') })),
      ),
    ),
    [
      i > 0 ? h('button', { class: 'btn', type: 'button', onclick: () => app.setTutorialStep(i - 1) }, 'Kembali') : null,
      last
        ? h('button', { class: 'btn btn--primary', type: 'button', 'data-autofocus': true, onclick: () => app.closeDialog() }, 'Mengerti, mulai!')
        : h('button', { class: 'btn btn--primary', type: 'button', 'data-autofocus': true, onclick: () => app.setTutorialStep(i + 1) }, 'Lanjut'),
    ],
  );
}

// ---------------------------------------------------------------------------
// Pengaturan
// ---------------------------------------------------------------------------

export function settingsDialog(app: App): HTMLElement {
  const s = app.settings;
  const themeOption = (value: typeof s.theme, label: string) =>
    h(
      'label',
      { class: 'radio' },
      h('input', { type: 'radio', name: 'tema', value, checked: s.theme === value, onchange: () => app.updateSettings({ theme: value }) }),
      ` ${label}`,
    );
  return modalShell(
    app,
    'Pengaturan',
    h(
      'div',
      { class: 'settings' },
      h('fieldset', null, h('legend', null, 'Tema tampilan'), themeOption('system', 'Ikuti perangkat'), themeOption('light', 'Terang'), themeOption('dark', 'Gelap')),
      h(
        'fieldset',
        null,
        h('legend', null, 'Akurasi tes'),
        h(
          'label',
          { class: 'radio' },
          h('input', {
            type: 'checkbox',
            checked: s.realisticTests,
            onchange: (e: Event) => app.updateSettings({ realisticTests: (e.target as HTMLInputElement).checked }),
          }),
          ' Realistis — tes bisa negatif palsu / positif palsu',
        ),
        h('p', { class: 'hint' }, 'Matikan untuk mode latihan: tes diagnostik selalu akurat. Berlaku mulai pasien berikutnya.'),
      ),
      h('button', { class: 'btn btn--small', type: 'button', onclick: () => app.openTutorial() }, 'Lihat panduan bermain'),
    ),
    h('button', { class: 'btn btn--primary', type: 'button', 'data-autofocus': true, onclick: () => app.closeDialog() }, 'Selesai'),
  );
}

// ---------------------------------------------------------------------------
// Rekam medis
// ---------------------------------------------------------------------------

export function medicalRecordDialog(app: App): HTMLElement {
  const enc = app.encounter!;
  const c = enc.case;
  const p = c.patient;
  const { content } = app;
  const personality = content.personalitiesById.get(p.personalityId);

  const symptomLabel = (id: string) => content.symptomsById.get(id)?.label ?? id;
  // Jawaban = entri pasien tepat setelah pertanyaan dokter untuk kategori tersebut.
  const answerFor = (catId: string): string => {
    const cat = content.anamnesisById.get(catId);
    if (!cat) return '';
    const question = doctorQuestion(cat.question, c);
    const i = enc.log.findIndex((e) => e.kind === 'doctor' && e.text === question);
    const next = enc.log[i + 1];
    return i >= 0 && next?.kind === 'patient' ? next.text : '';
  };
  const denied = enc.askedSymptoms.filter((id) => !enc.revealedSymptoms.includes(id));

  const exams = enc.examsDone.map((toolId) => {
    const tool = content.toolsById.get(toolId)!;
    const results = c.findings[toolId] ?? [];
    const abnormal = results.filter((r) => r.flag);
    return h(
      'li',
      null,
      h('strong', null, tool.name),
      abnormal.length
        ? h(
            'ul',
            { class: 'record-abnormal' },
            abnormal.map((r) => h('li', null, `${r.label}: `, h('strong', { class: 'abnormal' }, `${r.display}${r.unit ? ` ${r.unit}` : ''}`), r.refText ? h('span', { class: 'muted' }, ` (rujukan ${r.refText})`) : null)),
          )
        : h('span', { class: 'muted' }, ' — dalam batas normal'),
    );
  });

  return modalShell(
    app,
    'Rekam medis',
    h(
      'div',
      { class: 'record' },
      h('p', null, h('strong', null, p.name), ` · ${p.age} th · ${SEX_LABEL[p.sex]} · ${p.occupationLabel}`),
      personality ? h('p', { class: 'muted' }, `Kesan umum: ${personality.impression.toLowerCase()}.`) : null,
      h('h3', null, 'Gejala yang diketahui'),
      enc.revealedSymptoms.length
        ? h('ul', { class: 'chip-row' }, enc.revealedSymptoms.map((id) => h('li', { class: 'tag' }, symptomLabel(id))))
        : h('p', { class: 'muted' }, 'Belum ada.'),
      denied.length ? h('p', { class: 'muted' }, `Disangkal / tidak jelas: ${denied.map(symptomLabel).join(', ')}.`) : null,
      h('h3', null, 'Anamnesis'),
      enc.askedCategories.length
        ? h(
            'dl',
            { class: 'record-qa' },
            enc.askedCategories.map((catId) => {
              const cat = content.anamnesisById.get(catId);
              return [h('dt', null, cat?.label ?? catId), h('dd', null, answerFor(catId))];
            }),
          )
        : h('p', { class: 'muted' }, 'Belum ada pertanyaan kategori.'),
      h('h3', null, 'Pemeriksaan'),
      exams.length ? h('ul', { class: 'record-exams' }, exams) : h('p', { class: 'muted' }, 'Belum ada pemeriksaan.'),
      h('p', { class: 'hint' }, `Biaya terpakai ${formatRupiah(enc.spent)} · sisa budget ${formatRupiah(enc.budgetRemaining)}.`),
    ),
    h('button', { class: 'btn btn--primary', type: 'button', 'data-autofocus': true, onclick: () => app.closeDialog() }, 'Tutup'),
  );
}

function modalShell(app: App, title: string, body: HTMLElement, actions: Child): HTMLElement {
  return modal({ title, body, actions, wide: true, onClose: () => app.closeDialog() });
}
