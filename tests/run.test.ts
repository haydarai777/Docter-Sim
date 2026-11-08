import { describe, expect, it } from 'vitest';
import { chooseNextDisease, createRun, diagnoseCurrent, retireRun, runStats, startNextPatient } from '../src/core/run';
import type { RunState } from '../src/core/types';
import { config, configWith, content } from './helpers';

/** Jawab diagnosis salah dengan penyakit lain selain yang benar. */
function wrongAnswer(run: RunState): string {
  const trueId = run.encounter!.case.diseaseId;
  return content.diseases.find((d) => d.id !== trueId)!.id;
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

  it('tidak bisa memanggil pasien baru saat pasien lama belum didiagnosis', () => {
    const run = startNextPatient(createRun(3, config), content, config);
    expect(() => startNextPatient(run, content, config)).toThrow();
  });

  it('diagnosis memperbarui reputasi & riwayat', () => {
    let run = startNextPatient(createRun(5, config), content, config);
    const trueId = run.encounter!.case.diseaseId;
    run = diagnoseCurrent(run, trueId, content, config);
    expect(run.reputation).toBeGreaterThan(config.reputation.initial);
    expect(run.history).toHaveLength(1);
    expect(run.history[0]!.correct).toBe(true);
    expect(run.history[0]!.reputationAfter).toBe(run.reputation);
  });

  it('game over setelah cukup banyak diagnosis salah', () => {
    let run = createRun(9, config);
    let turns = 0;
    while (run.status === 'playing' && turns < 50) {
      run = startNextPatient(run, content, config);
      run = diagnoseCurrent(run, wrongAnswer(run), content, config);
      turns++;
    }
    expect(run.status).toBe('game_over');
    expect(run.reputation).toBeLessThan(config.reputation.gameOverBelow);
    expect(() => startNextPatient(run, content, config)).toThrow();
    expect(turns).toBeLessThan(10);
  });

  it('tidak game over selama diagnosis benar', () => {
    let run = createRun(11, config);
    for (let i = 0; i < 20; i++) {
      run = startNextPatient(run, content, config);
      run = diagnoseCurrent(run, run.encounter!.case.diseaseId, content, config);
    }
    expect(run.status).toBe('playing');
    expect(run.reputation).toBe(config.reputation.max);
  });

  it('menghindari penyakit yang sama berturut-turut', () => {
    let run = createRun(21, config);
    let prev: string | null = null;
    for (let i = 0; i < 40; i++) {
      run = startNextPatient(run, content, config);
      const id = run.encounter!.case.diseaseId;
      expect(id).not.toBe(prev);
      prev = id;
      run = diagnoseCurrent(run, id, content, config);
    }
  });

  it('pengulangan diizinkan jika config mematikannya', () => {
    const cfg = configWith({ queue: { avoidImmediateRepeat: false } });
    let run = createRun(21, cfg);
    const ids: string[] = [];
    for (let i = 0; i < 60; i++) {
      ids.push(chooseNextDisease(run, content, cfg));
      run = startNextPatient(run, content, cfg);
      run = diagnoseCurrent(run, run.encounter!.case.diseaseId, content, cfg);
    }
    expect(ids.some((id, i) => i > 0 && ids[i - 1] === id)).toBe(true);
  });

  it('statistik sesi', () => {
    let run = createRun(31, config);
    run = startNextPatient(run, content, config);
    run = diagnoseCurrent(run, run.encounter!.case.diseaseId, content, config);
    run = startNextPatient(run, content, config);
    run = diagnoseCurrent(run, wrongAnswer(run), content, config);
    const stats = runStats(run, content, config);
    expect(stats.patientsSeen).toBe(2);
    expect(stats.correct).toBe(1);
    expect(stats.accuracy).toBe(0.5);
    expect(stats.bestStreak).toBe(1);
    expect(stats.reputationHistory).toEqual([config.reputation.initial, run.history[0]!.reputationAfter, run.reputation]);
    expect(stats.perDisease.reduce((s, d) => s + d.seen, 0)).toBe(2);
    expect(stats.averageSpent).toBe(0);
  });

  it('pemain bisa mengakhiri praktek di antara pasien, tidak saat memeriksa', () => {
    let run = startNextPatient(createRun(41, config), content, config);
    expect(() => retireRun(run)).toThrow();
    run = diagnoseCurrent(run, run.encounter!.case.diseaseId, content, config);
    run = retireRun(run);
    expect(run.status).toBe('retired');
    expect(() => startNextPatient(run, content, config)).toThrow();
  });
});
