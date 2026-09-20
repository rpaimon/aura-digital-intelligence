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
