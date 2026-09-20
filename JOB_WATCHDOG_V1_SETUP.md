# Job Watchdog v1 — Stuck Processing Recovery

This update fixes a production reliability bug where a newsroom job can remain forever in `processing` if the Cloudflare Worker invocation is terminated after the job is claimed but before the job can mark itself `completed` or `failed`.

## What happened

The approved article job was created immediately after fact-check approval and was picked up by the next 15-minute cron cycle. It changed to `processing`, but never received `finished_at`, `error_message`, or an article id. That pattern means the Worker stopped outside the normal application catch/finalization path.

The old queue only selected `queued` jobs, so later cron cycles could never pick that job up again.

## Fix

- Adds an automatic stale-job watchdog at the start of every cycle.
- A job left in `processing` for more than 30 minutes is automatically returned to `queued` if attempts remain.
- Jobs that reach their existing `max_attempts` are safely marked `failed` instead of looping forever.
- Applies to `research_story`, `fact_check_story`, and `write_article` jobs.
- Correctly increments attempt counters for research and fact-check jobs.
- Moves already-approved article writing to the start of the cron cycle so discovery/research work cannot starve the writer late in the invocation.
- Newly approved stories are written on the next normal cycle (normally within 15 minutes).
- Adds `staleJobsRecovered` diagnostics to `/run` output.

## Deployment

1. Copy this package over the current project.
2. Commit/push so GitHub contains the live Worker source.
3. Replace Cloudflare `worker.js` with `cloudflare-worker/src/index.ts` and deploy.
4. Confirm `/health` shows:
   `job-watchdog-v1-writer-first-originality-safe`

There is **no Supabase migration** for this update.

The currently stuck article job is already older than the 30-minute threshold. After the new Worker is live, the next scheduled cycle will automatically requeue it and give the Article Writer another attempt. Do not manually reset the database or repeatedly call `/run`.

## Why this is permanent

A hard platform termination cannot always run application cleanup code. Therefore production job queues need lease/stale-job recovery rather than relying only on `try/catch`. This watchdog provides that recovery path.
