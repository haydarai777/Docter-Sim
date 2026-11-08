/**
 * Pengendali UI: menyimpan state permainan + state tampilan, menerima aksi
 * pemain, memanggil logika inti (src/core), lalu menggambar ulang layar.
 *
 * UI tidak berisi aturan permainan — semua aturan ada di src/core.
 */
import { askCategory, askSymptom, EncounterError, performExam } from '../core/encounter';
import { hashString, randomSeed } from '../core/rng';
import { createRun, diagnoseCurrent, retireRun, runStats, startNextPatient, updateEncounter } from '../core/run';
import type { EncounterState, GameConfig, GameContent, RunState, ToolCategory } from '../core/types';
import { medicalRecordDialog, settingsDialog, tutorialDialog } from './components/dialogs';
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

export type Screen = 'title' | 'consult' | 'summary' | 'final';
export type ActionTab = 'anamnesis' | ToolCategory | 'diagnosis';
export type Dialog = 'tutorial' | 'settings' | 'record' | null;

export interface UiState {
  screen: Screen;
  actionTab: ActionTab;
  symptomQuery: string;
  dxQuery: string;
  dxSystem: string | null;
  /** Id penyakit yang sedang dikonfirmasi di dialog. */
  confirmDx: string | null;
  /** Pesan singkat (mis. aksi ditolak). */
  notice: string | null;
  dialog: Dialog;
  tutorialStep: number;
}

const INITIAL_UI: UiState = {
  screen: 'title',
  actionTab: 'anamnesis',
  symptomQuery: '',
  dxQuery: '',
  dxSystem: null,
  confirmDx: null,
  notice: null,
  dialog: null,
  tutorialStep: 0,
};

export class App {
  run: RunState | null = null;
  ui: UiState = { ...INITIAL_UI };
  settings: Settings = loadSettings();
  /** Rekor setelah sesi berakhir (diisi sekali saat layar akhir dibuka). */
  finalRecords: { records: Records; broken: (keyof Records)[] } | null = null;
  /** Indeks log pertama yang "baru" pada render ini (untuk animasi masuk). */
  newLogFrom = 0;
  /** Jumlah entri log saat render terakhir. */
  private renderedLogLength = 0;
  /** Sidik jari konten untuk validasi sesi tersimpan. */
  readonly contentKey: string;

  constructor(
    private readonly root: HTMLElement,
    readonly content: GameContent,
    private readonly baseConfig: GameConfig,
  ) {
    this.contentKey = String(
      hashString(JSON.stringify([content.diseases, content.tools, content.symptoms, content.anamnesis, content.personalities])),
    );
    applyTheme(this.settings.theme);
  }

  /** Config efektif = config dasar + pengaturan pemain (mis. mode latihan). */
  get config(): GameConfig {
    return { ...this.baseConfig, tests: { ...this.baseConfig.tests, realisticAccuracy: this.settings.realisticTests } };
  }

  get encounter(): EncounterState | null {
    return this.run?.encounter ?? null;
  }

  /** Sesi tersimpan yang masih bisa dilanjutkan (atau null). */
  get savedSession(): SavedSession<RunState> | null {
    const saved = loadSession<RunState>(this.contentKey);
    return saved && saved.run.status === 'playing' ? saved : null;
  }

  mount(): void {
    this.render();
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
    this.render();
  }

  askCategory(categoryId: string): void {
    this.updateEncounter((s) => askCategory(s, categoryId, this.content, this.config));
  }

  askSymptom(symptomId: string): void {
    this.updateEncounter((s) => askSymptom(s, symptomId, this.content, this.config));
  }

  performExam(toolId: string): void {
    this.updateEncounter((s) => performExam(s, toolId, this.content, this.config));
  }

  setTab(tab: ActionTab): void {
    this.ui = { ...this.ui, actionTab: tab, notice: null };
    this.render();
  }

  /** Pencarian diperbarui tanpa render ulang penuh (agar fokus input tidak hilang). */
  setSymptomQuery(query: string): void {
    this.ui.symptomQuery = query;
  }

  setDxQuery(query: string): void {
    this.ui.dxQuery = query;
  }

  setDxSystem(system: string | null): void {
    this.ui = { ...this.ui, dxSystem: system };
    this.render();
  }

  openDiagnosis(diseaseId: string): void {
    this.ui = { ...this.ui, confirmDx: diseaseId };
    this.render();
  }

  cancelDiagnosis(): void {
    this.ui = { ...this.ui, confirmDx: null };
    this.render();
  }

  confirmDiagnosis(): void {
    if (!this.run || !this.ui.confirmDx) return;
    this.run = diagnoseCurrent(this.run, this.ui.confirmDx, this.content, this.config);
    this.ui = { ...this.ui, screen: 'summary', confirmDx: null, notice: null };
    this.render();
    window.scrollTo({ top: 0 });
  }

  nextPatient(): void {
    if (!this.run || this.run.status !== 'playing') return;
    this.run = startNextPatient(this.run, this.content, this.config);
    this.ui = { ...INITIAL_UI, screen: 'consult' };
    this.renderedLogLength = 0;
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
      this.finalRecords = updateRecords({ correct: stats.correct, bestStreak: stats.bestStreak, patients: stats.patientsSeen });
    }
    this.ui = { ...INITIAL_UI, screen: 'final' };
    this.render();
    window.scrollTo({ top: 0 });
  }

  backToTitle(): void {
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

    // Simpan posisi scroll panel yang ingin dipertahankan.
    const scrolls = new Map<string, number>();
    this.root.querySelectorAll<HTMLElement>('[data-keep-scroll]').forEach((el) => {
      scrolls.set(el.dataset.keepScroll!, el.scrollTop);
    });

    const logLength = this.encounter?.log.length ?? 0;
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
    const dialog = this.renderDialog();
    this.root.replaceChildren(...(dialog ? [view, dialog] : [view]));

    this.root.querySelectorAll<HTMLElement>('[data-keep-scroll]').forEach((el) => {
      const top = scrolls.get(el.dataset.keepScroll!);
      if (top !== undefined) el.scrollTop = top;
    });

    // Gulir percakapan ke bawah bila ada pesan baru.
    const chat = this.root.querySelector<HTMLElement>('[data-chat]');
    if (chat && logLength !== this.renderedLogLength) chat.scrollTop = chat.scrollHeight;
    this.renderedLogLength = logLength;

    // Fokuskan tombol utama di dialog yang terbuka.
    this.root.querySelector<HTMLElement>('[data-autofocus]')?.focus();
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
