// scripts/gameshub-db-migrate.mjs against PGlite standing in for `pg`.
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { run, checksum, databaseUrl, SQL_DIR } from '../../scripts/gameshub-db-migrate.mjs';

/** Minimal `pg` look-alike over one PGlite database. */
function fakePg(db, seen = {}) {
  class Client {
    constructor(o) { seen.connectionString = o.connectionString; seen.ssl = o.ssl; }
    async connect() { seen.connected = true; }
    async query(sql, params) { seen.queries = (seen.queries || 0) + 1; return params ? db.query(sql, params) : (await db.exec(sql)).pop() || { rows: [] }; }
    async end() { seen.ended = true; }
  }
  return { Client };
}
const log = () => { const out = []; return { out, log: m => out.push(m) }; };
const ENV = { DATABASE_URL: 'postgresql://owner:pw@ep-test.eu-central-1.aws.neon.tech/neondb' };
const policies = async db => Number((await db.query(`select count(*) n from pg_policies where schemaname = 'gameshub'`)).rows[0].n);

test('RUN-ORDER: migrations once, in order; permissions every time; guard blocks before the Data API exists', async () => {
  const db = new PGlite(); const seen = {};
  const io = log();
  const r1 = await run([], ENV, io, { pg: fakePg(db, seen) });
  assert.equal(r1.applied, 2);
  assert.deepEqual(io.out.filter(l => /applying migration/.test(l)).map(l => l.split(' ')[2]), ['0001_schema.sql', '0002_functions.sql']);
  assert.equal(await policies(db), 0);                         // no role authenticated yet: nothing applied, nothing broken
  assert.ok(seen.connected && seen.ended);
  assert.deepEqual(seen.ssl, { rejectUnauthorized: true });    // not localhost: verified TLS
  // "enable the Data API in the console"
  await db.exec(`create role authenticated nologin; create schema auth;
    create function auth.uid() returns uuid language sql stable as $$ select (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid $$`);
  const io2 = log();
  const r2 = await run([], ENV, io2, { pg: fakePg(db) });
  assert.equal(r2.applied, 0);
  assert.ok(io2.out.includes('migrations: up to date'));
  assert.ok(await policies(db) >= 20);
  const rows = (await db.query('select name from gameshub.app_migration order by name')).rows.map(r => r.name);
  assert.deepEqual(rows, ['0001_schema.sql', '0002_functions.sql']);
  // the bookkeeping table is closed to the app role
  assert.equal((await db.query(`select relrowsecurity from pg_class where oid = 'gameshub.app_migration'::regclass`)).rows[0].relrowsecurity, true);
  await db.close();
});

test('RUN-DRY: --dry-run lists what it would do and changes nothing', async () => {
  const db = new PGlite(); const io = log();
  await run(['--dry-run'], ENV, io, { pg: fakePg(db) });
  assert.ok(io.out.some(l => /would apply migration 0001_schema/.test(l)));
  assert.equal((await db.query(`select count(*) n from pg_namespace where nspname = 'gameshub'`)).rows[0].n, 0);   // not even the schema
  await db.close();
});

test('RUN-CHECKSUM: an applied migration that changed is refused; a failing migration rolls back and is not recorded', async () => {
  const db = new PGlite();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gh-sql-'));
  fs.cpSync(SQL_DIR, dir, { recursive: true });
  await run([], ENV, log(), { pg: fakePg(db), dir });
  fs.appendFileSync(path.join(dir, 'migrations', '0001_schema.sql'), '\n-- edited later\n');
  await assert.rejects(run([], ENV, log(), { pg: fakePg(db), dir }), /already applied and has changed/);
  // CRLF checkouts (core.autocrlf) must not trip the checksum
  fs.writeFileSync(path.join(dir, 'migrations', '0001_schema.sql'), fs.readFileSync(path.join(SQL_DIR, 'migrations', '0001_schema.sql'), 'utf8').replace(/\n/g, '\r\n'));
  await run([], ENV, log(), { pg: fakePg(db), dir });
  // a broken new migration
  fs.writeFileSync(path.join(dir, 'migrations', '0003_broken.sql'), 'create table gameshub.t1 (a int); select 1/0;');
  await assert.rejects(run([], ENV, log(), { pg: fakePg(db), dir }), /0003_broken.sql: .*division by zero/);
  assert.equal((await db.query(`select count(*) n from pg_tables where tablename = 't1'`)).rows[0].n, 0);
  assert.equal((await db.query(`select count(*) n from gameshub.app_migration where name = '0003_broken.sql'`)).rows[0].n, 0);
  await db.close();
});

test('RUN-CREDENTIALS: the connection string is only read from the environment or a file, never from arguments', async () => {
  await assert.rejects(run(['--database-url', 'postgresql://x'], ENV, log(), { pg: fakePg(new PGlite()) }), /never an argument/);
  await assert.rejects(run(['postgresql://u:p@h/db'], ENV, log(), { pg: fakePg(new PGlite()) }), /never an argument/);
  await assert.rejects(run(['--whatever'], ENV, log(), { pg: fakePg(new PGlite()) }), /Unknown argument/);
  await assert.rejects(run([], {}, log(), { pg: fakePg(new PGlite()) }), /DATABASE_URL/);
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'gh-env-')), '.neon-url');
  fs.writeFileSync(f, 'postgresql://file@h/db\n');
  assert.equal(databaseUrl({ DATABASE_URL_FILE: f }), 'postgresql://file@h/db');
  const src = fs.readFileSync(path.resolve(import.meta.dirname, '../../scripts/gameshub-db-migrate.mjs'), 'utf8');
  assert.ok(!/postgres(ql)?:\/\/[^'"\s]*:[^'"\s]*@/.test(src));
  assert.equal(checksum('a\r\nb'), checksum('a\nb'));
});
