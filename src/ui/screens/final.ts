/**
 * Layar akhir: game over (reputasi di bawah ambang) atau praktek diakhiri pemain.
 * Menampilkan statistik sesi, grafik reputasi, rekap per penyakit, riwayat, dan rekor.
 */
import { runStats } from '../../core/run';
import { reputationTitle } from '../../core/scoring';
import { formatRupiah } from '../../core/text';
import type { App } from '../app';
import { disclaimer } from '../components/disclaimer';
import { reputationChart } from '../components/reputationChart';
import { cx, h } from '../dom';

export function renderFinal(app: App): HTMLElement {
  const run = app.run!;
  const { content, config } = app;
  const stats = runStats(run, content, config);
  const gameOver = run.status === 'game_over';
  const records = app.finalRecords;

  const stat = (label: string, value: string, sub?: string, isRecord = false) =>
    h(
      'div',
      { class: 'stat' },
      h('span', { class: 'stat__label' }, label),
      h('strong', { class: 'stat__value' }, value, isRecord ? h('span', { class: 'badge badge--record' }, ' Rekor baru!') : null),
      sub ? h('span', { class: 'stat__sub' }, sub) : null,
    );

  const name = (id: string) => content.catalogById.get(id)?.name ?? id;

  return h(
    'main',
    { class: 'summary final' },
    h(
      'header',
      { class: cx('verdict', gameOver ? 'verdict--bad' : 'verdict--ok') },
      h('div', { class: 'verdict__icon', 'aria-hidden': 'true' }, gameOver ? '✗' : '✓'),
      h(
        'div',
        null,
        h('h1', null, gameOver ? 'Praktek ditutup' : 'Praktek selesai'),
        h(
          'p',
          null,
          gameOver
            ? `Reputasi Anda turun di bawah ${config.reputation.gameOverBelow} setelah ${stats.patientsSeen} pasien. Pasien tidak lagi mempercayai praktek Anda.`
            : `Anda mengakhiri praktek setelah ${stats.patientsSeen} pasien dengan reputasi ${run.reputation} — "${reputationTitle(run.reputation, config)}".`,
        ),
      ),
    ),

    h(
      'div',
      { class: 'sum-stats sum-stats--4' },
      stat('Pasien', String(stats.patientsSeen)),
      stat('Skor klinis rata-rata', stats.patientsSeen ? stats.averageScore.toFixed(0) : '—', 'dari 100', records?.broken.includes('bestAverageScore')),
      stat('Diagnosis tepat', `${stats.correct} (${Math.round(stats.accuracy * 100)}%)`, undefined, records?.broken.includes('bestCorrect')),
      stat('Rentetan tepat terbaik', String(stats.bestStreak), undefined, records?.broken.includes('bestStreak')),
      stat('Penyakit berbahaya terlewat', String(stats.dangerousMisses), 'tingkat bahaya tinggi/kritis'),
    ),

    h(
      'section',
      { class: 'sum-section' },
      h('h2', null, 'Riwayat reputasi'),
      reputationChart({
        values: stats.reputationHistory,
        min: config.reputation.min,
        max: config.reputation.max,
        threshold: config.reputation.gameOverBelow,
        pointLabel: (i) => {
          const r = run.history[i - 1]!;
          return `${r.correct ? 'Tepat' : 'Salah'}: ${name(r.diseaseId)} · skor ${r.score}`;
        },
      }),
      h('p', { class: 'hint' }, `Biaya pemeriksaan penunjang rata-rata ${formatRupiah(stats.averageSpent)} per pasien.`),
    ),

    stats.perDisease.length
      ? h(
          'section',
          { class: 'sum-section' },
          h('h2', null, 'Rekap per penyakit'),
          h(
            'ul',
            { class: 'clue-list' },
            stats.perDisease.map((d) =>
              h(
                'li',
                { class: cx('clue', d.correct === d.seen ? 'clue--found' : 'clue--missed') },
                h('span', { class: 'clue__mark' }, d.correct === d.seen ? '✓' : '✗'),
                h('span', null, `${name(d.diseaseId)} `, h('span', { class: 'muted' }, `${d.correct}/${d.seen} tepat`)),
              ),
            ),
          ),
        )
      : null,

    run.history.length
      ? h(
          'section',
          { class: 'sum-section' },
          h('h2', null, 'Riwayat pasien'),
          h(
            'div',
            { class: 'table-wrap' },
            h(
              'table',
              { class: 'history-table' },
              h(
                'thead',
                null,
                h('tr', null, ['#', 'Pasien', 'Sebenarnya', 'Diagnosis Anda', 'Skor', 'Biaya', 'Reputasi'].map((t) => h('th', { scope: 'col' }, t))),
              ),
              h(
                'tbody',
                null,
                run.history.map((r) =>
                  h(
                    'tr',
                    { class: r.correct ? '' : 'is-wrong' },
                    h('td', null, String(r.index + 1)),
                    h('td', null, r.patientName),
                    h('td', null, name(r.diseaseId)),
                    h('td', null, `${r.correct ? '✓' : '✗'} ${name(r.chosenId)}`),
                    h('td', { class: 'num' }, String(r.score ?? '—')),
                    h('td', { class: 'num' }, formatRupiah(r.spent)),
                    h('td', { class: 'num' }, `${r.reputationDelta >= 0 ? '+' : '−'}${Math.abs(r.reputationDelta)} → ${r.reputationAfter}`),
                  ),
                ),
              ),
            ),
          ),
        )
      : null,

    records
      ? h(
          'section',
          { class: 'sum-section' },
          h('h2', null, 'Rekor Anda'),
          h(
            'p',
            null,
            `Diagnosis tepat terbanyak: ${records.records.bestCorrect} · Rentetan terbaik: ${records.records.bestStreak} · ` +
              `Skor rata-rata terbaik: ${records.records.bestAverageScore || '—'} · ` +
              `Pasien terbanyak: ${records.records.bestPatients} · Sesi dimainkan: ${records.records.runsPlayed}`,
          ),
        )
      : null,

    h(
      'div',
      { class: 'summary__actions summary__actions--row' },
      h('button', { class: 'btn btn--primary btn--lg', type: 'button', onclick: () => app.startGame() }, 'Praktek baru'),
      h('button', { class: 'btn btn--lg', type: 'button', onclick: () => app.backToTitle() }, 'Ke layar judul'),
    ),
    disclaimer(true),
  );
}
