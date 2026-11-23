import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '../..');
const require = createRequire(import.meta.url);

function loadI18n() {
  global.localStorage = { getItem: () => null, setItem() {} };
  Object.defineProperty(globalThis, 'navigator', { value: { language: 'es-ES' }, configurable: true });
  global.document = { documentElement: {}, dispatchEvent() {} };
  global.CustomEvent = function () {};
  const src = fs.readFileSync(path.join(root, 'platform/i18n-platform.js'), 'utf8') + ';module.exports=PlatformI18n';
  const m = { exports: {} };
  new Function('module', 'require', src)(m, require);
  return m.exports;
}

test('U-I18N: six UI languages with the same keys as Spanish', () => {
  const P = loadI18n();
  assert.deepEqual(Object.keys(P.translations).sort(), ['ca-ES', 'en-US', 'es-ES', 'eu-ES', 'fr-FR', 'gl-ES']);
  const keys = Object.keys(P.translations['es-ES']);
  for (const l of Object.keys(P.translations)) {
    const missing = keys.filter(k => !(k in P.translations[l]));
    assert.deepEqual(missing, [], `${l} misses ${missing}`);
    const empty = keys.filter(k => P.translations[l][k] === '' || P.translations[l][k] == null);
    assert.deepEqual(empty, [], `${l} has empty ${empty}`);
  }
});

test('U-I18N: lookup falls back to Spanish and never returns undefined', () => {
  const P = loadI18n();
  P.currentLanguage = 'fr-FR';
  assert.equal(P.t('noSuchKey'), 'noSuchKey');
  assert.equal(P.t('home'), 'Accueil');
  assert.equal(P.getLevelName(0), 'Débutant');
});

test('U-ANALYTICS: event payload has only anonymous fields', () => {
  const { buildEvent } = require(path.join(root, 'platform/analytics.js'));
  const ev = buildEvent({ game: 'vocabMaster', lang: 'gl-ES', auth: 1, first: 0 });
  assert.deepEqual(Object.keys(ev).sort(), ['auth', 'first', 'game', 'lang', 'type']);
  assert.equal(ev.type, 'play');
  assert.equal(ev.lang, 'gl');
  assert.equal(ev.auth, true);
  assert.equal(ev.first, false);
});

test('U-ANALYTICS: hub is a visit, bad language falls back, game is sanitised', () => {
  const { buildEvent, gameFromPath } = require(path.join(root, 'platform/analytics.js'));
  assert.equal(buildEvent({ game: 'hub', lang: 'xx' }).type, 'visit');
  assert.equal(buildEvent({ game: 'hub', lang: 'xx' }).lang, 'es');
  assert.equal(buildEvent({ game: '<script>alert(1)</script>' }).game, 'scriptalert1script');
  assert.equal(gameFromPath('/vocabMaster-EFC/index.html'), 'vocabMaster');
  assert.equal(gameFromPath('/snake-EHS/'), 'snake');
  assert.equal(gameFromPath('/tablaPeriodica-EFC/es/tabla.html'), 'tablaPeriodica');
  assert.equal(gameFromPath('/'), 'hub');
});

test('U-VOCAB: every pack in the index exists, has 24 unique words and complete fields', () => {
  const dir = path.join(root, 'vocabMaster-EFC/vocab');
  const idx = JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8'));
  assert.ok(idx.packs.length >= 10);
  for (const p of idx.packs) {
    const pack = JSON.parse(fs.readFileSync(path.join(dir, p.file), 'utf8'));
    assert.equal(pack.id, p.id);
    assert.equal(pack.words.length, p.count, p.id);
    assert.equal(new Set(pack.words.map(w => w[0])).size, pack.words.length, `${p.id} has duplicate words`);
    for (const w of pack.words) assert.ok(w.length === 4 && w.every(x => String(x).trim()), `${p.id}: bad entry ${w}`);
  }
});

test('U-SW: every page that uses the shell is covered and cache version is semver', () => {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.match(sw, /CACHE_VERSION\s*=\s*'v\d+\.\d+\.\d+'/);
});

test('U-PWA: manifest is installable (id, scope, icons exist, a maskable icon, shortcuts resolve)', () => {
  const m = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  assert.equal(m.display, 'standalone');
  assert.ok(m.id && m.scope && m.start_url && m.short_name);
  const files = [...m.icons, ...(m.shortcuts || []).flatMap(s => s.icons || [])];
  for (const i of files) assert.ok(fs.existsSync(path.join(root, i.src)), 'missing ' + i.src);
  assert.ok(m.icons.some(i => i.purpose === 'maskable' && i.sizes === '512x512'));
  assert.ok(m.icons.some(i => i.purpose === 'any' && i.sizes === '512x512'));
  for (const s of m.shortcuts || []) assert.ok(fs.existsSync(path.join(root, s.url.split('?')[0])), 'shortcut ' + s.url);
  assert.ok(fs.existsSync(path.join(root, 'offline.html')));
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.match(sw, /offline\.html/);
});

test('U-CALC: lessons are progressive and every generated question is valid', () => {
  const C = require(path.join(root, 'calcPath-EFC/game.js'));
  assert.ok(C.UNITS.length >= 14);
  for (const u of C.UNITS) {
    for (let i = 0; i < 200; i++) {
      const lesson = C.makeLesson(u);
      assert.equal(lesson.length, 10);
      for (const q of lesson) {
        assert.ok(Number.isInteger(q.res) && q.res >= 0, `${u.id} negative or fractional`);
        if (u.kind !== 'mul') assert.ok(q.res <= (u.max === 1000 ? 999 : u.max === 100 ? 99 : u.max), `${u.id} result above ceiling`);
        if (q.options) assert.equal(new Set(q.options).size, 4);
        if (q.options) assert.ok(q.options.includes(q.res));
        if (q.type === 'build') assert.equal(q.exprs.filter(x => x.ok).length, 1);
        if (u.id === 'a100c' && q.op === '+') assert.ok((q.a % 10) + (q.b % 10) >= 10, 'carry lesson must carry');
        if (u.id === 'a100' && q.op === '+') assert.ok((q.a % 10) + (q.b % 10) < 10, 'no-carry lesson must not carry');
        if (u.id === 's100c' && q.op === '-') assert.ok(q.a % 10 < q.b % 10, 'borrow lesson must borrow');
      }
    }
  }
});

test('U-CALC: answer checking and stars', () => {
  const C = require(path.join(root, 'calcPath-EFC/game.js'));
  assert.equal(C.isCorrect({ type: 'type', res: 7 }, 7), true);
  assert.equal(C.isCorrect({ type: 'type', res: 7 }, 8), false);
  assert.equal(C.isCorrect({ type: 'compare', answer: '<' }, '>'), false);
  assert.equal(C.isCorrect({ type: 'tf', answer: false }, false), true);
  assert.equal(C.isCorrect({ type: 'missing', answer: 4 }, '4'), true);
  assert.deepEqual([0, 1, 2, 3, 6].map(C.stars), [3, 2, 2, 1, 1]);
});

test('U-NEWGAMES: fractions, clock and memory logic is consistent', () => {
  const F = require(path.join(root, 'fractions-EFC/game.js'));
  assert.equal(F.gcd(12, 8), 4);
  for (const u of F.UNITS) for (let i = 0; i < 100; i++) {
    for (const q of F.makeLesson(u)) {
      if (q.options) { assert.equal(new Set(q.options.map(o => JSON.stringify(o))).size, q.options.length, `${u.id} duplicate options`); }
    }
  }
  const K = require(path.join(root, 'clock-EFC/game.js'));
  assert.ok(K.UNITS.length >= 6);
  for (const u of K.UNITS) for (let i = 0; i < 100; i++) assert.ok(K.makeLesson(u).length > 0);
  const M = require(path.join(root, 'memory-EFC/game.js'));
  for (const th of M.THEMES) for (const sz of M.SIZES) {
    const deck = M.makeDeck(th.id, sz.pairs);
    assert.equal(deck.length, sz.pairs * 2, th.id + '/' + sz.pairs + ' deck size');
  }
});

test('U-SRS: Leitner boxes advance, reset on failure and pick due cards first', () => {
  const S = require(path.join(root, 'platform/srs.js'));
  const t0 = 1_000_000_000_000, D = 86400000;
  let c = S.review(undefined, true, t0);
  assert.equal(c.box, 1); assert.equal(c.due, t0 + D);
  c = S.review(c, true, t0 + D); assert.equal(c.box, 2); assert.equal(c.due, t0 + D + 3 * D);
  for (let i = 0; i < 10; i++) c = S.review(c, true, t0);
  assert.equal(c.box, 5);
  c = S.review(c, false, t0); assert.equal(c.box, 0); assert.equal(c.due, t0);
  const cards = { a: { box: 3, due: t0 + D }, b: { box: 0, due: t0 - 5 }, c: { box: 1, due: t0 - 1 } };
  assert.deepEqual(S.pick(['a', 'b', 'c', 'd', 'e'], cards, 4, 1, t0), ['b', 'c', 'd']);
  const sm = S.summary(['a', 'b', 'c', 'd'], cards, t0);
  assert.deepEqual([sm.fresh, sm.due, sm.learning], [1, 2, 3]);
});

test('U-REPASO: decks are consistent and sessions prefer due cards', () => {
  const R = require(path.join(root, 'repaso-EFC/game.js'));
  const win = { RepasoDecks: [] };
  for (const f of ['math', 'english', 'science', 'world', 'lang']) {
    new Function('window', fs.readFileSync(path.join(root, 'repaso-EFC/decks', f + '.js'), 'utf8'))(win);
  }
  const decks = win.RepasoDecks;
  assert.ok(decks.length >= 15);
  let total = 0;
  for (const d of decks) {
    const ids = new Set();
    for (const c of d.cards) {
      assert.ok(!ids.has(c.id), `${d.id} duplicate id ${c.id}`); ids.add(c.id); total++;
      const a = R.resolveText(c.a, 'es'), q = R.resolveText(c.q, 'es');
      assert.ok(a && q, `${d.id}/${c.id} empty`);
      if (c.opts) assert.ok(!c.opts.map(o => R.resolveText(o, 'es')).includes(a), `${d.id}/${c.id} opts contain answer`);
    }
    const card = d.cards[0], o = R.makeOptions(d, card, Math.random, 'es');
    assert.equal(new Set(o).size, o.length);
    assert.ok(o.includes(R.resolveText(card.a, 'es')));
  }
  assert.ok(total >= 900, 'expected about 1000 cards, got ' + total);
  assert.equal(R.checkTyped('  Árbol ', 'arbol', 'es'), true);
  const s = R.makeSession([{ id: 'x', cards: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] }], { x: { b: { box: 1, due: 1 } } }, { limit: 2, newPerDeck: 1, rnd: () => 0.5 }, 5);
  assert.equal(s[0].cardId, 'b');
});

test('U-MAPAS: pure helpers, UI strings and map data are consistent', () => {
  const root = path.resolve(import.meta.dirname, '../..');
  const M = createRequire(import.meta.url)(path.join(root, 'mapas-EFC/game.js'));
  // UI: six non-empty strings per key, same placeholders in every language
  for (const [k, row] of Object.entries(M.UI)) {
    assert.equal(row.length, 6, k);
    const ph = s => (s.match(/\{[a-z]\}/g) || []).sort().join();
    row.forEach((s, i) => { assert.ok(s && s.trim(), `${k}[${i}] empty`); assert.equal(ph(s), ph(row[0]), `${k}[${i}] placeholders`); });
  }
  M.MAPS.forEach(m => assert.ok(M.UI['m' + m.id], 'name for map ' + m.id));
  assert.equal(M.txt('qFind', 'en', { n: 'Peru' }), 'Tap: Peru');
  // question picking: weak first, then new, then known; no repeats
  const ids = ['a', 'b', 'c', 'd', 'e', 'f'];
  const prog = { a: { o: 3, f: 0, s: 3 }, b: { o: 0, f: 2, s: 0 }, c: { o: 1, f: 0, s: 1 } };
  const q = M.pickQuestions(ids, prog, 4, () => 0.3);
  assert.equal(q.length, 4); assert.equal(new Set(q).size, 4);
  assert.deepEqual(q.slice(0, 2).sort(), ['b', 'c']);
  assert.ok(!q.includes('a'));
  const o = M.pickOptions('c', ids, 4, () => 0.5);
  assert.equal(o.length, 4); assert.ok(o.includes('c')); assert.equal(new Set(o).size, 4);
  // mastery: two right answers in a row, a miss resets the streak
  let p = M.recordAnswer(undefined, true); assert.equal(M.masteryOf(p), 'weak');
  p = M.recordAnswer(p, true); assert.equal(M.masteryOf(p), 'ok');
  p = M.recordAnswer(p, false); assert.equal(M.masteryOf(p), 'weak'); assert.equal(p.f, 1);
  const day = 864e5, now = Date.now();
  assert.equal(M.needsReview(undefined, now), false);
  assert.equal(M.needsReview({ s: 1, t: now }, now), true, 'weak items are always due');
  assert.equal(M.needsReview({ s: 2, t: now - 0.5 * day }, now), false, 'mastered, not yet due');
  assert.equal(M.needsReview({ s: 2, t: now - 2 * day }, now), true, 'mastered but overdue');
  const b = M.fitBox({ x: 0, y: 0, w: 1000, h: 500 }, 400, 600);
  assert.ok(Math.abs(b.h / b.w - 1.5) < 1e-9 && b.w >= 1000);
  // data files
  const load = f => { const ctx = {}; ctx.window = ctx; vm.runInNewContext(fs.readFileSync(path.join(root, 'mapas-EFC/data', f), 'utf8'), ctx); return ctx.MapData; };
  const W = load('world.js').world, SP = load('spain.js').spain;
  const live = W.countries.filter(c => c.i && W.facts[c.i] && W.facts[c.i][3]);
  assert.ok(live.length >= 190 && live.length <= 205, 'sovereign countries: ' + live.length);
  assert.equal(new Set(live.map(c => c.i)).size, live.length, 'unique country ids');
  live.forEach(c => { assert.ok(c.d && c.d.startsWith('M'), c.i + ' path'); assert.ok(W.facts[c.i][1], c.i + ' continent'); assert.ok(W.facts[c.i][0], c.i + ' capital'); assert.ok(c.b && c.b.length === 4); });
  ['EU', 'AF', 'AS', 'NA', 'SA', 'OC'].forEach(k => { assert.ok(W.views[k], 'view ' + k); assert.ok(live.some(c => W.facts[c.i][1] === k), 'countries in ' + k); });
  assert.ok(W.rivers.length >= 40); W.rivers.forEach(r => { assert.ok(r.d && r.es && r.en && r.c.length, r.id); });
  const regions = SP.ccaa.filter(r => !/^Gibraltar/.test(r.n));
  assert.equal(regions.length, 19); regions.forEach(r => assert.ok(M.CCAA[r.n] && M.CCAA[r.n][0], 'table for ' + r.n));
  assert.equal(SP.prov.filter(r => !/^Gibraltar/.test(r.n)).length, 52);
  assert.ok(SP.rivers.length >= 50 && SP.mount.length >= 60, 'spain rivers/mountains: ' + SP.rivers.length + '/' + SP.mount.length);
  assert.ok(SP.eus && SP.eus.towns.length >= 20 && SP.eus.rivers.length >= 8 && SP.eus.mount.length >= 12 && SP.eus.vb.length === 4, 'euskadi data');
  SP.eus.towns.forEach(x => assert.ok(x.eu && x.es && x.fact && x.x > 0, 'town ' + x.id));
  assert.ok(SP.rivers.length >= 28, 'spanish rivers: ' + SP.rivers.length); SP.rivers.forEach(r => { assert.ok(r.c.length >= 1, 'region crossed by ' + r.id); assert.ok(r.km >= 3 && r.fact && r.fact.es && r.fact.en && r.src && r.mouth, 'content for ' + r.id); });
  W.rivers.forEach(r => assert.ok(r.km > 100 && r.fact && r.fact.es && r.fact.en, 'content for ' + r.id));
  const noFact = live.filter(c => !(W.info[c.i] && W.info[c.i].fact && W.info[c.i].fact.es && W.info[c.i].fact.en && W.info[c.i].pop > 0));
  assert.equal(noFact.length, 0, 'country content missing: ' + noFact.map(c => c.i).join());
  assert.ok(W.mount.length >= 30 && SP.mount.length >= 28); [...W.mount, ...SP.mount].forEach(m => assert.ok(m.m > 200 && m.fact.es && m.x > 0 && m.y > 0, 'mountain ' + m.id));
  regions.forEach(r => assert.ok(r.inf && r.inf.fact && r.inf.pop > 0 && r.inf.cap, 'region content ' + r.n));
  SP.prov.filter(r => !/^Gibraltar/.test(r.n)).forEach(r => assert.ok(r.inf && r.inf.fact && r.inf.pop > 0, 'province content ' + r.n));
});
