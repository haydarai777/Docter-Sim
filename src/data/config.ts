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
  },

  anamnesis: {
    // Jumlah pertanyaan anamnesis (gratis) per pasien.
    maxQuestions: 5,
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
    // Pemeriksaan fisik (murah)
    termometer: 5_000,
    tanda_vital: 5_000,
    senter: 5_000,
    stetoskop: 10_000,
    palpasi_abdomen: 10_000,
    uji_tourniquet: 10_000,
    timbangan: 5_000,
    oksimeter: 5_000,
    peak_flow: 15_000,
    // Laboratorium (sedang)
    widal: 40_000,
    rdt_malaria: 60_000,
    darah_lengkap: 70_000,
    tubex: 150_000,
    ns1_dengue: 150_000,
    gula_darah: 25_000,
    urinalisis: 40_000,
    bta_sputum: 50_000,
    mikroskopis_malaria: 50_000,
    fungsi_ginjal: 70_000,
    fungsi_hati: 80_000,
    profil_lipid: 100_000,
    hba1c: 150_000,
    tcm_tb: 150_000,
    serologi_dengue: 175_000,
    // Penunjang (mahal)
    ekg: 120_000,
    rontgen_thorax: 175_000,
    usg_abdomen: 300_000,
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

    // Diagnosis benar: +correctBase + bonus hemat (0..efficiencyBonusMax).
    correctBase: 8,
    efficiencyBonusMax: 4,
    // Bonus hemat penuh jika biaya <= biaya pemeriksaan ideal penyakit tsb,
    // turun linear hingga 0 saat biaya = efficiencyZeroAtMultiplier × biaya ideal.
    efficiencyZeroAtMultiplier: 2,

    // Diagnosis salah: -(wrongBase × pengali bahaya penyakit yang TERLEWAT).
    wrongBase: 6,
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
