import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

// Interests ("Que te gusta?"): picker, "Para ti" in the reading home, similar texts after a text, level proposal,
// "Segun tus gustos" row of the hub and the Familia screen. Same pattern as reading.test.mjs and profiles.test.mjs:
// real code, serviceWorkers blocked, locale es-ES, 390x844 and 1280x800.

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

// The in-memory Firebase SDK stand-in of profiles.test.mjs, reused as it is (one copy of the stub, no network).
const FIREBASE_STUB = fs.readFileSync(path.join(import.meta.dirname, 'profiles.test.mjs'), 'utf8').match(/const FIREBASE_STUB = `([\s\S]*?)`;\n/)[1];

const IGNORE = /favicon|Missing or insufficient permissions|unauthorized-domain|net::ERR|Failed to load resource|firestore\.googleapis|identitytoolkit|offline|WebChannel|manifest|gstatic/i;
const VIEWS = [{ name: 'phone', width: 390, height: 844 }, { name: 'desktop', width: 1280, height: 800 }];
const noHScroll = page => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1 && document.body.scrollWidth <= window.innerWidth + 1);
const store = (page, k) => page.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), k);

/** Reading as a guest (no account). prog = reading_guest, ints = local interests of the guest. */
async function openReading({ width = 390, height = 844, prog = { band: 'b910', sel: 'b910' }, ints = null, lang = '' } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block', locale: 'es-ES' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !IGNORE.test(m.text())) errors.push(m.text()); });
  await page.addInitScript(() => Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' }));
  await page.addInitScript(([p, i]) => {
    if (!localStorage.getItem('reading_guest')) localStorage.setItem('reading_guest', JSON.stringify(p));
    if (i && !localStorage.getItem('games_hub_interests_guest')) localStorage.setItem('games_hub_interests_guest', JSON.stringify(i));
  }, [prog, ints]);
  if (lang) await page.addInitScript(l => localStorage.setItem('games_hub_language', l), lang);
  await page.goto(base + '/readingCoach-EFC/index.html', { waitUntil: 'load' });
  return { ctx, page, errors };
}
const SEEN = { band: 'b910', sel: 'b910', intDone: true };

async function answerAll(page) {
  await page.click('.rd-step[data-phase="quiz"]'); await page.waitForSelector('.rd-opt');
  const n = await page.evaluate(() => ReadingCoach._S.quiz.qs.length);
  for (let i = 0; i < n; i++) {
    await page.waitForFunction(k => ReadingCoach._S.quiz.i === k && !ReadingCoach._S.quiz.locked, i);
    const pick = await page.evaluate(() => ReadingCoach._S.quiz.qs[ReadingCoach._S.quiz.i].ok);
    await page.keyboard.press(String(pick + 1));
    await page.waitForSelector('#rd-feedback:not([hidden])');
    await page.keyboard.press('Enter');
  }
  await page.waitForSelector('#rd-endstars');
}

for (const v of VIEWS) {
  test(`F-INT-PICKER ${v.name}: shown once after the age, 14 big tiles, 1 to 5, saved in the profile, editable from the home`, async () => {
    const { ctx, page, errors } = await openReading({ ...v, prog: { band: 'b910', sel: 'b910' } });
    try {
      await page.waitForSelector('#pi-picker', { timeout: 8000 });
      assert.equal(await page.isVisible('#rd-home'), false, 'the picker comes first');
      assert.equal(await page.locator('#pi-title').innerText(), '¿Qué te gusta?');
      assert.equal(await page.locator('.pi-tile').count(), 14);
      for (const b of await page.locator('.pi-tile').all()) { const r = await b.boundingBox(); assert.ok(r.height >= 96 && r.width >= 80, 'big tile ' + JSON.stringify(r)); }
      assert.equal(await page.locator('#pi-save').isDisabled(), true, 'nothing chosen yet');
      assert.equal(await page.locator('#pi-skip').isVisible(), true, 'skippable');
      assert.ok(await noHScroll(page));
      const ids = await page.locator('.pi-tile').evaluateAll(n => n.map(x => x.dataset.id));
      for (const id of ids.slice(0, 5)) await page.click(`.pi-tile[data-id="${id}"]`);
      assert.equal(await page.locator('#pi-count').innerText(), '5 de 5 elegidas');
      await page.click(`.pi-tile[data-id="${ids[5]}"]`);
      assert.match(await page.locator('#pi-msg').innerText(), /Ya tienes 5/);
      assert.equal(await page.locator('.pi-tile[aria-pressed="true"]').count(), 5, 'a sixth one is refused');
      await page.click(`.pi-tile[data-id="${ids[4]}"]`);
      assert.equal(await page.locator('#pi-msg').innerText(), '');
      assert.equal(await page.locator('#pi-count').innerText(), '4 de 5 elegidas');
      await page.click('#pi-save');
      await page.waitForSelector('#rd-home:not([hidden])');
      assert.deepEqual(await store(page, 'games_hub_interests_guest'), ids.slice(0, 4));
      assert.equal((await store(page, 'reading_guest')).intDone, true);
      assert.equal(await page.locator('#rd-mine .rd-pill').count(), 4);
      assert.ok(await page.isVisible('#rd-intchange'));
      assert.ok(await noHScroll(page));
      // it is not asked again
      await page.reload(); await page.waitForSelector('#rd-home:not([hidden])');
      assert.equal(await page.locator('#pi-picker').count(), 0);
      // editable from the home: the saved ones come pre-selected, change one and save
      await page.click('#rd-intchange'); await page.waitForSelector('#pi-picker');
      assert.deepEqual(await page.locator('.pi-tile[aria-pressed="true"]').evaluateAll(n => n.map(x => x.dataset.id)), ids.slice(0, 4));
      await page.click(`.pi-tile[data-id="${ids[0]}"]`); await page.click(`.pi-tile[data-id="${ids[9]}"]`);
      await page.click('#pi-save'); await page.waitForSelector('#rd-home:not([hidden])');
      assert.deepEqual(await store(page, 'games_hub_interests_guest'), [ids[1], ids[2], ids[3], ids[9]]);
      assert.deepEqual(errors, []);
    } finally { await ctx.close(); }
  });
}

test('F-INT-AGE: the picker follows the age question on a first visit and the home shows the chosen ones', async () => {
  const { ctx, page, errors } = await openReading({ prog: {} });
  try {
    await page.waitForSelector('#rd-age:not([hidden])');
    await page.fill('#rd-age-in', '9'); await page.click('#rd-age-save');
    await page.waitForSelector('#pi-picker');
    await page.click('.pi-tile[data-id="space"]'); await page.click('#pi-save');
    await page.waitForSelector('#rd-home:not([hidden])');
    assert.match(await page.locator('#rd-mine').innerText(), /El espacio/);
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-INT-SKIP: the picker can be skipped (button or Escape), is not asked again, and can be opened later', async () => {
  const { ctx, page, errors } = await openReading();
  try {
    await page.waitForSelector('#pi-picker');
    await page.click('#pi-skip'); await page.waitForSelector('#rd-home:not([hidden])');
    assert.equal(await store(page, 'games_hub_interests_guest'), null);
    assert.ok(await page.isVisible('#rd-intask'), 'an invitation instead of the picks');
    assert.equal(await page.locator('#rd-fylist').count(), 0);
    assert.ok(await page.locator('.rd-item').count() >= 8, 'the normal list is there');
    await page.reload(); await page.waitForSelector('#rd-home:not([hidden])');
    assert.equal(await page.locator('#pi-picker').count(), 0);
    await page.click('#rd-intask'); await page.waitForSelector('#pi-picker');
    await page.keyboard.press('Escape'); await page.waitForSelector('#rd-home:not([hidden])');
    // #gustos opens the picker straight away (link of the hub)
    await page.goto(base + '/readingCoach-EFC/index.html#gustos'); await page.reload();
    await page.waitForSelector('#pi-picker');
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-INT-LANG: the picker and the home labels follow the language of the page', async () => {
  const { ctx, page, errors } = await openReading({ lang: 'en-US' });
  try {
    await page.waitForSelector('#pi-picker');
    assert.equal(await page.locator('#pi-title').innerText(), 'What do you like?');
    assert.equal(await page.locator('.pi-tile[data-id="dinosaurs"] .pi-name').innerText(), 'Dinosaurs');
    await page.click('.pi-tile[data-id="dinosaurs"]'); await page.click('#pi-save');
    await page.waitForSelector('#rd-home:not([hidden])');
    assert.match(await page.locator('#rd-z-fy').textContent(), /For you/);
    assert.match(await page.locator('#rd-intchange').innerText(), /Change my likes/);
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

for (const v of VIEWS) {
  test(`F-INT-FORYOU ${v.name}: "Para ti" comes first with the texts and books of the interests, and the list puts them first`, async () => {
    const { ctx, page, errors } = await openReading({ ...v, prog: { band: 'b78', sel: 'b78', intDone: true }, ints: ['dinosaurs'] });
    try {
      await page.waitForSelector('#rd-fylist');
      assert.match(await page.locator('#rd-z-fy').textContent(), /Para ti/);
      // the zone is before the books and the list
      assert.ok(await page.evaluate(() => document.getElementById('rd-fy').compareDocumentPosition(document.getElementById('rd-shelf')) & Node.DOCUMENT_POSITION_FOLLOWING));
      assert.ok(await page.evaluate(() => document.getElementById('rd-fy').compareDocumentPosition(document.getElementById('rd-list')) & Node.DOCUMENT_POSITION_FOLLOWING));
      const picks = await page.locator('#rd-fylist .rd-fyitem').evaluateAll(n => n.map(x => ({ kind: x.dataset.kind, t: x.querySelector('b').textContent })));
      assert.equal(picks[0].kind, 'book', 'the book of the interest first');
      assert.equal(picks[0].t, 'Bruno y el huevo de piedra');
      assert.ok(picks.filter(p => p.kind === 'text').length >= 2);
      for (const b of await page.locator('#rd-fylist .rd-fyitem').all()) assert.ok((await b.boundingBox()).height >= 56);
      // the full list starts with the dinosaur texts (marked) and has the same number of texts as without interests
      const list = await page.locator('#rd-list .rd-item b').allTextContents();
      assert.ok(list[0].startsWith('⭐') && list[1].startsWith('⭐'), 'matching texts first: ' + list.slice(0, 3));
      assert.ok(list.length >= 8 + 2);
      assert.equal(list.filter(t => t.startsWith('⭐')).length, 2);
      // a pick opens the text, and the book opens its path
      await page.click('#rd-fylist .rd-fyitem[data-kind="text"] >> nth=0');
      await page.waitForSelector('#rd-textbox .rd-w');
      await page.click('#rd-quit'); await page.waitForSelector('#rd-home:not([hidden])');
      await page.click('#rd-fylist .rd-fyitem[data-kind="book"]'); await page.waitForSelector('.rd-chap');
      assert.match(await page.locator('#rd-bookhead').innerText(), /Bruno y el huevo de piedra/);
      assert.ok(await noHScroll(page));
      assert.deepEqual(errors, []);
    } finally { await ctx.close(); }
  });
}

test('F-INT-FORYOU-NONE: without interests there is no "Para ti" list and the order is the usual one', async () => {
  const { ctx, page, errors } = await openReading({ prog: SEEN });
  try {
    await page.waitForSelector('.rd-item');
    assert.equal(await page.locator('#rd-fylist').count(), 0);
    const list = await page.locator('#rd-list .rd-item b').allTextContents();
    assert.equal(list[0], 'La lechera', 'original order');
    assert.ok(list.every(t => !t.startsWith('⭐')));
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-INT-SIMILAR: after a text the child gets 2 similar ones, and the quiz result is logged for the level proposal', async () => {
  const { ctx, page, errors } = await openReading({ prog: SEEN, ints: ['space'] });
  try {
    await page.waitForSelector('#rd-fylist');
    await page.click('#rd-list .rd-item >> nth=0');
    await page.waitForSelector('#rd-textbox .rd-w');
    const first = await page.evaluate(() => ReadingCoach._S.cur);
    assert.ok(first.topics.includes('space'));
    await answerAll(page);
    await page.waitForSelector('#rd-similar');
    assert.match(await page.locator('#rd-similar').innerText(), /otro parecido/);
    const ids = await page.locator('.rd-simbtn').evaluateAll(n => n.map(x => x.dataset.id));
    assert.equal(ids.length, 2); assert.ok(!ids.includes(first.id));
    const topics = await page.evaluate(i => i.map(id => ReadingCoach._S.list.find(x => x.id === id).topics), ids);
    assert.ok(topics[0].includes('space'), 'the first one shares the topic');
    for (const b of await page.locator('.rd-simbtn').all()) assert.ok((await b.boundingBox()).height >= 44);
    assert.ok(await page.isVisible('#rd-nexttext') && await page.isVisible('#rd-backlist'), 'manual navigation stays');
    const prog = await store(page, 'reading_guest');
    assert.equal(prog.qlog.length, 1); assert.equal(prog.qlog[0].id, first.id); assert.equal(prog.qlog[0].b, 'b910');
    assert.equal(prog.qlog[0].c, prog.qlog[0].n, 'all answers right');
    assert.ok(await noHScroll(page));
    await page.click(`.rd-simbtn[data-id="${ids[0]}"]`);
    await page.waitForSelector('#rd-textbox .rd-w');
    assert.equal(await page.evaluate(() => ReadingCoach._S.cur.id), ids[0]);
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

const entry = (b, o) => Object.assign({ d: '2026-11-20', b }, o);
const rows = (n, f) => Array.from({ length: n }, (_, i) => f(i));
const GRADES = /nota|suspens|aprobad|calificaci|puntuaci|\b\d+\s*\/\s*\d+|\b\d+\s*(%|puntos)/i;

test('F-INT-ADAPT: a little harder or an easier one is proposed from recent ppm and understanding, in words, never a mark', async () => {
  // harder: reads inside the zone and understands everything
  let r = await openReading({ prog: { ...SEEN, band: 'b78', sel: 'b78', hist: rows(3, () => entry('b78', { ppm: 80 })), qlog: rows(3, () => entry('b78', { c: 3, n: 3 })) } });
  try {
    await r.page.waitForSelector('#rd-adapt');
    assert.equal(await r.page.locator('#rd-adapt').getAttribute('data-kind'), 'harder');
    const text = await r.page.locator('#rd-fy').innerText();
    assert.match(text, /un poco más difícil/); assert.match(text, /9-10 años/);
    assert.ok(!GRADES.test(text), 'no marks: ' + text);
    assert.equal(await r.page.locator('#rd-adapt-keep').count(), 0);
    await r.page.click('#rd-adapt-go');
    await r.page.waitForSelector('.rd-btn.chip.on[data-band="b910"]');
    assert.match(await r.page.textContent('#rd-zone'), /95 - 125 ppm/);
    assert.deepEqual(r.errors, []);
  } finally { await r.ctx.close(); }
  // dismiss: "Me quedo aqui" hides it for the session and nothing changes
  r = await openReading({ prog: { ...SEEN, band: 'b78', sel: 'b78', hist: rows(3, () => entry('b78', { ppm: 80 })), qlog: rows(3, () => entry('b78', { c: 3, n: 3 })) } });
  try {
    await r.page.waitForSelector('#rd-adapt');
    await r.page.click('#rd-adapt-stay');
    await r.page.waitForSelector('#rd-home:not([hidden])');
    assert.equal(await r.page.locator('#rd-adapt').count(), 0);
    assert.equal((await store(r.page, 'reading_guest')).sel, 'b78');
  } finally { await r.ctx.close(); }
  // easier: does not understand much
  r = await openReading({ prog: { ...SEEN, hist: rows(3, () => entry('b910', { ppm: 100 })), qlog: rows(3, () => entry('b910', { c: 0, n: 3 })) } });
  try {
    await r.page.waitForSelector('#rd-adapt');
    assert.equal(await r.page.locator('#rd-adapt').getAttribute('data-kind'), 'easier');
    const text = await r.page.locator('#rd-fy').innerText();
    assert.match(text, /más fácil/); assert.match(text, /7-8 años/); assert.ok(!GRADES.test(text), 'no marks: ' + text);
    await r.page.click('#rd-adapt-go');
    await r.page.waitForSelector('.rd-btn.chip.on[data-band="b78"]');
  } finally { await r.ctx.close(); }
  // inside the zone: only encouragement; no data: nothing
  r = await openReading({ prog: { ...SEEN, hist: rows(3, () => entry('b910', { ppm: 60 })), qlog: rows(3, () => entry('b910', { c: 3, n: 3 })) } });
  try {
    await r.page.waitForSelector('#rd-adapt-keep');
    assert.equal(await r.page.locator('#rd-adapt').count(), 0);
  } finally { await r.ctx.close(); }
  r = await openReading({ prog: SEEN });
  try {
    await r.page.waitForSelector('.rd-item');
    assert.equal(await r.page.locator('#rd-adapt, #rd-adapt-keep').count(), 0);
  } finally { await r.ctx.close(); }
});

// ------------------------------------------------------------------ signed in children (in-memory Firebase)
const ME = { uid: 'ownr123456', email: 'luna@example.com', emailVerified: true, displayName: 'Luna Real', photoURL: null };
const MYPROFILE = { uid: ME.uid, username: 'Luna', nicknameKey: 'luna', avatar: '🦊', photoURL: null, xp: 0, totalPoints: 0, level: 0, consent: { version: '2026-11', guardian: true } };
const KID = 'kid222222', KID2 = 'kid111111', KID_VIEW = 'kid333333', KID_EDIT = 'kid444444';
const VIEW_OWNER = 'famview001', EDIT_OWNER = 'famedit002';
const mem = (owner, name, role) => ({
  ['users/' + ME.uid + '/memberships/' + owner]: { ownerUid: owner, ownerName: name, role },
  ['users/' + owner + '/guardians/' + ME.uid]: { uid: ME.uid, email: ME.email, name: 'Luna', role, inviteId: 'x' }
});
const family = (kid = {}) => ({
  ['users/' + ME.uid + '/players/' + KID]: { username: 'Nora', avatar: '🦄', kind: 'child', totalPoints: 0, xp: 0, ...kid },
  ['users/' + ME.uid + '/players/' + KID2]: { username: 'Pipo', avatar: '🐼', kind: 'child', totalPoints: 10, xp: 0 },
  ...mem(VIEW_OWNER, 'Marta', 'view'),
  ['users/' + VIEW_OWNER + '/players/' + KID_VIEW]: { username: 'Tom', avatar: '🐯', kind: 'child', totalPoints: 3, interests: ['music'] },
  ...mem(EDIT_OWNER, 'Rosa', 'edit'),
  ['users/' + EDIT_OWNER + '/players/' + KID_EDIT]: { username: 'Lia', avatar: '🦋', kind: 'child', totalPoints: 1 }
});
// init scripts run in the page: the child id travels as an argument, not as a closure
const asKid = (pid = KID) => ({ fn: p => { sessionStorage.setItem('games_hub_picked_ownr123456', '1'); localStorage.setItem('games_hub_player_ownr123456', p); }, arg: pid });
async function openAccount(docs, { width = 390, height = 844, url = '/index.html', init, ls = {} } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block', locale: 'es-ES' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !IGNORE.test(m.text())) errors.push(m.text()); });
  page.on('dialog', d => d.accept());
  await page.route('https://www.gstatic.com/firebasejs/**', r => r.fulfill({ contentType: 'text/javascript', body: /app-compat/.test(r.request().url()) ? FIREBASE_STUB : '' }));
  await page.addInitScript(s => { window.__SEED = s; try { localStorage.setItem('games_hub_language', 'es-ES'); } catch (e) {} }, { user: ME, docs: { ['users/' + ME.uid]: MYPROFILE, ...docs } });
  await page.addInitScript(l => { for (const k of Object.keys(l)) localStorage.setItem(k, l[k]); }, ls);
  if (init) await page.addInitScript(init.fn || init, init.arg);
  await page.addInitScript(() => Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' }));
  await page.goto(base + url, { waitUntil: 'load' });
  return { ctx, page, errors };
}
const kidDoc = (page, owner, pid) => page.evaluate(([o, p]) => window.__store.get('users/' + o + '/players/' + p), [owner, pid]);
const READING = '/readingCoach-EFC/index.html';
const kidProg = JSON.stringify({ band: 'b910', sel: 'b910' });

test('F-INT-CLOUD: a child with interests in the player document sees them in the reading home without being asked again', async () => {
  const { ctx, page, errors } = await openAccount(family({ interests: ['space', 'music'] }), { url: READING, init: asKid(), ls: { ['reading_' + ME.uid + '_' + KID]: kidProg } });
  try {
    await page.waitForSelector('#rd-home:not([hidden])', { timeout: 8000 });
    await page.waitForSelector('#rd-mine .rd-pill');
    assert.match(await page.locator('#rd-mine').innerText(), /El espacio[\s\S]*Música/);
    assert.equal(await page.locator('#pi-picker').isVisible().catch(() => false), false);
    assert.deepEqual(await store(page, 'games_hub_interests_' + ME.uid + '_' + KID), ['space', 'music'], 'local copy follows the document');
    assert.ok(await page.locator('#rd-fylist .rd-fyitem').count() >= 1);
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-INT-CLOUD-SAVE: the first visit of a child asks once and saves the ids in the player document', async () => {
  const { ctx, page, errors } = await openAccount(family(), { url: READING, init: asKid(), ls: { ['reading_' + ME.uid + '_' + KID]: kidProg } });
  try {
    await page.waitForSelector('#pi-picker', { timeout: 8000 });
    await page.click('.pi-tile[data-id="dinosaurs"]'); await page.click('.pi-tile[data-id="robots"]'); await page.click('#pi-save');
    await page.waitForSelector('#rd-home:not([hidden])');
    await page.waitForFunction(([o, p]) => (window.__store.get('users/' + o + '/players/' + p) || {}).interests, [ME.uid, KID]);
    assert.deepEqual((await kidDoc(page, ME.uid, KID)).interests, ['dinosaurs', 'robots']);
    assert.equal((await kidDoc(page, ME.uid, KID)).username, 'Nora', 'the rest of the document is untouched');
    assert.deepEqual(await store(page, 'games_hub_interests_' + ME.uid + '_' + KID), ['dinosaurs', 'robots']);
    // the adult profile of the same account keeps its own copy and its document gets nothing
    assert.equal(await page.evaluate(() => 'interests' in window.__store.get('users/ownr123456')), false);
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

test('F-INT-CLOUD-LOCAL: interests chosen offline or as a guest (local copy) are uploaded when the child has none online', async () => {
  const { ctx, page, errors } = await openAccount(family(), { url: READING, init: asKid(),
    ls: { ['reading_' + ME.uid + '_' + KID]: JSON.stringify({ band: 'b910', sel: 'b910', intDone: true }), ['games_hub_interests_' + ME.uid + '_' + KID]: JSON.stringify(['pirates']) } });
  try {
    await page.waitForSelector('#rd-mine .rd-pill', { timeout: 8000 });
    await page.waitForFunction(([o, p]) => (window.__store.get('users/' + o + '/players/' + p) || {}).interests, [ME.uid, KID]);
    assert.deepEqual((await kidDoc(page, ME.uid, KID)).interests, ['pirates']);
    assert.deepEqual(errors, []);
  } finally { await ctx.close(); }
});

for (const v of VIEWS) {
  test(`F-INT-HUB ${v.name}: a child profile gets "Segun tus gustos" first, with games from the table; adults and guests do not`, async () => {
    const { ctx, page, errors } = await openAccount(family({ interests: ['dinosaurs', 'space'] }), { ...v, init: asKid() });
    try {
      await page.waitForSelector('#hub-likes:not([hidden])', { timeout: 8000 });
      assert.match(await page.locator('#hub-likes-h').innerText(), /Según tus gustos/);
      const cards = await page.locator('#hub-likes-row .foryou-card[data-id]').evaluateAll(n => n.map(x => ({ id: x.dataset.id, t: x.innerText.trim() })));
      assert.deepEqual(cards.slice(0, 2).map(c => c.id), ['mapas', 'vocab'], 'shared by both interests first');
      assert.ok(cards.length >= 3 && cards.length <= 6);
      assert.match(cards[0].t, /🦖🚀/, 'says why');
      assert.ok(!cards.some(c => c.id === 'crossword' || c.id === 'english'), 'only games a child can play');
      for (const b of await page.locator('#hub-likes-row .foryou-card').all()) assert.ok((await b.boundingBox()).height >= 55.5);
      assert.equal(await page.locator('#hub-likes-change').getAttribute('href'), 'readingCoach-EFC/index.html#gustos');
      assert.ok(await page.evaluate(() => document.getElementById('hub-likes').compareDocumentPosition(document.getElementById('hub-grid')) & Node.DOCUMENT_POSITION_FOLLOWING), 'before the grid');
      assert.equal(await page.locator('#hub-foryou').isVisible(), false);
      assert.ok(await noHScroll(page));
      // a search hides it like the other rows
      await page.fill('#hub-q', 'mapas');
      assert.equal(await page.locator('#hub-likes').isVisible(), false);
      assert.deepEqual(errors, []);
    } finally { await ctx.close(); }
  });
}

test('F-INT-HUB-FALLBACKS: a child without interests is invited to pick them; the local copy is used offline; the adult sees no row', async () => {
  let r = await openAccount(family(), { init: asKid() });
  try {
    await r.page.waitForSelector('#hub-likes:not([hidden])', { timeout: 8000 });
    assert.equal(await r.page.locator('#hub-likes-row .foryou-card').count(), 1);
    assert.equal(await r.page.locator('#hub-likes-ask').getAttribute('href'), 'readingCoach-EFC/index.html#gustos');
    assert.match(await r.page.locator('#hub-likes-ask').innerText(), /Cuéntanos qué te gusta/);
  } finally { await r.ctx.close(); }
  r = await openAccount(family(), { init: asKid(), ls: { ['games_hub_interests_' + ME.uid + '_' + KID]: JSON.stringify(['music']) } });
  try {
    await r.page.waitForSelector('#hub-likes-row .foryou-card[data-id]', { timeout: 8000 });
    const ids = await r.page.locator('#hub-likes-row .foryou-card[data-id]').evaluateAll(n => n.map(x => x.dataset.id));
    assert.deepEqual(ids.slice(0, 2), ['memory', 'typemaster']);
  } finally { await r.ctx.close(); }
  r = await openAccount(family(), { init: () => sessionStorage.setItem('games_hub_picked_ownr123456', '1') });
  try {
    await r.page.waitForSelector('#hub-foryou:not([hidden])', { timeout: 8000 });
    assert.equal(await r.page.locator('#hub-likes').isVisible(), false, 'adult profile: no row');
    assert.deepEqual(r.errors, []);
  } finally { await r.ctx.close(); }
});

async function openFamily(page) {
  await page.waitForFunction(() => typeof PlatformHeader !== 'undefined' && PlatformHeader._userProfile, null, { timeout: 8000 });
  await page.click('#platform-user-btn'); await page.click('#pd-players');
  await page.waitForSelector('#pid-family', { timeout: 5000 }); await page.click('#pid-family');
  await page.waitForSelector('.pid-like-row', { timeout: 5000 });
}

for (const v of VIEWS) {
  test(`F-INT-FAMILY ${v.name}: the Familia screen shows the interests of each child and lets the owner and edit guardians change them (view only for the others)`, async () => {
    const { ctx, page, errors } = await openAccount(family({ interests: ['space'] }), { ...v, init: () => sessionStorage.setItem('games_hub_picked_ownr123456', '1') });
    try {
      await openFamily(page);
      const rowOf = pid => page.locator(`.pid-like-row[data-pid="${pid}"]`);
      assert.match(await rowOf(KID).innerText(), /Nora[\s\S]*El espacio/);
      assert.match(await rowOf(KID2).innerText(), /Sin elegir/);
      assert.match(await rowOf(KID_VIEW).innerText(), /Música/);
      assert.equal(await rowOf(KID_VIEW).locator('[data-act=interests]').count(), 0, 'role view cannot edit');
      assert.equal(await rowOf(KID_EDIT).locator('[data-act=interests]').count(), 1, 'role edit can');
      // the owner edits Pipo
      await rowOf(KID2).locator('[data-act=interests]').click();
      await page.waitForSelector('#pi-picker');
      await page.click('.pi-tile[data-id="cooking"]'); await page.click('.pi-tile[data-id="music"]'); await page.click('#pi-save');
      await page.waitForSelector('#pid-like-status');
      assert.deepEqual((await kidDoc(page, ME.uid, KID2)).interests, ['cooking', 'music']);
      assert.match(await rowOf(KID2).innerText(), /Cocina[\s\S]*Música/);
      // an edit guardian writes under the family owner
      await rowOf(KID_EDIT).locator('[data-act=interests]').click();
      await page.waitForSelector('#pi-picker'); await page.click('.pi-tile[data-id="animals"]'); await page.click('#pi-save');
      await page.waitForSelector('#pid-like-status');
      assert.deepEqual((await kidDoc(page, EDIT_OWNER, KID_EDIT)).interests, ['animals']);
      assert.equal(await page.evaluate(() => window.__store.get('users/famview001/players/kid333333').interests.join()), 'music', 'the view family is untouched');
      // cancelling changes nothing
      await rowOf(KID).locator('[data-act=interests]').click(); await page.waitForSelector('#pi-picker');
      await page.click('.pi-tile[data-id="robots"]'); await page.click('#pi-skip'); await page.waitForSelector('.pid-like-row');
      assert.deepEqual((await kidDoc(page, ME.uid, KID)).interests, ['space']);
      assert.ok(await noHScroll(page));
      assert.deepEqual(errors, []);
    } finally { await ctx.close(); }
  });
}
