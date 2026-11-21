/**
 * Games Hub - privacy-first usage analytics.
 * Writes anonymous events to Firestore `analytics_events`: no cookie, no id, no IP.
 * Payload: { ts, type: 'visit'|'play', game, lang, auth, first }.
 * "first" is true once per device per day (a localStorage flag that never leaves the device).
 * Respects Do Not Track. Never throws: analytics must not break a page.
 */
(function (root) {
    var LANGS = ['es', 'en', 'eu', 'gl', 'ca', 'fr'];

    function gameFromPath(path) {
        var m = String(path || '').match(/\/([A-Za-z0-9]+)-(?:EFC|EHS|CSM)\//);
        return m ? m[1] : 'hub';
    }

    function buildEvent(o) {
        var lang = String(o.lang || 'es').slice(0, 2).toLowerCase();
        if (LANGS.indexOf(lang) < 0) lang = 'es';
        var game = String(o.game || 'hub').replace(/[^A-Za-z0-9]/g, '').slice(0, 24) || 'hub';
        return { type: game === 'hub' ? 'visit' : 'play', game: game, lang: lang, auth: !!o.auth, first: !!o.first };
    }

    function dayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

    function track() {
        try {
            if (navigator.doNotTrack === '1' || !root.GamesHubDB || typeof firebase === 'undefined') return;
            var game = gameFromPath(location.pathname);
            var sKey = 'gh_an_s_' + game;
            if (sessionStorage.getItem(sKey)) return;          // once per tab session and game
            sessionStorage.setItem(sKey, '1');
            var first = localStorage.getItem('gh_an_day') !== dayKey();
            localStorage.setItem('gh_an_day', dayKey());
            var lang = (root.PlatformI18n && PlatformI18n.currentLanguage) || 'es';
            var send = function (user) {
                var ev = buildEvent({ game: game, lang: lang, auth: !!user, first: first });
                ev.ts = firebase.firestore.FieldValue.serverTimestamp();
                GamesHubDB.collection('analytics_events').add(ev).catch(function () {});
            };
            var done = false, off = null;
            var once = function (u) { if (done) return; done = true; if (off) off(); send(u); };
            if (root.GamesHubAuth) off = GamesHubAuth.onAuthStateChanged(once);
            setTimeout(function () { once(null); }, 3000);
        } catch (e) { /* never break the page */ }
    }

    var api = { buildEvent: buildEvent, gameFromPath: gameFromPath, track: track };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.PlatformAnalytics = api;
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', track); else track();
    }
})(typeof window !== 'undefined' ? window : globalThis);
