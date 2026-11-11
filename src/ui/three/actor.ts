/**
 * Animasi pasien — sepenuhnya PROSEDURAL di atas satu kerangka (character.ts):
 * berjalan (termasuk pincang/lemah), duduk & berdiri dengan kaki menapak, napas sesuai
 * frekuensi napas kasus, gerak kecil saat duduk, kedipan & arah pandang, gerak mulut yang
 * sinkron dengan teks, ekspresi, gestur kontekstual, dan manifestasi gejala yang terlihat.
 *
 * Tidak ada klip animasi/berkas aset: semua pasien berbagi sistem yang sama.
 */
import { Euler, Matrix4, Quaternion, Vector3 } from 'three';
import { type GestureCue, type PatientAppearance, sampleSpeech, type SpeechTimeline } from '../../core/appearance';
import type { BodySite, Emotion } from '../../core/types';
import { Character, type Limb } from './character';
import { EMOTION_FACE, type FaceState, NEUTRAL_FACE } from './face';
import { LAYOUT } from './room';
import type { StageUpdatable } from './stage';

export type ActorMode = 'walk' | 'turn' | 'stand' | 'sit_down' | 'seated' | 'stand_up';
/** Reaksi terhadap pemeriksaan fisik. */
export type ExamReaction = 'ulur_lengan' | 'buka_mulut' | 'napas_dalam' | 'tegak';
type Side = 'L' | 'R';
type ClipKind = GestureCue['kind'] | ExamReaction | 'gelisah_tangan' | 'geser' | 'batuk_spontan';

interface Clip {
  kind: ClipKind;
  t: number;
  dur: number;
  delay: number;
  site?: BodySite;
  side?: Side;
  act?: string;
  /** Lengan yang dipakai gestur ini (untuk mencegah tabrakan antar-gestur). */
  arm?: Side | 'both';
}

interface ArmGoal {
  fkX: number;
  fkZ: number;
  fkElbow: number;
  target: Vector3;
  ik: number;
  pole: Vector3;
}

/** Kanal pose satu frame (target sebelum dihaluskan). Awalan "f" = wajah/pandangan. */
const FRAME_KEYS = [
  'hipsX', 'hipsY', 'hipsRx', 'hipsRy', 'hipsRz', 'spineX', 'spineY', 'spineZ', 'chestX', 'chestY', 'chestZ', 'neckX',
  'headX', 'headY', 'headZ', 'shL', 'shR', 'breath', 'thighL', 'thighR', 'kneeL', 'kneeR',
  'fBrowAsym', 'fGazeX', 'fGazeY', 'fLookOff', 'fMouth', 'fWide', 'fTalking', 'fEyes',
] as const;
type FrameKey = (typeof FRAME_KEYS)[number];
type Frame = Record<FrameKey, number>;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};
/** Amplop gestur: naik, tahan, turun. */
const envelope = (t: number, dur: number, attack = 0.28, release = 0.35) => Math.min(ease(t / attack), ease((dur - t) / release));
const sign = (side: Side) => (side === 'L' ? 1 : -1);

/** Pengacak kecil deterministik per pasien. */
function prng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
    s = Math.imul(s ^ (s >>> 13), 3266489909) >>> 0;
    return ((s ^= s >>> 16) >>> 0) / 4294967296;
  };
}

export class Actor implements StageUpdatable {
  readonly character: Character;
  mode: ActorMode = 'stand';
  /** Mata dokter (kamera) di ruang dunia — arah pandang & kontak mata. */
  readonly eyeTarget = new Vector3().copy(LAYOUT.eye);

  private readonly look: PatientAppearance;
  private readonly rnd: () => number;
  private time = 0;
  // Lokomosi
  private path: Vector3[] = [];
  private pathIndex = 0;
  private finalYaw: number | null = null;
  private onArrive: (() => void) | null = null;
  private speed = 0;
  private phase = 0;
  private yaw = 0;
  private sitU = 0;
  private sitDone: (() => void) | null = null;
  private readonly standPos = new Vector3();
  private readonly seatPos = new Vector3(LAYOUT.seat.x, 0, LAYOUT.seat.z);
  private readonly ankleWorld = { L: new Vector3(), R: new Vector3() };
  // Napas
  private breath = 0;
  private deepBreath = 0;
  // Idle
  private blinkIn = 2;
  private blink = 0;
  private gazeIn = 3;
  private gazeFor = 0;
  private readonly gaze = { x: 0, y: 0 };
  private shiftIn = 6;
  private readonly shift = { x: 0, lean: 0, fwd: 0, footL: 0, footR: 0 };
  private coughIn = 8;
  private holdIn = 2;
  private holdFor = 0;
  private holdW = 0;
  private fidgetIn = 5;
  private wince = 0;
  private winceIn = 4;
  // Gestur & bicara
  private clips: Clip[] = [];
  private talk: { tl: SpeechTimeline; t: number; chars: number; onProgress?: (chars: number, done: boolean) => void; beat: number; beatBoth: boolean } | null = null;
  private talkEnv = 0;
  private emotionOverride: { emotion: Emotion; until: number } | null = null;
  private smileUntil = 0;
  // Nilai terhaluskan
  private readonly cur: Record<string, number> = {};
  private readonly armCur = { L: { q: new Quaternion(), elbow: 0.2 }, R: { q: new Quaternion(), elbow: 0.2 } };
  private readonly faceTarget: FaceState = { ...NEUTRAL_FACE };
  // Objek kerja (hindari alokasi tiap frame)
  private readonly F = Object.fromEntries(FRAME_KEYS.map((k) => [k, 0])) as Frame;
  private readonly armGoal: Record<Side, ArmGoal> = {
    L: { fkX: 0, fkZ: 0, fkElbow: 0.2, target: new Vector3(), ik: 0, pole: new Vector3() },
    R: { fkX: 0, fkZ: 0, fkElbow: 0.2, target: new Vector3(), ik: 0, pole: new Vector3() },
  };
  private readonly ankle = { L: new Vector3(), R: new Vector3() };
  private legFk = 0;
  private readonly v1 = new Vector3();
  private readonly v2 = new Vector3();
  private readonly v3 = new Vector3();
  private readonly v4 = new Vector3();
  private readonly v5 = new Vector3();
  private readonly q1 = new Quaternion();
  private readonly q2 = new Quaternion();
  private readonly e1 = new Euler();
  private readonly m1 = new Matrix4();
  private readonly dominant: Side;

  constructor(look: PatientAppearance, seed: number) {
    this.look = look;
    this.rnd = prng(seed);
    this.character = new Character(look, seed);
    this.dominant = this.rnd() < 0.9 ? 'R' : 'L';
    this.breath = this.rnd() * Math.PI * 2;
    this.coughIn = 3 + this.rnd() * 6;
    this.holdIn = 1.5 + this.rnd() * 3;
    this.standPos.set(this.seatPos.x, 0, this.seatPos.z + this.ankleForward());
  }

  // -------------------------------------------------------------------------
  // Perintah
  // -------------------------------------------------------------------------

  /** Letakkan pasien langsung duduk di kursi (mis. melanjutkan sesi tersimpan). */
  placeSeated(): void {
    this.mode = 'seated';
    this.sitU = 1;
    this.yaw = 0;
    this.character.root.position.copy(this.seatPos);
    this.plantFeet(this.standPos);
    this.snap();
  }

  placeAt(pos: Vector3, yaw: number): void {
    this.mode = 'stand';
    this.sitU = 0;
    this.yaw = yaw;
    this.character.root.position.copy(pos);
    this.snap();
  }

  /** Berjalan menyusuri titik-titik; di akhir menghadap `finalYaw` lalu memanggil `onArrive`. */
  walkPath(points: readonly Vector3[], finalYaw: number | null, onArrive: () => void): void {
    this.path = points.map((p) => p.clone());
    this.pathIndex = 0;
    this.finalYaw = finalYaw;
    this.onArrive = onArrive;
    this.mode = 'walk';
  }

  /** Jalur menuju kursi berakhir di titik berdiri pasien ini (bergantung panjang kaki). */
  standPoint(): Vector3 {
    return this.standPos.clone();
  }

  sit(onDone: () => void): void {
    this.plantFeet(this.character.root.position);
    this.sitDone = onDone;
    this.mode = 'sit_down';
  }

  stand(onDone: () => void): void {
    this.sitDone = onDone;
    this.mode = 'stand_up';
  }

  /** Ucapkan teks: mulut bergerak mengikuti timeline; `onProgress` memberi jumlah karakter terucap. */
  say(tl: SpeechTimeline, onProgress?: (chars: number, done: boolean) => void): void {
    const p = this.look.personalityId;
    const weak = (this.look.cues.lemas ?? 0) >= 0.6 || (this.look.cues.sesak ?? 0) >= 0.9;
    const chance = weak ? 0.15 : p === 'sok_tahu' ? 0.95 : p === 'meremehkan' ? 0.45 : p === 'cemas' ? 0.35 : 0.65;
    this.talk = { tl, t: 0, chars: 0, onProgress, beat: tl.duration > 1.2 && this.rnd() < chance ? 1 : 0, beatBoth: p === 'sok_tahu' && this.rnd() < 0.6 };
  }

  /** Hentikan ucapan saat ini (teks dianggap selesai). */
  stopTalking(): void {
    const t = this.talk;
    if (!t) return;
    this.talk = null;
    t.onProgress?.(t.tl.frames.at(-1)?.chars ?? 0, true);
  }

  get talking(): boolean {
    return !!this.talk;
  }

  /** Jalankan gestur kontekstual (berurutan bila memakai lengan yang sama). */
  gesture(cues: readonly GestureCue[]): void {
    let armDelay = 0.25;
    let headDelay = 0;
    for (const cue of cues) {
      const clip = this.clipFor(cue);
      if (!clip) continue;
      if (clip.arm) {
        clip.delay = armDelay;
        armDelay += clip.dur * 0.85;
      } else {
        clip.delay = headDelay;
        headDelay += clip.dur * 0.7;
      }
      this.clips.push(clip);
    }
  }

  react(kind: ExamReaction): void {
    const dur = kind === 'napas_dalam' ? 4.2 : kind === 'ulur_lengan' ? 3.4 : 2.4;
    this.clips.push({ kind, t: 0, dur, delay: 0.15, arm: kind === 'ulur_lengan' ? 'L' : undefined });
    if (kind === 'napas_dalam') this.deepBreath = dur;
  }

  /** Emosi sesaat (mis. bingung saat pertanyaan tak dipahami). */
  setEmotion(emotion: Emotion, seconds: number): void {
    this.emotionOverride = { emotion, until: this.time + seconds };
  }

  headPosition(out: Vector3): Vector3 {
    return this.character.headBall.getWorldPosition(out);
  }

  dispose(): void {
    this.character.dispose();
  }

  // -------------------------------------------------------------------------
  // Loop
  // -------------------------------------------------------------------------

  update(dt: number, time: number): void {
    this.time = time;
    const F = this.F;
    for (const k of FRAME_KEYS) F[k] = 0;
    F.fEyes = 1;
    F.hipsY = this.character.dims.hipsY;
    this.resetArm('L');
    this.resetArm('R');

    this.locomotion(dt);
    this.breathing(dt);
    this.cuePosture(dt);
    this.idle(dt);
    this.runClips(dt);
    this.talking_(dt);
    this.faceUpdate(dt);
    this.write(dt, false);
  }

  // --- Lokomosi ------------------------------------------------------------

  private ankleForward(): number {
    return 0.28 + 0.1 * this.character.dims.s;
  }

  private seatHipsY(): number {
    return LAYOUT.seat.y + 0.088 * this.character.dims.s;
  }

  /** Tetapkan posisi telapak (dunia) untuk transisi duduk/berdiri: kaki tetap menapak. */
  private plantFeet(at: Vector3): void {
    const d = this.character.dims;
    const apart = this.look.sex === 'female' ? d.hipHalf * 0.85 : d.hipHalf + 0.035 * d.s;
    this.ankleWorld.L.set(at.x + apart, d.footH, at.z + 0.02);
    this.ankleWorld.R.set(at.x - apart, d.footH, at.z + 0.02);
  }

  private locomotion(dt: number): void {
    const c = this.character;
    const d = c.dims;
    const F = this.F;
    const cues = this.look.cues;
    const root = c.root;

    if (this.mode === 'walk') {
      const target = this.path[this.pathIndex];
      if (!target) {
        this.mode = this.finalYaw === null ? 'stand' : 'turn';
      } else {
        const to = this.v1.copy(target).sub(root.position);
        to.y = 0;
        const dist = to.length();
        const remaining = dist + this.remainingAfter(this.pathIndex);
        const want = this.look.walkSpeed * clamp(remaining / 0.45, 0.25, 1);
        this.speed += (want - this.speed) * (1 - Math.exp(-5 * dt));
        const step = this.speed * dt;
        if (dist <= Math.max(step, 0.03)) {
          this.pathIndex++;
          if (this.pathIndex >= this.path.length) root.position.set(target.x, 0, target.z);
        } else {
          const heading = Math.atan2(to.x, to.z);
          const off = this.angleDiff(heading, this.yaw);
          this.yaw = this.turnToward(this.yaw, heading, 4.2 * dt);
          if (Math.abs(off) > 1.1) {
            // Arah tujuan di samping/belakang: berputar di tempat dulu.
            this.speed *= Math.exp(-10 * dt);
          } else {
            // Melangkah ke arah hadap sambil menikung halus.
            const blend = Math.cos(off);
            root.position.x += Math.sin(this.yaw) * step * blend;
            root.position.z += Math.cos(this.yaw) * step * blend;
            root.position.addScaledVector(to.normalize(), step * (1 - blend) * 0.6);
          }
        }
      }
    }
    if (this.mode === 'turn') {
      this.speed *= Math.exp(-8 * dt);
      const goal = this.finalYaw ?? this.yaw;
      this.yaw = this.turnToward(this.yaw, goal, 3.4 * dt);
      if (Math.abs(this.angleDiff(goal, this.yaw)) < 0.03) {
        this.yaw = goal;
        this.mode = 'stand';
        const cb = this.onArrive;
        this.onArrive = null;
        cb?.();
      }
    }
    if (this.mode === 'stand' && this.onArrive && this.finalYaw === null) {
      const cb = this.onArrive;
      this.onArrive = null;
      cb();
    }

    // --- Duduk / berdiri -------------------------------------------------------
    if (this.mode === 'sit_down' || this.mode === 'stand_up') {
      const slow = (cues.lemas ?? 0) >= 0.6 || this.look.ageGroup === 'lansia' || (cues.pegang ?? 0) >= 0.7 ? 1.9 : 1.35;
      this.sitU = clamp(this.sitU + (this.mode === 'sit_down' ? 1 : -1) * (dt / slow), 0, 1);
      if ((this.mode === 'sit_down' && this.sitU >= 1) || (this.mode === 'stand_up' && this.sitU <= 0)) {
        this.mode = this.mode === 'sit_down' ? 'seated' : 'stand';
        const cb = this.sitDone;
        this.sitDone = null;
        cb?.();
      }
    }
    const seatedLike = this.mode === 'sit_down' || this.mode === 'stand_up' || this.mode === 'seated';
    if (seatedLike) {
      const e = ease(this.sitU);
      root.position.x = lerp(this.standPos.x, this.seatPos.x, e);
      root.position.z = lerp(this.standPos.z, this.seatPos.z, e);
      this.yaw = 0;
      F.hipsY = lerp(d.hipsY, this.seatHipsY(), e);
      // Condong ke depan di tengah gerakan (menjaga keseimbangan).
      const mid = Math.sin(Math.PI * this.sitU);
      F.spineX += mid * 0.42;
      F.chestX += mid * 0.12;
      F.headX -= mid * 0.2;
    }
    root.rotation.y = this.yaw;

    // --- Kaki ------------------------------------------------------------
    const walkAmp = this.mode === 'walk' ? clamp(this.speed / Math.max(0.2, this.look.walkSpeed), 0, 1) : 0;
    this.legFk += (walkAmp - this.legFk) * (1 - Math.exp(-9 * dt));
    if (this.mode === 'walk' || this.legFk > 0.02) {
      const limp = cues.pincang_kanan ? 1 : 0;
      const stiff = cues.kaku ? 1 : 0;
      const weak = cues.lemas ?? 0;
      const stride = (0.62 - 0.14 * weak - 0.1 * stiff - (this.look.ageGroup === 'lansia' ? 0.1 : 0)) * d.s;
      // Pincang: fase tumpu kaki kanan dipersingkat (cepat-cepat pindah ke kaki sehat).
      const stanceR = Math.cos(this.phase) < 0 ? 1 : 0; // kaki kanan menapak saat kaki kiri mengayun
      const rate = (this.speed / Math.max(0.15, stride)) * Math.PI * (limp ? (stanceR ? 1.5 : 0.78) : 1);
      this.phase += rate * dt;
      const A = (0.44 - 0.1 * weak - 0.1 * stiff) * this.legFk;
      const pL = this.phase;
      const pR = this.phase + Math.PI;
      F.thighL = Math.sin(pL) * A * (limp ? 0.72 : 1);
      F.thighR = Math.sin(pR) * A;
      F.kneeL = (0.06 + 0.95 * Math.max(0, Math.cos(pL))) * this.legFk * (1 - 0.3 * stiff);
      F.kneeR = (0.06 + (limp ? 0.5 : 0.95) * Math.max(0, Math.cos(pR))) * this.legFk * (1 - 0.3 * stiff);
      F.hipsY += (Math.cos(this.phase * 2) * 0.014 - 0.012) * this.legFk * d.s;
      F.hipsRz += Math.sin(this.phase) * 0.035 * this.legFk + (limp ? stanceR * 0.07 * this.legFk : 0);
      F.spineZ -= Math.sin(this.phase) * 0.03 * this.legFk;
      F.spineY += Math.sin(this.phase) * 0.07 * this.legFk;
      F.hipsRy -= Math.sin(this.phase) * 0.06 * this.legFk;
      if (limp) F.hipsY -= stanceR * 0.018 * this.legFk;
      // Ayunan lengan berlawanan dengan kaki.
      const swing = (0.36 - 0.14 * weak - 0.12 * stiff) * this.legFk;
      this.armGoal.L.fkX = Math.sin(pL) * swing;
      this.armGoal.R.fkX = Math.sin(pR) * swing;
      this.armGoal.L.fkElbow = 0.22 + Math.max(0, -Math.sin(pL)) * 0.3 * this.legFk;
      this.armGoal.R.fkElbow = 0.22 + Math.max(0, -Math.sin(pR)) * 0.3 * this.legFk;
      F.spineX += 0.03 * this.legFk + 0.08 * weak * this.legFk;
    }
    // Target pergelangan kaki (ruang akar) untuk berdiri/duduk.
    for (const side of ['L', 'R'] as const) {
      const a = this.ankle[side];
      if (seatedLike) {
        a.copy(this.ankleWorld[side]).sub(root.position);
        a.z += side === 'L' ? this.shift.footL : this.shift.footR;
        if (this.mode === 'seated' && cues.pincang_kanan && side === 'R') a.z += 0.09;
      } else {
        a.set(sign(side) * d.hipHalf, d.footH, 0.012);
      }
    }
  }

  private remainingAfter(index: number): number {
    let sum = 0;
    for (let i = index; i < this.path.length - 1; i++) sum += this.path[i]!.distanceTo(this.path[i + 1]!);
    return sum;
  }

  private angleDiff(a: number, b: number): number {
    let diff = a - b;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return diff;
  }

  private turnToward(current: number, goal: number, maxStep: number): number {
    const diff = this.angleDiff(goal, current);
    return current + clamp(diff, -maxStep, maxStep);
  }

  // --- Napas ------------------------------------------------------------

  private breathing(dt: number): void {
    const F = this.F;
    const sesak = this.look.cues.sesak ?? 0;
    let bpm = this.look.breathsPerMinute;
    let amp = 0.016 + 0.05 * sesak;
    if (this.deepBreath > 0) {
      // Pemeriksaan paru: napas dalam & lambat.
      this.deepBreath -= dt;
      bpm = Math.min(bpm, 13);
      amp = Math.max(amp, 0.07);
    }
    this.breath += (bpm / 60) * Math.PI * 2 * dt;
    // Tarik napas lebih singkat daripada hembus (bentuk gelombang asimetris).
    const b = 0.5 + 0.5 * Math.sin(this.breath - 0.35 * Math.sin(this.breath));
    F.breath = amp * b;
    const lift = (0.0025 + 0.013 * sesak + (this.deepBreath > 0 ? 0.008 : 0)) * b;
    F.shL += lift;
    F.shR += lift;
    F.chestX -= (0.012 + 0.035 * sesak) * b;
    F.headX -= 0.02 * sesak * b;
  }

  // --- Postur dari isyarat klinis ------------------------------------------------

  private cuePosture(dt: number): void {
    const F = this.F;
    const cues = this.look.cues;
    const c = this.character;
    const d = c.dims;
    const seated = this.sitU;
    const lemas = cues.lemas ?? 0;
    F.spineX += 0.15 * lemas;
    F.chestX += 0.07 * lemas;
    F.headX += 0.1 * lemas;
    F.shL -= 0.006 * lemas;
    F.shR -= 0.006 * lemas;
    if (this.look.ageGroup === 'lansia') {
      F.chestX += 0.13;
      F.neckX -= 0.08;
    }
    if (cues.mengantuk) F.headX += 0.1 + 0.06 * Math.sin(this.time * 0.5);
    if (cues.sesak) F.spineX += 0.05 * cues.sesak;
    if (cues.gemuk && seated > 0.5) F.spineX -= 0.04;

    // Tangan di paha saat duduk (posisi istirahat).
    for (const side of ['L', 'R'] as const) {
      const g = this.armGoal[side];
      const rest = this.v1.set(sign(side) * (d.hipHalf + 0.03 * d.s), -d.hipDrop + 0.085 * d.s * (1 + 0.24 * Math.max(0, this.look.build)), (0.29 + 0.05 * Math.max(0, this.look.build)) * d.s);
      c.hips.localToWorld(rest);
      if (seated > 0.02) this.aimArm(side, rest, ease(seated));
      g.fkZ = sign(side) * (0.07 + 0.14 * Math.max(0, this.look.build));
    }

    // Tripod: bertumpu pada lutut, badan condong, bahu terangkat (sesak berat).
    if (cues.tripod && seated > 0.6) {
      F.spineX += 0.3;
      F.headX -= 0.22;
      F.shL += 0.014;
      F.shR += 0.014;
      for (const side of ['L', 'R'] as const) {
        const knee = this.v1.set(sign(side) * (d.hipHalf + 0.02), -d.hipDrop + 0.07 * d.s, 0.36 * d.s);
        c.hips.localToWorld(knee);
        this.aimArm(side, knee, 1);
      }
    }
    // Menggigil: mendekap badan, bahu naik, gemetar halus.
    if (cues.menggigil) {
      const tr = Math.sin(this.time * 39) * 0.5 + Math.sin(this.time * 31.7) * 0.5;
      F.spineY += tr * 0.014;
      F.headZ += tr * 0.012;
      F.headY += Math.sin(this.time * 35.3) * 0.01;
      F.spineX += 0.1;
      F.shL += 0.014 + tr * 0.002;
      F.shR += 0.014 - tr * 0.002;
      this.hug(1);
    }
    // Duduk kaku menahan nyeri (curiga peritonitis): kedua tangan di perut, minim gerak.
    if (cues.diam_menahan) {
      F.spineX += 0.12;
      for (const side of ['L', 'R'] as const) this.aimArm(side, this.sitePoint('perut', side, this.v1), 1);
    }

    // Memegang bagian yang sakit: siklus tahan–lepas sesuai kekuatan nyeri.
    const hold = this.look.hold;
    if (hold && !cues.diam_menahan && !cues.menggigil) {
      const walking = this.mode === 'walk' || this.mode === 'turn' || this.mode === 'sit_down' || this.mode === 'stand_up';
      let active = this.holdFor > 0;
      if (walking && hold.level >= 0.6 && hold.site !== 'kepala' && hold.site !== 'mata' && hold.site !== 'mulut') active = true;
      else if (this.mode === 'seated' && !this.armBusy()) {
        if (this.holdFor > 0) this.holdFor -= dt;
        else {
          this.holdIn -= dt;
          if (this.holdIn <= 0) {
            const strong = hold.level >= 0.8;
            this.holdFor = strong ? 6 + this.rnd() * 7 : 2.5 + this.rnd() * 3;
            this.holdIn = strong ? 1.5 + this.rnd() * 2.5 : (5 + this.rnd() * 9) / Math.max(0.25, hold.level);
          }
        }
      } else if (this.armBusy()) this.holdFor = 0;
      this.holdW += ((active ? 1 : 0) - this.holdW) * (1 - Math.exp(-4.5 * dt));
      if (this.holdW > 0.01) this.holdPose(hold.site, hold.side === 'kiri' ? 'L' : 'R', this.holdW);
    }
  }

  /** Arahkan satu tangan ke bagian tubuh + condongkan badan sesuai lokasinya. */
  private holdPose(site: BodySite, side: Side, w: number): void {
    const F = this.F;
    const central = site === 'perut' || site === 'ulu_hati' || site === 'perut_bawah' || site === 'dada' || site === 'tenggorokan' || site === 'mulut';
    const armSide: Side = central || site === 'kepala' || site === 'mata' ? this.dominant : side;
    const p = this.sitePoint(site, site === 'pinggang' ? side : armSide, this.v1);
    // Gerakan mengusap kecil agar tidak kaku.
    p.y += Math.sin(this.time * 2.1) * 0.008 * w;
    this.aimArm(armSide, p, w, site === 'pinggang');
    if (site === 'perut' || site === 'ulu_hati' || site === 'perut_bawah') {
      F.spineX += 0.11 * w;
      F.headX += 0.05 * w;
    } else if (site === 'pinggang') {
      F.spineZ += -sign(side) * 0.09 * w;
      F.spineX += 0.06 * w;
    } else if (site === 'kepala' || site === 'mata') {
      F.headX += 0.1 * w;
    }
  }

  private hug(w: number): void {
    const c = this.character;
    const d = c.dims;
    for (const side of ['L', 'R'] as const) {
      const p = this.v1.set(-sign(side) * d.shoulderHalf * 0.78, d.shoulderY - 0.13 * d.s, 0.105 * d.s * d.bd);
      c.chest.localToWorld(p);
      this.aimArm(side, p, w);
    }
  }

  // --- Gerak kecil saat diam ------------------------------------------------------

  private idle(dt: number): void {
    const F = this.F;
    const t = this.time;
    const cues = this.look.cues;
    const calm = cues.diam_menahan ? 0.25 : cues.mengantuk ? 0.5 : 1;
    // Ayunan halus (tubuh hidup tidak pernah benar-benar diam).
    F.spineZ += (Math.sin(t * 0.43) * 0.012 + Math.sin(t * 0.91 + 1.3) * 0.006) * calm;
    F.spineY += Math.sin(t * 0.37 + 0.6) * 0.02 * calm;
    F.headY += (Math.sin(t * 0.53 + 2.1) * 0.035 + Math.sin(t * 1.3) * 0.012) * calm * (this.talk ? 0.4 : 1);
    F.headZ += Math.sin(t * 0.47 + 0.4) * 0.02 * calm;
    F.headX += Math.sin(t * 0.61 + 1.1) * 0.015 * calm;

    // Kedip.
    this.blinkIn -= dt;
    if (this.blinkIn <= 0) {
      this.blink = cues.mengantuk ? 0.42 : 0.15;
      this.blinkIn = (cues.mengantuk ? 1.8 : 2.4) + this.rnd() * (this.look.emotion === 'cemas' ? 2 : 3.6);
    }
    if (this.blink > 0) this.blink -= dt;

    // Arah pandang: umumnya menatap dokter, sesekali melirik.
    this.gazeIn -= dt;
    if (this.gazeFor > 0) {
      this.gazeFor -= dt;
      if (this.gazeFor <= 0) this.gaze.x = this.gaze.y = 0;
    } else if (this.gazeIn <= 0) {
      const p = this.look.personalityId;
      this.gaze.x = (this.rnd() - 0.5) * 1.5;
      this.gaze.y = p === 'pelupa' ? -0.5 - this.rnd() * 0.3 : (cues.lemas ?? 0) >= 0.6 ? 0.6 : (this.rnd() - 0.4) * 0.7;
      this.gazeFor = 0.5 + this.rnd() * (p === 'cemas' ? 0.6 : 1.1);
      this.gazeIn = (p === 'cemas' ? 2 : p === 'pelupa' ? 2.6 : 4) + this.rnd() * 5;
    }

    if (this.mode !== 'seated') return;

    // Ganti posisi duduk (lebih sering bila gelisah karena nyeri kolik).
    this.shiftIn -= dt;
    if (this.shiftIn <= 0 && !cues.diam_menahan) {
      const restless = cues.gelisah ?? 0;
      const k = restless ? 1 : 0.4;
      this.shift.x = (this.rnd() - 0.5) * 0.07 * k;
      this.shift.lean = (this.rnd() - 0.5) * (restless ? 0.22 : 0.07);
      this.shift.fwd = (this.rnd() - 0.4) * (restless ? 0.2 : 0.06);
      this.shift.footL = (this.rnd() - 0.6) * 0.14 * (restless ? 1 : 0.6);
      this.shift.footR = (this.rnd() - 0.6) * 0.14 * (restless ? 1 : 0.6);
      this.shiftIn = restless ? 2.2 + this.rnd() * 2.8 : 7 + this.rnd() * 10;
      if (restless && this.rnd() < 0.5) this.wince = 1.1;
    }
    F.hipsX += this.shift.x;
    F.spineZ += this.shift.lean;
    F.spineX += this.shift.fwd;

    // Meringis berkala pada nyeri hebat.
    if (this.look.emotion === 'kesakitan') {
      this.winceIn -= dt;
      if (this.winceIn <= 0) {
        this.wince = 0.9 + this.rnd() * 0.8;
        this.winceIn = 3.5 + this.rnd() * 6;
      }
    }
    if (this.wince > 0) this.wince -= dt;

    // Batuk spontan.
    if (cues.batuk && !this.talk) {
      this.coughIn -= dt;
      if (this.coughIn <= 0 && !this.armBusy()) {
        this.clips.push({ kind: 'batuk_spontan', t: 0, dur: 1.55, delay: 0, arm: this.dominant });
        this.coughIn = (9 + this.rnd() * 14) / Math.max(0.35, cues.batuk);
      }
    }
    // Pasien cemas: meremas-remas tangan.
    if (this.look.emotion === 'cemas' && !this.look.hold) {
      this.fidgetIn -= dt;
      if (this.fidgetIn <= 0 && !this.armBusy() && !this.talk) {
        this.clips.push({ kind: 'gelisah_tangan', t: 0, dur: 2.6 + this.rnd() * 1.6, delay: 0, arm: 'both' });
        this.fidgetIn = 5 + this.rnd() * 6;
      }
    }
  }

  private armBusy(): boolean {
    return this.clips.some((c) => c.arm && c.delay <= 0);
  }

  // --- Gestur ------------------------------------------------------------

  private clipFor(cue: GestureCue): Clip | null {
    const base = { t: 0, delay: 0 };
    switch (cue.kind) {
      case 'angguk':
        return { ...base, kind: 'angguk', dur: 1.05 };
      case 'geleng':
        return { ...base, kind: 'geleng', dur: 1.25 };
      case 'bingung':
        return { ...base, kind: 'bingung', dur: 2 };
      case 'pikir':
        return { ...base, kind: 'pikir', dur: 1.7, arm: this.look.personalityId === 'pelupa' ? this.dominant : undefined };
      case 'salam':
        return { ...base, kind: 'salam', dur: 1.5 };
      case 'senyum':
        return { ...base, kind: 'senyum', dur: 1.8 };
      case 'meringis':
        return { ...base, kind: 'meringis', dur: 1.7 };
      case 'seluruh_badan':
        return { ...base, kind: 'seluruh_badan', dur: 2, arm: 'both' };
      case 'tunjuk': {
        const side: Side = cue.side === 'kiri' ? 'L' : 'R';
        return { ...base, kind: 'tunjuk', dur: 2.6, site: cue.site, side, arm: cue.site === 'pinggang' ? side : cue.site === 'lengan' ? 'both' : this.dominant };
      }
      case 'peraga':
        if (cue.act === 'batuk') return { ...base, kind: 'peraga', act: 'batuk', dur: 1.6, arm: this.dominant };
        if (cue.act === 'sesak') return { ...base, kind: 'peraga', act: 'sesak', dur: 2.8, arm: this.dominant };
        if (cue.act === 'menggigil') return { ...base, kind: 'peraga', act: 'menggigil', dur: 2.3, arm: 'both' };
        if (cue.act === 'dahi') return { ...base, kind: 'peraga', act: 'dahi', dur: 2.1, arm: this.dominant };
        return { ...base, kind: 'peraga', act: 'lemas', dur: 2.2 };
    }
  }

  private runClips(dt: number): void {
    const F = this.F;
    const c = this.character;
    const d = c.dims;
    for (const clip of this.clips) {
      if (clip.delay > 0) {
        clip.delay -= dt;
        continue;
      }
      clip.t += dt;
      const t = clip.t;
      const e = envelope(t, clip.dur);
      switch (clip.kind) {
        case 'angguk':
          F.headX += Math.sin(t * Math.PI * 2 * 1.9) * 0.2 * e + 0.05 * e;
          break;
        case 'geleng':
          F.headY += Math.sin(t * Math.PI * 2 * 1.6) * 0.33 * e;
          break;
        case 'bingung':
          F.headZ += 0.17 * e;
          F.headX -= 0.05 * e;
          F.shL += 0.012 * e;
          F.shR += 0.012 * e;
          F.fBrowAsym = Math.max(F.fBrowAsym, e);
          break;
        case 'pikir':
          F.headY += 0.2 * e;
          F.headX -= 0.12 * e;
          F.fGazeX = 0.7 * e;
          F.fGazeY = -0.7 * e;
          F.fLookOff = Math.max(F.fLookOff, e * 0.7);
          if (clip.arm && clip.arm !== 'both') {
            const p = this.sitePoint('kepala', clip.arm, this.v1);
            p.y += Math.sin(t * 9) * 0.006;
            this.aimArm(clip.arm, p, e);
          }
          break;
        case 'salam': {
          const bow = Math.sin(Math.PI * clamp(t / clip.dur, 0, 1));
          F.spineX += 0.2 * bow;
          F.headX += 0.16 * bow;
          this.smileUntil = this.time + 0.6;
          break;
        }
        case 'senyum':
          this.smileUntil = this.time + 0.3;
          break;
        case 'meringis':
          this.wince = Math.max(this.wince, 0.2);
          F.spineX += 0.07 * e;
          break;
        case 'seluruh_badan': {
          // Kedua tangan menyapu dari dada ke perut: "seluruh badan, Dok".
          const k = clamp(t / clip.dur, 0, 1);
          for (const side of ['L', 'R'] as const) {
            const p = this.v1.set(sign(side) * d.shoulderHalf * 0.55, lerp(0.12, -0.08, k) * d.s, 0.16 * d.s * d.bd);
            c.chest.localToWorld(p);
            this.aimArm(side, p, e);
          }
          break;
        }
        case 'tunjuk': {
          const site = clip.site!;
          if (site === 'lengan') {
            // Ulurkan satu lengan, tangan lain menunjuk lengan bawahnya.
            const show: Side = this.dominant === 'R' ? 'L' : 'R';
            const out = this.v1.set(sign(show) * 0.1 * d.s, -0.05 * d.s, 0.33 * d.s);
            c.chest.localToWorld(out);
            this.aimArm(show, out, e);
            const mid = this.v2.set(sign(show) * 0.1 * d.s, 0.0, 0.24 * d.s);
            c.chest.localToWorld(mid);
            mid.y += Math.sin(t * 6) * 0.01;
            this.aimArm(this.dominant, mid, e);
            F.headX += 0.14 * e;
            F.fLookOff = Math.max(F.fLookOff, e * 0.6);
          } else if (site === 'kaki') {
            const side = clip.side ?? this.dominant;
            const knee = this.v1.set(sign(side) * (d.hipHalf + 0.01), -d.hipDrop + 0.06 * d.s, (this.sitU > 0.5 ? 0.38 : 0.1) * d.s);
            c.hips.localToWorld(knee);
            this.aimArm(side, knee, e);
            F.spineX += 0.2 * e;
            F.headX += 0.2 * e;
            F.fLookOff = Math.max(F.fLookOff, e * 0.7);
          } else {
            this.holdPose(site, clip.side ?? this.dominant, e);
            this.holdFor = 0;
          }
          break;
        }
        case 'peraga': {
          if (clip.act === 'batuk') this.coughPose(clip, e);
          else if (clip.act === 'sesak') {
            const b = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 0.75);
            F.breath += 0.07 * b * e;
            F.shL += 0.02 * b * e;
            F.shR += 0.02 * b * e;
            F.fMouth = Math.max(F.fMouth, 0.25 * e);
            this.aimArm(clip.arm as Side, this.sitePoint('dada', clip.arm as Side, this.v1), e);
          } else if (clip.act === 'menggigil') {
            const tr = Math.sin(t * 40);
            F.spineY += tr * 0.016 * e;
            F.headZ += tr * 0.012 * e;
            F.shL += 0.014 * e;
            F.shR += 0.014 * e;
            this.hug(e);
          } else if (clip.act === 'dahi') {
            const p = this.v1.set(0, d.headR * 0.55, d.headR * 1.02);
            c.headBall.localToWorld(p);
            this.aimArm(clip.arm as Side, p, e);
            F.fEyes = Math.min(F.fEyes, 1 - 0.5 * e);
          } else {
            F.spineX += 0.13 * e;
            F.headX += 0.16 * e;
            F.fEyes = Math.min(F.fEyes, 1 - 0.45 * e);
          }
          break;
        }
        case 'batuk_spontan':
          this.coughPose(clip, e);
          break;
        case 'gelisah_tangan':
          for (const side of ['L', 'R'] as const) {
            const p = this.v1.set(sign(side) * 0.03 * d.s + Math.sin(t * 5 + sign(side)) * 0.012, -d.hipDrop + 0.1 * d.s * d.bd, 0.2 * d.s + Math.cos(t * 4.3) * 0.01);
            c.hips.localToWorld(p);
            this.aimArm(side, p, e);
          }
          break;
        case 'ulur_lengan': {
          // Tanda vital: ulurkan lengan kiri ke atas meja.
          const p = this.v1.set(LAYOUT.seat.x + 0.2, LAYOUT.desk.top + 0.05, LAYOUT.desk.z0 + 0.02);
          this.aimArm('L', p, e);
          F.spineX += 0.1 * e;
          break;
        }
        case 'buka_mulut':
          F.headX -= 0.24 * e;
          F.fMouth = Math.max(F.fMouth, 0.95 * e);
          break;
        case 'napas_dalam':
        case 'tegak':
          F.spineX -= 0.08 * e;
          F.chestX -= 0.05 * e;
          break;
        case 'geser':
          break;
      }
    }
    this.clips = this.clips.filter((clip) => clip.t < clip.dur);
  }

  private coughPose(clip: Clip, e: number): void {
    const F = this.F;
    const t = clip.t;
    const pulse = (x: number) => Math.exp(-((x / 0.075) ** 2));
    const burst = pulse(t - 0.45) + pulse(t - 0.78) + pulse(t - 1.08) * 0.8;
    const p = this.sitePoint('mulut', clip.arm as Side, this.v1);
    this.aimArm(clip.arm as Side, p, e);
    F.chestX += 0.2 * burst;
    F.spineX += 0.08 * burst + 0.05 * e;
    F.headX += 0.16 * burst + 0.06 * e;
    F.fEyes = Math.min(F.fEyes, 1 - 0.85 * Math.min(1, burst + e * 0.3));
    F.fMouth = Math.max(F.fMouth, 0.5 * Math.min(1, burst));
    F.fLookOff = Math.max(F.fLookOff, e * 0.5);
  }

  // --- Bicara ------------------------------------------------------------

  private talking_(dt: number): void {
    const F = this.F;
    const talk = this.talk;
    this.talkEnv += ((talk ? 1 : 0) - this.talkEnv) * (1 - Math.exp(-6 * dt));
    if (!talk) return;
    talk.t += dt;
    const s = sampleSpeech(talk.tl, talk.t);
    F.fMouth = Math.max(F.fMouth, s.open);
    F.fWide = s.wide;
    F.fTalking = 1;
    // Kepala ikut bergerak mengikuti tekanan suku kata.
    F.headX += (s.open - 0.3) * 0.035;
    F.headY += Math.sin(talk.t * 2.3) * 0.03;
    if (s.chars !== talk.chars || s.done) {
      talk.chars = s.chars;
      talk.onProgress?.(s.chars, s.done);
    }
    // Gestur tangan saat bercerita (bila tangan tidak sedang dipakai).
    if (talk.beat && this.mode === 'seated' && !this.armBusy() && this.holdW < 0.3 && !this.look.cues.menggigil && !this.look.cues.tripod && !this.look.cues.diam_menahan) {
      const c = this.character;
      const d = c.dims;
      const w = 0.8 * Math.min(ease(talk.t / 0.5), ease((talk.tl.duration - talk.t) / 0.5));
      const sides: Side[] = talk.beatBoth ? ['L', 'R'] : [this.dominant];
      for (const side of sides) {
        const p = this.v1.set(
          sign(side) * (d.hipHalf + 0.07 * d.s) + Math.sin(talk.t * 3.1 + sign(side)) * 0.025,
          0.16 * d.s + s.open * 0.03 + Math.sin(talk.t * 4.7) * 0.012,
          0.3 * d.s + Math.cos(talk.t * 2.6) * 0.02,
        );
        c.hips.localToWorld(p);
        this.aimArm(side, p, w);
      }
    }
    if (s.done) {
      this.talk = null;
    }
  }

  // --- Wajah ------------------------------------------------------------

  private faceUpdate(dt: number): void {
    const F = this.F;
    const cues = this.look.cues;
    const face = this.character.face;
    const target = this.faceTarget;
    Object.assign(target, NEUTRAL_FACE);
    let emotion = this.look.emotion;
    if (this.emotionOverride) {
      if (this.time < this.emotionOverride.until) emotion = this.emotionOverride.emotion;
      else this.emotionOverride = null;
    }
    Object.assign(target, EMOTION_FACE[emotion]);
    if (this.time < this.smileUntil) {
      target.smile = Math.max(target.smile, 0.75);
      target.browInner = Math.max(target.browInner * 0.3, 0);
    }
    // Meringis: mata menyipit, alis mengerut.
    if (this.wince > 0) {
      const w = Math.min(1, this.wince / 0.25);
      target.eyeOpen = lerp(target.eyeOpen, 0.22, w);
      target.browInner = lerp(target.browInner, -1, w);
      target.smile = lerp(target.smile, -0.75, w);
      target.mouthOpen = Math.max(target.mouthOpen, 0.18 * w);
    }
    if (cues.mengantuk) target.eyeOpen *= 0.62;
    else if ((cues.lemas ?? 0) >= 0.6) target.eyeOpen *= 0.85;
    if ((cues.sesak ?? 0) >= 0.9 && !this.talk) target.mouthOpen = Math.max(target.mouthOpen, 0.16);
    if (F.fBrowAsym) target.browAsym = Math.max(target.browAsym, F.fBrowAsym);
    target.eyeOpen *= clamp(F.fEyes, 0, 1);
    if (this.blink > 0) target.eyeOpen = Math.min(target.eyeOpen, 0.05);
    target.gazeX = F.fGazeX || this.gaze.x * (this.talk ? 0.35 : 1);
    target.gazeY = F.fGazeY || this.gaze.y * (this.talk ? 0.35 : 1);
    target.mouthOpen = Math.max(target.mouthOpen, F.fMouth);
    if (F.fTalking) target.mouthWide = F.fWide;

    const st = face.state;
    const k = 1 - Math.exp(-14 * dt);
    const kFast = 1 - Math.exp(-32 * dt);
    st.eyeOpen += (target.eyeOpen - st.eyeOpen) * (target.eyeOpen < st.eyeOpen ? kFast : k);
    st.browInner += (target.browInner - st.browInner) * k;
    st.browRaise += (target.browRaise - st.browRaise) * k;
    st.browAsym += (target.browAsym - st.browAsym) * k;
    st.smile += (target.smile - st.smile) * k;
    st.mouthOpen += (target.mouthOpen - st.mouthOpen) * kFast;
    st.mouthWide += (target.mouthWide - st.mouthWide) * kFast;
    st.gazeX += (target.gazeX - st.gazeX) * k;
    st.gazeY += (target.gazeY - st.gazeY) * k;
    face.draw();
  }

  // --- Lengan: bantuan ------------------------------------------------------------

  private resetArm(side: Side): void {
    const g = this.armGoal[side];
    g.fkX = 0;
    g.fkZ = sign(side) * 0.08;
    g.fkElbow = 0.2;
    g.ik = 0;
    g.pole.set(sign(side) * 0.42, -0.55, -0.72);
  }

  /** Arahkan tangan ke titik dunia dengan bobot w; bobot lebih besar menimpa yang lebih kecil. */
  private aimArm(side: Side, world: Vector3, w: number, behind = false): void {
    const g = this.armGoal[side];
    if (w <= 0) return;
    if (g.ik <= 0.0001) {
      g.target.copy(world);
      g.ik = w;
    } else {
      // Sudah ada target (mis. tangan di paha): geser menuju target baru sebesar w.
      g.target.lerp(world, clamp(w, 0, 1));
      g.ik = Math.max(g.ik, w);
    }
    if (behind) g.pole.set(sign(side) * 1, -0.15, -0.75);
  }

  /** Posisi dunia suatu bagian tubuh (titik sentuh tangan). */
  private sitePoint(site: BodySite, side: Side, out: Vector3): Vector3 {
    const c = this.character;
    const d = c.dims;
    const s = d.s;
    const x = sign(side);
    const R = d.headR;
    switch (site) {
      case 'kepala':
        return c.headBall.localToWorld(out.set(x * R * 0.8, R * 0.42, R * 0.52));
      case 'mata':
        return c.headBall.localToWorld(out.set(x * R * 0.4, R * 0.12, R * 1.1));
      case 'mulut':
        return c.headBall.localToWorld(out.set(x * R * 0.1, -R * 0.62, R * 1.22));
      case 'tenggorokan':
        return c.neck.localToWorld(out.set(0, 0.015 * s, 0.075 * s));
      case 'dada':
        return c.chest.localToWorld(out.set(x * 0.02 * s, 0.1 * s, 0.128 * s * (1 + 0.3 * Math.max(0, this.look.build))));
      case 'ulu_hati':
        return c.spine.localToWorld(out.set(x * 0.015 * s, 0.135 * s, 0.118 * s * d.bd));
      case 'perut':
        return c.spine.localToWorld(out.set(x * 0.02 * s, 0.035 * s, (0.122 + 0.07 * Math.max(0, this.look.build)) * s * d.bd));
      case 'perut_bawah':
        return c.hips.localToWorld(out.set(x * 0.02 * s, 0.035 * s, 0.128 * s * d.bd));
      case 'pinggang':
        return c.spine.localToWorld(out.set(x * 0.132 * s * d.bw, 0.005 * s, -0.05 * s));
      case 'lengan':
        return c.chest.localToWorld(out.set(-x * 0.1 * s, 0, 0.24 * s));
      case 'kaki':
        return c.hips.localToWorld(out.set(x * d.hipHalf, -d.hipDrop + 0.06 * s, 0.36 * s));
    }
  }

  // --- Tulis ke kerangka ------------------------------------------------------------

  /** Samakan nilai terhaluskan dengan target (saat pasien diletakkan langsung). */
  private snap(): void {
    for (const k of Object.keys(this.cur)) delete this.cur[k];
    this.update(0, this.time);
    this.write(0, true);
  }

  private damp(key: string, target: number, k: number): number {
    const prev = this.cur[key];
    const v = prev === undefined ? target : prev + (target - prev) * k;
    this.cur[key] = v;
    return v;
  }

  private write(dt: number, snap: boolean): void {
    const c = this.character;
    const d = c.dims;
    const F = this.F;
    const k = snap ? 1 : 1 - Math.exp(-11 * dt);
    const kSlow = snap ? 1 : 1 - Math.exp(-5 * dt);
    const g = (key: FrameKey, slow = false) => this.damp(key, F[key], slow ? kSlow : k);

    c.hips.position.set(g('hipsX', true), this.damp('hipsY', F.hipsY, snap ? 1 : 1 - Math.exp(-30 * dt)), 0);
    c.hips.rotation.set(g('hipsRx'), g('hipsRy'), g('hipsRz'));
    c.spine.rotation.set(g('spineX'), g('spineY'), g('spineZ'));
    c.chest.rotation.set(g('chestX'), g('chestY'), g('chestZ'));
    const breath = F.breath;
    c.chestMesh.scale.set(c.chestBase.x * (1 + breath * 0.45), 1, c.chestBase.z * (1 + breath * 1.7));
    c.shoulderL.position.y = d.shoulderY + g('shL');
    c.shoulderR.position.y = d.shoulderY + g('shR');
    c.root.updateMatrixWorld(true);

    // Kaki: FK saat berjalan, IK (telapak menapak) saat berdiri/duduk.
    const fk = this.legFk;
    for (const side of ['L', 'R'] as const) {
      const leg = side === 'L' ? c.legL : c.legR;
      this.solveLeg(leg, side, this.ankle[side], c.hips.position);
      if (fk > 0.01) {
        const th = side === 'L' ? F.thighL : F.thighR;
        const kn = side === 'L' ? F.kneeL : F.kneeR;
        leg.upper.rotation.x = lerp(leg.upper.rotation.x, -th, fk);
        leg.upper.rotation.z = lerp(leg.upper.rotation.z, 0, fk);
        leg.lower.rotation.x = lerp(leg.lower.rotation.x, kn, fk);
        leg.end.rotation.x = lerp(leg.end.rotation.x, th - kn + Math.max(0, kn - 0.5) * 0.4, fk);
      }
    }

    // Kepala: menatap dokter (kontak mata) + gerak dari gestur.
    const neckBase = F.neckX;
    const lookW = clamp((this.mode === 'walk' || this.mode === 'turn' ? 0.55 : 0.92) - F.fLookOff, 0, 1);
    const headWorld = c.headBall.getWorldPosition(this.v1);
    const dir = this.v2.copy(this.eyeTarget).sub(headWorld);
    c.chest.getWorldQuaternion(this.q1).invert();
    dir.applyQuaternion(this.q1).normalize();
    const yaw = clamp(Math.atan2(dir.x, dir.z), -1.05, 1.05) * lookW;
    const pitch = clamp(Math.atan2(-dir.y, Math.hypot(dir.x, dir.z)), -0.5, 0.5) * lookW;
    const hx = this.damp('headXf', F.headX + pitch * 0.62, k);
    const hy = this.damp('headYf', F.headY + yaw * 0.62, k);
    const hz = this.damp('headZf', F.headZ, k);
    c.neck.rotation.set(this.damp('neckXf', neckBase + pitch * 0.38, k), this.damp('neckYf', yaw * 0.38, k), 0);
    c.head.rotation.set(hx, hy, hz);
    c.neck.updateMatrixWorld(true);

    this.solveArm('L', dt, snap);
    this.solveArm('R', dt, snap);
  }

  /** IK kaki dua-ruas di bidang sagital + abduksi kecil; telapak tetap datar. */
  private solveLeg(leg: Limb, side: Side, ankle: Vector3, hipsPos: Vector3): void {
    const d = this.character.dims;
    const hipX = hipsPos.x + sign(side) * d.hipHalf;
    const hipY = hipsPos.y - d.hipDrop;
    const dx = ankle.x - hipX;
    const dy = ankle.y - hipY;
    const dz = ankle.z - hipsPos.z;
    const L1 = d.thigh;
    const L2 = d.shin;
    const plane = Math.hypot(dy, dz);
    const dist = clamp(Math.hypot(plane, dx), 0.05, L1 + L2 - 0.001);
    const gamma = Math.atan2(dz, -dy);
    const flex = Math.PI - Math.acos(clamp((L1 * L1 + L2 * L2 - dist * dist) / (2 * L1 * L2), -1, 1));
    const alpha = Math.acos(clamp((L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist), -1, 1));
    const thigh = gamma + alpha;
    leg.upper.rotation.set(-thigh, 0, Math.atan2(dx, Math.max(0.05, plane)));
    leg.lower.rotation.set(flex, 0, 0);
    leg.end.rotation.set(thigh - flex, 0, 0);
  }

  /** Lengan: FK (ayunan/istirahat) dicampur dengan IK dua-ruas menuju target. */
  private solveArm(side: Side, dt: number, snap: boolean): void {
    const c = this.character;
    const d = c.dims;
    const g = this.armGoal[side];
    const arm = side === 'L' ? c.armL : c.armR;
    const sh = side === 'L' ? c.shoulderL : c.shoulderR;
    const qFk = this.q1.setFromEuler(this.e1.set(-g.fkX, 0, g.fkZ));
    let elbow = g.fkElbow;
    if (g.ik > 0.001) {
      const L1 = d.upperArm;
      const L2 = d.foreArm + 0.045 * d.s;
      const v = this.v1.copy(g.target);
      c.chest.worldToLocal(v);
      v.sub(sh.position);
      let dist = v.length();
      const maxD = L1 + L2 - 0.004;
      if (dist > maxD) {
        v.multiplyScalar(maxD / dist);
        dist = maxD;
      }
      if (dist < 0.07) {
        v.set(0, -0.07, 0.01);
        dist = v.length();
      }
      const dir = this.v2.copy(v).divideScalar(dist);
      const A = Math.acos(clamp((L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist), -1, 1));
      const bend = Math.PI - Math.acos(clamp((L1 * L1 + L2 * L2 - dist * dist) / (2 * L1 * L2), -1, 1));
      const orth = this.v3.copy(g.pole).addScaledVector(dir, -g.pole.dot(dir));
      if (orth.lengthSq() < 1e-6) orth.set(sign(side), 0, 0);
      orth.normalize();
      const upperDir = this.v4.copy(dir).multiplyScalar(Math.cos(A)).addScaledVector(orth, Math.sin(A));
      // Arah lengan bawah & sumbu tekuk siku.
      const fore = this.v5.copy(v).addScaledVector(upperDir, -L1).normalize();
      const n = fore.addScaledVector(upperDir, -fore.dot(upperDir));
      if (n.lengthSq() < 1e-6) n.copy(orth).multiplyScalar(-1);
      n.normalize();
      const yAxis = this.v2.copy(upperDir).multiplyScalar(-1);
      const xAxis = this.v3.copy(yAxis).cross(n).normalize();
      this.m1.makeBasis(xAxis, yAxis, n);
      const qIk = this.q2.setFromRotationMatrix(this.m1);
      qFk.slerp(qIk, clamp(g.ik, 0, 1));
      elbow = lerp(g.fkElbow, bend, clamp(g.ik, 0, 1));
    }
    const cur = this.armCur[side];
    const k = snap ? 1 : 1 - Math.exp(-10 * dt);
    cur.q.slerp(qFk, k);
    cur.elbow += (elbow - cur.elbow) * k;
    arm.upper.quaternion.copy(cur.q);
    arm.lower.rotation.set(-cur.elbow, 0, 0);
  }
}
