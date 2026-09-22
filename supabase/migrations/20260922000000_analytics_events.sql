create table if not exists public.analytics_events (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null check (char_length(event_name) between 1 and 64),
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_user_created_idx
  on public.analytics_events (user_id, created_at desc);

create index if not exists analytics_events_name_created_idx
  on public.analytics_events (event_name, created_at desc);

alter table public.analytics_events enable row level security;

drop policy if exists "Players can add their own analytics" on public.analytics_events;
create policy "Players can add their own analytics"
  on public.analytics_events for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Players can read their own analytics" on public.analytics_events;
create policy "Players can read their own analytics"
  on public.analytics_events for select
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert on public.analytics_events to authenticated;
