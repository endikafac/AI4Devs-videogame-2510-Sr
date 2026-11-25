-- Permissions and policies of the role `authenticated`, the one the Neon Data
-- API uses. They reproduce firestore.rules (see docs/backend-opensource.md for
-- the rule by rule table).
--
-- Reapplied on every run, for the same reason as in PolyGo: enabling the Data
-- API in the Neon console can grant permissions in bulk, and a change made in
-- the console would silently reopen a hole. Applying this file every time
-- resets the matrix. Policies are dropped and created again each run.
--
-- Everything is inside a guarded block: the role `authenticated` and the
-- function auth.uid() are created by Neon when the Data API is enabled, and do
-- not exist before. Until then this file warns and does nothing.
--
-- IMPORTANT: the role is NOT created here (see PolyGo docs/13-migracion-neon.md:
-- creating it ourselves makes the Neon console refuse to enable the Data API).

do $outer$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    raise notice 'Role authenticated does not exist: the Neon Data API is not enabled. No permissions or policies applied. Enable it in the console and run the migrations again.';
    return;
  end if;
  if to_regprocedure('auth.uid()') is null then
    raise notice 'auth.uid() is missing (provided by the Data API). No policies applied.';
    return;
  end if;

  execute 'grant usage on schema gameshub to authenticated';
  execute 'grant usage on schema auth to authenticated';

  -- Deny by default. Any table or function that is not granted below stays closed.
  execute 'revoke all on all tables in schema gameshub from authenticated';
  execute 'revoke all on all sequences in schema gameshub from authenticated';
  execute 'revoke all on all functions in schema gameshub from public';
  execute 'revoke all on all functions in schema gameshub from authenticated';

  -- The optional anonymous role (visitors without a session) only ever gets the
  -- analytics insert, below.
  if exists (select 1 from pg_roles where rolname = 'anonymous') then
    execute 'revoke all on all tables in schema gameshub from anonymous';
    execute 'revoke all on all functions in schema gameshub from anonymous';
    execute 'grant usage on schema gameshub to anonymous';
  end if;

  -- memberships: the families I belong to. security_invoker so it only returns
  -- MY rows (guardians policy), never anybody else's. Needs PostgreSQL 15+.
  execute $sql$
    create or replace view gameshub.memberships with (security_invoker = true) as
      select owner_id, owner_name, role, since
      from gameshub.guardians
      where guardian_id = auth.uid()
  $sql$;

  -- ------------------------------------------------------------------ drop all
  drop policy if exists adults_own            on gameshub.adults;
  drop policy if exists players_read          on gameshub.players;
  drop policy if exists players_insert        on gameshub.players;
  drop policy if exists players_update        on gameshub.players;
  drop policy if exists players_delete        on gameshub.players;
  drop policy if exists adult_stats_own       on gameshub.adult_game_stats;
  drop policy if exists player_stats_read     on gameshub.player_game_stats;
  drop policy if exists player_stats_insert   on gameshub.player_game_stats;
  drop policy if exists player_stats_update   on gameshub.player_game_stats;
  drop policy if exists player_stats_delete   on gameshub.player_game_stats;
  drop policy if exists guardians_read        on gameshub.guardians;
  drop policy if exists guardians_delete      on gameshub.guardians;
  drop policy if exists invites_create        on gameshub.invites;
  drop policy if exists invites_read          on gameshub.invites;
  drop policy if exists invites_delete        on gameshub.invites;
  drop policy if exists nicknames_read_own    on gameshub.nicknames;
  drop policy if exists nicknames_create      on gameshub.nicknames;
  drop policy if exists nicknames_delete      on gameshub.nicknames;
  drop policy if exists leaderboard_read      on gameshub.leaderboard;
  drop policy if exists leaderboard_insert    on gameshub.leaderboard;
  drop policy if exists leaderboard_update    on gameshub.leaderboard;
  drop policy if exists leaderboard_delete    on gameshub.leaderboard;
  drop policy if exists analytics_insert      on gameshub.analytics_events;
  drop policy if exists analytics_insert_anon on gameshub.analytics_events;
  drop policy if exists analytics_read        on gameshub.analytics_events;
  drop policy if exists admins_read_own       on gameshub.admins;
  drop policy if exists challenges_read       on gameshub.challenges;

  -- ---------------------------------------------------------------- the adult
  -- users/{uid}: only the account holder reads, writes and deletes it (GDPR
  -- erasure from the client). A guardian never reaches the owner's adult data,
  -- nor another guardian's.
  execute $sql$
    create policy adults_own on gameshub.adults
      for all to authenticated
      using (id = auth.uid()) with check (id = auth.uid())
  $sql$;
  execute $sql$
    create policy adult_stats_own on gameshub.adult_game_stats
      for all to authenticated
      using (owner_id = auth.uid()) with check (owner_id = auth.uid())
  $sql$;

  -- ------------------------------------------------------------- the children
  -- users/{owner}/players/{pid} and its games: the owner, plus guardians by
  -- role. Deleting a child (or anything under it) is reserved to the owner.
  execute $sql$
    create policy players_read on gameshub.players
      for select to authenticated using (gameshub.can_read_kids(owner_id))
  $sql$;
  execute $sql$
    create policy players_insert on gameshub.players
      for insert to authenticated with check (gameshub.can_edit_kids(owner_id))
  $sql$;
  execute $sql$
    create policy players_update on gameshub.players
      for update to authenticated
      using (gameshub.can_edit_kids(owner_id)) with check (gameshub.can_edit_kids(owner_id))
  $sql$;
  execute $sql$
    create policy players_delete on gameshub.players
      for delete to authenticated using (owner_id = auth.uid())
  $sql$;

  execute $sql$
    create policy player_stats_read on gameshub.player_game_stats
      for select to authenticated using (gameshub.can_read_kids(owner_id))
  $sql$;
  execute $sql$
    create policy player_stats_insert on gameshub.player_game_stats
      for insert to authenticated with check (gameshub.can_edit_kids(owner_id))
  $sql$;
  execute $sql$
    create policy player_stats_update on gameshub.player_game_stats
      for update to authenticated
      using (gameshub.can_edit_kids(owner_id)) with check (gameshub.can_edit_kids(owner_id))
  $sql$;
  execute $sql$
    create policy player_stats_delete on gameshub.player_game_stats
      for delete to authenticated using (owner_id = auth.uid())
  $sql$;

  -- ------------------------------------------------------------------ family
  -- Guardians: read by the owner and by the guardian themself (only their own
  -- row, so a guardian never sees another guardian). Rows are created ONLY by
  -- accept_invite() (security definer), never by a direct insert. Nobody updates.
  execute $sql$
    create policy guardians_read on gameshub.guardians
      for select to authenticated
      using (owner_id = auth.uid() or guardian_id = auth.uid())
  $sql$;
  execute $sql$
    create policy guardians_delete on gameshub.guardians
      for delete to authenticated
      using (owner_id = auth.uid() or guardian_id = auth.uid())
  $sql$;

  -- Invitations: the owner creates them, the verified e-mail they are addressed
  -- to reads and deletes them, nobody updates. created_at is the column default
  -- (insert is column limited below), so `createdAt == request.time` holds.
  execute $sql$
    create policy invites_create on gameshub.invites
      for insert to authenticated
      with check (
        owner_id = auth.uid()
        and expires > now()
        and expires <= now() + interval '31 days'
        and exists (select 1 from gameshub.adults a where a.id = auth.uid() and a.username = owner_name)
      )
  $sql$;
  execute $sql$
    create policy invites_read on gameshub.invites
      for select to authenticated
      using (owner_id = auth.uid() or email = gameshub.verified_email())
  $sql$;
  execute $sql$
    create policy invites_delete on gameshub.invites
      for delete to authenticated
      using (owner_id = auth.uid() or email = gameshub.verified_email())
  $sql$;

  -- ---------------------------------------------------------------- nicknames
  -- Unique (primary key). Nobody can LIST them: a caller only sees their own
  -- rows, and checks a third party's nickname through nickname_available().
  -- A claim can never be overwritten (no update policy).
  execute $sql$
    create policy nicknames_read_own on gameshub.nicknames
      for select to authenticated using (owner_id = auth.uid())
  $sql$;
  execute $sql$
    create policy nicknames_create on gameshub.nicknames
      for insert to authenticated with check (owner_id = auth.uid())
  $sql$;
  execute $sql$
    create policy nicknames_delete on gameshub.nicknames
      for delete to authenticated using (owner_id = auth.uid())
  $sql$;

  -- -------------------------------------------------------------- leaderboard
  -- Anyone signed in reads. The owner writes their own rows (adult or child);
  -- a guardian with role 'edit' writes a CHILD row under the OWNER's id, never
  -- under their own. Deleting is the owner's only.
  execute $sql$
    create policy leaderboard_read on gameshub.leaderboard
      for select to authenticated using (true)
  $sql$;
  execute $sql$
    create policy leaderboard_insert on gameshub.leaderboard
      for insert to authenticated
      with check (owner_id = auth.uid() or (pid <> '' and gameshub.is_edit_guardian(owner_id)))
  $sql$;
  execute $sql$
    create policy leaderboard_update on gameshub.leaderboard
      for update to authenticated
      using (owner_id = auth.uid() or (pid <> '' and gameshub.is_edit_guardian(owner_id)))
      with check (owner_id = auth.uid() or (pid <> '' and gameshub.is_edit_guardian(owner_id)))
  $sql$;
  execute $sql$
    create policy leaderboard_delete on gameshub.leaderboard
      for delete to authenticated using (owner_id = auth.uid())
  $sql$;

  -- ---------------------------------------------------------------- analytics
  -- Anyone can create one valid event (the table constraints validate it and
  -- the column grant keeps ids out). Events are immutable. Only admins read.
  execute $sql$
    create policy analytics_insert on gameshub.analytics_events
      for insert to authenticated with check (true)
  $sql$;
  execute $sql$
    create policy analytics_read on gameshub.analytics_events
      for select to authenticated using (gameshub.is_admin())
  $sql$;
  execute $sql$
    create policy admins_read_own on gameshub.admins
      for select to authenticated using (user_id = auth.uid())
  $sql$;
  execute $sql$
    create policy challenges_read on gameshub.challenges
      for select to authenticated using (true)
  $sql$;

  -- -------------------------------------------------------------------- grants
  execute 'grant select, insert, update, delete on gameshub.adults, gameshub.players, '
       || 'gameshub.adult_game_stats, gameshub.player_game_stats, gameshub.leaderboard to authenticated';
  execute 'grant select, delete on gameshub.guardians to authenticated';
  execute 'grant select on gameshub.memberships to authenticated';
  execute 'grant select, delete on gameshub.invites to authenticated';
  execute 'grant insert (owner_id, owner_name, email, role, expires) on gameshub.invites to authenticated';
  execute 'grant select, insert, delete on gameshub.nicknames to authenticated';
  execute 'grant select on gameshub.analytics_events, gameshub.admins, gameshub.challenges to authenticated';
  execute 'grant insert (type, game, lang, auth, "first") on gameshub.analytics_events to authenticated';

  execute 'grant execute on function '
       || 'gameshub.is_guardian(uuid), gameshub.is_edit_guardian(uuid), gameshub.can_read_kids(uuid), '
       || 'gameshub.can_edit_kids(uuid), gameshub.is_admin(), gameshub.verified_email(), gameshub.claims(), '
       || 'gameshub.whoami(), gameshub.accept_invite(uuid, text), '
       || 'gameshub.bump_progress(uuid, text, numeric, numeric, integer), '
       || 'gameshub.claim_identity(text, text, text, jsonb, text), '
       || 'gameshub.create_player(text, text, text, text), gameshub.nickname_available(text), '
       || 'gameshub.delete_my_data(), '
       -- table constraints call these with the rights of the writer
       || 'gameshub.valid_pin(jsonb), gameshub.valid_interests(text[]), gameshub.valid_daily(jsonb) to authenticated';

  -- Visitors without a session: analytics only (policy and grant).
  if exists (select 1 from pg_roles where rolname = 'anonymous') then
    execute $sql$
      create policy analytics_insert_anon on gameshub.analytics_events
        for insert to anonymous with check (true)
    $sql$;
    execute 'grant insert (type, game, lang, auth, "first") on gameshub.analytics_events to anonymous';
  end if;

  raise notice 'gameshub: permissions and policies of the Data API applied.';
end $outer$;
