import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

// Dynamic questions (brief-dinamismo): zones, Juice feedback, new formats. Games: calcPath, mathMaster, tableMaster, typingMaster, englishVerbs.
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

const IGNORE = /favicon|Missing or insufficient permissions|unauthorized-domain|net::ERR|Failed to load resource|firestore\.googleapis|identitytoolkit|offline|WebChannel|manifest|speechSynthesis/i;
async function open(url, { width = 390, height = 844, init } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block', locale: 'es-ES' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !IGNORE.test(m.text())) errors.push(m.text()); });
  await page.addInitScript(() => { Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' }); try { localStorage.setItem('gh_sound', '0'); } catch (e) { /* ok */ } });
  if (init) await page.addInitScript(init);
  await page.goto(base + '/' + url, { waitUntil: 'load' });
  return { ctx, page, errors };
}
const noHScroll = async (page, where) => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), 'horizontal scroll at ' + where);
const juice = page => page.evaluate(() => document.querySelectorAll('.jx-float').length + document.querySelectorAll('.jx-ok').length + document.querySelectorAll('.jx-bad').length);
const box = async (page, sel) => { const b = await page.locator(sel).first().boundingBox(); assert.ok(b, sel + ' has a box'); return { x: b.x + b.width / 2, y: b.y + b.height / 2, w: b.width, h: b.height }; };
async function dragTo(page, fromSel, toSel) {
  const a = await box(page, fromSel), b = await box(page, toSel);
  await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move((a.x + b.x) / 2, (a.y + b.y) / 2, { steps: 4 }); await page.mouse.move(b.x, b.y, { steps: 4 }); await page.mouse.up();
}

// ====================================================== calcPath
const CALC = 'calcPath-EFC/index.html';
/** Replace the current lesson question with a fresh one of the given type and re-render it in the given format. */
const calcForce = (page, type, fmt) => page.evaluate(([t, f]) => { const S = CalcPath.state; S.fmt = f; S.locked = false; S.queue[0] = CalcPath.makeQuestion(S.u, t); CalcPath._next(); return { type: S.q.type, q: S.q }; }, [type, fmt]);
const calcWantV = q => q.type === 'build' ? String(q.exprs.findIndex(e => e.ok)) : q.type === 'missing' ? String(q.answer) : q.type === 'compare' || q.type === 'tf' ? String(q.answer) : String(q.res);

test('F-DYN calcPath lesson: zones, help, sound toggle, balloons by keyboard, drag by mouse, juice, wrong shows why', async () => {
  const { ctx, page, errors } = await open(CALC, { init: () => localStorage.setItem('calc_cfg_guest', JSON.stringify({ grade: 2, skills: ['suma'], length: 10, help: false, helpSet: true })) });
  try {
    await page.waitForSelector('.cp-dot[data-unit="a10"]');
    await page.click('.cp-dot[data-unit="a10"]'); await page.waitForSelector('#cp-play:not([hidden])');
    assert.match(await page.locator('#cp-qn').innerText(), /^Pregunta 1 de 10$/);
    for (const sel of ['#cp-help', '#cp-snd .jx-sound', '#cp-streak', '#cp-card .cp-zone.q', '#cp-card .cp-zone.a', '#cp-quit']) assert.ok(await page.locator(sel).first().isVisible(), sel + ' visible');
    const hb = await box(page, '#cp-help'); assert.ok(hb.h >= 47.5, 'help tap target');
    await noHScroll(page, 'lesson 390');

    // balloons: four floating options, keyboard 1-4, effect on a right answer
    let r = await calcForce(page, 'choice', 'balloon');
    await page.waitForFunction(() => document.querySelectorAll('.cp-balloon').length === 4);
    assert.match(await page.locator('#cp-card .cp-zone.a').innerText(), /globo/i);
    let idx = await page.evaluate(v => [...document.querySelectorAll('.cp-balloon')].findIndex(b => b.dataset.v === v), calcWantV(r.q));
    await page.keyboard.press(String(idx + 1));
    await page.waitForSelector('#cp-feedback.good'); assert.ok(await juice(page) > 0, 'juice effect on right answer');
    assert.ok(await page.locator('#cp-streak').innerText().then(s => s.includes('1')), 'streak shown');
    await page.keyboard.press('Enter'); await page.waitForSelector('#cp-feedback', { state: 'hidden' });

    // coloured buttons with shapes
    r = await calcForce(page, 'choice', 'plain');
    assert.equal(await page.locator('#cp-card .cp-opt .cp-sh').count(), 4);
    const colours = await page.locator('#cp-card .cp-opt').evaluateAll(bs => new Set(bs.map(b => getComputedStyle(b).backgroundColor)).size);
    assert.equal(colours, 4, 'four different colours');
    // wrong answer: the why is prominent
    idx = await page.evaluate(v => [...document.querySelectorAll('#cp-card .cp-opt')].findIndex(b => b.dataset.v !== v), calcWantV(r.q));
    await page.locator('#cp-card .cp-opt').nth(idx).click();
    await page.waitForSelector('#cp-feedback.bad'); assert.ok(await juice(page) > 0, 'juice on a wrong answer');
    const why = await page.locator('#cp-feedback .cp-explain').innerText(); assert.ok(why.length > 8, 'explanation: ' + why);
    assert.ok(await page.locator('#cp-card .cp-opt.ok').count() >= 1, 'right answer highlighted');
    await page.click('#cp-continue');

    // drag the number into the hole with the real mouse
    r = await calcForce(page, 'missing', 'drag');
    await page.waitForSelector('#cp-card .cp-hole');
    assert.equal(await page.locator('#cp-card .cp-drag').count(), 4);
    assert.match(await page.locator('#cp-card .cp-zone.a').innerText(), /Arrastra/i);
    idx = await page.evaluate(v => [...document.querySelectorAll('#cp-card .cp-drag')].findIndex(b => b.dataset.v === v), calcWantV(r.q));
    await dragTo(page, `#cp-card .cp-drag:nth-child(${idx + 1})`, '#cp-card .cp-hole');
    await page.waitForSelector('#cp-feedback.good');
    assert.equal((await page.locator('#cp-card .cp-hole').innerText()).trim(), calcWantV(r.q));
    await page.click('#cp-continue');
    // drag by keyboard (Enter on a focused chip) and a miss that snaps back
    r = await calcForce(page, 'missing', 'drag');
    await page.waitForSelector('#cp-card .cp-hole');
    const a = await box(page, '#cp-card .cp-drag:nth-child(1)');
    await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(a.x, a.y + 400, { steps: 5 }); await page.mouse.up();
    assert.equal(await page.locator('#cp-feedback').isHidden(), true, 'dropping far away does not answer');
    idx = await page.evaluate(v => [...document.querySelectorAll('#cp-card .cp-drag')].findIndex(b => b.dataset.v === v), calcWantV(r.q));
    await page.locator('#cp-card .cp-drag').nth(idx).focus(); await page.keyboard.press('Enter');
    await page.waitForSelector('#cp-feedback.good');
    // help
    await page.click('#cp-continue');
    await calcForce(page, 'type', 'plain'); await page.click('#cp-help'); assert.ok(await page.locator('#cp-hint').isVisible());
    assert.deepEqual(errors, [], errors.join(' | '));
  } finally { await ctx.close(); }
});

test('F-DYN calcPath practice: label, balloons and drag over a multiple-choice question, results stars', async () => {
  const { ctx, page, errors } = await open(CALC, { width: 1280, height: 800, init: () => localStorage.setItem('calc_cfg_guest', JSON.stringify({ grade: 5, skills: ['porcentajes'], length: 10, help: false, helpSet: true })) });
  try {
    await page.waitForSelector('#cp-m-practice'); await page.click('#cp-m-practice'); await page.click('#cp-set-go'); await page.waitForSelector('#cp-pplay:not([hidden])');
    await page.waitForFunction(() => CalcPath.state.practice && CalcPath.state.practice.q && !CalcPath.state.practice.locked);
    assert.match(await page.locator('#pp-qn').innerText(), /^Pregunta 1 de 10$/);
    assert.ok(await page.locator('#pp-help').isVisible() && await page.locator('#pp-snd .jx-sound').isVisible());
    await noHScroll(page, 'practice 1280');
    const q0 = await page.evaluate(() => { CalcPath.state.fmt = 'balloon'; CalcPath._renderQ(); return CalcPath.state.practice.q.answer; });
    await page.waitForSelector('#pp-card .cp-balloon');
    await page.locator('#pp-card .cp-balloon').evaluateAll((bs, a) => bs.find(b => b.dataset.v === String(a)).click(), q0);
    await page.waitForSelector('#pp-feedback.good'); assert.ok(await juice(page) > 0);
    await page.click('#pp-continue'); await page.waitForFunction(() => !CalcPath.state.practice.locked);
    // stop the run: summary with animated stars
    await page.click('#pp-quit'); await page.waitForSelector('#cp-psum:not([hidden])');
    assert.ok(await page.locator('#cp-psum .cp-star').count() === 3, 'three stars');
    assert.deepEqual(errors, [], errors.join(' | '));
  } finally { await ctx.close(); }
});

// ====================================================== mathMaster
const MATH = 'mathMaster-EFC/index.html';
async function mathStart(page, op, level = 1, n = 20) {
  await page.waitForSelector('#selection-screen.active');
  await page.click(`.operation-btn[data-operation="${op}"]`);
  if (op !== 'tablas') await page.click(`.level-btn[data-level="${level}"]`);
  await page.click(`.questions-btn[data-questions="${n}"]`);
  await page.click('#start-btn'); await page.waitForSelector('#game-screen.active');
  await page.waitForFunction(() => gameState.isPlaying && gameState.currentQuestion);
}
const mathIdx = (page, sel) => page.evaluate(s => [...document.querySelectorAll(s)].findIndex(b => b.dataset.v === String(Math.round(gameState.currentAnswer * 1000) / 1000)), sel);

test('F-DYN mathMaster: labels, balloon with keyboard, drag into the hole, wrong shows the why, no scroll', async () => {
  const { ctx, page, errors } = await open(MATH);
  try {
    await mathStart(page, 'huecos', 1, 20);
    assert.match(await page.locator('#mm-qn').innerText(), /^Pregunta 1 de 20$/);
    for (const sel of ['#mm-help', '#mm-snd .jx-sound', '#mm-zq', '#mm-za', '#streak', '#progress-container']) assert.ok(await page.locator(sel).isVisible(), sel);
    // question 1 is a balloon question
    await page.waitForSelector('.mm-balloon'); assert.equal(await page.locator('.mm-balloon').count(), 4);
    assert.ok(await page.locator('#numpad').isHidden(), 'keypad hidden while popping balloons');
    await noHScroll(page, 'math balloon 390');
    // a wrong balloon first: gentle, the hint shows
    const wrong = await page.evaluate(() => [...document.querySelectorAll('.mm-balloon')].findIndex(b => b.dataset.v !== String(gameState.currentAnswer)));
    await page.locator('.mm-balloon').nth(wrong).click({ force: true });
    await page.waitForFunction(() => document.querySelector('#feedback-text.incorrect')); assert.ok(await juice(page) > 0);
    assert.ok((await page.locator('#hint-text').innerText()).length > 3, 'hint after a miss');
    assert.equal(await page.locator('.mm-balloon:disabled').count(), 1);
    let i = await mathIdx(page, '.mm-balloon'); await page.keyboard.press(String(i + 1));
    await page.waitForFunction(() => gameState.correctAnswers === 1);
    assert.match(await page.locator('#score').innerText(), /^1 \/ 20/);
    assert.ok(await page.locator('#hint-text.mm-why').innerText().then(s => s.includes('=')), 'full equation shown');
    // question 2 has a hole: drag
    await page.waitForFunction(() => gameState.currentQuestion && document.querySelector('.mm-hole'));
    assert.match(await page.locator('#mm-qn').innerText(), /^Pregunta 2 de 20$/);
    assert.equal(await page.locator('.mm-drag').count(), 4);
    i = await mathIdx(page, '.mm-drag');
    await dragTo(page, `.mm-drag:nth-child(${i + 1})`, '.mm-hole');
    await page.waitForFunction(() => gameState.correctAnswers === 2);
    assert.ok(await page.locator('.mm-hole.ok').count() === 1);
    // question 3 keeps the classic keypad
    await page.waitForFunction(() => document.querySelector('#game-screen').dataset.fmt === 'type' && !document.querySelector('.mm-hole'));
    assert.ok(await page.locator('#numpad').isVisible());
    await page.evaluate(() => { document.getElementById('answer-input').value = String(gameState.currentAnswer); checkAnswer(); });
    await page.waitForFunction(() => gameState.correctAnswers === 3);
    assert.deepEqual(errors, [], errors.join(' | '));
  } finally { await ctx.close(); }
});

test('F-DYN mathMaster desktop: balloons use the width, three misses reveal the answer', async () => {
  const { ctx, page, errors } = await open(MATH, { width: 1280, height: 800 });
  try {
    await mathStart(page, 'suma', 2, 20);
    await page.waitForSelector('.mm-balloon');
    const b = await page.locator('.mm-sky').boundingBox(); assert.ok(b.width > 420, 'sky is wide: ' + b.width);
    for (let k = 0; k < 3; k++) {
      const w = await page.evaluate(() => [...document.querySelectorAll('.mm-balloon:not(:disabled)')].findIndex(x => x.dataset.v !== String(Math.round(gameState.currentAnswer * 1000) / 1000)));
      await page.locator('.mm-balloon:not(:disabled)').nth(w).click({ force: true });
      await page.waitForTimeout(150);
    }
    await page.waitForFunction(() => gameState.revealing); assert.ok(await page.locator('.mm-balloon.ok').count() === 1, 'right balloon revealed');
    assert.match(await page.locator('#hint-text').innerText(), /=/);
    await noHScroll(page, 'math desktop');
    assert.deepEqual(errors, [], errors.join(' | '));
  } finally { await ctx.close(); }
});

// ====================================================== tableMaster
const TABLE = 'tableMaster-EFC/index.html';
const tmAnswer = page => page.evaluate(() => TableMasterGame._drill.current.answer);
test('F-DYN tableMaster drill: coloured grid, keypad, speed round with soft bar, wrong shows the why, stars at the end', async () => {
  const { ctx, page, errors } = await open(TABLE);
  try {
    await page.waitForSelector('[data-drill="table"]'); await page.click('[data-drill="table"]');
    await page.click('.tm-chip[data-table="7"]'); await page.evaluate(() => { TMDyn.S.fmt = 'grid'; }); await page.click('#btn-drill-start');
    await page.waitForSelector('#screen-drill.active .tmd-opt');
    assert.match(await page.locator('#tmd-qn').innerText(), /^Pregunta 1 de 10$/);
    for (const sel of ['#tmd-help', '#tmd-snd .jx-sound', '#tmd-zq', '#tmd-za', '#drill-hud-streak', '#drill-qcard']) assert.ok(await page.locator(sel).isVisible(), sel);
    assert.equal(await page.locator('#tmd-stage .tmd-opt').count(), 6, 'grid of six tiles');
    assert.equal(await page.locator('#tmd-stage .tmd-opt').evaluateAll(bs => new Set(bs.map(b => getComputedStyle(b).backgroundColor)).size), 6, 'six colours');
    assert.ok(await page.locator('#drill-numpad').isHidden());
    await noHScroll(page, 'drill grid 390');
    // help: strategy, never the answer
    await page.click('#tmd-help'); assert.ok(await page.locator('#tmd-hint').isVisible());
    // wrong tile: explanation is prominent
    const ans = await tmAnswer(page);
    const wi = await page.evaluate(a => [...document.querySelectorAll('#tmd-stage .tmd-opt')].findIndex(b => b.dataset.v !== String(a)), ans);
    await page.locator('#tmd-stage .tmd-opt').nth(wi).click();
    await page.waitForSelector('#drill-feedback.bad .tm-fb-worked'); assert.ok(await juice(page) > 0);
    assert.ok(await page.locator('#tmd-stage .tmd-opt.ok').count() === 1 && await page.locator('#tmd-stage .tmd-opt.bad').count() === 1);
    await page.evaluate(() => { TMDyn.S.fmt = 'type'; });
    await page.click('#drill-next');
    // question 2: classic keypad
    await page.waitForFunction(() => document.getElementById('screen-drill').dataset.fmt === 'type');
    assert.ok(await page.locator('#drill-numpad').isVisible());
    const a2 = String(await tmAnswer(page));
    for (const ch of a2) await page.click(`#drill-numpad [data-key="${ch}"]`);
    await page.click('#drill-key-ok'); await page.waitForSelector('#drill-feedback.ok'); assert.ok(await juice(page) > 0);
    // question 3: speed round, keyboard
    await page.evaluate(() => { TMDyn.S.fmt = 'speed'; });
    await page.waitForFunction(() => document.getElementById('screen-drill').dataset.fmt === 'speed');
    assert.equal(await page.locator('#tmd-stage .tmd-opt').count(), 3); assert.ok(await page.locator('.tmd-soft').isVisible());
    const a3 = await tmAnswer(page);
    const ri = await page.evaluate(a => [...document.querySelectorAll('#tmd-stage .tmd-opt')].findIndex(b => b.dataset.v === String(a)), a3);
    await page.locator('#tmd-stage .tmd-opt').nth(ri).focus(); await page.keyboard.press('Enter');
    await page.waitForSelector('#drill-feedback.ok');
    assert.ok(await page.evaluate(() => TableMasterGame._drill.correct) === 2);
    // finish the round, stars appear
    await page.evaluate(() => { const g = TableMasterGame; for (let i = 0; i < 20 && !g._drill.ended; i++) { if (g._drill.idx >= g._drill.total - 1 && g._drill.asked >= g._drill.total) break; g._drillNext(); if (g._drill.ended) break; g._drill.answer = String(g._drill.current.answer); g._drillSubmit(); } g._drillNext(); });
    await page.waitForSelector('#screen-drill-result.active');
    assert.equal(await page.locator('#drill-stars .tm-big-star').count(), 3);
    assert.deepEqual(errors, [], errors.join(' | '));
  } finally { await ctx.close(); }
});

test('F-DYN tableMaster desktop and practice screen: label, sound toggle, no scroll', async () => {
  const { ctx, page, errors } = await open(TABLE, { width: 1280, height: 800 });
  try {
    await page.waitForSelector('[data-drill="timed"]'); await page.click('[data-drill="timed"]'); await page.evaluate(() => { TMDyn.S.fmt = 'speed'; }); await page.click('#btn-drill-start');
    await page.waitForSelector('#screen-drill.active #tmd-stage .tmd-opt');
    const b = await page.locator('#tmd-stage').boundingBox(); assert.ok(b.width > 400, 'tiles use the width ' + b.width);
    assert.match(await page.locator('#tmd-qn').innerText(), /^Pregunta 1$/);
    await noHScroll(page, 'drill desktop');
    await page.evaluate(() => { TableMasterGame._drill.ended = true; TableMasterGame._stopDrillTimers(); });
    await page.goto(base + '/' + TABLE, { waitUntil: 'load' });
    await page.waitForSelector('#btn-practice-multiply'); await page.click('#btn-practice-multiply'); await page.waitForSelector('#screen-practice-select.active');
    await page.locator('#level-grid .tm-level-btn').first().click(); await page.waitForSelector('#screen-practice.active #practice-exercise-area *');
    assert.match(await page.locator('#tmp-qn').innerText(), /^Pregunta 1 de \d+$/);
    assert.ok(await page.locator('#tmp-snd .jx-sound').isVisible() && await page.locator('#tmp-help').isVisible());
    assert.deepEqual(errors, [], errors.join(' | '));
  } finally { await ctx.close(); }
});

// ====================================================== typingMaster
const TYPING = 'typingMaster-EFC/index.html';
/** keyboard.press cannot send n-tilde: dispatch the keydown the game listens to. */
const pk = (page, k) => /^[ -~]$/.test(k) && k !== ' ' ? page.keyboard.press(k) : page.evaluate(key => document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })), k);
test('F-DYN typingMaster game screen: zones, help, streak, juice on words, stars one by one at the end', async () => {
  const { ctx, page, errors } = await open(TYPING);
  try {
    await page.waitForSelector('.ty-level-btn[data-level="1"]'); await page.click('.ty-level-btn[data-level="1"]'); await page.click('#ty-start-btn');
    await page.waitForSelector('#ty-lesson.active'); await page.click('#ty-lesson-skip');
    await page.waitForSelector('#ty-game.active');
    assert.match(await page.locator('#tyd-qn').innerText(), /^Nivel 1 · Letra 1 de \d+$/);
    for (const sel of ['#tyd-help', '#tyd-snd .jx-sound', '#tyd-zq', '#tyd-streak', '#ty-text-display']) assert.ok(await page.locator(sel).isVisible(), sel);
    await page.click('#tyd-help'); assert.match(await page.locator('#tyd-hint').innerText(), /dedo/);
    await noHScroll(page, 'typing game 390');
    const text = await page.evaluate(() => TypeMasterGame.state.text);
    await pk(page, text[0] === 'z' ? 'q' : 'z');            // a wrong key: streak 0, soft effect
    assert.ok(await juice(page) > 0, 'soft effect on a wrong key');
    for (const ch of text.slice(1)) await pk(page, ch);
    await page.waitForSelector('#ty-result.active');
    assert.equal(await page.locator('#ty-stars .tyd-star').count(), 3);
    assert.deepEqual(errors, [], errors.join(' | '));
  } finally { await ctx.close(); }
});

test('F-DYN typingMaster mini mode: letter rain (keyboard and tap, soft timer, no game over)', async () => {
  const { ctx, page, errors } = await open(TYPING);
  try {
    await page.waitForSelector('#ty-rain-btn'); assert.ok(await page.locator('#ty-rain-btn').isVisible() && await page.locator('#ty-miss-btn').isVisible());
    await page.evaluate(() => { TyDyn.S.rainMs = 12000; });
    await page.click('#ty-rain-btn'); await page.waitForSelector('#ty-mini.active .tyd-drop');
    for (const sel of ['#tym-help', '#tym-snd .jx-sound', '#tym-zq', '#tym-za', '#tym-bar', '#tym-quit']) assert.ok(await page.locator(sel).first().isVisible(), sel);
    await noHScroll(page, 'rain 390');
    const ch = await page.locator('.tyd-drop').first().getAttribute('data-ch');
    await pk(page, ch);
    await page.waitForFunction(() => TyDyn.S.run.score >= 1); assert.ok(await juice(page) > 0);
    await page.waitForSelector('.tyd-drop:not(.popped):not(.missed)');
    await page.evaluate(() => document.querySelector('.tyd-drop:not(.popped):not(.missed)').click());      // tap works too
    await page.waitForFunction(() => TyDyn.S.run.score >= 2);
    await page.click('#tym-help'); assert.ok(await page.locator('#tym-hint').isVisible());
    await page.waitForSelector('#tym-end:not([hidden])', { timeout: 20000 });
    assert.equal(await page.locator('#tym-end-stars .tyd-star').count(), 3);
    await page.click('#tym-menu'); await page.waitForSelector('#ty-home.active');
    assert.deepEqual(errors, [], errors.join(' | '));
  } finally { await ctx.close(); }
});

test('F-DYN typingMaster mini mode: missing letter, 10 questions, keyboard and buttons, wrong shows the word', async () => {
  const { ctx, page, errors } = await open(TYPING, { width: 1280, height: 800 });
  try {
    await page.waitForSelector('#ty-miss-btn'); await page.click('#ty-miss-btn'); await page.waitForSelector('#ty-mini.active .tyd-opt');
    assert.match(await page.locator('#tym-qn').innerText(), /^Pregunta 1 de 10$/);
    assert.equal(await page.locator('.tyd-opt').count(), 4);
    assert.equal(await page.locator('.tyd-opt').evaluateAll(bs => new Set(bs.map(b => getComputedStyle(b).backgroundColor)).size), 4);
    // wrong first: the word and the finger are shown
    const ans = () => page.evaluate(() => TyDyn.S.run.ans);
    const wrong = await page.evaluate(() => [...document.querySelectorAll('.tyd-opt')].find(b => b.dataset.ch !== TyDyn.S.run.ans).dataset.ch);
    await page.locator(`.tyd-opt[data-ch="${wrong}"]`).click();
    await page.waitForSelector('#tym-fb.bad'); assert.ok(await juice(page) > 0);
    assert.match(await page.locator('#tym-fb').innerText(), /La palabra es \p{L}+/u);
    await page.click('#tym-next');
    for (let i = 2; i <= 10; i++) {
      await page.waitForFunction(k => TyDyn.S.run.n === k - 1 && !TyDyn.S.run.locked, i);
      await pk(page, await ans());                      // typing the letter answers
      await page.waitForFunction(k => TyDyn.S.run.n === k, i);
      if (i < 10) await page.keyboard.press('Enter');
    }
    await page.keyboard.press('Enter');
    await page.waitForSelector('#tym-end:not([hidden])');
    assert.equal(await page.locator('#tym-end-stars .tyd-star').count(), 3);
    assert.match(await page.locator('#tym-end-score').innerText(), /9 \/ 10/);
    assert.deepEqual(errors, [], errors.join(' | '));
  } finally { await ctx.close(); }
});

// ====================================================== englishVerbs
const VERBS = 'englishVerbs-EFC/index.html';
const evEx = page => page.evaluate(() => { const s = EnglishVerbsGame._state; return s.groupPracticeExercises[s.groupPracticeIndex]; });
async function evMode(page, kind) {
  await page.waitForSelector('#ev-tabBtn-niveles'); await page.click('#ev-tabBtn-niveles');
  const idx = ['past', 'part', 'meaning', 'type', 'listen', 'order', 'odd'].indexOf(kind);
  await page.locator('.ev-mode-card').nth(idx).click(); await page.waitForSelector('#ev-screen-game.active');
}
test('F-DYN englishVerbs order format: drag with the mouse, keyboard, wrong order explained, zones and help', async () => {
  const { ctx, page, errors } = await open(VERBS);
  try {
    await evMode(page, 'order'); await page.waitForSelector('.evd-slots');
    assert.equal(await page.locator('.ev-mode-card').count(), 7);
    assert.match(await page.locator('#evd-qn').innerText(), /^Pregunta 1 de 10$/);
    for (const sel of ['#evd-help', '#evd-snd .jx-sound', '.evd-zone.q', '.evd-zone.a', '#evd-streak']) assert.ok(await page.locator(sel).first().isVisible(), sel);
    assert.equal(await page.locator('.evd-slot').count(), 3); assert.equal(await page.locator('.evd-chip:visible').count(), 3);
    await noHScroll(page, 'order 390');
    await page.click('#evd-help'); assert.ok(await page.locator('#evd-hint').isVisible());
    // Q1: drag each chip into its slot with the real mouse
    let ex = await evEx(page);
    for (let i = 0; i < 3; i++) {
      const k = await page.evaluate(([f, used]) => [...document.querySelectorAll('.evd-chip')].findIndex((c, ci) => !c.hidden && c.dataset.form === f), [ex.answer[i], i]);
      await dragTo(page, `.evd-chip:nth-child(${k + 1})`, `.evd-slot:nth-child(${i + 1})`);
    }
    await page.waitForFunction(() => !document.getElementById('evd-check').disabled);
    await page.click('#evd-check');
    await page.waitForSelector('#ev-feedback.correct'); assert.ok(await juice(page) > 0);
    assert.equal(await page.locator('.evd-slot.ok').count(), 3);
    await page.click('#ev-next-btn');
    // Q2: keyboard only (Enter on a focused chip fills the next free slot), in the right order
    await page.waitForFunction(() => EnglishVerbsGame._state.groupPracticeIndex === 1 && document.querySelectorAll('.evd-chip').length === 3);
    ex = await evEx(page);
    for (let i = 0; i < 3; i++) {
      const k = await page.evaluate(f => [...document.querySelectorAll('.evd-chip')].findIndex(c => !c.hidden && c.dataset.form === f), ex.answer[i]);
      await page.locator('.evd-chip').nth(k).focus(); await page.keyboard.press('Enter');
    }
    await page.locator('#evd-check').focus(); await page.keyboard.press('Enter');
    await page.waitForSelector('#ev-feedback.correct');
    assert.equal(await page.evaluate(() => EnglishVerbsGame._state.correct), 2);
    await page.click('#ev-next-btn');
    // Q3: a wrong order: nothing is lost but the streak, and the right order is shown
    await page.waitForFunction(() => EnglishVerbsGame._state.groupPracticeIndex === 2 && document.querySelectorAll('.evd-chip').length === 3);
    ex = await evEx(page);
    const wrongOrder = [ex.answer[1], ex.answer[0], ex.answer[2]];
    if (ex.answer[1] === ex.answer[0]) wrongOrder.splice(0, 3, ex.answer[2], ex.answer[1], ex.answer[0]);
    for (const f of wrongOrder) { const k = await page.evaluate(f2 => [...document.querySelectorAll('.evd-chip')].findIndex(c => !c.hidden && c.dataset.form === f2), f); await page.locator('.evd-chip').nth(k).click(); }
    await page.click('#evd-check');
    await page.waitForSelector('#ev-feedback.wrong'); assert.ok(await juice(page) > 0);
    assert.ok((await page.locator('#ev-feedback').innerText()).includes(ex.answer[1]), 'explanation shows the forms');
    assert.equal(await page.evaluate(() => EnglishVerbsGame._state.streak), 0);
    assert.deepEqual(errors, [], errors.join(' | '));
  } finally { await ctx.close(); }
});

test('F-DYN englishVerbs irregular-verb tiles: coloured, keyboard 1-4, wrong explained, animated stars', async () => {
  const { ctx, page, errors } = await open(VERBS, { width: 1280, height: 800 });
  try {
    await evMode(page, 'odd'); await page.waitForSelector('.ev-option-btn');
    assert.equal(await page.locator('.ev-option-btn').count(), 4);
    assert.equal(await page.locator('.ev-option-btn').evaluateAll(bs => new Set(bs.map(b => getComputedStyle(b).backgroundColor)).size), 4);
    assert.match(await page.locator('.evd-zone.a').innerText(), /Elige/i);
    const ob = await page.locator('.ev-options').boundingBox(); assert.ok(ob.width > 500, 'tiles use the width');
    // wrong first
    let ex = await evEx(page);
    let wi = await page.evaluate(a => [...document.querySelectorAll('.ev-option-btn')].findIndex(b => b.querySelector('span').textContent !== a), ex.answer);
    await page.locator('.ev-option-btn').nth(wi).click();
    await page.waitForSelector('#ev-feedback.wrong'); assert.ok(await juice(page) > 0);
    assert.match(await page.locator('#ev-feedback').innerText(), /regulares solo a.aden -ed/);
    await page.click('#ev-next-btn');
    for (let i = 1; i < 10; i++) {
      await page.waitForFunction(k => EnglishVerbsGame._state.groupPracticeIndex === k && !EnglishVerbsGame._state.answered, i);
      ex = await evEx(page);
      const ci = await page.evaluate(a => [...document.querySelectorAll('.ev-option-btn')].findIndex(b => b.querySelector('span').textContent === a), ex.answer);
      await page.keyboard.press(String(ci + 1));
      await page.waitForSelector('#ev-feedback.correct'); await page.click('#ev-next-btn');
    }
    await page.waitForSelector('#ev-screen-results.active');
    assert.equal(await page.locator('#ev-result-stars .evd-star').count(), 3);
    assert.deepEqual(errors, [], errors.join(' | '));
  } finally { await ctx.close(); }
});
