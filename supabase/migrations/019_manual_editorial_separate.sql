-- v2.16: Human editorial desk only. DOES NOT change automated articles, jobs,
-- publishing settings, workers, quotas, functions, triggers, or policies.
-- Run this script once in Supabase SQL Editor before using manual publishing.
create table if not exists public.editorial_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null,
  content text not null,
  category text not null default 'Technology',
  featured_image_url text,
  featured_image_alt text,
  featured_image_credit text,
  source_url text not null,
  source_name text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint published_editorial_has_date check (status <> 'published' or published_at is not null)
);
create index if not exists editorial_posts_publication_idx on public.editorial_posts(status, published_at desc);
alter table public.editorial_posts enable row level security;
-- Intentionally no anon/authenticated policies: only authenticated ADMIN SERVER ACTIONS
-- may read/write via the existing service-role client after requireAdmin().

create table if not exists public.editorial_overrides (
  article_id uuid primary key references public.articles(id) on delete cascade,
  display_title text,
  plain_summary text,
  featured_image_url text,
  featured_image_alt text,
  featured_image_credit text,
  updated_at timestamptz not null default now()
);
alter table public.editorial_overrides enable row level security;
-- Same private admin/server-only rule. No changes to generated article rows.
