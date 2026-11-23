import { describe, expect, it } from 'vitest';
import { askQuestion, performExam, startEncounter } from '../src/core/encounter';
import { caseContext, evaluateEncounter, expectedDisposition } from '../src/core/evaluation';
import { generateCase } from '../src/core/generator';
import { interpretQuestion } from '../src/core/nlu';
import type { ClinicalDecision, EncounterState, EvaluationResult, PatientCase } from '../src/core/types';
import { config, content } from './helpers';

/**
 * Gastritis akut dan dispepsia fungsional adalah dua diagnosis terpisah:
 * gastritis = akut, ada pemicu (OAINS/jamu, alkohol, makanan iritatif, H. pylori), bisa berdarah;
 * dispepsia fungsional = kronik berbulan-bulan, tanpa penyebab organik dan tanpa tanda alarm.
 */

const many = (diseaseId: string, n: number, salt = 0) => Array.from({ length: n }, (_, i) => generateCase(content, config, { diseaseId, seed: 1000 + i * 37 + salt }));
const rich = (c: PatientCase): PatientCase => ({ ...c, patient: { ...c.patient, budget: 5_000_000 } });
const comp = (ev: EvaluationResult, key: string) => ev.components.find((x) => x.key === key)!;

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

describe('dua diagnosis terpisah', () => {
  it('nama & alias tidak saling tumpang tindih', () => {
    const g = content.diseasesById.get('gastritis')!;
    const d = content.diseasesById.get('dispepsia')!;
    expect(g.name).toBe('Gastritis akut');
    expect(d.name).toBe('Dispepsia fungsional');
    expect(d.aliases.map((a) => a.toLowerCase())).not.toContain('gastritis');
    expect(g.aliases.map((a) => a.toLowerCase())).not.toContain('dispepsia fungsional');
    // Saling menjadi diagnosis banding.
    expect(g.differentials.some((x) => x.id === 'dispepsia')).toBe(true);
    expect(d.differentials.some((x) => x.id === 'gastritis')).toBe(true);
  });

  it('gastritis: akut (≤ 7 hari) dengan pemicu yang terungkap lewat anamnesis', () => {
    let oains = 0;
    let alkohol = 0;
    for (const c of many('gastritis', 200)) {
      expect(c.day).toBeLessThanOrEqual(7);
      expect(c.chiefComplaintSymptoms).toContain('nyeri_ulu_hati');
      if (c.traits.includes('oains')) {
        oains++;
        expect(c.answers.riwayat_obat!.text, `#${c.seed}`).toMatch(/jamu pegal linu|antinyeri|asam urat/i);
      }
      if (c.traits.includes('alkohol')) {
        alkohol++;
        expect(c.answers.kebiasaan!.text, `#${c.seed}`).toMatch(/minum-minum/i);
      }
    }
    expect(oains).toBeGreaterThan(60);
    expect(alkohol).toBeGreaterThan(5);
  });

  it('gastritis erosif bisa berdarah (muntah darah / BAB hitam) — dispepsia fungsional tidak pernah', () => {
    const gas = many('gastritis', 400, 1);
    const bleeding = gas.filter((c) => c.traits.includes('perdarahan_saluran_cerna'));
    expect(bleeding.length / gas.length).toBeGreaterThan(0.05);
    expect(bleeding.length / gas.length).toBeLessThan(0.25);
    for (const c of bleeding) expect(c.symptoms.some((s) => s === 'bab_hitam' || s === 'muntah_darah') || c.symptoms.includes('lemas')).toBe(true);
    for (const c of many('dispepsia', 400, 2)) {
      expect(c.symptoms).not.toContain('bab_hitam');
      expect(c.symptoms).not.toContain('muntah_darah');
      expect(c.symptoms).not.toContain('berat_badan_turun');
      expect(c.traits).not.toContain('perdarahan_saluran_cerna');
    }
  });

  it('dispepsia fungsional: kronik (≥ 3 bulan), keluhan utama nyeri ulu hati ATAU cepat kenyang/begah', () => {
    const chief = new Set<string>();
    for (const c of many('dispepsia', 200, 3)) {
      expect(c.day).toBeGreaterThanOrEqual(90);
      expect(c.answers.onset!.text).toMatch(/bulan/);
      chief.add(c.chiefComplaintSymptoms[0]!);
      expect(['nyeri_ulu_hati', 'cepat_kenyang']).toContain(c.chiefComplaintSymptoms[0]);
      if (!c.traits.includes('nyeri_epigastrium')) expect(c.symptoms).toContain('cepat_kenyang');
    }
    expect(chief).toEqual(new Set(['nyeri_ulu_hati', 'cepat_kenyang']));
  });

  it('pasien membedakannya saat ditanya: "Pernah seperti ini sebelumnya?"', () => {
    const ask = (c: PatientCase) => askQuestion(startEncounter(c), 'Pernah seperti ini sebelumnya?', content, config).reply;
    const gas = many('gastritis', 60, 4).map(ask);
    const dis = many('dispepsia', 60, 4).map(ask);
    expect(gas.filter((r) => /baru kali ini|nggak separah ini/i.test(r)).length).toBeGreaterThan(40);
    expect(dis.every((r) => /sering|berkali-kali|bertahun/i.test(r))).toBe(true);
  });
});

describe('penilaian', () => {
  it('gastritis didiagnosis dispepsia fungsional → diagnosis salah + jebakan dijelaskan', () => {
    const c = many('gastritis', 1, 5)[0]!;
    const ev = decide(startEncounter(rich(c)), { primary: 'dispepsia' });
    expect(ev.primaryCorrect).toBe(false);
    expect(ev.pitfalls.join(' ')).toMatch(/bukan dispepsia fungsional/i);
  });

  it('gastritis berdarah yang dipulangkan = keputusan tidak aman', () => {
    const c = many('gastritis', 300, 6).find((x) => x.traits.includes('perdarahan_saluran_cerna'))!;
    const disease = content.diseasesById.get('gastritis')!;
    const s = startEncounter(rich(c));
    expect(expectedDisposition(disease, caseContext(s)).value).toBe('rujuk_segera');
    expect(decide(s, { disposition: 'rawat_jalan' }).unsafe).toBe(true);
  });

  it('tes H. pylori opsional: tidak dihukum, tidak diwajibkan; CT-scan tetap dianggap tidak perlu', () => {
    const c = rich(many('dispepsia', 30, 7).find((x) => x.patient.age < 45)!);
    const base = decide(startEncounter(c), {});
    const withHp = decide(performExam(startEncounter(c), 'tes_h_pylori', content, config), {});
    expect(comp(withHp, 'penunjang').score).toBe(comp(base, 'penunjang').score);
    expect(comp(withHp, 'penunjang').good.some((g) => g.text.includes('H. pylori') && g.detail?.startsWith('Boleh'))).toBe(true);
    const withCt = decide(performExam(startEncounter(c), 'ct_abdomen', content, config), {});
    expect(comp(withCt, 'penunjang').score).toBeLessThan(comp(base, 'penunjang').score);
  });

  it('hasil tes H. pylori mengikuti trait (positif pada infeksi, umumnya negatif tanpa infeksi)', () => {
    let pos = 0;
    let neg = 0;
    for (const c of many('gastritis', 300, 8)) {
      const v = c.findings.tes_h_pylori!.find((r) => r.paramId === 'antigen')!.value;
      if (c.traits.includes('h_pylori')) pos += v === 'Positif' ? 1 : 0;
      else neg += v === 'Negatif' ? 1 : 0;
    }
    const infected = many('gastritis', 300, 8).filter((c) => c.traits.includes('h_pylori')).length;
    expect(pos / infected).toBeGreaterThan(0.8);
    expect(neg / (300 - infected)).toBeGreaterThan(0.9);
  });
});

describe('bahasa pasien & dokter', () => {
  it('gejala baru dikenali dari pertanyaan bebas', () => {
    const sym = (q: string) => interpretQuestion(q, content).intents.flatMap((i) => (i.kind === 'symptom' ? [i.symptom] : []));
    expect(sym('Pernah muntah darah?')).toEqual(['muntah_darah']);
    expect(sym('Muntahnya warna hitam seperti kopi?')).toEqual(['muntah_darah']);
    expect(sym('Cepat kenyang?')).toEqual(['cepat_kenyang']);
    expect(sym('Perutnya begah?')).toEqual(['cepat_kenyang']);
  });
});
