/**
 * Pengendali UI: menyimpan state permainan + state tampilan, menerima aksi
 * pemain, memanggil logika inti (src/core), lalu menggambar ulang layar.
 *
 * UI tidak berisi aturan permainan — semua aturan ada di src/core.
 */
import { askCategory, askSymptom, EncounterError, performExam } from '../core/encounter';
import { randomSeed } from '../core/rng';
import { createRun, diagnoseCurrent, startNextPatient, updateEncounter } from '../core/run';
import type { EncounterState, GameConfig, GameContent, RunState, ToolCategory } from '../core/types';
import { renderConsult } from './screens/consult';
import { renderSummary } from './screens/summary';
import { renderTitle } from './screens/title';

export type Screen = 'title' | 'consult' | 'summary';
export type ActionTab = 'anamnesis' | ToolCategory | 'diagnosis';

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
}

const INITIAL_UI: UiState = {
  screen: 'title',
  actionTab: 'anamnesis',
  symptomQuery: '',
  dxQuery: '',
  dxSystem: null,
  confirmDx: null,
  notice: null,
};

export class App {
  run: RunState | null = null;
  ui: UiState = { ...INITIAL_UI };
  /** Jumlah entri log saat render terakhir (untuk auto-scroll percakapan). */
  private renderedLogLength = 0;

  constructor(
    private readonly root: HTMLElement,
    readonly content: GameContent,
    readonly config: GameConfig,
  ) {}

  get encounter(): EncounterState | null {
    return this.run?.encounter ?? null;
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
    this.ui = { ...INITIAL_UI, screen: 'consult' };
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

  backToTitle(): void {
    this.ui = { ...INITIAL_UI };
    this.render();
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
    // Simpan posisi scroll panel yang ingin dipertahankan.
    const scrolls = new Map<string, number>();
    this.root.querySelectorAll<HTMLElement>('[data-keep-scroll]').forEach((el) => {
      scrolls.set(el.dataset.keepScroll!, el.scrollTop);
    });

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
    }
    this.root.replaceChildren(view);

    this.root.querySelectorAll<HTMLElement>('[data-keep-scroll]').forEach((el) => {
      const top = scrolls.get(el.dataset.keepScroll!);
      if (top !== undefined) el.scrollTop = top;
    });

    // Gulir percakapan ke bawah bila ada pesan baru.
    const chat = this.root.querySelector<HTMLElement>('[data-chat]');
    const logLength = this.encounter?.log.length ?? 0;
    if (chat && logLength !== this.renderedLogLength) {
      chat.scrollTop = chat.scrollHeight;
    }
    this.renderedLogLength = logLength;

    // Fokuskan tombol konfirmasi di dialog diagnosis.
    this.root.querySelector<HTMLElement>('[data-autofocus]')?.focus();
  }
}
