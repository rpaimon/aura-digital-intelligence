-- Aura Digital Intelligence
-- 009: Verified-safe-facts article writer + automatic HOLD retry scheduling.
-- Safe to run after the v7 fact-check migration.

alter table public.fact_checks
  add column if not exists retry_count integer not null default 0,
  add column if not exists next_retry_at timestamptz,
  add column if not exists last_retry_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'fact_checks_retry_count_nonnegative'
  ) then
    alter table public.fact_checks
      add constraint fact_checks_retry_count_nonnegative check (retry_count >= 0);
  end if;
end $$;

create index if not exists fact_checks_hold_retry_idx
  on public.fact_checks(verdict, next_retry_at, retry_count)
  where verdict = 'hold';

alter table public.articles
  add column if not exists quality_score numeric(5,2),
  add column if not exists quality_notes jsonb not null default '{}'::jsonb,
  add column if not exists seo_keywords jsonb not null default '[]'::jsonb,
  add column if not exists fact_check_id uuid references public.fact_checks(id) on delete set null,
  add column if not exists generation_model text,
  add column if not exists generated_at timestamptz;

create index if not exists articles_quality_idx
  on public.articles(status, quality_score desc, created_at desc);

insert into public.settings (key, value)
values
  ('article_writer_enabled', 'true'::jsonb),
  ('max_articles_per_run', '1'::jsonb),
  ('article_min_fact_confidence', '75'::jsonb),
  ('fact_check_hold_retry_enabled', 'true'::jsonb),
  ('fact_check_hold_retry_max', '4'::jsonb),
  ('fact_check_hold_retry_minutes', '360'::jsonb)
on conflict (key) do update
set value = excluded.value,
    updated_at = now();

-- Existing HOLD stories retry later rather than immediately burning quota.
update public.fact_checks
set next_retry_at = now() + interval '6 hours'
where verdict = 'hold'
  and retry_count < 4
  and next_retry_at is null;

-- Backfill writer jobs for already-approved stories that do not yet have an article.
insert into public.jobs (job_type, status, priority, story_id, payload)
select
  'write_article',
  'queued'::public.job_status,
  greatest(1, least(100, coalesce(round(s.priority_score)::integer, 75))),
  fc.story_id,
  jsonb_build_object('reason', 'migration backfill: approved fact check')
from public.fact_checks fc
join public.stories s on s.id = fc.story_id
left join public.articles a on a.story_id = fc.story_id
where fc.verdict = 'approve'
  and fc.confidence >= 75
  and a.id is null
  and not exists (
    select 1
    from public.jobs j
    where j.story_id = fc.story_id
      and j.job_type = 'write_article'
      and j.status in ('queued','processing','completed')
  );
