import { describe, expect, it } from 'vitest';
import { capitalize, durationText, fillTemplate, findUnfilledPlaceholders, formatNumber, formatRupiah, joinList, numberToWords } from '../src/core/text';

describe('format & teks', () => {
  it('formatNumber memakai gaya Indonesia', () => {
    expect(formatNumber(85000)).toBe('85.000');
    expect(formatNumber(1234567)).toBe('1.234.567');
    expect(formatNumber(38.6, 1)).toBe('38,6');
    expect(formatNumber(5, 1)).toBe('5,0');
    expect(formatNumber(999)).toBe('999');
  });

  it('formatRupiah', () => {
    expect(formatRupiah(150000)).toBe('Rp150.000');
  });

  it('joinList', () => {
    expect(joinList([])).toBe('');
    expect(joinList(['a'])).toBe('a');
    expect(joinList(['a', 'b'])).toBe('a dan b');
    expect(joinList(['a', 'b', 'c'])).toBe('a, b, dan c');
  });

  it('numberToWords', () => {
    expect(numberToWords(1)).toBe('satu');
    expect(numberToWords(11)).toBe('sebelas');
    expect(numberToWords(14)).toBe('empat belas');
    expect(numberToWords(20)).toBe('dua puluh');
    expect(numberToWords(21)).toBe('dua puluh satu');
  });

  it('durationText', () => {
    expect(durationText(4)).toBe('empat hari');
    expect(durationText(21)).toBe('tiga minggu');
    expect(durationText(75)).toBe('tiga bulan');
  });

  it('fillTemplate mengisi placeholder, termasuk versi kapital', () => {
    expect(fillTemplate('Halo {nama}. {Keluhan}.', { nama: 'Budi', keluhan: 'saya pusing' })).toBe('Halo Budi. Saya pusing.');
    expect(fillTemplate('{x} tetap', {})).toBe('{x} tetap');
    expect(findUnfilledPlaceholders('a {b} c {D}')).toEqual(['b', 'D']);
    expect(capitalize('abc')).toBe('Abc');
  });
});
