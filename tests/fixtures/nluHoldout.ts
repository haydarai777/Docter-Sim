import type { NluCase } from './nluCorpus';

/**
 * Korpus UJI TERPISAH (held-out) untuk benchmark NLU offline.
 *
 * Ditulis setelah mesin NLU selesai disetel pada `nluCorpus.ts` dan TIDAK dipakai untuk menyetel
 * kata kunci — angkanya menggambarkan seberapa baik pemahaman menggeneralisasi ke rumusan baru.
 * Beberapa butir sengaja sulit (ambigu, salah ketik ganda, pertanyaan di luar konteks medis).
 * Format sama dengan `nluCorpus.ts`.
 */

const T = (id: string) => `T:${id}`;
const S = (id: string) => `S:${id}`;
const R = (id: string) => `R:${id}`;
const D = (symptom: string, topic: string) => `D:${symptom}/${topic}`;

export const NLU_HOLDOUT: NluCase[] = [
  // --- Keluhan utama ---
  { q: 'Selamat siang Bu, ada keluhan apa hari ini?', expect: [T('keluhan_utama')] },
  { q: 'Apa yang membuat Bapak datang berobat?', expect: [T('keluhan_utama')] },
  { q: 'Keluhannya apa?', expect: [T('keluhan_utama')] },
  { q: 'Ada masalah kesehatan apa?', expect: [T('keluhan_utama')] },
  { q: 'Mau periksa apa, Pak?', expect: [T('keluhan_utama')] },
  { q: 'Silakan duduk. Ada yang bisa saya bantu?', expect: [T('keluhan_utama')] },

  // --- Onset ---
  { q: 'Ini sudah dari kapan?', expect: [T('onset')] },
  { q: 'Pertama kali terasa kapan?', expect: [T('onset')] },
  { q: 'Berapa lama sudah sakit begini?', expect: [T('onset')] },
  { q: 'Sudah lama ya sakitnya?', expect: [T('onset')] },
  { q: 'Kira-kira mulai berapa hari yang lalu?', expect: [T('onset')] },
  { q: 'Sudah 2 minggu?', expect: [T('onset')] },
  { q: 'Sejak tiga hari lalu ya?', expect: [T('onset')] },
  { q: 'Munculnya mendadak?', expect: [T('onset')] },
  { q: 'Sejak kpn?', expect: [T('onset')] },
  { q: 'sejak kapn', expect: [T('onset')] },
  { q: 'Sejka kapan?', expect: [T('onset')] },

  // --- Lokasi ---
  { q: 'Tepatnya di sebelah mana?', expect: [T('lokasi')] },
  { q: 'Coba tunjuk di mana yang paling sakit', expect: [T('lokasi')] },
  { q: 'Nyerinya menyebar ke tempat lain?', expect: [T('lokasi')] },
  { q: 'Lokasinya di mana?', expect: [T('lokasi')] },
  { q: 'Sakitnya di kanan atau kiri?', expect: [T('lokasi')] },

  // --- Karakter ---
  { q: 'Sakitnya seperti apa rasanya?', expect: [T('karakter')] },
  { q: 'Nyerinya kayak ditusuk-tusuk?', expect: [T('karakter')] },
  { q: 'Rasanya melilit atau seperti diremas?', expect: [T('karakter')] },
  { q: 'Coba gambarkan nyerinya', expect: [T('karakter')] },
  { q: 'Seperti ditekan benda berat?', expect: [T('karakter')] },

  // --- Keparahan ---
  { q: 'Sakitnya parah sekali?', expect: [T('keparahan')] },
  { q: 'Sampai tidak bisa kerja?', expect: [T('keparahan')] },
  { q: 'Berat atau ringan sakitnya?', expect: [T('keparahan')] },

  // --- Pola & durasi ---
  { q: 'Sakitnya terus-terusan atau datang pergi?', expect: [T('pola')] },
  { q: 'Paling sering muncul jam berapa?', expect: [T('pola')] },
  { q: 'Dalam sehari berapa kali kambuh?', expect: [T('pola')] },
  { q: 'Sekali sakit berapa lama?', expect: [T('durasi')] },
  { q: 'Tiap serangan berlangsung berapa menit?', expect: [T('durasi')] },
  { q: 'Kalau kambuh lamanya berapa jam?', expect: [T('durasi')] },

  // --- Progresi ---
  { q: 'Makin hari makin berat?', expect: [T('progresi')] },
  { q: 'Sekarang dibanding awal gimana?', expect: [T('progresi')] },
  { q: 'Makin sering kambuhnya?', expect: [T('progresi')] },
  { q: 'Dari awal sampai sekarang ada perubahan?', expect: [T('progresi')] },

  // --- Pemberat / peringan ---
  { q: 'Apa yang membuat sakitnya berkurang?', expect: [T('pemberat_peringan')] },
  { q: 'Kalau dipakai jalan tambah sakit?', expect: [T('pemberat_peringan')] },
  { q: 'Habis makan jadi lebih enak atau lebih sakit?', expect: [T('pemberat_peringan')] },
  { q: 'Kalau tiduran jadi enakan?', expect: [T('pemberat_peringan')] },

  // --- Keluhan lain ---
  { q: 'Ada keluhan lainnya?', expect: [T('keluhan_lain')] },
  { q: 'Selain itu apa lagi yang dirasa?', expect: [T('keluhan_lain')] },
  { q: 'Masih ada keluhan tambahan?', expect: [T('keluhan_lain')] },

  // --- Riwayat ---
  { q: 'Sebelumnya pernah kambuh seperti ini?', expect: [T('episode_sebelumnya')] },
  { q: 'Ada riwayat sakit gula?', expect: [T('riwayat_penyakit')] },
  { q: 'Punya hipertensi?', expect: [T('riwayat_penyakit')] },
  { q: 'Ada penyakit kronis?', expect: [T('riwayat_penyakit')] },
  { q: 'Pernah didiagnosis asma?', expect: [T('riwayat_penyakit')] },
  { q: 'Ada riwayat TB?', expect: [T('riwayat_penyakit')] },
  { q: 'Sudah minum obat apa saja?', expect: [T('riwayat_obat')] },
  { q: 'Sudah diobati belum?', expect: [T('riwayat_obat')] },
  { q: 'Ada obat yang rutin diminum?', expect: [T('riwayat_obat')] },
  { q: 'Konsumsi jamu?', expect: [T('riwayat_obat')] },
  { q: 'Sering minum obat pereda nyeri?', expect: [T('riwayat_obat')] },
  { q: 'Alergi sesuatu?', expect: [T('alergi')] },
  { q: 'Ada alergi makanan atau obat?', expect: [T('alergi')] },
  { q: 'Ada keluarga yang sakit begini juga?', expect: [T('riwayat_keluarga')] },
  { q: 'Orang tua punya darah tinggi?', expect: [T('riwayat_keluarga')] },
  { q: 'Ayah atau ibu ada sakit gula?', expect: [T('riwayat_keluarga')] },
  { q: 'Tetangga ada yang sakit serupa?', expect: [T('riwayat_keluarga')] },

  // --- Lingkungan & kebiasaan ---
  { q: 'Baru pulang dari luar daerah?', expect: [T('bepergian_lingkungan')] },
  { q: 'Di sekitar rumah banyak nyamuk?', expect: [T('bepergian_lingkungan')] },
  { q: 'Ada genangan air di dekat rumah?', expect: [T('bepergian_lingkungan')] },
  { q: 'Pernah ke Papua atau NTT?', expect: [T('bepergian_lingkungan')] },
  { q: 'Suka minum kopi?', expect: [T('kebiasaan')] },
  { q: 'Rokoknya sehari berapa batang?', expect: [T('kebiasaan')] },
  { q: 'Sering makan pedas?', expect: [T('kebiasaan')] },
  { q: 'Olahraga rutin?', expect: [T('kebiasaan')] },
  { q: 'Minum miras?', expect: [T('kebiasaan')] },

  // --- Identitas & perspektif pasien ---
  { q: 'Siapa namanya, Pak?', expect: [T('identitas_nama')] },
  { q: 'Nama lengkapnya?', expect: [T('identitas_nama')] },
  { q: 'Usianya berapa?', expect: [T('identitas_umur')] },
  { q: 'Umur berapa sekarang?', expect: [T('identitas_umur')] },
  { q: 'Kerjanya di mana?', expect: [T('identitas_pekerjaan')] },
  { q: 'Sehari-hari kegiatannya apa?', expect: [T('identitas_pekerjaan')] },
  { q: 'Menurut Ibu ini sakit apa?', expect: [T('pendapat_pasien')] },
  { q: 'Bapak kira penyebabnya apa?', expect: [T('pendapat_pasien')] },
  { q: 'Apa yang paling Ibu takutkan?', expect: [T('kekhawatiran')] },
  { q: 'Ada yang dikhawatirkan?', expect: [T('kekhawatiran')] },
  { q: 'Haid terakhir kapan?', expect: [T('haid_kehamilan')] },
  { q: 'Mungkin sedang hamil?', expect: [T('haid_kehamilan')] },

  // --- Gejala ---
  { q: 'Demam nggak?', expect: [S('demam')] },
  { q: 'Ada menggigil?', expect: [S('menggigil')] },
  { q: 'Keringetan banyak?', expect: [S('berkeringat')] },
  { q: 'Badan lemes?', expect: [S('lemas')] },
  { q: 'Nafsu makannya menurun?', expect: [S('nafsu_makan_turun')] },
  { q: 'Kepala pusing?', expect: [S('nyeri_kepala')] },
  { q: 'Nyeri di belakang mata?', expect: [S('nyeri_retroorbital')] },
  { q: 'Pegel-pegel badannya?', expect: [S('nyeri_otot_sendi')] },
  { q: 'Susah buang air besar?', expect: [S('konstipasi')] },
  { q: 'Ada bintik-bintik merah di kulit?', expect: [S('bintik_merah')] },
  { q: 'Gusinya berdarah?', expect: [S('perdarahan_mukosa')] },
  { q: 'Matanya kuning?', expect: [S('kuning')] },
  { q: 'Cepat kenyang kalau makan?', expect: [S('cepat_kenyang')] },
  { q: 'Dadanya terasa panas?', expect: [S('heartburn')] },
  { q: 'Sering asam naik ke tenggorokan?', expect: [S('regurgitasi')] },
  { q: 'Ada nyeri dada?', expect: [S('nyeri_dada')] },
  { q: 'Nyerinya menjalar ke lengan kiri?', expect: [S('nyeri_menjalar')] },
  { q: 'Napasnya bunyi ngik-ngik?', expect: [S('mengi')] },
  { q: 'Dada sakit kalau tarik napas?', expect: [S('nyeri_dada_pleuritik')] },
  { q: 'Batuk keluar darah?', expect: [S('batuk_darah')] },
  { q: 'Sering keringetan malam-malam?', expect: [S('keringat_malam')] },
  { q: 'Kesemutan di kaki?', expect: [S('kesemutan')] },
  { q: 'Penglihatan kabur?', expect: [S('pandangan_kabur')] },
  { q: 'Kalau luka lama sembuhnya?', expect: [S('luka_sulit_sembuh')] },
  { q: 'Kencingnya perih?', expect: [S('disuria')] },
  { q: 'Sering bolak-balik kencing?', expect: [S('sering_kencing')] },
  { q: 'Nyeri di perut bawah?', expect: [S('nyeri_suprapubik')] },
  { q: 'Pinggangnya sakit?', expect: [S('nyeri_pinggang')] },
  { q: 'Air kencingnya keruh?', expect: [S('urin_keruh')] },
  { q: 'Pernah muntah darah?', expect: [S('muntah_darah')] },
  { q: 'Kencing warna teh?', expect: [S('urin_gelap')] },

  // --- Tinjauan sistem ---
  { q: 'BAB lancar?', expect: [R('bab')] },
  { q: 'Buang air kecilnya gimana?', expect: [R('bak')] },
  { q: 'Napasnya gimana?', expect: [R('napas')] },
  { q: 'Berat badannya ada perubahan?', expect: [R('berat_badan')] },
  { q: 'Perutnya gimana?', expect: [R('perut')] },
  { q: 'Matanya ada keluhan?', expect: [R('mata')] },

  // --- Detail gejala ---
  { q: 'Demamnya sejak kapan?', expect: [D('demam', 'onset')] },
  { q: 'Sudah berapa hari batuknya?', expect: [D('batuk', 'onset')] },
  { q: 'Pusingnya di sebelah mana?', expect: [D('nyeri_kepala', 'lokasi')] },
  { q: 'Demamnya naik turun?', expect: [D('demam', 'pola')] },
  { q: 'Nyeri dadanya seperti ditekan?', expect: [D('nyeri_dada', 'karakter')] },
  { q: 'Sesaknya kalau aktivitas tambah berat?', expect: [D('sesak_napas', 'pemberat_peringan')] },

  // --- Gabungan ---
  { q: 'Mual atau muntah? Diare?', expect: [S('mual_muntah'), S('diare')] },
  { q: 'Ada alergi? Minum obat rutin?', expect: [T('alergi'), T('riwayat_obat')] },
  { q: 'Merokok? Punya darah tinggi?', expect: [T('kebiasaan'), T('riwayat_penyakit')] },
  { q: 'Pusing, mual?', expect: [S('nyeri_kepala'), S('mual_muntah')] },

  // --- Basa-basi, aba-aba, minta diulang ---
  { q: 'Halo Pak', expect: ['greeting'] },
  { q: 'Makasih Bu', expect: ['thanks'] },
  { q: 'Baik, terima kasih atas informasinya', expect: ['thanks'] },
  { q: 'Tolong buka bajunya ya, saya periksa', expect: ['consent'] },
  { q: 'Coba ulangi lagi', expect: ['repeat'] },

  // --- Salah ketik ---
  { q: 'Batukk?', expect: [S('batuk')] },
  { q: 'Mencrat?', expect: [S('diare')] },
  { q: 'Sesk napas?', expect: [S('sesak_napas')] },
  { q: 'Alergu obat?', expect: [T('alergi')] },
  { q: 'Riwayat kluarga?', expect: [T('riwayat_keluarga')] },
  { q: 'Mual muntha?', expect: [S('mual_muntah')] },

  // --- Di luar konteks (harus tidak dipahami) ---
  { q: 'Hari ini cerah ya', expect: [] },
  { q: 'Suka nonton bola?', expect: [] },
  { q: 'Mobilnya parkir di mana?', expect: [] },
];
