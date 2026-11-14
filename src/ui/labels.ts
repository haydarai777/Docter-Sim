/** Label tampilan (Bahasa Indonesia) untuk nilai enum. */
import type { CatalogEntry, DangerLevel, DdxStatus, EconomyClass, Objective, Sex, ToolCategory } from '../core/types';

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
  pencitraan: 'Pencitraan',
  lainnya: 'Penunjang lain',
};

export const PHYSICAL_GROUP_LABEL: Record<string, string> = {
  umum: 'Umum',
  kepala_leher: 'Kepala & leher',
  thorax: 'Thorax',
  abdomen: 'Abdomen',
  ekstremitas: 'Ekstremitas & kulit',
  khusus: 'Pemeriksaan khusus',
};

export const OBJECTIVE_LABEL: Record<Objective, string> = {
  identifikasi: 'Identifikasi penyakit',
  fungsi_organ: 'Fungsi organ',
  struktur: 'Struktur/anatomi',
  komplikasi: 'Komplikasi',
  skrining: 'Skrining/faktor risiko',
};

export const DDX_STATUS_LABEL: Record<DdxStatus, string> = {
  utama: 'Diagnosis kerja',
  mungkin: 'Dipertimbangkan',
  disingkirkan: 'Disingkirkan',
};

export const CATALOG_KIND_LABEL: Record<CatalogEntry['kind'], string> = {
  penyakit: 'Penyakit',
  komorbiditas: 'Komorbiditas',
  insidental: 'Temuan insidental',
  banding: 'Diagnosis banding',
};

export const FLAG_LABEL: Record<'H' | 'L' | '+', string> = {
  H: '↑ tinggi',
  L: '↓ rendah',
  '+': '• abnormal',
};
