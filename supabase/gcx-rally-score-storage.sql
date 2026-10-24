-- Rally scores are read and written through the server's validated arcade API.
create table if not exists public.arcade_scores (
  id uuid primary key default gen_random_uuid(),
  local_id text,
  game_id text not null,
  day_id text not null,
  player_key text not null,
  player_name text not null,
  score integer not null default 0 check (score >= 0),
  hits integer not null default 0 check (hits >= 0),
  level integer not null default 1 check (level >= 1),
  duration_ms integer not null default 0 check (duration_ms >= 0),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.arcade_scores enable row level security;
revoke all on public.arcade_scores from anon, authenticated;
grant select, insert, update, delete on public.arcade_scores to service_role;
create index if not exists arcade_scores_game_score_idx
  on public.arcade_scores (game_id, score desc, duration_ms asc);
create unique index if not exists arcade_scores_game_player_idx
  on public.arcade_scores (game_id, player_key);
create unique index if not exists arcade_scores_local_id_idx
  on public.arcade_scores (local_id) where local_id is not null;
notify pgrst, 'reload schema';
