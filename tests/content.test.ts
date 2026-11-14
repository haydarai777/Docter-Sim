import { describe, expect, it } from 'vitest';
import { buildContent } from '../src/core/content';
import { generateCase } from '../src/core/generator';
import { deriveSeed } from '../src/core/rng';
import { findUnfilledPlaceholders } from '../src/core/text';
import type { DiseaseTemplate, GameContent } from '../src/core/types';
import { validateContent } from '../src/core/validate';
import { config, content, configWith } from './helpers';

/** Salinan konten dengan satu penyakit dimodifikasi (untuk menguji validator). */
function withDisease(mutate: (d: DiseaseTemplate) => void): GameContent {
  const diseases = structuredClone(content.diseases);
  mutate(diseases[0]!);
  return buildContent({
    tools: { review: { status: 'BELUM_DITINJAU_DOKTER' }, tools: content.tools },
    symptoms: { review: { status: 'BELUM_DITINJAU_DOKTER' }, symptoms: content.symptoms },
    anamnesis: { review: { status: 'BELUM_DITINJAU_DOKTER' }, categories: content.anamnesis, conversation: content.conversation, reviews: content.reviews },
    personalities: { personalities: content.personalities },
    population: { ...content.population, allergies: content.allergies },
    diseases,
    comorbidities: { review: { status: 'BELUM_DITINJAU_DOKTER' }, comorbidities: content.comorbidities, incidentals: content.incidentals },
    conditions: { review: { status: 'BELUM_DITINJAU_DOKTER' }, conditions: content.conditions },
    appearance: content.appearance,
  });
}

describe('integritas konten', () => {
  it('semua konten bawaan valid', () => {
    expect(validateContent(content, config)).toEqual([]);
  });

  it('semua konten ditandai status tinjauan medis', () => {
    for (const d of content.diseases) {
      expect(['BELUM_DITINJAU_DOKTER', 'SEDANG_DITINJAU', 'DISETUJUI']).toContain(d.review.status);
    }
  });

  it('validator menangkap rujukan yang salah', () => {
    const broken = withDisease((d) => {
      d.symptoms.push({ id: 'gejala_fiktif', probability: 0.5 });
      d.findings.push({ tool: 'alat_fiktif', param: 'x', range: [1, 2] });
      d.plan.tests.push({ tool: 'alat_fiktif', role: 'kunci', reason: 'x' });
      d.differentials.push({ id: 'penyakit_fiktif', howToDistinguish: 'x', excludeBy: { tools: ['tanda_vital'] } });
      d.complications = [...(d.complications ?? []), { id: 'cx', name: 'x', trait: 'trait_fiktif', redFlag: true, assess: { topics: ['topik_fiktif'] }, explanation: 'x' }];
      d.disposition.push({ value: 'pulang' as never, reason: 'x' });
      d.anamnesis.onset!.push({ text: 'Placeholder {tidakAda}' });
    });
    const errors = validateContent(broken, config).join('\n');
    expect(errors).toContain('gejala_fiktif');
    expect(errors).toContain('alat tidak ada');
    expect(errors).toContain('penyakit_fiktif');
    expect(errors).toContain('{tidakAda}');
    expect(errors).toContain('trait "trait_fiktif"');
    expect(errors).toContain('topik "topik_fiktif"');
    expect(errors).toContain('disposisi tidak valid');
  });

  it('validator menangkap disposisi tanpa aturan default & banding tanpa bukti', () => {
    const broken = withDisease((d) => {
      d.disposition = [{ value: 'rujuk_segera', reason: 'x', when: { dayMin: 1 } }];
      d.differentials[0]!.excludeBy = undefined;
    });
    const errors = validateContent(broken, config).join('\n');
    expect(errors).toContain('aturan terakhir harus tanpa kondisi');
    expect(errors).toContain('bukti kosong');
  });

  it('validator menangkap aturan temuan yang tidak akan pernah terpakai', () => {
    const broken = withDisease((d) => {
      d.findings.push({ tool: 'tanda_vital', param: 'suhu', range: [38, 39] });
      d.findings.push({ tool: 'tanda_vital', param: 'suhu', range: [37, 38] });
    });
    expect(validateContent(broken, config).join('\n')).toContain('tidak akan pernah terpakai');
  });

  it('validator menangkap harga alat yang hilang', () => {
    const noPrice = configWith({ toolPrices: {} });
    delete (noPrice.toolPrices as Record<string, number>).darah_lengkap;
    expect(validateContent(content, noPrice).join('\n')).toContain('alat.darah_lengkap: harga belum diatur');
  });

  it('ratusan kasus per penyakit ter-generate tanpa placeholder tersisa', () => {
    for (const disease of content.diseases) {
      for (let i = 0; i < 150; i++) {
        const c = generateCase(content, config, { diseaseId: disease.id, seed: deriveSeed(99, `${disease.id}:${i}`) });
        const texts = [c.greeting, c.complaint, ...Object.values(c.answers).map((a) => a.text)];
        for (const r of content.reviews) texts.push(...r.normal);
        for (const t of texts) expect(findUnfilledPlaceholders(t), `${disease.id}: "${t}"`).toEqual([]);
      }
    }
  });
});
