/**
 * Stasiun prosedur: pemain menyusun langkah dari kartu (langkah benar + pengecoh) lalu menjawab
 * pertanyaan kritis. Penilaian: ketepatan urutan (subbarisan naik terpanjang), langkah kritis
 * yang terlewat, tindakan berbahaya, dan jawaban pertanyaan.
 */
import { createRng } from '../rng';
import { categoryOf } from './station';
import type { ProcedureAttempt, ProcedureDef, ProcedureDistractor, ProcedureResult, ProcedureStep } from './types';

/** Kartu acak (langkah + pengecoh) untuk satu percobaan; deterministik per seed. */
export function procedureCards(proc: ProcedureDef, seed: number): { id: string; text: string }[] {
  const cards = [...proc.steps.map((s) => ({ id: s.id, text: s.text })), ...proc.distractors.map((d) => ({ id: d.id, text: d.text }))];
  const rng = createRng(seed);
  for (let i = cards.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [cards[i], cards[j]] = [cards[j]!, cards[i]!];
  }
  return cards;
}

/** Panjang subbarisan naik terpanjang (berapa langkah yang urutannya benar relatif satu sama lain). */
export function longestIncreasing(values: readonly number[]): number[] {
  const n = values.length;
  const len = new Array<number>(n).fill(1);
  const prev = new Array<number>(n).fill(-1);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (values[j]! < values[i]! && len[j]! + 1 > len[i]!) {
        len[i] = len[j]! + 1;
        prev[i] = j;
      }
    }
  }
  let best = -1;
  for (let i = 0; i < n; i++) if (best < 0 || len[i]! > len[best]!) best = i;
  const out: number[] = [];
  for (let i = best; i >= 0; i = prev[i]!) out.unshift(i);
  return out;
}

export function evaluateProcedure(proc: ProcedureDef, attempt: ProcedureAttempt): ProcedureResult {
  const order = new Map(proc.steps.map((s, i) => [s.id, i]));
  const chosenSteps = attempt.sequence.filter((id) => order.has(id));
  const positions = chosenSteps.map((id) => order.get(id)!);
  const lisIdx = longestIncreasing(positions);
  const inOrder = new Set(lisIdx.map((i) => chosenSteps[i]!));
  const chosen = new Set(chosenSteps);
  const missingSteps: ProcedureStep[] = proc.steps.filter((s) => !chosen.has(s.id));
  const outOfOrder: ProcedureStep[] = proc.steps.filter((s) => chosen.has(s.id) && !inOrder.has(s.id));
  const wrongActions: ProcedureDistractor[] = proc.distractors.filter((d) => attempt.sequence.includes(d.id));
  const questionResults = proc.questions.map((q) => ({ question: q, chosen: attempt.answers[q.id], correct: attempt.answers[q.id] === q.answer }));

  const orderScore = proc.steps.length ? inOrder.size / proc.steps.length : 1;
  const qScore = proc.questions.length ? questionResults.filter((r) => r.correct).length / proc.questions.length : 1;
  const penalty = wrongActions.filter((d) => !d.dangerous).length * 10;
  const percent = Math.max(0, Math.round(orderScore * 70 + qScore * 30 - penalty));

  const critical: string[] = [];
  for (const d of wrongActions) if (d.dangerous) critical.push(`Tindakan berbahaya: ${d.text} — ${d.why}`);
  for (const s of missingSteps) if (s.critical) critical.push(`Langkah kritis terlewat: ${s.text}`);
  return { procedureId: proc.id, percent, category: categoryOf(percent, critical), orderScore, missingSteps, outOfOrder, wrongActions, questionResults, critical };
}
