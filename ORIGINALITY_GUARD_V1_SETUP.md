# Originality Guard v1

This update adds a deterministic copyright/originality safety layer before publication.

## How it works

1. During fact checking, the Worker converts independent-source evidence text into hashed 8-word fingerprints.
2. Publisher prose itself is not stored in the fingerprint field; only hashes are retained.
3. The Article Writer still receives verified `safe_facts`, not source article text.
4. After writing, the Worker compares the article body against the independent-source fingerprints.
5. Excessive exact phrase overlap triggers an automatic rewrite using only verified facts.
6. The article is checked again. Up to two originality rewrites are allowed by default.
7. If it still fails, the article remains blocked from the final quality gate and from both manual and automatic publishing.

Default fail conditions are intentionally conservative:

- an exact matching phrase reaches about 18 consecutive words; or
- exact 8-word shingle overlap exceeds 8% with enough matches to be meaningful.

These are engineering safeguards, not a legal guarantee. Copyright risk can depend on jurisdiction and context.

## Deployment

1. Copy this package over the current master project.
2. Commit/push and wait for Vercel Ready.
3. Replace live Cloudflare `worker.js` with `cloudflare-worker/src/index.ts` and deploy.
4. Run `supabase/migrations/012_originality_guard_v1.sql`.
5. `/health` should show `originality-guard-v1-publishing-safe`.

No manual `/run` is required. The existing 15-minute automation can pick up the new stage automatically.

## Important

Do not enable automatic publishing until at least a few real articles have passed Fact Check, Originality Guard, and Final Quality Gate and you have reviewed their rendered pages.
