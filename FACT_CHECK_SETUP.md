# Fact Checker deployment order

Use this order so the website and Worker never expect database fields that do not exist yet.

1. Run `supabase/migrations/003_fact_check_verification.sql` in Supabase SQL Editor.
2. Copy this project update into the Git-connected master project, preserving `.git` and `.env.local`.
3. Commit and push the web/admin changes to GitHub; wait for Vercel to become Ready.
4. In Cloudflare Worker editor, replace the current Worker code with `cloudflare-worker/src/index.ts` **without** the first `// @ts-nocheck` line if the Cloudflare editor file is `worker.js`. The rest is plain JavaScript-compatible code.
5. Deploy the Worker and check `/health`. Expected stage: `fact-check-and-verification-json-mode`.
6. Run one manual `/run` cycle. Migration 003 queues existing research packages automatically.
7. Open `/admin/fact-checks` and verify the first package.

Safety rules in this version:

- At most 1 fact check per automation cycle by default.
- Up to 3 independent publisher pages are used as evidence.
- `APPROVE` requires at least 2 usable independent sources.
- `APPROVE` requires at least 75 verification confidence.
- Any recorded conflict downgrades an AI approval to `HOLD`.
- Public auto-publishing remains off.
