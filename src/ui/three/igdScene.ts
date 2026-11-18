/**
 * Sutradara adegan 3D mode Dokter Jaga IGD. Menerjemahkan keadaan shift (src/core/igd) menjadi
 * gambaran ruang IGD yang hidup:
 *
 * - Kedatangan pasien lewat pintu IGD sesuai cara datang: berjalan sendiri, dipapah keluarga,
 *   kursi roda didorong keluarga, brankar didorong 2 paramedis (lampu ambulans menyala), atau
 *   digendong orang tua. Pasien menunggu di kursi tunggu/parkir brankar sampai mendapat bed,
 *   lalu dipindahkan ke bed (transfer dari brankar/kursi roda, atau berjalan lalu berbaring).
 * - Tampilan klinis dinamis dari fisiologi: kesadaran (mata, kontak mata, kepala lunglai), pola
 *   & frekuensi napas, sesak, ekspresi nyeri/cemas, kejang, henti jantung, warna kulit (sianosis,
 *   pucat, kemerahan), posisi (setengah duduk, miring, tungkai diangkat), dan perlengkapan
 *   (sungkup, NRM, NIV, ETT, BVM, collar, pad, elektroda, infus + kantong yang tergantung).
 * - Perawat berjalan ke pasien sesuai tugas yang Anda berikan dan memeragakannya (TTV, pasang
 *   infus, memberi obat, RJP berirama, ventilasi BVM), lalu kembali ke meja perawat.
 * - Monitor dinding tiap bed & monitor sentral di meja perawat menampilkan tanda vital langsung.
 * - Kamera (mata dokter) berpindah halus ke bed pasien yang dipilih; ketuk bed untuk memilih.
 */
import { Color, CylinderGeometry, Group, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, type Object3D, PlaneGeometry, Raycaster, type SkinnedMesh, Vector2, Vector3 } from 'three';
import { type PatientAppearance, speechTimeline } from '../../core/appearance';
import { pupilSizes } from '../../core/igd/assessment';
import { DEFAULT_BEDS } from '../../core/igd/catalog';
import { patientById, vitalsOf } from '../../core/igd/engine';
import type { EdAction, EdPatient, EdShift, EdTask, InformantId } from '../../core/igd/types';
import type { GameContent } from '../../core/types';
import type { IgdController } from '../igd/controller';
import { familyLook, patientLook, staffLook } from '../igd/looks';
import { drawMonitor, monitorStateOf } from '../igd/monitorDraw';
import { Actor, type BedPose, type BodyPoint, type HandsPose } from './actor';
import { buildIgdRoom, IGD_LAYOUT, type IgdBay, type IgdRoom } from './igdRoom';
import { Gear, Stretcher, Tube, Wheelchair } from './igdProps';
import { BloodFx, StainSurface } from './bloodFx';
import { type Wound, WoundSet } from './wounds';
import { bleedingRate, bloodVolumeMl, type InjuryRegion } from '../../core/injury';
import type { CameraRig, Stage, StageUpdatable } from './stage';

const L = IGD_LAYOUT;
const OUT_ENTR = new Vector3(8.8, 0, 1.35);
const GATE_ENTR = new Vector3(5.7, 0, 1.35);
const OUT_EXIT = new Vector3(-8.4, 0, 0.9);
const GATE_EXIT = new Vector3(-5.85, 0, 0.9);
const CLERK_SEAT = { x: -2.25, z: 2.1 };
const LIMBS: ReadonlySet<InjuryRegion> = new Set(['paha', 'tungkai_bawah', 'pergelangan_kaki', 'lengan_atas', 'lengan_bawah']);

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const V = (x: number, z: number) => new Vector3(x, 0, z);
const angleDiff = (a: number, b: number) => {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
};

/** Titik yang bergerak menyusuri jalur (kendaraan: brankar/kursi roda). */
class Mover {
  readonly pos = new Vector3();
  /** Arah gerak (konvensi aktor: 0 = +Z). */
  yaw = 0;
  /** Arah tampilan (dihaluskan saat berbelok). */
  shown = 0;
  speed = 0;
  private path: Vector3[] = [];
  private i = 0;
  private done: (() => void) | null = null;

  constructor(private readonly maxSpeed = 0.85) {}

  go(points: Vector3[], onArrive: () => void): void {
    this.path = points.map((p) => p.clone());
    this.i = 0;
    this.done = onArrive;
  }

  get busy(): boolean {
    return this.i < this.path.length;
  }

  update(dt: number): void {
    const target = this.path[this.i];
    if (!target) {
      this.speed *= Math.exp(-6 * dt);
      return;
    }
    const dx = target.x - this.pos.x;
    const dz = target.z - this.pos.z;
    const dist = Math.hypot(dx, dz);
    let rest = dist;
    for (let k = this.i; k < this.path.length - 1; k++) rest += this.path[k]!.distanceTo(this.path[k + 1]!);
    const turning = Math.abs(angleDiff(Math.atan2(dx, dz), this.shown)) > 0.9 && dist > 0.05;
    const want = turning ? 0.12 : this.maxSpeed * clamp(rest / 0.9, 0.18, 1);
    this.speed += (want - this.speed) * (1 - Math.exp(-3 * dt));
    const step = this.speed * dt;
    if (dist <= Math.max(step, 0.02)) {
      this.pos.set(target.x, 0, target.z);
      this.i++;
      if (this.i >= this.path.length) {
        this.speed = 0;
        const cb = this.done;
        this.done = null;
        cb?.();
      }
    } else {
      this.yaw = Math.atan2(dx, dz);
      this.pos.x += (dx / dist) * step;
      this.pos.z += (dz / dist) * step;
    }
    const diff = angleDiff(this.yaw, this.shown);
    this.shown += clamp(diff, -2.4 * dt, 2.4 * dt);
  }
}

interface Vehicle {
  stretcher: Stretcher | null;
  chair: Wheelchair | null;
  mover: Mover;
  /** Pendorong (dikendalikan sebagai "boneka" mengikuti kendaraan). */
  crew: Actor[];
  /** Kru dibuang bersama kendaraan (paramedis/porter), bukan keluarga. */
  ownCrew: boolean;
}

interface PV {
  id: string;
  actor: Actor;
  look: PatientAppearance;
  gear: Gear;
  /** Keluarga pengantar (atau orang tua yang menggendong). */
  fam: Actor | null;
  famFree: boolean;
  /** Anak digendong/dipangku oleh `fam`. */
  carried: boolean;
  veh: Vehicle | null;
  /** Lokasi mapan: 'tunggu', 'parkir', 'bay:R1', 'radiologi', 'pergi' (null = belum/bergerak). */
  at: string | null;
  slot: number;
  busy: boolean;
  hidden: boolean;
  iv: Tube;
  o2: Tube;
  /** Waktu (detik nyata) mulai menempati lokasi — untuk keluarga datang mendekat. */
  since: number;
  /** Terjatuh/kolaps di lantai (henti jantung, kejang, tidak sadar sebelum mendapat bed). */
  floor: BedPose | null;
  /** Jenis tempat tunggu yang sedang dipesan (kursi tunggu/parkir brankar). */
  slotKind: 'tunggu' | 'parkir' | null;
  /** Luka yang terlihat & keadaan perdarahannya. */
  wounds: WoundSet | null;
  bleed: Map<string, { lost: number; since: number; rate: number }>;
  bleedT: number;
  /** Nadi & sistolik terakhir (untuk denyut pancaran darah). */
  hr: number;
  sbp: number;
  /** ml darah per genangan (permukaan:luka). */
  pools: Map<string, number>;
  /** Perlak di bawah bokong (perdarahan pervaginam) & bengkok (muntah darah). */
  pad: { mesh: Mesh; stain: StainSurface; bay: string } | null;
  basin: { group: Group; fill: Mesh; bay: string } | null;
  vagMl: number;
  hemaMl: number;
  /** Darah yang keluar sebelum tiba (meresap ke pakaian/kain pengantar). */
  vagPre: number;
  hemaPre: number;
}

interface NV {
  id: string;
  actor: Actor;
  key: string;
  /** Tugas & pasien yang sedang dikerjakan (untuk arah pandang). */
  patient: PV | null;
}

type ScenePerson = Actor;

export class IgdScene implements StageUpdatable {
  private room: IgdRoom | null = null;
  private active = false;
  private readonly pvs = new Map<string, PV>();
  private readonly nurses = new Map<string, NV>();
  private clerk: Actor | null = null;
  /** Kendaraan yang sedang pergi (setelah transfer) — dibuang saat tiba di luar. */
  /** Semua kendaraan aktif (brankar/kursi roda) — digerakkan tiap frame. */
  private readonly vehicles = new Set<Vehicle>();
  /** Orang yang sedang berjalan keluar lalu dihapus. */
  private readonly walkers: Actor[] = [];
  private readonly rig: CameraRig = { eye: L.overviewEye.clone(), focus: L.overviewFocus.clone(), fov: 1.3 };
  private time = 0;
  private monitorClock = 0;
  private centralClock = 0;
  private sirenUntil = 0;
  private door = 0;
  private exitDoor = 0;
  private peek: { until: number; point: Vector3; eye?: Vector3 } | null = null;
  private seed = 1;
  private shiftRef: EdShift | null = null;
  private readonly ray = new Raycaster();
  private blood: BloodFx | null = null;
  private readonly v1 = new Vector3();
  private readonly v2 = new Vector3();
  private readonly v3 = new Vector3();

  constructor(
    private readonly stage: Stage,
    private readonly igd: IgdController,
    private readonly content: GameContent,
  ) {}

  // -------------------------------------------------------------------------
  // Siklus hidup (dipanggil App/IgdController)
  // -------------------------------------------------------------------------

  enter(): void {
    if (!this.room) {
      this.room = buildIgdRoom({ shadows: true, beds: DEFAULT_BEDS.map((b) => ({ ...b })) });
      this.room.group.visible = false;
    }
    if (!this.blood) {
      this.blood = new BloodFx(this.stage.scene);
      for (const bay of this.room.bays.values()) for (const st of bay.stains) this.blood.addSurface(st);
    }
    if (this.active) return;
    this.active = true;
    this.stage.setAltRoom(this.room);
    this.stage.add(this);
    this.rig.eye.copy(L.overviewEye);
    this.rig.focus.copy(L.overviewFocus);
    this.rig.fov = 1.3;
    this.stage.setRig(this.rig);
    this.stage.setTapHandler((x, y) => this.tap(x, y));
    this.stage.setCanvasLabel('Ruang Instalasi Gawat Darurat');
    this.ensureStaff();
  }

  exit(): void {
    if (!this.active) return;
    this.active = false;
    this.clearPeople();
    this.stage.remove(this);
    this.stage.setRig(null);
    this.stage.setAltRoom(null);
    this.stage.setTapHandler(null);
    this.stage.setCanvasLabel('Ruang praktik dokter');
  }

  event(kind: string, detail?: { patientId?: string; action?: EdAction }): void {
    if (!this.active) return;
    if (kind === 'mulai') {
      this.clearPeople();
      this.shiftRef = this.igd.shift;
      this.seed = this.shiftRef?.seed ?? 1;
      this.ensureStaff();
      // Sesi baru: pasien pertama datang dengan animasi; sesi lanjutan: langsung di tempat.
      this.sync((this.igd.shift?.time ?? 0) > 5);
      return;
    }
    if (kind === 'aksi' && detail?.patientId && detail.action) this.onAction(detail.patientId, detail.action);
  }

  /** Rekonsiliasi keadaan shift → adegan (dipanggil tiap langkah jam). */
  sync(instant = false): void {
    if (!this.active || !this.room) return;
    const shift = this.igd.shift;
    if (!shift) return;
    if (shift !== this.shiftRef) {
      this.shiftRef = shift;
      this.seed = shift.seed;
      if (!instant) {
        this.clearPeople();
        instant = true;
      }
      this.ensureStaff();
    }
    const now = shift.time;
    this.room.setClock(shift.config.startClock + now / 60);
    for (const p of shift.patients) {
      if (p.status === 'akan_datang') continue;
      let pv = this.pvs.get(p.id);
      if (!pv) {
        if (p.status === 'keluar' || p.status === 'meninggal') continue;
        pv = this.createPatient(p, instant);
      }
      this.clinicalLook(pv, p, now);
      if (!pv.busy) this.collapseIfNeeded(pv);
      this.bleedSync(pv, p, now);
      if (!pv.busy) this.reconcile(pv, p, now, instant);
    }
    this.syncNurses(shift);
    this.syncBays(shift, now);
  }

  // -------------------------------------------------------------------------
  // Orang
  // -------------------------------------------------------------------------

  private newActor(look: PatientAppearance, seed: number, detail: 'tinggi' | 'standar' = 'standar'): Actor {
    const a = new Actor(look, seed, detail);
    // Di ruang besar banyak orang: hanya badan (kulit menyatu) yang membentuk bayangan.
    a.character.root.traverse((o) => {
      if ((o as SkinnedMesh).isMesh) o.castShadow = !!(o as SkinnedMesh).isSkinnedMesh;
    });
    this.stage.scene.add(a.character.root);
    return a;
  }

  private removeActor(a: Actor | null): void {
    if (!a) return;
    a.dispose();
  }

  private ensureStaff(): void {
    const shift = this.igd.shift;
    if (!this.clerk) {
      const look = staffLook('petugas', 'Petugas pendaftaran', this.content, this.seed);
      const c = (this.clerk = this.newActor(look, this.seed ^ 0x2545f491));
      c.seatY = 0.5;
      c.setSeat(CLERK_SEAT.x, CLERK_SEAT.z, Math.PI);
      c.placeSeated();
      c.setHands({
        L: (o) => o.set(CLERK_SEAT.x + 0.1, 0.83 + Math.max(0, Math.sin(this.time * 9)) * 0.012, 1.8),
        R: (o) => o.set(CLERK_SEAT.x - 0.1, 0.83 + Math.max(0, Math.sin(this.time * 8 + 1.3)) * 0.012, 1.8),
        palmDown: true,
        lean: 0.12,
      });
    }
    if (!shift) return;
    shift.nurses.forEach((n, i) => {
      if (this.nurses.has(n.id)) return;
      const look = staffLook('perawat', n.name, this.content, this.seed);
      const a = this.newActor(look, this.seed ^ (0x9e3779b9 + i * 7919));
      const spot = L.station[i % L.station.length]!;
      a.placeAt(spot, Math.PI);
      this.nurses.set(n.id, { id: n.id, actor: a, key: `idle:${i}`, patient: null });
    });
  }

  private clearPeople(): void {
    for (const pv of this.pvs.values()) this.disposePV(pv);
    this.pvs.clear();
    for (const n of this.nurses.values()) this.removeActor(n.actor);
    this.nurses.clear();
    for (const v of [...this.vehicles]) this.disposeVehicle(v);
    this.vehicles.clear();
    for (const w of this.walkers) this.removeActor(w);
    this.walkers.length = 0;
    this.removeActor(this.clerk);
    this.clerk = null;
    this.shiftRef = null;
    this.peek = null;
    this.timers = [];
    this.blood?.clearAll();
    if (this.room) for (const bay of this.room.bays.values()) this.resetBay(bay);
  }

  private track(v: Vehicle): Vehicle {
    this.vehicles.add(v);
    if (v.stretcher) this.blood?.addSurface(v.stretcher.stain);
    return v;
  }

  private disposeVehicle(v: Vehicle): void {
    this.vehicles.delete(v);
    if (v.stretcher) this.blood?.removeSurface(v.stretcher.stain);
    v.stretcher?.dispose();
    v.chair?.dispose();
    if (v.ownCrew) for (const c of v.crew) this.removeActor(c);
    else
      for (const c of v.crew) {
        c.follow(null);
        c.setHands(null);
      }
  }

  private disposePV(pv: PV): void {
    pv.wounds?.dispose();
    this.removeBloodProps(pv);
    this.blood?.cleanFloor(pv.id);
    pv.gear.dispose();
    pv.iv.dispose();
    pv.o2.dispose();
    if (pv.veh) this.disposeVehicle(pv.veh);
    this.removeActor(pv.actor);
    this.removeActor(pv.fam);
  }

  private createPatient(p: EdPatient, instant: boolean): PV {
    const look = patientLook(p, this.content, this.seed);
    // Pasien: detail tinggi (wajah, mata, kulit diperiksa dari dekat).
    const actor = this.newActor(look, (this.seed ^ Number.parseInt(p.id.replace(/\D/g, '') || '1', 10) * 2654435761) >>> 0, 'tinggi');
    actor.clinic = { alert: 1, seizure: false, lifeless: false, compressions: false, agitation: 0 };
    const carried = p.arrivalMode === 'digendong';
    const famChance = p.age < 15 || p.arrivalMode === 'dipapah' || p.arrivalMode === 'kursi_roda' || carried ? 1 : p.arrivalMode === 'brankar' ? 0.45 : 0.6;
    const roll = ((this.seed ^ p.id.length * 977 ^ p.arrivalMode.length * 131) >>> 0) % 100 / 100;
    const fam = roll < famChance ? this.newActor(familyLook(p, this.content, this.seed), (this.seed * 31 + p.id.length * 7 + 3) >>> 0) : null;
    const iv = new Tube('#dfe9ee');
    const o2 = new Tube('#bfe3d4');
    this.stage.scene.add(iv.line, o2.line);
    const pv: PV = { id: p.id, actor, look, gear: new Gear(actor), fam, famFree: true, carried, veh: null, at: null, slot: 0, busy: false, hidden: false, iv, o2, since: this.time, floor: null, slotKind: null, wounds: null, bleed: new Map(), bleedT: this.igd.shift?.time ?? 0, hr: 80, sbp: 120, pools: new Map(), pad: null, basin: null, vagMl: 0, hemaMl: 0, vagPre: 0, hemaPre: 0 };
    this.initWounds(pv, p);
    this.pvs.set(p.id, pv);
    if (!instant) this.arrive(pv, p);
    return pv;
  }

  // -------------------------------------------------------------------------
  // Tujuan & perpindahan
  // -------------------------------------------------------------------------

  private goalOf(p: EdPatient, now: number): string {
    if (p.status === 'keluar' || p.status === 'meninggal') return 'pergi';
    if (p.awayUntil !== null && now < p.awayUntil) return 'radiologi';
    if (p.bedId && this.room!.bays.has(p.bedId)) return `bay:${p.bedId}`;
    return p.arrivalMode === 'brankar' ? 'parkir' : 'tunggu';
  }

  private bayOf(key: string | null): IgdBay | null {
    return key?.startsWith('bay:') ? (this.room!.bays.get(key.slice(4)) ?? null) : null;
  }

  private freeSlot(kind: 'tunggu' | 'parkir', pv: PV): number {
    const used = new Set<number>();
    for (const o of this.pvs.values()) if (o !== pv && o.slotKind === kind) used.add(o.slot);
    const n = kind === 'tunggu' ? L.waiting.length + L.overflow.length : L.parking.length;
    pv.slotKind = kind;
    for (let i = 0; i < n; i++) if (!used.has(i)) return i;
    return pv.id.length % n;
  }

  /** Tempat tunggu: kursi (duduk) atau tempat berdiri bila kursi penuh. */
  private waitSpot(slot: number): { x: number; z: number; seat: boolean } {
    const w = L.waiting[slot];
    if (w) return { ...w, seat: true };
    const o = L.overflow[(slot - L.waiting.length) % L.overflow.length]!;
    return { ...o, seat: false };
  }

  private reconcile(pv: PV, p: EdPatient, now: number, instant: boolean): void {
    const goal = this.goalOf(p, now);
    if (goal === pv.at) return;
    if (instant || pv.at === null) {
      if (pv.at === null && !instant) return; // kedatangan masih berjalan
      this.placeInstant(pv, p, goal);
      return;
    }
    this.transition(pv, p, goal);
  }

  /** Letakkan langsung (melanjutkan sesi tersimpan). */
  private placeInstant(pv: PV, _p: EdPatient, goal: string): void {
    const a = pv.actor;
    pv.since = this.time;
    pv.slotKind = null;
    if (goal === 'pergi') {
      this.disposePV(pv);
      this.pvs.delete(pv.id);
      return;
    }
    if (pv.veh) {
      this.disposeVehicle(pv.veh);
      pv.veh = null;
    }
    pv.carried = false;
    pv.floor = null;
    a.carry(null);
    pv.fam?.hold(null);
    a.character.root.visible = true;
    pv.hidden = false;
    const bay = this.bayOf(goal);
    if (goal === 'radiologi') {
      a.character.root.visible = false;
      pv.hidden = true;
    } else if (bay?.pose) {
      a.lie(() => this.bedPose(pv, bay), 0);
    } else if (bay?.seat) {
      this.sitAt(a, bay.seat.x, bay.seat.z, bay.seat.yaw, bay.seat.y, true);
    } else if (goal === 'parkir') {
      pv.slot = this.freeSlot('parkir', pv);
      const s = L.parking[pv.slot]!;
      const st = new Stretcher();
      st.place(s.x, s.z, Math.PI / 2);
      this.stage.scene.add(st.group);
      pv.veh = this.track({ stretcher: st, chair: null, mover: new Mover(), crew: [], ownCrew: true });
      pv.veh.mover.pos.set(s.x, 0, s.z);
      pv.veh.mover.yaw = pv.veh.mover.shown = -Math.PI / 2;
      a.lie(() => st.pose(), 0);
    } else {
      pv.slot = this.freeSlot('tunggu', pv);
      const w = this.waitSpot(pv.slot);
      if (w.seat) this.sitAt(a, w.x, w.z, -Math.PI / 2, 0.45, true);
      else a.placeAt(V(w.x, w.z), -Math.PI / 2);
    }
    pv.at = goal === 'parkir' || goal === 'tunggu' ? goal : goal;
    this.placeFamily(pv, true);
  }

  private sitAt(a: Actor, x: number, z: number, yaw: number, seatY: number, instant: boolean, onDone?: () => void): void {
    a.seatY = seatY;
    a.setSeat(x, z, yaw);
    if (instant) {
      a.placeSeated();
      onDone?.();
      return;
    }
    a.walkPath([...this.route(a.character.root.position, a.standPoint()).slice(0, -1), a.standPoint()], yaw, () => a.sit(() => onDone?.()));
  }

  /** Rute berjalan lewat lorong (menghindari bed & meja perawat). */
  private route(from: Vector3, to: Vector3): Vector3[] {
    const lane = L.laneZ;
    const pts: Vector3[] = [];
    let start = from.clone();
    if (from.x > 6.3) {
      pts.push(V(GATE_ENTR.x, clamp(from.z, 0.4, 2.3)));
      start = pts.at(-1)!;
    } else if (from.x < -6.3) {
      pts.push(GATE_EXIT.clone());
      start = pts.at(-1)!;
    }
    const gate = to.x > 6.3 ? V(GATE_ENTR.x, clamp(to.z, 0.4, 2.3)) : to.x < -6.3 ? GATE_EXIT.clone() : null;
    const end = gate ?? to;
    // Di dalam area bed yang sama/bersebelahan: memutar lewat ujung kaki bed, tidak ke lorong.
    if (!gate && pts.length === 0 && start.z < -1.9 && end.z < -1.9 && Math.abs(start.x - end.x) < 2.2) {
      if (Math.abs(start.x - end.x) > 0.25) pts.push(V(start.x, -1.95), V(end.x, -1.95));
      pts.push(to.clone());
      return pts;
    }
    const open = (q: Vector3) => q.x > 1.6 && q.z > lane + 0.6;
    if (!(open(start) && open(end))) {
      if (Math.abs(start.z - lane) > 0.3) pts.push(V(start.x, lane));
      if (Math.abs(end.z - lane) > 0.3 || Math.abs(end.x - start.x) > 0.3) pts.push(V(end.x, lane));
    }
    if (gate) pts.push(gate);
    pts.push(to.clone());
    return pts;
  }

  private bedPose(pv: PV, bay: IgdBay): BedPose {
    const d = this.shiftRef && patientById(this.shiftRef, pv.id)?.devices;
    const pos = d?.position ?? 'terlentang';
    return bay.pose!(pos === 'miring_kiri' ? 1.15 : 0, pos === 'kaki_diangkat' ? 0.5 : 0);
  }

  /** Sudut sandaran sesuai posisi pasien. */
  private inclineOf(p: EdPatient): number {
    const d = p.devices;
    if (p.physio.arrest || p.physio.dead || d.cpr) return 0;
    switch (d.position) {
      case 'semi_fowler':
        return 0.62;
      case 'duduk':
        return 0.98;
      case 'miring_kiri':
      case 'kaki_diangkat':
        return 0.04;
      default:
        return d.adjunct === 'ett' ? 0.45 : 0.12;
    }
  }

  /** Pasien yang belum di bed kolaps ke lantai saat henti jantung/kejang/tidak sadar. */
  private collapseIfNeeded(pv: PV): void {
    const a = pv.actor;
    const cl = a.clinic;
    if (!cl || a.lying || pv.carried || pv.veh || pv.floor || pv.hidden) return;
    if (!(cl.lifeless || cl.seizure || cl.alert <= 0.1)) return;
    const y = a.facing;
    const root = a.character.root.position;
    const fwd = a.mode === 'seated' ? 0.62 : 0.15;
    const pose: BedPose = { x: root.x + Math.sin(y) * fwd, y: 0.0, z: root.z + Math.cos(y) * fwd, yaw: y + Math.PI, incline: 0, roll: 0, legsUp: 0 };
    pv.floor = pose;
    a.carry(null);
    a.lie(() => pose, 0.9);
    if (pv.fam && pv.famFree) {
      pv.fam.walkPath([V(pose.x + Math.cos(y) * 0.7, pose.z - Math.sin(y) * 0.7)], y - Math.PI / 2, () => {});
    }
  }

  // --- Kedatangan --------------------------------------------------------------

  private arrive(pv: PV, p: EdPatient): void {
    pv.busy = true;
    const a = pv.actor;
    const start = OUT_ENTR.clone().add(V(0.6, (p.id.length % 3) * 0.2 - 0.2));
    const finish = (at: string) => {
      pv.at = at;
      pv.busy = false;
      pv.since = this.time;
      this.placeFamily(pv, false);
    };
    if (p.arrivalMode === 'brankar') {
      this.sirenUntil = this.time + 9;
      pv.slot = this.freeSlot('parkir', pv);
      const s = L.parking[pv.slot]!;
      const st = new Stretcher();
      this.stage.scene.add(st.group);
      const crew = [0, 1].map((i) => this.newActor(staffLook('paramedis', `Paramedis ${p.id}-${i}`, this.content, this.seed), (this.seed + i * 104729 + p.id.length) >>> 0));
      const veh = this.track({ stretcher: st, chair: null, mover: new Mover(0.95), crew, ownCrew: true });
      veh.mover.pos.copy(start);
      veh.mover.yaw = veh.mover.shown = -Math.PI / 2;
      pv.veh = veh;
      this.attachStretcherCrew(veh, pv);
      a.lie(() => st.pose(), 0);
      if (pv.fam) pv.fam.placeAt(start.clone().add(V(1.4, 0.5)), -Math.PI / 2);
      if (pv.fam) pv.fam.walkPath([V(7.2, s.z + 0.7), V(s.x + 1.3, s.z + 0.7)], Math.PI, () => {});
      veh.mover.go([V(7.4, s.z), V(6.1, s.z), V(s.x, s.z)], () => finish('parkir'));
      return;
    }
    pv.slot = this.freeSlot('tunggu', pv);
    const w = this.waitSpot(pv.slot);
    if (p.arrivalMode === 'kursi_roda' && pv.fam) {
      const ch = new Wheelchair();
      this.stage.scene.add(ch.group);
      const veh = this.track({ stretcher: null, chair: ch, mover: new Mover(0.9), crew: [pv.fam], ownCrew: false });
      veh.mover.pos.copy(start);
      veh.mover.yaw = veh.mover.shown = -Math.PI / 2;
      pv.veh = veh;
      pv.famFree = false;
      this.attachChairCrew(veh);
      a.seatY = ch.seatY;
      a.carryLegs = 'chair';
      a.carry(() => ch.anchor());
      veh.mover.go([...this.route(start, V(w.seat ? 5.2 : w.x, w.z))], () => {
        veh.mover.yaw = -Math.PI / 2;
        finish('tunggu');
      });
      return;
    }
    if (p.arrivalMode === 'digendong' && pv.fam) {
      const parent = pv.fam;
      parent.placeAt(start, -Math.PI / 2);
      pv.famFree = false;
      a.carry(() => parent.lapAnchor(a));
      parent.hold(a);
      parent.seatY = 0.45;
      parent.setSeat(w.x, w.z, -Math.PI / 2);
      if (w.seat) parent.walkPath([...this.route(start, parent.standPoint())], -Math.PI / 2, () => parent.sit(() => finish('tunggu')));
      else parent.walkPath(this.route(start, V(w.x, w.z)), -Math.PI / 2, () => finish('tunggu'));
      return;
    }
    // Berjalan sendiri / dipapah.
    a.placeAt(start, -Math.PI / 2);
    a.seatY = 0.45;
    a.setSeat(w.x, w.z, -Math.PI / 2);
    if (p.arrivalMode === 'dipapah' && pv.fam) this.supportWalk(pv);
    else if (pv.fam) {
      pv.fam.placeAt(start.clone().add(V(1.1, 0.3)), -Math.PI / 2);
      this.followBehind(pv);
    }
    if (!w.seat) {
      a.walkPath(this.route(start, V(w.x, w.z)), -Math.PI / 2, () => {
        this.releaseFamily(pv);
        finish('tunggu');
      });
      return;
    }
    a.walkPath(this.route(start, a.standPoint()), -Math.PI / 2, () =>
      a.sit(() => {
        this.releaseFamily(pv);
        finish('tunggu');
      }),
    );
  }

  /** Keluarga memapah: berjalan di sisi kanan pasien, tangan di punggung & lengan pasien. */
  private supportWalk(pv: PV): void {
    const fam = pv.fam!;
    const a = pv.actor;
    pv.famFree = false;
    fam.follow(() => {
      const r = a.character.root.position;
      const y = a.facing;
      return { x: r.x - Math.cos(y) * 0.46, z: r.z + Math.sin(y) * 0.46, yaw: y, speed: a.moving ? pv.look.walkSpeed : 0 };
    });
    fam.setHands({ L: (o) => a.bodyPoint('punggung', o, 'L'), R: (o) => a.bodyPoint('lengan_atas', o, 'R') });
    a.setHands({ R: (o) => fam.bodyPoint('bahu', o, 'L') });
  }

  /** Keluarga berjalan di belakang pasien. */
  private followBehind(pv: PV): void {
    const fam = pv.fam!;
    const a = pv.actor;
    pv.famFree = false;
    fam.follow(() => {
      const r = a.character.root.position;
      const y = a.facing;
      return { x: r.x - Math.sin(y) * 0.75 - Math.cos(y) * 0.3, z: r.z - Math.cos(y) * 0.75 + Math.sin(y) * 0.3, yaw: y, speed: a.moving ? pv.look.walkSpeed : 0 };
    });
  }

  private releaseFamily(pv: PV): void {
    pv.fam?.follow(null);
    pv.fam?.setHands(null);
    pv.actor.setHands(null);
    pv.famFree = true;
  }

  /** Keluarga mendekat & berdiri di samping pasien. */
  private placeFamily(pv: PV, instant: boolean): void {
    const fam = pv.fam;
    if (!fam || !pv.famFree || pv.carried) return;
    const spot = this.familySpot(pv);
    if (!spot) return;
    if (instant) fam.placeAt(spot.pos, spot.yaw);
    else fam.walkPath(this.route(fam.character.root.position, spot.pos), spot.yaw, () => {});
  }

  private familySpot(pv: PV): { pos: Vector3; yaw: number } | null {
    const bay = this.bayOf(pv.at);
    if (pv.at === 'radiologi' || pv.at === 'pergi') return null;
    if (bay?.pose) return { pos: V(bay.x - 0.74, -2.55), yaw: 2.6 };
    if (bay?.seat) return { pos: V(bay.x - 0.62, bay.seat.z + 0.75), yaw: 2.4 };
    if (pv.at === 'parkir') {
      const s = L.parking[pv.slot]!;
      return { pos: V(s.x + 1.3, s.z + 0.5), yaw: -2.2 };
    }
    if (pv.at === 'tunggu') {
      const w = this.waitSpot(pv.slot);
      return w.seat ? { pos: V(w.x - 0.78, w.z - 0.42), yaw: 1.0 } : { pos: V(w.x - 0.5, w.z + 0.45), yaw: 2.2 };
    }
    return null;
  }

  // --- Kru kendaraan ------------------------------------------------------------

  /** Paramedis mengikuti brankar: satu mendorong di ujung kaki, satu menuntun di sisi depan. */
  private attachStretcherCrew(veh: Vehicle, pv: PV | null): void {
    const st = veh.stretcher!;
    const m = veh.mover;
    const [rear, lead] = veh.crew;
    if (rear) {
      rear.follow(() => {
        const r = m.shown + Math.PI;
        const p = st.local(0, 0, 1.32, this.v1);
        return { x: p.x, z: p.z, yaw: r - Math.PI, speed: m.speed };
      });
      rear.setHands({ L: (o) => st.local(-0.22, st.top + 0.06, 0.99, o), R: (o) => st.local(0.22, st.top + 0.06, 0.99, o), lean: 0.12 });
    }
    if (lead) {
      const self = this;
      lead.follow(() => {
        const cpr = !!pv && this.cprByCrew(pv);
        const p = cpr ? st.local(0.66, 0, -0.32, this.v2) : st.local(0.5, 0, -0.85, this.v2);
        const yaw = cpr ? m.shown + Math.PI / 2 : m.shown;
        return { x: p.x, z: p.z, yaw, speed: m.speed };
      });
      lead.setHands({
        L: (o) => (pv && this.cprByCrew(pv) ? pv.actor.bodyPoint('dada', o) : st.local(0.3, st.top + 0.1, -0.7, o)),
        R: (o) => (pv && this.cprByCrew(pv) ? pv.actor.bodyPoint('dada', o).add(this.v3.set(0, 0.012, 0)) : null),
        get cpr() {
          return !!pv && self.cprByCrew(pv);
        },
        get lean() {
          return pv && self.cprByCrew(pv) ? 0.35 : 0;
        },
      });
    }
  }

  /** RJP oleh paramedis selama di brankar (belum ada perawat yang melakukan RJP). */
  private cprByCrew(pv: PV): boolean {
    const shift = this.shiftRef;
    const p = shift && patientById(shift, pv.id);
    if (!p || !p.devices.cpr) return false;
    return !shift!.tasks.some((t) => t.patientId === pv.id && t.nurseId && t.action.kind === 'proc' && t.action.id === 'rjp');
  }

  private attachChairCrew(veh: Vehicle): void {
    const ch = veh.chair!;
    const m = veh.mover;
    const pusher = veh.crew[0]!;
    ch.place(m.pos.x, m.pos.z, m.shown);
    pusher.follow(() => {
      const y = m.shown;
      return { x: m.pos.x - Math.sin(y) * 0.72, z: m.pos.z - Math.cos(y) * 0.72, yaw: y, speed: m.speed };
    });
    pusher.setHands({ L: (o) => ch.handle(1, o), R: (o) => ch.handle(-1, o), lean: 0.1 });
  }

  // --- Perpindahan antarlokasi -----------------------------------------------------

  private transition(pv: PV, p: EdPatient, goal: string): void {
    const a = pv.actor;
    const from = pv.at;
    const bay = this.bayOf(goal);
    const fromBay = this.bayOf(from);
    pv.busy = true;
    const settle = () => {
      pv.at = goal;
      pv.busy = false;
      pv.since = this.time;
      this.placeFamily(pv, false);
    };

    pv.slotKind = null;
    if (goal === 'pergi') return this.depart(pv, p);
    if (goal === 'radiologi') return this.toRadiology(pv, fromBay);
    if (from === 'radiologi') return this.fromRadiology(pv, bay, settle);

    // Dari brankar (parkir) ke bed/kursi.
    if (pv.veh?.stretcher && bay) {
      const veh = pv.veh;
      const st = veh.stretcher!;
      if (bay.pose) {
        const slotZ = veh.mover.pos.z;
        const path = from === 'parkir' ? [V(2.75, slotZ), V(2.75, L.laneZ), V(bay.x + 0.95, L.laneZ), V(bay.x + 0.95, -3.25)] : [...this.route(veh.mover.pos, V(bay.x + 0.95, -3.25))];
        veh.mover.go(path, () => {
          // Transfer brankar → bed (geser).
          for (const c of veh.crew) c.setHands({ L: (o) => a.bodyPoint('bahu', o, 'L'), R: (o) => a.bodyPoint('pinggul', o, 'L'), lean: 0.45 });
          a.lie(() => this.bedPose(pv, bay), 1.9);
          this.later(2.3, () => {
            pv.veh = null;
            this.attachStretcherCrew(veh, null);
            veh.mover.go([V(bay.x + 0.95, L.laneZ), V(5.0, L.laneZ), V(GATE_ENTR.x, 1.1), OUT_ENTR.clone().add(V(1, 0))], () => this.dropVehicle(veh));
            settle();
          });
        });
        void st;
        return;
      }
      // Ke kursi observasi: bangun dari brankar lalu berjalan.
      a.rise(st.local(0.55, 0, 0, this.v1).clone(), veh.mover.shown);
      pv.veh = null;
      this.attachStretcherCrew(veh, null);
      veh.mover.go([V(5.6, veh.mover.pos.z), OUT_ENTR.clone().add(V(1, 0))], () => this.dropVehicle(veh));
      this.sitAt(a, bay.seat!.x, bay.seat!.z, bay.seat!.yaw, bay.seat!.y, false, settle);
      return;
    }

    // Dari kursi roda ke bed/kursi.
    if (pv.veh?.chair && bay) {
      const veh = pv.veh;
      const ch = veh.chair!;
      const target = bay.pose ? V(bay.x + 0.85, -3.15) : V(bay.seat!.x + 0.7, bay.seat!.z + 0.9);
      veh.mover.go(this.route(veh.mover.pos, target), () => {
        const done = () => {
          pv.veh = null;
          a.carryLegs = 'lap';
          // Keluarga mendorong kursi roda kosong keluar, lalu kembali ke pasien.
          veh.mover.go([V(veh.mover.pos.x, L.laneZ), V(5.0, L.laneZ), GATE_ENTR.clone()], () => {
            this.dropVehicle(veh);
            pv.famFree = true;
            this.placeFamily(pv, false);
          });
          settle();
        };
        if (bay.pose) {
          a.lie(() => this.bedPose(pv, bay), 1.8);
          this.later(1.9, done);
        } else {
          const anc = ch.anchor();
          a.setSeat(anc.x, anc.z, anc.yaw);
          a.carry(null);
          a.placeSeated();
          a.stand(() => this.sitAt(a, bay.seat!.x, bay.seat!.z, bay.seat!.yaw, bay.seat!.y, false, done));
        }
      });
      return;
    }

    // Anak digendong orang tua.
    if (pv.carried && pv.fam) {
      const parent = pv.fam;
      const go = () => {
        if (bay?.pose) {
          parent.walkPath(this.route(parent.character.root.position, V(bay.x + 0.62, L.hingeZ - 0.15)), -Math.PI / 2, () => {
            parent.hold(null);
            pv.carried = false;
            a.lie(() => this.bedPose(pv, bay), 1.3);
            this.later(1.4, () => {
              pv.famFree = true;
              settle();
            });
          });
        } else if (bay?.seat) {
          parent.seatY = bay.seat.y;
          parent.setSeat(bay.seat.x, bay.seat.z, bay.seat.yaw);
          parent.walkPath(this.route(parent.character.root.position, parent.standPoint()), bay.seat.yaw, () => parent.sit(settle));
        } else settle();
      };
      if (parent.mode === 'seated') parent.stand(go);
      else go();
      return;
    }

    // Berbaring di bed → bed lain (bed didorong) / diangkat dari lantai ke bed: meluncur.
    if (a.lying && bay?.pose) {
      a.lie(() => this.bedPose(pv, bay), pv.floor ? 2.2 : 2.8);
      pv.floor = null;
      this.later(2.9, settle);
      return;
    }
    if (a.lying && pv.floor) {
      const f = pv.floor;
      pv.floor = null;
      a.rise(V(f.x + 0.4, f.z), a.facing);
    }
    // Berbaring → kursi: bangun, berjalan.
    if (a.lying && bay?.seat) {
      a.rise(V(fromBay ? fromBay.x + 0.62 : a.character.root.position.x, L.hingeZ), -Math.PI / 2);
      this.sitAt(a, bay.seat.x, bay.seat.z, bay.seat.yaw, bay.seat.y, false, settle);
      return;
    }
    // Duduk/berdiri → bed atau kursi.
    const walkTo = () => {
      if (pv.fam && !pv.famFree) this.followBehind(pv);
      if (bay?.pose) {
        a.walkPath(this.route(a.character.root.position, V(bay.x + 0.6, L.hingeZ + 0.05)), -Math.PI / 2, () => {
          a.lie(() => this.bedPose(pv, bay), 1.7);
          this.later(1.8, () => {
            this.releaseFamily(pv);
            settle();
          });
        });
      } else if (bay?.seat) {
        this.sitAt(a, bay.seat.x, bay.seat.z, bay.seat.yaw, bay.seat.y, false, () => {
          this.releaseFamily(pv);
          settle();
        });
      } else settle();
    };
    if (pv.fam && p.arrivalMode === 'dipapah') this.supportWalk(pv);
    if (a.mode === 'seated') a.stand(walkTo);
    else walkTo();
  }

  /** Porter + brankar menjemput pasien ke radiologi (lewat pintu dalam). */
  private toRadiology(pv: PV, fromBay: IgdBay | null): void {
    const a = pv.actor;
    if (!fromBay?.pose) {
      a.character.root.visible = false;
      pv.hidden = true;
      pv.at = 'radiologi';
      pv.busy = false;
      return;
    }
    const veh = this.porterVehicle(OUT_EXIT);
    const side = V(fromBay.x + 0.95, -3.25);
    veh.mover.go([...this.route(OUT_EXIT, side)], () => {
      for (const c of veh.crew) c.setHands({ L: (o) => a.bodyPoint('bahu', o, 'R'), R: (o) => a.bodyPoint('pinggul', o, 'R'), lean: 0.4 });
      a.lie(() => veh.stretcher!.pose(), 1.9);
      this.later(2.2, () => {
        this.attachStretcherCrew(veh, null);
        veh.mover.go(this.route(veh.mover.pos, OUT_EXIT), () => {
          a.character.root.visible = false;
          pv.hidden = true;
          pv.at = 'radiologi';
          pv.busy = false;
          this.disposeVehicle(veh);
        });
      });
    });
  }

  private fromRadiology(pv: PV, bay: IgdBay | null, settle: () => void): void {
    const a = pv.actor;
    if (!bay?.pose) {
      a.character.root.visible = true;
      pv.hidden = false;
      if (bay?.seat) this.sitAt(a, bay.seat.x, bay.seat.z, bay.seat.yaw, bay.seat.y, true);
      settle();
      return;
    }
    const veh = this.porterVehicle(OUT_EXIT);
    a.lie(() => veh.stretcher!.pose(), 0);
    a.character.root.visible = true;
    pv.hidden = false;
    veh.mover.go(this.route(OUT_EXIT, V(bay.x + 0.95, -3.25)), () => {
      for (const c of veh.crew) c.setHands({ L: (o) => a.bodyPoint('bahu', o, 'R'), R: (o) => a.bodyPoint('pinggul', o, 'R'), lean: 0.4 });
      a.lie(() => this.bedPose(pv, bay), 1.9);
      this.later(2.2, () => {
        this.attachStretcherCrew(veh, null);
        veh.mover.go(this.route(veh.mover.pos, OUT_EXIT), () => this.disposeVehicle(veh));
        settle();
      });
    });
  }

  private porterVehicle(at: Vector3, covered = false): Vehicle {
    const st = new Stretcher();
    st.incline = covered ? 0 : 0.3;
    this.stage.scene.add(st.group);
    const porter = this.newActor(staffLook('petugas', `Porter ${Math.round(this.time * 10)}`, this.content, this.seed), (this.seed + Math.round(this.time * 1000)) >>> 0);
    const veh = this.track({ stretcher: st, chair: null, mover: new Mover(0.85), crew: [porter], ownCrew: true });
    veh.mover.pos.copy(at);
    veh.mover.yaw = veh.mover.shown = at.x < 0 ? Math.PI / 2 : -Math.PI / 2;
    this.attachStretcherCrew(veh, null);
    return veh;
  }

  private dropVehicle(veh: Vehicle): void {
    this.disposeVehicle(veh);
  }

  /** Pasien meninggalkan IGD (pulang berjalan / dibawa brankar ke ruangan / jenazah). */
  private depart(pv: PV, p: EdPatient): void {
    const a = pv.actor;
    const bay = this.bayOf(pv.at);
    const dead = p.status === 'meninggal';
    const walkHome = !dead && p.disposition?.to === 'pulang' && !p.physio.arrest && vitalsOf(p, this.shiftRef!.time).gcs.total >= 14;
    const finish = () => {
      if (pv.fam && !pv.carried) {
        this.releaseFamily(pv);
        const fam = pv.fam;
        pv.fam = null;
        this.walkOut(fam, dead || walkHome ? OUT_ENTR : p.disposition?.to === 'rujuk' ? OUT_ENTR : OUT_EXIT);
      }
      this.disposePV(pv);
      this.pvs.delete(pv.id);
    };
    if (pv.hidden) return finish();
    if (walkHome || pv.carried) {
      if (pv.carried && pv.fam) {
        const parent = pv.fam;
        const go = () => parent.walkPath(this.route(parent.character.root.position, OUT_ENTR), null, () => finish());
        if (parent.mode === 'seated') parent.stand(go);
        else go();
        return;
      }
      if (pv.veh?.chair) {
        pv.veh.mover.go(this.route(pv.veh.mover.pos, OUT_ENTR), finish);
        return;
      }
      const go = () => {
        if (pv.fam && pv.famFree) this.followBehind(pv);
        a.walkPath(this.route(a.character.root.position, OUT_ENTR), null, finish);
      };
      if (a.lying) {
        a.rise(V(bay ? bay.x + 0.6 : a.character.root.position.x, bay ? L.hingeZ + 0.1 : a.character.root.position.z), -Math.PI / 2);
        this.later(0.4, go);
      } else if (a.mode === 'seated') a.stand(go);
      else go();
      return;
    }
    // Dibawa dengan brankar.
    const door = p.disposition?.to === 'rujuk' ? OUT_ENTR : OUT_EXIT;
    if (pv.veh?.stretcher) {
      const veh = pv.veh;
      veh.mover.go(this.route(veh.mover.pos, door), finish);
      return;
    }
    const veh = this.porterVehicle(door, dead);
    const target = bay?.pose ? V(bay.x + 0.95, -3.25) : bay?.seat ? V(bay.seat.x + 0.9, bay.seat.z + 0.9) : V(a.character.root.position.x - 0.9, a.character.root.position.z);
    veh.mover.go(this.route(door, target), () => {
      for (const c of veh.crew) c.setHands({ L: (o) => a.bodyPoint('bahu', o, 'R'), R: (o) => a.bodyPoint('pinggul', o, 'R'), lean: 0.4 });
      if (dead) a.character.root.visible = false;
      a.lie(() => veh.stretcher!.pose(), 1.8);
      if (dead) veh.stretcher!.setCovered(true);
      this.later(2.1, () => {
        this.attachStretcherCrew(veh, null);
        pv.veh = veh;
        if (bay) this.resetBay(bay);
        veh.mover.go(this.route(veh.mover.pos, door), finish);
      });
    });
  }

  private walkOut(a: Actor, door: Vector3): void {
    this.walkers.push(a);
    const go = () =>
      a.walkPath(this.route(a.character.root.position, door), null, () => {
        const i = this.walkers.indexOf(a);
        if (i >= 0) this.walkers.splice(i, 1);
        this.removeActor(a);
      });
    if (a.mode === 'seated') a.stand(go);
    else go();
  }

  // -------------------------------------------------------------------------
  // Tampilan klinis dari fisiologi
  // -------------------------------------------------------------------------

  private clinicalLook(pv: PV, p: EdPatient, now: number): void {
    const v = vitalsOf(p, now);
    const ph = p.physio;
    const dead = ph.dead || p.status === 'meninggal' || p.disposition?.to === 'meninggal';
    const arrest = !!ph.arrest || dead;
    const gcs = v.gcs.total;
    const sedated = p.devices.adjunct === 'ett';
    const alert = arrest ? 0 : sedated ? 0.05 : gcs >= 15 ? 1 : gcs >= 14 ? 0.82 : gcs >= 13 ? 0.66 : gcs >= 9 ? 0.4 : 0.1;
    const spo2 = v.spo2 ?? 97;
    const anxiety = ph.v.anxiety ?? 0;
    const agitation = alert >= 0.6 ? clamp(anxiety * 0.9 + (spo2 < 86 ? 0.35 : 0), 0, 1) : 0;
    const look = pv.look;
    pv.actor.clinic = { alert, seizure: ph.seizure && !arrest, lifeless: arrest, compressions: p.devices.cpr, agitation };
    look.breathsPerMinute = arrest ? 0 : clamp(v.rr, 4, 60);
    const work = arrest || sedated ? 0 : clamp(Math.max((v.rr - 22) / 16, (ph.v.spasm ?? 0) * 1.1, (ph.v.edema ?? 0) * 1.2, (93 - spo2) / 14), 0, 1);
    look.cues.sesak = work > 0.05 ? work : undefined;
    // Sesak berat saat duduk: posisi tripod.
    look.cues.tripod = work >= 0.7 && alert >= 0.6 ? 1 : undefined;
    look.emotion = alert < 0.6 ? 'lesu' : (ph.v.pain ?? 0) > 0.45 ? 'kesakitan' : anxiety > 0.3 || spo2 < 90 || work > 0.5 ? 'cemas' : 'tenang';
    look.talkRate = work > 0.7 ? 9 : work > 0.4 ? 12 : 15;
    // Warna kulit.
    const c = pv.actor.character;
    if (arrest) c.setSkinTint(TINT.grey, 0.42);
    else if (spo2 < 88) c.setSkinTint(TINT.cyan, Math.min(0.5, (88 - spo2) / 45 + 0.12));
    else if (v.perfusion < 0.78 || v.hb < 8) c.setSkinTint(TINT.pale, Math.min(0.42, Math.max(0, 0.78 - v.perfusion) * 1.3 + Math.max(0, 8 - v.hb) * 0.06 + 0.08));
    else if ((ph.v.reaction ?? 0) > 0.3) c.setSkinTint(TINT.flush, Math.min(0.3, ph.v.reaction * 0.35));
    else if (v.temp > 38.6) c.setSkinTint(TINT.flush, 0.12);
    else c.setSkinTint(null, 0);
    // Pupil (opioid: pin-point; organofosfat: miosis; herniasi: anisokor; henti jantung: midriasis)
    // & keringat dingin (syok, hipoglikemia, kolinergik, demam, nyeri hebat).
    const [pl, pr] = pupilSizes(ph, now);
    c.eyes.setPupils(pl, pr);
    const sweat = arrest ? 0.3 : Math.max((0.8 - v.perfusion) * 2.4, (ph.v.glucose ?? 100) < 60 ? 0.85 : 0, (ph.v.cholinergic ?? 0) * 1.3, (v.temp - 38.2) * 0.35, ((ph.v.pain ?? 0) - 0.5) * 0.8);
    c.setSweat(clamp(sweat, 0, 1));
    // Perlengkapan di tubuh.
    const d = p.devices;
    pv.gear.update({
      oxygen: d.oxygen,
      adjunct: d.adjunct,
      bvm: d.assist === 'bvm',
      collar: d.collar,
      pads: d.pads,
      monitor: d.monitor,
      iv: d.ivCount > 0 || d.io,
      // Torniket pada luka tungkai digambar oleh sistem luka (proksimal dari luka yang berdarah).
      tourniquet: d.tourniquet && !pv.wounds?.wounds.some((w) => w.bleeds && LIMBS.has(w.spec.region)),
      splint: d.splint,
      binder: d.binder,
    });
    if (pv.veh?.stretcher) pv.veh.stretcher.incline = this.inclineOf(p) * 0.8;
  }

  private resetBay(bay: IgdBay): void {
    for (const st of bay.stains) st.clear();
    bay.setMonitorOn(false);
    bay.setBags(0, false);
    bay.setBlanket(false);
    bay.setSheet(false);
    bay.setIncline(0.2);
  }

  private syncBays(shift: EdShift, now: number): void {
    const room = this.room!;
    const occupied = new Map<string, { pv: PV; p: EdPatient }>();
    for (const pv of this.pvs.values()) {
      if (pv.busy && !pv.actor.lying) continue;
      const bay = this.bayOf(pv.at);
      const p = patientById(shift, pv.id);
      if (bay && p && !pv.hidden) occupied.set(bay.id, { pv, p });
    }
    // Bed yang masih dipesan pasien yang sedang di radiologi: sprei (noda darah) & selimut tetap;
    // hanya monitor yang padam (pasien sementara keluar bersama infusnya).
    const reserved = new Set(shift.patients.filter((x) => x.bedId && x.status === 'dirawat' && x.awayUntil !== null && now < x.awayUntil).map((x) => x.bedId!));
    for (const bay of room.bays.values()) {
      const o = occupied.get(bay.id);
      if (!o) {
        if (reserved.has(bay.id)) {
          bay.setMonitorOn(false);
          bay.setBags(0, false);
        } else this.resetBay(bay);
        continue;
      }
      const { pv, p } = o;
      const st = monitorStateOf(p, now);
      bay.setMonitorOn(!!st?.live);
      const active = p.infusions.filter((i) => i.stoppedAt === null);
      bay.setBags(Math.min(3, active.length), active.some((i) => i.ref === 'prc'));
      const declared = p.disposition?.to === 'meninggal' || p.status === 'meninggal';
      bay.setSheet(declared && !!bay.pose);
      pv.actor.character.root.visible = !(declared && bay.pose) && !pv.hidden;
      // Selimut hanya saat telentang/setengah duduk (posisi miring, tungkai diangkat, RJP, kejang: dibuka).
      const flat = p.devices.position !== 'kaki_diangkat' && p.devices.position !== 'miring_kiri';
      // Selimut tidak menutupi luka tungkai, petekie tungkai, atau perdarahan jalan lahir (perlu dinilai).
      const legInjury = !!pv.look.injuries?.vaginal || !!pv.wounds?.wounds.some((w) => w.spec.region === 'paha' || w.spec.region === 'tungkai_bawah' || w.spec.region === 'pergelangan_kaki');
      bay.setBlanket(!!bay.pose && pv.actor.lying && !declared && flat && !p.devices.cpr && !p.physio.seizure && !legInjury);
      bay.setIncline(this.inclineOf(p));
    }
  }

  // -------------------------------------------------------------------------
  // Luka & perdarahan
  // -------------------------------------------------------------------------

  private initWounds(pv: PV, p: EdPatient): void {
    const prof = pv.look.injuries;
    if (!prof) return;
    if (prof.wounds.length || prof.hematemesis || prof.vaginal) {
      try {
        pv.wounds = new WoundSet(pv.actor.character, prof, (this.seed ^ (Number.parseInt(p.id.replace(/\D/g, '') || '1', 10) * 97531)) >>> 0);
      } catch (e) {
        console.warn('[IGD] luka gagal dibuat', e);
        pv.wounds = null;
      }
    }
    const ebv = bloodVolumeMl(p.weightKg, p.age);
    for (const w of prof.wounds) {
      const b = w.bleeding;
      if (!b) continue;
      // Darah yang sudah keluar sebelum tiba (membasahi pakaian/kain darurat).
      const pre = b.share ? Math.max(0, 1 - p.physio.v.volume) * ebv * b.share * 0.8 : (b.mlPerMin ?? 0) * 10;
      pv.bleed.set(w.id, { lost: pre, since: 0, rate: 0 });
    }
    const lostBefore = Math.max(0, 1 - p.physio.v.volume) * ebv * 0.8;
    if (prof.vaginal) pv.vagPre = lostBefore * (prof.vaginal.share ?? 0);
    if (prof.hematemesis) pv.hemaPre = lostBefore * (prof.hematemesis.share ?? 0);
  }

  /** Hitung ulang laju & volume darah tiap luka dari fisiologi, lalu perbarui tampilan luka & genangan. */
  private bleedSync(pv: PV, p: EdPatient, now: number): void {
    const prof = pv.look.injuries;
    if (!prof) return;
    const dtMin = Math.max(0, Math.min(15, (now - pv.bleedT) / 60));
    pv.bleedT = now;
    const v = vitalsOf(p, now);
    pv.hr = v.pulse ? v.hr : 0;
    pv.sbp = v.sbp ?? 0;
    const ebv = bloodVolumeMl(p.weightKg, p.age);
    const minutes = (now - p.arriveAt) / 60;
    const d = p.devices;
    const ph = p.physio;
    // Perdarahan kecil (vena/kapiler) ikut turun saat hipotensi & hampir berhenti saat henti jantung.
    const flow = ph.dead ? 0 : ph.arrest ? (d.cpr ? 0.25 : 0.03) : Math.min(1.2, Math.max(0.15, (v.sbp ?? 90) / 110));
    const bleed = ph.v.bleed;
    const done = (id: string) => p.actions.some((a) => a.type === 'proc' && a.id === id && a.doneAt !== undefined && a.doneAt <= now);
    const sutured = done('jahit_luka');
    const cleaned = done('rawat_luka') || sutured;
    const cooled = p.actions.some((a) => a.type === 'proc' && a.id === 'dinginkan_luka_bakar' && a.doneAt !== undefined && now - a.doneAt < 25 * 60);
    const ws = pv.wounds;
    // Luka berdarah utama: sasaran balut tekan & torniket.
    let primary: Wound | null = null;
    let best = -1;
    for (const w of ws?.wounds ?? []) {
      const b = w.spec.bleeding;
      if (!b) continue;
      const r = bleedingRate(b, bleed, ebv, minutes) + (b.share ? 1000 : 0);
      if (r > best) {
        best = r;
        primary = w;
      }
    }
    for (const w of ws?.wounds ?? []) {
      const b = w.spec.bleeding;
      const st = pv.bleed.get(w.spec.id) ?? { lost: 0, since: 0, rate: 0 };
      pv.bleed.set(w.spec.id, st);
      const isPrimary = w === primary;
      const pressure = d.pressure && isPrimary;
      const tq = d.tourniquet && isPrimary && LIMBS.has(w.spec.region);
      const open = w.spec.kind === 'laserasi' || w.spec.kind === 'bacok' || w.spec.kind === 'iris' || w.spec.kind === 'tusuk';
      let rate = 0;
      if (b) {
        // Luka yang terkait fisiologi: laju sudah memperhitungkan balut tekan/torniket (skenario).
        rate = bleedingRate(b, bleed, ebv, minutes) * (b.share ? 1 : flow);
        if (!b.share) {
          if (pressure) rate *= 0.25;
          if (tq) rate *= 0.03;
        } else if (ph.dead || (ph.arrest && !d.cpr)) rate *= 0.05;
        if (sutured && open) rate = 0;
      }
      st.rate = rate;
      st.lost += rate * dtMin;
      if (pressure) st.since += rate * dtMin;
      else st.since = 0;
      ws!.apply(w, {
        rate,
        lostMl: st.lost,
        sinceDressingMl: st.since,
        pressure,
        tourniquet: tq,
        sutured: sutured && open,
        cleaned: cleaned && open,
        wrap: prof.improvisedWrap === w.spec.id && !d.pressure && !d.tourniquet,
        lying: pv.actor.lying,
        cooled,
      });
      if (rate > 0.01 && dtMin > 0 && !pv.hidden && !pv.actor.moving) this.depositBlood(pv, w, rate * dtMin * (pressure ? 0.6 : 1));
    }
    if (prof.vaginal) {
      pv.vagMl += bleedingRate(prof.vaginal, bleed, ebv, minutes) * dtMin;
      this.vaginalVisual(pv);
    }
    if (prof.hematemesis) {
      pv.hemaMl += bleedingRate(prof.hematemesis, bleed, ebv, minutes) * dtMin;
      this.hematemesisVisual(pv);
    }
  }

  /** Permukaan di bawah titik (sprei, bantal, brankar, atau lantai). */
  private surfaceUnder(pv: PV, at: Vector3): StainSurface | null {
    const blood = this.blood;
    if (!blood) return null;
    const bay = this.bayOf(pv.at);
    if (pv.actor.lying && bay?.pose && !pv.busy) return at.z > L.hingeZ ? bay.stains[0]! : bay.stains[1]!;
    if (pv.actor.lying && pv.veh?.stretcher) return pv.veh.stretcher.stain;
    return blood.floorAt(at.x, at.z);
  }

  /** Tambahkan darah ke genangan di bawah luka; luapan dari kasur menetes ke lantai. */
  private depositBlood(pv: PV, w: Wound, ml: number): void {
    const blood = this.blood;
    if (!blood) return;
    const wp = w.worldPoint(new Vector3());
    const wn = w.worldNormal(new Vector3());
    // Darah mengalir ke sisi bawah tungkai lalu menetes ke kasur di sampingnya.
    const drip = wp.clone();
    const hz = new Vector3(wn.x, 0, wn.z);
    if (hz.lengthSq() > 1e-4) drip.addScaledVector(hz.normalize(), 0.06);
    const surf = this.surfaceUnder(pv, drip);
    if (!surf) return;
    const key = `${surf.id}:${w.spec.id}`;
    const total = (pv.pools.get(key) ?? 0) + ml;
    pv.pools.set(key, total);
    const cloth = surf.kind !== 'lantai';
    const r = cloth ? Math.min(0.42, Math.sqrt((total * 6e-4) / Math.PI)) : Math.min(0.95, Math.sqrt((total * 4e-4) / Math.PI));
    const loc = surf.toLocal(drip);
    surf.pool(pv.id, w.spec.id, loc.x, loc.z, r, total > 300 ? Math.min(7, Math.floor(total / 220)) : 0);
    // Kasur jenuh → darah meluap & menggenang di lantai samping bed.
    if (cloth && total > 650) {
      const bay = this.bayOf(pv.at);
      const side = bay ? Math.sign(drip.x - bay.x) || 1 : 1;
      const fx = bay ? bay.x + side * 0.5 : drip.x + 0.4;
      const floor = blood.floorAt(fx, drip.z);
      const fkey = `luap:${w.spec.id}`;
      const over = total - 650;
      const fl = floor.toLocal(new Vector3(fx, 0, drip.z));
      floor.pool(pv.id, fkey, fl.x, fl.z, Math.min(0.9, Math.sqrt((over * 4e-4) / Math.PI)), 0);
    }
  }

  /** Perdarahan pervaginam: perlak di bawah bokong dengan genangan & bekuan yang tumbuh. */
  private vaginalVisual(pv: PV): void {
    const blood = this.blood;
    const bay = this.bayOf(pv.at);
    if (!blood) return;
    // Celana/kain basah darah sejak sebelum tiba, makin luas seiring perdarahan berlanjut.
    pv.wounds?.setVaginal(pv.vagPre + pv.vagMl);
    if (!bay?.pose || !pv.actor.lying || pv.busy) {
      // Di brankar: kain alas sudah tergenang darah dari perjalanan.
      const ml = pv.vagMl + pv.vagPre * 0.3;
      if (pv.veh?.stretcher && pv.actor.lying && ml > 1) {
        const hips = pv.actor.character.hips.getWorldPosition(new Vector3());
        const loc = pv.veh.stretcher.stain.toLocal(hips);
        pv.veh.stretcher.stain.pool(pv.id, 'vagina', loc.x, loc.z + 0.12, Math.min(0.26, Math.sqrt((ml * 6e-4) / Math.PI)), Math.min(5, Math.floor(ml / 200)));
      }
      return;
    }
    if (pv.pad && pv.pad.bay !== bay.id) this.removeBloodProps(pv);
    if (!pv.pad) {
      const mesh = new Mesh(new PlaneGeometry(0.64, 0.52), new MeshStandardMaterial({ color: '#86b8db', roughness: 0.3, metalness: 0 }));
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(bay.x, bay.top + 0.0045, L.hingeZ + 0.1);
      mesh.receiveShadow = true;
      bay.group.add(mesh);
      const stain = new StainSurface(`perlak-${pv.id}`, bay.group, new Vector3(bay.x, bay.top + 0.005, L.hingeZ + 0.1), 0.64, 0.52, 'perlak');
      blood.addSurface(stain);
      pv.pad = { mesh, stain, bay: bay.id };
    }
    const ml = pv.vagMl;
    // Genangan di antara paha (arah kaki dari bokong), bekuan bertambah seiring volume.
    pv.pad.stain.pool(pv.id, 'vagina', 0, 0.06, Math.min(0.3, Math.sqrt((ml * 5e-4) / Math.PI)), Math.min(9, Math.floor(ml / 160)));
    if (ml > 800) bay.stains[0]!.pool(pv.id, 'vagina-luap', 0, -0.05, Math.min(0.42, Math.sqrt(((ml - 800) * 6e-4) / Math.PI) + 0.12), 0);
  }

  /** Muntah darah: bengkok berisi darah di samping kepala yang terus terisi. */
  private hematemesisVisual(pv: PV): void {
    pv.wounds?.setHematemesis(pv.hemaPre * 0.5 + pv.hemaMl);
    const bay = this.bayOf(pv.at);
    if (!bay?.pose || pv.busy) return;
    if (pv.basin && pv.basin.bay !== bay.id) {
      pv.basin.group.removeFromParent();
      pv.basin = null;
    }
    if (!pv.basin) {
      const group = new Group();
      const steel = new MeshStandardMaterial({ color: '#c8cdd2', roughness: 0.25, metalness: 0.85 });
      const wall = new Mesh(new CylinderGeometry(0.1, 0.085, 0.04, 28, 1, true), steel);
      wall.material.side = 2;
      const bottom = new Mesh(new CylinderGeometry(0.085, 0.085, 0.003, 28), steel);
      bottom.position.y = -0.019;
      const fill = new Mesh(new CylinderGeometry(0.094, 0.086, 0.003, 28), new MeshPhysicalMaterial({ color: '#5e0409', roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05 }));
      fill.visible = false;
      group.add(wall, bottom, fill);
      group.scale.set(1.3, 1, 0.78);
      // Di kasur sandaran, di samping bahu/kepala (ikut menegak bersama sandaran); bed tanpa
      // sandaran (kursi): di samping pinggul.
      if (bay.backrest) {
        group.position.set(0.31, 0.073 + 0.024, -bay.backrest.len + 0.44);
        group.rotation.y = 0.25;
        bay.backrest.group.add(group);
      } else {
        group.position.set(bay.x + 0.27, bay.top + 0.024, L.hingeZ + 0.12);
        group.rotation.y = 0.3;
        bay.group.add(group);
      }
      pv.basin = { group, fill, bay: bay.id };
    }
    const level = Math.min(1, pv.hemaMl / 650);
    pv.basin.fill.visible = pv.hemaMl > 5;
    pv.basin.fill.position.y = -0.018 + 0.034 * level;
  }

  private removeBloodProps(pv: PV): void {
    // Buang geometri & bahan GPU juga (bukan sekadar dilepas dari adegan) agar tidak menumpuk.
    const free = (o: Object3D) =>
      o.traverse((x) => {
        const m = x as Mesh;
        if (!m.isMesh) return;
        m.geometry.dispose();
        for (const mat of Array.isArray(m.material) ? m.material : [m.material]) mat.dispose();
      });
    if (pv.pad) {
      this.blood?.removeSurface(pv.pad.stain);
      pv.pad.stain.dispose();
      pv.pad.mesh.removeFromParent();
      free(pv.pad.mesh);
      pv.pad = null;
    }
    if (pv.basin) {
      pv.basin.group.removeFromParent();
      free(pv.basin.group);
      pv.basin = null;
    }
  }

  /** Emiter darah per frame (pancaran sinkron nadi, tetesan) + fisika tetesan. */
  private updateBlood(dt: number): void {
    const blood = this.blood;
    if (!blood) return;
    for (const pv of this.pvs.values()) {
      if (!pv.wounds || pv.hidden || !pv.actor.character.root.visible) continue;
      for (const w of pv.wounds.wounds) {
        const st = pv.bleed.get(w.spec.id);
        const b = w.spec.bleeding;
        if (!st || !b || st.rate < 0.05) continue;
        blood.emit(
          {
            owner: pv.id,
            key: `${pv.id}:${w.spec.id}`,
            type: b.type,
            rate: st.rate,
            hr: pv.hr,
            sbp: pv.sbp,
            point: w.worldPoint(new Vector3()),
            normal: w.worldNormal(new Vector3()),
            covered: !!w.dressing?.visible || !!w.tourniquet?.visible,
          },
          dt,
        );
      }
    }
    blood.update(dt);
  }

  /** Mata dokter mendekat ke luka selama beberapa detik. */
  private focusWound(_pv: PV, w: Wound, seconds: number): void {
    const point = w.worldPoint(new Vector3());
    const n = w.worldNormal(new Vector3());
    const eye = point.clone().addScaledVector(n, 0.42).add(new Vector3(0, 0.2, 0));
    // Dekati dari sisi kamera (kaki bed) agar tidak tertutup perawat.
    eye.z = Math.max(eye.z, point.z + 0.18);
    eye.y = Math.max(eye.y, point.y + 0.25);
    this.peek = { until: this.time + seconds, point, eye };
  }

  // -------------------------------------------------------------------------
  // Perawat
  // -------------------------------------------------------------------------

  private syncNurses(shift: EdShift): void {
    const used = new Map<string, Set<string>>();
    // RJP & BVM didahulukan memilih tempat (sisi dada & kepala).
    const order = [...shift.nurses].sort((x, y) => this.taskRank(shift, x.taskId) - this.taskRank(shift, y.taskId));
    for (const n of order) {
      const nv = this.nurses.get(n.id);
      if (!nv) continue;
      const task = n.taskId ? shift.tasks.find((t) => t.id === n.taskId) : undefined;
      const pv = task ? this.pvs.get(task.patientId) : undefined;
      let want: { key: string; pos: Vector3; yaw: number; hands: (() => HandsPose | null) | null; pv: PV | null } | null = null;
      if (task && pv && pv.at && !pv.busy && !pv.hidden && pv.at !== 'radiologi') {
        const set = used.get(pv.id) ?? new Set<string>();
        used.set(pv.id, set);
        const spot = this.nurseSpot(pv, task, set);
        if (spot) {
          set.add(spot.name);
          want = { key: `${task.id}:${spot.name}:${pv.at}`, pos: spot.pos, yaw: spot.yaw, hands: () => this.handsFor(task, pv, nv.actor), pv };
        }
      }
      if (!want) {
        const i = shift.nurses.indexOf(n);
        const spot = L.station[i % L.station.length]!;
        want = { key: `idle:${i}`, pos: spot, yaw: Math.PI, hands: null, pv: null };
      }
      if (want.key === nv.key) continue;
      nv.key = want.key;
      nv.patient = want.pv;
      const a = nv.actor;
      a.setHands(null);
      const w = want;
      a.walkPath(this.route(a.character.root.position, w.pos), w.yaw, () => {
        if (nv.key !== w.key) return;
        const h = w.hands?.() ?? null;
        a.setHands(h);
      });
    }
  }

  private taskRank(shift: EdShift, taskId: string | null): number {
    const t = taskId ? shift.tasks.find((x) => x.id === taskId) : null;
    if (!t) return 9;
    if (t.action.kind === 'proc' && t.action.id === 'rjp') return 0;
    if (t.action.kind === 'proc' && t.action.id === 'bvm') return 1;
    return 5;
  }

  /** Posisi berdiri perawat di sekitar pasien (berbaring: sisi kiri bed, kepala; duduk: depan). */
  private nurseSpot(pv: PV, task: EdTask, used: Set<string>): { name: string; pos: Vector3; yaw: number } | null {
    const a = pv.actor;
    const hips = a.bodyPoint('pinggul', this.v1, 'L').clone();
    a.character.hips.getWorldPosition(hips);
    const bay = this.bayOf(pv.at);
    const id = task.action.kind === 'proc' ? task.action.id : '';
    let spots: { name: string; pos: Vector3 }[];
    if (a.lying) {
      const pose = pv.floor ?? (bay?.pose ? this.bedPose(pv, bay) : pv.veh?.stretcher ? pv.veh.stretcher.pose() : null);
      const r = pose?.yaw ?? 0;
      const hx = -Math.sin(r);
      const hz = -Math.cos(r);
      // Sisi perawat: berlawanan dengan sisi kamera (−X lokal pasien).
      const px = Math.cos(r);
      const pz = -Math.sin(r);
      const H = pose ? V(pose.x, pose.z) : V(hips.x, hips.z);
      const side = id === 'rjp' ? 0.56 : 0.68;
      spots = [
        { name: 'sisi', pos: V(H.x + hx * 0.32 - px * side, H.z + hz * 0.32 - pz * side) },
        { name: 'kepala', pos: V(H.x + hx * 1.22, H.z + hz * 1.22) },
        { name: 'sisi2', pos: V(H.x - hx * 0.42 - px * 0.68, H.z - hz * 0.42 - pz * 0.68) },
        { name: 'kanan', pos: V(H.x + hx * 0.15 + px * 0.7, H.z + hz * 0.15 + pz * 0.7) },
      ];
      if (id === 'bvm') spots = [spots[1]!, ...spots.filter((s) => s.name !== 'kepala')];
      if (id !== 'bvm') spots = spots.filter((s) => s.name !== 'kepala').concat(spots.filter((s) => s.name === 'kepala'));
    } else {
      const y = a.facing;
      const fx = Math.sin(y);
      const fz = Math.cos(y);
      const lx = Math.cos(y);
      const lz = -Math.sin(y);
      spots = [
        { name: 'depan', pos: V(hips.x + fx * 0.62 + lx * 0.22, hips.z + fz * 0.62 + lz * 0.22) },
        { name: 'depan2', pos: V(hips.x + fx * 0.62 - lx * 0.3, hips.z + fz * 0.62 - lz * 0.3) },
        { name: 'samping', pos: V(hips.x + lx * 0.66 + fx * 0.15, hips.z + lz * 0.66 + fz * 0.15) },
      ];
    }
    const s = spots.find((x) => !used.has(x.name)) ?? spots[0]!;
    const look = a.bodyPoint(a.lying ? 'dada' : 'kepala', this.v2);
    const yaw = Math.atan2(look.x - s.pos.x, look.z - s.pos.z);
    return { name: s.name, pos: s.pos, yaw };
  }

  /** Gerak tangan perawat sesuai tugas. */
  private handsFor(task: EdTask, pv: PV, nurse: Actor): HandsPose | null {
    const pa = pv.actor;
    const nr = nurse.character.root.position;
    const near: 'L' | 'R' = pa.bodyPoint('bahu', this.v1, 'L').distanceToSquared(nr) < pa.bodyPoint('bahu', this.v2, 'R').distanceToSquared(nr) ? 'L' : 'R';
    const at = (site: BodyPoint, dx = 0, dy = 0, dz = 0) => (o: Vector3) => (pv.hidden ? null : pa.bodyPoint(site, o, near).add(this.v3.set(dx, dy, dz)));
    const a = task.action;
    if (a.kind === 'proc' && a.id === 'rjp') return { cpr: true, L: at('dada'), R: at('dada', 0, 0.015), lean: 0.5, palmDown: true };
    if (a.kind === 'proc' && a.id === 'bvm') return { squeeze: true, L: at('mulut'), R: at('mulut', 0, 0.05), lean: 0.3 };
    let site: BodyPoint = 'dada';
    let other: BodyPoint | null = null;
    if (a.kind === 'ttv') {
      site = 'lengan_atas';
      other = 'lengan_bawah';
    } else if (a.kind === 'sample') {
      site = 'lengan_bawah';
      other = 'lengan_bawah';
    } else if (a.kind === 'fluid') {
      const bay = this.bayOf(pv.at);
      if (bay) return { R: (o) => o.copy(bay.ivHook), L: at('lengan_bawah'), lean: 0.1 };
      site = 'lengan_bawah';
    } else if (a.kind === 'drug') {
      site = a.route === 'im' ? 'paha' : a.route === 'neb' || a.route === 'po' || a.route === 'sl' || a.route === 'in' ? 'mulut' : a.route === 'pr' ? 'pinggul' : 'lengan_bawah';
      other = site === 'lengan_bawah' ? 'lengan_atas' : null;
    } else if (a.kind === 'test_bedside') {
      site = a.id === 'ekg' || a.id === 'fast' ? 'dada' : 'lengan_bawah';
    } else if (a.kind === 'proc') {
      const PROC_SITE: Record<string, BodyPoint> = {
        iv: 'lengan_bawah',
        io: 'paha',
        ambil_darah: 'lengan_bawah',
        ttv: 'lengan_atas',
        monitor: 'dada',
        pad_defib: 'dada',
        oksigen: 'mulut',
        manuver: 'kepala',
        suction: 'mulut',
        opa: 'mulut',
        npa: 'mulut',
        intubasi: 'mulut',
        collar: 'kepala',
        ngt: 'mulut',
        kateter_urin: 'pinggul',
        pelvic_binder: 'pinggul',
        torniket: 'paha',
        bidai: 'paha',
        tekan_langsung: 'paha',
        rawat_luka: 'paha',
        jahit_luka: 'paha',
        masase_uterus: 'pinggul',
        kompresi_bimanual: 'pinggul',
        posisi: 'bahu',
        selimut_hangat: 'pinggul',
        dinginkan_luka_bakar: 'lengan_atas',
        dekontaminasi: 'lengan_atas',
      };
      site = PROC_SITE[a.id] ?? 'dada';
      other = site === 'lengan_bawah' ? 'lengan_bawah' : null;
    }
    const busy = (base: (o: Vector3) => Vector3 | null, k: number) => (o: Vector3) => {
      const p = base(o);
      if (p) p.y += Math.sin(this.time * (2.2 + k) + k) * 0.012;
      return p;
    };
    return { L: busy(at(site, 0.02, 0, 0), 0), R: busy(at(other ?? site, -0.02, 0.01, 0), 1), lean: pa.lying ? 0.3 : 0.15 };
  }

  // -------------------------------------------------------------------------
  // Reaksi terhadap aksi pemain
  // -------------------------------------------------------------------------

  private onAction(patientId: string, action: EdAction): void {
    const pv = this.pvs.get(patientId);
    const shift = this.shiftRef;
    const p = shift && patientById(shift, patientId);
    if (!pv || !p) return;
    if (action.type === 'tanya') {
      const last = [...p.chat].reverse().find((c) => c.who !== 'dokter' && c.who !== 'sistem' && c.who !== 'perawat');
      if (!last) return;
      const speaker = this.speakerFor(pv, last.who as InformantId);
      speaker?.say(speechTimeline(last.text.replace(/\([^)]*\)/g, '').trim() || '…', pv.look.talkRate));
      return;
    }
    if (action.type === 'periksa' && (action.exam === 'luka' || action.exam === 'E') && pv.wounds?.wounds.length) {
      // Inspeksi luka: mata dokter mendekat ke luka terbesar/yang berdarah.
      const w = [...pv.wounds.wounds].filter((x) => x.spec.kind !== 'emfisema').sort((a, b) => (b.bleeds ? 1 : 0) - (a.bleeds ? 1 : 0) || b.spec.size[0] * b.spec.size[1] - a.spec.size[0] * a.spec.size[1])[0];
      if (w) {
        this.focusWound(pv, w, 5);
        return;
      }
    }
    if (action.type === 'periksa') {
      const ex = action.exam;
      const site: BodyPoint = ex === 'A' || ex === 'D' || ex === 'kepala_leher' || ex === 'neurologis' ? 'kepala' : ex === 'abdomen' || ex === 'obstetri' ? 'pinggul' : ex === 'pelvis_ekstremitas' || ex === 'luka' || ex === 'E' ? 'paha' : 'dada';
      this.peek = { until: this.time + 3.2, point: pv.actor.bodyPoint(site, new Vector3()) };
      return;
    }
    // Perawat yang menerima instruksi menjawab singkat.
    const task = shift.tasks.filter((t) => t.patientId === patientId && t.createdAt >= shift.time - 1).at(-1);
    if (task && task.performer !== 'dokter') {
      const nurse = task.nurseId ? this.nurses.get(task.nurseId) : undefined;
      const replies = ['Baik, Dok.', 'Siap, Dok.', 'Baik, saya kerjakan.', 'Siap.'];
      nurse?.actor.say(speechTimeline(replies[(shift.counter + task.id.length) % replies.length]!, 14));
    }
    if (action.type === 'tindakan' && (action.proc === 'defibrilasi' || action.proc === 'kardioversi')) {
      this.later(1.2, () => {
        const bay = this.bayOf(pv.at);
        if (bay) this.room?.flash(bay.id);
        pv.actor.jolt();
      });
    }
  }

  private speakerFor(pv: PV, who: InformantId): Actor | null {
    if (who === 'pasien') return pv.hidden ? null : pv.actor;
    if (who === 'keluarga' || who === 'saksi') return pv.fam;
    if (who === 'paramedis') return pv.veh?.crew[1] ?? pv.veh?.crew[0] ?? null;
    return null;
  }

  // -------------------------------------------------------------------------
  // Ketuk untuk memilih pasien
  // -------------------------------------------------------------------------

  private tap(x: number, y: number): void {
    const shift = this.igd.shift;
    if (!shift || !this.room || shift.status !== 'berjalan') return;
    this.ray.setFromCamera(new Vector2(x, y), this.stage.camera);
    const targets: Object3D[] = [...this.room.hitTargets];
    const owner = new Map<Object3D, string>();
    for (const pv of this.pvs.values()) {
      if (pv.hidden || this.bayOf(pv.at)) continue;
      targets.push(pv.actor.character.root);
      owner.set(pv.actor.character.root, pv.id);
    }
    const hits = this.ray.intersectObjects(targets, true);
    for (const h of hits) {
      let o: Object3D | null = h.object;
      while (o && !o.userData.bayId && !owner.has(o)) o = o.parent;
      if (!o) continue;
      const id = owner.get(o) ?? shift.patients.find((p) => p.bedId === o!.userData.bayId && p.status !== 'keluar' && p.status !== 'meninggal')?.id;
      if (id) {
        this.igd.select(id);
        return;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Loop per frame
  // -------------------------------------------------------------------------

  private timers: { at: number; fn: () => void }[] = [];

  /** Majukan animasi adegan sebanyak `seconds` detik (uji visual/otomatis). */
  simulate(seconds: number): void {
    const step = 1 / 30;
    for (let t = 0; t < seconds; t += step) this.update(step);
    this.stage.snapRig();
  }

  /** Ringkasan keadaan adegan (uji). */
  debugState(): {
    patients: { id: string; at: string | null; busy: boolean; lying: boolean; hidden: boolean; veh: boolean }[];
    nurses: { id: string; key: string }[];
    vehicles: { x: number; z: number; busy: boolean; speed: number }[];
    timers: number;
  } {
    return {
      patients: [...this.pvs.values()].map((pv) => ({ id: pv.id, at: pv.at, busy: pv.busy, lying: pv.actor.lying, hidden: pv.hidden, veh: !!pv.veh })),
      nurses: [...this.nurses.values()].map((n) => ({ id: n.id, key: n.key })),
      vehicles: [...this.vehicles].map((v) => ({ x: +v.mover.pos.x.toFixed(2), z: +v.mover.pos.z.toFixed(2), busy: v.mover.busy, speed: +v.mover.speed.toFixed(2) })),
      timers: this.timers.length,
    };
  }

  private later(seconds: number, fn: () => void): void {
    this.timers.push({ at: this.time + seconds, fn });
  }

  update(dt: number): void {
    // Jam adegan sendiri (monoton) — tidak bergantung jam panggung.
    this.time += dt;
    const time = this.time;
    const room = this.room;
    if (!room || !this.active) return;
    // Pengatur waktu.
    if (this.timers.length) {
      const due = this.timers.filter((t) => t.at <= time);
      this.timers = this.timers.filter((t) => t.at > time);
      for (const t of due) t.fn();
    }
    const cam = this.stage.camera.position;
    // Kendaraan.
    const vehicles = [...this.vehicles];
    for (const v of vehicles) {
      v.mover.update(dt);
      v.stretcher?.place(v.mover.pos.x, v.mover.pos.z, v.mover.shown + Math.PI);
      v.stretcher?.update();
      v.chair?.place(v.mover.pos.x, v.mover.pos.z, v.mover.shown);
    }
    // Aktor: pendorong & penggendong lebih dulu, lalu pasien, lalu perawat.
    const order: ScenePerson[] = [];
    for (const v of vehicles) for (const c of v.crew) order.push(c);
    for (const pv of this.pvs.values()) if (pv.fam && !order.includes(pv.fam)) order.push(pv.fam);
    for (const pv of this.pvs.values()) order.push(pv.actor);
    for (const w of this.walkers) order.push(w);
    for (const n of this.nurses.values()) order.push(n.actor);
    if (this.clerk) order.push(this.clerk);
    for (const a of order) {
      a.eyeTarget.copy(cam);
      a.update(dt, time);
    }
    for (const n of this.nurses.values()) if (n.patient && !n.patient.hidden) n.patient.actor.bodyPoint('kepala', n.actor.eyeTarget);
    // Selang infus & oksigen.
    this.updateTubes();
    // Darah: pancaran/tetesan dari luka yang berdarah, tetesan jatuh, noda.
    this.updateBlood(dt);
    // Pintu otomatis & lampu ambulans.
    let nearEntr = false;
    let nearExit = false;
    const check = (p: Vector3) => {
      if (Math.hypot(p.x - 6.6, p.z - 1.35) < 2.4) nearEntr = true;
      if (Math.hypot(p.x + 6.6, p.z - 0.9) < 2.2) nearExit = true;
    };
    for (const a of order) check(a.character.root.position);
    for (const v of vehicles) check(v.mover.pos);
    this.door += ((nearEntr ? 1 : 0) - this.door) * (1 - Math.exp(-4 * dt));
    this.exitDoor += ((nearExit ? 1 : 0) - this.exitDoor) * (1 - Math.exp(-4 * dt));
    room.setEntrance(this.door);
    room.setExitDoor(this.exitDoor);
    room.setSiren(time < this.sirenUntil);
    // Monitor.
    this.monitorClock -= dt;
    if (this.monitorClock <= 0) {
      this.monitorClock = 1 / 12;
      this.drawMonitors(time);
    }
    this.centralClock -= dt;
    if (this.centralClock <= 0) {
      this.centralClock = 0.5;
      this.drawCentral();
    }
    this.updateCamera();
  }

  private updateTubes(): void {
    const shift = this.shiftRef;
    for (const pv of this.pvs.values()) {
      const bay = this.bayOf(pv.at);
      const p = shift && patientById(shift, pv.id);
      if (!p || !bay || pv.hidden || pv.busy || !pv.actor.character.root.visible) {
        pv.iv.hide();
        pv.o2.hide();
        continue;
      }
      const bags = p.infusions.some((i) => i.stoppedAt === null);
      if (bags && (p.devices.ivCount > 0 || p.devices.io)) pv.iv.set(bay.bagOutlet, pv.actor.bodyPoint('lengan_bawah', this.v1, 'R'), 0.25);
      else pv.iv.hide();
      const d = p.devices;
      if (d.assist === 'ventilator' && bay.ventPort) pv.o2.set(pv.gear.airwayPoint(this.v2), bay.ventPort, 0.12);
      else if (d.oxygen !== 'udara' && d.assist !== 'bvm' && bay.pose) pv.o2.set(pv.gear.airwayPoint(this.v2), this.v3.set(bay.x - 0.36, 1.18, -4.86), 0.3);
      else pv.o2.hide();
    }
  }

  private drawMonitors(time: number): void {
    const shift = this.shiftRef;
    if (!shift) return;
    for (const pv of this.pvs.values()) {
      const bay = this.bayOf(pv.at);
      if (!bay || !bay.monitor.on) continue;
      const p = patientById(shift, pv.id);
      if (!p) continue;
      const m = bay.monitor;
      drawMonitor(m.g, m.canvas.width, m.canvas.height, monitorStateOf(p, shift.time), time, { compact: true });
      m.texture.needsUpdate = true;
    }
  }

  /** Monitor sentral: ringkasan tanda vital semua bed. */
  private drawCentral(): void {
    const shift = this.shiftRef;
    const room = this.room!;
    const { g, canvas, texture } = room.central;
    const W = canvas.width;
    const H = canvas.height;
    g.fillStyle = '#05090c';
    g.fillRect(0, 0, W, H);
    const bays = [...room.bays.values()];
    const cols = 4;
    const cw = W / cols;
    const ch = H / 2;
    bays.forEach((bay, i) => {
      const x = (i % cols) * cw;
      const y = Math.floor(i / cols) * ch;
      g.strokeStyle = '#1d2a31';
      g.strokeRect(x + 2, y + 2, cw - 4, ch - 4);
      g.fillStyle = '#9fb3bf';
      g.font = 'bold 18px system-ui, sans-serif';
      g.fillText(bay.id, x + 10, y + 26);
      const p = shift?.patients.find((q) => q.bedId === bay.id && (q.status === 'dirawat' || q.status === 'pindah'));
      const st = p && shift ? monitorStateOf(p, shift.time) : null;
      if (!p || !st?.live) {
        g.fillStyle = '#3d4f58';
        g.font = '15px system-ui, sans-serif';
        g.fillText(p ? 'tanpa monitor' : 'kosong', x + 10, y + 56);
        return;
      }
      const blink = st.alarm && Math.floor(this.time * 2) % 2 === 0;
      if (st.alarm) {
        g.fillStyle = blink ? 'rgba(255,59,48,0.35)' : 'rgba(255,59,48,0.12)';
        g.fillRect(x + 3, y + 3, cw - 6, ch - 6);
      }
      g.fillStyle = '#3ff58a';
      g.font = 'bold 30px system-ui, sans-serif';
      g.fillText(st.rhythm === 'vf' ? 'VF' : st.rhythm === 'asistol' ? '0' : String(st.hr), x + 10, y + 64);
      g.fillStyle = '#41d6ff';
      g.font = 'bold 22px system-ui, sans-serif';
      g.fillText(st.spo2 === null ? '—' : `${st.spo2}%`, x + 70, y + 64);
      g.fillStyle = '#ff6b6b';
      g.font = 'bold 18px system-ui, sans-serif';
      g.fillText(st.sbp === null ? '—/—' : `${st.sbp}/${st.dbp}`, x + 10, y + 94);
      g.fillStyle = '#ffd84d';
      g.font = '15px system-ui, sans-serif';
      g.fillText(`RR ${st.rr}`, x + 10, y + 118);
    });
    texture.needsUpdate = true;
  }

  // -------------------------------------------------------------------------
  // Kamera
  // -------------------------------------------------------------------------

  private updateCamera(): void {
    const rig = this.rig;
    const id = this.igd.ui.selected;
    const pv = id ? this.pvs.get(id) : undefined;
    rig.fov = 1.3;
    rig.eye.copy(L.overviewEye);
    rig.focus.copy(L.overviewFocus);
    if (!pv || pv.hidden) return;
    const bay = this.bayOf(pv.at);
    const a = pv.actor;
    if (bay && !pv.busy) {
      rig.eye.copy(bay.eye);
      rig.focus.copy(bay.focus);
      rig.fov = 1.0;
      // Dokter mendekat saat melakukan tindakan pada pasien ini / memeriksa.
      const shift = this.shiftRef;
      const doctorHere = shift && shift.doctor.task && shift.doctor.busyUntil > shift.time && shift.doctor.bedId === bay.id;
      if (this.peek && this.time < this.peek.until) {
        rig.focus.copy(this.peek.point);
        if (this.peek.eye) {
          rig.eye.copy(this.peek.eye);
          rig.fov = 0.9;
        } else {
          rig.eye.lerp(this.peek.point, 0.42);
          rig.eye.y = Math.max(1.4, rig.eye.y);
        }
      } else if (doctorHere) {
        rig.eye.lerp(bay.focus, 0.3);
      }
      return;
    }
    if (!pv.busy && (pv.at === 'parkir' || pv.at === 'tunggu')) {
      a.bodyPoint(a.lying ? 'dada' : 'kepala', rig.focus);
      if (!a.lying) rig.focus.y -= 0.25;
      if (pv.at === 'parkir') rig.eye.set(rig.focus.x + 0.9, 1.66, rig.focus.z - 1.9);
      else rig.eye.set(rig.focus.x - 1.9, 1.64, rig.focus.z + 0.9);
      rig.fov = 1.05;
      return;
    }
    // Sedang berpindah: pandangan umum mengikuti pasien.
    a.bodyPoint('kepala', rig.focus);
    rig.focus.y -= 0.3;
    rig.fov = 1.2;
  }
}

const TINT = {
  grey: new Color('#8e989c'),
  cyan: new Color('#73829e'),
  pale: new Color('#ece6dc'),
  flush: new Color('#d9705f'),
};
