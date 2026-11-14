/**
 * Penilaian penalaran klinis satu konsultasi.
 *
 * Bukan hanya "diagnosis benar/salah": proses klinis dinilai per komponen dengan
 * bobot dari config.evaluation.weights (default 25/15/20/20/10/10):
 *
 *  1. Anamnesis   — kelengkapan topik (terutama topik kunci kasus) & gejala penyerta yang tergali.
 *  2. Fisik       — tanda vital lengkap + pemeriksaan terarah sesuai rencana kasus.
 *  3. Penunjang   — pemeriksaan sesuai indikasi (disesuaikan budget pasien); yang tidak perlu dikurangi.
 *  4. Banding     — diagnosis benar & banding penting dipertimbangkan, disingkirkan DENGAN bukti.
 *  5. Komplikasi  — tanda bahaya/komplikasi dinilai & diklasifikasikan dengan benar.
 *  6. Keputusan   — diagnosis utama, masalah lain (komorbid/insidental), dan disposisi.
 *
 * Semua ekspektasi berasal dari data penyakit (plan, differentials, complications,
 * disposition, pitfalls) sehingga penilaian bersifat spesifik kasus.
 */
import type { ConditionContext } from './conditions';
import { matchesCondition } from './conditions';
import { toolPrice, wrongPenalty } from './scoring';
import type {
  ClinicalDecision,
  ComponentScore,
  DiseaseTemplate,
  Disposition,
  EncounterState,
  EvaluationResult,
  EvidenceRef,
  FeedbackItem,
  GameConfig,
  GameContent,
  PlanItem,
} from './types';
import { DISPOSITIONS } from './types';

export const DISPOSITION_LABEL: Record<Disposition, string> = {
  rawat_jalan: 'Rawat jalan, edukasi & kontrol',
  observasi: 'Rawat jalan dengan pemantauan ketat / kontrol ulang',
  rujuk_spesialis: 'Rujuk ke spesialis (tidak darurat)',
  rujuk_segera: 'Rujuk segera / IGD',
};

const ROLE_WEIGHT: Record<PlanItem['role'], number> = { kunci: 3, pendukung: 1, komplikasi: 2 };
const EXAM_ROLE_WEIGHT: Record<PlanItem['role'], number> = { kunci: 2, pendukung: 1, komplikasi: 1.5 };

/** Konteks kondisi (hari, demografi, trait, gejala) untuk kasus yang sedang diperiksa. */
export function caseContext(state: EncounterState): ConditionContext {
  const c = state.case;
  return {
    day: c.day,
    sex: c.patient.sex,
    age: c.patient.age,
    occupationId: c.patient.occupationId,
    personality: c.patient.personalityId,
    traits: new Set(c.traits),
    symptoms: new Set(c.symptoms),
  };
}

/** Apakah pemain sudah mengumpulkan salah satu bukti ini? */
export function hasEvidence(ref: EvidenceRef | undefined, state: EncounterState): boolean {
  if (!ref) return false;
  if (ref.topics?.some((t) => state.askedTopics.includes(t))) return true;
  if (ref.symptoms?.some((s) => state.askedSymptoms.includes(s) || state.revealedSymptoms.includes(s))) return true;
  if (ref.tools?.some((t) => state.examsDone.includes(t))) return true;
  return false;
}

function describeEvidence(ref: EvidenceRef | undefined, content: GameContent): string {
  if (!ref) return '';
  const parts = [
    ...(ref.topics ?? []).map((t) => `tanya ${content.anamnesisById.get(t)?.label.toLowerCase() ?? t}`),
    ...(ref.symptoms ?? []).map((s) => `tanya ${content.symptomsById.get(s)?.label.toLowerCase() ?? s}`),
    ...(ref.tools ?? []).map((t) => content.toolsById.get(t)?.name ?? t),
  ];
  return parts.join(', ');
}

const toolName = (id: string, content: GameContent) => content.toolsById.get(id)?.name ?? id;
const conditionName = (id: string, content: GameContent) => content.catalogById.get(id)?.name ?? id;
const ratio = (earned: number, total: number) => (total <= 0 ? 1 : Math.max(0, Math.min(1, earned / total)));

function component(key: ComponentScore['key'], label: string, max: number, fraction: number, good: FeedbackItem[], missed: FeedbackItem[]): ComponentScore {
  return { key, label, max, score: Math.round(max * Math.max(0, Math.min(1, fraction)) * 10) / 10, good, missed };
}

/** Item rencana yang berlaku untuk kasus ini, digabung per group (cukup salah satu). */
interface ExpectedItem {
  tools: string[];
  weight: number;
  role: PlanItem['role'];
  reason: string;
}

function expectedItems(items: readonly PlanItem[], ctx: ConditionContext, weights: Record<PlanItem['role'], number>): ExpectedItem[] {
  const out: ExpectedItem[] = [];
  const groups = new Map<string, ExpectedItem>();
  for (const item of items) {
    if (!matchesCondition(item.when, ctx)) continue;
    const weight = weights[item.role];
    if (item.group) {
      const g = groups.get(item.group);
      if (g) {
        g.tools.push(item.tool);
        if (weight > g.weight) Object.assign(g, { weight, role: item.role });
        continue;
      }
      const created: ExpectedItem = { tools: [item.tool], weight, role: item.role, reason: item.reason };
      groups.set(item.group, created);
      out.push(created);
    } else {
      out.push({ tools: [item.tool], weight, role: item.role, reason: item.reason });
    }
  }
  return out;
}

/** Satu masalah lain (komorbiditas / temuan insidental) yang ada pada kasus. */
export interface SecondaryProblem {
  id: string;
  /**
   * Bukti yang BENAR-BENAR memperlihatkan masalah ini pada kasus: alat yang hasilnya abnormal
   * karena masalah tersebut, riwayat yang diketahui pasien, atau topik/gejala pendeteksi.
   */
  detectBy: EvidenceRef;
  /** false = tidak tampak pada pemeriksaan apa pun (tidak dituntut, tetapi tidak salah bila dicatat). */
  detectable: boolean;
}

/**
 * Masalah lain yang ADA pada kasus: komorbiditas (modul & trait penyakit) dan temuan insidental.
 * Hanya alat yang hasilnya memang abnormal akibat masalah itu yang dihitung sebagai pendeteksi,
 * sehingga pemain tidak dituntut menemukan sesuatu yang tertutup temuan penyakit utama.
 */
export function caseSecondaryProblems(state: EncounterState, disease: DiseaseTemplate, content: GameContent): SecondaryProblem[] {
  const c = state.case;
  const showsIn = (tool: string, origin: string | null) =>
    (c.findings[tool] ?? []).some((r) => r.source === 'disease' && (origin === null ? r.flag !== null : r.origin === origin));
  const out = new Map<string, SecondaryProblem>();
  const add = (id: string, base: EvidenceRef | undefined, origin: string | null, knownTopic?: string) => {
    const tools = (base?.tools ?? []).filter((t) => showsIn(t, origin));
    const topics = [...(knownTopic ? [knownTopic] : [])];
    const symptoms = (base?.symptoms ?? []).filter((s) => c.symptoms.includes(s));
    const detectBy: EvidenceRef = { tools, topics, symptoms };
    out.set(id, { id, detectBy, detectable: tools.length + topics.length + symptoms.length > 0 });
  };
  for (const cm of c.comorbidities) add(cm.id, content.comorbiditiesById.get(cm.id)?.detectBy, cm.id, cm.known ? 'riwayat_penyakit' : undefined);
  for (const [trait, id] of Object.entries(disease.traitComorbidities ?? {})) {
    // Komorbiditas bawaan penyakit (mis. hipertensi pada angina) — temuannya berasal dari aturan penyakit.
    if (c.traits.includes(trait) && !out.has(id)) add(id, content.comorbiditiesById.get(id)?.detectBy, null, 'riwayat_penyakit');
  }
  for (const id of c.incidentals) add(id, content.incidentalsById.get(id)?.detectBy, id);
  return [...out.values()];
}

/** Disposisi yang tepat untuk kasus ini (aturan pertama yang cocok). */
export function expectedDisposition(disease: DiseaseTemplate, ctx: ConditionContext): { value: Disposition; reason: string; alsoAccept: Disposition[] } {
  const rule = disease.disposition.find((r) => matchesCondition(r.when, ctx)) ?? disease.disposition[disease.disposition.length - 1]!;
  return { value: rule.value, reason: rule.reason, alsoAccept: rule.alsoAccept ?? [] };
}

/** Skor 0..1 untuk disposisi pilihan dibanding yang diharapkan (over-triage sebagian, under-triage nol). */
export function dispositionCredit(chosen: Disposition, expected: Disposition, alsoAccept: readonly Disposition[]): number {
  if (chosen === expected || alsoAccept.includes(chosen)) return 1;
  const diff = DISPOSITIONS.indexOf(chosen) - DISPOSITIONS.indexOf(expected);
  if (diff < 0) return 0; // under-triage
  return diff === 1 ? 0.6 : 0.3;
}

export function evaluateEncounter(
  state: EncounterState,
  decision: ClinicalDecision,
  content: GameContent,
  config: GameConfig,
): EvaluationResult {
  const c = state.case;
  const disease = content.diseasesById.get(c.diseaseId)!;
  const ctx = caseContext(state);
  const W = config.evaluation.weights;
  const components: ComponentScore[] = [];

  // ===================================================================== 1. ANAMNESIS
  {
    const good: FeedbackItem[] = [];
    const missed: FeedbackItem[] = [];
    const keyTopics = new Set(disease.plan.keyTopics ?? []);
    for (const [topic, answer] of Object.entries(c.answers)) if (answer.clue) keyTopics.add(topic);
    let earned = 0;
    let total = 0;
    const missedCore: string[] = [];
    for (const cat of content.anamnesis) {
      if (!cat.core) continue;
      const isKey = keyTopics.has(cat.id);
      const weight = (cat.weight ?? 1) + (isKey ? 1.5 : 0);
      total += weight;
      const asked = state.askedTopics.includes(cat.id);
      if (asked) {
        earned += weight;
        const clue = c.answers[cat.id]?.clue;
        if (clue) good.push({ text: `${cat.label}: ${clue}` });
      } else if (isKey) {
        const clue = c.answers[cat.id]?.clue;
        missed.push({ text: `Tidak menanyakan ${cat.label.toLowerCase()}`, detail: clue ? `Petunjuk yang terlewat: ${clue}.` : cat.why });
      } else if (cat.id === 'episode_sebelumnya' || cat.id === 'keluhan_lain') {
        missed.push({ text: `Tidak menanyakan ${cat.label.toLowerCase()}`, detail: cat.why });
      } else {
        missedCore.push(cat.label);
      }
    }
    if (missedCore.length) missed.push({ text: `Topik anamnesis lengkap yang belum ditanyakan: ${missedCore.join(', ')}.` });

    // Gejala penyerta / keluhan tambahan yang tergali.
    const clueSymptoms = new Set([...(disease.clueSymptoms ?? []), ...c.hiddenSymptoms]);
    const additional = c.symptoms.filter((s) => !c.chiefComplaintSymptoms.includes(s));
    const unrevealed: string[] = [];
    for (const s of additional) {
      const weight = clueSymptoms.has(s) ? 1 : 0.5;
      total += weight;
      if (state.revealedSymptoms.includes(s)) earned += weight;
      else unrevealed.push(s);
    }
    if (unrevealed.length) {
      const hidden = unrevealed.filter((s) => c.hiddenSymptoms.includes(s));
      missed.push({
        text: `Keluhan tambahan yang tidak tergali: ${unrevealed.map((s) => content.symptomsById.get(s)?.label ?? s).join(', ')}.`,
        detail: hidden.length
          ? `${hidden.map((s) => content.symptomsById.get(s)?.label ?? s).join(', ')} tidak disebut pasien secara spontan — harus ditanyakan spesifik.`
          : 'Tanyakan "keluhan lain" dan gejala spesifik yang relevan dengan diagnosis banding.',
      });
    } else if (additional.length) {
      good.push({ text: 'Semua keluhan tambahan berhasil digali.' });
    }
    components.push(component('anamnesis', 'Anamnesis', W.anamnesis, ratio(earned, total), good, missed));
  }

  // ===================================================================== 2. PEMERIKSAAN FISIK
  const comorbid = caseSecondaryProblems(state, disease, content);
  {
    const good: FeedbackItem[] = [];
    const missed: FeedbackItem[] = [];
    const items: ExpectedItem[] = [{ tools: ['tanda_vital'], weight: 3, role: 'kunci', reason: 'Tanda vital lengkap (TD, nadi, napas, suhu, SpO₂) wajib pada setiap pasien.' }];
    for (const it of expectedItems(disease.plan.exams, ctx, EXAM_ROLE_WEIGHT)) {
      if (!it.tools.includes('tanda_vital')) items.push(it);
    }
    // Pemeriksaan fisik yang mendeteksi komorbiditas kasus (mis. timbangan untuk obesitas).
    for (const p of comorbid) {
      for (const t of p.detectBy.tools ?? []) {
        if (content.toolsById.get(t)?.category === 'fisik' && !items.some((i) => i.tools.includes(t))) {
          items.push({ tools: [t], weight: 1, role: 'pendukung', reason: `Mendeteksi ${conditionName(p.id, content).toLowerCase()}.` });
        }
      }
    }
    let earned = 0;
    let total = 0;
    for (const it of items) {
      total += it.weight;
      const done = it.tools.some((t) => state.examsDone.includes(t));
      if (done) {
        earned += it.weight;
        good.push({ text: it.tools.map((t) => toolName(t, content)).join(' / '), detail: it.reason });
      } else {
        missed.push({ text: `Pemeriksaan yang seharusnya dilakukan: ${it.tools.map((t) => toolName(t, content)).join(' atau ')}`, detail: it.reason });
      }
    }
    components.push(component('fisik', 'Pemeriksaan fisik', W.fisik, ratio(earned, total), good, missed));
  }

  // ===================================================================== 3. PENUNJANG
  {
    const good: FeedbackItem[] = [];
    const missed: FeedbackItem[] = [];
    const items = expectedItems(disease.plan.tests, ctx, ROLE_WEIGHT);
    // Pemeriksaan yang mendeteksi komorbiditas/insidental yang ada juga relevan (bukan pemborosan).
    const detectTools = new Set(
      comorbid.flatMap((p) => [...(p.detectBy.tools ?? []), ...((content.comorbiditiesById.get(p.id) ?? content.incidentalsById.get(p.id))?.detectBy.tools ?? [])]),
    );
    const indicatedTools = new Set(items.flatMap((i) => i.tools));
    const total = items.reduce((s, i) => s + i.weight, 0);
    // Keadilan budget: bandingkan dengan bobot maksimum yang TERJANGKAU budget pasien.
    const affordable = maxAffordableWeight(items, c.patient.budget, config);
    let earned = 0;
    for (const it of items) {
      const done = it.tools.some((t) => state.examsDone.includes(t));
      const name = it.tools.map((t) => toolName(t, content)).join(' / ');
      if (done) {
        earned += it.weight;
        good.push({ text: name, detail: it.reason });
      } else {
        const cheapest = Math.min(...it.tools.map((t) => toolPrice(t, config)));
        const objective = content.toolsById.get(it.tools[0]!)?.purpose;
        missed.push({
          text: `${it.role === 'kunci' ? 'Pemeriksaan kunci' : it.role === 'komplikasi' ? 'Pemeriksaan untuk komplikasi/fungsi organ' : 'Pemeriksaan pendukung'} yang tidak dilakukan: ${name}`,
          detail: `${it.reason}${objective ? ` Kegunaan: ${objective}` : ''}${cheapest > c.patient.budget ? ' (Di luar budget pasien.)' : ''}`,
        });
      }
    }
    let penalty = 0;
    const unnecessary = new Map((disease.plan.unnecessary ?? []).map((u) => [u.tool, u.reason]));
    const optional = new Map((disease.plan.optional ?? []).map((u) => [u.tool, u.reason]));
    for (const t of state.examsDone) {
      if (toolPrice(t, config) <= 0 || indicatedTools.has(t)) continue;
      if (optional.has(t)) {
        good.push({ text: toolName(t, content), detail: `Boleh (tidak wajib): ${optional.get(t)}` });
        continue;
      }
      if (detectTools.has(t)) {
        good.push({ text: toolName(t, content), detail: 'Relevan untuk masalah lain yang ada pada pasien.' });
        continue;
      }
      if (unnecessary.has(t)) {
        penalty += config.evaluation.unnecessaryTestPenalty;
        missed.push({ text: `Pemeriksaan tidak perlu: ${toolName(t, content)}`, detail: unnecessary.get(t) });
      } else {
        penalty += config.evaluation.irrelevantTestPenalty;
        missed.push({ text: `Pemeriksaan kurang relevan: ${toolName(t, content)}`, detail: 'Tidak menjawab pertanyaan klinis utama kasus ini.' });
      }
    }
    // Catatan interpretasi: positif palsu & negatif palsu pada pemeriksaan yang dilakukan.
    for (const t of state.examsDone) {
      const results = c.findings[t] ?? [];
      for (const r of results.filter((x) => x.source === 'false_positive')) {
        missed.push({ text: `Interpretasi: ${toolName(t, content)} — ${r.label} ${r.display} adalah POSITIF PALSU`, detail: 'Tidak setiap hasil abnormal disebabkan penyakit pasien; nilai dalam konteks klinis.' });
      }
      // Negatif palsu dinilai pada parameter DIAGNOSTIK alat itu (mis. IgM dengue), bukan pada parameter
      // lain yang kebetulan abnormal (mis. IgG positif dari infeksi lama).
      const diagnosticParams = [...new Set(disease.findings.filter((f) => f.tool === t && f.diagnostic && matchesCondition(f.when, ctx)).map((f) => f.param))];
      if (diagnosticParams.length && !diagnosticParams.some((p) => results.find((x) => x.paramId === p)?.source === 'disease')) {
        const labels = diagnosticParams.map((p) => results.find((x) => x.paramId === p)?.label ?? p);
        missed.push({
          text: `Interpretasi: ${toolName(t, content)} NEGATIF PALSU pada kasus ini (${labels.join(', ')})`,
          detail: 'Sensitivitas tes tidak 100% — hasil negatif tidak otomatis menyingkirkan penyakit.',
        });
      }
    }
    const fraction = ratio(earned, Math.min(total, affordable)) - penalty / Math.max(1, W.penunjang);
    components.push(component('penunjang', 'Pemeriksaan penunjang', W.penunjang, total === 0 ? 1 - penalty / Math.max(1, W.penunjang) : fraction, good, missed));
  }

  // ===================================================================== 4. DIAGNOSIS BANDING
  {
    const good: FeedbackItem[] = [];
    const missed: FeedbackItem[] = [];
    const board = new Map(state.ddx.map((d) => [d.id, d.status]));
    if (decision.primary && !board.has(decision.primary)) board.set(decision.primary, 'utama');
    // Diagnosis yang benar ada di papan dan tidak disingkirkan.
    const trueStatus = board.get(disease.id);
    let trueScore = 0;
    if (trueStatus === 'utama') {
      trueScore = 1;
      good.push({ text: `${disease.name} dipertimbangkan sebagai diagnosis kerja.` });
    } else if (trueStatus === 'mungkin') {
      trueScore = 0.6;
      good.push({ text: `${disease.name} dipertimbangkan, tetapi tidak dijadikan diagnosis kerja.` });
    } else if (trueStatus === 'disingkirkan') {
      missed.push({ text: `Diagnosis yang benar (${disease.name}) justru disingkirkan.`, detail: 'Tinjau kembali temuan yang mendukungnya sebelum menyingkirkan.' });
    } else {
      missed.push({ text: `Diagnosis yang benar (${disease.name}) tidak masuk diagnosis banding.` });
    }
    let earned = 0;
    let total = 0;
    for (const diff of disease.differentials) {
      const weight = diff.mustNotMiss ? 2 : 1;
      total += weight;
      const status = board.get(diff.id);
      const name = conditionName(diff.id, content);
      if (!status) {
        missed.push({ text: `${diff.mustNotMiss ? 'Diagnosis berbahaya yang tidak dipertimbangkan' : 'Diagnosis banding terlewat'}: ${name}`, detail: diff.howToDistinguish });
        continue;
      }
      let credit = 0.5; // dipertimbangkan
      if (status === 'disingkirkan') {
        if (hasEvidence(diff.excludeBy, state)) {
          credit = 1;
          good.push({ text: `${name} disingkirkan dengan bukti.`, detail: diff.howToDistinguish });
        } else {
          credit = 0.3;
          missed.push({
            text: `${name} disingkirkan tanpa bukti yang memadai.`,
            detail: `Bukti yang dibutuhkan: ${describeEvidence(diff.excludeBy, content) || 'anamnesis/pemeriksaan pembeda'}. ${diff.howToDistinguish}`,
          });
        }
      } else if (status === 'utama') {
        credit = 0.5;
      } else {
        credit = 0.75;
        good.push({ text: `${name} dipertimbangkan (masih terbuka).`, detail: diff.howToDistinguish });
      }
      earned += weight * credit;
    }
    const fraction = 0.35 * trueScore + 0.65 * ratio(earned, total);
    components.push(component('banding', 'Diagnosis banding', W.banding, fraction, good, missed));
  }

  // ===================================================================== 5. KOMPLIKASI & TANDA BAHAYA
  {
    const good: FeedbackItem[] = [];
    const missed: FeedbackItem[] = [];
    let assessEarned = 0;
    let assessTotal = 0;
    let classEarned = 0;
    let classTotal = 0;
    const claimed = new Set(decision.primary === disease.id ? decision.complications : []);
    for (const cx of disease.complications ?? []) {
      const weight = cx.redFlag ? 2 : 1;
      const present = c.complications.includes(cx.id);
      assessTotal += weight;
      const assessed = hasEvidence(cx.assess, state);
      if (assessed) assessEarned += weight;
      else if (cx.redFlag || present) {
        missed.push({ text: `${cx.redFlag ? 'Tanda bahaya' : 'Komplikasi'} tidak dinilai: ${cx.name}`, detail: `Cara menilai: ${describeEvidence(cx.assess, content)}. ${cx.explanation}` });
      }
      classTotal += present ? 2 : 1;
      if (present && claimed.has(cx.id)) {
        classEarned += 2;
        good.push({ text: `Komplikasi dikenali: ${cx.name}`, detail: cx.explanation });
      } else if (present) {
        missed.push({ text: `Komplikasi yang ADA tetapi tidak dikenali: ${cx.name}`, detail: cx.explanation });
      } else if (claimed.has(cx.id)) {
        missed.push({ text: `Komplikasi yang diklaim tetapi tidak ada: ${cx.name}`, detail: 'Pastikan klaim komplikasi didukung temuan.' });
      } else {
        classEarned += 1;
      }
    }
    if (!(disease.complications ?? []).length) {
      assessTotal = classTotal = 1;
      assessEarned = classEarned = 1;
    }
    if (c.complications.length === 0 && claimed.size === 0 && decision.primary === disease.id) {
      good.push({ text: 'Kasus tanpa komplikasi dikenali dengan benar.' });
    }
    const fraction = 0.5 * ratio(assessEarned, assessTotal) + 0.5 * ratio(classEarned, classTotal);
    components.push(component('komplikasi', 'Komplikasi & tanda bahaya', W.komplikasi, fraction, good, missed));
  }

  // ===================================================================== 6. KEPUTUSAN
  const primaryCorrect = decision.primary === disease.id;
  const exp = expectedDisposition(disease, ctx);
  const unsafe = exp.value === 'rujuk_segera' && decision.disposition !== 'rujuk_segera';
  {
    const good: FeedbackItem[] = [];
    const missed: FeedbackItem[] = [];
    let fraction = primaryCorrect ? 0.6 : 0;
    if (primaryCorrect) good.push({ text: `Diagnosis utama tepat: ${disease.name}.` });
    else {
      const chosen = conditionName(decision.primary, content);
      const note =
        disease.differentials.find((d) => d.id === decision.primary)?.howToDistinguish ??
        content.diseasesById.get(decision.primary)?.differentials.find((d) => d.id === disease.id)?.howToDistinguish;
      missed.push({ text: `Diagnosis utama kurang tepat: ${chosen} (seharusnya ${disease.name}).`, detail: note });
    }
    // Masalah lain yang seharusnya tercatat: yang buktinya SUDAH dikumpulkan pemain.
    const secondary = comorbid;
    const expectedSecondary = secondary.filter((p) => p.detectable && hasEvidence(p.detectBy, state));
    const claimed = new Set(decision.secondary);
    let secEarned = 0;
    for (const p of expectedSecondary) {
      if (claimed.has(p.id)) {
        secEarned++;
        good.push({ text: `Masalah lain tercatat: ${conditionName(p.id, content)}` });
      } else {
        missed.push({ text: `Masalah lain yang ditemukan tetapi tidak dicatat: ${conditionName(p.id, content)}`, detail: secondaryNote(p.id, content) });
      }
    }
    for (const p of secondary.filter((x) => x.detectable && !hasEvidence(x.detectBy, state))) {
      missed.push({ text: `Masalah lain yang belum terdeteksi: ${conditionName(p.id, content)}`, detail: `Dapat ditemukan dengan: ${describeEvidence(p.detectBy, content)}. ${secondaryNote(p.id, content)}` });
    }
    const falseClaims = [...claimed].filter((id) => !secondary.some((p) => p.id === id));
    for (const id of falseClaims) missed.push({ text: `Masalah lain yang dicatat tetapi tidak ada: ${conditionName(id, content)}` });
    const secFraction = expectedSecondary.length ? secEarned / expectedSecondary.length : 1;
    fraction += 0.2 * Math.max(0, secFraction - 0.25 * falseClaims.length);
    const dispCredit = dispositionCredit(decision.disposition, exp.value, exp.alsoAccept);
    fraction += 0.2 * dispCredit;
    if (dispCredit === 1) good.push({ text: `Disposisi tepat: ${DISPOSITION_LABEL[decision.disposition]}.`, detail: exp.reason });
    else missed.push({ text: `Disposisi kurang tepat: ${DISPOSITION_LABEL[decision.disposition]} (seharusnya ${DISPOSITION_LABEL[exp.value]}).`, detail: exp.reason });
    if (unsafe) missed.push({ text: 'KESELAMATAN PASIEN: pasien yang perlu dirujuk segera tidak dirujuk.', detail: exp.reason });
    components.push(component('keputusan', 'Diagnosis akhir & tata laksana', W.keputusan, fraction, good, missed));
  }

  // ===================================================================== TOTAL
  const total = Math.round(components.reduce((s, x) => s + x.score, 0));
  const grades = [...config.evaluation.grades].sort((a, b) => b.min - a.min);
  const grade = grades.find((g) => total >= g.min) ?? grades[grades.length - 1]!;
  const R = config.reputation;
  const fromScore = Math.round((total - R.neutralScore) * R.perScorePoint);
  const wrongPrimary = primaryCorrect ? 0 : -wrongPenalty(disease, config);
  const unsafePenalty = unsafe ? -R.unsafeDispositionPenalty : 0;

  return {
    total,
    grade: grade.grade,
    gradeLabel: grade.label,
    components,
    primaryCorrect,
    trueId: disease.id,
    chosenId: decision.primary,
    expectedDisposition: exp.value,
    dispositionReason: exp.reason,
    unsafe,
    pitfalls: evaluatePitfalls(state, decision, disease),
    recommendations: recommendations(components),
    reputationDelta: fromScore + wrongPrimary + unsafePenalty,
    reputationBreakdown: { fromScore, wrongPrimary, unsafe: unsafePenalty },
    spent: state.spent,
  };
}

function secondaryNote(id: string, content: GameContent): string {
  return content.comorbiditiesById.get(id)?.summary ?? content.incidentalsById.get(id)?.note ?? '';
}

/** Bobot maksimum yang bisa dicapai dengan budget pasien (greedy berdasarkan bobot per rupiah). */
function maxAffordableWeight(items: readonly ExpectedItem[], budget: number, config: GameConfig): number {
  const priced = items
    .map((i) => ({ weight: i.weight, cost: Math.min(...i.tools.map((t) => toolPrice(t, config))) }))
    .sort((a, b) => (a.cost === 0 ? -1 : b.cost === 0 ? 1 : b.weight / b.cost - a.weight / a.cost));
  let left = budget;
  let weight = 0;
  for (const p of priced) {
    if (p.cost <= left) {
      left -= p.cost;
      weight += p.weight;
    }
  }
  return weight;
}

/** Asumsi klinis keliru yang terdeteksi (dari data pitfalls penyakit). */
export function evaluatePitfalls(state: EncounterState, decision: ClinicalDecision, disease: DiseaseTemplate): string[] {
  const c = state.case;
  const board = new Map(state.ddx.map((d) => [d.id, d.status]));
  const out: string[] = [];
  for (const p of disease.pitfalls ?? []) {
    const w = p.when;
    if (w.excluded && board.get(w.excluded) !== 'disingkirkan') continue;
    if (w.wrongPrimary && decision.primary === disease.id) continue;
    if (w.primaryIs && decision.primary !== w.primaryIs) continue;
    if (w.toolDone && !state.examsDone.includes(w.toolDone)) continue;
    if (w.toolNormal && (!state.examsDone.includes(w.toolNormal) || (c.findings[w.toolNormal] ?? []).some((r) => r.flag !== null))) continue;
    if (w.topicNotAsked && state.askedTopics.includes(w.topicNotAsked)) continue;
    if (w.traits && !w.traits.every((t) => c.traits.includes(t))) continue;
    if (w.notTraits && w.notTraits.some((t) => c.traits.includes(t))) continue;
    if (w.notConsidered && (board.has(w.notConsidered) || decision.primary === w.notConsidered)) continue;
    out.push(p.text);
  }
  return out;
}

const RECOMMENDATION: Record<ComponentScore['key'], string> = {
  anamnesis:
    'Gunakan kerangka anamnesis lengkap: onset, lokasi, karakter, durasi, keparahan, pola, perjalanan, pemberat/peringan, gejala penyerta, episode sebelumnya, riwayat penyakit/obat/alergi/keluarga, gaya hidup & lingkungan.',
  fisik: 'Mulai dari tanda vital lengkap, lalu pemeriksaan fisik terarah sesuai keluhan — termasuk pemeriksaan untuk komplikasi yang dicurigai.',
  penunjang:
    'Pilih pemeriksaan dengan tujuan yang jelas: memastikan diagnosis, menilai fungsi organ, struktur, atau komplikasi. Hindari pemeriksaan yang tidak mengubah keputusan.',
  banding: 'Susun minimal tiga diagnosis banding termasuk yang berbahaya, lalu singkirkan masing-masing dengan bukti anamnesis/pemeriksaan.',
  komplikasi: 'Setelah menemukan penyakit, tanyakan: apakah sudah ada komplikasi? Nilai tanda bahaya dan fungsi organ sebelum memutuskan.',
  keputusan: 'Tentukan disposisi berdasarkan derajat keparahan & tanda bahaya, dan catat semua masalah lain yang ditemukan (komorbid, temuan insidental).',
};

function recommendations(components: readonly ComponentScore[]): string[] {
  return [...components]
    .filter((x) => x.score / x.max < 0.7)
    .sort((a, b) => a.score / a.max - b.score / b.max)
    .map((x) => RECOMMENDATION[x.key]);
}
