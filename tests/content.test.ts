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
    anamnesis: { review: { status: 'BELUM_DITINJAU_DOKTER' }, categories: content.anamnesis },
    personalities: { personalities: content.personalities },
    population: content.population,
    diseases,
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
      d.idealWorkup.push('alat_fiktif');
      d.differentials.push({ id: 'penyakit_fiktif', howToDistinguish: 'x' });
      d.anamnesis.onset!.push({ text: 'Placeholder {tidakAda}' });
    });
    const errors = validateContent(broken, config).join('\n');
    expect(errors).toContain('gejala_fiktif');
    expect(errors).toContain('alat tidak ada');
    expect(errors).toContain('penyakit_fiktif');
    expect(errors).toContain('{tidakAda}');
  });

  it('validator menangkap aturan temuan yang tidak akan pernah terpakai', () => {
    const broken = withDisease((d) => {
      d.findings.push({ tool: 'termometer', param: 'suhu', range: [38, 39] });
      d.findings.push({ tool: 'termometer', param: 'suhu', range: [37, 38] });
    });
    expect(validateContent(broken, config).join('\n')).toContain('tidak akan pernah terpakai');
  });

  it('validator menangkap harga alat yang hilang', () => {
    const noPrice = configWith({ toolPrices: {} });
    delete (noPrice.toolPrices as Record<string, number>).termometer;
    expect(validateContent(content, noPrice).join('\n')).toContain('alat.termometer: harga belum diatur');
  });

  it('ratusan kasus per penyakit ter-generate tanpa placeholder tersisa', () => {
    for (const disease of content.diseases) {
      for (let i = 0; i < 150; i++) {
        const c = generateCase(content, config, { diseaseId: disease.id, seed: deriveSeed(99, `${disease.id}:${i}`) });
        const texts = [c.greeting, c.complaint, ...Object.values(c.answers).map((a) => a.text)];
        for (const t of texts) expect(findUnfilledPlaceholders(t), `${disease.id}: "${t}"`).toEqual([]);
      }
    }
  });
});
