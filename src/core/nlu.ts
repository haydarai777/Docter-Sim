/**
 * Pemahaman pertanyaan bebas (tanpa AI) untuk anamnesis — mode offline, tanpa kuota.
 *
 * Langkah:
 *  1. Normalisasi bahasa sehari-hari: huruf kecil, tanda baca, huruf yang diulang ("sakiiit"),
 *     kata ulang ("muntah-muntah", "pusing2"), singkatan & bahasa gaul ("brp", "skt", "dmn"),
 *     partikel (-nya/-kah/-lah/-pun).
 *  2. Kanonisasi kata yang bukan kata kunci, dengan kosakata permainan sebagai pagar:
 *       a. pemotongan imbuhan ("berdarah" → "darah", "dimuntahkan" → "muntah", "gemetaran" → "gemetar");
 *       b. kata tergabung ("sakitkepala" → "sakit kepala");
 *       c. koreksi salah ketik HANYA untuk kata yang tidak dikenal sama sekali ("demem" → "demam",
 *          "btuk" → "batuk") — kata Indonesia yang sah tidak pernah "dikoreksi" (mis. "batu").
 *  3. Pertanyaan dipecah per klausa (tanda tanya/titik). Dalam tiap klausa, semua kata kunci topik &
 *     gejala dicari sebagai frasa; frasa boleh disisipi satu kata pengisi ("dada TERASA berat",
 *     "gusi SUKA berdarah", "muntah ADA darah").
 *  4. Dipilih kecocokan paling spesifik yang tidak tumpang-tindih, lalu aturan konteks:
 *     pertanyaan tentang keluarga, nama obat ("obat batuk" bukan gejala batuk), tinjauan umum vs
 *     gejala spesifik, durasi ("sudah 3 hari?"), aba-aba pemeriksaan, permintaan mengulang.
 *
 * Modul ini murni (tanpa DOM) dan deterministik sehingga mudah diuji. Pasien AI (lihat src/ui/ai)
 * memakai daftar topik & gejala yang sama, jadi kedua jalur menghasilkan intent yang setara.
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
  | { kind: 'consent' }
  /** Dokter meminta pasien mengulang jawaban terakhir. */
  | { kind: 'repeat' };

export interface Interpretation {
  intents: Intent[];
  /** Teks setelah normalisasi (untuk debugging & tes). */
  normalized: string;
  /** Lama sakit yang disebut dokter ("sudah 3 hari?"), dalam hari — untuk dikonfirmasi pasien. */
  durationDays?: number;
  /** Dokter merujuk hal yang baru dibicarakan ("yang tadi itu", "itu sejak kapan?"). */
  deictic: boolean;
}

/** Topik yang bisa "ditempelkan" pada gejala tertentu (mis. "sejak kapan batuknya?"). */
export const DETAIL_TOPICS = new Set(['onset', 'lokasi', 'karakter', 'durasi', 'keparahan', 'pola', 'progresi', 'pemberat_peringan']);

const SLANG: Record<string, string> = {
  udah: 'sudah',
  udh: 'sudah',
  sdh: 'sudah',
  dah: 'sudah',
  gak: 'tidak',
  ga: 'tidak',
  gk: 'tidak',
  ngk: 'tidak',
  nggak: 'tidak',
  ngga: 'tidak',
  enggak: 'tidak',
  engga: 'tidak',
  tdk: 'tidak',
  tak: 'tidak',
  ndak: 'tidak',
  kagak: 'tidak',
  blm: 'belum',
  blum: 'belum',
  brp: 'berapa',
  brapa: 'berapa',
  kpn: 'kapan',
  gmn: 'bagaimana',
  gimana: 'bagaimana',
  gmana: 'bagaimana',
  bgmn: 'bagaimana',
  knp: 'kenapa',
  napa: 'kenapa',
  aja: 'saja',
  aj: 'saja',
  sm: 'sama',
  ama: 'sama',
  yg: 'yang',
  dgn: 'dengan',
  dg: 'dengan',
  utk: 'untuk',
  tp: 'tapi',
  tpi: 'tapi',
  dr: 'dari',
  krn: 'karena',
  karna: 'karena',
  trs: 'terus',
  trus: 'terus',
  sblm: 'sebelum',
  sblmnya: 'sebelum',
  skrg: 'sekarang',
  skrng: 'sekarang',
  bpk: 'bapak',
  dimana: 'di mana',
  dmn: 'di mana',
  dmana: 'di mana',
  kemana: 'ke mana',
  kmn: 'ke mana',
  darimana: 'dari mana',
  kayak: 'seperti',
  kyk: 'seperti',
  kek: 'seperti',
  kaya: 'seperti',
  spt: 'seperti',
  pengen: 'ingin',
  pingin: 'ingin',
  pgn: 'ingin',
  ngerokok: 'merokok',
  ngopi: 'kopi',
  skt: 'sakit',
  sakt: 'sakit',
  kmrn: 'kemarin',
  kemaren: 'kemarin',
  td: 'tadi',
  msh: 'masih',
  jg: 'juga',
  sy: 'saya',
  aku: 'saya',
  gw: 'saya',
  gue: 'saya',
  bgt: 'sekali',
  banget: 'sekali',
  bngt: 'sekali',
  klo: 'kalau',
  kalo: 'kalau',
  kl: 'kalau',
  pny: 'punya',
  pnya: 'punya',
  hr: 'hari',
  mgg: 'minggu',
  bln: 'bulan',
  thn: 'tahun',
  lg: 'lagi',
  bs: 'bisa',
  bsa: 'bisa',
  emg: 'memang',
  emang: 'memang',
  dlm: 'dalam',
  pd: 'pada',
  ok: 'oke',
  okey: 'oke',
  kencingnya: 'kencing',
  mencretnya: 'mencret',
  pipisnya: 'pipis',
};

/** Frasa gaul berkata lebih dari satu (diterapkan setelah SLANG per kata). */
const PHRASE_SLANG: [RegExp, string][] = [
  [/\bterus terusan\b/g, 'terus menerus'],
  [/\bterus\s?terusan\b/g, 'terus menerus'],
  [/\bnggak enak badan\b/g, 'tidak enak badan'],
];

const SUFFIXES = ['nya', 'kah', 'lah', 'pun'];
/** Kata yang kebetulan berakhiran mirip akhiran tetapi bukan berakhiran. */
const SUFFIX_EXCEPTIONS = new Set(['punya', 'tanya', 'bertanya', 'hanya', 'sanya', 'karenanya', 'olah', 'salah', 'sekolah', 'masalah', 'darah', 'murah', 'merah', 'arah', 'lelah', 'sudah', 'mudah', 'rumah', 'bawah', 'tengah', 'sebelah', 'telah', 'tanah', 'pecah', 'ubah', 'berubah', 'buah', 'nanah', 'entah', 'sakah', 'nikah', 'langkah', 'apakah', 'dahak', 'sepuluh', 'jumlah']);

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
    // huruf yang diulang-ulang untuk penekanan: "sakiiit" → "sakit"
    .replace(/([a-z])\1{2,}/g, '$1')
    .trim();
  if (!cleaned) return '';
  let joined = cleaned
    .split(' ')
    .map((t) => SLANG[t] ?? t)
    .join(' ');
  for (const [pattern, replacement] of PHRASE_SLANG) joined = joined.replace(pattern, replacement);
  const tokens = joined
    .split(' ')
    .map(stripSuffix)
    // "BAB-nya" → "bab nya": akhiran yang terpisah dibuang.
    .filter((t) => !SUFFIXES.includes(t));
  // Kata ulang ("muntah muntah", "batuk-batuk") cukup satu.
  return tokens.filter((t, i) => t !== tokens[i - 1]).join(' ');
}

/** Sapaan yang sering muncul di pertanyaan dokter — tidak boleh menjadi kata kunci tunggal. */
export const ADDRESS_WORDS = new Set(['bapak', 'pak', 'ibu', 'bu', 'mas', 'mbak', 'dek', 'adek', 'dok', 'dokter', 'anda', 'kamu']);

// ---------------------------------------------------------------------------
// Kata kunci & kosakata
// ---------------------------------------------------------------------------

type KeywordIntent =
  | { kind: 'topic'; topic: string }
  | { kind: 'symptom'; symptom: string }
  | { kind: 'review'; group: string; weak: boolean }
  | { kind: 'greeting' | 'thanks' | 'consent' | 'repeat' };

interface Keyword {
  tokens: string[];
  intent: KeywordIntent;
  /** Frasa kunci ternormalisasi (untuk aturan konteks). */
  phrase: string;
}

const GREETING_KEYWORDS = ['halo', 'hai', 'selamat pagi', 'selamat siang', 'selamat sore', 'selamat malam', 'assalamualaikum', 'permisi', 'silakan duduk', 'apa kabar', 'kenalkan saya'];
const THANKS_KEYWORDS = ['terima kasih', 'makasih', 'trima kasih', 'thanks', 'matur nuwun'];
const CONSENT_KEYWORDS = [
  'saya periksa',
  'boleh saya periksa',
  'diperiksa dulu',
  'periksa dulu',
  'saya cek',
  'kita periksa',
  'saya ukur',
  'saya tensi',
  'berbaring dulu',
  'silakan berbaring',
  'silakan baring',
  'silakan tiduran',
  'mohon berbaring',
  'tolong berbaring',
  'berbaring ya',
  'coba berbaring',
  'berbaring di sini',
  'mari saya periksa',
  'izin periksa',
  'saya akan periksa',
  'saya mau periksa',
];
const REPEAT_KEYWORDS = ['diulang', 'ulangi', 'diulangi', 'apa tadi', 'tadi apa', 'bilang apa', 'tadi bilang apa', 'kurang dengar', 'tidak dengar', 'kurang jelas', 'sekali lagi', 'tadi bagaimana', 'bagaimana tadi', 'hah', 'maaf apa'];
/** Klausa satu kata yang berarti "apa? (tolong ulangi)". */
const BARE_REPEAT = new Set(['apa', 'hah', 'ha', 'hm', 'hmm', 'eh']);
/** Salam waktu tanpa "selamat" ("Pagi, Bu"). */
const TIME_GREETINGS = new Set(['pagi', 'siang', 'sore', 'malam']);

/**
 * Kata tanya anamnesis. Kalimat izin/aba-aba pemeriksaan TANPA kata tanya ("Silakan berbaring,
 * saya periksa dulu ya.") bukan pertanyaan riwayat, walau memuat kata kunci seperti "berbaring".
 */
const QUESTION_WORDS = /\b(ada|apakah|apa|kapan|sejak|berapa|bagaimana|kenapa|mengapa|pernah|mana|masih|sering|kah)\b/;

/** Kata pengisi yang boleh menyisip di antara kata-kata sebuah frasa kunci. */
const FILLERS = new Set(['terasa', 'rasanya', 'rasa', 'agak', 'sedikit', 'saya', 'yang', 'seperti', 'sering', 'suka', 'terus', 'jadi', 'sangat', 'sekali', 'kok', 'lagi', 'juga', 'ada', 'ke', 'di', 'kalau', 'pas', 'saat', 'waktu', 'masih', 'keluar', 'sakit', 'nyeri', 'merasa', 'berwarna', 'warna', 'bapak', 'ibu', 'mas', 'mbak', 'dek', 'pak', 'bu']);

/**
 * Kata umum bahasa Indonesia yang sah. Kata yang dikenal (di sini atau di teks konten permainan)
 * tidak pernah "dikoreksi" sebagai salah ketik.
 */
const COMMON_WORDS =
  'ada adalah agak akan aku apa apakah atau atas awal bagaimana bagian baik baru bawah begitu belakang belum benar berapa besar betul bila biasa biasanya bisa boleh bukan buat cara cari cepat coba cuma dalam dan dapat dari datang dekat dengan depan di dia dia diri dok dokter dong dua dulu entah gitu hal hanya hari harus hingga ini itu iya ja jadi jangan jauh juga kalau kali kami kamu kan kapan karena kata ke kecil kemarin kenapa kepada kira kok kurang lagi lah lain lalu lama lebih lewat loh lumayan maaf macam mah mana masih mau memang mengapa menurut mereka misal mulai mungkin nah nanti nih nya oh oke pada paling pernah pula pun pusat rasa sampai sana saat saja sama sangat satu saya sebelum sedang sedikit sekali sekarang selalu sementara semua sendiri seperti sering setelah siapa sih silakan sini situ suatu sudah supaya tadi tahu tapi tentu terus tetapi tiap tidak toh ujar untuk wah waktu ya yah yang ' +
  // kata umum sehari-hari (dijaga agar tidak "dikoreksi" menjadi istilah medis)
  'kesehatan kesempatan kesalahan kesulitan kesimpulan keadaan kejadian kegiatan keperluan kepentingan kebetulan kemungkinan kenyataan keterangan informasi penjelasan pertanyaan jawaban ' +
  'mobil motor sepeda bus kereta pesawat kapal jalan jalanan parkir macet kantor pasar toko warung sekolah kampus masjid gereja rumah kamar dapur halaman kota desa ' +
  'cuaca cerah mendung hujan angin gerah dingin sejuk bola nonton film televisi musik lagu main game ponsel telepon pesan uang bayar harga mahal murah gratis ' +
  'pagi siang sore malam hari minggu bulan tahun jam menit detik besok lusa tanggal libur cuti ' +
  'anak cucu istri suami teman tetangga keluarga orang kakek nenek paman bibi pacar bos atasan rekan ' +
  'pergi pulang berangkat duduk berdiri buka tutup lihat dengar bicara bilang cerita tanya jawab kenal ingat lupa pikir pakai ambil beli jual bawa kasih beri minta tunggu belajar lari naik turun masuk ' +
  'periksa pemeriksaan resep perawat bidan puskesmas klinik apotek suntik infus tensi lab tes hasil kontrol rujuk ' +
  'tolong mohon permisi selamat kabar senang sedih takut khawatir bingung capek ngantuk lapar haus ' +
  'nama umur usia alamat kerja pekerjaan sibuk menikah cerai janda duda hamil haid anaknya ' +
  'kucing anjing ayam bebek burung ikan sapi kambing kuda tikus hewan peliharaan bunga pohon kebun sawah';

interface Lexicon {
  keywords: Keyword[];
  byFirst: Map<string, Keyword[]>;
  /** Token yang muncul di kata kunci (target kanonisasi). */
  vocab: Set<string>;
  /** Semua kata yang sah (kosakata + teks konten + kata umum). */
  known: Set<string>;
  /** Kosakata dikelompokkan per huruf awal untuk koreksi salah ketik. */
  vocabByInitial: Map<string, string[]>;
  /** Gejala per kelompok tinjauan sistem. */
  reviewSymptoms: Map<string, Set<string>>;
  /** Bentuk dasar/tanpa awalan → kata kosakata berimbuhan ("rasakan" → "dirasakan"). */
  rootIndex: Map<string, string>;
}

const lexiconCache = new WeakMap<GameContent, Lexicon>();

function collectStrings(value: unknown, out: Set<string>, depth = 0): void {
  if (depth > 12 || value === null || value === undefined) return;
  if (typeof value === 'string') {
    for (const t of normalizeQuestion(value).split(' ')) if (t) out.add(t);
  } else if (Array.isArray(value)) {
    for (const v of value) collectStrings(v, out, depth + 1);
  } else if (value instanceof Map) {
    // Indeks Map hanya salinan; isi aslinya sudah ada di daftar.
  } else if (typeof value === 'object') {
    for (const v of Object.values(value as Record<string, unknown>)) collectStrings(v, out, depth + 1);
  }
}

/** Bangun indeks kata kunci & kosakata dari konten (cache per objek konten). */
function lexicon(content: GameContent): Lexicon {
  const cached = lexiconCache.get(content);
  if (cached) return cached;
  const keywords: Keyword[] = [];
  const add = (phrase: string, intent: KeywordIntent) => {
    const norm = normalizeQuestion(phrase);
    if (norm) keywords.push({ tokens: norm.split(' '), intent, phrase: norm });
  };
  for (const cat of content.anamnesis) for (const k of cat.keywords) add(k, { kind: 'topic', topic: cat.id });
  for (const s of content.symptoms) for (const k of s.keywords) add(k, { kind: 'symptom', symptom: s.id });
  for (const r of content.reviews) for (const k of r.keywords) add(k, { kind: 'review', group: r.id, weak: !!r.weak });
  for (const k of GREETING_KEYWORDS) add(k, { kind: 'greeting' });
  for (const k of THANKS_KEYWORDS) add(k, { kind: 'thanks' });
  for (const k of CONSENT_KEYWORDS) add(k, { kind: 'consent' });
  for (const k of REPEAT_KEYWORDS) add(k, { kind: 'repeat' });

  const vocab = new Set<string>();
  const byFirst = new Map<string, Keyword[]>();
  for (const kw of keywords) {
    for (const t of kw.tokens) vocab.add(t);
    const list = byFirst.get(kw.tokens[0]!) ?? [];
    list.push(kw);
    byFirst.set(kw.tokens[0]!, list);
  }
  const known = new Set<string>(vocab);
  for (const w of COMMON_WORDS.split(' ')) known.add(w);
  for (const v of Object.values(SLANG)) for (const w of v.split(' ')) known.add(w);
  collectStrings(
    [content.anamnesis, content.symptoms, content.reviews, content.tools, content.diseases, content.comorbidities, content.incidentals, content.conditions, content.personalities, content.population, content.conversation],
    known,
  );
  const vocabByInitial = new Map<string, string[]>();
  for (const v of vocab) {
    if (v.length < 3 || /\d/.test(v)) continue;
    const list = vocabByInitial.get(v[0]!) ?? [];
    list.push(v);
    vocabByInitial.set(v[0]!, list);
  }
  const reviewSymptoms = new Map(content.reviews.map((r) => [r.id, new Set(r.symptoms)]));
  // Indeks balik: kata kunci berimbuhan dapat dikenali dari bentuk tanpa awalannya.
  const rootIndex = new Map<string, string>();
  const ambiguous = new Set<string>();
  for (const v of vocab) {
    for (const root of affixRoots(v)) {
      if (root === v || vocab.has(root) || root.length < 4) continue;
      const prev = rootIndex.get(root);
      if (prev && prev !== v) ambiguous.add(root);
      else rootIndex.set(root, v);
    }
  }
  for (const r of ambiguous) rootIndex.delete(r);
  const lex = { keywords, byFirst, vocab, known, vocabByInitial, reviewSymptoms, rootIndex };
  lexiconCache.set(content, lex);
  return lex;
}

// ---------------------------------------------------------------------------
// Kanonisasi kata: imbuhan, kata tergabung, salah ketik
// ---------------------------------------------------------------------------

const PREFIXES: [string, string[]][] = [
  // [awalan, pengganti huruf awal kata dasar (luluh)]
  ['meng', ['', 'k']],
  ['meny', ['s']],
  ['mem', ['', 'p']],
  ['men', ['', 't']],
  ['me', ['']],
  ['peng', ['', 'k']],
  ['peny', ['s']],
  ['pem', ['', 'p']],
  ['pen', ['', 't']],
  ['per', ['']],
  ['pe', ['']],
  ['ber', ['']],
  ['be', ['']],
  ['ter', ['']],
  ['di', ['']],
  ['ke', ['']],
  ['se', ['']],
];
const STEM_SUFFIXES = ['kan', 'an', 'i', 'nya', 'ku', 'mu'];

/** Kemungkinan bentuk dasar sebuah kata (tanpa akhiran dan/atau awalan), termasuk kata itu sendiri. */
function affixRoots(token: string): string[] {
  const roots: string[] = [];
  const withoutSuffix = [token, ...STEM_SUFFIXES.filter((s) => token.endsWith(s) && token.length - s.length >= 3).map((s) => token.slice(0, -s.length))];
  for (const base of withoutSuffix) {
    roots.push(base);
    for (const [prefix, swaps] of PREFIXES) {
      if (!base.startsWith(prefix) || base.length - prefix.length < 3) continue;
      const rest = base.slice(prefix.length);
      for (const s of swaps) roots.push(s + rest);
    }
  }
  return roots;
}

/** Kata dasar yang ada di kosakata untuk kata berimbuhan, atau null. */
function stemToVocab(token: string, vocab: ReadonlySet<string>): string | null {
  for (const root of affixRoots(token)) if (root !== token && root.length >= 3 && vocab.has(root)) return root;
  return null;
}

/** Dua kata kosakata yang tergabung tanpa spasi ("sakitkepala"), atau null. */
function splitToVocab(token: string, vocab: ReadonlySet<string>): [string, string] | null {
  if (token.length < 7) return null;
  for (let i = 3; i <= token.length - 3; i++) {
    const a = token.slice(0, i);
    const b = token.slice(i);
    if (vocab.has(a) && vocab.has(b)) return [a, b];
  }
  return null;
}

/** Jarak Damerau–Levenshtein (dengan pertukaran dua huruf bersebelahan), dibatasi `max`. */
export function editDistance(a: string, b: string, max = 3): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: number[][] = Array.from({ length: rows }, (_, i) => Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i < rows; i++) {
    let best = Infinity;
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, d[i - 2]![j - 2]! + 1);
      d[i]![j] = v;
      best = Math.min(best, v);
    }
    if (best > max) return max + 1;
  }
  return d[a.length]![b.length]!;
}

/** Apakah `short` dapat diperoleh dari `long` dengan membuang huruf (tanpa mengubah urutan). */
function isSubsequence(short: string, long: string): boolean {
  let i = 0;
  for (const ch of long) if (ch === short[i]) i++;
  return i === short.length;
}

/** Koreksi salah ketik ke kata kosakata terdekat (huruf awal sama, jarak kecil, tidak ambigu). */
function fuzzyToVocab(token: string, lex: Lexicon): string | null {
  if (token.length < 4) return null;
  const max = token.length >= 7 ? 2 : 1;
  let best: string | null = null;
  let bestDist = max + 1;
  let tie = false;
  // Pada jarak yang sama: huruf yang terlewat (salah ketik paling umum: "batk" → "batuk", bukan
  // "baik"), lalu huruf berlebih, lalu panjang yang paling dekat, lalu yang lebih panjang.
  const kind = (cand: string) => (isSubsequence(token, cand) ? 0 : isSubsequence(cand, token) ? 1 : 2);
  const better = (a: string, b: string) => {
    const ka = kind(a);
    const kb = kind(b);
    if (ka !== kb) return ka < kb;
    const da = Math.abs(a.length - token.length);
    const db = Math.abs(b.length - token.length);
    return da !== db ? da < db : a.length > b.length;
  };
  for (const cand of lex.vocabByInitial.get(token[0]!) ?? []) {
    if (Math.abs(cand.length - token.length) > max) continue;
    const d = editDistance(token, cand, max);
    if (d < bestDist) {
      best = cand;
      bestDist = d;
      tie = false;
    } else if (d === bestDist && cand !== best) {
      if (best && better(cand, best)) {
        best = cand;
        tie = false;
      } else if (best && !better(best, cand)) tie = true;
    }
  }
  return best && !tie ? best : null;
}

/** Ubah token pertanyaan ke bentuk yang dikenal kata kunci (kata dasar / koreksi salah ketik). */
function canonicalTokens(tokens: readonly string[], lex: Lexicon): string[] {
  const out: string[] = [];
  for (const t of tokens) {
    if (lex.vocab.has(t) || t.length < 3 || /\d/.test(t)) {
      out.push(t);
      continue;
    }
    // "rasakan" → "dirasakan": bentuk berimbuhan yang dipakai kata kunci lebih spesifik dari kata dasarnya.
    const prefixed = lex.rootIndex.get(t);
    if (prefixed) {
      out.push(prefixed);
      continue;
    }
    const stem = stemToVocab(t, lex.vocab);
    if (stem) {
      out.push(stem);
      continue;
    }
    if (lex.known.has(t)) {
      out.push(t);
      continue;
    }
    const split = splitToVocab(t, lex.vocab);
    if (split) {
      out.push(...split);
      continue;
    }
    out.push(fuzzyToVocab(t, lex) ?? t);
  }
  return out.filter((t, i) => t !== out[i - 1]);
}

// ---------------------------------------------------------------------------
// Durasi yang disebut dokter ("sudah 3 hari?")
// ---------------------------------------------------------------------------

const NUMBER_WORD: Record<string, number> = { satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6, tujuh: 7, delapan: 8, sembilan: 9, sepuluh: 10, sebelas: 11 };
const UNIT_DAYS: Record<string, number> = { hari: 1, minggu: 7, pekan: 7, bulan: 30, tahun: 365 };
const SE_UNIT: Record<string, number> = { seminggu: 7, sepekan: 7, sebulan: 30, setahun: 365 };

/** Lama (hari) yang disebut di token, atau undefined. "sehari"/"semalam" tidak dihitung (frekuensi). */
export function parseDurationDays(tokens: readonly string[]): number | undefined {
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;
    if (SE_UNIT[t]) return SE_UNIT[t];
    const unit = UNIT_DAYS[tokens[i + 1] ?? ''];
    if (!unit) continue;
    let n: number | undefined;
    if (/^\d+$/.test(t)) n = Number(t);
    else if (NUMBER_WORD[t] !== undefined) n = NUMBER_WORD[t];
    else if (t === 'belas' || t === 'puluh') {
      const head = NUMBER_WORD[tokens[i - 1] ?? ''];
      if (head !== undefined) n = t === 'belas' ? 10 + head : head * 10;
    }
    if (n !== undefined && n > 0) return n * unit;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Pencocokan per klausa
// ---------------------------------------------------------------------------

interface Match {
  start: number;
  end: number;
  /** Jumlah token kata kunci (ukuran spesifisitas). */
  size: number;
  intent: KeywordIntent;
  phrase: string;
}

/** Cocokkan satu kata kunci mulai dari posisi i, boleh disisipi kata pengisi (maks. 1 per celah, 2 total). */
function matchAt(tokens: readonly string[], i: number, kw: Keyword): number {
  let pos = i + 1;
  let fillers = 0;
  for (let k = 1; k < kw.tokens.length; k++) {
    if (tokens[pos] === kw.tokens[k]) {
      pos++;
      continue;
    }
    if (fillers < 2 && FILLERS.has(tokens[pos] ?? '') && tokens[pos + 1] === kw.tokens[k]) {
      fillers++;
      pos += 2;
      continue;
    }
    return -1;
  }
  return pos;
}

const MEDICATION_WORDS = new Set(['obat', 'jamu']);
/** Topik yang menggambarkan keluhan (bukan waktu). */
const DESCRIPTOR_TOPICS = new Set(['karakter', 'lokasi', 'keparahan', 'pemberat_peringan', 'progresi']);

interface ClauseResult {
  intents: Intent[];
  greeting: boolean;
  thanks: boolean;
  consent: boolean;
  repeat: boolean;
  durationDays?: number;
}

/**
 * Frasa perubahan. Bila klausa juga memuat pemicu/syarat ("kalau istirahat membaik?",
 * "apa yang membuat sakitnya berkurang?", "kalau jalan tambah sakit?"), yang ditanyakan adalah
 * faktor pemberat/peringan — bukan perjalanan penyakit dari waktu ke waktu.
 */
const CHANGE_PHRASES = new Set(['membaik', 'memburuk', 'berkurang', 'bertambah', 'reda', 'berubah', 'makin', 'semakin', 'makin berat', 'makin parah', 'semakin parah', 'semakin berat', 'tambah berat', 'tambah parah', 'bertambah parah', 'bertambah berat', 'makin sakit', 'tambah sakit', 'lebih baik', 'lebih buruk']);
const CONDITION_WORDS = new Set(['kalau', 'bila', 'jika', 'apabila', 'ketika', 'habis', 'setelah', 'sehabis', 'sesudah', 'membuat', 'bikin', 'pas', 'saat', 'waktu', 'sewaktu']);

/**
 * Topik yang hanya didukung frasa umum mengalah pada topik yang lebih tepat di klausa yang sama.
 * `via` kosong = semua frasa topik itu.
 */
const DRUG_NAMES = ['parasetamol', 'paracetamol', 'panadol', 'antibiotik', 'amoksisilin', 'ibuprofen', 'asam mefenamat', 'antasida', 'promag', 'mylanta', 'omeprazol', 'ranitidin', 'metformin', 'amlodipin', 'captopril', 'insulin', 'puyer'];
const YIELDS: { kind: 'topic' | 'symptom' | 'review'; id: string; via?: string[]; to: string[] }[] = [
  // "Bagaimana kebiasaan sehari-harinya: makan, minum, merokok?" → kebiasaan, bukan tinjauan asupan.
  { kind: 'review', id: 'makan', via: ['makan minum', 'makan dan minum'], to: ['kebiasaan'] },
  // "Sekali sakit berapa lama?" → lama tiap serangan; "Sekarang dibanding awal?" → perjalanan penyakit.
  { kind: 'topic', id: 'onset', via: ['berapa lama', 'awal', 'sudah lama', 'lama', 'sejak', 'pertama muncul', 'pertama kali muncul'], to: ['durasi', 'progresi'] },
  // "Makin lama makin parah?" / "Kalau jalan tambah parah?" → bukan pertanyaan derajat keparahan.
  { kind: 'topic', id: 'keparahan', via: ['parah', 'berat ringan', 'mengganggu'], to: ['progresi', 'pemberat_peringan', 'pola'] },
  // "Ceritakan dari awal ya" → keluhan utama.
  { kind: 'topic', id: 'onset', via: ['awal'], to: ['keluhan_utama'] },
  // "Sampai harus istirahat di rumah?" → derajat keparahan.
  { kind: 'topic', id: 'pemberat_peringan', via: ['istirahat'], to: ['keparahan'] },
  // "Ada alergi makanan atau obat?", "Pernah alergi antibiotik?"
  { kind: 'topic', id: 'riwayat_obat', via: ['obat', 'minum obat', ...DRUG_NAMES], to: ['alergi'] },
  // "Menurut Ibu ini sakit apa?", "Selain itu apa lagi yang dirasa?"
  { kind: 'topic', id: 'keluhan_utama', via: ['sakit apa', 'ada apa', 'apa yang dirasakan'], to: ['pendapat_pasien', 'kekhawatiran', 'harapan', 'keluhan_lain'] },
  // "Apa harapannya datang ke sini?"
  { kind: 'topic', id: 'keluhan_utama', via: ['datang ke sini', 'datang berobat', 'membuat datang', 'kenapa datang'], to: ['harapan'] },
  // "Berat badannya ada perubahan?", "BAB-nya ada perubahan?" → tinjauan sistem itu.
  { kind: 'topic', id: 'progresi', via: ['perubahan', 'ada perubahan', 'berubah'], to: ['R:*'] },
  // "Datang ke sini karena apa?"
  { kind: 'topic', id: 'pendapat_pasien', via: ['karena apa'], to: ['keluhan_utama'] },
  // "Sampai tidak bisa tidur?", "Kambuh saat tidur?"
  { kind: 'topic', id: 'kebiasaan', via: ['tidur'], to: ['keparahan', 'pola'] },
  // "Lebih sering kambuh malam hari?"
  { kind: 'topic', id: 'episode_sebelumnya', via: ['sering kambuh', 'kambuhan', 'berulang', 'pernah kambuh'], to: ['pola'] },
  // "Sering makan pedas?", "Sering minum kopi?"
  { kind: 'symptom', id: 'lapar', via: ['sering makan', 'banyak makan'], to: ['kebiasaan'] },
  { kind: 'symptom', id: 'haus', via: ['sering minum', 'banyak minum'], to: ['kebiasaan'] },
  // "Ngopi tiap hari?", "Merokok setiap hari?" → kebiasaan, bukan pola keluhan.
  { kind: 'topic', id: 'pola', via: ['tiap hari', 'setiap hari'], to: ['kebiasaan'] },
  // "Cepat kenyang kalau makan?" → makan memang bagian dari gejalanya.
  { kind: 'topic', id: 'pemberat_peringan', via: ['kalau makan', 'saat makan', 'waktu makan', 'setelah makan', 'habis makan', 'sesudah makan', 'sehabis makan'], to: ['S:cepat_kenyang'] },
  // "Nyeri dada saat bernapas dalam?" → nyeri dada pleuritik saja.
  { kind: 'symptom', id: 'nyeri_dada', via: ['nyeri dada', 'sakit dada', 'dada sakit'], to: ['S:nyeri_dada_pleuritik'] },
];
/** Topik yang berubah menjadi faktor pemberat/peringan bila klausa memuat syarat ("kalau ditekan sakit?"). */
const CONDITIONAL_TO_MODIFIER: { topic: string; via: ReadonlySet<string> }[] = [
  { topic: 'progresi', via: CHANGE_PHRASES },
  { topic: 'karakter', via: new Set(['ditekan']) },
];

const WEATHER_WORDS = new Set(['hari', 'cuaca', 'udara', 'matahari', 'gerah', 'cerah', 'siang', 'musim', 'kemarau']);
const BODY_WORDS = new Set(['badan', 'tubuh', 'suhu', 'kepala', 'dahi', 'anak', 'demam', 'kening']);

/** Kata yang boleh menyusul "nama"/"umur" tanpa mengubah rujukannya ("nama lengkap", "umur berapa"). */
const POSSESSIVE_OK = new Set(['lengkap', 'panggilan', 'asli', 'sendiri', 'siapa', 'berapa', 'sekarang', 'anda', 'kamu', 'kakak', 'adik', 'bapak', 'ibu']);

/** Kata yang bukan "isi" pertanyaan (untuk mendeteksi pertanyaan di luar konteks). */
const NON_CONTENT = new Set(['apa', 'apakah', 'yang', 'ini', 'itu', 'ya', 'tidak', 'sudah', 'belum', 'bisa', 'mau', 'coba', 'tolong', 'dan', 'atau', 'dengan', 'untuk', 'dari', 'di', 'ke', 'mana', 'kapan', 'berapa', 'bagaimana', 'sekarang', 'tadi', 'dulu', 'sih', 'deh', 'dong', 'kok', 'nah', 'nih', 'tuh', 'saja', 'paling', 'lebih', 'tepat', 'persis', 'sakit', 'nyeri', 'pegal', 'linu', 'perih', 'gatal', 'bengkak', 'benjolan', 'luka', 'ruam', 'keluhan', 'terasa']);

function interpretClause(tokens: readonly string[], rawTokens: readonly string[], endsWithQuestionMark: boolean, lex: Lexicon): ClauseResult {
  const matches: Match[] = [];
  for (let i = 0; i < tokens.length; i++) {
    for (const kw of lex.byFirst.get(tokens[i]!) ?? []) {
      const end = matchAt(tokens, i, kw);
      if (end > 0) matches.push({ start: i, end, size: kw.tokens.length, intent: kw.intent, phrase: kw.phrase });
    }
  }
  // Paling spesifik dulu (kata kunci terpanjang), lalu bentang tersempit, lalu yang lebih awal.
  matches.sort((a, b) => b.size - a.size || a.end - a.start - (b.end - b.start) || a.start - b.start);
  const taken = new Array<boolean>(tokens.length).fill(false);
  let accepted: Match[] = [];
  const owner: (Match | undefined)[] = new Array(tokens.length).fill(undefined);
  const sameIntent = (a: Match, b: Match) => JSON.stringify(a.intent) === JSON.stringify(b.intent);
  // Token yang juga kata kunci deskriptor keluhan ("ditekan", "perih") tidak ikut ditelan perluasan.
  const descriptor = new Set<number>();
  for (const m of matches) {
    if (m.intent.kind === 'topic' && DESCRIPTOR_TOPICS.has(m.intent.topic)) for (let i = m.start; i < m.end; i++) descriptor.add(i);
  }
  for (const m of matches) {
    const overlapping = new Set<Match>();
    for (let i = m.start; i < m.end; i++) if (taken[i]) overlapping.add(owner[i]!);
    if (overlapping.size === 0) {
      for (let i = m.start; i < m.end; i++) {
        taken[i] = true;
        owner[i] = m;
      }
      accepted.push(m);
      continue;
    }
    // Frasa lain untuk maksud yang SAMA memperluas bentangnya ("sering kencing malam").
    const [o] = overlapping;
    let absorbsDescriptor = false;
    for (let i = m.start; i < m.end; i++) if (!taken[i] && descriptor.has(i)) absorbsDescriptor = true;
    if (overlapping.size === 1 && sameIntent(o!, m) && !absorbsDescriptor) {
      for (let i = m.start; i < m.end; i++) {
        if (taken[i]) continue;
        taken[i] = true;
        owner[i] = o;
      }
      o!.start = Math.min(o!.start, m.start);
      o!.end = Math.max(o!.end, m.end);
    }
  }
  // "obat batuk", "sering minum obat pegal linu": nama/jenis obat, bukan gejala yang ditanyakan.
  const medIdx = tokens.map((t, i) => (MEDICATION_WORDS.has(t) ? i : -1)).filter((i) => i >= 0);
  if (medIdx.length) {
    const inMedName = (m: Match) => medIdx.some((i) => (m.start > i && m.start <= i + 3) || m.end === i);
    // "obat pereda nyeri", "obat TB": kata sesudah "obat" menamai obatnya.
    const weakTopic = (m: Match) => m.intent.kind === 'topic' && m.size === 1 && m.intent.topic !== 'riwayat_obat' && m.intent.topic !== 'alergi';
    accepted = accepted.filter((m) => !((m.intent.kind === 'symptom' || weakTopic(m)) && inMedName(m)));
  }
  accepted.sort((a, b) => a.start - b.start);

  const topics: string[] = [];
  const symptoms: string[] = [];
  const reviews: { group: string; weak: boolean; single: boolean }[] = [];
  const result: ClauseResult = { intents: [], greeting: false, thanks: false, consent: false, repeat: false };
  for (const m of accepted) {
    const it = m.intent;
    if (it.kind === 'topic' && !topics.includes(it.topic)) topics.push(it.topic);
    else if (it.kind === 'symptom' && !symptoms.includes(it.symptom)) symptoms.push(it.symptom);
    else if (it.kind === 'review') {
      const prev = reviews.find((r) => r.group === it.group);
      if (prev) prev.single &&= m.size === 1;
      else reviews.push({ group: it.group, weak: it.weak, single: m.size === 1 });
    }
    else if (it.kind === 'greeting') result.greeting = true;
    else if (it.kind === 'thanks') result.thanks = true;
    else if (it.kind === 'consent') result.consent = true;
    else if (it.kind === 'repeat') result.repeat = true;
  }

  const phrasesOf = (kind: 'topic' | 'symptom' | 'review', id: string) =>
    accepted
      .filter((m) =>
        kind === 'topic'
          ? m.intent.kind === 'topic' && m.intent.topic === id
          : kind === 'symptom'
            ? m.intent.kind === 'symptom' && m.intent.symptom === id
            : m.intent.kind === 'review' && m.intent.group === id,
      )
      .map((m) => m.phrase);
  const drop = (list: string[], id: string) => {
    const i = list.indexOf(id);
    if (i >= 0) list.splice(i, 1);
  };
  // "Kalau istirahat membaik?", "Apa yang membuat sakitnya berkurang?", "Kalau ditekan sakit?"
  // → faktor pemberat/peringan.
  const conditional = tokens.some((t) => CONDITION_WORDS.has(t));
  for (const rule of CONDITIONAL_TO_MODIFIER) {
    if (!topics.includes(rule.topic) || !phrasesOf('topic', rule.topic).every((p) => rule.via.has(p))) continue;
    if (topics.includes('pemberat_peringan')) drop(topics, rule.topic);
    else if (conditional) topics[topics.indexOf(rule.topic)] = 'pemberat_peringan';
  }
  // "Sakitnya bertambah kalau batuk?" → batuk adalah pemicunya, bukan gejala yang ditanyakan.
  if (topics.includes('pemberat_peringan')) {
    for (const m of accepted) {
      if (m.intent.kind !== 'symptom') continue;
      const before = tokens[m.start - 1];
      if (before && CONDITION_WORDS.has(before) && m.start > 1) drop(symptoms, m.intent.symptom);
    }
  }
  // "Ditusuk, diremas, atau panas?" → "panas" menggambarkan rasa nyeri, bukan demam.
  if (topics.includes('karakter') && phrasesOf('symptom', 'demam').every((p) => p === 'panas')) drop(symptoms, 'demam');
  // "Hari ini panas sekali ya" → cuaca, bukan demam.
  if (phrasesOf('symptom', 'demam').every((p) => p === 'panas') && tokens.some((t) => WEATHER_WORDS.has(t)) && !tokens.some((t) => BODY_WORDS.has(t))) {
    drop(symptoms, 'demam');
  }
  // "Selain sakit perut, ada apa lagi?" → gejala yang sudah diketahui hanya konteks.
  const selain = tokens.indexOf('selain');
  if (selain >= 0 && topics.includes('keluhan_lain')) {
    for (const m of accepted) if (m.intent.kind === 'symptom' && m.start > selain && m.start <= selain + 3) drop(symptoms, m.intent.symptom);
  }
  // "Berkeringat malam tanpa aktivitas?" → kata sesudah "tanpa" menjelaskan gejalanya, bukan pemicu.
  const tanpa = tokens.indexOf('tanpa');
  if (tanpa >= 0) {
    for (const m of accepted) if (m.intent.kind === 'topic' && m.size === 1 && m.start > tanpa && m.start <= tanpa + 2) drop(topics, m.intent.topic);
  }
  // "Pertama kali terasa kapan?" → awal keluhan, bukan "apakah ini yang pertama kali?".
  if (topics.includes('episode_sebelumnya') && tokens.includes('kapan') && !topics.includes('onset') && phrasesOf('topic', 'episode_sebelumnya').every((p) => p.includes('pertama'))) {
    topics[topics.indexOf('episode_sebelumnya')] = 'onset';
  }
  const present = (id: string) =>
    id === 'R:*' ? reviews.length > 0 : id.startsWith('S:') ? symptoms.includes(id.slice(2)) : topics.includes(id);
  for (const y of YIELDS) {
    if (y.kind === 'review') {
      const i = reviews.findIndex((r) => r.group === y.id);
      if (i < 0 || !y.to.some(present)) continue;
      if (!y.via || phrasesOf('review', y.id).every((p) => y.via!.includes(p))) reviews.splice(i, 1);
      continue;
    }
    const list = y.kind === 'topic' ? topics : symptoms;
    if (!list.includes(y.id) || !y.to.some(present)) continue;
    if (!y.via || phrasesOf(y.kind, y.id).every((p) => y.via!.includes(p))) drop(list, y.id);
  }
  // "Siapa nama kucing Bapak?", "Umur anaknya berapa?" → nama/umur ORANG/BENDA LAIN, bukan pasien.
  for (const id of ['identitas_nama', 'identitas_umur']) {
    if (!topics.includes(id)) continue;
    const ms = accepted.filter((m) => m.intent.kind === 'topic' && m.intent.topic === id);
    const isOwner = (t: string | undefined) =>
      t !== undefined && !FILLERS.has(t) && !ADDRESS_WORDS.has(t) && !NON_CONTENT.has(t) && !POSSESSIVE_OK.has(t) && !QUESTION_WORDS.test(t);
    const possessive = ms.every((m) => {
      // "nama kucing", atau "Kucingnya siapa namanya?" (pemilik di depan, bukan kata kosakata).
      if (isOwner(tokens[m.end])) return true;
      const before = tokens.slice(0, m.start).filter((t) => isOwner(t));
      return before.some((t) => !lex.vocab.has(t));
    });
    if (possessive) drop(topics, id);
  }
  // Pertanyaan di luar konteks yang kebetulan memuat "di mana" ("Mobilnya parkir di mana?").
  if (topics.length === 1 && topics[0] === 'lokasi' && symptoms.length === 0 && phrasesOf('topic', 'lokasi').every((p) => p === 'di mana' || p === 'dimana')) {
    const covered = new Set(accepted.flatMap((m) => Array.from({ length: m.end - m.start }, (_, k) => m.start + k)));
    const content = tokens.filter((t, i) => !covered.has(i) && !FILLERS.has(t) && !NON_CONTENT.has(t) && !ADDRESS_WORDS.has(t) && !lex.vocab.has(t));
    if (content.length >= 2) topics.length = 0;
  }
  // "Di rumah ada yang batuk lama?" / "Tetangga ada yang sakit serupa?" → tentang keluarga/kontak, bukan pasien.
  if (topics.includes('riwayat_keluarga')) {
    symptoms.length = 0;
    drop(topics, 'riwayat_penyakit');
    drop(topics, 'episode_sebelumnya');
  }
  // Aba-aba pemeriksaan tanpa pertanyaan → pasien cukup mengiyakan.
  if (result.consent && !endsWithQuestionMark && !QUESTION_WORDS.test(tokens.join(' '))) {
    return { ...result, intents: [] };
  }
  const bare = tokens.filter((t) => !ADDRESS_WORDS.has(t) && t !== 'maaf' && t !== 'ya');
  // "Apa?", "Hah?" → minta diulang.
  if (bare.length === 1 && BARE_REPEAT.has(bare[0]!)) return { ...result, repeat: true, intents: [] };
  // "Pagi, Bu" → salam, bukan pertanyaan pola waktu.
  if (!endsWithQuestionMark && bare.length > 0 && bare.every((t) => TIME_GREETINGS.has(t) || t === 'selamat')) {
    return { ...result, greeting: true, intents: [] };
  }
  // "Sakitnya sudah 3 hari?" → pertanyaan onset (dengan angka untuk dikonfirmasi pasien).
  // Angka dibaca dari token sebelum pemotongan imbuhan ("seminggu" tidak menjadi "minggu").
  result.durationDays = parseDurationDays(rawTokens) ?? parseDurationDays(tokens);
  if (result.durationDays !== undefined && topics.length === 0) topics.push('onset');
  // "Kapan?" tanpa kata kunci lain → kapan mulainya.
  if (tokens.includes('kapan') && topics.length === 0 && symptoms.length === 0 && reviews.length === 0) topics.push('onset');

  const intents = result.intents;
  const detailTopics = topics.filter((t) => DETAIL_TOPICS.has(t));
  if (symptoms.length > 0 && detailTopics.length > 0) {
    // "Sejak kapan batuknya?" → detail gejala. Topik non-detail tetap dijawab terpisah.
    for (const s of symptoms) for (const t of detailTopics) intents.push({ kind: 'symptom_detail', topic: t, symptom: s });
    for (const t of topics.filter((x) => !DETAIL_TOPICS.has(x))) intents.push({ kind: 'topic', topic: t });
  } else {
    for (const t of topics) intents.push({ kind: 'topic', topic: t });
    for (const s of symptoms) intents.push({ kind: 'symptom', symptom: s });
  }
  // Tinjauan "umum" bagian tubuh ("perutnya bagaimana?") hanya bila tidak ada gejala spesifik;
  // tinjauan yang hanya disebut satu kata dibuang bila gejala kelompoknya sudah ditanyakan.
  for (const r of reviews) {
    // "Di perut sebelah mana?", "Boleh saya periksa perutnya?" → bagian tubuh hanya konteks.
    if (r.weak && (symptoms.length > 0 || topics.length > 0 || result.consent)) continue;
    if (r.single && symptoms.some((sym) => lex.reviewSymptoms.get(r.group)?.has(sym))) continue;
    intents.push({ kind: 'review', group: r.group });
  }
  return result;
}

/** Klausa beserta tanda baca penutupnya ("Ada alergi? Minum obat apa?" → dua klausa). */
function splitClauses(text: string): { text: string; question: boolean }[] {
  const out: { text: string; question: boolean }[] = [];
  for (const m of text.matchAll(/([^?!.;\n]+)([?!.;\n]*)/g)) {
    if (m[1]!.trim()) out.push({ text: m[1]!, question: (m[2] ?? '').includes('?') });
  }
  return out;
}

const DEICTIC = /\b(itu|tadi|tersebut|barusan|yang tadi)\b/;

/**
 * Tafsirkan satu pertanyaan bebas.
 * @param maxIntents batas jumlah topik/gejala yang dijawab dari satu pertanyaan.
 */
export function interpretQuestion(text: string, content: GameContent, maxIntents = 3): Interpretation {
  const lex = lexicon(content);
  const intents: Intent[] = [];
  const key = (i: Intent) => JSON.stringify(i);
  const seen = new Set<string>();
  let greeting = false;
  let thanks = false;
  let consent = false;
  let repeat = false;
  let durationDays: number | undefined;
  const normalizedParts: string[] = [];
  for (const clause of splitClauses(text)) {
    const norm = normalizeQuestion(clause.text);
    if (!norm) continue;
    const raw = norm.split(' ');
    const tokens = canonicalTokens(raw, lex);
    normalizedParts.push(tokens.join(' '));
    const r = interpretClause(tokens, raw, clause.question, lex);
    greeting ||= r.greeting;
    thanks ||= r.thanks;
    consent ||= r.consent;
    repeat ||= r.repeat;
    durationDays ??= r.durationDays;
    for (const it of r.intents) {
      if (seen.has(key(it))) continue;
      seen.add(key(it));
      intents.push(it);
    }
  }
  const normalized = normalizedParts.join(' ');
  const limited = intents.slice(0, Math.max(1, maxIntents));
  if (limited.length === 0) {
    if (repeat) limited.push({ kind: 'repeat' });
    else if (consent) limited.push({ kind: 'consent' });
    else if (thanks) limited.push({ kind: 'thanks' });
    else if (greeting) limited.push({ kind: 'greeting' });
  }
  const result: Interpretation = { intents: limited, normalized, deictic: DEICTIC.test(normalizeQuestion(text)) };
  if (durationDays !== undefined) result.durationDays = durationDays;
  return result;
}
