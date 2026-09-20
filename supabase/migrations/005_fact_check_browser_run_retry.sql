-- Aura Digital Intelligence
-- Fact Check Retrieval v3: requeue HOLD fact checks after Browser Run fallback is deployed.
-- Safe to run more than once.

update jobs j
set
  status = 'queued'::job_status,
  attempts = 0,
  started_at = null,
  finished_at = null,
  error_message = null,
  updated_at = now()
where j.job_type = 'fact_check_story'
  and j.story_id in (
    select fc.story_id
    from fact_checks fc
    where fc.verdict = 'hold'
      and coalesce(fc.independent_source_count, 0) < 2
  );
