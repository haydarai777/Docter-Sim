import type { BufferGeometry } from 'three';
import { Color, Texture } from 'three';
import { describe, expect, it } from 'vitest';
import { BONE, type BodySpec, buildBody } from '../src/ui/three/body';
import { buildFoot, buildHand } from '../src/ui/three/extremities';
import { GeoBuilder, sampleStations } from '../src/ui/three/geo';
import { buildHead, FACE_SIZE, HeadShape } from '../src/ui/three/head';

/**
 * Geometri karakter dibangkitkan dari kode (tanpa berkas model), jadi tes ini menjaga agar
 * setiap varian pasien menghasilkan permukaan yang sah: tanpa NaN, indeks & bobot tulang benar,
 * dan ukurannya masuk akal.
 */

const BONES = Object.keys(BONE).length;

function spec(over: Partial<BodySpec> = {}): BodySpec {
  const s = over.s ?? 1;
  return {
    s,
    male: true,
    ageGroup: 'dewasa',
    fat: 0,
    thin: 0,
    hipsY: 0.87 * s,
    hipHalf: 0.085 * s,
    hipDrop: 0.03 * s,
    spineY: 0.09 * s,
    chestY: 0.25 * s,
    neckY: 0.52 * s,
    headY: 0.585 * s,
    shoulderHalf: 0.173 * s,
    shoulderY: 0.2 * s,
    upperArm: 0.27 * s,
    foreArm: 0.24 * s,
    thigh: 0.39 * s,
    shin: 0.39 * s,
    longSleeves: false,
    shorts: false,
    jacket: false,
    collar: false,
    tucked: false,
    hijab: false,
    edema: false,
    ...over,
  };
}

function checkGeometry(geo: BufferGeometry, label: string, skinned: boolean): void {
  const pos = geo.getAttribute('position');
  const normal = geo.getAttribute('normal');
  const index = geo.getIndex();
  expect(pos.count, `${label}: punya titik`).toBeGreaterThan(8);
  expect(index, `${label}: berindeks`).not.toBeNull();
  for (let i = 0; i < pos.count; i++) {
    const ok = Number.isFinite(pos.getX(i)) && Number.isFinite(pos.getY(i)) && Number.isFinite(pos.getZ(i));
    if (!ok) throw new Error(`${label}: posisi titik ${i} bukan angka`);
    if (!Number.isFinite(normal.getX(i))) throw new Error(`${label}: normal titik ${i} bukan angka`);
  }
  let maxIndex = 0;
  for (let i = 0; i < index!.count; i++) maxIndex = Math.max(maxIndex, index!.getX(i));
  expect(maxIndex, `${label}: indeks dalam jangkauan`).toBeLessThan(pos.count);
  expect(index!.count % 3, `${label}: segitiga utuh`).toBe(0);
  if (!skinned) return;
  const si = geo.getAttribute('skinIndex');
  const sw = geo.getAttribute('skinWeight');
  expect(si.count).toBe(pos.count);
  for (let i = 0; i < pos.count; i++) {
    let sum = 0;
    for (let k = 0; k < 4; k++) {
      const w = sw.getComponent(i, k);
      const b = si.getComponent(i, k);
      if (w < 0 || !(b >= 0 && b < BONES)) throw new Error(`${label}: bobot/tulang titik ${i} tidak sah (${b}, ${w})`);
      sum += w;
    }
    if (Math.abs(sum - 1) > 1e-4) throw new Error(`${label}: jumlah bobot titik ${i} = ${sum}`);
  }
}

describe('pembangun geometri', () => {
  it('interpolasi stasiun melewati titik kontrol dan menjepit di luar rentang', () => {
    const table = [
      [0, 1, 10],
      [1, 2, 20],
      [3, 4, 0],
    ];
    expect(sampleStations(table, 0)).toEqual([1, 10]);
    expect(sampleStations(table, 1)[0]).toBeCloseTo(2);
    expect(sampleStations(table, 3)).toEqual([4, 0]);
    expect(sampleStations(table, -5)).toEqual([1, 10]);
    expect(sampleStations(table, 9)).toEqual([4, 0]);
    const mid = sampleStations(table, 0.5)[0]!;
    expect(mid).toBeGreaterThan(1);
    expect(mid).toBeLessThan(2);
  });

  it('loft menghadap keluar dan menormalkan bobot (maks. 4 tulang per titik)', () => {
    const b = new GeoBuilder();
    b.addLoft(
      [
        { c: [0, 0, 0], rx: 1, rf: 1, w: [[0, 2], [1, 2], [2, 1], [3, 1], [4, 0.2]] },
        { c: [0, 1, 0], rx: 1, rf: 1, w: [[1, 1]] },
      ],
      { segments: 8, capStart: true, capEnd: true },
    );
    const geo = b.build();
    checkGeometry(geo, 'loft', true);
    // Normal sisi tabung searah dengan arah dari sumbu ke titik (menghadap keluar).
    const pos = geo.getAttribute('position');
    const normal = geo.getAttribute('normal');
    for (let i = 0; i < 9; i++) {
      const dot = pos.getX(i) * normal.getX(i) + pos.getZ(i) * normal.getZ(i);
      expect(dot).toBeGreaterThan(0);
    }
  });
});

describe('tubuh pasien', () => {
  const variants: [string, Partial<BodySpec>][] = [
    ['laki-laki dewasa kaos', {}],
    ['perempuan kemeja dimasukkan', { male: false, collar: true, tucked: true, longSleeves: true, hipHalf: 0.093, shoulderHalf: 0.155 }],
    ['anak celana pendek', { s: 0.8, ageGroup: 'anak', shorts: true, collar: true, tucked: true, shoulderHalf: 0.12 }],
    ['remaja berjaket', { s: 0.95, ageGroup: 'remaja', jacket: true, longSleeves: true, collar: true }],
    ['lansia gemuk', { ageGroup: 'lansia', fat: 1 }],
    ['kurus bengkak', { thin: 1, edema: true }],
    ['berhijab gemuk', { male: false, fat: 0.9, hijab: true, longSleeves: true, hipHalf: 0.1 }],
  ];

  it.each(variants)('%s: semua permukaan sah & terikat ke kerangka', (label, over) => {
    const sp = spec(over);
    const body = buildBody(sp);
    const parts: [string, BufferGeometry | null][] = [
      ['leher', body.skinNeck],
      ['lengan', body.skinArms],
      ['kaki', body.skinLegs],
      ['baju', body.top],
      ['detail', body.trim],
      ['celana', body.bottom],
      ['sabuk', body.belt],
      ['juntai', body.drape],
    ];
    for (const [name, geo] of parts) if (geo) checkGeometry(geo, `${label}/${name}`, true);
    expect(!!body.belt).toBe(!!sp.tucked);
    expect(!!body.drape).toBe(!!sp.hijab);

    // Ukuran masuk akal: baju setinggi garis leher, celana sampai dekat pergelangan/lutut.
    body.top.computeBoundingBox();
    body.bottom.computeBoundingBox();
    const top = body.top.boundingBox!;
    const bottom = body.bottom.boundingBox!;
    expect(top.max.y).toBeGreaterThan(sp.hipsY + 0.5 * sp.s);
    expect(top.max.y).toBeLessThan(sp.hipsY + 0.6 * sp.s);
    const ankle = sp.hipsY - sp.hipDrop - sp.thigh - sp.shin;
    if (sp.shorts) expect(bottom.min.y).toBeGreaterThan(ankle + 0.3 * sp.s);
    else expect(bottom.min.y).toBeLessThan(ankle + 0.06 * sp.s);
    // Simetris kiri–kanan.
    expect(top.max.x + top.min.x).toBeCloseTo(0, 3);
    // Permukaan depan dipakai untuk titik sentuh tangan: perut gemuk lebih maju.
    const belly = body.surface(0.13);
    expect(belly.front).toBeGreaterThan(0.08 * sp.s);
    expect(belly.back).toBeLessThan(-0.07 * sp.s);
    expect(body.wrist.x).toBeGreaterThan(0.012 * sp.s);
  });

  it('kegemukan menambah lingkar perut; kekurusan menguranginya', () => {
    const normal = buildBody(spec()).surface(0.13);
    const fat = buildBody(spec({ fat: 1 })).surface(0.13);
    const thin = buildBody(spec({ thin: 1 })).surface(0.13);
    expect(fat.front).toBeGreaterThan(normal.front + 0.05);
    expect(fat.half).toBeGreaterThan(normal.half + 0.02);
    expect(thin.front).toBeLessThan(normal.front);
  });
});

describe('tangan & kaki', () => {
  it('tangan berjari dan alas kaki menghasilkan geometri sah', () => {
    checkGeometry(buildHand(1, 0, { x: 0.0215, z: 0.0245 }), 'tangan', false);
    checkGeometry(buildHand(0.8, 1, { x: 0.016, z: 0.019 }), 'tangan gemuk kecil', false);
    for (const [sandal, swollen] of [
      [false, false],
      [true, false],
      [true, true],
      [false, true],
    ] as const) {
      const foot = buildFoot(1, 0.06, sandal, swollen);
      checkGeometry(foot.sole, 'sol', false);
      expect(!!foot.upper).toBe(!sandal);
      expect(!!foot.skin).toBe(sandal);
      expect(!!foot.strap).toBe(sandal);
      for (const g of [foot.upper, foot.skin, foot.strap]) if (g) checkGeometry(g, 'kaki', false);
      // Alas kaki menapak lantai (lantai = −footH di ruang tulang kaki).
      foot.sole.computeBoundingBox();
      expect(foot.sole.boundingBox!.min.y).toBeCloseTo(-0.06, 2);
    }
  });
});

describe('kepala', () => {
  const shapes = [
    new HeadShape({ hs: 1, male: true, ageGroup: 'dewasa', fat: 0, thin: 0, seed: 11 }),
    new HeadShape({ hs: 0.97, male: false, ageGroup: 'lansia', fat: 0.8, thin: 0, seed: 12 }),
    new HeadShape({ hs: 0.92, male: true, ageGroup: 'anak', fat: 0, thin: 0.7, seed: 13 }),
  ];

  it.each(shapes.map((s, i) => [i, s] as const))('tata letak wajah %i berurutan & di dalam kanvas', (_i, shape) => {
    const L = shape.layout();
    expect(L.size).toBe(FACE_SIZE);
    // Dari atas ke bawah: alis, mata, hidung, mulut, dagu.
    expect(L.browY).toBeLessThan(L.eyeY);
    expect(L.eyeY).toBeLessThan(L.noseY);
    expect(L.noseY).toBeLessThan(L.mouthY);
    expect(L.mouthY).toBeLessThan(L.chinY);
    expect(L.chinY).toBeLessThan(FACE_SIZE);
    expect(L.browY).toBeGreaterThan(0);
    // Mata & mulut muat di dalam bidang wajah.
    expect(L.cx - L.eyeDX - L.eyeRX).toBeGreaterThan(0);
    expect(L.eyeDX).toBeGreaterThan(L.eyeRX);
    expect(L.mouthHalfW).toBeGreaterThan(10);
    expect(L.mouthHalfW).toBeLessThan(L.eyeDX + L.eyeRX);
  });

  it('variasi wajah stabil per benih dan berbeda antar pasien', () => {
    const a = new HeadShape({ hs: 1, male: true, ageGroup: 'dewasa', fat: 0, thin: 0, seed: 5 });
    const b = new HeadShape({ hs: 1, male: true, ageGroup: 'dewasa', fat: 0, thin: 0, seed: 5 });
    const c = new HeadShape({ hs: 1, male: true, ageGroup: 'dewasa', fat: 0, thin: 0, seed: 6 });
    expect(a.vary).toEqual(b.vary);
    expect(a.vary).not.toEqual(c.vary);
    for (const v of Object.values(a.vary)) expect(Math.abs(v)).toBeLessThanOrEqual(1);
  });

  const styles = ['cepak', 'pendek', 'belah', 'ikal', 'tipis', 'botak', 'bob', 'panjang', 'kuncir', 'kuncir_dua', 'sanggul', 'tak_dikenal'];
  it.each(styles)('rambut "%s" dan kepala lengkap sah', (hairStyle) => {
    const parts = buildHead(shapes[0]!, { skin: new Color('#c68642'), hairColor: '#1b1b1b', hairStyle, hijab: null, glasses: true, hairTexture: new Texture() });
    checkGeometry(parts.faceGeometry, 'bidang wajah', false);
    let meshes = 0;
    parts.group.traverse((o) => {
      const geo = (o as { geometry?: BufferGeometry }).geometry;
      if (!geo) return;
      meshes++;
      const pos = geo.getAttribute('position');
      for (let i = 0; i < pos.count; i++) if (!Number.isFinite(pos.getX(i) + pos.getY(i) + pos.getZ(i))) throw new Error(`rambut ${hairStyle}: titik bukan angka`);
    });
    expect(meshes).toBeGreaterThan(5);
    for (const d of parts.disposables) d.dispose();
  });

  it('hijab menutup telinga (tanpa mesh telinga) dan tetap sah', () => {
    const count = (hijab: string | null) => {
      const parts = buildHead(shapes[1]!, { skin: new Color('#c68642'), hairColor: '#1b1b1b', hairStyle: 'panjang', hijab, glasses: false, hairTexture: new Texture() });
      let n = 0;
      parts.group.traverse((o) => {
        if ((o as { geometry?: BufferGeometry }).geometry) n++;
      });
      return n;
    };
    // Tanpa hijab: 2 daun telinga + 2 lekuk dalam; hijab: kain + ciput menggantikan rambut.
    expect(count(null) - count('#7a4a9c')).toBe(3);
  });
});
