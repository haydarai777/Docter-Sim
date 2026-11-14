import type { NluCase } from './nluCorpus';

/**
 * Korpus UJI TERPISAH ronde 3 (held-out) — ukuran akhir generalisasi NLU offline.
 *
 * Ditulis setelah semua penyetelan (korpus penyetelan, ronde 1, ronde 2) dan langsung diukur
 * tanpa mengubah mesin. Gaya: kalimat baku ("Apakah ada …?"), negasi ("Tidak ada demam?"),
 * kata daerah, gabungan gejala, aba-aba pemeriksaan, dan beberapa pertanyaan iseng.
 */

const T = (id: string) => `T:${id}`;
const S = (id: string) => `S:${id}`;
const R = (id: string) => `R:${id}`;
const D = (symptom: string, topic: string) => `D:${symptom}/${topic}`;

export const NLU_HOLDOUT_3: NluCase[] = [
  // --- Keluhan utama ---
  { q: 'Apakah ada yang bisa kami bantu hari ini?', expect: [T('keluhan_utama')] },
  { q: 'Bapak datang dengan keluhan apa?', expect: [T('keluhan_utama')] },
  { q: 'Jadi apa masalahnya, Bu?', expect: [T('keluhan_utama')] },
  { q: 'Ceritakan dari awal ya, Pak', expect: [T('keluhan_utama')] },

  // --- Onset ---
  { q: 'Kira-kira sudah seminggu lebih?', expect: [T('onset')] },
  { q: 'Sejak hari Senin?', expect: [T('onset')] },
  { q: 'Mulai terasanya kapan?', expect: [T('onset')] },
  { q: 'Kapan pertama kali timbul?', expect: [T('onset')] },
  { q: 'Awalnya kapan, Bu?', expect: [T('onset')] },
  { q: 'Sakitnya muncul tiba-tiba?', expect: [T('onset')] },
  { q: 'Sudah sebulan ini?', expect: [T('onset')] },

  // --- Lokasi ---
  { q: 'Letaknya di mana?', expect: [T('lokasi')] },
  { q: 'Yang sakit sebelah kanan?', expect: [T('lokasi')] },
  { q: 'Nyerinya pindah ke perut kanan bawah?', expect: [T('lokasi')] },
  { q: 'Apakah nyerinya menjalar ke punggung?', expect: [T('lokasi')] },

  // --- Karakter ---
  { q: 'Seperti apa rasa sakitnya?', expect: [T('karakter')] },
  { q: 'Rasanya panas seperti terbakar?', expect: [T('karakter')] },
  { q: 'Nyerinya tajam?', expect: [T('karakter')] },
  { q: 'Sakitnya berdenyut-denyut?', expect: [T('karakter')] },

  // --- Keparahan ---
  { q: 'Seberapa berat keluhannya?', expect: [T('keparahan')] },
  { q: 'Kalau dari skala satu sampai sepuluh?', expect: [T('keparahan')] },
  { q: 'Sampai harus istirahat di rumah?', expect: [T('keparahan')] },

  // --- Pola & durasi ---
  { q: 'Munculnya terus atau kadang-kadang?', expect: [T('pola')] },
  { q: 'Kambuhnya tiap hari?', expect: [T('pola')] },
  { q: 'Lebih parah malam?', expect: [T('pola')] },
  { q: 'Jam berapa biasanya kambuh?', expect: [T('pola')] },
  { q: 'Setiap kali kambuh lamanya berapa?', expect: [T('durasi')] },
  { q: 'Sekali serangan berapa menit?', expect: [T('durasi')] },

  // --- Progresi ---
  { q: 'Dari awal sampai sekarang makin berat atau tetap?', expect: [T('progresi')] },
  { q: 'Keluhannya membaik?', expect: [T('progresi')] },
  { q: 'Tambah lama tambah parah?', expect: [T('progresi')] },
  { q: 'Apakah semakin sering?', expect: [T('progresi')] },

  // --- Pemberat / peringan ---
  { q: 'Apa yang memperberat keluhannya?', expect: [T('pemberat_peringan')] },
  { q: 'Kalau makan jadi lebih sakit?', expect: [T('pemberat_peringan')] },
  { q: 'Membaik kalau duduk membungkuk?', expect: [T('pemberat_peringan')] },
  { q: 'Kalau tiduran terlentang tambah sesak?', expect: [D('sesak_napas', 'pemberat_peringan')] },

  // --- Keluhan lain & riwayat ---
  { q: 'Ada keluhan lain yang dirasakan?', expect: [T('keluhan_lain')] },
  { q: 'Selain sakit perut, ada apa lagi?', expect: [T('keluhan_lain')] },
  { q: 'Pernah kambuh sebelumnya?', expect: [T('episode_sebelumnya')] },
  { q: 'Baru sekali ini?', expect: [T('episode_sebelumnya')] },
  { q: 'Bapak punya penyakit menahun?', expect: [T('riwayat_penyakit')] },
  { q: 'Apakah ada riwayat darah tinggi?', expect: [T('riwayat_penyakit')] },
  { q: 'Pernah dioperasi?', expect: [T('riwayat_penyakit')] },
  { q: 'Ada penyakit jantung?', expect: [T('riwayat_penyakit')] },
  { q: 'Diabetes?', expect: [T('riwayat_penyakit')] },
  { q: 'Sudah ada obat yang diminum?', expect: [T('riwayat_obat')] },
  { q: 'Obatnya apa saja yang rutin?', expect: [T('riwayat_obat')] },
  { q: 'Sudah ke dokter sebelumnya?', expect: [T('riwayat_obat')] },
  { q: 'Minum obat warung?', expect: [T('riwayat_obat')] },
  { q: 'Pakai obat herbal?', expect: [T('riwayat_obat')] },
  { q: 'Apakah ada alergi terhadap obat?', expect: [T('alergi')] },
  { q: 'Pernah gatal setelah minum obat tertentu?', expect: [T('alergi')] },
  { q: 'Apakah di keluarga ada yang punya sakit serupa?', expect: [T('riwayat_keluarga')] },
  { q: 'Ada saudara yang kena TBC?', expect: [T('riwayat_keluarga')] },
  { q: 'Di kantor ada yang sakit kayak gini?', expect: [T('riwayat_keluarga')] },

  // --- Lingkungan & kebiasaan ---
  { q: 'Akhir-akhir ini bepergian ke luar kota?', expect: [T('bepergian_lingkungan')] },
  { q: 'Daerah rumah banyak nyamuk?', expect: [T('bepergian_lingkungan')] },
  { q: 'Pulang dari daerah endemis malaria?', expect: [T('bepergian_lingkungan')] },
  { q: 'Tinggalnya di mana sekarang?', expect: [T('bepergian_lingkungan')] },
  { q: 'Ada kebiasaan merokok?', expect: [T('kebiasaan')] },
  { q: 'Sering makan makanan pedas atau asam?', expect: [T('kebiasaan')] },
  { q: 'Ngopi tiap hari?', expect: [T('kebiasaan')] },
  { q: 'Olahraganya bagaimana?', expect: [T('kebiasaan')] },
  { q: 'Suka makan bakso?', expect: [T('kebiasaan')] },

  // --- Identitas & perspektif ---
  { q: 'Ibu umurnya berapa?', expect: [T('identitas_umur')] },
  { q: 'Kerja apa, Mas?', expect: [T('identitas_pekerjaan')] },
  { q: 'Sudah punya anak?', expect: [T('identitas_status')] },
  { q: 'Menurut Bapak, kenapa bisa begini?', expect: [T('pendapat_pasien')] },
  { q: 'Ada yang Ibu cemaskan?', expect: [T('kekhawatiran')] },
  { q: 'Ibu berharap apa dari kunjungan ini?', expect: [T('harapan')] },
  { q: 'Haidnya lancar, Bu?', expect: [T('haid_kehamilan')] },

  // --- Gejala ---
  { q: 'Apakah ada demam?', expect: [S('demam')] },
  { q: 'Tidak ada demam?', expect: [S('demam')] },
  { q: 'Ada keringatan?', expect: [S('berkeringat')] },
  { q: 'Selera makannya berkurang?', expect: [S('nafsu_makan_turun')] },
  { q: 'Sering sakit kepala?', expect: [S('nyeri_kepala')] },
  { q: 'Nyeri otot?', expect: [S('nyeri_otot_sendi')] },
  { q: 'Ada mual muntah?', expect: [S('mual_muntah')] },
  { q: 'Perutnya mules?', expect: [S('nyeri_perut')] },
  { q: 'Buang air besar cair?', expect: [S('diare')] },
  { q: 'Gusi atau hidung berdarah?', expect: [S('perdarahan_mukosa')] },
  { q: 'Mata atau kulit kuning?', expect: [S('kuning')] },
  { q: 'Ada batuk pilek?', expect: [S('batuk')] },
  { q: 'Nyeri di ulu hati?', expect: [S('nyeri_ulu_hati')] },
  // Label diperbaiki setelah pengukuran buta: di konten, "begah" = rasa penuh setelah makan
  // (KBBI: "merasa sesak/penuh perut karena terlalu kenyang") → gejala cepat_kenyang, bukan kembung.
  { q: 'Perut begah?', expect: [S('cepat_kenyang')] },
  { q: 'Cepat merasa kenyang?', expect: [S('cepat_kenyang')] },
  { q: 'Ada rasa asam di mulut?', expect: [S('regurgitasi')] },
  { q: 'Nyeri dadanya seperti ditindih?', expect: [D('nyeri_dada', 'karakter')] },
  { q: 'Keringat dingin keluar?', expect: [S('keringat_dingin')] },
  { q: 'Sulit bernapas?', expect: [S('sesak_napas')] },
  { q: 'Napasnya berbunyi?', expect: [S('mengi')] },
  { q: 'Dahaknya berdarah?', expect: [S('batuk_darah')] },
  { q: 'Berkeringat malam hari tanpa aktivitas?', expect: [S('keringat_malam')] },
  { q: 'Berat badan menurun?', expect: [S('berat_badan_turun')] },
  { q: 'Sering merasa haus?', expect: [S('haus')] },
  { q: 'Sering lapar?', expect: [S('lapar')] },
  { q: 'Kaki kebas?', expect: [S('kesemutan')] },
  { q: 'Penglihatan buram?', expect: [S('pandangan_kabur')] },
  { q: 'Kalau luka susah sembuh?', expect: [S('luka_sulit_sembuh')] },
  { q: 'Kencingnya sedikit-sedikit tapi sering?', expect: [S('sering_kencing')] },
  { q: 'Sakit di perut bagian bawah tengah?', expect: [S('nyeri_suprapubik')] },
  { q: 'Nyeri pinggang menjalar ke selangkangan?', expect: [D('nyeri_pinggang', 'lokasi')] },
  { q: 'Air kencingnya kemerahan?', expect: [S('kencing_merah')] },
  { q: 'Kencingnya berbusa atau keruh?', expect: [S('urin_keruh')] },
  { q: 'Tinja berwarna hitam?', expect: [S('bab_hitam')] },
  { q: 'Sakit waktu menelan?', expect: [S('sulit_menelan')] },
  { q: 'Air kencingnya seperti teh?', expect: [S('urin_gelap')] },

  // --- Tinjauan sistem ---
  { q: 'Bagaimana BAB-nya?', expect: [R('bab')] },
  { q: 'BAK lancar?', expect: [R('bak')] },
  { q: 'Makan minum lancar?', expect: [R('makan')] },
  { q: 'Pernapasan bagaimana?', expect: [R('napas')] },
  { q: 'Ada masalah kulit?', expect: [R('kulit')] },
  { q: 'Timbangannya bagaimana?', expect: [R('berat_badan')] },
  { q: 'Matanya bagaimana?', expect: [R('mata')] },

  // --- Detail gejala ---
  { q: 'Mulai kapan batuknya?', expect: [D('batuk', 'onset')] },
  { q: 'Demamnya tinggi?', expect: [D('demam', 'keparahan')] },
  { q: 'Diarenya sudah berapa hari?', expect: [D('diare', 'onset')] },
  { q: 'Nyeri kepalanya di mana?', expect: [D('nyeri_kepala', 'lokasi')] },
  { q: 'Sesaknya hilang timbul?', expect: [D('sesak_napas', 'pola')] },
  { q: 'Mualnya makin sering?', expect: [D('mual_muntah', 'progresi')] },

  // --- Gabungan ---
  { q: 'Ada demam, batuk, atau sesak?', expect: [S('demam'), S('batuk'), S('sesak_napas')] },
  { q: 'Sejak kapan dan apa yang memperberat?', expect: [T('onset'), T('pemberat_peringan')] },
  { q: 'Ada alergi obat dan makanan?', expect: [T('alergi')] },
  { q: 'Merokok, minum kopi?', expect: [T('kebiasaan')] },
  { q: 'Mual? Muntah? BAB cair?', expect: [S('mual_muntah'), S('diare')] },

  // --- Basa-basi, aba-aba, minta diulang ---
  { q: 'Selamat sore, Pak', expect: ['greeting'] },
  { q: 'Halo, Dek', expect: ['greeting'] },
  { q: 'Baik, terima kasih banyak', expect: ['thanks'] },
  { q: 'Saya ukur tensinya dulu', expect: ['consent'] },
  { q: 'Mohon berbaring ya, Bu', expect: ['consent'] },
  { q: 'Maaf, bisa diulangi?', expect: ['repeat'] },
  { q: 'Apa, Bu?', expect: ['repeat'] },

  // --- Salah ketik ---
  { q: 'Sejak kapna?', expect: [T('onset')] },
  { q: 'Demamm?', expect: [S('demam')] },
  { q: 'Batuuk?', expect: [S('batuk')] },
  { q: 'Sesakk?', expect: [S('sesak_napas')] },
  { q: 'Mencert?', expect: [S('diare')] },
  { q: 'Alergii?', expect: [T('alergi')] },
  { q: 'Riwyat penyakit?', expect: [T('riwayat_penyakit')] },
  { q: 'Pusig?', expect: [S('nyeri_kepala')] },

  // --- Di luar konteks ---
  { q: 'Siapa yang antar ke sini?', expect: [] },
  { q: 'Sudah lihat berita hari ini?', expect: [] },
  { q: 'Hari ini panas sekali ya', expect: [] },
];
