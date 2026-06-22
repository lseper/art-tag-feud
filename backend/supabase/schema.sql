-- Supabase Postgres schema for art-tag-feud
-- Matches backend/server.ts runtime state and types.ts DTOs

create extension if not exists "pgcrypto";

-- Enums (safe to re-run)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tag_type') THEN
    CREATE TYPE tag_type AS ENUM ('general', 'species', 'character', 'artist');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'preferlist_frequency') THEN
    CREATE TYPE preferlist_frequency AS ENUM ('most', 'all');
  END IF;
END $$;

-- Core identity
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  username text not null,
  is_bot boolean not null default false,
  bot_profile_id uuid,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

-- Safe upgrades for existing tables
alter table if exists players
  add column if not exists is_bot boolean not null default false;
alter table if exists players
  add column if not exists bot_profile_id uuid;

create unique index if not exists players_auth_user_id_unique
  on players (auth_user_id)
  where auth_user_id is not null;

create index if not exists players_bot_profile_id_idx
  on players (bot_profile_id);

-- Bot definitions (allow different behaviors per mode)
create table if not exists bot_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  aggressiveness integer not null default 50,
  created_at timestamptz not null default now()
);

create table if not exists bot_mode_behaviors (
  id uuid primary key default gen_random_uuid(),
  bot_profile_id uuid not null references bot_profiles(id) on delete cascade,
  game_mode text not null,
  lobby_icon_delay_min_ms integer not null default 5000,
  lobby_icon_delay_max_ms integer not null default 10000,
  lobby_ready_delay_min_ms integer not null default 2000,
  lobby_ready_delay_max_ms integer not null default 5000,
  guess_interval_min_ms integer not null default 2000,
  guess_interval_max_ms integer not null default 10000,
  created_at timestamptz not null default now(),
  unique (bot_profile_id, game_mode)
);

create index if not exists bot_mode_behaviors_game_mode_idx
  on bot_mode_behaviors (game_mode);

-- Seed baseline Blitz behavior (safe to run multiple times)
insert into bot_profiles (name, aggressiveness)
values ('blitz_high', 80)
on conflict (name) do nothing;

insert into bot_mode_behaviors (
  bot_profile_id,
  game_mode,
  lobby_icon_delay_min_ms,
  lobby_icon_delay_max_ms,
  lobby_ready_delay_min_ms,
  lobby_ready_delay_max_ms,
  guess_interval_min_ms,
  guess_interval_max_ms
)
select id, 'Blitz', 5000, 10000, 2000, 5000, 2000, 10000
from bot_profiles
where name = 'blitz_high'
on conflict (bot_profile_id, game_mode) do nothing;

insert into bot_profiles (name, aggressiveness)
values
  ('saint', 25),
  ('sinner', 55),
  ('succubus', 85)
on conflict (name) do nothing;

insert into bot_mode_behaviors (
  bot_profile_id,
  game_mode,
  lobby_icon_delay_min_ms,
  lobby_icon_delay_max_ms,
  lobby_ready_delay_min_ms,
  lobby_ready_delay_max_ms,
  guess_interval_min_ms,
  guess_interval_max_ms
)
select id, 'Blitz', 7000, 12000, 4000, 7000, 6000, 12000
from bot_profiles
where name = 'saint'
on conflict (bot_profile_id, game_mode) do nothing;

insert into bot_mode_behaviors (
  bot_profile_id,
  game_mode,
  lobby_icon_delay_min_ms,
  lobby_icon_delay_max_ms,
  lobby_ready_delay_min_ms,
  lobby_ready_delay_max_ms,
  guess_interval_min_ms,
  guess_interval_max_ms
)
select id, 'Blitz', 5000, 9000, 3000, 6000, 3500, 8000
from bot_profiles
where name = 'sinner'
on conflict (bot_profile_id, game_mode) do nothing;

insert into bot_mode_behaviors (
  bot_profile_id,
  game_mode,
  lobby_icon_delay_min_ms,
  lobby_icon_delay_max_ms,
  lobby_ready_delay_min_ms,
  lobby_ready_delay_max_ms,
  guess_interval_min_ms,
  guess_interval_max_ms
)
select id, 'Blitz', 3000, 7000, 2000, 5000, 1500, 5000
from bot_profiles
where name = 'succubus'
on conflict (bot_profile_id, game_mode) do nothing;

-- Rooms (live state)
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_player_id uuid references players(id) on delete set null,
  posts_per_round integer not null default 2,
  rounds_per_game integer not null default 1,
  bot_count integer not null default 0,
  bot_difficulty text not null default 'Sinner',
  bot_difficulties jsonb not null default '[]'::jsonb,
  cur_round integer not null default 0,
  posts_viewed_this_round integer not null default 0,
  game_started boolean not null default false,
  is_private boolean not null default false,
  room_code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists rooms
  add column if not exists bot_count integer not null default 0;
alter table if exists rooms
  add column if not exists bot_difficulty text not null default 'Sinner';
alter table if exists rooms
  add column if not exists bot_difficulties jsonb not null default '[]'::jsonb;
alter table if exists rooms
  add column if not exists is_private boolean not null default false;
alter table if exists rooms
  add column if not exists room_code text;

create index if not exists rooms_owner_player_id_idx on rooms (owner_player_id);
create unique index if not exists rooms_room_code_unique on rooms (room_code);

-- Room membership and live per-player state
create table if not exists room_members (
  room_id uuid not null references rooms(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  score integer not null default 0,
  icon text,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (room_id, player_id)
);

create index if not exists room_members_player_id_idx on room_members (player_id);

create table if not exists room_ready_state (
  room_id uuid not null,
  player_id uuid not null,
  ready boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (room_id, player_id),
  foreign key (room_id, player_id)
    references room_members(room_id, player_id)
    on delete cascade
);

create table if not exists room_blacklist (
  room_id uuid not null references rooms(id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default now(),
  primary key (room_id, tag)
);

create table if not exists room_preferlist (
  room_id uuid not null references rooms(id) on delete cascade,
  tag text not null,
  frequency preferlist_frequency not null default 'most',
  created_at timestamptz not null default now(),
  primary key (room_id, tag)
);

create index if not exists room_preferlist_tag_idx on room_preferlist (tag);
create index if not exists room_blacklist_tag_idx on room_blacklist (tag);

-- Posts and tags (cache of served posts)
create table if not exists posts (
  id bigint primary key,
  url text not null,
  created_at timestamptz not null default now()
);

create table if not exists post_tags (
  post_id bigint not null references posts(id) on delete cascade,
  tag text not null,
  tag_type tag_type not null,
  score integer not null,
  primary key (post_id, tag, tag_type)
);

create index if not exists post_tags_tag_idx on post_tags (tag);

-- Game history
create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete set null,
  created_by_player_id uuid references players(id) on delete set null,
  posts_per_round integer not null,
  rounds_per_game integer not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists games_room_id_idx on games (room_id);

create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  round_index integer not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  unique (game_id, round_index)
);

create index if not exists rounds_game_id_idx on rounds (game_id);

create table if not exists round_posts (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  post_id bigint references posts(id) on delete set null,
  post_order integer not null,
  shown_at timestamptz not null default now(),
  unique (round_id, post_order)
);

create index if not exists round_posts_round_id_idx on round_posts (round_id);
create index if not exists round_posts_post_id_idx on round_posts (post_id);

-- Bot action sequences per round post
create table if not exists bot_action_sequences (
  id uuid primary key default gen_random_uuid(),
  round_post_id uuid not null references round_posts(id) on delete cascade,
  bot_profile_id uuid references bot_profiles(id) on delete set null,
  game_mode text not null,
  action_sequence jsonb not null,
  created_at timestamptz not null default now(),
  unique (round_post_id, bot_profile_id)
);

create index if not exists bot_action_sequences_round_post_id_idx
  on bot_action_sequences (round_post_id);

create table if not exists guesses (
  id uuid primary key default gen_random_uuid(),
  round_post_id uuid not null references round_posts(id) on delete cascade,
  player_id uuid references players(id) on delete set null,
  guessed_tag text not null,
  tag_type tag_type not null,
  score integer not null,
  created_at timestamptz not null default now()
);

create index if not exists guesses_player_id_idx on guesses (player_id);
create index if not exists guesses_round_post_id_idx on guesses (round_post_id);

create table if not exists leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  round_id uuid references rounds(id) on delete set null,
  created_at timestamptz not null default now(),
  snapshot jsonb not null
);
