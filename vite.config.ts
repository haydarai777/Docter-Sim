import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Path relatif agar hasil build bisa dibuka dari sub-folder (mis. GitHub Pages /Docter-Sim/).
  base: './',
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
