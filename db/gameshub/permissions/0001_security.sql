-- Row Level Security: enabled on EVERY table of the gameshub schema.
--
-- Not a migration: it is reapplied on every run and everything is idempotent.
-- It depends on no role, so it can run before the Neon Data API is enabled.
-- The policies and grants of the `authenticated` role are in 0002_data_api.sql.
--
-- Rule of the project: RLS on every table, no exceptions. With RLS on and no
-- policy nobody sees anything, which is the safe default for a new table.

alter table gameshub.adults            enable row level security;
alter table gameshub.players           enable row level security;
alter table gameshub.adult_game_stats  enable row level security;
alter table gameshub.player_game_stats enable row level security;
alter table gameshub.invites           enable row level security;
alter table gameshub.guardians         enable row level security;
alter table gameshub.nicknames         enable row level security;
alter table gameshub.leaderboard       enable row level security;
alter table gameshub.analytics_events  enable row level security;
alter table gameshub.admins            enable row level security;
alter table gameshub.challenges        enable row level security;
