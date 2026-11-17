/**
 * Anatomi permukaan tubuh: fungsi "pahat" untuk geometri loft (lihat geo.ts `sculpt`) yang
 * menambahkan bentuk otot, tulang, dan lekuk kulit sungguhan — tulang selangka & lekuk di atasnya,
 * otot dada (atau payudara), alur tulang dada, lengkung iga, otot perut & garis tengahnya, pusar,
 * puting, belikat & alur tulang belakang; deltoid, biseps, triseps, siku, otot lengan bawah,
 * tonjolan pergelangan; paha depan (termasuk "tetesan" vastus medialis), tempurung lutut,
 * lekuk lutut belakang, tulang kering, betis, tendon Achilles, mata kaki; otot leher
 * (sternokleidomastoideus) & jakun.
 *
 * Besar tiap bentuk mengikuti jenis kelamin, usia, dan IMT: orang berotot tampak berotot, orang
 * kurus tampak tulang & iganya, orang gemuk tampak lebih halus dan membulat.
 * Koordinat dalam satuan s (skala badan) relatif terhadap sendi masing-masing.
 */
import { Vector3 } from 'three';
import { type Ring, spow } from './geo';

export interface AnatomySpec {
  s: number;
  male: boolean;
  ageGroup: 'anak' | 'remaja' | 'dewasa' | 'lansia';
  fat: number;
  thin: number;
  /** Tinggi pusat panggul (ruang akar). */
  hy: number;
  /** Badan tanpa baju (payudara terpisah, bukan satu tonjolan kain). */
  bare: boolean;
}

export type Sculpt = (a: number, ring: Ring) => number;

const g = (x: number) => Math.exp(-x * x);
const pos = (x: number) => (x > 0 ? x : 0);
const sm = (e0: number, e1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** Faktor tampilan otot, tulang, dan lemak dari jenis kelamin, usia, IMT. */
export function anatomyFactors(spec: AnatomySpec): { musc: number; bony: number; soft: number; breast: number } {
  const age = spec.ageGroup;
  const ageK = age === 'anak' ? 0.22 : age === 'remaja' ? 0.7 : age === 'lansia' ? 0.6 : 1;
  const musc = (spec.male ? 1 : 0.5) * ageK * (1 - 0.65 * spec.fat) * (1 - 0.3 * spec.thin);
  const bony = Math.max(0, Math.min(1.25, 0.35 + 0.9 * spec.thin - 0.6 * spec.fat + (age === 'lansia' ? 0.25 : 0))) * (age === 'anak' ? 0.5 : 1);
  const breast = spec.male || age === 'anak' ? 0 : (age === 'remaja' ? 0.62 : age === 'lansia' ? 0.92 : 1) * (1 + 0.55 * spec.fat - 0.25 * spec.thin);
  return { musc, bony, soft: spec.fat, breast };
}

/** Letak puting (satuan s): setengah jarak lateral & tinggi relatif pusat panggul. */
export function nippleSpot(spec: AnatomySpec): { x: number; y: number } {
  const f = anatomyFactors(spec);
  if (f.breast > 0) return { x: 0.09, y: 0.305 - 0.012 * f.breast * (spec.ageGroup === 'lansia' ? 1.6 : 1) - 0.01 * spec.fat };
  return { x: spec.ageGroup === 'anak' ? 0.075 : 0.093, y: 0.333 - 0.008 * spec.fat };
}

/** Letak pusar (satuan s, tinggi relatif pusat panggul). */
export const NAVEL_Y = 0.132;

/**
 * Pahat torso. `cloth` = permukaan baju: hanya bentuk besar (dada/payudara, belikat, perut)
 * yang samar terlihat di balik kain — tanpa pusar, puting, garis otot, atau iga.
 */
export function torsoSculpt(spec: AnatomySpec, cloth = false): Sculpt {
  const { s, hy } = spec;
  const f = anatomyFactors(spec);
  const nip = nippleSpot(spec);
  const lean = Math.max(0, 1 - 1.6 * spec.fat) * (spec.male ? 1 : 0.4);
  return (a, ring) => {
    const yr = (ring.c[1] - hy) / s;
    const n = ring.n ?? 2;
    const cs = Math.cos(a);
    const xm = (spow(Math.sin(a), n) * ring.rx) / s;
    const ax = Math.abs(xm);
    const front = sm(0.05, 0.5, cs);
    const back = sm(0.05, 0.5, -cs);
    let off = 0;
    if (cloth) {
      const dy = yr - 0.36;
      off += (spec.male ? 0.0105 : 0.004) * f.musc * 0.45 * g((ax - 0.08) / 0.07) * g(dy / 0.06) * front;
      if (f.breast > 0) {
        const by = 0.318 - 0.012 * f.breast - 0.008 * spec.fat;
        const r = Math.hypot((ax - 0.09) / 0.08, (yr - by) / 0.08);
        off += 0.03 * f.breast * 0.3 * (r < 1 ? Math.pow(1 - r * r, 1.4) : 0) * front;
      }
      off += 0.0045 * 0.5 * g((ax - 0.088) / 0.05) * g((yr - 0.39) / 0.055) * back;
      return off * s;
    }
    if (front > 0) {
      // Otot dada: tepi bawah tegas (lipatan), naik lembut ke tulang selangka.
      const dy = yr - 0.36;
      const pec = g((ax - 0.08) / 0.062) * g(dy / (dy < 0 ? 0.03 : 0.075));
      off += (spec.male ? 0.0105 : 0.004) * f.musc * pec * front;
      // Alur tulang dada di antara otot dada.
      off -= 0.0028 * f.musc * g(xm / 0.017) * g((yr - 0.37) / 0.07) * front;
      // Payudara (perempuan): kubah terpisah dengan lipatan bawah; tertutup kain → tonjolan lembut.
      if (f.breast > 0) {
        const by = 0.318 - 0.012 * f.breast * (spec.ageGroup === 'lansia' ? 1.6 : 1) - 0.008 * spec.fat;
        const r = Math.hypot((ax - 0.09) / 0.072, (yr - by) / (yr < by ? 0.06 : 0.078));
        const dome = r < 1 ? Math.pow(1 - r * r, 1.4) : 0;
        off += 0.03 * f.breast * dome * front * (spec.bare ? 1 : 0.35);
      }
      // Tulang selangka: punggung bukit dari pangkal leher ke bahu, lekuk di atasnya.
      const clav = yr - (0.466 + 0.06 * ax);
      off += (0.0015 + 0.0035 * f.bony) * g(clav / 0.0065) * sm(0.012, 0.03, ax) * (1 - sm(0.15, 0.185, ax)) * sm(-0.2, 0.3, cs);
      off -= 0.0042 * f.bony * g((yr - 0.49) / 0.011) * g((ax - 0.072) / 0.03) * front;
      // Lekuk di atas tulang dada (fossa jugularis).
      off -= 0.0042 * g(xm / 0.016) * g((yr - 0.5) / 0.011) * front;
      // Puting.
      off += (f.breast > 0 ? 0.003 : 0.0022) * g(Math.hypot(ax - nip.x, yr - nip.y) / 0.0055) * front;
      // Lengkung iga bawah (tampak pada orang kurus) & perut cekung di bawahnya.
      const costal = yr - (0.29 - 0.6 * ax);
      off += 0.0028 * f.bony * g(costal / 0.008) * sm(0.02, 0.05, ax) * (1 - sm(0.12, 0.15, ax)) * front;
      off -= 0.004 * spec.thin * sm(0.0, -0.03, costal) * g((yr - 0.2) / 0.06) * front;
      // Otot perut: garis tengah (linea alba) & sekat-sekat otot rektus pada yang ramping-berotot.
      const abs = sm(0.15, 0.19, yr) * (1 - sm(0.29, 0.31, yr));
      off -= 0.0018 * (0.4 + f.musc) * (1 - spec.fat) * g(xm / 0.012) * abs * front;
      const blocks = 0.5 + 0.5 * Math.cos(((yr - 0.175) / 0.042) * Math.PI * 2);
      off += 0.0014 * f.musc * lean * blocks * g((ax - 0.038) / 0.028) * abs * front;
      // Perut bawah membulat.
      off += 0.003 * (0.35 + spec.fat) * g(xm / 0.085) * g((yr - 0.112) / 0.035) * front;
      // Pusar: lekuk dalam dengan bibir lembut di sekelilingnya.
      const rn = Math.hypot(xm, yr - NAVEL_Y);
      off -= 0.0068 * (1 + 0.7 * spec.fat) * g(rn / 0.0062) * front;
      off += 0.0012 * g((rn - 0.0115) / 0.0042) * front;
      // Iga samping pada orang kurus.
      if (spec.thin > 0.05) {
        const side = sm(0.35, 0.85, Math.abs(Math.sin(a)));
        off += 0.0009 * spec.thin * Math.cos(((yr + 0.3 * Math.abs(Math.sin(a))) / 0.027) * Math.PI * 2) * side * sm(0.17, 0.22, yr) * (1 - sm(0.35, 0.4, yr));
      }
    }
    if (back > 0) {
      // Alur tulang belakang di antara otot punggung; belikat menonjol di punggung atas.
      off -= 0.0042 * g(xm / 0.016) * sm(0.05, 0.12, yr) * (1 - sm(0.44, 0.5, yr)) * back;
      off += 0.003 * (0.4 + f.musc) * g((ax - 0.032) / 0.018) * g((yr - 0.18) / 0.09) * back;
      off += (0.0045 + 0.002 * f.bony) * g((ax - 0.088) / 0.045) * g((yr - 0.39) / 0.05) * back;
      off += 0.0018 * f.bony * g((ax - 0.055) / 0.008) * g((yr - 0.39) / 0.06) * back;
    }
    return off * s;
  };
}

/** Pahat lengan; `side` = +1 kiri (sisi +X), −1 kanan. `sy` = tinggi sendi bahu (ruang akar). */
export function armSculpt(spec: AnatomySpec, side: 1 | -1, sy: number): Sculpt {
  const { s } = spec;
  const f = anatomyFactors(spec);
  return (a, ring) => {
    const d = (sy - ring.c[1]) / s;
    const L = Math.sin(a) * side;
    const F = Math.cos(a);
    let off = 0;
    // Deltoid bagian samping & alur di bawahnya (insersio deltoid).
    off += 0.0028 * f.musc * g((d - 0.055) / 0.045) * pos(L) ** 1.5;
    off -= 0.0018 * f.musc * g((d - 0.112) / 0.02) * pos(L);
    // Biseps (depan) & triseps (belakang, dengan kepala lateral).
    off += 0.0068 * f.musc * g((d - 0.152) / 0.055) * pos(F) ** 1.5;
    off += 0.0046 * f.musc * g((d - 0.13) / 0.06) * pos(-F) ** 1.5;
    off += 0.0022 * f.musc * g((d - 0.1) / 0.04) * pos(-F * 0.6 + L * 0.8) ** 2;
    // Siku: olekranon di belakang, epikondilus di kedua sisi, lekuk di depan.
    off += 0.0034 * g((d - 0.272) / 0.016) * pos(-F) ** 3;
    off += 0.002 * (0.5 + f.bony) * g((d - 0.262) / 0.014) * Math.abs(L) ** 4;
    off -= 0.0022 * g((d - 0.274) / 0.02) * pos(F) ** 2;
    // Lengan bawah: otot ekstensor/brakioradialis (anterolateral) & fleksor (anteromedial).
    off += 0.0048 * (0.35 + f.musc) * g((d - 0.33) / 0.045) * pos(F * 0.66 + L * 0.75) ** 2;
    off += 0.0032 * (0.35 + f.musc) * g((d - 0.345) / 0.05) * pos(F * 0.7 - L * 0.7) ** 2;
    // Pergelangan: tonjolan ujung tulang ulna (sisi kelingking, punggung tangan).
    off += 0.0022 * (0.4 + f.bony) * g((d - 0.494) / 0.01) * pos((-L - F) / Math.SQRT2) ** 4;
    return off * s;
  };
}

/** Pahat tungkai; `side` = +1 kiri, −1 kanan. `ly` = tinggi sendi panggul (ruang akar). */
export function legSculpt(spec: AnatomySpec, side: 1 | -1, ly: number): Sculpt {
  const { s } = spec;
  const f = anatomyFactors(spec);
  return (a, ring) => {
    const d = (ly - ring.c[1]) / s;
    if (d < 0.06) return 0;
    const L = Math.sin(a) * side;
    const F = Math.cos(a);
    let off = 0;
    // Paha depan (quadriceps), vastus lateralis, "tetesan" vastus medialis di atas lutut.
    off += 0.0045 * f.musc * g((d - 0.2) / 0.09) * pos(F) ** 1.5;
    off += 0.0035 * f.musc * g((d - 0.24) / 0.08) * pos(L) ** 1.5;
    off += 0.0062 * f.musc * g((d - 0.335) / 0.038) * pos(F * 0.6 - L * 0.8) ** 2;
    // Paha belakang (hamstring).
    off += 0.003 * f.musc * g((d - 0.22) / 0.09) * pos(-F) ** 1.5;
    // Lutut: tempurung, cekungan di kedua sisinya, tendon patela, lekuk lutut belakang.
    off += 0.0048 * g((d - 0.404) / 0.022) * pos(F) ** 6;
    off -= 0.0026 * g((d - 0.412) / 0.024) * g((Math.abs(L) - 0.62) / 0.2) * pos(F);
    off += 0.0018 * g((d - 0.452) / 0.02) * pos(F) ** 12;
    off -= 0.0035 * g((d - 0.41) / 0.03) * pos(-F) ** 2;
    // Tulang kering (tepi anteromedial yang tajam).
    off += 0.0017 * (0.5 + f.bony) * g((d - 0.6) / 0.12) * pos(F * 0.96 - L * 0.28) ** 30;
    // Betis: kepala medial lebih besar & lebih rendah daripada lateral.
    off += 0.0075 * (0.3 + f.musc) * g((d - 0.53) / 0.055) * pos(-F * 0.85 - L * 0.5) ** 2;
    off += 0.0055 * (0.3 + f.musc) * g((d - 0.51) / 0.05) * pos(-F * 0.85 + L * 0.5) ** 2;
    // Tendon Achilles: cekung di kedua sisinya.
    off -= 0.003 * g((d - 0.72) / 0.04) * g((Math.abs(L) - 0.75) / 0.2) * pos(-F + 0.3);
    // Mata kaki: medial lebih tinggi, lateral lebih rendah.
    off += 0.0042 * g((d - 0.765) / 0.012) * pos(-L) ** 6;
    off += 0.0038 * g((d - 0.778) / 0.012) * pos(L) ** 6;
    return off * s;
  };
}

/** Pahat leher: otot sternokleidomastoideus & jakun (laki-laki). */
export function neckSculpt(spec: AnatomySpec): Sculpt {
  const { s, hy } = spec;
  const f = anatomyFactors(spec);
  const adam = spec.male ? (spec.ageGroup === 'anak' ? 0 : spec.ageGroup === 'remaja' ? 0.6 : 1) * (1 - 0.6 * spec.fat) : 0;
  return (a, ring) => {
    const yr = (ring.c[1] - hy) / s;
    let off = 0;
    const t = (yr - 0.505) / 0.12;
    // Sudut dari depan (0) ke belakang (π), sama untuk sisi kiri & kanan.
    const aa = a > Math.PI ? Math.PI * 2 - a : a;
    if (t > -0.1 && t < 1.1) {
      // Pita otot dari tulang dada (depan bawah) menyerong ke belakang telinga (samping atas).
      const ac = 0.28 + t * 1.47;
      off += 0.0028 * (0.4 + f.musc) * (1 - 0.6 * spec.fat) * g((aa - ac) / 0.17) * sm(-0.1, 0.1, t) * (1 - sm(0.9, 1.1, t));
    }
    off += 0.0048 * adam * g(aa / 0.22) * g((yr - 0.566) / 0.012);
    return off * s;
  };
}

/** Kalikan pahatan (mis. pakaian mengikuti bentuk tubuh lebih samar). */
export function scaled(fn: Sculpt, k: number): Sculpt {
  return (a, ring) => k * fn(a, ring);
}

/** Titik permukaan pahatan untuk penanda (puting, pusar, siku, lutut) — ruang akar pose ikat. */
export function landmark(ring: Ring, a: number, sculpt: Sculpt, out = new Vector3()): Vector3 {
  const n = ring.n ?? 2;
  const cu = spow(Math.sin(a), n) * ring.rx;
  const cv = spow(Math.cos(a), n);
  const dv = cv >= 0 ? cv * ring.rf : cv * (ring.rb ?? ring.rf);
  const len = Math.hypot(cu, dv) || 1;
  const k = (len + sculpt(a, ring)) / len;
  return out.set(ring.c[0] + cu * k, ring.c[1], ring.c[2] + dv * k);
}
