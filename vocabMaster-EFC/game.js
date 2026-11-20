/**
 * VocabMaster: data-driven vocabulary trainer.
 * Packs live in vocab/<lang>/<topic>.json and are listed in vocab/index.json,
 * so adding a topic or a language never needs code changes.
 * Method: Leitner spaced repetition (6 boxes) + exercises that get harder with the box:
 *   new word -> intro card, box 0-1 -> multiple choice, box 2 -> listen and choose, box 3+ -> type it.
 * Progress is stored per player on this device (guest, adult or child profile).
 */
const VocabMaster = (() => {
    const ROUND = 10, MAX_NEW = 5, MAX_BOX = 5, LEARNED_BOX = 4;
    const DAYS = [0, 1, 3, 7, 14, 30];

    const UI = {
        es: { sub: 'Aprende palabras con repaso espaciado: las que fallas vuelven antes.', pick: 'Elige un tema',
              words: 'palabras', learned: 'aprendidas', quit: 'Salir', listen: '🔊 Escuchar', gotit: 'Entendido',
              next: 'Siguiente', check: 'Comprobar', newWord: 'Palabra nueva', choose: '¿Qué significa?',
              chooseBack: '¿Cómo se dice en inglés?', hear: 'Escucha y elige el significado', type: 'Escríbelo en inglés',
              ok: '¡Correcto!', bad: 'Era: ', again: 'Otra ronda', home: 'Temas', end: 'Ronda terminada',
              score: (a, b) => `${a} de ${b} a la primera`, review: 'Para repasar', saved: 'Tu progreso se guarda en este dispositivo.',
              none: 'No hay nada que repasar ahora: ¡vuelve mañana!', place: 'Escribe aquí', lang: 'Idioma a aprender',
              due: 'por repasar' },
        en: { sub: 'Learn words with spaced repetition: the ones you miss come back sooner.', pick: 'Pick a topic',
              words: 'words', learned: 'learned', quit: 'Quit', listen: '🔊 Listen', gotit: 'Got it',
              next: 'Next', check: 'Check', newWord: 'New word', choose: 'What does it mean?',
              chooseBack: 'How do you say it?', hear: 'Listen and choose the meaning', type: 'Type it',
              ok: 'Correct!', bad: 'It was: ', again: 'Another round', home: 'Topics', end: 'Round finished',
              score: (a, b) => `${a} of ${b} first time`, review: 'To review', saved: 'Your progress is saved on this device.',
              none: 'Nothing to review right now: come back tomorrow!', place: 'Type here', lang: 'Language to learn',
              due: 'to review' },
        eu: { sub: 'Ikasi hitzak tarteko errepasoarekin: huts egiten dituzunak lehenago itzultzen dira.', pick: 'Aukeratu gai bat',
              words: 'hitz', learned: 'ikasita', quit: 'Irten', listen: '🔊 Entzun', gotit: 'Ulertu dut',
              next: 'Hurrengoa', check: 'Egiaztatu', newWord: 'Hitz berria', choose: 'Zer esan nahi du?',
              chooseBack: 'Nola esaten da?', hear: 'Entzun eta aukeratu esanahia', type: 'Idatzi ezazu',
              ok: 'Zuzena!', bad: 'Hau zen: ', again: 'Beste txanda bat', home: 'Gaiak', end: 'Txanda amaitu da',
              score: (a, b) => `${b}tik ${a} lehen aldiz`, review: 'Errepasatzeko', saved: 'Zure aurrerapena gailu honetan gordetzen da.',
              none: 'Ez dago ezer errepasatzeko orain: bihar itzuli!', place: 'Idatzi hemen', lang: 'Ikasteko hizkuntza',
              due: 'errepasatzeko' }
    };

    const S = { index: null, lang: null, pack: null, user: null, prog: {}, queue: [], total: 0, done: 0,
                ok1: 0, attempts: 0, streak: 0, best: 0, t0: 0, missed: [], seen: [], current: null };
    const $ = id => document.getElementById(id);
    const uiLang = () => ((window.PlatformI18n && PlatformI18n.currentLanguage) || 'es').slice(0, 2);
    const T = () => UI[uiLang()] || UI.es;
    const nm = o => o[uiLang()] || o.es || o.en;
    const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]/g, '').replace(/\s+/g, ' ').trim();
    const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

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
    async function loadIndex() {
        const r = await fetch('vocab/index.json'); S.index = await r.json();
        if (!S.lang) S.lang = Object.keys(S.index.langs)[0];
    }
    async function loadPack(meta) {
        const r = await fetch('vocab/' + meta.file); const p = await r.json();
        p.words = p.words.map(a => ({ w: a[0], t: a[1], i: a[2], e: a[3] })); return p;
    }

    // ---- home ----
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
        const box = $('vm-packs'); box.textContent = '';
        S.index.packs.filter(p => p.lang === S.lang).forEach(p => {
            const pr = S.prog[p.id] || {}, vals = Object.values(pr);
            const learned = vals.filter(v => v.b >= LEARNED_BOX).length;
            const due = vals.filter(v => v.d <= Date.now()).length;
            const b = el('button', 'vm-pack'); b.type = 'button';
            b.append(el('span', 'vm-pack-ico', p.icon), el('span', 'vm-pack-name', nm(p.name)),
                el('span', 'vm-pack-meta', `${learned}/${p.count} ${t.learned}` + (due ? ` · ${due} ${t.due}` : '')));
            const m = el('div', 'vm-meter'), f = el('i'); f.style.width = Math.round(learned / p.count * 100) + '%'; m.appendChild(f); b.appendChild(m);
            b.onclick = () => start(p); box.appendChild(b);
        });
    }
    function show(id) { ['vm-home', 'vm-play', 'vm-end'].forEach(s => { $(s).hidden = s !== id; }); window.scrollTo(0, 0); }

    // ---- session ----
    async function start(meta) {
        S.pack = await loadPack(meta);
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
        Object.assign(S, { total: S.queue.length, done: 0, ok1: 0, attempts: 0, streak: 0, best: 0, t0: Date.now(), missed: [], seen: [] });
        show('vm-play'); next();
    }
    function progress() {
        $('vm-barfill').style.width = Math.round(S.done / S.total * 100) + '%';
        $('vm-count').textContent = `${S.done}/${S.total}`;
    }
    function speak(text) {
        if (!('speechSynthesis' in window)) return;
        try {
            speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text); u.lang = S.index.langs[S.pack.lang].tts || S.pack.lang; u.rate = .85;
            speechSynthesis.speak(u);
        } catch (e) {}
    }
    const canSpeak = () => 'speechSynthesis' in window;

    function kindFor(item) {
        if (item.isNew && item.tries === 0 && !item.introDone) return 'intro';
        const b = (wp(S.pack.id, item.w.w) || { b: 0 }).b;
        if (item.tries > 0 || b <= 1) return Math.random() < .5 ? 'choice' : 'choiceBack';
        if (b === 2) return canSpeak() ? 'listen' : 'choice';
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
        const kind = kindFor(item), t = T(), c = $('vm-card'); c.textContent = '';
        const w = item.w;
        if (kind === 'intro') {
            c.append(el('span', 'vm-kind', t.newWord), el('div', 'vm-emoji', w.i), el('p', 'vm-word', w.w),
                el('p', 'vm-trans', w.t), el('p', 'vm-ex', '“' + w.e + '”'));
            if (canSpeak()) { const l = el('button', 'vm-listen', t.listen); l.type = 'button'; l.onclick = () => speak(w.w); c.appendChild(l); }
            const b = el('button', 'vm-btn', t.gotit); b.type = 'button';
            b.onclick = () => { item.introDone = true; next(); }; c.appendChild(b);
            speak(w.w); b.focus(); return;
        }
        if (kind === 'type') return renderType(item, c, t);
        const back = kind === 'choiceBack', listen = kind === 'listen';
        c.appendChild(el('span', 'vm-kind', listen ? t.hear : back ? t.chooseBack : t.choose));
        if (back) { c.append(el('div', 'vm-emoji', w.i), el('p', 'vm-trans', w.t)); }
        else {
            c.append(el('div', 'vm-emoji', listen ? '🔊' : w.i));
            if (!listen) c.appendChild(el('p', 'vm-word', w.w));
            const l = el('button', 'vm-listen', t.listen); l.type = 'button'; l.onclick = () => speak(w.w); if (canSpeak()) c.appendChild(l);
            if (listen) speak(w.w);
        }
        const field = back ? 'w' : 't';
        const opts = shuffle([w].concat(distractors(item, field)));
        const wrap = el('div', 'vm-opts'); const fb = el('p', 'vm-fb');
        opts.forEach(o => {
            const b = el('button', 'vm-opt', o[field]); b.type = 'button';
            b.onclick = () => {
                const good = o === w;
                wrap.querySelectorAll('button').forEach(x => { x.disabled = true; if (x.textContent === w[field]) x.classList.add('ok'); });
                if (!good) b.classList.add('bad');
                answer(item, good, fb, w);
            };
            wrap.appendChild(b);
        });
        c.append(wrap, fb);
    }
    function renderType(item, c, t) {
        const w = item.w;
        c.append(el('span', 'vm-kind', t.type), el('div', 'vm-emoji', w.i), el('p', 'vm-trans', w.t));
        if (canSpeak()) { const l = el('button', 'vm-listen', t.listen); l.type = 'button'; l.onclick = () => speak(w.w); c.appendChild(l); }
        const inp = el('input', 'vm-input'); inp.type = 'text'; inp.autocomplete = 'off'; inp.autocapitalize = 'none';
        inp.spellcheck = false; inp.placeholder = t.place; inp.setAttribute('aria-label', t.type);
        const fb = el('p', 'vm-fb'); const btn = el('button', 'vm-btn', t.check); btn.type = 'button';
        const go = () => {
            if (inp.disabled || !inp.value.trim()) return;
            const good = norm(inp.value) === norm(w.w);
            inp.disabled = true; inp.classList.add(good ? 'ok' : 'bad'); btn.hidden = true;
            answer(item, good, fb, w);
        };
        btn.onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') go(); };
        c.append(inp, btn, fb); inp.focus();
    }
    function answer(item, good, fb, w) {
        const t = T(); S.attempts++;
        const first = item.tries === 0;
        fb.className = 'vm-fb ' + (good ? 'ok' : 'bad');
        fb.textContent = good ? t.ok : t.bad + w.w + ' = ' + w.t;
        const cur = (wp(S.pack.id, w.w) || { b: 0 }).b;
        if (good) { S.streak++; S.best = Math.max(S.best, S.streak); speak(w.w); }
        else { S.streak = 0; if (first) S.missed.push(w); }
        if (first) {
            setWp(S.pack.id, w.w, good ? Math.min(MAX_BOX, cur + 1) : 0);
            if (good) S.ok1++;
            if (!S.seen.includes(w)) S.seen.push(w);
        }
        S.queue.shift();
        if (good) S.done++; else { item.tries++; S.queue.push(item); }
        const b = el('button', 'vm-btn', t.next); b.type = 'button'; b.onclick = next;
        $('vm-card').appendChild(b); b.focus();
        progress();
    }

    async function finish() {
        const t = T(), pct = S.ok1 / S.total;
        $('vm-trophy').textContent = pct >= .8 ? '🏆' : pct >= .5 ? '⭐' : '💪';
        $('vm-endtitle').textContent = t.end; $('vm-endtext').textContent = t.score(S.ok1, S.total);
        const list = $('vm-endlist'); list.textContent = '';
        S.seen.forEach(w => list.appendChild(el('span', 'vm-tag' + (S.missed.includes(w) ? ' miss' : ''), `${w.i} ${w.w} = ${w.t}`)));
        $('vm-again').textContent = t.again; $('vm-home-btn').textContent = t.home;
        show('vm-end');
        if (S.user && typeof PlatformFirestore !== 'undefined') {
            try {
                await PlatformFirestore.updateGameStats(S.user.uid, 'vocabmaster', {
                    correctAnswers: S.ok1, totalQuestions: S.total, totalAttempts: S.attempts, bestStreak: S.best,
                    elapsedSeconds: Math.round((Date.now() - S.t0) / 1000), level: 1, operation: S.pack.id });
            } catch (e) { console.warn('[VocabMaster] stats not saved', e); }
        }
    }

    function init() {
        document.getElementById('vm-quit').onclick = () => { if (window.speechSynthesis) speechSynthesis.cancel(); renderHome(); show('vm-home'); };
        $('vm-again').onclick = () => start(S.index.packs.find(p => p.id === S.pack.id));
        $('vm-home-btn').onclick = () => { renderHome(); show('vm-home'); };
        const quit = $('vm-quit'); quit.textContent = T().quit;
        const onUser = u => { S.user = u || null; loadProg(); if (S.index) { renderHome(); } };
        loadIndex().then(() => {
            loadProg(); renderHome(); show('vm-home');
            if (window.PlatformAuth && PlatformAuth.onAuthStateChanged) PlatformAuth.onAuthStateChanged(onUser);
        }).catch(e => { console.error(e); });
        window.addEventListener('platformLanguageChanged', () => { $('vm-quit').textContent = T().quit; if (S.index) renderHome(); });
    }
    return { init };
})();
