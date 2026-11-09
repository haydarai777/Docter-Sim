import { describe, expect, it } from 'vitest';
import {
  applyIntents,
  askQuestion,
  canPerformExam,
  canSubmitDecision,
  EncounterError,
  isBudgetExhausted,
  performExam,
  setDdx,
  startEncounter,
  submitDecision,
  unaskedCoreTopics,
} from '../src/core/encounter';
import { generateCase } from '../src/core/generator';
import { deriveSeed } from '../src/core/rng';
import type { ClinicalDecision, PatientCase } from '../src/core/types';
import { config, content } from './helpers';

/** Kasus dengan budget tertentu (budget diganti setelah generate). */
function caseWithBudget(budget: number, diseaseId = 'dengue', seed = 10): PatientCase {
  const c = generateCase(content, config, { diseaseId, seed });
  return { ...c, patient: { ...c.patient, budget } };
}

const ask = (s: ReturnType<typeof startEncounter>, q: string) => askQuestion(s, q, content, config);

describe('konsultasi: pemeriksaan', () => {
  it('pemeriksaan penunjang memotong budget sesuai harga di config', () => {
    let s = startEncounter(caseWithBudget(200_000));
    s = performExam(s, 'darah_lengkap', content, config);
    expect(s.budgetRemaining).toBe(200_000 - config.toolPrices.darah_lengkap!);
    expect(s.spent).toBe(config.toolPrices.darah_lengkap);
    expect(s.examsDone).toEqual(['darah_lengkap']);
    expect(s.log.at(-1)).toEqual({ kind: 'exam', toolId: 'darah_lengkap', cost: config.toolPrices.darah_lengkap });
  });

  it('pemeriksaan fisik (termasuk paket tanda vital) gratis', () => {
    let s = startEncounter(caseWithBudget(0));
    for (const t of content.tools.filter((x) => x.category === 'fisik')) s = performExam(s, t.id, content, config);
    expect(s.spent).toBe(0);
    const vitals = s.case.findings.tanda_vital!.map((r) => r.paramId);
    expect(vitals).toEqual(['td_sistolik', 'td_diastolik', 'nadi', 'napas', 'suhu', 'spo2']);
  });

  it('state lama tidak berubah (fungsi murni)', () => {
    const s0 = startEncounter(caseWithBudget(200_000));
    const snapshot = structuredClone(s0);
    performExam(s0, 'tanda_vital', content, config);
    ask(s0, 'Sejak kapan?');
    expect(s0).toEqual(snapshot);
  });

  it('tidak bisa periksa dua kali, alat tidak dikenal, atau melebihi budget', () => {
    const s = performExam(startEncounter(caseWithBudget(100_000)), 'darah_lengkap', content, config);
    expect(canPerformExam(s, 'darah_lengkap', content, config)).toEqual({ ok: false, reason: 'Sudah diperiksa.' });
    expect(canPerformExam(s, 'xyz', content, config).ok).toBe(false);
    expect(canPerformExam(s, 'usg_abdomen', content, config)).toEqual({ ok: false, reason: 'Budget pasien tidak cukup.' });
    expect(() => performExam(s, 'usg_abdomen', content, config)).toThrow(EncounterError);
  });

  it('budget habis = tidak ada pemeriksaan BERBAYAR yang terjangkau', () => {
    const cheapest = Math.min(...content.tools.filter((t) => t.category !== 'fisik').map((t) => config.toolPrices[t.id]!));
    expect(isBudgetExhausted(startEncounter(caseWithBudget(cheapest - 1)), content, config)).toBe(true);
    expect(isBudgetExhausted(startEncounter(caseWithBudget(cheapest)), content, config)).toBe(false);
  });
});

describe('konsultasi: anamnesis bebas', () => {
  it('tidak ada batas jumlah pertanyaan', () => {
    let s = startEncounter(caseWithBudget(100_000));
    for (let i = 0; i < 60; i++) s = ask(s, i % 2 ? 'Sejak kapan?' : 'Ada keluhan lain?').state;
    expect(s.questionCount).toBe(60);
    expect(s.status).toBe('active');
  });

  it('jawaban sesuai kasus dan tercatat di log', () => {
    const c = caseWithBudget(100_000);
    const r = ask(startEncounter(c), 'Sejak kapan sakitnya?');
    expect(r.understood).toBe(true);
    expect(r.reply).toBe(c.answers.onset!.text);
    expect(r.state.askedTopics).toEqual(['onset']);
    expect(r.state.log.slice(-2)).toEqual([
      { kind: 'doctor', text: 'Sejak kapan sakitnya?' },
      { kind: 'patient', text: c.answers.onset!.text },
    ]);
  });

  it('pasien konsisten: pertanyaan yang diulang (dengan rumusan lain) dijawab sama', () => {
    const c = caseWithBudget(100_000);
    const first = ask(startEncounter(c), 'Sejak kapan sakitnya?');
    const second = ask(first.state, 'Mulainya kapan, Pak?');
    expect(second.reply.endsWith(c.answers.onset!.text)).toBe(true);
    expect(second.reply).not.toBe(first.reply); // ada awalan "seperti tadi saya bilang"
    expect(second.state.askedTopics).toEqual(['onset']);
  });

  it('pertanyaan yang tidak dipahami tetap dibalas tanpa mengubah temuan', () => {
    const s0 = startEncounter(caseWithBudget(100_000));
    const r = ask(s0, 'Siapa nama kucing Bapak?');
    expect(r.understood).toBe(false);
    expect(r.reply.length).toBeGreaterThan(0);
    expect(r.state.askedTopics).toEqual([]);
    expect(r.state.revealedSymptoms).toEqual(s0.revealedSymptoms);
  });

  it('pertanyaan kosong ditolak', () => {
    expect(() => ask(startEncounter(caseWithBudget(1)), '   ')).toThrow(EncounterError);
  });

  it('"keluhan lain" mengungkap gejala bertahap; diulang → gejala berikutnya', () => {
    const c = caseWithBudget(100_000);
    const personality = content.personalitiesById.get(c.patient.personalityId)!;
    const n = personality.otherComplaintCount;
    let s = ask(startEncounter(c), 'Ada keluhan lain?').state;
    expect(s.revealedSymptoms).toEqual([...c.chiefComplaintSymptoms, ...c.revealOrder.slice(0, n)]);
    s = ask(s, 'Ada lagi?').state;
    expect(s.revealedSymptoms).toEqual([...c.chiefComplaintSymptoms, ...c.revealOrder.slice(0, 2 * n)]);
  });

  it('gejala tersembunyi tidak disebut sukarela, hanya bila ditanya spesifik', () => {
    // Cari kasus dispepsia dengan BAB hitam (tanda bahaya, volunteer: false).
    let c: PatientCase | null = null;
    for (let i = 0; i < 400 && !c; i++) {
      const x = generateCase(content, config, { diseaseId: 'dispepsia', seed: deriveSeed(5, `bab:${i}`) });
      if (x.hiddenSymptoms.includes('bab_hitam')) c = x;
    }
    expect(c).not.toBeNull();
    let s = startEncounter(c!);
    for (let i = 0; i < 10; i++) s = ask(s, 'Ada keluhan lain?').state;
    expect(s.revealedSymptoms).not.toContain('bab_hitam');
    s = ask(s, 'BAB-nya pernah hitam?').state;
    expect(s.revealedSymptoms).toContain('bab_hitam');
  });

  it('tinjauan sistem menyebut gejala yang ada, atau jawaban normal', () => {
    const c = caseWithBudget(100_000, 'isk', 3);
    const r = ask(startEncounter(c), 'Kencingnya bagaimana?');
    const urinary = content.reviewsById.get('bak')!.symptoms;
    const present = urinary.filter((x) => c.symptoms.includes(x));
    expect(present.length).toBeGreaterThan(0);
    for (const x of present) expect(r.state.revealedSymptoms).toContain(x);
    expect(r.state.askedSymptoms).toEqual(expect.arrayContaining(urinary));
    const none = caseWithBudget(100_000, 'asma', 4);
    const bowel = content.reviewsById.get('bab')!;
    if (!bowel.symptoms.some((x) => none.symptoms.includes(x))) {
      expect(bowel.normal).toContain(ask(startEncounter(none), 'BAB lancar?').reply);
    }
  });

  it('pertanyaan gejala: ada → terungkap; tidak ada → tidak; ditanya lagi → "sudah saya bilang"', () => {
    const c = caseWithBudget(100_000);
    const present = c.revealOrder[0]!;
    const absent = content.symptoms.find((x) => !c.symptoms.includes(x.id))!.id;
    let s = applyIntents(startEncounter(c), [{ kind: 'symptom', symptom: present }], content).state;
    expect(s.revealedSymptoms).toContain(present);
    s = applyIntents(s, [{ kind: 'symptom', symptom: absent }], content).state;
    expect(s.revealedSymptoms).not.toContain(absent);
    expect(s.askedSymptoms).toEqual([present, absent]);
    const again = applyIntents(s, [{ kind: 'symptom', symptom: present }], content);
    expect(content.conversation.alreadySaid.some((t) => again.parts[0]!.startsWith(t.slice(0, 8)))).toBe(true);
  });

  it('saran topik inti yang belum ditanyakan', () => {
    const s = ask(startEncounter(caseWithBudget(1)), 'Sejak kapan?').state;
    const left = unaskedCoreTopics(s, content);
    expect(left).not.toContain('onset');
    expect(left).toContain('riwayat_obat');
  });
});

describe('konsultasi: penalaran & keputusan', () => {
  it('papan diagnosis banding: hanya satu "utama"', () => {
    let s = startEncounter(caseWithBudget(1));
    s = setDdx(s, 'dengue', 'utama', content);
    s = setDdx(s, 'demam_tifoid', 'mungkin', content);
    s = setDdx(s, 'malaria', 'utama', content);
    expect(s.ddx).toEqual([
      { id: 'dengue', status: 'mungkin' },
      { id: 'demam_tifoid', status: 'mungkin' },
      { id: 'malaria', status: 'utama' },
    ]);
    s = setDdx(s, 'demam_tifoid', null, content);
    expect(s.ddx.map((d) => d.id)).toEqual(['dengue', 'malaria']);
    expect(() => setDdx(s, 'xyz', 'mungkin', content)).toThrow(EncounterError);
  });

  it('kondisi banding non-pasien (mis. leptospirosis) boleh masuk papan', () => {
    const s = setDdx(startEncounter(caseWithBudget(1)), 'leptospirosis', 'disingkirkan', content);
    expect(s.ddx).toEqual([{ id: 'leptospirosis', status: 'disingkirkan' }]);
  });

  it('keputusan butuh diagnosis utama & disposisi', () => {
    const s = startEncounter(caseWithBudget(1));
    expect(canSubmitDecision(s, {}, content).reason).toBe('Tentukan diagnosis kerja (utama).');
    expect(canSubmitDecision(s, { primary: 'dengue' }, content).reason).toBe('Pilih tata laksana/disposisi pasien.');
    expect(canSubmitDecision(s, { primary: 'xyz', disposition: 'rawat_jalan' }, content).ok).toBe(false);
  });

  it('keputusan menutup konsultasi dan menghasilkan evaluasi; aksi berikutnya ditolak', () => {
    const c = caseWithBudget(300_000);
    const decision: ClinicalDecision = { primary: c.diseaseId, secondary: ['dengue', 'hipertensi'], complications: [], disposition: 'observasi' };
    const s = submitDecision(startEncounter(c), decision, content, config);
    expect(s.status).toBe('finished');
    expect(s.evaluation?.primaryCorrect).toBe(true);
    expect(s.decision?.secondary).toEqual(['hipertensi']); // diagnosis utama tidak boleh dobel
    expect(canPerformExam(s, 'tanda_vital', content, config).ok).toBe(false);
    expect(() => ask(s, 'Sejak kapan?')).toThrow(EncounterError);
    expect(() => submitDecision(s, decision, content, config)).toThrow(EncounterError);
  });
});
