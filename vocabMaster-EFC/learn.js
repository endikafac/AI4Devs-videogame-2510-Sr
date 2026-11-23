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
              wrongTyped: 'Escribiste “{typed}”, pero se escribe “{w}”.', incorrect: 'Incorrecto' },
        en: { studyTitle: 'Study the new words', studyTap: 'Tap the card to flip it', studyNext: 'Next card', studyCount: '{n} / {m}',
              studyCheck: 'Try 3 questions', studySkip: 'Skip', checkTitle: 'Guided check', checkCount: 'Question {n} of {m}',
              checkOk: 'Correct!', checkTry: 'Try again.', checkStart: 'Start the round', exampleLabel: 'Example', flipBack: 'Meaning',
              wrongIs: 'The correct word is “{w}” ({t}).', wrongOtherT: '“{ot}” is “{ow}”, not “{w}”.', wrongOtherW: '“{ow}” means “{ot}”, not “{t}”.',
              wrongTyped: 'You typed “{typed}”, but it is spelled “{w}”.', incorrect: 'Not quite' },
        eu: { studyTitle: 'Ikasi hitz berriak', studyTap: 'Ukitu txartela buelta emateko', studyNext: 'Hurrengo txartela', studyCount: '{n} / {m}',
              studyCheck: 'Probatu 3 galderarekin', studySkip: 'Saltatu', checkTitle: 'Egiaztapen gidatua', checkCount: '{n}. galdera ({m}tik)',
              checkOk: 'Zuzena!', checkTry: 'Saiatu berriro.', checkStart: 'Hasi txanda', exampleLabel: 'Adibidea', flipBack: 'Esanahia',
              wrongIs: 'Hitz zuzena “{w}” da ({t}).', wrongOtherT: '“{ot}” “{ow}” da, ez “{w}”.', wrongOtherW: '“{ow}” “{ot}” da, ez “{t}”.',
              wrongTyped: '“{typed}” idatzi duzu, baina “{w}” idazten da.', incorrect: 'Ez da hori' },
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
              wrongTyped: 'Escribiches “{typed}”, pero escríbese “{w}”.', incorrect: 'Non é esa' },
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
              wrongTyped: 'Has escrit “{typed}”, però s\'escriu “{w}”.', incorrect: 'No és aquesta' },
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
              wrongTyped: 'Tu as écrit « {typed} », mais il s\'écrit « {w} ».', incorrect: 'Pas tout à fait' }
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
        if (word.e) lines.push({ key: 'exampleLabel', vars: {}, example: word.e });
        return lines;
    }

    const api = { NEW_KEYS, pickStudyWords, buildCheck, feedbackLines, fill };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    return api;
})();
