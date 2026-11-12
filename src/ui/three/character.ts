/**
 * Karakter pasien MODULAR berbentuk manusia: satu kerangka tulang (rig) + permukaan tubuh
 * menyatu yang menekuk halus di sendi (skinned), divariasikan lewat parameter (gender, usia,
 * tinggi, IMT, warna kulit, rambut/hijab, pakaian). Semua pasien memakai kerangka & sistem
 * animasi yang sama (lihat actor.ts) dan seluruh bentuk dibangkitkan dari kode — tanpa berkas
 * model — sehingga hemat memori dan mudah dijaga konsistensinya.
 *
 * Susunan: body.ts (torso, leher, lengan, kaki, pakaian) · head.ts (tengkorak, hidung, telinga,
 * rambut/hijab, kacamata) · face.ts (ekspresi) · extremities.ts (tangan berjari, sepatu/sandal).
 *
 * Konvensi: karakter menghadap +Z; kiri karakter = +X. Tulang lengan/kaki mengarah ke −Y.
 */
import {
  Bone,
  type BufferGeometry,
  Color,
  Group,
  type Material,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
  RepeatWrapping,
  Skeleton,
  SkinnedMesh,
  type Texture,
  type Vector3,
} from 'three';
import type { PatientAppearance } from '../../core/appearance';
import { BONE, type BodyGeometry, buildBody } from './body';
import { buildFoot, buildHand } from './extremities';
import { Face } from './face';
import { buildHead, HeadShape } from './head';
import { hairStreakTexture, rashTexture } from './textures';

export interface Limb {
  upper: Bone;
  lower: Bone;
  end: Bone;
}

export interface Dims {
  /** Skala badan terhadap rujukan dewasa 165 cm. */
  s: number;
  thigh: number;
  shin: number;
  /** Tinggi pergelangan kaki dari lantai. */
  footH: number;
  /** Tinggi pusat panggul saat berdiri. */
  hipsY: number;
  /** Offset sendi paha di bawah pusat panggul. */
  hipDrop: number;
  hipHalf: number;
  spineUp: number;
  chestUp: number;
  neckUp: number;
  headUp: number;
  /** Jari-jari nominal kepala (kedalaman). */
  headR: number;
  headCenter: number;
  shoulderHalf: number;
  shoulderY: number;
  upperArm: number;
  foreArm: number;
  /** Jarak pergelangan → pusat telapak (titik raih tangan). */
  palm: number;
  /** Faktor lebar & tebal badan dari IMT. */
  bw: number;
  bd: number;
}

export type HeadSite = 'kepala' | 'mata' | 'mulut' | 'dahi';

const IDENTITY = new Matrix4();

function hash(seed: number): number {
  let h = (seed ^ 0x9e3779b9) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 2246822507) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

export class Character {
  readonly root = new Group();
  readonly hips: Bone;
  readonly spine: Bone;
  readonly chest: Bone;
  readonly neck: Bone;
  readonly head: Bone;
  /** Pusat kepala — induk tengkorak, wajah, rambut. */
  readonly headBall = new Group();
  readonly shoulderL: Bone;
  readonly shoulderR: Bone;
  readonly armL: Limb;
  readonly armR: Limb;
  readonly legL: Limb;
  readonly legR: Limb;
  readonly face: Face;
  readonly dims: Dims;
  readonly body: BodyGeometry;
  readonly headShape: HeadShape;
  /** Tulang rusuk: diskalakan saat bernapas (dinding dada depan ikut tulang ini). */
  private readonly ribs: Bone;
  private readonly skeleton: Skeleton;
  private readonly disposables: { dispose(): void }[] = [];

  constructor(readonly look: PatientAppearance, seed: number) {
    const a = look;
    const male = a.sex === 'male';
    const child = a.ageGroup === 'anak';
    const young = a.ageGroup === 'remaja';
    const fat = Math.max(0, a.build);
    const thin = Math.max(0, -a.build);
    const h = hash(seed);

    // --- Proporsi ------------------------------------------------------------
    // Kepala tidak mengecil sebanding tinggi badan (anak berkepala relatif besar).
    const hs = (0.52 + 0.48 * (a.heightCm / 165)) * (child ? 1.03 : 1);
    const shape = (this.headShape = new HeadShape({ hs, male, ageGroup: a.ageGroup, fat, thin }));
    // Dagu sedikit di bawah sendi kepala; skala badan dipilih agar tinggi total = tinggi pasien.
    const chinDrop = 0.015 * hs;
    const s = (a.heightCm / 100 - 2 * shape.hh + chinDrop) / 1.455;
    const dims: Dims = (this.dims = {
      s,
      thigh: 0.39 * s,
      shin: 0.39 * s,
      footH: 0.06 * s,
      hipsY: 0.87 * s,
      hipDrop: 0.03 * s,
      hipHalf: (male ? 0.085 : 0.093) * s * (1 + 0.08 * fat),
      spineUp: 0.09 * s,
      chestUp: 0.16 * s,
      neckUp: 0.27 * s,
      headUp: 0.065 * s,
      headR: shape.hd,
      headCenter: shape.hh - chinDrop,
      shoulderHalf: (child ? 0.15 : male ? (young ? 0.165 : 0.173) : young ? 0.151 : 0.155) * s * (a.ageGroup === 'lansia' ? 0.975 : 1) * (1 + 0.1 * fat - 0.04 * thin),
      shoulderY: 0.2 * s,
      upperArm: 0.27 * s,
      foreArm: 0.24 * s,
      palm: 0.05 * s,
      bw: 1 + 0.34 * fat - 0.14 * thin,
      bd: 1 + 0.5 * fat - 0.12 * thin,
    });

    // --- Kerangka (urutan tulang = BONE di body.ts) ----------------------------------
    const bones: Bone[] = [];
    const bone = (index: number, parent: Object3D, x: number, y: number, z: number): Bone => {
      const b = new Bone();
      b.position.set(x, y, z);
      parent.add(b);
      bones[index] = b;
      return b;
    };
    const B = BONE;
    const root = this.root;
    this.hips = bone(B.hips, root, 0, dims.hipsY, 0);
    this.spine = bone(B.spine, this.hips, 0, dims.spineUp, 0);
    this.chest = bone(B.chest, this.spine, 0, dims.chestUp, 0);
    this.ribs = bone(B.ribs, this.chest, 0, 0.09 * s, 0);
    this.neck = bone(B.neck, this.chest, 0, dims.neckUp, 0);
    this.head = bone(B.head, this.neck, 0, dims.headUp, 0);
    this.shoulderL = bone(B.shL, this.chest, dims.shoulderHalf, dims.shoulderY, 0);
    this.shoulderR = bone(B.shR, this.chest, -dims.shoulderHalf, dims.shoulderY, 0);
    const limb = (parent: Object3D, i0: number, x: number, y: number, len1: number, len2: number): Limb => {
      const upper = bone(i0, parent, x, y, 0);
      const lower = bone(i0 + 1, upper, 0, -len1, 0);
      const end = bone(i0 + 2, lower, 0, -len2, 0);
      return { upper, lower, end };
    };
    this.armL = limb(this.shoulderL, B.upL, 0, 0, dims.upperArm, dims.foreArm);
    this.armR = limb(this.shoulderR, B.upR, 0, 0, dims.upperArm, dims.foreArm);
    this.legL = limb(this.hips, B.thL, dims.hipHalf, -dims.hipDrop, dims.thigh, dims.shin);
    this.legR = limb(this.hips, B.thR, -dims.hipHalf, -dims.hipDrop, dims.thigh, dims.shin);
    // Pergelangan: puntir (pronasi/supinasi) dulu, lalu tekuk.
    this.armL.end.rotation.order = 'YZX';
    this.armR.end.rotation.order = 'YZX';
    this.head.add(this.headBall);
    this.headBall.position.y = dims.headCenter;
    root.updateMatrixWorld(true);
    const skeleton = (this.skeleton = new Skeleton(bones));

    // --- Warna & material ------------------------------------------------------
    const pale = a.cues.pucat ?? 0;
    const jaundice = a.cues.kuning ?? 0;
    const skinColor = new Color(a.skinTone).lerp(new Color('#eadfce'), 0.34 * pale).lerp(new Color('#d6b545'), 0.3 * jaundice);
    const skinHex = `#${skinColor.getHexString()}`;
    const std = (color: string | Color, extra: Partial<{ roughness: number; map: Texture }> = {}) =>
      this.track(new MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...extra }));
    const skin = std(skinColor, { roughness: 0.66 });
    const jacket = a.outfit.jacket ?? null;
    const topColor = new Color(jacket ?? a.outfit.top);
    const longSleeves = !!jacket || a.outfit.sleeves === 'panjang';
    const shorts = !!a.outfit.shorts;
    const sandal = a.outfit.footwear === 'sandal';
    const edema = (a.cues.bengkak ?? 0) > 0;
    // Model baju: seragam menentukan sendiri; selebihnya dipilih stabil dari benih pasien.
    const collar = !!jacket || (a.outfit.collar ?? (a.hijab ? false : longSleeves ? h % 10 < 7 : h % 10 < 3));
    const tucked = !jacket && !a.hijab && (a.outfit.tucked ?? (collar && male && !child && fat < 0.45 && (h >>> 4) % 10 < 5));
    let rash: MeshStandardMaterial | null = null;
    if ((a.cues.ruam ?? 0) > 0) {
      const tex = this.track(rashTexture(skinHex, seed));
      tex.wrapS = tex.wrapT = RepeatWrapping;
      tex.repeat.set(3, 12);
      rash = std('#ffffff', { map: tex, roughness: 0.66 });
    }

    // --- Badan: permukaan menyatu yang terikat ke kerangka ----------------------------
    const body = (this.body = buildBody({
      s,
      male,
      ageGroup: a.ageGroup,
      fat,
      thin,
      hipsY: dims.hipsY,
      hipHalf: dims.hipHalf,
      hipDrop: dims.hipDrop,
      spineY: dims.spineUp,
      chestY: dims.spineUp + dims.chestUp,
      neckY: dims.spineUp + dims.chestUp + dims.neckUp,
      headY: dims.spineUp + dims.chestUp + dims.neckUp + dims.headUp,
      shoulderHalf: dims.shoulderHalf,
      shoulderY: dims.shoulderY,
      upperArm: dims.upperArm,
      foreArm: dims.foreArm,
      thigh: dims.thigh,
      shin: dims.shin,
      longSleeves,
      shorts,
      jacket: !!jacket,
      collar,
      tucked,
      hijab: !!a.hijab,
      edema,
    }));
    const skinned = (geo: BufferGeometry | null, m: Material): void => {
      if (!geo) return;
      const mesh = new SkinnedMesh(this.track(geo), m);
      mesh.castShadow = true;
      // Kotak batas pose ikat tidak berlaku setelah dianimasikan.
      mesh.frustumCulled = false;
      root.add(mesh);
      mesh.bind(skeleton, IDENTITY);
    };
    skinned(body.skinNeck, skin);
    skinned(body.skinArms, rash ?? skin);
    skinned(body.skinLegs, rash ?? skin);
    skinned(body.top, std(topColor, { roughness: jacket ? 0.74 : 0.92 }));
    skinned(body.trim, std(jacket ? new Color('#c9ccd0') : topColor.clone().multiplyScalar(collar ? 0.88 : 0.8), { roughness: jacket ? 0.45 : 0.9 }));
    skinned(body.bottom, std(a.outfit.bottom, { roughness: 0.9 }));
    skinned(body.belt, std('#2b2019', { roughness: 0.55 }));
    if (a.hijab) skinned(body.drape, std(a.hijab, { roughness: 0.92 }));

    // --- Tangan ------------------------------------------------------------
    const frame = child ? 0.9 : young ? 0.955 : male ? 1 : 0.935;
    const handGeo = this.track(buildHand(s * frame * (1 - 0.05 * thin), fat));
    const handMat = longSleeves && rash ? rash : skin;
    for (const [arm, side] of [
      [this.armL, 1],
      [this.armR, -1],
    ] as const) {
      const hand = new Mesh(handGeo, handMat);
      hand.scale.x = side;
      hand.castShadow = true;
      arm.end.add(hand);
    }

    // --- Kaki: sepatu atau sandal ------------------------------------------------
    const foot = buildFoot(s * (male || child ? 1 : 0.95), dims.footH, sandal, edema);
    const shoeTone = ['#26272b', '#3a2a1f', '#2f3743'][h % 3]!;
    const upperMat = std(child ? '#1d1e21' : shoeTone, { roughness: 0.62 });
    const soleMat = std(sandal ? '#3a2a20' : h % 3 === 2 ? '#d5d3cc' : '#141516', { roughness: 0.8 });
    const strapMat = std('#241a14', { roughness: 0.7 });
    for (const g of [foot.upper, foot.sole, foot.skin, foot.strap]) if (g) this.track(g);
    for (const [leg, side] of [
      [this.legL, 1],
      [this.legR, -1],
    ] as const) {
      const group = new Group();
      group.scale.x = side;
      leg.end.add(group);
      const add = (geo: BufferGeometry | null, m: Material) => {
        if (!geo) return;
        const mesh = new Mesh(geo, m);
        mesh.castShadow = true;
        group.add(mesh);
      };
      add(foot.upper, upperMat);
      add(foot.sole, soleMat);
      add(foot.skin, shorts && rash ? rash : skin);
      add(foot.strap, strapMat);
    }

    // --- Kepala & wajah ------------------------------------------------------------
    const parts = buildHead(shape, { skin: skinColor, hairColor: a.hairColor, hairStyle: a.hairStyle, hijab: a.hijab, glasses: a.glasses, hairTexture: hairStreakTexture() });
    for (const d of parts.disposables) this.track(d);
    this.headBall.add(parts.group);
    this.face = new Face(parts.faceGeometry, shape.layout(), {
      skin: skinHex,
      hair: a.hairColor,
      female: !male,
      wrinkles: Math.max(0, Math.min(1, (a.age - 38) / 32)),
      facialHair: a.facialHair,
      jaundice,
      redEye: a.cues.mata_merah ?? 0,
      pale,
      flush: a.cues.demam ?? 0,
      sweat: Math.max(a.cues.berkeringat ?? 0, (a.cues.demam ?? 0) * 0.5),
      tired: Math.max(a.cues.lemas ?? 0, a.cues.mengantuk ?? 0),
      child,
    });
    this.headBall.add(this.face.mesh);
  }

  /** Gerak napas: dinding dada depan mengembang (b ≈ 0..0,1). */
  setBreath(b: number): void {
    this.ribs.scale.set(1 + b * 0.9, 1, 1 + b * 3.4);
  }

  /** Titik sentuh tangan di kepala (ruang lokal `headBall`); `x` = ±1 sisi. */
  headSite(site: HeadSite, x: number, out: Vector3): Vector3 {
    const sh = this.headShape;
    const hs = sh.spec.hs;
    switch (site) {
      case 'kepala':
        return sh.point(0.42, x * 0.95, out, 0.016 * hs);
      case 'mata':
        return out.set(x * 0.02 * hs, sh.hh * (sh.eyeYn + 0.02), sh.front(sh.eyeYn) + 0.026 * hs);
      case 'mulut':
        return out.set(x * 0.008 * hs, sh.hh * (sh.eyeYn - 0.66), sh.front(sh.eyeYn - 0.6) + 0.04 * hs);
      case 'dahi':
        return out.set(x * 0.01 * hs, sh.hh * 0.44, sh.front(0.44) + 0.017 * hs);
    }
  }

  dispose(): void {
    this.face.dispose();
    this.skeleton.dispose();
    for (const d of this.disposables) d.dispose();
    this.root.removeFromParent();
    this.root.clear();
  }

  private track<T extends { dispose(): void }>(x: T): T {
    this.disposables.push(x);
    return x;
  }
}
