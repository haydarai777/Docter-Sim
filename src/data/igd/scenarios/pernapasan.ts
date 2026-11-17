/**
 * Skenario IGD — gangguan pernapasan & jalan napas.
 * ⚠ BELUM DITINJAU DOKTER. Rujukan pedoman: lihat field debrief.referensi & docs/igd.md.
 */
import type { EdScenario } from '../../../core/igd/types';
import { acls, alive, any, at, BENZO, call, dispo, doProc, drug, dx, ex, fluid, give, infuse, ivAgain, o2, order, oxygenated, perfused, primary, proc, STEROID, still, test, triage } from '../helpers';

export const ASMA_BERAT: EdScenario = {
  id: 'asma_berat',
  title: 'Asma eksaserbasi berat',
  category: 'pernapasan',
  difficulty: 1,
  ats: 2,
  atsAcceptable: [1],
  patient: { sex: 'acak', age: [17, 42] },
  arrival: { mode: 'dipapah', by: 'keluarga', complaint: 'Sesak napas berat sejak 3 jam, makin memberat; terdengar bunyi "ngik-ngik".' },
  variants: [
    { id: 'berat', label: 'Eksaserbasi berat', weight: 3 },
    { id: 'mengancam', label: 'Mengancam nyawa', weight: 1, ats: 1, physio: { v: { spasm: 0.82, fatigue: 0.25 }, rate: { spasm: 0.007 } }, disposition: { best: ['hcu_icu'], consult: ['paru', 'penyakit_dalam', 'anestesi'] } },
  ],
  physio: { v: { spasm: 0.74, anxiety: 0.7 }, rate: { spasm: 0.0055 } },
  step: (pt, dtMin) => {
    const p = pt.physio;
    // Di IGD pemicu sudah tidak ada: peradangan masih bertambah tetapi melambat; ancaman utama adalah kelelahan otot napas.
    if (p.rate.spasm) p.rate.spasm *= Math.exp(-dtMin / 35);
    if (p.v.spasm < 0.45) p.v.anxiety = Math.max(0.3, p.v.anxiety - 0.02 * dtMin);
  },
  informants: {
    pasien: {
      topics: {
        keluhan_utama: 'Sesak… sesak sekali, Dok.',
        onset: 'Dari sore, Dok, habis bersih-bersih gudang yang berdebu.',
        kejadian: 'Bersih-bersih gudang, debunya banyak, langsung sesak.',
        riwayat_penyakit: 'Asma dari kecil, Dok. Tahun lalu sampai dirawat lima hari.',
        riwayat_obat: 'Semprot yang biru, Dok, sudah empat kali tidak mempan. Yang cokelat jarang saya pakai.',
        alergi: 'Alergi debu dan bulu kucing. Obat tidak ada.',
        kebiasaan: 'Tidak merokok, Dok.',
        makan_terakhir: 'Siang tadi.',
        episode_sebelumnya: 'Sering kambuh, tapi biasanya cukup disemprot.',
      },
      symptoms: { sesak_napas: 'Iya, sesak sekali.', mengi: 'Iya, ngik-ngik.', batuk: 'Batuk sedikit, dahaknya susah keluar.' },
    },
    keluarga: {
      label: 'Keluarga pasien',
      opening: 'Dok, tolong, sesaknya parah sekali. Semprotannya sudah dipakai berkali-kali tidak mempan.',
      topics: {
        riwayat_penyakit: 'Asma sejak kecil, Dok. Tahun lalu pernah dirawat, tapi tidak sampai ICU.',
        riwayat_obat: 'Semprot biru (salbutamol). Yang cokelat untuk pencegahan sering lupa dipakai.',
        alergi: 'Tidak ada alergi obat, Dok.',
        kejadian: 'Sore tadi beres-beres gudang, debunya banyak. Habis itu sesak terus makin berat.',
      },
    },
  },
  findings: {},
  diagnosis: { primary: ['asma_berat'], acceptable: ['asma_ringan'] },
  critical: [
    { id: 'o2', label: 'Oksigen terkontrol (target SpO₂ 93–95%)', match: o2(0.3), byMin: 5, weight: 2, why: 'Hipoksemia pada asma berat; oksigen dititrasi, bukan dibiarkan.' },
    { id: 'saba', label: 'Salbutamol nebulisasi 2,5–5 mg segera', match: drug('salbutamol', { dose: [2.5, 5] }), byMin: 8, weight: 4, why: 'SABA inhalasi adalah bronkodilator lini pertama, dapat diulang tiap 20 menit pada jam pertama.' },
    { id: 'saba_ulang', label: 'Salbutamol diulang dalam jam pertama', match: drug('salbutamol'), byMin: 30, weight: 1, why: 'Respons dinilai tiap 20 menit; eksaserbasi berat butuh dosis berulang.' },
    { id: 'saama', label: 'Ipratropium bromida nebulisasi', match: drug('ipratropium'), byMin: 20, weight: 1, why: 'Kombinasi SABA + ipratropium menurunkan rawat inap pada eksaserbasi berat.' },
    { id: 'steroid', label: 'Kortikosteroid sistemik dalam 1 jam', match: STEROID, byMin: 60, weight: 3, why: 'Steroid sistemik mempercepat resolusi & mencegah kekambuhan.' },
    { id: 'mgso4', label: 'MgSO₄ 2 g IV (eksaserbasi berat/tidak respons)', match: drug('mgso4', { dose: [1.2, 2.5] }), byMin: 45, weight: 2, why: 'Dipertimbangkan bila tidak respons terapi awal atau mengancam nyawa.' },
    { id: 'duduk', label: 'Posisi duduk/setengah duduk', match: any(proc('posisi', 'duduk'), proc('posisi', 'semi_fowler')), byMin: 10, weight: 1, why: 'Memudahkan kerja otot napas.' },
  ],
  indicatedTests: ['agd'],
  optionalTests: ['rontgen_thorax', 'darah_lengkap', 'elektrolit', 'ekg', 'gds'],
  indicatedDrugs: ['salbutamol', 'ipratropium', 'metilprednisolon', 'hidrokortison', 'deksametason', 'mgso4'],
  harmful: [
    { id: 'sedatif_asma', label: 'Sedatif pada asma berat', match: BENZO, severity: 'berat', why: 'Sedasi menekan dorongan napas pada pasien yang kelelahan — dapat memicu henti napas.' },
    { id: 'opioid_asma', label: 'Opioid pada asma berat', match: any(drug('morfin'), drug('fentanil')), severity: 'berat', why: 'Depresi napas & pelepasan histamin.' },
  ],
  stable: (v, p) => alive(v, p) && oxygenated(v, 92) && v.rr <= 28 && v.paco2 < 45,
  disposition: { best: ['bangsal'], acceptable: ['hcu_icu'], consult: ['paru', 'penyakit_dalam'] },
  expert: [
    at(0, triage(2, 'A1')),
    ...primary(0.3),
    at(1.2, doProc('posisi', 'duduk')),
    at(1.3, doProc('oksigen', 'sungkup:6')),
    at(1.4, give('salbutamol', 'neb', 5)),
    at(1.5, give('ipratropium', 'neb', 0.5)),
    at(1.6, doProc('monitor')),
    at(2, doProc('iv')),
    ivAgain(6.5),
    at(6, give('metilprednisolon', 'iv', 125)),
    at(8, order('agd')),
    at(21, give('salbutamol', 'neb', 5)),
    at(22, give('ipratropium', 'neb', 0.5)),
    at(24, give('mgso4', 'iv', 2)),
    at(41, give('salbutamol', 'neb', 5)),
    at(42, give('ipratropium', 'neb', 0.5)),
    at(44, dx('asma_berat')),
    at(45, call('paru')),
    at(70, dispo('bangsal')),
  ],
  debrief: {
    ringkasan: 'Asma eksaserbasi berat: bicara terputus-putus, RR > 30, nadi > 120, SpO₂ < 90%, retraksi & mengi difus. Tanda mengancam nyawa: silent chest, sianosis, kelelahan, penurunan kesadaran, PaCO₂ normal/meningkat.',
    tatalaksana: [
      'Posisi duduk, oksigen terkontrol target SpO₂ 93–95% (anak 94–98%).',
      'Salbutamol 2,5–5 mg nebulisasi tiap 20 menit selama 1 jam (atau kontinu) + ipratropium 0,5 mg.',
      'Kortikosteroid sistemik dalam 1 jam pertama (prednison 40–50 mg oral atau metilprednisolon/hidrokortison IV).',
      'MgSO₄ 2 g IV dalam 20 menit bila tidak respons atau mengancam nyawa.',
      'Nilai ulang klinis, SpO₂ dan AGD; PaCO₂ yang normal/naik pada pasien sesak berat = tanda kelelahan.',
      'Tanda mengancam nyawa/tidak respons → konsul ICU, siapkan intubasi oleh operator berpengalaman.',
    ],
    jebakan: ['Memberi sedatif untuk "menenangkan" pasien sesak — dapat memicu henti napas.', 'Aminofilin rutin (tidak dianjurkan GINA).', 'Memulangkan pasien sebelum respons memadai dan tanpa steroid oral.'],
    referensi: ['GINA 2024 — Global Strategy for Asthma Management and Prevention (Box 9-4, 9-5: penanganan eksaserbasi di IGD)', 'PDPI — Asma: Pedoman Diagnosis & Penatalaksanaan di Indonesia'],
  },
};

export const ANAFILAKSIS: EdScenario = {
  id: 'anafilaksis',
  title: 'Anafilaksis (syok anafilaktik) setelah makan makanan laut',
  category: 'syok',
  difficulty: 1,
  ats: 1,
  atsAcceptable: [2],
  patient: { sex: 'acak', age: [18, 55] },
  arrival: { mode: 'dipapah', by: 'keluarga', complaint: 'Gatal & bentol seluruh tubuh, bibir bengkak, sesak dan lemas ± 20 menit setelah makan udang di pesta.' },
  variants: [
    { id: 'sedang', label: 'Anafilaksis', weight: 2 },
    { id: 'berat', label: 'Syok anafilaktik', weight: 1, physio: { v: { reaction: 0.78 }, rate: { reaction: 0.014 } } },
  ],
  physio: { v: { reaction: 0.62, anxiety: 0.75 }, rate: { reaction: 0.011 } },
  step: (pt, dtMin, now) => {
    const p = pt.physio;
    // Perjalanan alami: puncak ± 30 menit, lalu mereda perlahan (bila pasien bertahan).
    if (now - pt.arriveAt > 35 * 60 && (p.rate.reaction ?? 0) > -0.004) p.rate.reaction = -0.004;
    if (p.v.reaction < 0.3) p.v.anxiety = Math.max(0.3, p.v.anxiety - 0.02 * dtMin);
  },
  informants: {
    pasien: {
      topics: {
        keluhan_utama: 'Gatal semua badan, Dok, napas berat… lemas mau pingsan.',
        onset: 'Kira-kira dua puluh menit lalu, habis makan udang di kondangan.',
        kejadian: 'Makan udang saus di pesta, tidak lama langsung gatal, bentol-bentol, terus sesak.',
        alergi: 'Dulu pernah gatal-gatal habis makan kepiting, tapi tidak separah ini.',
        riwayat_obat: 'Tidak ada obat rutin.',
        riwayat_penyakit: 'Tidak ada sakit apa-apa, Dok.',
        makan_terakhir: 'Barusan, udang dan nasi di pesta.',
      },
      symptoms: { gatal_kulit: 'Iya, gatal sekali di seluruh badan.', biduran: 'Iya, bentol-bentol merah.', sesak_napas: 'Iya, napas berat.', bengkak_bibir_mata: 'Bibir terasa tebal, Dok.', mual_muntah: 'Mual sedikit.', mau_pingsan: 'Iya, rasanya mau pingsan.' },
    },
    keluarga: {
      label: 'Keluarga pasien',
      opening: 'Dok, habis makan udang langsung bentol-bentol, sekarang bibirnya bengkak dan dia bilang mau pingsan!',
      topics: { kejadian: 'Makan udang di kondangan, lima belas menit kemudian bentol-bentol, terus sesak dan lemas.', alergi: 'Dulu pernah gatal setelah makan kepiting.' },
    },
  },
  diagnosis: { primary: ['anafilaksis'] },
  critical: [
    { id: 'adrenalin_im', label: 'Adrenalin 0,01 mg/kg IM (maks 0,5 mg) di paha anterolateral', match: drug('adrenalin', { routes: ['im'], perKg: [0.005, 0.0125] }), byMin: 5, weight: 6, why: 'Satu-satunya obat lini pertama anafilaksis; keterlambatan meningkatkan kematian.' },
    { id: 'o2', label: 'Oksigen aliran tinggi', match: o2(0.5), byMin: 5, weight: 1, why: 'Bronkospasme & syok.' },
    { id: 'posisi', label: 'Baringkan, tungkai diangkat (jangan didudukkan/berdiri)', match: any(proc('posisi', 'kaki_diangkat'), proc('posisi', 'terlentang')), byMin: 8, weight: 2, why: 'Mencegah "empty ventricle syndrome" — kematian mendadak saat pasien syok didudukkan/berdiri.' },
    { id: 'iv', label: 'Akses IV (kanul besar)', match: proc('iv'), byMin: 10, weight: 1, why: 'Untuk cairan & obat.' },
    { id: 'cairan', label: 'Bolus kristaloid 20 ml/kg (hipotensi)', match: fluid(10), byMin: 20, weight: 2, why: 'Pergeseran cairan masif pada anafilaksis.' },
  ],
  indicatedTests: [],
  optionalTests: ['ekg', 'gds', 'darah_lengkap'],
  indicatedDrugs: ['adrenalin', 'difenhidramin', 'metilprednisolon', 'hidrokortison', 'deksametason', 'salbutamol'],
  harmful: [
    { id: 'duduk_syok', label: 'Pasien syok anafilaktik didudukkan', match: any(proc('posisi', 'duduk'), proc('posisi', 'semi_fowler')), when: (c) => (c.vitals.sbp ?? 0) < 90, severity: 'berat', why: 'Posisi tegak pada syok anafilaktik dapat menyebabkan henti jantung mendadak.' },
    { id: 'antihistamin_dulu', label: 'Antihistamin/steroid diberikan sebelum adrenalin', match: any(drug('difenhidramin'), drug('metilprednisolon'), drug('hidrokortison'), drug('deksametason')), when: (c) => !c.done(drug('adrenalin')), severity: 'sedang', why: 'Antihistamin & steroid tidak menyelamatkan nyawa; adrenalin IM harus didahulukan.' },
  ],
  stable: (v, p) => alive(v, p) && perfused(v) && oxygenated(v, 94) && p.v.reaction < 0.4,
  disposition: { best: ['bangsal'], acceptable: ['hcu_icu'], consult: ['penyakit_dalam'] },
  expert: [
    at(0, triage(1, 'R1')),
    at(0.2, ex('A')),
    at(0.4, ex('B')),
    at(0.6, ex('C')),
    at(0.9, give('adrenalin', 'im', 0.5)),
    at(1, doProc('posisi', 'kaki_diangkat')),
    at(1.1, doProc('oksigen', 'nrm:15')),
    at(1.2, doProc('monitor')),
    at(1.4, doProc('iv')),
    ivAgain(5.9),
    at(2, ex('D')),
    at(2.2, ex('E')),
    at(5, infuse('nacl', 1000, 20)),
    at(7, give('adrenalin', 'im', 0.5), still((v) => (v.sbp ?? 0) < 100 || (v.spo2 ?? 0) < 94)),
    at(12, give('adrenalin', 'im', 0.5), still((v) => (v.sbp ?? 0) < 90)),
    at(14, give('difenhidramin', 'iv', 25)),
    at(15, give('metilprednisolon', 'iv', 125)),
    at(16, dx('anafilaksis')),
    at(20, call('penyakit_dalam')),
    at(50, dispo('bangsal')),
  ],
  debrief: {
    ringkasan: 'Anafilaksis: reaksi hipersensitivitas sistemik akut dengan gangguan napas dan/atau sirkulasi setelah paparan alergen (makanan, sengatan, obat). Keterlambatan adrenalin adalah penyebab kematian utama.',
    tatalaksana: [
      'Hentikan paparan; baringkan dengan tungkai diangkat (sesak: setengah duduk bila tensi baik; hamil: miring kiri).',
      'Adrenalin 0,01 mg/kg IM (1 mg/ml) di paha anterolateral — dewasa 0,5 mg, anak 0,3 mg; ulang tiap 5 menit bila belum respons.',
      'Oksigen aliran tinggi, akses IV besar, bolus kristaloid 20 ml/kg (dewasa 1–2 L) bila hipotensi.',
      'Bronkospasme menetap: salbutamol nebulisasi. Syok refrakter setelah 2 dosis IM: infus adrenalin oleh tenaga berpengalaman.',
      'Antihistamin & steroid hanya terapi tambahan (tidak menggantikan adrenalin).',
      'Observasi ≥ 6–12 jam (reaksi bifasik); edukasi hindari alergen & rencana adrenalin auto-injector.',
    ],
    jebakan: ['Memberi adrenalin 1 mg IV bolus pada pasien bernadi — aritmia & krisis hipertensi.', 'Hanya memberi antihistamin/deksametason.', 'Mendudukkan pasien yang hipotensi.'],
    referensi: ['World Allergy Organization Anaphylaxis Guidance 2020 (Cardona et al., WAO Journal 2020)', 'Resuscitation Council UK — Emergency treatment of anaphylaxis (2021)', 'EAACI Anaphylaxis Guidelines 2021'],
  },
};

export const EDEMA_PARU_AKUT: EdScenario = {
  id: 'edema_paru_akut',
  title: 'Edema paru akut kardiogenik (hipertensif)',
  category: 'pernapasan',
  difficulty: 2,
  ats: 2,
  atsAcceptable: [1],
  patient: { sex: 'acak', age: [56, 76], comorbid: [{ id: 'hipertensi', text: 'Hipertensi lama, minum obat tidak teratur', chance: 1 }, { id: 'dm', text: 'Diabetes melitus tipe 2', chance: 0.5 }] },
  arrival: { mode: 'kursi_roda', by: 'keluarga', complaint: 'Sesak hebat mendadak sejak tengah malam, tidak bisa berbaring, batuk berdahak berbusa kemerahan.' },
  physio: { v: { edema: 0.58, hypertension: 0.9, pump: 0.66, anxiety: 0.75 }, base: { map: 104, pp: 56 }, rate: { edema: 0.0045 } },
  informants: {
    pasien: {
      topics: {
        keluhan_utama: 'Sesak… tidak bisa tiduran, Dok…',
        onset: 'Jam dua belas malam tadi, kebangun karena sesak.',
        riwayat_penyakit: 'Darah tinggi sudah lama. Kata dokter jantungnya bengkak.',
        riwayat_obat: 'Obat darah tinggi, tapi sudah seminggu habis.',
        alergi: 'Tidak ada.',
        makan_terakhir: 'Makan malam jam tujuh, Dok, ikan asin.',
        episode_sebelumnya: 'Sebulan ini kalau jalan jauh cepat capek, tidur harus pakai dua bantal.',
      },
      symptoms: { sesak_napas: 'Iya, sesak sekali, tidak bisa berbaring.', batuk: 'Batuk, dahaknya berbusa agak merah.', bengkak_kaki: 'Kaki agak bengkak seminggu ini.', nyeri_dada: 'Dada terasa berat sedikit, tidak sakit.', keringat_dingin: 'Iya, keringat dingin.' },
    },
    keluarga: { label: 'Anak pasien', opening: 'Dok, bapak/ibu saya tiba-tiba sesak tengah malam, katanya kayak tenggelam.', topics: { riwayat_obat: 'Obat darah tinggi amlodipin, sudah habis seminggu.', riwayat_penyakit: 'Darah tinggi, pernah dibilang jantungnya bengkak.' } },
  },
  tests: {
    ekg: { extra: (c) => (c.physio.v.edema > 0.05 ? 'Hipertrofi ventrikel kiri (kriteria voltase), tanpa elevasi ST.' : '') },
    troponin: { text: 'hs-cTnI 32 ng/L (sedikit meningkat — strain miokard; ulang 1–3 jam)' },
  },
  diagnosis: { primary: ['edema_paru'], acceptable: ['krisis_hipertensi'], secondary: ['krisis_hipertensi'] },
  critical: [
    { id: 'duduk', label: 'Posisi duduk tegak, tungkai menggantung', match: any(proc('posisi', 'duduk'), proc('posisi', 'semi_fowler')), byMin: 5, weight: 2, why: 'Mengurangi aliran balik vena & kerja napas.' },
    { id: 'o2', label: 'Oksigen aliran tinggi / CPAP-NIV', match: o2(0.5), byMin: 8, weight: 2, why: 'Hipoksemia akibat edema alveolar; NIV mengurangi intubasi.' },
    { id: 'nitrat', label: 'Nitrat (ISDN SL berulang atau nitrogliserin infus)', match: any(drug('isdn'), drug('nitrogliserin')), byMin: 15, weight: 4, why: 'Edema paru hipertensif: vasodilator menurunkan preload & afterload — terapi utama.' },
    { id: 'furosemid', label: 'Furosemid IV 40–80 mg', match: drug('furosemid'), byMin: 30, weight: 2, why: 'Kongesti/kelebihan cairan.' },
    { id: 'niv', label: 'CPAP/NIV bila tetap hipoksemia/sesak', match: proc('oksigen', 'niv:10'), byMin: 30, weight: 2, why: 'Menurunkan kerja napas & kebutuhan intubasi.' },
    { id: 'ekg', label: 'EKG 12 sadapan (singkirkan SKA)', match: test('ekg'), byMin: 15, weight: 2, why: 'SKA adalah pencetus tersering gagal jantung akut.' },
  ],
  indicatedTests: ['ekg', 'troponin', 'rontgen_thorax', 'elektrolit', 'fungsi_ginjal'],
  optionalTests: ['agd', 'darah_lengkap', 'gds', 'fast'],
  indicatedDrugs: ['isdn', 'nitrogliserin', 'furosemid', 'nikardipin'],
  harmful: [
    { id: 'morfin_ape', label: 'Morfin rutin pada edema paru', match: drug('morfin'), severity: 'ringan', why: 'Tidak dianjurkan rutin (ESC): dikaitkan dengan ventilasi mekanik & mortalitas lebih tinggi.' },
    { id: 'cairan_ape', label: 'Bolus cairan pada edema paru', match: { kind: 'fluid', ids: ['nacl', 'rl', 'koloid'] }, severity: 'berat', why: 'Memperberat kongesti paru.' },
  ],
  stable: (v, p) => alive(v, p) && oxygenated(v, 92) && v.rr <= 26 && (v.sbp ?? 0) < 180 && perfused(v),
  disposition: { best: ['hcu_icu'], acceptable: ['bangsal'], consult: ['jantung'] },
  expert: [
    at(0, triage(2, 'R1')),
    ...primary(0.2),
    at(1, doProc('posisi', 'duduk')),
    at(1.1, doProc('oksigen', 'nrm:15')),
    at(1.2, doProc('monitor')),
    at(1.5, give('isdn', 'sl', 5)),
    at(2, doProc('iv')),
    at(3, order('ekg')),
    ivAgain(5.5),
    at(6, give('isdn', 'sl', 5)),
    at(7, give('furosemid', 'iv', 40)),
    at(8, doProc('oksigen', 'niv:10')),
    at(9, { type: 'infus_obat', drug: 'nitrogliserin', rate: 20 }),
    at(10, order('troponin')),
    at(11, order('rontgen_thorax')),
    at(15, { type: 'infus_obat', drug: 'nitrogliserin', rate: 50 }, still((v) => (v.sbp ?? 0) > 150)),
    at(20, dx('edema_paru', 'krisis_hipertensi')),
    at(22, call('jantung')),
    at(60, dispo('hcu_icu')),
  ],
  debrief: {
    ringkasan: 'Edema paru akut kardiogenik pada krisis hipertensi: sesak mendadak, ortopnea, ronki basah hingga apeks, sputum berbusa, TD sangat tinggi. Masalah utama adalah redistribusi cairan akibat afterload tinggi, bukan sekadar kelebihan cairan.',
    tatalaksana: [
      'Posisi duduk, oksigen; CPAP/NIV dini bila RR > 25 atau SpO₂ < 90%.',
      'Vasodilator: nitrat SL berulang/nitrogliserin infus bila TDS > 110 mmHg — terapi utama edema paru hipertensif.',
      'Diuretik loop IV (furosemid 40–80 mg) bila ada kongesti/kelebihan cairan.',
      'EKG & troponin untuk mencari SKA; rontgen thorax; elektrolit & fungsi ginjal.',
      'Hindari morfin rutin; rawat di HCU/ICCU.',
    ],
    jebakan: ['Memberi cairan karena takikardia.', 'Menidurkan pasien datar.', 'Hanya memberi furosemid tanpa vasodilator pada TD sangat tinggi.'],
    referensi: ['ESC 2021 Guidelines for the diagnosis and treatment of acute and chronic heart failure (+ update 2023)', 'PERKI — Pedoman Tatalaksana Gagal Jantung 2023'],
  },
};

export const TERSEDAK_ANAK: EdScenario = {
  id: 'tersedak_anak',
  title: 'Sumbatan jalan napas benda asing pada anak',
  category: 'anak',
  difficulty: 1,
  ats: 1,
  patient: { sex: 'acak', age: [2, 6] },
  arrival: { mode: 'digendong', by: 'keluarga', complaint: 'Tersedak permen 3 menit lalu, tidak bisa bicara/menangis, bibir mulai biru.' },
  physio: { v: { airway: 0.3, anxiety: 0.95 }, airwayCause: 'benda_asing', rate: { airway: -0.025 } },
  step: (pt, dtMin) => {
    const p = pt.physio;
    // Kompresi dada saat henti jantung dapat mendorong benda asing keluar.
    if (p.airwayCause === 'benda_asing' && p.arrest && p.arrest.cprSeconds >= 60) {
      p.airwayCause = null;
      p.v.airway = 1;
      p.rate.airway = 0;
    }
    // Setelah jalan napas bebas, kepanikan mereda perlahan.
    if (p.airwayCause === null) p.v.anxiety = Math.max(0.25, p.v.anxiety - 0.03 * dtMin);
  },
  informants: {
    keluarga: {
      label: 'Ayah pasien',
      opening: 'Dok! Anak saya tersedak permen, tidak bisa napas! Sudah saya tepuk punggungnya!',
      topics: {
        kejadian: 'Makan permen bulat sambil lari-lari, tiba-tiba tersedak, langsung tidak bisa nangis.',
        onset: 'Baru tiga menit lalu, Dok, rumah kami dekat.',
        riwayat_penyakit: 'Sehat, Dok, tidak ada sakit apa-apa.',
        alergi: 'Tidak ada.',
      },
    },
  },
  findings: { A: 'Anak sadar, panik, tangan memegang leher, tidak dapat bersuara/batuk efektif.' },
  diagnosis: { primary: ['benda_asing_jalan_napas'] },
  critical: [
    { id: 'heimlich', label: 'Abdominal thrust (Heimlich) / back blows segera', match: proc('heimlich'), byMin: 2, weight: 7, why: 'Sumbatan total pada anak sadar: hentakan perut (anak > 1 tahun) berulang sampai benda keluar.' },
    { id: 'rjp', label: 'Bila tidak sadar: mulai RJP', match: proc('rjp'), byMin: 6, weight: 3, why: 'Kompresi dada juga membantu mengeluarkan benda asing.', onlyIf: (p) => p.episodes.some((e) => e.kind === 'henti_jantung') },
    { id: 'o2', label: 'Oksigen & nilai ulang setelah benda keluar', match: o2(0.3), byMin: 15, weight: 1, why: 'Hipoksemia pasca-sumbatan.' },
  ],
  indicatedTests: [],
  optionalTests: ['rontgen_thorax'],
  indicatedDrugs: [],
  harmful: [],
  stable: (v, p) => alive(v, p) && oxygenated(v, 94) && p.airwayCause !== 'benda_asing',
  disposition: { best: ['bangsal'], acceptable: ['pulang'], consult: ['anak'] },
  expert: [
    at(0, triage(1, 'R1')),
    at(0.15, ex('A')),
    at(0.5, doProc('heimlich')),
    at(1.3, doProc('heimlich'), still((_v, p) => p.physio.airwayCause === 'benda_asing')),
    at(2.1, doProc('heimlich'), still((_v, p) => p.physio.airwayCause === 'benda_asing')),
    at(2.9, doProc('heimlich'), still((_v, p) => p.physio.airwayCause === 'benda_asing')),
    at(3.7, doProc('heimlich'), still((_v, p) => p.physio.airwayCause === 'benda_asing')),
    ...acls(3, 25, { shockable: false }),
    at(5, doProc('oksigen', 'nrm:10')),
    at(5.2, doProc('monitor')),
    at(6, ex('B')),
    at(6.5, ex('C')),
    at(7, ex('D')),
    at(7.5, ex('E')),
    at(9, dx('benda_asing_jalan_napas')),
    at(10, call('anak')),
    at(40, dispo('bangsal')),
  ],
  debrief: {
    ringkasan: 'Sumbatan jalan napas total oleh benda asing: anak sadar tetapi tidak dapat bicara/menangis/batuk — dalam hitungan menit menjadi tidak sadar dan henti jantung hipoksik.',
    tatalaksana: [
      'Batuk efektif: dorong batuk, awasi.',
      'Batuk tidak efektif & sadar: 5 back blows bergantian 5 hentakan perut (anak > 1 tahun; bayi: 5 hentakan dada) sampai benda keluar atau anak tidak sadar.',
      'Tidak sadar: buka jalan napas, beri napas buatan, mulai RJP (kompresi membantu mengeluarkan benda asing); lihat mulut sebelum ventilasi — jangan sapuan jari buta.',
      'Setelah keluar: oksigen, observasi; rontgen/konsul bila curiga sisa benda asing atau aspirasi.',
    ],
    jebakan: ['Menunggu alat/intubasi sementara anak masih sadar dan bisa ditolong dengan hentakan perut.', 'Sapuan jari buta di mulut — mendorong benda lebih dalam.'],
    referensi: ['ERC Guidelines 2021 — Paediatric Life Support (foreign body airway obstruction)', 'AHA 2020 Guidelines — Pediatric Basic and Advanced Life Support'],
  },
};

export const PERNAPASAN: EdScenario[] = [ASMA_BERAT, ANAFILAKSIS, EDEMA_PARU_AKUT, TERSEDAK_ANAK];

