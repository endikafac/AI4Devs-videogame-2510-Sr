#!/usr/bin/env node
/**
 * Migration runner for db/gameshub (plain Postgres, no vendor CLI).
 *
 *   DATABASE_URL=... node scripts/gameshub-db-migrate.mjs --dry-run
 *   DATABASE_URL=... node scripts/gameshub-db-migrate.mjs
 *
 * - migrations/*.sql run once, in order, each in its own transaction. Their checksum is
 *   stored in gameshub.app_migration: editing an applied file is an error, not a silent drift.
 * - permissions/*.sql are re-applied on EVERY run (they are idempotent), so a change made in
 *   the Neon console cannot silently reopen a hole (same idea as PolyGo).
 * - The connection string comes ONLY from the environment: DATABASE_URL, or DATABASE_URL_FILE
 *   pointing to a gitignored file. Never an argument: the corporate EDR logs the command line.
 * - Needs the `pg` package (pure JavaScript, no binary): `npm i --no-save pg` in the folder you run from.
 * - Use the connection of the database OWNER (neondb_owner): RLS does not apply to it, by design.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SQL_DIR = path.join(here, '..', 'db', 'gameshub');

export const checksum = sql => createHash('sha256').update(sql.replace(/\r\n/g, '\n')).digest('hex').slice(0, 16);

export function readSql(dir) {
  return fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort()
    .map(name => { const sql = fs.readFileSync(path.join(dir, name), 'utf8').replace(/\r\n/g, '\n'); return { name, sql, checksum: checksum(sql) }; });
}

export function databaseUrl(env) {
  if (env.DATABASE_URL) return env.DATABASE_URL;
  if (env.DATABASE_URL_FILE) return fs.readFileSync(env.DATABASE_URL_FILE, 'utf8').trim();
  throw new Error('Set DATABASE_URL (or DATABASE_URL_FILE pointing to a gitignored file). It is never read from the command line.');
}

async function loadPg() {
  try { return await import('pg'); } catch { /* not next to the script */ }
  for (const base of [process.cwd(), path.join(here, '..', 'tests')]) {
    try { return createRequire(pathToFileURL(path.join(base, 'noop.js')))('pg'); } catch { /* try the next folder */ }
  }
  throw new Error('The "pg" package is needed: run `npm i --no-save pg` in the folder you run this from.');
}

/** @param {Object} deps { pg } injected by the tests */
export async function run(argv, env = process.env, io = { log: console.log }, deps = {}) {
  for (const a of argv) {
    if (/^--(database-url|db-url|url|password|dsn)/i.test(a) || /^postgres(ql)?:\/\//i.test(a)) throw new Error('The connection string is never an argument. Use DATABASE_URL.');
    if (a !== '--dry-run') throw new Error(`Unknown argument: ${a}`);
  }
  const dry = argv.includes('--dry-run');
  const dir = deps.dir || SQL_DIR;
  const migrations = readSql(path.join(dir, 'migrations'));
  const permissions = readSql(path.join(dir, 'permissions'));
  const pg = deps.pg || await loadPg();
  const Client = pg.Client || (pg.default && pg.default.Client);
  const url = databaseUrl(env);
  const local = /localhost|127\.0\.0\.1/.test(url);
  const client = new Client({ connectionString: url, ssl: local ? undefined : { rejectUnauthorized: true } });
  await client.connect();
  try {
    let done = new Map();
    if (!dry) {
      await client.query('create schema if not exists gameshub');
      await client.query('create table if not exists gameshub.app_migration (name text primary key, checksum text not null, applied_at timestamptz not null default now())');
      // the bookkeeping table has no policies and no grants: nobody but the owner touches it
      await client.query('alter table gameshub.app_migration enable row level security');
    }
    // a dry run creates nothing, not even the bookkeeping table
    if (!dry || (await client.query("select to_regclass('gameshub.app_migration') as t")).rows[0].t) {
      done = new Map((await client.query('select name, checksum from gameshub.app_migration')).rows.map(r => [r.name, r.checksum]));
    }
    let applied = 0;
    for (const m of migrations) {
      if (done.has(m.name)) {
        if (done.get(m.name) !== m.checksum) throw new Error(`${m.name} was already applied and has changed since. Add a new migration instead of editing it.`);
        continue;
      }
      io.log(`${dry ? 'would apply' : 'applying'} migration ${m.name}`);
      if (!dry) {
        await client.query('begin');
        try {
          await client.query(m.sql);
          await client.query('insert into gameshub.app_migration (name, checksum) values ($1, $2)', [m.name, m.checksum]);
          await client.query('commit');
        } catch (e) { await client.query('rollback'); throw new Error(`${m.name}: ${e.message}`); }
      }
      applied++;
    }
    io.log(applied ? `${applied} migration(s) ${dry ? 'pending' : 'applied'}` : 'migrations: up to date');
    for (const p of permissions) {
      io.log(`${dry ? 'would apply' : 'applying'} permissions ${p.name}`);
      if (!dry) await client.query(p.sql);
    }
    return { applied, dry };
  } finally { await client.end(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run(process.argv.slice(2)).then(() => process.exit(0)).catch(e => { console.error('Error: ' + e.message); process.exit(1); });
}
