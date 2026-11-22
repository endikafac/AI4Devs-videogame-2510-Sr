/**
 * Camino del Cálculo - progressive arithmetic path (add, subtract, multiply).
 * 14 lessons of 10 exercises, 3 hearts, mistakes come back at the end (like Duolingo).
 * The generators are pure functions so they can be unit tested.
 */
const CalcPath = (() => {
    'use strict';

    // ---- texts ----
    const UI = {
        es: { title: 'Camino del Cálculo', sub: 'Una lección corta cada día. Completa una para abrir la siguiente.', lesson: 'Lección', xp: 'XP', day: 'días',
              check: 'Comprobar', next: 'Continuar', good: ['¡Muy bien!', '¡Genial!', '¡Perfecto!', '¡Sigue así!'], bad: 'Casi. La respuesta es', quit: 'Salir',
              qType: 'Escribe el resultado', qChoice: 'Elige el resultado', qMissing: 'Encuentra el número que falta', qCompare: 'Elige <, = o >', qTf: '¿Es verdadero?',
              qVisual: '¿Cuántos hay?', qBuild: n => `Elige la cuenta que da ${n}`, tTrue: 'Verdadero', tFalse: 'Falso',
              done: '¡Lección completada!', fail: 'Sin vidas. ¡Inténtalo otra vez!', again: 'Repetir', nextL: 'Siguiente lección', back: 'Volver al camino',
              score: (m) => m === 0 ? 'Sin ningún fallo. ¡Increíble!' : `${m} ${m === 1 ? 'fallo' : 'fallos'}. Cada error enseña algo.`, locked: 'Completa la anterior',
              k: { add: 'Sumar', sub: 'Restar', mix: 'Sumar y restar', miss: 'Huecos', mul: 'Multiplicar' }, upto: 'hasta', carry: 'llevando', tables: 'tablas' },
        en: { title: 'Calculation Path', sub: 'One short lesson a day. Finish one to unlock the next.', lesson: 'Lesson', xp: 'XP', day: 'days',
              check: 'Check', next: 'Continue', good: ['Well done!', 'Great!', 'Perfect!', 'Keep going!'], bad: 'Almost. The answer is', quit: 'Quit',
              qType: 'Type the result', qChoice: 'Pick the result', qMissing: 'Find the missing number', qCompare: 'Pick <, = or >', qTf: 'Is it true?',
              qVisual: 'How many are there?', qBuild: n => `Pick the sum that makes ${n}`, tTrue: 'True', tFalse: 'False',
              done: 'Lesson complete!', fail: 'Out of hearts. Try again!', again: 'Try again', nextL: 'Next lesson', back: 'Back to the path',
              score: (m) => m === 0 ? 'No mistakes at all. Amazing!' : `${m} ${m === 1 ? 'mistake' : 'mistakes'}. Every error teaches something.`, locked: 'Finish the previous one',
              k: { add: 'Add', sub: 'Subtract', mix: 'Add and subtract', miss: 'Missing numbers', mul: 'Multiply' }, upto: 'up to', carry: 'with carrying', tables: 'tables' },
        eu: { title: 'Kalkulu bidea', sub: 'Egunero ikasgai labur bat. Bukatu bat hurrengoa irekitzeko.', lesson: 'Ikasgaia', xp: 'XP', day: 'egun',
              check: 'Egiaztatu', next: 'Jarraitu', good: ['Oso ondo!', 'Bikain!', 'Perfektua!', 'Jarraitu horrela!'], bad: 'Ia. Erantzuna hau da:', quit: 'Irten',
              qType: 'Idatzi emaitza', qChoice: 'Aukeratu emaitza', qMissing: 'Aurkitu falta den zenbakia', qCompare: 'Aukeratu <, = edo >', qTf: 'Egia al da?',
              qVisual: 'Zenbat daude?', qBuild: n => `Aukeratu ${n} ematen duen eragiketa`, tTrue: 'Egia', tFalse: 'Gezurra',
              done: 'Ikasgaia osatuta!', fail: 'Bizirik gabe. Saiatu berriro!', again: 'Berriro', nextL: 'Hurrengo ikasgaia', back: 'Itzuli bidera',
              score: (m) => m === 0 ? 'Akatsik gabe. Harrigarria!' : `${m} akats. Akats bakoitzak zerbait irakasten du.`, locked: 'Bukatu aurrekoa',
              k: { add: 'Batu', sub: 'Kendu', mix: 'Batu eta kendu', miss: 'Hutsuneak', mul: 'Biderkatu' }, upto: 'arte', carry: 'eramanez', tables: 'taulak' },
        gl: { title: 'Camiño do Cálculo', sub: 'Unha lección curta cada día. Remata unha para abrir a seguinte.', lesson: 'Lección', xp: 'XP', day: 'días',
              check: 'Comprobar', next: 'Continuar', good: ['Moi ben!', 'Xenial!', 'Perfecto!', 'Segue así!'], bad: 'Case. A resposta é', quit: 'Saír',
              qType: 'Escribe o resultado', qChoice: 'Elixe o resultado', qMissing: 'Atopa o número que falta', qCompare: 'Elixe <, = ou >', qTf: 'É verdade?',
              qVisual: 'Cantos hai?', qBuild: n => `Elixe a conta que dá ${n}`, tTrue: 'Verdade', tFalse: 'Falso',
              done: 'Lección completada!', fail: 'Sen vidas. Inténtao outra vez!', again: 'Repetir', nextL: 'Seguinte lección', back: 'Volver ao camiño',
              score: (m) => m === 0 ? 'Sen ningún fallo. Incrible!' : `${m} ${m === 1 ? 'fallo' : 'fallos'}. Cada erro ensina algo.`, locked: 'Completa a anterior',
              k: { add: 'Sumar', sub: 'Restar', mix: 'Sumar e restar', miss: 'Ocos', mul: 'Multiplicar' }, upto: 'ata', carry: 'levando', tables: 'táboas' },
        ca: { title: 'Camí del Càlcul', sub: 'Una lliçó curta cada dia. Acaba\'n una per obrir la següent.', lesson: 'Lliçó', xp: 'XP', day: 'dies',
              check: 'Comprova', next: 'Continua', good: ['Molt bé!', 'Genial!', 'Perfecte!', 'Continua així!'], bad: 'Gairebé. La resposta és', quit: 'Surt',
              qType: 'Escriu el resultat', qChoice: 'Tria el resultat', qMissing: 'Troba el número que falta', qCompare: 'Tria <, = o >', qTf: 'És veritat?',
              qVisual: 'Quants n\'hi ha?', qBuild: n => `Tria el compte que dona ${n}`, tTrue: 'Veritat', tFalse: 'Fals',
              done: 'Lliçó completada!', fail: 'Sense vides. Torna-ho a provar!', again: 'Repeteix', nextL: 'Següent lliçó', back: 'Torna al camí',
              score: (m) => m === 0 ? 'Cap error. Increïble!' : `${m} ${m === 1 ? 'error' : 'errors'}. Cada error ensenya alguna cosa.`, locked: 'Acaba l\'anterior',
              k: { add: 'Sumar', sub: 'Restar', mix: 'Sumar i restar', miss: 'Buits', mul: 'Multiplicar' }, upto: 'fins a', carry: 'amb llevades', tables: 'taules' },
        fr: { title: 'Le chemin du calcul', sub: 'Une courte leçon par jour. Terminez-en une pour ouvrir la suivante.', lesson: 'Leçon', xp: 'XP', day: 'jours',
              check: 'Vérifier', next: 'Continuer', good: ['Très bien !', 'Génial !', 'Parfait !', 'Continuez !'], bad: 'Presque. La réponse est', quit: 'Quitter',
              qType: 'Écris le résultat', qChoice: 'Choisis le résultat', qMissing: 'Trouve le nombre manquant', qCompare: 'Choisis <, = ou >', qTf: 'Est-ce vrai ?',
              qVisual: 'Combien y en a-t-il ?', qBuild: n => `Choisis le calcul qui donne ${n}`, tTrue: 'Vrai', tFalse: 'Faux',
              done: 'Leçon terminée !', fail: 'Plus de vies. Réessaie !', again: 'Recommencer', nextL: 'Leçon suivante', back: 'Retour au chemin',
              score: (m) => m === 0 ? 'Aucune erreur. Incroyable !' : `${m} ${m === 1 ? 'erreur' : 'erreurs'}. Chaque erreur apprend quelque chose.`, locked: 'Termine la précédente',
              k: { add: 'Additionner', sub: 'Soustraire', mix: 'Additionner et soustraire', miss: 'Trous', mul: 'Multiplier' }, upto: 'jusqu\'à', carry: 'avec retenue', tables: 'tables' }
    };

    // ---- lessons (progressive) ----
    // kind: add | sub | mix | miss | mul ; max: numeric ceiling ; carry: tens with carrying ; step: 100s
    const UNITS = [
        { id: 'a10',  icon: '🍎', kind: 'add',  max: 10 },
        { id: 's10',  icon: '🍌', kind: 'sub',  max: 10 },
        { id: 'm10',  icon: '🍇', kind: 'mix',  max: 10 },
        { id: 'a20',  icon: '🐣', kind: 'add',  max: 20 },
        { id: 's20',  icon: '🐟', kind: 'sub',  max: 20 },
        { id: 'm20',  icon: '🚀', kind: 'mix',  max: 20 },
        { id: 'h20',  icon: '🧩', kind: 'miss', max: 20 },
        { id: 'a100', icon: '🏠', kind: 'add',  max: 100, carry: false },
        { id: 'a100c', icon: '🎒', kind: 'add', max: 100, carry: true },
        { id: 's100c', icon: '⚓', kind: 'sub', max: 100, carry: true },
        { id: 'm100', icon: '🏔️', kind: 'mix',  max: 100, carry: true },
        { id: 'm1000', icon: '🌋', kind: 'mix', max: 1000 },
        { id: 'x25',  icon: '✖️', kind: 'mul',  max: 10, small: true },
        { id: 'x10',  icon: '🏆', kind: 'mul',  max: 10 }
    ];
    const LESSON_LEN = 10, HEARTS = 3;

    const ri = (a, b, r = Math.random) => a + Math.floor(r() * (b - a + 1));
    const pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];
    const shuffle = (a, r = Math.random) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const calc = (a, op, b) => op === '+' ? a + b : op === '-' ? a - b : a * b;
    const OPSYM = { '+': '+', '-': '−', '*': '×' };

    /** Generate one operation for a lesson. Returns { a, op, b, res }. Pure. */
    function gen(u, r = Math.random) {
        let kind = u.kind === 'mix' || u.kind === 'miss' ? pick(['add', 'sub'], r) : u.kind;
        let a, b, op;
        if (kind === 'mul') {
            op = '*';
            if (u.small) { a = ri(1, 10, r); b = pick([2, 5, 10], r); if (r() < .5) [a, b] = [b, a]; }
            else { a = ri(2, 10, r); b = ri(2, 10, r); }
        } else if (u.max <= 20) {
            if (kind === 'add') { op = '+'; a = ri(1, u.max - 1, r); b = ri(1, u.max - a, r); }
            else { op = '-'; a = ri(2, u.max, r); b = ri(1, a, r); }
            if (u.max === 20 && Math.max(a, b) <= 9 && r() < .8) return gen(u, r); // 20: prefer teen numbers
        } else if (u.max === 100) {
            const carry = u.carry === undefined ? false : u.carry;
            if (kind === 'add') {
                op = '+';
                for (let i = 0; i < 80; i++) {
                    a = ri(11, 89, r); b = ri(11, 89, r);
                    const c = (a % 10) + (b % 10) >= 10;
                    if (a + b <= 99 && c === !!carry) break;
                }
            } else {
                op = '-';
                for (let i = 0; i < 80; i++) {
                    a = ri(21, 99, r); b = ri(11, a - 1, r);
                    if (((a % 10) < (b % 10)) === !!carry) break;
                }
            }
        } else {
            if (kind === 'add') { op = '+'; a = ri(100, 800, r); b = pick([ri(10, 99, r), ri(1, 9, r) * 100, ri(10, 50, r) * 10], r); if (a + b > 999) b = 999 - a; }
            else { op = '-'; a = ri(200, 999, r); b = pick([ri(10, 99, r), ri(1, 9, r) * 100, ri(10, 50, r) * 10], r); if (b >= a) b = ri(10, a - 1, r); }
        }
        return { a, op, b, res: calc(a, op, b) };
    }

    function distractors(res, r = Math.random, n = 3) {
        const set = new Set(), span = res > 100 ? [1, 2, 10, 100] : [1, 2, 3, 10];
        let guard = 0;
        while (set.size < n && guard++ < 60) {
            const d = pick(span, r) * (r() < .5 ? -1 : 1), v = res + d;
            if (v >= 0 && v !== res) set.add(v);
        }
        let k = 1; while (set.size < n) { if (res + k !== res) set.add(res + k); k++; }
        return [...set];
    }

    /** Question kinds allowed per lesson kind. */
    function typesFor(u) {
        if (u.kind === 'miss') return ['missing', 'missing', 'type', 'tf', 'compare'];
        if (u.kind === 'mul') return ['type', 'choice', 'missing', 'tf', 'build', u.small ? 'choice' : 'compare'];
        if (u.max <= 10) return ['visual', 'type', 'choice', 'tf', 'compare', 'build', 'missing'];
        if (u.max <= 20) return ['type', 'choice', 'missing', 'compare', 'tf', 'build', 'visual'];
        return ['type', 'choice', 'missing', 'compare', 'tf', 'build'];
    }

    /** Build a full question object (pure, no DOM). */
    function makeQuestion(u, type, r = Math.random) {
        const o = gen(u, r);
        const q = { type, a: o.a, op: o.op, b: o.b, res: o.res, unit: u.id };
        if (type === 'visual' && !(o.op !== '*' && o.a <= 10 && o.b <= 10 && o.res <= 20)) q.type = type = pick(['choice', 'type'], r);
        if (type === 'choice') q.options = shuffle([o.res, ...distractors(o.res, r)], r);
        if (type === 'visual') q.options = shuffle([o.res, ...distractors(o.res, r)], r);
        if (type === 'missing') { q.hole = o.op === '*' || r() < .5 ? 'b' : 'a'; q.answer = q.hole === 'b' ? o.b : o.a; }
        if (type === 'compare') {
            const delta = pick([-2, -1, 0, 0, 1, 2], r); q.other = Math.max(0, o.res + delta);
            q.answer = o.res < q.other ? '<' : o.res > q.other ? '>' : '=';
        }
        if (type === 'tf') {
            const truth = r() < .5; q.shown = truth ? o.res : Math.max(0, o.res + pick([-3, -2, -1, 1, 2, 3, 10, -10], r));
            if (q.shown === o.res) q.shown = o.res + (truth ? 0 : 1);
            q.answer = q.shown === o.res;
        }
        if (type === 'build') {
            const opts = [o]; let g = 0;
            while (opts.length < 4 && g++ < 80) { const x = gen(u, r); if (x.res !== o.res && !opts.some(y => y.a === x.a && y.b === x.b && y.op === x.op)) opts.push(x); }
            q.exprs = shuffle(opts, r).map(x => ({ a: x.a, op: x.op, b: x.b, ok: x.res === o.res }));
        }
        return q;
    }

    function makeLesson(u, r = Math.random) {
        const types = typesFor(u), out = []; let last = '';
        for (let i = 0; i < LESSON_LEN; i++) {
            let t, g = 0; do { t = pick(types, r); } while (t === last && g++ < 8);
            last = t; out.push(makeQuestion(u, t, r));
        }
        return out;
    }

    /** Is the typed/selected answer right? Pure. */
    function isCorrect(q, v) {
        switch (q.type) {
            case 'type': case 'choice': case 'visual': return Number(v) === q.res;
            case 'missing': return Number(v) === q.answer;
            case 'compare': return v === q.answer;
            case 'tf': return v === q.answer;
            case 'build': return !!(q.exprs[v] && q.exprs[v].ok);
        }
        return false;
    }
    const stars = misses => misses === 0 ? 3 : misses <= 2 ? 2 : 1;

    // ---- state / storage ----
    const S = { user: null, prog: { units: {}, xp: 0, streak: 0, last: '' }, u: null, queue: [], total: 0, hearts: HEARTS, misses: 0, q: null, typed: '', locked: false, t0: 0 };
    const $ = id => document.getElementById(id);
    const lang = () => { const l = ((window.PlatformI18n && PlatformI18n.currentLanguage) || 'es').slice(0, 2); return UI[l] ? l : 'es'; };
    const T = () => UI[lang()];
    function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function owner() {
        const u = S.user; if (!u) return 'guest';
        let pid = null; try { pid = PlatformFirestore._pid(u.uid); } catch (e) {}
        return u.uid + (pid ? '_' + pid : '');
    }
    const key = () => 'calc_prog_' + owner();
    function load() { try { S.prog = Object.assign({ units: {}, xp: 0, streak: 0, last: '' }, JSON.parse(localStorage.getItem(key()))); } catch (e) { S.prog = { units: {}, xp: 0, streak: 0, last: '' }; } }
    function save() { try { localStorage.setItem(key(), JSON.stringify(S.prog)); } catch (e) {} }
    const dayStr = (d = new Date()) => d.toISOString().slice(0, 10);

    function unitName(u) {
        const t = T(), k = t.k[u.kind];
        if (u.kind === 'mul') return u.small ? `${k}: ×2, ×5, ×10` : `${k} (${t.tables})`;
        if (u.kind === 'miss') return `${k} ${t.upto} ${u.max}`;
        if (u.max === 100) return u.carry ? `${k} ${t.upto} 100 (${t.carry})` : `${k} ${t.upto} 100`;
        return `${k} ${t.upto} ${u.max}`;
    }
    const unlocked = i => i === 0 || !!S.prog.units[UNITS[i - 1].id];

    // ---- home ----
    function show(id) { ['cp-home', 'cp-play', 'cp-end'].forEach(s => { $(s).hidden = s !== id; }); window.scrollTo(0, 0); }
    function renderHome() {
        const t = T();
        $('cp-h1').textContent = t.title; $('cp-sub').textContent = t.sub;
        const st = $('cp-stats'); st.textContent = '';
        st.appendChild(el('span', 'cp-pill', `🔥 ${S.prog.streak || 0}`)); st.appendChild(el('span', 'cp-pill', `⚡ ${S.prog.xp || 0} ${t.xp}`));
        const path = $('cp-path'); path.textContent = '';
        let current = UNITS.findIndex(u => !S.prog.units[u.id]); if (current < 0) current = UNITS.length - 1;
        UNITS.forEach((u, i) => {
            const li = el('li', 'cp-node'), done = S.prog.units[u.id], open = unlocked(i);
            const b = el('button', 'cp-dot' + (done ? ' done' : '') + (!open ? ' locked' : '') + (open && i === current ? ' current' : ''), open ? u.icon : '🔒');
            b.type = 'button'; b.dataset.unit = u.id;
            b.setAttribute('aria-label', `${t.lesson} ${i + 1}: ${unitName(u)}${open ? '' : '. ' + t.locked}`);
            if (open) b.onclick = () => start(i); else b.disabled = true;
            const info = el('div', 'cp-info'); info.appendChild(el('b', null, `${t.lesson} ${i + 1}`)); info.appendChild(el('span', null, unitName(u)));
            if (done) info.appendChild(el('div', 'cp-stars', '★'.repeat(done.stars) + '☆'.repeat(3 - done.stars)));
            li.appendChild(b); li.appendChild(info); path.appendChild(li);
        });
    }

    // ---- lesson ----
    function start(i) {
        S.idx = i; S.u = UNITS[i]; S.queue = makeLesson(S.u); S.total = S.queue.length; S.hearts = HEARTS; S.misses = 0; S.done = 0; S.t0 = Date.now();
        show('cp-play'); next();
    }
    function hearts() { $('cp-hearts').textContent = '❤️'.repeat(S.hearts) + '🖤'.repeat(HEARTS - S.hearts); $('cp-hearts').setAttribute('aria-label', S.hearts + ' / ' + HEARTS); }
    function bar() { const p = Math.round(S.done / S.total * 100); $('cp-barfill').style.width = p + '%'; $('cp-barfill').parentNode.setAttribute('aria-valuenow', p); }
    const sym = o => OPSYM[o];
    function eqHTML(q, hole) {
        const w = el('div', 'cp-eq'); w.setAttribute('dir', 'ltr');
        [hole === 'a' ? null : q.a, sym(q.op), hole === 'b' ? null : q.b, '=', hole ? q.res : null].forEach(p => {
            if (p === null) w.appendChild(el('em', null, '?')); else w.appendChild(document.createTextNode(p));
            w.appendChild(document.createTextNode(' '));
        });
        return w;
    }

    function next() {
        $('cp-feedback').hidden = true; S.locked = false; S.typed = '';
        if (!S.queue.length) return finish(true);
        S.q = S.queue[0]; bar(); hearts();
        const t = T(), q = S.q, card = $('cp-card'); card.textContent = '';
        card.classList.remove('cp-shake');
        const prompt = { type: t.qType, choice: t.qChoice, missing: t.qMissing, compare: t.qCompare, tf: t.qTf, visual: t.qVisual }[q.type] || t.qBuild(q.res);
        card.appendChild(el('p', 'cp-prompt', q.type === 'build' ? t.qBuild(q.res) : prompt));
        if (q.type === 'type') { card.appendChild(eqHTML(q)); answerPad(card); }
        else if (q.type === 'choice') { card.appendChild(eqHTML(q)); options(card, q.options.map(v => ({ label: String(v), v }))); }
        else if (q.type === 'missing') { card.appendChild(eqHTML(q, q.hole)); answerPad(card); }
        else if (q.type === 'visual') {
            const vis = el('div', 'cp-vis'), em = ['🍎', '🍌', '🍇', '🐟', '⭐', '🚗', '🐥'][(q.a + q.b) % 7];
            vis.appendChild(el('span', null, em.repeat(q.a)));
            vis.appendChild(el('i', null, q.op === '+' ? '+' : '−'));
            vis.appendChild(el('span', null, q.op === '+' ? em.repeat(q.b) : '❌'.repeat(q.b)));
            vis.setAttribute('role', 'img'); vis.setAttribute('aria-label', `${q.a} ${sym(q.op)} ${q.b}`);
            card.appendChild(vis); card.appendChild(eqHTML(q)); options(card, q.options.map(v => ({ label: String(v), v })));
        }
        else if (q.type === 'compare') {
            const e = el('div', 'cp-eq'); e.textContent = `${q.a} ${sym(q.op)} ${q.b}   ?   ${q.other}`; card.appendChild(e);
            options(card, ['<', '=', '>'].map(v => ({ label: v, v })));
        }
        else if (q.type === 'tf') {
            const e = el('div', 'cp-eq'); e.textContent = `${q.a} ${sym(q.op)} ${q.b} = ${q.shown}`; card.appendChild(e);
            options(card, [{ label: t.tTrue, v: true }, { label: t.tFalse, v: false }], true);
        }
        else if (q.type === 'build') options(card, q.exprs.map((x, i) => ({ label: `${x.a} ${sym(x.op)} ${x.b}`, v: i })), true);
    }

    function options(card, list, wide) {
        const box = el('div', 'cp-opts' + (wide ? ' wide' : '')); box.setAttribute('role', 'group');
        list.forEach(o => { const b = el('button', 'cp-opt', o.label); b.type = 'button'; b.onclick = () => answer(o.v, b); box.appendChild(b); });
        card.appendChild(box);
    }

    function answerPad(card) {
        const disp = el('div', 'cp-ans'); disp.id = 'cp-ans'; disp.setAttribute('aria-live', 'polite'); card.appendChild(disp);
        const pad = el('div', 'cp-pad');
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'].forEach(k => {
            const b = el('button', 'cp-key' + (k === '✓' ? ' go' : ''), k); b.type = 'button';
            b.setAttribute('aria-label', k === '⌫' ? 'Borrar' : k === '✓' ? T().check : k);
            b.onclick = () => key_(k); pad.appendChild(b);
        });
        card.appendChild(pad);
    }
    function key_(k) {
        if (S.locked) return;
        if (k === '⌫') S.typed = S.typed.slice(0, -1);
        else if (k === '✓') { if (S.typed !== '') answer(Number(S.typed)); return; }
        else if (S.typed.length < 4) S.typed += k;
        const d = $('cp-ans'); if (d) d.textContent = S.typed;
    }

    function correctText(q) {
        if (q.type === 'missing') return String(q.answer);
        if (q.type === 'compare') return `${q.a} ${sym(q.op)} ${q.b} ${q.answer} ${q.other}`;
        if (q.type === 'tf') return `${q.a} ${sym(q.op)} ${q.b} = ${q.res}`;
        if (q.type === 'build') { const x = q.exprs.find(e => e.ok); return `${x.a} ${sym(x.op)} ${x.b} = ${q.res}`; }
        return String(q.res);
    }

    function answer(v, btn) {
        if (S.locked) return; S.locked = true;
        const q = S.q, ok = isCorrect(q, v), t = T(), fb = $('cp-feedback');
        document.querySelectorAll('.cp-opt').forEach(b => { b.disabled = true; });
        if (btn) btn.classList.add(ok ? 'ok' : 'bad');
        fb.hidden = false; fb.textContent = ''; fb.className = 'cp-feedback ' + (ok ? 'good' : 'bad');
        const txt = el('div'); const strong = el('b', null, ok ? pick(t.good) : t.bad); txt.appendChild(strong);
        if (!ok) txt.appendChild(el('span', null, correctText(q)));
        const go = el('button', 'cp-btn', t.next); go.type = 'button'; go.id = 'cp-continue'; go.onclick = () => { advance(ok); };
        fb.appendChild(txt); fb.appendChild(go); go.focus();
        if (!ok) { $('cp-card').classList.add('cp-shake'); if (navigator.vibrate) { try { navigator.vibrate(120); } catch (e) {} } }
        S.lastOk = ok;
    }
    function advance(ok) {
        const q = S.queue.shift();
        if (ok) S.done++;
        else {
            S.misses++; S.hearts--; hearts();
            if (S.hearts <= 0) return finish(false);
            S.queue.push(makeQuestion(S.u, pick(typesFor(S.u)))); // a fresh one of the same lesson comes back at the end
        }
        next();
    }

    async function finish(won) {
        const t = T(), st = stars(S.misses);
        $('cp-trophy').textContent = won ? (st === 3 ? '🏆' : '⭐') : '💔';
        $('cp-endtitle').textContent = won ? t.done : t.fail;
        $('cp-endtext').textContent = won ? t.score(S.misses) : '';
        $('cp-endstars').textContent = won ? '★'.repeat(st) + '☆'.repeat(3 - st) : '';
        $('cp-next').textContent = won ? (S.idx < UNITS.length - 1 ? t.nextL : t.back) : t.again;
        $('cp-next').onclick = () => { if (won && S.idx < UNITS.length - 1) start(S.idx + 1); else if (won) { renderHome(); show('cp-home'); } else start(S.idx); };
        $('cp-back').textContent = t.back; $('cp-back').onclick = () => { renderHome(); show('cp-home'); };
        show('cp-end');
        if (!won) return;
        const prev = S.prog.units[S.u.id];
        S.prog.units[S.u.id] = { stars: Math.max(st, prev ? prev.stars : 0) };
        const gained = 10 + st * 5; S.prog.xp = (S.prog.xp || 0) + gained;
        const today = dayStr(), y = dayStr(new Date(Date.now() - 864e5));
        if (S.prog.last !== today) { S.prog.streak = S.prog.last === y ? (S.prog.streak || 0) + 1 : 1; S.prog.last = today; }
        save();
        if (S.user && typeof PlatformFirestore !== 'undefined') {
            try {
                await PlatformFirestore.updateGameStats(S.user.uid, 'calcpath', {
                    correctAnswers: S.total, totalQuestions: S.total + S.misses, totalAttempts: S.total + S.misses, bestStreak: S.total - S.misses > 0 ? S.total : 0,
                    elapsedSeconds: Math.round((Date.now() - S.t0) / 1000), level: S.idx + 1, operation: S.u.kind });
            } catch (e) { console.warn('[CalcPath] stats not saved', e); }
        }
    }

    function init() {
        $('cp-quit').onclick = () => { renderHome(); show('cp-home'); };
        document.addEventListener('keydown', e => {
            if ($('cp-play').hidden) return;
            if (/^[0-9]$/.test(e.key)) key_(e.key);
            else if (e.key === 'Backspace') key_('⌫');
            else if (e.key === 'Enter') { const c = $('cp-continue'); if (!$('cp-feedback').hidden && c) c.click(); else key_('✓'); }
        });
        load(); renderHome(); show('cp-home');
        if (window.PlatformAuth && PlatformAuth.onAuthStateChanged) PlatformAuth.onAuthStateChanged(u => { S.user = u || null; load(); renderHome(); });
        window.addEventListener('platformLanguageChanged', () => { if (!$('cp-home').hidden) renderHome(); });
    }

    const api = { init, state: S, UNITS, gen, makeQuestion, makeLesson, isCorrect, stars, typesFor, distractors };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    return api;
})();
