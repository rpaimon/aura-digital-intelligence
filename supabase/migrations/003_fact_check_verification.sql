-- Fact-check + verification quality gate for Aura Digital Intelligence.
-- Run once in Supabase SQL Editor after 002_decision_research.sql.

alter table public.stories
  add column if not exists verification_status text
    check (verification_status in ('approve','hold','reject')),
  add column if not exists verification_confidence numeric(5,2),
  add column if not exists verification_source_count integer not null default 0,
  add column if not exists verification_summary text,
  add column if not exists verified_at timestamptz;

create index if not exists stories_verification_status_idx
  on public.stories(verification_status);

create table if not exists public.fact_checks (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null unique references public.stories(id) on delete cascade,
  research_id uuid references public.research(id) on delete set null,
  verdict text not null check (verdict in ('approve','hold','reject')),
  confidence numeric(5,2) not null default 0 check (confidence between 0 and 100),
  independent_source_count integer not null default 0,
  summary text,
  claim_checks jsonb not null default '[]'::jsonb,
  evidence_sources jsonb not null default '[]'::jsonb,
  conflicts jsonb not null default '[]'::jsonb,
  missing_evidence jsonb not null default '[]'::jsonb,
  safe_facts jsonb not null default '[]'::jsonb,
  writing_constraints jsonb not null default '[]'::jsonb,
  checked_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists fact_checks_verdict_idx
  on public.fact_checks(verdict, confidence desc);

alter table public.fact_checks enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'fact_checks'
      and policyname = 'authenticated can manage fact checks'
  ) then
    create policy "authenticated can manage fact checks"
    on public.fact_checks for all to authenticated
    using (true) with check (true);
  end if;
end $$;

insert into public.settings (key, value) values
  ('max_fact_checks_per_run', '1'::jsonb),
  ('fact_check_min_sources', '2'::jsonb),
  ('fact_check_approve_confidence', '75'::jsonb)
on conflict (key) do nothing;

-- Queue existing research packages so the new verifier can process the two
-- packages created before this migration. It will not duplicate jobs.
insert into public.jobs (
  job_type,
  status,
  priority,
  story_id,
  payload
)
select
  'fact_check_story',
  'queued'::public.job_status,
  greatest(1, least(100, coalesce(round(s.priority_score)::integer, 50))),
  r.story_id,
  jsonb_build_object('reason', 'fact-check migration backfill')
from public.research r
join public.stories s on s.id = r.story_id
where r.source_type = 'ai-research-package'
  and not exists (
    select 1
    from public.jobs j
    where j.story_id = r.story_id
      and j.job_type = 'fact_check_story'
      and j.status in (
        'queued'::public.job_status,
        'processing'::public.job_status,
        'completed'::public.job_status
      )
  );
