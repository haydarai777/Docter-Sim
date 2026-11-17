/**
 * Skenario IGD — trauma (ATLS).
 * ⚠ BELUM DITINJAU DOKTER. Rujukan pedoman: lihat field debrief.referensi & docs/igd.md.
 */
import type { EdPatient, EdScenario } from '../../../core/igd/types';
import { alive, any, at, call, consult, dispo, doProc, drug, dx, ex, fluidMl, give, infuse, ivAgain, o2, OPIOID, order, oxygenated, perfused, primary, proc, still, test, triage } from '../helpers';

const crystalloidPerKg = (pt: EdPatient) => ((pt.fluidsMl.nacl ?? 0) + (pt.fluidsMl.rl ?? 0)) / pt.weightKg;

export const TENSION_PNEUMOTORAKS: EdScenario = {
  id: 'tension_pneumotoraks',
  title: 'Tension pneumotoraks pascatrauma dada',
  category: 'trauma',
  difficulty: 2,
  ats: 1,
  patient: { sex: 'male', age: [18, 42] },
  arrival: {
    mode: 'brankar',
    by: 'ambulans',
    complaint: 'Kecelakaan motor, dada kanan membentur stang; sesak makin berat dalam perjalanan.',
    mechanism: 'Pengendara motor menabrak pembatas jalan ± 40 km/jam, dada kanan membentur stang.',
    prehospital: 'Collar servikal, O₂ NRM 15 L/menit. Belum ada akses IV.',
    devices: { collar: true, oxygen: 'nrm', flow: 15 },
  },
  physio: { v: { obstruction: 0.42, ptx: 0.5, pain: 0.6, anxiety: 0.65, volume: 0.95, rbc: 0.95 }, rate: { obstruction: 0.021 }, chestSide: 'kanan' },
  informants: {
    paramedis: {
      label: 'Paramedis ambulans',
      opening: 'Dok, laki-laki, pengendara motor menabrak pembatas jalan, dada kanan kena stang. Saat ditemukan sadar, sesak, nadi 120, SpO₂ 90 dengan NRM. Dalam perjalanan makin sesak. Collar terpasang, belum ada infus.',
      topics: { kejadian: 'Motor menabrak pembatas jalan sekitar 40 km/jam, dada kanan membentur stang, sempat terlempar.', riwayat_penyakit: 'Menurut temannya sehat.', alergi: 'Tidak diketahui.' },
    },
    pasien: {
      topics: { keluhan_utama: 'Sesak… dada kanan sakit…', kejadian: 'Nabrak pembatas… dada kena stang.', alergi: 'Tidak ada.', riwayat_obat: 'Tidak ada.', makan_terakhir: 'Sore tadi.' },
      symptoms: { sesak_napas: 'Sesak sekali…', nyeri_dada: 'Dada kanan sakit… kalau napas.' },
    },
  },
  findings: { E: 'Jejas & krepitasi kulit (emfisema subkutis) di dinding dada kanan; ekskoriasi lengan kanan.', kepala_leher: 'Emfisema subkutis di leher kanan.' },
  tests: { darah_lengkap: { extra: '' } },
  diagnosis: { primary: ['tension_pneumotoraks'], acceptable: ['pneumotoraks'] },
  critical: [
    { id: 'dekompresi', label: 'Dekompresi jarum dada KANAN segera (diagnosis klinis)', match: proc('dekompresi_jarum', 'kanan'), byMin: 5, weight: 7, why: 'Tension pneumotoraks: syok obstruktif — dekompresi tanpa menunggu rontgen.' },
    { id: 'wsd', label: 'Chest tube (WSD) kanan', match: proc('wsd', 'kanan'), byMin: 30, weight: 3, why: 'Tatalaksana definitif setelah dekompresi.' },
    { id: 'o2', label: 'Oksigen aliran tinggi', match: o2(0.5), byMin: 5, weight: 1, why: 'Hipoksemia.' },
    { id: 'iv', label: 'Akses IV & sampel darah', match: proc('iv'), byMin: 15, weight: 1, why: 'Trauma mayor.' },
  ],
  indicatedTests: ['rontgen_thorax', 'fast', 'darah_lengkap', 'crossmatch'],
  optionalTests: ['agd', 'ekg', 'rontgen_pelvis'],
  indicatedDrugs: ['fentanil', 'morfin', 'sefazolin', 'tetanus'],
  harmful: [
    { id: 'rontgen_dulu', label: 'Menunggu rontgen sebelum dekompresi', match: test('rontgen_thorax'), when: (c) => !c.done(proc('dekompresi_jarum')) && !c.done(proc('wsd')), severity: 'berat', why: 'Tension pneumotoraks adalah diagnosis KLINIS; rontgen menunda tindakan penyelamatan.' },
  ],
  stable: (v, p) => alive(v, p) && perfused(v) && oxygenated(v, 94) && p.v.obstruction < 0.2,
  disposition: { best: ['bangsal', 'hcu_icu'], consult: ['bedah'] },
  expert: [
    at(0, triage(1, 'R1')),
    at(0.2, ex('A')),
    at(0.5, ex('B')),
    at(1.3, doProc('dekompresi_jarum', 'kanan')),
    at(2.5, ex('C')),
    at(2.6, doProc('monitor')),
    at(2.7, doProc('iv')),
    at(3.4, ex('D')),
    at(3.6, ex('E')),
    ivAgain(7),
    at(7.5, give('fentanil', 'iv', 50)),
    at(8, doProc('wsd', 'kanan')),
    at(19, order('rontgen_thorax')),
    at(19.5, order('darah_lengkap')),
    at(19.6, order('crossmatch')),
    at(20, call('bedah')),
    at(21, dx('tension_pneumotoraks')),
    at(45, dispo('bangsal')),
  ],
  debrief: {
    ringkasan: 'Tension pneumotoraks: udara terperangkap di rongga pleura menekan mediastinum → aliran balik vena turun → syok obstruktif. Tanda: sesak berat, suara napas hilang sesisi, hipersonor, deviasi trakea, distensi vena leher, hipotensi.',
    tatalaksana: [
      'Survei primer; O₂ aliran tinggi.',
      'Dekompresi jarum segera (dewasa: sela iga 4–5 linea aksilaris anterior/media; alternatif sela iga 2 linea midklavikula) — diagnosis klinis, JANGAN menunggu rontgen.',
      'Lanjutkan chest tube (WSD) di sela iga 5 anterior linea aksilaris media.',
      'Akses IV, analgesia, rontgen thorax setelah WSD, eFAST, konsul bedah.',
    ],
    jebakan: ['Menunggu rontgen thorax untuk konfirmasi.', 'Dekompresi di sisi yang salah.'],
    referensi: ['ATLS® 10th Edition (American College of Surgeons, 2018) — Chapter 4: Thoracic Trauma', 'ERC Guidelines 2021 — Cardiac arrest in special circumstances (traumatic cardiac arrest)'],
  },
};

export const MULTITRAUMA: EdScenario = {
  id: 'multitrauma_syok_hemoragik',
  title: 'Multitrauma dengan syok hemoragik (fraktur pelvis & femur)',
  category: 'trauma',
  difficulty: 3,
  ats: 1,
  patient: { sex: 'acak', age: [20, 48] },
  arrival: {
    mode: 'brankar',
    by: 'ambulans',
    complaint: 'Pejalan kaki ditabrak mobil, terlempar ± 5 meter; nyeri panggul & paha kanan, makin pucat.',
    mechanism: 'Ditabrak mobil berkecepatan tinggi, terlempar ± 5 m.',
    prehospital: 'Collar servikal, O₂ NRM. Belum ada akses IV. Nadi 124, TD 96/70 di lokasi.',
    devices: { collar: true, oxygen: 'nrm', flow: 15 },
  },
  physio: { v: { volume: 0.72, rbc: 0.72, pain: 0.8, anxiety: 0.6, temp: 35.9 } },
  step: (pt, dtMin, now) => {
    const p = pt.physio;
    const d = pt.devices;
    const pelvic = 0.0062 * (d.binder ? 0.3 : 1);
    const femur = 0.0026 * (d.splint ? 0.5 : 1);
    const dilution = 1 + (0.3 * Math.max(0, crystalloidPerKg(pt) - 30)) / 30;
    const cold = p.v.temp < 35.5 ? 1.15 : 1;
    const elapsed = (now - pt.arriveAt) / 60;
    p.v.bleed = (pelvic + femur) * (p.doses.txa ? 0.75 : 1) * dilution * cold * Math.max(0.55, 1 - elapsed * 0.004);
    if (!d.warmed) p.v.temp -= 0.008 * dtMin;
  },
  informants: {
    paramedis: {
      label: 'Paramedis ambulans',
      opening: 'Dok, pejalan kaki ditabrak mobil kencang, terlempar lima meter. Sadar, mengeluh nyeri panggul dan paha kanan. Di lokasi nadi 124, TD 96/70. Collar & NRM terpasang, belum infus.',
      topics: { kejadian: 'Menyeberang jalan, ditabrak mobil kecepatan tinggi, terlempar ± 5 meter.', riwayat_penyakit: 'Tidak diketahui.', alergi: 'Tidak diketahui.' },
    },
    pasien: {
      topics: { keluhan_utama: 'Panggul dan paha kanan sakit sekali, Dok… dingin…', alergi: 'Tidak ada alergi.', riwayat_obat: 'Tidak minum obat apa-apa.', makan_terakhir: 'Siang tadi.', riwayat_penyakit: 'Sehat, Dok.' },
      symptoms: { nyeri_otot_sendi: 'Panggul sakit sekali.', sesak_napas: 'Tidak terlalu.', nyeri_perut: 'Perut bawah sakit.' },
    },
  },
  findings: {
    pelvis_ekstremitas: 'Pelvis tidak stabil & nyeri pada kompresi (cukup sekali); paha kanan bengkak, deformitas, memendek & rotasi eksternal (curiga fraktur femur tertutup); nadi distal kanan teraba.',
    abdomen: 'Jejas di perut bawah, nyeri tekan suprapubik, distensi minimal.',
    E: 'Ekskoriasi multipel di lengan & wajah; hematoma di perineum.',
  },
  tests: {
    rontgen_pelvis: { text: 'Fraktur open-book: diastasis simfisis pubis 4 cm + fraktur ramus pubis kanan.' },
    rontgen_ekstremitas: { text: 'Fraktur femur kanan 1/3 tengah, displaced.' },
    fast: { text: 'Cairan bebas minimal di kavum pelvis; Morison & splenorenal (−); perikardium normal; lung sliding +/+.' },
    rontgen_thorax: { text: 'Cor & pulmo dalam batas normal, tidak tampak pneumotoraks/hemotoraks.' },
    ct_abdomen: { text: 'Hematoma pelvis luas dengan ekstravasasi kontras dari cabang a. iliaka interna kanan.' },
  },
  diagnosis: { primary: ['syok_hemoragik', 'fraktur_pelvis'], secondary: ['fraktur_femur', 'fraktur_pelvis'] },
  critical: [
    { id: 'iv2', label: 'Dua akses IV kanul besar', match: proc('iv'), byMin: 10, weight: 1, why: 'Resusitasi cairan & darah.' },
    { id: 'binder', label: 'Pelvic binder (curiga fraktur pelvis tidak stabil)', match: proc('pelvic_binder'), byMin: 15, weight: 5, why: 'Menutup volume pelvis & menekan perdarahan vena.' },
    { id: 'darah', label: 'Transfusi PRC (syok kelas III)', match: fluidMl(250, ['prc']), byMin: 30, weight: 4, why: 'ATLS: kristaloid dibatasi (± 1 L), segera darah pada syok kelas III–IV.' },
    { id: 'txa', label: 'Asam traneksamat 1 g ≤ 3 jam', match: drug('asam_traneksamat', { dose: [1000, 1000] }), byMin: 30, weight: 3, why: 'CRASH-2: menurunkan kematian akibat perdarahan bila diberikan ≤ 3 jam.' },
    { id: 'fast', label: 'eFAST', match: test('fast'), byMin: 20, weight: 1, why: 'Cari sumber perdarahan torakoabdominal.' },
    { id: 'hangat', label: 'Cegah hipotermia (selimut & cairan hangat)', match: proc('selimut_hangat'), byMin: 30, weight: 1, why: 'Triad mematikan: hipotermia, asidosis, koagulopati.' },
    { id: 'bidai', label: 'Bidai/traksi femur', match: proc('bidai'), byMin: 30, weight: 1, why: 'Mengurangi perdarahan & nyeri fraktur femur.' },
    { id: 'konsul', label: 'Konsul Sp.B/Sp.OT — kontrol perdarahan definitif', match: any(consult('bedah'), consult('ortopedi')), byMin: 30, weight: 3, why: 'Butuh fiksasi pelvis/angioembolisasi/operasi.' },
  ],
  indicatedTests: ['fast', 'rontgen_pelvis', 'rontgen_thorax', 'darah_lengkap', 'crossmatch', 'agd'],
  optionalTests: ['koagulasi', 'laktat', 'rontgen_ekstremitas', 'elektrolit', 'fungsi_ginjal'],
  indicatedDrugs: ['asam_traneksamat', 'fentanil', 'morfin', 'tetanus'],
  harmful: [
    { id: 'kateter_trauma', label: 'Kateter urin pada curiga cedera uretra', match: proc('kateter_urin'), severity: 'sedang', why: 'Hematoma perineum & fraktur pelvis → curiga ruptur uretra; kateter dikontraindikasikan sebelum uretrografi.' },
  ],
  stable: (v, p) => alive(v, p) && perfused(v) && v.hr <= 125 && oxygenated(v, 94) && p.v.bleed < 0.004,
  disposition: { best: ['kamar_operasi'], acceptable: ['hcu_icu'], consult: ['bedah', 'ortopedi'] },
  expert: [
    at(0, triage(1, 'R1')),
    ...primary(0.2),
    at(1, doProc('iv')),
    at(1.1, doProc('iv')),
    at(1.2, doProc('monitor')),
    at(1.4, doProc('pelvic_binder')),
    at(2, { type: 'periksa', exam: 'pelvis_ekstremitas' }),
    at(3.5, order('crossmatch')),
    at(3.6, order('darah_lengkap')),
    ivAgain(6),
    at(6.5, infuse('rl', 1000, 15)),
    at(7, give('asam_traneksamat', 'iv', 1000)),
    at(7.5, doProc('selimut_hangat')),
    at(8, order('fast')),
    at(13.5, infuse('prc', 500, 20)),
    at(14, doProc('bidai')),
    at(15, call('bedah')),
    at(15.5, call('ortopedi')),
    at(16, give('fentanil', 'iv', 50)),
    at(17, order('rontgen_pelvis')),
    at(17.5, order('rontgen_thorax')),
    at(30, infuse('prc', 500, 20)),
    at(32, dx('syok_hemoragik', 'fraktur_pelvis', 'fraktur_femur')),
    at(45, infuse('prc', 500, 20), still((v) => (v.sbp ?? 0) < 100 || v.hr > 110)),
    at(50, dispo('kamar_operasi')),
  ],
  debrief: {
    ringkasan: 'Syok hemoragik kelas III (takikardia > 120, TD menurun, gelisah) akibat fraktur pelvis tidak stabil & fraktur femur — perdarahan retroperitoneal yang tidak terlihat. Kunci: kenali syok, kontrol perdarahan, darah lebih awal, cegah triad mematikan.',
    tatalaksana: [
      'Survei primer dengan kontrol perdarahan: dua kanul besar, sampel darah & crossmatch.',
      'Pelvic binder setinggi trokanter mayor bila curiga fraktur pelvis tidak stabil.',
      'Kristaloid hangat dibatasi (± 1 L dewasa), segera PRC (rasio darah:plasma:trombosit bila protokol transfusi masif); target hipotensi permisif TDS ± 90 (bukan pada cedera kepala).',
      'Asam traneksamat 1 g IV ≤ 3 jam, lanjut 1 g dalam 8 jam.',
      'eFAST, rontgen thorax & pelvis portabel; JANGAN ke CT bila tidak stabil.',
      'Bidai femur, analgesia, cegah hipotermia; konsul bedah/ortopedi untuk fiksasi eksternal/angioembolisasi/packing preperitoneal.',
    ],
    jebakan: ['Memberi kristaloid berliter-liter (koagulopati dilusi).', 'Mengirim pasien syok ke CT.', 'Menggoyang pelvis berulang kali.', 'Memasang kateter urin padahal ada hematoma perineum.'],
    referensi: ['ATLS® 10th Edition (2018) — Chapter 3: Shock; Chapter 5: Abdominal & Pelvic Trauma', 'CRASH-2 trial (Lancet 2010)', 'European guideline on management of major bleeding and coagulopathy following trauma, 6th ed. (Rossaint et al., Crit Care 2023)'],
  },
};

export const CEDERA_KEPALA_BERAT: EdScenario = {
  id: 'cedera_kepala_berat',
  title: 'Cedera kepala berat dengan perdarahan epidural',
  category: 'trauma',
  difficulty: 3,
  ats: 1,
  patient: { sex: 'male', age: [17, 45] },
  arrival: {
    mode: 'brankar',
    by: 'ambulans',
    complaint: 'Jatuh dari motor tanpa helm, kepala membentur aspal; sempat sadar ± 10 menit, lalu muntah dan makin tidak sadar.',
    mechanism: 'Jatuh dari motor tanpa helm, kepala kanan membentur aspal.',
    prehospital: 'Collar servikal, O₂ sungkup 8 L/menit.',
    devices: { collar: true, oxygen: 'sungkup', flow: 8 },
  },
  physio: { v: { icp: 0.6, hypertension: 0.3, pain: 0.3, temp: 36.6 }, rate: { icp: 0.0085 }, brainSide: 'kanan', airwayCause: 'sekret' },
  step: (pt) => {
    const p = pt.physio;
    const d = pt.devices;
    // Kepala ditinggikan & ventilasi terkontrol memperlambat kenaikan TIK.
    let rate = 0.0085;
    if (d.position === 'semi_fowler') rate *= 0.85;
    if (d.assist === 'ventilator') rate *= 0.85;
    p.rate.icp = rate;
  },
  informants: {
    paramedis: {
      label: 'Paramedis ambulans',
      opening: 'Dok, laki-laki jatuh dari motor tanpa helm. Kata saksi sempat bangun dan bicara sekitar 10 menit, lalu muntah dan makin tidak sadar. GCS di lokasi 10, sekarang menurun. Collar & O₂ terpasang.',
      topics: { kejadian: 'Jatuh sendiri dari motor, kepala kanan membentur aspal, tidak pakai helm.', riwayat_penyakit: 'Tidak diketahui.', alergi: 'Tidak diketahui.', makan_terakhir: 'Tidak diketahui.' },
    },
    saksi: { label: 'Saksi (warga)', topics: { kejadian: 'Motornya oleng lalu jatuh, kepalanya kena aspal. Sempat bangun, bilang pusing, terus muntah dan tidur lagi.' } },
  },
  findings: {
    kepala_leher: 'Hematoma & laserasi temporoparietal kanan 4 cm; hematoma periorbita bilateral (racoon eyes); otorea (−).',
    E: 'Ekskoriasi bahu & lengan kanan.',
  },
  tests: {
    ct_kepala: { text: 'Perdarahan epidural (bikonveks) temporoparietal kanan ± 45 ml, pergeseran garis tengah 7 mm ke kiri, fraktur linear temporal kanan; basis kranii dengan fraktur anterior.' },
  },
  diagnosis: { primary: ['cedera_kepala_berat'] },
  critical: [
    { id: 'jalan_napas', label: 'Jaw thrust/suction (proteksi servikal)', match: any(proc('manuver'), proc('suction')), byMin: 3, weight: 2, why: 'GCS rendah dengan muntahan — cegah aspirasi & hipoksia.' },
    { id: 'intubasi', label: 'Intubasi (GCS ≤ 8)', match: proc('intubasi'), byMin: 15, weight: 4, why: 'Proteksi jalan napas; hindari hipoksia (SpO₂ > 94%) & hiperkapnia.' },
    { id: 'osmo', label: 'Terapi osmotik (manitol 0,5–1 g/kg / NaCl 3%) — tanda herniasi', match: any(drug('manitol'), drug('nacl3')), byMin: 25, weight: 3, why: 'Anisokor + penurunan kesadaran = herniasi transtentorial.' },
    { id: 'ct', label: 'CT kepala segera setelah stabil', match: test('ct_kepala'), byMin: 30, weight: 3, why: 'Lesi massa yang butuh evakuasi.' },
    { id: 'konsul', label: 'Konsul Sp.BS (evakuasi hematoma)', match: consult('bedah_saraf'), byMin: 30, weight: 4, why: 'EDH dengan pergeseran garis tengah = operasi segera.' },
    { id: 'posisi', label: 'Elevasi kepala 30°', match: proc('posisi', 'semi_fowler'), byMin: 20, weight: 1, why: 'Menurunkan TIK.' },
  ],
  indicatedTests: ['ct_kepala', 'gds', 'darah_lengkap', 'agd', 'koagulasi', 'crossmatch'],
  optionalTests: ['rontgen_thorax', 'elektrolit', 'fast'],
  indicatedDrugs: ['manitol', 'nacl3', 'fentanil', 'tetanus', 'parasetamol'],
  harmful: [
    { id: 'steroid_tbi', label: 'Kortikosteroid pada cedera kepala', match: any(drug('deksametason'), drug('metilprednisolon'), drug('hidrokortison')), severity: 'sedang', why: 'CRASH trial: steroid meningkatkan kematian pada cedera kepala.' },
    { id: 'npa_basis', label: 'NPA/NGT pada curiga fraktur basis kranii', match: any(proc('npa'), proc('ngt')), severity: 'sedang', why: 'Racoon eyes = fraktur basis kranii anterior; selang nasal dapat masuk ke intrakranial.' },
    { id: 'hipotonik', label: 'Cairan hipotonik/dekstrosa pada cedera otak', match: { kind: 'fluid', ids: ['d5', 'd10'] }, severity: 'ringan', why: 'Memperberat edema otak.' },
  ],
  stable: (v, p) => alive(v, p) && oxygenated(v, 94) && (v.sbp ?? 0) >= 100 && (v.gcs.intubated || v.gcs.total > 8) && p.v.icp < 0.95,
  disposition: { best: ['kamar_operasi'], acceptable: ['hcu_icu'], consult: ['bedah_saraf'] },
  expert: [
    at(0, triage(1, 'R1')),
    at(0.2, ex('A')),
    at(0.3, doProc('suction')),
    at(0.4, doProc('manuver')),
    at(0.6, ex('B')),
    at(0.8, ex('C')),
    at(1, ex('D')),
    at(1.2, doProc('monitor')),
    at(1.3, doProc('iv')),
    at(1.5, doProc('posisi', 'semi_fowler')),
    at(1.8, ex('E')),
    at(2.3, order('gds')),
    at(2.6, doProc('intubasi')),
    ivAgain(7),
    at(8, doProc('ventilator')),
    at(14, doProc('ventilator'), still((_v, p) => p.devices.adjunct === 'ett' && p.devices.assist !== 'ventilator')),
    at(10.5, (p) => give('manitol', 'iv', Math.round(p.weightKg * 0.75))),
    at(11, order('darah_lengkap')),
    at(11.2, order('crossmatch')),
    at(12, call('bedah_saraf')),
    at(13, order('ct_kepala'), still((v, p) => p.devices.adjunct === 'ett' || v.gcs.total > 8)),
    at(20, order('ct_kepala'), still((_v, p) => !p.tests.some((t) => t.id === 'ct_kepala'))),
    at(36, dx('cedera_kepala_berat')),
    at(37, give('tetanus', 'im', 0.5)),
    at(40, dispo('kamar_operasi')),
  ],
  debrief: {
    ringkasan: 'Cedera kepala berat (GCS ≤ 8) dengan lucid interval dan anisokor — khas perdarahan epidural yang menimbulkan herniasi. Pencegahan cedera otak sekunder (hipoksia, hipotensi) dan evakuasi hematoma secepatnya menentukan luaran.',
    tatalaksana: [
      'A dengan proteksi servikal: jaw thrust, suction; intubasi bila GCS ≤ 8 (RSI, pertahankan imobilisasi segaris).',
      'B: SpO₂ > 94%, PaCO₂ 35–45 (hiperventilasi singkat hanya bila herniasi akut).',
      'C: hindari hipotensi (TDS ≥ 100–110 mmHg); cari perdarahan lain.',
      'D: GCS, pupil; tanda herniasi → manitol 0,5–1 g/kg atau NaCl 3%, elevasi kepala 30°.',
      'CT kepala segera setelah stabil; konsul bedah saraf untuk kraniotomi evakuasi.',
      'Hindari steroid, cairan hipotonik, dan selang nasal bila curiga fraktur basis kranii.',
    ],
    jebakan: ['Menunda intubasi pada GCS ≤ 8 dengan muntahan.', 'Manitol pada pasien hipotensi.', 'Deksametason "untuk edema otak".'],
    referensi: ['Brain Trauma Foundation — Guidelines for the Management of Severe TBI, 4th ed. (2016)', 'ATLS® 10th Edition (2018) — Chapter 6: Head Trauma', 'CRASH trial (Lancet 2004/2005)'],
  },
};

export const PERDARAHAN_EKSTERNAL: EdScenario = {
  id: 'perdarahan_eksternal',
  title: 'Perdarahan arteri femoralis superfisial akibat luka bacok',
  category: 'perdarahan',
  difficulty: 1,
  ats: 1,
  patient: { sex: 'male', age: [18, 40] },
  arrival: { mode: 'dipapah', by: 'warga', complaint: 'Luka bacok di paha kiri saat perkelahian ± 15 menit lalu, darah memancar, celana basah darah.' },
  physio: { v: { volume: 0.8, rbc: 0.8, pain: 0.7, anxiety: 0.75 } },
  step: (pt) => {
    const d = pt.devices;
    pt.physio.v.bleed = 0.011 * (d.tourniquet ? 0.03 : d.pressure ? 0.35 : 1);
  },
  informants: {
    pasien: {
      topics: { keluhan_utama: 'Paha saya dibacok, Dok, darahnya tidak berhenti!', kejadian: 'Ribut di pasar, dibacok parang di paha kiri.', alergi: 'Tidak ada.', riwayat_obat: 'Tidak ada.', makan_terakhir: 'Sore tadi.', riwayat_penyakit: 'Sehat.' },
      symptoms: { luka_robek: 'Iya, lukanya dalam.', mau_pingsan: 'Kepala saya ringan, mau pingsan.' },
    },
    saksi: { label: 'Warga yang mengantar', opening: 'Dok, dia dibacok di pasar, darahnya muncrat terus, sudah kami ikat kain tapi tembus.', topics: { kejadian: 'Perkelahian di pasar, dibacok parang di paha kiri sekitar lima belas menit lalu.' } },
  },
  findings: {
    luka: (c) => (c.patient.devices.tourniquet ? 'Luka bacok paha kiri anteromedial 8 cm, dalam hingga otot; perdarahan terkontrol dengan torniket.' : c.patient.devices.pressure ? 'Luka bacok paha kiri 8 cm; perdarahan berkurang dengan bebat tekan tetapi masih merembes deras.' : 'Luka bacok paha kiri anteromedial 8 cm, dalam hingga otot, darah merah terang MEMANCAR (perdarahan arteri).'),
    C: (c) => (c.patient.devices.tourniquet ? '' : 'Perdarahan aktif memancar dari paha kiri.'),
  },
  diagnosis: { primary: ['perdarahan_arteri', 'syok_hemoragik'], secondary: ['syok_hemoragik'] },
  critical: [
    { id: 'tekan', label: 'Tekan langsung/bebat tekan segera', match: proc('tekan_langsung'), byMin: 2, weight: 3, why: 'Kontrol perdarahan eksternal adalah prioritas "C" pertama (bahkan sebelum A pada perdarahan masif — <C>ABC).' },
    { id: 'torniket', label: 'Torniket bila tekan langsung tidak mengontrol', match: proc('torniket'), byMin: 6, weight: 6, why: 'Perdarahan arteri ekstremitas yang mengancam nyawa.' },
    { id: 'iv', label: 'Dua akses IV', match: proc('iv'), byMin: 10, weight: 1, why: 'Resusitasi.' },
    { id: 'darah', label: 'Transfusi PRC', match: fluidMl(250, ['prc']), byMin: 30, weight: 2, why: 'Kehilangan darah > 30%.' },
    { id: 'txa', label: 'Asam traneksamat 1 g', match: drug('asam_traneksamat'), byMin: 30, weight: 2, why: 'Perdarahan traumatik bermakna ≤ 3 jam.' },
    { id: 'konsul', label: 'Konsul Sp.B (repair vaskular)', match: consult('bedah'), byMin: 30, weight: 3, why: 'Torniket hanya sementara (≤ 2 jam).' },
    { id: 'tetanus', label: 'Profilaksis tetanus', match: any(drug('tetanus'), drug('htig')), byMin: 120, weight: 1, why: 'Luka terkontaminasi.' },
  ],
  indicatedTests: ['darah_lengkap', 'crossmatch'],
  optionalTests: ['koagulasi', 'agd', 'laktat', 'rontgen_ekstremitas'],
  indicatedDrugs: ['asam_traneksamat', 'fentanil', 'morfin', 'tetanus', 'htig', 'sefazolin'],
  harmful: [],
  stable: (v, p) => alive(v, p) && perfused(v) && p.v.bleed < 0.001 && v.hr <= 125,
  disposition: { best: ['kamar_operasi'], consult: ['bedah'] },
  expert: [
    at(0, triage(1, 'R1')),
    at(0.1, ex('C')),
    at(0.3, doProc('tekan_langsung')),
    at(1.2, doProc('torniket')),
    at(2.2, ex('A')),
    at(2.4, ex('B')),
    at(2.6, doProc('monitor')),
    at(2.7, doProc('iv')),
    at(2.8, doProc('iv')),
    at(3, ex('D')),
    at(3.2, ex('E')),
    at(3.5, { type: 'periksa', exam: 'luka' }),
    at(5, order('crossmatch')),
    at(5.2, order('darah_lengkap')),
    ivAgain(7),
    at(7.5, infuse('rl', 500, 15)),
    at(8, give('asam_traneksamat', 'iv', 1000)),
    at(9, give('fentanil', 'iv', 50)),
    at(12, infuse('prc', 500, 20)),
    at(13, call('bedah')),
    at(20, give('tetanus', 'im', 0.5)),
    at(21, dx('perdarahan_arteri', 'syok_hemoragik')),
    at(35, dispo('kamar_operasi')),
  ],
  debrief: {
    ringkasan: 'Perdarahan arteri ekstremitas yang mengancam nyawa: darah merah terang memancar, syok kelas III. Kontrol perdarahan adalah tindakan penyelamat pertama.',
    tatalaksana: [
      'Tekan langsung kuat pada luka/bebat tekan; bila gagal → torniket 5–7 cm proksimal luka, kencangkan sampai perdarahan & nadi distal berhenti, catat jamnya.',
      'Dua kanul besar, crossmatch, PRC; batasi kristaloid.',
      'Asam traneksamat 1 g ≤ 3 jam; analgesia; profilaksis tetanus & antibiotik.',
      'Konsul bedah untuk eksplorasi & repair vaskular (iskemia torniket > 2 jam).',
    ],
    jebakan: ['Mengurus jalan napas/infus dulu sementara darah terus memancar.', 'Torniket longgar (perdarahan vena justru bertambah).'],
    referensi: ['ATLS® 10th Edition (2018) — Chapter 8: Musculoskeletal Trauma (life-threatening extremity hemorrhage)', 'Stop the Bleed / Hartford Consensus', 'European guideline on management of major bleeding and coagulopathy following trauma, 6th ed. (2023)'],
  },
};

export const LUKA_BAKAR: EdScenario = {
  id: 'luka_bakar_inhalasi',
  title: 'Luka bakar luas dengan trauma inhalasi',
  category: 'trauma',
  difficulty: 3,
  ats: 1,
  atsAcceptable: [2],
  patient: { sex: 'acak', age: [22, 50] },
  arrival: { mode: 'brankar', by: 'ambulans', complaint: 'Terjebak kebakaran rumah ± 10 menit; luka bakar wajah, dada, kedua lengan; suara serak.', mechanism: 'Kebakaran dalam ruang tertutup.', prehospital: 'Pakaian terbakar dilepas, O₂ NRM 15 L/menit.', devices: { oxygen: 'nrm', flow: 15 } },
  physio: { v: { angioedema: 0.22, leak: 0.0011, pain: 0.85, anxiety: 0.7, shunt: 0.05, temp: 36.5 }, rate: { angioedema: 0.007 }, airwayCause: 'inhalasi' },
  step: (pt) => {
    const p = pt.physio;
    // Kebocoran plasma luka bakar menurun perlahan; resusitasi berlebihan → edema paru ("fluid creep").
    if (crystalloidPerKg(pt) > 12) p.v.edema = Math.max(p.v.edema, (crystalloidPerKg(pt) - 12) * 0.02);
  },
  informants: {
    paramedis: {
      label: 'Paramedis ambulans',
      opening: 'Dok, korban kebakaran rumah, terjebak di kamar sekitar sepuluh menit. Luka bakar wajah, dada, kedua lengan. Suaranya serak, batuk dahak hitam. O₂ NRM terpasang.',
      topics: { kejadian: 'Kebakaran rumah, terjebak di dalam ruangan berasap ± 10 menit.', riwayat_penyakit: 'Tidak diketahui.', alergi: 'Tidak diketahui.' },
    },
    pasien: {
      topics: { keluhan_utama: 'Perih… panas… suara saya serak, Dok…', kejadian: 'Rumah terbakar… saya terjebak di kamar.', alergi: 'Tidak ada.', riwayat_obat: 'Tidak ada.', makan_terakhir: 'Tadi siang.', riwayat_penyakit: 'Sehat.' },
      symptoms: { suara_serak: 'Iya, serak.', batuk: 'Batuk dahaknya hitam.', sesak_napas: 'Agak sesak.', nyeri_terbakar_kulit: 'Perih sekali.' },
    },
  },
  findings: {
    E: 'Luka bakar derajat II dalam–III di wajah, leher, dada anterior & kedua lengan sirkumferensial ± 36% luas permukaan tubuh (rule of nines); alis & bulu hidung terbakar.',
    kepala_leher: 'Jelaga di hidung & mulut, mukosa orofaring edema kemerahan.',
  },
  tests: {
    agd: { extra: 'COHb 14% (meningkat — keracunan karbon monoksida; SpO₂ oksimetri tampak normal palsu).' },
  },
  diagnosis: { primary: ['luka_bakar', 'trauma_inhalasi'], secondary: ['trauma_inhalasi', 'luka_bakar'] },
  critical: [
    { id: 'intubasi', label: 'Intubasi dini (tanda trauma inhalasi: serak, stridor, jelaga, luka bakar wajah)', match: proc('intubasi'), byMin: 30, weight: 6, why: 'Edema jalan napas progresif — makin lama makin sulit/mustahil diintubasi.' },
    { id: 'o2', label: 'O₂ 100% (curiga keracunan CO)', match: o2(0.6), byMin: 5, weight: 2, why: 'Mempercepat eliminasi CO; SpO₂ normal palsu.' },
    { id: 'iv', label: 'Dua akses IV kanul besar', match: proc('iv'), byMin: 15, weight: 1, why: 'Resusitasi cairan luka bakar > 20%.' },
    { id: 'cairan', label: 'Ringer laktat sesuai formula (2 ml × kg × %LPTB/24 jam; separuh dalam 8 jam)', match: fluidMl(400, ['rl', 'nacl']), byMin: 60, weight: 3, why: 'Luka bakar > 20% LPTB dewasa butuh resusitasi cairan terhitung, dititrasi produksi urin 0,5 ml/kg/jam.' },
    { id: 'analgesia', label: 'Analgesia opioid IV', match: OPIOID, byMin: 30, weight: 1, why: 'Nyeri luka bakar berat.' },
    { id: 'kateter', label: 'Kateter urin (pantau produksi urin)', match: proc('kateter_urin'), byMin: 60, weight: 1, why: 'Panduan titrasi cairan.' },
    { id: 'konsul', label: 'Konsul luka bakar/ICU', match: any(consult('bedah_plastik'), consult('anestesi')), byMin: 60, weight: 2, why: 'Kriteria rujukan unit luka bakar.' },
  ],
  indicatedTests: ['agd', 'darah_lengkap', 'elektrolit', 'fungsi_ginjal'],
  optionalTests: ['rontgen_thorax', 'ekg', 'crossmatch', 'gds'],
  indicatedDrugs: ['fentanil', 'morfin', 'tetanus', 'htig', 'parasetamol'],
  harmful: [
    { id: 'antibiotik_profilaksis', label: 'Antibiotik profilaksis rutin pada luka bakar akut', match: any(drug('seftriakson'), drug('meropenem')), severity: 'ringan', why: 'Tidak dianjurkan rutin; meningkatkan resistensi.' },
  ],
  stable: (v, p) => alive(v, p) && perfused(v) && oxygenated(v, 94) && (p.v.angioedema < 0.4 || v.gcs.intubated),
  disposition: { best: ['hcu_icu'], acceptable: ['rujuk'], consult: ['bedah_plastik', 'anestesi'] },
  expert: [
    at(0, triage(1, 'R1')),
    ...primary(0.2),
    at(1, doProc('monitor')),
    at(1.1, doProc('iv')),
    at(1.2, doProc('iv')),
    at(2.5, doProc('intubasi')),
    at(3, doProc('dinginkan_luka_bakar')),
    ivAgain(7),
    at(8, doProc('ventilator')),
    at(15, doProc('ventilator'), still((_v, p) => p.devices.adjunct === 'ett' && p.devices.assist !== 'ventilator')),
    at(9, infuse('rl', 1000, 120)),
    at(10, give('fentanil', 'iv', 100)),
    at(11, order('agd')),
    at(12, order('darah_lengkap')),
    at(13, doProc('selimut_hangat')),
    at(14, doProc('kateter_urin')),
    at(15, call('bedah_plastik')),
    at(16, call('anestesi')),
    at(20, give('tetanus', 'im', 0.5)),
    at(22, dx('luka_bakar', 'trauma_inhalasi')),
    at(60, dispo('hcu_icu')),
  ],
  debrief: {
    ringkasan: 'Luka bakar luas (± 36% LPTB) dengan tanda trauma inhalasi (luka bakar wajah, alis/bulu hidung terbakar, jelaga, suara serak) & keracunan CO. Edema jalan napas memburuk dalam jam-jam pertama.',
    tatalaksana: [
      'Hentikan proses luka bakar; dinginkan dengan air mengalir 20 menit (≤ 3 jam), cegah hipotermia.',
      'A: tanda trauma inhalasi → intubasi DINI oleh operator berpengalaman (ETT besar).',
      'B: O₂ 100% (CO); periksa AGD + COHb — SpO₂ normal palsu.',
      'C: dua kanul besar; Ringer laktat: ATLS 2 ml × kg × %LPTB (dewasa) per 24 jam, separuh dalam 8 jam pertama; titrasi urin 0,5 ml/kg/jam.',
      'Analgesia opioid IV, profilaksis tetanus, kateter urin, rujuk/konsul unit luka bakar.',
    ],
    jebakan: ['Menunda intubasi sampai muncul stridor berat.', 'Resusitasi cairan berlebihan (fluid creep).', 'Mengandalkan SpO₂ pada keracunan CO.'],
    referensi: ['ATLS® 10th Edition (2018) — Chapter 9: Thermal Injuries', 'ISBI Practice Guidelines for Burn Care (Burns 2016, 2018)', 'American Burn Association — Advanced Burn Life Support Course 2018'],
  },
};

export const TRAUMA: EdScenario[] = [TENSION_PNEUMOTORAKS, MULTITRAUMA, CEDERA_KEPALA_BERAT, PERDARAHAN_EKSTERNAL, LUKA_BAKAR];
