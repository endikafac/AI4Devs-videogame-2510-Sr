// VocabMaster: meanings and example sentences in every UI language (vocab/translations.json) + the pure helpers that use them.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = path.resolve(import.meta.dirname, '../..');
const require = createRequire(import.meta.url);
const dir = path.join(root, 'vocabMaster-EFC/vocab');
const idx = JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8'));
const tr = JSON.parse(fs.readFileSync(path.join(dir, 'translations.json'), 'utf8'));
const VL = require(path.join(root, 'vocabMaster-EFC/learn.js'));
const MEANING = ['eu', 'gl', 'ca', 'fr', 'en'];
const EXAMPLE = ['es', 'eu', 'gl', 'ca', 'fr'];
const bad = /[{}\[\]<>]|\bTODO\b|\bXXX\b|\?\?|lorem|\bundefined\b|\bnull\b|\u2014|\u2013/; // placeholders, markup, em or en dash
// Words that are legitimately written the same in a language as in English (shared Latin or international words, names, numbers)
const SAME = {
  fr: ['en-animals/lion', 'en-colors/orange', 'en-colors/triangle', 'en-colors/rectangle', 'en-food/orange', 'en-food/pizza', 'en-house/table', 'en-numbers/six', 'en-family/cousin', 'en-family/parents', 'en-school/question'],
  ca: ['en-colors/triangle', 'en-colors/rectangle', 'en-food/pizza'],
  eu: ['en-food/banana', 'en-food/pizza', 'en-house/sofa'],
  gl: ['en-food/pizza', 'en-food/chocolate'],
};

test('U-VOCAB-I18N: pack names exist in all six languages', () => {
  assert.equal(tr.version, 1);
  for (const p of idx.packs) {
    const names = { ...p.name, ...(tr.packs[p.id] || {}).name };
    for (const l of ['es', 'en', 'eu', 'gl', 'ca', 'fr']) {
      assert.ok(typeof names[l] === 'string' && names[l].trim().length > 1, `${p.id}: pack name ${l}`);
      assert.ok(!bad.test(names[l]), `${p.id}: pack name ${l} has a placeholder: ${names[l]}`);
    }
    // the three new languages are not a copy of the Spanish name when the word is not shared
    assert.ok(tr.packs[p.id].name.gl && tr.packs[p.id].name.ca && tr.packs[p.id].name.fr, p.id);
  }
  for (const l of ['gl', 'ca', 'fr']) assert.ok(tr.langs.en[l], `language name for ${l}`);
});

test('U-VOCAB-I18N: every word of every pack has all meanings and example translations', () => {
  let words = 0;
  for (const p of idx.packs) {
    const pack = JSON.parse(fs.readFileSync(path.join(dir, p.file), 'utf8'));
    const t = tr.words[p.id];
    assert.ok(t, `${p.id}: missing in translations`);
    assert.equal(Object.keys(t).length, pack.words.length, `${p.id}: word count differs`);
    for (const [en, , , sentence] of pack.words) {
      const w = t[en]; words++;
      assert.ok(w, `${p.id}/${en}: missing`);
      for (const l of MEANING) {
        const v = w.meaning[l];
        assert.ok(typeof v === 'string' && v.trim().length > 0, `${p.id}/${en}: meaning ${l} empty`);
        assert.ok(!bad.test(v), `${p.id}/${en}: meaning ${l} has a placeholder or dash: ${v}`);
        assert.equal(v, v.trim(), `${p.id}/${en}: meaning ${l} has stray spaces`);
        if (l === 'en') assert.notEqual(v.toLowerCase(), en.toLowerCase(), `${p.id}/${en}: the English gloss repeats the word`);
        else if (v.toLowerCase() === en.toLowerCase()) assert.ok((SAME[l] || []).includes(p.id + '/' + en), `${p.id}/${en}: ${l} meaning equals the English word`);
      }
      for (const l of EXAMPLE) {
        const v = w.example[l];
        assert.ok(typeof v === 'string' && v.trim().length > 3, `${p.id}/${en}: example ${l} empty`);
        assert.ok(!bad.test(v), `${p.id}/${en}: example ${l} has a placeholder or dash: ${v}`);
        assert.notEqual(v, sentence, `${p.id}/${en}: example ${l} is still the English sentence`);
        assert.match(v, /[.!?]$/, `${p.id}/${en}: example ${l} lacks final punctuation`);
      }
    }
  }
  assert.equal(words, 240);
});

test('U-VOCAB-I18N: no meaning clashes inside a pack (the quiz options stay distinct) per language', () => {
  for (const p of idx.packs) for (const l of ['eu', 'gl', 'ca', 'fr', 'en']) {
    const seen = new Map();
    for (const [en, w] of Object.entries(tr.words[p.id])) {
      const v = w.meaning[l].toLowerCase();
      if (seen.has(v)) {
        // the game filters equal options, so only the known homograph (fille) is tolerated
        assert.ok(p.id === 'en-family' && l === 'fr' && ['daughter', 'girl'].includes(en), `${p.id}: ${l} "${v}" for ${seen.get(v)} and ${en}`);
      }
      seen.set(v, en);
    }
  }
});

test('U-VOCAB-I18N: localizeWord picks the UI language and falls back to Spanish', () => {
  const raw = { w: 'dog', ts: 'perro', i: '🐶', e: 'The dog runs in the park.' };
  const tw = tr.words['en-animals'].dog;
  const l = lang => VL.localizeWord(raw, tw, lang);
  assert.equal(l('es').t, 'perro'); assert.equal(l('eu').t, 'txakurra'); assert.equal(l('gl').t, 'can');
  assert.equal(l('ca').t, 'gos'); assert.equal(l('fr').t, 'chien'); assert.equal(l('en').t, tw.meaning.en);
  assert.equal(l('en').et, ''); assert.equal(l('fr').et, tw.example.fr); assert.equal(l('es').et, tw.example.es);
  assert.equal(l('xx').t, 'perro'); // unknown language
  assert.equal(VL.localizeWord(raw, undefined, 'fr').t, 'perro'); // no translation available
  assert.equal(VL.localizeWord(raw, undefined, 'fr').et, '');
  // the English word, emoji and sentence never change, so saved progress (keyed by the English word) is untouched
  for (const lg of VL.LANGS) { const x = l(lg); assert.equal(x.w, 'dog'); assert.equal(x.i, '🐶'); assert.equal(x.e, raw.e); }
});

test('U-VOCAB-I18N: the new interface keys exist in six languages with the same placeholders', () => {
  const ph = s => (String(s).match(/\{[a-z]+\}/g) || []).sort().join();
  const base = Object.keys(VL.NEW_KEYS.es);
  for (const k of ['streak', 'help', 'helpStarts', 'zChoose', 'zType', 'zDrag', 'zMatch', 'zMemory', 'dragTitle', 'hearPic', 'noVoice', 'modeRound', 'modeMatch', 'modeMemory', 'modeLightning', 'timeUp', 'lightResult', 'practiceNote'])
    assert.ok(base.includes(k), 'missing key ' + k);
  for (const l of VL.LANGS) for (const k of base) {
    const v = VL.NEW_KEYS[l][k];
    assert.ok(typeof v === 'string' && v.trim().length > 1, `${l}.${k}`);
    assert.equal(ph(v), ph(VL.NEW_KEYS.es[k]), `${l}.${k} placeholders`);
    assert.ok(!/—/.test(v), `${l}.${k} has an em dash`);
  }
});

test('U-VOCAB-I18N: practice helpers build valid pairs, decks and matches', () => {
  const pack = JSON.parse(fs.readFileSync(path.join(dir, 'en/colors.json'), 'utf8'));
  const words = pack.words.map(a => VL.localizeWord({ w: a[0], ts: a[1], i: a[2], e: a[3] }, tr.words[pack.id][a[0]], 'fr'));
  for (let k = 0; k < 30; k++) {
    const pick = VL.pickPracticeWords(words, 6);
    assert.equal(pick.length, 6);
    for (const key of ['w', 't', 'i']) assert.equal(new Set(pick.map(x => x[key])).size, 6, 'distinct ' + key);
    const m = VL.buildMatch(pick);
    assert.equal(m.left.length, 6); const ws = a => a.map(x => x.w).sort(); assert.deepEqual(ws(m.left), ws(pick)); assert.deepEqual(ws(m.right), ws(pick));
    assert.ok(m.right.some((x, i) => x !== m.left[i]), 'right column is in a different order');
    const deck = VL.buildMemoryDeck(pick);
    assert.equal(deck.length, 12);
    for (let p = 0; p < 6; p++) assert.deepEqual(deck.filter(c => c.pair === p).map(c => c.kind).sort(), ['pic', 'word']);
    assert.equal(new Set(deck.map(c => c.id)).size, 12);
  }
  assert.deepEqual(VL.hintParts('ice cream'), { l: 'i', n: 8 });
  const lines = VL.feedbackLines({ w: 'dog', t: 'chien', i: '', e: 'The dog runs.', et: 'Le chien court.' }, 'choice', { w: 'cat', t: 'chat' });
  assert.equal(lines[lines.length - 1].exampleTr, 'Le chien court.');
});
