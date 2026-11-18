/**
 * Mesin shift IGD: jam permainan, kedatangan pasien bertahap, triase & bed, tugas
 * perawat/dokter, obat & infus, penunjang berwaktu, konsultasi, disposisi, alarm,
 * kejadian terjadwal, henti jantung & RJP.
 *
 * State shift dimutasi langsung (objek biasa, bisa diserialisasi). Semua keacakan
 * berasal dari seed shift (deterministik untuk tes & replay).
 */
import { createRng, deriveSeed, type Rng } from '../rng';
import type { GameContent } from '../types';
import { askInformant, informants } from './anamnesis';
import { examFinding, gcsText, testResult } from './assessment';
import { DISPOSITIONS_BY_ID, EXAMS_BY_ID, FLUIDS_BY_ID, PROCS_BY_ID, SPECIALTIES_BY_ID, TESTS_BY_ID } from './catalog';
import { DRUGS_BY_ID, GENERIC_HARMS } from './drugs';
import { done, firstTime, recordMatches } from './match';
import { addMod, addRamp, causeLabel, clamp, computeVitals, createPhysio, deliverShock, eff, rhythmLabel, settlePhysio, stepPhysio } from './physiology';
import type {
  ActionMatch,
  ActionRecord,
  ActResult,
  EdAction,
  Disposition,
  EdPatient,
  EdScenario,
  EdShift,
  EdTask,
  FluidId,
  HarmContext,
  LogEntry,
  OxygenDevice,
  PatientDevices,
  Performer,
  Position,
  ProcId,
  Route,
  ShiftConfig,
  Specialty,
  Support,
  TaskAction,
  TestId,
  Vitals,
} from './types';

export interface EdContext {
  scenarios: ReadonlyMap<string, EdScenario>;
  content: GameContent;
}

export type { ActResult, EdAction } from './types';

const NURSE_NAMES = ['Ners Rina', 'Ners Dimas', 'Ners Sari', 'Ners Yoga'];
const STEP = 5;
/** Lama perawat menyiapkan & memberikan obat menurut rute (detik). */
const DRUG_SECONDS: Record<Route, number> = { iv: 90, io: 90, im: 60, sc: 60, po: 40, sl: 30, neb: 60, in: 45, pr: 60, infus: 120 };
const INFUSION_SECONDS = 90;

// ---------------------------------------------------------------------------
// Pembuatan shift & pasien
// ---------------------------------------------------------------------------

export function defaultDevices(): PatientDevices {
  return {
    ivCount: 0,
    io: false,
    monitor: false,
    pads: false,
    oxygen: 'udara',
    flow: 0,
    adjunct: 'none',
    assist: 'none',
    position: 'terlentang',
    cpr: false,
    pacing: null,
    collar: false,
    binder: false,
    tourniquet: false,
    pressure: false,
    splint: false,
    catheter: false,
    ngt: false,
    chestTube: null,
    warmed: false,
    decontaminated: false,
    lastSuction: null,
    bloodDrawnAt: null,
  };
}

function estimateWeight(age: number, sex: 'male' | 'female', rng: Rng): number {
  if (age < 1) return Math.round(rng.float(5, 9) * 10) / 10;
  if (age <= 10) return Math.round((age + 4) * 2 + rng.float(-1.5, 2));
  if (age <= 15) return Math.round(age * 3 + rng.float(2, 10));
  return Math.round(sex === 'male' ? rng.float(58, 78) : rng.float(48, 66));
}

function addressOf(name: string, age: number, sex: 'male' | 'female'): string {
  const first = name.split(' ')[0] ?? name;
  if (age < 1) return `bayi ${first}`;
  if (age < 13) return `Dik ${first}`;
  if (age < 23) return `${sex === 'male' ? 'Mas' : 'Mbak'} ${first}`;
  return `${sex === 'male' ? 'Pak' : 'Bu'} ${first}`;
}

function buildPatient(index: number, sc: EdScenario, variantId: string | undefined, atSec: number, rng: Rng, ctx: EdContext, config: ShiftConfig, usedNames: Set<string>): EdPatient {
  const variants = sc.variants ?? [];
  const variant = variantId ? variants.find((v) => v.id === variantId) : variants.length ? rng.weighted(variants, (v) => v.weight) : undefined;
  const spec = sc.patient;
  const sex = spec.sex === 'acak' ? (rng.chance(0.5) ? 'male' : 'female') : spec.sex;
  const age = rng.int(spec.age[0], spec.age[1]);
  const weightKg = spec.weight ? Math.round(rng.float(spec.weight[0], spec.weight[1])) : estimateWeight(age, sex, rng);
  const pop = ctx.content.population;
  const pool = (age < 13 && pop.childNames?.[sex].length ? pop.childNames[sex] : pop.names[sex]).map((n) => (typeof n === 'string' ? n : n.name));
  let name = spec.name ?? rng.pick(pool);
  for (let i = 0; i < 6 && usedNames.has(name); i++) name = rng.pick(pool);
  usedNames.add(name);
  const comorbid = (spec.comorbid ?? []).filter((c) => rng.chance(c.chance));
  const betaBlocker = comorbid.some((c) => c.betaBlocker);
  const physio = createPhysio([sc.physio, variant?.physio], { age, sex, weightKg, betaBlocker }, config.deterioration, atSec);
  const eventTimes: Record<string, number> = {};
  for (const ev of sc.events ?? []) {
    const m = Array.isArray(ev.atMin) ? rng.float(ev.atMin[0], ev.atMin[1]) : ev.atMin;
    eventTimes[ev.id] = atSec + m * 60;
  }
  const devices = { ...defaultDevices(), ...(sc.arrival.devices ?? {}) };
  const support = supportFrom(devices, atSec);
  settlePhysio(physio, support, atSec);
  const v = computeVitals(physio, support, atSec);
  return {
    id: `p${index + 1}`,
    scenarioId: sc.id,
    variant: variant?.id ?? 'standar',
    name,
    address: addressOf(name, age, sex),
    sex,
    age,
    weightKg,
    comorbid: comorbid.map((c) => ({ id: c.id, text: c.text })),
    arrivalMode: sc.arrival.mode,
    status: 'akan_datang',
    arriveAt: atSec,
    triagedAt: null,
    ats: null,
    bedId: null,
    firstSeenAt: null,
    eventsDone: [],
    eventTimes,
    physio,
    devices,
    infusions: [],
    actions: [],
    tests: [],
    exams: {},
    knownVitals: null,
    arrivalVitals: v,
    chat: [],
    askedTopics: [],
    diagnosis: { primary: null, secondary: [] },
    consults: [],
    disposition: null,
    awayUntil: null,
    timeline: [],
    notes: [],
    alarms: {},
    outcome: null,
    endedAt: null,
    fluidsMl: {},
    episodes: [],
  };
}

export function createShift(config: ShiftConfig, seed: number, ctx: EdContext): EdShift {
  const rng = createRng(deriveSeed(seed, 'igd-shift'));
  const used = new Set<string>();
  const patients = config.arrivals.map((a, i) => {
    const sc = ctx.scenarios.get(a.scenarioId);
    if (!sc) throw new Error(`Skenario IGD tidak dikenal: ${a.scenarioId}`);
    return buildPatient(i, sc, a.variant, a.atMin * 60, rng.fork(`pasien-${i}`), ctx, config, used);
  });
  return {
    version: 1,
    seed,
    config,
    time: 0,
    counter: 0,
    patients,
    beds: config.beds.map((b) => ({ ...b, patientId: null })),
    nurses: Array.from({ length: config.nurses }, (_, i) => ({ id: `n${i + 1}`, name: NURSE_NAMES[i % NURSE_NAMES.length]!, taskId: null, at: null })),
    doctor: { busyUntil: 0, task: null, bedId: null },
    tasks: [],
    ventilators: [null, null],
    log: [],
    status: 'berjalan',
  };
}

// ---------------------------------------------------------------------------
// Utilitas
// ---------------------------------------------------------------------------

function rand(shift: EdShift): () => number {
  const r = createRng(deriveSeed(shift.seed, `r${shift.counter++}`));
  return () => r.next();
}

export function scenarioOf(ctx: EdContext, patient: EdPatient): EdScenario {
  const sc = ctx.scenarios.get(patient.scenarioId);
  if (!sc) throw new Error(`Skenario IGD tidak dikenal: ${patient.scenarioId}`);
  return sc;
}

const FIO2: Record<OxygenDevice, (flow: number) => number> = {
  udara: () => 0.21,
  nasal: (f) => clamp(0.21 + 0.04 * f, 0.21, 0.44),
  sungkup: (f) => clamp(0.25 + 0.03 * f, 0.35, 0.6),
  nrm: (f) => clamp(0.55 + 0.02 * f, 0.6, 0.88),
  niv: () => 0.6,
};

export function supportFrom(d: PatientDevices, now: number): Support {
  const assist = d.assist;
  let fio2 = FIO2[d.oxygen](d.flow);
  if (assist === 'bvm') fio2 = Math.max(fio2, 0.9);
  if (assist === 'ventilator') fio2 = Math.max(fio2, 0.6);
  return {
    fio2,
    oxygen: d.oxygen,
    flow: d.flow,
    adjunct: d.adjunct,
    assist,
    position: d.position,
    cpr: d.cpr,
    pacing: d.pacing,
    suctioned: d.lastSuction !== null && now - d.lastSuction < 300,
  };
}

export function supportOf(patient: EdPatient, now: number): Support {
  return supportFrom(patient.devices, now);
}

/** Tanda vital pasien saat ini (sebenarnya — belum tentu diketahui pemain). */
export function vitalsOf(patient: EdPatient, now: number): Vitals {
  return computeVitals(patient.physio, supportOf(patient, now), now);
}

/** Tanda vital yang TERLIHAT pemain: monitor (real-time) atau pengukuran manual terakhir. */
export function visibleVitals(patient: EdPatient, now: number): { vitals: Vitals; live: boolean; t: number } | null {
  if (patient.devices.monitor || patient.devices.pads) return { vitals: vitalsOf(patient, now), live: true, t: now };
  if (patient.knownVitals) return { vitals: patient.knownVitals.vitals, live: false, t: patient.knownVitals.t };
  return null;
}

export function minuteOf(patient: EdPatient, now: number): number {
  return (now - patient.arriveAt) / 60;
}

export function clockText(shift: EdShift, t = shift.time): string {
  const m = Math.floor(shift.config.startClock + t / 60);
  const hh = Math.floor(m / 60) % 24;
  const mm = m % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function log(shift: EdShift, patientId: string | null, text: string, kind: LogEntry['kind']): void {
  shift.log.push({ t: shift.time, patientId, text, kind });
  if (shift.log.length > 400) shift.log.splice(0, shift.log.length - 400);
}

function note(shift: EdShift, p: EdPatient, text: string, kind: 'buruk' | 'baik' | 'info'): void {
  p.notes.push({ t: shift.time, text, kind });
  log(shift, p.id, `${p.address}: ${text}`, kind === 'info' ? 'info' : kind);
}

export function activePatients(shift: EdShift): EdPatient[] {
  return shift.patients.filter((p) => p.status === 'triase' || p.status === 'menunggu_bed' || p.status === 'dirawat' || p.status === 'pindah');
}

export function patientById(shift: EdShift, id: string): EdPatient | undefined {
  return shift.patients.find((p) => p.id === id);
}

function record(p: EdPatient, r: Omit<ActionRecord, 't'>, t: number): number {
  p.actions.push({ t, ...r });
  return p.actions.length - 1;
}

/** Apakah tindakan dengan kriteria tertentu sudah dilakukan (pemain memutuskan). */
export function patientDid(p: EdPatient, m: ActionMatch, until?: number): boolean {
  return done(p, m, until);
}

// ---------------------------------------------------------------------------
// Tugas
// ---------------------------------------------------------------------------

function enqueue(shift: EdShift, p: EdPatient, performer: Performer, label: string, seconds: number, action: TaskAction, recordIndex: number | null, continuous = false): EdTask {
  const task: EdTask = {
    id: `t${shift.counter++}`,
    patientId: p.id,
    performer,
    nurseId: null,
    label,
    duration: seconds,
    createdAt: shift.time,
    startedAt: null,
    continuous,
    action,
    record: recordIndex,
  };
  shift.tasks.push(task);
  if (performer === 'dokter') {
    task.startedAt = shift.time;
    shift.doctor.busyUntil = shift.time + seconds;
    shift.doctor.task = task.id;
    shift.doctor.bedId = p.bedId;
    shift.doctor.label = null;
    shift.doctor.patientId = p.id;
  } else assignNurses(shift);
  return task;
}

function priority(shift: EdShift, t: EdTask): number {
  const p = shift.patients.find((x) => x.id === t.patientId);
  const ats = p?.ats ?? 3;
  const urgent = t.action.kind === 'proc' && (t.action.id === 'rjp' || t.action.id === 'bvm' || t.action.id === 'pad_defib') ? -10 : 0;
  return urgent + ats + t.createdAt / 1e6;
}

function assignNurses(shift: EdShift): void {
  const queued = shift.tasks.filter((t) => t.performer === 'perawat' && t.nurseId === null).sort((a, b) => priority(shift, a) - priority(shift, b));
  for (const task of queued) {
    let nurse = shift.nurses.find((n) => n.taskId === null);
    if (!nurse && task.continuous) {
      // RJP/ventilasi mendahului tugas lain yang tidak kritis.
      const victim = shift.tasks.find((t) => t.performer === 'perawat' && t.nurseId && !t.continuous);
      if (victim) {
        nurse = shift.nurses.find((n) => n.id === victim.nurseId);
        victim.nurseId = null;
        victim.startedAt = null;
      }
    }
    if (!nurse) break;
    const p = patientById(shift, task.patientId);
    const walk = nurse.at === p?.bedId ? 0 : 15;
    task.nurseId = nurse.id;
    task.startedAt = shift.time + walk;
    nurse.taskId = task.id;
    nurse.at = p?.bedId ?? null;
    if (task.continuous && p) startContinuous(p, task);
  }
}

function startContinuous(p: EdPatient, task: EdTask): void {
  if (task.action.kind !== 'proc') return;
  if (task.action.id === 'rjp') p.devices.cpr = true;
  if (task.action.id === 'bvm' && p.devices.assist !== 'ventilator') p.devices.assist = 'bvm';
}

function finishTask(shift: EdShift, task: EdTask): void {
  shift.tasks = shift.tasks.filter((t) => t.id !== task.id);
  if (task.nurseId) {
    const n = shift.nurses.find((x) => x.id === task.nurseId);
    if (n) n.taskId = null;
  }
  if (shift.doctor.task === task.id) {
    shift.doctor.task = null;
    shift.doctor.busyUntil = Math.min(shift.doctor.busyUntil, shift.time);
  }
}

export function stopTask(shift: EdShift, taskId: string): void {
  const task = shift.tasks.find((t) => t.id === taskId);
  if (!task) return;
  const p = patientById(shift, task.patientId);
  if (p && task.action.kind === 'proc') {
    if (task.action.id === 'rjp') p.devices.cpr = false;
    if (task.action.id === 'bvm' && p.devices.assist === 'bvm') p.devices.assist = 'none';
  }
  finishTask(shift, task);
  assignNurses(shift);
}

function stopContinuousFor(shift: EdShift, p: EdPatient, procId: ProcId): void {
  for (const t of shift.tasks.filter((x) => x.patientId === p.id && x.action.kind === 'proc' && x.action.id === procId)) stopTask(shift, t.id);
}

export function doctorBusy(shift: EdShift): { busy: boolean; label: string | null; left: number; patientId: string | null } {
  const left = Math.max(0, shift.doctor.busyUntil - shift.time);
  const task = shift.tasks.find((t) => t.id === shift.doctor.task);
  return { busy: left > 0, label: task?.label ?? shift.doctor.label ?? null, left, patientId: shift.doctor.patientId ?? null };
}

/**
 * Pesan "dokter masih sibuk" yang menyebut kegiatannya dan — bila berbeda — pasien yang sedang
 * ditangani (bukan selalu "pasien lain", yang keliru saat dokter masih memeriksa pasien yang sama).
 */
export function busyMessage(shift: EdShift, forPatientId: string | null, withTime = true): string {
  const d = doctorBusy(shift);
  const what = d.label ? d.label.charAt(0).toLowerCase() + d.label.slice(1) : 'sibuk';
  const other = d.patientId && d.patientId !== forPatientId ? shift.patients.find((x) => x.id === d.patientId) : undefined;
  const who = other ? ` (${other.name})` : '';
  const time = withTime ? ` — ± ${Math.max(1, Math.ceil(d.left / 60))} menit lagi` : '';
  return `Anda sedang ${what}${who}${time}.`;
}

// ---------------------------------------------------------------------------
// Majukan waktu
// ---------------------------------------------------------------------------

export function advance(shift: EdShift, seconds: number, ctx: EdContext): void {
  if (shift.status !== 'berjalan') return;
  const target = shift.time + Math.max(0, seconds);
  while (shift.time < target - 1e-9 && shift.status === 'berjalan') {
    const dt = Math.min(STEP, target - shift.time);
    step(shift, dt, ctx);
  }
}

function step(shift: EdShift, dt: number, ctx: EdContext): void {
  const now = shift.time;
  // 1. Kedatangan.
  for (const p of shift.patients) {
    if (p.status !== 'akan_datang' || p.arriveAt > now) continue;
    p.status = 'triase';
    const sc = scenarioOf(ctx, p);
    p.arrivalVitals = vitalsOf(p, now);
    const how = { jalan: 'berjalan sendiri', dipapah: 'dipapah keluarga', kursi_roda: 'dengan kursi roda', brankar: 'dengan brankar', digendong: 'digendong' }[p.arrivalMode];
    log(shift, p.id, `Pasien baru ${how}: ${p.address}, ${p.age < 1 ? 'bayi' : `${p.age} th`} — ${sc.arrival.complaint}`, 'kedatangan');
    const handover = sc.informants.paramedis?.opening;
    if (handover) p.chat.push({ t: now, who: 'paramedis', text: handover });
    const fam = sc.informants.keluarga?.opening ?? sc.informants.saksi?.opening;
    if (fam) p.chat.push({ t: now, who: sc.informants.keluarga?.opening ? 'keluarga' : 'saksi', text: fam });
  }

  // 2. Pasien aktif.
  for (const p of activePatients(shift)) {
    const sc = scenarioOf(ctx, p);
    const s = supportOf(p, now);
    applyInfusions(shift, p, dt);
    // Kejadian terjadwal.
    for (const ev of sc.events ?? []) {
      if (p.eventsDone.includes(ev.id) || now < (p.eventTimes[ev.id] ?? Infinity)) continue;
      p.eventsDone.push(ev.id);
      if (ev.unless?.some((m) => done(p, m, now))) continue;
      const v = computeVitals(p.physio, s, now);
      if (ev.when && !ev.when(p.physio, v)) continue;
      if (p.physio.dead) continue;
      ev.apply(p.physio, now);
      note(shift, p, ev.note, 'buruk');
    }
    sc.step?.(p, dt / 60, now);
    const wasArrest = !!p.physio.arrest;
    const wasSeizure = p.physio.seizure;
    const events = stepPhysio(p.physio, s, dt, now, rand(shift));
    for (const e of events) {
      const kind = e.kind === 'rosc' || e.kind === 'kejang_berhenti' ? 'baik' : 'buruk';
      note(shift, p, e.text, kind);
    }
    trackEpisodes(p, wasArrest, wasSeizure, now + dt);
    if (wasArrest && !p.physio.arrest) {
      // ROSC: kompresi dihentikan setelah cek nadi.
      stopContinuousFor(shift, p, 'rjp');
    }
    if (!wasArrest && p.physio.arrest) {
      p.devices.cpr = false;
      log(shift, p.id, `⚠ ${p.address}: HENTI JANTUNG (${rhythmLabel(p.physio.arrest.rhythm)})${p.devices.monitor || p.devices.pads ? '' : ' — pasien tidak berespons, napas berhenti'}`, 'alarm');
    }
    // Kembali dari radiologi.
    if (p.awayUntil !== null && now + dt >= p.awayUntil) {
      p.awayUntil = null;
      log(shift, p.id, `${p.address} kembali dari radiologi.`, 'info');
    }
    // Monitor & alarm.
    const v = computeVitals(p.physio, supportOf(p, now + dt), now + dt);
    if (p.devices.monitor || p.devices.pads) p.knownVitals = { t: now + dt, vitals: v };
    alarms(shift, p, v, now + dt);
    // Linimasa tiap 30 detik.
    const last = p.timeline.at(-1);
    if (!last || now + dt - last.t >= 30) p.timeline.push({ t: now + dt, hr: v.hr, sbp: v.sbp, dbp: v.dbp, spo2: v.spo2, rr: v.rr, gcs: v.gcs.total, rhythm: v.rhythm });
    // Meninggal biologis setelah resusitasi panjang tanpa ROSC.
    if (p.physio.dead && !p.disposition) {
      p.disposition = { to: 'meninggal', at: now, leaveAt: now + 10 * 60 };
      p.status = 'pindah';
      stopContinuousFor(shift, p, 'rjp');
      stopContinuousFor(shift, p, 'bvm');
    }
    // Pasien meninggalkan IGD.
    if (p.disposition && now + dt >= p.disposition.leaveAt) leave(shift, p, ctx, v, now + dt);
  }

  // 3. Tugas selesai.
  shift.time = now + dt;
  for (const task of [...shift.tasks]) {
    if (task.continuous || task.startedAt === null) continue;
    if (shift.time >= task.startedAt + task.duration) {
      const p = patientById(shift, task.patientId);
      finishTask(shift, task);
      if (p && p.status !== 'keluar' && p.status !== 'meninggal') executeTask(shift, p, task, ctx);
    }
  }
  assignNurses(shift);

  // 4. Hasil penunjang & konsul.
  for (const p of shift.patients) {
    for (const o of p.tests) {
      if (o.status === 'diproses' && o.readyAt !== null && shift.time >= o.readyAt) {
        o.status = 'selesai';
        log(shift, p.id, `Hasil ${TESTS_BY_ID.get(o.id)?.label ?? o.id} ${p.address} keluar${o.abnormal ? ' (ada nilai abnormal)' : ''}.`, 'hasil');
      }
    }
    for (const c of p.consults) {
      if (!c.answered && shift.time >= c.answerAt) {
        c.answered = true;
        p.chat.push({ t: shift.time, who: 'sistem', text: `${SPECIALTIES_BY_ID.get(c.specialty)?.label}: ${c.advice}` });
        log(shift, p.id, `Jawaban konsul ${SPECIALTIES_BY_ID.get(c.specialty)?.label} untuk ${p.address}.`, 'info');
      }
    }
  }

  // 5. Akhir shift.
  const remaining = shift.patients.some((p) => p.status !== 'keluar' && p.status !== 'meninggal');
  if (!remaining || shift.time >= shift.config.durationMin * 60) endShift(shift, ctx);
}

function trackEpisodes(p: EdPatient, wasArrest: boolean, wasSeizure: boolean, now: number): void {
  const ph = p.physio;
  const open = (kind: 'henti_jantung' | 'kejang') => [...p.episodes].reverse().find((e) => e.kind === kind && e.end === null);
  if (ph.arrest) {
    const e = open('henti_jantung');
    if (!e) p.episodes.push({ kind: 'henti_jantung', start: ph.arrest.since, end: null, rhythm: ph.arrest.rhythm, shocks: ph.arrest.shocks });
    else e.shocks = ph.arrest.shocks;
  } else if (wasArrest || open('henti_jantung')) {
    const e = open('henti_jantung');
    if (e) e.end = now;
  }
  if (ph.seizure && !open('kejang')) p.episodes.push({ kind: 'kejang', start: wasSeizure ? p.arriveAt : now, end: null });
  if (!ph.seizure) {
    const e = open('kejang');
    if (e) e.end = now;
  }
}

function alarms(shift: EdShift, p: EdPatient, v: Vitals, now: number): void {
  if (!(p.devices.monitor || p.devices.pads) || p.physio.dead) return;
  const fire = (key: string, text: string) => {
    if (now - (p.alarms[key] ?? -1e9) < 180) return;
    p.alarms[key] = now;
    log(shift, p.id, `ALARM ${p.bedId ?? ''} ${p.address}: ${text}`, 'alarm');
  };
  if (p.physio.arrest) return fire('arrest', `${rhythmLabel(p.physio.arrest.rhythm).toUpperCase()}`);
  if (v.spo2 !== null && v.spo2 < 90) fire('spo2', `SpO₂ ${v.spo2}%`);
  if (v.spo2 === null) fire('spo2', 'SpO₂ tidak terbaca');
  if (v.hr > 140 || v.hr < 45) fire('hr', `nadi ${v.hr}`);
  if (v.sbp !== null && v.sbp < 90) fire('sbp', `TD ${v.sbp}/${v.dbp}`);
  if (v.sbp !== null && v.sbp > 200) fire('sbp_tinggi', `TD ${v.sbp}/${v.dbp}`);
  if (v.rr > 32 || v.rr < 8) fire('rr', `napas ${v.rr} x/menit`);
}

function applyInfusions(shift: EdShift, p: EdPatient, dt: number): void {
  const dtMin = dt / 60;
  const ph = p.physio;
  const bv = p.weightKg * (p.age < 13 ? 80 : 70);
  const target: Record<string, number> = {};
  for (const inf of p.infusions) {
    if (inf.stoppedAt !== null) continue;
    if (inf.kind === 'cairan') {
      const ml = Math.min(inf.ratePerMin * dtMin, inf.volumeMl - inf.givenMl);
      if (ml <= 0) {
        inf.stoppedAt = shift.time;
        continue;
      }
      inf.givenMl += ml;
      const f = FLUIDS_BY_ID.get(inf.ref as FluidId)!;
      ph.v.volume += (ml / bv) * f.retention;
      if (f.rbc) ph.v.rbc += (ml / bv) * 1.35;
      if (f.glucoseGPerL) ph.v.glucose += ((ml / 1000) * f.glucoseGPerL * 7 * 70 * 0.5) / Math.max(8, p.weightKg);
      if (inf.givenMl >= inf.volumeMl - 1e-6) {
        inf.stoppedAt = shift.time + dt;
        log(shift, p.id, `${inf.label} untuk ${p.address} sudah habis.`, 'tugas');
      }
    } else {
      const drug = DRUGS_BY_ID.get(inf.ref);
      if (!drug) continue;
      const rate = inf.ratePerMin;
      for (const [k, val] of Object.entries(drug.drip?.(rate, p.weightKg, ph) ?? {})) target[k] = (target[k] ?? 0) + (val ?? 0);
      drug.dripStep?.(rate, p.weightKg, ph, dtMin);
    }
  }
  // Efek infus obat menuju target (onset ± 2 menit).
  const k = 1 - Math.exp(-dt / 120);
  const keys = new Set([...Object.keys(ph.drip), ...Object.keys(target)]);
  for (const key of keys) {
    const cur = (ph.drip as Record<string, number>)[key] ?? 0;
    const next = cur + ((target[key] ?? 0) - cur) * k;
    if (Math.abs(next) < 1e-4 && !(key in target)) delete (ph.drip as Record<string, number>)[key];
    else (ph.drip as Record<string, number>)[key] = next;
  }
}

function leave(shift: EdShift, p: EdPatient, ctx: EdContext, v: Vitals, now: number): void {
  const sc = scenarioOf(ctx, p);
  const dead = p.physio.dead || p.disposition?.to === 'meninggal';
  p.outcome = dead ? 'meninggal' : sc.stable(v, p.physio, now) ? 'stabil' : 'tidak_stabil';
  p.status = dead ? 'meninggal' : 'keluar';
  p.endedAt = now;
  const bed = shift.beds.find((b) => b.patientId === p.id);
  if (bed) bed.patientId = null;
  shift.ventilators = shift.ventilators.map((x) => (x === p.id ? null : x));
  for (const t of shift.tasks.filter((x) => x.patientId === p.id)) finishTask(shift, t);
  for (const inf of p.infusions) inf.stoppedAt ??= now;
  const dest = DISPOSITIONS_BY_ID.get(p.disposition?.to ?? 'bangsal')?.label ?? '';
  log(shift, p.id, dead ? `${p.address} dipindahkan ke kamar jenazah.` : `${p.address} meninggalkan IGD → ${dest} (${p.outcome === 'stabil' ? 'stabil' : 'BELUM stabil'}).`, dead ? 'buruk' : p.outcome === 'stabil' ? 'baik' : 'buruk');
}

export function endShift(shift: EdShift, ctx: EdContext): void {
  if (shift.status === 'selesai') return;
  shift.status = 'selesai';
  for (const p of shift.patients) {
    if (p.status === 'akan_datang') continue;
    if (p.outcome === null) {
      const v = vitalsOf(p, shift.time);
      const sc = scenarioOf(ctx, p);
      p.outcome = p.physio.dead ? 'meninggal' : sc.stable(v, p.physio, shift.time) ? 'stabil' : 'tidak_stabil';
      p.endedAt = shift.time;
    }
  }
  log(shift, null, 'Shift jaga berakhir.', 'info');
}

// ---------------------------------------------------------------------------
// Aksi pemain
// ---------------------------------------------------------------------------

const ok = (message: string): ActResult => ({ ok: true, message });
const fail = (message: string): ActResult => ({ ok: false, message });

function inBed(p: EdPatient): boolean {
  return p.status === 'dirawat' || p.status === 'pindah';
}

function hasIv(p: EdPatient): boolean {
  return p.devices.ivCount > 0 || p.devices.io;
}

export function freeBeds(shift: EdShift): EdShift['beds'] {
  return shift.beds.filter((b) => b.patientId === null);
}

export function act(shift: EdShift, patientId: string, action: EdAction, ctx: EdContext): ActResult {
  if (shift.status !== 'berjalan') return fail('Shift sudah berakhir.');
  const p = patientById(shift, patientId);
  if (!p || p.status === 'akan_datang') return fail('Pasien tidak ditemukan.');
  if (p.status === 'keluar' || p.status === 'meninggal') return fail('Pasien sudah meninggalkan IGD.');
  const sc = scenarioOf(ctx, p);
  const now = shift.time;
  const away = p.awayUntil !== null && now < p.awayUntil;
  const doctorAction = (seconds: number, label: string): ActResult | null => {
    const d = doctorBusy(shift);
    if (d.busy) return fail(busyMessage(shift, p.id));
    shift.doctor.busyUntil = now + seconds;
    shift.doctor.bedId = p.bedId;
    shift.doctor.task = null;
    shift.doctor.label = label;
    shift.doctor.patientId = p.id;
    return null;
  };
  const markSeen = () => {
    p.firstSeenAt ??= now;
  };

  switch (action.type) {
    case 'triase': {
      if (p.status !== 'triase' && p.ats !== null) return fail('Pasien sudah ditriase.');
      p.ats = action.ats;
      p.triagedAt ??= now;
      record(p, { type: 'triage', id: String(action.ats), label: `Triase ATS ${action.ats}` }, now);
      if (action.bedId) {
        const r = placeInBed(shift, p, action.bedId);
        if (!r.ok) {
          p.status = 'menunggu_bed';
          return ok(`Triase ATS ${action.ats}. ${r.message}`);
        }
        return ok(`Triase ATS ${action.ats} → ${r.message}`);
      }
      p.status = 'menunggu_bed';
      return ok(`Triase ATS ${action.ats}. Pasien menunggu bed.`);
    }
    case 'pindah': {
      if (p.ats === null) return fail('Triase pasien dulu.');
      const r = placeInBed(shift, p, action.bedId);
      return r;
    }
    case 'periksa': {
      if (away) return fail('Pasien sedang di radiologi.');
      const def = EXAMS_BY_ID.get(action.exam);
      if (!def) return fail('Pemeriksaan tidak dikenal.');
      const busy = doctorAction(def.seconds, `memeriksa ${def.short.charAt(0).toLowerCase() + def.short.slice(1)}`);
      if (busy) return busy;
      markSeen();
      const s = supportOf(p, now);
      const v = computeVitals(p.physio, s, now);
      const text = examFinding(action.exam, p, sc, v, s, now);
      p.exams[action.exam] = { t: now, text };
      record(p, { type: 'exam', id: action.exam, label: def.short }, now);
      return ok(text);
    }
    case 'tanya': {
      // Bertanya bisa sambil memeriksa; tidak bisa saat mengerjakan tindakan (intubasi, WSD, dsb.).
      if (doctorBusy(shift).busy && shift.doctor.task) return fail(busyMessage(shift, p.id, false));
      const s = supportOf(p, now);
      const v = computeVitals(p.physio, s, now);
      const who = informants(p, sc, v, s, now).find((i) => i.id === action.who);
      if (!who) return fail('Narasumber tidak ada.');
      if (!who.available) return fail(`${who.label} ${who.reason ?? 'tidak dapat ditanya'}.`);
      markSeen();
      const ans = askInformant(action.text, action.topic ?? null, action.who, p, sc, v, s, now, ctx.content);
      p.chat.push({ t: now, who: 'dokter', text: action.text });
      p.chat.push({ t: now, who: action.who, text: ans.text });
      for (const tp of ans.topics) if (!p.askedTopics.includes(tp)) p.askedTopics.push(tp);
      record(p, { type: 'ask', id: ans.topics[0] ?? 'lain', label: `Tanya: ${action.text}` }, now);
      return ok(ans.text);
    }
    case 'penunjang':
      if (!inBed(p)) return fail('Tempatkan pasien di bed dulu.');
      if (away) return fail('Pasien sedang di radiologi.');
      return orderTest(shift, p, action.test, ctx);
    case 'tindakan':
      if (!inBed(p) && !(action.proc === 'oksigen' || action.proc === 'manuver' || action.proc === 'rjp' || action.proc === 'heimlich')) return fail('Tempatkan pasien di bed dulu.');
      if (away) return fail('Pasien sedang di radiologi.');
      return orderProc(shift, p, action.proc, action.param, ctx);
    case 'obat': {
      if (!inBed(p)) return fail('Tempatkan pasien di bed dulu.');
      if (away) return fail('Pasien sedang di radiologi.');
      const drug = DRUGS_BY_ID.get(action.drug);
      if (!drug) return fail('Obat tidak dikenal.');
      if (!drug.routes.includes(action.route)) return fail(`${drug.name} tidak diberikan per ${action.route.toUpperCase()}.`);
      if ((action.route === 'iv' || action.route === 'io' || action.route === 'infus') && !hasIv(p)) return fail('Belum ada akses IV/IO.');
      if (!(action.dose > 0) || !Number.isFinite(action.dose)) return fail('Isi dosis yang valid.');
      const range = drug.range(p.weightKg, action.route, p.physio);
      const doseNote = range ? (action.dose < range[0] * 0.75 ? 'kurang' : action.dose > range[1] * 1.25 ? 'lebih' : 'tepat') : undefined;
      const label = `${drug.name} ${fmtDose(action.dose)} ${drug.unit} ${action.route.toUpperCase()}`;
      const duringArrest = !!p.physio.arrest && (drug.id === 'adrenalin' || drug.id === 'amiodaron') && (action.route === 'iv' || action.route === 'io');
      const idx = record(p, { type: 'drug', id: drug.id, label, route: action.route, dose: action.dose, unit: drug.unit, ...(doseNote ? { doseNote } : {}), ...(duringArrest ? { param: 'henti_jantung' } : {}) }, now);
      markSeen();
      const urgent = !!p.physio.arrest;
      enqueue(shift, p, 'perawat', `Berikan ${label}`, urgent ? 30 : DRUG_SECONDS[action.route], { kind: 'drug', id: drug.id, route: action.route, dose: action.dose }, idx);
      return ok(`Instruksi: ${label}.`);
    }
    case 'infus_obat': {
      if (!inBed(p)) return fail('Tempatkan pasien di bed dulu.');
      const drug = DRUGS_BY_ID.get(action.drug);
      if (!drug?.infusion) return fail('Obat ini tidak diberikan sebagai infus kontinu.');
      if (!hasIv(p)) return fail('Belum ada akses IV/IO.');
      const running = p.infusions.find((i) => i.kind === 'obat' && i.ref === drug.id && i.stoppedAt === null);
      if (action.rate <= 0) {
        if (running) running.stoppedAt = now;
        record(p, { type: 'stop', id: drug.id, label: `Hentikan infus ${drug.name}` }, now);
        return ok(`Infus ${drug.name} dihentikan.`);
      }
      const label = `Infus ${drug.name} ${fmtDose(action.rate)} ${drug.infusion.unit}`;
      if (running) {
        running.ratePerMin = action.rate;
        running.label = label;
        record(p, { type: 'drug', id: drug.id, route: 'infus', dose: action.rate, rate: action.rate, unit: drug.infusion.unit, label: `Titrasi ${label}` }, now);
        return ok(`${label} (titrasi).`);
      }
      const idx = record(p, { type: 'drug', id: drug.id, route: 'infus', dose: action.rate, rate: action.rate, unit: drug.infusion.unit, label }, now);
      markSeen();
      enqueue(shift, p, 'perawat', `Pasang ${label}`, INFUSION_SECONDS, { kind: 'drug', id: drug.id, route: 'infus', dose: action.rate }, idx);
      return ok(`Instruksi: ${label}.`);
    }
    case 'cairan': {
      if (!inBed(p)) return fail('Tempatkan pasien di bed dulu.');
      if (!hasIv(p)) return fail('Belum ada akses IV/IO.');
      const f = FLUIDS_BY_ID.get(action.fluid);
      if (!f || !(action.volumeMl > 0) || !(action.overMin > 0)) return fail('Isi cairan, volume, dan lama pemberian.');
      const label = `${f.label} ${action.volumeMl} ml dalam ${action.overMin} menit`;
      const idx = record(p, { type: 'fluid', id: f.id, fluid: f.id, volumeMl: action.volumeMl, label }, now);
      markSeen();
      enqueue(shift, p, 'perawat', `Pasang ${label}`, INFUSION_SECONDS, { kind: 'fluid', id: f.id, volumeMl: action.volumeMl, overMin: action.overMin }, idx);
      return ok(`Instruksi: ${label}.`);
    }
    case 'hentikan_infus': {
      const inf = p.infusions.find((i) => i.id === action.infusionId);
      if (!inf || inf.stoppedAt !== null) return fail('Infus tidak berjalan.');
      inf.stoppedAt = now;
      record(p, { type: 'stop', id: inf.ref, label: `Hentikan ${inf.label}` }, now);
      return ok(`${inf.label} dihentikan.`);
    }
    case 'hentikan_tugas': {
      const task = shift.tasks.find((t) => t.id === action.taskId && t.patientId === p.id);
      if (!task) return fail('Tugas tidak ditemukan.');
      stopTask(shift, task.id);
      record(p, { type: 'stop', id: task.action.kind === 'proc' ? task.action.id : task.label, label: `Hentikan: ${task.label}` }, now);
      return ok(`${task.label} dihentikan.`);
    }
    case 'konsul': {
      const spec = SPECIALTIES_BY_ID.get(action.specialty);
      if (!spec) return fail('Konsulen tidak dikenal.');
      if (p.consults.some((c) => c.specialty === action.specialty && !c.answered)) return fail('Konsul sedang menunggu jawaban.');
      const busy = doctorAction(60, `menelepon konsulen ${spec.label ?? action.specialty}`);
      if (busy) return busy;
      const r = createRng(deriveSeed(shift.seed, `konsul-${p.id}-${action.specialty}`));
      const wait = r.int(spec.responseMin[0], spec.responseMin[1]) * 60;
      const expected = sc.disposition.consult ?? [];
      const accepted = expected.includes(action.specialty);
      const advice = accepted
        ? consultAdvice(sc, action.specialty)
        : 'Dari bidang kami tidak ada indikasi penanganan saat ini — silakan lanjutkan stabilisasi dan konsultasikan ke bagian yang sesuai.';
      p.consults.push({ specialty: action.specialty, requestedAt: now, answerAt: now + wait, answered: false, accepted, advice });
      record(p, { type: 'consult', id: action.specialty, label: `Konsul ${spec.label}` }, now);
      p.chat.push({ t: now, who: 'dokter', text: `(Menelepon ${spec.label} — laporan SBAR)` });
      return ok(`Konsul ${spec.label} — menunggu jawaban ± ${Math.round(wait / 60)} menit.`);
    }
    case 'diagnosis': {
      p.diagnosis = { primary: action.primary, secondary: [...action.secondary] };
      record(p, { type: 'diagnosis', id: action.primary ?? '-', label: 'Diagnosis kerja diperbarui' }, now);
      return ok('Diagnosis kerja dicatat.');
    }
    case 'disposisi': {
      if (p.disposition) return fail('Disposisi sudah ditetapkan.');
      if (p.ats === null) return fail('Triase pasien dulu.');
      const def = DISPOSITIONS_BY_ID.get(action.to);
      if (!def) return fail('Disposisi tidak dikenal.');
      if (action.to === 'meninggal' && !p.physio.dead) return fail('Pasien belum dinyatakan meninggal.');
      if (def.needsConsult) {
        const acc = p.consults.find((c) => c.answered && c.accepted);
        const anyAnswered = p.consults.some((c) => c.answered);
        if (!acc && !(action.to === 'bangsal' && anyAnswered)) return fail('Butuh persetujuan konsulen (konsul belum dijawab/menolak).');
      }
      if (action.to !== 'meninggal' && p.physio.arrest) return fail('Pasien sedang henti jantung.');
      p.disposition = { to: action.to, at: now, leaveAt: now + def.leaveMin * 60 };
      p.status = 'pindah';
      record(p, { type: 'disposition', id: action.to, label: `Disposisi: ${def.label}` }, now);
      log(shift, p.id, `Disposisi ${p.address}: ${def.label} (berangkat ± ${def.leaveMin} menit).`, 'info');
      return ok(`Disposisi: ${def.label}.`);
    }
  }
}

function fmtDose(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toLocaleString('id-ID', { maximumFractionDigits: 3 });
}

function consultAdvice(sc: EdScenario, sp: Specialty): string {
  const best = sc.disposition.best[0];
  const where: Record<Disposition, string> = {
    pulang: 'rawat jalan',
    bangsal: 'rawat inap bangsal',
    hcu_icu: 'HCU/ICU',
    kamar_operasi: 'kamar operasi',
    kateterisasi: 'laboratorium kateterisasi',
    rujuk: 'rujukan ke RS dengan fasilitas yang sesuai',
    meninggal: '-',
  };
  const base = sp === 'anestesi' ? 'Setuju, ICU siap menerima' : 'Setuju, pasien kami ambil alih';
  return `${base}. Rencana ${best ? where[best] : 'rawat inap'}. Lanjutkan stabilisasi sesuai instruksi sampai pasien dijemput.`;
}

function placeInBed(shift: EdShift, p: EdPatient, bedId: string): ActResult {
  const bed = shift.beds.find((b) => b.id === bedId);
  if (!bed) return fail('Bed tidak ditemukan.');
  if (bed.patientId && bed.patientId !== p.id) return fail(`${bed.label} terisi.`);
  const old = shift.beds.find((b) => b.patientId === p.id);
  if (old) old.patientId = null;
  bed.patientId = p.id;
  p.bedId = bed.id;
  if (p.status === 'triase' || p.status === 'menunggu_bed') p.status = 'dirawat';
  return ok(`${p.address} di ${bed.label}.`);
}

function orderTest(shift: EdShift, p: EdPatient, id: TestId, ctx: EdContext): ActResult {
  const def = TESTS_BY_ID.get(id);
  if (!def) return fail('Pemeriksaan tidak dikenal.');
  const now = shift.time;
  if (p.tests.some((o) => o.id === id && o.status !== 'selesai')) return fail('Pemeriksaan ini sedang diproses.');
  const idx = record(p, { type: 'test', id, label: def.label }, now);
  p.firstSeenAt ??= now;
  const order = { id, orderedAt: now, sampledAt: null as number | null, readyAt: null as number | null, status: 'menunggu' as const, result: null as string | null, abnormal: false };
  p.tests.push(order);
  const o = p.tests[p.tests.length - 1]!;
  if (def.byDoctor) {
    const d = doctorBusy(shift);
    if (d.busy) {
      p.tests.pop();
      p.actions.pop();
      return fail(busyMessage(shift, p.id));
    }
    enqueue(shift, p, 'dokter', def.label, def.seconds, { kind: 'test_bedside', id }, idx);
    return ok(`Anda melakukan ${def.label}.`);
  }
  if (def.kind === 'radiologi') {
    const v = vitalsOf(p, now);
    if (def.awayMin) {
      const unstable = !!p.physio.arrest || (v.sbp ?? 0) < 90 || (v.spo2 ?? 0) < 90 || (v.gcs.total <= 8 && p.devices.adjunct !== 'ett') || p.physio.seizure;
      if (unstable) p.actions[idx]!.harms = [...(p.actions[idx]!.harms ?? []), 'ct_tidak_stabil'];
      p.awayUntil = now + def.awayMin * 60;
      log(shift, p.id, `${p.address} dibawa ke radiologi (${def.label}).`, 'info');
    }
    sample(shift, p, o, ctx, now + (def.awayMin ? def.awayMin * 30 : 120));
    return ok(`${def.label} diminta — hasil ± ${def.turnaround} menit.`);
  }
  if (def.blood) {
    if (p.devices.bloodDrawnAt !== null && now - p.devices.bloodDrawnAt < 20 * 60) {
      sample(shift, p, o, ctx, now);
      return ok(`${def.label} dari sampel yang sudah diambil — hasil ± ${def.turnaround} menit.`);
    }
    if (!shift.tasks.some((t) => t.patientId === p.id && t.action.kind === 'sample')) {
      enqueue(shift, p, 'perawat', 'Ambil sampel darah', hasIv(p) ? 60 : 150, { kind: 'sample', tests: [] }, null);
    }
    return ok(`${def.label} diminta — menunggu sampel darah.`);
  }
  enqueue(shift, p, 'perawat', def.label, def.seconds, { kind: 'test_bedside', id }, idx);
  return ok(`${def.label} diminta.`);
}

/** Ambil sampel/lakukan pemeriksaan sekarang: hasil dihitung dari kondisi saat ini, keluar setelah waktu tunggu. */
function sample(shift: EdShift, p: EdPatient, o: EdPatient['tests'][number], ctx: EdContext, at = shift.time): void {
  const def = TESTS_BY_ID.get(o.id)!;
  const s = supportOf(p, shift.time);
  const v = computeVitals(p.physio, s, shift.time);
  const r = testResult(o.id, p, scenarioOf(ctx, p), v, s, shift.time);
  o.sampledAt = shift.time;
  o.readyAt = at + def.turnaround * 60;
  o.status = 'diproses';
  o.result = r.text;
  o.abnormal = r.abnormal;
  if (def.turnaround === 0) {
    o.status = 'selesai';
    o.readyAt = shift.time;
  }
}

function orderProc(shift: EdShift, p: EdPatient, id: ProcId, param: string | undefined, ctx: EdContext): ActResult {
  const def = PROCS_BY_ID.get(id);
  if (!def) return fail('Tindakan tidak dikenal.');
  const now = shift.time;
  const d = p.devices;
  // Hentikan tindakan berkelanjutan (BVM, RJP).
  if (def.continuous && param === 'henti') {
    const running = shift.tasks.filter((t) => t.patientId === p.id && t.action.kind === 'proc' && t.action.id === id);
    if (!running.length) return fail(`${def.label} tidak sedang berjalan.`);
    for (const t of running) stopTask(shift, t.id);
    record(p, { type: 'stop', id, label: `Hentikan: ${def.label}` }, now);
    return ok(`${def.label} dihentikan.`);
  }
  if (def.params && !param) return fail(`Pilih ${def.params.label.toLowerCase()}.`);
  // Validasi prasyarat.
  if (id === 'ventilator') {
    if (d.adjunct !== 'ett') return fail('Ventilator butuh pasien terintubasi.');
    if (!shift.ventilators.includes(null) && !shift.ventilators.includes(p.id)) return fail('Semua ventilator sedang dipakai.');
  }
  if ((id === 'defibrilasi' || id === 'kardioversi' || id === 'pacing') && !d.pads) return fail('Pasang pad defibrilator dulu.');
  if (id === 'rjp' && d.cpr) return fail('RJP sedang berjalan.');
  if (id === 'bvm' && (d.assist === 'bvm' || d.assist === 'ventilator')) return fail('Ventilasi bantuan sudah berjalan.');
  if (id === 'iv' && d.ivCount >= 2) return fail('Sudah ada dua jalur IV.');
  if (id === 'hentikan_rjp' && !d.cpr && !p.physio.arrest) return fail('RJP tidak sedang berjalan.');
  if (id === 'nyatakan_meninggal' && !p.physio.arrest && !p.physio.dead) return fail('Pasien tidak dalam henti jantung.');
  const label = def.params && param ? `${def.label}: ${def.params.options.find((o) => o.id === param)?.label ?? param}` : def.label;
  const r: Omit<ActionRecord, 't'> = { type: id === 'oksigen' ? 'oxygen' : 'proc', id, label, ...(param !== undefined ? { param } : {}) };
  if (id === 'oksigen' && param) {
    const [dev, flow] = param.split(':') as [OxygenDevice, string | undefined];
    r.fio2 = FIO2[dev](Number(flow ?? 0));
  }
  const idx = record(p, r, now);
  p.firstSeenAt ??= now;
  if (def.performer === 'dokter') {
    const busy = doctorBusy(shift);
    if (busy.busy && id !== 'hentikan_rjp' && id !== 'defibrilasi') {
      p.actions.pop();
      return fail(busyMessage(shift, p.id));
    }
    if (id === 'hentikan_rjp' || id === 'defibrilasi') {
      // Tindakan sekejap saat henti jantung: langsung.
      executeTask(shift, p, { id: 'now', patientId: p.id, performer: 'dokter', nurseId: null, label, duration: def.seconds, createdAt: now, startedAt: now, continuous: false, action: { kind: 'proc', id, ...(param !== undefined ? { param } : {}) }, record: idx }, ctx);
      return ok(label);
    }
    enqueue(shift, p, 'dokter', label, def.seconds, { kind: 'proc', id, ...(param !== undefined ? { param } : {}) }, idx);
    return ok(`Anda mengerjakan: ${label}.`);
  }
  enqueue(shift, p, 'perawat', label, def.seconds, { kind: 'proc', id, ...(param !== undefined ? { param } : {}) }, idx, !!def.continuous);
  return ok(`Instruksi perawat: ${label}.`);
}

// ---------------------------------------------------------------------------
// Pelaksanaan tugas (efek klinis)
// ---------------------------------------------------------------------------

function harmCheck(shift: EdShift, p: EdPatient, idx: number | null, generic: readonly string[], ctx: EdContext): void {
  if (idx === null) return;
  const rec = p.actions[idx];
  if (!rec) return;
  const sc = scenarioOf(ctx, p);
  const s = supportOf(p, shift.time);
  const v = computeVitals(p.physio, s, shift.time);
  const hctx: HarmContext = { vitals: v, physio: p.physio, patient: p, minute: minuteOf(p, shift.time), done: (m) => done(p, m, rec.t - 1e-6) };
  const harms = new Set(rec.harms ?? []);
  for (const g of generic) harms.add(g);
  for (const h of sc.harmful ?? []) {
    if (recordMatches(h.match, rec, p) && (!h.when || h.when(hctx))) harms.add(h.id);
  }
  rec.harms = [...harms];
  rec.doneAt = shift.time;
  for (const h of generic) {
    const g = GENERIC_HARMS[h];
    if (g?.severity === 'berat') note(shift, p, `Perhatian keselamatan: ${g.label}.`, 'buruk');
  }
}

function executeTask(shift: EdShift, p: EdPatient, task: EdTask, ctx: EdContext): void {
  const now = shift.time;
  const a = task.action;
  switch (a.kind) {
    case 'drug': {
      const drug = DRUGS_BY_ID.get(a.id)!;
      if (a.route === 'infus' && drug.infusion) {
        p.infusions.push({ id: `i${shift.counter++}`, kind: 'obat', ref: drug.id, label: `Infus ${drug.name} ${fmtDose(a.dose)} ${drug.infusion.unit}`, volumeMl: 0, givenMl: 0, ratePerMin: a.dose, startedAt: now, stoppedAt: null });
        harmCheck(shift, p, task.record, [], ctx);
        return;
      }
      const rec = task.record !== null ? p.actions[task.record] : undefined;
      if (rec?.param === 'henti_jantung' && !p.physio.arrest) {
        // Dosis henti jantung tidak disuntikkan bila nadi sudah kembali (ROSC).
        rec.label += ' — dibatalkan (ROSC)';
        rec.doneAt = now;
        note(shift, p, `${drug.name} dosis henti jantung dibatalkan perawat karena nadi sudah kembali.`, 'info');
        return;
      }
      const s = supportOf(p, now);
      const v = computeVitals(p.physio, s, now);
      const out = drug.apply({ p: p.physio, s, v, dose: a.dose, route: a.route, now, kg: p.weightKg, rand: rand(shift) });
      if (out.note) note(shift, p, out.note, out.noteKind ?? 'info');
      harmCheck(shift, p, task.record, out.harms ?? [], ctx);
      return;
    }
    case 'fluid': {
      const f = FLUIDS_BY_ID.get(a.id)!;
      p.infusions.push({ id: `i${shift.counter++}`, kind: 'cairan', ref: f.id, label: `${f.label} ${a.volumeMl} ml`, volumeMl: a.volumeMl, givenMl: 0, ratePerMin: a.volumeMl / a.overMin, startedAt: now, stoppedAt: null });
      p.fluidsMl[a.id] = (p.fluidsMl[a.id] ?? 0) + a.volumeMl;
      const generic: string[] = [];
      const crystalloid = (p.fluidsMl.nacl ?? 0) + (p.fluidsMl.rl ?? 0);
      if (p.physio.v.bleed > 0.003 && crystalloid / p.weightKg > 30 && (a.id === 'nacl' || a.id === 'rl')) generic.push('kristaloid_berlebih_perdarahan');
      const pump = eff(p.physio, 'pump', now) * (1 - 0.32 * eff(p.physio, 'ischemia', now));
      if ((pump < 0.8 || eff(p.physio, 'edema', now) > 0.25) && a.volumeMl >= 250 && f.id !== 'prc') generic.push('cairan_berlebih_jantung');
      if (p.physio.v.bleed > 0.003 && crystalloid / p.weightKg > 30) addRamp(p.physio, 'bleed', p.physio.v.bleed * 0.12, now, 10, 30, 'koagulopati dilusi');
      harmCheck(shift, p, task.record, generic, ctx);
      return;
    }
    case 'sample': {
      p.devices.bloodDrawnAt = now;
      for (const o of p.tests) {
        if (o.status === 'menunggu' && TESTS_BY_ID.get(o.id)?.blood) sample(shift, p, o, ctx);
      }
      log(shift, p.id, `Sampel darah ${p.address} terkirim ke laboratorium.`, 'tugas');
      return;
    }
    case 'test_bedside': {
      const o = [...p.tests].reverse().find((x) => x.id === a.id && x.status === 'menunggu');
      if (o) sample(shift, p, o, ctx);
      harmCheck(shift, p, task.record, [], ctx);
      if (o?.status === 'selesai') log(shift, p.id, `Hasil ${TESTS_BY_ID.get(o.id)?.label} ${p.address}: ${o.result}`, 'hasil');
      return;
    }
    case 'ttv': {
      p.knownVitals = { t: now, vitals: vitalsOf(p, now) };
      return;
    }
    case 'proc':
      applyProc(shift, p, a.id, a.param, task.record, ctx);
      return;
  }
}

function applyProc(shift: EdShift, p: EdPatient, id: ProcId, param: string | undefined, idx: number | null, ctx: EdContext): void {
  const now = shift.time;
  const ph = p.physio;
  const d = p.devices;
  const s = supportOf(p, now);
  const v = computeVitals(ph, s, now);
  const generic: string[] = [];
  const r = rand(shift);
  switch (id) {
    case 'monitor':
      d.monitor = true;
      p.knownVitals = { t: now, vitals: v };
      break;
    case 'ttv':
      p.knownVitals = { t: now, vitals: v };
      log(shift, p.id, `TTV ${p.address}: TD ${v.sbp ?? '—'}/${v.dbp ?? '—'}, N ${v.pulse ? v.hr : 'tidak teraba'}, RR ${v.rr}, SpO₂ ${v.spo2 ?? '—'}%, S ${v.temp} °C, GCS ${gcsText(v)}`, 'hasil');
      break;
    case 'iv': {
      const shock = (v.map ?? 0) < 60 || !!ph.arrest;
      const fail = p.age < 6 ? 0.45 : shock ? 0.3 : 0.07;
      if (r() < fail) {
        note(shift, p, 'Pemasangan IV gagal (vena kolaps/sulit) — coba lagi atau akses intraoseus.', 'info');
        break;
      }
      d.ivCount = Math.min(2, d.ivCount + 1);
      break;
    }
    case 'io':
      d.io = true;
      break;
    case 'ambil_darah':
      executeTask(shift, p, { id: 'x', patientId: p.id, performer: 'perawat', nurseId: null, label: '', duration: 0, createdAt: now, startedAt: now, continuous: false, action: { kind: 'sample', tests: [] }, record: null }, ctx);
      break;
    case 'oksigen': {
      const [dev, flow] = (param ?? 'udara').split(':') as [OxygenDevice, string | undefined];
      d.oxygen = dev;
      d.flow = Number(flow ?? 0);
      const fio2 = FIO2[dev](d.flow);
      if (fio2 >= 0.5 && (v.spo2 ?? 0) >= 95 && ph.v.ischemia > 0.05 && !ph.arrest) generic.push('oksigen_berlebih');
      break;
    }
    case 'posisi': {
      d.position = (param ?? 'terlentang') as Position;
      const breathless = eff(ph, 'edema', now) > 0.2 || eff(ph, 'spasm', now) > 0.4;
      if (breathless && (d.position === 'terlentang' || d.position === 'kaki_diangkat') && v.gcs.total >= 13) generic.push('posisi_terlentang_sesak');
      break;
    }
    case 'manuver':
      if (d.adjunct === 'none') d.adjunct = 'manuver';
      break;
    case 'suction':
      d.lastSuction = now;
      break;
    case 'opa':
    case 'npa':
      d.adjunct = id;
      if (id === 'opa' && v.gcs.total >= 9 && !ph.arrest) {
        note(shift, p, 'Pasien tersedak/muntah saat OPA dipasang (refleks muntah masih ada) — OPA dilepas.', 'buruk');
        d.adjunct = 'manuver';
      }
      break;
    case 'heimlich': {
      if (ph.airwayCause === 'benda_asing' && ph.v.airway < 0.6) {
        if (r() < 0.6) {
          ph.v.airway = 1;
          ph.rate.airway = 0;
          ph.airwayCause = null;
          note(shift, p, 'Benda asing keluar! Pasien terbatuk dan menangis/bernapas.', 'baik');
        } else note(shift, p, 'Benda asing belum keluar — ulangi.', 'buruk');
      }
      break;
    }
    case 'bvm':
      if (d.assist !== 'ventilator') d.assist = 'bvm';
      break;
    case 'intubasi': {
      const difficult = eff(ph, 'angioedema', now) > 0.4 || ph.airwayCause === 'inhalasi' || ph.airwayCause === 'benda_asing';
      const needed = v.gcs.total <= 8 || !!ph.arrest || (v.spo2 ?? 0) < 88 || v.paco2 > 60 || eff(ph, 'angioedema', now) > 0.35 || ph.airwayCause === 'inhalasi' || eff(ph, 'fatigue', now) > 0.4 || ph.seizure;
      if (!needed) generic.push('intubasi_tanpa_indikasi');
      if (r() < (difficult ? 0.35 : 0.1)) {
        addMod(ph, 'airway', -0.4, now, 0.1, 1, 1, 'intubasi gagal');
        note(shift, p, 'Intubasi gagal pada percobaan pertama — desaturasi. Oksigenasi ulang dengan BVM, lalu coba lagi.', 'buruk');
        d.assist = 'bvm';
        break;
      }
      d.adjunct = 'ett';
      d.assist = d.assist === 'ventilator' ? 'ventilator' : 'bvm';
      addMod(ph, 'sedation', 0.55, now, 0.5, 180, 30, 'sedasi pasca-intubasi');
      if ((v.map ?? 0) < 65 && !ph.arrest) addMod(ph, 'map', -15, now, 0.5, 5, 10, 'hipotensi pascainduksi');
      note(shift, p, 'Intubasi berhasil — ETT terkonfirmasi (kapnografi). Ventilasi dengan BVM; sambungkan ventilator.', 'baik');
      break;
    }
    case 'ventilator': {
      const slot = shift.ventilators.indexOf(null);
      if (slot >= 0 && !shift.ventilators.includes(p.id)) shift.ventilators[slot] = p.id;
      d.assist = 'ventilator';
      stopContinuousFor(shift, p, 'bvm');
      break;
    }
    case 'dekompresi_jarum': {
      const side = param as 'kiri' | 'kanan';
      const tension = eff(ph, 'obstruction', now) > 0.2;
      if (tension && ph.chestSide === side) {
        ph.v.obstruction = 0.03;
        ph.v.ptx = Math.min(ph.v.ptx, 0.45);
        ph.rate.obstruction = 0;
        note(shift, p, 'Desis udara keluar dari jarum — nadi & saturasi membaik. Lanjutkan pemasangan chest tube.', 'baik');
      } else {
        generic.push('dekompresi_tanpa_indikasi');
        if (ph.chestSide !== side) ph.v.ptx = Math.min(1, ph.v.ptx + 0.12);
        note(shift, p, 'Tidak ada udara bertekanan keluar dari jarum.', 'info');
      }
      break;
    }
    case 'wsd': {
      const side = param as 'kiri' | 'kanan';
      if (ph.chestSide === side) {
        ph.v.obstruction = 0;
        ph.v.ptx = 0.05;
        ph.rate.obstruction = 0;
        ph.rate.ptx = 0;
        d.chestTube = side;
        note(shift, p, `Chest tube ${side} terpasang — undulasi (+), paru mengembang.`, 'baik');
      } else {
        generic.push('dekompresi_tanpa_indikasi');
        d.chestTube = side;
      }
      break;
    }
    case 'pad_defib':
      d.pads = true;
      p.knownVitals = { t: now, vitals: v };
      break;
    case 'rjp':
      if (!ph.arrest) generic.push('rjp_bernadi');
      d.cpr = true;
      break;
    case 'hentikan_rjp': {
      const pulse = !ph.arrest;
      note(shift, p, pulse ? `Cek nadi: nadi teraba (${v.hr} x/menit) — RJP dihentikan.` : `Cek irama: ${rhythmLabel(ph.arrest!.rhythm)} — nadi tidak teraba, lanjutkan RJP.`, pulse ? 'baik' : 'info');
      if (pulse) stopContinuousFor(shift, p, 'rjp');
      break;
    }
    case 'defibrilasi': {
      const j = Number(param ?? 200);
      if (!ph.arrest) generic.push('kejut_bernadi');
      else if (ph.arrest.rhythm === 'pea' || ph.arrest.rhythm === 'asistol') generic.push('kejut_tanpa_indikasi');
      const res = deliverShock(ph, s, j, false, now, r);
      const msg = { rosc: 'Kejut diberikan — irama terorganisasi, nadi teraba (ROSC)!', tidak_berubah: 'Kejut diberikan — irama masih VF/VT. Lanjutkan RJP 2 menit.', konversi: 'Irama berubah menjadi sinus.', vf_terpicu: 'Kejut tidak tersinkron pada pasien bernadi — pasien jatuh ke VF!', tanpa_indikasi: 'Kejut diberikan pada irama non-shockable — tidak ada perubahan.' }[res.outcome];
      note(shift, p, msg, res.outcome === 'rosc' || res.outcome === 'konversi' ? 'baik' : 'buruk');
      if (res.outcome === 'rosc') stopContinuousFor(shift, p, 'rjp');
      break;
    }
    case 'kardioversi': {
      const j = Number(param ?? 100);
      addMod(ph, 'sedation', 0.35, now, 0.5, 8, 10, 'sedasi kardioversi');
      if (ph.rhythm === 'sinus' || ph.rhythm === 'sinus_takikardia' || ph.rhythm === 'sinus_bradikardia') generic.push('kardioversi_tanpa_indikasi');
      const res = deliverShock(ph, s, j, true, now, r);
      note(shift, p, res.outcome === 'konversi' ? 'Kardioversi berhasil — irama sinus.' : res.outcome === 'tidak_berubah' ? 'Kardioversi belum berhasil — pertimbangkan energi lebih tinggi.' : 'Kardioversi tidak mengubah irama.', res.outcome === 'konversi' ? 'baik' : 'info');
      break;
    }
    case 'pacing': {
      const rate = Number(param ?? 70);
      if (rate <= 0) {
        d.pacing = null;
        break;
      }
      if (r() < 0.88) {
        d.pacing = rate;
        addMod(ph, 'pain', 0.35, now, 0.2, 240, 10, 'pacu transkutan');
        note(shift, p, `Pacu transkutan ${rate} x/menit — capture elektrik & mekanik (+). Berikan analgesia/sedasi.`, 'baik');
      } else note(shift, p, 'Belum terjadi capture — naikkan arus (mA).', 'info');
      break;
    }
    case 'vagal':
      if (ph.rhythm === 'svt' && r() < 0.25) {
        ph.rhythm = 'sinus';
        ph.rhythmRate = null;
        note(shift, p, 'Manuver vagal berhasil — irama sinus.', 'baik');
      } else note(shift, p, 'Manuver vagal tidak mengubah irama.', 'info');
      break;
    case 'tekan_langsung':
      d.pressure = true;
      break;
    case 'torniket':
      d.tourniquet = true;
      break;
    case 'pelvic_binder':
      d.binder = true;
      break;
    case 'bidai':
      d.splint = true;
      addMod(ph, 'pain', -0.2, now, 1, 600, 10, 'bidai');
      break;
    case 'collar':
      d.collar = true;
      break;
    case 'masase_uterus':
      addMod(ph, 'atony', -0.15, now, 0.5, 6, 6, 'masase uterus');
      addRamp(ph, 'atony', -Math.min(ph.v.atony, 0.06), now, 0, 5, 'masase uterus');
      break;
    case 'kompresi_bimanual':
      addMod(ph, 'atony', -0.5, now, 0.5, 10, 10, 'kompresi bimanual');
      break;
    case 'kateter_urin':
      d.catheter = true;
      break;
    case 'ngt':
      d.ngt = true;
      break;
    case 'selimut_hangat':
      d.warmed = true;
      if (ph.v.temp < 36.5) addRamp(ph, 'temp', Math.min(1.2, 36.8 - ph.v.temp), now, 5, 60, 'penghangatan');
      break;
    case 'dekontaminasi':
      d.decontaminated = true;
      break;
    case 'dinginkan_luka_bakar':
      addMod(ph, 'pain', -0.3, now, 1, 60, 30, 'pendinginan');
      addRamp(ph, 'temp', -0.4, now, 0, 20, 'pendinginan');
      break;
    case 'rawat_luka':
    case 'jahit_luka':
      addMod(ph, 'pain', -0.15, now, 1, 120, 30, 'perawatan luka');
      break;
    case 'nyatakan_meninggal': {
      if (!ph.dead && ph.arrest) {
        const elapsed = (now - ph.arrest.since) / 60;
        const correctable = ph.arrest.cause !== 'herniasi' && elapsed < 15;
        if (correctable) generic.push('hentikan_resusitasi_dini');
        ph.dead = true;
        ph.deathCause = `henti jantung (${causeLabel(ph.arrest.cause)})`;
      }
      d.cpr = false;
      stopContinuousFor(shift, p, 'rjp');
      stopContinuousFor(shift, p, 'bvm');
      p.disposition = { to: 'meninggal', at: now, leaveAt: now + 10 * 60 };
      p.status = 'pindah';
      note(shift, p, `Pasien dinyatakan meninggal pukul ${clockText(shift)}.`, 'buruk');
      break;
    }
  }
  harmCheck(shift, p, idx, generic, ctx);
}

/** Tugas yang sedang berjalan/antre untuk pasien. */
export function tasksOf(shift: EdShift, patientId: string): EdTask[] {
  return shift.tasks.filter((t) => t.patientId === patientId);
}

export function nurseOf(shift: EdShift, task: EdTask): string | null {
  return shift.nurses.find((n) => n.id === task.nurseId)?.name ?? null;
}

/** Pasien yang membutuhkan perhatian (untuk papan IGD). */
export function waitingMinutes(p: EdPatient, now: number): number {
  return Math.max(0, (now - p.arriveAt) / 60);
}

export { firstTime };
