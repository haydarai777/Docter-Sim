/**
 * Wajah pasien: digambar di kanvas 2D lalu ditempel pada bidang yang mengikuti bentuk kepala.
 * Gaya gambar dibuat mendekati wajah manusia: mata almond berkelopak dengan iris & pantulan,
 * alis berbentuk, bibir atas–bawah, bayangan rongga mata/hidung/dagu, kerut usia.
 * Satu "aset" wajah menampilkan semua ekspresi, kedipan, arah pandang, gerak mulut saat bicara,
 * serta tanda klinis (sklera kuning, mata merah, pucat, kemerahan demam, berkeringat).
 */
import { type BufferGeometry, CanvasTexture, LinearFilter, Mesh, MeshStandardMaterial, SRGBColorSpace } from 'three';
import type { FaceMarks } from '../../core/injury';
import type { Emotion } from '../../core/types';
import type { Eyes } from './eyes';
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
  /** Tanda cedera di wajah (racoon eyes, lecet, luka bakar, jelaga, darah). */
  marks?: FaceMarks | null;
  /** Mata berupa bola mata & kelopak 3D (eyes.ts): mata tidak dilukis di kanvas. */
  eyes3d?: boolean;
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
  /** Mata 3D yang ikut digerakkan oleh status wajah (kedip, arah pandang). */
  eyes: Eyes | null = null;

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
    this.eyes?.update(s.eyeOpen, s.gazeX, s.gazeY);
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
    this.eyes?.dispose();
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
    // Dengan relief wajah 3D, bayangan lukisan hanya membantu sedikit (cahaya & AO yang membentuknya).
    const shadeK = L.eyes3d ? 0.4 : 1;
    for (const sx of [-1, 1]) {
      soft(cx + sx * A.eyeDX, eyeY - ry * 0.3, rx * 1.55, ry * 2.3, skinDark(0.2 * shadeK));
      soft(cx + sx * A.noseHalfW * 1.25, (eyeY + A.noseY) / 2, A.noseHalfW * 0.75, (A.noseY - eyeY) * 0.5, skinDark(0.1 * shadeK));
    }
    soft(cx, A.noseY + 3.5 * u, A.noseHalfW * 1.5, 3.2 * u, skinDark(0.2 * shadeK));
    soft(cx, A.mouthY + 9.5 * u, A.mouthHalfW * 0.8, 3.4 * u, skinDark(0.16 * shadeK));

    // --- Rona pipi: sedikit pada semua orang, kuat saat demam ---------------------
    const M = L.marks ?? null;
    const flush = Math.max(L.flush, M?.flush ?? 0);
    const blush = 0.06 + 0.26 * flush - 0.05 * L.pale;
    if (blush > 0.01) {
      for (const sx of [-1, 1]) soft(cx + sx * A.eyeDX * 1.3, (A.noseY + eyeY) / 2 + 7 * u, 24 * u, 17 * u, `rgba(200,84,66,${Math.min(0.4, blush)})`);
      if (flush > 0.2) {
        soft(cx, A.noseY - 6 * u, 13 * u, 15 * u, `rgba(200,84,66,${0.16 * flush})`);
        soft(cx, A.browY - 18 * u, 38 * u, 14 * u, `rgba(200,84,66,${0.1 * flush})`);
      }
    }
    if (M) this.paintMarksUnder(M, soft);

    // --- Kerut usia ------------------------------------------------------------
    if (L.wrinkles > 0.12) {
      g.strokeStyle = skinDark(0.34 * L.wrinkles);
      g.lineWidth = 0.7 * u;
      const lines: [number, number, number][] = [
        [13, -0.95, 0.8],
        [18.5, -0.7, 1.05],
        [24, -0.85, 0.55],
      ];
      for (const [dy, x0, x1] of lines) {
        const y = A.browY - dy * u;
        g.beginPath();
        g.moveTo(cx + x0 * A.eyeDX, y + 1.1 * u);
        g.bezierCurveTo(cx + x0 * A.eyeDX * 0.4, y - 1.6 * u - s.browRaise * 1.8 * u, cx + x1 * A.eyeDX * 0.4, y + 0.6 * u - s.browRaise * 1.8 * u, cx + x1 * A.eyeDX, y + 0.9 * u);
        g.stroke();
      }
      for (const sx of [-1, 1]) {
        // Lipatan nasolabial (pendek, dari cuping hidung ke arah sudut bibir) & kerut sudut mata.
        g.strokeStyle = skinDark(0.3 * L.wrinkles);
        g.beginPath();
        g.moveTo(cx + sx * A.noseHalfW * 1.3, A.noseY - 1.5 * u);
        g.quadraticCurveTo(cx + sx * (A.mouthHalfW * 0.95 + 5 * u), (A.noseY + A.mouthY) / 2 - 1 * u, cx + sx * (A.mouthHalfW + 5.5 * u), A.mouthY - 2.5 * u);
        g.stroke();
        g.strokeStyle = skinDark(0.28 * L.wrinkles);
        for (const k of [-1, 0, 1]) {
          g.beginPath();
          g.moveTo(cx + sx * (A.eyeDX + rx + 2 * u), eyeY + k * 1.5 * u);
          g.lineTo(cx + sx * (A.eyeDX + rx + 6.5 * u), eyeY + k * 3.8 * u);
          g.stroke();
        }
      }
    }

    // --- Mata ------------------------------------------------------------
    const sclera = mix(mix('#f7f5f0', '#e3c84e', Math.min(1, L.jaundice * 0.9)), '#e39a92', Math.min(1, L.redEye * 0.62));
    const irisR = rx * 0.4;
    for (const sx of [-1, 1]) {
      if (L.eyes3d) break;
      const ex = cx + sx * A.eyeDX;
      // Sudut dalam (dekat hidung) sedikit lebih rendah daripada sudut luar.
      const inX = ex - sx * rx;
      const inY = eyeY + ry * 0.1 + A.eyeTilt * rx * 0.6;
      const outX = ex + sx * rx;
      const outY = eyeY - A.eyeTilt * rx;
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

    if (L.eyes3d && L.tired > 0.1) {
      // Kantung mata (lelah/lesu) di bawah mata 3D.
      for (const sx of [-1, 1]) {
        const ex = cx + sx * A.eyeDX;
        g.strokeStyle = skinDark(0.42 * L.tired);
        g.lineWidth = 1.5 * u;
        g.beginPath();
        g.moveTo(ex - sx * rx * 0.75, eyeY + ry * 1.25);
        g.quadraticCurveTo(ex, eyeY + ry * 2.05, ex + sx * rx * 0.8, eyeY + ry * 1.15);
        g.stroke();
      }
    }

    // --- Alis: bentuk terisi, tebal di pangkal dan meruncing ke ekor ----------------
    const browColor = M?.singedBrows ? shade(L.hair, 0.35, 0.45) : shade(L.hair, L.wrinkles > 0.65 ? 0.18 : -0.1, 0.93);
    const thick = (L.child ? 3 : L.female ? 2.9 : 4.3) * u * A.browK;
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
    const halfW = A.mouthHalfW * (0.84 + 0.3 * s.mouthWide) * (1 + Math.max(0, s.smile) * 0.14) * (1 - mo * 0.08) * (1 + 0.14 * (M?.lipSwelling ?? 0));
    const corner = -s.smile * 4.2 * u; // negatif = sudut bibir naik
    const swell = 1 + 0.9 * (M?.lipSwelling ?? 0);
    const upT = (L.child ? 3.1 : L.female ? 4.1 : 3.4) * u * A.lipK * swell;
    const lowT = (L.child ? 4.3 : L.female ? 5.4 : 4.7) * u * A.lipK * swell;
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

    // --- Keringat: butir kecil mengilap di dahi & pelipis ----------------------------
    if (L.sweat > 0.1) {
      const beads: [number, number, number][] = [
        [-1.12, -15, 1],
        [0.72, -21, 0.85],
        [1.5, -4, 0.9],
        [-0.38, -24, 0.7],
        [-1.56, 5, 0.8],
        [0.2, -16, 0.6],
        [1.15, -12, 0.65],
      ];
      const count = L.sweat > 0.5 ? beads.length : 4;
      for (let i = 0; i < count; i++) {
        const [kx, dy, size] = beads[i]!;
        const x = cx + kx * A.eyeDX;
        const y = (kx > 1.3 || kx < -1.3 ? eyeY : A.browY) + dy * u;
        const r = 1.25 * u * size;
        soft(x, y + r * 0.5, r * 1.5, r * 2, `rgba(60,40,30,${0.16 * L.sweat + 0.06})`);
        soft(x, y, r * 1.25, r * 1.7, `rgba(226,240,250,${0.42 + 0.3 * L.sweat})`);
        g.fillStyle = 'rgba(255,255,255,0.9)';
        g.beginPath();
        g.arc(x - r * 0.3, y - r * 0.45, r * 0.32, 0, TAU);
        g.fill();
      }
    }
    if (M) this.paintMarksOver(M, soft);
  }

  /**
   * Tanda cedera di bawah fitur wajah: hematoma periorbita (racoon eyes), lecet, luka bakar.
   * Sisi: `sx` −1 = kanan pasien, +1 = kiri pasien (kanvas menghadap pengamat).
   */
  private paintMarksUnder(M: FaceMarks, soft: (x: number, y: number, rx: number, ry: number, c: string) => void): void {
    const g = this.g;
    const A = this.layout;
    const u = A.pxPerMm;
    const cx = A.cx;
    const eyeY = A.eyeY;
    if (M.racoonEyes) {
      const k = M.racoonEyes;
      for (const sx of [-1, 1]) {
        const ex = cx + sx * A.eyeDX;
        // Ekimosis periorbita: ungu-kebiruan, terbatas tepi orbita (tidak melewati alis).
        soft(ex, eyeY + 1 * u, A.eyeRX * 2.15, A.eyeRY * 3.3, `rgba(74,28,74,${0.55 * k})`);
        soft(ex + sx * 1 * u, eyeY + 3 * u, A.eyeRX * 1.55, A.eyeRY * 2.2, `rgba(52,18,58,${0.5 * k})`);
        soft(ex, eyeY - 3.5 * u, A.eyeRX * 1.5, A.eyeRY * 1.3, `rgba(96,40,90,${0.32 * k})`);
      }
    }
    if (M.burn) {
      const k = M.burn;
      // Eritema & bula luka bakar wajah (dahi, pipi, hidung), tepi tidak rata.
      soft(cx, A.browY - 14 * u, 40 * u, 16 * u, `rgba(196,70,56,${0.5 * k})`);
      for (const sx of [-1, 1]) {
        soft(cx + sx * A.eyeDX * 1.25, (A.noseY + eyeY) / 2 + 6 * u, 22 * u, 20 * u, `rgba(200,74,60,${0.55 * k})`);
        soft(cx + sx * A.eyeDX * 1.45, (A.noseY + eyeY) / 2 + 2 * u, 9 * u, 7 * u, `rgba(150,40,36,${0.35 * k})`);
      }
      soft(cx, A.noseY - 4 * u, 9 * u, 13 * u, `rgba(190,64,52,${0.4 * k})`);
      const blisters: [number, number, number][] = [
        [-1.35, 10, 2.6],
        [1.2, 13, 2.2],
        [-0.5, -20, 2],
        [0.75, -17, 1.6],
        [1.6, 3, 1.8],
      ];
      for (const [kx, dy, r] of blisters) {
        const x = cx + kx * A.eyeDX;
        const y = (dy > 0 ? (A.noseY + eyeY) / 2 : A.browY) + dy * u;
        soft(x, y, r * 1.6 * u, r * 1.4 * u, `rgba(244,222,190,${0.75 * k})`);
        g.fillStyle = `rgba(255,255,255,${0.55 * k})`;
        g.beginPath();
        g.arc(x - r * 0.4 * u, y - r * 0.45 * u, r * 0.35 * u, 0, TAU);
        g.fill();
      }
      // Kulit terkelupas putih di dahi.
      soft(cx - A.eyeDX * 0.3, A.browY - 22 * u, 8 * u, 4 * u, `rgba(240,232,222,${0.6 * k})`);
    }
    if (M.abrasion) {
      const a = M.abrasion;
      const sx = a.side === 'kanan' ? -1 : 1;
      const x = a.spot === 'dahi' ? cx + sx * A.eyeDX * 0.6 : a.spot === 'dagu' ? cx + sx * 4 * u : cx + sx * A.eyeDX * 1.35;
      const y = a.spot === 'dahi' ? A.browY - 16 * u : a.spot === 'dagu' ? A.chinY - 2 * u : (A.noseY + eyeY) / 2 + 9 * u;
      const r = (8 + 8 * a.size) * u;
      soft(x, y, r * 1.3, r, 'rgba(176,70,58,0.5)');
      // Goresan sejajar + bintik perdarahan + krusta.
      g.strokeStyle = 'rgba(140,38,34,0.75)';
      g.lineWidth = 0.7 * u;
      for (let i = -4; i <= 4; i++) {
        g.beginPath();
        g.moveTo(x - r * 0.8, y + i * r * 0.16);
        g.lineTo(x + r * 0.8, y + i * r * 0.16 - r * 0.25);
        g.stroke();
      }
      g.fillStyle = 'rgba(110,16,16,0.85)';
      for (let i = 0; i < 14; i++) {
        const t = (Math.sin(i * 12.9898) * 43758.5453) % 1;
        const t2 = (Math.sin(i * 78.233) * 12543.123) % 1;
        g.beginPath();
        g.arc(x + t * r * 0.8, y + t2 * r * 0.6, 0.45 * u, 0, TAU);
        g.fill();
      }
      soft(x + r * 0.3, y - r * 0.2, r * 0.4, r * 0.3, 'rgba(192,138,69,0.5)');
    }
  }

  /** Tanda di atas fitur wajah: jelaga, darah dari hidung & sudut mulut. */
  private paintMarksOver(M: FaceMarks, soft: (x: number, y: number, rx: number, ry: number, c: string) => void): void {
    const g = this.g;
    const A = this.layout;
    const u = A.pxPerMm;
    const cx = A.cx;
    if (M.soot) {
      const k = M.soot;
      // Jelaga di lubang hidung, sekitar hidung & mulut (tanda trauma inhalasi).
      for (const sx of [-1, 1]) soft(cx + sx * A.noseHalfW * 0.6, A.noseY + 0.5 * u, 3.2 * u, 2.4 * u, `rgba(28,24,22,${0.85 * k})`);
      soft(cx, A.noseY - 2 * u, 9 * u, 8 * u, `rgba(40,34,30,${0.35 * k})`);
      soft(cx, A.mouthY + 1 * u, A.mouthHalfW * 1.25, 6 * u, `rgba(36,30,28,${0.4 * k})`);
      // Coreng jelaga tipis di pipi & dahi (bukan bintik).
      for (let i = 0; i < 9; i++) {
        const t = ((Math.sin(i * 3.7) * 9137.13) % 1) - 0.5;
        const t2 = ((Math.sin(i * 7.1) * 4127.77) % 1) - 0.5;
        soft(cx + t * 50 * u, A.noseY + t2 * 40 * u, (3 + Math.abs(t) * 6) * u, (1.6 + Math.abs(t2) * 3) * u, `rgba(34,30,28,${0.28 * k})`);
      }
    }
    const trickle = (x0: number, y0: number, len: number, w: number, a: number) => {
      // Alur darah menurun, menebal di ujung, mengilap.
      const grad = g.createLinearGradient(x0, y0, x0, y0 + len);
      grad.addColorStop(0, `rgba(118,8,14,${a})`);
      grad.addColorStop(1, `rgba(84,4,8,${a})`);
      g.fillStyle = grad;
      g.beginPath();
      g.moveTo(x0 - w * 0.5, y0);
      g.quadraticCurveTo(x0 - w * 0.8, y0 + len * 0.5, x0 - w * 0.4, y0 + len);
      g.arc(x0, y0 + len, w * 0.65, Math.PI, 0, true);
      g.quadraticCurveTo(x0 + w * 0.7, y0 + len * 0.5, x0 + w * 0.5, y0);
      g.closePath();
      g.fill();
      g.fillStyle = `rgba(255,255,255,${0.35 * a})`;
      g.beginPath();
      g.ellipse(x0 - w * 0.15, y0 + len * 0.45, w * 0.12, len * 0.18, 0, 0, TAU);
      g.fill();
    };
    if (M.bloodNose) {
      const k = M.bloodNose;
      trickle(cx + A.noseHalfW * 0.55, A.noseY + 0.5 * u, (A.mouthY - A.noseY) * 0.85 * k + 2 * u, 2.4 * u, 0.9);
      if (k > 0.5) trickle(cx - A.noseHalfW * 0.55, A.noseY + 0.5 * u, (A.mouthY - A.noseY) * 0.6 * k, 2 * u, 0.85);
      soft(cx, A.mouthY - 2.5 * u, A.mouthHalfW * 0.7, 2.5 * u, `rgba(110,8,12,${0.5 * k})`);
    }
    if (M.bloodMouth) {
      const k = M.bloodMouth;
      // Darah di bibir & mengalir dari sudut mulut ke dagu (hematemesis).
      soft(A.cx, A.mouthY + 1 * u, A.mouthHalfW * 1.05, 4.5 * u, `rgba(120,10,16,${0.55 * k})`);
      trickle(cx - A.mouthHalfW * 0.95, A.mouthY + 0.5 * u, (A.chinY - A.mouthY) * 0.9 * k + 3 * u, 2.6 * u, 0.9);
      trickle(cx + A.mouthHalfW * 0.85, A.mouthY + 1 * u, (A.chinY - A.mouthY) * 0.55 * k, 2.1 * u, 0.82);
    }
  }
}
