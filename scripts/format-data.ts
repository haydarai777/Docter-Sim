/**
 * Rapikan format semua file JSON di src/data: indentasi 2 spasi, dan objek/array
 * pendek ditulis dalam satu baris agar aturan penyakit mudah dibaca.
 *
 * Jalankan: npm run format-data
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MAX_LINE = 120;

function format(value: unknown, indent: number): string {
  const inline = JSON.stringify(value, null, 1)
    .replace(/\[\n\s*/g, '[')
    .replace(/\{\n\s*/g, '{ ')
    .replace(/\n\s*\]/g, ']')
    .replace(/\n\s*\}/g, ' }')
    .replace(/,\n\s*/g, ', ');
  if (value === null || typeof value !== 'object' || indent * 2 + inline.length <= MAX_LINE) {
    return inline;
  }
  const pad = '  '.repeat(indent + 1);
  const end = '  '.repeat(indent);
  if (Array.isArray(value)) {
    return `[\n${value.map((v) => pad + format(v, indent + 1)).join(',\n')}\n${end}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>);
  return `{\n${entries.map(([k, v]) => `${pad}${JSON.stringify(k)}: ${format(v, indent + 1)}`).join(',\n')}\n${end}}`;
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : path.endsWith('.json') ? [path] : [];
  });
}

for (const file of walk('src/data')) {
  const data = JSON.parse(readFileSync(file, 'utf8'));
  writeFileSync(file, format(data, 0) + '\n');
  console.log(`✓ ${file}`);
}
