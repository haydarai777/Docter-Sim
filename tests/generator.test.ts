import { describe, expect, it } from 'vitest';
import { generateCase } from '../src/core/generator';
import { deriveSeed } from '../src/core/rng';
import type { NumericParamDef, PatientCase } from '../src/core/types';
import { config, configWith, content, DISEASE_IDS } from './helpers';

function many(diseaseId: string, n: number, cfg = config): PatientCase[] {
  return Array.from({ length: n }, (_, i) =>
    generateCase(content, cfg, { diseaseId, seed: deriveSeed(7, `${diseaseId}:${i}`) }),
  );
}

describe('generator kasus', () => {
  it('deterministik: seed sama → kasus identik', () => {
    for (const id of DISEASE_IDS) {
      const a = generateCase(content, config, { diseaseId: id, seed: 123 });
      const b = generateCase(content, config, { diseaseId: id, seed: 123 });
      expect(a).toEqual(b);
    }
  });

  it('variasi: seed berbeda → pasien dengan penyakit sama tidak identik', () => {
    const cases = many('dengue', 30);
    const signatures = new Set(cases.map((c) => `${c.patient.name}|${c.patient.age}|${c.symptoms.join(',')}|${c.complaint}`));
    expect(signatures.size).toBeGreaterThan(25);
  });

  it('melempar error untuk penyakit yang tidak dikenal', () => {
    expect(() => generateCase(content, config, { diseaseId: 'tidak_ada', seed: 1 })).toThrow();
  });

  it('demografi konsisten dengan penyakit, pekerjaan, dan config', () => {
    for (const id of DISEASE_IDS) {
      const disease = content.diseasesById.get(id)!;
      for (const c of many(id, 200)) {
        const p = c.patient;
        const occ = content.occupationsById.get(p.occupationId)!;
        expect(p.age).toBeGreaterThanOrEqual(config.patient.minAge);
        expect(p.age).toBeLessThanOrEqual(config.patient.maxAge);
        expect(p.age).toBeGreaterThanOrEqual(occ.age[0]);
        expect(p.age).toBeLessThanOrEqual(occ.age[1]);
        if (occ.sex) expect(p.sex).toBe(occ.sex);
        expect(occ.economy).toContain(p.economy);
        expect(disease.demographics.ageBands.some((b) => p.age >= b.min && p.age <= b.max)).toBe(true);
      }
    }
  });

  it('rasio jenis kelamin mengikuti data penyakit (malaria didominasi laki-laki)', () => {
    const males = many('malaria', 400).filter((c) => c.patient.sex === 'male').length / 400;
    expect(males).toBeGreaterThan(0.65);
    expect(males).toBeLessThan(0.85);
  });

  it('budget sesuai status ekonomi dan dibulatkan', () => {
    for (const c of many('demam_tifoid', 200)) {
      const [lo, hi] = config.economy.classes[c.patient.economy].budget;
      expect(c.patient.budget).toBeGreaterThanOrEqual(lo);
      expect(c.patient.budget).toBeLessThanOrEqual(hi);
      expect(c.patient.budget % config.economy.budgetRounding).toBe(0);
    }
  });

  it('hari sakit dalam rentang presentasi penyakit', () => {
    for (const id of DISEASE_IDS) {
      const [lo, hi] = content.diseasesById.get(id)!.presentationDay;
      for (const c of many(id, 100)) {
        expect(c.day).toBeGreaterThanOrEqual(lo);
        expect(c.day).toBeLessThanOrEqual(hi);
      }
    }
  });

  it('keluhan utama hanya menyebut sebagian gejala yang benar-benar ada', () => {
    for (const id of DISEASE_IDS) {
      for (const c of many(id, 100)) {
        expect(c.chiefComplaintSymptoms.length).toBeGreaterThan(0);
        for (const s of c.chiefComplaintSymptoms) expect(c.symptoms).toContain(s);
        // revealOrder = gejala sisanya
        expect([...c.chiefComplaintSymptoms, ...c.revealOrder].sort()).toEqual([...c.symptoms].sort());
      }
    }
    // Gejala tidak pernah disebut lengkap di awal (secara umum).
    const all = DISEASE_IDS.flatMap((id) => many(id, 100));
    const complete = all.filter((c) => c.revealOrder.length === 0).length;
    expect(complete / all.length).toBeLessThan(0.05);
  });

  it('jawaban anamnesis hanya mengungkap gejala yang ada', () => {
    for (const id of DISEASE_IDS) {
      for (const c of many(id, 100)) {
        for (const a of Object.values(c.answers)) {
          for (const r of a.reveals ?? []) expect(c.symptoms).toContain(r);
        }
      }
    }
  });

  it('setiap alat menghasilkan semua parameternya, terformat dan bertanda benar', () => {
    const c = generateCase(content, config, { diseaseId: 'dengue', seed: 55 });
    for (const tool of content.tools) {
      const results = c.findings[tool.id]!;
      expect(results.map((r) => r.paramId)).toEqual(tool.params.map((p) => p.id));
      for (const r of results) {
        const param = tool.params.find((p) => p.id === r.paramId)!;
        expect(r.display.length).toBeGreaterThan(0);
        if (param.kind === 'text' && r.flag === null) expect(param.normal).toContain(r.value);
        if (param.kind === 'numeric') expect(typeof r.value).toBe('number');
      }
    }
  });

  it('hitung jenis leukosit selalu berjumlah 100%', () => {
    const tool = content.toolsById.get('darah_lengkap')!;
    const group = tool.groups![0]!;
    for (const id of DISEASE_IDS) {
      for (const c of many(id, 100)) {
        const sum = c.findings.darah_lengkap!.filter((r) => group.params.includes(r.paramId)).reduce((s, r) => s + (r.value as number), 0);
        expect(sum).toBe(100);
      }
    }
  });

  it('pemeriksaan tidak relevan pada pasien normal menghasilkan nilai normal (mode akurat)', () => {
    const accurate = configWith({ tests: { realisticAccuracy: false } });
    // Pasien dengue: RDT malaria & Tubex tidak relevan → selalu normal.
    for (const c of many('dengue', 200, accurate)) {
      expect(c.findings.rdt_malaria!.every((r) => r.flag === null)).toBe(true);
      expect(c.findings.tubex!.every((r) => r.flag === null)).toBe(true);
    }
  });

  it('mode akurat: tes diagnostik selalu positif untuk penyakitnya', () => {
    const accurate = configWith({ tests: { realisticAccuracy: false } });
    for (const c of many('dengue', 100, accurate)) expect(c.findings.ns1_dengue![0]!.value).toBe('Positif');
    for (const c of many('demam_tifoid', 100, accurate)) expect(c.findings.tubex![0]!.flag).toBe('+');
    for (const c of many('malaria', 100, accurate)) expect(c.findings.rdt_malaria!.find((r) => r.paramId === 'pan')!.value).toBe('Positif');
  });

  it('mode realistis: ada negatif palsu dan positif palsu', () => {
    const dengue = many('dengue', 300);
    const ns1Negative = dengue.filter((c) => c.findings.ns1_dengue![0]!.value === 'Negatif').length;
    expect(ns1Negative).toBeGreaterThan(0);
    const widalFalsePositive = dengue.filter((c) => c.findings.widal!.some((r) => r.source === 'false_positive')).length;
    expect(widalFalsePositive / 300).toBeGreaterThan(0.1);
    expect(widalFalsePositive / 300).toBeLessThan(0.35);
  });

  it('NS1 lebih sering positif di awal sakit daripada di akhir', () => {
    const dengue = many('dengue', 600);
    const rate = (cases: PatientCase[]) => cases.filter((c) => c.findings.ns1_dengue![0]!.value === 'Positif').length / Math.max(1, cases.length);
    expect(rate(dengue.filter((c) => c.day <= 3))).toBeGreaterThan(rate(dengue.filter((c) => c.day >= 6)) + 0.3);
  });

  it('nilai lab abnormal penyakit diberi penanda H/L sesuai nilai rujukan', () => {
    const hct = content.toolsById.get('darah_lengkap')!.params.find((p) => p.id === 'hematokrit') as NumericParamDef;
    for (const c of many('dengue', 200)) {
      const plt = c.findings.darah_lengkap!.find((r) => r.paramId === 'trombosit')!;
      if ((plt.value as number) < 150000) expect(plt.flag).toBe('L');
      const ht = c.findings.darah_lengkap!.find((r) => r.paramId === 'hematokrit')!;
      const upper = c.patient.sex === 'female' ? hct.refFemale![1] : hct.ref[1];
      if (c.traits.includes('kebocoran_plasma')) {
        expect(ht.value as number).toBeGreaterThan(upper);
        expect(ht.flag).toBe('H');
      }
    }
  });
});
