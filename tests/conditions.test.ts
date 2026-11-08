import { describe, expect, it } from 'vitest';
import { matchesCondition, type ConditionContext } from '../src/core/conditions';

const ctx: ConditionContext = {
  day: 4,
  sex: 'male',
  age: 40,
  occupationId: 'petani',
  traits: new Set(['a', 'b']),
  symptoms: new Set(['demam']),
};

describe('matchesCondition', () => {
  it('kondisi kosong selalu cocok', () => {
    expect(matchesCondition(undefined, ctx)).toBe(true);
    expect(matchesCondition({}, ctx)).toBe(true);
  });

  it('hari, usia, jenis kelamin, pekerjaan', () => {
    expect(matchesCondition({ dayMin: 4, dayMax: 4 }, ctx)).toBe(true);
    expect(matchesCondition({ dayMin: 5 }, ctx)).toBe(false);
    expect(matchesCondition({ dayMax: 3 }, ctx)).toBe(false);
    expect(matchesCondition({ ageMin: 41 }, ctx)).toBe(false);
    expect(matchesCondition({ ageMax: 40 }, ctx)).toBe(true);
    expect(matchesCondition({ sex: 'female' }, ctx)).toBe(false);
    expect(matchesCondition({ occupations: ['petani', 'guru'] }, ctx)).toBe(true);
    expect(matchesCondition({ occupations: ['guru'] }, ctx)).toBe(false);
  });

  it('trait & gejala (AND)', () => {
    expect(matchesCondition({ traits: ['a', 'b'] }, ctx)).toBe(true);
    expect(matchesCondition({ traits: ['a', 'c'] }, ctx)).toBe(false);
    expect(matchesCondition({ notTraits: ['c'] }, ctx)).toBe(true);
    expect(matchesCondition({ notTraits: ['b'] }, ctx)).toBe(false);
    expect(matchesCondition({ symptoms: ['demam'] }, ctx)).toBe(true);
    expect(matchesCondition({ notSymptoms: ['demam'] }, ctx)).toBe(false);
  });

  it('kondisi gejala tidak terpenuhi jika gejala belum tersedia', () => {
    const noSymptoms = { ...ctx, symptoms: undefined };
    expect(matchesCondition({ symptoms: ['demam'] }, noSymptoms)).toBe(false);
    expect(matchesCondition({ notSymptoms: ['batuk'] }, noSymptoms)).toBe(false);
  });
});
