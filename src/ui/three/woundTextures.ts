/**
 * Tekstur luka PROSEDURAL resolusi tinggi (dihitung per piksel di kanvas, tanpa berkas gambar):
 * peta warna + alfa, peta normal (dari peta tinggi: kedalaman luka, tepi yang terangkat, bula),
 * dan peta kekasaran (darah segar & jaringan basah mengilap, darah kering & luka bakar derajat III
 * kusam). Tiap jenis luka digambar menurut ciri klinisnya:
 *
 * - Laserasi: tepi tidak rata & berlecet, jembatan jaringan, lapisan dermis → lemak → otot.
 * - Bacok: panjang & menganga, otot tampak, darah menggenang. Iris: tepi rata, kedua sudut lancip.
 *   Tusuk: celah kecil, satu sudut lancip & satu tumpul. Jahitan: tepi rapat + simpul benang.
 * - Ekskoriasi: dasar dermis merah dengan goresan sejajar arah gesekan, bintik perdarahan, krusta.
 * - Memar/hematoma/jejas: warna menurut umur (merah-ungu → biru → hijau → kuning), berbintik.
 * - Luka bakar: I eritema; II superfisial merah muda basah + bula utuh/pecah; II dalam belang
 *   merah–pucat; III putih seperti kulit/lilin, cokelat, hangus, retak, vena trombosis.
 * - Petekie (bintik 1–2 mm), urtika (bentol pucat dikelilingi kemerahan), ulkus (granulasi,
 *   fibrin, tepi landai, hiperpigmentasi), bekas suntik (titik tusukan + memar sepanjang vena).
 */
import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter, NoColorSpace, SRGBColorSpace } from 'three';
import type { InjurySpec } from '../../core/injury';

export interface WoundTexSet {
  map: CanvasTexture;
  normal: CanvasTexture;
  rough: CanvasTexture;
  /** Ukuran fisik bidang tekstur (meter). */
  widthM: number;
  heightM: number;
}

export interface WoundTexOptions {
  /** Luka sudah dijahit. */
  sutured?: boolean;
  /** Sudah dibersihkan/diirigasi (darah kering hilang). */
  clean?: boolean;
  /** Banyaknya darah segar yang menggenang di dasar luka (0..1). */
  bloodFill?: number;
}

// ---------------------------------------------------------------------------
// Derau ber-seed
// ---------------------------------------------------------------------------

function hash2(x: number, y: number, seed: number): number {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function vnoise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x: number, y: number, seed: number, oct = 4): number {
  let s = 0;
  let amp = 0.5;
  let f = 1;
  let norm = 0;
  for (let i = 0; i < oct; i++) {
    s += amp * vnoise(x * f, y * f, seed + i * 31);
    norm += amp;
    amp *= 0.5;
    f *= 2.03;
  }
  return s / norm;
}

const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const mixc = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
type RGB = [number, number, number];
const hex = (h: string): RGB => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// Palet klinis.
const C = {
  dermis: hex('#e8bfb2'),
  dermisDeep: hex('#d99a8c'),
  fat: hex('#e6cf94'),
  fatDark: hex('#c9a65c'),
  muscle: hex('#7e1a1d'),
  muscleDark: hex('#4e0b0e'),
  bloodFresh: hex('#6e070c'),
  bloodBright: hex('#9b1016'),
  bloodDark: hex('#3e0306'),
  bloodDry: hex('#52150f'),
  abraded: hex('#b0463b'),
  abradedDeep: hex('#8c2c27'),
  erythema: hex('#c9564d'),
  crust: hex('#c08a45'),
  serous: hex('#e3c27a'),
  epiTag: hex('#e7cdbb'),
  bruiseFresh: hex('#7d2a4a'),
  bruiseBlue: hex('#4a3878'),
  bruiseGreen: hex('#7c8746'),
  bruiseYellow: hex('#b9a253'),
  burnI: hex('#d65a4c'),
  burnII: hex('#e46d61'),
  burnIIpale: hex('#f2a397'),
  blister: hex('#f1dcbb'),
  peel: hex('#f1e9df'),
  burnDeepRed: hex('#c53a33'),
  blanched: hex('#ead7cd'),
  waxy: hex('#e9dfca'),
  tan: hex('#c39a66'),
  char: hex('#2a1a12'),
  soot: hex('#2e2a28'),
  petechia: hex('#86182c'),
  purpura: hex('#5e1432'),
  whealPale: hex('#f4d2c5'),
  flare: hex('#d95f58'),
  granulation: hex('#b52f37'),
  fibrin: hex('#dcc066'),
  hyperpig: hex('#5a3826'),
  suture: hex('#1d2758'),
};

interface Px {
  c: RGB;
  a: number;
  h: number;
  r: number;
}

/** Ukuran bidang tekstur (cm) untuk satu luka: luka + tepi untuk memar/olesan darah. */
export function woundBoxCm(spec: InjurySpec): [number, number] {
  const [len, wid] = spec.size;
  switch (spec.kind) {
    case 'laserasi':
    case 'bacok':
    case 'iris':
    case 'tusuk':
      return [Math.max(wid * 4, len * 0.75) + 4, len + 4.5];
    case 'ekskoriasi':
    case 'jejas':
      return [wid + 2, len + 2];
    case 'memar':
    case 'hematoma':
      return [wid * 1.35 + 1, len * 1.35 + 1];
    case 'bekas_suntik':
      return [wid + 2, len + 2];
    case 'ulkus':
      return [wid + 5, len + 5];
    default:
      return [wid * 1.12, len * 1.12];
  }
}

/**
 * Hitung tekstur luka. `seed` membuat bentuk tiap luka unik tetapi stabil.
 */
export function woundTextures(spec: InjurySpec, seed: number, opts: WoundTexOptions = {}): WoundTexSet {
  const [wCm, hCm] = woundBoxCm(spec);
  const maxCm = Math.max(wCm, hCm);
  const N = maxCm > 22 ? 512 : maxCm > 9 ? 384 : 256;
  const W = Math.max(64, Math.round((N * wCm) / maxCm / 8) * 8);
  const H = Math.max(64, Math.round((N * hCm) / maxCm / 8) * 8);
  const pxCm = W / wCm;
  const color = new Uint8ClampedArray(W * H * 4);
  const height = new Float32Array(W * H);
  const rough = new Float32Array(W * H);
  const shader = pixelShader(spec, seed, opts);
  const px: Px = { c: [0, 0, 0], a: 0, h: 0, r: 0.6 };
  for (let j = 0; j < H; j++) {
    const y = (0.5 - (j + 0.5) / H) * hCm;
    for (let i = 0; i < W; i++) {
      const x = ((i + 0.5) / W - 0.5) * wCm;
      px.c = [0, 0, 0];
      px.a = 0;
      px.h = 0;
      px.r = 0.6;
      shader(x, y, px);
      const k = j * W + i;
      color[k * 4] = px.c[0];
      color[k * 4 + 1] = px.c[1];
      color[k * 4 + 2] = px.c[2];
      color[k * 4 + 3] = Math.round(clamp(px.a) * 255);
      height[k] = px.h;
      rough[k] = px.r;
    }
  }
  // Coretan yang lebih mudah dengan kanvas (benang jahitan) digambar di atas hasil per piksel.
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d')!;
  g.putImageData(new ImageData(color, W, H), 0, 0);
  if (opts.sutured && isOpenWound(spec)) drawSutures(g, spec, W, H, pxCm, height, rough, seed);

  // Peta normal dari peta tinggi.
  const nCanvas = document.createElement('canvas');
  nCanvas.width = W;
  nCanvas.height = H;
  const nImg = new ImageData(W, H);
  const strength = 1.35;
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const hl = height[j * W + Math.max(0, i - 1)]!;
      const hr = height[j * W + Math.min(W - 1, i + 1)]!;
      const hu = height[Math.max(0, j - 1) * W + i]!;
      const hd = height[Math.min(H - 1, j + 1) * W + i]!;
      const dx = ((hr - hl) * pxCm) / 2;
      const dy = ((hu - hd) * pxCm) / 2;
      let nx = -dx * strength;
      let ny = -dy * strength;
      let nz = 1;
      const len = Math.hypot(nx, ny, nz);
      nx /= len;
      ny /= len;
      nz /= len;
      const k = (j * W + i) * 4;
      nImg.data[k] = Math.round((nx * 0.5 + 0.5) * 255);
      nImg.data[k + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      nImg.data[k + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      nImg.data[k + 3] = 255;
    }
  }
  nCanvas.getContext('2d')!.putImageData(nImg, 0, 0);
  const rCanvas = document.createElement('canvas');
  rCanvas.width = W;
  rCanvas.height = H;
  const rImg = new ImageData(W, H);
  for (let k = 0; k < W * H; k++) {
    const v = Math.round(clamp(rough[k]!) * 255);
    rImg.data[k * 4] = v;
    rImg.data[k * 4 + 1] = v;
    rImg.data[k * 4 + 2] = v;
    rImg.data[k * 4 + 3] = 255;
  }
  rCanvas.getContext('2d')!.putImageData(rImg, 0, 0);

  const tex = (cv: HTMLCanvasElement, srgb: boolean) => {
    const t = new CanvasTexture(cv);
    t.colorSpace = srgb ? SRGBColorSpace : NoColorSpace;
    t.minFilter = LinearMipmapLinearFilter;
    t.magFilter = LinearFilter;
    t.anisotropy = 4;
    return t;
  };
  return { map: tex(canvas, true), normal: tex(nCanvas, false), rough: tex(rCanvas, false), widthM: wCm / 100, heightM: hCm / 100 };
}

function isOpenWound(spec: InjurySpec): boolean {
  return spec.kind === 'laserasi' || spec.kind === 'bacok' || spec.kind === 'iris' || spec.kind === 'tusuk';
}

// ---------------------------------------------------------------------------
// Penggambar per jenis luka (x, y dalam cm; y = sumbu panjang luka, ke atas)
// ---------------------------------------------------------------------------

type Shader = (x: number, y: number, out: Px) => void;

function pixelShader(spec: InjurySpec, seed: number, opts: WoundTexOptions): Shader {
  switch (spec.kind) {
    case 'laserasi':
    case 'bacok':
    case 'iris':
    case 'tusuk':
      return openWound(spec, seed, opts);
    case 'ekskoriasi':
      return abrasion(spec, seed, 1);
    case 'jejas': {
      const ab = abrasion(spec, seed, 0.55);
      const br = bruise(spec, seed + 7, false);
      return (x, y, out) => {
        br(x, y, out);
        const under = { ...out, c: [...out.c] as RGB };
        ab(x, y, out);
        if (out.a < under.a) {
          out.c = mixc(under.c, out.c, out.a);
          out.a = Math.max(under.a, out.a);
          out.h = Math.min(out.h, under.h);
        }
      };
    }
    case 'memar':
      return bruise(spec, seed, false);
    case 'hematoma':
      return bruise(spec, seed, true);
    case 'luka_bakar':
      return burn(spec, seed);
    case 'petekie':
      return petechiae(spec, seed);
    case 'urtikaria':
      return urticaria(spec, seed);
    case 'ulkus':
      return ulcer(spec, seed);
    case 'bekas_suntik':
      return needleTracks(spec, seed);
    case 'bengkak':
    case 'emfisema':
      return swellingTint(spec, seed);
  }
}

/** Luka terbuka: laserasi, bacok, iris, tusuk. */
function openWound(spec: InjurySpec, seed: number, opts: WoundTexOptions): Shader {
  const [len, wid] = spec.size;
  const kind = spec.kind;
  const a = len / 2;
  const b = Math.max(0.05, (opts.sutured ? 0.06 : wid) / 2);
  const depthScale = spec.depth === 'otot' ? 1 : spec.depth === 'subkutis' ? 0.65 : 0.35;
  const jag = kind === 'laserasi' ? 0.42 : kind === 'bacok' ? 0.14 : 0.04;
  const rimW = kind === 'laserasi' ? 0.38 : kind === 'bacok' ? 0.16 : 0.07;
  const haloW = kind === 'laserasi' ? 1.5 : kind === 'bacok' ? 0.9 : 0.45;
  const fill = opts.sutured ? 0 : (opts.bloodFill ?? (spec.bleeding?.type === 'arteri' ? 0.5 : spec.bleeding ? 0.38 : 0.18));
  // Jembatan jaringan (khas laserasi): 2–3 helai melintang.
  const bridges: number[] = [];
  if (kind === 'laserasi' && !opts.sutured) {
    const n = 2 + Math.floor(hash2(1, 2, seed) * 2);
    for (let i = 0; i < n; i++) bridges.push((hash2(i, 9, seed) - 0.5) * 1.3 * a);
  }
  // Arah olesan darah kering (gravitasi saat cedera).
  const smearDir = (hash2(4, 4, seed) - 0.5) * 0.8;
  const dryBlood = !opts.clean && !opts.sutured;
  const fiber = 0.7 + hash2(5, 5, seed);
  return (x, y, out) => {
    const ay = Math.abs(y);
    // Bentuk ujung: iris/tusuk lancip; laserasi & bacok membulat. Tusuk: satu ujung tumpul.
    let p = kind === 'iris' ? 1.25 : kind === 'tusuk' ? (y > 0 ? 1.1 : 3.2) : kind === 'bacok' ? 2.2 : 2.0;
    if (opts.sutured) p = 1.4;
    const prof = ay < a ? Math.pow(1 - Math.pow(ay / a, p), 0.5) : 0;
    const noise = (fbm(x * 1.7 + 3, y * 1.7, seed) - 0.5) * 2;
    const fine = (vnoise(y * 7.5, x * 2, seed + 3) - 0.5) * 2;
    const w = b * prof + (jag * b + 0.05) * (noise * 0.7 + fine * 0.3) * Math.sqrt(prof);
    const dist = Math.abs(x) - w;
    const nb = fbm(x * 0.9, y * 0.9, seed + 11);
    if (dist < 0 && prof > 0) {
      // --- Di dalam luka -------------------------------------------------------
      const t = clamp(-dist / Math.max(0.02, w));
      let bridged = false;
      for (const yb of bridges) if (Math.abs(y - yb) < 0.07 + 0.06 * vnoise(x * 9, yb, seed)) bridged = true;
      if (opts.sutured) {
        out.c = mixc(C.bloodDry, C.abradedDeep, 0.4);
        out.a = 1;
        out.h = -0.05;
        out.r = 0.5;
        return;
      }
      if (bridged) {
        out.c = mixc(C.dermis, C.dermisDeep, t);
        out.a = 1;
        out.h = -0.15 * depthScale;
        out.r = 0.4;
        return;
      }
      let col: RGB;
      if (t < 0.06) col = mixc(C.bloodDark, C.dermisDeep, t / 0.06);
      else if (t < 0.2) col = mixc(C.dermis, C.dermisDeep, (t - 0.06) / 0.14);
      else if (t < 0.48 || depthScale < 0.9) {
        const lob = vnoise(x * 4.2, y * 4.2, seed + 21);
        col = mixc(C.fat, C.fatDark, smooth(0.4, 0.8, lob));
        if (depthScale < 0.5) col = mixc(C.dermisDeep, C.abradedDeep, (t - 0.2) / 0.8);
      } else {
        const stri = 0.5 + 0.5 * Math.sin((x * Math.cos(fiber) + y * Math.sin(fiber)) * 26 + vnoise(x * 3, y * 3, seed) * 4);
        col = mixc(C.muscle, C.muscleDark, 0.25 + 0.45 * stri);
      }
      let h = -Math.pow(t, 0.75) * depthScale;
      let r = 0.32;
      // Darah segar menggenang di dasar luka.
      if (t > 1 - fill) {
        const k = smooth(1 - fill, 1 - fill + 0.12, t);
        const shade = vnoise(x * 2.2, y * 2.2, seed + 40);
        col = mixc(col, mixc(spec.bleeding?.type === 'arteri' ? C.bloodBright : C.bloodFresh, C.bloodDark, shade * 0.6), k);
        h = Math.max(h, -(1 - fill) * depthScale);
        r = 0.32 - 0.22 * k;
      }
      out.c = col;
      out.a = 1;
      out.h = h;
      out.r = r;
      return;
    }
    // --- Tepi & sekitar luka ---------------------------------------------------------
    const near = prof > 0 ? dist : Math.hypot(Math.max(0, Math.abs(x) - 0.05), ay - a);
    const dd = Math.max(0, near);
    let c: RGB = C.erythema;
    let al = 0;
    let h = 0;
    let r = 0.62;
    if (dd < rimW) {
      const k = 1 - dd / rimW;
      c = kind === 'laserasi' ? mixc(C.abraded, C.abradedDeep, nb) : mixc(C.erythema, C.dermisDeep, 0.5);
      al = (kind === 'laserasi' ? 0.9 : 0.55) * k;
      h = 0.1 * k * (opts.sutured ? 1.4 : 1);
      r = 0.45;
    }
    if (dd < haloW) {
      const k = (1 - dd / haloW) * (0.55 + 0.45 * nb);
      const halo = kind === 'laserasi' && nb > 0.55 ? mixc(C.bruiseFresh, C.erythema, 0.4) : C.erythema;
      const ha = 0.28 * k * (opts.sutured ? 0.7 : 1);
      if (ha > al) {
        c = al > 0 ? mixc(halo, c, al / ha) : halo;
        al = Math.max(al, ha);
      }
    }
    // Olesan & tetesan darah kering di sekitar luka.
    if (dryBlood) {
      const sx = x - smearDir * (y + a);
      const m = fbm(sx * 0.55 + 7, y * 0.38, seed + 60);
      const reach = Math.exp(-dd / 2.2) * (y < 0.5 * a ? 1 : 0.55);
      const v = m * reach;
      if (v > 0.36) {
        const k = smooth(0.36, 0.48, v);
        const dc = mixc(C.bloodDry, C.bloodDark, vnoise(x * 3, y * 3, seed + 61) * 0.7);
        c = mixc(c, dc, k);
        al = Math.max(al, 0.82 * k);
        r = 0.55 - 0.15 * k;
        h = Math.max(h, 0.02 * k);
      }
    }
    out.c = c;
    out.a = al;
    out.h = h;
    out.r = r;
  };
}

/** Benang jahitan (simple interrupted) dengan simpul di satu sisi. */
function drawSutures(g: CanvasRenderingContext2D, spec: InjurySpec, W: number, H: number, pxCm: number, height: Float32Array, rough: Float32Array, seed: number): void {
  const len = spec.size[0];
  const n = Math.max(2, Math.round(len / 0.75));
  const step = len / n;
  const cx = W / 2;
  const cy = H / 2;
  g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const yc = (-len / 2 + step * (i + 0.5)) * pxCm;
    const tilt = (hash2(i, 3, seed) - 0.5) * 0.12 * pxCm;
    const half = 0.38 * pxCm;
    // Bekas tusukan jarum di kedua sisi.
    g.fillStyle = 'rgba(110,30,30,0.85)';
    for (const sx of [-1, 1]) {
      g.beginPath();
      g.arc(cx + sx * half, cy - yc + sx * tilt, 0.06 * pxCm, 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = `rgb(${C.suture.join(',')})`;
    g.lineWidth = Math.max(1.4, 0.07 * pxCm);
    g.beginPath();
    g.moveTo(cx - half, cy - yc - tilt);
    g.lineTo(cx + half, cy - yc + tilt);
    g.stroke();
    // Simpul + ujung benang.
    g.beginPath();
    g.arc(cx + half + 0.05 * pxCm, cy - yc + tilt, 0.09 * pxCm, 0, Math.PI * 2);
    g.fillStyle = `rgb(${C.suture.join(',')})`;
    g.fill();
    g.lineWidth = Math.max(1, 0.045 * pxCm);
    g.beginPath();
    g.moveTo(cx + half + 0.08 * pxCm, cy - yc + tilt);
    g.lineTo(cx + half + 0.32 * pxCm, cy - yc + tilt - 0.18 * pxCm);
    g.moveTo(cx + half + 0.08 * pxCm, cy - yc + tilt);
    g.lineTo(cx + half + 0.3 * pxCm, cy - yc + tilt + 0.16 * pxCm);
    g.stroke();
    // Benang sedikit menonjol (normal map).
    const row = Math.round(cy - yc);
    for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) {
      for (let dy = -1; dy <= 1; dy++) {
        const k = (row + dy) * W + x;
        if (k >= 0 && k < height.length) {
          height[k] = Math.max(height[k]!, 0.08);
          rough[k] = 0.3;
        }
      }
    }
  }
}

/** Luka lecet: dermis terbuka dengan goresan sejajar arah gesekan. */
function abrasion(spec: InjurySpec, seed: number, strength: number): Shader {
  const [len, wid] = spec.size;
  const a = len / 2;
  const b = wid / 2;
  return (x, y, out) => {
    const e = Math.hypot(x / b, y / a);
    const edgeN = (fbm(x * 0.9, y * 0.9, seed) - 0.5) * 0.7 + (vnoise(x * 4, y * 0.8, seed + 2) - 0.5) * 0.3;
    const m = smooth(1.05, 0.7, e + edgeN);
    if (m <= 0.001) return;
    const streak = vnoise(x * 6.5, y * 0.55, seed + 5);
    const streak2 = vnoise(x * 13, y * 1.1, seed + 6);
    let c = mixc(C.abraded, C.abradedDeep, smooth(0.3, 0.75, streak * 0.7 + streak2 * 0.3));
    let r = 0.42;
    let h = -0.06 - 0.05 * streak;
    // Bintik perdarahan (punctate) & krusta serosa.
    const cell = 0.22;
    const gx = Math.floor(x / cell);
    const gy = Math.floor(y / cell);
    const hr = hash2(gx, gy, seed + 9);
    if (hr > 0.62) {
      const ox = (hash2(gx, gy, seed + 10) + gx) * cell;
      const oy = (hash2(gx, gy, seed + 11) + gy) * cell;
      const d = Math.hypot(x - ox, y - oy);
      if (d < 0.05 + 0.05 * hr) {
        c = mixc(C.bloodBright, C.bloodDark, 0.4);
        r = 0.14;
        h += 0.02;
      }
    }
    const crust = fbm(x * 1.6 + 9, y * 1.6, seed + 12);
    if (crust > 0.62) c = mixc(c, mixc(C.crust, C.serous, vnoise(x * 5, y * 5, seed) ), smooth(0.62, 0.7, crust) * 0.85);
    // Kulit ari yang terkelupas menumpuk di ujung akhir gesekan.
    if (y > a * 0.55 && streak2 > 0.68) {
      c = mixc(c, C.epiTag, 0.75);
      h += 0.05;
      r = 0.6;
    }
    out.c = c;
    out.a = m * 0.95 * strength + (1 - strength) * 0;
    out.h = h * m;
    out.r = r;
  };
}

/** Memar/hematoma: warna menurut umur memar. */
function bruise(spec: InjurySpec, seed: number, bump: boolean): Shader {
  const [len, wid] = spec.size;
  const a = len / 2;
  const b = wid / 2;
  const age = spec.ageHours ?? 2;
  return (x, y, out) => {
    const e = Math.hypot(x / b, y / a);
    const n = fbm(x * 0.55, y * 0.55, seed);
    const m = smooth(1.2, 0.35, e + (n - 0.5) * 0.7);
    if (m <= 0.002) return;
    const core = smooth(0.85, 0.1, e + (n - 0.5) * 0.5);
    const mott = 0.82 + 0.36 * fbm(x * 2.6, y * 2.6, seed + 4);
    let c: RGB;
    if (age < 12) c = mixc(C.erythema, C.bruiseFresh, core);
    else if (age < 48) c = mixc(C.bruiseFresh, C.bruiseBlue, core);
    else if (age < 120) c = mixc(C.bruiseGreen, C.bruiseBlue, core * 0.8);
    else c = mixc(C.bruiseYellow, C.bruiseGreen, core * 0.4);
    c = [c[0] * mott, c[1] * mott, c[2] * mott];
    // Bintik kapiler pecah pada memar segar.
    if (age < 24 && vnoise(x * 9, y * 9, seed + 8) > 0.78) c = mixc(c, C.purpura, 0.5);
    out.c = c;
    out.a = m * (0.42 + 0.33 * core);
    out.h = bump ? 0.55 * Math.pow(clamp(1 - e), 1.6) : 0.03 * core;
    out.r = bump ? 0.42 : 0.6;
  };
}

/** Luka bakar menurut derajat. */
function burn(spec: InjurySpec, seed: number): Shader {
  const [len, wid] = spec.size;
  const a = len / 2;
  const b = wid / 2;
  const deg = spec.burn ?? 'II_superfisial';
  const circ = !!spec.circumferential;
  return (x, y, out) => {
    // Luka bakar sirkumferensial menutup selebar bidang; tepi atas/bawah tidak rata.
    const e = circ ? Math.abs(y) / a : Math.hypot(x / b, y / a);
    const n = fbm(x * 0.28 + 5, y * 0.28, seed);
    const edge = e + (n - 0.5) * 0.5;
    const m = smooth(1.08, 0.94, edge);
    const margin = smooth(1.28, 1.02, edge) * (1 - m);
    if (m <= 0.001 && margin <= 0.001) return;
    if (m <= 0.001) {
      // Zona hiperemis di tepi luka bakar.
      out.c = C.burnI;
      out.a = 0.32 * margin;
      out.r = 0.55;
      return;
    }
    // Variasi frekuensi rendah (belang besar) + tekstur halus (permukaan kulit).
    const low = fbm(x * 0.32 + 1, y * 0.32, seed + 3);
    const fine = vnoise(x * 6, y * 6, seed + 4);
    let c: RGB;
    let al = m;
    let h = (fine - 0.5) * 0.02;
    let r = 0.5;
    if (deg === 'I') {
      c = mixc(C.burnI, C.erythema, low);
      al = 0.42 * m;
    } else if (deg === 'II_superfisial') {
      // Dasar merah muda-merah, lembap mengilap, bula utuh berisi cairan & sebagian pecah.
      c = mixc(hex('#df6f62'), hex('#ef978a'), smooth(0.3, 0.7, low));
      c = mixc(c, hex('#c9483f'), 0.25 * fine);
      r = 0.16;
      h -= 0.03;
    } else if (deg === 'II_dalam') {
      // Belang merah tua dan pucat (kapiler trombosis), kurang lembap, kulit ari mengelupas.
      const pale = smooth(0.5, 0.68, low);
      c = mixc(hex('#c14f46'), hex('#e3cbbd'), pale * 0.85);
      c = mixc(c, hex('#8f2a27'), 0.3 * smooth(0.6, 0.85, fine) * (1 - pale));
      r = 0.32 + 0.2 * pale;
      h -= 0.04;
      // Epidermis terkelupas (lembar putih keabu-abuan berkerut) di sebagian area.
      const slough = fbm(x * 0.6 + 9, y * 0.6, seed + 12);
      if (slough > 0.62) {
        const k = smooth(0.62, 0.66, slough);
        c = mixc(c, hex('#ece4da'), 0.85 * k);
        h += 0.05 * k * (0.6 + 0.4 * vnoise(x * 14, y * 3, seed));
        r = 0.6;
      }
    } else {
      // Derajat III: kering, keras seperti kulit samak/lilin (putih–cokelat), sebagian hangus,
      // retakan & vena trombosis di bawah eskar.
      c = mixc(hex('#e2d4b9'), hex('#b48a56'), smooth(0.35, 0.7, low));
      const charZone = fbm(x * 0.22 + 21, y * 0.22, seed + 30);
      if (charZone > 0.62) c = mixc(c, C.char, smooth(0.62, 0.72, charZone));
      const crack = Math.abs(fbm(x * 0.55, y * 0.55, seed + 31) - 0.5);
      if (crack < 0.012) {
        c = mixc(c, hex('#4a2a1a'), 0.8);
        h = -0.12;
      }
      const vein = Math.abs(vnoise(x * 0.5 + y * 0.18, y * 0.1, seed + 32) - 0.5);
      if (vein < 0.01 && charZone < 0.6) c = mixc(c, hex('#4e1d1d'), 0.65);
      c = mixc(c, mixc(c, [0, 0, 0], 0.15), fine);
      r = 0.88;
      h += 0.03 * fine;
    }
    // Bula (luka bakar derajat II superfisial terutama): sedikit, besar, bentuk tidak sempurna.
    if (deg === 'II_superfisial' || deg === 'II_dalam') {
      const deep = deg === 'II_dalam';
      const cell = deep ? 4.2 : 3;
      const gx = Math.floor(x / cell);
      const gy = Math.floor(y / cell);
      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const cxI = gx + ox;
          const cyI = gy + oy;
          if (hash2(cxI, cyI, seed + 20) < (deep ? 0.78 : 0.45)) continue;
          const bx = (cxI + hash2(cxI, cyI, seed + 21)) * cell;
          const by = (cyI + hash2(cxI, cyI, seed + 22)) * cell;
          const rad = (0.5 + 1.3 * hash2(cxI, cyI, seed + 23)) * (deep ? 0.75 : 1);
          const d = (Math.hypot(x - bx, (y - by) * 1.15) + (vnoise(x * 3, y * 3, seed + cxI) - 0.5) * 0.35) / rad;
          if (d > 1.12) continue;
          const intact = !deep && hash2(cxI, cyI, seed + 24) > 0.3;
          if (intact && d < 1) {
            const dome = Math.sqrt(1 - d * d);
            c = mixc(mixc(c, C.blister, 0.62), [255, 248, 235], dome * dome * 0.3);
            h = 0.5 * dome * rad;
            r = 0.06;
          } else if (!intact) {
            if (d < 0.88) {
              c = mixc(hex('#e57c70'), hex('#c4463e'), vnoise(x * 5, y * 5, seed) * 0.5);
              r = 0.12;
              h = -0.04;
            } else {
              // Sisa atap bula terkelupas: putih keabuan, berkerut.
              c = mixc(C.peel, hex('#cfc5ba'), vnoise(x * 12, y * 12, seed));
              h = 0.06;
              r = 0.55;
            }
          }
        }
      }
    }
    out.c = c;
    out.a = Math.max(al, 0.32 * margin);
    out.h = h;
    out.r = r;
  };
}

/** Petekie: bintik merah-ungu 1–2 mm yang tidak memucat, sesekali purpura. */
function petechiae(spec: InjurySpec, seed: number): Shader {
  const [len] = spec.size;
  const a = len / 2;
  return (x, y, out) => {
    const cell = 0.42;
    const gx = Math.floor(x / cell);
    const gy = Math.floor(y / cell);
    // Lebih padat di distal (y negatif) & memudar di tepi.
    const density = 0.32 + 0.3 * smooth(a, -a, y) - 0.25 * smooth(0.7 * a, a, Math.abs(y));
    for (let ox = 0; ox <= 1; ox++) {
      for (let oy = 0; oy <= 1; oy++) {
        const cxI = gx + ox - 0;
        const cyI = gy + oy - 0;
        const p = hash2(cxI, cyI, seed);
        if (p > density) continue;
        const px = (cxI + hash2(cxI, cyI, seed + 1) - 0.5) * cell;
        const py = (cyI + hash2(cxI, cyI, seed + 2) - 0.5) * cell;
        const big = hash2(cxI, cyI, seed + 3) > 0.96;
        const rad = big ? 0.22 + 0.1 * hash2(cxI, cyI, seed + 4) : 0.05 + 0.06 * hash2(cxI, cyI, seed + 4);
        const d = Math.hypot(x - px, y - py);
        if (d < rad) {
          out.c = big ? C.purpura : mixc(C.petechia, C.purpura, hash2(cxI, cyI, seed + 5) * 0.5);
          out.a = 0.92 * smooth(rad, rad * 0.55, d);
          out.r = 0.6;
          return;
        }
      }
    }
  };
}

/** Urtika: bentol pucat menonjol dengan tepi kemerahan, bentuk serpiginosa. */
function urticaria(spec: InjurySpec, seed: number): Shader {
  const [len, wid] = spec.size;
  const circ = !!spec.circumferential;
  return (x, y, out) => {
    const e = circ ? Math.abs(y) / (len / 2) : Math.hypot(x / (wid / 2), y / (len / 2));
    const fade = smooth(1.05, 0.75, e);
    if (fade <= 0) return;
    const f = fbm(x * 0.42 + 2, y * 0.42, seed, 4);
    if (f > 0.585) {
      const k = smooth(0.585, 0.63, f);
      out.c = mixc(C.flare, C.whealPale, k);
      out.a = (0.45 + 0.25 * k) * fade;
      out.h = 0.32 * k;
      out.r = 0.5;
    } else if (f > 0.5) {
      const k = smooth(0.5, 0.585, f);
      out.c = C.flare;
      out.a = 0.38 * k * fade;
      out.h = 0.06 * k;
      out.r = 0.55;
    }
  };
}

/** Ulkus tungkai: dasar granulasi + fibrin, tepi landai, hiperpigmentasi sekitar. */
function ulcer(spec: InjurySpec, seed: number): Shader {
  const [len, wid] = spec.size;
  const a = len / 2;
  const b = wid / 2;
  return (x, y, out) => {
    const e = Math.hypot(x / b, y / a) + (fbm(x * 0.8, y * 0.8, seed) - 0.5) * 0.35;
    if (e < 1) {
      const gran = vnoise(x * 10, y * 10, seed + 3);
      let c = mixc(C.granulation, hex('#8e1c26'), gran * 0.6);
      let h = -0.35 * (1 - e * e) + 0.04 * gran;
      const fib = fbm(x * 1.2 + 4, y * 1.2, seed + 4);
      if (fib > 0.56) {
        c = mixc(c, C.fibrin, smooth(0.56, 0.64, fib));
        h += 0.03;
      }
      out.c = c;
      out.a = 1;
      out.h = h;
      out.r = 0.18;
      return;
    }
    if (e < 1.18) {
      out.c = mixc(hex('#e6c1b4'), C.erythema, 0.3);
      out.a = 0.85;
      out.h = 0.08;
      out.r = 0.45;
      return;
    }
    const ring = smooth(2.2, 1.15, e) * (0.6 + 0.4 * fbm(x * 1.5, y * 1.5, seed + 6));
    if (ring > 0.01) {
      out.c = C.hyperpig;
      out.a = 0.55 * ring;
      out.r = 0.65;
    }
  };
}

/** Bekas suntikan berulang sepanjang vena: titik tusukan + memar beragam umur + jejak gelap. */
function needleTracks(spec: InjurySpec, seed: number): Shader {
  const [len] = spec.size;
  const marks: { x: number; y: number; r: number; age: number }[] = [];
  const n = 9 + Math.floor(hash2(1, 1, seed) * 6);
  for (let i = 0; i < n; i++) {
    const y = (hash2(i, 2, seed) - 0.5) * len;
    const x = Math.sin(y * 0.6 + hash2(0, 3, seed) * 3) * 0.25 + (hash2(i, 4, seed) - 0.5) * 0.25;
    marks.push({ x, y, r: 0.2 + 0.35 * hash2(i, 5, seed), age: hash2(i, 6, seed) * 200 });
  }
  return (x, y, out) => {
    const vx = Math.sin(y * 0.6 + hash2(0, 3, seed) * 3) * 0.25;
    const track = smooth(0.22, 0.05, Math.abs(x - vx)) * smooth(len / 2 + 0.5, len / 2 - 0.5, Math.abs(y));
    if (track > 0) {
      out.c = hex('#6b4a3c');
      out.a = 0.3 * track;
      out.r = 0.6;
    }
    for (const m of marks) {
      const d = Math.hypot(x - m.x, y - m.y);
      if (d < 0.045) {
        out.c = hex('#2e0b0c');
        out.a = 1;
        out.h = -0.03;
        return;
      }
      if (d < m.r) {
        const k = 1 - d / m.r;
        const c = m.age < 24 ? C.bruiseFresh : m.age < 90 ? C.bruiseBlue : C.bruiseGreen;
        const a = 0.45 * k;
        if (a > out.a) {
          out.c = out.a > 0 ? mixc(out.c, c, k) : c;
          out.a = a;
        }
      }
    }
  };
}

/** Bengkak: hanya rona kemerahan & kilap tipis (bentuknya dari deformasi geometri). */
function swellingTint(spec: InjurySpec, seed: number): Shader {
  const [len, wid] = spec.size;
  const tint = spec.kind === 'bengkak' ? 0.16 : 0.05;
  return (x, y, out) => {
    const e = Math.hypot(x / (wid / 2), y / (len / 2));
    const m = smooth(1.05, 0.2, e + (fbm(x * 0.6, y * 0.6, seed) - 0.5) * 0.4);
    if (m <= 0) return;
    out.c = C.erythema;
    out.a = tint * m;
    out.r = 0.42;
  };
}

// ---------------------------------------------------------------------------
// Tekstur darah segar (lapisan basah, aliran) & rembesan pada kain/kasa
// ---------------------------------------------------------------------------

export interface BloodTex {
  map: CanvasTexture;
  widthM: number;
  heightM: number;
}

/**
 * Lapisan darah: 'film' = olesan basah melingkar di sekitar luka (muncul dari tengah ke luar),
 * 'run' = aliran darah dari atas (luka) ke bawah (arah gravitasi) — muncul dari atas ke bawah,
 * 'soak' = rembesan darah pada kain (pakaian/kasa/perlak): tepi menyerap lebih gelap.
 */
export function bloodTexture(kind: 'film' | 'run' | 'soak', seed: number, wCm: number, hCm: number, arterial = false): BloodTex {
  const N = kind === 'soak' ? 256 : 256;
  const W = kind === 'run' ? 128 : N;
  const H = N;
  const img = new ImageData(W, H);
  const fresh = arterial ? C.bloodBright : C.bloodFresh;
  // Aliran: beberapa alur berkelok dari atas ke bawah.
  const streams: { x0: number; amp: number; f: number; ph: number; w: number; end: number }[] = [];
  if (kind === 'run') {
    const n = 2 + Math.floor(hash2(1, 1, seed) * 3);
    for (let i = 0; i < n; i++) streams.push({ x0: (hash2(i, 2, seed) - 0.5) * 0.45, amp: 0.04 + 0.08 * hash2(i, 3, seed), f: 4 + 6 * hash2(i, 4, seed), ph: hash2(i, 5, seed) * 6, w: 0.05 + 0.05 * hash2(i, 6, seed), end: 0.55 + 0.45 * hash2(i, 7, seed) });
  }
  for (let j = 0; j < H; j++) {
    const v = 1 - (j + 0.5) / H; // 1 = atas
    for (let i = 0; i < W; i++) {
      const u = (i + 0.5) / W;
      let a = 0;
      let c: RGB = fresh;
      if (kind === 'run') {
        const down = 1 - v; // 0 di luka (atas) → 1 di bawah
        for (const s of streams) {
          if (down > s.end) continue;
          const cx = 0.5 + s.x0 + Math.sin(down * s.f + s.ph) * s.amp + (vnoise(down * 9, s.ph, seed) - 0.5) * 0.04;
          const taper = s.w * (1 - 0.55 * down / s.end);
          // Tetesan menggumpal di ujung aliran.
          const bulb = Math.max(0, 1 - Math.abs(down - s.end + 0.03) / 0.035) * 0.035;
          const d = Math.abs(u - cx) - taper - bulb;
          if (d < 0) a = Math.max(a, 0.95);
          else if (d < 0.02) a = Math.max(a, 0.95 * (1 - d / 0.02));
        }
        // Genangan kecil di pangkal (dekat luka).
        const pool = Math.hypot((u - 0.5) * 1.1, (v - 0.97) * 3.2);
        if (pool < 0.3) a = Math.max(a, 0.9 * smooth(0.3, 0.2, pool));
        c = mixc(fresh, C.bloodDark, vnoise(u * 8, v * 8, seed) * 0.5);
      } else {
        const x = u - 0.5;
        const y = v - 0.5;
        const n = fbm(u * 4.5 + 1, v * 4.5, seed);
        const rr = Math.hypot(x, y) * 2 + (n - 0.5) * 0.55;
        if (rr < 1) {
          const edge = smooth(1, 0.82, rr);
          a = edge * (kind === 'soak' ? 0.86 : 0.93);
          if (kind === 'film') {
            // Darah segar berupa olesan & genangan tebal tidak beraturan di sekitar luka (pekat, mengilap);
            // bagian tengah (luka) dibiarkan agar dasar luka tetap terlihat.
            // Lubang mengikuti celah luka (memanjang searah sumbu v) agar dasar luka tetap terlihat.
            const eh = Math.hypot(x / 0.1, y / 0.36) + (vnoise(u * 9, v * 9, seed + 5) - 0.5) * 0.35;
            const hole = smooth(0.8, 1.15, eh);
            // Darah lebih banyak di sisi hilir (bawah tekstur = arah aliran) & di sepanjang tepi luka.
            const along = Math.exp(-((x / 0.2) ** 2)) * smooth(0.48, 0.1, Math.abs(y));
            const field = fbm(u * 5 + 3, v * 4, seed + 8) + 0.22 * along + 0.16 * smooth(0.1, -0.4, y) - 0.12 * smooth(0.1, 0.45, y);
            const patch = smooth(0.47, 0.52, field);
            a = edge * patch * hole * 0.97;
          }
          const thick = smooth(0.95, 0.2, rr);
          c = kind === 'soak' ? mixc(hex('#6a1316'), hex('#33060a'), clamp(thick * 0.7 + (vnoise(u * 10, v * 10, seed + 3) - 0.5) * 0.4)) : mixc(fresh, C.bloodDark, thick * 0.55 * vnoise(u * 6, v * 6, seed + 2));
          if (kind === 'soak') {
            if (rr > 0.84) c = hex('#3f080b'); // tepi rembesan lebih pekat (efek sumbu)
            a *= 0.72 + 0.28 * fbm(u * 8, v * 8, seed + 4);
          }
        }
      }
      const k = (j * W + i) * 4;
      img.data[k] = c[0];
      img.data[k + 1] = c[1];
      img.data[k + 2] = c[2];
      img.data[k + 3] = Math.round(a * 255);
    }
  }
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  canvas.getContext('2d')!.putImageData(img, 0, 0);
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  map.anisotropy = 4;
  return { map, widthM: wCm / 100, heightM: hCm / 100 };
}

/** Tekstur kasa (anyaman) untuk balutan. */
export function gauzeTexture(): CanvasTexture {
  const S = 128;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const g = canvas.getContext('2d')!;
  g.fillStyle = '#f4f2ec';
  g.fillRect(0, 0, S, S);
  g.strokeStyle = 'rgba(200,196,186,0.7)';
  g.lineWidth = 1;
  for (let i = 0; i < S; i += 4) {
    g.beginPath();
    g.moveTo(i + 0.5, 0);
    g.lineTo(i + 0.5, S);
    g.moveTo(0, i + 0.5);
    g.lineTo(S, i + 0.5);
    g.stroke();
  }
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = 1000;
  return t;
}
