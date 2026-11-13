import { describe, expect, it } from 'vitest';
import { interpretQuestion, normalizeQuestion } from '../src/core/nlu';
import { content } from './helpers';

const topicsOf = (q: string) =>
  interpretQuestion(q, content).intents.flatMap((i) => (i.kind === 'topic' ? [i.topic] : i.kind === 'symptom_detail' ? [`${i.topic}/${i.symptom}`] : []));
const kindsOf = (q: string) => interpretQuestion(q, content).intents.map((i) => i.kind);

describe('normalisasi bahasa sehari-hari', () => {
  it('slang, akhiran -nya/-kah, dan kata ulang angka', () => {
    expect(normalizeQuestion('Udah brp lama sakitnya?')).toBe('sudah berapa lama sakit');
    expect(normalizeQuestion('Apakah pusing2?')).toBe('apakah pusing pusing');
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

  it('pertanyaan yang tidak dipahami menghasilkan daftar kosong', () => {
    expect(interpretQuestion('Siapa presiden pertama?', content).intents).toEqual([]);
    expect(interpretQuestion('   ', content).intents).toEqual([]);
  });
});
