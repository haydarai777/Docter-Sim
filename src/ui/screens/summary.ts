/**
 * Layar ringkasan edukatif setelah diagnosis.
 */
import { buildSummary } from '../../core/summary';
import { formatNumber, formatRupiah } from '../../core/text';
import type { App } from '../app';
import { disclaimer } from '../components/disclaimer';
import { cx, h } from '../dom';
import { DANGER_LABEL } from '../labels';

export function renderSummary(app: App): HTMLElement {
  const run = app.run!;
  const enc = run.encounter!;
  const s = buildSummary(enc, app.content, app.config);
  const { outcome, disease } = s;
  const before = run.reputation - (run.history.at(-1)?.reputationDelta ?? 0);
  const R = app.config.reputation;

  const deltaText = outcome.correct
    ? `+${outcome.reputationDelta} (dasar ${outcome.breakdown.base}${outcome.breakdown.efficiencyBonus ? ` + hemat ${outcome.breakdown.efficiencyBonus}` : ''})`
    : `−${outcome.breakdown.penalty} (${R.wrongBase} × pengali ${formatNumber(outcome.breakdown.dangerMultiplier, 1)} untuk ${DANGER_LABEL[disease.danger].toLowerCase()})`;

  const section = (title: string, ...children: Parameters<typeof h>[2][]) =>
    h('section', { class: 'sum-section' }, h('h2', null, title), ...children);

  return h(
    'main',
    { class: 'summary' },
    h(
      'header',
      { class: cx('verdict', outcome.correct ? 'verdict--ok' : 'verdict--bad') },
      h('div', { class: 'verdict__icon', 'aria-hidden': 'true' }, outcome.correct ? '✓' : '✗'),
      h(
        'div',
        null,
        h('h1', null, outcome.correct ? 'Diagnosis tepat!' : 'Diagnosis kurang tepat'),
        !outcome.correct ? h('p', null, 'Diagnosis Anda: ', h('strong', null, s.chosen.name)) : null,
        h('p', null, 'Diagnosis sebenarnya: ', h('strong', null, disease.name)),
        h(
          'p',
          { class: 'verdict__tags' },
          h('span', { class: cx('badge', `badge--danger-${disease.danger}`) }, DANGER_LABEL[disease.danger]),
          h('span', { class: 'badge' }, `SKDI ${disease.skdiLevel}`),
          h('span', { class: 'badge' }, disease.system),
        ),
      ),
    ),

    h(
      'div',
      { class: 'sum-stats' },
      h('div', { class: 'stat' }, h('span', { class: 'stat__label' }, 'Reputasi'), h('strong', { class: 'stat__value' }, `${before} → ${run.reputation}`), h('span', { class: 'stat__sub' }, deltaText)),
      h(
        'div',
        { class: 'stat' },
        h('span', { class: 'stat__label' }, 'Biaya pemeriksaan'),
        h('strong', { class: 'stat__value' }, formatRupiah(outcome.spent)),
        h('span', { class: 'stat__sub' }, `budget ${formatRupiah(s.budget)} · ideal ±${formatRupiah(s.idealCost)}`),
      ),
    ),

    s.differentialNote ? section(`Membedakan ${disease.name} dengan ${s.chosen.name}`, h('p', null, s.differentialNote)) : null,

    section('Tentang penyakit ini', h('p', null, disease.summary)),

    section(
      'Kasus ini',
      h('ul', { class: 'plain-list' }, h('li', null, `Pasien datang pada hari sakit ke-${s.day}.`), s.caseNotes.map((n) => h('li', null, n))),
    ),

    section(
      'Petunjuk kunci di kasus ini',
      h('p', { class: 'hint' }, '✓ = berhasil Anda gali · ✗ = terlewat'),
      h(
        'ul',
        { class: 'clue-list' },
        s.clues.map((c) =>
          h(
            'li',
            { class: cx('clue', c.found ? 'clue--found' : 'clue--missed') },
            h('span', { class: 'clue__mark', 'aria-label': c.found ? 'ditemukan' : 'terlewat' }, c.found ? '✓' : '✗'),
            h('span', { class: 'clue__src' }, c.source),
            h('span', null, c.text),
          ),
        ),
      ),
    ),

    s.falsePositives.length
      ? section(
          'Hasil positif palsu',
          h('p', { class: 'hint' }, 'Hasil abnormal berikut BUKAN disebabkan penyakit pasien — contoh keterbatasan tes di dunia nyata.'),
          h('ul', { class: 'plain-list' }, s.falsePositives.map((f) => h('li', null, f))),
        )
      : null,

    section(
      'Pemeriksaan paling berguna',
      h(
        'ul',
        { class: 'clue-list' },
        s.idealWorkup.map((w) =>
          h(
            'li',
            { class: cx('clue', w.done ? 'clue--found' : 'clue--missed') },
            h('span', { class: 'clue__mark' }, w.done ? '✓' : '○'),
            h('span', null, `${w.name} `, h('span', { class: 'muted' }, formatRupiah(w.cost))),
          ),
        ),
      ),
      s.lowYieldExams.length
        ? h('p', { class: 'hint' }, `Kurang berguna untuk kasus ini: ${s.lowYieldExams.map((x) => x.name).join(', ')}.`)
        : null,
    ),

    section('Temuan khas', h('ul', { class: 'plain-list' }, disease.keyFindings.map((k) => h('li', null, k)))),

    disease.teachingPoints?.length
      ? section('Catatan pembelajaran', h('ul', { class: 'plain-list' }, disease.teachingPoints.map((t) => h('li', null, t))))
      : null,

    disease.otherDifferentials?.length
      ? section('Diagnosis banding lain', h('p', null, disease.otherDifferentials.join(', ') + '.'))
      : null,

    run.status === 'game_over'
      ? h(
          'div',
          { class: 'summary__actions' },
          h('p', { class: 'banner banner--warn' }, `Reputasi Anda turun di bawah ${R.gameOverBelow}. Praktek ditutup.`),
          h('button', { class: 'btn btn--primary btn--lg', type: 'button', onclick: () => app.showFinal() }, 'Lihat hasil akhir'),
        )
      : h(
          'div',
          { class: 'summary__actions summary__actions--row' },
          h('button', { class: 'btn btn--primary btn--lg', type: 'button', onclick: () => app.nextPatient() }, 'Pasien berikutnya →'),
          h('button', { class: 'btn', type: 'button', onclick: () => app.retire() }, 'Akhiri praktek'),
        ),
    h('p', { class: 'muted case-code' }, `Kode kasus: ${enc.case.seed}`),
    disclaimer(true),
  );
}
