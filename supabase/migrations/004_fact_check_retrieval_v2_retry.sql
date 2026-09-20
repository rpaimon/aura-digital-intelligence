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
