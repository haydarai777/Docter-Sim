/**
 * Grafik garis riwayat reputasi (satu seri) dengan garis ambang game over.
 *
 * Mengikuti panduan dataviz: garis 2px, titik akhir r=4 dengan label nilai,
 * gridline hairline, teks memakai token teks (bukan warna seri), crosshair +
 * tooltip saat hover/fokus (keyboard: panah kiri/kanan). Nilai yang sama
 * juga tersedia di tabel riwayat (layar akhir), jadi tooltip tidak menjadi
 * satu-satunya akses ke data.
 */
import { h, replaceChildren } from '../dom';

const SVG_NS = 'http://www.w3.org/2000/svg';

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

export interface ReputationChartOptions {
  /** Reputasi awal lalu setelah tiap pasien. */
  values: number[];
  min: number;
  max: number;
  threshold: number;
  /** Label untuk titik ke-i (i ≥ 1), mis. nama penyakit. */
  pointLabel?: (index: number) => string;
}

export function reputationChart(opts: ReputationChartOptions): HTMLElement {
  const { values, min, max, threshold } = opts;
  const W = 640;
  const H = 220;
  const pad = { top: 16, right: 44, bottom: 28, left: 34 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const n = Math.max(values.length - 1, 1);
  const x = (i: number) => pad.left + (i / n) * innerW;
  const y = (v: number) => pad.top + (1 - (v - min) / (max - min)) * innerH;

  const root = svg('svg', {
    viewBox: `0 0 ${W} ${H}`,
    class: 'chart__svg',
    role: 'img',
    'aria-label': `Riwayat reputasi: dari ${values[0]} menjadi ${values[values.length - 1]} setelah ${values.length - 1} pasien`,
    tabindex: 0,
  });

  // Gridlines & sumbu Y
  for (const tick of [0, 25, 50, 75, 100].filter((t) => t >= min && t <= max)) {
    root.append(svg('line', { x1: pad.left, x2: W - pad.right, y1: y(tick), y2: y(tick), class: 'chart__grid' }));
    const label = svg('text', { x: pad.left - 8, y: y(tick) + 4, class: 'chart__tick', 'text-anchor': 'end' });
    label.textContent = String(tick);
    root.append(label);
  }
  // Sumbu X: nomor pasien (maks. ~8 label)
  const step = Math.max(1, Math.ceil(n / 8));
  for (let i = 0; i <= n; i += step) {
    const label = svg('text', { x: x(i), y: H - 8, class: 'chart__tick', 'text-anchor': 'middle' });
    label.textContent = i === 0 ? 'awal' : String(i);
    root.append(label);
  }

  // Garis ambang game over (warna status + label teks)
  root.append(svg('line', { x1: pad.left, x2: W - pad.right, y1: y(threshold), y2: y(threshold), class: 'chart__threshold' }));
  const tLabel = svg('text', { x: pad.left + 6, y: y(threshold) + 14, class: 'chart__threshold-label' });
  tLabel.textContent = `Batas game over (${threshold})`;
  root.append(tLabel);

  // Area tipis + garis seri
  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  if (values.length > 1) {
    root.append(svg('polygon', { points: `${x(0)},${y(min)} ${points} ${x(values.length - 1)},${y(min)}`, class: 'chart__area' }));
    root.append(svg('polyline', { points, class: 'chart__line' }));
  }
  const last = values.length - 1;
  root.append(svg('circle', { cx: x(last), cy: y(values[last]!), r: 4, class: 'chart__dot' }));
  const endLabel = svg('text', { x: x(last) + 8, y: y(values[last]!) + 4, class: 'chart__end-label' });
  endLabel.textContent = String(values[last]);
  root.append(endLabel);

  // Lapisan hover: crosshair + titik + tooltip
  const cross = svg('line', { x1: 0, x2: 0, y1: pad.top, y2: H - pad.bottom, class: 'chart__cross', visibility: 'hidden' });
  const hoverDot = svg('circle', { cx: 0, cy: 0, r: 5, class: 'chart__hover-dot', visibility: 'hidden' });
  const hit = svg('rect', { x: pad.left, y: pad.top, width: innerW, height: innerH, class: 'chart__hit' });
  root.append(cross, hoverDot, hit);

  const tooltip = h('div', { class: 'chart__tooltip', role: 'status', hidden: true });
  const wrap = h('div', { class: 'chart' }, root, tooltip);

  let current = last;
  const show = (i: number) => {
    current = Math.max(0, Math.min(last, i));
    const cx = x(current);
    const cy = y(values[current]!);
    cross.setAttribute('x1', String(cx));
    cross.setAttribute('x2', String(cx));
    cross.setAttribute('visibility', 'visible');
    hoverDot.setAttribute('cx', String(cx));
    hoverDot.setAttribute('cy', String(cy));
    hoverDot.setAttribute('visibility', 'visible');
    replaceChildren(
      tooltip,
      h('strong', null, String(values[current])),
      h('span', null, current === 0 ? ' · reputasi awal' : ` · setelah pasien #${current}`),
      current > 0 && opts.pointLabel ? h('span', { class: 'chart__tooltip-sub' }, opts.pointLabel(current)) : null,
    );
    tooltip.hidden = false;
    const rect = root.getBoundingClientRect();
    const scale = rect.width / W;
    tooltip.style.left = `${Math.min(rect.width - 8, Math.max(8, cx * scale))}px`;
    tooltip.style.top = `${cy * scale}px`;
  };
  const hide = () => {
    cross.setAttribute('visibility', 'hidden');
    hoverDot.setAttribute('visibility', 'hidden');
    tooltip.hidden = true;
  };

  hit.addEventListener('pointermove', (e) => {
    const rect = root.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    show(Math.round(((px - pad.left) / innerW) * n));
  });
  hit.addEventListener('pointerleave', hide);
  root.addEventListener('focus', () => show(current));
  root.addEventListener('blur', hide);
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(current - 1);
    else if (e.key === 'ArrowRight') show(current + 1);
    else return;
    e.preventDefault();
  });

  return wrap;
}
