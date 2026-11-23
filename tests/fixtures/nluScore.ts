import type { Intent } from '../../src/core/nlu';
import type { NluCase } from './nluCorpus';

/** Ringkas maksud ke format korpus (`T:onset`, `S:demam`, `D:batuk/onset`, `R:bab`, `greeting`, …). */
export function formatIntent(i: Intent): string {
  switch (i.kind) {
    case 'topic':
      return `T:${i.topic}`;
    case 'symptom':
      return `S:${i.symptom}`;
    case 'symptom_detail':
      return `D:${i.symptom}/${i.topic}`;
    case 'review':
      return `R:${i.group}`;
    default:
      return i.kind;
  }
}

export interface NluScore {
  ok: number;
  total: number;
  accuracy: number;
  misses: { q: string; want: string[]; got: string[] }[];
}

/** Nilai satu korpus: butir benar bila himpunan maksudnya persis sama (urutan diabaikan). */
export function scoreCorpus(cases: readonly NluCase[], interpret: (q: string) => readonly Intent[]): NluScore {
  const misses: NluScore['misses'] = [];
  for (const c of cases) {
    const got = interpret(c.q).map(formatIntent).sort();
    const want = [...c.expect].sort();
    if (JSON.stringify(got) !== JSON.stringify(want)) misses.push({ q: c.q, want, got });
  }
  const ok = cases.length - misses.length;
  return { ok, total: cases.length, accuracy: cases.length ? ok / cases.length : 1, misses };
}
