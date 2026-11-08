/**
 * Tipe data inti "Meja Praktek".
 *
 * Dibagi menjadi tiga kelompok:
 *  1. KONTEN  — bentuk file JSON di src/data (penyakit, alat, gejala, dll.).
 *  2. KASUS   — "kebenaran tersembunyi" satu pasien hasil generator.
 *  3. STATE   — progres pemain (satu konsultasi dan satu sesi permainan).
 *
 * Semua state berupa data biasa (plain object) agar mudah diuji dan
 * bisa disimpan ke localStorage sebagai JSON.
 */

// ---------------------------------------------------------------------------
// Enum sederhana
// ---------------------------------------------------------------------------

export type Sex = 'male' | 'female';
export type EconomyClass = 'miskin' | 'menengah' | 'kaya';
export type DangerLevel = 'rendah' | 'sedang' | 'tinggi' | 'kritis';
export type ToolCategory = 'fisik' | 'lab' | 'penunjang';

export const ECONOMY_CLASSES: readonly EconomyClass[] = ['miskin', 'menengah', 'kaya'];
export const DANGER_LEVELS: readonly DangerLevel[] = ['rendah', 'sedang', 'tinggi', 'kritis'];
export const TOOL_CATEGORIES: readonly ToolCategory[] = ['fisik', 'lab', 'penunjang'];

/** Rentang angka inklusif [min, max]. */
export type Range = [number, number];

// ---------------------------------------------------------------------------
// 1. KONTEN
// ---------------------------------------------------------------------------

/** Status tinjauan medis. Semua konten awal: BELUM_DITINJAU_DOKTER. */
export interface ReviewInfo {
  status: 'BELUM_DITINJAU_DOKTER' | 'SEDANG_DITINJAU' | 'DISETUJUI';
  reviewer?: string;
  date?: string;
  notes?: string[];
  references?: string[];
}

/**
 * Syarat (kondisi) yang dipakai di banyak tempat: aturan trait, gejala,
 * temuan pemeriksaan, dan varian jawaban anamnesis. Semua field opsional;
 * kondisi kosong selalu terpenuhi. Semua field yang diisi harus terpenuhi (AND).
 */
export interface Condition {
  /** Hari sakit minimal (inklusif). */
  dayMin?: number;
  /** Hari sakit maksimal (inklusif). */
  dayMax?: number;
  /** Semua trait ini harus ada pada kasus. */
  traits?: string[];
  /** Tidak boleh ada satu pun trait ini. */
  notTraits?: string[];
  sex?: Sex;
  ageMin?: number;
  ageMax?: number;
  /** Semua gejala ini harus ada pada kasus. */
  symptoms?: string[];
  notSymptoms?: string[];
  /** Pekerjaan pasien harus salah satu dari daftar ini. */
  occupations?: string[];
}

/** Parameter hasil pemeriksaan berupa angka (mis. trombosit). */
export interface NumericParamDef {
  kind: 'numeric';
  id: string;
  label: string;
  unit: string;
  /** Jumlah angka desimal yang ditampilkan. */
  decimals: number;
  /** Kelipatan pembulatan nilai (mis. 1000 untuk trombosit). Default 10^-decimals. */
  step?: number;
  /** Nilai rujukan (dipakai untuk penanda H/L). */
  ref: Range;
  refFemale?: Range;
  /** Rentang nilai yang di-generate untuk pasien normal. Default: ref dipersempit 10%. */
  normal?: Range;
  normalFemale?: Range;
  /** Teks nilai rujukan khusus (jika format standar kurang pas). */
  refText?: string;
  /**
   * Peluang hasil abnormal (positif palsu) bila tidak ada aturan penyakit yang
   * berlaku. Diabaikan jika config.tests.realisticAccuracy = false.
   */
  falsePositiveRate?: number;
  falsePositiveRange?: Range;
}

/** Parameter hasil pemeriksaan berupa teks (mis. "Negatif", deskripsi auskultasi). */
export interface TextParamDef {
  kind: 'text';
  id: string;
  label: string;
  /** Kemungkinan nilai normal (dipilih acak). Nilai di luar daftar ini ditandai abnormal. */
  normal: string[];
  refText?: string;
  /** Lihat NumericParamDef.falsePositiveRate. */
  falsePositiveRate?: number;
  falsePositiveValues?: string[];
}

export type ParamDef = NumericParamDef | TextParamDef;

/**
 * Kelompok parameter yang jumlahnya harus tetap (mis. hitung jenis = 100%).
 * Parameter `remainder` diisi dengan sisa (sumTo - jumlah parameter lain).
 */
export interface ParamGroup {
  params: string[];
  sumTo: number;
  remainder: string;
}

/** Definisi satu alat/pemeriksaan. Harga TIDAK di sini, tetapi di config.ts. */
export interface ToolDef {
  id: string;
  name: string;
  category: ToolCategory;
  /** Penjelasan singkat untuk pemain. */
  description: string;
  /** Kalimat narasi saat pemeriksaan dilakukan. */
  action: string;
  params: ParamDef[];
  groups?: ParamGroup[];
}

export interface ToolsFile {
  review: ReviewInfo;
  tools: ToolDef[];
}

/** Variasi frasa awam untuk satu gejala. Semua berupa potongan kalimat huruf kecil. */
export interface SymptomPhrases {
  /** Bahasa awam biasa, mis. "badan saya panas". */
  lay: string[];
  /** Kabur/tidak jelas, mis. "badan rasanya nggak enak". */
  vague?: string[];
  /** Dilebih-lebihkan (pasien cemas). */
  exaggerated?: string[];
  /** Diremehkan. */
  downplayed?: string[];
}

export interface SymptomDef {
  id: string;
  /** Nama medis singkat untuk rekam medis. */
  label: string;
  /** Kelompok sistem organ untuk filter di UI. */
  system: string;
  /** Pertanyaan dokter saat menanyakan gejala ini secara spesifik. */
  question: string;
  phrases: SymptomPhrases;
}

export interface SymptomsFile {
  review: ReviewInfo;
  symptoms: SymptomDef[];
}

/** Satu varian jawaban anamnesis. */
export interface AnswerVariant {
  /** Teks jawaban. Boleh memakai placeholder seperti {hari}, {hariTeks}, {daerahEndemis}. */
  text: string;
  weight?: number;
  when?: Condition;
  /**
   * Jika diisi, jawaban ini adalah PETUNJUK diagnostik. Teks ini ditampilkan
   * di ringkasan edukatif (ditemukan / terlewat).
   */
  clue?: string;
  /**
   * Gejala yang ikut terungkap lewat jawaban ini. Harus tercantum juga di
   * when.symptoms agar jawaban selalu konsisten dengan gejala kasus.
   */
  reveals?: string[];
}

export interface AnamnesisCategoryDef {
  id: string;
  /** Label tombol di UI. */
  label: string;
  /** Pertanyaan dokter. Boleh memakai {sapaan}. */
  question: string;
  /**
   * 'static'  : jawaban dipilih dari varian penyakit (atau fallback).
   * 'dynamic' : jawaban disusun dari gejala yang belum disebut (Keluhan lain).
   */
  type: 'static' | 'dynamic';
  /** Jawaban umum jika penyakit tidak mendefinisikan kategori ini (kategori statis). */
  fallback: AnswerVariant[];
  /**
   * Template untuk kategori dinamis. {daftar} = gejala yang baru disebut.
   * `none` dipakai jika tidak ada gejala baru.
   */
  dynamicTemplates?: { found: string[]; none: string[] };
}

export interface AnamnesisFile {
  review: ReviewInfo;
  categories: AnamnesisCategoryDef[];
}

export type PhraseStyle = keyof SymptomPhrases;

/** Kepribadian pasien: mengatur gaya bicara secara data-driven. */
export interface PersonalityDef {
  id: string;
  label: string;
  /** Kesan yang terlihat oleh dokter (ditampilkan di kartu pasien). */
  impression: string;
  weight: number;
  /** Gaya frasa gejala pada keluhan utama. */
  complaintStyle: PhraseStyle;
  /** Peluang tiap gejala di keluhan utama diucapkan dengan frasa kabur (vague). */
  vagueRate: number;
  /** Jumlah gejala tambahan yang ikut disebut di keluhan utama. */
  complaintExtra: number;
  /** Berapa gejala baru yang disebut saat ditanya "keluhan lain". */
  otherComplaintCount: number;
  /** Peluang menjawab "mungkin iya" untuk gejala yang sebenarnya TIDAK ada. */
  uncertainAbsentRate: number;
  greetings: string[];
  /** Bingkai keluhan utama. Placeholder: {keluhan}, {Keluhan}, {ketakutan}, {salahKira}. */
  complaintFrames: string[];
  symptomYes: string[];
  symptomNo: string[];
  symptomUncertain?: string[];
  /** Kalimat pembuka/penutup tambahan pada jawaban anamnesis. */
  answerPrefixes?: string[];
  answerSuffixes?: string[];
  /** Peluang prefix/suffix ditambahkan. */
  affixRate: number;
  /** Kategori anamnesis yang boleh diberi prefix/suffix (agar tetap wajar). */
  affixCategories?: string[];
}

export interface PersonalitiesFile {
  personalities: PersonalityDef[];
}

export type NameEntry = string | { name: string; call: string };

export interface OccupationDef {
  id: string;
  label: string;
  /** Potongan kalimat perkenalan, mis. "kerja sebagai buruh pabrik". */
  intro: string;
  age: Range;
  /** Jika diisi, hanya jenis kelamin ini. */
  sex?: Sex;
  /** Status ekonomi yang mungkin untuk pekerjaan ini. */
  economy: EconomyClass[];
  /** Bobot kemunculan umum. */
  weight: number;
}

export interface PopulationFile {
  names: { male: NameEntry[]; female: NameEntry[] };
  occupations: OccupationDef[];
  /** Nilai placeholder umum untuk teks, mis. {kotaWisata}. */
  context: Record<string, string[]>;
}

export interface TraitRule {
  id: string;
  probability: number;
  when?: Condition;
}

export interface SymptomRule {
  id: string;
  probability: number;
  when?: Condition;
}

/** Aturan nilai abnormal satu parameter pemeriksaan pada satu penyakit. */
export interface FindingRule {
  tool: string;
  param: string;
  when?: Condition;
  /** Peluang aturan ini berlaku (sensitivitas / prevalensi tanda). Default 1. */
  probability?: number;
  /**
   * true = aturan ini mewakili SENSITIVITAS tes untuk penyakit ini (mis. NS1
   * positif pada dengue). Jika config.tests.realisticAccuracy = false,
   * probability aturan diagnostik dianggap 1 (tes selalu akurat).
   */
  diagnostic?: boolean;
  /** Untuk parameter numerik. */
  range?: Range;
  /** Untuk parameter teks (dipilih acak). */
  values?: string[];
}

export interface AgeBand {
  min: number;
  max: number;
  weight: number;
}

export interface DifferentialNote {
  id: string;
  /** Cara membedakan penyakit ini dengan diagnosis banding tersebut. */
  howToDistinguish: string;
}

export interface DiseaseTemplate {
  id: string;
  name: string;
  aliases: string[];
  /** Kelompok sistem organ untuk filter daftar diagnosis. */
  system: string;
  /** Tingkat kemampuan SKDI (perlu verifikasi reviewer). */
  skdiLevel: string;
  danger: DangerLevel;
  /** Bobot kemunculan sebagai pasien. */
  prevalenceWeight: number;
  /** Penjelasan singkat untuk layar ringkasan. */
  summary: string;
  /** Rentang hari sakit saat pasien datang. */
  presentationDay: Range;
  demographics: {
    ageBands: AgeBand[];
    /** Proporsi laki-laki 0..1. */
    maleRatio: number;
    /** Pekerjaan yang meningkatkan risiko, beserta bobotnya. */
    occupations?: { id: string; weight: number }[];
    /** Peluang memakai daftar pekerjaan berisiko (sisanya: populasi umum). */
    occupationBias?: number;
  };
  /** Variabel laten kasus (mis. "fase_kritis"). Aturan pertama yang cocok per id dipakai. */
  traits?: TraitRule[];
  /** Label edukatif untuk trait (ditampilkan di ringkasan). */
  traitLabels?: Record<string, string>;
  symptoms: SymptomRule[];
  chiefComplaint: {
    /** Gejala yang pasti disebut duluan (jika ada pada kasus). */
    primary: string[];
    /** Kumpulan gejala tambahan yang mungkin ikut disebut. */
    extraPool?: string[];
  };
  /** Gejala yang dianggap petunjuk penting jika ada. */
  clueSymptoms?: string[];
  /** Salah kaprah pasien tentang sakitnya, mis. "masuk angin". */
  misattributions: string[];
  /** Ketakutan pasien cemas. */
  fears?: string[];
  anamnesis: Record<string, AnswerVariant[]>;
  findings: FindingRule[];
  differentials: DifferentialNote[];
  /** Diagnosis banding lain (teks saja, belum ada di game). */
  otherDifferentials?: string[];
  keyFindings: string[];
  teachingPoints?: string[];
  /** Pemeriksaan paling berguna (urut prioritas). Dipakai untuk bonus hemat & edukasi. */
  idealWorkup: string[];
  /** Nilai placeholder khusus penyakit, mis. {daerahEndemis}. */
  context?: Record<string, string[]>;
  review: ReviewInfo;
}

// ---------------------------------------------------------------------------
// Konfigurasi balancing (lihat src/data/config.ts)
// ---------------------------------------------------------------------------

export interface GameConfig {
  patient: { minAge: number; maxAge: number };
  anamnesis: { maxQuestions: number };
  economy: {
    classes: Record<EconomyClass, { weight: number; budget: Range }>;
    budgetRounding: number;
  };
  /** Harga tiap alat (Rupiah), per id alat. */
  toolPrices: Record<string, number>;
  tests: {
    /** true: tes bisa negatif/positif palsu. false: penanda diagnostik selalu akurat. */
    realisticAccuracy: boolean;
  };
  reputation: {
    initial: number;
    min: number;
    max: number;
    /** Game over jika reputasi < nilai ini. */
    gameOverBelow: number;
    correctBase: number;
    efficiencyBonusMax: number;
    /** Bonus hemat = 0 saat biaya >= kelipatan ini × biaya ideal. */
    efficiencyZeroAtMultiplier: number;
    wrongBase: number;
    dangerMultiplier: Record<DangerLevel, number>;
  };
  queue: {
    /** Hindari penyakit yang sama dua kali berturut-turut. */
    avoidImmediateRepeat: boolean;
  };
}

/** Seluruh konten yang sudah dimuat dan diindeks. */
export interface GameContent {
  tools: ToolDef[];
  toolsById: Map<string, ToolDef>;
  symptoms: SymptomDef[];
  symptomsById: Map<string, SymptomDef>;
  anamnesis: AnamnesisCategoryDef[];
  anamnesisById: Map<string, AnamnesisCategoryDef>;
  personalities: PersonalityDef[];
  personalitiesById: Map<string, PersonalityDef>;
  population: PopulationFile;
  occupationsById: Map<string, OccupationDef>;
  diseases: DiseaseTemplate[];
  diseasesById: Map<string, DiseaseTemplate>;
}

// ---------------------------------------------------------------------------
// 2. KASUS (hasil generator, tersembunyi dari pemain)
// ---------------------------------------------------------------------------

export interface PatientProfile {
  name: string;
  /** Nama panggilan. */
  callName: string;
  /** Sapaan dokter, mis. "Pak Budi". */
  address: string;
  age: number;
  sex: Sex;
  occupationId: string;
  occupationLabel: string;
  economy: EconomyClass;
  budget: number;
  personalityId: string;
}

/** Asal nilai hasil pemeriksaan (tersembunyi; dipakai untuk edukasi). */
export type ResultSource = 'normal' | 'disease' | 'false_positive';

export interface ParamResult {
  paramId: string;
  label: string;
  value: number | string;
  /** Nilai yang sudah diformat untuk ditampilkan. */
  display: string;
  unit?: string;
  refText?: string;
  /** H = tinggi, L = rendah, '+' = abnormal (teks), null = normal. */
  flag: 'H' | 'L' | '+' | null;
  source: ResultSource;
}

export interface AnswerResult {
  text: string;
  clue?: string;
  reveals?: string[];
}

export interface PatientCase {
  seed: number;
  diseaseId: string;
  patient: PatientProfile;
  /** Hari sakit ke-berapa saat datang. */
  day: number;
  traits: string[];
  /** Gejala yang benar-benar ada. */
  symptoms: string[];
  /** Gejala yang disebut di keluhan utama. */
  chiefComplaintSymptoms: string[];
  /** Urutan gejala lain yang akan disebut saat ditanya "keluhan lain". */
  revealOrder: string[];
  greeting: string;
  complaint: string;
  /** Jawaban per kategori anamnesis statis. */
  answers: Record<string, AnswerResult>;
  /** Hasil semua alat (diungkap saat pemeriksaan dilakukan). */
  findings: Record<string, ParamResult[]>;
  /** Nilai placeholder yang sudah ditetapkan untuk kasus ini. */
  context: Record<string, string>;
}

// ---------------------------------------------------------------------------
// 3. STATE PERMAINAN
// ---------------------------------------------------------------------------

export type LogEntry =
  | { kind: 'doctor'; text: string }
  | { kind: 'patient'; text: string }
  | { kind: 'system'; text: string }
  | { kind: 'exam'; toolId: string; cost: number };

export interface DiagnosisOutcome {
  chosenId: string;
  trueId: string;
  correct: boolean;
  spent: number;
  idealCost: number;
  reputationDelta: number;
  breakdown: {
    base: number;
    efficiencyBonus: number;
    penalty: number;
    dangerMultiplier: number;
  };
}

export interface EncounterState {
  case: PatientCase;
  budgetRemaining: number;
  spent: number;
  questionsUsed: number;
  askedCategories: string[];
  askedSymptoms: string[];
  /** Gejala yang sudah diketahui dokter (disebut pasien / dijawab "ya"). */
  revealedSymptoms: string[];
  examsDone: string[];
  log: LogEntry[];
  status: 'active' | 'diagnosed';
  outcome?: DiagnosisOutcome;
}

/** Catatan ringkas satu pasien yang sudah selesai. */
export interface PatientRecord {
  index: number;
  seed: number;
  diseaseId: string;
  chosenId: string;
  correct: boolean;
  spent: number;
  budget: number;
  reputationDelta: number;
  reputationAfter: number;
  patientName: string;
}

export interface RunState {
  runSeed: number;
  /** Nomor pasien berikutnya (mulai 0). */
  patientIndex: number;
  reputation: number;
  history: PatientRecord[];
  encounter: EncounterState | null;
  status: 'playing' | 'game_over';
}
