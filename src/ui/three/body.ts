/**
 * Tubuh pasien sebagai permukaan menyatu (skinned) berbentuk anatomis:
 * torso berbahu–dada–pinggang–panggul, leher, lengan (deltoid, biseps, lengan bawah, pergelangan),
 * kaki (paha, lutut, betis, pergelangan), dengan pakaian (kaos/kemeja/jaket, celana) yang punya
 * ketebalan dan kelim. Bentuk divariasikan oleh jenis kelamin, kelompok usia, dan IMT.
 *
 * Semua koordinat dalam ruang akar karakter pada pose ikat (berdiri tegak, lengan di samping).
 */
import { type BufferGeometry, Vector3 } from 'three';
import { blend, GeoBuilder, type Ring, sampleStations, smooth, type Weights } from './geo';

/** Indeks tulang (urutan harus sama dengan kerangka di character.ts). */
export const BONE = {
  hips: 0,
  spine: 1,
  chest: 2,
  ribs: 3,
  neck: 4,
  head: 5,
  shL: 6,
  upL: 7,
  foL: 8,
  haL: 9,
  shR: 10,
  upR: 11,
  foR: 12,
  haR: 13,
  thL: 14,
  snL: 15,
  ftL: 16,
  thR: 17,
  snR: 18,
  ftR: 19,
} as const;

export interface BodySpec {
  /** Skala badan terhadap rujukan dewasa 165 cm. */
  s: number;
  male: boolean;
  ageGroup: 'anak' | 'remaja' | 'dewasa' | 'lansia';
  /** 0..1 kegemukan · 0..1 kekurusan. */
  fat: number;
  thin: number;
  hipsY: number;
  hipHalf: number;
  hipDrop: number;
  /** Tinggi sendi (relatif pusat panggul). */
  spineY: number;
  chestY: number;
  neckY: number;
  headY: number;
  shoulderHalf: number;
  shoulderY: number;
  upperArm: number;
  foreArm: number;
  thigh: number;
  shin: number;
  longSleeves: boolean;
  shorts: boolean;
  jacket: boolean;
  collar: boolean;
  tucked: boolean;
  /** Kain hijab yang menjuntai menutup bahu & dada. */
  hijab: boolean;
  edema: boolean;
}

export interface BodyGeometry {
  skinNeck: BufferGeometry;
  skinArms: BufferGeometry | null;
  skinLegs: BufferGeometry | null;
  top: BufferGeometry;
  /** Detail baju: kerah, plaket/ritsleting, pita leher kaos. */
  trim: BufferGeometry;
  bottom: BufferGeometry;
  belt: BufferGeometry | null;
  /** Juntai hijab (null bila tidak berhijab). */
  drape: BufferGeometry | null;
  /**
   * Permukaan badan berpakaian pada tinggi `yr` (× s di atas pusat panggul, pose ikat):
   * setengah lebar, z depan, z belakang — dipakai untuk titik sentuh tangan.
   */
  surface(yr: number): { half: number; front: number; back: number };
}

type Table = number[][];

// --- Profil dasar (meter pada s = 1, laki-laki dewasa) -------------------------
// Torso: [y relatif pusat panggul, setengah lebar, tebal depan, tebal belakang, geser z]
const TORSO: Table = [
  [-0.112, 0.15, 0.085, 0.098, -0.006],
  [-0.07, 0.166, 0.097, 0.112, -0.006],
  [-0.025, 0.166, 0.102, 0.118, -0.006],
  [0.04, 0.158, 0.1, 0.108, -0.002],
  [0.11, 0.143, 0.097, 0.094, 0.004],
  [0.18, 0.146, 0.101, 0.093, 0.006],
  [0.26, 0.153, 0.11, 0.097, 0.006],
  [0.34, 0.16, 0.117, 0.101, 0.004],
  [0.376, 0.167, 0.113, 0.103, 0.002],
  // Bahu: penampang melebar mencakup deltoid, sehingga baju mengalir dari badan ke lengan.
  [0.396, 0.19, 0.109, 0.103, 0.001],
  [0.415, 0.22, 0.105, 0.102, 0],
  [0.435, 0.231, 0.1, 0.101, -0.002],
  [0.455, 0.223, 0.094, 0.098, -0.004],
  [0.472, 0.203, 0.087, 0.095, -0.005],
  [0.486, 0.172, 0.08, 0.091, -0.006],
  [0.5, 0.128, 0.072, 0.086, -0.008],
  [0.515, 0.088, 0.063, 0.074, -0.008],
  [0.527, 0.064, 0.058, 0.064, -0.008],
];
/** Tinggi tepi atas baju (garis leher), relatif pusat panggul. */
const TOP_Y = 0.527;
// Lengan: [jarak dari sendi bahu, setengah lebar (X), tebal depan, tebal belakang, geser keluar, geser z]
const ARM: Table = [
  [-0.03, 0.01, 0.012, 0.012, -0.012, 0],
  [-0.022, 0.032, 0.035, 0.035, -0.006, 0],
  [-0.01, 0.045, 0.049, 0.049, -0.002, 0],
  [0.01, 0.05, 0.054, 0.052, 0.001, 0],
  [0.05, 0.051, 0.054, 0.052, 0.003, 0],
  [0.09, 0.046, 0.05, 0.048, 0.002, 0.002],
  [0.15, 0.042, 0.048, 0.044, 0, 0.004],
  [0.215, 0.038, 0.041, 0.04, 0, 0.002],
  [0.27, 0.036, 0.036, 0.038, 0, 0],
  [0.305, 0.038, 0.039, 0.037, 0, 0.002],
  [0.36, 0.034, 0.035, 0.033, 0, 0.002],
  [0.44, 0.0255, 0.0275, 0.0265, 0, 0],
  [0.505, 0.0215, 0.0245, 0.0245, 0, 0],
];
// Kaki: [jarak dari sendi panggul, setengah lebar, tebal depan, tebal belakang, geser lateral, geser z]
const LEG: Table = [
  [-0.03, 0.08, 0.09, 0.1, 0, 0],
  [0.03, 0.084, 0.09, 0.094, 0.002, 0],
  [0.12, 0.08, 0.087, 0.086, 0, 0.002],
  [0.23, 0.068, 0.073, 0.07, -0.002, 0.003],
  [0.33, 0.055, 0.058, 0.055, -0.003, 0.003],
  [0.39, 0.051, 0.054, 0.052, -0.003, 0.004],
  [0.44, 0.047, 0.047, 0.052, -0.002, 0],
  [0.52, 0.05, 0.044, 0.062, 0, -0.004],
  [0.62, 0.042, 0.039, 0.048, 0, -0.003],
  [0.72, 0.034, 0.035, 0.036, 0, 0],
  [0.78, 0.033, 0.036, 0.038, 0, 0.002],
];
// Leher & lereng bahu: [y relatif pusat panggul, setengah lebar, tebal depan, tebal belakang, geser z]
const NECK: Table = [
  [0.44, 0.13, 0.082, 0.09, -0.006],
  [0.48, 0.115, 0.074, 0.084, -0.008],
  [0.505, 0.085, 0.064, 0.072, -0.008],
  [0.525, 0.06, 0.056, 0.062, -0.006],
  [0.55, 0.052, 0.053, 0.056, -0.002],
  [0.585, 0.05, 0.054, 0.055, 0.003],
  [0.64, 0.049, 0.052, 0.052, 0.006],
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const bell = (x: number, center: number, width: number) => Math.exp(-(((x - center) / width) ** 2));

/** Profil torso yang sudah disesuaikan jenis kelamin, usia, dan IMT. */
function torsoTable(spec: BodySpec, armK: number): Table {
  const { male, ageGroup, fat, thin } = spec;
  const child = ageGroup === 'anak';
  const kSh = spec.shoulderHalf / (0.178 * spec.s);
  const kHip = spec.hipHalf / (0.084 * spec.s);
  return TORSO.map(([y, rx, rf, rb, zc]) => {
    let w = rx!;
    let f = rf!;
    let b = rb!;
    const upper = smooth(0.2, 0.36, y!);
    const lower = 1 - smooth(0.02, 0.14, y!);
    // Lebar bahu & panggul mengikuti kerangka; tonjolan deltoid mengikuti tebal lengan.
    const deltoid = smooth(0.38, 0.42, y!) * (1 - smooth(0.46, 0.49, y!));
    w = (w + (kSh - 1) * 0.178 * upper) * (1 + (kHip - 1) * lower * 0.9) + (armK - 1) * 0.049 * deltoid;
    if (!male) {
      w *= 1 - 0.1 * bell(y!, 0.14, 0.07) + 0.03 * bell(y!, -0.02, 0.06);
      b += 0.006 * bell(y!, -0.03, 0.05);
      if (!child) f += (ageGroup === 'remaja' ? 0.013 : 0.022) * bell(y!, 0.335, 0.045);
      f *= 0.96;
    }
    if (child) {
      w *= 1 + 0.05 * bell(y!, 0.14, 0.08);
      f *= 0.94;
    }
    if (ageGroup === 'lansia') f += 0.012 * bell(y!, 0.13, 0.08);
    // Kegemukan: perut maju, pinggang melebar; kekurusan: menyempit.
    f += fat * (0.085 * bell(y!, 0.13, 0.11) + 0.03 * bell(y!, 0.33, 0.08) + 0.02 * bell(y!, -0.04, 0.05));
    w += fat * (0.045 * bell(y!, 0.12, 0.1) + 0.02 * bell(y!, 0.33, 0.09) + 0.022 * bell(y!, -0.03, 0.06));
    b += fat * (0.022 * bell(y!, 0.1, 0.14) + 0.014 * bell(y!, -0.03, 0.06));
    const slim = thin * (y! < 0.47 ? 1 : 0.4);
    w -= 0.012 * slim;
    f -= 0.013 * slim;
    b -= 0.008 * slim;
    return [y!, w, f, b, zc!];
  });
}

export function buildBody(spec: BodySpec): BodyGeometry {
  const { s, male, ageGroup, fat, thin } = spec;
  const child = ageGroup === 'anak';
  const young = ageGroup === 'remaja';
  const B = BONE;
  const hy = spec.hipsY;
  const armK = (child ? 0.78 : young ? 0.9 : male ? 1 : 0.86) * (ageGroup === 'lansia' ? 0.93 : 1) * (1 + 0.28 * fat - 0.16 * thin);
  const neckK = (child ? 0.78 : young ? 0.88 : male ? 1 : 0.86) * (1 + 0.14 * fat - 0.08 * thin);
  const torso = torsoTable(spec, armK);
  const cloth = (spec.jacket ? 0.016 : 0.007) * s;
  const pants = 0.006 * s;
  const SEG = 22;

  // --- Bobot tulang untuk torso (berdasarkan tinggi relatif & posisi samping) ---------
  const torsoWeights = (x: number, y: number, z: number): Weights => {
    const yr = (y - hy) / s;
    const jSpine = spec.spineY / s;
    const jChest = spec.chestY / s;
    let base: Weights;
    if (yr < jSpine + 0.06) base = blend(B.hips, B.spine, smooth(jSpine - 0.07, jSpine + 0.05, yr));
    else base = blend(B.spine, B.chest, smooth(jChest - 0.06, jChest + 0.07, yr));
    const out = new Map<number, number>(base.map(([bone, w]) => [bone, w]));
    // Sudut atas torso ikut tulang bahu (bahu terangkat saat napas berat/menggigil); bagian
    // luar tudung bahu (deltoid) ikut sebagian gerak lengan atas.
    const ax = Math.abs(x) / s;
    const shAll = smooth(0.38, 0.46, yr) * smooth(0.075, 0.15, ax) * 0.8;
    const jx = spec.shoulderHalf / s;
    const up = shAll * 0.6 * smooth(jx - 0.035, jx + 0.03, ax) * (1 - smooth(0.462, 0.49, yr));
    const sh = shAll - up;
    // Dinding dada depan ikut tulang rusuk (gerak napas).
    const ribs = z > 0 ? 0.55 * bell(yr, 0.33, 0.085) * smooth(0, 0.07, z / s) * (1 - shAll) : 0;
    if (shAll > 0.001 || ribs > 0.001) {
      for (const [bone, w] of out) out.set(bone, w * (1 - shAll - ribs));
      if (sh > 0.001) out.set(x > 0 ? B.shL : B.shR, sh);
      if (up > 0.001) out.set(x > 0 ? B.upL : B.upR, up);
      if (ribs > 0.001) out.set(B.ribs, ribs);
    }
    return [...out.entries()].filter(([, w]) => w > 0.001) as unknown as Weights;
  };
  const torsoRing = (yr: number, extra: number, opts: { tilt?: number; dip?: number; widen?: number } = {}): Ring => {
    const [rx, rf, rb, zc] = sampleStations(torso, yr) as [number, number, number, number];
    return {
      c: [0, hy + yr * s, zc * s],
      rx: rx * s + extra + (opts.widen ?? 0),
      rf: rf * s + extra,
      rb: rb * s + extra,
      n: 2.35,
      tilt: opts.tilt,
      dip: opts.dip,
      w: torsoWeights,
    };
  };

  // =====================================================================
  // Baju (torso + lengan baju)
  // =====================================================================
  const top = new GeoBuilder();
  const trim = new GeoBuilder();
  const hemY = spec.tucked ? 0.082 : -0.078;
  // Baju yang tidak dimasukkan jatuh di luar celana.
  const over = (yr: number) => (spec.tucked ? 0 : (0.006 * s + (spec.jacket ? 0 : 0.003 * s * smooth(0.02, hemY, yr))) * smooth(0.17, 0.09, yr));
  const topRings: Ring[] = [];
  for (let yr = hemY; yr < 0.512; yr += 0.022) topRings.push(torsoRing(yr, cloth + over(yr)));
  // Garis leher: depan lebih rendah (kaos) atau lebih tinggi (kemeja/jaket berkerah).
  const neckDip = spec.collar || spec.jacket ? -0.2 : -0.62;
  topRings.push(torsoRing(0.514, cloth, { dip: neckDip * 0.5 }));
  topRings.push(torsoRing(TOP_Y, cloth * 0.8, { dip: neckDip }));
  top.addLoft(topRings, { segments: SEG });

  // --- Lengan ------------------------------------------------------------
  const skinArms = new GeoBuilder();
  const sleeveEnd = spec.longSleeves ? 0.492 : 0.138;
  const sleeveCloth = (spec.jacket ? 0.013 : 0.0065) * s;
  for (const side of [1, -1] as const) {
    const [bSh, bUp, bFo] = side === 1 ? [B.shL, B.upL, B.foL] : [B.shR, B.upR, B.foR];
    const sx = side * spec.shoulderHalf;
    const sy = hy + spec.chestY + spec.shoulderY;
    const armWeights = (d: number): Weights => {
      if (d < 0.06) return blend(bSh, bUp, smooth(-0.03, 0.04, d));
      return blend(bUp, bFo, smooth(0.225, 0.315, d));
    };
    const armRing = (d: number, extra: number): Ring => {
      const [rx, rf, rb, xo, zo] = sampleStations(ARM, d) as [number, number, number, number, number];
      // Lemak/otot hanya menebalkan bagian tengah, bukan sendi bahu.
      // Pangkal lengan sedikit lebih ramping agar tersembunyi rapi di dalam tudung bahu.
      const k = (1 + (armK - 1) * smooth(-0.03, 0.03, d)) * (0.84 + 0.16 * smooth(0.012, 0.05, d));
      return { c: [sx + side * xo * s, sy - d * s, zo * s], rx: rx * s * k + extra, rf: rf * s * k + extra, rb: rb * s * k + extra, w: armWeights(d) };
    };
    // Lengan baju: dari puncak bahu sampai kelim (lengan pendek sedikit melebar di ujung).
    const sleeve: Ring[] = [];
    for (const d of [-0.03, -0.022, -0.012]) sleeve.push(armRing(d, sleeveCloth));
    for (let d = 0; d < sleeveEnd - 0.004; d += 0.0178) sleeve.push(armRing(d, sleeveCloth + (spec.longSleeves ? 0 : 0.003 * s * smooth(0.05, sleeveEnd, d))));
    sleeve.push(armRing(sleeveEnd, sleeveCloth + (spec.longSleeves ? 0.0015 : 0.0035) * s));
    top.addLoft(sleeve, { segments: 14, capStart: true });
    // Kulit lengan yang terlihat (di bawah lengan baju) sampai pergelangan.
    const skin: Ring[] = [];
    for (let d = spec.longSleeves ? 0.47 : 0.1; d < 0.505; d += 0.018) skin.push(armRing(d, 0));
    skin.push(armRing(0.505, 0));
    skinArms.addLoft(skin, { segments: 14, capEnd: true });
  }

  // --- Detail baju: kerah, plaket, ritsleting, pita leher ----------------------
  if (spec.collar || spec.jacket) {
    // Kerah tegak yang terbuka di depan.
    const open = spec.jacket ? 0.22 : 0.5;
    // Kerah tegak rendah yang memeluk leher, terbuka di depan.
    const nk = 0.55 + 0.45 * neckK;
    const collar: Ring[] = (
      [
        [0.511, 0.072, 0.064, 0.07],
        [0.524, 0.066, 0.061, 0.066],
        [0.537, 0.0635, 0.0605, 0.064],
        [0.546, 0.065, 0.0615, 0.065],
      ] as const
    ).map(([yr, rx, rf, rb]) => ({
      c: [0, hy + yr * s, -0.007 * s] as const,
      rx: rx * s * nk + cloth,
      rf: rf * s * nk + cloth,
      rb: rb * s * nk + cloth,
      n: 2.2,
      dip: -0.22,
      w: [[B.chest, 1]] as Weights,
    }));
    top.addLoft(collar, { segments: 16, arc: [open, Math.PI * 2 - open] });
    if (!spec.jacket) {
      // Daun kerah kemeja: melipat keluar dari tepi atas lalu turun ke bahu, ujungnya di depan.
      const leaf: Ring[] = (
        [
          [0.547, 0.004],
          [0.545, 0.011],
          [0.532, 0.017],
          [0.516, 0.021],
        ] as const
      ).map(([yr, out]) => {
        const top3 = collar[3]!;
        return { ...top3, c: [0, hy + yr * s, -0.007 * s] as const, rx: top3.rx + out * s, rf: top3.rf + out * s, rb: (top3.rb ?? top3.rf) + out * s, dip: -0.22 - out * 9 };
      });
      top.addLoft(leaf, { segments: 16, arc: [open * 0.8, Math.PI * 2 - open * 0.8] });
    }
    // Plaket kancing / ritsleting: jalur tipis di tengah depan.
    const strip: Ring[] = [];
    const halfArc = spec.jacket ? 0.04 : 0.075;
    for (let yr = hemY + 0.006; yr <= 0.512; yr += 0.022) strip.push(torsoRing(yr, cloth + over(yr) + 0.0025 * s));
    trim.addLoft(strip, { segments: 2, arc: [-halfArc, halfArc] });
    // Kancing kemeja: tonjolan kecil di sepanjang plaket.
    if (!spec.jacket) {
      const zAxis = { u: new Vector3(1, 0, 0), v: new Vector3(0, 1, 0) };
      for (let yr = 0.468; yr > hemY + 0.03; yr -= 0.062) {
        const [, rf, , zc] = sampleStations(torso, yr) as [number, number, number, number];
        const z = (zc + rf) * s + cloth + over(yr) + 0.0022 * s;
        const y = hy + yr * s;
        const w = torsoWeights(0, y, z);
        const r = 0.0052 * s;
        trim.addLoft(
          [
            { c: [0, y, z - 0.001 * s], rx: r, rf: r, w },
            { c: [0, y, z + 0.0016 * s], rx: r, rf: r, w },
            { c: [0, y, z + 0.0026 * s], rx: r * 0.6, rf: r * 0.6, w },
          ],
          { ...zAxis, segments: 8, capEnd: true },
        );
      }
    }
  } else {
    // Kaos: pita leher.
    const band: Ring[] = [0.512, 0.524, 0.534].map((yr, i) => {
      const r = torsoRing(Math.min(yr, TOP_Y), cloth * 0.8 + (i === 1 ? 0.0035 : 0.001) * s, { dip: neckDip * (0.5 + i * 0.25) });
      return { ...r, c: [r.c[0], hy + yr * s, r.c[2]] as const };
    });
    trim.addLoft(band, { segments: SEG });
  }

  // =====================================================================
  // Leher & lereng bahu (kulit)
  // =====================================================================
  const skinNeck = new GeoBuilder();
  const neckWeights = (yr: number): Weights => {
    const jNeck = spec.neckY / s;
    const jHead = spec.headY / s;
    if (yr < jNeck + 0.03) return blend(B.chest, B.neck, smooth(jNeck - 0.02, jNeck + 0.035, yr));
    return blend(B.neck, B.head, smooth(jHead - 0.025, jHead + 0.04, yr));
  };
  const neckRings: Ring[] = [];
  for (let yr = 0.44; yr <= 0.6401; yr += 0.02) {
    const [rx, rf, rb, zc] = sampleStations(NECK, yr) as [number, number, number, number];
    // Bagian bawah (lereng bahu) mengikuti lebar bahu; batang leher mengikuti neckK.
    const k = 1 + (neckK - 1) * smooth(0.49, 0.525, yr);
    const kSh = 1 + (spec.shoulderHalf / (0.178 * s) - 1) * (1 - smooth(0.46, 0.52, yr));
    neckRings.push({ c: [0, hy + yr * s, zc * s], rx: rx * s * k * kSh, rf: rf * s * k, rb: rb * s * k, w: neckWeights(yr) });
  }
  skinNeck.addLoft(neckRings, { segments: 16 });

  // =====================================================================
  // Celana (panggul + kaki) & kulit kaki
  // =====================================================================
  const bottom = new GeoBuilder();
  // Bagian tengah panggul: menyempit ke selangkangan; sisi luar pinggul dibentuk oleh pangkal kaki.
  const pelvisRing = (yr: number): Ring => {
    const r = torsoRing(yr, pants);
    const narrow = smooth(0.03, -0.09, yr);
    const shallow = smooth(-0.045, -0.095, yr);
    return { ...r, rx: r.rx * (1 - 0.62 * narrow), rf: r.rf * (1 - 0.34 * shallow), rb: (r.rb ?? r.rf) * (1 - 0.34 * shallow) };
  };
  const pelvis: Ring[] = [];
  for (let yr = 0.1; yr > -0.09; yr -= 0.02) pelvis.push(pelvisRing(yr));
  pelvis.push(pelvisRing(-0.095));
  bottom.addLoft(pelvis, { segments: SEG, capEnd: true });

  const legK = (child ? 0.8 : young ? 0.92 : 1) * (ageGroup === 'lansia' ? 0.94 : 1) * (1 + 0.25 * fat - 0.16 * thin);
  const skinLegs = new GeoBuilder();
  const pantsEnd = spec.shorts ? 0.335 : 0.762;
  const hipDrop = spec.hipDrop / s;
  for (const side of [1, -1] as const) {
    const [bTh, bSn] = side === 1 ? [B.thL, B.snL] : [B.thR, B.snR];
    const lx = side * spec.hipHalf;
    const ly = hy - spec.hipDrop;
    const legRing = (d: number, extra: number, minR = 0): Ring => {
      const [rx0, rf0, rb0, xo, zo] = sampleStations(LEG, d) as [number, number, number, number, number];
      const k = 1 + (legK - 1) * smooth(-0.05, 0.04, d);
      const thighK = !male && !child ? 1 + 0.05 * (1 - smooth(0.2, 0.4, d)) : 1;
      const swell = spec.edema ? 1 + 0.4 * smooth(0.5, 0.68, d) : 1;
      let rx = rx0 * s * k * thighK * swell;
      let rf = rf0 * s * k * thighK * swell;
      let rb = rb0 * s * k * thighK * swell;
      let cx = lx + side * xo * s;
      let cz = zo * s;
      if (d < 0.09) {
        // Pangkal kaki = separuh panggul: sisi luarnya mengikuti siluet pinggul (tabel torso),
        // sehingga pinggul–paha menyambung mulus tanpa "tonjolan popok".
        const [tw, tf, tb, tz] = sampleStations(torso, -hipDrop - d) as [number, number, number, number];
        const outer = (tw - 0.003) * s;
        const inner = -0.004 * s; // kedua pangkal kaki sedikit bertumpuk di garis tengah (tanpa celah)
        const t = smooth(0, 0.09, d);
        rx = lerp((outer - inner) / 2, rx, t);
        cx = lerp((side * (outer + inner)) / 2, cx, t);
        // Puncak elips pangkal kaki (di tengah kaki) tidak boleh menembus permukaan badan di titik itu.
        const fz = Math.pow(Math.max(0.05, 1 - Math.pow(Math.min(0.98, (outer + inner) / 2 / (tw * s)), 2.35)), 1 / 2.35);
        rf = lerp((tf * fz - 0.003) * s, rf, t);
        rb = lerp((tb * fz - 0.003) * s, rb, t);
        cz = lerp(tz * s, cz, t);
      }
      return {
        c: [cx, ly - d * s, cz],
        rx: Math.max(minR, rx + extra),
        rf: Math.max(minR, rf + extra),
        rb: Math.max(minR, rb + extra),
        w: d < -0.05 ? torsoWeights : d < 0.1 ? blend(B.hips, bTh, smooth(-0.035, 0.075, d)) : blend(bTh, bSn, smooth(0.335, 0.445, d)),
      };
    };
    // Celana: longgar di paha & lutut, jatuh lurus di bawah lutut; celana pendek sedikit melebar.
    const straight = spec.shorts ? 0 : 0.058 * s * Math.sqrt(legK);
    const ease = (d: number) => pants + (spec.shorts ? 0.004 * s + 0.007 * s * smooth(0.1, pantsEnd, d) : 0.004 * s * smooth(0, 0.12, d) + 0.007 * s * smooth(0.15, 0.4, d));
    const cloth: Ring[] = [];
    for (let d = -0.115; d < pantsEnd - 0.01; d += 0.0292) cloth.push(legRing(d, ease(d), straight * smooth(0.3, 0.46, d)));
    cloth.push(legRing(pantsEnd, ease(pantsEnd) + (spec.shorts ? 0.002 * s : 0), straight));
    bottom.addLoft(cloth, { segments: 16, capStart: true });
    // Kulit: tungkai bawah (celana pendek) atau hanya pergelangan kaki.
    const skin: Ring[] = [];
    for (let d = spec.shorts ? 0.3 : 0.715; d < 0.785; d += 0.022) skin.push(legRing(d, 0));
    skin.push(legRing(0.79, 0));
    skinLegs.addLoft(skin, { segments: 14 });
  }

  // Ikat pinggang untuk baju yang dimasukkan.
  let belt: GeoBuilder | null = null;
  if (spec.tucked) {
    belt = new GeoBuilder();
    belt.addLoft(
      [0.104, 0.1, 0.07, 0.066].map((yr, i) => torsoRing(yr, pants + (i === 0 || i === 3 ? 0.001 : 0.0045) * s)),
      { segments: SEG },
    );
  }

  // =====================================================================
  // Juntai hijab: melingkari leher, menutup bahu, lalu jatuh di dada & punggung atas.
  // =====================================================================
  let drape: GeoBuilder | null = null;
  if (spec.hijab) {
    drape = new GeoBuilder();
    const sh = spec.shoulderHalf / s;
    const at = (yr: number) => sampleStations(torso, yr) as [number, number, number, number];
    const bustF = Math.max(at(0.3)[1], at(0.335)[1], at(0.37)[1]);
    const backR = Math.max(at(0.34)[2], at(0.4)[2]);
    const arm = 0.052 * armK + (sleeveCloth + 0.007 * s) / s; // sisi luar lengan atas + kelonggaran kain
    // [yr, setengah lebar, depan, belakang, lengkung pelana]
    const shape: [number, number, number, number, number][] = [
      [0.572, 0.078, 0.084, 0.08, 0],
      [0.542, 0.1, 0.092, 0.09, -0.08],
      [0.514, 0.14, 0.101, 0.098, -0.2],
      [0.5, sh + 0.018, bustF + 0.012, backR + 0.012, -0.22],
      [0.462, sh + arm - 0.004, bustF + 0.02, backR + 0.016, -0.7],
      [0.43, sh + arm, bustF + 0.025, backR + 0.019, -1.08],
    ];
    // Sisi kain di atas lengan ikut terangkat bila lengan atas bergerak.
    const drapeWeights = (x: number, y: number, z: number): Weights => {
      const base = torsoWeights(x, y, z);
      const wArm = 0.55 * smooth(sh - 0.02, sh + 0.05, Math.abs(x) / s) * smooth(0.5, 0.44, (y - hy) / s);
      if (wArm < 0.01) return base;
      return [...base.map(([bone, w]) => [bone, w * (1 - wArm)] as const), [x > 0 ? B.upL : B.upR, wArm] as const];
    };
    drape.addLoft(
      shape.map(([yr, rx, rf, rb, bow]) => ({ c: [0, hy + yr * s, -0.004 * s] as const, rx: rx * s, rf: rf * s + cloth, rb: rb * s + cloth, n: 2.2, bow, w: drapeWeights })),
      { segments: 32 },
    );
  }

  const surface = (yr: number) => {
    const [rx, rf, rb, zc] = sampleStations(torso, yr) as [number, number, number, number];
    return { half: rx * s + cloth, front: (zc + rf) * s + cloth, back: (zc - rb) * s - cloth };
  };
  return {
    skinNeck: skinNeck.build(),
    skinArms: skinArms.vertexCount ? skinArms.build() : null,
    skinLegs: skinLegs.vertexCount ? skinLegs.build() : null,
    top: top.build(),
    trim: trim.build(),
    bottom: bottom.build(),
    belt: belt ? belt.build() : null,
    drape: drape ? drape.build() : null,
    surface,
  };
}
