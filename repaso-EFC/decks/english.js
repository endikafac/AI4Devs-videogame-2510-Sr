(function () {
  var D = (window.RepasoDecks = window.RepasoDecks || []);
  var L = function (es, en, eu, gl, ca, fr) { return { es: es, en: en, eu: eu, gl: gl, ca: ca, fr: fr }; };
  var R = function (s) { var p = s.split('|'); return L(p[0], p[5], p[1], p[2], p[3], p[4]); }; // es|eu|gl|ca|fr|en

  // 1. Irregular verbs
  var verbs = [
    'be:was / were / been', 'bet:bet / bet', 'bind:bound / bound', 'burst:burst / burst', 'cast:cast / cast', 'forecast:forecast / forecast', 'beat:beat / beaten', 'become:became / become', 'begin:began / begun', 'bend:bent / bent',
    'bite:bit / bitten', 'bleed:bled / bled', 'blow:blew / blown', 'break:broke / broken', 'breed:bred / bred',
    'bring:brought / brought', 'build:built / built', 'buy:bought / bought', 'catch:caught / caught', 'choose:chose / chosen',
    'come:came / come', 'cost:cost / cost', 'cut:cut / cut', 'deal:dealt / dealt', 'dig:dug / dug',
    'do:did / done', 'draw:drew / drawn', 'drink:drank / drunk', 'drive:drove / driven', 'eat:ate / eaten',
    'fall:fell / fallen', 'feed:fed / fed', 'feel:felt / felt', 'fight:fought / fought', 'find:found / found',
    'flee:fled / fled', 'fly:flew / flown', 'forbid:forbade / forbidden', 'forget:forgot / forgotten', 'forgive:forgave / forgiven',
    'freeze:froze / frozen', 'get:got / got', 'give:gave / given', 'go:went / gone', 'grow:grew / grown',
    'hang:hung / hung', 'have:had / had', 'hear:heard / heard', 'hide:hid / hidden', 'hit:hit / hit',
    'hold:held / held', 'hurt:hurt / hurt', 'keep:kept / kept', 'know:knew / known', 'lay:laid / laid',
    'lead:led / led', 'leave:left / left', 'lend:lent / lent', 'let:let / let', 'light:lit / lit',
    'lose:lost / lost', 'make:made / made', 'mean:meant / meant', 'meet:met / met', 'overcome:overcame / overcome',
    'pay:paid / paid', 'put:put / put', 'quit:quit / quit', 'read:read / read', 'ride:rode / ridden',
    'ring:rang / rung', 'rise:rose / risen', 'run:ran / run', 'say:said / said', 'see:saw / seen',
    'seek:sought / sought', 'sell:sold / sold', 'send:sent / sent', 'set:set / set', 'shake:shook / shaken',
    'shine:shone / shone', 'shoot:shot / shot', 'show:showed / shown', 'shrink:shrank / shrunk', 'shut:shut / shut',
    'sing:sang / sung', 'sink:sank / sunk', 'sit:sat / sat', 'sleep:slept / slept', 'slide:slid / slid',
    'speak:spoke / spoken', 'spend:spent / spent', 'spin:spun / spun', 'spit:spat / spat', 'split:split / split',
    'spread:spread / spread', 'stand:stood / stood', 'steal:stole / stolen', 'stick:stuck / stuck', 'sting:stung / stung',
    'strike:struck / struck', 'swear:swore / sworn', 'sweep:swept / swept', 'swim:swam / swum', 'swing:swung / swung',
    'take:took / taken', 'teach:taught / taught', 'tear:tore / torn', 'tell:told / told', 'think:thought / thought',
    'throw:threw / thrown', 'undergo:underwent / undergone', 'understand:understood / understood', 'undo:undid / undone', 'wake:woke / woken',
    'wear:wore / worn', 'weep:wept / wept', 'win:won / won', 'wind:wound / wound', 'write:wrote / written'
  ].map(function (s) { var p = s.split(':'); return { id: 'v_' + p[0], q: p[0], a: p[1], tag: 'verbs' }; });
  D.push({
    id: 'english-irregular-verbs', icon: '📝',
    title: L('Verbos irregulares en inglés', 'English irregular verbs', 'Ingeleseko aditz irregularrak', 'Verbos irregulares en inglés', 'Verbs irregulars en anglès', 'Verbes irréguliers anglais'),
    desc: L('Verbo base, pasado simple y participio: went / gone', 'Base verb, past simple and participle: went / gone', 'Oinarrizko aditza, iraganaldi soila eta partizipioa: went / gone', 'Verbo base, pasado simple e participio: went / gone', 'Verb base, passat simple i participi: went / gone', 'Verbe de base, prétérit et participe passé : went / gone'),
    age: '9+', cards: verbs
  });

  // 2. Basic vocabulary (es|eu|gl|ca|fr|en)
  var rows = [
    // animals
    'perro|txakurra|can|gos|chien|dog', 'gato|katua|gato|gat|chat|cat', 'caballo|zaldia|cabalo|cavall|cheval|horse', 'vaca|behia|vaca|vaca|vache|cow',
    'cerdo|txerria|porco|porc|cochon|pig', 'oveja|ardia|ovella|ovella|brebis|sheep', 'pájaro|txoria|paxaro|ocell|oiseau|bird', 'pez|arraina|peixe|peix|poisson|fish',
    'conejo|untxia|coello|conill|lapin|rabbit', 'ratón|sagua|rato|ratolí|souris|mouse', 'gallina|oiloa|galiña|gallina|poule|hen', 'pato|ahatea|pato|ànec|canard|duck',
    'león|lehoia|león|lleó|lion|lion', 'tigre|tigrea|tigre|tigre|tigre|tiger', 'elefante|elefantea|elefante|elefant|éléphant|elephant', 'mono|tximinoa|mono|mico|singe|monkey',
    'oso|hartza|oso|ós|ours|bear', 'lobo|otsoa|lobo|llop|loup|wolf', 'zorro|azeria|raposo|guineu|renard|fox', 'serpiente|sugea|serpe|serp|serpent|snake',
    'rana|igela|ra|granota|grenouille|frog', 'tortuga|dortoka|tartaruga|tortuga|tortue|turtle', 'mariposa|tximeleta|bolboreta|papallona|papillon|butterfly', 'abeja|erlea|abella|abella|abeille|bee',
    // food
    'pan|ogia|pan|pa|pain|bread', 'leche|esnea|leite|llet|lait|milk', 'agua|ura|auga|aigua|eau|water', 'huevo|arrautza|ovo|ou|œuf|egg',
    'queso|gazta|queixo|formatge|fromage|cheese', 'manzana|sagarra|mazá|poma|pomme|apple', 'naranja|laranja|laranxa|taronja|orange|orange', 'plátano|banana|plátano|plàtan|banane|banana',
    'uva|mahatsa|uva|raïm|raisin|grape', 'fresa|marrubia|amorodo|maduixa|fraise|strawberry', 'tomate|tomatea|tomate|tomàquet|tomate|tomato', 'patata|patata|pataca|patata|pomme de terre|potato',
    'zanahoria|azenarioa|cenoria|pastanaga|carotte|carrot', 'carne|haragia|carne|carn|viande|meat', 'arroz|arroza|arroz|arròs|riz|rice', 'sopa|zopa|sopa|sopa|soupe|soup',
    'azúcar|azukrea|azucre|sucre|sucre|sugar', 'sal|gatza|sal|sal|sel|salt', 'helado|izozkia|xeado|gelat|glace|ice cream', 'chocolate|txokolatea|chocolate|xocolata|chocolat|chocolate',
    'zumo|zukua|zume|suc|jus|juice', 'limón|limoia|limón|llimona|citron|lemon',
    // house
    'casa|etxea|casa|casa|maison|house', 'puerta|atea|porta|porta|porte|door', 'ventana|leihoa|fiestra|finestra|fenêtre|window', 'mesa|mahaia|mesa|taula|table|table',
    'silla|aulkia|cadeira|cadira|chaise|chair', 'cama|ohea|cama|llit|lit|bed', 'cocina|sukaldea|cociña|cuina|cuisine|kitchen', 'baño|bainugela|baño|bany|salle de bain|bathroom',
    'dormitorio|logela|dormitorio|dormitori|chambre|bedroom', 'jardín|lorategia|xardín|jardí|jardin|garden', 'techo|sabaia|teito|sostre|plafond|ceiling', 'suelo|zorua|chan|terra|sol|floor',
    'pared|horma|parede|paret|mur|wall', 'escalera|eskailera|escaleira|escala|escalier|stairs', 'sofá|sofa|sofá|sofà|canapé|sofa', 'lámpara|lanpara|lámpada|llum|lampe|lamp',
    'espejo|ispilua|espello|mirall|miroir|mirror', 'llave|giltza|chave|clau|clé|key', 'reloj|erlojua|reloxo|rellotge|horloge|clock',
    // body
    'cabeza|burua|cabeza|cap|tête|head', 'mano|eskua|man|mà|main|hand', 'pie|oina|pé|peu|pied|foot', 'brazo|besoa|brazo|braç|bras|arm',
    'pierna|hanka|perna|cama|jambe|leg', 'ojo|begia|ollo|ull|œil|eye', 'nariz|sudurra|nariz|nas|nez|nose', 'boca|ahoa|boca|boca|bouche|mouth',
    'oreja|belarria|orella|orella|oreille|ear', 'diente|hagina|dente|dent|dent|tooth', 'cara|aurpegia|cara|cara|visage|face', 'corazón|bihotza|corazón|cor|cœur|heart',
    'dedo|behatza|dedo|dit|doigt|finger', 'rodilla|belauna|xeonllo|genoll|genou|knee', 'espalda|bizkarra|costas|esquena|dos|back', 'cuello|lepoa|pescozo|coll|cou|neck',
    // colours
    'rojo|gorria|vermello|vermell|rouge|red', 'azul|urdina|azul|blau|bleu|blue', 'verde|berdea|verde|verd|vert|green', 'amarillo|horia|amarelo|groc|jaune|yellow',
    'negro|beltza|negro|negre|noir|black', 'blanco|zuria|branco|blanc|blanc|white', 'rosa|arrosa|rosa|rosa|rose|pink', 'morado|more|morado|morat|violet|purple',
    'marrón|marroia|marrón|marró|marron|brown', 'gris|grisa|gris|gris|gris|grey',
    // school
    'libro|liburua|libro|llibre|livre|book', 'lápiz|arkatza|lapis|llapis|crayon|pencil', 'bolígrafo|boligrafoa|bolígrafo|bolígraf|stylo|pen', 'cuaderno|koadernoa|caderno|quadern|cahier|notebook',
    'mochila|motxila|mochila|motxilla|cartable|schoolbag', 'regla|erregela|regra|regle|règle|ruler', 'profesor|irakaslea|profesor|professor|professeur|teacher', 'pizarra|arbela|pizarra|pissarra|tableau|blackboard',
    'tijeras|artaziak|tesoiras|tisores|ciseaux|scissors', 'escuela|ikastetxea|escola|escola|école|school', 'clase|gela|clase|classe|classe|classroom', 'mapa|mapa|mapa|mapa|carte|map',
    // clothes
    'camiseta|kamiseta|camiseta|samarreta|t-shirt|t-shirt', 'pantalones|prakak|pantalóns|pantalons|pantalon|trousers', 'zapato|zapata|zapato|sabata|chaussure|shoe', 'calcetín|galtzerdia|calcetín|mitjó|chaussette|sock',
    'sombrero|kapela|sombreiro|barret|chapeau|hat', 'abrigo|berokia|abrigo|abric|manteau|coat', 'falda|gona|saia|faldilla|jupe|skirt', 'vestido|soinekoa|vestido|vestit|robe|dress',
    'guantes|eskularruak|luvas|guants|gants|gloves', 'bufanda|bufanda|bufanda|bufanda|écharpe|scarf', 'jersey|jertsea|xersei|jersei|pull|sweater', 'cinturón|gerrikoa|cinto|cinturó|ceinture|belt',
    // family, transport, nature, others
    'madre|ama|nai|mare|mère|mother', 'padre|aita|pai|pare|père|father', 'hermano|anaia|irmán|germà|frère|brother', 'hermana|arreba|irmá|germana|sœur|sister',
    'abuelo|aitona|avó|avi|grand-père|grandfather', 'abuela|amona|avoa|àvia|grand-mère|grandmother', 'amigo|laguna|amigo|amic|ami|friend',
    'coche|autoa|coche|cotxe|voiture|car', 'bicicleta|bizikleta|bicicleta|bicicleta|vélo|bicycle', 'tren|trena|tren|tren|train|train', 'barco|ontzia|barco|vaixell|bateau|boat', 'avión|hegazkina|avión|avió|avion|plane',
    'sol|eguzkia|sol|sol|soleil|sun', 'luna|ilargia|lúa|lluna|lune|moon', 'estrella|izarra|estrela|estrella|étoile|star', 'árbol|zuhaitza|árbore|arbre|arbre|tree',
    'flor|lorea|flor|flor|fleur|flower', 'río|ibaia|río|riu|rivière|river', 'montaña|mendia|montaña|muntanya|montagne|mountain', 'mar|itsasoa|mar|mar|mer|sea',
    'lluvia|euria|choiva|pluja|pluie|rain', 'nieve|elurra|neve|neu|neige|snow', 'viento|haizea|vento|vent|vent|wind', 'nube|hodeia|nube|núvol|nuage|cloud',
    'dinero|dirua|diñeiro|diners|argent|money', 'ciudad|hiria|cidade|ciutat|ville|city', 'calle|kalea|rúa|carrer|rue|street', 'tienda|denda|tenda|botiga|magasin|shop',
    'gafas|betaurrekoak|lentes|ulleres|lunettes|glasses', 'paraguas|aterkia|paraugas|paraigua|parapluie|umbrella', 'teléfono|telefonoa|teléfono|telèfon|téléphone|phone', 'ordenador|ordenagailua|ordenador|ordinador|ordinateur|computer', 'cumpleaños|urtebetetzea|aniversario|aniversari|anniversaire|birthday', 'pelota|pilota|pelota|pilota|balle|ball', 'regalo|oparia|agasallo|regal|cadeau|gift'
  ];
  var vocab = rows.map(function (r, n) {
    var o = R(r);
    return { id: 'w_' + o.en.replace(/[^a-z]/gi, ''), q: { es: o.es, en: o.es, eu: o.eu, gl: o.gl, ca: o.ca, fr: o.fr }, a: o.en, tag: 'vocab' };
  });
  D.push({
    id: 'english-vocab', icon: '🔤',
    title: L('Vocabulario básico de inglés', 'Basic English vocabulary', 'Oinarrizko ingeleseko hiztegia', 'Vocabulario básico de inglés', 'Vocabulari bàsic d\'anglès', 'Vocabulaire de base en anglais'),
    desc: L('Animales, comida, casa, cuerpo, colores, cole y ropa', 'Animals, food, house, body, colours, school and clothes', 'Animaliak, janaria, etxea, gorputza, koloreak, eskola eta arropa', 'Animais, comida, casa, corpo, cores, escola e roupa', 'Animals, menjar, casa, cos, colors, escola i roba', 'Animaux, nourriture, maison, corps, couleurs, école et vêtements'),
    age: '6+', cards: vocab
  });

  // 3. Months, days, numbers, ordinals
  var cal = [];
  var months = [
    'enero|urtarrila|xaneiro|gener|janvier|January', 'febrero|otsaila|febreiro|febrer|février|February', 'marzo|martxoa|marzo|març|mars|March',
    'abril|apirila|abril|abril|avril|April', 'mayo|maiatza|maio|maig|mai|May', 'junio|ekaina|xuño|juny|juin|June',
    'julio|uztaila|xullo|juliol|juillet|July', 'agosto|abuztua|agosto|agost|août|August', 'septiembre|iraila|setembro|setembre|septembre|September',
    'octubre|urria|outubro|octubre|octobre|October', 'noviembre|azaroa|novembro|novembre|novembre|November', 'diciembre|abendua|decembro|desembre|décembre|December'
  ];
  months.forEach(function (r, n) { var o = R(r); cal.push({ id: 'mo' + (n + 1), q: L(o.es, o.es, o.eu, o.gl, o.ca, o.fr), a: o.en, tag: 'months' }); });
  var days = [
    'lunes|astelehena|luns|dilluns|lundi|Monday', 'martes|asteartea|martes|dimarts|mardi|Tuesday', 'miércoles|asteazkena|mércores|dimecres|mercredi|Wednesday',
    'jueves|osteguna|xoves|dijous|jeudi|Thursday', 'viernes|ostirala|venres|divendres|vendredi|Friday', 'sábado|larunbata|sábado|dissabte|samedi|Saturday', 'domingo|igandea|domingo|diumenge|dimanche|Sunday'
  ];
  days.forEach(function (r, n) { var o = R(r); cal.push({ id: 'da' + (n + 1), q: L(o.es, o.es, o.eu, o.gl, o.ca, o.fr), a: o.en, tag: 'days' }); });
  var nm = { 11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen', 15: 'fifteen', 16: 'sixteen', 17: 'seventeen', 18: 'eighteen', 19: 'nineteen', 20: 'twenty', 30: 'thirty', 40: 'forty', 50: 'fifty', 60: 'sixty', 70: 'seventy', 80: 'eighty', 90: 'ninety', 100: 'one hundred' };
  Object.keys(nm).forEach(function (k) { cal.push({ id: 'n' + k, q: k, a: nm[k], tag: 'numbers' }); });
  var ord = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
  var suf = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
  ord.forEach(function (w, n) { cal.push({ id: 'o' + (n + 1), q: suf[n], a: w, tag: 'ordinals' }); });
  D.push({
    id: 'english-calendar-numbers', icon: '📅',
    title: L('Meses, días, números y ordinales en inglés', 'Months, days, numbers and ordinals in English', 'Hilabeteak, egunak, zenbakiak eta ordinalak ingelesez', 'Meses, días, números e ordinais en inglés', 'Mesos, dies, números i ordinals en anglès', 'Mois, jours, nombres et ordinaux en anglais'),
    desc: L('Escríbelos en inglés', 'Write them in English', 'Idatzi ingelesez', 'Escríbeos en inglés', 'Escriu-los en anglès', 'Écris-les en anglais'),
    age: '6+', cards: cal
  });
})();
