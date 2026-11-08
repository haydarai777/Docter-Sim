/**
 * Utilitas teks & format angka gaya Indonesia.
 * Ditulis manual (bukan Intl) agar hasil identik di semua browser dan di tes.
 */

/** Format angka: pemisah ribuan "." dan desimal ",". Contoh: 85000 → "85.000", 38.6 → "38,6". */
export function formatNumber(value: number, decimals = 0): string {
  const negative = value < 0;
  const fixed = Math.abs(value).toFixed(decimals);
  const [intPart, fracPart] = fixed.split('.');
  const withSep = intPart!.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (negative ? '-' : '') + withSep + (fracPart ? `,${fracPart}` : '');
}

/** Format Rupiah. Contoh: 150000 → "Rp150.000". */
export function formatRupiah(value: number): string {
  return `Rp${formatNumber(Math.round(value))}`;
}

/** Huruf pertama kapital. */
export function capitalize(text: string): string {
  return text.length === 0 ? text : text[0]!.toUpperCase() + text.slice(1);
}

/** Gabung daftar: ["a"] → "a"; ["a","b"] → "a dan b"; ["a","b","c"] → "a, b, dan c". */
export function joinList(items: readonly string[], conjunction = 'dan'): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0]!;
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, ${conjunction} ${items[items.length - 1]}`;
}

const NUMBER_WORDS = [
  'nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan',
  'sepuluh', 'sebelas',
];

/** Angka → kata (0–99). Di luar rentang itu dikembalikan sebagai digit. */
export function numberToWords(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 99) return String(n);
  if (n < 12) return NUMBER_WORDS[n]!;
  if (n < 20) return `${NUMBER_WORDS[n - 10]} belas`;
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  const tensWord = tens === 1 ? 'sepuluh' : `${NUMBER_WORDS[tens]} puluh`;
  return ones === 0 ? tensWord : `${tensWord} ${NUMBER_WORDS[ones]}`;
}

/**
 * Isi placeholder {nama} pada template. Placeholder dengan huruf pertama
 * kapital ({Keluhan}) diisi nilai yang huruf pertamanya dikapitalkan.
 * Placeholder yang tidak dikenal dibiarkan apa adanya (dideteksi oleh tes konten).
 */
export function fillTemplate(template: string, values: Readonly<Record<string, string>>): string {
  return template.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, (match, key: string) => {
    if (key in values) return values[key]!;
    const lower = key[0]!.toLowerCase() + key.slice(1);
    if (key !== lower && lower in values) return capitalize(values[lower]!);
    return match;
  });
}

/** Cari placeholder yang belum terisi (untuk validasi). */
export function findUnfilledPlaceholders(text: string): string[] {
  return [...text.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map((m) => m[1]!);
}

/** Normalisasi untuk pencarian: huruf kecil, tanpa diakritik/tanda baca berlebih. */
export function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
