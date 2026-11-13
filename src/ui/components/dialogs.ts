/**
 * Dialog: panduan bermain, pengaturan, dan rekam medis pasien.
 */
import { formatRupiah } from '../../core/text';
import type { App } from '../app';
import { type Child, cx, h } from '../dom';
import { modal } from './modal';
import { SEX_LABEL } from '../labels';

// ---------------------------------------------------------------------------
// Panduan bermain
// ---------------------------------------------------------------------------

interface TutorialStep {
  icon: string;
  title: string;
  points: string[];
}

export function tutorialSteps(app: App): TutorialStep[] {
  const { config } = app;
  const w = config.evaluation.weights;
  return [
    {
      icon: '🩺',
      title: 'Selamat datang di meja praktek',
      points: [
        'Anda adalah dokter umum yang duduk di belakang meja periksa. Pasien masuk lewat pintu, menyapa, lalu duduk di hadapan Anda.',
        'Yang dinilai bukan hanya diagnosis akhir, tetapi seluruh proses penalaran klinis Anda.',
        'Seret layar untuk melihat sekeliling ruangan. Monitor RME di meja berisi semua tindakan Anda.',
        'Game ini hiburan & edukasi, bukan alat medis. Kontennya belum ditinjau dokter.',
      ],
    },
    {
      icon: '👀',
      title: 'Amati pasien',
      points: [
        'Observasi dimulai sejak pasien masuk: cara berjalan, postur, napas, warna kulit, ekspresi, dan bagian tubuh yang dipegang.',
        'Yang terlihat selalu sesuai kasusnya — sesak, batuk, menggigil, pucat, kuning, ruam, pincang — tetapi banyak gejala TIDAK terlihat dan harus ditanyakan atau diperiksa.',
        'Saat menjawab, pasien memakai bahasa tubuh: menunjuk lokasi nyeri, memperagakan batuk, mengangguk, menggeleng, atau tampak bingung.',
      ],
    },
    {
      icon: '💬',
      title: '1 · Anamnesis bebas',
      points: [
        'Ketik pertanyaan dengan bahasa Anda sendiri, tanpa batas jumlah. Jawaban pasien muncul sebagai teks berjalan di ruangan dan tersimpan di riwayat percakapan pada monitor.',
        'Keluhan awal TIDAK pernah lengkap. Gali onset, lokasi, karakter, durasi, keparahan, pola, perjalanan, pemberat/peringan, keluhan lain, episode sebelumnya, riwayat penyakit/obat/alergi/keluarga, lingkungan, dan kebiasaan.',
        'Beberapa gejala tidak disebut sukarela (mis. BAB hitam) — tanyakan spesifik atau lewat tinjauan sistem ("BAB-nya bagaimana?").',
        app.ai === 'ready'
          ? 'Di claude.ai, pasien diperankan Claude (bisa dimatikan di Pengaturan).'
          : 'Di luar claude.ai, pasien memakai pemahaman bahasa lokal: gunakan kata kunci yang jelas.',
      ],
    },
    {
      icon: '🩻',
      title: '2–3 · Pemeriksaan',
      points: [
        'Pemeriksaan fisik gratis, dikelompokkan per sistem. Tanda vital lengkap (TD, nadi, napas, suhu, SpO₂) wajib pada setiap pasien.',
        'Penunjang memotong budget pasien. Pilih sesuai tujuan: identifikasi penyakit, fungsi organ, struktur, atau komplikasi.',
        'Hasil normal tidak selalu menyingkirkan penyakit (mis. fungsi ginjal normal pada batu saluran kemih). Tes bisa positif/negatif palsu.',
      ],
    },
    {
      icon: '🧠',
      title: '4 · Penalaran',
      points: [
        'Susun diagnosis banding di tab Penalaran, termasuk yang berbahaya. Tandai satu sebagai diagnosis kerja.',
        'Singkirkan diagnosis lain DENGAN bukti — menyingkirkan tanpa data pembeda akan dikoreksi.',
        'Pertimbangkan komorbiditas (mis. hipertensi, diabetes) dan temuan insidental yang Anda temukan.',
      ],
    },
    {
      icon: '⚖️',
      title: '5 · Keputusan & penilaian',
      points: [
        'Tentukan diagnosis kerja, komplikasi (atau tanpa komplikasi), masalah lain, dan disposisi: rawat jalan, observasi, rujuk spesialis, atau rujuk segera.',
        `Bobot nilai: anamnesis ${w.anamnesis}% · fisik ${w.fisik}% · penunjang ${w.penunjang}% · diagnosis banding ${w.banding}% · komplikasi ${w.komplikasi}% · diagnosis & tata laksana ${w.keputusan}%.`,
        `Reputasi naik bila skor di atas ${config.reputation.neutralScore}; turun lebih besar bila penyakit berbahaya terlewat atau pasien gawat dipulangkan. Di bawah ${config.reputation.gameOverBelow}: game over.`,
        'Pelajari umpan baliknya: yang terlewat, asumsi yang keliru, dan pendekatan yang dianjurkan.',
      ],
    },
  ];
}

export function tutorialDialog(app: App): HTMLElement {
  const steps = tutorialSteps(app);
  const i = Math.min(app.ui.tutorialStep, steps.length - 1);
  const step = steps[i]!;
  const last = i === steps.length - 1;
  return modalShell(
    app,
    'Panduan bermain',
    h(
      'div',
      { class: 'tutorial' },
      h('div', { class: 'tutorial__icon', 'aria-hidden': 'true' }, step.icon),
      h('h3', null, step.title),
      h('ul', { class: 'plain-list' }, step.points.map((p) => h('li', null, p))),
      h(
        'p',
        { class: 'tutorial__dots', 'aria-label': `Langkah ${i + 1} dari ${steps.length}` },
        steps.map((_, j) => h('span', { class: cx('dot', j === i && 'is-active') })),
      ),
    ),
    [
      i > 0 ? h('button', { class: 'btn', type: 'button', onclick: () => app.setTutorialStep(i - 1) }, 'Kembali') : null,
      last
        ? h('button', { class: 'btn btn--primary', type: 'button', 'data-autofocus': true, onclick: () => app.closeDialog() }, 'Mengerti, mulai!')
        : h('button', { class: 'btn btn--primary', type: 'button', 'data-autofocus': true, onclick: () => app.setTutorialStep(i + 1) }, 'Lanjut'),
    ],
  );
}

// ---------------------------------------------------------------------------
// Pengaturan
// ---------------------------------------------------------------------------

export function settingsDialog(app: App): HTMLElement {
  const s = app.settings;
  const themeOption = (value: typeof s.theme, label: string) =>
    h(
      'label',
      { class: 'radio' },
      h('input', { type: 'radio', name: 'tema', value, checked: s.theme === value, onchange: () => app.updateSettings({ theme: value }) }),
      ` ${label}`,
    );
  return modalShell(
    app,
    'Pengaturan',
    h(
      'div',
      { class: 'settings' },
      h('fieldset', null, h('legend', null, 'Tema tampilan'), themeOption('system', 'Ikuti perangkat'), themeOption('light', 'Terang'), themeOption('dark', 'Gelap')),
      h(
        'fieldset',
        null,
        h('legend', null, 'Akurasi tes'),
        h(
          'label',
          { class: 'radio' },
          h('input', {
            type: 'checkbox',
            checked: s.realisticTests,
            onchange: (e: Event) => app.updateSettings({ realisticTests: (e.target as HTMLInputElement).checked }),
          }),
          ' Realistis — tes bisa negatif palsu / positif palsu',
        ),
        h('p', { class: 'hint' }, 'Matikan untuk mode latihan: tes diagnostik selalu akurat. Berlaku mulai pasien berikutnya.'),
      ),
      h(
        'fieldset',
        null,
        h('legend', null, 'Pasien AI'),
        h(
          'label',
          { class: 'radio' },
          h('input', {
            type: 'checkbox',
            checked: s.aiPatient,
            disabled: app.ai === 'unavailable',
            onchange: (e: Event) => app.updateSettings({ aiPatient: (e.target as HTMLInputElement).checked }),
          }),
          ' Pasien diperankan Claude',
        ),
        h(
          'p',
          { class: 'hint' },
          app.ai === 'ready'
            ? 'Claude memahami pertanyaan bebas & menjawab dengan gaya pasien. Fakta medis tetap dari mesin kasus (tidak dikarang). Memakai kuota Claude akun Anda.'
            : app.ai === 'checking'
              ? 'Memeriksa ketersediaan…'
              : 'Tidak tersedia di sini (hanya saat dibuka di claude.ai dengan izin Claude). Mode lokal dipakai.',
        ),
      ),
      h('button', { class: 'btn btn--small', type: 'button', onclick: () => app.openTutorial() }, 'Lihat panduan bermain'),
    ),
    h('button', { class: 'btn btn--primary', type: 'button', 'data-autofocus': true, onclick: () => app.closeDialog() }, 'Selesai'),
  );
}

// ---------------------------------------------------------------------------
// Rekam medis
// ---------------------------------------------------------------------------

export function medicalRecordDialog(app: App): HTMLElement {
  const enc = app.encounter!;
  const c = enc.case;
  const p = c.patient;
  const { content } = app;
  const personality = content.personalitiesById.get(p.personalityId);

  const symptomLabel = (id: string) => content.symptomsById.get(id)?.label ?? id;
  const denied = enc.askedSymptoms.filter((id) => !enc.revealedSymptoms.includes(id));
  const topics = content.anamnesis.filter((t) => enc.askedTopics.includes(t.id));

  const exams = enc.examsDone.map((toolId) => {
    const tool = content.toolsById.get(toolId)!;
    const results = c.findings[toolId] ?? [];
    const abnormal = results.filter((r) => r.flag);
    return h(
      'li',
      null,
      h('strong', null, tool.name),
      abnormal.length
        ? h(
            'ul',
            { class: 'record-abnormal' },
            abnormal.map((r) => h('li', null, `${r.label}: `, h('strong', { class: 'abnormal' }, `${r.display}${r.unit ? ` ${r.unit}` : ''}`), r.refText ? h('span', { class: 'muted' }, ` (rujukan ${r.refText})`) : null)),
          )
        : h('span', { class: 'muted' }, ' — dalam batas normal'),
    );
  });

  const conversation = enc.log.filter((e) => e.kind === 'doctor' || e.kind === 'patient');
  return modalShell(
    app,
    'Rekam medis',
    h(
      'div',
      { class: 'record' },
      h('p', null, h('strong', null, p.name), ` · ${p.age} th · ${SEX_LABEL[p.sex]} · ${p.occupationLabel}`),
      personality ? h('p', { class: 'muted' }, `Kesan umum: ${personality.impression.toLowerCase()}.`) : null,
      h('h3', null, 'Keluhan utama'),
      // Keluhan baru tercatat setelah pasien mengucapkannya (adegan kedatangan).
      h('p', app.ui.intro >= 2 ? null : { class: 'muted' }, app.ui.intro >= 2 ? c.complaint : 'Pasien belum menyampaikan keluhannya.'),
      h('h3', null, 'Gejala yang diketahui'),
      enc.revealedSymptoms.length
        ? h('ul', { class: 'chip-row' }, enc.revealedSymptoms.map((id) => h('li', { class: 'tag' }, symptomLabel(id))))
        : h('p', { class: 'muted' }, 'Belum ada.'),
      denied.length ? h('p', { class: 'muted' }, `Disangkal / tidak jelas: ${denied.map(symptomLabel).join(', ')}.`) : null,
      h('h3', null, `Topik anamnesis yang sudah ditanyakan (${topics.length})`),
      topics.length ? h('p', null, topics.map((t) => t.label).join(' · ')) : h('p', { class: 'muted' }, 'Belum ada.'),
      conversation.length > 2
        ? h(
            'details',
            { class: 'frame' },
            h('summary', null, 'Transkrip percakapan'),
            h(
              'dl',
              { class: 'record-qa' },
              conversation.slice(2).map((e) => [h('dt', null, e.kind === 'doctor' ? 'Dokter' : p.callName), h('dd', null, 'text' in e ? e.text : '')]),
            ),
          )
        : null,
      h('h3', null, 'Pemeriksaan'),
      exams.length ? h('ul', { class: 'record-exams' }, exams) : h('p', { class: 'muted' }, 'Belum ada pemeriksaan.'),
      enc.ddx.length
        ? [
            h('h3', null, 'Diagnosis banding'),
            h('p', null, enc.ddx.map((d) => `${content.catalogById.get(d.id)?.name ?? d.id} (${d.status})`).join(' · ')),
          ]
        : null,
      h('p', { class: 'hint' }, `Biaya terpakai ${formatRupiah(enc.spent)} · sisa budget ${formatRupiah(enc.budgetRemaining)}.`),
    ),
    h('button', { class: 'btn btn--primary', type: 'button', 'data-autofocus': true, onclick: () => app.closeDialog() }, 'Tutup'),
  );
}

function modalShell(app: App, title: string, body: HTMLElement, actions: Child): HTMLElement {
  return modal({ title, body, actions, wide: true, onClose: () => app.closeDialog() });
}
