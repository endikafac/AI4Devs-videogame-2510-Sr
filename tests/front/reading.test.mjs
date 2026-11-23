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
const VIEWS = [{ name: 'phone', width: 390, height: 844 }, { name: 'desktop', width: 1280, height: 800 }];

// A fake SpeechRecognition that records how many times it was created and lets the test push results.
const MOCK_SR = () => {
  window.__srCount = 0;
  window.SpeechRecognition = class { constructor() { window.__srCount++; window.__rec = this; this.started = 0; this.aborted = false; } start() { this.started++; } stop() { this.aborted = true; } abort() { this.aborted = true; } };
};

async function open({ width = 390, height = 844, band = 'b910', sr = false, nosr = false, lang = '' } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block', locale: 'es-ES' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !IGNORE.test(m.text())) errors.push(m.text()); });
  await page.addInitScript(() => Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' }));
  if (band) await page.addInitScript(b => { if (!localStorage.getItem('reading_guest')) localStorage.setItem('reading_guest', JSON.stringify({ band: b, sel: b })); }, band);
  if (lang) await page.addInitScript(l => localStorage.setItem('games_hub_language', l), lang);
  if (sr) await page.addInitScript(MOCK_SR);
  if (nosr) await page.addInitScript(() => { Object.defineProperty(window, 'SpeechRecognition', { value: undefined, configurable: true }); Object.defineProperty(window, 'webkitSpeechRecognition', { value: undefined, configurable: true }); });
  await page.goto(base + '/readingCoach-EFC/index.html', { waitUntil: 'load' });
  if (band) await page.waitForSelector('.rd-item', { timeout: 8000 });
  return { ctx, page, errors };
}
const noHScroll = page => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1 && document.body.scrollWidth <= window.innerWidth + 1);
const prog = page => page.evaluate(() => JSON.parse(localStorage.getItem('reading_guest') || '{}'));
async function openFirstText(page) { await page.click('.rd-item >> nth=0'); await page.waitForSelector('#rd-textbox .rd-w'); }
async function fakeClock(page) { await page.evaluate(() => { window.__t = 0; ReadingCoach._S.now = () => window.__t; }); }

for (const v of VIEWS) {
  test(`F-READ ${v.name}: asks the age once, lists 8+ texts of the band and shows the zone, with no errors or horizontal scroll`, async () => {
    const { ctx, page, errors } = await open({ ...v, band: '' });
    await page.waitForSelector('#rd-age:not([hidden])');
    await page.fill('#rd-age-in', '1'); await page.click('#rd-age-save');
    assert.equal(await page.isVisible('#rd-age-err'), true, 'bad age is refused');
    await page.fill('#rd-age-in', '9'); await page.click('#rd-age-save');
    await page.waitForSelector('.rd-item');
    assert.ok(await page.locator('.rd-item').count() >= 8);
    assert.match(await page.textContent('#rd-zone'), /95 - 125 ppm/);
    assert.equal((await prog(page)).band, 'b910');
    assert.equal(await page.evaluate(() => 'age' in JSON.parse(localStorage.getItem('reading_guest'))), false, 'only the band is stored, not the age');
    await page.reload(); await page.waitForSelector('.rd-item');
    assert.equal(await page.isVisible('#rd-age'), false, 'age is not asked again');
    // the level can be moved down and up
    await page.click('.rd-btn.chip[data-band="b56"]'); await page.waitForSelector('.rd-item');
    assert.match(await page.textContent('#rd-zone'), /30 - 60 ppm/);
    assert.ok(await noHScroll(page));
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`F-READ ${v.name}: karaoke advances word by word and earns the medal`, async () => {
    const { ctx, page, errors } = await open(v);
    await openFirstText(page);
    assert.ok(await page.isVisible('#rd-z-text') && await page.isVisible('#rd-z-ctrl'), 'zones are labelled');
    assert.equal(await page.locator('.rd-step').count(), 4);
    assert.ok(await page.locator('.rd-p.comma').count() > 0 && await page.locator('.rd-p.period').count() > 0, 'commas and full stops are coloured');
    assert.ok(await page.isVisible('#rd-help'), 'help button is there');
    await page.click('.rd-step[data-phase="karaoke"]');
    await page.evaluate(() => { ReadingCoach._S.timeScale = 0.01; });
    await page.click('#rd-play');
    await page.waitForSelector('.rd-w.rd-now');
    const first = await page.evaluate(() => Number(document.querySelector('.rd-w.rd-now').dataset.i));
    await page.waitForFunction(f => { const n = document.querySelector('.rd-w.rd-now'); return !n || Number(n.dataset.i) > f; }, first, { timeout: 5000 });
    await page.waitForFunction(() => document.querySelectorAll('.rd-w.rd-done').length === document.querySelectorAll('.rd-w').length, null, { timeout: 15000 });
    await page.waitForSelector('.rd-step[data-phase="karaoke"].done');
    assert.equal((await prog(page)).texts[await page.evaluate(() => ReadingCoach._S.cur.id)].karaoke, true);
    assert.ok(await noHScroll(page));
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`F-READ ${v.name}: manual mode with Start and Stop (mouse and space bar), simulated times, guard and records`, async () => {
    const { ctx, page, errors } = await open({ ...v, sr: true });
    await openFirstText(page);
    await page.click('.rd-step[data-phase="solo"]');
    await fakeClock(page);
    const words = await page.evaluate(() => ReadingCoach._S.tokens.length);
    const box = await page.locator('#rd-startstop').boundingBox();
    assert.ok(box.height >= 48 && box.width >= 48, 'big start button');
    // too short: 2 seconds is "review the reading" and has no record button
    await page.click('#rd-startstop'); await page.evaluate(() => { window.__t = 2000; });
    await page.click('#rd-startstop');
    assert.match(await page.textContent('#rd-result'), /Revisa la lectura/);
    assert.equal(await page.locator('#rd-good').count(), 0);
    assert.equal(Object.keys((await prog(page)).texts || {}).length, 0, 'nothing saved');
    await page.click('#rd-redo');
    // impossible speed: more than 400 wpm
    await page.evaluate(() => { window.__t = 0; });
    await page.keyboard.press('Space');
    await page.evaluate(w => { window.__t = Math.round(w / 500 * 60000); }, words);
    await page.keyboard.press('Space');
    assert.match(await page.textContent('#rd-result'), /Revisa la lectura/);
    await page.click('#rd-redo');
    // normal reading at exactly 100 wpm using the space bar while the Start button has the focus
    await page.evaluate(() => { window.__t = 0; });
    await page.focus('#rd-startstop');
    await page.keyboard.press('Space');
    assert.equal(await page.evaluate(() => !!ReadingCoach._S.solo.running), true, 'space starts');
    await page.evaluate(w => { window.__t = Math.round(w / 100 * 60000); }, words);
    await page.keyboard.press('Space');
    assert.equal(await page.evaluate(() => ReadingCoach._S.solo.running), false, 'space stops');
    assert.match(await page.textContent('.rd-ppm'), /^100 ppm$/);
    assert.ok(await page.isVisible('.rd-meter'));
    assert.match(await page.textContent('#rd-result'), /tu zona|Tu zona|zona/i);
    await page.click('#rd-good');
    const pr = await prog(page); const e = Object.values(pr.texts)[0];
    assert.equal(e.solo, true); assert.equal(e.bestPpm, 100); assert.equal(pr.hist.length, 1); assert.equal(pr.hist[0].ppm, 100); assert.equal(pr.streak, 1);
    // a faster reading raises the best mark, a slower one does not lower it
    await page.click('.rd-step[data-phase="solo"]'); await fakeClock(page);
    await page.click('#rd-startstop'); await page.evaluate(w => { window.__t = Math.round(w / 120 * 60000); }, words); await page.click('#rd-startstop'); await page.click('#rd-good');
    assert.equal(Object.values((await prog(page)).texts)[0].bestPpm, 120);
    assert.equal(await page.evaluate(() => window.__srCount), 0, 'the microphone was never touched in manual mode');
    assert.ok(await noHScroll(page));
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`F-READ ${v.name}: comprehension with labelled zones, help, effects, the reason on a miss, keyboard and stars`, async () => {
    const { ctx, page, errors } = await open(v);
    await openFirstText(page);
    await page.click('.rd-step[data-phase="quiz"]');
    await page.waitForSelector('.rd-opt');
    const n = await page.evaluate(() => ReadingCoach._S.quiz.qs.length);
    assert.match(await page.textContent('#rd-qcount'), new RegExp('Pregunta 1 de ' + n));
    assert.ok(await page.isVisible('#rd-qhelp'), 'help button');
    assert.ok(await page.isVisible('#rd-qcard .rd-zonelabel'), 'answer zone is labelled');
    for (const b of await page.locator('.rd-opt').all()) assert.ok((await b.boundingBox()).height >= 56, 'big answers');
    // help shows the text with the evidence marked
    await page.click('#rd-qhelp'); assert.equal(await page.locator('.rd-qtext mark').count(), 1); await page.click('#rd-qhelp');
    // wrong first: effect, reason and the right one highlighted
    const wrong = await page.evaluate(() => { const q = ReadingCoach._S.quiz.qs[0]; return q.opts.findIndex((_, i) => i !== q.ok); });
    await page.click(`.rd-opt[data-i="${wrong}"]`);
    await page.waitForSelector('#rd-feedback.bad');
    assert.match(await page.textContent('#rd-feedback'), /Lo dice el texto/);
    assert.equal(await page.locator('.rd-opt.right').count(), 1);
    assert.ok(await page.locator('.jx-float').count() > 0 || await page.locator('.jx-bad').count() > 0, 'wrong effect');
    await page.keyboard.press('Enter');
    // right answers with the number keys
    for (let i = 1; i < n; i++) {
      await page.waitForFunction(k => ReadingCoach._S.quiz.i === k && !ReadingCoach._S.quiz.locked, i);
      const ok = await page.evaluate(() => ReadingCoach._S.quiz.qs[ReadingCoach._S.quiz.i].ok);
      await page.keyboard.press(String(ok + 1));
      await page.waitForSelector('#rd-feedback.good');
      assert.ok(await page.locator('.jx-float').count() > 0 || await page.locator('.jx-ok').count() > 0, 'right effect');
      await page.keyboard.press('Enter');
    }
    await page.waitForSelector('#rd-endstars');
    assert.equal(await page.locator('#rd-endstars span').count(), 3);
    assert.match(await page.textContent('#rd-qcard'), new RegExp((n - 1) + ' de ' + n));
    const id = await page.evaluate(() => ReadingCoach._S.cur.id);
    assert.equal((await prog(page)).texts[id].quiz, true, 'medal for the comprehension');
    await page.click('#rd-nexttext');
    await page.waitForFunction(i => ReadingCoach._S.cur.id !== i, id);
    assert.ok(await noHScroll(page));
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`F-READ ${v.name}: pauses exercise marks commas and full stops and checks them`, async () => {
    const { ctx, page, errors } = await open(v);
    await openFirstText(page);
    await page.click('#rd-pausesbtn');
    await page.waitForSelector('.rd-gap');
    const kinds = await page.evaluate(() => ReadingCoach._S.pauseEx.ex.kinds);
    await page.click('#rd-pcheck');
    assert.match(await page.textContent('#rd-presult'), /Casi/);
    for (let i = 0; i < kinds.length; i++) {
      const times = kinds[i] === 'comma' ? 1 : kinds[i] === 'period' ? 2 : 0;
      for (let k = 0; k < times; k++) await page.click(`.rd-gap[data-i="${i}"]`);
    }
    await page.click('#rd-pcheck');
    assert.match(await page.textContent('#rd-presult'), new RegExp(`Pausas bien: ${kinds.length} de ${kinds.length}`));
    assert.match(await page.textContent('#rd-presult'), /Perfecto/);
    assert.ok(await noHScroll(page));
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}

test('F-READ listening is optional: off by default, needs the adult consent, marks words and keeps no audio or words', async () => {
  const { ctx, page, errors } = await open({ sr: true });
  assert.equal(await page.isChecked('#rd-listen'), false, 'off by default');
  await page.click('#rd-listen');
  await page.waitForSelector('#rd-consent:not([hidden])');
  const t = await page.textContent('#rd-consent-text');
  assert.match(t, /servidor/); assert.match(t, /nunca graba ni guarda audio/);
  assert.equal(await page.isDisabled('#rd-consent-ok'), true, 'cannot activate without the adult box');
  await page.click('#rd-consent-no');
  assert.equal(await page.isChecked('#rd-listen'), false);
  assert.equal((await prog(page)).consent || false, false);
  await page.click('#rd-listen'); await page.check('#rd-consent-chk'); await page.click('#rd-consent-ok');
  await page.waitForSelector('.rd-item');
  assert.equal(await page.isChecked('#rd-listen'), true);
  assert.deepEqual([(await prog(page)).consent, (await prog(page)).listen], [true, true]);
  await openFirstText(page);
  await page.click('.rd-step[data-phase="solo"]'); await fakeClock(page);
  assert.equal(await page.evaluate(() => window.__srCount), 0, 'nothing listens before Start');
  await page.click('#rd-startstop');
  assert.equal(await page.evaluate(() => window.__srCount), 1);
  const words = await page.evaluate(() => ReadingCoach._S.tokens.map(t => t.raw));
  const heardWords = words.slice(0, 12).filter((_, i) => i !== 3).join(' '); // one word skipped
  await page.evaluate(h => { window.__rec.onresult({ results: [[{ transcript: h }]] }); }, heardWords);
  assert.ok(await page.locator('.rd-w.rd-read').count() >= 8, 'read words are green');
  assert.equal(await page.locator('.rd-w.rd-skip').count(), 1, 'the skipped word is orange');
  await page.evaluate(w => { window.__t = Math.round(w / 100 * 60000); }, words.length);
  await page.click('#rd-startstop');
  assert.match(await page.textContent('#rd-result'), /Palabras leídas: 11 de/);
  assert.equal(await page.evaluate(() => window.__rec.aborted), true, 'recognition is closed on Stop');
  assert.equal(await page.evaluate(() => ReadingCoach._S.heard.length), 0, 'the words heard are dropped');
  const dump = await page.evaluate(() => JSON.stringify(localStorage) + JSON.stringify(sessionStorage));
  assert.ok(!dump.includes(words[1].replace(/[^\p{L}]/gu, '') + ' ' + words[2].replace(/[^\p{L}]/gu, '')), 'no transcript in storage');
  assert.ok(await noHScroll(page));
  // turning it off removes the consent
  await page.click('#rd-quit'); await page.waitForSelector('.rd-item');
  await page.click('#rd-listen');
  const p2 = await prog(page); assert.deepEqual([p2.consent, p2.listen], [false, false]);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('F-READ without speech recognition the option is disabled and the manual mode still works', async () => {
  const { ctx, page, errors } = await open({ nosr: true });
  assert.equal(await page.isDisabled('#rd-listen'), true);
  assert.match(await page.textContent('#rd-settings'), /no admite reconocimiento de voz/);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('F-READ settings: letter size, easy-to-read letters, reading language and interface language', async () => {
  const { ctx, page, errors } = await open({});
  const size = () => page.evaluate(() => (document.querySelector('#rd-textbox') ? parseFloat(getComputedStyle(document.querySelector('#rd-textbox')).fontSize) : 0));
  await openFirstText(page); const s0 = await size(); await page.click('#rd-quit'); await page.waitForSelector('.rd-item');
  await page.click('#rd-fsp'); await page.click('#rd-fsp');
  await openFirstText(page); assert.ok(await size() > s0, 'bigger letters'); await page.click('#rd-quit'); await page.waitForSelector('.rd-item');
  await page.check('#rd-dys'); assert.equal(await page.evaluate(() => document.body.classList.contains('rd-dys')), true);
  // reading language without texts for the band falls back to Spanish and says so
  await page.selectOption('#rd-rlang', 'eu'); await page.waitForSelector('.rd-item');
  assert.ok(await page.locator('.rd-item').count() >= 1);
  await page.click('.rd-btn.chip[data-band="b13"]'); await page.waitForSelector('#rd-fallback:not([hidden])');
  assert.match(await page.textContent('#rd-fallback'), /castellano/);
  await page.selectOption('#rd-rlang', 'es');
  // interface language
  await page.evaluate(() => PlatformI18n.setLanguage('eu-ES'));
  await page.waitForFunction(() => document.getElementById('rd-h1').textContent === 'Irakurketa gidatua');
  assert.match(await page.textContent('#rd-z-zone'), /Zure eremua/);
  await page.evaluate(() => PlatformI18n.setLanguage('fr-FR'));
  await page.waitForFunction(() => document.getElementById('rd-h1').textContent === 'Lecture guidée');
  assert.match(await page.textContent('#rd-zone'), /mpm/);
  assert.ok(await noHScroll(page));
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('F-READ a Basque text opens in its own language with its source and licence', async () => {
  const { ctx, page, errors } = await open({ band: 'b78' });
  await page.selectOption('#rd-rlang', 'eu'); await page.waitForSelector('.rd-item');
  await openFirstText(page);
  assert.equal(await page.getAttribute('#rd-textbox', 'lang'), 'eu');
  assert.match(await page.textContent('#rd-credit'), /Licencia: public-domain/);
  assert.deepEqual(errors, []);
  await ctx.close();
});

// ------------------------------------------------------------------ Aventuras: books in chapters
async function openShelf(opts) { const r = await open(opts); await r.page.waitForSelector('.rd-book'); return r; }
async function openBookAt(page, n = 0) { await page.click(`.rd-book >> nth=${n}`); await page.waitForSelector('.rd-chap'); }
/** Answers every question of the open quiz; mode 'right' or 'wrong'. Ends on the final card. */
async function answerAll(page, mode) {
  await page.click('.rd-step[data-phase="quiz"]'); await page.waitForSelector('.rd-opt');
  const n = await page.evaluate(() => ReadingCoach._S.quiz.qs.length);
  for (let i = 0; i < n; i++) {
    await page.waitForFunction(k => ReadingCoach._S.quiz.i === k && !ReadingCoach._S.quiz.locked, i);
    const pick = await page.evaluate(m => { const q = ReadingCoach._S.quiz.qs[ReadingCoach._S.quiz.i]; return m === 'right' ? q.ok : q.opts.findIndex((_, k) => k !== q.ok); }, mode);
    await page.keyboard.press(String(pick + 1));
    await page.waitForSelector('#rd-feedback:not([hidden])');
    await page.keyboard.press('Enter');
  }
  await page.waitForSelector('#rd-endstars');
}
const chapStates = page => page.evaluate(() => [...document.querySelectorAll('.rd-chap')].map(b => b.disabled));

for (const v of VIEWS) {
  test(`F-READ ${v.name}: the Libros shelf shows covers (emoji and colour), progress and no errors or horizontal scroll`, async () => {
    const { ctx, page, errors } = await openShelf({ ...v, band: 'b56' });
    assert.ok(await page.isVisible('#rd-z-books'), 'the zone is labelled');
    assert.match(await page.textContent('#rd-z-books'), /Aventuras/);
    assert.ok(await page.locator('.rd-book').count() >= 2, 'at least two books per band');
    const cover = await page.evaluate(() => { const c = document.querySelector('.rd-book .rd-cover'); return { emoji: c.textContent.trim(), bg: getComputedStyle(c).backgroundImage }; });
    assert.ok(cover.emoji.length > 0 && /gradient/.test(cover.bg), 'cover has an emoji and a colour');
    assert.match(await page.textContent('.rd-book >> nth=0'), /0 de 3 capítulos/);
    assert.ok((await page.locator('.rd-book').first().boundingBox()).height >= 48);
    assert.ok(await noHScroll(page));
    // the shelf follows the level
    await page.click('.rd-btn.chip[data-band="b13"]'); await page.waitForSelector('.rd-book');
    assert.ok(await page.locator('.rd-book').count() >= 2);
    assert.match(await page.textContent('#rd-shelf'), /isla del tesoro/i);
    assert.ok(await noHScroll(page));
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`F-READ ${v.name}: chapter list is a path and chapters unlock in order`, async () => {
    const { ctx, page, errors } = await openShelf({ ...v, band: 'b56' });
    await openBookAt(page);
    assert.equal(await page.locator('.rd-chap').count(), 3);
    assert.ok(await page.isVisible('#rd-path') && await page.isVisible('#rd-bookhead'));
    assert.deepEqual(await chapStates(page), [false, true, true], 'only the first chapter is open');
    assert.match(await page.textContent('.rd-pathitem.locked'), /Termina antes el capítulo 1/);
    assert.equal(await page.locator('.rd-pathitem.current').count(), 1);
    // clicking a locked chapter does nothing
    await page.evaluate(() => document.querySelectorAll('.rd-chap')[2].click());
    assert.equal(await page.isVisible('#rd-text'), false);
    assert.ok(await noHScroll(page));
    // reading but failing the questions does not unlock the next chapter
    await page.click('.rd-chap >> nth=0'); await page.waitForSelector('#rd-textbox .rd-w');
    assert.match(await page.textContent('#rd-credit'), /Recontado con palabras propias/);
    assert.match(await page.textContent('#rd-credit'), /public-domain/);
    await answerAll(page, 'wrong');
    assert.equal(await page.locator('#rd-nextchapter').count(), 0);
    assert.ok(await page.isVisible('#rd-retryquiz'), 'a retry is offered');
    await page.click('#rd-backbook'); await page.waitForSelector('.rd-chap');
    assert.deepEqual(await chapStates(page), [false, true, true]);
    assert.ok(await noHScroll(page));
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`F-READ ${v.name}: finishing a chapter gives a star and a teaser, unlocks the next one and the book can be completed`, async () => {
    const { ctx, page, errors } = await openShelf({ ...v, band: 'b56' });
    await openBookAt(page);
    for (let i = 0; i < 3; i++) {
      if (i === 0) await page.click(`.rd-chap[data-idx="0"]`);
      await page.waitForSelector("#rd-textbox .rd-w");
      const id = await page.evaluate(() => ReadingCoach._S.cur.id);
      await answerAll(page, 'right');
      assert.equal(await page.locator('#rd-endstars span.on').count(), 3, 'three stars for a perfect chapter');
      const e = (await prog(page)).texts[id];
      assert.equal(e.quiz, true); assert.equal(e.stars, 3);
      if (i < 2) {
        assert.ok(await page.isVisible('#rd-teaser'), 'teaser of the next chapter');
        assert.match(await page.textContent('#rd-teaser'), /Próximo capítulo/);
        assert.ok((await page.textContent('#rd-teaser')).includes('«'), 'the hook is quoted');
        assert.ok(await noHScroll(page));
        await page.click('#rd-nextchapter');
        await page.waitForFunction(k => ReadingCoach._S.cur.id !== k, id);
      } else {
        assert.equal(await page.locator('#rd-teaser').count(), 0);
        assert.ok(await page.isVisible('#rd-bookdone'), 'the book is finished');
        assert.ok(await noHScroll(page));
        await page.click('#rd-backbook'); await page.waitForSelector('.rd-chap');
      }
    }
    assert.deepEqual(await chapStates(page), [false, false, false]);
    assert.equal(await page.locator('.rd-pathitem.done').count(), 3);
    assert.match(await page.textContent('#rd-bookhead'), /Libro terminado/);
    await page.click('#rd-bookback'); await page.waitForSelector('.rd-book.finished');
    assert.match(await page.textContent('.rd-book.finished'), /Libro terminado/);
    assert.ok(await noHScroll(page));
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`F-READ ${v.name}: speed and comprehension are tracked per chapter in manual mode, with no microphone`, async () => {
    const { ctx, page, errors } = await openShelf({ ...v, band: 'b78', sr: true });
    await openBookAt(page);
    await page.click('.rd-chap >> nth=0'); await page.waitForSelector('#rd-textbox .rd-w');
    await page.click('.rd-step[data-phase="solo"]'); await fakeClock(page);
    const words = await page.evaluate(() => ReadingCoach._S.tokens.length), id = await page.evaluate(() => ReadingCoach._S.cur.id);
    await page.click('#rd-startstop'); await page.evaluate(w => { window.__t = Math.round(w / 80 * 60000); }, words); await page.click('#rd-startstop');
    assert.match(await page.textContent('.rd-ppm'), /^80 ppm$/);
    await page.click('#rd-good');
    const pr = await prog(page);
    assert.equal(pr.texts[id].bestPpm, 80); assert.equal(pr.texts[id].solo, true);
    assert.equal(pr.hist[0].id, id);
    assert.equal(await page.evaluate(() => window.__srCount), 0, 'the microphone was never touched');
    await answerAll(page, 'right');
    assert.equal((await prog(page)).texts[id].quiz, true);
    await page.click('#rd-backbook'); await page.waitForSelector('.rd-chap');
    assert.match(await page.textContent('.rd-chap >> nth=0'), /Mejor 80 ppm/);
    assert.ok(await noHScroll(page));
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}

test('F-READ Aventuras: Escape and the back button return from the chapter list, and the labels follow the interface language', async () => {
  const { ctx, page, errors } = await openShelf({ band: 'b78' });
  await openBookAt(page); await page.keyboard.press('Escape'); await page.waitForSelector('.rd-book');
  await openBookAt(page);
  await page.evaluate(() => PlatformI18n.setLanguage('fr-FR'));
  await page.waitForFunction(() => /Chapitre 1/.test(document.getElementById('rd-path').textContent));
  assert.match(await page.textContent('#rd-bookback'), /Retour aux livres/);
  await page.click('#rd-bookback'); await page.waitForSelector('.rd-book');
  assert.match(await page.textContent('#rd-z-books'), /Aventures/);
  assert.match(await page.textContent('.rd-book >> nth=0'), /chapitres sur 3/);
  assert.ok(await noHScroll(page));
  assert.deepEqual(errors, []);
  await ctx.close();
});

for (const l of ['en', 'eu', 'gl', 'ca', 'fr']) {
  test(`F-READ Aventuras: a book in ${l} opens its first chapter in its own language and the later ones stay locked`, async () => {
    const { ctx, page, errors } = await openShelf({ band: 'b78' });
    await page.selectOption('#rd-rlang', l); await page.waitForSelector('.rd-book');
    assert.equal(await page.locator('#rd-books-fallback:not([hidden])').count(), 0, 'no fallback to Spanish');
    await openBookAt(page);
    assert.deepEqual(await chapStates(page), [false, true, true]);
    await page.click('.rd-chap >> nth=0'); await page.waitForSelector('#rd-textbox .rd-w');
    assert.equal(await page.getAttribute('#rd-textbox', 'lang'), l);
    assert.match(await page.textContent('#rd-credit'), /public-domain/);
    assert.ok(await noHScroll(page));
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}
