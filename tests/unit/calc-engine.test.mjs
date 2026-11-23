import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '../..');
const E = require(path.join(root, 'calcPath-EFC/engine.js'));

const r2 = x => Math.round(x * 100) / 100;
const gcd = (a, b) => b ? gcd(b, a % b) : a;
const fr = s => { const [n, d] = String(s).split('/').map(Number); return { n, d }; };
const sameFr = (x, y) => { const a = fr(x), b = fr(y); return a.n * b.d === b.n * a.d; };
const ndig = n => String(Math.abs(Math.trunc(n))).length;
const calc = (a, op, b) => op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b;

/** Independent recomputation of the expected answer from the question fields. */
function expected(q) {
  switch (q.op) {
    case '+': case '-': case '*': case '/':
      if (q.hole === 'a') {
        // answer op b = c
        assert.equal(r2(calc(q.answer, q.op, q.b)), r2(q.c), 'hole a: ' + q.text);
        return q.answer;
      }
      if (q.hole === 'b') {
        assert.equal(r2(calc(q.a, q.op, q.answer)), r2(q.c), 'hole b: ' + q.text);
        return q.answer;
      }
      return r2(calc(q.a, q.op, q.b));
    case 'round': return Math.round(q.a / q.b) * q.b;
    case '%': return q.a * q.b / 100;
    case 'fmax': return q.items.reduce((m, x) => (fr(x).n * fr(m).d > fr(m).n * fr(x).d ? x : m));
    case 'fof': { const f = fr(q.a); return f.n * q.b / f.d; }
    case 'feq': return fr(q.a).n * q.b;
    case 'fx': { const f = fr(q.a); return f.n * q.b / f.d; }
    case 'f+': case 'f-': {
      const x = fr(q.a), y = fr(q.b), D = x.d * y.d, N = q.op === 'f+' ? x.n * y.d + y.n * x.d : x.n * y.d - y.n * x.d;
      return { n: N, d: D };
    }
    case 'f*f': { const x = fr(q.a), y = fr(q.b); return { n: x.n * y.n, d: x.d * y.d }; }
    default: throw new Error('unknown op ' + q.op);
  }
}

test('engine: grade and level helpers', () => {
  assert.equal(E.gradeOfLevel(1), 1); assert.equal(E.gradeOfLevel(2), 1); assert.equal(E.gradeOfLevel(3), 2); assert.equal(E.gradeOfLevel(12), 6);
  assert.equal(E.levelOfGrade(1), 1); assert.equal(E.levelOfGrade(1, 2), 2); assert.equal(E.levelOfGrade(5, 1), 9); assert.equal(E.levelOfGrade(6, 2), 12);
  assert.deepEqual(E.skillsForGrade(1).sort(), ['huecos', 'mental', 'multiplicar', 'resta', 'suma']);
  assert.ok(E.skillsForGrade(6).includes('porcentajes') && !E.skillsForGrade(4).includes('porcentajes'));
});

test('engine: every skill and level yields valid, correct questions', () => {
  for (const sk of E.SKILLS) {
    for (let L = 1; L <= 12; L++) {
      const rnd = E.mulberry32(1000 + L * 17 + sk.id.length);
      for (let i = 0; i < 200; i++) {
        const q = E.gen(sk.id, L, rnd);
        const tag = `${sk.id} L${L} "${q.text}"`;
        assert.equal(q.skill, sk.id);
        assert.ok(q.key && typeof q.key === 'string', tag + ' key');
        assert.ok(q.level >= E.minLevel(sk.id) && q.level <= 12, tag + ' level');
        assert.ok(['int', 'dec', 'choice'].includes(q.kind), tag + ' kind');
        assert.ok(q.hint.es && q.hint.en && q.explain.es && q.explain.en, tag + ' hint/explain');
        assert.ok(!/[—–]/.test(q.hint.es + q.explain.es + q.text), tag + ' dash');
        // independent recomputation
        const exp = expected(q);
        if (typeof q.answer === 'string') {
          assert.ok(typeof exp === 'string' ? q.answer === exp : sameFr(q.answer, exp.n + '/' + exp.d), tag + ' fraction answer');
          if (typeof exp !== 'string' && fr(q.a).d !== fr(q.b).d) { const g = gcd(exp.n, exp.d); assert.equal(q.answer, `${exp.n / g}/${exp.d / g}`, tag + ' reduced'); }
        } else {
          assert.equal(r2(q.answer), r2(exp), tag + ' answer ' + q.answer + ' vs ' + exp);
        }
        // kind consistency
        if (q.kind === 'int') assert.ok(Number.isInteger(q.answer), tag + ' int');
        if (q.kind === 'dec') assert.ok(!Number.isInteger(q.answer) && r2(q.answer) === q.answer, tag + ' dec');
        if (q.kind === 'choice') {
          assert.equal(q.choices.length, 4, tag + ' 4 choices');
          assert.equal(new Set(q.choices.map(String)).size, 4, tag + ' distinct choices');
          assert.ok(q.choices.map(String).includes(String(q.answer)), tag + ' answer in choices');
          if (typeof q.answer === 'string') q.choices.filter(c => c !== q.answer).forEach(c => assert.ok(!sameFr(c, q.answer), tag + ' distractor equals answer by value ' + c));
          else q.choices.filter(c => c !== q.answer).forEach(c => assert.ok(Number(c) >= 0 && r2(c) !== r2(q.answer), tag + ' bad distractor'));
        }
        // no negatives (the engine never produces them at any grade)
        if (typeof q.answer === 'number') assert.ok(q.answer >= 0, tag + ' negative answer');
        for (const v of [q.a, q.b, q.c]) if (typeof v === 'number') assert.ok(v >= 0, tag + ' negative operand');
        assert.ok(E.check(q, q.answer), tag + ' check own answer');
        assert.ok(!E.check(q, typeof q.answer === 'string' ? '9/99' : q.answer + 1), tag + ' check wrong answer');
      }
    }
  }
});

test('engine: operand size is non-decreasing across grades for add, sub and mul', () => {
  for (const id of ['suma', 'resta', 'multiplicar']) {
    let prev = 0;
    for (let g = 1; g <= 6; g++) {
      const rnd = E.mulberry32(77 + g);
      let max = 0;
      for (const L of [2 * g - 1, 2 * g]) for (let i = 0; i < 400; i++) { const q = E.gen(id, L, rnd); max = Math.max(max, ndig(q.a), ndig(q.b)); }
      assert.ok(max >= prev, `${id} grade ${g}: max digits ${max} < previous ${prev}`);
      prev = max;
    }
  }
  // grade 1 stays tiny, grade 6 gets big
  const r = E.mulberry32(5);
  for (let i = 0; i < 300; i++) { const q = E.gen('suma', 2, r); assert.ok(q.a + q.b <= 99 && ((q.a % 10) + (q.b % 10)) < 10, 'grade 1 add without carry ' + q.text); }
  for (let i = 0; i < 300; i++) { const q = E.gen('suma', 1, r); assert.ok(q.a + q.b <= 20, 'level 1 add to 20'); }
});

test('engine: anti-repeat never repeats while the space allows it', () => {
  // big space: 400 questions, zero duplicates and zero repeat flags
  for (const [skill, L] of [['multiplicar', 9], ['suma', 6], ['resta', 8], ['mental', 7], ['dividir', 7]]) {
    const rnd = E.mulberry32(42), seen = new Set(); let repeats = 0;
    for (let i = 0; i < 400; i++) { const q = E.makeUniqueQuestion(skill, L, rnd, seen); if (q.repeat) repeats++; else assert.ok(!seen.has(q.key), `${skill} duplicate ${q.key}`); seen.add(q.key); }
    assert.equal(repeats, 0, `${skill} L${L} repeats`);
  }
  // small space (level 1 add to 20): no duplicates until the real space (levels 0..2 together) is exhausted
  const spaceOf = (skill, levels) => { const rnd = E.mulberry32(9), s = new Set(); for (let i = 0; i < 40000; i++) for (const L of levels) s.add(E.gen(skill, L, rnd).key); return s.size; };
  const space = spaceOf('porcentajes', [9, 10]);
  assert.ok(space < 400, 'small space expected, got ' + space);
  const rnd = E.mulberry32(3), seen = new Set(); let firstRepeat = -1;
  for (let i = 0; i < 400; i++) { const q = E.makeUniqueQuestion('porcentajes', 9, rnd, seen); if (q.repeat && firstRepeat < 0) firstRepeat = i; if (!q.repeat) assert.ok(!seen.has(q.key)); seen.add(q.key); }
  assert.ok(firstRepeat > 0, 'the space is smaller than 400, so the flagged fallback must appear');
  assert.ok(seen.size >= Math.floor(space * 0.8), `distinct questions ${seen.size} vs space ${space}`);
  assert.ok(firstRepeat >= Math.floor(space * 0.8), 'first repeat too early: ' + firstRepeat + ' of ' + space);
  // the fallback is flagged
  const full = new Set(); const rr = E.mulberry32(1); for (let i = 0; i < 40000; i++) { full.add(E.gen('porcentajes', 9, rr).key); full.add(E.gen('porcentajes', 8, rr).key); full.add(E.gen('porcentajes', 10, rr).key); }
  const q = E.makeUniqueQuestion('porcentajes', 9, E.mulberry32(2), full);
  assert.equal(q.repeat, true);
});

test('engine: SeenStore is a 600 key ring buffer that survives serialise and restore', () => {
  const mem = new Map();
  const storage = { getItem: k => mem.has(k) ? mem.get(k) : null, setItem: (k, v) => { mem.set(k, String(v)); } };
  const s = E.SeenStore(storage, 'u1_p2');
  for (let i = 0; i < 700; i++) s.add('k' + i);
  assert.equal(s.size(), 600);
  assert.equal(s.has('k0'), false); assert.equal(s.has('k99'), false); assert.equal(s.has('k100'), true); assert.equal(s.has('k699'), true);
  assert.ok(mem.has('calc_seen_u1_p2'));
  const s2 = E.SeenStore(storage, 'u1_p2');
  assert.equal(s2.size(), 600); assert.equal(s2.has('k100'), true); assert.equal(s2.has('k50'), false);
  s2.add('k100'); // re-adding refreshes, does not grow
  assert.equal(s2.size(), 600);
  assert.equal(E.SeenStore(storage, 'other').size(), 0);
  s2.clear(); assert.equal(E.SeenStore(storage, 'u1_p2').size(), 0);
  mem.set('calc_seen_bad', '{not json'); assert.equal(E.SeenStore(storage, 'bad').size(), 0);
  // a storage that throws must not break anything
  const broken = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
  const b = E.SeenStore(broken, 'z'); b.add('a'); assert.equal(b.has('a'), true);
});

test('engine: adaptive update raises, lowers, and respects clamp and window', () => {
  const base = { lvl: 5, n: 0, right: 0, ema: 0.5, wrong: 0, floor: 3, ceil: 7 };
  const t = E.targetSeconds(5, 'suma');
  const fast = E.update(base, { correct: true, seconds: t * 0.3, level: 5, skill: 'suma' });
  const ok = E.update(base, { correct: true, seconds: t * 0.9, level: 5, skill: 'suma' });
  const slow = E.update(base, { correct: true, seconds: t * 2, level: 5, skill: 'suma' });
  const hint = E.update(base, { correct: true, seconds: t * 0.3, hintUsed: true, level: 5, skill: 'suma' });
  assert.ok(Math.abs(fast.lvl - 5.5) < 1e-9 && Math.abs(ok.lvl - 5.35) < 1e-9 && Math.abs(slow.lvl - 5.15) < 1e-9);
  assert.ok(hint.lvl <= 5.1 + 1e-9);
  const w1 = E.update(base, { correct: false, seconds: 5, level: 5, skill: 'suma' });
  assert.ok(Math.abs(w1.lvl - 4.4) < 1e-9);
  const w2 = E.update(w1, { correct: false, seconds: 5, level: 5, skill: 'suma' });
  assert.ok(Math.abs(w2.lvl - 3.5) < 1e-9, 'second wrong in a row drops 0.9');
  assert.equal(base.lvl, 5, 'update must not mutate');
  assert.ok(w1.ema < base.ema && fast.ema > base.ema);
  assert.equal(fast.n, 1); assert.equal(fast.right, 1); assert.equal(w1.right, 0);
  // window and global clamp
  let s = base; for (let i = 0; i < 40; i++) s = E.update(s, { correct: true, seconds: 1, level: 5, skill: 'suma' });
  assert.equal(s.lvl, 7);
  for (let i = 0; i < 40; i++) s = E.update(s, { correct: false, seconds: 1, level: 5, skill: 'suma' });
  assert.equal(s.lvl, 3);
  let g = { lvl: 11.9, n: 0, right: 0, ema: .5, floor: 1, ceil: 12 }; for (let i = 0; i < 5; i++) g = E.update(g, { correct: true, seconds: 1, level: 12 });
  assert.equal(g.lvl, 12);
  let h = { lvl: 1.2, n: 0, right: 0, ema: .5, floor: 1, ceil: 12 }; for (let i = 0; i < 5; i++) h = E.update(h, { correct: false, seconds: 1, level: 1 });
  assert.equal(h.lvl, 1);
  // default window for a grade
  const st = E.newSkillState(5, 'suma'); assert.deepEqual([st.floor, st.ceil, st.lvl], [7, 11, 9]);
  const g1 = E.newSkillState(1, 'suma'); assert.deepEqual([g1.floor, g1.ceil], [1, 3]);
  // nextLevel distribution and window
  const rnd = E.mulberry32(8), counts = {}; const s5 = { lvl: 5.2, floor: 3, ceil: 7 };
  for (let i = 0; i < 4000; i++) { const l = E.nextLevel(s5, rnd); counts[l] = (counts[l] || 0) + 1; }
  assert.ok(counts[5] > 2600 && counts[5] < 3000 && counts[4] > 400 && counts[6] > 400 && !counts[3] && !counts[7]);
  for (let i = 0; i < 200; i++) assert.ok(E.nextLevel({ lvl: 7, floor: 3, ceil: 7 }, rnd) <= 7);
});

test('engine: pickSkill favours weaker skills', () => {
  const rnd = E.mulberry32(21), stats = { suma: { ema: 0.9 }, resta: { ema: 0.2 }, mental: { ema: 0.8 } };
  const c = { suma: 0, resta: 0, mental: 0 };
  for (let i = 0; i < 3000; i++) c[E.pickSkill(['suma', 'resta', 'mental'], stats, rnd)]++;
  assert.ok(c.resta > 0.6 * 3000 && c.suma > 100 && c.mental > 100, JSON.stringify(c));
  assert.equal(E.pickSkill(['suma'], {}, rnd), 'suma');
});

test('engine: parseAnswer and check accept comma and dot', () => {
  assert.equal(E.parseAnswer('3,5'), 3.5); assert.equal(E.parseAnswer('3.5'), 3.5); assert.ok(Number.isNaN(E.parseAnswer('abc'))); assert.ok(Number.isNaN(E.parseAnswer('')));
  const q = { kind: 'dec', answer: 2.71 };
  assert.ok(E.check(q, '2,71')); assert.ok(E.check(q, '2.710')); assert.ok(!E.check(q, '2,7'));
  assert.ok(E.check({ kind: 'choice', answer: '3/4' }, '3/4')); assert.ok(!E.check({ kind: 'choice', answer: '3/4' }, '6/8'));
});

// ---- placement ----
function simulate(grade, behaviour, seed) {
  const rnd = E.mulberry32(seed), p = E.Placement.start({ grade, rnd }), keys = new Set();
  let n = 0;
  while (!p.done) {
    const q = p.next(); assert.ok(q); assert.ok(!keys.has(q.key), 'placement repeat ' + q.key); keys.add(q.key);
    assert.equal(p.next(), q, 'next() is idempotent until answered');
    p.answer(behaviour(q, rnd)); n++;
  }
  return { n, res: p.result() };
}

test('placement: strong child ends above the start, weak child below, 15-24 questions, no repeats', () => {
  const strong = () => ({ correct: true, seconds: 2 });
  const weak = () => ({ correct: false, seconds: 30 });
  for (const grade of [1, 2, 3, 4, 5, 6]) {
    for (const seed of [1, 2, 3]) {
      const s = simulate(grade, strong, seed), w = simulate(grade, weak, seed + 100);
      assert.ok(s.n >= 15 && s.n <= 24, `grade ${grade} strong questions ${s.n}`);
      assert.ok(w.n >= 15 && w.n <= 24, `grade ${grade} weak questions ${w.n}`);
      const start = E.levelOfGrade(grade, 1);
      if (grade < 6) assert.ok(s.res.avgLevel >= start + 1.5, `grade ${grade} strong avg ${s.res.avgLevel} start ${start}`);
      else assert.ok(s.res.avgLevel >= 11);
      for (const x of s.res.summary) assert.ok(x.level >= Math.min(12, Math.max(start, E.minLevel(x.skill))), 'strong never below start');
      if (grade > 1) assert.ok(w.res.avgLevel <= start - 1, `grade ${grade} weak avg ${w.res.avgLevel} start ${start}`);
      for (const x of w.res.summary) assert.ok(x.level >= E.minLevel(x.skill) && x.level >= 1);
      assert.ok(s.res.avgLevel > w.res.avgLevel);
    }
  }
  const r = simulate(4, strong, 1).res;
  assert.ok(r.skills.suma && r.skills.suma.grade >= 1 && Array.isArray(r.summary) && r.startGrade === 4);
  assert.ok(Object.keys(simulate(2, strong, 1).res.skills).length <= 6);
  assert.ok(Object.keys(simulate(5, strong, 1).res.skills).length <= 8);
});

test('placement: a mixed child lands in between and is slower-aware', () => {
  const slow = () => ({ correct: true, seconds: 200 });
  const s = simulate(3, slow, 4);
  const start = E.levelOfGrade(3, 1);
  assert.ok(Math.abs(s.res.avgLevel - start) <= 1, 'slow correct stays near start: ' + s.res.avgLevel);
  // respects the seen store and skills filter
  const store = E.SeenStore({ getItem: () => null, setItem: () => {} }, 'x');
  const p = E.Placement.start({ grade: 3, skills: ['suma', 'resta', 'fracciones'], rnd: E.mulberry32(1), seen: store });
  assert.equal(p.total, 9);
  const p2 = E.Placement.start({ grade: 1, skills: ['suma', 'fracciones'], rnd: E.mulberry32(1) });
  assert.equal(p2.total, 3, 'skills above the grade are dropped');
});
