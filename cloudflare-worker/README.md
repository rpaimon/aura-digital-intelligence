# Aura Intelligence Cloudflare Worker

This Worker is the free-tier automation and intelligence layer for Aura Digital Intelligence.

Current pipeline:

1. Trigger the existing Vercel RSS Scout.
2. Score newly discovered stories with Workers AI.
3. Apply deterministic `ignore / watch / research` decisions.
4. Research high-priority stories one at a time.
5. Queue completed research packages for multi-source fact checking.
6. Discover independent coverage using GDELT, with Google News RSS as a fallback.
7. Fetch up to three distinct publisher pages and compare claims with Workers AI JSON mode.
8. Save an `APPROVE / HOLD / REJECT` verification package to Supabase.

`APPROVE` is deliberately conservative. The Worker will downgrade an AI approval to `HOLD` unless the configured minimum number of independent sources is available, confidence clears the threshold, and there are no recorded conflicts.

## Required bindings / secrets

- Workers AI binding: `AI`
- `VERCEL_SCOUT_URL`
- `CRON_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

Optional environment variables are already represented in `wrangler.jsonc`:

- `AI_MODEL`
- `MAX_STORIES_PER_RUN`
- `MAX_RESEARCH_PER_RUN`
- `MAX_FACT_CHECKS_PER_RUN`

Run `supabase/migrations/003_fact_check_verification.sql` before deploying this Worker version.

Public automatic publishing remains disabled. Only stories that pass the verification gate should later be eligible for the article writer.
