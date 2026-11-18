/**
 * Model data CEDERA yang terlihat (luka, memar, luka bakar, ruam, bengkak, perdarahan) — dipakai
 * tampilan 3D untuk menggambar luka tepat di lokasi anatomisnya dan mensimulasikan perdarahan yang
 * konsisten dengan fisiologi pasien. Murni data (tanpa DOM/three), dapat diuji.
 *
 * Konvensi lokasi:
 * - `region` + `side` menentukan segmen tubuh; `at` = posisi sepanjang segmen 0 (proksimal/atas)
 *   … 1 (distal/bawah). Untuk kepala: 0 = puncak, 1 = setinggi telinga.
 * - `face` = arah keliling dalam derajat: 0 depan (anterior), 90 sisi luar/lateral, −90 sisi
 *   dalam/medial, 180 belakang. Untuk badan, kepala & leher: 90 = ke arah `side`.
 * - `size` = panjang × lebar dalam cm (panjang sejajar sumbu segmen bila `angle` 0).
 */
import type { PatientCase } from './types';

export type InjuryKind =
  /** Luka robek: tepi tidak rata, jembatan jaringan, sekitar lecet. */
  | 'laserasi'
  /** Luka bacok (senjata tajam berat): panjang, menganga, dalam sampai otot. */
  | 'bacok'
  /** Luka iris/sayat: tepi rata, kedua sudut lancip. */
  | 'iris'
  /** Luka tusuk: kecil, dalam, satu sudut lancip. */
  | 'tusuk'
  /** Bekas tusukan jarum multipel (needle tracks). */
  | 'bekas_suntik'
  /** Luka lecet (ekskoriasi). */
  | 'ekskoriasi'
  /** Memar (kontusio). */
  | 'memar'
  /** Hematoma: memar + benjolan. */
  | 'hematoma'
  /** Jejas: memar + lecet akibat benturan/sabuk. */
  | 'jejas'
  | 'luka_bakar'
  | 'petekie'
  | 'urtikaria'
  /** Bengkak tanpa luka terbuka (keseleo, fraktur tertutup). */
  | 'bengkak'
  /** Emfisema subkutis: bengkak lunak berkrepitasi. */
  | 'emfisema'
  /** Ulkus kronik. */
  | 'ulkus';

export type InjuryRegion =
  | 'kepala'
  | 'leher'
  | 'dada'
  | 'perut'
  | 'punggung'
  | 'bahu'
  | 'lengan_atas'
  | 'lengan_bawah'
  | 'telapak_tangan'
  | 'punggung_tangan'
  | 'paha'
  | 'tungkai_bawah'
  | 'pergelangan_kaki';

export type InjurySide = 'kiri' | 'kanan' | 'tengah';

export type BurnDepth = 'I' | 'II_superfisial' | 'II_dalam' | 'III';

export interface Bleeding {
  type: 'arteri' | 'vena' | 'kapiler';
  /** Porsi laju perdarahan fisiologis (physio.v.bleed) yang keluar lewat luka ini (0..1). */
  share?: number;
  /** Laju tetap (ml/menit) bila tidak terkait fisiologi. */
  mlPerMin?: number;
  /** Waktu paruh laju tetap (menit) — perdarahan kapiler/vena kecil berhenti sendiri. */
  halfLifeMin?: number;
}

export interface InjurySpec {
  id: string;
  kind: InjuryKind;
  region: InjuryRegion;
  side: InjurySide;
  at: number;
  face: number;
  /** Panjang × lebar (cm). */
  size: [number, number];
  /** Sudut sumbu panjang luka terhadap sumbu segmen (derajat). */
  angle?: number;
  depth?: 'superfisial' | 'subkutis' | 'otot';
  /** Mengelilingi lingkar segmen (mis. luka bakar sirkumferensial lengan). */
  circumferential?: boolean;
  burn?: BurnDepth;
  /** Umur memar (jam) → warna (merah-ungu → biru → hijau → kuning). */
  ageHours?: number;
  /** Tepi luka bersih (sudah diirigasi) — darah kering lebih sedikit. */
  clean?: boolean;
  bleeding?: Bleeding;
  /** Keterangan klinis (debrief/aksesibilitas). */
  label: string;
}

/** Tanda pada wajah (dilukis di kanvas wajah). Semua 0..1 kecuali disebut lain. */
export interface FaceMarks {
  /** Hematoma periorbita bilateral (racoon eyes). */
  racoonEyes?: number;
  /** Lecet pipi/dahi. */
  abrasion?: { side: InjurySide; spot: 'pipi' | 'dahi' | 'dagu'; size: number };
  /** Luka bakar wajah (eritema, bula). */
  burn?: number;
  /** Jelaga di hidung & mulut. */
  soot?: number;
  /** Alis & bulu hidung terbakar. */
  singedBrows?: boolean;
  /** Darah keluar dari hidung (epistaksis). */
  bloodNose?: number;
  /** Darah di sudut mulut (hematemesis/trauma). */
  bloodMouth?: number;
  /** Bengkak bibir (angioedema). */
  lipSwelling?: number;
  /** Kemerahan wajah (flushing). */
  flush?: number;
}

export interface InjuryProfile {
  wounds: InjurySpec[];
  face?: FaceMarks;
  /** Perdarahan pervaginam (pascapersalinan) — darah di perlak & sprei di antara paha. */
  vaginal?: Bleeding;
  /** Muntah darah — darah di mulut, baju, dan bengkok (nierbekken). */
  hematemesis?: Bleeding;
  /** Deformitas fraktur tulang panjang (pemendekan & rotasi eksternal tungkai). */
  fracture?: { side: 'kiri' | 'kanan'; bone: 'femur'; shortenCm: number; externalRotationDeg: number };
  /** Bagian pakaian yang dibuka/digunting untuk pemeriksaan (E — exposure). */
  expose?: {
    /** Badan tanpa baju (perempuan: tetap memakai penutup dada). */
    torso?: boolean;
    /** Lengan baju pendek. */
    shortSleeves?: boolean;
    /** Celana digunting/dilipat: ujung celana per tungkai (0 = pangkal paha … 1 = mata kaki). */
    legs?: { kiri?: number; kanan?: number };
  };
  /** Kain darurat yang diikat warga (basah darah) saat tiba. */
  improvisedWrap?: string;
  /** Isyarat tampilan tambahan (mis. ikterik). */
  cues?: { kuning?: number; pucat?: number };
}

// ---------------------------------------------------------------------------
// Pemetaan kasus poliklinik → cedera yang terlihat
// ---------------------------------------------------------------------------

/**
 * Cedera yang terlihat untuk kasus poliklinik (sesuai teks status lokalis kasus & sifatnya).
 * Mengembalikan null bila penyakit tidak punya luka yang tampak.
 */
export function caseInjuries(c: Pick<PatientCase, 'diseaseId' | 'traits'>): InjuryProfile | null {
  const t = new Set(c.traits);
  switch (c.diseaseId) {
    case 'vulnus':
      if (t.has('punctum')) return null; // luka tusuk telapak kaki tertutup alas kaki
      return {
        wounds: [
          {
            id: 'vl',
            kind: 'laserasi',
            region: 'lengan_bawah',
            side: 'kanan',
            at: 0.45,
            face: 20,
            size: [4, 0.5],
            angle: 12,
            depth: 'otot',
            bleeding: { type: 'kapiler', mlPerMin: 0.3, halfLifeMin: 40 },
            label: 'Vulnus laseratum 4 × 0,5 cm di antebrachii dekstra, tepi tidak rata, jembatan jaringan, perdarahan minimal',
          },
        ],
        expose: { shortSleeves: true },
      };
    case 'kekerasan_tajam': {
      const wounds: InjurySpec[] = [];
      if (t.has('tusuk_rongga')) {
        wounds.push({ id: 'tusuk', kind: 'tusuk', region: 'perut', side: 'kanan', at: 0.25, face: 35, size: [2, 0.5], angle: 70, depth: 'otot', bleeding: { type: 'vena', mlPerMin: 1.2, halfLifeMin: 60 }, label: 'Luka tusuk 2 cm di hipokondrium kanan' });
      } else {
        wounds.push({ id: 'iris', kind: 'iris', region: 'lengan_bawah', side: 'kiri', at: 0.5, face: 150, size: [5, 0.6], angle: 25, depth: 'otot', bleeding: { type: 'kapiler', mlPerMin: 0.4, halfLifeMin: 40 }, label: 'Luka iris 5 cm lengan bawah kiri sisi ekstensor, tepi rata, sudut lancip' });
      }
      if (t.has('luka_tangkis')) wounds.push({ id: 'tangkis', kind: 'iris', region: 'telapak_tangan', side: 'kanan', at: 0.5, face: 0, size: [2, 0.3], angle: 60, depth: 'subkutis', label: 'Luka iris 2 cm telapak tangan kanan (luka tangkis)' });
      return { wounds, expose: { shortSleeves: !t.has('tusuk_rongga') } };
    }
    case 'kekerasan_tumpul': {
      const wounds: InjurySpec[] = [
        { id: 'memar_lengan', kind: 'memar', region: 'lengan_atas', side: 'kiri', at: 0.45, face: 90, size: [5, 4], ageHours: 30, label: 'Memar kebiruan 5 × 4 cm lengan atas kiri sisi luar (pola jari)' },
      ];
      if (t.has('fraktur_curiga')) wounds.push({ id: 'bengkak_lb', kind: 'bengkak', region: 'lengan_bawah', side: 'kiri', at: 0.5, face: 0, size: [9, 6], label: 'Bengkak sepertiga tengah lengan bawah kiri (curiga fraktur)' });
      return { wounds, face: { abrasion: { side: 'kiri', spot: 'pipi', size: 0.7 } }, expose: { shortSleeves: true } };
    }
    case 'luka_bakar': {
      if (t.has('luas')) {
        return {
          wounds: [
            { id: 'lb_dada', kind: 'luka_bakar', region: 'dada', side: 'tengah', at: 0.55, face: 0, size: [30, 26], burn: 'II_superfisial', label: 'Luka bakar derajat II superfisial dada' },
            { id: 'lb_perut', kind: 'luka_bakar', region: 'perut', side: 'tengah', at: 0.45, face: 0, size: [26, 20], burn: 'II_superfisial', label: 'Luka bakar derajat II superfisial perut' },
            { id: 'lb_la', kind: 'luka_bakar', region: 'lengan_bawah', side: 'kiri', at: 0.4, face: 0, size: [18, 10], circumferential: true, burn: 'II_superfisial', label: 'Luka bakar derajat II superfisial lengan kiri' },
            { id: 'lb_lb', kind: 'luka_bakar', region: 'lengan_bawah', side: 'kanan', at: 0.4, face: 0, size: [18, 10], circumferential: true, burn: 'II_superfisial', label: 'Luka bakar derajat II superfisial lengan kanan' },
          ],
          expose: { torso: true },
        };
      }
      if (t.has('derajat2') && t.has('knalpot')) {
        return { wounds: [{ id: 'knalpot', kind: 'luka_bakar', region: 'tungkai_bawah', side: 'kanan', at: 0.42, face: 70, size: [9, 6], burn: 'II_superfisial', label: 'Luka bakar knalpot derajat II superfisial betis kanan' }], expose: { legs: { kanan: 0.42 } } };
      }
      if (t.has('derajat2') && t.has('tersiram_anak')) {
        return {
          wounds: [
            { id: 'siram_dada', kind: 'luka_bakar', region: 'dada', side: 'kanan', at: 0.5, face: 25, size: [16, 12], angle: 20, burn: 'II_superfisial', label: 'Luka bakar tersiram dada kanan' },
            { id: 'siram_lengan', kind: 'luka_bakar', region: 'lengan_atas', side: 'kanan', at: 0.45, face: 60, size: [10, 7], burn: 'II_superfisial', label: 'Luka bakar tersiram lengan kanan atas' },
          ],
          expose: { torso: true },
        };
      }
      if (t.has('derajat2')) {
        return { wounds: [{ id: 'tangan', kind: 'luka_bakar', region: 'lengan_bawah', side: 'kiri', at: 0.78, face: 150, size: [9, 6], burn: 'II_superfisial', label: 'Luka bakar derajat II superfisial punggung tangan & lengan bawah kiri' }], expose: { shortSleeves: true } };
      }
      return { wounds: [{ id: 'derajat1', kind: 'luka_bakar', region: 'lengan_bawah', side: 'kanan', at: 0.5, face: 20, size: [10, 7], burn: 'I', label: 'Luka bakar derajat I (eritema) lengan bawah kanan' }], expose: { shortSleeves: true } };
    }
    case 'epistaksis':
      return { wounds: [], face: { bloodNose: 0.8 } };
    case 'reaksi_gigitan_serangga':
      return { wounds: [{ id: 'gigitan', kind: 'urtikaria', region: 'lengan_bawah', side: 'kanan', at: 0.5, face: 20, size: [7, 5], label: 'Papul eritematosa/urtika bekas gigitan di lengan bawah' }], expose: { shortSleeves: true } };
    case 'ulkus_tungkai':
      return { wounds: [{ id: 'ulkus', kind: 'ulkus', region: 'tungkai_bawah', side: 'kiri', at: 0.86, face: -80, size: [4, 3], label: 'Ulkus dangkal 3 × 4 cm di atas maleolus medial kiri, dasar granulasi dengan fibrin' }], expose: { legs: { kiri: 0.55 } } };
    default:
      return null;
  }
}

/** Laju perdarahan eksternal (ml/menit) suatu sumber pada saat t (menit sejak datang). */
export function bleedingRate(b: Bleeding, physioBleedFraction: number, bloodVolumeMl: number, minutes: number): number {
  let rate = 0;
  if (b.share) rate += b.share * Math.max(0, physioBleedFraction) * bloodVolumeMl;
  if (b.mlPerMin) rate += b.mlPerMin * (b.halfLifeMin ? Math.pow(0.5, Math.max(0, minutes) / b.halfLifeMin) : 1);
  return rate;
}

/** Perkiraan volume darah total (ml): 80 ml/kg anak, 70 ml/kg dewasa. */
export function bloodVolumeMl(weightKg: number, ageYears: number): number {
  return weightKg * (ageYears < 12 ? 80 : 70);
}
