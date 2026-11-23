/**
 * Bahan kain realistis (prosedural): kilau serat (sheen) di tepi siluet, tenunan/rajutan halus
 * yang terlihat dari dekat, dan lipatan-kerut lembut yang memecah permukaan licin — tanpa berkas
 * tekstur. Dicuplik triplanar di ruang ikat sehingga pola menempel pada kain saat tubuh bergerak.
 */
import { Color, DataTexture, LinearFilter, LinearMipmapLinearFilter, MeshPhysicalMaterial, RepeatWrapping, RGBAFormat, UnsignedByteType } from 'three';
import { skinDetailTexture } from './skin';

export type ClothKind = 'kemeja' | 'kaos' | 'jins' | 'kain' | 'seragam' | 'selimut';

let weaveTex: DataTexture | null = null;

/** Tekstur tenunan tileable 64²: R = anyaman polos, G = kepar (jins), B = rajutan (kaos), A = serat acak. */
function weaveTexture(): DataTexture {
  if (weaveTex) return weaveTex;
  const N = 64;
  const data = new Uint8Array(N * N * 4);
  let h = 4242;
  const rnd = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) + 0x9e3779b9;
    return ((h >>> 8) & 0xffff) / 65535;
  };
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const k = (y * N + x) * 4;
      // Anyaman polos: benang lungsin & pakan bergantian (8 px per benang).
      const cx = Math.floor(x / 8);
      const cy = Math.floor(y / 8);
      const fx = (x % 8) / 8;
      const fy = (y % 8) / 8;
      const warpUp = (cx + cy) % 2 === 0;
      const plain = warpUp ? Math.sin(fx * Math.PI) * (0.6 + 0.4 * Math.sin(fy * Math.PI)) : Math.sin(fy * Math.PI) * (0.6 + 0.4 * Math.sin(fx * Math.PI));
      // Kepar 2/1: garis diagonal.
      const twill = 0.5 + 0.5 * Math.sin(((x + y) / N) * Math.PI * 2 * 10);
      // Rajutan: deretan "V" kecil.
      const kx = x % 8;
      const ky = y % 8;
      const knit = Math.max(0, 1 - Math.abs(Math.abs(kx - 4) * 0.5 - (ky / 8) * 2 + 0.5));
      data[k] = Math.round(255 * Math.min(1, plain));
      data[k + 1] = Math.round(255 * twill);
      data[k + 2] = Math.round(255 * Math.min(1, knit));
      data[k + 3] = Math.round(255 * rnd());
    }
  }
  const tex = new DataTexture(data, N, N, RGBAFormat, UnsignedByteType);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  weaveTex = tex;
  return tex;
}

const KIND: Record<ClothKind, { weave: [number, number, number]; period: number; fold: number; sheen: number; rough: number }> = {
  kemeja: { weave: [1, 0, 0], period: 0.0028, fold: 1, sheen: 0.45, rough: 0.82 },
  kaos: { weave: [0, 0, 1], period: 0.0032, fold: 0.85, sheen: 0.6, rough: 0.9 },
  jins: { weave: [0, 1, 0], period: 0.0055, fold: 1.1, sheen: 0.32, rough: 0.86 },
  kain: { weave: [1, 0, 0], period: 0.0032, fold: 1, sheen: 0.55, rough: 0.92 },
  seragam: { weave: [1, 0, 0], period: 0.0026, fold: 0.9, sheen: 0.4, rough: 0.78 },
  selimut: { weave: [0, 0, 1], period: 0.008, fold: 0.9, sheen: 0.75, rough: 0.95 },
};

export interface ClothOptions {
  color: string | Color;
  kind?: ClothKind;
  roughness?: number;
  /** Skala lipatan (mis. selimut di bed lebih besar). */
  foldScale?: number;
}

/** Bahan kain fisik dengan kilau serat, tenunan halus, dan lipatan lembut. */
export function createClothMaterial(opts: ClothOptions): MeshPhysicalMaterial {
  const k = KIND[opts.kind ?? 'kemeja'];
  const color = new Color(opts.color);
  const mat = new MeshPhysicalMaterial({
    color,
    roughness: opts.roughness ?? k.rough,
    metalness: 0,
    sheen: k.sheen,
    sheenRoughness: 0.62,
    sheenColor: color.clone().lerp(new Color('#ffffff'), 0.35),
    specularIntensity: 0.3,
  });
  const uniforms = {
    uWeave: { value: weaveTexture() },
    uFoldTex: { value: skinDetailTexture() },
    uWeaveW: { value: k.weave },
    // Satu ubin tekstur = 8 benang.
    uPeriod: { value: k.period },
    uFold: { value: k.fold },
    uFoldScale: { value: opts.foldScale ?? 1 },
  };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vClothP;\nvarying vec3 vClothN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvClothP = position;\nvClothN = normal;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vClothP;
        varying vec3 vClothN;
        uniform sampler2D uWeave;
        uniform sampler2D uFoldTex;
        uniform vec3 uWeaveW;
        uniform float uPeriod;
        uniform float uFold;
        uniform float uFoldScale;
        vec4 clothTri(sampler2D t, float scale) {
          vec3 w = pow(abs(normalize(vClothN)), vec3(4.0));
          w /= (w.x + w.y + w.z + 1e-5);
          vec3 p = vClothP * scale;
          return texture2D(t, p.yz) * w.x + texture2D(t, p.zx) * w.y + texture2D(t, p.xy) * w.z;
        }`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        {
          float px = length(fwidth(vClothP)) + 1e-6;
          vec4 wv = clothTri(uWeave, 1.0 / uPeriod);
          float weave = dot(wv.rgb, uWeaveW) + (wv.a - 0.5) * 0.3;
          float fadeW = 1.0 - smoothstep(uPeriod * 0.06, uPeriod * 0.22, px);
          // Lipatan lembut (± 4–8 cm) dan kerut halus (± 1,5 cm) bertepi landai.
          vec4 f1 = clothTri(uFoldTex, 1.0 / (0.42 * uFoldScale));
          vec4 f2 = clothTri(uFoldTex, 1.0 / (0.16 * uFoldScale));
          float h = (f1.g - 0.5) * 0.0024 * uFold + (f2.g - 0.5) * 0.0006 * uFold + weave * 0.00006 * fadeW;
          vec3 sx = dFdx(-vViewPosition);
          vec3 sy = dFdy(-vViewPosition);
          vec3 r1 = cross(sy, normal);
          vec3 r2 = cross(normal, sx);
          float det = dot(sx, r1) * faceDirection;
          vec3 grad = sign(det) * (dFdx(h) * r1 + dFdy(h) * r2);
          normal = normalize(abs(det) * normal - grad);
          // Warna sedikit bervariasi (pudar/kusut) — bukan satu warna rata.
          diffuseColor.rgb *= 0.93 + 0.14 * f1.b;
        }`,
      );
  };
  mat.customProgramCacheKey = () => 'kain-v1';
  return mat;
}
