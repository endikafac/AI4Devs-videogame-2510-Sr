(function () {
  var D = (window.RepasoDecks = window.RepasoDecks || []);
  var L = function (es, en, eu, gl, ca, fr) { return { es: es, en: en, eu: eu, gl: gl, ca: ca, fr: fr }; };
  var P = function (s) { var p = s.split('|'); return L(p[0], p[1], p[2], p[3], p[4], p[5]); }; // es|en|eu|gl|ca|fr
  var T = function (s) { return s; };

  // ---------- 1. Periodic table ----------
  // Z 1-54: sym|es|en|eu|gl|ca|fr   Z 55-118: sym|es|en|fr (eu/gl/ca omitted when not certain)
  var el = [
    'H|hidrógeno|hydrogen|hidrogenoa|hidróxeno|hidrogen|hydrogène', 'He|helio|helium|helioa|helio|heli|hélium', 'Li|litio|lithium|litioa|litio|liti|lithium',
    'Be|berilio|beryllium|berilioa|berilio|beril·li|béryllium', 'B|boro|boron|boroa|boro|bor|bore', 'C|carbono|carbon|karbonoa|carbono|carboni|carbone',
    'N|nitrógeno|nitrogen|nitrogenoa|nitróxeno|nitrogen|azote', 'O|oxígeno|oxygen|oxigenoa|osíxeno|oxigen|oxygène', 'F|flúor|fluorine|fluora|flúor|fluor|fluor',
    'Ne|neón|neon|neona|neón|neó|néon', 'Na|sodio|sodium|sodioa|sodio|sodi|sodium', 'Mg|magnesio|magnesium|magnesioa|magnesio|magnesi|magnésium',
    'Al|aluminio|aluminium|aluminioa|aluminio|alumini|aluminium', 'Si|silicio|silicon|silizioa|silicio|silici|silicium', 'P|fósforo|phosphorus|fosforoa|fósforo|fòsfor|phosphore',
    'S|azufre|sulfur|sufrea|xofre|sofre|soufre', 'Cl|cloro|chlorine|kloroa|cloro|clor|chlore', 'Ar|argón|argon|argona|argon|argó|argon',
    'K|potasio|potassium|potasioa|potasio|potassi|potassium', 'Ca|calcio|calcium|kaltzioa|calcio|calci|calcium', 'Sc|escandio|scandium|eskandioa|escandio|escandi|scandium',
    'Ti|titanio|titanium|titanioa|titanio|titani|titane', 'V|vanadio|vanadium|banadioa|vanadio|vanadi|vanadium', 'Cr|cromo|chromium|kromoa|cromo|crom|chrome',
    'Mn|manganeso|manganese|manganesoa|manganeso|manganès|manganèse', 'Fe|hierro|iron|burdina|ferro|ferro|fer', 'Co|cobalto|cobalt|kobaltoa|cobalto|cobalt|cobalt',
    'Ni|níquel|nickel|nikela|níquel|níquel|nickel', 'Cu|cobre|copper|kobrea|cobre|coure|cuivre', 'Zn|zinc|zinc|zinka|cinc|zinc|zinc',
    'Ga|galio|gallium|galioa|galio|gal·li|gallium', 'Ge|germanio|germanium|germanioa|xermanio|germani|germanium', 'As|arsénico|arsenic|artsenikoa|arsénico|arsènic|arsenic',
    'Se|selenio|selenium|selenioa|selenio|seleni|sélénium', 'Br|bromo|bromine|bromoa|bromo|brom|brome', 'Kr|criptón|krypton|kriptona|criptón|criptó|krypton',
    'Rb|rubidio|rubidium|rubidioa|rubidio|rubidi|rubidium', 'Sr|estroncio|strontium|estrontzioa|estroncio|estronci|strontium', 'Y|itrio|yttrium|itrioa|itrio|itri|yttrium',
    'Zr|circonio|zirconium|zirkonioa|circonio|zirconi|zirconium', 'Nb|niobio|niobium|niobioa|niobio|niobi|niobium', 'Mo|molibdeno|molybdenum|molibdenoa|molibdeno|molibdè|molybdène',
    'Tc|tecnecio|technetium|teknezioa|tecnecio|tecneci|technétium', 'Ru|rutenio|ruthenium|rutenioa|rutenio|ruteni|ruthénium', 'Rh|rodio|rhodium|rodioa|rodio|rodi|rhodium',
    'Pd|paladio|palladium|paladioa|paladio|pal·ladi|palladium', 'Ag|plata|silver|zilarra|prata|plata|argent', 'Cd|cadmio|cadmium|kadmioa|cadmio|cadmi|cadmium',
    'In|indio|indium|indioa|indio|indi|indium', 'Sn|estaño|tin|eztainua|estaño|estany|étain', 'Sb|antimonio|antimony|antimonioa|antimonio|antimoni|antimoine',
    'Te|telurio|tellurium|telurioa|teluro|tel·luri|tellure', 'I|yodo|iodine|iodoa|iodo|iode|iode', 'Xe|xenón|xenon|xenona|xenón|xenó|xénon'
  ].map(function (s) { var p = s.split('|'); return { s: p[0], n: L(p[1], p[2], p[3], p[4], p[5], p[6]) }; });
  var el2 = [
    'Cs|cesio|caesium|césium', 'Ba|bario|barium|baryum', 'La|lantano|lanthanum|lanthane', 'Ce|cerio|cerium|cérium', 'Pr|praseodimio|praseodymium|praséodyme',
    'Nd|neodimio|neodymium|néodyme', 'Pm|prometio|promethium|prométhium', 'Sm|samario|samarium|samarium', 'Eu|europio|europium|europium', 'Gd|gadolinio|gadolinium|gadolinium',
    'Tb|terbio|terbium|terbium', 'Dy|disprosio|dysprosium|dysprosium', 'Ho|holmio|holmium|holmium', 'Er|erbio|erbium|erbium', 'Tm|tulio|thulium|thulium',
    'Yb|iterbio|ytterbium|ytterbium', 'Lu|lutecio|lutetium|lutécium', 'Hf|hafnio|hafnium|hafnium', 'Ta|tántalo|tantalum|tantale', 'W|wolframio|tungsten|tungstène',
    'Re|renio|rhenium|rhénium', 'Os|osmio|osmium|osmium', 'Ir|iridio|iridium|iridium', 'Pt|platino|platinum|platine', 'Au|oro|gold|or',
    'Hg|mercurio|mercury|mercure', 'Tl|talio|thallium|thallium', 'Pb|plomo|lead|plomb', 'Bi|bismuto|bismuth|bismuth', 'Po|polonio|polonium|polonium',
    'At|astato|astatine|astate', 'Rn|radón|radon|radon', 'Fr|francio|francium|francium', 'Ra|radio|radium|radium', 'Ac|actinio|actinium|actinium',
    'Th|torio|thorium|thorium', 'Pa|protactinio|protactinium|protactinium', 'U|uranio|uranium|uranium', 'Np|neptunio|neptunium|neptunium', 'Pu|plutonio|plutonium|plutonium',
    'Am|americio|americium|américium', 'Cm|curio|curium|curium', 'Bk|berkelio|berkelium|berkélium', 'Cf|californio|californium|californium', 'Es|einstenio|einsteinium|einsteinium',
    'Fm|fermio|fermium|fermium', 'Md|mendelevio|mendelevium|mendélévium', 'No|nobelio|nobelium|nobélium', 'Lr|lawrencio|lawrencium|lawrencium', 'Rf|rutherfordio|rutherfordium|rutherfordium',
    'Db|dubnio|dubnium|dubnium', 'Sg|seaborgio|seaborgium|seaborgium', 'Bh|bohrio|bohrium|bohrium', 'Hs|hassio|hassium|hassium', 'Mt|meitnerio|meitnerium|meitnérium',
    'Ds|darmstatio|darmstadtium|darmstadtium', 'Rg|roentgenio|roentgenium|roentgenium', 'Cn|copernicio|copernicium|copernicium', 'Nh|nihonio|nihonium|nihonium', 'Fl|flerovio|flerovium|flérovium',
    'Mc|moscovio|moscovium|moscovium', 'Lv|livermorio|livermorium|livermorium', 'Ts|teneso|tennessine|tennesse', 'Og|oganesón|oganesson|oganesson'
  ].map(function (s) { var p = s.split('|'); return { s: p[0], n: { es: p[1], en: p[2], fr: p[3] } }; });
  var elCards = el.concat(el2).map(function (e, i) { return { id: 'el' + (i + 1), q: e.s, a: e.n, tag: 'Z=' + (i + 1) }; });
  D.push({
    id: 'science-elements', icon: '⚗️',
    title: L('Tabla periódica: símbolos', 'Periodic table: symbols', 'Taula periodikoa: sinboloak', 'Táboa periódica: símbolos', 'Taula periòdica: símbols', 'Tableau périodique : symboles'),
    desc: L('Los 118 elementos: de símbolo a nombre', 'The 118 elements: from symbol to name', '118 elementuak: sinbolotik izenera', 'Os 118 elementos: de símbolo a nome', 'Els 118 elements: de símbol a nom', 'Les 118 éléments : du symbole au nom'),
    age: '11+', cards: elCards
  });

  // ---------- 2. Solar system ----------
  var pl = {
    mer: P('Mercurio|Mercury|Merkurio|Mercurio|Mercuri|Mercure'), ven: P('Venus|Venus|Artizarra|Venus|Venus|Vénus'), ear: P('Tierra|Earth|Lurra|Terra|Terra|Terre'),
    mar: P('Marte|Mars|Marte|Marte|Mart|Mars'), jup: P('Júpiter|Jupiter|Jupiter|Xúpiter|Júpiter|Jupiter'), sat: P('Saturno|Saturn|Saturno|Saturno|Saturn|Saturne'),
    ura: P('Urano|Uranus|Urano|Urano|Urà|Uranus'), nep: P('Neptuno|Neptune|Neptuno|Neptuno|Neptú|Neptune')
  };
  var order = ['mer', 'ven', 'ear', 'mar', 'jup', 'sat', 'ura', 'nep'];
  var sol = order.map(function (k, i) {
    return { id: 'pl' + (i + 1), q: L('Planeta nº ' + (i + 1) + ' desde el Sol', 'Planet no. ' + (i + 1) + ' from the Sun', (i + 1) + '. planeta Eguzkitik', 'Planeta nº ' + (i + 1) + ' desde o Sol', 'Planeta núm. ' + (i + 1) + ' des del Sol', 'Planète n° ' + (i + 1) + ' depuis le Soleil'), a: pl[k], tag: 'order' };
  });
  function sc(id, q, a, tag) { sol.push({ id: id, q: q, a: a, tag: tag }); }
  sc('pbig', L('El planeta más grande', 'The biggest planet', 'Planetarik handiena', 'O planeta máis grande', 'El planeta més gran', 'La plus grande planète'), pl.jup, 'facts');
  sc('psmall', L('El planeta más pequeño', 'The smallest planet', 'Planetarik txikiena', 'O planeta máis pequeno', 'El planeta més petit', 'La plus petite planète'), pl.mer, 'facts');
  sc('phot', L('El planeta más caliente', 'The hottest planet', 'Planetarik beroena', 'O planeta máis quente', 'El planeta més calent', 'La planète la plus chaude'), pl.ven, 'facts');
  sc('pred', L('El planeta rojo', 'The red planet', 'Planeta gorria', 'O planeta vermello', 'El planeta vermell', 'La planète rouge'), pl.mar, 'facts');
  sc('pring', L('El planeta famoso por sus anillos', 'The planet famous for its rings', 'Eraztunengatik ezaguna den planeta', 'O planeta famoso polos seus aneis', 'El planeta famós pels seus anells', 'La planète célèbre pour ses anneaux'), pl.sat, 'facts');
  sc('pfar', L('El planeta más lejano del Sol', 'The planet farthest from the Sun', 'Eguzkitik urrutien dagoen planeta', 'O planeta máis afastado do Sol', 'El planeta més llunyà del Sol', 'La planète la plus éloignée du Soleil'), pl.nep, 'facts');
  sc('pside', L('El planeta que gira "tumbado" de lado', 'The planet that spins on its side', 'Alboan etzanda biratzen duen planeta', 'O planeta que xira "deitado" de lado', 'El planeta que gira "estirat" de costat', 'La planète qui tourne couchée sur le côté'), pl.ura, 'facts');
  sc('pspot', L('El planeta con la Gran Mancha Roja', 'The planet with the Great Red Spot', 'Orban Gorri Handia duen planeta', 'O planeta coa Gran Mancha Vermella', 'El planeta amb la Gran Taca Vermella', 'La planète avec la Grande Tache rouge'), pl.jup, 'facts');
  sc('phome', L('El planeta donde vivimos', 'The planet where we live', 'Bizi garen planeta', 'O planeta onde vivimos', 'El planeta on vivim', 'La planète où nous vivons'), pl.ear, 'facts');
  sc('pcount', L('Número de planetas del sistema solar', 'Number of planets in the solar system', 'Eguzki-sistemako planeta kopurua', 'Número de planetas do sistema solar', 'Nombre de planetes del sistema solar', 'Nombre de planètes du système solaire'), T('8'), 'facts');
  sc('prock', L('Número de planetas rocosos', 'Number of rocky planets', 'Planeta harritsuen kopurua', 'Número de planetas rochosos', 'Nombre de planetes rocosos', 'Nombre de planètes rocheuses'), T('4'), 'facts');
  sc('pstar', L('La estrella en el centro del sistema solar', 'The star at the centre of the solar system', 'Eguzki-sistemaren erdian dagoen izarra', 'A estrela no centro do sistema solar', 'L\'estrella al centre del sistema solar', 'L\'étoile au centre du système solaire'), P('Sol|Sun|Eguzkia|Sol|Sol|Soleil'), 'facts');
  sc('pmoon', L('El satélite natural de la Tierra', 'The natural satellite of the Earth', 'Lurraren satelite naturala', 'O satélite natural da Terra', 'El satèl·lit natural de la Terra', 'Le satellite naturel de la Terre'), P('Luna|Moon|Ilargia|Lúa|Lluna|Lune'), 'facts');
  sc('pgal', L('La galaxia en la que está la Tierra', 'The galaxy that contains the Earth', 'Lurra dagoen galaxia', 'A galaxia na que está a Terra', 'La galàxia en què es troba la Terra', 'La galaxie qui contient la Terre'), P('Vía Láctea|Milky Way|Esne Bidea|Vía Láctea|Via Làctia|Voie lactée'), 'facts');
  sc('pdwarf', L('Antiguo noveno planeta, hoy planeta enano', 'Former ninth planet, now a dwarf planet', 'Bederatzigarren planeta zena, gaur planeta nano', 'Antigo noveno planeta, hoxe planeta anano', 'Antic novè planeta, avui planeta nan', 'Ancienne neuvième planète, aujourd\'hui planète naine'), P('Plutón|Pluto|Plutón|Plutón|Plutó|Pluton'), 'facts');
  sc('pdayh', L('Horas que dura un día en la Tierra', 'Hours in a day on Earth', 'Lurreko egun baten ordu kopurua', 'Horas que dura un día na Terra', 'Hores que dura un dia a la Terra', 'Heures dans un jour sur Terre'), T('24'), 'facts');
  sc('pyear', L('Días que tarda la Tierra en dar una vuelta al Sol', 'Days the Earth takes to go around the Sun', 'Lurrak Eguzkiaren inguruan bira bat emateko behar dituen egunak', 'Días que tarda a Terra en dar unha volta ao Sol', 'Dies que triga la Terra a fer una volta al Sol', 'Jours que met la Terre pour faire le tour du Soleil'), T('365'), 'facts');
  sc('pmoonman', L('Primer ser humano en pisar la Luna', 'First human to walk on the Moon', 'Ilargian oinez ibili zen lehen gizakia', 'Primeiro ser humano en pisar a Lúa', 'Primer ésser humà a trepitjar la Lluna', 'Premier être humain à marcher sur la Lune'), T('Neil Armstrong'), 'facts');
  D.push({
    id: 'science-solar-system', icon: '🪐',
    title: L('Sistema solar', 'Solar system', 'Eguzki-sistema', 'Sistema solar', 'Sistema solar', 'Système solaire'),
    desc: L('Orden de los planetas y curiosidades', 'Order of the planets and fun facts', 'Planeten ordena eta bitxikeriak', 'Orde dos planetas e curiosidades', 'Ordre dels planetes i curiositats', 'Ordre des planètes et curiosités'),
    age: '7+', cards: sol
  });

  // ---------- 3. Human body ----------
  var fpre = L('Función:', 'Function:', 'Funtzioa:', 'Función:', 'Funció:', 'Fonction :');
  function withPre(pre, o) { var r = {}; Object.keys(o).forEach(function (l) { r[l] = pre[l] + ' ' + o[l]; }); return r; }
  var organs = [
    ['heart', 'corazón|heart|bihotza|corazón|cor|cœur', 'Bombea la sangre|Pumps blood|Odola ponpatzen du|Bombea o sangue|Bombeja la sang|Pompe le sang'],
    ['lungs', 'pulmones|lungs|birikak|pulmóns|pulmons|poumons', 'Permiten respirar|Allow us to breathe|Arnasa hartzeko balio dute|Permiten respirar|Permeten respirar|Permettent de respirer'],
    ['brain', 'cerebro|brain|garuna|cerebro|cervell|cerveau', 'Controla el cuerpo y piensa|Controls the body and thinks|Gorputza kontrolatzen du eta pentsatzen du|Controla o corpo e pensa|Controla el cos i pensa|Contrôle le corps et pense'],
    ['stomach', 'estómago|stomach|urdaila|estómago|estómac|estomac', 'Digiere los alimentos|Digests food|Janaria digeritzen du|Dixire os alimentos|Digereix els aliments|Digère les aliments'],
    ['liver', 'hígado|liver|gibela|fígado|fetge|foie', 'Filtra la sangre y produce bilis|Filters blood and makes bile|Odola iragazten du eta behazuna sortzen du|Filtra o sangue e produce bile|Filtra la sang i produeix bilis|Filtre le sang et produit la bile'],
    ['kidneys', 'riñones|kidneys|giltzurrunak|riles|ronyons|reins', 'Filtran la sangre y producen orina|Filter blood and make urine|Odola iragazten dute eta gernua sortzen dute|Filtran o sangue e producen ouriña|Filtren la sang i produeixen orina|Filtrent le sang et produisent l\'urine'],
    ['smallint', 'intestino delgado|small intestine|heste mehea|intestino groso? delgado|intestí prim|intestin grêle', 'Absorbe los nutrientes|Absorbs nutrients|Mantenugaiak xurgatzen ditu|Absorbe os nutrientes|Absorbeix els nutrients|Absorbe les nutriments'],
    ['eyes', 'ojos|eyes|begiak|ollos|ulls|yeux', 'Permiten ver|Allow us to see|Ikusteko balio dute|Permiten ver|Permeten veure|Permettent de voir'],
    ['ears', 'oídos|ears|belarriak|oídos|oïdes|oreilles', 'Permiten oír|Allow us to hear|Entzuteko balio dute|Permiten oír|Permeten sentir|Permettent d\'entendre'],
    ['skin', 'piel|skin|azala|pel|pell|peau', 'Protege el cuerpo|Protects the body|Gorputza babesten du|Protexe o corpo|Protegeix el cos|Protège le corps'],
    ['muscles', 'músculos|muscles|muskuluak|músculos|músculs|muscles', 'Permiten el movimiento|Allow movement|Mugimendua ahalbidetzen dute|Permiten o movemento|Permeten el moviment|Permettent le mouvement'],
    ['bladder', 'vejiga|bladder|maskuria|vexiga|bufeta|vessie', 'Almacena la orina|Stores urine|Gernua gordetzen du|Almacena a ouriña|Emmagatzema l\'orina|Stocke l\'urine']
  ];
  organs[6][1] = 'intestino delgado|small intestine|heste mehea|intestino delgado|intestí prim|intestin grêle';
  var body = organs.map(function (o) {
    return { id: 'org_' + o[0], q: withPre(fpre, P(o[1])), a: P(o[2]), tag: 'organs' };
  });
  var bpre = L('Hueso:', 'Bone:', 'Hezurra:', 'Óso:', 'Os:', 'Os :');
  var bones = [
    ['skull', 'Protege el cerebro (cabeza)|Protects the brain (head)|Garuna babesten du (burua)|Protexe o cerebro (cabeza)|Protegeix el cervell (cap)|Protège le cerveau (tête)', 'cráneo|skull|garezurra|cranio|crani|crâne'],
    ['femur', 'El hueso más largo del cuerpo (muslo)|The longest bone in the body (thigh)|Gorputzeko hezurrik luzeena (izterra)|O óso máis longo do corpo (coxa)|L\'os més llarg del cos (cuixa)|L\'os le plus long du corps (cuisse)', 'fémur|femur|femurra|fémur|fèmur|fémur'],
    ['ribs', 'Protegen el corazón y los pulmones|Protect the heart and lungs|Bihotza eta birikak babesten dituzte|Protexen o corazón e os pulmóns|Protegeixen el cor i els pulmons|Protègent le cœur et les poumons', 'costillas|ribs|saihetsezurrak|costelas|costelles|côtes'],
    ['spine', 'Sostiene el cuerpo y protege la médula|Supports the body and protects the spinal cord|Gorputza eusten du eta bizkarrezur-muina babesten du|Sostén o corpo e protexe a medula|Sosté el cos i protegeix la medul·la|Soutient le corps et protège la moelle épinière', 'columna vertebral|spine|bizkarrezurra|columna vertebral|columna vertebral|colonne vertébrale'],
    ['patella', 'Hueso pequeño delante de la rodilla|Small bone in front of the knee|Belaunaren aurreko hezur txikia|Óso pequeno diante do xeonllo|Os petit al davant del genoll|Petit os devant le genou', 'rótula|kneecap|belauneko ezpala|rótula|ròtula|rotule'],
    ['humerus', 'Hueso del brazo (entre hombro y codo)|Bone of the upper arm (shoulder to elbow)|Besoaren hezurra (sorbaldatik ukondora)|Óso do brazo (entre ombreiro e cóbado)|Os del braç (entre espatlla i colze)|Os du bras (entre l\'épaule et le coude)', 'húmero|humerus|humeroa|húmero|húmer|humérus'],
    ['tibia', 'Hueso principal de la parte baja de la pierna|Main bone of the lower leg|Hanka beheko hezur nagusia|Óso principal da parte baixa da perna|Os principal de la part baixa de la cama|Os principal du bas de la jambe', 'tibia|tibia|tibia|tibia|tíbia|tibia'],
    ['sternum', 'Hueso plano en el centro del pecho|Flat bone in the centre of the chest|Bularreko erdiko hezur lauan|Óso plano no centro do peito|Os pla al centre del pit|Os plat au centre de la poitrine', 'esternón|sternum|bularrezurra|esternón|estèrnum|sternum'],
    ['jaw', 'Único hueso móvil de la cara|The only movable bone of the face|Aurpegiko hezur higikor bakarra|Único óso móbil da cara|Únic os mòbil de la cara|Seul os mobile du visage', 'mandíbula|jaw|masailezurra|mandíbula|mandíbula|mandibule'],
    ['clavicle', 'Hueso que une el hombro con el esternón|Bone joining the shoulder to the sternum|Sorbalda bularrezurrarekin lotzen duen hezurra|Óso que une o ombreiro co esternón|Os que uneix l\'espatlla amb l\'estèrnum|Os qui relie l\'épaule au sternum', 'clavícula|collarbone|lepauztaia|clavícula|clavícula|clavicule']
  ];
  bones.forEach(function (b) { body.push({ id: 'bone_' + b[0], q: P(b[1]), a: P(b[2]), tag: 'bones' }); });
  D.push({
    id: 'science-human-body', icon: '🫀',
    title: L('El cuerpo humano', 'The human body', 'Giza gorputza', 'O corpo humano', 'El cos humà', 'Le corps humain'),
    desc: L('Órganos, funciones y huesos principales', 'Organs, functions and main bones', 'Organoak, funtzioak eta hezur nagusiak', 'Órganos, funcións e ósos principais', 'Òrgans, funcions i ossos principals', 'Organes, fonctions et principaux os'),
    age: '8+', cards: body
  });

  // ---------- 4. Physics and chemistry ----------
  var phy = [];
  function f(id, q, a, tag) { phy.push({ id: id, q: P(q), a: typeof a === 'string' && a.indexOf('|') > -1 ? P(a) : a, tag: tag }); }
  f('u_force', 'Unidad de fuerza|Unit of force|Indarraren unitatea|Unidade de forza|Unitat de força|Unité de force', 'newton', 'units');
  f('u_energy', 'Unidad de energía|Unit of energy|Energiaren unitatea|Unidade de enerxía|Unitat d\'energia|Unité d\'énergie', 'julio|joule|joule|xulio|joule|joule', 'units');
  f('u_power', 'Unidad de potencia|Unit of power|Potentziaren unitatea|Unidade de potencia|Unitat de potència|Unité de puissance', 'vatio|watt|watt|vatio|watt|watt', 'units');
  f('u_current', 'Unidad de corriente eléctrica|Unit of electric current|Korronte elektrikoaren unitatea|Unidade de corrente eléctrica|Unitat de corrent elèctric|Unité de courant électrique', 'amperio|ampere|ampere|amperio|ampere|ampère', 'units');
  f('u_resist', 'Unidad de resistencia eléctrica|Unit of electrical resistance|Erresistentzia elektrikoaren unitatea|Unidade de resistencia eléctrica|Unitat de resistència elèctrica|Unité de résistance électrique', 'ohmio|ohm|ohm|ohmio|ohm|ohm', 'units');
  f('u_freq', 'Unidad de frecuencia|Unit of frequency|Maiztasunaren unitatea|Unidade de frecuencia|Unitat de freqüència|Unité de fréquence', 'hercio|hertz|hertz|hertz|hertz|hertz', 'units');
  f('u_press', 'Unidad de presión en el SI|SI unit of pressure|Presioaren SI unitatea|Unidade de presión no SI|Unitat de pressió en el SI|Unité de pression du SI', 'pascal', 'units');
  f('u_temp', 'Unidad de temperatura en el SI|SI unit of temperature|Tenperaturaren SI unitatea|Unidade de temperatura no SI|Unitat de temperatura en el SI|Unité de température du SI', 'kelvin', 'units');
  f('u_mass', 'Unidad de masa en el SI|SI unit of mass|Masaren SI unitatea|Unidade de masa no SI|Unitat de massa en el SI|Unité de masse du SI', 'kilogramo|kilogram|kilogramoa|quilogramo|quilogram|kilogramme', 'units');
  f('u_len', 'Unidad de longitud en el SI|SI unit of length|Luzeraren SI unitatea|Unidade de lonxitude no SI|Unitat de longitud en el SI|Unité de longueur du SI', 'metro|metre|metroa|metro|metre|mètre', 'units');
  f('u_time', 'Unidad de tiempo en el SI|SI unit of time|Denboraren SI unitatea|Unidade de tempo no SI|Unitat de temps en el SI|Unité de temps du SI', 'segundo|second|segundoa|segundo|segon|seconde', 'units');
  f('c_water', 'Fórmula química del agua|Chemical formula of water|Uraren formula kimikoa|Fórmula química da auga|Fórmula química de l\'aigua|Formule chimique de l\'eau', 'H₂O', 'chem');
  f('c_co2', 'Nombre de la fórmula CO₂|Name of the formula CO₂|CO₂ formularen izena|Nome da fórmula CO₂|Nom de la fórmula CO₂|Nom de la formule CO₂', 'dióxido de carbono|carbon dioxide|karbono dioxidoa|dióxido de carbono|diòxid de carboni|dioxyde de carbone', 'chem');
  f('c_nacl', 'Nombre de la fórmula NaCl|Name of the formula NaCl|NaCl formularen izena|Nome da fórmula NaCl|Nom de la fórmula NaCl|Nom de la formule NaCl', 'sal común|table salt|gatz arrunta|sal común|sal comuna|sel de table', 'chem');
  f('c_ch4', 'Nombre de la fórmula CH₄|Name of the formula CH₄|CH₄ formularen izena|Nome da fórmula CH₄|Nom de la fórmula CH₄|Nom de la formule CH₄', 'metano|methane|metanoa|metano|metà|méthane', 'chem');
  f('c_ph', 'pH del agua neutra|pH of neutral water|Ur neutroaren pH-a|pH da auga neutra|pH de l\'aigua neutra|pH de l\'eau neutre', '7', 'chem');
  f('c_air', 'Gas más abundante del aire|Most abundant gas in air|Airean gas ugariena|Gas máis abundante do aire|Gas més abundant de l\'aire|Gaz le plus abondant de l\'air', 'nitrógeno|nitrogen|nitrogenoa|nitróxeno|nitrogen|azote', 'chem');
  f('p_boil', 'Punto de ebullición del agua (°C)|Boiling point of water (°C)|Uraren irakite-puntua (°C)|Punto de ebulición da auga (°C)|Punt d\'ebullició de l\'aigua (°C)|Point d\'ébullition de l\'eau (°C)', '100', 'physics');
  f('p_freeze', 'Punto de congelación del agua (°C)|Freezing point of water (°C)|Uraren izozte-puntua (°C)|Punto de conxelación da auga (°C)|Punt de congelació de l\'aigua (°C)|Point de congélation de l\'eau (°C)', '0', 'physics');
  f('p_abs0', 'Cero absoluto en grados Celsius|Absolute zero in degrees Celsius|Zero absolutua Celsius graduetan|Cero absoluto en graos Celsius|Zero absolut en graus Celsius|Zéro absolu en degrés Celsius', '-273', 'physics');
  f('p_light', 'Velocidad de la luz (km/s, aprox.)|Speed of light (km/s, approx.)|Argiaren abiadura (km/s, gutxi gorabehera)|Velocidade da luz (km/s, aprox.)|Velocitat de la llum (km/s, aprox.)|Vitesse de la lumière (km/s, environ)', '300000', 'physics');
  f('p_g', 'Gravedad en la Tierra (m/s², aprox.)|Gravity on Earth (m/s², approx.)|Grabitatea Lurrean (m/s², gutxi gorabehera)|Gravidade na Terra (m/s², aprox.)|Gravetat a la Terra (m/s², aprox.)|Gravité sur Terre (m/s², environ)', '9,8', 'physics');
  f('p_e', 'Partícula con carga negativa|Particle with negative charge|Karga negatiboa duen partikula|Partícula con carga negativa|Partícula amb càrrega negativa|Particule de charge négative', 'electrón|electron|elektroia|electrón|electró|électron', 'physics');
  f('p_p', 'Partícula con carga positiva|Particle with positive charge|Karga positiboa duen partikula|Partícula con carga positiva|Partícula amb càrrega positiva|Particule de charge positive', 'protón|proton|protoia|protón|protó|proton', 'physics');
  f('p_n', 'Partícula sin carga en el núcleo|Uncharged particle in the nucleus|Nukleoko karga gabeko partikula|Partícula sen carga no núcleo|Partícula sense càrrega al nucli|Particule sans charge dans le noyau', 'neutrón|neutron|neutroia|neutrón|neutró|neutron', 'physics');
  f('s_evap', 'Cambio de estado de líquido a gas|State change from liquid to gas|Likidotik gasera egoera-aldaketa|Cambio de estado de líquido a gas|Canvi d\'estat de líquid a gas|Changement d\'état du liquide au gaz', 'evaporación|evaporation|lurruntzea|evaporación|evaporació|évaporation', 'states');
  f('s_melt', 'Cambio de estado de sólido a líquido|State change from solid to liquid|Solidotik likidora egoera-aldaketa|Cambio de estado de sólido a líquido|Canvi d\'estat de sòlid a líquid|Changement d\'état du solide au liquide', 'fusión|melting|fusioa|fusión|fusió|fusion', 'states');
  f('s_cond', 'Cambio de estado de gas a líquido|State change from gas to liquid|Gasetik likidora egoera-aldaketa|Cambio de estado de gas a líquido|Canvi d\'estat de gas a líquid|Changement d\'état du gaz au liquide', 'condensación|condensation|kondentsazioa|condensación|condensació|condensation', 'states');
  f('s_solid', 'Cambio de estado de líquido a sólido|State change from liquid to solid|Likidotik solidora egoera-aldaketa|Cambio de estado de líquido a sólido|Canvi d\'estat de líquid a sòlid|Changement d\'état du liquide au solide', 'solidificación|solidification|solidifikazioa|solidificación|solidificació|solidification', 'states');
  f('b_photo', 'Proceso por el que las plantas fabrican su alimento|Process by which plants make their food|Landareek bere janaria egiteko prozesua|Proceso polo que as plantas fabrican o seu alimento|Procés pel qual les plantes fabriquen el seu aliment|Processus par lequel les plantes fabriquent leur nourriture', 'fotosíntesis|photosynthesis|fotosintesia|fotosíntese|fotosíntesi|photosynthèse', 'bio');
  f('b_gas', 'Gas que absorben las plantas en la fotosíntesis|Gas absorbed by plants in photosynthesis|Landareek fotosintesian xurgatzen duten gasa|Gas que absorben as plantas na fotosíntese|Gas que absorbeixen les plantes en la fotosíntesi|Gaz absorbé par les plantes lors de la photosynthèse', 'dióxido de carbono|carbon dioxide|karbono dioxidoa|dióxido de carbono|diòxid de carboni|dioxyde de carbone', 'bio');
  D.push({
    id: 'science-physics-chemistry', icon: '🔬',
    title: L('Física y química básicas', 'Basic physics and chemistry', 'Oinarrizko fisika eta kimika', 'Física e química básicas', 'Física i química bàsiques', 'Physique et chimie de base'),
    desc: L('Unidades, fórmulas, partículas y cambios de estado', 'Units, formulas, particles and state changes', 'Unitateak, formulak, partikulak eta egoera-aldaketak', 'Unidades, fórmulas, partículas e cambios de estado', 'Unitats, fórmules, partícules i canvis d\'estat', 'Unités, formules, particules et changements d\'état'),
    age: '10+', cards: phy
  });

  // ---------- 5. Animal classification ----------
  var cls = {
    M: P('mamífero|mammal|ugaztuna|mamífero|mamífer|mammifère'), B: P('ave|bird|hegaztia|ave|ocell|oiseau'), R: P('reptil|reptile|narrastia|réptil|rèptil|reptile'),
    A: P('anfibio|amphibian|anfibioa|anfibio|amfibi|amphibien'), F: P('pez|fish|arraina|peixe|peix|poisson'), I: P('insecto|insect|intsektua|insecto|insecte|insecte'),
    X: P('arácnido|arachnid|araknidoa|arácnido|aràcnid|arachnide')
  };
  var animals = [
    'M|ballena|whale|balea|balea|balena|baleine', 'M|delfín|dolphin|izurdea|golfiño|dofí|dauphin', 'M|murciélago|bat|saguzarra|morcego|ratpenat|chauve-souris',
    'M|elefante|elephant|elefantea|elefante|elefant|éléphant', 'M|canguro|kangaroo|kanguroa|canguro|cangur|kangourou', 'M|gato|cat|katua|gato|gat|chat',
    'M|vaca|cow|behia|vaca|vaca|vache', 'M|foca|seal|zigilua|foca|foca|phoque',
    'B|águila|eagle|arranoa|aguia|àguila|aigle', 'B|pingüino|penguin|pinguinoa|pingüín|pingüí|manchot', 'B|gallina|hen|oiloa|galiña|gallina|poule',
    'B|búho|owl|hontza|moucho|mussol|hibou', 'B|loro|parrot|loroa|loro|lloro|perroquet', 'B|avestruz|ostrich|ostruka|avestruz|estruç|autruche', 'B|cigüeña|stork|zikoina|cegoña|cigonya|cigogne',
    'R|serpiente|snake|sugea|serpe|serp|serpent', 'R|cocodrilo|crocodile|krokodiloa|crocodilo|cocodril|crocodile', 'R|tortuga|turtle|dortoka|tartaruga|tortuga|tortue',
    'R|lagarto|lizard|musker|lagarto|llangardaix|lézard', 'R|camaleón|chameleon|kameleoia|camaleón|camaleó|caméléon',
    'A|rana|frog|igela|ra|granota|grenouille', 'A|sapo|toad|apoa|sapo|gripau|crapaud', 'A|salamandra|salamander|salamandra|salamandra|salamandra|salamandre',
    'F|tiburón|shark|marrazoa|tiburón|tauró|requin', 'F|atún|tuna|hegaluzea|atún|tonyina|thon', 'F|salmón|salmon|izokina|salmón|salmó|saumon',
    'F|sardina|sardine|sardina|sardiña|sardina|sardine', 'F|trucha|trout|amuarraina|troita|truita|truite', 'F|caballito de mar|seahorse|itsas zaldia|cabaliño de mar|cavallet de mar|hippocampe',
    'I|mariposa|butterfly|tximeleta|bolboreta|papallona|papillon', 'I|abeja|bee|erlea|abella|abella|abeille', 'I|hormiga|ant|inurria|formiga|formiga|fourmi',
    'I|mosca|fly|euli|mosca|mosca|mouche', 'I|mosquito|mosquito|eltxoa|mosquito|mosquit|moustique', 'I|escarabajo|beetle|kakalardoa|escaravello|escarabat|scarabée',
    'X|araña|spider|armiarma|araña|aranya|araignée', 'X|escorpión|scorpion|eskorpioa|escorpión|escorpí|scorpion'
  ];
  var apre = L('Clase de animal:', 'Animal class:', 'Animalia-taldea:', 'Clase de animal:', 'Classe d\'animal:', 'Classe animale :');
  var cardsA = animals.map(function (r) {
    var p = r.split('|');
    var name = L(p[1], p[2], p[3], p[4], p[5], p[6]);
    var others = Object.keys(cls).filter(function (k) { return k !== p[0]; });
    var picks = [others[(p[1].length) % 6], others[(p[1].length + 2) % 6], others[(p[1].length + 4) % 6]];
    var seen = {}; picks = picks.filter(function (k) { if (seen[k]) return false; seen[k] = 1; return true; });
    return { id: 'an_' + p[2].replace(/[^a-z]/gi, ''), q: withPre(apre, name), a: cls[p[0]], opts: picks.map(function (k) { return cls[k]; }), tag: 'classification' };
  });
  D.push({
    id: 'science-animal-classes', icon: '🦎',
    title: L('Clasificación de animales', 'Animal classification', 'Animalien sailkapena', 'Clasificación de animais', 'Classificació d\'animals', 'Classification des animaux'),
    desc: L('Mamífero, ave, reptil, anfibio, pez, insecto o arácnido', 'Mammal, bird, reptile, amphibian, fish, insect or arachnid', 'Ugaztuna, hegaztia, narrastia, anfibioa, arraina, intsektua edo araknidoa', 'Mamífero, ave, réptil, anfibio, peixe, insecto ou arácnido', 'Mamífer, ocell, rèptil, amfibi, peix, insecte o aràcnid', 'Mammifère, oiseau, reptile, amphibien, poisson, insecte ou arachnide'),
    age: '6+', cards: cardsA
  });
  // ---------- 6. Plants ----------
  var plants = [
    ['root', 'raíz|root|sustraia|raíz|arrel|racine', 'Absorbe agua y sales|Absorbs water and minerals|Ura eta gatz mineralak xurgatzen ditu|Absorbe auga e sales minerais|Absorbeix aigua i sals minerals|Absorbe l\'eau et les sels minéraux'],
    ['stem', 'tallo|stem|zurtoina|talo|tija|tige', 'Sostiene la planta y lleva la savia|Supports the plant and carries sap|Landarea eusten du eta izerdia garraiatzen du|Sostén a planta e leva a savia|Sosté la planta i porta la saba|Soutient la plante et transporte la sève'],
    ['leaf', 'hoja|leaf|hostoa|folla|fulla|feuille', 'Hace la fotosíntesis|Does photosynthesis|Fotosintesia egiten du|Fai a fotosíntese|Fa la fotosíntesi|Fait la photosynthèse'],
    ['flower', 'flor|flower|lorea|flor|flor|fleur', 'Se encarga de la reproducción|Takes care of reproduction|Ugalketaz arduratzen da|Encárgase da reprodución|S\'encarrega de la reproducció|Assure la reproduction'],
    ['fruit', 'fruto|fruit|fruitua|froito|fruit|fruit', 'Protege y dispersa las semillas|Protects and spreads the seeds|Haziak babesten eta sakabanatzen ditu|Protexe e dispersa as sementes|Protegeix i dispersa les llavors|Protège et disperse les graines'],
    ['seed', 'semilla|seed|hazia|semente|llavor|graine', 'Origina una nueva planta|Grows into a new plant|Landare berri bat sortzen du|Orixina unha nova planta|Origina una nova planta|Donne une nouvelle plante']
  ].map(function (o) { return { id: 'pt_' + o[0], q: withPre(fpre, P(o[1])), a: P(o[2]), tag: 'plants' }; });
  D.push({
    id: 'science-plants', icon: '🌱',
    title: L('Partes de las plantas', 'Parts of plants', 'Landareen atalak', 'Partes das plantas', 'Parts de les plantes', 'Parties des plantes'),
    desc: L('Qué hace cada parte de una planta', 'What each part of a plant does', 'Landare baten atal bakoitzak zer egiten duen', 'Que fai cada parte dunha planta', 'Què fa cada part d\'una planta', 'Ce que fait chaque partie d\'une plante'),
    age: '6+', cards: plants
  });
})();
