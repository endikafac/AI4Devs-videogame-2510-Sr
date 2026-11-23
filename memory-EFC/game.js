/**
 * Memoria de Parejas - memory pairs with emojis, animals, numbers (digit + dots) and letters (UPPER + lower).
 * 3 board sizes, move counter and 1-3 stars. Pure logic is exported for unit tests.
 */
const MemoryPairs = (() => {
    'use strict';

    const UI = {
        es: { title: 'Memoria de Parejas', sub: 'Elige un tema y un tamaño. Encuentra todas las parejas con pocos movimientos.', theme: 'Tema', size: 'Tamaño', start: 'Jugar', best: 'Mejor',
              themes: { emoji: 'Emojis', animals: 'Animales', numbers: 'Números', letters: 'Letras' }, sizes: { easy: 'Fácil', medium: 'Medio', hard: 'Difícil' },
              moves: 'Movimientos', pairs: 'parejas', quit: 'Salir', card: 'Carta oculta', matched: 'pareja encontrada', done: '¡Todas las parejas!', again: 'Jugar otra vez', back: 'Volver al inicio',
              score: (m, p) => `${p} parejas en ${m} movimientos.`, hintNumbers: 'Une cada número con sus puntos', hintLetters: 'Une cada mayúscula con su minúscula', xp: 'XP' },
        en: { title: 'Memory Pairs', sub: 'Pick a theme and a size. Find all the pairs in as few moves as you can.', theme: 'Theme', size: 'Size', start: 'Play', best: 'Best',
              themes: { emoji: 'Emojis', animals: 'Animals', numbers: 'Numbers', letters: 'Letters' }, sizes: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
              moves: 'Moves', pairs: 'pairs', quit: 'Quit', card: 'Hidden card', matched: 'pair found', done: 'All pairs found!', again: 'Play again', back: 'Back to start',
              score: (m, p) => `${p} pairs in ${m} moves.`, hintNumbers: 'Match each number with its dots', hintLetters: 'Match each capital with its lowercase', xp: 'XP' },
        eu: { title: 'Bikote memoria', sub: 'Aukeratu gaia eta tamaina. Aurkitu bikote guztiak mugimendu gutxiekin.', theme: 'Gaia', size: 'Tamaina', start: 'Jolastu', best: 'Onena',
              themes: { emoji: 'Emojiak', animals: 'Animaliak', numbers: 'Zenbakiak', letters: 'Letrak' }, sizes: { easy: 'Erraza', medium: 'Ertaina', hard: 'Zaila' },
              moves: 'Mugimenduak', pairs: 'bikote', quit: 'Irten', card: 'Karta ezkutua', matched: 'bikotea aurkitu da', done: 'Bikote guztiak!', again: 'Berriro jolastu', back: 'Itzuli hasierara',
              score: (m, p) => `${p} bikote ${m} mugimendutan.`, hintNumbers: 'Lotu zenbaki bakoitza bere puntuekin', hintLetters: 'Lotu letra larri bakoitza bere xehearekin', xp: 'XP' },
        gl: { title: 'Memoria de parellas', sub: 'Elixe un tema e un tamaño. Atopa todas as parellas con poucos movementos.', theme: 'Tema', size: 'Tamaño', start: 'Xogar', best: 'Mellor',
              themes: { emoji: 'Emojis', animals: 'Animais', numbers: 'Números', letters: 'Letras' }, sizes: { easy: 'Doado', medium: 'Medio', hard: 'Difícil' },
              moves: 'Movementos', pairs: 'parellas', quit: 'Saír', card: 'Carta oculta', matched: 'parella atopada', done: 'Todas as parellas!', again: 'Xogar outra vez', back: 'Volver ao inicio',
              score: (m, p) => `${p} parellas en ${m} movementos.`, hintNumbers: 'Une cada número cos seus puntos', hintLetters: 'Une cada maiúscula coa súa minúscula', xp: 'XP' },
        ca: { title: 'Memòria de parelles', sub: 'Tria un tema i una mida. Troba totes les parelles amb pocs moviments.', theme: 'Tema', size: 'Mida', start: 'Juga', best: 'Millor',
              themes: { emoji: 'Emojis', animals: 'Animals', numbers: 'Números', letters: 'Lletres' }, sizes: { easy: 'Fàcil', medium: 'Mitjà', hard: 'Difícil' },
              moves: 'Moviments', pairs: 'parelles', quit: 'Surt', card: 'Carta amagada', matched: 'parella trobada', done: 'Totes les parelles!', again: 'Juga un altre cop', back: 'Torna a l\'inici',
              score: (m, p) => `${p} parelles en ${m} moviments.`, hintNumbers: 'Uneix cada número amb els seus punts', hintLetters: 'Uneix cada majúscula amb la seva minúscula', xp: 'XP' },
        fr: { title: 'Mémo des paires', sub: 'Choisis un thème et une taille. Trouve toutes les paires en peu de coups.', theme: 'Thème', size: 'Taille', start: 'Jouer', best: 'Meilleur',
              themes: { emoji: 'Émojis', animals: 'Animaux', numbers: 'Nombres', letters: 'Lettres' }, sizes: { easy: 'Facile', medium: 'Moyen', hard: 'Difficile' },
              moves: 'Coups', pairs: 'paires', quit: 'Quitter', card: 'Carte cachée', matched: 'paire trouvée', done: 'Toutes les paires !', again: 'Rejouer', back: 'Retour au début',
              score: (m, p) => `${p} paires en ${m} coups.`, hintNumbers: 'Associe chaque nombre à ses points', hintLetters: 'Associe chaque majuscule à sa minuscule', xp: 'XP' }
    };

    // Learn-first content (learn.js): strings of the Aprende step, guided round and "why not a pair" line
    const ML = (typeof MemoryLearn !== 'undefined') ? MemoryLearn : require('./learn.js');
    Object.keys(UI).forEach(l => Object.assign(UI[l], ML.UI[l]));

    const THEMES = [
        { id: 'emoji',   icon: '😀', pool: ['😀', '🚀', '🌈', '⚽', '🎈', '🍕', '🎸', '🌻', '🍩', '🚲', '🎁', '⭐', '🏰', '🎨', '🍦', '🔔'] },
        { id: 'animals', icon: '🐶', pool: ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐸', '🦁', '🐵', '🐧', '🐢', '🐙', '🦋', '🐝', '🐘'] },
        { id: 'numbers', icon: '🔢', pool: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
        { id: 'letters', icon: '🔤', pool: 'ABCDEFGHIJLMNOPRSTU'.split('') }
    ];
    const SIZES = [
        { id: 'easy',   pairs: 4, cols: 4 },
        { id: 'medium', pairs: 6, cols: 4 },
        { id: 'hard',   pairs: 8, cols: 4 }
    ];
    const MISMATCH_MS = 850;

    const shuffle = (a, r = Math.random) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

    /** Faces of the two cards of one pair. Numbers: digit + dots. Letters: UPPER + lower. Others: same symbol twice. */
    function faces(theme, sym) {
        if (theme === 'numbers') return [{ text: String(sym), kind: 'digit' }, { text: '●'.repeat(sym), kind: 'dots' }];
        if (theme === 'letters') return [{ text: sym, kind: 'upper' }, { text: sym.toLowerCase(), kind: 'lower' }];
        return [{ text: sym, kind: 'emoji' }, { text: sym, kind: 'emoji' }];
    }

    /**
     * Shuffled deck: [{ id, pair, text, kind, sym }], 2 cards per pair. Pure.
     * `rotation` (games already played with this theme) moves the starting point inside the pool,
     * so repeated games do not keep offering the same pairs.
     */
    function makeDeck(theme, pairs, r = Math.random, rotation = 0) {
        const t = THEMES.find(x => x.id === theme); if (!t) throw new Error('unknown theme: ' + theme);
        const chosen = ML.pickItems(t.pool, pairs, rotation, r), deck = [];
        chosen.forEach((sym, i) => faces(theme, sym).forEach(f => deck.push({ pair: i, text: f.text, kind: f.kind, sym })));
        shuffle(deck, r);
        return deck.map((c, i) => ({ id: i, pair: c.pair, text: c.text, kind: c.kind, sym: c.sym }));
    }
    const poolOf = theme => (THEMES.find(x => x.id === theme) || { pool: [] }).pool;
    const isMatch = (a, b) => !!a && !!b && a.id !== b.id && a.pair === b.pair;
    /** 3 stars near the perfect game, 2 for a decent one, 1 to finish. */
    const stars = (moves, pairs) => moves <= Math.ceil(pairs * 1.5) + 1 ? 3 : moves <= Math.ceil(pairs * 2.5) ? 2 : 1;
    const sizeById = id => SIZES.find(s => s.id === id) || SIZES[0];

    // ---- state / storage ----
    const S = { user: null, prog: { best: {}, xp: 0, streak: 0, last: '', theme: 'emoji', size: 'easy', learned: {}, guided: {}, rot: {} }, deck: [], flipped: [], matched: 0, moves: 0, run: 0, bestRun: 0, busy: false, theme: 'emoji', size: 'easy', t0: 0, timer: null,
                guided: false, misses: 0, dotTimer: null };
    const $ = id => document.getElementById(id);
    const lang = () => { const l = ((window.PlatformI18n && PlatformI18n.currentLanguage) || 'es').slice(0, 2); return UI[l] ? l : 'es'; };
    const T = () => UI[lang()];
    function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function owner() {
        const u = S.user; if (!u) return 'guest';
        let pid = null; try { pid = PlatformFirestore._pid(u.uid); } catch (e) {}
        return u.uid + (pid ? '_' + pid : '');
    }
    const key = () => 'memory_prog_' + owner();
    const blank = () => ({ best: {}, xp: 0, streak: 0, last: '', theme: 'emoji', size: 'easy', learned: {}, guided: {}, rot: {} });
    function load() {
        try { S.prog = Object.assign(blank(), JSON.parse(localStorage.getItem(key()))); } catch (e) { S.prog = blank(); }
        ['learned', 'guided', 'rot'].forEach(k => { if (!S.prog[k] || typeof S.prog[k] !== 'object') S.prog[k] = {}; });
        S.theme = S.prog.theme; S.size = S.prog.size;
    }
    const reducedMotion = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
    /** Speech is a bonus: silently skipped when the browser has no Web Speech API. */
    function speak(text, queue) {
        try {
            if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return;
            if (!queue) window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(String(text)); u.lang = ML.SPEECH[lang()] || 'es-ES'; u.rate = .85;
            window.speechSynthesis.speak(u);
        } catch (e) { /* no speech */ }
    }
    function save() { try { localStorage.setItem(key(), JSON.stringify(S.prog)); } catch (e) {} }
    const dayStr = (d = new Date()) => d.toISOString().slice(0, 10);

    // ---- home ----
    function show(id) { ['mm-home', 'mm-learn', 'mm-play', 'mm-end'].forEach(s => { $(s).hidden = s !== id; }); window.scrollTo(0, 0); }
    function chips(parent, label, items, current, onPick) {
        parent.appendChild(el('h2', 'mm-label', label));
        const row = el('div', 'mm-chips'); row.setAttribute('role', 'radiogroup'); row.setAttribute('aria-label', label);
        items.forEach(it => {
            const b = el('button', 'mm-chip' + (it.id === current ? ' on' : ''), `${it.icon} ${it.name}`);
            b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', it.id === current ? 'true' : 'false'); b.dataset.id = it.id;
            b.onclick = () => onPick(it.id); row.appendChild(b);
        });
        parent.appendChild(row);
    }
    function renderHome() {
        const t = T();
        $('mm-h1').textContent = t.title; $('mm-sub').textContent = t.sub;
        const st = $('mm-stats'); st.textContent = '';
        st.appendChild(el('span', 'mm-pill', `🔥 ${S.prog.streak || 0}`)); st.appendChild(el('span', 'mm-pill', `⚡ ${S.prog.xp || 0} ${t.xp}`));
        const box = $('mm-path'); box.textContent = '';
        const li = el('li', 'mm-setup');
        chips(li, t.theme, THEMES.map(x => ({ id: x.id, icon: x.icon, name: t.themes[x.id] })), S.theme, id => { S.theme = id; S.prog.theme = id; save(); renderHome(); });
        chips(li, t.size, SIZES.map(x => ({ id: x.id, icon: '▦', name: `${t.sizes[x.id]} (${x.pairs} ${t.pairs})` })), S.size, id => { S.size = id; S.prog.size = id; save(); renderHome(); });
        const hint = S.theme === 'numbers' ? t.hintNumbers : S.theme === 'letters' ? t.hintLetters : '';
        if (hint) li.appendChild(el('p', 'mm-hint', hint));
        const b = S.prog.best[S.theme + '_' + S.size];
        li.appendChild(el('p', 'mm-best', b ? `${t.best}: ${'★'.repeat(b.stars)}${'☆'.repeat(3 - b.stars)} · ${b.moves} ${t.moves.toLowerCase()}` : ''));
        const go = el('button', 'mm-btn mm-go', `▶ ${t.start}`); go.type = 'button'; go.id = 'mm-start'; go.onclick = play; li.appendChild(go);
        const lr = el('button', 'mm-btn ghost mm-go mm-learn-open', `📖 ${t.learnAgain}`); lr.type = 'button'; lr.id = 'mm-learn-open'; lr.onclick = () => showLearn(); li.appendChild(lr);
        box.appendChild(li);
    }

    // ---- learn first ----
    /** Play button: the first time a theme is played, the Aprende step comes first. */
    function play() { if (!S.prog.learned[S.theme]) showLearn(); else start(); }

    function stopDots() { clearTimeout(S.dotTimer); S.dotTimer = null; try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
    function finishLearn() {
        stopDots();
        S.prog.learned[S.theme] = true; save(); start();
    }
    function learnItems() {
        const th = THEMES.find(x => x.id === S.theme), pool = th.pool;
        if (S.theme === 'numbers') return pool.map(n => ({ sym: n, label: String(n) }));
        if (S.theme === 'letters') return pool.map(c => ({ sym: c, label: c + c.toLowerCase() }));
        return pool.map((c, i) => ({ sym: c, label: c, i }));
    }
    function showLearn() {
        const t = T(), theme = S.theme, body = $('mm-learn-body'); stopDots();
        $('mm-learn-title').textContent = `${t.learnTitle}: ${t.themes[theme]}`;
        $('mm-learn-text').textContent = theme === 'numbers' ? t.learnNumbers : theme === 'letters' ? t.learnLetters : t.learnOther;
        $('mm-learn-go').textContent = t.learnGo; $('mm-learn-skip').textContent = t.learnSkip;
        body.textContent = '';
        const stage = el('div', 'mm-stage'); stage.id = 'mm-stage'; stage.setAttribute('aria-live', 'polite');
        stage.appendChild(el('p', 'mm-stage-hint', t.learnPick));
        const strip = el('div', 'mm-strip'); strip.setAttribute('role', 'group'); strip.setAttribute('aria-label', t.learnPick);
        const pool = THEMES.find(x => x.id === theme).pool;
        learnItems().forEach(it => {
            const b = el('button', 'mm-pick', it.label); b.type = 'button'; b.dataset.sym = String(it.sym);
            b.onclick = () => { strip.querySelectorAll('.mm-pick').forEach(x => x.classList.toggle('on', x === b)); learnShow(stage, it, pool); };
            strip.appendChild(b);
        });
        body.append(stage, strip);
        show('mm-learn');
        const first = strip.querySelector('.mm-pick'); if (first) first.focus();
    }
    /** What the stage shows after tapping an item. Numbers: dots appear one by one with a spoken count. */
    function learnShow(stage, it, pool) {
        const t = T(), theme = S.theme; stopDots(); stage.textContent = '';
        if (theme === 'numbers') {
            const n = it.sym, word = ML.NUM_WORDS[lang()][n - 1] || String(n);
            stage.appendChild(el('div', 'mm-bignum', String(n)));
            const dots = el('div', 'mm-dotsrow'); dots.id = 'mm-dotsrow'; stage.appendChild(dots);
            const say = el('p', 'mm-learn-count', ''); say.id = 'mm-learn-count'; stage.appendChild(say);
            const addDot = () => { dots.appendChild(el('span', 'mm-dot-ball', '●')); };
            if (reducedMotion()) {
                for (let i = 0; i < n; i++) addDot();
                say.textContent = `${n} = ${word} (${n} ${n === 1 ? t.dots1 : t.dotsN})`; speak(`${n}, ${word}`);
            } else {
                try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
                let i = 0;
                const step = () => {
                    i++; addDot(); say.textContent = Array.from({ length: i }, (_, k) => k + 1).join(' · '); speak(i, true);
                    if (i < n) S.dotTimer = setTimeout(step, 650);
                    else { S.dotTimer = null; say.textContent = `${n} = ${word} (${n} ${n === 1 ? t.dots1 : t.dotsN})`; }
                };
                step();
            }
            return;
        }
        if (theme === 'letters') {
            const c = it.sym, row = el('div', 'mm-letterpair');
            const up = el('div', 'mm-letter', c), lo = el('div', 'mm-letter', c.toLowerCase());
            row.append(up, lo); stage.appendChild(row);
            stage.appendChild(el('p', 'mm-learn-count', `${c} (${t.upper}) · ${c.toLowerCase()} (${t.lower})`));
            speak(c); return;
        }
        // emoji / animals: the card and its pair side by side, with the name
        const row = el('div', 'mm-letterpair');
        row.append(el('div', 'mm-letter', it.sym), el('div', 'mm-letter', it.sym)); stage.appendChild(row);
        const name = (ML.NAMES[theme][lang()] || ML.NAMES[theme].es)[pool.indexOf(it.sym)] || '';
        stage.appendChild(el('p', 'mm-learn-count', `${t.pairWord}: ${name}`)); speak(name);
    }

    // ---- game ----
    /** Starts a game. The first game of each theme is the guided round: only 3 pairs and hints. */
    function start() {
        stopDots();
        S.guided = !S.prog.guided[S.theme];
        const sz = S.guided ? { id: 'guided', pairs: 3, cols: 3 } : sizeById(S.size);
        const rot = S.prog.rot[S.theme] || 0; S.prog.rot[S.theme] = rot + 1; save();
        S.deck = makeDeck(S.theme, sz.pairs, Math.random, rot); S.flipped = []; S.matched = 0; S.moves = 0; S.misses = 0; S.run = 0; S.bestRun = 0; S.busy = false; S.t0 = Date.now(); S.cols = sz.cols;
        show('mm-play'); renderBoard(sz); progress(); setGuide(null); setWhy('');
        const first = document.querySelector('#mm-card .mm-tile'); if (first) first.focus();
    }
    function setWhy(txt, good) { const w = $('mm-why'); w.textContent = txt || ''; w.classList.toggle('good', !!good); w.hidden = !txt; }
    /** Guided round banner: title + (after the first flip) "find the pair of X". */
    function setGuide(findText) {
        const g = $('mm-guide'), t = T(); g.hidden = !S.guided; if (!S.guided) return;
        g.textContent = ''; g.append(el('b', null, t.guidedTitle), el('span', null, ' ' + t.guidedHint));
        if (findText) g.appendChild(el('div', 'mm-find', findText));
    }
    const clearHints = () => document.querySelectorAll('#mm-card .mm-tile.hint').forEach(x => x.classList.remove('hint'));
    function progress() {
        const t = T(), total = S.deck.length / 2, p = Math.round(S.matched / total * 100);
        $('mm-barfill').style.width = p + '%'; $('mm-barfill').parentNode.setAttribute('aria-valuenow', p);
        $('mm-count').textContent = `${t.moves}: ${S.moves}`;
    }
    function renderBoard(sz) {
        const card = $('mm-card'); card.textContent = ''; $('mm-feedback').hidden = true;
        const grid = el('div', 'mm-grid'); grid.style.setProperty('--cols', sz.cols); grid.setAttribute('role', 'group');
        S.deck.forEach((c, i) => {
            const b = el('button', 'mm-tile'); b.type = 'button'; b.dataset.i = i; b.dataset.kind = c.kind;
            b.appendChild(el('span', 'mm-back', '?')); b.appendChild(el('span', 'mm-front', c.text));
            b.setAttribute('aria-label', T().card + ' ' + (i + 1));
            b.onclick = () => flip(i); grid.appendChild(b);
        });
        card.appendChild(grid);
    }
    const tileEl = i => document.querySelector(`#mm-card .mm-tile[data-i="${i}"]`);
    function setOpen(i, on) {
        const b = tileEl(i); if (!b) return;
        b.classList.toggle('open', on);
        b.setAttribute('aria-label', on ? S.deck[i].text : T().card + ' ' + (i + 1));
    }
    function flip(i) {
        if (S.busy || S.flipped.includes(i)) return;
        const c = S.deck[i], b = tileEl(i); if (!c || !b || b.classList.contains('matched')) return;
        setOpen(i, true); S.flipped.push(i);
        if (S.flipped.length < 2) {
            // Guided round: say what to look for; after a miss the pair glows
            if (S.guided) {
                setGuide(T().find.split('{a}').join(ML.cardName(S.theme, c, lang(), poolOf(S.theme))));
                if (S.misses >= 1) { const h = ML.findHint(S.deck, i), ht = tileEl(h); if (ht) ht.classList.add('hint'); }
            }
            return;
        }
        clearHints();
        S.moves++;
        const [a, d] = S.flipped.map(k => S.deck[k]);
        if (isMatch(a, d)) {
            setWhy(T().matchedWhy.split('{a}').join(ML.cardName(S.theme, a, lang(), poolOf(S.theme))).split('{b}').join(ML.cardName(S.theme, d, lang(), poolOf(S.theme))), true);
            if (S.guided) setGuide(null);
            S.flipped.forEach(k => { const t = tileEl(k); t.classList.add('matched'); t.disabled = true; t.setAttribute('aria-label', S.deck[k].text + ', ' + T().matched); });
            S.flipped = []; S.matched++; S.run++; S.bestRun = Math.max(S.bestRun, S.run); progress();
            if (S.matched === S.deck.length / 2) setTimeout(finish, 450);
        } else {
            S.run = 0; S.busy = true; S.misses++; progress();
            // Explain WHY: both card names (and a tip) stay on screen until the next flip
            setWhy(ML.whyNot(S.theme, a, d, lang(), poolOf(S.theme)));
            if (S.guided) setGuide(null);
            const pair = S.flipped.slice(); S.flipped = [];
            pair.forEach(k => tileEl(k).classList.add('miss'));
            S.timer = setTimeout(() => { pair.forEach(k => { setOpen(k, false); const t = tileEl(k); if (t) t.classList.remove('miss'); }); S.busy = false; }, MISMATCH_MS);
        }
    }

    async function finish() {
        const t = T(), pairs = S.deck.length / 2, st = stars(S.moves, pairs);
        $('mm-trophy').textContent = st === 3 ? '🏆' : '⭐';
        $('mm-endtitle').textContent = t.done; $('mm-endtext').textContent = t.score(S.moves, pairs);
        $('mm-endstars').textContent = '★'.repeat(st) + '☆'.repeat(3 - st);
        $('mm-next').textContent = t.again; $('mm-next').onclick = start;
        $('mm-back').textContent = t.back; $('mm-back').onclick = () => { renderHome(); show('mm-home'); };
        show('mm-end');
        const k = S.theme + '_' + S.size, prev = S.prog.best[k];
        // The guided round (3 pairs) only unlocks the normal sizes, it does not set a record
        if (S.guided) S.prog.guided[S.theme] = true;
        else if (!prev || st > prev.stars || (st === prev.stars && S.moves < prev.moves)) S.prog.best[k] = { stars: st, moves: S.moves };
        S.prog.xp = (S.prog.xp || 0) + (S.guided ? 5 : 10 + st * 5);
        const today = dayStr(), y = dayStr(new Date(Date.now() - 864e5));
        if (S.prog.last !== today) { S.prog.streak = S.prog.last === y ? (S.prog.streak || 0) + 1 : 1; S.prog.last = today; }
        save();
        if (S.user && typeof PlatformFirestore !== 'undefined') {
            try {
                await PlatformFirestore.updateGameStats(S.user.uid, 'memory', {
                    correctAnswers: pairs, totalQuestions: S.moves, totalAttempts: S.moves, bestStreak: S.bestRun,
                    elapsedSeconds: Math.round((Date.now() - S.t0) / 1000), level: SIZES.findIndex(s => s.id === S.size) + 1, operation: S.theme });
            } catch (e) { console.warn('[MemoryPairs] stats not saved', e); }
        }
    }

    function leave() { clearTimeout(S.timer); stopDots(); S.busy = false; renderHome(); show('mm-home'); }

    function init() {
        $('mm-quit').onclick = leave;
        $('mm-learn-go').onclick = finishLearn; $('mm-learn-skip').onclick = finishLearn;
        $('mm-learn-back').onclick = leave;
        document.addEventListener('keydown', e => {
            if ($('mm-play').hidden) return;
            const tiles = [...document.querySelectorAll('#mm-card .mm-tile')], cur = tiles.indexOf(document.activeElement);
            if (cur < 0 || !tiles.length) return;
            const cols = S.cols || sizeById(S.size).cols, d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[e.key];
            if (d) { e.preventDefault(); const n = cur + d; if (n >= 0 && n < tiles.length) tiles[n].focus(); }
        });
        load(); renderHome(); show('mm-home');
        if (window.PlatformAuth && PlatformAuth.onAuthStateChanged) PlatformAuth.onAuthStateChanged(u => { S.user = u || null; load(); renderHome(); });
        window.addEventListener('platformLanguageChanged', () => { if (!$('mm-home').hidden) renderHome(); else if (!$('mm-learn').hidden) showLearn(); });
    }

    const api = { init, state: S, THEMES, SIZES, makeDeck, isMatch, stars, faces, pickItems: ML.pickItems, learn: ML };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    return api;
})();
