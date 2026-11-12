/**
 * Tangan (telapak + lima jari sedikit menekuk) dan kaki (sepatu berbentuk, atau sandal dengan
 * telapak kaki & jari kaki). Bagian ini kaku: ditempel pada tulang tangan/kaki.
 *
 * Tangan KIRI pada ruang tulang tangan: pangkal = pergelangan; jari mengarah −Y; telapak
 * menghadap −X (ke arah paha saat lengan tergantung); ibu jari ke +Z. Tangan kanan = cermin X.
 * Kaki KIRI pada ruang tulang kaki: pangkal = sendi pergelangan; telapak ke +Z; lantai di −footH.
 */
import { type BufferGeometry, Vector3 } from 'three';
import { GeoBuilder, type Ring, sampleStations } from './geo';

const X = new Vector3(1, 0, 0);
const Y = new Vector3(0, 1, 0);

/** Geometri tangan kiri. `k` = skala tangan (meter per satuan). */
export function buildHand(k: number, plump = 0): BufferGeometry {
  const geo = new GeoBuilder();
  const t = 1 + 0.22 * plump;
  // Telapak: [y, setengah tebal (X), lebar ke sisi ibu jari (+Z), lebar ke sisi kelingking (−Z), geser z]
  const palm = [
    [0.014, 0.019, 0.0225, 0.0225, 0],
    [0.0, 0.0205, 0.0245, 0.0245, 0],
    [-0.016, 0.0165, 0.034, 0.031, 0.002],
    [-0.04, 0.0135, 0.0405, 0.036, 0.002],
    [-0.066, 0.012, 0.0405, 0.0375, 0.001],
    [-0.086, 0.0105, 0.039, 0.037, 0],
    [-0.094, 0.0075, 0.035, 0.034, 0],
  ];
  const rings: Ring[] = [];
  for (let y = 0.014; y > -0.0945; y -= 0.009) {
    const [rx, rf, rb, zc] = sampleStations(palm, y) as [number, number, number, number];
    // Telapak sedikit cekung: punggung tangan (+X) lebih menonjol daripada sisi telapak.
    rings.push({ c: [0.002 * k, y * k, zc * k], rx: rx * k * t, rf: rf * k, rb: rb * k, n: 2.5 });
  }
  geo.addLoft(rings, { segments: 14, capStart: true, capEnd: true });

  // Jari: [z pangkal, y pangkal, panjang, jari-jari, tekukan total (rad), sebaran z]
  const fingers = [
    [0.0285, -0.088, 0.07, 0.0088, 0.42, 0.006],
    [0.0095, -0.092, 0.078, 0.0092, 0.5, 0.001],
    [-0.0095, -0.09, 0.072, 0.0088, 0.6, -0.003],
    [-0.0275, -0.084, 0.057, 0.0078, 0.72, -0.007],
  ];
  for (const [zb, yb, len, r, curl, spread] of fingers as [number, number, number, number, number, number][]) {
    const f: Ring[] = [];
    for (const [u, rk] of [
      [0, 1.04],
      [0.22, 1],
      [0.45, 0.97],
      [0.68, 0.9],
      [0.88, 0.8],
      [1, 0.5],
    ] as [number, number][]) {
      const phi = curl * u;
      // Lengkung berkelok tetap ke arah telapak (−X).
      const x = (len / curl) * (Math.cos(phi) - 1);
      const y = yb - (len / curl) * Math.sin(phi);
      f.push({ c: [(0.001 + x) * k, y * k, (zb + spread * u) * k], rx: r * rk * k * t, rf: r * rk * k * t });
    }
    geo.addLoft(f, { segments: 8, capStart: true, capEnd: true });
  }

  // Ibu jari: keluar dari pangkal telapak sisi +Z, mengarah ke depan-bawah, agak ke telapak.
  const dir = new Vector3(-0.3, -0.66, 0.68).normalize();
  const u = new Vector3().crossVectors(dir, new Vector3(0, 0, 1)).normalize();
  const v = new Vector3().crossVectors(u, dir).normalize();
  const base = new Vector3(-0.002, -0.02, 0.022);
  const thumb: Ring[] = [];
  for (const [d, r] of [
    [-0.006, 0.0125],
    [0.012, 0.0138],
    [0.03, 0.0118],
    [0.046, 0.0104],
    [0.06, 0.0094],
    [0.069, 0.006],
  ] as [number, number][]) {
    // Ruas ujung ibu jari sedikit menekuk kembali sejajar jari.
    const bend = Math.max(0, d - 0.03) * 0.35;
    thumb.push({ c: [(base.x + dir.x * d) * k, (base.y + dir.y * d - bend * 0.4) * k, (base.z + dir.z * d - bend) * k], rx: r * k * t, rf: r * k * t });
  }
  geo.addLoft(thumb, { segments: 8, capStart: true, capEnd: true, u, v });
  return geo.build(false);
}

export interface FootGeometry {
  /** Bagian atas sepatu (null untuk sandal). */
  upper: BufferGeometry | null;
  sole: BufferGeometry;
  /** Telapak kaki & jari kaki (kulit) — hanya sandal. */
  skin: BufferGeometry | null;
  /** Tali sandal. */
  strap: BufferGeometry | null;
}

/** Geometri kaki kiri. `s` = skala badan; `footH` = tinggi sendi pergelangan dari lantai. */
export function buildFoot(s: number, footH: number, sandal: boolean, swollen: boolean): FootGeometry {
  const floor = -footH;
  const wide = swollen ? 1.16 : 1;
  const puff = swollen ? 0.007 : 0;
  const opt = { u: X, v: Y };
  /** Cincin melintang telapak: lebar ±w, dari `bottom` sampai `top` (ruang tulang kaki). */
  const ring = (z: number, w: number, top: number, bottom: number, n: number, xo = 0): Ring => ({
    c: [xo * s, (top + bottom) / 2, z * s],
    rx: w * s,
    rf: (top - bottom) / 2,
    rb: (top - bottom) / 2,
    n,
  });

  if (!sandal) {
    // Sepatu: [z, setengah lebar, tinggi atas, geser x (kaki kiri sedikit melebar ke luar di depan)]
    const shape = [
      [-0.068, 0.02, -0.03, 0],
      [-0.06, 0.031, -0.014, 0],
      [-0.04, 0.038, -0.002, 0],
      [-0.005, 0.041, 0.006, 0],
      [0.03, 0.043, -0.002, 0.001],
      [0.065, 0.046, -0.019, 0.002],
      [0.11, 0.049, -0.031, 0.004],
      [0.15, 0.047, -0.036, 0.004],
      [0.182, 0.04, -0.04, 0.003],
      [0.2, 0.027, -0.045, 0.002],
    ];
    const upper = new GeoBuilder();
    const sole = new GeoBuilder();
    const up: Ring[] = [];
    const so: Ring[] = [];
    for (let z = -0.068; z < 0.2005; z += 0.0134) {
      const [w, top, xo] = sampleStations(shape, z) as [number, number, number];
      up.push(ring(z, w * wide, top * s + puff, floor + 0.009 * s, 2.7, xo));
      so.push(ring(z, w * wide + 0.0035, floor + 0.014 * s, floor + 0.0008, 5, xo));
    }
    upper.addLoft(up, { ...opt, segments: 14, capStart: true, capEnd: true });
    sole.addLoft(so, { ...opt, segments: 12, capStart: true, capEnd: true });
    return { upper: upper.build(false), sole: sole.build(false), skin: null, strap: null };
  }

  // Sandal: telapak kaki telanjang di atas sol, dengan tali lebar di punggung kaki.
  const shape = [
    [-0.06, 0.017, -0.03, 0],
    [-0.05, 0.027, -0.017, 0],
    [-0.03, 0.032, -0.005, 0],
    [0.0, 0.034, 0.002, 0],
    [0.03, 0.036, -0.009, 0.001],
    [0.065, 0.04, -0.023, 0.002],
    [0.11, 0.045, -0.034, 0.004],
    [0.15, 0.045, -0.04, 0.004],
    [0.176, 0.041, -0.043, 0.004],
  ];
  const skin = new GeoBuilder();
  const sole = new GeoBuilder();
  const strap = new GeoBuilder();
  const soleTop = floor + 0.012 * s;
  const sk: Ring[] = [];
  const so: Ring[] = [];
  for (let z = -0.06; z < 0.1765; z += 0.0131) {
    const [w, top, xo] = sampleStations(shape, z) as [number, number, number];
    sk.push(ring(z, w * wide, top * s + puff, soleTop - 0.001, 2.6, xo));
  }
  skin.addLoft(sk, { ...opt, segments: 14, capStart: true, capEnd: true });
  for (let z = -0.066; z < 0.2075; z += 0.0152) {
    const [w, , xo] = sampleStations(shape, Math.min(z, 0.176)) as [number, number, number];
    const taper = z > 0.176 ? 1 - ((z - 0.176) / 0.031) ** 2 * 0.45 : 1;
    so.push(ring(z, (w * wide + 0.004) * taper, soleTop, floor + 0.0008, 5, xo));
  }
  sole.addLoft(so, { ...opt, segments: 12, capStart: true, capEnd: true });
  // Jari kaki: ibu jari di sisi dalam (−X pada kaki kiri).
  const toes: [number, number, number][] = [
    [-0.027, 0.186, 0.0118],
    [-0.0095, 0.189, 0.0088],
    [0.005, 0.186, 0.0082],
    [0.018, 0.18, 0.0078],
    [0.0295, 0.172, 0.0072],
  ];
  for (const [x, z, r] of toes) {
    const toe: Ring[] = [];
    for (const [dz, rk] of [
      [-0.016, 0.9],
      [-0.004, 1],
      [0.008, 0.96],
      [0.016, 0.62],
    ] as [number, number][]) {
      toe.push({ c: [(x + 0.004) * s * wide, soleTop + r * s * 0.82, (z + dz) * s], rx: r * s * rk, rf: r * s * rk * 0.84, rb: r * s * 0.8 });
    }
    skin.addLoft(toe, { ...opt, segments: 8, capStart: true, capEnd: true });
  }
  // Tali: pita melengkung di atas punggung kaki.
  const st: Ring[] = [];
  for (const z of [0.078, 0.094, 0.112, 0.128]) {
    const [w, top, xo] = sampleStations(shape, z) as [number, number, number];
    st.push(ring(z, w * wide + 0.0035 * s, top * s + puff + 0.0035 * s, soleTop - 0.002, 2.6, xo));
  }
  strap.addLoft(st, { ...opt, segments: 12, arc: [-1.72, 1.72] });
  return { upper: null, sole: sole.build(false), skin: skin.build(false), strap: strap.build(false) };
}
