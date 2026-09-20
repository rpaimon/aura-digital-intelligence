# Fact Check Retrieval v2 deployment

This update improves independent-source retrieval without adding a paid search API.

## What changed

- GDELT now runs multiple search strategies: exact phrase, keyword and proximity queries.
- GDELT searches use a wider one-month window and title-similarity filtering.
- Google News RSS is used as a publisher-discovery fallback.
- Google News publisher hints are resolved back to direct publisher URLs through GDELT when possible.
- Article text uses direct HTTP first, then Jina Reader as a fallback for JS-heavy or redirect-mediated pages.
- Evidence is accepted only when it matches the original story topic.
- Independent publisher deduplication remains enforced.
- Approval still requires at least 2 independent sources and 75 confidence.
- Public auto-publishing remains OFF.

## Deployment order

1. Copy this update over the current Git-connected project and push it to GitHub.
2. Wait for Vercel to become Ready.
3. Copy `cloudflare-worker/src/index.ts` into the Cloudflare `worker.js` editor and Deploy.
4. Check `/health`. Expected stage: `fact-check-retrieval-v2-json-mode`.
5. Only after the new Worker is live, run `supabase/migrations/004_fact_check_retrieval_v2_retry.sql`.
6. Run one manual `/run` cycle.
7. Open `/admin/fact-checks` and inspect independent source count, confidence and verdict.

No new paid API key is required for this version.
