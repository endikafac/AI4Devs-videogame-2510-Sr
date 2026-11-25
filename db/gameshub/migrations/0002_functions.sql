-- Helper functions, triggers and RPCs of the gameshub schema.
--
-- Everything here is plpgsql on purpose: the body is not resolved when the
-- function is created, so this file also applies BEFORE the Neon Data API is
-- enabled (auth.uid() does not exist until then). Grants and the policies that
-- use these functions are in ../permissions/0002_data_api.sql.
--
-- Two kinds of function:
--   * helpers used by the RLS policies (security definer, so a policy on one
--     table can look at `guardians` without recursing into its own policy);
--   * RPCs the client calls through the Data API (`POST /rpc/<name>`). Those
--     that must be atomic or need rights the caller does not have are security
--     definer; the rest run with the rights of the caller, so RLS still applies.

-- ------------------------------------------------------------ identity helpers
-- Claims of the verified JWT. The Data API is PostgREST: it puts the claims in
-- the `request.jwt.claims` setting. If a future Neon version only exposes
-- auth.session(), use that. Never trusts anything outside the JWT.
create or replace function gameshub.claims()
returns jsonb language plpgsql stable as $$
declare
  c jsonb;
begin
  begin
    c := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
  exception when others then
    c := null;
  end;
  if c is null and to_regprocedure('auth.session()') is not null then
    begin
      execute 'select auth.session()' into c;
    exception when others then
      c := null;
    end;
  end if;
  return c;
end $$;

-- The caller's e-mail, lowercased, ONLY when the identity provider says it is
-- verified. '' otherwise. Same as `verifiedEmail()` in firestore.rules.
--
-- Where it looks, in order:
--   1. the JWT claims `email` + `email_verified` (or Better Auth's camelCase
--      `emailVerified`, which is what its JWT plugin puts in by default);
--   2. if the JWT has no e-mail claim at all, the Neon Auth user row
--      (neon_auth."user") of auth.uid(): the database is as trustworthy as the JWT.
-- Anything else is '': an unverified or unknown address never matches an invitation.
create or replace function gameshub.verified_email()
returns text language plpgsql stable security definer set search_path = gameshub, pg_temp as $$
declare
  c jsonb := gameshub.claims();
  v text;
  r text;
begin
  if c is not null and c ? 'email' then
    v := lower(coalesce(c ->> 'email_verified', c ->> 'emailVerified', 'false'));
    if v <> 'true' then return ''; end if;
    return lower(coalesce(c ->> 'email', ''));
  end if;
  if auth.uid() is not null and to_regclass('neon_auth."user"') is not null then
    begin
      execute 'select case when "emailVerified" then lower(email) else '''' end from neon_auth."user" where id::text = $1'
        into r using auth.uid()::text;
      return coalesce(r, '');
    exception when others then
      return '';
    end;
  end if;
  return '';
end $$;

-- Is `owner` a family I am a guardian of? (any role)
create or replace function gameshub.is_guardian(owner uuid)
returns boolean language plpgsql stable security definer set search_path = gameshub, pg_temp as $$
begin
  return auth.uid() is not null and exists (
    select 1 from gameshub.guardians g where g.owner_id = owner and g.guardian_id = auth.uid()
  );
end $$;

-- Am I a guardian with role 'edit' of this family?
create or replace function gameshub.is_edit_guardian(owner uuid)
returns boolean language plpgsql stable security definer set search_path = gameshub, pg_temp as $$
begin
  return auth.uid() is not null and exists (
    select 1 from gameshub.guardians g
    where g.owner_id = owner and g.guardian_id = auth.uid() and g.role = 'edit'
  );
end $$;

-- canReadKids / canEditKids of firestore.rules.
create or replace function gameshub.can_read_kids(owner uuid)
returns boolean language plpgsql stable security definer set search_path = gameshub, pg_temp as $$
begin
  return auth.uid() is not null and (owner = auth.uid() or gameshub.is_guardian(owner));
end $$;

create or replace function gameshub.can_edit_kids(owner uuid)
returns boolean language plpgsql stable security definer set search_path = gameshub, pg_temp as $$
begin
  return auth.uid() is not null and (owner = auth.uid() or gameshub.is_edit_guardian(owner));
end $$;

create or replace function gameshub.is_admin()
returns boolean language plpgsql stable security definer set search_path = gameshub, pg_temp as $$
begin
  return auth.uid() is not null and exists (select 1 from gameshub.admins a where a.user_id = auth.uid());
end $$;

-- Diagnostic: what the database sees of the caller. Used by the checklist in
-- docs/backend-opensource.md to confirm that the JWT reaches Postgres.
create or replace function gameshub.whoami()
returns jsonb language plpgsql stable as $$
begin
  return jsonb_build_object('uid', auth.uid(), 'email', gameshub.verified_email(), 'role', current_user);
end $$;

-- ------------------------------------------------------------------- triggers
-- Keys that never change. A column grant would break PostgREST upserts (they
-- list every column in SET), so a trigger enforces it for every writer.
create or replace function gameshub.lock_keys()
returns trigger language plpgsql as $$
declare
  c text;
begin
  foreach c in array tg_argv loop
    if to_jsonb(new) ->> c is distinct from to_jsonb(old) ->> c then
      raise exception 'column % cannot be changed', c using errcode = '42501';
    end if;
  end loop;
  return new;
end $$;

drop trigger if exists adults_lock on gameshub.adults;
create trigger adults_lock before update on gameshub.adults
  for each row execute function gameshub.lock_keys('id');
drop trigger if exists players_lock on gameshub.players;
create trigger players_lock before update on gameshub.players
  for each row execute function gameshub.lock_keys('pid', 'owner_id');
drop trigger if exists adult_game_stats_lock on gameshub.adult_game_stats;
create trigger adult_game_stats_lock before update on gameshub.adult_game_stats
  for each row execute function gameshub.lock_keys('owner_id', 'game');
drop trigger if exists player_game_stats_lock on gameshub.player_game_stats;
create trigger player_game_stats_lock before update on gameshub.player_game_stats
  for each row execute function gameshub.lock_keys('owner_id', 'pid', 'game');
drop trigger if exists leaderboard_lock on gameshub.leaderboard;
create trigger leaderboard_lock before update on gameshub.leaderboard
  for each row execute function gameshub.lock_keys('game', 'owner_id', 'pid');
drop trigger if exists guardians_lock on gameshub.guardians;
create trigger guardians_lock before update on gameshub.guardians
  for each row execute function gameshub.lock_keys('owner_id', 'guardian_id');

-- Deleting a child also removes its leaderboard rows and its nickname, whoever
-- reserved it (a guardian with role 'edit' may have created the child).
create or replace function gameshub.players_after_delete()
returns trigger language plpgsql security definer set search_path = gameshub, pg_temp as $$
begin
  delete from gameshub.leaderboard where owner_id = old.owner_id and pid = old.pid;
  if old.nickname_key is not null then
    delete from gameshub.nicknames where key = old.nickname_key;
  end if;
  return old;
end $$;

drop trigger if exists players_cleanup on gameshub.players;
create trigger players_cleanup after delete on gameshub.players
  for each row execute function gameshub.players_after_delete();

-- ----------------------------------------------------------------------- RPCs
-- Accept an invitation: the guardian row is created and the invitation consumed
-- in ONE transaction, only for the verified e-mail it is addressed to, before it
-- expires. Replaying the call after a revocation fails (the invitation is gone).
-- Same checks as the `guardians` create rule of firestore.rules.
create or replace function gameshub.accept_invite(p_invite uuid, p_name text default '')
returns jsonb language plpgsql security definer set search_path = gameshub, pg_temp as $$
declare
  me  uuid := auth.uid();
  inv gameshub.invites%rowtype;
  mail text := gameshub.verified_email();
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  select * into inv from gameshub.invites where id = p_invite for update;
  -- One message for "does not exist" and "not yours": do not reveal invitations.
  if not found or mail = '' or inv.email <> mail then
    raise exception 'invite not available' using errcode = '42501';
  end if;
  if inv.expires <= now() then
    raise exception 'invite expired' using errcode = '42501';
  end if;
  if inv.owner_id = me then
    raise exception 'cannot accept your own invite' using errcode = '42501';
  end if;
  delete from gameshub.invites where id = inv.id;
  insert into gameshub.guardians (owner_id, guardian_id, email, name, owner_name, role, since, invite_id)
  values (inv.owner_id, me, mail, left(coalesce(p_name, ''), 40), inv.owner_name, inv.role, now(), inv.id)
  on conflict (owner_id, guardian_id) do update
    set email = excluded.email, name = excluded.name, owner_name = excluded.owner_name,
        role = excluded.role, since = excluded.since, invite_id = excluded.invite_id;
  return jsonb_build_object('owner_id', inv.owner_id, 'owner_name', inv.owner_name, 'role', inv.role);
end $$;

-- Atomic XP and points increment (Firestore FieldValue.increment). Runs with the
-- caller's rights: RLS decides whether the caller may write that player.
-- p_pid '' or null means the adult's own profile.
create or replace function gameshub.bump_progress(p_owner uuid, p_pid text, p_xp numeric, p_points numeric, p_level integer)
returns jsonb language plpgsql as $$
declare
  r record;
begin
  if coalesce(p_xp, 0) < 0 or coalesce(p_points, 0) < 0 then
    raise exception 'negative increment' using errcode = '22023';
  end if;
  if coalesce(p_pid, '') = '' then
    update gameshub.adults
       set xp = xp + coalesce(p_xp, 0), total_points = total_points + coalesce(p_points, 0), level = coalesce(p_level, level)
     where id = p_owner
    returning xp, total_points, level into r;
  else
    update gameshub.players
       set xp = xp + coalesce(p_xp, 0), total_points = total_points + coalesce(p_points, 0), level = coalesce(p_level, level)
     where pid = p_pid and owner_id = p_owner
    returning xp, total_points, level into r;
  end if;
  if not found then
    raise exception 'profile not found or not writable' using errcode = '42501';
  end if;
  return jsonb_build_object('xp', r.xp, 'total_points', r.total_points, 'level', r.level);
end $$;

-- Reserve a nickname and save the identity and consent of the adult in one
-- transaction (identity.js claim). Raises 23505 when somebody else has it.
create or replace function gameshub.claim_identity(p_username text, p_key text, p_avatar text, p_consent jsonb, p_previous_key text default null)
returns void language plpgsql as $$
declare
  me uuid := auth.uid();
begin
  if me is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  insert into gameshub.adults (id) values (me) on conflict (id) do nothing;
  insert into gameshub.nicknames (key, owner_id) values (p_key, me) on conflict (key) do nothing;
  -- RLS shows me only my own nicknames: not visible means somebody else holds it.
  if not exists (select 1 from gameshub.nicknames where key = p_key and owner_id = me) then
    raise exception 'nickname taken' using errcode = '23505';
  end if;
  if p_previous_key is not null and p_previous_key <> p_key then
    delete from gameshub.nicknames where key = p_previous_key and owner_id = me;
  end if;
  update gameshub.adults
     set username = p_username, nickname_key = p_key, avatar = p_avatar, photo_url = null, consent = p_consent
   where id = me;
end $$;

-- Create a child and reserve its nickname in one transaction (identity.js createPlayer).
create or replace function gameshub.create_player(p_pid text, p_username text, p_key text, p_avatar text)
returns void language plpgsql as $$
declare
  me uuid := auth.uid();
begin
  if me is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  insert into gameshub.nicknames (key, owner_id) values (p_key, me);       -- 23505 when taken
  insert into gameshub.players (pid, owner_id, username, nickname_key, avatar, kind)
  values (p_pid, me, p_username, p_key, p_avatar, 'child');
end $$;

-- Is a nickname free? (Firestore allowed a get by id, never a list.)
create or replace function gameshub.nickname_available(p_key text)
returns boolean language plpgsql stable security definer set search_path = gameshub, pg_temp as $$
begin
  if auth.uid() is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  return not exists (select 1 from gameshub.nicknames where key = p_key);
end $$;

-- GDPR erasure of everything the caller owns or is part of. The caller deletes
-- the authentication account afterwards (docs/backend-opensource.md).
create or replace function gameshub.delete_my_data()
returns void language plpgsql security definer set search_path = gameshub, pg_temp as $$
declare
  me uuid := auth.uid();
begin
  if me is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  delete from gameshub.guardians where guardian_id = me;
  delete from gameshub.invites where owner_id = me;
  -- children, stats, leaderboard, nicknames, invites and guardians of my family go with it (on delete cascade)
  delete from gameshub.adults where id = me;
end $$;
