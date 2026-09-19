-- Per-user MVP game state. Apply with the Supabase SQL editor or CLI.
create table if not exists public.game_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progress jsonb not null default '{"balance":0,"collection":[],"cooldowns":{},"wins":0,"battle":null}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.game_progress enable row level security;

drop policy if exists "Players can read their own progress" on public.game_progress;
create policy "Players can read their own progress"
  on public.game_progress for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Players can create their own progress" on public.game_progress;
create policy "Players can create their own progress"
  on public.game_progress for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Players can update their own progress" on public.game_progress;
create policy "Players can update their own progress"
  on public.game_progress for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update on public.game_progress to authenticated;
