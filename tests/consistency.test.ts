import { describe, expect, it } from 'vitest';
import { performExam, startEncounter, submitDecision } from '../src/core/encounter';
import { generateCase } from '../src/core/generator';
import type { PatientCase } from '../src/core/types';
import { config, content, DISEASE_IDS } from './helpers';

/**
 * Tes regresi untuk bug konsistensi kasus yang ditemukan lewat fuzzing:
 * jawaban riwayat yang saling bertentangan, temuan "normal" yang tampak abnormal,
 * sumber temuan turunan, dan umpan balik negatif palsu.
 */

function* cases(perDisease: number, salt = 0): Generator<PatientCase> {
  for (const diseaseId of DISEASE_IDS) {
    for (let i = 1; i <= perDisease; i++) yield generateCase(content, config, { diseaseId, seed: i * 7919 + salt });
  }
}

describe('riwayat komorbiditas di jawaban anamnesis', () => {
  const ABSOLUTE_DENIAL = /apa-apa|sehat semua|^(?:.*\.\s)?nggak ada, dok\.|nggak tahu/i;

  it('tidak ada penyangkalan mutlak yang disusul riwayat positif ("Nggak ada penyakit apa-apa … Saya punya darah tinggi")', () => {
    let checked = 0;
    for (const c of cases(160)) {
      for (const cm of c.comorbidities) {
        const def = content.comorbiditiesById.get(cm.id)!;
        const added: [string, string | undefined][] = [
          ['riwayat_penyakit', cm.known ? def.history.known || undefined : undefined],
          ['riwayat_obat', cm.known ? def.history.medication : undefined],
          ['kebiasaan', def.history.habit],
          ['riwayat_keluarga', def.history.family],
        ];
        for (const [topic, sentence] of added) {
          if (!sentence) continue;
          const text = c.answers[topic]!.text;
          const core = sentence.replace(/\bjuga\s+/i, '').slice(0, 18).toLowerCase();
          if (!text.toLowerCase().includes(core)) continue;
          checked++;
          const rest = text.toLowerCase().replace(sentence.toLowerCase(), '');
          expect(ABSOLUTE_DENIAL.test(rest) && !text.includes('Oh iya, '), `${c.diseaseId}#${c.seed} ${topic}: ${text}`).toBe(false);
        }
      }
    }
    expect(checked).toBeGreaterThan(100);
  });

  it('kalimat pembuka kepribadian tetap di depan dan riwayat yang diketahui selalu disebut', () => {
    let pelupa = 0;
    for (const c of cases(160, 3)) {
      const personality = content.personalitiesById.get(c.patient.personalityId)!;
      for (const cm of c.comorbidities.filter((x) => x.known)) {
        const def = content.comorbiditiesById.get(cm.id)!;
        if (!def.history.known) continue;
        const text = c.answers.riwayat_penyakit!.text;
        const names = [def.name, ...def.aliases].map((n) => n.toLowerCase());
        const mentioned = names.some((n) => text.toLowerCase().includes(n)) || text.includes(def.history.known) || text.toLowerCase().includes(def.history.known.slice(0, 20).toLowerCase());
        expect(mentioned, `${c.diseaseId}#${c.seed}: ${text}`).toBe(true);
        for (const prefix of personality.answerPrefixes ?? []) {
          if (text.includes(prefix)) {
            pelupa++;
            expect(text.startsWith(prefix), text).toBe(true);
          }
        }
      }
    }
    expect(pelupa).toBeGreaterThan(0);
  });

  it('"Ibu saya JUGA kencing manis" hanya bila pasien tahu dirinya mengidapnya', () => {
    for (const c of cases(160, 5)) {
      for (const cm of c.comorbidities.filter((x) => !x.known)) {
        const fam = content.comorbiditiesById.get(cm.id)!.history.family;
        if (fam) expect(c.answers.riwayat_keluarga!.text.includes(fam), `${c.diseaseId}#${c.seed}`).toBe(false);
      }
    }
  });
});

describe('temuan turunan', () => {
  it('teks EKG dari pita frekuensi mewarisi sumber nadi (takikardia karena penyakit bukan "normal")', () => {
    let tachy = 0;
    for (const c of cases(60)) {
      const ekg = c.findings.ekg!;
      const irama = ekg.find((r) => r.paramId === 'irama')!;
      const frek = ekg.find((r) => r.paramId === 'frekuensi')!;
      if (irama.flag !== null && irama.value === 'Sinus takikardia') {
        tachy++;
        expect(irama.source, `${c.diseaseId}#${c.seed}`).toBe(frek.source);
        expect(irama.origin).toBe(frek.origin);
      }
      // Hasil bersumber "normal" tidak pernah ditandai abnormal.
      for (const r of ekg) if (r.source === 'normal') expect(r.flag, `${c.diseaseId}#${c.seed} ${r.paramId}`).toBeNull();
    }
    expect(tachy).toBeGreaterThan(10);
  });

  it('berat badan anak yang IMT-nya normal tidak ditandai abnormal', () => {
    let kids = 0;
    for (const c of cases(120, 11)) {
      if (c.patient.age > 12) continue;
      kids++;
      const t = c.findings.timbangan!;
      const imt = t.find((r) => r.paramId === 'imt')!;
      const bb = t.find((r) => r.paramId === 'bb')!;
      if (imt.flag === null) expect(bb.flag, `${c.diseaseId}#${c.seed} bb ${bb.value}`).toBeNull();
    }
    expect(kids).toBeGreaterThan(5);
  });

  it('kreatinin normal tidak menghasilkan eGFR yang ditandai rendah (termasuk lansia)', () => {
    let elderly = 0;
    for (const c of cases(400, 17)) {
      const fg = c.findings.fungsi_ginjal!;
      const scr = fg.find((r) => r.paramId === 'kreatinin')!;
      const egfr = fg.find((r) => r.paramId === 'egfr')!;
      if (c.patient.age >= 65) elderly++;
      if (scr.source === 'normal') {
        expect(scr.flag).toBeNull();
        expect(egfr.flag, `${c.diseaseId}#${c.seed} usia ${c.patient.age} Cr ${scr.value} eGFR ${egfr.value}`).toBeNull();
      }
    }
    expect(elderly).toBeGreaterThan(20);
  });
});

describe('umpan balik interpretasi', () => {
  it('negatif palsu dilaporkan walau parameter lain di alat yang sama abnormal (mis. IgM negatif, IgG positif)', () => {
    let found = 0;
    for (const c of cases(400, 23)) {
      const disease = content.diseasesById.get(c.diseaseId)!;
      for (const tool of content.tools) {
        const diag = disease.findings.filter((f) => f.tool === tool.id && f.diagnostic);
        if (!diag.length) continue;
        const res = c.findings[tool.id]!;
        const diagPositive = diag.some((f) => res.find((r) => r.paramId === f.param)?.source === 'disease');
        const otherDisease = res.some((r) => r.source === 'disease');
        if (diagPositive || !otherDisease) continue;
        // Kondisi aturan diagnostik harus berlaku untuk kasus ini agar dianggap negatif palsu.
        let s = startEncounter({ ...c, patient: { ...c.patient, budget: 10_000_000 } });
        s = performExam(s, tool.id, content, config);
        const ev = submitDecision(s, { primary: c.diseaseId, secondary: [], complications: [], disposition: 'observasi' }, content, config).evaluation!;
        const missed = ev.components.find((x) => x.key === 'penunjang')!.missed.map((m) => m.text);
        if (missed.some((m) => m.includes('NEGATIF PALSU') && m.includes(tool.name))) found++;
      }
    }
    expect(found).toBeGreaterThan(0);
  });
});
