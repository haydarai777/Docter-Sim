/**
 * Tekstur prosedural (digambar di kanvas 2D) — tanpa file gambar eksternal, sehingga
 * seluruh game tetap satu file dan ringan.
 */
import { CanvasTexture, LinearFilter, RepeatWrapping, SRGBColorSpace } from 'three';

export function canvasTexture(width: number, height: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext('2d')!;
  draw(g, width, height);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Pengacak kecil deterministik untuk detail tekstur. */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Lantai keramik krem dengan nat. */
export function floorTexture(): CanvasTexture {
  const tex = canvasTexture(256, 256, (g, w, h) => {
    const rnd = lcg(7);
    g.fillStyle = '#d9d2c3';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(${120 + rnd() * 80},${110 + rnd() * 70},${90 + rnd() * 60},${0.05 + rnd() * 0.06})`;
      g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 2);
    }
    g.strokeStyle = '#b3aa98';
    g.lineWidth = 3;
    g.strokeRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.35)';
    g.lineWidth = 1;
    g.strokeRect(3, 3, w - 6, h - 6);
  });
  tex.wrapS = tex.wrapT = RepeatWrapping;
  return tex;
}

/** Dinding dua warna: krem di atas, hijau-kebiruan lembut di bawah (khas klinik). */
export function wallTexture(): CanvasTexture {
  const tex = canvasTexture(64, 512, (g, w, h) => {
    g.fillStyle = '#f1ebdf';
    g.fillRect(0, 0, w, h);
    const band = h * 0.36;
    g.fillStyle = '#c9dfd9';
    g.fillRect(0, h - band, w, band);
    g.fillStyle = '#9fbfb8';
    g.fillRect(0, h - band - 5, w, 5);
    g.fillStyle = '#b9b2a4';
    g.fillRect(0, h - 14, w, 14);
  });
  tex.wrapS = RepeatWrapping;
  return tex;
}

/** Serat kayu untuk meja & pintu. */
export function woodTexture(base = '#b98a5a', dark = '#8f6238'): CanvasTexture {
  const tex = canvasTexture(256, 256, (g, w, h) => {
    const rnd = lcg(21);
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      const y = rnd() * h;
      g.strokeStyle = dark;
      g.globalAlpha = 0.08 + rnd() * 0.16;
      g.lineWidth = 0.6 + rnd() * 1.8;
      g.beginPath();
      g.moveTo(0, y);
      g.bezierCurveTo(w * 0.3, y + (rnd() - 0.5) * 9, w * 0.7, y + (rnd() - 0.5) * 9, w, y + (rnd() - 0.5) * 5);
      g.stroke();
    }
    g.globalAlpha = 1;
  });
  tex.wrapS = tex.wrapT = RepeatWrapping;
  return tex;
}

/** Pemandangan di luar jendela: langit, awan, dan pepohonan buram. */
export function windowTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#bfe3ff');
    sky.addColorStop(0.6, '#eaf6ff');
    sky.addColorStop(1, '#f6fbf2');
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.9)';
    for (const [x, y, r] of [[60, 60, 26], [92, 52, 32], [128, 64, 24], [190, 96, 22], [214, 90, 28]] as const) {
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    const rnd = lcg(5);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = `rgba(${70 + rnd() * 50},${130 + rnd() * 60},${70 + rnd() * 40},0.75)`;
      g.beginPath();
      g.arc(rnd() * w, h - 20 - rnd() * 70, 16 + rnd() * 22, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/** Poster anatomi sederhana (siluet tubuh & organ). */
export function anatomyPosterTexture(): CanvasTexture {
  return canvasTexture(256, 384, (g, w, h) => {
    g.fillStyle = '#fbfaf6';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#2f6f73';
    g.fillRect(0, 0, w, 44);
    g.fillStyle = '#ffffff';
    g.font = 'bold 20px system-ui, sans-serif';
    g.textAlign = 'center';
    g.fillText('ANATOMI TUBUH', w / 2, 29);
    // siluet
    g.fillStyle = '#e8cdb6';
    g.beginPath();
    g.arc(w / 2, 86, 24, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.roundRect(w / 2 - 44, 114, 88, 150, 26);
    g.fill();
    g.fillRect(w / 2 - 70, 122, 24, 120);
    g.fillRect(w / 2 + 46, 122, 24, 120);
    g.fillRect(w / 2 - 38, 256, 32, 110);
    g.fillRect(w / 2 + 6, 256, 32, 110);
    // paru, jantung, hati, lambung, usus
    g.fillStyle = '#e59aa0';
    g.beginPath();
    g.ellipse(w / 2 - 20, 150, 15, 26, 0, 0, Math.PI * 2);
    g.ellipse(w / 2 + 20, 150, 15, 26, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#c0392b';
    g.beginPath();
    g.ellipse(w / 2 + 5, 158, 9, 11, 0.4, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#8e4b32';
    g.beginPath();
    g.ellipse(w / 2 - 14, 190, 22, 11, -0.2, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#d98c5f';
    g.beginPath();
    g.ellipse(w / 2 + 18, 196, 13, 10, 0.5, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#c97b63';
    g.lineWidth = 6;
    g.beginPath();
    for (let i = 0; i < 4; i++) {
      g.moveTo(w / 2 - 26, 216 + i * 10);
      g.lineTo(w / 2 + 26, 216 + i * 10);
    }
    g.stroke();
    g.strokeStyle = '#6b7780';
    g.lineWidth = 1;
    g.fillStyle = '#56636b';
    g.font = '11px system-ui, sans-serif';
    g.textAlign = 'left';
    for (const [label, x, y, tx, ty] of [['Paru', w / 2 + 30, 144, 196, 110], ['Jantung', w / 2 + 10, 160, 196, 170], ['Hati', w / 2 - 30, 190, 8, 200], ['Lambung', w / 2 + 26, 198, 190, 224], ['Usus', w / 2 - 26, 232, 8, 262]] as const) {
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(tx + 12, ty - 4);
      g.stroke();
      g.fillText(label, tx, ty);
    }
  });
}

/** Poster cuci tangan / etika batuk. */
export function hygienePosterTexture(): CanvasTexture {
  return canvasTexture(256, 320, (g, w, h) => {
    g.fillStyle = '#eaf5fb';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#1f78a8';
    g.fillRect(0, 0, w, 50);
    g.fillStyle = '#fff';
    g.font = 'bold 21px system-ui, sans-serif';
    g.textAlign = 'center';
    g.fillText('6 LANGKAH', w / 2, 24);
    g.font = 'bold 15px system-ui, sans-serif';
    g.fillText('CUCI TANGAN', w / 2, 43);
    for (let i = 0; i < 6; i++) {
      const cx = 48 + (i % 3) * 80;
      const cy = 110 + Math.floor(i / 3) * 104;
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.arc(cx, cy, 32, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#1f78a8';
      g.lineWidth = 3;
      g.stroke();
      g.fillStyle = '#e8c3a4';
      g.beginPath();
      g.ellipse(cx - 7, cy + 2, 11, 16, -0.4 + i * 0.25, 0, Math.PI * 2);
      g.ellipse(cx + 7, cy + 2, 11, 16, 0.4 - i * 0.2, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#1f78a8';
      g.font = 'bold 15px system-ui, sans-serif';
      g.fillText(String(i + 1), cx, cy + 50);
    }
    g.fillStyle = '#56636b';
    g.font = '12px system-ui, sans-serif';
    g.fillText('Tangan bersih, pasien selamat', w / 2, h - 12);
  });
}

/** Kartu Snellen (uji tajam penglihatan). */
export function snellenTexture(): CanvasTexture {
  return canvasTexture(192, 320, (g, w, h) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#333';
    g.lineWidth = 3;
    g.strokeRect(2, 2, w - 4, h - 4);
    g.fillStyle = '#111';
    g.textAlign = 'center';
    const rows = ['E', 'F P', 'T O Z', 'L P E D', 'P E C F D', 'E D F C Z P', 'F E L O P Z D'];
    let y = 62;
    rows.forEach((row, i) => {
      const size = 58 - i * 7.5;
      g.font = `bold ${size}px ui-monospace, monospace`;
      g.fillText(row, w / 2, y);
      y += size * 0.62 + 16;
    });
    g.fillStyle = '#c0392b';
    g.fillRect(20, h - 44, w - 40, 3);
    g.fillStyle = '#2e8b57';
    g.fillRect(20, h - 26, w - 40, 3);
  });
}

/** Lembar formulir di papan klip. */
export function formTexture(): CanvasTexture {
  return canvasTexture(128, 180, (g, w, h) => {
    g.fillStyle = '#fdfdfb';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#2f6f73';
    g.fillRect(8, 8, w - 16, 14);
    g.fillStyle = '#9aa5ab';
    for (let y = 34; y < h - 10; y += 11) g.fillRect(10, y, (w - 20) * (0.55 + ((y * 7) % 40) / 100), 2);
  });
}

/** Kalender meja: menampilkan tanggal hari ini. */
export function calendarTexture(date: Date): CanvasTexture {
  const bulan = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
  return canvasTexture(128, 128, (g, w, h) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#c0392b';
    g.fillRect(0, 0, w, 38);
    g.fillStyle = '#ffffff';
    g.font = 'bold 24px system-ui, sans-serif';
    g.textAlign = 'center';
    g.fillText(bulan[date.getMonth()]!, w / 2, 28);
    g.fillStyle = '#22303a';
    g.font = 'bold 66px system-ui, sans-serif';
    g.fillText(String(date.getDate()), w / 2, 104);
  });
}

/** Muka jam dinding (tanpa jarum). */
export function clockTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#fdfdfb';
    g.beginPath();
    g.arc(w / 2, h / 2, 124, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#1e2a33';
    g.font = 'bold 26px system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (let i = 1; i <= 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      g.fillText(String(i), w / 2 + Math.cos(a) * 98, h / 2 + Math.sin(a) * 98);
    }
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const r0 = i % 5 === 0 ? 112 : 117;
      g.strokeStyle = '#1e2a33';
      g.lineWidth = i % 5 === 0 ? 3 : 1;
      g.beginPath();
      g.moveTo(w / 2 + Math.cos(a) * r0, h / 2 + Math.sin(a) * r0);
      g.lineTo(w / 2 + Math.cos(a) * 122, h / 2 + Math.sin(a) * 122);
      g.stroke();
    }
  });
}

/** Papan nama di atas pintu / tanda kecil. */
export function signTexture(text: string, bg = '#2f6f73', fg = '#ffffff'): CanvasTexture {
  const tex = canvasTexture(256, 64, (g, w, h) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.fillStyle = fg;
    g.font = 'bold 30px system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + 2);
  });
  tex.minFilter = LinearFilter;
  return tex;
}

/** Kulit lengan dengan bintik merah (petekie). */
export function rashTexture(skin: string, seed: number): CanvasTexture {
  return canvasTexture(64, 64, (g, w, h) => {
    const rnd = lcg(seed || 1);
    g.fillStyle = skin;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {
      g.fillStyle = `rgba(${175 + rnd() * 40},${20 + rnd() * 25},${25 + rnd() * 25},${0.8 + rnd() * 0.2})`;
      g.beginPath();
      g.arc(rnd() * w, rnd() * h, 1.8 + rnd() * 1.8, 0, Math.PI * 2);
      g.fill();
    }
  });
}
