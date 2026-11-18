/**
 * Avatar pasien sederhana (SVG) yang dibuat deterministik dari seed kasus:
 * warna kulit, gaya rambut, uban sesuai usia, kacamata, dan ekspresi wajah
 * sesuai kepribadian. Tanpa aset gambar eksternal.
 */
import { createRng, deriveSeed } from '../../core/rng';
import type { PatientProfile } from '../../core/types';

const SKIN = ['#f3d2b3', '#e8b98f', '#d9a066', '#c08552', '#9a6538'];
const HAIR = ['#1f1a17', '#2b211c', '#3a2a20', '#4a3426'];
const SHIRT = ['#4f7cac', '#6a994e', '#c97c5d', '#7d6b91', '#3d8a87', '#b5838d', '#8a7f5a'];
const BG = ['#dbeafe', '#dcfce7', '#fef3c7', '#fce7f3', '#e0e7ff', '#ccfbf1'];

type Mood = 'senyum' | 'cemas' | 'santai' | 'bingung' | 'yakin';

const MOOD_BY_PERSONALITY: Record<string, Mood> = {
  kooperatif: 'senyum',
  cemas: 'cemas',
  meremehkan: 'santai',
  pelupa: 'bingung',
  sok_tahu: 'yakin',
};

export function avatarSvg(patient: PatientProfile, seed: number, size = 56): string {
  const rng = createRng(deriveSeed(seed, 'avatar'));
  const skin = rng.pick(SKIN);
  const gray = patient.age >= 58;
  const hair = gray ? (patient.age >= 66 ? '#d6d3d1' : '#9ca3af') : rng.pick(HAIR);
  const shirt = rng.pick(SHIRT);
  const bg = rng.pick(BG);
  const glasses = rng.chance(patient.age >= 45 ? 0.45 : 0.15);
  const mood = MOOD_BY_PERSONALITY[patient.personalityId] ?? 'senyum';
  const male = patient.sex === 'male';
  const balding = male && patient.age >= 60 && rng.chance(0.4);
  const femaleStyle = rng.int(0, 2); // 0 panjang, 1 sanggul, 2 pendek

  const parts: string[] = [];
  parts.push(`<circle cx="32" cy="32" r="32" fill="${bg}"/>`);
  // Rambut belakang (perempuan berambut panjang)
  if (!male && femaleStyle === 0) parts.push(`<path d="M14 34 Q14 12 32 12 Q50 12 50 34 L52 52 L12 52 Z" fill="${hair}"/>`);
  // Badan & leher
  parts.push(`<path d="M10 64 Q12 48 32 47 Q52 48 54 64 Z" fill="${shirt}"/>`);
  parts.push(`<rect x="27" y="40" width="10" height="9" rx="3" fill="${skin}"/>`);
  // Kepala
  parts.push(`<ellipse cx="32" cy="30" rx="13" ry="15" fill="${skin}"/>`);
  // Rambut depan
  if (male) {
    if (balding) parts.push(`<path d="M19 27 Q19 22 22 20 L22 26 Z M45 27 Q45 22 42 20 L42 26 Z" fill="${hair}"/>`);
    else parts.push(`<path d="M19 28 Q18 14 32 14 Q46 14 45 28 Q42 20 32 20 Q23 20 19 28 Z" fill="${hair}"/>`);
  } else {
    parts.push(`<path d="M19 30 Q17 13 32 13 Q47 13 45 30 Q43 19 32 19 Q22 19 19 30 Z" fill="${hair}"/>`);
    if (femaleStyle === 1) parts.push(`<circle cx="32" cy="12" r="6" fill="${hair}"/>`);
  }
  // Alis & mata
  const brow = {
    senyum: ['M24 25 L29 24.5', 'M35 24.5 L40 25'],
    cemas: ['M24 24 L29 26', 'M35 26 L40 24'],
    santai: ['M24 25.5 L29 25.5', 'M35 25.5 L40 25.5'],
    bingung: ['M24 25 L29 24', 'M35 23.5 L40 25.5'],
    yakin: ['M24 24 L29 25', 'M35 25 L40 23'],
  }[mood];
  parts.push(`<path d="${brow[0]} ${brow[1]}" stroke="#3b2f2a" stroke-width="1.4" stroke-linecap="round" fill="none"/>`);
  if (mood === 'santai') {
    parts.push(`<path d="M25 29 Q26.5 30 28 29 M36 29 Q37.5 30 39 29" stroke="#2a211d" stroke-width="1.4" fill="none" stroke-linecap="round"/>`);
  } else {
    parts.push(`<circle cx="26.5" cy="29" r="1.6" fill="#2a211d"/><circle cx="37.5" cy="29" r="1.6" fill="#2a211d"/>`);
  }
  if (glasses) {
    parts.push(`<g stroke="#374151" stroke-width="1.1" fill="none"><circle cx="26.5" cy="29" r="4"/><circle cx="37.5" cy="29" r="4"/><path d="M30.5 29 L33.5 29"/></g>`);
  }
  // Mulut
  const mouth = {
    senyum: 'M27 36 Q32 40 37 36',
    cemas: 'M27.5 38 Q32 35 36.5 38',
    santai: 'M28 36.5 Q32 38.5 36 36.5',
    bingung: 'M28 37 L36 36',
    yakin: 'M28 37 Q33 39 37 35.5',
  }[mood];
  parts.push(`<path d="${mouth}" stroke="#7a3b2e" stroke-width="1.6" fill="none" stroke-linecap="round"/>`);
  if (mood === 'cemas') parts.push(`<path d="M44 22 q1.5 3 0 4.5 q-1.5 -1.5 0 -4.5" fill="#93c5fd"/>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true" focusable="false"><defs><clipPath id="av-${seed}"><circle cx="32" cy="32" r="32"/></clipPath></defs><g clip-path="url(#av-${seed})">${parts.join('')}</g></svg>`;
}

/** Elemen avatar siap pakai. */
export function avatarElement(patient: PatientProfile, seed: number, size = 56): HTMLElement {
  const span = document.createElement('span');
  span.className = 'avatar';
  // Aman: string SVG dibuat seluruhnya dari konstanta & angka di atas, tanpa teks dari pengguna/konten.
  span.innerHTML = avatarSvg(patient, seed, size);
  return span;
}
