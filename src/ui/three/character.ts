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
  Vector3,
} from 'three';
import type { PatientAppearance } from '../../core/appearance';
import { BONE, type BodyGeometry, buildBody } from './body';
import { buildFoot, buildHand } from './extremities';
import { Eyes } from './eyes';
import { Face } from './face';
import { buildHead, HeadShape } from './head';
import { type ClothKind, createClothMaterial } from './cloth';
import { createSkinMaterial, type SkinMaterial, type SkinSpot } from './skin';
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
  readonly skeleton: Skeleton;
  /** Permukaan tubuh untuk decal luka: lapisan kulit/pakaian (pose ikat, ruang akar). */
  /** Permukaan sasaran decal luka/noda darah; `part` membedakan atasan & bawahan (celana/rok). */
  readonly surfaces: { mesh: SkinnedMesh; layer: 'kulit' | 'pakaian'; part?: 'atas' | 'bawah' }[] = [];
  /** Kelompok mesh kepala (ruang `headBall`) & mesh tangan (ruang tulang telapak). */
  headGroup!: Group;
  readonly handMeshes: { L: Mesh | null; R: Mesh | null } = { L: null, R: null };
  /** Badan sedang tanpa baju (paparan luka). */
  readonly bareTorso: boolean;
  private readonly disposables: { dispose(): void }[] = [];
  private readonly skinMats: MeshStandardMaterial[] = [];
  /** Bahan kulit realistis (badan, kepala, tangan, kaki) — untuk keringat. */
  private readonly skinParts: SkinMaterial[] = [];
  private sweatLevel = -1;
  private skinBase = new Color();
  private tintKey = '';

  /** Bola mata & kelopak 3D. */
  readonly eyes: Eyes;

  /** `detail` = 'tinggi' untuk pasien yang diperiksa dari dekat; 'standar' untuk orang lain. */
  constructor(readonly look: PatientAppearance, seed: number, detail: 'tinggi' | 'standar' = 'tinggi') {
    const a = look;
    const male = a.sex === 'male';
    const child = a.ageGroup === 'anak';
    const young = a.ageGroup === 'remaja';
    // Bayi & batita (< 3 th): tungkai relatif pendek, badan lebih panjang, tubuh lebih gempal.
    const baby = a.age < 3 ? Math.min(1, (3 - a.age) / 3) : 0;
    const legK = 1 - 0.27 * baby;
    const fat = Math.max(0, a.build) + 0.35 * baby;
    const thin = Math.max(0, -a.build) * (1 - baby);
    const h = hash(seed);

    // --- Proporsi ------------------------------------------------------------
    // Kepala tidak mengecil sebanding tinggi badan (anak berkepala relatif besar).
    const hs = (0.52 + 0.48 * (a.heightCm / 165)) * (child ? 1.03 : 1);
    const shape = (this.headShape = new HeadShape({ hs, male, ageGroup: a.ageGroup, fat, thin, seed, detail }));
    // Dagu sedikit di bawah sendi kepala; skala badan dipilih agar tinggi total = tinggi pasien.
    const chinDrop = 0.015 * hs;
    // Panjang total (dalam satuan s): tungkai 0,87·legK + badan-leher-kepala 0,585.
    const s = (a.heightCm / 100 - 2 * shape.hh + chinDrop) / (0.87 * legK + 0.585);
    const dims: Dims = (this.dims = {
      s,
      thigh: 0.39 * s * legK,
      shin: 0.39 * s * legK,
      footH: 0.06 * s * legK,
      hipsY: 0.87 * s * legK,
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
      upperArm: 0.27 * s * (1 - 0.12 * baby),
      foreArm: 0.24 * s * (1 - 0.12 * baby),
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
    // Kulit realistis: hamburan bawah permukaan, pori & garis halus, variasi warna (skin.ts).
    const ageK = Math.max(0, Math.min(1, (a.age - 22) / 50));
    const mkSkin = (spots?: SkinSpot[]): SkinMaterial => {
      const m = this.track(
        createSkinMaterial({
          color: skinColor,
          detail: child ? 0.55 : young ? 0.8 : 1,
          age: ageK,
          freckles: 0.15 + 0.35 * ((h >>> 9) % 10) / 10 + 0.25 * ageK,
          sss: 1,
          spots,
        }),
      );
      this.skinParts.push(m);
      return m;
    };
    const skin = mkSkin();
    // Paparan untuk luka (IGD/poliklinik): baju dibuka, lengan baju pendek, celana digunting.
    const expose = a.injuries?.expose;
    const bareTorso = (this.bareTorso = !!expose?.torso);
    const jacket = bareTorso ? null : (a.outfit.jacket ?? null);
    const topColor = new Color(jacket ?? a.outfit.top);
    const longSleeves = !bareTorso && !expose?.shortSleeves && (!!jacket || a.outfit.sleeves === 'panjang');
    const shorts = !!a.outfit.shorts;
    const sandal = a.outfit.footwear === 'sandal';
    const edema = (a.cues.bengkak ?? 0) > 0;
    // Model baju: seragam menentukan sendiri; selebihnya dipilih stabil dari benih pasien.
    const collar = !bareTorso && (!!jacket || (a.outfit.collar ?? (a.hijab ? false : longSleeves ? h % 10 < 7 : h % 10 < 3)));
    const tucked = !bareTorso && !jacket && !a.hijab && (a.outfit.tucked ?? (collar && male && !child && fat < 0.45 && (h >>> 4) % 10 < 5));
    const legCut = (v: number | undefined) => (v === undefined ? undefined : Math.max(0, Math.min(1, v)) * 0.78);
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
      hijab: !!a.hijab && !bareTorso,
      edema,
      bareTorso,
      chestBand: bareTorso && !male && a.age >= 10,
      pantsEnd: expose?.legs ? { L: legCut(expose.legs.kiri), R: legCut(expose.legs.kanan) } : undefined,
      detail,
    }));
    const skinned = (geo: BufferGeometry | null, m: Material, layer: 'kulit' | 'pakaian' = 'pakaian', part?: 'atas' | 'bawah'): void => {
      if (!geo) return;
      const mesh = new SkinnedMesh(this.track(geo), m);
      this.surfaces.push(part ? { mesh, layer, part } : { mesh, layer });
      mesh.castShadow = true;
      // Kotak batas pose ikat tidak berlaku setelah dianimasikan.
      mesh.frustumCulled = false;
      root.add(mesh);
      mesh.bind(skeleton, IDENTITY);
    };
    // Warna kulit regional: areola & puting, pusar, siku, lutut (lebih gelap/kemerahan).
    const lm = body.landmarks;
    const tone = (r: number, g: number, b: number) => skinColor.clone().multiply(new Color(r, g, b));
    const areola = tone(0.64, 0.47, 0.44);
    const torsoSkin = bareTorso
      ? mkSkin([
          { center: lm.nipples[0], radius: lm.areola, color: areola, strength: 0.82, edge: 0.6 },
          { center: lm.nipples[1], radius: lm.areola, color: areola, strength: 0.82, edge: 0.6 },
          { center: lm.nipples[0], radius: lm.areola * 0.32, color: tone(0.56, 0.4, 0.38), strength: 0.7, edge: 0.4 },
          { center: lm.nipples[1], radius: lm.areola * 0.32, color: tone(0.56, 0.4, 0.38), strength: 0.7, edge: 0.4 },
          { center: lm.navel, radius: 0.0085 * s, color: tone(0.5, 0.38, 0.36), strength: 0.75, edge: 0.2 },
        ])
      : skin;
    const elbowTone = tone(0.84, 0.76, 0.74);
    const armSkin = mkSkin([
      { center: lm.elbows[0], radius: 0.034 * s, color: elbowTone, strength: 0.55, edge: 0 },
      { center: lm.elbows[1], radius: 0.034 * s, color: elbowTone, strength: 0.55, edge: 0 },
    ]);
    const kneeTone = tone(0.88, 0.8, 0.78);
    const legSkin = mkSkin([
      { center: lm.knees[0], radius: 0.045 * s, color: kneeTone, strength: 0.45, edge: 0 },
      { center: lm.knees[1], radius: 0.045 * s, color: kneeTone, strength: 0.45, edge: 0 },
    ]);
    skinned(body.skinNeck, skin, 'kulit');
    skinned(body.skinArms, rash ?? armSkin, 'kulit');
    skinned(body.skinLegs, rash ?? legSkin, 'kulit');
    // Kain realistis: kilau serat, tenunan, lipatan (cloth.ts). Seragam (atas = bawah) = kain seragam.
    const uniform = a.outfit.top === a.outfit.bottom;
    const cloth = (color: string | Color, kind: ClothKind) => this.track(createClothMaterial({ color, kind }));
    const topKind: ClothKind = uniform ? 'seragam' : jacket ? 'seragam' : collar ? 'kemeja' : 'kaos';
    const bottomKind: ClothKind = uniform ? 'seragam' : male && (h >>> 3) % 2 === 0 ? 'jins' : 'kain';
    if (bareTorso) skinned(body.top, torsoSkin, 'kulit');
    else skinned(body.top, cloth(topColor, topKind));
    skinned(body.trim, bareTorso ? cloth(topColor.clone().multiplyScalar(0.7), 'kaos') : jacket ? std('#c9ccd0', { roughness: 0.45 }) : cloth(topColor.clone().multiplyScalar(collar ? 0.88 : 0.8), topKind));
    skinned(body.bottom, cloth(a.outfit.bottom, bottomKind), 'pakaian', 'bawah');
    skinned(body.belt, std('#2b2019', { roughness: 0.55 }));
    if (a.hijab && !bareTorso) skinned(body.drape, cloth(a.hijab, 'kain'));

    // --- Tangan ------------------------------------------------------------
    const frame = child ? 0.9 : young ? 0.955 : male ? 1 : 0.935;
    const handGeo = this.track(buildHand(s * frame * (1 - 0.05 * thin), fat, body.wrist, detail));
    const handMat = longSleeves && rash ? rash : skin;
    for (const [arm, side] of [
      [this.armL, 1],
      [this.armR, -1],
    ] as const) {
      const hand = new Mesh(handGeo, handMat);
      hand.scale.x = side;
      this.handMeshes[side === 1 ? 'L' : 'R'] = hand;
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
    const parts = buildHead(shape, { skin: skinColor, skinMaterial: skin, hairColor: a.hairColor, hairStyle: a.hairStyle, hijab: a.hijab, glasses: a.glasses, hairTexture: hairStreakTexture() });
    for (const d of parts.disposables) this.track(d);
    this.headBall.add(parts.group);
    this.headGroup = parts.group;
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
      marks: a.injuries?.face ?? null,
      eyes3d: true,
    });
    this.headBall.add(this.face.mesh);
    // Mata 3D di rongga mata: bola mata ± 24 mm, apeks kornea ± 3,5 mm di belakang permukaan wajah
    // tanpa relief (tulang alis & pipi lebih menonjol daripada mata, seperti wajah sungguhan).
    const eyeR = 0.0122 * hs * (child ? 1.08 : 1);
    const raw = shape.pointRaw(shape.eyeYn, shape.angleFor(shape.eyeYn, shape.eyeX), new Vector3());
    // Iris cokelat (mayoritas orang Indonesia) — nada sedang agar serat iris terbaca di bawah lampu.
    const irisTones = ['#9a6a3e', '#8a5d35', '#a87444', '#93683f', '#b07a48'];
    this.eyes = new Eyes(
      {
        center: new Vector3(shape.eyeX, shape.hh * shape.eyeYn, raw.z - 0.0022 * hs - eyeR),
        radius: eyeR,
        iris: irisTones[(h >>> 5) % irisTones.length]!,
        lash: '#140d0a',
        female: !male,
        child,
        tilt: (0.05 + 0.07 * shape.vary.eyeTilt) * 0.55,
        skin,
        detail,
      },
      seed,
    );
    this.eyes.setSclera(jaundice, a.cues.mata_merah ?? 0);
    this.headBall.add(this.eyes.group);
    this.face.eyes = this.eyes;

    // Material kulit (badan & kepala) untuk perubahan warna klinis (pucat/sianosis).
    const hex = skinColor.getHex();
    root.traverse((o) => {
      const m = (o as Mesh).material as MeshStandardMaterial | undefined;
      if (m && (m as MeshStandardMaterial).isMeshStandardMaterial && m.color.getHex() === hex && !this.skinMats.includes(m)) this.skinMats.push(m);
    });
    this.skinBase = skinColor.clone();
    this.setSweat(Math.max(a.cues.berkeringat ?? 0, (a.cues.demam ?? 0) * 0.4));
  }

  /** Warna kulit klinis: campur warna dasar dengan `tint` sebesar `amount` (0 = normal). */
  setSkinTint(tint: Color | null, amount: number): void {
    const key = tint ? `${tint.getHexString()}:${amount.toFixed(2)}` : '';
    if (key === this.tintKey) return;
    this.tintKey = key;
    for (const m of this.skinMats) {
      m.color.copy(this.skinBase);
      if (tint && amount > 0) m.color.lerp(tint, Math.min(1, amount));
    }
  }

  /** Keringat (diaforesis) 0..1: kulit tampak basah mengilap. */
  setSweat(v: number): void {
    const q = Math.round(Math.max(0, Math.min(1, v)) * 20) / 20;
    if (q === this.sweatLevel) return;
    this.sweatLevel = q;
    for (const m of this.skinParts) m.setSweat(q);
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
