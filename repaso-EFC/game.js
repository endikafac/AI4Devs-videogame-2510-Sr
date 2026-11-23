/* Repaso Diario - daily spaced repetition (Leitner boxes via PlatformSRS) */
const Repaso = (() => {
    'use strict';

    const SRS = (typeof PlatformSRS !== 'undefined') ? PlatformSRS
        : (typeof require === 'function' ? require('../platform/srs.js') : null);
    const SESSION = 12, NEW_PER_DECK = 5, SHORT_MAX = 12;
    const LANGS = ['es', 'en', 'eu', 'gl', 'ca', 'fr'];

    // ---- UI strings: es, en, eu, gl, ca, fr ----
    const L = (es, en, eu, gl, ca, fr) => ({ es, en, eu, gl, ca, fr });
    const UI = {
        title: L('Repaso Diario', 'Daily Review', 'Eguneroko errepasoa', 'Repaso diario', 'Repàs diari', 'Révision du jour'),
        todayDue: L('Hoy toca repasar', 'To review today', 'Gaur errepasatzeko', 'Hoxe toca repasar', 'Avui toca repassar', 'À réviser aujourd\'hui'),
        cardsWord: L('tarjetas', 'cards', 'txartel', 'tarxetas', 'targetes', 'cartes'),
        allDone: L('Todo al día. Puedes aprender cosas nuevas.', 'All caught up. You can learn something new.', 'Dena egunean. Gauza berriak ikas ditzakezu.', 'Todo ao día. Podes aprender cousas novas.', 'Tot al dia. Pots aprendre coses noves.', 'Tout est à jour. Tu peux apprendre du nouveau.'),
        dueHint: L('Unos minutos al día valen más que una hora de golpe.', 'A few minutes a day beat one long hour.', 'Egunero minutu batzuk ordu bat batera baino hobeak dira.', 'Uns minutos ao día valen máis ca unha hora de golpe.', 'Uns minuts al dia valen més que una hora de cop.', 'Quelques minutes par jour valent mieux qu\'une heure d\'un coup.'),
        practice: L('Practicar ahora', 'Practise now', 'Praktikatu orain', 'Practicar agora', 'Practicar ara', 'S\'entraîner'),
        learnNew: L('Aprender algo nuevo', 'Learn something new', 'Ikasi berria', 'Aprender algo novo', 'Aprendre alguna cosa nova', 'Apprendre du nouveau'),
        noDecks: L('Aún no hay mazos disponibles.', 'No decks available yet.', 'Oraindik ez dago sorta erabilgarririk.', 'Aínda non hai mazos dispoñibles.', 'Encara no hi ha mazos disponibles.', 'Aucun paquet disponible pour l\'instant.'),
        mastered: L('dominadas', 'mastered', 'menderatuak', 'dominadas', 'dominades', 'maîtrisées'),
        due: L('para repasar', 'due', 'errepasatzeko', 'para repasar', 'per repassar', 'à réviser'),
        fresh: L('nuevas', 'new', 'berriak', 'novas', 'noves', 'nouvelles'),
        study: L('Estudiar', 'Study', 'Aztertu', 'Estudar', 'Estudiar', 'Étudier'),
        practiceDeck: L('Practicar', 'Practise', 'Praktikatu', 'Practicar', 'Practicar', 'S\'entraîner'),
        streak: L('días seguidos', 'day streak', 'egun segidan', 'días seguidos', 'dies seguits', 'jours de suite'),
        quit: L('Salir', 'Exit', 'Irten', 'Saír', 'Sortir', 'Quitter'),
        flip: L('Toca para ver la respuesta', 'Tap to see the answer', 'Sakatu erantzuna ikusteko', 'Toca para ver a resposta', 'Toca per veure la resposta', 'Touche pour voir la réponse'),
        knew: L('Lo sabía', 'I knew it', 'Banekien', 'Sabíao', 'Ho sabia', 'Je le savais'),
        didnt: L('No lo sabía', 'I didn\'t know', 'Ez nekien', 'Non o sabía', 'No ho sabia', 'Je ne le savais pas'),
        kindFlash: L('Recuerda', 'Remember', 'Gogoratu', 'Lembra', 'Recorda', 'Souviens-toi'),
        kindChoice: L('Elige la respuesta', 'Choose the answer', 'Aukeratu erantzuna', 'Escolle a resposta', 'Tria la resposta', 'Choisis la réponse'),
        kindType: L('Escríbela', 'Type it', 'Idatzi', 'Escríbea', 'Escriu-la', 'Écris-la'),
        typePh: L('Tu respuesta', 'Your answer', 'Zure erantzuna', 'A túa resposta', 'La teva resposta', 'Ta réponse'),
        check: L('Comprobar', 'Check', 'Egiaztatu', 'Comprobar', 'Comprovar', 'Vérifier'),
        right: L('¡Correcto!', 'Correct!', 'Zuzena!', 'Correcto!', 'Correcte!', 'Correct !'),
        wrong: L('Casi. La respuesta es:', 'Not quite. The answer is:', 'Ia-ia. Erantzuna hau da:', 'Case. A resposta é:', 'Gairebé. La resposta és:', 'Presque. La réponse est :'),
        cont: L('Continuar', 'Continue', 'Jarraitu', 'Continuar', 'Continua', 'Continuer'),
        endGreat: L('¡Sesión completada!', 'Session complete!', 'Saioa osatu da!', 'Sesión completada!', 'Sessió completada!', 'Séance terminée !'),
        endRight: L('Aciertos', 'Right', 'Asmatuak', 'Acertos', 'Encerts', 'Réussies'),
        endWrong: L('Fallos', 'Wrong', 'Akatsak', 'Fallos', 'Errades', 'Ratées'),
        endBoxes: L('Cajas subidas', 'Boxes up', 'Igotako kutxak', 'Caixas subidas', 'Caixes pujades', 'Boîtes montées'),
        mistakes: L('Para recordar', 'To remember', 'Gogoratzeko', 'Para lembrar', 'Per recordar', 'À retenir'),
        keepGoing: L('Seguir', 'Keep going', 'Jarraitu', 'Seguir', 'Continuar', 'Continuer'),
        back: L('Volver', 'Back', 'Itzuli', 'Volver', 'Tornar', 'Retour'),
        prev: L('Anterior', 'Previous', 'Aurrekoa', 'Anterior', 'Anterior', 'Précédent'),
        next: L('Siguiente', 'Next', 'Hurrengoa', 'Seguinte', 'Següent', 'Suivant'),
        studyHint: L('Toca la tarjeta o pulsa Espacio para darle la vuelta', 'Tap the card or press Space to flip it', 'Sakatu txartela edo Zuriunea buelta emateko', 'Toca a tarxeta ou preme Espazo para darlle a volta', 'Toca la targeta o prem Espai per girar-la', 'Touche la carte ou appuie sur Espace pour la retourner')
    };

    // ---- pure helpers ----
    function resolveText(t, lang) {
        if (t == null) return '';
        if (typeof t !== 'object') return String(t);
        const l = (lang || 'en').slice(0, 2);
        const v = t[l] || t.en || t.es;
        if (v != null && v !== '') return String(v);
        for (const k in t) if (t[k] != null && t[k] !== '') return String(t[k]);
        return '';
    }

    function normalize(s) {
        let x = String(s == null ? '' : s).toLowerCase();
        try { x = x.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) { /* old engines */ }
        x = x.replace(/(\d),(\d)/g, '$1.$2').replace(/\s+/g, ' ').trim();
        return x.replace(/^[.,;:!?¿¡"'`\s]+|[.,;:!?¿¡"'`\s]+$/g, '');
    }

    // answer: a card (uses card.a) or a text; only card.a is accepted
    function checkTyped(input, answer, lang) {
        const a = (answer && typeof answer === 'object' && 'a' in answer) ? answer.a : answer;
        const n = normalize(input);
        return n !== '' && n === normalize(resolveText(a, lang));
    }

    function isTypable(card, lang) {
        const a = resolveText(card.a, lang).trim();
        return a.length > 0 && a.length <= SHORT_MAX && !/[.!?;:]\s*$/.test(a) && a.split(/\s+/).length <= 2;
    }

    function shuffle(arr, rnd) {
        rnd = rnd || Math.random;
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
        return a;
    }

    // 4 unique options (texts) including the correct one, shuffled. Fewer than 4 means: not enough distractors.
    function makeOptions(deck, card, rnd, lang) {
        const correct = resolveText(card.a, lang);
        const seen = new Set([normalize(correct)]);
        const pool = [];
        const add = txt => { const n = normalize(txt); if (n && !seen.has(n)) { seen.add(n); pool.push(txt); } };
        shuffle(card.opts || [], rnd).forEach(o => add(resolveText(o, lang)));
        if (pool.length < 3) shuffle((deck.cards || []).filter(c => c.id !== card.id), rnd).forEach(c => add(resolveText(c.a, lang)));
        return shuffle([correct].concat(pool.slice(0, 3)), rnd);
    }

    // decks: [{id, cards}], cardsState: {deckId: {cardId: srsState}}, opts: {limit, newPerDeck, deckId, rnd}
    function makeSession(decks, cardsState, opts, now) {
        opts = opts || {};
        now = now || Date.now();
        const limit = opts.limit || SESSION, newMax = opts.newPerDeck == null ? NEW_PER_DECK : opts.newPerDeck;
        const list = (decks || []).filter(d => !opts.deckId || d.id === opts.deckId);
        const due = [], fresh = [];
        list.forEach(d => {
            const st = (cardsState && cardsState[d.id]) || {};
            const ids = d.cards.map(c => c.id);
            const picked = SRS.pick(ids, st, ids.length, newMax, now);
            picked.forEach(id => {
                const item = { deckId: d.id, cardId: id };
                if (st[id]) { item.box = st[id].box; item.due = st[id].due; due.push(item); } else fresh.push(item);
            });
        });
        due.sort((a, b) => a.box - b.box || a.due - b.due);
        let out = due.slice(0, limit).map(i => ({ deckId: i.deckId, cardId: i.cardId }));
        if (out.length < limit) {
            // round-robin new cards across decks, max newMax per deck
            const per = {}, byDeck = {};
            fresh.forEach(i => { (byDeck[i.deckId] = byDeck[i.deckId] || []).push(i); });
            const ids = Object.keys(byDeck);
            let more = true;
            while (out.length < limit && more) {
                more = false;
                for (const k of ids) {
                    if (out.length >= limit) break;
                    per[k] = per[k] || 0;
                    if (per[k] < newMax && byDeck[k].length) { const i = byDeck[k].shift(); per[k]++; out.push({ deckId: i.deckId, cardId: i.cardId }); more = true; }
                }
            }
        }
        return opts.rnd ? shuffle(out, opts.rnd) : out;
    }

    // form by box: new -> flash, low boxes -> choice, high boxes -> typing (short answers only)
    function formFor(state, card, deck, lang) {
        const box = state ? state.box : 0, typable = isTypable(card, lang);
        let f;
        if (!state) f = 'flash';
        else if (box <= 2) f = 'choice';
        else if (box === 3) f = typable ? 'type' : 'choice';
        else f = typable ? 'type' : 'flash';
        if (f === 'choice' && makeOptions(deck, card, null, lang).length < 4) f = 'flash';
        return f;
    }

    // ---- DOM / state ----
    const S = { user: null, decks: [], stores: {}, meta: { streak: 0, last: '', best: 0, done: 0 }, run: null, study: null, screen: 'home', lastScope: null };
    const $ = id => document.getElementById(id);
    const lang = () => { const l = ((window.PlatformI18n && PlatformI18n.currentLanguage) || 'es').slice(0, 2); return LANGS.indexOf(l) >= 0 ? l : 'es'; };
    const t = k => resolveText(UI[k], lang());
    const tx = v => resolveText(v, lang());
    function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function owner() {
        const u = S.user; if (!u) return 'guest';
        let pid = null; try { pid = PlatformFirestore._pid(u.uid); } catch (e) { /* no profile */ }
        return u.uid + (pid ? '_' + pid : '');
    }
    const storeKey = deckId => 'repaso_' + deckId + '_' + owner();
    const metaKey = () => 'repaso_meta_' + owner();
    const dayStr = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

    function loadAll() {
        S.decks = (window.RepasoDecks || []).filter(d => d && d.id && Array.isArray(d.cards) && d.cards.length);
        S.stores = {};
        S.decks.forEach(d => { S.stores[d.id] = SRS.store(storeKey(d.id)); });
        try { S.meta = Object.assign({ streak: 0, last: '', best: 0, done: 0 }, JSON.parse(localStorage.getItem(metaKey()))); } catch (e) { S.meta = { streak: 0, last: '', best: 0, done: 0 }; }
    }
    function saveMeta() { try { localStorage.setItem(metaKey(), JSON.stringify(S.meta)); } catch (e) { /* storage full */ } }
    const states = () => { const o = {}; S.decks.forEach(d => { o[d.id] = S.stores[d.id].all(); }); return o; };
    const deckById = id => S.decks.find(d => d.id === id);
    const cardById = (d, id) => d.cards.find(c => c.id === id);
    function liveStreak() {
        const y = dayStr(new Date(Date.now() - 864e5));
        return (S.meta.last === dayStr() || S.meta.last === y) ? S.meta.streak : 0;
    }

    // ---- daily goal: cards reviewed today (own fields in the meta record) ----
    const GOAL = 12;
    const goalDone = () => (S.meta.goalDay === dayStr() ? (S.meta.goalN || 0) : 0);
    function bumpGoal() {
        const d = dayStr(); if (S.meta.goalDay !== d) { S.meta.goalDay = d; S.meta.goalN = 0; }
        const before = S.meta.goalN || 0; S.meta.goalN = before + 1; saveMeta();
        return before < GOAL && S.meta.goalN >= GOAL;
    }
    function goalBox(size) {
        const box = el('div', 'rp-goal'), rg = Dyn.ring(size, Math.round(size / 8), '#22c55e'), n = Math.min(goalDone(), GOAL);
        rg.set(n / GOAL, n + '/' + GOAL, Dyn.t('goal') + ': ' + n + '/' + GOAL); box.appendChild(rg.el);
        const tx = el('div', 'rp-goaltx'); tx.appendChild(el('b', '', Dyn.t('goal'))); tx.appendChild(el('span', '', n >= GOAL ? Dyn.t('goalDone') : n + ' / ' + GOAL + ' ' + t('cardsWord')));
        box.appendChild(tx); return box;
    }
    function showHelp() {
        const cur = S.run && S.run.cur; let txt = Dyn.t('rpHelpFlash');
        if (cur && cur.form !== 'flash') { const a = tx(cur.card.a).trim(); txt = Dyn.t('hintStarts', { c: a.charAt(0).toUpperCase(), n: a.replace(/\s+/g, '').length }); }
        Dyn.sheet(Dyn.t('help'), txt);
    }
    /** Swipe a revealed flash card: right = knew it, left = not yet. The card tilts with the finger. */
    function attachSwipe(card) {
        card.classList.add('rp-swipe');
        const yes = el('span', 'rp-stamp yes', t('knew')), no = el('span', 'rp-stamp no', t('didnt')); card.appendChild(yes); card.appendChild(no);
        let sx = 0, id = null, dx = 0, drag = false;
        card.onpointerdown = e => { if (e.target.closest && e.target.closest('button')) return; sx = e.clientX; id = e.pointerId; dx = 0; drag = true; card.style.transition = 'none'; try { card.setPointerCapture(id); } catch (x) { /* ignore */ } };
        card.onpointermove = e => {
            if (!drag || e.pointerId !== id) return; dx = e.clientX - sx;
            card.style.transform = 'translateX(' + dx + 'px) rotate(' + (dx * .06).toFixed(1) + 'deg)';
            yes.style.opacity = Math.max(0, Math.min(1, dx / 90)); no.style.opacity = Math.max(0, Math.min(1, -dx / 90));
        };
        const end = () => {
            if (!drag) return; drag = false; try { card.releasePointerCapture(id); } catch (x) { /* ignore */ }
            const cur = S.run && S.run.cur;
            if (Math.abs(dx) > 90 && cur && !cur.locked) {
                const ok = dx > 0;
                if (Dyn.reduced()) { answer(ok); return; }
                card.style.transition = 'transform .22s ease-in, opacity .22s'; card.style.transform = 'translateX(' + (ok ? 560 : -560) + 'px) rotate(' + (ok ? 24 : -24) + 'deg)'; card.style.opacity = '0';
                setTimeout(() => answer(ok), 200);
            } else { card.style.transition = 'transform .2s'; card.style.transform = ''; yes.style.opacity = 0; no.style.opacity = 0; }
        };
        card.onpointerup = end; card.onpointercancel = end;
    }

    function show(id) {
        ['rp-home', 'rp-play', 'rp-study', 'rp-end'].forEach(s => { $(s).hidden = s !== id; });
        S.screen = id; window.scrollTo(0, 0);
    }

    // ---- home ----
    function renderHome() {
        document.documentElement.lang = lang();
        $('rp-h1').textContent = t('title');
        const st = $('rp-stats'); st.textContent = '';
        st.appendChild(el('span', 'rp-pill', '🔥 ' + liveStreak() + ' ' + t('streak'))); Dyn.sound(st);

        const all = states(), now = Date.now();
        let due = 0, fresh = 0;
        const sums = {};
        S.decks.forEach(d => { const s = SRS.summary(d.cards.map(c => c.id), all[d.id], now); sums[d.id] = s; due += s.due; fresh += s.fresh; });
        const plan = $('rp-plan'); plan.textContent = '';
        if (!S.decks.length) { plan.appendChild(el('p', '', t('noDecks'))); }
        else {
            const n = makeSession(S.decks, all, {}, now).length;
            plan.appendChild(goalBox(76));
            plan.appendChild(el('div', 'rp-hint', t('todayDue')));
            plan.appendChild(el('div', 'big', String(due) + ' ' + t('cardsWord')));
            plan.appendChild(el('p', '', due > 0 ? t('dueHint') : t('allDone')));
            const b = el('button', 'rp-btn main', due > 0 ? t('practice') : t('learnNew'));
            b.type = 'button'; b.id = 'rp-go'; b.disabled = n === 0;
            b.onclick = () => startSession(null);
            plan.appendChild(b);
        }
        const grid = $('rp-decks'); grid.textContent = '';
        S.decks.forEach(d => {
            const s = sums[d.id];
            const card = el('div', 'rp-deck');
            const h = el('h3'); h.appendChild(el('span', 'ic', d.icon || '📚')); h.appendChild(document.createTextNode(tx(d.title)));
            card.appendChild(h);
            if (d.desc) card.appendChild(el('p', 'desc', tx(d.desc)));
            const bar = el('div', 'rp-prog'); bar.setAttribute('role', 'progressbar');
            const pct = Math.round(100 * s.mastered / s.total);
            bar.setAttribute('aria-valuenow', pct); bar.setAttribute('aria-valuemin', 0); bar.setAttribute('aria-valuemax', 100);
            const fill = el('i'); fill.style.width = pct + '%'; bar.appendChild(fill); card.appendChild(bar);
            const meta = el('div', 'rp-meta');
            [[s.mastered + '/' + s.total, t('mastered')], [s.due, t('due')], [s.fresh, t('fresh')]].forEach(([n, l]) => {
                const sp = el('span'); sp.appendChild(el('b', '', String(n))); sp.appendChild(document.createTextNode(' ' + l)); meta.appendChild(sp);
            });
            card.appendChild(meta);
            const btns = el('div', 'rp-deckbtns');
            const go = el('button', 'go', t('practiceDeck')); go.type = 'button'; go.onclick = () => startSession(d.id);
            const stu = el('button', '', t('study')); stu.type = 'button'; stu.onclick = () => startStudy(d.id);
            btns.appendChild(go); btns.appendChild(stu); card.appendChild(btns);
            grid.appendChild(card);
        });
    }

    // ---- session ----
    function startSession(deckId) {
        S.lastScope = deckId;
        const items = makeSession(S.decks, states(), { deckId: deckId || undefined });
        if (!items.length) { renderHome(); show('rp-home'); return; }
        S.run = { queue: items.map(i => Object.assign({}, i, { retry: false })), total: items.length, answered: 0, right: 0, wrong: 0, boxesUp: 0,
            requeued: {}, mistakes: [], cur: null, t0: Date.now(), best: 0, streak: 0 };
        show('rp-play');
        nextCard();
    }

    function progress() {
        const r = S.run, done = r.answered, left = r.queue.length;
        $('rp-barfill').style.width = Math.round(100 * done / Math.max(1, done + left + (r.cur ? 1 : 0))) + '%';
        $('rp-count').textContent = Math.min(done + 1, done + left + (r.cur ? 1 : 0)) + '/' + (done + left + (r.cur ? 1 : 0));
        if (S.hud) { S.hud.setStreak(r.streak); S.hud.setPoints(r.right); }
        if (S.goalRing) { const n = Math.min(goalDone(), GOAL); S.goalRing.set(n / GOAL, '', Dyn.t('goal') + ': ' + n + '/' + GOAL); }
    }

    function nextCard() {
        const r = S.run;
        $('rp-feedback').hidden = true;
        const item = r.queue.shift();
        if (!item) { r.cur = null; return endSession(); }
        const d = deckById(item.deckId), c = cardById(d, item.cardId);
        const state = S.stores[d.id].all()[c.id];
        const form = formFor(state, c, d, lang());
        r.cur = { item, deck: d, card: c, form, state, revealed: false, locked: false, opts: null };
        if (form === 'choice') r.cur.opts = makeOptions(d, c, null, lang());
        renderCard();
    }

    function renderCard() {
        const r = S.run, cur = r.cur; if (!cur) return;
        const card = $('rp-card'); card.textContent = '';
        card.style.transform = ''; card.style.opacity = ''; card.style.transition = ''; card.classList.remove('rp-swipe', 'dy-done'); card.onpointerdown = card.onpointermove = card.onpointerup = card.onpointercancel = null;
        $('rp-quit').setAttribute('aria-label', t('quit'));
        progress();
        if (!cur.shown) { cur.shown = true; Dyn.slide(card); }
        const tot = r.answered + r.queue.length + 1;
        card.appendChild(Dyn.zone(Dyn.t('q', { n: Math.min(r.answered + 1, tot), m: tot }), 'q'));
        const kind = { flash: 'kindFlash', choice: 'kindChoice', type: 'kindType' }[cur.form];
        card.appendChild(el('p', 'rp-kind dy-zone', cur.deck.icon + ' ' + t(kind)));
        card.appendChild(el('div', 'rp-q', tx(cur.card.q)));
        if (cur.card.tag) card.appendChild(el('div', 'rp-tag', cur.card.tag));
        const correct = tx(cur.card.a);
        if (cur.form === 'flash') {
            if (!cur.revealed) {
                const b = el('button', 'rp-btn main', t('flip')); b.type = 'button'; b.id = 'rp-flip'; b.onclick = flip; card.appendChild(b);
            } else {
                card.appendChild(el('div', 'rp-a', correct));
                const row = el('div', 'rp-row');
                const no = el('button', 'rp-btn bad', '← ' + t('didnt')); no.type = 'button'; no.onclick = () => answer(false);
                const yes = el('button', 'rp-btn good', t('knew') + ' →'); yes.type = 'button'; yes.onclick = () => answer(true);
                row.appendChild(no); row.appendChild(yes); card.appendChild(Dyn.zone('swipeHint')); card.appendChild(row); attachSwipe(card);
            }
        } else if (cur.form === 'choice') {
            const box = el('div', 'rp-opts');
            cur.opts.forEach((o, i) => {
                const b = el('button', 'rp-opt'); b.type = 'button'; b.dataset.i = i;
                b.appendChild(el('kbd', '', String(i + 1))); b.appendChild(el('span', '', o));
                b.onclick = () => pickOption(i); box.appendChild(b);
            });
            card.appendChild(Dyn.zone('choose')); card.appendChild(box); Dyn.style(box, { sel: '.rp-opt', fill: false });
        } else {
            const inp = el('input', 'rp-input'); inp.type = 'text'; inp.id = 'rp-typed'; inp.placeholder = t('typePh');
            inp.autocomplete = 'off'; inp.autocapitalize = 'off'; inp.spellcheck = false; inp.setAttribute('aria-label', t('typePh'));
            card.appendChild(Dyn.zone('write')); card.appendChild(inp);
            const b = el('button', 'rp-btn main', t('check')); b.type = 'button'; b.id = 'rp-check'; b.onclick = submitTyped; card.appendChild(b);
            setTimeout(() => { try { inp.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, 0);
        }
    }

    function flip() {
        const cur = S.run && S.run.cur; if (!cur || cur.form !== 'flash' || cur.revealed) return; cur.revealed = true; renderCard();
        const c = $('rp-card'); c.classList.remove('flipin'); void c.offsetWidth; c.classList.add('flipin'); setTimeout(() => c.classList.remove('flipin'), 450);
    }

    function pickOption(i) {
        const cur = S.run.cur; if (!cur || cur.locked) return;
        const ok = normalize(cur.opts[i]) === normalize(tx(cur.card.a));
        document.querySelectorAll('#rp-card .rp-opt').forEach((b, k) => {
            b.disabled = true;
            if (normalize(cur.opts[k]) === normalize(tx(cur.card.a))) b.classList.add('right');
            else if (k === i) b.classList.add('wrong');
        });
        answer(ok);
    }

    function submitTyped() {
        const cur = S.run.cur; if (!cur || cur.locked) return;
        const v = $('rp-typed').value;
        if (!v.trim()) return;
        $('rp-typed').disabled = true;
        answer(checkTyped(v, cur.card, lang()));
    }

    function answer(ok) {
        const r = S.run, cur = r.cur; if (!cur || cur.locked) return;
        cur.locked = true;
        let goalHit = false;
        if (!cur.item.retry) {
            goalHit = bumpGoal();
            const before = cur.state ? cur.state.box : -1;
            const after = S.stores[cur.deck.id].answer(cur.card.id, ok);
            if (ok && after.box > Math.max(before, 0)) r.boxesUp++;
            r.answered++;
            if (ok) { r.right++; r.streak++; r.best = Math.max(r.best, r.streak); }
            else { r.wrong++; r.streak = 0; r.mistakes.push({ q: tx(cur.card.q), a: tx(cur.card.a) }); }
            if (!ok && !r.requeued[cur.deck.id + '/' + cur.card.id]) {
                r.requeued[cur.deck.id + '/' + cur.card.id] = true;
                r.queue.push({ deckId: cur.deck.id, cardId: cur.card.id, retry: true });
            }
        } else r.answered++;
        const tgt = document.querySelector('#rp-card .rp-opt.' + (ok ? 'right' : 'wrong')) || $('rp-typed') || $('rp-card');
        $('rp-card').classList.add('dy-done');
        if (ok) Dyn.good(tgt, r.streak, cur.form === 'flash'); else Dyn.bad(tgt, cur.form === 'flash');
        if (goalHit) { Dyn.big($('rp-card')); try { Juice.floatText((window.innerWidth || 400) / 2, 140, Dyn.t('goalDone')); } catch (e) { /* ignore */ } }
        const fb = $('rp-feedback'); fb.textContent = '';
        fb.className = 'rp-feedback' + (ok ? ' ok' : '');
        if (ok) { fb.appendChild(el('span', '', '✓ ' + t('right'))); }
        else {
            fb.appendChild(el('span', '', t('wrong')));
            fb.appendChild(el('span', 'rp-a', tx(cur.card.a)));
        }
        const c = el('button', 'rp-btn', t('cont')); c.type = 'button'; c.id = 'rp-continue'; c.onclick = nextCard;
        fb.appendChild(c); fb.hidden = false;
        progress();
        if (cur.form === 'flash' && ok) { return nextCard(); } // self-graded "knew it": no extra tap
        try { c.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    }

    async function endSession() {
        const r = S.run;
        const today = dayStr(), y = dayStr(new Date(Date.now() - 864e5));
        if (S.meta.last !== today) { S.meta.streak = S.meta.last === y ? (S.meta.streak || 0) + 1 : 1; S.meta.last = today; }
        S.meta.best = Math.max(S.meta.best || 0, S.meta.streak); S.meta.done = (S.meta.done || 0) + 1; saveMeta();
        show('rp-end'); renderEnd();
        if (S.user && typeof PlatformFirestore !== 'undefined') {
            try {
                await PlatformFirestore.updateGameStats(S.user.uid, 'repaso', {
                    correctAnswers: r.right, totalQuestions: r.answered, totalAttempts: r.answered, bestStreak: r.best,
                    elapsedSeconds: Math.round((Date.now() - r.t0) / 1000), level: S.meta.streak, operation: 'review'
                });
            } catch (e) { console.warn('[Repaso] stats not saved', e); }
        }
    }

    function renderEnd() {
        const r = S.run;
        $('rp-trophy').textContent = r.wrong === 0 ? '🏆' : r.right >= r.wrong ? '🌟' : '💪';
        const ratio = r.right / Math.max(1, r.right + r.wrong), sc = r.wrong === 0 ? 3 : ratio >= .7 ? 2 : 1;
        Dyn.stars($('rp-endstars'), sc, 3); if (r.right >= r.wrong) Dyn.big($('rp-trophy'));
        const eg = $('rp-endgoal'); eg.textContent = ''; eg.appendChild(goalBox(64));
        $('rp-endtitle').textContent = t('endGreat');
        const st = $('rp-endstats'); st.textContent = '';
        [[r.right, 'endRight'], [r.wrong, 'endWrong'], [r.boxesUp, 'endBoxes']].forEach(([n, k]) => {
            const d = el('div'); d.appendChild(el('b', '', String(n))); d.appendChild(document.createTextNode(t(k))); st.appendChild(d);
        });
        const m = $('rp-mistakes'); m.textContent = '';
        if (r.mistakes.length) {
            m.appendChild(el('h3', '', t('mistakes')));
            const ul = el('ul');
            r.mistakes.forEach(x => { const li = el('li'); li.appendChild(document.createTextNode(x.q + '  →  ')); li.appendChild(el('b', '', x.a)); ul.appendChild(li); });
            m.appendChild(ul);
        }
        const more = $('rp-more'); more.textContent = t('keepGoing'); more.onclick = () => startSession(S.lastScope);
        const left = makeSession(S.decks, states(), { deckId: S.lastScope || undefined }).length;
        more.hidden = left === 0;
        $('rp-back').textContent = t('back'); $('rp-back').onclick = () => { renderHome(); show('rp-home'); };
    }

    // ---- study mode (no grading) ----
    function startStudy(deckId) {
        const d = deckById(deckId); if (!d) return;
        S.study = { deck: d, i: 0, flipped: false };
        show('rp-study'); renderStudy();
    }
    function renderStudy() {
        const s = S.study; if (!s) return;
        const c = s.deck.cards[s.i], n = s.deck.cards.length;
        const card = $('rp-studycard'); card.textContent = '';
        card.appendChild(el('p', 'rp-kind', s.deck.icon + ' ' + tx(s.deck.title)));
        card.appendChild(el('div', 'rp-q', tx(c.q)));
        if (c.tag) card.appendChild(el('div', 'rp-tag', c.tag));
        if (s.flipped) card.appendChild(el('div', 'rp-a', tx(c.a)));
        card.appendChild(el('p', 'rp-hint', t('studyHint')));
        card.tabIndex = 0; card.style.cursor = 'pointer'; card.onclick = studyFlip;
        $('rp-studyfill').style.width = Math.round(100 * (s.i + 1) / n) + '%';
        $('rp-studycount').textContent = (s.i + 1) + '/' + n;
        $('rp-studyquit').setAttribute('aria-label', t('quit'));
        $('rp-prev').textContent = '← ' + t('prev'); $('rp-nextcard').textContent = t('next') + ' →';
        $('rp-prev').disabled = s.i === 0; $('rp-nextcard').disabled = s.i === n - 1;
    }
    function studyFlip() { if (S.study) { S.study.flipped = !S.study.flipped; renderStudy(); } }
    function studyMove(d) {
        const s = S.study; if (!s) return;
        const j = s.i + d; if (j < 0 || j >= s.deck.cards.length) return;
        s.i = j; s.flipped = false; renderStudy();
    }

    // ---- keyboard ----
    function onKey(e) {
        if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
        if (S.screen === 'rp-study') {
            if (e.key === ' ') { e.preventDefault(); studyFlip(); }
            else if (e.key === 'ArrowRight') studyMove(1);
            else if (e.key === 'ArrowLeft') studyMove(-1);
            return;
        }
        if (S.screen !== 'rp-play' || !S.run || !S.run.cur) return;
        const cur = S.run.cur, fbHidden = $('rp-feedback').hidden;
        if (!fbHidden) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nextCard(); } return; }
        if (cur.form === 'flash') {
            if (!cur.revealed) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } }
            else if (e.key === 'ArrowRight' || e.key === '1') answer(true);
            else if (e.key === 'ArrowLeft' || e.key === '2') answer(false);
        } else if (cur.form === 'choice') {
            if (/^[1-4]$/.test(e.key) && cur.opts[Number(e.key) - 1] != null) pickOption(Number(e.key) - 1);
        } else if (e.key === 'Enter') { e.preventDefault(); submitTyped(); }
    }

    function render() {
        if (S.screen === 'rp-home') renderHome();
        else if (S.screen === 'rp-play') { renderCard(); }
        else if (S.screen === 'rp-study') renderStudy();
        else if (S.screen === 'rp-end') renderEnd();
    }

    function init() {
        $('rp-quit').onclick = () => { S.run = null; renderHome(); show('rp-home'); };
        const topBar = document.querySelector('#rp-play .rp-top');
        const hb = Dyn.el('button', 'dy-help', '💡'); hb.type = 'button'; hb.id = 'rp-help'; hb.onclick = showHelp; topBar.appendChild(hb);
        const hl = () => { hb.textContent = '💡 ' + Dyn.t('help'); hb.setAttribute('aria-label', Dyn.t('help')); }; hl(); window.addEventListener('platformLanguageChanged', hl);
        S.goalRing = Dyn.ring(44, 6, '#22c55e'); S.goalRing.el.classList.add('rp-minigoal');
        Dyn.sound(topBar); S.hud = Dyn.hud(topBar); S.hud.root.appendChild(S.goalRing.el);
        $('rp-studyquit').onclick = () => { S.study = null; renderHome(); show('rp-home'); };
        $('rp-prev').onclick = () => studyMove(-1);
        $('rp-nextcard').onclick = () => studyMove(1);
        document.addEventListener('keydown', onKey);
        loadAll(); renderHome(); show('rp-home');
        if (window.PlatformAuth && PlatformAuth.onAuthStateChanged) PlatformAuth.onAuthStateChanged(u => {
            S.user = u || null;
            if (S.screen === 'rp-home') { loadAll(); renderHome(); }
        });
        window.addEventListener('platformLanguageChanged', render);
    }

    const api = { init, resolveText, makeSession, makeOptions, normalize, checkTyped, isTypable, formFor, UI };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    return api;
})();
