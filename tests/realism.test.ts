import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { anatomyFactors, armSculpt, type AnatomySpec, legSculpt, NAVEL_Y, neckSculpt, nippleSpot, torsoSculpt } from '../src/ui/three/anatomy';
import { buildBody } from '../src/ui/three/body';
import type { Ring } from '../src/ui/three/geo';
import { hairStrandTexture } from '../src/ui/three/hair';
import { HeadShape } from '../src/ui/three/head';
import { skinDetailTexture } from '../src/ui/three/skin';

const S = 1;
const HY = 0.9;
const spec = (over: Partial<AnatomySpec> = {}): AnatomySpec => ({ s: S, male: true, ageGroup: 'dewasa', fat: 0, thin: 0, hy: HY, bare: true, ...over });
const ring = (y: number, rx = 0.15, rf = 0.1): Ring => ({ c: [0, y, 0], rx, rf, rb: rf, n: 2.35 });

describe('Anatomi permukaan tubuh', () => {
  it('faktor otot/tulang/payudara mengikuti jenis kelamin, usia, IMT', () => {
    const lean = anatomyFactors(spec());
    const fat = anatomyFactors(spec({ fat: 0.9 }));
    const thin = anatomyFactors(spec({ thin: 0.9 }));
    const woman = anatomyFactors(spec({ male: false }));
    const child = anatomyFactors(spec({ ageGroup: 'anak' }));
    expect(lean.musc).toBeGreaterThan(fat.musc);
    expect(lean.musc).toBeGreaterThan(woman.musc);
    expect(child.musc).toBeLessThan(0.3);
    expect(thin.bony).toBeGreaterThan(lean.bony);
    expect(fat.bony).toBeLessThan(lean.bony);
    expect(lean.breast).toBe(0);
    expect(woman.breast).toBeGreaterThan(0.5);
    expect(anatomyFactors(spec({ male: false, ageGroup: 'anak' })).breast).toBe(0);
  });

  it('pusar cekung, puting & otot dada menonjol, alur tulang belakang cekung', () => {
    const t = torsoSculpt(spec());
    expect(t(0, ring(HY + NAVEL_Y))).toBeLessThan(-0.004);
    const nip = nippleSpot(spec());
    const r = ring(HY + nip.y);
    const a = Math.asin(Math.pow(nip.x / r.rx, 2.35 / 2));
    expect(t(a, r)).toBeGreaterThan(0.005);
    expect(t(Math.PI, ring(HY + 0.3))).toBeLessThan(-0.002);
  });

  it('pahatan baju jauh lebih samar & tanpa pusar', () => {
    const skin = torsoSculpt(spec());
    const cloth = torsoSculpt(spec(), true);
    expect(cloth(0, ring(HY + NAVEL_Y))).toBeGreaterThanOrEqual(-0.0001);
    expect(Math.abs(cloth(0.5, ring(HY + 0.36)))).toBeLessThan(Math.abs(skin(0.5, ring(HY + 0.36))) + 1e-9);
  });

  it('semua pahatan berhingga dan dalam batas wajar (± 4 cm) di seluruh permukaan', () => {
    for (const sp of [spec(), spec({ male: false }), spec({ fat: 1 }), spec({ thin: 1 }), spec({ ageGroup: 'anak' }), spec({ ageGroup: 'lansia', male: false })]) {
      const fns = [torsoSculpt(sp), torsoSculpt(sp, true), neckSculpt(sp), armSculpt(sp, 1, HY + 0.45), armSculpt(sp, -1, HY + 0.45), legSculpt(sp, 1, HY - 0.03), legSculpt(sp, -1, HY - 0.03)];
      for (const fn of fns) {
        for (let y = HY - 0.85; y <= HY + 0.7; y += 0.01) {
          for (let a = 0; a < Math.PI * 2; a += 0.2) {
            const v = fn(a, ring(y, 0.06, 0.05));
            expect(Number.isFinite(v)).toBe(true);
            expect(Math.abs(v)).toBeLessThan(0.04);
          }
        }
      }
    }
  });

  it('tubuh berpahat sah & penanda kulit berada di depan tubuh', () => {
    for (const male of [true, false]) {
      const b = buildBody({
        s: 1,
        male,
        ageGroup: 'dewasa',
        fat: 0.2,
        thin: 0,
        hipsY: 0.9,
        hipHalf: 0.085,
        hipDrop: 0.03,
        spineY: 0.09,
        chestY: 0.25,
        neckY: 0.52,
        headY: 0.585,
        shoulderHalf: 0.17,
        shoulderY: 0.2,
        upperArm: 0.27,
        foreArm: 0.24,
        thigh: 0.39,
        shin: 0.39,
        longSleeves: false,
        shorts: false,
        jacket: false,
        collar: false,
        tucked: false,
        hijab: false,
        edema: false,
        bareTorso: true,
        chestBand: !male,
        pantsEnd: { L: 0.1, R: 0.1 },
      });
      for (const g of [b.top, b.skinArms!, b.skinLegs!, b.skinNeck]) {
        const pos = g.getAttribute('position');
        for (let i = 0; i < pos.count; i++) expect(Number.isFinite(pos.getX(i) + pos.getY(i) + pos.getZ(i))).toBe(true);
      }
      const L = b.landmarks;
      expect(L.nipples[0].x).toBeGreaterThan(0);
      expect(L.nipples[1].x).toBeLessThan(0);
      expect(L.nipples[0].z).toBeGreaterThan(0.05);
      expect(L.navel.z).toBeGreaterThan(0.04);
      expect(L.knees[0].z).toBeGreaterThan(0);
      expect(L.elbows[0].z).toBeLessThan(0);
    }
  });
});

describe('Relief wajah', () => {
  const head = new HeadShape({ hs: 1, male: true, ageGroup: 'dewasa', fat: 0, thin: 0, seed: 3 });
  it('rongga mata cekung, tulang alis & bibir menonjol', () => {
    expect(head.relief(head.eyeX, head.eyeYn)).toBeLessThan(-0.006);
    expect(head.relief(0.027, head.eyeYn + 0.145)).toBeGreaterThan(0.002);
    expect(head.relief(0, head.mouthYn - 0.05)).toBeGreaterThan(0.002);
    // Kepala belakang tidak terpengaruh.
    expect(Math.abs(head.relief(0.075, 0.6))).toBeLessThan(0.0005);
  });
  it('titik permukaan berhingga di seluruh kepala', () => {
    const p = new Vector3();
    for (let yn = -1; yn <= 1; yn += 0.05) {
      for (let a = 0; a < Math.PI * 2; a += 0.3) {
        head.point(yn, a, p);
        expect(Number.isFinite(p.x + p.y + p.z)).toBe(true);
      }
    }
  });
});

describe('Tekstur prosedural kulit & rambut', () => {
  it('tekstur detail kulit & helai rambut dibuat tanpa kanvas dan dipakai bersama', () => {
    const a = skinDetailTexture();
    expect(a.image.width).toBe(256);
    expect(skinDetailTexture()).toBe(a);
    const h = hairStrandTexture();
    expect(h.image.height).toBe(512);
    expect(hairStrandTexture()).toBe(h);
    // Ada variasi (bukan warna rata).
    const d = h.image.data as Uint8Array;
    let min = 255;
    let max = 0;
    for (let i = 0; i < d.length; i += 4) {
      min = Math.min(min, d[i]!);
      max = Math.max(max, d[i]!);
    }
    expect(max - min).toBeGreaterThan(100);
  });
});
