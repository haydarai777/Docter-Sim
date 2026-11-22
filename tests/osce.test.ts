import { describe, expect, it } from 'vitest';
import { performExam, startEncounter } from '../src/core/encounter';
import { caseContext } from '../src/core/evaluation';
import { generateCase } from '../src/core/generator';
import { createRng } from '../src/core/rng';
import { playEncounterBot } from '../src/core/simulate';
import type { OsceContent } from '../src/core/osce/content';
import { idealTreatment } from '../src/core/osce/answerKey';
import { evaluatePrescription, expectedQuantity, patientWeight, toRoman } from '../src/core/osce/prescription';
import { abnormalParams, evaluateStation } from '../src/core/osce/station';
import type { OsceWork, PrescriptionLine } from '../src/core/osce/types';
import type { EncounterState, PatientCase } from '../src/core/types';
import { loadOsceContent } from '../src/data/osce';
import { config, content, DISEASE_IDS, perDisease } from './helpers';

const osce: OsceContent = loadOsceContent();

/** Jawaban ideal: kunci resep/non-farmakologi/KIE (src/core/osce/answerKey.ts) + tandai semua hasil abnormal. */
function idealWork(state: EncounterState): OsceWork {
  return { ...idealTreatment(state.case, caseContext(state), osce), abnormalMarks: abnormalParams(state, content, config) };
}

describe('angka Romawi & jumlah obat', () => {
  it('toRoman', () => {
    expect([1, 4, 9, 14, 21, 30, 40, 90, 120].map(toRoman)).toEqual(['I', 'IV', 'IX', 'XIV', 'XXI', 'XXX', 'XL', 'XC', 'CXX']);
  });
  it('jumlah = per kali × frekuensi × hari; inhaler per kemasan', () => {
    const tab = osce.formsById.get('parasetamol-tab500')!.form;
    expect(expectedQuantity({ units: 1, schedule: 'rutin', timesPerDay: 3, days: 5 }, tab)).toBe(15);
    const mdi = osce.formsById.get('salbutamol-mdi100')!.form;
    expect(expectedQuantity({ units: 2, schedule: 'prn', timesPerDay: 4, days: 30 }, mdi)).toBe(2);
    expect(expectedQuantity({ units: 1, schedule: 'tunggal', timesPerDay: 1, days: 1 }, osce.formsById.get('fosfomisin-sachet3g')!.form)).toBe(1);
  });
});

describe('kunci tatalaksana OSCE', () => {
  it('setiap penyakit kasus punya kunci OSCE dengan obat & sediaan yang ada', () => {
    for (const id of DISEASE_IDS) {
      const def = osce.casesById.get(id);
      expect(def, id).toBeTruthy();
      for (const item of def!.therapy.items) for (const o of item.options) {
        const drug = osce.drugsById.get(o.drug);
        expect(drug, `${id}: ${o.drug}`).toBeTruthy();
        for (const f of o.forms ?? []) expect(drug!.forms.some((x) => x.id === f), `${id}: ${f}`).toBe(true);
      }
      expect(def!.nonPharm.some((a) => a.kind === 'berbahaya'), `${id} nonPharm berbahaya`).toBe(true);
      expect(def!.education.some((a) => a.kind === 'berbahaya' || a.kind === 'pengecoh'), `${id} KIE pengecoh`).toBe(true);
    }
  });

  it('pemain ideal (bot sempurna + resep/KIE kunci) mendapat Superior di semua penyakit', { timeout: 300_000 }, () => {
    for (const diseaseId of DISEASE_IDS) {
      for (let seed = 1; seed <= perDisease(12); seed++) {
        const c = generateCase(content, config, { diseaseId, seed });
        const rich = { ...c, patient: { ...c.patient, budget: 10_000_000 } };
        const played = playEncounterBot(startEncounter(rich), { skill: 1 }, createRng(seed), content, config);
        let state = played.state;
        if (!state.examsDone.includes('timbangan')) state = performExam(state, 'timbangan', content, config);
        const { result } = evaluateStation(state, played.decision, idealWork(state), content, osce, config);
        const low = result.tasks.filter((t) => t.score < 2).map((t) => `${t.label}=${t.score}: ${t.missed.slice(0, 3).join(' | ')}`);
        expect(result.critical, `${diseaseId}#${seed}`).toEqual([]);
        expect(result.category, `${diseaseId}#${seed}\n${low.join('\n')}`).toBe('superior');
      }
    }
  });
});

describe('kesalahan yang harus terdeteksi', () => {
  const setup = (diseaseId: string, pred: (c: PatientCase) => boolean = () => true) => {
    for (let seed = 1; seed < 400; seed++) {
      const c = generateCase(content, config, { diseaseId, seed });
      if (!pred(c)) continue;
      const rich = { ...c, patient: { ...c.patient, budget: 10_000_000 } };
      const played = playEncounterBot(startEncounter(rich), { skill: 1 }, createRng(seed), content, config);
      const state = played.state.examsDone.includes('timbangan') ? played.state : performExam(played.state, 'timbangan', content, config);
      return { state, decision: played.decision, work: idealWork(state) };
    }
    throw new Error('kasus tidak ditemukan');
  };
  const line = (drug: string, form: string, units: number, timesPerDay: number, days: number, schedule: PrescriptionLine['schedule'] = 'rutin'): PrescriptionLine => {
    const l: PrescriptionLine = { drug, form, units, schedule, timesPerDay, days, quantity: 0 };
    l.quantity = expectedQuantity(l, osce.formsById.get(form)!.form);
    return l;
  };

  it('OAINS pada dengue = kesalahan kritis → tidak lulus', () => {
    const s = setup('dengue');
    const work = { ...s.work, prescription: [...s.work.prescription, line('ibuprofen', 'ibuprofen-tab400', 1, 3, 3)] };
    const { result } = evaluateStation(s.state, s.decision, work, content, osce, config);
    expect(result.tasks.find((t) => t.key === 'farmakologi')!.score).toBe(0);
    expect(result.critical.join(' ')).toMatch(/Ibuprofen/);
    expect(result.category).toBe('tidak_lulus');
  });

  it('obat yang membuat pasien alergi = kritis', () => {
    const s = setup('pneumonia', (c) => c.allergy === 'amoksisilin');
    const work = { ...s.work, prescription: [line('amoksisilin', 'amoksisilin-tab500', 1, 3, 5)] };
    const { result } = evaluateStation(s.state, s.decision, work, content, osce, config);
    expect(result.critical.join(' ')).toMatch(/alergi amoksisilin/);
  });

  it('dosis/aturan kurang tepat → skor 1 dengan alasan spesifik', () => {
    const s = setup('isk', (c) => !c.traits.includes('pielonefritis') && c.allergy !== 'kotrimoksazol');
    const work = { ...s.work, prescription: [line('kotrimoksazol', 'kotrimoksazol-tab960', 1, 2, 7)] };
    const { result } = evaluateStation(s.state, s.decision, work, content, osce, config);
    const lt5 = result.tasks.find((t) => t.key === 'farmakologi')!;
    expect(lt5.score).toBe(1);
    expect(lt5.missed.join(' ')).toMatch(/lama 7 hari \(seharusnya 3 hari\)/);
  });

  it('dosis berbasis BB: TB tanpa menimbang dan jumlah tablet salah terdeteksi', () => {
    const s = setup('tb_paru');
    const kg = patientWeight(s.state.case)!;
    const wrongUnits = kg < 38 ? 4 : 2;
    const lines = [line('oat_kdt_intensif', 'oat-rhze', wrongUnits, 1, 56), line('piridoksin', 'piridoksin-tab10', 1, 1, 56)];
    const ev = evaluatePrescription(lines, osce.casesById.get('tb_paru')!, s.state.case, caseContext(s.state), osce, false);
    expect(ev.items[0]!.status).toBe('kurang_tepat');
    expect(ev.items[0]!.problems.join(' ')).toMatch(/BB .* kg/);
    expect(ev.items[0]!.problems.join(' ')).toMatch(/belum ditimbang/);
  });

  it('dosis harian melebihi batas aman = kritis', () => {
    const s = setup('dengue');
    const work = { ...s.work, prescription: [line('parasetamol', 'parasetamol-tab500', 2, 6, 3)] };
    const { result } = evaluateStation(s.state, s.decision, work, content, osce, config);
    expect(result.critical.join(' ')).toMatch(/melebihi batas aman/);
  });

  it('saran berbahaya, KIE tidak lengkap, dan diagnosis salah dinilai sesuai rubrik', () => {
    const s = setup('tb_paru');
    const def = osce.casesById.get('tb_paru')!;
    const work = { ...s.work, nonPharm: [...s.work.nonPharm, def.nonPharm.find((a) => a.kind === 'berbahaya')!.id], education: [def.education[0]!.id] };
    const { result } = evaluateStation(s.state, { ...s.decision, primary: 'pneumonia' }, work, content, osce, config);
    expect(result.tasks.find((t) => t.key === 'nonfarmakologi')!.score).toBe(0);
    expect(result.tasks.find((t) => t.key === 'kie')!.score).toBe(0);
    expect(result.tasks.find((t) => t.key === 'diagnosis')!.score).toBe(0);
    expect(result.category).toBe('tidak_lulus');
  });

  it('tidak menandai hasil abnormal menurunkan skor interpretasi penunjang', () => {
    const s = setup('dengue', (c) => c.traits.includes('trombositopenia'));
    const state = s.state.examsDone.includes('darah_lengkap') ? s.state : performExam(s.state, 'darah_lengkap', content, config);
    const good = evaluateStation(state, s.decision, idealWork(state), content, osce, config).result;
    const bad = evaluateStation(state, s.decision, { ...idealWork(state), abnormalMarks: [] }, content, osce, config).result;
    const t = (r: typeof good) => r.tasks.find((x) => x.key === 'penunjang')!;
    expect(t(bad).score).toBeLessThan(t(good).score);
    expect(t(bad).missed.join(' ')).toMatch(/tidak dikenali/);
  });

  const lt5 = (s: ReturnType<typeof setup>, prescription: PrescriptionLine[]) =>
    evaluateStation(s.state, s.decision, { ...s.work, prescription }, content, osce, config).result.tasks.find((t) => t.key === 'farmakologi')!;

  it('kasus tanpa obat (kelainan refraksi): tanpa resep = 2, resep apa pun menurunkan skor', () => {
    const s = setup('miopia');
    expect(lt5(s, []).score).toBe(2);
    expect(lt5(s, [line('air_mata_buatan', 'airmata-tm', 1, 4, 14)]).score).toBe(1);
    expect(lt5(s, [line('kloramfenikol_tm', 'kloramfenikol-tm', 1, 4, 5), line('vitamin_a', 'vita-200rb', 1, 1, 2)]).score).toBe(0);
  });

  it('butir opsional: boleh tidak diberi, tetapi bila diberi dosisnya harus tepat', () => {
    const s = setup('laringitis');
    expect(lt5(s, []).score).toBe(2);
    expect(lt5(s, [line('parasetamol', 'parasetamol-tab500', 1, 3, 3, 'prn')]).score).toBe(2);
    const salah = lt5(s, [line('parasetamol', 'parasetamol-tab500', 3, 2, 3, 'prn')]);
    expect(salah.score).toBe(1);
    expect(salah.missed.join(' ')).toMatch(/dosis per kali/);
  });

  it('kombinasi antihipertensi (derajat 2) harus dua baris resep berbeda', () => {
    const s = setup('hipertensi', (c) => c.traits.includes('derajat2'));
    const amlo = line('amlodipin', 'amlodipin-tab5', 1, 1, 30);
    expect(lt5(s, [amlo]).score).toBe(1);
    expect(lt5(s, [amlo, line('lisinopril', 'lisinopril-tab10', 1, 1, 30)]).score).toBe(2);
    expect(lt5(s, [line('lisinopril', 'lisinopril-tab10', 1, 1, 30), amlo]).score).toBe(2);
  });

  it('dosis per pita BB: sediaan dewasa untuk anak < 30 kg ditandai tidak sesuai', () => {
    const s = setup('skrofuloderma', (c) => (patientWeight(c) ?? 99) < 30);
    const ev = evaluatePrescription([line('oat_kdt_intensif', 'oat-rhze', 2, 1, 56)], osce.casesById.get('skrofuloderma')!, s.state.case, caseContext(s.state), osce, true);
    expect(ev.items[0]!.status).toBe('kurang_tepat');
    expect(ev.items[0]!.problems.join(' ')).toMatch(/tidak sesuai untuk BB/);
  });

  it('obat kontraindikasi spesifik kasus = kritis (steroid pada varisela, obat tersangka pada erupsi obat)', () => {
    const v = setup('varisela', (c) => c.patient.age >= 12);
    expect(evaluateStation(v.state, v.decision, { ...v.work, prescription: [...v.work.prescription, line('prednison', 'prednison-tab5', 4, 1, 5)] }, content, osce, config).result.critical.join(' ')).toMatch(/Prednison/);
    const e = setup('erupsi_obat', (c) => !c.traits.includes('fde'));
    expect(evaluateStation(e.state, e.decision, { ...e.work, prescription: [...e.work.prescription, line('amoksisilin', 'amoksisilin-tab500', 1, 3, 5)] }, content, osce, config).result.category).toBe('tidak_lulus');
  });

  it('kategori: ≥ 90% superior, 70–89% lulus, < 70% tidak lulus (13/14, 10/14, 9/14)', async () => {
    const { categoryOf } = await import('../src/core/osce/station');
    expect(categoryOf((13 / 14) * 100, [])).toBe('superior');
    expect(categoryOf((10 / 14) * 100, [])).toBe('lulus');
    expect(categoryOf((9 / 14) * 100, [])).toBe('tidak_lulus');
    expect(categoryOf(100, ['x'])).toBe('tidak_lulus');
  });
});

describe('stasiun prosedur', () => {
  it('11 prosedur dari dokumen OSCE tersedia dengan langkah kritis & pertanyaan', () => {
    expect(osce.procedures.length).toBeGreaterThanOrEqual(11);
    for (const p of osce.procedures) {
      expect(p.steps.length, p.id).toBeGreaterThanOrEqual(8);
      expect(p.steps.some((s) => s.critical), p.id).toBe(true);
      expect(p.distractors.length, p.id).toBeGreaterThanOrEqual(2);
      expect(p.questions.length, p.id).toBeGreaterThanOrEqual(2);
      for (const q of p.questions) expect(q.answer).toBeLessThan(q.options.length);
    }
  });

  it('urutan benar + jawaban benar = 100% superior; berbahaya/terlewat kritis = tidak lulus', async () => {
    const { evaluateProcedure, procedureCards } = await import('../src/core/osce/procedure');
    for (const p of osce.procedures) {
      const perfect = evaluateProcedure(p, { sequence: p.steps.map((s) => s.id), answers: Object.fromEntries(p.questions.map((q) => [q.id, q.answer])) });
      expect(perfect.percent, p.id).toBe(100);
      expect(perfect.category).toBe('superior');
      const cards = procedureCards(p, 7);
      expect(new Set(cards.map((c) => c.id)).size).toBe(p.steps.length + p.distractors.length);
      const dangerous = p.distractors.find((d) => d.dangerous);
      if (dangerous) {
        const r = evaluateProcedure(p, { sequence: [...p.steps.map((s) => s.id), dangerous.id], answers: {} });
        expect(r.category).toBe('tidak_lulus');
      }
      const crit = p.steps.find((s) => s.critical)!;
      const r2 = evaluateProcedure(p, { sequence: p.steps.filter((s) => s !== crit).map((s) => s.id), answers: {} });
      expect(r2.critical.join(' ')).toMatch(/terlewat/);
    }
  });

  it('urutan tertukar terdeteksi sebagai langkah tidak berurutan', async () => {
    const { evaluateProcedure } = await import('../src/core/osce/procedure');
    const p = osce.procedures[0]!;
    const ids = p.steps.map((s) => s.id);
    [ids[1], ids[5]] = [ids[5]!, ids[1]!];
    const r = evaluateProcedure(p, { sequence: ids, answers: {} });
    expect(r.outOfOrder.length).toBeGreaterThan(0);
    expect(r.orderScore).toBeLessThan(1);
  });
});

describe('validasi konten OSCE', () => {
  it('seluruh konten OSCE valid', async () => {
    const { validateOsceContent } = await import('../src/core/osce/validate');
    expect(validateOsceContent(osce, content)).toEqual([]);
  });
});

describe('rangkaian stasiun', () => {
  it('perencana stasiun: jumlah, jenis, kelompok, tanpa pengulangan sebelum habis', async () => {
    const { planStations, DEFAULT_SETUP, clusters, secondsLeft, newSession, sessionSummary } = await import('../src/ui/osce/session');
    const klinis = planStations({ ...DEFAULT_SETUP, count: 8 }, content, osce, 42);
    expect(klinis).toHaveLength(8);
    expect(klinis.every((s) => s.kind === 'klinis')).toBe(true);
    const ids = klinis.map((s) => (s.kind === 'klinis' ? s.diseaseId : ''));
    expect(new Set(ids).size).toBe(8);
    const demam = clusters(osce).find((c) => c.includes('demam'))!;
    const kl = planStations({ ...DEFAULT_SETUP, cluster: demam, count: 3 }, content, osce, 1);
    expect(kl.every((s) => s.kind === 'klinis' && osce.casesById.get(s.diseaseId)!.station === demam)).toBe(true);
    const mix = planStations({ ...DEFAULT_SETUP, type: 'campuran', count: 4 }, content, osce, 3);
    expect(mix.map((s) => s.kind)).toEqual(['klinis', 'prosedur', 'klinis', 'prosedur']);
    const proc = planStations({ ...DEFAULT_SETUP, type: 'prosedur', procedureId: 'pap_smear', count: 1 }, content, osce, 3);
    expect(proc).toEqual([{ kind: 'prosedur', procedureId: 'pap_smear', seed: expect.any(Number) }]);
    const s = newSession({ ...DEFAULT_SETUP, minutes: 15 }, klinis);
    expect(secondsLeft(s, Date.now())).toBeNull();
    s.startedAt = 1_000_000;
    expect(secondsLeft(s, 1_000_000 + 60_000)).toBe(14 * 60);
    expect(secondsLeft(s, 1_000_000 + 20 * 60_000)).toBe(0);
    expect(sessionSummary([])).toEqual({ average: 0, passed: 0, superior: 0, total: 0 });
  });
});
