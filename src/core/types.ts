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
/** fisik = pemeriksaan fisik (gratis) · lab = laboratorium · pencitraan = imaging · lainnya = EKG, spirometri, dll. */
export type ToolCategory = 'fisik' | 'lab' | 'pencitraan' | 'lainnya';
/** Tujuan klinis pemeriksaan penunjang. */
export type Objective = 'identifikasi' | 'fungsi_organ' | 'struktur' | 'komplikasi' | 'skrining';
/** Keputusan tata laksana/disposisi di akhir konsultasi. */
export type Disposition = 'rawat_jalan' | 'observasi' | 'rujuk_spesialis' | 'rujuk_segera';
/** Status satu kondisi di papan diagnosis banding pemain. */
export type DdxStatus = 'utama' | 'mungkin' | 'disingkirkan';

export const ECONOMY_CLASSES: readonly EconomyClass[] = ['miskin', 'menengah', 'kaya'];
export const DANGER_LEVELS: readonly DangerLevel[] = ['rendah', 'sedang', 'tinggi', 'kritis'];
export const TOOL_CATEGORIES: readonly ToolCategory[] = ['fisik', 'lab', 'pencitraan', 'lainnya'];
export const OBJECTIVES: readonly Objective[] = ['identifikasi', 'fungsi_organ', 'struktur', 'komplikasi', 'skrining'];
export const DISPOSITIONS: readonly Disposition[] = ['rawat_jalan', 'observasi', 'rujuk_spesialis', 'rujuk_segera'];

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
  /**
   * Salin nilai dari parameter alat lain ("alat.parameter"), mis. frekuensi EKG
   * = nadi pada tanda vital, agar hasil antar-alat konsisten.
   */
  copyFrom?: string;
  /**
   * Rujukan khusus kelompok usia muda, urut dari yang termuda; dipakai bila usia ≤ maxAge.
   * Aturan penyakit tetap ditulis untuk rujukan dewasa — nilainya digeser otomatis (lihat ageAdjust).
   */
  refByAge?: AgeReference[];
  /** Nilai dihitung dari parameter lain di alat yang sama (tidak boleh diatur oleh aturan penyakit). */
  compute?:
    | { type: 'weightFromBmi'; bmi: string; heightCm: string }
    /** eGFR (mL/menit/1,73 m²) dengan persamaan CKD-EPI 2021 dari kreatinin serum, usia, jenis kelamin. */
    | { type: 'egfrCkdEpi2021'; creatinine: string };
}

/** Rujukan satu kelompok usia (lihat NumericParamDef.refByAge). */
export interface AgeReference {
  maxAge: number;
  ref: Range;
  refFemale?: Range;
  normal?: Range;
  normalFemale?: Range;
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
  /**
   * Bila tidak ada aturan penyakit yang berlaku, nilai diturunkan dari parameter
   * numerik di alat yang sama, mis. irama EKG dari frekuensi:
   * [{ max: 59, value: "Sinus bradikardia" }, { max: 100, value: "Sinus ritme" }, { value: "Sinus takikardia" }]
   */
  bands?: { from: string; ranges: { max?: number; value: string }[] };
  /**
   * true = nilai dari SEMUA sumber kelainan (penyakit utama, komorbiditas, insidental)
   * digabung dengan "; " — dipakai untuk "Kesan" laporan pencitraan.
   */
  combine?: boolean;
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
  /** Kelompok pemeriksaan fisik (umum, kepala & leher, thorax, abdomen, ekstremitas, khusus). */
  group?: string;
  /** Tujuan klinis (untuk pemeriksaan penunjang). */
  objectives?: Objective[];
  /** Kalimat singkat: apa yang dinilai pemeriksaan ini dan batas interpretasinya. */
  purpose?: string;
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
  /** Kata/frasa (awam & medis) untuk mengenali gejala ini di pertanyaan bebas pemain. */
  keywords: string[];
  /**
   * false = pasien tidak menyebutnya secara sukarela (mis. malu, dianggap tidak
   * penting); hanya terungkap bila ditanya spesifik. Default true.
   */
  volunteer?: boolean;
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
  /** Kelompok rubrik penilaian (mis. "Keluhan utama", "Riwayat"). */
  rubric: string;
  /** true = topik yang diharapkan ditanyakan pada SETIAP pasien (anamnesis lengkap). */
  core: boolean;
  /** Bobot dasar dalam penilaian anamnesis (default 1). */
  weight?: number;
  /** Kata/frasa untuk mengenali topik ini di pertanyaan bebas pemain. */
  keywords: string[];
  /** Penjelasan singkat untuk umpan balik ("mengapa topik ini penting"). */
  why: string;
  /** Pertanyaan dokter. Boleh memakai {sapaan}. */
  question: string;
  /**
   * 'static'  : jawaban dipilih dari varian penyakit (atau fallback).
   * 'dynamic' : jawaban disusun dari gejala yang belum disebut (Keluhan lain).
   */
  type: 'static' | 'dynamic' | 'chief';
  /** Jawaban umum jika penyakit tidak mendefinisikan kategori ini (kategori statis). */
  fallback: AnswerVariant[];
  /**
   * Template untuk kategori dinamis. {daftar} = gejala yang baru disebut.
   * `none` dipakai jika tidak ada gejala baru.
   */
  dynamicTemplates?: { found: string[]; none: string[] };
}

/** Templat percakapan umum pasien (di luar jawaban kasus). */
export interface ConversationTemplates {
  greeting: string[];
  thanks: string[];
  consent: string[];
  unknown: string[];
  /** Awalan saat pertanyaan yang sama diulang. */
  repeat: string[];
  /** Gejala yang sudah disebut ditanyakan lagi. */
  alreadySaid: string[];
  /** Mengulang keluhan utama. {keluhanAwal} = kalimat keluhan pertama. */
  chief: string[];
  /** Pamit setelah konsultasi selesai. */
  farewell: string[];
  /** Pamit bila pasien dirujuk segera. */
  farewellReferral: string[];
  /** Narasi penutup dari dokter (baris sistem). Boleh memakai {sapaan}. */
  closing: string[];
  /** Detail (onset/keparahan/...) gejala yang BUKAN keluhan utama. {gejala} = frasa gejala. */
  detail: Record<string, string[]> & { default: string[] };
}

/**
 * Tinjauan sistem (review of systems): pertanyaan umum seperti "BAB-nya bagaimana?"
 * yang mencakup beberapa gejala sekaligus. Pasien menyebut yang ada, atau menjawab normal.
 */
export interface ReviewGroupDef {
  id: string;
  label: string;
  keywords: string[];
  symptoms: string[];
  /** Jawaban bila tidak ada satu pun gejala kelompok ini. */
  normal: string[];
}

export interface AnamnesisFile {
  review: ReviewInfo;
  categories: AnamnesisCategoryDef[];
  conversation: ConversationTemplates;
  reviews: ReviewGroupDef[];
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
  /**
   * Aturan hanya berlaku jika parameter lain DI ALAT YANG SAMA (yang tercantum
   * lebih awal) bernilai abnormal karena penyakit. Dipakai agar "Kesan" selalu
   * konsisten dengan temuan detailnya.
   */
  requires?: string;
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
  /** Id kondisi di katalog (penyakit kasus, komorbiditas, atau kondisi banding). */
  id: string;
  /** Cara membedakan penyakit ini dengan diagnosis banding tersebut. */
  howToDistinguish: string;
  /** Diagnosis berbahaya yang wajib dipertimbangkan & disingkirkan. */
  mustNotMiss?: boolean;
  /** Bukti yang sah untuk menyingkirkan diagnosis banding ini. */
  excludeBy?: EvidenceRef;
}

/** Rujukan ke bukti yang dikumpulkan pemain: topik anamnesis, gejala yang ditanyakan, atau pemeriksaan. */
export interface EvidenceRef {
  topics?: string[];
  symptoms?: string[];
  /** Id alat (pemeriksaan fisik maupun penunjang). */
  tools?: string[];
}

/** Komplikasi / tanda bahaya yang harus dinilai pada penyakit ini. */
export interface ComplicationDef {
  id: string;
  name: string;
  /** Komplikasi dianggap ADA pada kasus jika trait ini ada. */
  trait: string;
  /** true = tanda bahaya yang mengubah tata laksana (biasanya perlu rujuk). */
  redFlag: boolean;
  /** Cara menilainya: salah satu bukti ini harus dikumpulkan agar dianggap "sudah dinilai". */
  assess: EvidenceRef;
  /** Penjelasan edukatif singkat. */
  explanation: string;
}

/** Item rencana pemeriksaan kasus (fisik atau penunjang). */
export interface PlanItem {
  tool: string;
  /** kunci = paling menentukan · pendukung = membantu · komplikasi = menilai komplikasi/fungsi organ. */
  role: 'kunci' | 'pendukung' | 'komplikasi';
  /** Hanya diharapkan bila kondisi ini terpenuhi (mis. ada tanda bahaya). */
  when?: Condition;
  /** Item dengan group sama saling menggantikan (cukup salah satu, mis. RDT atau mikroskopis). */
  group?: string;
  reason: string;
}

export interface CasePlan {
  /** Topik anamnesis tambahan yang kunci untuk penyakit ini (selain topik berpetunjuk). */
  keyTopics?: string[];
  /** Pemeriksaan fisik yang diharapkan (tanda vital selalu diharapkan otomatis). */
  exams: PlanItem[];
  /** Pemeriksaan penunjang yang sesuai indikasi. */
  tests: PlanItem[];
  /** Pemeriksaan yang tidak tepat untuk kasus ini, beserta alasannya. */
  unnecessary?: { tool: string; reason: string }[];
}

export interface DispositionRule {
  when?: Condition;
  value: Disposition;
  /** Disposisi lain yang juga dapat diterima penuh. */
  alsoAccept?: Disposition[];
  reason: string;
}

/** Jebakan penalaran: umpan balik bila pemain mengambil asumsi keliru. */
export interface PitfallDef {
  when: {
    /** Pemain menyingkirkan kondisi ini. */
    excluded?: string;
    /** Diagnosis utama pemain salah. */
    wrongPrimary?: boolean;
    /** Diagnosis utama pemain adalah kondisi ini. */
    primaryIs?: string;
    /** Pemeriksaan ini sudah dilakukan. */
    toolDone?: string;
    /** Semua parameter alat ini normal pada kasus. */
    toolNormal?: string;
    /** Topik ini tidak ditanyakan. */
    topicNotAsked?: string;
    /** Trait kasus. */
    traits?: string[];
    notTraits?: string[];
    /** Kondisi ini tidak ada di papan diagnosis banding pemain. */
    notConsidered?: string;
  };
  text: string;
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
    /** Urutan prioritas gejala utama: gejala PERTAMA yang ada pada kasus disebut duluan. */
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
  /** Rencana pemeriksaan sesuai indikasi (dasar penilaian fisik & penunjang). */
  plan: CasePlan;
  /** Komplikasi / tanda bahaya yang perlu dinilai. */
  complications?: ComplicationDef[];
  /** Trait yang sebenarnya merupakan komorbiditas (diharapkan dicatat sebagai masalah lain). */
  traitComorbidities?: Record<string, string>;
  /** Disposisi yang tepat (aturan pertama yang cocok dipakai). */
  disposition: DispositionRule[];
  /** Prinsip tata laksana (edukatif, tanpa dosis obat). */
  management: string[];
  /** Langkah penalaran klinis yang dianjurkan (untuk umpan balik). */
  approach: string[];
  pitfalls?: PitfallDef[];
  /** Nilai placeholder khusus penyakit, mis. {daerahEndemis}. */
  context?: Record<string, string[]>;
  review: ReviewInfo;
}

/** Komorbiditas: masalah kesehatan lain yang bisa menyertai penyakit utama. */
export interface ComorbidityDef {
  id: string;
  name: string;
  aliases: string[];
  system: string;
  summary: string;
  probability: number;
  when?: { ageMin?: number; ageMax?: number; sex?: Sex };
  /** Tidak dipakai bila penyakit utama adalah salah satu id ini. */
  excludePrimary?: string[];
  /** Tidak dipakai bila penyakit utama sudah punya trait ini (mis. angina dengan trait hipertensi). */
  excludeTraits?: string[];
  /** Peluang pasien sudah tahu & menyebutkannya saat ditanya riwayat penyakit. */
  knownProbability: number;
  symptoms?: SymptomRule[];
  findings: FindingRule[];
  history: {
    /** Disebut di riwayat penyakit bila pasien tahu. */
    known: string;
    /** Disebut di riwayat obat bila pasien tahu. */
    medication?: string;
    /** Ditambahkan ke jawaban kebiasaan. */
    habit?: string;
    /** Ditambahkan ke riwayat keluarga. */
    family?: string;
  };
  /** Pemeriksaan yang mendeteksi/menilai komorbiditas ini. */
  detectBy: EvidenceRef;
  management: string[];
}

/** Temuan insidental: kelainan yang tidak berkaitan dengan keluhan utama. */
export interface IncidentalDef {
  id: string;
  name: string;
  aliases: string[];
  system: string;
  probability: number;
  when?: { ageMin?: number; ageMax?: number; sex?: Sex };
  findings: FindingRule[];
  /** Pemeriksaan yang bisa menemukannya. */
  detectBy: EvidenceRef;
  note: string;
}

// ---------------------------------------------------------------------------
// Penampilan pasien (tampilan 3D) — lihat src/data/appearance.json & core/appearance.ts
// ---------------------------------------------------------------------------

/** Isyarat klinis yang TERLIHAT (postur, perilaku, warna kulit) — selalu diturunkan dari kasus. */
export type CueId =
  | 'batuk'
  | 'sesak'
  | 'tripod'
  | 'menggigil'
  | 'gelisah'
  | 'diam_menahan'
  | 'lemas'
  | 'mengantuk'
  | 'pucat'
  | 'kuning'
  | 'mata_merah'
  | 'ruam'
  | 'pincang_kanan'
  | 'bengkak'
  | 'demam'
  | 'berkeringat'
  | 'kaku'
  | 'pegang'
  | 'kurus'
  | 'gemuk';

export const CUE_IDS: readonly CueId[] = [
  'batuk', 'sesak', 'tripod', 'menggigil', 'gelisah', 'diam_menahan', 'lemas', 'mengantuk', 'pucat', 'kuning',
  'mata_merah', 'ruam', 'pincang_kanan', 'bengkak', 'demam', 'berkeringat', 'kaku', 'pegang', 'kurus', 'gemuk',
];

/** Bagian tubuh yang bisa ditunjuk/dipegang pasien. */
export type BodySite = 'kepala' | 'mata' | 'mulut' | 'tenggorokan' | 'dada' | 'ulu_hati' | 'perut' | 'perut_bawah' | 'pinggang' | 'lengan' | 'kaki';

export const BODY_SITES: readonly BodySite[] = ['kepala', 'mata', 'mulut', 'tenggorokan', 'dada', 'ulu_hati', 'perut', 'perut_bawah', 'pinggang', 'lengan', 'kaki'];

export type AgeGroup = 'anak' | 'remaja' | 'dewasa' | 'lansia';
export type Emotion = 'tenang' | 'cemas' | 'kesakitan' | 'lesu' | 'bingung' | 'santai' | 'yakin';
/** Peragaan gejala saat pasien membicarakannya. */
export type Demonstration = 'batuk' | 'sesak' | 'menggigil' | 'lemas' | 'dahi';

export interface OutfitDef {
  top: string;
  bottom: string;
  sleeves: 'pendek' | 'panjang';
  footwear: 'sepatu' | 'sandal';
  jacket?: string;
  /** Celana pendek (mis. seragam SD laki-laki). */
  shorts?: boolean;
  /** Kemeja berkerah (bila tidak diisi, tampilan 3D memilih sendiri secara stabil). */
  collar?: boolean;
  /** Baju dimasukkan ke celana + ikat pinggang. */
  tucked?: boolean;
}

export interface WeightedColor {
  color: string;
  weight: number;
}

export interface AppearanceFile {
  review: ReviewInfo;
  skinTones: { id: string; color: string; weight: number }[];
  hairColors: { muda: WeightedColor[]; paruh_baya: WeightedColor[]; lansia: WeightedColor[] };
  hairStyles: Record<Sex, Record<AgeGroup, string[]>>;
  hijabRate: Record<AgeGroup, number>;
  hijabColors: string[];
  glassesRate: Record<AgeGroup, number>;
  topColors: string[];
  bottomColors: string[];
  jacketColors: string[];
  /** Pakaian khas pekerjaan (seragam sekolah, satpam, dsb.). */
  outfits: Record<string, OutfitDef>;
  /** Perilaku yang tampak dari gejala. */
  symptomCues: { symptom: string; cue: CueId; level: number; site?: BodySite }[];
  /** Tanda yang tampak, diturunkan dari hasil pemeriksaan kasus. */
  findingCues: { tool: string; param: string; match?: string; min?: number; max?: number; abnormal?: boolean; cue: CueId; level: number }[];
  /** Lokasi tubuh yang ditunjuk saat pasien membicarakan gejala. */
  sites: Record<string, BodySite>;
  /** Trait penentu sisi (kiri/kanan) untuk lokasi yang bersisi. */
  sideTraits: { kiri: string[]; kanan: string[] };
  demonstrations: Record<string, Demonstration>;
  /** Emosi dasar per kepribadian. */
  emotions: Record<string, Emotion>;
  cueLabels: Record<CueId, string>;
}

/** Kondisi yang hanya muncul sebagai diagnosis banding (tidak pernah jadi pasien). */
export interface ConditionDef {
  id: string;
  name: string;
  aliases: string[];
  system: string;
  danger: DangerLevel;
  summary: string;
}

export interface ConditionsFile {
  review: ReviewInfo;
  conditions: ConditionDef[];
}

export interface ComorbiditiesFile {
  review: ReviewInfo;
  comorbidities: ComorbidityDef[];
  incidentals: IncidentalDef[];
}

/** Entri katalog terpadu untuk papan diagnosis banding & keputusan akhir. */
export interface CatalogEntry {
  id: string;
  name: string;
  aliases: string[];
  system: string;
  kind: 'penyakit' | 'komorbiditas' | 'insidental' | 'banding';
  danger: DangerLevel;
}

// ---------------------------------------------------------------------------
// Konfigurasi balancing (lihat src/data/config.ts)
// ---------------------------------------------------------------------------

export interface GameConfig {
  patient: { minAge: number; maxAge: number; allergyRate: number };
  anamnesis: {
    /** Maksimal topik/gejala yang dijawab dari satu pertanyaan bebas. */
    maxIntentsPerQuestion: number;
  };
  /** Bobot komponen penilaian klinis (total 100). */
  evaluation: {
    weights: {
      anamnesis: number;
      fisik: number;
      penunjang: number;
      banding: number;
      komplikasi: number;
      keputusan: number;
    };
    /** Pengurangan skor penunjang per pemeriksaan yang tidak perlu / kurang relevan. */
    unnecessaryTestPenalty: number;
    irrelevantTestPenalty: number;
    /** Ambang nilai huruf. */
    grades: { min: number; grade: string; label: string }[];
  };
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
    /** Skor klinis yang tidak menaikkan/menurunkan reputasi. */
    neutralScore: number;
    /** Perubahan reputasi per 1 poin skor di atas/bawah netral. */
    perScorePoint: number;
    /** Penalti tambahan bila diagnosis utama salah: wrongBase × pengali bahaya. */
    wrongBase: number;
    /** Penalti keselamatan bila pasien yang perlu rujuk segera dipulangkan. */
    unsafeDispositionPenalty: number;
    dangerMultiplier: Record<DangerLevel, number>;
    /** Gelar sesuai reputasi (min = batas bawah inklusif). */
    titles: { min: number; label: string }[];
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
  conversation: ConversationTemplates;
  reviews: ReviewGroupDef[];
  reviewsById: Map<string, ReviewGroupDef>;
  personalities: PersonalityDef[];
  personalitiesById: Map<string, PersonalityDef>;
  population: PopulationFile;
  occupationsById: Map<string, OccupationDef>;
  diseases: DiseaseTemplate[];
  diseasesById: Map<string, DiseaseTemplate>;
  comorbidities: ComorbidityDef[];
  comorbiditiesById: Map<string, ComorbidityDef>;
  incidentals: IncidentalDef[];
  incidentalsById: Map<string, IncidentalDef>;
  conditions: ConditionDef[];
  /** Aturan penampilan pasien 3D. */
  appearance: AppearanceFile;
  /** Katalog terpadu: penyakit kasus + komorbiditas + insidental + kondisi banding. */
  catalog: CatalogEntry[];
  catalogById: Map<string, CatalogEntry>;
  allergies: string[];
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
  /** Untuk source 'disease': id sumber kelainan (penyakit utama / komorbiditas / insidental). */
  origin?: string;
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
  /** Gejala yang ada tetapi TIDAK disebut sukarela — hanya terungkap bila ditanya spesifik. */
  hiddenSymptoms: string[];
  greeting: string;
  complaint: string;
  /** Jawaban per kategori anamnesis statis. */
  answers: Record<string, AnswerResult>;
  /** Hasil semua alat (diungkap saat pemeriksaan dilakukan). */
  findings: Record<string, ParamResult[]>;
  /** Nilai placeholder yang sudah ditetapkan untuk kasus ini. */
  context: Record<string, string>;
  /** Komorbiditas yang ada (known = pasien tahu & akan menyebutkannya bila ditanya). */
  comorbidities: { id: string; known: boolean }[];
  /** Temuan insidental yang ada pada kasus. */
  incidentals: string[];
  /** Komplikasi penyakit utama yang ada (id dari ComplicationDef). */
  complications: string[];
  /** Alergi pasien (null = tidak ada). */
  allergy: string | null;
}

// ---------------------------------------------------------------------------
// 3. STATE PERMAINAN
// ---------------------------------------------------------------------------

export type LogEntry =
  | { kind: 'doctor'; text: string }
  | { kind: 'patient'; text: string }
  | { kind: 'system'; text: string }
  | { kind: 'exam'; toolId: string; cost: number };

export interface DdxEntry {
  id: string;
  status: DdxStatus;
}

/** Keputusan akhir pemain. */
export interface ClinicalDecision {
  /** Diagnosis utama (kerja). */
  primary: string;
  /** Masalah lain: komorbiditas, temuan insidental, dsb. */
  secondary: string[];
  /** Komplikasi yang dinilai ada (id ComplicationDef dari diagnosis utama pilihan pemain). */
  complications: string[];
  disposition: Disposition;
}

export interface FeedbackItem {
  text: string;
  /** Penjelasan tambahan (mengapa penting / cara membedakan). */
  detail?: string;
}

export interface ComponentScore {
  key: keyof GameConfig['evaluation']['weights'];
  label: string;
  score: number;
  max: number;
  /** Yang sudah baik. */
  good: FeedbackItem[];
  /** Yang terlewat / keliru. */
  missed: FeedbackItem[];
}

export interface EvaluationResult {
  total: number;
  grade: string;
  gradeLabel: string;
  components: ComponentScore[];
  primaryCorrect: boolean;
  trueId: string;
  chosenId: string;
  /** Disposisi yang tepat untuk kasus ini. */
  expectedDisposition: Disposition;
  dispositionReason: string;
  /** Pasien yang perlu rujuk segera justru dipulangkan / hanya diobservasi. */
  unsafe: boolean;
  /** Asumsi klinis keliru yang terdeteksi. */
  pitfalls: string[];
  recommendations: string[];
  reputationDelta: number;
  reputationBreakdown: { fromScore: number; wrongPrimary: number; unsafe: number };
  spent: number;
}

export interface EncounterState {
  case: PatientCase;
  budgetRemaining: number;
  spent: number;
  /** Jumlah pertanyaan yang diajukan (tanpa batas; untuk statistik). */
  questionCount: number;
  /** Topik anamnesis yang sudah ditanyakan. */
  askedTopics: string[];
  askedSymptoms: string[];
  /** Gejala yang sudah diketahui dokter (disebut pasien / dijawab "ya"). */
  revealedSymptoms: string[];
  examsDone: string[];
  ddx: DdxEntry[];
  log: LogEntry[];
  status: 'active' | 'finished';
  decision?: ClinicalDecision;
  evaluation?: EvaluationResult;
}

/** Catatan ringkas satu pasien yang sudah selesai. */
export interface PatientRecord {
  index: number;
  seed: number;
  diseaseId: string;
  chosenId: string;
  correct: boolean;
  /** Skor klinis 0–100. */
  score: number;
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
  /** playing = berjalan · game_over = reputasi di bawah ambang · retired = pemain mengakhiri praktek. */
  status: 'playing' | 'game_over' | 'retired';
}
