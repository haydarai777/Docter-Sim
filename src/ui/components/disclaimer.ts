import { h } from '../dom';

/** Disclaimer wajib: game ini hiburan/edukasi, bukan alat medis. */
export function disclaimer(compact = false): HTMLElement {
  if (compact) {
    return h(
      'p',
      { class: 'disclaimer disclaimer--compact' },
      'Hiburan & edukasi — bukan alat diagnosis medis. Konten medis belum ditinjau dokter.',
    );
  }
  return h(
    'aside',
    { class: 'disclaimer', role: 'note', 'aria-label': 'Penafian' },
    h('strong', null, 'Penting: '),
    'Meja Praktek adalah permainan untuk hiburan dan edukasi, ',
    h('strong', null, 'bukan alat diagnosis medis'),
    ' dan tidak menggantikan konsultasi dengan tenaga kesehatan. ',
    'Seluruh konten medis masih ',
    h('strong', null, 'belum ditinjau dokter'),
    '. Jika Anda merasa sakit, segera periksakan diri ke fasilitas kesehatan.',
  );
}
