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

const root = document.getElementById('app');
if (!root) throw new Error('Elemen #app tidak ditemukan');

const app = new App(root, content, GAME_CONFIG);
app.mount();
