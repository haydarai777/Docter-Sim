/**
 * Efek darah di ruang IGD:
 * - Tetesan berfisika (gravitasi, hambatan udara) yang dipancarkan luka: pancaran arteri
 *   berdenyut sesuai nadi & tekanan sistolik, tetesan vena/kapiler sesuai laju (ml/menit).
 *   Tetesan meninggalkan percikan ketika mengenai sprei, brankar, perlak, atau lantai.
 * - Genangan/noda yang tumbuh menurut VOLUME darah sebenarnya (ml dari fisiologi): kain menyerap
 *   (noda melebar dengan tepi lebih terang karena efek sumbu), lantai menggenang mengilap.
 * Semua noda digambar di kanvas per permukaan sehingga murah dirender.
 */
import {
  CanvasTexture,
  Color,
  DynamicDrawUsage,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type Object3D,
  PlaneGeometry,
  Quaternion,
  type Scene,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
} from 'three';

export type StainKind = 'kain' | 'lantai' | 'perlak';

interface Pool {
  owner: string;
  x: number;
  z: number;
  r: number;
  seed: number;
  clots: number;
}
interface Splat {
  owner: string;
  x: number;
  z: number;
  r: number;
  dx: number;
  dz: number;
}

/** Permukaan datar (dalam ruang lokal induk: bidang XZ pada ketinggian y) yang menampung noda darah. */
export class StainSurface {
  readonly mesh: Mesh;
  private readonly canvas: HTMLCanvasElement;
  private readonly g: CanvasRenderingContext2D;
  private readonly texture: CanvasTexture;
  private readonly pools = new Map<string, Pool>();
  private splats: Splat[] = [];
  private dirty = false;
  private full = false;
  private readonly tmp = new Vector3();

  constructor(
    readonly id: string,
    readonly parent: Object3D,
    readonly center: Vector3,
    readonly width: number,
    readonly depth: number,
    readonly kind: StainKind,
  ) {
    const res = kind === 'lantai' ? 512 : 384;
    this.canvas = document.createElement('canvas');
    this.canvas.width = Math.max(64, Math.round(res * Math.min(1, width / Math.max(width, depth))));
    this.canvas.height = Math.max(64, Math.round(res * Math.min(1, depth / Math.max(width, depth))));
    this.g = this.canvas.getContext('2d')!;
    this.texture = new CanvasTexture(this.canvas);
    this.texture.colorSpace = SRGBColorSpace;
    this.texture.anisotropy = 4;
    const mat =
      kind === 'lantai'
        ? new MeshPhysicalMaterial({ map: this.texture, transparent: true, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
        : new MeshStandardMaterial({ map: this.texture, transparent: true, roughness: kind === 'perlak' ? 0.25 : 0.62, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    this.mesh = new Mesh(new PlaneGeometry(width, depth), mat);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.copy(center).add(new Vector3(0, 0.0025, 0));
    this.mesh.renderOrder = 3;
    this.mesh.receiveShadow = true;
    this.mesh.visible = false;
    parent.add(this.mesh);
  }

  /** Titik dunia → koordinat lokal permukaan (x, z) bila di dalam batas & dekat bidang. */
  hit(world: Vector3, prevWorld: Vector3 | null): { x: number; z: number } | null {
    const p = this.parent.worldToLocal(this.tmp.copy(world));
    const x = p.x - this.center.x;
    const z = p.z - this.center.z;
    if (Math.abs(x) > this.width / 2 || Math.abs(z) > this.depth / 2) return null;
    if (p.y > this.center.y + 0.004) return null;
    if (prevWorld) {
      const q = this.parent.worldToLocal(this.tmp.copy(prevWorld));
      if (q.y < this.center.y - 0.06) return null; // datang dari bawah bidang
    }
    return { x, z };
  }

  /** Lokal (x, z relatif pusat) dari titik dunia, tanpa memeriksa batas. */
  toLocal(world: Vector3): { x: number; z: number } {
    const p = this.parent.worldToLocal(this.tmp.copy(world));
    return { x: Math.max(-this.width / 2, Math.min(this.width / 2, p.x - this.center.x)), z: Math.max(-this.depth / 2, Math.min(this.depth / 2, p.z - this.center.z)) };
  }

  splat(owner: string, x: number, z: number, r: number, dx = 0, dz = 0): void {
    if (this.splats.length > 500) this.splats.splice(0, 100);
    const s = { owner, x, z, r, dx, dz };
    this.splats.push(s);
    this.drawSplat(s);
    this.dirty = true;
  }

  /** Genangan milik `owner` di (x, z) dengan jari-jari r (m) — hanya bisa membesar. */
  pool(owner: string, key: string, x: number, z: number, r: number, clots = 0): void {
    const id = `${owner}:${key}`;
    const cur = this.pools.get(id);
    if (cur && r <= cur.r + 0.002 && clots <= cur.clots) return;
    const p: Pool = cur ?? { owner, x, z, r, seed: Math.floor(Math.random() * 1e6), clots };
    p.r = Math.max(p.r, r);
    p.clots = Math.max(p.clots, clots);
    this.pools.set(id, p);
    this.drawPool(p);
    this.dirty = true;
  }

  poolRadius(owner: string, key: string): number {
    return this.pools.get(`${owner}:${key}`)?.r ?? 0;
  }

  removeOwner(owner: string): void {
    let changed = false;
    for (const [k, p] of this.pools) if (p.owner === owner) (this.pools.delete(k), (changed = true));
    const before = this.splats.length;
    this.splats = this.splats.filter((s) => s.owner !== owner);
    if (changed || before !== this.splats.length) this.full = true;
  }

  clear(): void {
    if (!this.pools.size && !this.splats.length) return;
    this.pools.clear();
    this.splats = [];
    this.full = true;
  }

  /** Unggah tekstur bila ada perubahan (dipanggil berkala). */
  flush(): void {
    if (this.full) {
      this.full = false;
      this.g.clearRect(0, 0, this.canvas.width, this.canvas.height);
      for (const p of this.pools.values()) this.drawPool(p);
      for (const s of this.splats) this.drawSplat(s);
      this.dirty = true;
    }
    if (!this.dirty) return;
    this.dirty = false;
    this.texture.needsUpdate = true;
    this.mesh.visible = this.pools.size > 0 || this.splats.length > 0;
  }

  private px(x: number, z: number): [number, number] {
    return [(x / this.width + 0.5) * this.canvas.width, (z / this.depth + 0.5) * this.canvas.height];
  }

  private drawPool(p: Pool): void {
    const g = this.g;
    const [cx, cy] = this.px(p.x, p.z);
    const sx = this.canvas.width / this.width;
    const R = p.r * sx;
    let s = p.seed;
    const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
    const blob = (rad: number, color: string) => {
      g.fillStyle = color;
      g.beginPath();
      const n = 22;
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2;
        const k = 0.78 + 0.22 * Math.sin(a * 3 + p.seed) + 0.12 * Math.sin(a * 7 + p.seed * 0.3);
        const x = cx + Math.cos(a) * rad * k;
        const y = cy + Math.sin(a) * rad * k * (this.kind === 'kain' ? 1.15 : 1);
        if (i === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.closePath();
      g.fill();
    };
    if (this.kind === 'kain') {
      // Kain: tepi lebih terang & lebar (darah menyebar lewat serat), pusat pekat.
      blob(R * 1.12, 'rgba(160,48,46,0.55)');
      blob(R, 'rgba(112,14,18,0.85)');
      blob(R * 0.7, 'rgba(80,6,10,0.92)');
    } else if (this.kind === 'perlak') {
      blob(R * 1.05, 'rgba(120,12,16,0.8)');
      blob(R * 0.85, 'rgba(92,6,10,0.95)');
    } else {
      blob(R, 'rgba(78,5,9,0.96)');
      g.strokeStyle = 'rgba(40,2,4,0.8)';
      g.lineWidth = Math.max(1, R * 0.04);
      g.stroke();
    }
    // Bekuan darah (gumpalan gelap) pada perdarahan banyak.
    for (let i = 0; i < p.clots; i++) {
      const a = rnd() * Math.PI * 2;
      const d = rnd() * R * 0.55;
      const r = (0.012 + rnd() * 0.022) * sx;
      g.fillStyle = 'rgba(46,2,6,0.95)';
      g.beginPath();
      g.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r, r * (0.6 + rnd() * 0.5), a, 0, Math.PI * 2);
      g.fill();
    }
  }

  private drawSplat(sp: Splat): void {
    const g = this.g;
    const [cx, cy] = this.px(sp.x, sp.z);
    const sx = this.canvas.width / this.width;
    const R = Math.max(1, sp.r * sx);
    g.fillStyle = this.kind === 'kain' ? 'rgba(110,16,20,0.8)' : 'rgba(90,6,10,0.92)';
    g.beginPath();
    g.arc(cx, cy, R, 0, Math.PI * 2);
    g.fill();
    // Percikan satelit searah gerak tetesan.
    const n = 3;
    for (let i = 1; i <= n; i++) {
      const k = i / n;
      g.beginPath();
      g.arc(cx + sp.dx * sx * 0.02 * i + (Math.random() - 0.5) * R, cy + sp.dz * sx * 0.02 * i + (Math.random() - 0.5) * R, R * (0.45 - 0.1 * k), 0, Math.PI * 2);
      g.fill();
    }
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    (this.mesh.material as MeshStandardMaterial).dispose();
    this.texture.dispose();
  }
}

interface Drop {
  alive: boolean;
  p: Vector3;
  prev: Vector3;
  v: Vector3;
  size: number;
  life: number;
  owner: string;
}

/** Emiter darah yang diperbarui setiap frame oleh adegan. */
export interface BleedEmitter {
  owner: string;
  /** Kunci fase denyut (per luka). */
  key: string;
  type: 'arteri' | 'vena' | 'kapiler';
  /** Laju (ml/menit). */
  rate: number;
  hr: number;
  sbp: number;
  /** Posisi & normal dunia luka. */
  point: Vector3;
  normal: Vector3;
  /** Tertutup balutan: tidak memancar, hanya menetes dari tepi balutan. */
  covered: boolean;
}

const MAX = 700;

export class BloodFx {
  private readonly drops: Drop[] = [];
  private readonly inst: InstancedMesh;
  private readonly surfaces = new Set<StainSurface>();
  private readonly floorTiles = new Map<string, StainSurface>();
  private readonly phase = new Map<string, { beat: number; acc: number; stream: number }>();
  private readonly m = new Matrix4();
  private readonly q = new Quaternion();
  private readonly s = new Vector3();
  private readonly up = new Vector3(0, 1, 0);
  private readonly tmp = new Vector3();
  private flushT = 0;

  constructor(private readonly scene: Scene) {
    const mat = new MeshPhysicalMaterial({ color: new Color('#6a050b'), roughness: 0.12, clearcoat: 0.9, clearcoatRoughness: 0.05 });
    this.inst = new InstancedMesh(new SphereGeometry(1, 8, 6), mat, MAX);
    this.inst.instanceMatrix.setUsage(DynamicDrawUsage);
    this.inst.count = 0;
    this.inst.frustumCulled = false;
    this.inst.castShadow = false;
    scene.add(this.inst);
    for (let i = 0; i < MAX; i++) this.drops.push({ alive: false, p: new Vector3(), prev: new Vector3(), v: new Vector3(), size: 0.003, life: 0, owner: '' });
  }

  addSurface(s: StainSurface): void {
    this.surfaces.add(s);
  }

  removeSurface(s: StainSurface): void {
    this.surfaces.delete(s);
  }

  /** Ubin lantai (dibuat sesuai kebutuhan). */
  floorAt(x: number, z: number): StainSurface {
    const T = 2.2;
    const ix = Math.floor(x / T);
    const iz = Math.floor(z / T);
    const key = `${ix},${iz}`;
    let t = this.floorTiles.get(key);
    if (!t) {
      t = new StainSurface(`lantai:${key}`, this.scene, new Vector3((ix + 0.5) * T, 0.0005, (iz + 0.5) * T), T, T, 'lantai');
      this.floorTiles.set(key, t);
    }
    return t;
  }

  private spawn(owner: string, p: Vector3, v: Vector3, size: number): void {
    const d = this.drops.find((x) => !x.alive);
    if (!d) return;
    d.alive = true;
    d.p.copy(p);
    d.prev.copy(p);
    d.v.copy(v);
    d.size = size;
    d.life = 4;
    d.owner = owner;
  }

  /** Pancarkan darah dari emiter selama dt (detik nyata). */
  emit(e: BleedEmitter, dt: number): void {
    if (e.rate < 0.02) return;
    let ph = this.phase.get(e.key);
    if (!ph) this.phase.set(e.key, (ph = { beat: Math.random(), acc: 0, stream: 0 }));
    const n = this.tmp.copy(e.normal).normalize();
    if (e.type === 'arteri' && !e.covered && e.sbp > 45 && e.hr > 20) {
      // Denyut: tiap sistol menyemburkan darah merah terang membentuk busur.
      ph.beat += (dt * e.hr) / 60;
      const v0 = Math.min(2.6, 0.45 + 1.7 * Math.sqrt(Math.max(0, e.sbp - 30) / 90)) * Math.min(1, 0.4 + e.rate / 40);
      if (ph.beat >= 1) {
        ph.beat -= 1;
        ph.stream = 0.16;
      }
      if (ph.stream > 0) {
        ph.stream -= dt;
        const per = Math.max(1, Math.round((dt / 0.006) * Math.min(1.4, 0.6 + e.rate / 50)));
        for (let i = 0; i < per; i++) {
          const dir = new Vector3(n.x + (Math.random() - 0.5) * 0.25, n.y + 0.35 + (Math.random() - 0.5) * 0.2, n.z + (Math.random() - 0.5) * 0.25).normalize();
          const speed = v0 * (0.75 + Math.random() * 0.35) * (0.6 + ph.stream * 2.5);
          this.spawn(e.owner, e.point, dir.multiplyScalar(speed), 0.0012 + Math.random() * 0.0016);
        }
      }
      return;
    }
    // Vena/kapiler (atau tertutup balutan): tetesan dari luka/tepi balutan.
    const perSec = Math.min(7, (e.rate / 60) / 0.05) * (e.covered ? 0.35 : 1);
    ph.acc += perSec * dt;
    while (ph.acc >= 1) {
      ph.acc -= 1;
      const start = this.tmp.copy(e.point).addScaledVector(e.normal, 0.004);
      start.y -= 0.01;
      this.spawn(e.owner, start, new Vector3((Math.random() - 0.5) * 0.05, -0.05, (Math.random() - 0.5) * 0.05), 0.002 + Math.random() * 0.0015);
    }
  }

  update(dt: number): void {
    let count = 0;
    const g = 9.81;
    for (const d of this.drops) {
      if (!d.alive) continue;
      d.prev.copy(d.p);
      d.v.y -= g * dt;
      d.v.multiplyScalar(1 - 0.35 * dt);
      d.p.addScaledVector(d.v, dt);
      d.life -= dt;
      let landed: StainSurface | null = null;
      let at: { x: number; z: number } | null = null;
      for (const s of this.surfaces) {
        const h = s.hit(d.p, d.prev);
        if (h) {
          landed = s;
          at = h;
          break;
        }
      }
      if (!landed && d.p.y <= 0.001) {
        landed = this.floorAt(d.p.x, d.p.z);
        at = landed.toLocal(d.p);
      }
      if (landed && at) {
        landed.splat(d.owner, at.x, at.z, d.size * (1.6 + Math.min(2, d.v.length() * 0.8)), d.v.x, d.v.z);
        d.alive = false;
        continue;
      }
      if (d.life <= 0) {
        d.alive = false;
        continue;
      }
      // Tetesan memanjang searah gerak (seperti jejak semburan).
      const speed = d.v.length();
      this.q.setFromUnitVectors(this.up, speed > 1e-4 ? this.s.copy(d.v).divideScalar(speed) : this.up);
      this.s.set(d.size, d.size * (1 + Math.min(7, speed * 3.2)), d.size);
      this.m.compose(d.p, this.q, this.s);
      this.inst.setMatrixAt(count++, this.m);
    }
    this.inst.count = count;
    this.inst.instanceMatrix.needsUpdate = true;
    this.flushT -= dt;
    if (this.flushT <= 0) {
      this.flushT = 0.12;
      for (const s of this.surfaces) s.flush();
      for (const t of this.floorTiles.values()) t.flush();
    }
  }

  /** Hapus semua noda milik pemilik tertentu di lantai (lantai dibersihkan). */
  cleanFloor(owner: string): void {
    for (const t of this.floorTiles.values()) t.removeOwner(owner);
  }

  clearAll(): void {
    for (const d of this.drops) d.alive = false;
    this.inst.count = 0;
    for (const t of this.floorTiles.values()) t.dispose();
    this.floorTiles.clear();
    for (const s of this.surfaces) s.clear();
  }

  dispose(): void {
    this.clearAll();
    this.inst.removeFromParent();
    this.inst.geometry.dispose();
    (this.inst.material as MeshPhysicalMaterial).dispose();
  }
}
