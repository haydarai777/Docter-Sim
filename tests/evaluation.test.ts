import { describe, expect, it } from 'vitest';
import { applyIntents, performExam, setDdx, startEncounter, submitDecision } from '../src/core/encounter';
import { caseSecondaryProblems, dispositionCredit, evaluateEncounter, expectedDisposition, caseContext } from '../src/core/evaluation';
import { generateCase } from '../src/core/generator';
import { createRng, deriveSeed } from '../src/core/rng';
import { playEncounterBot } from '../src/core/simulate';
import type { ClinicalDecision, EncounterState, EvaluationResult, PatientCase } from '../src/core/types';
import { config, content } from './helpers';

function findCase(diseaseId: string, pred: (c: PatientCase) => boolean, tries = 600): PatientCase {
  for (let i = 0; i < tries; i++) {
    const c = generateCase(content, config, { diseaseId, seed: deriveSeed(42, `${diseaseId}:${i}`) });
    if (pred(c)) return c;
  }
  throw new Error(`Tidak ada kasus ${diseaseId} yang cocok`);
}

const rich = (c: PatientCase): PatientCase => ({ ...c, patient: { ...c.patient, budget: 5_000_000 } });
const comp = (ev: EvaluationResult, key: string) => ev.components.find((x) => x.key === key)!;
const allText = (ev: EvaluationResult) => ev.components.flatMap((x) => [...x.good, ...x.missed].map((f) => `${f.text} ${f.detail ?? ''}`)).join('\n');

function decide(state: EncounterState, d: Partial<ClinicalDecision>): EvaluationResult {
  const disease = content.diseasesById.get(state.case.diseaseId)!;
  const decision: ClinicalDecision = {
    primary: state.case.diseaseId,
    secondary: [],
    complications: [],
    disposition: expectedDisposition(disease, caseContext(state)).value,
    ...d,
  };
  return evaluateEncounter(state, decision, content, config);
}

const exam = (s: EncounterState, ...tools: string[]) => tools.reduce((acc, t) => performExam(acc, t, content, config), s);
const askTopics = (s: EncounterState, ...topics: string[]) => applyIntents(s, topics.map((topic) => ({ kind: 'topic' as const, topic })), content).state;

describe('penilaian klinis: struktur', () => {
  it('bobot komponen mengikuti config (25/15/20/20/10/10) dan total ≤ 100', () => {
    const c = generateCase(content, config, { diseaseId: 'dengue', seed: 1 });
    const ev = decide(startEncounter(c), {});
    expect(ev.components.map((x) => [x.key, x.max])).toEqual(Object.entries(config.evaluation.weights));
    expect(Object.values(config.evaluation.weights).reduce((a, b) => a + b, 0)).toBe(100);
    expect(ev.total).toBeGreaterThanOrEqual(0);
    expect(ev.total).toBeLessThanOrEqual(100);
  });

  it('proses lengkap & tepat → nilai A pada semua penyakit', () => {
    for (const d of content.diseases) {
      for (let i = 0; i < 6; i++) {
        const c = rich(generateCase(content, config, { diseaseId: d.id, seed: deriveSeed(3, `${d.id}:${i}`) }));
        const played = playEncounterBot(startEncounter(c), { skill: 1 }, createRng(i), content, config);
        const ev = evaluateEncounter(played.state, played.decision, content, config);
        expect(ev.total, `${d.id}#${i}\n${allText(ev)}`).toBeGreaterThanOrEqual(85);
        expect(ev.primaryCorrect).toBe(true);
        expect(ev.unsafe).toBe(false);
      }
    }
  });

  it('diagnosis benar tanpa proses (tebakan) tidak mendapat nilai bagus', () => {
    const c = generateCase(content, config, { diseaseId: 'demam_tifoid', seed: 9 });
    const ev = decide(startEncounter(c), {});
    expect(ev.primaryCorrect).toBe(true);
    expect(ev.total).toBeLessThan(55);
    expect(comp(ev, 'anamnesis').score).toBeLessThan(5);
    expect(comp(ev, 'fisik').missed.some((m) => m.text.includes('Tanda vital'))).toBe(true);
    expect(ev.recommendations.length).toBeGreaterThan(0);
  });
});

describe('penilaian klinis: anamnesis', () => {
  it('menggali keluhan tambahan & gejala tersembunyi menaikkan skor', () => {
    const c = findCase('dispepsia', (x) => x.hiddenSymptoms.includes('bab_hitam'));
    const base = askTopics(startEncounter(c), 'onset', 'lokasi');
    const deeper = applyIntents(askTopics(base, 'keluhan_lain'), [{ kind: 'symptom', symptom: 'bab_hitam' }], content).state;
    const a = comp(decide(base, {}), 'anamnesis');
    const b = comp(decide(deeper, {}), 'anamnesis');
    expect(b.score).toBeGreaterThan(a.score);
    expect(a.missed.some((m) => m.text.includes('BAB hitam'))).toBe(true);
  });

  it('topik berpetunjuk yang terlewat dijelaskan', () => {
    const c = generateCase(content, config, { diseaseId: 'malaria', seed: 4 });
    const ev = decide(startEncounter(c), {});
    expect(comp(ev, 'anamnesis').missed.some((m) => m.text.startsWith('Tidak menanyakan'))).toBe(true);
  });
});

describe('penilaian klinis: pemeriksaan', () => {
  it('pemeriksaan tidak perlu mengurangi skor penunjang', () => {
    const c = rich(generateCase(content, config, { diseaseId: 'isk', seed: 5 }));
    const good = exam(startEncounter(c), 'tanda_vital', 'urinalisis');
    const wasteful = exam(good, 'ct_abdomen');
    const a = comp(decide(good, {}), 'penunjang');
    const b = comp(decide(wasteful, {}), 'penunjang');
    expect(b.score).toBeLessThan(a.score);
    expect(b.missed.some((m) => m.text.includes('tidak perlu') || m.text.includes('kurang relevan'))).toBe(true);
  });

  it('adil terhadap budget: pasien miskin tidak dituntut pemeriksaan di luar jangkauannya', () => {
    const c0 = generateCase(content, config, { diseaseId: 'batu_saluran_kemih', seed: 8 });
    const poor: PatientCase = { ...c0, patient: { ...c0.patient, budget: 75_000 } };
    const s = exam(startEncounter(poor), 'tanda_vital', 'urinalisis');
    const richS = exam(startEncounter(rich(c0)), 'tanda_vital', 'urinalisis');
    expect(comp(decide(s, {}), 'penunjang').score).toBeGreaterThan(comp(decide(richS, {}), 'penunjang').score);
  });

  it('pemeriksaan yang mendeteksi komorbiditas tidak dianggap pemborosan', () => {
    const c = rich(findCase('isk', (x) => x.comorbidities.some((m) => m.id === 'dm_tipe2') && (x.findings.gula_darah ?? []).some((r) => r.origin === 'dm_tipe2')));
    const s = exam(startEncounter(c), 'tanda_vital', 'urinalisis', 'gula_darah');
    const ev = decide(s, {});
    expect(comp(ev, 'penunjang').good.some((g) => g.detail?.includes('masalah lain'))).toBe(true);
  });
});

describe('penilaian klinis: diagnosis banding', () => {
  it('menyingkirkan banding DENGAN bukti lebih baik daripada tanpa bukti', () => {
    const c = rich(generateCase(content, config, { diseaseId: 'dengue', seed: 12 }));
    const diff = content.diseasesById.get('dengue')!.differentials.find((d) => d.excludeBy?.tools?.length)!;
    const noEvidence = setDdx(setDdx(startEncounter(c), 'dengue', 'utama', content), diff.id, 'disingkirkan', content);
    const withEvidence = exam(noEvidence, ...diff.excludeBy!.tools!.filter((t) => content.toolsById.has(t)).slice(0, 1));
    const a = decide(noEvidence, {});
    const b = decide(withEvidence, {});
    expect(comp(b, 'banding').score).toBeGreaterThan(comp(a, 'banding').score);
    expect(comp(a, 'banding').missed.some((m) => m.text.includes('tanpa bukti'))).toBe(true);
    expect(comp(b, 'banding').good.some((g) => g.text.includes('dengan bukti'))).toBe(true);
  });

  it('diagnosis berbahaya yang tidak dipertimbangkan disebut', () => {
    const c = generateCase(content, config, { diseaseId: 'angina_stabil', seed: 2 });
    const ev = decide(startEncounter(c), {});
    expect(comp(ev, 'banding').missed.some((m) => m.text.includes('berbahaya'))).toBe(true);
  });

  it('batu saluran kemih: fungsi ginjal normal tidak boleh dipakai menyingkirkan batu', () => {
    const c = rich(findCase('batu_saluran_kemih', (x) => (x.findings.fungsi_ginjal ?? []).every((r) => r.flag === null)));
    let s = exam(startEncounter(c), 'tanda_vital', 'fungsi_ginjal');
    s = setDdx(setDdx(s, 'batu_saluran_kemih', 'disingkirkan', content), 'isk', 'utama', content);
    const ev = decide(s, { primary: 'isk' });
    expect(ev.pitfalls.some((p) => p.includes('Fungsi ginjal normal tidak menyingkirkan'))).toBe(true);
    expect(ev.primaryCorrect).toBe(false);
  });

  it('sumbatan tanpa batu yang tampak → harus mempertimbangkan massa', () => {
    const c = rich(findCase('batu_saluran_kemih', (x) => x.traits.includes('hidronefrosis') && !x.traits.includes('batu_tampak_usg'), 3000));
    const s = exam(startEncounter(c), 'tanda_vital', 'usg_abdomen');
    expect(decide(s, {}).pitfalls.some((p) => p.includes('massa'))).toBe(true);
    const considered = setDdx(s, 'massa_saluran_kemih', 'mungkin', content);
    expect(decide(considered, {}).pitfalls.some((p) => p.includes('massa'))).toBe(false);
  });
});

describe('penilaian klinis: komplikasi, masalah lain, disposisi', () => {
  it('komplikasi yang ada harus dikenali; klaim palsu dikoreksi', () => {
    const c = rich(findCase('pneumonia', (x) => x.complications.length > 0));
    const cx = c.complications[0]!;
    const s = startEncounter(c);
    const recognized = comp(decide(s, { complications: [cx] }), 'komplikasi');
    const missed = comp(decide(s, { complications: [] }), 'komplikasi');
    expect(recognized.score).toBeGreaterThan(missed.score);
    expect(missed.missed.some((m) => m.text.includes('tidak dikenali'))).toBe(true);
    const clean = rich(findCase('pneumonia', (x) => x.complications.length === 0));
    const other = content.diseasesById.get('pneumonia')!.complications![0]!.id;
    expect(comp(decide(startEncounter(clean), { complications: [other] }), 'komplikasi').missed.some((m) => m.text.includes('tidak ada'))).toBe(true);
  });

  it('masalah lain yang sudah ditemukan harus dicatat', () => {
    const c = rich(findCase('dengue', (x) => x.comorbidities.some((m) => m.id === 'hipertensi') && (x.findings.tanda_vital ?? []).some((r) => r.origin === 'hipertensi')));
    const s = exam(startEncounter(c), 'tanda_vital');
    expect(caseSecondaryProblems(s, content.diseasesById.get('dengue')!, content).find((p) => p.id === 'hipertensi')?.detectable).toBe(true);
    const without = comp(decide(s, {}), 'keputusan');
    const withIt = comp(decide(s, { secondary: ['hipertensi'] }), 'keputusan');
    expect(withIt.score).toBeGreaterThan(without.score);
    expect(without.missed.some((m) => m.text.includes('Hipertensi'))).toBe(true);
  });

  it('temuan insidental yang tertutup temuan penyakit utama tidak dituntut', () => {
    const c = findCase('batu_saluran_kemih', (x) => x.incidentals.includes('kista_ginjal') && x.traits.includes('batu_tampak_usg'), 5000);
    const s = exam(startEncounter(rich(c)), 'usg_abdomen');
    const p = caseSecondaryProblems(s, content.diseasesById.get('batu_saluran_kemih')!, content).find((x) => x.id === 'kista_ginjal')!;
    expect(p.detectable).toBe(false);
  });

  it('memulangkan pasien yang perlu rujuk segera = tidak aman', () => {
    const c = findCase('dengue', (x) => expectedDisposition(content.diseasesById.get('dengue')!, caseContext(startEncounter(x))).value === 'rujuk_segera');
    const s = startEncounter(c);
    const unsafe = decide(s, { disposition: 'rawat_jalan' });
    const safe = decide(s, { disposition: 'rujuk_segera' });
    expect(unsafe.unsafe).toBe(true);
    expect(unsafe.reputationBreakdown.unsafe).toBe(-config.reputation.unsafeDispositionPenalty);
    expect(safe.unsafe).toBe(false);
    expect(safe.reputationDelta).toBeGreaterThan(unsafe.reputationDelta);
  });

  it('kredit disposisi: tepat penuh, over-triage sebagian, under-triage nol', () => {
    expect(dispositionCredit('observasi', 'observasi', [])).toBe(1);
    expect(dispositionCredit('rujuk_spesialis', 'observasi', [])).toBeGreaterThan(0);
    expect(dispositionCredit('rujuk_spesialis', 'observasi', [])).toBeLessThan(1);
    expect(dispositionCredit('rawat_jalan', 'observasi', [])).toBe(0);
    expect(dispositionCredit('rawat_jalan', 'rujuk_spesialis', ['rawat_jalan'])).toBe(1);
  });

  it('diagnosis utama salah: penalti reputasi sesuai bahaya penyakit yang terlewat', () => {
    const c = generateCase(content, config, { diseaseId: 'angina_stabil', seed: 3 });
    const s = startEncounter(c);
    const wrong = decide(s, { primary: 'gerd' });
    expect(wrong.primaryCorrect).toBe(false);
    expect(wrong.reputationBreakdown.wrongPrimary).toBe(-Math.round(config.reputation.wrongBase * config.reputation.dangerMultiplier.kritis));
    expect(comp(wrong, 'keputusan').missed[0]!.text).toContain('Angina');
  });

  it('submitDecision menyimpan evaluasi yang sama dengan evaluateEncounter', () => {
    const c = generateCase(content, config, { diseaseId: 'asma', seed: 6 });
    const s = exam(startEncounter(c), 'tanda_vital', 'pemeriksaan_paru');
    const decision: ClinicalDecision = { primary: 'asma', secondary: [], complications: [], disposition: 'rawat_jalan' };
    expect(submitDecision(s, decision, content, config).evaluation).toEqual(evaluateEncounter(s, decision, content, config));
  });
});
