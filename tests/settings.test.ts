import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, loadSettings, migrateSettings, saveSettings, SETTINGS_VERSION } from '../src/ui/storage';

/**
 * Mode lokal (tanpa token Claude) adalah bawaan. Pengaturan lama yang menyimpan aiPatient: true
 * (bawaan versi sebelumnya, bukan pilihan pemain) dikembalikan ke mode lokal; pilihan pemain
 * setelah migrasi tetap dihormati.
 */

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(k: string) {
    return this.data.has(k) ? this.data.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}

function withStorage(): MemoryStorage {
  const storage = new MemoryStorage();
  (globalThis as unknown as { window: unknown }).window = { localStorage: storage };
  return storage;
}

afterEach(() => {
  delete (globalThis as unknown as { window?: unknown }).window;
});

describe('pengaturan pasien AI', () => {
  it('bawaan: mode lokal (pasien AI mati)', () => {
    expect(DEFAULT_SETTINGS.aiPatient).toBe(false);
    expect(migrateSettings(undefined).aiPatient).toBe(false);
    expect(migrateSettings({}).aiPatient).toBe(false);
  });

  it('pengaturan versi lama (tanpa versi) dengan aiPatient: true dimigrasi ke mode lokal; pengaturan lain dipertahankan', () => {
    const old = { theme: 'dark', realisticTests: false, tutorialSeen: true, aiPatient: true };
    expect(migrateSettings(old)).toEqual({ theme: 'dark', realisticTests: false, tutorialSeen: true, aiPatient: false });
  });

  it('pilihan pemain setelah migrasi dihormati (versi 2)', () => {
    expect(migrateSettings({ version: 2, aiPatient: true }).aiPatient).toBe(true);
    expect(migrateSettings({ version: 2, aiPatient: false }).aiPatient).toBe(false);
  });

  it('data rusak tidak membuat game gagal dimuat', () => {
    expect(migrateSettings('kacau')).toEqual(DEFAULT_SETTINGS);
    expect(migrateSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(migrateSettings(42)).toEqual(DEFAULT_SETTINGS);
  });

  it('simpan menulis nomor versi; muat ulang mempertahankan pilihan pasien AI', () => {
    const storage = withStorage();
    storage.setItem('meja-praktek:pengaturan', JSON.stringify({ theme: 'light', aiPatient: true }));
    const migrated = loadSettings();
    expect(migrated.aiPatient).toBe(false);
    expect(migrated.theme).toBe('light');
    saveSettings({ ...migrated, aiPatient: true });
    expect(JSON.parse(storage.getItem('meja-praktek:pengaturan')!).version).toBe(SETTINGS_VERSION);
    expect(loadSettings().aiPatient).toBe(true);
  });

  it('tanpa localStorage (mode privat) tetap memakai bawaan', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});
