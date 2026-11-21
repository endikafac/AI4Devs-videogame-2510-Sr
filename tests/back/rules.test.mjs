import test, { before, after, beforeEach } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, addDoc, collection, deleteDoc, updateDoc, getDocs, serverTimestamp } from 'firebase/firestore';

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
