import type { GameConfig } from '../core/types';

/**
 * ============================================================================
 *  KONFIGURASI BALANCING — semua angka permainan ada di sini.
 * ============================================================================
 *
 * Ubah angka di file ini untuk menyeimbangkan permainan tanpa menyentuh logika.
 * Setelah mengubah, jalankan `npm test` (ada tes keseimbangan yang memastikan,
 * misalnya, setiap penyakit tetap bisa diperiksa dengan budget pasien miskin).
 *
 * Catatan harga: angka kira-kira tarif klinik pratama swasta di Indonesia,
 * disederhanakan untuk permainan. BPJS/asuransi belum dimodelkan.
 */
export const GAME_CONFIG: GameConfig = {
  patient: {
    // Untuk sementara hanya pasien dewasa (nilai rujukan lab anak berbeda).
    minAge: 18,
    maxAge: 75,
    // Peluang pasien punya alergi obat/makanan.
    allergyRate: 0.15,
  },

  anamnesis: {
    // Tidak ada batas jumlah pertanyaan. Satu pertanyaan bebas paling banyak dijawab
    // untuk sekian topik/gejala sekaligus (mis. "sejak kapan dan di mana sakitnya?").
    maxIntentsPerQuestion: 3,
  },

  // Bobot komponen penilaian klinis (total 100).
  evaluation: {
    weights: {
      anamnesis: 25, // kelengkapan anamnesis
      fisik: 15, // pemeriksaan fisik
      penunjang: 20, // pemilihan pemeriksaan penunjang
      banding: 20, // diagnosis banding & penyingkiran
      komplikasi: 10, // penilaian komplikasi & tanda bahaya
      keputusan: 10, // diagnosis akhir & tata laksana (disposisi)
    },
    // Pengurangan poin (dari skor penunjang) per pemeriksaan yang tidak perlu / kurang relevan.
    unnecessaryTestPenalty: 3,
    irrelevantTestPenalty: 1,
    grades: [
      { min: 85, grade: 'A', label: 'Penalaran klinis sangat baik' },
      { min: 70, grade: 'B', label: 'Baik, ada beberapa yang terlewat' },
      { min: 55, grade: 'C', label: 'Cukup, masih banyak yang perlu diperbaiki' },
      { min: 0, grade: 'D', label: 'Perlu banyak latihan' },
    ],
  },

  economy: {
    classes: {
      // weight = peluang relatif kemunculan; budget = rentang budget (Rupiah).
      miskin: { weight: 35, budget: [75_000, 150_000] },
      menengah: { weight: 45, budget: [250_000, 600_000] },
      kaya: { weight: 20, budget: [800_000, 2_000_000] },
    },
    // Budget dibulatkan ke bawah ke kelipatan ini.
    budgetRounding: 5_000,
  },

  // Harga per alat (Rupiah). Kunci = id alat di src/data/tools.json.
  toolPrices: {
    // Pemeriksaan fisik: bagian dari konsultasi, tidak ditagih terpisah.
    tanda_vital: 0,
    keadaan_umum: 0,
    timbangan: 0,
    kepala_leher: 0,
    pemeriksaan_paru: 0,
    pemeriksaan_jantung: 0,
    pemeriksaan_abdomen: 0,
    ekstremitas_kulit: 0,
    kaki_diabetik: 0,
    neurologis: 0,
    uji_tourniquet: 0,
    // Laboratorium
    gula_darah: 25_000,
    widal: 40_000,
    urinalisis: 40_000,
    bta_sputum: 50_000,
    mikroskopis_malaria: 50_000,
    rdt_malaria: 60_000,
    darah_lengkap: 70_000,
    fungsi_ginjal: 70_000,
    fungsi_hati: 80_000,
    profil_lipid: 100_000,
    tubex: 150_000,
    ns1_dengue: 150_000,
    hba1c: 150_000,
    tcm_tb: 150_000,
    serologi_dengue: 175_000,
    // Pencitraan
    foto_bno: 120_000,
    rontgen_thorax: 175_000,
    usg_abdomen: 300_000,
    ct_abdomen: 1_200_000,
    // Lainnya
    spirometri: 25_000,
    ekg: 75_000,
  },


  tests: {
    // true  = tes bisa negatif palsu / positif palsu sesuai sensitivitas & spesifisitas.
    // false = penanda diagnostik (NS1, RDT, Tubex, dsb.) selalu akurat — mode "latihan".
    realisticAccuracy: true,
  },

  reputation: {
    initial: 50,
    min: 0,
    max: 100,
    // Game over jika reputasi turun DI BAWAH angka ini.
    gameOverBelow: 20,

    // Perubahan reputasi dari skor klinis (0–100):
    //   delta = (skor − neutralScore) × perScorePoint  → skor 100: +13, skor 50: 0, skor 10: −10.
    neutralScore: 50,
    perScorePoint: 0.25,

    // Penalti tambahan bila diagnosis UTAMA salah: −(wrongBase × pengali bahaya penyakit yang terlewat).
    wrongBase: 4,
    // Penalti keselamatan: pasien yang perlu dirujuk segera justru dipulangkan/diobservasi.
    unsafeDispositionPenalty: 6,
    dangerMultiplier: {
      rendah: 1,
      sedang: 1.5,
      tinggi: 2.5,
      kritis: 3.5,
    },

    // Gelar dokter sesuai reputasi (dipakai di UI). min = batas bawah inklusif.
    titles: [
      { min: 85, label: 'Dokter teladan' },
      { min: 65, label: 'Dokter terpercaya' },
      { min: 45, label: 'Dokter umum' },
      { min: 20, label: 'Dokter diragukan' },
      { min: 0, label: 'Izin praktek terancam' },
    ],
  },

  queue: {
    avoidImmediateRepeat: true,
  },
};
