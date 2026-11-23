/**
 * TypeMaster - dynamic layer.
 *  - game screen: labelled zones ("Nivel 3 · Letra 12 de 40"), always visible help, sound toggle, streak, soft Juice on words
 *  - two new mini modes (no game over, not scored on the platform): "Lluvia de letras" (falling letters, soft timer)
 *    and "Letra que falta" (coloured answer buttons, "Pregunta N de M")
 * The typing levels, their scoring and the saved best WPM are untouched.
 */
const TyDyn = (() => {
    'use strict';
    const L = {
        es: { lvl: 'Nivel', ch: (i, n) => `Letra ${i} de ${n}`, qn: (i, n) => `Pregunta ${i} de ${n}`, zText: 'Escribe este texto', zPop: 'Pulsa o toca la letra', zPick: 'Elige la letra', help: 'Ayuda', streak: 'Racha', rain: 'Lluvia de letras', rainSub: 'Atrapa las letras antes de que caigan', miss: 'Letra que falta', missSub: 'Completa la palabra', time: 'Tiempo', score: 'Letras', done: 'Ronda terminada', again: 'Otra vez', menu: 'Menú', next: 'Continuar', word: 'La palabra es', rainHelp: (c, f) => `Letra ${c}: dedo ${f}`, missHelp: f => `La letra que falta va con el dedo ${f}`, mini: 'Minijuegos', quit: 'Salir' },
        en: { lvl: 'Level', ch: (i, n) => `Letter ${i} of ${n}`, qn: (i, n) => `Question ${i} of ${n}`, zText: 'Type this text', zPop: 'Press or tap the letter', zPick: 'Pick the letter', help: 'Help', streak: 'Streak', rain: 'Letter rain', rainSub: 'Catch the letters before they fall', miss: 'Missing letter', missSub: 'Complete the word', time: 'Time', score: 'Letters', done: 'Round over', again: 'Again', menu: 'Menu', next: 'Continue', word: 'The word is', rainHelp: (c, f) => `Letter ${c}: ${f}`, missHelp: f => `The missing letter uses the ${f}`, mini: 'Mini games', quit: 'Quit' },
        eu: { lvl: 'Maila', ch: (i, n) => `${n}tik ${i}. letra`, qn: (i, n) => `${n}tik ${i}. galdera`, zText: 'Idatzi testu hau', zPop: 'Sakatu edo ukitu letra', zPick: 'Aukeratu letra', help: 'Laguntza', streak: 'Erreta', rain: 'Letra euria', rainSub: 'Harrapatu letrak erori baino lehen', miss: 'Falta den letra', missSub: 'Osatu hitza', time: 'Denbora', score: 'Letrak', done: 'Txanda amaitu da', again: 'Berriro', menu: 'Menua', next: 'Jarraitu', word: 'Hitza hau da', rainHelp: (c, f) => `${c} letra: ${f}`, missHelp: f => `Falta den letra hatz honekin doa: ${f}`, mini: 'Mini jokoak', quit: 'Irten' },
        gl: { lvl: 'Nivel', ch: (i, n) => `Letra ${i} de ${n}`, qn: (i, n) => `Pregunta ${i} de ${n}`, zText: 'Escribe este texto', zPop: 'Preme ou toca a letra', zPick: 'Elixe a letra', help: 'Axuda', streak: 'Racha', rain: 'Chuvia de letras', rainSub: 'Colle as letras antes de que caian', miss: 'Letra que falta', missSub: 'Completa a palabra', time: 'Tempo', score: 'Letras', done: 'Rolda rematada', again: 'Outra vez', menu: 'Menú', next: 'Continuar', word: 'A palabra é', rainHelp: (c, f) => `Letra ${c}: dedo ${f}`, missHelp: f => `A letra que falta vai co dedo ${f}`, mini: 'Minixogos', quit: 'Saír' },
        ca: { lvl: 'Nivell', ch: (i, n) => `Lletra ${i} de ${n}`, qn: (i, n) => `Pregunta ${i} de ${n}`, zText: 'Escriu aquest text', zPop: 'Prem o toca la lletra', zPick: 'Tria la lletra', help: 'Ajuda', streak: 'Ratxa', rain: 'Pluja de lletres', rainSub: 'Atrapa les lletres abans que caiguin', miss: 'Lletra que falta', missSub: 'Completa la paraula', time: 'Temps', score: 'Lletres', done: 'Ronda acabada', again: 'Un altre cop', menu: 'Menú', next: 'Continua', word: 'La paraula és', rainHelp: (c, f) => `Lletra ${c}: dit ${f}`, missHelp: f => `La lletra que falta va amb el dit ${f}`, mini: 'Minijocs', quit: 'Surt' },
        fr: { lvl: 'Niveau', ch: (i, n) => `Lettre ${i} sur ${n}`, qn: (i, n) => `Question ${i} sur ${n}`, zText: 'Écris ce texte', zPop: 'Appuie ou touche la lettre', zPick: 'Choisis la lettre', help: 'Aide', streak: 'Série', rain: 'Pluie de lettres', rainSub: 'Attrape les lettres avant qu\'elles tombent', miss: 'Lettre manquante', missSub: 'Complète le mot', time: 'Temps', score: 'Lettres', done: 'Manche terminée', again: 'Encore', menu: 'Menu', next: 'Continuer', word: 'Le mot est', rainHelp: (c, f) => `Lettre ${c} : ${f}`, missHelp: f => `La lettre manquante se tape avec : ${f}`, mini: 'Mini-jeux', quit: 'Quitter' }
    };
    const G = () => (typeof TypeMasterGame !== 'undefined' ? TypeMasterGame : null);
    const lang = () => { const g = G(); const l = String((g && g.state && g.state.lang) || 'es').slice(0, 2); return L[l] ? l : 'es'; };
    const T = () => L[lang()];
    const fullLang = () => { const g = G(); return (g && g.state && g.state.lang) || 'es-ES'; };
    const $ = id => document.getElementById(id);
    function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    const J = () => (typeof Juice !== 'undefined' ? Juice : null);
    const SHAPES = ['▲', '◆', '●', '■'];
    const reduced = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
    const S = { mode: null, run: null, streak: 0, wordOk: true, wordLen: 0, wordStreak: 0, fmt: null, rainMs: 45000 };

    // ---------- game screen ----------
    function fingerTxt(ch) {
        if (typeof TypingLesson === 'undefined') return '';
        const fi = TypingLesson.fingerOf(ch); return fi < 0 ? '' : TypingLesson.fingerName(fullLang(), fi);
    }
    function paint() {
        const g = G(), st = g.state, t = T();
        $('tyd-qn').textContent = `${t.lvl} ${st.level} · ${t.ch(Math.min(st.pos + 1, st.chars.length), st.chars.length)}`;
        const sk = $('tyd-streak'); sk.textContent = '🔥 ' + S.streak; sk.classList.toggle('hot', S.streak >= 10);
        $('tyd-help').textContent = '💡 ' + t.help; $('tyd-help').setAttribute('aria-label', t.help);
        const zq = $('tyd-zq'); if (!zq.firstChild) { zq.appendChild(el('span', 'tyd-zi', '✍️')); zq.appendChild(el('span', null, t.zText)); } else zq.lastChild.textContent = t.zText;
    }
    function onBegin() { S.streak = 0; S.wordOk = true; S.wordLen = 0; S.wordStreak = 0; const h = $('tyd-hint'); if (h) { h.textContent = ''; h.hidden = true; } paint(); }
    function onKey(ok, ch) {
        const j = J(), g = G(), st = g.state;
        if (ok) S.streak++; else S.streak = 0;
        if (ch === ' ' || st.pos >= st.chars.length) {
            if (ch !== ' ' && ok) S.wordLen++;
            if (S.wordOk && S.wordLen > 0) { S.wordStreak++; if (j) { j.sfx('pop'); if (S.wordStreak % 3 === 0) { const sp = document.querySelector('#ty-text-display .ty-char[data-idx="' + Math.max(0, st.pos - 1) + '"]'); j.correct(sp || $('ty-text-display'), { streak: S.wordStreak }); } } }
            if (!S.wordOk) S.wordStreak = 0;
            S.wordOk = true; S.wordLen = 0;
        } else if (ok) S.wordLen++;
        if (!ok) { S.wordOk = false; if (j) j.wrong($('ty-text-display'), { silent: true }); }
        paint();
    }
    function showHint() {
        const g = G(), st = g && g.state; if (!st || !st.chars.length) return;
        const cur = st.chars[Math.min(st.pos, st.chars.length - 1)], f = fingerTxt(cur.char), h = $('tyd-hint');
        h.textContent = f ? '💡 ' + T().rainHelp(cur.char === ' ' ? 'ESP' : cur.char.toUpperCase(), f) : '💡 ' + (cur.char || '');
        h.hidden = false;
    }
    function stars(box, n, total) {
        box.textContent = '';
        for (let i = 0; i < total; i++) { const s = el('span', 'tyd-star' + (i < n ? ' on' : ''), i < n ? '★' : '☆'); s.style.setProperty('--d', (i * 0.45) + 's'); box.appendChild(s); }
    }
    function onResults(n) {
        const box = $('ty-stars'); if (!box) return;
        stars(box, n, 3); box.setAttribute('aria-label', n + ' / 3');
        const j = J(); if (j && n >= 2) setTimeout(() => j.levelUp(box), 500);
    }

    // ---------- mini modes ----------
    function poolFor(level) {
        let keys = 'asdfghjklñ'.split('');
        if (level >= 2) keys = keys.concat('qwertyuiopzxcvbnm'.split(''));
        return keys;
    }
    function fingerColor(ch) { const fi = typeof TypingLesson !== 'undefined' ? TypingLesson.fingerOf(ch) : -1; return fi >= 0 && TypingLesson.FINGER_COLORS ? TypingLesson.FINGER_COLORS[fi] : '#6366f1'; }
    function open(mode) {
        const g = G(); if (!g) return;
        stop(); S.mode = mode; S.streak = 0;
        const lvl = g.state.selectedLevel || 1, t = T();
        S.run = { mode, level: lvl, n: 0, total: mode === 'miss' ? 10 : 0, right: 0, best: 0, pool: poolFor(lvl), drops: [], over: false, timers: [], locked: false };
        $('tym-end').hidden = true; $('tym-fb').hidden = true; $('tym-stage').textContent = ''; $('tym-card').textContent = '';
        $('tym-hint').hidden = true;
        $('tym-help').textContent = '💡 ' + t.help; $('tym-quit').setAttribute('aria-label', t.quit);
        g._showScreen('ty-mini');
        document.addEventListener('keydown', onMiniKey);
        if (mode === 'rain') startRain(); else nextMiss();
    }
    function stop() {
        const r = S.run; if (r) { r.over = true; r.timers.forEach(clearTimeout); r.timers = []; if (r.raf) clearInterval(r.raf); }
        document.removeEventListener('keydown', onMiniKey);
    }
    function exit() { stop(); S.run = null; const g = G(); g._showHome(); }
    function zones(icon, text, mode) {
        const t = T(), zq = $('tym-zq'); zq.textContent = ''; zq.appendChild(el('span', 'tyd-zi', mode === 'rain' ? '🌧️' : '🔤')); zq.appendChild(el('span', null, mode === 'rain' ? t.rain : t.miss));
        const za = $('tym-za'); za.textContent = ''; za.appendChild(el('span', 'tyd-zi', icon)); za.appendChild(el('span', null, text));
    }
    function setStreakBox() { const b = $('tym-streak'); b.textContent = '🔥 ' + S.streak; b.classList.toggle('hot', S.streak >= 5); }

    // --- letter rain ---
    function startRain() {
        const r = S.run, t = T(), card = $('tym-card'), stage = $('tym-stage');
        zones('⌨️', t.zPop, 'rain');
        const sky = el('div', 'tyd-sky'); sky.id = 'tym-sky'; sky.setAttribute('role', 'group'); sky.setAttribute('aria-label', t.rain); card.appendChild(sky);
        const bar = $('tym-bar'); bar.style.transition = 'none'; bar.style.width = '100%'; void bar.offsetWidth;
        r.t0 = Date.now(); r.dur = S.rainMs;
        bar.style.transition = 'width ' + (r.dur / 1000) + 's linear'; bar.style.width = '0%';
        $('tym-qn').textContent = t.rain;
        r.score = 0; paintRain();
        spawn(); r.timers.push(setTimeout(spawn, 700));
        r.raf = setInterval(() => {
            if (r.over) return;
            const left = Math.max(0, r.dur - (Date.now() - r.t0));
            $('tym-time').textContent = '⏱ ' + Math.ceil(left / 1000);
            if (left <= 0) endRain(); else if (r.drops.filter(d => !d.gone).length < 5 && Math.random() < 0.35) spawn();
        }, 450);
        stage.textContent = '';
    }
    function paintRain() { const r = S.run; $('tym-score').textContent = '⭐ ' + r.score; setStreakBox(); }
    function spawn() {
        const r = S.run; if (!r || r.over) return;
        const sky = $('tym-sky'); if (!sky) return;
        const active = r.drops.filter(d => !d.gone), taken = new Set(active.map(d => d.ch)), free = r.pool.filter(c => !taken.has(c));
        const ch = (free.length ? free : r.pool)[Math.floor(Math.random() * (free.length ? free.length : r.pool.length))];
        const b = el('button', 'tyd-drop', ch.toUpperCase()); b.type = 'button'; b.style.background = fingerColor(ch); b.dataset.ch = ch;
        b.style.left = (6 + Math.random() * 78) + '%'; const dur = 6500 + Math.random() * 2500; b.style.setProperty('--dur', dur + 'ms'); b.style.setProperty('--h', (sky.clientHeight + 60) + 'px');
        b.setAttribute('aria-label', ch.toUpperCase());
        const d = { ch, b, gone: false };
        b.onclick = () => pop(d, true);
        sky.appendChild(b); r.drops.push(d);
        r.timers.push(setTimeout(() => { if (!d.gone && !r.over) { d.gone = true; b.classList.add('missed'); setTimeout(() => b.remove(), 300); S.streak = 0; setStreakBox(); } }, dur));
    }
    function pop(d, byTap) {
        const r = S.run; if (!r || r.over || d.gone) return;
        d.gone = true; r.score++; S.streak++; r.best = Math.max(r.best, S.streak);
        const j = J(); if (j) j.correct(d.b, { streak: S.streak, silent: S.streak % 5 !== 0 });
        const sk = $('tym-sky'); if (sk) { const rb = d.b.getBoundingClientRect(), rs = sk.getBoundingClientRect(); d.b.style.top = (rb.top - rs.top) + 'px'; }
        d.b.classList.add('popped'); setTimeout(() => d.b.remove(), 260); paintRain();
    }
    function endRain() {
        const r = S.run; if (!r || r.over) return;
        stop(); r.over = true;
        const sky = $('tym-sky'); if (sky) sky.querySelectorAll('.tyd-drop').forEach(b => b.remove());
        finish(r.score, r.score >= 20 ? 3 : r.score >= 12 ? 2 : 1, `${T().score}: ${r.score}`);
    }

    // --- missing letter ---
    function wordFor(level) {
        const g = G(); let w = null;
        for (let i = 0; i < 12 && !w; i++) {
            const words = (g._pickText(level).match(/[a-zñáéíóúüàèìòùçïäëöâêîôûœ]{3,9}/gi) || []).filter(x => /^[a-zñ]+$/i.test(x));
            if (words.length) w = words[Math.floor(Math.random() * words.length)].toLowerCase();
        }
        return w || 'casa';
    }
    function nextMiss() {
        const r = S.run; if (!r || r.over) return;
        if (r.n >= r.total) return finish(r.right, r.right >= 9 ? 3 : r.right >= 6 ? 2 : 1, `${r.right} / ${r.total}`);
        const t = T(), card = $('tym-card'), stage = $('tym-stage');
        r.locked = false; $('tym-fb').hidden = true; $('tym-hint').hidden = true; card.textContent = ''; stage.textContent = '';
        r.word = wordFor(r.level); const idx = 1 + Math.floor(Math.random() * (r.word.length - 1)); r.hole = Math.min(idx, r.word.length - 1); r.ans = r.word[r.hole];
        const row = el('div', 'tyd-word'); row.setAttribute('aria-label', r.word.slice(0, r.hole) + '?' + r.word.slice(r.hole + 1));
        Array.from(r.word).forEach((c, i) => row.appendChild(el('span', 'tyd-wc' + (i === r.hole ? ' hole' : ''), i === r.hole ? '?' : c)));
        card.appendChild(row);
        zones('👆', t.zPick, 'miss');
        const opts = new Set([r.ans]); const pool = poolFor(Math.max(r.level, 2)); let guard = 0;
        while (opts.size < 4 && guard++ < 80) opts.add(pool[Math.floor(Math.random() * pool.length)]);
        const list = Array.from(opts).sort(() => Math.random() - 0.5);
        const box = el('div', 'tyd-opts'); box.setAttribute('role', 'group');
        list.forEach((c, i) => { const b = el('button', 'tyd-opt c' + (i % 4)); b.type = 'button'; b.dataset.ch = c; b.style.setProperty('--i', i); const sh = el('i', 'tyd-sh', SHAPES[i % 4]); sh.setAttribute('aria-hidden', 'true'); b.appendChild(sh); b.appendChild(el('span', 'tyd-ol', c.toUpperCase())); b.onclick = () => missPick(c, b); box.appendChild(b); });
        stage.appendChild(box);
        $('tym-qn').textContent = t.qn(r.n + 1, r.total); $('tym-bar').style.transition = 'width .5s'; $('tym-bar').style.width = Math.round(r.n / r.total * 100) + '%';
        $('tym-time').textContent = ''; $('tym-score').textContent = '⭐ ' + r.right; setStreakBox();
        card.classList.remove('tyd-enter'); void card.offsetWidth; card.classList.add('tyd-enter');
    }
    function missPick(c, btn) {
        const r = S.run; if (!r || r.over || r.locked) return; r.locked = true;
        const ok = c === r.ans, j = J(), t = T(), fb = $('tym-fb');
        document.querySelectorAll('#tym-stage .tyd-opt').forEach(b => { b.disabled = true; if (b.dataset.ch === r.ans) b.classList.add('ok'); });
        btn.classList.add(ok ? 'ok' : 'bad');
        const hole = document.querySelector('#tym-card .tyd-wc.hole'); if (hole) { hole.textContent = r.ans; hole.classList.add(ok ? 'ok' : 'bad'); }
        r.n++; if (ok) { r.right++; S.streak++; } else S.streak = 0;
        setStreakBox(); $('tym-score').textContent = '⭐ ' + r.right;
        if (j) { if (ok) j.correct(btn, { streak: S.streak }); else j.wrong(btn); }
        fb.hidden = false; fb.textContent = ''; fb.className = 'tyd-feedback ' + (ok ? 'good' : 'bad');
        fb.appendChild(el('span', 'tyd-fbi', ok ? '✅' : '💡'));
        const box = el('div', 'tyd-fbt'); box.appendChild(el('b', null, `${t.word} ${r.word}`));
        const f = fingerTxt(r.ans); if (!ok && f) box.appendChild(el('span', 'tyd-why', t.missHelp(f)));
        fb.appendChild(box);
        const go = el('button', 'ty-btn ty-btn-primary', t.next); go.type = 'button'; go.id = 'tym-next'; go.onclick = () => nextMiss(); fb.appendChild(go); go.focus();
        if (ok) { const n0 = r.n; r.timers.push(setTimeout(() => { if (S.run === r && r.n === n0 && r.locked && !r.over) nextMiss(); }, 1100)); }
    }
    function missHelp() {
        const r = S.run; if (!r || r.mode !== 'miss' || r.locked) return;
        const f = fingerTxt(r.ans), h = $('tym-hint'); h.textContent = '💡 ' + (f ? T().missHelp(f) : r.word); h.hidden = false;
    }
    function rainHelp() {
        const r = S.run; if (!r || r.mode !== 'rain') return;
        const d = r.drops.find(x => !x.gone), ch = d ? d.ch : r.pool[0]; const h = $('tym-hint');
        h.textContent = '💡 ' + T().rainHelp(ch.toUpperCase(), fingerTxt(ch)); h.hidden = false;
    }

    // --- shared end screen and keys ---
    function finish(n, st, label) {
        const r = S.run, t = T(); r.over = true; stop();
        $('tym-card').textContent = ''; $('tym-stage').textContent = ''; $('tym-fb').hidden = true; $('tym-hint').hidden = true;
        const end = $('tym-end'); end.hidden = false; end.querySelector('h2').textContent = t.done; $('tym-end-score').textContent = label;
        stars($('tym-end-stars'), st, 3); $('tym-again').textContent = t.again; $('tym-menu').textContent = t.menu;
        $('tym-bar').style.transition = 'none'; $('tym-bar').style.width = '100%';
        const j = J(); if (j && st >= 2) setTimeout(() => j.levelUp($('tym-end-stars')), 500);
    }
    function onMiniKey(e) {
        const r = S.run; if (!r || r.over) return;
        if (e.key === 'Escape') { exit(); return; }
        if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) { if (e.key === 'Enter' && r.mode === 'miss' && r.locked) nextMiss(); return; }
        const ch = e.key.toLowerCase();
        if (r.mode === 'rain') {
            const d = r.drops.find(x => !x.gone && x.ch === ch);
            if (d) pop(d); else { S.streak = 0; setStreakBox(); const j = J(); if (j) j.wrong($('tym-sky'), { silent: true }); }
        } else if (!r.locked) {
            const b = Array.from(document.querySelectorAll('#tym-stage .tyd-opt')).find(x => x.dataset.ch === ch);
            if (b) b.click();
        }
    }
    function labels() {
        const t = T();
        if ($('ty-rain-btn')) { $('ty-rain-btn').textContent = ''; $('ty-rain-btn').appendChild(el('span', 'tyd-mi', '🌧️')); const s = el('span'); s.appendChild(el('b', null, t.rain)); s.appendChild(el('small', null, t.rainSub)); $('ty-rain-btn').appendChild(s); }
        if ($('ty-miss-btn')) { $('ty-miss-btn').textContent = ''; $('ty-miss-btn').appendChild(el('span', 'tyd-mi', '🔤')); const s = el('span'); s.appendChild(el('b', null, t.miss)); s.appendChild(el('small', null, t.missSub)); $('ty-miss-btn').appendChild(s); }
        const mt = $('ty-mini-title'); if (mt) mt.textContent = t.mini;
        if ($('tyd-help')) { $('tyd-help').textContent = '💡 ' + t.help; $('tym-help').textContent = '💡 ' + t.help; }
    }
    function init() {
        const j = J();
        if (j) { if ($('tyd-snd')) j.mountSoundToggle($('tyd-snd')); if ($('tym-snd')) j.mountSoundToggle($('tym-snd')); }
        $('tyd-help').onclick = showHint;
        $('tym-help').onclick = () => { if (S.run && S.run.mode === 'rain') rainHelp(); else missHelp(); };
        $('tym-quit').onclick = exit; $('tym-menu').onclick = exit; $('tym-again').onclick = () => open(S.run ? S.run.mode : 'rain');
        $('ty-rain-btn').onclick = () => open('rain'); $('ty-miss-btn').onclick = () => open('miss');
        labels(); document.addEventListener('platformLanguageChanged', () => setTimeout(labels, 0));
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
    return { S, T, L, onBegin, onKey, onResults, open, exit, paint, labels };
})();
