/**
 * Tab Tatalaksana mode praktik: skor resep/non-farmakologi/KIE, keselamatan resep (alergi, obat berbahaya,
 * antibiotik tanpa indikasi) terhadap skor & reputasi, penyakit tanpa data terapi, dan kompatibilitas sesi lama.
 */
import { describe, expect, it } from 'vitest';
import { addPrescriptionLine, performExam, removePrescriptionLine, startEncounter, submitDecision, toggleTreatmentAdvice, treatmentOf } from '../src/core/encounter';
import { caseContext, evaluateEncounter, expectedDisposition } from '../src/core/evaluation';
import { generateCase } from '../src/core/generator';
import { idealTreatment } from '../src/core/osce/answerKey';
import type { OsceContent } from '../src/core/osce/content';
import type { PrescriptionLine, TreatmentWork } from '../src/core/osce/types';
import { createRng, deriveSeed } from '../src/core/rng';
import { createRun, finishCurrent, startNextPatient } from '../src/core/run';
import { playEncounterBot } from '../src/core/simulate';
import { lineQuantity } from '../src/core/treatment';
import type { ClinicalDecision, EncounterState, EvaluationResult, PatientCase } from '../src/core/types';
import { loadOsceContent } from '../src/data/osce';
import { config, content, DISEASE_IDS, perDisease } from './helpers';

const osce: OsceContent = loadOsceContent();
const R = config.reputation;

function findCase(diseaseId: string, pred: (c: PatientCase) => boolean = () => true): PatientCase {
  for (let i = 0; i < 600; i++) {
    const c = generateCase(content, config, { diseaseId, seed: deriveSeed(77, `${diseaseId}:${i}`) });
    if (pred(c)) return c;
  }
  throw new Error(`tidak ada kasus ${diseaseId}`);
}

/** Konsultasi teliti (bot sempurna) + pasien ditimbang, siap diberi tatalaksana. */
function wellExamined(c: PatientCase): { state: EncounterState; decision: ClinicalDecision } {
  const rich = { ...c, patient: { ...c.patient, budget: 10_000_000 } };
  const played = playEncounterBot(startEncounter(rich), { skill: 1 }, createRng(c.seed), content, config);
  let state = played.state;
  if (!state.examsDone.includes('timbangan')) state = performExam(state, 'timbangan', content, config);
  return { state, decision: played.decision };
}

const line = (drug: string, form: string, units: number, timesPerDay: number, days: number): PrescriptionLine => {
  const l = { drug, form, units, schedule: 'rutin' as const, timesPerDay, days };
  return { ...l, quantity: lineQuantity(l, osce) };
};

function evaluateWith(state: EncounterState, decision: ClinicalDecision, work: TreatmentWork, osceContent: OsceContent = osce): EvaluationResult {
  return evaluateEncounter(state, decision, content, config, { osce: osceContent, work });
}

const tx = (ev: EvaluationResult) => ev.components.find((x) => x.key === 'tatalaksana')!;
const ideal = (state: EncounterState) => idealTreatment(state.case, caseContext(state), osce);

describe('tatalaksana: skor dari kunci terapi', () => {
  it('jawaban ideal (resep, non-farmakologi, KIE kunci) mendapat skor tatalaksana penuh di semua penyakit', { timeout: 300_000 }, () => {
    for (const id of DISEASE_IDS) {
      for (let i = 0; i < perDisease(4, 10); i++) {
        const base = generateCase(content, config, { diseaseId: id, seed: deriveSeed(91, `${id}:${i}`) });
        // Sebagian kasus dipaksa alergi obat agar pilihan obat pengganti ikut teruji.
        const allergies = ['amoksisilin', 'kotrimoksazol', 'ibuprofen', 'antalgin (metamizol)'];
        const c = i % 3 === 2 ? { ...base, allergy: allergies[i % allergies.length]! } : base;
        const { state, decision } = wellExamined(c);
        const ev = evaluateWith(state, decision, ideal(state));
        const t = tx(ev);
        expect(t.score, `${id}#${i}: ${t.missed.map((m) => m.text).join(' | ')}`).toBe(t.max);
        expect(ev.treatmentSafety, id).toBeUndefined();
        expect(ev.reputationBreakdown.treatment, id).toBe(0);
      }
    }
  });

  it('tab kosong → skor tatalaksana rendah & rekomendasi tatalaksana muncul', () => {
    const { state, decision } = wellExamined(findCase('dengue'));
    const ev = evaluateWith(state, decision, { prescription: [], nonPharm: [], education: [] });
    expect(tx(ev).score).toBeLessThan(tx(ev).max * 0.2);
    expect(ev.recommendations.some((r) => r.includes('resep'))).toBe(true);
    expect(tx(ev).answerKey?.some((k) => k.includes('Parasetamol') || k.includes('parasetamol'))).toBe(true);
  });

  it('total skor = jumlah ketujuh komponen dan tidak lebih dari 100', () => {
    const { state, decision } = wellExamined(findCase('dengue'));
    const ev = evaluateWith(state, decision, ideal(state));
    expect(ev.components).toHaveLength(7);
    expect(ev.total).toBe(Math.round(ev.components.reduce((s, x) => s + x.score, 0)));
    expect(ev.total).toBeLessThanOrEqual(100);
  });
});

describe('tatalaksana: keselamatan resep menurunkan skor & reputasi', () => {
  const dengue = () => wellExamined(findCase('dengue', (c) => c.patient.age >= 18 && !c.allergy));

  it('obat berbahaya (OAINS pada dengue) → skor resep 0, reputasi −harmfulDrugPenalty', () => {
    const { state, decision } = dengue();
    const work = ideal(state);
    const base = evaluateWith(state, decision, work);
    const bad = evaluateWith(state, decision, { ...work, prescription: [...work.prescription, line('ibuprofen', 'ibuprofen-tab400', 1, 3, 3)] });
    expect(bad.treatmentSafety?.harmful.length).toBeGreaterThan(0);
    expect(bad.reputationBreakdown.treatment).toBe(-R.harmfulDrugPenalty);
    expect(tx(bad).score).toBeCloseTo(tx(base).score - tx(base).max * config.evaluation.treatment.split.farmakologi, 1);
    expect(bad.reputationDelta).toBe(base.reputationDelta - R.harmfulDrugPenalty - (base.reputationBreakdown.fromScore - bad.reputationBreakdown.fromScore));
    expect(tx(bad).missed[0]!.text).toContain('KESELAMATAN PASIEN');
  });

  it('dosis harian melebihi batas aman = obat berbahaya', () => {
    const { state, decision } = dengue();
    const work = ideal(state);
    const overdose = { ...work, prescription: [line('parasetamol', 'parasetamol-tab500', 2, 6, 3)] };
    const ev = evaluateWith(state, decision, overdose);
    expect(ev.treatmentSafety?.harmful.some((x) => x.includes('melebihi batas aman'))).toBe(true);
    expect(ev.reputationBreakdown.treatment).toBe(-R.harmfulDrugPenalty);
  });

  it('antibiotik tanpa indikasi → skor resep × faktor, reputasi −unindicatedAntibioticPenalty', () => {
    const { state, decision } = dengue();
    const work = ideal(state);
    const base = evaluateWith(state, decision, work);
    const ev = evaluateWith(state, decision, { ...work, prescription: [...work.prescription, line('amoksisilin', 'amoksisilin-tab500', 1, 3, 5)] });
    expect(ev.treatmentSafety?.antibiotic).toEqual(['Amoksisilin']);
    expect(ev.reputationBreakdown.treatment).toBe(-R.unindicatedAntibioticPenalty);
    const S = config.evaluation.treatment;
    const lost = tx(base).max * S.split.farmakologi * (1 - S.unindicatedAntibioticFactor);
    expect(tx(ev).score).toBeCloseTo(tx(base).score - lost, 1);
  });

  it('OAT tanpa indikasi juga dihitung sebagai antibiotik tanpa indikasi', () => {
    const { state, decision } = dengue();
    const kdt = osce.drugsById.get('oat_kdt_intensif')!;
    const ev = evaluateWith(state, decision, { ...ideal(state), prescription: [...ideal(state).prescription, line(kdt.id, kdt.forms[0]!.id, 3, 1, 56)] });
    expect(ev.treatmentSafety?.antibiotic).toEqual([kdt.name]);
    expect(ev.reputationBreakdown.treatment).toBe(-R.unindicatedAntibioticPenalty);
  });

  it('neonatus alergi amoksisilin: eritromisin sirup dosis per kgBB tetap bisa ditulis tepat (kelipatan 0,1 sendok)', () => {
    const c = findCase('infeksi_umbilikus', (x) => x.patient.age === 0 && !x.traits.includes('meluas'));
    const { state, decision } = wellExamined({ ...c, allergy: 'amoksisilin' });
    const work = ideal(state);
    expect(work.prescription[0]!.drug).toBe('eritromisin');
    const ev = evaluateWith(state, decision, work);
    expect(tx(ev).score, tx(ev).missed.map((m) => m.text).join(' | ')).toBe(tx(ev).max);
  });

  it('obat yang membuat pasien alergi → skor resep 0, reputasi −allergyDrugPenalty', () => {
    const c = findCase('tonsilitis', (x) => x.patient.age >= 18);
    const allergic = { ...c, allergy: 'amoksisilin' };
    const { state, decision } = wellExamined(allergic);
    const ev = evaluateWith(state, decision, { prescription: [line('amoksisilin', 'amoksisilin-tab500', 1, 3, 10)], nonPharm: [], education: [] });
    expect(ev.treatmentSafety?.allergy.length).toBe(1);
    expect(ev.reputationBreakdown.treatment).toBe(-R.allergyDrugPenalty);
    // Jawaban ideal memilih antibiotik lain yang aman untuk pasien alergi.
    const safe = evaluateWith(state, decision, ideal(state));
    expect(safe.treatmentSafety).toBeUndefined();
    expect(tx(safe).score).toBe(tx(safe).max);
  });

  it('penalti reputasi resep ikut mengubah reputasi sesi', () => {
    let run = startNextPatient(createRun(5, config), content, config);
    const c = run.encounter!.case;
    const disease = content.diseasesById.get(c.diseaseId)!;
    const decision: ClinicalDecision = { primary: c.diseaseId, secondary: [], complications: [], disposition: expectedDisposition(disease, caseContext(run.encounter!)).value };
    const antibiotic = osce.drugs.find((d) => d.class === 'antibiotik' && !osce.casesById.get(c.diseaseId)!.therapy.items.some((i) => i.options.some((o) => o.drug === d.id)))!;
    const enc = addPrescriptionLine(run.encounter!, line(antibiotic.id, antibiotic.forms[0]!.id, 1, 3, 5));
    run = finishCurrent({ ...run, encounter: enc }, decision, content, config, osce);
    const ev = run.encounter!.evaluation!;
    expect(ev.reputationBreakdown.treatment).toBeLessThanOrEqual(-R.unindicatedAntibioticPenalty);
    expect(run.history.at(-1)!.reputationDelta).toBe(run.reputation - config.reputation.initial);
  });
});

describe('tatalaksana: penyakit tanpa data terapi', () => {
  it('tab tetap ada tetapi tidak dinilai; komponen lain diskalakan ke total 100', () => {
    const noKey: OsceContent = { ...osce, casesById: new Map([...osce.casesById].filter(([id]) => id !== 'dengue')) };
    const { state, decision } = wellExamined(findCase('dengue'));
    const ev = evaluateWith(state, decision, { prescription: [line('ibuprofen', 'ibuprofen-tab400', 1, 3, 3)], nonPharm: [], education: [] }, noKey);
    const t = tx(ev);
    expect(t.unscored).toBe(true);
    expect(t.max).toBe(0);
    expect(t.missed[0]!.text).toContain('belum tersedia');
    expect(ev.components.filter((x) => !x.unscored).reduce((s, x) => s + x.max, 0)).toBeCloseTo(100, 0);
    expect(ev.treatmentSafety).toBeUndefined();
    expect(ev.reputationBreakdown.treatment).toBeUndefined();
    expect(ev.total).toBeGreaterThanOrEqual(85);
  });
});

describe('tatalaksana: isi tab & sesi lama', () => {
  it('tambah/hapus obat dan centang saran tersimpan di konsultasi; konsultasi selesai menolak perubahan', () => {
    const c = findCase('dengue');
    let s = startEncounter(c);
    expect(treatmentOf(s)).toEqual({ prescription: [], nonPharm: [], education: [] });
    s = addPrescriptionLine(s, line('parasetamol', 'parasetamol-tab500', 1, 3, 3));
    s = toggleTreatmentAdvice(s, 'nonPharm', 'x1');
    s = toggleTreatmentAdvice(s, 'education', 'e1');
    s = toggleTreatmentAdvice(s, 'nonPharm', 'x1');
    expect(treatmentOf(s).prescription).toHaveLength(1);
    expect(treatmentOf(s).nonPharm).toEqual([]);
    expect(treatmentOf(s).education).toEqual(['e1']);
    s = removePrescriptionLine(s, 0);
    expect(treatmentOf(s).prescription).toEqual([]);
    expect(() => addPrescriptionLine(s, { ...line('parasetamol', 'parasetamol-tab500', 1, 3, 3), units: 0 })).toThrow();
    const disease = content.diseasesById.get('dengue')!;
    const done = submitDecision(s, { primary: 'dengue', secondary: [], complications: [], disposition: expectedDisposition(disease, caseContext(s)).value }, content, config, { osce });
    expect(() => toggleTreatmentAdvice(done, 'education', 'e2')).toThrow();
  });

  it('konsultasi dari sesi lama (tanpa bagian tatalaksana) tetap bisa dinilai', () => {
    const { state, decision } = wellExamined(findCase('dengue'));
    const old = JSON.parse(JSON.stringify(state)) as EncounterState;
    delete old.treatment;
    const done = submitDecision(old, decision, content, config, { osce });
    expect(done.evaluation!.components.map((x) => x.key)).toContain('tatalaksana');
    expect(done.evaluation!.total).toBeGreaterThan(0);
  });
});
