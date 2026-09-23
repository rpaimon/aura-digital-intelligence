-- Aura Digital Intelligence — fresh database bootstrap
-- Generated from the original Phase 1 foundation plus every retained migration.
-- For a brand-new Supabase project only. Existing production projects should run only new migrations.

-- Aura Digital Intelligence
-- Phase 1 database foundation.
-- Run this entire file in Supabase SQL Editor.

create extension if not exists pgcrypto;

create type public.story_status as enum (
  'discovered',
  'normalized',
  'duplicate',
  'scored',
  'researching',
  'draft',
  'review',
  'approved',
  'published',
  'rejected',
  'failed'
);

create type public.article_status as enum (
  'draft',
  'review',
  'approved',
  'published',
  'archived'
);

create type public.job_status as enum (
  'queued',
  'processing',
  'completed',
  'failed',
  'cancelled'
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  feed_url text,
  source_type text not null default 'publication',
  category text,
  country text,
  trust_score integer not null default 70 check (trust_score between 0 and 100),
  active boolean not null default true,
  last_checked_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index sources_feed_url_unique
  on public.sources(feed_url)
  where feed_url is not null;

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.sources(id) on delete set null,
  source_url text not null,
  canonical_url text,
  title text not null,
  description text,
  published_at timestamptz,
  discovered_at timestamptz not null default now(),
  category text,
  raw_content text,
  content_hash text,
  status public.story_status not null default 'discovered',
  importance_score numeric(5,2),
  originality_score numeric(5,2),
  fiji_relevance_score numeric(5,2),
  business_relevance_score numeric(5,2),
  aura_service_relevance_score numeric(5,2),
  duplicate_score numeric(5,2),
  priority_score numeric(5,2),
  decision text check (decision in ('ignore','watch','research')),
  decision_reason text,
  decided_at timestamptz,
  verification_status text check (verification_status in ('approve','hold','reject')),
  verification_confidence numeric(5,2),
  verification_source_count integer not null default 0,
  verification_summary text,
  verified_at timestamptz,
  cluster_key text,
  created_at timestamptz not null default now()
);

create unique index stories_source_url_unique on public.stories(source_url);
create index stories_status_idx on public.stories(status);
create index stories_published_at_idx on public.stories(published_at desc);
create index stories_cluster_key_idx on public.stories(cluster_key);

create table public.research (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  source_url text not null,
  source_name text not null,
  source_type text,
  key_facts jsonb not null default '[]'::jsonb,
  source_date timestamptz,
  credibility numeric(5,2),
  notes text,
  created_at timestamptz not null default now()
);

create index research_story_id_idx on public.research(story_id);

create table public.fact_checks (
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

create index fact_checks_verdict_idx
  on public.fact_checks(verdict, confidence desc);

create table public.authors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  bio text,
  avatar_url text,
  website_url text,
  author_type text not null default 'organization',
  created_at timestamptz not null default now()
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  parent_id uuid references public.topics(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references public.stories(id) on delete set null,
  author_id uuid references public.authors(id) on delete set null,
  slug text not null unique,
  title text not null,
  subtitle text,
  excerpt text,
  content text,
  category text,
  featured_image_url text,
  seo_title text,
  seo_description text,
  canonical_url text,
  status public.article_status not null default 'draft',
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index articles_status_idx on public.articles(status);
create index articles_published_at_idx on public.articles(published_at desc);

create table public.article_sources (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  source_url text not null,
  source_name text not null,
  source_type text,
  citation_text text,
  created_at timestamptz not null default now()
);

create table public.article_topics (
  article_id uuid not null references public.articles(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  primary key (article_id, topic_id)
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  status public.job_status not null default 'queued',
  priority integer not null default 50,
  story_id uuid references public.stories(id) on delete cascade,
  article_id uuid references public.articles(id) on delete cascade,
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index jobs_queue_idx
  on public.jobs(status, priority desc, created_at asc);

create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Seed Aura's initial editorial topics.
insert into public.topics (name, slug, description) values
('AI', 'ai', 'Artificial intelligence, models, agents and automation'),
('Technology', 'technology', 'Major technology developments'),
('Cybersecurity', 'cybersecurity', 'Security, privacy and threats'),
('Web Development', 'web-development', 'Websites, frameworks and developer technology'),
('Cloud', 'cloud', 'Cloud computing and infrastructure'),
('Business Technology', 'business-technology', 'Technology affecting businesses'),
('Digital Marketing', 'digital-marketing', 'Search, marketing and online growth'),
('Ecommerce', 'ecommerce', 'Online selling and digital commerce'),
('Mobile', 'mobile', 'Mobile devices, apps and platforms'),
('Fiji & Pacific', 'fiji-pacific', 'Technology and digital business in Fiji and the Pacific')
on conflict (slug) do nothing;

insert into public.authors (name, slug, bio, author_type)
values (
  'Aura Digital Intelligence',
  'aura-digital-intelligence',
  'AI-assisted technology intelligence from Aura Digital Fiji, focused on useful insights for Fiji and Pacific businesses.',
  'organization'
)
on conflict (slug) do nothing;

insert into public.settings (key, value)
values
('automation_enabled', 'false'::jsonb),
('publishing_mode', '"manual"'::jsonb),
('max_articles_per_day', '8'::jsonb),
('minimum_source_count', '3'::jsonb),
('minimum_quality_score', '90'::jsonb),
('fiji_relevance_required', 'false'::jsonb),
('daily_ai_budget_usd', '10'::jsonb),
('watch_priority_threshold', '50'::jsonb),
('research_priority_threshold', '72'::jsonb),
('max_research_per_run', '1'::jsonb),
('max_fact_checks_per_run', '1'::jsonb),
('fact_check_min_sources', '2'::jsonb),
('fact_check_approve_confidence', '75'::jsonb)
on conflict (key) do nothing;

-- Enable RLS.
alter table public.sources enable row level security;
alter table public.stories enable row level security;
alter table public.research enable row level security;
alter table public.fact_checks enable row level security;
alter table public.authors enable row level security;
alter table public.topics enable row level security;
alter table public.articles enable row level security;
alter table public.article_sources enable row level security;
alter table public.article_topics enable row level security;
alter table public.jobs enable row level security;
alter table public.settings enable row level security;
alter table public.audit_logs enable row level security;

-- Phase 1 policy:
-- Authenticated newsroom users can manage operational data.
-- Public article access will be added with narrower policies when the public
-- blog routes are built.
create policy "authenticated can manage sources"
on public.sources for all to authenticated
using (true) with check (true);

create policy "authenticated can manage stories"
on public.stories for all to authenticated
using (true) with check (true);

create policy "authenticated can manage research"
on public.research for all to authenticated
using (true) with check (true);

create policy "authenticated can manage fact checks"
on public.fact_checks for all to authenticated
using (true) with check (true);

create policy "authenticated can manage authors"
on public.authors for all to authenticated
using (true) with check (true);

create policy "authenticated can manage topics"
on public.topics for all to authenticated
using (true) with check (true);

create policy "authenticated can manage articles"
on public.articles for all to authenticated
using (true) with check (true);

create policy "authenticated can manage article sources"
on public.article_sources for all to authenticated
using (true) with check (true);

create policy "authenticated can manage article topics"
on public.article_topics for all to authenticated
using (true) with check (true);

create policy "authenticated can manage jobs"
on public.jobs for all to authenticated
using (true) with check (true);

create policy "authenticated can manage settings"
on public.settings for all to authenticated
using (true) with check (true);

create policy "authenticated can manage audit logs"
on public.audit_logs for all to authenticated
using (true) with check (true);


-- ============================================================================
-- BEGIN 002_decision_research.sql
-- ============================================================================

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

-- END 002_decision_research.sql


-- ============================================================================
-- BEGIN 003_fact_check_verification.sql
-- ============================================================================

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

-- END 003_fact_check_verification.sql


-- ============================================================================
-- BEGIN 004_fact_check_retrieval_v2_retry.sql
-- ============================================================================

-- Requeue HOLD fact-checks after deploying retrieval v2.
-- Safe to run once after the new Cloudflare Worker is live.

update public.jobs j
set
  status = 'queued'::public.job_status,
  attempts = 0,
  result = null,
  error_message = null,
  started_at = null,
  finished_at = null,
  payload = coalesce(j.payload, '{}'::jsonb) || jsonb_build_object(
    'reason', 'fact-check retrieval v2 retry'
  )
where j.job_type = 'fact_check_story'
  and j.story_id in (
    select fc.story_id
    from public.fact_checks fc
    where fc.verdict = 'hold'
      and fc.independent_source_count < 2
  );

-- END 004_fact_check_retrieval_v2_retry.sql


-- ============================================================================
-- BEGIN 005_fact_check_browser_run_retry.sql
-- ============================================================================

-- Aura Digital Intelligence
-- Fact Check Retrieval v3: requeue HOLD fact checks after Browser Run fallback is deployed.
-- Safe to run more than once.

update jobs j
set
  status = 'queued'::job_status,
  attempts = 0,
  started_at = null,
  finished_at = null,
  error_message = null
where j.job_type = 'fact_check_story'
  and j.story_id in (
    select fc.story_id
    from fact_checks fc
    where fc.verdict = 'hold'
      and coalesce(fc.independent_source_count, 0) < 2
  );

-- END 005_fact_check_browser_run_retry.sql


-- ============================================================================
-- BEGIN 006_fact_check_confidence_retry.sql
-- ============================================================================

-- Aura Digital Intelligence - Fact Check v5 confidence retry
-- Requeue HOLD fact checks that already found enough independent sources
-- but were saved with zero confidence under the older AI-only calibration.

update jobs j
set
  status = 'queued'::job_status,
  attempts = 0,
  started_at = null,
  finished_at = null,
  error_message = null
where j.job_type = 'fact_check_story'
  and j.story_id in (
    select fc.story_id
    from fact_checks fc
    where fc.verdict = 'hold'
      and coalesce(fc.independent_source_count, 0) >= 2
      and coalesce(fc.confidence, 0) = 0
  );

-- END 006_fact_check_confidence_retry.sql


-- ============================================================================
-- BEGIN 008_fact_check_v7_fixed_claim_retry.sql
-- ============================================================================

-- Fact Check v7 retry
-- Requeue only stories that already have enough independent evidence but are
-- still on HOLD because the previous claim-verification stage produced zero
-- confidence or no usable claim checks.
update jobs j
set
  status = 'queued'::job_status,
  attempts = 0,
  started_at = null,
  finished_at = null,
  error_message = null
where j.job_type = 'fact_check_story'
  and j.story_id in (
    select fc.story_id
    from fact_checks fc
    where fc.verdict = 'hold'
      and coalesce(fc.independent_source_count, 0) >= 2
      and (
        coalesce(fc.confidence, 0) = 0
        or jsonb_array_length(coalesce(fc.claim_checks, '[]'::jsonb)) = 0
      )
  );

-- END 008_fact_check_v7_fixed_claim_retry.sql


-- ============================================================================
-- BEGIN 009_article_writer_hold_retry.sql
-- ============================================================================

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

-- END 009_article_writer_hold_retry.sql


-- ============================================================================
-- BEGIN 010_publishing_engine_v1.sql
-- ============================================================================

-- Aura Digital Intelligence
-- 010: deterministic final quality gate + public publishing engine.
-- Safe to run after 009_article_writer_hold_retry.sql.

alter table public.articles
  add column if not exists final_quality_score numeric(5,2),
  add column if not exists final_quality_passed boolean,
  add column if not exists final_quality_notes jsonb not null default '{}'::jsonb,
  add column if not exists final_quality_checked_at timestamptz,
  add column if not exists scheduled_for timestamptz,
  add column if not exists first_published_at timestamptz,
  add column if not exists unpublished_at timestamptz,
  add column if not exists publication_reason text;

create index if not exists articles_publication_queue_idx
  on public.articles(status, final_quality_passed, scheduled_for, created_at);

create index if not exists articles_public_feed_idx
  on public.articles(published_at desc)
  where status = 'published';

insert into public.settings (key, value)
values
  ('final_quality_gate_enabled', 'true'::jsonb),
  ('final_quality_gate_batch_size', '4'::jsonb),
  ('minimum_quality_score', '90'::jsonb),
  ('minimum_source_count', '2'::jsonb),
  ('publishing_mode', '"manual"'::jsonb),
  ('max_publish_per_run', '1'::jsonb)
on conflict (key) do update
set value = excluded.value,
    updated_at = now();

-- Public readers may only see published articles and their published-article sources/topics.
drop policy if exists "public can read published articles" on public.articles;
create policy "public can read published articles"
on public.articles for select to anon
using (status = 'published');

drop policy if exists "public can read published article sources" on public.article_sources;
create policy "public can read published article sources"
on public.article_sources for select to anon
using (
  exists (
    select 1 from public.articles a
    where a.id = article_sources.article_id
      and a.status = 'published'
  )
);

drop policy if exists "public can read published article topics" on public.article_topics;
create policy "public can read published article topics"
on public.article_topics for select to anon
using (
  exists (
    select 1 from public.articles a
    where a.id = article_topics.article_id
      and a.status = 'published'
  )
);

drop policy if exists "public can read authors" on public.authors;
create policy "public can read authors"
on public.authors for select to anon
using (true);

drop policy if exists "public can read topics" on public.topics;
create policy "public can read topics"
on public.topics for select to anon
using (true);

-- Existing generated articles will be evaluated by the Worker on its next scheduled cycle.
update public.articles
set final_quality_passed = null,
    final_quality_score = null,
    final_quality_checked_at = null
where status in ('draft', 'review')
  and final_quality_checked_at is null;

-- END 010_publishing_engine_v1.sql


-- ============================================================================
-- BEGIN 011_source_network_v1.sql
-- ============================================================================

-- Aura Digital Intelligence — Source Network v1
-- Adds source health monitoring, staggered scan scheduling and a curated source network.

alter table public.sources
  add column if not exists health_status text not null default 'unknown',
  add column if not exists last_success_at timestamptz,
  add column if not exists last_failure_at timestamptz,
  add column if not exists consecutive_failures integer not null default 0,
  add column if not exists total_checks integer not null default 0,
  add column if not exists total_successes integer not null default 0,
  add column if not exists total_failures integer not null default 0,
  add column if not exists last_error text,
  add column if not exists last_item_count integer not null default 0,
  add column if not exists last_discovered_count integer not null default 0,
  add column if not exists last_duplicate_count integer not null default 0,
  add column if not exists check_interval_minutes integer not null default 60,
  add column if not exists next_check_at timestamptz,
  add column if not exists auto_disable_on_failure boolean not null default true,
  add column if not exists auto_disabled_at timestamptz;

create index if not exists sources_discovery_schedule_idx
  on public.sources(active, next_check_at, trust_score desc);

insert into public.settings (key, value, updated_at) values
  ('discovery_sources_per_run', '6'::jsonb, now()),
  ('discovery_items_per_source', '30'::jsonb, now()),
  ('discovery_max_story_age_days', '14'::jsonb, now()),
  ('source_auto_disable_failures', '5'::jsonb, now())
on conflict (key) do update set value = excluded.value, updated_at = now();

insert into public.sources
  (name, url, feed_url, source_type, category, country, trust_score, active, check_interval_minutes, auto_disable_on_failure)
values
  ('TechCrunch', 'https://techcrunch.com/', 'https://techcrunch.com/feed/', 'publication', 'Technology', 'US / Global', 88, true, 60, true),
  ('The Verge', 'https://www.theverge.com/', 'https://www.theverge.com/rss/index.xml', 'publication', 'Technology', 'US / Global', 86, true, 60, true),
  ('Ars Technica', 'https://arstechnica.com/', 'https://feeds.arstechnica.com/arstechnica/index', 'publication', 'Technology', 'US / Global', 89, true, 60, true),
  ('WIRED', 'https://www.wired.com/', 'https://www.wired.com/feed/rss', 'publication', 'Technology', 'US / Global', 86, true, 90, true),
  ('MIT Technology Review', 'https://www.technologyreview.com/', 'https://www.technologyreview.com/feed/', 'publication', 'AI', 'US / Global', 91, true, 90, true),
  ('VentureBeat', 'https://venturebeat.com/', 'https://venturebeat.com/feed/', 'publication', 'AI', 'US / Global', 84, true, 90, true),
  ('Cloudflare Blog', 'https://blog.cloudflare.com/', 'https://blog.cloudflare.com/rss/', 'company', 'Cloud', 'Global', 96, true, 60, true),
  ('GitHub Blog', 'https://github.blog/', 'https://github.blog/feed/', 'company', 'Web Development', 'Global', 95, true, 90, true),
  ('GitHub Changelog', 'https://github.blog/changelog/', 'https://github.blog/changelog/feed/', 'company', 'Web Development', 'Global', 96, true, 60, true),
  ('Google AI Blog', 'https://blog.google/technology/ai/', 'https://blog.google/technology/ai/rss/', 'company', 'AI', 'Global', 96, true, 90, true),
  ('Google Developers Blog', 'https://developers.googleblog.com/', 'https://developers.googleblog.com/feeds/posts/default', 'company', 'Web Development', 'Global', 95, true, 90, true),
  ('Google Security Blog', 'https://security.googleblog.com/', 'https://security.googleblog.com/feeds/posts/default', 'company', 'Cybersecurity', 'Global', 97, true, 90, true),
  ('Microsoft Security Blog', 'https://www.microsoft.com/en-us/security/blog/', 'https://www.microsoft.com/en-us/security/blog/feed/', 'company', 'Cybersecurity', 'Global', 96, true, 90, true),
  ('AWS What''s New', 'https://aws.amazon.com/about-aws/whats-new/', 'https://aws.amazon.com/about-aws/whats-new/recent/feed/', 'company', 'Cloud', 'Global', 95, true, 60, true),
  ('AWS Security Blog', 'https://aws.amazon.com/blogs/security/', 'https://aws.amazon.com/blogs/security/feed/', 'company', 'Cybersecurity', 'Global', 96, true, 90, true),
  ('CISA Cybersecurity Advisories', 'https://www.cisa.gov/news-events/cybersecurity-advisories', 'https://www.cisa.gov/cybersecurity-advisories/all.xml', 'government', 'Cybersecurity', 'US', 99, true, 60, true),
  ('Australian Cyber Security Centre', 'https://www.cyber.gov.au/', 'https://www.cyber.gov.au/rss/advisories', 'government', 'Cybersecurity', 'Australia', 98, true, 90, true),
  ('BleepingComputer', 'https://www.bleepingcomputer.com/', 'https://www.bleepingcomputer.com/feed/', 'publication', 'Cybersecurity', 'US / Global', 89, true, 60, true),
  ('Krebs on Security', 'https://krebsonsecurity.com/', 'https://krebsonsecurity.com/feed/', 'publication', 'Cybersecurity', 'US / Global', 91, true, 120, true),
  ('SecurityWeek', 'https://www.securityweek.com/', 'https://www.securityweek.com/feed/', 'publication', 'Cybersecurity', 'US / Global', 88, true, 90, true),
  ('Dark Reading', 'https://www.darkreading.com/', 'https://www.darkreading.com/rss.xml', 'publication', 'Cybersecurity', 'US / Global', 87, true, 90, true),
  ('Mozilla Hacks', 'https://hacks.mozilla.org/', 'https://hacks.mozilla.org/feed/', 'company', 'Web Development', 'Global', 93, true, 180, true),
  ('web.dev', 'https://web.dev/', 'https://web.dev/feed.xml', 'company', 'Web Development', 'Global', 94, true, 180, true),
  ('FBC News', 'https://www.fbcnews.com.fj/', 'https://www.fbcnews.com.fj/feed', 'publication', 'Fiji & Pacific', 'Fiji', 86, true, 60, true),
  ('The Fiji Times', 'https://www.fijitimes.com.fj/', 'https://www.fijitimes.com.fj/feed', 'publication', 'Fiji & Pacific', 'Fiji', 88, true, 60, true),
  ('Islands Business', 'https://islandsbusiness.com/', 'https://islandsbusiness.com/category/islands-business/news-break/feed/gn', 'publication', 'Fiji & Pacific', 'Fiji / Pacific', 88, true, 90, true),
  ('RNZ Pacific', 'https://www.rnz.co.nz/news/pacific', 'https://www.rnz.co.nz/rss/pacific.xml', 'publication', 'Fiji & Pacific', 'New Zealand / Pacific', 91, true, 60, true),
  ('ABC News', 'https://www.abc.net.au/news/', 'https://www.abc.net.au/news/feed/45910/rss.xml', 'publication', 'Fiji & Pacific', 'Australia / Pacific', 90, true, 90, true)
on conflict (feed_url) where feed_url is not null do update set
  name = excluded.name,
  url = excluded.url,
  source_type = excluded.source_type,
  category = excluded.category,
  country = excluded.country,
  trust_score = excluded.trust_score,
  check_interval_minutes = excluded.check_interval_minutes,
  auto_disable_on_failure = excluded.auto_disable_on_failure;

-- Spread first-time scans across the next hour instead of hitting every new source at once.
with ranked as (
  select id, row_number() over (order by trust_score desc, name asc) as rn
  from public.sources
  where active = true and next_check_at is null
)
update public.sources s
set next_check_at = now() + ((ranked.rn - 1) % 4) * interval '15 minutes'
from ranked
where s.id = ranked.id;

-- END 011_source_network_v1.sql


-- ============================================================================
-- BEGIN 012_originality_guard_v1.sql
-- ============================================================================

-- Aura Digital Intelligence
-- 012: copyright/originality guard + launch indexing safety.
-- Safe to run after 011_source_network_v1.sql.

alter table public.fact_checks
  add column if not exists source_phrase_fingerprints jsonb not null default '[]'::jsonb;

alter table public.articles
  add column if not exists originality_score numeric(5,2),
  add column if not exists originality_passed boolean,
  add column if not exists originality_checked_at timestamptz,
  add column if not exists originality_rewrite_count integer not null default 0,
  add column if not exists originality_notes jsonb not null default '{}'::jsonb;

create index if not exists articles_originality_gate_idx
  on public.articles(originality_passed, final_quality_passed, status, created_at);

insert into public.settings (key, value)
values
  ('originality_guard_enabled', 'true'::jsonb),
  ('originality_shingle_size', '8'::jsonb),
  ('originality_max_overlap_ratio', '0.08'::jsonb),
  ('originality_max_phrase_words', '18'::jsonb),
  ('originality_max_rewrites', '2'::jsonb)
on conflict (key) do update
set value = excluded.value,
    updated_at = now();

-- Unpublished articles must pass the new guard before publication.
-- We deliberately fail closed. Existing published content is not changed automatically.
update public.articles
set originality_passed = null,
    originality_score = null,
    originality_checked_at = null,
    originality_rewrite_count = 0,
    originality_notes = '{}'::jsonb,
    final_quality_passed = null,
    final_quality_score = null,
    final_quality_checked_at = null,
    final_quality_notes = '{}'::jsonb,
    status = case when status = 'approved' then 'review' else status end,
    updated_at = now()
where status in ('draft', 'review', 'approved');

-- END 012_originality_guard_v1.sql


-- ============================================================================
-- BEGIN 013_free_acquisition_engine_v2.sql
-- ============================================================================

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

-- END 013_free_acquisition_engine_v2.sql


-- ============================================================================
-- BEGIN 014_clean_master_editorial_copy.sql
-- ============================================================================

-- Aura Digital Intelligence
-- 014: clean master editorial copy
-- Public-facing copy only. No layout, schema, or automation behavior changes.

update public.authors
set bio = 'Aura Digital Intelligence is the technology publication of Aura Digital Fiji, focused on evidence-led reporting and practical technology analysis for Fiji and the Pacific.'
where slug = 'aura-digital-intelligence';

-- END 014_clean_master_editorial_copy.sql
