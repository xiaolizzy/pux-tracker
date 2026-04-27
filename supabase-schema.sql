create table if not exists public.pux_dashboard_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.pux_dashboard_state enable row level security;

drop policy if exists "service role can manage pux dashboard state" on public.pux_dashboard_state;
create policy "service role can manage pux dashboard state"
  on public.pux_dashboard_state
  for all
  using (true)
  with check (true);
