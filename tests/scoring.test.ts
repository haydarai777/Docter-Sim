import { describe, expect, it } from 'vitest';
import { applyReputation, efficiencyBonus, evaluateDiagnosis, idealWorkupCost, isGameOver, reputationTitle, wrongPenalty } from '../src/core/scoring';
import type { DiseaseTemplate } from '../src/core/types';
import { config, configWith, content } from './helpers';

const R = config.reputation;

describe('reputasi & penilaian', () => {
  it('bonus hemat penuh jika biaya <= ideal, nol pada kelipatan batas, linear di antaranya', () => {
    const ideal = 100_000;
    expect(efficiencyBonus(0, ideal, config)).toBe(R.efficiencyBonusMax);
    expect(efficiencyBonus(ideal, ideal, config)).toBe(R.efficiencyBonusMax);
    expect(efficiencyBonus(ideal * R.efficiencyZeroAtMultiplier, ideal, config)).toBe(0);
    expect(efficiencyBonus(ideal * 10, ideal, config)).toBe(0);
    const mid = ideal + (ideal * (R.efficiencyZeroAtMultiplier - 1)) / 2;
    expect(efficiencyBonus(mid, ideal, config)).toBe(Math.round(R.efficiencyBonusMax / 2));
  });

  it('bonus hemat aman untuk biaya ideal 0', () => {
    expect(efficiencyBonus(0, 0, config)).toBe(R.efficiencyBonusMax);
    expect(efficiencyBonus(5000, 0, config)).toBe(0);
  });

  it('diagnosis benar: +correctBase + bonus', () => {
    const dengue = content.diseasesById.get('dengue')!;
    const out = evaluateDiagnosis('dengue', 'dengue', 0, content, config);
    expect(out.correct).toBe(true);
    expect(out.reputationDelta).toBe(R.correctBase + R.efficiencyBonusMax);
    expect(out.idealCost).toBe(idealWorkupCost(dengue, config));
    const pricey = evaluateDiagnosis('dengue', 'dengue', out.idealCost * 5, content, config);
    expect(pricey.reputationDelta).toBe(R.correctBase);
  });

  it('diagnosis salah: penalti dikali tingkat bahaya penyakit yang TERLEWAT', () => {
    const missedDengue = evaluateDiagnosis('dengue', 'demam_tifoid', 0, content, config);
    const missedTyphoid = evaluateDiagnosis('demam_tifoid', 'dengue', 0, content, config);
    expect(missedDengue.reputationDelta).toBe(-Math.round(R.wrongBase * R.dangerMultiplier.tinggi));
    expect(missedTyphoid.reputationDelta).toBe(-Math.round(R.wrongBase * R.dangerMultiplier.sedang));
    // Penyakit berbahaya yang terlewat → penalti lebih besar.
    expect(missedDengue.reputationDelta).toBeLessThan(missedTyphoid.reputationDelta);
  });

  it('penalti untuk semua tingkat bahaya bertingkat naik', () => {
    const mk = (danger: DiseaseTemplate['danger']) => wrongPenalty({ danger } as DiseaseTemplate, config);
    expect(mk('rendah')).toBeLessThan(mk('sedang'));
    expect(mk('sedang')).toBeLessThan(mk('tinggi'));
    expect(mk('tinggi')).toBeLessThan(mk('kritis'));
  });

  it('reputasi dibatasi min/max', () => {
    expect(applyReputation(R.max - 1, 50, config)).toBe(R.max);
    expect(applyReputation(R.min + 1, -50, config)).toBe(R.min);
    expect(applyReputation(50, 5, config)).toBe(55);
  });

  it('game over jika reputasi di bawah ambang', () => {
    expect(isGameOver(R.gameOverBelow, config)).toBe(false);
    expect(isGameOver(R.gameOverBelow - 1, config)).toBe(true);
    const strict = configWith({ reputation: { gameOverBelow: 60 } });
    expect(isGameOver(55, strict)).toBe(true);
  });

  it('angka reputasi diambil dari config (bisa di-balance)', () => {
    const custom = configWith({ reputation: { correctBase: 20, efficiencyBonusMax: 0 } });
    expect(evaluateDiagnosis('malaria', 'malaria', 0, content, custom).reputationDelta).toBe(20);
  });

  it('gelar reputasi mengikuti ambang di config', () => {
    const sorted = [...R.titles].sort((a, b) => b.min - a.min);
    expect(reputationTitle(R.max, config)).toBe(sorted[0]!.label);
    expect(reputationTitle(R.min, config)).toBe(sorted.at(-1)!.label);
    for (const t of sorted) expect(reputationTitle(t.min, config)).toBe(t.label);
  });
});
