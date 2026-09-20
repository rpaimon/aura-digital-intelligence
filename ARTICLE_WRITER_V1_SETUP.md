# Article Writer v1 + Automatic HOLD Retry

This stage starts only after the v7 fact checker. It does **not** enable public publishing.

## What it does

- Approved fact checks automatically queue one article-writing job.
- The writer receives only `safe_facts`, writing constraints, and verified source labels.
- It cannot use HOLD or REJECT stories.
- It cannot write below the configured fact-check confidence threshold (default 75).
- Verified source links are appended by application code, not invented by the model.
- SEO title, description, keywords, excerpt and category are generated with the draft.
- A deterministic article quality score is stored for the later publishing gate.
- HOLD fact checks retry automatically on an exponential schedule instead of needing manual SQL.
- Default retry schedule: roughly 6h, 12h, 24h, 48h, maximum four retries.
- Only one article and one due HOLD retry are handled per cycle to protect the free tier.

## Deployment order

1. Copy this package over the current master project.
2. Commit and push to GitHub; wait for Vercel to be Ready.
3. Replace the live Cloudflare `worker.js` with `cloudflare-worker/src/index.ts` and deploy.
4. Confirm `/health` shows `article-writer-v1-safe-facts-hold-retry`.
5. Run `supabase/migrations/009_article_writer_hold_retry.sql` in Supabase SQL Editor.
6. Run the Worker once manually.
7. Check `/admin/articles` and the `/run` output fields `articlesProcessed`, `articlesWritten`, and `holdRetriesQueued`.

## Important safety behavior

A HOLD story remains unpublished and is never sent to the writer. The retry scheduler simply gives source coverage time to improve. Auto-publishing remains off; generated articles are `draft` or `review` only.
