/**
 * Katalog mode IGD: komponen pemeriksaan, penunjang (dengan waktu tunggu), tindakan,
 * cairan, konsulen, disposisi, dan daftar diagnosis kerja.
 *
 * Waktu dalam MENIT permainan.
 */
import type { BedDef, Disposition, ExamId, FluidId, Performer, ProcId, Specialty, TestId } from './types';

// ---------------------------------------------------------------------------
// Pemeriksaan (dokter)
// ---------------------------------------------------------------------------

export interface ExamDef {
  id: ExamId;
  label: string;
  short: string;
  survey: 'primer' | 'sekunder';
  /** Lama pemeriksaan (detik). */
  seconds: number;
  hint: string;
}

export const EXAMS: readonly ExamDef[] = [
  { id: 'A', label: 'A — Airway (jalan napas)', short: 'Airway', survey: 'primer', seconds: 20, hint: 'Bicara? Suara napas tambahan (snoring, gurgling, stridor)? Benda asing, darah, muntahan, edema?' },
  { id: 'B', label: 'B — Breathing (pernapasan)', short: 'Breathing', survey: 'primer', seconds: 40, hint: 'Laju & pola napas, otot bantu, simetri dada, auskultasi, perkusi, posisi trakea, SpO₂.' },
  { id: 'C', label: 'C — Circulation (sirkulasi)', short: 'Circulation', survey: 'primer', seconds: 40, hint: 'Nadi (laju, kekuatan), tekanan darah, CRT, akral, perdarahan, JVP, bunyi jantung.' },
  { id: 'D', label: 'D — Disability (neurologis)', short: 'Disability', survey: 'primer', seconds: 35, hint: 'GCS, pupil, lateralisasi, kejang. Jangan lupa gula darah.' },
  { id: 'E', label: 'E — Exposure (paparan)', short: 'Exposure', survey: 'primer', seconds: 40, hint: 'Suhu, kulit (ruam, sianosis), jejas/luka, deformitas, bekas suntikan — cegah hipotermia.' },
  { id: 'kepala_leher', label: 'Kepala & leher', short: 'Kepala-leher', survey: 'sekunder', seconds: 45, hint: 'Jejas kepala, mata, THT, leher (deviasi trakea, JVP, nyeri tulang leher).' },
  { id: 'dada', label: 'Dada (paru & jantung)', short: 'Dada', survey: 'sekunder', seconds: 60, hint: 'Inspeksi, palpasi, perkusi, auskultasi detail.' },
  { id: 'abdomen', label: 'Abdomen', short: 'Abdomen', survey: 'sekunder', seconds: 60, hint: 'Distensi, nyeri tekan, defans, jejas, bising usus.' },
  { id: 'pelvis_ekstremitas', label: 'Pelvis & ekstremitas', short: 'Pelvis-ekstremitas', survey: 'sekunder', seconds: 60, hint: 'Stabilitas pelvis (sekali saja), deformitas, nadi distal, edema.' },
  { id: 'punggung', label: 'Punggung (log roll)', short: 'Log roll', survey: 'sekunder', seconds: 60, hint: 'Jejas punggung, nyeri tekan tulang belakang (dengan log roll).' },
  { id: 'neurologis', label: 'Neurologis lengkap', short: 'Neurologis', survey: 'sekunder', seconds: 90, hint: 'Saraf kranial, motorik, sensorik, refleks, rangsang meningeal, NIHSS bila stroke.' },
  { id: 'obstetri', label: 'Obstetri (kehamilan/nifas)', short: 'Obstetri', survey: 'sekunder', seconds: 90, hint: 'Tinggi fundus, kontraksi uterus, DJJ, perdarahan jalan lahir, laserasi.' },
  { id: 'luka', label: 'Inspeksi luka', short: 'Luka', survey: 'sekunder', seconds: 60, hint: 'Ukuran, kedalaman, kontaminasi, perdarahan, nadi/sensibilitas distal.' },
];

export const EXAMS_BY_ID = new Map(EXAMS.map((e) => [e.id, e]));

// ---------------------------------------------------------------------------
// Penunjang
// ---------------------------------------------------------------------------

export interface TestDef {
  id: TestId;
  label: string;
  kind: 'bedside' | 'lab' | 'radiologi';
  /** Waktu tunggu hasil sejak sampel diambil/pemeriksaan dimulai (menit). */
  turnaround: number;
  /** Butuh sampel darah (diambil perawat, ± 3 menit; lebih cepat bila sudah ada akses IV). */
  blood: boolean;
  /** Pasien dibawa keluar bed selama pemeriksaan (menit). */
  awayMin?: number;
  /** Dikerjakan dokter (mis. USG FAST). */
  byDoctor?: boolean;
  /** Lama tindakan perawat/dokter (detik). */
  seconds: number;
  group: 'Bedside' | 'Darah' | 'Urin & lain' | 'Pencitraan';
}

export const TESTS: readonly TestDef[] = [
  { id: 'gds', label: 'Gula darah sewaktu (stik)', kind: 'bedside', turnaround: 1, blood: false, seconds: 60, group: 'Bedside' },
  { id: 'ekg', label: 'EKG 12 sadapan', kind: 'bedside', turnaround: 1, blood: false, seconds: 240, group: 'Bedside' },
  { id: 'agd', label: 'Analisa gas darah (AGD) + laktat', kind: 'bedside', turnaround: 8, blood: true, seconds: 180, group: 'Bedside' },
  { id: 'keton', label: 'Keton darah (stik)', kind: 'bedside', turnaround: 2, blood: false, seconds: 60, group: 'Bedside' },
  { id: 'fast', label: 'USG FAST/eFAST (dokter)', kind: 'bedside', turnaround: 0, blood: false, byDoctor: true, seconds: 300, group: 'Bedside' },
  { id: 'darah_lengkap', label: 'Darah lengkap', kind: 'lab', turnaround: 30, blood: true, seconds: 180, group: 'Darah' },
  { id: 'elektrolit', label: 'Elektrolit (Na, K, Cl)', kind: 'lab', turnaround: 40, blood: true, seconds: 180, group: 'Darah' },
  { id: 'fungsi_ginjal', label: 'Ureum & kreatinin', kind: 'lab', turnaround: 45, blood: true, seconds: 180, group: 'Darah' },
  { id: 'fungsi_hati', label: 'SGOT/SGPT, bilirubin, albumin', kind: 'lab', turnaround: 45, blood: true, seconds: 180, group: 'Darah' },
  { id: 'troponin', label: 'Troponin (hs-cTn)', kind: 'lab', turnaround: 45, blood: true, seconds: 180, group: 'Darah' },
  { id: 'laktat', label: 'Laktat serum', kind: 'lab', turnaround: 20, blood: true, seconds: 180, group: 'Darah' },
  { id: 'kultur_darah', label: 'Kultur darah (2 set)', kind: 'lab', turnaround: 2880, blood: true, seconds: 240, group: 'Darah' },
  { id: 'koagulasi', label: 'PT/APTT/INR', kind: 'lab', turnaround: 45, blood: true, seconds: 180, group: 'Darah' },
  { id: 'crossmatch', label: 'Golongan darah & crossmatch', kind: 'lab', turnaround: 45, blood: true, seconds: 180, group: 'Darah' },
  { id: 'kolinesterase', label: 'Kolinesterase serum', kind: 'lab', turnaround: 60, blood: true, seconds: 180, group: 'Darah' },
  { id: 'ns1', label: 'NS1 & serologi dengue', kind: 'lab', turnaround: 40, blood: true, seconds: 180, group: 'Darah' },
  { id: 'urinalisis', label: 'Urinalisis', kind: 'lab', turnaround: 20, blood: false, seconds: 120, group: 'Urin & lain' },
  { id: 'bhcg', label: 'Tes kehamilan (β-hCG urin)', kind: 'bedside', turnaround: 5, blood: false, seconds: 120, group: 'Urin & lain' },
  { id: 'rontgen_thorax', label: 'Rontgen thorax (portabel)', kind: 'radiologi', turnaround: 20, blood: false, seconds: 120, group: 'Pencitraan' },
  { id: 'rontgen_pelvis', label: 'Rontgen pelvis (portabel)', kind: 'radiologi', turnaround: 20, blood: false, seconds: 120, group: 'Pencitraan' },
  { id: 'rontgen_ekstremitas', label: 'Rontgen ekstremitas', kind: 'radiologi', turnaround: 30, blood: false, awayMin: 15, seconds: 60, group: 'Pencitraan' },
  { id: 'ct_kepala', label: 'CT-scan kepala non-kontras', kind: 'radiologi', turnaround: 12, blood: false, awayMin: 15, seconds: 60, group: 'Pencitraan' },
  { id: 'ct_abdomen', label: 'CT-scan abdomen-pelvis', kind: 'radiologi', turnaround: 25, blood: false, awayMin: 20, seconds: 60, group: 'Pencitraan' },
  { id: 'usg_obstetri', label: 'USG obstetri (dokter)', kind: 'bedside', turnaround: 0, blood: false, byDoctor: true, seconds: 300, group: 'Pencitraan' },
];

export const TESTS_BY_ID = new Map(TESTS.map((t) => [t.id, t]));

// ---------------------------------------------------------------------------
// Tindakan
// ---------------------------------------------------------------------------

export type ProcGroup = 'Airway' | 'Breathing' | 'Circulation' | 'Henti jantung' | 'Perdarahan & trauma' | 'Umum';

export interface ProcDef {
  id: ProcId;
  label: string;
  group: ProcGroup;
  performer: Performer;
  /** Lama tindakan (detik). */
  seconds: number;
  /** Tindakan berkelanjutan (mengikat satu petugas sampai dihentikan). */
  continuous?: boolean;
  /** Parameter yang harus dipilih. */
  params?: { label: string; options: { id: string; label: string }[] };
  /** Keterangan singkat (indikasi/cara). */
  hint: string;
}

export const PROCS: readonly ProcDef[] = [
  // --- Umum / monitor
  { id: 'monitor', label: 'Pasang monitor (EKG, SpO₂, NIBP)', group: 'Umum', performer: 'perawat', seconds: 60, hint: 'Tanda vital tampil terus-menerus + alarm.' },
  { id: 'ttv', label: 'Ukur tanda vital (manual)', group: 'Umum', performer: 'perawat', seconds: 120, hint: 'Satu kali pengukuran bila belum dipasang monitor.' },
  { id: 'iv', label: 'Pasang akses IV (kanul besar 18G)', group: 'Circulation', performer: 'perawat', seconds: 180, hint: 'Bisa dua jalur untuk syok/perdarahan.' },
  { id: 'io', label: 'Akses intraoseus', group: 'Circulation', performer: 'dokter', seconds: 90, hint: 'Bila IV gagal/sulit pada kegawatan (henti jantung, syok berat, anak).' },
  { id: 'ambil_darah', label: 'Ambil sampel darah', group: 'Umum', performer: 'perawat', seconds: 150, hint: 'Sampel untuk pemeriksaan lab berikutnya.' },
  {
    id: 'posisi',
    label: 'Atur posisi pasien',
    group: 'Umum',
    performer: 'perawat',
    seconds: 30,
    params: {
      label: 'Posisi',
      options: [
        { id: 'terlentang', label: 'Terlentang' },
        { id: 'semi_fowler', label: 'Setengah duduk (30–45°)' },
        { id: 'duduk', label: 'Duduk tegak' },
        { id: 'miring_kiri', label: 'Miring kiri (posisi mantap / kehamilan)' },
        { id: 'kaki_diangkat', label: 'Terlentang, tungkai diangkat' },
      ],
    },
    hint: 'Posisi memengaruhi jalan napas, napas, dan aliran balik vena.',
  },
  { id: 'kateter_urin', label: 'Pasang kateter urin', group: 'Umum', performer: 'perawat', seconds: 300, hint: 'Pantau produksi urin. Kontraindikasi: curiga cedera uretra.' },
  { id: 'ngt', label: 'Pasang NGT', group: 'Umum', performer: 'perawat', seconds: 300, hint: 'Dekompresi lambung/bilas. Hati-hati fraktur basis kranii.' },
  { id: 'selimut_hangat', label: 'Selimut hangat & cairan hangat', group: 'Umum', performer: 'perawat', seconds: 60, hint: 'Cegah hipotermia (bagian triad mematikan pada trauma).' },
  { id: 'dekontaminasi', label: 'Dekontaminasi (lepas pakaian, cuci kulit)', group: 'Umum', performer: 'perawat', seconds: 480, hint: 'Paparan racun pestisida/kimia. Petugas memakai APD.' },
  // --- Airway
  { id: 'manuver', label: 'Head tilt–chin lift / jaw thrust', group: 'Airway', performer: 'dokter', seconds: 15, hint: 'Membuka jalan napas atas (jaw thrust bila curiga cedera servikal).' },
  { id: 'suction', label: 'Suction orofaring', group: 'Airway', performer: 'perawat', seconds: 45, hint: 'Bersihkan darah, muntahan, sekret.' },
  { id: 'opa', label: 'Pasang OPA (Guedel)', group: 'Airway', performer: 'perawat', seconds: 30, hint: 'Hanya pada pasien tidak sadar tanpa refleks muntah.' },
  { id: 'npa', label: 'Pasang NPA', group: 'Airway', performer: 'perawat', seconds: 40, hint: 'Masih ada refleks muntah. Hindari pada curiga fraktur basis kranii.' },
  { id: 'heimlich', label: 'Back blows & abdominal/chest thrust', group: 'Airway', performer: 'dokter', seconds: 40, hint: 'Sumbatan benda asing total pada pasien sadar.' },
  { id: 'intubasi', label: 'Intubasi endotrakeal (RSI)', group: 'Airway', performer: 'dokter', seconds: 300, hint: 'Proteksi jalan napas (GCS ≤ 8, gagal napas, obstruksi mengancam). Termasuk obat induksi.' },
  { id: 'collar', label: 'Pasang collar servikal', group: 'Airway', performer: 'perawat', seconds: 60, hint: 'Pembatasan gerak tulang belakang pada trauma.' },
  // --- Breathing
  {
    id: 'oksigen',
    label: 'Terapi oksigen',
    group: 'Breathing',
    performer: 'perawat',
    seconds: 45,
    params: {
      label: 'Alat & aliran',
      options: [
        { id: 'udara', label: 'Hentikan O₂ (udara ruangan)' },
        { id: 'nasal:2', label: 'Kanul nasal 2 L/menit' },
        { id: 'nasal:4', label: 'Kanul nasal 4 L/menit' },
        { id: 'sungkup:6', label: 'Sungkup sederhana 6 L/menit' },
        { id: 'sungkup:10', label: 'Sungkup sederhana 10 L/menit' },
        { id: 'nrm:15', label: 'Non-rebreathing mask 15 L/menit' },
        { id: 'niv:10', label: 'CPAP/NIV (FiO₂ 0,6)' },
      ],
    },
    hint: 'Titrasi ke target SpO₂ (umumnya 94–98%; 88–92% bila risiko retensi CO₂).',
  },
  { id: 'bvm', label: 'Ventilasi bag-valve-mask', group: 'Breathing', performer: 'perawat', seconds: 30, continuous: true, hint: 'Napas tidak adekuat/apnea. Mengikat satu petugas.' },
  { id: 'ventilator', label: 'Sambung ventilator mekanik', group: 'Breathing', performer: 'dokter', seconds: 120, hint: 'Setelah intubasi. Membebaskan petugas dari bagging.' },
  {
    id: 'dekompresi_jarum',
    label: 'Dekompresi jarum (needle thoracostomy)',
    group: 'Breathing',
    performer: 'dokter',
    seconds: 60,
    params: { label: 'Sisi', options: [{ id: 'kanan', label: 'Kanan' }, { id: 'kiri', label: 'Kiri' }] },
    hint: 'Tension pneumotoraks: diagnosis klinis, jangan menunggu rontgen.',
  },
  {
    id: 'wsd',
    label: 'Pasang chest tube (WSD)',
    group: 'Breathing',
    performer: 'dokter',
    seconds: 600,
    params: { label: 'Sisi', options: [{ id: 'kanan', label: 'Kanan' }, { id: 'kiri', label: 'Kiri' }] },
    hint: 'Tatalaksana definitif pneumotoraks/hemotoraks.',
  },
  // --- Circulation & henti jantung
  { id: 'pad_defib', label: 'Pasang pad defibrilator', group: 'Henti jantung', performer: 'perawat', seconds: 40, hint: 'Analisis irama & siap kejut.' },
  { id: 'rjp', label: 'Mulai RJP (kompresi dada 100–120/menit)', group: 'Henti jantung', performer: 'perawat', seconds: 10, continuous: true, hint: 'Henti jantung. Mengikat satu petugas; berganti tiap 2 menit.' },
  { id: 'hentikan_rjp', label: 'Hentikan RJP / cek nadi', group: 'Henti jantung', performer: 'dokter', seconds: 10, hint: 'Cek irama & nadi tiap 2 menit (≤ 10 detik).' },
  {
    id: 'defibrilasi',
    label: 'Defibrilasi (tidak tersinkron)',
    group: 'Henti jantung',
    performer: 'dokter',
    seconds: 15,
    params: { label: 'Energi', options: [{ id: '50', label: '50 J' }, { id: '120', label: '120 J' }, { id: '150', label: '150 J' }, { id: '200', label: '200 J (bifasik)' }, { id: '360', label: '360 J (monofasik)' }] },
    hint: 'Hanya untuk VF/VT tanpa nadi.',
  },
  {
    id: 'kardioversi',
    label: 'Kardioversi tersinkron',
    group: 'Circulation',
    performer: 'dokter',
    seconds: 120,
    params: { label: 'Energi', options: [{ id: '50', label: '50 J' }, { id: '100', label: '100 J' }, { id: '120', label: '120 J' }, { id: '200', label: '200 J' }] },
    hint: 'Takiaritmia bernadi yang TIDAK stabil. Termasuk sedasi.',
  },
  {
    id: 'pacing',
    label: 'Pacu jantung transkutan',
    group: 'Circulation',
    performer: 'dokter',
    seconds: 180,
    params: { label: 'Laju', options: [{ id: '70', label: '70 x/menit' }, { id: '80', label: '80 x/menit' }, { id: '0', label: 'Hentikan pacu' }] },
    hint: 'Bradikardia tidak stabil yang tidak respons atropin.',
  },
  { id: 'vagal', label: 'Manuver vagal (Valsalva termodifikasi)', group: 'Circulation', performer: 'dokter', seconds: 60, hint: 'SVT stabil — sebelum adenosin.' },
  // --- Perdarahan & trauma
  { id: 'tekan_langsung', label: 'Tekan langsung / bebat tekan', group: 'Perdarahan & trauma', performer: 'perawat', seconds: 60, hint: 'Perdarahan eksternal.' },
  { id: 'torniket', label: 'Pasang torniket', group: 'Perdarahan & trauma', performer: 'dokter', seconds: 45, hint: 'Perdarahan ekstremitas yang tidak terkontrol dengan tekanan langsung. Catat jamnya.' },
  { id: 'pelvic_binder', label: 'Pasang pelvic binder', group: 'Perdarahan & trauma', performer: 'perawat', seconds: 120, hint: 'Curiga fraktur pelvis tidak stabil dengan syok.' },
  { id: 'bidai', label: 'Pasang bidai', group: 'Perdarahan & trauma', performer: 'perawat', seconds: 300, hint: 'Imobilisasi fraktur/dislokasi — kurangi nyeri & perdarahan.' },
  { id: 'masase_uterus', label: 'Masase uterus (fundus)', group: 'Perdarahan & trauma', performer: 'dokter', seconds: 60, hint: 'Atonia uteri pascapersalinan.' },
  { id: 'kompresi_bimanual', label: 'Kompresi bimanual interna/eksterna', group: 'Perdarahan & trauma', performer: 'dokter', seconds: 300, hint: 'Atonia yang belum teratasi uterotonika.' },
  { id: 'dinginkan_luka_bakar', label: 'Dinginkan luka bakar (air mengalir 20 menit)', group: 'Perdarahan & trauma', performer: 'perawat', seconds: 600, hint: 'Dalam 3 jam pertama; jaga agar tidak hipotermia.' },
  { id: 'rawat_luka', label: 'Irigasi & tutup luka', group: 'Perdarahan & trauma', performer: 'perawat', seconds: 420, hint: 'Bersihkan, irigasi, tutup kasa steril.' },
  { id: 'jahit_luka', label: 'Hecting (jahit luka) + anestesi lokal', group: 'Perdarahan & trauma', performer: 'dokter', seconds: 1200, hint: 'Luka bersih < 6–8 jam setelah irigasi.' },
  { id: 'nyatakan_meninggal', label: 'Hentikan resusitasi & nyatakan meninggal', group: 'Henti jantung', performer: 'dokter', seconds: 30, hint: 'Setelah resusitasi adekuat tanpa ROSC, atau tanda kematian pasti.' },
];

export const PROCS_BY_ID = new Map(PROCS.map((p) => [p.id, p]));

// ---------------------------------------------------------------------------
// Cairan & darah
// ---------------------------------------------------------------------------

export interface FluidDef {
  id: FluidId;
  label: string;
  /** Fraksi yang bertahan intravaskular. */
  retention: number;
  /** Gram glukosa per liter. */
  glucoseGPerL: number;
  /** Sel darah merah (PRC). */
  rbc: boolean;
  presets: number[];
}

export const FLUIDS: readonly FluidDef[] = [
  { id: 'nacl', label: 'NaCl 0,9%', retention: 0.3, glucoseGPerL: 0, rbc: false, presets: [250, 500, 1000] },
  { id: 'rl', label: 'Ringer laktat', retention: 0.3, glucoseGPerL: 0, rbc: false, presets: [250, 500, 1000] },
  { id: 'koloid', label: 'Koloid (gelatin)', retention: 0.75, glucoseGPerL: 0, rbc: false, presets: [250, 500] },
  { id: 'prc', label: 'PRC (packed red cells)', retention: 1, glucoseGPerL: 0, rbc: true, presets: [250, 500] },
  { id: 'd10', label: 'Dekstrosa 10%', retention: 0.2, glucoseGPerL: 100, rbc: false, presets: [250, 500] },
  { id: 'd5', label: 'Dekstrosa 5%', retention: 0.15, glucoseGPerL: 50, rbc: false, presets: [500] },
];

export const FLUIDS_BY_ID = new Map(FLUIDS.map((f) => [f.id, f]));

// ---------------------------------------------------------------------------
// Konsulen & disposisi
// ---------------------------------------------------------------------------

export const SPECIALTIES: readonly { id: Specialty; label: string; responseMin: [number, number] }[] = [
  { id: 'jantung', label: 'Sp.JP (jantung & pembuluh darah)', responseMin: [8, 15] },
  { id: 'bedah', label: 'Sp.B (bedah umum)', responseMin: [10, 20] },
  { id: 'bedah_saraf', label: 'Sp.BS (bedah saraf)', responseMin: [10, 20] },
  { id: 'saraf', label: 'Sp.N (neurologi)', responseMin: [8, 15] },
  { id: 'penyakit_dalam', label: 'Sp.PD (penyakit dalam)', responseMin: [10, 20] },
  { id: 'obgin', label: 'Sp.OG (obstetri & ginekologi)', responseMin: [8, 15] },
  { id: 'anak', label: 'Sp.A (anak)', responseMin: [10, 20] },
  { id: 'anestesi', label: 'Sp.An (anestesi/ICU)', responseMin: [8, 15] },
  { id: 'ortopedi', label: 'Sp.OT (ortopedi)', responseMin: [15, 25] },
  { id: 'paru', label: 'Sp.P (paru)', responseMin: [10, 20] },
  { id: 'bedah_plastik', label: 'Sp.BP-RE (luka bakar)', responseMin: [15, 25] },
];

export const SPECIALTIES_BY_ID = new Map(SPECIALTIES.map((s) => [s.id, s]));

export const DISPOSITIONS: readonly { id: Disposition; label: string; needsConsult: boolean; leaveMin: number }[] = [
  { id: 'pulang', label: 'Pulang (rawat jalan) + edukasi', needsConsult: false, leaveMin: 5 },
  { id: 'bangsal', label: 'Rawat inap bangsal', needsConsult: true, leaveMin: 15 },
  { id: 'hcu_icu', label: 'HCU / ICU', needsConsult: true, leaveMin: 15 },
  { id: 'kamar_operasi', label: 'Kamar operasi', needsConsult: true, leaveMin: 10 },
  { id: 'kateterisasi', label: 'Laboratorium kateterisasi (PCI)', needsConsult: true, leaveMin: 10 },
  { id: 'rujuk', label: 'Rujuk ke RS lain', needsConsult: false, leaveMin: 20 },
  { id: 'meninggal', label: 'Meninggal (ke kamar jenazah)', needsConsult: false, leaveMin: 10 },
];

export const DISPOSITIONS_BY_ID = new Map(DISPOSITIONS.map((d) => [d.id, d]));

// ---------------------------------------------------------------------------
// Diagnosis kerja IGD
// ---------------------------------------------------------------------------

export interface EdDiagnosis {
  id: string;
  name: string;
  group: string;
  aliases?: string[];
}

export const ED_DIAGNOSES: readonly EdDiagnosis[] = [
  // Pernapasan
  { id: 'asma_berat', name: 'Asma eksaserbasi berat', group: 'Pernapasan', aliases: ['serangan asma', 'status asmatikus'] },
  { id: 'asma_ringan', name: 'Asma eksaserbasi ringan–sedang', group: 'Pernapasan' },
  { id: 'ppok_eksaserbasi', name: 'PPOK eksaserbasi akut', group: 'Pernapasan' },
  { id: 'pneumonia', name: 'Pneumonia komunitas', group: 'Pernapasan' },
  { id: 'edema_paru', name: 'Edema paru akut kardiogenik', group: 'Pernapasan', aliases: ['APE', 'gagal jantung akut'] },
  { id: 'tension_pneumotoraks', name: 'Tension pneumotoraks', group: 'Pernapasan' },
  { id: 'pneumotoraks', name: 'Pneumotoraks sederhana', group: 'Pernapasan' },
  { id: 'hemotoraks', name: 'Hemotoraks masif', group: 'Pernapasan' },
  { id: 'emboli_paru', name: 'Emboli paru', group: 'Pernapasan' },
  { id: 'benda_asing_jalan_napas', name: 'Sumbatan jalan napas oleh benda asing', group: 'Pernapasan', aliases: ['tersedak'] },
  { id: 'trauma_inhalasi', name: 'Trauma inhalasi', group: 'Pernapasan' },
  { id: 'hiperventilasi', name: 'Sindrom hiperventilasi / serangan panik', group: 'Pernapasan', aliases: ['panik'] },
  // Jantung
  { id: 'stemi', name: 'STEMI (infark miokard akut dengan elevasi ST)', group: 'Jantung', aliases: ['serangan jantung', 'IMA'] },
  { id: 'nstemi', name: 'NSTEMI / angina tidak stabil', group: 'Jantung' },
  { id: 'svt', name: 'Takikardia supraventrikular (SVT)', group: 'Jantung' },
  { id: 'af_rvr', name: 'Fibrilasi atrium respons cepat', group: 'Jantung' },
  { id: 'vt', name: 'Takikardia ventrikel', group: 'Jantung' },
  { id: 'av_blok_total', name: 'AV blok total (blok jantung derajat III)', group: 'Jantung' },
  { id: 'henti_jantung', name: 'Henti jantung (VF/VT tanpa nadi)', group: 'Jantung', aliases: ['cardiac arrest'] },
  { id: 'henti_jantung_non_shockable', name: 'Henti jantung (PEA/asistol)', group: 'Jantung' },
  { id: 'syok_kardiogenik', name: 'Syok kardiogenik', group: 'Jantung' },
  { id: 'diseksi_aorta', name: 'Diseksi aorta', group: 'Jantung' },
  { id: 'krisis_hipertensi', name: 'Krisis hipertensi (emergensi)', group: 'Jantung' },
  { id: 'tamponade', name: 'Tamponade jantung', group: 'Jantung' },
  // Neurologi
  { id: 'stroke_iskemik', name: 'Stroke iskemik akut', group: 'Neurologi' },
  { id: 'stroke_perdarahan', name: 'Stroke perdarahan intraserebral', group: 'Neurologi', aliases: ['ICH', 'stroke hemoragik'] },
  { id: 'perdarahan_subaraknoid', name: 'Perdarahan subaraknoid', group: 'Neurologi' },
  { id: 'status_epileptikus', name: 'Status epileptikus', group: 'Neurologi' },
  { id: 'kejang_demam', name: 'Kejang demam', group: 'Neurologi' },
  { id: 'meningitis', name: 'Meningitis/ensefalitis', group: 'Neurologi' },
  { id: 'cedera_kepala_berat', name: 'Cedera kepala berat (perdarahan intrakranial)', group: 'Neurologi', aliases: ['EDH', 'SDH', 'COB'] },
  { id: 'cedera_kepala_ringan', name: 'Cedera kepala ringan', group: 'Neurologi' },
  { id: 'sinkop', name: 'Sinkop vasovagal', group: 'Neurologi' },
  // Metabolik
  { id: 'hipoglikemia', name: 'Hipoglikemia', group: 'Metabolik' },
  { id: 'kad', name: 'Ketoasidosis diabetik (KAD)', group: 'Metabolik' },
  { id: 'shh', name: 'Status hiperglikemik hiperosmolar', group: 'Metabolik' },
  { id: 'hipokalemia', name: 'Hipokalemia berat', group: 'Metabolik' },
  { id: 'hiperkalemia', name: 'Hiperkalemia', group: 'Metabolik' },
  // Toksikologi
  { id: 'intoksikasi_opioid', name: 'Intoksikasi opioid', group: 'Toksikologi' },
  { id: 'keracunan_organofosfat', name: 'Keracunan organofosfat', group: 'Toksikologi' },
  { id: 'intoksikasi_alkohol', name: 'Intoksikasi alkohol/metanol', group: 'Toksikologi' },
  { id: 'intoksikasi_benzodiazepin', name: 'Intoksikasi benzodiazepin/sedatif', group: 'Toksikologi' },
  // Syok & infeksi
  { id: 'syok_septik', name: 'Syok septik', group: 'Syok & infeksi' },
  { id: 'sepsis', name: 'Sepsis tanpa syok', group: 'Syok & infeksi' },
  { id: 'anafilaksis', name: 'Anafilaksis / syok anafilaktik', group: 'Syok & infeksi' },
  { id: 'syok_hipovolemik', name: 'Syok hipovolemik (non-perdarahan)', group: 'Syok & infeksi' },
  { id: 'dss', name: 'Dengue shock syndrome', group: 'Syok & infeksi', aliases: ['DBD derajat III', 'sindrom syok dengue'] },
  { id: 'dbd', name: 'Demam berdarah dengue tanpa syok', group: 'Syok & infeksi' },
  { id: 'dehidrasi_berat', name: 'Diare akut dengan dehidrasi berat', group: 'Syok & infeksi' },
  { id: 'gastroenteritis', name: 'Gastroenteritis akut tanpa dehidrasi berat', group: 'Syok & infeksi' },
  { id: 'urtikaria', name: 'Urtikaria akut tanpa anafilaksis', group: 'Syok & infeksi' },
  // Trauma & perdarahan
  { id: 'syok_hemoragik', name: 'Syok hemoragik', group: 'Trauma & perdarahan' },
  { id: 'fraktur_pelvis', name: 'Fraktur pelvis tidak stabil', group: 'Trauma & perdarahan' },
  { id: 'fraktur_femur', name: 'Fraktur femur', group: 'Trauma & perdarahan' },
  { id: 'trauma_abdomen', name: 'Trauma tumpul abdomen dengan perdarahan intraabdomen', group: 'Trauma & perdarahan' },
  { id: 'cedera_servikal', name: 'Cedera tulang servikal', group: 'Trauma & perdarahan' },
  { id: 'perdarahan_arteri', name: 'Perdarahan arteri ekstremitas', group: 'Trauma & perdarahan', aliases: ['luka bacok'] },
  { id: 'luka_bakar', name: 'Luka bakar luas (derajat II–III)', group: 'Trauma & perdarahan' },
  { id: 'vulnus', name: 'Vulnus laceratum (luka robek)', group: 'Trauma & perdarahan' },
  { id: 'sprain', name: 'Sprain/strain pergelangan kaki', group: 'Trauma & perdarahan' },
  { id: 'fraktur_ankle', name: 'Fraktur pergelangan kaki', group: 'Trauma & perdarahan' },
  { id: 'perdarahan_scba', name: 'Perdarahan saluran cerna atas', group: 'Trauma & perdarahan', aliases: ['hematemesis melena'] },
  { id: 'varises_esofagus', name: 'Pecah varises esofagus (sirosis)', group: 'Trauma & perdarahan' },
  { id: 'tukak_peptik', name: 'Tukak peptik berdarah', group: 'Trauma & perdarahan' },
  // Obstetri
  { id: 'eklampsia', name: 'Eklampsia', group: 'Obstetri' },
  { id: 'preeklampsia_berat', name: 'Preeklampsia berat', group: 'Obstetri' },
  { id: 'hpp_atonia', name: 'Perdarahan pascapersalinan (atonia uteri)', group: 'Obstetri' },
  { id: 'hpp_robekan', name: 'Perdarahan pascapersalinan (robekan jalan lahir)', group: 'Obstetri' },
  { id: 'kehamilan_ektopik', name: 'Kehamilan ektopik terganggu', group: 'Obstetri' },
  // Lain-lain
  { id: 'kolik_renal', name: 'Kolik renal (batu saluran kemih)', group: 'Lain-lain' },
  { id: 'apendisitis', name: 'Apendisitis akut', group: 'Lain-lain' },
  { id: 'faringitis', name: 'Faringitis akut', group: 'Lain-lain' },
  { id: 'migren', name: 'Migren/nyeri kepala primer', group: 'Lain-lain' },
  { id: 'gerd', name: 'GERD/dispepsia', group: 'Lain-lain' },
  { id: 'nyeri_dada_muskuloskeletal', name: 'Nyeri dada muskuloskeletal', group: 'Lain-lain' },
];

export const ED_DIAGNOSES_BY_ID = new Map(ED_DIAGNOSES.map((d) => [d.id, d]));

// ---------------------------------------------------------------------------
// Konfigurasi shift
// ---------------------------------------------------------------------------

export const DEFAULT_BEDS: readonly BedDef[] = [
  { id: 'R1', label: 'Resusitasi 1', kind: 'resusitasi' },
  { id: 'R2', label: 'Resusitasi 2', kind: 'resusitasi' },
  { id: 'A1', label: 'Bed akut 1', kind: 'akut' },
  { id: 'A2', label: 'Bed akut 2', kind: 'akut' },
  { id: 'A3', label: 'Bed akut 3', kind: 'akut' },
  { id: 'K1', label: 'Kursi observasi 1', kind: 'kursi' },
  { id: 'K2', label: 'Kursi observasi 2', kind: 'kursi' },
];

/** Target waktu tunggu maksimal per kategori ATS (menit). */
export const ATS_TARGET_MIN: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 10, 3: 30, 4: 60, 5: 120 };

export const ATS_LABEL: Record<1 | 2 | 3 | 4 | 5, { name: string; color: string; desc: string }> = {
  1: { name: 'ATS 1 — Resusitasi', color: 'merah', desc: 'Ancaman nyawa segera (henti jantung/napas, syok berat, GCS < 9, kejang berlangsung).' },
  2: { name: 'ATS 2 — Emergensi', color: 'oranye', desc: 'Ancaman nyawa dalam ≤ 10 menit (gangguan napas berat, nyeri dada iskemik, stroke dalam jendela terapi, syok).' },
  3: { name: 'ATS 3 — Urgen', color: 'kuning', desc: 'Berpotensi mengancam (hipertensi berat, nyeri sedang-berat, dehidrasi sedang) — ≤ 30 menit.' },
  4: { name: 'ATS 4 — Semi-urgen', color: 'hijau', desc: 'Kondisi akut tidak berat (cedera ringan, nyeri ringan) — ≤ 60 menit.' },
  5: { name: 'ATS 5 — Tidak urgen', color: 'biru', desc: 'Keluhan minor/kronik — ≤ 120 menit.' },
};
