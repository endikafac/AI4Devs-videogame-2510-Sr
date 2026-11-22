/**
 * Games Hub - PWA helper.
 * - makes sure every page declares the manifest, theme colour and iOS meta tags
 * - registers the service worker (idempotent)
 * - adds an "Install app" row to the settings panel (Android/desktop prompt, iOS hint)
 */
(function () {
    'use strict';
    if (window.PlatformPWA) return;

    var T = {
        'es': ['Instalar la app', 'Instalar', 'En iPhone: pulsa Compartir y luego "Añadir a pantalla de inicio".'],
        'en': ['Install the app', 'Install', 'On iPhone: tap Share, then "Add to Home Screen".'],
        'eu': ['Aplikazioa instalatu', 'Instalatu', 'iPhonen: sakatu Partekatu eta gero "Gehitu hasierako pantailara".'],
        'gl': ['Instalar a app', 'Instalar', 'No iPhone: preme Compartir e logo "Engadir á pantalla de inicio".'],
        'ca': ["Instal·la l'app", 'Instal·la', 'A l\'iPhone: toca Compartir i després "Afegeix a la pantalla d\'inici".'],
        'fr': ["Installer l'appli", 'Installer', 'Sur iPhone : touchez Partager puis « Sur l\'écran d\'accueil ».']
    };
    function lang() {
        var l = 'es';
        try { l = (localStorage.getItem('games_hub_language') || document.documentElement.lang || 'es').slice(0, 2); } catch (e) {}
        return T[l] ? l : 'es';
    }

    function ensureHead() {
        var h = document.head;
        function add(tag, attrs) {
            var sel = tag + Object.keys(attrs).filter(function (k) { return k === 'rel' || k === 'name'; })
                .map(function (k) { return '[' + k + '="' + attrs[k] + '"]'; }).join('');
            if (h.querySelector(sel)) return;
            var el = document.createElement(tag);
            Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
            h.appendChild(el);
        }
        add('link', { rel: 'manifest', href: '/manifest.json' });
        add('meta', { name: 'theme-color', content: '#6366f1' });
        add('meta', { name: 'mobile-web-app-capable', content: 'yes' });
        add('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
        add('meta', { name: 'apple-mobile-web-app-title', content: 'Games Hub' });
        add('link', { rel: 'apple-touch-icon', href: '/icons/icon-192.png' });
    }

    function registerSW() {
        if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
        var go = function () { navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function () {}); };
        if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
    }

    var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    var deferred = null;

    function row() {
        if (standalone) return;
        var panel = document.getElementById('platform-settings-panel');
        if (!panel || document.getElementById('platform-install-row')) return;
        if (!deferred && !ios) return;
        var s = T[lang()];
        var r = document.createElement('div');
        r.className = 'platform-settings-row';
        r.id = 'platform-install-row';
        if (deferred) {
            r.innerHTML = '<span>' + s[0] + '</span><button class="platform-install-btn" id="platform-install-btn" type="button">' + s[1] + '</button>';
        } else {
            r.innerHTML = '<span style="font-size:.85rem;line-height:1.35">' + s[2] + '</span>';
        }
        panel.appendChild(r);
        var b = r.querySelector('button');
        if (b) b.addEventListener('click', function () {
            if (!deferred) return;
            deferred.prompt();
            deferred.userChoice.then(function () { deferred = null; r.remove(); }).catch(function () {});
        });
    }

    window.addEventListener('beforeinstallprompt', function (e) {
        e.preventDefault();
        deferred = e;
        row();
        var n = 0, t = setInterval(function () { row(); if (document.getElementById('platform-install-row') || ++n > 20) clearInterval(t); }, 500);
    });
    window.addEventListener('appinstalled', function () {
        deferred = null;
        var r = document.getElementById('platform-install-row'); if (r) r.remove();
        try { window.dispatchEvent(new CustomEvent('gameshub:installed')); } catch (e) {}
    });

    ensureHead();
    registerSW();
    var tries = 0, timer = setInterval(function () { row(); if (document.getElementById('platform-install-row') || ++tries > 20) clearInterval(timer); }, 500);

    window.PlatformPWA = { canInstall: function () { return !!deferred; }, isStandalone: function () { return standalone; }, isIOS: function () { return ios; } };
})();
