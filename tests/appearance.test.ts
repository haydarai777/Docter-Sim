import { describe, expect, it } from 'vitest';
import { ageGroupOf, buildAppearance, chiefSite, planGestures, sampleSpeech, speechTimeline } from '../src/core/appearance';
import { applyIntents, startEncounter } from '../src/core/encounter';
import { generateCase } from '../src/core/generator';
import { deriveSeed } from '../src/core/rng';
import type { CueId, PatientCase } from '../src/core/types';
import { config, content, DISEASE_IDS } from './helpers';

const many = (diseaseId: string, n: number): PatientCase[] =>
  Array.from({ length: n }, (_, i) => generateCase(content, config, { diseaseId, seed: deriveSeed(77, `${diseaseId}:${i}`) }));
const find = (diseaseId: string, pred: (c: PatientCase) => boolean, tries = 800): PatientCase => {
  for (let i = 0; i < tries; i++) {
    const c = generateCase(content, config, { diseaseId, seed: deriveSeed(123, `${diseaseId}:${i}`) });
    if (pred(c)) return c;
  }
  throw new Error(`tidak ada kasus ${diseaseId} yang cocok`);
};
const val = (c: PatientCase, tool: string, param: string) => c.findings[tool]!.find((r) => r.paramId === param)!;

describe('penampilan pasien: konsisten dengan kasus', () => {
  it('deterministik dari seed kasus', () => {
    const c = generateCase(content, config, { diseaseId: 'dengue', seed: 5 });
    expect(buildAppearance(c, content)).toEqual(buildAppearance(c, content));
  });

  it('tubuh & napas diambil dari hasil pemeriksaan kasus', () => {
    for (const id of DISEASE_IDS) {
      for (const c of many(id, 40)) {
        const a = buildAppearance(c, content);
        expect(a.sex).toBe(c.patient.sex);
        expect(a.ageGroup).toBe(ageGroupOf(c.patient.age));
        expect(a.heightCm).toBe(val(c, 'timbangan', 'tb').value);
        expect(a.bmi).toBe(val(c, 'timbangan', 'imt').value);
        expect(a.breathsPerMinute).toBe(val(c, 'tanda_vital', 'napas').value);
        expect(a.build).toBeGreaterThanOrEqual(-1);
        expect(a.build).toBeLessThanOrEqual(1);
      }
    }
  });

  it('isyarat yang terlihat TIDAK pernah bertentangan dengan kasus', () => {
    for (const id of DISEASE_IDS) {
      for (const c of many(id, 120)) {
        const a = buildAppearance(c, content);
        const has = (cue: CueId) => (a.cues[cue] ?? 0) > 0;
        const text = (tool: string, param: string) => String(val(c, tool, param).value).toLowerCase();
        if (has('batuk')) expect(c.symptoms.some((s) => s === 'batuk' || s === 'batuk_darah'), `${id}: batuk`).toBe(true);
        if (has('kuning')) expect(val(c, 'kepala_leher', 'sklera').flag !== null || text('ekstremitas_kulit', 'kulit').includes('kuning'), `${id}: kuning`).toBe(true);
        if (has('pucat')) expect(text('kepala_leher', 'konjungtiva').includes('anemis (pucat)') || text('keadaan_umum', 'kesan_sakit').includes('pucat'), `${id}: pucat`).toBe(true);
        if (has('ruam')) expect(text('ekstremitas_kulit', 'kulit')).toContain('petekie');
        if (has('pincang_kanan')) expect(text('ekstremitas_kulit', 'kulit')).toContain('luka');
        if (has('menggigil')) expect(text('keadaan_umum', 'kesan_sakit')).toContain('menggigil');
        if (has('demam')) expect(val(c, 'tanda_vital', 'suhu').value as number).toBeGreaterThanOrEqual(38);
        if (has('mengantuk')) expect(val(c, 'keadaan_umum', 'kesadaran').flag).not.toBeNull();
        if (has('gemuk')) expect(val(c, 'timbangan', 'imt').flag).toBe('H');
        if (has('kurus')) expect(val(c, 'timbangan', 'imt').flag).toBe('L');
        if (a.hold) expect(c.symptoms.some((s) => content.appearance.symptomCues.some((r) => r.symptom === s && r.site === a.hold!.site))).toBe(true);
        if ((a.cues.sesak ?? 0) >= 0.9) {
          const fast = (val(c, 'tanda_vital', 'napas').value as number) >= 25 || (val(c, 'tanda_vital', 'spo2').value as number) <= 93;
          expect(fast || /sesak berat|cuping hidung/.test(text('keadaan_umum', 'kesan_sakit')), `${id}: sesak berat`).toBe(true);
        }
        // Tanpa hijab untuk laki-laki; kumis/janggut hanya laki-laki dewasa.
        if (a.sex === 'male') expect(a.hijab).toBeNull();
        if (a.facialHair !== 'none') expect(a.sex === 'male' && a.age >= 24).toBe(true);
      }
    }
  });

  it('gejala tanpa isyarat tetap tersembunyi (hanya lewat anamnesis/pemeriksaan)', () => {
    const c = find('dispepsia', (x) => x.hiddenSymptoms.includes('bab_hitam'));
    const cued = new Set(content.appearance.symptomCues.map((r) => r.symptom));
    for (const s of ['bab_hitam', 'disuria', 'sering_kencing', 'haus', 'keringat_malam', 'kencing_merah', 'diare']) expect(cued.has(s), s).toBe(false);
    expect(buildAppearance(c, content).observations.join(' ')).not.toMatch(/bab|hitam/i);
  });

  it('contoh manifestasi: sesak, kolik, ikterik, petekie, luka kaki, kurus, gemuk', () => {
    const asma = buildAppearance(find('asma', (x) => x.traits.includes('serangan_berat')), content);
    expect(asma.cues.sesak).toBe(1);
    expect(asma.cues.tripod).toBe(1);
    expect(asma.talkRate).toBeLessThan(14);

    const batuCase = find('batu_saluran_kemih', (x) => x.traits.includes('sisi_kiri') && !x.traits.includes('infeksi_obstruktif'));
    const batu = buildAppearance(batuCase, content);
    expect(batu.hold).toMatchObject({ site: 'pinggang', side: 'kiri' });
    expect(batu.cues.gelisah).toBe(1);
    expect(chiefSite(batuCase, content)).toBe('pinggang');

    expect(buildAppearance(find('malaria', (x) => x.traits.includes('malaria_berat')), content).cues.kuning).toBe(1);
    expect(buildAppearance(find('dengue', (x) => x.symptoms.includes('bintik_merah')), content).cues.ruam).toBe(1);
    const dm = buildAppearance(find('dm_tipe2', (x) => x.traits.includes('ulkus_kaki')), content);
    expect(dm.cues.pincang_kanan).toBe(1);
    expect(dm.outfit.footwear).toBe('sandal');
    expect(buildAppearance(find('tb_paru', (x) => x.traits.includes('gizi_buruk')), content).build).toBeLessThan(-0.2);
    expect(buildAppearance(find('gerd', (x) => x.traits.includes('obesitas')), content).build).toBeGreaterThan(0.3);
  });

  it('pasien anak & remaja muncul hanya pada penyakit yang mengizinkan, dengan sapaan & rujukan sesuai usia', () => {
    const young = many('dengue', 400).filter((c) => c.patient.age < 18);
    expect(young.length).toBeGreaterThan(20);
    for (const c of young) {
      expect(['pelajar', 'pelajar_sd']).toContain(c.patient.occupationId);
      if (c.patient.age <= 14) expect(c.patient.address.startsWith('Dik ')).toBe(true);
      const a = buildAppearance(c, content);
      expect(['anak', 'remaja']).toContain(a.ageGroup);
      // Tinggi badan sesuai usia (bukan tinggi dewasa).
      if (c.patient.age <= 12) expect(a.heightCm).toBeLessThanOrEqual(160);
      for (const t of Object.values(c.answers)) expect(t.text).not.toMatch(/merokok, Dok, sehari|nggak bisa kerja|tempat kerja/);
    }
    for (const id of ['angina_stabil', 'dm_tipe2', 'batu_saluran_kemih']) expect(many(id, 150).every((c) => c.patient.age >= 18)).toBe(true);
  });

  it('rujukan tanda vital anak: nilai normal tidak ditandai abnormal, takipnea tetap abnormal', () => {
    const kids = many('asma', 600).filter((c) => c.patient.age <= 12);
    expect(kids.length).toBeGreaterThan(10);
    for (const c of kids) {
      const rr = val(c, 'tanda_vital', 'napas');
      expect(rr.refText).toBe('16–24');
      // Asma selalu takipnea menurut aturan penyakit → tetap ditandai tinggi pada anak.
      if (rr.source === 'disease') expect(rr.flag).toBe('H');
      expect(val(c, 'timbangan', 'tb').flag).toBeNull();
    }
  });
});

describe('bahasa tubuh sesuai konteks percakapan', () => {
  const ask = (c: PatientCase, intents: Parameters<typeof applyIntents>[1]) => {
    const s0 = startEncounter(c);
    const r = applyIntents(s0, intents, content);
    return planGestures(c, { intents, parts: r.parts, newlyRevealed: r.state.revealedSymptoms.filter((x) => !s0.revealedSymptoms.includes(x)) }, content);
  };

  it('ditanya lokasi → menunjuk bagian yang sakit (sisi sesuai kasus)', () => {
    const c = find('batu_saluran_kemih', (x) => x.traits.includes('sisi_kanan'));
    expect(ask(c, [{ kind: 'topic', topic: 'lokasi' }])).toContainEqual({ kind: 'tunjuk', site: 'pinggang', side: 'kanan' });
  });

  it('gejala ada → mengangguk & memperagakan; tidak ada → menggeleng', () => {
    const c = find('tb_paru', (x) => x.symptoms.includes('batuk') && !x.symptoms.includes('diare'));
    expect(ask(c, [{ kind: 'symptom', symptom: 'batuk' }])).toEqual([{ kind: 'angguk' }, { kind: 'peraga', act: 'batuk' }]);
    const absent = ask(c, [{ kind: 'symptom', symptom: 'diare' }]);
    expect(absent).toHaveLength(1);
    expect(['geleng', 'bingung']).toContain(absent[0]!.kind);
  });

  it('sesak diperagakan; pertanyaan tak dipahami → bingung; salam → salam', () => {
    const c = find('asma', (x) => x.symptoms.includes('sesak_napas'));
    expect(ask(c, [{ kind: 'symptom', symptom: 'sesak_napas' }])).toContainEqual({ kind: 'peraga', act: 'sesak' });
    expect(planGestures(c, { intents: [], parts: [], newlyRevealed: [] }, content)).toEqual([{ kind: 'bingung' }]);
    expect(ask(c, [{ kind: 'greeting' }])).toEqual([{ kind: 'salam' }]);
  });

  it('alergi: mengangguk bila ada, menggeleng bila tidak', () => {
    const none = find('isk', (x) => !x.allergy);
    const some = find('isk', (x) => !!x.allergy);
    expect(ask(none, [{ kind: 'topic', topic: 'alergi' }])).toEqual([{ kind: 'geleng' }]);
    expect(ask(some, [{ kind: 'topic', topic: 'alergi' }])).toEqual([{ kind: 'angguk' }]);
  });

  it('gestur tidak pernah menunjuk gejala yang tidak ada', () => {
    for (const id of DISEASE_IDS) {
      for (const c of many(id, 25)) {
        for (const s of content.symptoms) {
          const g = ask(c, [{ kind: 'symptom', symptom: s.id }]);
          if (!c.symptoms.includes(s.id)) expect(g.every((x) => x.kind === 'geleng' || x.kind === 'bingung'), `${id}/${s.id}`).toBe(true);
        }
      }
    }
  });
});

describe('sinkronisasi mulut dengan teks', () => {
  it('durasi sebanding panjang teks; mulut tertutup di akhir', () => {
    const short = speechTimeline('Iya, Dok.', 15);
    const long = speechTimeline('Sudah tiga hari, Dok. Panasnya naik turun dan badan saya lemas sekali.', 15);
    expect(long.duration).toBeGreaterThan(short.duration * 3);
    expect(sampleSpeech(long, long.duration + 1)).toMatchObject({ open: 0, done: true, chars: 70 });
  });

  it('vokal membuka mulut, m/b/p menutup, jeda pada tanda baca', () => {
    const tl = speechTimeline('mama', 10);
    expect(tl.frames.map((f) => f.open)).toEqual([0, 0.95, 0, 0.95, 0]);
    const paused = speechTimeline('Berat... sekali... Dok.', 15);
    expect(paused.duration).toBeGreaterThan(speechTimeline('Berat sekali Dok', 15).duration + 0.8);
  });

  it('jumlah karakter terucap naik monoton (untuk teks berjalan)', () => {
    const tl = speechTimeline('Di pinggang kiri, Dok, terus menjalar ke perut bawah.', 16);
    let prev = 0;
    for (let t = 0; t <= tl.duration; t += 0.05) {
      const s = sampleSpeech(tl, t);
      expect(s.chars).toBeGreaterThanOrEqual(prev);
      expect(s.open).toBeGreaterThanOrEqual(0);
      expect(s.open).toBeLessThanOrEqual(1);
      prev = s.chars;
    }
  });
});
