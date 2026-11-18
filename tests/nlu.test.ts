import { describe, expect, it } from 'vitest';
import { doctorQuestion } from '../src/core/dialogue';
import { generateCase } from '../src/core/generator';
import { interpretQuestion, normalizeQuestion } from '../src/core/nlu';
import { config, content, perDisease } from './helpers';

const topicsOf = (q: string) =>
  interpretQuestion(q, content).intents.flatMap((i) => (i.kind === 'topic' ? [i.topic] : i.kind === 'symptom_detail' ? [`${i.topic}/${i.symptom}`] : []));
const kindsOf = (q: string) => interpretQuestion(q, content).intents.map((i) => i.kind);

describe('normalisasi bahasa sehari-hari', () => {
  it('slang, akhiran -nya/-kah, dan kata ulang angka', () => {
    expect(normalizeQuestion('Udah brp lama sakitnya?')).toBe('sudah berapa lama sakit');
    // Kata ulang cukup satu: "pusing2" → "pusing pusing" → "pusing".
    expect(normalizeQuestion('Apakah pusing2?')).toBe('apakah pusing');
    expect(normalizeQuestion('Gimana BAB-nya?')).toBe('bagaimana bab');
  });
  it('kata yang hanya mirip akhiran tidak dipotong', () => {
    expect(normalizeQuestion('darah merah rumah punya')).toBe('darah merah rumah punya');
  });
});

describe('pemahaman pertanyaan bebas', () => {
  it.each([
    ['Sejak kapan keluhannya?', 'onset'],
    ['Kapan pertama kali muncul?', 'onset'],
    ['Mulai kapan sakitnya, Pak?', 'onset'],
    ['Sakitnya di mana?', 'lokasi'],
    ['Nyerinya menjalar ke mana?', 'lokasi'],
    ['Rasanya seperti apa? ditusuk atau melilit?', 'karakter'],
    ['Seberapa berat, skala 1 sampai 10?', 'keparahan'],
    ['Hilang timbul atau terus menerus?', 'pola'],
    ['Apakah makin lama makin parah?', 'progresi'],
    ['Ada yang memperberat atau meringankan?', 'pemberat_peringan'],
    ['Ada keluhan lain?', 'keluhan_lain'],
    ['Selain itu ada lagi yang dirasakan?', 'keluhan_lain'],
    ['Pernah seperti ini sebelumnya?', 'episode_sebelumnya'],
    ['Punya darah tinggi atau kencing manis?', 'riwayat_penyakit'],
    ['Lagi minum obat apa?', 'riwayat_obat'],
    ['Ada alergi obat?', 'alergi'],
    ['Di keluarga ada yang sakit serupa?', 'riwayat_keluarga'],
    ['Habis bepergian ke luar kota?', 'bepergian_lingkungan'],
    ['Merokok? minum alkohol?', 'kebiasaan'],
    ['Apa keluhannya?', 'keluhan_utama'],
  ])('"%s" → %s', (q, topic) => {
    expect(topicsOf(q)).toEqual([topic]);
  });

  it('rumusan berbeda untuk topik yang sama dipahami sama', () => {
    const variants = ['Sejak kapan?', 'sudah berapa lama sakitnya?', 'Mulainya kapan, Bu?', 'dari kapan ini?'];
    for (const q of variants) expect(topicsOf(q), q).toEqual(['onset']);
  });

  it('pertanyaan gejala spesifik (termasuk istilah medis & awam)', () => {
    const symptomOf = (q: string) => interpretQuestion(q, content).intents.flatMap((i) => (i.kind === 'symptom' ? [i.symptom] : []));
    expect(symptomOf('Ada mimisan atau gusi berdarah?')).toEqual(['perdarahan_mukosa']);
    expect(symptomOf('Sesak napas nggak?')).toEqual(['sesak_napas']);
    expect(symptomOf('Apakah ada hematuria?')).toEqual(['kencing_merah']);
    expect(symptomOf('keringat malam?')).toEqual(['keringat_malam']);
  });

  it('frasa terpanjang menang: "keringat malam" bukan topik pola "malam"', () => {
    expect(kindsOf('Ada keringat malam?')).toEqual(['symptom']);
  });

  it('detail gejala: "sejak kapan batuknya?" ditujukan ke gejala batuk', () => {
    expect(topicsOf('Batuknya sudah berapa lama?')).toEqual(['onset/batuk']);
  });

  it('beberapa topik dalam satu kalimat, dibatasi maxIntents', () => {
    const many = interpretQuestion('Sejak kapan, di mana, seperti apa, dan seberapa berat?', content, 3);
    expect(many.intents).toHaveLength(3);
    expect(many.intents.map((i) => (i.kind === 'topic' ? i.topic : ''))).toEqual(['onset', 'lokasi', 'karakter']);
  });

  it('tinjauan sistem: "BAB-nya bagaimana?" dan "kencingnya warna apa?"', () => {
    expect(interpretQuestion('BAB-nya gimana?', content).intents).toEqual([{ kind: 'review', group: 'bab' }]);
    expect(interpretQuestion('Kencingnya warna apa?', content).intents).toEqual([{ kind: 'review', group: 'bak' }]);
  });

  it('pertanyaan kontak di rumah tidak dianggap gejala pasien sendiri', () => {
    expect(kindsOf('Di rumah ada yang batuk lama?')).toEqual(['topic']);
  });

  it('basa-basi dikenali bila tidak ada pertanyaan klinis', () => {
    expect(kindsOf('Selamat pagi')).toEqual(['greeting']);
    expect(kindsOf('Terima kasih ya')).toEqual(['thanks']);
    expect(kindsOf('Saya periksa dulu ya')).toEqual(['consent']);
    expect(kindsOf('Selamat pagi, sejak kapan sakitnya?')).toEqual(['topic']);
  });

  it('aba-aba pemeriksaan tanpa pertanyaan dijawab sebagai persetujuan, bukan topik riwayat', () => {
    // "berbaring" adalah kata kunci faktor pemberat, tetapi di sini dokter memberi aba-aba.
    expect(kindsOf('Silakan berbaring, saya periksa dulu ya.')).toEqual(['consent']);
    expect(kindsOf('Permisi, saya periksa dadanya ya')).toEqual(['consent']);
    // Bila ada pertanyaan, pertanyaannya yang dijawab.
    expect(interpretQuestion('Saya periksa dulu ya, ada nyeri perut?', content).intents).toEqual([{ kind: 'symptom', symptom: 'nyeri_perut' }]);
    expect(kindsOf('Kalau berbaring sakitnya bertambah?')).toContain('topic');
  });

  it('"panas" pada dada/ulu hati adalah rasa terbakar, bukan demam', () => {
    const ids = (q: string) => interpretQuestion(q, content).intents.map((i) => ('symptom' in i ? i.symptom : i.kind));
    expect(ids('Dada terasa panas setelah makan?')).toEqual(['heartburn']);
    expect(ids('Ulu hatinya panas?')).toEqual(['nyeri_ulu_hati']);
    expect(ids('Ada panas?')).toEqual(['demam']);
    expect(ids('Badannya panas?')).toEqual(['demam']);
  });

  it('"seberapa tinggi demamnya" menanyakan derajat demam, bukan sekadar ada/tidaknya', () => {
    for (const q of ['Demamnya tinggi?', 'Seberapa tinggi demamnya?', 'Panasnya tinggi sekali?', 'Berapa derajat panasnya?'])
      expect(topicsOf(q), q).toEqual(['keparahan/demam']);
    expect(kindsOf('Ada demam?')).toEqual(['symptom']);
    // "tinggi" milik tekanan darah / gula / tinggi badan tidak dibelokkan ke demam.
    expect(topicsOf('Demam dan darah tinggi?')).not.toContain('keparahan/demam');
    expect(topicsOf('Tinggi badannya berapa?')).toEqual([]);
  });

  it('kata bermakna ganda ("gemetar") dijawab sesuai gejala yang dialami pasien', async () => {
    const { askQuestion, startEncounter } = await import('../src/core/encounter');
    const ask = (diseaseId: string, q: string) => {
      const c = generateCase(content, config, { diseaseId, seed: 3 });
      const r = askQuestion(startEncounter(c), q, content, config);
      return r.state.revealedSymptoms;
    };
    expect(ask('hipoglikemia', 'Gemetar?')).toContain('gemetar');
    expect(ask('malaria', 'Sampai gemetaran?')).toContain('menggigil');
    expect(ask('malaria', 'Tangannya gemetar?')).not.toContain('menggigil');
  });

  it('pertanyaan di luar konteks yang memuat "di mana" tidak dijawab sebagai lokasi keluhan', () => {
    expect(interpretQuestion('Mobilnya parkir di mana?', content).intents).toEqual([]);
    expect(topicsOf('Sakitnya di mana?')).toEqual(['lokasi']);
  });

  it('pertanyaan yang tidak dipahami menghasilkan daftar kosong', () => {
    expect(interpretQuestion('Siapa presiden pertama?', content).intents).toEqual([]);
    expect(interpretQuestion('   ', content).intents).toEqual([]);
  });
});

describe('tombol topik standar', () => {
  it('kalimat standar tiap topik (dengan semua sapaan) dipahami sebagai topik itu saja', () => {
    const seen = new Set<string>();
    for (const d of content.diseases) {
      for (let seed = 1; seed <= perDisease(25, 4); seed++) {
        const c = generateCase(content, config, { diseaseId: d.id, seed });
        for (const t of content.anamnesis) {
          const q = doctorQuestion(t.question, c);
          if (seen.has(q)) continue;
          seen.add(q);
          expect(interpretQuestion(q, content, config.anamnesis.maxIntentsPerQuestion).intents, q).toEqual([{ kind: 'topic', topic: t.id }]);
        }
      }
    }
    expect(seen.size).toBeGreaterThan(content.anamnesis.length * 3);
  });
});

describe('pertanyaan baku gejala & alloanamnesis', () => {
  it('pertanyaan baku setiap gejala dipahami sebagai gejala itu (rujukan "anaknya" = pasien anak)', async () => {
    const { stripChildReference } = await import('../src/core/nlu');
    const wrong: string[] = [];
    for (const s of content.symptoms) {
      const ints = interpretQuestion(stripChildReference(s.question), content, 3).intents;
      if (!ints.some((i) => (i.kind === 'symptom' || i.kind === 'symptom_detail') && i.symptom === s.id)) wrong.push(`${s.id}: ${s.question} → ${JSON.stringify(ints)}`);
    }
    expect(wrong).toEqual([]);
  });

  it('pasien anak: "anaknya/adik/bayinya" adalah pasien; "anak-anak lain/kakaknya" tetap riwayat keluarga', async () => {
    const { askQuestion, startEncounter } = await import('../src/core/encounter');
    const { generateCase } = await import('../src/core/generator');
    let c = generateCase(content, config, { diseaseId: 'kejang_demam', seed: 1 });
    for (let seed = 2; !c.patient.companion || !c.symptoms.includes('demam'); seed++) c = generateCase(content, config, { diseaseId: 'kejang_demam', seed });
    const st = startEncounter(c);
    for (const q of ['Apakah anaknya demam?', 'Adiknya demam?', 'Bayinya demam?', `${c.patient.callName} demam?`]) {
      const r = askQuestion(st, q, content, config);
      expect(r.intents, q).toContainEqual({ kind: 'symptom', symptom: 'demam' });
      expect(r.state.revealedSymptoms, q).toContain('demam');
    }
    for (const q of ['Anak-anak lain di rumah ada yang demam?', 'Kakaknya ada yang sakit serupa?']) {
      expect(askQuestion(st, q, content, config).intents, q).toContainEqual({ kind: 'topic', topic: 'riwayat_keluarga' });
    }
  });
});
