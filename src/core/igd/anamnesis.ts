/**
 * Anamnesis di IGD: pasien (bila sadar & mampu bicara), keluarga, paramedis, atau saksi.
 *
 * Pertanyaan bebas dipahami dengan NLU mode praktik (topik & gejala), ditambah topik khas
 * kegawatdaruratan (SAMPLE: makan terakhir & kejadian/mekanisme). Jawaban pasien yang sesak
 * berat terpotong-potong; pasien yang tidak sadar tidak menjawab.
 */
import { interpretQuestion, resolveAlternatives } from '../nlu';
import type { GameContent } from '../types';
import { speech } from './assessment';
import type { EdPatient, EdScenario, InformantId, InformantSpec, Support, Vitals } from './types';

/** Pertanyaan cepat (SAMPLE + kegawatdaruratan). */
export const QUICK_QUESTIONS: readonly { topic: string; label: string; question: string }[] = [
  { topic: 'keluhan_utama', label: 'Keluhan', question: 'Apa yang dikeluhkan sekarang?' },
  { topic: 'onset', label: 'Sejak kapan', question: 'Sejak kapan keluhannya dan bagaimana mulainya?' },
  { topic: 'kejadian', label: 'Kejadian (E)', question: 'Bagaimana kejadiannya? Ceritakan kronologinya.' },
  { topic: 'alergi', label: 'Alergi (A)', question: 'Ada alergi obat atau makanan?' },
  { topic: 'riwayat_obat', label: 'Obat (M)', question: 'Obat apa saja yang rutin diminum atau baru diminum?' },
  { topic: 'riwayat_penyakit', label: 'Riwayat (P)', question: 'Ada riwayat penyakit sebelumnya? Pernah seperti ini?' },
  { topic: 'makan_terakhir', label: 'Makan terakhir (L)', question: 'Kapan terakhir makan atau minum?' },
  { topic: 'keluhan_lain', label: 'Keluhan lain', question: 'Ada keluhan lain yang menyertai?' },
  { topic: 'kebiasaan', label: 'Kebiasaan', question: 'Merokok, minum alkohol, atau memakai obat-obatan?' },
  { topic: 'haid_kehamilan', label: 'Haid/hamil', question: 'Kapan haid terakhir? Mungkin sedang hamil?' },
];

export const INFORMANT_NAME: Record<InformantId, string> = { pasien: 'Pasien', keluarga: 'Keluarga', paramedis: 'Paramedis', saksi: 'Saksi' };

/** Paramedis & saksi pergi setelah serah terima (menit sejak tiba). */
const LEAVES_AFTER_MIN: Partial<Record<InformantId, number>> = { paramedis: 25, saksi: 30 };

export interface InformantStatus {
  id: InformantId;
  label: string;
  available: boolean;
  reason?: string;
}

export function informants(patient: EdPatient, sc: EdScenario, v: Vitals, s: Support, now: number): InformantStatus[] {
  const out: InformantStatus[] = [];
  const minute = (now - patient.arriveAt) / 60;
  for (const id of ['pasien', 'keluarga', 'paramedis', 'saksi'] as const) {
    const spec = sc.informants[id];
    if (!spec && id !== 'pasien') continue;
    const label = spec?.label ?? (id === 'pasien' ? patient.address : INFORMANT_NAME[id]);
    if (id === 'pasien') {
      const sp = speech(patient.physio, v, s, now);
      const away = patient.awayUntil !== null && now < patient.awayUntil;
      if (away) out.push({ id, label, available: false, reason: 'sedang di radiologi' });
      else if (patient.physio.dead || patient.physio.arrest) out.push({ id, label, available: false, reason: 'tidak berespons' });
      else if (patient.age < 4) out.push({ id, label, available: false, reason: 'belum bisa ditanya' });
      else if (sp === 'tidak' || v.gcs.total < 12) out.push({ id, label, available: false, reason: s.adjunct === 'ett' ? 'terintubasi' : patient.physio.seizure ? 'sedang kejang' : 'kesadaran menurun' });
      else out.push({ id, label, available: true });
      continue;
    }
    const leave = LEAVES_AFTER_MIN[id];
    if (leave !== undefined && minute > leave) out.push({ id, label, available: false, reason: 'sudah kembali bertugas/pergi' });
    else out.push({ id, label, available: true });
  }
  return out;
}

const FALLBACK: Record<string, Record<'pasien' | 'lain', string>> = {
  alergi: { pasien: 'Setahu saya tidak ada alergi, Dok.', lain: 'Setahu saya tidak ada alergi, Dok.' },
  riwayat_obat: { pasien: 'Tidak ada obat rutin, Dok.', lain: 'Setahu saya tidak minum obat rutin.' },
  riwayat_penyakit: { pasien: 'Tidak ada sakit apa-apa sebelumnya, Dok.', lain: 'Setahu saya sehat-sehat saja, Dok.' },
  makan_terakhir: { pasien: 'Tadi siang, Dok, makan biasa.', lain: 'Tadi siang makan seperti biasa.' },
  kebiasaan: { pasien: 'Tidak, Dok.', lain: 'Setahu saya tidak, Dok.' },
  haid_kehamilan: { pasien: 'Tidak sedang hamil, Dok.', lain: 'Kurang tahu, Dok.' },
  riwayat_keluarga: { pasien: 'Tidak ada yang sakit serupa, Dok.', lain: 'Tidak ada, Dok.' },
  keluhan_lain: { pasien: 'Itu saja, Dok.', lain: 'Itu saja yang saya lihat, Dok.' },
  episode_sebelumnya: { pasien: 'Belum pernah seperti ini, Dok.', lain: 'Setahu saya belum pernah.' },
};

/** Topik khas IGD yang tidak dikenal NLU praktik. */
function edTopic(q: string): string | null {
  const t = q.toLowerCase();
  if (/(makan|minum)\s+terakhir|terakhir\s+(kali\s+)?(makan|minum)|sudah makan|puasa/.test(t)) return 'makan_terakhir';
  if (/kejadian|kronologi|bagaimana (ceritanya|kejadiannya|bisa)|apa yang terjadi|kecelakaan|jatuh(nya)?|ditabrak|tertabrak|dipukul|ditemukan/.test(t)) return 'kejadian';
  if (/alergi/.test(t)) return 'alergi';
  if (/(minum|pakai|konsumsi)\s+obat|obat (apa|rutin)|suntik insulin/.test(t)) return 'riwayat_obat';
  return null;
}

/** Ubah jawaban pasien yang sesak menjadi terputus-putus. */
function breathless(text: string, level: 'frasa' | 'kata'): string {
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  const keep = level === 'kata' ? 4 : 9;
  const head = words.slice(0, keep).join(' ').replace(/[.,;:!?]+$/, '');
  return level === 'kata' ? `${head}… (terengah-engah, hanya bisa beberapa kata)` : `${head}… (bicara terputus-putus, menarik napas)`;
}

export interface EdAnswer {
  text: string;
  topics: string[];
  understood: boolean;
}

function answerTopic(spec: InformantSpec | undefined, who: InformantId, topic: string): string | null {
  const own = spec?.topics[topic];
  if (own) return own;
  const fb = FALLBACK[topic];
  if (fb) return who === 'pasien' ? fb.pasien : fb.lain;
  return null;
}

/** Jawab pertanyaan (teks bebas atau topik cepat) dari narasumber tertentu. */
export function askInformant(question: string, topic: string | null, who: InformantId, patient: EdPatient, sc: EdScenario, v: Vitals, s: Support, now: number, content: GameContent): EdAnswer {
  const spec = who === 'pasien' ? (sc.informants.pasien ?? { topics: {} }) : sc.informants[who];
  const parts: string[] = [];
  const topics: string[] = [];
  const add = (txt: string | null, tp: string) => {
    if (!txt || parts.includes(txt)) return;
    parts.push(txt);
    topics.push(tp);
  };
  const direct = topic ?? edTopic(question);
  if (direct) add(answerTopic(spec, who, direct), direct);
  if (!direct || !parts.length) {
    const it = interpretQuestion(question, content, 3);
    for (const intent of resolveAlternatives(it.intents, (s) => Boolean(spec?.symptoms?.[s]))) {
      if (intent.kind === 'topic') add(answerTopic(spec, who, intent.topic) ?? (who === 'pasien' ? null : 'Kurang tahu, Dok.'), intent.topic);
      else if (intent.kind === 'symptom' || intent.kind === 'symptom_detail') {
        const yes = spec?.symptoms?.[intent.symptom];
        const label = content.symptomsById.get(intent.symptom)?.label ?? intent.symptom;
        if (yes) add(yes, `gejala:${intent.symptom}`);
        else add(who === 'pasien' ? `Tidak, Dok, tidak ada ${label.toLowerCase()}.` : who === 'paramedis' ? `Tidak dilaporkan ${label.toLowerCase()}.` : `Setahu saya tidak, Dok.`, `gejala:${intent.symptom}`);
      } else if (intent.kind === 'greeting') add(who === 'paramedis' ? 'Selamat malam, Dok.' : 'Iya, Dok.', 'sapaan');
      else if (intent.kind === 'consent') add('Iya, Dok, silakan.', 'izin');
      else if (intent.kind === 'thanks') add('Sama-sama, Dok.', 'terima_kasih');
    }
  }
  if (!parts.length) {
    return { text: who === 'paramedis' ? 'Maaf, Dok, maksudnya? Data yang saya punya sudah di lembar serah terima.' : 'Maaf, Dok, maksudnya bagaimana?', topics: [], understood: false };
  }
  let text = parts.join(' ');
  if (who === 'pasien') {
    const sp = speech(patient.physio, v, s, now);
    if (sp === 'frasa' || sp === 'kata') text = breathless(text, sp);
    if (v.gcs.total <= 13) text = `${text} (jawaban agak lambat dan bingung)`;
  }
  return { text, topics, understood: true };
}
