/**
 * GeoQuiz - Game Logic
 * Atlas mode: browse all geographic data
 * Quiz mode: multiple-choice questions by difficulty level
 */

const GeoQuiz = (() => {
    // ── State ──────────────────────────────────────────────────────────────
    // Convert platform lang code (es-ES) to short code (es)
    function platformLang() {
        const pl = (typeof PlatformI18n !== 'undefined' && PlatformI18n.currentLanguage)
            ? PlatformI18n.currentLanguage : 'es-ES';
        const code = pl.slice(0, 2).toLowerCase();
        return ['es', 'en', 'eu', 'gl', 'ca', 'fr'].includes(code) ? code : 'es';
    }

    const state = {
        lang: 'es',  // set properly in init()
        screen: 'home',           // home | atlas | quiz-setup | quiz | results
        atlasTab: 'world',        // world | spain | euskadi
        atlasSubTab: 'countries', // countries | rivers | mountains | comunidades | provincias | territories | munis
        quizLevel: 1,
        quizMode: 'classic',      // classic | flags | capitals | continents
        quizDiff: 'normal',       // easy | normal | hard (seconds per question)
        quizQuestions: [],
        quizIndex: 0,
        quizScore: 0,
        quizCorrect: 0,
        quizStart: 0,
        timerInterval: null,
        timerSecs: 15,
        timerLeft: 15,
        answered: false,
        searchQuery: '',
    };

    // ── i18n ───────────────────────────────────────────────────────────────
    const I18N = {
        es: {
            appName: 'GeoQuiz',
            subtitle: 'Conoce el mundo, España y Euskadi',
            atlasMode: 'Atlas',
            atlasDesc: 'Explora toda la información',
            quizMode: 'Quiz',
            quizDesc: 'Responde preguntas y gana puntos',
            world: 'Mundial', spain: 'España', euskadi: 'Euskadi',
            countries: 'Países', rivers: 'Ríos', mountains: 'Montañas',
            comunidades: 'CC.AA.', provincias: 'Provincias',
            territories: 'Territorios', munis: 'Municipios',
            search: 'Buscar...',
            level: 'Nivel', selectLevel: 'Selecciona nivel',
            start: 'Empezar', playAgain: 'Repetir', home: 'Inicio',
            question: 'Pregunta',
            correct: '¡Correcto!', wrong: 'Incorrecto',
            results: '¡Resultados!',
            pts: 'pts', correct_lbl: 'Correctas', time_lbl: 'Tiempo',
            capital_q: '¿Cuál es la capital de',
            country_q: '¿De qué país es capital',
            continent_q: '¿En qué continente está',
            km_q: '¿Cuántos km tiene el río',
            height_q: '¿Cuál es la altura del',
            river_country_q: '¿En qué región está el río',
            territory_q: '¿En qué territorio está',
            flag_q: '¿De qué país es esta bandera?',
            capital_of: 'Capital de',
            back: '← Volver',
            lvl_desc: [
                '',
                'Países famosos y capitales conocidas',
                'Más países y capitales de Europa',
                'Capitales de América y Asia',
                'Ríos y montañas más famosos del mundo',
                'Comunidades autónomas de España',
                'Provincias de España y sus capitales',
                'Ríos y montañas de España',
                'Territorios y municipios de Euskadi',
                'Ríos y montañas de Euskadi',
                'Todo: repaso completo',
            ],
            stars0: 'Sigue practicando', stars1: 'Bien hecho', stars2: 'Excelente', stars3: '¡Perfecto!',
            modeTitle: 'Modo de juego', diffTitle: 'Dificultad (tiempo por pregunta)',
            mode_classic: 'Clásico', mode_flags: 'Banderas', mode_capitals: 'Capital a país', mode_continents: 'Continentes',
            mode_classic_d: 'Capitales, ríos, montañas, España y Euskadi en 10 niveles',
            mode_flags_d: 'Adivina el país por su bandera',
            mode_capitals_d: 'Te damos la capital, tú eliges el país',
            mode_continents_d: '¿En qué continente está cada país?',
            lvl_easy: 'Fácil', lvl_mid: 'Medio', lvl_hard: 'Difícil',
            lvl_easy_d: 'Países muy conocidos', lvl_mid_d: 'Más países de todo el mundo', lvl_hard_d: 'Todos los países, también los menos conocidos',
            diff_easy: 'Tranquilo', diff_normal: 'Normal', diff_hard: 'Rápido',
            seconds: 's', noResults: 'Sin resultados', notEnough: 'No hay suficientes preguntas para esta combinación todavía.',
            quitTitle: '¿Salir del quiz?', quitMsg: 'Se perderá el progreso actual.', quitCancel: 'Cancelar', quitOk: 'Salir',
            kbHint: 'Teclado: pulsa 1, 2, 3 o 4 para responder',
            c_eu: 'Europa', c_as: 'Asia', c_af: 'África', c_na: 'América del Norte', c_sa: 'América del Sur', c_am: 'América', c_oc: 'Oceanía', c_euas: 'Europa y Asia',
        },
        en: {
            appName: 'GeoQuiz',
            subtitle: 'Explore the world, Spain and Euskadi',
            atlasMode: 'Atlas',
            atlasDesc: 'Browse all information',
            quizMode: 'Quiz',
            quizDesc: 'Answer questions and earn points',
            world: 'World', spain: 'Spain', euskadi: 'Euskadi',
            countries: 'Countries', rivers: 'Rivers', mountains: 'Mountains',
            comunidades: 'Regions', provincias: 'Provinces',
            territories: 'Territories', munis: 'Municipalities',
            search: 'Search...',
            level: 'Level', selectLevel: 'Select level',
            start: 'Start', playAgain: 'Play again', home: 'Home',
            question: 'Question',
            correct: 'Correct!', wrong: 'Incorrect',
            results: 'Results!',
            pts: 'pts', correct_lbl: 'Correct', time_lbl: 'Time',
            capital_q: 'What is the capital of',
            country_q: 'Which country has the capital',
            continent_q: 'In which continent is',
            km_q: 'How many km is the',
            height_q: 'What is the height of',
            river_country_q: 'In which region is the river',
            territory_q: 'In which territory is',
            flag_q: 'Which country does this flag belong to?',
            capital_of: 'Capital of',
            back: '← Back',
            lvl_desc: [
                '',
                'Famous countries and capitals',
                'More countries and European capitals',
                'Americas and Asia capitals',
                'Famous rivers and mountains',
                'Autonomous communities of Spain',
                'Spanish provinces and capitals',
                'Spanish rivers and mountains',
                'Euskadi territories and municipalities',
                'Euskadi rivers and mountains',
                'Full review: everything',
            ],
            stars0: 'Keep practicing', stars1: 'Well done', stars2: 'Excellent', stars3: 'Perfect!',
            modeTitle: 'Game mode', diffTitle: 'Difficulty (time per question)',
            mode_classic: 'Classic', mode_flags: 'Flags', mode_capitals: 'Capital to country', mode_continents: 'Continents',
            mode_classic_d: 'Capitals, rivers, mountains, Spain and Euskadi in 10 levels',
            mode_flags_d: 'Guess the country from its flag',
            mode_capitals_d: 'We give you the capital, you pick the country',
            mode_continents_d: 'Which continent is each country in?',
            lvl_easy: 'Easy', lvl_mid: 'Medium', lvl_hard: 'Hard',
            lvl_easy_d: 'Very well-known countries', lvl_mid_d: 'More countries from all over the world', lvl_hard_d: 'Every country, including the lesser known',
            diff_easy: 'Relaxed', diff_normal: 'Normal', diff_hard: 'Fast',
            seconds: 's', noResults: 'No results', notEnough: 'Not enough questions for this combination yet.',
            quitTitle: 'Quit the quiz?', quitMsg: 'Current progress will be lost.', quitCancel: 'Cancel', quitOk: 'Quit',
            kbHint: 'Keyboard: press 1, 2, 3 or 4 to answer',
            c_eu: 'Europe', c_as: 'Asia', c_af: 'Africa', c_na: 'North America', c_sa: 'South America', c_am: 'America', c_oc: 'Oceania', c_euas: 'Europe and Asia',
        },
        eu: {
            appName: 'GeoQuiz',
            subtitle: 'Ezagutu mundua, Espainia eta Euskadi',
            atlasMode: 'Atlasa',
            atlasDesc: 'Informazio guztia ikusi',
            quizMode: 'Galdeketa',
            quizDesc: 'Galderak erantzun eta puntuak irabazi',
            world: 'Mundua', spain: 'Espainia', euskadi: 'Euskadi',
            countries: 'Herrialdeak', rivers: 'Ibaiak', mountains: 'Mendiak',
            comunidades: 'Erkidegoak', provincias: 'Probintziak',
            territories: 'Lurraldeak', munis: 'Udalerriak',
            search: 'Bilatu...',
            level: 'Maila', selectLevel: 'Maila aukeratu',
            start: 'Hasi', playAgain: 'Berriz', home: 'Hasiera',
            question: 'Galdera',
            correct: 'Ondo!', wrong: 'Gaizki',
            results: 'Emaitzak!',
            pts: 'puntu', correct_lbl: 'Zuzenak', time_lbl: 'Denbora',
            capital_q: 'Zein da hiriburua',
            country_q: 'Zein herrialderen hiriburua da',
            continent_q: 'Zein kontinentetan dago',
            km_q: 'Zenbat km ditu',
            height_q: 'Zein da altueraren',
            river_country_q: 'Zein eskualdetan dago ibaia',
            territory_q: 'Zein lurraldetan dago',
            flag_q: 'Zein herrialderena da bandera hau?',
            capital_of: 'Hiriburu',
            back: '← Atzera',
            lvl_desc: [
                '',
                'Herrialde ezagunak eta hiriburuak',
                'Europako hiriburuak',
                'Amerika eta Asiako hiriburuak',
                'Munduaren ibai eta mendiak',
                'Espainiako erkidegoak',
                'Espainiako probintziak',
                'Espainiako ibai eta mendiak',
                'Euskadiko lurraldeak eta udalerriak',
                'Euskadiko ibai eta mendiak',
                'Dena: errepaso osoa',
            ],
            stars0: 'Jarraitu lantzen', stars1: 'Ongi egina', stars2: 'Bikaina', stars3: 'Ezin hobeto!',
            modeTitle: 'Joko modua', diffTitle: 'Zailtasuna (denbora galdera bakoitzeko)',
            mode_classic: 'Klasikoa', mode_flags: 'Banderak', mode_capitals: 'Hiriburutik herrialdera', mode_continents: 'Kontinenteak',
            mode_classic_d: 'Hiriburuak, ibaiak, mendiak, Espainia eta Euskadi 10 mailatan',
            mode_flags_d: 'Asmatu herrialdea bere banderatik',
            mode_capitals_d: 'Hiriburua ematen dizugu, zuk herrialdea aukeratu',
            mode_continents_d: 'Zein kontinentetan dago herrialde bakoitza?',
            lvl_easy: 'Erraza', lvl_mid: 'Ertaina', lvl_hard: 'Zaila',
            lvl_easy_d: 'Oso herrialde ezagunak', lvl_mid_d: 'Munduko herrialde gehiago', lvl_hard_d: 'Herrialde guztiak, ezezagunenak ere bai',
            diff_easy: 'Lasai', diff_normal: 'Normala', diff_hard: 'Azkarra',
            seconds: 's', noResults: 'Emaitzarik ez', notEnough: 'Oraindik ez dago galdera nahikorik konbinazio honetarako.',
            quitTitle: 'Galdeketatik irten?', quitMsg: 'Uneko aurrerapen guztia galduko da.', quitCancel: 'Utzi', quitOk: 'Irten',
            kbHint: 'Teklatua: sakatu 1, 2, 3 edo 4 erantzuteko',
            c_eu: 'Europa', c_as: 'Asia', c_af: 'Afrika', c_na: 'Ipar Amerika', c_sa: 'Hego Amerika', c_am: 'Amerika', c_oc: 'Ozeania', c_euas: 'Europa eta Asia',
        },
        gl: {
            appName: 'GeoQuiz',
            subtitle: 'Coñece o mundo, España e Euskadi',
            atlasMode: 'Atlas',
            atlasDesc: 'Explora toda a información',
            quizMode: 'Quiz',
            quizDesc: 'Responde preguntas e gaña puntos',
            world: 'Mundial', spain: 'España', euskadi: 'Euskadi',
            countries: 'Países', rivers: 'Ríos', mountains: 'Montañas',
            comunidades: 'CC.AA.', provincias: 'Provincias',
            territories: 'Territorios', munis: 'Concellos',
            search: 'Buscar...',
            level: 'Nivel', selectLevel: 'Selecciona nivel',
            start: 'Comezar', playAgain: 'Repetir', home: 'Inicio',
            question: 'Pregunta',
            correct: 'Correcto!', wrong: 'Incorrecto',
            results: 'Resultados!',
            pts: 'pts', correct_lbl: 'Correctas', time_lbl: 'Tempo',
            capital_q: 'Cal é a capital de',
            country_q: 'De que país é capital',
            continent_q: 'En que continente está',
            km_q: 'Cantos km ten o río',
            height_q: 'Cal é a altura do',
            river_country_q: 'En que rexión está o río',
            territory_q: 'En que territorio está',
            flag_q: 'De que país é esta bandeira?',
            capital_of: 'Capital de',
            back: '← Volver',
            lvl_desc: [
                '',
                'Países famosos e capitais coñecidas',
                'Máis países e capitais de Europa',
                'Capitais de América e Asia',
                'Ríos e montañas máis famosos do mundo',
                'Comunidades autónomas de España',
                'Provincias de España e as súas capitais',
                'Ríos e montañas de España',
                'Territorios e concellos de Euskadi',
                'Ríos e montañas de Euskadi',
                'Todo: repaso completo',
            ],
            stars0: 'Segue practicando', stars1: 'Ben feito', stars2: 'Excelente', stars3: 'Perfecto!',
            modeTitle: 'Modo de xogo', diffTitle: 'Dificultade (tempo por pregunta)',
            mode_classic: 'Clásico', mode_flags: 'Bandeiras', mode_capitals: 'Capital a país', mode_continents: 'Continentes',
            mode_classic_d: 'Capitais, ríos, montañas, España e Euskadi en 10 niveis',
            mode_flags_d: 'Adiviña o país pola súa bandeira',
            mode_capitals_d: 'Damosche a capital, ti escolles o país',
            mode_continents_d: 'En que continente está cada país?',
            lvl_easy: 'Fácil', lvl_mid: 'Medio', lvl_hard: 'Difícil',
            lvl_easy_d: 'Países moi coñecidos', lvl_mid_d: 'Máis países de todo o mundo', lvl_hard_d: 'Todos os países, tamén os menos coñecidos',
            diff_easy: 'Tranquilo', diff_normal: 'Normal', diff_hard: 'Rápido',
            seconds: 's', noResults: 'Sen resultados', notEnough: 'Aínda non hai preguntas suficientes para esta combinación.',
            quitTitle: 'Saír do quiz?', quitMsg: 'Perderase o progreso actual.', quitCancel: 'Cancelar', quitOk: 'Saír',
            kbHint: 'Teclado: preme 1, 2, 3 ou 4 para responder',
            c_eu: 'Europa', c_as: 'Asia', c_af: 'África', c_na: 'América do Norte', c_sa: 'América do Sur', c_am: 'América', c_oc: 'Oceanía', c_euas: 'Europa e Asia',
        },
        ca: {
            appName: 'GeoQuiz',
            subtitle: 'Coneix el món, Espanya i Euskadi',
            atlasMode: 'Atles',
            atlasDesc: 'Explora tota la informació',
            quizMode: 'Quiz',
            quizDesc: 'Respon preguntes i guanya punts',
            world: 'Món', spain: 'Espanya', euskadi: 'Euskadi',
            countries: 'Països', rivers: 'Rius', mountains: 'Muntanyes',
            comunidades: 'CC.AA.', provincias: 'Províncies',
            territories: 'Territoris', munis: 'Municipis',
            search: 'Cerca...',
            level: 'Nivell', selectLevel: 'Selecciona nivell',
            start: 'Començar', playAgain: 'Repetir', home: 'Inici',
            question: 'Pregunta',
            correct: 'Correcte!', wrong: 'Incorrecte',
            results: 'Resultats!',
            pts: 'pts', correct_lbl: 'Correctes', time_lbl: 'Temps',
            capital_q: 'Quina és la capital de',
            country_q: 'De quin país és capital',
            continent_q: 'En quin continent és',
            km_q: 'Quants km té el riu',
            height_q: "Quina és l'altura del",
            river_country_q: 'En quina regió és el riu',
            territory_q: 'En quin territori és',
            flag_q: 'De quin país és aquesta bandera?',
            capital_of: 'Capital de',
            back: '← Tornar',
            lvl_desc: [
                '',
                'Països famosos i capitals conegudes',
                "Més països i capitals d'Europa",
                "Capitals d'Amèrica i Àsia",
                'Rius i muntanyes més famosos del món',
                "Comunitats autònomes d'Espanya",
                "Províncies d'Espanya i les seves capitals",
                "Rius i muntanyes d'Espanya",
                "Territoris i municipis d'Euskadi",
                "Rius i muntanyes d'Euskadi",
                'Tot: repàs complet',
            ],
            stars0: 'Continua practicant', stars1: 'Ben fet', stars2: 'Excel·lent', stars3: 'Perfecte!',
            modeTitle: 'Mode de joc', diffTitle: 'Dificultat (temps per pregunta)',
            mode_classic: 'Clàssic', mode_flags: 'Banderes', mode_capitals: 'Capital a país', mode_continents: 'Continents',
            mode_classic_d: 'Capitals, rius, muntanyes, Espanya i Euskadi en 10 nivells',
            mode_flags_d: 'Endevina el país per la seva bandera',
            mode_capitals_d: 'Et donem la capital, tu tries el país',
            mode_continents_d: 'En quin continent és cada país?',
            lvl_easy: 'Fàcil', lvl_mid: 'Mitjà', lvl_hard: 'Difícil',
            lvl_easy_d: 'Països molt coneguts', lvl_mid_d: 'Més països de tot el món', lvl_hard_d: 'Tots els països, també els menys coneguts',
            diff_easy: 'Tranquil', diff_normal: 'Normal', diff_hard: 'Ràpid',
            seconds: 's', noResults: 'Sense resultats', notEnough: 'Encara no hi ha prou preguntes per a aquesta combinació.',
            quitTitle: 'Sortir del quiz?', quitMsg: 'Es perdrà el progrés actual.', quitCancel: 'Cancel·lar', quitOk: 'Sortir',
            kbHint: 'Teclat: prem 1, 2, 3 o 4 per respondre',
            c_eu: 'Europa', c_as: 'Àsia', c_af: 'Àfrica', c_na: 'Amèrica del Nord', c_sa: 'Amèrica del Sud', c_am: 'Amèrica', c_oc: 'Oceania', c_euas: 'Europa i Àsia',
        },
        fr: {
            appName: 'GeoQuiz',
            subtitle: "Découvre le monde, l'Espagne et l'Euskadi",
            atlasMode: 'Atlas',
            atlasDesc: 'Explore toutes les informations',
            quizMode: 'Quiz',
            quizDesc: 'Réponds aux questions et gagne des points',
            world: 'Monde', spain: 'Espagne', euskadi: 'Euskadi',
            countries: 'Pays', rivers: 'Fleuves', mountains: 'Montagnes',
            comunidades: 'Communautés', provincias: 'Provinces',
            territories: 'Territoires', munis: 'Communes',
            search: 'Rechercher...',
            level: 'Niveau', selectLevel: 'Choisis le niveau',
            start: 'Commencer', playAgain: 'Rejouer', home: 'Accueil',
            question: 'Question',
            correct: 'Correct !', wrong: 'Incorrect',
            results: 'Résultats !',
            pts: 'pts', correct_lbl: 'Correctes', time_lbl: 'Temps',
            capital_q: 'Quelle est la capitale de',
            country_q: 'De quel pays est capitale',
            continent_q: 'Sur quel continent se trouve',
            km_q: 'Combien de km mesure le fleuve',
            height_q: 'Quelle est la hauteur du',
            river_country_q: 'Dans quelle région se trouve le fleuve',
            territory_q: 'Dans quel territoire se trouve',
            flag_q: 'De quel pays est ce drapeau ?',
            capital_of: 'Capitale de',
            back: '← Retour',
            lvl_desc: [
                '',
                'Pays célèbres et capitales connues',
                "Plus de pays et capitales d'Europe",
                "Capitales d'Amérique et d'Asie",
                'Fleuves et montagnes les plus célèbres du monde',
                "Communautés autonomes d'Espagne",
                "Provinces d'Espagne et leurs capitales",
                "Fleuves et montagnes d'Espagne",
                "Territoires et communes d'Euskadi",
                "Fleuves et montagnes d'Euskadi",
                'Tout : révision complète',
            ],
            stars0: "Continue à t'entraîner", stars1: 'Bien joué', stars2: 'Excellent', stars3: 'Parfait !',
            modeTitle: 'Mode de jeu', diffTitle: 'Difficulté (temps par question)',
            mode_classic: 'Classique', mode_flags: 'Drapeaux', mode_capitals: 'Capitale vers pays', mode_continents: 'Continents',
            mode_classic_d: 'Capitales, fleuves, montagnes, Espagne et Euskadi en 10 niveaux',
            mode_flags_d: 'Devine le pays grâce à son drapeau',
            mode_capitals_d: 'On te donne la capitale, tu choisis le pays',
            mode_continents_d: 'Sur quel continent se trouve chaque pays ?',
            lvl_easy: 'Facile', lvl_mid: 'Moyen', lvl_hard: 'Difficile',
            lvl_easy_d: 'Pays très connus', lvl_mid_d: 'Plus de pays du monde entier', lvl_hard_d: 'Tous les pays, même les moins connus',
            diff_easy: 'Tranquille', diff_normal: 'Normal', diff_hard: 'Rapide',
            seconds: 's', noResults: 'Aucun résultat', notEnough: 'Pas encore assez de questions pour cette combinaison.',
            quitTitle: 'Quitter le quiz ?', quitMsg: 'La progression actuelle sera perdue.', quitCancel: 'Annuler', quitOk: 'Quitter',
            kbHint: 'Clavier : appuie sur 1, 2, 3 ou 4 pour répondre',
            c_eu: 'Europe', c_as: 'Asie', c_af: 'Afrique', c_na: 'Amérique du Nord', c_sa: 'Amérique du Sud', c_am: 'Amérique', c_oc: 'Océanie', c_euas: 'Europe et Asie',
        },
    };

    const t = (key) => (I18N[state.lang] || I18N.es)[key] ?? I18N.es[key] ?? key;

    const DIFFS = { easy: 25, normal: 15, hard: 8 };
    const MODES = ['classic', 'flags', 'capitals', 'continents'];
    const CONT_KEYS = {
        'Europa': 'c_eu', 'Asia': 'c_as', 'África': 'c_af', 'América del Norte': 'c_na',
        'América del Sur': 'c_sa', 'América': 'c_am', 'Oceanía': 'c_oc', 'Europa/Asia': 'c_euas',
    };
    const contName = (c) => CONT_KEYS[c] ? t(CONT_KEYS[c]) : c;

    // Localized country name: Spanish comes from the data, other languages from Intl.DisplayNames
    const _dn = {};
    function countryName(c) {
        if (state.lang === 'es' || !c.iso) return c.name;
        try {
            if (!_dn[state.lang]) _dn[state.lang] = new Intl.DisplayNames([state.lang], { type: 'region' });
            return _dn[state.lang].of(c.iso) || c.name;
        } catch (e) { return c.name; }
    }

    // ── DOM helpers ────────────────────────────────────────────────────────
    const $ = (id) => document.getElementById(id);
    const show = (id) => { const el = $(id); if (el) el.style.display = ''; };
    const hide = (id) => { const el = $(id); if (el) el.style.display = 'none'; };

    function setScreen(name) {
        document.querySelectorAll('.gq-screen').forEach(s => s.classList.remove('active'));
        const el = $('gq-' + name);
        if (el) {
            el.classList.add('active');
            // Move focus to the new screen for screen reader announcement
            if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
            el.focus({ preventScroll: true });
        }
        state.screen = name;
    }

    // ── Atlas ──────────────────────────────────────────────────────────────
    function renderAtlas() {
        setScreen('atlas');
        renderAtlasTopTabs();
        renderAtlasSubTabs();
        renderAtlasCards();
    }

    function renderAtlasTopTabs() {
        const tabs = ['world', 'spain', 'euskadi'];
        const container = $('atlas-top-tabs');
        if (!container) return;
        container.setAttribute('role', 'tablist');
        container.innerHTML = tabs.map(tab => {
            const isActive = state.atlasTab === tab;
            return `<button class="gq-tab${isActive ? ' active' : ''}" role="tab" aria-selected="${isActive}" onclick="GeoQuiz.setAtlasTab('${tab}')">${t(tab)}</button>`;
        }).join('');
    }

    function renderAtlasSubTabs() {
        const subtabs = {
            world: ['countries', 'rivers', 'mountains'],
            spain: ['comunidades', 'provincias', 'rivers', 'mountains'],
            euskadi: ['territories', 'munis', 'rivers', 'mountains'],
        };
        const list = subtabs[state.atlasTab] || [];
        const container = $('atlas-sub-tabs');
        if (!container) return;
        container.setAttribute('role', 'tablist');
        container.innerHTML = list.map(sub => {
            const isActive = state.atlasSubTab === sub;
            return `<button class="gq-tab${isActive ? ' active' : ''}" role="tab" aria-selected="${isActive}" onclick="GeoQuiz.setAtlasSubTab('${sub}')">${t(sub)}</button>`;
        }).join('');
    }

    // Continent emoji map
    const CONTINENT_ICONS = {
        'Europa': '🇪🇺', 'Europe': '🇪🇺', 'Europa/Asia': '🌐', 'América del Norte': '🌎', 'América del Sur': '🌎',
        'Asia': '🌏', 'América': '🌎', 'America': '🌎',
        'África': '🌍', 'Africa': '🌍',
        'Oceanía': '🌊', 'Oceania': '🌊',
    };

    function getAtlasGroups() {
        const tab = state.atlasTab;
        const sub = state.atlasSubTab;
        const d = GQ_DATA;
        // Returns array of { header?, items[] }

        if (tab === 'world') {
            if (sub === 'countries') {
                // Group by continent
                const groups = {};
                d.countries.forEach(c => {
                    if (!groups[c.continent]) groups[c.continent] = [];
                    groups[c.continent].push({ icon: c.flag, name: countryName(c), info: `${t('capital_of')}: ${c.capital}` });
                });
                return Object.entries(groups).map(([continent, items]) => ({
                    header: `${CONTINENT_ICONS[continent] || '🌍'} ${contName(continent)}`,
                    items,
                }));
            }
            if (sub === 'rivers') return [{ items: d.world_rivers.map(r => ({
                icon: '🌊', name: r.name, info: `${r.region} · ${r.km.toLocaleString()} km`
            })) }];
            if (sub === 'mountains') return [{ items: d.world_mountains.map(m => ({
                icon: '⛰️', name: m.name, info: `${m.region} · ${m.height.toLocaleString()} m`
            })) }];
        }
        if (tab === 'spain') {
            if (sub === 'comunidades') return [{ items: d.comunidades.map(c => ({
                icon: '🏛️', name: c.name, info: `${t('capital_of')}: ${c.capital}`
            })) }];
            if (sub === 'provincias') {
                // Group by comunidad
                const groups = {};
                d.provincias.forEach(p => {
                    if (!groups[p.comunidad]) groups[p.comunidad] = [];
                    groups[p.comunidad].push({ icon: '📍', name: p.name, info: `${t('capital_of')}: ${p.capital}` });
                });
                return Object.entries(groups).map(([cc, items]) => ({ header: `🏛️ ${cc}`, items }));
            }
            if (sub === 'rivers') return [{ items: d.spain_rivers.map(r => ({
                icon: '🌊', name: r.name, info: `${r.origin} → ${r.mouth} · ${r.km} km`
            })) }];
            if (sub === 'mountains') return [{ items: d.spain_mountains.map(m => ({
                icon: '⛰️', name: m.name, info: `${m.province} · ${m.height.toLocaleString()} m`
            })) }];
        }
        if (tab === 'euskadi') {
            if (sub === 'territories') return [{ items: d.euskadi_territories.map(t2 => ({
                icon: '🏴', name: `${t2.name} / ${t2.nameEu}`, info: `${t('capital_of')}: ${t2.capital} · ${t2.info}`
            })) }];
            if (sub === 'munis') {
                const groups = {};
                d.euskadi_munis.forEach(m => {
                    if (!groups[m.territory]) groups[m.territory] = [];
                    groups[m.territory].push({ icon: '🏘️', name: `${m.name} / ${m.nameEu}`, info: m.info });
                });
                return Object.entries(groups).map(([ter, items]) => ({ header: `🏴 ${ter}`, items }));
            }
            if (sub === 'rivers') return [{ items: d.euskadi_rivers.map(r => ({
                icon: '🌊', name: r.name, info: `${r.territory} · ${r.km} km · ${r.info}`
            })) }];
            if (sub === 'mountains') return [{ items: d.euskadi_mountains.map(m => ({
                icon: '⛰️', name: m.name, info: `${m.territory} · ${m.height.toLocaleString()} m · ${m.info}`
            })) }];
        }
        return [{ items: [] }];
    }

    function renderAtlasCards() {
        const q = state.searchQuery.toLowerCase();
        const groups = getAtlasGroups();
        const container = $('atlas-cards');
        if (!container) return;

        let html = '';
        let totalItems = 0;

        for (const group of groups) {
            let items = group.items;
            if (q) items = items.filter(i => i.name.toLowerCase().includes(q) || i.info.toLowerCase().includes(q));
            if (items.length === 0) continue;
            totalItems += items.length;
            if (group.header) {
                html += `<div class="gq-section-header">${group.header}</div>`;
            }
            html += items.map(item =>
                `<div class="gq-card">
                    <span class="card-icon">${item.icon}</span>
                    <p class="card-name">${item.name}</p>
                    <p class="card-info">${item.info}</p>
                </div>`
            ).join('');
        }

        if (totalItems === 0) {
            html = `<p style="color:var(--text-secondary);text-align:center;grid-column:1/-1">${t('noResults')}</p>`;
        }
        container.innerHTML = html;
    }

    // ── Quiz question builder ──────────────────────────────────────────────
    function shuffle(arr) { return arr.slice().sort(() => Math.random() - 0.5); }

    function pick(arr, n) { return shuffle(arr).slice(0, n); }

    function pickWrong(arr, correct, key, n) {
        return shuffle(arr.filter(x => x[key] !== correct)).slice(0, n).map(x => x[key]);
    }

    function buildQuestions(level) {
        const d = GQ_DATA;
        const qs = [];

        const addCapitalQ = (items) => {
            shuffle(items).forEach(c => {
                const wrong = pickWrong(items, c.capital, 'capital', 3);
                if (wrong.length < 3) return;
                qs.push({
                    icon: c.flag || '🌍',
                    context: t('world'),
                    text: `${t('capital_q')} ${c.iso ? countryName(c) : c.name}?`,
                    answer: c.capital,
                    options: shuffle([c.capital, ...wrong]),
                });
            });
        };

        const addComunidadCapQ = (items) => {
            shuffle(items).forEach(c => {
                const wrong = pickWrong(items, c.capital, 'capital', 3);
                if (wrong.length < 3) return;
                qs.push({
                    icon: '🏛️',
                    context: t('spain'),
                    text: `${t('capital_q')} ${c.name}?`,
                    answer: c.capital,
                    options: shuffle([c.capital, ...wrong]),
                });
            });
        };

        const addProvinciaCapQ = (items) => {
            shuffle(items).forEach(c => {
                const wrong = pickWrong(items, c.capital, 'capital', 3);
                if (wrong.length < 3) return;
                qs.push({
                    icon: '📍',
                    context: t('spain'),
                    text: `${t('capital_q')} ${c.name}?`,
                    answer: c.capital,
                    options: shuffle([c.capital, ...wrong]),
                });
            });
        };

        const addRiverLenQ = (items, context, icon) => {
            shuffle(items).forEach(r => {
                const wrong = pickWrong(items, r.km, 'km', 3);
                if (wrong.length < 3) return;
                qs.push({
                    icon,
                    context,
                    text: `${t('km_q')} ${r.name}?`,
                    answer: String(r.km),
                    options: shuffle([String(r.km), ...wrong.map(String)]),
                });
            });
        };

        const addMountainHeightQ = (items, context) => {
            shuffle(items).forEach(m => {
                const wrong = pickWrong(items, m.height, 'height', 3);
                if (wrong.length < 3) return;
                qs.push({
                    icon: '⛰️',
                    context,
                    text: `${t('height_q')} ${m.name}?`,
                    answer: String(m.height),
                    options: shuffle([String(m.height), ...wrong.map(String)]),
                });
            });
        };

        // Level 1-2: easy world countries
        if (level >= 1) addCapitalQ(d.countries.filter(c => c.level <= 2));
        // Level 3: all world countries
        if (level >= 3) addCapitalQ(d.countries.filter(c => c.level === 3));
        // Level 4: world rivers & mountains
        if (level >= 4) {
            addRiverLenQ(d.world_rivers.filter(r => r.level <= 2), t('world'), '🌊');
            addMountainHeightQ(d.world_mountains.filter(m => m.level <= 2), t('world'));
        }
        // Level 5: comunidades
        if (level >= 5) addComunidadCapQ(d.comunidades);
        // Level 6: provincias
        if (level >= 6) addProvinciaCapQ(d.provincias);
        // Level 7: Spain rivers + mountains
        if (level >= 7) {
            addRiverLenQ(d.spain_rivers.filter(r => r.level <= 2), t('spain'), '🌊');
            addMountainHeightQ(d.spain_mountains.filter(m => m.level <= 2), t('spain'));
        }
        // Level 8: Euskadi territories + munis
        if (level >= 8) {
            shuffle(d.euskadi_territories).forEach(ter => {
                qs.push({
                    icon: '🏴',
                    context: t('euskadi'),
                    text: `${t('capital_q')} ${ter.name}?`,
                    answer: ter.capital,
                    options: shuffle([ter.capital, ...d.euskadi_territories.filter(x => x.capital !== ter.capital).map(x => x.capital), 'Iruñea']).slice(0, 4),
                });
            });
            shuffle(d.euskadi_munis).forEach(m => {
                const wrong = shuffle(d.euskadi_munis.filter(x => x.territory !== m.territory)).slice(0, 3).map(x => x.territory);
                if (wrong.length < 3) return;
                qs.push({
                    icon: '🏘️',
                    context: t('euskadi'),
                    text: `${t('territory_q')} ${m.name}?`,
                    answer: m.territory,
                    options: shuffle([m.territory, ...wrong]),
                });
            });
        }
        // Level 9: Euskadi rivers + mountains
        if (level >= 9) {
            addRiverLenQ(d.euskadi_rivers, t('euskadi'), '🌊');
            addMountainHeightQ(d.euskadi_mountains, t('euskadi'));
        }
        // Level 10: harder world questions
        if (level >= 10) {
            addRiverLenQ(d.world_rivers.filter(r => r.level >= 3), t('world'), '🌊');
            addMountainHeightQ(d.world_mountains.filter(m => m.level >= 3), t('world'));
            addProvinciaCapQ(d.provincias.filter(p => p.level >= 2));
        }

        return shuffle(qs).filter(q => q.options.length === 4).slice(0, 10);
    }

    // ── Extra quiz modes (flags, capital to country, continents) ─────────────
    const CONT_CANON = {
        'Europa': 'c_eu', 'Asia': 'c_as', 'África': 'c_af', 'América del Norte': 'c_na',
        'América del Sur': 'c_sa', 'América': 'c_na', 'Oceanía': 'c_oc',
    };

    function buildModeQuestions(mode, level) {
        const pool = GQ_DATA.countries.filter(c => c.level <= level);
        const qs = [];
        if (pool.length < 8) return qs;
        const wrongNames = (c) => shuffle(pool.filter(x => x.name !== c.name)).slice(0, 3).map(countryName);
        if (mode === 'flags') {
            pick(pool, 20).forEach(c => qs.push({
                icon: c.flag, context: t('world'), text: t('flag_q'), big: true,
                answer: countryName(c), options: shuffle([countryName(c), ...wrongNames(c)]),
            }));
        } else if (mode === 'capitals') {
            pick(pool, 20).forEach(c => qs.push({
                icon: '🏙️', context: t('world'), text: `${t('country_q')} ${c.capital}?`,
                answer: countryName(c), options: shuffle([countryName(c), ...wrongNames(c)]),
            }));
        } else if (mode === 'continents') {
            const keys = ['c_eu', 'c_as', 'c_af', 'c_na', 'c_sa', 'c_oc'];
            pick(pool.filter(c => CONT_CANON[c.continent]), 20).forEach(c => {
                const ans = CONT_CANON[c.continent];
                const wrong = shuffle(keys.filter(k => k !== ans)).slice(0, 3);
                qs.push({
                    icon: c.flag, context: t('world'), text: `${t('continent_q')} ${countryName(c)}?`,
                    answer: t(ans), options: shuffle([ans, ...wrong]).map(k => t(k)),
                });
            });
        }
        return qs.filter(q => q.options.length === 4 && new Set(q.options).size === 4).slice(0, 10);
    }

    // ── Quiz flow ──────────────────────────────────────────────────────────
    function startQuiz() {
        const qs = state.quizMode === 'classic'
            ? buildQuestions(state.quizLevel)
            : buildModeQuestions(state.quizMode, state.quizLevel);
        if (qs.length < 3) {
            alert(t('notEnough'));
            return;
        }
        state.timerSecs = DIFFS[state.quizDiff] || 15;
        state.quizQuestions = qs;
        state.quizIndex = 0;
        state.quizScore = 0;
        state.quizCorrect = 0;
        state.quizStart = Date.now();
        setScreen('quiz');
        showQuestion();
    }

    function showQuestion() {
        const q = state.quizQuestions[state.quizIndex];
        if (!q) { endQuiz(); return; }

        state.answered = false;
        state.timerLeft = state.timerSecs;

        // Topbar
        $('gq-q-index').textContent = `${t('question')} ${state.quizIndex + 1}/${state.quizQuestions.length}`;
        $('gq-q-score').textContent = `${state.quizScore} ${t('pts')}`;

        // Question card
        $('gq-q-icon').textContent = q.icon || '🌍';
        $('gq-q-icon').classList.toggle('big', !!q.big);
        $('gq-q-context').textContent = q.context || '';
        $('gq-q-text').textContent = q.text;

        // Options
        $('gq-options').innerHTML = q.options.map((opt, i) =>
            `<button class="gq-option" onclick="GeoQuiz.selectOption(${i})" data-idx="${i}"><kbd class="gq-key" aria-hidden="true">${i + 1}</kbd><span>${opt}</span></button>`
        ).join('');

        $('gq-feedback').textContent = '';
        $('gq-feedback').className = 'gq-feedback';

        startTimer();
    }

    function startTimer() {
        clearInterval(state.timerInterval);
        const bar = $('gq-timer-bar');
        if (!bar) return;
        state.timerLeft = state.timerSecs;
        bar.style.width = '100%';
        bar.className = 'gq-timer-bar';

        const wrap = $('gq-timer-wrap');
        if (wrap) {
            wrap.setAttribute('aria-valuemax', String(state.timerSecs));
            wrap.setAttribute('aria-valuenow', String(state.timerSecs));
        }

        state.timerInterval = setInterval(() => {
            state.timerLeft--;
            const pct = (state.timerLeft / state.timerSecs) * 100;
            bar.style.width = pct + '%';
            if (pct < 40) bar.className = 'gq-timer-bar warn';
            if (pct < 20) bar.className = 'gq-timer-bar danger';
            if (wrap) wrap.setAttribute('aria-valuenow', String(state.timerLeft));
            if (state.timerLeft <= 0) {
                clearInterval(state.timerInterval);
                if (!state.answered) timeOut();
            }
        }, 1000);
    }

    function timeOut() {
        state.answered = true;
        const q = state.quizQuestions[state.quizIndex];
        // Mark correct answer
        document.querySelectorAll('.gq-option').forEach((btn, i) => {
            if (q.options[i] === q.answer) btn.classList.add('correct');
            btn.disabled = true;
        });
        const fb = $('gq-feedback');
        fb.textContent = `⏰ ${t('wrong')}: ${q.answer}`;
        fb.className = 'gq-feedback bad';
        setTimeout(nextQuestion, 1800);
    }

    function selectOption(idx) {
        if (state.answered) return;
        state.answered = true;
        clearInterval(state.timerInterval);

        const q = state.quizQuestions[state.quizIndex];
        const chosen = q.options[idx];
        const correct = chosen === q.answer;

        document.querySelectorAll('.gq-option').forEach((btn, i) => {
            btn.disabled = true;
            if (q.options[i] === q.answer) btn.classList.add('correct');
            else if (i === idx && !correct) btn.classList.add('wrong');
        });

        const fb = $('gq-feedback');
        if (correct) {
            const diffMul = state.quizDiff === 'hard' ? 1.5 : state.quizDiff === 'easy' ? 0.8 : 1;
            const bonus = Math.round((Math.ceil(state.timerLeft / state.timerSecs * 100) + state.quizLevel * 10) * diffMul);
            state.quizScore += bonus;
            state.quizCorrect++;
            fb.textContent = `${t('correct')} +${bonus} ${t('pts')}`;
            fb.className = 'gq-feedback good';
        } else {
            fb.textContent = `${t('wrong')}: ${q.answer}`;
            fb.className = 'gq-feedback bad';
        }
        $('gq-q-score').textContent = `${state.quizScore} ${t('pts')}`;
        setTimeout(nextQuestion, 1500);
    }

    function nextQuestion() {
        state.quizIndex++;
        if (state.quizIndex < state.quizQuestions.length) {
            showQuestion();
        } else {
            endQuiz();
        }
    }

    function endQuiz() {
        clearInterval(state.timerInterval);
        const elapsed = Math.round((Date.now() - state.quizStart) / 1000);
        const total = state.quizQuestions.length;
        const pct = state.quizCorrect / total;
        const stars = pct >= 1 ? 3 : pct >= 0.7 ? 2 : pct >= 0.4 ? 1 : 0;
        const starStr = ['⭐', '⭐', '⭐⭐', '⭐⭐⭐'][stars] || '';
        const starsText = [t('stars0'), t('stars1'), t('stars2'), t('stars3')][stars];

        $('gq-result-title').textContent = t('results');
        $('gq-result-stars').textContent = starStr;
        $('gq-result-stars-text').textContent = starsText;
        $('gq-result-pts').textContent = state.quizScore;
        $('gq-result-correct').textContent = `${state.quizCorrect}/${total}`;
        $('gq-result-time').textContent = elapsed + 's';

        setScreen('results');

        // Save to platform if logged in
        try {
            const uid = (typeof PlatformAuth !== 'undefined' && PlatformAuth.currentUser) ? PlatformAuth.currentUser.uid : null;
            if (uid && window.PlatformFirestore) {
                PlatformFirestore.updateGameStats(uid, 'geoQuiz', {
                    correctAnswers: state.quizCorrect,
                    totalQuestions: total,
                    totalAttempts:  total,
                    bestStreak:     0,
                    elapsedSeconds: elapsed,
                    level:          state.quizLevel,
                }).catch(() => {});
            }
            if (window.PlatformAchievements) {
                PlatformAchievements.checkGameAchievements('geoQuiz', {
                    stars, score: state.quizScore, level: state.quizLevel,
                    correct: state.quizCorrect, total,
                }, {}, {});
            }
        } catch (e) { /* guest mode */ }
    }

    // ── Lang ───────────────────────────────────────────────────────────────
    function setLang(lang) {
        state.lang = lang;
        document.documentElement.lang = (lang || 'es').split('-')[0];
        document.querySelectorAll('.gq-lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
        renderHome();
    }

    // ── Home ───────────────────────────────────────────────────────────────
    function renderHome() {
        setScreen('home');
        $('gq-app-name').textContent = t('appName');
        $('gq-subtitle').textContent = t('subtitle');
        $('gq-atlas-label').textContent = t('atlasMode');
        $('gq-atlas-desc').textContent = t('atlasDesc');
        $('gq-quiz-label').textContent = t('quizMode');
        $('gq-quiz-desc').textContent = t('quizDesc');
        applyStaticTexts();
    }

    // Static labels in other screens (language-aware)
    function applyStaticTexts() {
        const set = (id, txt) => { const el = $(id); if (el) el.textContent = txt; };
        set('gq-atlas-back', t('back'));
        set('gq-atlas-title', t('atlasMode'));
        set('gq-res-correct-lbl', t('correct_lbl'));
        set('gq-res-time-lbl', t('time_lbl'));
        set('gq-res-again', t('playAgain'));
        set('gq-res-home', t('home'));
        const pts = document.querySelector('.gq-score-circle .pts-label');
        if (pts) pts.textContent = t('pts');
        const srch = $('gq-search');
        if (srch) { srch.placeholder = t('search'); srch.setAttribute('aria-label', t('search')); }
        const tw = $('gq-timer-wrap');
        if (tw) tw.setAttribute('aria-label', t('time_lbl'));
    }

    // ── Quiz setup ─────────────────────────────────────────────────────────
    const MODE_ICONS = { classic: '🧭', flags: '🚩', capitals: '🏙️', continents: '🌍' };

    function renderQuizSetup() {
        setScreen('quiz-setup');
        $('gqs-title').textContent = t('quizMode');
        $('gqs-mode-title').textContent = t('modeTitle');
        $('gqs-level-title').textContent = t('selectLevel');
        $('gqs-diff-title').textContent = t('diffTitle');
        $('gqs-kbhint').textContent = t('kbHint');

        $('gqs-modes').innerHTML = MODES.map(m =>
            `<button class="gq-mode-pick${state.quizMode === m ? ' active' : ''}" role="radio" aria-checked="${state.quizMode === m}" onclick="GeoQuiz.selectMode('${m}')">
                <span class="m-ico">${MODE_ICONS[m]}</span><span class="m-name">${t('mode_' + m)}</span><span class="m-desc">${t('mode_' + m + '_d')}</span>
            </button>`).join('');

        const grid = $('gqs-levels-grid');
        if (state.quizMode === 'classic') {
            grid.classList.remove('three');
            grid.innerHTML = Array.from({ length: 10 }, (_, i) => {
                const n = i + 1;
                return `<button class="gq-level-btn${state.quizLevel === n ? ' active' : ''}" role="radio" aria-checked="${state.quizLevel === n}" onclick="GeoQuiz.selectLevel(${n})">${t('level')} ${n}</button>`;
            }).join('');
            $('gqs-desc').textContent = t('lvl_desc')[state.quizLevel] || '';
        } else {
            if (state.quizLevel > 3) state.quizLevel = 3;
            grid.classList.add('three');
            const names = ['lvl_easy', 'lvl_mid', 'lvl_hard'];
            grid.innerHTML = names.map((k, i) =>
                `<button class="gq-level-btn${state.quizLevel === i + 1 ? ' active' : ''}" role="radio" aria-checked="${state.quizLevel === i + 1}" onclick="GeoQuiz.selectLevel(${i + 1})">${t(k)}</button>`).join('');
            $('gqs-desc').textContent = t(names[state.quizLevel - 1] + '_d');
        }

        $('gqs-diff').innerHTML = ['easy', 'normal', 'hard'].map(d =>
            `<button class="gq-diff-btn${state.quizDiff === d ? ' active' : ''}" role="radio" aria-checked="${state.quizDiff === d}" onclick="GeoQuiz.selectDiff('${d}')">${t('diff_' + d)}<small>${DIFFS[d]} ${t('seconds')}</small></button>`).join('');
        $('gqs-start').textContent = t('start');
        $('gqs-back').textContent = t('back');
    }

    // ── Quit confirmation ────────────────────────────────────────────────
    function _showQuitConfirm(onConfirm) {
        const modal = $('gq-quit-modal');
        if (!modal) { onConfirm(); return; }
        // Update text for current language
        $('gq-quit-title').textContent = t('quitTitle');
        $('gq-quit-msg').textContent = t('quitMsg');
        $('gq-quit-cancel').textContent = t('quitCancel');
        $('gq-quit-ok').textContent = t('quitOk');
        modal.classList.remove('hidden');
        modal.focus();
        state._quitConfirm = onConfirm;
    }

    function _hideQuitConfirm() {
        const modal = $('gq-quit-modal');
        if (modal) modal.classList.add('hidden');
        state._quitConfirm = null;
    }

    function _initQuitModal() {
        const cancel = $('gq-quit-cancel');
        const ok = $('gq-quit-ok');
        if (cancel) cancel.addEventListener('click', () => _hideQuitConfirm());
        if (ok) ok.addEventListener('click', () => {
            const fn = state._quitConfirm;
            _hideQuitConfirm();
            if (fn) fn();
        });
    }

    // ── Keyboard ───────────────────────────────────────────────────────────
    function onKey(e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const modal = $('gq-quit-modal');
        const modalOpen = modal && !modal.classList.contains('hidden');
        if (e.key === 'Escape') {
            if (modalOpen) _hideQuitConfirm();
            else if (state.screen === 'quiz') GeoQuiz.goHome();
            return;
        }
        if (modalOpen || state.screen !== 'quiz') return;
        const tag = (e.target && e.target.tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        if (/^[1-4]$/.test(e.key)) {
            e.preventDefault();
            selectOption(Number(e.key) - 1);
        }
    }

    // ── Public API ─────────────────────────────────────────────────────────
    return {
        init() {
            state.lang = platformLang();
            document.documentElement.lang = (state.lang || 'es').split('-')[0];
            renderHome();
            _initQuitModal();
            applyStaticTexts();
            document.addEventListener('keydown', onKey);
            // Sync language with platform header
            document.addEventListener('platformLanguageChanged', () => {
                state.lang = platformLang();
                document.documentElement.lang = (state.lang || 'es').split('-')[0];
                // Re-render current screen
                if (state.screen === 'home') renderHome();
                else if (state.screen === 'atlas') { renderAtlasTopTabs(); renderAtlasSubTabs(); renderAtlasCards(); }
                else if (state.screen === 'quiz-setup') renderQuizSetup();
                else if (state.screen === 'quiz') applyStaticTexts();
            });
        },
        setLang,
        goAtlas() {
            state.atlasTab = 'world';
            state.atlasSubTab = 'countries';
            state.searchQuery = '';
            renderAtlas();
        },
        goQuizSetup() {
            renderQuizSetup();
        },
        setAtlasTab(tab) {
            state.atlasTab = tab;
            const defaults = { world: 'countries', spain: 'comunidades', euskadi: 'territories' };
            state.atlasSubTab = defaults[tab] || 'countries';
            renderAtlasTopTabs();
            renderAtlasSubTabs();
            renderAtlasCards();
        },
        setAtlasSubTab(sub) {
            state.atlasSubTab = sub;
            renderAtlasSubTabs();
            renderAtlasCards();
        },
        onSearch(val) {
            state.searchQuery = val;
            renderAtlasCards();
        },
        selectLevel(n) {
            state.quizLevel = n;
            renderQuizSetup();
        },
        selectMode(m) {
            state.quizMode = m;
            if (m !== 'classic' && state.quizLevel > 3) state.quizLevel = 3;
            renderQuizSetup();
        },
        selectDiff(d) {
            state.quizDiff = d;
            renderQuizSetup();
        },
        startQuiz,
        selectOption,
        goHome() {
            if (state.screen === 'quiz' && !state.answered) {
                _showQuitConfirm(() => { clearInterval(state.timerInterval); renderHome(); });
                return;
            }
            clearInterval(state.timerInterval);
            renderHome();
        },
        playAgain() { renderQuizSetup(); },
    };
})();

window.addEventListener('DOMContentLoaded', () => GeoQuiz.init());
