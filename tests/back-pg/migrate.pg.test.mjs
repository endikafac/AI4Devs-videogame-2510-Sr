// scripts/migrate-firestore-to-pg.mjs on sample data: the plan, the SQL, and the SQL
// really applied to the schema (PGlite), then read back through the RLS policies.
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openDb, caller, uid, PIN } from './harness.mjs';
import { normalizeExport, buildPlan, renderSql, parseArgs, databaseUrl, main, toIso, validPin, lit, uuidOf } from '../../scripts/migrate-firestore-to-pg.mjs';

const NOW = Date.parse('2026-06-01T12:00:00Z');
const ts = s => ({ _seconds: Math.floor(Date.parse(s) / 1000), _nanoseconds: 0 });
const days = n => { const o = {}; for (let i = 0; i < n; i++) o[new Date(Date.UTC(2026, 0, 1) + i * 86400000).toISOString().slice(0, 10)] = { games: 1, items: 10, minutes: 2, ok: 8 }; return o; };

/** A family: owner "ownF", children, a view and an edit guardian, one person without e-mail, junk that must be skipped. */
const SAMPLE = () => ({
  users: {
    ownF: {
      data: { username: 'Luna', avatar: 'fox', nicknameKey: 'luna', photoURL: 'https://lh3.googleusercontent.com/a/x', xp: 120, totalPoints: 300, level: 2, createdAt: ts('2026-01-01T10:00:00Z'), lastLogin: '2026-05-30T08:00:00Z', consent: { version: 1, at: '2026-01-01T10:00:00Z', guardian: true }, settings: { soundEnabled: true } },
      games: { mathmaster: { totalGames: 3, byLevel: { level_1: { games: 1, bestTime: null } }, daily: days(70) } },
      players: {
        kid123abc: { data: { username: 'Pipo', avatar: 'cat', nicknameKey: 'pipo', kind: 'child', xp: 10, totalPoints: 20, level: 1, pin: PIN(), interests: ['space', 'space', 'bad', 'music'], createdAt: ts('2026-02-01T10:00:00Z') }, games: { mathmaster: { totalGames: 1, daily: days(3) }, snake: { totalGames: 2 } } },
        kid456def: { data: { username: 'Sol', pin: { pin: '1234' } }, games: {} },
        'BAD PID': { data: { username: 'X' }, games: { snake: { totalGames: 1 } } }
      },
      guardians: { granF: { uid: 'granF', email: 'Abuela@Example.com', name: 'Abuela', role: 'edit', since: ts('2026-03-01T10:00:00Z'), inviteId: 'invOld1' }, ghostF: { uid: 'ghostF', email: 'nobody@example.com', name: 'Nadie', role: 'view', since: '2026-03-02T10:00:00Z' }, badF: { role: 'god' } },
      memberships: {}
    },
    granF: { data: { username: 'Abuela', xp: 5 }, games: { mathmaster: { totalGames: 7 } }, players: {}, guardians: {}, memberships: { ownF: { ownerUid: 'ownF', ownerName: 'Luna', role: 'edit', since: '2026-03-01T10:00:00Z' } } },
    noMailF: { data: { username: 'Sin correo' }, games: {}, players: { kidnomail1: { data: { username: 'Huerfano' }, games: {} } }, guardians: {}, memberships: {} }
  },
  invites: {
    live: { ownerUid: 'ownF', ownerName: 'Luna', email: 'tio@example.com', role: 'view', createdAt: ts('2026-05-20T10:00:00Z'), expires: ts('2026-06-19T10:00:00Z') },
    old: { ownerUid: 'ownF', ownerName: 'Luna', email: 'viejo@example.com', role: 'view', createdAt: ts('2026-01-01T10:00:00Z'), expires: ts('2026-01-31T10:00:00Z') },
    bad: { ownerUid: 'nobody', ownerName: 'X', email: 'x@example.com', role: 'edit', createdAt: ts('2026-05-20T10:00:00Z'), expires: ts('2026-06-19T10:00:00Z') }
  },
  nicknames: { luna: { uid: 'ownF', createdAt: '2026-01-01T10:00:00Z' }, pipo: { uid: 'ownF' }, orphan: { uid: 'deletedF' } },
  leaderboard: { mathmaster: { ownF: { uid: 'ownF', username: 'Luna', totalPoints: 300, xp: 120, level: 2, updatedAt: '2026-05-30T08:00:00Z' }, ownF_kid123abc: { uid: 'ownF', username: 'Pipo', totalPoints: 20, xp: 10, level: 1 }, 'ownF_BAD': { username: 'z', totalPoints: 1 }, deletedF: { username: 'gone', totalPoints: 5 } } },
  admins: { ownF: { ok: true } }
});
const AUTH = { users: [{ localId: 'ownF', email: 'luna@example.com' }, { localId: 'granF', email: 'abuela@example.com' }] };
const plan = o => buildPlan(normalizeExport(SAMPLE()), { authUsers: AUTH.users, now: NOW, ...o });

test('MIG-PLAN: counts, and everything that cannot be migrated is skipped WITH a warning', () => {
  const p = plan();
  assert.deepEqual(p.summary, { adults: 3, adult_game_stats: 2, players: 3, player_game_stats: 2, guardians: 2, invites: 1, nicknames: 2, leaderboard: 2, admins: 1 });
  const w = p.warnings.join('\n');
  assert.match(w, /photoURL not migrated/);
  assert.match(w, /BAD PID.*skipped/);
  assert.match(w, /kid456def.*PIN record is malformed/);
  assert.match(w, /daily had 70 days, kept the last 62/);
  assert.match(w, /invites\/old: expired/);
  assert.match(w, /invites\/bad/);
  assert.match(w, /nicknames\/orphan/);
  assert.match(w, /leaderboard\/mathmaster\/ownF_BAD/);
  assert.match(w, /leaderboard\/mathmaster\/deletedF/);
  assert.match(w, /guardians\/badF: invalid guardian/);
  assert.ok(p.unmapped.includes('noMailF') && p.unmapped.includes('ghostF'));
});

test('MIG-PLAN: no photo, no e-mail of an adult, PIN as a hash record, interests cleaned, the daily map capped', () => {
  const p = plan();
  assert.ok(!JSON.stringify(p.rows.adults).includes('googleusercontent'));
  assert.ok(!JSON.stringify(p.rows.adults).includes('@'));
  const kid = p.rows.players.find(x => x.pid === 'kid123abc');
  assert.deepEqual(kid.interests, ['space', 'music']);
  assert.equal(kid.pin.alg, 'PBKDF2-SHA256');
  assert.equal(p.rows.players.find(x => x.pid === 'kid456def').pin, null);
  const st = p.rows.adult_game_stats[0];
  assert.equal(Object.keys(st.daily).length, 62);
  assert.equal(st.stats.daily, undefined);
  assert.equal(Object.keys(st.daily).sort()[0], '2026-01-09');           // the oldest 8 days went
  const g = p.rows.guardians.find(x => x.guardian === 'granF');
  assert.equal(g.email, 'abuela@example.com'); assert.equal(g.owner_name, 'Luna'); assert.equal(g.invite, uuidOf('invOld1'));
});

test('MIG-NORMALIZE: the __collection__ shape of firestore-export-import gives the same plan as the plain shape', () => {
  const s = SAMPLE();
  const col = {
    __collection__: {
      users: Object.fromEntries(Object.entries(s.users).map(([id, u]) => [id, {
        ...u.data,
        __collection__: {
          games: u.games, guardians: u.guardians, memberships: u.memberships,
          players: Object.fromEntries(Object.entries(u.players).map(([pid, p]) => [pid, { ...p.data, __collection__: { games: p.games } }]))
        }
      }])),
      invites: s.invites, nicknames: s.nicknames, admins: s.admins,
      leaderboard: Object.fromEntries(Object.entries(s.leaderboard).map(([g, docs]) => [g, { __collection__: { scores: docs } }]))
    }
  };
  assert.deepEqual(buildPlan(normalizeExport(col), { authUsers: AUTH.users, now: NOW }).summary, plan().summary);
  assert.throws(() => normalizeExport([]), /not a JSON object/);
});

test('MIG-TIME: every timestamp form of a Firestore export', () => {
  assert.equal(toIso({ _seconds: 1767261600, _nanoseconds: 0 }), '2026-01-01T10:00:00.000Z');
  assert.equal(toIso({ seconds: 1767261600 }), '2026-01-01T10:00:00.000Z');
  assert.equal(toIso({ __datatype__: 'timestamp', value: { _seconds: 1767261600, _nanoseconds: 5e8 } }), '2026-01-01T10:00:00.500Z');
  assert.equal(toIso('2026-01-01T10:00:00Z'), '2026-01-01T10:00:00.000Z');
  assert.equal(toIso(1767261600000), '2026-01-01T10:00:00.000Z');
  assert.equal(toIso(null), null); assert.equal(toIso('nonsense'), null);
});

test('MIG-SQL: literals are escaped, a NUL is refused', () => {
  assert.equal(lit("O'Brien"), "'O''Brien'");
  assert.equal(lit(null), 'null'); assert.equal(lit(5), '5'); assert.equal(lit(NaN), 'null');
  assert.throws(() => lit('a\u0000b'), /NUL/);
  const evil = SAMPLE(); evil.users.ownF.data.username = "x'); drop table gameshub.adults; --";
  const sql = renderSql(buildPlan(normalizeExport(evil), { authUsers: AUTH.users, now: NOW }));
  assert.ok(sql.includes("'x''); drop table gameshub.adults; --'") || sql.includes("x''); drop table"));
});

test('MIG-APPLY: the SQL runs on the real schema, keeps relations, is idempotent, and what lands is readable only through RLS', async () => {
  const db = await openDb({ shim: true, permissions: true });
  // what Neon Auth would have: the three people who already signed in with Google
  await db.exec(`create schema neon_auth; create table neon_auth."user" (id uuid primary key, email text)`);
  await db.query(`insert into neon_auth."user" values ($1,'Luna@Example.com'), ($2,'abuela@example.com')`, [uid('luna'), uid('abuela')]);
  const p = plan({ uidMap: { noMailF: uid('nomail'), ghostF: uid('ghost') } });
  const sql = renderSql(p);
  await db.exec(sql);
  const n = async t => Number((await db.query(`select count(*) n from gameshub.${t}`)).rows[0].n);
  assert.deepEqual({ adults: await n('adults'), players: await n('players'), guardians: await n('guardians'), invites: await n('invites'), nicknames: await n('nicknames'), leaderboard: await n('leaderboard'), admins: await n('admins'), pgs: await n('player_game_stats'), ags: await n('adult_game_stats') },
    { adults: 3, players: 3, guardians: 2, invites: 1, nicknames: 2, leaderboard: 2, admins: 1, pgs: 2, ags: 2 });
  // idempotent: running it again changes nothing and never overwrites
  await db.query(`update gameshub.adults set username = 'Cambiado' where id = $1`, [uid('luna')]);
  await db.exec(sql);
  assert.equal((await db.query('select username from gameshub.adults where id = $1', [uid('luna')])).rows[0].username, 'Cambiado');
  assert.equal(await n('players'), 3);
  // data arrived with its shape
  const kid = (await db.query(`select * from gameshub.players where pid = 'kid123abc'`)).rows[0];
  assert.equal(kid.owner_id, uid('luna')); assert.equal(kid.pin.alg, 'PBKDF2-SHA256'); assert.deepEqual(kid.interests, ['space', 'music']); assert.equal(kid.photo_url, null);
  const adult = (await db.query('select * from gameshub.adults where id = $1', [uid('abuela')])).rows[0];
  assert.equal(adult.username, 'Abuela');
  const st = (await db.query(`select daily from gameshub.adult_game_stats where owner_id = $1`, [uid('luna')])).rows[0];
  assert.equal(Object.keys(st.daily).length, 62);
  // the migrated family works under the policies: the edit guardian reads the child, not the owner
  const gran = caller(db, 'abuela', { email: 'abuela@example.com' });
  await gran.ok(`select * from gameshub.players where pid = 'kid123abc'`);
  await gran.none('select * from gameshub.adults where id = $1', [uid('luna')]);
  assert.equal((await gran.rows('select owner_name, role from gameshub.memberships'))[0].owner_name, 'Luna');
  await gran.ok(`update gameshub.players set xp = 11 where pid = 'kid123abc'`);
  // the pending invitation is visible to its addressee only
  const tio = caller(db, 'tio', { email: 'tio@example.com' });
  assert.equal((await tio.rows('select * from gameshub.invites')).length, 1);
  await db.close();
});

test('MIG-APPLY: people without a Neon Auth account stop the run, unless --skip-unmapped', async () => {
  const db = await openDb({ shim: true, permissions: true });
  await db.exec(`create schema neon_auth; create table neon_auth."user" (id uuid primary key, email text)`);
  await db.query(`insert into neon_auth."user" values ($1,'luna@example.com')`, [uid('luna')]);
  const p = plan();
  await assert.rejects(db.exec(renderSql(p)), /no Neon Auth account yet/);
  await db.exec('rollback');       // what psql does at the end of a failed script
  assert.equal(Number((await db.query('select count(*) n from gameshub.adults')).rows[0].n), 0, 'the transaction left nothing behind');
  await db.exec(renderSql(p, { skipUnmapped: true }));
  assert.equal(Number((await db.query('select count(*) n from gameshub.adults')).rows[0].n), 1);
  assert.equal(Number((await db.query('select count(*) n from gameshub.players')).rows[0].n), 2);       // the child of the missing person is not there
  assert.equal(Number((await db.query('select count(*) n from gameshub.guardians')).rows[0].n), 0);     // neither is a guardian that cannot be matched
  await db.close();
});

// ── command line ──
const io = () => { const out = []; return { out, log: (...a) => out.push(a.join(' ')), err: (...a) => out.push(a.join(' ')) }; };
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'gh-mig-'));

test('MIG-CLI: --dry-run prints the summary and writes nothing', async () => {
  const d = tmp();
  fs.writeFileSync(path.join(d, 'fs.json'), JSON.stringify(SAMPLE()));
  fs.writeFileSync(path.join(d, 'auth.json'), JSON.stringify(AUTH));
  const o = io();
  const code = await main(['--export', path.join(d, 'fs.json'), '--auth-export', path.join(d, 'auth.json'), '--dry-run'], {}, o);
  assert.equal(code, 0);
  assert.match(o.out.join('\n'), /adults=3, .*players=3/);
  assert.match(o.out.join('\n'), /Dry run: nothing written/);
  assert.deepEqual(fs.readdirSync(d).sort(), ['auth.json', 'fs.json']);
});

test('MIG-CLI: --out writes the SQL file; --apply uses DATABASE_URL from the environment through the driver, in one query', async () => {
  const d = tmp();
  fs.writeFileSync(path.join(d, 'fs.json'), JSON.stringify(SAMPLE()));
  fs.writeFileSync(path.join(d, 'auth.json'), JSON.stringify(AUTH));
  const base = ['--export', path.join(d, 'fs.json'), '--auth-export', path.join(d, 'auth.json')];
  await main([...base, '--out', path.join(d, 'm.sql')], {}, io());
  const sql = fs.readFileSync(path.join(d, 'm.sql'), 'utf8');
  assert.match(sql, /^-- Generated by/); assert.match(sql, /begin;[\s\S]*commit;/);
  const seen = {};
  class Client { constructor(o) { seen.cs = o.connectionString; } async connect() { seen.connected = true; } async query(q) { seen.sql = q; } async end() { seen.ended = true; } }
  await main([...base, '--apply'], { DATABASE_URL: 'postgresql://u:secret@db.example.test/neondb' }, io(), { pg: { Client } });
  assert.equal(seen.cs, 'postgresql://u:secret@db.example.test/neondb');
  assert.ok(seen.connected && seen.ended && seen.sql.includes('begin;'));
  // never from the command line, and never without an environment variable
  await assert.rejects(main([...base, '--apply', '--database-url', 'postgresql://x'], {}, io()), /never an argument/);
  await assert.rejects(main([...base, '--apply', 'postgresql://u:p@h/db'], {}, io()), /never an argument/);
  await assert.rejects(main([...base, '--apply'], {}, io(), { pg: { Client } }), /DATABASE_URL/);
  // from a gitignored file
  fs.writeFileSync(path.join(d, '.db-url'), 'postgresql://file@h/db\n');
  assert.equal(databaseUrl({ DATABASE_URL_FILE: path.join(d, '.db-url') }), 'postgresql://file@h/db');
  // exactly one mode
  await assert.rejects(main([...base], {}, io()), /exactly one/);
  await assert.rejects(main([...base, '--dry-run', '--apply'], {}, io()), /exactly one/);
  assert.throws(() => parseArgs(['--nope']), /Unknown argument/);
});

test('MIG-CLI: the PIN validator of the script is the one of the SQL', () => {
  for (const ok of [PIN(), null]) assert.equal(validPin(ok), true);
  for (const bad of ['1234', PIN({ iter: 5 }), PIN({ hash: 'short' }), PIN({ v: 2 }), { ...PIN(), extra: 1 }, [PIN()]]) assert.equal(validPin(bad), false);
  const src = fs.readFileSync(path.resolve(import.meta.dirname, '../../scripts/migrate-firestore-to-pg.mjs'), 'utf8');
  assert.ok(!/postgres(ql)?:\/\/[^'"\s]*:[^'"\s]*@/.test(src), 'no credentials in the script');
});
