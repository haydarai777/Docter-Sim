/**
 * Mata 3D: bola mata sungguhan di dalam rongga mata, bukan gambar datar.
 *
 * - Bola mata (Ø ± 24 mm dewasa) bertekstur prosedural: sklera putih kebiruan dengan pembuluh
 *   halus, cincin limbus gelap, iris berserat radial dengan "kolaret", pupil yang ukurannya
 *   bisa diatur (miosis/midriasis/anisokor sesuai kondisi klinis), lapisan kornea basah yang
 *   memantulkan lampu ruangan (catchlight dari peta lingkungan).
 * - Kelopak atas & bawah berupa cangkang kulit yang berputar mengelilingi bola mata (berkedip,
 *   menyipit, terbelalak); tepinya bertemu di sudut mata membentuk celah almond alami.
 * - Garis bulu mata (atas lebih tebal; perempuan lebih lentik), karunkel di sudut dalam.
 * - Sklera ikterik / mata merah mengikuti isyarat klinis.
 */
import {
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  type Material,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
} from 'three';

export interface EyeSpec {
  /** Pusat bola mata kiri (sisi +X) dalam ruang kepala; mata kanan dicerminkan. */
  center: Vector3;
  /** Jari-jari bola mata (m). */
  radius: number;
  /** Warna iris (cokelat tua untuk kebanyakan orang Indonesia). */
  iris: string;
  /** Warna bulu mata. */
  lash: string;
  female: boolean;
  child: boolean;
  /** Kemiringan celah mata (sudut luar lebih tinggi bila positif), radian. */
  tilt: number;
  skin: Material;
  /** Tingkat detail geometri (pasien = tinggi; orang lain yang dilihat dari jauh = standar). */
  detail?: 'tinggi' | 'standar';
}

const DEG = Math.PI / 180;
const IRIS_THETA = 0.54;

/** Tekstur bola mata (ekuirektangular; baris atas = kutub depan). */
function eyeTexture(iris: string, seed: number): CanvasTexture {
  const W = 512;
  const H = 256;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d')!;
  let h = seed >>> 0;
  const rnd = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) + 0x9e3779b9;
    return ((h >>> 8) & 0xffff) / 65535;
  };
  const yOf = (theta: number) => (theta / Math.PI) * H;
  // Sklera: putih sedikit kebiruan di depan, kemerahan/kekuningan ke belakang.
  const scl = g.createLinearGradient(0, yOf(IRIS_THETA), 0, yOf(1.7));
  scl.addColorStop(0, '#f2efe9');
  scl.addColorStop(0.55, '#ece2da');
  scl.addColorStop(1, '#dcc1b5');
  g.fillStyle = scl;
  g.fillRect(0, 0, W, H);
  // Pembuluh darah halus: dari belakang menuju limbus, bercabang & berkelok.
  g.lineCap = 'round';
  for (let i = 0; i < 46; i++) {
    let x = rnd() * W;
    let y = yOf(1.35 + rnd() * 0.3);
    const target = yOf(IRIS_THETA + 0.1 + rnd() * 0.25);
    g.strokeStyle = `rgba(${170 + rnd() * 40},${40 + rnd() * 30},${40 + rnd() * 25},${0.2 + rnd() * 0.32})`;
    g.lineWidth = 0.6 + rnd() * 1.1;
    g.beginPath();
    g.moveTo(x, y);
    while (y > target) {
      x += (rnd() - 0.5) * 9;
      y -= 4 + rnd() * 5;
      g.lineTo(x, y);
      g.lineWidth *= 0.94;
    }
    g.stroke();
  }
  // Iris: serat radial (garis membujur pada tekstur) dengan kolaret lebih terang dekat pupil.
  const base = new Color(iris);
  const css = (c: Color, a = 1) => `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a})`;
  const irisTop = yOf(IRIS_THETA);
  const grad = g.createLinearGradient(0, 0, 0, irisTop);
  grad.addColorStop(0, css(base.clone().multiplyScalar(1.5)));
  grad.addColorStop(0.32, css(base.clone().multiplyScalar(1.25)));
  grad.addColorStop(0.55, css(base));
  grad.addColorStop(0.9, css(base.clone().multiplyScalar(0.62)));
  grad.addColorStop(1, css(base.clone().multiplyScalar(0.3)));
  g.fillStyle = grad;
  g.fillRect(0, 0, W, irisTop);
  for (let i = 0; i < 420; i++) {
    const x = rnd() * W;
    const y0 = rnd() * irisTop * 0.3;
    const y1 = irisTop * (0.55 + rnd() * 0.45);
    const light = rnd() < 0.45;
    g.strokeStyle = light ? css(base.clone().multiplyScalar(1.6 + rnd() * 0.5), 0.18 + rnd() * 0.2) : css(base.clone().multiplyScalar(0.35), 0.2 + rnd() * 0.25);
    g.lineWidth = 0.5 + rnd() * 1.3;
    g.beginPath();
    g.moveTo(x, y0);
    g.bezierCurveTo(x + (rnd() - 0.5) * 8, y0 + (y1 - y0) * 0.4, x + (rnd() - 0.5) * 8, y0 + (y1 - y0) * 0.7, x + (rnd() - 0.5) * 6, y1);
    g.stroke();
  }
  // Kripta (bercak gelap kecil) & cincin limbus.
  for (let i = 0; i < 40; i++) {
    g.fillStyle = css(base.clone().multiplyScalar(0.3), 0.35);
    g.beginPath();
    g.ellipse(rnd() * W, irisTop * (0.35 + rnd() * 0.4), 2 + rnd() * 4, 1.2 + rnd() * 2, 0, 0, Math.PI * 2);
    g.fill();
  }
  const limbus = g.createLinearGradient(0, irisTop - 7, 0, irisTop + 9);
  limbus.addColorStop(0, 'rgba(20,12,8,0)');
  limbus.addColorStop(0.45, 'rgba(20,12,8,0.75)');
  limbus.addColorStop(1, 'rgba(20,12,8,0)');
  g.fillStyle = limbus;
  g.fillRect(0, irisTop - 7, W, 16);
  const tex = new CanvasTexture(cv);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Tekstur alfa bulu mata: helai meruncing berkelompok. */
function lashTexture(): CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 32;
  const g = cv.getContext('2d')!;
  let h = 77;
  const rnd = () => {
    h = Math.imul(h ^ (h >>> 13), 1274126177) + 0x6d2b79f5;
    return ((h >>> 9) & 0xffff) / 65535;
  };
  g.clearRect(0, 0, 256, 32);
  for (let i = 0; i < 150; i++) {
    const x = rnd() * 256;
    const len = 18 + rnd() * 13;
    g.strokeStyle = `rgba(255,255,255,${0.6 + rnd() * 0.4})`;
    g.lineWidth = 1 + rnd() * 1.2;
    g.beginPath();
    g.moveTo(x, 0);
    g.quadraticCurveTo(x + (rnd() - 0.3) * 5, len * 0.5, x + (rnd() - 0.2) * 9, len);
    g.stroke();
  }
  const tex = new CanvasTexture(cv);
  return tex;
}

export class Eyes {
  readonly group = new Group();
  private readonly balls: Mesh[] = [];
  private readonly uppers: Group[] = [];
  private readonly lowers: Group[] = [];
  private readonly disposables: { dispose(): void }[] = [];
  private readonly pupilU = { value: [0.12, 0.12] as number[] };
  private readonly scleraTint = { value: new Color(1, 1, 1) };
  private readonly redness = { value: 0 };
  private readonly thetaU: number;
  private readonly thetaL: number;
  private readonly tilt: number;

  constructor(spec: EyeSpec, seed: number) {
    const r = spec.radius;
    const rl = r * 1.05;
    this.tilt = spec.tilt;
    this.thetaU = 84 * DEG;
    this.thetaL = 82 * DEG;
    const track = <T extends { dispose(): void }>(x: T): T => {
      this.disposables.push(x);
      return x;
    };
    const hi = spec.detail !== 'standar';
    const ballGeo = track(new SphereGeometry(r, hi ? 32 : 18, hi ? 22 : 12));
    ballGeo.rotateX(Math.PI / 2); // kutub +Y → +Z (depan)
    const tex = track(eyeTexture(spec.iris, seed));
    const pupilU = this.pupilU;
    const scleraTint = this.scleraTint;
    const redness = this.redness;
    const makeBall = (index: number) => {
      const m = track(
        new MeshPhysicalMaterial({
          map: tex,
          roughness: 0.32,
          metalness: 0,
          // Lapisan air mata & kornea: pantulan tajam lampu ruangan.
          clearcoat: 0.6,
          clearcoatRoughness: 0.05,
          ior: 1.376,
          specularIntensity: 0.4,
        }),
      );
      m.onBeforeCompile = (shader) => {
        shader.uniforms.uPupil = { value: pupilU.value[index] };
        shader.uniforms.uSclera = scleraTint;
        shader.uniforms.uRed = redness;
        (m.userData as { pupil?: { value: number } }).pupil = shader.uniforms.uPupil as { value: number };
        shader.fragmentShader = shader.fragmentShader
          .replace('void main() {', 'uniform float uPupil;\nuniform vec3 uSclera;\nuniform float uRed;\nvoid main() {')
          .replace(
            '#include <map_fragment>',
            `#include <map_fragment>
            {
              float th = (1.0 - vMapUv.y) * PI;
              // Pupil: lubang hitam bertepi lembut; iris sedikit menggelap di tepi pupil.
              float pupil = 1.0 - smoothstep(uPupil * 0.88, uPupil * 1.06, th);
              diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.006, 0.005, 0.005), pupil);
              // Sklera: ikterik / injeksi konjungtiva (merah) di luar iris.
              float scl = smoothstep(${(IRIS_THETA + 0.02).toFixed(3)}, ${(IRIS_THETA + 0.14).toFixed(3)}, th);
              diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * uSclera, scl);
              diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.78, 0.33, 0.3), scl * uRed * smoothstep(0.65, 1.4, th));
            }`,
          );
      };
      m.customProgramCacheKey = () => 'bola-mata-v1';
      return m;
    };
    const lashMat = track(new MeshStandardMaterial({ color: spec.lash, roughness: 0.65, metalness: 0, alphaMap: track(lashTexture()), transparent: true, alphaTest: 0.35, side: DoubleSide, depthWrite: false }));
    const marginMat = track(new MeshStandardMaterial({ color: new Color(spec.lash).lerp(new Color('#3a2219'), 0.3), roughness: 0.7 }));
    const lowerMarginMat = track(new MeshStandardMaterial({ color: '#b97a6c', roughness: 0.45 }));
    const caruncleMat = track(new MeshPhysicalMaterial({ color: '#d58a80', roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.1 }));
    const lidSeg = hi ? 32 : 18;
    const lidU = track(new SphereGeometry(rl, lidSeg, hi ? 10 : 6, 0, Math.PI * 2, 0, this.thetaU));
    const lidL = track(new SphereGeometry(rl * 0.995, lidSeg, hi ? 10 : 6, 0, Math.PI * 2, 0, this.thetaL));
    lidL.rotateZ(Math.PI); // tudung bawah: sumbu −Y
    const edgeU = rl * Math.sin(this.thetaU);
    const edgeL = rl * 0.995 * Math.sin(this.thetaL);
    const marginU = track(new TorusGeometry(edgeU, 0.0012 * (r / 0.0118), hi ? 6 : 4, hi ? 32 : 18));
    marginU.rotateX(Math.PI / 2);
    marginU.translate(0, rl * Math.cos(this.thetaU), 0);
    const marginL = track(new TorusGeometry(edgeL, 0.0008 * (r / 0.0118), hi ? 6 : 4, hi ? 32 : 18));
    marginL.rotateX(Math.PI / 2);
    marginL.translate(0, -rl * 0.995 * Math.cos(this.thetaL), 0);
    // Bulu mata atas: pita melebar ke luar dari tepi kelopak, hanya di sisi depan.
    const lashLen = (spec.female ? 0.0042 : 0.0032) * (r / 0.0118);
    const lashes = track(new CylinderGeometry(edgeU + lashLen * 0.75, edgeU, lashLen * 0.6, hi ? 24 : 12, 1, true, -1.15, 2.3));
    lashes.translate(0, rl * Math.cos(this.thetaU) - lashLen * 0.3, 0);
    const caruncle = track(new SphereGeometry(r * 0.13, 10, 8));

    for (const sx of [1, -1]) {
      const eye = new Group();
      eye.position.set(sx * spec.center.x, spec.center.y, spec.center.z);
      // Mata sedikit menghadap ke luar (± 6°).
      eye.rotation.y = sx * 6 * DEG;
      const ball = new Mesh(ballGeo, makeBall(sx === 1 ? 0 : 1));
      eye.add(ball);
      this.balls.push(ball);
      const upper = new Group();
      upper.add(new Mesh(lidU, spec.skin), new Mesh(marginU, marginMat), new Mesh(lashes, lashMat));
      const lower = new Group();
      const lowerLid = new Mesh(lidL, spec.skin);
      const lowerRim = new Mesh(marginL, lowerMarginMat);
      lower.add(lowerLid, lowerRim);
      // Kemiringan celah mata: sudut luar sedikit lebih tinggi.
      upper.rotation.z = sx * this.tilt;
      lower.rotation.z = sx * this.tilt;
      const tiltU = new Group();
      tiltU.add(upper);
      const tiltL = new Group();
      tiltL.add(lower);
      eye.add(tiltU, tiltL);
      this.uppers.push(tiltU);
      this.lowers.push(tiltL);
      const car = new Mesh(caruncle, caruncleMat);
      car.position.set(-sx * r * 0.86, -r * 0.08, r * 0.42);
      eye.add(car);
      for (const o of [ball, ...upper.children, ...lower.children]) o.castShadow = false;
      this.group.add(eye);
    }
    this.update(1, 0, 0);
  }

  /**
   * Perbarui kelopak & arah pandang. `open` 0 (tertutup) .. 1 (normal) .. 1.2 (terbelalak).
   */
  update(open: number, gazeX: number, gazeY: number): void {
    const o = Math.max(0, Math.min(1.25, open));
    // Elevasi tepi kelopak di depan (radian): atas menutupi tepi atas iris, bawah di batas iris.
    // Terbuka: tepi atas menutupi 1–2 mm iris (+25°), bawah di tepi bawah iris (−24°);
    // tertutup: kelopak atas turun melewati tepi kelopak bawah (tumpang tindih, tanpa celah).
    const eU = (-28 + 53 * o) * DEG + gazeY * 0.12;
    const eL = (-27 + 3 * Math.min(1, o)) * DEG + gazeY * 0.05;
    const aU = Math.PI / 2 - this.thetaU - eU;
    const aL = this.thetaL - Math.PI / 2 - eL;
    for (let i = 0; i < 2; i++) {
      this.uppers[i]!.rotation.x = aU;
      this.lowers[i]!.rotation.x = aL;
      const ball = this.balls[i]!;
      ball.rotation.y = gazeX * 0.42;
      ball.rotation.x = -gazeY * 0.3;
    }
  }

  /** Ukuran pupil (mm) kiri & kanan (normal ± 3 mm; 1 = pin-point; 6 = midriasis). */
  setPupils(leftMm: number, rightMm: number): void {
    const toTheta = (mm: number) => Math.asin(Math.min(0.5, Math.max(0.03, mm / 2 / 12)));
    this.pupilU.value[0] = toTheta(leftMm);
    this.pupilU.value[1] = toTheta(rightMm);
    this.balls.forEach((b, i) => {
      const u = ((b.material as Material).userData as { pupil?: { value: number } }).pupil;
      if (u) u.value = this.pupilU.value[i]!;
    });
  }

  /** Sklera: ikterik 0..1 & kemerahan 0..1. */
  setSclera(jaundice: number, red: number): void {
    this.scleraTint.value.setRGB(1, 1 - 0.1 * jaundice, 1 - 0.62 * jaundice);
    this.redness.value = Math.min(1, red) * 0.6;
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose();
    this.group.removeFromParent();
  }
}
