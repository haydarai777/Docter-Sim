import type { Condition, Sex } from './types';

/**
 * Konteks yang tersedia saat mengevaluasi kondisi.
 * Field opsional diisi bertahap oleh generator (mis. `symptoms` baru ada
 * setelah gejala di-sample). Kondisi yang merujuk data yang belum ada
 * dianggap TIDAK terpenuhi, sehingga kesalahan urutan mudah terdeteksi.
 */
export interface ConditionContext {
  day: number;
  sex: Sex;
  age: number;
  occupationId: string;
  /** Kepribadian pasien (untuk variasi gaya jawaban). */
  personality?: string;
  traits: ReadonlySet<string>;
  symptoms?: ReadonlySet<string>;
}

/** true jika semua syarat pada `cond` terpenuhi. Kondisi kosong/undefined selalu true. */
export function matchesCondition(cond: Condition | undefined, ctx: ConditionContext): boolean {
  if (!cond) return true;
  if (cond.dayMin !== undefined && ctx.day < cond.dayMin) return false;
  if (cond.dayMax !== undefined && ctx.day > cond.dayMax) return false;
  if (cond.ageMin !== undefined && ctx.age < cond.ageMin) return false;
  if (cond.ageMax !== undefined && ctx.age > cond.ageMax) return false;
  if (cond.sex !== undefined && ctx.sex !== cond.sex) return false;
  if (cond.occupations && !cond.occupations.includes(ctx.occupationId)) return false;
  if (cond.personality && !(ctx.personality && cond.personality.includes(ctx.personality))) return false;
  if (cond.traits && !cond.traits.every((t) => ctx.traits.has(t))) return false;
  if (cond.notTraits && cond.notTraits.some((t) => ctx.traits.has(t))) return false;
  if (cond.symptoms) {
    if (!ctx.symptoms) return false;
    const present = ctx.symptoms;
    if (!cond.symptoms.every((s) => present.has(s))) return false;
  }
  if (cond.notSymptoms) {
    if (!ctx.symptoms) return false;
    const present = ctx.symptoms;
    if (cond.notSymptoms.some((s) => present.has(s))) return false;
  }
  return true;
}
