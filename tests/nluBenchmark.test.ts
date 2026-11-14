import { describe, expect, it } from 'vitest';
import { editDistance, interpretQuestion } from '../src/core/nlu';
import { NLU_CORPUS } from './fixtures/nluCorpus';
import { NLU_HOLDOUT } from './fixtures/nluHoldout';
import { NLU_HOLDOUT_2 } from './fixtures/nluHoldout2';
import { NLU_HOLDOUT_3 } from './fixtures/nluHoldout3';
import { scoreCorpus } from './fixtures/nluScore';
import { config, content } from './helpers';

/**
 * Penjaga regresi pemahaman bahasa lokal (mode offline). Angka buta saat pertama diukur
 * dicatat di docs/nlu-benchmark.md; di sini ambangnya dijaga agar perubahan kata kunci tidak
 * diam-diam merusak pemahaman.
 */

const interpret = (q: string) => interpretQuestion(q, content, config.anamnesis.maxIntentsPerQuestion).intents;

describe('benchmark NLU offline', () => {
  it.each([
    ['penyetelan', NLU_CORPUS, 0.98],
    ['uji terpisah ronde 1', NLU_HOLDOUT, 0.95],
    ['uji terpisah ronde 2', NLU_HOLDOUT_2, 0.95],
    ['uji terpisah ronde 3', NLU_HOLDOUT_3, 0.95],
  ] as const)('korpus %s ≥ ambang', (_name, cases, threshold) => {
    const s = scoreCorpus(cases, interpret);
    const detail = s.misses.map((m) => `${m.q} → ${m.got.join(' ') || '(kosong)'} (ingin ${m.want.join(' ')})`).join('\n');
    expect(s.accuracy, detail).toBeGreaterThanOrEqual(threshold);
  });

  it('korpus tidak berisi pertanyaan ganda (agar angka tidak menggelembung)', () => {
    const all = [...NLU_CORPUS, ...NLU_HOLDOUT, ...NLU_HOLDOUT_2, ...NLU_HOLDOUT_3].map((c) => c.q.toLowerCase().trim());
    const dup = all.filter((q, i) => all.indexOf(q) !== i);
    expect(dup).toEqual([]);
  });

  it('label korpus hanya memakai topik/gejala/tinjauan yang ada', () => {
    for (const c of [...NLU_CORPUS, ...NLU_HOLDOUT, ...NLU_HOLDOUT_2, ...NLU_HOLDOUT_3]) {
      for (const e of c.expect) {
        const [kind, rest] = e.includes(':') ? (e.split(':') as [string, string]) : [e, ''];
        if (kind === 'T') expect(content.anamnesisById.has(rest), e).toBe(true);
        else if (kind === 'S') expect(content.symptomsById.has(rest), e).toBe(true);
        else if (kind === 'R') expect(content.reviewsById.has(rest), e).toBe(true);
        else if (kind === 'D') {
          const [sym, topic] = rest.split('/') as [string, string];
          expect(content.symptomsById.has(sym) && content.anamnesisById.has(topic), e).toBe(true);
        } else expect(['greeting', 'thanks', 'consent', 'repeat']).toContain(kind);
      }
    }
  });

  it('cepat: ribuan pertanyaan per detik', () => {
    const qs = [...NLU_CORPUS, ...NLU_HOLDOUT_2].map((c) => c.q);
    interpret(qs[0]!); // bangun indeks kata kunci
    const t0 = performance.now();
    for (let k = 0; k < 4; k++) for (const q of qs) interpret(q);
    const perQuestionMs = (performance.now() - t0) / (qs.length * 4);
    expect(perQuestionMs).toBeLessThan(2);
  });
});

describe('koreksi salah ketik', () => {
  it('jarak Damerau–Levenshtein menghitung pertukaran huruf sebagai satu', () => {
    expect(editDistance('sejka', 'sejak')).toBe(1);
    expect(editDistance('demam', 'demam')).toBe(0);
    expect(editDistance('batk', 'batuk')).toBe(1);
    expect(editDistance('abcdef', 'uvwxyz', 2)).toBe(3);
  });

  it('kata umum yang sah tidak "dikoreksi" menjadi istilah medis', () => {
    // "kesehatan" ≠ "kesemutan", "kucing" ≠ "kuning"
    expect(interpret('Ada masalah kesehatan apa?')).toEqual([{ kind: 'topic', topic: 'keluhan_utama' }]);
    expect(interpret('Siapa nama kucing Bapak?')).toEqual([]);
  });

  it('huruf terlewat lebih diutamakan daripada huruf tertukar ("batk" → batuk, bukan "baik")', () => {
    expect(interpret('Batk?')).toEqual([{ kind: 'symptom', symptom: 'batuk' }]);
  });
});
