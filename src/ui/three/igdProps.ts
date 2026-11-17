/**
 * Properti bergerak IGD: brankar ambulans, kursi roda, selang (infus/oksigen) yang mengikuti
 * dua titik, dan perlengkapan yang menempel di tubuh pasien (kanul nasal, sungkup, NRM, NIV,
 * pipa endotrakeal, bag-valve-mask, collar servikal, pad defibrilator, elektroda EKG, klip SpO₂,
 * kanul IV, torniket, bidai, pelvic binder).
 */
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Line,
  LineBasicMaterial,
  type Material,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three';
import type { AirwayAdjunct, OxygenDevice } from '../../core/igd/types';
import type { Actor, BedPose, CarryAnchor } from './actor';
import { StainSurface } from './bloodFx';

type Disposable = { dispose(): void };

class Kit {
  readonly disposables: Disposable[] = [];
  track<T extends Disposable>(x: T): T {
    this.disposables.push(x);
    return x;
  }
  mat(color: string, extra: Partial<{ roughness: number; metalness: number; transparent: boolean; opacity: number }> = {}): MeshStandardMaterial {
    const m = this.track(new MeshStandardMaterial({ color, roughness: 0.7, metalness: 0, ...extra }));
    if (extra.transparent) {
      m.side = DoubleSide;
      m.depthWrite = false;
    }
    return m;
  }
  box(parent: Object3D, w: number, h: number, d: number, m: Material, x: number, y: number, z: number, cast = true): Mesh {
    const mesh = new Mesh(this.track(new BoxGeometry(w, h, d)), m);
    mesh.position.set(x, y, z);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  cyl(parent: Object3D, r0: number, r1: number, h: number, m: Material, x: number, y: number, z: number, seg = 12): Mesh {
    const mesh = new Mesh(this.track(new CylinderGeometry(r0, r1, h, seg)), m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }
  dispose(): void {
    for (const d of this.disposables) d.dispose();
    this.disposables.length = 0;
  }
}

/** Brankar ambulans: kepala di −Z lokal. `incline` = sandaran punggung (rad). */
export class Stretcher {
  readonly group = new Group();
  readonly top = 0.8;
  incline = 0.35;
  private readonly kit = new Kit();
  private readonly back: Group;
  private readonly cover: Mesh;
  private readonly tmp = new Vector3();

  constructor() {
    const k = this.kit;
    const frame = k.mat('#e7c43b', { roughness: 0.45, metalness: 0.3 });
    const metal = k.mat('#c3c9ce', { roughness: 0.3, metalness: 0.75 });
    const pad = k.mat('#1f2a33', { roughness: 0.75 });
    const sheet = k.mat('#e9eef0', { roughness: 0.95 });
    const black = k.mat('#1b1e22', { roughness: 0.6 });
    const g = this.group;
    k.box(g, 0.6, 0.05, 1.95, frame, 0, this.top - 0.12, 0);
    for (const dx of [-0.22, 0.22]) for (const dz of [-0.7, 0.7]) {
      const leg = k.cyl(g, 0.018, 0.018, this.top - 0.2, metal, dx, (this.top - 0.2) / 2 + 0.06, dz, 8);
      leg.rotation.x = dz > 0 ? 0.18 : -0.18;
      k.cyl(g, 0.05, 0.05, 0.035, black, dx, 0.05, dz * 1.08, 10).rotation.z = Math.PI / 2;
    }
    // Kasur bagian kaki & sandaran berengsel.
    k.box(g, 0.56, 0.08, 1.05, pad, 0, this.top - 0.05, 0.42);
    k.box(g, 0.57, 0.01, 1.05, sheet, 0, this.top - 0.005, 0.42, false);
    this.back = new Group();
    this.back.position.set(0, this.top - 0.05, -0.1);
    g.add(this.back);
    k.box(this.back, 0.56, 0.08, 0.86, pad, 0, 0, -0.43);
    k.box(this.back, 0.57, 0.01, 0.86, sheet, 0, 0.045, -0.43, false);
    k.box(this.back, 0.42, 0.08, 0.3, k.mat('#f4f6f7', { roughness: 0.95 }), 0, 0.08, -0.7, false);
    // Pagar & pegangan.
    for (const sx of [-1, 1]) k.box(g, 0.02, 0.02, 0.9, metal, sx * 0.3, this.top + 0.1, 0.45, false);
    k.box(g, 0.5, 0.025, 0.025, metal, 0, this.top + 0.05, 0.99, false);
    k.box(g, 0.5, 0.025, 0.025, metal, 0, this.top + 0.05, -0.99, false);
    // Kain penutup (jenazah).
    this.cover = k.box(g, 0.6, 0.26, 1.85, k.mat('#f1f3f2', { roughness: 0.95 }), 0, this.top + 0.13, 0);
    this.cover.visible = false;
    // Sabuk pengaman oranye.
    k.box(g, 0.62, 0.012, 0.06, k.mat('#e8762b'), 0, this.top + 0.11, 0.5, false);
    this.group.traverse((o) => {
      if ((o as Mesh).isMesh) (o as Mesh).receiveShadow = true;
    });
  }

  /** Noda darah di kasur brankar (bagian kaki & pinggul). */
  readonly stain: StainSurface = new StainSurface(`brankar-${Math.random().toString(36).slice(2, 8)}`, this.group, new Vector3(0, this.top - 0.004, 0.42), 0.56, 1.05, 'kain');

  place(x: number, z: number, yaw: number): void {
    this.group.position.set(x, 0, z);
    this.group.rotation.y = yaw;
  }

  setCovered(on: boolean): void {
    this.cover.visible = on;
  }

  update(): void {
    this.back.rotation.x = this.incline;
  }

  /** Pose berbaring di brankar (titik pinggul). */
  pose(roll = 0, legsUp = 0): BedPose {
    const p = this.tmp.set(0, 0, -0.1).applyAxisAngle(UP, this.group.rotation.y).add(this.group.position);
    return { x: p.x, y: this.top, z: p.z, yaw: this.group.rotation.y, incline: this.incline, roll, legsUp };
  }

  /** Titik dunia dari koordinat lokal brankar. */
  local(x: number, y: number, z: number, out: Vector3): Vector3 {
    return out.set(x, y, z).applyAxisAngle(UP, this.group.rotation.y).add(this.group.position);
  }

  dispose(): void {
    this.stain.dispose();
    this.group.removeFromParent();
    this.kit.dispose();
  }
}

const UP = new Vector3(0, 1, 0);

/** Kursi roda: menghadap +Z lokal; pegangan dorong di belakang. */
export class Wheelchair {
  readonly group = new Group();
  readonly seatY = 0.48;
  private readonly kit = new Kit();

  constructor() {
    const k = this.kit;
    const frame = k.mat('#9aa3aa', { roughness: 0.3, metalness: 0.7 });
    const seat = k.mat('#24324a', { roughness: 0.8 });
    const tire = k.mat('#1b1e22', { roughness: 0.7 });
    const g = this.group;
    k.box(g, 0.44, 0.04, 0.42, seat, 0, this.seatY - 0.02, 0);
    k.box(g, 0.44, 0.42, 0.03, seat, 0, this.seatY + 0.22, -0.22);
    for (const sx of [-1, 1]) {
      const wheel = new Mesh(k.track(new TorusGeometry(0.28, 0.022, 8, 24)), tire);
      wheel.position.set(sx * 0.27, 0.3, -0.06);
      wheel.rotation.y = Math.PI / 2;
      wheel.castShadow = true;
      g.add(wheel);
      k.cyl(g, 0.012, 0.012, 0.55, frame, sx * 0.27, 0.3, -0.06, 6).rotation.x = Math.PI / 2;
      k.cyl(g, 0.045, 0.045, 0.03, tire, sx * 0.2, 0.05, 0.3, 10).rotation.z = Math.PI / 2;
      k.box(g, 0.02, 0.02, 0.5, frame, sx * 0.22, this.seatY + 0.2, -0.02, false);
      k.box(g, 0.02, 0.5, 0.02, frame, sx * 0.21, this.seatY + 0.2, -0.24, false);
      k.box(g, 0.02, 0.02, 0.12, frame, sx * 0.21, this.seatY + 0.46, -0.3, false);
      k.box(g, 0.12, 0.012, 0.1, frame, sx * 0.09, 0.12, 0.36, false);
    }
  }

  place(x: number, z: number, yaw: number): void {
    this.group.position.set(x, 0, z);
    this.group.rotation.y = yaw;
  }

  /** Jangkar duduk pasien (lihat Actor.carry). */
  anchor(): CarryAnchor {
    const p = this.group.position;
    const yaw = this.group.rotation.y;
    return { x: p.x - Math.sin(yaw) * 0.03, y: 0, z: p.z - Math.cos(yaw) * 0.03, yaw };
  }

  /** Titik pegangan dorong (dunia). */
  handle(side: 1 | -1, out: Vector3): Vector3 {
    return out.set(side * 0.21, this.seatY + 0.46, -0.36).applyAxisAngle(UP, this.group.rotation.y).add(this.group.position);
  }

  dispose(): void {
    this.group.removeFromParent();
    this.kit.dispose();
  }
}

/** Selang tipis yang melengkung antara dua titik (infus, oksigen, kabel). */
export class Tube {
  readonly line: Line;
  private readonly geo = new BufferGeometry();
  private readonly mat: LineBasicMaterial;
  private readonly n = 14;

  constructor(color: string) {
    this.geo.setAttribute('position', new BufferAttribute(new Float32Array(this.n * 3), 3));
    this.mat = new LineBasicMaterial({ color });
    this.line = new Line(this.geo, this.mat);
    this.line.frustumCulled = false;
    this.line.visible = false;
  }

  set(a: Vector3, b: Vector3, sag = 0.15): void {
    const pos = this.geo.getAttribute('position') as BufferAttribute;
    for (let i = 0; i < this.n; i++) {
      const t = i / (this.n - 1);
      pos.setXYZ(i, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t - Math.sin(Math.PI * t) * sag, a.z + (b.z - a.z) * t);
    }
    pos.needsUpdate = true;
    this.line.visible = true;
  }

  hide(): void {
    this.line.visible = false;
  }

  dispose(): void {
    this.line.removeFromParent();
    this.geo.dispose();
    this.mat.dispose();
  }
}

export interface GearState {
  oxygen: OxygenDevice;
  adjunct: AirwayAdjunct;
  bvm: boolean;
  collar: boolean;
  pads: boolean;
  monitor: boolean;
  iv: boolean;
  tourniquet: boolean;
  splint: boolean;
  binder: boolean;
}

/** Perlengkapan yang menempel pada tubuh pasien (ikut tulang karakter). */
export class Gear {
  private readonly kit = new Kit();
  private readonly items = new Map<string, Object3D>();
  private key = '';

  constructor(private readonly actor: Actor) {}

  private build(id: string): Object3D {
    const have = this.items.get(id);
    if (have) return have;
    const k = this.kit;
    const c = this.actor.character;
    const d = c.dims;
    const s = d.s;
    const hs = c.headShape.spec.hs;
    const mouth = c.headSite('mulut', 0, new Vector3());
    const g = new Group();
    const clear = k.mat('#d8f0e6', { transparent: true, opacity: 0.5, roughness: 0.15 });
    const tubeMat = k.mat('#e8f4f0', { roughness: 0.3 });
    switch (id) {
      case 'nasal': {
        const r = mouth.z - 0.012 * hs;
        const t = new Mesh(k.track(new TorusGeometry(r, 0.0035, 5, 22, Math.PI)), tubeMat);
        t.rotation.x = Math.PI / 2;
        t.scale.set(0.82, 1, 1);
        t.position.set(0, mouth.y + 0.026 * hs, 0);
        g.add(t);
        for (const sx of [-1, 1]) k.cyl(g, 0.003, 0.003, 0.012 * hs, tubeMat, sx * 0.007 * hs, mouth.y + 0.032 * hs, mouth.z - 0.008 * hs, 5);
        c.headBall.add(g);
        break;
      }
      case 'sungkup':
      case 'nrm':
      case 'niv': {
        const niv = id === 'niv';
        const mask = new Mesh(k.track(new SphereGeometry(1, 16, 10)), niv ? k.mat('#cfe3ea', { transparent: true, opacity: 0.6, roughness: 0.2 }) : clear);
        mask.scale.set(0.05 * hs, (niv ? 0.075 : 0.064) * hs, 0.042 * hs);
        mask.position.set(0, mouth.y + 0.022 * hs, mouth.z - 0.03 * hs);
        g.add(mask);
        // Tali elastis melingkari kepala.
        const strap = new Mesh(k.track(new TorusGeometry(c.dims.headR * 1.02, 0.003, 4, 24)), k.mat(niv ? '#3d4b57' : '#2d7a55'));
        strap.rotation.x = Math.PI / 2 + 0.25;
        strap.position.set(0, mouth.y + 0.04 * hs, -0.005);
        g.add(strap);
        if (id === 'nrm') {
          const bag = new Mesh(k.track(new SphereGeometry(1, 12, 8)), k.mat('#cde9dc', { transparent: true, opacity: 0.55, roughness: 0.2 }));
          bag.scale.set(0.045 * hs, 0.065 * hs, 0.035 * hs);
          bag.position.set(0, mouth.y - 0.085 * hs, mouth.z + 0.02 * hs);
          g.add(bag);
        }
        if (niv) {
          k.box(g, 0.012 * hs, 0.07 * hs, 0.012 * hs, k.mat('#3d4b57'), 0, mouth.y + 0.1 * hs, mouth.z + 0.005 * hs, false);
          k.cyl(g, 0.012 * hs, 0.012 * hs, 0.12 * hs, k.mat('#8fb6c8', { roughness: 0.4 }), 0, mouth.y + 0.02 * hs, mouth.z + 0.06 * hs, 10).rotation.x = Math.PI / 2;
        }
        c.headBall.add(g);
        break;
      }
      case 'ett': {
        const tube = k.cyl(g, 0.0055 * hs, 0.0055 * hs, 0.11 * hs, k.mat('#f2f5f4', { roughness: 0.3 }), 0, mouth.y + 0.004 * hs, mouth.z + 0.045 * hs, 8);
        tube.rotation.x = Math.PI / 2;
        k.cyl(g, 0.009 * hs, 0.009 * hs, 0.022 * hs, k.mat('#3b7dd8'), 0, mouth.y + 0.004 * hs, mouth.z + 0.105 * hs, 8).rotation.x = Math.PI / 2;
        k.box(g, 0.11 * hs, 0.01 * hs, 0.004, k.mat('#f7f2e7'), 0, mouth.y + 0.002 * hs, mouth.z - 0.006 * hs, false);
        c.headBall.add(g);
        break;
      }
      case 'opa': {
        k.box(g, 0.026 * hs, 0.012 * hs, 0.01 * hs, k.mat('#58b368'), 0, mouth.y, mouth.z + 0.003 * hs, false);
        c.headBall.add(g);
        break;
      }
      case 'bvm': {
        const mask = new Mesh(k.track(new SphereGeometry(1, 14, 8)), clear);
        mask.scale.set(0.052 * hs, 0.066 * hs, 0.04 * hs);
        mask.position.set(0, mouth.y + 0.02 * hs, mouth.z - 0.025 * hs);
        g.add(mask);
        const bag = new Mesh(k.track(new SphereGeometry(1, 14, 10)), k.mat('#8fc3e8', { transparent: true, opacity: 0.75, roughness: 0.3 }));
        bag.scale.set(0.055 * hs, 0.055 * hs, 0.11 * hs);
        bag.position.set(0, mouth.y + 0.06 * hs, mouth.z + 0.14 * hs);
        bag.rotation.x = -0.6;
        g.add(bag);
        k.cyl(g, 0.012 * hs, 0.012 * hs, 0.05 * hs, k.mat('#2f3b46'), 0, mouth.y + 0.03 * hs, mouth.z + 0.04 * hs, 8).rotation.x = Math.PI / 2 - 0.5;
        c.headBall.add(g);
        break;
      }
      case 'collar': {
        const r = 0.062 * s;
        const col = new Mesh(k.track(new CylinderGeometry(r * 1.05, r * 1.25, 0.075 * s, 16, 1, true)), k.mat('#e9a03b', { roughness: 0.8 }));
        col.material.side = DoubleSide;
        col.position.set(0, 0.02 * s, 0.005 * s);
        g.add(col);
        k.box(g, 0.05 * s, 0.05 * s, 0.01, k.mat('#f4f4f2'), 0, 0.02 * s, r * 1.2, false);
        c.neck.add(g);
        break;
      }
      case 'pads': {
        const white = k.mat('#f4f4f2', { roughness: 0.6 });
        const front = c.body.surface(0.34).front;
        const p1 = k.box(g, 0.095 * s, 0.12 * s, 0.006, white, -0.075 * s, (0.34 - 0.25) * s, front + 0.002, false);
        p1.rotation.z = 0.15;
        const side = c.body.surface(0.27);
        const p2 = k.box(g, 0.095 * s, 0.13 * s, 0.006, white, side.half * 0.82, (0.25 - 0.25) * s, side.front * 0.35, false);
        p2.rotation.y = 1.0;
        c.chest.add(g);
        break;
      }
      case 'ecg': {
        const white = k.mat('#f4f4f2');
        const front = c.body.surface(0.33).front;
        for (const [x, y] of [
          [-0.08, 0.36],
          [0.08, 0.36],
          [0.07, 0.2],
        ] as const) {
          const e = k.cyl(g, 0.011 * s, 0.011 * s, 0.004, white, x * s, (y - 0.25) * s, front + 0.002, 10);
          e.rotation.x = Math.PI / 2;
        }
        c.chest.add(g);
        // Klip SpO₂ di jari tangan kiri.
        const clip = new Group();
        k.box(clip, 0.022 * s, 0.03 * s, 0.022 * s, k.mat('#3c4650'), 0, -d.palm * 1.9, 0, false);
        c.armL.end.add(clip);
        this.items.set('ecg-clip', clip);
        break;
      }
      case 'iv': {
        k.box(g, 0.028 * s, 0.04 * s, 0.01 * s, k.mat('#f3f1ea'), 0, -d.foreArm * 0.78, 0.028 * s, false);
        k.cyl(g, 0.006 * s, 0.006 * s, 0.02 * s, k.mat('#2e8b57'), 0, -d.foreArm * 0.76, 0.04 * s, 6);
        c.armR.lower.add(g);
        break;
      }
      case 'tourniquet': {
        const t = new Mesh(k.track(new TorusGeometry(0.075 * s, 0.012 * s, 6, 18)), k.mat('#1d1f22'));
        t.rotation.x = Math.PI / 2;
        t.position.set(0, -d.thigh * 0.3, 0);
        g.add(t);
        c.legR.upper.add(g);
        break;
      }
      case 'splint': {
        k.box(g, 0.05 * s, d.shin * 0.85, 0.02 * s, k.mat('#f0c24a'), 0, -d.shin * 0.5, 0.06 * s);
        c.legR.lower.add(g);
        break;
      }
      case 'binder': {
        const r = c.body.surface(0).half;
        const b = new Mesh(k.track(new CylinderGeometry(r * 1.06, r * 1.06, 0.12 * s, 18, 1, true)), k.mat('#2f3b52', { roughness: 0.8 }));
        b.material.side = DoubleSide;
        b.scale.set(1, 1, 0.78);
        b.position.set(0, -0.02 * s, 0);
        g.add(b);
        c.hips.add(g);
        break;
      }
    }
    this.items.set(id, g);
    return g;
  }

  update(st: GearState): void {
    const want = new Set<string>();
    if (st.bvm) want.add('bvm');
    else if (st.adjunct === 'ett') want.add('ett');
    else {
      if (st.oxygen !== 'udara') want.add(st.oxygen);
      if (st.adjunct === 'opa') want.add('opa');
    }
    if (st.collar) want.add('collar');
    if (st.pads) want.add('pads');
    if (st.monitor) want.add('ecg');
    if (st.iv) want.add('iv');
    if (st.tourniquet) want.add('tourniquet');
    if (st.splint) want.add('splint');
    if (st.binder) want.add('binder');
    const key = [...want].sort().join(',');
    if (key === this.key) return;
    this.key = key;
    for (const id of want) this.build(id).visible = true;
    for (const [id, o] of this.items) {
      const base = id === 'ecg-clip' ? 'ecg' : id;
      o.visible = want.has(base);
    }
  }

  /** Titik dunia ujung alat jalan napas/sungkup (untuk selang oksigen/ventilator). */
  airwayPoint(out: Vector3): Vector3 {
    const c = this.actor.character;
    const hs = c.headShape.spec.hs;
    const m = c.headSite('mulut', 0, out);
    m.z += 0.11 * hs;
    return c.headBall.localToWorld(m);
  }

  dispose(): void {
    for (const o of this.items.values()) o.removeFromParent();
    this.items.clear();
    this.kit.dispose();
  }
}
