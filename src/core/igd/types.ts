/**
 * Tipe data mode "Dokter Jaga IGD".
 *
 * Mode ini berdiri sendiri: tidak mengubah mesin praktik dokter umum maupun OSCE.
 * Seluruh state (shift, pasien, fisiologi) berupa objek biasa yang bisa diserialisasi
 * (JSON) sehingga deterministik, mudah diuji, dan bisa disimpan/dilanjutkan.
 *
 * Satuan waktu di mesin: DETIK permainan (bukan detik nyata). UI mengatur laju jam.
 */
import type { Sex } from '../types';

// ---------------------------------------------------------------------------
// Klasifikasi & enumerasi
// ---------------------------------------------------------------------------

/** Kategori triase Australasian Triage Scale (ATS) 1–5. */
import type { InjuryProfile } from '../injury';

export type Ats = 1 | 2 | 3 | 4 | 5;

export type EdCategory =
  | 'pernapasan'
  | 'jantung'
  | 'henti_jantung'
  | 'stroke'
  | 'trauma'
  | 'perdarahan'
  | 'syok'
  | 'kesadaran'
  | 'toksikologi'
  | 'obstetri'
  | 'anak'
  | 'ringan';

/** Cara pasien tiba di pintu IGD. */
export type ArrivalMode = 'jalan' | 'dipapah' | 'kursi_roda' | 'brankar' | 'digendong';

export type Rhythm =
  | 'sinus'
  | 'sinus_takikardia'
  | 'sinus_bradikardia'
  | 'svt'
  | 'af_rvr'
  | 'av_blok_total'
  | 'vt'
  | 'vf'
  | 'pea'
  | 'asistol';

/** Irama henti jantung. */
export type ArrestRhythm = 'vf' | 'vt' | 'pea' | 'asistol';

export type BedKind = 'resusitasi' | 'akut' | 'kursi';

export type OxygenDevice = 'udara' | 'nasal' | 'sungkup' | 'nrm' | 'niv';
export type AirwayAdjunct = 'none' | 'manuver' | 'opa' | 'npa' | 'ett';
export type Position = 'terlentang' | 'semi_fowler' | 'duduk' | 'miring_kiri' | 'kaki_diangkat';
export type Route = 'iv' | 'io' | 'im' | 'sc' | 'po' | 'sl' | 'neb' | 'in' | 'pr' | 'infus';

/** Narasumber anamnesis. */
export type InformantId = 'pasien' | 'keluarga' | 'paramedis' | 'saksi';

export type Disposition = 'pulang' | 'bangsal' | 'hcu_icu' | 'kamar_operasi' | 'kateterisasi' | 'rujuk' | 'meninggal';

export type Specialty =
  | 'jantung'
  | 'bedah'
  | 'bedah_saraf'
  | 'saraf'
  | 'penyakit_dalam'
  | 'obgin'
  | 'anak'
  | 'anestesi'
  | 'ortopedi'
  | 'paru'
  | 'bedah_plastik';

/** Komponen penilaian (survei primer ABCDE + survei sekunder). */
export type ExamId =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'kepala_leher'
  | 'dada'
  | 'abdomen'
  | 'pelvis_ekstremitas'
  | 'punggung'
  | 'neurologis'
  | 'obstetri'
  | 'luka';

// ---------------------------------------------------------------------------
// Fisiologi
// ---------------------------------------------------------------------------

/**
 * Variabel fisiologis tersembunyi. Tanda vital & hasil pemeriksaan DIHITUNG dari sini,
 * sehingga semua yang dilihat pemain selalu konsisten satu sama lain.
 */
export type VarKey =
  /** Volume sirkulasi efektif (1 = normal). */
  | 'volume'
  /** Massa sel darah merah relatif (1 = normal) — Hb = Hb dasar × rbc / volume. */
  | 'rbc'
  /** Laju perdarahan (fraksi volume darah per menit). */
  | 'bleed'
  /** Kehilangan cairan non-darah (diare, kebocoran plasma, luka bakar), fraksi per menit. */
  | 'leak'
  /** Tonus vaskular (1 = normal; < 1 vasodilatasi; > 1 vasokonstriksi/hipertensi). */
  | 'tone'
  /** Fungsi pompa jantung (1 = normal). */
  | 'pump'
  /** Obstruksi aliran balik vena (tension pneumotoraks/tamponade), 0..1. */
  | 'obstruction'
  /** Kolaps paru (pneumotoraks), 0..1. */
  | 'ptx'
  /** Pirau intrapulmonal (refrakter oksigen), 0..1. */
  | 'shunt'
  /** Ketidakseimbangan ventilasi-perfusi (responsif oksigen), 0..1. */
  | 'vq'
  /** Bronkospasme, 0..1. */
  | 'spasm'
  /** Patensi jalan napas intrinsik (1 = paten). */
  | 'airway'
  /** Dorongan napas sentral (1 = normal). */
  | 'drive'
  /** Peningkatan tekanan intrakranial, 0..1 (1 = herniasi). */
  | 'icp'
  | 'glucose'
  /** Ketoasidosis, 0..1. */
  | 'keto'
  | 'k'
  | 'na'
  | 'temp'
  /** Nyeri, 0..1. */
  | 'pain'
  /** Cemas/gelisah, 0..1. */
  | 'anxiety'
  /** Sedasi (opioid/sedatif/alkohol), 0..1. */
  | 'sedation'
  /** Toksidrom kolinergik (organofosfat), 0..1. */
  | 'cholinergic'
  /** Iskemia miokard aktif, 0..1. */
  | 'ischemia'
  /** Reaksi anafilaksis (pelepasan mediator), 0..1. */
  | 'reaction'
  /** Aktivitas infeksi/sepsis, 0..1. */
  | 'infection'
  /** Edema paru, 0..1. */
  | 'edema'
  /** Fase pascaiktal, 0..1. */
  | 'postictal'
  /** Cedera otak permanen/sekunder akumulatif, 0..1. */
  | 'brainInjury'
  /** Laktat serum (mmol/L). */
  | 'lactate'
  /** Kelelahan otot napas, 0..1. */
  | 'fatigue'
  /** Atonia uteri, 0..1. */
  | 'atony'
  /** Kadar magnesium serum (mg/dL). */
  | 'mg'
  /** Hipertensi akut (kenaikan tonus), 0..1. */
  | 'hypertension'
  /** Angioedema jalan napas, 0..1. */
  | 'angioedema';

export type VarRecord = Record<VarKey, number>;

/** Pengaruh sementara (obat, manuver) dengan masa kerja. Nilai efektif = v + Σ mod. */
export interface Mod {
  key: VarKey | 'hr' | 'map' | 'rr';
  value: number;
  /** Mulai (detik permainan). */
  t0: number;
  /** Puncak tercapai (onset selesai). */
  t1: number;
  /** Mulai menurun. */
  t2: number;
  /** Habis. */
  t3: number;
  source: string;
}

/** Perubahan permanen bertahap (cairan masuk, dekstrosa, penurunan bronkospasme). */
export interface Ramp {
  key: VarKey;
  total: number;
  t0: number;
  t1: number;
  source: string;
}

/** Perubahan laju/nilai terjadwal (mis. antibiotik mulai bekerja setelah 45 menit). */
export interface Scheduled {
  at: number;
  key: VarKey;
  target: 'v' | 'rate';
  op: 'set' | 'add' | 'mul';
  value: number;
  source: string;
}

export interface ArrestState {
  rhythm: ArrestRhythm;
  since: number;
  /** Detik tanpa kompresi dada (tanpa aliran). */
  noFlow: number;
  /** Detik RJP berjalan. */
  cprSeconds: number;
  shocks: number;
  adrenalineDoses: number;
  lastAdrenalineAt: number | null;
  amiodaroneMg: number;
  /** Penyebab henti jantung (untuk 4H 4T). */
  cause: ArrestCause;
  /** Kesempatan ROSC berikutnya dinilai pada siklus RJP ini. */
  nextCheckAt: number;
}

export type ArrestCause = 'hipoksia' | 'hipovolemia' | 'hipo_hiperkalemia' | 'tension' | 'iskemia' | 'toksin' | 'herniasi' | 'asidosis' | 'primer';

export interface PhysioBase {
  hr: number;
  map: number;
  pp: number;
  rr: number;
  temp: number;
  hb: number;
}

export interface PhysioState {
  v: VarRecord;
  /** Laju perubahan alami per MENIT (perjalanan penyakit tanpa terapi). */
  rate: Partial<Record<VarKey, number>>;
  mods: Mod[];
  ramps: Ramp[];
  scheduled: Scheduled[];
  rhythm: Rhythm;
  /** Frekuensi untuk irama dengan laju tetap (SVT, AV blok total, AF). */
  rhythmRate: number | null;
  seizure: boolean;
  /** Kejang berhenti spontan pada waktu ini (null = berlanjut sampai diobati). */
  seizureEndsAt: number | null;
  arrest: ArrestState | null;
  dead: boolean;
  deathCause: string | null;
  base: PhysioBase;
  weightKg: number;
  ageYears: number;
  sex: Sex;
  /** Memakai penyekat beta (kompensasi takikardia tumpul). */
  betaBlocker: boolean;
  airwayCause: 'lidah' | 'benda_asing' | 'angioedema' | 'sekret' | 'inhalasi' | null;
  stroke: { side: 'kiri' | 'kanan'; aphasia: boolean; severity: number } | null;
  /** Sisi pneumotoraks/temuan dada bersisi. */
  chestSide: 'kiri' | 'kanan' | null;
  /** Sisi lesi intrakranial (anisokor). */
  brainSide: 'kiri' | 'kanan' | null;
  /** Penghitung (detik) untuk pemicu henti jantung & kerusakan. */
  counters: { lowMap: number; lowSat: number; herniation: number; hypoK: number };
  /** Nilai langkah sebelumnya (umpan balik: dorongan napas hipoksik, jatuhnya lidah, dsb.). */
  memo: { gcs: number; pao2: number; map: number; sa: number; perfusion: number; paco2?: number };
  /** Waktu `memo` terakhir diperbarui (dasar kinetika cadangan oksigen & CO₂). */
  memoT?: number;
  /** Skala perburukan (tingkat kesulitan). */
  deterioration: number;
  /** Perkiraan tingkat hidrasi kulit/mukosa untuk temuan (dehidrasi). */
  dehydration: number;
  /** Efek obat infus kontinu yang sedang bekerja (dihaluskan menuju target tiap langkah). */
  drip: Partial<Record<Mod['key'], number>>;
  /** Jumlah dosis per obat yang sudah diberikan (efek berkurang pada dosis berulang). */
  doses: Record<string, number>;
}

/** Dukungan yang sedang terpasang & memengaruhi fisiologi. */
export interface Support {
  fio2: number;
  oxygen: OxygenDevice;
  flow: number;
  adjunct: AirwayAdjunct;
  /** Ventilasi bantuan: tidak ada, bag-valve-mask, atau ventilator. */
  assist: 'none' | 'bvm' | 'ventilator';
  position: Position;
  cpr: boolean;
  pacing: number | null;
  /** Suction dalam 5 menit terakhir (sekret/muntahan). */
  suctioned: boolean;
}

export interface Gcs {
  e: number;
  v: number;
  m: number;
  total: number;
  /** Terintubasi: verbal tidak bisa dinilai (VT). */
  intubated: boolean;
}

export interface Vitals {
  /** Nilai mentah (tanpa pembulatan) untuk memori fisiologi — agar perubahan kecil tiap langkah tidak hilang. */
  rawSa?: number;
  rawPaco2?: number;
  hr: number;
  /** Nadi teraba? (false saat henti jantung). */
  pulse: boolean;
  rhythm: Rhythm;
  sbp: number | null;
  dbp: number | null;
  map: number | null;
  rr: number;
  spo2: number | null;
  temp: number;
  gcs: Gcs;
  pao2: number;
  paco2: number;
  ph: number;
  hco3: number;
  lactate: number;
  glucose: number;
  hb: number;
  hct: number;
  k: number;
  na: number;
  etco2: number | null;
  crt: number;
  /** Indeks perfusi relatif (1 = normal) untuk temuan kulit. */
  perfusion: number;
}

// ---------------------------------------------------------------------------
// Katalog (alat, obat, tindakan) — lihat catalog.ts
// ---------------------------------------------------------------------------

export type TestId =
  | 'gds'
  | 'ekg'
  | 'agd'
  | 'darah_lengkap'
  | 'elektrolit'
  | 'fungsi_ginjal'
  | 'fungsi_hati'
  | 'troponin'
  | 'laktat'
  | 'kultur_darah'
  | 'urinalisis'
  | 'keton'
  | 'bhcg'
  | 'crossmatch'
  | 'koagulasi'
  | 'kolinesterase'
  | 'ns1'
  | 'rontgen_thorax'
  | 'rontgen_pelvis'
  | 'rontgen_ekstremitas'
  | 'ct_kepala'
  | 'ct_abdomen'
  | 'fast'
  | 'usg_obstetri';

export type ProcId =
  | 'monitor'
  | 'ttv'
  | 'iv'
  | 'io'
  | 'ambil_darah'
  | 'oksigen'
  | 'manuver'
  | 'suction'
  | 'opa'
  | 'npa'
  | 'heimlich'
  | 'bvm'
  | 'intubasi'
  | 'ventilator'
  | 'dekompresi_jarum'
  | 'wsd'
  | 'posisi'
  | 'pad_defib'
  | 'rjp'
  | 'hentikan_rjp'
  | 'defibrilasi'
  | 'kardioversi'
  | 'pacing'
  | 'vagal'
  | 'tekan_langsung'
  | 'torniket'
  | 'pelvic_binder'
  | 'bidai'
  | 'collar'
  | 'masase_uterus'
  | 'kompresi_bimanual'
  | 'kateter_urin'
  | 'ngt'
  | 'selimut_hangat'
  | 'dekontaminasi'
  | 'dinginkan_luka_bakar'
  | 'rawat_luka'
  | 'jahit_luka'
  | 'nyatakan_meninggal';

export type DrugId = string;
export type FluidId = 'nacl' | 'rl' | 'koloid' | 'prc' | 'd10' | 'd5';

export type Performer = 'dokter' | 'perawat';

// ---------------------------------------------------------------------------
// Skenario
// ---------------------------------------------------------------------------

/** Cara mendeteksi bahwa pemain melakukan sesuatu (untuk tindakan kritis & penilaian). */
export type ActionMatch =
  | { kind: 'exam'; id: ExamId }
  | { kind: 'test'; id: TestId }
  | { kind: 'proc'; id: ProcId; param?: string }
  | { kind: 'drug'; id: DrugId; routes?: Route[]; /** Dosis total sekali beri (satuan obat). */ dose?: [number, number]; /** Dosis per kg. */ perKg?: [number, number] }
  | { kind: 'oxygen'; /** FiO2 minimal yang dianggap tepat. */ minFio2?: number }
  | { kind: 'fluid'; ids?: FluidId[]; /** Total ml/kg kumulatif minimal dalam tenggat. */ minMlPerKg?: number; minMl?: number }
  | { kind: 'consult'; id: Specialty }
  | { kind: 'triage' }
  | { kind: 'any'; of: ActionMatch[] }
  | { kind: 'all'; of: ActionMatch[] };

export interface CriticalAction {
  id: string;
  label: string;
  match: ActionMatch;
  /** Tenggat (menit sejak pasien tiba di IGD). */
  byMin: number;
  weight: number;
  /** Indikasi/alasan klinis (ditampilkan di debrief). */
  why: string;
  /** Hanya dinilai bila kondisi ini benar di akhir (mis. amiodaron hanya bila VF menetap). */
  onlyIf?: (p: EdPatient) => boolean;
}

export interface HarmRule {
  id: string;
  label: string;
  match: ActionMatch;
  /** Hanya berbahaya bila kondisi ini benar saat tindakan dilakukan (opsional). */
  when?: (ctx: HarmContext) => boolean;
  severity: 'ringan' | 'sedang' | 'berat';
  why: string;
}

export interface HarmContext {
  vitals: Vitals;
  physio: PhysioState;
  patient: EdPatient;
  /** Menit sejak pasien tiba. */
  minute: number;
  done: (m: ActionMatch) => boolean;
}

/** Jawaban satu narasumber. Kunci = id topik anamnesis (lihat anamnesis.ts). */
export interface InformantSpec {
  /** Label narasumber, mis. "Istri pasien (Bu Rina)". */
  label?: string;
  /** Kalimat serah terima/pembuka (paramedis: MIST/SBAR). */
  opening?: string;
  topics: Partial<Record<string, string>>;
  /** Gejala yang ADA (id gejala → jawaban). Gejala lain dijawab tidak/tidak tahu. */
  symptoms?: Record<string, string>;
}

export interface PatientSpec {
  sex: Sex | 'acak';
  age: [number, number];
  weight?: [number, number];
  /** Nama tetap (opsional). Bila kosong dipilih dari populasi. */
  name?: string;
  /** Penyakit penyerta (dipilih acak menurut peluang). */
  comorbid?: { id: string; text: string; chance: number; betaBlocker?: boolean }[];
}

export interface ScenarioVariant {
  id: string;
  label: string;
  weight: number;
  physio?: PhysioInit;
  /** Disposisi terbaik khusus varian ini (menimpa skenario). */
  disposition?: EdScenario['disposition'];
  /** Kategori triase yang benar untuk varian ini. */
  ats?: Ats;
}

/** Nilai awal fisiologi skenario (menimpa default sesuai usia). */
export interface PhysioInit {
  v?: Partial<VarRecord>;
  rate?: Partial<Record<VarKey, number>>;
  base?: Partial<PhysioBase>;
  rhythm?: Rhythm;
  rhythmRate?: number;
  seizure?: boolean;
  seizureMin?: number | null;
  airwayCause?: PhysioState['airwayCause'];
  stroke?: PhysioState['stroke'];
  chestSide?: 'kiri' | 'kanan';
  brainSide?: 'kiri' | 'kanan';
  arrest?: ArrestRhythm;
  arrestCause?: ArrestCause;
  /** Derajat dehidrasi klinis awal (0..1) untuk temuan kulit/mukosa. */
  dehydration?: number;
}

export interface ScriptedEvent {
  id: string;
  /** Menit sejak tiba (rentang = diacak). */
  atMin: number | [number, number];
  /** Batal bila salah satu tindakan ini sudah dilakukan sebelumnya. */
  unless?: ActionMatch[];
  /** Hanya bila kondisi fisiologis ini benar. */
  when?: (p: PhysioState, v: Vitals) => boolean;
  apply: (p: PhysioState, now: number) => void;
  /** Catatan kejadian (log). */
  note: string;
}

export interface TestResultSpec {
  /** Ringkasan hasil (teks), menimpa hasil hitungan. */
  text?: string | ((ctx: ResultContext) => string);
  /** Baris tambahan sesudah hasil hitungan. */
  extra?: string | ((ctx: ResultContext) => string);
}

export interface ResultContext {
  vitals: Vitals;
  physio: PhysioState;
  patient: EdPatient;
  minute: number;
}

export interface EdScenario {
  id: string;
  /** Judul debrief (diagnosis tidak ditampilkan selama bermain). */
  title: string;
  category: EdCategory;
  difficulty: 1 | 2 | 3;
  ats: Ats;
  /** Kategori triase lain yang masih dapat diterima. */
  atsAcceptable?: Ats[];
  patient: PatientSpec;
  arrival: {
    mode: ArrivalMode;
    /** Siapa yang mengantar (untuk adegan & narasumber). */
    by: 'sendiri' | 'keluarga' | 'ambulans' | 'warga' | 'polisi';
    /** Keluhan utama di kartu triase. */
    complaint: string;
    /** Mekanisme cedera (trauma). */
    mechanism?: string;
    /** Catatan pra-rumah sakit (tindakan ambulans dll.). */
    prehospital?: string;
    /** Alat yang sudah terpasang saat tiba (mis. O₂ dari ambulans, collar). */
    devices?: Partial<PatientDevices>;
  };
  variants?: ScenarioVariant[];
  physio: PhysioInit;
  /** Kopling khusus skenario per langkah waktu (mis. perdarahan mengikuti torniket/pelvic binder). */
  step?: (patient: EdPatient, dtMin: number, now: number) => void;
  /** Alur penanganan pakar (dipakai tes otomatis & contoh di dokumentasi). */
  expert: ExpertStep[];
  events?: ScriptedEvent[];
  informants: Partial<Record<InformantId, InformantSpec>>;
  /** Temuan statis tambahan per komponen pemeriksaan. */
  findings?: Partial<Record<ExamId, string | ((ctx: ResultContext) => string)>>;
  tests?: Partial<Record<TestId, TestResultSpec>>;
  diagnosis: {
    primary: string[];
    acceptable?: string[];
    /** Masalah penyerta yang sebaiknya dikenali. */
    secondary?: string[];
  };
  critical: CriticalAction[];
  /** Penunjang yang berindikasi. Penunjang lain yang tidak tercantum dianggap tidak perlu. */
  indicatedTests: TestId[];
  /** Penunjang yang masih wajar walau bukan inti (tidak dihukum). */
  optionalTests?: TestId[];
  /** Obat yang berindikasi/wajar (selain yang ada di tindakan kritis). Obat lain = tanpa indikasi. */
  indicatedDrugs?: DrugId[];
  harmful?: HarmRule[];
  /** Target stabil saat disposisi. */
  stable: (v: Vitals, p: PhysioState, now: number) => boolean;
  disposition: { best: Disposition[]; acceptable?: Disposition[]; consult?: Specialty[] };
  /** Cedera yang terlihat (luka, memar, luka bakar, perdarahan) untuk tampilan 3D. */
  injuries?: InjuryProfile;
  debrief: {
    ringkasan: string;
    tatalaksana: string[];
    jebakan?: string[];
    referensi: string[];
  };
}

// ---------------------------------------------------------------------------
// Shift & pasien
// ---------------------------------------------------------------------------

export type ShiftMode = 'latihan' | 'jaga' | 'sibuk';

export interface BedDef {
  id: string;
  label: string;
  kind: BedKind;
}

export interface ShiftConfig {
  mode: ShiftMode;
  beds: BedDef[];
  nurses: number;
  /** Pengali laju perburukan alami. */
  deterioration: number;
  /** Tampilkan petunjuk dosis/sediaan. */
  hints: boolean;
  /** Jadwal kedatangan (menit sejak shift mulai). */
  arrivals: { scenarioId: string; variant?: string; atMin: number }[];
  /** Jam mulai (menit sejak 00:00). */
  startClock: number;
  /** Batas lama shift (menit). */
  durationMin: number;
}

export type PatientStatus = 'akan_datang' | 'triase' | 'menunggu_bed' | 'dirawat' | 'pindah' | 'keluar' | 'meninggal';

export interface ActionRecord {
  t: number;
  /** Jenis aksi pemain. */
  type: 'exam' | 'test' | 'proc' | 'drug' | 'fluid' | 'oxygen' | 'consult' | 'triage' | 'ask' | 'diagnosis' | 'disposition' | 'stop';
  id: string;
  /** Teks ringkas untuk linimasa. */
  label: string;
  route?: Route;
  dose?: number;
  unit?: string;
  volumeMl?: number;
  fluid?: FluidId;
  param?: string;
  fio2?: number;
  /** Peringatan keselamatan yang ditimbulkan aksi ini (id aturan). */
  harms?: string[];
  /** Catatan dosis (kurang/lebih). */
  doseNote?: 'kurang' | 'lebih' | 'tepat';
  /** Kapan benar-benar dikerjakan (perawat/dokter selesai). */
  doneAt?: number;
  /** Laju infus (obat kontinu). */
  rate?: number;
}

export interface TestOrder {
  id: TestId;
  orderedAt: number;
  /** Sampel diambil / pemeriksaan dilakukan. */
  sampledAt: number | null;
  readyAt: number | null;
  status: 'menunggu' | 'diproses' | 'selesai';
  result: string | null;
  /** Ada nilai kritis/abnormal. */
  abnormal: boolean;
}

export interface ChatEntry {
  t: number;
  who: 'dokter' | InformantId | 'perawat' | 'sistem';
  text: string;
}

export interface Infusion {
  id: string;
  kind: 'cairan' | 'obat';
  /** Id cairan atau obat. */
  ref: string;
  label: string;
  /** Untuk cairan: volume total & laju (ml/menit). Untuk obat drip: dosis per menit dalam satuan obat. */
  volumeMl: number;
  givenMl: number;
  ratePerMin: number;
  startedAt: number;
  stoppedAt: number | null;
}

export interface ConsultState {
  specialty: Specialty;
  requestedAt: number;
  answerAt: number;
  answered: boolean;
  accepted: boolean;
  advice: string;
}

export interface VitalSample {
  t: number;
  hr: number;
  sbp: number | null;
  dbp: number | null;
  spo2: number | null;
  rr: number;
  gcs: number;
  rhythm: Rhythm;
}

export interface PatientDevices {
  ivCount: number;
  io: boolean;
  monitor: boolean;
  pads: boolean;
  oxygen: OxygenDevice;
  flow: number;
  adjunct: AirwayAdjunct;
  assist: 'none' | 'bvm' | 'ventilator';
  position: Position;
  cpr: boolean;
  pacing: number | null;
  collar: boolean;
  binder: boolean;
  tourniquet: boolean;
  pressure: boolean;
  splint: boolean;
  catheter: boolean;
  ngt: boolean;
  chestTube: 'kiri' | 'kanan' | null;
  warmed: boolean;
  decontaminated: boolean;
  lastSuction: number | null;
  /** Darah sudah diambil (sampel tersedia untuk lab berikutnya dalam 30 menit). */
  bloodDrawnAt: number | null;
}

export interface Episode {
  kind: 'henti_jantung' | 'kejang';
  start: number;
  end: number | null;
  rhythm?: ArrestRhythm;
  /** Jumlah kejut listrik selama episode henti jantung. */
  shocks?: number;
}

export interface EdPatient {
  id: string;
  scenarioId: string;
  variant: string;
  name: string;
  /** Nama panggilan untuk dialog, mis. "Pak Budi". */
  address: string;
  sex: Sex;
  age: number;
  weightKg: number;
  comorbid: { id: string; text: string }[];
  arrivalMode: ArrivalMode;
  status: PatientStatus;
  arriveAt: number;
  triagedAt: number | null;
  ats: Ats | null;
  bedId: string | null;
  /** Pemeriksaan dokter pertama (respons dokter). */
  firstSeenAt: number | null;
  /** Kejadian terjadwal yang sudah dijalankan/dibatalkan. */
  eventsDone: string[];
  /** Waktu kejadian terjadwal yang sudah diacak (id → detik). */
  eventTimes: Record<string, number>;
  physio: PhysioState;
  devices: PatientDevices;
  infusions: Infusion[];
  actions: ActionRecord[];
  tests: TestOrder[];
  exams: Partial<Record<ExamId, { t: number; text: string }>>;
  /** Hasil TTV terakhir yang diketahui pemain (tanpa monitor = snapshot). */
  knownVitals: { t: number; vitals: Vitals } | null;
  /** Tanda vital awal (kartu triase). */
  arrivalVitals: Vitals;
  chat: ChatEntry[];
  askedTopics: string[];
  diagnosis: { primary: string | null; secondary: string[] };
  consults: ConsultState[];
  disposition: { to: Disposition; at: number; leaveAt: number } | null;
  /** Pasien sedang di luar bed (CT/rontgen) sampai waktu ini. */
  awayUntil: number | null;
  timeline: VitalSample[];
  /** Catatan kejadian klinis (henti jantung, ROSC, kejang, dsb.). */
  notes: { t: number; text: string; kind: 'buruk' | 'baik' | 'info' }[];
  /** Waktu terakhir alarm dicatat per jenis (mencegah banjir log). */
  alarms: Record<string, number>;
  outcome: 'stabil' | 'tidak_stabil' | 'meninggal' | null;
  endedAt: number | null;
  /** Total cairan masuk (ml) per jenis. */
  fluidsMl: Partial<Record<FluidId, number>>;
  /** Episode henti jantung & kejang (untuk penilaian & debrief). */
  episodes: Episode[];
}

export interface NurseState {
  id: string;
  name: string;
  /** Tugas yang sedang dikerjakan. */
  taskId: string | null;
  /** Lokasi (bed) terakhir. */
  at: string | null;
}

export interface EdTask {
  id: string;
  patientId: string;
  performer: Performer;
  /** Perawat yang mengerjakan (null = antre). */
  nurseId: string | null;
  label: string;
  /** Durasi kerja (detik). */
  duration: number;
  createdAt: number;
  startedAt: number | null;
  /** Tugas berkelanjutan (RJP, BVM) tidak selesai sendiri. */
  continuous: boolean;
  /** Aksi yang dijalankan saat selesai (serialisasi): lihat engine.ts. */
  action: TaskAction;
  /** Indeks catatan aksi pemain (patient.actions) yang terkait. */
  record: number | null;
}

export type TaskAction =
  | { kind: 'proc'; id: ProcId; param?: string; value?: number }
  | { kind: 'drug'; id: DrugId; route: Route; dose: number }
  | { kind: 'fluid'; id: FluidId; volumeMl: number; overMin: number }
  | { kind: 'sample'; tests: TestId[] }
  | { kind: 'test_bedside'; id: TestId }
  | { kind: 'ttv' };

export interface LogEntry {
  t: number;
  patientId: string | null;
  text: string;
  kind: 'info' | 'alarm' | 'hasil' | 'tugas' | 'kedatangan' | 'buruk' | 'baik';
}

export interface EdShift {
  version: 1;
  seed: number;
  config: ShiftConfig;
  /** Waktu permainan (detik sejak shift mulai). */
  time: number;
  counter: number;
  patients: EdPatient[];
  beds: { id: string; label: string; kind: BedKind; patientId: string | null }[];
  nurses: NurseState[];
  /**
   * Kesibukan dokter: tugas berjangka (tindakan) atau kegiatan singkat (pemeriksaan, telepon
   * konsul) — `label` = kegiatan itu, `patientId` = pasien yang sedang ditangani.
   */
  doctor: { busyUntil: number; task: string | null; bedId: string | null; label?: string | null; patientId?: string | null };
  tasks: EdTask[];
  /** Ventilator yang tersedia (id pasien yang memakai). */
  ventilators: (string | null)[];
  log: LogEntry[];
  status: 'berjalan' | 'selesai';
}

// ---------------------------------------------------------------------------
// Aksi pemain
// ---------------------------------------------------------------------------

export type EdAction =
  | { type: 'triase'; ats: Ats; bedId?: string | null }
  | { type: 'pindah'; bedId: string }
  | { type: 'periksa'; exam: ExamId }
  | { type: 'tanya'; who: InformantId; text: string; topic?: string | null }
  | { type: 'penunjang'; test: TestId }
  | { type: 'tindakan'; proc: ProcId; param?: string }
  | { type: 'obat'; drug: string; route: Route; dose: number }
  | { type: 'infus_obat'; drug: string; rate: number }
  | { type: 'cairan'; fluid: FluidId; volumeMl: number; overMin: number }
  | { type: 'hentikan_infus'; infusionId: string }
  | { type: 'hentikan_tugas'; taskId: string }
  | { type: 'konsul'; specialty: Specialty }
  | { type: 'diagnosis'; primary: string | null; secondary: string[] }
  | { type: 'disposisi'; to: Disposition };

export interface ActResult {
  ok: boolean;
  message: string;
}

/** Satu langkah rencana pakar: aksi pada menit tertentu sejak pasien tiba. */
export interface ExpertStep {
  atMin: number;
  /** Aksi (atau fungsi untuk dosis berbasis berat badan). */
  action: EdAction | ((p: EdPatient) => EdAction);
  /** Hanya bila kondisi ini benar saat itu (mis. ulangi adrenalin bila masih syok). */
  when?: (p: EdPatient, v: Vitals) => boolean;
}
