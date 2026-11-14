/**
 * Penampilan & bahasa tubuh pasien (untuk tampilan 3D) — LOGIKA MURNI, tanpa DOM/WebGL.
 *
 * Prinsip konsistensi klinis:
 *  - Tubuh (tinggi, IMT) diambil dari HASIL antropometri kasus; laju napas dari tanda vital kasus.
 *  - Isyarat yang terlihat (pucat, kuning, ruam, sesak, menggigil, pincang, …) hanya muncul bila
 *    gejala/temuannya memang ada pada kasus — aturan pemetaannya di src/data/appearance.json.
 *  - Gejala yang tidak punya isyarat tetap tersembunyi: hanya terungkap lewat anamnesis/pemeriksaan.
 *  - Semua pilihan acak (warna kulit, rambut, pakaian) deterministik dari seed kasus.
 */
import { referenceRange } from './findings';
import type { Intent } from './nlu';
import { createRng, deriveSeed } from './rng';
import type {
  AgeGroup,
  BodySite,
  CueId,
  Demonstration,
  Emotion,
  GameContent,
  NumericParamDef,
  OutfitDef,
  PatientCase,
  Sex,
} from './types';

export interface PatientAppearance {
  sex: Sex;
  age: number;
  ageGroup: AgeGroup;
  heightCm: number;
  bmi: number;
  /** −1 (sangat kurus) … 0 (normal) … +1 (obesitas). */
  build: number;
  skinTone: string;
  hairColor: string;
  hairStyle: string;
  /** Warna hijab, atau null bila tidak berhijab. */
  hijab: string | null;
  glasses: boolean;
  facialHair: 'none' | 'kumis' | 'janggut';
  outfit: OutfitDef;
  /** Laju napas yang terlihat = frekuensi napas pada tanda vital kasus. */
  breathsPerMinute: number;
  /** Isyarat klinis yang terlihat beserta kekuatannya (0..1). */
  cues: Partial<Record<CueId, number>>;
  /** Bagian tubuh yang sesekali dipegang saat diam (nyeri terkuat yang punya lokasi). */
  hold: { site: BodySite; side: 'kiri' | 'kanan'; level: number } | null;
  /** Sisi tubuh untuk lokasi bersisi (pinggang). */
  side: 'kiri' | 'kanan';
  /** Emosi dasar (dari kepribadian & kondisi). */
  emotion: Emotion;
  personalityId: string;
  /** Kecepatan bicara (karakter per detik). */
  talkRate: number;
  /** Kecepatan berjalan (m/detik). */
  walkSpeed: number;
  /** Deskripsi teks dari yang terlihat (aksesibilitas, mode tanpa 3D, dan tes). */
  observations: string[];
}

export function ageGroupOf(age: number): AgeGroup {
  if (age <= 12) return 'anak';
  if (age <= 17) return 'remaja';
  if (age >= 60) return 'lansia';
  return 'dewasa';
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function finding(c: PatientCase, tool: string, param: string) {
  return c.findings[tool]?.find((r) => r.paramId === param);
}

/** Isyarat klinis yang terlihat pada kasus (level tertinggi dari semua sumber). */
export function visibleCues(c: PatientCase, content: GameContent): Partial<Record<CueId, number>> {
  const rules = content.appearance;
  const cues: Partial<Record<CueId, number>> = {};
  const raise = (cue: CueId, level: number) => {
    cues[cue] = Math.max(cues[cue] ?? 0, level);
  };
  for (const r of rules.symptomCues) if (c.symptoms.includes(r.symptom)) raise(r.cue, r.level);
  // Aturan temuan: per (alat, parameter, isyarat) hanya aturan PERTAMA yang cocok.
  const decided = new Set<string>();
  for (const r of rules.findingCues) {
    const key = `${r.tool}.${r.param}.${r.cue}`;
    if (decided.has(key)) continue;
    const res = finding(c, r.tool, r.param);
    if (!res) continue;
    let hit = true;
    if (r.abnormal !== undefined) hit &&= (res.flag !== null) === r.abnormal;
    // Aturan teks hanya berlaku pada hasil ABNORMAL ("Tidak ikterik" tidak boleh cocok dengan "ikterik").
    if (r.match !== undefined) hit &&= res.flag !== null && String(res.value).toLowerCase().includes(r.match.toLowerCase());
    if (r.min !== undefined) hit &&= typeof res.value === 'number' && res.value >= r.min;
    if (r.max !== undefined) hit &&= typeof res.value === 'number' && res.value <= r.max;
    if (!hit) continue;
    decided.add(key);
    raise(r.cue, r.level);
  }
  return cues;
}

/** Sisi tubuh (kiri/kanan) untuk lokasi bersisi, dari trait kasus. Default kanan. */
export function bodySide(c: PatientCase, content: GameContent): 'kiri' | 'kanan' {
  return content.appearance.sideTraits.kiri.some((t) => c.traits.includes(t)) ? 'kiri' : 'kanan';
}

/** Lokasi tubuh untuk suatu gejala (atau null bila tidak berlokasi). */
export function symptomSite(symptomId: string, content: GameContent): BodySite | null {
  return content.appearance.sites[symptomId] ?? null;
}

/** Lokasi keluhan utama: gejala keluhan utama pertama yang punya lokasi. */
export function chiefSite(c: PatientCase, content: GameContent): BodySite | null {
  for (const s of c.chiefComplaintSymptoms) {
    const site = symptomSite(s, content);
    if (site) return site;
  }
  return null;
}

export function buildAppearance(c: PatientCase, content: GameContent): PatientAppearance {
  const rules = content.appearance;
  const rng = createRng(deriveSeed(c.seed, 'penampilan'));
  const { sex, age } = c.patient;
  const ageGroup = ageGroupOf(age);
  const personality = c.patient.personalityId;

  // --- Tubuh: dari antropometri kasus ---------------------------------------
  const heightCm = Number(finding(c, 'timbangan', 'tb')?.value ?? (sex === 'male' ? 166 : 155));
  const bmi = Number(finding(c, 'timbangan', 'imt')?.value ?? 21);
  const imtParam = content.toolsById.get('timbangan')?.params.find((p) => p.id === 'imt') as NumericParamDef | undefined;
  const [lo, hi] = imtParam ? referenceRange(imtParam, { sex, age }) : [18.5, 22.9];
  let build: number;
  if (bmi < lo) build = -clamp((lo - bmi) / 3, 0.25, 1);
  else if (bmi > hi) build = clamp((bmi - hi) / 8, 0.1, 1);
  else build = ((bmi - lo) / (hi - lo) - 0.5) * 0.3;

  // --- Isyarat klinis ------------------------------------------------------------
  const cues = visibleCues(c, content);
  if (bmi < lo - 0.3) cues.kurus = clamp((lo - bmi) / 3, 0.3, 1);
  if (bmi > hi + 2) cues.gemuk = clamp((bmi - hi) / 8, 0.3, 1);
  // Kepribadian mengubah seberapa sering nyeri diperlihatkan (meremehkan menahan, cemas menonjolkan).
  const showFactor = personality === 'meremehkan' ? 0.5 : personality === 'cemas' ? 1.25 : 1;
  const side = bodySide(c, content);
  let hold: PatientAppearance['hold'] = null;
  for (const r of rules.symptomCues) {
    if (r.cue !== 'pegang' || !r.site || !c.symptoms.includes(r.symptom)) continue;
    // Keluhan utama diutamakan; selain itu yang paling kuat.
    const level = clamp(r.level * showFactor * (c.chiefComplaintSymptoms.includes(r.symptom) ? 1.2 : 0.8), 0, 1);
    if (!hold || level > hold.level) hold = { site: r.site, side, level };
  }
  if (hold) cues.pegang = hold.level;
  else delete cues.pegang;

  const breathsPerMinute = Number(finding(c, 'tanda_vital', 'napas')?.value ?? 16);

  // --- Emosi dasar ------------------------------------------------------------
  let emotion: Emotion = rules.emotions[personality] ?? 'tenang';
  const pain = Math.max(cues.gelisah ?? 0, cues.diam_menahan ?? 0, (hold?.level ?? 0) >= 0.7 ? 0.8 : 0);
  if (pain >= 0.7 && personality !== 'meremehkan') emotion = 'kesakitan';
  else if ((cues.lemas ?? 0) >= 0.7 || cues.mengantuk) emotion = personality === 'cemas' ? 'cemas' : 'lesu';

  // --- Tempo ------------------------------------------------------------
  let talkRate = personality === 'sok_tahu' ? 18 : personality === 'cemas' ? 17 : personality === 'pelupa' ? 13.5 : 15.5;
  if ((cues.sesak ?? 0) >= 0.9) talkRate *= 0.7;
  else if ((cues.sesak ?? 0) >= 0.5) talkRate *= 0.85;
  if (cues.mengantuk) talkRate *= 0.75;
  if ((cues.lemas ?? 0) >= 0.7) talkRate *= 0.88;
  let walkSpeed = ageGroup === 'lansia' ? 0.82 : ageGroup === 'anak' ? 1.0 : 1.12;
  if (cues.pincang_kanan) walkSpeed *= 0.62;
  if ((cues.lemas ?? 0) >= 0.5) walkSpeed *= 0.78;
  if ((cues.sesak ?? 0) >= 0.6) walkSpeed *= 0.8;
  if (cues.kaku) walkSpeed *= 0.85;
  if (pain >= 0.7) walkSpeed *= 0.8;
  if (cues.gemuk) walkSpeed *= 0.93;

  // --- Kulit, rambut, pakaian (deterministik) ------------------------------------
  const skinTone = rng.weighted(rules.skinTones, (t) => t.weight).color;
  const hairPool = age >= 58 ? rules.hairColors.lansia : age >= 42 ? rules.hairColors.paruh_baya : rules.hairColors.muda;
  const hairColor = rng.weighted(hairPool, (h) => h.weight).color;
  const hairStyle = rng.pick(rules.hairStyles[sex][ageGroup]);
  const hijab = sex === 'female' && rng.chance(rules.hijabRate[ageGroup]) ? rng.pick(rules.hijabColors) : null;
  const glasses = rng.chance(rules.glassesRate[ageGroup]);
  const facialRoll = rng.next();
  const facialHair: PatientAppearance['facialHair'] = sex === 'male' && age >= 24 ? (facialRoll < 0.2 ? 'kumis' : facialRoll < 0.3 ? 'janggut' : 'none') : 'none';

  const uniform = rules.outfits[c.patient.occupationId];
  const outfit: OutfitDef = uniform
    ? { ...uniform }
    : {
        top: rng.pick(rules.topColors),
        bottom: rng.pick(rules.bottomColors),
        sleeves: rng.chance(0.3) ? 'panjang' : 'pendek',
        footwear: c.patient.economy === 'miskin' && rng.chance(0.6) ? 'sandal' : 'sepatu',
      };
  if (hijab) outfit.sleeves = 'panjang';
  if (outfit.shorts && sex === 'female') delete outfit.shorts;
  // Pasien demam/menggigil lazim datang berjaket.
  const feverish = (cues.menggigil ?? 0) > 0 || (cues.demam ?? 0) > 0;
  const jacketRoll = rng.chance(0.65);
  const jacketColor = rng.pick(rules.jacketColors);
  if (!outfit.jacket && feverish && (cues.menggigil || jacketRoll)) outfit.jacket = jacketColor;
  if (cues.pincang_kanan) outfit.footwear = 'sandal';

  const observations = describeObservations(cues, hold, content);
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
    outfit,
    breathsPerMinute,
    cues,
    hold,
    side,
    emotion,
    personalityId: personality,
    talkRate,
    walkSpeed,
    observations,
  };
}

const SITE_LABEL: Record<BodySite, string> = {
  kepala: 'kepala',
  mata: 'mata',
  mulut: 'mulut',
  tenggorokan: 'tenggorokan',
  dada: 'dada',
  ulu_hati: 'ulu hati',
  perut: 'perut',
  perut_bawah: 'perut bawah',
  pinggang: 'pinggang',
  lengan: 'lengan',
  kaki: 'kaki',
};

function describeObservations(cues: Partial<Record<CueId, number>>, hold: PatientAppearance['hold'], content: GameContent): string[] {
  const out: string[] = [];
  for (const [cue, level] of Object.entries(cues) as [CueId, number][]) {
    if (!level || level < 0.3) continue;
    if (cue === 'pegang' && hold) {
      const side = hold.site === 'pinggang' ? ` ${hold.side}` : '';
      out.push(`sesekali memegang ${SITE_LABEL[hold.site]}${side}`);
    } else out.push(content.appearance.cueLabels[cue] ?? cue);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Bahasa tubuh sesuai konteks percakapan
// ---------------------------------------------------------------------------

export type GestureCue =
  | { kind: 'angguk' }
  | { kind: 'geleng' }
  | { kind: 'bingung' }
  | { kind: 'pikir' }
  | { kind: 'salam' }
  | { kind: 'senyum' }
  | { kind: 'meringis' }
  | { kind: 'tunjuk'; site: BodySite; side: 'kiri' | 'kanan' }
  | { kind: 'seluruh_badan' }
  | { kind: 'peraga'; act: Demonstration };

const NEGATIVE = /^(nggak|tidak|belum|enggak|itu saja|sudah itu saja|kayaknya nggak)/i;
const UNSURE = /(mungkin|kayaknya|kurang tahu|lupa|nggak ingat|entah)/i;
const RECALL_TOPICS = new Set(['onset', 'durasi', 'episode_sebelumnya', 'riwayat_penyakit', 'riwayat_obat', 'riwayat_keluarga', 'bepergian_lingkungan', 'kebiasaan', 'haid_kehamilan']);
/** Pertanyaan perkenalan: dijawab ramah. */
const SOCIAL_TOPICS = new Set(['identitas_nama', 'identitas_umur', 'identitas_pekerjaan', 'identitas_status', 'harapan']);
/** Pertanyaan tentang pikiran/perasaan pasien. */
const REFLECT_TOPICS = new Set(['pendapat_pasien', 'kekhawatiran']);
const PAIN_TOPICS = new Set(['karakter', 'keparahan']);

/** Gestur peragaan untuk satu gejala yang ADA (tunjuk lokasi atau peragakan). */
function demonstrate(symptomId: string, c: PatientCase, content: GameContent): GestureCue | null {
  const act = content.appearance.demonstrations[symptomId];
  if (act) return { kind: 'peraga', act };
  const site = symptomSite(symptomId, content);
  if (site) return { kind: 'tunjuk', site, side: bodySide(c, content) };
  return null;
}

export interface ExchangeContext {
  /** Intent yang dijawab (dari NLU lokal atau alat pasien AI). */
  intents: readonly Intent[];
  /** Potongan jawaban per intent (urutan sama). */
  parts: readonly string[];
  /** Gejala yang BARU terungkap pada pertukaran ini. */
  newlyRevealed: readonly string[];
}

/**
 * Tentukan bahasa tubuh yang relevan dengan isi jawaban (bukan animasi acak):
 * menunjuk lokasi nyeri, memperagakan batuk/sesak, mengangguk/menggeleng, berpikir, bingung.
 */
export function planGestures(c: PatientCase, ctx: ExchangeContext, content: GameContent): GestureCue[] {
  const out: GestureCue[] = [];
  const side = bodySide(c, content);
  const push = (g: GestureCue | null) => {
    if (g && out.length < 3 && !out.some((x) => JSON.stringify(x) === JSON.stringify(g))) out.push(g);
  };
  if (ctx.intents.length === 0) return [{ kind: 'bingung' }];

  ctx.intents.forEach((intent, i) => {
    const text = ctx.parts[i] ?? '';
    switch (intent.kind) {
      case 'greeting':
        push({ kind: 'salam' });
        break;
      case 'thanks':
        push({ kind: 'senyum' });
        push({ kind: 'angguk' });
        break;
      case 'consent':
      case 'repeat':
        push({ kind: 'angguk' });
        break;
      case 'symptom':
      case 'symptom_detail': {
        if (c.symptoms.includes(intent.symptom)) {
          push({ kind: 'angguk' });
          push(demonstrate(intent.symptom, c, content));
        } else push(UNSURE.test(text) ? { kind: 'bingung' } : { kind: 'geleng' });
        break;
      }
      case 'review': {
        const group = content.reviewsById.get(intent.group);
        const present = (group?.symptoms ?? []).filter((s) => c.symptoms.includes(s));
        if (present.length === 0) push({ kind: 'geleng' });
        else {
          push({ kind: 'angguk' });
          push(demonstrate(present[0]!, c, content));
        }
        break;
      }
      case 'topic': {
        const topic = intent.topic;
        const site = chiefSite(c, content);
        if (topic === 'lokasi' || topic === 'keluhan_utama') {
          push(site ? { kind: 'tunjuk', site, side } : { kind: 'seluruh_badan' });
        } else if (topic === 'keluhan_lain') {
          const shown = ctx.newlyRevealed.map((s) => demonstrate(s, c, content)).filter((g): g is GestureCue => !!g);
          if (ctx.newlyRevealed.length === 0) push({ kind: 'geleng' });
          else if (shown.length === 0) push({ kind: 'pikir' });
          shown.slice(0, 2).forEach(push);
        } else if (PAIN_TOPICS.has(topic)) {
          const chief = c.chiefComplaintSymptoms[0];
          const demo = chief ? demonstrate(chief, c, content) : null;
          if (site && site !== 'dada' && site !== 'lengan' && site !== 'kaki') push({ kind: 'meringis' });
          push(demo);
        } else if (topic === 'alergi') {
          push(c.allergy ? { kind: 'angguk' } : { kind: 'geleng' });
        } else if (RECALL_TOPICS.has(topic)) {
          push({ kind: 'pikir' });
          if (NEGATIVE.test(text)) push({ kind: 'geleng' });
        } else if (SOCIAL_TOPICS.has(topic)) {
          push({ kind: 'senyum' });
          push({ kind: 'angguk' });
        } else if (REFLECT_TOPICS.has(topic)) {
          push({ kind: 'pikir' });
        }
        break;
      }
    }
  });
  return out;
}

/** Emosi sesaat yang sesuai dengan gestur (null = tetap emosi dasar). */
export function momentaryEmotion(gestures: readonly GestureCue[]): Emotion | null {
  if (gestures.some((g) => g.kind === 'bingung')) return 'bingung';
  if (gestures.some((g) => g.kind === 'meringis')) return 'kesakitan';
  if (gestures.some((g) => g.kind === 'senyum' || g.kind === 'salam')) return 'tenang';
  return null;
}

// ---------------------------------------------------------------------------
// Sinkronisasi mulut dengan teks jawaban
// ---------------------------------------------------------------------------

export interface SpeechFrame {
  /** Waktu mulai (detik). */
  t: number;
  /** Jumlah karakter teks yang sudah "terucap" sampai frame ini. */
  chars: number;
  /** Bukaan mulut 0..1. */
  open: number;
  /** Lebar mulut 0 (membulat, u/o) .. 1 (melebar, i/e). */
  wide: number;
}

export interface SpeechTimeline {
  frames: SpeechFrame[];
  duration: number;
}

const VOWEL: Record<string, [number, number]> = {
  a: [0.95, 0.6],
  e: [0.6, 0.85],
  i: [0.4, 1],
  o: [0.8, 0.15],
  u: [0.45, 0],
};
const CLOSED = new Set(['m', 'b', 'p']);

/**
 * Susun gerak mulut dari teks: vokal membuka mulut (a lebar, u membulat), konsonan bilabial menutup,
 * tanda baca memberi jeda. Durasi total sebanding dengan panjang teks, jadi mulut bergerak selama —
 * dan hanya selama — jawaban "diucapkan".
 */
export function speechTimeline(text: string, charsPerSecond: number): SpeechTimeline {
  const frames: SpeechFrame[] = [];
  const dt = 1 / Math.max(4, charsPerSecond);
  let t = 0;
  const chars = [...text];
  chars.forEach((raw, i) => {
    const ch = raw.toLowerCase();
    const spoken = i + 1;
    const v = VOWEL[ch];
    if (v) {
      frames.push({ t, chars: spoken, open: v[0], wide: v[1] });
      t += dt;
    } else if (/[a-z]/.test(ch)) {
      frames.push({ t, chars: spoken, open: CLOSED.has(ch) ? 0 : 0.22, wide: 0.5 });
      t += dt * 0.8;
    } else if (ch === ',' || ch === ';' || ch === ':') {
      frames.push({ t, chars: spoken, open: 0, wide: 0.5 });
      t += dt * 4;
    } else if (ch === '.' || ch === '!' || ch === '?' || ch === '…') {
      frames.push({ t, chars: spoken, open: 0, wide: 0.5 });
      // "..." (jeda napas / ragu) lebih panjang daripada akhir kalimat biasa.
      t += dt * (chars[i + 1] === '.' ? 3 : 6);
    } else {
      frames.push({ t, chars: spoken, open: 0.08, wide: 0.5 });
      t += dt * 0.6;
    }
  });
  frames.push({ t, chars: chars.length, open: 0, wide: 0.5 });
  return { frames, duration: t };
}

/** Bentuk mulut & jumlah karakter terucap pada waktu `time` (interpolasi antar-frame). */
export function sampleSpeech(tl: SpeechTimeline, time: number): { open: number; wide: number; chars: number; done: boolean } {
  const f = tl.frames;
  if (f.length === 0 || time >= tl.duration) return { open: 0, wide: 0.5, chars: f.at(-1)?.chars ?? 0, done: true };
  // Pencarian biner frame terakhir dengan t <= time.
  let lo = 0;
  let hi = f.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (f[mid]!.t <= time) lo = mid;
    else hi = mid - 1;
  }
  const a = f[lo]!;
  const b = f[Math.min(lo + 1, f.length - 1)]!;
  const span = Math.max(1e-6, b.t - a.t);
  const k = clamp((time - a.t) / span, 0, 1);
  return { open: a.open + (b.open - a.open) * k, wide: a.wide + (b.wide - a.wide) * k, chars: a.chars, done: false };
}
