/**
 * Penyusun dialog pasien: perkenalan, keluhan utama (sengaja tidak lengkap dan
 * sering kabur/menyesatkan), jawaban anamnesis, dan jawaban pertanyaan gejala.
 *
 * Semua fungsi deterministik: memakai RNG turunan dari seed kasus, sehingga
 * pertanyaan yang sama selalu dijawab sama untuk kasus yang sama.
 */
import type { ConditionContext } from './conditions';
import { matchesCondition } from './conditions';
import { createRng, deriveSeed, type Rng } from './rng';
import { capitalize, fillTemplate, joinList } from './text';
import type {
  AnswerResult,
  AnswerVariant,
  GameContent,
  PatientCase,
  PersonalityDef,
  PhraseStyle,
  SymptomDef,
} from './types';

/** Pilih satu frasa gejala sesuai gaya; jatuh ke 'lay' jika gaya itu tidak ada. */
export function symptomPhrase(symptom: SymptomDef, style: PhraseStyle, rng: Rng): string {
  const list = symptom.phrases[style] ?? symptom.phrases.lay;
  return rng.pick(list);
}

/**
 * Tambahkan kalimat pembuka/penutup khas kepribadian (dengan peluang affixRate),
 * hanya pada kategori yang diizinkan (affixCategories) agar tetap terdengar wajar.
 */
export function applyPersonalityAffix(
  text: string,
  personality: PersonalityDef,
  rng: Rng,
  categoryId?: string,
): string {
  const allowed = personality.affixCategories;
  if (allowed && (!categoryId || !allowed.includes(categoryId))) return text;
  if (!rng.chance(personality.affixRate)) return text;
  const prefixes = personality.answerPrefixes ?? [];
  const suffixes = personality.answerSuffixes ?? [];
  const usePrefix = prefixes.length > 0 && (suffixes.length === 0 || rng.chance(0.5));
  if (usePrefix) return `${rng.pick(prefixes)} ${text}`;
  if (suffixes.length > 0) return `${text} ${rng.pick(suffixes)}`;
  return text;
}

/** Susun kalimat keluhan utama. */
export function buildComplaint(
  symptoms: SymptomDef[],
  personality: PersonalityDef,
  values: Record<string, string>,
  rng: Rng,
): string {
  const fragments = symptoms.map((s) => {
    const style: PhraseStyle = s.phrases.vague && rng.chance(personality.vagueRate) ? 'vague' : personality.complaintStyle;
    return symptomPhrase(s, style, rng);
  });
  const frame = rng.pick(personality.complaintFrames);
  return fillTemplate(frame, { ...values, keluhan: joinList(fragments) });
}

/** Pilih varian jawaban yang kondisinya cocok (berbobot). */
export function pickVariant(variants: readonly AnswerVariant[], ctx: ConditionContext, rng: Rng): AnswerVariant | null {
  const eligible = variants.filter((v) => matchesCondition(v.when, ctx) && (v.weight ?? 1) > 0);
  if (eligible.length === 0) return null;
  return rng.weighted(eligible, (v) => v.weight ?? 1);
}

/** Jawaban untuk satu kategori anamnesis statis. */
export function buildCategoryAnswer(
  categoryId: string,
  variants: readonly AnswerVariant[] | undefined,
  fallback: readonly AnswerVariant[],
  personality: PersonalityDef,
  ctx: ConditionContext,
  values: Record<string, string>,
  rng: Rng,
): AnswerResult {
  const chosen = pickVariant(variants ?? [], ctx, rng) ?? pickVariant(fallback, ctx, rng);
  if (!chosen) return { text: 'Hmm, saya kurang tahu, Dok.' };
  const text = fillTemplate(applyPersonalityAffix(chosen.text, personality, rng, categoryId), values);
  const result: AnswerResult = { text };
  if (chosen.clue) result.clue = chosen.clue;
  if (chosen.reveals?.length) result.reveals = [...chosen.reveals];
  return result;
}

/** Nilai placeholder yang dipakai saat menjawab di tengah konsultasi. */
function caseValues(c: PatientCase, extra: Record<string, string> = {}): Record<string, string> {
  return { ...c.context, ...extra };
}

/**
 * Jawaban untuk "Ada keluhan lain?" — menyebut gejala berikutnya pada
 * `revealOrder` yang belum diketahui dokter (jumlah sesuai kepribadian).
 */
export function answerOtherComplaints(
  c: PatientCase,
  alreadyRevealed: readonly string[],
  content: GameContent,
): { text: string; revealed: string[] } {
  const personality = content.personalitiesById.get(c.patient.personalityId)!;
  const category = content.anamnesisById.get('keluhan_lain');
  const templates = category?.dynamicTemplates ?? { found: ['{Daftar}, Dok.'], none: ['Itu saja, Dok.'] };
  const rng = createRng(deriveSeed(c.seed, 'keluhan_lain'));

  const next = c.revealOrder.filter((id) => !alreadyRevealed.includes(id)).slice(0, personality.otherComplaintCount);
  if (next.length === 0) return { text: rng.pick(templates.none), revealed: [] };

  const fragments = next.map((id) => symptomPhrase(content.symptomsById.get(id)!, 'lay', rng));
  const text = fillTemplate(rng.pick(templates.found), caseValues(c, { daftar: joinList(fragments) }));
  return { text, revealed: next };
}

/**
 * Jawaban untuk pertanyaan gejala spesifik ("Apakah ada mimisan?").
 * `revealed` = true jika gejala benar ada dan pasien mengakuinya.
 */
export function answerSymptomQuestion(
  c: PatientCase,
  symptomId: string,
  content: GameContent,
): { text: string; revealed: boolean } {
  const personality = content.personalitiesById.get(c.patient.personalityId)!;
  const symptom = content.symptomsById.get(symptomId);
  if (!symptom) throw new Error(`Gejala tidak dikenal: ${symptomId}`);
  const rng = createRng(deriveSeed(c.seed, `tanya:${symptomId}`));

  if (c.symptoms.includes(symptomId)) {
    // Saat ditanya langsung, pasien mengonfirmasi dengan jelas (frasa kabur diganti awam).
    const style: PhraseStyle = personality.complaintStyle === 'vague' ? 'lay' : personality.complaintStyle;
    const phrase = symptomPhrase(symptom, style, rng);
    return { text: fillTemplate(rng.pick(personality.symptomYes), caseValues(c, { gejala: phrase })), revealed: true };
  }
  if (personality.symptomUncertain?.length && rng.chance(personality.uncertainAbsentRate)) {
    return { text: fillTemplate(rng.pick(personality.symptomUncertain), caseValues(c)), revealed: false };
  }
  return { text: fillTemplate(rng.pick(personality.symptomNo), caseValues(c)), revealed: false };
}

/** Pertanyaan dokter untuk kategori anamnesis, dengan sapaan pasien. */
export function doctorQuestion(template: string, c: PatientCase): string {
  return capitalize(fillTemplate(template, caseValues(c)));
}

/** Pilih satu templat percakapan secara deterministik (salt membedakan kejadian). */
function pickConversation(list: readonly string[], c: PatientCase, salt: string, values: Record<string, string> = {}): string {
  const rng = createRng(deriveSeed(c.seed, `percakapan:${salt}`));
  return fillTemplate(rng.pick(list), caseValues(c, values));
}

export type SmallTalk = 'greeting' | 'thanks' | 'consent' | 'unknown' | 'repeat' | 'alreadySaid';

/** Balasan basa-basi / pertanyaan tidak dipahami / awalan pengulangan. */
export function conversationReply(kind: SmallTalk, c: PatientCase, content: GameContent, salt: string): string {
  return pickConversation(content.conversation[kind], c, `${kind}:${salt}`);
}

/** Mengulang keluhan utama ("apa keluhannya?"). */
export function chiefComplaintReply(c: PatientCase, content: GameContent): string {
  // "Dok, tolong..." → hindari "Itu tadi, Dok. Dok, tolong..."
  const keluhanAwal = capitalize(c.complaint.replace(/^(dok(ter)?)[,.!…\s]+/i, ''));
  return pickConversation(content.conversation.chief, c, 'chief', { keluhanAwal });
}

/**
 * Pertanyaan detail (onset/keparahan/...) tentang gejala yang BUKAN keluhan utama.
 * Gejala ada → konfirmasi + detail umum; tidak ada → penyangkalan seperti pertanyaan gejala.
 */
export function answerSymptomDetail(
  c: PatientCase,
  topic: string,
  symptomId: string,
  content: GameContent,
): { text: string; revealed: boolean } {
  if (!c.symptoms.includes(symptomId)) return answerSymptomQuestion(c, symptomId, content);
  const symptom = content.symptomsById.get(symptomId)!;
  const rng = createRng(deriveSeed(c.seed, `detail:${topic}:${symptomId}`));
  const templates = content.conversation.detail[topic] ?? content.conversation.detail.default;
  const phrase = symptomPhrase(symptom, 'lay', rng);
  return { text: fillTemplate(rng.pick(templates), caseValues(c, { gejala: phrase })), revealed: true };
}

/**
 * Jawaban tinjauan sistem ("BAB-nya bagaimana?"): sebutkan gejala kelompok itu yang ADA
 * (termasuk yang tidak disebut sukarela), atau jawaban normal bila tidak ada.
 */
export function answerReview(
  c: PatientCase,
  groupId: string,
  content: GameContent,
): { text: string; revealed: string[] } {
  const group = content.reviewsById.get(groupId);
  if (!group) throw new Error(`Tinjauan sistem tidak dikenal: ${groupId}`);
  const personality = content.personalitiesById.get(c.patient.personalityId)!;
  const rng = createRng(deriveSeed(c.seed, `tinjauan:${groupId}`));
  const present = group.symptoms.filter((id) => c.symptoms.includes(id));
  if (present.length === 0) return { text: fillTemplate(rng.pick(group.normal), caseValues(c)), revealed: [] };
  const phrases = present.map((id) => symptomPhrase(content.symptomsById.get(id)!, 'lay', rng));
  return { text: fillTemplate(rng.pick(personality.symptomYes), caseValues(c, { gejala: joinList(phrases) })), revealed: present };
}
