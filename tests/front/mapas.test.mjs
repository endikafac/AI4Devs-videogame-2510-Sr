import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const root = path.resolve(import.meta.dirname, '../..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const SHOTS = process.env.MAPAS_SHOTS || '';
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

const IGNORE = /favicon|Missing or insufficient permissions|unauthorized-domain|net::ERR|Failed to load resource|firestore\.googleapis|identitytoolkit|offline|WebChannel|manifest/i;
async function open({ width = 390, height = 800 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !IGNORE.test(m.text())) errors.push(m.text()); });
  await page.addInitScript(() => Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' }));
  await page.goto(base + '/mapas-EFC/index.html', { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelectorAll('.mp-mapcard').length === 17, null, { timeout: 8000 });
  return { ctx, page, errors };
}
const shot = (page, name) => SHOTS ? page.screenshot({ path: path.join(SHOTS, name + '.png') }) : null;
async function start(page, map, mode) {
  await page.click('.mp-mapcard[data-map="' + map + '"]');
  await page.click('.mp-modecard[data-mode="' + mode + '"]');
  await page.waitForFunction(m => Mapas._S.map && Mapas._S.map.def.id === m && document.getElementById('mp-loading').hidden && document.querySelectorAll('#mp-svg path').length > 3, map, { timeout: 8000 });
  await page.waitForTimeout(500);
}
// client point of an item (centre in svg coords) and whether it is really the top element there
async function targetPoint(page, id) {
  return page.evaluate(id => {
    const S = Mapas._S, it = S.map.items.find(i => i.id === id), svg = document.getElementById('mp-svg');
    const pt = svg.createSVGPoint(); pt.x = it.x; pt.y = it.y; const p = pt.matrixTransform(svg.getScreenCTM());
    const hit = document.elementFromPoint(p.x, p.y);
    const hid = hit && hit.dataset && hit.dataset.id;
    return { x: p.x, y: p.y, ok: hid === id, other: !!hid && hid !== id };
  }, id);
}
// rivers are thin: look for a point along the line that is really on top
async function riverPoint(page, id) {
  return page.evaluate(id => {
    const path = document.querySelector('path.mp-river[data-id="' + id + '"]'); if (!path) return null;
    const svg = document.getElementById('mp-svg'), ctm = svg.getScreenCTM(), len = path.getTotalLength(), box = svg.getBoundingClientRect();
    for (const f of [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8, 0.1, 0.9]) {
      const q = path.getPointAtLength(len * f), pt = svg.createSVGPoint(); pt.x = q.x; pt.y = q.y; const p = pt.matrixTransform(ctm);
      if (p.x < box.x + 60 || p.y < box.y + 10 || p.x > box.right - 60 || p.y > box.bottom - 10) continue;
      const h = document.elementFromPoint(p.x, p.y); if (h && h.dataset && h.dataset.id === id) return { x: p.x, y: p.y };
    }
    return null;
  }, id);
}
async function tapItem(page, id) {
  await page.waitForFunction(() => !Mapas._S.raf, null, { timeout: 5000 });
  const rp = await riverPoint(page, id); if (rp) { await page.mouse.click(rp.x, rp.y); return true; }
  let p = await targetPoint(page, id); // wait until the item stops moving on screen
  for (let n = 0; n < 40; n++) { await page.waitForTimeout(60); const q = await targetPoint(page, id); const still = Math.abs(q.x - p.x) < 0.5 && Math.abs(q.y - p.y) < 0.5; p = q; if (still) break; }
  if (!p.other) { await page.mouse.click(p.x, p.y); return p.ok; } // micro-states are dots without hit testing: the game snaps to the nearest dot
  // centroid fell outside the shape or under a neighbour: click the middle of its bounding box
  const b = await page.evaluate(id => { const r = document.querySelector('[data-id="' + id + '"]').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, id);
  await page.mouse.click(b.x, b.y);
  return false;
}
const runState = page => page.evaluate(() => { const r = Mapas._S.run; return r && { id: r.id, i: r.i, right: r.right, wrong: r.wrong, type: r.type, locked: r.locked }; });
const advanced = async (page, k) => {
  // a first miss on a tiny shape (Ceuta, Melilla...) is allowed: the second tap, or the second miss, concludes the question
  await page.waitForSelector('#mp-nextrow:not([hidden])', { timeout: 2500 }).catch(async () => { const r = await runState(page); if (r && !r.locked) await tapItem(page, r.id); await page.waitForSelector('#mp-nextrow:not([hidden])', { timeout: 6000 }); }); await page.waitForSelector('#mp-learn:not([hidden])'); await page.click('#mp-next'); await page.waitForFunction(i => { const r = Mapas._S.run; return !r || r.i > i; }, k, { timeout: 5000 }); };

test('F-MAPAS home lists 17 maps, no console errors', async () => {
  const { ctx, page, errors } = await open();
  try {
    assert.equal(await page.locator('.mp-mapcard').count(), 17);
    await shot(page, 'home');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-MAPAS world find mode: 10 questions reach the end screen and progress is stored', async () => {
  const { ctx, page, errors } = await open({ width: 1000, height: 800 });
  try {
    await start(page, 'world', 'find');
    await shot(page, 'world-find');
    for (let k = 0; k < 10; k++) {
      const r = await runState(page); assert.ok(r && r.id, 'question ' + k);
      assert.equal(r.type, 'find');
      await page.evaluate(id => Mapas._focus(id, 5), r.id); // neighbours overlap at world scale: zoom onto the target like a player would
      await tapItem(page, r.id);
      await advanced(page, k);
    }
    await page.waitForSelector('#mp-end:not([hidden])', { timeout: 5000 });
    const stored = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('mapas_world_guest') || '{}')).length);
    assert.equal(stored, 10);
    await shot(page, 'world-end');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-MAPAS wrong taps: two misses reveal the answer and record a failure', async () => {
  const { ctx, page, errors } = await open({ width: 1100, height: 800 });
  try {
    await start(page, 'EU', 'find');
    await shot(page, 'europe-find-desktop');
    const r = await runState(page);
    const other = await page.evaluate(id => { const S = Mapas._S, svg = document.getElementById('mp-svg'); return S.map.items.find(i => { if (i.id === id || i.a < 500) return false; const pt = svg.createSVGPoint(); pt.x = i.x; pt.y = i.y; const p = pt.matrixTransform(svg.getScreenCTM()); const h = document.elementFromPoint(p.x, p.y); return h && h.dataset && h.dataset.id === i.id; }).id; }, r.id);
    await tapItem(page, other);
    await page.waitForTimeout(200);
    assert.equal((await runState(page)).locked, false, 'first miss keeps trying');
    await tapItem(page, other);
    await page.waitForFunction(() => Mapas._S.run.locked, null, { timeout: 3000 });
    await page.waitForSelector('#mp-nextrow:not([hidden])');
    assert.equal((await runState(page)).wrong, 1);
    await page.waitForTimeout(600);
    await shot(page, 'europe-find-reveal');
    await page.click('#mp-next');
    assert.equal((await runState(page)).i, 1);
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-MAPAS name mode: options and correct answer; capitals mode both directions', async () => {
  const { ctx, page, errors } = await open();
  try {
    await start(page, 'SA', 'name');
    await page.waitForSelector('.mp-opt');
    assert.equal(await page.locator('.mp-opt').count(), 4);
    assert.equal(await page.locator('.mp-it.tgt').count(), 1);
    await page.waitForTimeout(600);
    await shot(page, 'sa-name');
    const id = (await runState(page)).id;
    await page.click('.mp-opt[data-opt="' + id + '"]');
    await page.waitForFunction(() => Mapas._S.run.right === 1);
    await page.click('#mp-quit');
    await start(page, 'es', 'cap');
    for (let k = 0; k < 4; k++) {
      const r = await runState(page);
      if (r.type === 'capName') await page.click('.mp-opt[data-opt="' + r.id + '"]');
      else await tapItem(page, r.id);
      await advanced(page, k);
    }
    await shot(page, 'es-cap');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-MAPAS explore: country card, region card, river card, other maps render', async () => {
  const { ctx, page, errors } = await open({ width: 800, height: 800 });
  try {
    await start(page, 'EU', 'explore');
    await tapItem(page, 'FR');
    await page.waitForSelector('#mp-info:not([hidden])');
    const info = await page.textContent('#mp-info');
    assert.match(info, /Francia/);
    assert.match(info, /Par[ií]s/);
    await page.waitForTimeout(900);
    await shot(page, 'europe-explore-fr');
    await page.click('#mp-quit');
    await start(page, 'es', 'explore'); await tapItem(page, 'Andalucía');
    assert.match(await page.textContent('#mp-info'), /Sevilla/);
    await page.waitForTimeout(900);
    await shot(page, 'spain-explore');
    await page.click('#mp-quit');
    await start(page, 'rives', 'explore'); await tapItem(page, 'tajo');
    assert.match(await page.textContent('#mp-info'), /Castilla-La Mancha|Extremadura|Madrid/);
    await page.waitForTimeout(900);
    await shot(page, 'rivers-spain');
    await page.click('#mp-quit');
    await start(page, 'rivw', 'name');
    await page.waitForTimeout(900);
    await shot(page, 'rivers-world-name');
    await page.click('#mp-quit');
    await start(page, 'prov', 'find'); await shot(page, 'prov-find');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-MAPAS gestures: wheel zooms, dragging pans, home resets', async () => {
  const { ctx, page, errors } = await open({ width: 1000, height: 800 });
  try {
    await start(page, 'world', 'explore');
    const box = await page.locator('#mp-svg').boundingBox();
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    const w0 = await page.evaluate(() => Mapas._S.cam.w);
    await page.mouse.move(cx, cy); await page.mouse.wheel(0, -300); await page.waitForTimeout(200);
    const w1 = await page.evaluate(() => Mapas._S.cam.w);
    assert.ok(w1 < w0, 'wheel zooms in: ' + w0 + ' -> ' + w1);
    const x0 = await page.evaluate(() => Mapas._S.cam.x);
    await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(cx + 120, cy + 10, { steps: 6 }); await page.mouse.up();
    const x1 = await page.evaluate(() => Mapas._S.cam.x);
    assert.ok(x1 < x0, 'drag pans');
    await page.click('#mp-zhome'); await page.waitForTimeout(900);
    const w2 = await page.evaluate(() => Mapas._S.cam.w);
    assert.ok(w2 > w1, 'home resets zoom');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-MAPAS data: every shape can be tapped at its label point (at least 92%)', async () => {
  const { ctx, page, errors } = await open({ width: 1000, height: 800 });
  try {
    for (const map of ['world', 'EU', 'AF', 'AS', 'NA', 'SA', 'OC', 'es', 'prov']) {
      await start(page, map, 'explore');
      const r = await page.evaluate(() => {
        const S = Mapas._S, svg = document.getElementById('mp-svg'), sc = svg.getBoundingClientRect().width / S.cam.w;
        const miss = []; let n = 0;
        S.map.items.forEach(i => {
          if (i.a * sc * sc < 14) return; n++;
          const pt = svg.createSVGPoint(); pt.x = i.x; pt.y = i.y; const p = pt.matrixTransform(svg.getScreenCTM());
          const b = svg.getBoundingClientRect(); if (p.x < b.x || p.y < b.y || p.x > b.right || p.y > b.bottom) { n--; return; }
          const h = document.elementFromPoint(p.x, p.y);
          if (!(h && h.dataset && h.dataset.id === i.id)) miss.push(i.id);
        });
        return { n, miss };
      });
      assert.ok(r.n >= 3, map + ' has tappable shapes');
      assert.ok(r.miss.length <= Math.ceil(r.n * 0.08), map + ' misses: ' + r.miss.join(','));
      await page.click('#mp-quit');
    }
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-MAPAS mountains and rich cards: height, river length, province facts, learn card after an answer', async () => {
  const { ctx, page, errors } = await open({ width: 1000, height: 800 });
  try {
    await start(page, 'mont', 'explore');
    await page.waitForTimeout(300);
    await page.evaluate(() => { const S = Mapas._S; const id = S.map.items.find(i => /everest/.test(i.id)).id; window.__id = id; });
    await page.evaluate(() => Mapas._focus(window.__id, 8)); await page.waitForTimeout(800);
    await tapItem(page, await page.evaluate(() => window.__id));
    await page.waitForSelector('#mp-info:not([hidden])');
    const m = await page.textContent('#mp-info');
    assert.match(m, /Everest/); assert.match(m, /8\.8\d\d m|8,8\d\d m/); assert.match(m, /Sabías que/);
    await page.waitForTimeout(900); await shot(page, 'mountains-world');
    await page.click('#mp-quit');
    await start(page, 'rivw', 'explore');
    await page.evaluate(() => Mapas._focus('nile', 1.5)); await page.waitForTimeout(900);
    await tapItem(page, 'nile');
    const r = await page.textContent('#mp-info');
    assert.match(r, /Longitud/); assert.match(r, /km/); assert.match(r, /Egipto/);
    await page.waitForTimeout(900); await shot(page, 'river-nile');
    await page.click('#mp-quit');
    await start(page, 'prov', 'explore'); await tapItem(page, 'Sevilla');
    const p = await page.textContent('#mp-info');
    assert.match(p, /Andaluc/); assert.match(p, /Población/);
    await page.click('#mp-quit');
    await start(page, 'montes', 'find');
    await shot(page, 'mountains-spain-find');
    const q = await runState(page); await page.evaluate(id => Mapas._focus(id, 6), q.id); await tapItem(page, q.id);
    await page.waitForSelector('#mp-learn:not([hidden])');
    assert.ok((await page.textContent('#mp-learn')).length > 30, 'learn card has content');
    await shot(page, 'learn-card');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-MAPAS review mode: disabled when nothing is due, then lists weak items after a mistake', async () => {
  const { ctx, page, errors } = await open({ width: 390, height: 844 });
  try {
    await page.click('.mp-mapcard[data-map="es"]');
    assert.equal(await page.locator('.mp-modecard[data-mode="review"]').isDisabled(), true);
    await page.click('#mp-setupback');
    await page.evaluate(() => localStorage.setItem('mapas_es_guest', JSON.stringify({ 'Galicia': { o: 0, f: 1, s: 0, t: Date.now() }, 'Aragón': { o: 1, f: 0, s: 1, t: Date.now() } })));
    await page.reload(); await page.waitForSelector('.mp-mapcard');
    assert.match(await page.textContent('#mp-sum'), /2 por repasar/);
    await page.click('.mp-mapcard[data-map="es"]');
    assert.equal(await page.locator('.mp-modecard[data-mode="review"]').isDisabled(), false);
    await page.click('.mp-modecard[data-mode="review"]'); await page.waitForSelector('#mp-svg path'); await page.waitForTimeout(500);
    const qs = await page.evaluate(() => Mapas._S.run.qs.slice().sort());
    assert.deepEqual(qs, ['Aragón', 'Galicia']);
    await shot(page, 'review-mobile');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-MAPAS flags, timer chip, search and Euskadi maps', async () => {
  const { ctx, page, errors } = await open({ width: 390, height: 844 });
  try {
    // flags mode on a continent
    await start(page, 'SA', 'flag');
    const r = await runState(page);
    assert.match(r.type, /^flag(Find|Name)$/);
    assert.ok((await page.textContent('#mp-prompt')).length > 10);
    await shot(page, 'flags-mobile');
    if (r.type === 'flagName') await page.click('.mp-opt[data-opt="' + r.id + '"]'); else await tapItem(page, r.id);
    await page.waitForSelector('#mp-learn:not([hidden])');
    await page.click('#mp-quit');
    // timed chip persists and shows the bar
    await page.click('.mp-mapcard[data-map="EU"]');
    await page.click('.mp-chip.timed');
    await page.click('.mp-modecard[data-mode="find"]'); await page.waitForSelector('#mp-svg path');
    await page.waitForSelector('#mp-timer:not([hidden])');
    await shot(page, 'timed-mobile');
    await page.click('#mp-quit');
    await page.click('.mp-mapcard[data-map="EU"]'); await page.click('.mp-chip.timed'); await page.click('#mp-setupback');
    // search in explore
    await start(page, 'es', 'explore');
    await page.fill('#mp-search', 'gali');
    await page.waitForSelector('.mp-sugg .sg');
    await page.click('.mp-sugg .sg');
    await page.waitForSelector('#mp-info:not([hidden])');
    assert.match(await page.textContent('#mp-info'), /Santiago de Compostela/);
    await page.click('#mp-quit');
    // Euskadi: territories with capital mode data, towns, rivers, mountains
    await start(page, 'eus', 'explore'); await page.waitForTimeout(500); await shot(page, 'eus-territories');
    await page.click('#mp-quit');
    await start(page, 'eustown', 'explore'); await page.waitForTimeout(500);
    const n = await page.evaluate(() => Mapas._S.map.items.length); assert.ok(n >= 20, 'towns ' + n);
    await shot(page, 'eus-towns');
    await page.click('#mp-quit');
    await start(page, 'eusriv', 'find'); assert.ok((await page.evaluate(() => Mapas._S.map.items.length)) >= 8);
    await page.click('#mp-quit');
    await start(page, 'eusmont', 'name'); await page.waitForSelector('.mp-opt');
    await shot(page, 'eus-mount-name');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});
