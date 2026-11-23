import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = path.resolve(import.meta.dirname, '../..');
const J = createRequire(import.meta.url)(path.join(root, 'platform/juice.js'));

test('U-JUICE: praise, combos and encouragement exist in six languages and never break without a DOM', () => {
  for (const l of J.LANGS) {
    for (const k of ['PRAISE', 'COMBO', 'TRY']) { assert.ok(J[k][l] && J[k][l].length >= 3, k + ' ' + l); J[k][l].forEach(s => assert.ok(s && s.trim().length > 2, k + ' ' + l)); }
    J.COMBO[l].forEach(s => assert.ok(s.includes('{n}'), 'combo placeholder ' + l));
  }
  assert.match(J.praise(5), /5/);
  assert.match(J.praise(12), /12/);
  assert.ok(J.praise(0).length > 2);
  assert.ok(J.tryAgain().length > 5);
  // no window: every effect is a harmless no-op
  assert.doesNotThrow(() => { J.correct(null, { streak: 3 }); J.wrong(null); J.tick(); J.levelUp(null); J.sfx('ok'); J.vibrate(10); J.burst(1, 1); });
  assert.equal(J.muted(), false);
});
