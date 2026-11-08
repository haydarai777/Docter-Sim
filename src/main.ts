/**
 * Titik masuk aplikasi browser.
 */
import './styles.css';
import { validateContent } from './core/validate';
import { GAME_CONFIG, loadDefaultContent } from './data';
import { App } from './ui/app';

const content = loadDefaultContent();

// Di mode pengembangan, periksa integritas konten dan tampilkan masalahnya di konsol.
if (import.meta.env.DEV) {
  const errors = validateContent(content, GAME_CONFIG);
  if (errors.length > 0) {
    console.warn(`[Meja Praktek] ${errors.length} masalah konten:\n- ${errors.join('\n- ')}`);
  }
}

// Bahasa halaman (versi Artifact dibungkus kerangka HTML dari luar).
document.documentElement.lang = 'id';

const root = document.getElementById('app');
if (!root) throw new Error('Elemen #app tidak ditemukan');

const app = new App(root, content, GAME_CONFIG);
app.mount();

// PWA: daftarkan service worker (hanya di build produksi web) agar bisa dimainkan offline.
// Versi file tunggal (mode "single") tidak memakai service worker: file-nya sendiri sudah offline.
if (import.meta.env.PROD && import.meta.env.MODE !== 'single' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Abaikan: game tetap berjalan tanpa mode offline.
    });
  });
}
