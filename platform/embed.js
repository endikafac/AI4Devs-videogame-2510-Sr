/**
 * Games Hub - embed loader.
 * Adds the common top bar (user, profile, language, theme) to pages that are not built
 * on the platform scripts (periodic table, arkanoid).
 *
 * Usage, before </body>:
 *   <script src="../platform/embed.js" data-root="../" data-game="Arkanoid" data-icon="🧱"></script>
 */
(function () {
    var me = document.currentScript;
    if (!me) return;
    var root = me.getAttribute('data-root') || '../';
    var game = me.getAttribute('data-game') || '';
    var icon = me.getAttribute('data-icon') || '';
    var P = root + 'platform/';

    var css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = P + 'platform.css';
    document.head.appendChild(css);

    var list = [
        'https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js',
        'https://www.gstatic.com/firebasejs/11.9.1/firebase-auth-compat.js',
        'https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore-compat.js',
        P + 'firebase-config.js', P + 'i18n-platform.js', P + 'auth.js', P + 'firestore.js',
        P + 'identity.js', P + 'platform-header.js', P + 'analytics.js'
    ];

    function next(i) {
        if (i >= list.length) return ready();
        var s = document.createElement('script');
        s.src = list[i]; s.onload = function () { next(i + 1); };
        s.onerror = function () { next(i + 1); };
        document.body.appendChild(s);
    }

    function ready() {
        if (typeof PlatformHeader === 'undefined') return;
        PlatformHeader.init({ gameName: game, gameIcon: icon, rootPath: root });
        var h = document.getElementById('platform-header');
        if (h) document.body.style.paddingTop = h.offsetHeight + 'px';

        // Periodic table lives in /es/ and /eu/ folders: follow the platform language.
        document.addEventListener('platformLanguageChanged', function (e) {
            var l = (e.detail && e.detail.language) || '';
            var m = location.pathname.match(/^(.*\/tablaPeriodica-EFC\/)(es|eu)\/(.*)$/);
            if (!m) return;
            var want = l.indexOf('eu') === 0 ? 'eu' : 'es';
            if (want !== m[2]) location.href = m[1] + want + '/' + m[3] + location.search;
        });
    }

    if (document.body) next(0); else document.addEventListener('DOMContentLoaded', function () { next(0); });
})();
