/**
 * englishVerbs-EFC/dyn.js
 * Dynamic layer: labelled zones, always visible help, sound toggle, Juice feedback, animated stars, and two new
 * interactive formats: "put the three forms in order" (drag or tap) and "tap the irregular verb".
 * Scoring and saved progress stay in game.js (handleOrder follows the same rules as the multiple choice).
 */
const EVDyn = (() => {
    'use strict';
    const DYN = {
        es: { qn: (i, n) => `Pregunta ${i} de ${n}`, pair: (i, n) => `Pareja ${i} de ${n}`, zQ: 'Pregunta', zChoose: 'Elige', zType: 'Escribe', zOrder: 'Ordena', zMatch: 'Une', help: 'Ayuda',
              helpGeneric: 'Los verbos regulares añaden -ed. Los irregulares cambian: apréndelos por grupos.', check: 'Comprobar', slots: ['Infinitivo', 'Pasado simple', 'Participio'], tray: 'Toca o arrastra',
              keys: { mode_order: 'Ordena las formas', mode_order_d: 'Pon infinitivo, pasado y participio en su sitio', mode_odd: 'Verbo irregular', mode_odd_d: 'Toca el verbo que es irregular', q_order: 'Ordena las tres formas de "{v}" ({m})', q_odd: '¿Cuál de estos verbos es irregular?', ex_odd: 'Los verbos regulares solo añaden -ed.' } },
        en: { qn: (i, n) => `Question ${i} of ${n}`, pair: (i, n) => `Pair ${i} of ${n}`, zQ: 'Question', zChoose: 'Choose', zType: 'Type', zOrder: 'Put in order', zMatch: 'Match', help: 'Help',
              helpGeneric: 'Regular verbs add -ed. Irregular ones change: learn them by groups.', check: 'Check', slots: ['Infinitive', 'Past simple', 'Past participle'], tray: 'Tap or drag',
              keys: { mode_order: 'Order the forms', mode_order_d: 'Put infinitive, past and participle in place', mode_odd: 'Irregular verb', mode_odd_d: 'Tap the verb that is irregular', q_order: 'Put the three forms of "{v}" in order', q_odd: 'Which of these verbs is irregular?', ex_odd: 'Regular verbs just add -ed.' } },
        eu: { qn: (i, n) => `${n}tik ${i}. galdera`, pair: (i, n) => `${n}tik ${i}. bikotea`, zQ: 'Galdera', zChoose: 'Aukeratu', zType: 'Idatzi', zOrder: 'Ordenatu', zMatch: 'Lotu', help: 'Laguntza',
              helpGeneric: 'Aditz erregularrek -ed hartzen dute. Irregularrek aldatu egiten dira: ikasi taldeka.', check: 'Egiaztatu', slots: ['Infinitiboa', 'Lehen iragana', 'Partizipioa'], tray: 'Ukitu edo arrastatu',
              keys: { mode_order: 'Ordenatu formak', mode_order_d: 'Jarri infinitiboa, iragana eta partizipioa bere tokian', mode_odd: 'Aditz irregularra', mode_odd_d: 'Ukitu irregularra den aditza', q_order: 'Ordenatu "{v}" aditzaren hiru formak ({m})', q_odd: 'Zein da aditz irregularra?', ex_odd: 'Aditz erregularrek -ed gehitzen dute soilik.' } },
        gl: { qn: (i, n) => `Pregunta ${i} de ${n}`, pair: (i, n) => `Parella ${i} de ${n}`, zQ: 'Pregunta', zChoose: 'Elixe', zType: 'Escribe', zOrder: 'Ordena', zMatch: 'Une', help: 'Axuda',
              helpGeneric: 'Os verbos regulares engaden -ed. Os irregulares cambian: apréndeos por grupos.', check: 'Comprobar', slots: ['Infinitivo', 'Pasado simple', 'Participio'], tray: 'Toca ou arrastra',
              keys: { mode_order: 'Ordena as formas', mode_order_d: 'Pon infinitivo, pasado e participio no seu sitio', mode_odd: 'Verbo irregular', mode_odd_d: 'Toca o verbo que é irregular', q_order: 'Ordena as tres formas de "{v}" ({m})', q_odd: 'Cal destes verbos é irregular?', ex_odd: 'Os verbos regulares só engaden -ed.' } },
        ca: { qn: (i, n) => `Pregunta ${i} de ${n}`, pair: (i, n) => `Parella ${i} de ${n}`, zQ: 'Pregunta', zChoose: 'Tria', zType: 'Escriu', zOrder: 'Ordena', zMatch: 'Uneix', help: 'Ajuda',
              helpGeneric: 'Els verbs regulars afegeixen -ed. Els irregulars canvien: aprèn-los per grups.', check: 'Comprova', slots: ['Infinitiu', 'Passat simple', 'Participi'], tray: 'Toca o arrossega',
              keys: { mode_order: 'Ordena les formes', mode_order_d: 'Posa infinitiu, passat i participi al seu lloc', mode_odd: 'Verb irregular', mode_odd_d: 'Toca el verb que és irregular', q_order: 'Ordena les tres formes de "{v}" ({m})', q_odd: 'Quin d\'aquests verbs és irregular?', ex_odd: 'Els verbs regulars només afegeixen -ed.' } },
        fr: { qn: (i, n) => `Question ${i} sur ${n}`, pair: (i, n) => `Paire ${i} sur ${n}`, zQ: 'Question', zChoose: 'Choisis', zType: 'Écris', zOrder: 'Remets en ordre', zMatch: 'Relie', help: 'Aide',
              helpGeneric: 'Les verbes réguliers ajoutent -ed. Les irréguliers changent : apprends-les par groupes.', check: 'Vérifier', slots: ['Infinitif', 'Prétérit', 'Participe passé'], tray: 'Touche ou glisse',
              keys: { mode_order: 'Remets les formes en ordre', mode_order_d: 'Place infinitif, prétérit et participe', mode_odd: 'Verbe irrégulier', mode_odd_d: 'Touche le verbe irrégulier', q_order: 'Remets en ordre les trois formes de "{v}" ({m})', q_odd: 'Lequel de ces verbes est irrégulier ?', ex_odd: 'Les verbes réguliers ajoutent seulement -ed.' } }
    };
    if (typeof EV_I18N !== 'undefined') Object.keys(DYN).forEach(l => { EV_I18N[l] = EV_I18N[l] || {}; Object.assign(EV_I18N[l], DYN[l].keys); });
    const G = () => (typeof EnglishVerbsGame !== 'undefined' ? EnglishVerbsGame : null);
    const lang = () => { let l = 'es'; try { l = String((typeof PlatformI18n !== 'undefined' && PlatformI18n.currentLanguage) || localStorage.getItem('games_hub_language') || navigator.language || 'es').slice(0, 2).toLowerCase(); } catch (e) { /* default */ } return DYN[l] ? l : 'es'; };
    const T = () => DYN[lang()];
    const $ = id => document.getElementById(id);
    function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    const J = () => (typeof Juice !== 'undefined' ? Juice : null);
    const SHAPES = ['▲', '◆', '●', '■'];
    const S = { last: null, lastText: '', mo: null };

    function zone(icon, text, cls) { const z = el('div', 'evd-zone ' + cls); z.appendChild(el('span', 'evd-zi', icon)); z.appendChild(el('span', null, text)); return z; }

    // ---------- labels and zones (they follow what game.js renders) ----------
    function labels() {
        const t = T(), st = G() && G()._state, pv = $('ev-progress-val'); if (!pv || !st) return;
        const m = /(\d+)\s*\/\s*(\d+)/.exec(pv.textContent || '');
        const matching = !st.groupPracticeMode && st.level === 1;
        if (m) $('evd-qn').textContent = (matching ? t.pair : t.qn)(Number(m[1]), Number(m[2]));
        const sk = $('evd-streak'); if (sk) { sk.textContent = '🔥 ' + st.streak; sk.classList.toggle('hot', st.streak >= 3); }
        $('evd-help').textContent = '💡 ' + t.help; $('evd-help').setAttribute('aria-label', t.help);
    }
    function decorate() {
        const area = $('ev-question-area'), t = T(); if (!area || area.querySelector('.evd-zone') || !area.firstElementChild) return;
        const card = area.querySelector('.ev-question-card'), match = area.querySelector('.ev-matching-area');
        if (card) area.insertBefore(zone('❓', t.zQ, 'q'), card);
        if (match) area.insertBefore(zone('🔗', t.zMatch, 'q'), match);
        const opts = area.querySelector('.ev-options'), typ = area.querySelector('.ev-type-grid') || area.querySelector('.ev-fill-sentence');
        if (opts) area.insertBefore(zone('👆', t.zChoose, 'a'), opts);
        else if (typ) typ.parentNode.insertBefore(zone('✍️', t.zType, 'a'), typ);
        area.querySelectorAll('.ev-option-btn').forEach((b, i) => b.style.setProperty('--i', i));
        area.classList.remove('evd-enter'); void area.offsetWidth; area.classList.add('evd-enter');
        const h = $('evd-hint'); if (h) { h.textContent = ''; h.hidden = true; }
    }
    function refresh() { if (S.mo) S.mo.disconnect(); try { labels(); decorate(); } finally { watch(); } }
    function watch() {
        if (!S.mo) S.mo = new MutationObserver(() => refresh());
        const area = $('ev-question-area'), pv = $('ev-progress-val'), sv = $('ev-streak-val');
        if (area) S.mo.observe(area, { childList: true });
        [pv, sv].forEach(n => { if (n) S.mo.observe(n, { childList: true, characterData: true, subtree: true }); });
    }
    function showHelp() {
        const g = G(), st = g && g._state, t = T(), h = $('evd-hint'); if (!st || !h) return;
        const key = st.groupPracticeGroup && 'g_' + st.groupPracticeGroup + '_desc';
        const d = key && typeof EV_I18N !== 'undefined' && ((EV_I18N[lang()] || {})[key] || (EV_I18N.es || {})[key]);
        h.textContent = '💡 ' + (d || t.helpGeneric); h.hidden = false;
    }

    // ---------- feedback ----------
    function onFeedback(ok) {
        const j = J(), st = G()._state, target = S.last && document.body.contains(S.last) ? S.last : $('ev-question-area');
        if (j) { if (ok) j.correct(target, { streak: st.streak }); else j.wrong(target); }
        const fb = $('ev-feedback'); if (fb) { fb.classList.remove('evd-in'); void fb.offsetWidth; fb.classList.add('evd-in'); }
        labels();
    }
    function onPair(ok, btn) { const j = J(); if (!j) return; const st = G()._state; if (ok) j.correct(btn || $('ev-question-area'), { streak: st.streak, silent: st.streak % 3 !== 0 }); else j.wrong(btn || $('ev-question-area'), { silent: true }); labels(); }
    function onResults(stars) {
        const box = $('ev-result-stars'); if (!box) return;
        box.textContent = '';
        for (let i = 1; i <= 3; i++) { const s = el('span', 'evd-star' + (stars >= i ? ' on' : ''), '⭐'); s.style.setProperty('--d', ((i - 1) * 0.45) + 's'); box.appendChild(s); }
        const j = J(); if (j && stars >= 2) setTimeout(() => j.levelUp(box), 600);
    }

    // ---------- new format: order the three forms ----------
    function renderOrder(ex, current, total) {
        const t = T(), area = $('ev-question-area');
        area.textContent = '';
        const card = el('div', 'ev-question-card'); card.appendChild(el('p', 'ev-question-counter', t.qn(current + 1, total))); card.appendChild(el('p', 'ev-question-text', ex.sentence)); area.appendChild(card);
        area.insertBefore(zone('❓', t.zQ, 'q'), card);
        area.appendChild(zone('🔀', t.zOrder, 'a'));
        const slots = el('div', 'evd-slots'); slots.setAttribute('role', 'group');
        const placed = [null, null, null];
        for (let i = 0; i < 3; i++) {
            const s = el('button', 'evd-slot'); s.type = 'button'; s.dataset.i = i; s.setAttribute('aria-label', t.slots[i]);
            s.appendChild(el('small', 'evd-sl', `${i + 1}. ${t.slots[i]}`)); s.appendChild(el('span', 'evd-sv', ''));
            slots.appendChild(s);
        }
        area.appendChild(slots);
        const tray = el('div', 'evd-tray'); tray.setAttribute('role', 'group'); tray.setAttribute('aria-label', t.tray); area.appendChild(tray);
        const check = el('button', 'ev-btn ev-btn-primary evd-check', t.check); check.type = 'button'; check.id = 'evd-check'; check.disabled = true; area.appendChild(check);
        const chips = ex.forms.map((f, i) => {
            const b = el('button', 'evd-chip c' + (i % 4)); b.type = 'button'; b.dataset.form = f; b.dataset.k = i; b.style.setProperty('--i', i);
            const sh = el('i', 'evd-sh', SHAPES[i % 4]); sh.setAttribute('aria-hidden', 'true'); b.appendChild(sh); b.appendChild(el('span', null, f));
            tray.appendChild(b); return b;
        });
        let done = false;
        const paint = () => {
            slots.querySelectorAll('.evd-slot').forEach((s, i) => { s.querySelector('.evd-sv').textContent = placed[i] ? placed[i].dataset.form : ''; s.classList.toggle('filled', !!placed[i]); });
            chips.forEach(c => { c.hidden = placed.includes(c); });
            check.disabled = done || placed.some(p => !p);
        };
        const put = (chip, at) => {
            if (done) return;
            const from = placed.indexOf(chip); if (from >= 0) placed[from] = null;
            const idx = typeof at === 'number' ? at : placed.indexOf(null); if (idx < 0) return;
            placed[idx] = chip; paint();
        };
        slots.querySelectorAll('.evd-slot').forEach((s, i) => { s.onclick = () => { if (!done && placed[i]) { placed[i] = null; paint(); } }; });
        chips.forEach(c => {
            let sx = 0, sy = 0, moved = 0, active = false;
            c.onclick = e => { if (e.detail === 0) put(c); };
            c.addEventListener('pointerdown', e => { if (e.button || done) return; active = true; sx = e.clientX; sy = e.clientY; moved = 0; try { c.setPointerCapture(e.pointerId); } catch (x) { /* ok */ } c.classList.add('dragging'); });
            c.addEventListener('pointermove', e => { if (!active) return; const dx = e.clientX - sx, dy = e.clientY - sy; moved = Math.max(moved, Math.abs(dx) + Math.abs(dy)); c.style.transform = `translate(${dx}px,${dy}px) scale(1.08)`; });
            c.addEventListener('pointerup', e => {
                if (!active) return; active = false; c.classList.remove('dragging'); c.style.transform = '';
                if (moved < 8) { put(c); return; }
                const over = Array.from(slots.querySelectorAll('.evd-slot')).findIndex(s => { const r = s.getBoundingClientRect(); return e.clientX >= r.left - 12 && e.clientX <= r.right + 12 && e.clientY >= r.top - 12 && e.clientY <= r.bottom + 12; });
                if (over >= 0) put(c, over);
            });
            c.addEventListener('pointercancel', () => { active = false; c.classList.remove('dragging'); c.style.transform = ''; });
        });
        check.onclick = () => {
            if (done || check.disabled) return; done = true;
            const g = G(), values = placed.map(p => p.dataset.form), ok = g.handleOrder(values);
            slots.querySelectorAll('.evd-slot').forEach((s, i) => { s.disabled = true; s.classList.add(values[i] === ex.answer[i] ? 'ok' : 'bad'); if (values[i] !== ex.answer[i]) { s.querySelector('.evd-sv').textContent = values[i] + '  →  ' + ex.answer[i]; } });
            check.disabled = true; S.last = check;
            if (!ok) S.last = slots;
        };
        area.classList.remove('evd-enter'); void area.offsetWidth; area.classList.add('evd-enter');
        paint();
    }

    function onKey(e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const tray = document.querySelector('.evd-tray'); if (!tray || !$('ev-screen-game').classList.contains('active')) return;
        if (/^[1-3]$/.test(e.key)) { const vis = Array.from(tray.querySelectorAll('.evd-chip:not([hidden])')); const c = vis[Number(e.key) - 1]; if (c) { e.preventDefault(); c.click(); } }
    }
    function init() {
        const j = J(); if (j && $('evd-snd')) j.mountSoundToggle($('evd-snd'));
        $('evd-help').onclick = showHelp;
        document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('#ev-question-area button, #ev-question-area input'); if (b) S.last = b; }, true);
        document.addEventListener('keydown', onKey);
        document.addEventListener('platformLanguageChanged', () => setTimeout(labels, 0));
        labels(); watch();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
    return { S, T, DYN, renderOrder, onFeedback, onPair, onResults, labels };
})();
