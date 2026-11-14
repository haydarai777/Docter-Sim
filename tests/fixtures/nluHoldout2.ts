import type { NluCase } from './nluCorpus';

/**
 * Korpus UJI TERPISAH ronde 2 (held-out) untuk benchmark NLU offline.
 *
 * Ditulis SETELAH penyetelan memakai `nluCorpus.ts` dan `nluHoldout.ts` (ronde 1), tanpa
 * mencocokkan ke daftar kata kunci. Gayanya sengaja berbeda: bahasa daerah ("mumet", "meriang"),
 * istilah medis ("febris"), urutan kata terbalik, pertanyaan panjang, dan salah ketik.
 * Angka akurasi korpus ini = perkiraan paling jujur untuk pertanyaan pemain yang belum pernah dilihat.
 */

const T = (id: string) => `T:${id}`;
const S = (id: string) => `S:${id}`;
const R = (id: string) => `R:${id}`;
const D = (symptom: string, topic: string) => `D:${symptom}/${topic}`;

export const NLU_HOLDOUT_2: NluCase[] = [
  // --- Keluhan utama ---
  { q: 'Keluhan utamanya apa, Bu?', expect: [T('keluhan_utama')] },
  { q: 'Apa yang Bapak rasakan sekarang?', expect: [T('keluhan_utama')] },
  { q: 'Silakan, apa keluhannya?', expect: [T('keluhan_utama')] },
  { q: 'Datang ke sini karena apa?', expect: [T('keluhan_utama')] },
  { q: 'Sakitnya apa, Dek?', expect: [T('keluhan_utama')] },

  // --- Onset ---
  { q: 'Mulainya sejak kapan, Bu?', expect: [T('onset')] },
  { q: 'Keluhan ini sudah berapa lama?', expect: [T('onset')] },
  { q: 'Sejak kemarin?', expect: [T('onset')] },
  { q: 'Udah lama?', expect: [T('onset')] },
  { q: 'Baru hari ini atau sudah lama?', expect: [T('onset')] },
  { q: 'Sudah 5 hari ya, Pak?', expect: [T('onset')] },
  { q: 'Sakitnya baru tadi pagi?', expect: [T('onset')] },
  { q: 'Kapan terakhir merasa sehat?', expect: [T('onset')] },

  // --- Lokasi ---
  { q: 'Nyerinya di sebelah mana, Bu?', expect: [T('lokasi')] },
  { q: 'Bisa tunjukkan lokasinya?', expect: [T('lokasi')] },
  { q: 'Sakitnya menjalar?', expect: [T('lokasi')] },
  { q: 'Di perut sebelah mana?', expect: [T('lokasi')] },
  { q: 'Paling sakit di titik mana?', expect: [T('lokasi')] },

  // --- Karakter ---
  { q: 'Sakitnya kayak apa, Pak? Ditusuk, diremas, atau panas?', expect: [T('karakter')] },
  { q: 'Nyerinya seperti apa?', expect: [T('karakter')] },
  { q: 'Rasa nyerinya bagaimana?', expect: [T('karakter')] },
  { q: 'Perih atau melilit?', expect: [T('karakter')] },
  { q: 'Sakitnya cekot-cekot?', expect: [T('karakter')] },

  // --- Keparahan ---
  { q: 'Seberapa parah sakitnya?', expect: [T('keparahan')] },
  { q: 'Kalau diberi nilai 0 sampai 10, berapa?', expect: [T('keparahan')] },
  { q: 'Masih bisa beraktivitas seperti biasa?', expect: [T('keparahan')] },
  { q: 'Sampai tidak bisa tidur?', expect: [T('keparahan')] },

  // --- Pola & durasi ---
  { q: 'Sakitnya hilang timbul?', expect: [T('pola')] },
  { q: 'Kumat-kumatan?', expect: [T('pola')] },
  { q: 'Biasanya muncul kapan?', expect: [T('pola')] },
  { q: 'Lebih sering kambuh malam hari?', expect: [T('pola')] },
  { q: 'Nyerinya berlangsung berapa lama tiap kali?', expect: [T('durasi')] },
  { q: 'Lamanya berapa menit setiap serangan?', expect: [T('durasi')] },

  // --- Progresi ---
  { q: 'Sakitnya makin parah dari hari ke hari?', expect: [T('progresi')] },
  { q: 'Ada perubahan sejak pertama muncul?', expect: [T('progresi')] },
  { q: 'Bertambah berat?', expect: [T('progresi')] },

  // --- Pemberat / peringan ---
  { q: 'Ada yang membuat sakitnya lebih ringan?', expect: [T('pemberat_peringan')] },
  { q: 'Kalau ditekan sakit?', expect: [T('pemberat_peringan')] },
  { q: 'Sakitnya bertambah kalau batuk?', expect: [T('pemberat_peringan')] },
  { q: 'Posisi apa yang paling nyaman?', expect: [T('pemberat_peringan')] },
  { q: 'Kalau istirahat hilang?', expect: [T('pemberat_peringan')] },

  // --- Keluhan lain ---
  { q: 'Ada lagi yang dirasakan?', expect: [T('keluhan_lain')] },
  { q: 'Keluhan lain apa saja?', expect: [T('keluhan_lain')] },
  { q: 'Yang lain ada?', expect: [T('keluhan_lain')] },
  { q: 'Apa lagi?', expect: [T('keluhan_lain')] },

  // --- Riwayat ---
  { q: 'Pernah mengalami hal serupa?', expect: [T('episode_sebelumnya')] },
  { q: 'Ini pertama kali sakit begini?', expect: [T('episode_sebelumnya')] },
  { q: 'Sering kambuh seperti ini?', expect: [T('episode_sebelumnya')] },
  { q: 'Ada penyakit yang diderita sebelumnya?', expect: [T('riwayat_penyakit')] },
  { q: 'Pernah sakit berat sebelumnya?', expect: [T('riwayat_penyakit')] },
  { q: 'Tensinya biasanya tinggi?', expect: [T('riwayat_penyakit')] },
  { q: 'Gula darahnya pernah tinggi?', expect: [T('riwayat_penyakit')] },
  { q: 'Riwayat maag?', expect: [T('riwayat_penyakit')] },
  { q: 'Ada riwayat operasi?', expect: [T('riwayat_penyakit')] },
  { q: 'Pernah opname?', expect: [T('riwayat_penyakit')] },
  { q: 'Sudah minum obat sebelumnya?', expect: [T('riwayat_obat')] },
  { q: 'Obat apa yang sudah diminum?', expect: [T('riwayat_obat')] },
  { q: 'Ada obat rutin dari dokter?', expect: [T('riwayat_obat')] },
  { q: 'Sudah dikasih obat apa di puskesmas?', expect: [T('riwayat_obat')] },
  { q: 'Minum parasetamol?', expect: [T('riwayat_obat')] },
  { q: 'Sering minum jamu pegal linu?', expect: [T('riwayat_obat')] },
  { q: 'Alergi obat tertentu?', expect: [T('alergi')] },
  { q: 'Pernah alergi antibiotik?', expect: [T('alergi')] },
  { q: 'Di keluarga ada yang punya penyakit gula?', expect: [T('riwayat_keluarga')] },
  { q: 'Orang serumah ada yang batuk?', expect: [T('riwayat_keluarga')] },
  { q: 'Ada riwayat penyakit keturunan?', expect: [T('riwayat_keluarga')] },
  { q: 'Teman kerja ada yang sakit sama?', expect: [T('riwayat_keluarga')] },

  // --- Lingkungan & kebiasaan ---
  { q: 'Belakangan ini ke mana saja?', expect: [T('bepergian_lingkungan')] },
  { q: 'Habis liburan?', expect: [T('bepergian_lingkungan')] },
  { q: 'Rumahnya sering banjir?', expect: [T('bepergian_lingkungan')] },
  { q: 'Pernah menginap di hutan?', expect: [T('bepergian_lingkungan')] },
  { q: 'Ngerokok, Pak?', expect: [T('kebiasaan')] },
  { q: 'Sehari habis berapa bungkus rokok?', expect: [T('kebiasaan')] },
  { q: 'Suka minum alkohol?', expect: [T('kebiasaan')] },
  { q: 'Makannya sering telat?', expect: [T('kebiasaan')] },
  { q: 'Sering minum kopi atau teh?', expect: [T('kebiasaan')] },
  { q: 'Tidurnya cukup?', expect: [T('kebiasaan')] },

  // --- Identitas & perspektif ---
  { q: 'Boleh tahu namanya?', expect: [T('identitas_nama')] },
  { q: 'Namanya siapa, Dek?', expect: [T('identitas_nama')] },
  { q: 'Usia Bapak berapa?', expect: [T('identitas_umur')] },
  { q: 'Tahun ini umur berapa?', expect: [T('identitas_umur')] },
  { q: 'Pekerjaannya apa, Pak?', expect: [T('identitas_pekerjaan')] },
  { q: 'Masih sekolah?', expect: [T('identitas_pekerjaan')] },
  { q: 'Sudah berkeluarga?', expect: [T('identitas_status')] },
  { q: 'Tinggal dengan siapa di rumah?', expect: [T('identitas_status')] },
  { q: 'Kira-kira sakit apa menurut Bapak?', expect: [T('pendapat_pasien')] },
  { q: 'Apa yang Ibu khawatirkan?', expect: [T('kekhawatiran')] },
  { q: 'Takut kenapa-kenapa?', expect: [T('kekhawatiran')] },
  { q: 'Harapannya apa dari pemeriksaan ini?', expect: [T('harapan')] },
  { q: 'Kapan terakhir haid?', expect: [T('haid_kehamilan')] },
  { q: 'Siklus haidnya teratur?', expect: [T('haid_kehamilan')] },
  { q: 'Ada kemungkinan hamil?', expect: [T('haid_kehamilan')] },
  { q: 'Telat datang bulan?', expect: [T('haid_kehamilan')] },

  // --- Gejala (awam, daerah, medis) ---
  { q: 'Badannya meriang?', expect: [S('demam')] },
  { q: 'Panas tinggi?', expect: [S('demam')] },
  { q: 'Febris?', expect: [S('demam')] },
  { q: 'Sampai menggigil?', expect: [S('menggigil')] },
  { q: 'Keringat banyak?', expect: [S('berkeringat')] },
  { q: 'Lemah badannya?', expect: [S('lemas')] },
  { q: 'Tidak nafsu makan?', expect: [S('nafsu_makan_turun')] },
  { q: 'Mumet?', expect: [S('nyeri_kepala')] },
  { q: 'Sakit di belakang bola mata?', expect: [S('nyeri_retroorbital')] },
  { q: 'Ngilu-ngilu sendinya?', expect: [S('nyeri_otot_sendi')] },
  { q: 'Badan pegal semua?', expect: [S('nyeri_otot_sendi')] },
  { q: 'Ada rasa mual?', expect: [S('mual_muntah')] },
  { q: 'Muntah berapa kali?', expect: [D('mual_muntah', 'pola')] },
  { q: 'Ada ruam kemerahan?', expect: [S('bintik_merah')] },
  { q: 'Kulitnya menguning?', expect: [S('kuning')] },
  { q: 'Ulu hatinya sakit?', expect: [S('nyeri_ulu_hati')] },
  { q: 'Dada seperti terbakar?', expect: [S('heartburn')] },
  { q: 'Sering ada cairan asam naik ke mulut?', expect: [S('regurgitasi')] },
  { q: 'Napasnya sesak?', expect: [S('sesak_napas')] },
  { q: 'Ngos-ngosan kalau jalan?', expect: [D('sesak_napas', 'pemberat_peringan')] },
  { q: 'Ada mengi?', expect: [S('mengi')] },
  { q: 'Nyeri dada saat bernapas dalam?', expect: [S('nyeri_dada_pleuritik')] },
  { q: 'Sering berkeringat di malam hari?', expect: [S('keringat_malam')] },
  { q: 'Badannya makin kurus?', expect: [S('berat_badan_turun')] },
  { q: 'Minum terus karena haus?', expect: [S('haus')] },
  { q: 'Banyak makan tapi kurus?', expect: [S('lapar'), S('berat_badan_turun')] },
  { q: 'Tangan kaki kesemutan?', expect: [S('kesemutan')] },
  { q: 'Matanya buram?', expect: [S('pandangan_kabur')] },
  { q: 'Lukanya susah kering?', expect: [S('luka_sulit_sembuh')] },
  { q: 'Pipis terasa panas?', expect: [S('disuria')] },
  { q: 'Sering kencing malam?', expect: [S('sering_kencing')] },
  { q: 'Sakit di atas kemaluan?', expect: [S('nyeri_suprapubik')] },
  { q: 'Kencingnya berdarah?', expect: [S('kencing_merah')] },
  { q: 'Pernah muntah darah atau seperti kopi?', expect: [S('muntah_darah')] },
  { q: 'BAB-nya hitam seperti aspal?', expect: [S('bab_hitam')] },
  { q: 'Makan terasa nyangkut?', expect: [S('sulit_menelan')] },
  { q: 'Kencingnya pekat?', expect: [S('urin_gelap')] },

  // --- Tinjauan sistem ---
  { q: 'Buang air besarnya bagaimana?', expect: [R('bab')] },
  { q: 'Makan dan minumnya bagaimana?', expect: [R('makan')] },
  { q: 'Pernapasannya ada keluhan?', expect: [R('napas')] },
  { q: 'Beratnya turun atau naik?', expect: [R('berat_badan')] },

  // --- Detail gejala ---
  { q: 'Demamnya sudah berapa hari?', expect: [D('demam', 'onset')] },
  { q: 'Sesaknya sejak kapan?', expect: [D('sesak_napas', 'onset')] },
  { q: 'Diarenya sehari berapa kali?', expect: [D('diare', 'pola')] },
  { q: 'Sakit kepalanya di bagian mana?', expect: [D('nyeri_kepala', 'lokasi')] },
  { q: 'Nyeri perutnya seperti apa?', expect: [D('nyeri_perut', 'karakter')] },
  { q: 'Batuknya makin parah?', expect: [D('batuk', 'progresi')] },
  { q: 'Mualnya kalau makan bertambah?', expect: [D('mual_muntah', 'pemberat_peringan')] },

  // --- Gabungan ---
  { q: 'Demam? Menggigil? Berkeringat?', expect: [S('demam'), S('menggigil'), S('berkeringat')] },
  { q: 'Sejak kapan dan seberapa berat?', expect: [T('onset'), T('keparahan')] },
  { q: 'Punya alergi atau penyakit lain?', expect: [T('alergi'), T('riwayat_penyakit')] },
  { q: 'Merokok atau minum alkohol?', expect: [T('kebiasaan')] },
  { q: 'Batuk dan sesak sejak kapan?', expect: [D('batuk', 'onset'), D('sesak_napas', 'onset')] },

  // --- Basa-basi, aba-aba, minta diulang ---
  { q: 'Pagi, Bu', expect: ['greeting'] },
  { q: 'Selamat datang, silakan duduk', expect: ['greeting'] },
  { q: 'Oke, terima kasih ya Pak', expect: ['thanks'] },
  { q: 'Saya cek tekanan darahnya dulu ya', expect: ['consent'] },
  { q: 'Boleh saya periksa perutnya?', expect: ['consent'] },
  { q: 'Bisa diulang, Pak?', expect: ['repeat'] },
  { q: 'Maaf, tadi gimana?', expect: ['repeat'] },
  { q: 'Hah? Apa?', expect: ['repeat'] },

  // --- Salah ketik ---
  { q: 'Sjak kpn skitnya?', expect: [T('onset')] },
  { q: 'Ada demma?', expect: [S('demam')] },
  { q: 'Batk?', expect: [S('batuk')] },
  { q: 'Mual mutah?', expect: [S('mual_muntah')] },
  { q: 'Diarre?', expect: [S('diare')] },
  { q: 'Sesak nafas?', expect: [S('sesak_napas')] },
  { q: 'Alregi?', expect: [T('alergi')] },
  { q: 'Merkok?', expect: [T('kebiasaan')] },
  { q: 'Kluhan lain?', expect: [T('keluhan_lain')] },
  { q: 'Pusing2 nggak?', expect: [S('nyeri_kepala')] },

  // --- Di luar konteks ---
  { q: 'Tadi ke sini naik apa?', expect: [] },
  { q: 'Lagi musim hujan ya', expect: [] },
  { q: 'Rumahnya jauh dari sini?', expect: [] },
  { q: 'Hobinya apa?', expect: [] },
];
