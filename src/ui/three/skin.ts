/**
 * Bahan kulit manusia yang realistis — seluruhnya prosedural, tanpa berkas tekstur:
 *
 * - **Hamburan bawah permukaan** (subsurface scattering) diperkirakan dengan "wrap lighting"
 *   per kanal warna: cahaya merah menembus lebih jauh di bawah kulit, sehingga batas terang–gelap
 *   melembut dan kemerahan (seperti kulit sungguhan, bukan plastik/lilin).
 * - **Relief mikro**: pori, garis halus kulit, dan tonjolan lembut — peta tinggi tileable yang
 *   dicuplik triplanar pada RUANG IKAT tubuh (ikut menempel saat tubuh bergerak) lalu dijadikan
 *   normal lewat turunan layar (bump mapping Mikkelsen); memudar otomatis bila lebih kecil dari
 *   piksel agar tidak berkedip.
 * - **Variasi warna**: bercak kemerahan/kecokelatan halus, tahi lalat & bintik, kekasaran yang
 *   tidak seragam (kilap pada tonjolan, lebih kusam di lekuk).
 * - **Bercak regional** (areola/puting, pusar, siku, lutut, buku jari) dari titik-titik ruang ikat.
 * - **Bulu halus** (sheen) di tepi siluet & **keringat** (lapisan bening mengilap, diaforesis).
 */
import { Color, DataTexture, LinearFilter, LinearMipmapLinearFilter, MeshPhysicalMaterial, RepeatWrapping, RGBAFormat, ShaderChunk, UnsignedByteType, Vector3, Vector4 } from 'three';

/** Bercak warna regional pada kulit (ruang ikat mesh). */
export interface SkinSpot {
  center: Vector3;
  /** Jari-jari (m). */
  radius: number;
  /** Warna bercak (dicampur ke warna kulit). */
  color: Color;
  /** 0..1 kekuatan. */
  strength: number;
  /** Ketajaman tepi 0 (lembut) .. 1 (tegas). */
  edge?: number;
}

export interface SkinOptions {
  color: Color;
  /** Kekuatan relief mikro 0..1 (anak lebih halus, lansia lebih kasar). */
  detail?: number;
  /** Keriput/kekasaran usia 0..1. */
  age?: number;
  /** Kekuatan hamburan bawah permukaan (default 1). */
  sss?: number;
  /** Bintik/tahi lalat 0..1. */
  freckles?: number;
  spots?: SkinSpot[];
  /** Skala ruang ikat terhadap meter (mis. tangan/kepala yang diskalakan). */
  unit?: number;
}

const MAX_SPOTS = 6;
const N = 256;

let detailTex: DataTexture | null = null;

/**
 * Tekstur detail kulit tileable (dibuat sekali, dipakai bersama semua karakter):
 * R = relief mikro (pori + garis halus), G = relief makro lembut, B = bercak warna, A = bintik.
 */
export function skinDetailTexture(): DataTexture {
  if (detailTex) return detailTex;
  const data = new Uint8Array(N * N * 4);
  // Derau nilai periodik (tileable) dengan beberapa oktaf.
  const lattice = (period: number, seed: number) => {
    const g = new Float32Array(period * period);
    let h = seed >>> 0;
    for (let i = 0; i < g.length; i++) {
      h = Math.imul(h ^ (h >>> 15), 2246822519) ^ Math.imul(h + 0x9e3779b9, 3266489917);
      g[i] = ((h >>> 8) & 0xffff) / 65535;
    }
    return (x: number, y: number) => {
      const fx = (x / N) * period;
      const fy = (y / N) * period;
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const tx = fx - x0;
      const ty = fy - y0;
      const sx = tx * tx * (3 - 2 * tx);
      const sy = ty * ty * (3 - 2 * ty);
      const at = (i: number, j: number) => g[(((j % period) + period) % period) * period + (((i % period) + period) % period)]!;
      const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx;
      const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx;
      return a + (b - a) * sy;
    };
  };
  const n4 = lattice(4, 11);
  const n8 = lattice(8, 23);
  const n16 = lattice(16, 37);
  const n32 = lattice(32, 51);
  const n64 = lattice(64, 67);
  const n128 = lattice(128, 79);
  // Pori: titik-titik acak pada kisi bergetar (jarak ± 6 px).
  const pore = new Float32Array(N * N);
  let h = 1234567;
  const rnd = () => {
    h = Math.imul(h ^ (h >>> 13), 1274126177) + 0x6d2b79f5;
    return ((h >>> 9) & 0xffff) / 65535;
  };
  const cell = 6;
  for (let cy = 0; cy < N / cell; cy++) {
    for (let cx = 0; cx < N / cell; cx++) {
      const px = cx * cell + rnd() * cell;
      const py = cy * cell + rnd() * cell;
      const r = 0.9 + rnd() * 1.1;
      const depth = 0.45 + rnd() * 0.55;
      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          const x = Math.floor(px) + dx;
          const y = Math.floor(py) + dy;
          const d = Math.hypot(x + 0.5 - px, y + 0.5 - py) / r;
          if (d > 1.6) continue;
          const v = depth * Math.exp(-d * d * 1.6);
          const k = ((y + N) % N) * N + ((x + N) % N);
          pore[k] = Math.max(pore[k]!, v);
        }
      }
    }
  }
  // Garis kulit halus: dua keluarga garis bersilangan (pola belah ketupat kulit).
  const lines = (x: number, y: number) => {
    const w = n16(x, y) * 6;
    const a = Math.abs(Math.sin(((x + y * 0.55) / N) * Math.PI * 2 * 22 + w));
    const b = Math.abs(Math.sin(((x * 0.6 - y) / N) * Math.PI * 2 * 19 + w * 0.8));
    return Math.pow(1 - a, 10) * 0.6 + Math.pow(1 - b, 10) * 0.45;
  };
  // Bintik/tahi lalat jarang.
  const spots = new Float32Array(N * N);
  for (let i = 0; i < 26; i++) {
    const px = rnd() * N;
    const py = rnd() * N;
    const r = i < 3 ? 2.2 + rnd() * 1.5 : 0.9 + rnd() * 1.4;
    const s = i < 3 ? 1 : 0.35 + rnd() * 0.45;
    for (let dy = -5; dy <= 5; dy++) {
      for (let dx = -5; dx <= 5; dx++) {
        const x = Math.floor(px) + dx;
        const y = Math.floor(py) + dy;
        const d = Math.hypot(x + 0.5 - px, y + 0.5 - py) / r;
        if (d > 1.3) continue;
        const k = ((y + N) % N) * N + ((x + N) % N);
        spots[k] = Math.max(spots[k]!, s * (1 - Math.min(1, d) ** 3));
      }
    }
  }
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const k = y * N + x;
      const micro = 0.5 + 0.22 * (n128(x, y) - 0.5) + 0.14 * (n64(x, y) - 0.5) - 0.38 * pore[k]! - 0.16 * lines(x, y);
      const macro = 0.5 * n8(x, y) + 0.3 * n16(x, y) + 0.2 * n32(x, y);
      const mottle = 0.55 * n4(x, y) + 0.3 * n8(x, y) + 0.15 * n32(x, y);
      data[k * 4] = Math.round(255 * Math.max(0, Math.min(1, micro)));
      data[k * 4 + 1] = Math.round(255 * Math.max(0, Math.min(1, macro)));
      data[k * 4 + 2] = Math.round(255 * Math.max(0, Math.min(1, mottle)));
      data[k * 4 + 3] = Math.round(255 * Math.max(0, Math.min(1, spots[k]!)));
    }
  }
  const tex = new DataTexture(data, N, N, RGBAFormat, UnsignedByteType);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  detailTex = tex;
  return tex;
}

// --- Potongan shader -------------------------------------------------------------

const VERT_PARS = /* glsl */ `
varying vec3 vBind;
varying vec3 vBindN;
`;
const VERT_MAIN = /* glsl */ `
vBind = position * uSkinUnit;
vBindN = normal;
`;

const FRAG_PARS = /* glsl */ `
varying vec3 vBind;
varying vec3 vBindN;
uniform sampler2D uSkinTex;
uniform float uSkinDetail;
uniform float uSkinAge;
uniform float uSkinFreckle;
uniform vec3 uSssWrap;
uniform vec4 uSpot[${MAX_SPOTS}];
uniform vec4 uSpotCol[${MAX_SPOTS}];
uniform float uSpotEdge[${MAX_SPOTS}];
uniform int uSpotCount;

vec3 skinTriW() {
  vec3 w = pow(abs(normalize(vBindN)), vec3(4.0));
  return w / (w.x + w.y + w.z + 1e-5);
}
vec4 skinTri(float scale) {
  vec3 w = skinTriW();
  vec3 p = vBind * scale;
  return texture2D(uSkinTex, p.yz) * w.x + texture2D(uSkinTex, p.zx + 0.37) * w.y + texture2D(uSkinTex, p.xy + 0.71) * w.z;
}
// Relief dalam meter (ruang ikat) beserta faktor pudar jarak.
float skinHeight(out vec4 macroS) {
  float px = length(fwidth(vBind)) + 1e-6;
  // Pori & garis halus: satu ubin 1,8 cm (pori ± 0,4 mm).
  vec4 microS = skinTri(1.0 / 0.018);
  // Tonjolan lembut & bercak warna: satu ubin 11 cm.
  macroS = skinTri(1.0 / 0.11);
  float fadeMicro = 1.0 - smoothstep(0.00025, 0.0011, px);
  float fadeMacro = 1.0 - smoothstep(0.004, 0.02, px);
  float h = (microS.r - 0.5) * 0.00006 * (0.75 + 0.6 * uSkinAge) * fadeMicro;
  h += (macroS.g - 0.5) * 0.0006 * (0.6 + 0.8 * uSkinAge) * fadeMacro;
  return h * uSkinDetail;
}
// Bump mapping Mikkelsen dengan tinggi dalam satuan dunia (tidak bergantung skala layar).
vec3 skinBump(vec3 surfPos, vec3 surfNorm, float h, float faceDir) {
  vec3 sx = dFdx(surfPos);
  vec3 sy = dFdy(surfPos);
  vec3 r1 = cross(sy, surfNorm);
  vec3 r2 = cross(surfNorm, sx);
  float det = dot(sx, r1) * faceDir;
  vec3 grad = sign(det) * (dFdx(h) * r1 + dFdy(h) * r2);
  return normalize(abs(det) * surfNorm - grad);
}
`;

// Wrap lighting per kanal: merah membungkus paling jauh (hamburan bawah kulit).
const SSS_DIFFUSE = /* glsl */ `
	#ifdef SKIN_SSS
	{
		float ndlRaw = dot( geometryNormal, directLight.direction );
		vec3 wrapW = uSssWrap;
		vec3 sssI = clamp( ( vec3( ndlRaw ) + wrapW ) / ( 1.0 + wrapW ), 0.0, 1.0 );
		// Profil lebih lembut di dekat terminator (mendekati kurva pra-integrasi kulit).
		sssI = mix( sssI * sssI, sssI, 0.55 );
		reflectedLight.directDiffuse += sssI * directLight.color * BRDF_Lambert( material.diffuseColor );
	}
	#else
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	#endif`;
const DIFFUSE_LINE = 'reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );';

const LIGHTS_SKIN = (() => {
  const src = ShaderChunk.lights_physical_pars_fragment;
  return src.includes(DIFFUSE_LINE) ? src.replace(DIFFUSE_LINE, SSS_DIFFUSE) : src;
})();

export interface SkinMaterial extends MeshPhysicalMaterial {
  /** Perbarui bercak regional (mis. setelah bentuk tubuh diketahui). */
  setSpots(spots: SkinSpot[]): void;
  /** Keringat 0..1: lapisan bening mengilap (diaforesis). */
  setSweat(v: number): void;
}

/** Bahan kulit fisik dengan hamburan bawah permukaan, relief mikro, dan variasi warna. */
export function createSkinMaterial(opts: SkinOptions): SkinMaterial {
  const mat = new MeshPhysicalMaterial({
    color: opts.color.clone(),
    roughness: 0.5,
    metalness: 0,
    // Kulit: IOR ± 1,4 → pantulan Fresnel dasar ± 2,8 %.
    ior: 1.4,
    specularIntensity: 0.75,
    sheen: 0.28,
    sheenRoughness: 0.55,
    sheenColor: new Color('#ffe2d2').lerp(opts.color, 0.35),
    // Lobus kilap kedua yang tajam (lapisan minyak tipis kulit) — dua lobus khas kulit manusia.
    clearcoat: 0.1,
    clearcoatRoughness: 0.34,
  }) as SkinMaterial;
  const spotPos = Array.from({ length: MAX_SPOTS }, () => new Vector4(0, 0, 0, 0.0001));
  const spotCol = Array.from({ length: MAX_SPOTS }, () => new Vector4(0, 0, 0, 0));
  const spotEdge = new Array<number>(MAX_SPOTS).fill(0);
  const uniforms = {
    uSkinTex: { value: skinDetailTexture() },
    uSkinDetail: { value: opts.detail ?? 1 },
    uSkinAge: { value: opts.age ?? 0.3 },
    uSkinFreckle: { value: opts.freckles ?? 0.3 },
    uSkinUnit: { value: opts.unit ?? 1 },
    uSssWrap: { value: new Vector3(0.55, 0.22, 0.14).multiplyScalar(opts.sss ?? 1) },
    uSpot: { value: spotPos },
    uSpotCol: { value: spotCol },
    uSpotEdge: { value: spotEdge },
    uSpotCount: { value: 0 },
  };
  mat.setSpots = (spots: SkinSpot[]) => {
    const n = Math.min(MAX_SPOTS, spots.length);
    for (let i = 0; i < n; i++) {
      const sp = spots[i]!;
      spotPos[i]!.set(sp.center.x, sp.center.y, sp.center.z, Math.max(1e-4, sp.radius));
      spotCol[i]!.set(sp.color.r, sp.color.g, sp.color.b, sp.strength);
      spotEdge[i] = sp.edge ?? 0.3;
    }
    uniforms.uSpotCount.value = n;
  };
  mat.setSweat = (v: number) => {
    const c = Math.max(0, Math.min(1, v));
    mat.clearcoat = 0.1 + 0.5 * c;
    mat.clearcoatRoughness = 0.34 - 0.18 * c;
  };
  if (opts.spots) mat.setSpots(opts.spots);
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.defines = { ...(shader.defines ?? {}), SKIN_SSS: '' };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nuniform float uSkinUnit;\n${VERT_PARS}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${VERT_MAIN}`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${FRAG_PARS}`)
      .replace('#include <lights_physical_pars_fragment>', LIGHTS_SKIN)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec4 skinMacro;
        float skinH = skinHeight(skinMacro);
        {
          // Bercak warna lembut: kemerahan & kecokelatan bergantian (tidak seragam seperti plastik).
          float m = skinMacro.b - 0.5;
          diffuseColor.rgb *= 1.0 + vec3(0.10, -0.015, -0.04) * m * 1.6 * uSkinDetail;
          diffuseColor.rgb *= 1.0 - 0.05 * (skinMacro.g - 0.5) * uSkinDetail;
          // Bintik & tahi lalat.
          float sp = smoothstep(0.35, 0.8, skinMacro.a) * uSkinFreckle;
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.55, 0.42, 0.36), sp * 0.8);
          // Bercak regional (areola, pusar, siku, lutut, buku jari).
          for (int i = 0; i < ${MAX_SPOTS}; i++) {
            if (i >= uSpotCount) break;
            float d = length(vBind - uSpot[i].xyz) / uSpot[i].w;
            float e = uSpotEdge[i];
            float k = 1.0 - smoothstep(mix(0.2, 0.86, e), 1.0, d);
            diffuseColor.rgb = mix(diffuseColor.rgb, uSpotCol[i].rgb, k * uSpotCol[i].a);
          }
        }`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        // Kilap tidak seragam: tonjolan kecil sedikit lebih mengilap, pori & garis lebih kusam.
        roughnessFactor = clamp(roughnessFactor + (0.5 - skinMacro.g) * 0.16 * uSkinDetail + 0.06 * uSkinAge, 0.28, 0.9);`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        normal = skinBump(-vViewPosition, normal, skinH, faceDirection);`,
      );
  };
  mat.customProgramCacheKey = () => 'kulit-v1';
  return mat;
}
