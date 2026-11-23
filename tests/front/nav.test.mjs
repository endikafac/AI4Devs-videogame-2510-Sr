import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const root = path.resolve(import.meta.dirname, '../..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
let server, base, browser;
const hits = {};
let delayHtml = 0;

before(async () => {
  server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    hits[p] = (hits[p] || 0) + 1;
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(root, p);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nf'); }
    const send = () => { res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-cache' }); fs.createReadStream(f).pipe(res); };
    if (delayHtml && p.endsWith('.html') && p !== '/index.html') setTimeout(send, delayHtml); else send();
  });
  await new Promise(r => server.listen(0, r));
  base = 'http://localhost:' + server.address().port;
  browser = await chromium.launch({ channel: 'chrome', headless: true });
});
after(async () => { await browser?.close(); server?.close(); });

const IGNORE = /favicon|Missing or insufficient permissions|unauthorized-domain|net::ERR|Failed to load resource|firestore\.googleapis|identitytoolkit|offline|WebChannel|google|gstatic/i;
async function open(sw) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, serviceWorkers: sw ? 'allow' : 'block', locale: 'es-ES' });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !IGNORE.test(m.text())) errors.push(m.text()); });
  return { ctx, page, errors };
}

test('F-NAV: every shell page loads nav.js first and the splash goes away once loaded', async () => {
  const { ctx, page, errors } = await open(false);
  try {
    const pages = ['/index.html', '/mapas-EFC/index.html', '/calcPath-EFC/index.html', '/vocabMaster-EFC/index.html', '/readingCoach-EFC/index.html', '/clock-EFC/index.html'];
    for (const p of pages) {
      await page.goto(base + p, { waitUntil: 'load' });
      await page.waitForFunction(() => { const n = document.getElementById('gh-nav'); return !n || n.hidden || n.classList.contains('gh-out'); }, null, { timeout: 7000 });
      assert.equal(await page.evaluate(() => typeof window.GHNav), 'object', p + ' has nav.js');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, p + ' no horizontal scroll');
    }
    assert.deepEqual(errors, [], errors.join(' | '));
  } finally { await ctx.close(); }
});

test('F-NAV: tapping a link shows the splash with the icon at once and a second tap does not navigate twice', async () => {
  const { ctx, page, errors } = await open(false);
  try {
    delayHtml = 900;
    await page.goto(base + '/index.html', { waitUntil: 'load' });
    await page.waitForFunction(() => { const n = document.getElementById('gh-nav'); return !n || n.hidden || n.classList.contains('gh-out'); });
    await page.waitForSelector('a[href*="calcPath-EFC"]', { state: 'attached', timeout: 8000 });
    hits['/calcPath-EFC/index.html'] = 0;
    // three quick taps in one task, as an impatient child would do; inspect in the same task
    const st = await page.evaluate(() => {
      const a = document.querySelector('a[href*="calcPath-EFC"]'); a.click(); a.click(); a.click();
      const n = document.getElementById('gh-nav'); const e = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
      return { shown: !!n && !n.hidden, img: !!n && !!n.querySelector('img[src*="icon-192"]'), text: n && n.textContent, covered: !!e && !!e.closest('#gh-nav') };
    });
    assert.ok(st.shown && st.img, 'splash with the app icon is visible right after the tap');
    assert.match(st.text, /Cargando/);
    assert.ok(st.covered, 'the splash covers the page so nothing else can be tapped');
    await page.waitForURL(/calcPath-EFC/, { timeout: 8000 });
    assert.equal(hits['/calcPath-EFC/index.html'], 1, 'the page was requested once');
    assert.deepEqual(errors, [], errors.join(' | '));
  } finally { delayHtml = 0; await ctx.close(); }
});

test('F-NAV: a prevented or external link does not raise the splash', async () => {
  const { ctx, page } = await open(false);
  try {
    await page.goto(base + '/index.html', { waitUntil: 'load' });
    await page.waitForFunction(() => { const n = document.getElementById('gh-nav'); return !n || n.hidden || n.classList.contains('gh-out'); });
    const r = await page.evaluate(() => {
      const mk = (href, extra = {}) => { const a = document.createElement('a'); a.href = href; Object.assign(a, extra); a.textContent = 'x'; document.body.appendChild(a); return a; };
      const out = {};
      const ext = mk('https://example.com/'); ext.addEventListener('click', e => e.preventDefault()); ext.click();
      const hash = mk('#top'); hash.click();
      const blank = mk('/mapas-EFC/index.html', { target: '_blank' }); blank.addEventListener('click', e => e.preventDefault()); blank.click();
      const n = document.getElementById('gh-nav'); out.visible = !!n && !n.hidden && !n.classList.contains('gh-out');
      return out;
    });
    assert.equal(r.visible, false);
  } finally { await ctx.close(); }
});

test('F-NAV: the service worker answers from cache on the second visit and still refreshes in the background', async () => {
  const { ctx, page, errors } = await open(true);
  try {
    await page.goto(base + '/calcPath-EFC/index.html', { waitUntil: 'load' });
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload({ waitUntil: 'load' }); // now controlled by the worker
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await page.reload({ waitUntil: 'load' });
    const before = hits['/calcPath-EFC/game.js'] || 0;
    const t0 = Date.now(); delayHtml = 1500;
    await page.goto(base + '/calcPath-EFC/index.html', { waitUntil: 'load' });
    const ms = Date.now() - t0;
    assert.ok(ms < 1300, 'cached page opened without waiting for the slow network: ' + ms + ' ms');
    await page.waitForTimeout(2200); // background refresh happened
    assert.ok((hits['/calcPath-EFC/game.js'] || 0) > before, 'code is revalidated in the background');
    const keys = await page.evaluate(async () => (await caches.keys()).sort());
    assert.ok(keys.some(k => /static-v\d/.test(k)) && keys.some(k => /pages-v\d/.test(k)));
    // offline: the page still opens
    delayHtml = 0; await ctx.setOffline(true);
    await page.goto(base + '/calcPath-EFC/index.html', { waitUntil: 'load' });
    assert.ok(await page.locator('body').innerText().then(t => t.length > 10), 'offline page renders');
    assert.deepEqual(errors, [], errors.join(' | '));
  } finally { delayHtml = 0; await ctx.close(); }
});

test('F-NAV: version bump drops the old caches so a deploy is never masked', async () => {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.match(sw, /staleWhileRevalidate/);
  assert.match(sw, /.filter\(k => k !== STATIC_CACHE && k !== PAGE_CACHE\)/);
});
