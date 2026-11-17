/**
 * Penggambar monitor pasien (EKG berjalan, pletismografi, angka tanda vital) di kanvas 2D.
 * Dipakai panel UI dan tekstur layar monitor di ruang IGD 3D.
 */
import type { Rhythm } from '../../core/igd/types';

export interface MonitorState {
  live: boolean;
  hr: number;
  rhythm: Rhythm;
  pulse: boolean;
  spo2: number | null;
  sbp: number | null;
  dbp: number | null;
  map: number | null;
  rr: number;
  temp: number;
  etco2: number | null;
  /** Kompresi dada sedang berjalan (artefak pada EKG). */
  cpr: boolean;
  alarm: boolean;
}

const C = {
  bg: '#05090c',
  grid: '#0e1a1f',
  ecg: '#3ff58a',
  pleth: '#41d6ff',
  bp: '#ff6b6b',
  rr: '#ffd84d',
  temp: '#e2e8ee',
  dim: '#5d7380',
  alarm: '#ff3b30',
};

/** Bentuk gelombang EKG pada fase 0..1 dalam satu siklus. */
function ecgBeat(x: number, rhythm: Rhythm): number {
  const g = (mu: number, s: number, a: number) => a * Math.exp(-((x - mu) ** 2) / (2 * s * s));
  if (rhythm === 'vt') return Math.sin(x * Math.PI * 2) * 0.85;
  const wide = rhythm === 'av_blok_total';
  const p = rhythm === 'af_rvr' || rhythm === 'svt' ? 0 : g(0.12, 0.025, 0.12);
  return p + g(0.27, 0.01, -0.12) + g(0.3, wide ? 0.03 : 0.012, 1) + g(0.33, 0.012, -0.25) + g(0.55, 0.05, 0.28);
}

function plethBeat(x: number): number {
  const rise = Math.exp(-((x - 0.25) ** 2) / 0.012);
  const notch = 0.35 * Math.exp(-((x - 0.55) ** 2) / 0.006);
  return Math.max(rise, 0) + notch;
}

/** Nilai sinyal EKG pada waktu absolut t (detik). */
function ecgAt(t: number, s: MonitorState): number {
  if (s.cpr) return Math.sin(t * Math.PI * 2 * 1.85) * 0.55 + Math.sin(t * 13) * 0.05;
  if (s.rhythm === 'asistol') return Math.sin(t * 1.3) * 0.02;
  if (s.rhythm === 'vf') return Math.sin(t * 31) * 0.35 + Math.sin(t * 19.7 + 1) * 0.3 + Math.sin(t * 7.3) * 0.15;
  const hr = s.rhythm === 'pea' ? 44 : Math.max(20, s.hr);
  let period = 60 / hr;
  let phase = t / period;
  if (s.rhythm === 'af_rvr') {
    // Interval ireguler semu-acak.
    const k = Math.floor(phase);
    period *= 0.75 + 0.5 * ((Math.sin(k * 12.9898) * 43758.5453) % 1 + 1) % 1;
    phase = (t % (period * 4)) / period;
  }
  const base = ecgBeat(phase % 1, s.rhythm);
  return s.rhythm === 'af_rvr' ? base + Math.sin(t * 37) * 0.04 : base;
}

/**
 * Gambar monitor penuh. `t` = waktu (detik) untuk animasi gelombang berjalan.
 */
export function drawMonitor(g: CanvasRenderingContext2D, w: number, h: number, s: MonitorState | null, t: number, opts: { compact?: boolean } = {}): void {
  g.save();
  g.fillStyle = C.bg;
  g.fillRect(0, 0, w, h);
  const scale = Math.max(0.6, Math.min(w / 360, h / 200));
  if (!s || !s.live) {
    g.fillStyle = C.dim;
    g.font = `${Math.round(14 * scale)}px system-ui, sans-serif`;
    g.textAlign = 'center';
    g.fillText(s ? 'Monitor belum terpasang' : 'Tidak ada pasien', w / 2, h / 2);
    g.restore();
    return;
  }
  const panelW = opts.compact ? w * 0.38 : w * 0.34;
  const waveW = w - panelW;
  // Grid halus.
  g.strokeStyle = C.grid;
  g.lineWidth = 1;
  for (let x = 0; x < waveW; x += 12 * scale) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, h);
    g.stroke();
  }
  // Gelombang berjalan (sapuan 4 detik).
  const sweep = 4;
  const trace = (y0: number, amp: number, color: string, fn: (tt: number) => number) => {
    g.strokeStyle = color;
    g.lineWidth = 1.6 * scale;
    g.beginPath();
    const n = Math.ceil(waveW / 2);
    const cursor = ((t % sweep) / sweep) * waveW;
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * waveW;
      // Waktu pada titik ini: di belakang kursor = sapuan sekarang, di depan = sapuan lalu.
      const dtBack = x <= cursor ? (cursor - x) / waveW : (cursor + waveW - x) / waveW;
      const tt = t - dtBack * sweep;
      const y = y0 - fn(tt) * amp;
      if (i === 0 || Math.abs(x - cursor) < waveW / n + 0.5) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
    g.fillStyle = C.bg;
    g.fillRect(cursor + 1, 0, 6 * scale, h);
  };
  const rowH = h / 3;
  trace(rowH * 0.7, rowH * 0.45, C.ecg, (tt) => ecgAt(tt, s));
  if (s.spo2 !== null && s.pulse) {
    const period = 60 / Math.max(20, s.hr);
    trace(rowH * 1.85, rowH * 0.35, C.pleth, (tt) => plethBeat(((tt - 0.12) / period) % 1));
  } else {
    g.strokeStyle = C.pleth;
    g.beginPath();
    g.moveTo(0, rowH * 1.85);
    g.lineTo(waveW, rowH * 1.85);
    g.stroke();
  }
  // Napas (kapnografi/impedansi).
  if (s.rr > 0) trace(rowH * 2.75, rowH * 0.22, C.rr, (tt) => Math.max(0, Math.sin((tt * s.rr * Math.PI * 2) / 60)));

  // Panel angka.
  const x0 = waveW + 6 * scale;
  const big = Math.round(30 * scale);
  const small = Math.round(11 * scale);
  const line = (label: string, value: string, color: string, y: number, sizePx = big) => {
    g.fillStyle = color;
    g.font = `600 ${small}px system-ui, sans-serif`;
    g.textAlign = 'left';
    g.fillText(label, x0, y - sizePx * 0.85);
    g.font = `700 ${sizePx}px system-ui, sans-serif`;
    g.fillText(value, x0, y);
  };
  const blink = s.alarm && Math.floor(t * 2) % 2 === 0;
  const hrText = s.rhythm === 'vf' ? 'VF' : s.rhythm === 'asistol' ? '0' : String(s.hr);
  line(s.pulse ? 'HR' : 'HR (tanpa nadi)', hrText, blink ? C.alarm : C.ecg, rowH * 0.62);
  line('SpO₂ %', s.spo2 === null ? '—' : String(s.spo2), blink && (s.spo2 ?? 0) < 90 ? C.alarm : C.pleth, rowH * 1.55);
  line('NIBP', s.sbp === null ? '—/—' : `${s.sbp}/${s.dbp}`, C.bp, rowH * 2.3, Math.round(20 * scale));
  g.fillStyle = C.rr;
  g.font = `600 ${small}px system-ui, sans-serif`;
  g.fillText(`RR ${s.rr}${s.etco2 !== null ? `  EtCO₂ ${s.etco2}` : ''}   T ${s.temp.toFixed(1)}`, x0, rowH * 2.85);
  if (s.alarm) {
    g.strokeStyle = blink ? C.alarm : 'transparent';
    g.lineWidth = 4 * scale;
    g.strokeRect(2, 2, w - 4, h - 4);
  }
  g.restore();
}
