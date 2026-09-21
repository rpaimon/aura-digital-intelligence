# Aura Digital Intelligence Worker

This Worker runs the production automation for the Free Acquisition Engine v2.

## Pipeline

1. Recover stale/deferred jobs.
2. Give approved article-writing jobs first access to free AI providers.
3. Trigger the Vercel RSS scout.
4. Score new stories deterministically with zero routine AI spend.
5. Queue only the strongest daily candidates.
6. Retrieve independent evidence.
7. Verify fixed claims with Groq/Gemini free providers.
8. Write approved stories from verified safe facts only.
9. Run originality and deterministic final-quality gates.
10. Backfill one missing article image when Pexels is configured.
11. Publish eligible articles under the daily cap.

## Required secrets

- `VERCEL_SCOUT_URL`
- `CRON_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `GROQ_API_KEY`
- `GEMINI_API_KEY`

Optional:

- `PEXELS_API_KEY`

Bindings:

- `BROWSER`
- `AI` (emergency fallback only; disabled by default in database settings)

## Schedule

Production cron:

```text
*/15 * * * *
```

## Expected health stage

```text
free-acquisition-engine-v2-framer-v1-stable
```

If free AI providers are temporarily unavailable or rate-limited, eligible jobs are deferred instead of permanently failed or downgraded to unsafe content.
