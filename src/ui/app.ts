/**
 * Pengendali UI: menyimpan state permainan + state tampilan, menerima aksi
 * pemain, memanggil logika inti (src/core), lalu menggambar ulang layar.
 *
 * Tampilan terdiri dari dua lapis:
 *  - panggung 3D (ruang praktik & pasien) — menetap, tidak digambar ulang;
 *  - lapisan UI HTML di atasnya (monitor RME, HUD, dialog) — digambar ulang tiap perubahan.
 * UI tidak berisi aturan permainan — semua aturan ada di src/core.
 */
import { buildAppearance, chiefSite, bodySide, type GestureCue, type PatientAppearance, planGestures } from '../core/appearance';
import { askQuestion, canSubmitDecision, EncounterError, performExam, setDdx } from '../core/encounter';
import { type Intent, interpretQuestion } from '../core/nlu';
import { hashString, randomSeed } from '../core/rng';
import { createRun, finishCurrent, retireRun, runStats, startNextPatient, updateEncounter } from '../core/run';
import type { ClinicalDecision, DdxStatus, Disposition, EncounterState, GameConfig, GameContent, RunState } from '../core/types';
import { AiError, type AiAvailability, askAiPatient, getSample } from './ai/patientAi';
import { medicalRecordDialog, settingsDialog, tutorialDialog } from './components/dialogs';
import { h } from './dom';
import { renderConsult } from './screens/consult';
import { renderFinal } from './screens/final';
import { renderSummary } from './screens/summary';
import { renderTitle } from './screens/title';
import {
  applyTheme,
  clearSession,
  loadSession,
  loadSettings,
  type Records,
  saveSession,
  saveSettings,
  type SavedSession,
  type Settings,
  updateRecords,
} from './storage';
import { Director, type Subtitle } from './three/director';
import type { Stage } from './three/stage';

export type Screen = 'title' | 'consult' | 'summary' | 'final';
export type ActionTab = 'anamnesis' | 'fisik' | 'penunjang' | 'penalaran' | 'keputusan';
export type Dialog = 'tutorial' | 'settings' | 'record' | null;
/** Tahap adegan pasien di ruang praktik. */
export type ScenePhase = 'datang' | 'konsultasi' | 'pamit';

/** Draf keputusan akhir (diisi bertahap di tab Keputusan). */
export interface DecisionDraft {
  primary: string | null;
  secondary: string[];
  complications: string[];
  /** true = pemain menyatakan tidak ada komplikasi. */
  noComplication: boolean;
  disposition: Disposition | null;
}

export interface UiState {
  screen: Screen;
  actionTab: ActionTab;
  /** Teks pertanyaan yang sedang diketik. */
  draft: string;
  catalogQuery: string;
  secondaryQuery: string;
  decision: DecisionDraft;
  confirmDecision: boolean;
  /** Pesan singkat (mis. aksi ditolak). */
  notice: string | null;
  dialog: Dialog;
  tutorialStep: number;
  /** Pasien sedang "berpikir" (menunggu pasien AI). */
  waiting: boolean;
  /** Bagian umpan balik yang dibuka di layar ringkasan. */
  openFeedback: string | null;
  phase: ScenePhase;
  /** 0 = pasien belum bicara · 1 = sudah menyapa · 2 = keluhan disampaikan (boleh bertanya). */
  intro: 0 | 1 | 2;
  /** Monitor diperkecil (ponsel) agar ruangan lebih terlihat. */
  monitorSmall: boolean;
}

const EMPTY_DECISION: DecisionDraft = { primary: null, secondary: [], complications: [], noComplication: false, disposition: null };

const INITIAL_UI: UiState = {
  screen: 'title',
  actionTab: 'anamnesis',
  draft: '',
  catalogQuery: '',
  secondaryQuery: '',
  decision: EMPTY_DECISION,
  confirmDecision: false,
  notice: null,
  dialog: null,
  tutorialStep: 0,
  waiting: false,
  openFeedback: null,
  phase: 'konsultasi',
  intro: 2,
  monitorSmall: false,
};

export class App {
  run: RunState | null = null;
  ui: UiState = { ...INITIAL_UI };
  settings: Settings = loadSettings();
  /** Status pasien AI di perangkat ini. */
  ai: AiAvailability = 'checking';
  /** Rekor setelah sesi berakhir (diisi sekali saat layar akhir dibuka). */
  finalRecords: { records: Records; broken: (keyof Records)[] } | null = null;
  /** Indeks log pertama yang "baru" pada render ini (untuk animasi masuk). */
  newLogFrom = 0;
  /** Pertanyaan yang sedang menunggu jawaban pasien AI (ditampilkan sementara di transkrip). */
  pendingQuestion: string | null = null;
  /** Penampilan pasien saat ini (juga dipakai mode tanpa 3D untuk deskripsi teks). */
  appearance: PatientAppearance | null = null;
  /** Jumlah entri log saat render terakhir. */
  private renderedLogLength = 0;
  private aiAbort: AbortController | null = null;
  private readonly director: Director | null;
  private readonly subtitleEl: HTMLElement | null = null;
  private subtitleText = '';
  /** Sidik jari konten untuk validasi sesi tersimpan. */
  readonly contentKey: string;

  constructor(
    private readonly root: HTMLElement,
    readonly content: GameContent,
    private readonly baseConfig: GameConfig,
    /** Panggung 3D; null bila WebGL tidak tersedia (UI tetap berfungsi penuh). */
    readonly stage: Stage | null = null,
    stageUi: HTMLElement | null = null,
  ) {
    this.contentKey = String(
      hashString(
        JSON.stringify([content.diseases, content.tools, content.symptoms, content.anamnesis, content.personalities, content.comorbidities, content.incidentals]),
      ),
    );
    applyTheme(this.settings.theme);
    document.documentElement.classList.toggle('no-3d', !stage);
    if (stage && stageUi) {
      this.subtitleEl = h('div', { class: 'subtitle', 'aria-live': 'off', hidden: true });
      stageUi.append(this.subtitleEl);
      this.director = new Director(stage, {
        onIntro: (intro) => {
          const phase: ScenePhase = this.ui.phase === 'pamit' ? 'pamit' : intro === 2 ? 'konsultasi' : 'datang';
          this.ui = { ...this.ui, intro, phase };
          this.render();
        },
        onSubtitle: (sub) => this.showSubtitle(sub),
        onLeft: () => this.afterPatientLeft(),
      });
      window.addEventListener('resize', () => this.syncStage());
      stage.start();
    } else {
      this.director = null;
    }
  }

  /** Config efektif = config dasar + pengaturan pemain (mis. mode latihan). */
  get config(): GameConfig {
    return { ...this.baseConfig, tests: { ...this.baseConfig.tests, realisticAccuracy: this.settings.realisticTests } };
  }

  get encounter(): EncounterState | null {
    return this.run?.encounter ?? null;
  }

  /** Pasien AI aktif untuk pertanyaan berikutnya? */
  get aiActive(): boolean {
    return this.settings.aiPatient && this.ai === 'ready';
  }

  /** Pemain boleh bertanya/memeriksa (pasien sudah duduk & menyampaikan keluhan)? */
  get canInteract(): boolean {
    return this.ui.phase === 'konsultasi' && this.ui.intro === 2 && this.encounter?.status === 'active';
  }

  /**
   * Entri log yang sudah "terjadi" di ruang praktik: salam & keluhan pembuka baru muncul
   * setelah pasien mengucapkannya (mengikuti adegan kedatangan).
   */
  visibleLog(): EncounterState['log'] {
    const log = this.encounter?.log ?? [];
    if (this.ui.intro >= 2) return log;
    return log.slice(0, this.ui.intro);
  }

  /** Sesi tersimpan yang masih bisa dilanjutkan (atau null). */
  get savedSession(): SavedSession<RunState> | null {
    const saved = loadSession<RunState>(this.contentKey);
    return saved && saved.run.status === 'playing' ? saved : null;
  }

  mount(): void {
    this.render();
    void getSample().then((sample) => {
      this.ai = sample ? 'ready' : 'unavailable';
      this.render();
    });
  }

  // -------------------------------------------------------------------------
  // Aksi pemain
  // -------------------------------------------------------------------------

  startGame(): void {
    const run = createRun(randomSeed(), this.config);
    this.run = startNextPatient(run, this.content, this.config);
    this.ui = { ...INITIAL_UI, screen: 'consult', dialog: this.settings.tutorialSeen ? null : 'tutorial' };
    this.finalRecords = null;
    this.renderedLogLength = 0;
    this.beginScene(false);
    this.render();
  }

  resumeGame(): void {
    const saved = this.savedSession;
    if (!saved) return;
    this.run = saved.run;
    const active = saved.run.encounter?.status === 'active';
    this.ui = { ...INITIAL_UI, screen: active ? 'consult' : 'summary' };
    this.finalRecords = null;
    this.renderedLogLength = 0;
    if (active) this.beginScene(true);
    else this.director?.clear();
    this.render();
  }

  /** Mulai adegan pasien saat ini: datang lewat pintu (atau langsung duduk bila melanjutkan sesi). */
  private beginScene(instant: boolean): void {
    const enc = this.encounter;
    if (!enc) return;
    const c = enc.case;
    this.appearance = buildAppearance(c, this.content);
    if (!this.director) {
      this.ui = { ...this.ui, phase: 'konsultasi', intro: 2 };
      return;
    }
    // Hormati preferensi "kurangi gerakan": tanpa adegan berjalan masuk.
    instant ||= this.reducedMotion;
    this.ui = { ...this.ui, phase: instant ? 'konsultasi' : 'datang', intro: instant ? 2 : 0 };
    const site = chiefSite(c, this.content);
    const complaintGestures: GestureCue[] = site ? [{ kind: 'tunjuk', site, side: bodySide(c, this.content) }] : [];
    void this.director.enter(this.appearance, c.seed, c.patient.callName, c.greeting, c.complaint, complaintGestures, instant);
  }

  /** Lewati adegan datang/pamit. */
  skipScene(): void {
    this.director?.skip();
  }

  setDraft(text: string): void {
    this.ui.draft = text;
  }

  /** Ajukan pertanyaan bebas. Pasien AI bila tersedia; selain itu pemahaman bahasa lokal. */
  async ask(text?: string): Promise<void> {
    const enc = this.encounter;
    const question = (text ?? this.ui.draft).trim();
    if (!enc || !this.canInteract || !question || this.ui.waiting) return;
    this.ui = { ...this.ui, draft: '', notice: null };

    if (!this.aiActive) {
      this.askLocal(enc, question);
      return;
    }
    const sample = await getSample();
    if (!sample) {
      this.ai = 'unavailable';
      this.askLocal(enc, question);
      return;
    }
    // Tampilkan pertanyaan dokter segera, lalu tunggu jawaban.
    this.ui = { ...this.ui, waiting: true };
    this.pendingQuestion = question;
    this.render();
    const controller = new AbortController();
    this.aiAbort = controller;
    const timer = window.setTimeout(() => controller.abort(), 45_000);
    const runAtStart = this.run;
    try {
      const local = interpretQuestion(question, this.content, this.config.anamnesis.maxIntentsPerQuestion).intents;
      const result = await askAiPatient(sample, enc, question, this.content, local, controller.signal);
      if (this.run !== runAtStart || this.encounter !== enc) return; // layar sudah berganti
      this.run = updateEncounter(this.run!, result.state);
      this.perform(enc, result.state, result.reply, result.intents, result.parts, true);
    } catch (e) {
      if (this.run !== runAtStart || this.encounter !== enc) return;
      const code = e instanceof AiError ? e.code : 'upstream_error';
      if (e instanceof AiError && e.permanent) this.ai = 'unavailable';
      const reason =
        code === 'rate_limited'
          ? 'Batas pemakaian Claude tercapai — pertanyaan ini dijawab mode lokal.'
          : code === 'cancelled'
            ? 'Pasien AI terlalu lama menjawab — dijawab mode lokal.'
            : this.ai === 'unavailable'
              ? 'Pasien AI tidak tersedia — beralih ke mode lokal.'
              : 'Pasien AI gagal menjawab — dijawab mode lokal.';
      this.askLocal(enc, question, false);
      this.ui = { ...this.ui, notice: reason };
    } finally {
      window.clearTimeout(timer);
      if (this.aiAbort === controller) this.aiAbort = null;
      this.pendingQuestion = null;
      this.ui = { ...this.ui, waiting: false };
      this.render();
      this.root.querySelector<HTMLTextAreaElement>('[data-ask-input]')?.focus();
    }
  }

  private askLocal(enc: EncounterState, question: string, rerender = true): void {
    try {
      const r = askQuestion(enc, question, this.content, this.config);
      this.run = updateEncounter(this.run!, r.state);
      this.perform(enc, r.state, r.reply, r.intents, r.parts, r.understood);
    } catch (e) {
      if (!(e instanceof EncounterError)) throw e;
      this.ui = { ...this.ui, notice: e.message };
    }
    if (rerender) this.render();
  }

  /** Pasien 3D mengucapkan jawaban dengan bahasa tubuh yang sesuai isi jawabannya. */
  private perform(before: EncounterState, after: EncounterState, reply: string, intents: readonly Intent[], parts: readonly string[], understood: boolean): void {
    if (!this.director) return;
    const newlyRevealed = after.revealedSymptoms.filter((s) => !before.revealedSymptoms.includes(s));
    // Obrolan ringan yang dijawab pasien AI tanpa mengambil fakta: cukup mengangguk.
    const gestures: GestureCue[] = understood || intents.length > 0 ? planGestures(after.case, { intents, parts, newlyRevealed }, this.content) : [{ kind: 'bingung' }];
    this.director.say(reply, intents.length === 0 && understood ? [{ kind: 'angguk' }] : gestures);
  }

  performExam(toolId: string): void {
    const before = this.encounter?.examsDone.length ?? 0;
    this.updateEncounter((s) => performExam(s, toolId, this.content, this.config));
    if ((this.encounter?.examsDone.length ?? 0) > before) this.director?.react(toolId);
  }

  setTab(tab: ActionTab): void {
    this.ui = { ...this.ui, actionTab: tab, notice: null, monitorSmall: false };
    this.render();
  }

  toggleMonitor(): void {
    this.ui = { ...this.ui, monitorSmall: !this.ui.monitorSmall };
    this.render();
  }

  setCatalogQuery(query: string): void {
    this.ui.catalogQuery = query;
  }

  setSecondaryQuery(query: string): void {
    this.ui.secondaryQuery = query;
  }

  /** Ubah status kondisi di papan diagnosis banding (null = hapus). */
  setDdx(conditionId: string, status: DdxStatus | null): void {
    this.updateEncounter((s) => setDdx(s, conditionId, status, this.content));
    // Sinkronkan diagnosis utama di draf keputusan.
    const enc = this.encounter;
    if (!enc) return;
    const utama = enc.ddx.find((d) => d.status === 'utama')?.id ?? null;
    if (status === 'utama' || this.ui.decision.primary === conditionId) {
      this.patchDecision({ primary: utama, complications: [], noComplication: false });
    }
  }

  patchDecision(patch: Partial<DecisionDraft>, rerender = true): void {
    this.ui = { ...this.ui, decision: { ...this.ui.decision, ...patch } };
    if (rerender) this.render();
  }

  toggleSecondary(id: string): void {
    const list = this.ui.decision.secondary;
    this.patchDecision({ secondary: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] });
  }

  toggleComplication(id: string): void {
    const list = this.ui.decision.complications;
    this.patchDecision({ complications: list.includes(id) ? list.filter((x) => x !== id) : [...list, id], noComplication: false });
  }

  /** Alasan keputusan belum bisa dikirim (null = siap). */
  decisionBlocker(): string | null {
    const enc = this.encounter;
    if (!enc) return 'Tidak ada pasien.';
    if (!this.canInteract) return 'Tunggu pasien duduk dan menyampaikan keluhannya.';
    const d = this.ui.decision;
    const check = canSubmitDecision(enc, { primary: d.primary ?? undefined, disposition: d.disposition ?? undefined }, this.content);
    if (!check.ok) return check.reason ?? 'Belum lengkap.';
    const disease = d.primary ? this.content.diseasesById.get(d.primary) : undefined;
    if (disease?.complications?.length && !d.noComplication && d.complications.length === 0) {
      return 'Nilai komplikasi: pilih komplikasi yang ada, atau tandai "tanpa komplikasi".';
    }
    return null;
  }

  openConfirmDecision(): void {
    const blocker = this.decisionBlocker();
    this.ui = blocker ? { ...this.ui, notice: blocker } : { ...this.ui, confirmDecision: true, notice: null };
    this.render();
  }

  cancelDecision(): void {
    this.ui = { ...this.ui, confirmDecision: false };
    this.render();
  }

  /** Kirim keputusan: konsultasi dinilai, pasien berpamitan & keluar, lalu umpan balik tampil. */
  submitDecision(): void {
    if (!this.run?.encounter || this.decisionBlocker()) return;
    const d = this.ui.decision;
    const decision: ClinicalDecision = {
      primary: d.primary!,
      secondary: d.secondary,
      complications: d.noComplication ? [] : d.complications,
      disposition: d.disposition!,
    };
    this.aiAbort?.abort();
    this.run = finishCurrent(this.run, decision, this.content, this.config);
    const farewell = this.run.encounter!.log.at(-1);
    if (this.director && farewell?.kind === 'patient' && !this.reducedMotion) {
      this.ui = { ...this.ui, phase: 'pamit', confirmDecision: false, notice: null, actionTab: 'anamnesis', monitorSmall: true };
      this.render();
      void this.director.leave(farewell.text);
    } else {
      this.director?.clear();
      this.afterPatientLeft();
    }
  }

  private get reducedMotion(): boolean {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }

  private afterPatientLeft(): void {
    if (!this.run?.encounter || this.run.encounter.status !== 'finished' || this.ui.screen !== 'consult') return;
    this.ui = { ...this.ui, screen: 'summary', confirmDecision: false, notice: null, openFeedback: null, phase: 'konsultasi' };
    this.render();
    this.root.querySelector<HTMLElement>('.overlay-page')?.scrollTo({ top: 0 });
  }

  toggleFeedback(key: string): void {
    this.ui = { ...this.ui, openFeedback: this.ui.openFeedback === key ? null : key };
    this.render();
  }

  nextPatient(): void {
    if (!this.run || this.run.status !== 'playing') return;
    this.run = startNextPatient(this.run, this.content, this.config);
    this.ui = { ...INITIAL_UI, screen: 'consult' };
    this.renderedLogLength = 0;
    this.beginScene(false);
    this.render();
  }

  /** Akhiri praktek secara sukarela (di antara pasien) dan tampilkan hasil akhir. */
  retire(): void {
    if (!this.run || this.run.status !== 'playing') return;
    this.run = retireRun(this.run);
    this.showFinal();
  }

  /** Tampilkan layar hasil akhir dan perbarui rekor (sekali per sesi). */
  showFinal(): void {
    if (!this.run || this.run.status === 'playing') return;
    if (!this.finalRecords) {
      const stats = runStats(this.run, this.content, this.config);
      this.finalRecords = updateRecords({
        correct: stats.correct,
        bestStreak: stats.bestStreak,
        patients: stats.patientsSeen,
        bestScore: stats.averageScore,
      });
    }
    this.director?.clear();
    this.ui = { ...INITIAL_UI, screen: 'final' };
    this.render();
    this.root.querySelector<HTMLElement>('.overlay-page')?.scrollTo({ top: 0 });
  }

  backToTitle(): void {
    this.director?.clear();
    this.ui = { ...INITIAL_UI };
    this.render();
  }

  // --- Dialog ---------------------------------------------------------------

  openDialog(dialog: Exclude<Dialog, null>): void {
    this.ui = { ...this.ui, dialog, tutorialStep: 0 };
    this.render();
  }

  openTutorial(): void {
    this.openDialog('tutorial');
  }

  setTutorialStep(step: number): void {
    this.ui = { ...this.ui, tutorialStep: step };
    this.render();
  }

  closeDialog(): void {
    if (this.ui.dialog === 'tutorial' && !this.settings.tutorialSeen) this.updateSettings({ tutorialSeen: true }, false);
    this.ui = { ...this.ui, dialog: null };
    this.render();
  }

  updateSettings(patch: Partial<Settings>, rerender = true): void {
    this.settings = { ...this.settings, ...patch };
    saveSettings(this.settings);
    applyTheme(this.settings.theme);
    if (rerender) this.render();
  }

  private updateEncounter(fn: (s: EncounterState) => EncounterState): void {
    if (!this.run?.encounter) return;
    if (this.ui.waiting || !this.canInteract) {
      this.ui = { ...this.ui, notice: this.ui.waiting ? 'Tunggu pasien selesai menjawab.' : 'Tunggu pasien duduk dan menyampaikan keluhannya.' };
      this.render();
      return;
    }
    try {
      this.run = updateEncounter(this.run, fn(this.run.encounter));
      this.ui = { ...this.ui, notice: null };
    } catch (e) {
      if (!(e instanceof EncounterError)) throw e;
      this.ui = { ...this.ui, notice: e.message };
    }
    this.render();
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  render(): void {
    this.persist();

    // Simpan posisi scroll panel & fokus input yang ingin dipertahankan.
    const scrolls = new Map<string, number>();
    this.root.querySelectorAll<HTMLElement>('[data-keep-scroll]').forEach((el) => {
      scrolls.set(el.dataset.keepScroll!, el.scrollTop);
    });
    const focusedKey = (document.activeElement as HTMLElement | null)?.dataset?.focusKey;

    const logLength = this.visibleLog().length + (this.pendingQuestion ? 1 : 0);
    this.newLogFrom = this.ui.screen === 'consult' && logLength > this.renderedLogLength ? this.renderedLogLength : logLength;

    let view: HTMLElement;
    switch (this.ui.screen) {
      case 'title':
        view = renderTitle(this);
        break;
      case 'consult':
        view = renderConsult(this);
        break;
      case 'summary':
        view = renderSummary(this);
        break;
      case 'final':
        view = renderFinal(this);
        break;
    }
    // Layar selain konsultasi tampil sebagai lembar di atas ruang praktik.
    if (this.ui.screen !== 'consult') view = h('div', { class: `overlay-page overlay-page--${this.ui.screen}`, 'data-keep-scroll': this.ui.screen }, view);
    const dialog = this.renderDialog();
    this.root.replaceChildren(...(dialog ? [view, dialog] : [view]));

    this.root.querySelectorAll<HTMLElement>('[data-keep-scroll]').forEach((el) => {
      const top = scrolls.get(el.dataset.keepScroll!);
      if (top !== undefined) el.scrollTop = top;
    });
    if (focusedKey) this.root.querySelector<HTMLElement>(`[data-focus-key="${focusedKey}"]`)?.focus();

    // Gulir transkrip ke bawah bila ada pesan baru.
    const chat = this.root.querySelector<HTMLElement>('[data-chat]');
    if (chat && logLength !== this.renderedLogLength) chat.scrollTop = chat.scrollHeight;
    this.renderedLogLength = logLength;

    // Fokuskan tombol utama di dialog yang terbuka.
    this.root.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    this.syncStage();
  }

  /** Beri tahu panggung area layar yang tidak tertutup panel, dan mode hemat daya. */
  private syncStage(): void {
    const stage = this.stage;
    if (!stage) return;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const consult = this.ui.screen === 'consult';
    let free = { left: 0, top: 0, right: W, bottom: H };
    if (consult) {
      const hud = this.root.querySelector<HTMLElement>('.hud')?.getBoundingClientRect();
      const mon = this.root.querySelector<HTMLElement>('.monitor')?.getBoundingClientRect();
      const top = hud ? hud.bottom : 0;
      if (mon && mon.width > 0) {
        // Monitor di samping (layar lebar) atau di bawah (ponsel).
        free = mon.left > W * 0.3 ? { left: 0, top, right: mon.left, bottom: H } : { left: 0, top, right: W, bottom: mon.top };
      } else free = { left: 0, top, right: W, bottom: H };
    }
    stage.setFreeRect(free);
    stage.setTitleMode(this.ui.screen === 'title');
    stage.setThrottle(this.ui.screen === 'summary' || this.ui.screen === 'final' ? 4 : 1);
    const s = document.documentElement.style;
    s.setProperty('--free-left', `${free.left}px`);
    s.setProperty('--free-right', `${W - free.right}px`);
    s.setProperty('--free-top', `${free.top}px`);
    s.setProperty('--free-bottom', `${H - free.bottom}px`);
    if (this.subtitleEl) this.subtitleEl.hidden = !consult || !this.subtitleText;
  }

  /** Teks jawaban berjalan seiring gerak mulut pasien. */
  private showSubtitle(sub: Subtitle | null): void {
    const el = this.subtitleEl;
    if (!el) return;
    if (!sub) {
      this.subtitleText = '';
      el.hidden = true;
      return;
    }
    const shown = sub.text.slice(0, sub.chars);
    this.subtitleText = shown;
    el.hidden = this.ui.screen !== 'consult' || !shown;
    el.replaceChildren(h('span', { class: 'subtitle__who' }, sub.speaker), h('span', { class: 'subtitle__text' }, shown), sub.done ? '' : h('span', { class: 'subtitle__caret', 'aria-hidden': 'true' }, '▍'));
  }

  private renderDialog(): HTMLElement | null {
    switch (this.ui.dialog) {
      case 'tutorial':
        return tutorialDialog(this);
      case 'settings':
        return settingsDialog(this);
      case 'record':
        return this.encounter ? medicalRecordDialog(this) : null;
      default:
        return null;
    }
  }

  /** Simpan sesi berjalan agar bisa dilanjutkan; hapus jika sudah selesai. */
  private persist(): void {
    if (!this.run) return;
    if (this.run.status === 'playing') saveSession(this.run, this.contentKey);
    else clearSession();
  }
}
