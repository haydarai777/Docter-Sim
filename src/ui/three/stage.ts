/**
 * Panggung 3D: renderer WebGL, kamera first-person (dokter duduk di belakang meja),
 * ruang praktik, dan loop animasi. UI HTML (monitor, subtitle) berada DI ATAS kanvas;
 * panggung diberi tahu "area bebas" (yang tidak tertutup panel) agar pasien selalu
 * berada di tengah area yang terlihat.
 */
import { ACESFilmicToneMapping, Color, HalfFloatType, PCFSoftShadowMap, PerspectiveCamera, PMREMGenerator, Scene, SRGBColorSpace, type Texture, Vector3, WebGLRenderer, WebGLRenderTarget } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
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

/** Kamera bebas (mode IGD): posisi mata & titik pandang yang dituju, pengali sudut pandang. */
export interface CameraRig {
  eye: Vector3;
  focus: Vector3;
  /** Pengali FOV vertikal area bebas (1 = bawaan). */
  fov: number;
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
  /** Ruang pengganti (mis. IGD) — ruang praktik disembunyikan selama aktif. */
  private alt: Room | null = null;
  private rig: CameraRig | null = null;
  private readonly rigEye = new Vector3();
  private fovMul = 1;
  private fovGoal = 1;
  private tapHandler: ((x: number, y: number) => void) | null = null;
  private dragDist = 0;
  private downAt = 0;
  /** Peta lingkungan per ruang (dibuat sekali, saat ruang pertama kali tampil). */
  private readonly envs = new Map<Room, WebGLRenderTarget>();
  private pmrem: PMREMGenerator | null = null;
  /**
   * Oklusi ambien layar (GTAO): bayangan lembut di lekuk & titik kontak (ketiak, bawah dagu,
   * antara tubuh dan kasur, lipatan otot) sehingga bentuk tubuh terbaca nyata. Hanya di perangkat
   * yang mampu; dimatikan otomatis bila frame melambat.
   */
  private composer: EffectComposer | null = null;
  private aoPass: GTAOPass | null = null;
  private ao: boolean;

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
    this.ao = !coarse && new URLSearchParams(location.search).get('ao') !== '0';
    this.renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    this.renderer.info.autoReset = false;
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
    this.applyEnvironment(this.room);
    if (this.ao) this.setupComposer();
  }

  /** Rantai pascaproses: render → oklusi ambien → tone mapping & sRGB. */
  private setupComposer(): void {
    try {
      const gl = this.renderer.getContext();
      if (!(typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext)) throw new Error('webgl1');
      const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: 4 });
      const composer = new EffectComposer(this.renderer, target);
      composer.addPass(new RenderPass(this.scene, this.camera));
      const ao = new GTAOPass(this.scene, this.camera, 1, 1);
      ao.output = GTAOPass.OUTPUT.Default;
      ao.blendIntensity = 0.85;
      ao.updateGtaoMaterial({ radius: 0.2, distanceExponent: 1.4, thickness: 0.6, scale: 1.05, samples: 12, distanceFallOff: 1, screenSpaceRadius: false });
      ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, radiusExponent: 1.8, rings: 2, samples: 12 });
      composer.addPass(ao);
      composer.addPass(new OutputPass());
      composer.setPixelRatio(this.pixelRatio);
      composer.setSize(this.width, this.height);
      this.composer = composer;
      this.aoPass = ao;
    } catch {
      this.composer = null;
      this.aoPass = null;
      this.ao = false;
    }
  }

  /** Nyalakan/matikan oklusi ambien (pengaturan grafis). */
  setAmbientOcclusion(on: boolean): void {
    if (on && !this.composer) this.setupComposer();
    this.ao = on && !!this.composer;
  }

  get ambientOcclusion(): boolean {
    return this.ao;
  }

  // --- API ------------------------------------------------------------

  add(u: StageUpdatable): void {
    this.updatables.add(u);
  }

  remove(u: StageUpdatable): void {
    this.updatables.delete(u);
  }

  /** Tampilkan ruang lain menggantikan ruang praktik (null = kembali ke ruang praktik). */
  setAltRoom(room: Room | null): void {
    if (this.alt === room) return;
    if (this.alt) this.alt.group.visible = false;
    this.alt = room;
    this.room.group.visible = !room;
    if (room) {
      if (!room.group.parent) this.scene.add(room.group);
      room.group.visible = true;
      room.setShadows(this.shadows);
    }
    this.applyEnvironment(room ?? this.room);
  }

  /** Peta lingkungan aktif (dipakai mis. untuk bahan yang butuh pantulan khusus). */
  get environment(): Texture | null {
    return this.scene.environment;
  }

  /**
   * Pencahayaan berbasis citra: ruangan dipotret ke enam arah dari `envProbe` (tanpa orang),
   * diburamkan menurut kekasaran (PMREM), lalu menjadi cahaya ambien & pantulan semua bahan.
   * Hasilnya: kulit, mata, kain, dan logam diterangi lampu & dinding ruangan yang sebenarnya.
   */
  private applyEnvironment(room: Room): void {
    if (!room.envProbe) {
      this.scene.environment = null;
      return;
    }
    let rt = this.envs.get(room);
    if (!rt) {
      try {
        this.pmrem ??= new PMREMGenerator(this.renderer);
        const tmp = new Scene();
        tmp.background = this.scene.background;
        const g = room.group;
        const parent = g.parent;
        const visible = g.visible;
        const pos = g.position.clone();
        tmp.add(g);
        g.visible = true;
        g.position.sub(room.envProbe);
        room.setEnvCapture?.(true);
        g.updateMatrixWorld(true);
        rt = this.pmrem.fromScene(tmp, 0.015, 0.05, 40);
        room.setEnvCapture?.(false);
        g.position.copy(pos);
        g.visible = visible;
        parent?.add(g);
        g.updateMatrixWorld(true);
        this.envs.set(room, rt);
      } catch {
        this.scene.environment = null;
        return;
      }
    }
    for (const [r] of this.envs) r.useEnvironment?.(r === room);
    room.useEnvironment?.(true);
    this.scene.environment = rt.texture;
    this.scene.environmentIntensity = room.envIntensity ?? 1;
  }

  /** Perbesaran pandangan (FOV dikali `z`; < 1 = mendekat) — mis. saat memeriksa luka. */
  setZoom(z: number): void {
    this.fovGoal = z;
  }

  /** Kamera bebas (null = kamera dokter di meja praktik). */
  setRig(rig: CameraRig | null): void {
    if (rig && !this.rig) {
      this.rigEye.copy(rig.eye);
      this.focus.copy(rig.focus);
    }
    this.rig = rig;
    this.fovGoal = rig?.fov ?? 1;
    if (!rig) {
      this.fovMul = 1;
      this.applyProjection();
    }
  }

  /** Lompatkan kamera bebas langsung ke tujuannya (uji visual). */
  snapRig(): void {
    if (!this.rig) return;
    this.rigEye.copy(this.rig.eye);
    this.focus.copy(this.rig.focus);
    this.fovMul = this.fovGoal;
    this.applyProjection();
    this.updateRig(0);
  }

  /** Ketukan (bukan seret) pada kanvas: koordinat NDC (−1..1). */
  setTapHandler(fn: ((x: number, y: number) => void) | null): void {
    this.tapHandler = fn;
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
    for (const rt of this.envs.values()) rt.dispose();
    this.envs.clear();
    this.pmrem?.dispose();
    this.aoPass?.dispose();
    this.composer?.dispose();
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
    (this.alt ?? this.room).update(dt, this.time);
    for (const u of this.updatables) u.update(dt, this.time);
    this.updateCamera(dt);
    if (this.frame % this.throttle !== 0) return;
    // Statistik dihitung per frame (bukan per pass pascaproses).
    this.renderer.info.reset();
    if (this.ao && this.composer) this.composer.render(dt);
    else this.renderer.render(this.scene, this.camera);
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
      if (this.ao) {
        // Pertama korbankan oklusi ambien (paling mahal), baru resolusi & bayangan.
        this.ao = false;
      } else if (this.pixelRatio > floor) {
        this.pixelRatio = Math.max(floor, this.pixelRatio - 0.35);
        this.renderer.setPixelRatio(this.pixelRatio);
        this.renderer.setSize(this.width, this.height, false);
        this.composer?.setPixelRatio(this.pixelRatio);
      } else if (this.shadows) {
        this.shadows = false;
        this.room.setShadows(false);
        this.alt?.setShadows(false);
      } else if (this.pixelRatio > 0.7) {
        this.pixelRatio = 0.7;
        this.renderer.setPixelRatio(this.pixelRatio);
        this.renderer.setSize(this.width, this.height, false);
        this.composer?.setPixelRatio(this.pixelRatio);
      }
    }
    if (this.fastFrames > 600) {
      this.fastFrames = 0;
      this.slowFrames = Math.max(0, this.slowFrames - 20);
    }
  }

  private updateCamera(dt: number): void {
    if (this.rig) return this.updateRig(dt);
    if (Math.abs(this.fovMul - this.fovGoal) > 0.002) {
      this.fovMul += (this.fovGoal - this.fovMul) * (1 - Math.exp(-3 * dt));
      this.applyProjection();
    }
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

  /** Kamera bebas: mata berpindah halus ke posisi tujuan, pandangan mengikuti titik fokus. */
  private updateRig(dt: number): void {
    const rig = this.rig!;
    this.rigEye.lerp(rig.eye, 1 - Math.exp(-2.4 * dt));
    this.focus.lerp(rig.focus, 1 - Math.exp(-3.4 * dt));
    if (Math.abs(this.fovMul - this.fovGoal) > 0.002) {
      this.fovMul += (this.fovGoal - this.fovMul) * (1 - Math.exp(-3 * dt));
      this.applyProjection();
    }
    if (!this.dragging && this.time - this.idleSince > 2.4) {
      const k = 1 - Math.exp(-1.6 * dt);
      this.lookYaw += (0 - this.lookYaw) * k;
      this.lookPitch += (0 - this.lookPitch) * k;
    }
    const eye = this.camera.position;
    eye.set(this.rigEye.x + Math.sin(this.time * 0.31) * 0.006, this.rigEye.y + Math.sin(this.time * 1.1) * 0.004, this.rigEye.z);
    const dx = this.focus.x - eye.x;
    const dy = this.focus.y - eye.y;
    const dz = this.focus.z - eye.z;
    const yaw = Math.atan2(-dx, -dz) + this.lookYaw;
    const pitch = clamp(Math.atan2(dy, Math.hypot(dx, dz)) + this.lookPitch, -1.1, 0.7);
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
    this.composer?.setSize(w, h);
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
    const vFree = clamp(Math.max(base, 2 * Math.atan(Math.tan(19 * DEG) / (fw / fh))) * this.fovMul, 28 * DEG, 84 * DEG);
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
    this.dragDist = 0;
    this.downAt = performance.now();
    this.lastPointer = { x: e.clientX, y: e.clientY };
    this.canvas.classList.add('is-dragging');
  };

  private readonly onPointerMove = (e: PointerEvent): void => {
    if (!this.dragging) return;
    const dx = e.clientX - this.lastPointer.x;
    const dy = e.clientY - this.lastPointer.y;
    this.lastPointer = { x: e.clientX, y: e.clientY };
    this.dragDist += Math.abs(dx) + Math.abs(dy);
    const k = (this.camera.fov * DEG) / this.height;
    const range = this.rig ? 1.9 : 1.25;
    this.lookYaw = clamp(this.lookYaw + dx * k * 0.9, -range, range);
    this.lookPitch = clamp(this.lookPitch + dy * k * 0.9, -0.55, 0.5);
    this.idleSince = this.time;
  };

  private readonly onPointerUp = (e: PointerEvent): void => {
    if (!this.dragging) return;
    this.dragging = false;
    this.idleSince = this.time;
    this.canvas.classList.remove('is-dragging');
    if (this.tapHandler && this.dragDist < 7 && performance.now() - this.downAt < 600 && e.type === 'pointerup') {
      const r = this.canvas.getBoundingClientRect();
      this.tapHandler(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    }
  };

  private readonly onVisibility = (): void => {
    if (document.hidden) this.stop();
    else this.start();
  };
}
