/**
 * Wajah pasien: digambar di kanvas 2D lalu ditempel pada bidang lengkung di depan kepala.
 * Dengan cara ini satu "aset" wajah bisa menampilkan semua ekspresi, kedipan, arah pandang,
 * gerak mulut saat bicara, serta tanda klinis (sklera kuning, mata merah, pucat, berkeringat).
 */
import { CanvasTexture, LinearFilter, Mesh, MeshBasicMaterial, SphereGeometry, SRGBColorSpace } from 'three';
import type { Emotion } from '../../core/types';

export interface FaceLook {
  skin: string;
  hair: string;
  female: boolean;
  /** 0 (muda) .. 1 (lanjut usia): kerut. */
  wrinkles: number;
  glasses: boolean;
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

const SIZE = 256;
const TAU = Math.PI * 2;

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount)));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift: number) => Math.round(((pa >> shift) & 255) * (1 - t) + ((pb >> shift) & 255) * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

export class Face {
  readonly mesh: Mesh;
  readonly state: FaceState = { ...NEUTRAL_FACE };
  private readonly canvas = document.createElement('canvas');
  private readonly g: CanvasRenderingContext2D;
  private readonly texture: CanvasTexture;
  private readonly material: MeshBasicMaterial;
  private readonly geometry: SphereGeometry;
  private lastKey = '';

  /**
   * @param radius jari-jari kepala (bidang wajah sedikit lebih besar agar tidak "z-fight").
   */
  constructor(
    radius: number,
    private readonly look: FaceLook,
  ) {
    this.canvas.width = this.canvas.height = SIZE;
    this.g = this.canvas.getContext('2d')!;
    this.texture = new CanvasTexture(this.canvas);
    this.texture.colorSpace = SRGBColorSpace;
    this.texture.minFilter = LinearFilter;
    this.texture.generateMipmaps = false;
    // Bidang lengkung menghadap +Z: phi ±0,95 rad di sekitar π/2; theta 0,70..2,44 rad.
    this.geometry = new SphereGeometry(radius * 1.012, 28, 22, Math.PI / 2 - 0.95, 1.9, 0.7, 1.74);
    this.material = new MeshBasicMaterial({ map: this.texture, transparent: true, depthWrite: false, toneMapped: false });
    this.mesh = new Mesh(this.geometry, this.material);
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
    this.geometry.dispose();
  }

  private paint(): void {
    const g = this.g;
    const L = this.look;
    const s = this.state;
    g.clearRect(0, 0, SIZE, SIZE);
    const cx = SIZE / 2;
    const eyeY = 122;
    const eyeDX = L.child ? 48 : 46;
    const browColor = shade(L.hair, L.wrinkles > 0.6 ? 0.1 : -0.15);
    const line = shade(L.skin, -0.42);

    // --- Rona pipi (demam) & pucat ----------------------------------------------
    if (L.flush > 0.05) {
      for (const sx of [-1, 1]) {
        const grad = g.createRadialGradient(cx + sx * 62, 160, 2, cx + sx * 62, 160, 32);
        grad.addColorStop(0, `rgba(214,74,56,${0.42 * L.flush})`);
        grad.addColorStop(1, 'rgba(214,74,56,0)');
        g.fillStyle = grad;
        g.fillRect(cx + sx * 62 - 34, 126, 68, 68);
      }
    }

    // --- Kerut usia ------------------------------------------------------------
    if (L.wrinkles > 0.15) {
      g.strokeStyle = line;
      g.globalAlpha = 0.34 * L.wrinkles;
      g.lineWidth = 1.6;
      g.lineCap = 'round';
      for (const y of [58, 68, 78]) {
        g.beginPath();
        g.moveTo(cx - 44, y);
        g.quadraticCurveTo(cx, y - 4 - s.browRaise * 3, cx + 44, y);
        g.stroke();
      }
      for (const sx of [-1, 1]) {
        g.beginPath();
        g.moveTo(cx + sx * 18, 164);
        g.quadraticCurveTo(cx + sx * 36, 182, cx + sx * 34, 204);
        g.stroke();
        for (const dy of [-6, 0, 6]) {
          g.beginPath();
          g.moveTo(cx + sx * 70, eyeY + dy * 0.6);
          g.lineTo(cx + sx * 82, eyeY + dy * 1.6);
          g.stroke();
        }
      }
      g.globalAlpha = 1;
    }

    // --- Mata ------------------------------------------------------------
    const open = Math.max(0.04, Math.min(1.25, s.eyeOpen));
    const sclera = mix(mix('#fbfaf6', '#e6cd58', Math.min(1, L.jaundice * 0.85)), '#e9a39b', Math.min(1, L.redEye * 0.6));
    const rx = L.child ? 25 : 23;
    const ry = (L.child ? 19 : 16) * open;
    for (const sx of [-1, 1]) {
      const ex = cx + sx * eyeDX;
      // Kantung mata (lelah).
      if (L.tired > 0.1) {
        g.strokeStyle = shade(L.skin, -0.3);
        g.globalAlpha = 0.5 * L.tired;
        g.lineWidth = 3;
        g.beginPath();
        g.ellipse(ex, eyeY + 11, rx * 0.9, 8, 0, 0.15 * Math.PI, 0.85 * Math.PI);
        g.stroke();
        g.globalAlpha = 1;
      }
      g.save();
      g.beginPath();
      g.ellipse(ex, eyeY, rx, Math.max(0.6, ry), 0, 0, TAU);
      g.fillStyle = sclera;
      g.fill();
      g.clip();
      // Iris + pupil mengikuti arah pandang.
      const ix = ex + s.gazeX * 9.5;
      const iy = eyeY + s.gazeY * 6.5 + (1 - Math.min(1, open)) * 1.5;
      g.fillStyle = '#3b2415';
      g.beginPath();
      g.arc(ix, iy, 13, 0, TAU);
      g.fill();
      g.fillStyle = '#0d0907';
      g.beginPath();
      g.arc(ix, iy, 6.4, 0, TAU);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.9)';
      g.beginPath();
      g.arc(ix + 4, iy - 4.6, 3, 0, TAU);
      g.fill();
      // Bayangan kelopak atas.
      g.fillStyle = 'rgba(0,0,0,0.16)';
      g.fillRect(ex - rx, eyeY - ry - 2, rx * 2, 5.5);
      g.restore();
      // Garis kelopak / bulu mata.
      g.strokeStyle = L.female ? '#1c1411' : shade(L.skin, -0.55);
      g.lineWidth = L.female ? 3.4 : 2.4;
      g.lineCap = 'round';
      g.beginPath();
      g.ellipse(ex, eyeY, rx, Math.max(0.6, ry), 0, Math.PI * 1.04, Math.PI * 1.96);
      g.stroke();
      if (open < 0.2) {
        // Mata terpejam: satu garis lengkung.
        g.beginPath();
        g.moveTo(ex - rx, eyeY);
        g.quadraticCurveTo(ex, eyeY + 3, ex + rx, eyeY);
        g.stroke();
      }
    }

    // --- Alis ------------------------------------------------------------
    g.strokeStyle = browColor;
    g.lineCap = 'round';
    g.lineWidth = L.female ? 5.5 : 8;
    for (const sx of [-1, 1]) {
      const raise = s.browRaise * 9 + (sx === 1 ? s.browAsym * 8 : -s.browAsym * 1.5);
      const y = 91 - raise - (open > 1 ? (open - 1) * 12 : 0) + (open < 0.7 ? (0.7 - open) * 5 : 0);
      const innerX = cx + sx * 22;
      const outerX = cx + sx * 72;
      // browInner > 0: ujung dalam naik (cemas); < 0: ujung dalam turun (nyeri).
      const innerY = y - s.browInner * 10;
      const outerY = y + 2 + s.browInner * 3;
      g.beginPath();
      g.moveTo(innerX, innerY);
      g.quadraticCurveTo(cx + sx * 46, Math.min(innerY, outerY) - 6, outerX, outerY);
      g.stroke();
    }
    // Kerut di antara alis saat nyeri.
    if (s.browInner < -0.3) {
      g.strokeStyle = line;
      g.globalAlpha = Math.min(0.7, -s.browInner * 0.8);
      g.lineWidth = 1.8;
      for (const sx of [-1, 1]) {
        g.beginPath();
        g.moveTo(cx + sx * 7, 90);
        g.lineTo(cx + sx * 5, 106);
        g.stroke();
      }
      g.globalAlpha = 1;
    }

    // --- Kacamata ------------------------------------------------------------
    if (L.glasses) {
      g.strokeStyle = '#23262b';
      g.lineWidth = 3.2;
      for (const sx of [-1, 1]) {
        g.beginPath();
        g.roundRect(cx + sx * eyeDX - 31, eyeY - 23, 62, 46, 14);
        g.stroke();
        g.fillStyle = 'rgba(210,230,245,0.12)';
        g.fill();
      }
      g.beginPath();
      g.moveTo(cx - eyeDX + 31, eyeY - 3);
      g.quadraticCurveTo(cx, eyeY - 10, cx + eyeDX - 31, eyeY - 3);
      g.stroke();
    }

    // --- Mulut ------------------------------------------------------------
    const my = 202;
    const mo = Math.max(0, Math.min(1, s.mouthOpen));
    const halfW = (L.child ? 23 : 26) * (0.72 + 0.42 * s.mouthWide) * (1 + Math.max(0, s.smile) * 0.2);
    const curve = -s.smile * 11; // negatif = sudut naik (senyum)
    const lip = mix(mix('#b4635a', L.skin, 0.25), '#d8c2b6', Math.min(1, L.pale * 0.75));
    if (mo > 0.06) {
      const h = 4 + mo * 18;
      g.fillStyle = '#4a1716';
      g.beginPath();
      g.moveTo(cx - halfW, my + curve * 0.5);
      g.quadraticCurveTo(cx, my - h * 0.55 + curve * 0.2, cx + halfW, my + curve * 0.5);
      g.quadraticCurveTo(cx, my + h * 1.15 - curve * 0.3, cx - halfW, my + curve * 0.5);
      g.fill();
      if (mo > 0.32) {
        // Gigi atas & lidah.
        g.save();
        g.clip();
        g.fillStyle = '#f5f1e8';
        g.fillRect(cx - halfW, my - h * 0.55 - 2, halfW * 2, h * 0.5 + 2);
        g.fillStyle = '#b7524f';
        g.beginPath();
        g.ellipse(cx, my + h * 0.95, halfW * 0.62, h * 0.45, 0, 0, TAU);
        g.fill();
        g.restore();
      }
      g.strokeStyle = lip;
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(cx - halfW, my + curve * 0.5);
      g.quadraticCurveTo(cx, my - h * 0.55 + curve * 0.2, cx + halfW, my + curve * 0.5);
      g.quadraticCurveTo(cx, my + h * 1.15 - curve * 0.3, cx - halfW, my + curve * 0.5);
      g.stroke();
    } else {
      g.strokeStyle = lip;
      g.lineWidth = 5;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(cx - halfW, my + curve * 0.55);
      g.quadraticCurveTo(cx, my - curve * 0.9, cx + halfW, my + curve * 0.55);
      g.stroke();
      g.strokeStyle = shade(L.skin, -0.5);
      g.lineWidth = 1.2;
      g.globalAlpha = 0.7;
      g.stroke();
      g.globalAlpha = 1;
    }

    // --- Kumis / janggut ------------------------------------------------------------
    if (L.facialHair !== 'none') {
      g.fillStyle = shade(L.hair, 0.05);
      g.globalAlpha = 0.85;
      g.beginPath();
      g.moveTo(cx - 27, 189);
      g.quadraticCurveTo(cx, 176, cx + 27, 189);
      g.quadraticCurveTo(cx, 185, cx - 27, 189);
      g.fill();
      if (L.facialHair === 'janggut') {
        g.globalAlpha = 0.55;
        g.beginPath();
        g.moveTo(cx - 30, 216);
        g.quadraticCurveTo(cx, 262, cx + 30, 216);
        g.quadraticCurveTo(cx, 230, cx - 30, 216);
        g.fill();
      }
      g.globalAlpha = 1;
    }

    // --- Keringat ------------------------------------------------------------
    if (L.sweat > 0.1) {
      g.fillStyle = `rgba(190,225,245,${0.55 + 0.35 * L.sweat})`;
      const drops: [number, number][] = [[cx - 62, 62], [cx + 50, 50], [cx + 80, 112]];
      if (L.sweat > 0.5) drops.push([cx - 32, 44], [cx - 86, 126]);
      for (const [dx, dy] of drops) {
        g.beginPath();
        g.moveTo(dx, dy - 6);
        g.quadraticCurveTo(dx + 4.5, dy + 1, dx, dy + 4);
        g.quadraticCurveTo(dx - 4.5, dy + 1, dx, dy - 6);
        g.fill();
      }
    }
  }
}
