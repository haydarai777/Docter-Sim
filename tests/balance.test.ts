/**
 * Tes keseimbangan: memastikan angka di config.ts dan konten tetap "adil".
 * Jika tes ini gagal setelah Anda mengubah config, itu tanda balancing bergeser —
 * sesuaikan angkanya atau perbarui ekspektasi di sini dengan sadar.
 */
import { describe, expect, it } from 'vitest';
import { idealWorkupCost, toolPrice } from '../src/core/scoring';
import { simulateBot } from '../src/core/simulate';
import { config, content } from './helpers';

const minPoorBudget = config.economy.classes.miskin.budget[0];
const maxMiddleBudget = config.economy.classes.menengah.budget[1];

describe('keseimbangan ekonomi', () => {
  it('pemeriksaan ideal setiap penyakit terjangkau oleh budget kelas menengah', () => {
    for (const d of content.diseases) {
      expect(idealWorkupCost(d, config), d.id).toBeLessThanOrEqual(maxMiddleBudget);
    }
  });

  it('pasien termiskin pun selalu bisa diberi minimal satu pemeriksaan yang informatif', () => {
    for (const d of content.diseases) {
      const informative = d.findings.filter((f) => (f.probability ?? 1) >= 0.5 && toolPrice(f.tool, config) <= minPoorBudget);
      expect(informative.length, `${d.id}: tidak ada pemeriksaan informatif ≤ ${minPoorBudget}`).toBeGreaterThan(0);
    }
  });

  it('setiap penyakit punya minimal 2 kategori anamnesis yang berisi petunjuk (informasi gratis)', () => {
    for (const d of content.diseases) {
      const clueCategories = Object.values(d.anamnesis).filter((variants) => variants.some((v) => v.clue));
      expect(clueCategories.length, d.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('setiap alat punya harga positif, dan penunjang lebih mahal dari pemeriksaan fisik', () => {
    const maxFisik = Math.max(...content.tools.filter((t) => t.category === 'fisik').map((t) => toolPrice(t.id, config)));
    const minPenunjang = Math.min(...content.tools.filter((t) => t.category === 'penunjang').map((t) => toolPrice(t.id, config)));
    expect(minPenunjang).toBeGreaterThan(maxFisik);
  });
});

describe('keseimbangan reputasi (simulasi bot)', () => {
  const sim = (accuracy: number) => simulateBot(content, config, { accuracy, runs: 120, maxPatients: 40, seed: 2024 });

  it('menebak acak cepat berujung game over', () => {
    const r = sim(1 / content.diseases.length);
    expect(r.gameOverRate).toBe(1);
    expect(r.medianPatientsToGameOver!).toBeLessThanOrEqual(8);
  });

  it('akurasi 40% hampir selalu game over', () => {
    expect(sim(0.4).gameOverRate).toBeGreaterThan(0.85);
  });

  it('akurasi 80% hampir selalu bertahan', () => {
    expect(sim(0.8).gameOverRate).toBeLessThan(0.1);
  });

  it('peluang bertahan naik seiring akurasi', () => {
    const rates = [0.3, 0.5, 0.7, 0.9].map((a) => sim(a).gameOverRate);
    for (let i = 1; i < rates.length; i++) expect(rates[i]!).toBeLessThanOrEqual(rates[i - 1]!);
  });
});
