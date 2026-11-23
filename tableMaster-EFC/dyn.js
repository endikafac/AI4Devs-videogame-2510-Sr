/**
 * TableMaster - dynamic question layer for the drill screen (and Juice on the step-by-step practice):
 *  - labelled zones ("Pregunta 3 de 10", answer area label, help, sound toggle)
 *  - coloured multiplication grid: tap the right product among coloured tiles
 *  - speed round: three big tiles with a soft shrinking bar (no game over)
 * Every pick goes through TableMasterGame._drillSubmit(), so scoring, stars and saved progress do not change.
 */
const TMDyn = (() => {
    'use strict';
    const L = {
        es: { qn: (i, n) => n ? `Pregunta ${i} de ${n}` : `Pregunta ${i}`, zQ: 'Pregunta', zType: 'Escribe', zGrid: 'Toca el resultado', zSpeed: 'Ronda relámpago', help: 'Ayuda', think: n => `Piensa en la tabla del ${n}`, hint: 'Pista' },
        en: { qn: (i, n) => n ? `Question ${i} of ${n}` : `Question ${i}`, zQ: 'Question', zType: 'Type', zGrid: 'Tap the result', zSpeed: 'Lightning round', help: 'Help', think: n => `Think of the ${n} times table`, hint: 'Hint' },
        eu: { qn: (i, n) => n ? `${n}tik ${i}. galdera` : `${i}. galdera`, zQ: 'Galdera', zType: 'Idatzi', zGrid: 'Ukitu emaitza', zSpeed: 'Tximista txanda', help: 'Laguntza', think: n => `Pentsatu ${n}ren taulan`, hint: 'Pista' },
        gl: { qn: (i, n) => n ? `Pregunta ${i} de ${n}` : `Pregunta ${i}`, zQ: 'Pregunta', zType: 'Escribe', zGrid: 'Toca o resultado', zSpeed: 'Roda lóstrego', help: 'Axuda', think: n => `Pensa na táboa do ${n}`, hint: 'Pista' },
        ca: { qn: (i, n) => n ? `Pregunta ${i} de ${n}` : `Pregunta ${i}`, zQ: 'Pregunta', zType: 'Escriu', zGrid: 'Toca el resultat', zSpeed: 'Ronda llampec', help: 'Ajuda', think: n => `Pensa en la taula del ${n}`, hint: 'Pista' },
        fr: { qn: (i, n) => n ? `Question ${i} sur ${n}` : `Question ${i}`, zQ: 'Question', zType: 'Écris', zGrid: 'Touche le résultat', zSpeed: 'Manche éclair', help: 'Aide', think: n => `Pense à la table de ${n}`, hint: 'Indice' }
    };
    const lang = () => { let l = 'es'; try { l = String((typeof TableMasterI18n !== 'undefined' && TableMasterI18n.currentLanguage) || (window.PlatformI18n && PlatformI18n.currentLanguage) || 'es').slice(0, 2); } catch (e) { /* default */ } return L[l] ? l : 'es'; };
    const T = () => L[lang()];
    const SHAPES = ['▲', '◆', '●', '■', '★', '♥'];
    const $ = id => document.getElementById(id);
    function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    const J = () => (typeof Juice !== 'undefined' ? Juice : null);
    const G = () => (typeof TableMasterGame !== 'undefined' ? TableMasterGame : null);
    const S = { fmt: null, mode: 'type', picked: null, timer: null };

    function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    /** The right answer plus the typical mistakes (neighbour products, off by ten, off by one). */
    function choices(cur, n) {
        const ans = cur.answer, out = new Set([ans]);
        const cand = [];
        if (cur.kind === 'mul' && cur.a && cur.b) cand.push(cur.a * (cur.b + 1), cur.a * (cur.b - 1), (cur.a + 1) * cur.b, (cur.a - 1) * cur.b, ans + 10, ans - 10, ans + 1, ans - 1);
        else cand.push(ans + 1, ans - 1, ans + 2, ans - 2, ans + 10, ans - 10, ans + 3, ans - 3);
        shuffle(cand).forEach(v => { if (out.size < n && v > 0 && v !== ans && v < 1000) out.add(v); });
        let k = 1; while (out.size < n) { out.add(ans + k); k++; }
        return shuffle(Array.from(out));
    }
    function pick(v, btn) {
        const g = G(), d = g && g._drill;
        if (!d || d.ended || d.locked || g.state.currentScreen !== 'screen-drill') return;
        S.picked = btn; d.answer = String(v); g._renderDrillAnswer(); g._drillSubmit();
    }
    function tiles(stage, list, kind) {
        const box = el('div', 'tmd-tiles ' + kind); box.setAttribute('role', 'group');
        list.forEach((v, i) => {
            const b = el('button', 'tmd-opt h' + (i % 6)); b.type = 'button'; b.dataset.v = String(v); b.style.setProperty('--i', i);
            const sh = el('i', 'tmd-sh', SHAPES[i % 6]); sh.setAttribute('aria-hidden', 'true'); b.appendChild(sh); b.appendChild(el('span', 'tmd-ol', String(v)));
            b.onclick = () => pick(v, b); box.appendChild(b);
        });
        stage.appendChild(box);
    }

    // ---- hooks ----
    function onQuestion(g) {
        const d = g._drill, scr = $('screen-drill'), stage = $('tmd-stage'), t = T();
        if (S.timer) { clearTimeout(S.timer); S.timer = null; }
        stage.textContent = ''; S.picked = null;
        d.fmtN = (d.fmtN || 0) + 1;
        const cur = d.current, i = d.fmtN - 1;
        // the first two questions use the classic keypad (warm up), then the formats alternate
        const SEQ = d.timed ? ['type', 'speed', 'type', 'speed'] : ['type', 'type', 'grid', 'speed', 'type', 'grid', 'speed', 'type', 'grid', 'speed'];
        let mode = S.fmt || SEQ[i % SEQ.length];
        S.mode = mode; scr.dataset.fmt = mode;
        const za = $('tmd-za'); za.textContent = '';
        za.appendChild(el('span', 'tmd-zi', mode === 'grid' ? '🟦' : mode === 'speed' ? '⚡' : '✍️'));
        za.appendChild(el('span', null, mode === 'grid' ? t.zGrid : mode === 'speed' ? t.zSpeed : t.zType));
        const zq = $('tmd-zq'); zq.textContent = ''; zq.appendChild(el('span', 'tmd-zi', '❓')); zq.appendChild(el('span', null, t.zQ));
        $('tmd-help').textContent = '💡 ' + t.help; $('tmd-help').setAttribute('aria-label', t.help);
        const hint = $('tmd-hint'); hint.textContent = ''; hint.hidden = true;
        if (mode === 'grid') tiles(stage, choices(cur, 6), 'grid');
        else if (mode === 'speed') {
            tiles(stage, choices(cur, 3), 'speed');
            const bar = el('div', 'tmd-soft'); bar.setAttribute('aria-hidden', 'true'); const fill = el('i'); bar.appendChild(fill); stage.appendChild(bar);
            S.timer = setTimeout(() => { bar.classList.add('late'); }, 6000);
        }
        refresh();
        scr.classList.remove('tmd-enter'); void scr.offsetWidth; scr.classList.add('tmd-enter');
    }
    function refresh() {
        const g = G(), d = g && g._drill; if (!d) return;
        const t = T(), n = d.timed ? 0 : d.total;
        $('tmd-qn').textContent = t.qn(d.timed ? d.asked + 1 : Math.min(d.idx + 1, d.total), n);
        const st = $('drill-hud-streak'); if (st) st.classList.toggle('hot', d.streak >= 3);
    }
    function lock(rightV) {
        document.querySelectorAll('#tmd-stage .tmd-opt').forEach(b => { b.disabled = true; if (rightV != null && b.dataset.v === String(rightV)) b.classList.add('ok'); });
        const bar = document.querySelector('#tmd-stage .tmd-soft'); if (bar) bar.classList.add('stop');
        if (S.timer) { clearTimeout(S.timer); S.timer = null; }
    }
    function onResult(ok) {
        const g = G(), d = g._drill, j = J(), cur = d.current, target = S.picked || $('drill-qcard');
        lock(cur.answer);
        if (S.picked) S.picked.classList.add(ok ? 'ok' : 'bad');
        if (j) { if (ok) j.correct(target, { streak: d.streak }); else j.wrong(target); }
        refresh();
    }
    function onEnd(stars) { const j = J(); if (j && stars >= 2) setTimeout(() => j.levelUp($('drill-stars')), 600); }
    function onExercise(i, n) { const q = $('tmp-qn'); if (q) q.textContent = T().qn(i, n); const h = $('tmp-help'); if (h) { h.textContent = '💡 ' + T().help; h.setAttribute('aria-label', T().help); } }
    function onInline(type, container) {
        const j = J(); if (!j) return;
        if (type === 'correct') j.correct(container, { streak: 0, silent: false }); else j.wrong(container);
    }
    function showHelp() {
        const g = G(), d = g && g._drill; if (!d || d.ended || !d.current) return;
        const cur = d.current, hint = $('tmd-hint'), t = T();
        let txt = '';
        if (cur.kind === 'mul' && cur.a && cur.b && typeof TableMasterLearn !== 'undefined') txt = TableMasterLearn.workedStep(cur.a, cur.b).split(' = ').slice(0, 2).join(' = ');
        else if (cur.tbl) txt = t.think(cur.tbl);
        else txt = t.think(cur.a || cur.k || 2);
        hint.textContent = '💡 ' + txt; hint.hidden = false;
    }
    function onKey(e) {
        const g = G(); if (!g || !g._drill || g.state.currentScreen !== 'screen-drill' || S.mode === 'type') return;
        const a = document.activeElement;
        if ((e.key === 'Enter' || e.key === ' ') && a && a.classList && a.classList.contains('tmd-opt')) { e.preventDefault(); e.stopImmediatePropagation(); a.click(); }
    }
    function init() {
        const j = J();
        if (j) { if ($('tmd-snd')) j.mountSoundToggle($('tmd-snd')); if ($('tmp-snd')) j.mountSoundToggle($('tmp-snd')); }
        $('tmd-help').onclick = showHelp;
        $('tmp-help').onclick = () => { const b = $('btn-practice-hint'); if (b) b.click(); };
        document.addEventListener('keydown', onKey, true);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
    return { S, T, L, onQuestion, onResult, onEnd, onExercise, onInline, refresh, choices };
})();
