/**
 * Titik masuk aplikasi browser.
 */
import './styles.css';
import { validateContent } from './core/validate';
import { GAME_CONFIG, loadDefaultContent } from './data';
import { App } from './ui/app';
import { Stage } from './ui/three/stage';

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

// Panggung 3D (ruang praktik) berada DI BAWAH lapisan UI. Bila WebGL tidak tersedia,
// Stage.create mengembalikan null dan game berjalan dengan tampilan 2D saja.
const stageEl = document.createElement('div');
stageEl.id = 'stage';
const stageUi = document.createElement('div');
stageUi.className = 'stage-ui';
stageEl.append(stageUi);
root.before(stageEl);
const stage = Stage.create(stageEl);
if (!stage) stageEl.remove();

const app = new App(root, content, GAME_CONFIG, stage, stage ? stageUi : null);
app.mount();
// Mode pengembangan: akses dari konsol/tes untuk memantau kinerja (stage.stats()).
if (import.meta.env.DEV) (window as unknown as { mejaPraktek?: unknown }).mejaPraktek = { app, stage };

// PWA: daftarkan service worker (hanya di build produksi web) agar bisa dimainkan offline.
// Versi file tunggal (mode "single") tidak memakai service worker: file-nya sendiri sudah offline.
if (import.meta.env.PROD && import.meta.env.MODE !== 'single' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Abaikan: game tetap berjalan tanpa mode offline.
    });
  });
}
