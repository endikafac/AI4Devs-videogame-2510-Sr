import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = path.resolve(import.meta.dirname, '../..');
const require = createRequire(import.meta.url);
const K = require(path.join(root, 'clock-EFC/game.js'));
const F = require(path.join(root, 'fractions-EFC/game.js'));
const LANGS = ['es', 'en', 'eu', 'gl', 'ca', 'fr'];

// deterministic random generator
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
const memStorage = () => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, raw: m }; };
const label = (s, what) => { assert.ok(typeof s === 'string' && s.trim().length > 0, `${what}: empty label`); assert.ok(!/undefined|NaN|\[object/.test(s), `${what}: bad label ${s}`); };
const clean = (s, what) => { assert.ok(typeof s === 'string' && s.trim().length > 8, `${what}: empty text`); assert.ok(!/undefined|NaN|\[object|null/.test(s), `${what}: bad text "${s}"`); };

// ---------------------------------------------------------------- CLOCK: hand maths
test('U-CLOCK-ANGLES: minute hand 6 deg/min, hour hand 0.5 deg/min, round trip time -> angles -> time', () => {
  assert.deepEqual(K.handAngles(3, 0), { hour: 90, minute: 0 });
  assert.deepEqual(K.handAngles(12, 0), { hour: 0, minute: 0 });
  assert.deepEqual(K.handAngles(6, 30), { hour: 195, minute: 180 });
  for (let m = 0; m < 60; m++) assert.equal(K.handAngles(5, m).minute, m * 6);
  for (let m = 0; m < 60; m++) assert.equal(K.handAngles(5, m).hour, 150 + m * 0.5);
  // one full hour = 30 degrees of the hour hand
  assert.equal(K.handAngles(4, 0).hour - K.handAngles(3, 0).hour, 30);
  for (let h = 1; h <= 12; h++) for (let m = 0; m < 60; m++) {
    const a = K.handAngles(h, m), back = K.anglesToTime(a.hour, a.minute);
    assert.deepEqual(back, { h, m }, `round trip ${h}:${m}`);
  }
});

test('U-CLOCK-DRAG: pointer angle -> minute, the hour follows when the minute hand crosses 12', () => {
  assert.equal(K.pointAngle(0, -10), 0);       // straight up
  assert.equal(K.pointAngle(10, 0), 90);       // right
  assert.equal(K.pointAngle(0, 10), 180);      // down
  assert.equal(K.pointAngle(-10, 0), 270);     // left
  assert.equal(K.minuteFromAngle(0), 0); assert.equal(K.minuteFromAngle(180), 30); assert.equal(K.minuteFromAngle(359), 0); assert.equal(K.minuteFromAngle(93), 16);
  assert.equal(K.minuteFromAngle(100, 5), 15); assert.equal(K.minuteFromAngle(100, 15), 15);
  assert.equal(K.hourFromAngle(90), 3); assert.equal(K.hourFromAngle(0), 12); assert.equal(K.hourFromAngle(345), 12);
  assert.equal(K.hourFromAngle(105, 30), 3); // 3:30 -> the hour hand sits at 105 deg
  assert.equal(K.advanceHour(3, 58, 2), 4); assert.equal(K.advanceHour(12, 58, 2), 1);
  assert.equal(K.advanceHour(3, 2, 58), 2); assert.equal(K.advanceHour(1, 2, 58), 12);
  assert.equal(K.advanceHour(3, 20, 25), 3);
  // time arithmetic helpers
  assert.deepEqual(K.addMinutes({ h: 11, m: 45 }, 30), { h: 12, m: 15 });
  assert.deepEqual(K.addMinutes({ h: 12, m: 10 }, -20), { h: 11, m: 50 });
  assert.equal(K.minutesBetween({ h: 4, m: 0 }, { h: 5, m: 30 }), 90);
  assert.equal(K.minutesBetween({ h: 11, m: 30 }, { h: 1, m: 0 }), 90);
});

// ---------------------------------------------------------------- CLOCK: questions
const t12 = (h, m) => `${h}:${String(m).padStart(2, '0')}`;
const total = t => (t.h % 12) * 60 + t.m;
const fromTotal = x => { x = ((x % 720) + 720) % 720; return { h: Math.floor(x / 60) || 12, m: x % 60 }; };

function checkClockQuestion(u, q) {
  const where = `${u.id}/${q.type}`;
  assert.ok(q.key && typeof q.key === 'string', where + ' key');
  const uniq = arr => new Set(arr.map(x => JSON.stringify(x))).size === arr.length;
  if (['read', 'say', 'hear'].includes(q.type)) {
    assert.equal(q.answer, t12(q.h, q.m)); assert.equal(q.options.length, 4); assert.ok(uniq(q.options)); assert.equal(q.options.filter(o => o === q.answer).length, 1);
    if (q.type === 'say') assert.equal(q.m % 5, 0, 'phrases only for multiples of 5');
  } else if (q.type === 'type') {
    assert.ok(K.isCorrect(q, { h: q.h, m: q.m })); assert.ok(K.isCorrect(q, { h: q.h + 12, m: q.m }), '24 h typed hour is accepted');
    assert.ok(!K.isCorrect(q, { h: q.h, m: (q.m + 1) % 60 }));
  } else if (q.type === 'pick') {
    assert.equal(q.clocks.length, 4); assert.equal(q.clocks.filter(c => c.ok).length, 1);
    assert.equal(new Set(q.clocks.map(c => t12(c.h, c.m))).size, 4);
    const ok = q.clocks.findIndex(c => c.ok); assert.ok(K.isCorrect(q, ok)); assert.ok(!K.isCorrect(q, (ok + 1) % 4));
    assert.equal(t12(q.clocks[ok].h, q.clocks[ok].m), t12(q.h, q.m));
  } else if (q.type === 'set') {
    assert.ok(K.isCorrect(q, { h: q.h, m: q.m })); assert.ok(!K.isCorrect(q, { h: q.h % 12 + 1, m: q.m })); assert.ok(!K.isCorrect(q, null));
    assert.ok(q.start && q.start.h >= 1 && q.start.h <= 12);
    assert.ok(!(q.start.h === q.h && q.start.m === q.m), 'start must differ from the target');
    if (q.ask.kind === 'after') assert.equal(total({ h: q.h, m: q.m }), ((total(q.ask.s) + q.ask.d) % 720 + 720) % 720);
    if (q.ask.kind === 'h24') assert.equal(q.h, q.h24 > 12 ? q.h24 - 12 : q.h24);
  } else if (q.type === 'match') {
    assert.equal(q.times.length, 3); assert.equal(new Set(q.times.map(t => t12(t.h, t.m))).size, 3); assert.deepEqual([...q.order].sort(), [0, 1, 2]);
    assert.ok(K.isCorrect(q, 0)); assert.ok(!K.isCorrect(q, 1));
  } else if (q.type === 'add' || q.type === 'durend') {
    const { s, d } = q.ask, expect = fromTotal(total(s) + d);
    assert.equal(q.answer, t12(expect.h, expect.m), 'add result'); assert.equal(q.options.length, 4); assert.ok(uniq(q.options)); assert.ok(q.options.includes(q.answer));
    if (q.type === 'durend') assert.ok(d > 0);
  } else if (q.type === 'dur') {
    const d = ((total(q.b) - total(q.a)) % 720 + 720) % 720;
    assert.equal(q.d, d, 'duration'); assert.equal(q.answer, String(d)); assert.equal(q.options.length, 4); assert.ok(uniq(q.options)); assert.ok(q.options.every(o => Number(o) > 0));
  } else if (q.type === 'h24read') {
    assert.ok(q.h24 >= 1 && q.h24 <= 23 && q.h24 !== 12);
    assert.equal(q.answer, `${String(q.h24).padStart(2, '0')}:${String(q.m).padStart(2, '0')}`); assert.equal(q.h, q.h24 % 12 || 12);
    assert.equal(q.options.length, 4); assert.ok(uniq(q.options)); assert.ok(q.options.includes(q.answer));
  } else if (q.type === 'h24to12') {
    assert.equal(q.answer, `${t12(q.h24 % 12 || 12, q.m)}|${q.period}`); assert.equal(q.options.length, 4); assert.ok(uniq(q.options)); assert.ok(q.options.includes(q.answer));
  } else assert.fail('unknown type ' + q.type);
  assert.ok(K.isCorrect(q, q.type === 'pick' ? q.clocks.findIndex(c => c.ok) : ['set', 'type'].includes(q.type) ? { h: q.h, m: q.m } : q.type === 'match' ? 0 : q.answer), where + ' answer must be accepted');
}

test('U-CLOCK-LESSONS: ten lessons, every generated question has an independently verified answer', () => {
  assert.deepEqual(K.UNITS.map(u => u.id), ['hours', 'hoursSet', 'half', 'quarter', 'five', 'five2', 'words', 'plus', 'h24', 'dur']);
  for (const l of LANGS) for (const u of K.UNITS) assert.ok(K.UI[l].k[u.id], `${l} title for ${u.id}`);
  const r = mulberry32(7);
  for (const u of K.UNITS) {
    assert.equal(u.ex.length, 3, u.id + ' needs 3 worked examples');
    const types = new Set();
    for (let i = 0; i < 60; i++) for (const q of K.makeLesson(u, r)) { checkClockQuestion(u, q); types.add(q.type); }
    assert.ok(types.size >= Math.min(3, new Set(u.types).size), `${u.id} should mix question kinds, got ${[...types]}`);
    for (const q of K.makeGuided(u, r)) { assert.equal(q.type, 'set'); assert.ok(q.guided); checkClockQuestion(u, q); }
  }
});

test('U-CLOCK-NOREPEAT: 300 questions per lesson do not repeat a key where the space allows', () => {
  for (const u of K.UNITS) {
    const r = mulberry32(11);
    const space = new Set(); for (let i = 0; i < 6000; i++) space.add(K.makeQuestion(u, u.types[i % u.types.length], r).key);
    const lesson = K.makeLesson(Object.assign({}, u, { len: 300 }), mulberry32(3), null);
    const distinct = new Set(lesson.map(q => q.key)).size;
    if (space.size >= 300) assert.equal(distinct, 300, `${u.id}: ${300 - distinct} repeated keys although ${space.size} are possible`);
    else assert.ok(distinct >= Math.floor(space.size * 0.9), `${u.id}: only ${distinct} of ${space.size} distinct`);
    // a normal lesson never repeats a time inside the session
    for (let i = 0; i < 40; i++) { const keys = K.makeLesson(u, mulberry32(100 + i), null).map(q => q.key); if (space.size >= u.len * 2) assert.equal(new Set(keys).size, keys.length, `${u.id} repeats inside a lesson`); }
  }
});

test('U-CLOCK-SEEN: ring buffer of 200 keys per player in clock_seen_<owner>', () => {
  const st = memStorage(), s = K.SeenStore(st, 'u1_p1');
  assert.equal(s.storageKey, 'clock_seen_u1_p1');
  for (let i = 0; i < 250; i++) s.add('k' + i);
  assert.equal(s.size(), 200); assert.ok(!s.has('k49')); assert.ok(s.has('k50')); assert.ok(s.has('k249'));
  assert.equal(JSON.parse(st.raw['clock_seen_u1_p1']).length, 200);
  s.add('k100'); assert.equal(s.size(), 200); assert.equal(s.keys().at(-1), 'k100'); assert.ok(s.rank('k100') > s.rank('k249'));
  const again = K.SeenStore(st, 'u1_p1'); assert.ok(again.has('k249')); assert.equal(again.size(), 200);
  assert.equal(K.SeenStore(st, 'other').size(), 0, 'another player has its own buffer');
  assert.equal(K.SeenStore({ getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } }, 'x').size(), 0, 'blocked storage must not break');
  // sessions avoid what the previous ones showed
  const u = K.UNITS.find(x => x.id === 'five2'), store = K.SeenStore(memStorage(), 'g'), shown = [];
  const r = mulberry32(5);
  for (let l = 0; l < 15; l++) for (const q of K.makeLesson(u, r, store)) { store.add(q.key); shown.push(q.key); }
  assert.equal(new Set(shown).size, shown.length, 'no key repeated over 15 lessons');
  // when the whole space has been seen the least recent one is reused instead of failing
  const tiny = K.UNITS[0], st2 = K.SeenStore(memStorage(), 't'); for (let h = 1; h <= 12; h++) st2.add(`t|${h}:0`);
  const q = K.makeUnique(tiny, 'type', mulberry32(1), st2, new Set()); assert.ok(q.repeat && q.key.startsWith('t|'));
});

// ---------------------------------------------------------------- CLOCK: texts in the six languages
test('U-CLOCK-I18N: new strings exist with the same keys in all six languages', () => {
  const ref = Object.keys(K.UI.es).sort();
  for (const l of LANGS) {
    assert.deepEqual(Object.keys(K.UI[l]).sort(), ref, `${l} keys differ from es`);
    for (const k of Object.keys(K.UI.es)) assert.equal(typeof K.UI[l][k], typeof K.UI.es[k], `${l}.${k} type`);
    assert.deepEqual(Object.keys(K.UI[l].learn).sort(), K.UNITS.map(u => u.id).sort(), `${l} learn intros`);
    assert.deepEqual(Object.keys(K.UI[l].k).sort(), K.UNITS.map(u => u.id).sort(), `${l} lesson titles`);
    for (const u of K.UNITS) clean(K.UI[l].learn[u.id], `${l} intro ${u.id}`);
    assert.deepEqual(Object.keys(K.UI[l].pOf).sort(), ['am', 'night', 'pm']);
  }
});

test('U-CLOCK-WORDS: spoken forms are distinct for every hour and five minutes in every language', () => {
  for (const l of LANGS) {
    const seen = new Set();
    for (let h = 1; h <= 12; h++) for (let m = 0; m < 60; m += 5) { const p = K.UI[l].say(h, m); clean(p, `${l} ${h}:${m}`); assert.ok(!seen.has(p), `${l} duplicate phrase ${p}`); seen.add(p); }
  }
  assert.equal(K.UI.es.say(3, 40), 'las cuatro menos veinte'); assert.equal(K.UI.es.say(1, 30), 'la una y media'); assert.equal(K.UI.es.say(12, 45), 'la una menos cuarto');
  assert.equal(K.UI.es.say(5, 15), 'las cinco y cuarto'); assert.equal(K.UI.en.say(3, 45), 'quarter to four'); assert.equal(K.UI.en.say(9, 0), "nine o'clock");
  assert.equal(K.UI.fr.say(4, 45), 'cinq heures moins le quart'); assert.equal(K.UI.ca.say(3, 15), 'les tres i quart'); assert.equal(K.UI.gl.say(2, 30), 'as dúas e media');
});

test('U-CLOCK-EXPLAIN: a wrong answer always gets a sentence that says why, in the six languages', () => {
  const r = mulberry32(21);
  for (const u of K.UNITS) for (let i = 0; i < 12; i++) for (const q of K.makeLesson(u, r)) for (const l of LANGS) {
    const ex = K.explain(q, l, q.type === 'set' ? { h: 2, m: 10 } : null);
    clean(ex.text, `${l} ${u.id}/${q.type} explain`); assert.ok(ex.clocks.length >= 1);
    for (const c of ex.clocks) { assert.ok(c.h >= 1 && c.h <= 12 && c.m >= 0 && c.m < 60); }
    if (q.type !== 'match') label(K.answerLabel(q, l), `${l} ${q.type} label`);
    if (q.type === 'set') clean(K.setPrompt(q, l), `${l} set prompt`);
  }
  // the sentence spelled out in the brief
  const q = { type: 'read', h: 4, m: 30 };
  const es = K.explain(q, 'es').text;
  assert.match(es, /entre el 4 y el 5/); assert.match(es, /6/); assert.match(es, /media/); assert.match(es, /4:30/);
  assert.match(K.explain({ type: 'read', h: 3, m: 0 }, 'es').text, /justo al 3.*12.*en punto.*3:00/);
  // time arithmetic and durations show the calculation
  const add = { type: 'add', ask: { s: { h: 3, m: 15 }, d: 60 }, h: 4, m: 15, answer: '4:15' };
  assert.match(K.explain(add, 'es').text, /3:15 \+ 1 h = 4:15/);
  const back = { type: 'add', ask: { s: { h: 5, m: 30 }, d: -30 }, h: 5, m: 0, answer: '5:00' };
  assert.match(K.explain(back, 'en').text, /5:30 − 30 min = 5:00/);
  const dur = { type: 'dur', a: { h: 4, m: 0 }, b: { h: 5, m: 30 }, d: 90, h: 5, m: 30, answer: '90' };
  assert.match(K.explain(dur, 'fr').text, /4:00 à 5:30 = 1 h 30 min/);
  const h24 = { type: 'h24read', h24: 15, period: 'pm', h: 3, m: 0, answer: '15:00' };
  assert.match(K.explain(h24, 'es').text, /15 − 12 = 3/);
  assert.match(K.deltaText(-30, K.UI.es), /hace media hora/); assert.match(K.deltaText(60, K.UI.es), /dentro de 1 hora/);
});

test('U-CLOCK-EXAMPLES: three worked examples per lesson with text and a clock to show', () => {
  for (const u of K.UNITS) for (const ex of u.ex) {
    const c = K.exampleClock(ex); assert.ok(c.h >= 1 && c.h <= 12 && c.m >= 0 && c.m < 60);
    for (const l of LANGS) clean(K.exampleText(ex, l), `${l} ${u.id} example`);
  }
  assert.match(K.exampleText({ k: 't', h: 3, m: 0 }, 'es'), /^Mira: La aguja corta apunta justo al 3\./);
});

// ---------------------------------------------------------------- FRACTIONS
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const val = f => f.n / f.d;

function checkFractionQuestion(u, q) {
  const where = `${u.id}/${q.type}`, uniq = arr => new Set(arr.map(x => JSON.stringify(x))).size === arr.length;
  assert.ok(q.key && typeof q.key === 'string', where + ' key');
  switch (q.type) {
    case 'id': case 'add': case 'line': case 'qtyf': case 'd2f':
      assert.equal(q.options.length, 4, where); assert.ok(uniq(q.options), where + ' duplicate options');
      assert.equal(q.options.filter(o => o.n === q.answer.n && o.d === q.answer.d).length, 1, where + ' answer once');
      assert.equal(q.options.filter(o => Math.abs(val(o) - val(q.answer)) < 1e-9).length, 1, where + ' no second equivalent option');
      break;
    case 'build': case 'place': assert.ok(q.answer >= 1 && q.answer < q.f.d); break;
    case 'cmp': {
      const x = q.a.n / q.a.d, y = q.b.n / q.b.d;
      assert.equal(q.answer, Math.abs(x - y) < 1e-9 ? 'E' : x < y ? 'R' : 'L', where); break;
    }
    case 'eq': assert.equal(q.answer * q.f.d, q.f.n * q.target.d, where + ' not equivalent'); assert.equal(q.options.length, Math.min(4, q.target.d - 1)); assert.ok(uniq(q.options)); assert.ok(q.options.includes(q.answer)); break;
    case 'qty': assert.equal(q.answer, q.f.n * q.T / q.f.d); assert.ok(Number.isInteger(q.answer)); assert.equal(q.T % q.f.d, 0); assert.ok(uniq(q.options) && q.options.includes(q.answer) && q.options.length === 4); break;
    case 'mix': {
      if (q.dir === 'up') { const m = q.answer; assert.equal(m.w * m.d + m.n, q.f.n); assert.ok(m.n > 0 && m.n < m.d && m.w >= 1); assert.ok(uniq(q.options) && q.options.length === 4); assert.equal(q.options.filter(o => o.w * o.d + o.n === q.f.n).length, 1); }
      else { assert.equal(q.answer.n, q.m.w * q.m.d + q.m.n); assert.ok(uniq(q.options)); assert.equal(q.options.filter(o => o.n * q.m.d === q.answer.n * o.d).length, 1); }
      break;
    }
    case 'dec': assert.ok(Math.abs(Number(q.answer) - val(q.f)) < 1e-9); assert.ok(uniq(q.options) && q.options.includes(q.answer) && q.options.length === 4); break;
    case 'pct': assert.ok(Math.abs(Number(q.answer) / 100 - val(q.f)) < 1e-9); assert.ok(uniq(q.options) && q.options.includes(q.answer) && q.options.length === 4); break;
    default: assert.fail('unknown type ' + q.type);
  }
  if (q.type === 'qtyf') { assert.equal(gcd(q.answer.n, q.answer.d), 1); assert.equal(q.c * q.answer.d, q.T * q.answer.n); }
  const ok = q.type === 'cmp' || q.type === 'eq' || q.type === 'qty' || q.type === 'build' || q.type === 'place' || q.type === 'dec' || q.type === 'pct' ? q.answer : q.answer;
  assert.ok(F.isCorrect(q, ok), where + ' answer must be accepted');
}

test('U-FRAC-LESSONS: eleven lessons, every generated question has an independently verified answer', () => {
  assert.deepEqual(F.UNITS.map(u => u.id), ['id1', 'id2', 'cmp1', 'cmp2', 'eq', 'add', 'mix', 'line', 'qty', 'mixed', 'dec']);
  for (const l of LANGS) for (const u of F.UNITS) assert.ok(F.UI[l].k[u.id], `${l} title for ${u.id}`);
  const r = mulberry32(9);
  for (const u of F.UNITS) {
    assert.equal(u.ex.length, 3, u.id + ' needs 3 worked examples');
    const types = new Set();
    for (let i = 0; i < 60; i++) for (const q of F.makeLesson(u, r)) { checkFractionQuestion(u, q); types.add(q.type); }
    assert.ok(types.size >= Math.min(2, new Set(u.types).size), `${u.id} should mix question kinds`);
    for (const q of F.makeGuided(u, r)) { assert.ok(q.guided); assert.equal(q.type, u.guided); checkFractionQuestion(u, q); }
  }
  assert.equal(F.toMixed({ n: 7, d: 4 }).w, 1); assert.equal(F.decStr({ n: 1, d: 4 }), '0.25'); assert.equal(F.pctOf({ n: 3, d: 5 }), 60);
});

test('U-FRAC-NOREPEAT: 300 questions per lesson do not repeat a key where the space allows; ring buffer fractions_seen_<owner>', () => {
  for (const u of F.UNITS) {
    const r = mulberry32(13), space = new Set();
    for (let i = 0; i < 8000; i++) space.add(F.makeQuestion(u, u.types[i % u.types.length], r).key);
    const lesson = F.makeLesson(Object.assign({}, u, { len: 300 }), mulberry32(4), null), distinct = new Set(lesson.map(q => q.key)).size;
    if (space.size >= 300) assert.equal(distinct, 300, `${u.id}: repeated keys although ${space.size} possible`);
    else assert.ok(distinct >= Math.floor(space.size * 0.9), `${u.id}: only ${distinct} of ${space.size} distinct`);
    if (space.size >= u.len * 2) for (let i = 0; i < 30; i++) { const keys = F.makeLesson(u, mulberry32(50 + i), null).map(q => q.key); assert.equal(new Set(keys).size, keys.length, `${u.id} repeats inside a lesson`); }
  }
  const st = memStorage(), s = F.SeenStore(st, 'u9');
  assert.equal(s.storageKey, 'fractions_seen_u9');
  for (let i = 0; i < 230; i++) s.add('q' + i);
  assert.equal(s.size(), 200); assert.ok(!s.has('q29')); assert.ok(s.has('q30'));
  assert.equal(F.SeenStore(st, 'u9').size(), 200);
  const store = F.SeenStore(memStorage(), 'x'), shown = [], u = F.UNITS.find(x => x.id === 'qty'), r = mulberry32(2);
  for (let l = 0; l < 15; l++) for (const q of F.makeLesson(u, r, store)) { store.add(q.key); shown.push(q.key); }
  assert.equal(new Set(shown).size, shown.length, 'no repeated question over 15 lessons');
});

test('U-FRAC-I18N: new strings exist with the same keys in all six languages', () => {
  const ref = Object.keys(F.UI.es).sort();
  for (const l of LANGS) {
    assert.deepEqual(Object.keys(F.UI[l]).sort(), ref, `${l} keys differ from es`);
    for (const k of Object.keys(F.UI.es)) assert.equal(typeof F.UI[l][k], typeof F.UI.es[k], `${l}.${k} type`);
    assert.deepEqual(Object.keys(F.UI[l].learn).sort(), F.UNITS.map(u => u.id).sort(), `${l} learn intros`);
    for (const u of F.UNITS) clean(F.UI[l].learn[u.id], `${l} intro ${u.id}`);
  }
});

test('U-FRAC-EXPLAIN: a wrong answer gets a sentence that says why plus a picture, in the six languages', () => {
  const r = mulberry32(31);
  for (const u of F.UNITS) for (let i = 0; i < 10; i++) for (const q of F.makeLesson(u, r)) for (const l of LANGS) {
    const ex = F.explain(q, l);
    clean(ex.text, `${l} ${u.id}/${q.type}`); assert.ok(ex.visuals.length >= 1); label(F.answerLabel(q, l), `${l} label`); clean(F.promptOf(q, l), `${l} prompt`);
  }
  for (const u of F.UNITS) for (const ex of u.ex) for (const l of LANGS) clean(F.exampleText(u.learn, ex, l), `${l} ${u.id} example`);
  assert.match(F.explain({ type: 'qty', f: { n: 1, d: 4 }, T: 12, g: 3, answer: 3 }, 'es').text, /12 ÷ 4 = 3.*1 × 3 = 3/);
  assert.match(F.explain({ type: 'cmp', a: { n: 2, d: 3 }, b: { n: 3, d: 5 }, shape: 'bar', answer: 'L' }, 'en').text, /2×5 = 10 and 3×3 = 9.*>/);
  assert.match(F.explain({ type: 'mix', dir: 'up', f: { n: 7, d: 4 }, answer: { w: 1, n: 3, d: 4 } }, 'es').text, /7 ÷ 4 = 1 y sobran 3.*1 3\/4/);
  assert.match(F.explain({ type: 'dec', f: { n: 1, d: 2 }, answer: '0.5' }, 'es').text, /1\/2 = 50\/100 = 0,5 = 50 %/);
  assert.match(F.explain({ type: 'dec', f: { n: 1, d: 2 }, answer: '0.5' }, 'en').text, /1\/2 = 50\/100 = 0\.5 = 50%/);
  assert.match(F.explain({ type: 'eq', f: { n: 1, d: 3 }, target: { n: 4, d: 12 }, answer: 4 }, 'es').text, /por 4: 1×4 = 4 y 3×4 = 12/);
});
