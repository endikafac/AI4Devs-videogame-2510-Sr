/**
 * Aprende la Hora - learn to tell the time with an analogue clock.
 * 6 lessons: full hours -> half hours -> quarters -> 5 minutes. Question kinds: read the clock,
 * pick the clock that shows a digital time, set the hands. Pure logic is exported for unit tests.
 */
const ClockLab = (() => {
    'use strict';

    const UI = {
        es: { title: 'Aprende la Hora', sub: 'Lee el reloj y coloca las agujas. Completa una lección para abrir la siguiente.', lesson: 'Lección', xp: 'XP',
              next: 'Continuar', check: 'Comprobar', good: ['¡Muy bien!', '¡Genial!', '¡Perfecto!', '¡Sigue así!'], bad: 'Casi. La hora es', quit: 'Salir',
              qRead: '¿Qué hora marca el reloj?', qPick: n => `¿Qué reloj marca las ${n}?`, qSet: n => `Pon el reloj a las ${n}`,
              hour: 'Hora', minute: 'Minutos', plus: 'más', minus: 'menos', done: '¡Lección completada!', fail: 'Necesitas acertar más. ¡Inténtalo otra vez!',
              again: 'Repetir', nextL: 'Siguiente lección', back: 'Volver al camino', locked: 'Completa la anterior', right: 'aciertos',
              score: (c, t) => `${c} de ${t} aciertos.`, clockLabel: (h, m) => `Reloj: ${h}:${m < 10 ? '0' : ''}${m}`,
              k: { hours: 'Horas en punto', hoursSet: 'Pon las horas', half: 'Y media', quarter: 'Cuartos', five: 'De 5 en 5 minutos', five2: 'Reto de relojero' } },
        en: { title: 'Learn the Time', sub: 'Read the clock and set the hands. Finish a lesson to unlock the next.', lesson: 'Lesson', xp: 'XP',
              next: 'Continue', check: 'Check', good: ['Well done!', 'Great!', 'Perfect!', 'Keep going!'], bad: 'Almost. The time is', quit: 'Quit',
              qRead: 'What time does the clock show?', qPick: n => `Which clock shows ${n}?`, qSet: n => `Set the clock to ${n}`,
              hour: 'Hour', minute: 'Minutes', plus: 'more', minus: 'less', done: 'Lesson complete!', fail: 'You need more right answers. Try again!',
              again: 'Try again', nextL: 'Next lesson', back: 'Back to the path', locked: 'Finish the previous one', right: 'correct',
              score: (c, t) => `${c} out of ${t} correct.`, clockLabel: (h, m) => `Clock: ${h}:${m < 10 ? '0' : ''}${m}`,
              k: { hours: "O'clock", hoursSet: 'Set the hours', half: 'Half past', quarter: 'Quarters', five: 'Every 5 minutes', five2: 'Watchmaker challenge' } },
        eu: { title: 'Ikasi ordua', sub: 'Irakurri erlojua eta jarri orratzak. Bukatu ikasgai bat hurrengoa irekitzeko.', lesson: 'Ikasgaia', xp: 'XP',
              next: 'Jarraitu', check: 'Egiaztatu', good: ['Oso ondo!', 'Bikain!', 'Perfektua!', 'Jarraitu horrela!'], bad: 'Ia. Ordua hau da:', quit: 'Irten',
              qRead: 'Zer ordu markatzen du erlojuak?', qPick: n => `Zein erlojuk markatzen ditu ${n}?`, qSet: n => `Jarri erlojua ordu honetan: ${n}`,
              hour: 'Ordua', minute: 'Minutuak', plus: 'gehiago', minus: 'gutxiago', done: 'Ikasgaia osatuta!', fail: 'Erantzun zuzen gehiago behar dituzu. Saiatu berriro!',
              again: 'Berriro', nextL: 'Hurrengo ikasgaia', back: 'Itzuli bidera', locked: 'Bukatu aurrekoa', right: 'zuzen',
              score: (c, t) => `${t}tik ${c} zuzen.`, clockLabel: (h, m) => `Erlojua: ${h}:${m < 10 ? '0' : ''}${m}`,
              k: { hours: 'Ordu zehatzak', hoursSet: 'Jarri orduak', half: 'Eta erdia', quarter: 'Laurdenak', five: '5 minuturo', five2: 'Erlojugilearen erronka' } },
        gl: { title: 'Aprende a hora', sub: 'Le o reloxo e pon as agullas. Remata unha lección para abrir a seguinte.', lesson: 'Lección', xp: 'XP',
              next: 'Continuar', check: 'Comprobar', good: ['Moi ben!', 'Xenial!', 'Perfecto!', 'Segue así!'], bad: 'Case. A hora é', quit: 'Saír',
              qRead: 'Que hora marca o reloxo?', qPick: n => `Que reloxo marca as ${n}?`, qSet: n => `Pon o reloxo ás ${n}`,
              hour: 'Hora', minute: 'Minutos', plus: 'máis', minus: 'menos', done: 'Lección completada!', fail: 'Necesitas acertar máis. Inténtao outra vez!',
              again: 'Repetir', nextL: 'Seguinte lección', back: 'Volver ao camiño', locked: 'Completa a anterior', right: 'acertos',
              score: (c, t) => `${c} de ${t} acertos.`, clockLabel: (h, m) => `Reloxo: ${h}:${m < 10 ? '0' : ''}${m}`,
              k: { hours: 'Horas en punto', hoursSet: 'Pon as horas', half: 'E media', quarter: 'Cuartos', five: 'De 5 en 5 minutos', five2: 'Reto de reloxeiro' } },
        ca: { title: 'Aprèn l\'hora', sub: 'Llegeix el rellotge i posa les busques. Acaba una lliçó per obrir la següent.', lesson: 'Lliçó', xp: 'XP',
              next: 'Continua', check: 'Comprova', good: ['Molt bé!', 'Genial!', 'Perfecte!', 'Continua així!'], bad: 'Gairebé. L\'hora és', quit: 'Surt',
              qRead: 'Quina hora marca el rellotge?', qPick: n => `Quin rellotge marca les ${n}?`, qSet: n => `Posa el rellotge a les ${n}`,
              hour: 'Hora', minute: 'Minuts', plus: 'més', minus: 'menys', done: 'Lliçó completada!', fail: 'Necessites encertar més. Torna-ho a provar!',
              again: 'Repeteix', nextL: 'Següent lliçó', back: 'Torna al camí', locked: 'Acaba l\'anterior', right: 'encerts',
              score: (c, t) => `${c} de ${t} encerts.`, clockLabel: (h, m) => `Rellotge: ${h}:${m < 10 ? '0' : ''}${m}`,
              k: { hours: 'Hores en punt', hoursSet: 'Posa les hores', half: 'I mitja', quarter: 'Quarts', five: 'De 5 en 5 minuts', five2: 'Repte de rellotger' } },
        fr: { title: 'Apprends l\'heure', sub: 'Lis l\'horloge et place les aiguilles. Termine une leçon pour ouvrir la suivante.', lesson: 'Leçon', xp: 'XP',
              next: 'Continuer', check: 'Vérifier', good: ['Très bien !', 'Génial !', 'Parfait !', 'Continue !'], bad: 'Presque. L\'heure est', quit: 'Quitter',
              qRead: 'Quelle heure indique l\'horloge ?', qPick: n => `Quelle horloge indique ${n} ?`, qSet: n => `Mets l'horloge à ${n}`,
              hour: 'Heure', minute: 'Minutes', plus: 'plus', minus: 'moins', done: 'Leçon terminée !', fail: 'Il faut plus de bonnes réponses. Réessaie !',
              again: 'Recommencer', nextL: 'Leçon suivante', back: 'Retour au chemin', locked: 'Termine la précédente', right: 'bonnes réponses',
              score: (c, t) => `${c} sur ${t} bonnes réponses.`, clockLabel: (h, m) => `Horloge : ${h}:${m < 10 ? '0' : ''}${m}`,
              k: { hours: 'Heures pile', hoursSet: 'Place les heures', half: 'Et demie', quarter: 'Quarts', five: 'De 5 en 5 minutes', five2: 'Défi d\'horloger' } }
    };

    // step = minute granularity; types = question kinds used by the lesson
    const UNITS = [
        { id: 'hours',    icon: '🕐', step: 60, types: ['read', 'pick'],              len: 8 },
        { id: 'hoursSet', icon: '🕓', step: 60, types: ['set', 'read'],               len: 8 },
        { id: 'half',     icon: '🕧', step: 30, types: ['read', 'pick', 'set'],       len: 8 },
        { id: 'quarter',  icon: '🕞', step: 15, types: ['read', 'pick', 'set'],       len: 8 },
        { id: 'five',     icon: '🕗', step: 5,  types: ['read', 'pick', 'set'],       len: 8 },
        { id: 'five2',    icon: '🏆', step: 5,  types: ['read', 'set', 'pick', 'set'], len: 10 }
    ];
    const PASS_RATIO = 0.6;

    const ri = (a, b, r = Math.random) => a + Math.floor(r() * (b - a + 1));
    const pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];
    const shuffle = (a, r = Math.random) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const pad2 = n => (n < 10 ? '0' : '') + n;

    /** Hour is 1..12, minute 0..59. */
    const formatTime = (h, m) => `${h}:${pad2(m)}`;
    const norm12 = h => ((h - 1 + 12) % 12) + 1;
    const same = (a, b) => norm12(a.h) === norm12(b.h) && a.m === b.m;
    /** Hand angles in degrees clockwise from 12. */
    const handAngles = (h, m) => ({ hour: (h % 12) * 30 + m * 0.5, minute: m * 6 });

    function makeTime(step, r = Math.random) {
        const h = ri(1, 12, r), m = step >= 60 ? 0 : ri(0, Math.floor(59 / step), r) * step;
        return { h, m };
    }

    /** Wrong but plausible times, all distinct from t and each other. Typical mistakes: hands swapped, +/-1 hour, +/-step minutes. */
    function distractors(t, step, n = 3, r = Math.random) {
        const out = [], seen = new Set([t.h % 12 * 60 + t.m]);
        const add = (h, m) => {
            h = norm12(h); m = ((m % 60) + 60) % 60;
            const k = h % 12 * 60 + m;
            if (!seen.has(k) && out.length < n) { seen.add(k); out.push({ h, m }); }
        };
        if (step < 60 && t.m % 5 === 0 && t.m !== 0) add(t.m / 5, t.h * 5); // hands swapped
        const cands = step >= 60
            ? [[t.h + 1, 0], [t.h - 1, 0], [t.h + 2, 0], [t.h - 2, 0], [t.h + 3, 0]]
            : [[t.h + 1, t.m], [t.h - 1, t.m], [t.h, t.m + step], [t.h, t.m - step], [t.h + 1, t.m + step], [t.h, t.m + 2 * step]];
        shuffle(cands, r).forEach(c => add(c[0], c[1]));
        let g = 0; while (out.length < n && g++ < 80) add(ri(1, 12, r), step >= 60 ? 0 : ri(0, Math.floor(59 / step), r) * step);
        return out;
    }

    function makeQuestion(u, type, r = Math.random) {
        const t = makeTime(u.step, r), q = { type, h: t.h, m: t.m, step: u.step, unit: u.id, answer: formatTime(t.h, t.m) };
        if (type === 'read') q.options = shuffle([formatTime(t.h, t.m), ...distractors(t, u.step, 3, r).map(d => formatTime(d.h, d.m))], r);
        if (type === 'pick') {
            const clocks = shuffle([{ h: t.h, m: t.m, ok: true }, ...distractors(t, u.step, 3, r).map(d => ({ h: d.h, m: d.m, ok: false }))], r);
            q.clocks = clocks;
        }
        if (type === 'set') { q.start = { h: norm12(t.h + pick([3, 4, 5, 6], r)), m: 0 }; }
        return q;
    }

    function makeLesson(u, r = Math.random) {
        const out = []; let last = '';
        for (let i = 0; i < u.len; i++) {
            let t, g = 0; do { t = pick(u.types, r); } while (t === last && g++ < 6);
            last = t; out.push(makeQuestion(u, t, r));
        }
        return out;
    }

    /** v: formatted string (read), index (pick), {h,m} (set). */
    function isCorrect(q, v) {
        if (q.type === 'read') return v === q.answer;
        if (q.type === 'pick') return !!(q.clocks[v] && q.clocks[v].ok);
        if (q.type === 'set') return !!v && same(v, q);
        return false;
    }
    const stars = (correct, total) => { const miss = total - correct; return miss <= 0 ? 3 : miss <= 2 ? 2 : 1; };
    const passed = (correct, total) => total > 0 && correct / total >= PASS_RATIO;

    // ---- state / storage ----
    const S = { user: null, prog: { units: {}, xp: 0, streak: 0, last: '' }, idx: 0, u: null, queue: [], qi: 0, total: 0, correct: 0, run: 0, bestRun: 0, q: null, set: null, locked: false, t0: 0 };
    const $ = id => document.getElementById(id);
    const lang = () => { const l = ((window.PlatformI18n && PlatformI18n.currentLanguage) || 'es').slice(0, 2); return UI[l] ? l : 'es'; };
    const T = () => UI[lang()];
    function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function owner() {
        const u = S.user; if (!u) return 'guest';
        let pid = null; try { pid = PlatformFirestore._pid(u.uid); } catch (e) {}
        return u.uid + (pid ? '_' + pid : '');
    }
    const key = () => 'clock_prog_' + owner();
    const blank = () => ({ units: {}, xp: 0, streak: 0, last: '' });
    function load() { try { S.prog = Object.assign(blank(), JSON.parse(localStorage.getItem(key()))); } catch (e) { S.prog = blank(); } }
    function save() { try { localStorage.setItem(key(), JSON.stringify(S.prog)); } catch (e) {} }
    const dayStr = (d = new Date()) => d.toISOString().slice(0, 10);
    const unlocked = i => i === 0 || !!S.prog.units[UNITS[i - 1].id];
    const unitName = u => T().k[u.id];

    // ---- clock drawing (SVG) ----
    const NS = 'http://www.w3.org/2000/svg';
    function svgEl(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
    /** Returns an <svg> clock. mini = small face without numbers except 12/3/6/9. */
    function drawClock(h, m, mini) {
        const svg = svgEl('svg', { viewBox: '0 0 200 200', class: 'ck-face' + (mini ? ' mini' : ''), role: 'img', 'aria-label': T().clockLabel(h, m) });
        svgEl('circle', { cx: 100, cy: 100, r: 94, fill: '#fffaf0', stroke: '#c2410c', 'stroke-width': 7 }, svg);
        for (let i = 0; i < 60; i++) {
            const a = i * 6 * Math.PI / 180, big = i % 5 === 0, r1 = big ? 78 : 85;
            svgEl('line', { x1: 100 + 90 * Math.sin(a), y1: 100 - 90 * Math.cos(a), x2: 100 + r1 * Math.sin(a), y2: 100 - r1 * Math.cos(a), stroke: '#7c2d12', 'stroke-width': big ? 3.5 : 1.5, 'stroke-linecap': 'round' }, svg);
        }
        for (let n = 1; n <= 12; n++) {
            if (mini && n % 3) continue;
            const a = n * 30 * Math.PI / 180, tx = svgEl('text', { x: 100 + 64 * Math.sin(a), y: 100 - 64 * Math.cos(a) + (mini ? 7 : 8), 'text-anchor': 'middle', 'font-size': mini ? 22 : 20, 'font-weight': 800, fill: '#431407', 'font-family': 'sans-serif' }, svg);
            tx.textContent = n;
        }
        const ang = handAngles(h, m);
        svgEl('line', { x1: 100, y1: 100, x2: 100, y2: 56, stroke: '#1f2937', 'stroke-width': 9, 'stroke-linecap': 'round', transform: `rotate(${ang.hour} 100 100)`, class: 'ck-hand-h' }, svg);
        svgEl('line', { x1: 100, y1: 108, x2: 100, y2: 26, stroke: '#dc2626', 'stroke-width': 5, 'stroke-linecap': 'round', transform: `rotate(${ang.minute} 100 100)`, class: 'ck-hand-m' }, svg);
        svgEl('circle', { cx: 100, cy: 100, r: 7, fill: '#1f2937' }, svg);
        return svg;
    }

    // ---- home ----
    function show(id) { ['ck-home', 'ck-play', 'ck-end'].forEach(s => { $(s).hidden = s !== id; }); window.scrollTo(0, 0); }
    function renderHome() {
        const t = T();
        $('ck-h1').textContent = t.title; $('ck-sub').textContent = t.sub;
        const st = $('ck-stats'); st.textContent = '';
        st.appendChild(el('span', 'ck-pill', `🔥 ${S.prog.streak || 0}`)); st.appendChild(el('span', 'ck-pill', `⚡ ${S.prog.xp || 0} ${t.xp}`));
        const path = $('ck-path'); path.textContent = '';
        let current = UNITS.findIndex(u => !S.prog.units[u.id]); if (current < 0) current = UNITS.length - 1;
        UNITS.forEach((u, i) => {
            const li = el('li', 'ck-node'), done = S.prog.units[u.id], open = unlocked(i);
            const b = el('button', 'ck-dot' + (done ? ' done' : '') + (!open ? ' locked' : '') + (open && i === current ? ' current' : ''), open ? u.icon : '🔒');
            b.type = 'button'; b.dataset.unit = u.id;
            b.setAttribute('aria-label', `${t.lesson} ${i + 1}: ${unitName(u)}${open ? '' : '. ' + t.locked}`);
            if (open) b.onclick = () => start(i); else b.disabled = true;
            const info = el('div', 'ck-info'); info.appendChild(el('b', null, `${t.lesson} ${i + 1}`)); info.appendChild(el('span', null, unitName(u)));
            if (done) info.appendChild(el('div', 'ck-stars', '★'.repeat(done.stars) + '☆'.repeat(3 - done.stars)));
            li.appendChild(b); li.appendChild(info); path.appendChild(li);
        });
    }

    // ---- lesson ----
    function start(i) {
        S.idx = i; S.u = UNITS[i]; S.queue = makeLesson(S.u); S.total = S.queue.length; S.qi = 0; S.correct = 0; S.run = 0; S.bestRun = 0; S.t0 = Date.now();
        show('ck-play'); next();
    }
    function bar() { const p = Math.round(S.qi / S.total * 100); $('ck-barfill').style.width = p + '%'; $('ck-barfill').parentNode.setAttribute('aria-valuenow', p); $('ck-count').textContent = `${Math.min(S.qi + 1, S.total)} / ${S.total}`; }

    function next() {
        $('ck-feedback').hidden = true; S.locked = false;
        if (S.qi >= S.total) return finish();
        S.q = S.queue[S.qi]; bar();
        const t = T(), q = S.q, card = $('ck-card'); card.textContent = ''; card.classList.remove('ck-shake');
        const ts = formatTime(q.h, q.m);
        if (q.type === 'read') {
            card.appendChild(el('p', 'ck-prompt', t.qRead));
            const w = el('div', 'ck-clockwrap'); w.appendChild(drawClock(q.h, q.m)); card.appendChild(w);
            options(card, q.options.map(v => ({ label: v, v })));
        } else if (q.type === 'pick') {
            card.appendChild(el('p', 'ck-prompt', t.qPick(ts)));
            card.appendChild(el('div', 'ck-big', ts));
            const box = el('div', 'ck-opts ck-clocks'); box.setAttribute('role', 'group');
            q.clocks.forEach((c, i) => { const b = el('button', 'ck-opt ck-clockbtn'); b.type = 'button'; b.appendChild(drawClock(c.h, c.m, true)); b.onclick = () => answer(i, b); box.appendChild(b); });
            card.appendChild(box);
        } else {
            card.appendChild(el('p', 'ck-prompt', t.qSet(ts)));
            card.appendChild(el('div', 'ck-big', ts));
            S.set = { h: q.start.h, m: q.start.m };
            const w = el('div', 'ck-clockwrap'); w.id = 'ck-setclock'; w.appendChild(drawClock(S.set.h, S.set.m)); card.appendChild(w);
            const ctl = el('div', 'ck-ctl');
            ctl.appendChild(stepper(t.hour, 'h', 1, true));
            if (q.step < 60) ctl.appendChild(stepper(t.minute, 'm', q.step, false));
            card.appendChild(ctl);
            const ok = el('button', 'ck-btn', t.check); ok.type = 'button'; ok.id = 'ck-check'; ok.onclick = () => answer(S.set, ok); card.appendChild(ok);
        }
    }

    function options(card, list) {
        const box = el('div', 'ck-opts'); box.setAttribute('role', 'group');
        list.forEach(o => { const b = el('button', 'ck-opt', o.label); b.type = 'button'; b.onclick = () => answer(o.v, b); box.appendChild(b); });
        card.appendChild(box);
    }

    function stepper(label, what, step, hour) {
        const t = T(), w = el('div', 'ck-step'); w.appendChild(el('span', 'ck-steplabel', label));
        const row = el('div', 'ck-steprow');
        const mk = (sym, dir, aria) => { const b = el('button', 'ck-key', sym); b.type = 'button'; b.setAttribute('aria-label', `${label} ${aria}`); b.onclick = () => adjust(what, dir * step); return b; };
        row.appendChild(mk('−', -1, t.minus));
        const val = el('span', 'ck-stepval'); val.id = 'ck-val-' + what; val.setAttribute('aria-live', 'polite'); row.appendChild(val);
        row.appendChild(mk('+', 1, t.plus));
        w.appendChild(row); setTimeout(refreshSet, 0); return w;
    }
    function adjust(what, d) {
        if (S.locked || !S.set) return;
        if (what === 'h') S.set.h = norm12(S.set.h + d); else S.set.m = ((S.set.m + d) % 60 + 60) % 60;
        refreshSet();
    }
    function refreshSet() {
        const w = $('ck-setclock'); if (!w || !S.set) return;
        w.textContent = ''; w.appendChild(drawClock(S.set.h, S.set.m));
        const vh = $('ck-val-h'), vm = $('ck-val-m');
        if (vh) vh.textContent = S.set.h; if (vm) vm.textContent = pad2(S.set.m);
    }

    function answer(v, btn) {
        if (S.locked) return; S.locked = true;
        const q = S.q, ok = isCorrect(q, v), t = T(), fb = $('ck-feedback');
        document.querySelectorAll('.ck-opt, .ck-key, #ck-check').forEach(b => { b.disabled = true; });
        if (btn) btn.classList.add(ok ? 'ok' : 'bad');
        if (q.type === 'pick') { const rightIdx = q.clocks.findIndex(c => c.ok), bs = document.querySelectorAll('.ck-clockbtn'); if (bs[rightIdx]) bs[rightIdx].classList.add('ok'); }
        if (ok) { S.correct++; S.run++; S.bestRun = Math.max(S.bestRun, S.run); } else S.run = 0;
        fb.hidden = false; fb.textContent = ''; fb.className = 'ck-feedback ' + (ok ? 'good' : 'bad');
        const txt = el('div'); txt.appendChild(el('b', null, ok ? pick(t.good) : t.bad));
        if (!ok) txt.appendChild(el('span', null, formatTime(q.h, q.m)));
        const go = el('button', 'ck-btn', t.next); go.type = 'button'; go.id = 'ck-continue'; go.onclick = () => { S.qi++; next(); };
        fb.appendChild(txt); fb.appendChild(go); go.focus();
        if (!ok) { $('ck-card').classList.add('ck-shake'); if (navigator.vibrate) { try { navigator.vibrate(120); } catch (e) {} } }
    }

    async function finish() {
        const t = T(), won = passed(S.correct, S.total), st = stars(S.correct, S.total);
        $('ck-trophy').textContent = won ? (st === 3 ? '🏆' : '⭐') : '🔄';
        $('ck-endtitle').textContent = won ? t.done : t.fail;
        $('ck-endtext').textContent = t.score(S.correct, S.total);
        $('ck-endstars').textContent = won ? '★'.repeat(st) + '☆'.repeat(3 - st) : '';
        $('ck-next').textContent = won ? (S.idx < UNITS.length - 1 ? t.nextL : t.back) : t.again;
        $('ck-next').onclick = () => { if (won && S.idx < UNITS.length - 1) start(S.idx + 1); else if (won) { renderHome(); show('ck-home'); } else start(S.idx); };
        $('ck-back').textContent = t.back; $('ck-back').onclick = () => { renderHome(); show('ck-home'); };
        show('ck-end');
        if (!won) return;
        const prev = S.prog.units[S.u.id];
        S.prog.units[S.u.id] = { stars: Math.max(st, prev ? prev.stars : 0) };
        S.prog.xp = (S.prog.xp || 0) + 10 + st * 5;
        const today = dayStr(), y = dayStr(new Date(Date.now() - 864e5));
        if (S.prog.last !== today) { S.prog.streak = S.prog.last === y ? (S.prog.streak || 0) + 1 : 1; S.prog.last = today; }
        save();
        if (S.user && typeof PlatformFirestore !== 'undefined') {
            try {
                await PlatformFirestore.updateGameStats(S.user.uid, 'clock', {
                    correctAnswers: S.correct, totalQuestions: S.total, totalAttempts: S.total, bestStreak: S.bestRun,
                    elapsedSeconds: Math.round((Date.now() - S.t0) / 1000), level: S.idx + 1, operation: S.u.id });
            } catch (e) { console.warn('[ClockLab] stats not saved', e); }
        }
    }

    function init() {
        $('ck-quit').onclick = () => { renderHome(); show('ck-home'); };
        document.addEventListener('keydown', e => {
            if ($('ck-play').hidden) return;
            const c = $('ck-continue'), fbOpen = !$('ck-feedback').hidden;
            if (e.key === 'Enter') {
                if (fbOpen && c) { e.preventDefault(); c.click(); }
                else if (S.q && S.q.type === 'set') { e.preventDefault(); answer(S.set, $('ck-check')); }
                return;
            }
            if (fbOpen || !S.q) return;
            if (S.q.type === 'set') {
                const m = { ArrowUp: ['h', 1], ArrowDown: ['h', -1], ArrowRight: ['m', S.q.step], ArrowLeft: ['m', -S.q.step] }[e.key];
                if (m && !(m[0] === 'm' && S.q.step >= 60)) { e.preventDefault(); adjust(m[0], m[1]); }
            } else if (/^[1-4]$/.test(e.key)) {
                const bs = document.querySelectorAll('#ck-card .ck-opt'), b = bs[Number(e.key) - 1]; if (b) b.click();
            }
        });
        load(); renderHome(); show('ck-home');
        if (window.PlatformAuth && PlatformAuth.onAuthStateChanged) PlatformAuth.onAuthStateChanged(u => { S.user = u || null; load(); renderHome(); });
        window.addEventListener('platformLanguageChanged', () => { if (!$('ck-home').hidden) renderHome(); });
    }

    const api = { init, state: S, UNITS, formatTime, handAngles, norm12, makeTime, distractors, makeQuestion, makeLesson, isCorrect, stars, passed };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    return api;
})();
