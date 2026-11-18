/**
 * Layar umpan balik setelah konsultasi: skor proses klinis per komponen,
 * yang sudah baik & yang terlewat, asumsi keliru, rekomendasi, dan materi kasus.
 */
import { DISPOSITION_LABEL } from '../../core/evaluation';
import { formatRupiah } from '../../core/text';
import type { ComponentScore, EvaluationResult } from '../../core/types';
import type { App } from '../app';
import { disclaimer } from '../components/disclaimer';
import { type Child, cx, h } from '../dom';
import { DANGER_LABEL } from '../labels';

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');

export function renderSummary(app: App): HTMLElement {
  const run = app.run!;
  const enc = run.encounter!;
  const ev = enc.evaluation!;
  const decision = enc.decision!;
  const c = enc.case;
  const { content } = app;
  const disease = content.diseasesById.get(ev.trueId)!;
  const chosen = content.catalogById.get(ev.chosenId);
  const before = run.reputation - (run.history.at(-1)?.reputationDelta ?? 0);
  const R = app.config.reputation;

  const section = (title: string, ...children: Child[]) => h('section', { class: 'sum-section' }, h('h2', null, title), ...children);
  const name = (id: string) => content.catalogById.get(id)?.name ?? id;

  // Catatan kasus: trait edukatif, komorbiditas, insidental, komplikasi, gejala tersembunyi.
  const notes: string[] = [`Pasien datang pada hari sakit ke-${c.day}.`];
  for (const t of c.traits) {
    const label = disease.traitLabels?.[t];
    if (label) notes.push(label);
  }
  for (const m of c.comorbidities) {
    notes.push(`Komorbiditas: ${name(m.id)}${m.known ? ' (pasien sudah tahu)' : ' (belum pernah terdiagnosis)'}.`);
  }
  for (const id of c.incidentals) notes.push(`Temuan insidental: ${name(id)} — ${content.incidentalsById.get(id)?.note ?? ''}`);
  if (c.complications.length) {
    notes.push(`Komplikasi yang ada: ${c.complications.map((id) => disease.complications?.find((x) => x.id === id)?.name ?? id).join(', ')}.`);
  } else if (disease.complications?.length) notes.push('Kasus ini tanpa komplikasi.');
  if (c.hiddenSymptoms.length) {
    notes.push(`Gejala yang tidak disebut sukarela (harus ditanyakan): ${c.hiddenSymptoms.map((s) => content.symptomsById.get(s)?.label ?? s).join(', ')}.`);
  }
  if (c.allergy) notes.push(`Alergi: ${c.allergy}.`);

  const comorbidManagement = [
    ...c.comorbidities.map((m) => content.comorbiditiesById.get(m.id)),
    ...Object.entries(disease.traitComorbidities ?? {})
      .filter(([trait]) => c.traits.includes(trait))
      .map(([, id]) => content.comorbiditiesById.get(id)),
  ].filter((x, i, arr) => x && arr.indexOf(x) === i);

  return h(
    'main',
    { class: 'summary' },
    verdict(app, ev, disease.name, chosen?.name ?? ev.chosenId),

    h(
      'div',
      { class: 'sum-stats' },
      h(
        'div',
        { class: 'stat' },
        h('span', { class: 'stat__label' }, 'Reputasi'),
        h('strong', { class: 'stat__value' }, `${before} → ${run.reputation}`),
        h(
          'span',
          { class: 'stat__sub' },
          `skor ${signed(ev.reputationBreakdown.fromScore)}`,
          ev.reputationBreakdown.wrongPrimary ? ` · diagnosis salah ${signed(ev.reputationBreakdown.wrongPrimary)} (${DANGER_LABEL[disease.danger].toLowerCase()})` : '',
          ev.reputationBreakdown.unsafe ? ` · keselamatan ${signed(ev.reputationBreakdown.unsafe)}` : '',
        ),
      ),
      h(
        'div',
        { class: 'stat' },
        h('span', { class: 'stat__label' }, 'Biaya penunjang'),
        h('strong', { class: 'stat__value' }, formatRupiah(ev.spent)),
        h('span', { class: 'stat__sub' }, `budget ${formatRupiah(c.patient.budget)} · ${enc.questionCount} pertanyaan`),
      ),
    ),

    ev.unsafe
      ? h('p', { class: 'banner banner--warn', role: 'alert' }, `⚠ Keselamatan pasien: kasus ini perlu ${DISPOSITION_LABEL[ev.expectedDisposition].toLowerCase()}. ${ev.dispositionReason}`)
      : null,

    section(
      'Penilaian proses klinis',
      h('p', { class: 'hint' }, 'Ketuk tiap komponen untuk melihat yang sudah baik (✓) dan yang terlewat (✗).'),
      h(
        'div',
        { class: 'score-list' },
        ev.components.map((comp) => componentRow(app, comp)),
      ),
    ),

    ev.pitfalls.length
      ? section('Asumsi yang perlu dikoreksi', h('ul', { class: 'plain-list' }, ev.pitfalls.map((p) => h('li', null, p))))
      : null,

    ev.recommendations.length
      ? section('Rekomendasi untuk pasien berikutnya', h('ul', { class: 'plain-list' }, ev.recommendations.map((r) => h('li', null, r))))
      : null,

    section(
      `Kasus ini: ${disease.name}`,
      h(
        'p',
        { class: 'verdict__tags' },
        h('span', { class: cx('badge', `badge--danger-${disease.danger}`) }, DANGER_LABEL[disease.danger]),
        h('span', { class: 'badge' }, `SKDI ${disease.skdiLevel}`),
        h('span', { class: 'badge' }, disease.system),
      ),
      h('p', null, disease.summary),
      h('ul', { class: 'plain-list' }, notes.map((n) => h('li', null, n))),
    ),

    section('Pendekatan klinis yang dianjurkan', h('ol', { class: 'plain-list plain-list--ordered' }, disease.approach.map((a) => h('li', null, a)))),

    section(
      'Diagnosis banding & cara membedakan',
      h(
        'ul',
        { class: 'diff-list' },
        disease.differentials.map((d) =>
          h(
            'li',
            null,
            h('strong', null, name(d.id)),
            d.mustNotMiss ? h('span', { class: 'tag tag--danger' }, 'jangan terlewat') : null,
            h('p', null, d.howToDistinguish),
          ),
        ),
      ),
    ),

    section(
      'Tata laksana (prinsip)',
      h('p', null, h('strong', null, 'Disposisi yang tepat: '), `${DISPOSITION_LABEL[ev.expectedDisposition]}. `, h('span', { class: 'muted' }, ev.dispositionReason)),
      h('p', { class: 'muted' }, `Keputusan Anda: ${DISPOSITION_LABEL[decision.disposition]}.`),
      h('ul', { class: 'plain-list' }, disease.management.map((m) => h('li', null, m))),
      comorbidManagement.length
        ? [
            h('h3', null, 'Masalah lain pada pasien ini'),
            h(
              'ul',
              { class: 'plain-list' },
              comorbidManagement.map((m) => h('li', null, h('strong', null, `${m!.name}: `), m!.management.join(' '))),
            ),
          ]
        : null,
      h('p', { class: 'hint' }, 'Hanya prinsip umum untuk edukasi — tanpa dosis obat. Ikuti pedoman resmi & penilaian dokter.'),
    ),

    section('Temuan khas', h('ul', { class: 'plain-list' }, disease.keyFindings.map((k) => h('li', null, k)))),

    disease.teachingPoints?.length
      ? section('Catatan pembelajaran', h('ul', { class: 'plain-list' }, disease.teachingPoints.map((t) => h('li', null, t))))
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
    h('p', { class: 'muted case-code' }, `Kode kasus: ${c.seed}`),
    disclaimer(true),
  );
}

function verdict(_app: App, ev: EvaluationResult, trueName: string, chosenName: string): HTMLElement {
  const tone = ev.total >= 70 ? 'ok' : ev.total >= 55 ? 'mid' : 'bad';
  return h(
    'header',
    { class: cx('verdict', `verdict--${tone}`) },
    h(
      'div',
      { class: 'verdict__grade', 'aria-label': `Nilai ${ev.grade}` },
      h('span', { class: 'verdict__letter' }, ev.grade),
      h('span', { class: 'verdict__score' }, `${ev.total}/100`),
    ),
    h(
      'div',
      null,
      h('h1', null, ev.gradeLabel),
      h(
        'p',
        null,
        ev.primaryCorrect ? '✓ Diagnosis kerja tepat: ' : '✗ Diagnosis kerja Anda: ',
        h('strong', null, ev.primaryCorrect ? trueName : chosenName),
      ),
      !ev.primaryCorrect ? h('p', null, 'Diagnosis sebenarnya: ', h('strong', null, trueName)) : null,
      h('p', { class: 'muted' }, `Nilai dari proses klinis: ${ev.components.map((x) => `${x.label.toLowerCase()} ${x.max}%`).join(' · ')}.`),
    ),
  );
}

function componentRow(app: App, comp: ComponentScore): HTMLElement {
  const pct = comp.max > 0 ? (comp.score / comp.max) * 100 : 0;
  const open = app.ui.openFeedback === comp.key;
  const level = pct >= 75 ? 'good' : pct >= 50 ? 'mid' : 'low';
  const score = Number.isInteger(comp.score) ? String(comp.score) : comp.score.toFixed(1).replace('.', ',');
  return h(
    'div',
    { class: cx('score-row', open && 'is-open') },
    h(
      'button',
      { class: 'score-row__head', type: 'button', 'aria-expanded': open ? 'true' : 'false', onclick: () => app.toggleFeedback(comp.key) },
      h('span', { class: 'score-row__label' }, comp.label),
      h(
        'span',
        { class: 'score-bar', role: 'meter', 'aria-valuemin': 0, 'aria-valuemax': comp.max, 'aria-valuenow': comp.score, 'aria-label': comp.label },
        h('span', { class: cx('score-bar__fill', `score-bar__fill--${level}`), style: `width:${pct}%` }),
      ),
      h('span', { class: 'score-row__value' }, `${score}/${comp.max}`),
      h('span', { class: 'score-row__chev', 'aria-hidden': 'true' }, open ? '▴' : '▾'),
    ),
    open
      ? h(
          'div',
          { class: 'score-row__body' },
          comp.good.length
            ? h(
                'ul',
                { class: 'fb-list' },
                comp.good.map((g) => h('li', { class: 'fb fb--good' }, h('span', { class: 'fb__mark', 'aria-label': 'baik' }, '✓'), h('div', null, h('span', null, g.text), g.detail ? h('p', { class: 'muted' }, g.detail) : null))),
              )
            : null,
          comp.missed.length
            ? h(
                'ul',
                { class: 'fb-list' },
                comp.missed.map((m) => h('li', { class: 'fb fb--missed' }, h('span', { class: 'fb__mark', 'aria-label': 'terlewat' }, '✗'), h('div', null, h('span', null, m.text), m.detail ? h('p', { class: 'muted' }, m.detail) : null))),
              )
            : h('p', { class: 'muted' }, 'Tidak ada yang terlewat. 👍'),
        )
      : null,
  );
}
