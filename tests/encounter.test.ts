import { describe, expect, it } from 'vitest';
import {
  askCategory,
  askSymptom,
  canAskCategory,
  canPerformExam,
  EncounterError,
  isBudgetExhausted,
  performExam,
  questionsLeft,
  startEncounter,
  submitDiagnosis,
} from '../src/core/encounter';
import { generateCase } from '../src/core/generator';
import type { PatientCase } from '../src/core/types';
import { config, content } from './helpers';

/** Kasus dengan budget tertentu (budget diganti setelah generate). */
function caseWithBudget(budget: number, diseaseId = 'dengue', seed = 10): PatientCase {
  const c = generateCase(content, config, { diseaseId, seed });
  return { ...c, patient: { ...c.patient, budget } };
}

describe('konsultasi: budget pemeriksaan', () => {
  it('pemeriksaan memotong budget sesuai harga di config', () => {
    let s = startEncounter(caseWithBudget(200_000));
    s = performExam(s, 'darah_lengkap', content, config);
    expect(s.budgetRemaining).toBe(200_000 - config.toolPrices.darah_lengkap!);
    expect(s.spent).toBe(config.toolPrices.darah_lengkap);
    expect(s.examsDone).toEqual(['darah_lengkap']);
    expect(s.log.at(-1)).toEqual({ kind: 'exam', toolId: 'darah_lengkap', cost: config.toolPrices.darah_lengkap });
  });

  it('state lama tidak berubah (fungsi murni)', () => {
    const s0 = startEncounter(caseWithBudget(200_000));
    const snapshot = structuredClone(s0);
    performExam(s0, 'termometer', content, config);
    expect(s0).toEqual(snapshot);
  });

  it('tidak bisa memeriksa jika budget tidak cukup', () => {
    const s = startEncounter(caseWithBudget(60_000));
    expect(canPerformExam(s, 'darah_lengkap', content, config)).toEqual({ ok: false, reason: 'Budget pasien tidak cukup.' });
    expect(() => performExam(s, 'darah_lengkap', content, config)).toThrow(EncounterError);
  });

  it('budget boleh habis tepat nol', () => {
    const price = config.toolPrices.darah_lengkap!;
    const s = performExam(startEncounter(caseWithBudget(price)), 'darah_lengkap', content, config);
    expect(s.budgetRemaining).toBe(0);
  });

  it('pemeriksaan yang sama tidak bisa diulang', () => {
    const s = performExam(startEncounter(caseWithBudget(500_000)), 'termometer', content, config);
    expect(canPerformExam(s, 'termometer', content, config).ok).toBe(false);
  });

  it('isBudgetExhausted saat tidak ada alat yang terjangkau', () => {
    const cheapest = Math.min(...Object.values(config.toolPrices));
    expect(isBudgetExhausted(startEncounter(caseWithBudget(cheapest - 1)), content, config)).toBe(true);
    expect(isBudgetExhausted(startEncounter(caseWithBudget(cheapest)), content, config)).toBe(false);
  });
});

describe('konsultasi: anamnesis', () => {
  it('jatah pertanyaan dibatasi config.anamnesis.maxQuestions', () => {
    let s = startEncounter(caseWithBudget(100_000));
    const statics = content.anamnesis.filter((c) => c.type === 'static');
    for (let i = 0; i < config.anamnesis.maxQuestions; i++) s = askCategory(s, statics[i]!.id, content, config);
    expect(questionsLeft(s, config)).toBe(0);
    const next = statics[config.anamnesis.maxQuestions]!.id;
    expect(canAskCategory(s, next, config)).toEqual({ ok: false, reason: 'Jatah pertanyaan anamnesis habis.' });
    expect(() => askCategory(s, next, content, config)).toThrow(EncounterError);
  });

  it('kategori yang sama tidak bisa ditanya dua kali', () => {
    const s = askCategory(startEncounter(caseWithBudget(100_000)), 'onset', content, config);
    expect(canAskCategory(s, 'onset', config).ok).toBe(false);
  });

  it('jawaban kategori statis sesuai kasus dan dicatat di log', () => {
    const c = caseWithBudget(100_000);
    const s = askCategory(startEncounter(c), 'onset', content, config);
    expect(s.log.at(-2)!.kind).toBe('doctor');
    expect(s.log.at(-1)).toEqual({ kind: 'patient', text: c.answers.onset!.text });
  });

  it('"keluhan lain" mengungkap gejala baru sesuai urutan', () => {
    const c = caseWithBudget(100_000);
    const s = askCategory(startEncounter(c), 'keluhan_lain', content, config);
    const personality = content.personalitiesById.get(c.patient.personalityId)!;
    const expected = c.revealOrder.slice(0, personality.otherComplaintCount);
    expect(s.revealedSymptoms).toEqual([...c.chiefComplaintSymptoms, ...expected]);
  });

  it('pertanyaan gejala spesifik: ada → terungkap, tidak ada → tidak terungkap', () => {
    const c = caseWithBudget(100_000);
    const present = c.revealOrder[0]!;
    const absent = content.symptoms.find((s) => !c.symptoms.includes(s.id))!.id;
    let s = askSymptom(startEncounter(c), present, content, config);
    expect(s.revealedSymptoms).toContain(present);
    s = askSymptom(s, absent, content, config);
    expect(s.revealedSymptoms).not.toContain(absent);
    expect(s.questionsUsed).toBe(2);
  });

  it('anamnesis tetap boleh setelah budget habis (gratis)', () => {
    const s = startEncounter(caseWithBudget(0));
    expect(isBudgetExhausted(s, content, config)).toBe(true);
    expect(canAskCategory(s, 'onset', config).ok).toBe(true);
  });
});

describe('konsultasi: diagnosis', () => {
  it('diagnosis menutup konsultasi; aksi berikutnya ditolak', () => {
    const c = caseWithBudget(300_000);
    const s = submitDiagnosis(startEncounter(c), c.diseaseId, content, config);
    expect(s.status).toBe('diagnosed');
    expect(s.outcome?.correct).toBe(true);
    expect(canPerformExam(s, 'termometer', content, config).ok).toBe(false);
    expect(canAskCategory(s, 'onset', config).ok).toBe(false);
    expect(() => submitDiagnosis(s, c.diseaseId, content, config)).toThrow(EncounterError);
  });

  it('diagnosis salah tercatat', () => {
    const c = caseWithBudget(300_000, 'dengue');
    const s = submitDiagnosis(startEncounter(c), 'malaria', content, config);
    expect(s.outcome?.correct).toBe(false);
    expect(s.outcome?.reputationDelta).toBeLessThan(0);
  });

  it('diagnosis tidak dikenal ditolak', () => {
    expect(() => submitDiagnosis(startEncounter(caseWithBudget(1)), 'xyz', content, config)).toThrow(EncounterError);
  });
});
