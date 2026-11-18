"""Gejala baru untuk 144 penyakit SKDI 4A + kelompok tinjauan sistem."""
from lib import S, review_add, NEW_REVIEWS

MATA = "Mata"
THT = "Telinga, hidung & tenggorok"
SARAF = "Kepala & saraf"
JIWA = "Jiwa & tidur"
KULIT = "Kulit & perdarahan"
KEL = "Kelamin & reproduksi"
ANAK = "Anak"
TRAUMA = "Trauma & luka"
ENDO = "Endokrin & metabolik"
GI = "Pencernaan"
UMUM = "Umum"

# ------------------------------------------------------------------------------ MATA
S("mata_merah", "Mata merah", MATA, "Apakah matanya merah?",
  ["mata saya merah", "mata saya merah dan nggak enak"], ["kayaknya mata saya agak lain"],
  ["mata saya merah sekali kayak darah"], ["mata agak merah sedikit, paling kurang tidur"],
  kw=["mata merah", "mata memerah", "mata kemerahan", "merah di mata", "matanya merah"], cue=("mata_merah", 0.9))
S("mata_berair", "Mata berair (epifora)", MATA, "Apakah matanya berair terus?",
  ["mata saya berair terus", "air mata saya keluar terus"], None, ["air matanya nggak berhenti-berhenti, sampai basah terus"], ["mata kadang agak berair"],
  kw=["mata berair", "berair", "air mata keluar", "keluar air mata", "nrocos", "mata basah"])
S("belekan", "Sekret mata (belekan)", MATA, "Apakah ada kotoran mata (belek)?",
  ["mata saya belekan", "banyak kotoran di mata saya, bangun tidur sampai lengket"], ["mata saya agak kotor"],
  ["beleknya banyak sekali sampai mata nggak bisa dibuka waktu bangun"], ["ada belek sedikit"],
  kw=["belek", "belekan", "kotoran mata", "mata lengket", "sekret mata", "kotoran di mata"])
S("mata_gatal", "Mata gatal", MATA, "Apakah matanya terasa gatal?",
  ["mata saya gatal", "mata saya gatal, pengin dikucek terus"], None, ["gatalnya nggak tahan, saya kucek terus"], ["mata agak gatal sedikit"],
  kw=["mata gatal", "gatal di mata", "matanya gatal", "pengin kucek mata", "mengucek mata"])
S("mata_mengganjal", "Rasa mengganjal/berpasir di mata", MATA, "Apakah ada rasa mengganjal atau berpasir di mata?",
  ["mata saya rasanya mengganjal, kayak ada pasir", "kayak ada yang masuk ke mata saya"], ["mata saya rasanya aneh"],
  ["mengganjalnya bikin nggak bisa melek"], ["agak ngganjal sedikit"],
  kw=["mengganjal", "ganjal", "berpasir", "kelilipan", "ada yang masuk ke mata", "kemasukan", "kemasukan sesuatu", "benda masuk ke mata"])
S("nyeri_mata", "Nyeri / perih pada mata", MATA, "Apakah matanya terasa sakit atau perih?",
  ["mata saya perih", "mata saya sakit"], None, ["mata saya sakit sekali sampai nggak bisa dibuka"], ["mata agak perih sedikit"],
  kw=["mata sakit", "mata perih", "sakit di mata", "perih di mata", "mata nyeri", "sakit matanya"], site="mata")
S("silau", "Silau (fotofobia)", MATA, "Apakah silau atau sakit kalau kena cahaya?",
  ["saya silau kalau lihat cahaya", "kena lampu mata saya sakit"], None, ["silaunya sampai harus pakai kacamata hitam terus"], ["agak silau sedikit"],
  kw=["silau", "fotofobia", "tidak tahan cahaya", "sakit kena cahaya", "sakit kena lampu", "tidak tahan sinar"], vol=False)
S("benjolan_kelopak", "Benjolan / bengkak di kelopak mata", MATA, "Apakah ada benjolan atau bengkak di kelopak mata?",
  ["ada benjolan di kelopak mata saya, merah dan sakit", "kelopak mata saya bengkak"], ["mata saya kayak bintitan"],
  ["benjolannya besar sekali sampai mata susah melek"], ["ada benjolan kecil di kelopak"],
  kw=["bintitan", "timbilan", "benjolan di kelopak", "kelopak bengkak", "bengkak di kelopak", "benjolan kelopak", "kelopak mata bengkak"], cue=("pegang", 0.4, "mata"), site="mata")
S("bulu_mata_menusuk", "Bulu mata terasa menusuk", MATA, "Apakah ada bulu mata yang terasa menusuk mata?",
  ["bulu mata saya kayak menusuk-nusuk mata", "bulu mata saya ada yang tumbuhnya ke dalam"], None, ["tiap kedip rasanya ditusuk"], ["kadang bulu matanya kena mata"],
  kw=["bulu mata menusuk", "bulu mata masuk", "bulu mata ke dalam", "bulu mata kena mata", "bulu mata tumbuh ke dalam", "bulu mata"])
S("kelopak_bersisik", "Tepi kelopak merah bersisik", MATA, "Apakah pinggir kelopak matanya merah atau bersisik?",
  ["pinggir kelopak mata saya merah dan bersisik", "bulu mata saya kayak ada ketombenya"], ["kelopak saya kayak kotor"],
  ["sisiknya banyak sampai bulu mata rontok"], ["pinggir kelopak agak merah"],
  kw=["kelopak bersisik", "ketombe di bulu mata", "pinggir kelopak merah", "tepi kelopak merah", "pinggir kelopak", "kerak di bulu mata"])
S("mata_kering", "Mata terasa kering", MATA, "Apakah matanya terasa kering?",
  ["mata saya kering, seret", "mata saya rasanya kering dan panas"], None, ["keringnya sampai sakit kalau kedip"], ["mata agak kering"],
  kw=["mata kering", "mata terasa kering", "mata seret", "kering di mata", "matanya kering"])
S("mata_lelah", "Mata cepat lelah (astenopia)", MATA, "Apakah matanya cepat lelah kalau membaca atau melihat layar?",
  ["mata saya cepat capek kalau baca atau lihat layar", "habis lihat HP lama mata saya pegal"], None,
  ["mata saya capek sekali, baru sebentar baca sudah nggak kuat"], ["mata agak capek"],
  kw=["mata lelah", "mata capek", "mata cepat lelah", "mata cepat capek", "lelah membaca", "capek melihat layar"])
S("kabur_jauh", "Sulit melihat jauh", MATA, "Apakah sulit melihat benda yang jauh?",
  ["lihat jauh kabur, tulisan di papan nggak kelihatan", "saya susah lihat jauh"], ["mata saya kurang jelas"],
  ["lihat jauh sama sekali nggak jelas"], ["lihat jauh agak kurang jelas"],
  kw=["lihat jauh", "melihat jauh", "jarak jauh", "rabun jauh", "papan tulis", "tulisan di papan", "jauh kabur", "jauh tidak jelas"])
S("kabur_dekat", "Sulit melihat dekat / membaca", MATA, "Apakah sulit melihat dekat atau membaca tulisan kecil?",
  ["kalau baca tulisan kecil kabur, harus dijauhkan", "saya susah lihat dekat"], ["mata saya kurang jelas"],
  ["sama sekali nggak bisa baca tulisan dekat"], ["baca agak susah sedikit"],
  kw=["lihat dekat", "melihat dekat", "rabun dekat", "baca tulisan kecil", "sulit membaca", "susah membaca", "membaca dekat", "tulisan kecil", "harus dijauhkan"])
S("rabun_senja", "Sulit melihat saat gelap (rabun senja)", MATA, "Apakah sulit melihat saat senja atau di tempat gelap?",
  ["kalau sudah sore atau gelap saya susah lihat", "kalau magrib saya sering nabrak barang"], None,
  ["malam sama sekali nggak bisa lihat apa-apa"], ["kalau gelap agak susah lihat"],
  kw=["rabun senja", "buta senja", "buta ayam", "lihat malam", "melihat di gelap", "kalau gelap", "saat gelap", "waktu magrib"])
S("bercak_darah_mata", "Bercak merah darah di putih mata", MATA, "Apakah ada bercak merah seperti darah di bagian putih mata?",
  ["putih mata saya tiba-tiba merah kayak darah", "ada bercak darah di mata saya"], None,
  ["merahnya kayak darah segar, saya takut sekali"], ["ada merah sedikit di pinggir mata"],
  kw=["bercak darah di mata", "mata merah darah", "darah di mata", "putih mata merah", "bercak merah di mata", "mata berdarah"], cue=("mata_merah", 0.8))
review_add("mata", "mata_merah", "mata_berair", "belekan", "mata_gatal", "mata_mengganjal", "nyeri_mata", "silau", "benjolan_kelopak",
           "mata_kering", "mata_lelah", "kabur_jauh", "kabur_dekat", "rabun_senja", "bercak_darah_mata")

# ------------------------------------------------------------------------------ THT
S("nyeri_telinga", "Nyeri telinga (otalgia)", THT, "Apakah telinganya sakit?",
  ["telinga saya sakit", "kuping saya nyeri"], None, ["telinga saya sakit sekali sampai nggak bisa tidur"], ["telinga agak sakit"],
  kw=["sakit telinga", "telinga sakit", "nyeri telinga", "kuping sakit", "sakit kuping", "telinga nyeri", "otalgia"], cue=("pegang", 0.6, "kepala"), site="kepala")
S("telinga_berair", "Keluar cairan dari telinga (otore)", THT, "Apakah ada cairan atau nanah yang keluar dari telinga?",
  ["telinga saya keluar cairan", "ada cairan keluar dari kuping saya"], None, ["nanahnya keluar terus dari telinga, bau"], ["keluar cairan sedikit"],
  kw=["telinga berair", "keluar cairan dari telinga", "cairan dari telinga", "congek", "kuping berair", "telinga bernanah", "nanah dari telinga", "keluar dari telinga"])
S("pendengaran_turun", "Pendengaran berkurang", THT, "Apakah pendengarannya berkurang?",
  ["pendengaran saya berkurang", "suara jadi kurang jelas terdengar"], ["kayaknya telinga saya kurang enak"],
  ["sama sekali nggak dengar sebelah"], ["agak kurang dengar sedikit"],
  kw=["pendengaran berkurang", "kurang dengar", "tidak dengar", "budek", "tuli", "pendengaran turun", "susah mendengar", "pendengaran menurun"])
S("telinga_penuh", "Telinga terasa penuh/tersumbat", THT, "Apakah telinganya terasa penuh atau tersumbat?",
  ["telinga saya rasanya penuh, kayak tersumbat", "kuping saya kayak kemasukan air"], None, ["tersumbat sekali sampai pusing"], ["agak penuh sedikit"],
  kw=["telinga penuh", "telinga tersumbat", "kuping buntu", "telinga buntu", "kemasukan air", "telinga tertutup", "kuping penuh"])
S("telinga_berdenging", "Telinga berdenging (tinitus)", THT, "Apakah telinganya berdenging?",
  ["telinga saya berdenging", "kuping saya ngiung-ngiung"], None, ["dengingnya kencang terus"], ["kadang berdenging sedikit"],
  kw=["berdenging", "telinga berdenging", "tinitus", "kuping berdengung", "berdengung", "ngiung"], vol=False)
S("telinga_gatal", "Telinga gatal", THT, "Apakah telinganya gatal?",
  ["telinga saya gatal", "kuping saya gatal, sering saya korek"], None, ["gatalnya bikin saya ngorek terus"], ["agak gatal"],
  kw=["telinga gatal", "kuping gatal", "gatal di telinga", "gatal di kuping"])
S("pilek", "Pilek (rinore)", THT, "Apakah ada pilek atau ingus?",
  ["saya pilek", "hidung saya meler"], None, ["ingusnya keluar terus, sampai tisu habis"], ["pilek sedikit"],
  kw=["pilek", "ingus", "meler", "beringus", "hidung meler", "flu", "selesma", "keluar ingus"])
S("hidung_tersumbat", "Hidung tersumbat", THT, "Apakah hidungnya tersumbat?",
  ["hidung saya mampet", "hidung saya tersumbat"], None, ["hidung buntu total sampai napas lewat mulut"], ["hidung agak mampet"],
  kw=["hidung tersumbat", "hidung mampet", "mampet", "buntu", "hidung buntu", "tersumbat", "susah napas lewat hidung"])
S("bersin", "Bersin-bersin", THT, "Apakah sering bersin?",
  ["saya bersin-bersin terus", "pagi-pagi saya bersin terus"], None, ["bersinnya sampai puluhan kali"], ["kadang bersin"],
  kw=["bersin", "bersin bersin", "sering bersin"])
S("ingus_satu_sisi", "Ingus berbau dari satu lubang hidung", THT, "Apakah ada ingus berbau dari satu lubang hidung saja?",
  ["dari satu lubang hidung keluar ingus yang bau", "hidung sebelah keluar cairan bau"], None, ["baunya busuk sekali"], ["ada ingus sedikit dari satu sisi"],
  kw=["ingus bau", "hidung bau", "satu lubang hidung", "sebelah hidung", "ingus sebelah", "cairan bau dari hidung"], vol=False)
S("hidung_bengkak_nyeri", "Bengkak nyeri di hidung", THT, "Apakah ada bengkak atau bisul yang nyeri di hidung?",
  ["ada bisul di hidung saya, sakit sekali", "ujung hidung saya bengkak, merah, sakit"], None, ["hidung saya bengkak besar, nyut-nyutan"], ["ada jerawat kecil di hidung"],
  kw=["bisul di hidung", "hidung bengkak", "bengkak di hidung", "ujung hidung", "jerawat di hidung", "hidung merah", "lubang hidung sakit"])
S("benda_masuk", "Ada benda yang masuk ke lubang tubuh", THT, "Apakah ada benda yang dimasukkan atau masuk ke hidung/telinga?",
  ["ada benda yang masuk", "kemasukan biji-bijian"], None, ["bendanya masuk dalam sekali"], ["kayaknya ada yang masuk sedikit"],
  kw=["benda asing", "kemasukan benda", "memasukkan benda", "dimasukkan ke hidung", "dimasukkan ke telinga", "masuk ke hidung", "masuk ke telinga", "biji masuk", "kacang masuk", "manik masuk", "serangga masuk"])
S("nyeri_tenggorokan", "Nyeri tenggorokan", THT, "Apakah tenggorokannya sakit?",
  ["tenggorokan saya sakit", "tenggorokan saya perih"], ["tenggorokan saya nggak enak"],
  ["tenggorokan saya sakit sekali kayak disayat"], ["tenggorokan agak sakit"],
  kw=["sakit tenggorokan", "nyeri tenggorokan", "tenggorokan sakit", "tenggorokan perih", "radang tenggorokan", "tenggorokan nyeri", "amandel", "radang amandel"], cue=("pegang", 0.4, "tenggorokan"), site="tenggorokan")
S("suara_serak", "Suara serak", THT, "Apakah suaranya serak?",
  ["suara saya serak", "suara saya hilang"], None, ["suara saya hilang sama sekali"], ["suara agak serak"],
  kw=["serak", "suara serak", "suara hilang", "parau", "suara habis"])
S("batuk_rejan", "Batuk beruntun dengan tarikan napas berbunyi (whoop)", THT, "Apakah batuknya beruntun panjang lalu ada bunyi saat menarik napas?",
  ["batuk saya beruntun sampai muka merah, habis itu tarik napasnya bunyi", "batuknya nggak berhenti sampai muntah"], None,
  ["batuknya sampai biru dan muntah"], ["batuknya kadang beruntun"],
  kw=["batuk rejan", "batuk beruntun", "batuk seratus hari", "batuk sampai muntah", "whoop", "batuk sampai biru", "batuk terus menerus"], cue=("batuk", 1.0))
S("pusing_berputar", "Pusing berputar (vertigo)", SARAF, "Apakah pusingnya terasa berputar?",
  ["kepala saya pusing berputar", "rasanya kamar muter-muter"], ["kepala saya rasanya nggak enak"],
  ["muternya hebat sampai saya jatuh"], ["agak muter sebentar"],
  kw=["pusing berputar", "berputar", "muter", "muter muter", "vertigo", "ruangan berputar", "sekeliling berputar", "kliyeng berputar"], cue=("pegang", 0.5, "kepala"), site="kepala")
S("mabuk_kendaraan", "Mual & pusing saat naik kendaraan", THT, "Apakah mual atau pusing kalau naik kendaraan?",
  ["kalau naik bus atau kapal saya mual, pusing", "saya gampang mabuk kalau perjalanan"], None,
  ["tiap naik kendaraan pasti muntah"], ["kadang agak mual di kendaraan"],
  kw=["mabuk perjalanan", "mabuk darat", "mabuk laut", "mabuk kendaraan", "naik kendaraan", "naik bus", "naik kapal", "naik mobil"])
review_add("napas", "pilek", "hidung_tersumbat", "bersin", "nyeri_tenggorokan", "suara_serak")
NEW_REVIEWS.append({"id": "telinga", "label": "Telinga", "keywords": ["telinga", "telinga bagaimana", "kuping", "pendengaran"],
                    "symptoms": ["nyeri_telinga", "telinga_berair", "pendengaran_turun", "telinga_penuh", "telinga_berdenging", "telinga_gatal"],
                    "normal": ["Telinga nggak ada keluhan, Dok.", "Kuping saya biasa saja, Dok, pendengaran juga baik."], "weak": True})
NEW_REVIEWS.append({"id": "hidung", "label": "Hidung", "keywords": ["hidung", "hidung bagaimana"],
                    "symptoms": ["pilek", "hidung_tersumbat", "bersin", "ingus_satu_sisi", "hidung_bengkak_nyeri", "perdarahan_mukosa"],
                    "normal": ["Hidung nggak apa-apa, Dok.", "Hidung saya biasa saja, Dok."], "weak": True})

# ------------------------------------------------------------------------------ SARAF & JIWA
S("kejang", "Kejang", SARAF, "Apakah ada kejang?",
  ["saya kejang, kelojotan", "badan saya kaku lalu kelojotan"], None, ["kejangnya lama sekali"], ["sempat kaku sebentar"],
  kw=["kejang", "step", "kelojotan", "kejang kejang", "sawan", "stuip"])
S("kaku_rahang", "Sulit membuka mulut (trismus)", SARAF, "Apakah mulutnya sulit dibuka atau rahangnya kaku?",
  ["mulut saya susah dibuka", "rahang saya kaku"], None, ["mulut sama sekali nggak bisa dibuka"], ["rahang agak kaku"],
  kw=["mulut susah dibuka", "rahang kaku", "kaku rahang", "tidak bisa membuka mulut", "sulit membuka mulut", "trismus", "susah buka mulut"])
S("kaku_badan", "Kekakuan / kejang otot badan", SARAF, "Apakah badan atau ototnya kaku?",
  ["badan saya kaku-kaku", "otot perut dan punggung saya kaku"], None, ["badan saya kaku sampai melengkung"], ["badan agak kaku"],
  kw=["badan kaku", "otot kaku", "kaku seluruh badan", "punggung melengkung", "kekakuan", "perut kaku seperti papan"], cue=("kaku", 0.9))
S("wajah_mencong", "Wajah/mulut mencong", SARAF, "Apakah wajah atau mulutnya mencong?",
  ["mulut saya mencong", "wajah saya sebelah turun"], ["muka saya rasanya aneh"], ["muka saya miring sekali"], ["mulut agak miring sedikit"],
  kw=["mulut mencong", "wajah mencong", "muka mencong", "perot", "mulut miring", "wajah tidak simetris", "muka miring", "wajah miring", "mencong"], cue=("pegang", 0.4, "mulut"))
S("mata_tidak_menutup", "Kelopak mata tidak bisa menutup", SARAF, "Apakah matanya tidak bisa menutup rapat?",
  ["mata saya nggak bisa merem rapat", "kelopak mata saya nggak bisa nutup"], None, ["mata saya terbuka terus, perih"], ["kadang mata agak susah merem"],
  kw=["mata tidak bisa menutup", "tidak bisa merem", "kelopak tidak menutup", "mata tidak bisa ditutup", "susah merem", "merem tidak rapat"])
S("sakit_kepala_sebelah", "Sakit kepala sebelah berdenyut", SARAF, "Apakah sakit kepalanya di sebelah sisi dan berdenyut?",
  ["kepala saya sakit sebelah, cenat-cenut", "sakitnya separuh kepala, berdenyut"], None, ["sebelah kepala saya kayak mau pecah"], ["kepala agak senut sebelah"],
  kw=["sakit kepala sebelah", "kepala sebelah", "sebelah kepala", "separuh kepala", "migren", "migrain", "kepala separuh"], cue=("pegang", 0.6, "kepala"), site="kepala")
S("aura_visual", "Kilatan cahaya sebelum sakit kepala (aura)", SARAF, "Apakah sebelum sakit kepala ada kilatan cahaya atau garis zig-zag di penglihatan?",
  ["sebelum sakit kepala saya lihat kilatan cahaya", "pandangan saya kayak ada garis zig-zag dulu"], None, ["kilatannya bikin saya nggak bisa lihat"], ["kadang ada kilatan sebentar"],
  kw=["kilatan cahaya", "kilatan", "zig zag", "aura", "lihat cahaya berkedip", "pandangan berkilat"], vol=False)
S("tengkuk_tegang", "Tengkuk/leher tegang", SARAF, "Apakah tengkuk atau lehernya terasa tegang atau berat?",
  ["tengkuk saya berat, tegang", "leher belakang saya kaku dan pegal"], None, ["tengkuk saya kaku sekali kayak ditarik"], ["tengkuk agak pegal"],
  kw=["tengkuk", "tengkuk tegang", "tengkuk berat", "leher tegang", "leher belakang", "pundak tegang", "kepala diikat", "seperti diikat", "kencang di kepala"], cue=("pegang", 0.4, "kepala"))
S("sulit_tidur", "Sulit tidur (insomnia)", JIWA, "Apakah sulit tidur atau sering terbangun malam?",
  ["saya susah tidur", "saya sering terbangun tengah malam lalu nggak bisa tidur lagi"], ["tidur saya nggak nyenyak"],
  ["sudah berhari-hari saya hampir nggak tidur sama sekali"], ["tidur agak kurang nyenyak"],
  kw=["susah tidur", "sulit tidur", "insomnia", "terbangun malam", "bangun malam", "tidak nyenyak", "susah memulai tidur"], cue=("mengantuk", 0.6))
S("mengantuk_siang", "Lelah & mengantuk di siang hari", JIWA, "Apakah siang hari jadi mengantuk atau tidak bertenaga?",
  ["siangnya saya ngantuk dan susah konsentrasi", "siang hari saya jadi lemas, nggak konsen"], None, ["di kantor saya sampai ketiduran"], ["siang agak ngantuk"],
  kw=["mengantuk", "ngantuk", "ngantuk siang", "susah konsentrasi", "sulit konsentrasi", "tidak konsentrasi", "kurang konsentrasi"])
S("cemas", "Cemas / gelisah", JIWA, "Apakah sering merasa cemas atau gelisah?",
  ["saya sering cemas dan gelisah", "pikiran saya nggak tenang"], ["perasaan saya nggak enak"],
  ["saya cemas terus sampai nggak bisa ngapa-ngapain"], ["agak cemas sedikit"],
  kw=["gelisah", "perasaan cemas", "merasa cemas", "pikiran tidak tenang", "tidak tenang", "resah", "panik"], cue=("gelisah", 0.5))
S("berdebar", "Jantung berdebar (palpitasi)", "Jantung & pembuluh darah", "Apakah jantungnya terasa berdebar?",
  ["jantung saya berdebar-debar", "dada saya deg-degan"], None, ["jantung saya berdebar kencang sekali kayak mau copot"], ["kadang agak deg-degan"],
  kw=["berdebar", "deg degan", "dag dig dug", "jantung berdebar", "dada berdebar", "palpitasi", "jantung cepat"], cue=("pegang", 0.3, "dada"))
S("keluhan_berpindah", "Keluhan fisik berpindah-pindah tanpa sebab jelas", JIWA, "Apakah keluhannya berpindah-pindah tempat?",
  ["sakitnya pindah-pindah, Dok, kadang kepala, kadang perut, kadang dada", "badan saya sakit di mana-mana gantian"], None,
  ["semua badan saya rasanya sakit, nggak ada yang beres"], ["kadang di sini kadang di sana"],
  kw=["pindah pindah", "berpindah pindah", "sakitnya berpindah", "gantian sakitnya", "macam macam keluhan", "banyak keluhan"])

# ------------------------------------------------------------------------------ PENCERNAAN & MULUT
S("sariawan", "Sariawan (ulkus mulut)", GI, "Apakah ada sariawan di mulut?",
  ["saya sariawan", "ada luka di mulut saya, perih kalau makan"], None, ["sariawannya banyak sekali sampai nggak bisa makan"], ["ada sariawan kecil"],
  kw=["sariawan", "luka di mulut", "seriawan", "stomatitis", "panas dalam", "mulut perih", "sariwan"], site="mulut")
S("bercak_putih_mulut", "Bercak putih di mulut/lidah", GI, "Apakah ada bercak putih di mulut atau lidah?",
  ["di mulut saya ada bercak-bercak putih", "lidah saya putih-putih kayak ada susu yang nempel"], None,
  ["putihnya banyak sekali, perih"], ["ada sedikit putih di lidah"],
  kw=["bercak putih di mulut", "putih di lidah", "lidah putih", "bercak putih di lidah", "mulut putih", "seperti susu menempel", "jamur di mulut"])
S("bengkak_rahang", "Bengkak di depan telinga/rahang", GI, "Apakah ada bengkak di pipi atau di depan telinga?",
  ["pipi saya bengkak di depan telinga", "rahang saya bengkak, sakit kalau ngunyah"], None, ["pipi saya bengkak besar sekali"], ["agak bengkak sedikit di pipi"],
  kw=["gondongan", "pipi bengkak", "bengkak di pipi", "bengkak di depan telinga", "rahang bengkak", "sakit mengunyah", "nyeri mengunyah", "bengkak di bawah telinga"], cue=("bengkak", 0.6))
S("bab_darah", "BAB berdarah / berlendir darah", GI, "Apakah BAB-nya berdarah atau berlendir?",
  ["BAB saya ada darahnya", "BAB saya berlendir campur darah"], ["BAB saya agak aneh"], ["darahnya banyak setiap BAB"], ["ada sedikit darah di tisu"],
  kw=["bab berdarah", "berak darah", "bab darah", "darah segar", "darah menetes", "lendir darah", "berlendir", "bab berlendir", "berak berlendir", "tinja berdarah", "darah saat bab"])
S("keluar_cacing", "Keluar cacing / potongan cacing", GI, "Apakah pernah keluar cacing atau potongan seperti pita saat BAB?",
  ["waktu BAB keluar cacing", "ada cacing keluar dari kotoran saya"], None, ["cacingnya banyak sekali keluar"], ["kayaknya ada cacing kecil"],
  kw=["keluar cacing", "cacing", "cacingan", "potongan cacing", "cacing pita", "seperti biji ketimun", "cacing di bab"])
S("gatal_anus", "Gatal di sekitar anus", GI, "Apakah ada gatal di sekitar dubur?",
  ["dubur saya gatal", "pantat saya gatal terutama malam"], None, ["gatalnya nggak tahan sampai lecet"], ["agak gatal di dubur"],
  kw=["gatal di dubur", "dubur gatal", "anus gatal", "gatal anus", "pantat gatal", "gatal di pantat"], vol=False)
S("benjolan_anus", "Benjolan di anus", GI, "Apakah ada benjolan di dubur?",
  ["ada benjolan di dubur saya", "ada daging yang keluar dari dubur waktu BAB"], None, ["benjolannya keluar terus, sakit"], ["ada benjolan kecil"],
  kw=["benjolan di dubur", "benjolan di anus", "wasir", "ambeien", "ambeyen", "daging keluar dari dubur", "benjolan keluar saat bab"], vol=False)
S("bab_pucat", "BAB pucat seperti dempul", GI, "Apakah warna BAB-nya pucat seperti dempul?",
  ["BAB saya pucat kayak dempul", "kotoran saya warnanya keputihan"], None, ["kotoran saya putih kayak kapur"], ["BAB agak pucat"],
  kw=["bab pucat", "tinja pucat", "dempul", "kotoran pucat", "bab putih", "berak pucat"], vol=False)
S("perut_membuncit", "Perut membuncit", GI, "Apakah perutnya makin membesar atau buncit?",
  ["perut saya makin buncit", "perut saya membesar"], None, ["perut saya besar sekali kayak hamil"], ["perut agak buncit"],
  kw=["perut buncit", "perut membesar", "perut membuncit", "perut besar", "perut makin besar"])
S("pusar_bermasalah", "Pusar bayi merah/berbau/bernanah", ANAK, "Apakah pusarnya merah, bengkak, berbau, atau bernanah?",
  ["pusarnya merah dan bau", "tali pusatnya basah dan bernanah"], None, ["pusarnya merah meluas, nanahnya banyak"], ["pusarnya agak basah"],
  kw=["pusar", "tali pusat", "pusar merah", "pusar bau", "pusar bernanah", "puser", "udel"])
S("rewel", "Rewel / menangis terus", ANAK, "Apakah anaknya rewel atau menangis terus?",
  ["saya rewel terus", "saya nangis terus"], None, ["nangisnya nggak berhenti-berhenti semalaman"], ["agak rewel"],
  kw=["rewel", "menangis terus", "nangis terus", "cengeng", "tidak bisa diam", "susah ditenangkan"], cue=("gelisah", 0.4))
S("malas_menyusu", "Malas menyusu / minum", ANAK, "Apakah anaknya malas menyusu atau malas minum?",
  ["saya nggak mau menyusu", "saya malas minum susu"], None, ["sama sekali nggak mau menyusu"], ["menyusunya agak berkurang"],
  kw=["tidak mau menyusu", "malas menyusu", "malas minum", "tidak mau minum", "menyusu", "menetek", "nyusu", "malas netek"])
S("bb_tidak_naik", "Berat badan tidak naik", ANAK, "Apakah berat badannya susah naik?",
  ["berat badan saya nggak naik-naik", "kata bidan berat badan saya di bawah garis merah"], None, ["berat badan saya malah turun terus"], ["berat agak susah naik"],
  kw=["berat badan tidak naik", "bb tidak naik", "tidak naik berat", "di bawah garis merah", "bgm", "gizi kurang", "susah gemuk", "kms"], cue=("kurus", 0.8))
review_add("bab", "bab_darah", "keluar_cacing", "gatal_anus", "benjolan_anus", "bab_pucat")
review_add("makan", "sariawan", "bercak_putih_mulut", "malas_menyusu")
review_add("perut", "perut_membuncit")
review_add("berat_badan", "bb_tidak_naik")

# ------------------------------------------------------------------------------ KELAMIN & REPRODUKSI
S("duh_uretra", "Keluar nanah/cairan dari saluran kencing", KEL, "Apakah keluar nanah atau cairan dari saluran kencing?",
  ["keluar nanah dari kemaluan saya", "ujung kemaluan saya keluar cairan kental"], ["celana dalam saya basah terus"],
  ["nanahnya banyak, menetes terus"], ["keluar cairan sedikit di pagi hari"],
  kw=["kencing nanah", "keluar nanah", "nanah dari kemaluan", "cairan dari penis", "cairan dari kemaluan", "keluar cairan dari kemaluan", "kencing bernanah"], vol=False)
S("keputihan", "Keputihan", KEL, "Apakah ada keputihan?",
  ["saya keputihan", "keputihan saya banyak dan bau"], ["celana dalam saya basah terus"],
  ["keputihannya banyak sekali sampai harus ganti celana"], ["keputihan sedikit"],
  kw=["keputihan", "cairan dari vagina", "keputihan bau", "lendir dari vagina", "cairan kemaluan", "flour albus"])
S("gatal_kemaluan", "Gatal di kemaluan", KEL, "Apakah ada gatal di daerah kemaluan?",
  ["kemaluan saya gatal", "di daerah kemaluan saya gatal"], None, ["gatalnya nggak tahan sampai lecet"], ["agak gatal di kemaluan"],
  kw=["gatal di kemaluan", "kemaluan gatal", "gatal di vagina", "vagina gatal", "gatal kemaluan", "gatal di alat kelamin", "gatal di bibir kemaluan", "rambut kemaluan gatal"], vol=False)
S("nyeri_senggama", "Nyeri saat berhubungan seksual", KEL, "Apakah ada nyeri saat berhubungan suami-istri?",
  ["kalau berhubungan dengan suami terasa sakit", "sakit waktu berhubungan"], None, ["sakit sekali sampai nggak bisa berhubungan"], ["agak sakit waktu berhubungan"],
  kw=["nyeri saat berhubungan", "sakit saat berhubungan", "sakit waktu berhubungan", "sakit berhubungan", "dispareunia", "nyeri senggama"], vol=False)
S("luka_kemaluan", "Luka/koreng di kemaluan", KEL, "Apakah ada luka atau koreng di kemaluan?",
  ["ada luka di kemaluan saya", "ada koreng di alat kelamin saya"], None, ["lukanya besar dan banyak"], ["ada luka kecil di kemaluan"],
  kw=["luka di kemaluan", "koreng di kemaluan", "luka di alat kelamin", "luka di penis", "luka di vagina", "lecet di kemaluan", "lepuh di kemaluan", "luka kelamin"], vol=False)
S("kulup_sempit", "Kulup tidak bisa ditarik / menggelembung saat kencing", KEL, "Apakah kulup penisnya susah ditarik ke belakang, atau menggelembung saat kencing?",
  ["kulupnya nggak bisa ditarik, waktu kencing menggelembung", "ujung kulup saya sempit"], None, ["kencingnya sampai netes-netes karena kulupnya sempit"], ["kulup agak susah ditarik"],
  kw=["kulup", "kulup tidak bisa ditarik", "kulup sempit", "menggelembung saat kencing", "kencing menggelembung", "belum sunat", "kulit penis", "kencing menetes"])
S("kulup_terjepit", "Kulup terjepit di belakang kepala penis", KEL, "Apakah kulupnya tertarik ke belakang dan tidak bisa dikembalikan?",
  ["kulit penis saya ketarik ke belakang dan nggak bisa balik", "kepala penis saya bengkak, kulupnya terjepit"], None,
  ["bengkaknya makin besar dan sakit sekali"], ["kulupnya agak susah dikembalikan"],
  kw=["kulup terjepit", "kulup tidak bisa dikembalikan", "kepala penis bengkak", "kulup tertarik", "penis bengkak", "kulup terjebak"], cue=("diam_menahan", 0.6))
S("perdarahan_pervaginam", "Perdarahan dari jalan lahir", KEL, "Apakah ada perdarahan dari jalan lahir?",
  ["keluar darah dari jalan lahir", "saya flek-flek darah"], None, ["darahnya banyak sekali, gumpal-gumpal"], ["ada flek sedikit"],
  kw=["perdarahan dari jalan lahir", "keluar darah dari vagina", "flek", "pendarahan dari jalan lahir", "perdarahan dari vagina", "darah dari kemaluan", "keluar darah dari kemaluan"])
S("keluar_jaringan", "Keluar gumpalan/jaringan dari jalan lahir", KEL, "Apakah keluar gumpalan atau jaringan seperti daging?",
  ["keluar gumpalan kayak daging", "ada jaringan yang keluar dari jalan lahir"], None, ["gumpalannya besar-besar"], ["ada gumpalan kecil"],
  kw=["keluar gumpalan", "gumpalan darah", "keluar jaringan", "seperti daging", "keluar daging", "gumpalan"], vol=False)
S("terlambat_haid", "Terlambat haid", KEL, "Apakah haidnya terlambat?",
  ["saya telat haid", "haid saya terlambat"], None, ["sudah tiga bulan saya nggak haid"], ["haid agak telat"],
  kw=["telat haid", "terlambat haid", "telat datang bulan", "tidak haid", "belum haid lagi", "haid terlambat", "telat mens"])
S("nyeri_perineum", "Nyeri di jalan lahir/perineum", KEL, "Apakah ada nyeri atau luka di jalan lahir?",
  ["jalan lahir saya sakit dan perih", "bekas melahirkan di bawah saya perih"], None, ["sakit sekali sampai nggak bisa duduk"], ["agak perih di bawah"],
  kw=["nyeri di jalan lahir", "sakit di jalan lahir", "luka di jalan lahir", "robekan jalan lahir", "robek jalan lahir", "perineum", "jahitan"])
S("payudara_nyeri_bengkak", "Payudara nyeri, bengkak, kemerahan", KEL, "Apakah payudaranya nyeri, bengkak, atau merah?",
  ["payudara saya bengkak, merah, sakit", "payudara saya keras dan panas"], None, ["payudara saya sakit sekali sampai nggak bisa disentuh"], ["payudara agak nyeri"],
  kw=["payudara bengkak", "payudara sakit", "payudara nyeri", "payudara merah", "payudara keras", "nyeri payudara", "susu bengkak", "tetek bengkak"], cue=("pegang", 0.4, "dada"), site="dada")
S("puting_lecet", "Puting lecet/pecah", KEL, "Apakah putingnya lecet atau pecah-pecah?",
  ["puting saya lecet dan perih waktu menyusui", "puting saya pecah-pecah, kadang berdarah"], None, ["puting saya luka berdarah, sakit sekali tiap menyusui"], ["puting agak lecet"],
  kw=["puting lecet", "puting luka", "puting pecah", "puting perih", "puting berdarah", "puting sakit"])
S("puting_masuk", "Puting masuk ke dalam (inverted)", KEL, "Apakah putingnya masuk ke dalam atau datar?",
  ["puting saya masuk ke dalam", "puting saya datar, bayi susah ngempeng"], None, ["puting saya sama sekali nggak keluar"], ["puting agak datar"],
  kw=["puting masuk", "puting masuk ke dalam", "puting datar", "puting tidak menonjol", "puting tenggelam", "puting terbenam"])
S("sulit_menyusui", "Kesulitan menyusui", KEL, "Apakah ada kesulitan saat menyusui?",
  ["saya susah menyusui", "bayi saya susah menyusu ke saya"], None, ["sama sekali nggak bisa menyusui"], ["menyusui agak susah"],
  kw=["susah menyusui", "sulit menyusui", "kesulitan menyusui", "asi susah keluar", "asi tidak keluar", "bayi susah menyusu"])
NEW_REVIEWS.append({"id": "kelamin", "label": "Kelamin", "keywords": ["kelamin", "alat kelamin", "kemaluan", "daerah kemaluan"],
                    "symptoms": ["duh_uretra", "keputihan", "gatal_kemaluan", "luka_kemaluan", "kulup_sempit", "kulup_terjepit", "perdarahan_pervaginam"],
                    "normal": ["Nggak ada keluhan di kemaluan, Dok.", "Daerah kemaluan biasa saja, Dok."], "weak": True})

# ------------------------------------------------------------------------------ ENDOKRIN, METABOLIK, HEMATO, INFEKSI
S("gemetar", "Gemetar / tangan tremor", ENDO, "Apakah tangannya gemetar?",
  ["tangan saya gemetaran", "badan saya gemetar, lemas"], None, ["gemetarnya sampai nggak bisa pegang gelas"], ["tangan agak gemetar"],
  kw=["tangan gemetar", "gemetaran", "tremor", "tangan bergetar", "badan gemetar"])
S("bingung", "Bingung / linglung", SARAF, "Apakah sempat bingung atau linglung?",
  ["saya sempat bingung, nggak nyambung", "kata keluarga saya sempat linglung"], None, ["saya sampai nggak kenal orang"], ["agak bingung sebentar"],
  kw=["bingung", "linglung", "tidak nyambung", "nggak nyambung", "kebingungan", "disorientasi", "ngelantur"], cue=("mengantuk", 0.4))
S("sendi_bengkak", "Sendi bengkak, merah, nyeri", "Otot & sendi", "Apakah ada sendi yang bengkak, merah, dan nyeri?",
  ["jempol kaki saya bengkak, merah, sakit sekali", "sendi saya bengkak dan panas"], None, ["sakitnya sampai kena selimut saja nggak tahan"], ["sendi agak bengkak"],
  kw=["sendi bengkak", "bengkak di sendi", "jempol kaki bengkak", "jempol bengkak", "sendi merah", "sendi panas", "asam urat kambuh", "pangkal jempol"], cue=("pincang_kanan", 0.7))
S("benjolan_leher_depan", "Benjolan di leher depan (gondok)", ENDO, "Apakah ada benjolan di leher bagian depan?",
  ["leher depan saya membesar", "ada benjolan di leher depan saya, ikut naik kalau menelan"], None, ["benjolannya besar sekali sampai susah napas"], ["leher agak besar sedikit"],
  kw=["gondok", "leher depan", "benjolan di leher depan", "leher membesar", "tiroid", "kelenjar gondok"], cue=("bengkak", 0.4))
S("kram_otot", "Kram otot", "Otot & sendi", "Apakah sering kram otot?",
  ["saya sering kram", "betis dan tangan saya sering kram"], None, ["kramnya sampai jari-jari tertekuk kaku"], ["kadang kram"],
  kw=["kram", "kram otot", "keram", "kejang otot", "otot tertarik"])
S("bb_naik", "Berat badan berlebih / naik", ENDO, "Apakah berat badannya naik atau berlebih?",
  ["berat badan saya naik terus", "saya makin gemuk"], None, ["saya gemuk sekali, baju nggak ada yang muat"], ["agak gemuk sedikit"],
  kw=["berat badan naik", "bb naik", "gemuk", "kegemukan", "kelebihan berat badan", "obesitas", "makin gemuk"], cue=("gemuk", 0.7))
S("pucat", "Pucat", "Kulit & perdarahan", "Apakah wajah atau kulitnya tampak pucat?",
  ["kata keluarga saya pucat", "muka saya pucat"], None, ["muka saya pucat sekali kayak kertas"], ["agak pucat"],
  kw=["pucat", "muka pucat", "wajah pucat", "kurang darah", "bibir pucat", "telapak pucat"], cue=("pucat", 0.6))
S("ngidam_es", "Suka mengunyah es/benda tidak lazim (pika)", "Kulit & perdarahan", "Apakah suka mengunyah es batu atau benda yang tidak lazim?",
  ["saya suka sekali ngunyah es batu", "saya suka ngemil es batu terus"], None, ["sehari bisa satu kantong es batu saya kunyah"], ["kadang ngemil es"],
  kw=["es batu", "mengunyah es", "makan es", "ngemil es", "kunyah es", "makan tanah", "pika"], vol=False)
S("rambut_rontok", "Rambut rontok / pitak", KULIT, "Apakah rambutnya rontok atau ada pitak?",
  ["rambut saya rontok", "ada bagian kepala saya yang botak, pitak"], None, ["rambut saya rontok banyak sekali"], ["rambut agak rontok"],
  kw=["rambut rontok", "rontok", "pitak", "botak", "kebotakan", "rambut mudah dicabut", "rambut jarang"])
S("bengkak_kaki", "Bengkak di tungkai/kaki", "Jantung & pembuluh darah", "Apakah kakinya bengkak?",
  ["kaki saya bengkak", "tungkai saya membesar"], None, ["kaki saya besar sekali, kayak kaki gajah"], ["kaki agak bengkak sedikit"],
  kw=["kaki bengkak", "bengkak di kaki", "tungkai bengkak", "kaki membesar", "kaki gajah", "sembab", "kaki sembab", "edema"], cue=("bengkak", 0.6))
S("sudut_bibir_pecah", "Sudut bibir pecah-pecah", GI, "Apakah sudut bibirnya pecah-pecah?",
  ["sudut bibir saya pecah-pecah", "bibir saya pecah di pinggir"], None, ["sudut bibir saya luka sampai berdarah"], ["sudut bibir agak pecah"],
  kw=["sudut bibir", "bibir pecah", "bibir pecah pecah", "ujung bibir", "pinggir bibir pecah"])
S("benjolan_kgb", "Benjolan kelenjar getah bening (leher/ketiak/lipat paha)", "Umum", "Apakah ada benjolan di leher, ketiak, atau lipat paha?",
  ["ada benjolan di leher saya", "ada benjolan sakit di ketiak saya"], None, ["benjolannya banyak dan besar"], ["ada benjolan kecil"],
  kw=["benjolan di leher", "benjolan di ketiak", "benjolan di lipat paha", "benjolan di selangkangan", "kelenjar bengkak", "kelenjar getah bening", "kelenjar", "benjolan leher", "benjolan ketiak"], vol=False)
S("nyeri_betis", "Nyeri betis", "Otot & sendi", "Apakah betisnya terasa nyeri?",
  ["betis saya sakit sekali", "betis saya nyeri kalau dipakai jalan"], None, ["betis saya sakit sampai nggak bisa jalan"], ["betis agak pegal"],
  kw=["betis", "nyeri betis", "sakit betis", "betis sakit", "betis nyeri", "pegal betis"], cue=("pincang_kanan", 0.4))
S("bengkak_bibir_mata", "Bengkak bibir/kelopak mata (angioedema)", KULIT, "Apakah bibir atau kelopak matanya bengkak?",
  ["bibir saya bengkak", "kelopak mata dan bibir saya bengkak tiba-tiba"], None, ["bibir saya bengkak besar sekali, lidah juga tebal"], ["bibir agak tebal"],
  kw=["bibir bengkak", "bengkak di bibir", "muka bengkak", "wajah bengkak", "mata bengkak", "lidah bengkak", "bengkak tiba tiba"], cue=("bengkak", 0.8))
S("mau_pingsan", "Kepala melayang / mau pingsan", "Jantung & pembuluh darah", "Apakah sempat merasa mau pingsan atau berkunang-kunang?",
  ["saya rasanya mau pingsan", "mata saya berkunang-kunang, kepala melayang"], None, ["saya sempat pingsan"], ["agak melayang sebentar"],
  kw=["mau pingsan", "pingsan", "kepala melayang", "berkunang kunang", "kunang kunang", "pandangan gelap", "hampir pingsan", "sinkop"], cue=("lemas", 0.7))
S("hasil_cek_abnormal", "Hasil skrining kesehatan tidak normal", UMUM, "Apakah ada hasil pemeriksaan kesehatan sebelumnya yang tidak normal?",
  ["hasil cek kesehatan saya ada yang tinggi", "kata hasil medical check up di kantor ada yang nggak normal"], None,
  ["hasil lab saya merah semua, saya takut"], ["ada sedikit yang di atas normal di hasil cek"],
  kw=["hasil cek", "hasil lab", "medical check up", "mcu", "cek kesehatan", "hasil pemeriksaan", "skrining", "check up"])
review_add("berat_badan", "bb_naik")
review_add("kepala", "pusing_berputar", "sakit_kepala_sebelah", "tengkuk_tegang")
review_add("dada", "berdebar")

# ------------------------------------------------------------------------------ KULIT
S("gatal_kulit", "Gatal di kulit", KULIT, "Apakah kulitnya gatal?",
  ["kulit saya gatal", "badan saya gatal-gatal"], None, ["gatalnya nggak tahan, saya garuk sampai lecet"], ["agak gatal sedikit"],
  kw=["gatal", "gatal gatal", "kulit gatal", "garuk", "menggaruk", "gatal di kulit", "gatal di badan", "pruritus", "gatel"])
S("gatal_malam", "Gatal terutama malam hari", KULIT, "Apakah gatalnya lebih berat di malam hari?",
  ["gatalnya paling parah kalau malam", "malam-malam saya nggak bisa tidur karena gatal"], None, ["tiap malam garuk-garuk sampai berdarah"], ["malam agak lebih gatal"],
  kw=["gatal malam", "gatal kalau malam", "gatal waktu malam", "malam gatal", "gatal di malam hari"], vol=False)
S("ruam_kulit", "Ruam / bercak kemerahan di kulit", KULIT, "Apakah ada ruam atau bercak kemerahan di kulit?",
  ["kulit saya ada bercak merahnya", "ada ruam merah di kulit saya"], ["kulit saya ada yang aneh"],
  ["ruamnya banyak sekali, menyebar ke mana-mana"], ["ada bercak merah sedikit"],
  kw=["ruam", "ruam merah", "ruam kemerahan", "bercak merah", "bercak kemerahan", "merah merah di kulit", "bercak di kulit", "bercak"], cue=("ruam", 0.8))
S("kulit_bersisik", "Kulit bersisik / mengelupas", KULIT, "Apakah kulitnya bersisik atau mengelupas?",
  ["kulit saya bersisik", "kulitnya mengelupas halus"], None, ["sisiknya rontok terus kayak ketombe"], ["agak bersisik sedikit"],
  kw=["bersisik", "sisik", "mengelupas", "kulit mengelupas", "terkelupas", "kulit pecah pecah", "kulit kasar"])
S("bercak_putih_kulit", "Bercak putih/terang di kulit", KULIT, "Apakah ada bercak putih atau lebih terang di kulit?",
  ["ada bercak putih di kulit saya", "kulit saya belang-belang putih"], None, ["bercak putihnya banyak sekali di punggung"], ["ada belang sedikit"],
  kw=["bercak putih", "panu", "belang putih", "bercak keputihan", "bercak terang", "kulit belang", "bercak pucat"])
S("bercak_mati_rasa", "Bercak kulit mati rasa", KULIT, "Apakah ada bercak di kulit yang terasa baal atau mati rasa?",
  ["ada bercak di kulit saya yang nggak terasa kalau disentuh", "bercaknya baal, kena api rokok juga nggak terasa"], None,
  ["bercaknya mati rasa semua"], ["bercaknya agak kurang terasa"],
  kw=["bercak mati rasa", "bercak tidak terasa", "bercak baal", "kulit mati rasa", "tidak terasa disentuh", "mati rasa di bercak", "bercak kebas"], vol=False)
S("bintil_bernanah", "Bintil bernanah (pustul)", KULIT, "Apakah ada bintil-bintil bernanah?",
  ["ada bintil-bintil kecil bernanah di kulit saya", "muncul bintik bernanah di sekitar rambut"], None, ["bintil nanahnya banyak sekali"], ["ada bintil kecil"],
  kw=["bintil bernanah", "bintik nanah", "bintil nanah", "jerawat bernanah", "pustul", "bisul kecil", "bintil berisi nanah"])
S("bisul", "Bisul / benjolan bernanah", KULIT, "Apakah ada bisul atau benjolan bernanah?",
  ["ada bisul di kulit saya", "ada benjolan merah bernanah, sakit cenut-cenut"], None, ["bisulnya besar dan banyak"], ["ada bisul kecil"],
  kw=["bisul", "benjolan bernanah", "abses", "udun", "bengkak bernanah", "benjolan berisi nanah"], cue=("diam_menahan", 0.3))
S("jerawat", "Jerawat & komedo", KULIT, "Apakah ada jerawat atau komedo?",
  ["muka saya jerawatan", "banyak jerawat dan komedo di wajah saya"], None, ["jerawat saya parah sekali sampai minder"], ["ada jerawat sedikit"],
  kw=["jerawat", "jerawatan", "komedo", "akne", "beruntusan"])
S("lepuh_kulit", "Lepuh / bintil berair di kulit", KULIT, "Apakah ada lepuh atau bintil berisi air di kulit?",
  ["ada bintil berair di kulit saya", "kulit saya melepuh"], None, ["lepuhnya banyak sekali di seluruh badan"], ["ada lepuh kecil"],
  kw=["lepuh", "melepuh", "bintil berair", "gelembung berisi air", "lenting", "bintil air", "vesikel", "cacar", "plenting"], cue=("ruam", 0.7))
S("lepuh_bibir", "Lepuh berkelompok di bibir", KULIT, "Apakah ada lepuh kecil berkelompok di bibir?",
  ["di bibir saya muncul lepuh kecil-kecil", "bibir saya ada bintil berair, perih"], None, ["bibir saya penuh lepuh, perih sekali"], ["ada bintil kecil di bibir"],
  kw=["lepuh di bibir", "bintil di bibir", "bibir melepuh", "bibir berair", "luka di bibir", "dampa", "bibir lecet"])
S("koreng", "Koreng / keropeng (krusta)", KULIT, "Apakah ada koreng atau keropeng di kulit?",
  ["ada koreng kuning di kulit saya", "lukanya jadi keropeng"], None, ["korengnya banyak dan basah"], ["ada keropeng kecil"],
  kw=["koreng", "keropeng", "kerak", "krusta", "kerak kuning", "kudis"])
S("kutil", "Kutil", KULIT, "Apakah ada kutil?",
  ["ada kutil di tangan saya", "kulit saya tumbuh benjolan kasar kayak kutil"], None, ["kutilnya banyak sekali"], ["ada kutil kecil"],
  kw=["kutil", "benjolan kasar", "kutil kulit"])
S("bintil_mutiara", "Bintil kecil mengkilap berlekuk", KULIT, "Apakah ada bintil kecil mengkilap seperti mutiara?",
  ["ada bintil-bintil kecil mengkilap di kulit saya", "bintilnya kayak mutiara, tengahnya ada lekukan"], None, ["bintilnya banyak sekali"], ["ada bintil kecil"],
  kw=["bintil mengkilap", "seperti mutiara", "bintil mutiara", "bintil berlekuk", "bintil putih kecil", "bintil kecil"])
S("benjolan_kulit", "Benjolan di bawah kulit", KULIT, "Apakah ada benjolan di bawah kulit?",
  ["ada benjolan di bawah kulit saya", "ada benjolan lunak di punggung saya"], None, ["benjolannya makin besar"], ["ada benjolan kecil"],
  kw=["benjolan di bawah kulit", "benjolan lunak", "benjolan", "daging tumbuh", "gumpalan di bawah kulit", "benjolan kenyal"], cue=("bengkak", 0.3))
S("nyeri_terbakar_kulit", "Nyeri seperti terbakar di kulit", KULIT, "Apakah kulitnya terasa nyeri seperti terbakar atau tertusuk?",
  ["kulit saya rasanya panas terbakar", "kulit di satu sisi badan saya perih kayak ditusuk-tusuk"], None, ["perihnya sampai nggak bisa kena baju"], ["kulit agak perih"],
  kw=["kulit terbakar", "kulit panas", "perih di kulit", "nyeri di kulit", "kulit perih", "kulit seperti terbakar", "kulit nyeri"], cue=("diam_menahan", 0.5))
S("kuku_rusak", "Kuku menebal / rapuh / berubah warna", KULIT, "Apakah kukunya menebal, rapuh, atau berubah warna?",
  ["kuku saya tebal dan kuning", "kuku saya rapuh, kayak keropos"], None, ["kuku saya hancur semua"], ["kuku agak kusam"],
  kw=["kuku tebal", "kuku rapuh", "kuku kuning", "kuku keropos", "kuku rusak", "kuku berubah warna", "kuku"])
S("kutu_rambut", "Kutu di rambut / rambut kemaluan", KULIT, "Apakah ada kutu atau telurnya di rambut?",
  ["ada kutu di rambut saya", "ada telur kutu putih-putih nempel di rambut"], None, ["kutunya banyak sekali"], ["kayaknya ada kutu sedikit"],
  kw=["kutu", "kutuan", "kutu rambut", "telur kutu", "lisa", "kutu kepala"])
S("gatal_kepala", "Kulit kepala gatal", KULIT, "Apakah kulit kepalanya gatal?",
  ["kepala saya gatal", "kulit kepala saya gatal, saya garuk terus"], None, ["kepala saya gatal sekali sampai luka"], ["kepala agak gatal"],
  kw=["kepala gatal", "gatal di kepala", "kulit kepala gatal", "gatal kulit kepala"])
S("garis_berkelok", "Garis merah berkelok yang gatal", KULIT, "Apakah ada garis merah berkelok-kelok di kulit yang gatal?",
  ["ada garis merah berkelok-kelok di kaki saya, gatal", "kayak ada jalur cacing di bawah kulit saya"], None,
  ["garisnya makin panjang tiap hari"], ["ada garis merah kecil"],
  kw=["garis berkelok", "berkelok", "seperti benang", "jalur merah", "jalur cacing", "garis merah", "berliku"])
S("biduran", "Bentol-bentol kemerahan gatal (urtika)", KULIT, "Apakah muncul bentol-bentol kemerahan yang gatal?",
  ["badan saya bentol-bentol merah, gatal", "kulit saya bidur"], None, ["bentolnya di seluruh badan, makin melebar"], ["ada bentol sedikit"],
  kw=["bentol", "bentol bentol", "kaligata", "duduran", "bidur", "urtikaria", "bentol merah", "bengkak gatal"], cue=("ruam", 0.8))
S("bentol_gigitan", "Bentol bekas gigitan serangga", KULIT, "Apakah ada bekas gigitan serangga?",
  ["ada bekas gigitan serangga yang bentol", "saya digigit serangga, bentol dan gatal"], None, ["gigitannya bengkak besar"], ["bentol kecil bekas gigitan"],
  kw=["digigit serangga", "gigitan serangga", "digigit semut", "disengat", "sengatan", "tawon", "digigit tawon", "digigit ulat"])
S("kulit_kering", "Kulit kering", KULIT, "Apakah kulitnya kering?",
  ["kulit saya kering", "kulitnya kering kasar"], None, ["kulit saya kering sekali sampai pecah-pecah"], ["kulit agak kering"],
  kw=["kulit kering", "kering kulit", "kulit kering kasar"])
S("biang_keringat", "Biang keringat", KULIT, "Apakah ada bintik-bintik kecil biang keringat?",
  ["saya biang keringat", "muncul bintik-bintik kecil di leher dan punggung waktu gerah"], None, ["biang keringatnya penuh satu badan"], ["ada biang keringat sedikit"],
  kw=["biang keringat", "keringat buntet", "bintik keringat", "keringet buntet", "miliaria"])
S("ruam_popok", "Ruam di area popok", ANAK, "Apakah ada ruam di daerah popok?",
  ["kulit di popok saya merah", "pantat saya lecet merah kena popok"], None, ["merahnya lecet sampai berdarah"], ["agak merah di popok"],
  kw=["ruam popok", "merah di popok", "lecet popok", "daerah popok", "pantat merah", "iritasi popok"])
S("ketombe", "Ketombe / kulit kepala bersisik berminyak", KULIT, "Apakah ada ketombe atau sisik berminyak di kepala/wajah?",
  ["kepala saya ketombean", "ada sisik kekuningan berminyak di kepala dan alis"], None, ["ketombenya tebal sekali"], ["ada ketombe sedikit"],
  kw=["ketombe", "ketombean", "kulit kepala bersisik", "sisik di kepala", "sisik di alis"])
S("bercak_kehitaman", "Bercak kehitaman di tempat yang sama", KULIT, "Apakah ada bercak kehitaman yang muncul berulang di tempat yang sama?",
  ["ada bercak hitam yang muncul lagi di tempat yang sama", "kalau minum obat itu, bibir saya muncul bercak kehitaman"], None,
  ["bercak hitamnya melepuh"], ["ada bercak gelap sedikit"],
  kw=["bercak hitam", "bercak kehitaman", "bekas hitam", "muncul di tempat yang sama", "bercak gelap", "kulit menghitam"])
S("kulit_merah_panas", "Kulit merah, panas, bengkak, nyeri", KULIT, "Apakah kulitnya merah, panas, bengkak, dan nyeri?",
  ["kaki saya merah, panas, bengkak", "kulit saya merah meluas dan sakit"], None, ["merahnya meluas cepat sekali, panas sekali"], ["agak merah dan hangat"],
  kw=["kulit merah panas", "merah dan panas", "bengkak merah", "merah bengkak", "kulit bengkak merah", "merah meluas", "kemerahan meluas"], cue=("pincang_kanan", 0.3))
S("varises", "Pelebaran vena di tungkai", "Jantung & pembuluh darah", "Apakah ada urat yang menonjol berkelok di tungkai?",
  ["urat di kaki saya menonjol berkelok-kelok", "kaki saya varises"], None, ["varisesnya besar-besar"], ["ada urat kecil"],
  kw=["varises", "urat menonjol", "urat kaki", "pembuluh darah menonjol", "urat berkelok"], vol=False)
review_add("kulit", "gatal_kulit", "ruam_kulit", "kulit_bersisik", "bercak_putih_kulit", "bintil_bernanah", "bisul", "lepuh_kulit", "koreng",
           "kutil", "biduran", "jerawat", "kulit_kering", "biang_keringat", "benjolan_kulit")

# ------------------------------------------------------------------------------ TRAUMA
S("luka_robek", "Luka robek / terbuka", TRAUMA, "Apakah ada luka robek atau luka terbuka?",
  ["ada luka robek, Dok, berdarah", "kulit saya sobek dan berdarah"], None, ["lukanya lebar dan darahnya banyak sekali"], ["lukanya kecil"],
  kw=["luka robek", "luka sobek", "sobek", "luka terbuka", "luka menganga", "terluka", "berdarah terus", "kena pisau", "kena kaca", "kena seng"], cue=("pegang", 0.6, "lengan"), site="lengan")
S("luka_tusuk", "Luka tusuk", TRAUMA, "Apakah ada luka tusuk?",
  ["saya tertusuk", "kaki saya tertusuk paku"], None, ["tusukannya dalam sekali"], ["cuma tertusuk sedikit"],
  kw=["tertusuk", "luka tusuk", "ketusuk", "tusukan", "tertusuk paku", "kena paku", "ditusuk"], cue=("pincang_kanan", 0.5))
S("luka_bakar", "Luka bakar", TRAUMA, "Apakah ada luka bakar atau kena benda panas?",
  ["kulit saya kena air panas, melepuh", "saya kena luka bakar"], None, ["luka bakarnya luas sekali"], ["cuma kena panas sedikit"],
  kw=["luka bakar", "kena air panas", "tersiram air panas", "tersiram", "kena api", "kena knalpot", "kena minyak panas", "kesiram"], cue=("diam_menahan", 0.6))
S("memar", "Memar / lebam / benjol", TRAUMA, "Apakah ada memar, lebam, atau benjol?",
  ["badan saya memar-memar", "ada lebam biru di badan saya"], None, ["memarnya banyak sekali, biru semua"], ["ada memar sedikit"],
  kw=["memar", "lebam", "biru biru", "biru lebam", "bengkak kena pukul", "lebam biru"])
S("nyeri_luka", "Nyeri di bagian yang cedera", TRAUMA, "Apakah bagian yang cedera terasa nyeri?",
  ["lukanya sakit sekali", "bagian yang luka sakit kalau ditekan"], None, ["sakitnya luar biasa"], ["agak nyeri"],
  kw=["sakit di luka", "nyeri luka", "lukanya sakit", "perih di luka", "sakit yang kena", "nyeri bekas pukulan", "sakit bekas"], cue=("diam_menahan", 0.4))
