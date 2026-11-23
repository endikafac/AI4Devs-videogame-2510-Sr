/**
 * Lectura guiada (readingCoach-EFC): read aloud with karaoke, learn to pause at commas and full stops,
 * measure words per minute and check comprehension.
 *
 * Default mode is MANUAL: the child presses Start, reads aloud and presses Stop (or the space bar).
 * Listening with SpeechRecognition is an optional extra, off by default, with an adult's consent.
 * No audio and no transcript is ever stored or uploaded by this game: only numbers.
 * Pure logic is exported for unit tests (see tests/unit/reading.test.mjs).
 */
const ReadingCoach = (() => {
    'use strict';

    const I18N = (typeof ReadingI18n !== 'undefined') ? ReadingI18n : require('./i18n.js');

    // ---------------------------------------------------------------- age bands and target speed
    // zone = words per minute reading aloud (orientative), len = word count of the texts of that band
    const BANDS = [
        { id: 'b56', min: 0, max: 6, zone: [30, 60], len: [30, 60] },
        { id: 'b78', min: 7, max: 8, zone: [60, 95], len: [60, 120] },
        { id: 'b910', min: 9, max: 10, zone: [95, 125], len: [120, 200] },
        { id: 'b1112', min: 11, max: 12, zone: [125, 150], len: [200, 300] },
        { id: 'b13', min: 13, max: 17, zone: [150, 180], len: [300, 500] },
        { id: 'adult', min: 18, max: 200, zone: [160, 200], len: [300, 500] }
    ];
    const BAND_IDS = BANDS.map(b => b.id);
    const PHASES = ['listen', 'karaoke', 'solo', 'quiz'];
    const TTS_LANG = { es: 'es-ES', en: 'en-GB', eu: 'eu-ES', gl: 'gl-ES', ca: 'ca-ES', fr: 'fr-FR' };
    const FILES = { es: ['es', 'es-2'], en: ['en'], eu: ['eu'], gl: ['gl'], ca: ['ca'], fr: ['fr'] };
    const BOOK_FILES = { es: ['books-es'], en: ['books-en'], eu: ['books-eu'], gl: ['books-gl'], ca: ['books-ca'], fr: ['books-fr'] };
    const FONT_SIZES = [1.15, 1.4, 1.7, 2.0, 2.4];
    const MAX_PPM = 400, MIN_SECS = 5;

    const bandById = id => BANDS.find(b => b.id === id) || null;
    const bandIndex = id => Math.max(0, BAND_IDS.indexOf(id));
    function bandForAge(age) {
        const n = Number(age);
        if (!Number.isFinite(n) || n < 3 || n > 110) return null;
        const a = Math.floor(n);
        const b = BANDS.find(x => a >= x.min && a <= x.max);
        return b ? b.id : null;
    }
    const zoneOf = id => (bandById(id) || BANDS[0]).zone;
    const targetPpm = id => { const z = zoneOf(id); return Math.round((z[0] + z[1]) / 2); };
    function zoneStatus(ppm, id) { const z = zoneOf(id); return ppm < z[0] ? 'below' : ppm > z[1] ? 'above' : 'in'; }

    // ---------------------------------------------------------------- text analysis
    const HAS_LETTER = /[\p{L}\p{N}]/u;
    const TRAIL = /[»"'”’)\]}—–-]+$/u;
    function pauseOf(raw) {
        const s = String(raw).replace(TRAIL, '');
        const c = s.slice(-1);
        if (c === ',' || c === ';') return 'comma';
        if (c === ':') return 'colon';
        if (c === '.' || c === '…') return 'period';
        if (c === '?') return 'question';
        if (c === '!') return 'exclaim';
        return null;
    }
    const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}]/gu, '');
    /** Splits a text into word tokens {raw, clean, pause}. Stand-alone punctuation sticks to the previous word. */
    function tokenize(text) {
        const out = [];
        for (const r of String(text).split(/\s+/).filter(Boolean)) {
            if (!HAS_LETTER.test(r)) {
                if (out.length) { const p = out[out.length - 1]; p.raw += ' ' + r; p.pause = pauseOf(r) || p.pause; }
                continue;
            }
            out.push({ raw: r, clean: norm(r), pause: pauseOf(r) });
        }
        return out;
    }
    const countWords = text => tokenize(text).length;
    /** Splits the raw word in leading text, body and trailing punctuation, to paint the pause marks. */
    function splitPunct(raw) {
        const m = /^(.*?)([,;:.…?!»"'”’)\]}—–-]*)$/u.exec(raw);
        return m ? { body: m[1], punct: m[2] } : { body: raw, punct: '' };
    }
    const PAUSE_WEIGHT = { comma: 0.5, colon: 0.6, period: 1, question: 1, exclaim: 1 };
    /** Karaoke timing: the whole text lasts words/ppm minutes, pauses take a proportional share. */
    function schedule(tokens, ppm) {
        const n = tokens.length;
        if (!n || !(ppm > 0)) return { items: [], total: 0 };
        const w = tokens.map(t => 1 + (PAUSE_WEIGHT[t.pause] || 0));
        const sum = w.reduce((a, b) => a + b, 0), total = n * 60000 / ppm, unit = total / sum;
        let t = 0;
        const items = tokens.map((tk, i) => { const it = { start: t, dur: unit, pause: unit * (PAUSE_WEIGHT[tk.pause] || 0) }; t += unit * w[i]; return it; });
        return { items, total };
    }
    /** Segments for the voice: one segment per phrase (ends where a pause mark is). */
    function segments(tokens) {
        const out = []; let from = 0;
        tokens.forEach((t, i) => { if (t.pause || i === tokens.length - 1) { out.push({ from, to: i, text: tokens.slice(from, i + 1).map(x => x.raw).join(' ') }); from = i + 1; } });
        return out;
    }

    // ---------------------------------------------------------------- speed measurement
    const computePpm = (words, ms) => (words > 0 && ms > 0) ? Math.round(words / (ms / 60000)) : 0;
    /** Guard against impossible times: under 5 s or over 400 wpm is "review the reading", never saved as a record. */
    function evaluateReading(words, ms) {
        const ppm = computePpm(words, ms), secs = Math.round(ms / 1000);
        let flag = null;
        if (!(ms >= MIN_SECS * 1000)) flag = 'short'; else if (ppm > MAX_PPM) flag = 'fast';
        return { ppm, secs, words, flag, valid: !flag };
    }

    // ---------------------------------------------------------------- aligning what was read against the text
    function lev(a, b) {
        const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
        let prev = Array.from({ length: n + 1 }, (_, j) => j);
        for (let i = 1; i <= m; i++) {
            const cur = [i];
            for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
            prev = cur;
        }
        return prev[n];
    }
    function similar(a, b) { const L = Math.max(a.length, b.length); if (L < 4) return false; return lev(a, b) <= (L >= 7 ? 2 : 1); }
    /**
     * Compares the words of the text with the words that were heard, in order and with tolerance.
     * Returns one status per text word: 'read', 'doubt' (heard something similar), 'skip' (jumped over) or 'pending'.
     */
    function alignWords(textWords, heard, opts) {
        const win = (opts && opts.window) || 4;
        const T = textWords.map(norm), H = heard.map(norm).filter(Boolean);
        const st = new Array(T.length).fill('pending');
        let p = 0;
        for (const h of H) {
            const end = Math.min(T.length, p + win + 1);
            let found = -1, kind = '';
            for (let k = p; k < end; k++) if (T[k] === h) { found = k; kind = 'read'; break; }
            if (found < 0) for (let k = p; k < end; k++) if (similar(T[k], h)) { found = k; kind = 'doubt'; break; }
            if (found >= 0) { for (let j = p; j < found; j++) st[j] = 'skip'; st[found] = kind; p = found + 1; }
        }
        return st;
    }
    function summarize(st) {
        const c = { read: 0, doubt: 0, skip: 0, pending: 0 };
        st.forEach(s => { c[s]++; });
        const total = st.length;
        return Object.assign(c, { total, pct: total ? Math.round(100 * (c.read + c.doubt) / total) : 0 });
    }

    // ---------------------------------------------------------------- pauses exercise
    /** First sentence(s) of a text without punctuation, plus where the pauses are: the child marks them. */
    function pauseExercise(text) {
        const tk = tokenize(text), take = [];
        for (let i = 0; i < tk.length && take.length < 24; i++) {
            take.push(tk[i]);
            if (take.length >= 10 && (tk[i].pause === 'period' || tk[i].pause === 'question' || tk[i].pause === 'exclaim')) break;
        }
        const kinds = take.map((t, i) => (i === take.length - 1) ? 'period' : (t.pause === 'comma' || t.pause === 'colon') ? 'comma' : t.pause ? 'period' : null);
        return { words: take.map(t => splitPunct(t.raw).body.replace(/^[¿¡«"'“(—]+/u, '')), kinds, audio: take.map(t => t.raw).join(' ') };
    }
    /** marks[i] is null | 'comma' | 'period'. Returns how many gaps are right (every gap counts). */
    function checkPauses(kinds, marks) {
        let ok = 0; const bad = [];
        kinds.forEach((k, i) => { if ((marks[i] || null) === (k || null)) ok++; else bad.push(i); });
        return { ok, total: kinds.length, bad };
    }

    // ---------------------------------------------------------------- texts
    function selectTexts(byLang, band, lang) {
        const pick = l => (byLang[l] || []).filter(t => Array.isArray(t.bands) && t.bands.indexOf(band) >= 0);
        const own = pick(lang);
        if (own.length) return { texts: own, lang, fallback: false };
        return { texts: pick('es'), lang: 'es', fallback: lang !== 'es' };
    }

    // ---------------------------------------------------------------- books in chapters ("Aventuras")
    /** Books of a band in a language, with fallback to the Spanish shelf (same rule as the single texts). */
    function selectBooks(byLang, band, lang) {
        const pick = l => (byLang[l] || []).filter(b => Array.isArray(b.bands) && b.bands.indexOf(band) >= 0 && Array.isArray(b.chapters) && b.chapters.length);
        const own = pick(lang);
        if (own.length) return { books: own, lang, fallback: false };
        return { books: pick('es'), lang: 'es', fallback: lang !== 'es' };
    }
    /** A chapter is finished when its comprehension questions were passed (the 'quiz' medal). */
    const chapterDone = (texts, ch) => !!(texts && ch && texts[ch.id] && texts[ch.id].quiz);
    /** Chapters unlock in order: chapter i opens when all the chapters before it are finished. */
    function chapterUnlocked(book, texts, i) {
        if (!book || !Array.isArray(book.chapters) || i < 0 || i >= book.chapters.length) return false;
        for (let k = 0; k < i; k++) if (!chapterDone(texts, book.chapters[k])) return false;
        return true;
    }
    function bookProgress(book, texts) {
        const total = book.chapters.length; let done = 0, next = -1, stars = 0;
        book.chapters.forEach((c, i) => { if (chapterDone(texts, c)) { done++; stars += Math.max(1, Math.min(3, (texts[c.id] && texts[c.id].stars) || 1)); } else if (next < 0) next = i; });
        return { done, total, next, stars, finished: done === total };
    }
    /** Turns a chapter into a text the reader screens can play (ids, questions and so on stay those of the chapter). */
    function chapterAsText(book, i, lang) {
        const c = book.chapters[i];
        return { id: c.id, title: book.title + ' · ' + c.title, chapterTitle: c.title, text: c.text, questions: c.questions, hook: c.hook || '', author: book.author, source: book.source,
            license: book.license, retelling: book.retelling, lang, book, chIdx: i };
    }

    // ---------------------------------------------------------------- progress
    const dayStr = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const dayNum = s => { const [y, m, d] = String(s).split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 86400000); };
    function updateStreak(prog, today) {
        if (prog.last === today) return prog;
        prog.streak = (prog.last && dayNum(today) - dayNum(prog.last) === 1) ? (prog.streak || 0) + 1 : 1;
        prog.last = today; return prog;
    }
    /** Average wpm of the last 7 days against the 7 days before. Null when there is nothing to compare. */
    function weeklyTrend(hist, today) {
        const t = dayNum(today), cur = [], prev = [];
        (hist || []).forEach(h => { const a = t - dayNum(h.d); if (a >= 0 && a < 7) cur.push(h.ppm); else if (a >= 7 && a < 14) prev.push(h.ppm); });
        const avg = a => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : null;
        return { cur: avg(cur), prev: avg(prev), n: cur.length };
    }
    const medalCount = e => e ? PHASES.reduce((n, p) => n + (e[p] ? 1 : 0), 0) : 0;
    const totalMedals = prog => Object.keys(prog.texts || {}).reduce((n, id) => n + medalCount(prog.texts[id]), 0);
    function achievements(prog) {
        const out = [];
        if ((prog.hist || []).length) out.push('first');
        if ((prog.streak || 0) >= 3) out.push('streak3');
        if ((prog.hist || []).some(h => h.z)) out.push('zone');
        if (prog.perfect) out.push('quiz');
        if (totalMedals(prog) >= 10) out.push('medals');
        return out;
    }
    const blank = () => ({ band: '', sel: '', rlang: '', font: 1, dys: false, consent: false, listen: false, texts: {}, hist: [], streak: 0, last: '', perfect: false });
    const stars = (correct, total) => total && correct >= total ? 3 : (total && correct * 2 >= total ? 2 : 1);
    const quizPassed = (correct, total) => total > 0 && correct >= Math.ceil(total * 0.6);
    const fmt = (s, o) => String(s).replace(/\{(\w+)\}/g, (m, k) => (o && o[k] != null) ? o[k] : m);

    // ================================================================ UI (browser only)
    const S = {
        user: null, prog: blank(), uiLang: 'es', texts: {}, loaded: {}, cur: null, list: [], phase: 'listen',
        kara: null, kppm: 0, timeScale: 1, now: () => (typeof performance !== 'undefined' ? performance.now() : Date.now()),
        solo: null, quiz: null, rec: null, heard: [], spans: [], voiceOk: true, pauseEx: null,
        books: {}, booksLoaded: {}, shelf: [], book: null
    };
    const $ = id => document.getElementById(id);
    const uiLang = () => { const l = ((typeof PlatformI18n !== 'undefined' && PlatformI18n.currentLanguage) || 'es').slice(0, 2); return I18N[l] ? l : 'es'; };
    const T = () => I18N[uiLang()];
    function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function btn(label, cls, onclick, id) { const b = el('button', 'rd-btn' + (cls ? ' ' + cls : ''), label); b.type = 'button'; if (id) b.id = id; if (onclick) b.onclick = onclick; return b; }
    const clear = n => { while (n.firstChild) n.removeChild(n.firstChild); };

    function owner() {
        const u = S.user; if (!u) return 'guest';
        let pid = null; try { pid = PlatformFirestore._pid(u.uid); } catch (e) { /* no player */ }
        return u.uid + (pid ? '_' + pid : '');
    }
    const key = () => 'reading_' + owner();
    function load() {
        try { S.prog = Object.assign(blank(), JSON.parse(localStorage.getItem(key()))); } catch (e) { S.prog = blank(); }
        if (!S.prog.texts || typeof S.prog.texts !== 'object') S.prog.texts = {};
        if (!Array.isArray(S.prog.hist)) S.prog.hist = [];
    }
    function save() { try { localStorage.setItem(key(), JSON.stringify(S.prog)); } catch (e) { /* storage blocked */ } }
    const level = () => S.prog.sel || S.prog.band || 'b78';
    const readLang = () => S.prog.rlang || uiLang();

    function show(id) { ['rd-age', 'rd-home', 'rd-book', 'rd-text'].forEach(s => { $(s).hidden = s !== id; }); window.scrollTo(0, 0); }
    function flash(msg) { const m = $('rd-msg'); m.textContent = msg || ''; }

    // ---- loading texts
    async function loadTexts(lang) {
        if (S.loaded[lang]) return;
        const all = [];
        for (const f of (FILES[lang] || [])) {
            try { const r = await fetch('texts/' + f + '.json'); if (r.ok) { const j = await r.json(); all.push(...(j.texts || [])); } } catch (e) { console.warn('[Reading] texts not loaded', f); }
        }
        S.texts[lang] = all; S.loaded[lang] = true;
    }

    async function loadBooks(lang) {
        if (S.booksLoaded[lang]) return;
        const all = [];
        for (const f of (BOOK_FILES[lang] || [])) {
            try { const r = await fetch('texts/' + f + '.json'); if (r.ok) { const j = await r.json(); all.push(...(j.books || [])); } } catch (e) { console.warn('[Reading] books not loaded', f); }
        }
        S.books[lang] = all; S.booksLoaded[lang] = true;
    }

    // ---- voice
    const synth = () => (typeof speechSynthesis !== 'undefined' ? speechSynthesis : null);
    function pickVoice(lang) {
        const s = synth(); if (!s) return null;
        const want = (TTS_LANG[lang] || lang).toLowerCase(), two = want.slice(0, 2);
        const vs = s.getVoices ? s.getVoices() : [];
        return vs.find(v => v.lang && v.lang.toLowerCase() === want) || vs.find(v => v.lang && v.lang.toLowerCase().startsWith(two)) || null;
    }
    function speak(text, lang, rate) {
        const s = synth(); if (!s || typeof SpeechSynthesisUtterance === 'undefined') return false;
        try {
            const u = new SpeechSynthesisUtterance(text); u.lang = TTS_LANG[lang] || lang; u.rate = rate || 1;
            const v = pickVoice(lang); if (v) u.voice = v;
            s.speak(u); return true;
        } catch (e) { return false; }
    }
    function silence() { const s = synth(); if (s) { try { s.cancel(); } catch (e) { /* ignore */ } } }

    // ---- sizes and text rendering
    function applyLook() {
        const box = $('rd-textbox'); if (!box) return;
        box.style.fontSize = FONT_SIZES[Math.min(FONT_SIZES.length - 1, Math.max(0, S.prog.font))] + 'rem';
        document.body.classList.toggle('rd-dys', !!S.prog.dys);
    }
    function renderText() {
        const box = $('rd-textbox'); clear(box); S.spans = [];
        const tk = tokenize(S.cur.text);
        box.lang = S.cur.lang;
        tk.forEach((t, i) => {
            const w = el('span', 'rd-w'); w.dataset.i = i;
            const sp = splitPunct(t.raw);
            w.appendChild(document.createTextNode(sp.body));
            if (sp.punct) {
                const p = el('span', 'rd-p' + (t.pause === 'comma' || t.pause === 'colon' ? ' comma' : t.pause ? ' period' : ''), sp.punct);
                w.appendChild(p);
            }
            box.appendChild(w); box.appendChild(document.createTextNode(' ')); S.spans.push(w);
        });
        S.tokens = tk; applyLook();
    }
    function markWord(i) {
        S.spans.forEach((w, k) => { w.classList.toggle('rd-now', k === i); w.classList.toggle('rd-done', k < i); });
        const w = S.spans[i]; if (w && w.scrollIntoView) { const r = w.getBoundingClientRect(); if (r.top < 90 || r.bottom > window.innerHeight - 20) w.scrollIntoView({ block: 'center', behavior: 'auto' }); }
    }
    function clearMarks() { S.spans.forEach(w => { w.classList.remove('rd-now', 'rd-done', 'rd-read', 'rd-skip', 'rd-doubt'); }); }

    // ---- karaoke engine (timer driven; the voice, when used, is started at each phrase)
    function stopKara() { if (S.kara) { clearTimeout(S.kara.t); S.kara.run = false; } S.kara = null; silence(); }
    function startKara(withVoice, onEnd) {
        stopKara(); clearMarks();
        const sch = schedule(S.tokens, S.kppm), segs = segments(S.tokens), segAt = {};
        segs.forEach(sg => { segAt[sg.from] = sg; });
        const rate = Math.max(0.5, Math.min(1.1, S.kppm / 150));
        S.kara = { run: true, i: 0, t: 0 };
        const step = () => {
            const k = S.kara; if (!k || !k.run) return;
            if (k.i >= S.tokens.length) { markWord(S.tokens.length); S.kara = null; renderControls(); onEnd && onEnd(); return; }
            markWord(k.i);
            if (withVoice && segAt[k.i]) { silence(); S.voiceOk = speak(segAt[k.i].text, S.cur.lang, rate); }
            const it = sch.items[k.i];
            k.t = setTimeout(() => { if (S.kara) { S.kara.i++; step(); } }, Math.max(8, (it.dur + it.pause) * S.timeScale));
        };
        step();
    }

    // ---- medals
    function award(phase) {
        const e = S.prog.texts[S.cur.id] || (S.prog.texts[S.cur.id] = {});
        const first = !e[phase]; e[phase] = true; save();
        if (first) { flash('🏅 ' + T().medalWon + ': ' + T()['ph_' + phase]); try { Juice.levelUp($('rd-steps')); } catch (x) { /* optional */ } }
        renderSteps();
    }

    // ================================================================ screens
    function applyStatic() {
        const t = T();
        $('rd-h1').textContent = t.title; $('rd-sub').textContent = t.sub;
        $('rd-age-title').textContent = t.ageTitle; $('rd-age-label').textContent = t.ageAsk; $('rd-age-note').textContent = t.ageNote; $('rd-age-save').textContent = t.ageSave;
        $('rd-z-set').textContent = t.zSettings; $('rd-z-zone').textContent = t.zone; $('rd-z-list').textContent = t.zTexts; $('rd-z-prog').textContent = t.zProgress;
        $('rd-z-books').textContent = t.zBooks; $('rd-z-text').textContent = t.zText; $('rd-z-ctrl').textContent = t.zControls;
        $('rd-quit').setAttribute('aria-label', t.quit); $('rd-help-l').textContent = t.help;
        $('rd-consent-title').textContent = t.consentTitle; $('rd-consent-text').textContent = t.consentText; $('rd-consent-l').textContent = t.consentCheck;
        $('rd-consent-ok').textContent = t.consentOk; $('rd-consent-no').textContent = t.consentNo;
        document.documentElement.lang = uiLang();
    }

    // ---- age screen
    function submitAge() {
        const b = bandForAge($('rd-age-in').value);
        const err = $('rd-age-err');
        if (!b) { err.textContent = T().ageBad; err.hidden = false; return; }
        err.hidden = true; S.prog.band = b; S.prog.sel = b; save(); renderHome(); show('rd-home');
    }

    // ---- home
    async function renderHome() {
        applyStatic(); const t = T(), p = S.prog;
        if (!p.band) { show('rd-age'); return; }
        // stats pills
        const st = $('rd-stats'); clear(st);
        st.appendChild(el('span', 'rd-pill', '🔥 ' + fmt(t.streakDays, { n: p.streak || 0 })));
        st.appendChild(el('span', 'rd-pill', '🏅 ' + totalMedals(p)));
        // settings
        const se = $('rd-settings'); clear(se);
        const r1 = el('div', 'rd-row');
        r1.appendChild(el('b', null, t.yourAge + ': ' + t[p.band]));
        r1.appendChild(btn(t.change, 'ghost small', () => { $('rd-age-in').value = ''; show('rd-age'); $('rd-age-in').focus(); }, 'rd-agechange'));
        se.appendChild(r1);
        se.appendChild(el('div', 'rd-label', t.level + ' · ' + t.levelHint));
        const chips = el('div', 'rd-chips', null); chips.setAttribute('role', 'group'); chips.setAttribute('aria-label', t.level);
        BANDS.forEach(b => {
            const c = btn(t[b.id], 'chip' + (b.id === level() ? ' on' : ''), () => { p.sel = b.id; save(); renderHome(); }); c.dataset.band = b.id; c.setAttribute('aria-pressed', String(b.id === level()));
            chips.appendChild(c);
        });
        se.appendChild(chips);
        const r2 = el('div', 'rd-row wrap');
        const lw = el('label', 'rd-lang'); lw.appendChild(el('span', null, t.readLang));
        const sel = el('select', 'rd-select'); sel.id = 'rd-rlang';
        I18N.LANGS.forEach(l => { const o = el('option', null, l.toUpperCase()); o.value = l; if (l === readLang()) o.selected = true; sel.appendChild(o); });
        sel.onchange = () => { p.rlang = sel.value; save(); renderHome(); };
        lw.appendChild(sel); r2.appendChild(lw);
        const fs = el('div', 'rd-fs'); fs.appendChild(el('span', null, t.fontSize));
        const fm = btn('A−', 'ghost small', () => { p.font = Math.max(0, p.font - 1); save(); applyLook(); }, 'rd-fsm'); fm.setAttribute('aria-label', t.smaller);
        const fp = btn('A+', 'ghost small', () => { p.font = Math.min(FONT_SIZES.length - 1, p.font + 1); save(); applyLook(); }, 'rd-fsp'); fp.setAttribute('aria-label', t.bigger);
        fs.appendChild(fm); fs.appendChild(fp); r2.appendChild(fs);
        const dl = el('label', 'rd-check'); const dc = el('input'); dc.type = 'checkbox'; dc.id = 'rd-dys'; dc.checked = !!p.dys;
        dc.onchange = () => { p.dys = dc.checked; save(); applyLook(); };
        dl.appendChild(dc); dl.appendChild(el('span', null, ' ' + t.dyslexia)); r2.appendChild(dl);
        se.appendChild(r2);
        // optional listening
        const r3 = el('div', 'rd-listenrow');
        const supported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
        const ll = el('label', 'rd-check'); const lc = el('input'); lc.type = 'checkbox'; lc.id = 'rd-listen'; lc.checked = !!(p.listen && p.consent); lc.disabled = !supported;
        lc.onchange = () => {
            if (lc.checked) { lc.checked = false; openConsent(); } else { p.listen = false; p.consent = false; save(); renderHome(); }
        };
        ll.appendChild(lc); ll.appendChild(el('span', null, ' 🎤 ' + t.listenTitle + ': ' + (p.listen && p.consent ? t.listenOn : t.listenOff)));
        r3.appendChild(ll);
        if (!supported) r3.appendChild(el('p', 'rd-note', t.listenNoSupport));
        se.appendChild(r3);
        const sw = el('div', 'rd-row'); sw.appendChild(el('span', null, t.sound)); const slot = el('span'); sw.appendChild(slot); se.appendChild(sw);
        try { Juice.mountSoundToggle(slot); } catch (e) { /* optional */ }
        // zone
        const zn = $('rd-zone'); clear(zn); const z = zoneOf(level());
        zn.appendChild(el('div', 'rd-zonebig', z[0] + ' - ' + z[1] + ' ' + t.unit));
        zn.appendChild(el('div', 'rd-note', t.unitLong + ' · ' + t.zoneNote));
        // texts
        await loadTexts(readLang()); if (readLang() !== 'es') await loadTexts('es');
        const sel2 = selectTexts(S.texts, level(), readLang());
        S.list = sel2.texts.map(x => Object.assign({ lang: sel2.lang }, x));
        await renderShelf(t);
        const fb = $('rd-fallback'); fb.hidden = !sel2.fallback; fb.textContent = sel2.fallback ? t.noBand : '';
        const ol = $('rd-list'); clear(ol);
        S.list.forEach((x, i) => {
            const li = el('li'); const b = el('button', 'rd-item'); b.type = 'button'; b.dataset.id = x.id;
            const e = p.texts[x.id] || {};
            b.appendChild(el('span', 'rd-itemno', String(i + 1)));
            const info = el('span', 'rd-iteminfo'); info.appendChild(el('b', null, x.title));
            info.appendChild(el('span', null, countWords(x.text) + ' ' + t.words + (e.bestPpm ? ' · ' + t.bestPpm + ' ' + e.bestPpm + ' ' + t.unit : '')));
            b.appendChild(info);
            const md = el('span', 'rd-medals'); md.setAttribute('aria-label', medalCount(e) + '/4');
            PHASES.forEach(ph => md.appendChild(el('i', e[ph] ? 'on' : '', e[ph] ? '●' : '○')));
            b.appendChild(md);
            b.onclick = () => openText(x.id); li.appendChild(b); ol.appendChild(li);
        });
        // progress
        const pr = $('rd-prog'); clear(pr);
        const tr = weeklyTrend(p.hist, dayStr());
        pr.appendChild(el('div', 'rd-trend', '📈 ' + t.trend + ': ' + (tr.cur != null ? (tr.prev != null ? fmt(t.trendVs, { a: tr.cur, u: t.unit, b: tr.prev }) : tr.cur + ' ' + t.unit) : t.trendNone)));
        const bd = el('div', 'rd-badges'); bd.appendChild(el('b', null, t.badges + ': '));
        const got = achievements(p);
        ['first', 'streak3', 'zone', 'quiz', 'medals'].forEach(a => bd.appendChild(el('span', 'rd-badge' + (got.indexOf(a) >= 0 ? ' on' : ''), (got.indexOf(a) >= 0 ? '🏆 ' : '🔒 ') + t['ach_' + a])));
        pr.appendChild(bd);
        show('rd-home');
    }

    // ---- shelf of books ("Aventuras")
    function coverNode(bk, big) {
        const c = el('span', 'rd-cover' + (big ? ' big' : ''));
        c.style.background = 'linear-gradient(145deg, ' + bk.color + ', #0f172a)';
        c.setAttribute('aria-hidden', 'true'); c.appendChild(el('span', 'rd-cover-emoji', bk.emoji));
        return c;
    }
    async function renderShelf(t) {
        await loadBooks(readLang()); if (readLang() !== 'es') await loadBooks('es');
        const sb = selectBooks(S.books, level(), readLang());
        S.shelf = sb.books.map(b => Object.assign({}, b, { lang: sb.lang }));
        const nf = $('rd-books-fallback'); nf.hidden = !sb.fallback; nf.textContent = sb.fallback ? t.noBooks : '';
        const sh = $('rd-shelf'); clear(sh); sh.hidden = !S.shelf.length; $('rd-z-books').hidden = !S.shelf.length;
        S.shelf.forEach(bk => {
            const pg = bookProgress(bk, S.prog.texts);
            const li = el('li'); const b = el('button', 'rd-book' + (pg.finished ? ' finished' : '')); b.type = 'button'; b.dataset.id = bk.id;
            b.appendChild(coverNode(bk, false));
            b.appendChild(el('b', 'rd-booktitle', bk.title));
            b.appendChild(el('span', 'rd-bookauthor', bk.author));
            b.appendChild(el('span', 'rd-bookprog', pg.finished ? '📚 ' + t.bookFinished : fmt(t.chaptersDone, { a: pg.done, b: pg.total })));
            b.onclick = () => openBook(bk.id); li.appendChild(b); sh.appendChild(li);
        });
    }
    function openBook(id) {
        const bk = (S.book && S.book.id === id ? S.book : null) || S.shelf.find(b => b.id === id); if (!bk) return;
        S.book = bk; renderBook(); show('rd-book');
    }
    function renderBook() {
        const t = T(), bk = S.book, p = S.prog; if (!bk) return;
        const hd = $('rd-bookhead'); clear(hd);
        hd.appendChild(coverNode(bk, true));
        const inf = el('div', 'rd-bookinfo'); inf.appendChild(el('h2', null, bk.title)); inf.appendChild(el('p', 'rd-note', bk.author));
        const pg = bookProgress(bk, p.texts);
        inf.appendChild(el('p', 'rd-bookprog', pg.finished ? '📚 ' + t.bookFinished : fmt(t.chaptersDone, { a: pg.done, b: pg.total }) + ' · ⭐ ' + pg.stars + '/' + (pg.total * 3)));
        inf.appendChild(el('p', 'rd-credit', t.retold + ' · ' + t.license + ': ' + bk.license));
        hd.appendChild(inf);
        $('rd-bookback').textContent = '← ' + t.backShelf;
        const ol = $('rd-path'); clear(ol); ol.setAttribute('aria-label', t.bookPath);
        bk.chapters.forEach((c, i) => {
            const open = chapterUnlocked(bk, p.texts, i), done = chapterDone(p.texts, c), e = p.texts[c.id] || {};
            const li = el('li', 'rd-pathitem' + (done ? ' done' : '') + (open && !done ? ' current' : '') + (!open ? ' locked' : ''));
            const b = el('button', 'rd-chap'); b.type = 'button'; b.dataset.idx = i; b.dataset.id = c.id;
            if (!open) { b.disabled = true; b.setAttribute('aria-disabled', 'true'); }
            b.appendChild(el('span', 'rd-node', done ? '⭐' : open ? String(i + 1) : '🔒'));
            const inf2 = el('span', 'rd-iteminfo'); inf2.appendChild(el('b', null, fmt(t.chapterN, { n: i + 1 }) + ': ' + c.title));
            const sub = !open ? fmt(t.chapterLocked, { n: i }) : (countWords(c.text) + ' ' + t.words + (e.bestPpm ? ' · ' + t.bestPpm + ' ' + e.bestPpm + ' ' + t.unit : '') + (done ? ' · ' + fmt(t.chapterStars, { n: e.stars || 1 }) : ' · ' + t.chapterGo));
            inf2.appendChild(el('span', null, sub)); b.appendChild(inf2);
            const md = el('span', 'rd-medals'); md.setAttribute('aria-label', medalCount(e) + '/4');
            PHASES.forEach(ph => md.appendChild(el('i', e[ph] ? 'on' : '', e[ph] ? '●' : '○'))); b.appendChild(md);
            b.onclick = () => openChapter(bk, i); li.appendChild(b); ol.appendChild(li);
        });
    }
    function openChapter(bk, i) {
        if (!chapterUnlocked(bk, S.prog.texts, i)) return;
        S.book = bk; startText(chapterAsText(bk, i, bk.lang || readLang()));
    }

    // ---- consent for listening
    function openConsent() { const m = $('rd-consent'); $('rd-consent-chk').checked = false; $('rd-consent-ok').disabled = true; m.hidden = false; $('rd-consent-chk').focus(); }
    function closeConsent() { $('rd-consent').hidden = true; }

    // ---- text screen
    function openText(id) { const x = S.list.find(i => i.id === id); if (x) startText(x); }
    function startText(x) {
        S.cur = x; S.phase = 'listen'; S.solo = null; S.quiz = null; S.pauseEx = null;
        S.kppm = targetPpm(level());
        $('rd-title').textContent = x.title; flash('');
        $('rd-credit').textContent = T().author + ': ' + x.author + ' · ' + T().license + ': ' + x.license + (x.book ? ' · ' + T().retold : '');
        $('rd-helpbox').hidden = true; $('rd-help').setAttribute('aria-expanded', 'false');
        renderText(); gotoPhase('listen'); show('rd-text');
    }
    function leaveText() { stopKara(); stopRec(true); if (S.solo && S.solo.tick) clearInterval(S.solo.tick); S.solo = null; S.quiz = null; if (S.cur && S.cur.book) { renderBook(); show('rd-book'); } else renderHome(); }
    function gotoPhase(p) {
        stopKara(); stopRec(true); if (S.solo && S.solo.tick) clearInterval(S.solo.tick); S.solo = null;
        S.phase = p; S.pauseEx = null; flash('');
        $('rd-readview').hidden = p === 'quiz'; $('rd-quizview').hidden = p !== 'quiz';
        clearMarks(); renderSteps();
        if (p === 'quiz') startQuiz(); else renderControls();
        $('rd-helpbox').hidden = true; $('rd-help').setAttribute('aria-expanded', 'false');
    }
    function renderSteps() {
        const t = T(), ol = $('rd-steps'); clear(ol);
        const e = S.prog.texts[S.cur.id] || {};
        PHASES.forEach((p, i) => {
            const li = el('li'); const b = el('button', 'rd-step' + (p === S.phase ? ' on' : '') + (e[p] ? ' done' : ''));
            b.type = 'button'; b.dataset.phase = p; if (p === S.phase) b.setAttribute('aria-current', 'step');
            b.appendChild(el('span', 'rd-stepn', e[p] ? '✓' : String(i + 1))); b.appendChild(el('span', 'rd-stept', t['ph_' + p]));
            b.onclick = () => gotoPhase(p); li.appendChild(b); ol.appendChild(li);
        });
        $('rd-phaselabel').textContent = fmt(t.phase, { n: PHASES.indexOf(S.phase) + 1 }) + ' · ' + t['ph_' + S.phase];
    }
    function legend() {
        const t = T(), lg = $('rd-legend'); clear(lg);
        lg.appendChild(el('span', 'rd-lg comma', ', ' + t.legendComma));
        lg.appendChild(el('span', 'rd-lg period', '. ' + t.legendPeriod));
        lg.appendChild(el('span', 'rd-lg q', '¿? ¡! ' + t.legendQ));
    }
    function renderHelp() {
        const t = T(), hb = $('rd-helpbox'); clear(hb);
        hb.appendChild(el('p', null, t['hint_' + S.phase]));
        if (S.phase !== 'quiz') hb.appendChild(el('p', 'rd-note', t.tapWord));
    }

    function renderControls() {
        const t = T(), c = $('rd-controls'); clear(c); legend(); renderHelp();
        $('rd-textbox').hidden = false;
        c.appendChild(el('p', 'rd-hint', t['hint_' + S.phase]));
        if (S.phase === 'listen' || S.phase === 'karaoke') {
            const voice = S.phase === 'listen';
            if (voice && synth() && !pickVoice(S.cur.lang) && (synth().getVoices ? synth().getVoices().length : 0) > 0) c.appendChild(el('p', 'rd-note', t.noVoice));
            const row = el('div', 'rd-row wrap');
            const running = !!S.kara;
            row.appendChild(btn(running ? '■ ' + t.stopPlay : '▶ ' + (voice ? t.play : t.start), running ? 'red big' : 'green big', () => {
                if (S.kara) { stopKara(); clearMarks(); renderControls(); } else { startKara(voice, () => award(voice ? 'listen' : 'karaoke')); renderControls(); }
            }, 'rd-play'));
            c.appendChild(row);
            const sp = el('div', 'rd-row wrap'); sp.appendChild(el('span', 'rd-label', t.speed + ': ' + S.kppm + ' ' + t.unit));
            sp.appendChild(btn('− ' + t.slower, 'ghost small', () => { S.kppm = Math.max(20, Math.round(S.kppm * 0.9)); renderControls(); }, 'rd-slower'));
            sp.appendChild(btn('+ ' + t.faster, 'ghost small', () => { S.kppm = Math.min(250, Math.round(S.kppm * 1.1)); renderControls(); }, 'rd-faster'));
            c.appendChild(sp);
            const nav = el('div', 'rd-row wrap');
            if (voice) nav.appendChild(btn('🟡🔴 ' + t.pausesBtn, 'ghost', openPauses, 'rd-pausesbtn'));
            nav.appendChild(btn(t.nextPhase + ' →', '', () => gotoPhase(PHASES[PHASES.indexOf(S.phase) + 1]), 'rd-nextphase'));
            c.appendChild(nav);
        } else if (S.phase === 'solo') renderSolo(c);
    }

    // ---- pauses exercise
    function openPauses() {
        stopKara(); const t = T(), c = $('rd-controls'); clear(c);
        const ex = pauseExercise(S.cur.text); S.pauseEx = { ex, marks: ex.words.map(() => null), checked: false };
        $('rd-textbox').hidden = true;
        c.appendChild(el('h3', null, t.pausesTitle)); c.appendChild(el('p', 'rd-hint', t.pausesTask));
        const box = el('div', 'rd-pbox'); box.id = 'rd-pbox'; c.appendChild(box);
        const draw = () => {
            clear(box);
            ex.words.forEach((w, i) => {
                box.appendChild(el('span', 'rd-pw', w));
                const m = S.pauseEx.marks[i], g = el('button', 'rd-gap' + (m ? ' ' + m : ''), m === 'comma' ? ',' : m === 'period' ? '.' : '·'); g.type = 'button'; g.dataset.i = i;
                g.setAttribute('aria-label', fmt(t.pauseGap, { w }) + ': ' + (m === 'comma' ? t.pauseComma : m === 'period' ? t.pausePeriod : t.pauseNone));
                if (S.pauseEx.checked) g.classList.add(checkPauses(ex.kinds, S.pauseEx.marks).bad.indexOf(i) >= 0 ? 'bad' : 'ok');
                g.onclick = () => { const cyc = [null, 'comma', 'period']; S.pauseEx.marks[i] = cyc[(cyc.indexOf(S.pauseEx.marks[i]) + 1) % 3]; S.pauseEx.checked = false; draw(); };
                box.appendChild(g);
            });
        };
        draw();
        const res = el('p', 'rd-hint', ''); res.id = 'rd-presult'; res.setAttribute('aria-live', 'polite'); c.appendChild(res);
        const row = el('div', 'rd-row wrap');
        row.appendChild(btn('🔊 ' + t.hearModel, 'ghost', () => { S.voiceOk = speak(ex.audio, S.cur.lang, 0.85); }, 'rd-pmodel'));
        row.appendChild(btn(t.check, 'green', () => {
            const r = checkPauses(ex.kinds, S.pauseEx.marks); S.pauseEx.checked = true; draw();
            res.textContent = fmt(t.pausesResult, { a: r.ok, b: r.total }) + ' ' + (r.bad.length ? t.pausesTry : t.pausesPerfect);
            const fx = $('rd-pbox');
            if (r.bad.length) { try { Juice.wrong(fx); } catch (e) { /* optional */ } } else { try { Juice.correct(fx, { streak: 0 }); } catch (e) { /* optional */ } }
        }, 'rd-pcheck'));
        row.appendChild(btn(t.backList, 'ghost', () => { S.pauseEx = null; $('rd-textbox').hidden = false; renderControls(); }, 'rd-pback'));
        c.appendChild(row);
    }

    // ---- solo reading: manual Start / Stop is the default mode
    const mmss = ms => { const s = Math.floor(ms / 1000); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
    function listenActive() { return !!(S.prog.listen && S.prog.consent && (window.SpeechRecognition || window.webkitSpeechRecognition)); }
    function renderSolo(c) {
        const t = T(); const so = S.solo || {};
        const live = !!so.running;
        c.appendChild(el('p', 'rd-hint', live ? t.soloLive : t.hint_solo));
        const timer = el('div', 'rd-timer', t.timer + ': ' + mmss(live ? S.now() - so.t0 : (so.ms || 0))); timer.id = 'rd-timer'; c.appendChild(timer);
        if (live && listenActive()) c.appendChild(el('p', 'rd-note', '🎤 ' + t.listening));
        const row = el('div', 'rd-row wrap');
        row.appendChild(btn(live ? '■ ' + t.stop : '▶ ' + t.start, (live ? 'red' : 'green') + ' big', toggleSolo, 'rd-startstop'));
        c.appendChild(row); c.appendChild(el('p', 'rd-note', t.readyHint));
        if (so.res) renderSoloResult(c, so.res);
    }
    function toggleSolo() {
        if (S.phase !== 'solo') return;
        if (S.solo && S.solo.running) stopSolo(); else startSolo();
    }
    function startSolo() {
        clearMarks(); silence();
        S.solo = { running: true, t0: S.now(), ms: 0, res: null, tick: null };
        S.heard = [];
        if (listenActive()) startRec();
        S.solo.tick = setInterval(() => { const tm = $('rd-timer'); if (tm && S.solo && S.solo.running) tm.textContent = T().timer + ': ' + mmss(S.now() - S.solo.t0); }, 250);
        renderControls();
    }
    function stopSolo() {
        const so = S.solo; if (!so || !so.running) return;
        so.running = false; so.ms = S.now() - so.t0; clearInterval(so.tick); so.tick = null;
        const words = S.tokens.length, res = evaluateReading(words, so.ms);
        res.zone = zoneStatus(res.ppm, level());
        if (S.rec) { res.align = finishRec(); }
        so.res = res; renderControls();
    }
    function renderSoloResult(c, r) {
        const t = T(); const box = el('div', 'rd-result'); box.id = 'rd-result';
        box.appendChild(el('p', 'rd-big', fmt(t.result, { w: r.words, s: r.secs })));
        if (r.flag) {
            box.appendChild(el('p', 'rd-bad', '⚠️ ' + t.review));
            box.appendChild(btn(t.repeat, 'big', () => { S.solo = null; clearMarks(); renderControls(); }, 'rd-redo'));
        } else {
            box.appendChild(el('p', 'rd-ppm', r.ppm + ' ' + t.unit));
            const z = zoneOf(level()), span = Math.max(1, z[1] - z[0]); const lo = z[0] - span, hi = z[1] + span;
            const meter = el('div', 'rd-meter'); const zn = el('i', 'zone'); zn.style.left = ((z[0] - lo) / (hi - lo) * 100) + '%'; zn.style.width = (span / (hi - lo) * 100) + '%';
            const mk = el('b', 'mark'); mk.style.left = Math.max(2, Math.min(98, (r.ppm - lo) / (hi - lo) * 100)) + '%';
            meter.appendChild(zn); meter.appendChild(mk); meter.setAttribute('role', 'img'); meter.setAttribute('aria-label', r.ppm + ' ' + t.unit + ', ' + t.zone + ' ' + z[0] + '-' + z[1]);
            box.appendChild(meter);
            box.appendChild(el('p', 'rd-note', t.zone + ': ' + z[0] + ' - ' + z[1] + ' ' + t.unit));
            box.appendChild(el('p', r.zone === 'in' ? 'rd-ok' : 'rd-note', r.zone === 'in' ? t.inZone : r.zone === 'below' ? t.belowZone : t.aboveZone));
            if (r.align) box.appendChild(el('p', 'rd-note', fmt(t.heardStat, { a: r.align.read + r.align.doubt, b: r.align.total }) + ' · ' + t.legRead + ' / ' + t.legSkip + ' / ' + t.legDoubt));
            const row = el('div', 'rd-row wrap');
            row.appendChild(btn('✓ ' + t.readWell, 'green big', () => confirmSolo(r), 'rd-good'));
            row.appendChild(btn('↺ ' + t.repeat, 'ghost', () => { S.solo = null; clearMarks(); renderControls(); }, 'rd-redo'));
            box.appendChild(row);
        }
        c.appendChild(box);
    }
    function confirmSolo(r) {
        const e = S.prog.texts[S.cur.id] || (S.prog.texts[S.cur.id] = {});
        e.lastPpm = r.ppm; e.bestPpm = Math.max(e.bestPpm || 0, r.ppm);
        const today = dayStr();
        S.prog.hist.push({ d: today, ppm: r.ppm, id: S.cur.id, z: r.zone === 'in' ? 1 : 0 }); if (S.prog.hist.length > 300) S.prog.hist.splice(0, S.prog.hist.length - 300);
        updateStreak(S.prog, today); save();
        flash('✓ ' + T().saved + ': ' + r.ppm + ' ' + T().unit);
        try { Juice.correct($('rd-good'), { streak: 0 }); } catch (x) { /* optional */ }
        award('solo');
        S.solo.res = null; S.solo.ms = 0;
        const c = $('rd-controls'); clear(c);
        c.appendChild(el('p', 'rd-big', '✓ ' + r.ppm + ' ' + T().unit));
        c.appendChild(btn(T().nextPhase + ' →', 'big', () => gotoPhase('quiz'), 'rd-nextphase'));
    }

    // ---- optional listening (SpeechRecognition). Audio is never stored; only counters are kept.
    function startRec() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return;
        try {
            const r = new SR(); r.lang = TTS_LANG[S.cur.lang] || S.cur.lang; r.continuous = true; r.interimResults = true;
            r.onresult = ev => {
                const words = [];
                for (let i = 0; i < ev.results.length; i++) { const alt = ev.results[i][0]; if (alt && alt.transcript) words.push(...alt.transcript.split(/\s+/)); }
                S.heard = words; paintAlign();
            };
            r.onerror = () => { /* manual mode keeps working */ };
            r.onend = () => { if (S.rec === r && S.solo && S.solo.running) { try { r.start(); } catch (e) { /* ignore */ } } };
            S.rec = r; r.start();
        } catch (e) { S.rec = null; }
    }
    function paintAlign() {
        const st = alignWords(S.tokens.map(t => t.raw), S.heard);
        st.forEach((s, i) => { const w = S.spans[i]; if (!w) return; w.classList.toggle('rd-read', s === 'read'); w.classList.toggle('rd-skip', s === 'skip'); w.classList.toggle('rd-doubt', s === 'doubt'); });
        return st;
    }
    function finishRec() {
        const st = paintAlign(), sum = summarize(st);
        stopRec(false); S.heard = []; // the words heard are dropped as soon as they are counted
        return sum;
    }
    function stopRec(clearAll) {
        const r = S.rec; S.rec = null;
        if (r) { r.onend = null; try { r.abort ? r.abort() : r.stop(); } catch (e) { /* ignore */ } }
        if (clearAll) S.heard = [];
    }

    // ---- comprehension quiz
    const SHAPES = ['▲', '◆', '●', '■'];
    function startQuiz() {
        const qs = S.cur.questions.map(q => {
            const idx = q.o.map((_, i) => i); for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
            return { q: q.q, ev: q.ev, opts: idx.map(i => q.o[i]), ok: idx.indexOf(q.a) };
        });
        S.quiz = { qs, i: 0, correct: 0, streak: 0, best: 0, points: 0, locked: false, t0: S.now(), showText: false };
        renderQuestion();
    }
    function renderQuestion() {
        const t = T(), Q = S.quiz, q = Q.qs[Q.i]; Q.locked = false;
        $('rd-feedback').hidden = true; clear($('rd-feedback'));
        $('rd-qcount').textContent = fmt(t.qOf, { n: Q.i + 1, m: Q.qs.length });
        $('rd-qfill').style.width = (Q.i / Q.qs.length * 100) + '%';
        const qs = $('rd-qstats'); clear(qs);
        qs.appendChild(el('span', 'rd-pill', '🔥 ' + t.streakLabel + ' ' + Q.streak)); qs.appendChild(el('span', 'rd-pill', '⭐ ' + t.points + ' ' + Q.points));
        qs.appendChild(btn('💡 ' + (Q.showText ? t.hideText : t.showText), 'ghost small', () => { Q.showText = !Q.showText; renderQuestion(); }, 'rd-qhelp'));
        const c = $('rd-qcard'); clear(c);
        c.classList.remove('slide'); void c.offsetWidth; c.classList.add('slide');
        c.appendChild(el('div', 'rd-qemoji', '📖'));
        c.appendChild(el('h3', 'rd-question', q.q));
        if (Q.showText) { const tx = el('p', 'rd-qtext', ''); const full = S.cur.text, k = full.indexOf(q.ev); if (k >= 0) { tx.appendChild(document.createTextNode(full.slice(0, k))); tx.appendChild(el('mark', null, q.ev)); tx.appendChild(document.createTextNode(full.slice(k + q.ev.length))); } else tx.textContent = full; c.appendChild(tx); }
        c.appendChild(el('div', 'rd-zonelabel', t.choose));
        const opts = el('div', 'rd-opts');
        q.opts.forEach((o, i) => {
            const b = el('button', 'rd-opt s' + i); b.type = 'button'; b.dataset.i = i; b.style.animationDelay = (i * 70) + 'ms';
            b.appendChild(el('span', 'rd-shape', SHAPES[i])); b.appendChild(el('span', 'rd-optt', o)); b.appendChild(el('kbd', null, String(i + 1)));
            b.onclick = () => answer(i, b); opts.appendChild(b);
        });
        c.appendChild(opts);
    }
    function answer(i, node) {
        const Q = S.quiz; if (!Q || Q.locked) return; Q.locked = true;
        const t = T(), q = Q.qs[Q.i], all = document.querySelectorAll('#rd-qcard .rd-opt');
        all.forEach(b => { b.disabled = true; });
        const fb = $('rd-feedback'); clear(fb);
        if (i === q.ok) {
            Q.correct++; Q.streak++; Q.best = Math.max(Q.best, Q.streak); Q.points += 10 + Math.min(Q.streak, 5) * 2;
            node.classList.add('right'); try { Juice.correct(node, { streak: Q.streak }); } catch (e) { /* optional */ }
            fb.className = 'rd-feedback good'; fb.appendChild(el('b', null, '✓ ' + t.correct));
        } else {
            Q.streak = 0; node.classList.add('wrongc'); all[q.ok].classList.add('right');
            try { Juice.wrong(node); } catch (e) { /* optional */ }
            fb.className = 'rd-feedback bad'; fb.appendChild(el('b', null, t.wrongT + '. ' + t.answerWas + ' ' + q.opts[q.ok]));
        }
        fb.appendChild(el('p', null, t.textSays + ' «' + q.ev + '»'));
        fb.appendChild(btn(t.continue + ' ↵', 'big', nextQuestion, 'rd-qnext'));
        fb.hidden = false; $('rd-qnext').focus();
    }
    function nextQuestion() {
        const Q = S.quiz; if (!Q || !Q.locked) return;
        Q.i++; if (Q.i >= Q.qs.length) finishQuiz(); else renderQuestion();
    }
    async function finishQuiz() {
        const t = T(), Q = S.quiz; $('rd-feedback').hidden = true; $('rd-qfill').style.width = '100%';
        const n = Q.qs.length, ok = quizPassed(Q.correct, n), st = stars(Q.correct, n);
        $('rd-qstats').textContent = ''; $('rd-qcount').textContent = '';
        const c = $('rd-qcard'); clear(c); c.classList.remove('slide');
        c.appendChild(el('div', 'rd-qemoji', '🎉')); c.appendChild(el('h3', 'rd-question', t.quizDone));
        const sr = el('div', 'rd-endstars'); sr.id = 'rd-endstars'; sr.setAttribute('aria-hidden', 'true');
        for (let i = 0; i < 3; i++) { const s = el('span', i < st ? 'on' : '', '★'); s.style.animationDelay = (i * 350) + 'ms'; sr.appendChild(s); }
        c.appendChild(sr);
        c.appendChild(el('p', 'rd-big', fmt(t.quizScore, { a: Q.correct, b: n })));
        const e = S.prog.texts[S.cur.id] || {};
        if (e.lastPpm && e.lastPpm > zoneOf(level())[1] && !ok) c.appendChild(el('p', 'rd-note', t.quizTip));
        if (ok) { award('quiz'); if (S.cur.book) { const ee = S.prog.texts[S.cur.id]; ee.stars = Math.max(ee.stars || 0, st); save(); } try { Juice.levelUp(sr); } catch (x) { /* optional */ } }
        if (Q.correct === n) { S.prog.perfect = true; save(); }
        const row = el('div', 'rd-row wrap');
        if (S.cur.book) {
            const bk = S.cur.book, ci = S.cur.chIdx, nc = bk.chapters[ci + 1];
            if (ok && nc) {
                const tz = el('div', 'rd-teaser'); tz.id = 'rd-teaser';
                tz.appendChild(el('b', null, '📖 ' + t.nextTeaser + ': ' + fmt(t.chapterN, { n: ci + 2 }) + ', ' + nc.title));
                if (S.cur.hook) tz.appendChild(el('p', null, '«' + S.cur.hook + '»'));
                c.appendChild(tz);
                row.appendChild(btn(t.nextChapter + ' →', 'big', () => openChapter(bk, ci + 1), 'rd-nextchapter'));
            } else if (ok) {
                const bd = el('p', 'rd-big', '📚 ' + t.bookDoneMsg); bd.id = 'rd-bookdone'; c.appendChild(bd);
            } else {
                c.appendChild(el('p', 'rd-note', t.quizRetryHint));
                row.appendChild(btn('↺ ' + t.retryQuiz, 'big', () => gotoPhase('quiz'), 'rd-retryquiz'));
            }
            row.appendChild(btn(t.backBook, 'ghost', leaveText, 'rd-backbook'));
        } else {
            const idx = S.list.findIndex(x => x.id === S.cur.id), nxt = S.list[idx + 1];
            if (nxt) row.appendChild(btn(t.nextText + ' →', 'big', () => openText(nxt.id), 'rd-nexttext'));
            row.appendChild(btn(t.backList, 'ghost', leaveText, 'rd-backlist'));
        }
        c.appendChild(row);
        if (S.user && typeof PlatformFirestore !== 'undefined') {
            try {
                await PlatformFirestore.updateGameStats(S.user.uid, 'reading', { correctAnswers: Q.correct, totalQuestions: n, totalAttempts: n, bestStreak: Q.best,
                    elapsedSeconds: Math.round((S.now() - Q.t0) / 1000), level: bandIndex(level()) + 1, operation: S.cur.id });
            } catch (x) { console.warn('[Reading] stats not saved', x); }
        }
    }

    // ---- init
    function init() {
        S.uiLang = uiLang(); applyStatic();
        $('rd-age-save').onclick = submitAge;
        $('rd-age-in').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submitAge(); } });
        $('rd-quit').onclick = leaveText;
        $('rd-bookback').onclick = () => renderHome();
        $('rd-help').onclick = () => { const hb = $('rd-helpbox'); hb.hidden = !hb.hidden; $('rd-help').setAttribute('aria-expanded', String(!hb.hidden)); if (!hb.hidden) renderHelp(); };
        $('rd-consent-chk').onchange = () => { $('rd-consent-ok').disabled = !$('rd-consent-chk').checked; };
        $('rd-consent-no').onclick = closeConsent;
        $('rd-consent-ok').onclick = () => { S.prog.consent = true; S.prog.listen = true; save(); closeConsent(); renderHome(); };
        $('rd-textbox').addEventListener('click', e => {
            const w = e.target.closest ? e.target.closest('.rd-w') : null; if (!w || (S.solo && S.solo.running)) return;
            const i = Number(w.dataset.i); S.voiceOk = speak(S.tokens[i].raw.replace(/[^\p{L}\p{N}'’-]/gu, ''), S.cur.lang, 0.8);
        });
        document.addEventListener('keydown', e => {
            if (!$('rd-consent').hidden) { if (e.key === 'Escape') closeConsent(); return; }
            if (!$('rd-book').hidden) { if (e.key === 'Escape') renderHome(); return; }
            if ($('rd-text').hidden) return;
            if (e.target && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
            if (e.key === 'Escape') { leaveText(); return; }
            if (S.phase === 'solo' && (e.code === 'Space' || e.key === ' ')) { e.preventDefault(); if (!e.repeat) toggleSolo(); return; }
            if (S.phase === 'quiz' && S.quiz) {
                if (e.key === 'Enter') { if (S.quiz.locked) { e.preventDefault(); nextQuestion(); } return; }
                if (/^[1-4]$/.test(e.key) && !S.quiz.locked) { const b = document.querySelectorAll('#rd-qcard .rd-opt')[Number(e.key) - 1]; if (b) b.click(); }
            }
        });
        document.addEventListener('keyup', e => { if (!$('rd-text').hidden && S.phase === 'solo' && (e.code === 'Space' || e.key === ' ') && !(e.target && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName))) e.preventDefault(); });
        document.addEventListener('visibilitychange', () => { if (document.hidden) { stopRec(true); silence(); } });
        window.addEventListener('pagehide', () => { stopRec(true); silence(); });
        load(); renderHome();
        if (window.PlatformAuth && PlatformAuth.onAuthStateChanged) PlatformAuth.onAuthStateChanged(u => { S.user = u || null; load(); if (!$('rd-home').hidden || !$('rd-age').hidden) renderHome(); });
        document.addEventListener('platformLanguageChanged', () => { applyStatic(); if (!$('rd-home').hidden) renderHome(); else if (!$('rd-book').hidden) renderBook(); else if (!$('rd-text').hidden) { renderSteps(); if (S.phase === 'quiz') { if (S.quiz && !S.quiz.locked && S.quiz.i < S.quiz.qs.length) renderQuestion(); } else renderControls(); } });
    }

    const api = { init, _S: S, BANDS, BAND_IDS, PHASES, UI: I18N, FILES, TTS_LANG, MAX_PPM, MIN_SECS, bandForAge, zoneOf, targetPpm, zoneStatus, pauseOf, norm, tokenize, countWords, splitPunct,
        schedule, segments, computePpm, evaluateReading, alignWords, summarize, lev, pauseExercise, checkPauses, selectTexts, updateStreak, weeklyTrend, medalCount, totalMedals,
        achievements, stars, quizPassed, fmt, dayStr, blank, BOOK_FILES, selectBooks, chapterDone, chapterUnlocked, bookProgress, chapterAsText };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    return api;
})();
