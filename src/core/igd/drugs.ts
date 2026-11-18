/**
 * Formularium obat IGD beserta efek farmakologisnya pada model fisiologi.
 *
 * Setiap obat: sediaan, rute, rentang dosis wajar (untuk menilai kurang/lebih),
 * efek (onset, puncak, durasi) dan peringatan keselamatan umum. Dosis mengikuti
 * pedoman yang dirujuk di docs/igd.md (AHA/ERC, ATLS, GINA, WAO, SSC, ADA, POGI, dsb.).
 *
 * Dosis berlebih tidak hanya diberi penalti: efeknya juga muncul pada pasien
 * (mis. adrenalin IV bolus pada pasien bernadi → hipertensi berat/aritmia).
 */
import { addMod, addRamp, clamp, eff, schedule, startArrest } from './physiology';
import type { Mod, PhysioState, Route, Support, Vitals } from './types';

export type DrugGroup = 'Resusitasi & vasoaktif' | 'Antiaritmia' | 'Pernapasan & alergi' | 'Antikonvulsan & sedatif' | 'Analgesik' | 'Kardiovaskular' | 'Metabolik & elektrolit' | 'Antimikroba' | 'Antidot' | 'Perdarahan & obstetri' | 'Lain-lain';

export interface DrugContext {
  p: PhysioState;
  s: Support;
  v: Vitals;
  dose: number;
  route: Route;
  now: number;
  kg: number;
  rand: () => number;
}

export interface DrugOutcome {
  /** Kejadian yang dicatat (mis. "Irama kembali sinus"). */
  note?: string;
  noteKind?: 'baik' | 'buruk' | 'info';
  /** Id peringatan keselamatan umum (lihat GENERIC_HARMS). */
  harms?: string[];
}

export interface DrugDef {
  id: string;
  name: string;
  group: DrugGroup;
  sediaan: string;
  /** Rute bolus/sekali beri. */
  routes: Route[];
  unit: string;
  /** Infus kontinu (titrasi). Laju dalam `unit`. */
  infusion?: { unit: string; perKg: boolean; presets: number[]; hint: string };
  /** Dosis lazim (petunjuk mode latihan & debrief). */
  hint: string;
  /** Rentang dosis wajar sekali beri untuk berat & rute; null = rute tidak lazim. */
  range: (kg: number, route: Route, p?: PhysioState) => [number, number] | null;
  apply: (c: DrugContext) => DrugOutcome;
  /** Target efek infus kontinu (sementara, hilang bila infus dihentikan). */
  drip?: (rate: number, kg: number, p: PhysioState) => Partial<Record<Mod['key'], number>>;
  /** Efek infus yang menumpuk (kadar obat/elektrolit, glukosa) per langkah waktu. */
  dripStep?: (rate: number, kg: number, p: PhysioState, dtMin: number) => void;
}

const kgr = (kg: number, lo: number, hi: number, cap?: number): [number, number] => [Math.min(lo * kg, cap ?? Infinity), Math.min(hi * kg, cap ?? Infinity)];
const adult = (kg: number) => kg >= 40;
const ratio = (dose: number, standard: number, cap = 2) => clamp(dose / standard, 0, cap);
const count = (p: PhysioState, id: string) => (p.doses[id] = (p.doses[id] ?? 0) + 1);

export const DRUGS: readonly DrugDef[] = [
  // ------------------------------------------------------------ Resusitasi & vasoaktif
  {
    id: 'adrenalin',
    name: 'Adrenalin (epinefrin)',
    group: 'Resusitasi & vasoaktif',
    sediaan: 'ampul 1 mg/ml (1:1000)',
    routes: ['im', 'iv', 'io'],
    unit: 'mg',
    infusion: { unit: 'mcg/menit', perKg: false, presets: [2, 5, 10], hint: '2–10 mcg/menit, titrasi' },
    hint: 'Anafilaksis: 0,01 mg/kg IM (maks 0,5 mg) di paha anterolateral, ulang tiap 5 menit. Henti jantung: 1 mg IV/IO tiap 3–5 menit.',
    range: (kg, route) => (route === 'im' ? kgr(kg, 0.01, 0.01, 0.5).map((x, i) => (i === 0 ? Math.min(x, 0.3) : x)) as [number, number] : route === 'iv' || route === 'io' ? (adult(kg) ? [1, 1] : kgr(kg, 0.01, 0.01, 1)) : null),
    apply: ({ p, v, dose, route, now, kg, rand }) => {
      const harms: string[] = [];
      if (p.arrest && (route === 'iv' || route === 'io')) {
        p.arrest.adrenalineDoses++;
        p.arrest.lastAdrenalineAt = now;
        return { note: 'Adrenalin diberikan (henti jantung).', noteKind: 'info' };
      }
      if (route === 'iv' || route === 'io') {
        // Bolus IV pada pasien bernadi: lonjakan katekolamin.
        const r = dose / (0.01 * kg);
        if (dose >= 0.1 || r > 1) {
          harms.push('adrenalin_iv_bolus');
          addMod(p, 'map', 45 * Math.min(2, r), now, 0.3, 3, 6, 'adrenalin IV');
          addMod(p, 'hr', 45, now, 0.3, 3, 6, 'adrenalin IV');
          if (rand() < Math.min(0.6, 0.18 * r) || dose >= 0.5) {
            startArrest(p, 'vf', 'primer', now + 60);
            return { note: 'Setelah bolus adrenalin IV pasien jatuh ke VF.', noteKind: 'buruk', harms };
          }
        }
        addMod(p, 'reaction', -0.5 * Math.min(1, r * 5), now, 1, 6, 8, 'adrenalin');
        addMod(p, 'tone', 0.3, now, 0.5, 5, 6, 'adrenalin');
        return { harms };
      }
      if (route !== 'im') return { harms: ['rute_tidak_tepat'] };
      const r = ratio(dose, Math.min(0.5, 0.01 * kg), 3);
      count(p, 'adrenalin');
      // Menghentikan pelepasan mediator & melawan vasodilatasi/bronkospasme.
      addRamp(p, 'reaction', -0.45 * Math.min(1, r), now, 2, 8, 'adrenalin IM');
      if (r >= 0.5) schedule(p, now + 180, 'reaction', 'rate', 'set', -0.003, 'adrenalin IM');
      addMod(p, 'tone', 0.28 * Math.min(1.3, r), now, 3, 10, 10, 'adrenalin IM');
      addMod(p, 'spasm', -0.3 * Math.min(1.2, r), now, 3, 12, 10, 'adrenalin IM');
      addMod(p, 'angioedema', -0.35 * Math.min(1, r), now, 4, 15, 10, 'adrenalin IM');
      addMod(p, 'hr', 15 * Math.min(1.5, r), now, 3, 8, 10, 'adrenalin IM');
      if (v.pulse && dose > 1) harms.push('overdosis');
      return { harms };
    },
    drip: (rate) => ({ tone: clamp(rate * 0.045, 0, 0.55), hr: clamp(rate * 3, 0, 45), pump: clamp(rate * 0.025, 0, 0.3), reaction: -clamp(rate * 0.06, 0, 0.5), spasm: -clamp(rate * 0.04, 0, 0.4) }),
  },
  {
    id: 'noradrenalin',
    name: 'Norepinefrin (noradrenalin)',
    group: 'Resusitasi & vasoaktif',
    sediaan: 'ampul 4 mg/4 ml — diencerkan dalam 50 ml',
    routes: [],
    unit: 'mcg/kg/menit',
    infusion: { unit: 'mcg/kg/menit', perKg: true, presets: [0.05, 0.1, 0.2, 0.3], hint: '0,05–0,5 mcg/kg/menit, titrasi ke MAP ≥ 65 mmHg' },
    hint: 'Vasopresor lini pertama syok septik: mulai 0,05–0,1 mcg/kg/menit, titrasi MAP ≥ 65.',
    range: () => null,
    apply: () => ({}),
    drip: (rate) => ({ tone: clamp(rate * 1.6, 0, 0.75), hr: clamp(rate * 25, 0, 12), pump: clamp(rate * 0.3, 0, 0.1) }),
  },
  {
    id: 'dopamin',
    name: 'Dopamin',
    group: 'Resusitasi & vasoaktif',
    sediaan: 'ampul 200 mg/5 ml — diencerkan',
    routes: [],
    unit: 'mcg/kg/menit',
    infusion: { unit: 'mcg/kg/menit', perKg: true, presets: [5, 10, 15], hint: '5–20 mcg/kg/menit' },
    hint: 'Bradikardia simtomatik (alternatif pacu): 5–20 mcg/kg/menit.',
    range: () => null,
    apply: () => ({}),
    drip: (rate) => ({ hr: clamp(rate * 1.8, 0, 35), tone: clamp(rate * 0.018, 0, 0.35), pump: clamp(rate * 0.015, 0, 0.25) }),
  },
  // ------------------------------------------------------------ Antiaritmia
  {
    id: 'amiodaron',
    name: 'Amiodaron',
    group: 'Antiaritmia',
    sediaan: 'ampul 150 mg/3 ml',
    routes: ['iv', 'io'],
    unit: 'mg',
    hint: 'VF/VT tanpa nadi: 300 mg bolus setelah kejut ke-3, lalu 150 mg. VT bernadi stabil: 150 mg dalam 10 menit.',
    range: (kg) => (adult(kg) ? [150, 300] : kgr(kg, 5, 5, 300)),
    apply: ({ p, dose, now, rand }) => {
      if (p.arrest) {
        p.arrest.amiodaroneMg += dose;
        return { note: `Amiodaron ${dose} mg diberikan.`, noteKind: 'info' };
      }
      addMod(p, 'tone', -0.1, now, 2, 10, 20, 'amiodaron');
      if ((p.rhythm === 'vt' || p.rhythm === 'af_rvr') && rand() < 0.45) {
        schedule(p, now + 600, 'k', 'v', 'add', 0, 'amiodaron');
        p.rhythm = 'sinus';
        p.rhythmRate = null;
        return { note: 'Irama kembali sinus setelah amiodaron.', noteKind: 'baik' };
      }
      return {};
    },
  },
  {
    id: 'adenosin',
    name: 'Adenosin',
    group: 'Antiaritmia',
    sediaan: 'vial 6 mg/2 ml',
    routes: ['iv'],
    unit: 'mg',
    hint: 'SVT stabil (setelah manuver vagal gagal): 6 mg IV cepat + bilas 20 ml, ulang 12 mg.',
    range: (kg) => (adult(kg) ? [6, 12] : kgr(kg, 0.1, 0.2, 12)),
    apply: ({ p, dose, now, rand }) => {
      const harms: string[] = [];
      if (eff(p, 'spasm', now) > 0.3) harms.push('adenosin_asma');
      if (p.rhythm === 'svt') {
        const chance = dose >= 12 ? 0.82 : dose >= 6 ? 0.62 : 0.2;
        if (rand() < chance) {
          p.rhythm = 'sinus';
          p.rhythmRate = null;
          return { note: 'Jeda asistol singkat, lalu irama kembali sinus.', noteKind: 'baik', harms };
        }
        return { note: 'Jeda singkat, SVT kembali.', noteKind: 'info', harms };
      }
      return { note: 'Blok AV sesaat, irama dasar tidak berubah.', noteKind: 'info', harms: [...harms, 'tanpa_indikasi_irama'] };
    },
  },
  {
    id: 'atropin',
    name: 'Sulfas atropin',
    group: 'Antiaritmia',
    sediaan: 'ampul 0,25 mg/ml',
    routes: ['iv', 'im', 'io'],
    unit: 'mg',
    infusion: { unit: 'mg/jam', perKg: false, presets: [1, 2, 3], hint: 'Organofosfat: rumatan 10–20% dosis atropinisasi per jam' },
    hint: 'Bradikardia simtomatik: 1 mg IV tiap 3–5 menit (maks 3 mg). Organofosfat: 1–2 mg IV, gandakan tiap 5 menit sampai sekret kering, lalu infus 10–20% total dosis/jam.',
    range: (kg, _route, p) => (p && p.v.cholinergic > 0.2 ? [1, 20] : adult(kg) ? [0.5, 2] : (kgr(kg, 0.02, 0.02, 0.5).map((x) => Math.max(0.1, x)) as [number, number])),
    apply: ({ p, dose, now }) => {
      count(p, 'atropin');
      const chol = eff(p, 'cholinergic', now);
      addMod(p, 'cholinergic', -Math.min(0.9, 0.22 * dose), now, 1, 20, 15, 'atropin');
      const blocked = p.rhythm === 'av_blok_total';
      addMod(p, 'hr', Math.min(45, 22 * dose) * (blocked ? 0.25 : 1) * (chol > 0.3 ? 0.4 : 1), now, 1, 12, 10, 'atropin');
      if (p.v.cholinergic < 0.15 && dose > 3) return { harms: ['overdosis'] };
      return {};
    },
    drip: (rate, _kg, p) => ({ cholinergic: -clamp(rate * 0.28, 0, 0.85), hr: clamp(rate * 6, 0, 25) * (p.v.cholinergic > 0.3 ? 0.3 : 1) }),
  },
  // ------------------------------------------------------------ Pernapasan & alergi
  {
    id: 'salbutamol',
    name: 'Salbutamol nebulisasi',
    group: 'Pernapasan & alergi',
    sediaan: 'nebul 2,5 mg/2,5 ml',
    routes: ['neb'],
    unit: 'mg',
    hint: '2,5–5 mg nebulisasi, dapat diulang tiap 20 menit pada jam pertama (atau kontinu).',
    range: (kg) => (kg >= 20 ? [2.5, 5] : [2.5, 2.5]),
    apply: ({ p, dose, now }) => {
      const n = count(p, 'salbutamol');
      const eff1 = Math.min(1.4, dose / 2.5) * Math.pow(0.82, n - 1);
      const spasm = eff(p, 'spasm', now);
      addRamp(p, 'spasm', -Math.min(spasm * 0.35, 0.13 * eff1), now, 3, 12, 'salbutamol');
      addMod(p, 'hr', 8 * Math.min(1.5, dose / 2.5), now, 5, 20, 20, 'salbutamol');
      addRamp(p, 'k', -0.12 * Math.min(2, dose / 2.5), now, 5, 20, 'salbutamol');
      return dose > 10 ? { harms: ['overdosis'] } : {};
    },
  },
  {
    id: 'ipratropium',
    name: 'Ipratropium bromida nebulisasi',
    group: 'Pernapasan & alergi',
    sediaan: 'nebul 0,5 mg/2 ml (atau kombinasi dengan salbutamol)',
    routes: ['neb'],
    unit: 'mg',
    hint: 'Eksaserbasi berat: 0,5 mg bersama salbutamol (tiap 20 menit, 3 kali).',
    range: (kg) => (kg >= 20 ? [0.25, 0.5] : [0.25, 0.25]),
    apply: ({ p, now }) => {
      const n = count(p, 'ipratropium');
      addRamp(p, 'spasm', -0.05 * Math.pow(0.8, n - 1), now, 5, 15, 'ipratropium');
      return {};
    },
  },
  {
    id: 'metilprednisolon',
    name: 'Metilprednisolon',
    group: 'Pernapasan & alergi',
    sediaan: 'vial 125 mg',
    routes: ['iv'],
    unit: 'mg',
    hint: 'Asma eksaserbasi berat: 40–125 mg IV (atau prednison 40–50 mg oral) dalam 1 jam pertama.',
    range: (kg) => (adult(kg) ? [40, 125] : kgr(kg, 1, 2, 60)),
    apply: ({ p, now }) => {
      count(p, 'steroid');
      // Efek antiinflamasi lambat (4–6 jam); di IGD terlihat sebagai perlambatan perburukan.
      schedule(p, now + 60 * 60, 'spasm', 'rate', 'mul', 0.3, 'steroid');
      addRamp(p, 'spasm', -0.08, now, 60, 120, 'steroid');
      return {};
    },
  },
  {
    id: 'hidrokortison',
    name: 'Hidrokortison',
    group: 'Pernapasan & alergi',
    sediaan: 'vial 100 mg',
    routes: ['iv'],
    unit: 'mg',
    hint: 'Asma berat: 100–200 mg IV. Anafilaksis: terapi tambahan (bukan pengganti adrenalin).',
    range: (kg) => (adult(kg) ? [100, 200] : kgr(kg, 4, 5, 100)),
    apply: ({ p, now }) => {
      count(p, 'steroid');
      schedule(p, now + 60 * 60, 'spasm', 'rate', 'mul', 0.3, 'steroid');
      addRamp(p, 'spasm', -0.07, now, 60, 120, 'steroid');
      return {};
    },
  },
  {
    id: 'deksametason',
    name: 'Deksametason',
    group: 'Pernapasan & alergi',
    sediaan: 'ampul 5 mg/ml',
    routes: ['iv', 'im', 'po'],
    unit: 'mg',
    hint: 'Croup, meningitis bakterial, eklampsia (pematangan paru janin). Tidak dianjurkan pada cedera kepala.',
    range: (kg) => (adult(kg) ? [5, 10] : kgr(kg, 0.15, 0.6, 10)),
    apply: ({ p, now }) => {
      count(p, 'steroid');
      schedule(p, now + 60 * 60, 'spasm', 'rate', 'mul', 0.4, 'steroid');
      addRamp(p, 'spasm', -0.06, now, 60, 120, 'steroid');
      return {};
    },
  },
  {
    id: 'mgso4',
    name: 'Magnesium sulfat (MgSO₄)',
    group: 'Pernapasan & alergi',
    sediaan: 'vial 20% (1 g/5 ml) / 40% (2 g/5 ml)',
    routes: ['iv'],
    unit: 'g',
    infusion: { unit: 'g/jam', perKg: false, presets: [1, 2], hint: 'Pemeliharaan eklampsia 1 g/jam' },
    hint: 'Asma berat tak respons: 2 g IV dalam 20 menit. Eklampsia: 4 g IV pelan (15–20 menit) lalu 1 g/jam.',
    range: (kg) => (adult(kg) ? [2, 4] : kgr(kg, 0.04, 0.05, 2)),
    apply: ({ p, dose, now, kg }) => {
      count(p, 'mgso4');
      addRamp(p, 'mg', (0.6 * dose * 70) / Math.max(10, kg), now, 0, 15, 'MgSO4');
      addRamp(p, 'spasm', -0.1 * Math.min(1, dose / 2), now, 10, 20, 'MgSO4');
      addMod(p, 'tone', -0.06, now, 5, 20, 20, 'MgSO4');
      return dose > 6 ? { harms: ['overdosis'] } : {};
    },
    dripStep: (rate, kg, p, dtMin) => {
      p.v.mg += ((0.6 * rate * 70) / Math.max(10, kg) / 60) * dtMin;
    },
  },
  {
    id: 'aminofilin',
    name: 'Aminofilin',
    group: 'Pernapasan & alergi',
    sediaan: 'ampul 240 mg/10 ml',
    routes: ['iv'],
    unit: 'mg',
    hint: 'Tidak dianjurkan rutin pada asma eksaserbasi (GINA): manfaat kecil, efek samping besar.',
    range: (kg) => kgr(kg, 5, 6, 400),
    apply: ({ p, now }) => {
      addRamp(p, 'spasm', -0.03, now, 10, 20, 'aminofilin');
      addMod(p, 'hr', 18, now, 5, 30, 30, 'aminofilin');
      return { harms: ['aminofilin'] };
    },
  },
  {
    id: 'difenhidramin',
    name: 'Difenhidramin',
    group: 'Pernapasan & alergi',
    sediaan: 'ampul 10 mg/ml',
    routes: ['iv', 'im'],
    unit: 'mg',
    hint: 'Antihistamin H1: hanya untuk gejala kulit/gatal; BUKAN pengganti adrenalin pada anafilaksis.',
    range: (kg) => (adult(kg) ? [10, 50] : kgr(kg, 1, 1, 50)),
    apply: ({ p, now }) => {
      addMod(p, 'sedation', 0.08, now, 5, 60, 30, 'difenhidramin');
      return {};
    },
  },
  // ------------------------------------------------------------ Antikonvulsan & sedatif
  {
    id: 'diazepam',
    name: 'Diazepam',
    group: 'Antikonvulsan & sedatif',
    sediaan: 'ampul 10 mg/2 ml; rektal 5 mg & 10 mg',
    routes: ['iv', 'pr'],
    unit: 'mg',
    hint: 'Kejang > 5 menit: 0,15–0,2 mg/kg IV (maks 10 mg), dapat diulang 1 kali; rektal 0,5 mg/kg (maks 10 mg).',
    range: (kg, route) => (route === 'pr' ? kgr(kg, 0.3, 0.5, 10) : kgr(kg, 0.15, 0.2, 10)),
    apply: ({ p, dose, route, now, kg, rand }) => {
      const n = count(p, 'benzodiazepin');
      const perKg = dose / kg;
      addMod(p, 'sedation', clamp(perKg * 1.5, 0.05, 0.5), now, route === 'pr' ? 6 : 1.5, 30, 60, 'diazepam');
      const harms: string[] = [];
      if (perKg > 0.45) harms.push('overdosis');
      if (n >= 3) harms.push('benzodiazepin_berulang');
      if (!p.seizure && p.memo.gcs < 13) harms.push('sedatif_kesadaran_turun');
      if (p.seizure) {
        const adequate = route === 'pr' ? perKg >= 0.25 : perKg >= 0.12;
        const chance = (adequate ? (route === 'pr' ? 0.6 : 0.68) : 0.25) * (n >= 2 ? 0.65 : 1);
        if (rand() < chance) {
          p.seizure = false;
          p.seizureEndsAt = null;
          return { note: 'Kejang berhenti setelah diazepam.', noteKind: 'baik', harms };
        }
        return { note: 'Kejang belum berhenti.', noteKind: 'buruk', harms };
      }
      return { harms };
    },
  },
  {
    id: 'midazolam',
    name: 'Midazolam',
    group: 'Antikonvulsan & sedatif',
    sediaan: 'ampul 5 mg/ml',
    routes: ['iv', 'im'],
    unit: 'mg',
    hint: 'Kejang: 10 mg IM (> 40 kg; 5 mg bila 13–40 kg) atau 0,1–0,2 mg/kg IV (maks 10 mg).',
    range: (kg, route) => (route === 'im' ? (kg > 40 ? [10, 10] : kg >= 13 ? [5, 5] : kgr(kg, 0.2, 0.2)) : kgr(kg, 0.1, 0.2, 10)),
    apply: ({ p, dose, route, now, kg, rand }) => {
      const n = count(p, 'benzodiazepin');
      const perKg = dose / kg;
      addMod(p, 'sedation', clamp(perKg * 2, 0.05, 0.55), now, route === 'im' ? 4 : 1, 30, 40, 'midazolam');
      const harms: string[] = [];
      if (perKg > 0.35) harms.push('overdosis');
      if (n >= 3) harms.push('benzodiazepin_berulang');
      if (!p.seizure && p.memo.gcs < 13) harms.push('sedatif_kesadaran_turun');
      if (p.seizure) {
        const adequate = perKg >= 0.1 || dose >= 5;
        const chance = (adequate ? 0.72 : 0.3) * (n >= 2 ? 0.65 : 1);
        if (rand() < chance) {
          p.seizure = false;
          p.seizureEndsAt = null;
          return { note: 'Kejang berhenti setelah midazolam.', noteKind: 'baik', harms };
        }
        return { note: 'Kejang belum berhenti.', noteKind: 'buruk', harms };
      }
      return { harms };
    },
  },
  {
    id: 'fenitoin',
    name: 'Fenitoin',
    group: 'Antikonvulsan & sedatif',
    sediaan: 'ampul 100 mg/2 ml',
    routes: ['iv'],
    unit: 'mg',
    hint: 'Lini kedua status epileptikus: 20 mg/kg IV (kecepatan ≤ 50 mg/menit), dalam NaCl 0,9%.',
    range: (kg) => kgr(kg, 18, 20, 1500),
    apply: ({ p, dose, now, kg, rand }) => {
      addMod(p, 'tone', -0.1, now, 5, 15, 15, 'fenitoin');
      addMod(p, 'hr', -8, now, 5, 15, 15, 'fenitoin');
      if (p.seizure) {
        const adequate = dose / kg >= 15;
        if (rand() < (adequate ? 0.55 : 0.2)) {
          schedule(p, now + 15 * 60, 'postictal', 'v', 'add', 0, 'fenitoin');
          p.seizure = false;
          p.seizureEndsAt = null;
          return { note: 'Kejang berhenti setelah infus fenitoin.', noteKind: 'baik' };
        }
        return { note: 'Kejang menetap setelah fenitoin.', noteKind: 'buruk' };
      }
      return {};
    },
  },
  {
    id: 'levetirasetam',
    name: 'Levetirasetam',
    group: 'Antikonvulsan & sedatif',
    sediaan: 'vial 500 mg/5 ml',
    routes: ['iv'],
    unit: 'mg',
    hint: 'Lini kedua status epileptikus: 60 mg/kg IV (maks 4500 mg) dalam 10 menit.',
    range: (kg) => kgr(kg, 40, 60, 4500),
    apply: ({ p, dose, kg, rand }) => {
      if (p.seizure) {
        if (rand() < (dose / kg >= 40 ? 0.55 : 0.25)) {
          p.seizure = false;
          p.seizureEndsAt = null;
          return { note: 'Kejang berhenti setelah levetirasetam.', noteKind: 'baik' };
        }
        return { note: 'Kejang menetap setelah levetirasetam.', noteKind: 'buruk' };
      }
      return {};
    },
  },
  // ------------------------------------------------------------ Analgesik
  {
    id: 'morfin',
    name: 'Morfin',
    group: 'Analgesik',
    sediaan: 'ampul 10 mg/ml',
    routes: ['iv', 'sc'],
    unit: 'mg',
    hint: 'Nyeri berat: 0,05–0,1 mg/kg IV titrasi (dewasa 2–4 mg, ulang tiap 5–10 menit).',
    range: (kg) => (adult(kg) ? [2, 5] : kgr(kg, 0.05, 0.1, 5)),
    apply: ({ p, s, v, dose, now, kg }) => {
      const perKg = dose / kg;
      addMod(p, 'pain', -clamp(perKg * 7, 0.15, 0.75), now, 5, 40, 40, 'morfin');
      addMod(p, 'sedation', clamp(perKg * 2.2, 0.03, 0.6), now, 5, 40, 40, 'morfin');
      addMod(p, 'tone', -0.05, now, 5, 30, 30, 'morfin');
      const harms: string[] = [];
      if (perKg > 0.2) harms.push('overdosis');
      if ((v.rr < 10 || (v.spo2 ?? 100) < 90 || v.gcs.total < 13) && !p.arrest && s.adjunct !== 'ett') harms.push('opioid_depresi_napas');
      if ((v.sbp ?? 0) < 90) harms.push('opioid_hipotensi');
      return { harms };
    },
  },
  {
    id: 'fentanil',
    name: 'Fentanil',
    group: 'Analgesik',
    sediaan: 'ampul 50 mcg/ml',
    routes: ['iv', 'in'],
    unit: 'mcg',
    hint: 'Nyeri berat (trauma): 0,5–1 mcg/kg IV titrasi; intranasal 1,5 mcg/kg pada anak.',
    range: (kg) => kgr(kg, 0.5, 1.5, 100),
    apply: ({ p, s, v, dose, now, kg }) => {
      const perKg = dose / kg;
      addMod(p, 'pain', -clamp(perKg * 0.5, 0.15, 0.7), now, 2, 25, 20, 'fentanil');
      addMod(p, 'sedation', clamp(perKg * 0.15, 0.02, 0.5), now, 2, 25, 20, 'fentanil');
      const harms: string[] = [];
      if (perKg > 3) harms.push('overdosis');
      if ((v.rr < 10 || (v.spo2 ?? 100) < 90 || v.gcs.total < 13) && !p.arrest && s.adjunct !== 'ett') harms.push('opioid_depresi_napas');
      return { harms };
    },
  },
  {
    id: 'ketorolak',
    name: 'Ketorolak',
    group: 'Analgesik',
    sediaan: 'ampul 30 mg/ml',
    routes: ['iv', 'im'],
    unit: 'mg',
    hint: 'Nyeri sedang–berat (kolik renal): 15–30 mg IV/IM. Hindari pada perdarahan, gangguan ginjal, kehamilan trimester III.',
    range: (kg) => (adult(kg) ? [15, 30] : kgr(kg, 0.5, 0.5, 15)),
    apply: ({ p, dose, now }) => {
      addMod(p, 'pain', -clamp(dose / 60, 0.15, 0.5), now, 15, 120, 60, 'ketorolak');
      const harms: string[] = [];
      if (eff(p, 'bleed', now) > 0.002 || p.v.atony > 0.2) harms.push('nsaid_perdarahan');
      if (dose > 60) harms.push('overdosis');
      return { harms };
    },
  },
  {
    id: 'parasetamol',
    name: 'Parasetamol',
    group: 'Analgesik',
    sediaan: 'infus 1 g/100 ml; tablet 500 mg; sirup 120 mg/5 ml',
    routes: ['iv', 'po', 'pr'],
    unit: 'mg',
    hint: '15 mg/kg (dewasa 1 g) tiap 6 jam, maks 4 g/hari.',
    range: (kg) => kgr(kg, 10, 15, 1000),
    apply: ({ p, dose, now, kg }) => {
      addMod(p, 'temp', -clamp(((p.v.temp - 37) * dose) / (15 * kg), 0, 1.2), now, 30, 120, 60, 'parasetamol');
      addMod(p, 'pain', -0.15, now, 20, 120, 60, 'parasetamol');
      return dose / kg > 25 ? { harms: ['overdosis'] } : {};
    },
  },
  // ------------------------------------------------------------ Kardiovaskular
  {
    id: 'aspirin',
    name: 'Asam asetilsalisilat (aspirin)',
    group: 'Kardiovaskular',
    sediaan: 'tablet 80 mg / 100 mg / 160 mg',
    routes: ['po'],
    unit: 'mg',
    hint: 'SKA: 160–320 mg dikunyah (loading), segera.',
    range: () => [160, 320],
    apply: ({ p, now }) => {
      if (count(p, 'aspirin') === 1) schedule(p, now + 10 * 60, 'ischemia', 'rate', 'mul', 0.75, 'aspirin');
      const harms: string[] = [];
      if (eff(p, 'bleed', now) > 0.002 || p.v.icp > 0.2) harms.push('antiplatelet_perdarahan');
      return { harms };
    },
  },
  {
    id: 'klopidogrel',
    name: 'Klopidogrel',
    group: 'Kardiovaskular',
    sediaan: 'tablet 75 mg',
    routes: ['po'],
    unit: 'mg',
    hint: 'SKA: loading 300–600 mg (600 mg bila rencana IKP primer; 300 mg bila fibrinolitik, 75 mg bila usia > 75 th).',
    range: () => [300, 600],
    apply: ({ p, now }) => {
      if (count(p, 'p2y12') === 1) schedule(p, now + 30 * 60, 'ischemia', 'rate', 'mul', 0.85, 'klopidogrel');
      const harms: string[] = [];
      if (eff(p, 'bleed', now) > 0.002 || p.v.icp > 0.2) harms.push('antiplatelet_perdarahan');
      return { harms };
    },
  },
  {
    id: 'tikagrelor',
    name: 'Tikagrelor',
    group: 'Kardiovaskular',
    sediaan: 'tablet 90 mg',
    routes: ['po'],
    unit: 'mg',
    hint: 'SKA: loading 180 mg (alternatif klopidogrel bila rencana IKP).',
    range: () => [180, 180],
    apply: ({ p, now }) => {
      if (count(p, 'p2y12') === 1) schedule(p, now + 20 * 60, 'ischemia', 'rate', 'mul', 0.82, 'tikagrelor');
      return {};
    },
  },
  {
    id: 'isdn',
    name: 'Isosorbid dinitrat (ISDN)',
    group: 'Kardiovaskular',
    sediaan: 'tablet sublingual 5 mg',
    routes: ['sl'],
    unit: 'mg',
    hint: 'Nyeri dada iskemik/edema paru: 5 mg SL, dapat diulang tiap 5 menit (maks 3 kali). Kontraindikasi: TDS < 90, infark ventrikel kanan, pemakaian sildenafil.',
    range: () => [5, 5],
    apply: ({ p, v, now }) => {
      addMod(p, 'tone', -0.12, now, 3, 15, 15, 'nitrat');
      addMod(p, 'pain', -0.25 * eff(p, 'ischemia', now) / Math.max(0.2, eff(p, 'ischemia', now) + 0.01), now, 3, 20, 15, 'nitrat');
      if (p.v.edema > 0.05) addRamp(p, 'edema', -Math.min(p.v.edema, 0.12), now, 3, 15, 'nitrat');
      const harms: string[] = [];
      if ((v.sbp ?? 0) < 90) harms.push('nitrat_hipotensi');
      if (p.v.volume < 0.85) harms.push('nitrat_hipovolemia');
      return { harms };
    },
  },
  {
    id: 'nitrogliserin',
    name: 'Nitrogliserin infus',
    group: 'Kardiovaskular',
    sediaan: 'ampul 10 mg/10 ml — dalam pompa suntik',
    routes: [],
    unit: 'mcg/menit',
    infusion: { unit: 'mcg/menit', perKg: false, presets: [10, 20, 50, 100], hint: '10–200 mcg/menit, titrasi tiap 3–5 menit' },
    hint: 'Edema paru akut hipertensif/SKA dengan nyeri menetap: mulai 10–20 mcg/menit, titrasi naik.',
    range: () => null,
    apply: () => ({}),
    drip: (rate) => ({ tone: -clamp(rate * 0.0022, 0, 0.35), edema: -clamp(rate * 0.004, 0, 0.45), pain: -clamp(rate * 0.003, 0, 0.3), hypertension: -clamp(rate * 0.003, 0, 0.5) }),
  },
  {
    id: 'furosemid',
    name: 'Furosemid',
    group: 'Kardiovaskular',
    sediaan: 'ampul 20 mg/2 ml',
    routes: ['iv'],
    unit: 'mg',
    hint: 'Edema paru dengan kelebihan cairan: 40–80 mg IV (atau 1–2,5× dosis oral harian).',
    range: (kg) => (adult(kg) ? [40, 80] : kgr(kg, 0.5, 1, 40)),
    apply: ({ p, v, dose, now }) => {
      const r = ratio(dose, 40, 2.5);
      addMod(p, 'tone', -0.05, now, 3, 10, 10, 'furosemid');
      addRamp(p, 'edema', -Math.min(p.v.edema, 0.18 * r), now, 10, 40, 'furosemid');
      addRamp(p, 'volume', -0.05 * r, now, 10, 60, 'furosemid');
      addRamp(p, 'k', -0.25 * r, now, 20, 90, 'furosemid');
      const harms: string[] = [];
      if (p.v.volume < 0.88 || (v.map ?? 0) < 65) harms.push('diuretik_hipovolemia');
      return { harms };
    },
  },
  {
    id: 'heparin',
    name: 'Heparin (UFH)',
    group: 'Kardiovaskular',
    sediaan: 'vial 5.000 IU/ml',
    routes: ['iv'],
    unit: 'IU',
    hint: 'STEMI dengan IKP primer: 70–100 IU/kg IV bolus; dengan fibrinolitik 60 IU/kg (maks 4.000 IU).',
    range: (kg) => kgr(kg, 60, 100, 5000),
    apply: ({ p, now }) => {
      if (count(p, 'antikoagulan') === 1) schedule(p, now + 10 * 60, 'ischemia', 'rate', 'mul', 0.88, 'heparin');
      const harms: string[] = [];
      if (eff(p, 'bleed', now) > 0.002 || p.v.icp > 0.2) harms.push('antikoagulan_perdarahan');
      return { harms };
    },
  },
  {
    id: 'enoksaparin',
    name: 'Enoksaparin',
    group: 'Kardiovaskular',
    sediaan: 'prefilled 60 mg/0,6 ml',
    routes: ['sc', 'iv'],
    unit: 'mg',
    hint: 'SKA: 1 mg/kg SC tiap 12 jam (fibrinolitik: 30 mg IV bolus lalu 1 mg/kg SC).',
    range: (kg, route) => (route === 'iv' ? [30, 30] : kgr(kg, 1, 1, 100)),
    apply: ({ p, now }) => {
      if (count(p, 'antikoagulan') === 1) schedule(p, now + 15 * 60, 'ischemia', 'rate', 'mul', 0.88, 'enoksaparin');
      const harms: string[] = [];
      if (eff(p, 'bleed', now) > 0.002 || p.v.icp > 0.2) harms.push('antikoagulan_perdarahan');
      return { harms };
    },
  },
  {
    id: 'streptokinase',
    name: 'Streptokinase',
    group: 'Kardiovaskular',
    sediaan: 'vial 1,5 juta IU — infus dalam 30–60 menit',
    routes: ['infus'],
    unit: 'juta IU',
    hint: 'STEMI < 12 jam bila IKP primer tidak tersedia < 120 menit: 1,5 juta IU dalam 30–60 menit.',
    range: () => [1.5, 1.5],
    apply: ({ p, now, rand }) => {
      addMod(p, 'tone', -0.18, now, 5, 25, 20, 'streptokinase');
      const harms: string[] = [];
      if (eff(p, 'bleed', now) > 0.002 || p.v.icp > 0.15 || p.stroke) harms.push('trombolitik_kontraindikasi');
      if (p.v.ischemia > 0.05 && rand() < 0.6) {
        addRamp(p, 'ischemia', -p.v.ischemia, now, 30, 30, 'reperfusi');
        schedule(p, now + 60 * 60, 'ischemia', 'rate', 'set', 0, 'reperfusi');
        return { note: 'Tanda reperfusi muncul (nyeri berkurang, elevasi ST turun > 50%).', noteKind: 'baik', harms };
      }
      return { harms };
    },
  },
  {
    id: 'alteplase',
    name: 'Alteplase (rtPA)',
    group: 'Kardiovaskular',
    sediaan: 'vial 50 mg',
    routes: ['infus'],
    unit: 'mg',
    hint: 'Stroke iskemik ≤ 4,5 jam tanpa kontraindikasi: 0,9 mg/kg (maks 90 mg), 10% bolus, sisanya 60 menit. TD harus < 185/110.',
    range: (kg) => kgr(kg, 0.85, 0.95, 90),
    apply: ({ p, v, dose, now, kg, rand }) => {
      const harms: string[] = [];
      if (eff(p, 'bleed', now) > 0.002 || p.v.icp > 0.15) harms.push('trombolitik_kontraindikasi');
      if ((v.sbp ?? 0) > 185 || (v.dbp ?? 0) > 110) harms.push('trombolitik_td_tinggi');
      if (dose / kg > 1.0) harms.push('overdosis');
      if (p.v.icp > 0.15) {
        addRamp(p, 'icp', 0.5, now, 10, 30, 'perdarahan akibat trombolitik');
        return { note: 'Kesadaran menurun setelah trombolitik — curiga perdarahan intrakranial meluas.', noteKind: 'buruk', harms };
      }
      if (p.stroke) {
        const sICH = (v.sbp ?? 0) > 185 ? 0.2 : 0.06;
        if (rand() < sICH) {
          addRamp(p, 'icp', 0.55, now, 30, 40, 'perdarahan simtomatik pasca-trombolisis');
          return { note: 'Nyeri kepala hebat & muntah setelah trombolisis — curiga transformasi perdarahan.', noteKind: 'buruk', harms };
        }
        if (rand() < 0.5) {
          p.stroke = { ...p.stroke, severity: p.stroke.severity * 0.4, aphasia: false };
          return { note: 'Kelemahan anggota gerak membaik setelah trombolisis.', noteKind: 'baik', harms };
        }
      }
      return { harms };
    },
  },
  {
    id: 'nifedipin',
    name: 'Nifedipin',
    group: 'Kardiovaskular',
    sediaan: 'tablet 10 mg',
    routes: ['po', 'sl'],
    unit: 'mg',
    hint: 'Hipertensi berat pada kehamilan (≥ 160/110): 10 mg oral, ulang tiap 20–30 menit (maks 30 mg). Jangan sublingual (penurunan mendadak).',
    range: () => [10, 10],
    apply: ({ p, route, now }) => {
      const harms: string[] = [];
      const fast = route === 'sl';
      addMod(p, 'hypertension', -0.35 * (fast ? 1.6 : 1), now, fast ? 3 : 15, 60, 60, 'nifedipin');
      addMod(p, 'tone', fast ? -0.25 : -0.06, now, fast ? 3 : 15, 60, 60, 'nifedipin');
      if (fast) harms.push('nifedipin_sublingual');
      if (p.stroke) harms.push('penurunan_td_stroke');
      return { harms };
    },
  },
  {
    id: 'nikardipin',
    name: 'Nikardipin infus',
    group: 'Kardiovaskular',
    sediaan: 'ampul 10 mg/10 ml — pompa suntik',
    routes: [],
    unit: 'mg/jam',
    infusion: { unit: 'mg/jam', perKg: false, presets: [2.5, 5, 10, 15], hint: 'mulai 5 mg/jam, naik 2,5 mg/jam tiap 5–15 menit (maks 15)' },
    hint: 'Perdarahan intraserebral (target TDS 140) / emergensi hipertensi: 5 mg/jam titrasi.',
    range: () => null,
    apply: () => ({}),
    drip: (rate) => ({ hypertension: -clamp(rate * 0.06, 0, 0.75), tone: -clamp(rate * 0.012, 0, 0.18) }),
  },
  {
    id: 'labetalol',
    name: 'Labetalol',
    group: 'Kardiovaskular',
    sediaan: 'ampul 100 mg/20 ml',
    routes: ['iv'],
    unit: 'mg',
    hint: 'Hipertensi berat (kehamilan/stroke): 10–20 mg IV, ulang 20–80 mg tiap 10 menit. Kontraindikasi: asma, bradikardia.',
    range: () => [10, 40],
    apply: ({ p, v, dose, now }) => {
      addMod(p, 'hypertension', -clamp(dose / 60, 0.1, 0.6), now, 5, 60, 60, 'labetalol');
      addMod(p, 'hr', -clamp(dose / 2, 5, 25), now, 5, 60, 60, 'labetalol');
      const harms: string[] = [];
      if (eff(p, 'spasm', now) > 0.2) harms.push('betabloker_asma');
      if (v.hr < 60) harms.push('betabloker_bradikardia');
      return { harms };
    },
  },
  {
    id: 'manitol',
    name: 'Manitol 20%',
    group: 'Kardiovaskular',
    sediaan: 'kolf 500 ml (100 g)',
    routes: ['iv'],
    unit: 'g',
    hint: 'Tanda herniasi/peningkatan TIK: 0,5–1 g/kg IV dalam 15–20 menit. Hindari pada hipotensi/hipovolemia.',
    range: (kg) => kgr(kg, 0.25, 1, 100),
    apply: ({ p, v, dose, now, kg }) => {
      const r = clamp(dose / (0.75 * kg), 0.3, 1.5);
      addMod(p, 'icp', -0.24 * r, now, 15, 120, 90, 'manitol');
      addRamp(p, 'volume', -0.04 * r, now, 30, 90, 'diuresis manitol');
      const harms: string[] = [];
      if ((v.sbp ?? 0) < 90 || p.v.volume < 0.8) harms.push('manitol_hipotensi');
      return { harms };
    },
  },
  {
    id: 'nacl3',
    name: 'NaCl 3% (hipertonik)',
    group: 'Kardiovaskular',
    sediaan: 'kolf 500 ml',
    routes: ['iv'],
    unit: 'ml',
    hint: 'Peningkatan TIK (terutama bila hipotensi): 3–5 ml/kg (dewasa ± 250 ml) dalam 15–20 menit.',
    range: (kg) => kgr(kg, 2.5, 5, 300),
    apply: ({ p, dose, now, kg }) => {
      const r = clamp(dose / (4 * kg), 0.3, 1.5);
      addMod(p, 'icp', -0.2 * r, now, 10, 120, 90, 'NaCl 3%');
      addRamp(p, 'volume', 0.03 * r, now, 0, 20, 'NaCl 3%');
      addRamp(p, 'na', 4 * r, now, 0, 20, 'NaCl 3%');
      return {};
    },
  },
  // ------------------------------------------------------------ Metabolik & elektrolit
  {
    id: 'dekstrosa40',
    name: 'Dekstrosa 40%',
    group: 'Metabolik & elektrolit',
    sediaan: 'flakon 25 ml (10 g)',
    routes: ['iv'],
    unit: 'ml',
    hint: 'Hipoglikemia: dewasa 25–50 ml D40% IV (anak: D10% 2–5 ml/kg), lalu cek ulang GDS 15 menit & pemeliharaan D10%.',
    range: (kg) => (adult(kg) ? [25, 50] : kgr(kg, 0.5, 1.25, 50)),
    apply: ({ p, dose, now, kg }) => {
      const grams = dose * 0.4;
      addRamp(p, 'glucose', grams * 7 * (70 / Math.max(8, kg)), now, 0.2, 2, 'D40%');
      const harms: string[] = [];
      if (!adult(kg)) harms.push('d40_anak');
      if (p.v.glucose > 180 && !p.v.keto) harms.push('dekstrosa_hiperglikemia');
      return { harms };
    },
  },
  {
    id: 'insulin',
    name: 'Insulin reguler (kerja pendek)',
    group: 'Metabolik & elektrolit',
    sediaan: 'vial 100 U/ml — pompa suntik 1 U/ml',
    routes: ['iv', 'sc'],
    unit: 'U',
    infusion: { unit: 'U/kg/jam', perKg: true, presets: [0.05, 0.1, 0.14], hint: '0,1 U/kg/jam (atau 0,14 tanpa bolus); turunkan saat GDS < 250' },
    hint: 'KAD: infus 0,1 U/kg/jam setelah K ≥ 3,5 mmol/L (koreksi K dulu bila < 3,5). Cairan dulu.',
    range: (kg) => kgr(kg, 0.05, 0.1, 10),
    apply: ({ p, dose, now, kg }) => {
      addRamp(p, 'glucose', -dose * 25 * (70 / Math.max(8, kg)), now, 5, 60, 'insulin bolus');
      addRamp(p, 'k', -0.2 * (dose / (0.1 * kg)), now, 5, 60, 'insulin bolus');
      const harms: string[] = [];
      if (eff(p, 'k', now) < 3.4) harms.push('insulin_hipokalemia');
      if (p.v.glucose < 200 && p.v.keto < 0.2) harms.push('insulin_tanpa_indikasi');
      return { harms };
    },
    dripStep: (rate, _kg, p, dtMin) => {
      const r = rate / 0.1;
      p.v.glucose -= r * 1.05 * (p.v.glucose / (p.v.glucose + 120)) * 1.6 * dtMin;
      p.v.keto -= r * 0.0042 * dtMin;
      p.v.k -= r * 0.0045 * dtMin;
    },
  },
  {
    id: 'kcl',
    name: 'Kalium klorida (KCl)',
    group: 'Metabolik & elektrolit',
    sediaan: 'flakon 7,46% 25 ml (25 mEq) — WAJIB diencerkan',
    routes: ['iv'],
    unit: 'mEq',
    infusion: { unit: 'mEq/jam', perKg: false, presets: [10, 20], hint: '10–20 mEq/jam perifer (maks 20 mEq/jam via vena sentral 40)' },
    hint: 'Hipokalemia/KAD dengan K < 5,0: 20–40 mEq per liter cairan, maks 10–20 mEq/jam perifer. JANGAN bolus.',
    range: () => [0, 0],
    apply: ({ p, dose, now }) => {
      // Bolus IV kalium = berbahaya (henti jantung).
      if (dose >= 5) {
        startArrest(p, 'vf', 'hipo_hiperkalemia', now + 20);
        return { note: 'Bolus KCl IV — pasien jatuh ke VF.', noteKind: 'buruk', harms: ['kcl_bolus'] };
      }
      return { harms: ['kcl_bolus'] };
    },
    dripStep: (rate, kg, p, dtMin) => {
      p.v.k += ((rate / 60) * 0.012 * 70) / Math.max(10, kg) * dtMin;
    },
  },
  {
    id: 'bikarbonat',
    name: 'Natrium bikarbonat 8,4%',
    group: 'Metabolik & elektrolit',
    sediaan: 'flakon 25 ml (25 mEq)',
    routes: ['iv'],
    unit: 'mEq',
    hint: 'Tidak rutin. KAD hanya bila pH < 7,0; hiperkalemia berat; intoksikasi trisiklik.',
    range: (kg) => kgr(kg, 1, 1, 100),
    apply: ({ p, v, dose, now }) => {
      addRamp(p, 'keto', -Math.min(p.v.keto, 0.0015 * dose), now, 5, 30, 'bikarbonat');
      addRamp(p, 'k', -0.004 * dose, now, 5, 30, 'bikarbonat');
      return v.ph >= 7.0 ? { harms: ['bikarbonat_tanpa_indikasi'] } : {};
    },
  },
  {
    id: 'kalsium',
    name: 'Kalsium glukonat 10%',
    group: 'Metabolik & elektrolit',
    sediaan: 'ampul 10 ml (1 g)',
    routes: ['iv'],
    unit: 'ml',
    hint: 'Antidot keracunan magnesium & stabilisasi membran pada hiperkalemia: 10–30 ml IV pelan (10 menit).',
    range: () => [10, 30],
    apply: ({ p, now }) => {
      if (p.v.mg > 7) addRamp(p, 'mg', -Math.min(p.v.mg - 5, 3), now, 2, 10, 'kalsium glukonat');
      return {};
    },
  },
  {
    id: 'tiamin',
    name: 'Tiamin (vitamin B1)',
    group: 'Metabolik & elektrolit',
    sediaan: 'ampul 100 mg/ml',
    routes: ['iv', 'im'],
    unit: 'mg',
    hint: 'Pasien malnutrisi/alkoholik dengan penurunan kesadaran: 100–500 mg IV (cegah ensefalopati Wernicke).',
    range: () => [100, 500],
    apply: () => ({}),
  },
  {
    id: 'oralit',
    name: 'Oralit',
    group: 'Metabolik & elektrolit',
    sediaan: 'sachet 200 ml',
    routes: ['po'],
    unit: 'ml',
    hint: 'Dehidrasi ringan–sedang: 75 ml/kg dalam 3 jam; setiap BAB cair: 100–200 ml (anak) / sesuka (dewasa).',
    range: (kg) => kgr(kg, 5, 75, 2000),
    apply: ({ p, dose, now, kg }) => {
      // Dicatat agar skenario diare tahu rehidrasi oral sudah dimulai (kehilangan cairan berkurang).
      count(p, 'oralit');
      addRamp(p, 'volume', (dose / (kg * 70)) * 0.25, now, 10, 60, 'oralit');
      return {};
    },
  },
  {
    id: 'zinc',
    name: 'Zinc',
    group: 'Metabolik & elektrolit',
    sediaan: 'tablet dispersibel 20 mg',
    routes: ['po'],
    unit: 'mg',
    hint: 'Diare anak: 10 mg (< 6 bulan) / 20 mg (≥ 6 bulan) per hari selama 10 hari.',
    range: (kg) => (kg < 7 ? [10, 10] : [20, 20]),
    apply: ({ p }) => {
      count(p, 'zinc');
      return {};
    },
  },
  // ------------------------------------------------------------ Antimikroba
  {
    id: 'seftriakson',
    name: 'Seftriakson',
    group: 'Antimikroba',
    sediaan: 'vial 1 g',
    routes: ['iv', 'im'],
    unit: 'mg',
    hint: 'Sepsis/pneumonia/meningitis: 2 g IV (anak 50–100 mg/kg). Profilaksis perdarahan varises (sirosis): 1 g/hari.',
    range: (kg) => (adult(kg) ? [1000, 2000] : kgr(kg, 50, 100, 2000)),
    apply: ({ p, now }) => {
      if (count(p, 'antibiotik') === 1 && p.v.infection > 0.05) {
        schedule(p, now + 45 * 60, 'infection', 'rate', 'set', -0.004, 'antibiotik');
        addRamp(p, 'infection', -0.06, now, 45, 90, 'antibiotik');
      }
      return {};
    },
  },
  {
    id: 'meropenem',
    name: 'Meropenem',
    group: 'Antimikroba',
    sediaan: 'vial 1 g',
    routes: ['iv'],
    unit: 'mg',
    hint: 'Sepsis berat dengan risiko kuman resisten: 1 g IV tiap 8 jam (anak 20 mg/kg).',
    range: (kg) => (adult(kg) ? [1000, 2000] : kgr(kg, 20, 40, 2000)),
    apply: ({ p, now }) => {
      if (count(p, 'antibiotik') === 1 && p.v.infection > 0.05) {
        schedule(p, now + 40 * 60, 'infection', 'rate', 'set', -0.0045, 'antibiotik');
        addRamp(p, 'infection', -0.07, now, 40, 90, 'antibiotik');
      }
      return {};
    },
  },
  {
    id: 'sefazolin',
    name: 'Sefazolin',
    group: 'Antimikroba',
    sediaan: 'vial 1 g',
    routes: ['iv'],
    unit: 'mg',
    hint: 'Profilaksis fraktur terbuka: 2 g IV (≥ 120 kg: 3 g) sesegera mungkin.',
    range: (kg) => (adult(kg) ? [1000, 2000] : kgr(kg, 30, 30, 2000)),
    apply: () => ({}),
  },
  {
    id: 'tetanus',
    name: 'Toksoid tetanus (TT/Td)',
    group: 'Antimikroba',
    sediaan: 'ampul 0,5 ml',
    routes: ['im'],
    unit: 'ml',
    hint: 'Profilaksis luka: 0,5 ml IM bila status imunisasi tidak lengkap/> 5–10 tahun.',
    range: () => [0.5, 0.5],
    apply: () => ({}),
  },
  {
    id: 'htig',
    name: 'Imunoglobulin tetanus (HTIG)',
    group: 'Antimikroba',
    sediaan: 'vial 250 IU',
    routes: ['im'],
    unit: 'IU',
    hint: 'Luka rawan tetanus + imunisasi tidak lengkap: 250 IU IM (di sisi berbeda dari TT).',
    range: () => [250, 500],
    apply: () => ({}),
  },
  // ------------------------------------------------------------ Antidot
  {
    id: 'nalokson',
    name: 'Nalokson',
    group: 'Antidot',
    sediaan: 'ampul 0,4 mg/ml',
    routes: ['iv', 'im', 'in'],
    unit: 'mg',
    hint: 'Depresi napas karena opioid: 0,04–0,4 mg IV titrasi (atau 2 mg IN), ulang tiap 2–3 menit. Efek 30–90 menit (lebih singkat dari opioid).',
    range: (kg, route) => (route === 'in' ? [2, 4] : adult(kg) ? [0.04, 0.4] : kgr(kg, 0.01, 0.1, 2)),
    apply: ({ p, dose, route, now }) => {
      const sed = eff(p, 'sedation', now);
      const r = route === 'in' ? dose / 5 : route === 'im' ? dose / 0.6 : dose / 0.3;
      addMod(p, 'sedation', -Math.min(0.85, 0.55 * Math.min(1.6, r)), now, route === 'iv' ? 1 : 4, 35, 25, 'nalokson');
      const harms: string[] = [];
      if (route === 'iv' && dose >= 1.5 && sed > 0.3) {
        addMod(p, 'anxiety', 0.6, now, 2, 30, 20, 'putus obat akut');
        addMod(p, 'hr', 25, now, 2, 30, 20, 'putus obat akut');
        harms.push('nalokson_putus_obat');
        return { note: 'Pasien bangun mendadak, gelisah, muntah — gejala putus opioid akut.', noteKind: 'buruk', harms };
      }
      return { harms };
    },
  },
  {
    id: 'pralidoksim',
    name: 'Pralidoksim (PAM)',
    group: 'Antidot',
    sediaan: 'vial 1 g',
    routes: ['iv'],
    unit: 'mg',
    hint: 'Organofosfat (bersama atropin): 30 mg/kg IV dalam 30 menit, lalu infus 8 mg/kg/jam.',
    range: (kg) => kgr(kg, 25, 35, 2000),
    apply: ({ p }) => {
      count(p, 'pralidoksim');
      return {};
    },
  },
  // ------------------------------------------------------------ Perdarahan & obstetri
  {
    id: 'asam_traneksamat',
    name: 'Asam traneksamat',
    group: 'Perdarahan & obstetri',
    sediaan: 'ampul 500 mg/5 ml',
    routes: ['iv'],
    unit: 'mg',
    hint: 'Trauma dengan perdarahan bermakna/HPP: 1 g IV dalam 10 menit, sedini mungkin (≤ 3 jam), lalu 1 g dalam 8 jam.',
    range: (kg) => (adult(kg) ? [1000, 1000] : kgr(kg, 15, 15, 1000)),
    apply: ({ p, now }) => {
      if (count(p, 'txa') === 1) {
        if (now / 60 <= 180 && p.v.bleed > 0) addRamp(p, 'bleed', -p.v.bleed * 0.22, now, 5, 15, 'asam traneksamat');
      }
      return {};
    },
  },
  {
    id: 'oksitosin',
    name: 'Oksitosin',
    group: 'Perdarahan & obstetri',
    sediaan: 'ampul 10 IU/ml',
    routes: ['im', 'iv'],
    unit: 'IU',
    hint: 'HPP: 10 IU IM/IV pelan, lanjut infus 20–40 IU dalam 1 L kristaloid. Jangan bolus IV cepat dosis besar.',
    range: () => [5, 10],
    apply: ({ p, dose, route, now }) => {
      const n = count(p, 'oksitosin');
      addRamp(p, 'atony', -Math.min(p.v.atony, 0.42 * Math.pow(0.6, n - 1)), now, route === 'iv' ? 1 : 3, 8, 'oksitosin');
      const harms: string[] = [];
      if (route === 'iv' && dose > 5) {
        addMod(p, 'tone', -0.15, now, 0.5, 2, 3, 'bolus oksitosin');
        harms.push('oksitosin_bolus');
      }
      return { harms };
    },
  },
  {
    id: 'misoprostol',
    name: 'Misoprostol',
    group: 'Perdarahan & obstetri',
    sediaan: 'tablet 200 mcg',
    routes: ['sl', 'pr', 'po'],
    unit: 'mcg',
    hint: 'HPP bila oksitosin tidak cukup: 800 mcg sublingual.',
    range: () => [600, 800],
    apply: ({ p, now }) => {
      addRamp(p, 'atony', -Math.min(p.v.atony, 0.25), now, 15, 20, 'misoprostol');
      addMod(p, 'temp', 0.6, now, 30, 60, 60, 'misoprostol');
      return {};
    },
  },
  {
    id: 'metilergometrin',
    name: 'Metilergometrin',
    group: 'Perdarahan & obstetri',
    sediaan: 'ampul 0,2 mg/ml',
    routes: ['im', 'iv'],
    unit: 'mg',
    hint: 'HPP: 0,2 mg IM. Kontraindikasi: hipertensi/preeklampsia, penyakit jantung.',
    range: () => [0.2, 0.2],
    apply: ({ p, v, now }) => {
      addRamp(p, 'atony', -Math.min(p.v.atony, 0.32), now, 3, 8, 'metilergometrin');
      addMod(p, 'hypertension', 0.35, now, 5, 60, 60, 'metilergometrin');
      return (v.sbp ?? 0) >= 140 ? { harms: ['ergometrin_hipertensi'] } : {};
    },
  },
  {
    id: 'omeprazol',
    name: 'Omeprazol/pantoprazol IV',
    group: 'Perdarahan & obstetri',
    sediaan: 'vial 40 mg',
    routes: ['iv'],
    unit: 'mg',
    hint: 'Perdarahan SCBA (curiga tukak): 80 mg IV bolus lalu 40 mg tiap 12 jam (atau 8 mg/jam).',
    range: () => [40, 80],
    apply: ({ p, now }) => {
      if (count(p, 'ppi') === 1) schedule(p, now + 30 * 60, 'bleed', 'v', 'mul', 0.85, 'PPI');
      return {};
    },
  },
  {
    id: 'oktreotid',
    name: 'Oktreotid',
    group: 'Perdarahan & obstetri',
    sediaan: 'ampul 100 mcg/ml',
    routes: ['iv'],
    unit: 'mcg',
    infusion: { unit: 'mcg/jam', perKg: false, presets: [25, 50], hint: '50 mcg/jam selama 2–5 hari' },
    hint: 'Curiga perdarahan varises: bolus 50 mcg IV lalu infus 50 mcg/jam (bersama antibiotik profilaksis).',
    range: () => [50, 100],
    apply: ({ p, now }) => {
      if (count(p, 'vasoaktif_splanknik') === 1) addRamp(p, 'bleed', -p.v.bleed * 0.55, now, 5, 20, 'oktreotid');
      return {};
    },
    drip: (rate, _kg, p) => ({ bleed: -Math.min(p.v.bleed * 0.3, p.v.bleed * (rate / 50) * 0.3) }),
  },
  {
    id: 'ondansetron',
    name: 'Ondansetron',
    group: 'Lain-lain',
    sediaan: 'ampul 4 mg/2 ml',
    routes: ['iv', 'po'],
    unit: 'mg',
    hint: 'Mual/muntah: 4–8 mg IV (anak 0,1–0,15 mg/kg).',
    range: (kg) => (adult(kg) ? [4, 8] : kgr(kg, 0.1, 0.15, 4)),
    apply: () => ({}),
  },
  {
    id: 'lidokain',
    name: 'Lidokain 2% (anestesi lokal)',
    group: 'Lain-lain',
    sediaan: 'ampul 2% (20 mg/ml)',
    routes: ['sc'],
    unit: 'mg',
    hint: 'Infiltrasi lokal: maks 4,5 mg/kg (7 mg/kg dengan epinefrin).',
    range: (kg) => kgr(kg, 1, 4.5, 300),
    apply: ({ p, dose, now, kg }) => {
      addMod(p, 'pain', -0.4, now, 2, 60, 30, 'lidokain lokal');
      return dose / kg > 4.5 ? { harms: ['overdosis'] } : {};
    },
  },
];

export const DRUGS_BY_ID = new Map(DRUGS.map((d) => [d.id, d]));

/** Peringatan keselamatan umum (lintas skenario). */
export const GENERIC_HARMS: Record<string, { label: string; severity: 'ringan' | 'sedang' | 'berat'; why: string }> = {
  overdosis: { label: 'Dosis melebihi batas aman', severity: 'sedang', why: 'Dosis di atas rentang yang dianjurkan untuk berat badan pasien.' },
  rute_tidak_tepat: { label: 'Rute pemberian tidak tepat', severity: 'sedang', why: 'Obat diberikan lewat rute yang tidak lazim untuk indikasi ini.' },
  adrenalin_iv_bolus: { label: 'Bolus adrenalin IV pada pasien bernadi', severity: 'berat', why: 'Pada anafilaksis lini pertama adalah IM 0,01 mg/kg. Bolus IV 1 mg hanya untuk henti jantung — pada pasien bernadi memicu krisis hipertensi, iskemia, dan aritmia ventrikel.' },
  adenosin_asma: { label: 'Adenosin pada bronkospasme aktif', severity: 'ringan', why: 'Adenosin dapat memicu bronkospasme pada asma.' },
  tanpa_indikasi_irama: { label: 'Adenosin bukan pada SVT', severity: 'ringan', why: 'Adenosin hanya mengonversi SVT reentri; pada irama lain hanya diagnostik.' },
  benzodiazepin_berulang: { label: 'Benzodiazepin > 2 dosis', severity: 'sedang', why: 'Setelah dua dosis benzodiazepin gagal, lanjutkan ke obat lini kedua (fenitoin/levetirasetam) — dosis berulang menambah depresi napas.' },
  sedatif_kesadaran_turun: { label: 'Sedatif pada penurunan kesadaran tanpa kejang', severity: 'sedang', why: 'Memperberat depresi napas & menutupi pemeriksaan neurologis.' },
  opioid_depresi_napas: { label: 'Opioid pada depresi napas/kesadaran', severity: 'berat', why: 'Opioid memperberat hipoventilasi; amankan napas & pertimbangkan analgesik lain.' },
  opioid_hipotensi: { label: 'Morfin pada hipotensi', severity: 'sedang', why: 'Morfin menyebabkan vasodilatasi & memperberat hipotensi.' },
  nsaid_perdarahan: { label: 'NSAID pada perdarahan aktif', severity: 'sedang', why: 'Ketorolak mengganggu fungsi trombosit dan ginjal.' },
  antiplatelet_perdarahan: { label: 'Antiplatelet pada perdarahan/curiga perdarahan intrakranial', severity: 'berat', why: 'Memperberat perdarahan.' },
  antikoagulan_perdarahan: { label: 'Antikoagulan pada perdarahan aktif', severity: 'berat', why: 'Memperberat perdarahan.' },
  trombolitik_kontraindikasi: { label: 'Trombolitik dengan kontraindikasi (perdarahan)', severity: 'berat', why: 'Perdarahan intrakranial/aktif adalah kontraindikasi absolut trombolisis.' },
  trombolitik_td_tinggi: { label: 'Trombolisis dengan TD > 185/110', severity: 'berat', why: 'Turunkan TD < 185/110 sebelum alteplase (risiko perdarahan simtomatik).' },
  nitrat_hipotensi: { label: 'Nitrat pada hipotensi', severity: 'berat', why: 'Nitrat dikontraindikasikan bila TDS < 90 mmHg.' },
  nitrat_hipovolemia: { label: 'Nitrat pada hipovolemia', severity: 'sedang', why: 'Venodilatasi menurunkan preload → hipotensi berat.' },
  diuretik_hipovolemia: { label: 'Diuretik pada hipovolemia/hipotensi', severity: 'sedang', why: 'Memperberat hipovolemia.' },
  betabloker_asma: { label: 'Penyekat beta pada bronkospasme', severity: 'berat', why: 'Memicu bronkospasme berat.' },
  betabloker_bradikardia: { label: 'Penyekat beta pada bradikardia', severity: 'sedang', why: 'Memperberat bradikardia.' },
  nifedipin_sublingual: { label: 'Nifedipin sublingual', severity: 'sedang', why: 'Penurunan TD mendadak tak terkendali (iskemia otak/jantung, gawat janin).' },
  penurunan_td_stroke: { label: 'Menurunkan TD agresif pada stroke iskemik', severity: 'sedang', why: 'Pada stroke iskemik tanpa trombolisis TD tidak diturunkan kecuali > 220/120 (penumbra bergantung perfusi).' },
  manitol_hipotensi: { label: 'Manitol pada hipotensi/hipovolemia', severity: 'sedang', why: 'Diuresis osmotik memperberat hipotensi — cedera otak sekunder. Pertimbangkan NaCl 3%.' },
  d40_anak: { label: 'Dekstrosa 40% pada anak', severity: 'sedang', why: 'Anak: gunakan D10% 2–5 ml/kg (larutan pekat merusak vena & hiperglikemia berbalik).' },
  dekstrosa_hiperglikemia: { label: 'Dekstrosa pada normo/hiperglikemia', severity: 'ringan', why: 'Tanpa hipoglikemia, dekstrosa memperburuk luaran (terutama stroke/cedera otak).' },
  insulin_hipokalemia: { label: 'Insulin sebelum kalium aman', severity: 'berat', why: 'ADA: bila K < 3,5 mmol/L, tunda insulin & koreksi kalium dulu — insulin memasukkan K ke sel → aritmia fatal.' },
  insulin_tanpa_indikasi: { label: 'Insulin tanpa indikasi', severity: 'sedang', why: 'Risiko hipoglikemia.' },
  kcl_bolus: { label: 'KCl bolus IV', severity: 'berat', why: 'Kalium TIDAK PERNAH diberikan bolus — harus diencerkan & diinfus (≤ 10–20 mEq/jam perifer).' },
  bikarbonat_tanpa_indikasi: { label: 'Bikarbonat tanpa indikasi', severity: 'ringan', why: 'Pada KAD hanya bila pH < 7,0; memperberat hipokalemia.' },
  aminofilin: { label: 'Aminofilin pada asma eksaserbasi', severity: 'ringan', why: 'Tidak dianjurkan (GINA): manfaat minimal, risiko aritmia/kejang.' },
  nalokson_putus_obat: { label: 'Nalokson dosis besar sekaligus', severity: 'ringan', why: 'Titrasi 0,04–0,4 mg untuk mengembalikan napas, bukan membangunkan penuh — dosis besar memicu putus obat akut, muntah, aspirasi.' },
  oksitosin_bolus: { label: 'Bolus oksitosin IV cepat', severity: 'ringan', why: 'Hipotensi mendadak; berikan IM atau infus.' },
  ergometrin_hipertensi: { label: 'Metilergometrin pada hipertensi', severity: 'berat', why: 'Vasokonstriktor kuat — risiko stroke/eklampsia.' },
  kejut_bernadi: { label: 'Defibrilasi tidak tersinkron pada pasien bernadi', severity: 'berat', why: 'Kejut tidak tersinkron dapat jatuh pada gelombang T dan memicu VF. Gunakan kardioversi tersinkron.' },
  kejut_tanpa_indikasi: { label: 'Kejut listrik pada irama non-shockable', severity: 'sedang', why: 'Asistol/PEA tidak didefibrilasi; lanjutkan RJP + adrenalin + cari penyebab.' },
  kardioversi_tanpa_indikasi: { label: 'Kardioversi pada irama sinus', severity: 'sedang', why: 'Tidak ada takiaritmia yang perlu dikonversi.' },
  ct_tidak_stabil: { label: 'Pasien tidak stabil dibawa ke CT', severity: 'berat', why: 'Stabilkan dulu (ABC) — "CT adalah terowongan kematian" bagi pasien syok/gagal napas.' },
  kristaloid_berlebih_perdarahan: { label: 'Kristaloid berlebihan pada perdarahan', severity: 'sedang', why: 'ATLS: batasi kristaloid (± 1 L) lalu darah — kristaloid berlebih menyebabkan koagulopati dilusi, hipotermia, asidosis.' },
  cairan_berlebih_jantung: { label: 'Cairan berlebih pada gangguan pompa jantung', severity: 'sedang', why: 'Memperberat edema paru.' },
  intubasi_tanpa_indikasi: { label: 'Intubasi tanpa indikasi', severity: 'sedang', why: 'Prosedur invasif berisiko (hipoksia, aspirasi, hipotensi pascainduksi).' },
  dekompresi_tanpa_indikasi: { label: 'Dekompresi jarum tanpa tension pneumotoraks', severity: 'sedang', why: 'Menimbulkan pneumotoraks iatrogenik & cedera.' },
  posisi_terlentang_sesak: { label: 'Pasien sesak dibaringkan datar', severity: 'ringan', why: 'Edema paru/asma lebih nyaman & efektif dalam posisi duduk.' },
  rjp_bernadi: { label: 'RJP pada pasien bernadi', severity: 'sedang', why: 'Kompresi dada hanya untuk henti jantung (atau nadi < 60 pada bayi dengan perfusi buruk).' },
  rjp_terhenti_lama: { label: 'Interupsi kompresi dada terlalu lama', severity: 'sedang', why: 'Fraksi kompresi dada harus > 80%; jeda cek nadi ≤ 10 detik.' },
  hentikan_resusitasi_dini: { label: 'Resusitasi dihentikan terlalu dini', severity: 'berat', why: 'Resusitasi dihentikan < 15 menit padahal penyebab (4H 4T) masih mungkin dikoreksi.' },
  oksigen_berlebih: { label: 'Oksigen aliran tinggi tanpa hipoksemia', severity: 'ringan', why: 'Hiperoksia tidak bermanfaat & dapat merugikan (mis. SKA dengan SpO₂ ≥ 90%).' },
};
