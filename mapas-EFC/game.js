/**
 * Mapas - interactive maps (world, continents, Spain, rivers).
 * Real geometry (Natural Earth, IGN via es-atlas) is pre-projected into data/world.js and data/spain.js
 * (see scripts/build-maps.mjs). Pure helpers are exported for tests.
 */
const Mapas = (function () {
    'use strict';

    const LANGS = ['es', 'en', 'eu', 'gl', 'ca', 'fr'];
    // [es, en, eu, gl, ca, fr]
    const UI = {
        title: ['Mapas', 'Maps', 'Mapak', 'Mapas', 'Mapes', 'Cartes'],
        sub: ['Toca el mapa y descubre dónde está todo', 'Tap the map and discover where everything is', 'Ukitu mapa eta ezagutu dena non dagoen', 'Toca o mapa e descubre onde está todo', 'Toca el mapa i descobreix on és tot', 'Touche la carte et découvre où se trouve tout'],
        mworld: ['Mundo', 'World', 'Mundua', 'Mundo', 'Món', 'Monde'],
        mEU: ['Europa', 'Europe', 'Europa', 'Europa', 'Europa', 'Europe'],
        mAF: ['África', 'Africa', 'Afrika', 'África', 'Àfrica', 'Afrique'],
        mAS: ['Asia', 'Asia', 'Asia', 'Asia', 'Àsia', 'Asie'],
        mNA: ['América del Norte', 'North America', 'Ipar Amerika', 'América do Norte', 'Amèrica del Nord', 'Amérique du Nord'],
        mSA: ['América del Sur', 'South America', 'Hego Amerika', 'América do Sur', 'Amèrica del Sud', 'Amérique du Sud'],
        mOC: ['Oceanía', 'Oceania', 'Ozeania', 'Oceanía', 'Oceania', 'Océanie'],
        mes: ['España: comunidades', 'Spain: regions', 'Espainia: erkidegoak', 'España: comunidades', 'Espanya: comunitats', 'Espagne : régions'],
        mprov: ['España: provincias', 'Spain: provinces', 'Espainia: probintziak', 'España: provincias', 'Espanya: províncies', 'Espagne : provinces'],
        mrivw: ['Ríos del mundo', 'Rivers of the world', 'Munduko ibaiak', 'Ríos do mundo', 'Rius del món', 'Fleuves du monde'],
        mrives: ['Ríos de España', 'Rivers of Spain', 'Espainiako ibaiak', 'Ríos de España', 'Rius d’Espanya', 'Fleuves d’Espagne'],
        mastered: ['{a} de {b} dominados', '{a} of {b} mastered', '{b}tik {a} menderatuta', '{a} de {b} dominados', '{a} de {b} dominats', '{a} sur {b} maîtrisés'],
        mdExplore: ['Explorar', 'Explore', 'Esploratu', 'Explorar', 'Explorar', 'Explorer'],
        mdExploreD: ['Toca y descubre', 'Tap and discover', 'Ukitu eta ezagutu', 'Toca e descubre', 'Toca i descobreix', 'Touche et découvre'],
        mdFind: ['¿Dónde está?', 'Where is it?', 'Non dago?', 'Onde está?', 'On és?', 'Où est-ce ?'],
        mdFindD: ['Toca el lugar en el mapa', 'Tap the place on the map', 'Ukitu lekua mapan', 'Toca o lugar no mapa', 'Toca el lloc al mapa', 'Touche l’endroit sur la carte'],
        mdName: ['¿Cómo se llama?', 'What is it called?', 'Zer du izena?', 'Como se chama?', 'Com es diu?', 'Comment ça s’appelle ?'],
        mdNameD: ['Mira el mapa y elige el nombre', 'Look at the map and pick the name', 'Begiratu mapari eta aukeratu izena', 'Mira o mapa e elixe o nome', 'Mira el mapa i tria el nom', 'Regarde la carte et choisis le nom'],
        mdCap: ['Capitales', 'Capitals', 'Hiriburuak', 'Capitais', 'Capitals', 'Capitales'],
        mdCapD: ['Une cada capital con su lugar', 'Match each capital with its place', 'Lotu hiriburu bakoitza bere lekuarekin', 'Une cada capital co seu lugar', 'Uneix cada capital amb el seu lloc', 'Associe chaque capitale à son lieu'],
        easy: ['Fáciles', 'Easy', 'Errazak', 'Fáciles', 'Fàcils', 'Faciles'],
        all: ['Todos', 'All', 'Guztiak', 'Todos', 'Tots', 'Tous'],
        qFind: ['Toca: {n}', 'Tap: {n}', 'Ukitu: {n}', 'Toca: {n}', 'Toca: {n}', 'Touche : {n}'],
        qName: ['¿Cómo se llama el sitio marcado?', 'What is the highlighted place called?', 'Nola deitzen da markatutako lekua?', 'Como se chama o sitio marcado?', 'Com es diu el lloc marcat?', 'Comment s’appelle l’endroit marqué ?'],
        qCapFind: ['Toca el lugar cuya capital es {n}', 'Tap the place whose capital is {n}', 'Ukitu {n} hiriburu duen lekua', 'Toca o lugar cuxa capital é {n}', 'Toca el lloc la capital del qual és {n}', 'Touche le lieu dont la capitale est {n}'],
        qCapName: ['¿Cuál es su capital?', 'What is its capital?', 'Zein da bere hiriburua?', 'Cal é a súa capital?', 'Quina és la seva capital?', 'Quelle est sa capitale ?'],
        fbOk: ['¡Correcto!', 'Correct!', 'Zuzena!', 'Correcto!', 'Correcte!', 'Correct !'],
        fbTry: ['Ese es {n}. Prueba otra vez', 'That is {n}. Try again', 'Hori {n} da. Saiatu berriro', 'Ese é {n}. Proba outra vez', 'Aquest és {n}. Torna-ho a provar', 'C’est {n}. Réessaie'],
        fbShow: ['Era este: {n}', 'It was this one: {n}', 'Hau zen: {n}', 'Era este: {n}', 'Era aquest: {n}', 'C’était celui-ci : {n}'],
        fbWrong: ['Era {n}', 'It was {n}', '{n} zen', 'Era {n}', 'Era {n}', 'C’était {n}'],
        hint: ['Pista', 'Hint', 'Pista', 'Pista', 'Pista', 'Indice'],
        next: ['Siguiente', 'Next', 'Hurrengoa', 'Seguinte', 'Següent', 'Suivant'],
        back: ['Volver', 'Back', 'Itzuli', 'Volver', 'Tornar', 'Retour'],
        quit: ['Salir', 'Quit', 'Irten', 'Saír', 'Sortir', 'Quitter'],
        again: ['Otra vez', 'Again', 'Berriro', 'Outra vez', 'Una altra vegada', 'Encore'],
        endGreat: ['¡Buen viaje!', 'Great trip!', 'Bidaia ona!', 'Boa viaxe!', 'Bon viatge!', 'Beau voyage !'],
        endRight: ['aciertos', 'correct', 'asmatu', 'acertos', 'encerts', 'réussites'],
        endWrong: ['fallos', 'missed', 'huts', 'fallos', 'errors', 'ratés'],
        endStreak: ['mejor racha', 'best streak', 'serie onena', 'mellor racha', 'millor ratxa', 'meilleure série'],
        mistakes: ['Repasa estos', 'Review these', 'Errepasatu hauek', 'Repasa estes', 'Repassa aquests', 'À revoir'],
        capital: ['Capital', 'Capital', 'Hiriburua', 'Capital', 'Capital', 'Capitale'],
        continent: ['Continente', 'Continent', 'Kontinentea', 'Continente', 'Continent', 'Continent'],
        flows: ['Pasa por', 'Flows through', 'Hemendik pasatzen da', 'Pasa por', 'Passa per', 'Traverse'],
        lgNew: ['Sin probar', 'Not tried', 'Probatu gabe', 'Sen probar', 'Sense provar', 'Pas essayé'],
        lgWeak: ['Practicando', 'Practising', 'Praktikatzen', 'Practicando', 'Practicant', 'En cours'],
        lgOk: ['Dominado', 'Mastered', 'Menderatuta', 'Dominado', 'Dominat', 'Maîtrisé'],
        close: ['Cerrar', 'Close', 'Itxi', 'Pechar', 'Tancar', 'Fermer'],
        loading: ['Cargando mapa…', 'Loading map…', 'Mapa kargatzen…', 'Cargando mapa…', 'Carregant el mapa…', 'Chargement de la carte…'],
        mmont: ['Montañas del mundo', 'Mountains of the world', 'Munduko mendiak', 'Montañas do mundo', 'Muntanyes del món', 'Montagnes du monde'],
        mmontes: ['Montañas de España', 'Mountains of Spain', 'Espainiako mendiak', 'Montañas de España', 'Muntanyes d’Espanya', 'Montagnes d’Espagne'],
        didYou: ['¿Sabías que…?', 'Did you know…?', 'Ba al zenekien…?', 'Sabías que…?', 'Sabies que…?', 'Le savais-tu ?'],
        length: ['Longitud', 'Length', 'Luzera', 'Lonxitude', 'Longitud', 'Longueur'],
        source: ['Nace en', 'Rises in', 'Iturburua', 'Nace en', 'Neix a', 'Prend sa source'],
        mouth: ['Desemboca en', 'Flows into', 'Itsasoratzea', 'Desemboca en', 'Desemboca a', 'Se jette dans'],
        pop: ['Población', 'Population', 'Biztanleria', 'Poboación', 'Població', 'Population'],
        area: ['Superficie', 'Area', 'Azalera', 'Superficie', 'Superfície', 'Superficie'],
        langs: ['Idiomas', 'Languages', 'Hizkuntzak', 'Idiomas', 'Idiomes', 'Langues'],
        cur: ['Moneda', 'Currency', 'Moneta', 'Moeda', 'Moneda', 'Monnaie'],
        neigh: ['Vecinos', 'Borders', 'Mugakideak', 'Veciños', 'Veïns', 'Voisins'],
        known: ['Famoso por', 'Known for', 'Ezaguna honengatik', 'Famoso por', 'Famós per', 'Connu pour'],
        height: ['Altura', 'Height', 'Altuera', 'Altura', 'Alçada', 'Altitude'],
        where: ['Dónde está', 'Where', 'Non dago', 'Onde está', 'On és', 'Où'],
        provs: ['Provincias', 'Provinces', 'Probintziak', 'Provincias', 'Províncies', 'Provinces'],
        inCcaa: ['Comunidad', 'Region', 'Erkidegoa', 'Comunidade', 'Comunitat', 'Région'],
        highest: ['Punto más alto', 'Highest point', 'Punturik altuena', 'Punto máis alto', 'Punt més alt', 'Point culminant'],
        rivers: ['Ríos', 'Rivers', 'Ibaiak', 'Ríos', 'Rius', 'Fleuves'],
        offLang: ['Otras lenguas oficiales', 'Other official languages', 'Beste hizkuntza ofizialak', 'Outras linguas oficiais', 'Altres llengües oficials', 'Autres langues officielles'],
        million: ['millones', 'million', 'milioi', 'millóns', 'milions', 'millions'],
        thousand: ['mil', 'thousand', 'mila', 'mil', 'mil', 'mille'],
        kindL: ['Tipo', 'Type', 'Mota', 'Tipo', 'Tipus', 'Type'],
        peakK: ['Pico', 'Peak', 'Gailurra', 'Pico', 'Cim', 'Sommet'],
        rangeK: ['Cordillera', 'Mountain range', 'Mendilerroa', 'Cordilleira', 'Serralada', 'Chaîne'],
        endMastered: ['nuevos dominados', 'newly mastered', 'berri menderatuak', 'novos dominados', 'nous dominats', 'nouveaux maîtrisés'],
        finish: ['Terminar', 'Finish', 'Amaitu', 'Rematar', 'Acabar', 'Terminer'],
        mdReview: ['Repasar', 'Review', 'Errepasatu', 'Repasar', 'Repassar', 'Réviser'],
        mdReviewD: ['Lo que te cuesta y lo que toca volver a ver', 'What is hard for you and what is due again', 'Zailtasuna duena eta berriz ikusi beharrekoa', 'O que che custa e o que toca volver ver', 'El que et costa i el que toca tornar a veure', 'Ce qui est difficile et ce qui est à revoir'],
        noReview: ['Nada que repasar por ahora. ¡Buen trabajo!', 'Nothing to review right now. Good job!', 'Oraingoz ez dago errepasatzeko ezer. Lan ona!', 'Nada que repasar por agora. Bo traballo!', 'Res per repassar ara. Bona feina!', 'Rien à réviser pour l’instant. Bravo !'],
        toReview: ['{n} por repasar', '{n} to review', '{n} errepasatzeko', '{n} por repasar', '{n} per repassar', '{n} à réviser'],
        summary: ['{a} lugares dominados · {b} por repasar', '{a} places mastered · {b} to review', '{a} leku menderatuta · {b} errepasatzeko', '{a} lugares dominados · {b} por repasar', '{a} llocs dominats · {b} per repassar', '{a} lieux maîtrisés · {b} à réviser'],
        mdFlag: ['Banderas', 'Flags', 'Banderak', 'Bandeiras', 'Banderes', 'Drapeaux'],
        mdFlagD: ['Reconoce cada país por su bandera', 'Recognise each country by its flag', 'Ezagutu herrialde bakoitza bere banderagatik', 'Recoñece cada país pola súa bandeira', 'Reconeix cada país per la seva bandera', 'Reconnais chaque pays à son drapeau'],
        qFlagFind: ['¿De qué país es esta bandera? Tócalo en el mapa', 'Which country has this flag? Tap it on the map', 'Zein herrialderena da bandera hau? Ukitu mapan', 'De que país é esta bandeira? Tócao no mapa', 'De quin país és aquesta bandera? Toca’l al mapa', 'À quel pays est ce drapeau ? Touche-le sur la carte'],
        qFlagName: ['¿De qué país es esta bandera?', 'Which country has this flag?', 'Zein herrialderena da bandera hau?', 'De que país é esta bandeira?', 'De quin país és aquesta bandera?', 'À quel pays est ce drapeau ?'],
        timed: ['Contrarreloj', 'Against the clock', 'Denboraren aurka', 'Contrarreloxo', 'Contrarellotge', 'Contre la montre'],
        timeUp: ['¡Se acabó el tiempo!', 'Time is up!', 'Denbora bukatu da!', 'Rematou o tempo!', 'S’ha acabat el temps!', 'Temps écoulé !'],
        search: ['Buscar un lugar…', 'Search a place…', 'Bilatu leku bat…', 'Buscar un lugar…', 'Cerca un lloc…', 'Chercher un lieu…'],
        gWorld: ['El mundo', 'The world', 'Mundua', 'O mundo', 'El món', 'Le monde'],
        gSpain: ['España', 'Spain', 'Espainia', 'España', 'Espanya', 'Espagne'],
        gEus: ['Euskadi', 'Euskadi', 'Euskadi', 'Euskadi', 'Euskadi', 'Euskadi'],
        gNature: ['Ríos y montañas', 'Rivers and mountains', 'Ibaiak eta mendiak', 'Ríos e montañas', 'Rius i muntanyes', 'Fleuves et montagnes'],
        meus: ['Euskadi: territorios', 'Euskadi: territories', 'Euskadi: lurraldeak', 'Euskadi: territorios', 'Euskadi: territoris', 'Euskadi : territoires'],
        meustown: ['Euskadi: localidades', 'Euskadi: towns', 'Euskadi: herriak', 'Euskadi: localidades', 'Euskadi: localitats', 'Euskadi : villes'],
        meusriv: ['Euskadi: ríos', 'Euskadi: rivers', 'Euskadi: ibaiak', 'Euskadi: ríos', 'Euskadi: rius', 'Euskadi : fleuves'],
        meusmont: ['Euskadi: montañas', 'Euskadi: mountains', 'Euskadi: mendiak', 'Euskadi: montañas', 'Euskadi: muntanyes', 'Euskadi : montagnes'],
        townK: ['Localidad', 'Town', 'Herria', 'Localidade', 'Localitat', 'Ville'],
        terr: ['Territorio', 'Territory', 'Lurraldea', 'Territorio', 'Territori', 'Territoire'],
        zoomTip: ['Pellizca o usa la rueda para acercar', 'Pinch or use the wheel to zoom', 'Atximurtu edo erabili gurpila zoom egiteko', 'Pellizca ou usa a roda para achegar', 'Pessiga o usa la roda per apropar', 'Pince ou utilise la molette pour zoomer']
    };

    // ---- Spain tables: [es, local name, capital, en] ----
    const CCAA = {
        'Andalucía': ['Andalucía', null, 'Sevilla'],
        'Aragón': ['Aragón', null, 'Zaragoza'],
        'Principado de Asturias': ['Asturias', null, 'Oviedo'],
        'Illes Balears': ['Islas Baleares', 'Illes Balears', 'Palma', 'Balearic Islands'],
        'Canarias': ['Canarias', null, '', 'Canary Islands'],
        'Cantabria': ['Cantabria', null, 'Santander'],
        'Castilla-La Mancha': ['Castilla-La Mancha', null, 'Toledo'],
        'Castilla y León': ['Castilla y León', null, 'Valladolid'],
        'Cataluña/Catalunya': ['Cataluña', 'Catalunya', 'Barcelona', 'Catalonia'],
        'Comunitat Valenciana': ['Comunidad Valenciana', 'Comunitat Valenciana', 'Valencia', 'Valencian Community'],
        'Extremadura': ['Extremadura', null, 'Mérida'],
        'Galicia': ['Galicia', 'Galiza', 'Santiago de Compostela'],
        'La Rioja': ['La Rioja', null, 'Logroño'],
        'Comunidad de Madrid': ['Madrid', null, 'Madrid'],
        'Región de Murcia': ['Murcia', null, 'Murcia'],
        'Comunidad Foral de Navarra': ['Navarra', 'Nafarroa', 'Pamplona'],
        'País Vasco/Euskadi': ['País Vasco', 'Euskadi', 'Vitoria-Gasteiz', 'Basque Country'],
        'Ciudad Autónoma de Ceuta': ['Ceuta', null, 'Ceuta'],
        'Ciudad Autónoma de Melilla': ['Melilla', null, 'Melilla']
    };
    const PROV_ES = { 'Alacant/Alicante': ['Alicante', 'Alacant'], 'Castelló/Castellón': ['Castellón', 'Castelló'], 'València/Valencia': ['Valencia', 'València'], 'Araba/Álava': ['Álava', 'Araba'], 'Illes Balears': ['Baleares', 'Illes Balears'] };

    const MAPS = [
        { id: 'world', icon: '🌍', kind: 'country', store: 'world', cont: null },
        { id: 'EU', icon: '🏰', kind: 'country', store: 'world', cont: 'EU' },
        { id: 'AF', icon: '🦁', kind: 'country', store: 'world', cont: 'AF' },
        { id: 'AS', icon: '🐼', kind: 'country', store: 'world', cont: 'AS' },
        { id: 'NA', icon: '🦅', kind: 'country', store: 'world', cont: 'NA' },
        { id: 'SA', icon: '🦙', kind: 'country', store: 'world', cont: 'SA' },
        { id: 'OC', icon: '🦘', kind: 'country', store: 'world', cont: 'OC' },
        { id: 'es', icon: '🏛️', kind: 'region', store: 'es', src: 'ccaa' },
        { id: 'prov', icon: '📍', kind: 'region', store: 'prov', src: 'prov' },
        { id: 'rivw', icon: '🌊', kind: 'river', store: 'rivw', src: 'world' },
        { id: 'rives', icon: '🏞️', kind: 'river', store: 'rives', src: 'spain' },
        { id: 'eus', icon: '🌿', kind: 'region', store: 'eus', src: 'eus' },
        { id: 'eustown', icon: '🏘️', kind: 'peak', store: 'eustown', src: 'eustown' },
        { id: 'eusriv', icon: '💧', kind: 'river', store: 'eusriv', src: 'eus' },
        { id: 'eusmont', icon: '🗻', kind: 'peak', store: 'eusmont', src: 'eusmont' },
        { id: 'mont', icon: '🏔️', kind: 'peak', store: 'mont', src: 'world' },
        { id: 'montes', icon: '⛰️', kind: 'peak', store: 'montes', src: 'spain' }
    ];
    // hues avoid green/amber, which are reserved for the mastery colours
    const GROUPS = [['gWorld', ['world', 'EU', 'AF', 'AS', 'NA', 'SA', 'OC']], ['gSpain', ['es', 'prov']], ['gEus', ['eus', 'eustown', 'eusriv', 'eusmont']], ['gNature', ['rivw', 'rives', 'mont', 'montes']]];
    const CONT_COLORS = { EU: 232, AF: 352, AS: 190, NA: 266, SA: 312, OC: 208 };
const REGION_HUES = [205, 235, 265, 295, 325, 352, 185];

    // ---- pure helpers (tested) ----
    const langIdx = l => Math.max(0, LANGS.indexOf(l));
    function txt(key, lang, vars) {
        const row = UI[key]; if (!row) return key;
        let s = row[langIdx(lang)] || row[1] || row[0];
        if (vars) Object.keys(vars).forEach(k => { s = s.split('{' + k + '}').join(vars[k]); });
        return s;
    }
    // Weak items first, then unseen, then known items that are due again (spaced days by streak), then the rest
    const DAYS = [0, 0, 1, 3, 7, 16, 35];
    function pickQuestions(ids, prog, n, rnd, now) {
        rnd = rnd || Math.random; prog = prog || {}; now = now || Date.now();
        const sh = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
        const weak = [], fresh = [], due = [], rest = [];
        ids.forEach(id => {
            const p = prog[id];
            if (!p) fresh.push(id);
            else if ((p.s || 0) < 2) weak.push(id);
            else if (p.t && now - p.t > DAYS[Math.min(DAYS.length - 1, p.s)] * 864e5) due.push(id);
            else rest.push(id);
        });
        return sh(weak).concat(sh(fresh), sh(due), sh(rest)).slice(0, n);
    }
    function pickOptions(targetId, pool, n, rnd) {
        rnd = rnd || Math.random;
        const others = pool.filter(x => x !== targetId);
        for (let i = others.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [others[i], others[j]] = [others[j], others[i]]; }
        const out = others.slice(0, Math.max(0, n - 1)).concat([targetId]);
        for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
        return out;
    }
    // weak (not 2 right in a row) or mastered but overdue for its spaced interval
    function needsReview(p, now) {
        if (!p) return false; now = now || Date.now();
        if ((p.s || 0) < 2) return true;
        return !!(p.t && now - p.t > DAYS[Math.min(DAYS.length - 1, p.s)] * 864e5);
    }
    function masteryOf(p) { if (!p) return 'new'; return (p.s || 0) >= 2 ? 'ok' : 'weak'; }
    function recordAnswer(p, correct) {
        p = p || { o: 0, f: 0, s: 0 };
        const t = Date.now(); return correct ? { o: p.o + 1, f: p.f, s: p.s + 1, t: t } : { o: p.o, f: p.f + 1, s: 0, t: t };
    }
    // Expand a wanted box {x,y,w,h} to the container aspect ratio (so the map always fills the stage)
    function fitBox(box, cw, ch) {
        const asp = ch / cw; let w = Math.max(box.w, box.h / asp); const h = w * asp;
        const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
        return { x: cx - w / 2, y: cy - h / 2, w: w, h: h };
    }

    // ---- state ----
    const S = { timed: (function () { try { return localStorage.getItem('mapas_timed') === '1'; } catch (e) { return false; } })(), user: null, screen: 'home', def: null, map: null, mode: null, diff: 'all', run: null, progs: {}, cam: null, target: null, els: {}, selected: null, dataP: {} };
    const $ = id => document.getElementById(id);
    const lang = () => { const l = ((window.PlatformI18n && PlatformI18n.currentLanguage) || 'es').slice(0, 2); return LANGS.indexOf(l) >= 0 ? l : 'es'; };
    const t = (k, v) => txt(k, lang(), v);
    function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    const NS = 'http://www.w3.org/2000/svg';
    function sv(tag, attrs, cls) { const e = document.createElementNS(NS, tag); if (attrs) Object.keys(attrs).forEach(k => e.setAttribute(k, attrs[k])); if (cls) e.setAttribute('class', cls); return e; }
    function owner() {
        const u = S.user; if (!u) return 'guest';
        let pid = null; try { pid = PlatformFirestore._pid(u.uid); } catch (e) { /* no profile */ }
        return u.uid + (pid ? '_' + pid : '');
    }
    const storeKey = s => 'mapas_' + s + '_' + owner();
    function loadProg(s) { try { return JSON.parse(localStorage.getItem(storeKey(s))) || {}; } catch (e) { return {}; } }
    function saveProg(s, v) { try { localStorage.setItem(storeKey(s), JSON.stringify(v)); } catch (e) { /* private mode */ } }

    // ---- data ----
    function loadData(name) {
        if (S.dataP[name]) return S.dataP[name];
        S.dataP[name] = new Promise((res, rej) => {
            if (window.MapData && window.MapData[name]) return res(window.MapData[name]);
            const s = document.createElement('script'); s.src = 'data/' + name + '.js';
            s.onload = () => res(window.MapData[name]); s.onerror = () => { S.dataP[name] = null; rej(new Error('data')); };
            document.head.appendChild(s);
        });
        return S.dataP[name];
    }
    const dnCache = {};
    function regionName(iso, fb) {
        const l = lang();
        try { if (!dnCache[l]) dnCache[l] = new Intl.DisplayNames([l], { type: 'region' }); const n = dnCache[l].of(iso); if (n && n !== iso) return n; } catch (e) { /* old browser */ }
        return fb || iso;
    }
    function flagOf(iso) { if (!iso || iso.length !== 2) return ''; return String.fromCodePoint.apply(null, iso.toUpperCase().split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65)); }
    const smallArea = 60; // px² in the 1000x500 projection

    const maxDim = b => Math.max(b[2] - b[0], b[3] - b[1]);
    function buildMap(def, W, SP) {
        const items = [], ctx = [], out = { def, kind: def.kind, items, ctx, vb: [0, 0, 1000, 500], border: null, oceans: [], lakes: [], caps: {} };
        const worldCtx = lab => W.countries.forEach(c => { const f = c.i && W.facts[c.i]; ctx.push({ d: c.d, cont: f && f[1], lab: lab && c.i ? { iso: c.i, ne: c.n, x: c.x, y: c.y, a: c.a } : null }); });
        const spainCtx = () => SP.ccaa.forEach(r => ctx.push({ d: r.d, lab: /^Gibraltar/.test(r.n) ? null : { raw: r.n, x: r.x, y: r.y, a: r.a } }));
        const EUP = ['Araba/Álava', 'Bizkaia', 'Gipuzkoa'];
        const rv = r => ({ eu: r.eu, id: r.id, d: r.d, x: r.x, y: r.y, a: Math.pow(maxDim(r.b), 2), b: r.b, es: r.es, en: r.en, c: r.c, km: r.km, kmNote: r.kmNote, src: r.src, mouth: r.mouth, fact: r.fact });
        const pk = m => ({ id: m.id, x: m.x, y: m.y, a: 40, es: m.es, en: m.en, eu: m.eu, m: m.m, mk: m.kind || 'town', where: m.where, fact: m.fact, known: m.known, territory: m.territory, inf: m.pop != null ? { pop: m.pop } : undefined });
        const euCtx = () => { SP.ccaa.forEach(r => { if (r.n !== 'País Vasco/Euskadi') ctx.push({ d: r.d, lab: /^Gibraltar/.test(r.n) ? null : { raw: r.n, x: r.x, y: r.y, a: r.a } }); }); SP.prov.forEach(r => { if (EUP.includes(r.n)) ctx.push({ d: r.d, lab: { raw: r.n, prov: true, x: r.x, y: r.y, a: r.a * 4 } }); }); };
        if (def.kind === 'country') {
            W.countries.forEach(c => {
                const f = c.i && W.facts[c.i];
                const inMap = f && f[3] && (!def.cont || f[1] === def.cont);
                if (inMap) items.push({ id: c.i, iso: c.i, d: c.d, x: c.x, y: c.y, a: c.a, b: c.b, cont: f[1], level: f[2], neName: c.n, cap: f[0], info: W.info && W.info[c.i] });
                else ctx.push({ d: c.d, cont: f && f[1] });
            });
            W.caps.forEach(c => { if (!out.caps[c.i]) out.caps[c.i] = c; });
            out.lakes = W.lakes; out.oceans = W.oceans; out.vb = def.cont ? W.views[def.cont] : [0, 0, W.w, W.h];
        } else if (def.kind === 'region') {
            if (def.src === 'eus') { SP.ccaa.forEach(r => { if (r.n !== 'País Vasco/Euskadi') ctx.push({ d: r.d, lab: /^Gibraltar/.test(r.n) ? null : { raw: r.n, x: r.x, y: r.y, a: r.a } }); }); }
            (def.src === 'ccaa' ? SP.ccaa : SP.prov).forEach(r => {
                if (/^Gibraltar/.test(r.n) || (def.src === 'eus' && !EUP.includes(r.n))) { if (def.src !== 'eus') ctx.push({ d: r.d }); return; }
                items.push({ id: r.n, d: r.d, x: r.x, y: r.y, a: def.src === 'eus' ? r.a * 4 : r.a, raw: r.n, cap: def.src === 'ccaa' ? (CCAA[r.n] || [])[2] : (r.inf && r.inf.cap ? r.inf.cap.es : ''), inf: r.inf });
            });
            if (def.src === 'eus') { out.vb = SP.eus.vb; } else { out.border = SP.border; out.vb = SP.vb || [0, 0, SP.w, SP.h]; }
        } else if (def.src === 'eus' || def.src === 'eustown' || def.src === 'eusmont') {
            euCtx(); out.vb = SP.eus.vb;
            (def.kind === 'river' ? SP.eus.rivers.map(rv) : def.src === 'eustown' ? SP.eus.towns.map(pk) : SP.eus.mount.map(pk)).forEach(i => items.push(i));
        } else if (def.src === 'world') {
            worldCtx(true); out.lakes = W.lakes; out.oceans = W.oceans; out.vb = [0, 0, W.w, W.h];
            (def.kind === 'river' ? W.rivers.map(rv) : (W.mount || []).map(pk)).forEach(i => items.push(i));
        } else {
            spainCtx(); out.border = SP.border; out.vb = SP.vb || [0, 0, SP.w, SP.h];
            (def.kind === 'river' ? SP.rivers.map(rv) : (SP.mount || []).map(pk)).forEach(i => items.push(i));
        }
        return out;
    }

    // ---- display names ----
    function provName(raw) { const l = lang(), p = PROV_ES[raw]; if (p) return (l === 'eu' || l === 'ca' || l === 'gl') ? p[1] : p[0]; return raw; }
    function nameOf(it) {
        const l = lang(), k = S.map.kind;
        if (l === 'eu' && it.eu && (k === 'river' || k === 'peak')) return it.eu;
        if (k === 'country') return regionName(it.iso, it.neName);
        if (k === 'river' || k === 'peak') return (l === 'en' || l === 'fr') ? it.en : it.es;
        if (S.map.def.src === 'ccaa') {
            const r = CCAA[it.raw]; if (!r) return it.raw;
            if (l === 'en') return r[3] || r[0];
            if (l === 'eu' || l === 'ca' || l === 'gl') return r[1] || r[0];
            return r[0];
        }
        return provName(it.raw);
    }
    function capOf(it) {
        if (S.map.kind === 'country') {
            if (lang() === 'es') return it.cap || '';
            const c = S.map.caps[it.iso]; return (c && c.n) || it.cap || '';
        }
        return it.cap || '';
    }
    function contName(code) { return t('m' + code); }
    const hasCaps = () => S.map && (S.map.kind === 'country' || S.map.def.src === 'ccaa');
    function poolIds() {
        let its = S.map.items;
        if (S.map.kind === 'country' && S.diff === 'easy') its = its.filter(i => i.level <= 2);
        if (S.mode === 'cap') its = its.filter(i => capOf(i));
        if (S.mode === 'review') { const pg = S.progs[S.def.store] || {}; its = its.filter(i => needsReview(pg[i.id])); }
        return its.map(i => i.id);
    }
    const itemById = id => S.map.items.find(i => i.id === id);

    // ---- screens ----
    function show(id) {
        S.screen = id;
        document.body.classList.toggle('mp-full', id === 'mp-game');
        ['mp-home', 'mp-setup', 'mp-game', 'mp-end'].forEach(s => { $(s).hidden = s !== id; });
        window.scrollTo(0, 0);
    }
    function rememberTotal(id, n) { try { const o = JSON.parse(localStorage.getItem('mapas_totals') || '{}'); o[id] = n; localStorage.setItem('mapas_totals', JSON.stringify(o)); } catch (e) { /* ignore */ } }
    function totalFor(def) {
        try { const o = JSON.parse(localStorage.getItem('mapas_totals') || '{}'); if (o[def.id]) return o[def.id]; } catch (e) { /* ignore */ }
        // totals known without loading data: use cached sizes after first load, else static estimates
        const est = { world: 193, EU: 46, AF: 54, AS: 48, NA: 23, SA: 12, OC: 14, es: 18, prov: 50, rivw: 49, rives: 30, mont: 36, montes: 30 };
        return est[def.id] || 0;
    }
    function renderHome() {
        $('mp-h1').textContent = t('title'); $('mp-sub').textContent = t('sub');
        const box = $('mp-maps'); box.textContent = '';
        const cache = {};
        let sumM = 0, sumD = 0;
        let grid = box;
        const gOf = {}; GROUPS.forEach(([gk, ids]) => ids.forEach(i => { gOf[i] = gk; }));
        let lastG = null;
        MAPS.slice().sort((x, y) => GROUPS.findIndex(g => g[1].includes(x.id)) - GROUPS.findIndex(g => g[1].includes(y.id)) || GROUPS.find(g => g[1].includes(x.id))[1].indexOf(x.id) - GROUPS.find(g => g[1].includes(y.id))[1].indexOf(y.id)).forEach(def => {
            if (gOf[def.id] !== lastG) { lastG = gOf[def.id]; box.appendChild(el('h3', 'mp-gh', t(lastG))); grid = el('div', 'mp-grid'); box.appendChild(grid); }
            const prog = cache[def.store] || (cache[def.store] = loadProg(def.store));
            const ids = Object.keys(prog);
            const tot = W_FACTS ? (def.cont ? W_FACTS[def.cont] : def.id === 'world' ? W_FACTS.world : totalFor(def)) : totalFor(def);
            const inMap = id => !def.cont || !W_FACTS || W_CONT[id] === def.cont;
            const mastered = ids.filter(id => (prog[id].s || 0) >= 2 && inMap(id)).length;
            const due = ids.filter(id => needsReview(prog[id]) && inMap(id)).length;
            if (!def.cont) { sumM += ids.filter(id => (prog[id].s || 0) >= 2).length; sumD += ids.filter(id => needsReview(prog[id])).length; }
            const b = el('button', 'mp-mapcard'); b.type = 'button'; b.dataset.map = def.id;
            b.appendChild(el('span', 'ic', def.icon));
            const tx = el('span', 'tx'); tx.appendChild(el('b', '', t('m' + def.id)));
            tx.appendChild(el('small', '', t('mastered', { a: Math.min(mastered, tot), b: tot }) + (due ? ' · ' + t('toReview', { n: due }) : '')));
            const bar = el('i', 'bar'); const fill = el('u'); fill.style.width = Math.min(100, Math.round(100 * mastered / Math.max(1, tot))) + '%'; bar.appendChild(fill); tx.appendChild(bar);
            b.appendChild(tx);
            b.onclick = () => openSetup(def);
            grid.appendChild(b);
        });
        const sm = $('mp-sum'); if (sm) { sm.hidden = !(sumM || sumD); sm.textContent = '🧭 ' + t('summary', { a: sumM, b: sumD }); }
    }
    let W_FACTS = null, W_CONT = {};
    function indexWorld(W) {
        if (W_FACTS) return;
        W_FACTS = {}; W_CONT = {};
        Object.keys(W.facts).forEach(i => { const f = W.facts[i]; if (f[3]) { W_FACTS[f[1]] = (W_FACTS[f[1]] || 0) + 1; W_CONT[i] = f[1]; } });
        W_FACTS.world = Object.keys(W_CONT).length;
    }

    function openSetup(def) {
        S.def = def;
        $('mp-setuptitle').textContent = (def.icon || '') + ' ' + t('m' + def.id);
        const modes = $('mp-modes'); modes.textContent = '';
        const list = [['explore', 'mdExplore', 'mdExploreD', '🔍'], ['find', 'mdFind', 'mdFindD', '🎯'], ['name', 'mdName', 'mdNameD', '🏷️']];
        if (def.kind === 'country' || def.src === 'ccaa' || def.src === 'eus') list.push(['cap', 'mdCap', 'mdCapD', '⭐']);
        if (def.kind === 'country') list.push(['flag', 'mdFlag', 'mdFlagD', '🚩']);
        const pg = loadProg(def.store);
        const dueN = Object.keys(pg).filter(id => needsReview(pg[id]) && (!def.cont || !W_FACTS || W_CONT[id] === def.cont)).length;
        list.push(['review', 'mdReview', 'mdReviewD', '🔁']);
        list.forEach(([m, k, kd, ic]) => {
            const b = el('button', 'mp-modecard'); b.type = 'button'; b.dataset.mode = m;
            if (m === 'review' && !dueN) { b.disabled = true; b.classList.add('off'); }
            b.appendChild(el('span', 'ic', ic));
            const tx = el('span', 'tx'); tx.appendChild(el('b', '', t(k) + (m === 'review' && dueN ? ' (' + dueN + ')' : ''))); tx.appendChild(el('small', '', m === 'review' && !dueN ? t('noReview') : t(kd))); b.appendChild(tx);
            b.onclick = () => startMap(def, m);
            modes.appendChild(b);
        });
        const dr = $('mp-diff'); dr.textContent = ''; dr.hidden = false;
        if (def.kind === 'country') [['all', 'all'], ['easy', 'easy']].forEach(([v, k]) => {
            const c = el('button', 'mp-chip' + (S.diff === v ? ' on' : ''), t(k)); c.type = 'button';
            c.onclick = () => { S.diff = v; openSetup(def); }; dr.appendChild(c);
        });
        const tc = el('button', 'mp-chip timed' + (S.timed ? ' on' : ''), '⏱️ ' + t('timed')); tc.type = 'button'; tc.setAttribute('aria-pressed', String(!!S.timed));
        tc.onclick = () => { S.timed = !S.timed; try { localStorage.setItem('mapas_timed', S.timed ? '1' : '0'); } catch (e) { /* ignore */ } openSetup(def); }; dr.appendChild(tc);
        show('mp-setup');
    }

    // ---- map rendering ----
    function hue(it) { const id = String(it.id || ''), base = CONT_COLORS[it.cont]; const v = (id.charCodeAt(0) + id.charCodeAt(id.length - 1)) % 5; return base != null ? base + v * 6 : REGION_HUES[(id.charCodeAt(0) + id.length) % REGION_HUES.length]; }
    function colorFor(it) { const h = hue(it); return 'hsl(' + h + ',58%,' + (68 + ((String(it.id).charCodeAt(1) || 0) % 4) * 3) + '%)'; }

    async function startMap(def, mode) {
        S.def = def; S.mode = mode; show('mp-game');
        ['mp-info', 'mp-learn', 'mp-options', 'mp-nextrow', 'mp-toast', 'mp-sugg'].forEach(i => { $(i).hidden = true; }); $('mp-legend').style.visibility = '';
        $('mp-loading').hidden = false; $('mp-loading').textContent = t('loading');
        $('mp-prompt').textContent = ''; $('mp-count').textContent = '';
        try {
            const needWorld = def.kind === 'country' || def.src === 'world';
            const needSpain = def.kind === 'region' || ['spain', 'eus', 'eustown', 'eusmont'].includes(def.src);
            const [W, SP] = await Promise.all([needWorld ? loadData('world') : null, needSpain ? loadData('spain') : null]);
            if (W) indexWorld(W);
            S.map = buildMap(def, W, SP);
        } catch (e) { $('mp-loading').textContent = '⚠️'; return; }
        $('mp-loading').hidden = true;
        rememberTotal(def.id, S.map.items.length);
        S.progs[def.store] = loadProg(def.store);
        drawMap();
        if (mode === 'explore') startExplore(); else startRun();
    }

    function stageSize() { const r = $('mp-stage').getBoundingClientRect(); return { w: Math.max(200, r.width), h: Math.max(200, r.height) }; }
    function homeBox() {
        const v = S.map.vb, s = stageSize(), top = 66;
        const f = fitBox({ x: v[0], y: v[1], w: v[2], h: v[3] }, s.w, s.h), u = f.w / s.w;
        return fitBox({ x: f.x, y: f.y - top * u, w: f.w, h: f.h + top * u }, s.w, s.h); // leave room for the top bar
    }
    // Space taken by floating panels: the camera centres items in what is left
    function bands() {
        const st = stageSize(), vis = e => e && !e.hidden, wide = st.w >= 760; let bottom = 0, left = 0;
        ['mp-info', 'mp-learn'].forEach(id => { const e = $(id); if (vis(e)) { if (wide) left = Math.max(left, e.offsetWidth + 10); else bottom = Math.max(bottom, e.offsetHeight + 74); } });
        if (vis($('mp-options'))) bottom = Math.max(bottom, $('mp-options').offsetHeight + 10);
        if (vis($('mp-nextrow')) && !wide && !vis($('mp-learn'))) bottom = Math.max(bottom, $('mp-nextrow').offsetHeight + 10);
        return { top: 66, bottom: bottom, left: left };
    }
    function applyCam() { const c = S.cam; $('mp-svg').setAttribute('viewBox', c.x.toFixed(2) + ' ' + c.y.toFixed(2) + ' ' + c.w.toFixed(2) + ' ' + c.h.toFixed(2)); S.dirty = true; }
    const scaleNow = () => stageSize().w / S.cam.w;
    function gotoBox(box, animate) {
        const s = stageSize(); S.target = fitBox(box, s.w, s.h);
        const full = homeBox(), maxW = full.w * 1.25, minW = Math.max(6, full.w / 40);
        const cx0 = S.target.x + S.target.w / 2, cy0 = S.target.y + S.target.h / 2;
        S.target.w = Math.min(maxW, Math.max(minW, S.target.w)); S.target.h = S.target.w * s.h / s.w;
        S.target.x = cx0 - S.target.w / 2; S.target.y = cy0 - S.target.h / 2;
        if (!animate) { S.cam = Object.assign({}, S.target); applyCam(); } else tick();
    }
    function tick() {
        if (S.raf) return;
        const step = () => {
            S.raf = null; const c = S.cam, g = S.target; if (!g) return;
            const k = 0.2;
            c.x += (g.x - c.x) * k; c.y += (g.y - c.y) * k; c.w += (g.w - c.w) * k; c.h += (g.h - c.h) * k;
            applyCam();
            if (Math.abs(g.x - c.x) + Math.abs(g.y - c.y) + Math.abs(g.w - c.w) > 0.15) S.raf = requestAnimationFrame(step);
            else { Object.assign(c, g); applyCam(); }
        };
        S.raf = requestAnimationFrame(step);
    }
    function zoomAt(cx, cy, f) { // client coords, factor f (>1 zoom in)
        const p = toSvg(cx, cy), g = S.target || S.cam;
        const full = homeBox(); const nw = Math.min(full.w * 1.25, Math.max(6, g.w / f)); const r = nw / g.w;
        const nx = p.x - (p.x - g.x) * r, ny = p.y - (p.y - g.y) * r;
        S.target = { x: nx, y: ny, w: nw, h: g.h * r };
        S.cam = Object.assign({}, S.target); applyCam();
    }
    function toSvg(cx, cy) { const r = $('mp-svg').getBoundingClientRect(); return { x: S.cam.x + (cx - r.left) / r.width * S.cam.w, y: S.cam.y + (cy - r.top) / r.height * S.cam.h }; }

    function drawMap() {
        const svg = $('mp-svg'); svg.textContent = ''; S.els = {}; S.labels = []; S.tiny = []; S.selected = null;
        const m = S.map;
        const defs = sv('defs');
        defs.innerHTML = '<linearGradient id="mpOcean" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4edfa"/><stop offset="1" stop-color="#a9d6ee"/></linearGradient>';
        svg.appendChild(defs);
        svg.appendChild(sv('rect', { x: -6000, y: -6000, width: 13000, height: 13000, fill: 'url(#mpOcean)', class: 'mp-sea' }));
        const gCtx = sv('g', null, 'mp-ctx'), gIt = sv('g', null, 'mp-items'), gRv = sv('g'), gMk = sv('g'), gLb = sv('g', null, 'mp-labels'), gHit = sv('g');
        [gCtx, gIt, gRv, gMk, gLb, gHit].forEach(g => svg.appendChild(g));
        S.layers = { gMk, gLb };
        m.ctx.forEach(c => gCtx.appendChild(sv('path', { d: c.d }, 'mp-cx')));
        m.lakes.forEach(d => gCtx.appendChild(sv('path', { d: d }, 'mp-lake')));
        if (m.border) gCtx.appendChild(sv('path', { d: m.border }, 'mp-border'));
        if ((m.kind === 'country' && !m.def.cont) || m.def.src === 'world' && m.kind !== 'country') {
            m.oceans.forEach(o => { const x = sv('text', { x: o.x, y: o.y }, 'mp-ocean'); x.textContent = lang() === 'en' || lang() === 'fr' ? o.en : o.es; gLb.appendChild(x); });
        }
        m.ctx.forEach(c => { if (c.lab) addCtxLabel(c.lab); });
        m.items.forEach(it => {
            if (m.kind === 'river') {
                const w = it.km > 3500 ? 4.2 : it.km > 1500 ? 3.5 : it.km > 600 ? 2.9 : 2.3;
                const halo = sv('path', { d: it.d }, 'mp-riverhalo'); halo.style.setProperty('--w', (w + 3.5) + 'px'); gRv.appendChild(halo);
                const p = sv('path', { d: it.d, 'data-id': it.id }, 'mp-river'); p.style.setProperty('--w', w + 'px');
                const hit = sv('path', { d: it.d, 'data-id': it.id }, 'mp-riverhit');
                gRv.appendChild(p); gRv.appendChild(hit); S.els[it.id] = p;
            } else if (m.kind === 'peak') {
                const one = '<path class="b" d="M-1,.85L0,-1L1,.85Z"/><path class="sh" d="M0,-1L1,.85L.12,.85Z"/><path class="cap" d="M-.34,-.35L0,-1L.34,-.35L.12,-.22L0,-.4L-.14,-.22Z"/>';
                const p = sv('g', { 'data-id': it.id }, 'mp-peak' + (it.mk === 'range' ? ' range' : it.mk === 'town' ? ' town' : ''));
                p.innerHTML = it.mk === 'town' ? '<circle class="b" r="1"/>' : it.mk === 'range' ? '<g transform="translate(-1.15,.4) scale(.72)">' + one + '</g><g transform="translate(1.1,.5) scale(.62)">' + one + '</g><g transform="translate(0,-.1)">' + one + '</g>' : one;
                gHit.appendChild(p); S.els[it.id] = p; S.tiny.push({ it, dot: p, peak: true });
            } else {
                const p = sv('path', { d: it.d, 'data-id': it.id, fill: colorFor(it) }, 'mp-it');
                gIt.appendChild(p); S.els[it.id] = p;
                if (it.a < 400) {
                    const dot = sv('circle', { cx: it.x, cy: it.y, r: 3, 'data-id': it.id, fill: colorFor(it) }, 'mp-dot');
                    gHit.appendChild(dot); S.tiny.push({ it, dot });
                }
            }
        });
        S.cam = homeBox(); S.target = Object.assign({}, S.cam); applyCam();
        $('mp-stage').classList.toggle('river', m.kind === 'river');
    }

    function refreshOverlays() {
        if (!S.map) return;
        const sc = scaleNow();
        S.tiny.forEach(o => {
            if (o.peak) { o.dot.setAttribute('transform', 'translate(' + o.it.x + ' ' + o.it.y + ') scale(' + ((o.it.mk === 'range' ? 11 : o.it.mk === 'town' ? 5 : 8) / sc).toFixed(3) + ')'); return; }
            const px = o.it.a * sc * sc;
            o.dot.style.display = px < 30 ? '' : 'none';
            o.dot.setAttribute('r', (3 / sc).toFixed(2));
        });
        // labels: the bigger or more important ones win; any label that would overlap a placed one is hidden
        const st = stageSize(), placed = [], list = [];
        (S.labels || []).forEach(l => {
            const fs_ = l.ctx ? 10.5 : 12.5;
            l.node.setAttribute('font-size', (fs_ / sc).toFixed(2)); l.node.setAttribute('stroke-width', (3.2 / sc).toFixed(2));
            if (l.peak) l.node.setAttribute('y', (l.y + 15 / sc).toFixed(2));
            const big = l.a * sc * sc > Math.pow(l.len * 4.4, 2) * 0.6 || l.force;
            if (!big || l.hidden) { l.node.style.display = 'none'; return; }
            const px = (l.x - S.cam.x) / S.cam.w * st.w, py = (l.y - S.cam.y) / S.cam.h * st.h + (l.peak ? 15 : 0);
            if (px < -60 || py < -20 || px > st.w + 60 || py > st.h + 20) { l.node.style.display = 'none'; return; }
            list.push({ l, px, py, w: l.len * fs_ * 0.58 + 6, h: fs_ * 1.25, prio: l.force ? 1e12 : l.ctx ? l.a * 0.01 : ((l.it && ((l.it.inf && l.it.inf.pop) || l.it.m)) || 0) * 1e3 + l.a });
        });
        list.sort((p, q) => q.prio - p.prio).forEach(c => {
            const hit = !c.l.force && placed.some(r => Math.abs(r.px - c.px) < (r.w + c.w) / 2 && Math.abs(r.py - c.py) < (r.h + c.h) / 2);
            c.l.node.style.display = hit ? 'none' : '';
            if (!hit) placed.push(c);
        });
        const marks = S.layers.gMk.querySelectorAll('[data-fix]');
        marks.forEach(n => { const r = parseFloat(n.dataset.fix); n.setAttribute('r', (r / sc).toFixed(2)); n.setAttribute('stroke-width', (1.6 / sc).toFixed(2)); });
    }

    function addLabel(it, force) {
        const n = nameOf(it);
        const x = sv('text', { x: it.x, y: it.y, 'text-anchor': 'middle', 'dominant-baseline': 'middle', 'pointer-events': 'none' }, 'mp-lbl'); x.textContent = n;
        S.layers.gLb.appendChild(x); const l = { it, node: x, len: Math.max(3, n.length), a: it.a, x: it.x, y: it.y, peak: !!it.mk, force: !!force }; S.labels.push(l); return l;
    }
    function addCtxLabel(lab) {
        const n = lab.iso ? regionName(lab.iso, lab.ne) : lab.prov ? provName(lab.raw) : regionNameSpain(lab.raw);
        const x = sv('text', { x: lab.x, y: lab.y, 'text-anchor': 'middle', 'dominant-baseline': 'middle', 'pointer-events': 'none' }, 'mp-lbl ctx'); x.textContent = n;
        S.layers.gLb.appendChild(x); S.labels.push({ node: x, len: Math.max(3, n.length), a: lab.a, x: lab.x, y: lab.y, ctx: true });
    }
    function clearMarks() {
        S.layers.gMk.textContent = '';
        S.labels = S.labels.filter(l => { if (l.temp) { l.node.remove(); return false; } return true; });
    }
    function mark(it, kind) { // ring around item (kind: 'ping' pulsing, 'cap' capital dot)
        const c = sv('circle', { cx: it.x, cy: it.y, r: kind === 'cap' ? 4 : 16, 'data-fix': kind === 'cap' ? 4 : 16, fill: kind === 'cap' ? '#fde047' : 'none', stroke: kind === 'cap' ? '#78350f' : '#fde047' }, kind === 'cap' ? 'mp-cap' : 'mp-ping');
        S.layers.gMk.appendChild(c); return c;
    }
    function bboxOf(it) { if (it.mk) return { x: it.x - 6, y: it.y - 3, width: 12, height: 6 }; if (it.b) return { x: it.b[0], y: it.b[1], width: it.b[2] - it.b[0], height: it.b[3] - it.b[1] }; try { return S.els[it.id].getBBox(); } catch (e) { return { x: it.x - 10, y: it.y - 10, width: 20, height: 20 }; } }
    function focusItem(it, zoom, panel) {
        const b = bboxOf(it), pad = S.map.kind === 'river' ? 2 : zoom || 3.2;
        const w = Math.max(b.width, b.height * 2, 24) * pad, h = w / 2;
        let cx = b.x + b.width / 2, cy = b.y + b.height / 2;
        { const st = stageSize(), we = Math.max(w, h * st.w / st.h), u = we / st.w, bd = bands(); cx -= bd.left / 2 * u; cy -= (bd.top - bd.bottom) / 2 * u; }
        gotoBox({ x: cx - w / 2, y: cy - h / 2, w: w, h: h }, true);
    }

    // ---- gestures ----
    function setupGestures() {
        const svg = $('mp-svg'); const pts = new Map(); let drag = null, pinch = null, moved = false;
        svg.style.touchAction = 'none';
        svg.addEventListener('pointerdown', e => {
            pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (pts.size === 1) { drag = { x: e.clientX, y: e.clientY, cx: S.cam.x, cy: S.cam.y }; moved = false; }
            else if (pts.size === 2) { const a = [...pts.values()]; pinch = { d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1 }; moved = true; }
        });
        svg.addEventListener('pointermove', e => {
            if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (pts.size === 2 && pinch) {
                const a = [...pts.values()], d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1;
                zoomAt((a[0].x + a[1].x) / 2, (a[0].y + a[1].y) / 2, d / pinch.d); pinch.d = d; return;
            }
            if (pts.size === 1 && drag) {
                const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
                if (!moved && Math.hypot(dx, dy) > 7) { moved = true; try { svg.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ } }
                if (moved) { const sc = scaleNow(); S.cam.x = drag.cx - dx / sc; S.cam.y = drag.cy - dy / sc; S.target = Object.assign({}, S.cam); applyCam(); }
            }
        });
        const up = e => {
            const had = pts.has(e.pointerId); pts.delete(e.pointerId);
            if (had && e.type === 'pointerup' && pts.size === 0 && !moved) onTap(e.clientX, e.clientY);
            if (pts.size < 2) pinch = null; if (pts.size === 0) { drag = null; }
            else if (pts.size === 1) { const a = [...pts.values()][0]; drag = { x: a.x, y: a.y, cx: S.cam.x, cy: S.cam.y }; }
        };
        svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
        svg.addEventListener('wheel', e => { e.preventDefault(); zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.25 : 0.8); }, { passive: false });
        $('mp-zin').onclick = () => { const r = $('mp-svg').getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1.6); };
        $('mp-zout').onclick = () => { const r = $('mp-svg').getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1 / 1.6); };
        $('mp-zhome').onclick = () => gotoBox(boxOf(homeBox()), true);
    }
    const boxOf = b => ({ x: b.x, y: b.y, w: b.w, h: b.h });
    // micro-states are drawn as dots: a tap close to a visible dot picks that dot, even when a bigger neighbour lies underneath
    function nearestTiny(cx, cy) {
        const r = $('mp-svg').getBoundingClientRect(); let best = null, bd = 9;
        (S.tiny || []).forEach(o => {
            if (o.dot.style.display === 'none') return;
            const px = r.left + (o.it.x - S.cam.x) / S.cam.w * r.width, py = r.top + (o.it.y - S.cam.y) / S.cam.h * r.height;
            const d = Math.hypot(px - cx, py - cy); if (d < bd) { bd = d; best = o.it.id; }
        });
        return best;
    }
    function onTap(cx, cy) {
        let id = nearestTiny(cx, cy), n = id ? null : document.elementFromPoint(cx, cy);
        while (n && n !== document.body) { if (n.dataset && n.dataset.id) { id = n.dataset.id; break; } n = n.parentNode; }
        if (id == null) { if (S.mode === 'explore') closeInfo(); return; }
        if (S.mode === 'explore') exploreSelect(id); else answerTap(id);
    }

    // ---- explore ----
    function paintMastery() {
        const prog = S.progs[S.def.store] || {};
        S.map.items.forEach(it => {
            const e = S.els[it.id]; if (!e) return; const m = masteryOf(prog[it.id]);
            e.classList.toggle('m-ok', m === 'ok'); e.classList.toggle('m-weak', m === 'weak');
            const o = S.tiny.find(x => x.it === it); if (o) { o.dot.classList.toggle('m-ok', m === 'ok'); o.dot.classList.toggle('m-weak', m === 'weak'); }
        });
    }
    const pickL = o => { if (!o) return ''; if (typeof o === 'string') return o; const l = lang(); return (l === 'en' || l === 'fr') ? (o.en || o.es || '') : (o.es || o.en || ''); };
    const nf = n => { try { return new Intl.NumberFormat(lang(), { useGrouping: 'always' }).format(n); } catch (e) { return String(n); } };
    const nfd = n => { try { return new Intl.NumberFormat(lang(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n); } catch (e) { return String(Math.round(n * 10) / 10); } };
    function popText(it) {
        if (it.info && it.info.pop != null) { const v = it.info.pop; return v >= 1 ? nfd(v) + ' ' + t('million') : nf(Math.round(v * 1000)) + ' ' + t('thousand'); }
        if (it.inf && it.inf.pop != null) { const v = it.inf.pop; return v >= 1000 ? nfd(v / 1000) + ' ' + t('million') : nf(v) + ' ' + t('thousand'); }
        return '';
    }
    function dispName(type, code, fb) { try { return new Intl.DisplayNames([lang()], { type: type }).of(code) || fb; } catch (e) { return fb; } }
    // Fills a container with the learning card of an item (used when exploring and after each quiz answer)
    function fillCard(box, it, withClose) {
        box.textContent = '';
        if (withClose) { const close = el('button', 'x', '✕'); close.type = 'button'; close.setAttribute('aria-label', t('close')); close.onclick = closeInfo; box.appendChild(close); }
        const k = S.map.kind, head = el('div', 'hd');
        if (k === 'country') head.appendChild(el('span', 'flag', flagOf(it.iso)));
        if (k === 'peak') head.appendChild(el('span', 'flag', it.mk === 'town' ? '🏘️' : it.mk === 'range' ? '⛰️' : '🏔️'));
        if (k === 'river') head.appendChild(el('span', 'flag', '🌊'));
        head.appendChild(el('b', '', nameOf(it))); box.appendChild(head);
        const rows = el('div', 'rows'); box.appendChild(rows);
        const add = (label, val) => { if (!val) return; const r = el('div', 'row'); r.appendChild(el('span', '', label)); r.appendChild(el('b', '', val)); rows.appendChild(r); };
        let fact = null;
        if (k === 'country') {
            const i = it.info || {};
            add(t('capital'), capOf(it)); add(t('continent'), contName(it.cont)); add(t('pop'), popText(it));
            if (i.km2) add(t('area'), nf(i.km2) + ' km²');
            if (i.langs && i.langs.length) add(t('langs'), i.langs.slice(0, 4).map(c => dispName('language', c, c)).join(', '));
            if (i.cur && i.cur.length) add(t('cur'), i.cur.slice(0, 2).map(c => dispName('currency', c, c)).join(', '));
            if (i.nb && i.nb.length) add(t('neigh'), i.nb.slice(0, 8).map(c => regionName(c, c)).join(', '));
            add(t('known'), pickL(i.known)); fact = pickL(i.fact);
        } else if (k === 'region') {
            const i = it.inf || {};
            add(t('capital'), pickL(i.cap) || capOf(it));
            if (S.map.def.src === 'prov' && i.ccaa) add(t('inCcaa'), regionNameSpain(i.ccaa));
            add(t('pop'), popText(it)); if (i.km2) add(t('area'), nf(i.km2) + ' km²');
            if (i.provs && i.provs.length) add(t('provs'), i.provs.join(', '));
            add(t('highest'), pickL(i.highest)); add(t('rivers'), pickL(i.rivers)); add(t('offLang'), pickL(i.langs));
            add(t('known'), pickL(i.known)); fact = pickL(i.fact);
        } else if (k === 'river') {
            if (it.km) add(t('length'), '≈ ' + nf(it.km) + ' km' + (it.kmNote ? ' (' + it.kmNote + ')' : ''));
            add(t('source'), pickL(it.src)); add(t('mouth'), pickL(it.mouth));
            const names = (it.c || []).map(c => S.map.def.src === 'spain' ? regionNameSpain(c) : regionName(c, c)).slice(0, 12);
            add(t('flows'), names.join(', ')); fact = pickL(it.fact);
        } else if (it.mk === 'town') {
            add(t('terr'), provName(it.territory)); add(t('pop'), popText(it)); add(t('known'), pickL(it.known)); fact = pickL(it.fact);
        } else {
            add(t('height'), nf(it.m) + ' m'); add(t('where'), pickL(it.where)); fact = pickL(it.fact);
            add(t('kindL'), it.mk === 'range' ? t('rangeK') : t('peakK'));
        }
        if (fact) { const f = el('div', 'fact'); f.appendChild(el('b', '', '💡 ' + t('didYou'))); f.appendChild(el('p', '', fact)); box.appendChild(f); }
    }

    const fold = x => String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    function setupSearch() {
        const inp = $('mp-search'), sg = $('mp-sugg');
        inp.addEventListener('input', () => {
            const q = fold(inp.value.trim()); sg.textContent = '';
            if (!q || !S.map) { sg.hidden = true; return; }
            const hits = S.map.items.filter(i => fold(nameOf(i)).includes(q)).sort((a, b) => fold(nameOf(a)).indexOf(q) - fold(nameOf(b)).indexOf(q)).slice(0, 7);
            hits.forEach(i => { const b = el('button', 'sg', nameOf(i)); b.type = 'button'; b.onclick = () => { inp.value = ''; sg.hidden = true; inp.blur(); exploreSelect(i.id); }; sg.appendChild(b); });
            sg.hidden = !hits.length;
        });
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') { const f = sg.querySelector('.sg'); if (f) f.click(); } });
    }
    function startExplore() {
        const sI = $('mp-search'); sI.hidden = false; sI.placeholder = t('search'); sI.value = ''; $('mp-sugg').hidden = true; $('mp-prompt').hidden = true;
        S.run = null; $('mp-options').hidden = true; $('mp-nextrow').hidden = true; $('mp-hint').hidden = true; $('mp-learn').hidden = true;
        $('mp-prompt').textContent = t('mdExplore'); $('mp-count').textContent = '';
        S.map.items.forEach(it => addLabel(it, false));
        paintMastery();
        const lg = $('mp-legend'); lg.hidden = S.map.kind === 'peak' || S.map.kind === 'river'; lg.textContent = '';
        [['new', 'lgNew'], ['weak', 'lgWeak'], ['ok', 'lgOk']].forEach(([c, k]) => { const s = el('span', 'lg ' + c); s.appendChild(el('i')); s.appendChild(document.createTextNode(t(k))); lg.appendChild(s); });
        gotoBox(boxOf(homeBox()), false); refreshOverlays();
        showToast(t('zoomTip'), 3200);
    }
    function exploreSelect(id) {
        const it = itemById(id); if (!it) return;
        if (S.selected && S.els[S.selected]) S.els[S.selected].classList.remove('sel');
        $('mp-toast').hidden = true; S.selected = id; S.els[id].classList.add('sel'); if (S.map.kind !== 'peak') S.els[id].parentNode.appendChild(S.els[id]);
        clearMarks();
        const info = $('mp-info'); info.hidden = false; fillCard(info, it, true);
        $('mp-legend').style.visibility = 'hidden';
        const k = S.map.kind;
        if (k === 'country') { const c = S.map.caps[it.iso]; if (c) { const cm = mark(c, 'cap'); cm.setAttribute('cx', c.x); cm.setAttribute('cy', c.y); } }
        if (k !== 'river') mark(it, 'ping').classList.add('once');
        const l = addLabel(it, true); l.temp = true;
        focusItem(it, k === 'country' ? 4 : 3, true);
        setTimeout(refreshOverlays, 60);
    }
    function regionNameSpain(n) { const r = CCAA[n]; if (!r) return n; const l = lang(); return l === 'en' ? (r[3] || r[0]) : (l === 'eu' || l === 'ca') ? (r[1] || r[0]) : r[0]; }
    function closeInfo() {
        $('mp-info').hidden = true; $('mp-legend').style.visibility = ''; if (S.selected && S.els[S.selected]) S.els[S.selected].classList.remove('sel'); S.selected = null; clearMarks();
    }

    // ---- quiz ----
    function startRun() {
        $('mp-search').hidden = true; $('mp-sugg').hidden = true; $('mp-prompt').hidden = false;
        const ids = poolIds(); const prog = S.progs[S.def.store] || {};
        const picked = pickQuestions(ids, prog, 10);
        S.run = { qs: picked, i: 0, right: 0, wrong: 0, streak: 0, best: 0, tries: 0, attempts: 0, mistakes: [], newMastered: 0, t0: Date.now(), locked: false, hinted: false };
        $('mp-legend').hidden = true; closeInfo();
        S.labels = S.labels.filter(l => { if (l.ctx) return true; l.node.remove(); return false; });
        nextQ();
    }
    const TAP_TYPES = ['find', 'capFind', 'flagFind'];
    function qType() { return S.mode === 'review' ? 'find' : S.mode === 'flag' ? (Math.random() < 0.5 ? 'flagFind' : 'flagName') : S.mode === 'cap' ? (Math.random() < 0.5 ? 'capFind' : 'capName') : S.mode; }
    function resetClasses() { Object.keys(S.els).forEach(id => S.els[id].classList.remove('good', 'bad', 'tgt', 'sel', 'flow')); }
    function nextQ() {
        const r = S.run; if (!r) return;
        if (r.i >= r.qs.length) return endRun();
        resetClasses(); clearMarks(); r.locked = false; r.tries = 0; r.hinted = false;
        $('mp-toast').hidden = true; $('mp-nextrow').hidden = true; $('mp-learn').hidden = true; $('mp-options').hidden = true; $('mp-options').textContent = '';
        r.id = r.qs[r.i]; r.it = itemById(r.id); r.type = qType();
        $('mp-count').textContent = (r.i + 1) + ' / ' + r.qs.length;
        const it = r.it, n = nameOf(it);
        const pr = $('mp-prompt'); pr.textContent = '';
        if (r.type === 'flagFind' || r.type === 'flagName') { pr.appendChild(el('span', 'fflag', flagOf(it.iso))); pr.appendChild(document.createTextNode(' ' + t(r.type === 'flagFind' ? 'qFlagFind' : 'qFlagName'))); }
        if (r.type === 'find') { $('mp-prompt').textContent = t('qFind', { n: n }); }
        else if (r.type === 'capFind') { $('mp-prompt').textContent = t('qCapFind', { n: capOf(it) }); }
        else if (r.type === 'flagFind') { /* prompt already set */ }
        else {
            if (r.type !== 'flagName') $('mp-prompt').textContent = r.type === 'capName' ? t('qCapName') : t('qName');
            if (r.type === 'flagName') gotoBox(boxOf(homeBox()), true);
            else {
                if (S.map.kind !== 'river' && S.map.kind !== 'peak') S.els[it.id].parentNode.appendChild(S.els[it.id]);
                S.els[it.id].classList.add('tgt'); if (S.map.kind === 'river') S.els[it.id].classList.add('flow');
                const ping = mark(it, 'ping'); ping.classList.add('loop');
                focusItem(it, 3.6);
            }
            const pool = poolIds(); const sameCont = S.map.kind === 'country' && S.map.def.cont == null ? pool.filter(x => itemById(x).cont === it.cont) : pool;
            const opts = pickOptions(it.id, sameCont.length >= 4 ? sameCont : pool, 4);
            const box = $('mp-options'); box.hidden = false;
            opts.forEach(id => {
                const o = itemById(id); const b = el('button', 'mp-opt', r.type === 'capName' ? capOf(o) : nameOf(o)); b.type = 'button'; b.dataset.opt = id;
                b.onclick = () => answerOpt(id, b); box.appendChild(b);
            });
        }
        $('mp-hint').hidden = !TAP_TYPES.includes(r.type); $('mp-hint').textContent = '💡 ' + t('hint');
        if (TAP_TYPES.includes(r.type)) gotoBox(boxOf(homeBox()), true);
        startTimer(r);
        setTimeout(refreshOverlays, 80);
    }
    // against the clock: a soft bar, running out counts as a miss and shows the answer
    function startTimer(r) {
        clearTimeout(S.timerT); const tm = $('mp-timer'), fill = $('mp-timerfill');
        if (!S.timed) { tm.hidden = true; return; }
        const secs = TAP_TYPES.includes(r.type) ? 25 : 15;
        tm.hidden = false; fill.style.transition = 'none'; fill.style.transform = 'scaleX(1)';
        void fill.offsetWidth; fill.style.transition = 'transform ' + secs + 's linear'; fill.style.transform = 'scaleX(0)';
        S.timerT = setTimeout(() => { if (S.run === r && !r.locked) { r.timedOut = true; showToast(t('timeUp'), 0); if (r.tries === 0) r.tries = 1; conclude(false); } }, secs * 1000);
    }
    function stopTimer() { clearTimeout(S.timerT); const f = $('mp-timerfill'); if (f) { const m = getComputedStyle(f).transform; f.style.transition = 'none'; f.style.transform = m; } }
    function showToast(msg, ms) {
        const tb = $('mp-toast'); tb.textContent = msg; tb.hidden = false; clearTimeout(S.toastT);
        if (ms) S.toastT = setTimeout(() => { tb.hidden = true; }, ms);
    }
    function conclude(correct) {
        const r = S.run; r.locked = true; $('mp-hint').hidden = true; stopTimer();
        r.attempts += r.tries;
        const prog = S.progs[S.def.store]; r.before = masteryOf(prog[r.id]); prog[r.id] = recordAnswer(prog[r.id], correct && r.tries === 0 && !r.hinted); saveProg(S.def.store, prog);
        if (correct) { r.right++; r.streak++; r.best = Math.max(r.best, r.streak); } else { r.wrong++; r.streak = 0; r.mistakes.push(r.id); }
        const e = S.els[r.id]; e.classList.remove('tgt', 'flow'); e.classList.add(correct ? 'good' : 'bad');
        const it = r.it; clearMarks();
        addTempLabel(it);
        const c = S.map.caps && S.map.caps[it.iso]; if (c && (r.type === 'capFind' || r.type === 'capName')) { const cm = mark(c, 'cap'); cm.setAttribute('cx', c.x); cm.setAttribute('cy', c.y); }
        const before = r.before;
        if (correct) showToast(t('fbOk') + (r.type === 'capName' || r.type === 'capFind' ? ' ' + nameOf(it) + ' → ' + capOf(it) : ''), 0);
        else if (!r.timedOut) showToast(t('fbWrong', { n: nameOf(it) }) + (r.type === 'capFind' || r.type === 'capName' ? ' · ' + capOf(it) : ''), 0);
        if (masteryOf(prog[r.id]) === 'ok' && before !== 'ok') r.newMastered++;
        $('mp-options').hidden = true;
        const lc = $('mp-learn'); fillCard(lc, it, false); lc.hidden = false;
        $('mp-nextrow').hidden = false; $('mp-next').textContent = r.i >= r.qs.length - 1 ? t('finish') : t('next'); try { $('mp-next').focus({ preventScroll: true }); } catch (er) { /* ignore */ }
        focusItem(it, 3.6); setTimeout(refreshOverlays, 80);
    }
    function addTempLabel(it) { const l = addLabel(it, true); l.temp = true; }
    function answerOpt(id, btn) {
        const r = S.run; if (!r || r.locked) return;
        const ok = r.type === 'capName' ? capOf(itemById(id)) === capOf(r.it) : id === r.id; r.tries++;
        $('mp-options').querySelectorAll('.mp-opt').forEach(b => { b.disabled = true; const bi = b.dataset.opt; if (bi === r.id) b.classList.add('good'); });
        if (!ok) btn.classList.add('bad');
        conclude(ok);
    }
    function answerTap(id) {
        const r = S.run; if (!r || r.locked || !TAP_TYPES.includes(r.type)) return;
        r.tries++;
        if (id === r.id) return conclude(true);
        const w = itemById(id); if (!w) return;
        const we = S.els[id]; we.classList.add('bad'); setTimeout(() => we.classList.remove('bad'), 650);
        if (r.tries >= 2) {
            showToast(t('fbShow', { n: nameOf(r.it) }), 0);
            return conclude(false);
        }
        showToast(t('fbTry', { n: nameOf(w) }), 1800);
    }
    function useHint() {
        const r = S.run; if (!r || r.locked) return; r.hinted = true;
        clearMarks(); const it = r.it; const p = mark(it, 'ping'); p.classList.add('loop');
        focusItem(it, S.map.kind === 'river' ? 1.6 : 7); showToast('💡', 1200); setTimeout(refreshOverlays, 80);
    }
    async function endRun() {
        const r = S.run; show('mp-end');
        const stars = r.wrong === 0 ? 3 : r.right >= r.qs.length * 0.7 ? 2 : r.right >= r.qs.length * 0.4 ? 1 : 0;
        $('mp-trophy').textContent = (r.wrong === 0 ? '🏆' : r.right >= r.wrong ? '🌟' : '💪') + (stars ? ' ' + '⭐'.repeat(stars) : '');
        $('mp-endtitle').textContent = t('endGreat');
        const st = $('mp-endstats'); st.textContent = '';
        [[r.right, 'endRight'], [r.wrong, 'endWrong'], [r.newMastered, 'endMastered'], [r.best, 'endStreak']].forEach(([n, k]) => { const d = el('div'); d.appendChild(el('b', '', String(n))); d.appendChild(document.createTextNode(t(k))); st.appendChild(d); });
        const m = $('mp-mistakes'); m.textContent = '';
        if (r.mistakes.length) {
            m.appendChild(el('h3', '', t('mistakes'))); const ul = el('ul');
            r.mistakes.forEach(id => { const it = itemById(id); const li = el('li'); li.appendChild(el('b', '', nameOf(it))); const c = capOf(it); if (c && S.mode === 'cap') li.appendChild(document.createTextNode(' · ' + c)); const ft = pickL((it.info || it.inf || it).fact); if (ft) li.appendChild(el('small', '', ' 💡 ' + ft)); ul.appendChild(li); });
            m.appendChild(ul);
        }
        $('mp-again').textContent = t('again'); $('mp-home-btn').textContent = t('back');
        if (S.user && typeof PlatformFirestore !== 'undefined') {
            try {
                const prog = S.progs[S.def.store]; const mastered = Object.keys(prog).filter(i => prog[i].s >= 2).length;
                await PlatformFirestore.updateGameStats(S.user.uid, 'mapas', {
                    correctAnswers: r.right, totalQuestions: r.qs.length, totalAttempts: Math.max(r.right, r.attempts), bestStreak: r.best,
                    elapsedSeconds: Math.round((Date.now() - r.t0) / 1000), level: Math.min(10, 1 + Math.floor(mastered / 12)), operation: S.def.id + '_' + S.mode
                });
            } catch (e) { console.warn('[Mapas] stats not saved', e); }
        }
    }

    function render() {
        if (S.screen === 'mp-home') renderHome();
        else if (S.screen === 'mp-setup') openSetup(S.def);
        else if (S.screen === 'mp-game' && S.map) { const m = S.mode; const def = S.def; startMap(def, m); }
        else if (S.screen === 'mp-end') endRun();
    }
    function onKey(e) {
        if (e.key === 'Escape' && S.screen === 'mp-game') quitGame();
        if ((e.key === 'Enter' || e.key === ' ') && S.screen === 'mp-game' && S.run && !$('mp-nextrow').hidden) { e.preventDefault(); S.run.i++; nextQ(); }
    }
    function quitGame() { stopTimer(); $('mp-timer').hidden = true; S.run = null; renderHome(); show('mp-home'); }

    function init() {
        $('mp-quit').onclick = quitGame;
        $('mp-setupback').onclick = () => { renderHome(); show('mp-home'); };
        $('mp-next').onclick = () => { if (S.run) { S.run.i++; nextQ(); } };
        $('mp-hint').onclick = useHint;
        $('mp-again').onclick = () => startMap(S.def, S.mode);
        $('mp-home-btn').onclick = () => { renderHome(); show('mp-home'); };
        setupGestures(); setupSearch();
        document.addEventListener('keydown', onKey);
        window.addEventListener('resize', () => { if (S.screen === 'mp-game' && S.map && S.cam) { const g = fitBox(S.cam, stageSize().w, stageSize().h); S.cam = g; S.target = Object.assign({}, g); applyCam(); } });
        // labels / dots depend on zoom: refresh when the camera changes
        (function loop() { if (S.dirty) { S.dirty = false; refreshOverlays(); } requestAnimationFrame(loop); })();
        renderHome(); show('mp-home');
        loadData('world').then(W => { indexWorld(W); renderHome(); setTimeout(() => loadData('spain').catch(() => {}), 2500); /* warm the cache so every map works offline */ }).catch(() => { /* offline first visit */ });
        if (window.PlatformAuth && PlatformAuth.onAuthStateChanged) PlatformAuth.onAuthStateChanged(u => { S.user = u || null; if (S.screen === 'mp-home') renderHome(); });
        window.addEventListener('platformLanguageChanged', render);
    }

    const api = { needsReview, _S: S, _focus: (id, z) => focusItem(itemById(id), z), init, txt, pickQuestions, pickOptions, masteryOf, recordAnswer, fitBox, UI, MAPS, CCAA, LANGS };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    return api;
})();
