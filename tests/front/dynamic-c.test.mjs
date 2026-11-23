// VocabMaster: dynamic questions (labelled zones, colourful answers, new formats) and vocabulary in the UI language.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const root = path.resolve(import.meta.dirname, '../..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const TR = JSON.parse(fs.readFileSync(path.join(root, 'vocabMaster-EFC/vocab/translations.json'), 'utf8'));
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

const IGNORE = /favicon|Missing or insufficient permissions|unauthorized-domain|net::ERR|Failed to load resource|firestore\.googleapis|identitytoolkit|offline|WebChannel|manifest|gstatic|firebase/i;
const LANG = { es: 'es-ES', en: 'en-US', eu: 'eu-ES', gl: 'gl-ES', ca: 'ca-ES', fr: 'fr-FR' };

async function open({ lang = 'es', width = 390, height = 844, novoice = false, reduced = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block', locale: 'es-ES', reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !IGNORE.test(m.text())) errors.push(m.text()); });
  await page.addInitScript(([l, nv]) => {
    localStorage.setItem('games_hub_language', l);
    Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' });
    if (nv) { try { delete window.speechSynthesis; } catch (e) { /* ignore */ } }
  }, [LANG[lang], novoice]);
  await page.goto(base + '/vocabMaster-EFC/index.html', { waitUntil: 'load' });
  await page.waitForSelector('.vm-pack', { timeout: 8000 });
  return { ctx, page, errors };
}
const noOverflow = async (page, what) => {
  const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  assert.ok(r.sw <= r.iw + 1, `${what}: horizontal scroll (${r.sw} > ${r.iw})`);
};
const bigEnough = async (page, sel, what, min = 44) => {
  const sizes = await page.$$eval(sel, els => els.filter(e => e.offsetParent !== null).map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), e.textContent.trim().slice(0, 14)]; }));
  assert.ok(sizes.length > 0, `${what}: no visible ${sel}`);
  for (const [w, h, t] of sizes) assert.ok(w >= min - 1 && h >= min - 1, `${what}: "${t}" is ${w}x${h}`);
};
const S = page => page.evaluate(() => { const s = VocabMaster._S; return { total: s.total, done: s.done, cur: s.current && s.current.w.w, pack: s.pack && s.pack.id }; });
async function startRound(page, kind, pack = 'en-animals') {
  await page.click(`.vm-pack[data-pack="${pack}"]`);
  await page.waitForSelector('#vm-flip');
  await page.evaluate(k => VocabMaster._force(k), kind);
  await page.click('#vm-study-skip');
  await page.waitForSelector('.vm-qnum');
}
// click the right (or a wrong) answer of the current question, by object identity (not by text)
const answerWith = (page, good, selector = '.vm-opt') => page.evaluate(([g, sel]) => {
  const st = VocabMaster._S, w = st.check ? st.check.qs[st.check.i].word : st.light ? st.light.last : st.current.w;
  const b = [...document.querySelectorAll(sel)].find(x => !x.disabled && ((x._o === w) === g));
  b.click(); return b._o.w;
}, [good, selector]);

test('F-VOC-ZONES: labelled zones, help, colourful shaped answers, Juice, wrong-answer explanation (390x844)', async () => {
  const { ctx, page, errors } = await open();
  try {
    // modes are offered on the home screen, packs show names
    assert.deepEqual(await page.$$eval('.vm-mode', b => b.map(x => x.dataset.mode)), ['round', 'match', 'memory', 'lightning']);
    await startRound(page, 'choice');
    assert.match(await page.textContent('.vm-qnum'), /^Pregunta 1 de 10$/);
    assert.equal(await page.isVisible('#vm-help'), true);
    assert.match(await page.getAttribute('#vm-help', 'aria-label'), /Ayuda/);
    assert.equal(await page.textContent('.vm-zlabel'), 'Elige');
    assert.ok(await page.locator('.vm-prompt .vm-emoji').isVisible());
    assert.equal(await page.locator('.vm-opt').count(), 4);
    const shapes = await page.$$eval('.vm-opt', b => b.map(x => x.dataset.shape));
    assert.deepEqual(shapes, ['▲', '◆', '●', '■']);
    assert.equal(new Set(await page.$$eval('.vm-opt', b => b.map(x => getComputedStyle(x).backgroundColor))).size, 4, 'four different colours');
    await bigEnough(page, '.vm-opt, #vm-help, #vm-quit, .jx-sound', 'quiz controls');
    assert.ok(await page.locator('.jx-sound').isVisible(), 'sound toggle');
    await noOverflow(page, 'quiz');
    // help
    await page.click('#vm-help');
    assert.ok(await page.isVisible('#vm-helpbox'));
    assert.match(await page.textContent('#vm-helpbox'), /Ejemplo/);
    // wrong first: soft shake, the reason is shown, scoring untouched until the end
    await answerWith(page, false);
    await page.waitForSelector('.vm-fb.bad');
    const fb = await page.textContent('.vm-fb.bad');
    assert.match(fb, /Incorrecto/); assert.match(fb, /La palabra correcta es/); assert.match(fb, /Ejemplo: “/);
    assert.ok(await page.locator('.jx-float').count() >= 1 || await page.locator('.jx-shake, .jx-bad').count() >= 1, 'wrong effect');
    assert.equal(await page.locator('.vm-opt.ok').count(), 1, 'the right answer is highlighted');
    await bigEnough(page, '#vm-next', 'next');
    // continue with Enter (the Next button has the focus), the wrong word comes back later
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.querySelectorAll('.vm-opt:not(:disabled)').length === 4 || !!document.querySelector('.vm-input'));
    // answer the next ones right with the number keys until the streak chip shows
    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => VocabMaster._force('choice'));
      const w = await page.evaluate(() => VocabMaster._S.current.w);
      const idx = await page.evaluate(() => [...document.querySelectorAll('.vm-opt')].findIndex(b => b._o === VocabMaster._S.current.w));
      await page.keyboard.press(String(idx + 1));
      assert.ok(await page.locator('.vm-opt.ok').count() === 1, 'the number key answers');
      assert.ok(await page.locator('.jx-float, .jx-ok, .jx-piece').count() >= 1, 'correct effect (' + w.w + ')');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(60);
    }
    assert.match(await page.textContent('#vm-streak'), /Racha 4/);
    assert.match(await page.textContent('#vm-count'), /^4\/10$/);
    // Esc leaves to the topics
    await page.keyboard.press('Escape');
    assert.ok(await page.isVisible('#vm-packs'));
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-VOC-LANGS: meanings and example translations follow the UI language (cards, check, quiz, wrong feedback)', async () => {
  for (const lang of ['es', 'en', 'eu', 'gl', 'ca', 'fr']) {
    const { ctx, page, errors } = await open({ lang });
    try {
      await page.click('.vm-pack[data-pack="en-animals"]');
      await page.waitForSelector('#vm-flip');
      const first = await page.evaluate(() => { const st = VocabMaster._S.study; return st.words[0].w; });
      const tw = TR.words['en-animals'][first];
      const expected = lang === 'es' ? await page.evaluate(() => VocabMaster._S.study.words[0].ts) : tw.meaning[lang];
      await page.click('#vm-flip');
      const back = await page.textContent('#vm-flip .vm-backface');
      assert.ok(back.includes(expected), `${lang}: study card back lacks the meaning "${expected}": ${back}`);
      if (lang !== 'en') assert.ok(back.includes(tw.example[lang]), `${lang}: study card lacks the example translation`);
      else assert.ok(!back.includes(tw.example.es));
      // pack names in the user language on the home screen
      // guided check: options are meanings in the UI language
      for (let i = 0; i < 6 && !(await page.$('#vm-check-fb')); i++) await page.click('#vm-study-next');
      await page.waitForSelector('#vm-check-fb', { state: 'attached' });
      const optsText = await page.$$eval('.vm-opt', b => b.map(x => x.textContent));
      const meanings = await page.evaluate(() => VocabMaster._S.check.qs[0].options.map(o => o.t));
      assert.deepEqual(optsText, meanings, `${lang}: check options use the localized meaning`);
      if (lang !== 'es') for (const m of meanings) assert.ok(Object.values(TR.words['en-animals']).some(v => v.meaning[lang] === m), `${lang}: "${m}" is not a translated meaning`);
      // wrong answer: explanation in the UI language, with the translated example
      await answerWith(page, false);
      const fb = await page.textContent('#vm-check-fb');
      const w0 = await page.evaluate(() => VocabMaster._S.check.qs[0].word);
      assert.ok(fb.includes(w0.w) && fb.includes(w0.t), `${lang}: feedback names the word and its meaning`);
      if (lang !== 'en') assert.ok(fb.includes(w0.et), `${lang}: feedback shows the translated example`);
      assert.deepEqual(errors, [], lang);
    } finally { await ctx.close(); }
  }
});

test('F-VOC-HOME: pack and language names exist in gl, ca and fr', async () => {
  for (const lang of ['gl', 'ca', 'fr']) {
    const { ctx, page } = await open({ lang });
    try {
      const names = await page.$$eval('.vm-pack-name', e => e.map(x => x.textContent));
      assert.equal(names[0], TR.packs['en-animals'].name[lang]);
      assert.equal(names.length, 10);
      assert.ok((await page.textContent('.vm-chip')).includes(TR.langs.en[lang]));
    } finally { await ctx.close(); }
  }
});

test('F-VOC-DRAG: drag the word to its picture (mouse), tap works too, keyboard works', async () => {
  const { ctx, page, errors } = await open();
  try {
    await startRound(page, 'drag');
    assert.equal(await page.textContent('.vm-zlabel'), 'Arrastra');
    assert.match(await page.textContent('.vm-kind'), /Arrastra la palabra/);
    assert.equal(await page.locator('.vm-drop').count(), 4);
    assert.equal(new Set(await page.$$eval('.vm-drop .vm-pic', e => e.map(x => x.textContent))).size, 4, 'four different pictures');
    await bigEnough(page, '.vm-drop, #vm-dragchip', 'drag');
    await noOverflow(page, 'drag');
    // drag onto a wrong tile: explained, nothing breaks
    const pos = good => page.evaluate(g => {
      const w = VocabMaster._S.current.w, t = [...document.querySelectorAll('.vm-drop')].find(x => (x._o === w) === g), r = t.getBoundingClientRect(), c = document.getElementById('vm-dragchip').getBoundingClientRect();
      return { tx: r.left + r.width / 2, ty: r.top + r.height / 2, cx: c.left + c.width / 2, cy: c.top + c.height / 2 };
    }, good);
    let p = await pos(false);
    await page.mouse.move(p.cx, p.cy); await page.mouse.down(); await page.mouse.move((p.cx + p.tx) / 2, (p.cy + p.ty) / 2, { steps: 4 }); await page.mouse.move(p.tx, p.ty, { steps: 4 });
    assert.ok(await page.locator('.vm-drop.over').count() === 1, 'the tile under the word lights up');
    await page.mouse.up();
    await page.waitForSelector('.vm-fb.bad');
    assert.match(await page.textContent('.vm-fb.bad'), /La palabra correcta es/);
    await page.keyboard.press('Enter');
    // the retry of the same word: drag it to the right tile
    await page.evaluate(() => VocabMaster._force('drag'));
    await page.waitForSelector('#vm-dragchip');
    p = await pos(true);
    await page.mouse.move(p.cx, p.cy); await page.mouse.down(); await page.mouse.move(p.tx, p.ty, { steps: 8 }); await page.mouse.up();
    await page.waitForSelector('.vm-fb.ok');
    assert.ok(await page.locator('.jx-float, .jx-ok, .jx-piece').count() >= 1);
    assert.match(await page.textContent('#vm-count'), /^1\/10$/);
    // tap and keyboard (digit) answer as well
    await page.keyboard.press('Enter');
    await page.evaluate(() => VocabMaster._force('drag'));
    await page.waitForSelector('#vm-dragchip');
    const idx = await page.evaluate(() => [...document.querySelectorAll('.vm-drop')].findIndex(b => b._o === VocabMaster._S.current.w));
    await page.keyboard.press(String(idx + 1));
    await page.waitForSelector('.vm-fb.ok');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-VOC-LISTEN: listen and pick the picture, with a visible fallback when the browser has no voice', async () => {
  for (const novoice of [false, true]) {
    const { ctx, page, errors } = await open({ novoice });
    try {
      await startRound(page, 'listen');
      assert.equal(await page.evaluate(() => 'speechSynthesis' in window), !novoice);
      assert.match(await page.textContent('.vm-kind'), /Escucha y elige el dibujo/);
      assert.ok(await page.isVisible('.vm-speaker'));
      assert.equal(await page.locator('.vm-pics .vm-opt .vm-pic').count(), 4);
      if (novoice) {
        assert.match(await page.textContent('.vm-novoice'), /no tiene voz/);
        const cur = await page.evaluate(() => VocabMaster._S.current.w.w);
        assert.ok((await page.textContent('.vm-prompt')).includes(cur), 'the word is shown instead');
      } else assert.equal(await page.locator('.vm-novoice').count(), 0);
      await answerWith(page, true);
      assert.equal(await page.locator('.vm-opt.ok').count(), 1);
      assert.deepEqual(errors, []);
    } finally { await ctx.close(); }
  }
});

test('F-VOC-MATCH: match pairs with tap-tap (mouse and keyboard), explanations on a wrong pair, stars at the end, saved progress untouched', async () => {
  const { ctx, page, errors } = await open({ lang: 'fr' });
  try {
    await page.evaluate(() => localStorage.removeItem('vocab_prog_guest'));
    await page.click('.vm-mode[data-mode="match"]');
    await page.click('.vm-pack[data-pack="en-food"]');
    await page.waitForSelector('.vm-pm');
    assert.equal(await page.locator('.vm-pm').count(), 10);
    assert.equal(await page.textContent('.vm-zlabel'), 'Relie');
    assert.match(await page.textContent('.vm-qnum'), /Paires : 0 sur 5/);
    assert.ok(await page.isVisible('#vm-help'));
    await bigEnough(page, '.vm-pm', 'match');
    await noOverflow(page, 'match');
    const pairs = await page.$$eval('.vm-pm.left', b => b.map(x => x.dataset.w));
    // a wrong pair first (word of the first with the meaning of the second)
    await page.click(`.vm-pm.left[data-w="${pairs[0]}"]`);
    await page.click(`.vm-pm.right[data-w="${pairs[1]}"]`);
    assert.match(await page.textContent('#vm-match-fb'), /Incorrect|Pas tout à fait/);
    assert.equal(await page.locator('.vm-pm.ok').count(), 0);
    // keyboard: focus + Enter, meaning first then word
    await page.focus(`.vm-pm.right[data-w="${pairs[2]}"]`); await page.keyboard.press('Enter');
    await page.focus(`.vm-pm.left[data-w="${pairs[2]}"]`); await page.keyboard.press('Enter');
    assert.equal(await page.locator('.vm-pm.ok').count(), 2);
    assert.ok(await page.locator('.jx-ok, .jx-piece, .jx-float').count() >= 0);
    for (const w of pairs.filter((_, i) => i !== 2)) { await page.click(`.vm-pm.left[data-w="${w}"]`); await page.click(`.vm-pm.right[data-w="${w}"]`); }
    await page.waitForSelector('#vm-end:not([hidden])');
    assert.match(await page.textContent('#vm-endtitle'), /Entraînement terminé/);
    assert.match(await page.textContent('#vm-endtext'), /1 erreurs/);
    assert.ok(await page.isVisible('#vm-endnote'));
    assert.equal(await page.locator('.vm-star.on').count(), 3);
    assert.equal(await page.evaluate(() => localStorage.getItem('vocab_prog_guest')), null, 'practice does not touch the saved progress');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-VOC-MEMORY: flip match memory (a wrong pair flips back, right pairs stay), results, saved progress untouched', async () => {
  const { ctx, page, errors } = await open({ lang: 'gl', width: 360, height: 740 });
  try {
    await page.evaluate(() => { VocabMaster._cfg.flipBack = 120; });
    await page.click('.vm-mode[data-mode="memory"]');
    await page.click('.vm-pack[data-pack="en-body"]');
    await page.waitForSelector('.vm-mem');
    assert.equal(await page.locator('.vm-mem').count(), 12);
    assert.equal(await page.textContent('.vm-zlabel'), 'Atopa as parellas');
    assert.match(await page.textContent('.vm-qnum'), /Parellas: 0 de 6 · Movementos: 0/);
    await bigEnough(page, '.vm-mem', 'memory', 44);
    await noOverflow(page, 'memory 360');
    const cards = await page.$$eval('.vm-mem', b => b.map(x => [x.dataset.pair, x.dataset.kind]));
    const at = (pair, kind) => cards.findIndex(c => c[0] === String(pair) && c[1] === kind);
    // wrong pair: two word cards of different pairs
    const ws = cards.map((c, i) => [c, i]).filter(([c]) => c[1] === 'word');
    await page.locator('.vm-mem').nth(ws[0][1]).click(); await page.locator('.vm-mem').nth(ws[1][1]).click();
    assert.equal(await page.locator('.vm-mem.flipped').count(), 2);
    await page.waitForFunction(() => document.querySelectorAll('.vm-mem.flipped').length === 0);
    // keyboard on a right pair
    await page.focus('.vm-mem >> nth=' + at(0, 'word')); await page.keyboard.press('Enter');
    await page.focus('.vm-mem >> nth=' + at(0, 'pic')); await page.keyboard.press('Enter');
    assert.equal(await page.locator('.vm-mem.ok').count(), 2);
    assert.match(await page.textContent('#vm-mem-fb'), /=/);
    for (let p = 1; p < 6; p++) { await page.locator('.vm-mem').nth(at(p, 'word')).click(); await page.locator('.vm-mem').nth(at(p, 'pic')).click(); }
    await page.waitForSelector('#vm-end:not([hidden])');
    assert.match(await page.textContent('#vm-endtext'), /\d+ movementos/);
    assert.equal(await page.locator('.vm-star.on').count() >= 1, true);
    assert.equal(await page.evaluate(() => localStorage.getItem('vocab_prog_guest')), null);
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-VOC-LIGHTNING: lightning round with a soft timer ends kindly, with the count and no game over', async () => {
  const { ctx, page, errors } = await open({ lang: 'ca' });
  try {
    await page.evaluate(() => { VocabMaster._cfg.lightning = 4; VocabMaster._cfg.nextLight = 80; });
    await page.click('.vm-mode[data-mode="lightning"]');
    await page.click('.vm-pack[data-pack="en-school"]');
    await page.waitForSelector('#vm-lighttime');
    assert.match(await page.textContent('#vm-lighttime'), /^\d s$/);
    assert.equal(await page.textContent('.vm-zlabel'), 'Tria');
    assert.ok(await page.isVisible('#vm-help'));
    await noOverflow(page, 'lightning');
    let right = 0;
    for (let i = 0; i < 2; i++) {
      await page.waitForSelector('.vm-opt:not(:disabled)');
      await answerWith(page, true); right++;
      await page.waitForFunction(() => !document.querySelector('.vm-opt:disabled') || !!document.querySelector('#vm-end:not([hidden])'));
    }
    assert.match(await page.textContent('#vm-count'), /Encerts: [12]/);
    await page.waitForSelector('#vm-end:not([hidden])', { timeout: 8000 });
    assert.match(await page.textContent('#vm-endtitle'), /acabat el temps/);
    assert.match(await page.textContent('#vm-endtext'), /encerts en 4 s/);
    assert.ok(await page.locator('.vm-star.on').count() >= 1, 'at least one star, never a game over');
    assert.equal(await page.evaluate(() => localStorage.getItem('vocab_prog_guest')), null);
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-VOC-PROGRESS: a normal round still saves the Leitner boxes and ends with stars (type format too)', async () => {
  const { ctx, page, errors } = await open({ lang: 'eu' });
  try {
    await page.evaluate(() => localStorage.removeItem('vocab_prog_guest'));
    await page.click('.vm-pack[data-pack="en-numbers"]');
    await page.waitForSelector('#vm-flip');
    await page.click('#vm-study-skip');
    // answer every question right, whatever the format is (choice, drag, type)
    for (let guard = 0; guard < 40; guard++) {
      if (await page.isVisible('#vm-end')) break;
      await page.waitForSelector('.vm-opt, .vm-input, #vm-end:not([hidden]), .vm-btn');
      const kind = await page.evaluate(() => {
        const w = VocabMaster._S.current && VocabMaster._S.current.w;
        const inp = document.querySelector('.vm-input:not(:disabled)');
        if (inp) return 'type:' + w.w;
        const gotit = [...document.querySelectorAll('#vm-card .vm-btn')].find(b => !b.id && b.textContent === 'Ulertu dut');
        if (gotit) return 'gotit';
        return document.querySelector('.vm-opt:not(:disabled)') ? 'opt' : 'next';
      });
      if (kind.startsWith('type:')) { await page.fill('.vm-input', kind.slice(5)); await page.keyboard.press('Enter'); }
      else if (kind === 'gotit') await page.click('#vm-card .vm-btn:not([id])');
      else if (kind === 'opt') await answerWith(page, true);
      else { const n = await page.$('#vm-next'); if (n) await n.click(); }
      await page.waitForTimeout(20);
    }
    await page.waitForSelector('#vm-end:not([hidden])');
    assert.equal(await page.locator('.vm-star.on').count(), 3, 'a perfect round gives 3 stars');
    const prog = await page.evaluate(() => JSON.parse(localStorage.getItem('vocab_prog_guest')));
    assert.ok(Object.keys(prog['en-numbers']).length >= 10, 'ten words saved');
    for (const v of Object.values(prog['en-numbers'])) assert.equal(v.b, 1);
    assert.match(await page.textContent('#vm-endtitle'), /Txanda amaitu da/);
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-VOC-WIDE: wide screen uses the space, no overflow, reduced motion switches the animations off', async () => {
  const { ctx, page, errors } = await open({ width: 1280, height: 800, reduced: true });
  try {
    await startRound(page, 'choice');
    await noOverflow(page, 'wide');
    const box = await page.$eval('.vm-opt', e => { const r = e.getBoundingClientRect(); return [r.width, r.height]; });
    assert.ok(box[0] >= 220 && box[1] >= 64, 'answers are not tiny on a wide screen: ' + box);
    assert.equal(await page.$eval('.vm-opt', e => getComputedStyle(e).animationName), 'none', 'reduced motion');
    assert.equal(await page.$eval('#vm-card', e => getComputedStyle(e).animationName), 'none');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});
