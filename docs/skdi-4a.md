# Cakupan SKDI tingkat kemampuan 4A

Game memuat **146 penyakit**: **144 penyakit tingkat 4A** (seluruh daftar 4A SKDI 2012) ditambah 2 penyakit tingkat 3A yang sengaja dipertahankan sebagai pengecoh klinis. Setiap penyakit dapat dimainkan di mode praktek (pilih *Pasien yang datang* di layar judul untuk berlatih satu sistem organ) dan memiliki kunci stasiun OSCE (resep, non-farmakologi, KIE).

> ⚠ Daftar mengacu pada **Standar Kompetensi Dokter Indonesia (SKDI) 2012 — Perkonsil No. 11/2012**. Bila terbit revisi SKDI, cocokkan ulang daftar ini. Seluruh konten **belum ditinjau dokter** — lihat `REVIEW.md`.

Tabel dibuat otomatis oleh `scripts/content-gen/skdi_doc.py` dari `src/data/diseases/*.json`.

| Sistem organ | Jumlah |
|---|---|
| Darah & imunologi | 4 |
| Endokrin & metabolik | 9 |
| Infeksi tropis | 5 |
| Jantung & pembuluh darah | 2 |
| Jiwa | 2 |
| Kelamin & reproduksi | 8 |
| Kepala & saraf | 6 |
| Kulit & kelamin | 46 |
| Mata | 13 |
| Obstetri & ginekologi | 7 |
| Pencernaan | 18 |
| Pernapasan | 6 |
| Saluran kemih | 3 |
| Telinga, hidung & tenggorok | 13 |
| Trauma & forensik | 4 |
| **Total** | **146** |

## Darah & imunologi

| No. | Penyakit | Id data | SKDI | Tingkat bahaya | Kunci OSCE |
|---|---|---|---|---|---|
| 1 | Anemia defisiensi besi | `anemia_defisiensi_besi` | 4A | sedang | ✓ |
| 2 | HIV/AIDS tanpa komplikasi | `hiv` | 4A | tinggi | ✓ |
| 3 | Limfadenitis akut | `limfadenitis` | 4A | rendah | ✓ |
| 4 | Reaksi anafilaktik | `reaksi_anafilaktik` | 4A | kritis | ✓ |

## Endokrin & metabolik

| No. | Penyakit | Id data | SKDI | Tingkat bahaya | Kunci OSCE |
|---|---|---|---|---|---|
| 5 | Defisiensi mineral (iodium, kalsium) | `defisiensi_mineral` | 4A | rendah | ✓ |
| 6 | Defisiensi vitamin (B1, B kompleks, C) | `defisiensi_vitamin` | 4A | rendah | ✓ |
| 7 | Diabetes melitus tipe 1 | `dm_tipe1` | 4A | tinggi | ✓ |
| 8 | Diabetes Melitus Tipe 2 | `dm_tipe2` | 4A | sedang | ✓ |
| 9 | Dislipidemia | `dislipidemia` | 4A | rendah | ✓ |
| 10 | Hiperurisemia & artritis gout | `hiperurisemia` | 4A | rendah | ✓ |
| 11 | Hipoglikemia ringan | `hipoglikemia` | 4A | sedang | ✓ |
| 12 | Malnutrisi energi-protein | `malnutrisi_energi_protein` | 4A | tinggi | ✓ |
| 13 | Obesitas | `obesitas` | 4A | rendah | ✓ |

## Infeksi tropis

| No. | Penyakit | Id data | SKDI | Tingkat bahaya | Kunci OSCE |
|---|---|---|---|---|---|
| 14 | Demam Tifoid | `demam_tifoid` | 4A | sedang | ✓ |
| 15 | Filariasis limfatik | `filariasis` | 4A | sedang | ✓ |
| 16 | Infeksi Dengue (Demam Dengue / DBD) | `dengue` | 4A | tinggi | ✓ |
| 17 | Leptospirosis tanpa komplikasi | `leptospirosis` | 4A | tinggi | ✓ |
| 18 | Malaria | `malaria` | 4A | tinggi | ✓ |

## Jantung & pembuluh darah

| No. | Penyakit | Id data | SKDI | Tingkat bahaya | Kunci OSCE |
|---|---|---|---|---|---|
| 19 | Angina Pektoris Stabil | `angina_stabil` | 3A | kritis | ✓ |
| 20 | Hipertensi esensial | `hipertensi` | 4A | sedang | ✓ |

## Jiwa

| No. | Penyakit | Id data | SKDI | Tingkat bahaya | Kunci OSCE |
|---|---|---|---|---|---|
| 21 | Gangguan somatoform | `gangguan_somatoform` | 4A | rendah | ✓ |
| 22 | Insomnia | `insomnia` | 4A | rendah | ✓ |

## Kelamin & reproduksi

| No. | Penyakit | Id data | SKDI | Tingkat bahaya | Kunci OSCE |
|---|---|---|---|---|---|
| 23 | Fimosis | `fimosis` | 4A | rendah | ✓ |
| 24 | Gonore | `gonore` | 4A | sedang | ✓ |
| 25 | Parafimosis | `parafimosis` | 4A | tinggi | ✓ |
| 26 | Salpingitis (penyakit radang panggul) | `salpingitis` | 4A | tinggi | ✓ |
| 27 | Sindrom duh genital non-gonore (uretritis/servisitis non-gonore) | `uretritis_non_gonore` | 4A | rendah | ✓ |
| 28 | Vaginitis (kandidiasis vulvovaginal / trikomoniasis) | `vaginitis` | 4A | rendah | ✓ |
| 29 | Vaginosis bakterialis | `vaginosis_bakterialis` | 4A | rendah | ✓ |
| 30 | Vulvitis | `vulvitis` | 4A | rendah | ✓ |

## Kepala & saraf

| No. | Penyakit | Id data | SKDI | Tingkat bahaya | Kunci OSCE |
|---|---|---|---|---|---|
| 31 | Bell's palsy | `bells_palsy` | 4A | sedang | ✓ |
| 32 | Kejang demam | `kejang_demam` | 4A | tinggi | ✓ |
| 33 | Migren | `migren` | 4A | rendah | ✓ |
| 34 | Tension-type headache | `tension_headache` | 4A | rendah | ✓ |
| 35 | Tetanus | `tetanus` | 4A | kritis | ✓ |
| 36 | Vertigo (Benign paroxysmal positional vertigo) | `bppv` | 4A | rendah | ✓ |

## Kulit & kelamin

| No. | Penyakit | Id data | SKDI | Tingkat bahaya | Kunci OSCE |
|---|---|---|---|---|---|
| 37 | Abses folikel rambut/kelenjar sebasea | `abses_folikel` | 4A | sedang | ✓ |
| 38 | Akne vulgaris ringan | `akne_vulgaris` | 4A | rendah | ✓ |
| 39 | Alergi makanan | `alergi_makanan` | 4A | sedang | ✓ |
| 40 | Cutaneous larva migrans | `cutaneous_larva_migrans` | 4A | rendah | ✓ |
| 41 | Dermatitis atopik | `dermatitis_atopik` | 4A | rendah | ✓ |
| 42 | Dermatitis kontak iritan | `dermatitis_kontak_iritan` | 4A | rendah | ✓ |
| 43 | Dermatitis numularis | `dermatitis_numularis` | 4A | rendah | ✓ |
| 44 | Dermatitis perioral | `dermatitis_perioral` | 4A | rendah | ✓ |
| 45 | Dermatitis seboroik | `dermatitis_seboroik` | 4A | rendah | ✓ |
| 46 | Erisipelas | `erisipelas` | 4A | sedang | ✓ |
| 47 | Eritrasma | `eritrasma` | 4A | rendah | ✓ |
| 48 | Erupsi obat (eksantematosa & fixed drug eruption) | `erupsi_obat` | 4A | sedang | ✓ |
| 49 | Folikulitis superfisialis | `folikulitis` | 4A | rendah | ✓ |
| 50 | Furunkel dan karbunkel | `furunkel_karbunkel` | 4A | sedang | ✓ |
| 51 | Herpes simpleks tanpa komplikasi | `herpes_simpleks` | 4A | rendah | ✓ |
| 52 | Herpes zoster tanpa komplikasi | `herpes_zoster` | 4A | sedang | ✓ |
| 53 | Hidradenitis supurativa | `hidradenitis_supurativa` | 4A | rendah | ✓ |
| 54 | Impetigo | `impetigo` | 4A | rendah | ✓ |
| 55 | Impetigo ulseratif (ektima) | `ektima` | 4A | rendah | ✓ |
| 56 | Kandidosis mukokutan ringan (kandidosis kutis) | `kandidosis_kutis` | 4A | rendah | ✓ |
| 57 | Lepra (kusta) | `kusta` | 4A | sedang | ✓ |
| 58 | Lipoma | `lipoma` | 4A | rendah | ✓ |
| 59 | Miliaria | `miliaria` | 4A | rendah | ✓ |
| 60 | Moluskum kontagiosum | `moluskum_kontagiosum` | 4A | rendah | ✓ |
| 61 | Morbili (campak) tanpa komplikasi | `morbili` | 4A | sedang | ✓ |
| 62 | Napkin eczema (dermatitis popok) | `napkin_eczema` | 4A | rendah | ✓ |
| 63 | Pedikulosis kapitis | `pedikulosis_kapitis` | 4A | rendah | ✓ |
| 64 | Pedikulosis pubis | `pedikulosis_pubis` | 4A | rendah | ✓ |
| 65 | Pitiriasis rosea | `pitiriasis_rosea` | 4A | rendah | ✓ |
| 66 | Pitiriasis versikolor | `pitiriasis_versikolor` | 4A | rendah | ✓ |
| 67 | Reaksi gigitan serangga | `reaksi_gigitan_serangga` | 4A | rendah | ✓ |
| 68 | Sifilis stadium 1 dan 2 | `sifilis` | 4A | tinggi | ✓ |
| 69 | Skabies | `skabies` | 4A | rendah | ✓ |
| 70 | Skrofuloderma | `skrofuloderma` | 4A | sedang | ✓ |
| 71 | Tinea barbae | `tinea_barbae` | 4A | rendah | ✓ |
| 72 | Tinea fasialis | `tinea_fasialis` | 4A | rendah | ✓ |
| 73 | Tinea kapitis | `tinea_kapitis` | 4A | rendah | ✓ |
| 74 | Tinea korporis | `tinea_korporis` | 4A | rendah | ✓ |
| 75 | Tinea kruris | `tinea_kruris` | 4A | rendah | ✓ |
| 76 | Tinea manus | `tinea_manus` | 4A | rendah | ✓ |
| 77 | Tinea pedis | `tinea_pedis` | 4A | rendah | ✓ |
| 78 | Tinea unguium (onikomikosis) | `tinea_unguium` | 4A | rendah | ✓ |
| 79 | Ulkus pada tungkai (ulkus vena) | `ulkus_tungkai` | 4A | sedang | ✓ |
| 80 | Urtikaria akut | `urtikaria_akut` | 4A | rendah | ✓ |
| 81 | Varisela tanpa komplikasi | `varisela` | 4A | rendah | ✓ |
| 82 | Veruka vulgaris | `veruka_vulgaris` | 4A | rendah | ✓ |

## Mata

| No. | Penyakit | Id data | SKDI | Tingkat bahaya | Kunci OSCE |
|---|---|---|---|---|---|
| 83 | Astigmatisma ringan | `astigmatisma` | 4A | rendah | ✓ |
| 84 | Benda asing di konjungtiva | `benda_asing_konjungtiva` | 4A | sedang | ✓ |
| 85 | Blefaritis | `blefaritis` | 4A | rendah | ✓ |
| 86 | Buta senja (rabun senja / xeroftalmia XN) | `buta_senja` | 4A | sedang | ✓ |
| 87 | Episkleritis | `episkleritis` | 4A | rendah | ✓ |
| 88 | Hipermetropia ringan | `hipermetropia` | 4A | rendah | ✓ |
| 89 | Hordeolum | `hordeolum` | 4A | rendah | ✓ |
| 90 | Konjungtivitis | `konjungtivitis` | 4A | rendah | ✓ |
| 91 | Mata kering (dry eye) | `mata_kering` | 4A | rendah | ✓ |
| 92 | Miopia ringan | `miopia` | 4A | rendah | ✓ |
| 93 | Perdarahan subkonjungtiva | `perdarahan_subkonjungtiva` | 4A | rendah | ✓ |
| 94 | Presbiopia | `presbiopia` | 4A | rendah | ✓ |
| 95 | Trikiasis | `trikiasis` | 4A | rendah | ✓ |

## Obstetri & ginekologi

| No. | Penyakit | Id data | SKDI | Tingkat bahaya | Kunci OSCE |
|---|---|---|---|---|---|
| 96 | Aborsi spontan komplit | `abortus_komplit` | 4A | sedang | ✓ |
| 97 | Anemia defisiensi besi pada kehamilan | `anemia_kehamilan` | 4A | sedang | ✓ |
| 98 | Cracked nipple (puting lecet) | `cracked_nipple` | 4A | rendah | ✓ |
| 99 | Inverted nipple (puting tenggelam) | `inverted_nipple` | 4A | rendah | ✓ |
| 100 | Kehamilan normal | `kehamilan_normal` | 4A | rendah | ✓ |
| 101 | Mastitis | `mastitis` | 4A | sedang | ✓ |
| 102 | Ruptur perineum tingkat 1–2 | `ruptur_perineum` | 4A | sedang | ✓ |

## Pencernaan

| No. | Penyakit | Id data | SKDI | Tingkat bahaya | Kunci OSCE |
|---|---|---|---|---|---|
| 103 | Askariasis | `askariasis` | 4A | rendah | ✓ |
| 104 | Disentri basiler dan disentri amuba | `disentri` | 4A | sedang | ✓ |
| 105 | Dispepsia fungsional | `dispepsia` | 4A | rendah | ✓ |
| 106 | Gastritis akut | `gastritis` | 4A | sedang | ✓ |
| 107 | Gastroenteritis akut (termasuk kolera & giardiasis) | `gastroenteritis_akut` | 4A | sedang | ✓ |
| 108 | Hemoroid grade 1–2 | `hemoroid` | 4A | rendah | ✓ |
| 109 | Hepatitis A | `hepatitis_a` | 4A | sedang | ✓ |
| 110 | Infeksi pada umbilikus (omfalitis) | `infeksi_umbilikus` | 4A | tinggi | ✓ |
| 111 | Intoleransi makanan (intoleransi laktosa) | `intoleransi_makanan` | 4A | rendah | ✓ |
| 112 | Kandidiasis mulut (oral thrush) | `kandidiasis_mulut` | 4A | rendah | ✓ |
| 113 | Keracunan makanan | `keracunan_makanan` | 4A | sedang | ✓ |
| 114 | Parotitis epidemika (gondongan) | `parotitis` | 4A | rendah | ✓ |
| 115 | Penyakit cacing tambang (ankilostomiasis) | `cacing_tambang` | 4A | sedang | ✓ |
| 116 | Penyakit Refluks Gastroesofageal (GERD) | `gerd` | 4A | rendah | ✓ |
| 117 | Skistosomiasis | `skistosomiasis` | 4A | sedang | ✓ |
| 118 | Strongiloidiasis | `strongiloidiasis` | 4A | sedang | ✓ |
| 119 | Taeniasis | `taeniasis` | 4A | rendah | ✓ |
| 120 | Ulkus mulut (stomatitis aftosa/herpetik) | `ulkus_mulut` | 4A | rendah | ✓ |

## Pernapasan

| No. | Penyakit | Id data | SKDI | Tingkat bahaya | Kunci OSCE |
|---|---|---|---|---|---|
| 121 | Asma Bronkial (Serangan Ringan–Sedang) | `asma` | 4A | sedang | ✓ |
| 122 | Bronkitis akut | `bronkitis_akut` | 4A | rendah | ✓ |
| 123 | Influenza | `influenza` | 4A | sedang | ✓ |
| 124 | Pertusis | `pertusis` | 4A | sedang | ✓ |
| 125 | Pneumonia Komunitas | `pneumonia` | 4A | tinggi | ✓ |
| 126 | Tuberkulosis Paru | `tb_paru` | 4A | tinggi | ✓ |

## Saluran kemih

| No. | Penyakit | Id data | SKDI | Tingkat bahaya | Kunci OSCE |
|---|---|---|---|---|---|
| 127 | Batu Saluran Kemih dengan Kolik (Urolitiasis) | `batu_saluran_kemih` | 3A | sedang | ✓ |
| 128 | Infeksi Saluran Kemih Bawah (Sistitis) | `isk` | 4A | rendah | ✓ |
| 129 | Pielonefritis akut tanpa komplikasi | `pielonefritis` | 4A | sedang | ✓ |

## Telinga, hidung & tenggorok

| No. | Penyakit | Id data | SKDI | Tingkat bahaya | Kunci OSCE |
|---|---|---|---|---|---|
| 130 | Benda asing di hidung atau telinga | `benda_asing_tht` | 4A | sedang | ✓ |
| 131 | Epistaksis | `epistaksis` | 4A | sedang | ✓ |
| 132 | Faringitis akut | `faringitis` | 4A | rendah | ✓ |
| 133 | Furunkel pada hidung | `furunkel_hidung` | 4A | sedang | ✓ |
| 134 | Laringitis akut | `laringitis` | 4A | rendah | ✓ |
| 135 | Mabuk perjalanan (motion sickness) | `mabuk_perjalanan` | 4A | rendah | ✓ |
| 136 | Otitis eksterna | `otitis_eksterna` | 4A | rendah | ✓ |
| 137 | Otitis media akut | `otitis_media_akut` | 4A | sedang | ✓ |
| 138 | Rinitis akut (common cold) | `rinitis_akut` | 4A | rendah | ✓ |
| 139 | Rinitis alergi | `rinitis_alergi` | 4A | rendah | ✓ |
| 140 | Rinitis vasomotor | `rinitis_vasomotor` | 4A | rendah | ✓ |
| 141 | Serumen prop | `serumen_prop` | 4A | rendah | ✓ |
| 142 | Tonsilitis | `tonsilitis` | 4A | rendah | ✓ |

## Trauma & forensik

| No. | Penyakit | Id data | SKDI | Tingkat bahaya | Kunci OSCE |
|---|---|---|---|---|---|
| 143 | Luka akibat kekerasan tajam | `kekerasan_tajam` | 4A | tinggi | ✓ |
| 144 | Luka akibat kekerasan tumpul | `kekerasan_tumpul` | 4A | sedang | ✓ |
| 145 | Luka bakar derajat 1 dan 2 | `luka_bakar` | 4A | sedang | ✓ |
| 146 | Vulnus laseratum dan punctum | `vulnus` | 4A | sedang | ✓ |

## Catatan pemetaan

- Beberapa butir SKDI digabung menjadi satu penyakit bila presentasi & tatalaksananya sama di layanan primer, mis. benda asing di telinga & hidung (`benda_asing_tht`), vulnus laseratum & punctum (`vulnus`), exanthematous drug eruption & fixed drug eruption (`erupsi_obat`), disentri basiler & amuba (`disentri`), defisiensi iodium & kalsium (`defisiensi_mineral`). Varian dibedakan lewat *trait* kasus sehingga keduanya muncul dalam permainan.
- Butir dengan batasan ("ringan", "tanpa komplikasi", "derajat 1–2") dimodelkan dalam batasan itu; kasus yang berkembang menjadi komplikasi muncul sebagai trait berbahaya yang wajib dikenali & dirujuk.
- Angina pektoris stabil & batu saluran kemih (3A) dipertahankan sebagai diagnosis banding yang wajib dikenali.
