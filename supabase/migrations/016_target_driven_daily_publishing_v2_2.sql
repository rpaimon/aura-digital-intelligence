-- Aura Digital Intelligence
-- 016: Target-driven daily publishing v2.2.
--
-- Fixes the candidate-starvation bug without changing the verification safety
-- gate or website design:
-- - daily target remains 2 actually published articles;
-- - source-poor checks no longer consume the AI-candidate budget in Worker code;
-- - allow up to 16 genuinely AI-verified candidates per Fiji day when needed;
-- - keep the existing 75 confidence and two-independent-publisher requirements;
-- - keep exactly one controlled HOLD retry after four hours.

insert into public.settings (key, value)
values
  ('daily_article_target', '2'::jsonb),
  ('max_ai_candidates_per_day', '16'::jsonb),
  ('fact_check_min_sources', '2'::jsonb),
  ('fact_check_approve_confidence', '75'::jsonb),
  ('article_min_fact_confidence', '75'::jsonb),
  ('fact_check_hold_retry_enabled', 'true'::jsonb),
  ('fact_check_hold_retry_max', '1'::jsonb),
  ('fact_check_hold_retry_minutes', '240'::jsonb)
on conflict (key) do update
set value = excluded.value,
    updated_at = now();
