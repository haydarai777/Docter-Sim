/**
 * Pemahaman pertanyaan bebas (tanpa AI) untuk anamnesis.
 *
 * Langkah:
 *  1. Normalisasi bahasa sehari-hari (huruf kecil, tanda baca, singkatan & slang,
 *     akhiran -nya/-kah/-lah, kata ulang "pusing2").
 *  2. Cari semua kata kunci topik & gejala sebagai frasa utuh (batas kata).
 *  3. Pilih kecocokan TERPANJANG yang tidak tumpang-tindih — "keringat malam"
 *     menang atas "malam", "minum obat" menang atas "minum".
 *  4. Hasil: daftar maksud (intent) berurutan sesuai posisinya di kalimat.
 *
 * Modul ini murni (tanpa DOM) dan deterministik sehingga mudah diuji. Pasien AI
 * (lihat src/ui/ai) memakai daftar topik & gejala yang sama, jadi kedua jalur
 * menghasilkan intent yang setara.
 */
import type { GameContent } from './types';

export type Intent =
  | { kind: 'topic'; topic: string }
  | { kind: 'symptom'; symptom: string }
  /** Pertanyaan detail (onset, keparahan, ...) tentang gejala tertentu. */
  | { kind: 'symptom_detail'; topic: string; symptom: string }
  /** Tinjauan sistem: "BAB-nya bagaimana?" (beberapa gejala sekaligus). */
  | { kind: 'review'; group: string }
  | { kind: 'greeting' }
  | { kind: 'thanks' }
  /** Dokter meminta izin memeriksa / memberi tahu akan memeriksa. */
  | { kind: 'consent' };

export interface Interpretation {
  intents: Intent[];
  /** Teks setelah normalisasi (untuk debugging & tes). */
  normalized: string;
}

/** Topik yang bisa "ditempelkan" pada gejala tertentu (mis. "sejak kapan batuknya?"). */
export const DETAIL_TOPICS = new Set([
  'onset',
  'lokasi',
  'karakter',
  'durasi',
  'keparahan',
  'pola',
  'progresi',
  'pemberat_peringan',
]);

const SLANG: Record<string, string> = {
  udah: 'sudah',
  udh: 'sudah',
  sdh: 'sudah',
  dah: 'sudah',
  gak: 'tidak',
  ga: 'tidak',
  gk: 'tidak',
  nggak: 'tidak',
  ngga: 'tidak',
  enggak: 'tidak',
  engga: 'tidak',
  tdk: 'tidak',
  tak: 'tidak',
  ndak: 'tidak',
  brp: 'berapa',
  kpn: 'kapan',
  gmn: 'bagaimana',
  gimana: 'bagaimana',
  gmana: 'bagaimana',
  knp: 'kenapa',
  aja: 'saja',
  sm: 'sama',
  yg: 'yang',
  dgn: 'dengan',
  utk: 'untuk',
  tp: 'tapi',
  dr: 'dari',
  krn: 'karena',
  trs: 'terus',
  sblm: 'sebelum',
  sblmnya: 'sebelum',
  skrg: 'sekarang',
  bpk: 'bapak',
  dimana: 'di mana',
  kemana: 'ke mana',
  darimana: 'dari mana',
  kayak: 'seperti',
  kyk: 'seperti',
  kaya: 'seperti',
  pengen: 'ingin',
  pingin: 'ingin',
  ngerokok: 'merokok',
  ngopi: 'kopi',
};

const SUFFIXES = ['nya', 'kah', 'lah', 'pun'];
/** Kata yang kebetulan berakhiran mirip akhiran tetapi bukan berakhiran. */
const SUFFIX_EXCEPTIONS = new Set(['punya', 'tanya', 'bertanya', 'hanya', 'sanya', 'karenanya', 'olah', 'salah', 'sekolah', 'masalah', 'darah', 'murah', 'merah', 'arah', 'lelah', 'sudah', 'mudah', 'rumah', 'bawah', 'tengah', 'sebelah', 'telah', 'tanah', 'pecah', 'ubah', 'berubah', 'buah', 'nanah', 'entah', 'sakah', 'nikah', 'langkah', 'apakah', 'dahak', 'sepuluh']);

function stripSuffix(token: string): string {
  if (SUFFIX_EXCEPTIONS.has(token)) return token;
  for (const suffix of SUFFIXES) {
    if (token.length > suffix.length + 2 && token.endsWith(suffix)) return token.slice(0, -suffix.length);
  }
  return token;
}

/** Normalisasi teks Indonesia sehari-hari menjadi deret token sederhana. */
export function normalizeQuestion(text: string): string {
  const cleaned = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    // kata ulang dengan angka 2: "pusing2" → "pusing pusing"
    .replace(/([a-z]+)2\b/g, '$1 $1')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  if (!cleaned) return '';
  return cleaned
    .split(' ')
    .map((t) => SLANG[t] ?? t)
    .join(' ')
    .split(' ')
    .map(stripSuffix)
    // "BAB-nya" → "bab nya": akhiran yang terpisah dibuang.
    .filter((t) => !SUFFIXES.includes(t))
    .join(' ');
}

/** Sapaan yang sering muncul di pertanyaan dokter — tidak boleh menjadi kata kunci tunggal. */
export const ADDRESS_WORDS = new Set(['bapak', 'pak', 'ibu', 'bu', 'mas', 'mbak', 'dek', 'adek', 'dok', 'dokter', 'anda', 'kamu']);

interface Keyword {
  tokens: string[];
  intent:
    | { kind: 'topic'; topic: string }
    | { kind: 'symptom'; symptom: string }
    | { kind: 'review'; group: string }
    | { kind: 'greeting' | 'thanks' | 'consent' };
}

const GREETING_KEYWORDS = ['halo', 'hai', 'selamat pagi', 'selamat siang', 'selamat sore', 'selamat malam', 'assalamualaikum', 'permisi', 'silakan duduk', 'apa kabar'];
const THANKS_KEYWORDS = ['terima kasih', 'makasih', 'trima kasih', 'thanks'];
const CONSENT_KEYWORDS = ['saya periksa', 'boleh saya periksa', 'diperiksa dulu', 'periksa dulu', 'saya cek', 'kita periksa', 'saya ukur', 'saya tensi', 'berbaring dulu'];

/** Bangun indeks kata kunci dari konten (cache per objek konten). */
const indexCache = new WeakMap<GameContent, Keyword[]>();

function keywordIndex(content: GameContent): Keyword[] {
  const cached = indexCache.get(content);
  if (cached) return cached;
  const list: Keyword[] = [];
  const add = (phrase: string, intent: Keyword['intent']) => {
    const norm = normalizeQuestion(phrase);
    if (norm) list.push({ tokens: norm.split(' '), intent });
  };
  for (const cat of content.anamnesis) for (const k of cat.keywords) add(k, { kind: 'topic', topic: cat.id });
  for (const s of content.symptoms) for (const k of s.keywords) add(k, { kind: 'symptom', symptom: s.id });
  for (const r of content.reviews) for (const k of r.keywords) add(k, { kind: 'review', group: r.id });
  for (const k of GREETING_KEYWORDS) add(k, { kind: 'greeting' });
  for (const k of THANKS_KEYWORDS) add(k, { kind: 'thanks' });
  for (const k of CONSENT_KEYWORDS) add(k, { kind: 'consent' });
  indexCache.set(content, list);
  return list;
}

interface Match {
  start: number;
  end: number;
  intent: Keyword['intent'];
}

/**
 * Tafsirkan satu pertanyaan bebas.
 * @param maxIntents batas jumlah topik/gejala yang dijawab dari satu pertanyaan.
 */
export function interpretQuestion(text: string, content: GameContent, maxIntents = 3): Interpretation {
  const normalized = normalizeQuestion(text);
  const tokens = normalized ? normalized.split(' ') : [];
  const matches: Match[] = [];
  for (const kw of keywordIndex(content)) {
    const n = kw.tokens.length;
    for (let i = 0; i + n <= tokens.length; i++) {
      let ok = true;
      for (let j = 0; j < n; j++) {
        if (tokens[i + j] !== kw.tokens[j]) {
          ok = false;
          break;
        }
      }
      if (ok) matches.push({ start: i, end: i + n, intent: kw.intent });
    }
  }
  // Terpanjang dulu; seri → yang lebih awal. Ambil yang tidak tumpang-tindih.
  matches.sort((a, b) => b.end - b.start - (a.end - a.start) || a.start - b.start);
  const taken = new Array<boolean>(tokens.length).fill(false);
  const accepted: Match[] = [];
  for (const m of matches) {
    let free = true;
    for (let i = m.start; i < m.end; i++) if (taken[i]) free = false;
    if (!free) continue;
    for (let i = m.start; i < m.end; i++) taken[i] = true;
    accepted.push(m);
  }
  accepted.sort((a, b) => a.start - b.start);

  const topics: string[] = [];
  const symptoms: string[] = [];
  const reviews: string[] = [];
  let greeting = false;
  let thanks = false;
  let consent = false;
  for (const m of accepted) {
    const it = m.intent;
    if (it.kind === 'topic' && !topics.includes(it.topic)) topics.push(it.topic);
    else if (it.kind === 'symptom' && !symptoms.includes(it.symptom)) symptoms.push(it.symptom);
    else if (it.kind === 'review' && !reviews.includes(it.group)) reviews.push(it.group);
    else if (it.kind === 'greeting') greeting = true;
    else if (it.kind === 'thanks') thanks = true;
    else if (it.kind === 'consent') consent = true;
  }

  // "Di rumah ada yang batuk lama?" → pertanyaan tentang keluarga/kontak, bukan gejala pasien sendiri.
  if (topics.includes('riwayat_keluarga')) symptoms.length = 0;

  const intents: Intent[] = [];
  const detailTopics = topics.filter((t) => DETAIL_TOPICS.has(t));
  if (symptoms.length > 0 && detailTopics.length > 0) {
    // "Sejak kapan batuknya?" → detail gejala. Topik non-detail tetap dijawab terpisah.
    for (const s of symptoms) for (const t of detailTopics) intents.push({ kind: 'symptom_detail', topic: t, symptom: s });
    for (const t of topics.filter((x) => !DETAIL_TOPICS.has(x))) intents.push({ kind: 'topic', topic: t });
  } else {
    for (const t of topics) intents.push({ kind: 'topic', topic: t });
    for (const s of symptoms) intents.push({ kind: 'symptom', symptom: s });
  }
  // Tinjauan sistem: gejala yang sudah ditanyakan spesifik tidak perlu diulang.
  for (const g of reviews) intents.push({ kind: 'review', group: g });
  const limited = intents.slice(0, Math.max(1, maxIntents));
  if (limited.length === 0) {
    if (consent) limited.push({ kind: 'consent' });
    else if (thanks) limited.push({ kind: 'thanks' });
    else if (greeting) limited.push({ kind: 'greeting' });
  }
  return { intents: limited, normalized };
}
