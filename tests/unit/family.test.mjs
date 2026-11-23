import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '../..');

/** Loads platform/firestore.js with an in-memory localStorage and no Firebase (offline mode). */
function load(store = {}) {
  const ctx = {
    window: {},
    localStorage: {
      getItem: k => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; }
    },
    PlatformI18n: { t: k => k },
    console
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'platform/firestore.js'), 'utf8') + ';this.PF = PlatformFirestore;', ctx);
  return { PF: ctx.PF, store };
}

const ME = 'meuid12345';
const OWNER = 'owneruid99';

test('U-FAM-OWNER: no stored family means the own account', () => {
  const { PF } = load();
  assert.equal(PF._owner(ME), ME);
});

test('U-FAM-OWNER: a validated membership with a child selected resolves to the owner', () => {
  const { PF, store } = load({
    ['games_hub_owner_' + ME]: OWNER,
    ['games_hub_player_' + ME]: 'kid123abc',
    ['games_hub_mem_' + ME]: JSON.stringify([{ ownerUid: OWNER, ownerName: 'Luna', role: 'edit' }])
  });
  assert.equal(PF._owner(ME), OWNER);
  assert.equal(PF._lbId(ME), OWNER + '_kid123abc');
  assert.equal(PF._viewOnly(ME), false);
  assert.ok(store);
});

test('U-FAM-OWNER: an orphan or missing membership silently falls back to the own account', () => {
  const base = { ['games_hub_owner_' + ME]: OWNER, ['games_hub_player_' + ME]: 'kid123abc' };
  assert.equal(load({ ...base })['PF']._owner(ME), ME, 'no membership cache at all');
  assert.equal(load({ ...base, ['games_hub_mem_' + ME]: '[]' }).PF._owner(ME), ME, 'empty memberships');
  assert.equal(load({ ...base, ['games_hub_mem_' + ME]: JSON.stringify([{ ownerUid: 'otherfam77', role: 'edit' }]) }).PF._owner(ME), ME, 'other family');
  assert.equal(load({ ...base, ['games_hub_mem_' + ME]: 'not json' }).PF._owner(ME), ME, 'corrupt cache');
  const { PF } = load({ ...base, ['games_hub_mem_' + ME]: '[]' });
  assert.equal(PF._lbId(ME), ME + '_kid123abc', 'leaderboard id also falls back');
});

test('U-FAM-OWNER: without a selected child the user always plays on their own account', () => {
  const { PF } = load({
    ['games_hub_owner_' + ME]: OWNER,
    ['games_hub_mem_' + ME]: JSON.stringify([{ ownerUid: OWNER, role: 'edit' }])
  });
  assert.equal(PF._owner(ME), ME);
  assert.equal(PF._lbId(ME), ME);
});

test('U-FAM-OWNER: resolveOwner rejects malformed owners and self', () => {
  const { PF } = load();
  const mem = [{ ownerUid: OWNER }, { ownerUid: '../x' }];
  assert.equal(PF.resolveOwner(ME, OWNER, 'kid123abc', mem), OWNER);
  assert.equal(PF.resolveOwner(ME, ME, 'kid123abc', mem), ME);
  assert.equal(PF.resolveOwner(ME, '../x', 'kid123abc', mem), ME);
  assert.equal(PF.resolveOwner(ME, OWNER, '', mem), ME);
  assert.equal(PF.resolveOwner(ME, OWNER, 'kid123abc', null), ME);
});

test('U-FAM-OWNER: clearing the active child also clears the active family', () => {
  const { PF, store } = load({ ['games_hub_owner_' + ME]: OWNER, ['games_hub_player_' + ME]: 'kid123abc' });
  PF.setActivePlayer(ME, '');
  assert.equal(store['games_hub_owner_' + ME], undefined);
  assert.equal(store['games_hub_player_' + ME], undefined);
});

test('U-FAM-ROLE: view role is read only, edit and own account can save', () => {
  const mem = role => JSON.stringify([{ ownerUid: OWNER, role }]);
  const mk = role => load({ ['games_hub_owner_' + ME]: OWNER, ['games_hub_player_' + ME]: 'kid123abc', ['games_hub_mem_' + ME]: mem(role) }).PF;
  assert.equal(mk('view')._viewOnly(ME), true);
  assert.equal(mk('edit')._viewOnly(ME), false);
  assert.equal(load().PF._viewOnly(ME), false);
});

test('U-FAM-INVITE: e-mail validation matches the shape the rules accept', () => {
  const { PF } = load();
  assert.equal(PF.normEmail('  Abuela@Example.COM '), 'abuela@example.com');
  assert.equal(PF.normEmail(null), '');
  for (const ok of ['a@b.co', 'abuela@example.com', ' Mama@Gmail.com ']) assert.equal(PF.isValidEmail(ok), true, ok);
  for (const bad of ['', 'x', 'a@b', 'a b@c.de', 'a@b@c.de', '@b.co', 'a@.co', 'a'.repeat(250) + '@b.co', null, undefined, 5]) {
    assert.equal(PF.isValidEmail(bad), false, String(bad));
  }
});

test('U-FAM-INVITE: only edit and view are valid roles', () => {
  const { PF } = load();
  assert.equal(PF.isRole('edit'), true);
  assert.equal(PF.isRole('view'), true);
  for (const bad of ['owner', 'admin', '', null, undefined, 'EDIT']) assert.equal(PF.isRole(bad), false, String(bad));
});

test('U-FAM-INVITE: expired or malformed invitations are not active', () => {
  const { PF } = load();
  const now = Date.now();
  const inv = (o = {}) => ({ ownerUid: OWNER, role: 'edit', expires: new Date(now + 86400000), ...o });
  assert.equal(PF.isInviteActive(inv(), now), true);
  assert.equal(PF.isInviteActive(inv({ expires: { toMillis: () => now + 1000 } }), now), true);
  assert.equal(PF.isInviteActive(inv({ expires: { toMillis: () => now - 1 } }), now), false);
  assert.equal(PF.isInviteActive(inv({ expires: new Date(now - 1) }), now), false);
  assert.equal(PF.isInviteActive(inv({ expires: undefined }), now), false);
  assert.equal(PF.isInviteActive(inv({ role: 'owner' }), now), false);
  assert.equal(PF.isInviteActive(inv({ ownerUid: '' }), now), false);
  assert.equal(PF.isInviteActive(null, now), false);
});

test('U-FAM-OFFLINE: without Firestore the family API fails gracefully', async () => {
  const { PF } = load();
  assert.equal(JSON.stringify(await PF.listMemberships(ME)), '[]');
  assert.equal(JSON.stringify(await PF.listMyInvites()), '[]');
  assert.equal(JSON.stringify(await PF.listGuardians(OWNER)), '[]');
  assert.equal(JSON.stringify(await PF.listSentInvites(OWNER)), '[]');
  assert.equal(JSON.stringify(await PF.listPlayers(ME)), '[]');
  assert.equal(await PF.getActivePlayer(ME), null);
  await assert.rejects(PF.createInvite(OWNER, 'a@b.co', 'edit', 'Luna'), /offline/);
  await assert.rejects(PF.acceptInvite({ id: 'x', ownerUid: OWNER, role: 'edit' }, 'Abu'), /offline/);
  await assert.rejects(PF.declineInvite('x'), /offline/);
  await assert.rejects(PF.removeGuardian(OWNER, ME), /offline/);
  await assert.rejects(PF.leaveFamily(OWNER), /offline/);
  await assert.rejects(PF.setActiveFamily(ME, OWNER), /offline/);
  await PF.setActiveFamily(ME, '');
});

test('U-FAM-I18N: family strings exist in six languages with the same placeholders', () => {
  const store = {};
  const ctx = { localStorage: { getItem: () => null, setItem() {} }, navigator: { language: 'es-ES' },
    document: { documentElement: {}, dispatchEvent() {} }, CustomEvent: function () {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'platform/i18n-platform.js'), 'utf8') + ';this.PI = PlatformI18n;', ctx);
  const T = ctx.PI.translations;
  const keys = Object.keys(T['es-ES']).filter(k => k.startsWith('fam'));
  assert.ok(keys.length >= 30);
  const ph = s => (String(s).match(/\{\w+\}/g) || []).sort().join();
  for (const l of Object.keys(T)) {
    for (const k of keys) {
      assert.ok(T[l][k], `${l} misses ${k}`);
      assert.equal(ph(T[l][k]), ph(T['es-ES'][k]), `${l}.${k} placeholders`);
      assert.ok(!/[—–]/.test(T[l][k]), `${l}.${k} has a dash`);
    }
  }
  assert.ok(store);
});
