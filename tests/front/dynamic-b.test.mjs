// Browser tests for the "dynamic questions" pass over: clock, fractions, memory, euskera, wordSearch, crossword, repaso.
// Zone labels, help button, sound toggle, Juice feedback, prominent "why", new interactive formats, mouse and keyboard.
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

const IGNORE = /favicon|Missing or insufficient permissions|unauthorized-domain|net::ERR|Failed to load resource|firestore\.googleapis|identitytoolkit|offline|WebChannel|manifest/i;
async function open(url, { width = 390, height = 844, init = null, lang = 'es-ES' } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block', locale: lang });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !IGNORE.test(m.text())) errors.push(m.text()); });
  await page.addInitScript(() => Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' }));
  if (init) await page.addInitScript(init);
  await page.goto(base + '/' + url, { waitUntil: 'load' });
  return { ctx, page, errors };
}
const noHScroll = async (page, what) => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), true, what + ': no horizontal scroll');
const visible = async (page, sel, what) => assert.equal(await page.locator(sel).first().isVisible(), true, what || sel + ' visible');
const tall = async (page, sel, what, min = 44) => {
  const boxes = await page.locator(sel).evaluateAll(els => els.filter(e => e.offsetParent).map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
  assert.ok(boxes.length > 0, what + ': found');
  for (const [w, h] of boxes) assert.ok(w >= min - 1 && h >= min - 1, `${what}: ${w}x${h} is under ${min}px`);
};
const fx = page => page.evaluate(() => document.querySelectorAll('.jx-float, .jx-ok, .jx-bad, .jx-pop, .jx-shake, .jx-piece').length);

// ───────────────────────── clock ─────────────────────────
const clockInit = () => localStorage.setItem('clock_prog_guest', JSON.stringify({ units: { hours: { stars: 1 }, hoursSet: { stars: 1 } }, learned: { hours: true, hoursSet: true, half: true }, xp: 0, streak: 0, last: '' }));

async function clockAnswer(page, correct) {
  const q = await page.evaluate(() => { const q = ClockLab.state.q; return { type: q.type, answer: q.answer, h: q.h, m: q.m, clocks: q.clocks && q.clocks.map(c => c.ok), options: q.options }; });
  if (q.type === 'read' || q.type === 'say' || q.type === 'hear') {
    const sel = correct ? `#ck-card .ck-opt[data-v="${q.answer}"]` : `#ck-card .ck-opt:not([data-v="${q.answer}"])`;
    await page.locator(sel).first().click();
  } else if (q.type === 'pick') {
    const idx = q.clocks.findIndex(ok => ok === correct); await page.locator('#ck-card .ck-clockbtn').nth(idx).click();
  } else if (q.type === 'type') {
    await page.fill('#ck-th', String(correct ? q.h : (q.h % 12) + 1)); await page.fill('#ck-tm', String(q.m)); await page.click('#ck-check');
  } else if (q.type === 'set') {
    await page.evaluate(([h, m, c]) => { const S = ClockLab.state; S.set.h = c ? h : (h % 12) + 1; S.set.m = m; }, [q.h, q.m, correct]); await page.click('#ck-check');
  } else if (q.type === 'match') {
    if (correct) for (let i = 0; i < 3; i++) { await page.locator(`#ck-card .ck-mclock[data-i="${i}"]`).click(); await page.locator(`#ck-card .ck-mtime[data-i="${i}"]`).click(); }
    else { await page.locator('#ck-card .ck-mclock[data-i="0"]').click(); await page.locator('#ck-card .ck-mtime[data-i="1"]').click(); }
  }
  return q;
}

for (const [w, h] of [[390, 844], [1280, 800]]) {
  test(`DYN-CLOCK ${w}px: zones, help, sound, coloured answers, Juice feedback, why, speed round`, async () => {
    const { ctx, page, errors } = await open('clock-EFC/index.html', { width: w, height: h, init: clockInit });
    try {
      await page.waitForSelector('.ck-dot', { timeout: 8000 });
      await page.locator('.ck-dot[data-unit="hours"]').click();
      await page.waitForSelector('#ck-play:not([hidden]) #ck-card .dy-zone');
      assert.match(await page.locator('#ck-card .dy-zone.q').first().textContent(), /Pregunta 1 de 8/);
      await visible(page, '#ck-learnbtn', 'help button'); assert.match(await page.textContent('#ck-learnbtn'), /Ayuda/);
      await visible(page, '#ck-play .jx-sound', 'sound toggle in the top bar');
      await visible(page, '#ck-play .dy-hud', 'streak and points row'); assert.match(await page.textContent('#ck-play .dy-hud'), /Racha/);
      assert.ok(await page.locator('#ck-card .dy-k').count() >= 1 || await page.locator('#ck-card input, #ck-card .ck-mclock').count() > 0, 'answers are coloured, typed or matched');
      await noHScroll(page, 'clock question');
      // correct answer: Juice effect + streak
      await clockAnswer(page, true);
      await page.waitForTimeout(150);
      assert.ok(await fx(page) > 0, 'Juice effect on a right answer');
      assert.match(await page.textContent('#ck-play .dy-hud'), /Racha 1/);
      await page.click('#ck-continue');
      // wrong answer: why box prominent
      await page.waitForTimeout(350);
      let guard = 0, q;
      do { q = await page.evaluate(() => ClockLab.state.q.type); if (q === 'match') { await page.evaluate(() => {}); } guard++; if (q === 'read' || q === 'pick' || q === 'type' || q === 'set') break; await clockAnswer(page, true); await page.click('#ck-continue'); } while (guard < 8);
      await clockAnswer(page, false);
      await page.waitForSelector('#ck-feedback:not([hidden]) #ck-why');
      const whyBox = await page.locator('#ck-why').evaluate(e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return { h: r.height, fs: parseFloat(cs.fontSize), b: parseFloat(cs.borderTopWidth) }; });
      assert.ok(whyBox.fs >= 16 && whyBox.b >= 2, 'the why is large and framed');
      assert.ok(await page.locator('#ck-feedback .ck-whylbl').isVisible(), 'why label');
      assert.ok(await fx(page) > 0, 'Juice effect on a wrong answer');
      await noHScroll(page, 'clock feedback');
      // speed round
      await page.click('#ck-quit'); await page.waitForSelector('#ck-speedbtn');
      await page.click('#ck-speedbtn');
      await page.waitForSelector('#ck-card .ck-clockbtn');
      assert.match(await page.textContent('#ck-card .dy-zone.q'), /Ronda rel/);
      assert.ok(await page.locator('#ck-card .dy-k').count() === 4, 'four mini clocks, colour coded');
      await tall(page, '#ck-card .ck-clockbtn', 'mini clock buttons', 56);
      await page.keyboard.press('1'); // keyboard answering works
      await page.waitForSelector('#ck-setclock, #ck-feedback:not([hidden]) #ck-continue', { timeout: 4000 });
      if (await page.locator('#ck-feedback:not([hidden]) #ck-continue').count()) await page.click('#ck-continue');
      await page.waitForSelector('#ck-setclock'); assert.ok(await page.locator('#ck-card .dy-zone', { hasText: 'agujas' }).count() === 1, 'set-the-hands label');
      await clockAnswer(page, true);
      await page.waitForSelector('#ck-card .ck-clockbtn', { timeout: 4000 });
      await page.evaluate(() => { ClockLab.state.speed.end = Date.now() + 50; });
      await page.waitForSelector('#ck-end:not([hidden])', { timeout: 4000 });
      assert.match(await page.textContent('#ck-endtext'), /Aciertos: \d/);
      assert.equal(await page.locator('#ck-endstars .dy-star').count(), 3);
      await page.click('#ck-back'); await page.waitForSelector('#ck-home:not([hidden])');
      assert.deepEqual(errors, []);
    } finally { await ctx.close(); }
  });
}

// ───────────────────────── fractions ─────────────────────────
const fracInit = () => localStorage.setItem('fractions_prog_guest', JSON.stringify({ units: { id1: { stars: 1 } }, learned: { id1: true, id2: true }, xp: 0, streak: 0, last: '' }));
async function fracAnswer(page, correct) {
  const q = await page.evaluate(() => { const q = FractionsLab.state.q; return { type: q.type, ans: q.answer }; });
  if (q.type === 'id') {
    const key = `${q.ans.n}/${q.ans.d}`;
    const loc = page.locator(correct ? `#fr-card .fr-opt:has(.fr-frac[aria-label="${key}"])` : `#fr-card .fr-opt:not(:has(.fr-frac[aria-label="${key}"]))`);
    await loc.first().click();
  } else if (q.type === 'build') {
    const paths = page.locator('#fr-card .fr-shape path');
    const total = await paths.count();
    for (let i = 0; i < (correct ? q.ans : Math.min(total - 1, q.ans + 1)); i++) await paths.nth(i).click();
    await page.click('#fr-check');
  }
  return q;
}
for (const [w, h] of [[390, 844], [1280, 800]]) {
  test(`DYN-FRAC ${w}px: zones, help, sound, Juice, why, drag slices and match cards`, async () => {
    const { ctx, page, errors } = await open('fractions-EFC/index.html', { width: w, height: h, init: fracInit });
    try {
      await page.waitForSelector('.fr-dot', { timeout: 8000 });
      await page.locator('.fr-dot[data-unit="id1"]').click();
      await page.waitForSelector('#fr-play:not([hidden]) #fr-card .dy-zone');
      assert.match(await page.locator('#fr-card .dy-zone.q').first().textContent(), /Pregunta 1 de 8/);
      await visible(page, '#fr-learnbtn', 'help'); assert.match(await page.textContent('#fr-learnbtn'), /Ayuda/);
      await visible(page, '#fr-play .jx-sound', 'sound toggle'); await visible(page, '#fr-play .dy-hud', 'hud');
      await noHScroll(page, 'fractions question');
      // find an "id" question for the deterministic checks
      let guard = 0;
      while ((await page.evaluate(() => FractionsLab.state.q.type)) !== 'id' && guard++ < 6) { await fracAnswer(page, true); await page.click('#fr-continue'); }
      assert.ok(await page.locator('#fr-card .dy-k').count() === 4, 'four coloured answers');
      await tall(page, '#fr-card .fr-opt', 'answers', 56);
      await fracAnswer(page, true); await page.waitForTimeout(120);
      assert.ok(await fx(page) > 0, 'Juice on a right answer');
      await page.click('#fr-continue');
      guard = 0;
      while ((await page.evaluate(() => FractionsLab.state.q.type)) !== 'id' && guard++ < 6) { await fracAnswer(page, true); await page.click('#fr-continue'); }
      await fracAnswer(page, false);
      await page.waitForSelector('#fr-feedback:not([hidden]) #fr-why');
      const why = await page.locator('#fr-why').evaluate(e => ({ fs: parseFloat(getComputedStyle(e).fontSize), b: parseFloat(getComputedStyle(e).borderTopWidth) }));
      assert.ok(why.fs >= 16 && why.b >= 2, 'why is prominent'); assert.ok(await page.locator('#fr-feedback .fr-whylbl').isVisible());
      await page.click('#fr-quit'); await page.waitForSelector('#fr-minis');
      // mini 1: drag slices
      await page.click('#fr-mini-slices'); await page.waitForSelector('#fr-mini-card #fr-pizza');
      assert.match(await page.textContent('#fr-mini-card .dy-zone.q'), /Ronda 1 de 5/);
      assert.ok(await page.locator('#fr-mini-card .dy-zone', { hasText: 'Arrastra' }).count() === 1, 'drag label');
      const d = await page.locator('#fr-tray .fr-chip').count(); assert.ok(d >= 2);
      const chip = await page.locator('#fr-tray .fr-chip').first().boundingBox(), pz = await page.locator('#fr-pizza').boundingBox();
      await page.mouse.move(chip.x + chip.width / 2, chip.y + chip.height / 2); await page.mouse.down();
      await page.mouse.move(chip.x + 30, chip.y - 30, { steps: 4 }); await page.mouse.move(pz.x + pz.width / 2, pz.y + pz.height / 2, { steps: 6 }); await page.mouse.up();
      assert.equal(await page.locator('#fr-pizza').getAttribute('data-count'), '1', 'dragging moved a slice into the pizza');
      assert.equal(await page.locator('#fr-tray .fr-chip').count(), d - 1);
      await page.locator('#fr-tray .fr-chip').first().focus(); await page.keyboard.press('Enter');
      assert.equal(await page.locator('#fr-pizza').getAttribute('data-count'), '2', 'keyboard places a slice');
      await page.click('#fr-mini-check'); await page.waitForSelector('#fr-mini-fb:not([hidden])');
      await noHScroll(page, 'slices feedback');
      await page.click('#fr-mini-go');
      // wrong on purpose: check with none placed
      await page.waitForSelector('#fr-mini-card #fr-pizza'); await page.click('#fr-mini-check');
      await page.waitForSelector('#fr-mini-why'); assert.ok(await fx(page) > 0);
      await page.click('#fr-mini-quit'); await page.waitForSelector('#fr-minis');
      // mini 2: match cards
      await page.click('#fr-mini-cards'); await page.waitForSelector('#fr-mini-card .fr-mcard');
      for (let r = 0; r < 3; r++) {
        await page.waitForSelector('#fr-mini-card .fr-mcard');
        for (let i = 0; i < 4; i++) { await page.locator(`#fr-mini-card .fr-mcard[data-i="${i}"]`).click(); await page.locator(`#fr-mini-card .fr-mpic[data-i="${i}"]`).click(); }
        await page.waitForSelector('#fr-mini-fb:not([hidden]) #fr-mini-go'); await page.click('#fr-mini-go');
      }
      await page.waitForSelector('#fr-end:not([hidden])'); assert.equal(await page.locator('#fr-endstars .dy-star').count(), 3);
      assert.match(await page.textContent('#fr-endtext'), /Aciertos: 3/);
      assert.deepEqual(errors, []);
    } finally { await ctx.close(); }
  });
}

// ───────────────────────── memory ─────────────────────────
for (const [w, h] of [[390, 844], [1280, 800]]) {
  test(`DYN-MEMORY ${w}px: zone labels, help sheet, sound, match effect, combo flash, why, timed mode`, async () => {
    const { ctx, page, errors } = await open('memory-EFC/index.html', { width: w, height: h });
    try {
      await page.waitForSelector('#mm-start');
      await visible(page, '#mm-timed', 'timed mode switch');
      await page.click('#mm-start'); await page.click('#mm-learn-skip');
      await page.waitForSelector('#mm-play:not([hidden]) .mm-tile');
      assert.match(await page.textContent('#mm-zone'), /Parejas: 0 de 3/);
      await visible(page, '#mm-help', 'help'); await visible(page, '#mm-play .jx-sound', 'sound'); await visible(page, '#mm-play .dy-hud', 'streak');
      await page.click('#mm-help'); await page.waitForSelector('.dy-sheet[role="dialog"]');
      assert.match(await page.textContent('.dy-sheet'), /Toca dos cartas/); await page.keyboard.press('Escape'); assert.equal(await page.locator('.dy-sheet').count(), 0);
      await noHScroll(page, 'memory board');
      const pairIdx = p => page.evaluate(p => MemoryPairs.state.deck.map((c, i) => c.pair === p ? i : -1).filter(i => i >= 0), p);
      // wrong first: explained
      const [a, b] = await page.evaluate(() => { const d = MemoryPairs.state.deck; return [0, d.findIndex((c, i) => i !== 0 && c.pair !== d[0].pair)]; });
      await page.click(`#mm-card .mm-tile[data-i="${a}"]`); await page.click(`#mm-card .mm-tile[data-i="${b}"]`);
      assert.ok((await page.textContent('#mm-why')).length > 20, 'why shown'); assert.ok(await fx(page) > 0, 'wrong effect');
      const wf = await page.locator('#mm-why').evaluate(e => parseFloat(getComputedStyle(e).fontSize)); assert.ok(wf >= 16);
      await page.waitForTimeout(1000);
      // two matches in a row: combo flash
      for (const p of [0, 1]) { for (const i of await pairIdx(p)) { await page.click(`#mm-card .mm-tile[data-i="${i}"]`); await page.waitForTimeout(60); } await page.waitForTimeout(100); }
      assert.ok(await page.locator('#mm-card .mm-grid.combo').count() === 1, 'combo flash after the second pair in a row');
      assert.ok(await fx(page) > 0); assert.match(await page.textContent('#mm-play .dy-hud'), /Racha 2/);
      assert.match(await page.textContent('#mm-zone'), /Parejas: 2 de 3/);
      for (const i of await pairIdx(2)) { await page.click(`#mm-card .mm-tile[data-i="${i}"]`); await page.waitForTimeout(60); }
      await page.waitForSelector('#mm-end:not([hidden])'); assert.equal(await page.locator('#mm-endstars .dy-star').count(), 3);
      // timed mode on the normal game
      await page.click('#mm-back'); await page.click('#mm-timed'); assert.equal(await page.getAttribute('#mm-timed', 'aria-checked'), 'true');
      await page.click('#mm-start'); await page.waitForSelector('#mm-timer');
      assert.match(await page.textContent('#mm-timer'), /⏱ \d+s/); assert.equal(await page.locator('#mm-card .mm-tile').count(), 8);
      await noHScroll(page, 'memory timed');
      assert.deepEqual(errors, []);
    } finally { await ctx.close(); }
  });
}

// ───────────────────────── repaso ─────────────────────────
for (const [w, h] of [[390, 844], [1280, 800]]) {
  test(`DYN-REPASO ${w}px: zone labels, help hint, sound, swipe cards with tilt, daily goal ring`, async () => {
    const { ctx, page, errors } = await open('repaso-EFC/index.html', { width: w, height: h });
    try {
      await page.waitForSelector('#rp-go');
      await visible(page, '#rp-plan .rp-goal .dy-ring', 'daily goal ring on home'); await visible(page, '#rp-stats .jx-sound', 'sound toggle');
      await page.click('#rp-go'); await page.waitForSelector('#rp-card .dy-zone.q');
      assert.match(await page.textContent('#rp-card .dy-zone.q'), /Pregunta 1 de \d+/);
      await visible(page, '#rp-help', 'help'); await visible(page, '#rp-play .jx-sound', 'sound'); await visible(page, '#rp-play .rp-minigoal', 'goal ring in the play bar'); await visible(page, '#rp-play .dy-hud');
      await page.click('#rp-help'); await page.waitForSelector('.dy-sheet'); assert.match(await page.textContent('.dy-sheet'), /desliza/i); await page.keyboard.press('Escape');
      // flash card: flip, swipe right (knew)
      await page.click('#rp-flip'); await page.waitForSelector('#rp-card.rp-swipe');
      await visible(page, '#rp-card .dy-zone:has-text("Desliza")', 'swipe label');
      const bx = await page.locator('#rp-card').boundingBox(), cx = bx.x + bx.width / 2, cy = bx.y + 90;
      await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(cx + 60, cy, { steps: 4 });
      const tilt = await page.locator('#rp-card').evaluate(e => e.style.transform); assert.match(tilt, /rotate\(/, 'the card tilts while dragging');
      await page.mouse.move(cx + 160, cy, { steps: 4 }); await page.mouse.up();
      await page.waitForFunction(() => /Pregunta 2 de/.test(document.querySelector('#rp-card .dy-zone.q')?.textContent || ''), null, { timeout: 3000 });
      assert.ok(await fx(page) > 0, 'effect on a right answer');
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('repaso_meta_guest')).goalN), 1, 'the daily goal counts the card');
      assert.match(await page.textContent('#rp-play .dy-hud'), /Racha 1/);
      // swipe left (not yet): answer is shown big
      await page.click('#rp-flip'); await page.waitForSelector('#rp-card.rp-swipe'); await page.waitForTimeout(500); const b2 = await page.locator('#rp-card').boundingBox();
      await page.mouse.move(b2.x + b2.width / 2, b2.y + 90); await page.mouse.down(); await page.mouse.move(b2.x + b2.width / 2 - 170, b2.y + 90, { steps: 6 }); await page.mouse.up();
      await page.waitForSelector('#rp-feedback:not([hidden]) .rp-a', { timeout: 3000 });
      assert.ok((await page.locator('#rp-feedback .rp-a').evaluate(e => parseFloat(getComputedStyle(e).fontSize))) >= 20, 'answer is large');
      await page.click('#rp-continue');
      // keyboard still works: Space flips, ArrowRight = knew it
      let guard = 0;
      while (!(await page.locator('#rp-end:not([hidden])').count()) && guard++ < 80) {
        if (await page.locator('#rp-feedback:not([hidden]) #rp-continue').count()) { await page.keyboard.press('Enter'); await page.waitForTimeout(40); continue; }
        if (await page.locator('#rp-flip').count()) { await page.keyboard.press(' '); await page.waitForTimeout(40); }
        if (await page.locator('#rp-card .rp-opt').count()) { await page.keyboard.press('1'); await page.waitForTimeout(40); continue; }
        if (await page.locator('#rp-typed').count()) { await page.fill('#rp-typed', 'x'); await page.keyboard.press('Enter'); await page.waitForTimeout(40); continue; }
        await page.keyboard.press('ArrowRight'); await page.waitForTimeout(40);
      }
      await page.waitForSelector('#rp-end:not([hidden])'); assert.equal(await page.locator('#rp-endstars .dy-star').count(), 3);
      await visible(page, '#rp-endgoal .dy-ring', 'goal ring in the results'); await noHScroll(page, 'repaso end');
      assert.deepEqual(errors, []);
    } finally { await ctx.close(); }
  });
}

// ───────────────────────── euskera ─────────────────────────
for (const [w, h] of [[390, 844], [1280, 800]]) {
  test(`DYN-EUSKERA ${w}px: zones, help, sound, drag the auxiliary into the blank, prominent why, case round`, async () => {
    const { ctx, page, errors } = await open('euskera-EFC/index.html', { width: w, height: h });
    try {
      await page.waitForSelector('#eu-case-btn', { state: 'attached' });
      await page.evaluate(() => EuskeraGame.startLevel(1));
      await page.waitForSelector('#eu-screen-game.active .eu-option-btn');
      assert.match(await page.textContent('#eu-question-area .dy-zone.q'), /Pregunta 1 de \d+/);
      await visible(page, '#eu-help', 'help'); await visible(page, '#eu-screen-game .jx-sound', 'sound');
      assert.equal(await page.locator('#eu-question-area .dy-k').count(), 4, 'coloured answers');
      await tall(page, '#eu-question-area .eu-option-btn', 'answers', 56);
      await page.click('#eu-help'); await page.waitForSelector('.dy-sheet'); assert.match(await page.textContent('.dy-sheet'), /NORK/); await page.keyboard.press('Escape');
      await noHScroll(page, 'euskera question');
      // drag the right auxiliary into the blank
      const ans = await page.evaluate(() => { const s = EuskeraGame._state; return EUSKERA_LEVELS[0].exercises[s.exerciseIndex].answer; });
      const opt = page.locator('#eu-question-area .eu-option-btn', { hasText: new RegExp('^' + ans + '$', 'i') }).first();
      const ob = await opt.boundingBox(), bb = await page.locator('.eu-blank').boundingBox();
      await page.mouse.move(ob.x + ob.width / 2, ob.y + ob.height / 2); await page.mouse.down();
      await page.mouse.move(ob.x + 20, ob.y - 20, { steps: 4 }); await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 8 }); await page.mouse.up();
      await page.waitForSelector('.eu-blank.filled-ok'); assert.ok(await fx(page) > 0, 'Juice effect');
      assert.ok(await page.locator('#eu-feedback .eu-whylbl').isVisible(), 'why label');
      await page.click('#eu-next-btn');
      // wrong by click: why is large; keyboard Enter on a focused option works too
      const wrong = await page.evaluate(() => { const s = EuskeraGame._state, e = EUSKERA_LEVELS[0].exercises[s.exerciseIndex]; return e.options.find(o => o.toLowerCase() !== e.answer.toLowerCase()); });
      await page.locator('#eu-question-area .eu-option-btn', { hasText: new RegExp('^' + wrong + '$') }).first().click();
      await page.waitForSelector('.eu-feedback.wrong');
      assert.ok((await page.locator('#eu-feedback .eu-whytx').evaluate(e => parseFloat(getComputedStyle(e).fontSize))) >= 16, 'why is large');
      await page.click('#eu-next-btn');
      await page.locator('#eu-question-area .eu-option-btn').first().focus(); await page.keyboard.press('Enter');
      await page.waitForSelector('#eu-feedback[style*="block"]');
      // case round
      await page.click('#eu-quit-btn'); await page.click('#eu-quit-ok'); await page.waitForSelector('#eu-case-btn', { state: 'visible' });
      await page.evaluate(() => EuskeraGame.showMode('grammar')); await page.click('#eu-case-btn');
      await page.waitForSelector('#eu-case-options'); assert.match(await page.textContent('#eu-level-badge'), /🎯/);
      assert.equal(await page.locator('#eu-case-options .dy-k').count(), 3);
      for (let i = 0; i < 6; i++) {
        const right = await page.evaluate(() => { const s = EuskeraGame._state, q = s.caseQs[s.caseIdx]; return q.ex.analysis[q.role[0]]; });
        await page.locator('#eu-case-options').getByText(right, { exact: true }).first().click();
        await page.waitForSelector('#eu-next-btn:not(.hidden)'); await page.click('#eu-next-btn');
      }
      await page.waitForSelector('#eu-screen-results.active'); assert.equal(await page.locator('#eu-result-stars .dy-star').count(), 3);
      assert.equal(await page.textContent('#eu-result-correct'), '6/6');
      assert.deepEqual(errors, []);
    } finally { await ctx.close(); }
  });
}

// ───────────────────────── wordSearch ─────────────────────────
async function wsDragWord(page, idx) {
  const p = await page.evaluate(i => { const x = WordSearchGame._placed[i]; return { r: x.row, c: x.col, dr: x.dir[0], dc: x.dir[1], len: x.len }; }, idx);
  const pt = async (r, c) => { const b = await page.locator(`.ws-cell[data-r="${r}"][data-c="${c}"]`).boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
  const [x0, y0] = await pt(p.r, p.c);
  await page.mouse.move(x0, y0); await page.mouse.down();
  for (let k = 1; k < p.len; k++) { const [x, y] = await pt(p.r + p.dr * k, p.c + p.dc * k); await page.mouse.move(x, y, { steps: 3 }); }
  await page.mouse.up();
}
for (const [w, h] of [[390, 844], [1280, 800]]) {
  test(`DYN-WORDSEARCH ${w}px: zones, visible hint, sound, found-word celebration, progress ring, results stars`, async () => {
    const { ctx, page, errors } = await open('wordSearch-EFC/index.html', { width: w, height: h });
    try {
      await page.waitForSelector('#ws-level-grid');
      await page.evaluate(() => { WordSearchGame._level = 1; WordSearchGame.startGame(); });
      await page.waitForSelector('#ws-screen-game.active .ws-cell');
      await visible(page, '#ws-zone-words', 'words zone label'); await visible(page, '#ws-zone-grid', 'grid zone label');
      await visible(page, '#ws-hint-top', 'hint button'); assert.match(await page.textContent('#ws-hint-top'), /Pista/);
      await visible(page, '#ws-screen-game .jx-sound', 'sound toggle'); await visible(page, '#ws-screen-game .ws-ringbox svg', 'progress ring');
      await noHScroll(page, 'wordsearch game');
      // visible hint
      await page.click('#ws-hint-top'); await page.waitForSelector('#ws-hint-note:not([hidden])');
      assert.match(await page.textContent('#ws-hint-note'), /fila \d+, columna \d+/); assert.ok(await page.locator('.ws-cell.hint').count() === 1);
      // wrong selection: soft feedback only
      const a = await page.locator('.ws-cell[data-r="0"][data-c="0"]').boundingBox(), b = await page.locator('.ws-cell[data-r="0"][data-c="1"]').boundingBox();
      await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 3 }); await page.mouse.up();
      // find the first word: celebration + ring + streak
      await wsDragWord(page, 0);
      await page.waitForSelector('#ws-popup-dismiss', { timeout: 3000 });
      assert.ok(await fx(page) > 0, 'celebration on a found word');
      assert.match(await page.textContent('#ws-screen-game .dy-hud'), /Racha 1/); assert.match(await page.textContent('.ws-ringbox'), /^1\//);
      assert.equal(await page.locator('#ws-hint-note').isHidden(), true);
      await page.click('#ws-popup-dismiss');
      const total = await page.evaluate(() => WordSearchGame._placed.length);
      for (let i = 1; i < total; i++) { await wsDragWord(page, i); await page.waitForSelector('#ws-popup-dismiss', { timeout: 3000 }); await page.click('#ws-popup-dismiss'); }
      await page.waitForSelector('#ws-screen-results.active', { timeout: 6000 });
      assert.equal(await page.locator('#ws-stars .dy-star').count(), 3);
      assert.deepEqual(errors, []);
    } finally { await ctx.close(); }
  });
}

// ───────────────────────── crossword ─────────────────────────
for (const [w, h] of [[390, 844], [1280, 800]]) {
  test(`DYN-CROSSWORD ${w}px: zones, labelled hint, sound, word celebration, progress ring, results stars`, async () => {
    const { ctx, page, errors } = await open('crossword-EFC/index.html', { width: w, height: h });
    try {
      await page.waitForSelector('#cw-level-grid');
      await page.evaluate(() => CrosswordGame._startGame(1, 'all'));
      await page.waitForSelector('#cw-screen-game.active .cw-cell', { timeout: 8000 });
      await page.waitForSelector('#cw-hint-top'); await visible(page, '#cw-hint-top', 'hint'); assert.match(await page.textContent('#cw-hint-top'), /Pista: revela una letra/);
      await visible(page, '#cw-zone-grid', 'grid zone'); await visible(page, '#cw-zone-clues', 'clues zone');
      await visible(page, '#cw-screen-game .jx-sound', 'sound'); await visible(page, '#cw-screen-game .cw-ringbox svg', 'ring');
      await noHScroll(page, 'crossword game');
      // type the first word with the keyboard
      await page.evaluate(() => { const g = CrosswordGame; g._selectWord(g._placed[0]); g._hiddenInput.focus(); });
      const word = await page.evaluate(() => CrosswordGame._placed[0].word);
      await page.keyboard.type(word, { delay: 20 });
      await page.waitForFunction(() => CrosswordGame._placed[0]._cel === true, null, { timeout: 4000 });
      assert.ok(await fx(page) > 0, 'celebration on a completed word'); assert.match(await page.textContent('#cw-screen-game .dy-hud'), /Racha 1/);
      assert.match(await page.textContent('.cw-ringbox'), /^\d+\//);
      // hint reveals a letter of the next word
      const before = await page.evaluate(() => { const g = CrosswordGame; g._selectWord(g._placed[1]); return g._userGrid.flat().filter(Boolean).length; });
      await page.click('#cw-hint-top');
      assert.equal(await page.evaluate(() => CrosswordGame._userGrid.flat().filter(Boolean).length), before + 1, 'a letter was revealed');
      // finish the rest directly
      await page.evaluate(() => { const g = CrosswordGame; g._placed.forEach(p => { g._selectWord(p); for (let i = 0; i < p.word.length; i++) { g._selR = p.r0 + (p.dir === 'DOWN' ? i : 0); g._selC = p.c0 + (p.dir === 'ACROSS' ? i : 0); g._handleInput(p.word[i]); } }); });
      await page.waitForSelector('#cw-screen-results.active', { timeout: 8000 });
      assert.equal(await page.locator('#cw-stars .dy-star').count(), 3);
      assert.deepEqual(errors, []);
    } finally { await ctx.close(); }
  });
}
