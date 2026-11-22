import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

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
