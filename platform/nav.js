/**
 * platform/nav.js
 * Navigation feel for the whole hub (small, no dependencies, load it first in <head>):
 *  1. Splash with the app icon while a page loads, so nobody taps a half-built screen.
 *  2. The same splash the instant a link is tapped, and every further tap is ignored
 *     (no double navigation, no double submits).
 *  3. Prefetch of a page on hover or touch start, so the next screen opens almost at once.
 * Honours prefers-reduced-motion. Never blocks for more than a few seconds.
 */
(function () {
    'use strict';
    var doc = document, win = window;
    if (win.__ghNav) return; win.__ghNav = true;

    var LABEL = { es: 'Cargando', en: 'Loading', eu: 'Kargatzen', gl: 'Cargando', ca: 'Carregant', fr: 'Chargement' };
    function lang() {
        var l = '';
        try { l = localStorage.getItem('games_hub_language') || doc.documentElement.lang || navigator.language || 'es'; } catch (e) { l = 'es'; }
        l = String(l).slice(0, 2).toLowerCase();
        return LABEL[l] ? l : 'es';
    }

    var css = '#gh-nav{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;' +
        'background:radial-gradient(circle at 50% 40%,#1e293b,#0b1220);color:#e2e8f0;font:600 15px system-ui,-apple-system,Segoe UI,Roboto,sans-serif;' +
        'opacity:1;transition:opacity .18s ease;touch-action:none;-webkit-user-select:none;user-select:none}' +
        '#gh-nav[hidden]{display:none}' +
        '#gh-nav.gh-soft{background:rgba(11,18,32,.72);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}' +
        '#gh-nav.gh-out{opacity:0;pointer-events:none}' +
        '#gh-nav .gh-ic{position:relative;width:96px;height:96px;display:flex;align-items:center;justify-content:center}' +
        '#gh-nav img{width:72px;height:72px;border-radius:18px;box-shadow:0 6px 24px rgba(0,0,0,.45);animation:gh-bob 1.1s ease-in-out infinite}' +
        '#gh-nav .gh-ring{position:absolute;inset:0;border-radius:50%;border:4px solid rgba(255,255,255,.14);border-top-color:#38bdf8;animation:gh-spin .9s linear infinite}' +
        '@keyframes gh-spin{to{transform:rotate(360deg)}}@keyframes gh-bob{50%{transform:scale(.93)}}' +
        '@media (prefers-reduced-motion:reduce){#gh-nav img,#gh-nav .gh-ring{animation:none}}';

    var el = null, shown = false, busy = false, hideT = 0;

    function build() {
        if (el) return el;
        var st = doc.createElement('style'); st.id = 'gh-nav-css'; st.textContent = css;
        (doc.head || doc.documentElement).appendChild(st);
        el = doc.createElement('div'); el.id = 'gh-nav'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
        var ic = doc.createElement('div'); ic.className = 'gh-ic';
        var ring = doc.createElement('div'); ring.className = 'gh-ring';
        var img = doc.createElement('img'); img.src = '/icons/icon-192.png'; img.alt = ''; img.width = 72; img.height = 72; img.decoding = 'async';
        ic.appendChild(ring); ic.appendChild(img);
        var tx = doc.createElement('div'); tx.className = 'gh-tx'; tx.textContent = LABEL[lang()] + '...';
        el.appendChild(ic); el.appendChild(tx);
        el.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); }, true);
        el.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
        (doc.body || doc.documentElement).appendChild(el);
        return el;
    }
    function show(soft, maxMs) {
        build(); clearTimeout(hideT);
        el.classList.toggle('gh-soft', !!soft); el.classList.remove('gh-out'); el.hidden = false; shown = true;
        hideT = setTimeout(hide, maxMs || 9000); // safety net: never trap the user
    }
    function hide() {
        clearTimeout(hideT); busy = false; shown = false;
        if (!el) return;
        el.classList.add('gh-out');
        setTimeout(function () { if (el && !shown) el.hidden = true; }, 220);
    }

    // 1. Splash while this page loads. Created as early as the DOM allows.
    show(false, 6000);
    function ready() { win.requestAnimationFrame(function () { setTimeout(hide, 60); }); }
    if (doc.readyState === 'complete') ready(); else win.addEventListener('load', ready, { once: true });
    // Back/forward cache restores a page that was hiding behind the splash
    win.addEventListener('pageshow', function (e) { if (e.persisted) hide(); });

    // 2. Navigation by link: show the splash at once and swallow further taps.
    function navTarget(a) {
        if (!a || !a.href || a.hasAttribute('download')) return null;
        var t = a.getAttribute('target'); if (t && t !== '_self') return null;
        var h = a.getAttribute('href') || ''; if (!h || h.charAt(0) === '#' || /^(javascript|mailto|tel):/i.test(h)) return null;
        var u; try { u = new URL(a.href, location.href); } catch (e) { return null; }
        if (u.origin !== location.origin) return null;
        if (u.pathname === location.pathname && u.search === location.search && u.hash) return null;
        return u;
    }
    doc.addEventListener('click', function (e) {
        if (e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var a = e.target && e.target.closest ? e.target.closest('a') : null;
        var u = navTarget(a); if (!u) return;
        if (busy) { e.preventDefault(); return; }
        busy = true; show(true, 9000);
    }, false);

    // 3. Prefetch on intent (hover or touch start), once per URL, only same origin pages.
    var done = Object.create(null), conn = navigator.connection || {};
    function prefetch(e) {
        if (conn.saveData) return;
        var a = e.target && e.target.closest ? e.target.closest('a') : null, u = navTarget(a);
        if (!u || u.pathname === location.pathname || done[u.href]) return;
        done[u.href] = 1;
        var l = doc.createElement('link'); l.rel = 'prefetch'; l.href = u.href; l.as = 'document';
        doc.head.appendChild(l);
    }
    doc.addEventListener('touchstart', prefetch, { passive: true, capture: true });
    doc.addEventListener('mouseover', prefetch, { passive: true, capture: true });

    win.GHNav = { show: show, hide: hide };
})();
