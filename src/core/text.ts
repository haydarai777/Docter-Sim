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
 * Lama sakit dalam bahasa sehari-hari: 4 → "empat hari", 21 → "tiga minggu", 75 → "tiga bulan".
 */
export function durationText(days: number): string {
  if (days <= 1) return 'sehari';
  if (days < 14) return `${numberToWords(days)} hari`;
  if (days < 60) return `${numberToWords(Math.round(days / 7))} minggu`;
  if (days < 330) return `${numberToWords(Math.round(days / 30))} bulan`;
  const years = Math.round(days / 365);
  return years <= 1 ? 'setahun' : `${numberToWords(years)} tahun`;
}

/**
 * Hari sakit pertama ({hari} = 1): "{LamaSakit} lalu" → "Tadi", "Sudah {lamaSakit}" → "Sejak tadi", agar
 * selaras dengan detail gejala ("baru tadi, belum sampai sehari") dan tidak berbunyi "Sehari lalu …".
 */
const FIRST_DAY_REWRITES: readonly [RegExp, string][] = [
  [/\{hariTeks\} hari/g, '{lamaSakit}'],
  [/\{HariTeks\} hari/g, '{LamaSakit}'],
  [/\b([Ss])(?:udah|ekitar) (?:sekitar )?\{lamaSakit\}(?: (?:ini|lebih|(?:yang )?lalu))?/g, '$1ejak tadi'],
  [/\b([Bb])aru \{lamaSakit\}/g, '$1aru tadi'],
  [/\{LamaSakit\} (?:yang )?lalu/g, 'Tadi'],
  [/\{lamaSakit\} (?:yang )?lalu/g, 'tadi'],
  [/\{LamaSakit\} ini/g, 'Hari ini'],
  [/\{lamaSakit\} ini/g, 'hari ini'],
];

function firstDayPhrasing(template: string): string {
  return FIRST_DAY_REWRITES.reduce((t, [rx, rep]) => t.replace(rx, rep), template);
}

/**
 * Isi placeholder {nama} pada template. Placeholder dengan huruf pertama
 * kapital ({Keluhan}) diisi nilai yang huruf pertamanya dikapitalkan.
 * Placeholder yang tidak dikenal dibiarkan apa adanya (dideteksi oleh tes konten).
 */
export function fillTemplate(template: string, values: Readonly<Record<string, string>>): string {
  if (values.hari === '1' && /\{(?:[Ll]amaSakit|[Hh]ariTeks)\}/.test(template)) template = firstDayPhrasing(template);
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

/** Kata sebelum "saya" yang menandakan "saya" adalah SUBJEK kalimat (→ "dia"), bukan pemilik ("badan saya" → "badannya"). */
const SUBJECT_CUES = new Set([
  'dan', 'tapi', 'tetapi', 'terus', 'lalu', 'kalau', 'kalo', 'waktu', 'pas', 'saat', 'karena', 'soalnya', 'jadi', 'sampai', 'sampe',
  'kadang', 'kadang-kadang', 'juga', 'sudah', 'udah', 'masih', 'belum', 'yang', 'kok', 'eh', 'oh', 'iya', 'ya', 'nah', 'dok', 'dokter',
  'hari', 'minggu', 'bulan', 'tahun', 'malam', 'pagi', 'siang', 'sore', 'ini', 'itu', 'sekarang', 'kemarin', 'tadi', 'dulu', 'habis',
  'setelah', 'sebelum', 'begitu', 'makanya', 'katanya', 'mungkin', 'kayaknya', 'sepertinya', 'cuma', 'hanya', 'sering', 'jarang',
  'tiap', 'setiap', 'baru', 'langsung', 'lagi', 'pun', 'kemudian', 'sehingga', 'agar', 'supaya', 'biar', 'padahal', 'walaupun',
]);
/** Kata depan/kerja sebelum "saya" sebagai objek (→ "dia"). */
const OBJECT_CUES = new Set(['sama', 'dengan', 'untuk', 'buat', 'ke', 'dari', 'pada', 'bagi', 'kepada', 'oleh', 'bikin', 'membuat', 'bilang']);

/**
 * Ubah kalimat sudut pandang pasien ("Badan saya panas", "Saya batuk") menjadi sudut pandang
 * pengantar yang membicarakan anaknya ("Badannya panas", "Dia batuk"). "{saya}" (placeholder)
 * dan "anak saya" tidak diubah — dipakai bila kalimat memang tentang si pengantar.
 */
export function toCompanionVoice(text: string): string {
  return text.replace(/(\S+)?(\s*)(?<![{\w])(saya|aku)(?![}\w])/gi, (match, prev: string | undefined, space: string, pronoun: string) => {
    const upper = pronoun[0] === pronoun[0]!.toUpperCase();
    if (prev === undefined || /[.,!?…:;"“(—-]$/.test(prev)) return `${prev ?? ''}${space}${upper ? 'Dia' : 'dia'}`;
    const word = prev.toLowerCase();
    if (word === 'anak' || prev.includes('{')) return match;
    if (SUBJECT_CUES.has(word) || OBJECT_CUES.has(word)) return `${prev}${space}dia`;
    return /^[A-Z0-9]+$/.test(prev) ? `${prev}-nya` : `${prev}nya`;
  });
}

/** Usia untuk ditampilkan: "35 tahun", atau untuk bayi "8 bulan"/"12 hari". */
export function ageText(age: number, infant?: { unit: 'hari' | 'bulan'; value: number }): string {
  if (age === 0 && infant) return `${infant.value} ${infant.unit}`;
  return `${age} tahun`;
}

/** Usia pasien untuk ditampilkan (kasus lama tanpa ageText: "{age} tahun"). */
export function patientAgeText(p: { age: number; ageText?: string }): string {
  return p.ageText ?? `${p.age} tahun`;
}

/**
 * Angka dari isian pemain: menerima koma desimal Indonesia ("0,5") maupun titik ("0.5").
 * Mengembalikan null bila bukan angka (mis. "abc", "", "1,2,3") — jangan diam-diam diganti angka lain.
 */
export function parseDecimal(text: string): number | null {
  const t = text.trim().replace(/\s+/g, '').replace(',', '.');
  if (!/^(\d+(\.\d*)?|\.\d+)$/.test(t)) return null;
  const v = Number(t);
  return Number.isFinite(v) ? v : null;
}

/** Angka untuk ditampilkan di kolom isian (koma desimal). */
export function formatDecimalInput(value: number): string {
  return String(Math.round(value * 1000) / 1000).replace('.', ',');
}
