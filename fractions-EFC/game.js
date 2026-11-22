/**
 * Fracciones con Pizza - visual fractions with pizza and bar pieces.
 * 7 progressive lessons: identify, compare, equivalent, add with the same denominator.
 * Pure logic is exported for unit tests.
 */
const FractionsLab = (() => {
    'use strict';

    const UI = {
        es: { title: 'Fracciones con Pizza', sub: 'Trocea pizzas y barras. Completa una lección para abrir la siguiente.', lesson: 'Lección', xp: 'XP',
              next: 'Continuar', good: ['¡Muy bien!', '¡Genial!', '¡Perfecto!', '¡Sigue así!'], bad: 'Casi. La respuesta es', quit: 'Salir',
              qId: '¿Qué fracción está coloreada?', qCmp: '¿Cuál es mayor?', qEq: 'Busca la fracción equivalente', qAdd: 'Suma las fracciones', left: 'Izquierda', right: 'Derecha', equal: 'Iguales',
              done: '¡Lección completada!', fail: 'Necesitas acertar más. ¡Inténtalo otra vez!', again: 'Repetir', nextL: 'Siguiente lección', back: 'Volver al camino', locked: 'Completa la anterior',
              score: (c, t) => `${c} de ${t} aciertos.`, piece: (n, d) => `${n} de ${d} trozos`,
              k: { id1: 'Reconoce fracciones', id2: 'Más trozos', cmp1: 'Compara: mismo denominador', cmp2: 'Compara: distintos trozos', eq: 'Fracciones equivalentes', add: 'Suma: mismo denominador', mix: 'Gran reto' } },
        en: { title: 'Pizza Fractions', sub: 'Slice pizzas and bars. Finish a lesson to unlock the next.', lesson: 'Lesson', xp: 'XP',
              next: 'Continue', good: ['Well done!', 'Great!', 'Perfect!', 'Keep going!'], bad: 'Almost. The answer is', quit: 'Quit',
              qId: 'Which fraction is coloured?', qCmp: 'Which one is bigger?', qEq: 'Find the equivalent fraction', qAdd: 'Add the fractions', left: 'Left', right: 'Right', equal: 'Equal',
              done: 'Lesson complete!', fail: 'You need more right answers. Try again!', again: 'Try again', nextL: 'Next lesson', back: 'Back to the path', locked: 'Finish the previous one',
              score: (c, t) => `${c} out of ${t} correct.`, piece: (n, d) => `${n} of ${d} pieces`,
              k: { id1: 'Spot fractions', id2: 'More pieces', cmp1: 'Compare: same denominator', cmp2: 'Compare: different pieces', eq: 'Equivalent fractions', add: 'Add: same denominator', mix: 'Big challenge' } },
        eu: { title: 'Pizza zatikiak', sub: 'Zatitu pizzak eta barrak. Bukatu ikasgai bat hurrengoa irekitzeko.', lesson: 'Ikasgaia', xp: 'XP',
              next: 'Jarraitu', good: ['Oso ondo!', 'Bikain!', 'Perfektua!', 'Jarraitu horrela!'], bad: 'Ia. Erantzuna hau da:', quit: 'Irten',
              qId: 'Zein zatiki dago koloreztatuta?', qCmp: 'Zein da handiagoa?', qEq: 'Bilatu zatiki baliokidea', qAdd: 'Batu zatikiak', left: 'Ezkerra', right: 'Eskuina', equal: 'Berdinak',
              done: 'Ikasgaia osatuta!', fail: 'Erantzun zuzen gehiago behar dituzu. Saiatu berriro!', again: 'Berriro', nextL: 'Hurrengo ikasgaia', back: 'Itzuli bidera', locked: 'Bukatu aurrekoa',
              score: (c, t) => `${t}tik ${c} zuzen.`, piece: (n, d) => `${d} zatitik ${n}`,
              k: { id1: 'Ezagutu zatikiak', id2: 'Zati gehiago', cmp1: 'Alderatu: izendatzaile bera', cmp2: 'Alderatu: zati desberdinak', eq: 'Zatiki baliokideak', add: 'Batu: izendatzaile bera', mix: 'Erronka handia' } },
        gl: { title: 'Fraccións con pizza', sub: 'Trocea pizzas e barras. Remata unha lección para abrir a seguinte.', lesson: 'Lección', xp: 'XP',
              next: 'Continuar', good: ['Moi ben!', 'Xenial!', 'Perfecto!', 'Segue así!'], bad: 'Case. A resposta é', quit: 'Saír',
              qId: 'Que fracción está coloreada?', qCmp: 'Cal é maior?', qEq: 'Atopa a fracción equivalente', qAdd: 'Suma as fraccións', left: 'Esquerda', right: 'Dereita', equal: 'Iguais',
              done: 'Lección completada!', fail: 'Necesitas acertar máis. Inténtao outra vez!', again: 'Repetir', nextL: 'Seguinte lección', back: 'Volver ao camiño', locked: 'Completa a anterior',
              score: (c, t) => `${c} de ${t} acertos.`, piece: (n, d) => `${n} de ${d} anacos`,
              k: { id1: 'Recoñece fraccións', id2: 'Máis anacos', cmp1: 'Compara: mesmo denominador', cmp2: 'Compara: distintos anacos', eq: 'Fraccións equivalentes', add: 'Suma: mesmo denominador', mix: 'Gran reto' } },
        ca: { title: 'Fraccions amb pizza', sub: 'Talla pizzes i barres. Acaba una lliçó per obrir la següent.', lesson: 'Lliçó', xp: 'XP',
              next: 'Continua', good: ['Molt bé!', 'Genial!', 'Perfecte!', 'Continua així!'], bad: 'Gairebé. La resposta és', quit: 'Surt',
              qId: 'Quina fracció està acolorida?', qCmp: 'Quina és més gran?', qEq: 'Troba la fracció equivalent', qAdd: 'Suma les fraccions', left: 'Esquerra', right: 'Dreta', equal: 'Iguals',
              done: 'Lliçó completada!', fail: 'Necessites encertar més. Torna-ho a provar!', again: 'Repeteix', nextL: 'Següent lliçó', back: 'Torna al camí', locked: 'Acaba l\'anterior',
              score: (c, t) => `${c} de ${t} encerts.`, piece: (n, d) => `${n} de ${d} trossos`,
              k: { id1: 'Reconeix fraccions', id2: 'Més trossos', cmp1: 'Compara: mateix denominador', cmp2: 'Compara: trossos diferents', eq: 'Fraccions equivalents', add: 'Suma: mateix denominador', mix: 'Gran repte' } },
        fr: { title: 'Fractions en pizza', sub: 'Découpe des pizzas et des barres. Termine une leçon pour ouvrir la suivante.', lesson: 'Leçon', xp: 'XP',
              next: 'Continuer', good: ['Très bien !', 'Génial !', 'Parfait !', 'Continue !'], bad: 'Presque. La réponse est', quit: 'Quitter',
              qId: 'Quelle fraction est coloriée ?', qCmp: 'Laquelle est la plus grande ?', qEq: 'Trouve la fraction équivalente', qAdd: 'Additionne les fractions', left: 'Gauche', right: 'Droite', equal: 'Égales',
              done: 'Leçon terminée !', fail: 'Il faut plus de bonnes réponses. Réessaie !', again: 'Recommencer', nextL: 'Leçon suivante', back: 'Retour au chemin', locked: 'Termine la précédente',
              score: (c, t) => `${c} sur ${t} bonnes réponses.`, piece: (n, d) => `${n} parts sur ${d}`,
              k: { id1: 'Reconnaître les fractions', id2: 'Plus de parts', cmp1: 'Comparer : même dénominateur', cmp2: 'Comparer : parts différentes', eq: 'Fractions équivalentes', add: 'Additionner : même dénominateur', mix: 'Grand défi' } }
    };

    // maxD = largest denominator, types = question kinds
    const UNITS = [
        { id: 'id1',  icon: '🍕', types: ['id'],                         maxD: 4,  shapes: ['pizza'], len: 8 },
        { id: 'id2',  icon: '🍫', types: ['id'],                         maxD: 8,  shapes: ['pizza', 'bar'], len: 8 },
        { id: 'cmp1', icon: '⚖️', types: ['cmp'], cmpMode: 'sameD',      maxD: 8,  shapes: ['pizza', 'bar'], len: 8 },
        { id: 'cmp2', icon: '🔍', types: ['cmp'], cmpMode: 'any',        maxD: 8,  shapes: ['bar'], len: 8 },
        { id: 'eq',   icon: '🟰', types: ['eq'],                         maxD: 12, shapes: ['bar'], len: 8 },
        { id: 'add',  icon: '➕', types: ['add'],                        maxD: 8,  shapes: ['bar', 'pizza'], len: 8 },
        { id: 'mix',  icon: '🏆', types: ['id', 'cmp', 'eq', 'add'], cmpMode: 'any', maxD: 8, shapes: ['pizza', 'bar'], len: 10 }
    ];
    const PASS_RATIO = 0.6;

    const ri = (a, b, r = Math.random) => a + Math.floor(r() * (b - a + 1));
    const pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];
    const shuffle = (a, r = Math.random) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

    // ---- fraction maths (pure) ----
    const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
    const simplify = f => { const g = gcd(f.n, f.d) || 1; return { n: f.n / g, d: f.d / g }; };
    /** -1 if a<b, 0 if equal, 1 if a>b (cross multiplication, no floats). */
    const compare = (a, b) => { const x = a.n * b.d, y = b.n * a.d; return x < y ? -1 : x > y ? 1 : 0; };
    const equivalent = (a, b) => compare(a, b) === 0;
    const add = (a, b) => a.d === b.d ? { n: a.n + b.n, d: a.d } : { n: a.n * b.d + b.n * a.d, d: a.d * b.d };
    const fkey = f => f.n + '/' + f.d;

    /** Distinct wrong fractions (same denominator, or same numerator) for options. */
    function fractionOptions(correct, r = Math.random, n = 4, maxN) {
        const out = [correct], seen = new Set([fkey(correct)]);
        const cap = maxN || correct.d;
        const tryAdd = f => { if (f.n >= 1 && f.n <= cap && f.d >= 2 && !equivalent(f, correct) && !seen.has(fkey(f)) && out.length < n) { seen.add(fkey(f)); out.push(f); } };
        shuffle([-2, -1, 1, 2, 3, -3], r).forEach(k => tryAdd({ n: correct.n + k, d: correct.d }));
        tryAdd({ n: correct.n, d: correct.d + 1 }); tryAdd({ n: correct.n, d: Math.max(2, correct.d - 1) });
        let g = 0; while (out.length < n && g++ < 60) tryAdd({ n: ri(1, cap, r), d: correct.d + ri(0, 2, r) });
        return shuffle(out, r);
    }

    function makeQuestion(u, type, r = Math.random) {
        const shape = () => pick(u.shapes, r);
        if (type === 'id') {
            const d = ri(2, u.maxD, r), n = ri(1, d - 1, r), f = { n, d };
            return { type, unit: u.id, shape: shape(), f, answer: f, options: fractionOptions(f, r) };
        }
        if (type === 'cmp') {
            let a, b, g = 0;
            do {
                if (u.cmpMode === 'sameD') { const d = ri(3, u.maxD, r); a = { n: ri(1, d - 1, r), d }; b = { n: ri(1, d - 1, r), d }; if (r() < .15) b = { n: a.n, d }; }
                else { const d1 = ri(2, u.maxD, r), d2 = ri(2, u.maxD, r); a = { n: ri(1, d1 - 1, r), d: d1 }; b = { n: ri(1, d2 - 1, r), d: d2 }; if (r() < .2) { b = { n: a.n * 2, d: a.d * 2 }; if (b.d > 12) b = { n: a.n, d: a.d }; } }
            } while (a.d === b.d && a.n === b.n && r() < .85 && g++ < 20);
            const c = compare(a, b);
            return { type, unit: u.id, shape: shape(), a, b, answer: c < 0 ? 'R' : c > 0 ? 'L' : 'E' };
        }
        if (type === 'eq') {
            const d = ri(2, 6, r), n = ri(1, d - 1, r), k = ri(2, Math.max(2, Math.floor(u.maxD / d)), r), t = { n: n * k, d: d * k };
            const f = { n, d }, opts = fractionOptions({ n: t.n, d: t.d }, r, 4, t.d - 1).filter(x => x.d === t.d).map(x => x.n);
            for (let v = 1; opts.length < 4 && v < t.d; v++) if (!opts.includes(v)) opts.push(v);
            shuffle(opts, r);
            return { type, unit: u.id, shape: 'bar', f, target: t, answer: t.n, options: opts };
        }
        // add
        const d = ri(3, u.maxD, r), a = ri(1, d - 2, r), b = ri(1, d - a - (r() < .5 ? 0 : 1) || 1, r), s = { n: a + b, d };
        return { type: 'add', unit: u.id, shape: shape(), a: { n: a, d }, b: { n: b, d }, answer: s, options: fractionOptions(s, r, 4, d) };
    }

    function makeLesson(u, r = Math.random) {
        const out = []; let last = '';
        for (let i = 0; i < u.len; i++) {
            let t, g = 0; do { t = pick(u.types, r); } while (u.types.length > 1 && t === last && g++ < 6);
            last = t; out.push(makeQuestion(u, t, r));
        }
        return out;
    }

    /** v: fraction {n,d} (id, add), 'L'|'R'|'E' (cmp), numerator number (eq). */
    function isCorrect(q, v) {
        if (q.type === 'id' || q.type === 'add') return !!v && v.n === q.answer.n && v.d === q.answer.d;
        if (q.type === 'cmp') return v === q.answer;
        if (q.type === 'eq') return Number(v) === q.answer;
        return false;
    }
    const stars = (correct, total) => { const miss = total - correct; return miss <= 0 ? 3 : miss <= 2 ? 2 : 1; };
    const passed = (correct, total) => total > 0 && correct / total >= PASS_RATIO;

    // ---- state / storage ----
    const S = { user: null, prog: { units: {}, xp: 0, streak: 0, last: '' }, idx: 0, u: null, queue: [], qi: 0, total: 0, correct: 0, run: 0, bestRun: 0, q: null, locked: false, t0: 0 };
    const $ = id => document.getElementById(id);
    const lang = () => { const l = ((window.PlatformI18n && PlatformI18n.currentLanguage) || 'es').slice(0, 2); return UI[l] ? l : 'es'; };
    const T = () => UI[lang()];
    function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function owner() {
        const u = S.user; if (!u) return 'guest';
        let pid = null; try { pid = PlatformFirestore._pid(u.uid); } catch (e) {}
        return u.uid + (pid ? '_' + pid : '');
    }
    const key = () => 'fractions_prog_' + owner();
    const blank = () => ({ units: {}, xp: 0, streak: 0, last: '' });
    function load() { try { S.prog = Object.assign(blank(), JSON.parse(localStorage.getItem(key()))); } catch (e) { S.prog = blank(); } }
    function save() { try { localStorage.setItem(key(), JSON.stringify(S.prog)); } catch (e) {} }
    const dayStr = (d = new Date()) => d.toISOString().slice(0, 10);
    const unlocked = i => i === 0 || !!S.prog.units[UNITS[i - 1].id];

    // ---- drawing ----
    const NS = 'http://www.w3.org/2000/svg';
    function svgEl(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
    const FILL = '#f59e0b', EMPTY = '#fff7ed', LINE = '#9a3412';
    /** Pizza or bar split in f.d equal pieces with f.n coloured. */
    function drawShape(shape, f, small) {
        const t = T();
        if (shape === 'pizza') {
            const svg = svgEl('svg', { viewBox: '0 0 120 120', class: 'fr-shape' + (small ? ' small' : ''), role: 'img', 'aria-label': t.piece(f.n, f.d) });
            svgEl('circle', { cx: 60, cy: 60, r: 56, fill: '#d97706' }, svg);
            for (let i = 0; i < f.d; i++) {
                const a0 = i / f.d * 2 * Math.PI - Math.PI / 2, a1 = (i + 1) / f.d * 2 * Math.PI - Math.PI / 2, R = 50;
                const x0 = 60 + R * Math.cos(a0), y0 = 60 + R * Math.sin(a0), x1 = 60 + R * Math.cos(a1), y1 = 60 + R * Math.sin(a1);
                const path = f.d === 1 ? `M60 10 A50 50 0 1 1 59.9 10 Z` : `M60 60 L${x0.toFixed(2)} ${y0.toFixed(2)} A${R} ${R} 0 ${1 / f.d > .5 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
                svgEl('path', { d: path, fill: i < f.n ? '#ef4444' : EMPTY, stroke: LINE, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, svg);
                if (i < f.n) { const m = (a0 + a1) / 2; svgEl('circle', { cx: 60 + 30 * Math.cos(m), cy: 60 + 30 * Math.sin(m), r: 4, fill: '#fde68a' }, svg); }
            }
            return svg;
        }
        const svg = svgEl('svg', { viewBox: '0 0 240 60', class: 'fr-shape bar' + (small ? ' small' : ''), role: 'img', 'aria-label': t.piece(f.n, f.d) });
        const w = 232 / f.d;
        for (let i = 0; i < f.d; i++) svgEl('rect', { x: 4 + i * w, y: 6, width: w, height: 48, rx: 4, fill: i < f.n ? FILL : EMPTY, stroke: LINE, 'stroke-width': 2.5 }, svg);
        return svg;
    }
    function fracEl(f, big) {
        const w = el('span', 'fr-frac' + (big ? ' big' : '')); w.setAttribute('dir', 'ltr');
        w.appendChild(el('span', 'fr-num', f.n)); w.appendChild(el('span', 'fr-den', f.d));
        w.setAttribute('aria-label', `${f.n}/${f.d}`); return w;
    }

    // ---- home ----
    function show(id) { ['fr-home', 'fr-play', 'fr-end'].forEach(s => { $(s).hidden = s !== id; }); window.scrollTo(0, 0); }
    function renderHome() {
        const t = T();
        $('fr-h1').textContent = t.title; $('fr-sub').textContent = t.sub;
        const st = $('fr-stats'); st.textContent = '';
        st.appendChild(el('span', 'fr-pill', `🔥 ${S.prog.streak || 0}`)); st.appendChild(el('span', 'fr-pill', `⚡ ${S.prog.xp || 0} ${t.xp}`));
        const path = $('fr-path'); path.textContent = '';
        let current = UNITS.findIndex(u => !S.prog.units[u.id]); if (current < 0) current = UNITS.length - 1;
        UNITS.forEach((u, i) => {
            const li = el('li', 'fr-node'), done = S.prog.units[u.id], open = unlocked(i);
            const b = el('button', 'fr-dot' + (done ? ' done' : '') + (!open ? ' locked' : '') + (open && i === current ? ' current' : ''), open ? u.icon : '🔒');
            b.type = 'button'; b.dataset.unit = u.id;
            b.setAttribute('aria-label', `${t.lesson} ${i + 1}: ${t.k[u.id]}${open ? '' : '. ' + t.locked}`);
            if (open) b.onclick = () => start(i); else b.disabled = true;
            const info = el('div', 'fr-info'); info.appendChild(el('b', null, `${t.lesson} ${i + 1}`)); info.appendChild(el('span', null, t.k[u.id]));
            if (done) info.appendChild(el('div', 'fr-stars', '★'.repeat(done.stars) + '☆'.repeat(3 - done.stars)));
            li.appendChild(b); li.appendChild(info); path.appendChild(li);
        });
    }

    // ---- lesson ----
    function start(i) {
        S.idx = i; S.u = UNITS[i]; S.queue = makeLesson(S.u); S.total = S.queue.length; S.qi = 0; S.correct = 0; S.run = 0; S.bestRun = 0; S.t0 = Date.now();
        show('fr-play'); next();
    }
    function bar() { const p = Math.round(S.qi / S.total * 100); $('fr-barfill').style.width = p + '%'; $('fr-barfill').parentNode.setAttribute('aria-valuenow', p); $('fr-count').textContent = `${Math.min(S.qi + 1, S.total)} / ${S.total}`; }

    function next() {
        $('fr-feedback').hidden = true; S.locked = false;
        if (S.qi >= S.total) return finish();
        S.q = S.queue[S.qi]; bar();
        const t = T(), q = S.q, card = $('fr-card'); card.textContent = ''; card.classList.remove('fr-shake');
        if (q.type === 'id') {
            card.appendChild(el('p', 'fr-prompt', t.qId));
            const w = el('div', 'fr-shapewrap'); w.appendChild(drawShape(q.shape, q.f)); card.appendChild(w);
            fracOptions(card, q.options.map(f => ({ node: fracEl(f), v: f })));
        } else if (q.type === 'cmp') {
            card.appendChild(el('p', 'fr-prompt', t.qCmp));
            const row = el('div', 'fr-pair');
            [q.a, q.b].forEach(f => { const c = el('div', 'fr-pairitem'); c.appendChild(drawShape(q.shape, f, true)); c.appendChild(fracEl(f)); row.appendChild(c); });
            card.appendChild(row);
            const box = el('div', 'fr-opts three'); box.setAttribute('role', 'group');
            [['L', t.left], ['E', t.equal], ['R', t.right]].forEach(([v, lbl]) => { const b = el('button', 'fr-opt small', lbl); b.type = 'button'; b.onclick = () => answer(v, b); box.appendChild(b); });
            card.appendChild(box);
        } else if (q.type === 'eq') {
            card.appendChild(el('p', 'fr-prompt', t.qEq));
            const rows = el('div', 'fr-eqrows');
            const r1 = el('div', 'fr-eqrow'); r1.appendChild(drawShape('bar', q.f, true)); r1.appendChild(fracEl(q.f, true));
            const r2 = el('div', 'fr-eqrow'); r2.appendChild(drawShape('bar', q.target, true));
            const unk = el('span', 'fr-frac big'); unk.setAttribute('dir', 'ltr'); unk.appendChild(el('span', 'fr-num unk', '?')); unk.appendChild(el('span', 'fr-den', q.target.d)); r2.appendChild(unk);
            rows.appendChild(r1); rows.appendChild(r2); card.appendChild(rows);
            const box = el('div', 'fr-opts'); box.setAttribute('role', 'group');
            q.options.forEach(n => { const b = el('button', 'fr-opt', n); b.type = 'button'; b.onclick = () => answer(n, b); box.appendChild(b); });
            card.appendChild(box);
        } else {
            card.appendChild(el('p', 'fr-prompt', t.qAdd));
            const row = el('div', 'fr-pair');
            const c1 = el('div', 'fr-pairitem'); c1.appendChild(drawShape(q.shape, q.a, true)); c1.appendChild(fracEl(q.a));
            const c2 = el('div', 'fr-pairitem'); c2.appendChild(drawShape(q.shape, q.b, true)); c2.appendChild(fracEl(q.b));
            row.appendChild(c1); row.appendChild(el('span', 'fr-plus', '+')); row.appendChild(c2); card.appendChild(row);
            fracOptions(card, q.options.map(f => ({ node: fracEl(f), v: f })));
        }
    }
    function fracOptions(card, list) {
        const box = el('div', 'fr-opts'); box.setAttribute('role', 'group');
        list.forEach(o => { const b = el('button', 'fr-opt'); b.type = 'button'; b.appendChild(o.node); b.onclick = () => answer(o.v, b); box.appendChild(b); });
        card.appendChild(box);
    }

    function correctText(q) {
        const t = T();
        if (q.type === 'cmp') return q.answer === 'L' ? t.left : q.answer === 'R' ? t.right : t.equal;
        if (q.type === 'eq') return `${q.f.n}/${q.f.d} = ${q.target.n}/${q.target.d}`;
        return `${q.answer.n}/${q.answer.d}`;
    }

    function answer(v, btn) {
        if (S.locked) return; S.locked = true;
        const q = S.q, ok = isCorrect(q, v), t = T(), fb = $('fr-feedback');
        document.querySelectorAll('.fr-opt').forEach(b => { b.disabled = true; });
        if (btn) btn.classList.add(ok ? 'ok' : 'bad');
        if (ok) { S.correct++; S.run++; S.bestRun = Math.max(S.bestRun, S.run); } else S.run = 0;
        fb.hidden = false; fb.textContent = ''; fb.className = 'fr-feedback ' + (ok ? 'good' : 'bad');
        const txt = el('div'); txt.appendChild(el('b', null, ok ? pick(t.good) : t.bad));
        if (!ok) txt.appendChild(el('span', null, correctText(q)));
        const go = el('button', 'fr-btn', t.next); go.type = 'button'; go.id = 'fr-continue'; go.onclick = () => { S.qi++; next(); };
        fb.appendChild(txt); fb.appendChild(go); go.focus();
        if (!ok) { $('fr-card').classList.add('fr-shake'); if (navigator.vibrate) { try { navigator.vibrate(120); } catch (e) {} } }
    }

    async function finish() {
        const t = T(), won = passed(S.correct, S.total), st = stars(S.correct, S.total);
        $('fr-trophy').textContent = won ? (st === 3 ? '🏆' : '⭐') : '🔄';
        $('fr-endtitle').textContent = won ? t.done : t.fail;
        $('fr-endtext').textContent = t.score(S.correct, S.total);
        $('fr-endstars').textContent = won ? '★'.repeat(st) + '☆'.repeat(3 - st) : '';
        $('fr-next').textContent = won ? (S.idx < UNITS.length - 1 ? t.nextL : t.back) : t.again;
        $('fr-next').onclick = () => { if (won && S.idx < UNITS.length - 1) start(S.idx + 1); else if (won) { renderHome(); show('fr-home'); } else start(S.idx); };
        $('fr-back').textContent = t.back; $('fr-back').onclick = () => { renderHome(); show('fr-home'); };
        show('fr-end');
        if (!won) return;
        const prev = S.prog.units[S.u.id];
        S.prog.units[S.u.id] = { stars: Math.max(st, prev ? prev.stars : 0) };
        S.prog.xp = (S.prog.xp || 0) + 10 + st * 5;
        const today = dayStr(), y = dayStr(new Date(Date.now() - 864e5));
        if (S.prog.last !== today) { S.prog.streak = S.prog.last === y ? (S.prog.streak || 0) + 1 : 1; S.prog.last = today; }
        save();
        if (S.user && typeof PlatformFirestore !== 'undefined') {
            try {
                await PlatformFirestore.updateGameStats(S.user.uid, 'fractions', {
                    correctAnswers: S.correct, totalQuestions: S.total, totalAttempts: S.total, bestStreak: S.bestRun,
                    elapsedSeconds: Math.round((Date.now() - S.t0) / 1000), level: S.idx + 1, operation: S.u.id });
            } catch (e) { console.warn('[FractionsLab] stats not saved', e); }
        }
    }

    function init() {
        $('fr-quit').onclick = () => { renderHome(); show('fr-home'); };
        document.addEventListener('keydown', e => {
            if ($('fr-play').hidden) return;
            const c = $('fr-continue'), fbOpen = !$('fr-feedback').hidden;
            if (e.key === 'Enter' && fbOpen && c) { e.preventDefault(); c.click(); return; }
            if (fbOpen) return;
            if (/^[1-4]$/.test(e.key)) { const b = document.querySelectorAll('#fr-card .fr-opt')[Number(e.key) - 1]; if (b) b.click(); }
        });
        load(); renderHome(); show('fr-home');
        if (window.PlatformAuth && PlatformAuth.onAuthStateChanged) PlatformAuth.onAuthStateChanged(u => { S.user = u || null; load(); renderHome(); });
        window.addEventListener('platformLanguageChanged', () => { if (!$('fr-home').hidden) renderHome(); });
    }

    const api = { init, state: S, UNITS, gcd, simplify, compare, equivalent, add, fractionOptions, makeQuestion, makeLesson, isCorrect, stars, passed };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    return api;
})();
