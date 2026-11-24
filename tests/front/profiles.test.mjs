import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { chromium } from 'playwright-core';

// "Quien juega?" picker, profile PIN, adult / child hub. Same pattern as family.test.mjs:
// real platform code, in-memory stand-in for the Firebase SDK, no network.

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

const FIREBASE_STUB = `
(function () {
  var seed = window.__SEED || { docs: {} };
  var store = new Map(Object.entries(seed.docs || {}));
  var user = seed.user;
  var parentOf = function (p) { return p.split('/').slice(0, -1).join('/'); };
  var logRead = function (p) { try { var a = JSON.parse(sessionStorage.getItem('__reads') || '[]'); a.push(p); sessionStorage.setItem('__reads', JSON.stringify(a)); } catch (e) {} };
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
      if (v && v.__del) { delete out[k]; return; }
      out[k] = v && v.__inc != null ? (Number(out[k]) || 0) + v.__inc : (v && v.__ts ? new Date().toISOString() : v);
    });
    return out;
  }
  function docRef(p) {
    return {
      id: p.split('/').pop(),
      collection: function (n) { return colRef(p + '/' + n); },
      get: function () { logRead(p); return Promise.resolve(snapOf(p)); },
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
        logRead(p + '/*');
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
  fb.firestore.FieldValue = { serverTimestamp: function () { return { __ts: 1 }; }, increment: function (n) { return { __inc: n }; }, arrayUnion: function (x) { return x; }, delete: function () { return { __del: 1 }; } };
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
const MYPROFILE = { uid: ME.uid, username: 'Luna', nicknameKey: 'luna', avatar: '🦊', photoURL: null, xp: 0, totalPoints: 0, level: 0,
  consent: { version: '2026-11', guardian: true } };
const pinRec = pin => { const salt = randomBytes(16); return { v: 1, alg: 'PBKDF2-SHA256', iter: 100000, salt: salt.toString('base64'), hash: pbkdf2Sync(pin, salt, 100000, 32, 'sha256').toString('base64') }; };
const KID_PIN = 'kid111111', KID_FREE = 'kid222222', KID_VIEW = 'kid333333', KID_EDIT = 'kid444444';
const VIEW_OWNER = 'famview001', EDIT_OWNER = 'famedit002';
const mem = (owner, name, role) => ({
  ['users/' + ME.uid + '/memberships/' + owner]: { ownerUid: owner, ownerName: name, role },
  ['users/' + owner + '/guardians/' + ME.uid]: { uid: ME.uid, email: ME.email, name: 'Luna', role, inviteId: 'x' }
});
const family = () => ({
  ['users/' + ME.uid + '/players/' + KID_PIN]: { username: 'Pipo', avatar: '🐼', kind: 'child', totalPoints: 10, xp: 0, pin: pinRec('1234') },
  ['users/' + ME.uid + '/players/' + KID_FREE]: { username: 'Nora', avatar: '🦄', kind: 'child', totalPoints: 0, xp: 0 },
  ...mem(VIEW_OWNER, 'Marta', 'view'),
  ['users/' + VIEW_OWNER + '/players/' + KID_VIEW]: { username: 'Tom', avatar: '🐯', kind: 'child', totalPoints: 3 },
  ...mem(EDIT_OWNER, 'Rosa', 'edit'),
  ['users/' + EDIT_OWNER + '/players/' + KID_EDIT]: { username: 'Lia', avatar: '🦋', kind: 'child', totalPoints: 1 },
  ['users/' + VIEW_OWNER]: { username: 'OwnerAdultSecret', xp: 99 }
});

const IGNORE = /favicon|Missing or insufficient permissions|unauthorized-domain|net::ERR|Failed to load resource|firestore\.googleapis|identitytoolkit|offline|WebChannel|manifest|gstatic/i;
async function open(docs, { width = 390, height = 844, url = '/index.html', init } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block', locale: 'es-ES' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !IGNORE.test(m.text())) errors.push(m.text()); });
  page.on('dialog', d => d.accept());
  await page.route('https://www.gstatic.com/firebasejs/**', r => r.fulfill({
    contentType: 'text/javascript', body: /app-compat/.test(r.request().url()) ? FIREBASE_STUB : '' }));
  const seed = { user: ME, docs: { ['users/' + ME.uid]: MYPROFILE, ...docs } };
  await page.addInitScript(s => { window.__SEED = s; try { localStorage.setItem('games_hub_language', 'es-ES'); } catch (e) {} }, seed);
  if (init) await page.addInitScript(init);
  await page.addInitScript(() => Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' }));
  await page.goto(base + url, { waitUntil: 'load' });
  return { ctx, page, errors };
}
const noHScroll = page => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.body.scrollWidth <= window.innerWidth);
const ready = page => page.waitForFunction(() => typeof PlatformHeader !== 'undefined' && PlatformHeader._userProfile, null, { timeout: 8000 });
const tile = (page, key) => page.locator('#pp-overlay .pp-tile[data-key="' + key + '"]');
const ls = (page, k) => page.evaluate(k => localStorage.getItem(k), k);
async function reloaded(page, action) { await Promise.all([page.waitForEvent('load', { timeout: 8000 }), action()]); await ready(page); }
async function openPicker(page) {
  await ready(page);
  await page.click('#platform-switch-btn');
  await page.waitForSelector('#pp-overlay .pp-tile', { timeout: 5000 });
}

test('F-PICKER: after sign in a full screen picker lists Yo, the children and the family children (390x844 and 1280x800)', async () => {
  for (const [width, height] of [[390, 844], [1280, 800]]) {
    const { ctx, page, errors } = await open(family(), { width, height });
    try {
      await page.waitForSelector('#pp-overlay .pp-tile', { timeout: 8000 });
      assert.equal(await page.locator('#pp-title').innerText(), '¿Quién juega?');
      assert.equal(await page.locator('#pp-overlay').getAttribute('role'), 'dialog');
      const keys = await page.locator('#pp-overlay .pp-tile[data-key]').evaluateAll(n => n.map(x => x.dataset.key));
      assert.deepEqual(keys, ['me', ME.uid + ':' + KID_PIN, ME.uid + ':' + KID_FREE, VIEW_OWNER + ':' + KID_VIEW, EDIT_OWNER + ':' + KID_EDIT]);
      assert.match(await tile(page, 'me').innerText(), /Yo/);
      assert.match(await tile(page, ME.uid + ':' + KID_PIN).innerText(), /Pipo[\s\S]*con clave/);
      assert.match(await tile(page, VIEW_OWNER + ':' + KID_VIEW).innerText(), /Familia de Marta/);
      // big touch targets
      for (const b of await page.locator('#pp-overlay button').all()) {
        const r = await b.boundingBox();
        assert.ok(r && r.height >= 56 && r.width >= 56, 'target ' + (await b.innerText()).slice(0, 20) + ' ' + JSON.stringify(r));
      }
      assert.ok(await noHScroll(page), 'horizontal scroll at ' + width);
      assert.ok(await page.evaluate(() => { const o = document.getElementById('pp-overlay'); return o.scrollWidth <= o.clientWidth; }), 'overlay overflow');
      const all = await page.locator('#pp-overlay').innerText();
      assert.ok(!/[—–]/.test(all));
      // the splash of nav.js is gone: the picker never leaves a second loading screen
      await page.waitForFunction(() => { const n = document.getElementById('gh-nav'); return !n || n.hidden || getComputedStyle(n).display === 'none'; }, null, { timeout: 5000 });
      assert.deepEqual(errors, []);
    } finally { await ctx.close(); }
  }
});

test('F-PICKER: with no children the picker does not interrupt, and the header button still opens it', async () => {
  const { ctx, page, errors } = await open({});
  try {
    await ready(page);
    await page.waitForTimeout(600);
    assert.equal(await page.locator('#pp-overlay').count(), 0);
    const btn = page.locator('#platform-switch-btn');
    assert.match(await btn.getAttribute('aria-label'), /Cambiar de perfil/);
    await btn.click();
    await page.waitForSelector('#pp-overlay .pp-tile[data-key="me"]');
    assert.equal(await page.locator('#pp-overlay .pp-tile[data-key]').count(), 1);
    assert.ok(await page.locator('#pp-add').count(), 'offers to add a child');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#pp-overlay').count(), 0);
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.id), 'platform-switch-btn', 'focus returns to the header button');
    assert.ok(await noHScroll(page));
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-PICKER: the header shows a visible "Cambiar de perfil" button on desktop and an icon button on the phone', async () => {
  const d = await open(family(), { width: 1280, height: 800, init: () => sessionStorage.setItem('games_hub_picked_ownr123456', '1') });
  try {
    await ready(d.page);
    assert.match(await d.page.locator('#platform-switch-btn').innerText(), /Cambiar de perfil/);
    assert.ok(await noHScroll(d.page));
  } finally { await d.ctx.close(); }
  const m = await open(family(), { init: () => sessionStorage.setItem('games_hub_picked_ownr123456', '1') });
  try {
    await ready(m.page);
    const r = await m.page.locator('#platform-switch-btn').boundingBox();
    assert.ok(r.width >= 44 && r.height >= 44, JSON.stringify(r));
    assert.ok(await noHScroll(m.page), 'phone header overflow');
    assert.equal(await m.page.locator('#pp-overlay').count(), 0, 'not shown twice in one session');
    assert.deepEqual(m.errors, []);
  } finally { await m.ctx.close(); }
});

test('F-SWITCH: tapping a child without PIN switches the active player and remembers it; the picker does not come back on that reload', async () => {
  const { ctx, page, errors } = await open(family());
  try {
    await page.waitForSelector('#pp-overlay .pp-tile');
    await reloaded(page, () => tile(page, ME.uid + ':' + KID_FREE).click());
    assert.equal(await ls(page, 'games_hub_player_' + ME.uid), KID_FREE);
    assert.equal(await ls(page, 'games_hub_owner_' + ME.uid), null);
    assert.equal(await page.locator('#pp-overlay').count(), 0);
    assert.match(await page.locator('.platform-user-name').innerText(), /Nora/);
    // switch again from the header button: the active one is marked, Yo goes back to the adult
    await openPicker(page);
    assert.ok(await tile(page, ME.uid + ':' + KID_FREE).evaluate(n => n.classList.contains('active')));
    assert.equal(await page.evaluate(() => document.activeElement.dataset.key), ME.uid + ':' + KID_FREE, 'focus on the last profile');
    await reloaded(page, () => tile(page, 'me').click());
    assert.equal(await ls(page, 'games_hub_player_' + ME.uid), null);
    assert.match(await page.locator('.platform-user-name').innerText(), /Luna/);
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-SWITCH: a child of another family switches the family too; an adult never gets the family owner data', async () => {
  const { ctx, page, errors } = await open(family());
  try {
    await page.waitForSelector('#pp-overlay .pp-tile');
    await reloaded(page, () => tile(page, VIEW_OWNER + ':' + KID_VIEW).click());
    assert.equal(await ls(page, 'games_hub_player_' + ME.uid), KID_VIEW);
    assert.equal(await ls(page, 'games_hub_owner_' + ME.uid), VIEW_OWNER);
    assert.match(await page.locator('.platform-user-name').innerText(), /Tom/);
    // privacy of the client: the family owner own document, stats and memberships are never read
    const reads = await page.evaluate(() => JSON.parse(sessionStorage.getItem('__reads') || '[]'));
    for (const p of reads) {
      assert.ok(p !== 'users/' + VIEW_OWNER && p !== 'users/' + EDIT_OWNER, 'read of an owner adult document: ' + p);
      assert.ok(!/^users\/(famview001|famedit002)\/(games|memberships|settings)/.test(p), 'read of owner adult data: ' + p);
    }
    assert.ok(reads.some(p => p === 'users/' + VIEW_OWNER + '/players/' + KID_VIEW), 'the child profile is read');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-PIN: a PIN child asks for the PIN on a keypad; a wrong PIN says how many tries are left; the right PIN switches', async () => {
  const { ctx, page, errors } = await open(family());
  try {
    await page.waitForSelector('#pp-overlay .pp-tile');
    await tile(page, ME.uid + ':' + KID_PIN).click();
    await page.waitForSelector('#pp-overlay .pp-pad');
    assert.match(await page.locator('#pp-title').innerText(), /Clave de Pipo/);
    assert.match(await page.locator('.pp-note').innerText(), /candado de comodidad[\s\S]*No protege la cuenta/);
    assert.equal(await page.locator('.pp-key').count(), 12);
    for (const b of await page.locator('.pp-key').all()) {
      const r = await b.boundingBox();
      assert.ok(r.width >= 56 && r.height >= 56, JSON.stringify(r));
    }
    assert.ok(await noHScroll(page));
    assert.equal(await ls(page, 'games_hub_player_' + ME.uid), null, 'not switched yet');
    // wrong PIN with the keyboard
    for (const d of '0000') await page.keyboard.press(d);
    await page.waitForFunction(() => /incorrecta/.test(document.querySelector('.pp-msg').textContent));
    assert.match(await page.locator('.pp-msg').innerText(), /Te quedan 4 intentos/);
    assert.equal(await page.locator('.pp-dot.on').count(), 0, 'the dots reset');
    assert.equal(await ls(page, 'games_hub_player_' + ME.uid), null);
    // backspace works, then the right PIN with the on-screen keys
    await page.keyboard.press('1'); await page.keyboard.press('2'); await page.keyboard.press('Backspace');
    assert.equal(await page.locator('.pp-dot.on').count(), 1);
    await page.keyboard.press('Backspace');
    await Promise.all([page.waitForEvent('load', { timeout: 8000 }), (async () => {
      for (const d of '1234') await page.locator('.pp-key', { hasText: new RegExp('^' + d + '$') }).click();
    })()]);
    await ready(page);
    assert.equal(await ls(page, 'games_hub_player_' + ME.uid), KID_PIN);
    assert.equal(await ls(page, 'games_hub_pinlock_' + [ME.uid, ME.uid, KID_PIN].join('_')), null, 'a right PIN clears the failures');
    assert.match(await page.locator('.platform-user-name').innerText(), /Pipo/);
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-PIN: five wrong PINs lock the profile for 30 s, even the right PIN is refused, and the lock survives a reload', async () => {
  const { ctx, page, errors } = await open(family());
  try {
    await page.waitForSelector('#pp-overlay .pp-tile');
    await tile(page, ME.uid + ':' + KID_PIN).click();
    await page.waitForSelector('#pp-overlay .pp-pad');
    for (let i = 0; i < 5; i++) {
      for (const d of '9999') await page.keyboard.press(d);
      await page.waitForFunction(i => i < 4 ? /incorrecta/.test(document.querySelector('.pp-msg').textContent) : /Demasiados/.test(document.querySelector('.pp-msg').textContent), i);
    }
    assert.match(await page.locator('.pp-msg').innerText(), /Demasiados intentos\. Espera (29|30) segundos/);
    assert.ok(await page.locator('.pp-key').evaluateAll(k => k.every(x => x.disabled || x.id === 'pp-pin-back')), 'keypad disabled while locked');
    // the right PIN does nothing while locked
    for (const d of '1234') await page.keyboard.press(d);
    await page.waitForTimeout(500);
    assert.equal(await ls(page, 'games_hub_player_' + ME.uid), null);
    assert.ok(await page.locator('.pp-msg').innerText().then(t => /Demasiados/.test(t)));
    const key = 'games_hub_pinlock_' + [ME.uid, ME.uid, KID_PIN].join('_');
    const st = JSON.parse(await ls(page, key));
    assert.ok(st.until > Date.now() && st.until <= Date.now() + 30000);
    // a reload does not reset it
    await page.reload({ waitUntil: 'load' });
    await ready(page);
    await openPicker(page);
    await tile(page, ME.uid + ':' + KID_PIN).click();
    await page.waitForSelector('#pp-overlay .pp-pad');
    assert.match(await page.locator('.pp-msg').innerText(), /Demasiados intentos/);
    // after the wait it works again
    await page.evaluate(k => localStorage.setItem(k, JSON.stringify({ fails: 0, until: Date.now() - 1 })), key);
    await page.locator('#pp-pin-back').click();
    await tile(page, ME.uid + ':' + KID_PIN).click();
    await page.waitForSelector('#pp-overlay .pp-pad');
    await page.waitForFunction(() => !document.querySelector('.pp-key:not(#pp-pin-back)').disabled);
    await Promise.all([page.waitForEvent('load', { timeout: 8000 }), (async () => { for (const d of '1234') await page.keyboard.press(d); })()]);
    await ready(page);
    assert.equal(await ls(page, 'games_hub_player_' + ME.uid), KID_PIN);
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-PIN: Atras and Escape leave the keypad without switching', async () => {
  const { ctx, page, errors } = await open(family());
  try {
    await page.waitForSelector('#pp-overlay .pp-tile');
    await tile(page, ME.uid + ':' + KID_PIN).click();
    await page.waitForSelector('#pp-overlay .pp-pad');
    await page.keyboard.press('Escape');
    await page.waitForSelector('#pp-overlay .pp-grid');
    assert.equal(await page.locator('#pp-title').innerText(), '¿Quién juega?');
    assert.equal(await ls(page, 'games_hub_player_' + ME.uid), null);
    await page.click('#pp-close');
    assert.equal(await page.locator('#pp-overlay').count(), 0);
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

async function openFamily(page) {
  await ready(page);
  await page.click('#platform-user-btn');
  await page.click('#pd-players');
  await page.waitForSelector('#pid-family', { timeout: 5000 });
  await page.click('#pid-family');
  await page.waitForSelector('.pid-pin-row', { timeout: 5000 });
}
const seenPickerOnce = () => sessionStorage.setItem('games_hub_picked_ownr123456', '1');

test('F-PIN-SET: the owner sets, changes and removes a child PIN in the Familia screen; only a salted hash is stored', async () => {
  const { ctx, page, errors } = await open(family(), { init: seenPickerOnce });
  try {
    await openFamily(page);
    assert.match(await page.locator('.pid-modal').innerText(), /candado de comodidad[\s\S]*no seguridad de la cuenta/);
    const row = name => page.locator('.pid-pin-row', { hasText: name });
    assert.match(await row('Nora').innerText(), /Sin clave/);
    assert.match(await row('Pipo').innerText(), /Con clave/);
    await row('Nora').locator('[data-act=set]').click();
    // not four digits: refused, nothing written
    await page.fill('[data-pin-input]', '12ab');
    assert.equal(await page.inputValue('[data-pin-input]'), '12', 'only digits are accepted');
    await page.click('[data-act=save]');
    assert.match(await page.locator('#pid-error').innerText(), /4 cifras/);
    await page.fill('[data-pin-input]', '4321');
    await page.click('[data-act=save]');
    await page.waitForSelector('#pid-pin-status');
    assert.match(await page.locator('#pid-pin-status').innerText(), /Clave guardada/);
    assert.match(await row('Nora').innerText(), /Con clave/);
    const stored = await page.evaluate(id => JSON.stringify(window.__store.get('users/ownr123456/players/' + id)), KID_FREE);
    const rec = JSON.parse(stored).pin;
    assert.equal(rec.alg, 'PBKDF2-SHA256');
    assert.equal(rec.v, 1);
    assert.ok(rec.salt && rec.hash);
    assert.ok(!stored.includes('4321'), 'the PIN itself is never stored');
    assert.ok(!(await page.evaluate(() => JSON.stringify(Array.from(window.__store.values())))).includes('"4321"'));
    // the stored record verifies with the app code
    assert.equal(await page.evaluate(r => PlatformFirestore.verifyPin('4321', r), rec), true);
    assert.equal(await page.evaluate(r => PlatformFirestore.verifyPin('1111', r), rec), false);
    // change and remove
    await row('Nora').locator('[data-act=set]').click();
    await page.fill('[data-pin-input]', '1111');
    await page.click('[data-act=save]');
    await page.waitForFunction(h => window.__store.get('users/ownr123456/players/kid222222').pin.hash !== h, rec.hash);
    const rec2 = await page.evaluate(id => window.__store.get('users/ownr123456/players/' + id).pin, KID_FREE);
    assert.notEqual(rec2.hash, rec.hash);
    await row('Nora').locator('[data-act=remove]').click();
    await page.waitForFunction(() => /Clave quitada/.test((document.getElementById('pid-pin-status') || {}).textContent || ''));
    assert.equal(await page.evaluate(id => 'pin' in window.__store.get('users/ownr123456/players/' + id), KID_FREE), false);
    assert.match(await row('Nora').innerText(), /Sin clave/);
    // 48px targets and no horizontal overflow
    for (const sel of ['[data-act=set]']) for (const b of await page.locator(sel).all()) assert.ok((await b.boundingBox()).height >= 47.5);
    assert.ok(await noHScroll(page));
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-PIN-SET: an edit guardian can set and reset the PIN of the family children; a view guardian cannot', async () => {
  const { ctx, page, errors } = await open(family(), { init: seenPickerOnce });
  try {
    await openFamily(page);
    const view = page.locator('.pid-pin-row[data-pid="' + KID_VIEW + '"]');
    const edit = page.locator('.pid-pin-row[data-pid="' + KID_EDIT + '"]');
    assert.match(await view.innerText(), /Tom/);
    assert.equal(await view.locator('button').count(), 0, 'view role: no buttons');
    assert.match(await page.locator('.pid-modal').innerText(), /rol de solo ver no se pueden cambiar claves/);
    await edit.locator('[data-act=set]').click();
    await page.fill('[data-pin-input]', '2580');
    await page.click('[data-act=save]');
    await page.waitForSelector('#pid-pin-status');
    const rec = await page.evaluate(id => window.__store.get('users/' + 'famedit002' + '/players/' + id).pin, KID_EDIT);
    assert.equal(await page.evaluate(r => PlatformFirestore.verifyPin('2580', r), rec), true);
    await edit.locator('[data-act=remove]').click();
    await page.waitForSelector('#pid-pin-status');
    assert.equal(await page.evaluate(id => 'pin' in window.__store.get('users/famedit002/players/' + id), KID_EDIT), false);
    assert.equal(await page.evaluate(id => 'pin' in (window.__store.get('users/famview001/players/' + id) || {}), KID_VIEW), false);
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

async function hubTitles(page) {
  await page.waitForSelector('#hub-grid .tile-title', { timeout: 5000 });
  return page.locator('#hub-grid .tile-title').allInnerTexts();
}

test('F-HUB-ADULT: the adult profile opens the hub on adult games with a "Para ti" row first', async () => {
  const { ctx, page, errors } = await open(family(), { init: seenPickerOnce });
  try {
    await ready(page);
    await page.waitForSelector('#hub-foryou:not([hidden])', { timeout: 5000 });
    assert.match(await page.locator('#hub-foryou-h').innerText(), /Para ti/);
    const row = await page.locator('#hub-foryou-row .foryou-card').allInnerTexts();
    assert.deepEqual(row.map(t => t.trim().split(/\n/).pop()), ['WordSearch', 'Crucigrama', 'Lectura Guiada', 'Memoria de Parejas', 'MathMaster', 'TableMaster', 'Mapas y Geografía']);
    for (const b of await page.locator('#hub-foryou-row .foryou-card').all()) assert.ok((await b.boundingBox()).height >= 55.5);
    // the row is before the grid
    assert.ok(await page.evaluate(() => document.getElementById('hub-foryou').compareDocumentPosition(document.getElementById('hub-grid')) & Node.DOCUMENT_POSITION_FOLLOWING));
    const titles = await hubTitles(page);
    assert.ok(titles.includes('Crucigrama'));
    assert.ok(!titles.includes('Aprende la Hora'), 'kids only game hidden for the adult');
    assert.equal(await page.locator('.chip[data-g=aud][aria-pressed=true]').getAttribute('data-v'), 'adults');
    // the adult can still widen the filter
    await page.click('.chip[data-g=aud][data-v=all]');
    assert.ok((await hubTitles(page)).includes('Aprende la Hora'));
    assert.ok(await noHScroll(page));
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-HUB-CHILD: a child profile sees kids games only, no audience filter and no "Para ti" row', async () => {
  const { ctx, page, errors } = await open(family(), {
    init: () => { sessionStorage.setItem('games_hub_picked_ownr123456', '1'); localStorage.setItem('games_hub_player_ownr123456', 'kid222222'); } });
  try {
    await ready(page);
    const titles = await hubTitles(page);
    assert.ok(titles.includes('Aprende la Hora'));
    assert.ok(titles.includes('MathMaster'));
    assert.ok(!titles.includes('Crucigrama'), 'adult/teen game hidden for a child');
    assert.ok(!titles.includes('Irregular Verbs'));
    assert.equal(await page.locator('#hub-foryou').isVisible(), false);
    assert.equal(await page.locator('#f-aud').isVisible(), false);
    assert.ok(await noHScroll(page));
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-HUB-GUEST: a visitor who is not signed in sees the whole catalogue as before', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', locale: 'es-ES' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('https://www.gstatic.com/firebasejs/**', r => r.fulfill({
    contentType: 'text/javascript', body: /app-compat/.test(r.request().url()) ? FIREBASE_STUB : '' }));
  await page.addInitScript(() => { window.__SEED = { docs: {} }; localStorage.setItem('games_hub_language', 'es-ES'); });
  try {
    await page.goto(base + '/index.html', { waitUntil: 'load' });
    const titles = await hubTitles(page);
    assert.ok(titles.includes('Aprende la Hora') && titles.includes('Crucigrama'));
    assert.equal(await page.locator('#hub-foryou').isVisible(), false);
    assert.equal(await page.locator('#platform-switch-btn').count(), 0);
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-PICKER-LANG: the picker texts exist in the six languages', async () => {
  for (const lang of ['es-ES', 'en-US', 'eu-ES', 'gl-ES', 'ca-ES', 'fr-FR']) {
    const { ctx, page, errors } = await open(family(), { init: `localStorage.setItem('games_hub_language', '${lang}')` });
    try {
      await page.waitForSelector('#pp-overlay .pp-tile', { timeout: 8000 });
      const title = await page.locator('#pp-title').innerText();
      assert.ok(title.length > 3 && title !== 'pickTitle', lang + ' ' + title);
      assert.ok(!/^(pick|pin)[A-Z]/.test(await page.locator('#pp-overlay').innerText()), lang + ' shows a raw key');
      assert.deepEqual(errors, []);
      if (lang === 'fr-FR') assert.equal(title, 'Qui joue ?');
    } finally { await ctx.close(); }
  }
});
