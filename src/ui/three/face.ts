/**
 * Wajah pasien: digambar di kanvas 2D lalu ditempel pada bidang yang mengikuti bentuk kepala.
 * Gaya gambar dibuat mendekati wajah manusia: mata almond berkelopak dengan iris & pantulan,
 * alis berbentuk, bibir atas–bawah, bayangan rongga mata/hidung/dagu, kerut usia.
 * Satu "aset" wajah menampilkan semua ekspresi, kedipan, arah pandang, gerak mulut saat bicara,
 * serta tanda klinis (sklera kuning, mata merah, pucat, kemerahan demam, berkeringat).
 */
import { type BufferGeometry, CanvasTexture, LinearFilter, Mesh, MeshStandardMaterial, SRGBColorSpace } from 'three';
import type { Emotion } from '../../core/types';
import type { FaceLayout } from './head';

export interface FaceLook {
  skin: string;
  hair: string;
  female: boolean;
  /** 0 (muda) .. 1 (lanjut usia): kerut. */
  wrinkles: number;
  facialHair: 'none' | 'kumis' | 'janggut';
  /** Tanda klinis 0..1. */
  jaundice: number;
  redEye: number;
  pale: number;
  flush: number;
  sweat: number;
  /** Kantung mata / wajah lelah. */
  tired: number;
  child: boolean;
}

/** Parameter ekspresi yang dianimasikan tiap frame. */
export interface FaceState {
  /** Bukaan mata 0 (tertutup) .. 1 (normal) .. 1.2 (terbelalak). */
  eyeOpen: number;
  /** −1 (alis dalam turun: nyeri/tegang) .. +1 (alis dalam naik: cemas/sedih). */
  browInner: number;
  /** Alis terangkat 0..1 (heran/bingung). */
  browRaise: number;
  /** Asimetri alis (satu alis naik) 0..1. */
  browAsym: number;
  /** −1 (cemberut) .. +1 (senyum). */
  smile: number;
  mouthOpen: number;
  /** 0 (membulat) .. 1 (melebar). */
  mouthWide: number;
  /** Arah pandang −1..1. */
  gazeX: number;
  gazeY: number;
}

export const NEUTRAL_FACE: FaceState = { eyeOpen: 1, browInner: 0, browRaise: 0, browAsym: 0, smile: 0.1, mouthOpen: 0, mouthWide: 0.5, gazeX: 0, gazeY: 0 };

/** Ekspresi dasar per emosi (nilai target; dihaluskan oleh animator). */
export const EMOTION_FACE: Record<Emotion, Partial<FaceState>> = {
  tenang: { eyeOpen: 1, browInner: 0, browRaise: 0, smile: 0.18 },
  santai: { eyeOpen: 0.9, browInner: 0, browRaise: 0.05, smile: 0.3 },
  yakin: { eyeOpen: 1.05, browInner: -0.1, browRaise: 0.15, smile: 0.38 },
  cemas: { eyeOpen: 1.14, browInner: 0.8, browRaise: 0.3, smile: -0.3 },
  kesakitan: { eyeOpen: 0.62, browInner: -0.75, browRaise: 0, smile: -0.55 },
  lesu: { eyeOpen: 0.66, browInner: 0.4, browRaise: 0, smile: -0.32 },
  bingung: { eyeOpen: 1.05, browInner: 0.15, browRaise: 0.45, browAsym: 0.8, smile: -0.12 },
};

const TAU = Math.PI * 2;

/** Uraikan warna "#rrggbb" atau "rgba(r,g,b,a)" (hasil shade/mix bisa dipakai lagi sebagai masukan). */
function rgb(color: string): [number, number, number] {
  if (color.startsWith('#')) {
    const n = parseInt(color.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = color.match(/[\d.]+/g) ?? [];
  return [Number(m[0] ?? 0), Number(m[1] ?? 0), Number(m[2] ?? 0)];
}
function shade(hex: string, amount: number, alpha = 1): string {
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount)));
  const [r, g, b] = rgb(hex);
  return `rgba(${f(r)},${f(g)},${f(b)},${alpha})`;
}
function mix(a: string, b: string, t: number, alpha = 1): string {
  const pa = rgb(a);
  const pb = rgb(b);
  const ch = (i: number) => Math.round(pa[i]! * (1 - t) + pb[i]! * t);
  return `rgba(${ch(0)},${ch(1)},${ch(2)},${alpha})`;
}

export class Face {
  readonly mesh: Mesh;
  readonly state: FaceState = { ...NEUTRAL_FACE };
  private readonly canvas = document.createElement('canvas');
  private readonly g: CanvasRenderingContext2D;
  private readonly texture: CanvasTexture;
  private readonly material: MeshStandardMaterial;
  private lastKey = '';

  constructor(
    geometry: BufferGeometry,
    private readonly layout: FaceLayout,
    private readonly look: FaceLook,
  ) {
    this.canvas.width = this.canvas.height = layout.size;
    this.g = this.canvas.getContext('2d')!;
    this.texture = new CanvasTexture(this.canvas);
    this.texture.colorSpace = SRGBColorSpace;
    this.texture.minFilter = LinearFilter;
    this.texture.generateMipmaps = false;
    // Bidang wajah ikut pencahayaan ruangan agar menyatu dengan kulit kepala.
    this.material = new MeshStandardMaterial({ map: this.texture, transparent: true, depthWrite: false, roughness: 0.6, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    this.mesh = new Mesh(geometry, this.material);
    this.mesh.renderOrder = 2;
    this.draw(true);
  }

  /** Gambar ulang bila ekspresi berubah cukup berarti. */
  draw(force = false): void {
    const s = this.state;
    const q = (v: number, step = 0.04) => Math.round(v / step);
    const key = `${q(s.eyeOpen)}|${q(s.browInner)}|${q(s.browRaise)}|${q(s.browAsym, 0.1)}|${q(s.smile)}|${q(s.mouthOpen, 0.05)}|${q(s.mouthWide, 0.15)}|${q(s.gazeX, 0.08)}|${q(s.gazeY, 0.08)}`;
    if (!force && key === this.lastKey) return;
    this.lastKey = key;
    this.paint();
    this.texture.needsUpdate = true;
  }

  dispose(): void {
    this.texture.dispose();
    this.material.dispose();
  }

  private paint(): void {
    const g = this.g;
    const L = this.look;
    const A = this.layout;
    const s = this.state;
    const S = A.size;
    const u = A.pxPerMm;
    const cx = A.cx;
    g.clearRect(0, 0, S, S);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    const skinDark = (alpha: number, amount = -0.45) => shade(L.skin, amount, alpha);
    const soft = (x: number, y: number, rx: number, ry: number, color: string) => {
      const grad = g.createRadialGradient(x, y, 0, x, y, 1);
      grad.addColorStop(0, color);
      grad.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
      g.save();
      g.translate(x, y);
      g.scale(rx, ry);
      g.translate(-x, -y);
      g.fillStyle = grad;
      g.beginPath();
      g.arc(x, y, 1, 0, TAU);
      g.fill();
      g.restore();
    };

    const eyeY = A.eyeY;
    const rx = A.eyeRX;
    const ry = A.eyeRY;
    const open = Math.max(0, Math.min(1.25, s.eyeOpen));

    // --- Bayangan bentuk wajah: rongga mata, sisi hidung, bawah hidung, bawah bibir ------
    for (const sx of [-1, 1]) {
      soft(cx + sx * A.eyeDX, eyeY - ry * 0.3, rx * 1.55, ry * 2.3, skinDark(0.2));
      soft(cx + sx * A.noseHalfW * 1.25, (eyeY + A.noseY) / 2, A.noseHalfW * 0.75, (A.noseY - eyeY) * 0.5, skinDark(0.1));
    }
    soft(cx, A.noseY + 3.5 * u, A.noseHalfW * 1.5, 3.2 * u, skinDark(0.2));
    soft(cx, A.mouthY + 9.5 * u, A.mouthHalfW * 0.8, 3.4 * u, skinDark(0.16));

    // --- Rona pipi: sedikit pada semua orang, kuat saat demam ---------------------
    const blush = 0.07 + 0.5 * L.flush - 0.05 * L.pale;
    if (blush > 0.01) for (const sx of [-1, 1]) soft(cx + sx * A.eyeDX * 1.28, (A.noseY + eyeY) / 2 + 6 * u, 15 * u, 11 * u, `rgba(206,84,66,${Math.min(0.55, blush)})`);

    // --- Kerut usia ------------------------------------------------------------
    if (L.wrinkles > 0.12) {
      g.strokeStyle = skinDark(0.5 * L.wrinkles);
      g.lineWidth = 0.75 * u;
      for (const dy of [13, 18.5, 24]) {
        g.beginPath();
        g.moveTo(cx - A.eyeDX * 1.15, A.browY - dy * u + 1.2 * u);
        g.quadraticCurveTo(cx, A.browY - dy * u - 1.4 * u - s.browRaise * 1.8 * u, cx + A.eyeDX * 1.15, A.browY - dy * u + 1.2 * u);
        g.stroke();
      }
      for (const sx of [-1, 1]) {
        // Lipatan nasolabial & kerut sudut mata.
        g.beginPath();
        g.moveTo(cx + sx * A.noseHalfW * 1.25, A.noseY - 2 * u);
        g.quadraticCurveTo(cx + sx * (A.mouthHalfW + 6 * u), (A.noseY + A.mouthY) / 2, cx + sx * (A.mouthHalfW + 4.5 * u), A.mouthY + 4 * u);
        g.stroke();
        for (const k of [-1, 0, 1]) {
          g.beginPath();
          g.moveTo(cx + sx * (A.eyeDX + rx + 2 * u), eyeY + k * 1.6 * u);
          g.lineTo(cx + sx * (A.eyeDX + rx + 7 * u), eyeY + k * 4.2 * u);
          g.stroke();
        }
      }
    }

    // --- Mata ------------------------------------------------------------
    const sclera = mix(mix('#f7f5f0', '#e3c84e', Math.min(1, L.jaundice * 0.9)), '#e39a92', Math.min(1, L.redEye * 0.62));
    const irisR = rx * 0.4;
    for (const sx of [-1, 1]) {
      const ex = cx + sx * A.eyeDX;
      // Sudut dalam (dekat hidung) sedikit lebih rendah daripada sudut luar.
      const inX = ex - sx * rx;
      const inY = eyeY + ry * 0.2;
      const outX = ex + sx * rx;
      const outY = eyeY - ry * 0.12;
      const up = ry * Math.min(1.2, open) * 1.28;
      const low = ry * 0.78 * Math.min(1, 0.35 + open * 0.65);
      const lidPath = () => {
        g.beginPath();
        g.moveTo(inX, inY);
        g.bezierCurveTo(ex - sx * rx * 0.5, eyeY - up, ex + sx * rx * 0.45, eyeY - up * 1.04, outX, outY);
        g.bezierCurveTo(ex + sx * rx * 0.5, eyeY + low, ex - sx * rx * 0.4, eyeY + low * 1.08, inX, inY);
        g.closePath();
      };
      // Kantung mata (lelah/lesu).
      if (L.tired > 0.1) {
        g.strokeStyle = skinDark(0.42 * L.tired);
        g.lineWidth = 1.5 * u;
        g.beginPath();
        g.moveTo(ex - sx * rx * 0.75, eyeY + ry * 1.25);
        g.quadraticCurveTo(ex, eyeY + ry * 2.05, ex + sx * rx * 0.8, eyeY + ry * 1.15);
        g.stroke();
      }
      if (open > 0.12) {
        g.save();
        lidPath();
        g.fillStyle = sclera;
        g.fill();
        g.clip();
        // Iris bergradasi + pupil + pantulan cahaya, mengikuti arah pandang.
        const ix = ex + s.gazeX * rx * 0.34;
        const iy = eyeY + s.gazeY * ry * 0.42 - ry * 0.08;
        const iris = g.createRadialGradient(ix, iy, irisR * 0.2, ix, iy, irisR);
        iris.addColorStop(0, '#6b4424');
        iris.addColorStop(0.7, '#3c2413');
        iris.addColorStop(1, '#1d1009');
        g.fillStyle = iris;
        g.beginPath();
        g.arc(ix, iy, irisR, 0, TAU);
        g.fill();
        g.fillStyle = '#080504';
        g.beginPath();
        g.arc(ix, iy, irisR * 0.43, 0, TAU);
        g.fill();
        g.fillStyle = 'rgba(255,255,255,0.92)';
        g.beginPath();
        g.arc(ix + irisR * 0.34, iy - irisR * 0.38, irisR * 0.2, 0, TAU);
        g.fill();
        // Bayangan kelopak atas pada bola mata.
        const lidShade = g.createLinearGradient(0, eyeY - up, 0, eyeY - up + ry * 0.9);
        lidShade.addColorStop(0, 'rgba(30,18,12,0.42)');
        lidShade.addColorStop(1, 'rgba(30,18,12,0)');
        g.fillStyle = lidShade;
        g.fillRect(ex - rx, eyeY - up - 1, rx * 2, ry);
        // Karunkel (sudut dalam kemerahan).
        g.fillStyle = 'rgba(214,150,140,0.75)';
        g.beginPath();
        g.arc(inX + sx * rx * 0.1, inY - ry * 0.02, rx * 0.12, 0, TAU);
        g.fill();
        g.restore();
        // Garis bulu mata atas (lebih tebal pada perempuan) & kelopak bawah.
        g.strokeStyle = L.female ? '#150e0b' : shade(L.skin, -0.72);
        g.lineWidth = (L.female ? 1.55 : 1.1) * u;
        g.beginPath();
        g.moveTo(inX, inY);
        g.bezierCurveTo(ex - sx * rx * 0.5, eyeY - up, ex + sx * rx * 0.45, eyeY - up * 1.04, outX, outY);
        if (L.female) g.lineTo(outX + sx * 1.6 * u, outY - 1.3 * u);
        g.stroke();
        g.strokeStyle = skinDark(0.5, -0.5);
        g.lineWidth = 0.6 * u;
        g.beginPath();
        g.moveTo(outX, outY);
        g.bezierCurveTo(ex + sx * rx * 0.5, eyeY + low, ex - sx * rx * 0.4, eyeY + low * 1.08, inX, inY);
        g.stroke();
        // Lipatan kelopak atas.
        g.strokeStyle = skinDark(0.42, -0.5);
        g.lineWidth = 0.65 * u;
        g.beginPath();
        g.moveTo(inX + sx * rx * 0.18, inY - ry * 0.75);
        g.bezierCurveTo(ex - sx * rx * 0.4, eyeY - up - ry * 0.62, ex + sx * rx * 0.5, eyeY - up - ry * 0.6, outX - sx * rx * 0.04, outY - ry * 0.55);
        g.stroke();
      } else {
        // Mata terpejam: garis bulu mata melengkung ke bawah.
        g.strokeStyle = L.female ? '#150e0b' : shade(L.skin, -0.7);
        g.lineWidth = (L.female ? 1.5 : 1.15) * u;
        g.beginPath();
        g.moveTo(inX, inY);
        g.bezierCurveTo(ex - sx * rx * 0.45, eyeY + ry * 0.62, ex + sx * rx * 0.45, eyeY + ry * 0.6, outX, outY + ry * 0.18);
        g.stroke();
      }
    }

    // --- Alis: bentuk terisi, tebal di pangkal dan meruncing ke ekor ----------------
    const browColor = shade(L.hair, L.wrinkles > 0.65 ? 0.18 : -0.1, 0.93);
    const thick = (L.child ? 3 : L.female ? 2.9 : 4.3) * u;
    for (const sx of [-1, 1]) {
      const ex = cx + sx * A.eyeDX;
      const raise = (s.browRaise * 4.4 + (sx === 1 ? s.browAsym * 3.6 : -s.browAsym * 0.8)) * u;
      const by = A.browY - raise - (open > 1 ? (open - 1) * 5 * u : 0) + (open < 0.7 ? (0.7 - open) * 2.4 * u : 0);
      const x0 = ex - sx * rx * 0.98;
      const y0 = by - s.browInner * 4.2 * u + 0.9 * u;
      const x1 = ex + sx * rx * 0.3;
      const y1 = by - 1.5 * u - Math.max(0, -s.browInner) * 0.6 * u;
      const x2 = ex + sx * rx * 1.22;
      const y2 = by + 1.6 * u + s.browInner * 1.5 * u;
      g.fillStyle = browColor;
      g.beginPath();
      g.moveTo(x0, y0 - thick * 0.5);
      g.quadraticCurveTo(x1, y1 - thick * 0.62, x2, y2);
      g.quadraticCurveTo(x1, y1 + thick * 0.4, x0, y0 + thick * 0.5);
      g.closePath();
      g.fill();
    }
    // Kerut di antara alis saat nyeri/tegang.
    if (s.browInner < -0.3) {
      g.strokeStyle = skinDark(Math.min(0.7, -s.browInner * 0.8));
      g.lineWidth = 0.8 * u;
      for (const sx of [-1, 1]) {
        g.beginPath();
        g.moveTo(cx + sx * 2.6 * u, A.browY - 2.5 * u);
        g.lineTo(cx + sx * 1.8 * u, A.browY + 3.6 * u);
        g.stroke();
      }
    }

    // --- Hidung: lekuk cuping (badan hidung berupa bentuk 3D) -----------------------
    g.strokeStyle = skinDark(0.4);
    g.lineWidth = 0.75 * u;
    for (const sx of [-1, 1]) {
      g.beginPath();
      g.moveTo(cx + sx * A.noseHalfW * 1.02, A.noseY - 5.5 * u);
      g.quadraticCurveTo(cx + sx * A.noseHalfW * 1.34, A.noseY - 1.5 * u, cx + sx * A.noseHalfW * 0.92, A.noseY + 0.8 * u);
      g.stroke();
    }

    // --- Mulut: bibir atas & bawah ------------------------------------------------
    const my = A.mouthY;
    const mo = Math.max(0, Math.min(1, s.mouthOpen));
    const halfW = A.mouthHalfW * (0.84 + 0.3 * s.mouthWide) * (1 + Math.max(0, s.smile) * 0.14) * (1 - mo * 0.08);
    const corner = -s.smile * 4.2 * u; // negatif = sudut bibir naik
    const upT = (L.child ? 3.1 : L.female ? 4.1 : 3.4) * u;
    const lowT = (L.child ? 4.3 : L.female ? 5.4 : 4.7) * u;
    const gap = mo * 9.5 * u;
    const lipBase = mix(mix(L.skin, '#a8484a', L.female ? 0.62 : 0.4), '#cdb8ae', Math.min(1, L.pale * 0.8));
    const lipUpper = mix(mix(L.skin, '#8f3a3e', L.female ? 0.68 : 0.46), '#c2aca2', Math.min(1, L.pale * 0.8));
    const lx = cx - halfW;
    const rxm = cx + halfW;
    const cy = my + corner;
    const lineY = my - corner * 0.35; // lengkung garis bibir di tengah
    if (mo > 0.05) {
      // Rongga mulut, gigi atas, lidah.
      g.fillStyle = '#3a1113';
      g.beginPath();
      g.moveTo(lx, cy);
      g.quadraticCurveTo(cx, lineY - 0.6 * u, rxm, cy);
      g.quadraticCurveTo(cx, lineY + gap * 1.9, lx, cy);
      g.fill();
      g.save();
      g.clip();
      g.fillStyle = '#f2ede2';
      g.fillRect(lx, lineY - 1.5 * u, halfW * 2, Math.min(gap * 0.8, 2.9 * u) + 1.2 * u);
      if (mo > 0.3) {
        g.fillStyle = '#b4504f';
        g.beginPath();
        g.ellipse(cx, lineY + gap * 0.98, halfW * 0.62, gap * 0.48, 0, 0, TAU);
        g.fill();
      }
      g.restore();
    }
    // Bibir atas (busur cupid).
    g.fillStyle = lipUpper;
    g.beginPath();
    g.moveTo(lx, cy);
    g.bezierCurveTo(cx - halfW * 0.62, lineY - upT * 0.5, cx - halfW * 0.34, lineY - upT * 1.12, cx - halfW * 0.14, lineY - upT * 0.98);
    g.quadraticCurveTo(cx, lineY - upT * 0.62, cx + halfW * 0.14, lineY - upT * 0.98);
    g.bezierCurveTo(cx + halfW * 0.34, lineY - upT * 1.12, cx + halfW * 0.62, lineY - upT * 0.5, rxm, cy);
    g.quadraticCurveTo(cx, lineY + 0.5 * u, lx, cy);
    g.fill();
    // Bibir bawah (turun saat mulut terbuka).
    const lowTop = lineY + (mo > 0.05 ? gap * 0.92 : 0.3 * u);
    g.fillStyle = lipBase;
    g.beginPath();
    g.moveTo(lx, cy);
    g.quadraticCurveTo(cx, lowTop + (mo > 0.05 ? gap * 0.9 : 0), rxm, cy);
    g.bezierCurveTo(cx + halfW * 0.6, lowTop + lowT * 1.25 + gap * 0.8, cx - halfW * 0.6, lowTop + lowT * 1.25 + gap * 0.8, lx, cy);
    g.fill();
    // Kilau lembut bibir bawah & garis bibir.
    soft(cx, lowTop + lowT * 0.62 + gap * 0.82, halfW * 0.42, lowT * 0.3, 'rgba(255,255,255,0.2)');
    if (mo <= 0.05) {
      g.strokeStyle = shade(L.skin, -0.68, 0.85);
      g.lineWidth = 0.75 * u;
      g.beginPath();
      g.moveTo(lx, cy);
      g.quadraticCurveTo(cx, lineY + 0.5 * u, rxm, cy);
      g.stroke();
    }
    // Sudut bibir.
    g.fillStyle = skinDark(0.4);
    for (const x of [lx, rxm]) {
      g.beginPath();
      g.arc(x, cy, 0.7 * u, 0, TAU);
      g.fill();
    }

    // --- Kumis / janggut ------------------------------------------------------------
    if (L.facialHair !== 'none') {
      g.fillStyle = shade(L.hair, 0.04, 0.88);
      g.beginPath();
      g.moveTo(cx - A.mouthHalfW * 1.02, my - upT * 0.5 + corner * 0.5);
      g.quadraticCurveTo(cx, my - upT * 2.5, cx + A.mouthHalfW * 1.02, my - upT * 0.5 + corner * 0.5);
      g.quadraticCurveTo(cx, my - upT * 1.15, cx - A.mouthHalfW * 1.02, my - upT * 0.5 + corner * 0.5);
      g.fill();
      if (L.facialHair === 'janggut') {
        g.fillStyle = shade(L.hair, 0.04, 0.55);
        g.beginPath();
        g.moveTo(cx - A.mouthHalfW * 1.25, my + 3 * u);
        g.quadraticCurveTo(cx - A.mouthHalfW * 1.2, A.chinY + 2 * u, cx, A.chinY + 4 * u);
        g.quadraticCurveTo(cx + A.mouthHalfW * 1.2, A.chinY + 2 * u, cx + A.mouthHalfW * 1.25, my + 3 * u);
        g.quadraticCurveTo(cx, my + lowT * 2.6, cx - A.mouthHalfW * 1.25, my + 3 * u);
        g.fill();
      }
    }

    // --- Keringat ------------------------------------------------------------
    if (L.sweat > 0.1) {
      g.fillStyle = `rgba(196,228,246,${0.55 + 0.35 * L.sweat})`;
      const drops: [number, number][] = [
        [cx - A.eyeDX * 1.1, A.browY - 15 * u],
        [cx + A.eyeDX * 0.7, A.browY - 20 * u],
        [cx + A.eyeDX * 1.5, eyeY - 3 * u],
      ];
      if (L.sweat > 0.5) drops.push([cx - A.eyeDX * 0.4, A.browY - 23 * u], [cx - A.eyeDX * 1.55, eyeY + 6 * u]);
      for (const [dx, dy] of drops) {
        g.beginPath();
        g.moveTo(dx, dy - 2.8 * u);
        g.quadraticCurveTo(dx + 2.1 * u, dy + 0.6 * u, dx, dy + 2 * u);
        g.quadraticCurveTo(dx - 2.1 * u, dy + 0.6 * u, dx, dy - 2.8 * u);
        g.fill();
      }
    }
  }
}
