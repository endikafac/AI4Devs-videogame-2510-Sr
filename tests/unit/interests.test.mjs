import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '../..');
const PI = require(path.join(root, 'platform/interests.js'));
const R = require(path.join(root, 'readingCoach-EFC/game.js'));
const dir = path.join(root, 'readingCoach-EFC/texts');
const LANGS = ['es', 'en', 'eu', 'gl', 'ca', 'fr'];
const BANDS = ['b56', 'b78', 'b910', 'b1112'];
const LEN = { b56: [30, 60], b78: [60, 120], b910: [120, 200], b1112: [200, 300] };
const read = f => JSON.parse(fs.readFileSync(path.join(dir, f + '.json'), 'utf8'));
const allTexts = lang => (R.FILES[lang] || []).flatMap(f => read(f).texts);
const allBooks = lang => (R.BOOK_FILES[lang] || []).flatMap(f => read(f).books);
// Trademarked names and well known franchises must never appear in the content or in the labels.
const BRANDS = new RegExp("\\b(minecraft|mario|pok[eé]mon|fortnite|roblox|zelda|marvel|batman|superman|spider-?man|lego|disney|nintendo|playstation|xbox|fifa|messi|ronaldo|barça|real madrid|star wars|harry potter|pixar|youtube|tiktok)\\b", "i");

test('U-INT list: 14 fixed interests with emoji, colour and a label in the six languages', () => {
  assert.equal(PI.IDS.length, 14);
  assert.equal(new Set(PI.IDS).size, 14);
  assert.deepEqual(PI.IDS, ['dinosaurs', 'space', 'sports', 'animals', 'videogames', 'pirates', 'robots', 'magic', 'music', 'cooking', 'vehicles', 'nature', 'mystery', 'superheroes']);
  assert.equal(PI.MAX, 5);
  for (const i of PI.LIST) {
    assert.match(i.id, /^[a-z]+$/);
    assert.ok(i.emoji && i.emoji.length >= 1, i.id + ' emoji');
    assert.match(i.color, /^#[0-9a-f]{6}$/i, i.id + ' colour');
    for (const l of LANGS) {
      assert.ok(typeof i.l[l] === 'string' && i.l[l].trim().length > 1, i.id + ' label ' + l);
      assert.ok(!/[—–]/.test(i.l[l]), i.id + ' no dash in ' + l);
      assert.ok(!BRANDS.test(i.l[l]), i.id + ' no brand in ' + l);
    }
  }
  assert.deepEqual(PI.TOPIC_IDS, PI.IDS.concat(['general']));
});

test('U-INT texts of the picker: same keys and placeholders in the six languages, no long dashes', () => {
  const keys = Object.keys(PI.TX.es);
  for (const l of LANGS) {
    assert.deepEqual(Object.keys(PI.TX[l]).sort(), keys.slice().sort(), 'keys of ' + l);
    for (const k of keys) {
      const v = PI.TX[l][k];
      assert.ok(typeof v === 'string' && v.trim(), l + '.' + k);
      assert.ok(!/[—–]/.test(v), 'dash in ' + l + '.' + k);
      const ph = s => (s.match(/\{\w+\}/g) || []).sort().join(',');
      assert.equal(ph(v), ph(PI.TX.es[k]), 'placeholders ' + l + '.' + k);
    }
  }
  for (const l of ['en', 'eu', 'gl', 'ca', 'fr']) {
    const same = keys.filter(k => PI.TX[l][k] === PI.TX.es[k] && PI.TX.es[k].length > 12);
    assert.deepEqual(same, [], l + ' copies Spanish');
  }
  assert.equal(PI.t('count', 'es', { n: 3 }), '3 de 5 elegidas');
  assert.equal(PI.t('count', 'xx', { n: 2 }), '2 de 5 elegidas', 'unknown language falls back to Spanish');
});

test('U-INT validator: only ids of the list, at most 5, strings, no repeats (same rule as firestore.rules validInterests)', () => {
  assert.equal(PI.isValid([]), true);
  assert.equal(PI.isValid(['dinosaurs']), true);
  assert.equal(PI.isValid(PI.IDS.slice(0, 5)), true);
  const bad = [PI.IDS.slice(0, 6), PI.IDS, ['dinosaurs', 'dinosaurs'], ['football'], ['Dinosaurs'], [1], [null], ['space', { a: 1 }], 'space', 5, null, undefined, { 0: 'space' }, [['space']], ['<script>']];
  for (const b of bad) assert.equal(PI.isValid(b), false, JSON.stringify(b));
  assert.deepEqual(PI.sanitize(['space', 'x', 'space', 3, 'music']), ['space', 'music']);
  assert.deepEqual(PI.sanitize(PI.IDS), PI.IDS.slice(0, 5), 'at most 5, in order');
  assert.deepEqual(PI.sanitize('space'), []);
  assert.deepEqual(PI.sanitize(null), []);
  for (const s of [PI.sanitize(['space', 'x', 'space']), PI.sanitize(PI.IDS)]) assert.equal(PI.isValid(s), true, 'sanitize always gives a valid list');
});

test('U-INT rules: firestore.rules accepts exactly the ids of the list and at most 5 of them', () => {
  const rules = fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8');
  const fn = rules.match(/function validInterests\(d\)[\s\S]*?\n    \}/)[0];
  const ids = [...fn.matchAll(/'([a-z]+)'/g)].map(m => m[1]).filter(x => x !== 'interests');
  assert.deepEqual(ids.sort(), PI.IDS.slice().sort(), 'rule ids equal PlatformInterests.IDS');
  assert.match(fn, /interests is list/);
  assert.match(fn, /size\(\) <= 5/);
  assert.match(fn, /toSet\(\)\.size\(\) == d\.interests\.size\(\)/);
  assert.match(rules, /canEditKids\(userId\) && validPin\(request\.resource\.data\) && validInterests\(request\.resource\.data\)/);
});

test('U-INT local copy: stored per profile, sanitized on read, removed when empty', () => {
  const store = {};
  const st = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
  assert.equal(PI.localKey('', ''), 'games_hub_interests_guest');
  assert.equal(PI.localKey('u1', ''), 'games_hub_interests_u1');
  assert.equal(PI.localKey('u1', 'kid123abc'), 'games_hub_interests_u1_kid123abc');
  assert.deepEqual(PI.loadLocal('k', st), []);
  PI.saveLocal('k', ['space', 'bad', 'music'], st);
  assert.deepEqual(PI.loadLocal('k', st), ['space', 'music']);
  store.k = '{"not":"a list"}'; assert.deepEqual(PI.loadLocal('k', st), []);
  store.k = 'not json'; assert.deepEqual(PI.loadLocal('k', st), []);
  PI.saveLocal('k', [], st); assert.ok(!('k' in store));
});

// ------------------------------------------------------------------ hub mapping
const hubSrc = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const GAMES = [...hubSrc.matchAll(/\{ id: '(\w+)',\s+href: '([^']+)',\s+cat: '(\w+)',\s+aud: '([^']+)'[^}]*?(?:icon: ([^,]+),)?\s*(?:title: '([^']+)')?/g)]
  .map(m => ({ id: m[1], href: m[2], cat: m[3], aud: m[4], icon: m[5], title: m[6] }));

test('U-INT hub table: every interest maps to at least 3 existing kids games and the table has no unknown game', () => {
  assert.ok(GAMES.length >= 15, 'catalogue parsed: ' + GAMES.length);
  assert.deepEqual(Object.keys(PI.GAME_MAP).sort(), PI.IDS.slice().sort());
  const kids = new Set(GAMES.filter(g => g.aud.split(' ').includes('kids')).map(g => g.id));
  for (const [iid, list] of Object.entries(PI.GAME_MAP)) {
    assert.ok(list.length >= 3, iid + ' has games');
    assert.equal(new Set(list).size, list.length, iid + ' no repeats');
    for (const g of list) assert.ok(kids.has(g), iid + ' -> ' + g + ' must be a kids game of the hub');
  }
});

test('U-INT hub row: games chosen from the interests (dinosaurs and space to Mapas and Vocabulario, football to maths and reading, music to memory and typing)', () => {
  const ids = (ints, max) => PI.gamesFor(ints, GAMES, max).map(r => r.game.id);
  const dino = ids(['dinosaurs']); assert.ok(dino.includes('mapas') && dino.includes('vocab'), 'dinosaurs ' + dino);
  const space = ids(['space']); assert.ok(space.includes('mapas') && space.includes('vocab'), 'space ' + space);
  const foot = ids(['sports']); assert.ok(foot.includes('mathmaster') && foot.includes('reading'), 'sports ' + foot);
  const music = ids(['music']); assert.ok(music.includes('memory') && music.includes('typemaster'), 'music ' + music);
  // the games that several interests share come first, and each result says why
  const two = PI.gamesFor(['dinosaurs', 'space'], GAMES);
  assert.deepEqual(two.slice(0, 2).map(r => r.game.id), ['mapas', 'vocab']);
  assert.deepEqual(two[0].via, ['dinosaurs', 'space']);
  assert.ok(two.every(r => r.via.length >= 1 && r.via.every(v => PI.IDS.includes(v))));
  // limits, filters and junk
  assert.equal(PI.gamesFor(PI.IDS.slice(0, 5), GAMES, 4).length, 4);
  assert.ok(PI.gamesFor(PI.IDS, GAMES).length <= 6, 'default maximum');
  assert.deepEqual(PI.gamesFor([], GAMES), []);
  assert.deepEqual(PI.gamesFor(['nope'], GAMES), []);
  assert.deepEqual(PI.gamesFor(['space'], []), []);
  assert.deepEqual(PI.gamesFor(['space'], GAMES, 6, g => g.id === 'reading').map(r => r.game.id), ['reading'], 'audience filter applies');
  const lab = [{ id: 'mapas', href: 'x', lab: true }, { id: 'vocab' }, { id: 'memory', href: 'm' }];
  assert.deepEqual(PI.gamesFor(['space'], lab).map(r => r.game.id), ['memory'], 'labs and games without link are skipped');
  const seen = new Set(PI.gamesFor(PI.IDS.slice(0, 5), GAMES, 20).map(r => r.game.id)); assert.equal(seen.size, PI.gamesFor(PI.IDS.slice(0, 5), GAMES, 20).length, 'no repeated game');
});

// ------------------------------------------------------------------ tagging and coverage of the texts
test('U-INT tagging: every text and every book of every language carries topics from the fixed list (or general)', () => {
  const ids = new Set();
  for (const l of LANGS) {
    for (const x of allTexts(l).concat(allBooks(l))) {
      assert.ok(!ids.has(x.id), 'unique id ' + x.id); ids.add(x.id);
      assert.ok(Array.isArray(x.topics) && x.topics.length >= 1 && x.topics.length <= 3, x.id + ' topics');
      assert.ok(x.topics.every(t => PI.TOPIC_IDS.includes(t)), x.id + ' topics ' + x.topics);
      assert.equal(new Set(x.topics).size, x.topics.length, x.id + ' repeated topics');
      if (x.topics.includes('general')) assert.equal(x.topics.length, 1, x.id + ' general stands alone');
    }
  }
});

test('U-INT coverage: every interest has at least 2 Spanish texts in each of b56, b78, b910 and b1112 and 1 English text per band', () => {
  const es = allTexts('es'), en = allTexts('en');
  for (const iid of PI.IDS) for (const b of BANDS) {
    const n = es.filter(t => t.bands.includes(b) && t.topics.includes(iid)).length;
    assert.ok(n >= 2, `es ${iid} ${b}: ${n}`);
    const m = en.filter(t => t.bands.includes(b) && t.topics.includes(iid)).length;
    assert.ok(m >= 1, `en ${iid} ${b}: ${m}`);
  }
});

test('U-INT new texts: original, licensed, inside the word range of their band, 2 or 3 grounded questions, no brands, no long dashes', () => {
  for (const [lang, f] of [['es', 'es-int'], ['en', 'en-int']]) {
    const d = read(f); assert.equal(d.lang, lang);
    assert.ok(d.texts.length >= (lang === 'es' ? 112 : 56), f + ' has ' + d.texts.length);
    for (const t of d.texts) {
      assert.match(t.id, new RegExp('^' + lang + '-(56|78|910|1112)-i\\d\\d$'));
      assert.equal(t.license, 'original-project'); assert.ok(t.source && t.author, t.id + ' source and author');
      assert.equal(t.bands.length, 1);
      const n = R.countWords(t.text), [lo, hi] = LEN[t.bands[0]];
      assert.ok(n >= lo && n <= hi, `${t.id} has ${n} words, band ${t.bands[0]} wants ${lo}-${hi}`);
      assert.ok(t.questions.length >= 2 && t.questions.length <= 3, t.id + ' questions');
      for (const q of t.questions) {
        assert.equal(q.o.length, 3, t.id + ' three options'); assert.equal(new Set(q.o).size, 3, t.id + ' distinct options');
        assert.ok(Number.isInteger(q.a) && q.a >= 0 && q.a < 3, t.id + ' answer');
        assert.ok(q.ev && t.text.includes(q.ev), t.id + ' evidence is a quote: ' + q.ev);
      }
      for (const s of [t.title, t.text, ...t.questions.flatMap(q => [q.q, ...q.o])]) { assert.ok(!/[—–]/.test(s), t.id + ' dash'); assert.ok(!BRANDS.test(s), t.id + ' brand: ' + s.slice(0, 30)); }
    }
  }
});

test('U-INT new books: at least 3 original multi-chapter books in Spanish on dinosaurs, space, football and detectives, with a hook at the end of each chapter', () => {
  const d = read('books-es-int');
  assert.ok(d.books.length >= 4);
  const topics = d.books.flatMap(b => b.topics);
  for (const t of ['dinosaurs', 'space', 'sports', 'mystery']) assert.ok(topics.includes(t), 'book about ' + t);
  for (const b of d.books) {
    assert.equal(b.license, 'original-project'); assert.ok(b.source && b.author && b.emoji, b.id);
    assert.ok(b.chapters.length >= 3, b.id + ' chapters');
    b.chapters.forEach((c, i) => {
      const n = R.countWords(c.text);
      assert.ok(n >= LEN[b.bands[0]][0] && n <= LEN[b.bands[b.bands.length - 1]][1], c.id + ' ' + n + ' words');
      if (i < b.chapters.length - 1) assert.ok(c.hook && c.text.endsWith(c.hook), c.id + ' hook'); else assert.equal(c.hook, '');
      assert.ok(c.questions.length >= 2 && c.questions.every(q => c.text.includes(q.ev)), c.id + ' questions');
      for (const s of [c.title, c.text, b.title]) { assert.ok(!/[—–]/.test(s)); assert.ok(!BRANDS.test(s), c.id + ' brand'); }
    });
  }
  // the Spanish shelf of each band still has books, with the new ones added
  const by = { es: allBooks('es') };
  assert.ok(R.selectBooks(by, 'b78', 'es').books.some(b => b.id === 'es-dino') && R.selectBooks(by, 'b78', 'es').books.some(b => b.id === 'es-fut'));
  assert.ok(R.selectBooks(by, 'b910', 'es').books.some(b => b.id === 'es-esp') && R.selectBooks(by, 'b910', 'es').books.some(b => b.id === 'es-det'));
});

// ------------------------------------------------------------------ matching, ordering, similar and adaptation
const mk = (id, topics, extra = {}) => ({ id, topics, text: 'x', ...extra });

test('U-INT order: what matches the interests goes first (more matches first, unfinished first), the rest keeps its order', () => {
  const l = [mk('a', ['animals']), mk('b', ['space']), mk('c', ['space', 'music']), mk('d', ['general']), mk('e', ['music'])];
  const ids = x => x.map(i => i.id);
  assert.deepEqual(ids(R.orderByInterests(l, [], null)), ['a', 'b', 'c', 'd', 'e'], 'no interests: unchanged');
  assert.deepEqual(ids(R.orderByInterests(l, ['space'], null)), ['b', 'c', 'a', 'd', 'e']);
  assert.deepEqual(ids(R.orderByInterests(l, ['space', 'music'], null)), ['c', 'b', 'e', 'a', 'd'], 'two matches first');
  const done = x => x.id === 'b';
  assert.deepEqual(ids(R.orderByInterests(l, ['space'], done)), ['c', 'b', 'a', 'd', 'e'], 'finished after unfinished among the matches');
  assert.deepEqual(ids(R.orderByInterests(l, ['nope', 'space'], null)), ['b', 'c', 'a', 'd', 'e'], 'unknown interests are ignored');
  assert.equal(R.matchScore(mk('z', ['general']), ['space']), 0);
  assert.equal(R.matchScore(mk('z', ['space', 'music']), ['space', 'music', 'music']), 2);
  assert.equal(R.matchScore({ id: 'q' }, ['space']), 0, 'no topics');
});

test('U-INT order on the real Spanish content: with dinosaurs the dinosaur texts and book come first in every band', () => {
  const texts = allTexts('es'), books = allBooks('es'), by = { es: texts };
  for (const b of BANDS) {
    const list = R.selectTexts(by, b, 'es').texts;
    const ord = R.orderByInterests(list, ['dinosaurs'], null);
    const n = list.filter(t => t.topics.includes('dinosaurs')).length;
    assert.ok(n >= 2);
    assert.ok(ord.slice(0, n).every(t => t.topics.includes('dinosaurs')), b + ' dinosaur texts first');
    assert.equal(ord.length, list.length);
    const fy = R.forYou(list, R.selectBooks({ es: books }, b, 'es').books, ['dinosaurs'], {});
    assert.ok(fy.texts.length >= 2 && fy.texts.every(t => t.topics.includes('dinosaurs')), b + ' picks');
  }
  const fy78 = R.forYou(R.selectTexts(by, 'b78', 'es').texts, R.selectBooks({ es: books }, 'b78', 'es').books, ['dinosaurs'], {});
  assert.deepEqual(fy78.books.map(b => b.id), ['es-dino'], 'the dinosaur book is a pick');
  assert.deepEqual(R.forYou([mk('a', ['space'])], [], [], {}), { texts: [], books: [] }, 'no interests, no picks');
});

test('U-INT for you: limits, finished books are not offered again, finished texts go last', () => {
  const list = [mk('t1', ['space']), mk('t2', ['space']), mk('t3', ['space']), mk('t4', ['space']), mk('t5', ['space']), mk('t6', ['music'])];
  const book = id => ({ id, topics: ['space'], chapters: [{ id: id + '-1' }, { id: id + '-2' }] });
  const prog = { t1: { quiz: true }, 'b1-1': { quiz: true }, 'b1-2': { quiz: true } };
  const fy = R.forYou(list, [book('b1'), book('b2'), book('b3'), book('b4')], ['space'], prog);
  assert.deepEqual(fy.texts.map(t => t.id), ['t2', 't3', 't4', 't5'], 'up to 4, the finished one last and cut');
  assert.deepEqual(fy.books.map(b => b.id), ['b2', 'b3'], 'up to 2, the finished book is gone');
  assert.equal(R.forYou(list, [], ['space'], prog, { texts: 2, books: 1 }).texts.length, 2);
});

test('U-INT similar: after a text two others that share its topics come first, never the same one, never a chapter', () => {
  const pool = [mk('cur', ['space', 'robots']), mk('x1', ['animals']), mk('x2', ['robots']), mk('x3', ['space']), mk('x4', ['space', 'robots']), mk('x5', ['general']), mk('ch', ['space'], { chapterTitle: 'c' })];
  const ids = r => r.map(x => x.id);
  assert.deepEqual(ids(R.similarTexts(pool[0], pool, [], {}, 2)), ['x4', 'x2'], 'most topics in common first');
  assert.ok(!ids(R.similarTexts(pool[0], pool, [], {}, 6)).includes('cur'));
  assert.ok(!ids(R.similarTexts(pool[0], pool, [], {}, 6)).includes('ch'));
  assert.deepEqual(ids(R.similarTexts(pool[0], pool, [], { x4: { quiz: true } }, 2)), ['x2', 'x3'], 'finished ones go after the unfinished');
  // general texts are not "similar" to each other; with nothing in common the rest fills in
  const g = [mk('g1', ['general']), mk('g2', ['general']), mk('g3', ['music'])];
  assert.equal(R.similarTexts(g[0], g, [], {}, 2).length, 2);
  assert.deepEqual(R.similarTexts(g[0], [g[0]], [], {}, 2), []);
  const real = R.selectTexts({ es: allTexts('es') }, 'b910', 'es').texts;
  const cur = real.find(t => t.topics.includes('robots'));
  const sim = R.similarTexts(cur, real, [], {}, 2);
  assert.equal(sim.length, 2); assert.ok(sim.every(t => t.id !== cur.id));
  assert.ok(sim[0].topics.includes('robots'), 'the first suggestion shares the topic');
});

const entry = (b, o) => Object.assign({ d: '2026-11-20', b }, o);
test('U-INT adaptation: proposes a little harder or an easier one only with enough recent data, in zones, never a mark', () => {
  const none = R.proposeStep({ hist: [], qlog: [] }, 'b78');
  assert.deepEqual(none, { kind: 'none', band: 'b78' });
  assert.equal(R.proposeStep(null, 'b78').kind, 'none');
  assert.equal(R.proposeStep({ hist: [entry('b78', { ppm: 80 })], qlog: [entry('b78', { c: 3, n: 3 })] }, 'b78').kind, 'none', 'one reading is not enough');
  const rd = (b, ppm, k = 3) => Array.from({ length: k }, () => entry(b, { ppm }));
  const qz = (b, c, n, k = 3) => Array.from({ length: k }, () => entry(b, { c, n }));
  // in the zone and understands almost everything: one level up
  assert.deepEqual(R.proposeStep({ hist: rd('b78', 80), qlog: qz('b78', 3, 3) }, 'b78'), { kind: 'harder', band: 'b910' });
  assert.deepEqual(R.proposeStep({ hist: rd('b78', 120), qlog: qz('b78', 2, 2) }, 'b78'), { kind: 'harder', band: 'b910' }, 'above the zone also counts');
  // understands little: an easier one
  assert.deepEqual(R.proposeStep({ hist: rd('b910', 110), qlog: qz('b910', 0, 3) }, 'b910'), { kind: 'easier', band: 'b78' });
  assert.deepEqual(R.proposeStep({ hist: rd('b910', 60), qlog: qz('b910', 2, 3) }, 'b910'), { kind: 'easier', band: 'b78' }, 'slow and unsure');
  // slow but understands: keep (comprehension matters more than speed)
  assert.equal(R.proposeStep({ hist: rd('b910', 60), qlog: qz('b910', 3, 3) }, 'b910').kind, 'keep');
  assert.equal(R.proposeStep({ hist: rd('b910', 110), qlog: qz('b910', 2, 3) }, 'b910').kind, 'keep');
  // limits: nothing below the first level, nothing above the teen level
  assert.equal(R.proposeStep({ hist: rd('b56', 20), qlog: qz('b56', 0, 3) }, 'b56').kind, 'keep');
  assert.equal(R.proposeStep({ hist: rd('b13', 170), qlog: qz('b13', 3, 3) }, 'b13').kind, 'keep');
  assert.deepEqual(R.proposeStep({ hist: rd('b1112', 140), qlog: qz('b1112', 3, 3) }, 'b1112'), { kind: 'harder', band: 'b13' });
  assert.equal(R.proposeStep({ hist: rd('adult', 190), qlog: qz('adult', 3, 3) }, 'adult').kind, 'keep');
  // only the readings of the current level count; old entries without level still do
  const mixed = { hist: rd('b56', 200).concat(rd('b78', 80, 2)), qlog: qz('b56', 0, 3).concat(qz('b78', 3, 3, 2)) };
  assert.equal(R.proposeStep(mixed, 'b78').kind, 'harder');
  assert.equal(R.proposeStep({ hist: [{ ppm: 80 }, { ppm: 82 }], qlog: [{ c: 3, n: 3 }, { c: 3, n: 3 }] }, 'b78').kind, 'harder');
  // the proposal is only a level, no grade: the result has no score
  assert.deepEqual(Object.keys(R.proposeStep({ hist: rd('b78', 80), qlog: qz('b78', 3, 3) }, 'b78')).sort(), ['band', 'kind']);
  // only the last 4 entries are used: an old bad streak does not hold the child back
  const recovering = { hist: rd('b78', 30, 5).concat(rd('b78', 85, 4)), qlog: qz('b78', 0, 3, 5).concat(qz('b78', 3, 3, 4)) };
  assert.equal(R.proposeStep(recovering, 'b78').kind, 'harder');
});

test('U-INT the reading game records the level with each reading and quiz so the proposal can use it', () => {
  const g = fs.readFileSync(path.join(root, 'readingCoach-EFC/game.js'), 'utf8');
  assert.match(g, /hist\.push\(\{ d: today, ppm: r\.ppm, id: S\.cur\.id, b: level\(\)/);
  assert.match(g, /qlog\.push\(\{ d: dayStr\(\), id: S\.cur\.id, b: level\(\), c: Q\.correct, n \}\)/);
  assert.deepEqual(R.blank().qlog, []);
  assert.equal(R.blank().intDone, false);
  for (const l of LANGS) for (const k of ['zFy', 'fyAsk', 'fyPick', 'fyChange', 'simTitle', 'adaptUp', 'adaptDown', 'adaptKeep', 'adaptGo', 'adaptStay']) assert.ok(R.UI[l][k], l + '.' + k);
});

test('U-INT no personal data: interests are only ids; the picker code never stores names or free text', () => {
  const src = fs.readFileSync(path.join(root, 'platform/interests.js'), 'utf8');
  assert.ok(!/innerHTML/.test(src), 'picker uses textContent only');
  assert.ok(!/<input|<textarea/i.test(src), 'no free text field');
});
