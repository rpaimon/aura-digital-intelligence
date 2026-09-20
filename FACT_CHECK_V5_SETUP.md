# Fact Check v5 - Deterministic Verification Confidence

Retrieval v4 proved that independent sources can be found, but the AI model returned a zero confidence score even when three publishers were available. v5 no longer trusts a single model-generated confidence number as the publication gate.

## What changes

The final verification confidence is calculated deterministically from:

- claim-level support (`supported`, `partial`, `conflicted`, `unverified`)
- number of independent publishers
- whether claims cite explicit evidence-source indexes
- conflict penalties
- unresolved evidence penalties

The AI verdict is still respected. Automatic approval requires all of the following:

- AI verdict is `approve`
- at least the configured minimum independent sources (default 2)
- deterministic verification confidence meets the configured threshold (default 75)
- at least one supported claim
- no conflicting claim checks
- no conflicts reported

This preserves the conservative quality gate while removing unreliable AI confidence calibration.

## Deployment order

1. Push this project to GitHub and wait for Vercel Ready.
2. Copy `cloudflare-worker/src/index.ts` into the live Cloudflare `worker.js` and deploy.
3. Confirm `/health` reports `fact-check-v5-deterministic-confidence`.
4. Run `supabase/migrations/006_fact_check_confidence_retry.sql`.
5. Trigger `/run` once manually.
6. Inspect `factCheckProcessed`, `factChecked`, `confidence`, `confidenceMetrics`, and `verdict`.
