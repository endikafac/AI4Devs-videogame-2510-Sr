// The Firestore rules tests (tests/back/rules.test.mjs) ported to the Postgres
// policies of db/gameshub, one test per original test, same names.
//
// Mapping of "assertSucceeds / assertFails":
//   ok()    the statement works and does something (rows returned or touched)
//   fails() the statement raises (permission denied, policy or constraint)
//   none()  nothing happens (raises, or zero rows). In Postgres, RLS filters a
//           read or a write instead of raising, so Firestore's "denied" on a
//           read becomes "you see nothing", and a denied update touches 0 rows.
import assert from 'node:assert/strict';
import test, { before, after, beforeEach } from 'node:test';
import { openDb, reset, caller, uid, seedOwner, seedInvite, seedGuardian, seedAdults, INV, PIN, DAILY, PERMISSIONS } from './harness.mjs';

let db;
before(async () => { db = await openDb(); });
after(async () => { await db.close(); });
beforeEach(async () => { await reset(db); });

const as = (who, o) => caller(db, who, o);
const anon = () => caller(db, null);
const asMail = (who, email, verified = true) => caller(db, who, { email, verified });
const adult = (who, name = 'Luna') => db.query('insert into gameshub.adults (id, username) values ($1, $2)', [uid(who), name]);
const count = async (sql, params) => Number((await db.query(sql, params)).rows[0].n);

const EV = (o = {}) => ({ type: 'visit', game: 'hub', lang: 'es', auth: false, first: true, ...o });
const insEvent = (c, o) => { const e = EV(o); return c.ok('insert into gameshub.analytics_events (type, game, lang, auth, "first") values ($1,$2,$3,$4,$5)', [e.type, e.game, e.lang, e.auth, e.first]); };
const insEventBad = (c, o) => { const e = EV(o); return c.fails('insert into gameshub.analytics_events (type, game, lang, auth, "first") values ($1,$2,$3,$4,$5)', [e.type, e.game, e.lang, e.auth, e.first]); };

// ---- analytics (AN-1, AN-2, AN-3) ----
test('B-EVENT: anyone can create a valid anonymous event', async () => {
  await insEvent(anon());
  await insEvent(as('u1'), { type: 'play', game: 'vocabMaster', lang: 'fr', auth: true });
  assert.equal(await count('select count(*) n from gameshub.analytics_events'), 2);
});

test('B-EVENT-FIELDS: events with extra, personal or malformed fields are rejected', async () => {
  const c = anon();
  await c.fails('insert into gameshub.analytics_events (type, game, lang, auth, "first", uid) values ($1,$2,$3,$4,$5,$6)', ['visit', 'hub', 'es', false, true, 'u1']);  // no such column
  await c.fails('insert into gameshub.analytics_events (type, game, lang, auth, "first", email) values ($1,$2,$3,$4,$5,$6)', ['visit', 'hub', 'es', false, true, 'a@b.c']);
  await insEventBad(c, { type: 'hack' });
  await insEventBad(c, { lang: 'xx' });
  await insEventBad(c, { game: 'x'.repeat(25) });
  await c.fails(`insert into gameshub.analytics_events (type, game, lang, auth, "first") values ('visit','hub','es','maybe',true)`);   // Postgres reads 'yes' as true, Firestore did not: only what it cannot read is refused
  // the timestamp is the server's: a client value is refused (column not granted)
  await c.fails(`insert into gameshub.analytics_events (ts, type, game, lang, auth, "first") values ('2020-01-01','visit','hub','es',false,true)`);
  await c.fails(`insert into gameshub.analytics_events (id, type, game, lang, auth, "first") values (99,'visit','hub','es',false,true)`);
  assert.equal(await count('select count(*) n from gameshub.analytics_events'), 0);
});

test('B-EVENT-READ: only admins can read analytics', async () => {
  await db.query(`insert into gameshub.analytics_events (type, game, lang, auth, "first") values ('visit','hub','es',false,true)`);
  await db.query('insert into gameshub.admins (user_id) values ($1)', [uid('boss')]);
  await anon().fails('select * from gameshub.analytics_events');
  await as('u1').none('select * from gameshub.analytics_events');
  await as('boss').ok('select * from gameshub.analytics_events');
});

test('B-EVENT-IMMUTABLE: events cannot be updated or deleted, admins cannot be self-made', async () => {
  await db.query(`insert into gameshub.analytics_events (type, game, lang, auth, "first") values ('visit','hub','es',false,true)`);
  await db.query('insert into gameshub.admins (user_id) values ($1)', [uid('boss')]);
  await as('boss').fails('update gameshub.analytics_events set "first" = false');
  await as('boss').fails('delete from gameshub.analytics_events');
  await as('u1').fails('insert into gameshub.admins (user_id) values ($1)', [uid('u1')]);
  await as('boss').ok('select * from gameshub.admins');
  await as('u1').none('select * from gameshub.admins where user_id = $1', [uid('boss')]);
  assert.equal(await count('select count(*) n from gameshub.analytics_events'), 1);
});

// ---- users and children (SEC-1) ----
test('B-USERS: a user reads and writes only their own profile', async () => {
  await as('u1').ok(`insert into gameshub.adults (id, username, xp, total_points) values ($1, 'Luna', 0, 0)`, [uid('u1')]);
  await as('u1').ok('select * from gameshub.adults where id = $1', [uid('u1')]);
  await as('u2').none('select * from gameshub.adults where id = $1', [uid('u1')]);
  await as('u2').fails(`insert into gameshub.adults (id, username) values ($1, 'Luna')`, [uid('u1')]);
  await as('u2').none(`update gameshub.adults set username = 'Hack' where id = $1`, [uid('u1')]);
  await as('u2').none('delete from gameshub.adults where id = $1', [uid('u1')]);
  await anon().fails('select * from gameshub.adults');
  assert.equal((await db.query('select username from gameshub.adults')).rows[0].username, 'Luna');
});

test('B-USERS: invalid profile data is rejected', async () => {
  await as('u1').fails(`insert into gameshub.adults (id, username, xp) values ($1, 'Luna', -1)`, [uid('u1')]);
  await as('u1').fails(`insert into gameshub.adults (id, username, total_points) values ($1, 'Luna', -3)`, [uid('u1')]);
  await as('u1').fails('insert into gameshub.adults (id, username) values ($1, $2)', [uid('u1'), 'x'.repeat(41)]);
  await as('u1').fails(`insert into gameshub.adults (id, username, xp) values ($1, 'X', 'lots')`, [uid('u1')]);
  // the id of the profile can never be changed
  await as('u1').ok(`insert into gameshub.adults (id, username) values ($1, 'Luna')`, [uid('u1')]);
  await as('u1').fails('update gameshub.adults set id = $2 where id = $1', [uid('u1'), uid('u2')]);
});

test('B-USERS: child players and their stats are owner only', async () => {
  await adult('u1');
  await as('u1').ok(`insert into gameshub.players (pid, owner_id, username, avatar) values ('pipo123', $1, 'Pipo', 'fox')`, [uid('u1')]);
  await as('u1').ok(`insert into gameshub.player_game_stats (owner_id, pid, game, stats) values ($1, 'pipo123', 'mathmaster', '{"totalGames":1}')`, [uid('u1')]);
  await as('u2').none(`select * from gameshub.players where pid = 'pipo123'`);
  await as('u2').none(`select * from gameshub.player_game_stats where pid = 'pipo123'`);
  await anon().fails(`select * from gameshub.players`);
  await as('u1').ok(`select * from gameshub.players where pid = 'pipo123'`);
});

// ---- nicknames (SEC-2) ----
test('B-NICK: nicknames are unique, gettable but not listable, never overwritten', async () => {
  await adult('u1'); await adult('u2');
  await as('u1').ok(`insert into gameshub.nicknames (key, owner_id) values ('pipo', $1)`, [uid('u1')]);
  // "get" for anyone signed in: through nickname_available(); "list": nothing but their own rows
  assert.equal((await as('u2').rows(`select gameshub.nickname_available('pipo') a`))[0].a, false);
  assert.equal((await as('u2').rows(`select gameshub.nickname_available('luna') a`))[0].a, true);
  await as('u2').none('select * from gameshub.nicknames');
  await anon().fails('select * from gameshub.nicknames');
  await as('u2').fails(`insert into gameshub.nicknames (key, owner_id) values ('pipo', $1)`, [uid('u2')]);   // taken
  await as('u2').fails(`insert into gameshub.nicknames (key, owner_id) values ('luna', $1)`, [uid('u1')]);   // for somebody else
  await as('u1').fails(`update gameshub.nicknames set owner_id = $1 where key = 'pipo'`, [uid('u2')]);        // never overwritten
  await as('u2').none(`delete from gameshub.nicknames where key = 'pipo'`);
  assert.equal(await count('select count(*) n from gameshub.nicknames'), 1);
  await as('u1').ok(`delete from gameshub.nicknames where key = 'pipo'`);
  assert.equal(await count('select count(*) n from gameshub.nicknames'), 0);
});

// ---- leaderboard (SEC-3) ----
const score = (c, game, owner, pid, pts, name = 'Luna') =>
  c.run(`insert into gameshub.leaderboard (game, owner_id, pid, username, total_points) values ($1,$2,$3,$4,$5)
         on conflict (game, owner_id, pid) do update set username = excluded.username, total_points = excluded.total_points`,
        [game, uid(owner), pid, name, pts]);

test('B-LEADER: only the owner writes a score, adult or child id', async () => {
  await adult('u1'); await adult('u2');
  await score(as('u1'), 'mathmaster', 'u1', '', 10);
  await score(as('u1'), 'mathmaster', 'u1', 'abc123xyz', 10);
  await assert.rejects(score(as('u2'), 'mathmaster', 'u1', '', 10));
  await assert.rejects(score(as('u1'), 'mathmaster', 'u1', '', -5));
  await assert.rejects(score(as('u1'), 'mathmaster', 'u2', '', 10));                       // uid of somebody else
  await as('u2').ok(`select * from gameshub.leaderboard where owner_id = $1`, [uid('u1')]);
  await anon().fails('select * from gameshub.leaderboard');
  // update of someone else's row
  await as('u2').none(`update gameshub.leaderboard set total_points = 0 where owner_id = $1`, [uid('u1')]);
  assert.equal(await count('select count(*) n from gameshub.leaderboard'), 2);
});

test('B-DEFAULT: unknown tables and functions are denied', async () => {
  await db.exec('create table gameshub.secrets (a int); insert into gameshub.secrets values (1); create table public.secrets2 (a int)');
  await db.exec("create function gameshub.leak() returns int language sql as 'select 1'");
  // closed after the permissions are applied again (every migrate run does it)
  for (const p of PERMISSIONS()) await db.exec(p.sql);
  await as('u1').fails('select * from gameshub.secrets');
  await as('u1').fails('insert into gameshub.secrets values (2)');
  await as('u1').fails('select * from public.secrets2');
  await as('u1').fails('select gameshub.leak()');
  await anon().fails('select gameshub.leak()');
  await anon().fails('select gameshub.accept_invite($1)', [INV]);
  await db.exec('drop table gameshub.secrets; drop table public.secrets2; drop function gameshub.leak()');
});

// Regression: a brand new adult saving nickname + consent (no xp yet) must work, in one transaction with the nickname claim.
test('B-CLAIM: first-time identity save (nickname + profile without xp) succeeds and a duplicate is refused', async () => {
  const consent = JSON.stringify({ version: 1, at: new Date().toISOString(), guardian: true });
  await as('u1').any(`select gameshub.claim_identity('Endika', 'endika', 'fox', $1::jsonb, null)`, [consent]);
  const r = (await db.query('select username, nickname_key, avatar, consent from gameshub.adults where id = $1', [uid('u1')])).rows[0];
  assert.equal(r.username, 'Endika'); assert.equal(r.nickname_key, 'endika'); assert.equal(r.consent.guardian, true);
  // somebody else cannot take it, and nothing of theirs is saved
  const e = await as('u2').fails(`select gameshub.claim_identity('Other', 'endika', 'cat', $1::jsonb, null)`, [consent]);
  assert.match(e.message, /taken/);
  assert.equal(await count('select count(*) n from gameshub.adults where username = $1', ['Other']), 0);
  // the same adult can claim again (no change) and rename, releasing the old key
  await as('u1').any(`select gameshub.claim_identity('Endika', 'endika', 'fox', $1::jsonb, null)`, [consent]);
  await as('u1').any(`select gameshub.claim_identity('Nuevo', 'nuevo', 'fox', $1::jsonb, 'endika')`, [consent]);
  assert.deepEqual((await db.query('select key from gameshub.nicknames order by key')).rows.map(x => x.key), ['nuevo']);
  await as('u2').any(`select gameshub.claim_identity('E', 'endika', 'cat', $1::jsonb, null)`, [consent]);  // now free
  await as('u2').fails(`insert into gameshub.adults (id, username, xp) values ($1, 'X', 'lots')`, [uid('u9')]);
});

// ---- family accounts (docs/cuenta-familiar.md) ----
const newInvite = (c, o = {}) => {
  const v = { owner: 'own', name: 'Luna', email: 'abuela@example.com', role: 'edit', expires: "now() + interval '30 days'", ...o };
  return c.run(`insert into gameshub.invites (owner_id, owner_name, email, role, expires) values ($1, $2, $3, $4, ${v.expires}) returning id`,
    [uid(v.owner), v.name, v.email, v.role]);
};
const accept = (c, id = INV, name = 'Abuela') => c.run('select gameshub.accept_invite($1::uuid, $2)', [id, name]);

test('B-FAM-INVITE: the owner creates an invitation; a third party cannot read, list or delete it', async () => {
  await seedOwner(db);
  const r = await newInvite(as('own'));
  const id = r.rows[0].id;
  await as('other').none('select * from gameshub.invites where id = $1', [id]);
  await asMail('other', 'otro@example.com').none('select * from gameshub.invites where id = $1', [id]);
  await asMail('other', 'otro@example.com').none('delete from gameshub.invites where id = $1', [id]);
  await asMail('other', 'otro@example.com').none(`select * from gameshub.invites where email = 'abuela@example.com'`);
  await as('own').ok('select * from gameshub.invites where id = $1', [id]);
  assert.equal(await count('select count(*) n from gameshub.invites'), 1);
});

test('B-FAM-INVITE: invalid invitations are refused', async () => {
  await seedOwner(db);
  const d = as('own');
  await assert.rejects(newInvite(d, { owner: 'someone' }));
  await assert.rejects(newInvite(d, { role: 'owner' }));
  await assert.rejects(newInvite(d, { email: 'Abuela@Example.com' }));
  await assert.rejects(newInvite(d, { email: 'no-es-un-mail' }));
  await assert.rejects(newInvite(d, { email: 'a'.repeat(250) + '@b.co' }));
  await assert.rejects(newInvite(d, { expires: "now() - interval '1 day'" }));
  await assert.rejects(newInvite(d, { expires: "now() + interval '90 days'" }));
  await assert.rejects(newInvite(d, { name: 'Otra persona' }));
  await d.fails(`insert into gameshub.invites (owner_id, owner_name, email, role, expires, extra) values ($1,'Luna','a@b.co','edit', now() + interval '1 day', 1)`, [uid('own')]);
  // a client cannot choose the creation time or the id
  await d.fails(`insert into gameshub.invites (owner_id, owner_name, email, role, expires, created_at) values ($1,'Luna','a@b.co','edit', now() + interval '1 day', now() - interval '60 days')`, [uid('own')]);
  await d.fails(`insert into gameshub.invites (id, owner_id, owner_name, email, role, expires) values (gen_random_uuid(), $1,'Luna','a@b.co','edit', now() + interval '1 day')`, [uid('own')]);
  // an adult with no profile yet (no name to check against)
  await assert.rejects(newInvite(as('ghost'), { owner: 'ghost' }));
  assert.equal(await count('select count(*) n from gameshub.invites'), 0);
});

test('B-FAM-INVITE: invitations are never updated', async () => {
  await seedOwner(db); await seedInvite(db);
  await as('own').fails(`update gameshub.invites set role = 'view'`);
  await as('own').ok('delete from gameshub.invites where id = $1', [INV]);
});

test('B-FAM-ACCEPT: the invited verified e-mail lists, accepts and becomes a guardian', async () => {
  await seedOwner(db); await seedInvite(db);
  const g = asMail('gran', 'Abuela@Example.com');
  const q = await g.rows(`select * from gameshub.invites where email = 'abuela@example.com'`);
  assert.equal(q.length, 1);
  assert.equal(q[0].owner_name, 'Luna');
  await accept(g);
  assert.equal(await count('select count(*) n from gameshub.invites'), 0);       // consumed
  const m = await g.rows('select * from gameshub.memberships');
  assert.equal(m.length, 1); assert.equal(m[0].owner_name, 'Luna'); assert.equal(m[0].role, 'edit');
  await g.ok('select * from gameshub.guardians where owner_id = $1', [uid('own')]);
  await g.ok('select * from gameshub.players where owner_id = $1', [uid('own')]);
});

test('B-FAM-ACCEPT: another e-mail, unverified e-mail, or expired invitation cannot accept', async () => {
  await seedOwner(db); await seedInvite(db);
  await assert.rejects(accept(asMail('x', 'otro@example.com')));
  await assert.rejects(accept(asMail('x', 'abuela@example.com', false)));
  await assert.rejects(accept(as('x')));                                          // no e-mail in the token
  await assert.rejects(accept(anon()));
  await assert.rejects(accept(asMail('own', 'abuela@example.com')), /own invite/); // the owner cannot accept their own
  await db.query('delete from gameshub.invites');
  await seedInvite(db, INV, { created: "now() - interval '10 days'", expires: "now() - interval '1 day'" });
  await assert.rejects(accept(asMail('gran', 'abuela@example.com')), /expired/);
  assert.equal(await count('select count(*) n from gameshub.guardians'), 0);
  assert.equal(await count('select count(*) n from gameshub.invites'), 1);
});

test('B-FAM-ACCEPT: the role comes from the invitation, nobody creates a guardian for someone else or for free', async () => {
  await seedOwner(db); await seedInvite(db, INV, { role: 'view' });
  const g = asMail('gran', 'abuela@example.com');
  const row = (who, o = {}) => [uid('own'), uid(who), 'abuela@example.com', 'view', ...(o.extra || [])];
  await g.fails(`insert into gameshub.guardians (owner_id, guardian_id, email, role) values ($1,$2,$3,$4)`, row('gran'));
  await g.fails(`insert into gameshub.guardians (owner_id, guardian_id, email, role) values ($1,$2,$3,$4)`, row('other'));
  await as('own').fails(`insert into gameshub.guardians (owner_id, guardian_id, email, role) values ($1,$2,$3,$4)`, row('friend'));
  await g.fails(`insert into gameshub.guardians (owner_id, guardian_id, email, role, extra) values ($1,$2,$3,$4,1)`, row('gran'));
  await g.fails(`insert into gameshub.memberships (owner_id, owner_name, role) values ($1, 'Luna', 'view')`, [uid('own')]);
  await assert.rejects(accept(g, '00000000-0000-4000-8000-0000000000ff'));         // an invitation that does not exist
  assert.equal(await count('select count(*) n from gameshub.guardians'), 0);
  await accept(g);
  assert.equal((await db.query('select role from gameshub.guardians')).rows[0].role, 'view');
  // the owner cannot grant themself or anyone a role afterwards
  await as('own').fails(`update gameshub.guardians set role = 'edit'`);
  await g.fails(`update gameshub.guardians set role = 'edit'`);
});

test('B-FAM-EDIT: an edit guardian reads and writes players, not the owner profile, nor deletes a player', async () => {
  await seedOwner(db); await seedGuardian(db, 'gran', 'edit');
  const g = as('gran');
  await g.ok(`select * from gameshub.players where pid = 'kid123abc'`);
  await g.ok(`select * from gameshub.players where owner_id = $1`, [uid('own')]);
  await g.ok(`select * from gameshub.player_game_stats where pid = 'kid123abc'`);
  await g.ok(`update gameshub.player_game_stats set stats = '{"totalGames":2}' where pid = 'kid123abc'`);
  await g.ok(`insert into gameshub.player_game_stats (owner_id, pid, game, stats) values ($1,'kid123abc','snake','{}')`, [uid('own')]);
  await g.ok(`update gameshub.players set xp = 5, total_points = 10 where pid = 'kid123abc'`);
  await g.ok(`insert into gameshub.players (pid, owner_id, username) values ('newkid123', $1, 'Nuevo')`, [uid('own')]);
  await g.none(`delete from gameshub.players where pid = 'kid123abc'`);
  await g.none(`delete from gameshub.player_game_stats where pid = 'kid123abc'`);
  await g.none('select * from gameshub.adults where id = $1', [uid('own')]);
  await g.none(`update gameshub.adults set username = 'Hack' where id = $1`, [uid('own')]);
  await g.none('select * from gameshub.adult_game_stats where owner_id = $1', [uid('own')]);
  await g.fails(`insert into gameshub.adult_game_stats (owner_id, game, stats) values ($1,'mathmaster','{}')`, [uid('own')]);
  await g.fails(`insert into gameshub.guardians (owner_id, guardian_id, email, role) values ($1,$2,'gran@example.com','edit')`, [uid('own'), uid('gran')]);
  await g.fails(`insert into gameshub.guardians (owner_id, guardian_id, email, role) values ($1,$2,'pal@example.com','edit')`, [uid('own'), uid('pal')]);
  await g.fails(`update gameshub.guardians set role = 'edit'`);
  // a guardian cannot move a child to their own account (the keys never change)
  await g.fails(`update gameshub.players set owner_id = $1 where pid = 'kid123abc'`, [uid('gran')]);
  await g.fails(`update gameshub.players set pid = 'stolen123' where pid = 'kid123abc'`);
  await as('own').ok(`delete from gameshub.players where pid = 'kid123abc'`);
});

test('B-FAM-VIEW: a view guardian only reads', async () => {
  await seedOwner(db); await seedGuardian(db, 'teacher', 'view');
  const g = as('teacher');
  await g.ok(`select * from gameshub.players where pid = 'kid123abc'`);
  await g.ok(`select * from gameshub.player_game_stats where pid = 'kid123abc'`);
  await g.none(`update gameshub.player_game_stats set stats = '{"totalGames":2}'`);
  await g.fails(`insert into gameshub.player_game_stats (owner_id, pid, game, stats) values ($1,'kid123abc','snake','{}')`, [uid('own')]);
  await g.none(`update gameshub.players set xp = 5`);
  await g.none(`delete from gameshub.players`);
  await g.none('select * from gameshub.adults where id = $1', [uid('own')]);
  assert.equal(await count(`select count(*) n from gameshub.players where xp = 5`), 0);
});

test('B-FAM-REVOKE: removing the guardian cuts access at once; the guardian can also leave', async () => {
  await seedOwner(db); await seedGuardian(db, 'gran', 'edit'); await seedGuardian(db, 'pal', 'view');
  await as('gran').ok(`select * from gameshub.players where pid = 'kid123abc'`);
  await as('own').ok('delete from gameshub.guardians where guardian_id = $1', [uid('gran')]);
  await as('gran').none(`select * from gameshub.players where pid = 'kid123abc'`);
  await as('gran').fails(`insert into gameshub.player_game_stats (owner_id, pid, game, stats) values ($1,'kid123abc','snake','{}')`, [uid('own')]);
  await as('gran').none(`update gameshub.player_game_stats set stats = '{"totalGames":2}'`);
  await as('pal').none('delete from gameshub.guardians where guardian_id = $1', [uid('gran')]);   // not theirs (and already gone)
  await as('pal').ok('delete from gameshub.guardians where guardian_id = $1', [uid('pal')]);        // leaving a family
  await as('pal').none('select * from gameshub.memberships');
  await as('pal').none(`select * from gameshub.players where pid = 'kid123abc'`);
});

test('B-FAM-OTHER: a guardian of another family, or a stranger, has no access', async () => {
  await seedOwner(db); await seedGuardian(db, 'gran', 'edit');
  await db.query(`insert into gameshub.adults (id, username) values ($1, 'Otra')`, [uid('own2')]);
  await db.query(`insert into gameshub.players (pid, owner_id, username) values ('kid999zzz', $1, 'Otro')`, [uid('own2')]);
  await as('gran').none(`select * from gameshub.players where pid = 'kid999zzz'`);
  await as('gran').fails(`insert into gameshub.players (pid, owner_id, username) values ('kid999zzz', $1, 'X')`, [uid('own2')]);
  await as('gran').none(`update gameshub.players set username = 'X' where pid = 'kid999zzz'`);
  await as('stranger').none(`select * from gameshub.players where pid = 'kid123abc'`);
  await as('stranger').none('select * from gameshub.guardians');
  await as('own').ok('select * from gameshub.guardians');
  const mine = await as('gran').rows('select guardian_id from gameshub.guardians');
  assert.deepEqual(mine.map(r => r.guardian_id), [uid('gran')]);
});

test('B-FAM-MEMBER: memberships are private, immutable and cannot be forged', async () => {
  await seedOwner(db); await seedGuardian(db, 'gran', 'edit');
  assert.equal((await as('gran').rows('select * from gameshub.memberships')).length, 1);
  await as('own').none('select * from gameshub.memberships');
  await as('gran').fails(`update gameshub.memberships set role = 'view'`);
  await as('forger').fails(`insert into gameshub.memberships (owner_id, owner_name, role) values ($1,'Luna','edit')`, [uid('own')]);
  await as('own').fails(`insert into gameshub.memberships (owner_id, owner_name, role) values ($1,'Luna','edit')`, [uid('own')]);
  await as('own').fails(`insert into gameshub.guardians (owner_id, guardian_id, email, role) values ($1,$2,'x@example.com','edit')`, [uid('own'), uid('forger')]);
});

test('B-FAM-OWNER: the owner cannot forge guardians or memberships through any generic path', async () => {
  await seedOwner(db);
  await as('own').fails(`insert into gameshub.guardians (owner_id, guardian_id, email, role) values ($1,$2,'f@example.com','edit')`, [uid('own'), uid('fake')]);
  await as('own').fails(`insert into gameshub.memberships (owner_id, owner_name, role) values ($1,'Luna','edit')`, [uid('own')]);
  await as('own').ok(`insert into gameshub.adult_game_stats (owner_id, game, stats) values ($1,'snake','{"totalGames":1}')`, [uid('own')]);
});

test('B-FAM-LEADER: only an edit guardian writes a child score, under the owner uid', async () => {
  await seedOwner(db); await seedGuardian(db, 'gran', 'edit'); await seedGuardian(db, 'teacher', 'view');
  await db.query(`insert into gameshub.adults (id, username) values ($1, 'Abuela')`, [uid('gran')]);
  await score(as('gran'), 'mathmaster', 'own', 'kid123abc', 10, 'Pipo');
  await score(as('gran'), 'mathmaster', 'own', 'kid123abc', 20, 'Pipo');                    // update
  assert.equal(await count(`select count(*) n from gameshub.leaderboard where owner_id = $1 and pid = 'kid123abc'`, [uid('own')]), 1);
  await assert.rejects(score(as('gran'), 'mathmaster', 'own', '', 10));                     // an adult row of the owner
  await assert.rejects(score(as('gran'), 'mathmaster', 'own', 'kid123abc', -1));
  await assert.rejects(score(as('teacher'), 'mathmaster', 'own', 'kid123abc', 10));
  await assert.rejects(score(as('stranger'), 'mathmaster', 'own', 'kid123abc', 10));
  await as('gran').none(`delete from gameshub.leaderboard where pid = 'kid123abc'`);
  await as('own').ok(`delete from gameshub.leaderboard where pid = 'kid123abc'`);
});

test('B-FAM-REPLAY: an invitation cannot be accepted twice, nor after a revocation, and acceptance is atomic', async () => {
  await seedOwner(db); await seedInvite(db);
  const g = asMail('gran', 'abuela@example.com');
  // atomic: if creating the guardian fails, the invitation is NOT consumed
  await db.exec(`create function gameshub.boom() returns trigger language plpgsql as $$ begin raise exception 'boom'; end $$;
                 create trigger boom before insert on gameshub.guardians for each row execute function gameshub.boom()`);
  await assert.rejects(accept(g), /boom/);
  assert.equal(await count('select count(*) n from gameshub.invites'), 1);
  await db.exec('drop trigger boom on gameshub.guardians');
  await accept(g);
  assert.equal(await count('select count(*) n from gameshub.invites'), 0);
  await assert.rejects(accept(g), /not available/);                                          // replay
  await as('own').ok('delete from gameshub.guardians where guardian_id = $1', [uid('gran')]);
  await assert.rejects(accept(g), /not available/);                                          // after a revocation
  assert.equal(await count('select count(*) n from gameshub.guardians'), 0);
});

// ---- privacy between adults and children, and the profile PIN (docs/cuenta-familiar.md) ----
test('B-PRIV-READ: guardians (edit and view) read the children players and their progress', async () => {
  await seedAdults(db);
  for (const who of ['gran', 'teacher']) {
    const g = as(who);
    assert.equal((await g.rows('select * from gameshub.players where owner_id = $1', [uid('own')])).length, 1);
    await g.ok(`select * from gameshub.players where pid = 'kid123abc'`);
    await g.ok(`select * from gameshub.player_game_stats where pid = 'kid123abc'`);
    await g.ok(`select * from gameshub.player_game_stats where pid = 'kid123abc' and game = 'mathmaster'`);
  }
});

test('B-PRIV-OWNER: a guardian never reads the owner own adult data', async () => {
  await seedAdults(db);
  for (const who of ['gran', 'teacher']) {
    const g = as(who);
    await g.none('select * from gameshub.adults where id = $1', [uid('own')]);
    await g.none('select * from gameshub.adult_game_stats where owner_id = $1', [uid('own')]);
    await g.none(`select * from gameshub.adult_game_stats where game = 'mathmaster' and owner_id = $1`, [uid('own')]);
    await g.none('select * from gameshub.invites');
    await g.none('select * from gameshub.nicknames');
    // the guardians of the family: only their own row, never the others
    const rows = await g.rows('select guardian_id from gameshub.guardians where owner_id = $1', [uid('own')]);
    assert.deepEqual(rows.map(r => r.guardian_id), [uid(who)]);
    await g.none(`select * from gameshub.guardians where role = 'edit' and guardian_id <> $1`, [uid(who)]);
  }
});

test('B-PRIV-GUARDIAN: a guardian never reads another guardian (profile, stats, membership, guardian doc)', async () => {
  await seedAdults(db);
  const g = as('gran');
  await g.none('select * from gameshub.adults where id = $1', [uid('pal')]);
  await g.none('select * from gameshub.adult_game_stats where owner_id = $1', [uid('pal')]);
  await g.none('select * from gameshub.guardians where guardian_id = $1', [uid('pal')]);
  await g.none('select * from gameshub.guardians where guardian_id = $1', [uid('teacher')]);
  await g.none('select * from gameshub.adults where id = $1', [uid('teacher')]);
  // nobody writes into another guardian account
  await g.none(`update gameshub.adult_game_stats set stats = '{"totalGames":1}' where owner_id = $1`, [uid('pal')]);
  await g.fails(`insert into gameshub.adult_game_stats (owner_id, game, stats) values ($1,'snake','{}')`, [uid('pal')]);
  await g.none(`update gameshub.adults set username = 'Hack' where id = $1`, [uid('pal')]);
  await g.fails(`insert into gameshub.adults (id, username) values ($1, 'X')`, [uid('newbie')]);
  await g.none('delete from gameshub.guardians where guardian_id = $1', [uid('pal')]);
  // the owner does not read a guardian adult account either
  await as('own').none('select * from gameshub.adults where id = $1', [uid('gran')]);
  await as('own').none('select * from gameshub.adult_game_stats where owner_id = $1', [uid('gran')]);
  await as('own').none('select * from gameshub.players where owner_id = $1', [uid('gran')]);
  // a guardian reads their own account, their own stats, their own guardian row and their own children
  await g.ok('select * from gameshub.adults where id = $1', [uid('gran')]);
  await g.ok('select * from gameshub.adult_game_stats where owner_id = $1', [uid('gran')]);
  await g.ok('select * from gameshub.guardians where guardian_id = $1', [uid('gran')]);
  await g.ok(`select * from gameshub.players where pid = 'grankid01'`);
  // and the other guardian does not read those children
  await as('pal').none(`select * from gameshub.players where pid = 'grankid01'`);
});

test('B-PRIV-VIEW: a view guardian cannot write anything, PIN included', async () => {
  await seedAdults(db);
  const g = as('teacher');
  await g.fails(`insert into gameshub.player_game_stats (owner_id, pid, game, stats) values ($1,'kid123abc','snake','{"totalGames":5}')`, [uid('own')]);
  await g.none(`update gameshub.player_game_stats set stats = '{"totalGames":5}'`);
  await g.none(`update gameshub.players set xp = 1 where pid = 'kid123abc'`);
  await g.none(`update gameshub.players set pin = $1::jsonb where pid = 'kid123abc'`, [JSON.stringify(PIN())]);
  await g.fails(`insert into gameshub.players (pid, owner_id, username) values ('newkid123', $1, 'X')`, [uid('own')]);
  await g.none(`delete from gameshub.players where pid = 'kid123abc'`);
  assert.equal(await count(`select count(*) n from gameshub.players where pin is not null`), 0);
});

test('B-PRIV-PIN: the PIN hash is writable only by the owner and edit guardians, and only as a well formed hash record', async () => {
  await seedAdults(db);
  const setPin = (c, p) => c.ok(`update gameshub.players set pin = $1::jsonb where pid = 'kid123abc'`, [JSON.stringify(p)]);
  await setPin(as('own'), PIN());
  await setPin(as('gran'), PIN({ salt: 'b3RoZXJzYWx0b3RoZXJzYWx0' }));
  await as('gran').ok(`update gameshub.players set pin = null where pid = 'kid123abc'`);
  await setPin(as('own'), PIN());
  await as('teacher').none(`update gameshub.players set pin = $1::jsonb where pid = 'kid123abc'`, [JSON.stringify(PIN())]);
  await as('teacher').none(`update gameshub.players set pin = null where pid = 'kid123abc'`);
  await as('stranger').none(`update gameshub.players set pin = $1::jsonb where pid = 'kid123abc'`, [JSON.stringify(PIN())]);
  await as('stranger').none(`update gameshub.players set pin = null where pid = 'kid123abc'`);
  await anon().fails(`update gameshub.players set pin = $1::jsonb where pid = 'kid123abc'`, [JSON.stringify(PIN())]);
  assert.equal(await count(`select count(*) n from gameshub.players where pin is not null`), 1);
  // never a raw PIN or a malformed record
  const { v, alg, iter, salt } = PIN();
  const bad = ['1234', 1234, { pin: '1234' }, PIN({ hash: 'short' }), PIN({ salt: 'x' }), PIN({ iter: 5 }), PIN({ iter: 10000000 }), PIN({ iter: 1.5 }),
    PIN({ iter: '100000' }), PIN({ alg: 'plain' }), PIN({ v: 2 }), PIN({ v: '1' }), { ...PIN(), extra: 'x' }, { v, alg, iter, salt }, PIN({ hash: 'h'.repeat(65) }),
    PIN({ salt: 's'.repeat(33) }), PIN({ salt: 5 }), [PIN()], true];
  for (const p of bad) {
    await as('own').fails(`update gameshub.players set pin = $1::jsonb where pid = 'kid123abc'`, [JSON.stringify(p)]);
    await as('gran').fails(`update gameshub.players set pin = $1::jsonb where pid = 'kid123abc'`, [JSON.stringify(p)]);
  }
  // stats updates by a guardian keep the PIN untouched
  await as('gran').ok(`update gameshub.players set xp = 5, total_points = 10 where pid = 'kid123abc'`);
  const r = (await as('own').rows(`select pin, xp from gameshub.players where pid = 'kid123abc'`))[0];
  assert.equal(r.pin.alg, 'PBKDF2-SHA256');
  assert.equal(Number(r.xp), 5);
});

test('B-INTERESTS: only ids of the fixed list, at most 5, no repeats, written by the owner and edit guardians only', async () => {
  await seedAdults(db);
  const ALL = ['dinosaurs', 'space', 'sports', 'animals', 'videogames', 'pirates', 'robots', 'magic', 'music', 'cooking', 'vehicles', 'nature', 'mystery', 'superheroes'];
  const set = (c, v) => c.run(`update gameshub.players set interests = $1::text[] where pid = 'kid123abc'`, [v]);
  const okSet = async (c, v) => { const r = await set(c, v); assert.equal(r.affectedRows, 1); };
  await okSet(as('own'), ['dinosaurs']);
  await okSet(as('own'), ALL.slice(0, 5));
  await okSet(as('gran'), ['space', 'music']);
  await okSet(as('gran'), []);
  await okSet(as('gran'), null);
  for (const id of ALL) await okSet(as('own'), [id]);
  // not allowed values
  const bad = [ALL.slice(0, 6), ALL, ['dinosaurs', 'dinosaurs'], ['football'], ['Dinosaurs'], ['dinosaurs', 'x'], ['1'], [null], ['dinosaurs', null], ['<script>'], [''], ['dinosaurs '], [' dinosaurs']];
  for (const v of bad) {
    await assert.rejects(set(as('own'), v), String(JSON.stringify(v)));
    await assert.rejects(set(as('gran'), v), String(JSON.stringify(v)));
  }
  // a non-list value cannot even be sent to a text[] column
  await as('own').fails(`update gameshub.players set interests = 'dinosaurs' where pid = 'kid123abc'`);
  await as('own').fails(`update gameshub.players set interests = '5' where pid = 'kid123abc'`);
  // nobody else writes them
  await as('teacher').none(`update gameshub.players set interests = '{space}' where pid = 'kid123abc'`);
  await as('teacher').none(`update gameshub.players set interests = null where pid = 'kid123abc'`);
  await as('stranger').none(`update gameshub.players set interests = '{space}' where pid = 'kid123abc'`);
  await anon().fails(`update gameshub.players set interests = '{space}' where pid = 'kid123abc'`);
  // creating a player with interests follows the same rule, and the PIN keeps working next to them
  await as('own').ok(`insert into gameshub.players (pid, owner_id, username, interests) values ('kid999abc', $1, 'Sol', '{robots,music}')`, [uid('own')]);
  await as('own').fails(`insert into gameshub.players (pid, owner_id, username, interests) values ('kid888abc', $1, 'Sol', '{robots,robots}')`, [uid('own')]);
  await as('own').ok(`update gameshub.players set interests = '{space}', pin = $1::jsonb where pid = 'kid123abc'`, [JSON.stringify(PIN())]);
  await as('own').fails(`update gameshub.players set interests = '{space,x}', pin = $1::jsonb where pid = 'kid123abc'`, [JSON.stringify(PIN())]);
  // guardians (also view) read them, a stranger does not
  await as('teacher').ok(`select interests from gameshub.players where pid = 'kid123abc'`);
  await as('stranger').none(`select interests from gameshub.players where pid = 'kid123abc'`);
  assert.deepEqual((await as('own').rows(`select interests from gameshub.players where pid = 'kid123abc'`))[0].interests, ['space']);
  // the adult own profile has no interests field: the adult row is unchanged by this rule
  await as('own').ok(`update gameshub.adults set xp = 3 where id = $1`, [uid('own')]);
  await as('own').fails(`update gameshub.adults set interests = '{space}' where id = $1`, [uid('own')]);
});

test('B-PRIV-STRANGER: a signed in stranger and an anonymous visitor read nothing of a family', async () => {
  await seedAdults(db);
  await seedInvite(db);
  for (const c of [as('stranger'), asMail('other', 'otro@example.com')]) {
    await c.none('select * from gameshub.adults where id = $1', [uid('own')]);
    await c.none('select * from gameshub.adult_game_stats where owner_id = $1', [uid('own')]);
    await c.none(`select * from gameshub.players where pid = 'kid123abc'`);
    await c.none('select * from gameshub.players where owner_id = $1', [uid('own')]);
    await c.none(`select * from gameshub.player_game_stats where pid = 'kid123abc'`);
    await c.none('select * from gameshub.guardians');
    await c.none('select * from gameshub.memberships');
    await c.none('select * from gameshub.adults where id = $1', [uid('gran')]);
    await c.none('select * from gameshub.invites');
    await c.none(`update gameshub.players set pin = $1::jsonb where pid = 'kid123abc'`, [JSON.stringify(PIN())]);
  }
  const a = anon();
  for (const t of ['adults', 'adult_game_stats', 'players', 'player_game_stats', 'guardians', 'memberships', 'invites', 'nicknames', 'leaderboard', 'admins', 'challenges', 'analytics_events']) {
    await a.fails(`select * from gameshub.${t}`);
  }
  await a.fails(`update gameshub.players set pin = $1::jsonb where pid = 'kid123abc'`, [JSON.stringify(PIN())]);
});

// ---- Daily summary of a game ("Progreso de los pequenos") ----
test('B-DAILY: owner and edit guardian save a daily map of at most 62 days, view guardian only reads it', async () => {
  await seedAdults(db);
  const up = (c, daily, stats = '{"totalGames":3}') => c.run(
    `insert into gameshub.player_game_stats (owner_id, pid, game, stats, daily) values ($1,'kid123abc','reading',$2::jsonb,$3::jsonb)
     on conflict (pid, game) do update set stats = excluded.stats, daily = excluded.daily`,
    [uid('own'), stats, daily === undefined ? null : JSON.stringify(daily)]);
  for (const who of ['own', 'gran']) {
    const c = as(who);
    await up(c, DAILY(60));
    await up(c, DAILY(62));
    await assert.rejects(up(c, DAILY(63)));
    await assert.rejects(up(c, 'oops'));
    await assert.rejects(up(c, ['2026-01-01']));
    await up(c, undefined);                                           // the field stays optional
    await c.ok(`update gameshub.player_game_stats set daily = $1::jsonb where pid = 'kid123abc' and game = 'reading'`, [JSON.stringify(DAILY(5))]);
    await c.fails(`update gameshub.player_game_stats set daily = $1::jsonb where pid = 'kid123abc' and game = 'reading'`, [JSON.stringify(DAILY(70))]);
  }
  // the view guardian reads the days but cannot write or erase them
  const t = as('teacher');
  await t.ok(`select * from gameshub.player_game_stats where pid = 'kid123abc' and game = 'reading'`);
  await assert.rejects(up(t, DAILY(3)));
  await t.none(`update gameshub.player_game_stats set daily = $1::jsonb where game = 'reading'`, [JSON.stringify(DAILY(1))]);
  await t.none(`delete from gameshub.player_game_stats where game = 'reading'`);
  // strangers and other families see nothing
  await as('stranger').none(`select * from gameshub.player_game_stats where game = 'reading'`);
  await assert.rejects(up(as('stranger'), DAILY(3)));
});

test('B-DAILY-PANEL: what the panel reads (children and their games) is open to guardians, the adults own data is not', async () => {
  await seedAdults(db);
  await db.query(`insert into gameshub.player_game_stats (owner_id, pid, game, stats, daily) values ($1,'kid123abc','reading','{"totalGames":3}',$2::jsonb)`, [uid('own'), JSON.stringify(DAILY(4))]);
  await db.query(`insert into gameshub.adult_game_stats (owner_id, game, stats, daily) values ($1,'reading','{"totalGames":500}',$2::jsonb)`, [uid('own'), JSON.stringify(DAILY(4))]);
  for (const who of ['gran', 'teacher']) {
    const g = as(who);
    await g.ok('select * from gameshub.players where owner_id = $1', [uid('own')]);
    const games = await g.rows(`select game from gameshub.player_game_stats where pid = 'kid123abc'`);
    assert.ok(games.some(d => d.game === 'reading'));
    await g.none('select * from gameshub.adult_game_stats where owner_id = $1', [uid('own')]);
    await g.none('select * from gameshub.adults where id = $1', [uid('own')]);
    await g.none('select * from gameshub.players where owner_id = $1', [uid('pal')]);        // another adult's children, not in this family
    await g.none('select * from gameshub.adult_game_stats where owner_id = $1', [uid('pal')]);
  }
});

// ---- additions of the Postgres design (no Firestore twin) ----
test('SQL-PROGRESS: bump_progress is atomic, follows the same writers, never negative', async () => {
  await seedAdults(db);
  const bump = (c, owner, pid, xp, pts) => c.run('select gameshub.bump_progress($1::uuid, $2, $3::numeric, $4::numeric, 1)', [uid(owner), pid, xp, pts]);
  await bump(as('gran'), 'own', 'kid123abc', 10, 5);
  await bump(as('own'), 'own', 'kid123abc', 10, 5);
  const r = (await db.query(`select xp, total_points, level from gameshub.players where pid = 'kid123abc'`)).rows[0];
  assert.equal(Number(r.xp), 20); assert.equal(Number(r.total_points), 10); assert.equal(r.level, 1);
  await assert.rejects(bump(as('teacher'), 'own', 'kid123abc', 1, 1));          // view
  await assert.rejects(bump(as('stranger'), 'own', 'kid123abc', 1, 1));
  await assert.rejects(bump(as('own'), 'own', 'kid123abc', -1, 0));
  await bump(as('own'), 'own', '', 7, 3);                                         // the adult profile
  assert.equal(Number((await db.query('select xp from gameshub.adults where id = $1', [uid('own')])).rows[0].xp), 7);
  await assert.rejects(bump(as('gran'), 'own', '', 1, 1));                        // an edit guardian never touches the adult profile
});

test('SQL-PLAYER: create_player reserves the nickname atomically; deleting a child cleans its nickname, scores and stats', async () => {
  await seedOwner(db); await seedGuardian(db, 'gran', 'edit');
  await db.query(`insert into gameshub.adults (id, username) values ($1, 'Abuela')`, [uid('gran')]);
  await as('own').any(`select gameshub.create_player('pipo12345', 'Pipo', 'pipo', 'fox')`);
  await as('gran').fails(`select gameshub.create_player('otro12345', 'Pipo', 'pipo', 'cat')`);          // nickname taken
  assert.equal(await count(`select count(*) n from gameshub.players where pid = 'otro12345'`), 0);      // nothing half done
  await score(as('own'), 'mathmaster', 'own', 'pipo12345', 5, 'Pipo');
  await as('own').ok(`insert into gameshub.player_game_stats (owner_id, pid, game, stats) values ($1,'pipo12345','snake','{}')`, [uid('own')]);
  await as('own').ok(`delete from gameshub.players where pid = 'pipo12345'`);
  assert.equal(await count(`select count(*) n from gameshub.nicknames where key = 'pipo'`), 0);
  assert.equal(await count(`select count(*) n from gameshub.leaderboard where pid = 'pipo12345'`), 0);
  assert.equal(await count(`select count(*) n from gameshub.player_game_stats where pid = 'pipo12345'`), 0);
  assert.equal((await as('gran').rows(`select gameshub.nickname_available('pipo') a`))[0].a, true);
});

test('SQL-ERASE: delete_my_data removes the adult, the children and everything under them, and leaves other families alone', async () => {
  await seedAdults(db);
  await score(as('own'), 'mathmaster', 'own', 'kid123abc', 5, 'Pipo');
  await db.query(`insert into gameshub.nicknames (key, owner_id) values ('pipo', $1)`, [uid('own')]);
  await seedInvite(db);
  await as('gran').any('select gameshub.delete_my_data()');           // a guardian leaves everything of theirs
  assert.equal(await count('select count(*) n from gameshub.adults where id = $1', [uid('gran')]), 0);
  assert.equal(await count('select count(*) n from gameshub.players where owner_id = $1', [uid('gran')]), 0);
  assert.equal(await count('select count(*) n from gameshub.guardians where guardian_id = $1', [uid('gran')]), 0);
  assert.equal(await count('select count(*) n from gameshub.guardians where owner_id = $1', [uid('own')]), 2);
  await as('own').any('select gameshub.delete_my_data()');
  for (const t of ['players', 'player_game_stats', 'adult_game_stats', 'guardians', 'invites', 'leaderboard', 'nicknames']) {
    assert.equal(await count(`select count(*) n from gameshub.${t} where owner_id = $1`, [uid('own')]), 0, t);
  }
  assert.equal(await count('select count(*) n from gameshub.adults where id = $1', [uid('pal')]), 1);
  await anon().fails('select gameshub.delete_my_data()');
});

test('SQL-WHOAMI: the database sees the uid and the VERIFIED e-mail of the JWT, nothing else', async () => {
  const w = async c => (await c.rows('select gameshub.whoami() w'))[0].w;
  assert.deepEqual(await w(asMail('gran', 'Abuela@Example.com')), { uid: uid('gran'), email: 'abuela@example.com', role: 'authenticated' });
  assert.equal((await w(asMail('gran', 'abuela@example.com', false))).email, '');
  assert.equal((await w(as('gran'))).email, '');
  await anon().fails('select gameshub.whoami()');
  // Better Auth puts emailVerified (camelCase) in its JWT
  assert.equal((await w(caller(db, 'gran', { claims: { email: 'A@B.co', emailVerified: true } }))).email, 'a@b.co');
  assert.equal((await w(caller(db, 'gran', { claims: { email: 'a@b.co', emailVerified: false } }))).email, '');
  assert.equal((await w(caller(db, 'gran', { claims: { email: 'a@b.co', email_verified: 'true' } }))).email, 'a@b.co');
});

test('SQL-WHOAMI: a JWT without e-mail falls back to the verified e-mail of the Neon Auth user row', async () => {
  await db.exec('create schema if not exists neon_auth; create table if not exists neon_auth."user" (id uuid primary key, email text, "emailVerified" boolean)');
  try {
    await db.query(`insert into neon_auth."user" values ($1, 'Gran@Example.com', true), ($2, 'x@example.com', false)`, [uid("gran"), uid("x")]);
    const w = async c => (await c.rows('select gameshub.whoami() w'))[0].w;
    assert.equal((await w(as('gran'))).email, 'gran@example.com');
    assert.equal((await w(as('x'))).email, '');                    // not verified
    assert.equal((await w(as('nobody'))).email, '');               // no such user
    // and so an invitation can be accepted with a JWT that carries no e-mail
    await seedOwner(db); await seedInvite(db, INV, { email: 'gran@example.com' });
    await accept(as('gran'));
    assert.equal(await count('select count(*) n from gameshub.guardians'), 1);
  } finally { await db.exec('drop schema neon_auth cascade'); }
});
