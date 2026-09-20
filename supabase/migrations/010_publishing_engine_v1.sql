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
