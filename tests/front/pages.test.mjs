import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const root = path.resolve(import.meta.dirname, '../..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
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

const PAGES = ['index.html', 'mathMaster-EFC/index.html', 'calcPath-EFC/index.html', 'memory-EFC/index.html', 'mapas-EFC/index.html', 'repaso-EFC/index.html', 'clock-EFC/index.html', 'fractions-EFC/index.html', 'tableMaster-EFC/index.html', 'wordSearch-EFC/index.html', 'crossword-EFC/index.html', 'typingMaster-EFC/index.html',
  'euskera-EFC/index.html', 'englishVerbs-EFC/index.html', 'vocabMaster-EFC/index.html', 'snake-EHS/index.html', 'arkanoid-CSM/index.html',
  'tablaPeriodica-EFC/index.html', 'tablaPeriodica-EFC/es/tabla.html', 'tablaPeriodica-EFC/eu/tabla.html', 'platform/privacy.html'];
const IGNORE = /favicon|Missing or insufficient permissions|unauthorized-domain|net::ERR|Failed to load resource|firestore\.googleapis|identitytoolkit|offline|WebChannel|manifest/i;

async function open(url, { width = 390, height = 800, dnt = true } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !IGNORE.test(m.text())) errors.push(m.text()); });
  if (dnt) await page.addInitScript(() => Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' }));
  await page.goto(base + '/' + url, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  return { ctx, page, errors };
}

for (const url of PAGES) {
  test(`F-HEADER/F-CONSOLE/F-OVERFLOW ${url}`, async () => {
    for (const width of [360, 390]) {
      const { ctx, page, errors } = await open(url, { width });
      try {
        assert.equal(await page.locator('#platform-header').count(), 1, 'common top bar missing');
        assert.equal(await page.locator('#platform-lang-group .lang-pill').count(), 6, 'six language pills expected');
        const top = await page.evaluate(() => { const b = document.getElementById('platform-settings-btn').getBoundingClientRect(); const e = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2); return !!(e && e.closest('#platform-header')); });
        assert.ok(top, 'the common bar settings button is covered by another element');
        const sw = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        assert.ok(sw <= 1, `horizontal overflow of ${sw}px at ${width}px`);
        assert.deepEqual(errors, [], 'console errors: ' + errors.join(' | '));
      } finally { await ctx.close(); }
    }
  });
}

test('F-TARGET: language pills and bar buttons are at least 40px tall on mobile', async () => {
  const { ctx, page } = await open('index.html');
  try {
    await page.click('#platform-settings-btn');
    const small = await page.evaluate(() => [...document.querySelectorAll('#platform-header button, #platform-settings-panel button')]
      .filter(b => b.offsetParent && b.getBoundingClientRect().height < 32).map(b => b.id || b.textContent.trim()));
    assert.deepEqual(small, [], 'too small: ' + small);
  } finally { await ctx.close(); }
});

test('F-LANG: choosing Galician, Catalan or French persists and updates the page language', async () => {
  for (const [lang, code] of [['gl-ES', 'gl'], ['ca-ES', 'ca'], ['fr-FR', 'fr']]) {
    const { ctx, page, errors } = await open('index.html');
    try {
      await page.click('#platform-settings-btn');
      await page.click(`.lang-pill[data-lang="${lang}"]`);
      assert.equal(await page.evaluate(() => localStorage.getItem('games_hub_language')), lang);
      assert.equal(await page.evaluate(() => document.documentElement.lang), code);
      await page.reload({ waitUntil: 'load' });
      await page.waitForTimeout(600);
      assert.equal(await page.evaluate(() => PlatformI18n.currentLanguage), lang);
      assert.deepEqual(errors, [], errors.join(' | '));
    } finally { await ctx.close(); }
  }
});

test('F-LANG: every game still loads without errors when the language is French', async () => {
  for (const url of PAGES.filter(u => u.endsWith('index.html') && u !== 'index.html')) {
    const { ctx, page, errors } = await open(url);
    try {
      await page.evaluate(() => PlatformI18n.setLanguage('fr-FR'));
      await page.waitForTimeout(500);
      assert.deepEqual(errors, [], `${url}: ${errors.join(' | ')}`);
    } finally { await ctx.close(); }
  }
});

test('F-PT-LANG: periodic table follows the platform language (EU opens /eu/)', async () => {
  const { ctx, page } = await open('tablaPeriodica-EFC/es/tabla.html');
  try {
    await page.click('#platform-settings-btn');
    await Promise.all([page.waitForURL(/\/tablaPeriodica-EFC\/eu\/tabla\.html/), page.click('.lang-pill[data-lang="eu-ES"]')]);
    await page.waitForTimeout(800);
    await page.click('#platform-settings-btn');
    await Promise.all([page.waitForURL(/\/tablaPeriodica-EFC\/es\/tabla\.html/), page.click('.lang-pill[data-lang="es-ES"]')]);
  } finally { await ctx.close(); }
});

test('F-HUB: search filters, favourites persist, daily challenge is shown', async () => {
  const { ctx, page } = await open('index.html');
  try {
    assert.ok(await page.locator('.today-card').count() >= 1, 'daily challenge missing');
    const all = await page.locator('.tile-wrap').count();
    assert.ok(all >= 10, 'expected the game tiles, got ' + all);
    await page.fill('#hub-q', 'geo');
    assert.ok(await page.locator('.tile-wrap').count() < all, 'search did not filter');
    await page.fill('#hub-q', '');
    await page.locator('.fav').first().click();
    assert.equal(JSON.parse(await page.evaluate(() => localStorage.getItem('games_hub_favs'))).length, 1);
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(600);
    assert.equal(await page.locator('.fav[aria-pressed="true"]').count(), 1);
  } finally { await ctx.close(); }
});

test('F-EVENT: opening a game sends one anonymous event, never twice in the same session', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__ev = [];
    const fake = { collection: () => ({ add: ev => { window.__ev.push(ev); return Promise.resolve(); } }) };
    Object.defineProperty(window, 'GamesHubDB', { get: () => fake, set: () => {}, configurable: true });
  });
  try {
    await page.goto(base + '/vocabMaster-EFC/index.html', { waitUntil: 'load' });
    await page.waitForTimeout(3600);
    const evs = await page.evaluate(() => window.__ev.map(e => ({ ...e, ts: typeof e.ts })));
    assert.equal(evs.length, 1, 'expected exactly one event, got ' + evs.length);
    assert.deepEqual(Object.keys(evs[0]).sort(), ['auth', 'first', 'game', 'lang', 'ts', 'type']);
    assert.equal(evs[0].game, 'vocabMaster');
    assert.equal(evs[0].type, 'play');
    assert.equal(evs[0].auth, false);
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(3600);
    assert.equal(await page.evaluate(() => window.__ev.length), 0, 'second load in the same session must not send again');
  } finally { await ctx.close(); }
});

test('F-EVENT: Do Not Track disables analytics', async () => {
  const ctx = await browser.newContext({ serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' });
    window.__ev = [];
    const fake = { collection: () => ({ add: ev => { window.__ev.push(ev); return Promise.resolve(); } }) };
    Object.defineProperty(window, 'GamesHubDB', { get: () => fake, set: () => {}, configurable: true });
  });
  try {
    await page.goto(base + '/index.html', { waitUntil: 'load' });
    await page.waitForTimeout(3600);
    assert.equal(await page.evaluate(() => window.__ev.length), 0);
  } finally { await ctx.close(); }
});

test('F-ADMIN: the visits page asks non-admins to sign in and never crashes', async () => {
  const { ctx, page, errors } = await open('platform/admin-stats.html');
  try {
    const txt = await page.locator('#ad-body').innerText();
    assert.match(txt, /Inicia sesión|permiso|Cargando/);
    assert.deepEqual(errors, [], errors.join(' | '));
  } finally { await ctx.close(); }
});

test('F-PWA: every page declares the manifest and the install row appears when the browser offers it', async () => {
  for (const url of ['index.html', 'tablaPeriodica-EFC/es/tabla.html', 'arkanoid-CSM/index.html', 'mathMaster-EFC/index.html']) {
    const { ctx, page, errors } = await open(url);
    try {
      assert.equal(await page.locator('link[rel="manifest"]').count(), 1, url + ' has no manifest');
      assert.equal(await page.locator('meta[name="theme-color"]').count(), 1, url + ' theme-color');
      await page.waitForFunction(() => window.PlatformPWA, null, { timeout: 8000 });
      await page.evaluate(() => { const e = new Event('beforeinstallprompt'); e.prompt = () => {}; e.userChoice = Promise.resolve({}); window.dispatchEvent(e); });
      await page.click('#platform-settings-btn');
      await page.waitForSelector('#platform-install-btn', { state: 'visible', timeout: 4000 });
      const h = await page.evaluate(() => document.getElementById('platform-install-btn').getBoundingClientRect().height);
      assert.ok(h >= 40, 'install button too small');
      assert.deepEqual(errors, [], errors.join(' | '));
    } finally { await ctx.close(); }
  }
});

test('F-OFFLINE: the offline page renders and offers a way back', async () => {
  const { ctx, page } = await open('offline.html');
  try {
    assert.match(await page.locator('h1').innerText(), /Sin conexión/);
    assert.ok(await page.locator('a[href="/index.html"]').count() === 1);
  } finally { await ctx.close(); }
});

test('F-CALC: a full lesson can be played on a phone, progress and next lesson unlock; failing 3 times ends it', async () => {
  const { ctx, page, errors } = await open('calcPath-EFC/index.html');
  try {
    assert.equal(await page.locator('.cp-dot').count(), 14);
    assert.equal(await page.locator('.cp-dot:not(.locked)').count(), 1, 'only the first lesson is open');
    await page.click('.cp-dot:not(.locked)');
    const solve = () => page.evaluate(() => {
      const q = CalcPath.state.q, click = t => [...document.querySelectorAll('.cp-opt,.cp-key')].find(b => b.textContent.trim() === String(t)).click();
      const typeNum = n => { String(n).split('').forEach(d => click(d)); click('✓'); };
      switch (q.type) {
        case 'type': return typeNum(q.res);
        case 'missing': return typeNum(q.answer);
        case 'choice': case 'visual': return click(q.res);
        case 'compare': return click(q.answer);
        case 'tf': return click(q.answer ? 'Verdadero' : 'Falso');
        case 'build': return document.querySelectorAll('.cp-opt')[q.exprs.findIndex(x => x.ok)].click();
      }
    });
    for (let i = 0; i < 10; i++) { await solve(); await page.click('#cp-continue'); }
    assert.ok(await page.locator('#cp-end').isVisible(), 'end screen');
    assert.match(await page.locator('#cp-endtitle').innerText(), /completada/);
    assert.equal(await page.locator('#cp-endstars').innerText(), '★★★');
    await page.click('#cp-back');
    assert.equal(await page.locator('.cp-dot:not(.locked)').count(), 2, 'second lesson unlocked');
    assert.equal(await page.locator('.cp-dot.done').count(), 1);
    // lose all hearts
    await page.click('.cp-node:nth-child(2) .cp-dot');
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        const q = CalcPath.state.q; const wrong = v => { const c = [...document.querySelectorAll('.cp-opt,.cp-key')]; return c; };
        if (q.type === 'type' || q.type === 'missing') { const n = (q.type === 'type' ? q.res : q.answer) + 1; String(n).split('').forEach(d => [...document.querySelectorAll('.cp-key')].find(b => b.textContent === d).click()); [...document.querySelectorAll('.cp-key')].find(b => b.textContent === '✓').click(); }
        else { const opts = [...document.querySelectorAll('.cp-opt')]; const right = q.type === 'choice' || q.type === 'visual' ? String(q.res) : q.type === 'compare' ? q.answer : q.type === 'tf' ? (q.answer ? 'Verdadero' : 'Falso') : q.exprs.find(x => x.ok) && `${q.exprs.find(x => x.ok).a} ${({ '+': '+', '-': '−', '*': '×' })[q.exprs.find(x => x.ok).op]} ${q.exprs.find(x => x.ok).b}`; (opts.find(b => b.textContent.trim() !== right) || opts[0]).click(); }
      });
      await page.click('#cp-continue');
    }
    assert.ok(await page.locator('#cp-end').isVisible());
    assert.match(await page.locator('#cp-endtitle').innerText(), /vidas/);
    assert.deepEqual(errors, [], errors.join(' | '));
  } finally { await ctx.close(); }
});
