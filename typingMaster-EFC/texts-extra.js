/**
 * TypeMaster - Extra corpus
 *  - TYPING_EXTRA: texts for Galician, Catalan and French (levels 2-10) plus the new
 *    levels 11 (tongue twisters, per language) and 12 (code and symbols, language-agnostic).
 *  - TYPING_KID: short, friendly texts for the "6-8 years" profile at levels 8-10, all 6 languages.
 * Texts avoid characters that are hard to type on a Spanish keyboard unless the level is about accents.
 */
const TYPING_EXTRA = {
    2: {
        'gl-ES': ['a casa e grande e bonita', 'o sol brilla no ceo azul', 'o meu can durme na cama', 'hai un gato no xardin', 'o mar e azul e fondo'],
        'ca-ES': ['la casa es gran i bonica', 'el sol brilla al cel blau', 'el meu gat dorm al llit', "hi ha un ocell a l'arbre", 'el mar es blau i fons'],
        'fr-FR': ['la maison est grande et jolie', 'le soleil brille dans le ciel', 'mon chat dort sur le lit', "il y a un oiseau dans l'arbre", 'la mer est bleue et profonde'],
    },
    3: {
        'gl-ES': ['o neno xoga co seu balon vermello no parque.', 'a miña avoa fai un bolo moi bo para a merenda.', 'os paxaros cantan cando sae o sol cada dia.', 'hoxe imos de excursion ao monte con toda a familia.'],
        'ca-ES': ['el nen juga amb la seva pilota vermella al parc.', "l'avia fa un pastís molt bo per berenar.", 'els ocells canten quan surt el sol cada dia.', 'avui anem de excursio a la muntanya amb la familia.'],
        'fr-FR': ['le garcon joue avec son ballon rouge dans le parc.', 'ma grand-mere fait un gateau tres bon pour le gouter.', 'les oiseaux chantent quand le soleil se leve.', "aujourd'hui nous allons au bois avec toute la famille."],
    },
    4: {
        'gl-ES': ['Galicia e unha terra moi verde do noroeste.', 'Ola, chamome Xoan e teño dez anos.', 'Lugo e Ourense son cidades do interior de Galicia.', 'Vigo ten unha ria grande chea de barcos.'],
        'ca-ES': ['Catalunya es una terra amb mar i muntanya.', 'Hola, em dic Marta i tinc deu anys.', 'Barcelona i Girona son ciutats molt boniques.', "Tarragona te unes ruines romanes davant del mar."],
        'fr-FR': ["La France est un pays d'Europe tres visite.", "Bonjour, je m'appelle Lucas et j'ai dix ans.", 'Paris et Lyon sont des villes tres grandes.', 'La Loire est le plus long fleuve de France.'],
    },
    5: {
        'gl-ES': ['Hoxe e dia 15 e son as 9 da noite.', 'Teño 3 primos e 2 gatos, somos 5 en total!', 'Cantos anos tes? Eu teño 10.', 'Na tenda: 4 mazas, 6 peras e 12 laranxas.'],
        'ca-ES': ['Avui es dia 15 i son les 9 del vespre.', 'Tinc 3 cosins i 2 gats, som 5 en total!', 'Quants anys tens? Jo en tinc 10.', 'A la botiga: 4 pomes, 6 peres i 12 taronges.'],
        'fr-FR': ["Aujourd'hui c'est le 15 et il est 9 heures du soir.", "J'ai 3 cousins et 2 chats, nous sommes 5 en tout !", "Quel age as-tu ? Moi, j'ai 10 ans.", 'Au marche : 4 pommes, 6 poires et 12 oranges.'],
    },
    6: {
        'gl-ES': ['O pingüín pasea pola praia á hora do almorzo.', 'Á noite miro o ceo e vexo moitas estrelas.', 'A miña irmá canta unha canción de Rosalía.', 'Mañá collemos o tren cara a Santiago.'],
        'ca-ES': ['Els nens juguen a la plaça després de dinar.', 'Aquesta nit mirem les estrelles des de la muntanya.', 'La meva germana canta una cançó molt bonica.', "El teu avi va a l'hort cada matí."],
        'fr-FR': ["L'été prochain nous irons à la montagne en famille.", 'Ma soeur préfère le thé, mais moi, le café.', 'Le garçon écoute une chanson très célèbre.', 'À la fête, nous avons mangé un gâteau délicieux.'],
    },
    7: {
        'gl-ES': ['Cando era pequena, ía á praia todos os veráns coa miña familia e collía cunchas.', 'O libro que lín onte falaba dun neno que descubre un mundo máxico debaixo do mar.', 'Aprender a escribir rápido axúdame a facer os deberes en menos tempo.'],
        'ca-ES': ["Quan era petit, anava a la platja cada estiu amb la meva família i recollia petxines.", "El llibre que vaig llegir ahir parlava d'un nen que descobreix un món màgic sota el mar.", 'Aprendre a escriure rapid em permet fer els deures en menys temps.'],
        'fr-FR': ["Quand j'étais petit, j'allais à la plage chaque été avec ma famille et je ramassais des coquillages.", "Le livre que j'ai lu hier parlait d'un enfant qui découvre un monde magique sous la mer.", "Apprendre à taper vite m'aide à faire mes devoirs en moins de temps."],
    },
    8: {
        'gl-ES': ['Cada mañan colle a bicicleta, vai polo carreiro do bosque e chega ao colexio con moita enerxia.', 'A biblioteca do barrio ten libros de aventuras, de ciencia e de historia para todas as idades.'],
        'ca-ES': ["Cada mati agafa la bicicleta, va pel cami del bosc i arriba a l'escola amb molta energia.", "La biblioteca del barri te llibres d'aventures, de ciencia i d'historia per a totes les edats."],
        'fr-FR': ["Chaque matin, elle prend son velo, suit le sentier de la foret et arrive a l'ecole pleine d'energie.", "La bibliotheque du quartier propose des livres d'aventures, de sciences et d'histoire pour tous les ages."],
    },
    9: {
        'gl-ES': ['Practicar mecanografia todos os dias, aínda que sexan dez minutos, é a mellor maneira de ganar velocidade. Pouco a pouco os dedos aprenden onde está cada letra e xa non hai que mirar o teclado.', 'Os exploradores do mar descubriron que o fondo oceanico garda montañas, vales e animais que nunca viron a luz do sol, e aínda queda moito por descubrir.'],
        'ca-ES': ["Practicar mecanografia cada dia, encara que siguin deu minuts, es la millor manera de guanyar velocitat. A poc a poc els dits aprenen on es cada lletra i ja no cal mirar el teclat.", "Els exploradors del mar han descobert que el fons oceanic guarda muntanyes, valls i animals que mai no han vist la llum del sol, i encara queda molt per descobrir."],
        'fr-FR': ["S'entrainer a taper chaque jour, meme dix minutes, est la meilleure facon de gagner en vitesse. Peu a peu, les doigts apprennent ou se trouve chaque lettre et il n'est plus necessaire de regarder le clavier.", "Les explorateurs de la mer ont decouvert que le fond de l'ocean cache des montagnes, des vallees et des animaux qui n'ont jamais vu la lumiere du soleil, et il reste beaucoup a decouvrir."],
    },
    10: {
        'gl-ES': ['A lingua galega naceu hai moitos séculos no noroeste da Península Ibérica e hoxe fálana máis de dous millóns de persoas. Ten unha música moi propia, cantigas medievais famosas e unha literatura que vai desde Rosalía de Castro ata os autores máis novos. Escribila ben sen mirar o teclado é todo un reto.', 'Un bo mecanógrafo non mira as teclas, le o texto por palabras completas e mantén un ritmo constante sen apresurarse. Cando erra, non se detén: segue adiante, corrixe se fai falta e respira. A precisión sempre vén antes que a velocidade, e a velocidade chega soa co tempo.'],
        'ca-ES': ["La llengua catalana va neixer fa molts segles i avui la parlen milions de persones a Catalunya, Valencia, les Illes Balears, Andorra i altres territoris. Te una musicalitat propia, una literatura rica i moltes paraules boniques. Escriure-la be sense mirar el teclat es tot un repte.", "Un bon mecanograf no mira les tecles, llegeix el text per paraules senceres i manté un ritme constant sense afanyar-se. Quan s'equivoca, no s'atura: continua endavant, corregeix si cal i respira. La precisio sempre va abans que la velocitat, i la velocitat arriba sola amb el temps."],
        'fr-FR': ["La langue francaise s'est formee il y a de nombreux siecles et elle est aujourd'hui parlee sur les cinq continents par des centaines de millions de personnes. Elle possede une grande litterature, des mots tres elegants et une musique bien a elle. L'ecrire correctement sans regarder le clavier est un vrai defi.", "Un bon dactylo ne regarde pas les touches, il lit le texte par mots entiers et garde un rythme regulier sans se presser. Quand il se trompe, il ne s'arrete pas : il continue, corrige si besoin et respire. La precision passe toujours avant la vitesse, et la vitesse vient toute seule avec le temps."],
    },
    // New level 11: tongue twisters
    11: {
        'es-ES': ['Tres tristes tigres tragaban trigo en un trigal.', 'Pablito clavo un clavito, que clavito clavo Pablito.', 'Pepe Pecas pica papas con un pico, con un pico pica papas Pepe Pecas.', 'El cielo esta enladrillado, quien lo desenladrillara?'],
        'en-US': ['She sells seashells by the seashore.', 'Peter Piper picked a peck of pickled peppers.', 'How much wood would a woodchuck chuck if a woodchuck could chuck wood?', 'Fuzzy Wuzzy was a bear, Fuzzy Wuzzy had no hair.'],
        'eu-ES': ['Txakur txiki txuri txintxo bat txapel txikia jantzita.', 'Bi bizkaitar bizkor bi bizikleta berrirekin bidean.', 'Zazpi zapatari zaharrek zazpi zapata zahar konpondu zituzten.', 'Sagar zuri samur bat zuhaitz zaharraren azpian zegoen.'],
        'gl-ES': ['Un tigre, dous tigres, tres tigres tristes tragaban trigo.', 'O rato roeu a roupa do rei de Roma.', 'Cantos cantos cantan as cantareiras cando cantan cantos.', 'Pablo pequeno pousou o pe no pao pequeno.'],
        'ca-ES': ["Setze jutges d'un jutjat mengen fetge d'un penjat.", 'Tres tristos tigres mengen blat en un camp de blat.', 'Pere Parrot pinta pals, pinta pals Pere Parrot.', 'Un gat gros i gras gaudeix de la gatera gran.'],
        'fr-FR': ['Un chasseur sachant chasser doit savoir chasser sans son chien.', "Les chaussettes de l'archiduchesse sont-elles seches, archiseches ?", 'Gros gras grand grain d orge, quand te dagrogragraindorgeras-tu ?', 'Je veux et j exige d exquises excuses.'],
    },
    // New level 12: code and symbols (language-agnostic)
    12: {
        all: [
            'const total = items.filter(x => x.ok).length;',
            'for (let i = 0; i < 10; i++) { sum += i * 2; }',
            'if (score >= 100 && !done) { alert("ok"); }',
            '<div class="box"><p>Hello world</p></div>',
            'SELECT name, age FROM users WHERE age > 18;',
            'let user = { id: 7, tags: ["a", "b"], active: true };',
            'git commit -m "fix: update styles" && git push',
            'email = name + "@" + domain; // 100% free #1',
        ],
    },
};

const TYPING_KID = {
    8: {
        'es-ES': ['Mi perro Toby corre por el parque y juega con la pelota amarilla.'],
        'en-US': ['My dog Toby runs in the park and plays with the yellow ball.'],
        'eu-ES': ['Nire Toby txakurra parkean korrika dabil eta pilota horiarekin jolasten du.'],
        'gl-ES': ['O meu can Toby corre polo parque e xoga coa pelota amarela.'],
        'ca-ES': ['El meu gos Toby corre pel parc i juga amb la pilota groga.'],
        'fr-FR': ['Mon chien Toby court dans le parc et joue avec la balle jaune.'],
    },
    9: {
        'es-ES': ['Por la tarde voy al parque con mis amigos, jugamos al escondite y luego merendamos pan con chocolate.'],
        'en-US': ['In the afternoon I go to the park with my friends, we play hide and seek and then we eat bread with chocolate.'],
        'eu-ES': ['Arratsaldean parkera joaten naiz nire lagunekin, ezkutaketan jolasten dugu eta gero ogia txokolatearekin jaten dugu.'],
        'gl-ES': ['Pola tarde vou ao parque cos meus amigos, xogamos ao agocho e logo merendamos pan con chocolate.'],
        'ca-ES': ['A la tarda vaig al parc amb els meus amics, juguem a fet i amagar i despres berenem pa amb xocolata.'],
        'fr-FR': ['Le soir, je vais au parc avec mes amis, nous jouons a cache-cache et ensuite nous goutons du pain au chocolat.'],
    },
    10: {
        'es-ES': ['El domingo fuimos a la playa con toda la familia, construimos un castillo de arena enorme y comimos helado mientras veíamos los barcos.'],
        'en-US': ['On Sunday we went to the beach with the whole family, we built a huge sandcastle and ate ice cream while we watched the boats.'],
        'eu-ES': ['Igandean hondartzara joan ginen familia osoarekin, harearekin gazteluak eraiki genituen eta izozkia jan genuen itsasontziak ikusten genituen bitartean.'],
        'gl-ES': ['O domingo fomos á praia con toda a familia, construímos un castelo de area enorme e comemos xeado mentres mirabamos os barcos.'],
        'ca-ES': ['El diumenge vam anar a la platja amb tota la familia, vam construir un castell de sorra enorme i vam menjar gelat mentre miravem els vaixells.'],
        'fr-FR': ["Dimanche, nous sommes alles a la plage en famille, nous avons construit un enorme chateau de sable et mange une glace en regardant les bateaux."],
    },
};
