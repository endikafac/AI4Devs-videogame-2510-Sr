// Learn-first, round 2: memory, typingMaster, englishVerbs, tableMaster and vocabMaster.
// Pure logic only (no browser): shuffles vary, the key-finger map is complete, the explanation texts exist in all six languages.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const root = path.resolve(import.meta.dirname, '../..');
const require = createRequire(import.meta.url);
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const sameKeys = (dicts, label) => {
  const names = Object.keys(dicts), base = new Set(Object.keys(dicts[names[0]]));
  for (const n of names) {
    const ks = new Set(Object.keys(dicts[n]));
    assert.deepEqual([...base].filter(k => !ks.has(k)), [], `${label}: ${n} lacks keys`);
    assert.deepEqual([...ks].filter(k => !base.has(k)), [], `${label}: ${n} has extra keys`);
  }
};
const noEmpty = (dict, label) => {
  for (const [k, v] of Object.entries(dict)) if (typeof v === 'string') assert.ok(v.trim().length > 1, `${label}.${k} is empty`);
};
const placeholders = s => (String(s).match(/\{[a-z0-9]+\}/gi) || []).sort().join(',');
const seeded = seed => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

// ───────────────────────── memory ─────────────────────────
test('U-LF2-MEMORY: texts exist in six languages, names match the pools, decks rotate and shuffle', () => {
  const ML = require(path.join(root, 'memory-EFC/learn.js'));
  const M = require(path.join(root, 'memory-EFC/game.js'));
  assert.deepEqual(Object.keys(ML.UI).sort(), ['ca', 'en', 'es', 'eu', 'fr', 'gl']);
  sameKeys(ML.UI, 'memory UI');
  for (const l of Object.keys(ML.UI)) {
    noEmpty(ML.UI[l], 'memory UI ' + l);
    for (const k of Object.keys(ML.UI.es)) assert.equal(placeholders(ML.UI[l][k]), placeholders(ML.UI.es[k]), `${l}.${k} placeholders differ`);
  }
  for (const theme of ['emoji', 'animals']) {
    const pool = M.THEMES.find(t => t.id === theme).pool;
    for (const l of Object.keys(ML.UI)) {
      assert.equal(ML.NAMES[theme][l].length, pool.length, `${theme}/${l} names`);
      ML.NAMES[theme][l].forEach(n => assert.ok(n.trim(), `${theme}/${l} empty name`));
    }
  }
  for (const l of Object.keys(ML.UI)) {
    assert.equal(ML.NUM_WORDS[l].length, 10);
    // every card of every theme has a name, and the "why not" line names both cards
    for (const th of M.THEMES) {
      const deck = M.makeDeck(th.id, 4, seeded(7), 0);
      for (const c of deck) assert.ok(ML.cardName(th.id, c, l, th.pool).trim().length > 0);
      const a = deck[0], b = deck.find(c => c.pair !== a.pair);
      const why = ML.whyNot(th.id, a, b, l, th.pool);
      assert.ok(why.includes(ML.cardName(th.id, a, l, th.pool)) && why.includes(ML.cardName(th.id, b, l, th.pool)), `${th.id}/${l} why-not lacks card names`);
      assert.ok(!/[{}]/.test(why), 'unfilled placeholder: ' + why);
    }
  }
  // rotation: consecutive games of the same theme start at different items and eventually cover the pool
  for (const th of M.THEMES) {
    const seen = new Set(), firsts = [];
    for (let rot = 0; rot < 8; rot++) {
      const items = ML.pickItems(th.pool, 4, rot, seeded(rot + 1));
      assert.equal(items.length, 4); assert.equal(new Set(items).size, 4, 'duplicates in a deck');
      items.forEach(i => seen.add(i)); firsts.push(items.slice().sort().join());
    }
    assert.ok(new Set(firsts).size > 1, th.id + ': rotation never changes the items');
    assert.ok(seen.size >= Math.min(th.pool.length, 8), th.id + ': rotation covers too little of the pool');
  }
  // shuffling: the same pairs do not always come out in the same order
  const orders = new Set();
  for (let i = 0; i < 20; i++) orders.add(M.makeDeck('letters', 6, seeded(i * 31 + 5), 0).map(c => c.text).join(''));
  assert.ok(orders.size > 10, 'deck order is not shuffled');
  const randomOrders = new Set();
  for (let i = 0; i < 20; i++) randomOrders.add(M.makeDeck('emoji', 6).map(c => c.text).join(''));
  assert.ok(randomOrders.size > 1);
  // guided round: 3 pairs, every card has a partner and the hint finds it
  const g = M.makeDeck('numbers', 3, Math.random, 2);
  assert.equal(g.length, 6);
  g.forEach((c, i) => { const h = ML.findHint(g, i); assert.notEqual(h, -1); assert.equal(g[h].pair, c.pair); assert.notEqual(h, i); });
  assert.equal(ML.findHint(g, 99), -1);
});

// ───────────────────────── typingMaster ─────────────────────────
test('U-LF2-TYPING: the key-finger map is complete and the finger explanations exist in six languages', () => {
  const TL = require(path.join(root, 'typingMaster-EFC/lesson.js'));
  const allKeys = TL.KEYBOARD_ROWS.flat();
  for (const k of allKeys) assert.ok(Number.isInteger(TL.FINGER_MAP[k]) && TL.FINGER_MAP[k] >= 0 && TL.FINGER_MAP[k] <= 8, 'no finger for key ' + JSON.stringify(k));
  assert.equal(TL.FINGER_COLORS.length, 9);
  for (const g of TL.LESSON_GROUPS) {
    assert.ok(g.keys.length >= 5);
    for (const k of g.keys.concat(g.drill)) assert.ok(allKeys.includes(k) && k in TL.FINGER_MAP, `${g.id}: key ${k} is not on the keyboard`);
    assert.equal(g.drill.length, 5, g.id + ' drill must be 5 keys');
    for (const k of g.drill) assert.ok(g.keys.includes(k), `${g.id}: drill key ${k} not in the group`);
  }
  // every home-row key of level 1 and every letter of the first texts has a finger
  const ctx = vm.createContext({});
  vm.runInContext(read('typingMaster-EFC/texts.js') + '\nthis.__T = TYPING_TEXTS;', ctx);
  const lvl1 = ctx.__T[1].all.join('');
  for (const ch of new Set(lvl1)) assert.ok(TL.fingerOf(ch) >= 0, 'level 1 char without finger: ' + ch);
  for (const lvl of [2, 3]) for (const t of (ctx.__T[lvl]['es-ES'] || [])) for (const ch of t.toLowerCase()) if (/[a-zñ ]/.test(ch)) assert.ok(TL.fingerOf(ch) >= 0, 'level ' + lvl + ' char without finger: ' + ch);
  assert.equal(TL.fingerOf('Q'), 0); assert.equal(TL.fingerOf('é'), -1);
  // six languages, same keys, finger names for the nine fingers
  assert.deepEqual(Object.keys(TL.LESSON_I18N).sort(), [...TL.LANGS].sort());
  sameKeys(TL.LESSON_I18N, 'typing lesson');
  for (const l of TL.LANGS) {
    noEmpty(TL.LESSON_I18N[l], 'typing ' + l);
    assert.equal(TL.FINGER_NAMES[l].length, 9);
    assert.equal(new Set(TL.FINGER_NAMES[l]).size, 9, l + ' finger names must be distinct');
    TL.FINGER_NAMES[l].forEach(n => assert.ok(n.trim().length > 1));
    for (const k of Object.keys(TL.LESSON_I18N['es-ES'])) assert.equal(placeholders(TL.LESSON_I18N[l][k]), placeholders(TL.LESSON_I18N['es-ES'][k]), `${l}.${k} placeholders differ`);
    for (const key of allKeys) {
      const msg = TL.explainWrong(l, key, key === 'a' ? 's' : 'a');
      assert.ok(msg.includes(TL.fingerName(l, TL.FINGER_MAP[key])), `${l}: explanation for ${key} lacks the finger`);
      assert.ok(!/[{}]/.test(msg), 'unfilled placeholder: ' + msg);
    }
  }
  assert.match(TL.explainWrong('es-ES', 's', 'd'), /anular izquierdo/);
  assert.equal(TL.explainWrong('es-ES', '!', 'a'), '');
  // lessons are offered once per group and in the right level
  const none = () => false;
  assert.equal(TL.lessonForLevel(1, none).id, 'home');
  assert.equal(TL.lessonForLevel(2, none).id, 'letters');
  assert.equal(TL.lessonForLevel(5, none).id, 'numbers');
  assert.equal(TL.lessonForLevel(3, none), null);
  assert.equal(TL.lessonForLevel(1, id => id === 'home'), null);
  assert.equal(TL.groupForLevel(3).id, 'letters'); assert.equal(TL.groupForLevel(9).id, 'numbers');
});

test('U-LF2-TYPING: the 5-key drill repeats every key, never twice in a row, in changing orders', () => {
  const TL = require(path.join(root, 'typingMaster-EFC/lesson.js'));
  const orders = new Set();
  for (const g of TL.LESSON_GROUPS) for (let i = 0; i < 40; i++) {
    const seq = TL.drillSequence(g, seeded(i * 13 + 3));
    assert.equal(seq.length, 10);
    for (const k of g.drill) assert.equal(seq.filter(x => x === k).length, 2);
    seq.forEach((k, j) => { if (j) assert.notEqual(k, seq[j - 1]); });
    if (g.id === 'home') orders.add(seq.join(''));
  }
  assert.ok(orders.size > 5, 'drill order never changes');
});

// ───────────────────────── englishVerbs ─────────────────────────
test('U-LF2-VERBS: the regular/irregular card is consistent with the data and translated into six languages', () => {
  const EL = require(path.join(root, 'englishVerbs-EFC/learn.js'));
  const ctx = vm.createContext({});
  vm.runInContext(read('englishVerbs-EFC/data.js') + '\nthis.__V = IRREGULAR_VERBS;', ctx);
  const verbs = ctx.__V;
  assert.equal(EL.EXAMPLES.length, 3);
  assert.deepEqual(EL.EXAMPLES.slice(0, 2).map(e => [e.v, e.past]), [['play', 'played'], ['go', 'went']]);
  for (const ex of EL.EXAMPLES) {
    if (ex.regular) assert.ok(!verbs.find(v => v.infinitive === ex.v), ex.v + ' is regular but listed as irregular');
    else { const v = verbs.find(x => x.infinitive === ex.v); assert.ok(v, ex.v + ' missing'); assert.equal(v.past_simple, ex.past); assert.equal(v.past_participle, ex.part); }
    for (const f of ['base', 'past', 'part']) assert.ok(ex.uses[f].includes(f === 'base' ? ex.v : ex[f]), `${ex.v}: ${f} sentence lacks the form`);
  }
  assert.equal(EL.TRY_QUESTIONS.length, 3);
  assert.deepEqual(Object.keys(EL.I18N).sort(), ['ca', 'en', 'es', 'eu', 'fr', 'gl']);
  sameKeys(EL.I18N, 'verbs lesson');
  for (const l of Object.keys(EL.I18N)) {
    noEmpty(EL.I18N[l], 'verbs ' + l);
    for (const k of Object.keys(EL.I18N.es)) assert.equal(placeholders(EL.I18N[l][k]), placeholders(EL.I18N.es[k]), `${l}.${k} placeholders differ`);
  }
  for (const q of EL.TRY_QUESTIONS) {
    const ans = EL.answerOf(q);
    assert.ok(q.options.includes(ans)); assert.equal(new Set(q.options).size, q.options.length);
    if (!q.regular) { const v = verbs.find(x => x.infinitive === q.v); assert.equal(v.past_simple, q.past); assert.equal(v.past_participle, q.part); }
    assert.equal(EL.shuffledOptions(q, seeded(4)).length, q.options.length);
    for (const wrong of q.options.filter(o => o !== ans)) {
      const why = EL.whyWrong(q, wrong);
      for (const l of Object.keys(EL.I18N)) {
        assert.ok(EL.I18N[l][why.key], `${l} lacks ${why.key}`);
        const text = EL.fill(EL.I18N[l][why.key], why.vars);
        assert.ok(!/[{}]/.test(text), 'unfilled placeholder: ' + text);
        assert.ok(text.includes(q.past) || text.includes(q.part), `explanation for ${q.v}/${wrong} shows no correct form`);
      }
    }
  }
  // merged into the game dictionary
  const c2 = vm.createContext({});
  vm.runInContext(read('englishVerbs-EFC/i18n.js') + '\n' + read('englishVerbs-EFC/learn.js') + '\nthis.__D = EV_I18N;', c2);
  for (const l of ['es', 'en', 'eu', 'gl', 'ca', 'fr']) for (const k of Object.keys(EL.I18N.es)) assert.ok(c2.__D[l][k], `EV_I18N.${l}.${k} not merged`);
});

// ───────────────────────── tableMaster ─────────────────────────
const evalChain = s => s.split(' = ').map(part => Function('return (' + part.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-') + ')')());
test('U-LF2-TABLES: the worked step is correct for every fact and explains in six languages', () => {
  const TL = require(path.join(root, 'tableMaster-EFC/learn.js'));
  assert.equal(TL.workedStep(7, 6), '7 × 6 = 7 × 5 + 7 = 35 + 7 = 42');
  for (let a = 1; a <= 10; a++) for (let b = 1; b <= 10; b++) {
    const step = TL.workedStep(a, b), values = evalChain(step);
    assert.ok(step.startsWith(`${a} × ${b} =`), `${a}x${b}: ${step}`);
    for (const v of values) assert.equal(v, a * b, `${a}x${b} step is wrong: ${step}`);
    assert.ok(step.endsWith('= ' + a * b));
  }
  assert.equal(TL.workedStep('x', 3), '');
  // explanation kinds
  assert.deepEqual(TL.explainWrong({ kind: 'mul', a: 7, b: 6 }), { key: null, params: {}, worked: '7 × 6 = 7 × 5 + 7 = 35 + 7 = 42' });
  const div = TL.explainWrong({ kind: 'div', a: 6, b: 7 }); assert.equal(div.key, 'drillWhyDiv'); assert.deepEqual(div.params, { p: 42, a: 6, b: 7 });
  const miss = TL.explainWrong({ kind: 'missing', k: 6, x: 7 }); assert.equal(miss.key, 'drillWhyMissing'); assert.equal(miss.params.p, 42);
  assert.equal(TL.explainWrong(null).worked, '');
  // learn links
  assert.equal(TL.learnTarget('table', '7').screen, 'screen-learn-multiply'); assert.equal(TL.learnTarget('table', '7').slide, 5);
  assert.equal(TL.learnTarget('divide', '7').screen, 'screen-learn-divide');
  assert.equal(TL.learnTarget('mixed', 'all').slide, 0);
  assert.equal(TL.isNewTable({}, 'table', 7), true); assert.equal(TL.isNewTable({ 'table:7': 2 }, 'table', 7), false);
  assert.equal(TL.shouldSuggestLearn({ 7: 1 }, 7), false); assert.equal(TL.shouldSuggestLearn({ 7: 2 }, 7), true); assert.equal(TL.shouldSuggestLearn({}, 7), false);
  assert.equal(TL.isSafeRich('A <strong>b</strong> <span class="tm-carry-hl">c</span><br>'), true);
  assert.equal(TL.isSafeRich('<img src=x onerror=alert(1)>'), false);
  assert.equal(TL.isSafeRich('<span style="color:red">x</span>'), false);
  assert.equal(TL.isSafeRich('<span class="evil">x</span>'), false);
});

test('U-LF2-TABLES: the learn screens are fully translated (same keys, safe rich text, every html key exists)', () => {
  const TL = require(path.join(root, 'tableMaster-EFC/learn.js'));
  const ctx = vm.createContext({ document: { addEventListener() {} }, console });
  vm.runInContext(read('tableMaster-EFC/i18n.js') + '\n' + read('tableMaster-EFC/i18n-learn.js') + '\nthis.__I = TableMasterI18n; this.__L = TableMasterLearnI18n;', ctx);
  const I = ctx.__I, L = ctx.__L, langs = ['es-ES', 'en-US', 'eu-ES', 'gl-ES', 'ca-ES', 'fr-FR'];
  assert.deepEqual(Object.keys(L).sort(), [...langs].sort());
  sameKeys(L, 'tableMaster learn');
  const html = read('tableMaster-EFC/index.html');
  const used = new Set();
  for (const m of html.matchAll(/data-i18n(?:-rich|-aria|-title)?="([^"]+)"/g)) used.add(m[1]);
  assert.ok(used.size > 150, 'expected the learn screens to be driven by i18n keys, got ' + used.size);
  for (const l of langs) {
    noEmpty(L[l], 'tableMaster ' + l);
    for (const k of used) assert.ok(typeof I.translations[l][k] === 'string' && I.translations[l][k].trim(), `${l} lacks i18n key ${k}`);
    for (const k of Object.keys(L['es-ES'])) {
      assert.equal(placeholders(L[l][k]), placeholders(L['es-ES'][k]), `${l}.${k} placeholders differ`);
      assert.ok(TL.isSafeRich(L[l][k]), `${l}.${k} uses markup outside the safe subset: ${L[l][k]}`);
    }
  }
  // the six non-Spanish languages really are translated (not copies of the Spanish text) for the long sentences
  const long = Object.keys(L['es-ES']).filter(k => L['es-ES'][k].length > 40);
  for (const l of langs.slice(1)) { const same = long.filter(k => L[l][k] === L['es-ES'][k]); assert.ok(same.length <= (l === 'gl-ES' ? 8 : 0), `${l} has untranslated long strings: ${same}`); }
  // the worked-example keys needed by game.js exist in all languages
  for (const k of ['demoCalc', 'demoWrite', 'demoWriteCarry', 'demoCarryIn', 'demoFinalCarry', 'demoNoFit', 'demoFit', 'demoDivRes', 'demoDivResRem', 'drillWhy', 'drillWhyDiv', 'drillWhyMissing', 'learnBtn', 'learnBtnTable', 'learnNewTable', 'learnStruggle', 'dcYes', 'dcNo'])
    for (const l of langs) assert.ok(I.translations[l][k], `${l} lacks ${k}`);
  assert.equal(I.translations['es-ES'].drillWhyDiv.includes('{p} ÷ {a} = {b}'), true);
});

// ───────────────────────── vocabMaster ─────────────────────────
test('U-LF2-VOCAB: study cards, guided check and feedback texts work in six languages', () => {
  const VL = require(path.join(root, 'vocabMaster-EFC/learn.js'));
  const langs = ['es', 'en', 'eu', 'gl', 'ca', 'fr'];
  assert.deepEqual(Object.keys(VL.NEW_KEYS).sort(), [...langs].sort());
  const newKeys = Object.keys(VL.NEW_KEYS.es);
  for (const l of langs) for (const k of newKeys) {
    assert.ok(typeof VL.NEW_KEYS[l][k] === 'string' && VL.NEW_KEYS[l][k].trim().length > 1, `${l}.${k} missing or empty`);
    assert.equal(placeholders(VL.NEW_KEYS[l][k]), placeholders(VL.NEW_KEYS.es[k]), `${l}.${k} placeholders differ`);
  }
  // gl, ca and fr carry the complete UI (the base game only had es, en and eu)
  const game = read('vocabMaster-EFC/game.js');
  const esBlock = game.slice(game.indexOf('es: {'), game.indexOf('en: {'));
  const baseKeys = [...esBlock.matchAll(/(?:^|[\s,{])([a-zA-Z]+):\s*['(]/g)].map(m => m[1]).filter((k, i, a) => a.indexOf(k) === i);
  assert.ok(baseKeys.length > 20);
  for (const l of ['gl', 'ca', 'fr']) for (const k of baseKeys) assert.ok(k in VL.NEW_KEYS[l], `${l} lacks base key ${k}`);
  assert.equal(VL.NEW_KEYS.fr.score(7, 10).includes('7'), true);
  assert.ok(!/bad:\s*'(Era|It was|Hau zen)/.test(game), 'the old "Era: X" feedback key is still there');
  // data: every pack word has an example sentence, so the feedback can always show one
  const dir = path.join(root, 'vocabMaster-EFC/vocab');
  const idx = JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8'));
  const pack = JSON.parse(fs.readFileSync(path.join(dir, idx.packs[0].file), 'utf8'));
  const words = pack.words.map(a => ({ w: a[0], t: a[1], i: a[2], e: a[3] }));
  // study words come from the new words of the round only, at most 5
  const queue = words.slice(0, 8).map((w, i) => ({ w, isNew: i % 2 === 0 }));
  const study = VL.pickStudyWords(queue);
  assert.ok(study.length > 0 && study.length <= 5); assert.ok(study.every(w => queue.find(q => q.w === w).isNew));
  assert.deepEqual(VL.pickStudyWords(queue.map(q => ({ ...q, isNew: false }))), []);
  // guided check: 3 questions, the answer is among 4 distinct options, the last one asks the other direction
  const qs = VL.buildCheck(words.slice(0, 5), words, 3, seeded(9));
  assert.equal(qs.length, 3);
  qs.forEach((q, i) => { assert.ok(q.options.includes(q.answer)); assert.equal(new Set(q.options.map(o => o[q.field])).size, q.options.length); assert.equal(q.back, i === 2); });
  assert.equal(VL.buildCheck([words[0]], words, 3).length, 1);
  assert.deepEqual(VL.buildCheck([], words), []);
  // feedback: correct word + meaning in the user language, why the chosen one is wrong, example sentence
  const w = words[0], other = words[1];
  for (const l of langs) {
    for (const [mode, chosen] of [['choice', other], ['back', other], ['type', 'dogg'], ['type', '']]) {
      const lines = VL.feedbackLines(w, mode, chosen);
      const text = lines.map(x => x.example ? x.example : VL.fill(VL.NEW_KEYS[l][x.key], x.vars)).join(' | ');
      assert.ok(text.includes(w.w) && text.includes(w.t), `${l}/${mode}: lacks the correct word`);
      assert.ok(text.includes(w.e), `${l}/${mode}: lacks the example sentence`);
      assert.ok(!/[{}]/.test(text), 'unfilled placeholder: ' + text);
      if (mode !== 'type') assert.ok(text.includes(other.t) || text.includes(other.w));
    }
  }
  assert.equal(VL.feedbackLines({ w: 'x', t: 'y', i: '', e: '' }, 'choice', null).length, 1);
});
