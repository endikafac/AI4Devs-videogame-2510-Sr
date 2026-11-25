import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const root = path.resolve(import.meta.dirname, '../..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
let server, base, browser;

before(async () => {
  server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(root, p);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nf'); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => server.listen(0, r));
  base = 'http://localhost:' + server.address().port;
  browser = await chromium.launch({ channel: 'chrome', headless: true });
});
after(async () => { await browser?.close(); server?.close(); });

// In-memory stand-in for the Firebase compat SDK. It also logs every read path in window.__reads,
// so the tests can prove which documents the panel touched.
const FIREBASE_STUB = `
(function () {
  var seed = window.__SEED || { docs: {} };
  var store = new Map(Object.entries(seed.docs || {}));
  var user = seed.user;
  var reads = window.__reads = [];
  var parentOf = function (p) { return p.split('/').slice(0, -1).join('/'); };
  var snapOf = function (p) {
    var has = store.has(p);
    return { id: p.split('/').pop(), exists: has, data: function () { return has ? JSON.parse(JSON.stringify(store.get(p))) : undefined; }, ref: docRef(p) };
  };
  var qsnap = function (list) {
    var docs = list.map(snapOf);
    return { docs: docs, size: docs.length, empty: !docs.length, forEach: function (f) { docs.forEach(f); } };
  };
  function applyInc(old, patch) {
    var out = Object.assign({}, old);
    Object.keys(patch).forEach(function (k) {
      var v = patch[k];
      out[k] = v && v.__inc != null ? (Number(out[k]) || 0) + v.__inc : (v && v.__ts ? new Date().toISOString() : v);
    });
    return out;
  }
  function docRef(p) {
    return {
      id: p.split('/').pop(),
      collection: function (n) { return colRef(p + '/' + n); },
      get: function () { reads.push('doc:' + p); return Promise.resolve(snapOf(p)); },
      set: function (d, o) { store.set(p, o && o.merge ? applyInc(store.get(p) || {}, d) : applyInc({}, d)); return Promise.resolve(); },
      update: function (d) { store.set(p, applyInc(store.get(p) || {}, d)); return Promise.resolve(); },
      delete: function () { store.delete(p); return Promise.resolve(); }
    };
  }
  function colRef(p, filters) {
    var f = filters || [];
    var q = {
      doc: function (id) { return docRef(p + '/' + (id || 'auto' + Math.random().toString(36).slice(2, 10))); },
      add: function (d) { var r = q.doc(); return r.set(d).then(function () { return r; }); },
      where: function (k, op, v) { return colRef(p, f.concat([[k, v]])); },
      get: function () {
        reads.push('col:' + p);
        var keys = Array.from(store.keys()).filter(function (k) { return parentOf(k) === p; });
        keys = keys.filter(function (k) { return f.every(function (c) { return store.get(k)[c[0]] === c[1]; }); });
        return Promise.resolve(qsnap(keys));
      }
    };
    return q;
  }
  var db = {
    collection: function (n) { return colRef(n); },
    batch: function () {
      var ops = [];
      return {
        set: function (r, d) { ops.push(function () { return r.set(d); }); },
        delete: function (r) { ops.push(function () { return r.delete(); }); },
        commit: function () { return Promise.all(ops.map(function (o) { return o(); })); }
      };
    },
    runTransaction: function (fn) { return fn({ get: function (r) { return r.get(); }, set: function (r, d) { r.set(d); }, delete: function (r) { r.delete(); } }); }
  };
  window.__store = store;
  var fb = function () {};
  fb.apps = [{}];
  fb.initializeApp = function () {};
  fb.firestore = function () { return db; };
  fb.firestore.FieldValue = { serverTimestamp: function () { return { __ts: 1 }; }, increment: function (n) { return { __inc: n }; }, arrayUnion: function (x) { return x; } };
  fb.firestore.Timestamp = { fromMillis: function (ms) { return { toMillis: function () { return ms; }, toJSON: function () { return ms; } }; } };
  var auth = {
    currentUser: user, getRedirectResult: function () { return Promise.resolve(null); },
    onAuthStateChanged: function (cb) { setTimeout(function () { cb(user || null); }, 0); return function () {}; },
    signOut: function () { return Promise.resolve(); }
  };
  fb.auth = function () { return auth; };
  fb.auth.GoogleAuthProvider = function () { this.setCustomParameters = function () {}; };
  window.firebase = fb;
})();`;

const ME = { uid: 'ownr123456', email: 'luna@example.com', emailVerified: true, displayName: 'Luna Real', photoURL: null };
const MYPROFILE = { uid: ME.uid, username: 'Luna', nicknameKey: 'luna', avatar: '🦊', photoURL: null, xp: 0, totalPoints: 0, level: 0, consent: { version: '2026-11', guardian: true } };
const GRAN = { uid: 'gran000001', email: 'abuela@example.com', emailVerified: true, displayName: 'Abuela Real', photoURL: null };
const OWNER = 'ownr000099', STRANGER = 'strg000077', PAL = 'palx000055';
const KID_A = 'kidaaa111', KID_B = 'kidbbb222', KID_F = 'kidfff333', KID_X = 'kidxxx999';

const IGNORE = /favicon|Missing or insufficient permissions|unauthorized-domain|net::ERR|Failed to load resource|firestore\.googleapis|identitytoolkit|offline|WebChannel|manifest|gstatic/i;
async function open(seed, { width = 390, height = 844, url = '/progreso.html', local = {}, session = {} } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block', locale: 'es-ES' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !IGNORE.test(m.text())) errors.push(m.text()); });
  await page.route('https://www.gstatic.com/firebasejs/**', r => r.fulfill({
    contentType: 'text/javascript', body: /app-compat/.test(r.request().url()) ? FIREBASE_STUB : '' }));
  await page.addInitScript(([s, l, ss]) => {
    window.__SEED = s;
    try {
      localStorage.setItem('games_hub_language', 'es-ES');
      Object.keys(l).forEach(k => localStorage.setItem(k, JSON.stringify(l[k])));
      Object.keys(ss).forEach(k => sessionStorage.setItem(k, ss[k]));
    } catch (e) {}
  }, [seed, local, { ['games_hub_picked_' + ME.uid]: '1', ['games_hub_picked_' + GRAN.uid]: '1', ...session }]);
  await page.addInitScript(() => Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' }));
  await page.goto(base + url, { waitUntil: 'load' });
  return { ctx, page, errors };
}

// ---- seeded fake data (no real people) ----
const dk = n => { const d = new Date(); d.setDate(d.getDate() - n); const p = x => (x < 10 ? '0' : '') + x; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); };
const e = g => ({ games: g, items: g * 10, minutes: g * 3, ok: g * 8 });
const kidGames = base => ({
  [base + '/games/reading']: { totalGames: 6, totalCorrect: 30, totalAttempts: 40, totalTime: 1200, daily: { [dk(0)]: e(2), [dk(2)]: e(1), [dk(9)]: e(3) } },
  [base + '/games/mapas']: { totalGames: 4, totalCorrect: 25, totalAttempts: 30, totalTime: 600, daily: { [dk(1)]: e(2), [dk(20)]: e(2) } },
  [base + '/games/mathmaster']: { totalGames: 9, totalCorrect: 80, totalAttempts: 90, totalTime: 900, byLevel: { level_2: { games: 3 }, level_4: { games: 2 } }, daily: { [dk(0)]: e(1), [dk(3)]: e(2) } },
  [base + '/games/clock']: { totalGames: 3, totalCorrect: 6, totalAttempts: 40, totalTime: 300, daily: { [dk(4)]: e(3) } }
});
const localFor = (uid, pid) => ({
  ['reading_' + uid + '_' + pid]: { hist: [{ d: dk(2), ppm: 62, id: 'a', b: 'b78' }, { d: dk(0), ppm: 74, id: 'b', b: 'b78' }], qlog: [{ d: dk(0), id: 'b', b: 'b78', c: 4, n: 5 }],
    texts: { 'es-rob-1': { stars: 3, quiz: 1 }, 'es-rob-2': { stars: 2, quiz: 1 } } },
  ['mapas_world_' + uid + '_' + pid]: { PE: { o: 0, f: 5, s: 0, t: Date.now() }, FR: { o: 6, f: 0, s: 6, t: Date.now() }, ES: { o: 4, f: 0, s: 3, t: Date.now() } },
  ['vocab_prog_' + uid + '_' + pid]: { animales: { gato: { b: 4 }, perro: { b: 3 }, pez: { b: 0 } } },
  ['clock_prog_' + uid + '_' + pid]: { units: { u1: { stars: 3 }, u2: { stars: 1 } }, learned: {}, last: dk(4) }
});

const ownerSeed = () => ({
  user: ME,
  docs: {
    ['users/' + ME.uid]: MYPROFILE,
    // the adult's OWN data: must never appear
    ['users/' + ME.uid + '/games/reading']: { totalGames: 777, totalCorrect: 700, totalAttempts: 777, totalTime: 99999, daily: { [dk(0)]: e(99) } },
    ['users/' + ME.uid + '/players/' + KID_A]: { username: 'Pipo', avatar: '🐼', kind: 'child' },
    ['users/' + ME.uid + '/players/' + KID_B]: { username: 'Nora', avatar: '🦄', kind: 'child' },
    ...kidGames('users/' + ME.uid + '/players/' + KID_A)
  }
});
const ownerLocal = () => ({
  ...localFor(ME.uid, KID_A),
  ['reading_' + ME.uid]: { hist: [{ d: dk(0), ppm: 987, id: 'adult', b: 'adult' }] },                  // the adult's own reading progress
  ['mapas_world_' + ME.uid]: { DE: { o: 0, f: 9, s: 0, t: Date.now() } },
  ['reading_' + ME.uid + '_' + KID_B]: { hist: [{ d: dk(1), ppm: 55, id: 'n', b: 'b56' }] }
});

const noOverflow = page => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.body.scrollWidth <= window.innerWidth);
const waitPanel = page => page.waitForSelector('.pg-kid', { timeout: 8000 });

test('F-PROGRESS: the owner sees each child with activity, plain words and a suggestion (390x844)', async () => {
  const { ctx, page, errors } = await open(ownerSeed(), { local: ownerLocal() });
  try {
    await waitPanel(page);
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('h1').innerText(), 'Progreso de los pequeños');
    assert.deepEqual(await page.locator('.pg-kid h2').allInnerTexts(), ['Pipo', 'Nora']);
    const pipo = page.locator('.pg-kid').first();
    const text = await pipo.innerText();
    // activity windows from the daily map: 7 days = today, 2 days ago, 1 day ago, 3 and 4 days ago
    assert.match(text, /Últimos 7 días/); assert.match(text, /Últimos 30 días/);
    const d7 = await pipo.locator('.pg-win .pg-card').first().locator('dd').allInnerTexts();
    assert.deepEqual(d7, ['5', '11', '33', '4'], '7 days: days, games, minutes, different games');
    const d30 = await pipo.locator('.pg-win .pg-card').nth(1).locator('dd').allInnerTexts();
    assert.deepEqual(d30, ['7', '16', '48', '4']);
    // device detail, in words
    assert.match(text, /Mejor lectura: 74 palabras por minuto/);
    assert.match(text, /Últimas lecturas: 62, 74 palabras por minuto/);
    assert.match(text, /Comprensión: buena/);
    assert.match(text, /Libros: 2 capítulos terminados, 5 estrellas/);
    assert.match(text, /Mundo: 2 de 193 dominados/);
    assert.match(text, /Palabras aprendidas: 2/);
    assert.match(text, /Unidad alcanzada: 2 de 10/);
    assert.match(text, /Nivel alcanzado: 4/);
    assert.match(text, /Aciertos: casi todo bien/);
    // strengths and things to reinforce
    assert.match(await pipo.locator('.pg-list.help').innerText(), /Perú/);
    assert.match(await pipo.locator('.pg-list.help').innerText(), /Vocabulario: pez/);
    assert.match(await pipo.locator('.pg-list.help').innerText(), /Relojes/);
    assert.match(await pipo.locator('.pg-list.ok').innerText(), /Lectura en voz alta dentro de su zona/);
    // weekly sentence and the play link
    const sum = await pipo.locator('.pg-sum').innerText();
    assert.match(sum, /^Pipo ha jugado 5 días esta semana, con 11 partidas y unos 33 minutos\./);
    assert.match(sum, /Para la próxima vez, os propongo /);
    const go = pipo.locator('a.pg-go');
    assert.match(await go.getAttribute('href'), /^[A-Za-z]+-E[FH][CS]\/index\.html$/);
    assert.ok((await go.boundingBox()).height >= 47.5, 'touch target');
    // chart is an accessible image
    assert.match(await pipo.locator('svg.pg-chart').getAttribute('aria-label'), /de los últimos 14 días con actividad/);
    // a child with no data is told so honestly, without errors
    const nora = await page.locator('.pg-kid').nth(1).innerText();
    assert.match(nora, /Nora ha jugado 1 día esta semana\. Lo que mejor/);
    assert.ok(!/Este dispositivo no tiene/.test(nora), 'this device has her reading');
    // no grades, no rankings, no dashes
    const all = await page.locator('main').innerText();
    assert.ok(!/%|ranking|nota\b|suspens|aprobad/i.test(all), 'no grades or rankings: ' + all.match(/.{20}(%|ranking|nota\b)/i));
    assert.ok(!/[—–]/.test(all), 'no dashes');
    // the adult's own data never shows: 777 games, 987 wpm, 9 failures of Germany
    assert.ok(!/777|987|Alemania|Germany/.test(all), 'adult own data leaked');
    assert.ok(await noOverflow(page), 'horizontal scroll');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-PROGRESS: on a device without the child progress it says so honestly and still shows the account activity', async () => {
  const { ctx, page, errors } = await open(ownerSeed());
  try {
    await waitPanel(page);
    const pipo = await page.locator('.pg-kid').first().innerText();
    assert.match(pipo, /Este dispositivo no tiene el detalle de Pipo\. Ábrelo desde el dispositivo donde juega\./);
    assert.match(pipo, /Pipo ha jugado 5 días esta semana, con 11 partidas/);
    assert.match(pipo, /Nivel alcanzado: 4/);
    assert.ok(!/Mejor lectura/.test(pipo), 'no reading detail without the device data');
    assert.match(await page.locator('.pg-note').first().innerText(), /solo se guarda en el dispositivo donde juega el niño/);
    const nora = await page.locator('.pg-kid').nth(1).innerText();
    assert.match(nora, /Nora no ha jugado esta semana\./);
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-PROGRESS: never reads the adult own documents, only the children', async () => {
  const { ctx, page } = await open(ownerSeed(), { local: ownerLocal() });
  try {
    await waitPanel(page);
    // Draw the panel again on a detached node, logging only what the panel itself reads (the page header reads the own profile for its menu).
    const reads = await page.evaluate(async uid => { window.__reads.length = 0; await PlatformProgress.render(document.createElement('div'), uid, {}); return window.__reads.slice(); }, ME.uid);
    const allowed = r => r === 'col:users/' + ME.uid + '/players' || r === 'col:users/' + ME.uid + '/memberships'
      || r === 'col:users/' + ME.uid + '/players/' + KID_A + '/games' || r === 'col:users/' + ME.uid + '/players/' + KID_B + '/games';
    assert.deepEqual(reads.filter(r => !allowed(r)), [], 'unexpected reads: ' + reads.join(', '));
    assert.ok(reads.includes('col:users/' + ME.uid + '/players'));
    assert.ok(reads.includes('col:users/' + ME.uid + '/players/' + KID_A + '/games'));
  } finally { await ctx.close(); }
});

test('F-PROGRESS: wide screen (1280x800) lays the children side by side without overflow', async () => {
  const { ctx, page, errors } = await open(ownerSeed(), { width: 1280, height: 800, local: ownerLocal() });
  try {
    await waitPanel(page);
    const boxes = await page.locator('.pg-kid').evaluateAll(n => n.map(x => { const r = x.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width }; }));
    assert.equal(boxes.length, 2);
    assert.ok(Math.abs(boxes[0].y - boxes[1].y) < 2 && boxes[1].x > boxes[0].x + 300, 'two columns');
    assert.ok(await noOverflow(page), 'horizontal scroll');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-PROGRESS: a guardian sees only the children of the family, never another adult data', async () => {
  const seed = {
    user: GRAN,
    docs: {
      ['users/' + GRAN.uid]: { uid: GRAN.uid, username: 'Abu', avatar: '👵', nicknameKey: 'abu', xp: 0, totalPoints: 0, level: 0, consent: { version: '2026-11', guardian: true } },
      ['users/' + GRAN.uid + '/games/reading']: { totalGames: 555, daily: { [dk(0)]: e(55) } },           // the guardian's own adult stats
      ['users/' + GRAN.uid + '/memberships/' + OWNER]: { ownerUid: OWNER, ownerName: 'Marta', role: 'view' },
      ['users/' + OWNER]: { username: 'Marta', avatar: '🦊', xp: 0, totalPoints: 0 },
      ['users/' + OWNER + '/games/reading']: { totalGames: 999, daily: { [dk(0)]: e(90) } },              // the owner's adult stats
      ['users/' + OWNER + '/guardians/' + GRAN.uid]: { uid: GRAN.uid, email: GRAN.email, name: 'Abu', role: 'view', inviteId: 'x' },
      ['users/' + OWNER + '/guardians/' + PAL]: { uid: PAL, email: 'papa-privado@example.com', name: 'Papa privado', role: 'edit', inviteId: 'y' },
      ['users/' + OWNER + '/players/' + KID_F]: { username: 'Lia', avatar: '🦋', kind: 'child', pin: { v: 1, alg: 'PBKDF2-SHA256', iter: 1000, salt: 'x'.repeat(24), hash: 'y'.repeat(44) } },
      ...kidGames('users/' + OWNER + '/players/' + KID_F),
      ['users/' + STRANGER + '/players/' + KID_X]: { username: 'Ajeno', avatar: '🐸', kind: 'child' },    // a family this guardian does not belong to
      ['users/' + STRANGER + '/games/reading']: { totalGames: 444 },
      ['users/' + PAL + '/games/reading']: { totalGames: 333 }
    }
  };
  const local = {
    ...localFor(GRAN.uid, KID_F),
    ['reading_' + GRAN.uid]: { hist: [{ d: dk(0), ppm: 987, id: 'adult', b: 'adult' }] },
    ['reading_' + OWNER]: { hist: [{ d: dk(0), ppm: 876, id: 'adult', b: 'adult' }] },
    ['reading_' + OWNER + '_' + KID_X]: { hist: [{ d: dk(0), ppm: 765, id: 'x', b: 'b78' }] }
  };
  const { ctx, page, errors } = await open(seed, { local });
  try {
    await waitPanel(page);
    assert.deepEqual(await page.locator('.pg-kid h2').allInnerTexts().then(a => a.map(s => s.split('\n')[0])), ['Lia']);
    assert.match(await page.locator('.pg-kid h2').innerText(), /Familia de Marta/);
    const all = await page.locator('main').innerText();
    assert.match(all, /Mejor lectura: 74 palabras por minuto/);
    for (const secret of ['555', '999', '444', '333', '987', '876', '765', 'Ajeno', 'Papa privado', 'papa-privado', 'Marta@', 'PBKDF2']) assert.ok(!all.includes(secret), 'leaked: ' + secret);
    const html = await page.content();
    assert.ok(!html.includes('papa-privado') && !html.includes('PBKDF2'));
    const reads = await page.evaluate(async uid => { window.__reads.length = 0; await PlatformProgress.render(document.createElement('div'), uid, {}); return window.__reads.slice(); }, GRAN.uid);
    const allowed = r => r === 'col:users/' + GRAN.uid + '/players' || r === 'col:users/' + GRAN.uid + '/memberships'
      || r === 'col:users/' + OWNER + '/players' || r === 'doc:users/' + OWNER + '/guardians/' + GRAN.uid
      || r === 'col:users/' + OWNER + '/players/' + KID_F + '/games';
    assert.deepEqual(reads.filter(r => !allowed(r)), [], 'unexpected reads: ' + reads.join(', '));
    assert.ok(reads.includes('col:users/' + OWNER + '/players/' + KID_F + '/games'));
    assert.ok(await noOverflow(page));
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-PROGRESS: signed out shows a sign in invitation, no data and no errors', async () => {
  const { ctx, page, errors } = await open({ docs: {} });
  try {
    await page.waitForSelector('.pg-msg');
    assert.match(await page.locator('.pg-msg').innerText(), /Entra con tu cuenta de adulto/);
    assert.match(await page.locator('.pg-msg a').getAttribute('href'), /^entrar\.html\?next=progreso\.html$/);
    assert.equal(await page.locator('.pg-kid').count(), 0);
    assert.ok(await noOverflow(page));
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-PROGRESS: an adult with no children is told how to add them', async () => {
  const { ctx, page, errors } = await open({ user: ME, docs: { ['users/' + ME.uid]: MYPROFILE } });
  try {
    await page.waitForFunction(() => /Todavía no hay niños/.test(document.body.innerText), null, { timeout: 8000 });
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-PROGRESS: the six languages render without leftover placeholders', async () => {
  const { ctx, page, errors } = await open(ownerSeed(), { local: ownerLocal() });
  try {
    await waitPanel(page);
    for (const l of ['en-US', 'eu-ES', 'gl-ES', 'ca-ES', 'fr-FR', 'es-ES']) {
      await page.evaluate(lang => PlatformI18n.setLanguage(lang), l);
      await page.waitForFunction(lang => document.documentElement.lang === lang.slice(0, 2) && document.querySelector('.pg-kid'), l);
      const txt = await page.locator('main').innerText();
      assert.ok(!/\{[a-z]+\}/.test(txt), l + ' placeholder: ' + txt.match(/.{20}\{[a-z]+\}/));
      assert.ok(!/[—–]/.test(txt), l + ' dash');
      assert.ok(await noOverflow(page), l + ' overflow');
    }
    const title = await page.locator('h1').innerText();
    assert.equal(title, 'Progreso de los pequeños');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-PROGRESS: reachable from the Familia screen and from the profile picker', async () => {
  const seed = ownerSeed();
  const { ctx, page, errors } = await open(seed, { url: '/index.html', local: ownerLocal(), session: { ['games_hub_picked_' + ME.uid]: '1' } });
  try {
    await page.waitForFunction(() => typeof PlatformHeader !== 'undefined' && PlatformHeader._userProfile, null, { timeout: 8000 });
    // Familia screen
    await page.click('#platform-user-btn');
    await page.click('#pd-players');
    await page.waitForSelector('#pid-family');
    await page.click('#pid-family');
    await page.waitForSelector('#pid-fam-progress');
    assert.match(await page.locator('#pid-fam-progress').getAttribute('href'), /\/progreso\.html$/);
    assert.ok((await page.locator('#pid-fam-progress').boundingBox()).height >= 47.5);
    await page.click('#pid-fam-back');
    await page.waitForSelector('#pid-close');
    await page.click('#pid-close');
    // profile picker (adult playing)
    await page.evaluate(() => PlatformProfiles.open({ uid: PlatformAuth.currentUser.uid, profile: PlatformHeader._userProfile }));
    await page.waitForSelector('#pp-overlay #pp-progress', { timeout: 5000 });
    assert.ok(await noOverflow(page));
    await Promise.all([page.waitForURL(/\/progreso\.html$/), page.click('#pp-progress')]);
    await waitPanel(page);
    assert.deepEqual(await page.locator('.pg-kid h2').allInnerTexts(), ['Pipo', 'Nora']);
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-PROGRESS: the picker does not offer the dashboard while a child is playing', async () => {
  const { ctx, page, errors } = await open(ownerSeed(), { url: '/index.html', session: { ['games_hub_picked_' + ME.uid]: '1' } });
  try {
    await page.waitForFunction(() => typeof PlatformHeader !== 'undefined' && PlatformHeader._userProfile, null, { timeout: 8000 });
    await page.evaluate(([uid, pid]) => { PlatformFirestore.setActivePlayer(uid, pid); }, [ME.uid, KID_A]);
    await page.evaluate(() => PlatformProfiles.open({ uid: PlatformAuth.currentUser.uid, profile: PlatformHeader._userProfile }));
    await page.waitForSelector('#pp-overlay .pp-tile');
    assert.equal(await page.locator('#pp-progress').count(), 0);
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});
