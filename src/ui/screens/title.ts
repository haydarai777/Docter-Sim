import type { App } from '../app';
import { disclaimer } from '../components/disclaimer';
import { h } from '../dom';

export function renderTitle(app: App): HTMLElement {
  const { config } = app;
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
      h('button', { class: 'btn btn--primary btn--lg', type: 'button', onclick: () => app.startGame() }, 'Mulai Praktek'),
      disclaimer(),
    ),
  );
}
