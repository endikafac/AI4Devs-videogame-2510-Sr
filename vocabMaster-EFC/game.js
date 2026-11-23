/**
 * VocabMaster: data-driven vocabulary trainer.
 * Packs live in vocab/<lang>/<topic>.json and are listed in vocab/index.json,
 * so adding a topic or a language never needs code changes.
 * Method: Leitner spaced repetition (6 boxes) + exercises that get harder with the box:
 *   new word -> intro card, box 0-1 -> multiple choice, box 2 -> listen and choose, box 3+ -> type it.
 * Progress is stored per player on this device (guest, adult or child profile).
 * Meanings and example translations follow the UI language (vocab/translations.json, fallback Spanish).
 * Quiz formats: choose, choose back, listen and pick the picture, drag the word to its picture, type it.
 * Practice modes (they never touch the saved boxes): match pairs, memory, lightning round.
 */
const VocabMaster = (() => {
    const ROUND = 10, MAX_NEW = 5, MAX_BOX = 5, LEARNED_BOX = 4;
    const DAYS = [0, 1, 3, 7, 14, 30];

    const UI = {
        es: { sub: 'Aprende palabras con repaso espaciado: las que fallas vuelven antes.', pick: 'Elige un tema',
              words: 'palabras', learned: 'aprendidas', quit: 'Salir', listen: '🔊 Escuchar', gotit: 'Entendido',
              next: 'Siguiente', check: 'Comprobar', newWord: 'Palabra nueva', choose: '¿Qué significa?',
              chooseBack: '¿Cómo se dice en inglés?', hear: 'Escucha y elige el significado', type: 'Escríbelo en inglés',
              ok: '¡Correcto!', again: 'Otra ronda', home: 'Temas', end: 'Ronda terminada',
              score: (a, b) => `${a} de ${b} a la primera`, review: 'Para repasar', saved: 'Tu progreso se guarda en este dispositivo.',
              none: 'No hay nada que repasar ahora: ¡vuelve mañana!', place: 'Escribe aquí', lang: 'Idioma a aprender',
              due: 'por repasar' },
        en: { sub: 'Learn words with spaced repetition: the ones you miss come back sooner.', pick: 'Pick a topic',
              words: 'words', learned: 'learned', quit: 'Quit', listen: '🔊 Listen', gotit: 'Got it',
              next: 'Next', check: 'Check', newWord: 'New word', choose: 'What does it mean?',
              chooseBack: 'How do you say it?', hear: 'Listen and choose the meaning', type: 'Type it',
              ok: 'Correct!', again: 'Another round', home: 'Topics', end: 'Round finished',
              score: (a, b) => `${a} of ${b} first time`, review: 'To review', saved: 'Your progress is saved on this device.',
              none: 'Nothing to review right now: come back tomorrow!', place: 'Type here', lang: 'Language to learn',
              due: 'to review' },
        eu: { sub: 'Ikasi hitzak tarteko errepasoarekin: huts egiten dituzunak lehenago itzultzen dira.', pick: 'Aukeratu gai bat',
              words: 'hitz', learned: 'ikasita', quit: 'Irten', listen: '🔊 Entzun', gotit: 'Ulertu dut',
              next: 'Hurrengoa', check: 'Egiaztatu', newWord: 'Hitz berria', choose: 'Zer esan nahi du?',
              chooseBack: 'Nola esaten da?', hear: 'Entzun eta aukeratu esanahia', type: 'Idatzi ezazu',
              ok: 'Zuzena!', again: 'Beste txanda bat', home: 'Gaiak', end: 'Txanda amaitu da',
              score: (a, b) => `${b}tik ${a} lehen aldiz`, review: 'Errepasatzeko', saved: 'Zure aurrerapena gailu honetan gordetzen da.',
              none: 'Ez dago ezer errepasatzeko orain: bihar itzuli!', place: 'Idatzi hemen', lang: 'Ikasteko hizkuntza',
              due: 'errepasatzeko' }
    };

    // Study cards, guided check and the new feedback (learn.js). gl, ca and fr dictionaries live there too.
    const VL = (typeof VocabLearn !== 'undefined') ? VocabLearn : require('./learn.js');
    Object.keys(VL.NEW_KEYS).forEach(l => { UI[l] = Object.assign(UI[l] || {}, VL.NEW_KEYS[l]); });


    const CFG = { lightning: 45, memoryPairs: 6, matchPairs: 5, flipBack: 900, nextLight: 450 };
    const SHAPES = ['▲', '◆', '●', '■'];
    const S = { index: null, lang: null, pack: null, user: null, prog: {}, queue: [], total: 0, done: 0, mode: 'round', tr: undefined,
                ok1: 0, attempts: 0, streak: 0, best: 0, t0: 0, missed: [], seen: [], current: null, help: null, force: null, timers: [], shownStreak: 0 };
    const $ = id => document.getElementById(id);
    const uiLang = () => ((window.PlatformI18n && PlatformI18n.currentLanguage) || 'es').slice(0, 2);
    const T = () => UI[uiLang()] || UI.es;
    const nm = o => o[uiLang()] || o.es || o.en;
    const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]/g, '').replace(/\s+/g, ' ').trim();
    const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    const J = () => (typeof window !== 'undefined' && window.Juice) || null;
    function fxOk(target, silent) { const j = J(); if (j) j.correct(target, silent ? { streak: S.streak, silent: true } : { streak: S.streak }); }
    function fxBad(target, silent) { const j = J(); if (j) j.wrong(target, silent ? { silent: true } : undefined); }
    function later(fn, ms) { const id = window.setTimeout(fn, ms); S.timers.push(id); return id; }
    function stopTimers() { S.timers.forEach(id => { clearTimeout(id); clearInterval(id); }); S.timers = []; S.light = null; }

    // ---- storage (per player, device-local) ----
    function owner() {
        const u = S.user; if (!u) return 'guest';
        let pid = null; try { pid = PlatformFirestore._pid(u.uid); } catch (e) {}
        return u.uid + (pid ? '_' + pid : '');
    }
    const key = () => 'vocab_prog_' + owner();
    function loadProg() { try { S.prog = JSON.parse(localStorage.getItem(key())) || {}; } catch (e) { S.prog = {}; } }
    function saveProg() { try { localStorage.setItem(key(), JSON.stringify(S.prog)); } catch (e) {} }
    const wp = (packId, w) => (S.prog[packId] || {})[w];
    function setWp(packId, w, box) {
        (S.prog[packId] = S.prog[packId] || {})[w] = { b: box, d: Date.now() + DAYS[box] * 864e5 };
        saveProg();
    }

    // ---- data ----
    /** vocab/translations.json: meanings and example translations per UI language, pack names, language names. */
    async function loadTr() {
        if (S.tr !== undefined) return S.tr;
        try { const r = await fetch('vocab/translations.json'); S.tr = r.ok ? await r.json() : null; } catch (e) { S.tr = null; }
        return S.tr;
    }
    async function loadIndex() {
        const r = await fetch('vocab/index.json'); S.index = await r.json();
        if (!S.lang) S.lang = Object.keys(S.index.langs)[0];
        const tr = await loadTr();
        if (tr) {
            S.index.packs.forEach(p => { if (tr.packs && tr.packs[p.id]) p.name = Object.assign({}, p.name, tr.packs[p.id].name); });
            Object.keys(tr.langs || {}).forEach(c => { if (S.index.langs[c]) S.index.langs[c].name = Object.assign({}, S.index.langs[c].name, tr.langs[c]); });
        }
    }
    async function loadPack(meta) {
        const [r, tr] = await Promise.all([fetch('vocab/' + meta.file), loadTr()]);
        const p = await r.json();
        p._tr = (tr && tr.words && tr.words[p.id]) || {};
        p.words = p.words.map(a => VL.localizeWord({ w: a[0], ts: a[1], i: a[2], e: a[3] }, p._tr[a[0]], uiLang()));
        return p;
    }
    /** The UI language changed: meanings and example translations follow (objects are updated in place). */
    function relocalize() { if (S.pack) S.pack.words.forEach(w => Object.assign(w, VL.localizeWord(w, (S.pack._tr || {})[w.w], uiLang()))); }

    // ---- home ----
    const MODES = [['round', 'modeRound'], ['match', 'modeMatch'], ['memory', 'modeMemory'], ['lightning', 'modeLightning']];
    function renderHome() {
        const t = T();
        $('vm-sub').textContent = t.sub;
        $('vm-note').textContent = t.saved;
        const langs = $('vm-langs'); langs.textContent = '';
        langs.setAttribute('aria-label', t.lang);
        Object.entries(S.index.langs).forEach(([code, l]) => {
            const b = el('button', 'vm-chip', l.flag + ' ' + nm(l.name)); b.type = 'button';
            b.setAttribute('aria-pressed', String(code === S.lang));
            b.onclick = () => { S.lang = code; renderHome(); }; langs.appendChild(b);
        });
        const modes = $('vm-modes'); modes.textContent = '';
        modes.setAttribute('aria-label', t.modeLabel);
        modes.appendChild(el('span', 'vm-modelabel', t.modeLabel));
        MODES.forEach(([m, k]) => {
            const b = el('button', 'vm-chip vm-mode', t[k]); b.type = 'button'; b.dataset.mode = m;
            b.setAttribute('aria-pressed', String(m === S.mode));
            b.onclick = () => { S.mode = m; renderHome(); }; modes.appendChild(b);
        });
        const box = $('vm-packs'); box.textContent = '';
        S.index.packs.filter(p => p.lang === S.lang).forEach(p => {
            const pr = S.prog[p.id] || {}, vals = Object.values(pr);
            const learned = vals.filter(v => v.b >= LEARNED_BOX).length;
            const due = vals.filter(v => v.d <= Date.now()).length;
            const b = el('button', 'vm-pack'); b.type = 'button'; b.dataset.pack = p.id;
            b.append(el('span', 'vm-pack-ico', p.icon), el('span', 'vm-pack-name', nm(p.name)),
                el('span', 'vm-pack-meta', `${learned}/${p.count} ${t.learned}` + (due ? ` · ${due} ${t.due}` : '')));
            const m = el('div', 'vm-meter'), f = el('i'); f.style.width = Math.round(learned / p.count * 100) + '%'; m.appendChild(f); b.appendChild(m);
            b.onclick = () => start(p); box.appendChild(b);
        });
    }
    function show(id) {
        stopTimers();
        ['vm-home', 'vm-play', 'vm-end'].forEach(s => { $(s).hidden = s !== id; });
        window.scrollTo(0, 0);
    }

    // ---- shared pieces: card entrance, zones, help, streak, options ----
    function enter(c) { c.classList.remove('vm-in'); void c.offsetWidth; c.classList.add('vm-in'); }
    function setHelp(fn) {
        S.help = fn;
        const box = $('vm-helpbox'); box.hidden = true; box.textContent = '';
        $('vm-help').setAttribute('aria-expanded', 'false');
    }
    function toggleHelp() {
        const box = $('vm-helpbox'), btn = $('vm-help');
        if (!box.hidden) { box.hidden = true; btn.setAttribute('aria-expanded', 'false'); return; }
        box.textContent = S.help ? S.help() : '';
        box.hidden = !box.textContent; btn.setAttribute('aria-expanded', String(!box.hidden));
    }
    function exampleText(w) { const t = T(); return t.exampleLabel + ': “' + w.e + '”' + (w.et ? ' ' + w.et : ''); }
    function paintStreak() {
        const e = $('vm-streak'), n = S.streak;
        e.textContent = n > 0 ? '🔥 ' + VL.fill(T().streak, { n }) : '';
        e.classList.toggle('hot', n >= 3);
        if (n > S.shownStreak && n > 0) { e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump'); }
        S.shownStreak = n;
    }
    function progress() {
        const pct = S.total ? Math.round(S.done / S.total * 100) : 0;
        $('vm-barfill').style.width = pct + '%';
        $('vm-barfill').parentNode.setAttribute('aria-valuenow', String(pct));
        $('vm-count').textContent = `${S.done}/${S.total}`;
        paintStreak();
    }
    /** "Pregunta N de M" + the kind of exercise: the first labelled zone of every question. */
    function qhead(n, m, label) {
        const h = el('div', 'vm-qhead');
        h.append(el('span', 'vm-qnum', VL.fill(T().checkCount, { n, m })), el('span', 'vm-kind', label));
        return h;
    }
    /** Labelled answer zone ("Elige", "Escribe", "Arrastra"...). */
    function area(label, ...kids) {
        const a = el('div', 'vm-area'); a.setAttribute('role', 'group'); a.setAttribute('aria-label', label);
        a.append(el('span', 'vm-zlabel', label), ...kids); return a;
    }
    function prompt(...kids) { const p = el('div', 'vm-prompt'); p.append(...kids); return p; }
    /** Colourful answer buttons with a shape each (triangle, diamond, circle, square) and a staggered entrance. */
    function optionList(opts, paint, onPick, cls) {
        const wrap = el('div', 'vm-opts' + (cls ? ' ' + cls : ''));
        opts.forEach((o, i) => {
            const b = el('button', 'vm-opt c' + (i % 4)); b.type = 'button'; b._o = o;
            b.dataset.shape = SHAPES[i % 4]; b.dataset.i = String(i); b.style.setProperty('--i', String(i));
            paint(b, o); b.onclick = () => onPick(o, b, wrap); wrap.appendChild(b);
        });
        return wrap;
    }
    function lockOptions(wrap, correct) { wrap.querySelectorAll('button').forEach(x => { x.disabled = true; if (x._o === correct) x.classList.add('ok'); }); }
    function listenBtn(w) {
        if (!canSpeak()) return null;
        const l = el('button', 'vm-listen', T().listen); l.type = 'button'; l.onclick = () => speak(w.w); return l;
    }

    // ---- session ----
    async function start(meta) {
        stopTimers();
        S.pack = await loadPack(meta);
        Object.assign(S, { streak: 0, shownStreak: 0, best: 0 });
        if (S.mode !== 'round') return startPractice(S.mode);
        const now = Date.now(), pr = S.prog[S.pack.id] || {};
        const known = S.pack.words.filter(w => pr[w.w]);
        const due = known.filter(w => pr[w.w].d <= now).sort((a, b) => pr[a.w].b - pr[b.w].b);
        const fresh = shuffle(S.pack.words.filter(w => !pr[w.w]));
        let pick = due.slice(0, ROUND);
        pick = pick.concat(fresh.slice(0, Math.min(MAX_NEW, ROUND - pick.length)));
        if (pick.length < ROUND) {
            const rest = shuffle(known.filter(w => !pick.includes(w))).sort((a, b) => pr[a.w].b - pr[b.w].b);
            pick = pick.concat(rest.slice(0, ROUND - pick.length));
        }
        if (pick.length < ROUND) pick = pick.concat(fresh.filter(w => !pick.includes(w)).slice(0, ROUND - pick.length));
        if (!pick.length) pick = shuffle(S.pack.words.slice()).slice(0, ROUND);
        S.queue = shuffle(pick).map(w => ({ w, tries: 0, isNew: !pr[w.w] }));
        Object.assign(S, { total: S.queue.length, done: 0, ok1: 0, attempts: 0, streak: 0, best: 0, t0: Date.now(), missed: [], seen: [], study: null, check: null });
        show('vm-play');
        // New words of this round are studied first (flip cards, then a guided check of 3), then the normal quiz
        const studyWords = VL.pickStudyWords(S.queue);
        if (studyWords.length) { S.study = { words: studyWords, idx: 0, flipped: false }; renderStudy(); return; }
        next();
    }

    // ---- study cards + guided check (before the quiz) ----
    function endStudy(completed) {
        if (window.speechSynthesis) { try { speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
        if (completed && S.study) S.queue.forEach(i => { if (S.study.words.includes(i.w)) i.introDone = true; });
        S.study = null; S.check = null; next();
    }
    function skipBtn() {
        const b = el('button', 'vm-btn ghost', T().studySkip); b.type = 'button'; b.id = 'vm-study-skip';
        b.onclick = () => endStudy(false); return b;
    }
    /** One flip card: front = emoji + English word, back = meaning + example sentence (and its translation). */
    function renderStudy() {
        const st = S.study, t = T(), c = $('vm-card'), w = st.words[st.idx], last = st.idx === st.words.length - 1;
        c.textContent = ''; enter(c); progress();
        setHelp(() => t.studyTap);
        c.append(el('span', 'vm-kind', t.studyTitle), el('p', 'vm-hint', t.studyTap));
        const card = el('button', 'vm-flip' + (st.flipped ? ' flipped' : '')); card.type = 'button'; card.id = 'vm-flip';
        card.setAttribute('aria-pressed', String(st.flipped));
        const front = el('span', 'vm-face vm-front'), back = el('span', 'vm-face vm-backface');
        front.append(el('span', 'vm-emoji', w.i), el('span', 'vm-word', w.w));
        back.append(el('span', 'vm-emoji', w.i), el('span', 'vm-trans', w.t));
        if (w.e) back.appendChild(el('span', 'vm-ex', '“' + w.e + '”'));
        if (w.et) back.appendChild(el('span', 'vm-ex vm-ex-tr', w.et));
        card.append(front, back);
        card.onclick = () => { st.flipped = !st.flipped; card.classList.toggle('flipped', st.flipped); card.setAttribute('aria-pressed', String(st.flipped)); speak(w.w); };
        c.appendChild(card);
        c.appendChild(el('p', 'vm-count-s', VL.fill(t.studyCount, { n: st.idx + 1, m: st.words.length })));
        const l = listenBtn(w); if (l) c.appendChild(l);
        const nb = el('button', 'vm-btn', last ? t.studyCheck : t.studyNext); nb.type = 'button'; nb.id = 'vm-study-next';
        nb.onclick = () => { if (last) startCheck(); else { st.idx++; st.flipped = false; renderStudy(); } };
        c.append(nb, skipBtn());
        speak(w.w); card.focus();
    }
    function startCheck() {
        S.check = { qs: VL.buildCheck(S.study.words, S.pack.words), i: 0 };
        renderCheck();
    }
    /** Guided check: wrong answers are explained and can be retried; nothing here changes the spaced-repetition boxes. */
    function renderCheck() {
        const ck = S.check, q = ck.qs[ck.i], w = q.word, t = T(), c = $('vm-card'); c.textContent = ''; enter(c);
        const lastQ = ck.i === ck.qs.length - 1;
        setHelp(() => exampleText(w));
        c.append(qhead(ck.i + 1, ck.qs.length, t.checkTitle));
        c.append(prompt(el('span', 'vm-emoji vm-big', w.i), q.back ? el('p', 'vm-trans', w.t) : el('p', 'vm-word', w.w)),
                 el('p', 'vm-hint', q.back ? t.chooseBack : t.choose));
        const fb = el('p', 'vm-fb'); fb.id = 'vm-check-fb';
        const nb = el('button', 'vm-btn', lastQ ? t.checkStart : t.next); nb.type = 'button'; nb.id = 'vm-check-next'; nb.hidden = true;
        const wrap = optionList(q.options, (b, o) => { b.textContent = o[q.field]; }, (o, b) => {
            if (o === w) {
                lockOptions(wrap, w); S.streak++; paintStreak(); fxOk(b);
                fb.className = 'vm-fb ok'; fb.textContent = t.checkOk;
                nb.hidden = false; nb.focus();
            } else {
                b.disabled = true; b.classList.add('bad'); fb.className = 'vm-fb bad'; S.streak = 0; paintStreak(); fxBad(b);
                renderFeedback(fb, w, q.back ? 'back' : 'choice', o, t.checkTry);
            }
        });
        nb.onclick = () => { if (lastQ) endStudy(true); else { ck.i++; renderCheck(); } };
        c.append(area(t.zChoose, wrap), fb, nb, skipBtn());
    }
    /** Wrong-answer text: the correct word with its meaning, why the chosen one is not it, and the example sentence (with its translation). */
    function renderFeedback(fb, w, mode, chosen, tail) {
        const t = T();
        fb.textContent = '';
        fb.appendChild(el('span', 'vm-fb-head', '✗ ' + t.incorrect));
        VL.feedbackLines(w, mode, chosen).forEach(line => {
            fb.appendChild(el('span', 'vm-fb-line', line.example ? t.exampleLabel + ': “' + line.example + '”' : VL.fill(t[line.key], line.vars)));
            if (line.example && line.exampleTr) fb.appendChild(el('span', 'vm-fb-line vm-fb-tr', line.exampleTr));
        });
        if (tail) fb.appendChild(el('span', 'vm-fb-line vm-fb-tail', tail));
    }
    function speak(text) {
        if (!('speechSynthesis' in window) || !S.pack) return;
        try {
            speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text); u.lang = S.index.langs[S.pack.lang].tts || S.pack.lang; u.rate = .85;
            speechSynthesis.speak(u);
        } catch (e) {}
    }
    const canSpeak = () => 'speechSynthesis' in window;

    // ---- the quiz ----
    function dragPool(item) {
        const seen = new Set([item.w.i]), out = [];
        shuffle(S.pack.words.filter(x => x !== item.w)).forEach(x => { if (!seen.has(x.i) && out.length < 3) { seen.add(x.i); out.push(x); } });
        return out;
    }
    function kindFor(item) {
        if (S.force) return S.force;
        if (item.isNew && item.tries === 0 && !item.introDone) return 'intro';
        const b = (wp(S.pack.id, item.w.w) || { b: 0 }).b;
        if (item.tries > 0 || b <= 1) {
            const r = Math.random();
            if (r < .4 || (S.done === 0 && r < .55)) return 'choice';
            if (r < .7 || S.done === 0) return 'choiceBack'; // the first question of a round is a plain warm-up
            return dragPool(item).length >= 3 ? 'drag' : 'choice';
        }
        if (b === 2) return 'listen';
        return 'type';
    }
    function distractors(item, field) {
        const pool = shuffle(S.pack.words.filter(x => x !== item.w && x[field] !== item.w[field]));
        return pool.slice(0, 3);
    }
    function next() {
        progress();
        if (!S.queue.length) return finish();
        const item = S.queue[0]; S.current = item;
        const kind = kindFor(item), t = T(), c = $('vm-card'); c.textContent = ''; enter(c);
        const w = item.w, n = Math.min(S.done + 1, S.total);
        setHelp(() => kind === 'type' ? VL.fill(t.helpStarts, VL.hintParts(w.w)) : kind === 'drag' ? t.helpDrag : exampleText(w));
        if (kind === 'intro') {
            c.append(el('span', 'vm-kind', t.newWord), el('div', 'vm-emoji vm-big', w.i), el('p', 'vm-word', w.w),
                el('p', 'vm-trans', w.t), el('p', 'vm-ex', '“' + w.e + '”'));
            if (w.et) c.appendChild(el('p', 'vm-ex vm-ex-tr', w.et));
            const l = listenBtn(w); if (l) c.appendChild(l);
            const b = el('button', 'vm-btn', t.gotit); b.type = 'button';
            b.onclick = () => { item.introDone = true; next(); }; c.appendChild(b);
            speak(w.w); b.focus(); return;
        }
        if (kind === 'type') return renderType(item, c, t, n);
        if (kind === 'drag') return renderDrag(item, c, t, n);
        if (kind === 'listen') return renderListen(item, c, t, n);
        const back = kind === 'choiceBack';
        c.appendChild(qhead(n, S.total, back ? t.chooseBack : t.choose));
        const pr = back ? prompt(el('div', 'vm-emoji vm-big', w.i), el('p', 'vm-trans', w.t))
                        : prompt(el('div', 'vm-emoji vm-big', w.i), el('p', 'vm-word', w.w));
        if (!back) { const l = listenBtn(w); if (l) pr.appendChild(l); }
        const field = back ? 'w' : 't', fb = el('p', 'vm-fb');
        const opts = shuffle([w].concat(distractors(item, field)));
        const wrap = optionList(opts, (b, o) => { b.textContent = o[field]; }, (o, b) => {
            lockOptions(wrap, w);
            if (o !== w) b.classList.add('bad');
            answer(item, o === w, fb, w, { mode: back ? 'back' : 'choice', chosen: o, el: b });
        });
        c.append(pr, area(t.zChoose, wrap), fb);
    }
    /** Listen and choose the picture (voice if the browser has one, otherwise the word is shown). */
    function renderListen(item, c, t, n) {
        const w = item.w, fb = el('p', 'vm-fb');
        c.appendChild(qhead(n, S.total, t.hearPic));
        const pr = prompt();
        const big = el('button', 'vm-speaker', '🔊'); big.type = 'button'; big.setAttribute('aria-label', t.listen); big.onclick = () => speak(w.w);
        pr.appendChild(big);
        if (canSpeak()) pr.appendChild(el('p', 'vm-hint', t.listen));
        else { pr.append(el('p', 'vm-word', w.w), el('p', 'vm-hint vm-novoice', t.noVoice)); }
        const opts = shuffle([w].concat(distractors(item, 't')));
        const wrap = optionList(opts, (b, o) => { b.append(el('span', 'vm-pic', o.i), el('span', 'vm-opt-t', o.t)); }, (o, b) => {
            lockOptions(wrap, w);
            if (o !== w) b.classList.add('bad');
            answer(item, o === w, fb, w, { mode: 'choice', chosen: o, el: b });
        }, 'vm-pics');
        c.append(pr, area(t.zChoose, wrap), fb);
        speak(w.w);
    }
    /** Drag the word onto its picture. Tap works too (tap a picture) and so do the number keys. */
    function renderDrag(item, c, t, n) {
        const w = item.w, fb = el('p', 'vm-fb');
        c.appendChild(qhead(n, S.total, t.dragTitle));
        const chip = el('button', 'vm-dragchip', w.w); chip.type = 'button'; chip.id = 'vm-dragchip'; chip.setAttribute('aria-label', w.w);
        const pr = prompt(chip); const l = listenBtn(w); if (l) pr.appendChild(l);
        const opts = shuffle([w].concat(dragPool(item)));
        let tiles = [], done = false;
        const wrap = optionList(opts, (b, o) => { b.classList.add('vm-drop'); b.append(el('span', 'vm-pic', o.i)); b.setAttribute('aria-label', o.i + ' ' + o.t); }, (o, b) => {
            if (done) return; done = true; chip.disabled = true; chip.classList.remove('dragging'); chip.style.transform = '';
            lockOptions(wrap, w);
            if (o !== w) b.classList.add('bad'); else chip.classList.add('landed');
            answer(item, o === w, fb, w, { mode: 'choice', chosen: o, el: b });
        }, 'vm-pics vm-drops');
        tiles = [...wrap.children];
        const tileAt = (x, y) => document.elementsFromPoint(x, y).find(e => e.classList && e.classList.contains('vm-drop') && !e.disabled);
        let start0 = null, moved = false;
        chip.addEventListener('pointerdown', e => {
            if (chip.disabled) return;
            start0 = { x: e.clientX, y: e.clientY }; moved = false;
            try { chip.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        });
        chip.addEventListener('pointermove', e => {
            if (!start0 || chip.disabled) return;
            const dx = e.clientX - start0.x, dy = e.clientY - start0.y;
            if (!moved && Math.hypot(dx, dy) < 6) return;
            moved = true; chip.classList.add('dragging'); chip.style.transform = `translate(${dx}px,${dy}px)`;
            const over = tileAt(e.clientX, e.clientY); tiles.forEach(x => x.classList.toggle('over', x === over));
        });
        const release = e => {
            if (!start0) return; start0 = null;
            tiles.forEach(x => x.classList.remove('over'));
            if (!moved) return;
            const over = tileAt(e.clientX, e.clientY);
            if (over && !chip.disabled) over.click(); else { chip.classList.remove('dragging'); chip.style.transform = ''; }
        };
        chip.addEventListener('pointerup', release);
        chip.addEventListener('pointercancel', () => { start0 = null; chip.classList.remove('dragging'); chip.style.transform = ''; });
        chip.addEventListener('click', () => { if (!moved) speak(w.w); moved = false; });
        c.append(pr, area(t.zDrag, wrap), fb);
        speak(w.w);
    }
    function renderType(item, c, t, n) {
        const w = item.w;
        c.appendChild(qhead(n, S.total, t.type));
        const pr = prompt(el('div', 'vm-emoji vm-big', w.i), el('p', 'vm-trans', w.t));
        const l = listenBtn(w); if (l) pr.appendChild(l);
        const inp = el('input', 'vm-input'); inp.type = 'text'; inp.autocomplete = 'off'; inp.autocapitalize = 'none';
        inp.spellcheck = false; inp.placeholder = t.place; inp.setAttribute('aria-label', t.type);
        const fb = el('p', 'vm-fb'); const btn = el('button', 'vm-btn', t.check); btn.type = 'button';
        const go = () => {
            if (inp.disabled || !inp.value.trim()) return;
            const good = norm(inp.value) === norm(w.w);
            inp.disabled = true; inp.classList.add(good ? 'ok' : 'bad'); btn.hidden = true;
            answer(item, good, fb, w, { mode: 'type', chosen: inp.value, el: inp });
        };
        btn.onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') go(); };
        c.append(pr, area(t.zType, inp, btn), fb); inp.focus();
    }
    function answer(item, good, fb, w, ctx) {
        const t = T(); S.attempts++;
        const first = item.tries === 0;
        fb.className = 'vm-fb ' + (good ? 'ok' : 'bad');
        if (good) fb.textContent = t.ok;
        else renderFeedback(fb, w, ctx.mode, ctx.chosen);
        const cur = (wp(S.pack.id, w.w) || { b: 0 }).b;
        if (good) { S.streak++; S.best = Math.max(S.best, S.streak); speak(w.w); }
        else { S.streak = 0; if (first) S.missed.push(w); }
        if (good) fxOk(ctx.el || $('vm-card')); else fxBad(ctx.el || $('vm-card'));
        if (first) {
            setWp(S.pack.id, w.w, good ? Math.min(MAX_BOX, cur + 1) : 0);
            if (good) S.ok1++;
            if (!S.seen.includes(w)) S.seen.push(w);
        }
        S.queue.shift();
        if (good) S.done++; else { item.tries++; S.queue.push(item); }
        const b = el('button', 'vm-btn', t.next); b.type = 'button'; b.id = 'vm-next'; b.onclick = next;
        $('vm-card').appendChild(b); b.focus();
        progress();
    }

    // ---- end screens ----
    function showStars(n) {
        const box = $('vm-stars'); box.textContent = '';
        for (let i = 0; i < 3; i++) {
            const s = el('span', 'vm-star' + (i < n ? ' on' : ''), '★'); s.style.animationDelay = (0.25 + i * 0.35) + 's'; box.appendChild(s);
        }
    }
    function showEnd(o) {
        $('vm-trophy').textContent = o.trophy;
        $('vm-endtitle').textContent = o.title; $('vm-endtext').textContent = o.text;
        const list = $('vm-endlist'); list.textContent = '';
        o.words.forEach(w => list.appendChild(el('span', 'vm-tag' + (o.missed && o.missed.includes(w) ? ' miss' : ''), `${w.i} ${w.w} = ${w.t}`)));
        const t = T(); $('vm-again').textContent = t.again; $('vm-home-btn').textContent = t.home;
        const pn = $('vm-endnote'); pn.textContent = o.note || ''; pn.hidden = !o.note;
        showStars(o.stars); show('vm-end');
        const j = J(); if (j && o.stars >= 3) { j.levelUp($('vm-trophy')); }
    }
    async function finish() {
        const t = T(), pct = S.ok1 / S.total;
        showEnd({ trophy: pct >= .8 ? '🏆' : pct >= .5 ? '⭐' : '💪', title: t.end, text: t.score(S.ok1, S.total), words: S.seen, missed: S.missed, stars: pct >= .8 ? 3 : pct >= .5 ? 2 : 1 });
        if (S.user && typeof PlatformFirestore !== 'undefined') {
            try {
                await PlatformFirestore.updateGameStats(S.user.uid, 'vocabmaster', {
                    correctAnswers: S.ok1, totalQuestions: S.total, totalAttempts: S.attempts, bestStreak: S.best,
                    elapsedSeconds: Math.round((Date.now() - S.t0) / 1000), level: 1, operation: S.pack.id });
            } catch (e) { console.warn('[VocabMaster] stats not saved', e); }
            achieve();
        }
    }
    function endPractice(title, text, words, stars) {
        const t = T();
        showEnd({ trophy: stars >= 3 ? '🏆' : stars === 2 ? '⭐' : '💪', title, text, words, stars, note: t.practiceNote });
    }

    // ---- practice formats (do not touch the saved boxes): match pairs, memory, lightning round ----
    function startPractice(mode) {
        S.queue = []; S.study = null; S.check = null; S.done = 0; S.streak = 0; S.shownStreak = 0;
        show('vm-play');
        if (mode === 'match') return renderMatch();
        if (mode === 'memory') return renderMemory();
        return renderLightning();
    }
    function mistakeFeedback(fb, w, mode, chosen) { fb.className = 'vm-fb bad'; renderFeedback(fb, w, mode, chosen); }

    /** Tap a word, then its meaning (or the other way round). */
    function renderMatch() {
        const t = T(), c = $('vm-card'); c.textContent = ''; enter(c);
        const words = VL.pickPracticeWords(S.pack.words, CFG.matchPairs), m = VL.buildMatch(words);
        S.total = words.length; S.done = 0; progress(); setHelp(() => t.helpPairs);
        let sel = null, misses = 0;
        const fb = el('p', 'vm-fb'); fb.id = 'vm-match-fb';
        const head = qhead(1, 1, t.matchTitle), stat = head.querySelector('.vm-qnum');
        const paintStat = () => { stat.textContent = VL.fill(t.pairsLeft, { n: S.done, m: S.total }); };
        paintStat();
        const mk = (side, w) => {
            const b = el('button', 'vm-pm ' + side); b.type = 'button'; b.dataset.w = w.w; b.dataset.side = side;
            if (side === 'left') b.append(el('span', 'vm-pic-s', w.i), el('span', 'vm-pm-t', w.w)); else b.append(el('span', 'vm-pm-t', w.t));
            b.onclick = () => pick(side, w, b); return b;
        };
        const lcol = el('div', 'vm-col'), rcol = el('div', 'vm-col'), btns = new Map();
        m.left.forEach(w => { const b = mk('left', w); btns.set('left' + w.w, b); lcol.appendChild(b); });
        m.right.forEach(w => { const b = mk('right', w); btns.set('right' + w.w, b); rcol.appendChild(b); });
        const pick = (side, w, b) => {
            if (b.disabled) return;
            if (!sel || sel.side === side) { if (sel) sel.b.classList.remove('sel'); sel = { side, w, b }; b.classList.add('sel'); if (side === 'left') speak(w.w); return; }
            const other = sel; sel.b.classList.remove('sel'); sel = null;
            const lw = side === 'left' ? w : other.w, rw = side === 'right' ? w : other.w;
            if (lw === rw) {
                [b, other.b].forEach(x => { x.disabled = true; x.classList.add('ok'); });
                S.streak++; S.best = Math.max(S.best, S.streak); S.done++; progress(); paintStat(); fxOk(b, true); speak(lw.w);
                fb.className = 'vm-fb ok'; fb.textContent = `${lw.i} ${lw.w} = ${lw.t}`;
                if (S.done === S.total) later(() => endPractice(t.practiceDone, VL.fill(t.matchResult, { n: misses }), words, misses <= 1 ? 3 : misses <= 3 ? 2 : 1), 900);
            } else {
                misses++; S.streak = 0; paintStreak(); fxBad(b, true);
                const first = other.side === 'left'; // started from a word: the chosen meaning belongs to another word
                if (first) mistakeFeedback(fb, other.w, 'choice', w); else mistakeFeedback(fb, other.w, 'back', w);
            }
        };
        const cols = el('div', 'vm-cols'); cols.append(lcol, rcol);
        c.append(head, area(t.zMatch, cols), fb);
    }

    /** Memory: flip two cards (word + picture with its meaning); matching pairs stay open. */
    function renderMemory() {
        const t = T(), c = $('vm-card'); c.textContent = ''; enter(c);
        const words = VL.pickPracticeWords(S.pack.words, CFG.memoryPairs), deck = VL.buildMemoryDeck(words);
        S.total = words.length; S.done = 0; progress(); setHelp(() => t.helpMemory);
        let open = [], lock = false, moves = 0;
        const fb = el('p', 'vm-fb'); fb.id = 'vm-mem-fb';
        const head = qhead(1, 1, t.memoryTitle), stat = head.querySelector('.vm-qnum');
        const paintStat = () => { stat.textContent = VL.fill(t.pairsLeft, { n: S.done, m: S.total }) + ' · ' + VL.fill(t.moves, { n: moves }); };
        paintStat();
        const grid = el('div', 'vm-memgrid');
        deck.forEach(cd => {
            const b = el('button', 'vm-mem'); b.type = 'button'; b.dataset.pair = String(cd.pair); b.dataset.kind = cd.kind; b.setAttribute('aria-label', '?');
            const back = el('span', 'vm-memface vm-memback', '❓');
            const face = el('span', 'vm-memface vm-memfront');
            if (cd.kind === 'word') face.append(el('span', 'vm-word-s', cd.word.w));
            else face.append(el('span', 'vm-pic-s', cd.word.i), el('span', 'vm-pm-t', cd.word.t));
            b.append(back, face);
            b.onclick = () => {
                if (lock || b.classList.contains('flipped') || b.classList.contains('ok')) return;
                b.classList.add('flipped'); b.setAttribute('aria-label', cd.kind === 'word' ? cd.word.w : cd.word.i + ' ' + cd.word.t);
                if (cd.kind === 'word') speak(cd.word.w);
                open.push({ b, cd });
                if (open.length < 2) return;
                moves++; const [a, z] = open; open = [];
                if (a.cd.pair === z.cd.pair) {
                    [a.b, z.b].forEach(x => x.classList.add('ok'));
                    S.done++; S.streak++; S.best = Math.max(S.best, S.streak); progress(); fxOk(b, true);
                    fb.className = 'vm-fb ok'; fb.textContent = `${cd.word.i} ${cd.word.w} = ${cd.word.t}`; paintStat();
                    if (S.done === S.total) later(() => endPractice(t.practiceDone, VL.fill(t.memResult, { n: moves }), words, moves <= words.length + 3 ? 3 : moves <= words.length * 2 + 2 ? 2 : 1), 900);
                } else {
                    lock = true; S.streak = 0; paintStreak(); fxBad(b, true); paintStat();
                    later(() => { [a.b, z.b].forEach(x => { x.classList.remove('flipped'); x.setAttribute('aria-label', '?'); }); lock = false; }, CFG.flipBack);
                }
            };
            grid.appendChild(b);
        });
        c.append(head, area(t.zMemory, grid), fb);
    }

    /** Lightning round: quick questions against a soft timer. Time running out ends the round kindly, nothing is lost. */
    function renderLightning() {
        const t = T(), L = S.light = { score: 0, t0: Date.now(), dur: CFG.lightning, over: false, last: null, shown: 0, used: [] };
        S.total = L.dur; S.done = 0; setHelp(() => t.helpLightning);
        const c = $('vm-card'); c.textContent = ''; enter(c);
        $('vm-count').textContent = VL.fill(t.lightScore, { n: 0 });
        $('vm-barfill').style.width = '100%'; paintStreak();
        const tick = () => {
            if (!S.light || L.over) return;
            const left = Math.max(0, L.dur - (Date.now() - L.t0) / 1000);
            $('vm-barfill').style.width = (left / L.dur * 100) + '%';
            $('vm-barfill').parentNode.classList.toggle('soft-low', left < 10);
            const sec = Math.ceil(left), tm = $('vm-lighttime'); if (tm) tm.textContent = VL.fill(t.timeLeft, { n: sec });
            if (left <= 5 && left > 0 && sec !== L.shown) { L.shown = sec; const j = J(); if (j) j.tick(); }
            if (left <= 0) endLightning();
        };
        S.timers.push(window.setInterval(tick, 100));
        lightQuestion();
    }
    function lightQuestion() {
        const L = S.light; if (!L || L.over) return;
        const t = T(), c = $('vm-card'); c.textContent = ''; enter(c);
        let w; do { w = S.pack.words[Math.floor(Math.random() * S.pack.words.length)]; } while (w === L.last && S.pack.words.length > 1);
        L.last = w; L.used.push(w);
        const back = Math.random() < .4, field = back ? 'w' : 't', fb = el('p', 'vm-fb');
        const head = qhead(1, 1, t.lightningTitle); head.querySelector('.vm-qnum').remove();
        const tm = el('span', 'vm-qnum vm-lighttime', VL.fill(t.timeLeft, { n: Math.ceil(Math.max(0, L.dur - (Date.now() - L.t0) / 1000)) })); tm.id = 'vm-lighttime';
        head.prepend(tm);
        const pr = prompt(el('div', 'vm-emoji vm-big', w.i), back ? el('p', 'vm-trans', w.t) : el('p', 'vm-word', w.w));
        const pool = shuffle(S.pack.words.filter(x => x !== w && x[field] !== w[field])).slice(0, 3);
        const wrap = optionList(shuffle([w].concat(pool)), (b, o) => { b.textContent = o[field]; }, (o, b) => {
            if (L.over) return; lockOptions(wrap, w);
            if (o === w) { L.score++; S.streak++; S.best = Math.max(S.best, S.streak); fxOk(b, true); $('vm-count').textContent = VL.fill(t.lightScore, { n: L.score }); paintStreak(); later(lightQuestion, CFG.nextLight); }
            else { S.streak = 0; paintStreak(); b.classList.add('bad'); fxBad(b, true); fb.className = 'vm-fb bad'; fb.textContent = `${w.i} ${w.w} = ${w.t}`; later(lightQuestion, 900); }
        });
        c.append(head, pr, area(t.zChoose, wrap), fb);
    }
    function endLightning() {
        const L = S.light; if (!L || L.over) return; L.over = true;
        const t = T(), secs = Math.round(L.dur), words = [...new Set(L.used)].slice(0, 12), score = L.score;
        stopTimers(); $('vm-barfill').parentNode.classList.remove('soft-low');
        endPractice(t.timeUp, VL.fill(t.lightResult, { n: score, s: secs }), words, score >= 8 ? 3 : score >= 4 ? 2 : 1);
    }

    const NAMES = { vm_first: ['🌱', 'Primera palabra', 'First word', 'Lehen hitza'], vm_perfect: ['💯', 'Ronda perfecta', 'Perfect round', 'Txanda perfektua'],
        vm_streak10: ['🔥', 'Imparable', 'Unstoppable', 'Geldiezina'], vm_learn25: ['📘', '25 palabras', '25 words', '25 hitz'], vm_explorer: ['🧭', 'Explorador', 'Explorer', 'Esploratzailea'],
        vm_master: ['🎓', 'Tema dominado', 'Topic mastered', 'Gaia menperatuta'], vm_learn100: ['🏅', '100 palabras', '100 words', '100 hitz'], vm_legend: ['👑', 'Políglota', 'Polyglot', 'Poliglota'] };
    async function achieve() {
        if (!S.user || typeof PlatformFirestore === 'undefined' || !PlatformFirestore.unlockAchievement) return;
        const learned = Object.values(S.prog).reduce((n, p) => n + Object.values(p).filter(x => x.b >= 3).length, 0);
        const got = ['vm_first'];
        if (S.ok1 === S.total) got.push('vm_perfect');
        if (S.best >= 10) got.push('vm_streak10');
        if (learned >= 25) got.push('vm_learn25');
        if (learned >= 100) got.push('vm_learn100');
        if (learned >= 250) got.push('vm_legend');
        if (Object.keys(S.prog).length >= 3) got.push('vm_explorer');
        if (S.pack.words.every(w => ((wp(S.pack.id, w.w) || {}).b || 0) >= 4)) got.push('vm_master');
        try {
            const have = (await PlatformFirestore.getAchievements(S.user.uid, 'vocabMaster')).unlockedAchievements || [];
            for (const id of got.filter(i => !have.includes(i))) {
                await PlatformFirestore.unlockAchievement(S.user.uid, 'vocabMaster', id);
                const n = NAMES[id], li = { es: 1, en: 2, eu: 3 }[uiLang()] || 1;
                if (window.PlatformHeader && PlatformHeader.showToast) PlatformHeader.showToast('🏆 ' + n[0] + ' ' + n[li], 'success', 4500);
            }
        } catch (e) { console.warn('[VocabMaster] achievements not saved', e); }
    }

    /** Keyboard: 1-4 answer, Esc leaves; Enter continues through the focused button (Next, Check). */
    function onKey(e) {
        if ($('vm-play').hidden || e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.key === 'Escape') { e.preventDefault(); $('vm-quit').click(); return; }
        if (/^[1-9]$/.test(e.key) && !(e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName))) {
            const b = [...$('vm-card').querySelectorAll('.vm-opt')].find(x => x.dataset.i === String(Number(e.key) - 1));
            if (b && !b.disabled) { e.preventDefault(); b.click(); }
        }
    }
    function paintStatic() {
        const t = T();
        $('vm-quit').textContent = t.quit;
        const h = $('vm-help'); h.textContent = '💡 ' + t.help; h.setAttribute('aria-label', t.help);
    }

    function init() {
        $('vm-quit').onclick = () => { if (window.speechSynthesis) speechSynthesis.cancel(); renderHome(); show('vm-home'); };
        $('vm-again').onclick = () => start(S.index.packs.find(p => p.id === S.pack.id));
        $('vm-home-btn').onclick = () => { renderHome(); show('vm-home'); };
        $('vm-help').onclick = toggleHelp;
        const j = J(); if (j && j.mountSoundToggle) j.mountSoundToggle($('vm-tools'));
        document.addEventListener('keydown', onKey);
        paintStatic();
        const onUser = u => { S.user = u || null; loadProg(); if (S.index) { renderHome(); } };
        loadIndex().then(() => {
            loadProg(); renderHome(); show('vm-home');
            if (window.PlatformAuth && PlatformAuth.onAuthStateChanged) PlatformAuth.onAuthStateChanged(onUser);
        }).catch(e => { console.error(e); });
        window.addEventListener('platformLanguageChanged', () => { paintStatic(); relocalize(); if (S.index) renderHome(); });
    }
    return { init, _S: S, _cfg: CFG, _force(k) { S.force = k; } };
})();
