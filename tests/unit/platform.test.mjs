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
