/**
 * Karakter pasien MODULAR: satu kerangka (rig) + bagian tubuh dari bentuk dasar, divariasikan
 * lewat parameter (gender, kelompok usia, tinggi, IMT, warna kulit, rambut/hijab, pakaian).
 * Semua pasien memakai kerangka & sistem animasi yang sama (lihat actor.ts), jadi tidak perlu
 * banyak model berbeda — hemat memori dan mudah dijaga konsistensinya.
 *
 * Konvensi: karakter menghadap +Z; kiri karakter = +X. Tulang lengan/kaki mengarah ke −Y.
 */
import {
  CapsuleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  type Material,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
  SphereGeometry,
  type Texture,
} from 'three';
import type { PatientAppearance } from '../../core/appearance';
import { Face } from './face';
import { rashTexture } from './textures';

export interface Limb {
  upper: Group;
  lower: Group;
  end: Group;
}

export interface Dims {
  /** Skala terhadap tinggi rujukan 165 cm. */
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
  headR: number;
  headCenter: number;
  shoulderHalf: number;
  shoulderY: number;
  upperArm: number;
  foreArm: number;
  /** Faktor lebar & tebal badan dari IMT. */
  bw: number;
  bd: number;
}

const HEAD_SCALE = { x: 0.97, y: 1.07, z: 1.0 };

export class Character {
  readonly root = new Group();
  readonly hips = new Group();
  readonly spine = new Group();
  readonly chest = new Group();
  readonly neck = new Group();
  readonly head = new Group();
  /** Bola kepala (pusat kepala, berskala elipsoid) — induk wajah & rambut. */
  readonly headBall = new Group();
  readonly shoulderL = new Group();
  readonly shoulderR = new Group();
  readonly armL: Limb;
  readonly armR: Limb;
  readonly legL: Limb;
  readonly legR: Limb;
  readonly face: Face;
  readonly dims: Dims;
  /** Mesh dada (diskalakan saat bernapas) & skala dasarnya. */
  readonly chestMesh: Mesh;
  readonly chestBase: { x: number; z: number };
  private readonly disposables: { dispose(): void }[] = [];

  constructor(readonly look: PatientAppearance, seed: number) {
    const a = look;
    const s = a.heightCm / 165;
    const male = a.sex === 'male';
    const child = a.ageGroup === 'anak';
    const fat = Math.max(0, a.build);
    const thin = Math.max(0, -a.build);
    const headR = 0.116 * (0.52 + 0.48 * s) * (child ? 1.03 : 1);
    const dims: Dims = (this.dims = {
      s,
      thigh: 0.39 * s,
      shin: 0.39 * s,
      footH: 0.06 * s,
      hipsY: 0.87 * s,
      hipDrop: 0.03 * s,
      hipHalf: (male ? 0.085 : 0.095) * s * (1 + 0.1 * fat),
      spineUp: 0.09 * s,
      chestUp: 0.16 * s,
      neckUp: 0.25 * s,
      headUp: 0.06 * s,
      headR,
      headCenter: headR * 0.9,
      shoulderHalf: (child ? 0.158 : male ? 0.186 : 0.164) * s * (1 + 0.12 * fat - 0.05 * thin),
      shoulderY: 0.2 * s,
      upperArm: 0.27 * s,
      foreArm: 0.24 * s,
      bw: 1 + 0.34 * fat - 0.14 * thin,
      bd: 1 + 0.5 * fat - 0.12 * thin,
    });

    // --- Warna & material ------------------------------------------------------
    const pale = a.cues.pucat ?? 0;
    const jaundice = a.cues.kuning ?? 0;
    const skinColor = new Color(a.skinTone).lerp(new Color('#eadfce'), 0.34 * pale).lerp(new Color('#d6b545'), 0.3 * jaundice);
    const skinHex = `#${skinColor.getHexString()}`;
    const std = (color: string | Color, extra: Partial<{ roughness: number; map: Texture; side: typeof DoubleSide }> = {}) =>
      this.track(new MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...extra }));
    const skin = std(skinColor, { roughness: 0.72 });
    const jacket = a.outfit.jacket ?? null;
    const top = std(jacket ?? a.outfit.top, { roughness: 0.9 });
    const bottom = std(a.outfit.bottom, { roughness: 0.9 });
    const longSleeves = !!jacket || a.outfit.sleeves === 'panjang';
    const shorts = !!a.outfit.shorts;
    const hairMat = std(a.hairColor, { roughness: 0.62 });
    const rash = (a.cues.ruam ?? 0) > 0 ? std('#ffffff', { map: this.track(rashTexture(skinHex, seed)), roughness: 0.72 }) : null;

    // --- Kerangka ------------------------------------------------------------
    const { root, hips, spine, chest, neck, head, headBall } = this;
    root.add(hips);
    hips.position.y = dims.hipsY;
    hips.add(spine);
    spine.position.y = dims.spineUp;
    spine.add(chest);
    chest.position.y = dims.chestUp;
    chest.add(neck);
    neck.position.y = dims.neckUp;
    neck.add(head);
    head.position.y = dims.headUp;
    head.add(headBall);
    headBall.position.y = dims.headCenter;
    headBall.scale.set(HEAD_SCALE.x, HEAD_SCALE.y, HEAD_SCALE.z);
    chest.add(this.shoulderL, this.shoulderR);
    this.shoulderL.position.set(dims.shoulderHalf, dims.shoulderY, 0);
    this.shoulderR.position.set(-dims.shoulderHalf, dims.shoulderY, 0);
    const limb = (parent: Object3D, x: number, y: number, len1: number, len2: number): Limb => {
      const upper = new Group();
      const lower = new Group();
      const end = new Group();
      parent.add(upper);
      upper.position.set(x, y, 0);
      upper.add(lower);
      lower.position.y = -len1;
      lower.add(end);
      end.position.y = -len2;
      return { upper, lower, end };
    };
    this.armL = limb(this.shoulderL, 0, 0, dims.upperArm, dims.foreArm);
    this.armR = limb(this.shoulderR, 0, 0, dims.upperArm, dims.foreArm);
    this.legL = limb(hips, dims.hipHalf, -dims.hipDrop, dims.thigh, dims.shin);
    this.legR = limb(hips, -dims.hipHalf, -dims.hipDrop, dims.thigh, dims.shin);

    // --- Badan ------------------------------------------------------------
    const ball = (parent: Object3D, m: Material, rx: number, ry: number, rz: number, x: number, y: number, z: number, seg = 18): Mesh => {
      const mesh = new Mesh(this.track(new SphereGeometry(1, seg, Math.max(8, Math.round(seg * 0.7)))), m);
      mesh.scale.set(rx, ry, rz);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      parent.add(mesh);
      return mesh;
    };
    const capsule = (parent: Object3D, m: Material, r: number, len: number, y: number): Mesh => {
      const mesh = new Mesh(this.track(new CapsuleGeometry(r, Math.max(0.01, len - 2 * r), 5, 12)), m);
      mesh.position.y = y;
      mesh.castShadow = true;
      parent.add(mesh);
      return mesh;
    };
    ball(hips, bottom, dims.hipHalf * 1.9 + 0.014, 0.112 * s, 0.108 * s * dims.bd, 0, 0, 0);
    // Torso = dua kapsul elips yang saling menumpuk (perut ikut tulang punggung, dada ikut dada),
    // sehingga siluet baju rapi dan tetap lentur saat membungkuk.
    const torso = (parent: Object3D, r: number, height: number, halfWidth: number, depth: number, y: number): Mesh => {
      const mesh = new Mesh(this.track(new CapsuleGeometry(r, Math.max(0.01, height - 2 * r), 8, 20)), top);
      mesh.scale.set(halfWidth / r, 1, depth);
      mesh.position.y = y;
      mesh.castShadow = true;
      parent.add(mesh);
      return mesh;
    };
    const waistHalf = (male ? 0.132 : 0.122) * s * dims.bw;
    torso(spine, 0.1 * s, 0.31 * s, waistHalf, dims.bd, 0.07 * s);
    if (fat > 0.2) ball(spine, top, waistHalf * (0.86 + 0.2 * fat), 0.125 * s * (1 + 0.2 * fat), 0.1 * s * (1 + 0.75 * fat), 0, 0.03 * s, 0.03 * s + 0.05 * s * fat);
    const chestDepth = 1 + 0.32 * fat - 0.1 * thin;
    this.chestMesh = torso(chest, 0.098 * s, 0.31 * s, dims.shoulderHalf * 0.97, chestDepth, 0.088 * s);
    this.chestBase = { x: this.chestMesh.scale.x, z: chestDepth };
    if (!male && a.ageGroup !== 'anak') ball(chest, top, dims.shoulderHalf * 0.66, 0.052 * s, 0.05 * s, 0, 0.085 * s, 0.062 * s * chestDepth, 14);
    for (const sh of [this.shoulderL, this.shoulderR]) ball(sh, top, 0.047 * s, 0.046 * s, 0.05 * s, sh === this.shoulderL ? -0.012 * s : 0.012 * s, -0.012 * s, 0, 12);
    // Kerah / ritsleting jaket.
    if (jacket) {
      const collar = new Mesh(this.track(new CylinderGeometry(0.052 * s, 0.062 * s, 0.045 * s, 14, 1, true)), std(new Color(jacket).multiplyScalar(0.8), { side: DoubleSide }));
      collar.position.y = dims.neckUp - 0.005;
      chest.add(collar);
      const zip = new Mesh(this.track(new CylinderGeometry(0.004, 0.004, 0.3 * s, 6)), std('#c9ccd0', { roughness: 0.4 }));
      zip.position.set(0, 0.07 * s, 0.1 * s * (1 + 0.32 * fat));
      chest.add(zip);
    }
    // Leher.
    const neckMesh = new Mesh(this.track(new CylinderGeometry(0.036 * s, 0.041 * s, 0.11 * s, 12)), skin);
    neckMesh.position.y = 0.025 * s;
    neckMesh.castShadow = true;
    neck.add(neckMesh);

    // --- Lengan ------------------------------------------------------------
    const armR0 = 0.04 * s * (1 + 0.22 * fat - 0.12 * thin);
    for (const arm of [this.armL, this.armR]) {
      if (longSleeves) {
        capsule(arm.upper, top, armR0 * 1.1, dims.upperArm, -dims.upperArm / 2);
        capsule(arm.lower, top, armR0 * 0.98, dims.foreArm, -dims.foreArm / 2);
      } else {
        capsule(arm.upper, skin, armR0 * 0.94, dims.upperArm, -dims.upperArm / 2);
        capsule(arm.upper, top, armR0 * 1.16, dims.upperArm * 0.56, -dims.upperArm * 0.26);
        capsule(arm.lower, rash ?? skin, armR0 * 0.86, dims.foreArm, -dims.foreArm / 2);
      }
      const side = arm === this.armL ? 1 : -1;
      ball(arm.end, longSleeves && rash ? rash : skin, 0.033 * s, 0.05 * s, 0.021 * s, 0, -0.045 * s, 0, 10);
      ball(arm.end, skin, 0.012 * s, 0.022 * s, 0.012 * s, -side * 0.027 * s, -0.03 * s, 0.012 * s, 8);
    }

    // --- Kaki ------------------------------------------------------------
    const thighR = 0.07 * s * (1 + 0.24 * fat - 0.16 * thin);
    const shinR = 0.05 * s * (1 + 0.14 * fat - 0.12 * thin);
    const edema = (a.cues.bengkak ?? 0) > 0;
    const shoe = std(a.outfit.footwear === 'sandal' ? '#3a2a20' : '#26272b', { roughness: 0.7 });
    for (const leg of [this.legL, this.legR]) {
      capsule(leg.upper, bottom, thighR, dims.thigh + thighR * 0.6, -dims.thigh / 2);
      capsule(leg.lower, shorts ? (rash ?? skin) : bottom, shinR, dims.shin, -dims.shin / 2);
      if (edema) ball(leg.lower, shorts ? skin : bottom, shinR * 1.55, dims.shin * 0.3, shinR * 1.55, 0, -dims.shin * 0.78, 0, 12);
      // Telapak: sepatu tertutup, atau sandal (kulit + tali).
      const foot = new Mesh(this.track(new CapsuleGeometry(0.042 * s, 0.13 * s, 4, 10)), a.outfit.footwear === 'sandal' ? skin : shoe);
      foot.rotation.x = Math.PI / 2;
      foot.scale.set(1, 1, 0.72);
      foot.position.set(0, -dims.footH + 0.034 * s, 0.055 * s);
      foot.castShadow = true;
      leg.end.add(foot);
      if (edema) foot.scale.set(1.25, 1, 0.95);
      if (a.outfit.footwear === 'sandal') {
        const sole = new Mesh(this.track(new CapsuleGeometry(0.046 * s, 0.14 * s, 3, 8)), shoe);
        sole.rotation.x = Math.PI / 2;
        sole.scale.set(1, 1, 0.22);
        sole.position.set(0, -dims.footH + 0.008 * s, 0.055 * s);
        leg.end.add(sole);
        const strap = new Mesh(this.track(new CylinderGeometry(0.047 * s, 0.047 * s, 0.022 * s, 10, 1, true)), shoe);
        strap.rotation.x = Math.PI / 2;
        strap.scale.set(1, 1, 0.75);
        strap.position.set(0, -dims.footH + 0.036 * s, 0.09 * s);
        leg.end.add(strap);
      }
    }

    // --- Kepala, wajah, telinga, hidung ------------------------------------------
    const R = headR;
    const skull = new Mesh(this.track(new SphereGeometry(R, 28, 22)), skin);
    skull.castShadow = true;
    headBall.add(skull);
    const covered = !!a.hijab;
    if (!covered) for (const sx of [-1, 1]) ball(headBall, skin, R * 0.1, R * 0.2, R * 0.15, sx * R * 0.985, -R * 0.03, -R * 0.03, 10);
    ball(headBall, std(skinColor.clone().multiplyScalar(0.94), { roughness: 0.7 }), R * 0.12, R * 0.15, R * 0.13, 0, -R * 0.3, R * 0.97, 10);
    this.face = new Face(R, {
      skin: skinHex,
      hair: a.hairColor,
      female: !male,
      wrinkles: Math.max(0, Math.min(1, (a.age - 38) / 32)),
      glasses: a.glasses,
      facialHair: a.facialHair,
      jaundice,
      redEye: a.cues.mata_merah ?? 0,
      pale,
      flush: a.cues.demam ?? 0,
      sweat: Math.max(a.cues.berkeringat ?? 0, (a.cues.demam ?? 0) * 0.5),
      tired: Math.max(a.cues.lemas ?? 0, a.cues.mengantuk ?? 0),
      child,
    });
    headBall.add(this.face.mesh);

    if (a.hijab) this.buildHijab(a.hijab, R, std);
    else this.buildHair(a.hairStyle, R, hairMat);
  }

  dispose(): void {
    this.face.dispose();
    for (const d of this.disposables) d.dispose();
    this.root.removeFromParent();
    this.root.clear();
  }

  private track<T extends { dispose(): void }>(x: T): T {
    this.disposables.push(x);
    return x;
  }

  /** Rambut modular: "topi" rambut + tambahan sesuai gaya. */
  private buildHair(style: string, R: number, m: Material): void {
    const hb = this.headBall;
    const cap = (thick: number, tilt: number, theta: number): Mesh => {
      const mesh = new Mesh(this.track(new SphereGeometry(R * thick, 24, 14, 0, Math.PI * 2, 0, theta)), m);
      mesh.rotation.x = -tilt;
      mesh.castShadow = true;
      hb.add(mesh);
      return mesh;
    };
    const lump = (rx: number, ry: number, rz: number, x: number, y: number, z: number): Mesh => {
      const mesh = new Mesh(this.track(new SphereGeometry(1, 12, 9)), m);
      mesh.scale.set(R * rx, R * ry, R * rz);
      mesh.position.set(R * x, R * y, R * z);
      mesh.castShadow = true;
      hb.add(mesh);
      return mesh;
    };
    /** Selubung sisi & belakang (tidak menutup wajah) dari garis rambut ke bawah. */
    const shell = (thick: number, thetaStart: number, thetaLen: number, open = 1.05): void => {
      const mesh = new Mesh(this.track(new SphereGeometry(R * thick, 22, 10, Math.PI / 2 + open, Math.PI * 2 - open * 2, thetaStart, thetaLen)), m);
      mesh.castShadow = true;
      hb.add(mesh);
    };
    switch (style) {
      case 'botak':
        shell(1.025, 1.15, 0.75, 1.45);
        break;
      case 'tipis':
        shell(1.035, 0.85, 1.05, 1.3);
        break;
      case 'cepak':
        cap(1.03, 0.36, 1.42);
        break;
      case 'belah':
        cap(1.07, 0.42, 1.5);
        lump(0.62, 0.2, 0.42, 0.28, 0.82, 0.52).rotation.z = -0.35;
        break;
      case 'ikal':
        cap(1.06, 0.4, 1.5);
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * Math.PI * 2;
          lump(0.3, 0.26, 0.3, Math.cos(a) * 0.62, 0.78 + (i % 2) * 0.1, Math.sin(a) * 0.6 - 0.1);
        }
        lump(0.34, 0.26, 0.34, 0, 1.0, 0);
        break;
      case 'bob':
        cap(1.08, 0.3, 1.45);
        shell(1.1, 0.9, 1.25, 1.02);
        lump(0.66, 0.16, 0.2, 0, 0.72, 0.78);
        break;
      case 'panjang':
        cap(1.08, 0.3, 1.45);
        shell(1.1, 0.9, 1.5, 1.0);
        lump(0.82, 1.15, 0.3, 0, -1.25, -0.72);
        break;
      case 'kuncir':
        cap(1.07, 0.34, 1.5);
        lump(0.26, 0.26, 0.26, 0, 0.42, -1.02);
        lump(0.2, 0.62, 0.2, 0, -0.25, -1.2).rotation.x = 0.3;
        break;
      case 'kuncir_dua':
        cap(1.07, 0.32, 1.5);
        for (const sx of [-1, 1]) {
          lump(0.2, 0.2, 0.2, sx * 0.98, 0.1, -0.35);
          lump(0.17, 0.5, 0.17, sx * 1.08, -0.5, -0.4).rotation.z = sx * 0.2;
        }
        lump(0.66, 0.16, 0.2, 0, 0.74, 0.76);
        break;
      case 'sanggul':
        cap(1.07, 0.36, 1.52);
        lump(0.4, 0.36, 0.36, 0, 0.28, -1.08);
        break;
      case 'pendek':
      default:
        cap(1.065, 0.4, 1.5);
        lump(0.6, 0.12, 0.18, 0, 0.84, 0.66);
        break;
    }
  }

  /** Hijab: menutup rambut, telinga, dan leher; wajah tetap terbuka. */
  private buildHijab(color: string, R: number, std: (c: string | Color, e?: Partial<{ roughness: number; side: typeof DoubleSide }>) => MeshStandardMaterial): void {
    const m = std(color, { roughness: 0.95, side: DoubleSide });
    const hb = this.headBall;
    const open = 0.84;
    const part = (geo: SphereGeometry): void => {
      const mesh = new Mesh(this.track(geo), m);
      mesh.castShadow = true;
      hb.add(mesh);
    };
    part(new SphereGeometry(R * 1.1, 26, 18, Math.PI / 2 + open, Math.PI * 2 - open * 2));
    part(new SphereGeometry(R * 1.1, 14, 8, Math.PI / 2 - open, open * 2, 0, 0.74));
    part(new SphereGeometry(R * 1.1, 14, 6, Math.PI / 2 - open, open * 2, 2.42, Math.PI - 2.42));
    // Tepi dalam (ciput) agar bukaan wajah tampak rapi.
    const inner = std(new Color(color).multiplyScalar(0.82), { roughness: 0.95, side: DoubleSide });
    const rim = new Mesh(this.track(new SphereGeometry(R * 1.045, 14, 6, Math.PI / 2 - open, open * 2, 0.45, 0.36)), inner);
    hb.add(rim);
    // Juntai kain di leher sampai bahu/dada.
    const s = this.dims.s;
    const drape = new Mesh(this.track(new CylinderGeometry(0.075 * s, this.dims.shoulderHalf * 1.02, 0.2 * s, 20, 1, true)), m);
    drape.position.y = this.dims.shoulderY - 0.02 * s;
    drape.scale.z = 0.72;
    drape.castShadow = true;
    this.chest.add(drape);
    // Bagian depan kain yang jatuh tipis di dada atas.
    const bib = new Mesh(this.track(new SphereGeometry(1, 16, 10)), m);
    bib.scale.set(this.dims.shoulderHalf * 0.78, 0.085 * s, 0.03 * s);
    bib.position.set(0, 0.15 * s, 0.092 * s * this.chestBase.z);
    this.chest.add(bib);
  }
}
