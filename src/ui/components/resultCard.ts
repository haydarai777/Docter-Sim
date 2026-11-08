import { formatRupiah } from '../../core/text';
import type { ParamResult, ToolDef } from '../../core/types';
import { cx, h } from '../dom';
import { FLAG_LABEL } from '../labels';

/** Kartu hasil pemeriksaan: tabel parameter, nilai, rujukan, dan penanda abnormal. */
export function resultCard(tool: ToolDef, results: ParamResult[], cost: number): HTMLElement {
  const rows = results.map((r) =>
    h(
      'tr',
      { class: cx(r.flag && 'is-abnormal') },
      h('th', { scope: 'row' }, r.label),
      h(
        'td',
        { class: 'result-value' },
        r.display,
        r.unit ? h('span', { class: 'result-unit' }, ` ${r.unit}`) : null,
        r.flag ? h('span', { class: 'result-flag', title: FLAG_LABEL[r.flag] }, ` ${flagSymbol(r.flag)}`) : null,
      ),
      h('td', { class: 'result-ref' }, r.refText ?? ''),
    ),
  );
  return h(
    'article',
    { class: 'result-card', 'aria-label': `Hasil ${tool.name}` },
    h(
      'header',
      { class: 'result-card__head' },
      h('span', { class: 'result-card__title' }, tool.name),
      h('span', { class: 'result-card__cost' }, cost > 0 ? `−${formatRupiah(cost)}` : 'gratis'),
    ),
    h('p', { class: 'result-card__action' }, tool.action),
    h(
      'table',
      { class: 'result-table' },
      h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Parameter'), h('th', { scope: 'col' }, 'Hasil'), h('th', { scope: 'col' }, 'Rujukan'))),
      h('tbody', null, rows),
    ),
  );
}

function flagSymbol(flag: 'H' | 'L' | '+'): string {
  return flag === 'H' ? '↑' : flag === 'L' ? '↓' : '*';
}
