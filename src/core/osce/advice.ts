/**
 * Saran non-farmakologi & KIE: aturan yang dipakai bersama penilaian stasiun OSCE dan
 * tab Tatalaksana mode praktik.
 */
import { matchesCondition, type ConditionContext } from '../conditions';
import type { AdviceOption, KieCategory } from './types';

export const KIE_LABEL: Record<KieCategory, string> = {
  diagnosis: 'Penjelasan penyakit',
  pengobatan: 'Pengobatan & kepatuhan',
  efek_samping: 'Efek samping obat',
  tanda_bahaya: 'Tanda bahaya (kapan segera kembali)',
  kontrol: 'Jadwal kontrol',
  pencegahan: 'Pencegahan',
};

/** Kategori KIE wajib bila kunci kasus tidak menyebutkannya. */
export const DEFAULT_KIE_REQUIRED: readonly KieCategory[] = ['diagnosis', 'pengobatan', 'tanda_bahaya', 'kontrol'];

/** Saran yang benar untuk kasus ini (memperhitungkan kondisi when/whenAny). */
export function adviceApplies(a: AdviceOption, ctx: ConditionContext): boolean {
  if (a.kind !== 'benar') return false;
  if (a.when && !matchesCondition(a.when, ctx)) return false;
  if (a.whenAny && !a.whenAny.some((w) => matchesCondition(w, ctx))) return false;
  return true;
}
