-- Aura Digital Intelligence
-- 013: Free Acquisition Engine v2
-- Purpose: deterministic-first story selection, free-provider AI routing,
-- two-article daily target, automatic publishing, provider deferrals,
-- conversion tracking, and article image attribution.
-- Safe to run after 012_originality_guard_v1.sql.

alter table public.jobs
  add column if not exists next_attempt_at timestamptz,
  add column if not exists deferred_reason text;

create index if not exists jobs_due_retry_idx
  on public.jobs(status, job_type, next_attempt_at, priority desc, created_at asc);

alter table public.articles
  add column if not exists featured_image_credit text,
  add column if not exists featured_image_source_url text,
  add column if not exists featured_image_alt text;

-- The writer upserts by story_id. Make that contract explicit so retries cannot
-- create duplicate articles for the same verified story. If an older deployment
-- already created duplicate draft rows for one story, preserve those rows but
-- detach every duplicate except the newest before adding the unique index.
with ranked_story_articles as (
  select
    id,
    row_number() over (
      partition by story_id
      order by created_at desc, id desc
    ) as rn
  from public.articles
  where story_id is not null
)
update public.articles a
set story_id = null,
    updated_at = now()
from ranked_story_articles r
where a.id = r.id
  and r.rn > 1;

-- PostgreSQL allows multiple NULLs in a unique index, so detached/manual articles
-- still work while generated article retries remain idempotent.
create unique index if not exists articles_story_id_unique
  on public.articles(story_id);

create table if not exists public.conversion_events (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references public.articles(id) on delete set null,
  story_id uuid references public.stories(id) on delete set null,
  service_key text not null,
  target_url text not null,
  referrer text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists conversion_events_article_idx
  on public.conversion_events(article_id, created_at desc);

alter table public.conversion_events enable row level security;
-- No anon policy is intentional. Public clicks are recorded by the server-side
-- service-role route only; visitors cannot read the tracking table.

-- Harden newsroom administration. Earlier phases allowed every authenticated
-- Supabase user to manage the newsroom. Snapshot the accounts that already exist
-- at migration time as administrators; future auth accounts are not admins unless
-- explicitly inserted into public.admin_users by a database owner/service role.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

insert into public.admin_users (user_id)
select id from auth.users
on conflict (user_id) do nothing;

create or replace function public.is_newsroom_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
  );
$$;

revoke all on function public.is_newsroom_admin() from public;
grant execute on function public.is_newsroom_admin() to authenticated;

-- Replace the permissive Phase 1 policies with an explicit admin allow-list.
-- Existing anon read policies for published articles/authors/topics remain in place.
drop policy if exists "authenticated can manage sources" on public.sources;
drop policy if exists "authenticated can manage stories" on public.stories;
drop policy if exists "authenticated can manage research" on public.research;
drop policy if exists "authenticated can manage fact checks" on public.fact_checks;
drop policy if exists "authenticated can manage authors" on public.authors;
drop policy if exists "authenticated can manage topics" on public.topics;
drop policy if exists "authenticated can manage articles" on public.articles;
drop policy if exists "authenticated can manage article sources" on public.article_sources;
drop policy if exists "authenticated can manage article topics" on public.article_topics;
drop policy if exists "authenticated can manage jobs" on public.jobs;
drop policy if exists "authenticated can manage settings" on public.settings;
drop policy if exists "authenticated can manage audit logs" on public.audit_logs;

drop policy if exists "newsroom admins can manage sources" on public.sources;
drop policy if exists "newsroom admins can manage stories" on public.stories;
drop policy if exists "newsroom admins can manage research" on public.research;
drop policy if exists "newsroom admins can manage fact checks" on public.fact_checks;
drop policy if exists "newsroom admins can manage authors" on public.authors;
drop policy if exists "newsroom admins can manage topics" on public.topics;
drop policy if exists "newsroom admins can manage articles" on public.articles;
drop policy if exists "newsroom admins can manage article sources" on public.article_sources;
drop policy if exists "newsroom admins can manage article topics" on public.article_topics;
drop policy if exists "newsroom admins can manage jobs" on public.jobs;
drop policy if exists "newsroom admins can manage settings" on public.settings;
drop policy if exists "newsroom admins can manage audit logs" on public.audit_logs;
drop policy if exists "newsroom admins can read conversion events" on public.conversion_events;

create policy "newsroom admins can manage sources"
on public.sources for all to authenticated
using (public.is_newsroom_admin()) with check (public.is_newsroom_admin());

create policy "newsroom admins can manage stories"
on public.stories for all to authenticated
using (public.is_newsroom_admin()) with check (public.is_newsroom_admin());

create policy "newsroom admins can manage research"
on public.research for all to authenticated
using (public.is_newsroom_admin()) with check (public.is_newsroom_admin());

create policy "newsroom admins can manage fact checks"
on public.fact_checks for all to authenticated
using (public.is_newsroom_admin()) with check (public.is_newsroom_admin());

create policy "newsroom admins can manage authors"
on public.authors for all to authenticated
using (public.is_newsroom_admin()) with check (public.is_newsroom_admin());

create policy "newsroom admins can manage topics"
on public.topics for all to authenticated
using (public.is_newsroom_admin()) with check (public.is_newsroom_admin());

create policy "newsroom admins can manage articles"
on public.articles for all to authenticated
using (public.is_newsroom_admin()) with check (public.is_newsroom_admin());

create policy "newsroom admins can manage article sources"
on public.article_sources for all to authenticated
using (public.is_newsroom_admin()) with check (public.is_newsroom_admin());

create policy "newsroom admins can manage article topics"
on public.article_topics for all to authenticated
using (public.is_newsroom_admin()) with check (public.is_newsroom_admin());

create policy "newsroom admins can manage jobs"
on public.jobs for all to authenticated
using (public.is_newsroom_admin()) with check (public.is_newsroom_admin());

create policy "newsroom admins can manage settings"
on public.settings for all to authenticated
using (public.is_newsroom_admin()) with check (public.is_newsroom_admin());

create policy "newsroom admins can manage audit logs"
on public.audit_logs for all to authenticated
using (public.is_newsroom_admin()) with check (public.is_newsroom_admin());

create policy "newsroom admins can read conversion events"
on public.conversion_events for select to authenticated
using (public.is_newsroom_admin());

insert into public.settings (key, value)
values
  ('watch_priority_threshold', '50'::jsonb),
  ('research_priority_threshold', '65'::jsonb),
  ('max_fact_checks_per_run', '1'::jsonb),
  ('fact_check_min_sources', '2'::jsonb),
  ('fact_check_approve_confidence', '75'::jsonb),
  ('article_writer_enabled', 'true'::jsonb),
  ('max_articles_per_run', '1'::jsonb),
  ('article_min_fact_confidence', '75'::jsonb),
  ('fact_check_hold_retry_enabled', 'false'::jsonb),
  ('fact_check_hold_retry_max', '0'::jsonb),
  ('daily_article_target', '2'::jsonb),
  ('max_ai_candidates_per_day', '8'::jsonb),
  ('candidate_min_priority', '65'::jsonb),
  ('ai_router_enabled', 'true'::jsonb),
  ('cloudflare_ai_fallback_enabled', 'false'::jsonb),
  ('publishing_mode', '"automatic"'::jsonb),
  ('max_publish_per_run', '2'::jsonb),
  ('minimum_quality_score', '90'::jsonb),
  ('minimum_source_count', '2'::jsonb)
on conflict (key) do update
set value = excluded.value,
    updated_at = now();

-- AI research is retired. Source discovery + deterministic scoring is free, and
-- only the best candidates proceed directly to independent-source verification.
update public.jobs
set status = 'cancelled'::public.job_status,
    finished_at = now(),
    error_message = 'Cancelled by Free Acquisition Engine v2: AI research stage retired.'
where job_type = 'research_story'
  and status in ('queued'::public.job_status, 'processing'::public.job_status);

-- HOLD retries are deliberately disabled to protect free provider budgets. Fresh
-- candidates are preferred; a HOLD remains visible for editorial inspection.
update public.jobs
set status = 'cancelled'::public.job_status,
    finished_at = now(),
    error_message = 'Cancelled by Free Acquisition Engine v2: automatic HOLD retries disabled.'
where job_type = 'fact_check_story'
  and status = 'queued'::public.job_status
  and payload->>'reason' = 'automatic hold retry';

update public.fact_checks
set next_retry_at = null
where verdict = 'hold';

-- Recover jobs that failed only because Cloudflare's daily AI allowance was
-- exhausted. The quota failure does not consume a genuine content attempt.
update public.jobs
set status = 'queued'::public.job_status,
    attempts = greatest(attempts - 1, 0),
    started_at = null,
    finished_at = null,
    error_message = null,
    deferred_reason = null,
    next_attempt_at = now()
where job_type in ('write_article', 'fact_check_story')
  and status = 'failed'::public.job_status
  and (
    coalesce(error_message, '') ilike '%daily free allocation%'
    or coalesce(error_message, '') ilike '%4006%'
    or coalesce(error_message, '') ilike '%quota%'
    or coalesce(error_message, '') ilike '%rate limit%'
  );

-- Re-score the recent, unverified backlog using the new zero-AI scoring engine.
-- Verified stories and published/draft articles are untouched.
update public.stories s
set status = 'discovered'::public.story_status,
    importance_score = null,
    fiji_relevance_score = null,
    business_relevance_score = null,
    aura_service_relevance_score = null,
    priority_score = null,
    decision = null,
    decision_reason = null,
    decided_at = null
where s.verification_status is null
  and s.discovered_at >= now() - interval '7 days'
  and s.status in (
    'scored'::public.story_status,
    'researching'::public.story_status,
    'rejected'::public.story_status
  )
  and not exists (
    select 1 from public.articles a where a.story_id = s.id
  );

-- Transparent organization byline for the automated publication desk.
insert into public.authors (name, slug, bio, website_url, author_type)
values (
  'Aura Digital Intelligence Desk',
  'aura-digital-intelligence',
  'Aura Digital Intelligence is the verification-first technology publication of Aura Digital Fiji. Automation assists discovery, evidence gathering, verification and drafting; publication rules require independent sourcing, originality checks and a final quality gate.',
  'https://intelligence.auradigitalfiji.com/about',
  'organization'
)
on conflict (slug) do update
set name = excluded.name,
    bio = excluded.bio,
    website_url = excluded.website_url,
    author_type = excluded.author_type;
