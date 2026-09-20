-- Decision engine + research queue fields for Aura Digital Intelligence.
alter table public.stories
  add column if not exists priority_score numeric(5,2),
  add column if not exists decision text check (decision in ('ignore','watch','research')),
  add column if not exists decision_reason text,
  add column if not exists decided_at timestamptz;

create index if not exists stories_decision_idx on public.stories(decision);
create index if not exists stories_priority_idx on public.stories(priority_score desc);

insert into public.settings (key, value) values
  ('watch_priority_threshold', '50'::jsonb),
  ('research_priority_threshold', '72'::jsonb),
  ('max_research_per_run', '1'::jsonb)
on conflict (key) do nothing;
