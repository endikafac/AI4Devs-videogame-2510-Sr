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
async function open(ctx0) {
  const ctx = ctx0 || await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !IGNORE.test(m.text())) errors.push(m.text()); });
  await page.addInitScript(() => Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' }));
  await page.goto(base + '/calcPath-EFC/index.html', { waitUntil: 'load' });
  await page.waitForSelector('#cp-m-practice');
  return { ctx, page, errors };
}
const noHScroll = async (page, where) => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), 'horizontal scroll at ' + where);
const getQ = page => page.evaluate(() => { const r = CalcPath.state.practice; return r && r.q ? { key: r.q.key, skill: r.q.skill, kind: r.q.kind, answer: r.q.answer, level: r.q.level, text: r.q.text } : null; });
const waitQ = (page, prevKey) => page.waitForFunction(k => { const r = CalcPath.state.practice; return !!(r && r.q && !r.locked && r.q.key !== k); }, prevKey, { timeout: 8000 });
/** Answer through the real UI: option buttons for choices, the on-screen keypad otherwise. */
async function answerUI(page, q) {
  if (q.kind === 'choice') {
    await page.locator('#pp-card .cp-opt').evaluateAll((bs, a) => { const b = bs.find(x => x.dataset.v === String(a)); b.click(); }, q.answer);
    return;
  }
  for (const ch of String(q.answer).replace('.', ',')) await page.click(`#pp-card .cp-key[data-k="${ch}"]`);
  await page.click('#pp-card .cp-key[data-k="✓"]');
}
const stored = (page, prefix) => page.evaluate(p => { const k = Object.keys(localStorage).find(x => x.startsWith(p)); return k ? JSON.parse(localStorage.getItem(k)) : null; }, prefix);

test('F-CALCPRACTICE: first-run grade question, setup, 12 questions through the real UI, summary, persistence', async () => {
  const { ctx, page, errors } = await open();
  try {
    // first run: the grade is asked inline, the lesson path is still there
    assert.ok(await page.locator('#cp-ask').isVisible(), 'grade question');
    assert.equal(await page.locator('#cp-ask-chips .cp-chip[data-grade]').count(), 6);
    assert.ok(await page.locator('#cp-ask-dk').isVisible(), 'I do not know');
    assert.equal(await page.locator('.cp-dot').count(), 14, 'path kept');
    for (const sel of ['#cp-m-practice', '#cp-m-place', '#cp-ask-chips .cp-chip']) {
      const b = await page.locator(sel).first().boundingBox(); assert.ok(b.height >= 47.5 && b.width >= 47.5, sel + ' tap target ' + b.width + 'x' + b.height);
    }
    await noHScroll(page, 'home first run');
    // practice before answering: the question is highlighted, nothing opens
    await page.click('#cp-m-practice');
    assert.ok(await page.locator('#cp-home').isVisible() && await page.locator('#cp-setup').isHidden());
    await page.click('#cp-ask-chips .cp-chip[data-grade="1"]');
    assert.ok(await page.locator('#cp-ask').isHidden());
    assert.match(await page.locator('#cp-grade-line').innerText(), /1º de primaria/);
    assert.equal((await stored(page, 'calc_cfg_')).grade, 1);

    // setup for grade 1: only grade 1 skills, help on by default
    await page.click('#cp-m-practice');
    await page.waitForSelector('#cp-setup:not([hidden])');
    const skills = await page.locator('#cp-set-skills .cp-chip[data-skill]').evaluateAll(b => b.map(x => x.dataset.skill).sort());
    assert.deepEqual(skills, ['huecos', 'mental', 'multiplicar', 'resta', 'suma']);
    assert.ok(await page.locator('#cp-set-help').isChecked(), 'extra help is on for grade 1');
    assert.equal(await page.locator('#cp-set-len .cp-chip').count(), 3);
    await noHScroll(page, 'setup');
    await page.click('#cp-set-len .cp-chip[data-len="20"]');
    await page.click('#cp-set-grade .cp-chip[data-grade="2"]');
    assert.ok((await page.locator('#cp-set-skills .cp-chip[data-skill]').count()) === 6, 'grade 2 adds division');
    await page.click('#cp-set-grade .cp-chip[data-grade="1"]');
    assert.equal(await page.locator('#cp-set-skills .cp-chip[data-skill]').count(), 5);
    await page.click('#cp-set-go');
    await page.waitForSelector('#cp-pplay:not([hidden])');

    // play 12 questions answering correctly
    const keys = new Set(); let prev = null, usedHint = false;
    for (let i = 0; i < 12; i++) {
      await waitQ(page, prev);
      const q = await getQ(page);
      assert.ok(!keys.has(q.key), 'repeat ' + q.key); keys.add(q.key); prev = q.key;
      assert.ok(skills.includes(q.skill) && q.level <= 4, `grade 1 question out of band: ${q.skill} L${q.level}`);
      assert.ok(typeof q.answer === 'number' && q.answer >= 0, 'no negatives');
      assert.ok(await page.locator('#pp-eq').isVisible());
      if (i === 0) {
        assert.ok(await page.locator('#pp-hintbtn').isVisible(), 'hint button with extra help');
        await page.click('#pp-hintbtn'); usedHint = true;
        assert.ok(await page.locator('#pp-hint').isVisible());
        await noHScroll(page, 'question');
      }
      await answerUI(page, q);
      await page.waitForSelector('#pp-continue');
      assert.ok(await page.locator('#pp-feedback.good').isVisible(), 'correct feedback');
      await page.click('#pp-continue');
    }
    assert.ok(usedHint);
    assert.equal(await page.locator('#pp-count').innerText().then(s => s.replace('🔥 ', '')), '13 / 20');
    // a wrong answer shows the right one and the short explanation
    await waitQ(page, prev);
    const wq = await getQ(page);
    await page.click('#pp-card .cp-key[data-k="1"]'); await page.click('#pp-card .cp-key[data-k="1"]'); await page.click('#pp-card .cp-key[data-k="1"]');
    await page.click('#pp-card .cp-key[data-k="✓"]');
    await page.waitForSelector('#pp-continue');
    assert.ok(await page.locator('#pp-feedback.bad').isVisible());
    assert.ok((await page.locator('#pp-feedback').innerText()).includes(String(wq.answer)), 'shows the right answer');
    assert.ok(await page.locator('#pp-feedback .cp-explain').innerText().then(s => s.length > 3), 'explanation shown');
    await noHScroll(page, 'feedback');
    await page.click('#pp-continue');

    // finish: summary
    await page.click('#pp-quit');
    await page.waitForSelector('#cp-psum:not([hidden])');
    const sum = await page.locator('#cp-psum').innerText();
    assert.match(sum, /12 de 13 correctas/);
    assert.match(sum, /Tiempo medio/);
    assert.ok(await page.locator('#cp-psum .cp-row').count() >= 1, 'per skill rows');
    await noHScroll(page, 'summary');
    // persistence: skills state, seen keys, config
    const skillsSt = await stored(page, 'calc_skills_'); assert.ok(Object.keys(skillsSt).length === 5 && Object.values(skillsSt).some(s => s.n > 0));
    const seen = await stored(page, 'calc_seen_'); assert.ok(Array.isArray(seen) && seen.length >= 13);
    await page.click('#cp-p-home');
    await page.reload({ waitUntil: 'load' });
    await page.waitForSelector('#cp-m-practice');
    assert.ok(await page.locator('#cp-ask').isHidden(), 'grade remembered');
    // second session never repeats the first one
    await page.click('#cp-m-practice'); await page.waitForSelector('#cp-setup:not([hidden])');
    assert.equal(await page.locator('#cp-set-len .cp-chip.on').getAttribute('data-len'), '20', 'last choices remembered');
    await page.click('#cp-set-go');
    const again = []; prev = null;
    for (let i = 0; i < 6; i++) { await waitQ(page, prev); const q = await getQ(page); again.push(q.key); prev = q.key; await answerUI(page, q); await page.click('#pp-continue'); }
    for (const k of again) assert.ok(!seen.includes(k), 'repeated across sessions: ' + k);
    assert.deepEqual(errors, [], errors.join(' | '));
  } finally { await ctx.close(); }
});

test('F-CALCPRACTICE: grade 5, decimals use the comma keypad, percentages are multiple choice', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('calc_cfg_guest')) localStorage.setItem('calc_cfg_guest', JSON.stringify({ grade: 5, skills: ['decimales', 'porcentajes'], length: 10, help: false, helpSet: true })); } catch (e) {} });
  const { page, errors } = await open(ctx);
  try {
    // the owner key depends on the sign-in state, so write the config under whatever key the page uses
    await page.evaluate(() => { const k = Object.keys(localStorage).find(x => x.startsWith('calc_cfg_')) || 'calc_cfg_guest'; localStorage.setItem(k, JSON.stringify({ grade: 5, skills: ['decimales', 'porcentajes'], length: 10, help: false, helpSet: true })); });
    await page.reload({ waitUntil: 'load' }); await page.waitForSelector('#cp-m-practice');
    await page.click('#cp-m-practice'); await page.waitForSelector('#cp-setup:not([hidden])');
    assert.equal(await page.locator('#cp-set-skills .cp-chip[data-skill]').count(), 9, 'grade 5 sees every skill');
    assert.equal(await page.locator('#cp-set-skills .cp-chip.on[data-skill]').count(), 2);
    assert.ok(!(await page.locator('#cp-set-help').isChecked()), 'help off by choice');
    await page.click('#cp-set-go'); await page.waitForSelector('#cp-pplay:not([hidden])');
    let prev = null, sawDec = false, sawChoice = false;
    for (let i = 0; i < 10; i++) {
      await waitQ(page, prev); const q = await getQ(page); prev = q.key;
      assert.ok(['decimales', 'porcentajes'].includes(q.skill));
      assert.equal(await page.locator('#pp-hintbtn').count(), 0, 'no hint button without extra help');
      if (q.kind === 'dec') { sawDec = true; assert.equal(await page.locator('#pp-card .cp-key[data-k=","]').count(), 1, 'comma key'); }
      if (q.kind === 'choice') { sawChoice = true; assert.equal(await page.locator('#pp-card .cp-opt').count(), 4); }
      await answerUI(page, q);
      await page.click('#pp-continue');
    }
    assert.ok(sawDec && sawChoice, 'decimal and percentage questions both appeared');
    await noHScroll(page, 'grade 5');
    await page.waitForSelector('#cp-psum:not([hidden])');
    assert.match(await page.locator('#cp-psum').innerText(), /10 de 10 correctas/);
    assert.deepEqual(errors, [], errors.join(' | '));
  } finally { await ctx.close(); }
});

test('F-CALCPRACTICE: placement test reaches the result screen, stores levels and goes to the setup; cancel works', async () => {
  const { ctx, page, errors } = await open();
  try {
    await page.click('#cp-ask-chips .cp-chip[data-grade="3"]');
    // cancel from the intro and from the middle
    await page.click('#cp-m-place'); await page.waitForSelector('#cp-pintro:not([hidden])');
    assert.match(await page.locator('#cp-pintro').innerText(), /opcional/i);
    await noHScroll(page, 'placement intro');
    await page.click('#cp-pi-no'); await page.waitForSelector('#cp-home:not([hidden])');
    await page.click('#cp-m-place'); await page.click('#cp-pi-go'); await page.waitForSelector('#cp-pplay:not([hidden])');
    assert.equal(await page.locator('#pp-hintbtn').count(), 0, 'no hints in the test');
    const q0 = await getQ(page); await answerUI(page, q0); // no feedback bar in the test
    assert.ok(await page.locator('#pp-feedback').isHidden());
    await page.click('#pp-quit'); await page.waitForSelector('#cp-home:not([hidden])');
    assert.equal(await stored(page, 'calc_skills_'), null, 'cancelling stores nothing');

    // full run answering everything correctly
    await page.click('#cp-m-place'); await page.click('#cp-pi-go'); await page.waitForSelector('#cp-pplay:not([hidden])');
    const total = await page.evaluate(() => CalcPath.state.practice.len);
    assert.ok(total >= 15 && total <= 24, 'questions ' + total);
    const keys = new Set(); let prev = null, n = 0;
    for (;;) {
      if (await page.locator('#cp-pres').isVisible()) break;
      await waitQ(page, prev); const q = await getQ(page);
      assert.ok(!keys.has(q.key)); keys.add(q.key); prev = q.key; n++;
      await answerUI(page, q);
      await page.waitForFunction(k => { const r = CalcPath.state.practice; return !document.getElementById('cp-pres').hidden || (r && r.q && !r.locked && r.q.key !== k); }, prev, { timeout: 8000 });
    }
    assert.equal(n, total);
    assert.ok(await page.locator('#cp-pr-list .cp-row.res').count() >= 6, 'per skill result');
    assert.match(await page.locator('#cp-pres').innerText(), /Empieza en \dº de/);
    await noHScroll(page, 'placement result');
    await page.click('#cp-pr-go'); await page.waitForSelector('#cp-setup:not([hidden])');
    const st = await stored(page, 'calc_skills_');
    const placed = Object.values(st).filter(s => s.placed);
    assert.ok(placed.length >= 6, 'placed states stored');
    assert.ok(placed.every(s => s.grade === 3 && s.ceil - s.floor <= 4 && s.floor <= s.lvl && s.lvl <= s.ceil), 'window recentred');
    assert.ok(placed.some(s => s.lvl >= 6), 'a strong child ends above the start (level 5)');
    await noHScroll(page, 'setup after placement');
    assert.deepEqual(errors, [], errors.join(' | '));
  } finally { await ctx.close(); }
});

test('F-CALCPRACTICE: I do not know falls back to 3rd grade; 360px has no horizontal scroll; practice keypad at 360px', async () => {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, serviceWorkers: 'block' });
  const { page, errors } = await open(ctx);
  try {
    await noHScroll(page, '360 home');
    await page.click('#cp-ask-dk');
    await page.waitForFunction(() => document.getElementById('cp-ask').hidden);
    assert.match(await page.locator('#cp-grade-line').innerText(), /3º de primaria/);
    await page.click('#cp-m-practice'); await page.waitForSelector('#cp-setup:not([hidden])');
    assert.equal(await page.locator('#cp-set-skills .cp-chip[data-skill]').count(), 7, 'grade 3 skills');
    assert.ok(!(await page.locator('#cp-set-help').isChecked()));
    await page.click('#cp-set-all'); await noHScroll(page, '360 setup');
    await page.click('#cp-set-go');
    let prev = null;
    for (let i = 0; i < 8; i++) { await waitQ(page, prev); const q = await getQ(page); prev = q.key; await noHScroll(page, '360 question ' + q.skill); await answerUI(page, q); await page.click('#pp-continue'); }
    assert.deepEqual(errors, [], errors.join(' | '));
  } finally { await ctx.close(); }
});
