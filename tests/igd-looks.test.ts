import { describe, expect, it } from 'vitest';
import { createShift, type EdContext } from '../src/core/igd/engine';
import { buildShiftConfig } from '../src/core/igd/shift';
import { ED_SCENARIOS } from '../src/data/igd';
import { familyLook, heightFor, patientLook, staffLook } from '../src/ui/igd/looks';
import { content } from './helpers';

const ctx: EdContext = { scenarios: new Map(ED_SCENARIOS.map((s) => [s.id, s])), content };

describe('Penampilan 3D orang-orang IGD', () => {
  it('tinggi badan wajar menurut usia', () => {
    expect(heightFor(0, 'male', 0.5)).toBeLessThan(80);
    expect(heightFor(5, 'female', 0.5)).toBeGreaterThan(100);
    expect(heightFor(5, 'female', 0.5)).toBeLessThan(115);
    expect(heightFor(30, 'male', 0)).toBeGreaterThanOrEqual(158);
    expect(heightFor(30, 'female', 1)).toBeLessThanOrEqual(161);
  });

  it('pasien, keluarga & staf deterministik dan sesuai data pasien', () => {
    for (const mode of ['jaga', 'sibuk'] as const) {
      const shift = createShift(buildShiftConfig(mode, 11, ED_SCENARIOS), 11, ctx);
      for (const p of shift.patients) {
        const a = patientLook(p, content, shift.seed);
        const b = patientLook(p, content, shift.seed);
        expect(a).toEqual(b);
        expect(a.sex).toBe(p.sex);
        expect(a.age).toBe(p.age);
        expect(a.bmi).toBeGreaterThan(10);
        expect(a.bmi).toBeLessThan(43);
        const fam = familyLook(p, content, shift.seed);
        expect(fam.age).toBeGreaterThanOrEqual(18);
        expect(fam.cues).toEqual({});
      }
    }
  });

  it('perawat memakai baju jaga senada atas-bawah, paramedis berseragam', () => {
    for (const name of ['Ners Rina', 'Ners Dimas', 'Ners Sari', 'Ners Yoga']) {
      const n = staffLook('perawat', name, content, 3);
      expect(n.outfit.top).toBe(n.outfit.bottom);
      expect(n.sex).toBe(name === 'Ners Dimas' || name === 'Ners Yoga' ? 'male' : 'female');
    }
    const pm = staffLook('paramedis', 'Paramedis 1', content, 3);
    expect(pm.outfit.top).toBe('#e3702c');
  });
});
