/**
 * VocabMaster - "study first" content and pure helpers (no DOM).
 *  - UI: strings for the study cards, the 3-card guided check and the new feedback (es en eu gl ca fr).
 *    gl, ca and fr are complete dictionaries; es, en and eu only get the new keys (game.js merges them).
 *  - pickStudyWords / buildCheck / feedbackLines: pure logic used by game.js and the tests.
 * Word entries are { w: English word, t: Spanish meaning, i: emoji, e: example sentence }.
 */
const VocabLearn = (() => {
    'use strict';

    const NEW_KEYS = {
        es: { studyTitle: 'Estudia las palabras nuevas', studyTap: 'Toca la tarjeta para girarla', studyNext: 'Siguiente tarjeta', studyCount: '{n} / {m}',
              studyCheck: 'Probar con 3 preguntas', studySkip: 'Saltar', checkTitle: 'Comprobación guiada', checkCount: 'Pregunta {n} de {m}',
              checkOk: '¡Correcto!', checkTry: 'Inténtalo otra vez.', checkStart: 'Empezar la ronda', exampleLabel: 'Ejemplo', flipBack: 'Significado',
              wrongIs: 'La palabra correcta es “{w}” ({t}).', wrongOtherT: '“{ot}” es “{ow}”, no “{w}”.', wrongOtherW: '“{ow}” significa “{ot}”, no “{t}”.',
              wrongTyped: 'Escribiste “{typed}”, pero se escribe “{w}”.', incorrect: 'Incorrecto',
              streak: 'Racha {n}', help: 'Ayuda', helpStarts: 'Empieza por “{l}” y tiene {n} letras.',
              helpPairs: 'Toca una palabra y después su significado.', helpMemory: 'Da la vuelta a dos cartas: si son pareja, se quedan.', helpDrag: 'Arrastra la palabra hasta su dibujo, o toca el dibujo.',
              helpLightning: 'Responde todo lo que puedas. No pasa nada si fallas.', zChoose: 'Elige', zType: 'Escribe',
              zDrag: 'Arrastra', zMatch: 'Une', zMemory: 'Encuentra las parejas',
              dragTitle: 'Arrastra la palabra a su dibujo', hearPic: 'Escucha y elige el dibujo', noVoice: 'Este navegador no tiene voz: lee la palabra.',
              modeLabel: 'Modo', modeRound: 'Ronda', modeMatch: 'Unir parejas',
              modeMemory: 'Memoria', modeLightning: 'Relámpago', matchTitle: 'Une cada palabra con su significado',
              memoryTitle: 'Memoria: encuentra las parejas', lightningTitle: 'Ronda relámpago', moves: 'Movimientos: {n}',
              pairsLeft: 'Parejas: {n} de {m}', timeLeft: '{n} s', lightScore: 'Aciertos: {n}',
              timeUp: '¡Tiempo!', practiceDone: 'Práctica terminada', practiceNote: 'Es práctica: no cambia tu progreso guardado.',
              matchResult: '{n} fallos', memResult: '{n} movimientos', lightResult: '{n} aciertos en {s} s' },
        en: { studyTitle: 'Study the new words', studyTap: 'Tap the card to flip it', studyNext: 'Next card', studyCount: '{n} / {m}',
              studyCheck: 'Try 3 questions', studySkip: 'Skip', checkTitle: 'Guided check', checkCount: 'Question {n} of {m}',
              checkOk: 'Correct!', checkTry: 'Try again.', checkStart: 'Start the round', exampleLabel: 'Example', flipBack: 'Meaning',
              wrongIs: 'The correct word is “{w}” ({t}).', wrongOtherT: '“{ot}” is “{ow}”, not “{w}”.', wrongOtherW: '“{ow}” means “{ot}”, not “{t}”.',
              wrongTyped: 'You typed “{typed}”, but it is spelled “{w}”.', incorrect: 'Not quite',
              streak: 'Streak {n}', help: 'Help', helpStarts: 'It starts with “{l}” and has {n} letters.',
              helpPairs: 'Tap a word, then its meaning.', helpMemory: 'Flip two cards: if they match, they stay.', helpDrag: 'Drag the word to its picture, or tap the picture.',
              helpLightning: 'Answer as many as you can. Mistakes are fine.', zChoose: 'Choose', zType: 'Type',
              zDrag: 'Drag', zMatch: 'Match', zMemory: 'Find the pairs',
              dragTitle: 'Drag the word to its picture', hearPic: 'Listen and pick the picture', noVoice: 'This browser has no voice: read the word.',
              modeLabel: 'Mode', modeRound: 'Round', modeMatch: 'Match pairs',
              modeMemory: 'Memory', modeLightning: 'Lightning', matchTitle: 'Match each word with its meaning',
              memoryTitle: 'Memory: find the pairs', lightningTitle: 'Lightning round', moves: 'Moves: {n}',
              pairsLeft: 'Pairs: {n} of {m}', timeLeft: '{n} s', lightScore: 'Correct: {n}',
              timeUp: 'Time is up!', practiceDone: 'Practice finished', practiceNote: 'This is practice: it does not change your saved progress.',
              matchResult: '{n} mistakes', memResult: '{n} moves', lightResult: '{n} correct in {s} s' },
        eu: { studyTitle: 'Ikasi hitz berriak', studyTap: 'Ukitu txartela buelta emateko', studyNext: 'Hurrengo txartela', studyCount: '{n} / {m}',
              studyCheck: 'Probatu 3 galderarekin', studySkip: 'Saltatu', checkTitle: 'Egiaztapen gidatua', checkCount: '{n}. galdera ({m}tik)',
              checkOk: 'Zuzena!', checkTry: 'Saiatu berriro.', checkStart: 'Hasi txanda', exampleLabel: 'Adibidea', flipBack: 'Esanahia',
              wrongIs: 'Hitz zuzena “{w}” da ({t}).', wrongOtherT: '“{ot}” “{ow}” da, ez “{w}”.', wrongOtherW: '“{ow}” “{ot}” da, ez “{t}”.',
              wrongTyped: '“{typed}” idatzi duzu, baina “{w}” idazten da.', incorrect: 'Ez da hori',
              streak: 'Segida {n}', help: 'Laguntza', helpStarts: '“{l}” letraz hasten da eta {n} letra ditu.',
              helpPairs: 'Ukitu hitz bat eta gero bere esanahia.', helpMemory: 'Eman buelta bi txarteli: bikote badira, geratu egiten dira.', helpDrag: 'Arrastatu hitza bere marrazkira, edo ukitu marrazkia.',
              helpLightning: 'Erantzun ahal duzun guztia. Huts egitea ez da ezer.', zChoose: 'Aukeratu', zType: 'Idatzi',
              zDrag: 'Arrastatu', zMatch: 'Lotu', zMemory: 'Aurkitu bikoteak',
              dragTitle: 'Arrastatu hitza bere marrazkira', hearPic: 'Entzun eta aukeratu marrazkia', noVoice: 'Nabigatzaile honek ez du ahotsik: irakurri hitza.',
              modeLabel: 'Modua', modeRound: 'Txanda', modeMatch: 'Bikoteak lotu',
              modeMemory: 'Memoria', modeLightning: 'Tximista', matchTitle: 'Lotu hitz bakoitza bere esanahiarekin',
              memoryTitle: 'Memoria: aurkitu bikoteak', lightningTitle: 'Tximista txanda', moves: 'Mugimenduak: {n}',
              pairsLeft: 'Bikoteak: {m}tik {n}', timeLeft: '{n} s', lightScore: 'Asmatuak: {n}',
              timeUp: 'Denbora amaitu da!', practiceDone: 'Praktika amaituta', practiceNote: 'Praktika da: ez du gordetako aurrerapena aldatzen.',
              matchResult: '{n} akats', memResult: '{n} mugimendu', lightResult: '{n} asmatu {s} s-tan' },
        gl: { sub: 'Aprende palabras con repaso espaciado: as que fallas volven antes.', pick: 'Elixe un tema',
              words: 'palabras', learned: 'aprendidas', quit: 'Saír', listen: '🔊 Escoitar', gotit: 'Entendido',
              next: 'Seguinte', check: 'Comprobar', newWord: 'Palabra nova', choose: 'Que significa?',
              chooseBack: 'Como se di en inglés?', hear: 'Escoita e elixe o significado', type: 'Escríbea en inglés',
              ok: 'Correcto!', again: 'Outra rolda', home: 'Temas', end: 'Rolda rematada',
              score: (a, b) => `${a} de ${b} á primeira`, review: 'Para repasar', saved: 'O teu progreso gárdase neste dispositivo.',
              none: 'Non hai nada que repasar agora: volve mañá!', place: 'Escribe aquí', lang: 'Idioma que aprender', due: 'por repasar',
              studyTitle: 'Estuda as palabras novas', studyTap: 'Toca a tarxeta para xirala', studyNext: 'Seguinte tarxeta', studyCount: '{n} / {m}',
              studyCheck: 'Probar con 3 preguntas', studySkip: 'Saltar', checkTitle: 'Comprobación guiada', checkCount: 'Pregunta {n} de {m}',
              checkOk: 'Correcto!', checkTry: 'Tenta outra vez.', checkStart: 'Comezar a rolda', exampleLabel: 'Exemplo', flipBack: 'Significado',
              wrongIs: 'A palabra correcta é “{w}” ({t}).', wrongOtherT: '“{ot}” é “{ow}”, non “{w}”.', wrongOtherW: '“{ow}” significa “{ot}”, non “{t}”.',
              wrongTyped: 'Escribiches “{typed}”, pero escríbese “{w}”.', incorrect: 'Non é esa',
              streak: 'Racha {n}', help: 'Axuda', helpStarts: 'Empeza por “{l}” e ten {n} letras.',
              helpPairs: 'Toca unha palabra e despois o seu significado.', helpMemory: 'Xira dúas tarxetas: se son parella, quedan.', helpDrag: 'Arrastra a palabra ata o seu debuxo, ou toca o debuxo.',
              helpLightning: 'Responde todo o que poidas. Non pasa nada se fallas.', zChoose: 'Elixe', zType: 'Escribe',
              zDrag: 'Arrastra', zMatch: 'Une', zMemory: 'Atopa as parellas',
              dragTitle: 'Arrastra a palabra ata o seu debuxo', hearPic: 'Escoita e elixe o debuxo', noVoice: 'Este navegador non ten voz: le a palabra.',
              modeLabel: 'Modo', modeRound: 'Rolda', modeMatch: 'Unir parellas',
              modeMemory: 'Memoria', modeLightning: 'Lóstrego', matchTitle: 'Une cada palabra co seu significado',
              memoryTitle: 'Memoria: atopa as parellas', lightningTitle: 'Rolda lóstrego', moves: 'Movementos: {n}',
              pairsLeft: 'Parellas: {n} de {m}', timeLeft: '{n} s', lightScore: 'Acertos: {n}',
              timeUp: 'Rematou o tempo!', practiceDone: 'Práctica rematada', practiceNote: 'É práctica: non cambia o teu progreso gardado.',
              matchResult: '{n} erros', memResult: '{n} movementos', lightResult: '{n} acertos en {s} s' },
        ca: { sub: 'Aprèn paraules amb repàs espaiat: les que falles tornen abans.', pick: 'Tria un tema',
              words: 'paraules', learned: 'apreses', quit: 'Surt', listen: '🔊 Escoltar', gotit: 'Entès',
              next: 'Següent', check: 'Comprova', newWord: 'Paraula nova', choose: 'Què vol dir?',
              chooseBack: 'Com es diu en anglès?', hear: 'Escolta i tria el significat', type: 'Escriu-la en anglès',
              ok: 'Correcte!', again: 'Una altra ronda', home: 'Temes', end: 'Ronda acabada',
              score: (a, b) => `${a} de ${b} a la primera`, review: 'Per repassar', saved: 'El teu progrés es desa en aquest dispositiu.',
              none: 'No hi ha res per repassar ara: torna demà!', place: 'Escriu aquí', lang: 'Idioma per aprendre', due: 'per repassar',
              studyTitle: 'Estudia les paraules noves', studyTap: 'Toca la targeta per girar-la', studyNext: 'Targeta següent', studyCount: '{n} / {m}',
              studyCheck: 'Prova amb 3 preguntes', studySkip: 'Salta', checkTitle: 'Comprovació guiada', checkCount: 'Pregunta {n} de {m}',
              checkOk: 'Correcte!', checkTry: 'Torna-ho a provar.', checkStart: 'Comença la ronda', exampleLabel: 'Exemple', flipBack: 'Significat',
              wrongIs: 'La paraula correcta és “{w}” ({t}).', wrongOtherT: '“{ot}” és “{ow}”, no “{w}”.', wrongOtherW: '“{ow}” vol dir “{ot}”, no “{t}”.',
              wrongTyped: 'Has escrit “{typed}”, però s\'escriu “{w}”.', incorrect: 'No és aquesta',
              streak: 'Ratxa {n}', help: 'Ajuda', helpStarts: 'Comença per “{l}” i té {n} lletres.',
              helpPairs: 'Toca una paraula i després el seu significat.', helpMemory: 'Gira dues targetes: si són parella, es queden.', helpDrag: 'Arrossega la paraula fins al seu dibuix, o toca el dibuix.',
              helpLightning: 'Respon tot el que puguis. No passa res si falles.', zChoose: 'Tria', zType: 'Escriu',
              zDrag: 'Arrossega', zMatch: 'Uneix', zMemory: 'Troba les parelles',
              dragTitle: 'Arrossega la paraula fins al seu dibuix', hearPic: 'Escolta i tria el dibuix', noVoice: 'Aquest navegador no té veu: llegeix la paraula.',
              modeLabel: 'Mode', modeRound: 'Ronda', modeMatch: 'Unir parelles',
              modeMemory: 'Memòria', modeLightning: 'Llamp', matchTitle: 'Uneix cada paraula amb el seu significat',
              memoryTitle: 'Memòria: troba les parelles', lightningTitle: 'Ronda llamp', moves: 'Moviments: {n}',
              pairsLeft: 'Parelles: {n} de {m}', timeLeft: '{n} s', lightScore: 'Encerts: {n}',
              timeUp: 'S\'ha acabat el temps!', practiceDone: 'Pràctica acabada', practiceNote: 'És pràctica: no canvia el teu progrés desat.',
              matchResult: '{n} errors', memResult: '{n} moviments', lightResult: '{n} encerts en {s} s' },
        fr: { sub: 'Apprends des mots avec une révision espacée : ceux que tu rates reviennent plus tôt.', pick: 'Choisis un thème',
              words: 'mots', learned: 'appris', quit: 'Quitter', listen: '🔊 Écouter', gotit: 'Compris',
              next: 'Suivant', check: 'Vérifier', newWord: 'Mot nouveau', choose: 'Que veut dire ce mot ?',
              chooseBack: 'Comment dit-on en anglais ?', hear: 'Écoute et choisis le sens', type: 'Écris-le en anglais',
              ok: 'Correct !', again: 'Un autre tour', home: 'Thèmes', end: 'Tour terminé',
              score: (a, b) => `${a} sur ${b} du premier coup`, review: 'À réviser', saved: 'Ta progression est enregistrée sur cet appareil.',
              none: 'Rien à réviser pour le moment : reviens demain !', place: 'Écris ici', lang: 'Langue à apprendre', due: 'à réviser',
              studyTitle: 'Étudie les mots nouveaux', studyTap: 'Touche la carte pour la retourner', studyNext: 'Carte suivante', studyCount: '{n} / {m}',
              studyCheck: 'Essayer 3 questions', studySkip: 'Passer', checkTitle: 'Vérification guidée', checkCount: 'Question {n} sur {m}',
              checkOk: 'Correct !', checkTry: 'Réessaie.', checkStart: 'Commencer le tour', exampleLabel: 'Exemple', flipBack: 'Sens',
              wrongIs: 'Le bon mot est « {w} » ({t}).', wrongOtherT: '« {ot} » correspond à « {ow} », pas à « {w} ».', wrongOtherW: '« {ow} » veut dire « {ot} », pas « {t} ».',
              wrongTyped: 'Tu as écrit « {typed} », mais il s\'écrit « {w} ».', incorrect: 'Pas tout à fait',
              streak: 'Série {n}', help: 'Aide', helpStarts: 'Elle commence par « {l} » et a {n} lettres.',
              helpPairs: 'Touche un mot, puis son sens.', helpMemory: 'Retourne deux cartes : si elles vont ensemble, elles restent.', helpDrag: 'Fais glisser le mot vers son image, ou touche l\'image.',
              helpLightning: 'Réponds à un maximum de questions. Ce n\'est pas grave de se tromper.', zChoose: 'Choisis', zType: 'Écris',
              zDrag: 'Glisse', zMatch: 'Relie', zMemory: 'Trouve les paires',
              dragTitle: 'Glisse le mot vers son image', hearPic: 'Écoute et choisis l\'image', noVoice: 'Ce navigateur n\'a pas de voix : lis le mot.',
              modeLabel: 'Mode', modeRound: 'Tour', modeMatch: 'Relier les paires',
              modeMemory: 'Mémoire', modeLightning: 'Éclair', matchTitle: 'Relie chaque mot à son sens',
              memoryTitle: 'Mémoire : trouve les paires', lightningTitle: 'Tour éclair', moves: 'Coups : {n}',
              pairsLeft: 'Paires : {n} sur {m}', timeLeft: '{n} s', lightScore: 'Réussites : {n}',
              timeUp: 'Temps écoulé !', practiceDone: 'Entraînement terminé', practiceNote: 'C\'est de l\'entraînement : cela ne change pas ta progression.',
              matchResult: '{n} erreurs', memResult: '{n} coups', lightResult: '{n} réussites en {s} s' }
    };

    const fill = (s, vars) => Object.keys(vars || {}).reduce((acc, k) => acc.split('{' + k + '}').join(String(vars[k])), String(s));

    /** Studied words: the new words of the round, at most `max` (5 by default), without duplicates. */
    function pickStudyWords(queue, max = 5) {
        const out = [];
        for (const item of queue) { if (item.isNew && !out.includes(item.w)) out.push(item.w); if (out.length >= max) break; }
        return out;
    }

    /**
     * Guided check: n questions about the studied words. Question i asks word i (cycling), the first
     * ones in the direction word -> meaning and the last one meaning -> word. Pure given `r`.
     */
    function buildCheck(words, pool, n = 3, r = Math.random) {
        const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
        const qs = [];
        const count = Math.min(n, Math.max(words.length, 1));
        for (let i = 0; i < count && words.length; i++) {
            const word = words[i % words.length];
            const back = i === count - 1 && count > 1;
            const field = back ? 'w' : 't';
            const wrong = shuffle(pool.filter(x => x !== word && x[field] !== word[field])).slice(0, 3);
            qs.push({ word, field, back, options: shuffle([word].concat(wrong)), answer: word });
        }
        return qs;
    }

    /**
     * Feedback after a wrong answer, as [{ key, vars }] lines (the caller translates):
     *  1. the correct word with its meaning, 2. why the chosen option is not it, 3. the example sentence.
     * mode: 'choice' (options are meanings), 'back' (options are English words), 'type' (typed text).
     */
    function feedbackLines(word, mode, chosen) {
        const lines = [{ key: 'wrongIs', vars: { w: word.w, t: word.t } }];
        if (mode === 'type' && chosen !== undefined && chosen !== null && String(chosen).trim()) {
            lines.push({ key: 'wrongTyped', vars: { typed: String(chosen).trim(), w: word.w } });
        } else if (chosen && typeof chosen === 'object') {
            if (mode === 'back') lines.push({ key: 'wrongOtherW', vars: { ow: chosen.w, ot: chosen.t, t: word.t } });
            else lines.push({ key: 'wrongOtherT', vars: { ow: chosen.w, ot: chosen.t, w: word.w } });
        }
        if (word.e) lines.push({ key: 'exampleLabel', vars: {}, example: word.e, exampleTr: word.et || '' });
        return lines;
    }

    const LANGS = ['es', 'en', 'eu', 'gl', 'ca', 'fr'];
    /**
     * Word for the user's UI language. raw = { w, ts (Spanish meaning), i, e (English example) };
     * trWord = translations.json entry for that word. Meaning: the UI language, else Spanish.
     * Example: the English sentence stays (it is what is learned) and `et` is its translation (empty for English UI).
     */
    function localizeWord(raw, trWord, lang) {
        const l = LANGS.indexOf(lang) >= 0 ? lang : 'es';
        const m = (trWord && trWord.meaning) || {}, ex = (trWord && trWord.example) || {};
        const t = l !== 'es' && m[l] ? m[l] : raw.ts;
        const et = l === 'en' ? '' : (ex[l] || ex.es || '');
        return { w: raw.w, ts: raw.ts, t, i: raw.i, e: raw.e, et };
    }

    /** n practice words with distinct meaning, emoji and word (so pairs and cards are never ambiguous). */
    function pickPracticeWords(words, n, r = Math.random) {
        const a = words.slice();
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
        const out = [], ts = new Set(), is = new Set(), ws = new Set();
        for (const x of a) {
            if (ts.has(x.t) || is.has(x.i) || ws.has(x.w)) continue;
            ts.add(x.t); is.add(x.i); ws.add(x.w); out.push(x);
            if (out.length >= n) break;
        }
        return out;
    }

    /** Match pairs: two shuffled columns (words on the left, meanings on the right), different order when possible. */
    function buildMatch(words, r = Math.random) {
        const sh = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
        const left = sh(words); let right = sh(words);
        for (let k = 0; k < 8 && words.length > 1 && right.every((x, i) => x === left[i]); k++) right = sh(words);
        return { left, right };
    }

    /** Memory deck: for each word a "word" card and a "picture" card (emoji + meaning), shuffled. */
    function buildMemoryDeck(words, r = Math.random) {
        const cards = [];
        words.forEach((w, i) => { cards.push({ id: i + 'w', pair: i, kind: 'word', word: w }, { id: i + 'p', pair: i, kind: 'pic', word: w }); });
        for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]]; }
        return cards;
    }

    /** Hint that never gives the word away: first letter and length. */
    const hintParts = word => ({ l: String(word).charAt(0), n: String(word).replace(/\s/g, '').length });

    const api = { NEW_KEYS, pickStudyWords, buildCheck, feedbackLines, fill, localizeWord, pickPracticeWords, buildMatch, buildMemoryDeck, hintParts, LANGS };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    return api;
})();
