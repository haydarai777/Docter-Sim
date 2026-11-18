/**
 * Luka pada satu karakter: menempatkan setiap cedera (core/injury.ts) tepat di lokasi anatomisnya,
 * lalu membangun:
 * - decal luka beresolusi tinggi yang ikut menekuk bersama kulit (SkinnedMesh pada kerangka sama),
 * - bengkak nyata (deformasi permukaan) untuk keseleo, fraktur tertutup, hematoma, emfisema,
 * - lapisan darah segar mengilap di sekitar luka, aliran darah ke arah gravitasi (berbeda saat
 *   berdiri/berbaring), dan rembesan darah di pakaian — semuanya meluas sesuai volume darah keluar,
 * - kasa + pembalut elastis yang merembes darah, torniket (dengan batang pemutar) & tungkai distal
 *   yang memucat, kain darurat basah darah, serta varian luka dibersihkan & dijahit.
 *
 * Posisi & arah tiap luka di ruang dunia tersedia untuk efek darah (pancaran/tetesan).
 */
import {
  type BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  Group,
  Matrix4,
  Mesh,
  type Material,
  MeshStandardMaterial,
  type Object3D,
  Quaternion,
  Raycaster,
  SkinnedMesh,
  SRGBColorSpace,
  Vector3,
  DoubleSide,
  BoxGeometry,
  MeshBasicMaterial,
} from 'three';
import type { InjuryProfile, InjurySpec } from '../../core/injury';
import type { Character } from './character';
import { type DecalTarget, projectDecal, type Projector, type RevealMaterial, revealMaterial, woundMaterial } from './decal';
import { bloodTexture, gauzeTexture, woundTextures } from './woundTextures';

const IDENTITY = new Matrix4();
const UP = new Vector3(0, 1, 0);
const DOWN_UPRIGHT = new Vector3(0, -1, 0);
/** Gravitasi dalam ruang ikat saat berbaring telentang (ke arah punggung). */
const DOWN_SUPINE = new Vector3(0, 0, -1);

type Space = 'badan' | 'kepala' | 'tangan';

interface Anchor {
  space: Space;
  /** Objek induk decal (akar karakter / headBall / tulang telapak). */
  parent: Object3D;
  /** Tulang penentu posisi dunia luka. */
  bone: Object3D;
  /** Posisi & normal luka di ruang jangkar (ikat / headBall / telapak). */
  point: Vector3;
  normal: Vector3;
  /** Sumbu panjang segmen di ruang jangkar (arah proksimal). */
  axis: Vector3;
  /** Posisi & normal di ruang lokal tulang `bone`. */
  local: Vector3;
  localNormal: Vector3;
  /** Pusat sumbu segmen (ruang jangkar) & jari-jari permukaan. */
  axisPoint: Vector3;
  radius: number;
  targets: DecalTarget[];
  /** Mesh yang menjadi sasaran (untuk deformasi bengkak). */
  meshes: Mesh[];
  /** Matriks mesh → ruang jangkar (sejajar `meshes`). */
  matrices: (Matrix4 | null)[];
  cloth: DecalTarget[];
}

export interface WoundInput {
  /** Laju perdarahan eksternal dari luka ini (ml/menit). */
  rate: number;
  /** Total darah yang keluar dari luka ini (ml) termasuk sebelum tiba. */
  lostMl: number;
  /** ml yang keluar sejak balut tekan dipasang (rembesan kasa). */
  sinceDressingMl: number;
  pressure: boolean;
  tourniquet: boolean;
  sutured: boolean;
  cleaned: boolean;
  /** Kain darurat dari warga masih terpasang. */
  wrap: boolean;
  /** Sedang berbaring (arah aliran darah). */
  lying: boolean;
  /** Luka bakar sedang didinginkan (basah). */
  cooled: boolean;
}

export class Wound {
  /** Decal lapisan (darah, aliran, rembesan, pucat). */
  readonly decals: Mesh[] = [];
  /** Decal luka utama (dibuat ulang saat dibersihkan/dijahit). */
  readonly baseDecals: Mesh[] = [];
  base: Mesh | null = null;
  film: RevealMaterial | null = null;
  runsUpright: RevealMaterial | null = null;
  runsLying: RevealMaterial | null = null;
  soak: RevealMaterial | null = null;
  dressing: Group | null = null;
  dressingSoak: RevealMaterial | null = null;
  tourniquet: Group | null = null;
  pale: RevealMaterial | null = null;
  wrap: Group | null = null;
  variant = '';
  constructor(
    readonly spec: InjurySpec,
    readonly anchor: Anchor,
    readonly seed: number,
  ) {}

  /** Posisi dunia luka. */
  worldPoint(out: Vector3): Vector3 {
    return out.copy(this.anchor.local).applyMatrix4(this.anchor.bone.matrixWorld);
  }

  /** Normal dunia luka. */
  worldNormal(out: Vector3): Vector3 {
    return out.copy(this.anchor.localNormal).transformDirection(this.anchor.bone.matrixWorld);
  }

  get bleeds(): boolean {
    return !!this.spec.bleeding;
  }
}

/** Matriks objek relatif terhadap jangkar (berjalan ke atas lewat induk). */
function relativeMatrix(obj: Object3D, anchor: Object3D): Matrix4 {
  const m = new Matrix4();
  let o: Object3D | null = obj;
  while (o && o !== anchor) {
    o.updateMatrix();
    m.premultiply(o.matrix);
    o = o.parent;
  }
  return m;
}

export class WoundSet {
  readonly wounds: Wound[] = [];
  private readonly disposables: { dispose(): void }[] = [];
  private readonly ray = new Raycaster();
  private texCache = new Map<string, ReturnType<typeof woundTextures>>();

  constructor(
    private readonly c: Character,
    readonly profile: InjuryProfile,
    seed: number,
  ) {
    // 1) Tentukan lokasi semua luka pada permukaan asli.
    const anchors = profile.wounds.map((w) => this.resolve(w));
    // 2) Bengkak (deformasi) sebelum decal diproyeksikan.
    profile.wounds.forEach((w, i) => this.swell(w, anchors[i]!));
    // 3) Bangun decal.
    profile.wounds.forEach((w, i) => {
      const wound = new Wound(w, anchors[i]!, (seed + i * 7919) >>> 0);
      this.wounds.push(wound);
      this.buildWound(wound);
    });
  }

  private track<T extends { dispose(): void }>(x: T): T {
    this.disposables.push(x);
    return x;
  }

  // -------------------------------------------------------------------------
  // Lokasi anatomis
  // -------------------------------------------------------------------------

  private resolve(spec: InjurySpec): Anchor {
    const c = this.c;
    const d = c.dims;
    const s = d.s;
    const sx = spec.side === 'kiri' ? 1 : spec.side === 'kanan' ? -1 : 1;
    const lateral = new Vector3(sx, 0, 0);
    const fwd = new Vector3(0, 0, 1);
    const face = (spec.face * Math.PI) / 180;
    const dirFrom = (elev = 0) => new Vector3().addScaledVector(fwd, Math.cos(face) * Math.cos(elev)).addScaledVector(lateral, Math.sin(face) * Math.cos(elev)).addScaledVector(UP, Math.sin(elev)).normalize();

    if (spec.region === 'kepala') {
      const parent = c.headBall;
      const meshes: Mesh[] = [];
      c.headGroup.traverse((o) => {
        const m = o as Mesh;
        if (m.isMesh && m.geometry.getAttribute('normal')) meshes.push(m);
      });
      const matrices = meshes.map((m) => relativeMatrix(m, parent));
      const elev = ((1 - spec.at) * 75 * Math.PI) / 180;
      const dir = dirFrom(elev);
      const center = new Vector3(0, 0.012 * c.headShape.spec.hs, 0);
      const hit = this.raycast(meshes, matrices, center, dir, 0.4);
      const point = hit?.point ?? center.clone().addScaledVector(dir, d.headR);
      const normal = hit?.normal ?? dir.clone();
      const axis = UP.clone().addScaledVector(normal, -normal.dot(UP));
      if (axis.lengthSq() < 1e-4) axis.copy(fwd);
      axis.normalize();
      return { space: 'kepala', parent, bone: parent, point, normal, axis, local: point.clone(), localNormal: normal.clone(), axisPoint: center, radius: point.distanceTo(center), targets: meshes.map((m, i) => ({ geometry: m.geometry, matrix: matrices[i]!, skinned: false })), meshes, matrices, cloth: [] };
    }

    if (spec.region === 'telapak_tangan' || spec.region === 'punggung_tangan') {
      const arm = spec.side === 'kanan' ? c.armR : c.armL;
      const hand = spec.side === 'kanan' ? c.handMeshes.R : c.handMeshes.L;
      const parent = arm.end;
      const meshes = hand ? [hand] : [];
      const matrices = meshes.map((m) => relativeMatrix(m, parent));
      // Pose ikat: telapak menghadap ke paha (medial), punggung tangan ke lateral.
      const palm = spec.region === 'telapak_tangan';
      const dir = new Vector3(palm ? -sx : sx, 0, 0.25).normalize();
      const center = new Vector3(0, -d.palm * (0.4 + spec.at * 1.3), 0);
      const hit = this.raycast(meshes, matrices, center, dir, 0.2);
      const point = hit?.point ?? center.clone().addScaledVector(dir, 0.015 * s);
      const normal = hit?.normal ?? dir.clone();
      return { space: 'tangan', parent, bone: parent, point, normal, axis: UP.clone(), local: point.clone(), localNormal: normal.clone(), axisPoint: center, radius: 0.02 * s, targets: meshes.map((m, i) => ({ geometry: m.geometry, matrix: matrices[i]!, skinned: false })), meshes, matrices, cloth: [] };
    }

    // --- Badan (pose ikat, ruang akar) ------------------------------------------
    const hipsY = d.hipsY;
    const hip = new Vector3(sx * d.hipHalf, hipsY - d.hipDrop, 0);
    const knee = hip.clone().add(new Vector3(0, -d.thigh, 0));
    const ankle = knee.clone().add(new Vector3(0, -d.shin, 0));
    const shoulder = new Vector3(sx * d.shoulderHalf, hipsY + d.spineUp + d.chestUp + d.shoulderY, 0);
    const elbow = shoulder.clone().add(new Vector3(0, -d.upperArm, 0));
    const wrist = elbow.clone().add(new Vector3(0, -d.foreArm, 0));
    const leg = spec.side === 'kanan' ? c.legR : c.legL;
    const arm = spec.side === 'kanan' ? c.armR : c.armL;
    let a: Vector3;
    let b: Vector3;
    let bone: Object3D;
    let elev = 0;
    switch (spec.region) {
      case 'paha':
        a = hip;
        b = knee;
        bone = leg.upper;
        break;
      case 'tungkai_bawah':
        a = knee;
        b = ankle;
        bone = leg.lower;
        break;
      case 'pergelangan_kaki':
        a = ankle.clone().add(new Vector3(0, 0.1 * s, 0));
        b = ankle.clone().add(new Vector3(0, 0.0 * s, 0));
        bone = leg.lower;
        break;
      case 'lengan_atas':
        a = shoulder;
        b = elbow;
        bone = arm.upper;
        break;
      case 'lengan_bawah':
        a = elbow;
        b = wrist;
        bone = arm.lower;
        break;
      case 'bahu':
        a = shoulder.clone().add(new Vector3(0, 0.03 * s, 0));
        b = shoulder.clone().add(new Vector3(0, -0.03 * s, 0));
        bone = spec.side === 'kanan' ? c.shoulderR : c.shoulderL;
        elev = 0.55;
        break;
      case 'dada':
        a = new Vector3(0, hipsY + 0.45 * s, 0);
        b = new Vector3(0, hipsY + 0.25 * s, 0);
        bone = c.chest;
        break;
      case 'perut':
        a = new Vector3(0, hipsY + 0.22 * s, 0);
        b = new Vector3(0, hipsY + 0.02 * s, 0);
        bone = c.spine;
        break;
      case 'punggung':
        a = new Vector3(0, hipsY + 0.45 * s, 0);
        b = new Vector3(0, hipsY + 0.08 * s, 0);
        bone = c.chest;
        break;
      case 'leher':
        a = new Vector3(0, hipsY + 0.6 * s, 0);
        b = new Vector3(0, hipsY + 0.5 * s, 0);
        bone = c.neck;
        break;
    }
    const axisPoint = a.clone().lerp(b, spec.at);
    const dir = dirFrom(elev);
    const skin = c.surfaces.filter((x) => x.layer === 'kulit').map((x) => x.mesh);
    const cloth = c.surfaces.filter((x) => x.layer === 'pakaian').map((x) => x.mesh);
    const all = [...skin, ...cloth];
    const hit = this.raycast(skin.length ? skin : all, null, axisPoint, dir, 0.9);
    const point = hit?.point ?? axisPoint.clone().addScaledVector(dir, 0.05 * s);
    const normal = (hit?.normal ?? dir.clone()).clone().multiplyScalar(0.55).addScaledVector(dir, 0.45).normalize();
    const axis = new Vector3().subVectors(a, b).normalize();
    // Posisi dalam ruang tulang: boneInverse (pose ikat) × titik.
    const bones = c.skeleton.bones;
    const bi = bones.indexOf(bone as never);
    const inv = bi >= 0 ? c.skeleton.boneInverses[bi]! : new Matrix4();
    return {
      space: 'badan',
      parent: c.root,
      bone,
      point,
      normal,
      axis,
      local: point.clone().applyMatrix4(inv),
      localNormal: normal.clone().transformDirection(inv),
      axisPoint,
      radius: Math.max(0.02, Math.hypot(point.x - axisPoint.x, point.z - axisPoint.z)),
      targets: skin.map((m) => ({ geometry: m.geometry, matrix: null, skinned: true })),
      meshes: all,
      matrices: all.map(() => null),
      cloth: cloth.map((m) => ({ geometry: m.geometry, matrix: null, skinned: true })),
    };
  }

  /** Raycast dari luar menuju titik pusat; mengembalikan permukaan terluar. */
  private raycast(meshes: Mesh[], matrices: (Matrix4 | null)[] | null, center: Vector3, dir: Vector3, dist: number): { point: Vector3; normal: Vector3 } | null {
    const origin = center.clone().addScaledVector(dir, dist);
    this.ray.set(origin, dir.clone().negate());
    this.ray.far = dist * 2;
    let best: { point: Vector3; normal: Vector3; d: number } | null = null;
    const probeMat = new MeshBasicMaterial({ side: DoubleSide });
    meshes.forEach((m, i) => {
      const probe = new Mesh(m.geometry, probeMat);
      const mat = matrices?.[i];
      if (mat) {
        probe.matrixAutoUpdate = false;
        probe.matrix.copy(mat);
      }
      probe.updateMatrixWorld(true);
      const hits = this.ray.intersectObject(probe, false);
      const h = hits[0];
      if (h && (!best || h.distance < best.d)) {
        const n = h.face ? h.face.normal.clone().transformDirection(probe.matrixWorld) : dir.clone();
        if (n.dot(dir) < 0) n.negate();
        best = { point: h.point.clone(), normal: n, d: h.distance };
      }
    });
    probeMat.dispose();
    return best;
  }

  // -------------------------------------------------------------------------
  // Bengkak (deformasi permukaan)
  // -------------------------------------------------------------------------

  private swell(spec: InjurySpec, an: Anchor): void {
    let amount = 0;
    let radius = 0;
    if (spec.kind === 'bengkak') {
      amount = Math.min(0.022, (spec.size[1] / 100) * 0.16 + 0.004);
      radius = (spec.size[0] / 100) * 0.55;
    } else if (spec.kind === 'hematoma') {
      amount = 0.008 + (spec.size[1] / 100) * 0.08;
      radius = (spec.size[0] / 100) * 0.5;
    } else if (spec.kind === 'emfisema') {
      amount = 0.007;
      radius = (spec.size[0] / 100) * 0.5;
    } else return;
    const geos = new Set<BufferGeometry>();
    an.meshes.forEach((m, i) => {
      if (geos.has(m.geometry)) return;
      geos.add(m.geometry);
      const mat = an.matrices[i] ?? null;
      const inv = mat ? mat.clone().invert() : null;
      const pos = m.geometry.getAttribute('position');
      const nrm = m.geometry.getAttribute('normal');
      const p = new Vector3();
      const n = new Vector3();
      const center = inv ? an.point.clone().applyMatrix4(inv) : an.point;
      for (let k = 0; k < pos.count; k++) {
        p.fromBufferAttribute(pos, k);
        const dist = p.distanceTo(center);
        if (dist > radius * 1.8) continue;
        n.fromBufferAttribute(nrm, k);
        // Hanya sisi yang sama dengan luka (bengkak tidak menembus ke sisi lain tungkai).
        const facing = inv ? n.clone().transformDirection(mat!).dot(an.normal) : n.dot(an.normal);
        if (facing < -0.25) continue;
        const f = Math.exp(-((dist / radius) ** 2)) * (0.55 + 0.45 * Math.max(0, facing));
        p.addScaledVector(n, amount * f);
        pos.setXYZ(k, p.x, p.y, p.z);
      }
      pos.needsUpdate = true;
      m.geometry.computeBoundingSphere();
    });
  }

  // -------------------------------------------------------------------------
  // Decal
  // -------------------------------------------------------------------------

  private addDecal(an: Anchor, pr: Projector, mat: Material, renderOrder: number, targets: DecalTarget[] = an.targets): Mesh | null {
    const geo = projectDecal(targets, pr);
    if (!geo) return null;
    this.track(geo);
    let mesh: Mesh;
    if (an.space === 'badan') {
      const sm = new SkinnedMesh(geo, mat);
      an.parent.add(sm);
      sm.bind(this.c.skeleton, IDENTITY);
      mesh = sm;
    } else {
      mesh = new Mesh(geo, mat);
      an.parent.add(mesh);
    }
    mesh.frustumCulled = false;
    mesh.renderOrder = renderOrder;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    return mesh;
  }

  /** Proyektor luka utama (sumbu panjang diputar sebesar `angle`). */
  private projector(an: Anchor, wM: number, hM: number, angleDeg: number, normal = an.normal, center = an.point): Projector {
    const up = an.axis.clone().addScaledVector(normal, -an.axis.dot(normal)).normalize();
    if (angleDeg) up.applyAxisAngle(normal, (angleDeg * Math.PI) / 180);
    const depth = Math.min(0.08, Math.max(0.025, Math.max(wM, hM) * 0.5, an.radius * 0.9));
    return { center: center.clone(), normal: normal.clone(), up, width: wM, height: hM, depth };
  }

  private textures(spec: InjurySpec, seed: number, variant: { sutured?: boolean; clean?: boolean }) {
    const key = `${spec.id}|${variant.sutured ? 1 : 0}|${variant.clean ? 1 : 0}`;
    let t = this.texCache.get(key);
    if (!t) {
      t = woundTextures(spec, seed, variant);
      this.track(t.map);
      this.track(t.normal);
      this.track(t.rough);
      this.texCache.set(key, t);
    }
    return t;
  }

  private buildBase(w: Wound, variant: { sutured?: boolean; clean?: boolean }): void {
    const spec = w.spec;
    const an = w.anchor;
    for (const m of w.baseDecals) m.removeFromParent();
    w.baseDecals.length = 0;
    w.base = null;
    if (spec.kind === 'emfisema') return;
    const t = this.textures(spec, w.seed, variant);
    const mat = this.track(woundMaterial(t.map, t.normal, t.rough));
    if (spec.circumferential && an.space === 'badan') {
      // Mengelilingi tungkai: empat proyeksi yang saling bertumpuk.
      const circ = 2 * Math.PI * an.radius;
      const wM = (circ / 4) * 1.45;
      for (const k of [0, 1, 2, 3]) {
        const ang = (k * Math.PI) / 2;
        const lat = new Vector3(an.axisPoint.x >= 0 ? 1 : -1, 0, 0);
        const dir = new Vector3(0, 0, 1).multiplyScalar(Math.cos(ang)).addScaledVector(lat, Math.sin(ang)).normalize();
        const hit = this.raycast(this.c.surfaces.filter((x) => x.layer === 'kulit').map((x) => x.mesh), null, an.axisPoint, dir, 0.9);
        const center = hit?.point ?? an.axisPoint.clone().addScaledVector(dir, an.radius);
        const pr = this.projector({ ...an, axis: an.axis }, wM, t.heightM, 0, dir, center);
        pr.depth = an.radius * 1.1;
        const mesh = this.addDecal(an, pr, mat, 1);
        if (mesh) w.baseDecals.push(mesh);
      }
    } else {
      const mesh = this.addDecal(an, this.projector(an, t.widthM, t.heightM, spec.angle ?? 0), mat, 1);
      if (mesh) {
        w.baseDecals.push(mesh);
        w.base = mesh;
      }
    }
  }

  private buildWound(w: Wound): void {
    const spec = w.spec;
    const an = w.anchor;
    this.buildBase(w, { clean: spec.clean });
    w.variant = '';
    const open = spec.kind === 'laserasi' || spec.kind === 'bacok' || spec.kind === 'iris' || spec.kind === 'tusuk' || spec.kind === 'ekskoriasi';
    if (!spec.bleeding && !open) return;
    const arterial = spec.bleeding?.type === 'arteri';
    // Lapisan darah basah di sekitar luka.
    const fw = (spec.size[0] + 4) / 100;
    const film = bloodTexture('film', w.seed + 1, fw * 100, fw * 100, arterial);
    this.track(film.map);
    w.film = revealMaterial(film.map, 'radial', true);
    this.track(w.film.material);
    const fm = this.addDecal(an, this.projector(an, fw, fw, spec.angle ?? 0), w.film.material, 2);
    if (fm) w.decals.push(fm);
    w.film.setReveal(0);
    if (!spec.bleeding) return;
    // Aliran darah: berdiri (ke bawah) & berbaring (ke arah punggung/kasur).
    const runLen = an.space === 'kepala' ? 0.12 : an.space === 'tangan' ? 0.08 : 0.2;
    for (const lying of [false, true]) {
      const g = an.space === 'badan' ? (lying ? DOWN_SUPINE : DOWN_UPRIGHT) : lying ? new Vector3(0, 0, -1) : DOWN_UPRIGHT;
      const t = g.clone().addScaledVector(an.normal, -g.dot(an.normal));
      if (t.lengthSq() < 0.05) t.copy(new Vector3(an.point.x >= 0 ? 1 : -1, 0, 0).addScaledVector(an.normal, -an.normal.x * (an.point.x >= 0 ? 1 : -1)));
      t.normalize();
      const runTex = bloodTexture('run', w.seed + (lying ? 3 : 2), 6, runLen * 100, arterial);
      this.track(runTex.map);
      const rm = revealMaterial(runTex.map, 'down', true);
      this.track(rm.material);
      const normal = an.normal.clone().addScaledVector(t, 0.55).normalize();
      const center = an.point.clone().addScaledVector(t, runLen * 0.45);
      const pr: Projector = { center, normal, up: t.clone().negate(), width: 0.06, height: runLen, depth: Math.max(0.06, an.radius * 1.4) };
      const mesh = this.addDecal(an, pr, rm.material, 3);
      if (mesh) w.decals.push(mesh);
      rm.setReveal(0);
      if (lying) w.runsLying = rm;
      else w.runsUpright = rm;
    }
    // Rembesan darah di pakaian dekat luka.
    if (an.cloth.length) {
      const soakTex = bloodTexture('soak', w.seed + 4, 34, 40);
      this.track(soakTex.map);
      w.soak = revealMaterial(soakTex.map, 'radial', false);
      this.track(w.soak.material);
      const pr = this.projector(an, 0.34, 0.4, 0);
      pr.depth = 0.22;
      const sm = this.addDecal(an, pr, w.soak.material, 2, an.cloth);
      if (sm) w.decals.push(sm);
      w.soak.setReveal(0);
    }
  }

  // -------------------------------------------------------------------------
  // Balutan, torniket, kain darurat (benda kaku pada tulang)
  // -------------------------------------------------------------------------

  private limbBand(w: Wound, offsetM: number, widthM: number, extra: number, mat: Material, open = true, arc: number | null = null): Mesh | null {
    const an = w.anchor;
    if (an.space !== 'badan') return null;
    const center = an.axisPoint.clone().addScaledVector(an.axis, offsetM);
    // Jari-jari tungkai di tepi atas & bawah pita: raycast dari sumbu ke luar (permukaan tungkai
    // sendiri, bukan tungkai sebelah), ambil yang terbesar dari beberapa arah.
    const radAt = (p: Vector3) => {
      let r = 0;
      const meshes = this.c.surfaces.map((x) => x.mesh);
      const probeMat = new MeshBasicMaterial({ side: DoubleSide });
      for (let k = 0; k < 8; k++) {
        const ang = (k / 8) * Math.PI * 2;
        this.ray.set(p, new Vector3(Math.sin(ang), 0, Math.cos(ang)));
        this.ray.far = 0.3;
        for (const m of meshes) {
          const h = this.ray.intersectObject(new Mesh(m.geometry, probeMat), false)[0];
          if (h) r = Math.max(r, h.distance);
        }
      }
      probeMat.dispose();
      return r > 0.01 ? Math.min(r, an.radius * 1.6) : an.radius;
    };
    const rTop = radAt(center.clone().addScaledVector(an.axis, widthM / 2)) + extra;
    const rBot = radAt(center.clone().addScaledVector(an.axis, -widthM / 2)) + extra;
    const geo = this.track(arc ? new CylinderGeometry(rTop, rBot, widthM, 20, 1, open, Math.PI - arc / 2, arc) : new CylinderGeometry(rTop, rBot, widthM, 28, 1, open));
    const mesh = new Mesh(geo, mat);
    // Sumbu silinder = sumbu tungkai; sisi u=0,5 (−Z lokal) diputar menghadap luka.
    const q = new Quaternion().setFromUnitVectors(UP, an.axis);
    const face = new Vector3(0, 0, -1).applyQuaternion(q);
    const toWound = an.normal.clone().addScaledVector(an.axis, -an.normal.dot(an.axis)).normalize();
    const spin = Math.atan2(new Vector3().crossVectors(face, toWound).dot(an.axis), face.dot(toWound));
    const qFinal = new Quaternion().setFromAxisAngle(an.axis, spin).multiply(q);
    // Posisikan pada ruang tulang (ikut tungkai secara kaku).
    const bones = this.c.skeleton.bones;
    const inv = this.c.skeleton.boneInverses[bones.indexOf(an.bone as never)] ?? new Matrix4();
    const m = new Matrix4().compose(center, qFinal, new Vector3(1, 1, 1)).premultiply(inv);
    m.decompose(mesh.position, mesh.quaternion, mesh.scale);
    mesh.castShadow = true;
    mesh.frustumCulled = false;
    return mesh;
  }

  /** Kelompok benda kaku pada tulang luka (koordinat lokal tulang). */
  private boneGroup(w: Wound): Group {
    const g = new Group();
    w.anchor.bone.add(g);
    return g;
  }

  private ensureDressing(w: Wound): void {
    if (w.dressing) return;
    const an = w.anchor;
    const g = this.boneGroup(w);
    w.dressing = g;
    const gauze = this.track(gauzeTexture());
    gauze.repeat.set(3, 3);
    const padMat = this.track(new MeshStandardMaterial({ color: '#f6f4ee', map: gauze, roughness: 0.95 }));
    const crepe = this.track(new MeshStandardMaterial({ color: '#e2cfae', roughness: 0.92, side: DoubleSide }));
    if (an.space === 'badan' && ['paha', 'tungkai_bawah', 'lengan_atas', 'lengan_bawah', 'pergelangan_kaki'].includes(w.spec.region)) {
      const band = this.limbBand(w, 0, Math.max(0.09, w.spec.size[0] / 100 + 0.05), 0.012, crepe, true);
      if (band) g.add(band);
      // Rembesan darah menembus pembalut (meluas dari sisi luka).
      const soakTex = bloodTexture('soak', w.seed + 9, 30, 30);
      this.track(soakTex.map);
      w.dressingSoak = revealMaterial(soakTex.map, 'radial', false);
      this.track(w.dressingSoak.material);
      const soak = this.limbBand(w, 0, Math.max(0.09, w.spec.size[0] / 100 + 0.05), 0.0135, w.dressingSoak.material, true, 2.0);
      if (soak) g.add(soak);
      w.dressingSoak.setReveal(0);
    } else {
      // Kasa tebal ditempel di atas luka (badan/kepala/tangan).
      const pad = new Mesh(this.track(new BoxGeometry(w.spec.size[1] / 100 + 0.05, w.spec.size[0] / 100 + 0.05, 0.012)), padMat);
      const up = an.axis.clone().addScaledVector(an.normal, -an.axis.dot(an.normal)).normalize();
      const m = new Matrix4().lookAt(new Vector3(), an.normal.clone().negate(), up);
      pad.quaternion.setFromRotationMatrix(m);
      pad.position.copy(an.point).addScaledVector(an.normal, 0.006);
      if (an.space === 'badan') {
        const bones = this.c.skeleton.bones;
        const inv = this.c.skeleton.boneInverses[bones.indexOf(an.bone as never)] ?? new Matrix4();
        new Matrix4().compose(pad.position, pad.quaternion, pad.scale).premultiply(inv).decompose(pad.position, pad.quaternion, pad.scale);
      }
      g.add(pad);
    }
  }

  private ensureTourniquet(w: Wound): void {
    if (w.tourniquet || w.anchor.space !== 'badan') return;
    const g = this.boneGroup(w);
    w.tourniquet = g;
    const strap = this.track(new MeshStandardMaterial({ color: '#16181b', roughness: 0.7 }));
    const seg = w.spec.region === 'paha' || w.spec.region === 'lengan_atas' ? 1 : 0;
    // 5–7 cm proksimal dari luka (tidak di sendi).
    const offset = Math.min(0.07, w.spec.size[0] / 200 + 0.06);
    const band = this.limbBand(w, offset * (seg ? 1 : 1), 0.038, 0.006, strap, false);
    if (band) {
      g.add(band);
      // Batang pemutar (windlass) & label waktu.
      const rod = new Mesh(this.track(new CylinderGeometry(0.006, 0.006, 0.13, 10)), this.track(new MeshStandardMaterial({ color: '#2b2f33', roughness: 0.4, metalness: 0.3 })));
      rod.rotation.z = Math.PI / 2;
      const geo = band.geometry as CylinderGeometry;
      const r = geo.parameters.radiusTop;
      rod.position.set(0, 0, -(r + 0.012));
      band.add(rod);
      const tag = new Mesh(this.track(new BoxGeometry(0.035, 0.02, 0.002)), this.track(new MeshStandardMaterial({ color: '#c0392b', roughness: 0.6 })));
      tag.position.set(0.03, 0, -(r + 0.006));
      band.add(tag);
    }
    // Tungkai distal memucat (iskemia) saat torniket terpasang.
    const pale = this.paleTexture();
    w.pale = revealMaterial(pale, 'down', false);
    this.track(w.pale.material);
    const an = w.anchor;
    const skin = this.c.surfaces.filter((x) => x.layer === 'kulit').map((x) => x.mesh);
    const distal = an.axisPoint.clone().addScaledVector(an.axis, -0.18);
    for (const k of [0, 1, 2, 3]) {
      const ang = (k * Math.PI) / 2;
      const dir = new Vector3(Math.sin(ang), 0, Math.cos(ang));
      const hit = this.raycast(skin, null, distal, dir, 0.6);
      if (!hit) continue;
      const pr: Projector = { center: hit.point, normal: dir, up: an.axis.clone(), width: an.radius * 2.4, height: 0.42, depth: an.radius * 1.2 };
      const mesh = this.addDecal(an, pr, w.pale.material, 2, an.targets);
      if (mesh) w.decals.push(mesh);
    }
    w.pale.setReveal(0);
  }

  private paleTexture(): CanvasTexture {
    const S = 128;
    const cv = document.createElement('canvas');
    cv.width = S;
    cv.height = S;
    const g = cv.getContext('2d')!;
    const img = g.createImageData(S, S);
    for (let j = 0; j < S; j++) {
      for (let i = 0; i < S; i++) {
        const k = (j * S + i) * 4;
        const mott = 0.5 + 0.5 * Math.sin(i * 0.31 + Math.sin(j * 0.17) * 3) * Math.cos(j * 0.23 + i * 0.05);
        img.data[k] = 214 - mott * 36;
        img.data[k + 1] = 218 - mott * 22;
        img.data[k + 2] = 226 - mott * 4;
        img.data[k + 3] = Math.round(255 * (0.22 + 0.12 * mott) * Math.min(1, j / 10));
      }
    }
    g.putImageData(img, 0, 0);
    const t = this.track(new CanvasTexture(cv));
    t.colorSpace = SRGBColorSpace;
    return t;
  }

  private ensureWrap(w: Wound): void {
    if (w.wrap || w.anchor.space !== 'badan') return;
    const g = this.boneGroup(w);
    w.wrap = g;
    // Kain sarung/batik yang diikat warga, basah darah.
    const cv = document.createElement('canvas');
    cv.width = 128;
    cv.height = 64;
    const x = cv.getContext('2d')!;
    x.fillStyle = '#6b4a2b';
    x.fillRect(0, 0, 128, 64);
    x.strokeStyle = '#2d1d10';
    for (let i = 0; i < 128; i += 10) {
      x.beginPath();
      x.arc(i, 32, 6, 0, Math.PI * 2);
      x.stroke();
    }
    // Basah darah di sebagian besar kain.
    const grad = x.createRadialGradient(64, 32, 4, 64, 32, 70);
    grad.addColorStop(0, 'rgba(70,4,8,0.95)');
    grad.addColorStop(0.75, 'rgba(90,10,12,0.85)');
    grad.addColorStop(1, 'rgba(90,10,12,0.3)');
    x.fillStyle = grad;
    x.fillRect(0, 0, 128, 64);
    const tex = this.track(new CanvasTexture(cv));
    tex.colorSpace = SRGBColorSpace;
    const mat = this.track(new MeshStandardMaterial({ map: tex, roughness: 0.45, side: DoubleSide }));
    const band = this.limbBand(w, 0.025, 0.08, 0.009, mat, true);
    if (band) g.add(band);
  }

  // -------------------------------------------------------------------------
  // Pembaruan keadaan
  // -------------------------------------------------------------------------

  /** Terapkan keadaan klinis terkini ke tampilan luka. */
  apply(w: Wound, st: WoundInput): void {
    const spec = w.spec;
    // Varian luka (dibersihkan/dijahit) — tekstur dibuat ulang bila berubah.
    const variant = `${st.sutured ? 'J' : ''}${st.cleaned ? 'B' : ''}`;
    if (variant !== w.variant && (st.sutured || st.cleaned)) {
      w.variant = variant;
      this.buildBase(w, { sutured: st.sutured, clean: st.cleaned || st.sutured });
    }
    // Darah segar: tampak bila sedang/baru berdarah; aliran memanjang sesuai volume.
    const active = st.rate > 0.05 && !st.sutured;
    if (w.film) w.film.setReveal(st.sutured ? 0 : st.cleaned && !active ? 0 : Math.min(0.92, 0.45 + st.rate / 12 + Math.min(0.3, st.lostMl / 600)) * (active || st.lostMl > 5 ? 1 : 0));
    const runReveal = st.sutured || (st.cleaned && !active) ? 0 : Math.min(1, st.lostMl / (spec.bleeding?.type === 'kapiler' ? 25 : 120));
    w.runsLying?.setReveal(st.lying ? runReveal : 0);
    w.runsUpright?.setReveal(st.lying ? 0 : runReveal);
    w.soak?.setReveal(Math.min(1, st.lostMl / 700));
    // Balut tekan & rembesannya.
    if (st.pressure) this.ensureDressing(w);
    if (w.dressing) w.dressing.visible = st.pressure;
    w.dressingSoak?.setReveal(st.pressure ? Math.min(1, st.sinceDressingMl / 220) : 0);
    // Torniket & iskemia distal.
    if (st.tourniquet) this.ensureTourniquet(w);
    if (w.tourniquet) w.tourniquet.visible = st.tourniquet;
    w.pale?.setReveal(st.tourniquet ? 1 : 0);
    // Kain darurat warga.
    if (st.wrap) this.ensureWrap(w);
    if (w.wrap) w.wrap.visible = st.wrap;
    // Luka bakar yang didinginkan tampak basah.
    if (spec.kind === 'luka_bakar') for (const m of w.baseDecals) ((m.material as MeshStandardMaterial).roughness = st.cooled ? 0.4 : 1);
  }

  private hemaSoak: RevealMaterial | null = null;
  /** Decal di luar luka (noda muntah darah, celana basah darah) — dilepas saat dispose. */
  private readonly extras: Mesh[] = [];

  /** Darah muntahan di bagian depan baju (rembesan meluas sesuai volume muntah darah). */
  setHematemesis(ml: number): void {
    if (!this.hemaSoak) {
      const spec: InjurySpec = { id: 'hema', kind: 'memar', region: 'dada', side: 'tengah', at: 0.3, face: 0, size: [10, 10], label: 'Noda muntah darah di baju' };
      const an = this.resolve(spec);
      const tex = bloodTexture('soak', 4242, 26, 30);
      this.track(tex.map);
      this.hemaSoak = revealMaterial(tex.map, 'radial', false);
      this.track(this.hemaSoak.material);
      const targets = an.cloth.length ? an.cloth : an.targets;
      const pr = this.projector(an, 0.24, 0.3, 0);
      pr.depth = 0.2;
      const m = this.addDecal(an, pr, this.hemaSoak.material, 2, targets);
      if (m) this.extras.push(m);
    }
    this.hemaSoak.setReveal(Math.min(1, 0.25 + ml / 500));
  }

  private vagSoak: RevealMaterial | null = null;

  /** Perdarahan pervaginam: celana basah darah di selangkangan & paha dalam, meluas seiring volume. */
  setVaginal(ml: number): void {
    if (!this.vagSoak) {
      const tex = bloodTexture('soak', 5151, 22, 28);
      this.track(tex.map);
      this.vagSoak = revealMaterial(tex.map, 'radial', false);
      this.track(this.vagSoak.material);
      for (const side of ['kiri', 'kanan'] as const) {
        const spec: InjurySpec = { id: `vag-${side}`, kind: 'memar', region: 'paha', side, at: 0.16, face: -78, size: [10, 10], label: 'Noda darah di celana' };
        const an = this.resolve(spec);
        // Hanya celana/rok (ujung baju yang menjuntai di depan selangkangan tidak ikut ternoda).
        const pants = this.c.surfaces.filter((x) => x.part === 'bawah').map((x): DecalTarget => ({ geometry: x.mesh.geometry, matrix: null, skinned: true }));
        const targets = pants.length ? pants : an.targets;
        const pr = this.projector(an, 0.15, 0.24, 0);
        pr.depth = 0.14;
        const m = this.addDecal(an, pr, this.vagSoak.material, 2, targets);
        if (m) this.extras.push(m);
      }
    }
    this.vagSoak.setReveal(ml > 5 ? Math.min(1, 0.3 + ml / 1100) : 0);
  }

  dispose(): void {
    for (const w of this.wounds) {
      for (const m of [...w.decals, ...w.baseDecals]) m.removeFromParent();
      w.dressing?.removeFromParent();
      w.tourniquet?.removeFromParent();
      w.wrap?.removeFromParent();
    }
    for (const m of this.extras) m.removeFromParent();
    this.extras.length = 0;
    for (const d of this.disposables) d.dispose();
    this.disposables.length = 0;
  }
}

/** Warna kulit untuk tes/aksesibilitas. */
export const WOUND_COLOR = new Color('#6e070c');
