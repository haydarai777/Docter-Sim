/**
 * Sutradara adegan: mengatur urutan kedatangan pasien (pintu terbuka → berjalan → menyapa →
 * duduk → menyampaikan keluhan), ucapan + bahasa tubuh selama konsultasi, reaksi terhadap
 * pemeriksaan, dan kepergian (berpamitan → berdiri → keluar → pintu tertutup).
 *
 * Menjembatani logika permainan (teks, intent, kasus) dengan panggung 3D.
 */
import { Vector3 } from 'three';
import { type CompanionMode, type GestureCue, momentaryEmotion, type PatientAppearance, speechTimeline } from '../../core/appearance';
import { Actor, type ExamReaction } from './actor';
import { LAYOUT } from './room';
import type { Stage, StageUpdatable } from './stage';

export interface Subtitle {
  speaker: string;
  text: string;
  /** Jumlah karakter yang sudah terucap. */
  chars: number;
  done: boolean;
}

export interface DirectorHooks {
  /** 0 = belum ada ucapan · 1 = salam diucapkan · 2 = keluhan disampaikan, siap ditanya. */
  onIntro(stage: 0 | 1 | 2): void;
  onSubtitle(sub: Subtitle | null): void;
  /** Pasien sudah keluar ruangan. */
  onLeft(): void;
}

export type DirectorPhase = 'kosong' | 'datang' | 'konsultasi' | 'pamit';

/** Pengantar pasien anak: penampilannya & cara membawa anak (didampingi / digendong-dipangku). */
export interface CompanionScene {
  look: PatientAppearance;
  mode: CompanionMode;
  /** Nama pengantar untuk subtitle, mis. "Ibu Rina". */
  name: string;
}

/** Kursi pengantar di samping kursi pasien (lihat room.ts). */
const COMPANION_SEAT = { x: -0.98, z: -1.42, yaw: 0.38 };
/** Jalur pengantar dari samping kursi pasien memutar di belakangnya menuju kursi pengantar. */
const COMPANION_PATH = [new Vector3(0.62, 0, -1.85), new Vector3(-0.42, 0, -1.85), new Vector3(-0.5, 0, -1.25)];
/** Isyarat tubuh yang hanya pantas diperagakan pasien sendiri (bukan pengantar yang bercerita). */
const BODY_GESTURES = new Set<GestureCue['kind']>(['tunjuk', 'seluruh_badan', 'peraga', 'meringis']);

const EXAM_REACTION: Record<string, ExamReaction> = {
  tanda_vital: 'ulur_lengan',
  kepala_leher: 'buka_mulut',
  pemeriksaan_paru: 'napas_dalam',
  pemeriksaan_jantung: 'napas_dalam',
  spirometri: 'napas_dalam',
  pemeriksaan_tenggorok: 'buka_mulut',
  segmen_anterior: 'tegak',
  visus: 'tegak',
  funduskopi: 'tegak',
  pemeriksaan_telinga: 'tegak',
  pemeriksaan_hidung: 'tegak',
  saraf_kranial: 'tegak',
};

export class Director implements StageUpdatable {
  phase: DirectorPhase = 'kosong';
  private actor: Actor | null = null;
  /** Pengantar (orang tua/nenek) pasien anak; dialah yang berbicara. */
  private companion: Actor | null = null;
  private companionMode: CompanionMode | null = null;
  private speaker = '';
  private time = 0;
  private token = 0;
  private door = 0;
  private doorTarget = 0;
  private waits: { test: () => boolean; resolve: () => void; token: number }[] = [];
  private readonly focus = new Vector3();
  private subtitleClear = 0;
  /** Penyelesai janji ucapan yang sedang berjalan (dipanggil bila ucapan disela/dibatalkan). */
  private endSpeech: (() => void) | null = null;

  constructor(
    private readonly stage: Stage,
    private readonly hooks: DirectorHooks,
  ) {
    stage.add(this);
    stage.setFocusProvider(() => {
      if (!this.actor) return null;
      this.actor.headPosition(this.focus);
      // Pandang sedikit di bawah wajah agar badan ikut terlihat; makin dekat pasien berdiri,
      // makin ke wajah (dokter mendongak menatap pasien yang berdiri di depan meja).
      const dist = this.focus.distanceTo(LAYOUT.eye);
      const drop = this.actor.mode === 'seated' ? 0.2 : 0.08 + 0.34 * Math.max(0, Math.min(1, (dist - 1.7) / 1.5));
      this.focus.y -= drop;
      return this.focus;
    });
  }

  /** Pasien baru masuk. `instant` = langsung duduk (melanjutkan sesi tersimpan). */
  async enter(
    look: PatientAppearance,
    seed: number,
    speaker: string,
    greeting: string,
    complaint: string,
    complaintGestures: readonly GestureCue[],
    instant: boolean,
    companion: CompanionScene | null = null,
  ): Promise<void> {
    const token = this.begin();
    this.removeActor();
    const actor = (this.actor = new Actor(look, seed));
    this.speaker = speaker;
    this.stage.scene.add(actor.character.root);
    this.stage.add(actor);
    let guide: Actor | null = null;
    if (companion) {
      // Pengantar diperbarui lebih dulu agar anak yang digendong mengikuti posisinya pada frame yang sama.
      this.stage.remove(actor);
      guide = this.companion = new Actor(companion.look, seed ^ 0x5bd1e995);
      this.companionMode = companion.mode;
      this.stage.scene.add(guide.character.root);
      this.stage.add(guide);
      this.stage.add(actor);
      if (companion.mode === 'dampingi') guide.setSeat(COMPANION_SEAT.x, COMPANION_SEAT.z, COMPANION_SEAT.yaw);
    }
    if (companion) this.speaker = companion.name;
    const who = companion ? `Pasien: ${look.age < 1 ? 'bayi' : 'anak'} ${speaker}, diantar ${companion.name}.` : `Pasien: ${speaker}.`;
    this.stage.setCanvasLabel(`Ruang praktik dokter. ${who}${look.observations.length ? ` Yang terlihat: ${look.observations.join(', ')}.` : ''}`);
    this.hooks.onSubtitle(null);
    if (instant) {
      this.placeAllSeated();
      this.phase = 'konsultasi';
      this.doorTarget = 0;
      this.hooks.onIntro(2);
      return;
    }
    this.phase = 'datang';
    this.hooks.onIntro(0);
    const carried = !!guide && companion?.mode === 'pangku';
    if (guide && carried) {
      guide.placeAt(LAYOUT.pathIn[0], 0);
      actor.carry(() => guide.lapAnchor(actor));
      guide.hold(actor);
    } else {
      actor.placeAt(LAYOUT.pathIn[0], 0);
      guide?.placeAt(new Vector3(LAYOUT.pathIn[0].x, 0, LAYOUT.pathIn[0].z - 0.7), 0);
    }
    await this.delay(0.45, token);
    if (token !== this.token) return;
    this.doorTarget = 1;
    await this.until(() => this.door > 0.8, token);
    if (token !== this.token) return;
    // Yang berjalan ke depan kursi pasien: pasien sendiri, atau pengantar yang menggendong.
    const lead = carried ? guide! : actor;
    const path = [...LAYOUT.pathIn.slice(1, -1), lead.standPoint()];
    let arrived = false;
    lead.walkPath(path, 0, () => (arrived = true));
    let guideArrived = !guide || carried;
    if (guide && !carried) {
      // Pengantar menyusul di belakang anak, lalu memutar ke kursi di samping.
      void this.delay(0.7, token).then(() => {
        if (token !== this.token) return;
        guide.walkPath([...LAYOUT.pathIn.slice(1, 3), ...COMPANION_PATH, guide.standPoint()], COMPANION_SEAT.yaw, () => (guideArrived = true));
      });
    }
    // Pintu menutup setelah semua melewati ambang.
    const last = guide && !carried ? guide : lead;
    void this.until(() => last.mode === 'walk' && last.character.root.position.z > -2.35, token).then(() => {
      if (token === this.token) this.doorTarget = 0;
    });
    await this.until(() => arrived && guideArrived, token);
    if (token !== this.token) return;
    this.hooks.onIntro(1);
    await this.speak(greeting, [{ kind: 'salam' }], token);
    if (token !== this.token) return;
    let seated = false;
    let guideSeated = !guide || !!carried;
    lead.sit(() => (seated = true));
    if (guide && !carried) guide.sit(() => (guideSeated = true));
    await this.until(() => seated && guideSeated, token);
    if (token !== this.token) return;
    this.phase = 'konsultasi';
    this.hooks.onIntro(2);
    void this.speak(complaint, complaintGestures, token);
  }

  /** Pasien menjawab: mulut bergerak mengikuti teks, disertai bahasa tubuh yang relevan. */
  say(text: string, gestures: readonly GestureCue[]): void {
    if (!this.actor || this.phase === 'kosong') return;
    void this.speak(text, gestures, this.token);
  }

  /** Reaksi pasien saat diperiksa. */
  react(toolId: string): void {
    const kind = EXAM_REACTION[toolId];
    if (kind && this.actor && this.phase === 'konsultasi') this.actor.react(kind);
  }

  /** Konsultasi selesai: pasien berpamitan lalu meninggalkan ruangan. */
  async leave(farewell: string): Promise<void> {
    const actor = this.actor;
    if (!actor || this.phase === 'kosong') {
      this.hooks.onLeft();
      return;
    }
    const token = this.begin();
    this.phase = 'pamit';
    const guide = this.companion;
    const carried = !!guide && this.companionMode === 'pangku';
    if (actor.mode !== 'seated' || (guide && guide.mode !== 'seated')) this.placeAllSeated();
    await this.speak(farewell, [{ kind: 'salam' }], token);
    if (token !== this.token) return;
    const lead = carried ? guide! : actor;
    let up = false;
    let guideUp = !guide || carried;
    lead.stand(() => (up = true));
    if (guide && !carried) guide.stand(() => (guideUp = true));
    await this.until(() => up && guideUp, token);
    if (token !== this.token) return;
    const out = [...LAYOUT.pathIn].reverse().slice(1);
    let gone = false;
    let guideGone = !guide || carried;
    lead.walkPath(out, null, () => (gone = true));
    if (guide && !carried) guide.walkPath([...COMPANION_PATH].reverse().concat(out.slice(2)), null, () => (guideGone = true));
    const last = guide && !carried ? guide : lead;
    void this.until(() => last.character.root.position.z < -1.7 && lead.character.root.position.z < -1.7, token).then(() => {
      if (token === this.token) this.doorTarget = 1;
    });
    await this.until(() => gone && guideGone, token);
    if (token !== this.token) return;
    // Pintu menutup dulu; pasien (sudah di lorong) baru dihapus setelah tidak terlihat.
    this.doorTarget = 0;
    await this.until(() => this.door < 0.08, token);
    if (token !== this.token) return;
    this.removeActor();
    this.phase = 'kosong';
    this.hooks.onLeft();
  }

  /** Lewati adegan datang / pamit. */
  skip(): void {
    if (this.phase === 'datang' && this.actor) {
      this.begin();
      this.actor.stopTalking();
      this.companion?.stopTalking();
      this.placeAllSeated();
      this.doorTarget = 0;
      this.phase = 'konsultasi';
      this.hooks.onSubtitle(null);
      this.hooks.onIntro(2);
    } else if (this.phase === 'pamit') {
      this.begin();
      this.removeActor();
      this.doorTarget = 0;
      this.phase = 'kosong';
      this.hooks.onSubtitle(null);
      this.hooks.onLeft();
    }
  }

  /** Kosongkan ruangan seketika (kembali ke judul, sesi berakhir). */
  clear(): void {
    this.begin();
    this.removeActor();
    this.doorTarget = 0;
    this.phase = 'kosong';
    this.hooks.onSubtitle(null);
    this.stage.setCanvasLabel('Ruang praktik dokter');
  }

  update(dt: number, time: number): void {
    this.time = time;
    this.door += (this.doorTarget - this.door) * (1 - Math.exp(-3.4 * dt));
    this.stage.room.setDoor(this.door);
    if (this.subtitleClear > 0 && time >= this.subtitleClear) {
      this.subtitleClear = 0;
      this.hooks.onSubtitle(null);
    }
    if (this.waits.length === 0) return;
    const ready = this.waits.filter((w) => w.token !== this.token || w.test());
    if (ready.length === 0) return;
    this.waits = this.waits.filter((w) => !ready.includes(w));
    for (const w of ready) w.resolve();
  }

  // --- Internal ------------------------------------------------------------

  private begin(): number {
    this.token++;
    // Ucapan yang sedang ditunggu adegan lama harus selesai, jika tidak janji (dan aktor yang
    // dirujuknya) tertahan selamanya di memori.
    this.finishSpeech();
    return this.token;
  }

  private finishSpeech(): void {
    const end = this.endSpeech;
    this.endSpeech = null;
    end?.();
  }

  private until(test: () => boolean, token: number): Promise<void> {
    return new Promise((resolve) => this.waits.push({ test, resolve, token }));
  }

  private delay(seconds: number, token: number): Promise<void> {
    const end = this.time + seconds;
    return this.until(() => this.time >= end, token);
  }

  private speak(text: string, gestures: readonly GestureCue[], token: number): Promise<void> {
    // Pasien anak: pengantar yang berbicara; isyarat tubuh (menunjuk, meringis) tetap diperagakan anak.
    const actor = this.companion ?? this.actor;
    if (!actor) return Promise.resolve();
    // Ucapan sebelumnya yang disela jawaban baru dianggap selesai.
    this.finishSpeech();
    actor.stopTalking();
    let talkGestures = gestures;
    if (this.companion && this.actor) {
      talkGestures = gestures.filter((g) => !BODY_GESTURES.has(g.kind));
      const body = gestures.filter((g) => BODY_GESTURES.has(g.kind) && (g.kind === 'meringis' || !this.actor!.carried));
      if (body.length) {
        const childEmotion = momentaryEmotion(body);
        if (childEmotion) this.actor.setEmotion(childEmotion, 2.6);
        this.actor.gesture(body);
      }
    }
    const emotion = momentaryEmotion(talkGestures);
    if (emotion) actor.setEmotion(emotion, 2.6);
    actor.gesture(talkGestures);
    const tl = speechTimeline(text, actor.character.look.talkRate);
    const speaker = this.speaker;
    this.subtitleClear = 0;
    return new Promise((resolve) => {
      let finished = false;
      const end = () => {
        if (finished) return;
        finished = true;
        if (this.endSpeech === end) this.endSpeech = null;
        resolve();
      };
      this.endSpeech = end;
      actor.say(tl, (chars, done) => {
        if (finished) return;
        if (token === this.token || this.actor === actor) this.hooks.onSubtitle({ speaker, text, chars: done ? text.length : chars, done });
        if (done) {
          this.subtitleClear = this.time + Math.min(6, 2.2 + text.length * 0.03);
          end();
        }
      });
    });
  }

  /** Pasien (dan pengantarnya) langsung pada posisi duduk konsultasi. */
  private placeAllSeated(): void {
    const actor = this.actor;
    const guide = this.companion;
    if (guide && this.companionMode === 'pangku') {
      guide.placeSeated();
      if (actor) {
        actor.carry(() => guide.lapAnchor(actor));
        guide.hold(actor);
      }
    } else {
      actor?.placeSeated();
      guide?.placeSeated();
    }
  }

  private removeActor(): void {
    this.finishSpeech();
    if (this.companion) {
      this.stage.remove(this.companion);
      this.companion.dispose();
      this.companion = null;
      this.companionMode = null;
    }
    if (!this.actor) return;
    this.stage.remove(this.actor);
    this.actor.dispose();
    this.actor = null;
  }
}
