import assert from 'node:assert/strict';
import test, { before, after, beforeEach } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, addDoc, collection, deleteDoc, updateDoc, getDocs, serverTimestamp, query, where, writeBatch, Timestamp, deleteField } from 'firebase/firestore';

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

// ---- privacy between adults and children, and the profile PIN (docs/cuenta-familiar.md) ----
const PIN = (o = {}) => ({ v: 1, alg: 'PBKDF2-SHA256', iter: 100000, salt: 'c2FsdHNhbHRzYWx0c2FsdA==', hash: 'aGFzaGhhc2hoYXNoaGFzaGhhc2hoYXNoaGFzaGhhc2g=', ...o });
async function seedAdults() {
  await seedOwner();
  await seedGuardian('gran', 'edit');
  await seedGuardian('pal', 'edit');
  await seedGuardian('teacher', 'view');
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    // The adult data of the guardians themselves (own account, own game stats, own children)
    await setDoc(doc(db, 'users/gran'), user({ username: 'Abuela' }));
    await setDoc(doc(db, 'users/gran/games/mathmaster'), { totalGames: 7 });
    await setDoc(doc(db, 'users/gran/players/grankid01'), { username: 'Nieto', xp: 0, totalPoints: 0 });
    await setDoc(doc(db, 'users/pal'), user({ username: 'Papa' }));
    await setDoc(doc(db, 'users/pal/games/mathmaster'), { totalGames: 9 });
  });
}

test('B-PRIV-READ: guardians (edit and view) read the children players and their progress', async () => {
  await seedAdults();
  for (const uid of ['gran', 'teacher']) {
    const g = as(uid);
    const list = await assertSucceeds(getDocs(collection(g, 'users/own/players')));
    assert.equal(list.size, 1);
    await assertSucceeds(getDoc(doc(g, 'users/own/players/kid123abc')));
    await assertSucceeds(getDocs(collection(g, 'users/own/players/kid123abc/games')));
    await assertSucceeds(getDoc(doc(g, 'users/own/players/kid123abc/games/mathmaster')));
  }
});

test('B-PRIV-OWNER: a guardian never reads the owner own adult data', async () => {
  await seedAdults();
  for (const uid of ['gran', 'teacher']) {
    const g = as(uid);
    await assertFails(getDoc(doc(g, 'users/own')));
    await assertFails(getDoc(doc(g, 'users/own/games/mathmaster')));
    await assertFails(getDocs(collection(g, 'users/own/games')));
    await assertFails(getDocs(collection(g, 'users/own/memberships')));
    await assertFails(getDocs(collection(g, 'users/own/settings')));
    await assertFails(getDoc(doc(g, 'users/own/memberships/gran')));
    await assertFails(getDocs(collection(g, 'users/own/guardians')));
    await assertFails(getDocs(query(collection(g, 'users/own/guardians'), where('role', '==', 'edit'))));
  }
});

test('B-PRIV-GUARDIAN: a guardian never reads another guardian (profile, stats, membership, guardian doc)', async () => {
  await seedAdults();
  const g = as('gran');
  await assertFails(getDoc(doc(g, 'users/pal')));
  await assertFails(getDoc(doc(g, 'users/pal/games/mathmaster')));
  await assertFails(getDocs(collection(g, 'users/pal/games')));
  await assertFails(getDoc(doc(g, 'users/pal/memberships/own')));
  await assertFails(getDocs(collection(g, 'users/pal/memberships')));
  await assertFails(getDoc(doc(g, 'users/own/guardians/pal')));
  await assertFails(getDocs(query(collection(g, 'users/own/guardians'), where('uid', '==', 'pal'))));
  await assertFails(getDoc(doc(g, 'users/teacher')));
  // nobody writes into another guardian account
  await assertFails(setDoc(doc(g, 'users/pal/games/mathmaster'), { totalGames: 1 }));
  await assertFails(setDoc(doc(g, 'users/pal'), user()));
  await assertFails(deleteDoc(doc(g, 'users/own/guardians/pal')));
  // the owner does not read a guardian adult account either
  await assertFails(getDoc(doc(as('own'), 'users/gran')));
  await assertFails(getDoc(doc(as('own'), 'users/gran/games/mathmaster')));
  await assertFails(getDoc(doc(as('own'), 'users/gran/memberships/own')));
  // a guardian reads their own account and their own guardian doc
  await assertSucceeds(getDoc(doc(g, 'users/gran')));
  await assertSucceeds(getDoc(doc(g, 'users/gran/games/mathmaster')));
  await assertSucceeds(getDoc(doc(g, 'users/own/guardians/gran')));
});

test('B-PRIV-VIEW: a view guardian cannot write anything, PIN included', async () => {
  await seedAdults();
  const g = as('teacher');
  await assertFails(setDoc(doc(g, 'users/own/players/kid123abc/games/mathmaster'), { totalGames: 5 }));
  await assertFails(updateDoc(doc(g, 'users/own/players/kid123abc'), { xp: 1 }));
  await assertFails(updateDoc(doc(g, 'users/own/players/kid123abc'), { pin: PIN() }));
  await assertFails(setDoc(doc(g, 'users/own/players/newkid123'), { username: 'X', xp: 0, totalPoints: 0 }));
  await assertFails(deleteDoc(doc(g, 'users/own/players/kid123abc')));
});

test('B-PRIV-PIN: the PIN hash is writable only by the owner and edit guardians, and only as a well formed hash record', async () => {
  await seedAdults();
  const kid = 'users/own/players/kid123abc';
  await assertSucceeds(updateDoc(doc(as('own'), kid), { pin: PIN() }));
  await assertSucceeds(updateDoc(doc(as('gran'), kid), { pin: PIN({ salt: 'b3RoZXJzYWx0b3RoZXJzYWx0' }) }));
  await assertSucceeds(updateDoc(doc(as('gran'), kid), { pin: deleteField() }));
  await assertSucceeds(updateDoc(doc(as('own'), kid), { pin: PIN() }));
  await assertFails(updateDoc(doc(as('teacher'), kid), { pin: PIN() }));
  await assertFails(updateDoc(doc(as('teacher'), kid), { pin: deleteField() }));
  await assertFails(updateDoc(doc(as('stranger'), kid), { pin: PIN() }));
  await assertFails(updateDoc(doc(as('stranger'), kid), { pin: deleteField() }));
  await assertFails(updateDoc(doc(anon(), kid), { pin: PIN() }));
  // never a raw PIN or a malformed record
  const bad = ['1234', 1234, { pin: '1234' }, PIN({ hash: 'short' }), PIN({ salt: 'x' }), PIN({ iter: 5 }), PIN({ iter: 10000000 }), PIN({ iter: 1.5 }),
    PIN({ alg: 'plain' }), PIN({ v: 2 }), { ...PIN(), extra: 'x' }, { v: 1, alg: 'PBKDF2-SHA256', iter: 100000, salt: PIN().salt }, PIN({ hash: 'h'.repeat(65) })];
  for (const p of bad) {
    await assertFails(updateDoc(doc(as('own'), kid), { pin: p }));
    await assertFails(updateDoc(doc(as('gran'), kid), { pin: p }));
  }
  // stats updates by a guardian keep the PIN untouched
  await assertSucceeds(updateDoc(doc(as('gran'), kid), { xp: 5, totalPoints: 10 }));
  const snap = await assertSucceeds(getDoc(doc(as('own'), kid)));
  assert.equal(snap.data().pin.alg, 'PBKDF2-SHA256');
  assert.equal(snap.data().xp, 5);
});

test('B-INTERESTS: only ids of the fixed list, at most 5, no repeats, written by the owner and edit guardians only', async () => {
  await seedAdults();
  const kid = 'users/own/players/kid123abc';
  const ALL = ['dinosaurs', 'space', 'sports', 'animals', 'videogames', 'pirates', 'robots', 'magic', 'music', 'cooking', 'vehicles', 'nature', 'mystery', 'superheroes'];
  await assertSucceeds(updateDoc(doc(as('own'), kid), { interests: ['dinosaurs'] }));
  await assertSucceeds(updateDoc(doc(as('own'), kid), { interests: ALL.slice(0, 5) }));
  await assertSucceeds(updateDoc(doc(as('gran'), kid), { interests: ['space', 'music'] }));
  await assertSucceeds(updateDoc(doc(as('gran'), kid), { interests: [] }));
  await assertSucceeds(updateDoc(doc(as('gran'), kid), { interests: deleteField() }));
  for (const id of ALL) await assertSucceeds(updateDoc(doc(as('own'), kid), { interests: [id] }));
  // not allowed values
  const bad = [ALL.slice(0, 6), ALL, ['dinosaurs', 'dinosaurs'], ['football'], ['Dinosaurs'], ['dinosaurs', 'x'], [1], [null], ['dinosaurs', { a: 1 }],
    'dinosaurs', 5, { 0: 'dinosaurs' }, true, ['<script>']];
  for (const v of bad) {
    await assertFails(updateDoc(doc(as('own'), kid), { interests: v }));
    await assertFails(updateDoc(doc(as('gran'), kid), { interests: v }));
  }
  // nobody else writes them
  await assertFails(updateDoc(doc(as('teacher'), kid), { interests: ['space'] }));
  await assertFails(updateDoc(doc(as('teacher'), kid), { interests: deleteField() }));
  await assertFails(updateDoc(doc(as('stranger'), kid), { interests: ['space'] }));
  await assertFails(updateDoc(doc(anon(), kid), { interests: ['space'] }));
  // creating a player with interests follows the same rule, and the PIN keeps working next to them
  await assertSucceeds(setDoc(doc(as('own'), 'users/own/players/kid999abc'), { username: 'Sol', xp: 0, totalPoints: 0, interests: ['robots', 'music'] }));
  await assertFails(setDoc(doc(as('own'), 'users/own/players/kid888abc'), { username: 'Sol', xp: 0, totalPoints: 0, interests: ['robots', 'robots'] }));
  await assertSucceeds(updateDoc(doc(as('own'), kid), { interests: ['space'], pin: PIN() }));
  await assertFails(updateDoc(doc(as('own'), kid), { interests: ['space', 'x'], pin: PIN() }));
  // guardians (also view) read them, a stranger does not
  await assertSucceeds(getDoc(doc(as('teacher'), kid)));
  await assertFails(getDoc(doc(as('stranger'), kid)));
  const snap = await assertSucceeds(getDoc(doc(as('own'), kid)));
  assert.deepEqual(snap.data().interests, ['space']);
  // the adult own profile has no interests field: the adult document is unchanged by this rule
  await assertSucceeds(updateDoc(doc(as('own'), 'users/own'), { xp: 3 }));
});

test('B-PRIV-STRANGER: a signed in stranger and an anonymous visitor read nothing of a family', async () => {
  await seedAdults();
  await seedInvite();
  for (const db of [as('stranger'), anon(), asMail('other', 'otro@example.com')]) {
    await assertFails(getDoc(doc(db, 'users/own')));
    await assertFails(getDoc(doc(db, 'users/own/games/mathmaster')));
    await assertFails(getDoc(doc(db, 'users/own/players/kid123abc')));
    await assertFails(getDocs(collection(db, 'users/own/players')));
    await assertFails(getDoc(doc(db, 'users/own/players/kid123abc/games/mathmaster')));
    await assertFails(getDocs(collection(db, 'users/own/guardians')));
    await assertFails(getDoc(doc(db, 'users/own/guardians/gran')));
    await assertFails(getDoc(doc(db, 'users/gran/memberships/own')));
    await assertFails(getDoc(doc(db, 'users/gran')));
    await assertFails(getDoc(doc(db, 'invites/inv1')));
    await assertFails(updateDoc(doc(db, 'users/own/players/kid123abc'), { pin: PIN() }));
  }
});
