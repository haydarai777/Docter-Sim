/**
 * Decal pada permukaan tubuh: memproyeksikan kotak (proyektor) ke geometri — termasuk geometri
 * SkinnedMesh dalam pose ikat — lalu memotong segitiga di dalam kotak (Sutherland–Hodgman) dan
 * menyalin bobot tulang, sehingga decal (luka, darah, rembesan) ikut menekuk persis bersama kulit.
 *
 * Juga: bahan "muncul bertahap" (reveal) untuk aliran darah & rembesan yang meluas seiring
 * banyaknya darah yang keluar, tanpa membuat ulang tekstur.
 */
import {
  BufferGeometry,
  Float32BufferAttribute,
  type Material,
  type Matrix4,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type Texture,
  Uint16BufferAttribute,
  Vector3,
} from 'three';

export interface Projector {
  /** Pusat kotak (ruang jangkar). */
  center: Vector3;
  /** Arah keluar permukaan (sumbu Z proyektor). */
  normal: Vector3;
  /** Arah "atas" tekstur (sumbu Y proyektor; diortogonalkan terhadap normal). */
  up: Vector3;
  width: number;
  height: number;
  depth: number;
}

export interface DecalTarget {
  geometry: BufferGeometry;
  /** Matriks geometri → ruang jangkar (null = identitas). */
  matrix: Matrix4 | null;
  skinned: boolean;
}

interface PolyV {
  p: Vector3;
  b: [number, number, number];
}

const PLANES: [number, number][] = [
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [2, 1],
  [2, -1],
];

/**
 * Proyeksikan decal ke beberapa geometri. Hasil dalam ruang jangkar; null bila tidak mengenai
 * apa pun. `offset` = jarak angkat dari permukaan (m) mencegah z-fighting.
 */
export function projectDecal(targets: readonly DecalTarget[], pr: Projector, offset = 0.0006, minFacing = 0.12): BufferGeometry | null {
  const zAxis = pr.normal.clone().normalize();
  const xAxis = new Vector3().crossVectors(pr.up, zAxis);
  if (xAxis.lengthSq() < 1e-8) xAxis.set(1, 0, 0);
  xAxis.normalize();
  const yAxis = new Vector3().crossVectors(zAxis, xAxis).normalize();
  const half = [pr.width / 2, pr.height / 2, pr.depth / 2];
  const skinned = targets.some((t) => t.skinned);
  const outPos: number[] = [];
  const outNrm: number[] = [];
  const outUv: number[] = [];
  const outSkI: number[] = [];
  const outSkW: number[] = [];

  const toProj = (v: Vector3, out: Vector3) => {
    const dx = v.x - pr.center.x;
    const dy = v.y - pr.center.y;
    const dz = v.z - pr.center.z;
    return out.set(dx * xAxis.x + dy * xAxis.y + dz * xAxis.z, dx * yAxis.x + dy * yAxis.y + dz * yAxis.z, dx * zAxis.x + dy * zAxis.y + dz * zAxis.z);
  };
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  const e1 = new Vector3();
  const e2 = new Vector3();
  const fn = new Vector3();
  const tmpN = new Vector3();

  for (const t of targets) {
    const geo = t.geometry;
    const pos = geo.getAttribute('position');
    const nrm = geo.getAttribute('normal');
    const skI = geo.getAttribute('skinIndex');
    const skW = geo.getAttribute('skinWeight');
    const index = geo.getIndex();
    const triCount = index ? index.count / 3 : pos.count / 3;
    // Matriks bercermin (skala −1, mis. tangan kanan) membalik urutan titik segitiga.
    const flip = t.matrix && t.matrix.determinant() < 0 ? -1 : 1;
    const get = (i: number, out: Vector3) => {
      out.fromBufferAttribute(pos, i);
      if (t.matrix) out.applyMatrix4(t.matrix);
      return out;
    };
    const getN = (i: number, out: Vector3) => {
      out.fromBufferAttribute(nrm, i);
      if (t.matrix) out.transformDirection(t.matrix);
      return out;
    };
    for (let tri = 0; tri < triCount; tri++) {
      const i0 = index ? index.getX(tri * 3) : tri * 3;
      const i1 = index ? index.getX(tri * 3 + 1) : tri * 3 + 1;
      const i2 = index ? index.getX(tri * 3 + 2) : tri * 3 + 2;
      get(i0, a);
      get(i1, b);
      get(i2, c);
      // Hanya permukaan yang menghadap proyektor (cegah tembus ke sisi belakang tungkai).
      e1.subVectors(b, a);
      e2.subVectors(c, a);
      fn.crossVectors(e1, e2);
      const fl = fn.length();
      if (fl < 1e-12) continue;
      if ((flip * fn.dot(zAxis)) / fl < minFacing) continue;
      const pa = toProj(a, new Vector3());
      const pb = toProj(b, new Vector3());
      const pc = toProj(c, new Vector3());
      // Tolak cepat: seluruh segitiga di luar satu bidang kotak.
      let out = false;
      for (let ax = 0; ax < 3 && !out; ax++) {
        const h = half[ax]!;
        const va = pa.getComponent(ax);
        const vb = pb.getComponent(ax);
        const vc = pc.getComponent(ax);
        if ((va > h && vb > h && vc > h) || (va < -h && vb < -h && vc < -h)) out = true;
      }
      if (out) continue;
      let poly: PolyV[] = [
        { p: pa, b: [1, 0, 0] },
        { p: pb, b: [0, 1, 0] },
        { p: pc, b: [0, 0, 1] },
      ];
      for (const [ax, sgn] of PLANES) {
        poly = clip(poly, ax, sgn, half[ax]!);
        if (poly.length < 3) break;
      }
      if (poly.length < 3) continue;
      const emit = (v: PolyV) => {
        const p = v.p;
        // Normal halus diinterpolasi dari normal titik sumber.
        tmpN.set(0, 0, 0);
        const ids = [i0, i1, i2];
        for (let k = 0; k < 3; k++) {
          const w = v.b[k]!;
          if (w > 0) tmpN.addScaledVector(getN(ids[k]!, e1), w);
        }
        tmpN.normalize();
        const wx = pr.center.x + xAxis.x * p.x + yAxis.x * p.y + zAxis.x * p.z + tmpN.x * offset;
        const wy = pr.center.y + xAxis.y * p.x + yAxis.y * p.y + zAxis.y * p.z + tmpN.y * offset;
        const wz = pr.center.z + xAxis.z * p.x + yAxis.z * p.y + zAxis.z * p.z + tmpN.z * offset;
        outPos.push(wx, wy, wz);
        outNrm.push(tmpN.x, tmpN.y, tmpN.z);
        outUv.push(p.x / pr.width + 0.5, p.y / pr.height + 0.5);
        if (skinned) {
          // Bobot tulang dari titik sumber terdekat (koordinat barisentrik terbesar).
          let best = 0;
          if (v.b[1] > v.b[best]!) best = 1;
          if (v.b[2] > v.b[best]!) best = 2;
          const src = ids[best]!;
          if (skI && skW) {
            outSkI.push(skI.getX(src), skI.getY(src), skI.getZ(src), skI.getW(src));
            outSkW.push(skW.getX(src), skW.getY(src), skW.getZ(src), skW.getW(src));
          } else {
            outSkI.push(0, 0, 0, 0);
            outSkW.push(1, 0, 0, 0);
          }
        }
      };
      for (let k = 1; k < poly.length - 1; k++) {
        emit(poly[0]!);
        emit(poly[k]!);
        emit(poly[k + 1]!);
      }
    }
  }
  if (!outPos.length) return null;
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(outPos, 3));
  geo.setAttribute('normal', new Float32BufferAttribute(outNrm, 3));
  geo.setAttribute('uv', new Float32BufferAttribute(outUv, 2));
  if (skinned) {
    geo.setAttribute('skinIndex', new Uint16BufferAttribute(outSkI, 4));
    geo.setAttribute('skinWeight', new Float32BufferAttribute(outSkW, 4));
  }
  geo.computeBoundingSphere();
  return geo;
}

function clip(poly: PolyV[], axis: number, sign: number, limit: number): PolyV[] {
  const out: PolyV[] = [];
  const inside = (v: PolyV) => sign * v.p.getComponent(axis) <= limit;
  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i]!;
    const prev = poly[(i + poly.length - 1) % poly.length]!;
    const cin = inside(cur);
    const pin = inside(prev);
    if (cin !== pin) {
      const dc = sign * cur.p.getComponent(axis) - limit;
      const dp = sign * prev.p.getComponent(axis) - limit;
      const t = dp / (dp - dc);
      out.push({
        p: prev.p.clone().lerp(cur.p, t),
        b: [prev.b[0] + (cur.b[0] - prev.b[0]) * t, prev.b[1] + (cur.b[1] - prev.b[1]) * t, prev.b[2] + (cur.b[2] - prev.b[2]) * t],
      });
    }
    if (cin) out.push(cur);
  }
  return out;
}

/** Bahan decal luka: peta warna+alfa, normal, kekasaran; di atas kulit tanpa z-fighting. */
export function woundMaterial(map: Texture, normal: Texture | null, rough: Texture | null): MeshStandardMaterial {
  return new MeshStandardMaterial({
    map,
    normalMap: normal ?? undefined,
    roughnessMap: rough ?? undefined,
    roughness: 1,
    metalness: 0,
    transparent: true,
    depthWrite: false,
    alphaTest: 0.01,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -4,
  });
}

export interface RevealMaterial {
  material: Material;
  /** 0 = tidak tampak … 1 = tampak penuh. */
  setReveal(v: number): void;
}

/**
 * Bahan darah yang muncul bertahap. `mode` 'radial' = meluas dari tengah (genangan/rembesan),
 * 'down' = mengalir dari atas ke bawah tekstur (aliran darah). `wet` = kilap darah segar.
 */
export function revealMaterial(map: Texture, mode: 'radial' | 'down', wet: boolean): RevealMaterial {
  const uniforms = { uReveal: { value: 0 } };
  const mat = wet
    ? new MeshPhysicalMaterial({ map, roughness: 0.12, metalness: 0, clearcoat: 0.8, clearcoatRoughness: 0.08, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 })
    : new MeshStandardMaterial({ map, roughness: 0.78, metalness: 0, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uReveal = uniforms.uReveal;
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'uniform float uReveal;\nvoid main() {')
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        {
          float ord = ${mode === 'radial' ? 'length(vMapUv - 0.5) * 2.0' : '1.0 - vMapUv.y'};
          ord += (sin(vMapUv.x * 23.0 + vMapUv.y * 17.0) * sin(vMapUv.y * 29.0 - vMapUv.x * 11.0)) * 0.05;
          diffuseColor.a *= smoothstep(uReveal, uReveal - 0.06, ord);
          if (diffuseColor.a < 0.01) discard;
        }`,
      );
  };
  mat.customProgramCacheKey = () => `reveal-${mode}-${wet ? 1 : 0}`;
  return {
    material: mat,
    setReveal(v: number) {
      uniforms.uReveal.value = v;
      mat.visible = v > 0.005;
    },
  };
}
