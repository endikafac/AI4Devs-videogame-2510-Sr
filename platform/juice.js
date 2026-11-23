/**
 * Games Hub - "juice": the small things that make answering a question feel good.
 * Sound (WebAudio, no files), confetti, shake and pop animations, haptics, praise and combo messages.
 * Self contained: injects its own CSS, no dependencies, respects prefers-reduced-motion and a mute switch.
 *
 *   Juice.correct(el, { streak })   a right answer: chime, pop, confetti from el, vibration, floating praise
 *   Juice.wrong(el)                 a wrong answer: soft buzz, shake, short vibration (never harsh)
 *   Juice.tick() / Juice.levelUp()  small sounds for timers and big moments
 *   Juice.praise(streak)            localized praise text for a streak
 *   Juice.mountSoundToggle(parent)  a 🔊/🔇 button, remembered in localStorage
 *   Juice.burst(x, y)               confetti from a screen point
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory(null);
    else root.Juice = factory(root);
})(typeof self !== 'undefined' ? self : this, function (win) {
    'use strict';

    var LANGS = ['es', 'en', 'eu', 'gl', 'ca', 'fr'];
    var PRAISE = {
        es: ['¡Muy bien!', '¡Genial!', '¡Así se hace!', '¡Fantástico!', '¡Lo has clavado!'],
        en: ['Well done!', 'Great!', 'Nice one!', 'Fantastic!', 'You nailed it!'],
        eu: ['Oso ondo!', 'Bikain!', 'Horrela!', 'Zoragarria!', 'Asmatu duzu!'],
        gl: ['Moi ben!', 'Xenial!', 'Así se fai!', 'Fantástico!', 'Cravouno!'],
        ca: ['Molt bé!', 'Genial!', 'Així es fa!', 'Fantàstic!', 'L’has clavat!'],
        fr: ['Très bien !', 'Génial !', 'Bravo !', 'Fantastique !', 'Tu l’as eu !']
    };
    var COMBO = {
        es: ['Racha de {n}', '¡Imparable! {n} seguidas', '¡Increíble! {n} seguidas'],
        en: ['Streak of {n}', 'Unstoppable! {n} in a row', 'Incredible! {n} in a row'],
        eu: ['{n}ko erreta', 'Geldiezina! {n} segidan', 'Sinesgaitza! {n} segidan'],
        gl: ['Racha de {n}', 'Imparable! {n} seguidas', 'Incrible! {n} seguidas'],
        ca: ['Ratxa de {n}', 'Imparable! {n} seguides', 'Increïble! {n} seguides'],
        fr: ['Série de {n}', 'Inarrêtable ! {n} d’affilée', 'Incroyable ! {n} d’affilée']
    };
    var TRY = {
        es: ['Casi. ¡Inténtalo otra vez!', 'No pasa nada, así se aprende', 'Mira la respuesta y sigue'],
        en: ['Almost. Try again!', 'No worries, that is how we learn', 'Look at the answer and carry on'],
        eu: ['Ia-ia. Saiatu berriro!', 'Ez da ezer, horrela ikasten da', 'Begiratu erantzunari eta jarraitu'],
        gl: ['Case. Tenta outra vez!', 'Non pasa nada, así se aprende', 'Mira a resposta e segue'],
        ca: ['Gairebé. Torna-ho a provar!', 'No passa res, així s’aprèn', 'Mira la resposta i continua'],
        fr: ['Presque. Réessaie !', 'Ce n’est pas grave, on apprend', 'Regarde la réponse et continue']
    };

    function lang() {
        var l = 'es';
        try { var P = (win && win.PlatformI18n) || (typeof PlatformI18n !== 'undefined' ? PlatformI18n : null); if (P && P.currentLanguage) l = String(P.currentLanguage).slice(0, 2); } catch (e) { /* ignore */ }
        return LANGS.indexOf(l) >= 0 ? l : 'es';
    }
    function pick(arr, i) { return arr[i % arr.length]; }
    function praise(streak) {
        var l = lang(), n = streak || 0;
        if (n >= 10) return pick(COMBO[l], 2).replace('{n}', n);
        if (n >= 5) return pick(COMBO[l], 1).replace('{n}', n);
        if (n >= 3) return pick(COMBO[l], 0).replace('{n}', n);
        return pick(PRAISE[l], Math.floor(Math.random() * 5));
    }
    function tryAgain() { return pick(TRY[lang()], Math.floor(Math.random() * 3)); }

    var doc = win && win.document;
    function reduced() { try { return !!(win && win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } }
    function muted() { try { return win.localStorage.getItem('gh_sound') === '0'; } catch (e) { return false; } }
    function setMuted(v) { try { win.localStorage.setItem('gh_sound', v ? '0' : '1'); } catch (e) { /* ignore */ } }

    // ---- sound (WebAudio synthesis, quiet and short) ----
    var ctx = null;
    function audio() {
        if (!win) return null;
        if (!ctx) { var AC = win.AudioContext || win.webkitAudioContext; if (!AC) return null; try { ctx = new AC(); } catch (e) { return null; } }
        if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { /* ignore */ } }
        return ctx;
    }
    function tone(freq, start, dur, type, vol) {
        var a = audio(); if (!a) return;
        var t0 = a.currentTime + start, o = a.createOscillator(), g = a.createGain();
        o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.07, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0 + dur + 0.02);
    }
    function sfx(name) {
        if (muted()) return;
        try {
            if (name === 'ok') { tone(523.25, 0, 0.14, 'triangle'); tone(659.25, 0.09, 0.14, 'triangle'); tone(783.99, 0.18, 0.22, 'triangle'); }
            else if (name === 'combo') { tone(659.25, 0, 0.1, 'triangle'); tone(783.99, 0.08, 0.1, 'triangle'); tone(1046.5, 0.16, 0.18, 'triangle'); tone(1318.5, 0.26, 0.26, 'triangle'); }
            else if (name === 'bad') { tone(220, 0, 0.18, 'sine', 0.06); tone(174.6, 0.12, 0.24, 'sine', 0.05); }
            else if (name === 'tick') { tone(880, 0, 0.05, 'square', 0.025); }
            else if (name === 'levelup') { [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(function (f, i) { tone(f, i * 0.09, 0.2, 'triangle'); }); }
            else if (name === 'pop') { tone(740, 0, 0.06, 'sine', 0.05); }
        } catch (e) { /* audio must never break a game */ }
    }
    function vibrate(p) { try { if (win && win.navigator && win.navigator.vibrate && !reduced()) win.navigator.vibrate(p); } catch (e) { /* ignore */ } }

    // ---- css (injected once) ----
    var CSS = [
        '.jx-pop{animation:jxPop .38s cubic-bezier(.2,1.6,.4,1)}',
        '@keyframes jxPop{0%{transform:scale(1)}45%{transform:scale(1.14)}100%{transform:scale(1)}}',
        '.jx-shake{animation:jxShake .42s ease}',
        '@keyframes jxShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-9px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(4px)}}',
        '.jx-ok{box-shadow:0 0 0 4px rgba(34,197,94,.55),0 0 26px rgba(34,197,94,.55)!important}',
        '.jx-bad{box-shadow:0 0 0 4px rgba(239,68,68,.45)!important}',
        '.jx-piece{position:fixed;z-index:9999;width:9px;height:14px;border-radius:2px;pointer-events:none;will-change:transform,opacity}',
        '.jx-float{position:fixed;z-index:9999;pointer-events:none;font:800 1.25rem/1.1 system-ui,sans-serif;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.55);padding:6px 14px;border-radius:999px;background:linear-gradient(135deg,#22c55e,#16a34a);animation:jxFloat 1.2s ease-out forwards;white-space:nowrap}',
        '.jx-float.warn{background:linear-gradient(135deg,#f59e0b,#ea580c)}',
        '@keyframes jxFloat{0%{opacity:0;transform:translate(-50%,10px) scale(.8)}15%{opacity:1;transform:translate(-50%,0) scale(1.08)}100%{opacity:0;transform:translate(-50%,-64px) scale(1)}}',
        '.jx-sound{min-width:44px;min-height:44px;border-radius:12px;border:1px solid rgba(148,163,184,.5);background:rgba(15,23,42,.75);color:#fff;font-size:1.2rem;cursor:pointer}',
        '@media (prefers-reduced-motion:reduce){.jx-pop,.jx-shake,.jx-float{animation:none!important}.jx-piece{display:none}}'
    ].join('\n');
    function ensureCss() {
        if (!doc || doc.getElementById('jx-css')) return;
        var s = doc.createElement('style'); s.id = 'jx-css'; s.textContent = CSS; (doc.head || doc.documentElement).appendChild(s);
    }

    function center(el) {
        try { var r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; } catch (e) { return { x: 200, y: 200 }; }
    }
    function restart(el, cls, ms) {
        if (!el || !el.classList) return;
        el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
        win.setTimeout(function () { el.classList.remove(cls); }, ms);
    }

    // ---- confetti ----
    var COLORS = ['#22c55e', '#facc15', '#38bdf8', '#f472b6', '#a78bfa', '#fb923c'];
    function burst(x, y, count) {
        if (!doc || reduced()) return;
        ensureCss();
        var n = Math.min(count || 26, 40);
        for (var i = 0; i < n; i++) {
            var p = doc.createElement('i'); p.className = 'jx-piece';
            p.style.left = x + 'px'; p.style.top = y + 'px'; p.style.background = COLORS[i % COLORS.length];
            doc.body.appendChild(p);
            var ang = Math.random() * Math.PI * 2, v = 120 + Math.random() * 220, dx = Math.cos(ang) * v, dy = Math.sin(ang) * v - 120;
            var rot = (Math.random() * 720 - 360) + 'deg';
            if (p.animate) {
                var a = p.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: 'translate(' + dx + 'px,' + (dy + 260) + 'px) rotate(' + rot + ')', opacity: 0 }], { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.4,1)' });
                a.onfinish = (function (el) { return function () { if (el.parentNode) el.parentNode.removeChild(el); }; })(p);
            } else if (p.parentNode) p.parentNode.removeChild(p);
        }
    }
    function floatText(x, y, text, warn) {
        if (!doc) return;
        ensureCss();
        var f = doc.createElement('div'); f.className = 'jx-float' + (warn ? ' warn' : ''); f.textContent = text;
        f.style.left = Math.max(80, Math.min((win.innerWidth || 400) - 80, x)) + 'px'; f.style.top = Math.max(60, y - 30) + 'px';
        doc.body.appendChild(f); win.setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 1300);
    }

    function correct(el, opts) {
        if (!win) return;
        opts = opts || {};
        var streak = opts.streak || 0, c = el ? center(el) : { x: (win.innerWidth || 400) / 2, y: (win.innerHeight || 600) / 2 };
        ensureCss();
        if (el) { restart(el, 'jx-pop', 420); el.classList.add('jx-ok'); win.setTimeout(function () { el.classList.remove('jx-ok'); }, 900); }
        sfx(streak >= 3 ? 'combo' : 'ok'); vibrate(streak >= 5 ? [20, 40, 20] : 18);
        burst(c.x, c.y, streak >= 5 ? 40 : 22);
        if (!opts.silent) floatText(c.x, c.y, praise(streak));
    }
    function wrong(el, opts) {
        if (!win) return;
        opts = opts || {};
        ensureCss();
        if (el) { restart(el, 'jx-shake', 460); el.classList.add('jx-bad'); win.setTimeout(function () { el.classList.remove('jx-bad'); }, 900); }
        sfx('bad'); vibrate([35, 40, 35]);
        if (!opts.silent) { var c = el ? center(el) : { x: (win.innerWidth || 400) / 2, y: (win.innerHeight || 600) / 3 }; floatText(c.x, c.y, tryAgain(), true); }
    }
    function levelUp(el) { if (!win) return; var c = el ? center(el) : { x: (win.innerWidth || 400) / 2, y: (win.innerHeight || 600) / 2 }; sfx('levelup'); vibrate([30, 50, 30, 50, 60]); burst(c.x, c.y, 40); }
    function tick() { sfx('tick'); }
    function mountSoundToggle(parent) {
        if (!doc || !parent) return null;
        ensureCss();
        var b = doc.createElement('button'); b.type = 'button'; b.className = 'jx-sound';
        function paint() { b.textContent = muted() ? '🔇' : '🔊'; b.setAttribute('aria-label', muted() ? 'Sonido desactivado' : 'Sonido activado'); b.setAttribute('aria-pressed', String(!muted())); }
        b.onclick = function () { setMuted(!muted()); paint(); if (!muted()) sfx('pop'); };
        paint(); parent.appendChild(b); return b;
    }

    if (doc) { if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', ensureCss); else ensureCss(); }

    return { correct: correct, wrong: wrong, levelUp: levelUp, tick: tick, burst: burst, floatText: floatText, sfx: sfx, vibrate: vibrate, praise: praise, tryAgain: tryAgain, mountSoundToggle: mountSoundToggle, muted: muted, setMuted: setMuted, reduced: reduced, LANGS: LANGS, PRAISE: PRAISE, COMBO: COMBO, TRY: TRY };
});
