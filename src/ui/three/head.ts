/**
 * Kepala pasien: tengkorak berbentuk manusia (kubah kepala, dahi, tulang pipi, rahang, dagu),
 * hidung & telinga 3D, bidang wajah (tempat ekspresi digambar), rambut bervolume yang mengikuti
 * garis rambut, hijab, dan kacamata. Semua diturunkan dari satu fungsi bentuk kepala sehingga
 * rambut/hijab selalu pas di kepala apa pun ukurannya.
 *
 * Ruang lokal: pusat kepala di (0,0,0); wajah menghadap +Z; yn = −1 (dagu) … +1 (ubun-ubun).
 */
import {
  type BufferGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  type Material,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  type Texture,
  TorusGeometry,
  Vector3,
} from 'three';
import { GeoBuilder, type Ring, sampleStations, smooth, spow } from './geo';
import { createClothMaterial } from './cloth';
import { createHairMaterial } from './hair';

export interface HeadSpec {
  /** Skala kepala terhadap dewasa. */
  hs: number;
  /** Tingkat detail geometri wajah (pasien yang diperiksa dari dekat = tinggi). */
  detail?: 'tinggi' | 'standar';
  male: boolean;
  ageGroup: 'anak' | 'remaja' | 'dewasa' | 'lansia';
  fat: number;
  thin: number;
  /** Benih variasi wajah: tiap pasien punya bentuk rahang, mata, hidung, bibir sendiri. */
  seed?: number;
}

/** Variasi wajah per pasien, masing-masing −1..1. */
export interface FaceVariation {
  width: number;
  jaw: number;
  chin: number;
  eyeGap: number;
  eyeSize: number;
  eyeTilt: number;
  nose: number;
  lips: number;
  brow: number;
  mouth: number;
}

/** Tata letak fitur wajah di kanvas (piksel) — dihitung dari bentuk kepala. */
export interface FaceLayout {
  size: number;
  cx: number;
  eyeDX: number;
  eyeY: number;
  eyeRX: number;
  eyeRY: number;
  browY: number;
  noseY: number;
  noseHalfW: number;
  mouthY: number;
  mouthHalfW: number;
  chinY: number;
  /** Piksel per milimeter (tegak). */
  pxPerMm: number;
  /** Kemiringan mata (sudut luar lebih tinggi bila positif), fraksi lebar mata. */
  eyeTilt: number;
  /** Faktor tebal bibir & alis. */
  lipK: number;
  browK: number;
}

// [yn, lebar, depan, belakang, geser z] — dalam satuan setengah-lebar/kedalaman kepala.
const SKULL: number[][] = [
  [1.0, 0.0, 0.0, 0.0, -0.1],
  [0.985, 0.2, 0.21, 0.24, -0.1],
  [0.94, 0.44, 0.45, 0.52, -0.1],
  [0.85, 0.67, 0.65, 0.76, -0.1],
  [0.7, 0.85, 0.8, 0.93, -0.08],
  [0.5, 0.955, 0.9, 1.02, -0.06],
  [0.28, 1.0, 0.955, 1.05, -0.04],
  [0.12, 1.0, 0.965, 1.04, -0.025],
  [0.0, 0.995, 0.925, 1.02, -0.015],
  [-0.18, 0.985, 0.955, 0.96, 0.0],
  [-0.38, 0.945, 0.965, 0.84, 0.015],
  [-0.56, 0.88, 0.955, 0.66, 0.035],
  [-0.72, 0.775, 0.925, 0.44, 0.06],
  [-0.85, 0.625, 0.865, 0.27, 0.09],
  [-0.94, 0.44, 0.77, 0.16, 0.12],
  [-0.985, 0.25, 0.58, 0.08, 0.15],
  [-1.0, 0.0, 0.0, 0.0, 0.17],
];

const FACE_ARC = 1.12;
const FACE_TOP = 0.58;
const FACE_BOTTOM = -0.985;
export const FACE_SIZE = 384;

const bell = (x: number, c: number, w: number) => Math.exp(-(((x - c) / w) ** 2));
const gs = (t: number) => Math.exp(-t * t);
const g4 = (t: number) => Math.exp(-(t * t) * (t * t));

export class HeadShape {
  /** Setengah lebar, setengah tinggi, kedalaman (meter). */
  readonly hw: number;
  readonly hh: number;
  readonly hd: number;
  readonly eyeYn: number;
  readonly vary: FaceVariation;
  /** Jarak pusat mata dari garis tengah (m). */
  readonly eyeX: number;
  /** Tinggi garis mulut (yn) & setengah lebar mulut (m). */
  readonly mouthYn: number;
  readonly mouthHalf: number;
  private readonly table: number[][];
  private readonly age: number;

  constructor(readonly spec: HeadSpec) {
    const { hs, male, ageGroup, fat, thin } = spec;
    const child = ageGroup === 'anak';
    let h = ((spec.seed ?? 1) ^ 0x51ed270b) >>> 0;
    const v = (): number => {
      h = (Math.imul(h ^ (h >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
      h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0;
      // Jumlah dua acak → lebih sering dekat rata-rata, jarang ekstrem.
      const a = ((h ^ (h >>> 16)) >>> 0) / 4294967296;
      h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
      return a + h / 4294967296 - 1;
    };
    const vary = (this.vary = { width: v(), jaw: v(), chin: v(), eyeGap: v(), eyeSize: v(), eyeTilt: v(), nose: v(), lips: v(), brow: v(), mouth: v() });
    // Anak: kepala lebih bulat (lebih lebar, wajah lebih pendek).
    this.hw = 0.0775 * hs * (child ? 1.05 : male ? 1 : 0.97) * (1 + 0.035 * vary.width);
    this.hh = 0.1185 * hs * (child ? 0.95 : 1);
    this.hd = 0.098 * hs;
    // Anak: wajah lebih pendek (mata lebih rendah), dahi lebih besar.
    this.eyeYn = child ? -0.05 : ageGroup === 'remaja' ? 0.015 : 0.045;
    this.eyeX = 0.0315 * hs * (child ? 1.02 : 1) * (1 + 0.045 * vary.eyeGap);
    this.mouthYn = this.eyeYn - (child ? 0.58 : 0.64);
    this.mouthHalf = (child ? 0.0225 : male ? 0.0275 : 0.026) * hs * (1 + 0.07 * vary.mouth);
    this.age = ageGroup === 'lansia' ? 1 : ageGroup === 'dewasa' ? 0.35 : 0;
    this.table = SKULL.map(([yn, w, f, b, zc]) => {
      let ww = w!;
      let ff = f!;
      const jaw = bell(yn!, -0.66, 0.22);
      const chin = bell(yn!, -0.92, 0.1);
      // Rahang: laki-laki lebih lebar & persegi; perempuan/anak lebih lancip.
      ww *= 1 + ((male && !child ? 0.05 : child ? -0.04 : -0.05) + 0.055 * vary.jaw) * jaw + ((male && !child ? 0.1 : -0.1) + 0.09 * vary.chin) * chin;
      if (child) ww *= 1 + 0.03 * bell(yn!, 0.45, 0.3);
      // Pipi/gelambir saat gemuk; pipi cekung saat kurus/lansia.
      ww *= 1 + 0.1 * fat * bell(yn!, -0.55, 0.28) - 0.05 * (thin + (ageGroup === 'lansia' ? 0.4 : 0)) * bell(yn!, -0.4, 0.2);
      ff *= 1 + 0.04 * fat * bell(yn!, -0.75, 0.2);
      return [yn!, ww, ff, b!, zc!];
    }).reverse(); // sampleStations butuh posisi menaik (dagu → ubun-ubun)
  }

  /** Titik di permukaan kepala (ditambah `thick` meter ke luar) untuk tinggi yn & sudut a (0 = depan). */
  point(yn: number, a: number, out: Vector3, thick = 0): Vector3 {
    this.pointRaw(yn, a, out, thick);
    // Relief wajah (rongga mata, tulang alis & pipi, bibir, dagu …) ke arah keluar permukaan.
    const r = Math.cos(a) > 0.05 ? this.relief(out.x, yn) : 0;
    if (r !== 0) {
      const dz = out.z - this.hd * (sampleStations(this.table, yn)[3] as number);
      const len = Math.hypot(out.x, dz) || 1;
      out.x += (out.x / len) * r;
      out.z += (dz / len) * r;
    }
    return out;
  }

  /** Titik permukaan kepala tanpa relief wajah. */
  pointRaw(yn: number, a: number, out: Vector3, thick = 0): Vector3 {
    const [w, f, b, zc] = sampleStations(this.table, yn) as [number, number, number, number];
    const n = 2 + 0.38 * bell(yn, -0.15, 0.55);
    const sx = spow(Math.sin(a), n);
    const cz = spow(Math.cos(a), n);
    const rx = this.hw * Math.max(0, w) + thick;
    const rz = this.hd * Math.max(0, cz >= 0 ? f : b) + thick;
    return out.set(rx * sx, this.hh * yn + thick * Math.max(0, Math.min(1, yn * 1.4)), this.hd * zc + rz * cz);
  }

  /**
   * Relief wajah (m, positif = menonjol) pada posisi lateral x (m) & tinggi yn: rongga mata,
   * tulang alis, pangkal hidung, tulang pipi, lekuk bawah mata, lipatan nasolabial, filtrum,
   * bibir atas & bawah, garis mulut, lekuk di atas dagu, dagu, dan pelipis.
   */
  relief(x: number, yn: number): number {
    const { hs, male, ageGroup, thin, fat } = this.spec;
    const child = ageGroup === 'anak';
    const X = Math.abs(x) / hs;
    const Y = (yn - this.eyeYn) * 0.1185 * (this.hh / (0.1185 * hs));
    const ex = this.eyeX / hs;
    const age = this.age;
    let r = 0;
    // Rongga mata (diisi bola mata & kelopak).
    r -= 0.0102 * gs((X - ex) / 0.0205) * gs(Y / 0.0135);
    // Tulang alis & pangkal hidung (glabela).
    r += (male ? 0.0042 : 0.0028) * (child ? 0.45 : 1) * gs((Y - 0.0172) / 0.0066) * gs((X - 0.027) / 0.028);
    r += 0.0014 * gs(X / 0.009) * gs((Y - 0.004) / 0.012);
    // Tulang pipi (zigomatikum) & cekung di bawahnya pada orang kurus/lansia.
    r += (0.0028 + (male ? 0 : 0.0008) + 0.001 * fat) * gs((X - 0.046) / 0.016) * gs((Y + 0.024) / 0.013);
    r -= 0.0016 * (thin + 0.6 * age) * gs((X - 0.046) / 0.014) * gs((Y + 0.05) / 0.012);
    // Lekuk bawah mata (tear trough).
    r -= 0.0011 * (0.4 + age) * gs((X - 0.025) / 0.012) * gs((Y + 0.0145) / 0.0045);
    // Lipatan nasolabial: dari cuping hidung ke sudut mulut; pipi sedikit menggembung di luarnya.
    const mY = (this.mouthYn - this.eyeYn) * 0.1185;
    const ny = -0.044;
    const t = Math.max(0, Math.min(1, (Y - ny) / (mY + 0.004 - ny)));
    const inRange = gs(Math.max(0, Math.abs(Y - (ny + mY) / 2) - Math.abs(mY - ny) / 2) / 0.003);
    const dist = X - (0.02 + 0.012 * t);
    r -= (0.0009 + 0.0013 * age + (child ? -0.0005 : 0)) * gs(dist / 0.0026) * inRange;
    r += (0.0011 + 0.0012 * fat) * gs((dist - 0.0065) / 0.0045) * inRange;
    // Filtrum & bibir (atas tipis, bawah lebih penuh), garis mulut.
    const mh = this.mouthHalf / hs;
    const lipK = 1 + 0.2 * this.vary.lips;
    r -= 0.0007 * gs(X / 0.0035) * gs((Y - mY - 0.0115) / 0.0055);
    r += 0.0035 * lipK * gs((Y - mY - 0.0042) / 0.0034) * g4(X / (mh * 0.95));
    r += 0.0043 * lipK * gs((Y - mY + 0.0058) / 0.0045) * g4(X / (mh * 0.86));
    r -= 0.0016 * gs((Y - mY) / 0.0013) * g4(X / (mh * 1.02));
    // Lekuk di atas dagu (sulkus mentolabial) & tonjolan dagu.
    r -= 0.0016 * gs((Y - mY + 0.0158) / 0.0045) * gs(X / 0.02);
    r += 0.0024 * (male ? 1.15 : 0.9) * gs((yn + 0.9) / 0.05) * gs(X / 0.017);
    // Pelipis.
    r -= 0.0016 * (0.5 + thin + age) * gs((X - 0.064) / 0.012) * gs((Y - 0.012) / 0.014);
    return r * hs;
  }

  /** z permukaan depan (a = 0) pada tinggi yn. */
  front(yn: number): number {
    const [, f, , zc] = sampleStations(this.table, yn) as [number, number, number, number];
    return this.hd * (zc + f);
  }

  /** Setengah lebar kepala pada tinggi yn. */
  halfWidth(yn: number): number {
    return this.hw * (sampleStations(this.table, yn)[0] as number);
  }

  /** Sudut a yang menghasilkan posisi lateral x (meter) pada tinggi yn. */
  angleFor(yn: number, x: number): number {
    const n = 2 + 0.38 * bell(yn, -0.15, 0.55);
    const t = Math.max(0, Math.min(1, Math.abs(x) / Math.max(1e-6, this.halfWidth(yn))));
    return Math.sign(x) * Math.asin(Math.pow(t, n / 2));
  }

  /** Posisi piksel kanvas wajah untuk (x meter, yn). */
  canvasX(yn: number, x: number): number {
    return FACE_SIZE * (0.5 + this.angleFor(yn, x) / (2 * FACE_ARC));
  }

  canvasY(yn: number): number {
    return (FACE_SIZE * (FACE_TOP - yn)) / (FACE_TOP - FACE_BOTTOM);
  }

  layout(): FaceLayout {
    const { hs, male, ageGroup } = this.spec;
    const child = ageGroup === 'anak';
    const vary = this.vary;
    const eyeX = this.eyeX;
    // Sedikit lebih besar dari ukuran anatomis agar ekspresi terbaca dari kursi dokter.
    const eyeHalf = 0.0166 * hs * (child ? 1.16 : male ? 1 : 1.05) * (1 + 0.06 * vary.eyeSize);
    const cx = FACE_SIZE / 2;
    const eyeDX = this.canvasX(this.eyeYn, eyeX) - cx;
    const eyeRX = (this.canvasX(this.eyeYn, eyeX + eyeHalf) - this.canvasX(this.eyeYn, eyeX - eyeHalf)) / 2;
    const pxPerMm = FACE_SIZE / ((FACE_TOP - FACE_BOTTOM) * this.hh * 1000);
    const mouthYn = this.mouthYn;
    const mouthHalf = this.mouthHalf;
    return {
      size: FACE_SIZE,
      cx,
      eyeDX,
      eyeY: this.canvasY(this.eyeYn),
      eyeRX,
      eyeRY: (child ? 8.3 : 6.9) * pxPerMm * (male ? 1 : 1.08),
      browY: this.canvasY(this.eyeYn + (child ? 0.13 : 0.15)),
      noseY: this.canvasY(this.eyeYn - 0.385),
      noseHalfW: this.canvasX(this.eyeYn - 0.38, 0.0165 * hs * (1 + 0.12 * vary.nose)) - cx,
      mouthY: this.canvasY(mouthYn),
      mouthHalfW: this.canvasX(mouthYn, mouthHalf) - cx,
      chinY: this.canvasY(-0.93),
      pxPerMm,
      eyeTilt: 0.05 + 0.07 * vary.eyeTilt,
      lipK: 1 + 0.2 * vary.lips,
      browK: 1 + 0.22 * vary.brow,
    };
  }
}

export interface HeadLook {
  skin: Color;
  /** Bahan kulit bersama dengan badan (kulit realistis); bila tidak ada dibuat bahan sederhana. */
  skinMaterial?: Material;
  hairColor: string;
  hairStyle: string;
  hijab: string | null;
  glasses: boolean;
  hairTexture: Texture;
}

export interface HeadParts {
  group: Group;
  /** Geometri bidang wajah (materialnya dibuat oleh Face). */
  faceGeometry: BufferGeometry;
  /** Jari-jari nominal untuk titik sentuh tangan (kepala, mata, mulut). */
  radius: number;
  disposables: { dispose(): void }[];
}

/** Bangun kepala lengkap (tanpa bidang wajah — ditambahkan pemanggil). */
export function buildHead(shape: HeadShape, look: HeadLook): HeadParts {
  const group = new Group();
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(x: T): T => {
    disposables.push(x);
    return x;
  };
  const { hs } = shape.spec;
  const center = new Vector3(0, 0, 0);
  const std = (color: string | Color, extra: Partial<{ roughness: number; side: typeof DoubleSide; map: Texture; transparent: boolean; opacity: number }> = {}) =>
    track(new MeshStandardMaterial({ color, roughness: 0.78, metalness: 0, ...extra }));
  const add = (geo: BufferGeometry, m: Material, cast = true): Mesh => {
    const mesh = new Mesh(track(geo), m);
    mesh.castShadow = cast;
    group.add(mesh);
    return mesh;
  };
  const skin = look.skinMaterial ?? std(look.skin, { roughness: 0.66 });

  // --- Tengkorak ------------------------------------------------------------
  // Detail tinggi: kisi rapat di wajah (± 2–3 mm) agar relief mata, bibir, dan lipatan terbentuk
  // halus; bagian ubun-ubun & belakang kepala lebih jarang.
  const hi = shape.spec.detail !== 'standar';
  const skull = new GeoBuilder();
  const ynList: number[] = [];
  // Ubun-ubun: baris rapat dekat kutub (sebaran kosinus); wajah: baris seragam rapat.
  const top = Math.acos(0.32);
  for (let i = 0; i < 10; i++) ynList.push(Math.cos((i / 10) * top));
  const step = hi ? 0.0165 : 0.03;
  for (let yn = 0.32; yn > -0.97; yn -= step) ynList.push(yn);
  ynList.push(-0.985, -1);
  // Sudut kolom: rapat di depan (wajah), jarang di belakang.
  const angles: number[] = [];
  const FRONT = 1.32;
  const NF = hi ? 60 : 34;
  const NB = hi ? 26 : 16;
  for (let j = 0; j < NF; j++) angles.push(-FRONT + (2 * FRONT * j) / NF);
  for (let j = 0; j < NB; j++) angles.push(FRONT + ((2 * Math.PI - 2 * FRONT) * j) / NB);
  const rows: Vector3[][] = ynList.map((yn) => angles.map((a) => shape.point(yn, a, new Vector3())));
  skull.addGrid(rows, center, true);
  add(skull.build(false), skin);

  // --- Bidang wajah (sedikit di luar kulit) ----------------------------------------
  const facePatch = new GeoBuilder();
  const fRows: Vector3[][] = [];
  const F_ROWS = hi ? 70 : 40;
  const F_COLS = hi ? 56 : 32;
  for (let i = 0; i <= F_ROWS; i++) {
    const yn = FACE_TOP + ((FACE_BOTTOM - FACE_TOP) * i) / F_ROWS;
    const row: Vector3[] = [];
    for (let j = 0; j <= F_COLS; j++) row.push(shape.point(yn, -FACE_ARC + (2 * FACE_ARC * j) / F_COLS, new Vector3(), 0.0011 * hs));
    fRows.push(row);
  }
  facePatch.addGrid(fRows, center, false);
  const faceGeometry = track(facePatch.build(false));

  // --- Hidung: punggung hidung menyempit di atas, melebar ke cuping, ujung menonjol -----
  const eye = shape.eyeYn;
  const nose = new GeoBuilder();
  const noseStations = [
    [eye - 0.41, 0.0105, 0.0015],
    [eye - 0.38, 0.0165, 0.011],
    [eye - 0.33, 0.0172, 0.0185],
    [eye - 0.25, 0.0122, 0.0115],
    [eye - 0.12, 0.0086, 0.0048],
    [eye, 0.0074, 0.0012],
    [eye + 0.1, 0.008, -0.002],
  ];
  const child = shape.spec.ageGroup === 'anak';
  const noseK = hs * (child ? 0.78 : shape.spec.male ? 1.04 : 0.94);
  const noseRings: Ring[] = [];
  for (let yn = eye + 0.1; yn >= eye - 0.4101; yn -= 0.0255) {
    const [rx, rf] = sampleStations(noseStations, yn) as [number, number];
    noseRings.push({ c: [0, shape.hh * yn, shape.front(yn) - 0.004 * hs], rx: rx * noseK * (1 + 0.12 * shape.vary.nose), rf: rf * noseK + 0.004 * hs, rb: 0.003 * hs });
  }
  nose.addLoft(noseRings, { segments: 12, capEnd: true });
  add(nose.build(false), skin, false);
  // Cuping hidung (ala) di kedua sisi ujung hidung & lubang hidung yang tersembunyi di bawahnya.
  const alaGeo = track(new SphereGeometry(1, 20, 14));
  const nostrilGeo = track(new SphereGeometry(1, 12, 8));
  const dark = std(look.skin.clone().multiplyScalar(0.3), { roughness: 0.95 });
  const wide = 1 + 0.12 * shape.vary.nose;
  for (const sx of [-1, 1]) {
    // Cuping: menyatu dengan ujung hidung (sebagian besar terbenam), lekuk di atasnya dari AO.
    const ala = new Mesh(alaGeo, skin);
    ala.scale.set(0.0046 * noseK * wide, 0.0042 * noseK, 0.0074 * noseK);
    ala.position.set(sx * 0.0092 * noseK * wide, shape.hh * (eye - 0.376), shape.front(eye - 0.376) + 0.0004 * noseK);
    ala.rotation.y = sx * 0.6;
    group.add(ala);
    // Lubang hidung: celah lonjong yang menghadap ke bawah, tersembunyi di bawah ujung hidung.
    const m = new Mesh(nostrilGeo, dark);
    m.scale.set(0.0032 * noseK, 0.0011 * noseK, 0.0055 * noseK);
    m.position.set(sx * 0.0062 * noseK * wide, shape.hh * (eye - 0.401), shape.front(eye - 0.401) + 0.0062 * noseK);
    m.rotation.set(0.15, sx * -0.35, 0);
    group.add(m);
  }

  // --- Telinga ------------------------------------------------------------
  const covered = !!look.hijab;
  if (!covered) {
    const earGeo = track(buildEar(hs, shape.spec.ageGroup === 'lansia'));
    const earYn = eye - 0.15;
    for (const sx of [-1, 1]) {
      const ear = new Mesh(earGeo, skin);
      ear.scale.x = sx;
      ear.position.set(sx * (shape.halfWidth(earYn) - 0.0022 * hs), shape.hh * earYn, -0.012 * hs);
      ear.rotation.set(-0.12, sx * -0.16, sx * -0.04);
      ear.castShadow = true;
      group.add(ear);
    }
  }

  // --- Rambut / hijab ------------------------------------------------------------
  if (look.hijab) buildHijab(shape, look.hijab, group, track);
  else buildHair(shape, look, group, track);

  // --- Kacamata 3D ------------------------------------------------------------
  if (look.glasses) {
    const frame = std('#22262b', { roughness: 0.4 });
    const lens = track(new MeshStandardMaterial({ color: '#dcecf7', roughness: 0.08, metalness: 0, transparent: true, opacity: 0.14, depthWrite: false }));
    const eyeX = 0.0315 * hs;
    const ey = shape.hh * eye - 0.002 * hs;
    const ez = shape.front(eye) + 0.012 * hs;
    const rw = 0.0225 * hs;
    const rh = 0.0185 * hs;
    const rim = track(new TorusGeometry(1, 0.062, 6, 28));
    const disc = track(new CircleGeometry(1, 24));
    const unit = track(new CylinderGeometry(1, 1, 1, 6));
    /** Batang tipis dari titik a ke b. */
    const rod = (a: Vector3, b: Vector3, r: number) => {
      const m = new Mesh(unit, frame);
      const d = new Vector3().subVectors(b, a);
      m.scale.set(r, d.length(), r);
      m.position.copy(a).addScaledVector(d, 0.5);
      m.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), d.normalize());
      group.add(m);
    };
    const earYn = eye - 0.15;
    for (const sx of [-1, 1]) {
      const r = new Mesh(rim, frame);
      r.position.set(sx * eyeX, ey, ez);
      r.scale.set(rw, rh, rw);
      group.add(r);
      const d = new Mesh(disc, lens);
      d.position.copy(r.position);
      d.scale.set(rw, rh, 1);
      d.renderOrder = 3;
      group.add(d);
      // Engsel di tepi luar bingkai, lalu gagang lurus ke atas telinga.
      const hinge = new Vector3(sx * (shape.halfWidth(eye) + 0.004 * hs), ey + 0.003 * hs, ez - 0.006 * hs);
      rod(new Vector3(sx * (eyeX + rw * 0.96), ey + 0.003 * hs, ez), hinge, 0.0012 * hs);
      rod(hinge, new Vector3(sx * (shape.halfWidth(earYn) + 0.0045 * hs), shape.hh * (earYn + 0.2), -0.02 * hs), 0.0011 * hs);
    }
    rod(new Vector3(-(eyeX - rw * 0.97), ey + 0.004 * hs, ez), new Vector3(eyeX - rw * 0.97, ey + 0.004 * hs, ez), 0.0013 * hs);
  }

  return { group, faceGeometry, radius: 0.098 * hs, disposables };
}

// ---------------------------------------------------------------------------
// Rambut
// ---------------------------------------------------------------------------

interface HairStyle {
  /** Ketebalan dasar (meter pada hs = 1). */
  thick: number;
  /** Garis rambut (yn) di: depan, pelipis, atas telinga, belakang-samping, tengkuk. */
  line: [number, number, number, number, number];
  /** Volume tambahan di depan-atas (jambul/poni). */
  fringe?: number;
  /** Belahan samping: tonjolan volume di satu sisi. */
  part?: number;
  /** Gelombang/ikal (amplitudo). */
  curl?: number;
  /** Hanya pita di samping & belakang (kebotakan): batas atas yn & sudut awal. */
  band?: { top: number; from: number };
  /** Tirai rambut ke bawah: sampai yn berapa, mulai dari sudut berapa. */
  curtain?: { to: number; from: number };
  tail?: 'kuncir' | 'kuncir_dua' | 'sanggul';
}

const HAIR: Record<string, HairStyle> = {
  cepak: { thick: 0.005, line: [0.6, 0.38, 0.14, -0.12, -0.34] },
  pendek: { thick: 0.013, line: [0.55, 0.3, 0.1, -0.2, -0.46], fringe: 0.45 },
  belah: { thick: 0.015, line: [0.5, 0.26, 0.08, -0.22, -0.48], fringe: 0.35, part: 0.55 },
  ikal: { thick: 0.02, line: [0.54, 0.28, 0.1, -0.2, -0.44], curl: 0.012, fringe: 0.2 },
  tipis: { thick: 0.0042, line: [0.36, 0.3, 0.1, -0.18, -0.42], band: { top: 0.74, from: 0.82 } },
  botak: { thick: 0.0036, line: [0.2, 0.2, 0.1, -0.18, -0.4], band: { top: 0.5, from: 1.2 } },
  bob: { thick: 0.016, line: [0.34, 0.16, -0.3, -0.5, -0.6], fringe: 0.6, curtain: { to: -1.12, from: 0.95 } },
  panjang: { thick: 0.016, line: [0.52, 0.22, -0.28, -0.5, -0.6], part: 0.3, curtain: { to: -2.05, from: 1.02 } },
  kuncir: { thick: 0.011, line: [0.57, 0.3, 0.02, -0.3, -0.5], tail: 'kuncir' },
  kuncir_dua: { thick: 0.013, line: [0.48, 0.24, 0.0, -0.3, -0.5], fringe: 0.45, tail: 'kuncir_dua' },
  sanggul: { thick: 0.011, line: [0.57, 0.3, 0.04, -0.3, -0.5], tail: 'sanggul' },
};

/** Garis rambut yn untuk sudut a (0 = depan, π = belakang), simetris kiri-kanan. */
function hairline(line: HairStyle['line'], a: number): number {
  const x = Math.abs(a > Math.PI ? a - Math.PI * 2 : a);
  const pts: [number, number][] = [
    [0, line[0]],
    [0.5, line[0] - 0.02],
    [0.98, line[1]],
    [1.42, line[2]],
    [2.15, line[3]],
    [Math.PI, line[4]],
  ];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i]!;
    const [x1, y1] = pts[i + 1]!;
    if (x <= x1) return y0 + (y1 - y0) * smooth(x0, x1, x);
  }
  return line[4];
}

function buildHair(shape: HeadShape, look: HeadLook, group: Group, track: <T extends { dispose(): void }>(x: T) => T): void {
  const style = HAIR[look.hairStyle] ?? HAIR.pendek!;
  const { hs } = shape.spec;
  const mat = track(createHairMaterial({ color: look.hairColor }));
  // Lapisan helai luar yang jarang (rambut pendek sekali tidak perlu).
  if (style.thick >= 0.008) {
    const fuzz = new Mesh(track(hairShell(shape, style, 0.0018 * hs)), track(createHairMaterial({ color: look.hairColor, fuzz: true })));
    group.add(fuzz);
  }
  if (style.tail === 'sanggul') {
    const bun = new Mesh(track(new SphereGeometry(0.036 * hs, 24, 18)), mat);
    bun.scale.set(1.15, 0.95, 0.9);
    bun.position.set(0, shape.hh * -0.12, shape.hd * -1.12);
    bun.castShadow = true;
    group.add(bun);
  }
  const mesh = new Mesh(track(hairShell(shape, style, 0)), mat);
  mesh.castShadow = true;
  group.add(mesh);
}

/** Selubung rambut (+ tirai & ekor) dengan ketebalan tambahan `extra` (m) untuk lapisan luar. */
function hairShell(shape: HeadShape, style: HairStyle, extra: number): BufferGeometry {
  const { hs } = shape.spec;
  const center = new Vector3(0, 0, -0.01);
  const geo = new GeoBuilder();
  const T = style.thick * hs;
  const COLS = 84;
  const a0 = style.band ? style.band.from : 0;
  const a1 = style.band ? Math.PI * 2 - style.band.from : Math.PI * 2;
  const closed = !style.band;

  // Selubung utama: dari garis rambut naik ke ubun-ubun.
  const ROWS = style.curl ? 30 : 20;
  const rows: Vector3[][] = [];
  for (let i = 0; i <= ROWS; i++) {
    const t = i / ROWS;
    const row: Vector3[] = [];
    const count = closed ? COLS : COLS + 1;
    for (let j = 0; j < count; j++) {
      const a = a0 + ((a1 - a0) * j) / COLS;
      const y0 = hairline(style.line, a);
      const top = style.band ? Math.min(0.97, style.band.top + 0.14 * smooth(1.2, Math.PI, Math.abs(a > Math.PI ? a - Math.PI * 2 : a))) : 0.999;
      const yn = y0 + (top - y0) * Math.pow(t, 0.85);
      const front = Math.max(0, Math.cos(a));
      // Menipis di garis rambut; rambut bertirai (bob/panjang) tetap tebal di sisi & belakang.
      const edge = style.curtain ? Math.min(1, front * 1.6) : 1;
      let thick = T * (1 - 0.78 * edge * (1 - smooth(0, 0.28, t)));
      if (style.band) thick *= (1 - 0.7 * smooth(0.75, 1, t)) * smooth(0, 0.22, Math.min(a - a0, a1 - a));
      // Variasi per arah dipudarkan menuju ubun-ubun agar semua kolom bertemu di satu titik.
      const crown = 1 - smooth(0.7, 1, t);
      if (style.fringe) thick *= 1 + style.fringe * front * front * bell(t, 0.3, 0.3) * crown;
      if (style.part) thick *= 1 + style.part * bell(a > Math.PI ? a - Math.PI * 2 : a, -0.55, 0.5) * bell(t, 0.45, 0.4) * crown;
      if (style.curl) thick += style.curl * hs * (Math.sin(a * 11 + t * 7) * Math.cos(t * 15 + a * 4) * 0.5 + 0.5) * smooth(0, 0.15, t) * (0.35 + 0.65 * crown);
      row.push(shape.point(yn, a, new Vector3(), thick + extra * smooth(0, 0.2, t)));
    }
    rows.push(row);
  }
  geo.addGrid(rows, center, closed, { uRepeat: 7 });

  // Tirai rambut ke bawah (bob/panjang): sisi & belakang, jatuh dari kepala ke bahu/punggung.
  if (style.curtain) {
    const { to, from } = style.curtain;
    const cRows: Vector3[][] = [];
    const C_ROWS = Math.max(12, Math.round((0.05 - to) * 20));
    const C_COLS = 60;
    for (let i = 0; i <= C_ROWS; i++) {
      const t = i / C_ROWS;
      const yn = 0.05 + (to - 0.05) * t;
      const row: Vector3[] = [];
      for (let j = 0; j <= C_COLS; j++) {
        const a = from + ((Math.PI * 2 - 2 * from) * j) / C_COLS;
        // Di bawah rahang, rambut jatuh lurus dari penampang kepala lalu sedikit merapat.
        const ynHead = Math.max(yn, -0.5);
        const below = Math.max(0, -0.5 - yn);
        const tip = smooth(0.75, 1, t);
        const thick = T * (1 + 0.3 * smooth(0, 0.35, t)) * (1 - 0.6 * tip) + (style.curl ?? 0) * hs * Math.sin(a * 8 + t * 9) + extra;
        const p = shape.point(ynHead, a, new Vector3(), thick);
        p.y = shape.hh * yn;
        // Di bawah rahang rambut jatuh lurus, sedikit di luar kerah/bahu.
        p.x *= 1 + 0.06 * Math.min(1, below * 2) - 0.05 * tip;
        p.z -= 0.014 * hs * Math.min(1.5, below);
        row.push(p);
      }
      cRows.push(row);
    }
    // Baris dibalik: ujung rambut (v = 1) menipis menjadi helai.
    geo.addGrid(cRows.reverse(), new Vector3(0, shape.hh * -0.6, -0.01), false, { uRepeat: 6 });
  }

  // Ekor / sanggul.
  const tube = (points: [number, number, number, number][]) => {
    const rings: Ring[] = points.map(([x, y, z, r]) => ({ c: [x * hs, y * hs, z * hs] as const, rx: r * hs + extra, rf: r * hs + extra }));
    geo.addLoft(rings, { segments: 18, capStart: true, capEnd: true, uRepeat: 3 });
  };
  const back = -shape.hd / hs;
  if (style.tail === 'kuncir') {
    tube([
      [0, 0.03, back * 0.98, 0.017],
      [0, 0.02, back * 1.16, 0.026],
      [0, -0.02, back * 1.3, 0.027],
      [0, -0.075, back * 1.34, 0.023],
      [0, -0.135, back * 1.28, 0.017],
      [0, -0.185, back * 1.22, 0.008],
    ]);
  } else if (style.tail === 'kuncir_dua') {
    for (const sx of [-1, 1]) {
      const w = shape.hw / hs;
      tube([
        [sx * w * 0.92, -0.02, -0.03, 0.014],
        [sx * w * 1.14, -0.035, -0.035, 0.02],
        [sx * w * 1.2, -0.085, -0.03, 0.019],
        [sx * w * 1.16, -0.14, -0.025, 0.014],
        [sx * w * 1.1, -0.18, -0.02, 0.006],
      ]);
    }
  }
  return geo.build(false);
}

// ---------------------------------------------------------------------------
// Telinga
// ---------------------------------------------------------------------------

/**
 * Daun telinga berpahat (ruang lokal: +X = keluar dari kepala, +Y = atas, +Z = depan):
 * heliks yang menggulung di tepi atas–belakang, skafa (alur), antiheliks (punggung bukit),
 * konka (mangkuk dalam dekat liang telinga), tragus di depan, lobus lunak di bawah. Bagian
 * belakang menjauh dari kepala (sudut ± 25°) seperti telinga sungguhan.
 */
function buildEar(hs: number, old: boolean): BufferGeometry {
  const wz = 0.0168 * hs;
  const wy = 0.0298 * hs * (old ? 1.08 : 1);
  const ROWS = 18;
  const COLS = 40;
  const front: Vector3[][] = [];
  const back: Vector3[][] = [];
  const outline = (th: number): [number, number] => {
    // th: 0 = atas, naik searah jarum jam ke belakang. Bagian atas lebih lebar, lobus menyempit.
    const z = Math.sin(th);
    const y = Math.cos(th);
    const top = Math.max(0, y);
    const lobe = Math.max(0, -y);
    const k = 1 + 0.12 * top - 0.24 * lobe * lobe;
    return [z * wz * k * (z < 0 ? 1.08 : 0.92), y * wy];
  };
  for (let i = 0; i <= ROWS; i++) {
    const rho = i / ROWS;
    const fr: Vector3[] = [];
    const bk: Vector3[] = [];
    for (let j = 0; j < COLS; j++) {
      const th = (j / COLS) * Math.PI * 2;
      const [oz, oy] = outline(th);
      const z = oz * rho;
      const y = oy * rho;
      const yn = y / wy;
      const zn = z / wz;
      const lobeK = 1 - smooth(-0.35, -0.6, yn);
      // Bidang dasar: tepi belakang menjauh dari kepala.
      const base = Math.max(0, -z) * 0.45 + 0.0012 * hs;
      let h = 0;
      // Heliks: tepi menggulung (naik lalu melengkung kembali di ujung).
      h += 0.0034 * hs * bell(rho, 0.9, 0.07) * lobeK;
      h -= 0.0016 * hs * smooth(0.95, 1, rho) * lobeK;
      // Skafa & antiheliks.
      h -= 0.0016 * hs * bell(rho, 0.76, 0.05) * lobeK * smooth(-0.2, 0.3, -zn + 0.4);
      h += 0.0022 * hs * bell(rho, 0.58, 0.08) * lobeK * (1 - bell(zn, 0.75, 0.35));
      // Konka: mangkuk dalam di depan-tengah.
      const cr = Math.hypot((zn - 0.22) / 0.55, (yn + 0.08) / 0.42);
      h -= 0.0052 * hs * Math.max(0, 1 - cr * cr) ** 1.4;
      // Tragus.
      h += 0.0026 * hs * Math.exp(-(((zn - 0.82) / 0.16) ** 2) - (((yn + 0.12) / 0.16) ** 2));
      // Lobus: lunak & sedikit lebih tebal.
      h += 0.001 * hs * (1 - lobeK);
      fr.push(new Vector3(base + h, y, z));
      bk.push(new Vector3(base - 0.0024 * hs * (1 - rho * rho), y, z));
    }
    front.push(fr);
    back.push(bk);
  }
  const geo = new GeoBuilder();
  geo.addGrid(front, new Vector3(-0.05, 0, 0), true);
  geo.addGrid(back, new Vector3(0.05, 0, 0), true);
  return geo.build(false);
}

// ---------------------------------------------------------------------------
// Hijab
// ---------------------------------------------------------------------------

function buildHijab(shape: HeadShape, color: string, group: Group, track: <T extends { dispose(): void }>(x: T) => T): void {
  const { hs } = shape.spec;
  const mat = track(createClothMaterial({ color, kind: 'kain' }));
  mat.side = DoubleSide;
  const inner = track(new MeshStandardMaterial({ color: new Color(color).multiplyScalar(0.78), roughness: 0.95, side: DoubleSide }));
  const center = new Vector3(0, 0, -0.01);
  const eye = shape.eyeYn;
  const top = eye + 0.3; // tepi kain di dahi
  const chin = -0.93;
  /** Setengah sudut bukaan wajah pada tinggi yn (0 = tertutup). */
  const opening = (yn: number): number => {
    if (yn >= top || yn <= chin) return 0;
    const mid = (top + chin) / 2;
    const half = (top - chin) / 2;
    const k = Math.sqrt(Math.max(0, 1 - ((yn - mid) / half) ** 2));
    return 1.02 * Math.pow(k, 0.55);
  };
  const geo = new GeoBuilder();
  const COLS = 36;
  const rows: Vector3[][] = [];
  const add = (yn: number, extraDown = 0) => {
    const row: Vector3[] = [];
    const o = opening(yn);
    for (let j = 0; j <= COLS; j++) {
      const a = o + ((Math.PI * 2 - 2 * o) * j) / COLS;
      const backness = Math.max(0, -Math.cos(a));
      // Sedikit volume di belakang (rambut terikat di dalam kain).
      const thick = (0.0075 + 0.012 * backness * bell(yn, -0.05, 0.5)) * hs;
      const p = shape.point(Math.max(yn, -0.97), a, new Vector3(), thick);
      if (extraDown > 0) {
        // Di bawah dagu: kain melingkari leher lalu melebar ke bahu.
        p.y = shape.hh * -0.97 - extraDown * hs;
        const r = (0.062 + 0.5 * extraDown) * hs;
        const len = Math.hypot(p.x, p.z + 0.004) || 1;
        const k = Math.max(r, len * (1 - smooth(0, 0.03, extraDown) * 0.25)) / len;
        p.x *= k;
        p.z = (p.z + 0.004) * k - 0.004 - 0.012 * hs * smooth(0, 0.05, extraDown);
      }
      row.push(p);
    }
    rows.push(row);
  };
  for (let i = 0; i <= 22; i++) add(Math.cos((i / 22) * Math.PI * 0.985));
  for (const d of [0.012, 0.03, 0.05, 0.075]) add(-0.97, d);
  geo.addGrid(rows, center, false);
  const mesh = new Mesh(track(geo.build(false)), mat);
  mesh.castShadow = true;
  group.add(mesh);

  // Ciput (lapisan dalam) di tepi dahi.
  const band = new GeoBuilder();
  const bRows: Vector3[][] = [];
  for (const yn of [top + 0.02, top - 0.035]) {
    const row: Vector3[] = [];
    for (let j = 0; j <= 16; j++) row.push(shape.point(yn, -0.95 + (1.9 * j) / 16, new Vector3(), 0.0045 * hs));
    bRows.push(row);
  }
  band.addGrid(bRows, center, false);
  group.add(new Mesh(track(band.build(false)), inner));
}
