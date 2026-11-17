/**
 * Skenario IGD — obstetri & kasus ringan (latihan triase; hindari penunjang/terapi tanpa indikasi).
 * ⚠ BELUM DITINJAU DOKTER. Rujukan pedoman: lihat field debrief.referensi & docs/igd.md.
 */
import { eff } from '../../../core/igd/physiology';
import type { EdScenario } from '../../../core/igd/types';
import { alive, ANALGESIC, any, at, call, consult, dispo, doProc, drip, drug, dx, ex, fluid, fluidMl, give, infuse, ivAgain, o2, order, oxygenated, perfused, primary, proc, still, test, triage } from '../helpers';

export const EKLAMPSIA: EdScenario = {
  id: 'eklampsia',
  title: 'Eklampsia pada kehamilan 35 minggu',
  category: 'obstetri',
  difficulty: 2,
  ats: 1,
  patient: { sex: 'female', age: [18, 34], comorbid: [{ id: 'hamil', text: 'G1P0A0 hamil 35 minggu, ANC tidak teratur', chance: 1 }] },
  arrival: { mode: 'brankar', by: 'keluarga', complaint: 'Hamil 8 bulan, kejang di rumah 15 menit lalu; sebelumnya mengeluh sakit kepala hebat dan pandangan kabur.' },
  physio: { v: { hypertension: 0.82, postictal: 0.7, anxiety: 0.3 }, base: { map: 88 } },
  events: [
    {
      id: 'kejang_ulang',
      atMin: [4, 9],
      unless: [drug('mgso4')],
      apply: (p, now) => {
        p.seizure = true;
        p.seizureEndsAt = now + 90;
      },
      note: 'Kejang tonik-klonik berulang (eklampsia).',
    },
    {
      id: 'kejang_ketiga',
      atMin: [18, 26],
      unless: [drug('mgso4')],
      apply: (p, now) => {
        p.seizure = true;
        p.seizureEndsAt = now + 120;
        p.v.icp = Math.max(p.v.icp, 0.25);
      },
      note: 'Kejang ketiga — kesadaran tidak pulih.',
    },
  ],
  step: (pt, _dtMin, now) => {
    const p = pt.physio;
    // Hipertensi berat yang dibiarkan > 30 menit berisiko perdarahan otak.
    p.rate.icp = eff(p, 'hypertension', now) > 0.7 && now - pt.arriveAt > 30 * 60 ? 0.003 : 0;
  },
  informants: {
    keluarga: {
      label: 'Suami pasien',
      opening: 'Dok, istri saya hamil delapan bulan, tadi kejang di rumah. Dari pagi bilang kepalanya sakit sekali dan matanya kabur.',
      topics: {
        kejadian: 'Lagi duduk tiba-tiba kejang seluruh badan sekitar satu menit, lalu tidur, susah dibangunkan.',
        onset: 'Kejangnya lima belas menit lalu. Sakit kepala dari pagi.',
        haid_kehamilan: 'Hamil anak pertama, kira-kira 35 minggu. Periksa ke bidan jarang.',
        riwayat_penyakit: 'Tidak pernah kejang sebelumnya. Kata bidan bulan lalu tensinya agak tinggi.',
        riwayat_obat: 'Vitamin hamil saja.',
        alergi: 'Tidak ada.',
        makan_terakhir: 'Siang tadi.',
      },
      symptoms: { kejang: 'Iya, seluruh badan.', nyeri_kepala: 'Sakit kepala hebat dari pagi.', pandangan_kabur: 'Katanya matanya kabur.', nyeri_ulu_hati: 'Sempat mengeluh nyeri ulu hati.', bengkak_kaki: 'Kakinya bengkak seminggu ini.' },
    },
    pasien: { topics: { keluhan_utama: 'Kepala sakit… mata kabur…' }, symptoms: { nyeri_kepala: 'Sakit sekali…' } },
  },
  findings: {
    obstetri: 'TFU 31 cm, janin tunggal presentasi kepala, DJJ 146 x/menit reguler, tidak ada kontraksi, tidak ada perdarahan pervaginam.',
    neurologis: 'Refleks patela meningkat (+3) dengan klonus; tidak ada lateralisasi.',
    pelvis_ekstremitas: 'Edema pitting kedua tungkai.',
  },
  tests: {
    urinalisis: { text: 'Protein +3, BJ 1.020, leukosit (−), nitrit (−)' },
    darah_lengkap: { text: (c) => `Hb ${c.vitals.hb} g/dL · leukosit 11,2 ×10³/µL · trombosit 112 ×10³/µL` },
    fungsi_hati: { text: 'SGOT 86 · SGPT 71 U/L (meningkat) · LDH 640 U/L' },
    usg_obstetri: { text: 'Janin tunggal hidup intrauterin, presentasi kepala, biometri ± 34–35 minggu, ketuban cukup, plasenta di fundus.' },
    bhcg: { text: 'β-hCG urin positif' },
  },
  diagnosis: { primary: ['eklampsia'], acceptable: ['preeklampsia_berat'] },
  critical: [
    { id: 'mgso4', label: 'MgSO₄ 4 g IV pelan (15–20 menit) + rumatan 1 g/jam', match: drug('mgso4', { dose: [4, 6] }), byMin: 15, weight: 6, why: 'Obat pilihan mencegah & menghentikan kejang eklampsia (lebih unggul dari diazepam/fenitoin).' },
    { id: 'rumatan', label: 'Rumatan MgSO₄ 1 g/jam', match: drug('mgso4', { routes: ['infus'] }), byMin: 40, weight: 2, why: 'Pertahankan kadar terapeutik 24 jam pascapersalinan/kejang terakhir.' },
    { id: 'antihipertensi', label: 'Antihipertensi bila TD ≥ 160/110 (nifedipin oral/labetalol IV)', match: any(drug('nifedipin', { routes: ['po'] }), drug('labetalol'), drug('nikardipin')), byMin: 30, weight: 3, why: 'Mencegah perdarahan otak; target 140–150/90–100.' },
    { id: 'miring', label: 'Posisi miring kiri, jalan napas & O₂', match: any(proc('posisi', 'miring_kiri'), o2(0.3)), byMin: 10, weight: 1, why: 'Proteksi jalan napas & mencegah kompresi aortokaval.' },
    { id: 'konsul', label: 'Konsul Sp.OG (terminasi setelah ibu stabil)', match: consult('obgin'), byMin: 30, weight: 3, why: 'Persalinan adalah terapi definitif.' },
    { id: 'kateter', label: 'Kateter urin (pantau produksi urin & toksisitas Mg)', match: proc('kateter_urin'), byMin: 60, weight: 1, why: 'Mg diekskresi ginjal; oliguria → risiko intoksikasi.' },
  ],
  indicatedTests: ['urinalisis', 'darah_lengkap', 'fungsi_hati', 'fungsi_ginjal'],
  optionalTests: ['usg_obstetri', 'koagulasi', 'gds', 'elektrolit', 'bhcg'],
  indicatedDrugs: ['mgso4', 'nifedipin', 'labetalol', 'nikardipin', 'kalsium', 'deksametason'],
  harmful: [
    { id: 'diazepam_eklampsia', label: 'Diazepam sebagai obat utama eklampsia', match: drug('diazepam'), when: (c) => !c.done(drug('mgso4')), severity: 'sedang', why: 'MgSO₄ terbukti lebih efektif mencegah kejang berulang dengan luaran ibu-bayi lebih baik.' },
  ],
  stable: (v, p) => alive(v, p) && !p.seizure && (v.sbp ?? 0) < 160 && oxygenated(v, 94) && p.v.mg >= 3.5,
  disposition: { best: ['kamar_operasi', 'hcu_icu'], consult: ['obgin'] },
  expert: [
    at(0, triage(1, 'R1')),
    at(0.2, ex('A')),
    at(0.3, doProc('posisi', 'miring_kiri')),
    at(0.4, doProc('oksigen', 'sungkup:6')),
    at(0.5, ex('B')),
    at(0.7, ex('C')),
    at(0.9, doProc('iv')),
    at(1.1, doProc('monitor')),
    at(1.3, ex('D')),
    at(1.5, ex('E')),
    ivAgain(5),
    at(5.5, give('mgso4', 'iv', 4)),
    at(7, drip('mgso4', 1)),
    at(8, give('nifedipin', 'po', 10)),
    at(9, doProc('kateter_urin')),
    at(10, call('obgin')),
    at(11, { type: 'periksa', exam: 'obstetri' }),
    at(14, order('urinalisis')),
    at(14.5, order('darah_lengkap')),
    at(15, order('fungsi_hati')),
    at(30, give('nifedipin', 'po', 10), still((v) => (v.sbp ?? 0) >= 160)),
    at(32, dx('eklampsia')),
    at(60, dispo('kamar_operasi')),
  ],
  debrief: {
    ringkasan: 'Eklampsia: kejang pada preeklampsia (hipertensi ≥ 140/90 setelah 20 minggu + proteinuria/disfungsi organ). Penyebab utama kematian ibu: perdarahan otak, edema paru, HELLP.',
    tatalaksana: [
      'ABC, posisi miring kiri, O₂, cegah cedera saat kejang.',
      'MgSO₄: dosis awal 4 g IV pelan 15–20 menit (± 10 g IM — regimen Pritchard), rumatan 1 g/jam 24 jam. Pantau refleks patela, RR > 16, urin > 30 ml/jam; antidot kalsium glukonat 1 g IV.',
      'Antihipertensi bila ≥ 160/110: nifedipin 10 mg oral (ulang 20–30 menit) atau labetalol IV — target 140–150/90–100.',
      'Lab: darah lengkap, fungsi hati & ginjal, LDH, urin (HELLP).',
      'Konsul obstetri: terminasi kehamilan setelah ibu stabil (bukan saat kejang).',
    ],
    jebakan: ['Diazepam sebagai pengganti MgSO₄.', 'Nifedipin sublingual.', 'Langsung operasi saat ibu belum stabil.'],
    referensi: ['POGI — PNPK Diagnosis dan Tata Laksana Pre-eklamsia (2016)', 'WHO recommendations for prevention and treatment of pre-eclampsia and eclampsia (2011, update 2018)', 'ACOG Practice Bulletin No. 222 (2020) — Gestational Hypertension and Preeclampsia'],
  },
};

export const PERDARAHAN_POSTPARTUM: EdScenario = {
  id: 'perdarahan_postpartum',
  title: 'Perdarahan pascapersalinan akibat atonia uteri',
  category: 'obstetri',
  difficulty: 2,
  ats: 1,
  patient: { sex: 'female', age: [20, 38], comorbid: [{ id: 'multipara', text: 'P4 (grande multipara)', chance: 0.6 }] },
  arrival: { mode: 'brankar', by: 'ambulans', complaint: 'Rujukan bidan: perdarahan banyak setelah melahirkan 1 jam lalu, sudah 3 kain basah, pasien makin lemas.', prehospital: 'Bidan sudah memberi oksitosin 10 IU IM satu kali; terpasang infus RL (tetesan pelan).', devices: { ivCount: 1 } },
  physio: { v: { atony: 0.7, volume: 0.78, rbc: 0.78, anxiety: 0.6 } },
  step: (pt, _dtMin, now) => {
    const p = pt.physio;
    // Perdarahan mengikuti tonus uterus (masase/kompresi bimanual bekerja sementara).
    p.v.bleed = 0.016 * eff(p, 'atony', now) * (p.doses.txa ? 0.8 : 1);
  },
  informants: {
    paramedis: {
      label: 'Bidan perujuk',
      opening: 'Dok, P4, melahirkan normal satu jam lalu di praktik saya, bayi 3,8 kg. Plasenta lahir lengkap tapi perdarahan terus, uterus lembek. Sudah oksitosin 10 IU IM sekali dan masase. Perdarahan ± 1.000 ml.',
      topics: { kejadian: 'Persalinan lama, bayi besar 3,8 kg. Plasenta lahir lengkap, lalu perdarahan banyak.', riwayat_penyakit: 'Tidak ada hipertensi selama hamil.', riwayat_obat: 'Oksitosin 10 IU IM sekali.', alergi: 'Tidak ada.' },
    },
    pasien: { topics: { keluhan_utama: 'Lemas… pusing… dingin, Dok.', alergi: 'Tidak ada.' }, symptoms: { perdarahan_pervaginam: 'Darah terus keluar…', mau_pingsan: 'Rasanya mau pingsan.' } },
  },
  injuries: { wounds: [], vaginal: { type: 'vena', share: 1 } },
  findings: {
    obstetri: (c) => (c.physio.v.atony > 0.35 ? 'Uterus lembek, TFU 2 jari di atas pusat (kontraksi lemah); darah segar mengalir dari jalan lahir dengan bekuan; plasenta lengkap (menurut bidan); laserasi perineum derajat I tidak berdarah aktif.' : 'Uterus keras, kontraksi baik, TFU setinggi pusat; perdarahan pervaginam minimal.'),
  },
  diagnosis: { primary: ['hpp_atonia'], acceptable: ['syok_hemoragik'], secondary: ['syok_hemoragik'] },
  critical: [
    { id: 'masase', label: 'Masase fundus uteri', match: proc('masase_uterus'), byMin: 5, weight: 3, why: 'Tindakan pertama atonia uteri.' },
    { id: 'oksitosin', label: 'Oksitosin 10 IU IM/IV pelan + infus 20–40 IU/L', match: drug('oksitosin'), byMin: 10, weight: 5, why: 'Uterotonika lini pertama.' },
    { id: 'iv2', label: 'Akses IV kedua kanul besar', match: proc('iv'), byMin: 10, weight: 1, why: 'Syok hemoragik.' },
    { id: 'cairan', label: 'Resusitasi kristaloid hangat', match: fluid(10), byMin: 20, weight: 2, why: 'Syok kelas III.' },
    { id: 'txa', label: 'Asam traneksamat 1 g IV ≤ 3 jam pascapersalinan', match: drug('asam_traneksamat', { dose: [1000, 1000] }), byMin: 30, weight: 3, why: 'WOMAN trial: menurunkan kematian akibat perdarahan.' },
    { id: 'darah', label: 'Transfusi PRC', match: fluidMl(250, ['prc']), byMin: 45, weight: 2, why: 'Kehilangan > 1.500 ml dengan syok.' },
    { id: 'konsul', label: 'Konsul Sp.OG', match: consult('obgin'), byMin: 20, weight: 3, why: 'Bila uterotonika & kompresi gagal: tindakan bedah (B-Lynch, ligasi, histerektomi).' },
  ],
  indicatedTests: ['darah_lengkap', 'crossmatch', 'koagulasi'],
  optionalTests: ['agd', 'laktat', 'fungsi_ginjal', 'usg_obstetri'],
  indicatedDrugs: ['oksitosin', 'misoprostol', 'metilergometrin', 'asam_traneksamat'],
  harmful: [],
  stable: (v, p, now) => alive(v, p) && perfused(v) && v.hr <= 120 && eff(p, 'atony', now) < 0.35,
  disposition: { best: ['hcu_icu', 'bangsal'], acceptable: ['kamar_operasi'], consult: ['obgin'] },
  expert: [
    at(0, triage(1, 'R1')),
    at(0.2, ex('C')),
    at(0.4, doProc('masase_uterus')),
    at(1.5, give('oksitosin', 'im', 10)),
    at(1.6, doProc('iv')),
    ivAgain(6.1),
    at(1.7, doProc('monitor')),
    at(1.8, ex('A')),
    at(2, ex('B')),
    at(2.2, ex('D')),
    at(2.4, ex('E')),
    at(2.6, { type: 'periksa', exam: 'obstetri' }),
    at(4, infuse('rl', 1000, 15)),
    at(4.5, order('crossmatch')),
    at(4.7, order('darah_lengkap')),
    at(5, give('asam_traneksamat', 'iv', 1000)),
    at(6, call('obgin')),
    at(7, give('misoprostol', 'sl', 800)),
    at(8, doProc('kompresi_bimanual'), still((_v, p) => p.physio.v.atony > 0.35)),
    at(14, doProc('selimut_hangat')),
    at(15, infuse('prc', 500, 30)),
    at(16, doProc('kateter_urin')),
    at(20, dx('hpp_atonia', 'syok_hemoragik')),
    at(25, give('oksitosin', 'im', 10), still((_v, p) => p.physio.v.atony > 0.3)),
    at(50, dispo('hcu_icu')),
  ],
  debrief: {
    ringkasan: 'Perdarahan pascapersalinan primer (> 500 ml pervaginam/> 1.000 ml) akibat atonia uteri (Tone) — penyebab tersering (4T: Tone, Trauma, Tissue, Thrombin). Faktor risiko: grande multipara, bayi besar, partus lama.',
    tatalaksana: [
      'Minta bantuan; ABC; dua kanul besar, crossmatch, kristaloid hangat, O₂.',
      'Masase fundus + oksitosin 10 IU IM/IV pelan lalu infus 20–40 IU dalam 1 L.',
      'Asam traneksamat 1 g IV dalam 10 menit ≤ 3 jam (ulang 1 g bila masih berdarah setelah 30 menit).',
      'Uterotonika tambahan: misoprostol 800 mcg SL; metilergometrin 0,2 mg IM bila tidak hipertensi.',
      'Kompresi bimanual/kompresi aorta, kateter urin, cari 4T (robekan, sisa plasenta, koagulopati).',
      'Transfusi; refrakter → tindakan bedah (B-Lynch, ligasi arteri uterina, histerektomi).',
    ],
    jebakan: ['Metilergometrin pada preeklampsia.', 'Menunda asam traneksamat.', 'Meremehkan kehilangan darah (ibu muda kompensasi baik sampai tiba-tiba kolaps).'],
    referensi: ['WHO recommendations on the assessment of postpartum blood loss and use of a treatment bundle for PPH (2023)', 'WOMAN trial (Lancet 2017)', 'POGI — PNPK Perdarahan Pascasalin (2016)'],
  },
};

// ---------------------------------------------------------------------------
// Kasus ringan — latihan triase & menghindari pemeriksaan/terapi tanpa indikasi
// ---------------------------------------------------------------------------

const LOW: Pick<EdScenario, 'harmful'> = { harmful: [] };

export const KOLIK_RENAL: EdScenario = {
  id: 'kolik_renal',
  title: 'Kolik renal (batu ureter)',
  category: 'ringan',
  difficulty: 1,
  ats: 3,
  atsAcceptable: [2],
  patient: { sex: 'male', age: [25, 50] },
  arrival: { mode: 'jalan', by: 'keluarga', complaint: 'Nyeri pinggang kanan hebat hilang-timbul menjalar ke lipat paha sejak 2 jam, mual, gelisah.' },
  physio: { v: { pain: 0.85, anxiety: 0.55 } },
  informants: {
    pasien: {
      topics: {
        keluhan_utama: 'Pinggang kanan sakit sekali, Dok, sampai tidak bisa diam.',
        onset: 'Dua jam lalu tiba-tiba, hilang-timbul.',
        lokasi: 'Pinggang kanan menjalar ke perut bawah dan selangkangan.',
        karakter: 'Melilit, datang bergelombang.',
        keparahan: 'Sembilan dari sepuluh.',
        riwayat_penyakit: 'Dulu pernah kencing berpasir.',
        riwayat_obat: 'Tidak ada.',
        alergi: 'Tidak ada alergi obat.',
        kebiasaan: 'Jarang minum air, kerja di lapangan.',
        makan_terakhir: 'Siang tadi.',
      },
      symptoms: { nyeri_pinggang: 'Iya, kanan.', mual_muntah: 'Mual, muntah sekali.', kencing_merah: 'Kencingnya agak kemerahan.', demam: 'Tidak demam.', disuria: 'Tidak perih.' },
    },
  },
  findings: { abdomen: 'Supel, nyeri tekan ringan kuadran kanan bawah tanpa defans; nyeri ketok CVA kanan (+).' },
  tests: { urinalisis: { text: 'Eritrosit 25–30/LPB (hematuria mikroskopik), leukosit 2–3/LPB, nitrit (−)' }, fungsi_ginjal: { text: 'Ureum 30 mg/dL · kreatinin 0,9 mg/dL' } },
  diagnosis: { primary: ['kolik_renal'] },
  critical: [
    { id: 'analgesia', label: 'Analgesia segera (NSAID IV/IM lini pertama)', match: any(drug('ketorolak'), drug('morfin'), drug('fentanil'), drug('parasetamol')), byMin: 30, weight: 5, why: 'NSAID mengurangi nyeri kolik lebih baik dengan efek samping lebih sedikit dari opioid.' },
    { id: 'urin', label: 'Urinalisis (hematuria, tanda infeksi)', match: test('urinalisis'), byMin: 60, weight: 2, why: 'Mendukung diagnosis & menyingkirkan infeksi (batu + infeksi = darurat urologi).' },
  ],
  indicatedTests: ['urinalisis', 'fungsi_ginjal'],
  optionalTests: ['darah_lengkap', 'ct_abdomen', 'bhcg'],
  indicatedDrugs: ['ketorolak', 'morfin', 'fentanil', 'parasetamol', 'ondansetron'],
  ...LOW,
  stable: (v, p, now) => alive(v, p) && eff(p, 'pain', now) < 0.5 && v.hr <= 100,
  disposition: { best: ['pulang'], acceptable: ['bangsal'] },
  expert: [
    at(0, triage(3, 'A2')),
    ...primary(0.3),
    at(2, doProc('iv')),
    ivAgain(6.5),
    at(6, give('ketorolak', 'iv', 30)),
    at(7, give('ondansetron', 'iv', 4)),
    at(8, order('urinalisis')),
    at(8.5, order('fungsi_ginjal')),
    at(9, { type: 'periksa', exam: 'abdomen' }),
    at(20, dx('kolik_renal')),
    at(55, dispo('pulang')),
  ],
  debrief: {
    ringkasan: 'Kolik renal: nyeri pinggang kolik hebat menjalar ke lipat paha, pasien gelisah tidak bisa diam, hematuria. Tanda bahaya: demam (obstruksi + infeksi), ginjal tunggal, nyeri tak terkendali, AKI.',
    tatalaksana: [
      'Analgesia segera: NSAID (ketorolak 15–30 mg IV/IM) lini pertama; opioid bila kontraindikasi/tidak cukup.',
      'Urinalisis, fungsi ginjal; pencitraan (USG/CT non-kontras) bila diagnosis ragu, tanda bahaya, atau nyeri berulang.',
      'Pulang dengan analgesik, alfa-bloker (tamsulosin) untuk batu distal, minum cukup, kontrol urologi; kembali bila demam/nyeri tak tertahankan.',
    ],
    jebakan: ['Menahan analgesik sampai diagnosis pasti.', 'Melewatkan tanda infeksi (demam) pada batu yang menyumbat.'],
    referensi: ['EAU Guidelines on Urolithiasis 2024', 'IAUI — Panduan Penatalaksanaan Klinis Batu Saluran Kemih'],
  },
};

export const VULNUS: EdScenario = {
  id: 'vulnus_laceratum',
  title: 'Luka robek telapak tangan (vulnus laceratum)',
  category: 'ringan',
  difficulty: 1,
  ats: 4,
  atsAcceptable: [3, 5],
  patient: { sex: 'acak', age: [18, 50] },
  arrival: { mode: 'jalan', by: 'sendiri', complaint: 'Telapak tangan kiri tersayat pisau dapur 1 jam lalu; perdarahan sudah berhenti setelah ditekan.' },
  physio: { v: { pain: 0.3, anxiety: 0.3 } },
  informants: {
    pasien: {
      topics: {
        keluhan_utama: 'Tangan saya tersayat pisau, Dok.',
        kejadian: 'Waktu memotong daging, pisaunya meleset ke telapak tangan kiri.',
        onset: 'Sejam yang lalu.',
        riwayat_penyakit: 'Tidak ada diabetes atau penyakit lain.',
        riwayat_obat: 'Tidak minum obat pengencer darah.',
        alergi: 'Tidak ada alergi obat bius.',
        kebiasaan: 'Imunisasi tetanus terakhir waktu SD.',
      },
      symptoms: { luka_robek: 'Iya, lukanya agak dalam.', kesemutan: 'Jari tidak kesemutan, bisa digerakkan semua.' },
    },
  },
  injuries: {
    wounds: [{ id: 'vl_telapak', kind: 'iris', region: 'telapak_tangan', side: 'kiri', at: 0.55, face: 0, size: [3, 0.45], angle: 70, depth: 'subkutis', label: 'Luka robek telapak tangan kiri 3 cm, tepi rata, dasar subkutis' }],
  },
  findings: { luka: 'Luka robek telapak tangan kiri 3 cm, tepi rata, dasar subkutis, tidak ada perdarahan aktif, tidak ada benda asing; fleksi-ekstensi semua jari normal, sensibilitas & CRT distal baik.' },
  diagnosis: { primary: ['vulnus'] },
  critical: [
    { id: 'inspeksi', label: 'Inspeksi luka & status neurovaskular/tendon', match: { kind: 'exam', id: 'luka' }, byMin: 60, weight: 2, why: 'Menyingkirkan cedera tendon/saraf/pembuluh darah.' },
    { id: 'irigasi', label: 'Irigasi & pembersihan luka', match: proc('rawat_luka'), byMin: 90, weight: 2, why: 'Mengurangi infeksi.' },
    { id: 'jahit', label: 'Hecting dengan anestesi lokal', match: proc('jahit_luka'), byMin: 120, weight: 3, why: 'Luka bersih < 6–8 jam: penutupan primer.' },
    { id: 'tetanus', label: 'Profilaksis tetanus (TT/Td)', match: drug('tetanus'), byMin: 120, weight: 2, why: 'Imunisasi terakhir > 10 tahun.' },
  ],
  indicatedTests: [],
  optionalTests: ['rontgen_ekstremitas'],
  indicatedDrugs: ['tetanus', 'lidokain', 'parasetamol'],
  harmful: [{ id: 'antibiotik_luka_bersih', label: 'Antibiotik IV pada luka bersih sederhana', match: any(drug('seftriakson'), drug('meropenem'), drug('sefazolin')), severity: 'ringan', why: 'Tidak diperlukan pada luka bersih tanpa faktor risiko.' }],
  stable: (v, p) => alive(v, p) && v.hr <= 100,
  disposition: { best: ['pulang'] },
  expert: [
    at(0, triage(4, 'K1')),
    at(1, ex('C')),
    at(1.5, { type: 'periksa', exam: 'luka' }),
    at(3, doProc('rawat_luka')),
    at(11, give('lidokain', 'sc', 60)),
    at(12, doProc('jahit_luka')),
    at(33, give('tetanus', 'im', 0.5)),
    at(34, dx('vulnus')),
    at(40, dispo('pulang')),
  ],
  debrief: {
    ringkasan: 'Luka robek bersih sederhana tanpa cedera struktur dalam — prioritas rendah, tetapi perlu penilaian neurovaskular & tendon, perawatan luka yang baik, dan profilaksis tetanus.',
    tatalaksana: ['Hentikan perdarahan, nilai neurovaskular & fungsi tendon.', 'Irigasi (NaCl/air bersih mengalir), eksplorasi, anestesi lokal (lidokain ≤ 4,5 mg/kg), jahit primer bila < 6–8 jam & bersih.', 'Profilaksis tetanus sesuai status imunisasi; antibiotik tidak rutin.', 'Edukasi perawatan & kontrol lepas jahitan (tangan 7–10 hari).'],
    jebakan: ['Lupa memeriksa fungsi tendon fleksor.', 'Antibiotik rutin.'],
    referensi: ['ATLS® 10th Edition (2018) — Chapter 8: Musculoskeletal Trauma', 'Kemenkes RI — Pedoman Penatalaksanaan Tetanus & Profilaksis Luka'],
  },
};

export const SPRAIN: EdScenario = {
  id: 'sprain_ankle',
  title: 'Sprain pergelangan kaki (Ottawa ankle rule negatif)',
  category: 'ringan',
  difficulty: 1,
  ats: 4,
  atsAcceptable: [5],
  patient: { sex: 'acak', age: [16, 35] },
  arrival: { mode: 'jalan', by: 'sendiri', complaint: 'Terkilir saat main futsal 2 jam lalu; pergelangan kaki kanan bengkak, masih bisa berjalan pincang.' },
  physio: { v: { pain: 0.35, anxiety: 0.2 } },
  informants: {
    pasien: {
      topics: { keluhan_utama: 'Kaki kanan terkilir, Dok.', kejadian: 'Main futsal, kaki kanan terpelintir ke dalam waktu mendarat.', onset: 'Dua jam lalu.', riwayat_penyakit: 'Sehat.', alergi: 'Tidak ada.', riwayat_obat: 'Tidak ada.' },
      symptoms: { sendi_bengkak: 'Bengkak di mata kaki luar.', nyeri_otot_sendi: 'Sakit kalau ditapakkan, tapi masih bisa jalan.' },
    },
  },
  injuries: {
    wounds: [
      { id: 'bengkak_ankle', kind: 'bengkak', region: 'pergelangan_kaki', side: 'kanan', at: 0.5, face: 85, size: [7, 6], label: 'Bengkak pergelangan kaki kanan sisi lateral' },
      { id: 'memar_ankle', kind: 'memar', region: 'pergelangan_kaki', side: 'kanan', at: 0.62, face: 95, size: [5, 4], ageHours: 3, label: 'Memar di bawah maleolus lateral kanan' },
    ],
    expose: { legs: { kanan: 0.72 } },
  },
  findings: { pelvis_ekstremitas: 'Pergelangan kaki kanan bengkak & nyeri di ligamen talofibular anterior; TIDAK ada nyeri tekan tulang di tepi posterior/ujung maleolus lateral & medial, basis metatarsal V, maupun navikular; mampu menumpu 4 langkah. Nadi distal baik.' },
  diagnosis: { primary: ['sprain'] },
  critical: [
    { id: 'periksa', label: 'Pemeriksaan ekstremitas (Ottawa ankle rule)', match: { kind: 'exam', id: 'pelvis_ekstremitas' }, byMin: 60, weight: 3, why: 'Menentukan perlu tidaknya rontgen.' },
    { id: 'analgesia', label: 'Analgesia', match: ANALGESIC, byMin: 90, weight: 2, why: 'Nyeri sedang.' },
    { id: 'bidai', label: 'Imobilisasi/elastic bandage', match: proc('bidai'), byMin: 120, weight: 1, why: 'Kenyamanan & proteksi.' },
  ],
  indicatedTests: [],
  optionalTests: [],
  indicatedDrugs: ['parasetamol', 'ketorolak'],
  harmful: [],
  stable: (v, p) => alive(v, p),
  disposition: { best: ['pulang'] },
  expert: [
    at(0, triage(4, 'K2')),
    at(1, { type: 'periksa', exam: 'pelvis_ekstremitas' }),
    at(3, give('parasetamol', 'po', 1000)),
    at(4, doProc('bidai')),
    at(10, dx('sprain')),
    at(20, dispo('pulang')),
  ],
  debrief: {
    ringkasan: 'Sprain pergelangan kaki lateral: Ottawa ankle rule negatif (tidak ada nyeri tulang pada titik kunci & mampu menumpu 4 langkah) → rontgen tidak diperlukan.',
    tatalaksana: ['Terapkan Ottawa ankle/foot rules sebelum meminta rontgen.', 'Analgesia (parasetamol/NSAID), RICE/PEACE & LOVE, imobilisasi singkat bila perlu.', 'Mobilisasi dini & latihan; kontrol bila tidak membaik 1–2 minggu.'],
    jebakan: ['Rontgen rutin pada semua cedera pergelangan kaki (paparan radiasi & biaya tanpa manfaat).'],
    referensi: ['Stiell IG, et al. Ottawa ankle rules. JAMA 1993/1994', 'NICE CKS — Sprains and strains (2022)'],
  },
};

export const FARINGITIS: EdScenario = {
  id: 'faringitis',
  title: 'Faringitis akut viral',
  category: 'ringan',
  difficulty: 1,
  ats: 5,
  atsAcceptable: [4],
  patient: { sex: 'acak', age: [18, 40] },
  arrival: { mode: 'jalan', by: 'sendiri', complaint: 'Nyeri menelan dan demam ringan sejak 2 hari, batuk pilek.' },
  physio: { v: { temp: 37.9, pain: 0.2, anxiety: 0.15 } },
  informants: {
    pasien: {
      topics: { keluhan_utama: 'Tenggorokan sakit untuk menelan, Dok.', onset: 'Dua hari ini.', riwayat_penyakit: 'Sehat.', alergi: 'Tidak ada.', riwayat_obat: 'Sudah minum parasetamol kemarin.', keluhan_lain: 'Pilek dan batuk sedikit.' },
      symptoms: { nyeri_tenggorokan: 'Iya, sakit menelan.', demam: 'Sumeng.', batuk: 'Batuk sedikit.', pilek: 'Pilek, ingus bening.', sesak_napas: 'Tidak sesak.', sulit_menelan: 'Masih bisa makan & minum, cuma sakit.' },
    },
  },
  findings: { kepala_leher: 'Faring hiperemis, tonsil T1–T1 tanpa eksudat, tidak ada pembesaran KGB leher yang nyeri; tidak ada trismus/stridor/drooling.' },
  diagnosis: { primary: ['faringitis'] },
  critical: [
    { id: 'periksa', label: 'Pemeriksaan kepala-leher (tanda bahaya: abses, epiglotitis)', match: { kind: 'exam', id: 'kepala_leher' }, byMin: 90, weight: 3, why: 'Menyingkirkan kegawatan jalan napas.' },
    { id: 'simptomatik', label: 'Terapi simptomatik (parasetamol)', match: drug('parasetamol'), byMin: 120, weight: 2, why: 'Faringitis viral (Centor rendah) — tidak perlu antibiotik.' },
  ],
  indicatedTests: [],
  optionalTests: [],
  indicatedDrugs: ['parasetamol'],
  harmful: [{ id: 'antibiotik_viral', label: 'Antibiotik pada faringitis viral', match: any(drug('seftriakson'), drug('meropenem'), drug('sefazolin')), severity: 'ringan', why: 'Skor Centor rendah (batuk +, tanpa eksudat) — antibiotik tidak bermanfaat.' }],
  stable: (v, p) => alive(v, p),
  disposition: { best: ['pulang'] },
  expert: [
    at(0, triage(5, 'K1')),
    at(1, ex('A')),
    at(1.3, { type: 'periksa', exam: 'kepala_leher' }),
    at(3, give('parasetamol', 'po', 500)),
    at(4, dx('faringitis')),
    at(10, dispo('pulang')),
  ],
  debrief: {
    ringkasan: 'Faringitis akut dengan gambaran viral (batuk, pilek, tanpa eksudat) — kasus tidak urgen (ATS 5). Pastikan tidak ada tanda bahaya jalan napas.',
    tatalaksana: ['Nilai tanda bahaya: stridor, drooling, trismus, suara "hot potato", tidak bisa menelan (abses peritonsil/epiglotitis).', 'Skor Centor/McIsaac untuk menentukan perlu tidaknya antibiotik.', 'Simptomatik: analgesik-antipiretik, hidrasi; edukasi.'],
    jebakan: ['Antibiotik rutin untuk nyeri tenggorok.', 'Menempatkan kasus tidak urgen di bed resusitasi.'],
    referensi: ['NICE NG84 — Sore throat (acute): antimicrobial prescribing (2018)', 'IDSA Clinical Practice Guideline for Group A Streptococcal Pharyngitis (2012)'],
  },
};

export const SERANGAN_PANIK: EdScenario = {
  id: 'serangan_panik',
  title: 'Serangan panik dengan hiperventilasi',
  category: 'ringan',
  difficulty: 2,
  ats: 3,
  atsAcceptable: [2],
  patient: { sex: 'female', age: [19, 32] },
  arrival: { mode: 'dipapah', by: 'keluarga', complaint: 'Dada terasa sesak & berdebar, kesemutan di tangan dan sekitar mulut, merasa akan mati, sejak 30 menit.' },
  physio: { v: { anxiety: 0.95 } },
  step: (pt, dtMin) => {
    // Gejala mereda perlahan setelah ditenangkan & diperiksa.
    const p = pt.physio;
    if (Object.keys(pt.exams).length >= 3) p.v.anxiety = Math.max(0.3, p.v.anxiety - 0.02 * dtMin);
  },
  informants: {
    pasien: {
      topics: {
        keluhan_utama: 'Dada sesak, jantung berdebar, saya takut mati, Dok!',
        onset: 'Setengah jam lalu tiba-tiba, waktu di kantor setelah dimarahi atasan.',
        episode_sebelumnya: 'Pernah dua kali seperti ini, diperiksa jantung katanya normal.',
        riwayat_penyakit: 'Tidak ada penyakit jantung atau asma.',
        riwayat_obat: 'Tidak minum obat. Tidak pakai pil KB.',
        alergi: 'Tidak ada.',
        haid_kehamilan: 'Tidak hamil, haid teratur.',
        kebiasaan: 'Tidak merokok. Minum kopi 3 gelas sehari.',
        riwayat_keluarga: 'Tidak ada keluarga yang meninggal mendadak.',
      },
      symptoms: { nyeri_dada: 'Sesak di dada, bukan sakit ditindih.', berdebar: 'Berdebar kencang.', kesemutan: 'Tangan dan sekitar mulut kesemutan.', sesak_napas: 'Rasanya tidak bisa menarik napas penuh.', cemas: 'Takut sekali.', nyeri_betis: 'Tidak.' },
    },
  },
  findings: { E: 'Tangan dingin & berkeringat, spasme karpopedal ringan.' },
  diagnosis: { primary: ['hiperventilasi'] },
  critical: [
    { id: 'ekg', label: 'EKG 12 sadapan (singkirkan SKA/aritmia)', match: test('ekg'), byMin: 15, weight: 4, why: 'Nyeri dada & berdebar harus disingkirkan dari penyebab kardiak sebelum disimpulkan panik.' },
    { id: 'gds', label: 'Gula darah', match: test('gds'), byMin: 30, weight: 1, why: 'Hipoglikemia dapat menyerupai serangan panik.' },
    { id: 'abcde', label: 'Survei primer untuk menyingkirkan kegawatan', match: { kind: 'all', of: [{ kind: 'exam', id: 'B' }, { kind: 'exam', id: 'C' }] }, byMin: 15, weight: 2, why: 'Diagnosis eksklusi.' },
  ],
  indicatedTests: ['ekg', 'gds'],
  optionalTests: ['troponin', 'agd', 'elektrolit', 'bhcg'],
  indicatedDrugs: [],
  harmful: [
    { id: 'nrm_panik', label: 'Oksigen aliran tinggi pada hiperventilasi dengan SpO₂ normal', match: o2(0.5), when: (c) => (c.vitals.spo2 ?? 0) >= 95, severity: 'ringan', why: 'Tidak bermanfaat; tenangkan & atur napas.' },
    { id: 'ct_panik', label: 'CT tanpa indikasi', match: any(test('ct_kepala'), test('ct_abdomen')), severity: 'ringan', why: 'Tidak ada indikasi.' },
  ],
  stable: (v, p) => alive(v, p) && v.hr <= 105 && v.rr <= 24,
  disposition: { best: ['pulang'] },
  expert: [
    at(0, triage(3, 'A2')),
    ...primary(0.3),
    at(1.5, doProc('monitor')),
    at(2, order('ekg')),
    at(2.3, order('gds')),
    at(8, dx('hiperventilasi')),
    at(50, dispo('pulang')),
  ],
  debrief: {
    ringkasan: 'Serangan panik dengan hiperventilasi (alkalosis respiratorik: kesemutan perioral, spasme karpopedal). Diagnosis eksklusi — EKG & pemeriksaan dasar wajib sebelum menyimpulkan.',
    tatalaksana: ['Survei primer, EKG 12 sadapan, GDS; pertimbangkan troponin/emboli paru bila ada faktor risiko.', 'Tenangkan, ajarkan napas lambat diafragmatik (tidak menggunakan kantong kertas).', 'Edukasi & rujuk layanan kesehatan jiwa bila berulang.'],
    jebakan: ['Langsung melabeli "panik" tanpa EKG.', 'O₂ aliran tinggi & pemeriksaan CT tanpa indikasi.'],
    referensi: ['ESC 2023 ACS Guidelines (evaluasi nyeri dada)', 'NICE CG113 — Generalised anxiety disorder and panic disorder in adults (2011, update 2020)'],
  },
};

export const GASTROENTERITIS: EdScenario = {
  id: 'gastroenteritis_ringan',
  title: 'Gastroenteritis akut tanpa dehidrasi berat',
  category: 'ringan',
  difficulty: 1,
  ats: 4,
  atsAcceptable: [3, 5],
  patient: { sex: 'acak', age: [18, 45] },
  arrival: { mode: 'jalan', by: 'sendiri', complaint: 'Mencret 5 kali sejak pagi dan mual; masih bisa minum.' },
  physio: { v: { volume: 0.96, leak: 0.0002, anxiety: 0.2 }, dehydration: 0.2 },
  step: (pt) => {
    if (pt.physio.doses.oralit) pt.physio.v.leak = 0.0001;
  },
  informants: {
    pasien: {
      topics: { keluhan_utama: 'Mencret dan mual, Dok.', onset: 'Sejak pagi, sudah lima kali.', kejadian: 'Semalam makan di warung pinggir jalan.', riwayat_penyakit: 'Sehat.', alergi: 'Tidak ada.', riwayat_obat: 'Belum minum obat.', makan_terakhir: 'Pagi tadi sedikit.' },
      symptoms: { diare: 'Cair, tidak ada darah atau lendir.', mual_muntah: 'Mual, muntah sekali.', demam: 'Tidak demam.', haus: 'Agak haus.', nyeri_perut: 'Mulas sedikit.' },
    },
  },
  findings: { abdomen: 'Supel, bising usus meningkat, nyeri tekan ringan difus tanpa defans.' },
  diagnosis: { primary: ['gastroenteritis'] },
  critical: [
    { id: 'oralit', label: 'Rehidrasi oral (oralit)', match: drug('oralit'), byMin: 60, weight: 4, why: 'Dehidrasi ringan–sedang: rehidrasi oral cukup.' },
    { id: 'abdomen', label: 'Pemeriksaan abdomen (singkirkan akut abdomen)', match: { kind: 'exam', id: 'abdomen' }, byMin: 60, weight: 2, why: 'Tanda bahaya: nyeri terlokalisasi, defans.' },
  ],
  indicatedTests: [],
  optionalTests: ['elektrolit', 'darah_lengkap'],
  indicatedDrugs: ['oralit', 'ondansetron', 'zinc'],
  harmful: [{ id: 'antibiotik_ge', label: 'Antibiotik pada diare cair akut tanpa tanda disentri', match: any(drug('seftriakson'), drug('meropenem')), severity: 'ringan', why: 'Umumnya virus/toksin — antibiotik tidak bermanfaat.' }],
  stable: (v, p) => alive(v, p) && v.hr <= 105,
  disposition: { best: ['pulang'] },
  expert: [
    at(0, triage(4, 'K1')),
    at(1, ex('C')),
    at(1.5, { type: 'periksa', exam: 'abdomen' }),
    at(3, give('ondansetron', 'po', 4)),
    at(4, give('oralit', 'po', 400)),
    at(5, dx('gastroenteritis')),
    at(30, dispo('pulang')),
  ],
  debrief: {
    ringkasan: 'Gastroenteritis akut dengan dehidrasi ringan–sedang: masih bisa minum, hemodinamik stabil. Kasus semi-urgen — jangan menghabiskan sumber daya resusitasi.',
    tatalaksana: ['Nilai derajat dehidrasi & tanda bahaya (darah di tinja, demam tinggi, nyeri hebat, lansia/imunokompromais).', 'Rehidrasi oral (oralit), antiemetik bila perlu.', 'Edukasi tanda dehidrasi & kapan kembali; IV hanya bila gagal oral/dehidrasi berat.'],
    jebakan: ['Infus & lab rutin pada pasien yang bisa minum.', 'Antibiotik rutin.'],
    referensi: ['WHO — The treatment of diarrhoea (2005)', 'IDSA 2017 Guidelines for the Diagnosis and Management of Infectious Diarrhea'],
  },
};

export const OBSTETRI_RINGAN: EdScenario[] = [EKLAMPSIA, PERDARAHAN_POSTPARTUM, KOLIK_RENAL, VULNUS, SPRAIN, FARINGITIS, SERANGAN_PANIK, GASTROENTERITIS];

