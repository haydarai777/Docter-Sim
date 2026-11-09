import { describe, expect, it } from 'vitest';
import { applyReputation, isGameOver, planTestCost, reputationTitle, toolPrice, wrongPenalty } from '../src/core/scoring';
import type { DiseaseTemplate } from '../src/core/types';
import { config, configWith, content } from './helpers';

const R = config.reputation;

describe('harga & reputasi', () => {
  it('harga alat dari config; pemeriksaan fisik gratis', () => {
    expect(toolPrice('darah_lengkap', config)).toBe(config.toolPrices.darah_lengkap);
    expect(toolPrice('tanda_vital', config)).toBe(0);
    expect(toolPrice('alat_fiktif', config)).toBe(0);
  });

  it('penalti diagnosis salah bertingkat sesuai bahaya penyakit yang terlewat', () => {
    const mk = (danger: DiseaseTemplate['danger']) => wrongPenalty({ danger }, config);
    expect(mk('rendah')).toBe(Math.round(R.wrongBase * R.dangerMultiplier.rendah));
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
    expect(isGameOver(55, configWith({ reputation: { gameOverBelow: 60 } }))).toBe(true);
  });

  it('gelar reputasi mengikuti ambang di config', () => {
    const sorted = [...R.titles].sort((a, b) => b.min - a.min);
    expect(reputationTitle(R.max, config)).toBe(sorted[0]!.label);
    expect(reputationTitle(R.min, config)).toBe(sorted.at(-1)!.label);
    for (const t of sorted) expect(reputationTitle(t.min, config)).toBe(t.label);
  });

  it('biaya rencana: item satu group dihitung sekali (yang termurah)', () => {
    const malaria = content.diseasesById.get('malaria')!;
    // RDT dan mikroskopis saling menggantikan → yang termurah (mikroskopis).
    expect(planTestCost(malaria, config)).toBe(Math.min(config.toolPrices.rdt_malaria!, config.toolPrices.mikroskopis_malaria!));
  });
});
