import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = path.resolve(import.meta.dirname, '../..');
const require = createRequire(import.meta.url);
const R = require(path.join(root, 'readingCoach-EFC/game.js'));
const I = require(path.join(root, 'readingCoach-EFC/i18n.js'));
const dir = path.join(root, 'readingCoach-EFC/texts');
const LANGS = ['es', 'en', 'eu', 'gl', 'ca', 'fr'];

function loadAll() {
  const by = {};
  for (const l of LANGS) by[l] = (R.FILES[l] || []).flatMap(f => JSON.parse(fs.readFileSync(path.join(dir, f + '.json'), 'utf8')).texts);
  return by;
}

test('U-READ: age maps to the right band and invalid ages are refused', () => {
  const m = { 3: 'b56', 5: 'b56', 6: 'b56', 7: 'b78', 8: 'b78', 9: 'b910', 10: 'b910', 11: 'b1112', 12: 'b1112', 13: 'b13', 17: 'b13', 18: 'adult', 45: 'adult', 8.9: 'b78', '9': 'b910' };
  for (const [age, band] of Object.entries(m)) assert.equal(R.bandForAge(age), band, 'age ' + age);
  for (const bad of [0, 2, -4, 111, NaN, '', 'abc', null, undefined]) assert.equal(R.bandForAge(bad), null, 'bad ' + bad);
});

test('U-READ: target zones follow the brief and the status is below, in or above', () => {
  assert.deepEqual(R.zoneOf('b56'), [30, 60]);
  assert.deepEqual(R.zoneOf('b78'), [60, 95]);
  assert.deepEqual(R.zoneOf('b910'), [95, 125]);
  assert.deepEqual(R.zoneOf('b1112'), [125, 150]);
  assert.deepEqual(R.zoneOf('b13'), [150, 180]);
  assert.equal(R.targetPpm('b910'), 110);
  assert.equal(R.zoneStatus(80, 'b910'), 'below');
  assert.equal(R.zoneStatus(95, 'b910'), 'in');
  assert.equal(R.zoneStatus(125, 'b910'), 'in');
  assert.equal(R.zoneStatus(126, 'b910'), 'above');
});

test('U-READ: words per minute and the guard against impossible times', () => {
  assert.equal(R.computePpm(100, 60000), 100);
  assert.equal(R.computePpm(60, 30000), 120);
  assert.equal(R.computePpm(0, 30000), 0);
  assert.equal(R.computePpm(50, 0), 0);
  const ok = R.evaluateReading(100, 60000);
  assert.deepEqual([ok.ppm, ok.valid, ok.flag], [100, true, null]);
  const short = R.evaluateReading(30, 3000);
  assert.equal(short.flag, 'short'); assert.equal(short.valid, false);
  const fast = R.evaluateReading(100, 10000); // 600 wpm
  assert.equal(fast.flag, 'fast'); assert.equal(fast.valid, false);
  assert.equal(R.evaluateReading(100, 15000).valid, true); // 400 wpm is the limit
  assert.equal(R.evaluateReading(100, 14000).flag, 'fast');
  assert.equal(R.evaluateReading(10, 5000).valid, true); // exactly 5 s is accepted
  assert.equal(R.evaluateReading(10, 4999).flag, 'short');
});

test('U-READ: pause segmentation marks commas, full stops, questions and exclamations', () => {
  const tk = R.tokenize('Hola, mundo. ¿Qué es poesía? ¡Oh! Sigue: así; y fin...');
  const p = tk.map(t => t.pause);
  assert.deepEqual(p, ['comma', 'period', null, null, 'question', 'exclaim', 'colon', 'comma', null, 'period']);
  assert.equal(R.countWords('Hola, mundo. ¿Qué tal?'), 4);
  assert.equal(R.countWords('uno — dos'), 2, 'a stand-alone dash is not a word');
  assert.equal(R.pauseOf('dijo,»'), 'comma', 'closing quotes are ignored');
  const sg = R.segments(tk);
  assert.equal(sg[0].text, 'Hola,'); assert.equal(sg[1].text, 'mundo.');
  assert.equal(sg.reduce((n, s) => n + (s.to - s.from + 1), 0), tk.length);
  assert.deepEqual(R.splitPunct('mundo.'), { body: 'mundo', punct: '.' });
});

test('U-READ: karaoke schedule lasts words/ppm and gives longer stops to full stops than to commas', () => {
  const tk = R.tokenize('Uno dos, tres cuatro. Cinco seis siete ocho nueve diez.');
  const s = R.schedule(tk, 60);
  assert.equal(s.items.length, tk.length);
  assert.ok(Math.abs(s.total - tk.length * 1000) < 1, 'total ' + s.total);
  const last = s.items[s.items.length - 1];
  assert.ok(Math.abs(last.start + last.dur + last.pause - s.total) < 1);
  assert.ok(s.items[3].pause > s.items[1].pause && s.items[1].pause > s.items[0].pause);
  for (let i = 1; i < s.items.length; i++) assert.ok(s.items[i].start > s.items[i - 1].start);
  assert.deepEqual(R.schedule([], 60), { items: [], total: 0 });
  assert.deepEqual(R.schedule(tk, 0), { items: [], total: 0 });
});

test('U-READ: alignment of the words heard against the text tolerates skips, accents and small slips', () => {
  const T = 'El gato Mimo come pescado fresco cada tarde'.split(' ');
  assert.deepEqual(R.alignWords(T, 'el gato mimo come pescado fresco cada tarde'.split(' ')), Array(8).fill('read'));
  const skip = R.alignWords(T, 'el gato come pescado fresco cada tarde'.split(' '));
  assert.equal(skip[2], 'skip'); assert.equal(skip[3], 'read');
  const doubt = R.alignWords(T, 'el gato mimo comen pescados fresco'.split(' '));
  assert.equal(doubt[3], 'doubt'); assert.equal(doubt[4], 'doubt'); assert.equal(doubt[5], 'read'); assert.equal(doubt[7], 'pending');
  assert.deepEqual(R.alignWords(['¡Qué', 'día,', 'Ñandú!'], ['QUE', 'dia', 'nandu']), ['read', 'read', 'read']);
  const rep = R.alignWords(T, 'el el gato gato mimo ruido ruido'.split(' '));
  assert.equal(rep[0], 'read'); assert.equal(rep[1], 'read'); assert.equal(rep[2], 'read');
  assert.equal(R.alignWords(T, [])[0], 'pending');
  const sum = R.summarize(['read', 'read', 'doubt', 'skip', 'pending']);
  assert.deepEqual([sum.read, sum.doubt, sum.skip, sum.pending, sum.total, sum.pct], [2, 1, 1, 1, 5, 60]);
  assert.equal(R.lev('casa', 'caza'), 1);
});

test('U-READ: pause exercise gives the right gaps and the check counts them', () => {
  const ex = R.pauseExercise('Mimo es un gato gris. Le gusta dormir al sol, pero también jugar. Cuando tiene hambre, maúlla.');
  assert.equal(ex.words.length, ex.kinds.length);
  assert.ok(ex.words.every(w => !/[.,;:!?]/.test(w)), 'no punctuation left');
  assert.equal(ex.kinds[ex.kinds.length - 1], 'period');
  assert.ok(ex.kinds.includes('comma'));
  const perfect = R.checkPauses(ex.kinds, ex.kinds.slice());
  assert.deepEqual([perfect.ok, perfect.bad.length], [ex.kinds.length, 0]);
  const wrong = ex.kinds.map(() => null);
  const r = R.checkPauses(ex.kinds, wrong);
  assert.equal(r.bad.length, ex.kinds.filter(Boolean).length);
});

test('U-READ: text selection by age band and by language, with fallback to Spanish', () => {
  const by = loadAll();
  const es = R.selectTexts(by, 'b78', 'es'); assert.equal(es.fallback, false); assert.ok(es.texts.length >= 8);
  const eu = R.selectTexts(by, 'b78', 'eu'); assert.equal(eu.lang, 'eu'); assert.equal(eu.fallback, false); assert.ok(eu.texts.every(t => t.bands.includes('b78')));
  const none = R.selectTexts(by, 'b13', 'eu'); assert.equal(none.lang, 'es'); assert.equal(none.fallback, true); assert.ok(none.texts.length >= 8);
  const ad = R.selectTexts(by, 'adult', 'es'); assert.ok(ad.texts.length >= 8);
});

test('U-READ: streak, weekly trend, medals and achievements', () => {
  const p = R.blank();
  R.updateStreak(p, '2026-03-01'); assert.equal(p.streak, 1);
  R.updateStreak(p, '2026-03-01'); assert.equal(p.streak, 1, 'same day does not add');
  R.updateStreak(p, '2026-03-02'); assert.equal(p.streak, 2);
  R.updateStreak(p, '2026-03-03'); assert.equal(p.streak, 3);
  R.updateStreak(p, '2026-03-06'); assert.equal(p.streak, 1, 'a gap resets');
  R.updateStreak(p, '2026-04-01'); R.updateStreak(p, '2026-04-02'); assert.equal(p.streak, 2, 'month change');
  const hist = [{ d: '2026-03-10', ppm: 100 }, { d: '2026-03-11', ppm: 110 }, { d: '2026-03-02', ppm: 80 }, { d: '2026-02-01', ppm: 10 }];
  assert.deepEqual(R.weeklyTrend(hist, '2026-03-12'), { cur: 105, prev: 80, n: 2 });
  assert.deepEqual(R.weeklyTrend([], '2026-03-12'), { cur: null, prev: null, n: 0 });
  const q = R.blank(); q.texts = { a: { listen: true, karaoke: true, solo: true, quiz: true }, b: { listen: true } };
  assert.equal(R.medalCount(q.texts.a), 4); assert.equal(R.totalMedals(q), 5);
  assert.deepEqual(R.achievements(R.blank()), []);
  q.hist = [{ d: '2026-03-10', ppm: 100, z: 1 }]; q.perfect = true; q.streak = 3;
  assert.deepEqual(R.achievements(q).sort(), ['first', 'quiz', 'streak3', 'zone']);
  assert.equal(R.stars(3, 3), 3); assert.equal(R.stars(2, 3), 2); assert.equal(R.stars(1, 3), 1); assert.equal(R.stars(0, 3), 1);
  assert.equal(R.quizPassed(2, 3), true); assert.equal(R.quizPassed(1, 3), false); assert.equal(R.quizPassed(2, 2), true); assert.equal(R.quizPassed(1, 2), false);
  assert.equal(R.fmt('{a} de {b}', { a: 1, b: 2 }), '1 de 2');
});

test('U-READ: every interface label exists in the six languages with the same keys and placeholders', () => {
  const keys = Object.keys(I.es);
  assert.ok(keys.length > 100);
  for (const l of LANGS) {
    assert.deepEqual(Object.keys(I[l]).sort(), keys.slice().sort(), 'keys of ' + l);
    for (const k of keys) {
      const v = I[l][k];
      assert.equal(typeof v, 'string', l + '.' + k); assert.ok(v.trim().length > 0, l + '.' + k);
      assert.ok(!/[—–]/.test(v), 'no long dash in ' + l + '.' + k);
      const ph = s => (s.match(/\{\w+\}/g) || []).sort().join(',');
      assert.equal(ph(v), ph(I.es[k]), 'placeholders of ' + l + '.' + k);
    }
  }
  for (const l of ['en', 'eu', 'gl', 'ca', 'fr']) {
    const same = keys.filter(k => I[l][k] === I.es[k] && I.es[k].length > 12);
    assert.ok(same.length <= (l === 'gl' || l === 'ca' ? 10 : 0), l + ' copies Spanish text: ' + same.join(','));
  }
  for (const b of R.BAND_IDS) for (const l of LANGS) assert.ok(I[l][b], 'band label ' + b + ' in ' + l);
  assert.ok(I.es.consentText.includes('servidor') && I.en.consentText.includes('server'), 'privacy notice mentions the server');
});

test('U-READ: texts are well formed, sourced and licensed, with 2-3 questions grounded in the text', () => {
  const by = loadAll(), ids = new Set();
  for (const l of LANGS) for (const t of by[l]) {
    assert.ok(!ids.has(t.id), 'duplicate id ' + t.id); ids.add(t.id);
    assert.ok(t.id.startsWith(l + '-'), 'id prefix ' + t.id);
    for (const f of ['title', 'author', 'source', 'license', 'text']) assert.ok(typeof t[f] === 'string' && t[f].trim().length > 2, t.id + ' ' + f);
    assert.ok(/public-domain|original-project/.test(t.license), t.id + ' licence ' + t.license);
    assert.ok(Array.isArray(t.bands) && t.bands.length && t.bands.every(b => R.BAND_IDS.includes(b)), t.id + ' bands');
    assert.ok(t.questions.length >= 2 && t.questions.length <= 3, t.id + ' question count');
    for (const q of t.questions) {
      assert.ok(q.q && q.o.length >= 3 && new Set(q.o).size === q.o.length, t.id + ' options');
      assert.ok(Number.isInteger(q.a) && q.a >= 0 && q.a < q.o.length, t.id + ' answer index');
      assert.ok(q.ev && t.text.includes(q.ev), t.id + ' evidence is a quote from the text: ' + q.ev);
    }
  }
});

test('U-READ: Spanish has at least 8 texts per age band, with the lengths of the brief (small tolerance)', () => {
  const by = loadAll();
  for (const b of R.BANDS) {
    const list = by.es.filter(t => t.bands.includes(b.id));
    assert.ok(list.length >= 8, b.id + ' has ' + list.length);
    for (const t of list.filter(x => !x.poem)) {
      const n = R.countWords(t.text);
      assert.ok(n >= b.len[0] * 0.85 && n <= b.len[1] * 1.15, t.id + ' has ' + n + ' words, band ' + b.len);
    }
  }
  for (const l of ['en', 'eu', 'gl', 'ca', 'fr']) assert.ok(by[l].length >= 3, l + ' has some texts');
});

// ------------------------------------------------------------------ Aventuras: books in chapters
function loadBooks() {
  const by = {};
  for (const l of LANGS) by[l] = (R.BOOK_FILES[l] || []).flatMap(f => JSON.parse(fs.readFileSync(path.join(dir, f + '.json'), 'utf8')).books);
  return by;
}
const BOOK_LEN = { b56: [40, 100], b78: [40, 100], b910: [150, 300], b1112: [150, 300], b13: [300, 500], adult: [300, 500] };

test('U-READ books: every book has source, licence, retelling, cover and 3-5 chapters of the right length, each with a hook and grounded questions', () => {
  const by = loadBooks(), ids = new Set();
  for (const l of LANGS) for (const b of by[l]) {
    assert.ok(!ids.has(b.id) && b.id.startsWith(l + '-'), 'book id ' + b.id); ids.add(b.id);
    for (const f of ['title', 'author', 'source', 'license', 'retelling', 'emoji']) assert.ok(typeof b[f] === 'string' && b[f].trim().length > 0, b.id + ' ' + f);
    assert.ok(/public-domain/.test(b.license) && /retelling/.test(b.license), b.id + ' licence ' + b.license);
    assert.match(b.color, /^#[0-9a-f]{6}$/i, b.id + ' colour');
    assert.ok(Array.isArray(b.bands) && b.bands.length && b.bands.every(x => R.BAND_IDS.includes(x)), b.id + ' bands');
    assert.ok(b.chapters.length >= 3 && b.chapters.length <= 5, b.id + ' chapters ' + b.chapters.length);
    b.chapters.forEach((c, i) => {
      assert.ok(!ids.has(c.id) && c.id.startsWith(b.id + '-'), 'chapter id ' + c.id); ids.add(c.id);
      assert.ok(c.title && c.text, c.id + ' title and text');
      const n = R.countWords(c.text);
      for (const band of b.bands) assert.ok(n >= BOOK_LEN[band][0] && n <= BOOK_LEN[band][1], c.id + ' has ' + n + ' words for ' + band);
      if (i < b.chapters.length - 1) assert.ok(c.hook && c.text.trim().endsWith(c.hook), c.id + ' ends with its hook');
      assert.ok(c.questions.length >= 2 && c.questions.length <= 3, c.id + ' question count');
      for (const q of c.questions) {
        assert.ok(q.q && q.o.length >= 3 && new Set(q.o).size === q.o.length, c.id + ' options');
        assert.ok(Number.isInteger(q.a) && q.a >= 0 && q.a < q.o.length, c.id + ' answer index');
        assert.ok(q.ev && c.text.includes(q.ev), c.id + ' evidence is a quote: ' + q.ev);
      }
      for (const f of [c.title, c.text, b.title, b.retelling]) assert.ok(!/—/.test(f), c.id + ' no long dash');
    });
  }
});

test('U-READ books: Spanish has at least 2 books per age band and every other language has at least 1', () => {
  const by = loadBooks();
  for (const b of R.BANDS) assert.ok(by.es.filter(x => x.bands.includes(b.id)).length >= 2, 'es books for ' + b.id);
  for (const l of ['en', 'eu', 'gl', 'ca', 'fr']) assert.ok(by[l].length >= 1, l + ' has a book');
});

test('U-READ books: selection by band and language falls back to Spanish', () => {
  const by = loadBooks();
  const es = R.selectBooks(by, 'b56', 'es'); assert.equal(es.fallback, false); assert.ok(es.books.length >= 2);
  const eu = R.selectBooks(by, 'b78', 'eu'); assert.deepEqual([eu.lang, eu.fallback], ['eu', false]);
  const none = R.selectBooks(by, 'b13', 'eu'); assert.deepEqual([none.lang, none.fallback], ['es', true]); assert.ok(none.books.length >= 2);
  assert.deepEqual(R.selectBooks({}, 'b13', 'es').books, []);
});

test('U-READ books: chapters unlock in order, progress counts stars and a text becomes a playable chapter', () => {
  const bk = { id: 'x', title: 'Libro', author: 'A', license: 'public-domain', chapters: [{ id: 'x-1', title: 'Uno', text: 'a b', hook: 'b', questions: [] }, { id: 'x-2', title: 'Dos', text: 'c d', questions: [] }, { id: 'x-3', title: 'Tres', text: 'e f', questions: [] }] };
  assert.deepEqual([0, 1, 2, 3, -1].map(i => R.chapterUnlocked(bk, {}, i)), [true, false, false, false, false]);
  const t1 = { 'x-1': { quiz: true, stars: 3 } };
  assert.deepEqual([0, 1, 2].map(i => R.chapterUnlocked(bk, t1, i)), [true, true, false]);
  assert.equal(R.chapterUnlocked(bk, { 'x-1': { solo: true, listen: true } }, 1), false, 'medals other than the questions do not open the next chapter');
  assert.equal(R.chapterUnlocked(bk, { 'x-2': { quiz: true } }, 2), false, 'a later chapter does not open the gap');
  assert.deepEqual(R.bookProgress(bk, {}), { done: 0, total: 3, next: 0, stars: 0, finished: false });
  assert.deepEqual(R.bookProgress(bk, t1), { done: 1, total: 3, next: 1, stars: 3, finished: false });
  const all = { 'x-1': { quiz: true, stars: 2 }, 'x-2': { quiz: true }, 'x-3': { quiz: true, stars: 3 } };
  assert.deepEqual(R.bookProgress(bk, all), { done: 3, total: 3, next: -1, stars: 6, finished: true });
  const c = R.chapterAsText(bk, 0, 'es');
  assert.deepEqual([c.id, c.text, c.hook, c.chIdx, c.lang, c.book === bk], ['x-1', 'a b', 'b', 0, 'es', true]);
  assert.ok(c.title.includes('Libro') && c.title.includes('Uno'));
});
