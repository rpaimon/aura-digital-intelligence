-- Aura Digital Intelligence v2.11
-- One-shot headline normalization + automatic publication.
--
-- This migration does NOT lower any verification or quality threshold.
-- It only:
--   1) switches publication mode from manual to automatic; and
--   2) re-queues recent originality-passed articles whose previous final gate
--      failed with an overlong headline, so the Worker can shorten the headline
--      once and run the same quality gate again.

insert into public.settings (key, value, updated_at)
values
  ('publishing_mode', '"automatic"'::jsonb, now())
on conflict (key) do update
set value = excluded.value,
    updated_at = now();

update public.articles
set final_quality_passed = null,
    final_quality_score = null,
    final_quality_checked_at = null,
    status = case when status = 'draft' then 'review' else status end,
    updated_at = now()
where status in ('draft', 'review')
  and originality_passed = true
  and final_quality_passed = false
  and char_length(coalesce(title, '')) > 85
  and created_at >= now() - interval '7 days'
  and coalesce(final_quality_notes -> 'failures', '[]'::jsonb)::text ilike '%Headline length%';
