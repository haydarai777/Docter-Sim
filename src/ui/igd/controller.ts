/**
 * Pengendali mode IGD di UI: memegang shift, menjalankan jam permainan (dengan kecepatan &
 * jeda), meneruskan aksi pemain ke mesin (src/core/igd), menyimpan sesi, dan memutuskan
 * kapan layar digambar ulang penuh vs hanya diperbarui (angka monitor, jam, progres tugas).
 */
import { act, advance, createShift, type EdContext, endShift, patientById } from '../../core/igd/engine';
import { evaluateShift, type ShiftSummary } from '../../core/igd/evaluation';
import { buildShiftConfig, type ShiftOptions } from '../../core/igd/shift';
import type { Disposition, EdAction, EdCategory, EdShift, FluidId, InformantId, Route, ShiftMode } from '../../core/igd/types';
import { randomSeed } from '../../core/rng';
import { ED_SCENARIOS, ED_SCENARIOS_BY_ID } from '../../data/igd';
import type { GameContent } from '../../core/types';

export const SPEEDS = [1, 2, 4, 8] as const;
export type IgdTab = 'triase' | 'periksa' | 'anamnesis' | 'penunjang' | 'tindakan' | 'obat' | 'tim' | 'catatan';

export interface IgdUi {
  selected: string | null;
  tab: IgdTab;
  speed: number;
  paused: boolean;
  who: InformantId;
  draft: string;
  drug: { id: string | null; route: Route | null; dose: string; rate: string; query: string };
  fluid: { id: FluidId; volume: string; over: string };
  params: Record<string, string>;
  dxQuery: string;
  confirmDispo: Disposition | null;
  notice: string | null;
  noticeOk: boolean;
  monitorSmall: boolean;
  debriefOpen: string | null;
  menu: { mode: ShiftMode; scenarioId: string; category: EdCategory | '' };
  /** Bed tujuan saat triase. */
  triageBed: string;
}

export function initialIgdUi(): IgdUi {
  return {
    selected: null,
    tab: 'triase',
    speed: 2,
    paused: false,
    who: 'pasien',
    draft: '',
    drug: { id: null, route: null, dose: '', rate: '', query: '' },
    fluid: { id: 'rl', volume: '500', over: '30' },
    params: {},
    dxQuery: '',
    confirmDispo: null,
    notice: null,
    noticeOk: true,
    monitorSmall: false,
    debriefOpen: null,
    menu: { mode: 'jaga', scenarioId: '', category: '' },
    triageBed: '',
  };
}

const SAVE_KEY = 'meja-praktek:igd:v1';
const HISTORY_KEY = 'meja-praktek:igd-riwayat:v1';

export interface IgdHistoryItem {
  date: string;
  mode: ShiftMode;
  average: number;
  patients: number;
  died: number;
}

export interface IgdHost {
  render(): void;
  /** Dialog (pengaturan/panduan) terbuka → jam dijeda. */
  readonly dialogOpen: boolean;
  /** Dipanggil tiap langkah jam (mis. sinkron panggung 3D). */
  onIgdTick?(): void;
  onIgdEvent?(kind: 'mulai' | 'pilih' | 'aksi' | 'selesai' | 'berhenti', detail?: { patientId?: string; action?: EdAction }): void;
}

export class IgdController {
  shift: EdShift | null = null;
  ui: IgdUi = initialIgdUi();
  summary: ShiftSummary | null = null;
  readonly ctx: EdContext;
  private timer: number | null = null;
  private lastSig = '';
  private lastSave = 0;
  /** Elemen yang diperbarui langsung tiap detik (dipasang oleh tampilan). */
  live: (() => void) | null = null;

  constructor(
    private readonly host: IgdHost,
    content: GameContent,
  ) {
    this.ctx = { scenarios: ED_SCENARIOS_BY_ID, content };
  }

  get running(): boolean {
    return !!this.shift && this.shift.status === 'berjalan';
  }

  get selected() {
    return this.shift && this.ui.selected ? (patientById(this.shift, this.ui.selected) ?? null) : null;
  }

  // --- Siklus hidup -----------------------------------------------------------------

  start(mode: ShiftMode, opts: ShiftOptions = {}): void {
    const seed = randomSeed();
    const config = buildShiftConfig(mode, seed, ED_SCENARIOS, opts);
    this.shift = createShift(config, seed, this.ctx);
    this.summary = null;
    const menu = this.ui.menu;
    this.ui = { ...initialIgdUi(), menu, speed: mode === 'latihan' ? 1 : 2 };
    advance(this.shift, 1, this.ctx);
    this.ui.selected = this.shift.patients.find((p) => p.status !== 'akan_datang')?.id ?? null;
    this.host.onIgdEvent?.('mulai');
    this.startTimer();
  }

  /** Sesi tersimpan (bila ada & masih valid). */
  saved(): { shift: EdShift; ui: Partial<IgdUi> } | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as { shift: EdShift; ui: Partial<IgdUi> };
      if (data.shift?.version !== 1 || data.shift.status !== 'berjalan') return null;
      if (!data.shift.patients.every((p) => ED_SCENARIOS_BY_ID.has(p.scenarioId))) return null;
      return data;
    } catch {
      return null;
    }
  }

  resume(): boolean {
    const data = this.saved();
    if (!data) return false;
    this.shift = data.shift;
    this.summary = null;
    this.ui = { ...initialIgdUi(), ...data.ui, paused: true, notice: 'Jaga dilanjutkan — jam dijeda. Tekan ▶ untuk melanjutkan.', noticeOk: true };
    this.host.onIgdEvent?.('mulai');
    this.startTimer();
    return true;
  }

  stop(): void {
    this.clearTimer();
    if (this.running) this.save();
    this.host.onIgdEvent?.('berhenti');
  }

  private save(): void {
    if (!this.shift) return;
    try {
      if (this.shift.status !== 'berjalan') localStorage.removeItem(SAVE_KEY);
      else localStorage.setItem(SAVE_KEY, JSON.stringify({ shift: this.shift, ui: { selected: this.ui.selected, tab: this.ui.tab, speed: this.ui.speed } }));
    } catch {
      /* penyimpanan tidak tersedia */
    }
  }

  private startTimer(): void {
    this.clearTimer();
    this.lastSig = '';
    this.timer = window.setInterval(() => this.tick(), 250);
  }

  private clearTimer(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
  }

  /** Tanda tangan struktur state: berubah → gambar ulang penuh. */
  private signature(): string {
    const s = this.shift!;
    return [
      s.status,
      s.log.length,
      s.tasks.map((t) => `${t.id}:${t.nurseId ?? '-'}`).join(','),
      s.patients.map((p) => `${p.status}${p.bedId ?? ''}${p.tests.filter((o) => o.status === 'selesai').length}${p.notes.length}${p.chat.length}${p.infusions.filter((i) => i.stoppedAt === null).length}${p.consults.filter((c) => c.answered).length}${p.physio.arrest ? 'A' : ''}${p.devices.monitor || p.devices.pads ? 'M' : ''}${p.awayUntil !== null ? 'X' : ''}`).join('|'),
      s.doctor.task ?? '',
      this.ui.selected ?? '',
    ].join('#');
  }

  private tick(): void {
    const s = this.shift;
    if (!s) return;
    if (!this.ui.paused && !this.host.dialogOpen && s.status === 'berjalan') {
      advance(s, 0.25 * (SPEEDS[this.ui.speed] ?? 2), this.ctx);
      this.host.onIgdTick?.();
    }
    if (s.status !== 'berjalan') {
      this.finish();
      return;
    }
    const sig = this.signature();
    if (sig !== this.lastSig) {
      this.lastSig = sig;
      this.host.render();
    } else this.live?.();
    const now = Date.now();
    if (now - this.lastSave > 5000) {
      this.lastSave = now;
      this.save();
    }
  }

  /** Paksa gambar ulang setelah aksi pemain. */
  refresh(): void {
    if (this.shift) this.lastSig = this.signature();
    this.host.render();
  }

  private finish(): void {
    this.clearTimer();
    if (!this.shift) return;
    if (!this.summary) {
      this.summary = evaluateShift(this.shift, this.ctx);
      this.addHistory(this.summary);
    }
    this.save();
    this.host.onIgdEvent?.('selesai');
    this.host.render();
  }

  endNow(): void {
    if (!this.shift || this.shift.status !== 'berjalan') return;
    endShift(this.shift, this.ctx);
    this.finish();
  }

  history(): IgdHistoryItem[] {
    try {
      return (JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') as IgdHistoryItem[]).slice(0, 20);
    } catch {
      return [];
    }
  }

  private addHistory(sum: ShiftSummary): void {
    try {
      const list = [{ date: new Date().toLocaleDateString('id-ID'), mode: this.shift!.config.mode, average: sum.average, patients: sum.patients, died: sum.died }, ...this.history()].slice(0, 20);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
    } catch {
      /* abaikan */
    }
  }

  // --- Kendali waktu ------------------------------------------------------------------

  togglePause(): void {
    this.ui.paused = !this.ui.paused;
    this.refresh();
  }

  setSpeed(i: number): void {
    this.ui.speed = Math.max(0, Math.min(SPEEDS.length - 1, i));
    this.ui.paused = false;
    this.refresh();
  }

  /** Lompati waktu (menunggu hasil/efek terapi). */
  skip(seconds: number): void {
    if (!this.running) return;
    advance(this.shift!, seconds, this.ctx);
    this.host.onIgdTick?.();
    if (this.shift!.status !== 'berjalan') return this.finish();
    this.refresh();
  }

  // --- Pilihan & tab ---------------------------------------------------------------------

  select(id: string): void {
    const p = this.shift && patientById(this.shift, id);
    if (!p) return;
    const changed = this.ui.selected !== id;
    this.ui.selected = id;
    if (changed) {
      this.ui.tab = p.ats === null ? 'triase' : this.ui.tab === 'triase' ? 'periksa' : this.ui.tab;
      this.ui.who = 'pasien';
      this.ui.confirmDispo = null;
      this.ui.notice = null;
      this.ui.drug = { id: null, route: null, dose: '', rate: '', query: '' };
      this.ui.monitorSmall = false;
    }
    this.host.onIgdEvent?.('pilih', { patientId: id });
    this.refresh();
  }

  setTab(tab: IgdTab): void {
    this.ui.tab = tab;
    this.ui.monitorSmall = false;
    this.ui.confirmDispo = null;
    this.refresh();
  }

  patch(p: Partial<IgdUi>, rerender = true): void {
    Object.assign(this.ui, p);
    if (rerender) this.refresh();
  }

  // --- Aksi ----------------------------------------------------------------------------

  /** Jalankan aksi untuk pasien terpilih (atau pasien tertentu). */
  do(action: EdAction, patientId = this.ui.selected): boolean {
    if (!this.shift || !patientId) return false;
    const r = act(this.shift, patientId, action, this.ctx);
    this.ui.notice = r.message;
    this.ui.noticeOk = r.ok;
    if (r.ok) this.host.onIgdEvent?.('aksi', { patientId, action });
    if (r.ok && action.type === 'triase' && this.ui.tab === 'triase') this.ui.tab = 'periksa';
    this.refresh();
    return r.ok;
  }
}
