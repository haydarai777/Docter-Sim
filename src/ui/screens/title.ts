import type { App } from '../app';
import { disclaimer } from '../components/disclaimer';
import { h } from '../dom';
import { diseaseSystems } from '../../core/run';
import { loadRecords } from '../storage';

export function renderTitle(app: App): HTMLElement {
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
      h('p', { class: 'title-tagline' }, 'Simulator praktik klinis dokter umum'),
      h(
        'ol',
        { class: 'title-howto' },
        h('li', null, 'Pasien masuk ke ruang praktik Anda. Amati penampilan dan bahasa tubuhnya, lalu wawancarai dengan pertanyaan bebas.'),
        h('li', null, 'Periksa fisik (gratis) dan pilih pemeriksaan penunjang sesuai tujuan (memotong budget pasien).'),
        h('li', null, 'Susun diagnosis banding, nilai komplikasi, lalu putuskan diagnosis & disposisi. Seluruh proses klinis Anda dinilai.'),
      ),
      h(
        'label',
        { class: 'title-focus' },
        h('span', null, 'Pasien yang datang'),
        h(
          'select',
          {
            class: 'select',
            'aria-label': 'Fokus kelompok penyakit',
            onchange: (e: Event) => app.updateSettings({ focusSystem: (e.target as HTMLSelectElement).value || null }),
          },
          h('option', { value: '', selected: !app.focusSystem }, `Semua penyakit (${app.content.diseases.length})`),
          diseaseSystems(app.content).map(({ system, count }) => h('option', { value: system, selected: app.focusSystem === system }, `${system} (${count})`)),
        ),
      ),
      saved
        ? h(
            'div',
            { class: 'title-actions' },
            h(
              'button',
              { class: 'btn btn--primary btn--lg', type: 'button', onclick: () => app.resumeGame() },
              `Lanjutkan praktek (pasien #${saved.run.patientIndex}, reputasi ${saved.run.reputation}${saved.run.focusSystem ? ` · ${saved.run.focusSystem}` : ''})`,
            ),
            h('button', { class: 'btn', type: 'button', onclick: () => app.startGame() }, 'Mulai praktek baru'),
          )
        : h('button', { class: 'btn btn--primary btn--lg', type: 'button', onclick: () => app.startGame() }, 'Mulai Praktek'),
      h(
        'button',
        { class: 'btn btn--lg title-osce title-igd', type: 'button', onclick: () => app.openIgdMenu() },
        '🚑 Dokter Jaga IGD',
        h('span', { class: 'title-osce__sub' }, ' — triase, resusitasi & stabilisasi pasien gawat darurat'),
      ),
      h(
        'button',
        { class: 'btn btn--lg title-osce', type: 'button', onclick: () => app.openOsceMenu() },
        '🎓 Latihan OSCE',
        h('span', { class: 'title-osce__sub' }, ' — stasiun bertimer, resep, KIE & prosedur'),
      ),
      records.runsPlayed > 0
        ? h(
            'p',
            { class: 'title-records' },
            `Rekor: ${records.bestCorrect} diagnosis tepat · rentetan terbaik ${records.bestStreak}${records.bestAverageScore ? ` · skor rata-rata terbaik ${records.bestAverageScore}` : ''} · ${records.runsPlayed} sesi dimainkan`,
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
