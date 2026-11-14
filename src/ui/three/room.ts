/**
 * Ruang praktik dokter (prosedural, low-poly): meja dokter di depan kamera, kursi pasien,
 * pintu masuk, lemari alat, tempat tidur periksa, jendela, jam, kipas, dan perlengkapan.
 *
 * Sistem koordinat (meter): Y ke atas; dokter duduk di z ≈ +0.95 menghadap −Z;
 * kursi pasien di z ≈ −1.05; pintu di dinding belakang (z = −3.4) sebelah kanan.
 */
import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  type Object3D,
  PlaneGeometry,
  PointLight,
  Points,
  PointsMaterial,
  SphereGeometry,
  type Texture,
  TorusGeometry,
  Vector3,
} from 'three';
import {
  anatomyPosterTexture,
  calendarTexture,
  clockTexture,
  floorTexture,
  formTexture,
  hygienePosterTexture,
  signTexture,
  snellenTexture,
  wallTexture,
  windowTexture,
  woodTexture,
} from './textures';

/** Titik-titik penting tata letak, dipakai kamera & animasi pasien. */
export const LAYOUT = {
  eye: new Vector3(0, 1.2, 0.95),
  seat: { x: 0, z: -1.05, y: 0.45 },
  /** Tempat pasien berdiri tepat di depan kursi (sebelum duduk / setelah berdiri). */
  stand: new Vector3(0, 0, -0.68),
  door: { x: 1.5, z: -3.4, hingeX: 1.95, width: 0.9, height: 2.05 },
  /** Jalur masuk: lorong → ambang pintu → samping kursi → depan kursi. */
  pathIn: [new Vector3(1.5, 0, -4.35), new Vector3(1.5, 0, -3.1), new Vector3(1.32, 0, -2.45), new Vector3(0.74, 0, -1.2), new Vector3(0.3, 0, -0.7), new Vector3(0, 0, -0.68)],
  desk: { top: 0.74, x0: -0.85, x1: 0.85, z0: -0.12, z1: 0.62 },
  /** Objek yang bisa diketuk di ruangan (posisi label). */
  hotspots: {
    vitals: new Vector3(-0.5, 0.86, 0.12),
    scale: new Vector3(1.86, 0.55, -1.25),
    bed: new Vector3(-1.85, 0.95, -2.2),
    cabinet: new Vector3(-1.05, 1.55, -3.1),
  },
} as const;

const ROOM = { x0: -2.3, x1: 2.3, z0: -3.4, z1: 1.9, h: 2.75 };

export interface Room {
  group: Group;
  /** 0 = tertutup, 1 = terbuka penuh. */
  setDoor(open: number): void;
  update(dt: number, time: number): void;
  setShadows(enabled: boolean): void;
  dispose(): void;
}

export function buildRoom(options: { shadows: boolean }): Room {
  const group = new Group();
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(x: T): T => {
    disposables.push(x);
    return x;
  };
  const mat = (color: string | number, extra: Partial<{ roughness: number; metalness: number; map: Texture; emissive: number | string; emissiveIntensity: number; transparent: boolean; opacity: number; side: typeof DoubleSide }> = {}) =>
    track(new MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...extra }));

  const add = (parent: Object3D, mesh: Mesh, cast = true, receive = true): Mesh => {
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    parent.add(mesh);
    return mesh;
  };
  const box = (parent: Object3D, w: number, h: number, d: number, m: Material, x: number, y: number, z: number, cast = true): Mesh => {
    const mesh = new Mesh(track(new BoxGeometry(w, h, d)), m);
    mesh.position.set(x, y, z);
    return add(parent, mesh, cast);
  };
  const cyl = (parent: Object3D, rTop: number, rBot: number, h: number, m: Material, x: number, y: number, z: number, seg = 16, cast = true): Mesh => {
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

  // --- Material bersama ----------------------------------------------------------
  const woodDark = mat('#ffffff', { map: track(woodTexture('#8a5f3a', '#5e3d22')), roughness: 0.65 });
  const white = mat('#f4f3ef', { roughness: 0.7 });
  const metal = mat('#b9c0c6', { roughness: 0.35, metalness: 0.7 });
  const darkMetal = mat('#4a5157', { roughness: 0.5, metalness: 0.5 });
  const black = mat('#22262b', { roughness: 0.6 });
  const teal = mat('#2f6f73', { roughness: 0.75 });
  const cushion = mat('#35506e', { roughness: 0.9 });

  // --- Lantai, dinding, plafon ------------------------------------------------------
  const floorTex = track(floorTexture());
  floorTex.repeat.set((ROOM.x1 - ROOM.x0) / 0.6, (ROOM.z1 - ROOM.z0 + 2) / 0.6);
  const floor = new Mesh(track(new PlaneGeometry(ROOM.x1 - ROOM.x0, ROOM.z1 - ROOM.z0 + 2)), mat('#ffffff', { map: floorTex, roughness: 0.55 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, (ROOM.z0 + ROOM.z1) / 2 - 1);
  add(group, floor, false, true);

  const wallTex = track(wallTexture());
  const wallMat = (len: number) => {
    const t = track(wallTex.clone());
    t.repeat.set(len, 1);
    t.needsUpdate = true;
    return mat('#ffffff', { map: t, roughness: 0.95 });
  };
  const D = LAYOUT.door;
  const doorL = D.hingeX - D.width;
  // Dinding belakang (dengan bukaan pintu).
  const backLeft = box(group, doorL - ROOM.x0, ROOM.h, 0.1, wallMat(doorL - ROOM.x0), (ROOM.x0 + doorL) / 2, ROOM.h / 2, ROOM.z0 - 0.05, false);
  backLeft.receiveShadow = true;
  box(group, ROOM.x1 - D.hingeX, ROOM.h, 0.1, wallMat(ROOM.x1 - D.hingeX), (D.hingeX + ROOM.x1) / 2, ROOM.h / 2, ROOM.z0 - 0.05, false);
  box(group, D.width, ROOM.h - D.height, 0.1, mat('#f1ebdf', { roughness: 0.95 }), (doorL + D.hingeX) / 2, (ROOM.h + D.height) / 2, ROOM.z0 - 0.05, false);
  // Dinding kiri, kanan, dan di belakang dokter.
  const sideLen = ROOM.z1 - ROOM.z0;
  plane(group, sideLen, ROOM.h, wallMat(sideLen), ROOM.x0, ROOM.h / 2, (ROOM.z0 + ROOM.z1) / 2, Math.PI / 2).receiveShadow = true;
  plane(group, sideLen, ROOM.h, wallMat(sideLen), ROOM.x1, ROOM.h / 2, (ROOM.z0 + ROOM.z1) / 2, -Math.PI / 2).receiveShadow = true;
  plane(group, ROOM.x1 - ROOM.x0, ROOM.h, wallMat(ROOM.x1 - ROOM.x0), 0, ROOM.h / 2, ROOM.z1, Math.PI);
  const ceiling = new Mesh(track(new PlaneGeometry(ROOM.x1 - ROOM.x0, sideLen)), mat('#f7f6f2', { roughness: 1 }));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, ROOM.h, (ROOM.z0 + ROOM.z1) / 2);
  group.add(ceiling);
  // Lampu panel LED di plafon.
  const ledMat = track(new MeshBasicMaterial({ color: '#fffdf5' }));
  for (const z of [-2.1, -0.3]) {
    box(group, 1.2, 0.03, 0.32, mat('#d7d9da'), 0, ROOM.h - 0.015, z, false);
    const led = new Mesh(track(new PlaneGeometry(1.12, 0.26)), ledMat);
    led.rotation.x = Math.PI / 2;
    led.position.set(0, ROOM.h - 0.032, z);
    group.add(led);
  }

  // --- Lorong di balik pintu ------------------------------------------------------
  const hallMat = mat('#e9e2d2', { roughness: 0.95 });
  box(group, 2.2, ROOM.h, 0.1, hallMat, D.x, ROOM.h / 2, ROOM.z0 - 1.75, false);
  box(group, 0.1, ROOM.h, 1.7, hallMat, D.x - 1.1, ROOM.h / 2, ROOM.z0 - 0.9, false);
  box(group, 0.1, ROOM.h, 1.7, hallMat, D.x + 1.1, ROOM.h / 2, ROOM.z0 - 0.9, false);
  box(group, 2.2, 0.1, 1.7, mat('#f2f0ea'), D.x, ROOM.h + 0.05, ROOM.z0 - 0.9, false);
  // Bangku tunggu & poster di lorong (terlihat saat pintu terbuka).
  box(group, 1.1, 0.06, 0.36, teal, D.x - 0.2, 0.44, ROOM.z0 - 1.5);
  box(group, 1.1, 0.4, 0.05, teal, D.x - 0.2, 0.72, ROOM.z0 - 1.66);
  for (const dx of [-0.65, 0.25]) cyl(group, 0.02, 0.02, 0.44, metal, D.x + dx, 0.22, ROOM.z0 - 1.5, 8);
  plane(group, 0.5, 0.62, track(new MeshBasicMaterial({ map: track(hygienePosterTexture()) })), D.x + 0.55, 1.5, ROOM.z0 - 1.69);
  const hallLight = new PointLight('#fff2d9', 5, 6, 1.8);
  hallLight.position.set(D.x, 2.3, ROOM.z0 - 0.9);
  group.add(hallLight);

  // --- Pintu ------------------------------------------------------------
  const frameMat = mat('#8a6a48', { roughness: 0.7 });
  box(group, 0.07, D.height + 0.07, 0.16, frameMat, doorL - 0.035, (D.height + 0.07) / 2, ROOM.z0 - 0.02);
  box(group, 0.07, D.height + 0.07, 0.16, frameMat, D.hingeX + 0.035, (D.height + 0.07) / 2, ROOM.z0 - 0.02);
  box(group, D.width + 0.14, 0.07, 0.16, frameMat, (doorL + D.hingeX) / 2, D.height + 0.035, ROOM.z0 - 0.02);
  const doorPivot = new Group();
  doorPivot.position.set(D.hingeX, 0, ROOM.z0 + 0.02);
  group.add(doorPivot);
  box(doorPivot, D.width, D.height, 0.045, woodDark, -D.width / 2, D.height / 2, 0);
  box(doorPivot, D.width * 0.62, 0.5, 0.05, mat('#9a7350', { roughness: 0.6 }), -D.width / 2, 1.45, 0.002, false);
  box(doorPivot, D.width * 0.62, 0.62, 0.05, mat('#9a7350', { roughness: 0.6 }), -D.width / 2, 0.55, 0.002, false);
  // Gagang pintu (dua sisi).
  for (const z of [0.045, -0.045]) {
    cyl(doorPivot, 0.012, 0.012, 0.11, metal, -D.width + 0.11, 1.02, z, 8).rotation.z = Math.PI / 2;
    cyl(doorPivot, 0.02, 0.02, 0.03, metal, -D.width + 0.07, 1.02, z * 0.7, 10).rotation.x = Math.PI / 2;
  }
  const sign = new Mesh(track(new PlaneGeometry(0.62, 0.15)), track(new MeshBasicMaterial({ map: track(signTexture('RUANG PERIKSA')) })));
  sign.position.set((doorL + D.hingeX) / 2, D.height + 0.2, ROOM.z0 + 0.012);
  group.add(sign);

  // --- Jendela (dinding kiri) + kerai ------------------------------------------------
  const winZ = -1.15;
  const winW = 1.5;
  const win = new Mesh(track(new PlaneGeometry(winW, 1.15)), track(new MeshBasicMaterial({ map: track(windowTexture()) })));
  win.rotation.y = Math.PI / 2;
  win.position.set(ROOM.x0 + 0.012, 1.58, winZ);
  group.add(win);
  const frameW = mat('#f5f5f2', { roughness: 0.6 });
  box(group, 0.05, 0.06, winW + 0.12, frameW, ROOM.x0 + 0.03, 2.185, winZ, false);
  box(group, 0.09, 0.05, winW + 0.16, frameW, ROOM.x0 + 0.05, 0.98, winZ, false);
  for (const dz of [-winW / 2 - 0.03, 0, winW / 2 + 0.03]) box(group, 0.05, 1.2, 0.05, frameW, ROOM.x0 + 0.03, 1.58, winZ + dz, false);
  // Kerai (bilah mendatar, setengah terbuka) — bergoyang halus.
  const blinds = new Group();
  blinds.position.set(ROOM.x0 + 0.07, 2.14, winZ);
  group.add(blinds);
  const slatMat = mat('#eef0ee', { roughness: 0.7, side: DoubleSide });
  const slatGeo = track(new BoxGeometry(0.035, 0.004, winW + 0.04));
  for (let i = 0; i < 9; i++) {
    const slat = new Mesh(slatGeo, slatMat);
    slat.position.y = -0.03 - i * 0.045;
    slat.rotation.z = -0.5;
    blinds.add(slat);
  }

  // --- Meja dokter & perlengkapan (latar depan) ------------------------------------
  const K = LAYOUT.desk;
  const deskW = K.x1 - K.x0;
  const deskD = K.z1 - K.z0;
  const deskTex = track(woodTexture());
  deskTex.repeat.set(2, 1);
  const deskTop = box(group, deskW, 0.04, deskD, mat('#ffffff', { map: deskTex, roughness: 0.45 }), 0, K.top - 0.02, (K.z0 + K.z1) / 2);
  deskTop.receiveShadow = true;
  box(group, deskW - 0.08, K.top - 0.1, 0.03, woodDark, 0, (K.top - 0.1) / 2 + 0.06, K.z0 + 0.06);
  for (const x of [K.x0 + 0.04, K.x1 - 0.04]) box(group, 0.04, K.top - 0.04, deskD - 0.08, woodDark, x, (K.top - 0.04) / 2, (K.z0 + K.z1) / 2);
  const dy = K.top;
  // Papan klip + formulir + pena.
  const clip = new Group();
  clip.position.set(-0.18, dy + 0.006, 0.36);
  clip.rotation.y = 0.12;
  group.add(clip);
  box(clip, 0.24, 0.008, 0.33, mat('#6b4a2f'), 0, 0, 0);
  const paper = new Mesh(track(new PlaneGeometry(0.21, 0.29)), mat('#ffffff', { map: track(formTexture()), roughness: 0.9 }));
  paper.rotation.x = -Math.PI / 2;
  paper.position.set(0, 0.006, 0.005);
  paper.receiveShadow = true;
  clip.add(paper);
  box(clip, 0.09, 0.012, 0.025, metal, 0, 0.012, -0.15);
  cyl(group, 0.005, 0.005, 0.14, mat('#1f4f8f'), 0.0, dy + 0.008, 0.42, 8).rotation.set(Math.PI / 2, 0, 0.5);
  // Keyboard & mouse.
  box(group, 0.36, 0.018, 0.12, black, 0.36, dy + 0.009, 0.44);
  box(group, 0.33, 0.004, 0.095, mat('#3a4047'), 0.36, dy + 0.02, 0.44, false);
  const mouse = new Mesh(track(new SphereGeometry(0.03, 12, 8)), black);
  mouse.scale.set(1, 0.5, 1.5);
  mouse.position.set(0.63, dy + 0.012, 0.46);
  add(group, mouse);
  // Stetoskop.
  const steth = new Group();
  steth.position.set(-0.52, dy + 0.012, 0.4);
  steth.rotation.y = -0.5;
  group.add(steth);
  const tube = new Mesh(track(new TorusGeometry(0.075, 0.006, 8, 28, Math.PI * 1.55)), black);
  tube.rotation.x = Math.PI / 2;
  add(steth, tube);
  cyl(steth, 0.022, 0.022, 0.012, metal, 0.075, 0, 0.0, 14);
  const ears = new Mesh(track(new TorusGeometry(0.045, 0.004, 6, 16, Math.PI)), metal);
  ears.rotation.x = Math.PI / 2;
  ears.position.set(-0.06, 0, -0.07);
  add(steth, ears);
  // Tensimeter digital + manset, termometer, oksimeter (paket tanda vital).
  const vit = new Group();
  vit.position.set(-0.5, dy, 0.1);
  vit.rotation.y = 0.35;
  group.add(vit);
  box(vit, 0.13, 0.07, 0.1, white, 0, 0.035, 0);
  const lcd = new Mesh(track(new PlaneGeometry(0.085, 0.045)), track(new MeshBasicMaterial({ color: '#a8d5c0' })));
  lcd.position.set(0, 0.045, 0.051);
  vit.add(lcd);
  const cuff = cyl(vit, 0.045, 0.045, 0.12, mat('#3d5a80', { roughness: 0.95 }), 0.15, 0.045, 0.0, 14);
  cuff.rotation.z = Math.PI / 2;
  box(vit, 0.03, 0.02, 0.11, white, -0.12, 0.012, 0.03);
  box(vit, 0.035, 0.03, 0.055, mat('#e9eef2'), -0.12, 0.016, -0.08);
  // Hand sanitizer, tisu, tempat pena, kalender, tanaman.
  cyl(group, 0.028, 0.03, 0.12, mat('#cfe9f5', { transparent: true, opacity: 0.85, roughness: 0.2 }), -0.74, dy + 0.06, 0.02, 12);
  cyl(group, 0.012, 0.014, 0.035, white, -0.74, dy + 0.137, 0.02, 8);
  box(group, 0.2, 0.07, 0.11, mat('#8fb7d9'), 0.62, dy + 0.035, 0.0);
  box(group, 0.07, 0.03, 0.02, white, 0.62, dy + 0.085, 0.0, false);
  cyl(group, 0.035, 0.03, 0.09, darkMetal, 0.36, dy + 0.045, -0.02, 12);
  for (const [dx, dz, c] of [[-0.012, 0, '#c0392b'], [0.012, 0.008, '#1f4f8f'], [0, -0.012, '#222']] as const) {
    cyl(group, 0.004, 0.004, 0.13, mat(c), 0.36 + dx, dy + 0.11, -0.02 + dz, 6).rotation.z = dx * 6;
  }
  const cal = new Group();
  cal.position.set(0.12, dy, -0.03);
  cal.rotation.y = 0.15;
  group.add(cal);
  const calFace = new Mesh(track(new PlaneGeometry(0.1, 0.1)), mat('#ffffff', { map: track(calendarTexture(new Date())), roughness: 0.8 }));
  calFace.position.set(0, 0.06, 0.012);
  calFace.rotation.x = -0.28;
  cal.add(calFace);
  box(cal, 0.11, 0.11, 0.008, white, 0, 0.058, 0.0).rotation.x = -0.28;
  // Tanaman kecil — daunnya bergoyang pelan.
  const plant = new Group();
  plant.position.set(-0.72, dy, 0.38);
  group.add(plant);
  cyl(plant, 0.05, 0.038, 0.075, mat('#c7693f', { roughness: 0.9 }), 0, 0.0375, 0, 14);
  const leafMat = mat('#3f8f4f', { roughness: 0.8, side: DoubleSide });
  const leafGeo = track(new SphereGeometry(0.05, 8, 6));
  const leaves: Mesh[] = [];
  for (let i = 0; i < 7; i++) {
    const leaf = new Mesh(leafGeo, leafMat);
    const a = (i / 7) * Math.PI * 2;
    leaf.scale.set(0.42, 1.25, 0.14);
    leaf.position.set(Math.cos(a) * 0.035, 0.12 + (i % 3) * 0.022, Math.sin(a) * 0.035);
    leaf.rotation.set(Math.sin(a) * 0.55, a, -Math.cos(a) * 0.55);
    add(plant, leaf);
    leaves.push(leaf);
  }

  // --- Kursi pasien & kursi pendamping ------------------------------------------------
  const makeChair = (x: number, z: number, rotY: number) => {
    const chair = new Group();
    chair.position.set(x, 0, z);
    chair.rotation.y = rotY;
    group.add(chair);
    const S = LAYOUT.seat.y;
    box(chair, 0.46, 0.06, 0.44, cushion, 0, S - 0.03, 0);
    box(chair, 0.44, 0.42, 0.05, cushion, 0, S + 0.3, -0.215);
    for (const [lx, lz] of [[-0.2, -0.19], [0.2, -0.19], [-0.2, 0.19], [0.2, 0.19]] as const) {
      cyl(chair, 0.015, 0.015, S - 0.06, darkMetal, lx, (S - 0.06) / 2, lz, 8);
    }
    for (const lx of [-0.2, 0.2]) cyl(chair, 0.013, 0.013, 0.5, darkMetal, lx, S + 0.2, -0.2, 8);
    return chair;
  };
  makeChair(LAYOUT.seat.x, LAYOUT.seat.z, 0);
  makeChair(-0.98, -1.42, 0.38);

  // --- Lemari alat/obat (dinding belakang kiri) ------------------------------------
  const cab = new Group();
  cab.position.set(-1.05, 0, ROOM.z0 + 0.22);
  group.add(cab);
  // Bagian bawah tertutup; bagian atas berongga (rak kaca) agar isi lemari terlihat.
  box(cab, 1.0, 0.95, 0.4, white, 0, 0.475, 0);
  box(cab, 1.0, 0.95, 0.02, mat('#dfe8ec', { roughness: 0.9 }), 0, 1.425, -0.19, false);
  box(cab, 0.03, 0.95, 0.4, white, -0.485, 1.425, 0);
  box(cab, 0.03, 0.95, 0.4, white, 0.485, 1.425, 0);
  box(cab, 1.0, 0.03, 0.4, white, 0, 1.885, 0);
  box(cab, 0.94, 0.9, 0.02, mat('#e3e8ea'), 0, 0.5, 0.2, false);
  const glass = mat('#d9eef4', { transparent: true, opacity: 0.16, roughness: 0.08 });
  for (const gx of [-0.235, 0.235]) box(cab, 0.455, 0.9, 0.01, glass, gx, 1.425, 0.196, false).castShadow = false;
  for (const fx of [-0.47, 0, 0.47]) box(cab, 0.025, 0.92, 0.025, white, fx, 1.425, 0.196, false);
  for (const y of [1.25, 1.55]) box(cab, 0.94, 0.015, 0.36, mat('#eef1f3'), 0, y, 0, false);
  const boxColors = ['#d9534f', '#f0ad4e', '#5bc0de', '#5cb85c', '#ffffff', '#8e6bb0', '#e8e2d0'];
  let ci = 0;
  for (const y of [0.96, 1.26, 1.56]) {
    for (let x = -0.38; x < 0.4; x += 0.13 + (ci % 3) * 0.02) {
      const h = 0.1 + ((ci * 37) % 9) / 100;
      if (ci % 4 === 3) cyl(cab, 0.03, 0.03, h, mat(boxColors[ci % boxColors.length]!), x, y + h / 2, 0.04, 10, false);
      else box(cab, 0.09, h, 0.12, mat(boxColors[ci % boxColors.length]!), x, y + h / 2, 0.04, false);
      ci++;
    }
  }
  // Palang hijau di pintu bawah lemari.
  box(cab, 0.14, 0.045, 0.004, mat('#2e8b57'), 0, 0.55, 0.213, false);
  box(cab, 0.045, 0.14, 0.004, mat('#2e8b57'), 0, 0.55, 0.213, false);
  for (const x of [-0.06, 0.06]) box(cab, 0.012, 0.12, 0.02, metal, x * 0.4, 0.82, 0.215, false);

  // --- Tempat tidur periksa (dinding kiri belakang) + tirai --------------------------
  const bed = new Group();
  bed.position.set(ROOM.x0 + 0.42, 0, -2.45);
  group.add(bed);
  box(bed, 0.68, 0.1, 1.8, mat('#2f6f73', { roughness: 0.6 }), 0, 0.7, 0);
  box(bed, 0.66, 0.02, 1.1, mat('#f3f3ef', { roughness: 0.95 }), 0, 0.76, 0.3);
  const pillow = new Mesh(track(new SphereGeometry(0.2, 14, 10)), mat('#f7f6f1', { roughness: 0.95 }));
  pillow.scale.set(1.25, 0.32, 0.85);
  pillow.position.set(0, 0.82, -0.66);
  add(bed, pillow);
  for (const [lx, lz] of [[-0.3, -0.82], [0.3, -0.82], [-0.3, 0.82], [0.3, 0.82]] as const) cyl(bed, 0.02, 0.02, 0.66, metal, lx, 0.33, lz, 8);
  box(bed, 0.62, 0.02, 0.02, metal, 0, 0.3, 0.82, false);
  box(bed, 0.62, 0.02, 0.02, metal, 0, 0.3, -0.82, false);
  box(group, 0.36, 0.2, 0.28, mat('#8d99a3', { roughness: 0.6, metalness: 0.3 }), ROOM.x0 + 1.0, 0.1, -2.0);
  // Rel & tirai (terlipat di sisi kepala) — bergoyang halus.
  cyl(group, 0.008, 0.008, 2.0, metal, ROOM.x0 + 0.82, 2.05, -2.45, 6, false).rotation.x = Math.PI / 2;
  const curtain = new Group();
  curtain.position.set(ROOM.x0 + 0.82, 2.04, -3.2);
  group.add(curtain);
  const curtainMat = mat('#9cc7c2', { roughness: 0.95, side: DoubleSide });
  const folds: Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const fold = new Mesh(track(new CylinderGeometry(0.035, 0.045, 1.5, 8)), curtainMat);
    fold.position.set((i % 2) * 0.025, -0.75, i * 0.06);
    add(curtain, fold);
    folds.push(fold);
  }

  // --- Dinding kanan: wastafel, timbangan, kartu Snellen ------------------------------
  const sink = new Group();
  sink.position.set(ROOM.x1 - 0.24, 0, -0.35);
  group.add(sink);
  box(sink, 0.44, 0.8, 0.5, white, 0, 0.4, 0);
  box(sink, 0.46, 0.04, 0.52, mat('#dfe3e6', { roughness: 0.3 }), 0, 0.82, 0);
  const basin = new Mesh(track(new SphereGeometry(0.15, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)), mat('#eef1f3', { roughness: 0.25, side: DoubleSide }));
  basin.scale.set(1, 0.5, 1.2);
  basin.position.set(-0.02, 0.845, 0);
  sink.add(basin);
  cyl(sink, 0.012, 0.012, 0.16, metal, 0.15, 0.92, 0, 8);
  cyl(sink, 0.01, 0.01, 0.1, metal, 0.1, 0.99, 0, 8).rotation.z = Math.PI / 2;
  cyl(sink, 0.03, 0.03, 0.12, mat('#7fc8a9'), 0.14, 0.9, 0.18, 10);
  plane(group, 0.5, 0.62, track(new MeshBasicMaterial({ map: track(hygienePosterTexture()) })), ROOM.x1 - 0.012, 1.55, -0.35, -Math.PI / 2);
  // Timbangan badan + tiang ukur tinggi.
  const scale = new Group();
  scale.position.set(1.86, 0, -1.25);
  group.add(scale);
  box(scale, 0.32, 0.05, 0.4, mat('#e7eaec', { roughness: 0.5 }), 0, 0.025, 0);
  box(scale, 0.26, 0.004, 0.3, black, 0, 0.052, 0.02, false);
  cyl(scale, 0.014, 0.014, 1.75, metal, 0, 0.9, -0.2, 8);
  box(scale, 0.16, 0.012, 0.05, metal, 0, 1.75, -0.14, false);
  const dial = cyl(scale, 0.085, 0.085, 0.03, white, 0, 1.05, -0.17, 18);
  dial.rotation.x = Math.PI / 2 - 0.5;
  plane(group, 0.36, 0.6, track(new MeshBasicMaterial({ map: track(snellenTexture()) })), ROOM.x1 - 0.012, 1.55, -2.05, -Math.PI / 2);

  // --- Dinding belakang: poster anatomi, jam ------------------------------------------
  plane(group, 0.62, 0.93, track(new MeshBasicMaterial({ map: track(anatomyPosterTexture()) })), 0.2, 1.52, ROOM.z0 + 0.012);
  const clock = new Group();
  clock.position.set(-0.05, 2.32, ROOM.z0 + 0.03);
  group.add(clock);
  cyl(clock, 0.15, 0.15, 0.03, black, 0, 0, 0, 28, false).rotation.x = Math.PI / 2;
  const face = new Mesh(track(new CircleGeometry(0.138, 32)), track(new MeshBasicMaterial({ map: track(clockTexture()) })));
  face.position.z = 0.017;
  clock.add(face);
  const hand = (len: number, w: number, color: string) => {
    const pivot = new Group();
    pivot.position.z = 0.02;
    const m = new Mesh(track(new BoxGeometry(w, len, 0.003)), track(new MeshBasicMaterial({ color })));
    m.position.y = len / 2 - 0.012;
    pivot.add(m);
    clock.add(pivot);
    return pivot;
  };
  const hourHand = hand(0.075, 0.011, '#1e2a33');
  const minuteHand = hand(0.108, 0.007, '#1e2a33');
  const secondHand = hand(0.118, 0.003, '#c0392b');
  secondHand.position.z = 0.023;

  // --- Kipas plafon ------------------------------------------------------------
  const fan = new Group();
  fan.position.set(0.25, ROOM.h - 0.28, -1.35);
  group.add(fan);
  cyl(group, 0.012, 0.012, 0.26, darkMetal, 0.25, ROOM.h - 0.13, -1.35, 8, false);
  cyl(fan, 0.07, 0.07, 0.06, white, 0, 0, 0, 14, false);
  const bladeMat = mat('#e9e6df', { roughness: 0.6 });
  for (let i = 0; i < 3; i++) {
    const blade = new Mesh(track(new BoxGeometry(0.62, 0.008, 0.12)), bladeMat);
    blade.position.set(0.36, 0, 0);
    const arm = new Group();
    arm.rotation.y = (i / 3) * Math.PI * 2;
    blade.rotation.x = 0.16;
    arm.add(blade);
    fan.add(arm);
  }

  // --- Tempat sampah & keset ------------------------------------------------------
  cyl(group, 0.13, 0.11, 0.32, mat('#7d8b93', { roughness: 0.5, metalness: 0.3 }), 1.95, 0.16, -2.75, 14);
  const rug = new Mesh(track(new PlaneGeometry(0.8, 0.45)), mat('#6f8f8a', { roughness: 1 }));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(D.x, 0.004, ROOM.z0 + 0.45);
  rug.receiveShadow = true;
  group.add(rug);

  // --- Pencahayaan ------------------------------------------------------------
  const hemi = new HemisphereLight('#fff7ea', '#7f8389', 0.82);
  group.add(hemi);
  const sun = new DirectionalLight('#fff0d2', 2.5);
  sun.position.set(-5.2, 4.3, -0.4);
  sun.target.position.set(0.3, 0.4, -1.3);
  group.add(sun, sun.target);
  sun.castShadow = options.shadows;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -3.4;
  sun.shadow.camera.right = 3.4;
  sun.shadow.camera.top = 3.2;
  sun.shadow.camera.bottom = -3.2;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 14;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  const ceilLight = new PointLight('#fff8ec', 5, 9, 1.6);
  ceilLight.position.set(0, ROOM.h - 0.25, -0.9);
  group.add(ceilLight);
  const fill = new PointLight('#eaf3ff', 2.2, 6, 1.8);
  fill.position.set(0.4, 1.5, 1.2);
  group.add(fill);

  // --- Debu halus di berkas cahaya jendela ------------------------------------------
  const DUST = 46;
  const dustPos = new Float32Array(DUST * 3);
  const dustSeed: number[] = [];
  for (let i = 0; i < DUST; i++) {
    dustPos[i * 3] = ROOM.x0 + 0.2 + Math.random() * 1.7;
    dustPos[i * 3 + 1] = 0.5 + Math.random() * 1.6;
    dustPos[i * 3 + 2] = winZ - 0.8 + Math.random() * 1.6;
    dustSeed.push(Math.random() * 100);
  }
  const dustGeo = track(new BufferGeometry());
  dustGeo.setAttribute('position', new BufferAttribute(dustPos, 3));
  const dust = new Points(dustGeo, track(new PointsMaterial({ color: new Color('#fff6dd'), size: 0.006, transparent: true, opacity: 0.4, blending: AdditiveBlending, depthWrite: false })));
  group.add(dust);

  let doorOpen = 0;
  return {
    group,
    setDoor(open: number) {
      doorOpen = Math.max(0, Math.min(1, open));
      doorPivot.rotation.y = doorOpen * 1.72;
    },
    setShadows(enabled: boolean) {
      sun.castShadow = enabled;
    },
    update(dt: number, time: number) {
      fan.rotation.y += dt * 2.6;
      // Jam dinding mengikuti waktu sebenarnya.
      const now = new Date();
      const sec = now.getSeconds();
      const min = now.getMinutes() + sec / 60;
      const hr = (now.getHours() % 12) + min / 60;
      secondHand.rotation.z = -(sec / 60) * Math.PI * 2;
      minuteHand.rotation.z = -(min / 60) * Math.PI * 2;
      hourHand.rotation.z = -(hr / 12) * Math.PI * 2;
      // Daun, tirai, dan kerai bergoyang pelan (angin dari kipas).
      leaves.forEach((leaf, i) => {
        leaf.rotation.z += Math.sin(time * 1.3 + i * 1.7) * 0.0009;
      });
      folds.forEach((fold, i) => {
        fold.rotation.z = Math.sin(time * 0.7 + i * 0.9) * 0.02;
        fold.rotation.x = Math.sin(time * 0.5 + i * 1.3) * 0.015;
      });
      blinds.rotation.x = Math.sin(time * 0.6) * 0.008;
      const p = dustGeo.getAttribute('position') as BufferAttribute;
      for (let i = 0; i < DUST; i++) {
        const s = dustSeed[i]!;
        p.setY(i, p.getY(i) + Math.sin(time * 0.3 + s) * 0.0004 + 0.00012);
        p.setX(i, p.getX(i) + Math.cos(time * 0.2 + s * 1.3) * 0.0003);
        if (p.getY(i) > 2.2) p.setY(i, 0.5);
      }
      p.needsUpdate = true;
    },
    dispose() {
      for (const d of disposables) d.dispose();
      group.clear();
    },
  };
}
