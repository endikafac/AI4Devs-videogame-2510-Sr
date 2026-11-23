/**
 * Camino del Calculo - presentation helpers (labels, balloons, drag-into-the-hole, animated stars).
 * Pure presentation: scoring and saved progress stay in game.js.
 */
const CalcDyn = (() => {
    'use strict';
    const L = {
        es: { qn: (i, n) => n ? `Pregunta ${i} de ${n}` : `Pregunta ${i}`, zQ: 'Pregunta', zChoose: 'Elige', zType: 'Escribe', zDrag: 'Arrastra', zPop: 'Toca el globo', help: 'Ayuda', streak: 'Racha', why: 'Por qué', sound: 'Sonido' },
        en: { qn: (i, n) => n ? `Question ${i} of ${n}` : `Question ${i}`, zQ: 'Question', zChoose: 'Choose', zType: 'Type', zDrag: 'Drag', zPop: 'Pop the balloon', help: 'Help', streak: 'Streak', why: 'Why', sound: 'Sound' },
        eu: { qn: (i, n) => n ? `${n}tik ${i}. galdera` : `${i}. galdera`, zQ: 'Galdera', zChoose: 'Aukeratu', zType: 'Idatzi', zDrag: 'Arrastatu', zPop: 'Ukitu globoa', help: 'Laguntza', streak: 'Erreta', why: 'Zergatik', sound: 'Soinua' },
        gl: { qn: (i, n) => n ? `Pregunta ${i} de ${n}` : `Pregunta ${i}`, zQ: 'Pregunta', zChoose: 'Elixe', zType: 'Escribe', zDrag: 'Arrastra', zPop: 'Toca o globo', help: 'Axuda', streak: 'Racha', why: 'Por que', sound: 'Son' },
        ca: { qn: (i, n) => n ? `Pregunta ${i} de ${n}` : `Pregunta ${i}`, zQ: 'Pregunta', zChoose: 'Tria', zType: 'Escriu', zDrag: 'Arrossega', zPop: 'Toca el globus', help: 'Ajuda', streak: 'Ratxa', why: 'Per què', sound: 'So' },
        fr: { qn: (i, n) => n ? `Question ${i} sur ${n}` : `Question ${i}`, zQ: 'Question', zChoose: 'Choisis', zType: 'Écris', zDrag: 'Glisse', zPop: 'Touche le ballon', help: 'Aide', streak: 'Série', why: 'Pourquoi', sound: 'Son' }
    };
    const lang = () => { const l = ((window.PlatformI18n && PlatformI18n.currentLanguage) || 'es').slice(0, 2); return L[l] ? l : 'es'; };
    const T = () => L[lang()];
    const SHAPES = ['▲', '◆', '●', '■'];
    function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

    /** A small labelled zone title ("Pregunta", "Elige"...). */
    function zone(parent, icon, text, cls) {
        const z = el('div', 'cp-zone' + (cls ? ' ' + cls : '')); z.appendChild(el('span', 'cp-zi', icon)); z.appendChild(el('span', null, text)); z.setAttribute('role', 'presentation');
        parent.appendChild(z); return z;
    }
    /** Restart the slide-in animation of a card (children come in one after the other via --i). */
    function enter(card) {
        card.classList.remove('cp-enter'); void card.offsetWidth; card.classList.add('cp-enter');
        Array.prototype.forEach.call(card.children, (c, i) => c.style.setProperty('--i', i));
    }
    function setStreak(box, n) {
        if (!box) return; const t = T();
        box.textContent = ''; box.appendChild(el('span', 'cp-flame' + (n >= 3 ? ' hot' : ''), '🔥')); box.appendChild(el('b', null, String(n)));
        box.setAttribute('aria-label', `${t.streak}: ${n}`); box.title = t.streak; box.classList.toggle('hot', n >= 3);
    }
    function setHelp(btn) { if (!btn) return; const t = T(); btn.textContent = '💡 ' + t.help; btn.setAttribute('aria-label', t.help); }
    const mounted = {};
    function mountSound(id) {
        const box = document.getElementById(id); if (!box || mounted[id]) return; mounted[id] = true;
        if (typeof Juice !== 'undefined') Juice.mountSoundToggle(box);
    }
    /** Coloured, shaped option button (Kahoot style). */
    function optButton(label, v, i) {
        const b = el('button', 'cp-opt c' + (i % 4)); b.type = 'button'; b.dataset.v = String(v); b.style.setProperty('--i', i);
        b.appendChild(el('i', 'cp-sh', SHAPES[i % 4])); b.appendChild(el('span', 'cp-ol', label)); b.appendChild(el('small', 'cp-kn', String(i + 1)));
        b.querySelector('.cp-sh').setAttribute('aria-hidden', 'true'); b.querySelector('.cp-kn').setAttribute('aria-hidden', 'true');
        return b;
    }
    /** Floating balloons: tap the one with the right answer. list = [{label, v}] */
    function balloons(card, list, pick) {
        const sky = el('div', 'cp-sky'); sky.setAttribute('role', 'group');
        list.forEach((o, i) => {
            const b = el('button', 'cp-opt cp-balloon c' + (i % 4)); b.type = 'button'; b.dataset.v = String(o.v); b.style.setProperty('--i', i); b.style.setProperty('--d', (i * -0.8) + 's');
            const lab = el('span', 'cp-bl' + (String(o.label).length > 5 ? ' sm' : ''), o.label); b.appendChild(lab);
            b.appendChild(el('small', 'cp-kn', String(i + 1))); b.querySelector('.cp-kn').setAttribute('aria-hidden', 'true');
            b.onclick = () => pick(o.v, b); sky.appendChild(b);
        });
        card.appendChild(sky); return sky;
    }
    /** Drag a number chip into the hole of the equation. Tap, Enter and keys 1-4 also work. */
    function dragFill(card, hole, list, pick) {
        hole.classList.add('cp-hole'); hole.setAttribute('aria-label', '?');
        const tray = el('div', 'cp-tray'); tray.setAttribute('role', 'group');
        list.forEach((o, i) => {
            const b = optButton(o.label, o.v, i); b.classList.add('cp-drag');
            let sx = 0, sy = 0, moved = 0, active = false, done = false;
            const fire = () => { if (done) return; done = true; hole.textContent = o.label; hole.classList.add('filled'); pick(o.v, b); };
            b.onclick = e => { if (e.detail === 0) fire(); };
            b.addEventListener('pointerdown', e => { if (e.button) return; active = true; sx = e.clientX; sy = e.clientY; moved = 0; try { b.setPointerCapture(e.pointerId); } catch (x) { /* ok */ } b.classList.add('dragging'); });
            b.addEventListener('pointermove', e => { if (!active) return; const dx = e.clientX - sx, dy = e.clientY - sy; moved = Math.max(moved, Math.abs(dx) + Math.abs(dy)); b.style.transform = `translate(${dx}px,${dy}px) scale(1.08)`; const h = hole.getBoundingClientRect(); hole.classList.toggle('over', near(e, h)); });
            const near = (e, h) => e.clientX > h.left - 40 && e.clientX < h.right + 40 && e.clientY > h.top - 40 && e.clientY < h.bottom + 40;
            b.addEventListener('pointerup', e => {
                if (!active) return; active = false; b.classList.remove('dragging'); hole.classList.remove('over');
                const h = hole.getBoundingClientRect();
                if (moved < 8 || near(e, h)) { b.style.transform = ''; fire(); } else b.style.transform = '';
            });
            b.addEventListener('pointercancel', () => { active = false; b.classList.remove('dragging'); b.style.transform = ''; });
            tray.appendChild(b);
        });
        card.appendChild(tray); return tray;
    }
    /** Stars that appear one by one. */
    function stars(box, n, total, onAll) {
        box.textContent = '';
        for (let i = 0; i < total; i++) { const s = el('span', 'cp-star' + (i < n ? ' on' : ''), i < n ? '★' : '☆'); s.style.setProperty('--d', (i * 0.45) + 's'); box.appendChild(s); }
        if (onAll && n >= 2 && typeof window.setTimeout === 'function') window.setTimeout(onAll, Math.max(1, n) * 450);
    }
    /** Is the option buttons' digit shortcut (1-4) applicable on the current card? */
    function pickByDigit(card, key) {
        const n = Number(key); if (!(n >= 1 && n <= 6)) return false;
        const bs = card.querySelectorAll('button.cp-opt:not(:disabled)'); if (!bs.length || !bs[n - 1]) return false;
        bs[n - 1].click(); return true;
    }
    return { T, L, el, zone, enter, setStreak, setHelp, mountSound, optButton, balloons, dragFill, stars, pickByDigit, SHAPES };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = CalcDyn;
