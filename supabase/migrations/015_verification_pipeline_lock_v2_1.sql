-- Aura Digital Intelligence
-- 015: Verification pipeline v2.1 lock.
--
-- Purpose:
-- - keep the existing 75 confidence gate and two-independent-publisher minimum;
-- - restore exactly one controlled HOLD retry after four hours;
-- - give the most recent high-priority HOLDs one bounded chance under the fixed
--   verifier after deployment, without creating an unbounded backlog.
--
-- The Worker contains the corresponding atomic-claim/evidence changes. This
-- migration intentionally does not change editorial design, publishing limits,
-- article quality thresholds, or source requirements.

insert into public.settings (key, value)
values
  ('fact_check_hold_retry_enabled', 'true'::jsonb),
  ('fact_check_hold_retry_max', '1'::jsonb),
  ('fact_check_hold_retry_minutes', '240'::jsonb),
  ('fact_check_approve_confidence', '75'::jsonb),
  ('article_min_fact_confidence', '75'::jsonb),
  ('fact_check_min_sources', '2'::jsonb)
on conflict (key) do update
set value = excluded.value,
    updated_at = now();

-- Give only two recent/high-priority HOLDs a post-deploy retry opportunity.
-- The Worker queues at most one HOLD retry per cycle, so this remains bounded.
with retry_seed as (
  select fc.id
  from public.fact_checks fc
  join public.stories s on s.id = fc.story_id
  where fc.verdict = 'hold'
    and fc.retry_count < 1
    and fc.next_retry_at is null
    and fc.checked_at >= now() - interval '72 hours'
  order by coalesce(s.priority_score, 0) desc, fc.checked_at desc
  limit 2
)
update public.fact_checks fc
set next_retry_at = now() + interval '5 minutes'
where fc.id in (select id from retry_seed);
