import { describe, expect, it } from 'vitest';
import { durationReaction, symptomOnsetDays } from '../src/core/dialogue';
import { askQuestion, interpretInContext, startEncounter } from '../src/core/encounter';
import { generateCase } from '../src/core/generator';
import { fillTemplate } from '../src/core/text';
import type { EncounterState, PatientCase } from '../src/core/types';
import { config, content, DISEASE_IDS } from './helpers';

/**
 * Percakapan kontekstual mode lokal (tanpa AI): pertanyaan lanjutan merujuk gejala yang baru
 * dibicarakan, pasien bisa mengulang jawaban, dan pasien menanggapi lama sakit yang disebut dokter.
 */

const ask = (s: EncounterState, q: string) => askQuestion(s, q, content, config);

/** Kasus yang punya gejala penyerta (bukan keluhan utama) yang dikenali dari kata kuncinya sendiri. */
function caseWithSecondarySymptom(): { c: PatientCase; symptom: string; question: string } {
  for (const diseaseId of DISEASE_IDS) {
    for (let seed = 1; seed < 60; seed++) {
      const c = generateCase(content, config, { diseaseId, seed });
      for (const symptom of c.symptoms) {
        if (c.chiefComplaintSymptoms.includes(symptom)) continue;
        const question = `Ada ${content.symptomsById.get(symptom)!.keywords[0]}?`;
        const r = ask(startEncounter(c), question);
        if (r.intents.length === 1 && r.intents[0]!.kind === 'symptom' && r.intents[0]!.symptom === symptom) return { c, symptom, question };
      }
    }
  }
  throw new Error('tidak ada kasus dengan gejala penyerta');
}

describe('pertanyaan lanjutan merujuk gejala yang baru dibicarakan', () => {
  const { c, symptom, question } = caseWithSecondarySymptom();

  it('"Ada batuk?" → "Sejak kapan?" ditanyakan untuk batuk, bukan keluhan utama', () => {
    let s = ask(startEncounter(c), question).state;
    expect(s.focus?.symptom).toBe(symptom);
    const r = ask(s, 'Sejak kapan?');
    expect(r.intents).toEqual([{ kind: 'symptom_detail', topic: 'onset', symptom }]);
    s = r.state;
    // Lama gejala penyerta tidak pernah melebihi lama sakit.
    const days = symptomOnsetDays(c, symptom);
    expect(days).toBeGreaterThanOrEqual(1);
    expect(days).toBeLessThanOrEqual(c.day);
    expect(s.askedSymptoms).toContain(symptom);
  });

  it('rujukan kedaluwarsa setelah pertanyaan lain; kata "tadi/itu" memperpanjangnya', () => {
    let s = ask(startEncounter(c), question).state;
    s = ask(s, 'Ada alergi obat?').state;
    expect(interpretInContext(s, 'Sejak kapan?', content, config).intents).toEqual([{ kind: 'topic', topic: 'onset' }]);
    expect(interpretInContext(s, 'Yang tadi itu sejak kapan?', content, config).intents).toEqual([{ kind: 'symptom_detail', topic: 'onset', symptom }]);
  });

  it('gejala yang TIDAK ada tidak menjadi rujukan', () => {
    const absent = content.symptoms.find((x) => !c.symptoms.includes(x.id) && ask(startEncounter(c), `Ada ${x.keywords[0]}?`).intents.length === 1)!;
    const s = ask(startEncounter(c), `Ada ${absent.keywords[0]}?`).state;
    expect(s.focus).toBeUndefined();
    expect(interpretInContext(s, 'Sejak kapan?', content, config).intents).toEqual([{ kind: 'topic', topic: 'onset' }]);
  });

  it('"Sakitnya sejak kapan?" tetap merujuk keluhan utama walau baru membahas gejala lain', () => {
    const s = ask(startEncounter(c), question).state;
    expect(interpretInContext(s, 'Sakitnya sejak kapan?', content, config).intents).toEqual([{ kind: 'topic', topic: 'onset' }]);
    expect(interpretInContext(s, 'Keluhannya seberapa berat?', content, config).intents).toEqual([{ kind: 'topic', topic: 'keparahan' }]);
  });

  it('pertanyaan yang menyebut topik lain tidak dibelokkan ke rujukan', () => {
    const s = ask(startEncounter(c), question).state;
    expect(interpretInContext(s, 'Ada riwayat darah tinggi?', content, config).intents).toEqual([{ kind: 'topic', topic: 'riwayat_penyakit' }]);
  });
});

describe('minta diulang', () => {
  it('pasien mengulang jawaban terakhirnya, tanpa awalan bertumpuk', () => {
    const c = generateCase(content, config, { diseaseId: 'dengue', seed: 3 });
    const first = ask(startEncounter(c), 'Sejak kapan sakitnya?');
    const prefixes = content.conversation.repeatAsked.map((t) => fillTemplate(t, c.context));
    const again = ask(first.state, 'Maaf, bisa diulang?');
    expect(again.understood).toBe(true);
    expect(prefixes.some((p) => again.reply.startsWith(p))).toBe(true);
    expect(again.reply).toContain(first.reply);
    // Minta diulang dua kali: tetap satu awalan.
    const third = ask(again.state, 'Apa?');
    const count = prefixes.reduce((n, p) => n + third.reply.split(p).length - 1, 0);
    expect(count).toBe(1);
    expect(third.reply).toContain(first.reply);
  });
});

describe('lama sakit yang disebut dokter dikonfirmasi pasien', () => {
  const c = generateCase(content, config, { diseaseId: 'dengue', seed: 11 });
  const prefixesOf = (key: 'durationSame' | 'durationLonger' | 'durationShorter') => content.conversation[key].map((t) => fillTemplate(t, c.context));

  it('angka yang tepat dibenarkan, yang terlalu pendek/panjang dikoreksi', () => {
    const s = startEncounter(c);
    const same = ask(s, `Sudah ${c.day} hari?`).reply;
    expect(prefixesOf('durationSame').some((p) => same.startsWith(p)), same).toBe(true);
    const tooLong = ask(s, `Sudah ${c.day * 4 + 10} hari?`).reply;
    expect(prefixesOf('durationShorter').some((p) => tooLong.startsWith(p)), tooLong).toBe(true);
    if (c.day >= 3) {
      const tooShort = ask(s, 'Baru sehari ini? Sudah 1 hari?').reply;
      expect(prefixesOf('durationLonger').some((p) => tooShort.startsWith(p)), tooShort).toBe(true);
    }
  });

  it('toleransi ±25% (minimal 1 hari) dihitung dari lama sebenarnya', () => {
    expect(durationReaction(c, 10, 10, content, 'x')).toMatch(/segitu|sekitar itu/);
    expect(durationReaction(c, 12, 10, content, 'x')).toMatch(/segitu|sekitar itu/);
    expect(durationReaction(c, 3, 10, content, 'x')).toMatch(/lebih lama/i);
    expect(durationReaction(c, 30, 10, content, 'x')).toMatch(/belum selama/i);
  });
});

describe('topik percakapan baru tersedia di mode lokal', () => {
  it('nama, umur, pekerjaan dijawab sesuai identitas pasien', () => {
    for (const diseaseId of DISEASE_IDS) {
      const c = generateCase(content, config, { diseaseId, seed: 5 });
      const s = startEncounter(c);
      expect(ask(s, 'Siapa namanya?').reply).toContain(c.patient.name.split(' ')[0]!);
      expect(ask(s, 'Umurnya berapa?').reply).toContain(String(c.patient.age));
      const job = ask(s, 'Kerjanya apa?');
      expect(job.understood).toBe(true);
      expect(job.intents).toEqual([{ kind: 'topic', topic: 'identitas_pekerjaan' }]);
    }
  });

  it('topik baru tidak memengaruhi skor (non-inti), tetapi tercatat', () => {
    const c = generateCase(content, config, { diseaseId: 'gerd', seed: 2 });
    const r = ask(startEncounter(c), 'Menurut Bapak sakit apa? Apa yang dikhawatirkan?');
    expect(r.intents.map((i) => (i.kind === 'topic' ? i.topic : i.kind))).toEqual(['pendapat_pasien', 'kekhawatiran']);
    expect(r.state.askedTopics).toEqual(expect.arrayContaining(['pendapat_pasien', 'kekhawatiran']));
    for (const id of ['pendapat_pasien', 'kekhawatiran', 'harapan', 'identitas_nama']) expect(content.anamnesisById.get(id)!.core).toBeFalsy();
  });

  it('riwayat haid hanya relevan untuk perempuan usia subur', () => {
    let female = 0;
    for (const diseaseId of DISEASE_IDS) {
      for (let seed = 1; seed <= 30; seed++) {
        const c = generateCase(content, config, { diseaseId, seed });
        const text = c.answers.haid_kehamilan?.text ?? '';
        if (c.patient.sex === 'male') expect(text, `${diseaseId}#${seed}`).not.toMatch(/haid saya|hamil saya/i);
        else if (c.patient.age >= 12 && c.patient.age <= 49) female++;
      }
    }
    expect(female).toBeGreaterThan(20);
  });
});
