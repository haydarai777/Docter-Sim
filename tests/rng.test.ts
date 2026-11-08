import { describe, expect, it } from 'vitest';
import { createRng, deriveSeed, hashString } from '../src/core/rng';

describe('rng', () => {
  it('deterministik untuk seed yang sama', () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('seed berbeda menghasilkan urutan berbeda', () => {
    expect(createRng(1).next()).not.toEqual(createRng(2).next());
  });

  it('int() selalu dalam rentang inklusif', () => {
    const rng = createRng(7);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const v = rng.int(3, 6);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(6);
      seen.add(v);
    }
    expect([...seen].sort()).toEqual([3, 4, 5, 6]);
  });

  it('chance() menghormati batas 0 dan 1', () => {
    const rng = createRng(9);
    for (let i = 0; i < 100; i++) {
      expect(rng.chance(0)).toBe(false);
      expect(rng.chance(1)).toBe(true);
    }
  });

  it('weighted() tidak pernah memilih elemen berbobot 0', () => {
    const rng = createRng(11);
    for (let i = 0; i < 500; i++) {
      expect(rng.weighted(['a', 'b', 'c'], (x) => (x === 'b' ? 0 : 1))).not.toBe('b');
    }
  });

  it('weighted() kira-kira proporsional', () => {
    const rng = createRng(13);
    let heavy = 0;
    for (let i = 0; i < 4000; i++) if (rng.weighted(['x', 'y'], (v) => (v === 'x' ? 3 : 1)) === 'x') heavy++;
    expect(heavy / 4000).toBeGreaterThan(0.7);
    expect(heavy / 4000).toBeLessThan(0.8);
  });

  it('fork() independen terhadap pemakaian RNG induk', () => {
    const a = createRng(5);
    const b = createRng(5);
    b.next();
    b.next();
    expect(a.fork('x').next()).toEqual(b.fork('x').next());
    expect(a.fork('x').next()).not.toEqual(a.fork('y').next());
  });

  it('shuffle() mempertahankan isi', () => {
    const items = [1, 2, 3, 4, 5, 6];
    expect(createRng(3).shuffle(items).sort()).toEqual(items);
  });

  it('melempar error untuk input tidak sah', () => {
    const rng = createRng(1);
    expect(() => rng.pick([])).toThrow();
    expect(() => rng.int(5, 1)).toThrow();
    expect(() => rng.weighted([1, 2], () => 0)).toThrow();
  });

  it('hash & deriveSeed stabil', () => {
    expect(hashString('abc')).toBe(hashString('abc'));
    expect(deriveSeed(1, 'a')).not.toBe(deriveSeed(1, 'b'));
  });
});
