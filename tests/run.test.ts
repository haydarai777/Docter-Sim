import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { chooseNextDisease, createRun, finishCurrent, retireRun, runStats, startNextPatient } from '../src/core/run';
import { playEncounterBot } from '../src/core/simulate';
import type { ClinicalDecision, GameConfig, RunState } from '../src/core/types';
import { config, configWith, content } from './helpers';

/** Pemeriksaan teliti & diagnosis tepat (bot skill penuh). */
function playWell(run: RunState, cfg: GameConfig = config): RunState {
  const played = playEncounterBot(run.encounter!, { skill: 1 }, createRng(run.patientIndex), content, cfg);
  return finishCurrent({ ...run, encounter: played.state }, played.decision, content, cfg);
}

/** Tanpa anamnesis/pemeriksaan, diagnosis salah, dipulangkan. */
function playBadly(run: RunState): RunState {
  const trueId = run.encounter!.case.diseaseId;
  const decision: ClinicalDecision = {
    primary: content.diseases.find((d) => d.id !== trueId)!.id,
    secondary: [],
    complications: [],
    disposition: 'rawat_jalan',
  };
  return finishCurrent(run, decision, content, config);
}

describe('sesi permainan', () => {
  it('mulai dengan reputasi awal dari config', () => {
    const run = createRun(1, config);
    expect(run.reputation).toBe(config.reputation.initial);
    expect(run.status).toBe('playing');
  });

  it('pasien berikutnya deterministik dari seed sesi', () => {
    const a = startNextPatient(createRun(77, config), content, config);
    const b = startNextPatient(createRun(77, config), content, config);
    expect(a.encounter!.case).toEqual(b.encounter!.case);
    expect(a.patientIndex).toBe(1);
  });

  it('tidak bisa memanggil pasien baru saat pasien lama belum selesai', () => {
    const run = startNextPatient(createRun(3, config), content, config);
    expect(() => startNextPatient(run, content, config)).toThrow();
  });

  it('keputusan memperbarui reputasi, skor & riwayat', () => {
    const run = playWell(startNextPatient(createRun(5, config), content, config));
    expect(run.reputation).toBeGreaterThan(config.reputation.initial);
    expect(run.history).toHaveLength(1);
    const rec = run.history[0]!;
    expect(rec.correct).toBe(true);
    expect(rec.score).toBe(run.encounter!.evaluation!.total);
    expect(rec.reputationAfter).toBe(run.reputation);
    expect(rec.reputationDelta).toBe(run.reputation - config.reputation.initial);
  });

  it('game over cepat bila asal menebak tanpa memeriksa', () => {
    let run = createRun(9, config);
    let turns = 0;
    while (run.status === 'playing' && turns < 50) {
      run = playBadly(startNextPatient(run, content, config));
      turns++;
    }
    expect(run.status).toBe('game_over');
    expect(run.reputation).toBeLessThan(config.reputation.gameOverBelow);
    expect(() => startNextPatient(run, content, config)).toThrow();
    expect(turns).toBeLessThan(8);
  });

  it('pemeriksaan teliti dan tepat tidak pernah game over', () => {
    let run = createRun(11, config);
    for (let i = 0; i < 20; i++) run = playWell(startNextPatient(run, content, config));
    expect(run.status).toBe('playing');
    expect(run.reputation).toBeGreaterThanOrEqual(90);
  });

  it('menghindari penyakit yang sama berturut-turut', () => {
    let run = createRun(21, config);
    let prev: string | null = null;
    for (let i = 0; i < 30; i++) {
      run = startNextPatient(run, content, config);
      const id = run.encounter!.case.diseaseId;
      expect(id).not.toBe(prev);
      prev = id;
      run = playWell(run);
    }
  });

  it('pengulangan diizinkan jika config mematikannya', () => {
    const cfg = configWith({ queue: { avoidImmediateRepeat: false } });
    let run = createRun(21, cfg);
    const ids: string[] = [];
    for (let i = 0; i < 60; i++) {
      ids.push(chooseNextDisease(run, content, cfg));
      run = playWell(startNextPatient(run, content, cfg), cfg);
    }
    expect(ids.some((id, i) => i > 0 && ids[i - 1] === id)).toBe(true);
  });

  it('statistik sesi', () => {
    let run = createRun(31, config);
    run = playWell(startNextPatient(run, content, config));
    run = playBadly(startNextPatient(run, content, config));
    const stats = runStats(run, content, config);
    expect(stats.patientsSeen).toBe(2);
    expect(stats.correct).toBe(1);
    expect(stats.accuracy).toBe(0.5);
    expect(stats.bestStreak).toBe(1);
    expect(stats.averageScore).toBeCloseTo((run.history[0]!.score + run.history[1]!.score) / 2);
    expect(stats.reputationHistory).toEqual([config.reputation.initial, run.history[0]!.reputationAfter, run.reputation]);
    expect(stats.perDisease.reduce((s, d) => s + d.seen, 0)).toBe(2);
  });

  it('pemain bisa mengakhiri praktek di antara pasien, tidak saat memeriksa', () => {
    let run = startNextPatient(createRun(41, config), content, config);
    expect(() => retireRun(run)).toThrow();
    run = playWell(run);
    run = retireRun(run);
    expect(run.status).toBe('retired');
    expect(() => startNextPatient(run, content, config)).toThrow();
  });
});
