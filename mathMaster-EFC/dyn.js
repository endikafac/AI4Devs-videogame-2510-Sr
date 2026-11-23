/**
 * MathMaster - dynamic question layer: labelled zones, floating balloons, drag the number into the hole,
 * Juice feedback. Presentation only: every answer goes through checkAnswer() in game.js, so scoring,
 * attempts and saved progress are untouched.
 */
const MathDyn = (() => {
    'use strict';
    const L = {
        es: { qn: (i, n) => `Pregunta ${i} de ${n}`, zQ: 'Pregunta', zType: 'Escribe', zDrag: 'Arrastra', zPop: 'Toca el globo', help: 'Ayuda', why: 'Así se hace' },
        en: { qn: (i, n) => `Question ${i} of ${n}`, zQ: 'Question', zType: 'Type', zDrag: 'Drag', zPop: 'Pop the balloon', help: 'Help', why: 'Here is how' },
        eu: { qn: (i, n) => `${n}tik ${i}. galdera`, zQ: 'Galdera', zType: 'Idatzi', zDrag: 'Arrastatu', zPop: 'Ukitu globoa', help: 'Laguntza', why: 'Horrela egiten da' },
        gl: { qn: (i, n) => `Pregunta ${i} de ${n}`, zQ: 'Pregunta', zType: 'Escribe', zDrag: 'Arrastra', zPop: 'Toca o globo', help: 'Axuda', why: 'Así se fai' },
        ca: { qn: (i, n) => `Pregunta ${i} de ${n}`, zQ: 'Pregunta', zType: 'Escriu', zDrag: 'Arrossega', zPop: 'Toca el globus', help: 'Ajuda', why: 'Així es fa' },
        fr: { qn: (i, n) => `Question ${i} sur ${n}`, zQ: 'Question', zType: 'Écris', zDrag: 'Glisse', zPop: 'Touche le ballon', help: 'Aide', why: 'Voici comment' }
    };
    const lang = () => { let l = 'es'; try { l = String((typeof MathMasterI18n !== 'undefined' && MathMasterI18n.currentLanguage) || (window.PlatformI18n && PlatformI18n.currentLanguage) || 'es').slice(0, 2); } catch (e) { /* default */ } return L[l] ? l : 'es'; };
    const T = () => L[lang()];
    const SHAPES = ['▲', '◆', '●', '■'];
    const $ = id => document.getElementById(id);
    function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    const J = () => (typeof Juice !== 'undefined' ? Juice : null);
    const S = { fmt: null, picked: null, idx: 0, mode: 'type', opts: [] };

    // ---- options (the right answer plus plausible wrong ones, all different enough to never pass the tolerance) ----
    function distractors(ans) {
        const dec = !Number.isInteger(ans), out = new Set(), key = v => String(Math.round(v * 1000) / 1000);
        const steps = dec ? [0.1, 0.2, 0.5, 1, 2, 10] : Math.abs(ans) >= 100 ? [1, 2, 10, 20, 100] : Math.abs(ans) >= 20 ? [1, 2, 5, 10] : [1, 2, 3, 5, 10];
        let g = 0;
        while (out.size < 3 && g++ < 80) {
            const st = steps[Math.floor(Math.random() * steps.length)], v = Math.round((ans + (Math.random() < 0.5 ? -st : st)) * 1000) / 1000;
            if (Math.abs(v - ans) < 0.05 || (ans >= 0 && v < 0)) continue;
            out.add(key(v));
        }
        let k = 1; while (out.size < 3) { out.add(key(ans + k)); k++; }
        return Array.from(out).map(Number);
    }
    function options(ans) {
        const a = Math.round(ans * 1000) / 1000, list = [a].concat(distractors(a));
        for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
        return list;
    }
    const fmt = v => (typeof formatAnswerText === 'function' ? formatAnswerText(v) : String(v));

    // ---- building blocks ----
    function optButton(label, v, i) {
        const b = el('button', 'mm-opt c' + (i % 4)); b.type = 'button'; b.dataset.v = String(v); b.style.setProperty('--i', i);
        const sh = el('i', 'mm-sh', SHAPES[i % 4]); sh.setAttribute('aria-hidden', 'true'); b.appendChild(sh);
        b.appendChild(el('span', 'mm-ol', label));
        const kn = el('small', 'mm-kn', String(i + 1)); kn.setAttribute('aria-hidden', 'true'); b.appendChild(kn);
        return b;
    }
    function pick(v, btn) {
        if (!gameState.isPlaying || gameState.isPaused || gameState.revealing) return;
        S.picked = btn; DOM.answerInput.value = String(v); checkAnswer();
    }
    function balloons(stage, list) {
        const sky = el('div', 'mm-sky'); sky.setAttribute('role', 'group');
        list.forEach((v, i) => {
            const b = el('button', 'mm-opt mm-balloon c' + (i % 4)); b.type = 'button'; b.dataset.v = String(v); b.style.setProperty('--d', (i * -0.8) + 's');
            b.appendChild(el('span', 'mm-bl' + (fmt(v).length > 5 ? ' sm' : ''), fmt(v)));
            const kn = el('small', 'mm-kn', String(i + 1)); kn.setAttribute('aria-hidden', 'true'); b.appendChild(kn);
            b.onclick = () => pick(v, b); sky.appendChild(b);
        });
        stage.appendChild(sky);
    }
    function dragFill(stage, hole, list) {
        const tray = el('div', 'mm-tray'); tray.setAttribute('role', 'group');
        list.forEach((v, i) => {
            const b = optButton(fmt(v), v, i); b.classList.add('mm-drag');
            let sx = 0, sy = 0, moved = 0, active = false;
            const near = (e, h) => e.clientX > h.left - 40 && e.clientX < h.right + 40 && e.clientY > h.top - 40 && e.clientY < h.bottom + 40;
            const fire = () => { hole.textContent = fmt(v); hole.classList.add('filled'); pick(v, b); };
            b.onclick = e => { if (e.detail === 0) fire(); };
            b.addEventListener('pointerdown', e => { if (e.button) return; active = true; sx = e.clientX; sy = e.clientY; moved = 0; try { b.setPointerCapture(e.pointerId); } catch (x) { /* ok */ } b.classList.add('dragging'); });
            b.addEventListener('pointermove', e => { if (!active) return; const dx = e.clientX - sx, dy = e.clientY - sy; moved = Math.max(moved, Math.abs(dx) + Math.abs(dy)); b.style.transform = `translate(${dx}px,${dy}px) scale(1.08)`; hole.classList.toggle('over', near(e, hole.getBoundingClientRect())); });
            b.addEventListener('pointerup', e => { if (!active) return; active = false; b.classList.remove('dragging'); hole.classList.remove('over'); b.style.transform = ''; if (moved < 8 || near(e, hole.getBoundingClientRect())) fire(); });
            b.addEventListener('pointercancel', () => { active = false; b.classList.remove('dragging'); b.style.transform = ''; });
            tray.appendChild(b);
        });
        stage.appendChild(tray);
    }

    // ---- hooks called from game.js ----
    function setZones(mode) {
        const t = T();
        $('mm-zq').textContent = ''; $('mm-zq').appendChild(el('span', 'mm-zi', '❓')); $('mm-zq').appendChild(el('span', null, t.zQ));
        const za = $('mm-za'); za.textContent = '';
        za.appendChild(el('span', 'mm-zi', mode === 'balloon' ? '🎈' : mode === 'drag' ? '🧲' : '✍️'));
        za.appendChild(el('span', null, mode === 'balloon' ? t.zPop : mode === 'drag' ? t.zDrag : t.zType));
    }
    function onStart() {
        S.idx = 0; S.picked = null;
        const j = J(); if (j && typeof MathMasterAudio !== 'undefined' && MathMasterAudio.enabled === false) j.setMuted(true);
        refresh();
    }
    function refresh() {
        const st = $('streak'); if (st) st.classList.toggle('hot', gameState.currentStreak >= 3);
        const pb = $('progress-bar'); if (pb) pb.classList.add('mm-anim');
    }
    function onQuestion() {
        const screen = $('game-screen'), stage = $('mm-stage'), t = T();
        S.idx++; S.picked = null; stage.textContent = '';
        const hole = !gameState.currentIsStory && gameState.currentQuestion.indexOf('?') >= 0 && gameState.currentQuestion.split('?').length === 2;
        const k = (S.idx - 1) % 3;
        let mode = S.fmt || (k === 0 ? 'balloon' : k === 1 && hole ? 'drag' : 'type');
        if (mode === 'drag' && !hole) mode = 'balloon';
        S.mode = mode; screen.dataset.fmt = mode; S.opts = [];
        setZones(mode);
        $('mm-qn').textContent = t.qn(Math.min(gameState.correctAnswers + 1, gameState.totalQuestions), gameState.totalQuestions);
        $('mm-help').textContent = '💡 ' + t.help; $('mm-help').setAttribute('aria-label', t.help);
        $('hint-text').classList.remove('mm-why');
        if (mode !== 'type') {
            S.opts = options(gameState.currentAnswer);
            if (mode === 'balloon') balloons(stage, S.opts);
            else {
                const qt = DOM.questionText, parts = gameState.currentQuestion.split('?'); qt.textContent = '';
                qt.appendChild(document.createTextNode(parts[0])); const h = el('em', 'mm-hole', '?'); qt.appendChild(h); qt.appendChild(document.createTextNode(parts[1]));
                dragFill(stage, h, S.opts);
            }
        }
        const area = document.querySelector('#game-screen .question-area'); area.classList.remove('mm-enter'); void area.offsetWidth; area.classList.add('mm-enter');
    }
    function lock() { document.querySelectorAll('#mm-stage .mm-opt').forEach(b => { b.disabled = true; }); const sky = document.querySelector('#mm-stage .mm-sky'); if (sky) sky.classList.add('done'); }
    function equationText() {
        if (gameState.currentIsStory || gameState.currentQuestion.indexOf('?') < 0) return '';
        return gameState.currentQuestion.replace('?', fmt(gameState.currentAnswer));
    }
    function onCorrect() {
        const j = J(), target = S.picked || DOM.questionText.closest('.question-box');
        lock(); const hole = document.querySelector('.mm-hole'); if (hole) hole.classList.add('ok');
        if (S.picked) S.picked.classList.add('ok');
        if (j) j.correct(target, { streak: gameState.currentStreak });
        const eq = equationText(); if (eq) { DOM.hintText.textContent = '✔ ' + eq; DOM.hintText.classList.add('mm-why'); }
        refresh();
    }
    function onWrong() {
        const j = J(), b = S.picked; DOM.hintText.classList.add('mm-why');
        if (b) { b.classList.add('bad'); b.disabled = true; }
        const hole = document.querySelector('.mm-hole');
        if (hole) { hole.classList.add('bad'); setTimeout(() => { hole.classList.remove('bad', 'filled', 'over'); hole.textContent = '?'; }, 700); }
        if (j) j.wrong(b || DOM.questionText.closest('.question-box'));
        S.picked = null; refresh();
    }
    function onReveal() {
        const want = String(Math.round(gameState.currentAnswer * 1000) / 1000);
        lock();
        document.querySelectorAll('#mm-stage .mm-opt').forEach(b => { if (b.dataset.v === want) b.classList.add('ok'); });
        const hole = document.querySelector('.mm-hole'); if (hole) { hole.textContent = fmt(gameState.currentAnswer); hole.classList.remove('bad'); hole.classList.add('filled', 'ok'); }
        const eq = equationText(); DOM.hintText.textContent = eq ? `${T().why}: ${eq}` : ''; DOM.hintText.classList.add('mm-why');
    }
    function onResults(accuracy) { const j = J(); if (j && accuracy >= 80) setTimeout(() => j.levelUp(document.getElementById('results-emoji')), 500); }
    function onKey(e) {
        if (!gameState.isPlaying || gameState.isPaused || S.mode === 'type' || !/^[1-4]$/.test(e.key)) return;
        const bs = document.querySelectorAll('#mm-stage .mm-opt'), b = bs[Number(e.key) - 1]; // fixed positions, a missed balloon keeps its number
        if (b && b.disabled) return;
        if (b) { e.preventDefault(); b.click(); }
    }
    function init() {
        const j = J();
        if (j && $('mm-snd')) { const b = j.mountSoundToggle($('mm-snd')); if (b) b.addEventListener('click', () => { if (typeof MathMasterAudio !== 'undefined') MathMasterAudio.enabled = !j.muted(); }); }
        $('mm-help').onclick = () => { if (gameState.isPlaying && !gameState.revealing) { showHint(); DOM.hintText.classList.add('mm-why'); } };
        document.addEventListener('keydown', onKey);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
    return { S, T, L, onStart, onQuestion, onCorrect, onWrong, onReveal, onResults, refresh, options, distractors };
})();
