// The migrations and permission files themselves: they apply on a clean
// database, apply again without error (idempotent), and the permission files
// are harmless before the Neon Data API exists (guard blocks).
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { openDb, MIGRATIONS, PERMISSIONS, caller, uid } from './harness.mjs';

const root = path.resolve(import.meta.dirname, '../..');

test('M-GUARD: before the Data API exists (no role authenticated, no auth.uid()) everything applies and no policy is created', async () => {
  const db = new PGlite();
  const notices = [];
  for (const m of MIGRATIONS()) await db.exec(m.sql);
  for (const p of PERMISSIONS()) {
    const res = await db.exec(p.sql);
    assert.ok(Array.isArray(res));
  }
  const pol = await db.query(`select count(*) n from pg_policies where schemaname = 'gameshub'`);
  assert.equal(Number(pol.rows[0].n), 0, 'no policies without the Data API');
  const rls = await db.query(`select count(*) n from pg_tables where schemaname = 'gameshub' and not rowsecurity`);
  assert.equal(Number(rls.rows[0].n), 0, 'RLS is on in every table even before the Data API');
  // the role exists but auth.uid() does not yet: still a no-op
  await db.exec('create role authenticated nologin');
  for (const p of PERMISSIONS()) await db.exec(p.sql);
  assert.equal(Number((await db.query(`select count(*) n from pg_policies where schemaname = 'gameshub'`)).rows[0].n), 0);
  void notices;
  await db.close();
});

test('M-IDEMPOTENT: migrations and permissions apply twice with the same result', async () => {
  const db = await openDb();
  const snap = async () => ({
    policies: (await db.query(`select tablename, policyname, cmd from pg_policies where schemaname = 'gameshub' order by 1, 2`)).rows,
    grants: (await db.query(`select table_name, grantee, privilege_type from information_schema.role_table_grants where table_schema = 'gameshub' and grantee in ('authenticated','anonymous') order by 1, 2, 3`)).rows,
  });
  const first = await snap();
  for (const m of MIGRATIONS()) await db.exec(m.sql);
  for (const p of PERMISSIONS()) await db.exec(p.sql);
  for (const p of PERMISSIONS()) await db.exec(p.sql);
  assert.deepEqual(await snap(), first);
  assert.ok(first.policies.length >= 20);
  await db.close();
});

test('M-RLS: every table of the schema has RLS and at least one policy or no grant at all', async () => {
  const db = await openDb();
  const tables = (await db.query(`select tablename, rowsecurity from pg_tables where schemaname = 'gameshub'`)).rows;
  assert.ok(tables.length >= 11);
  for (const t of tables) assert.equal(t.rowsecurity, true, t.tablename + ' has no RLS');
  const withPolicy = new Set((await db.query(`select distinct tablename from pg_policies where schemaname = 'gameshub'`)).rows.map(r => r.tablename));
  for (const t of tables) assert.ok(withPolicy.has(t.tablename), t.tablename + ' has no policy');
  await db.close();
});

test('M-GRANTS: nothing is granted to PUBLIC, and the anonymous role can only insert analytics', async () => {
  const db = await openDb();
  const pub = await db.query(`select routine_name from information_schema.routine_privileges where routine_schema = 'gameshub' and grantee = 'PUBLIC'`);
  assert.deepEqual(pub.rows, []);
  const anon = (await db.query(`select table_name, privilege_type from information_schema.role_table_grants where table_schema = 'gameshub' and grantee = 'anonymous'`)).rows;
  assert.deepEqual(anon, [], 'table level grants: none (only a column grant on analytics_events)');
  const cols = (await db.query(`select table_name, column_name, privilege_type from information_schema.column_privileges where table_schema = 'gameshub' and grantee = 'anonymous' order by 2`)).rows;
  assert.deepEqual(cols.map(c => c.table_name + '.' + c.column_name + ':' + c.privilege_type),
    ['analytics_events.auth:INSERT', 'analytics_events.first:INSERT', 'analytics_events.game:INSERT', 'analytics_events.lang:INSERT', 'analytics_events.type:INSERT']);
  await db.close();
});

test('M-NEON: without the optional anonymous role the permissions still apply (visitors then only count after login)', async () => {
  const db = new PGlite();
  await db.exec(`create role authenticated nologin; create schema auth;
    create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$`);
  for (const m of MIGRATIONS()) await db.exec(m.sql);
  for (const p of PERMISSIONS()) await db.exec(p.sql);
  assert.ok(Number((await db.query(`select count(*) n from pg_policies where schemaname = 'gameshub'`)).rows[0].n) >= 20);
  assert.equal(Number((await db.query(`select count(*) n from pg_policies where policyname = 'analytics_insert_anon'`)).rows[0].n), 0);
  await db.close();
});

test('M-INTERESTS-SYNC: the interest ids of the SQL are the ones of platform/interests.js', async () => {
  const sql = fs.readFileSync(path.join(root, 'db/gameshub/migrations/0001_schema.sql'), 'utf8');
  const m = sql.match(/e <> all \(array\[([^\]]+)\]/);
  const ids = m[1].match(/'([a-z]+)'/g).map(s => s.slice(1, -1));
  const js = fs.readFileSync(path.join(root, 'platform/interests.js'), 'utf8');
  for (const id of ids) assert.ok(js.includes("'" + id + "'") || js.includes('"' + id + '"') || js.includes('id: ' + "'" + id + "'") || new RegExp('\\b' + id + '\\b').test(js), id + ' missing in interests.js');
  assert.equal(ids.length, 14);
});

test('M-FILES: no secrets in the SQL, no Firestore leftovers', () => {
  for (const f of [...MIGRATIONS(), ...PERMISSIONS()]) {
    assert.ok(!/password|secret|api[_-]?key|postgres(ql)?:\/\//i.test(f.sql.replace(/-- .*/g, '').replace(/secrets/g, '')), f.name);
  }
  void caller; void uid;
});
