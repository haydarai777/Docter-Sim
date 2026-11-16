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
    expect(durationText(1)).toBe('sehari');
    expect(durationText(360)).toBe('setahun');
    expect(durationText(720)).toBe('dua tahun');
  });

  it('fillTemplate: hari sakit pertama berbunyi "tadi", bukan "sehari lalu"', () => {
    const day1 = { hari: '1', lamaSakit: 'sehari' };
    expect(fillTemplate('{LamaSakit} lalu, Dok, tiba-tiba mimisan.', day1)).toBe('Tadi, Dok, tiba-tiba mimisan.');
    expect(fillTemplate('Sudah {lamaSakit}, Dok, gatal.', day1)).toBe('Sejak tadi, Dok, gatal.');
    expect(fillTemplate('Panasnya sudah {lamaSakit} ini, Dok.', day1)).toBe('Panasnya sejak tadi, Dok.');
    expect(fillTemplate('Mendadak, Dok, {lamaSakit} lalu menggigil.', day1)).toBe('Mendadak, Dok, tadi menggigil.');
    expect(fillTemplate('{LamaSakit} ini pusarnya merah.', day1)).toBe('Hari ini pusarnya merah.');
    const d1 = { ...day1, hariTeks: 'satu' };
    expect(fillTemplate('Sudah {hariTeks} hari ini, Dok, hilang-timbul.', d1)).toBe('Sejak tadi, Dok, hilang-timbul.');
    expect(fillTemplate('Mulainya sekitar {hariTeks} hari yang lalu, Dok.', d1)).toBe('Mulainya sejak tadi, Dok.');
    expect(fillTemplate('Panasnya mulai {hariTeks} hari yang lalu, Dok.', d1)).toBe('Panasnya mulai tadi, Dok.');
    expect(fillTemplate('Sudah {lamaSakit}, Dok.', { hari: '3', lamaSakit: 'tiga hari' })).toBe('Sudah tiga hari, Dok.');
  });

  it('fillTemplate mengisi placeholder, termasuk versi kapital', () => {
    expect(fillTemplate('Halo {nama}. {Keluhan}.', { nama: 'Budi', keluhan: 'saya pusing' })).toBe('Halo Budi. Saya pusing.');
    expect(fillTemplate('{x} tetap', {})).toBe('{x} tetap');
    expect(findUnfilledPlaceholders('a {b} c {D}')).toEqual(['b', 'D']);
    expect(capitalize('abc')).toBe('Abc');
  });
});
