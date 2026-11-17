/**
 * Bahan rambut realistis (prosedural):
 *
 * - Tekstur helai halus (512 helai per ubin) dengan gumpalan, variasi terang-gelap, dan celah
 *   antar-helai (alfa) — helai mengikuti arah v permukaan (dari garis rambut ke ubun-ubun).
 * - Sorotan anisotropik Kajiya–Kay dua lobus: lobus utama putih tajam bergeser ke ujung, lobus
 *   kedua berwarna rambut lebih lebar — kilau "pita" khas rambut, bukan bintik kilap plastik.
 * - Tepi garis rambut menipis & transparan (alpha hash, tanpa pengurutan), lapisan helai luar
 *   jarang yang melembutkan siluet.
 * - Relief helai (bump dari turunan layar) agar permukaan tidak licin.
 */
import { Color, DataTexture, DoubleSide, LinearFilter, LinearMipmapLinearFilter, MeshPhysicalMaterial, RepeatWrapping, RGBAFormat, ShaderChunk, UnsignedByteType } from 'three';

let strandTex: DataTexture | null = null;

/**
 * Tekstur helai (dibuat sekali, tanpa kanvas): RGB = terang helai (abu-abu, dikalikan warna
 * rambut), A = kerapatan helai. Helai berjalan sepanjang v dengan sedikit liukan; gumpalan lebar
 * memberi variasi gelap-terang seperti rambut sungguhan.
 */
export function hairStrandTexture(): DataTexture {
  if (strandTex) return strandTex;
  const W = 256;
  const H = 512;
  const lum = new Float32Array(W * H).fill(0.47);
  const cov = new Float32Array(W * H).fill(0.55);
  let h = 9001;
  const rnd = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) + 0x9e3779b9;
    return ((h >>> 8) & 0xffff) / 65535;
  };
  const strand = (x0: number, width: number, value: number, alpha: number, wob: number, phase: number) => {
    for (let y = 0; y < H; y++) {
      const t = y / H;
      const x = x0 + wob * Math.sin(t * Math.PI * 2 + phase) + 0.5 * wob * Math.sin(t * Math.PI * 6 + phase * 1.7);
      const half = width / 2;
      for (let dx = Math.floor(x - half - 1); dx <= Math.ceil(x + half + 1); dx++) {
        const d = Math.abs(dx + 0.5 - x);
        const k = Math.max(0, Math.min(1, half + 0.5 - d)) * alpha;
        if (k <= 0) continue;
        const i = y * W + (((dx % W) + W) % W);
        lum[i] = lum[i]! + (value - lum[i]!) * k;
        cov[i] = Math.min(1, cov[i]! + k * 0.9);
      }
    }
  };
  // Gumpalan lebar dulu, lalu helai tipis.
  for (let i = 0; i < 26; i++) strand(rnd() * W, 4 + rnd() * 9, rnd() < 0.5 ? 0.24 : 0.68, 0.22, 3 + rnd() * 3, rnd() * 6.28);
  for (let i = 0; i < 520; i++) {
    const v = rnd();
    strand(rnd() * W, 0.6 + rnd() * 1.1, v < 0.4 ? 0.16 + rnd() * 0.2 : 0.6 + rnd() * 0.4, 0.35 + rnd() * 0.55, 1 + rnd() * 3, rnd() * 6.28);
  }
  const data = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    const v = Math.round(255 * Math.max(0, Math.min(1, lum[i]!)));
    data[i * 4] = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = Math.round(255 * Math.max(0, Math.min(1, cov[i]!)));
  }
  const tex = new DataTexture(data, W, H, RGBAFormat, UnsignedByteType);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  strandTex = tex;
  return tex;
}

const SPEC_LINE = 'reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );';
const HAIR_SPEC = /* glsl */ `
	#ifdef HAIR_KK
	{
		// Kajiya–Kay: sorotan bergantung pada sudut terhadap arah helai, bukan normal permukaan.
		vec3 H = normalize( directLight.direction + geometryViewDir );
		vec3 t1 = normalize( hairT + geometryNormal * 0.16 );
		vec3 t2 = normalize( hairT - geometryNormal * 0.1 );
		float d1 = dot( t1, H );
		float d2 = dot( t2, H );
		float s1 = pow( sqrt( max( 0.0, 1.0 - d1 * d1 ) ), 110.0 );
		float s2 = pow( sqrt( max( 0.0, 1.0 - d2 * d2 ) ), 26.0 );
		float vis = smoothstep( -0.15, 0.3, dot( geometryNormal, directLight.direction ) );
		reflectedLight.directSpecular += directLight.color * vis * hairSpecK * ( s1 * 0.28 + s2 * 0.5 * clamp( material.diffuseColor * 3.0, 0.0, 1.0 ) );
	}
	#else
	${SPEC_LINE}
	#endif`;
const LIGHTS_HAIR = (() => {
  const src = ShaderChunk.lights_physical_pars_fragment;
  return src.includes(SPEC_LINE) ? src.replace(SPEC_LINE, HAIR_SPEC) : src;
})();

export interface HairMaterialOptions {
  color: string;
  /** Lapisan luar yang jarang (melembutkan siluet). */
  fuzz?: boolean;
  /** Ulang tekstur di sepanjang helai (v). */
  vRepeat?: number;
}

/** Bahan rambut dengan sorotan anisotropik & tepi menipis. */
export function createHairMaterial(opts: HairMaterialOptions): MeshPhysicalMaterial {
  const color = new Color(opts.color);
  const lum = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
  const mat = new MeshPhysicalMaterial({
    color,
    map: hairStrandTexture(),
    roughness: 0.48,
    metalness: 0,
    side: DoubleSide,
    // Potongan alfa (bukan dither): helai di tepi terpotong tegas mengikuti tekstur helai.
    alphaTest: 0.5,
    sheen: 0.12,
    sheenRoughness: 0.45,
    sheenColor: color.clone(),
    specularIntensity: 0.25,
  });
  const fuzz = opts.fuzz ? 1 : 0;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uFuzz = { value: fuzz };
    // Rambut gelap tetap punya kilau; rambut putih/uban kilau lebih lembut.
    shader.uniforms.uSpecK = { value: (0.8 + 0.6 * (1 - lum)) * (fuzz ? 0.35 : 1) };
    shader.defines = { ...(shader.defines ?? {}), HAIR_KK: '' };
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform float uFuzz;\nuniform float uSpecK;\nvec3 hairT = vec3(0.0, 1.0, 0.0);\nfloat hairSpecK = 1.0;`)
      .replace('#include <lights_physical_pars_fragment>', LIGHTS_HAIR)
      .replace(
        '#include <map_fragment>',
        `#ifdef USE_MAP
          vec4 hairS = texture2D( map, vMapUv * vec2(1.0, ${(opts.vRepeat ?? 1).toFixed(2)}) );
          // Terang–gelap helai (rata-rata ± 1): warna dasar tetap warna rambut pasien.
          diffuseColor.rgb *= 0.45 + 0.8 * hairS.rgb;
          // Tepi garis rambut (v → 1) menipis menjadi helai jarang; lapisan luar selalu jarang.
          float edge = smoothstep(0.86, 1.0, vMapUv.y);
          // Kerapatan menurun ke tepi; helai terang (rapat) bertahan paling lama.
          float dens = hairS.a + 0.25 * hairS.r;
          float cover = mix(1.0, dens * (1.35 - edge * 0.6), edge);
          diffuseColor.a *= mix(cover, dens * 0.62, uFuzz);
          hairSpecK = uSpecK * (0.6 + 0.8 * hairS.r);
        #endif`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        {
          // Arah helai = arah v permukaan (kerangka kotangen dari turunan layar).
          vec3 dp1 = dFdx( -vViewPosition );
          vec3 dp2 = dFdy( -vViewPosition );
          vec2 duv1 = dFdx( vMapUv );
          vec2 duv2 = dFdy( vMapUv );
          vec3 dp2perp = cross( dp2, normal );
          vec3 dp1perp = cross( normal, dp1 );
          vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;
          hairT = normalize( B + 1e-6 );
          // Relief helai: tonjolan kecil tegak lurus helai.
          #ifdef USE_MAP
          float hh = hairS.r;
          vec3 bx = dFdx( -vViewPosition );
          vec3 by = dFdy( -vViewPosition );
          vec3 r1 = cross( by, normal );
          vec3 r2 = cross( normal, bx );
          float det = dot( bx, r1 ) * faceDirection;
          vec3 grad = sign( det ) * ( dFdx( hh ) * r1 + dFdy( hh ) * r2 ) * 0.0006;
          normal = normalize( abs( det ) * normal - grad );
          #endif
        }`,
      );
  };
  mat.customProgramCacheKey = () => `rambut-v1-${fuzz}`;
  return mat;
}
