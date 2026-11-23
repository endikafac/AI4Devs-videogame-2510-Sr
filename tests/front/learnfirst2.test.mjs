// Learn-first, round 2, in a real browser (390x844): the learn step comes first, can be skipped, practice follows,
// a wrong answer shows an explanation, no console errors and no horizontal scroll.
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
async function open(url, { lang = 'es-ES' } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', locale: lang });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !IGNORE.test(m.text())) errors.push(m.text()); });
  await page.addInitScript(l => { Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' }); try { localStorage.setItem('games_hub_language', l); } catch (e) { /* ignore */ } }, lang);
  await page.goto(base + '/' + url, { waitUntil: 'load' });
  return { ctx, page, errors };
}
const noOverflow = async (page, what) => {
  const sw = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(sw <= 1, `horizontal overflow of ${sw}px: ${what}`);
};
const bigEnough = async (page, selector, what) => {
  const small = await page.evaluate(sel => [...document.querySelectorAll(sel)].filter(e => e.offsetParent !== null).map(e => e.getBoundingClientRect()).filter(r => r.width < 47.5 || r.height < 47.5).length, selector);
  assert.equal(small, 0, `${what}: ${small} tap targets smaller than 48px`);
};
const seeded = seed => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

// ───────────────────────── memory ─────────────────────────
test('F-LF2-MEMORY: Aprende first (skippable), guided round of 3 pairs with hints, and a mismatch explains why', async () => {
  const { ctx, page, errors } = await open('memory-EFC/index.html');
  try {
    await page.waitForSelector('#mm-start');
    await page.click('#mm-start');
    assert.equal(await page.locator('#mm-learn').isVisible(), true, 'the learn step must come first');
    assert.equal(await page.locator('#mm-play').isVisible(), false);
    assert.ok((await page.locator('.mm-pick').count()) >= 10);
    await bigEnough(page, '.mm-pick, #mm-learn-go, #mm-learn-skip, #mm-learn-back', 'memory learn');
    await page.click('.mm-pick >> nth=0');
    assert.match(await page.textContent('.mm-learn-count'), /\S/);
    await noOverflow(page, 'memory learn');
    await page.click('#mm-learn-skip');
    await page.waitForSelector('#mm-play:not([hidden])');
    assert.equal(await page.locator('#mm-card .mm-tile').count(), 6, 'the first game of a theme has only 3 pairs');
    assert.equal(await page.locator('#mm-guide').isVisible(), true);
    // a mismatch shows the name of both cards
    const [a, b] = await page.evaluate(() => { const d = MemoryPairs.state.deck; const a = 0; const b = d.findIndex((c, i) => i !== a && c.pair !== d[a].pair); return [a, b]; });
    await page.click(`#mm-card .mm-tile[data-i="${a}"]`);
    assert.match(await page.textContent('#mm-guide'), /Busca la pareja de/);
    await page.click(`#mm-card .mm-tile[data-i="${b}"]`);
    const why = (await page.textContent('#mm-why')).trim();
    assert.match(why, /no son pareja/);
    assert.ok(why.length > 30, 'the why line should name both cards: ' + why);
    await noOverflow(page, 'memory guided round');
    // after the guided round the normal size follows
    await page.waitForTimeout(1000);
    await page.evaluate(() => { const S = MemoryPairs.state; S.deck.forEach(() => {}); });
    for (let pair = 0; pair < 3; pair++) {
      const idx = await page.evaluate(p => MemoryPairs.state.deck.map((c, i) => c.pair === p ? i : -1).filter(i => i >= 0), pair);
      for (const i of idx) { await page.click(`#mm-card .mm-tile[data-i="${i}"]`); await page.waitForTimeout(80); }
    }
    await page.waitForSelector('#mm-end:not([hidden])', { timeout: 5000 });
    await page.click('#mm-next');
    await page.waitForSelector('#mm-play:not([hidden])');
    assert.equal(await page.locator('#mm-card .mm-tile').count(), 8, 'then the normal easy size (4 pairs)');
    assert.equal(await page.locator('#mm-guide').isVisible(), false);
    assert.deepEqual(errors, [], errors.join(' | '));
  } finally { await ctx.close(); }
});

test('F-LF2-MEMORY: numbers - tapping a numeral makes that many dots appear one by one', async () => {
  const { ctx, page, errors } = await open('memory-EFC/index.html', { lang: 'en-US' });
  try {
    await page.waitForSelector('#mm-start');
    await page.click('.mm-chip[data-id="numbers"]');
    await page.click('#mm-start');
    assert.equal(await page.locator('#mm-learn').isVisible(), true);
    await page.click('.mm-pick[data-sym="3"]');
    await page.waitForTimeout(700);
    const early = await page.locator('.mm-dot-ball').count();
    assert.ok(early < 3, 'the dots must not all appear at once (got ' + early + ')');
    await page.waitForFunction(() => document.querySelectorAll('.mm-dot-ball').length === 3, null, { timeout: 4000 });
    assert.match(await page.textContent('#mm-learn-count'), /3 = three/);
    await page.click('#mm-learn-go');
    await page.waitForSelector('#mm-play:not([hidden])');
    assert.equal(await page.locator('#mm-card .mm-tile').count(), 6);
    assert.deepEqual(errors, [], errors.join(' | '));
  } finally { await ctx.close(); }
});

test('F-LF2-MEMORY: respects prefers-reduced-motion (dots appear at once)', async () => {
  const { ctx, page } = await open('memory-EFC/index.html');
  try {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForSelector('#mm-start');
    await page.click('.mm-chip[data-id="numbers"]');
    await page.click('#mm-start');
    await page.click('.mm-pick[data-sym="5"]');
    assert.equal(await page.locator('.mm-dot-ball').count(), 5);
  } finally { await ctx.close(); }
});

// ───────────────────────── typingMaster ─────────────────────────
test('F-LF2-TYPING: keyboard lesson first, 5-key drill without timer, then the timed level; wrong keys name the finger', async () => {
  const { ctx, page, errors } = await open('typingMaster-EFC/index.html');
  try {
    await page.waitForSelector('.ty-level-btn[data-level="1"]');
    await page.click('.ty-level-btn[data-level="1"]');
    await page.click('#ty-start-btn');
    assert.equal(await page.evaluate(() => document.getElementById('ty-lesson').classList.contains('active')), true, 'the lesson must come first');
    assert.equal(await page.evaluate(() => document.getElementById('ty-game').classList.contains('active')), false);
    assert.ok((await page.locator('#ty-lesson-kb .ty-key').count()) > 30);
    assert.equal(await page.locator('#ty-lesson-hands .ty-fbar').count(), 9);
    await bigEnough(page, '#ty-lesson-hands .ty-fbar, #ty-lesson-try, #ty-lesson-skip', 'typing lesson');
    await noOverflow(page, 'typing lesson');
    await page.click('#ty-lesson-hands .ty-fbar[data-finger="1"]');
    assert.match(await page.textContent('#ty-lesson-info'), /anular izquierdo/);
    assert.ok((await page.locator('#ty-lesson-kb .ty-key.current-key').count()) >= 1);
    // guided drill: no timer on the screen, wrong key explained, 10 correct keys finish it
    await page.click('#ty-lesson-try');
    assert.equal(await page.locator('#ty-drill').isVisible(), true);
    assert.equal(await page.locator('#ty-time-val').isVisible(), false, 'no timer in the drill');
    const target = async () => page.evaluate(() => { const t = document.getElementById('ty-drill-key').textContent; return t === 'ESP' ? ' ' : t === '<>' ? '<' : t.toLowerCase(); });
    const t0 = await target();
    const wrongKey = t0 === 'k' ? 'a' : 'k';
    await page.keyboard.press(wrongKey);
    assert.match(await page.textContent('#ty-drill-msg'), /dedo/, 'the wrong key must name the right finger');
    for (let i = 0; i < 10; i++) { await page.keyboard.press(await target()); await page.waitForTimeout(30); }
    await page.waitForSelector('#ty-lesson-start:not(.hidden)');
    await page.click('#ty-lesson-start');
    assert.equal(await page.evaluate(() => document.getElementById('ty-game').classList.contains('active')), true, 'the timed level starts after the lesson');
    // in the timed level a wrong key explains the right finger
    const cur = await page.evaluate(() => document.querySelector('#ty-text-display .ty-char.current').textContent.trim() || ' ');
    await page.keyboard.press(cur === 'z' ? 'a' : 'z');
    assert.match(await page.textContent('#ty-finger-tip'), /dedo/);
    await noOverflow(page, 'typing game');
    assert.deepEqual(errors, [], errors.join(' | '));
  } finally { await ctx.close(); }
});

test('F-LF2-TYPING: the lesson can be skipped and is not shown twice', async () => {
  const { ctx, page, errors } = await open('typingMaster-EFC/index.html', { lang: 'en-US' });
  try {
    await page.waitForSelector('.ty-level-btn[data-level="1"]');
    await page.click('.ty-level-btn[data-level="1"]');
    await page.click('#ty-start-btn');
    assert.equal(await page.locator('#ty-lesson-skip').textContent(), 'Skip lesson');
    await page.click('#ty-lesson-skip');
    assert.equal(await page.evaluate(() => document.getElementById('ty-game').classList.contains('active')), true);
    await page.click('#ty-quit-btn');
    await page.waitForSelector('#ty-home.active');
    await page.click('.ty-level-btn[data-level="1"]');
    await page.click('#ty-start-btn');
    assert.equal(await page.evaluate(() => document.getElementById('ty-game').classList.contains('active')), true, 'the lesson must not repeat');
    // ...but it can be reopened from the home screen
    await page.click('#ty-quit-btn');
    await page.waitForSelector('#ty-home.active');
    await page.click('#ty-lesson-btn');
    assert.equal(await page.evaluate(() => document.getElementById('ty-lesson').classList.contains('active')), true);
    assert.deepEqual(errors, [], errors.join(' | '));
  } finally { await ctx.close(); }
});

// ───────────────────────── englishVerbs ─────────────────────────
test('F-LF2-VERBS: regular/irregular card before level 1, tap to reveal, 3 guided questions, then the level', async () => {
  const { ctx, page, errors } = await open('englishVerbs-EFC/index.html');
  try {
    await page.waitForSelector('#ev-tabBtn-niveles');
    await page.click('#ev-tabBtn-niveles');
    await page.click('.ev-level-btn.unlocked');
    assert.equal(await page.evaluate(() => document.getElementById('ev-screen-lesson').classList.contains('active')), true, 'the card must come first');
    assert.equal(await page.locator('.ev-ltile').count(), 9);
    await bigEnough(page, '.ev-ltile, #ev-lesson-try, #ev-lesson-skip', 'verbs lesson');
    await noOverflow(page, 'verbs lesson');
    assert.equal(await page.textContent('.ev-ltile >> nth=1 >> .ev-ltile-val'), '?');
    await page.click('.ev-ltile >> nth=1');
    assert.equal(await page.textContent('.ev-ltile >> nth=1 >> .ev-ltile-val'), 'played');
    await page.click('.ev-ltile[data-verb="go"][data-form="past"]');
    assert.equal(await page.textContent('.ev-ltile[data-verb="go"][data-form="past"] .ev-ltile-val'), 'went');
    await page.click('#ev-lesson-try');
    // question 1 (walk): a wrong answer is explained and the child can try again
    await page.click('.ev-option-btn:has-text("walk"):not(:has-text("walked")):not(:has-text("walking"))');
    const fb = (await page.textContent('#ev-lesson-fb')).trim();
    assert.match(fb, /walked/); assert.match(fb, /Inténtalo otra vez/);
    await page.click('.ev-option-btn:has-text("walked")');
    await page.click('#ev-lesson-next');
    await page.click('.ev-option-btn:has-text("eated")');
    assert.match(await page.textContent('#ev-lesson-fb'), /irregular/);
    await page.click('.ev-option-btn:has(span:text-is("ate"))');
    await page.click('#ev-lesson-next');
    await page.click('.ev-option-btn:has(span:text-is("took"))');
    assert.match(await page.textContent('#ev-lesson-fb'), /participio/);
    await page.click('.ev-option-btn:has(span:text-is("taken"))');
    await page.click('#ev-lesson-next');
    await page.click('#ev-lesson-start');
    assert.equal(await page.evaluate(() => document.getElementById('ev-screen-game').classList.contains('active')), true, 'practice starts after the card');
    assert.ok((await page.locator('#ev-question-area').textContent()).trim().length > 5);
    assert.deepEqual(errors, [], errors.join(' | '));
  } finally { await ctx.close(); }
});

test('F-LF2-VERBS: skip works, and a wrong practice answer still explains', async () => {
  const { ctx, page, errors } = await open('englishVerbs-EFC/index.html');
  try {
    await page.waitForSelector('#ev-tabBtn-niveles');
    await page.click('#ev-tabBtn-niveles');
    await page.click('.ev-level-btn.unlocked');
    await page.click('#ev-lesson-skip');
    assert.equal(await page.evaluate(() => document.getElementById('ev-screen-game').classList.contains('active')), true);
    await page.click('#ev-quit-btn'); await page.click('#ev-quit-ok'); await page.click('#ev-tabBtn-niveles');
    await page.click('.ev-mode-card >> nth=0');
    let explained = '';
    for (let i = 0; i < 10 && !explained; i++) {
      const opts = page.locator('.ev-option-btn');
      await opts.nth(0).click();
      const cls = await page.getAttribute('#ev-feedback', 'class');
      if (/wrong/.test(cls)) explained = await page.textContent('#ev-feedback');
      else await page.click('#ev-next-btn');
    }
    assert.match(explained, /→/, 'the wrong answer must show the verb forms');
    await noOverflow(page, 'verbs practice');
    assert.deepEqual(errors, [], errors.join(' | '));
  } finally { await ctx.close(); }
});

// ───────────────────────── tableMaster ─────────────────────────
test('F-LF2-TABLES: learn screens are translated, linked from the drills, and a wrong answer shows the worked step', async () => {
  const { ctx, page, errors } = await open('tableMaster-EFC/index.html');
  try {
    await page.waitForSelector('#btn-learn-multiply');
    await page.click('#btn-learn-multiply');
    assert.match(await page.textContent('#lm-slide-0 .tm-theory-title'), /¿Qué es multiplicar\?/);
    await page.evaluate(() => PlatformI18n.setLanguage('en-US'));
    assert.match(await page.textContent('#lm-slide-0 .tm-theory-title'), /What is multiplying\?/);
    assert.ok(!/[¿ñ]/.test(await page.textContent('#screen-learn-multiply')), 'Spanish text left on the English learn screen');
    await page.evaluate(() => PlatformI18n.setLanguage('fr-FR'));
    assert.match(await page.textContent('#lm-slide-0 .tm-theory-title'), /multiplier/);
    assert.match(await page.textContent('#mult-demo'), /On calcule/);
    await page.evaluate(() => PlatformI18n.setLanguage('es-ES'));
    await noOverflow(page, 'tableMaster learn');
    await bigEnough(page, '#screen-learn-multiply .tm-slide-prev, #screen-learn-multiply .tm-slide-next, #screen-learn-multiply .tm-slide-tab, #screen-learn-multiply .tm-back-btn, #btn-start-practice-multiply', 'tableMaster learn buttons');
    await page.click('#screen-learn-multiply .tm-back-btn');
    // drill: new table -> clear Aprender button
    await page.click('[data-drill="table"]');
    await page.click('#drill-table-chips .tm-chip[data-table="7"]');
    assert.equal(await page.locator('#btn-drill-learn').isVisible(), true);
    assert.match(await page.textContent('#btn-drill-learn'), /Aprender la tabla del 7/);
    assert.match(await page.textContent('#drill-learn-hint'), /tabla nueva/);
    await bigEnough(page, '#btn-drill-learn, #btn-drill-start', 'drill select');
    await page.click('#btn-drill-learn');
    assert.equal(await page.evaluate(() => document.getElementById('screen-learn-multiply').classList.contains('active')), true);
    assert.equal(await page.evaluate(() => document.getElementById('lm-slide-5').classList.contains('active')), true, 'opens the memory-tricks card');
    await page.click('#screen-learn-multiply .tm-back-btn');
    assert.equal(await page.evaluate(() => document.getElementById('screen-drill-select').classList.contains('active')), true, 'back returns to the drill menu');
    // wrong answers: worked step, and after two on the same table an Aprender button
    await page.click('#drill-table-chips .tm-chip[data-table="7"]');
    await page.click('#btn-drill-start');
    const answerWrong = async () => {
      const q = await page.textContent('#drill-question');
      const m = /(\d+)\s*×\s*(\d+)/.exec(q.replace(/\s+/g, ' ')); assert.ok(m, 'question: ' + q);
      const wrong = String(Number(m[1]) * Number(m[2]) + 1);
      for (const d of wrong) await page.click(`#drill-numpad .tm-key[data-key="${d}"]`);
      await page.click('#drill-key-ok');
      return [Number(m[1]), Number(m[2])];
    };
    const [a, b] = await answerWrong();
    const worked = (await page.textContent('#drill-feedback .tm-fb-worked')).trim();
    assert.ok(worked.includes('=') && worked.endsWith('= ' + a * b), 'worked step must end with the right product: ' + worked);
    assert.equal(await page.locator('#drill-learn').isVisible(), false, 'one mistake is not enough');
    await page.click('#drill-next');
    await answerWrong();
    assert.equal(await page.locator('#drill-learn').isVisible(), true, 'after two wrong answers on the same table the learn button appears');
    assert.match(await page.textContent('#drill-feedback'), /dos veces la tabla del 7/);
    await bigEnough(page, '#drill-learn, #drill-next', 'drill feedback');
    await noOverflow(page, 'tableMaster drill');
    await page.click('#drill-learn');
    assert.equal(await page.evaluate(() => document.getElementById('screen-learn-multiply').classList.contains('active')), true);
    assert.deepEqual(errors, [], errors.join(' | '));
  } finally { await ctx.close(); }
});

test('F-LF2-TABLES: divide drill explains with the matching multiplication', async () => {
  const { ctx, page, errors } = await open('tableMaster-EFC/index.html', { lang: 'en-US' });
  try {
    await page.waitForSelector('[data-drill="divide"]');
    await page.click('[data-drill="divide"]');
    assert.match(await page.textContent('#btn-drill-learn'), /Learn division/);
    await page.click('#btn-drill-start');
    const q = (await page.textContent('#drill-question')).replace(/\s+/g, ' ');
    const m = /(\d+)\s*÷\s*(\d+)/.exec(q); assert.ok(m, q);
    const wrong = String(Math.floor(Number(m[1]) / Number(m[2])) + 1);
    for (const d of wrong) await page.click(`#drill-numpad .tm-key[data-key="${d}"]`);
    await page.click('#drill-key-ok');
    const fb = await page.textContent('#drill-feedback');
    assert.match(fb, /because/); assert.match(fb, /This is how you work it out/);
    assert.deepEqual(errors, [], errors.join(' | '));
  } finally { await ctx.close(); }
});

// ───────────────────────── vocabMaster ─────────────────────────
const vocabWords = () => {
  const dir = path.join(root, 'vocabMaster-EFC/vocab');
  const idx = JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8'));
  const pack = JSON.parse(fs.readFileSync(path.join(dir, idx.packs[0].file), 'utf8'));
  return pack.words.map(a => ({ w: a[0], t: a[1], i: a[2], e: a[3] }));
};
test('F-LF2-VOCAB: study cards first, 3-card guided check, then the quiz with an explained wrong answer', async () => {
  const words = vocabWords(), byW = Object.fromEntries(words.map(x => [x.w, x])), byT = Object.fromEntries(words.map(x => [x.t, x]));
  const { ctx, page, errors } = await open('vocabMaster-EFC/index.html');
  try {
    await page.waitForSelector('.vm-pack');
    await page.click('.vm-pack >> nth=0');
    await page.waitForSelector('#vm-flip');
    assert.equal(await page.locator('#vm-play').isVisible(), true);
    await bigEnough(page, '#vm-flip, #vm-study-next, #vm-study-skip, .vm-listen', 'vocab study');
    await noOverflow(page, 'vocab study');
    const frontWord = (await page.textContent('#vm-flip .vm-word')).trim();
    assert.equal(await page.getAttribute('#vm-flip', 'aria-pressed'), 'false');
    await page.click('#vm-flip');
    assert.equal(await page.getAttribute('#vm-flip', 'aria-pressed'), 'true');
    assert.equal((await page.textContent('#vm-flip .vm-backface .vm-trans')).trim(), byW[frontWord].t, 'the back of the card shows the meaning');
    assert.ok((await page.textContent('#vm-flip .vm-backface')).includes(byW[frontWord].e), 'and the example sentence');
    // go through the study cards
    for (let guard = 0; guard < 6 && !(await page.locator('#vm-study-next').textContent()).includes('3'); guard++) await page.click('#vm-study-next');
    await page.click('#vm-study-next'); // "Probar con 3 preguntas"
    assert.match(await page.textContent('#vm-card'), /Pregunta 1 de 3/);
    // guided check: a wrong answer names the correct word, why, and the example
    const askedWord = async () => {
      const w = (await page.locator('#vm-card .vm-word').count()) ? (await page.textContent('#vm-card .vm-word')).trim() : null;
      if (w) return { word: byW[w], back: false };
      return { word: byT[(await page.textContent('#vm-card .vm-trans')).trim()], back: true };
    };
    for (let n = 0; n < 3; n++) {
      const { word, back } = await askedWord();
      const right = back ? word.w : word.t;
      const opts = await page.locator('#vm-card .vm-opt').allTextContents();
      const wrongOpt = opts.find(o => o !== right);
      await page.click(`#vm-card .vm-opt:text-is("${wrongOpt}")`);
      const fb = (await page.textContent('#vm-check-fb')).trim();
      assert.ok(fb.includes(word.w) && fb.includes(word.t), 'feedback lacks the correct word: ' + fb);
      assert.ok(fb.includes(word.e), 'feedback lacks the example sentence: ' + fb);
      assert.match(fb, /Inténtalo otra vez/);
      await page.click(`#vm-card .vm-opt:text-is("${right}")`);
      await page.click('#vm-check-next');
    }
    // the normal quiz starts after the check
    await page.waitForFunction(() => !document.getElementById('vm-check-fb') && document.querySelector('#vm-card .vm-kind'));
    assert.equal(await page.locator('#vm-flip').count(), 0);
    const q = await askedWord();
    if (await page.locator('#vm-card .vm-opt').count()) {
      const right = q.back ? q.word.w : q.word.t;
      const wrongOpt = (await page.locator('#vm-card .vm-opt').allTextContents()).find(o => o !== right);
      await page.click(`#vm-card .vm-opt:text-is("${wrongOpt}")`);
      const fb = (await page.textContent('#vm-card .vm-fb')).trim();
      assert.match(fb, /Incorrecto/);
      assert.ok(fb.includes(q.word.w) && fb.includes(q.word.e), 'quiz feedback: ' + fb);
      assert.ok(!/Era:/.test(fb));
    }
    await noOverflow(page, 'vocab quiz');
    assert.deepEqual(errors, [], errors.join(' | '));
  } finally { await ctx.close(); }
});

test('F-LF2-VOCAB: study can be skipped and the UI exists in French', async () => {
  const { ctx, page, errors } = await open('vocabMaster-EFC/index.html', { lang: 'fr-FR' });
  try {
    await page.waitForSelector('.vm-pack');
    assert.match(await page.textContent('#vm-sub'), /Apprends des mots/);
    await page.click('.vm-pack >> nth=0');
    await page.waitForSelector('#vm-flip');
    assert.match(await page.textContent('#vm-card .vm-kind'), /Étudie/);
    await page.click('#vm-study-skip');
    assert.equal(await page.locator('#vm-flip').count(), 0);
    assert.ok((await page.locator('#vm-card .vm-kind').count()) >= 1, 'the quiz (or intro card) follows the skipped study step');
    assert.deepEqual(errors, [], errors.join(' | '));
  } finally { await ctx.close(); }
});
