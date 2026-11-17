import { describe, expect, it } from 'vitest';
import { askInformant, informants } from '../src/core/igd/anamnesis';
import { act, advance, createShift, type EdContext, supportOf, vitalsOf } from '../src/core/igd/engine';
import { evaluatePatient, evaluateShift } from '../src/core/igd/evaluation';
import { computeVitals, createPhysio, stepPhysio } from '../src/core/igd/physiology';
import { buildShiftConfig } from '../src/core/igd/shift';
import { runPlan, singleConfig } from '../src/core/igd/sim';
import type { Support } from '../src/core/igd/types';
import { validateScenarios } from '../src/core/igd/validate';
import { ED_SCENARIOS } from '../src/data/igd';
import { content } from './helpers';

const ctx: EdContext = { scenarios: new Map(ED_SCENARIOS.map((s) => [s.id, s])), content };
const AIR: Support = { fio2: 0.21, oxygen: 'udara', flow: 0, adjunct: 'none', assist: 'none', position: 'terlentang', cpr: false, pacing: null, suctioned: false };
const NRM: Support = { ...AIR, fio2: 0.85, oxygen: 'nrm', flow: 15 };
const ADULT = { age: 35, sex: 'male' as const, weightKg: 65, betaBlocker: false };

describe('IGD — konten skenario', () => {
  it('semua skenario valid (rujukan id, diagnosis, gejala, alur pakar)', () => {
    expect(validateScenarios(ED_SCENARIOS, content)).toEqual([]);
  });

  it('mencakup kategori kegawatdaruratan yang diminta', () => {
    const cats = new Set(ED_SCENARIOS.map((s) => s.category));
    for (const c of ['pernapasan', 'jantung', 'henti_jantung', 'stroke', 'trauma', 'perdarahan', 'syok', 'kesadaran', 'toksikologi', 'obstetri', 'anak', 'ringan'] as const) expect(cats.has(c), c).toBe(true);
    expect(ED_SCENARIOS.length).toBeGreaterThanOrEqual(30);
    for (const ats of [1, 2, 3, 4, 5]) expect(ED_SCENARIOS.some((s) => s.ats === ats), `ATS ${ats}`).toBe(true);
  });

  it('setiap skenario punya referensi pedoman & tatalaksana', () => {
    for (const s of ED_SCENARIOS) {
      expect(s.debrief.referensi.length, s.id).toBeGreaterThan(0);
      expect(s.debrief.tatalaksana.length, s.id).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('IGD — fisiologi', () => {
  const vitals = (init: Parameters<typeof createPhysio>[0][number], s = AIR) => computeVitals(createPhysio([init], ADULT, 1, 0), s, 0);

  it('perdarahan kelas I–IV mengikuti pola ATLS (nadi naik, tekanan turun)', () => {
    const c1 = vitals({ v: { volume: 0.9, rbc: 0.9 } });
    const c2 = vitals({ v: { volume: 0.8, rbc: 0.8 } });
    const c3 = vitals({ v: { volume: 0.65, rbc: 0.65 } });
    const c4 = vitals({ v: { volume: 0.55, rbc: 0.55 } });
    expect(c1.hr).toBeLessThan(100);
    expect(c2.hr).toBeGreaterThan(c1.hr);
    expect(c2.sbp!).toBeGreaterThanOrEqual(105);
    expect(c3.hr).toBeGreaterThan(115);
    expect(c3.sbp!).toBeLessThan(c2.sbp!);
    expect(c4.hr).toBeGreaterThan(135);
    expect(c4.sbp!).toBeLessThan(85);
    // Hb belum turun pada perdarahan akut (sebelum cairan).
    expect(c4.hb).toBeCloseTo(c1.hb, 0);
  });

  it('oksigen memperbaiki gangguan V/Q tetapi tidak pirau murni', () => {
    const vq = { v: { vq: 0.45 } };
    const shunt = { v: { shunt: 0.4 } };
    expect(vitals(vq).spo2!).toBeLessThan(92);
    expect(vitals(vq, NRM).spo2!).toBeGreaterThanOrEqual(97);
    expect(vitals(shunt, NRM).spo2!).toBeLessThan(92);
  });

  it('opioid: hipoventilasi → hiperkapnia; oksigen menutupi hipoksemia tetapi tidak hiperkapnia', () => {
    const air = vitals({ v: { sedation: 0.6 } });
    const o2 = vitals({ v: { sedation: 0.6 } }, NRM);
    expect(air.rr).toBeLessThanOrEqual(10);
    expect(air.paco2).toBeGreaterThan(60);
    expect(o2.spo2!).toBeGreaterThanOrEqual(97);
    expect(o2.paco2).toBeGreaterThan(60);
  });

  it('KAD: asidosis metabolik dengan kompensasi napas Kussmaul', () => {
    const v = vitals({ v: { keto: 0.7, glucose: 500 } });
    expect(v.ph).toBeLessThan(7.25);
    expect(v.hco3).toBeLessThan(12);
    expect(v.paco2).toBeLessThan(30);
    expect(v.rr).toBeGreaterThan(22);
  });

  it('peningkatan TIK: Cushing (hipertensi + bradikardia) & GCS turun', () => {
    const v = vitals({ v: { icp: 0.92, hypertension: 0.4 } });
    expect(v.hr).toBeLessThan(65);
    expect(v.gcs.total).toBeLessThanOrEqual(6);
  });

  it('hipoksia berat berkepanjangan berakhir henti jantung', () => {
    const p = createPhysio([{ v: { airway: 0.05 }, airwayCause: 'benda_asing' }], ADULT, 1, 0);
    let t = 0;
    while (!p.arrest && t < 20 * 60) {
      stepPhysio(p, AIR, 5, t, () => 0.5);
      t += 5;
    }
    expect(p.arrest).not.toBeNull();
    expect(t).toBeLessThan(10 * 60);
  });
});

describe('IGD — alur pakar & lalai untuk setiap skenario', () => {
  for (const sc of ED_SCENARIOS) {
    const variants = sc.variants?.map((v) => v.id) ?? [undefined];
    for (const variant of variants) {
      it(`${sc.id}${variant ? `/${variant}` : ''}: pakar stabil tanpa bahaya & skor tinggi`, () => {
        const r = runPlan(ctx, sc.id, variant, sc.expert, 150, 7);
        expect(r.failures).toEqual([]);
        expect(r.patient.outcome).toBe('stabil');
        expect(r.patient.actions.flatMap((a) => a.harms ?? [])).toEqual([]);
        const e = evaluatePatient(r.shift, r.patient, ctx);
        expect(e.total).toBeGreaterThanOrEqual(85);
      });
    }
    it(`${sc.id}: lalai (hanya triase) dinilai rendah${sc.ats <= 2 ? ' & pasien memburuk' : ''}`, () => {
      const n = runPlan(ctx, sc.id, sc.variants?.[0]?.id, [sc.expert[0]!], 90, 7);
      const e = evaluatePatient(n.shift, n.patient, ctx);
      expect(e.total).toBeLessThanOrEqual(35);
      if (sc.ats <= 2) expect(n.patient.outcome === 'stabil', `${sc.id} tetap stabil tanpa terapi`).toBe(false);
    });
  }
});

describe('IGD — mesin shift', () => {
  const start = (scenarioId: string, variant?: string) => {
    const shift = createShift(singleConfig(scenarioId, variant, 120), 3, ctx);
    advance(shift, 1, ctx);
    return { shift, p: shift.patients[0]! };
  };

  it('obat IV butuh akses IV; perawat memasang IV dalam beberapa menit', () => {
    const { shift, p } = start('asma_berat', 'berat');
    act(shift, p.id, { type: 'triase', ats: 2, bedId: 'A1' }, ctx);
    expect(act(shift, p.id, { type: 'obat', drug: 'metilprednisolon', route: 'iv', dose: 125 }, ctx).ok).toBe(false);
    act(shift, p.id, { type: 'tindakan', proc: 'iv' }, ctx);
    advance(shift, 10 * 60, ctx);
    if (p.devices.ivCount === 0) {
      act(shift, p.id, { type: 'tindakan', proc: 'iv' }, ctx);
      advance(shift, 5 * 60, ctx);
    }
    expect(p.devices.ivCount).toBeGreaterThan(0);
    expect(act(shift, p.id, { type: 'obat', drug: 'metilprednisolon', route: 'iv', dose: 125 }, ctx).ok).toBe(true);
  });

  it('dokter tidak bisa mengerjakan dua tindakan sekaligus', () => {
    const { shift, p } = start('cedera_kepala_berat');
    act(shift, p.id, { type: 'triase', ats: 1, bedId: 'R1' }, ctx);
    expect(act(shift, p.id, { type: 'tindakan', proc: 'intubasi' }, ctx).ok).toBe(true);
    const r = act(shift, p.id, { type: 'periksa', exam: 'D' }, ctx);
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/sedang/);
  });

  it('hasil lab keluar setelah waktu tunggu; GDS bedside cepat', () => {
    const { shift, p } = start('hipoglikemia');
    act(shift, p.id, { type: 'triase', ats: 2, bedId: 'R1' }, ctx);
    act(shift, p.id, { type: 'penunjang', test: 'gds' }, ctx);
    act(shift, p.id, { type: 'penunjang', test: 'darah_lengkap' }, ctx);
    advance(shift, 3 * 60, ctx);
    const gds = p.tests.find((t) => t.id === 'gds')!;
    expect(gds.status).toBe('selesai');
    expect(gds.result).toMatch(/GDS \d+ mg\/dL/);
    expect(gds.abnormal).toBe(true);
    expect(p.tests.find((t) => t.id === 'darah_lengkap')!.status).not.toBe('selesai');
    advance(shift, 40 * 60, ctx);
    expect(p.tests.find((t) => t.id === 'darah_lengkap')!.status).toBe('selesai');
  });

  it('adrenalin 1 mg IV bolus pada anafilaksis (pasien bernadi) ditandai berbahaya', () => {
    const { shift, p } = start('anafilaksis', 'sedang');
    act(shift, p.id, { type: 'triase', ats: 1, bedId: 'R1' }, ctx);
    act(shift, p.id, { type: 'tindakan', proc: 'iv' }, ctx);
    advance(shift, 8 * 60, ctx);
    if (!p.devices.ivCount) {
      act(shift, p.id, { type: 'tindakan', proc: 'iv' }, ctx);
      advance(shift, 5 * 60, ctx);
    }
    act(shift, p.id, { type: 'obat', drug: 'adrenalin', route: 'iv', dose: 1 }, ctx);
    advance(shift, 3 * 60, ctx);
    expect(p.actions.some((a) => a.harms?.includes('adrenalin_iv_bolus'))).toBe(true);
  });

  it('VF: RJP + defibrilasi menghasilkan ROSC; kejut pada pasien bernadi ditandai', () => {
    let rosc = 0;
    for (const seed of [1, 2, 3, 4, 5]) {
      const shift = createShift(singleConfig('henti_jantung_vf', undefined, 60), seed, ctx);
      advance(shift, 1, ctx);
      const p = shift.patients[0]!;
      act(shift, p.id, { type: 'triase', ats: 2, bedId: 'R1' }, ctx);
      act(shift, p.id, { type: 'tindakan', proc: 'pad_defib' }, ctx);
      advance(shift, 3 * 60, ctx);
      expect(p.physio.arrest?.rhythm).toBe('vf');
      act(shift, p.id, { type: 'tindakan', proc: 'rjp' }, ctx);
      for (let i = 0; i < 6 && p.physio.arrest; i++) {
        act(shift, p.id, { type: 'tindakan', proc: 'defibrilasi', param: '200' }, ctx);
        advance(shift, 120, ctx);
      }
      if (!p.physio.arrest) rosc++;
    }
    expect(rosc).toBeGreaterThanOrEqual(3);
    const { shift, p } = start('svt');
    act(shift, p.id, { type: 'triase', ats: 2, bedId: 'A1' }, ctx);
    act(shift, p.id, { type: 'tindakan', proc: 'pad_defib' }, ctx);
    advance(shift, 2 * 60, ctx);
    act(shift, p.id, { type: 'tindakan', proc: 'defibrilasi', param: '200' }, ctx);
    expect(p.actions.some((a) => a.harms?.includes('kejut_bernadi'))).toBe(true);
  });

  it('pasien tidak stabil yang dibawa ke CT ditandai berbahaya', () => {
    const { shift, p } = start('multitrauma_syok_hemoragik');
    act(shift, p.id, { type: 'triase', ats: 1, bedId: 'R1' }, ctx);
    advance(shift, 10 * 60, ctx);
    act(shift, p.id, { type: 'penunjang', test: 'ct_abdomen' }, ctx);
    expect(p.actions.at(-1)!.harms).toContain('ct_tidak_stabil');
    expect(p.awayUntil).not.toBeNull();
  });

  it('disposisi ke ICU/OK butuh persetujuan konsulen', () => {
    const { shift, p } = start('stemi', 'standar');
    act(shift, p.id, { type: 'triase', ats: 2, bedId: 'R1' }, ctx);
    expect(act(shift, p.id, { type: 'disposisi', to: 'kateterisasi' }, ctx).ok).toBe(false);
    act(shift, p.id, { type: 'konsul', specialty: 'jantung' }, ctx);
    advance(shift, 20 * 60, ctx);
    expect(p.consults[0]!.answered).toBe(true);
    expect(act(shift, p.id, { type: 'disposisi', to: 'kateterisasi' }, ctx).ok).toBe(true);
  });

  it('shift jaga & sibuk: kedatangan bertahap, campuran kegawatan, ringkasan akhir', () => {
    for (const mode of ['jaga', 'sibuk'] as const) {
      const config = buildShiftConfig(mode, 11, ED_SCENARIOS);
      expect(config.arrivals.length).toBe(mode === 'jaga' ? 4 : 7);
      expect(new Set(config.arrivals.map((a) => a.scenarioId)).size).toBe(config.arrivals.length);
      const ats = config.arrivals.map((a) => ctx.scenarios.get(a.scenarioId)!.ats);
      expect(Math.min(...ats)).toBe(1);
      expect(Math.max(...ats)).toBeGreaterThanOrEqual(3);
      const shift = createShift(config, 11, ctx);
      advance(shift, 1, ctx);
      expect(shift.patients.filter((p) => p.status !== 'akan_datang').length).toBe(1);
      advance(shift, 50 * 60, ctx);
      expect(shift.patients.every((p) => p.status !== 'akan_datang')).toBe(true);
      advance(shift, config.durationMin * 60, ctx);
      expect(shift.status).toBe('selesai');
      const sum = evaluateShift(shift, ctx);
      expect(sum.evaluations.length).toBe(config.arrivals.length);
      expect(sum.average).toBeLessThan(40);
    }
  });

  it('shift deterministik untuk seed yang sama', () => {
    const run = () => {
      const s = createShift(buildShiftConfig('jaga', 5, ED_SCENARIOS), 5, ctx);
      advance(s, 30 * 60, ctx);
      return JSON.stringify(s.patients.map((p) => [p.name, p.age, vitalsOf(p, s.time)]));
    };
    expect(run()).toBe(run());
  });
});

describe('IGD — anamnesis', () => {
  it('pasien tidak sadar tidak bisa ditanya; keluarga/paramedis menjawab', () => {
    const shift = createShift(singleConfig('hipoglikemia', undefined, 60), 2, ctx);
    advance(shift, 1, ctx);
    const p = shift.patients[0]!;
    const sc = ctx.scenarios.get(p.scenarioId)!;
    const s = supportOf(p, shift.time);
    const list = informants(p, sc, vitalsOf(p, shift.time), s, shift.time);
    expect(list.find((i) => i.id === 'pasien')!.available).toBe(false);
    expect(list.find((i) => i.id === 'keluarga')!.available).toBe(true);
    const ans = askInformant('Obat apa yang rutin diminum?', null, 'keluarga', p, sc, vitalsOf(p, shift.time), s, shift.time, content);
    expect(ans.text).toMatch(/glibenklamid/i);
  });

  it('pertanyaan bebas dipahami (alergi, makan terakhir, gejala)', () => {
    const shift = createShift(singleConfig('kolik_renal', undefined, 60), 2, ctx);
    advance(shift, 1, ctx);
    const p = shift.patients[0]!;
    const sc = ctx.scenarios.get(p.scenarioId)!;
    const v = vitalsOf(p, shift.time);
    const s = supportOf(p, shift.time);
    expect(askInformant('ada alergi obat?', null, 'pasien', p, sc, v, s, shift.time, content).topics).toContain('alergi');
    expect(askInformant('kapan terakhir makan?', null, 'pasien', p, sc, v, s, shift.time, content).topics).toContain('makan_terakhir');
    const pee = askInformant('kencingnya berdarah?', null, 'pasien', p, sc, v, s, shift.time, content);
    expect(pee.understood).toBe(true);
    expect(pee.text).toMatch(/kemerahan/);
  });

  it('pasien sesak berat menjawab terputus-putus', () => {
    const shift = createShift(singleConfig('asma_berat', 'mengancam', 60), 2, ctx);
    advance(shift, 1, ctx);
    const p = shift.patients[0]!;
    const sc = ctx.scenarios.get(p.scenarioId)!;
    const ans = askInformant('Sejak kapan sesaknya?', 'onset', 'pasien', p, sc, vitalsOf(p, shift.time), supportOf(p, shift.time), shift.time, content);
    expect(ans.text).toMatch(/terengah|terputus/);
  });
});
