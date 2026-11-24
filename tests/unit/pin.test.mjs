import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '../..');

/** Loads a platform script in an isolated context with an in-memory localStorage and WebCrypto. */
function load(file, globalName, extra = {}, store = {}) {
  const ctx = {
    localStorage: {
      getItem: k => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; }
    },
    PlatformI18n: { t: k => k },
    crypto: globalThis.crypto, TextEncoder, btoa, atob, console, ...extra
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8') + ';this.__X = ' + globalName + ';', ctx);
  return { X: ctx.__X, store, ctx };
}
const plain = x => JSON.parse(JSON.stringify(x));
const pf = (store) => load('platform/firestore.js', 'PlatformFirestore', {}, store);

test('U-PIN-VALID: only exactly four digits are a PIN', () => {
  const { X } = pf();
  for (const ok of ['0000', '1234', '9876']) assert.equal(X.isValidPin(ok), true, ok);
  for (const bad of ['', '123', '12345', 'abcd', '12 4', '12a4', '１２３４', 1234, null, undefined, ' 1234', '1234\n']) assert.equal(X.isValidPin(bad), false, String(bad));
});

test('U-PIN-HASH: the record has a random salt, never contains the PIN, and the same PIN hashes differently each time', async () => {
  const { X } = pf();
  const a = await X.hashPin('4821'), b = await X.hashPin('4821');
  assert.deepEqual(plain(Object.keys(a).sort()), ['alg', 'hash', 'iter', 'salt', 'v']);
  assert.equal(a.v, 1);
  assert.equal(a.alg, 'PBKDF2-SHA256');
  assert.equal(a.iter, X.PIN_ITER);
  assert.ok(a.salt.length >= 16 && a.salt.length <= 32 && a.hash.length >= 32 && a.hash.length <= 64, 'sizes the Firestore rules accept');
  assert.notEqual(a.salt, b.salt);
  assert.notEqual(a.hash, b.hash);
  assert.ok(!JSON.stringify(a).includes('4821'));
  await assert.rejects(() => X.hashPin('12'), /invalid/);
  await assert.rejects(() => X.hashPin(1234), /invalid/);
});

test('U-PIN-VERIFY: the right PIN verifies, anything else does not, malformed records never match', async () => {
  const { X } = pf();
  const rec = await X.hashPin('4821');
  assert.equal(await X.verifyPin('4821', rec), true);
  assert.equal(await X.verifyPin('4822', rec), false);
  assert.equal(await X.verifyPin('0000', rec), false);
  assert.equal(await X.verifyPin('482', rec), false);
  assert.equal(await X.verifyPin('48210', rec), false);
  assert.equal(await X.verifyPin(4821, rec), false);
  assert.equal(await X.verifyPin('4821', null), false);
  assert.equal(await X.verifyPin('4821', {}), false);
  assert.equal(await X.verifyPin('4821', { ...rec, hash: '!!!' }), false);
  assert.equal(await X.verifyPin('4821', { ...rec, salt: '' }), false);
  assert.equal(await X.verifyPin('4821', { ...rec, iter: 1 }), false);
  assert.equal(await X.verifyPin('4821', { ...rec, hash: rec.hash.slice(0, 20) }), false);
  assert.equal(await X.verifyPin('4821', { ...rec, salt: (await X.hashPin('4821')).salt }), false, 'another salt gives another hash');
});

test('U-PIN-HAS: hasPin recognises a stored record', async () => {
  const { X } = pf();
  assert.equal(X.hasPin({ pin: await X.hashPin('1111') }), true);
  for (const k of [null, undefined, {}, { pin: null }, { pin: {} }, { pin: { salt: 'a' } }, { pin: '1234' }]) assert.equal(X.hasPin(k), false);
});

test('U-PIN-LOCK: five wrong tries lock for 30 s, then five more are allowed, a right PIN clears the count', () => {
  const { X } = pf();
  let s = { fails: 0, until: 0 };
  const T0 = 1_000_000;
  for (let i = 1; i <= 4; i++) {
    s = X.pinLockNext(s, false, T0);
    assert.equal(X.pinLockStatus(s, T0).locked, false);
    assert.equal(X.pinLockStatus(s, T0).left, 5 - i);
  }
  s = X.pinLockNext(s, false, T0); // 5th wrong try
  let st = X.pinLockStatus(s, T0);
  assert.equal(st.locked, true);
  assert.equal(st.waitSec, 30);
  assert.equal(X.pinLockStatus(s, T0 + 10_000).waitSec, 20);
  assert.equal(X.pinLockStatus(s, T0 + 29_001).waitSec, 1, 'rounded up');
  assert.equal(X.pinLockStatus(s, T0 + 30_000).locked, false);
  // while locked, another wrong try does not extend or reset the wait
  assert.deepEqual(plain(X.pinLockNext(s, false, T0 + 5_000)), plain(s));
  // after the wait the count starts again at five
  assert.equal(X.pinLockStatus(s, T0 + 31_000).left, 5);
  s = X.pinLockNext(s, false, T0 + 31_000);
  assert.equal(X.pinLockStatus(s, T0 + 31_000).left, 4);
  assert.deepEqual(plain(X.pinLockNext(s, true, T0 + 32_000)), { fails: 0, until: 0 });
});

test('U-PIN-LOCK: garbage in the stored state is ignored', () => {
  const { X } = pf();
  for (const bad of [null, undefined, 'x', { fails: 'many', until: 'soon' }, { fails: -3, until: -1 }, { fails: 99, until: NaN }]) {
    const st = X.pinLockStatus(bad, 5000);
    assert.equal(st.locked, false);
    assert.ok(st.left >= 0 && st.left <= 5);
  }
});

test('U-PIN-TRY: tryPin counts wrong tries, locks at the fifth, refuses even the right PIN while locked, and unlocks after 30 s', async () => {
  const { X, store } = pf();
  const rec = await X.hashPin('2468');
  const T0 = 5_000_000;
  const go = (pin, t) => X.tryPin('me', 'own', 'kid123abc', pin, rec, t);
  let r = await go('0000', T0);
  assert.deepEqual([r.ok, r.locked, r.left], [false, false, 4]);
  for (let i = 0; i < 3; i++) r = await go('1111', T0 + i);
  assert.deepEqual([r.ok, r.locked, r.left], [false, false, 1]);
  r = await go('9999', T0 + 10);
  assert.deepEqual([r.ok, r.locked, r.left, r.waitSec], [false, true, 0, 30]);
  r = await go('2468', T0 + 5_000);
  assert.deepEqual([r.ok, r.locked], [false, true], 'the right PIN is refused during the wait');
  assert.equal(r.waitSec, 26, '30 s counted from the 5th wrong try, rounded up');
  assert.ok(Object.keys(store).some(k => k.startsWith('games_hub_pinlock_')), 'state kept on this device');
  r = await go('2468', T0 + 30_010);
  assert.equal(r.ok, true);
  assert.ok(!Object.keys(store).some(k => k.startsWith('games_hub_pinlock_')), 'a right PIN clears the lock state');
  assert.equal(X.pinStatus('me', 'own', 'kid123abc', T0 + 30_020).locked, false);
});

test('U-PIN-TRY: the lock is per profile and the count survives a reload (localStorage)', async () => {
  const store = {};
  const a = pf(store).X, rec = await a.hashPin('2468');
  for (let i = 0; i < 5; i++) await a.tryPin('me', 'own', 'kid123abc', '0000', rec, 10_000 + i);
  const b = pf(store).X; // "reloaded" page
  assert.equal(b.pinStatus('me', 'own', 'kid123abc', 11_000).locked, true);
  assert.equal(b.pinStatus('me', 'own', 'other12345', 11_000).locked, false);
  assert.equal(b.pinStatus('me', 'fam2', 'kid123abc', 11_000).locked, false);
});

test('U-PIN-WRITE: setChildPin stores only the hash record; clearChildPin deletes the field; bad input never reaches Firestore', async () => {
  const calls = [];
  const db = { collection: () => ({ doc: () => ({ collection: () => ({ doc: id => ({ update: async d => { calls.push([id, d]); } }) }) }) }) };
  const fb = { firestore: { FieldValue: { delete: () => ({ __delete: true }) } } };
  const { X } = load('platform/firestore.js', 'PlatformFirestore', { GamesHubDB: db, firebase: fb });
  await X.setChildPin('own1234567', 'kid123abc', '7531');
  assert.equal(calls.length, 1);
  assert.deepEqual(plain(Object.keys(calls[0][1])), ['pin']);
  assert.ok(!JSON.stringify(calls[0][1]).includes('7531'));
  assert.equal(await X.verifyPin('7531', calls[0][1].pin), true);
  await X.clearChildPin('own1234567', 'kid123abc');
  assert.deepEqual(plain(calls[1][1]), { pin: { __delete: true } });
  await assert.rejects(() => X.setChildPin('own1234567', 'kid123abc', '12'), /invalid/);
  await assert.rejects(() => X.setChildPin('own1234567', 'BAD!', '1234'), /invalid/);
  await assert.rejects(() => X.clearChildPin('', 'kid123abc'), /invalid/);
  assert.equal(calls.length, 2);
});

// ---- picker helpers (platform/profiles.js) ----
const pp = () => load('platform/profiles.js', 'PlatformProfiles').X;

test('U-PROFILES-MODE: child, adult and guest profiles', () => {
  const P = pp();
  assert.equal(P.modeOf(null), 'guest');
  assert.equal(P.modeOf({}), 'guest');
  assert.equal(P.modeOf({ uid: 'u1', username: 'Luna' }), 'adult');
  assert.equal(P.modeOf({ uid: 'u1', username: 'Pipo', kind: 'child' }), 'child');
  assert.equal(P.audienceFor('child'), 'kids');
  assert.equal(P.audienceFor('adult'), 'adults');
  assert.equal(P.audienceFor('guest'), 'all');
});

test('U-PROFILES-LIST: Yo first, then own children, then the children of each family with role and PIN', () => {
  const P = pp();
  const list = P.buildList('me1', { username: 'Luna', avatar: '🦊' },
    [{ pid: 'kid111111', username: 'Pipo', avatar: '🐼', pin: { salt: 's', hash: 'h' }, totalPoints: 5 }],
    [{ m: { ownerUid: 'fam2', ownerName: 'Marta', role: 'view' }, ks: [{ pid: 'kid222222', username: 'Nora', avatar: '🦄' }] }]);
  assert.deepEqual(plain(list.map(p => p.key)), ['me', 'me1:kid111111', 'fam2:kid222222']);
  assert.equal(list[0].kind, 'me');
  assert.equal(list[1].owner, '');
  assert.equal(list[2].owner, 'fam2');
  assert.equal(list[2].role, 'view');
  assert.equal(list[2].family, 'Marta');
  assert.ok(list[1].pin);
  assert.equal(list[2].pin, null);
  assert.equal(P.buildList('me1', {}, [], []).length, 1);
});

test('U-PROFILES-COLOR: colours are stable per profile and come from the palette', () => {
  const P = pp();
  assert.equal(P.colorFor('a:b'), P.colorFor('a:b'));
  assert.ok(P.COLORS.includes(P.colorFor('x')));
  assert.ok(P.COLORS.includes(P.colorFor('')));
});

test('U-PROFILES-FORYOU: the adult row has word search, crosswords, reading, memory, maths, tables and maps, in order', () => {
  const P = pp();
  const games = [
    { id: 'snake', href: 's' }, { id: 'mapas', href: 'm' }, { id: 'tablemaster', href: 't' }, { id: 'mathmaster', href: 'mm' },
    { id: 'memory', href: 'me' }, { id: 'reading', href: 'r' }, { id: 'crossword', href: 'c' }, { id: 'wordsearch', href: 'w' }, { id: 'periodic', lab: true }
  ];
  assert.deepEqual(plain(P.forYou(games).map(g => g.id)), ['wordsearch', 'crossword', 'reading', 'memory', 'mathmaster', 'tablemaster', 'mapas']);
  assert.deepEqual(plain(P.forYou([{ id: 'reading', href: '' }])), []);
  assert.deepEqual(plain(P.forYou(null)), []);
});

test('U-PROFILES-HUB: the hub catalogue gives every Para ti game an adult audience', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const P = pp();
  for (const id of P.FOR_YOU) {
    const m = html.match(new RegExp("id: '" + id + "',[^\\n]*aud: '([^']+)'"));
    assert.ok(m, 'catalogue entry for ' + id);
    assert.ok(m[1].split(' ').includes('adults'), id + ' aud: ' + m[1]);
  }
});

test('U-PROFILES-TEXT: no em dash in any new user visible text', () => {
  const I = load('platform/i18n-platform.js', 'PlatformI18n', { document: { documentElement: {}, dispatchEvent() {} }, navigator: { language: 'es' }, CustomEvent: class {} }).X;
  const keys = Object.keys(I.translations['es-ES']).filter(k => /^(pick|pin)/.test(k));
  assert.ok(keys.length >= 30);
  for (const l of Object.keys(I.translations)) for (const k of keys) {
    const v = I.translations[l][k];
    assert.ok(typeof v === 'string' && v.trim(), l + ' lacks ' + k);
    assert.ok(!/[—–]/.test(v), l + '.' + k + ' has a dash');
  }
});
