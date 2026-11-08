/** Label tampilan (Bahasa Indonesia) untuk nilai enum. */
import type { DangerLevel, EconomyClass, Sex, ToolCategory } from '../core/types';

export const SEX_LABEL: Record<Sex, string> = { male: 'Laki-laki', female: 'Perempuan' };

export const ECONOMY_LABEL: Record<EconomyClass, string> = {
  miskin: 'Ekonomi lemah',
  menengah: 'Ekonomi menengah',
  kaya: 'Ekonomi atas',
};

export const DANGER_LABEL: Record<DangerLevel, string> = {
  rendah: 'Bahaya rendah',
  sedang: 'Bahaya sedang',
  tinggi: 'Bahaya tinggi',
  kritis: 'Bahaya kritis',
};

export const CATEGORY_LABEL: Record<ToolCategory, string> = {
  fisik: 'Pemeriksaan fisik',
  lab: 'Laboratorium',
  penunjang: 'Penunjang',
};

export const FLAG_LABEL: Record<'H' | 'L' | '+', string> = {
  H: '↑ tinggi',
  L: '↓ rendah',
  '+': '• abnormal',
};
