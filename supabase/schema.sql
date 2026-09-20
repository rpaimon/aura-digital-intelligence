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
('max_research_per_run', '2'::jsonb)
on conflict (key) do nothing;

-- Enable RLS.
alter table public.sources enable row level security;
alter table public.stories enable row level security;
alter table public.research enable row level security;
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
