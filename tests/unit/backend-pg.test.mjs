// Unit tests of the open source backend adapter (platform/backend-pg.js) and of
// the dispatch lines in auth.js and firestore.js. fetch is mocked: no network.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '../..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const plain = x => JSON.parse(JSON.stringify(x));

const OWN = '11111111-1111-4111-8111-111111111111';
const ME = '22222222-2222-4222-8222-222222222222';
const AUTH = 'https://auth.example.test/neondb/auth';
const API = 'https://api.example.test/neondb/rest/v1';
const NEON = { backend: 'neon', neon: { authBaseUrl: AUTH, dataApiUrl: API, schema: 'gameshub' } };

const b64u = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (sub, exp = Math.floor(Date.now() / 1000) + 3600) => `${b64u({ alg: 'EdDSA' })}.${b64u({ sub, exp })}.sig`;

/** A mocked fetch: routes are [method, pathRegex, handler(url, init) -> {status, body, headers}]. Records every call. */
function mockFetch(routes) {
  const calls = [];
  const fn = async (url, init = {}) => {
    const u = new URL(url);
    const method = init.method || 'GET';
    const call = { method, url: u, headers: init.headers || {}, body: init.body ? JSON.parse(init.body) : undefined, credentials: init.credentials };
    calls.push(call);
    for (const [m, re, h] of routes) {
      if (m === method && re.test(u.pathname)) {
        const r = await h(call);
        const status = r.status || 200;
        const body = r.body === undefined ? '' : (typeof r.body === 'string' ? r.body : JSON.stringify(r.body));
        return { ok: status >= 200 && status < 300, status, headers: { get: k => (r.headers || {})[k.toLowerCase()] || null }, text: async () => body, json: async () => JSON.parse(body) };
      }
    }
    return { ok: false, status: 404, headers: { get: () => null }, text: async () => '{"message":"no route"}', json: async () => ({}) };
  };
  fn.calls = calls;
  fn.api = () => calls.filter(c => c.url.href.startsWith(API + '/'));
  return fn;
}

/** Loads config + adapter + auth.js + firestore.js in a fresh context, like a page does. */
function boot({ backend = null, files = ['platform/backend-pg.js', 'platform/auth.js', 'platform/firestore.js'], fetch, store = {}, loc } = {}) {
  const listeners = [];
  const navigations = [];
  const ctx = {
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: { addEventListener: (ev, fn) => listeners.push([ev, fn]) },
    PlatformI18n: { t: k => k },
    crypto: globalThis.crypto, TextEncoder, btoa, atob, URL, console: { log() {}, warn() {}, error() { ctx.__errors.push([...arguments].join(' ')); } },
    __errors: [], fetch,
    location: loc || { href: 'https://gameshub-efc.web.app/index.html', origin: 'https://gameshub-efc.web.app', pathname: '/index.html', search: '', hostname: 'gameshub-efc.web.app', assign: u => navigations.push(u) },
    history: { replaceState: (...a) => ctx.__replaced.push(a) }, __replaced: []
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  if (backend) ctx.GamesHubBackend = JSON.parse(JSON.stringify(backend));
  for (const f of files) vm.runInContext(read(f) + (f.endsWith('auth.js') ? ';this.PA = PlatformAuth;' : f.endsWith('firestore.js') ? ';this.PF = PlatformFirestore;' : ''), ctx, { filename: f });
  return { ctx, store, PA: ctx.PA, PF: ctx.PF, navigations, domReady: () => listeners.filter(l => l[0] === 'DOMContentLoaded').forEach(l => l[1]()) };
}

const sessionRoutes = (uid = ME, extra = {}) => [
  ['GET', /\/auth\/get-session$/, () => ({ body: { session: { id: 's' }, user: { id: uid, email: 'Ana@Example.com', emailVerified: true, name: 'Ana', image: null, createdAt: '2026-01-01T00:00:00Z' } }, headers: extra.headers })],
  ['GET', /\/auth\/token$/, () => ({ body: { token: jwt(uid) } })]
];
const tick = () => new Promise(r => setTimeout(r, 0));

/** Signed in, adapter active, ready for calls. */
async function signedIn(routes, o = {}) {
  const fetch = mockFetch([...sessionRoutes(o.uid || ME), ...routes]);
  const b = boot({ backend: NEON, fetch, store: o.store });
  b.domReady();
  await tick(); await tick();
  fetch.calls.length = 0;
  return { ...b, fetch };
}

// ── Dispatch: nothing changes unless the flag says neon ────────────────────

test('U-BE-DEFAULT: backend-config.js defaults to firebase, with an empty neon section', () => {
  const b = boot({ files: ['platform/backend-config.js'] });
  assert.equal(b.ctx.GamesHubBackend.backend, 'firebase');
  assert.equal(b.ctx.GamesHubBackend.neon.authBaseUrl, '');
  assert.equal(b.ctx.GamesHubBackend.neon.dataApiUrl, '');
  assert.equal(b.ctx.GamesHubBackend.neon.schema, 'gameshub');
});

test('U-BE-DEFAULT: the localStorage override only works on localhost', () => {
  const on = (hostname) => boot({ files: ['platform/backend-config.js'], store: { games_hub_backend: 'neon' }, loc: { hostname, href: 'http://' + hostname + '/' } }).ctx.GamesHubBackend.backend;
  assert.equal(on('localhost'), 'neon');
  assert.equal(on('127.0.0.1'), 'neon');
  assert.equal(on('gameshub-efc.web.app'), 'firebase');
  assert.equal(on('evil.example'), 'firebase');
});

test('U-BE-DISPATCH: with firebase (default) or without backend-pg.js, PlatformAuth and PlatformFirestore are the untouched originals', () => {
  const base = boot({ files: ['platform/auth.js', 'platform/firestore.js'] });
  const keys = o => Object.keys(o).sort().join();
  for (const b of [boot({ backend: { backend: 'firebase', neon: NEON.neon } }), boot({ backend: NEON, files: ['platform/auth.js', 'platform/firestore.js'] }), boot({})]) {
    assert.equal(keys(b.PF), keys(base.PF));
    assert.equal(keys(b.PA), keys(base.PA));
    for (const k of Object.keys(base.PF)) if (typeof base.PF[k] === 'function') assert.equal(b.PF[k].toString(), base.PF[k].toString(), 'PlatformFirestore.' + k);
    for (const k of Object.keys(base.PA)) if (typeof base.PA[k] === 'function') assert.equal(b.PA[k].toString(), base.PA[k].toString(), 'PlatformAuth.' + k);
    assert.equal(b.PF._neon, undefined);
  }
});

test('U-BE-DISPATCH: with neon and both URLs, the I/O methods are replaced and the pure ones are not', () => {
  const base = boot({ files: ['platform/auth.js', 'platform/firestore.js'] });
  const b = boot({ backend: NEON, fetch: mockFetch([]) });
  for (const k of ['getGameStats', 'updateGameStats', 'getOrCreateProfile', 'acceptInvite', 'createInvite', 'listMemberships', 'getLeaderboard', 'setChildPin']) {
    assert.notEqual(b.PF[k].toString(), base.PF[k].toString(), k);
  }
  for (const k of ['calculatePoints', 'levelFromXP', '_mergeStats', '_addDaily', 'hashPin', 'verifyPin', 'tryPin', 'isInviteActive', 'normEmail', 'dayKey', '_pid', '_owner', '_viewOnly']) {
    assert.equal(b.PF[k].toString(), base.PF[k].toString(), k);
  }
  assert.notEqual(b.PA.signInWithGoogle.toString(), base.PA.signInWithGoogle.toString());
  assert.equal(b.PA.onAuthStateChanged.toString(), base.PA.onAuthStateChanged.toString());
  // every public method the games and platform files use still exists
  for (const k of Object.keys(base.PF)) assert.ok(k in b.PF, k);
  for (const k of Object.keys(base.PA)) assert.ok(k in b.PA, k);
});

test('U-BE-DISPATCH: neon selected but a URL missing falls back to Firebase and says so', () => {
  const base = boot({ files: ['platform/auth.js', 'platform/firestore.js'] });
  const b = boot({ backend: { backend: 'neon', neon: { authBaseUrl: AUTH, dataApiUrl: '' } } });
  assert.equal(b.PF.updateGameStats.toString(), base.PF.updateGameStats.toString());
  assert.equal(b.PA.init.toString(), base.PA.init.toString());
  assert.ok(b.ctx.__errors.some(e => /keeping Firebase/.test(e)));
});

// ── Auth ───────────────────────────────────────────────────────────────────

test('U-BE-AUTH: init reads the session with cookies, normalises the user like the Firebase one and notifies listeners', async () => {
  const fetch = mockFetch(sessionRoutes());
  const b = boot({ backend: NEON, fetch });
  const seen = [];
  b.PA.onAuthStateChanged(u => seen.push(u));
  b.domReady();
  await tick(); await tick();
  assert.equal(seen[0], null);                       // fires at once with the current state, like Firebase
  const u = seen[seen.length - 1];
  assert.deepEqual(plain(Object.keys(u).sort()), ['createdAt', 'email', 'emailVerified', 'lastLogin', 'odId', 'photoURL', 'uid', 'username']);
  assert.equal(u.uid, ME); assert.equal(u.odId, ME); assert.equal(u.username, 'Ana'); assert.equal(u.email, 'Ana@Example.com');
  assert.equal(b.PA.currentUser.uid, ME);
  const call = fetch.calls[0];
  assert.equal(call.url.href, AUTH + '/get-session');
  assert.equal(call.credentials, 'include');
});

test('U-BE-AUTH: no session means a null user, not an error', async () => {
  const fetch = mockFetch([['GET', /get-session$/, () => ({ body: 'null' })]]);
  const b = boot({ backend: NEON, fetch });
  const seen = [];
  b.PA.onAuthStateChanged(u => seen.push(u));
  b.domReady(); await tick(); await tick();
  assert.deepEqual(seen, [null, null]);
});

test('U-BE-AUTH: signInWithGoogle asks Better Auth for the Google URL and redirects the page there', async () => {
  const fetch = mockFetch([['POST', /sign-in\/social$/, () => ({ body: { url: 'https://accounts.google.com/o/oauth2/auth?x=1', redirect: true } })]]);
  const b = boot({ backend: NEON, fetch });
  const r = await b.PA.signInWithGoogle();
  assert.equal(r, null);
  assert.deepEqual(plain(b.navigations), ['https://accounts.google.com/o/oauth2/auth?x=1']);
  const c = fetch.calls[0];
  assert.equal(c.url.href, AUTH + '/sign-in/social');
  assert.equal(c.body.provider, 'google');
  assert.equal(c.body.callbackURL, 'https://gameshub-efc.web.app/index.html');
  assert.equal(c.credentials, 'include');
});

test('U-BE-AUTH: signInWithGoogle fails loudly when Neon Auth answers without a URL', async () => {
  const b = boot({ backend: NEON, fetch: mockFetch([['POST', /sign-in\/social$/, () => ({ status: 403, body: { message: 'Invalid origin' } })]]) });
  await assert.rejects(() => b.PA.signInWithGoogle(), /Invalid origin/);
  assert.equal(b.navigations.length, 0);
});

test('U-BE-AUTH: the session verifier of the OAuth return is used once and removed from the address bar', async () => {
  const loc = { href: 'https://gameshub-efc.web.app/index.html?neon_auth_session_verifier=abc&x=1', origin: 'https://gameshub-efc.web.app', pathname: '/index.html', search: '?neon_auth_session_verifier=abc&x=1', hostname: 'gameshub-efc.web.app', assign() {} };
  const fetch = mockFetch(sessionRoutes());
  const b = boot({ backend: NEON, fetch, loc });
  b.domReady(); await tick(); await tick();
  assert.equal(fetch.calls[0].url.searchParams.get('neon_auth_session_verifier'), 'abc');
  assert.equal(b.ctx.__replaced.length, 1);
  assert.ok(!/neon_auth_session_verifier/.test(b.ctx.__replaced[0][2]));
  assert.match(b.ctx.__replaced[0][2], /x=1/);
});

test('U-BE-AUTH: signOut calls Better Auth, clears the user and notifies', async () => {
  const s = await signedIn([['POST', /sign-out$/, () => ({ body: { success: true } })]]);
  const seen = [];
  s.PA.onAuthStateChanged(u => seen.push(u));
  await s.PA.signOut();
  assert.equal(s.PA.currentUser, null);
  assert.equal(seen[seen.length - 1], null);
  assert.ok(s.fetch.calls.some(c => c.method === 'POST' && /sign-out$/.test(c.url.pathname)));
  // after signing out, data calls fall back to local mode: no request
  s.fetch.calls.length = 0;
  const st = await s.PF.getGameStats(ME, 'mathmaster');
  assert.equal(st.totalGames, 0);
  assert.equal(s.fetch.api().length, 0);
});

test('U-BE-JWT: the JWT is read from /token, cached until near its expiry, refreshed after, and falls back to the get-session header', async () => {
  let n = 0;
  const fetch = mockFetch([
    ['GET', /get-session$/, () => ({ body: { user: { id: ME, email: 'a@b.co', emailVerified: true } }, headers: { 'set-auth-jwt': jwt(ME) } })],
    ['GET', /token$/, () => ({ body: { token: jwt(ME, Math.floor(Date.now() / 1000) + 3600) + (++n) } })]
  ]);
  const b = boot({ backend: NEON, fetch });
  const c = b.PF._neon;
  await c.refreshSession();
  const t1 = await c.getJwt();                     // cached from the header of get-session
  assert.ok(t1.endsWith('sig'));
  assert.equal(fetch.calls.filter(x => /token$/.test(x.url.pathname)).length, 0);
  c.state.jwtExp = Date.now() + 5000;              // about to expire: ask again
  const t2 = await c.getJwt();
  assert.ok(t2.endsWith('sig1'));
  assert.equal(await c.getJwt(), t2);
  // /token unavailable: the header of get-session is the fallback
  const f2 = mockFetch([['GET', /get-session$/, () => ({ body: { user: { id: ME, email: 'a@b.co' } }, headers: { 'set-auth-jwt': jwt(ME) } })], ['GET', /token$/, () => ({ status: 404, body: '' })]]);
  const c2 = boot({ backend: NEON, fetch: f2 }).PF._neon;
  assert.ok((await c2.getJwt()).endsWith('sig'));
  // no session at all
  const c3 = boot({ backend: NEON, fetch: mockFetch([['GET', /get-session$/, () => ({ body: 'null' })], ['GET', /token$/, () => ({ status: 401, body: '' })]]) }).PF._neon;
  await assert.rejects(() => c3.getJwt(), /no-session/);
});

// ── Data API ───────────────────────────────────────────────────────────────

test('U-BE-API: every call carries the JWT as Bearer and the gameshub schema profile', async () => {
  const s = await signedIn([['GET', /rest\/v1\/adult_game_stats$/, () => ({ body: [] })], ['POST', /rest\/v1\/adult_game_stats$/, c => ({ status: 201, body: c.body ? [c.body] : [] })], ['POST', /rpc\/bump_progress$/, () => ({ body: { xp: 10, total_points: 5, level: 0 } })], ['GET', /rest\/v1\/adults$/, () => ({ body: [{ id: ME, username: 'Ana', xp: 10, total_points: 5, level: 0 }] })], ['POST', /rest\/v1\/leaderboard$/, () => ({ status: 201, body: [] })]]);
  await s.PF.getGameStats(ME, 'mathmaster');
  await s.PF.updateGameStats(ME, 'mathmaster', { correctAnswers: 5, totalAttempts: 5, elapsedSeconds: 30, bestStreak: 5, operation: 'suma', level: 1 });
  assert.ok(s.fetch.api().length >= 4);
  for (const c of s.fetch.api()) {
    assert.match(c.headers.Authorization, /^Bearer .+\.sig$/);
    assert.equal(c.headers[c.method === 'GET' ? 'Accept-Profile' : 'Content-Profile'], 'gameshub');
    assert.ok(c.url.href.startsWith(API + '/'));
    assert.ok(!/firebase|googleapis/.test(c.url.href));
  }
});

test('U-BE-STATS: updateGameStats writes stats and daily to their columns, bumps xp atomically, daily has its own column', async () => {
  const s = await signedIn([
    ['GET', /rest\/v1\/adult_game_stats$/, () => ({ body: [] })],
    ['POST', /rest\/v1\/adult_game_stats$/, c => ({ status: 201, body: [c.body] })],
    ['POST', /rpc\/bump_progress$/, () => ({ body: { xp: 400, total_points: 80, level: 0 } })],
    ['PATCH', /rest\/v1\/adults$/, c => ({ body: [{ id: ME, ...c.body }] })],
    ['GET', /rest\/v1\/adults$/, () => ({ body: [{ id: ME, username: 'Ana', xp: 400, total_points: 80, level: 3, avatar: 'fox' }] })],
    ['POST', /rest\/v1\/leaderboard$/, () => ({ status: 201, body: [] })]
  ]);
  const res = await s.PF.updateGameStats(ME, 'mathMaster', { correctAnswers: 8, totalQuestions: 10, totalAttempts: 10, elapsedSeconds: 30, bestStreak: 4, operation: 'suma', level: 2 });
  assert.equal(res.stats.totalGames, 1);
  const w = s.fetch.api().find(c => c.method === 'POST' && /adult_game_stats$/.test(c.url.pathname));
  assert.equal(w.url.searchParams.get('on_conflict'), 'owner_id,game');
  assert.match(w.headers.Prefer, /resolution=merge-duplicates/);
  assert.equal(w.body.game, 'mathmaster');                         // the alias goes through _gid
  assert.equal(w.body.owner_id, ME);
  assert.ok(w.body.daily && Object.keys(w.body.daily).length === 1);
  assert.equal(w.body.stats.daily, undefined);
  assert.equal(w.body.stats.byLevel.level_2.bestTime, 30);
  const b = s.fetch.api().find(c => /rpc\/bump_progress/.test(c.url.pathname));
  assert.deepEqual(plain(b.body), { p_owner: ME, p_pid: '', p_xp: res.points.xp, p_points: res.points.points, p_level: null });
  // level corrected from the new xp (400 xp is level 3 in XP_THRESHOLDS)
  const lv = s.fetch.api().find(c => c.method === 'PATCH');
  assert.equal(lv.body.level, s.PF.levelFromXP(400));
  const lb = s.fetch.api().find(c => /leaderboard$/.test(c.url.pathname));
  assert.equal(lb.body.owner_id, ME); assert.equal(lb.body.pid, ''); assert.equal(lb.url.searchParams.get('on_conflict'), 'game,owner_id,pid');
});

test('U-BE-STATS: stored rows come back as the Firestore document, daily included, null bestTime restored to Infinity', async () => {
  const row = { owner_id: ME, game: 'mathmaster', stats: { totalGames: 2, unlockedAchievements: ['a'], byLevel: { level_1: { games: 1, bestTime: null } } }, daily: { '2026-01-02': { games: 1, items: 5, minutes: 1, ok: 4 } } };
  const s = await signedIn([['GET', /adult_game_stats$/, () => ({ body: [row] })]]);
  const st = await s.PF.getGameStats(ME, 'mathMaster');
  assert.equal(st.totalGames, 2);
  assert.equal(st.daily['2026-01-02'].ok, 4);
  assert.equal(st.byLevel.level_1.bestTime, Infinity);
  assert.deepEqual(plain((await s.PF.getAchievements(ME, 'mathmaster')).unlockedAchievements), ['a']);
  const q = s.fetch.api()[0].url.searchParams;
  assert.equal(q.get('owner_id'), 'eq.' + ME); assert.equal(q.get('game'), 'eq.mathmaster');
});

test('U-BE-FAMILY: a child of the family reads and writes under the OWNER uuid; view guardians never write', async () => {
  const store = { ['games_hub_owner_' + ME]: OWN, ['games_hub_player_' + ME]: 'kid123abc', ['games_hub_mem_' + ME]: JSON.stringify([{ ownerUid: OWN, ownerName: 'Luna', role: 'view' }]) };
  const s = await signedIn([
    ['GET', /player_game_stats$/, () => ({ body: [] })],
    ['POST', /player_game_stats$/, c => ({ status: 201, body: [c.body] })],
    ['POST', /rpc\/bump_progress$/, () => ({ body: { xp: 0, total_points: 0, level: 0 } })]
  ], { store });
  assert.equal(s.PF._owner(ME), OWN);
  assert.equal(s.PF._viewOnly(ME), true);
  const r = await s.PF.updateGameStats(ME, 'snake', { correctAnswers: 1, totalAttempts: 1, elapsedSeconds: 5, bestStreak: 1, operation: 'suma', level: 1 });
  assert.equal(r.stats.totalGames, 1);                              // looked, played, but...
  assert.ok(s.fetch.api().every(c => c.method === 'GET'));          // ...saved nothing
  assert.equal(await s.PF.unlockAchievement(ME, 'snake', 'x'), true);
  assert.ok(s.fetch.api().every(c => c.method === 'GET'));
  const g = s.fetch.api()[0].url.searchParams;
  assert.equal(g.get('owner_id'), 'eq.' + OWN); assert.equal(g.get('pid'), 'eq.kid123abc');
  // an edit membership writes to the owner's child
  s.PF._setMemCache(ME, [{ ownerUid: OWN, ownerName: 'Luna', role: 'edit' }]);
  s.fetch.calls.length = 0;
  await s.PF.updateGameStats(ME, 'snake', { correctAnswers: 1, totalAttempts: 1, elapsedSeconds: 5, bestStreak: 1, operation: 'suma', level: 1 }).catch(() => {});
  const w = s.fetch.api().find(c => c.method === 'POST' && /player_game_stats$/.test(c.url.pathname));
  assert.equal(w.body.owner_id, OWN); assert.equal(w.body.pid, 'kid123abc'); assert.equal(w.url.searchParams.get('on_conflict'), 'pid,game');
});

test('U-BE-FAMILY: owner ids are uuids: an id with the Firebase shape is not trusted, a membership uuid is', () => {
  const b = boot({ backend: NEON, fetch: mockFetch([]) });
  const mem = [{ ownerUid: OWN, role: 'edit' }];
  assert.equal(b.PF.resolveOwner(ME, OWN, 'kid123abc', mem), OWN);
  assert.equal(b.PF.resolveOwner(ME, OWN, '', mem), ME);                    // no child selected
  assert.equal(b.PF.resolveOwner(ME, 'not-a-uuid', 'kid123abc', [{ ownerUid: 'not-a-uuid' }]), ME);
  assert.equal(b.PF.resolveOwner(ME, OWN, 'kid123abc', []), ME);            // orphan membership
});

test('U-BE-INVITES: create, list, accept (one RPC), decline, revoke, leave', async () => {
  const future = new Date(Date.now() + 5 * 86400000).toISOString();
  const s = await signedIn([
    ['GET', /rest\/v1\/guardians$/, c => ({ body: c.url.searchParams.get('owner_id') ? [{ guardian_id: OWN, email: 'x@y.co', name: 'X', role: 'view', since: '2026-01-01T00:00:00Z', invite_id: null }] : [] })],
    ['GET', /rest\/v1\/invites$/, c => ({ body: c.url.searchParams.get('email') ? [{ id: 'i1', owner_id: OWN, owner_name: 'Luna', email: 'ana@example.com', role: 'edit', created_at: '2026-01-01T00:00:00Z', expires: future }, { id: 'i2', owner_id: ME, owner_name: 'Yo', email: 'ana@example.com', role: 'edit', expires: future }, { id: 'i3', owner_id: OWN, owner_name: 'Luna', email: 'ana@example.com', role: 'edit', expires: '2020-01-01T00:00:00Z' }] : [] })],
    ['POST', /rest\/v1\/invites$/, c => ({ status: 201, body: [{ id: 'new-id', ...c.body }] })],
    ['POST', /rpc\/accept_invite$/, () => ({ body: { owner_id: OWN } })],
    ['DELETE', /rest\/v1\/(invites|guardians)$/, () => ({ body: [] })]
  ]);
  // create
  const id = await s.PF.createInvite(ME, ' Abuela@Example.com ', 'edit', 'Ana');
  assert.equal(id, 'new-id');
  const post = s.fetch.api().find(c => c.method === 'POST' && /invites$/.test(c.url.pathname));
  assert.deepEqual(plain(Object.keys(post.body).sort()), ['email', 'expires', 'owner_id', 'owner_name', 'role']);
  assert.equal(post.body.email, 'abuela@example.com');
  const days = (new Date(post.body.expires) - Date.now()) / 86400000;
  assert.ok(days > 29 && days < 31, 'expires in 30 days, inside the 31 the policy allows');
  await assert.rejects(() => s.PF.createInvite(ME, 'ana@example.com', 'edit', 'Ana'), /self/);
  await assert.rejects(() => s.PF.createInvite(ME, 'bad', 'edit', 'Ana'), /invalid/);
  await assert.rejects(() => s.PF.createInvite(ME, 'x@y.co', 'edit', 'Ana'), /duplicate/);
  // list mine: verified e-mail, active, not from myself
  const mine = await s.PF.listMyInvites();
  assert.deepEqual(plain(mine.map(i => i.id)), ['i1']);
  assert.equal(mine[0].ownerName, 'Luna'); assert.equal(typeof mine[0].expires.getTime(), 'number');
  assert.equal(s.fetch.api().filter(c => /invites$/.test(c.url.pathname) && c.method === 'GET').pop().url.searchParams.get('email'), 'eq.ana@example.com');
  // accept: ONE call, atomic in the database
  s.fetch.calls.length = 0;
  await s.PF.acceptInvite(mine[0], 'Ana');
  assert.equal(s.fetch.api().length, 1);
  assert.deepEqual(plain(s.fetch.api()[0].body), { p_invite: 'i1', p_name: 'Ana' });
  assert.equal(s.PF._memCache(ME)[0].ownerUid, OWN);
  await assert.rejects(() => s.PF.acceptInvite({ ...mine[0], ownerUid: ME }, 'Ana'), /invalid/);
  // decline / revoke / leave
  await s.PF.declineInvite('i1');
  await s.PF.removeGuardian(ME, OWN);
  await s.PF.leaveFamily(OWN);
  const del = s.fetch.api().filter(c => c.method === 'DELETE').map(c => c.url.pathname.split('/').pop() + '?' + c.url.searchParams.toString());
  assert.deepEqual(del, ['invites?id=eq.i1', `guardians?owner_id=eq.${ME}&guardian_id=eq.${OWN}`, `guardians?owner_id=eq.${OWN}&guardian_id=eq.${ME}`]);
  assert.deepEqual(plain(s.PF._memCache(ME)), []);
});

test('U-BE-INVITES: an unverified e-mail lists no invitations and sends no request', async () => {
  const fetch = mockFetch([['GET', /get-session$/, () => ({ body: { user: { id: ME, email: 'a@b.co', emailVerified: false } } })], ['GET', /token$/, () => ({ body: { token: jwt(ME) } })]]);
  const b = boot({ backend: NEON, fetch });
  b.domReady(); await tick(); await tick(); fetch.calls.length = 0;
  assert.deepEqual(plain(await b.PF.listMyInvites()), []);
  assert.equal(fetch.calls.length, 0);
});

test('U-BE-MEMBERSHIPS: listMemberships reads the memberships view and refreshes the local cache; setActiveFamily checks it', async () => {
  const s = await signedIn([['GET', /rest\/v1\/memberships$/, () => ({ body: [{ owner_id: OWN, owner_name: 'Luna', role: 'edit', since: '2026-01-01T00:00:00Z' }, { owner_id: 'junk', owner_name: 'x', role: 'edit' }, { owner_id: OWN, owner_name: 'x', role: 'god' }] })]]);
  const mem = await s.PF.listMemberships(ME);
  assert.deepEqual(plain(mem), [{ ownerUid: OWN, ownerName: 'Luna', role: 'edit' }]);
  await s.PF.setActiveFamily(ME, OWN);
  assert.equal(s.store['games_hub_owner_' + ME], OWN);
  await assert.rejects(() => s.PF.setActiveFamily(ME, '33333333-3333-4333-8333-333333333333'), /not-member/);
  await assert.rejects(() => s.PF.setActiveFamily(ME, 'junk'), /not-member/);
});

test('U-BE-PIN: setChildPin sends only the salted hash record; a refusal (zero rows) is a permission error; view guardians get one', async () => {
  let rows = [{ pid: 'kid123abc' }];
  const s = await signedIn([['PATCH', /rest\/v1\/players$/, () => ({ body: rows })]]);
  await s.PF.setChildPin(OWN, 'kid123abc', '4821');
  const p = s.fetch.api()[0];
  assert.equal(p.url.searchParams.get('pid'), 'eq.kid123abc'); assert.equal(p.url.searchParams.get('owner_id'), 'eq.' + OWN);
  assert.deepEqual(plain(Object.keys(p.body.pin).sort()), ['alg', 'hash', 'iter', 'salt', 'v']);
  assert.ok(!JSON.stringify(p.body).includes('4821'));
  await s.PF.clearChildPin(OWN, 'kid123abc');
  assert.equal(s.fetch.api()[1].body.pin, null);
  rows = [];                                                        // RLS filtered the row: not allowed
  await assert.rejects(() => s.PF.setChildPin(OWN, 'kid123abc', '4821'), /permission-denied/);
  await assert.rejects(() => s.PF.setChildPin(OWN, 'x', '4821'), /invalid/);
  await assert.rejects(() => s.PF.setChildPin(OWN, 'kid123abc', '12'), /invalid/);
});

test('U-BE-INTERESTS: setChildInterests sends the clean list (or null when empty)', async () => {
  const s = await signedIn([['PATCH', /rest\/v1\/players$/, () => ({ body: [{ pid: 'kid123abc' }] })]]);
  s.ctx.PlatformInterests = { sanitize: l => (Array.isArray(l) ? [...new Set(l)].filter(x => x === 'space' || x === 'music').slice(0, 5) : []) };
  assert.deepEqual(plain(await s.PF.setChildInterests(OWN, 'kid123abc', ['space', 'space', 'bad', 'music'])), ['space', 'music']);
  assert.deepEqual(plain(s.fetch.api()[0].body), { interests: ['space', 'music'] });
  await s.PF.setChildInterests(OWN, 'kid123abc', []);
  assert.deepEqual(plain(s.fetch.api()[1].body), { interests: null });
});

test('U-BE-PROFILE: players and the adult profile come back in the shape the platform files read', async () => {
  const s = await signedIn([
    ['GET', /rest\/v1\/players$/, () => ({ body: [{ pid: 'kid123abc', owner_id: ME, username: 'Pipo', avatar: 'fox', nickname_key: 'pipo', kind: 'child', xp: '12', total_points: '30', level: 1, settings: {}, pin: { v: 1 }, interests: ['space'], created_at: '2026-01-01T00:00:00Z' }] })],
    ['GET', /rest\/v1\/adults$/, () => ({ body: [{ id: ME, username: 'Ana', xp: 0, total_points: 0, level: 0, settings: { soundEnabled: true }, consent: { version: 1 }, created_at: '2026-01-01T00:00:00Z', last_login: null }] })],
    ['PATCH', /rest\/v1\/adults$/, () => ({ body: [{ id: ME }] })]
  ]);
  const kids = await s.PF.listPlayers(ME);
  assert.equal(kids[0].pid, 'kid123abc'); assert.equal(kids[0].username, 'Pipo'); assert.equal(kids[0].totalPoints, 30); assert.equal(kids[0].nicknameKey, 'pipo');
  assert.equal(s.PF.hasPin(kids[0]), false);                         // a PIN record with no salt and hash is not a PIN
  assert.deepEqual(plain(kids[0].interests), ['space']);
  s.store['games_hub_player_' + ME] = 'kid123abc';
  const kid = await s.PF.getActivePlayer(ME);
  assert.equal(kid.pid, 'kid123abc'); assert.equal(kid.ownerUid, undefined);
  const prof = await s.PF.getOrCreateProfile(ME, { username: 'Ana' });
  assert.equal(prof.uid, ME); assert.equal(prof.username, 'Pipo');   // the child plays
  const acct = await s.PF.getOrCreateProfile(ME, {}, { account: true });
  assert.equal(acct.username, 'Ana'); assert.equal(acct.consent.version, 1);
});

test('U-BE-PROFILE: a brand new adult gets a profile row with the same defaults as in Firebase', async () => {
  const s = await signedIn([['GET', /rest\/v1\/adults$/, () => ({ body: [] })], ['POST', /rest\/v1\/adults$/, c => ({ status: 201, body: [c.body] })]]);
  const p = await s.PF.getOrCreateProfile(ME, { username: 'Ana' });
  assert.equal(p.username, ''); assert.equal(p.xp, 0); assert.equal(p.settings.soundEnabled, true); assert.equal(p.photoURL, null);
  const ins = s.fetch.api().find(c => c.method === 'POST');
  assert.equal(ins.body.id, ME);
});

test('U-BE-LEADER: getLeaderboard orders by points and maps rows like the Firestore documents', async () => {
  const s = await signedIn([['GET', /rest\/v1\/leaderboard$/, () => ({ body: [{ game: 'mathmaster', owner_id: OWN, pid: 'kid123abc', username: 'Pipo', avatar: 'fox', total_points: '90', xp: '10', level: 1, updated_at: '2026-01-01T00:00:00Z' }] })]]);
  const top = await s.PF.getLeaderboard('mathMaster', 5);
  const q = s.fetch.api()[0].url.searchParams;
  assert.equal(q.get('game'), 'eq.mathmaster'); assert.equal(q.get('order'), 'total_points.desc'); assert.equal(q.get('limit'), '5');
  assert.deepEqual(plain(top[0]), { uid: OWN, username: 'Pipo', avatar: 'fox', photoURL: null, totalPoints: 90, xp: 10, level: 1, updatedAt: '2026-01-01T00:00:00.000Z' });
});

test('U-BE-ERRORS: Data API failures become errors with a code, and 23505 is "taken"', async () => {
  const s = await signedIn([
    ['GET', /rest\/v1\/guardians$/, () => ({ status: 401, body: { message: 'JWT expired', code: 'PGRST301' } })],
    ['POST', /rpc\/claim_identity$/, () => ({ status: 409, body: { code: '23505', message: 'nickname taken' } })]
  ]);
  await assert.rejects(() => s.PF._neon.get('guardians', {}), e => e.code === 'permission-denied' && e.status === 401);
  await assert.rejects(() => s.PF._neon.claimIdentity('A', 'a', 'fox', {}), e => e.message === 'taken' && e.code === 'already-exists');
});

test('U-BE-HELPERS: pure helpers', () => {
  const h = boot({ files: ['platform/backend-pg.js'] }).ctx.PlatformBackendPg._h;
  assert.equal(h.qs({ a: 'eq.x y', b: undefined, c: 'in.(1,2)' }), '?a=eq.x%20y&c=in.(1%2C2)');
  assert.equal(h.qs({}), '');
  assert.deepEqual(plain(h.decodeJwt(jwt('abc', 123))), { sub: 'abc', exp: 123 });
  assert.equal(h.decodeJwt('garbage'), null);
  assert.deepEqual(plain(h.jsonSafe({ a: Infinity, b: [NaN, 1], c: { d: -Infinity, e: 'x' } })), { a: null, b: [null, 1], c: { d: null, e: 'x' } });
  const row = h.statsToRow({ totalGames: 1, daily: { '2026-01-01': { games: 1 } }, byLevel: { level_1: { bestTime: Infinity } } });
  assert.deepEqual(plain(row.daily), { '2026-01-01': { games: 1 } });
  assert.equal(row.stats.daily, undefined);
  assert.equal(h.statsToRow({ totalGames: 1 }).daily, null);
});

test('U-BE-FILES: the adapter never mentions Firebase hosts, keys or connection strings', () => {
  for (const f of ['platform/backend-pg.js', 'platform/backend-config.js']) {
    const src = read(f);
    assert.ok(!/postgres(ql)?:\/\//i.test(src), f + ' has a connection string');
    assert.ok(!/AIza[0-9A-Za-z_-]{20,}/.test(src), f + ' has a Google API key');
    assert.ok(!/neondb_owner|npg_[A-Za-z0-9]/.test(src), f + ' has a Neon credential');
  }
});
