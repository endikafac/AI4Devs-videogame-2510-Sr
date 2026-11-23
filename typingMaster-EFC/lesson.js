/**
 * TypeMaster - keyboard lesson logic and texts (no DOM, loaded before game.js).
 *  - FINGER_MAP / KEYBOARD_ROWS: the single source for key -> finger (game.js uses them too)
 *  - LESSON_GROUPS: the key groups taught before the timed levels (home row, letters, numbers)
 *  - drillSequence: the "try these 5 keys" practice (no timer)
 *  - explainWrong: "that key is for your left ring finger" in the six languages
 */
const TypingLesson = (() => {
    'use strict';

    /* 0=left-pinky 1=left-ring 2=left-mid 3=left-idx 4=right-idx 5=right-mid 6=right-ring 7=right-pinky 8=thumb */
    const KEYBOARD_ROWS = [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
        ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ'],
        ['<', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '-'],
        [' ']
    ];
    const FINGER_MAP = {
        '1': 0, '2': 1, '3': 2, '4': 3, '5': 3, '6': 4, '7': 4, '8': 5, '9': 6, '0': 7,
        'q': 0, 'w': 1, 'e': 2, 'r': 3, 't': 3, 'y': 4, 'u': 4, 'i': 5, 'o': 6, 'p': 7,
        'a': 0, 's': 1, 'd': 2, 'f': 3, 'g': 3, 'h': 4, 'j': 4, 'k': 5, 'l': 6, 'ñ': 7,
        '<': 0, 'z': 0, 'x': 1, 'c': 2, 'v': 3, 'b': 3, 'n': 4, 'm': 4, ',': 5, '.': 6, '-': 7,
        ' ': 8
    };
    /** One colour per finger (same hues as the on-screen keyboard). */
    const FINGER_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#94a3b8'];

    /** Groups taught before a level. `level` is the first level that needs them. */
    const LESSON_GROUPS = [
        { id: 'home',    level: 1, keys: 'asdfghjklñ'.split(''), drill: ['a', 's', 'd', 'f', 'j'] },
        { id: 'letters', level: 2, keys: 'qwertyuiopzxcvbnm'.split(''), drill: ['q', 'e', 'r', 'u', 'm'] },
        { id: 'numbers', level: 5, keys: '1234567890'.split(''), drill: ['1', '2', '3', '7', '9'] }
    ];

    const LANGS = ['es-ES', 'en-US', 'eu-ES', 'gl-ES', 'ca-ES', 'fr-FR'];

    const FINGER_NAMES = {
        'es-ES': ['meñique izquierdo', 'anular izquierdo', 'corazón izquierdo', 'índice izquierdo', 'índice derecho', 'corazón derecho', 'anular derecho', 'meñique derecho', 'pulgar'],
        'en-US': ['left pinky', 'left ring finger', 'left middle finger', 'left index finger', 'right index finger', 'right middle finger', 'right ring finger', 'right pinky', 'thumb'],
        'eu-ES': ['ezkerreko hatz txikia', 'ezkerreko eraztun hatza', 'ezkerreko erdiko hatza', 'ezkerreko hatz erakuslea', 'eskuineko hatz erakuslea', 'eskuineko erdiko hatza', 'eskuineko eraztun hatza', 'eskuineko hatz txikia', 'erpurua'],
        'gl-ES': ['maimiño esquerdo', 'anular esquerdo', 'corazón esquerdo', 'índice esquerdo', 'índice dereito', 'corazón dereito', 'anular dereito', 'maimiño dereito', 'polgar'],
        'ca-ES': ['petit esquerre', 'anular esquerre', 'cor esquerre', 'índex esquerre', 'índex dret', 'cor dret', 'anular dret', 'petit dret', 'polze'],
        'fr-FR': ['auriculaire gauche', 'annulaire gauche', 'majeur gauche', 'index gauche', 'index droit', 'majeur droit', 'annulaire droit', 'auriculaire droit', 'pouce']
    };

    const LESSON_I18N = {
        'es-ES': {
            lessonTitle: 'Lección de teclado', lessonSkip: 'Saltar lección', lessonReplay: '⌨️ Lección de teclado', lessonStart: 'Empezar el nivel',
            lessonKeysTitle: 'Cada color es un dedo', lessonHandsTitle: 'Tus manos', lessonTap: 'Toca un dedo para ver sus teclas.',
            leftHand: 'Mano izquierda', rightHand: 'Mano derecha', thumbLabel: 'Pulgar (barra espaciadora)',
            lessonTry: 'Probar 5 teclas', lessonDrillTitle: 'Prueba estas 5 teclas', lessonDrillIntro: 'Sin reloj y sin prisa. Pulsa la tecla que brilla con el dedo del mismo color.',
            lessonDrillNow: 'Pulsa la tecla {k} con el dedo {finger}.', lessonDrillProgress: '{n} de {m}', lessonDrillOk: '¡Bien!',
            lessonDone: '¡Muy bien! Ya conoces estas teclas. Ahora empieza el nivel con tiempo.',
            wrongFinger: 'Esa tecla ({k}) es para el dedo {finger}.', wrongPressed: 'Pulsaste {p}, que va con el dedo {finger}.',
            fingerKeys: 'Dedo {finger}: {keys}', groupHome: 'Fila central', groupLetters: 'Letras de arriba y de abajo', groupNumbers: 'Números',
            descHome: 'Tus dedos descansan sobre A S D F (mano izquierda) y J K L Ñ (mano derecha). Las teclas F y J tienen una marquita para encontrarlas sin mirar.',
            descLetters: 'Cada dedo sube o baja desde su tecla de la fila central y vuelve a casa.',
            descNumbers: 'Los números usan el mismo dedo que la letra que tienen debajo.'
        },
        'en-US': {
            lessonTitle: 'Keyboard lesson', lessonSkip: 'Skip lesson', lessonReplay: '⌨️ Keyboard lesson', lessonStart: 'Start the level',
            lessonKeysTitle: 'Each colour is a finger', lessonHandsTitle: 'Your hands', lessonTap: 'Tap a finger to see its keys.',
            leftHand: 'Left hand', rightHand: 'Right hand', thumbLabel: 'Thumb (space bar)',
            lessonTry: 'Try 5 keys', lessonDrillTitle: 'Try these 5 keys', lessonDrillIntro: 'No timer, no rush. Press the glowing key with the finger of the same colour.',
            lessonDrillNow: 'Press the {k} key with your {finger}.', lessonDrillProgress: '{n} of {m}', lessonDrillOk: 'Good!',
            lessonDone: 'Well done! You know these keys now. The timed level starts next.',
            wrongFinger: 'That key ({k}) is for your {finger}.', wrongPressed: 'You pressed {p}, which belongs to your {finger}.',
            fingerKeys: '{finger}: {keys}', groupHome: 'Home row', groupLetters: 'Top and bottom letters', groupNumbers: 'Numbers',
            descHome: 'Your fingers rest on A S D F (left hand) and J K L Ñ (right hand). F and J have a small bump so you can find them without looking.',
            descLetters: 'Each finger reaches up or down from its home row key and comes back home.',
            descNumbers: 'Numbers use the same finger as the letter below them.'
        },
        'eu-ES': {
            lessonTitle: 'Teklatuaren ikasgaia', lessonSkip: 'Saltatu ikasgaia', lessonReplay: '⌨️ Teklatuaren ikasgaia', lessonStart: 'Hasi maila',
            lessonKeysTitle: 'Kolore bakoitza hatz bat da', lessonHandsTitle: 'Zure eskuak', lessonTap: 'Ukitu hatz bat bere teklak ikusteko.',
            leftHand: 'Ezkerreko eskua', rightHand: 'Eskuineko eskua', thumbLabel: 'Erpurua (zuriune barra)',
            lessonTry: 'Probatu 5 tekla', lessonDrillTitle: 'Probatu 5 tekla hauek', lessonDrillIntro: 'Denborarik gabe, presarik gabe. Sakatu argitzen duen tekla kolore bereko hatzarekin.',
            lessonDrillNow: 'Sakatu {k} tekla hatz honekin: {finger}.', lessonDrillProgress: '{m}tik {n}', lessonDrillOk: 'Ongi!',
            lessonDone: 'Oso ongi! Tekla hauek ezagutzen dituzu orain. Orain denbora duen maila hasiko da.',
            wrongFinger: 'Tekla hori ({k}) hatz honentzat da: {finger}.', wrongPressed: '{p} sakatu duzu, hatz honena da: {finger}.',
            fingerKeys: '{finger}: {keys}', groupHome: 'Erdiko lerroa', groupLetters: 'Goiko eta beheko letrak', groupNumbers: 'Zenbakiak',
            descHome: 'Zure hatzak A S D F (ezkerreko eskua) eta J K L Ñ (eskuineko eskua) teklen gainean daude. F eta J teklek marka txiki bat dute, begiratu gabe aurkitzeko.',
            descLetters: 'Hatz bakoitzak goraka edo beheraka egiten du bere erdiko lerroko teklatik eta etxera itzultzen da.',
            descNumbers: 'Zenbakiek azpian duten letraren hatz bera erabiltzen dute.'
        },
        'gl-ES': {
            lessonTitle: 'Lección de teclado', lessonSkip: 'Saltar lección', lessonReplay: '⌨️ Lección de teclado', lessonStart: 'Comezar o nivel',
            lessonKeysTitle: 'Cada cor é un dedo', lessonHandsTitle: 'As túas mans', lessonTap: 'Toca un dedo para ver as súas teclas.',
            leftHand: 'Man esquerda', rightHand: 'Man dereita', thumbLabel: 'Polgar (barra espazadora)',
            lessonTry: 'Probar 5 teclas', lessonDrillTitle: 'Proba estas 5 teclas', lessonDrillIntro: 'Sen reloxo e sen présa. Preme a tecla que brilla co dedo da mesma cor.',
            lessonDrillNow: 'Preme a tecla {k} co dedo {finger}.', lessonDrillProgress: '{n} de {m}', lessonDrillOk: 'Ben!',
            lessonDone: 'Moi ben! Xa coñeces estas teclas. Agora comeza o nivel con tempo.',
            wrongFinger: 'Esa tecla ({k}) é para o dedo {finger}.', wrongPressed: 'Premeches {p}, que vai co dedo {finger}.',
            fingerKeys: 'Dedo {finger}: {keys}', groupHome: 'Fila central', groupLetters: 'Letras de arriba e de abaixo', groupNumbers: 'Números',
            descHome: 'Os teus dedos descansan sobre A S D F (man esquerda) e J K L Ñ (man dereita). As teclas F e J teñen unha marquiña para atopalas sen mirar.',
            descLetters: 'Cada dedo sobe ou baixa desde a súa tecla da fila central e volve á casa.',
            descNumbers: 'Os números usan o mesmo dedo que a letra que teñen debaixo.'
        },
        'ca-ES': {
            lessonTitle: 'Lliçó de teclat', lessonSkip: 'Salta la lliçó', lessonReplay: '⌨️ Lliçó de teclat', lessonStart: 'Comença el nivell',
            lessonKeysTitle: 'Cada color és un dit', lessonHandsTitle: 'Les teves mans', lessonTap: 'Toca un dit per veure les seves tecles.',
            leftHand: 'Mà esquerra', rightHand: 'Mà dreta', thumbLabel: 'Polze (barra espaiadora)',
            lessonTry: 'Prova 5 tecles', lessonDrillTitle: 'Prova aquestes 5 tecles', lessonDrillIntro: 'Sense rellotge i sense pressa. Prem la tecla que brilla amb el dit del mateix color.',
            lessonDrillNow: 'Prem la tecla {k} amb el dit {finger}.', lessonDrillProgress: '{n} de {m}', lessonDrillOk: 'Molt bé!',
            lessonDone: 'Molt bé! Ja coneixes aquestes tecles. Ara comença el nivell amb temps.',
            wrongFinger: 'Aquesta tecla ({k}) és per al dit {finger}.', wrongPressed: 'Has premut {p}, que va amb el dit {finger}.',
            fingerKeys: 'Dit {finger}: {keys}', groupHome: 'Fila central', groupLetters: 'Lletres de dalt i de baix', groupNumbers: 'Números',
            descHome: 'Els teus dits reposen sobre A S D F (mà esquerra) i J K L Ñ (mà dreta). Les tecles F i J tenen una marqueta per trobar-les sense mirar.',
            descLetters: 'Cada dit puja o baixa des de la seva tecla de la fila central i torna a casa.',
            descNumbers: 'Els números fan servir el mateix dit que la lletra que tenen a sota.'
        },
        'fr-FR': {
            lessonTitle: 'Leçon de clavier', lessonSkip: 'Passer la leçon', lessonReplay: '⌨️ Leçon de clavier', lessonStart: 'Commencer le niveau',
            lessonKeysTitle: 'Chaque couleur est un doigt', lessonHandsTitle: 'Tes mains', lessonTap: 'Touche un doigt pour voir ses touches.',
            leftHand: 'Main gauche', rightHand: 'Main droite', thumbLabel: 'Pouce (barre d\'espace)',
            lessonTry: 'Essayer 5 touches', lessonDrillTitle: 'Essaie ces 5 touches', lessonDrillIntro: 'Sans chrono et sans se presser. Appuie sur la touche qui brille avec le doigt de la même couleur.',
            lessonDrillNow: 'Appuie sur la touche {k} avec : {finger}.', lessonDrillProgress: '{n} sur {m}', lessonDrillOk: 'Bien !',
            lessonDone: 'Bravo ! Tu connais ces touches. Le niveau chronométré commence maintenant.',
            wrongFinger: 'Cette touche ({k}) se tape avec : {finger}.', wrongPressed: 'Tu as appuyé sur {p}, qui se tape avec : {finger}.',
            fingerKeys: '{finger} : {keys}', groupHome: 'Rangée du milieu', groupLetters: 'Lettres du haut et du bas', groupNumbers: 'Chiffres',
            descHome: 'Tes doigts reposent sur A S D F (main gauche) et J K L Ñ (main droite). Les touches F et J ont un petit repère pour les trouver sans regarder.',
            descLetters: 'Chaque doigt monte ou descend depuis sa touche de la rangée du milieu puis revient.',
            descNumbers: 'Les chiffres se tapent avec le même doigt que la lettre située en dessous.'
        }
    };

    const fill = (s, vars) => Object.keys(vars || {}).reduce((acc, k) => acc.split('{' + k + '}').join(String(vars[k])), s);
    const dict = lang => LESSON_I18N[lang] || LESSON_I18N['es-ES'];
    const text = (lang, key, vars) => fill(dict(lang)[key] !== undefined ? dict(lang)[key] : LESSON_I18N['es-ES'][key] || key, vars);

    const baseKey = ch => String(ch === undefined || ch === null ? '' : ch).toLowerCase();
    /** Finger index (0-8) of a typed character, or -1 when it has no home key (accents, symbols). */
    function fingerOf(ch) { const k = baseKey(ch); return Object.prototype.hasOwnProperty.call(FINGER_MAP, k) ? FINGER_MAP[k] : -1; }
    const fingerName = (lang, idx) => ((FINGER_NAMES[lang] || FINGER_NAMES['es-ES'])[idx]) || '';
    const keyLabel = ch => ch === ' ' ? 'ESP' : ch === '<' ? '<>' : String(ch).toUpperCase();

    /** The first group not seen yet whose first level is `level` (or lower), else null. */
    function lessonForLevel(level, isSeen) {
        for (const g of LESSON_GROUPS) if (g.level === level && !isSeen(g.id)) return g;
        return null;
    }
    /** The group to replay for a level: the latest group that starts at or before it. */
    function groupForLevel(level) {
        let hit = LESSON_GROUPS[0];
        for (const g of LESSON_GROUPS) if (g.level <= level) hit = g;
        return hit;
    }

    /** "Try these 5 keys": every drill key twice, in random order, never the same key twice in a row. Pure given `r`. */
    function drillSequence(group, r = Math.random) {
        const keys = group.drill;
        for (let attempt = 0; attempt < 50; attempt++) {
            const seq = keys.concat(keys);
            for (let i = seq.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [seq[i], seq[j]] = [seq[j], seq[i]]; }
            if (seq.every((k, i) => i === 0 || k !== seq[i - 1])) return seq;
        }
        return keys.concat(keys.slice().reverse());
    }

    /** Text shown after a wrong key: the right finger for the expected key (+ the finger of the pressed key). */
    function explainWrong(lang, expected, pressed) {
        const fi = fingerOf(expected);
        if (fi < 0) return '';
        let msg = text(lang, 'wrongFinger', { k: keyLabel(baseKey(expected)), finger: fingerName(lang, fi) });
        const pi = fingerOf(pressed);
        if (pressed !== undefined && pi >= 0 && pi !== fi && String(pressed).length === 1) {
            msg += ' ' + text(lang, 'wrongPressed', { p: keyLabel(baseKey(pressed)), finger: fingerName(lang, pi) });
        }
        return msg;
    }

    /** Keys of a group that one finger types (for the hands diagram). */
    function keysOfFinger(group, idx) { return group.keys.filter(k => FINGER_MAP[k] === idx); }

    const api = { KEYBOARD_ROWS, FINGER_MAP, FINGER_COLORS, LESSON_GROUPS, LANGS, FINGER_NAMES, LESSON_I18N,
        text, fingerOf, fingerName, keyLabel, lessonForLevel, groupForLevel, drillSequence, explainWrong, keysOfFinger };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    return api;
})();
