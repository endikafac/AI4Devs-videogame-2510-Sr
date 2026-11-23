import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const root = path.resolve(import.meta.dirname, '../..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const SHOTS = process.env.LEARNFIRST_SHOTS || '';
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
const CLOCK_IDS = ['hours', 'hoursSet', 'half', 'quarter', 'five', 'five2', 'words', 'plus', 'h24', 'dur'];
const FRAC_IDS = ['id1', 'id2', 'cmp1', 'cmp2', 'eq', 'add', 'mix', 'line', 'qty', 'mixed', 'dec'];

/** Opens a game in a fresh context (service workers blocked). unlock: all lessons open and already learned. */
async function open(game, { width = 390, height = 844, unlock = false, lang = 'es', touch = false, reducedMotion = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block', locale: lang === 'es' ? 'es-ES' : 'en-US', hasTouch: touch, reducedMotion: reducedMotion ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !IGNORE.test(m.text())) errors.push(m.text()); });
  const pre = game === 'clock' ? 'clock' : 'fractions', ids = game === 'clock' ? CLOCK_IDS : FRAC_IDS;
  await page.addInitScript(({ pre, ids, unlock, lang }) => {
    Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' });
    try {
      localStorage.setItem('games_hub_language', lang === 'es' ? 'es-ES' : 'en-US');
      const k = pre + '_prog_guest';
      if (unlock && !localStorage.getItem(k)) {
        const units = {}, learned = {}; ids.forEach(id => { units[id] = { stars: 3 }; learned[id] = true; });
        delete units[ids[ids.length - 1]];
        localStorage.setItem(k, JSON.stringify({ units, learned, xp: 0, streak: 0, last: '' }));
      }
    } catch (e) { /* storage blocked */ }
  }, { pre, ids, unlock, lang });
  await page.goto(base + (game === 'clock' ? '/clock-EFC/index.html' : '/fractions-EFC/index.html'), { waitUntil: 'load' });
  await page.waitForSelector(game === 'clock' ? '.ck-dot' : '.fr-dot', { timeout: 8000 });
  return { ctx, page, errors };
}
const shot = (page, name) => (SHOTS ? page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: true }) : null);
const overflow = page => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
async function smallTargets(page, sel) {
  return page.evaluate(sel => [...document.querySelectorAll(sel)].filter(b => b.offsetParent !== null && !b.disabled).map(b => { const r = b.getBoundingClientRect(); return { id: b.id || b.className, w: Math.round(r.width), h: Math.round(r.height) }; })
    .filter(b => b.w < 47.5 || b.h < 47.5), sel);
}
const svgPoint = async (page, svgSel, vb, ang, rad) => { // client point at angle (deg from 12) and radius (svg units) of a clock svg whose centre is (100,100) and viewBox starts at vb
  const box = await page.locator(svgSel).first().boundingBox(), size = vb ? 216 : 200, sc = box.width / size, off = vb ? 8 : 0, a = ang * Math.PI / 180;
  return { x: box.x + (100 + off) * sc + rad * sc * Math.sin(a), y: box.y + (100 + off) * sc - rad * sc * Math.cos(a) };
};

// ===================================================================== CLOCK
test('F-CLOCK-LEARN: first open shows the learn step, the minute hand drags (mouse) and moves the hour hand and the digital readout', async () => {
  const { ctx, page, errors } = await open('clock');
  try {
    assert.equal(await page.locator('.ck-dot').count(), 10, 'ten lessons on the path');
    assert.equal(await page.locator('.ck-lbtn').count(), 1, 'the unlocked lesson has an Aprender button');
    await page.click('.ck-dot[data-unit="hours"]');
    await page.waitForSelector('#ck-learn:not([hidden])');
    assert.equal(await page.locator('#ck-play').isHidden(), true, 'learn comes before the questions');
    assert.equal(await page.locator('#ck-digital').textContent(), '3:00');
    assert.match(await page.locator('#ck-leg-h').textContent(), /corta.*horas/i); assert.match(await page.locator('#ck-leg-m').textContent(), /larga.*minutos/i);
    assert.equal(await page.locator('#ck-learn-clock .ck-hand-h').getAttribute('stroke'), '#dc2626', 'short hand is red');
    assert.equal(await page.locator('#ck-learn-clock .ck-hand-m').getAttribute('stroke'), '#2563eb', 'long hand is blue');
    // drag the minute hand to 30 minutes (straight down)
    const svg = '#ck-learn-clock svg';
    let p = await svgPoint(page, svg, true, 0, 60); await page.mouse.move(p.x, p.y); await page.mouse.down();
    p = await svgPoint(page, svg, true, 90, 60); await page.mouse.move(p.x, p.y);
    assert.equal(await page.locator('#ck-digital').textContent(), '3:15');
    p = await svgPoint(page, svg, true, 180, 60); await page.mouse.move(p.x, p.y); await page.mouse.up();
    assert.equal(await page.locator('#ck-digital').textContent(), '3:30');
    assert.match(await page.locator('#ck-learn-clock .ck-hand-h').getAttribute('transform'), /rotate\(105 100 100\)/, 'hour hand halfway between 3 and 4');
    assert.match(await page.locator('#ck-learn-clock .ck-hand-m').getAttribute('transform'), /rotate\(180 100 100\)/);
    // going round past 12 moves the hour on, like a real clock
    p = await svgPoint(page, svg, true, 350, 60); await page.mouse.move(p.x, p.y); await page.mouse.down();
    p = await svgPoint(page, svg, true, 10, 60); await page.mouse.move(p.x, p.y); await page.mouse.up();
    assert.equal(await page.locator('#ck-digital').textContent(), '4:02');
    // minute numbers fade in when asked
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.ck-minnums')).opacity), '0');
    await page.click('#ck-nums'); await page.waitForTimeout(800);
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.ck-minnums')).opacity), '1');
    assert.equal(await page.locator('.ck-minnums text').allTextContents().then(a => a.join(',')), '5,10,15,20,25,30,35,40,45,50,55,60');
    await shot(page, 'clock-learn');
    // three worked examples
    for (let i = 1; i <= 3; i++) {
      assert.match(await page.locator('#ck-ex-label').textContent(), new RegExp(`${i} de 3`));
      assert.match(await page.locator('#ck-ex-text').textContent(), /^Mira:/);
      if (i < 3) await page.click('#ck-ex-next');
    }
    assert.equal(await page.locator('#ck-digital').textContent(), '12:00');
    assert.equal(await page.locator('#ck-ex-next').isHidden(), true); assert.equal(await page.locator('#ck-learn-done').isVisible(), true);
    assert.equal(await overflow(page), 0);
    assert.deepEqual(await smallTargets(page, '#ck-learn button'), []);
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-CLOCK-TOUCH: the minute hand also follows touch pointer events', async () => {
  const { ctx, page } = await open('clock', { touch: true });
  try {
    await page.tap('.ck-dot[data-unit="hours"]'); await page.waitForSelector('#ck-learn:not([hidden])');
    const box = await page.locator('#ck-learn-clock svg').boundingBox(), sc = box.width / 216, cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    await page.evaluate(({ cx, cy, r, sc }) => {
      const svg = document.querySelector('#ck-learn-clock svg'), mk = (t, x, y) => svg.dispatchEvent(new PointerEvent(t, { pointerId: 7, pointerType: 'touch', clientX: x, clientY: y, bubbles: true, cancelable: true }));
      mk('pointerdown', cx, cy - r * sc); mk('pointermove', cx + r * sc, cy); mk('pointermove', cx, cy + r * sc); mk('pointermove', cx - r * sc, cy); mk('pointerup', cx - r * sc, cy);
    }, { cx, cy, r: 60, sc });
    assert.equal(await page.locator('#ck-digital').textContent(), '3:45', 'dragged round to the 9');
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('#ck-learn-clock svg')).touchAction), 'none');
  } finally { await ctx.close(); }
});

/** Reads the current question and answers it through the real UI. correct=false picks a wrong answer. */
async function answerClock(page, correct = true) {
  const q = await page.evaluate(() => JSON.parse(JSON.stringify(ClockLab.state.q)));
  const wrongOpt = async () => { const vs = await page.$$eval('#ck-card .ck-opt', bs => bs.map(b => b.dataset.v)); return vs.find(v => v !== q.answer); };
  switch (q.type) {
    case 'read': case 'say': case 'hear': case 'add': case 'durend': case 'dur': case 'h24read': case 'h24to12': {
      const v = correct ? q.answer : await wrongOpt();
      await page.click(`#ck-card .ck-opt[data-v="${v}"]`); break;
    }
    case 'pick': {
      const idx = q.clocks.findIndex(c => c.ok === correct); await page.locator('#ck-card .ck-clockbtn').nth(idx).click(); break;
    }
    case 'type': {
      await page.fill('#ck-th', String(correct ? q.h : (q.h % 12) + 1)); await page.fill('#ck-tm', String(q.m).padStart(2, '0')); await page.click('#ck-check'); break;
    }
    case 'set': {
      const sel = '#ck-setclock svg';
      if (correct) {
        if (q.step >= 60) { const p = await svgPoint(page, sel, false, (q.h % 12) * 30, 40); await page.mouse.click(p.x, p.y); }
        else {
          const pm = await svgPoint(page, sel, false, q.m * 6, 78); await page.mouse.move(pm.x, pm.y); await page.mouse.down(); await page.mouse.up(); // minute hand
          const cur = await page.evaluate(() => ({ ...ClockLab.state.set }));
          if (cur.h !== q.h) { const ph = await svgPoint(page, sel, false, (q.h % 12) * 30 + q.m * 0.5, 30); await page.mouse.click(ph.x, ph.y); }
        }
        const got = await page.evaluate(() => ({ ...ClockLab.state.set }));
        assert.deepEqual(got, { h: q.h, m: q.m }, 'dragging the hands set the clock');
      }
      await page.click('#ck-check'); break;
    }
    case 'match': {
      const order = q.order;
      if (correct) for (let i = 0; i < 3; i++) { await page.locator(`#ck-card .ck-mclock[data-i="${i}"]`).click(); await page.locator(`#ck-card .ck-mtime[data-i="${i}"]`).click(); }
      else { await page.locator('#ck-card .ck-mclock[data-i="0"]').click(); await page.locator(`#ck-card .ck-mtime[data-i="${order.find(i => i !== 0)}"]`).click(); }
      break;
    }
    default: assert.fail('unhandled type ' + q.type);
  }
  await page.waitForSelector('#ck-feedback:not([hidden])');
  return q;
}
/** Plays a lesson to the end screen. wrongFirst: the first practice question is answered wrongly and the explanation checked. */
async function playClock(page, { wrongFirst = false } = {}) {
  let answered = 0, whys = [], wrongDone = false;
  for (let guard = 0; guard < 60; guard++) {
    if (await page.locator('#ck-end').isVisible()) return { answered, whys };
    const phase = await page.evaluate(() => ClockLab.state.phase);
    const wrong = wrongFirst && !wrongDone && phase === 'practice';
    const q = await answerClock(page, !wrong);
    if (wrong) {
      wrongDone = true;
      const why = (await page.locator('#ck-why').textContent()).trim();
      assert.ok(why.length > 20, `explanation for a wrong ${q.type}: "${why}"`); whys.push(why);
      assert.ok(await page.locator('#ck-feedback .ck-face.hl').count() >= 1, 'the clock is redrawn with highlighted hands');
      assert.equal(await page.locator('#ck-feedback.bad').count(), 1);
      if (q.type !== 'match') assert.ok((await page.locator('#ck-feedback .ck-ans').textContent()).trim().length > 0);
      assert.equal(await overflow(page), 0, 'no horizontal scroll with the explanation open');
      assert.deepEqual(await smallTargets(page, '#ck-feedback button'), []);
    }
    await page.click('#ck-continue'); answered++;
  }
  assert.fail('lesson did not end');
}

test('F-CLOCK-FLOW: learn -> two guided exercises -> practice, wrong answers explain why, progress and seen buffer are saved', async () => {
  const { ctx, page, errors } = await open('clock');
  try {
    await page.click('.ck-dot[data-unit="hours"]'); await page.waitForSelector('#ck-learn:not([hidden])');
    await page.click('#ck-ex-next'); await page.click('#ck-ex-next'); await page.click('#ck-learn-done');
    await page.waitForSelector('#ck-play:not([hidden])');
    assert.match(await page.locator('#ck-count').textContent(), /guiada 1 de 2/i);
    assert.ok((await page.locator('.ck-hintbox').textContent()).startsWith('Pista:'));
    // first guided attempt wrong: a hint and a retry, nothing is lost
    await page.click('#ck-check'); await page.waitForSelector('#ck-retry');
    assert.ok((await page.locator('#ck-why').textContent()).length > 20);
    await page.click('#ck-retry'); assert.equal(await page.locator('#ck-feedback').isHidden(), true);
    await answerClock(page, true); await page.click('#ck-continue');
    assert.match(await page.locator('#ck-count').textContent(), /guiada 2 de 2/i);
    await answerClock(page, true); await page.click('#ck-continue');
    assert.match(await page.locator('#ck-count').textContent(), /^1 \/ 8$/, 'guided exercises do not count in the 8 practice questions');
    // practice with one wrong answer
    const res = await playClock(page, { wrongFirst: true });
    assert.equal(res.answered, 8);
    assert.equal(await page.locator('#ck-endstars').textContent().then(s => s.includes('★')), true, 'passed with 7 of 8');
    const store = await page.evaluate(() => ({ prog: JSON.parse(localStorage.getItem('clock_prog_guest')), seen: JSON.parse(localStorage.getItem('clock_seen_guest')) }));
    assert.ok(store.prog.units.hours, 'lesson saved'); assert.ok(store.prog.learned.hours, 'learn step remembered');
    assert.equal(store.seen.length, 8); assert.equal(new Set(store.seen).size, 8, 'no time twice in a session');
    assert.ok(store.seen.every(k => k.startsWith('t|') || k.startsWith('match|')));
    await page.click('#ck-back'); await page.waitForSelector('#ck-home:not([hidden])');
    assert.equal(await page.locator('.ck-dot.locked').count(), 8, 'lesson 2 unlocked, 8 still locked');
    // second lesson 1 session: the learn step is not shown again, questions avoid the recent ones
    await page.click('.ck-dot[data-unit="hours"]'); await page.waitForSelector('#ck-play:not([hidden])');
    assert.equal(await page.locator('#ck-learn').isHidden(), true);
    assert.deepEqual(await smallTargets(page, '#ck-card button, #ck-learnbtn, #ck-quit'), []);
    assert.equal(await overflow(page), 0);
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-CLOCK-SKIP: the learn step can be skipped, is not repeated, and stays reachable with the Aprender buttons', async () => {
  const { ctx, page, errors } = await open('clock');
  try {
    await page.click('.ck-dot[data-unit="hours"]'); await page.waitForSelector('#ck-learn:not([hidden])');
    assert.ok((await smallTargets(page, '#ck-skip')).length === 0);
    await page.click('#ck-skip');
    await page.waitForSelector('#ck-play:not([hidden])');
    assert.match(await page.locator('#ck-count').textContent(), /^1 \/ 8$/, 'skipping goes straight to the practice');
    assert.ok(await page.locator('#ck-card .ck-opt, #ck-card .ck-clockbtn, #ck-card .ck-mclock, #ck-card .ck-input').count() > 0, 'a question is on screen');
    // Aprender button inside the lesson, then back to the same question
    const before = await page.locator('#ck-card').innerHTML();
    await page.click('#ck-learnbtn'); await page.waitForSelector('#ck-learn:not([hidden])');
    await page.click('#ck-skip'); await page.waitForSelector('#ck-play:not([hidden])');
    assert.equal(await page.locator('#ck-card').innerHTML(), before, 'the question is kept');
    await page.click('#ck-quit'); await page.waitForSelector('#ck-home:not([hidden])');
    // later visits go straight to the questions, Aprender on the path opens the learn step again
    await page.click('.ck-dot[data-unit="hours"]'); await page.waitForSelector('#ck-play:not([hidden])');
    await page.click('#ck-quit');
    await page.click('.ck-lbtn[data-learn="hours"]'); await page.waitForSelector('#ck-learn:not([hidden])');
    assert.equal(await page.locator('#ck-digital').textContent(), '3:00');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-CLOCK-ALL: every lesson plays to the end through the real UI, with a mistake explained, without errors or horizontal scroll', async () => {
  const { ctx, page, errors } = await open('clock', { unlock: true, width: 360, height: 780 });
  try {
    const kinds = new Set(), whys = [];
    for (const id of CLOCK_IDS) {
      await page.click(`.ck-dot[data-unit="${id}"]`); await page.waitForSelector('#ck-play:not([hidden])');
      const res = await playClock(page, { wrongFirst: true });
      whys.push(...res.whys);
      await page.waitForSelector('#ck-end:not([hidden])');
      assert.equal(await overflow(page), 0, id + ' end screen overflow');
      await page.click('#ck-back'); await page.waitForSelector('#ck-home:not([hidden])');
    }
    const seen = await page.evaluate(() => JSON.parse(localStorage.getItem('clock_seen_guest')));
    for (const k of seen) kinds.add(k.split('|')[0]);
    for (const k of ['t', 'match', 'add', 'dur', 'h24']) assert.ok(kinds.has(k), 'question family ' + k + ' was shown: ' + [...kinds]);
    assert.equal(new Set(seen).size, seen.length, 'no repeated question across the ten lessons');
    assert.ok(whys.length === 10 && whys.every(w => w.length > 20));
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-CLOCK-LEARN-ALL: the learn step of every lesson opens, shows three examples and fits 360 px', async () => {
  const { ctx, page, errors } = await open('clock', { unlock: true, width: 360, height: 780 });
  try {
    for (const id of CLOCK_IDS) {
      await page.click(`.ck-lbtn[data-learn="${id}"]`); await page.waitForSelector('#ck-learn:not([hidden])');
      assert.ok((await page.locator('#ck-l-intro').textContent()).length > 40, id + ' intro');
      const texts = [];
      for (let i = 0; i < 3; i++) { texts.push(await page.locator('#ck-ex-text').textContent()); if (i < 2) await page.click('#ck-ex-next'); }
      assert.equal(new Set(texts).size, 3, id + ' three different examples'); assert.ok(texts.every(t => t.startsWith('Mira:')));
      assert.equal(await overflow(page), 0, id + ' learn overflow');
      assert.deepEqual(await smallTargets(page, '#ck-learn button'), [], id);
      await page.click('#ck-l-quit'); await page.waitForSelector('#ck-home:not([hidden])');
    }
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-CLOCK-MOTION: prefers-reduced-motion switches the fades and shake off', async () => {
  const { ctx, page } = await open('clock', { reducedMotion: true });
  try {
    await page.click('.ck-dot[data-unit="hours"]'); await page.waitForSelector('#ck-learn:not([hidden])');
    const dur = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.ck-minnums')).transitionDuration));
    assert.ok(dur <= 0.001, 'fade transition off, got ' + dur);
  } finally { await ctx.close(); }
});

test('F-CLOCK-EN: English UI has the same structure', async () => {
  const { ctx, page, errors } = await open('clock', { lang: 'en' });
  try {
    await page.click('.ck-dot[data-unit="hours"]'); await page.waitForSelector('#ck-learn:not([hidden])');
    assert.match(await page.locator('#ck-leg-h').textContent(), /Short hand = hours/);
    assert.match(await page.locator('#ck-ex-text').textContent(), /^Look:/);
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

// ===================================================================== FRACTIONS
const fkey = f => `${f.n}/${f.d}`;
async function answerFrac(page, correct = true) {
  const q = await page.evaluate(() => JSON.parse(JSON.stringify(FractionsLab.state.q)));
  const key = q.type === 'mix' && q.dir === 'up' ? `${q.answer.w} ${q.answer.n}/${q.answer.d}` : q.answer && q.answer.n !== undefined ? fkey(q.answer) : String(q.answer);
  const wrongOpt = async () => { const vs = await page.$$eval('#fr-card .fr-opt', bs => bs.map(b => b.dataset.v)); return vs.find(v => v !== key); };
  if (q.type === 'build') {
    const n = correct ? q.answer : q.answer + 1 > q.f.d ? q.answer - 1 : q.answer + 1;
    for (let i = 0; i < n; i++) await page.locator('#fr-card .fr-tap').nth(i).click();
    await page.click('#fr-check');
  } else if (q.type === 'place') {
    const box = await page.locator('#fr-card svg.line').boundingBox(), n = correct ? q.answer : q.answer === 1 ? 2 : q.answer - 1;
    await page.mouse.click(box.x + box.width * (20 + 260 * n / q.f.d) / 300, box.y + box.height * 0.5);
    await page.click('#fr-check');
  } else {
    const v = correct ? key : await wrongOpt();
    await page.click(`#fr-card .fr-opt[data-v="${v}"]`);
  }
  await page.waitForSelector('#fr-feedback:not([hidden])');
  return q;
}
async function playFrac(page, { wrongFirst = false } = {}) {
  let answered = 0, whys = [], wrongDone = false;
  for (let guard = 0; guard < 60; guard++) {
    if (await page.locator('#fr-end').isVisible()) return { answered, whys };
    const phase = await page.evaluate(() => FractionsLab.state.phase);
    const wrong = wrongFirst && !wrongDone && phase === 'practice';
    const q = await answerFrac(page, !wrong);
    if (wrong) {
      wrongDone = true;
      const why = (await page.locator('#fr-why').textContent()).trim();
      assert.ok(why.length > 20, `explanation for a wrong ${q.type}: "${why}"`); whys.push(why);
      assert.ok(await page.locator('#fr-feedback .fr-figs svg').count() >= 1, 'the picture is redrawn');
      assert.equal(await page.locator('#fr-feedback.bad').count(), 1);
      assert.equal(await overflow(page), 0, 'no horizontal scroll with the explanation open');
      assert.deepEqual(await smallTargets(page, '#fr-feedback button'), []);
    }
    await page.click('#fr-continue'); answered++;
  }
  assert.fail('lesson did not end');
}

test('F-FRAC-LEARN: the learn step shades slices on tap and the fraction updates live with labelled numerator and denominator', async () => {
  const { ctx, page, errors } = await open('fractions');
  try {
    assert.equal(await page.locator('.fr-dot').count(), 11);
    await page.click('.fr-dot[data-unit="id1"]'); await page.waitForSelector('#fr-learn:not([hidden])');
    assert.equal(await page.locator('#fr-play').isHidden(), true);
    const nums = () => page.locator('#fr-live .fr-num').first().textContent(), dens = () => page.locator('#fr-live .fr-den').first().textContent();
    const shaded = () => page.locator('#fr-widget svg path[fill="#ef4444"]').count();
    assert.equal(await shaded(), 1); assert.equal(await nums(), '1'); assert.equal(await dens(), '2');
    assert.match(await page.locator('#fr-live').textContent(), /1 parte de 2 = 1\/2/);
    await page.locator('#fr-widget svg .fr-tap').nth(1).click();
    assert.equal(await shaded(), 2); assert.equal(await nums(), '2'); assert.match(await page.locator('#fr-live').textContent(), /2 partes de 2 = 2\/2/);
    await page.locator('#fr-widget svg .fr-tap').nth(0).click();
    assert.equal(await nums(), '1');
    await page.click('#fr-widget .fr-key[aria-label$="más"]'); // 3 parts
    assert.equal(await page.locator('#fr-widget svg .fr-tap').count(), 3); assert.equal(await dens(), '3');
    await page.locator('#fr-widget svg .fr-tap').nth(2).click();
    assert.match(await page.locator('#fr-live').textContent(), /2 partes de 3 = 2\/3/);
    assert.match(await page.locator('#fr-live .fr-lab.num').textContent(), /Numerador = cuántas partes cogemos/);
    assert.match(await page.locator('#fr-live .fr-lab.den').textContent(), /Denominador = en cuántas partes partimos/);
    await shot(page, 'fractions-learn');
    for (let i = 1; i <= 3; i++) {
      assert.match(await page.locator('#fr-ex-label').textContent(), new RegExp(`${i} de 3`)); assert.match(await page.locator('#fr-ex-text').textContent(), /^Mira:/);
      if (i < 3) await page.click('#fr-ex-next');
    }
    assert.equal(await nums(), '2'); assert.equal(await dens(), '3', 'third example is 2/3');
    assert.equal(await shaded(), 2);
    assert.equal(await overflow(page), 0);
    assert.deepEqual(await smallTargets(page, '#fr-learn button'), []);
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-FRAC-FLOW: learn -> guided -> practice, wrong answer explained, skip and Aprender work, seen buffer saved', async () => {
  const { ctx, page, errors } = await open('fractions');
  try {
    await page.click('.fr-dot[data-unit="id1"]'); await page.waitForSelector('#fr-learn:not([hidden])');
    await page.click('#fr-ex-next'); await page.click('#fr-ex-next'); await page.click('#fr-learn-done');
    await page.waitForSelector('#fr-play:not([hidden])');
    assert.match(await page.locator('#fr-count').textContent(), /guiada 1 de 2/i);
    assert.ok((await page.locator('.fr-hintbox').textContent()).startsWith('Pista:'));
    // guided build: wrong first (nothing coloured), hint and retry, then right
    await page.click('#fr-check'); await page.waitForSelector('#fr-retry'); assert.ok((await page.locator('#fr-why').textContent()).length > 20);
    await page.click('#fr-retry');
    await answerFrac(page, true); await page.click('#fr-continue');
    await answerFrac(page, true); await page.click('#fr-continue');
    assert.match(await page.locator('#fr-count').textContent(), /^1 \/ 8$/);
    const res = await playFrac(page, { wrongFirst: true });
    assert.equal(res.answered, 8);
    const store = await page.evaluate(() => ({ prog: JSON.parse(localStorage.getItem('fractions_prog_guest')), seen: JSON.parse(localStorage.getItem('fractions_seen_guest')) }));
    assert.ok(store.prog.units.id1 && store.prog.learned.id1); assert.equal(store.seen.length, 8); assert.equal(new Set(store.seen).size, 8);
    await page.click('#fr-back'); await page.waitForSelector('#fr-home:not([hidden])');
    // learned lessons go straight to the questions; Aprender reopens the learn step; skip works
    await page.click('.fr-dot[data-unit="id1"]'); await page.waitForSelector('#fr-play:not([hidden])'); assert.equal(await page.locator('#fr-learn').isHidden(), true);
    await page.click('#fr-learnbtn'); await page.waitForSelector('#fr-learn:not([hidden])'); await page.click('#fr-skip'); await page.waitForSelector('#fr-play:not([hidden])');
    await page.click('#fr-quit');
    await page.click('.fr-dot[data-unit="id2"]'); await page.waitForSelector('#fr-learn:not([hidden])'); await page.click('#fr-skip'); await page.waitForSelector('#fr-play:not([hidden])');
    assert.match(await page.locator('#fr-count').textContent(), /^1 \/ 8$/, 'skip goes straight to practice');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-FRAC-ALL: every lesson plays to the end through the real UI, with a mistake explained, at 360 px', async () => {
  const { ctx, page, errors } = await open('fractions', { unlock: true, width: 360, height: 780 });
  try {
    const types = new Set(), whys = [];
    for (const id of FRAC_IDS) {
      await page.click(`.fr-dot[data-unit="${id}"]`); await page.waitForSelector('#fr-play:not([hidden])');
      const res = await playFrac(page, { wrongFirst: true });
      whys.push(...res.whys);
      assert.equal(await overflow(page), 0, id + ' end overflow');
      await page.click('#fr-back'); await page.waitForSelector('#fr-home:not([hidden])');
    }
    const seen = await page.evaluate(() => JSON.parse(localStorage.getItem('fractions_seen_guest')));
    seen.forEach(k => types.add(k.split('|')[0]));
    for (const k of ['f', 'cmp', 'eq', 'add', 'line', 'qty', 'mix', 'dec']) assert.ok(types.has(k), 'question family ' + k + ' shown: ' + [...types]);
    assert.ok(whys.length === 11 && whys.every(w => w.length > 20));
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-FRAC-LEARN-ALL: every learn widget responds to taps and fits 360 px', async () => {
  const { ctx, page, errors } = await open('fractions', { unlock: true, width: 360, height: 780 });
  try {
    for (const id of FRAC_IDS) {
      await page.click(`.fr-lbtn[data-learn="${id}"]`); await page.waitForSelector('#fr-learn:not([hidden])');
      const live0 = await page.locator('#fr-live').innerHTML();
      const texts = [];
      for (let i = 0; i < 3; i++) { texts.push(await page.locator('#fr-ex-text').textContent()); if (i < 2) await page.click('#fr-ex-next'); }
      assert.equal(new Set(texts).size, 3, id + ' three examples');
      const tap = page.locator('#fr-widget .fr-tap, #fr-widget .fr-chip, #fr-widget svg.line').first();
      const before = await page.locator('#fr-live').innerHTML();
      if (id === 'dec') await page.locator('#fr-widget .fr-chip').nth(0).click();
      else if (id === 'mixed') await page.locator('#fr-widget .fr-key').last().click();
      else if (id === 'line') { const b = await page.locator('#fr-widget svg.line').boundingBox(); await page.mouse.click(b.x + b.width * (20 + 260 * 0.25) / 300, b.y + b.height / 2); }
      else await tap.click();
      assert.notEqual(await page.locator('#fr-live').innerHTML(), before, id + ' live readout reacts to a tap');
      assert.ok(live0.length > 0);
      assert.equal(await overflow(page), 0, id + ' learn overflow');
      assert.deepEqual(await smallTargets(page, '#fr-learn button'), [], id);
      await page.click('#fr-l-quit'); await page.waitForSelector('#fr-home:not([hidden])');
    }
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});
