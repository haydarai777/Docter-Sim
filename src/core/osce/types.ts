/**
 * Tipe data mode OSCE: formularium, rencana tatalaksana per penyakit, prosedur, dan hasil stasiun.
 *
 * Format penilaian mengikuti rubrik OSCE komprehensif yang umum dipakai fakultas kedokteran
 * di Indonesia: 7 tugas (Learning Task) diskor 0–1–2, total /14, kategori Superior/Lulus/Tidak lulus,
 * ditambah catatan perilaku profesional.
 */
import type { Condition, ReviewInfo } from '../types';

export type Route =
  | 'oral'
  | 'sublingual'
  | 'inhalasi'
  | 'topikal'
  | 'tetes_mata'
  | 'tetes_telinga'
  | 'semprot_hidung'
  | 'vaginal'
  | 'rektal'
  | 'intravena'
  | 'intramuskular'
  | 'subkutan';

export interface DrugForm {
  id: string;
  /** Label sediaan, mis. "tab 500 mg". */
  label: string;
  /** Kekuatan per satuan pakai (per tablet/puff/sendok takar), dalam `unit`. */
  strength: number;
  /** Topikal/tetes memakai satuan pakai (oles, tetes, semprot); vaksin & serum memakai IU atau mL. */
  unit: 'mg' | 'mcg' | 'g' | 'mL' | 'IU' | 'tablet' | 'sachet' | 'oles' | 'tetes' | 'semprot' | 'paket';
  /** Satuan yang ditulis di signa: tablet, kapsul, puff, sachet, sendok takar 5 mL. */
  dosageUnit: string;
  route: Route;
  /** Bila diresepkan per kemasan (inhaler/sirup): jumlah dosis per kemasan (1 = 1 botol). */
  package?: number;
}

export interface DrugDef {
  id: string;
  name: string;
  aliases?: string[];
  /** Kelas terapi (kunci `classes` formularium). */
  class: string;
  /** Golongan untuk alergi & kontraindikasi (oains, penisilin, sulfa, steroid, ...). */
  groups?: string[];
  forms: DrugForm[];
  /** Dosis harian maksimum yang aman (satuan sediaan, mis. mg). Melebihi = kesalahan kritis. */
  maxDaily?: number;
  note?: string;
}

export interface FormularyFile {
  review: ReviewInfo;
  classes: Record<string, string>;
  /** Label alergi pasien (population.allergies) → golongan obat yang dihindari. */
  allergyGroups: Record<string, string[]>;
  drugs: DrugDef[];
}

export type Schedule = 'rutin' | 'prn' | 'tunggal';

/** Satu pilihan obat yang benar untuk sebuah butir terapi, beserta rentang dosis yang diterima. */
export interface DoseOption {
  drug: string;
  /** Sediaan yang diterima (default: semua sediaan obat itu). */
  forms?: string[];
  /** Dosis per kali (satuan sediaan, mis. mg). */
  dose?: [number, number];
  /** Dosis per kali per kg BB. */
  dosePerKg?: [number, number];
  /** Jumlah satuan per kali menurut berat badan (mis. DHP, OAT KDT). */
  unitsByWeight?: { minKg: number; maxKg: number; units: number }[];
  /** Jadwal yang diterima. */
  schedules: Schedule[];
  /** Frekuensi per hari (untuk rutin/prn). */
  timesPerDay?: [number, number];
  /** Lama pemberian (hari) untuk jadwal rutin. */
  days?: [number, number];
  /** Petunjuk penulisan yang ditampilkan di kunci jawaban, mis. "3 × 500 mg selama 3 hari". */
  label: string;
}

export interface TherapyItem {
  id: string;
  /** Nama butir, mis. "Antibiotik empiris". */
  label: string;
  /** utama = wajib untuk skor ≥ 1 · pendukung = diperlukan untuk skor penuh · opsional = boleh (bila diberi, dosis harus tepat). */
  role: 'utama' | 'pendukung' | 'opsional';
  reason: string;
  when?: Condition;
  options: DoseOption[];
  /** Harus dipenuhi baris resep yang belum dipakai butir lain (mis. obat antihipertensi kedua golongan berbeda). */
  separateLine?: boolean;
}

export interface AvoidRule {
  drugs?: string[];
  groups?: string[];
  classes?: string[];
  reason: string;
  /** kritis = membahayakan pasien (otomatis tidak lulus) · salah = tidak tepat. */
  severity: 'kritis' | 'salah';
  when?: Condition;
}

export type KieCategory = 'diagnosis' | 'pengobatan' | 'efek_samping' | 'tanda_bahaya' | 'kontrol' | 'pencegahan';

export const KIE_CATEGORIES: readonly KieCategory[] = ['diagnosis', 'pengobatan', 'efek_samping', 'tanda_bahaya', 'kontrol', 'pencegahan'];

/** Satu pilihan saran (non-farmakologi / KIE). */
export interface AdviceOption {
  id: string;
  text: string;
  /** benar = dianjurkan · pengecoh = tidak relevan/kurang tepat · berbahaya = merugikan pasien. */
  kind: 'benar' | 'pengecoh' | 'berbahaya';
  /** Kategori KIE (hanya untuk education). */
  category?: KieCategory;
  /** Penjelasan untuk umpan balik. */
  why?: string;
  /** Hanya berlaku bila kondisi kasus terpenuhi (mis. tindakan pra-rujukan bila ada tanda bahaya). */
  when?: Condition;
  /** Berlaku bila SALAH SATU kondisi terpenuhi. Di luar kondisinya, pilihan ini dinilai sebagai pengecoh. */
  whenAny?: Condition[];
}

/** Konten OSCE untuk satu penyakit kasus. */
export interface OsceCaseDef {
  disease: string;
  /** Tempat stasiun: Puskesmas, Poliklinik, IGD. */
  setting: string;
  /** Kelompok stasiun yang tidak membocorkan diagnosis, mis. "Penyakit Dalam — demam akut". */
  station: string;
  therapy: {
    /** Boleh kosong untuk penyakit yang tatalaksananya tanpa obat (mis. kacamata); `note` wajib menjelaskannya. */
    items: TherapyItem[];
    avoid?: AvoidRule[];
    /** Catatan kunci jawaban (mis. dosis berbasis BB, pertimbangan rujukan). */
    note?: string;
  };
  nonPharm: AdviceOption[];
  education: AdviceOption[];
  /** Kategori KIE wajib untuk skor penuh (default: diagnosis, pengobatan, tanda_bahaya, kontrol). */
  kieRequired?: KieCategory[];
  review: ReviewInfo;
}

// ---------------------------------------------------------------------------
// Pekerjaan pemain di stasiun
// ---------------------------------------------------------------------------

export interface PrescriptionLine {
  drug: string;
  form: string;
  /** Jumlah satuan per kali (tablet/puff/sendok takar). */
  units: number;
  schedule: Schedule;
  timesPerDay: number;
  /** Lama pemberian (hari); diabaikan untuk dosis tunggal. */
  days: number;
  /** Jumlah yang diserahkan (No.), dalam satuan atau kemasan. */
  quantity: number;
  timing?: '' | 'sebelum makan' | 'sesudah makan' | 'saat makan' | 'malam hari';
}

export interface OsceWork {
  prescription: PrescriptionLine[];
  nonPharm: string[];
  education: string[];
  /** Parameter penunjang yang ditandai abnormal oleh pemain: "alat.parameter". */
  abnormalMarks: string[];
}

export const EMPTY_WORK: OsceWork = { prescription: [], nonPharm: [], education: [], abnormalMarks: [] };

/** Pekerjaan tab Tatalaksana di mode praktik (tanpa penandaan hasil abnormal khas OSCE). */
export type TreatmentWork = Pick<OsceWork, 'prescription' | 'nonPharm' | 'education'>;

// ---------------------------------------------------------------------------
// Hasil stasiun
// ---------------------------------------------------------------------------

export type LtKey = 'anamnesis' | 'fisik' | 'penunjang' | 'diagnosis' | 'farmakologi' | 'nonfarmakologi' | 'kie';

export interface LtResult {
  key: LtKey;
  no: number;
  label: string;
  score: 0 | 1 | 2;
  /** Kriteria skor 0/1/2 (seperti di lembar rubrik). */
  criteria: [string, string, string];
  /** Yang sudah dilakukan dengan baik. */
  done: string[];
  /** Yang kurang / keliru. */
  missed: string[];
  /** Kunci jawaban ringkas. */
  key_answer: string[];
}

export type OsceCategory = 'superior' | 'lulus' | 'tidak_lulus';

export interface OsceResult {
  stationTitle: string;
  diseaseId: string;
  tasks: LtResult[];
  total: number;
  max: number;
  percent: number;
  category: OsceCategory;
  /** Kesalahan kritis (keselamatan pasien) — otomatis tidak lulus. */
  critical: string[];
  /** Perilaku profesional (dicatat terpisah, tidak masuk total /14). */
  professional: { score: 0 | 1 | 2; done: string[]; missed: string[] };
  /** Detik yang dipakai (null bila tanpa batas waktu). */
  secondsUsed: number | null;
  timeUp: boolean;
}

// ---------------------------------------------------------------------------
// Stasiun prosedur
// ---------------------------------------------------------------------------

export interface ProcedureStep {
  id: string;
  text: string;
  /** Langkah kritis: bila terlewat → tidak lulus. */
  critical?: boolean;
  why?: string;
}

export interface ProcedureDistractor {
  id: string;
  text: string;
  why: string;
  /** Tindakan berbahaya → tidak lulus. */
  dangerous?: boolean;
}

export interface ProcedureQuestion {
  id: string;
  question: string;
  options: string[];
  answer: number;
  why: string;
}

export interface ProcedureDef {
  id: string;
  title: string;
  system: string;
  skdi: string;
  scenario: string;
  /** Langkah yang benar sesuai urutan. */
  steps: ProcedureStep[];
  distractors: ProcedureDistractor[];
  questions: ProcedureQuestion[];
  keyPoints: string[];
  source: string;
}

export interface ProceduresFile {
  review: ReviewInfo;
  procedures: ProcedureDef[];
}

export interface ProcedureAttempt {
  /** Urutan id langkah/pengecoh yang dipilih pemain. */
  sequence: string[];
  /** Jawaban per pertanyaan (indeks opsi). */
  answers: Record<string, number>;
}

export interface ProcedureResult {
  procedureId: string;
  /** 0–100 */
  percent: number;
  category: OsceCategory;
  orderScore: number;
  missingSteps: ProcedureStep[];
  outOfOrder: ProcedureStep[];
  wrongActions: ProcedureDistractor[];
  questionResults: { question: ProcedureQuestion; chosen: number | undefined; correct: boolean }[];
  critical: string[];
}
