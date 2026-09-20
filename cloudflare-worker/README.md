# Aura Intelligence Cloudflare Worker

This Worker is the free-tier automation and intelligence layer for Aura Digital Intelligence.

Current pipeline:

1. Trigger the existing Vercel RSS Scout.
2. Score newly discovered stories with Workers AI.
3. Apply deterministic `ignore / watch / research` decisions.
4. Research high-priority stories one at a time.
5. Queue completed research packages for multi-source fact checking.
6. Discover independent coverage using the existing GDELT / Google News / Bing News retrieval chain.
7. Fetch distinct publisher evidence with direct HTTP / Jina / Browser Run fallbacks.
8. Verify up to five code-defined claims against the independent evidence.
9. Validate source references, derive safe facts, and calculate confidence in code.
10. Save a conservative `APPROVE / HOLD` verification package to Supabase.

## v7 reliability rule

Workers AI JSON Mode is used for evidence classification, but the model does not control the final structure or policy decision. Claim slots are defined by code. Missing model slots are repaired individually and otherwise become `unverified`. `safe_facts` are derived only from claims supported by at least two valid independent source indexes. Final confidence and approval are deterministic.

## Required bindings / secrets

- Workers AI binding: `AI`
- Browser Run binding: `BROWSER`
- `VERCEL_SCOUT_URL`
- `CRON_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

Optional environment variables are represented in `wrangler.jsonc`:

- `AI_MODEL`
- `MAX_STORIES_PER_RUN`
- `MAX_RESEARCH_PER_RUN`
- `MAX_FACT_CHECKS_PER_RUN`

Run the existing verification migrations in order, then use `supabase/migrations/008_fact_check_v7_fixed_claim_retry.sql` to retry qualifying HOLD stories after v7 is live.

Public automatic publishing remains disabled. Only stories that pass the verification gate should later be eligible for the article writer.
