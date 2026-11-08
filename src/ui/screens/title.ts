import type { App } from '../app';
import { disclaimer } from '../components/disclaimer';
import { h } from '../dom';
import { loadRecords } from '../storage';

export function renderTitle(app: App): HTMLElement {
  const { config } = app;
  const records = loadRecords();
  const saved = app.savedSession;
  return h(
    'main',
    { class: 'title-screen' },
    h(
      'div',
      { class: 'title-card' },
      h('div', { class: 'title-logo', 'aria-hidden': 'true' }, '🩺'),
      h('h1', { class: 'title-name' }, 'Meja Praktek'),
      h('p', { class: 'title-tagline' }, 'Simulasi diagnosis dokter umum'),
      h(
        'ol',
        { class: 'title-howto' },
        h('li', null, 'Dengarkan keluhan pasien — sering kabur, tidak lengkap, bahkan menyesatkan.'),
        h('li', null, `Gali informasi lewat anamnesis (gratis, maks. ${config.anamnesis.maxQuestions} pertanyaan) dan pemeriksaan (berbayar, memotong budget pasien).`),
        h('li', null, 'Tetapkan diagnosis. Reputasi naik jika tepat, turun jika salah — lebih besar bila penyakit berbahaya terlewat.'),
      ),
      saved
        ? h(
            'div',
            { class: 'title-actions' },
            h(
              'button',
              { class: 'btn btn--primary btn--lg', type: 'button', onclick: () => app.resumeGame() },
              `Lanjutkan praktek (pasien #${saved.run.patientIndex}, reputasi ${saved.run.reputation})`,
            ),
            h('button', { class: 'btn', type: 'button', onclick: () => app.startGame() }, 'Mulai praktek baru'),
          )
        : h('button', { class: 'btn btn--primary btn--lg', type: 'button', onclick: () => app.startGame() }, 'Mulai Praktek'),
      records.runsPlayed > 0
        ? h(
            'p',
            { class: 'title-records' },
            `Rekor: ${records.bestCorrect} diagnosis tepat · rentetan terbaik ${records.bestStreak} · ${records.runsPlayed} sesi dimainkan`,
          )
        : null,
      h(
        'div',
        { class: 'title-links' },
        h('button', { class: 'btn btn--small btn--ghost', type: 'button', onclick: () => app.openDialog('tutorial') }, 'Panduan bermain'),
        h('button', { class: 'btn btn--small btn--ghost', type: 'button', onclick: () => app.openDialog('settings') }, 'Pengaturan'),
      ),
      disclaimer(),
    ),
  );
}
