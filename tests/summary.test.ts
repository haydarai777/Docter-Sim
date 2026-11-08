import { describe, expect, it } from 'vitest';
import { askCategory, performExam, startEncounter, submitDiagnosis } from '../src/core/encounter';
import { generateCase } from '../src/core/generator';
import { deriveSeed } from '../src/core/rng';
import { buildSummary } from '../src/core/summary';
import { config, content } from './helpers';

/** Cari kasus malaria yang petunjuk bepergiannya ada (selalu ada di data). */
function malariaCase() {
  const c = generateCase(content, config, { diseaseId: 'malaria', seed: deriveSeed(1, 'm') });
  return { ...c, patient: { ...c.patient, budget: 1_000_000 } };
}

describe('ringkasan edukatif', () => {
  it('petunjuk anamnesis ditandai ditemukan bila ditanyakan', () => {
    const c = malariaCase();
    let s = startEncounter(c);
    s = askCategory(s, 'bepergian_lingkungan', content, config);
    s = submitDiagnosis(s, 'malaria', content, config);
    const summary = buildSummary(s, content, config);
    const travel = summary.clues.find((x) => x.text.includes('daerah endemis malaria'))!;
    expect(travel.found).toBe(true);
    const unasked = summary.clues.filter((x) => x.source === 'Anamnesis' && x !== travel);
    expect(unasked.every((x) => !x.found)).toBe(true);
  });

  it('pemeriksaan ideal ditandai sudah/belum dilakukan', () => {
    let s = startEncounter(malariaCase());
    s = performExam(s, 'rdt_malaria', content, config);
    s = submitDiagnosis(s, 'malaria', content, config);
    const summary = buildSummary(s, content, config);
    expect(summary.idealWorkup.find((w) => w.toolId === 'rdt_malaria')!.done).toBe(true);
    expect(summary.idealWorkup.find((w) => w.toolId === 'termometer')!.done).toBe(false);
  });

  it('pemeriksaan tidak relevan dengan hasil normal masuk daftar kurang berguna', () => {
    let s = startEncounter(malariaCase());
    s = performExam(s, 'ns1_dengue', content, config);
    s = submitDiagnosis(s, 'malaria', content, config);
    const summary = buildSummary(s, content, config);
    expect(summary.lowYieldExams.map((x) => x.toolId)).toContain('ns1_dengue');
  });

  it('diagnosis salah menampilkan cara membedakan', () => {
    let s = startEncounter(malariaCase());
    s = submitDiagnosis(s, 'dengue', content, config);
    const summary = buildSummary(s, content, config);
    expect(summary.outcome.correct).toBe(false);
    expect(summary.differentialNote).toBeTruthy();
  });

  it('ringkasan hanya tersedia setelah diagnosis', () => {
    expect(() => buildSummary(startEncounter(malariaCase()), content, config)).toThrow();
  });
});
