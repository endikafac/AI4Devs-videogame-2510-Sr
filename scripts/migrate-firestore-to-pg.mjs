#!/usr/bin/env node
/**
 * Firestore export (JSON) -> Postgres `gameshub` schema (db/gameshub).
 *
 *   node scripts/migrate-firestore-to-pg.mjs --export firestore.json --auth-export auth.json --dry-run
 *   node scripts/migrate-firestore-to-pg.mjs --export firestore.json --auth-export auth.json --out migrate.sql
 *   DATABASE_URL=... node scripts/migrate-firestore-to-pg.mjs --export firestore.json --auth-export auth.json --apply
 *
 * Modes (exactly one effect):
 *   --dry-run   prints the summary and the warnings, writes nothing, touches no database
 *   --out FILE  writes one SQL transaction you can review and run with any Postgres client
 *   --apply     runs that same SQL in one transaction against DATABASE_URL
 *
 * Credentials: the connection string is read ONLY from the environment variable
 * DATABASE_URL (or from the gitignored file named by DATABASE_URL_FILE). It is never
 * accepted as an argument, because the corporate EDR logs the full command line.
 * `--apply` needs the `pg` package (pure JavaScript): `npm i --no-save pg`.
 *
 * Inputs
 *   --export FILE       Firestore data as JSON, in one of two shapes (see normalizeExport):
 *                       the `__collection__` shape of firestore-export-import, or the plain shape
 *                       { users: { uid: { data, games, players: { pid: { data, games } }, guardians, memberships } },
 *                         invites, nicknames, leaderboard: { game: { id: doc } }, admins }
 *   --auth-export FILE  `firebase auth:export auth.json` (users with localId and email). Needed to
 *                       find each person's Neon Auth account by e-mail.
 *   --uid-map FILE      optional JSON { "<firebase uid>": "<neon user uuid>" }, takes priority over the e-mail
 *   --skip-unmapped     skip people who have no Neon Auth account yet instead of aborting
 *
 * Rules (same as db/gameshub): photoURL is never migrated; rows that would break a
 * constraint are skipped with a warning (nothing is silently changed); expired invitations
 * are dropped; analytics events are not migrated (anonymous and aggregated). Re-running is
 * safe: every insert is `on conflict do nothing`, so nothing is ever overwritten.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PID = /^[a-z0-9]{6,20}$/;
const GAME = /^[A-Za-z0-9_-]{1,40}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const INTERESTS = ['dinosaurs', 'space', 'sports', 'animals', 'videogames', 'pirates', 'robots', 'magic', 'music', 'cooking', 'vehicles', 'nature', 'mystery', 'superheroes'];
const DAY = 86400000;

// ── Reading the export ──────────────────────────────────────────────────────

const isObj = x => x && typeof x === 'object' && !Array.isArray(x);

/** Firestore timestamp in any of the usual JSON forms -> ISO string, or null. */
export function toIso(v) {
  if (v == null) return null;
  if (isObj(v) && v.__datatype__ === 'timestamp' && v.value) v = v.value;
  if (isObj(v) && ('_seconds' in v || 'seconds' in v)) return new Date((Number(v._seconds ?? v.seconds) * 1000) + Math.floor(Number(v._nanoseconds ?? v.nanoseconds ?? 0) / 1e6)).toISOString();
  const d = typeof v === 'number' ? new Date(v) : new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Turns the `__collection__` shape of firestore-export-import into the plain shape. Plain input passes through. */
export function normalizeExport(json) {
  if (!isObj(json)) throw new Error('The export is not a JSON object');
  if (!json.__collection__) return json;
  const col = json.__collection__;
  const fields = d => { const o = {}; for (const k of Object.keys(d || {})) if (k !== '__collection__') o[k] = d[k]; return o; };
  const sub = (d, name) => (d && d.__collection__ && d.__collection__[name]) || {};
  const docs = (c, f) => { const o = {}; for (const id of Object.keys(c || {})) o[id] = f(c[id]); return o; };
  const out = { users: {}, invites: docs(col.invites, fields), nicknames: docs(col.nicknames, fields), admins: docs(col.admins, fields), leaderboard: {} };
  for (const uid of Object.keys(col.users || {})) {
    const u = col.users[uid];
    out.users[uid] = {
      data: fields(u),
      games: docs(sub(u, 'games'), fields),
      guardians: docs(sub(u, 'guardians'), fields),
      memberships: docs(sub(u, 'memberships'), fields),
      players: docs(sub(u, 'players'), p => ({ data: fields(p), games: docs(sub(p, 'games'), fields) }))
    };
  }
  for (const g of Object.keys(col.leaderboard || {})) out.leaderboard[g] = docs(sub(col.leaderboard[g], 'scores'), fields);
  return out;
}

// ── The same validators as the SQL (db/gameshub/migrations/0001_schema.sql) ─

export function validPin(p) {
  if (p == null) return true;
  if (!isObj(p)) return false;
  if (Object.keys(p).sort().join() !== 'alg,hash,iter,salt,v') return false;
  return p.v === 1 && p.alg === 'PBKDF2-SHA256' && Number.isInteger(p.iter) && p.iter >= 1000 && p.iter <= 1000000
    && typeof p.salt === 'string' && p.salt.length >= 16 && p.salt.length <= 32
    && typeof p.hash === 'string' && p.hash.length >= 32 && p.hash.length <= 64;
}
export function cleanInterests(list) {
  if (!Array.isArray(list)) return null;
  const out = [];
  for (const x of list) if (INTERESTS.includes(x) && !out.includes(x)) out.push(x);
  return out.slice(0, 5);
}

// ── Building the plan ───────────────────────────────────────────────────────

const num = (v, min = 0) => { const n = Number(v); return Number.isFinite(n) && n >= min ? n : min; };
const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
/** Deterministic uuid from an arbitrary Firestore id (invitation ids are not uuids). */
export const uuidOf = s => { const h = crypto.createHash('sha1').update('gameshub-invite:' + s).digest('hex'); return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`; };

function splitDaily(stats, warn, where) {
  const s = JSON.parse(JSON.stringify(stats || {}));
  let daily = s.daily;
  delete s.daily;
  if (daily != null && !isObj(daily)) { warn(`${where}: daily is not a map, dropped`); daily = null; }
  if (isObj(daily)) {
    const days = Object.keys(daily).sort();
    if (days.length > 62) { warn(`${where}: daily had ${days.length} days, kept the last 62`); for (const d of days.slice(0, days.length - 62)) delete daily[d]; }
  }
  return { stats: s, daily: daily || null };
}

/**
 * @param {Object} data    normalised export
 * @param {Object} opts    { authUsers: [{localId, email}], uidMap: {firebaseUid: uuid}, now }
 * @returns {{ rows, warnings, people, summary }}
 */
export function buildPlan(data, opts = {}) {
  const warnings = [];
  const warn = m => warnings.push(m);
  const now = opts.now || Date.now();
  const emailOf = {};
  for (const u of opts.authUsers || []) if (u && u.localId && u.email) emailOf[u.localId] = String(u.email).trim().toLowerCase();
  const uidMap = opts.uidMap || {};
  for (const [k, v] of Object.entries(uidMap)) if (!UUID.test(v)) throw new Error(`uid-map: ${k} is not a uuid`);

  const rows = { adults: [], adult_game_stats: [], players: [], player_game_stats: [], guardians: [], invites: [], nicknames: [], leaderboard: [], admins: [] };
  const people = new Set();                                    // firebase uids that appear as an owner, guardian or admin
  const users = data.users || {};
  const uid = id => { people.add(id); return id; };

  for (const owner of Object.keys(users)) {
    const u = users[owner] || {};
    const d = u.data || {};
    uid(owner);
    rows.adults.push({
      owner, username: str(d.username, 40), avatar: d.avatar || null, nickname_key: d.nicknameKey || null,
      xp: num(d.xp), total_points: num(d.totalPoints), level: Math.trunc(num(d.level)), settings: isObj(d.settings) ? d.settings : {},
      consent: isObj(d.consent) ? d.consent : null, created_at: toIso(d.createdAt), last_login: toIso(d.lastLogin)
    });
    if (d.photoURL) warn(`users/${owner}: photoURL not migrated (never stored)`);
    for (const game of Object.keys(u.games || {})) {
      if (!GAME.test(game)) { warn(`users/${owner}/games/${game}: invalid game id, skipped`); continue; }
      const { stats, daily } = splitDaily(u.games[game], warn, `users/${owner}/games/${game}`);
      rows.adult_game_stats.push({ owner, game, stats, daily });
    }
    for (const pid of Object.keys(u.players || {})) {
      const p = u.players[pid] || {};
      const pd = p.data || {};
      if (!PID.test(pid)) { warn(`users/${owner}/players/${pid}: pid does not match [a-z0-9]{6,20}, skipped with its stats`); continue; }
      let pin = pd.pin == null ? null : pd.pin;
      if (pin != null && !validPin(pin)) { warn(`users/${owner}/players/${pid}: PIN record is malformed, dropped (a new one can be set)`); pin = null; }
      const interests = cleanInterests(pd.interests);
      rows.players.push({
        owner, pid, username: str(pd.username, 40), avatar: pd.avatar || null, nickname_key: pd.nicknameKey || null,
        kind: str(pd.kind, 20) || 'child', xp: num(pd.xp), total_points: num(pd.totalPoints), level: Math.trunc(num(pd.level)),
        settings: isObj(pd.settings) ? pd.settings : {}, pin, interests: interests && interests.length ? interests : null, created_at: toIso(pd.createdAt)
      });
      if (pd.photoURL) warn(`users/${owner}/players/${pid}: photoURL not migrated (never stored)`);
      for (const game of Object.keys(p.games || {})) {
        if (!GAME.test(game)) { warn(`users/${owner}/players/${pid}/games/${game}: invalid game id, skipped`); continue; }
        const { stats, daily } = splitDaily(p.games[game], warn, `users/${owner}/players/${pid}/games/${game}`);
        rows.player_game_stats.push({ owner, pid, game, stats, daily });
      }
    }
    for (const gid of Object.keys(u.guardians || {})) {
      const g = u.guardians[gid] || {};
      if (gid === owner || !['edit', 'view'].includes(g.role)) { warn(`users/${owner}/guardians/${gid}: invalid guardian, skipped`); continue; }
      const mem = ((users[gid] || {}).memberships || {})[owner] || {};
      uid(gid);
      rows.guardians.push({
        owner, guardian: gid, email: String(g.email || emailOf[gid] || '').trim().toLowerCase(), name: str(g.name, 40),
        owner_name: str(mem.ownerName || d.username, 40), role: g.role, since: toIso(g.since), invite: g.inviteId ? uuidOf(g.inviteId) : null
      });
    }
  }

  for (const id of Object.keys(data.invites || {})) {
    const i = data.invites[id] || {};
    const expires = toIso(i.expires);
    if (!expires || Date.parse(expires) <= now) { warn(`invites/${id}: expired, not migrated`); continue; }
    if (!['edit', 'view'].includes(i.role) || !i.ownerUid || !users[i.ownerUid]) { warn(`invites/${id}: invalid or owner unknown, skipped`); continue; }
    const created = toIso(i.createdAt) || new Date(now).toISOString();
    const email = String(i.email || '').trim().toLowerCase();
    if (!/^[^@ ]+@[^@ ]+[.][^@ ]+$/.test(email) || email.length > 254) { warn(`invites/${id}: bad e-mail, skipped`); continue; }
    const maxExp = Date.parse(created) + 31 * DAY;
    uid(i.ownerUid);
    rows.invites.push({ id: uuidOf(id), owner: i.ownerUid, owner_name: str(i.ownerName, 40), email, role: i.role, created_at: created, expires: new Date(Math.min(Date.parse(expires), maxExp)).toISOString() });
  }
  const seen = new Set();
  for (const key of Object.keys(data.nicknames || {})) {
    const n = data.nicknames[key] || {};
    if (!n.uid || !users[n.uid] || key.length < 1 || key.length > 60 || seen.has(key)) { warn(`nicknames/${key}: owner unknown or invalid key, skipped`); continue; }
    seen.add(key);
    rows.nicknames.push({ key, owner: uid(n.uid), created_at: toIso(n.createdAt) });
  }
  for (const game of Object.keys(data.leaderboard || {})) {
    if (!GAME.test(game)) { warn(`leaderboard/${game}: invalid game id, skipped`); continue; }
    for (const id of Object.keys(data.leaderboard[game] || {})) {
      const s = data.leaderboard[game][id] || {};
      const [owner, pid = ''] = id.split('_');
      if (!users[owner] || (pid && !PID.test(pid)) || id.split('_').length > 2) { warn(`leaderboard/${game}/${id}: owner unknown or bad id, skipped`); continue; }
      rows.leaderboard.push({ game, owner, pid, username: str(s.username, 40), avatar: s.avatar || null, total_points: num(s.totalPoints), xp: num(s.xp), level: Math.trunc(num(s.level)), updated_at: toIso(s.updatedAt) });
    }
  }
  for (const id of Object.keys(data.admins || {})) rows.admins.push({ user: uid(id) });

  const counts = Object.fromEntries(Object.entries(rows).map(([k, v]) => [k, v.length]));
  const unmapped = [...people].filter(p => !uidMap[p] && !emailOf[p]);
  return { rows, warnings, people: [...people], emailOf, uidMap, unmapped, summary: counts };
}

// ── SQL ─────────────────────────────────────────────────────────────────────

export const lit = v => {
  if (v == null) return 'null';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  const s = String(v);
  if (s.includes('\u0000')) throw new Error('NUL character in a value');
  return "'" + s.replace(/'/g, "''") + "'";
};
const json = v => (v == null ? 'null' : lit(JSON.stringify(v)) + '::jsonb');
const ts = v => (v == null ? 'now()' : lit(v) + '::timestamptz');
const tsNull = v => (v == null ? 'null' : lit(v) + '::timestamptz');
const arr = a => (a == null ? 'null' : 'array[' + a.map(lit).join(', ') + ']::text[]');

/** Renders the plan as ONE SQL transaction. `unmapped` people are skipped (inner join) or abort the run. */
export function renderSql(plan, { skipUnmapped = false } = {}) {
  const r = plan.rows;
  const L = [];
  const add = s => L.push(s);
  add('-- Generated by scripts/migrate-firestore-to-pg.mjs. Review, then run as the database OWNER (RLS does not apply to it).');
  add('-- Idempotent: every insert is "on conflict do nothing". Contains personal data of children: keep it local, never commit it.');
  add('begin;');
  add('create temp table uid_map (firebase_uid text primary key, email text, neon_id uuid) on commit drop;');
  const people = plan.people;
  if (people.length) {
    add('insert into uid_map (firebase_uid, email, neon_id) values');
    add(people.map(p => `  (${lit(p)}, ${lit(plan.emailOf[p] || null)}, ${plan.uidMap[p] ? lit(plan.uidMap[p]) + '::uuid' : 'null'})`).join(',\n') + ';');
    add('-- people mapped by e-mail are matched against Neon Auth (they must have signed in once)');
    add(`update uid_map m set neon_id = u.id from neon_auth."user" u where m.neon_id is null and m.email is not null and lower(u.email) = m.email;`);
    if (skipUnmapped) add(`do $$ declare n int; begin select count(*) into n from uid_map where neon_id is null; if n > 0 then raise notice '% people have no Neon Auth account yet and are skipped', n; end if; end $$;`);
    else add(`do $$ declare n int; begin select count(*) into n from uid_map where neon_id is null; if n > 0 then raise exception '% people have no Neon Auth account yet. Ask them to sign in once, or run again with --skip-unmapped.', n; end if; end $$;`);
  }
  // each statement builds a values list of already escaped literals, then joins uid_map for the owners
  if (r.adults.length) {
    add(`-- adults: ${r.adults.length}`);
    add('insert into gameshub.adults (id, username, avatar, nickname_key, xp, total_points, level, settings, consent, created_at, last_login)');
    add('select m.neon_id, v.username, v.avatar, v.nickname_key, v.xp, v.total_points, v.level, v.settings, v.consent, coalesce(v.created_at, now()), v.last_login from (values');
    add(r.adults.map(a => `  (${lit(a.owner)}, ${lit(a.username)}, ${lit(a.avatar)}, ${lit(a.nickname_key)}, ${a.xp}::numeric, ${a.total_points}::numeric, ${a.level}::int, ${json(a.settings)}, ${json(a.consent)}, ${tsNull(a.created_at)}, ${tsNull(a.last_login)})`).join(',\n'));
    add(') as v(owner, username, avatar, nickname_key, xp, total_points, level, settings, consent, created_at, last_login) join uid_map m on m.firebase_uid = v.owner and m.neon_id is not null on conflict do nothing;');
  }
  if (r.adult_game_stats.length) {
    add(`-- adult_game_stats: ${r.adult_game_stats.length}`);
    add('insert into gameshub.adult_game_stats (owner_id, game, stats, daily)');
    add('select m.neon_id, v.game, v.stats, v.daily from (values');
    add(r.adult_game_stats.map(s => `  (${lit(s.owner)}, ${lit(s.game)}, ${json(s.stats)}, ${json(s.daily)})`).join(',\n'));
    add(') as v(owner, game, stats, daily) join uid_map m on m.firebase_uid = v.owner and m.neon_id is not null join gameshub.adults a on a.id = m.neon_id on conflict do nothing;');
  }
  if (r.players.length) {
    add(`-- players: ${r.players.length}`);
    add('insert into gameshub.players (pid, owner_id, username, avatar, nickname_key, kind, xp, total_points, level, settings, pin, interests, created_at)');
    add('select v.pid, m.neon_id, v.username, v.avatar, v.nickname_key, v.kind, v.xp, v.total_points, v.level, v.settings, v.pin, v.interests, coalesce(v.created_at, now()) from (values');
    add(r.players.map(p => `  (${lit(p.owner)}, ${lit(p.pid)}, ${lit(p.username)}, ${lit(p.avatar)}, ${lit(p.nickname_key)}, ${lit(p.kind)}, ${p.xp}::numeric, ${p.total_points}::numeric, ${p.level}::int, ${json(p.settings)}, ${json(p.pin)}, ${arr(p.interests)}, ${tsNull(p.created_at)})`).join(',\n'));
    add(') as v(owner, pid, username, avatar, nickname_key, kind, xp, total_points, level, settings, pin, interests, created_at) join uid_map m on m.firebase_uid = v.owner and m.neon_id is not null join gameshub.adults a on a.id = m.neon_id on conflict do nothing;');
  }
  if (r.player_game_stats.length) {
    add(`-- player_game_stats: ${r.player_game_stats.length}`);
    add('insert into gameshub.player_game_stats (owner_id, pid, game, stats, daily)');
    add('select p.owner_id, v.pid, v.game, v.stats, v.daily from (values');
    add(r.player_game_stats.map(s => `  (${lit(s.pid)}, ${lit(s.game)}, ${json(s.stats)}, ${json(s.daily)})`).join(',\n'));
    add(') as v(pid, game, stats, daily) join gameshub.players p on p.pid = v.pid on conflict do nothing;');
  }
  if (r.guardians.length) {
    add(`-- guardians (and their memberships): ${r.guardians.length}`);
    add('insert into gameshub.guardians (owner_id, guardian_id, email, name, owner_name, role, since, invite_id)');
    add('select o.neon_id, g.neon_id, v.email, v.name, v.owner_name, v.role, coalesce(v.since, now()), v.invite from (values');
    add(r.guardians.map(g => `  (${lit(g.owner)}, ${lit(g.guardian)}, ${lit(g.email)}, ${lit(g.name)}, ${lit(g.owner_name)}, ${lit(g.role)}, ${tsNull(g.since)}, ${g.invite ? lit(g.invite) + '::uuid' : 'null::uuid'})`).join(',\n'));
    add(') as v(owner, guardian, email, name, owner_name, role, since, invite) join uid_map o on o.firebase_uid = v.owner and o.neon_id is not null join uid_map g on g.firebase_uid = v.guardian and g.neon_id is not null join gameshub.adults a on a.id = o.neon_id on conflict do nothing;');
  }
  if (r.invites.length) {
    add(`-- invites (only the ones still valid): ${r.invites.length}`);
    add('insert into gameshub.invites (id, owner_id, owner_name, email, role, created_at, expires)');
    add('select v.id, o.neon_id, v.owner_name, v.email, v.role, v.created_at, v.expires from (values');
    add(r.invites.map(i => `  (${lit(i.id)}::uuid, ${lit(i.owner)}, ${lit(i.owner_name)}, ${lit(i.email)}, ${lit(i.role)}, ${lit(i.created_at)}::timestamptz, ${lit(i.expires)}::timestamptz)`).join(',\n'));
    add(') as v(id, owner, owner_name, email, role, created_at, expires) join uid_map o on o.firebase_uid = v.owner and o.neon_id is not null join gameshub.adults a on a.id = o.neon_id on conflict do nothing;');
  }
  if (r.nicknames.length) {
    add(`-- nicknames: ${r.nicknames.length}`);
    add('insert into gameshub.nicknames (key, owner_id, created_at)');
    add('select v.key, o.neon_id, coalesce(v.created_at, now()) from (values');
    add(r.nicknames.map(n => `  (${lit(n.key)}, ${lit(n.owner)}, ${tsNull(n.created_at)})`).join(',\n'));
    add(') as v(key, owner, created_at) join uid_map o on o.firebase_uid = v.owner and o.neon_id is not null join gameshub.adults a on a.id = o.neon_id on conflict do nothing;');
  }
  if (r.leaderboard.length) {
    add(`-- leaderboard: ${r.leaderboard.length}`);
    add('insert into gameshub.leaderboard (game, owner_id, pid, username, avatar, total_points, xp, level, updated_at)');
    add('select v.game, o.neon_id, v.pid, v.username, v.avatar, v.total_points, v.xp, v.level, coalesce(v.updated_at, now()) from (values');
    add(r.leaderboard.map(s => `  (${lit(s.game)}, ${lit(s.owner)}, ${lit(s.pid)}, ${lit(s.username)}, ${lit(s.avatar)}, ${s.total_points}::numeric, ${s.xp}::numeric, ${s.level}::int, ${tsNull(s.updated_at)})`).join(',\n'));
    add(') as v(game, owner, pid, username, avatar, total_points, xp, level, updated_at) join uid_map o on o.firebase_uid = v.owner and o.neon_id is not null join gameshub.adults a on a.id = o.neon_id on conflict do nothing;');
  }
  if (r.admins.length) {
    add(`-- admins: ${r.admins.length}`);
    add('insert into gameshub.admins (user_id)');
    add('select m.neon_id from (values');
    add(r.admins.map(a => `  (${lit(a.user)})`).join(',\n'));
    add(') as v(u) join uid_map m on m.firebase_uid = v.u and m.neon_id is not null on conflict do nothing;');
  }
  add('commit;');
  return L.join('\n') + '\n';
}

// ── Command line ────────────────────────────────────────────────────────────

export function parseArgs(argv) {
  const o = { flags: new Set(), values: {} };
  const withValue = ['--export', '--auth-export', '--uid-map', '--out'];
  const bare = ['--dry-run', '--apply', '--skip-unmapped', '--help'];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (/^--(database-url|db-url|url|password|dsn)/i.test(a) || /^postgres(ql)?:\/\//i.test(a)) throw new Error('The connection string is never an argument (the EDR logs the command line). Use the DATABASE_URL environment variable.');
    if (withValue.includes(a)) { if (i + 1 >= argv.length) throw new Error(`${a} needs a value`); o.values[a.slice(2)] = argv[++i]; }
    else if (bare.includes(a)) o.flags.add(a.slice(2));
    else throw new Error(`Unknown argument: ${a}`);
  }
  return o;
}

const readJson = f => JSON.parse(fs.readFileSync(f, 'utf8'));

/** The URL of the database, from the environment or from a gitignored file. Never from argv. */
export function databaseUrl(env) {
  if (env.DATABASE_URL) return env.DATABASE_URL;
  if (env.DATABASE_URL_FILE) return fs.readFileSync(env.DATABASE_URL_FILE, 'utf8').trim();
  throw new Error('Set DATABASE_URL (or DATABASE_URL_FILE pointing to a gitignored file). It is never read from the command line.');
}

export async function main(argv, env = process.env, io = { log: console.log, err: console.error }, deps = {}) {
  const a = parseArgs(argv);
  if (a.flags.has('help') || !a.values.export) { io.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('*/')[0].replace(/^#!.*\n/, '').replace(/^\/\*\*\n|^ \* ?/gm, '')); return a.flags.has('help') ? 0 : 1; }
  const modes = ['dry-run', 'apply'].filter(m => a.flags.has(m)).length + (a.values.out ? 1 : 0);
  if (modes !== 1) throw new Error('Choose exactly one of --dry-run, --out FILE or --apply');
  const data = normalizeExport(readJson(a.values.export));
  const auth = a.values['auth-export'] ? readJson(a.values['auth-export']) : {};
  const plan = buildPlan(data, { authUsers: auth.users || [], uidMap: a.values['uid-map'] ? readJson(a.values['uid-map']) : {} });
  io.log('Rows to migrate: ' + Object.entries(plan.summary).map(([k, v]) => `${k}=${v}`).join(', '));
  io.log(`People: ${plan.people.length}${plan.unmapped.length ? `, WITHOUT e-mail or mapping: ${plan.unmapped.length}` : ''}`);
  for (const w of plan.warnings) io.log('warning: ' + w);
  if (plan.unmapped.length && !a.flags.has('skip-unmapped')) io.log('warning: people without e-mail or uid-map cannot be matched to Neon Auth; the SQL will stop unless you use --skip-unmapped');
  if (a.flags.has('dry-run')) { io.log('Dry run: nothing written, no database touched.'); return 0; }
  const sql = renderSql(plan, { skipUnmapped: a.flags.has('skip-unmapped') });
  if (a.values.out) { fs.writeFileSync(a.values.out, sql, { mode: 0o600 }); io.log(`SQL written to ${a.values.out} (contains personal data: keep it local, delete it after use).`); return 0; }
  const url = databaseUrl(env);
  const pg = deps.pg || (await import('pg').catch(() => { throw new Error('--apply needs the "pg" package: npm i --no-save pg'); }));
  const Client = pg.Client || (pg.default && pg.default.Client);
  const client = new Client({ connectionString: url, ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: true } });
  await client.connect();
  try { await client.query(sql); io.log('Applied in one transaction.'); } finally { await client.end(); }
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(c => process.exit(c)).catch(e => { console.error('Error: ' + e.message); process.exit(1); });
}
