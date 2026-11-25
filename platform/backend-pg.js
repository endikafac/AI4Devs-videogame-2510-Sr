/**
 * Games Hub - Open source backend adapter (Neon Postgres + Neon Auth + Data API)
 *
 * Plain browser JS, no build step, no bundler, no SDK: fetch against
 *   - the Neon Auth REST endpoints (Better Auth), for sign in and the JWT;
 *   - the Neon Data API (PostgREST), for data, always as the signed in user so
 *     Row Level Security (db/gameshub/permissions) decides what is visible.
 * It follows PolyGo's approach (docs/13-migracion-neon.md there): the JWT comes
 * from Better Auth, the Data API validates it and runs the query as the
 * `authenticated` role.
 *
 * It does NOT replace PlatformAuth / PlatformFirestore: it overrides their I/O
 * methods IN PLACE when GamesHubBackend.backend is 'neon', so every game and
 * platform file keeps calling the same API. With 'firebase' (default) nothing
 * here runs: the two dispatch lines at the end of auth.js and firestore.js
 * check isActive() and do nothing.
 *
 * Phase 1 covers everything games and platform files use from PlatformAuth and
 * PlatformFirestore. identity.js, analytics.js, admin-stats.html and
 * progress-panel.js still talk to Firestore directly (GamesHubDB); the helpers
 * they will need are already here (see PlatformFirestore._neon in the doc).
 */
(function (root, factory) {
    'use strict';
    var api = factory(root);
    root.PlatformBackendPg = api;
    if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : this), function (root) {
    'use strict';

    var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    var PID = /^[a-z0-9]{6,20}$/;

    // ── Configuration ───────────────────────────────────────────────────────

    function configOf(r) { return (r || root).GamesHubBackend || null; }

    /** Pure: is the neon backend selected AND configured? A missing URL falls back to Firebase. */
    function isActive(r) {
        var cfg = configOf(r);
        if (!cfg || cfg.backend !== 'neon') return false;
        var n = cfg.neon || {};
        if (!n.authBaseUrl || !n.dataApiUrl) {
            try { console.error('[Backend] backend is "neon" but authBaseUrl or dataApiUrl is empty: keeping Firebase.'); } catch (e) { /* no console */ }
            return false;
        }
        return true;
    }

    // ── Small pure helpers (tested without network) ─────────────────────────

    function trimSlash(u) { return String(u || '').replace(/\/+$/, ''); }
    function iso(v) { return v ? new Date(v).toISOString() : null; }
    function date(v) { return v ? new Date(v) : null; }
    function num(v) { return v == null ? v : Number(v); }

    /** Pure: payload of a JWT (no signature check, the Data API does that). null when malformed. */
    function decodeJwt(token) {
        try {
            var part = String(token).split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            while (part.length % 4) part += '=';
            return JSON.parse(decodeURIComponent(escape(atob(part))));
        } catch (e) { return null; }
    }

    /** Pure: query string with already formed PostgREST filters ({id: 'eq.x'}). Values are percent encoded. */
    function qs(query) {
        var parts = [];
        Object.keys(query || {}).forEach(function (k) {
            if (query[k] !== undefined && query[k] !== null) parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(query[k]));
        });
        return parts.length ? '?' + parts.join('&') : '';
    }
    function eq(v) { return 'eq.' + v; }

    /** Pure: Infinity does not survive JSON (it becomes null): store null, read it back as Infinity. */
    function jsonSafe(x) {
        if (typeof x === 'number') return Number.isFinite(x) ? x : null;
        if (Array.isArray(x)) return x.map(jsonSafe);
        if (x && typeof x === 'object') { var o = {}; Object.keys(x).forEach(function (k) { o[k] = jsonSafe(x[k]); }); return o; }
        return x;
    }
    function restoreInfinity(stats) {
        var bl = stats && stats.byLevel;
        if (bl && typeof bl === 'object') Object.keys(bl).forEach(function (k) { if (bl[k] && bl[k].bestTime === null) bl[k].bestTime = Infinity; });
        return stats;
    }

    /** Pure: stats document (Firestore shape, with `daily` inside) from a table row. */
    function statsFromRow(row) {
        var s = Object.assign({}, row.stats || {});
        if (row.daily) s.daily = row.daily;
        return restoreInfinity(s);
    }
    /** Pure: table columns from a stats document. `daily` has its own column (62 day cap in SQL). */
    function statsToRow(stats) {
        var s = jsonSafe(Object.assign({}, stats));
        var daily = s.daily === undefined ? null : s.daily;
        delete s.daily;
        return { stats: s, daily: daily };
    }

    /** Pure: players row -> the document shape platform files read from Firestore. */
    function playerDoc(r) {
        var d = {
            username: r.username, avatar: r.avatar || null, photoURL: r.photo_url || null, nicknameKey: r.nickname_key || null,
            kind: r.kind, xp: num(r.xp), totalPoints: num(r.total_points), level: r.level, settings: r.settings || {},
            createdAt: r.created_at ? iso(r.created_at) : undefined
        };
        if (r.pin) d.pin = r.pin;
        if (r.interests && r.interests.length) d.interests = r.interests;
        return d;
    }
    /** Pure: adults row -> user document. */
    function adultDoc(r) {
        var d = {
            uid: r.id, username: r.username, avatar: r.avatar || null, photoURL: r.photo_url || null, nicknameKey: r.nickname_key || null,
            xp: num(r.xp), totalPoints: num(r.total_points), level: r.level, settings: r.settings || {},
            createdAt: iso(r.created_at), lastLogin: iso(r.last_login)
        };
        if (r.consent) d.consent = r.consent;
        return d;
    }
    function inviteDoc(r) {
        return { id: r.id, ownerUid: r.owner_id, ownerName: r.owner_name, email: r.email, role: r.role, createdAt: date(r.created_at), expires: date(r.expires) };
    }
    function guardianDoc(r) {
        return { id: r.guardian_id, uid: r.guardian_id, email: r.email, name: r.name, role: r.role, since: date(r.since), inviteId: r.invite_id };
    }
    function scoreDoc(r) {
        return { uid: r.owner_id, username: r.username, avatar: r.avatar || null, photoURL: null, totalPoints: num(r.total_points),
                 xp: num(r.xp), level: r.level, updatedAt: iso(r.updated_at) };
    }

    // ── The client: auth + Data API over fetch ──────────────────────────────

    /**
     * @param {Object} opts { config, fetch, location, history, storage, now }
     * Everything is injectable, so the unit tests need no network and no browser.
     */
    function create(opts) {
        var cfg = opts.config || configOf();
        var authBase = trimSlash(cfg.neon.authBaseUrl);
        var apiBase = trimSlash(cfg.neon.dataApiUrl);
        var schema = cfg.neon.schema || 'gameshub';
        var doFetch = opts.fetch || function () { return root.fetch.apply(root, arguments); };
        var loc = opts.location || root.location;
        var hist = opts.history || root.history;
        var now = opts.now || function () { return Date.now(); };
        // The session token some deployments return instead of a third party cookie
        // lives only in this tab (sessionStorage), never in localStorage.
        var store = opts.storage || (function () { try { return root.sessionStorage; } catch (e) { return null; } })();

        var c = { state: { user: null, raw: null, jwt: null, jwtExp: 0, bearer: null }, config: cfg };

        function readBearer() { try { return (store && store.getItem('games_hub_neon_bearer')) || null; } catch (e) { return null; } }
        function saveBearer(t) { c.state.bearer = t; try { if (store) { t ? store.setItem('games_hub_neon_bearer', t) : store.removeItem('games_hub_neon_bearer'); } } catch (e) { /* ignore */ } }
        c.state.bearer = readBearer();

        function httpError(res, body, where) {
            var info = {};
            try { info = body ? JSON.parse(body) : {}; } catch (e) { info = { message: body }; }
            var msg = info.message || ('HTTP ' + res.status);
            var err = new Error(/taken/i.test(msg) || info.code === '23505' ? 'taken' : msg);
            err.status = res.status;
            err.pgCode = info.code || '';
            err.where = where;
            err.code = res.status === 401 || res.status === 403 || info.code === '42501' ? 'permission-denied'
                : (res.status === 409 || info.code === '23505' ? 'already-exists' : 'unavailable');
            return err;
        }

        // ── Neon Auth (Better Auth REST) ────────────────────────────────────
        async function authFetch(method, path, body) {
            var headers = { Accept: 'application/json' };
            if (body !== undefined) headers['Content-Type'] = 'application/json';
            if (c.state.bearer) headers.Authorization = 'Bearer ' + c.state.bearer;
            var res = await doFetch(authBase + path, {
                method: method, headers: headers, credentials: 'include',
                body: body !== undefined ? JSON.stringify(body) : undefined
            });
            return res;
        }
        function header(res, name) { try { return res.headers && res.headers.get(name); } catch (e) { return null; } }

        /** Current Better Auth session -> { user } or null. Also keeps the JWT when the response carries it. */
        c.refreshSession = async function () {
            var verifier = null;
            try { verifier = new URL(loc.href).searchParams.get('neon_auth_session_verifier'); } catch (e) { /* no url */ }
            var path = '/get-session' + (verifier ? qs({ neon_auth_session_verifier: verifier }) : '');
            var res;
            try { res = await authFetch('GET', path); } catch (e) { return null; }
            if (verifier) {
                try { var u = new URL(loc.href); u.searchParams.delete('neon_auth_session_verifier'); hist.replaceState(null, '', u.pathname + u.search + u.hash); } catch (e) { /* ignore */ }
            }
            if (!res.ok) return null;
            var token = header(res, 'set-auth-token');
            if (token) saveBearer(token);
            var jwt = header(res, 'set-auth-jwt');
            var data = null;
            try { data = await res.json(); } catch (e) { data = null; }
            if (!data || !data.user) { c.state.user = null; c.state.raw = null; return null; }
            if (jwt) c.setJwt(jwt);
            c.state.raw = { uid: data.user.id, email: String(data.user.email || ''), emailVerified: data.user.emailVerified === true };
            c.state.user = data.user;
            return data;
        };

        c.setJwt = function (jwt) {
            var p = decodeJwt(jwt);
            c.state.jwt = jwt;
            c.state.jwtExp = p && p.exp ? p.exp * 1000 : now() + 5 * 60 * 1000;
        };

        /**
         * The JWT the Data API validates. Better Auth's JWT plugin serves it at
         * /token and also returns it in the `set-auth-jwt` header of /get-session.
         * (It is NOT the OAuth token of Google, see PolyGo docs/13-migracion-neon.md.)
         */
        c.getJwt = async function () {
            if (c.state.jwt && c.state.jwtExp - 30000 > now()) return c.state.jwt;
            var res = await authFetch('GET', '/token');
            if (res.ok) {
                var j = null;
                try { j = await res.json(); } catch (e) { j = null; }
                var t = (j && (j.token || j.jwt)) || header(res, 'set-auth-jwt');
                if (t) { c.setJwt(t); return t; }
            }
            var s = await c.refreshSession();     // fallback: the header of /get-session
            if (s && c.state.jwt) return c.state.jwt;
            var err = new Error('no-session');
            err.code = 'unauthenticated';
            throw err;
        };

        c.signInWithGoogle = async function () {
            var here = loc.origin + loc.pathname + (loc.search || '').replace(/([?&])neon_auth_session_verifier=[^&]*&?/, '$1').replace(/[?&]$/, '');
            var res = await authFetch('POST', '/sign-in/social', { provider: 'google', callbackURL: here, errorCallbackURL: here });
            var data = null;
            try { data = await res.json(); } catch (e) { data = null; }
            if (!res.ok || !data || !data.url) throw httpError(res, data ? JSON.stringify(data) : '', 'sign-in');
            loc.assign(data.url);                 // the redirect flow; returns when the browser navigates
            return null;
        };

        c.signOut = async function () {
            try { await authFetch('POST', '/sign-out', {}); } catch (e) { /* offline: local sign out anyway */ }
            c.state.user = null; c.state.raw = null; c.state.jwt = null; c.state.jwtExp = 0; saveBearer(null);
        };

        /** GDPR: delete the Better Auth account. Needs deleteUser enabled in Neon Auth; otherwise the owner deletes it in the console. */
        c.deleteAuthAccount = async function () {
            var res = await authFetch('POST', '/delete-user', {});
            if (!res.ok) throw httpError(res, '', 'delete-user');
        };

        // ── Neon Data API (PostgREST) ───────────────────────────────────────
        /**
         * @param {string} method GET | POST | PATCH | DELETE
         * @param {string} path   table or rpc/<fn>
         * @param {Object} o      { query, body, prefer }
         */
        c.api = async function (method, path, o) {
            o = o || {};
            var jwt = await c.getJwt();
            var headers = { Authorization: 'Bearer ' + jwt, Accept: 'application/json' };
            headers[method === 'GET' ? 'Accept-Profile' : 'Content-Profile'] = schema;
            if (o.body !== undefined) headers['Content-Type'] = 'application/json';
            if (o.prefer) headers.Prefer = o.prefer;
            var res = await doFetch(apiBase + '/' + path + qs(o.query), {
                method: method, headers: headers, body: o.body !== undefined ? JSON.stringify(o.body) : undefined
            });
            var text = await res.text();
            if (!res.ok) throw httpError(res, text, path);
            if (!text) return null;
            try { return JSON.parse(text); } catch (e) { return null; }
        };
        c.get = function (table, query) { return c.api('GET', table, { query: query }); };
        c.rpc = function (fn, args) { return c.api('POST', 'rpc/' + fn, { body: args || {} }); };
        c.insert = function (table, body, query) { return c.api('POST', table, { body: body, query: query, prefer: 'return=representation' }); };
        c.upsert = function (table, body, conflict) {
            return c.api('POST', table, { body: body, query: { on_conflict: conflict }, prefer: 'resolution=merge-duplicates,return=representation' });
        };
        c.remove = function (table, query) { return c.api('DELETE', table, { query: query, prefer: 'return=representation' }); };
        /** PATCH that must touch a row. RLS filters silently, so an empty answer is a permission error. */
        c.patch = async function (table, query, body) {
            var rows = await c.api('PATCH', table, { query: query, body: body, prefer: 'return=representation' });
            if (!rows || !rows.length) { var e = new Error('permission-denied'); e.code = 'permission-denied'; throw e; }
            return rows;
        };

        // Helpers that identity.js, analytics.js, admin-stats.html and progress-panel.js will use in phase 2.
        c.claimIdentity = function (username, key, avatar, consent, previousKey) {
            return c.rpc('claim_identity', { p_username: username, p_key: key, p_avatar: avatar, p_consent: consent, p_previous_key: previousKey || null });
        };
        c.createPlayerRow = function (pid, username, key, avatar) {
            return c.rpc('create_player', { p_pid: pid, p_username: username, p_key: key, p_avatar: avatar });
        };
        c.deletePlayerRow = function (owner, pid) { return c.remove('players', { owner_id: eq(owner), pid: eq(pid) }); };
        c.nicknameAvailable = function (key) { return c.rpc('nickname_available', { p_key: key }); };
        c.listPlayerGames = async function (owner, pid) {
            var rows = await c.get('player_game_stats', { owner_id: eq(owner), pid: eq(pid), select: '*' });
            var out = {};
            (rows || []).forEach(function (r) { out[r.game] = statsFromRow(r); });
            return out;
        };
        c.deleteMyData = function () { return c.rpc('delete_my_data'); };
        /** Anonymous analytics event (no ids, the server sets the time). Never throws. */
        c.trackEvent = function (ev) {
            return c.insert('analytics_events', { type: ev.type, game: ev.game, lang: ev.lang, auth: !!ev.auth, first: !!ev.first }).catch(function () {});
        };
        c.listAnalyticsEvents = function (sinceIso, limit) {
            return c.get('analytics_events', { ts: 'gte.' + sinceIso, order: 'ts.desc', limit: String(limit || 5000), select: '*' });
        };
        /** GDPR access/portability: everything of the adult in one object. */
        c.exportData = async function (uid) {
            var out = { exportedAt: new Date(now()).toISOString(), uid: uid };
            var a = await c.get('adults', { id: eq(uid), select: '*' });
            out.profile = a && a[0] ? adultDoc(a[0]) : null;
            out.games = {};
            ((await c.get('adult_game_stats', { owner_id: eq(uid), select: '*' })) || []).forEach(function (r) { out.games[r.game] = statsFromRow(r); });
            out.players = [];
            var players = (await c.get('players', { owner_id: eq(uid), select: '*' })) || [];
            for (var i = 0; i < players.length; i++) {
                out.players.push({ id: players[i].pid, profile: playerDoc(players[i]), games: await c.listPlayerGames(uid, players[i].pid) });
            }
            return out;
        };

        return c;
    }

    // ── PlatformAuth overrides ──────────────────────────────────────────────

    function authMethods(c) {
        return {
            init: function () {
                var self = this;
                c.refreshSession().then(function (s) {
                    self._handleAuthChange(s && s.user ? s.user : null);
                }).catch(function () { self._handleAuthChange(null); });
            },
            signInWithGoogle: function () { return c.signInWithGoogle(); },
            signOut: async function () {
                await c.signOut();
                this.currentUser = null;
                this._notifyListeners(null);
            },
            // Better Auth user -> the same shape PlatformAuth._normalize gives for a Firebase user
            _normalize: function (u) {
                var created = u.createdAt ? new Date(u.createdAt).toISOString() : new Date(now()).toISOString();
                return {
                    odId: u.id, uid: u.id,
                    username: u.name || (u.email ? String(u.email).split('@')[0] : '') || 'Player',
                    email: u.email || '', photoURL: u.image || null,
                    createdAt: created, lastLogin: new Date(now()).toISOString(), emailVerified: u.emailVerified === true
                };
            }
        };
        function now() { return Date.now(); }
    }

    // ── PlatformFirestore overrides ─────────────────────────────────────────
    // Same public API, same return shapes. `this` is PlatformFirestore, so the pure
    // helpers (calculatePoints, _mergeStats, hashPin, _pid, _owner...) are the originals.

    function firestoreMethods(c) {
        function ready() { return !!(c.state.user && c.state.raw); }
        function table(self, uid) {
            var pid = self._pid(uid), owner = self._owner(uid);
            return pid ? { t: 'player_game_stats', pid: pid, owner: owner, key: { owner_id: eq(owner), pid: eq(pid) }, conflict: 'pid,game' }
                       : { t: 'adult_game_stats', pid: '', owner: owner, key: { owner_id: eq(owner) }, conflict: 'owner_id,game' };
        }
        async function readStatsRow(self, uid, gid) {
            var tb = table(self, uid);
            var q = Object.assign({ game: eq(gid), select: '*' }, tb.key);
            var rows = await c.get(tb.t, q);
            return { tb: tb, row: rows && rows[0] ? rows[0] : null };
        }
        function writeStatsRow(tb, gid, stats) {
            var cols = statsToRow(stats);
            var body = { owner_id: tb.owner, game: gid, stats: cols.stats, daily: cols.daily, updated_at: new Date().toISOString() };
            if (tb.pid) body.pid = tb.pid;
            return c.upsert(tb.t, body, tb.conflict);
        }
        async function profileRow(self, uid) {
            var pid = self._pid(uid), owner = self._owner(uid);
            var rows = pid ? await c.get('players', { pid: eq(pid), owner_id: eq(owner), select: '*' })
                           : await c.get('adults', { id: eq(owner), select: '*' });
            return rows && rows[0] ? (pid ? playerDoc(rows[0]) : adultDoc(rows[0])) : null;
        }

        return {
            _neon: c,
            _cloud: ready,
            _authUser: function () { return c.state.raw ? { uid: c.state.raw.uid, email: c.state.raw.email, emailVerified: c.state.raw.emailVerified } : null; },
            _needDB: function () { if (!ready()) throw new Error('offline'); },
            // Neon Auth ids are uuids (with dashes); the Firebase check only allowed letters and digits.
            resolveOwner: function (uid, storedOwner, pid, memberships) {
                if (!uid || !pid || !storedOwner || storedOwner === uid) return uid;
                if (!UUID.test(storedOwner)) return uid;
                var ok = Array.isArray(memberships) && memberships.some(function (m) { return m && m.ownerUid === storedOwner; });
                return ok ? storedOwner : uid;
            },

            listPlayers: async function (uid, ownerUid) {
                if (!ready()) return [];
                var rows = await c.get('players', { owner_id: eq(ownerUid || uid), select: '*', order: 'created_at.asc' });
                return (rows || []).map(function (r) { return Object.assign({ pid: r.pid }, playerDoc(r)); });
            },
            getActivePlayer: async function (uid) {
                var pid = this._pid(uid);
                if (!pid || !ready()) return null;
                if (this._storedOwner(uid)) await this._validateOwner(uid);
                var owner = this._owner(uid);
                var rows = await c.get('players', { pid: eq(pid), owner_id: eq(owner), select: '*' });
                if (!rows || !rows.length) { this.setActivePlayer(uid, ''); return null; }
                var out = Object.assign({ pid: pid }, playerDoc(rows[0]));
                if (owner !== uid) {
                    out.ownerUid = owner;
                    out.familyRole = (this._memCache(uid).find(function (m) { return m.ownerUid === owner; }) || {}).role;
                }
                return out;
            },

            _validateOwner: async function (uid) {
                var owner = this._storedOwner(uid);
                if (!owner || owner === uid) return;
                try {
                    var rows = await c.get('guardians', { owner_id: eq(owner), guardian_id: eq(uid), select: 'role' });
                    if (rows && rows.length) {
                        var old = this._memCache(uid).find(function (m) { return m.ownerUid === owner; });
                        var cache = this._memCache(uid).filter(function (m) { return m.ownerUid !== owner; });
                        cache.push({ ownerUid: owner, ownerName: old ? old.ownerName : '', role: rows[0].role });
                        this._setMemCache(uid, cache);
                    } else {
                        await this._dropMembership(uid, owner);
                    }
                } catch (e) {
                    this._setOwnerKey(uid, '');
                    try { localStorage.removeItem('games_hub_player_' + uid); } catch (e2) { /* ignore */ }
                }
            },
            // One row is both the guardian and the membership, so there is nothing to delete remotely.
            _dropMembership: async function (uid, owner) {
                this._setMemCache(uid, this._memCache(uid).filter(function (m) { return m.ownerUid !== owner; }));
                if (this._storedOwner(uid) === owner) {
                    this._setOwnerKey(uid, '');
                    try { localStorage.removeItem('games_hub_player_' + uid); } catch (e) { /* ignore */ }
                }
            },
            listMemberships: async function (uid) {
                if (!ready() || !uid) return [];
                var rows = await c.get('memberships', { select: '*' });
                var valid = (rows || []).filter(function (m) { return m && UUID.test(m.owner_id) && (m.role === 'edit' || m.role === 'view'); })
                    .map(function (m) { return { ownerUid: m.owner_id, ownerName: String(m.owner_name || ''), role: m.role }; });
                this._setMemCache(uid, valid);
                return valid;
            },
            setActiveFamily: async function (uid, ownerUid) {
                if (!ownerUid || ownerUid === uid) { this._setOwnerKey(uid, ''); return; }
                if (!UUID.test(ownerUid)) throw new Error('not-member');
                this._needDB();
                var mem = await this.listMemberships(uid);
                if (!mem.some(function (m) { return m.ownerUid === ownerUid; })) throw new Error('not-member');
                this._setOwnerKey(uid, ownerUid);
            },

            createInvite: async function (ownerUid, email, role, ownerName) {
                this._needDB();
                var mail = this.normEmail(email);
                if (!this.isValidEmail(mail) || !this.isRole(role) || !ownerUid) throw new Error('invalid');
                var me = this._authUser();
                if (me && me.email && this.normEmail(me.email) === mail) throw new Error('self');
                var lists = await Promise.all([this.listGuardians(ownerUid), this.listSentInvites(ownerUid)]);
                var self = this;
                if (lists[0].some(function (g) { return self.normEmail(g.email) === mail; })) throw new Error('duplicate');
                if (lists[0].length + lists[1].length >= this.MAX_GUARDIANS) throw new Error('max');
                var rows = await c.insert('invites', {
                    owner_id: ownerUid, owner_name: String(ownerName || '').slice(0, 40), email: mail, role: role,
                    expires: new Date(Date.now() + this.INVITE_DAYS * 86400000).toISOString()
                });
                return rows[0].id;
            },
            listSentInvites: async function (ownerUid) {
                if (!ready() || !ownerUid) return [];
                var self = this;
                var rows = await c.get('invites', { owner_id: eq(ownerUid), select: '*' });
                return (rows || []).map(inviteDoc).filter(function (i) { return self.isInviteActive(i); });
            },
            listMyInvites: async function () {
                var me = this._authUser();
                if (!ready() || !me || !me.email || !me.emailVerified) return [];
                var self = this;
                var rows = await c.get('invites', { email: eq(this.normEmail(me.email)), select: '*' });
                return (rows || []).map(inviteDoc).filter(function (i) { return i.ownerUid !== me.uid && self.isInviteActive(i); });
            },
            acceptInvite: async function (invite, myName) {
                this._needDB();
                var me = this._authUser();
                if (!me || !invite || !invite.id || !this.isInviteActive(invite) || invite.ownerUid === me.uid) throw new Error('invalid');
                // one transaction in Postgres: the guardian is created and the invitation consumed together
                await c.rpc('accept_invite', { p_invite: invite.id, p_name: String(myName || '').slice(0, 40) });
                this._setMemCache(me.uid, this._memCache(me.uid).filter(function (m) { return m.ownerUid !== invite.ownerUid; })
                    .concat([{ ownerUid: invite.ownerUid, ownerName: invite.ownerName || '', role: invite.role }]));
            },
            declineInvite: async function (id) {
                this._needDB();
                if (!id) throw new Error('invalid');
                await c.remove('invites', { id: eq(id) });
            },
            listGuardians: async function (ownerUid) {
                if (!ready() || !ownerUid) return [];
                var rows = await c.get('guardians', { owner_id: eq(ownerUid), select: '*' });
                return (rows || []).map(guardianDoc);
            },
            removeGuardian: async function (ownerUid, guardianUid) {
                this._needDB();
                if (!ownerUid || !guardianUid) throw new Error('invalid');
                await c.remove('guardians', { owner_id: eq(ownerUid), guardian_id: eq(guardianUid) });
            },
            leaveFamily: async function (ownerUid) {
                this._needDB();
                var me = this._authUser();
                if (!me || !ownerUid) throw new Error('invalid');
                await c.remove('guardians', { owner_id: eq(ownerUid), guardian_id: eq(me.uid) });
                this._setMemCache(me.uid, this._memCache(me.uid).filter(function (m) { return m.ownerUid !== ownerUid; }));
                if (this._storedOwner(me.uid) === ownerUid) this.setActivePlayer(me.uid, '');
            },

            setChildPin: async function (ownerUid, pid, pin) {
                this._needDB();
                if (!ownerUid || !PID.test(pid || '')) throw new Error('invalid');
                var rec = await this.hashPin(pin);
                await c.patch('players', { owner_id: eq(ownerUid), pid: eq(pid) }, { pin: rec });
            },
            clearChildPin: async function (ownerUid, pid) {
                this._needDB();
                if (!ownerUid || !PID.test(pid || '')) throw new Error('invalid');
                await c.patch('players', { owner_id: eq(ownerUid), pid: eq(pid) }, { pin: null });
            },
            setChildInterests: async function (ownerUid, pid, list) {
                this._needDB();
                if (!ownerUid || !PID.test(pid || '')) throw new Error('invalid');
                var clean = this.cleanInterests(list);
                await c.patch('players', { owner_id: eq(ownerUid), pid: eq(pid) }, { interests: clean.length ? clean : null });
                return clean;
            },

            getOrCreateProfile: async function (uid, authUser, opts) {
                if (!ready()) return this._localProfile(authUser);
                if (!(opts && opts.account)) {
                    var kid = await this.getActivePlayer(uid).catch(function () { return null; });
                    if (kid) return Object.assign({}, kid, { uid: uid });
                }
                var rows = await c.get('adults', { id: eq(uid), select: '*' });
                if (rows && rows.length) {
                    await c.patch('adults', { id: eq(uid) }, { last_login: new Date().toISOString() });
                    return adultDoc(rows[0]);
                }
                var profile = {
                    uid: uid, username: '', photoURL: null, createdAt: new Date().toISOString(), lastLogin: new Date().toISOString(),
                    xp: 0, totalPoints: 0, level: 0,
                    settings: { soundEnabled: true, sfxVolume: 0.8, ttsEnabled: false, highContrast: false, language: localStorage.getItem('games_hub_language') || 'es-ES' }
                };
                await c.insert('adults', { id: uid, username: '', created_at: profile.createdAt, last_login: profile.lastLogin, settings: profile.settings });
                return profile;
            },
            updateSettings: async function (uid, settings) {
                if (!ready()) { this._localSave('profile', Object.assign({}, this._localLoad('profile'), { settings: settings })); return; }
                await c.patch('adults', { id: eq(uid) }, { settings: settings });
            },

            getGameStats: async function (uid, gameId) {
                gameId = this._gid(gameId);
                if (!ready()) return this._localLoad('stats_' + gameId) || this._defaultStats();
                var r = await readStatsRow(this, uid, gameId);
                return r.row ? statsFromRow(r.row) : this._defaultStats();
            },
            updateGameStats: async function (uid, gameId, gameResult) {
                gameId = this._gid(gameId);
                var points = this.calculatePoints(gameResult);
                gameResult.points = points.points;
                gameResult.xp = points.xp;
                var stats;
                if (!ready()) {
                    stats = this._localLoad('stats_' + gameId) || this._defaultStats();
                    this._mergeStats(stats, gameResult);
                    this._localSave('stats_' + gameId, stats);
                    return { stats: stats, points: points };
                }
                var cur = await readStatsRow(this, uid, gameId);
                stats = cur.row ? statsFromRow(cur.row) : this._defaultStats();
                this._mergeStats(stats, gameResult);
                // Family role 'view': look but do not save (RLS would refuse anyway).
                if (this._viewOnly(uid)) return { stats: stats, points: points };
                await writeStatsRow(cur.tb, gameId, stats);
                // Atomic increment in SQL (the Firestore FieldValue.increment), then the level from the new xp.
                var prog = await c.rpc('bump_progress', { p_owner: cur.tb.owner, p_pid: cur.tb.pid, p_xp: points.xp, p_points: points.points, p_level: null });
                var level = this.levelFromXP(Number(prog.xp));
                if (level !== prog.level) {
                    if (cur.tb.pid) await c.patch('players', { owner_id: eq(cur.tb.owner), pid: eq(cur.tb.pid) }, { level: level });
                    else await c.patch('adults', { id: eq(cur.tb.owner) }, { level: level });
                }
                await this._updateLeaderboard(uid, gameId, points.points).catch(function () {});
                return { stats: stats, points: points };
            },

            getAchievements: async function (uid, gameId) {
                gameId = this._gid(gameId);
                if (!ready()) return this._localLoad('achievements_' + gameId) || { unlockedAchievements: [] };
                var r = await readStatsRow(this, uid, gameId);
                return { unlockedAchievements: (r.row && r.row.stats && r.row.stats.unlockedAchievements) || [] };
            },
            unlockAchievement: async function (uid, gameId, achievementId) {
                gameId = this._gid(gameId);
                if (!ready()) {
                    var data = this._localLoad('achievements_' + gameId) || { unlockedAchievements: [] };
                    if (!data.unlockedAchievements.includes(achievementId)) {
                        data.unlockedAchievements.push(achievementId);
                        this._localSave('achievements_' + gameId, data);
                    }
                    return true;
                }
                if (this._viewOnly(uid)) return true;
                var cur = await readStatsRow(this, uid, gameId);
                var stats = cur.row ? statsFromRow(cur.row) : {};
                var list = Array.isArray(stats.unlockedAchievements) ? stats.unlockedAchievements : [];
                if (list.indexOf(achievementId) === -1) {
                    stats.unlockedAchievements = list.concat([achievementId]);
                    await writeStatsRow(cur.tb, gameId, stats);
                }
                return true;
            },

            getLeaderboard: async function (gameId, limit) {
                gameId = this._gid(gameId);
                if (!ready()) return [];
                var rows = await c.get('leaderboard', { game: eq(gameId), order: 'total_points.desc', limit: String(limit || 10), select: '*' });
                return (rows || []).map(scoreDoc);
            },
            _updateLeaderboard: async function (uid, gameId) {
                var user = await profileRow(this, uid);
                if (!user) return;
                await c.upsert('leaderboard', {
                    game: gameId, owner_id: this._owner(uid), pid: this._pid(uid) || '',
                    username: String(user.username || '').slice(0, 40), avatar: user.avatar || null,
                    total_points: user.totalPoints, xp: user.xp, level: user.level, updated_at: new Date().toISOString()
                }, 'game,owner_id,pid');
            }
        };
    }

    // ── Installation (called by the dispatch lines of auth.js and firestore.js) ──

    var instance = null;
    function client() {
        if (!instance) instance = create({ config: configOf() });
        return instance;
    }
    function installAuth(PlatformAuth) { Object.assign(PlatformAuth, authMethods(client())); return PlatformAuth; }
    function installFirestore(PlatformFirestore) { Object.assign(PlatformFirestore, firestoreMethods(client())); return PlatformFirestore; }

    return {
        isActive: isActive, create: create, client: client, installAuth: installAuth, installFirestore: installFirestore,
        authMethods: authMethods, firestoreMethods: firestoreMethods,
        // pure helpers, exported for the unit tests
        _h: { decodeJwt: decodeJwt, qs: qs, eq: eq, jsonSafe: jsonSafe, statsFromRow: statsFromRow, statsToRow: statsToRow,
              playerDoc: playerDoc, adultDoc: adultDoc, inviteDoc: inviteDoc, guardianDoc: guardianDoc, scoreDoc: scoreDoc }
    };
});
