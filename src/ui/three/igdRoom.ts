/**
 * Ruang Instalasi Gawat Darurat (prosedural, low-poly) untuk mode Dokter Jaga IGD:
 * deretan bed (2 resusitasi + 3 akut) dengan monitor dinding yang hidup, panel gas medis,
 * tiang infus, troli emergensi + defibrilator + ventilator di bed resusitasi, 2 kursi observasi,
 * meja perawat dengan monitor sentral, pintu geser masuk IGD (ambulans di luar), kursi tunggu,
 * meja triase, dan pintu keluar ke radiologi/rawat inap.
 *
 * Sistem koordinat (meter): Y ke atas. Bed berderet di dinding belakang (z ≈ −4,3), kepala bed
 * menghadap dinding; lorong di z ≈ −1,4; meja perawat di depan (z ≈ 1,3); pintu masuk di dinding
 * kanan (x = 6,6).
 */
import {
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  LinearFilter,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  type Object3D,
  PlaneGeometry,
  PointLight,
  SphereGeometry,
  SRGBColorSpace,
  type Texture,
  TorusGeometry,
  Vector3,
} from 'three';
import type { BedKind } from '../../core/igd/types';
import type { BedPose } from './actor';
import type { Room } from './room';
import { canvasTexture, floorTexture, signTexture } from './textures';

export const IGD_ROOM = { x0: -6.6, x1: 6.6, z0: -5.0, z1: 3.4, h: 3.0 };

/** Titik-titik penting tata letak IGD. */
export const IGD_LAYOUT = {
  bedHeadZ: -4.25,
  bedLength: 2.05,
  /** Titik pinggul pasien di bed (engsel sandaran). */
  hingeZ: -3.42,
  mattressTop: 0.66,
  /** Lorong utama di depan bed. */
  laneZ: -0.85,
  /** Pintu masuk (dinding kanan). */
  entrance: { x: IGD_ROOM.x1, z: 1.35, width: 2.2 },
  /** Titik di luar pintu masuk (ambulans/halaman). */
  outside: new Vector3(9.2, 0, 1.35),
  /** Pintu keluar ke radiologi/rawat inap (dinding kiri). */
  exit: { x: IGD_ROOM.x0, z: 0.9, width: 1.8 },
  exitOutside: new Vector3(-8.6, 0, 0.9),
  /** Tempat parkir brankar pasien yang menunggu triase/bed. */
  parking: [
    { x: 4.3, z: 1.75 },
    { x: 4.3, z: 0.75 },
  ],
  /** Kursi tunggu (dinding kanan, menghadap −X). */
  waiting: [
    { x: 6.12, z: -2.75 },
    { x: 6.12, z: -2.15 },
    { x: 6.12, z: -1.55 },
    { x: 6.12, z: -0.95 },
    { x: 6.12, z: -0.35 },
  ],
  /** Tempat berdiri bila kursi tunggu penuh. */
  overflow: [
    { x: 5.0, z: -2.5 },
    { x: 5.0, z: -1.8 },
    { x: 5.0, z: -1.1 },
    { x: 4.3, z: -2.2 },
  ],
  /** Posisi siaga perawat di meja perawat. */
  station: [new Vector3(-3.05, 0, 1.0), new Vector3(1.25, 0, 0.95), new Vector3(-2.4, 0, 0.62)],
  /** Pandangan umum dokter (berdiri di dekat meja perawat). */
  overviewEye: new Vector3(-0.55, 1.76, 2.55),
  overviewFocus: new Vector3(-1.2, 0.95, -3.2),
};

/** Posisi x tiap bay sesuai id bed (lihat DEFAULT_BEDS di core/igd/catalog.ts). */
const BAY_X: Record<string, number> = { R1: -5.3, R2: -3.35, A1: -1.45, A2: 0.25, A3: 1.95, K1: 3.55, K2: 4.75 };

export interface IgdBay {
  id: string;
  label: string;
  kind: BedKind;
  x: number;
  /** Bed: pose berbaring (titik pinggul) dengan sandaran saat ini. Kursi: null. */
  pose: ((roll?: number, legsUp?: number) => BedPose) | null;
  /** Kursi observasi: tempat duduk (x, z, arah hadap, tinggi dudukan). */
  seat: { x: number; z: number; yaw: number; y: number } | null;
  /** Sudut sandaran yang dituju (rad). */
  setIncline(rad: number): void;
  /** Titik gantung kantong infus (dunia). */
  ivHook: Vector3;
  /** Gambar layar monitor (dipanggil adegan). */
  monitor: { canvas: HTMLCanvasElement; g: CanvasRenderingContext2D; texture: CanvasTexture; on: boolean };
  setMonitorOn(on: boolean): void;
  /** Selimut menutup tungkai pasien yang berbaring. */
  setBlanket(on: boolean): void;
  /** Kain penutup jenazah. */
  setSheet(on: boolean): void;
  /** Kantong infus yang tergantung (jumlah; darah = merah). */
  setBags(n: number, blood: boolean): void;
  /** Titik ujung bawah kantong infus pertama (dunia) untuk selang. */
  bagOutlet: Vector3;
  /** Kamera saat bay ini dipilih. */
  eye: Vector3;
  focus: Vector3;
  /** Objek untuk deteksi ketuk. */
  hit: Object3D;
  /** Defibrilator (bay resusitasi) — posisi layar untuk kilatan. */
  defib: Vector3 | null;
  /** Ventilator (bay resusitasi) — titik sambungan selang. */
  ventPort: Vector3 | null;
}

export interface IgdRoom extends Room {
  bays: Map<string, IgdBay>;
  /** 0 = tertutup … 1 = terbuka (pintu geser masuk). */
  setEntrance(open: number): void;
  setExitDoor(open: number): void;
  /** Jam dinding mengikuti jam permainan (menit sejak 00:00). */
  setClock(minutes: number): void;
  /** Lampu rotator ambulans (kedatangan). */
  setSiren(on: boolean): void;
  /** Kilatan defibrilator di bay tertentu. */
  flash(bayId: string): void;
  /** Layar monitor sentral di meja perawat. */
  central: { canvas: HTMLCanvasElement; g: CanvasRenderingContext2D; texture: CanvasTexture };
  hitTargets: Object3D[];
}

function screenTexture(w: number, h: number): { canvas: HTMLCanvasElement; g: CanvasRenderingContext2D; texture: CanvasTexture } {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d')!;
  g.fillStyle = '#05090c';
  g.fillRect(0, 0, w, h);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  return { canvas, g, texture };
}

/** Lantai vinil IGD (abu kehijauan, berbintik) — ubin besar tanpa nat tegas. */
function vinylTexture(): CanvasTexture {
  const tex = floorTexture();
  const g = (tex.image as HTMLCanvasElement).getContext('2d')!;
  g.fillStyle = 'rgba(176,196,190,0.55)';
  g.fillRect(0, 0, 256, 256);
  let s = 11;
  const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 700; i++) {
    g.fillStyle = `rgba(${90 + rnd() * 60},${110 + rnd() * 50},${105 + rnd() * 50},${0.08 + rnd() * 0.1})`;
    g.fillRect(rnd() * 256, rnd() * 256, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  tex.needsUpdate = true;
  return tex;
}

function igdWallTexture(): CanvasTexture {
  const tex = canvasTexture(64, 512, (g, w, h) => {
    g.fillStyle = '#eef1ee';
    g.fillRect(0, 0, w, h);
    const band = h * 0.3;
    g.fillStyle = '#d4e3e6';
    g.fillRect(0, h - band, w, band);
    // Pelindung dinding (bumper) setinggi brankar.
    g.fillStyle = '#9cb6bd';
    g.fillRect(0, h - band - 10, w, 12);
    g.fillStyle = '#b8c2c4';
    g.fillRect(0, h - 12, w, 12);
  });
  return tex;
}

function whiteboardTexture(): CanvasTexture {
  return canvasTexture(512, 256, (g, w, h) => {
    g.fillStyle = '#fbfcfc';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#c0392b';
    g.font = 'bold 30px system-ui, sans-serif';
    g.fillText('PAPAN IGD', 18, 40);
    g.strokeStyle = '#7f8c8d';
    g.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      g.beginPath();
      g.moveTo(16, 62 + i * 27);
      g.lineTo(w - 16, 62 + i * 27);
      g.stroke();
    }
    g.fillStyle = '#2c3e50';
    g.font = '17px system-ui, sans-serif';
    const rows = ['R1  ·  —', 'R2  ·  —', 'A1  ·  —', 'A2  ·  —', 'A3  ·  —', 'Dr jaga: Anda', 'Konsulen: on call'];
    rows.forEach((r, i) => g.fillText(r, 22, 80 + i * 27));
    g.fillStyle = '#2980b9';
    g.font = 'italic 16px system-ui, sans-serif';
    g.fillText('Cuci tangan 6 langkah!', w - 210, h - 14);
  });
}

function posterTexture(title: string, lines: string[], color: string): CanvasTexture {
  return canvasTexture(256, 360, (g, w, h) => {
    g.fillStyle = '#fdfdfb';
    g.fillRect(0, 0, w, h);
    g.fillStyle = color;
    g.fillRect(0, 0, w, 64);
    g.fillStyle = '#fff';
    g.font = 'bold 24px system-ui, sans-serif';
    g.textAlign = 'center';
    g.fillText(title, w / 2, 42);
    g.textAlign = 'left';
    g.fillStyle = '#22313a';
    g.font = '17px system-ui, sans-serif';
    lines.forEach((l, i) => g.fillText(l, 18, 100 + i * 34));
    g.strokeStyle = color;
    g.lineWidth = 6;
    g.strokeRect(3, 3, w - 6, h - 6);
  });
}

function triageTexture(): CanvasTexture {
  return canvasTexture(256, 360, (g, w) => {
    g.fillStyle = '#fdfdfb';
    g.fillRect(0, 0, w, 360);
    g.fillStyle = '#22313a';
    g.font = 'bold 22px system-ui, sans-serif';
    g.textAlign = 'center';
    g.fillText('TRIASE ATS', w / 2, 36);
    const rows: [string, string, string][] = [
      ['1', 'Segera', '#c0392b'],
      ['2', '10 menit', '#e67e22'],
      ['3', '30 menit', '#f1c40f'],
      ['4', '60 menit', '#27ae60'],
      ['5', '120 menit', '#2980b9'],
    ];
    rows.forEach(([n, t, c], i) => {
      g.fillStyle = c;
      g.fillRect(20, 58 + i * 58, w - 40, 48);
      g.fillStyle = i === 2 ? '#22313a' : '#fff';
      g.font = 'bold 22px system-ui, sans-serif';
      g.fillText(`ATS ${n} · ${t}`, w / 2, 90 + i * 58);
    });
  });
}

function clockFaceTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g, w) => {
    const c = w / 2;
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(c, c, c - 4, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#2c3e50';
    g.lineWidth = 8;
    g.stroke();
    g.fillStyle = '#2c3e50';
    g.font = 'bold 26px system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (let i = 1; i <= 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.fillText(String(i), c + Math.sin(a) * (c - 34), c - Math.cos(a) * (c - 34));
    }
  });
}

function ambulanceSideTexture(): CanvasTexture {
  return canvasTexture(512, 192, (g, w, h) => {
    g.fillStyle = '#f7f7f4';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#e8581c';
    g.fillRect(0, h * 0.52, w, 26);
    g.fillStyle = '#1f6fb2';
    g.fillRect(0, h * 0.52 + 30, w, 8);
    g.fillStyle = '#c0392b';
    g.font = 'bold 44px system-ui, sans-serif';
    g.textAlign = 'center';
    g.fillText('AMBULANS 119', w / 2, h * 0.4);
    // Palang biru (star of life disederhanakan).
    g.fillStyle = '#1f6fb2';
    g.fillRect(w * 0.84, h * 0.12, 18, 54);
    g.fillRect(w * 0.84 - 18, h * 0.12 + 18, 54, 18);
  });
}

export function buildIgdRoom(options: { shadows: boolean; beds: { id: string; label: string; kind: BedKind }[] }): IgdRoom {
  const group = new Group();
  group.name = 'igd';
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(x: T): T => {
    disposables.push(x);
    return x;
  };
  const mat = (color: string | number, extra: Partial<{ roughness: number; metalness: number; map: Texture; emissive: number | string; emissiveIntensity: number; transparent: boolean; opacity: number; side: typeof DoubleSide }> = {}) =>
    track(new MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...extra }));
  const basic = (color: string | number, extra: Partial<{ map: Texture; transparent: boolean; opacity: number; side: typeof DoubleSide }> = {}) => track(new MeshBasicMaterial({ color, ...extra }));
  const add = (parent: Object3D, mesh: Mesh, cast = true, receive = true): Mesh => {
    // Hanya benda besar yang membentuk bayangan (hemat draw call pada lintasan bayangan).
    if (cast && options.shadows) {
      const g = mesh.geometry;
      if (!g.boundingBox) g.computeBoundingBox();
      const s = g.boundingBox!.max.clone().sub(g.boundingBox!.min);
      cast = Math.max(s.x, s.y, s.z) > 0.38;
    }
    mesh.castShadow = cast && options.shadows;
    mesh.receiveShadow = receive;
    parent.add(mesh);
    return mesh;
  };
  const geoCache = new Map<string, BoxGeometry>();
  const boxGeo = (w: number, h: number, d: number) => {
    const key = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}`;
    let g = geoCache.get(key);
    if (!g) geoCache.set(key, (g = track(new BoxGeometry(w, h, d))));
    return g;
  };
  const box = (parent: Object3D, w: number, h: number, d: number, m: Material, x: number, y: number, z: number, cast = true): Mesh => {
    const mesh = new Mesh(boxGeo(w, h, d), m);
    mesh.position.set(x, y, z);
    return add(parent, mesh, cast);
  };
  const cyl = (parent: Object3D, rTop: number, rBot: number, h: number, m: Material, x: number, y: number, z: number, seg = 14, cast = true): Mesh => {
    const mesh = new Mesh(track(new CylinderGeometry(rTop, rBot, h, seg)), m);
    mesh.position.set(x, y, z);
    return add(parent, mesh, cast);
  };
  const plane = (parent: Object3D, w: number, h: number, m: Material, x: number, y: number, z: number, rotY = 0): Mesh => {
    const mesh = new Mesh(track(new PlaneGeometry(w, h)), m);
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotY;
    return add(parent, mesh, false, false);
  };
  const sign = (text: string, w: number, h: number, x: number, y: number, z: number, rotY = 0, bg = '#2f6f73', fg = '#ffffff') =>
    plane(group, w, h, basic('#ffffff', { map: track(signTexture(text, bg, fg)) }), x, y, z, rotY);

  const R = IGD_ROOM;
  const L = IGD_LAYOUT;

  // --- Material bersama ----------------------------------------------------------
  const white = mat('#f3f4f2', { roughness: 0.6 });
  const offWhite = mat('#e3e7e6', { roughness: 0.7 });
  const metal = mat('#c3c9ce', { roughness: 0.3, metalness: 0.75 });
  const darkMetal = mat('#4b535a', { roughness: 0.45, metalness: 0.5 });
  const black = mat('#1e2328', { roughness: 0.55 });
  const blueGrey = mat('#9fb3bf', { roughness: 0.7 });
  const mattressMat = mat('#2f4f63', { roughness: 0.8 });
  const sheetMat = mat('#f1f4f6', { roughness: 0.95 });
  const blanketMat = mat('#8fb3d1', { roughness: 0.97 });
  const pillowMat = mat('#fafbfc', { roughness: 0.95 });
  const red = mat('#c0392b', { roughness: 0.5 });
  const green = mat('#2e8b57', { roughness: 0.6 });
  const yellow = mat('#e2b93b', { roughness: 0.6 });
  const glass = mat('#bfe0ea', { roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.28 });
  const curtainMat = mat('#9ccfc6', { roughness: 0.95, side: DoubleSide });
  const counterMat = mat('#e9e4da', { roughness: 0.6 });
  const counterFront = mat('#4f8a8b', { roughness: 0.7 });

  // --- Lantai, dinding, plafon ------------------------------------------------------
  const floorTex = track(vinylTexture());
  floorTex.repeat.set((R.x1 - R.x0) / 1.2, (R.z1 - R.z0) / 1.2);
  const floor = new Mesh(track(new PlaneGeometry(R.x1 - R.x0, R.z1 - R.z0)), mat('#ffffff', { map: floorTex, roughness: 0.42 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, (R.z0 + R.z1) / 2);
  add(group, floor, false, true);
  // Garis penunjuk arah di lantai (merah: resusitasi, kuning: akut, hijau: kursi/tunggu).
  const stripe = (x0: number, x1: number, z: number, m: Material) => {
    const s = new Mesh(boxGeo(Math.abs(x1 - x0), 0.004, 0.08), m);
    s.position.set((x0 + x1) / 2, 0.003, z);
    add(group, s, false, true);
  };
  stripe(-5.9, 5.9, -1.3, red);
  stripe(-1.9, 5.9, -1.18, yellow);
  stripe(3.0, 5.9, -1.06, green);

  const wallTex = track(igdWallTexture());
  const wallMat = (len: number) => {
    const t = track(wallTex.clone());
    t.repeat.set(len / 1.5, 1);
    t.wrapS = 1000; // RepeatWrapping
    t.needsUpdate = true;
    return mat('#ffffff', { map: t, roughness: 0.92 });
  };
  // Dinding belakang (utuh).
  box(group, R.x1 - R.x0, R.h, 0.1, wallMat(R.x1 - R.x0), 0, R.h / 2, R.z0 - 0.05, false).receiveShadow = true;
  // Dinding depan (di belakang kamera pandangan umum).
  box(group, R.x1 - R.x0, R.h, 0.1, wallMat(R.x1 - R.x0), 0, R.h / 2, R.z1 + 0.05, false);
  // Dinding kanan dengan bukaan pintu masuk.
  const E = L.entrance;
  const eA = E.z - E.width / 2;
  const eB = E.z + E.width / 2;
  box(group, 0.1, R.h, eA - R.z0, wallMat(eA - R.z0), R.x1 + 0.05, R.h / 2, (R.z0 + eA) / 2, false);
  box(group, 0.1, R.h, R.z1 - eB, wallMat(R.z1 - eB), R.x1 + 0.05, R.h / 2, (eB + R.z1) / 2, false);
  box(group, 0.1, R.h - 2.3, E.width, wallMat(E.width), R.x1 + 0.05, 2.3 + (R.h - 2.3) / 2, E.z, false);
  // Dinding kiri dengan bukaan pintu keluar (radiologi/rawat inap).
  const X = L.exit;
  const xA = X.z - X.width / 2;
  const xB = X.z + X.width / 2;
  box(group, 0.1, R.h, xA - R.z0, wallMat(xA - R.z0), R.x0 - 0.05, R.h / 2, (R.z0 + xA) / 2, false);
  box(group, 0.1, R.h, R.z1 - xB, wallMat(R.z1 - xB), R.x0 - 0.05, R.h / 2, (xB + R.z1) / 2, false);
  box(group, 0.1, R.h - 2.2, X.width, wallMat(X.width), R.x0 - 0.05, 2.2 + (R.h - 2.2) / 2, X.z, false);
  // Plafon + panel lampu.
  const ceiling = new Mesh(track(new PlaneGeometry(R.x1 - R.x0, R.z1 - R.z0)), mat('#f4f5f3', { roughness: 1 }));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, R.h, (R.z0 + R.z1) / 2);
  add(group, ceiling, false, false);
  const panelMat = mat('#ffffff', { emissive: '#fffaf0', emissiveIntensity: 1.3, roughness: 1 });
  for (const x of [-4.4, -1.5, 1.4, 4.3]) for (const z of [-3.4, -0.8, 1.8]) box(group, 1.1, 0.03, 0.55, panelMat, x, R.h - 0.02, z, false);

  // --- Jalur gorden di plafon ----------------------------------------------------------
  const rail = (x0: number, z0: number, x1: number, z1: number) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const m = box(group, len, 0.03, 0.04, metal, (x0 + x1) / 2, R.h - 0.35, (z0 + z1) / 2, false);
    m.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
  };
  /** Gorden terkumpul (lipatan bergelombang). */
  const curtain = (x: number, z: number, width: number, alongX: boolean) => {
    const geo = track(new PlaneGeometry(width, 2.05, 24, 1));
    const pos = geo.getAttribute('position');
    for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 26) * 0.035);
    geo.computeVertexNormals();
    const m = new Mesh(geo, curtainMat);
    m.position.set(x, R.h - 0.35 - 1.03, z);
    m.rotation.y = alongX ? 0 : Math.PI / 2;
    add(group, m, true, true);
  };

  // --- Tekstur & material layar ---------------------------------------------------------
  const flashLights: PointLight[] = [];

  // --- Bay pasien -------------------------------------------------------------------
  const bays = new Map<string, IgdBay>();
  const hitTargets: Object3D[] = [];
  const hitMat = track(new MeshBasicMaterial({ visible: false }));
  const bayUpdaters: ((dt: number) => void)[] = [];
  const bagGeo = track(new BoxGeometry(0.11, 0.17, 0.035));
  const bagClear = mat('#e8f4f8', { transparent: true, opacity: 0.62, roughness: 0.2 });
  const bagBlood = mat('#7a1018', { transparent: true, opacity: 0.88, roughness: 0.3 });

  for (const def of options.beds) {
    const bx = BAY_X[def.id] ?? 0;
    const g = new Group();
    g.name = `bay-${def.id}`;
    group.add(g);
    const isChair = def.kind === 'kursi';
    const isResus = def.kind === 'resusitasi';
    const headZ = L.bedHeadZ;
    const footZ = headZ + L.bedLength;

    // Panel gas medis & lampu periksa di dinding kepala bed.
    box(g, 1.1, 0.2, 0.08, offWhite, bx, 1.45, R.z0 + 0.04, false);
    cyl(g, 0.022, 0.022, 0.04, green, bx - 0.36, 1.45, R.z0 + 0.1, 10, false).rotation.x = Math.PI / 2;
    cyl(g, 0.022, 0.022, 0.04, mat('#1d1d1d'), bx - 0.24, 1.45, R.z0 + 0.1, 10, false).rotation.x = Math.PI / 2;
    cyl(g, 0.022, 0.022, 0.04, mat('#e9e9e9'), bx - 0.12, 1.45, R.z0 + 0.1, 10, false).rotation.x = Math.PI / 2;
    // Flowmeter O2 (tabung bening + bola).
    cyl(g, 0.02, 0.02, 0.16, glass, bx - 0.36, 1.32, R.z0 + 0.14, 10, false);
    const ball = new Mesh(track(new SphereGeometry(0.008, 8, 6)), green);
    ball.position.set(bx - 0.36, 1.29, R.z0 + 0.14);
    g.add(ball);
    // Humidifier.
    cyl(g, 0.035, 0.035, 0.09, mat('#d9eef5', { transparent: true, opacity: 0.6 }), bx - 0.36, 1.18, R.z0 + 0.14, 12, false);
    // Suction (tabung penampung).
    cyl(g, 0.055, 0.055, 0.2, mat('#d5dde0', { transparent: true, opacity: 0.55 }), bx - 0.12, 1.22, R.z0 + 0.16, 12, false);
    // Stop kontak.
    for (let i = 0; i < 3; i++) box(g, 0.06, 0.08, 0.02, white, bx + 0.12 + i * 0.1, 1.45, R.z0 + 0.09, false);
    // Label bay.
    plane(g, 0.5, 0.125, basic('#ffffff', { map: track(signTexture(def.id, isResus ? '#b03a2e' : isChair ? '#2e7d4f' : '#c08a12')) }), bx, 2.42, R.z0 + 0.012);

    // Monitor dinding (lengan) di sisi kanan kepala bed, menghadap kaki bed.
    const scr = screenTexture(256, 160);
    track(scr.texture);
    const monGroup = new Group();
    monGroup.position.set(bx + 0.62, 1.78, R.z0 + 0.32);
    monGroup.rotation.y = -0.32;
    g.add(monGroup);
    box(g, 0.05, 0.05, 0.3, darkMetal, bx + 0.62, 1.78, R.z0 + 0.15, false);
    box(monGroup, 0.4, 0.29, 0.06, mat('#3a4248', { roughness: 0.5 }), 0, 0, 0);
    const screenMat = track(new MeshBasicMaterial({ map: scr.texture, color: '#ffffff' }));
    const screen = plane(monGroup, 0.36, 0.225, screenMat, 0, 0.01, 0.031);
    screen.renderOrder = 1;
    const monitor = { ...scr, on: false };

    // Tiang infus di sisi kanan kepala bed.
    const poleX = isChair ? bx + 0.48 : bx + 0.58;
    const poleZ = isChair ? -4.0 : headZ + 0.35;
    cyl(g, 0.012, 0.012, 1.95, metal, poleX, 0.98, poleZ, 8);
    for (let i = 0; i < 5; i++) {
      const leg = box(g, 0.24, 0.02, 0.025, darkMetal, poleX, 0.06, poleZ, false);
      leg.rotation.y = (i / 5) * Math.PI * 2;
      leg.translateX(0.11);
    }
    const hookY = 1.95;
    box(g, 0.32, 0.015, 0.015, metal, poleX, hookY, poleZ, false);
    const ivHook = new Vector3(poleX, hookY - 0.11, poleZ);
    const bags: Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const bag = new Mesh(bagGeo, bagClear);
      bag.position.set(poleX + (i - 1) * 0.12, hookY - 0.1, poleZ);
      bag.visible = false;
      g.add(bag);
      bags.push(bag);
    }
    const bagOutlet = new Vector3(poleX, hookY - 0.2, poleZ);

    // Gorden pemisah (terkumpul di dinding) & rel.
    const half = isChair ? 0.58 : bx <= -3 ? 0.95 : 0.85;
    rail(bx - half, R.z0 + 0.05, bx - half, -2.0);
    curtain(bx - half, R.z0 + 0.6, 0.9, false);

    let incline = 0;
    let inclineGoal = 0;
    let setInclineFn = (rad: number) => {
      inclineGoal = rad;
    };
    let pose: IgdBay['pose'] = null;
    let seat: IgdBay['seat'] = null;
    const blanket = new Group();
    const sheet = new Group();
    let defib: Vector3 | null = null;
    let ventPort: Vector3 | null = null;
    let hitMesh: Mesh;

    if (!isChair) {
      // --- Bed rawat (rangka, kasur dua bagian, sandaran berengsel, pagar, roda) ---
      const top = L.mattressTop;
      const cz = (headZ + footZ) / 2;
      box(g, 0.78, 0.07, L.bedLength - 0.15, darkMetal, bx, 0.24, cz);
      box(g, 0.86, 0.05, L.bedLength - 0.05, blueGrey, bx, top - 0.16, cz);
      cyl(g, 0.045, 0.045, 0.32, darkMetal, bx, 0.4, cz - 0.55);
      cyl(g, 0.045, 0.045, 0.32, darkMetal, bx, 0.4, cz + 0.55);
      for (const dx of [-0.36, 0.36]) for (const dz of [-0.85, 0.85]) {
        const w = cyl(g, 0.055, 0.055, 0.04, black, bx + dx, 0.06, cz + dz, 12);
        w.rotation.z = Math.PI / 2;
      }
      // Kasur bagian kaki (tetap).
      const legLen = footZ - L.hingeZ;
      box(g, 0.84, 0.12, legLen, mattressMat, bx, top - 0.07, L.hingeZ + legLen / 2);
      box(g, 0.86, 0.012, legLen, sheetMat, bx, top - 0.004, L.hingeZ + legLen / 2, false);
      // Sandaran (berengsel di titik pinggul).
      const back = new Group();
      back.position.set(bx, top - 0.07, L.hingeZ);
      g.add(back);
      const backLen = L.hingeZ - headZ;
      box(back, 0.84, 0.12, backLen, mattressMat, 0, 0, -backLen / 2);
      box(back, 0.86, 0.012, backLen, sheetMat, 0, 0.066, -backLen / 2, false);
      box(back, 0.6, 0.1, 0.36, pillowMat, 0, 0.11, -backLen + 0.24);
      // Pagar samping (bagian kepala ikut sandaran).
      for (const sx of [-1, 1]) {
        box(back, 0.025, 0.025, 0.62, metal, sx * 0.45, 0.22, -0.42, false);
        box(back, 0.02, 0.2, 0.02, metal, sx * 0.45, 0.12, -0.12, false);
        box(back, 0.02, 0.2, 0.02, metal, sx * 0.45, 0.12, -0.72, false);
        box(g, 0.025, 0.025, 0.7, metal, bx + sx * 0.45, top + 0.18, L.hingeZ + 0.55, false);
        box(g, 0.02, 0.18, 0.02, metal, bx + sx * 0.45, top + 0.09, L.hingeZ + 0.22, false);
        box(g, 0.02, 0.18, 0.02, metal, bx + sx * 0.45, top + 0.09, L.hingeZ + 0.88, false);
      }
      // Papan kepala & kaki.
      box(g, 0.9, 0.52, 0.04, offWhite, bx, top + 0.06, headZ - 0.02);
      box(g, 0.9, 0.42, 0.04, offWhite, bx, top + 0.0, footZ + 0.02);
      box(g, 0.24, 0.3, 0.012, mat('#ffffff', { map: track(posterTexture('STATUS', ['Nama:', 'RM:', 'Alergi:'], '#4f8a8b')) }), bx + 0.22, top + 0.02, footZ + 0.05, false);
      // Selimut (menutup tungkai) & kain penutup jenazah.
      // Selimut menjuntai menutupi tungkai (setengah silinder pipih + tepi).
      const drape = new Mesh(track(new CylinderGeometry(0.42, 0.42, legLen - 0.02, 20, 1, false, -Math.PI / 2, Math.PI)), blanketMat);
      drape.rotation.x = -Math.PI / 2;
      drape.scale.set(1, 1, 0.72);
      drape.position.set(bx, top + 0.005, L.hingeZ + legLen / 2 + 0.03);
      drape.receiveShadow = true;
      blanket.add(drape);
      box(blanket, 0.9, 0.012, legLen - 0.02, blanketMat, bx, top + 0.006, L.hingeZ + legLen / 2 + 0.03, false);
      box(blanket, 0.86, 0.035, 0.12, mat('#f4f6f8', { roughness: 0.9 }), bx, top + 0.2, L.hingeZ + 0.06, false);
      // Ujung kaki: selimut "berdiri" menutupi telapak.
      const tent = new Mesh(track(new CylinderGeometry(0.4, 0.4, 0.5, 18, 1, false, -Math.PI / 2, Math.PI)), blanketMat);
      tent.rotation.x = -Math.PI / 2;
      tent.scale.set(1.04, 1, 1.0);
      tent.position.set(bx, top + 0.005, footZ - 0.3);
      blanket.add(tent);
      blanket.visible = false;
      g.add(blanket);
      box(sheet, 0.82, 0.24, L.bedLength - 0.12, sheetMat, bx, top + 0.15, cz - 0.02);
      box(sheet, 0.6, 0.12, 0.4, sheetMat, bx, top + 0.3, headZ + 0.3, false);
      sheet.visible = false;
      g.add(sheet);

      const backrest = back;
      bayUpdaters.push((dt) => {
        incline += (inclineGoal - incline) * (1 - Math.exp(-2.2 * dt));
        backrest.rotation.x = incline;
      });
      setInclineFn = (rad: number) => {
        inclineGoal = Math.max(0, Math.min(1.1, rad));
      };
      pose = (roll = 0, legsUp = 0) => ({ x: bx, y: top, z: L.hingeZ, yaw: 0, incline, roll, legsUp });

      // Bay resusitasi: troli emergensi + defibrilator + ventilator.
      if (isResus) {
        const cx = bx - 0.98;
        const cz2 = headZ + 0.3;
        box(g, 0.5, 0.92, 0.48, red, cx, 0.5, cz2);
        for (let i = 0; i < 5; i++) box(g, 0.44, 0.012, 0.01, mat('#8e1f15'), cx, 0.2 + i * 0.16, cz2 + 0.245, false);
        for (const dx of [-0.2, 0.2]) for (const dz of [-0.2, 0.2]) cyl(g, 0.035, 0.035, 0.05, black, cx + dx, 0.03, cz2 + dz, 10, false).rotation.z = Math.PI / 2;
        // Defibrilator di atas troli.
        box(g, 0.32, 0.2, 0.26, mat('#f0b429', { roughness: 0.5 }), cx, 1.06, cz2);
        const dScr = canvasTexture(128, 80, (gg, w, h) => {
          gg.fillStyle = '#03140a';
          gg.fillRect(0, 0, w, h);
          gg.strokeStyle = '#47f08a';
          gg.lineWidth = 2;
          gg.beginPath();
          for (let x = 0; x < w; x += 2) gg.lineTo(x, h * 0.55 - (x % 32 < 4 ? 22 : 0) + Math.sin(x * 0.3) * 2);
          gg.stroke();
          gg.fillStyle = '#47f08a';
          gg.font = 'bold 16px system-ui';
          gg.fillText('200 J', 70, 22);
        });
        track(dScr);
        plane(g, 0.17, 0.11, basic('#ffffff', { map: dScr }), cx - 0.04, 1.12, cz2 + 0.132);
        box(g, 0.05, 0.05, 0.03, red, cx + 0.11, 1.1, cz2 + 0.135, false);
        defib = new Vector3(cx, 1.12, cz2 + 0.13);
        // Ventilator (tiang beroda) di kiri bed bagian tengah.
        const vx = bx - 0.98;
        const vz = L.hingeZ + 0.55;
        cyl(g, 0.025, 0.025, 1.1, metal, vx, 0.62, vz, 8);
        box(g, 0.4, 0.04, 0.4, darkMetal, vx, 0.08, vz);
        box(g, 0.34, 0.3, 0.24, mat('#e6ecef', { roughness: 0.5 }), vx, 1.3, vz);
        const vScr = canvasTexture(128, 96, (gg, w, h) => {
          gg.fillStyle = '#0b1a2a';
          gg.fillRect(0, 0, w, h);
          gg.fillStyle = '#6fc3ff';
          gg.font = 'bold 13px system-ui';
          gg.fillText('VC-AC', 8, 18);
          gg.fillText('VT 450  f 14', 8, 40);
          gg.fillText('PEEP 5  FiO₂ 60', 8, 60);
          gg.strokeStyle = '#ffd84d';
          gg.beginPath();
          for (let x = 0; x < w; x += 2) gg.lineTo(x, h - 10 - Math.max(0, Math.sin(x * 0.1)) * 14);
          gg.stroke();
        });
        track(vScr);
        plane(g, 0.26, 0.19, basic('#ffffff', { map: vScr }), vx + 0.171, 1.3, vz, Math.PI / 2);
        ventPort = new Vector3(vx + 0.18, 1.18, vz);
        // Rak alat jalan napas di dinding.
        box(g, 0.5, 0.36, 0.12, white, bx - 0.75, 1.95, R.z0 + 0.07);
        for (let i = 0; i < 4; i++) box(g, 0.08, 0.12, 0.05, i % 2 ? mat('#5dade2') : mat('#f5b041'), bx - 0.93 + i * 0.12, 1.92, R.z0 + 0.15, false);
        // Lampu kilat defibrilator.
        const fl = new PointLight('#cfe8ff', 0, 3, 2);
        fl.position.set(bx, 1.2, L.hingeZ - 0.3);
        fl.name = `flash-${def.id}`;
        g.add(fl);
        flashLights.push(fl);
      } else {
        // Troli tindakan kecil (bay akut).
        const tx = bx - 0.86;
        const tz = headZ + 0.3;
        box(g, 0.44, 0.03, 0.36, metal, tx, 0.82, tz);
        box(g, 0.44, 0.03, 0.36, metal, tx, 0.42, tz);
        for (const dx of [-0.2, 0.2]) for (const dz of [-0.16, 0.16]) cyl(g, 0.01, 0.01, 0.8, metal, tx + dx, 0.42, tz + dz, 6, false);
        box(g, 0.2, 0.06, 0.14, blueGrey, tx - 0.08, 0.87, tz, false);
        box(g, 0.1, 0.12, 0.1, yellow, tx + 0.13, 0.9, tz, false);
        box(g, 0.16, 0.08, 0.12, white, tx, 0.48, tz, false);
      }
      hitMesh = new Mesh(boxGeo(1.1, 1.3, L.bedLength + 0.3), hitMat);
      hitMesh.position.set(bx, 0.65, cz);
    } else {
      // --- Kursi observasi (recliner) dengan meja kecil ---
      const sz = -4.05;
      const sy = 0.48;
      const chairMat = mat('#3d6e8a', { roughness: 0.75 });
      box(g, 0.62, 0.12, 0.58, chairMat, bx, sy - 0.06, sz);
      box(g, 0.62, 0.7, 0.14, chairMat, bx, sy + 0.32, sz - 0.3);
      box(g, 0.1, 0.24, 0.56, chairMat, bx - 0.36, sy + 0.08, sz);
      box(g, 0.1, 0.24, 0.56, chairMat, bx + 0.36, sy + 0.08, sz);
      box(g, 0.55, 0.38, 0.5, darkMetal, bx, 0.2, sz - 0.02);
      box(g, 0.5, 0.06, 0.32, chairMat, bx, 0.3, sz + 0.42);
      box(g, 0.36, 0.5, 0.36, white, bx + 0.6, 0.25, -4.6);
      seat = { x: bx, z: sz, yaw: 0, y: sy };
      hitMesh = new Mesh(boxGeo(0.9, 1.4, 1.2), hitMat);
      hitMesh.position.set(bx, 0.7, sz + 0.1);
    }
    hitMesh.userData.bayId = def.id;
    g.add(hitMesh);
    hitTargets.push(hitMesh);

    const eye = isChair ? new Vector3(bx + 0.2, 1.62, -2.05) : new Vector3(bx + 0.32, 1.66, -1.32);
    const focus = isChair ? new Vector3(bx, 0.98, -4.0) : new Vector3(bx - 0.02, 0.9, L.hingeZ - 0.3);
    bays.set(def.id, {
      id: def.id,
      label: def.label,
      kind: def.kind,
      x: bx,
      pose,
      seat,
      setIncline: (rad) => setInclineFn(rad),
      ivHook,
      monitor,
      setMonitorOn(on: boolean) {
        if (monitor.on === on) return;
        monitor.on = on;
        if (!on) {
          monitor.g.fillStyle = '#05090c';
          monitor.g.fillRect(0, 0, monitor.canvas.width, monitor.canvas.height);
          monitor.texture.needsUpdate = true;
        }
      },
      setBlanket(on: boolean) {
        blanket.visible = on;
      },
      setSheet(on: boolean) {
        sheet.visible = on;
      },
      setBags(n: number, blood: boolean) {
        bags.forEach((b, i) => {
          b.visible = i < n;
          b.material = blood && i === 0 ? bagBlood : bagClear;
        });
      },
      bagOutlet,
      eye,
      focus,
      hit: hitMesh,
      defib,
      ventPort,
    });
  }
  // Rel gorden ujung kanan (setelah bay A3).
  rail(2.8, R.z0 + 0.05, 2.8, -2.0);
  curtain(2.8, R.z0 + 0.6, 0.9, false);

  // --- Tanda zona di dinding belakang ---------------------------------------------------
  sign('RESUSITASI', 1.6, 0.4, -4.3, 2.72, R.z0 + 0.012, 0, '#b03a2e');
  sign('AKUT', 1.2, 0.3, 0.25, 2.75, R.z0 + 0.012, 0, '#c08a12');
  sign('OBSERVASI', 1.2, 0.3, 4.15, 2.75, R.z0 + 0.012, 0, '#2e7d4f');

  // --- Meja perawat (nurse station) --------------------------------------------------
  const ns = new Group();
  group.add(ns);
  const nsX0 = -2.75;
  const nsX1 = 0.85;
  const nsZ = 1.35;
  box(ns, nsX1 - nsX0, 1.05, 0.1, counterFront, (nsX0 + nsX1) / 2, 0.525, nsZ - 0.3);
  box(ns, nsX1 - nsX0 + 0.1, 0.05, 0.36, counterMat, (nsX0 + nsX1) / 2, 1.08, nsZ - 0.28);
  box(ns, nsX1 - nsX0, 0.04, 0.72, counterMat, (nsX0 + nsX1) / 2, 0.76, nsZ + 0.08);
  box(ns, 0.1, 1.05, 0.9, counterFront, nsX0, 0.525, nsZ + 0.12);
  box(ns, 0.1, 1.05, 0.9, counterFront, nsX1, 0.525, nsZ + 0.12);
  plane(ns, 1.4, 0.24, basic('#ffffff', { map: track(signTexture('NURSE STATION', '#4f8a8b')) }), (nsX0 + nsX1) / 2, 0.75, nsZ - 0.358, Math.PI);
  // Komputer RME & monitor sentral.
  const central = screenTexture(512, 288);
  track(central.texture);
  const pcMat = mat('#1f262c', { roughness: 0.5 });
  for (const x of [-2.25, -1.6]) {
    box(ns, 0.5, 0.32, 0.04, pcMat, x, 1.03, nsZ + 0.18);
    const pcScr = canvasTexture(256, 160, (gg, w, h) => {
      gg.fillStyle = '#eef5f6';
      gg.fillRect(0, 0, w, h);
      gg.fillStyle = '#2f6f73';
      gg.fillRect(0, 0, w, 24);
      gg.fillStyle = '#fff';
      gg.font = 'bold 14px system-ui';
      gg.fillText('RME IGD', 8, 17);
      gg.fillStyle = '#5d6d7e';
      for (let i = 0; i < 7; i++) gg.fillRect(10, 36 + i * 17, 90 + ((i * 53) % 130), 7);
    });
    track(pcScr);
    plane(ns, 0.46, 0.28, basic('#ffffff', { map: pcScr }), x, 1.03, nsZ + 0.203, 0);
    box(ns, 0.06, 0.18, 0.06, pcMat, x, 0.86, nsZ + 0.2);
    box(ns, 0.42, 0.02, 0.14, mat('#2b2f33'), x, 0.79, nsZ + 0.45);
  }
  // Monitor sentral menghadap dokter (ke arah kamera pandangan umum) & menghadap lorong.
  box(ns, 0.78, 0.46, 0.05, pcMat, 0.5, 1.42, nsZ - 0.22);
  const centralMat = track(new MeshBasicMaterial({ map: central.texture }));
  plane(ns, 0.74, 0.42, centralMat, 0.5, 1.42, nsZ - 0.248, Math.PI);
  plane(ns, 0.74, 0.42, centralMat, 0.5, 1.42, nsZ - 0.192, 0);
  box(ns, 0.05, 0.36, 0.05, pcMat, 0.5, 1.2, nsZ - 0.22);
  // Telepon, berkas, kursi perawat.
  box(ns, 0.18, 0.06, 0.2, black, -0.4, 0.81, nsZ + 0.05);
  for (let i = 0; i < 4; i++) box(ns, 0.24, 0.02, 0.32, mat(['#f7dc6f', '#aed6f1', '#f5b7b1', '#d5f5e3'][i]!), -0.1 + i * 0.03, 0.8 + i * 0.022, nsZ + 0.12, false);
  for (const x of [-2.25, -1.6, 0.35]) {
    cyl(ns, 0.22, 0.22, 0.06, mat('#34495e'), x, 0.5, nsZ + 0.75, 16);
    cyl(ns, 0.025, 0.025, 0.45, metal, x, 0.25, nsZ + 0.75, 8, false);
  }
  // Wastafel & cairan antiseptik di ujung meja.
  box(ns, 0.5, 0.85, 0.45, white, nsX0 - 0.5, 0.425, nsZ + 0.4);
  box(ns, 0.36, 0.06, 0.3, metal, nsX0 - 0.5, 0.86, nsZ + 0.4, false);
  box(ns, 0.08, 0.2, 0.08, mat('#2e86c1'), nsX0 - 0.5, 1.35, R.z1 - 0.06, false);

  // --- Papan tulis & poster di dinding ---------------------------------------------
  plane(group, 1.6, 0.8, basic('#ffffff', { map: track(whiteboardTexture()) }), R.x0 + 0.012, 1.6, -2.4, Math.PI / 2);
  plane(group, 0.5, 0.7, basic('#ffffff', { map: track(triageTexture()) }), R.x1 - 0.012, 1.55, -0.45, -Math.PI / 2);
  plane(group, 0.5, 0.7, basic('#ffffff', { map: track(posterTexture('ALGORITMA ACLS', ['1. Cek respons', '2. Panggil bantuan', '3. RJP 30:2', '4. Pasang AED', '5. Kejut bila VF/VT', '6. Adrenalin 1 mg', '7. Cari 5H 5T'], '#b03a2e')) }), -6.0, 2.0, R.z0 + 0.012);
  plane(group, 0.5, 0.7, basic('#ffffff', { map: track(posterTexture('CUCI TANGAN', ['5 momen:', 'sebelum kontak', 'sebelum aseptik', 'setelah cairan', 'setelah kontak', 'setelah lingkungan'], '#2e86c1')) }), nsX0 - 0.5, 1.75, R.z1 - 0.012, Math.PI);

  // --- Jam dinding (jam permainan) ------------------------------------------------------
  const clock = new Group();
  clock.position.set(-0.6, 2.45, R.z0 + 0.03);
  group.add(clock);
  const face = new Mesh(track(new CircleGeometry(0.2, 32)), basic('#ffffff', { map: track(clockFaceTexture()) }));
  clock.add(face);
  const rim = new Mesh(track(new TorusGeometry(0.2, 0.015, 8, 32)), black);
  clock.add(rim);
  const hand = (len: number, w: number, color: Material, z: number) => {
    const pivot = new Group();
    pivot.position.z = z;
    const m = new Mesh(boxGeo(w, len, 0.004), color);
    m.position.y = len / 2 - 0.02;
    pivot.add(m);
    clock.add(pivot);
    return pivot;
  };
  const hourHand = hand(0.11, 0.016, black, 0.006);
  const minuteHand = hand(0.16, 0.01, black, 0.009);
  // Jam kedua di dinding kanan (dekat pintu masuk) dihilangkan agar ringan.

  // --- Pintu masuk (pintu geser kaca) + kanopi + ambulans ---------------------------------
  const doorPanels: Mesh[] = [];
  const panelW = E.width / 2;
  for (const s of [-1, 1]) {
    const p = new Mesh(boxGeo(0.04, 2.25, panelW), glass);
    p.position.set(R.x1 + 0.02, 1.13, E.z + s * panelW / 2);
    p.userData.base = E.z + s * panelW / 2;
    p.userData.dir = s;
    group.add(p);
    doorPanels.push(p);
    box(group, 0.05, 2.25, 0.04, metal, R.x1 + 0.02, 1.13, E.z + s * (panelW - 0.02), false);
  }
  box(group, 0.12, 0.08, E.width + 0.2, metal, R.x1 + 0.02, 2.29, E.z, false);
  // Tanda IGD (dalam & luar).
  sign('INSTALASI GAWAT DARURAT', 2.0, 0.34, R.x1 - 0.02, 2.62, E.z, -Math.PI / 2, '#c0392b');
  sign('IGD 24 JAM', 1.6, 0.4, R.x1 + 0.14, 2.62, E.z, Math.PI / 2, '#c0392b');
  // Halaman luar (aspal), kanopi, dinding luar.
  const outside = new Mesh(track(new PlaneGeometry(8, 9)), mat('#6b7177', { roughness: 0.95 }));
  outside.rotation.x = -Math.PI / 2;
  outside.position.set(R.x1 + 4, -0.005, E.z);
  add(group, outside, false, true);
  box(group, 3.4, 0.12, 4.2, white, R.x1 + 1.7, 3.0, E.z, false);
  cyl(group, 0.08, 0.08, 3.0, metal, R.x1 + 3.2, 1.5, E.z - 1.9, 10);
  cyl(group, 0.08, 0.08, 3.0, metal, R.x1 + 3.2, 1.5, E.z + 1.9, 10);
  plane(group, 9, 5, mat('#cfdde3', { roughness: 1 }), R.x1 + 7.5, 2.4, E.z, -Math.PI / 2);
  // Ambulans (kotak sederhana, pintu belakang menghadap pintu IGD).
  const amb = new Group();
  amb.position.set(R.x1 + 4.6, 0, E.z + 0.2);
  group.add(amb);
  const ambSide = track(ambulanceSideTexture());
  const ambWhite = mat('#f7f7f4', { roughness: 0.5 });
  box(amb, 3.6, 1.75, 1.9, ambWhite, 0.3, 1.3, 0);
  plane(amb, 3.6, 1.35, mat('#ffffff', { map: ambSide, roughness: 0.5 }), 0.3, 1.25, 0.952);
  plane(amb, 3.6, 1.35, mat('#ffffff', { map: ambSide, roughness: 0.5 }), 0.3, 1.25, -0.952, Math.PI);
  box(amb, 1.2, 1.25, 1.85, ambWhite, 2.6, 1.05, 0);
  box(amb, 0.05, 0.55, 1.6, mat('#2c3e50', { roughness: 0.1, metalness: 0.4 }), 3.2, 1.4, 0, false);
  box(amb, 0.04, 1.5, 0.9, mat('#e6e6e2'), -1.52, 1.25, -0.46, false);
  box(amb, 0.04, 1.5, 0.9, mat('#e6e6e2'), -1.52, 1.25, 0.46, false);
  for (const wx of [-1.0, 2.4]) for (const wz of [-0.9, 0.9]) cyl(amb, 0.36, 0.36, 0.24, black, wx, 0.36, wz, 18).rotation.x = Math.PI / 2;
  const lightBar: Mesh[] = [];
  const sirenRed = mat('#ff2a2a', { emissive: '#ff0000', emissiveIntensity: 0, roughness: 0.3 });
  const sirenBlue = mat('#2a6bff', { emissive: '#0040ff', emissiveIntensity: 0, roughness: 0.3 });
  for (const [i, m] of [sirenRed, sirenBlue].entries()) {
    const lb = box(amb, 0.22, 0.12, 0.6, m, 2.4, 1.74, (i - 0.5) * 0.64, false);
    lightBar.push(lb);
  }
  const sirenLight = new PointLight('#ff3030', 0, 7, 2);
  sirenLight.position.set(R.x1 + 4.6 + 2.4, 2.2, E.z + 0.2);
  group.add(sirenLight);

  // --- Area triase & tunggu (dinding kanan) ------------------------------------------------
  // Meja triase (di sudut depan dekat pintu masuk).
  box(group, 0.9, 0.76, 0.5, counterMat, 5.75, 0.38, 3.08);
  box(group, 0.2, 0.14, 0.16, white, 5.6, 0.83, 3.05, false);
  box(group, 0.12, 0.1, 0.03, mat('#2c3e50'), 5.95, 0.86, 3.0, false);
  // Kursi tunggu (rangka besi + dudukan biru).
  for (const w of L.waiting) {
    box(group, 0.48, 0.05, 0.46, mat('#2f6ea8', { roughness: 0.6 }), w.x, 0.45, w.z);
    box(group, 0.06, 0.48, 0.46, mat('#2f6ea8', { roughness: 0.6 }), w.x + 0.24, 0.7, w.z);
    box(group, 0.4, 0.42, 0.04, darkMetal, w.x, 0.21, w.z, false);
  }
  sign('TRIASE', 0.9, 0.25, 5.75, 2.0, R.z1 - 0.015, Math.PI, '#c0392b');

  // --- Brankar & kursi roda cadangan (dekat pintu masuk) -------------------------------
  box(group, 1.9, 0.06, 0.62, mat('#e8c33a', { roughness: 0.5 }), -4.5, 0.62, 3.0);
  box(group, 1.85, 0.08, 0.6, black, -4.5, 0.68, 3.0, false);
  cyl(group, 0.05, 0.05, 0.6, metal, -5.05, 0.3, 3.0, 8, false);
  cyl(group, 0.05, 0.05, 0.6, metal, -3.95, 0.3, 3.0, 8, false);
  // Kursi roda cadangan di dekat pintu masuk.
  box(group, 0.46, 0.05, 0.44, mat('#24324a'), 5.9, 0.48, 2.95);
  box(group, 0.46, 0.45, 0.04, mat('#24324a'), 5.9, 0.72, 3.18);
  for (const s of [-1, 1]) {
    const wheel = new Mesh(track(new TorusGeometry(0.28, 0.022, 8, 20)), black);
    wheel.position.set(5.9 + s * 0.27, 0.3, 3.0);
    wheel.rotation.y = Math.PI / 2;
    group.add(wheel);
  }

  // --- Pintu keluar (radiologi/rawat inap) -------------------------------------------
  const exitPanels: Group[] = [];
  for (const s of [-1, 1]) {
    const pivot = new Group();
    pivot.position.set(R.x0 + 0.03, 0, X.z + s * X.width / 2);
    group.add(pivot);
    const leaf = new Mesh(boxGeo(0.05, 2.1, X.width / 2 - 0.02), mat('#d5dde0', { roughness: 0.6 }));
    leaf.position.set(0, 1.05, -s * (X.width / 4));
    leaf.castShadow = options.shadows;
    pivot.add(leaf);
    const win = new Mesh(boxGeo(0.06, 0.4, 0.3), glass);
    win.position.set(0, 1.5, -s * (X.width / 4));
    pivot.add(win);
    pivot.userData.dir = s;
    exitPanels.push(pivot);
  }
  sign('RADIOLOGI · RAWAT INAP · OK', 1.8, 0.28, R.x0 + 0.015, 2.42, X.z, Math.PI / 2, '#2c3e50');
  // Lorong di balik pintu keluar.
  const hall = new Mesh(track(new PlaneGeometry(3, 3)), mat('#cfd6d2', { roughness: 0.6 }));
  hall.rotation.x = -Math.PI / 2;
  hall.position.set(R.x0 - 1.5, -0.004, X.z);
  add(group, hall, false, true);
  plane(group, 3, 3, mat('#e8ece8', { roughness: 1 }), R.x0 - 3, 1.5, X.z, Math.PI / 2);
  const hallLight = new PointLight('#fff4e0', 3, 5, 1.8);
  hallLight.position.set(R.x0 - 1.3, 2.4, X.z);
  group.add(hallLight);

  // --- Rak persediaan di dinding kiri ------------------------------------------------
  box(group, 0.45, 1.9, 1.4, white, R.x0 + 0.24, 0.95, 2.4);
  for (let i = 0; i < 4; i++) {
    box(group, 0.4, 0.02, 1.36, metal, R.x0 + 0.26, 0.4 + i * 0.42, 2.4, false);
    for (let j = 0; j < 5; j++) box(group, 0.2, 0.14, 0.2, mat(['#aed6f1', '#f9e79f', '#d2b4de', '#a9dfbf', '#f5cba7'][(i + j) % 5]!), R.x0 + 0.3, 0.49 + i * 0.42, 1.9 + j * 0.25, false);
  }
  // Tempat sampah medis (kuning) & umum (hitam) di dekat meja perawat.
  cyl(group, 0.17, 0.15, 0.55, yellow, 1.45, 0.275, 3.0, 14);
  cyl(group, 0.17, 0.15, 0.55, black, 1.85, 0.275, 3.0, 14);
  // Tabung oksigen portabel.
  cyl(group, 0.09, 0.09, 1.1, green, 2.35, 0.55, 3.05, 14);

  // --- Pencahayaan ------------------------------------------------------------
  const hemi = new HemisphereLight('#f6fbff', '#7c8488', 1.05);
  group.add(hemi);
  const key = new DirectionalLight('#ffffff', 1.6);
  key.position.set(2.5, 6.5, 3.5);
  key.target.position.set(-1.2, 0, -2.6);
  group.add(key, key.target);
  key.castShadow = options.shadows;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -8;
  key.shadow.camera.right = 8;
  key.shadow.camera.top = 6;
  key.shadow.camera.bottom = -6;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 18;
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.04;
  for (const [x, z] of [
    [-4.3, -2.9],
    [0.2, -2.9],
    [4.2, -2.4],
    [-1.0, 1.4],
  ] as const) {
    const l = new PointLight('#fff9f0', 3.2, 7.5, 1.6);
    l.position.set(x, R.h - 0.25, z);
    group.add(l);
  }

  let doorOpen = 0;
  let exitOpen = 0;
  let siren = false;
  let flashT = 0;
  let flashBay: string | null = null;
  return {
    group,
    bays,
    central,
    hitTargets,
    setDoor(open: number) {
      this.setEntrance(open);
    },
    setEntrance(open: number) {
      doorOpen = Math.max(0, Math.min(1, open));
      for (const p of doorPanels) p.position.z = (p.userData.base as number) + (p.userData.dir as number) * doorOpen * (panelW - 0.06);
    },
    setExitDoor(open: number) {
      exitOpen = Math.max(0, Math.min(1, open));
      for (const p of exitPanels) p.rotation.y = (p.userData.dir as number) * exitOpen * 1.45;
    },
    setClock(minutes: number) {
      const m = minutes % 60;
      const h = (minutes / 60) % 12;
      minuteHand.rotation.z = -(m / 60) * Math.PI * 2;
      hourHand.rotation.z = -(h / 12) * Math.PI * 2;
    },
    setSiren(on: boolean) {
      siren = on;
      if (!on) {
        sirenRed.emissiveIntensity = 0;
        sirenBlue.emissiveIntensity = 0;
        sirenLight.intensity = 0;
      }
    },
    flash(bayId: string) {
      flashBay = bayId;
      flashT = 0.35;
    },
    setShadows(enabled: boolean) {
      key.castShadow = enabled;
    },
    update(dt: number, time: number) {
      for (const u of bayUpdaters) u(dt);
      if (siren) {
        const ph = Math.floor(time * 3) % 2;
        sirenRed.emissiveIntensity = ph ? 2.2 : 0.1;
        sirenBlue.emissiveIntensity = ph ? 0.1 : 2.2;
        sirenLight.color.set(ph ? '#ff3030' : '#3050ff');
        sirenLight.intensity = 6;
      }
      if (flashT > 0) {
        flashT -= dt;
        for (const l of flashLights) l.intensity = l.name === `flash-${flashBay}` ? Math.max(0, flashT / 0.35) * 18 : 0;
      }
    },
    dispose() {
      for (const d of disposables) d.dispose();
      group.clear();
    },
  };
}
