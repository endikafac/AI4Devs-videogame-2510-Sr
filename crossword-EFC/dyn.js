/**
 * Dyn: small shared helpers that make question screens clear and lively (zone labels, coloured answer
 * buttons with shapes, staggered entrance, streak/points HUD, progress ring, star reveal, drag helper,
 * help sheet). Self contained, no dependencies. The same file is shipped inside each game folder.
 * Works together with platform/juice.js when it is loaded; every Juice call is optional.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory(null);
    else root.Dyn = factory(root);
})(typeof self !== 'undefined' ? self : this, function (win) {
    'use strict';
    var doc = win && win.document;
    var LANGS = ['es', 'en', 'eu', 'gl', 'ca', 'fr'];
    function L(es, en, eu, gl, ca, fr) { return { es: es, en: en, eu: eu, gl: gl, ca: ca, fr: fr }; }
    var TXT = {
        q: L('Pregunta {n} de {m}', 'Question {n} of {m}', '{n}. galdera ({m} guztira)', 'Pregunta {n} de {m}', 'Pregunta {n} de {m}', 'Question {n} sur {m}'),
        level: L('Nivel {n}', 'Level {n}', '{n}. maila', 'Nivel {n}', 'Nivell {n}', 'Niveau {n}'),
        choose: L('Elige la respuesta', 'Pick your answer', 'Aukeratu erantzuna', 'Elixe a resposta', 'Tria la resposta', 'Choisis ta réponse'),
        write: L('Escribe la respuesta', 'Type your answer', 'Idatzi erantzuna', 'Escribe a resposta', 'Escriu la resposta', 'Écris ta réponse'),
        drag: L('Arrastra', 'Drag', 'Arrastatu', 'Arrastra', 'Arrossega', 'Glisse'),
        tap: L('Toca', 'Tap', 'Sakatu', 'Toca', 'Toca', 'Touche'),
        question: L('Pregunta', 'Question', 'Galdera', 'Pregunta', 'Pregunta', 'Question'),
        help: L('Ayuda', 'Help', 'Laguntza', 'Axuda', 'Ajuda', 'Aide'),
        close: L('Cerrar', 'Close', 'Itxi', 'Pechar', 'Tancar', 'Fermer'),
        streak: L('Racha', 'Streak', 'Erreta', 'Racha', 'Ratxa', 'Série'),
        points: L('Puntos', 'Points', 'Puntuak', 'Puntos', 'Punts', 'Points'),
        next: L('Siguiente', 'Next', 'Hurrengoa', 'Seguinte', 'Següent', 'Suivant'),
        why: L('¿Por qué?', 'Why?', 'Zergatik?', 'Por que?', 'Per què?', 'Pourquoi ?'),
        goal: L('Meta de hoy', 'Today\'s goal', 'Gaurko helburua', 'Meta de hoxe', 'Meta d\'avui', 'Objectif du jour'),
        goalDone: L('¡Meta cumplida!', 'Goal reached!', 'Helburua beteta!', 'Meta cumprida!', 'Meta complerta!', 'Objectif atteint !'),
        words: L('Palabras', 'Words', 'Hitzak', 'Palabras', 'Paraules', 'Mots'),
        hintLabel: L('Pista', 'Hint', 'Pista', 'Pista', 'Pista', 'Indice'),
        yourAnswer: L('Tu respuesta', 'Your answer', 'Zure erantzuna', 'A túa resposta', 'La teva resposta', 'Ta réponse'),
        correctIs: L('La respuesta correcta', 'The right answer', 'Erantzun zuzena', 'A resposta correcta', 'La resposta correcta', 'La bonne réponse'),
        check: L('Comprobar', 'Check', 'Egiaztatu', 'Comprobar', 'Comprovar', 'Vérifier'),
        speed: L('Ronda relámpago', 'Lightning round', 'Tximista-itzulia', 'Rolda lóstrego', 'Ronda llamp', 'Manche éclair'),
        timeLeft: L('Tiempo', 'Time', 'Denbora', 'Tempo', 'Temps', 'Temps'),
        best: L('Mejor', 'Best', 'Onena', 'Mellor', 'Millor', 'Meilleur'),
        again: L('Otra vez', 'Again', 'Berriro', 'Outra vez', 'Un altre cop', 'Encore'),
        back: L('Volver', 'Back', 'Itzuli', 'Volver', 'Tornar', 'Retour'),
        minigames: L('Minijuegos', 'Mini games', 'Mini jokoak', 'Minixogos', 'Minijocs', 'Mini-jeux'),
        round: L('Ronda {n} de {m}', 'Round {n} of {m}', '{n}. itzulia ({m})', 'Rolda {n} de {m}', 'Ronda {n} de {m}', 'Manche {n} sur {m}'),
        score: L('Aciertos', 'Right', 'Asmatuak', 'Acertos', 'Encerts', 'Réussies'),
        pairsLeft: L('Parejas', 'Pairs', 'Bikoteak', 'Parellas', 'Parelles', 'Paires'),
        dragHands: L('Arrastra las agujas', 'Drag the hands', 'Arrastatu orratzak', 'Arrastra as agullas', 'Arrossega les busques', 'Glisse les aiguilles'),
        tapClock: L('Toca el reloj correcto', 'Tap the right clock', 'Sakatu ordulari zuzena', 'Toca o reloxo correcto', 'Toca el rellotge correcte', 'Touche la bonne horloge'),
        matchPairs: L('Une las parejas', 'Match the pairs', 'Lotu bikoteak', 'Une as parellas', 'Uneix les parelles', 'Associe les paires'),
        tapSlices: L('Toca las porciones', 'Tap the slices', 'Sakatu zatiak', 'Toca as porcións', 'Toca les porcions', 'Touche les parts'),
        tapLine: L('Toca la recta', 'Tap the number line', 'Sakatu zuzena', 'Toca a recta', 'Toca la recta', 'Touche la droite'),
        dragSlices: L('Arrastra las porciones a la pizza', 'Drag slices into the pizza', 'Arrastatu zatiak pizzara', 'Arrastra as porcións á pizza', 'Arrossega les porcions a la pizza', 'Glisse les parts dans la pizza'),
        matchCards: L('Toca una fracción y su dibujo', 'Tap a fraction and its picture', 'Sakatu zatiki bat eta bere marrazkia', 'Toca unha fracción e o seu debuxo', 'Toca una fracció i el seu dibuix', 'Touche une fraction et son dessin'),
        tray: L('Porciones', 'Slices', 'Zatiak', 'Porcións', 'Porcions', 'Parts'),
        yourPizza: L('Tu pizza', 'Your pizza', 'Zure pizza', 'A túa pizza', 'La teva pizza', 'Ta pizza'),
        pairsFound: L('Parejas: {n} de {m}', 'Pairs: {n} of {m}', 'Bikoteak: {n}/{m}', 'Parellas: {n} de {m}', 'Parelles: {n} de {m}', 'Paires : {n} sur {m}'),
        flipTwo: L('Toca dos cartas', 'Tap two cards', 'Sakatu bi karta', 'Toca dúas cartas', 'Toca dues cartes', 'Touche deux cartes'),
        memHelp: L('Toca dos cartas para darles la vuelta. Si son pareja, se quedan abiertas. Si no, se tapan: recuerda dónde estaban.', 'Tap two cards to flip them. If they match, they stay open. If not, they flip back: remember where they were.', 'Sakatu bi karta buelta emateko. Bikotea badira, irekita geratzen dira. Ez badira, estali egiten dira: gogoratu non zeuden.', 'Toca dúas cartas para dálas a volta. Se son parella, quedan abertas. Se non, tápanse: lembra onde estaban.', 'Toca dues cartes per girar-les. Si són parella, es queden obertes. Si no, es tapen: recorda on eren.', 'Touche deux cartes pour les retourner. Si elles forment une paire, elles restent ouvertes. Sinon, elles se cachent : souviens-toi où elles étaient.'),
        timedMode: L('Modo con tiempo (sin prisa)', 'Timed mode (no rush)', 'Denbora modua (presarik gabe)', 'Modo con tempo (sen présa)', 'Mode amb temps (sense pressa)', 'Mode chrono (sans stress)'),
        onTime: L('¡A tiempo!', 'On time!', 'Garaiz!', 'A tempo!', 'A temps!', 'Dans les temps !'),
        noRush: L('Sin prisa, sigue a tu ritmo', 'No rush, keep your own pace', 'Presarik ez, zure erritmoan jarraitu', 'Sen présa, segue ao teu ritmo', 'Sense pressa, segueix el teu ritme', 'Pas de stress, à ton rythme'),
        rpHelpFlash: L('Toca la tarjeta para ver la respuesta. Después desliza a la derecha si la sabías o a la izquierda si todavía no.', 'Tap the card to see the answer. Then swipe right if you knew it or left if not yet.', 'Sakatu txartela erantzuna ikusteko. Gero irristatu eskuinera banekien bada, edo ezkerrera oraindik ez bada.', 'Toca a tarxeta para ver a resposta. Despois desliza á dereita se a sabías ou á esquerda se aínda non.', 'Toca la targeta per veure la resposta. Després llisca a la dreta si la sabies o a l\'esquerra si encara no.', 'Touche la carte pour voir la réponse. Puis glisse à droite si tu la savais, à gauche sinon.'),
        hintStarts: L('Empieza por «{c}» y tiene {n} letras.', 'It starts with “{c}” and has {n} letters.', '«{c}» letraz hasten da eta {n} letra ditu.', 'Comeza por «{c}» e ten {n} letras.', 'Comença per «{c}» i té {n} lletres.', 'Elle commence par « {c} » et a {n} lettres.'),
        swipeHint: L('Desliza la tarjeta', 'Swipe the card', 'Irristatu txartela', 'Desliza a tarxeta', 'Llisca la targeta', 'Glisse la carte'),
        dragFill: L('Arrastra o toca la respuesta', 'Drag or tap the answer', 'Arrastatu edo sakatu erantzuna', 'Arrastra ou toca a resposta', 'Arrossega o toca la resposta', 'Glisse ou touche la réponse'),
        euHelp: L('Mira quién lo hace (NORK), a quién (NORI) y qué (NOR):', 'Look at who does it (NORK), to whom (NORI) and what (NOR):', 'Begiratu nork egiten duen (NORK), norentzat (NORI) eta zer (NOR):', 'Mira quen o fai (NORK), a quen (NORI) e que (NOR):', 'Mira qui ho fa (NORK), a qui (NORI) i què (NOR):', 'Regarde qui le fait (NORK), à qui (NORI) et quoi (NOR) :'),
        euListen: L('Pulsa «Escuchar texto» otra vez y busca las palabras clave.', 'Press “Listen” again and look for the key words.', 'Sakatu berriro «Entzun» eta bilatu hitz gakoak.', 'Preme «Escoitar» outra vez e busca as palabras clave.', 'Prem «Escoltar» un altre cop i busca les paraules clau.', 'Appuie encore sur « Écouter » et cherche les mots clés.'),
        caseTitle: L('Toca el caso', 'Tap the case', 'Sakatu kasua', 'Toca o caso', 'Toca el cas', 'Touche le cas'),
        caseHelp: L('Lee la frase y toca la pieza que responde a la pregunta.', 'Read the sentence and tap the piece that answers the question.', 'Irakurri esaldia eta sakatu galderari erantzuten dion pieza.', 'Le a frase e toca a peza que responde á pregunta.', 'Llegeix la frase i toca la peça que respon a la pregunta.', 'Lis la phrase et touche la pièce qui répond à la question.'),
        wsFind: L('Palabras que buscar', 'Words to find', 'Bilatzeko hitzak', 'Palabras que buscar', 'Paraules per buscar', 'Mots à trouver'),
        wsDragLetters: L('Arrastra sobre las letras para unirlas', 'Drag over the letters to join them', 'Arrastatu letren gainetik', 'Arrastra sobre as letras para unilas', 'Arrossega sobre les lletres per unir-les', 'Glisse sur les lettres pour les relier'),
        wsHint: L('Pista: ver dónde empieza una palabra', 'Hint: see where a word starts', 'Pista: ikusi non hasten den hitz bat', 'Pista: ver onde empeza unha palabra', 'Pista: veure on comença una paraula', 'Indice : voir où commence un mot'),
        wsHintNote: L('Busca «{w}» ({n} letras): empieza en la fila {r}, columna {c}.', 'Look for “{w}” ({n} letters): it starts at row {r}, column {c}.', '«{w}» bilatu ({n} letra): {r}. errenkada, {c}. zutabea.', 'Busca «{w}» ({n} letras): empeza na fila {r}, columna {c}.', 'Busca «{w}» ({n} lletres): comença a la fila {r}, columna {c}.', 'Cherche « {w} » ({n} lettres) : il commence ligne {r}, colonne {c}.'),
        cwGrid: L('Toca una casilla y escribe', 'Tap a square and type', 'Sakatu laukia eta idatzi', 'Toca unha casa e escribe', 'Toca una casella i escriu', 'Touche une case et écris'),
        cwClues: L('Pistas', 'Clues', 'Aztarnak', 'Pistas', 'Pistes', 'Définitions'),
        cwHint: L('Pista: revela una letra', 'Hint: reveal a letter', 'Pista: letra bat erakutsi', 'Pista: revela unha letra', 'Pista: revela una lletra', 'Indice : révèle une lettre'),
        wordDone: L('¡Palabra completa!', 'Word complete!', 'Hitza osatuta!', 'Palabra completa!', 'Paraula completa!', 'Mot complet !'),
        moves: L('Movimientos', 'Moves', 'Mugimenduak', 'Movementos', 'Moviments', 'Coups')
    };

    function lang() {
        var l = 'es';
        try { var P = win && win.PlatformI18n; if (P && P.currentLanguage) l = String(P.currentLanguage).slice(0, 2); } catch (e) { /* ignore */ }
        return LANGS.indexOf(l) >= 0 ? l : 'es';
    }
    function t(key, vars) {
        var e = TXT[key]; if (!e) return key;
        var s = e[lang()] || e.es;
        if (vars) Object.keys(vars).forEach(function (k) { s = s.split('{' + k + '}').join(vars[k]); });
        return s;
    }
    function reduced() { try { return !!(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } }
    function el(tag, cls, text) { var e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

    var CSS = [
        '.dy-zone{display:inline-block;margin:2px 0 8px;padding:3px 12px;border-radius:999px;font:800 .78rem/1.4 system-ui,sans-serif;letter-spacing:.05em;text-transform:uppercase;background:rgba(251,191,36,.16);color:#fbbf24;border:1px solid rgba(251,191,36,.45)}',
        '.dy-zone.q{background:rgba(56,189,248,.16);color:#7dd3fc;border-color:rgba(56,189,248,.5)}',
        '.dy-zoneL{display:block;text-align:center;margin-top:6px}',
        '.dy-hud{display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap;margin:-6px 0 12px}',
        '.dy-chip{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:999px;font:800 .95rem/1.2 system-ui,sans-serif;background:rgba(15,23,42,.55);color:#fff;border:1px solid rgba(148,163,184,.4);font-variant-numeric:tabular-nums}',
        '.dy-chip.flame.hot{background:linear-gradient(135deg,#f97316,#ef4444);border-color:#fb923c;animation:dyBeat .8s ease-in-out infinite}',
        '.dy-chip.bump{animation:dyBump .45s ease}',
        '@keyframes dyBeat{50%{transform:scale(1.08)}}',
        '@keyframes dyBump{0%{transform:scale(1)}40%{transform:scale(1.28)}100%{transform:scale(1)}}',
        '.dy-k0{--k:#be123c}.dy-k1{--k:#1d4ed8}.dy-k2{--k:#b45309}.dy-k3{--k:#7e22ce}',
        '.dy-k{position:relative}',
        '.dy-k:not(.ok):not(.bad):not(.right):not(.wrong):not(.correct){border-color:var(--k);box-shadow:0 4px 0 var(--k)}',
        '.dy-k::before{content:attr(data-shape);position:absolute;top:6px;left:8px;width:22px;height:22px;border-radius:7px;background:var(--k);color:#fff;font:800 .8rem/22px system-ui,sans-serif;text-align:center;pointer-events:none}',
        '.dy-fill:not(.ok):not(.bad):not(.right):not(.wrong):not(.correct){background:var(--k)!important;color:#fff!important}',
        '.dy-fill{padding-left:34px}',
        '.dy-done .dy-k:not(.ok):not(.bad):not(.right):not(.wrong):not(.correct){opacity:.55}',
        '.dy-k:active{transform:translateY(3px)!important;box-shadow:0 1px 0 var(--k)!important}',
        '.dy-in{animation:dyIn .32s backwards;animation-delay:calc(var(--i,0)*70ms)}',
        '@keyframes dyIn{from{opacity:0;transform:translateY(14px) scale(.96)}}',
        '.dy-slide{animation:dySlide .28s ease-out}',
        '@keyframes dySlide{from{opacity:0;transform:translateX(26px)}to{opacity:1;transform:none}}',
        '.dy-why{margin:10px 0 0;padding:12px 14px;border-radius:14px;background:rgba(251,191,36,.14);border:2px solid #fbbf24;color:inherit;font-size:1.08rem;font-weight:700;line-height:1.4;text-align:left}',
        '.dy-why b{display:block;color:#fbbf24;font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px}',
        '.dy-tools{display:flex;justify-content:flex-end;align-items:center;gap:8px;margin:0 0 8px;flex-wrap:wrap}',
        '.dy-help{min-width:48px;min-height:48px;padding:0 14px;border-radius:14px;border:2px solid #fbbf24;background:rgba(251,191,36,.16);color:#fde68a;font:800 1rem/1 system-ui,sans-serif;cursor:pointer;white-space:nowrap}',
        '.dy-help:focus-visible{outline:3px solid #fff;outline-offset:2px}',
        '.dy-ring{display:block}.dy-ring .bg{stroke:rgba(148,163,184,.3)}.dy-ring .fg{stroke:#22c55e;stroke-linecap:round;transition:stroke-dashoffset .6s ease}',
        '.dy-ring text{fill:currentColor;font:800 .95rem system-ui,sans-serif;text-anchor:middle;dominant-baseline:central}',
        '.dy-star{display:inline-block;animation:dyStar .5s backwards cubic-bezier(.2,1.6,.4,1);animation-delay:calc(var(--i,0)*320ms)}',
        '.dy-star.off{opacity:.45}',
        '@keyframes dyStar{from{opacity:0;transform:scale(.2) rotate(-40deg)}}',
        '.dy-ghost{position:fixed!important;z-index:10000;pointer-events:none;margin:0!important;opacity:.92;transform:scale(1.08) rotate(3deg);box-shadow:0 12px 26px rgba(0,0,0,.45)}',
        '.dy-dragging{opacity:.35}',
        '.dy-over{outline:3px dashed #fbbf24;outline-offset:2px}',
        '.dy-sheet-bg{position:fixed;inset:0;z-index:9998;background:rgba(2,6,23,.6);display:flex;align-items:flex-end;justify-content:center}',
        '.dy-sheet{width:min(560px,100%);max-height:80vh;overflow:auto;background:#1e293b;color:#f8fafc;border:2px solid #fbbf24;border-radius:20px 20px 0 0;padding:18px 16px calc(18px + env(safe-area-inset-bottom));animation:dySheet .25s ease-out}',
        '.dy-sheet h3{margin:0 0 8px;font-size:1.15rem}.dy-sheet p{margin:0 0 12px;font-size:1.05rem;line-height:1.45}',
        '.dy-sheet button{min-height:48px;padding:0 20px;border-radius:14px;border:0;background:#fbbf24;color:#1e293b;font:800 1rem system-ui,sans-serif;cursor:pointer}',
        '@keyframes dySheet{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}',
        '.dy-bar{height:12px;border-radius:6px;background:rgba(148,163,184,.3);overflow:hidden}.dy-bar i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#22c55e,#facc15);transform-origin:left;transition:transform .25s linear}',
        '@media (prefers-reduced-motion:reduce){.dy-in,.dy-slide,.dy-star,.dy-chip.flame.hot,.dy-chip.bump,.dy-sheet{animation:none!important}.dy-ring .fg,.dy-bar i{transition:none}}'
    ].join('\n');
    function ensureCss() {
        if (!doc || doc.getElementById('dy-css')) return;
        var s = doc.createElement('style'); s.id = 'dy-css'; s.textContent = CSS; (doc.head || doc.documentElement).appendChild(s);
    }
    if (doc) { if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', ensureCss); else ensureCss(); }

    var SHAPES = ['▲', '◆', '●', '■'];
    /** Colours and shapes (Kahoot style) for the buttons of a container; fill=true paints the whole button. */
    function style(container, opts) {
        if (!container) return;
        ensureCss(); opts = opts || {};
        var kids = Array.prototype.slice.call(container.querySelectorAll(opts.sel || 'button'));
        kids.forEach(function (b, i) {
            b.classList.add('dy-k', 'dy-k' + (i % 4), 'dy-in'); if (opts.fill !== false) b.classList.add('dy-fill');
            b.dataset.shape = SHAPES[i % 4]; b.style.setProperty('--i', i);
        });
    }
    function slide(node) { if (!node) return; ensureCss(); node.classList.remove('dy-slide'); void node.offsetWidth; node.classList.add('dy-slide'); }
    function zone(textOrKey, cls) { ensureCss(); var p = el('p', 'dy-zone ' + (cls || ''), TXT[textOrKey] ? t(textOrKey) : textOrKey); return p; }

    /** HUD row with streak flame and points. Returns { root, setStreak(n), setPoints(n) }. */
    function hud(before, opts) {
        ensureCss(); opts = opts || {};
        var root = el('div', 'dy-hud'); root.setAttribute('role', 'status');
        var flame = el('span', 'dy-chip flame'), pts = opts.noPoints ? null : el('span', 'dy-chip');
        root.appendChild(flame); if (pts) root.appendChild(pts);
        if (before && before.parentNode) before.parentNode.insertBefore(root, before.nextSibling);
        var last = 0;
        var api = {
            root: root,
            setStreak: function (n) {
                n = n || 0; flame.textContent = '🔥 ' + t('streak') + ' ' + n; flame.classList.toggle('hot', n >= 3);
                if (n > last) { flame.classList.remove('bump'); void flame.offsetWidth; flame.classList.add('bump'); } last = n;
            },
            setPoints: function (n) { if (pts) pts.textContent = '⭐ ' + t('points') + ' ' + n; }
        };
        api.setStreak(0); api.setPoints(0);
        return api;
    }

    var NS = 'http://www.w3.org/2000/svg';
    /** Progress ring. Returns { el, set(frac, text) }. */
    function ring(size, stroke, color) {
        ensureCss(); size = size || 64; stroke = stroke || 8;
        var r = (size - stroke) / 2, c = 2 * Math.PI * r;
        var svg = doc.createElementNS(NS, 'svg'); svg.setAttribute('class', 'dy-ring'); svg.setAttribute('width', size); svg.setAttribute('height', size); svg.setAttribute('viewBox', '0 0 ' + size + ' ' + size);
        svg.setAttribute('role', 'img');
        function mk(cls) { var k = doc.createElementNS(NS, 'circle'); k.setAttribute('class', cls); k.setAttribute('cx', size / 2); k.setAttribute('cy', size / 2); k.setAttribute('r', r); k.setAttribute('fill', 'none'); k.setAttribute('stroke-width', stroke); return k; }
        var bg = mk('bg'), fg = mk('fg'); if (color) fg.setAttribute('stroke', color);
        fg.setAttribute('stroke-dasharray', c); fg.setAttribute('stroke-dashoffset', c); fg.setAttribute('transform', 'rotate(-90 ' + size / 2 + ' ' + size / 2 + ')');
        var tx = doc.createElementNS(NS, 'text'); tx.setAttribute('x', size / 2); tx.setAttribute('y', size / 2);
        svg.appendChild(bg); svg.appendChild(fg); svg.appendChild(tx);
        return { el: svg, set: function (frac, text, label) { frac = Math.max(0, Math.min(1, frac || 0)); fg.setAttribute('stroke-dashoffset', c * (1 - frac)); tx.textContent = text == null ? '' : text; if (label) svg.setAttribute('aria-label', label); } };
    }

    /** Fills el with total stars, `n` lit, appearing one by one. */
    function stars(node, n, total, glyph) {
        if (!node) return; ensureCss(); node.textContent = '';
        for (var i = 0; i < total; i++) {
            var s = el('span', 'dy-star' + (i < n ? '' : ' off'), i < n ? (glyph || '★') : (glyph === '⭐' ? '☆' : '☆')); s.style.setProperty('--i', i); node.appendChild(s);
        }
    }

    /** A prominent "why" box. */
    function why(parent, text) { ensureCss(); var d = el('div', 'dy-why'); d.appendChild(el('b', null, t('why'))); d.appendChild(el('span', null, text)); if (parent) parent.appendChild(d); return d; }

    /** Bottom sheet with a title, a text and a close button; Escape and the backdrop close it. Returns { close }. */
    function sheet(title, content, onClose) {
        ensureCss();
        var bg = el('div', 'dy-sheet-bg'), box = el('div', 'dy-sheet'); box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', title);
        box.appendChild(el('h3', null, '💡 ' + title));
        if (typeof content === 'string') box.appendChild(el('p', null, content)); else if (content) box.appendChild(content);
        var ok = el('button', null, t('close')); ok.type = 'button'; box.appendChild(ok); bg.appendChild(box);
        function close() { doc.removeEventListener('keydown', key, true); if (bg.parentNode) bg.parentNode.removeChild(bg); if (onClose) onClose(); }
        function key(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }
        ok.onclick = close; bg.addEventListener('click', function (e) { if (e.target === bg) close(); }); doc.addEventListener('keydown', key, true);
        doc.body.appendChild(bg); try { ok.focus(); } catch (e) { /* ignore */ }
        return { close: close, el: bg };
    }

    /** Pointer drag for a node: o.targets (selector of drop targets), o.onDrop(targetEl, node). Taps still fire click. */
    function drag(node, o) {
        ensureCss(); node.style.touchAction = 'none';
        node.addEventListener('pointerdown', function (e) {
            if (e.button > 0) return;
            var sx = e.clientX, sy = e.clientY, id = e.pointerId, ghost = null, over = null;
            function target(x, y) { var u = doc.elementFromPoint(x, y); return u && u.closest ? u.closest(o.targets) : null; }
            function mv(ev) {
                if (ev.pointerId !== id) return;
                if (!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8) {
                    ghost = node.cloneNode(true); ghost.removeAttribute('id'); ghost.classList.add('dy-ghost'); ghost.style.width = node.offsetWidth + 'px';
                    doc.body.appendChild(ghost); node.classList.add('dy-dragging');
                }
                if (ghost) {
                    ghost.style.left = (ev.clientX - ghost.offsetWidth / 2) + 'px'; ghost.style.top = (ev.clientY - ghost.offsetHeight / 2) + 'px';
                    var tg = target(ev.clientX, ev.clientY); if (over && over !== tg) over.classList.remove('dy-over'); over = tg; if (tg) tg.classList.add('dy-over');
                }
            }
            function up(ev) {
                if (ev.pointerId !== id) return;
                doc.removeEventListener('pointermove', mv); doc.removeEventListener('pointerup', up); doc.removeEventListener('pointercancel', up);
                if (over) over.classList.remove('dy-over');
                if (ghost) {
                    var tg = ev.type === 'pointerup' ? target(ev.clientX, ev.clientY) : null;
                    ghost.parentNode && ghost.parentNode.removeChild(ghost); node.classList.remove('dy-dragging');
                    var stop = function (c) { c.stopPropagation(); c.preventDefault(); };
                    node.addEventListener('click', stop, true); win.setTimeout(function () { node.removeEventListener('click', stop, true); }, 60);
                    if (tg && o.onDrop) o.onDrop(tg, node);
                }
            }
            doc.addEventListener('pointermove', mv); doc.addEventListener('pointerup', up); doc.addEventListener('pointercancel', up);
        });
    }

    /** Safe wrappers over Juice (optional). */
    function good(node, streak, silent) { try { if (win.Juice) win.Juice.correct(node, { streak: streak || 0, silent: !!silent }); } catch (e) { /* ignore */ } }
    function bad(node, silent) { try { if (win.Juice) win.Juice.wrong(node, { silent: !!silent }); } catch (e) { /* ignore */ } }
    function big(node) { try { if (win.Juice) win.Juice.levelUp(node); } catch (e) { /* ignore */ } }
    function sound(parent) { try { return win.Juice ? win.Juice.mountSoundToggle(parent) : null; } catch (e) { return null; } }

    return { t: t, lang: lang, TXT: TXT, style: style, slide: slide, zone: zone, hud: hud, ring: ring, stars: stars, why: why, sheet: sheet, drag: drag, good: good, bad: bad, big: big, sound: sound, reduced: reduced, el: el, ensureCss: ensureCss, SHAPES: SHAPES };
});
