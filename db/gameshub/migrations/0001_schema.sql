-- Games Hub on Postgres: schema `gameshub`.
--
-- Same Neon project and Neon Auth as PolyGo (one Google login for both apps),
-- but its own schema, so code and data stay separate. Nothing here touches
-- `public`. Users come from Neon Auth: `auth.uid()` (a uuid) is the id of the
-- signed in adult, exactly like in PolyGo (see docs/backend-opensource.md).
--
-- Firestore -> Postgres mapping (details in docs/backend-opensource.md):
--   users/{uid}                          -> adults
--   users/{uid}/games/{game}             -> adult_game_stats
--   users/{uid}/players/{pid}            -> players
--   users/{uid}/players/{pid}/games/{g}  -> player_game_stats
--   users/{owner}/guardians/{gid}        -> guardians
--   users/{me}/memberships/{owner}       -> memberships (view over guardians)
--   invites/{id}                         -> invites
--   nicknames/{key}                      -> nicknames
--   leaderboard/{game}/scores/{id}       -> leaderboard
--   analytics_events, admins, challenges -> same names
--
-- This file has no dependency on Neon (no auth.uid(), no roles), so it runs on
-- any Postgres 15 or later. Policies and grants are in ../permissions/. The
-- owner connection (migrations, imports) bypasses RLS.

create schema if not exists gameshub;

-- ------------------------------------------------------------------ validators
-- Same checks as firestore.rules (validPin, validInterests, validDaily). They
-- are table constraints, so they hold for every writer, whatever the policy.

-- PIN record of a child: only a salted hash, fixed keys, bounded sizes. A JSON
-- null (or SQL null) means "no PIN".
create or replace function gameshub.valid_pin(p jsonb)
returns boolean language plpgsql immutable as $$
declare
  n numeric;
begin
  if p is null or jsonb_typeof(p) = 'null' then return true; end if;
  if jsonb_typeof(p) <> 'object' then return false; end if;
  if (select array_agg(k order by k) from jsonb_object_keys(p) k)
       is distinct from array['alg', 'hash', 'iter', 'salt', 'v'] then
    return false;
  end if;
  if jsonb_typeof(p -> 'v') <> 'number' or (p ->> 'v')::numeric <> 1 then return false; end if;
  if jsonb_typeof(p -> 'alg') <> 'string' or p ->> 'alg' <> 'PBKDF2-SHA256' then return false; end if;
  if jsonb_typeof(p -> 'iter') <> 'number' then return false; end if;
  n := (p ->> 'iter')::numeric;
  if n <> trunc(n) or n < 1000 or n > 1000000 then return false; end if;
  if jsonb_typeof(p -> 'salt') <> 'string' or char_length(p ->> 'salt') not between 16 and 32 then return false; end if;
  if jsonb_typeof(p -> 'hash') <> 'string' or char_length(p ->> 'hash') not between 32 and 64 then return false; end if;
  return true;
end $$;

-- Interests of a child: at most 5 ids of a FIXED list, no repeats, no nulls.
-- Keep the ids in sync with platform/interests.js (tests/back-pg/migrations.pg.test.mjs
-- compares them with this file).
create or replace function gameshub.valid_interests(a text[])
returns boolean language sql immutable as $$
  select a is null or (
    cardinality(a) <= 5
    and not exists (
      select 1 from unnest(a) e
      where e is null or e <> all (array['dinosaurs', 'space', 'sports', 'animals', 'videogames', 'pirates', 'robots',
                                          'magic', 'music', 'cooking', 'vehicles', 'nature', 'mystery', 'superheroes'])
    )
    and (select count(distinct e) from unnest(a) e) = cardinality(a)
  )
$$;

-- Daily summary of a game: a JSON object day -> {games, items, minutes, ok}, at
-- most 62 entries (the client keeps 60).
create or replace function gameshub.valid_daily(d jsonb)
returns boolean language plpgsql immutable as $$
begin
  if d is null or jsonb_typeof(d) = 'null' then return true; end if;
  if jsonb_typeof(d) <> 'object' then return false; end if;
  return (select count(*) from jsonb_object_keys(d)) <= 62;
end $$;

-- ---------------------------------------------------------------------- adults
-- The signed in adult (account holder). id = Neon Auth user id, no foreign key
-- to neon_auth."user" on purpose (same decision as PolyGo: neon_auth belongs to
-- Neon and a foreign key of ours could get in the way of their migrations).
create table if not exists gameshub.adults (
  id           uuid primary key,
  username     text not null default '' check (char_length(username) <= 40),
  avatar       text,
  photo_url    text,
  nickname_key text,
  xp           numeric not null default 0 check (xp >= 0),
  total_points numeric not null default 0 check (total_points >= 0),
  level        integer not null default 0,
  settings     jsonb not null default '{}'::jsonb,
  consent      jsonb,
  created_at   timestamptz not null default now(),
  last_login   timestamptz
);

-- ------------------------------------------------------------------- children
create table if not exists gameshub.players (
  pid          text primary key check (pid ~ '^[a-z0-9]{6,20}$'),
  owner_id     uuid not null references gameshub.adults (id) on delete cascade,
  username     text not null default '' check (char_length(username) <= 40),
  avatar       text,
  photo_url    text,
  nickname_key text,
  kind         text not null default 'child',
  xp           numeric not null default 0 check (xp >= 0),
  total_points numeric not null default 0 check (total_points >= 0),
  level        integer not null default 0,
  settings     jsonb not null default '{}'::jsonb,
  pin          jsonb check (gameshub.valid_pin(pin)),
  interests    text[] check (gameshub.valid_interests(interests)),
  created_at   timestamptz not null default now(),
  unique (owner_id, pid)
);
create index if not exists players_owner_idx on gameshub.players (owner_id);

-- ------------------------------------------------------------ stats per game
-- `stats` is the game document without `daily`; `daily` is its own column so the
-- 62 day cap is a plain constraint.
create table if not exists gameshub.adult_game_stats (
  owner_id   uuid not null references gameshub.adults (id) on delete cascade,
  game       text not null check (game ~ '^[A-Za-z0-9_-]{1,40}$'),
  stats      jsonb not null default '{}'::jsonb check (jsonb_typeof(stats) = 'object'),
  daily      jsonb check (gameshub.valid_daily(daily)),
  updated_at timestamptz not null default now(),
  primary key (owner_id, game)
);

create table if not exists gameshub.player_game_stats (
  owner_id   uuid not null,
  pid        text not null,
  game       text not null check (game ~ '^[A-Za-z0-9_-]{1,40}$'),
  stats      jsonb not null default '{}'::jsonb check (jsonb_typeof(stats) = 'object'),
  daily      jsonb check (gameshub.valid_daily(daily)),
  updated_at timestamptz not null default now(),
  primary key (pid, game),
  foreign key (owner_id, pid) references gameshub.players (owner_id, pid) on delete cascade
);
create index if not exists player_game_stats_owner_idx on gameshub.player_game_stats (owner_id);

-- ------------------------------------------------------------- family accounts
-- Invitation: created by the owner, consumed by accept_invite() (atomic).
create table if not exists gameshub.invites (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references gameshub.adults (id) on delete cascade,
  owner_name text not null check (char_length(owner_name) <= 40),
  email      text not null check (char_length(email) <= 254
                                   and email = lower(email)
                                   and email ~ '^[^@ ]+@[^@ ]+[.][^@ ]+$'),
  role       text not null check (role in ('edit', 'view')),
  created_at timestamptz not null default now(),
  expires    timestamptz not null,
  check (expires > created_at and expires <= created_at + interval '31 days')
);
create index if not exists invites_email_idx on gameshub.invites (email);
create index if not exists invites_owner_idx on gameshub.invites (owner_id);

-- Guardian of a family. One row serves both Firestore documents
-- (users/{owner}/guardians/{gid} and users/{gid}/memberships/{owner}), so a
-- membership can never be orphaned or forged.
create table if not exists gameshub.guardians (
  owner_id    uuid not null references gameshub.adults (id) on delete cascade,
  guardian_id uuid not null,
  email       text not null check (email = lower(email) and char_length(email) <= 254),
  name        text not null default '' check (char_length(name) <= 40),
  owner_name  text not null default '' check (char_length(owner_name) <= 40),
  role        text not null check (role in ('edit', 'view')),
  since       timestamptz not null default now(),
  invite_id   uuid,
  primary key (owner_id, guardian_id),
  check (guardian_id <> owner_id)
);
create index if not exists guardians_guardian_idx on gameshub.guardians (guardian_id);

-- -------------------------------------------------------------------- the rest
-- Unique nicknames: the key is the normalised nickname (identity.js).
create table if not exists gameshub.nicknames (
  key        text primary key check (char_length(key) between 1 and 60),
  owner_id   uuid not null references gameshub.adults (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists nicknames_owner_idx on gameshub.nicknames (owner_id);

-- Leaderboard. Firestore id `uid` or `uid_pid` becomes (owner_id, pid) with pid
-- '' for an adult. Scores are client reported: a friendly ranking.
create table if not exists gameshub.leaderboard (
  game         text not null check (game ~ '^[A-Za-z0-9_-]{1,40}$'),
  owner_id     uuid not null references gameshub.adults (id) on delete cascade,
  pid          text not null default '' check (pid = '' or pid ~ '^[a-z0-9]{6,20}$'),
  username     text not null check (char_length(username) <= 40),
  avatar       text,
  total_points numeric not null check (total_points >= 0),
  xp           numeric,
  level        integer,
  updated_at   timestamptz not null default now(),
  primary key (game, owner_id, pid)
);
create index if not exists leaderboard_rank_idx on gameshub.leaderboard (game, total_points desc);

-- Anonymous usage analytics: no ids, no personal data. `ts` is always the
-- server time (column default; the client may not set it).
create table if not exists gameshub.analytics_events (
  id   bigint generated always as identity primary key,
  ts   timestamptz not null default now(),
  type text not null check (type in ('visit', 'play')),
  game text not null check (char_length(game) <= 24),
  lang text not null check (lang in ('es', 'en', 'eu', 'gl', 'ca', 'fr')),
  auth boolean not null,
  "first" boolean not null
);
create index if not exists analytics_events_ts_idx on gameshub.analytics_events (ts desc);

-- Admins are created by hand with the owner connection, never from the app.
create table if not exists gameshub.admins (
  user_id    uuid primary key,
  created_at timestamptz not null default now()
);

-- Weekly challenges: read only for signed in users, loaded by an admin.
create table if not exists gameshub.challenges (
  id   text primary key,
  data jsonb not null default '{}'::jsonb
);
