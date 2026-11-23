/**
 * Memoria de Parejas - "learn first" content and pure helpers (no DOM).
 *  - UI: strings of the Aprende step, the guided round and the "why they do not match" line (es en eu gl ca fr)
 *  - NAMES: spoken/written names of numbers, emojis and animals in the six languages
 *  - pickItems: which items of a theme go into a game; rotates so repeated games do not repeat the same pairs
 *  - cardName / whyNot / findHint: texts and hints built from a card
 */
const MemoryLearn = (() => {
    'use strict';

    const LANGS = ['es', 'en', 'eu', 'gl', 'ca', 'fr'];

    const UI = {
        es: { learnTitle: 'Aprende', learnNumbers: 'Toca un número y mira cuántos puntos tiene. Los puntos aparecen de uno en uno.',
              learnLetters: 'Cada letra tiene su mayúscula y su minúscula. Toca una para verlas juntas y escucharla.',
              learnOther: 'Cada carta tiene otra igual: es su pareja. Toca una para ver cómo se llama.',
              learnGo: '¡Entendido, a practicar!', learnSkip: 'Saltar', learnAgain: 'Aprende', learnPick: 'Elige uno', sayIt: 'Escuchar',
              dots1: 'punto', dotsN: 'puntos', upper: 'mayúscula', lower: 'minúscula', pairWord: 'Pareja',
              guidedTitle: 'Ronda de práctica: solo 3 parejas', guidedHint: 'Te ayudamos con pistas.',
              find: 'Busca la pareja de: {a}', hintGlow: 'Pista: la pareja brilla.',
              whyNot: '{a} y {b} no son pareja.', tipNumbers: 'Cuenta los puntos: cada número va con sus puntos.',
              tipLetters: 'Mira bien: cada mayúscula va con su minúscula.', tipPairs: 'Busca la carta que sea exactamente igual.',
              matchedWhy: '¡{a} y {b} son pareja!' },
        en: { learnTitle: 'Learn', learnNumbers: 'Tap a number and see how many dots it has. The dots appear one by one.',
              learnLetters: 'Every letter has a capital and a lowercase form. Tap one to see them together and hear it.',
              learnOther: 'Every card has another one just like it: that is its pair. Tap one to see its name.',
              learnGo: 'Got it, let us practise!', learnSkip: 'Skip', learnAgain: 'Learn', learnPick: 'Pick one', sayIt: 'Listen',
              dots1: 'dot', dotsN: 'dots', upper: 'capital', lower: 'lowercase', pairWord: 'Pair',
              guidedTitle: 'Practice round: just 3 pairs', guidedHint: 'We help you with hints.',
              find: 'Find the pair of: {a}', hintGlow: 'Hint: the pair is glowing.',
              whyNot: '{a} and {b} are not a pair.', tipNumbers: 'Count the dots: each number goes with its dots.',
              tipLetters: 'Look closely: each capital goes with its lowercase.', tipPairs: 'Look for the card that is exactly the same.',
              matchedWhy: '{a} and {b} are a pair!' },
        eu: { learnTitle: 'Ikasi', learnNumbers: 'Ukitu zenbaki bat eta ikusi zenbat puntu dituen. Puntuak banan-banan agertzen dira.',
              learnLetters: 'Letra bakoitzak larria eta xehea ditu. Ukitu bat biak batera ikusteko eta entzuteko.',
              learnOther: 'Karta bakoitzak beste bat du berdina: hori da bere bikotea. Ukitu bat bere izena ikusteko.',
              learnGo: 'Ulertu dut, praktikatzera!', learnSkip: 'Saltatu', learnAgain: 'Ikasi', learnPick: 'Aukeratu bat', sayIt: 'Entzun',
              dots1: 'puntu', dotsN: 'puntu', upper: 'larria', lower: 'xehea', pairWord: 'Bikotea',
              guidedTitle: 'Praktika txanda: 3 bikote bakarrik', guidedHint: 'Pistekin lagunduko dizugu.',
              find: 'Bilatu honen bikotea: {a}', hintGlow: 'Pista: bikotea distiratzen ari da.',
              whyNot: '{a} eta {b} ez dira bikote.', tipNumbers: 'Zenbatu puntuak: zenbaki bakoitza bere puntuekin doa.',
              tipLetters: 'Begiratu ondo: letra larri bakoitza bere xehearekin doa.', tipPairs: 'Bilatu zehazki berdina den karta.',
              matchedWhy: '{a} eta {b} bikote dira!' },
        gl: { learnTitle: 'Aprende', learnNumbers: 'Toca un número e mira cantos puntos ten. Os puntos aparecen un a un.',
              learnLetters: 'Cada letra ten a súa maiúscula e a súa minúscula. Toca unha para velas xuntas e escoitala.',
              learnOther: 'Cada carta ten outra igual: é a súa parella. Toca unha para ver como se chama.',
              learnGo: 'Entendido, a practicar!', learnSkip: 'Saltar', learnAgain: 'Aprende', learnPick: 'Elixe un', sayIt: 'Escoitar',
              dots1: 'punto', dotsN: 'puntos', upper: 'maiúscula', lower: 'minúscula', pairWord: 'Parella',
              guidedTitle: 'Rolda de práctica: só 3 parellas', guidedHint: 'Axudámoste con pistas.',
              find: 'Busca a parella de: {a}', hintGlow: 'Pista: a parella brilla.',
              whyNot: '{a} e {b} non son parella.', tipNumbers: 'Conta os puntos: cada número vai cos seus puntos.',
              tipLetters: 'Mira ben: cada maiúscula vai coa súa minúscula.', tipPairs: 'Busca a carta que sexa exactamente igual.',
              matchedWhy: '{a} e {b} son parella!' },
        ca: { learnTitle: 'Aprèn', learnNumbers: 'Toca un número i mira quants punts té. Els punts apareixen d\'un en un.',
              learnLetters: 'Cada lletra té la seva majúscula i la seva minúscula. Toca\'n una per veure-les juntes i sentir-la.',
              learnOther: 'Cada carta en té una altra d\'igual: és la seva parella. Toca\'n una per veure com es diu.',
              learnGo: 'Entès, a practicar!', learnSkip: 'Salta', learnAgain: 'Aprèn', learnPick: 'Tria\'n un', sayIt: 'Escoltar',
              dots1: 'punt', dotsN: 'punts', upper: 'majúscula', lower: 'minúscula', pairWord: 'Parella',
              guidedTitle: 'Ronda de pràctica: només 3 parelles', guidedHint: 'T\'ajudem amb pistes.',
              find: 'Busca la parella de: {a}', hintGlow: 'Pista: la parella brilla.',
              whyNot: '{a} i {b} no són parella.', tipNumbers: 'Compta els punts: cada número va amb els seus punts.',
              tipLetters: 'Mira bé: cada majúscula va amb la seva minúscula.', tipPairs: 'Busca la carta que sigui exactament igual.',
              matchedWhy: '{a} i {b} són parella!' },
        fr: { learnTitle: 'Apprends', learnNumbers: 'Touche un nombre et regarde combien de points il a. Les points apparaissent un par un.',
              learnLetters: 'Chaque lettre a une majuscule et une minuscule. Touches-en une pour les voir ensemble et l\'écouter.',
              learnOther: 'Chaque carte en a une autre identique : c\'est sa paire. Touches-en une pour voir son nom.',
              learnGo: 'Compris, on s\'entraîne !', learnSkip: 'Passer', learnAgain: 'Apprendre', learnPick: 'Choisis-en un', sayIt: 'Écouter',
              dots1: 'point', dotsN: 'points', upper: 'majuscule', lower: 'minuscule', pairWord: 'Paire',
              guidedTitle: 'Tour d\'entraînement : seulement 3 paires', guidedHint: 'On t\'aide avec des indices.',
              find: 'Cherche la paire de : {a}', hintGlow: 'Indice : la paire brille.',
              whyNot: '{a} et {b} ne font pas une paire.', tipNumbers: 'Compte les points : chaque nombre va avec ses points.',
              tipLetters: 'Regarde bien : chaque majuscule va avec sa minuscule.', tipPairs: 'Cherche la carte exactement identique.',
              matchedWhy: '{a} et {b} font une paire !' }
    };

    const NUM_WORDS = {
        es: ['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'],
        en: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
        eu: ['bat', 'bi', 'hiru', 'lau', 'bost', 'sei', 'zazpi', 'zortzi', 'bederatzi', 'hamar'],
        gl: ['un', 'dous', 'tres', 'catro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez'],
        ca: ['un', 'dos', 'tres', 'quatre', 'cinc', 'sis', 'set', 'vuit', 'nou', 'deu'],
        fr: ['un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix']
    };

    // Same order as the pools in game.js
    const NAMES = {
        emoji: {
            es: ['cara sonriente', 'cohete', 'arcoíris', 'balón', 'globo', 'pizza', 'guitarra', 'girasol', 'donut', 'bici', 'regalo', 'estrella', 'castillo', 'paleta de pintor', 'helado', 'campana'],
            en: ['smiley face', 'rocket', 'rainbow', 'ball', 'balloon', 'pizza', 'guitar', 'sunflower', 'donut', 'bike', 'present', 'star', 'castle', 'paint palette', 'ice cream', 'bell'],
            eu: ['aurpegi irribarretsua', 'suziria', 'ostadarra', 'baloia', 'globoa', 'pizza', 'gitarra', 'ekilorea', 'donuta', 'bizikleta', 'oparia', 'izarra', 'gaztelua', 'margolariaren paleta', 'izozkia', 'kanpaia'],
            gl: ['cara sorrinte', 'foguete', 'arco da vella', 'balón', 'globo', 'pizza', 'guitarra', 'xirasol', 'donut', 'bici', 'agasallo', 'estrela', 'castelo', 'paleta de pintor', 'xeado', 'campá'],
            ca: ['cara somrient', 'coet', 'arc de Sant Martí', 'pilota', 'globus', 'pizza', 'guitarra', 'gira-sol', 'dònut', 'bici', 'regal', 'estrella', 'castell', 'paleta de pintor', 'gelat', 'campana'],
            fr: ['visage souriant', 'fusée', 'arc-en-ciel', 'ballon', 'ballon gonflable', 'pizza', 'guitare', 'tournesol', 'beignet', 'vélo', 'cadeau', 'étoile', 'château', 'palette de peintre', 'glace', 'cloche']
        },
        animals: {
            es: ['perro', 'gato', 'ratón', 'conejo', 'zorro', 'oso', 'panda', 'rana', 'león', 'mono', 'pingüino', 'tortuga', 'pulpo', 'mariposa', 'abeja', 'elefante'],
            en: ['dog', 'cat', 'mouse', 'rabbit', 'fox', 'bear', 'panda', 'frog', 'lion', 'monkey', 'penguin', 'turtle', 'octopus', 'butterfly', 'bee', 'elephant'],
            eu: ['txakurra', 'katua', 'sagua', 'untxia', 'azeria', 'hartza', 'panda', 'igela', 'lehoia', 'tximinoa', 'pinguinoa', 'dortoka', 'olagarroa', 'tximeleta', 'erlea', 'elefantea'],
            gl: ['can', 'gato', 'rato', 'coello', 'raposo', 'oso', 'panda', 'ra', 'león', 'mono', 'pingüín', 'tartaruga', 'polbo', 'bolboreta', 'abella', 'elefante'],
            ca: ['gos', 'gat', 'ratolí', 'conill', 'guineu', 'ós', 'panda', 'granota', 'lleó', 'mico', 'pingüí', 'tortuga', 'pop', 'papallona', 'abella', 'elefant'],
            fr: ['chien', 'chat', 'souris', 'lapin', 'renard', 'ours', 'panda', 'grenouille', 'lion', 'singe', 'pingouin', 'tortue', 'pieuvre', 'papillon', 'abeille', 'éléphant']
        }
    };

    const L = lang => (UI[lang] ? lang : 'es');
    const fill = (s, vars) => Object.keys(vars || {}).reduce((acc, k) => acc.split('{' + k + '}').join(String(vars[k])), s);
    const text = (lang, key, vars) => fill((UI[L(lang)] || UI.es)[key] || UI.es[key] || key, vars);

    /**
     * Items for one game. The pool is rotated by `rotation * n` so successive games of the same theme
     * start at different items, then the chosen items are shuffled. Pure given `r`.
     */
    function pickItems(pool, n, rotation, r = Math.random) {
        const len = pool.length, k = Math.min(n, len);
        const start = ((Math.floor(rotation) || 0) * k) % len;
        const chosen = [];
        for (let i = 0; i < k; i++) chosen.push(pool[(start + i) % len]);
        for (let i = chosen.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [chosen[i], chosen[j]] = [chosen[j], chosen[i]]; }
        return chosen;
    }

    /** Written/spoken name of one card face. theme: emoji | animals | numbers | letters. */
    function cardName(theme, card, lang, pool) {
        const l = L(lang);
        if (theme === 'numbers') {
            const n = Number(card.sym);
            if (card.kind === 'dots') return `${n} ${n === 1 ? UI[l].dots1 : UI[l].dotsN}`;
            return `${n} (${NUM_WORDS[l][n - 1] || n})`;
        }
        if (theme === 'letters') return `${card.text} (${card.kind === 'upper' ? UI[l].upper : UI[l].lower})`;
        const idx = pool ? pool.indexOf(card.sym) : -1;
        const name = idx >= 0 && NAMES[theme] ? NAMES[theme][l][idx] : '';
        return name ? `${card.text} ${name}` : String(card.text);
    }

    /** Short "why they do not match" sentence: both card names plus a tip about the theme. */
    function whyNot(theme, a, b, lang, pool) {
        const l = L(lang);
        const tip = theme === 'numbers' ? UI[l].tipNumbers : theme === 'letters' ? UI[l].tipLetters : UI[l].tipPairs;
        return fill(UI[l].whyNot, { a: cardName(theme, a, l, pool), b: cardName(theme, b, l, pool) }) + ' ' + tip;
    }

    /** Index of the partner of the card at `index` (used for the glowing hint of the guided round). */
    function findHint(deck, index) {
        const c = deck[index];
        if (!c) return -1;
        return deck.findIndex((d, i) => i !== index && d.pair === c.pair);
    }

    /** Language code used for speech. */
    const SPEECH = { es: 'es-ES', en: 'en-GB', eu: 'eu-ES', gl: 'gl-ES', ca: 'ca-ES', fr: 'fr-FR' };

    const api = { LANGS, UI, NUM_WORDS, NAMES, SPEECH, pickItems, cardName, whyNot, findHint, text };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    return api;
})();
