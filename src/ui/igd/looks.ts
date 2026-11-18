/**
 * Penampilan 3D orang-orang di IGD: pasien (dari usia, jenis kelamin, berat badan), keluarga
 * pengantar, perawat (baju jaga/scrub), paramedis ambulans, dan petugas. Deterministik per seed,
 * memakai aturan penampilan yang sama dengan pasien poliklinik (warna kulit, rambut, hijab).
 */
import { ageGroupOf, type PatientAppearance } from '../../core/appearance';
import type { EdPatient } from '../../core/igd/types';
import { createRng, deriveSeed } from '../../core/rng';
import { ED_SCENARIOS_BY_ID } from '../../data/igd';
import type { GameContent, Sex } from '../../core/types';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Perkiraan tinggi badan menurut usia (cm). */
export function heightFor(age: number, sex: Sex, r: number): number {
  if (age < 1) return 68 + r * 6;
  if (age < 2) return 78 + r * 6;
  if (age <= 12) return 77 + 6.1 * age + (r - 0.5) * 8;
  if (age < 18) return sex === 'male' ? 150 + (age - 12) * 3.8 + (r - 0.5) * 8 : 148 + (age - 12) * 1.8 + (r - 0.5) * 7;
  const base = sex === 'male' ? 158 + r * 16 : 147 + r * 14;
  return age >= 65 ? base - 3 : base;
}

function baseLook(content: GameContent, seed: number, sex: Sex, age: number, weightKg: number | null): PatientAppearance {
  const rules = content.appearance;
  const rng = createRng(seed);
  const ageGroup = ageGroupOf(age);
  const heightCm = Math.round(heightFor(age, sex, rng.next()));
  const m = heightCm / 100;
  const bmi = clamp(weightKg ? weightKg / (m * m) : age < 13 ? 16 : rng.float(19.5, 27), 11, 42);
  const [lo, hi] = age < 13 ? [13.5, 18] : [18.5, 22.9];
  const build = bmi < lo ? -clamp((lo - bmi) / 3, 0.25, 1) : bmi > hi ? clamp((bmi - hi) / 8, 0.1, 1) : ((bmi - lo) / (hi - lo) - 0.5) * 0.3;
  const skinTone = rng.weighted(rules.skinTones, (t) => t.weight).color;
  const hairPool = age >= 58 ? rules.hairColors.lansia : age >= 42 ? rules.hairColors.paruh_baya : rules.hairColors.muda;
  const hairColor = rng.weighted(hairPool, (h) => h.weight).color;
  const hairStyle = rng.pick(rules.hairStyles[sex][ageGroup]);
  const hijab = sex === 'female' && rng.chance(rules.hijabRate[ageGroup]) ? rng.pick(rules.hijabColors) : null;
  const glasses = rng.chance(rules.glassesRate[ageGroup]);
  const roll = rng.next();
  const facialHair: PatientAppearance['facialHair'] = sex === 'male' && age >= 24 ? (roll < 0.2 ? 'kumis' : roll < 0.3 ? 'janggut' : 'none') : 'none';
  return {
    sex,
    age,
    ageGroup,
    heightCm,
    bmi,
    build,
    skinTone,
    hairColor,
    hairStyle,
    hijab,
    glasses,
    facialHair,
    outfit: {
      top: rng.pick(rules.topColors),
      bottom: rng.pick(rules.bottomColors),
      sleeves: hijab || rng.chance(0.3) ? 'panjang' : 'pendek',
      footwear: rng.chance(0.45) ? 'sandal' : 'sepatu',
    },
    breathsPerMinute: 16,
    cues: {},
    hold: null,
    side: 'kanan',
    emotion: 'tenang',
    personalityId: 'kooperatif',
    talkRate: 15,
    walkSpeed: ageGroup === 'lansia' ? 0.85 : ageGroup === 'anak' ? 1.0 : 1.12,
    observations: [],
  };
}

/** Pasien IGD (penampilan dasar; isyarat klinis diperbarui adegan dari fisiologi). */
export function patientLook(p: EdPatient, content: GameContent, seed: number): PatientAppearance {
  const look = baseLook(content, deriveSeed(seed, `pasien-${p.id}`), p.sex, p.age, p.weightKg);
  look.emotion = 'cemas';
  // Cedera yang terlihat dari skenario (luka, memar, luka bakar, perdarahan) + isyarat terkait.
  const inj = ED_SCENARIOS_BY_ID.get(p.scenarioId)?.injuries ?? null;
  look.injuries = inj;
  if (inj?.cues?.kuning) look.cues.kuning = inj.cues.kuning;
  if (inj?.cues?.pucat) look.cues.pucat = inj.cues.pucat;
  look.walkSpeed *= p.arrivalMode === 'dipapah' ? 0.62 : 0.85;
  if (p.arrivalMode === 'jalan' && p.age >= 65) look.walkSpeed *= 0.9;
  return look;
}

/** Keluarga pengantar (dewasa sehat, wajah cemas). */
export function familyLook(p: EdPatient, content: GameContent, seed: number): PatientAppearance {
  const rng = createRng(deriveSeed(seed, `keluarga-${p.id}`));
  // Anak → orang tua; dewasa → pasangan/anak; lansia → anak dewasa.
  const age = p.age < 18 ? rng.int(26, 44) : p.age >= 60 ? rng.int(30, 50) : rng.int(Math.max(20, p.age - 8), p.age + 6);
  const sex: Sex = p.age < 12 ? (rng.chance(0.7) ? 'female' : 'male') : p.sex === 'male' ? (rng.chance(0.7) ? 'female' : 'male') : rng.chance(0.6) ? 'male' : 'female';
  const look = baseLook(content, deriveSeed(seed, `keluarga-look-${p.id}`), sex, age, null);
  look.emotion = 'cemas';
  look.walkSpeed = 1.0;
  return look;
}

export type StaffRole = 'perawat' | 'paramedis' | 'petugas';

const NURSE_SEX: Record<string, Sex> = { 'Ners Rina': 'female', 'Ners Dimas': 'male', 'Ners Sari': 'female', 'Ners Yoga': 'male' };

/** Petugas IGD: perawat (scrub), paramedis ambulans (seragam oranye), petugas (porter). */
export function staffLook(role: StaffRole, name: string, content: GameContent, seed: number): PatientAppearance {
  const rng = createRng(deriveSeed(seed, `staf-${role}-${name}`));
  const sex: Sex = NURSE_SEX[name] ?? (rng.chance(role === 'perawat' ? 0.6 : 0.25) ? 'female' : 'male');
  const look = baseLook(content, deriveSeed(seed, `staf-look-${name}`), sex, rng.int(24, 46), null);
  look.glasses = rng.chance(0.15);
  look.build = clamp(look.build, -0.3, 0.35);
  look.emotion = 'tenang';
  look.personalityId = 'tenang';
  look.walkSpeed = role === 'perawat' ? 1.35 : 1.2;
  if (role === 'perawat') {
    const scrub = rng.pick(['#3d8f9a', '#4f79b8', '#5f8f6f']);
    look.outfit = { top: scrub, bottom: scrub, sleeves: 'pendek', footwear: 'sepatu', collar: false, tucked: false };
    if (sex === 'female') {
      look.hijab = rng.chance(0.75) ? rng.pick(['#f1f1ee', scrub, '#2f3b52']) : null;
      if (look.hijab) look.outfit.sleeves = 'panjang';
    }
  } else if (role === 'paramedis') {
    look.outfit = { top: '#e3702c', bottom: '#2b3445', sleeves: 'pendek', footwear: 'sepatu', collar: true, tucked: true };
    if (sex === 'female') look.hijab = rng.chance(0.6) ? '#2b3445' : null;
    if (look.hijab) look.outfit.sleeves = 'panjang';
  } else {
    look.outfit = { top: '#7c8a96', bottom: '#2c3440', sleeves: 'pendek', footwear: 'sepatu', collar: true };
  }
  return look;
}

/** Penampilan sederhana untuk pratinjau (halaman pengembang & tes visual luka). */
export function previewLook(content: GameContent, seed: number, sex: Sex, age: number, weightKg: number): PatientAppearance {
  return baseLook(content, seed, sex, age, weightKg);
}
