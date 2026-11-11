/**
 * Tes keseimbangan: memastikan angka di config.ts dan konten tetap "adil".
 * Jika tes ini gagal setelah Anda mengubah config, itu tanda balancing bergeser —
 * sesuaikan angkanya atau perbarui ekspektasi di sini dengan sadar.
 */
import { describe, expect, it } from 'vitest';
import { matchesCondition } from '../src/core/conditions';
import { planTestCost, toolPrice } from '../src/core/scoring';
import { simulateBot } from '../src/core/simulate';
import { config, content } from './helpers';

const minPoorBudget = config.economy.classes.miskin.budget[0];
const maxMiddleBudget = config.economy.classes.menengah.budget[1];

describe('keseimbangan ekonomi', () => {
  it('semua pemeriksaan sesuai rencana terjangkau budget kelas menengah', () => {
    for (const d of content.diseases) {
      expect(planTestCost(d, config, ['kunci', 'pendukung', 'komplikasi']), d.id).toBeLessThanOrEqual(maxMiddleBudget);
    }
  });

  it('pasien termiskin pun selalu bisa diberi minimal satu pemeriksaan penunjang informatif (atau tidak perlu penunjang)', () => {
    for (const d of content.diseases) {
      const key = d.plan.tests.filter((t) => !t.when && t.role !== 'komplikasi');
      if (key.length === 0) continue; // diagnosis klinis (mis. dispepsia tanpa tanda bahaya)
      expect(key.some((t) => toolPrice(t.tool, config) <= minPoorBudget), `${d.id}: tidak ada penunjang ≤ ${minPoorBudget}`).toBe(true);
    }
  });

  it('setiap penyakit punya minimal 3 topik anamnesis berpetunjuk (informasi gratis)', () => {
    for (const d of content.diseases) {
      const clueCategories = Object.values(d.anamnesis).filter((variants) => variants.some((v) => v.clue));
      expect(clueCategories.length, d.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('pemeriksaan fisik gratis; setiap penunjang berbayar', () => {
    for (const t of content.tools) {
      if (t.category === 'fisik') expect(toolPrice(t.id, config), t.id).toBe(0);
      else expect(toolPrice(t.id, config), t.id).toBeGreaterThan(0);
    }
  });

  it('setiap rencana pemeriksaan bersyarat merujuk trait yang ada', () => {
    for (const d of content.diseases) {
      const traits = new Set((d.traits ?? []).map((t) => t.id));
      for (const it of [...d.plan.exams, ...d.plan.tests]) for (const t of it.when?.traits ?? []) expect(traits.has(t), `${d.id}:${t}`).toBe(true);
      expect(matchesCondition(undefined, { day: 1, sex: 'male', age: 30, occupationId: 'x', traits: new Set() })).toBe(true);
    }
  });
});

// Simulasi ratusan sesi cukup berat; beri batas waktu longgar agar tidak gagal di mesin yang sibuk.
describe('keseimbangan reputasi (simulasi bot)', { timeout: 30_000 }, () => {
  const sim = (skill: number) => simulateBot(content, config, { skill, runs: 80, maxPatients: 40, seed: 2024 });

  it('asal menebak cepat berujung game over', () => {
    const r = simulateBot(content, config, { skill: 0.1, accuracy: 1 / content.diseases.length, runs: 80, maxPatients: 40, seed: 7 });
    expect(r.gameOverRate).toBe(1);
    expect(r.medianPatientsToGameOver!).toBeLessThanOrEqual(6);
  });

  it('pemain setengah teliti (skill 0.4) hampir selalu game over', () => {
    expect(sim(0.4).gameOverRate).toBeGreaterThan(0.85);
  });

  it('pemain teliti (skill 0.75) hampir selalu bertahan', () => {
    expect(sim(0.75).gameOverRate).toBeLessThan(0.1);
  });

  it('skor klinis & peluang bertahan naik seiring kemampuan', () => {
    const results = [0.3, 0.5, 0.7, 0.9].map(sim);
    for (let i = 1; i < results.length; i++) {
      expect(results[i]!.gameOverRate).toBeLessThanOrEqual(results[i - 1]!.gameOverRate);
      expect(results[i]!.averageScore).toBeGreaterThan(results[i - 1]!.averageScore);
    }
  });

  it('bot sempurna mendapat skor rata-rata ≥ 90', () => {
    expect(sim(1).averageScore).toBeGreaterThanOrEqual(90);
  });
});
