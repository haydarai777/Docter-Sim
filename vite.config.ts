import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

/**
 * Plugin untuk mode `single`: menggabungkan JS, CSS, dan ikon ke dalam SATU file
 * HTML yang bisa dibuka langsung di browser — tanpa server, tanpa internet, tanpa GitHub.
 *
 * Menghasilkan dua file di dist-single/:
 *  - meja-praktek.html          → dokumen HTML lengkap (buka langsung / hosting statis mana pun)
 *  - meja-praktek-artifact.html → isi halaman tanpa kerangka <html>/<head>/<body>,
 *                                 untuk dipublikasikan sebagai Artifact claude.ai
 */
function singleFileHtml(): Plugin {
  const icon = `data:image/svg+xml;base64,${readFileSync('public/icon.svg').toString('base64')}`;
  return {
    name: 'meja-praktek-single-file',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const html = Object.values(bundle).find((f) => f.type === 'asset' && f.fileName === 'index.html');
      if (!html || html.type !== 'asset') return;
      let source = String(html.source);
      let inlineJs = '';
      let inlineCss = '';

      for (const [name, file] of Object.entries(bundle)) {
        if (file.type === 'chunk' && file.isEntry) {
          // "</script" di dalam kode akan menutup tag lebih awal — escape agar aman.
          const code = file.code.replace(/<\/script/gi, '<\\/script');
          inlineJs = code;
          source = source.replace(
            new RegExp(`<script[^>]*src="[^"]*${escapeRegExp(file.fileName)}"[^>]*></script>`),
            () => `<script type="module">${code}</script>`,
          );
          delete bundle[name];
        } else if (file.type === 'asset' && file.fileName.endsWith('.css')) {
          const css = String(file.source);
          inlineCss = css;
          source = source.replace(
            new RegExp(`<link[^>]*href="[^"]*${escapeRegExp(file.fileName)}"[^>]*>`),
            () => `<style>${css}</style>`,
          );
          delete bundle[name];
        }
      }
      source = source
        .replace(/<link rel="manifest"[^>]*>\s*/g, '')
        .replace(/href="\.\/icon\.svg"/g, `href="${icon}"`);
      html.source = source;
      html.fileName = 'meja-praktek.html';

      // Varian Artifact: kerangka dokumen ditambahkan oleh claude.ai saat publikasi.
      const title = /<title>([^<]*)<\/title>/.exec(source)?.[1] ?? 'Meja Praktek';
      this.emitFile({
        type: 'asset',
        fileName: 'meja-praktek-artifact.html',
        source: [
          `<title>${title}</title>`,
          '<meta name="claude:viewport-fit-sides" content="cover">',
          `<style>${inlineCss}</style>`,
          '<div id="app"></div>',
          '<noscript>Meja Praktek membutuhkan JavaScript.</noscript>',
          `<script type="module">${inlineJs}</script>`,
          '',
        ].join('\n'),
      });
    },
  };
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  return {
    // Path relatif agar hasil build bisa dibuka dari sub-folder mana pun.
    base: './',
    plugins: single ? [singleFileHtml()] : [],
    build: {
      target: 'es2020',
      outDir: single ? 'dist-single' : 'dist',
      // Mode single: semua aset di-inline, tanpa folder public (service worker/manifest).
      ...(single
        ? {
            assetsInlineLimit: Number.MAX_SAFE_INTEGER,
            cssCodeSplit: false,
            copyPublicDir: false,
            rollupOptions: { output: { inlineDynamicImports: true } },
          }
        : {}),
    },
    test: {
      include: ['tests/**/*.test.ts'],
      environment: 'node',
    },
  };
});
