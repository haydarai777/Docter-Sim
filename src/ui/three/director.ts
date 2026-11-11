/**
 * Sutradara adegan: mengatur urutan kedatangan pasien (pintu terbuka → berjalan → menyapa →
 * duduk → menyampaikan keluhan), ucapan + bahasa tubuh selama konsultasi, reaksi terhadap
 * pemeriksaan, dan kepergian (berpamitan → berdiri → keluar → pintu tertutup).
 *
 * Menjembatani logika permainan (teks, intent, kasus) dengan panggung 3D.
 */
import { Vector3 } from 'three';
import { type GestureCue, momentaryEmotion, type PatientAppearance, speechTimeline } from '../../core/appearance';
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

const EXAM_REACTION: Record<string, ExamReaction> = {
  tanda_vital: 'ulur_lengan',
  kepala_leher: 'buka_mulut',
  pemeriksaan_paru: 'napas_dalam',
  pemeriksaan_jantung: 'napas_dalam',
  spirometri: 'napas_dalam',
};

export class Director implements StageUpdatable {
  phase: DirectorPhase = 'kosong';
  private actor: Actor | null = null;
  private speaker = '';
  private time = 0;
  private token = 0;
  private door = 0;
  private doorTarget = 0;
  private waits: { test: () => boolean; resolve: () => void; token: number }[] = [];
  private readonly focus = new Vector3();
  private subtitleClear = 0;

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
  async enter(look: PatientAppearance, seed: number, speaker: string, greeting: string, complaint: string, complaintGestures: readonly GestureCue[], instant: boolean): Promise<void> {
    const token = this.begin();
    this.removeActor();
    const actor = (this.actor = new Actor(look, seed));
    this.speaker = speaker;
    this.stage.scene.add(actor.character.root);
    this.stage.add(actor);
    this.stage.setCanvasLabel(`Ruang praktik dokter. Pasien: ${speaker}.${look.observations.length ? ` Yang terlihat: ${look.observations.join(', ')}.` : ''}`);
    this.hooks.onSubtitle(null);
    if (instant) {
      actor.placeSeated();
      this.phase = 'konsultasi';
      this.doorTarget = 0;
      this.hooks.onIntro(2);
      return;
    }
    this.phase = 'datang';
    this.hooks.onIntro(0);
    actor.placeAt(LAYOUT.pathIn[0], 0);
    await this.delay(0.45, token);
    if (token !== this.token) return;
    this.doorTarget = 1;
    await this.until(() => this.door > 0.8, token);
    if (token !== this.token) return;
    const path = [...LAYOUT.pathIn.slice(1, -1), actor.standPoint()];
    let arrived = false;
    actor.walkPath(path, 0, () => (arrived = true));
    // Pintu menutup setelah pasien melewati ambang.
    void this.until(() => actor.character.root.position.z > -2.35, token).then(() => {
      if (token === this.token) this.doorTarget = 0;
    });
    await this.until(() => arrived, token);
    if (token !== this.token) return;
    this.hooks.onIntro(1);
    await this.speak(greeting, [{ kind: 'salam' }], token);
    if (token !== this.token) return;
    let seated = false;
    actor.sit(() => (seated = true));
    await this.until(() => seated, token);
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
    if (actor.mode !== 'seated') actor.placeSeated();
    await this.speak(farewell, [{ kind: 'salam' }], token);
    if (token !== this.token) return;
    let up = false;
    actor.stand(() => (up = true));
    await this.until(() => up, token);
    if (token !== this.token) return;
    const out = [...LAYOUT.pathIn].reverse().slice(1);
    let gone = false;
    actor.walkPath(out, null, () => (gone = true));
    void this.until(() => actor.character.root.position.z < -1.7, token).then(() => {
      if (token === this.token) this.doorTarget = 1;
    });
    await this.until(() => gone, token);
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
      this.actor.placeSeated();
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
    return this.token;
  }

  private until(test: () => boolean, token: number): Promise<void> {
    return new Promise((resolve) => this.waits.push({ test, resolve, token }));
  }

  private delay(seconds: number, token: number): Promise<void> {
    const end = this.time + seconds;
    return this.until(() => this.time >= end, token);
  }

  private speak(text: string, gestures: readonly GestureCue[], token: number): Promise<void> {
    const actor = this.actor;
    if (!actor) return Promise.resolve();
    actor.stopTalking();
    const emotion = momentaryEmotion(gestures);
    if (emotion) actor.setEmotion(emotion, 2.6);
    actor.gesture(gestures);
    const tl = speechTimeline(text, actor.character.look.talkRate);
    const speaker = this.speaker;
    this.subtitleClear = 0;
    return new Promise((resolve) => {
      let finished = false;
      actor.say(tl, (chars, done) => {
        if (finished) return;
        if (token === this.token || this.actor === actor) this.hooks.onSubtitle({ speaker, text, chars: done ? text.length : chars, done });
        if (done) {
          finished = true;
          this.subtitleClear = this.time + Math.min(6, 2.2 + text.length * 0.03);
          resolve();
        }
      });
    });
  }

  private removeActor(): void {
    if (!this.actor) return;
    this.stage.remove(this.actor);
    this.actor.dispose();
    this.actor = null;
  }
}
