import assert from 'node:assert/strict';
import test, { before, after, beforeEach } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, addDoc, collection, deleteDoc, updateDoc, getDocs, serverTimestamp, query, where, writeBatch, Timestamp } from 'firebase/firestore';

const rules = fs.readFileSync(path.resolve(import.meta.dirname, '../../firestore.rules'), 'utf8');
let env;
before(async () => { env = await initializeTestEnvironment({ projectId: 'demo-gameshub', firestore: { rules } }); });
after(async () => { await env.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); });

const anon = () => env.unauthenticatedContext().firestore();
const as = uid => env.authenticatedContext(uid).firestore();
const ev = (o = {}) => ({ ts: serverTimestamp(), type: 'visit', game: 'hub', lang: 'es', auth: false, first: true, ...o });
const user = (o = {}) => ({ username: 'Luna', xp: 0, totalPoints: 0, ...o });

// ---- analytics (AN-1, AN-2, AN-3) ----
test('B-EVENT: anyone can create a valid anonymous event', async () => {
  await assertSucceeds(addDoc(collection(anon(), 'analytics_events'), ev()));
  await assertSucceeds(addDoc(collection(as('u1'), 'analytics_events'), ev({ type: 'play', game: 'vocabMaster', lang: 'fr', auth: true })));
});

test('B-EVENT-FIELDS: events with extra, personal or malformed fields are rejected', async () => {
  const c = collection(anon(), 'analytics_events');
  await assertFails(addDoc(c, { ...ev(), uid: 'u1' }));
  await assertFails(addDoc(c, { ...ev(), email: 'a@b.c' }));
  await assertFails(addDoc(c, ev({ type: 'hack' })));
  await assertFails(addDoc(c, ev({ lang: 'xx' })));
  await assertFails(addDoc(c, ev({ game: 'x'.repeat(25) })));
  await assertFails(addDoc(c, ev({ auth: 'yes' })));
  await assertFails(addDoc(c, { ...ev(), ts: new Date('2020-01-01') }));
});

test('B-EVENT-READ: only admins can read analytics', async () => {
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'analytics_events/e1'), { type: 'visit', game: 'hub', lang: 'es', auth: false, first: true });
    await setDoc(doc(ctx.firestore(), 'admins/boss'), { ok: true });
  });
  await assertFails(getDoc(doc(anon(), 'analytics_events/e1')));
  await assertFails(getDoc(doc(as('u1'), 'analytics_events/e1')));
  await assertFails(getDocs(collection(as('u1'), 'analytics_events')));
  await assertSucceeds(getDoc(doc(as('boss'), 'analytics_events/e1')));
  await assertSucceeds(getDocs(collection(as('boss'), 'analytics_events')));
});

test('B-EVENT-IMMUTABLE: events cannot be updated or deleted, admins cannot be self-made', async () => {
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'analytics_events/e1'), { type: 'visit', game: 'hub', lang: 'es', auth: false, first: true });
    await setDoc(doc(ctx.firestore(), 'admins/boss'), { ok: true });
  });
  await assertFails(updateDoc(doc(as('boss'), 'analytics_events/e1'), { first: false }));
  await assertFails(deleteDoc(doc(as('boss'), 'analytics_events/e1')));
  await assertFails(setDoc(doc(as('u1'), 'admins/u1'), { ok: true }));
  await assertSucceeds(getDoc(doc(as('boss'), 'admins/boss')));
  await assertFails(getDoc(doc(as('u1'), 'admins/boss')));
});

// ---- users and children (SEC-1) ----
test('B-USERS: a user reads and writes only their own profile', async () => {
  await assertSucceeds(setDoc(doc(as('u1'), 'users/u1'), user()));
  await assertSucceeds(getDoc(doc(as('u1'), 'users/u1')));
  await assertFails(getDoc(doc(as('u2'), 'users/u1')));
  await assertFails(setDoc(doc(as('u2'), 'users/u1'), user()));
  await assertFails(getDoc(doc(anon(), 'users/u1')));
});

test('B-USERS: invalid profile data is rejected', async () => {
  await assertFails(setDoc(doc(as('u1'), 'users/u1'), user({ xp: -1 })));
  await assertFails(setDoc(doc(as('u1'), 'users/u1'), user({ username: 'x'.repeat(41) })));
});

test('B-USERS: child players and their stats are owner only', async () => {
  await assertSucceeds(setDoc(doc(as('u1'), 'users/u1/players/p1'), { nickname: 'Pipo', avatar: '🦊' }));
  await assertSucceeds(setDoc(doc(as('u1'), 'users/u1/players/p1/games/mathmaster'), { totalGames: 1 }));
  await assertFails(getDoc(doc(as('u2'), 'users/u1/players/p1')));
  await assertFails(getDoc(doc(as('u2'), 'users/u1/players/p1/games/mathmaster')));
  await assertFails(getDoc(doc(anon(), 'users/u1/players/p1')));
});

// ---- nicknames (SEC-2) ----
test('B-NICK: nicknames are unique, gettable but not listable, never overwritten', async () => {
  await assertSucceeds(setDoc(doc(as('u1'), 'nicknames/pipo'), { uid: 'u1', createdAt: 1 }));
  await assertSucceeds(getDoc(doc(as('u2'), 'nicknames/pipo')));
  await assertFails(getDocs(collection(as('u2'), 'nicknames')));
  await assertFails(setDoc(doc(as('u2'), 'nicknames/pipo'), { uid: 'u2', createdAt: 2 }));
  await assertFails(setDoc(doc(as('u2'), 'nicknames/luna'), { uid: 'u1', createdAt: 2 }));
  await assertFails(deleteDoc(doc(as('u2'), 'nicknames/pipo')));
  await assertSucceeds(deleteDoc(doc(as('u1'), 'nicknames/pipo')));
});

// ---- leaderboard (SEC-3) ----
test('B-LEADER: only the owner writes a score, adult or child id', async () => {
  const s = { uid: 'u1', username: 'Luna', totalPoints: 10 };
  await assertSucceeds(setDoc(doc(as('u1'), 'leaderboard/mathmaster/scores/u1'), s));
  await assertSucceeds(setDoc(doc(as('u1'), 'leaderboard/mathmaster/scores/u1_abc123xyz'), s));
  await assertFails(setDoc(doc(as('u2'), 'leaderboard/mathmaster/scores/u1'), s));
  await assertFails(setDoc(doc(as('u1'), 'leaderboard/mathmaster/scores/u1'), { ...s, totalPoints: -5 }));
  await assertFails(setDoc(doc(as('u1'), 'leaderboard/mathmaster/scores/u1'), { ...s, uid: 'u2' }));
  await assertSucceeds(getDoc(doc(as('u2'), 'leaderboard/mathmaster/scores/u1')));
  await assertFails(getDoc(doc(anon(), 'leaderboard/mathmaster/scores/u1')));
});

test('B-DEFAULT: unknown collections are denied', async () => {
  await assertFails(setDoc(doc(as('u1'), 'secrets/x'), { a: 1 }));
  await assertFails(getDoc(doc(as('u1'), 'secrets/x')));
});

// Regression: a brand new adult saving nickname + consent (no xp yet) must work, in one transaction with the nickname claim.
test('B-CLAIM: first-time identity save (nickname + profile without xp) succeeds and a duplicate is refused', async () => {
  const db = as('u1');
  await assertSucceeds(db.runTransaction(async tx => {
    tx.set(doc(db, 'nicknames/endika'), { uid: 'u1', createdAt: new Date().toISOString() });
    tx.set(doc(db, 'users/u1'), { username: 'Endika', nicknameKey: 'endika', avatar: '🦊', photoURL: null,
      consent: { version: 1, at: new Date().toISOString(), guardian: true } }, { merge: true });
  }));
  await assertFails(setDoc(doc(as('u2'), 'users/u2'), { username: 'X', xp: 'lots' }));
  await assertFails(setDoc(doc(as('u2'), 'users/u2'), { username: 'X', totalPoints: -3 }));
});

// ---- family accounts (docs/cuenta-familiar.md) ----
const asMail = (uid, email, verified = true) => env.authenticatedContext(uid, { email, email_verified: verified }).firestore();
const DAY = 86400000;
const invite = (o = {}) => ({ ownerUid: 'own', ownerName: 'Luna', email: 'abuela@example.com', role: 'edit',
  createdAt: serverTimestamp(), expires: Timestamp.fromMillis(Date.now() + 30 * DAY), ...o });
async function seedOwner() {
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users/own'), user());
    await setDoc(doc(db, 'users/own/games/mathmaster'), { totalGames: 3 });
    await setDoc(doc(db, 'users/own/players/kid123abc'), { username: 'Pipo', xp: 0, totalPoints: 0 });
    await setDoc(doc(db, 'users/own/players/kid123abc/games/mathmaster'), { totalGames: 1 });
  });
}
async function seedInvite(id = 'inv1', o = {}) {
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'invites/' + id), { ...invite(), createdAt: new Date(), ...o });
  });
}
async function seedGuardian(uid, role) {
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await setDoc(doc(db, `users/own/guardians/${uid}`), { uid, email: uid + '@example.com', name: uid, role, since: new Date(), inviteId: 'x' });
    await setDoc(doc(db, `users/${uid}/memberships/own`), { ownerUid: 'own', ownerName: 'Luna', role, since: new Date() });
  });
}
const guardianDoc = (uid, email, role = 'edit', inviteId = 'inv1') =>
  ({ uid, email, name: 'Abuela', role, since: serverTimestamp(), inviteId });
const memberDoc = (role = 'edit') => ({ ownerUid: 'own', ownerName: 'Luna', role, since: serverTimestamp() });
async function accept(db, uid, email, role = 'edit') {
  const b = writeBatch(db);
  b.set(doc(db, `users/own/guardians/${uid}`), guardianDoc(uid, email, role));
  b.set(doc(db, `users/${uid}/memberships/own`), memberDoc(role));
  b.delete(doc(db, 'invites/inv1'));
  return b.commit();
}

test('B-FAM-INVITE: the owner creates an invitation; a third party cannot read, list or delete it', async () => {
  await seedOwner();
  await assertSucceeds(setDoc(doc(as('own'), 'invites/inv1'), invite()));
  await assertFails(getDoc(doc(as('other'), 'invites/inv1')));
  await assertFails(getDoc(doc(asMail('other', 'otro@example.com'), 'invites/inv1')));
  await assertFails(deleteDoc(doc(asMail('other', 'otro@example.com'), 'invites/inv1')));
  await assertFails(getDocs(query(collection(asMail('other', 'otro@example.com'), 'invites'), where('email', '==', 'abuela@example.com'))));
  await assertSucceeds(getDoc(doc(as('own'), 'invites/inv1')));
});

test('B-FAM-INVITE: invalid invitations are refused', async () => {
  await seedOwner();
  const d = as('own');
  await assertFails(setDoc(doc(d, 'invites/a'), invite({ ownerUid: 'someone' })));
  await assertFails(setDoc(doc(d, 'invites/b'), invite({ role: 'owner' })));
  await assertFails(setDoc(doc(d, 'invites/c'), invite({ email: 'Abuela@Example.com' })));
  await assertFails(setDoc(doc(d, 'invites/d'), invite({ email: 'no-es-un-mail' })));
  await assertFails(setDoc(doc(d, 'invites/e'), invite({ email: 'a'.repeat(250) + '@b.co' })));
  await assertFails(setDoc(doc(d, 'invites/f'), invite({ expires: Timestamp.fromMillis(Date.now() - DAY) })));
  await assertFails(setDoc(doc(d, 'invites/g'), invite({ expires: Timestamp.fromMillis(Date.now() + 90 * DAY) })));
  await assertFails(setDoc(doc(d, 'invites/h'), { ...invite(), extra: 1 }));
  await assertFails(setDoc(doc(d, 'invites/i'), invite({ ownerName: 'Otra persona' })));
  await assertFails(setDoc(doc(as('ghost'), 'invites/j'), invite({ ownerUid: 'ghost' })));
});

test('B-FAM-INVITE: invitations are never updated', async () => {
  await seedOwner(); await seedInvite();
  await assertFails(updateDoc(doc(as('own'), 'invites/inv1'), { role: 'view' }));
  await assertSucceeds(deleteDoc(doc(as('own'), 'invites/inv1')));
});

test('B-FAM-ACCEPT: the invited verified e-mail lists, accepts and becomes a guardian', async () => {
  await seedOwner(); await seedInvite();
  const g = asMail('gran', 'Abuela@Example.com');
  const q = await assertSucceeds(getDocs(query(collection(g, 'invites'), where('email', '==', 'abuela@example.com'))));
  assert.equal(q.size, 1);
  await assertSucceeds(accept(g, 'gran', 'abuela@example.com'));
  await assertSucceeds(getDoc(doc(g, 'users/gran/memberships/own')));
  await assertSucceeds(getDoc(doc(g, 'users/own/guardians/gran')));
});

test('B-FAM-ACCEPT: another e-mail, unverified e-mail, or expired invitation cannot accept', async () => {
  await seedOwner(); await seedInvite();
  await assertFails(accept(asMail('x', 'otro@example.com'), 'x', 'abuela@example.com'));
  await assertFails(accept(asMail('x', 'abuela@example.com', false), 'x', 'abuela@example.com'));
  await seedInvite('inv1', { expires: new Date(Date.now() - DAY) });
  await assertFails(accept(asMail('gran', 'abuela@example.com'), 'gran', 'abuela@example.com'));
});

test('B-FAM-ACCEPT: role must match the invitation, nobody creates a guardian for someone else or for free', async () => {
  await seedOwner(); await seedInvite('inv1', { role: 'view' });
  const g = asMail('gran', 'abuela@example.com');
  await assertFails(accept(g, 'gran', 'abuela@example.com', 'edit'));
  await assertFails(setDoc(doc(g, 'users/own/guardians/other'), guardianDoc('other', 'abuela@example.com', 'view')));
  await assertFails(setDoc(doc(as('own'), 'users/own/guardians/friend'), guardianDoc('friend', 'abuela@example.com', 'view')));
  await assertFails(setDoc(doc(g, 'users/own/guardians/gran'), { ...guardianDoc('gran', 'abuela@example.com', 'view'), inviteId: 'nope' }));
  await assertFails(setDoc(doc(g, 'users/own/guardians/gran'), { ...guardianDoc('gran', 'abuela@example.com', 'view'), extra: 1 }));
  await assertFails(setDoc(doc(g, 'users/gran/memberships/own'), memberDoc('view')));
  await assertSucceeds(accept(g, 'gran', 'abuela@example.com', 'view'));
});

test('B-FAM-EDIT: an edit guardian reads and writes players, not the owner profile, nor deletes a player', async () => {
  await seedOwner(); await seedGuardian('gran', 'edit');
  const g = as('gran');
  await assertSucceeds(getDoc(doc(g, 'users/own/players/kid123abc')));
  await assertSucceeds(getDocs(collection(g, 'users/own/players')));
  await assertSucceeds(getDoc(doc(g, 'users/own/players/kid123abc/games/mathmaster')));
  await assertSucceeds(setDoc(doc(g, 'users/own/players/kid123abc/games/mathmaster'), { totalGames: 2 }));
  await assertSucceeds(updateDoc(doc(g, 'users/own/players/kid123abc'), { xp: 5, totalPoints: 10 }));
  await assertSucceeds(setDoc(doc(g, 'users/own/players/newkid123'), { username: 'Nuevo', xp: 0, totalPoints: 0 }));
  await assertFails(deleteDoc(doc(g, 'users/own/players/kid123abc')));
  await assertFails(deleteDoc(doc(g, 'users/own/players/kid123abc/games/mathmaster')));
  await assertFails(getDoc(doc(g, 'users/own')));
  await assertFails(setDoc(doc(g, 'users/own'), user()));
  await assertFails(getDoc(doc(g, 'users/own/games/mathmaster')));
  await assertFails(setDoc(doc(g, 'users/own/games/mathmaster'), { totalGames: 99 }));
  await assertFails(setDoc(doc(g, 'users/own/guardians/gran'), guardianDoc('gran', 'gran@example.com')));
  await assertFails(setDoc(doc(g, 'users/own/guardians/pal'), guardianDoc('pal', 'pal@example.com')));
  await assertFails(updateDoc(doc(g, 'users/own/guardians/gran'), { role: 'edit' }));
  await assertSucceeds(deleteDoc(doc(as('own'), 'users/own/players/kid123abc')));
});

test('B-FAM-VIEW: a view guardian only reads', async () => {
  await seedOwner(); await seedGuardian('teacher', 'view');
  const g = as('teacher');
  await assertSucceeds(getDoc(doc(g, 'users/own/players/kid123abc')));
  await assertSucceeds(getDoc(doc(g, 'users/own/players/kid123abc/games/mathmaster')));
  await assertFails(setDoc(doc(g, 'users/own/players/kid123abc/games/mathmaster'), { totalGames: 2 }));
  await assertFails(updateDoc(doc(g, 'users/own/players/kid123abc'), { xp: 5 }));
  await assertFails(deleteDoc(doc(g, 'users/own/players/kid123abc')));
  await assertFails(getDoc(doc(g, 'users/own')));
});

test('B-FAM-REVOKE: removing the guardian cuts access at once; the guardian can also leave', async () => {
  await seedOwner(); await seedGuardian('gran', 'edit'); await seedGuardian('pal', 'view');
  await assertSucceeds(getDoc(doc(as('gran'), 'users/own/players/kid123abc')));
  await assertSucceeds(deleteDoc(doc(as('own'), 'users/own/guardians/gran')));
  await assertFails(getDoc(doc(as('gran'), 'users/own/players/kid123abc')));
  await assertFails(setDoc(doc(as('gran'), 'users/own/players/kid123abc/games/mathmaster'), { totalGames: 2 }));
  await assertFails(deleteDoc(doc(as('pal'), 'users/own/guardians/gran')));
  await assertSucceeds(deleteDoc(doc(as('pal'), 'users/own/guardians/pal')));
  await assertSucceeds(deleteDoc(doc(as('pal'), 'users/pal/memberships/own')));
  await assertFails(getDoc(doc(as('pal'), 'users/own/players/kid123abc')));
});

test('B-FAM-OTHER: a guardian of another family, or a stranger, has no access', async () => {
  await seedOwner(); await seedGuardian('gran', 'edit');
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'users/own2'), user());
    await setDoc(doc(ctx.firestore(), 'users/own2/players/kid999zzz'), { username: 'Otro', xp: 0, totalPoints: 0 });
  });
  await assertFails(getDoc(doc(as('gran'), 'users/own2/players/kid999zzz')));
  await assertFails(setDoc(doc(as('gran'), 'users/own2/players/kid999zzz'), { username: 'X', xp: 0, totalPoints: 0 }));
  await assertFails(getDoc(doc(as('stranger'), 'users/own/players/kid123abc')));
  await assertFails(getDocs(collection(as('stranger'), 'users/own/guardians')));
  await assertSucceeds(getDocs(collection(as('own'), 'users/own/guardians')));
  await assertSucceeds(getDocs(query(collection(as('gran'), 'users/own/guardians'), where('uid', '==', 'gran'))));
});

test('B-FAM-MEMBER: memberships are private, immutable and cannot be forged', async () => {
  await seedOwner(); await seedGuardian('gran', 'edit');
  await assertSucceeds(getDoc(doc(as('gran'), 'users/gran/memberships/own')));
  await assertFails(getDoc(doc(as('own'), 'users/gran/memberships/own')));
  await assertFails(updateDoc(doc(as('gran'), 'users/gran/memberships/own'), { role: 'view' }));
  await assertFails(setDoc(doc(as('forger'), 'users/forger/memberships/own'), memberDoc('edit')));
  await assertFails(setDoc(doc(as('own'), 'users/gran/memberships/own2'), memberDoc('edit')));
});

test('B-FAM-OWNER: the owner cannot forge guardians or memberships through the generic rule', async () => {
  await seedOwner();
  await assertFails(setDoc(doc(as('own'), 'users/own/guardians/fake'), guardianDoc('fake', 'f@example.com')));
  await assertFails(setDoc(doc(as('own'), 'users/own/memberships/own2'), memberDoc('edit')));
  await assertSucceeds(setDoc(doc(as('own'), 'users/own/games/snake'), { totalGames: 1 }));
});

test('B-FAM-LEADER: only an edit guardian writes a child score, under the owner uid', async () => {
  await seedOwner(); await seedGuardian('gran', 'edit'); await seedGuardian('teacher', 'view');
  const s = { uid: 'own', username: 'Pipo', totalPoints: 10 };
  const path = 'leaderboard/mathmaster/scores/own_kid123abc';
  await assertSucceeds(setDoc(doc(as('gran'), path), s));
  await assertFails(setDoc(doc(as('gran'), path), { ...s, uid: 'gran' }));
  await assertFails(setDoc(doc(as('gran'), 'leaderboard/mathmaster/scores/own'), s));
  await assertFails(setDoc(doc(as('gran'), path), { ...s, totalPoints: -1 }));
  await assertFails(setDoc(doc(as('teacher'), path), s));
  await assertFails(setDoc(doc(as('stranger'), path), s));
  await assertFails(deleteDoc(doc(as('gran'), path)));
  await assertSucceeds(deleteDoc(doc(as('own'), path)));
});

test('B-FAM-REPLAY: accepting without consuming the invitation is refused (no replay after a revocation)', async () => {
  await seedOwner(); await seedInvite();
  const g = asMail('gran', 'abuela@example.com');
  const b = writeBatch(g);
  b.set(doc(g, 'users/own/guardians/gran'), guardianDoc('gran', 'abuela@example.com'));
  b.set(doc(g, 'users/gran/memberships/own'), memberDoc());
  await assertFails(b.commit());
  await assertSucceeds(accept(g, 'gran', 'abuela@example.com'));
});
