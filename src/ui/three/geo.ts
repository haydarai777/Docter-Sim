/**
 * Pembangun geometri "loft": permukaan dibentuk dari deretan penampang (cincin) berbentuk
 * superelips yang berbeda lebar/tebal depan/tebal belakang. Dipakai untuk membuat bagian tubuh
 * berbentuk anatomis (torso, lengan, kaki, kepala, rambut) — bukan sekadar kapsul & bola.
 *
 * Tiap titik bisa diberi bobot tulang (skin weights) sehingga satu permukaan menyatu ikut
 * menekuk halus di sendi (SkinnedMesh).
 */
import { BufferGeometry, Float32BufferAttribute, Uint16BufferAttribute, Vector3 } from 'three';

/** Pengaruh tulang pada satu titik: [indeks tulang, bobot]. */
export type Weights = readonly (readonly [number, number])[];

export interface Ring {
  /** Pusat penampang. */
  c: readonly [number, number, number];
  /** Setengah lebar (sumbu U). */
  rx: number;
  /** Jari-jari ke arah +V (mis. depan). */
  rf: number;
  /** Jari-jari ke arah −V (mis. belakang). Default = rf. */
  rb?: number;
  /** Eksponen superelips (2 = elips; lebih besar = lebih kotak). */
  n?: number;
  /** Kemiringan penampang: geseran sepanjang sumbu loft per satuan V (depan lebih rendah bila negatif). */
  tilt?: number;
  /** Lengkung pelana: geseran sepanjang sumbu loft per satuan |V| (depan & belakang sama-sama turun bila negatif). */
  bow?: number;
  /** Turunan sisi depan saja (V > 0): di tengah depan geserannya dip × rf (garis leher depan lebih rendah). */
  dip?: number;
  /** Bobot tulang: sama untuk seluruh cincin, atau fungsi posisi titik. */
  w?: Weights | ((x: number, y: number, z: number) => Weights);
  /** Koordinat v tekstur (default: panjang kumulatif). */
  v?: number;
}

export interface LoftOptions {
  segments?: number;
  /** Tutup ujung awal/akhir dengan titik di pusat cincin. */
  capStart?: boolean;
  capEnd?: boolean;
  /** Sumbu penampang (default: U = +X, V = +Z → cincin mendatar, loft sepanjang Y). */
  u?: Vector3;
  v?: Vector3;
  /** Rentang sudut penampang untuk loft terbuka (mis. selubung rambut yang tidak menutup wajah). */
  arc?: readonly [number, number];
  /** Ulangi tekstur n kali mengelilingi penampang. */
  uRepeat?: number;
}

const AXIS_X = new Vector3(1, 0, 0);
const AXIS_Z = new Vector3(0, 0, 1);

/** sign(t)·|t|^(2/n): komponen superelips. */
export function spow(t: number, n: number): number {
  return n === 2 ? t : Math.sign(t) * Math.pow(Math.abs(t), 2 / n);
}

/** Titik pada penampang untuk sudut `a` (0 = arah +V/depan, π/2 = arah +U). */
export function ringPoint(ring: Ring, a: number, u: Vector3, v: Vector3, out: Vector3): Vector3 {
  const n = ring.n ?? 2;
  const cu = spow(Math.sin(a), n) * ring.rx;
  const cv = spow(Math.cos(a), n);
  const dv = cv >= 0 ? cv * ring.rf : cv * (ring.rb ?? ring.rf);
  out.set(ring.c[0], ring.c[1], ring.c[2]).addScaledVector(u, cu).addScaledVector(v, dv);
  if (ring.tilt || ring.bow || ring.dip) {
    // Geser sepanjang sumbu loft (tegak lurus U & V).
    AX.crossVectors(v, u).normalize();
    // `dip` naik secara kuadratik dari sisi ke depan → garis leher melengkung halus (tanpa sudut).
    const front = Math.max(0, dv);
    out.addScaledVector(AX, (ring.tilt ?? 0) * dv + (ring.bow ?? 0) * Math.abs(dv) + ((ring.dip ?? 0) * front * front) / Math.max(1e-6, ring.rf));
  }
  return out;
}
const AX = new Vector3();

/** Interpolasi halus (Hermite/Catmull-Rom tak seragam) pada tabel stasiun [posisi, nilai…]. */
export function sampleStations(stations: readonly (readonly number[])[], pos: number): number[] {
  const n = stations.length;
  const first = stations[0]!;
  const last = stations[n - 1]!;
  if (pos <= first[0]!) return first.slice(1);
  if (pos >= last[0]!) return last.slice(1);
  let i = 0;
  while (i < n - 2 && pos > stations[i + 1]![0]!) i++;
  const a = stations[i]!;
  const b = stations[i + 1]!;
  const p = stations[Math.max(0, i - 1)]!;
  const q = stations[Math.min(n - 1, i + 2)]!;
  const h = b[0]! - a[0]!;
  const t = (pos - a[0]!) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  const out: number[] = [];
  for (let k = 1; k < a.length; k++) {
    const m0 = i === 0 ? (b[k]! - a[k]!) / h : (b[k]! - p[k]!) / (b[0]! - p[0]!);
    const m1 = i + 2 > n - 1 ? (b[k]! - a[k]!) / h : (q[k]! - a[k]!) / (q[0]! - a[0]!);
    out.push((2 * t3 - 3 * t2 + 1) * a[k]! + (t3 - 2 * t2 + t) * h * m0 + (-2 * t3 + 3 * t2) * b[k]! + (t3 - t2) * h * m1);
  }
  return out;
}

export const smooth = (edge0: number, edge1: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/** Campur dua tulang dengan faktor k (0 = a, 1 = b). */
export function blend(a: number, b: number, k: number): Weights {
  const t = Math.max(0, Math.min(1, k));
  if (t <= 0.001) return [[a, 1]];
  if (t >= 0.999) return [[b, 1]];
  return [
    [a, 1 - t],
    [b, t],
  ];
}

export class GeoBuilder {
  private readonly pos: number[] = [];
  private readonly uv: number[] = [];
  private readonly skinIndex: number[] = [];
  private readonly skinWeight: number[] = [];
  private readonly index: number[] = [];
  /** Pasangan titik kembar di sambungan (normalnya disamakan agar tidak tampak garis). */
  private readonly seams: [number, number][] = [];
  private readonly p = new Vector3();
  private readonly e1 = new Vector3();
  private readonly e2 = new Vector3();
  private readonly nrm = new Vector3();

  get vertexCount(): number {
    return this.pos.length / 3;
  }

  private pushVertex(x: number, y: number, z: number, u: number, v: number, w: Weights | undefined): number {
    const i = this.pos.length / 3;
    this.pos.push(x, y, z);
    this.uv.push(u, v);
    // Paling banyak 4 pengaruh per titik: ambil yang terbesar.
    const list = w && w.length > 4 ? [...w].sort((a, b) => b[1] - a[1]).slice(0, 4) : (w ?? [[0, 1]]);
    let sum = 0;
    for (const [, weight] of list) sum += weight;
    for (let k = 0; k < 4; k++) {
      const entry = list[k];
      this.skinIndex.push(entry ? entry[0] : 0);
      this.skinWeight.push(entry ? entry[1] / (sum || 1) : 0);
    }
    return i;
  }

  /** Tambah permukaan loft dari deretan cincin. */
  addLoft(rings: readonly Ring[], options: LoftOptions = {}): void {
    if (rings.length < 2) return;
    const seg = options.segments ?? 16;
    const u = options.u ?? AXIS_X;
    const v = options.v ?? AXIS_Z;
    const arc = options.arc;
    const closed = !arc;
    const a0 = arc ? arc[0] : 0;
    const a1 = arc ? arc[1] : Math.PI * 2;
    const uRep = options.uRepeat ?? 1;
    const start = this.vertexCount;
    const p = this.p;
    let vAcc = 0;
    let prev: Ring | null = null;
    for (const ring of rings) {
      if (prev) vAcc += Math.hypot(ring.c[0] - prev.c[0], ring.c[1] - prev.c[1], ring.c[2] - prev.c[2]);
      prev = ring;
      const vv = ring.v ?? vAcc;
      const first = this.vertexCount;
      for (let j = 0; j <= seg; j++) {
        const a = a0 + ((a1 - a0) * j) / seg;
        ringPoint(ring, a, u, v, p);
        const w = typeof ring.w === 'function' ? ring.w(p.x, p.y, p.z) : ring.w;
        this.pushVertex(p.x, p.y, p.z, (j / seg) * uRep, vv, w);
      }
      if (closed) this.seams.push([first, first + seg]);
    }
    const stride = seg + 1;
    const quads: number[] = [];
    for (let i = 0; i < rings.length - 1; i++) {
      for (let j = 0; j < seg; j++) {
        const a = start + i * stride + j;
        const b = start + (i + 1) * stride + j;
        quads.push(a, b, b + 1, a, b + 1, a + 1);
      }
    }
    const cap = (ringIndex: number, atStart: boolean) => {
      const ring = rings[ringIndex]!;
      const w = typeof ring.w === 'function' ? ring.w(ring.c[0], ring.c[1], ring.c[2]) : ring.w;
      const center = this.pushVertex(ring.c[0], ring.c[1], ring.c[2], 0.5, ring.v ?? (atStart ? 0 : vAcc), w);
      const base = start + ringIndex * stride;
      for (let j = 0; j < seg; j++) {
        if (atStart) quads.push(center, base + j, base + j + 1);
        else quads.push(center, base + j + 1, base + j);
      }
    };
    if (options.capStart) cap(0, true);
    if (options.capEnd) cap(rings.length - 1, false);

    // Pastikan arah lilitan menghadap keluar: uji segitiga pertama terhadap arah dari pusat cincin.
    const i0 = quads[0]!;
    const i1 = quads[1]!;
    const i2 = quads[2]!;
    const P = (i: number, out: Vector3) => out.set(this.pos[i * 3]!, this.pos[i * 3 + 1]!, this.pos[i * 3 + 2]!);
    P(i0, p);
    this.e1.set(this.pos[i1 * 3]! - p.x, this.pos[i1 * 3 + 1]! - p.y, this.pos[i1 * 3 + 2]! - p.z);
    this.e2.set(this.pos[i2 * 3]! - p.x, this.pos[i2 * 3 + 1]! - p.y, this.pos[i2 * 3 + 2]! - p.z);
    this.nrm.crossVectors(this.e1, this.e2);
    const c = rings[0]!.c;
    const c1 = rings[1]!.c;
    const outward = this.e2.set(p.x - (c[0] + c1[0]) / 2, p.y - (c[1] + c1[1]) / 2, p.z - (c[2] + c1[2]) / 2);
    const flip = this.nrm.dot(outward) < 0;
    for (let k = 0; k < quads.length; k += 3) {
      if (flip) this.index.push(quads[k]!, quads[k + 2]!, quads[k + 1]!);
      else this.index.push(quads[k]!, quads[k + 1]!, quads[k + 2]!);
    }
  }

  /**
   * Tambah permukaan dari kisi titik bebas (baris × kolom) — untuk bentuk yang penampangnya
   * tidak datar, mis. tengkorak, selubung rambut yang mengikuti garis rambut, atau hijab.
   * `closed` = kolom terakhir menyambung ke kolom pertama. `center` = titik di dalam bentuk
   * (menentukan sisi luar). UV: u mengikuti kolom, v mengikuti baris (baris pertama v = 1).
   */
  addGrid(rows: readonly (readonly Vector3[])[], center: Vector3, closed: boolean, opts: { uRepeat?: number; weights?: Weights; flipOutside?: boolean } = {}): void {
    if (rows.length < 2) return;
    const cols = rows[0]!.length;
    const start = this.vertexCount;
    const stride = closed ? cols + 1 : cols;
    const uRep = opts.uRepeat ?? 1;
    rows.forEach((row, i) => {
      const first = this.vertexCount;
      for (let j = 0; j < stride; j++) {
        const q = row[j % cols]!;
        this.pushVertex(q.x, q.y, q.z, (j / (stride - 1)) * uRep, 1 - i / (rows.length - 1), opts.weights);
      }
      if (closed) this.seams.push([first, first + cols]);
    });
    const tris: number[] = [];
    for (let i = 0; i < rows.length - 1; i++) {
      for (let j = 0; j < stride - 1; j++) {
        const a = start + i * stride + j;
        const b = start + (i + 1) * stride + j;
        tris.push(a, b, b + 1, a, b + 1, a + 1);
      }
    }
    // Orientasi: cari segitiga yang tidak merosot, lalu bandingkan normalnya dengan arah dari pusat.
    let flip = false;
    for (let k = 0; k < tris.length; k += 3) {
      const i0 = tris[k]!;
      const i1 = tris[k + 1]!;
      const i2 = tris[k + 2]!;
      const p = this.p.set(this.pos[i0 * 3]!, this.pos[i0 * 3 + 1]!, this.pos[i0 * 3 + 2]!);
      this.e1.set(this.pos[i1 * 3]! - p.x, this.pos[i1 * 3 + 1]! - p.y, this.pos[i1 * 3 + 2]! - p.z);
      this.e2.set(this.pos[i2 * 3]! - p.x, this.pos[i2 * 3 + 1]! - p.y, this.pos[i2 * 3 + 2]! - p.z);
      this.nrm.crossVectors(this.e1, this.e2);
      if (this.nrm.lengthSq() < 1e-12) continue;
      flip = this.nrm.dot(this.e2.copy(p).sub(center)) < 0;
      break;
    }
    if (opts.flipOutside) flip = !flip;
    for (let k = 0; k < tris.length; k += 3) {
      if (flip) this.index.push(tris[k]!, tris[k + 2]!, tris[k + 1]!);
      else this.index.push(tris[k]!, tris[k + 1]!, tris[k + 2]!);
    }
  }

  /** Bangun BufferGeometry (dengan normal halus; atribut skin bila `skinned`). */
  build(skinned = true): BufferGeometry {
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(this.pos, 3));
    geo.setAttribute('uv', new Float32BufferAttribute(this.uv, 2));
    if (skinned) {
      geo.setAttribute('skinIndex', new Uint16BufferAttribute(this.skinIndex, 4));
      geo.setAttribute('skinWeight', new Float32BufferAttribute(this.skinWeight, 4));
    }
    geo.setIndex(this.index);
    geo.computeVertexNormals();
    // Samakan normal di sambungan penampang.
    const normal = geo.getAttribute('normal');
    for (const [a, b] of this.seams) {
      const x = normal.getX(a) + normal.getX(b);
      const y = normal.getY(a) + normal.getY(b);
      const z = normal.getZ(a) + normal.getZ(b);
      const len = Math.hypot(x, y, z) || 1;
      normal.setXYZ(a, x / len, y / len, z / len);
      normal.setXYZ(b, x / len, y / len, z / len);
    }
    geo.computeBoundingSphere();
    return geo;
  }
}
