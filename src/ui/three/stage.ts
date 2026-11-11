/**
 * Panggung 3D: renderer WebGL, kamera first-person (dokter duduk di belakang meja),
 * ruang praktik, dan loop animasi. UI HTML (monitor, subtitle) berada DI ATAS kanvas;
 * panggung diberi tahu "area bebas" (yang tidak tertutup panel) agar pasien selalu
 * berada di tengah area yang terlihat.
 */
import { ACESFilmicToneMapping, Color, PCFSoftShadowMap, PerspectiveCamera, Scene, SRGBColorSpace, Vector3, WebGLRenderer } from 'three';
import { buildRoom, LAYOUT, type Room } from './room';

export interface FreeRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface StageUpdatable {
  update(dt: number, time: number): void;
}

const DEG = Math.PI / 180;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export class Stage {
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera(40, 1, 0.08, 40);
  readonly room: Room;
  readonly canvas: HTMLCanvasElement;
  private readonly renderer: WebGLRenderer;
  private readonly updatables = new Set<StageUpdatable>();
  private free: FreeRect = { left: 0, top: 0, right: 1, bottom: 1 };
  private width = 1;
  private height = 1;
  private raf = 0;
  private last = 0;
  private time = 0;
  private running = false;
  /** Render setiap n frame (n > 1 saat layar tertutup overlay) untuk menghemat daya. */
  private throttle = 1;
  private frame = 0;
  /** Titik yang dipandang dokter (mis. kepala pasien); null = pandangan default ke kursi. */
  private focusProvider: (() => Vector3 | null) | null = null;
  private readonly focus = new Vector3(0, 0.95, LAYOUT.seat.z);
  private readonly focusTarget = new Vector3();
  /** Geseran pandangan oleh pemain (seret untuk melihat sekeliling). */
  private lookYaw = 0;
  private lookPitch = 0;
  private dragging = false;
  private lastPointer = { x: 0, y: 0 };
  private idleSince = 0;
  /** Mode judul: kamera menyapu ruangan perlahan. */
  private titleMode = false;
  // Pengukuran kinerja untuk menurunkan kualitas secara adaptif.
  private pixelRatio: number;
  private slowFrames = 0;
  private fastFrames = 0;
  private shadows: boolean;
  private readonly tmp = new Vector3();

  /** Buat panggung; mengembalikan null bila WebGL tidak tersedia (UI tetap bisa dipakai tanpa 3D). */
  static create(container: HTMLElement): Stage | null {
    try {
      const probe = document.createElement('canvas');
      if (!probe.getContext('webgl2') && !probe.getContext('webgl')) return null;
      return new Stage(container);
    } catch {
      return null;
    }
  }

  private constructor(private readonly container: HTMLElement) {
    const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, coarse ? 1.6 : 2);
    this.shadows = true;
    this.renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.setPixelRatio(this.pixelRatio);
    this.canvas = this.renderer.domElement;
    this.canvas.className = 'stage__canvas';
    this.canvas.setAttribute('role', 'img');
    this.canvas.setAttribute('aria-label', 'Ruang praktik dokter');
    container.prepend(this.canvas);

    this.scene.background = new Color('#dfe6ea');
    this.room = buildRoom({ shadows: this.shadows });
    this.scene.add(this.room.group);
    this.camera.position.copy(LAYOUT.eye);

    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
    window.addEventListener('resize', this.resize);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.canvas.addEventListener('webglcontextlost', (e) => e.preventDefault());
    this.resize();
  }

  // --- API ------------------------------------------------------------

  add(u: StageUpdatable): void {
    this.updatables.add(u);
  }

  remove(u: StageUpdatable): void {
    this.updatables.delete(u);
  }

  setFocusProvider(fn: (() => Vector3 | null) | null): void {
    this.focusProvider = fn;
  }

  setTitleMode(on: boolean): void {
    this.titleMode = on;
  }

  /** Area layar (px, relatif viewport) yang tidak tertutup panel UI. */
  setFreeRect(rect: FreeRect): void {
    const f = this.free;
    if (Math.abs(f.left - rect.left) < 1 && Math.abs(f.top - rect.top) < 1 && Math.abs(f.right - rect.right) < 1 && Math.abs(f.bottom - rect.bottom) < 1) return;
    this.free = { ...rect };
    this.applyProjection();
  }

  setThrottle(n: number): void {
    this.throttle = Math.max(1, Math.round(n));
  }

  setCanvasLabel(text: string): void {
    this.canvas.setAttribute('aria-label', text);
  }

  /** Proyeksikan titik dunia ke koordinat layar (px). */
  project(world: Vector3): { x: number; y: number; visible: boolean } {
    const v = this.tmp.copy(world).project(this.camera);
    return { x: (v.x * 0.5 + 0.5) * this.width, y: (-v.y * 0.5 + 0.5) * this.height, visible: v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1 };
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  dispose(): void {
    this.stop();
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    window.removeEventListener('resize', this.resize);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.room.dispose();
    this.renderer.dispose();
    this.canvas.remove();
  }

  /** Info ringan untuk pemantauan kinerja (dipakai tes). */
  stats(): { geometries: number; textures: number; calls: number; triangles: number; pixelRatio: number } {
    const i = this.renderer.info;
    return { geometries: i.memory.geometries, textures: i.memory.textures, calls: i.render.calls, triangles: i.render.triangles, pixelRatio: this.pixelRatio };
  }

  // --- Loop ------------------------------------------------------------

  private readonly tick = (now: number): void => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.tick);
    const rawDt = (now - this.last) / 1000;
    this.last = now;
    const dt = Math.min(0.1, Math.max(0, rawDt));
    this.time += dt;
    this.frame++;
    this.room.update(dt, this.time);
    for (const u of this.updatables) u.update(dt, this.time);
    this.updateCamera(dt);
    if (this.frame % this.throttle !== 0) return;
    this.renderer.render(this.scene, this.camera);
    this.adapt(rawDt);
  };

  /** Turunkan resolusi/bayangan bila perangkat kewalahan; naikkan lagi bila longgar. */
  private adapt(rawDt: number): void {
    if (this.throttle > 1 || rawDt <= 0) return;
    if (rawDt > 1 / 28) this.slowFrames++;
    else if (rawDt < 1 / 50) this.fastFrames++;
    if (this.slowFrames > 45) {
      this.slowFrames = 0;
      this.fastFrames = 0;
      const floor = Math.min(1, window.devicePixelRatio || 1);
      if (this.pixelRatio > floor) {
        this.pixelRatio = Math.max(floor, this.pixelRatio - 0.35);
        this.renderer.setPixelRatio(this.pixelRatio);
        this.renderer.setSize(this.width, this.height, false);
      } else if (this.shadows) {
        this.shadows = false;
        this.room.setShadows(false);
      } else if (this.pixelRatio > 0.7) {
        this.pixelRatio = 0.7;
        this.renderer.setPixelRatio(this.pixelRatio);
        this.renderer.setSize(this.width, this.height, false);
      }
    }
    if (this.fastFrames > 600) {
      this.fastFrames = 0;
      this.slowFrames = Math.max(0, this.slowFrames - 20);
    }
  }

  private updateCamera(dt: number): void {
    const target = this.focusProvider?.() ?? null;
    if (target) this.focusTarget.copy(target);
    else this.focusTarget.set(0, 0.95, LAYOUT.seat.z);
    // Pandangan dokter mengikuti pasien dengan halus (tidak tersentak).
    this.focus.lerp(this.focusTarget, 1 - Math.exp(-3.2 * dt));

    // Pandangan kembali ke pasien bila pemain berhenti menyeret.
    if (!this.dragging && this.time - this.idleSince > 1.6) {
      const k = 1 - Math.exp(-2.2 * dt);
      this.lookYaw += (0 - this.lookYaw) * k;
      this.lookPitch += (0 - this.lookPitch) * k;
    }

    const eye = this.camera.position;
    // Gerak napas & goyangan halus kepala dokter.
    eye.set(LAYOUT.eye.x + Math.sin(this.time * 0.31) * 0.004, LAYOUT.eye.y + Math.sin(this.time * 1.1) * 0.0035, LAYOUT.eye.z);
    const dx = this.focus.x - eye.x;
    const dy = this.focus.y - eye.y;
    const dz = this.focus.z - eye.z;
    let yaw = Math.atan2(-dx, -dz);
    let pitch = Math.atan2(dy, Math.hypot(dx, dz));
    // Dokter tidak memutar kepala penuh: ikuti sebagian, sisanya lewat sudut pandang.
    yaw *= 0.72;
    if (this.titleMode) yaw += Math.sin(this.time * 0.17) * 0.3;
    yaw += this.lookYaw;
    pitch = clamp(pitch + this.lookPitch - 4.5 * DEG, -0.9, 0.6);
    this.camera.rotation.set(pitch, yaw, 0, 'YXZ');
  }

  // --- Ukuran & proyeksi ------------------------------------------------------------

  private readonly resize = (): void => {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    if (w === this.width && h === this.height) return;
    this.width = w;
    this.height = h;
    this.renderer.setSize(w, h, false);
    this.applyProjection();
  };

  /** Atur FOV & geseran titik pusat agar pasien berada di tengah area bebas. */
  private applyProjection(): void {
    const W = this.width;
    const H = this.height;
    const left = clamp(this.free.left, 0, W);
    const right = clamp(this.free.right, left + 40, Math.max(left + 40, W));
    const top = clamp(this.free.top, 0, H);
    const bottom = clamp(this.free.bottom, top + 40, Math.max(top + 40, H));
    const fw = right - left;
    const fh = bottom - top;
    // FOV vertikal untuk AREA BEBAS: area kecil (ponsel) dibingkai lebih rapat agar wajah &
    // bahasa tubuh pasien tetap terbaca; area sempit-tinggi dilebarkan agar pasien tidak terpotong.
    const base = clamp(31 + (fh - 260) * 0.03, 33, 41) * DEG;
    const vFree = clamp(Math.max(base, 2 * Math.atan(Math.tan(19 * DEG) / (fw / fh))), 28 * DEG, 78 * DEG);
    const vFull = 2 * Math.atan(Math.tan(vFree / 2) * (H / fh));
    this.camera.fov = clamp(vFull / DEG, 20, 140);
    this.camera.aspect = W / H;
    const cx = (left + right) / 2;
    const cy = (top + bottom) / 2;
    this.camera.setViewOffset(W, H, W / 2 - cx, H / 2 - cy, W, H);
    this.camera.updateProjectionMatrix();
  }

  // --- Seret untuk melihat sekeliling ------------------------------------------------

  private readonly onPointerDown = (e: PointerEvent): void => {
    this.dragging = true;
    this.lastPointer = { x: e.clientX, y: e.clientY };
    this.canvas.classList.add('is-dragging');
  };

  private readonly onPointerMove = (e: PointerEvent): void => {
    if (!this.dragging) return;
    const dx = e.clientX - this.lastPointer.x;
    const dy = e.clientY - this.lastPointer.y;
    this.lastPointer = { x: e.clientX, y: e.clientY };
    const k = (this.camera.fov * DEG) / this.height;
    this.lookYaw = clamp(this.lookYaw + dx * k * 0.9, -1.25, 1.25);
    this.lookPitch = clamp(this.lookPitch + dy * k * 0.9, -0.55, 0.5);
    this.idleSince = this.time;
  };

  private readonly onPointerUp = (): void => {
    if (!this.dragging) return;
    this.dragging = false;
    this.idleSince = this.time;
    this.canvas.classList.remove('is-dragging');
  };

  private readonly onVisibility = (): void => {
    if (document.hidden) this.stop();
    else this.start();
  };
}
