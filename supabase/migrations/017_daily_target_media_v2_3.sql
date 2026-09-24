-- Aura Digital Intelligence v2.3
-- Target: reach up to 2 publishable articles per Fiji day without weakening verification.
-- This changes acquisition throughput only. It does NOT lower fact-check confidence or source requirements.

insert into public.settings (key, value, updated_at)
values
  ('daily_article_target', '2'::jsonb, now()),
  ('max_fact_checks_per_run', '2'::jsonb, now()),
  ('max_articles_per_run', '2'::jsonb, now()),
  ('max_publish_per_run', '2'::jsonb, now()),
  ('max_ai_candidates_per_day', '16'::jsonb, now())
on conflict (key) do update
set value = excluded.value,
    updated_at = now();
