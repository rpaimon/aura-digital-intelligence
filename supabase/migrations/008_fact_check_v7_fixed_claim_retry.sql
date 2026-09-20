-- Fact Check v7 retry
-- Requeue only stories that already have enough independent evidence but are
-- still on HOLD because the previous claim-verification stage produced zero
-- confidence or no usable claim checks.
update jobs j
set
  status = 'queued'::job_status,
  attempts = 0,
  started_at = null,
  finished_at = null,
  error_message = null
where j.job_type = 'fact_check_story'
  and j.story_id in (
    select fc.story_id
    from fact_checks fc
    where fc.verdict = 'hold'
      and coalesce(fc.independent_source_count, 0) >= 2
      and (
        coalesce(fc.confidence, 0) = 0
        or jsonb_array_length(coalesce(fc.claim_checks, '[]'::jsonb)) = 0
      )
  );
