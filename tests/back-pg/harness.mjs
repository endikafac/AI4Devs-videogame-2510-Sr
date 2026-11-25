// Test harness for the Postgres backend (db/gameshub), on PGlite: real Postgres
// compiled to WebAssembly, no native binary, no server, no network.
//
// What it simulates of Neon (see docs/backend-opensource.md, "What PGlite can and
// cannot verify"):
//   * roles `authenticated` and `anonymous` (nologin), like the Data API ones;
//   * schema `auth` with `auth.uid()` reading the `sub` claim, like the Data API;
//   * the JWT claims in the `request.jwt.claims` setting (PostgREST convention);
//   * each request = one transaction with `set local role` + the claims.
// What it cannot: the real Data API (PostgREST translation, JWT signature
// verification, schema exposure), Neon Auth, and Neon's own role attributes.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';

const root = path.resolve(import.meta.dirname, '../..');
const dir = p => path.join(root, 'db/gameshub', p);
const sqlFiles = sub => fs.readdirSync(dir(sub)).filter(f => f.endsWith('.sql')).sort()
  .map(f => ({ name: f, sql: fs.readFileSync(path.join(dir(sub), f), 'utf8') }));

export const MIGRATIONS = () => sqlFiles('migrations');
export const PERMISSIONS = () => sqlFiles('permissions');

/** Stable uuid for a readable test user name ('own', 'gran'...). */
export function uid(name) {
  const h = crypto.createHash('sha1').update('gameshub-test:' + name).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

export async function openDb({ shim = true, permissions = true } = {}) {
  const db = new PGlite();
  // auth.uid() returns uuid, like the Neon one: cast in a wrapper function
  if (shim) {
    await db.exec(`
      create role authenticated nologin;
      create role anonymous nologin;
      create schema auth;
      grant usage on schema auth to authenticated, anonymous;
      create function auth.uid() returns uuid language sql stable as
        $$ select (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid $$;
    `);
  }
  for (const m of MIGRATIONS()) await db.exec(m.sql);
  if (permissions) for (const p of PERMISSIONS()) await db.exec(p.sql);
  return db;
}

const TABLES = 'gameshub.adults, gameshub.analytics_events, gameshub.admins, gameshub.challenges';
export async function reset(db) {
  await db.exec(`truncate ${TABLES} restart identity cascade`);
}

/**
 * A caller: one transaction per request, with the role and the JWT claims set
 * like the Data API does. `who` is a name from uid(), or null for a visitor
 * without a session (role anonymous).
 */
export function caller(db, who, { email, verified = true, role, claims: raw } = {}) {
  const claims = who == null ? null : JSON.stringify({
    sub: uid(who),
    ...(email ? { email, email_verified: verified } : {}),
    ...(raw || {}),
  });
  const r = role || (who == null ? 'anonymous' : 'authenticated');
  async function run(sql, params = []) {
    let out;
    await db.transaction(async tx => {
      await tx.query(`set local role ${r}`);
      if (claims) await tx.query('select set_config($1, $2, true)', ['request.jwt.claims', claims]);
      out = await tx.query(sql, params);
    });
    return out;
  }
  /** Succeeds and does something (returns rows or touches at least one row). */
  async function ok(sql, params) {
    const res = await run(sql, params);
    const n = (res.rows ? res.rows.length : 0) + (res.affectedRows || 0);
    if (n === 0) throw new Error('expected an effect, got nothing: ' + sql.slice(0, 90));
    return res;
  }
  /** Succeeds (even with no rows). */
  const any = (sql, params) => run(sql, params);
  /** Must raise an error (permission denied, policy or constraint violation). */
  async function fails(sql, params) {
    try { await run(sql, params); } catch (e) { return e; }
    throw new Error('expected an error, but it worked: ' + sql.slice(0, 90));
  }
  /** Nothing happens: it raises, or it returns and touches zero rows. Firestore "denied" for reads and writes. */
  async function none(sql, params) {
    try {
      const res = await run(sql, params);
      const n = (res.rows ? res.rows.length : 0) + (res.affectedRows || 0);
      if (n !== 0) throw new Error('expected nothing, got ' + n + ' for: ' + sql.slice(0, 90));
    } catch (e) {
      if (/expected nothing/.test(e.message)) throw e;
    }
  }
  const rows = async (sql, params) => (await run(sql, params)).rows;
  return { run, ok, any, fails, none, rows };
}

// ----------------------------------------------------------------- seeds (owner connection, RLS bypassed)
export async function seedOwner(db) {
  await db.query(`insert into gameshub.adults (id, username) values ($1, 'Luna')`, [uid('own')]);
  await db.query(`insert into gameshub.adult_game_stats (owner_id, game, stats) values ($1, 'mathmaster', '{"totalGames":3}')`, [uid('own')]);
  await db.query(`insert into gameshub.players (pid, owner_id, username) values ('kid123abc', $1, 'Pipo')`, [uid('own')]);
  await db.query(`insert into gameshub.player_game_stats (owner_id, pid, game, stats) values ($1, 'kid123abc', 'mathmaster', '{"totalGames":1}')`, [uid('own')]);
}

export async function seedInvite(db, id = '00000000-0000-4000-8000-0000000000a1', o = {}) {
  const v = { email: 'abuela@example.com', role: 'edit', expires: "now() + interval '30 days'", created: "now() - interval '1 day'", ...o };
  await db.query(
    `insert into gameshub.invites (id, owner_id, owner_name, email, role, created_at, expires)
     values ($1, $2, 'Luna', $3, $4, ${v.created}, ${v.expires})`,
    [id, uid('own'), v.email, v.role]);
  return id;
}
export const INV = '00000000-0000-4000-8000-0000000000a1';

export async function seedGuardian(db, who, role) {
  await db.query(
    `insert into gameshub.guardians (owner_id, guardian_id, email, name, owner_name, role, invite_id)
     values ($1, $2, $3, $4, 'Luna', $5, $6)`,
    [uid('own'), uid(who), who + '@example.com', who, role, INV]);
}

/** own + guardians gran (edit), pal (edit), teacher (view), with adult data of their own. */
export async function seedAdults(db) {
  await seedOwner(db);
  await seedGuardian(db, 'gran', 'edit');
  await seedGuardian(db, 'pal', 'edit');
  await seedGuardian(db, 'teacher', 'view');
  await db.query(`insert into gameshub.adults (id, username) values ($1, 'Abuela'), ($2, 'Papa')`, [uid('gran'), uid('pal')]);
  await db.query(`insert into gameshub.adult_game_stats (owner_id, game, stats) values ($1, 'mathmaster', '{"totalGames":7}'), ($2, 'mathmaster', '{"totalGames":9}')`, [uid('gran'), uid('pal')]);
  await db.query(`insert into gameshub.players (pid, owner_id, username) values ('grankid01', $1, 'Nieto')`, [uid('gran')]);
}

/** Valid PIN record (same shape as PlatformFirestore.hashPin). */
export const PIN = (o = {}) => ({ v: 1, alg: 'PBKDF2-SHA256', iter: 100000, salt: 'c2FsdHNhbHRzYWx0c2FsdA==', hash: 'aGFzaGhhc2hoYXNoaGFzaGhhc2hoYXNoaGFzaGhhc2g=', ...o });

/** A `daily` map with n days. */
export function DAILY(n) {
  const o = {};
  const start = Date.UTC(2026, 0, 1);
  for (let i = 0; i < n; i++) o[new Date(start + i * 86400000).toISOString().slice(0, 10)] = { games: 1, items: 10, minutes: 2.5, ok: 8 };
  return o;
}
