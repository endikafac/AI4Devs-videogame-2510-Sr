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

// Minimal in-memory stand-in for the Firebase compat SDK, so the real platform code runs signed in without a network.
const FIREBASE_STUB = `
(function () {
  var seed = window.__SEED || { docs: {} };
  var store = new Map(Object.entries(seed.docs || {}));
  var user = seed.user;
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
      get: function () { return Promise.resolve(snapOf(p)); },
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
const MYPROFILE = { uid: ME.uid, username: 'Luna', nicknameKey: 'luna', avatar: '🦊', photoURL: null, xp: 0, totalPoints: 0, level: 0,
  consent: { version: '2026-11', guardian: true } };
const FUTURE = Date.now() + 20 * 86400000;

const IGNORE = /favicon|Missing or insufficient permissions|unauthorized-domain|net::ERR|Failed to load resource|firestore\.googleapis|identitytoolkit|offline|WebChannel|manifest|gstatic/i;
async function open(seed) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !IGNORE.test(m.text())) errors.push(m.text()); });
  await page.route('https://www.gstatic.com/firebasejs/**', r => r.fulfill({
    contentType: 'text/javascript', body: /app-compat/.test(r.request().url()) ? FIREBASE_STUB : '' }));
  await page.addInitScript(s => { window.__SEED = s; try { localStorage.setItem('games_hub_language', 'es-ES'); } catch (e) {} }, seed);
  await page.addInitScript(() => Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' }));
  await page.goto(base + '/index.html', { waitUntil: 'load' });
  return { ctx, page, errors };
}
const baseSeed = (docs = {}) => ({ user: ME, docs: { ['users/' + ME.uid]: MYPROFILE, ...docs } });

async function openFamily(page) {
  await page.waitForFunction(() => typeof PlatformHeader !== 'undefined' && PlatformHeader._userProfile, null, { timeout: 8000 });
  await page.click('#platform-user-btn');
  await page.click('#pd-players');
  await page.waitForSelector('#pid-family', { timeout: 5000 });
  await page.click('#pid-family');
  await page.waitForSelector('#pid-fam-email', { timeout: 5000 });
}

test('F-FAMILY: the Familia screen opens from the identity UI without console errors', async () => {
  const { ctx, page, errors } = await open(baseSeed());
  try {
    await openFamily(page);
    assert.equal(await page.locator('.pid-modal h2').innerText(), 'Familia');
    // 48px touch targets and no horizontal overflow at 390px
    for (const sel of ['#pid-fam-email', '#pid-fam-role', '#pid-fam-invite', '#pid-fam-back']) {
      const box = await page.locator(sel).boundingBox();
      assert.ok(box && box.height >= 47.5, sel + ' height ' + (box && box.height));
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'horizontal scroll');
    // back returns to the who-plays list
    await page.click('#pid-fam-back');
    await page.waitForSelector('#pid-family');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-FAMILY: the invite form validates the e-mail and creates the invitation', async () => {
  const { ctx, page, errors } = await open(baseSeed());
  try {
    await openFamily(page);
    const err = () => page.locator('#pid-error').innerText();
    await page.fill('#pid-fam-email', 'no-es-un-correo');
    await page.click('#pid-fam-invite');
    assert.match(await err(), /correo válido/);
    assert.equal(await page.evaluate(() => Array.from(window.__store.keys()).filter(k => k.startsWith('invites/')).length), 0);

    await page.fill('#pid-fam-email', ME.email);
    await page.click('#pid-fam-invite');
    assert.match(await err(), /propio correo/);

    await page.fill('#pid-fam-email', '  Abuela@Example.com ');
    await page.selectOption('#pid-fam-role', 'view');
    await page.click('#pid-fam-invite');
    await page.waitForSelector('#pid-fam-copy', { timeout: 5000 });
    const inv = await page.evaluate(() => Array.from(window.__store.entries()).filter(([k]) => k.startsWith('invites/')).map(([, v]) => v));
    assert.equal(inv.length, 1);
    assert.equal(inv[0].email, 'abuela@example.com');
    assert.equal(inv[0].role, 'view');
    assert.equal(inv[0].ownerUid, ME.uid);
    assert.equal(inv[0].ownerName, 'Luna');
    const msg = await page.locator('.pid-fam-msg').innerText();
    assert.match(msg, /Solo ver/);
    assert.match(msg, /abuela@example\.com/);
    assert.match(msg, /https?:\/\//);
    assert.ok(!/[—–]/.test(msg));
    // the pending invitation is listed with a cancel button
    assert.ok(await page.locator('.pid-fam-row', { hasText: 'abuela@example.com' }).count());
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-FAMILY: a pending invitation shows what is shared; accepting adds the family and its children to the selector', async () => {
  const OWNER = 'fam0000001';
  const { ctx, page, errors } = await open(baseSeed({
    ['invites/i1']: { ownerUid: OWNER, ownerName: 'Marta <b>X</b>', email: ME.email, role: 'edit', expires: FUTURE },
    ['users/' + OWNER + '/players/kid123abc']: { username: 'Pipo', avatar: '🐼', totalPoints: 42 }
  }));
  try {
    await page.waitForFunction(() => typeof PlatformHeader !== 'undefined' && PlatformHeader._userProfile, null, { timeout: 8000 });
    await page.evaluate(() => PlatformIdentity.showPlayers(PlatformAuth.currentUser.uid, PlatformHeader._userProfile));
    const card = page.locator('.pid-fam-card').first();
    await card.waitFor({ timeout: 5000 });
    const text = await card.innerText();
    assert.match(text, /Marta <b>X<\/b>/, 'user text is shown literally, never as HTML');
    assert.match(text, /Se comparte/);
    assert.match(text, /No se comparte/);
    assert.equal(await page.locator('.pid-fam-card b').count(), 0);
    await page.click('.pid-fam-card .pid-btn:not(.ghost)');
    await page.waitForSelector('.pid-fam-head', { timeout: 5000 });
    assert.match(await page.locator('.pid-fam-head').innerText(), /Familia de Marta/);
    assert.ok(await page.locator('.pid-player', { hasText: 'Pipo' }).count());
    const keys = await page.evaluate(() => Array.from(window.__store.keys()));
    assert.ok(keys.includes('users/' + OWNER + '/guardians/' + ME.uid));
    assert.ok(keys.includes('users/' + ME.uid + '/memberships/' + OWNER));
    assert.ok(!keys.includes('invites/i1'));
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});
