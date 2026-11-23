import { describe, expect, it } from 'vitest';
import { buildAppearance } from '../src/core/appearance';
import { examFinding } from '../src/core/igd/assessment';
import { createShift, type EdContext, supportOf, vitalsOf } from '../src/core/igd/engine';
import { singleConfig } from '../src/core/igd/sim';
import { generateCase } from '../src/core/generator';
import { bleedingRate, bloodVolumeMl, caseInjuries, type InjuryProfile, type InjurySpec } from '../src/core/injury';
import { deriveSeed } from '../src/core/rng';
import { ED_SCENARIOS, ED_SCENARIOS_BY_ID } from '../src/data/igd';
import { config, content } from './helpers';

const ctx: EdContext = { scenarios: new Map(ED_SCENARIOS.map((s) => [s.id, s])), content };
const REGIONS = new Set(['kepala', 'leher', 'dada', 'perut', 'punggung', 'bahu', 'lengan_atas', 'lengan_bawah', 'telapak_tangan', 'punggung_tangan', 'paha', 'tungkai_bawah', 'pergelangan_kaki']);
const OPEN = new Set(['laserasi', 'bacok', 'iris', 'tusuk']);

/** Pemeriksaan struktural satu profil cedera (dipakai untuk skenario IGD & kasus poliklinik). */
function checkProfile(where: string, prof: InjuryProfile): void {
  const ids = new Set<string>();
  for (const w of prof.wounds) {
    const at = `${where}/${w.id}`;
    expect(ids.has(w.id), `${at}: id ganda`).toBe(false);
    ids.add(w.id);
    expect(REGIONS.has(w.region), `${at}: region`).toBe(true);
    expect(w.at, `${at}: at`).toBeGreaterThanOrEqual(0);
    expect(w.at, `${at}: at`).toBeLessThanOrEqual(1);
    expect(w.size[0], `${at}: panjang`).toBeGreaterThan(0);
    expect(w.size[1], `${at}: lebar`).toBeGreaterThan(0);
    expect(w.size[0], `${at}: ukuran wajar (cm)`).toBeLessThanOrEqual(40);
    expect(Math.abs(w.face), `${at}: sudut permukaan`).toBeLessThanOrEqual(180);
    expect(w.label.length, `${at}: label`).toBeGreaterThan(8);
    if (w.kind === 'luka_bakar') expect(w.burn, `${at}: derajat luka bakar`).toBeDefined();
    if (w.bleeding) {
      const b = w.bleeding;
      expect(!!b.share || !!b.mlPerMin, `${at}: sumber laju perdarahan`).toBe(true);
      if (b.share) expect(b.share).toBeLessThanOrEqual(1);
      // Hanya luka terbuka yang berdarah keluar.
      expect(OPEN.has(w.kind) || w.kind === 'ekskoriasi', `${at}: luka berdarah harus terbuka`).toBe(true);
    }
    if (w.region === 'kepala' || w.region === 'leher' || w.region === 'dada' || w.region === 'perut' || w.region === 'punggung') expect(w.circumferential, `${at}: sirkumferensial hanya untuk anggota gerak`).toBeFalsy();
  }
  if (prof.improvisedWrap) expect(ids.has(prof.improvisedWrap), `${where}: kain darurat merujuk luka`).toBe(true);
  for (const leg of [prof.expose?.legs?.kiri, prof.expose?.legs?.kanan]) if (leg !== undefined) expect(leg >= 0 && leg <= 1, `${where}: potongan celana`).toBe(true);
  if (prof.fracture) expect(prof.fracture.shortenCm).toBeLessThan(8);
}

const findCase = (diseaseId: string, pred: (traits: Set<string>) => boolean) => {
  for (let i = 0; i < 1500; i++) {
    const c = generateCase(content, config, { diseaseId, seed: deriveSeed(31, `${diseaseId}:${i}`) });
    if (pred(new Set(c.traits))) return c;
  }
  throw new Error(`tidak ada kasus ${diseaseId} yang cocok`);
};

describe('Cedera yang tampak (luka & perdarahan)', () => {
  it('data cedera semua skenario IGD valid', () => {
    const withInjuries = ED_SCENARIOS.filter((s) => s.injuries);
    expect(withInjuries.length).toBeGreaterThanOrEqual(10);
    for (const s of withInjuries) checkProfile(s.id, s.injuries!);
  });

  it('skenario perdarahan memakai sumber perdarahan yang sesuai', () => {
    const pe = ED_SCENARIOS_BY_ID.get('perdarahan_eksternal')!.injuries!;
    const bacok = pe.wounds.find((w) => w.bleeding?.type === 'arteri');
    expect(bacok?.region).toBe('paha');
    expect(bacok?.bleeding?.share).toBe(1);
    expect(pe.improvisedWrap).toBe(bacok?.id);
    expect(ED_SCENARIOS_BY_ID.get('perdarahan_postpartum')!.injuries!.vaginal?.share).toBe(1);
    expect(ED_SCENARIOS_BY_ID.get('perdarahan_scba')!.injuries!.hematemesis?.share).toBeGreaterThan(0);
    const burn = ED_SCENARIOS_BY_ID.get('luka_bakar_inhalasi')!.injuries!;
    expect(burn.wounds.every((w) => w.kind === 'luka_bakar')).toBe(true);
    expect(burn.face?.soot).toBeGreaterThan(0.5);
  });

  it('kasus poliklinik: penyakit & ciri yang dipetakan benar-benar ada', () => {
    const mapped: Record<string, string[]> = {
      vulnus: ['punctum'],
      kekerasan_tajam: ['tusuk_rongga', 'luka_tangkis'],
      kekerasan_tumpul: ['fraktur_curiga'],
      luka_bakar: ['luas', 'derajat2', 'knalpot', 'tersiram_anak'],
      epistaksis: [],
      reaksi_gigitan_serangga: [],
      ulkus_tungkai: [],
    };
    for (const [id, traits] of Object.entries(mapped)) {
      const d = content.diseases.find((x) => x.id === id);
      expect(d, id).toBeDefined();
      const known = new Set((d!.traits ?? []).map((t) => t.id));
      for (const t of traits) expect(known.has(t), `${id}: ciri ${t}`).toBe(true);
    }
  });

  it('kasus poliklinik: profil cedera valid untuk semua variasi ciri', () => {
    const combos: [string, string[]][] = [
      ['vulnus', []],
      ['kekerasan_tajam', []],
      ['kekerasan_tajam', ['tusuk_rongga', 'luka_tangkis']],
      ['kekerasan_tumpul', ['fraktur_curiga']],
      ['luka_bakar', ['luas']],
      ['luka_bakar', ['derajat2', 'knalpot']],
      ['luka_bakar', ['derajat2', 'tersiram_anak']],
      ['luka_bakar', ['derajat2']],
      ['luka_bakar', []],
      ['epistaksis', []],
      ['reaksi_gigitan_serangga', []],
      ['ulkus_tungkai', []],
    ];
    for (const [diseaseId, traits] of combos) {
      const prof = caseInjuries({ diseaseId, traits });
      expect(prof, `${diseaseId} ${traits}`).not.toBeNull();
      checkProfile(`${diseaseId}[${traits}]`, prof!);
    }
    expect(caseInjuries({ diseaseId: 'vulnus', traits: ['punctum'] })).toBeNull();
    expect(caseInjuries({ diseaseId: 'dengue', traits: [] })).toBeNull();
  });

  it('penampilan pasien poliklinik membawa cedera & lengan baju dibuka', () => {
    const c = findCase('vulnus', (t) => !t.has('punctum'));
    const a = buildAppearance(c, content);
    expect(a.injuries?.wounds[0]?.kind).toBe('laserasi');
    expect(a.outfit.sleeves).toBe('pendek');
    expect(a.observations.some((o) => o.includes('vulnus laseratum'))).toBe(true);
    const d = generateCase(content, config, { diseaseId: 'dengue', seed: 3 });
    expect(buildAppearance(d, content).injuries ?? null).toBeNull();
  });

  it('laju perdarahan: porsi fisiologi, laju tetap, dan waktu paruh', () => {
    const ebv = bloodVolumeMl(70, 30);
    expect(ebv).toBe(4900);
    expect(bloodVolumeMl(20, 6)).toBe(1600);
    // 1% volume darah per menit, seluruhnya dari luka ini.
    expect(bleedingRate({ type: 'arteri', share: 1 }, 0.01, ebv, 5)).toBeCloseTo(49);
    expect(bleedingRate({ type: 'arteri', share: 0.5 }, 0.01, ebv, 5)).toBeCloseTo(24.5);
    expect(bleedingRate({ type: 'arteri', share: 1 }, -0.2, ebv, 5)).toBe(0);
    const venous: InjurySpec['bleeding'] = { type: 'vena', mlPerMin: 6, halfLifeMin: 25 };
    expect(bleedingRate(venous!, 0, ebv, 0)).toBeCloseTo(6);
    expect(bleedingRate(venous!, 0, ebv, 25)).toBeCloseTo(3);
    expect(bleedingRate(venous!, 0, ebv, 50)).toBeCloseTo(1.5);
    expect(bleedingRate({ type: 'kapiler', mlPerMin: 0.4 }, 0, ebv, 999)).toBeCloseTo(0.4);
  });

  it('pemeriksaan IGD konsisten dengan cedera yang tampak', () => {
    const exam = (scenarioId: string, id: Parameters<typeof examFinding>[0]) => {
      const shift = createShift(singleConfig(scenarioId, undefined, 60), 4, ctx);
      const p = shift.patients[0]!;
      const sc = ED_SCENARIOS_BY_ID.get(scenarioId)!;
      return examFinding(id, p, sc, vitalsOf(p, shift.time), supportOf(p, shift.time), shift.time);
    };
    // Luka bakar: pemeriksaan "Luka" melaporkan luka bakar, bukan "tidak ada luka".
    const burn = exam('luka_bakar_inhalasi', 'luka');
    expect(burn).toContain('Luka bakar');
    expect(burn).not.toContain('Tidak ada luka');
    // Cedera kepala: kepala-leher tidak boleh menyebut "tidak ada jejas".
    expect(exam('cedera_kepala_berat', 'kepala_leher')).not.toContain('tidak ada jejas');
    // Perdarahan pascapersalinan: temuan obstetri tanpa kalimat "tidak ada temuan".
    const obs = exam('perdarahan_postpartum', 'obstetri');
    expect(obs).not.toContain('Tidak ada temuan');
    expect(obs.toLowerCase()).toContain('uterus');
    // Tanpa cedera: tetap "tidak ada luka terbuka".
    expect(exam('hipoglikemia', 'luka')).toBe('Tidak ada luka terbuka');
    // Temuan abdomen skenario menggantikan teks normal (tidak kontradiktif).
    for (const s of ED_SCENARIOS) {
      if (!s.findings?.abdomen) continue;
      expect(exam(s.id, 'abdomen'), s.id).not.toContain('nyeri tekan (−)');
    }
  });
});

describe('Teks pemeriksaan IGD tidak menggandakan temuan', () => {
  it('tidak ada klausa ganda/hampir sama dalam satu hasil pemeriksaan (semua skenario, saat tiba)', async () => {
    const { EXAMS } = await import('../src/core/igd/catalog');
    const { advance } = await import('../src/core/igd/engine');
    const words = (c: string) => new Set(c.toLowerCase().replace(/[()]/g, '').split(/\s+/).filter((w) => w.length > 2 && !['dan', 'yang', 'di'].includes(w)));
    for (const sc of ED_SCENARIOS) {
      const shift = createShift(singleConfig(sc.id, undefined, 60), 5, ctx);
      const p = shift.patients[0]!;
      advance(shift, p.arriveAt - shift.time + 5, ctx);
      for (const ex of EXAMS) {
        const text = examFinding(ex.id, p, sc, vitalsOf(p, shift.time), supportOf(p, shift.time), shift.time);
        const clauses = text.split(/[.;]\s*/).map(words).filter((w) => w.size >= 3);
        for (let i = 0; i < clauses.length; i++) {
          for (let j = i + 1; j < clauses.length; j++) {
            const a = clauses[i]!;
            const b = clauses[j]!;
            const inter = [...a].filter((w) => b.has(w)).length;
            const jac = inter / (a.size + b.size - inter);
            expect(jac, `${sc.id} ${ex.id}: «${text}»`).toBeLessThan(0.75);
          }
        }
      }
    }
  });
});

describe('Pupil 3D selaras dengan teks pemeriksaan', () => {
  it('pin-point, miosis, isokor normal sesuai teks pemeriksaan D', async () => {
    const { pupilSizes } = await import('../src/core/igd/assessment');
    const { advance } = await import('../src/core/igd/engine');
    for (const sc of ED_SCENARIOS) {
      const shift = createShift(singleConfig(sc.id, undefined, 60), 5, ctx);
      const p = shift.patients[0]!;
      advance(shift, p.arriveAt - shift.time + 30, ctx);
      const t = shift.time;
      const text = examFinding('D', p, sc, vitalsOf(p, t), supportOf(p, t), t);
      const [l, r] = pupilSizes(p.physio, t);
      if (/pin-point/.test(text)) expect(Math.max(l, r), sc.id).toBeLessThanOrEqual(1.2);
      else if (/miosis/.test(text)) expect(Math.max(l, r), sc.id).toBeLessThan(2.5);
      else if (/midriasis/.test(text)) expect(Math.min(l, r), sc.id).toBeGreaterThanOrEqual(4.5);
      else if (/anisokor/.test(text)) expect(Math.abs(l - r), sc.id).toBeGreaterThanOrEqual(1.5);
      else if (/isokor 3\/3/.test(text)) expect([l, r], sc.id).toEqual([3, 3]);
    }
  });
});
