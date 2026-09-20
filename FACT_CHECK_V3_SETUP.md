# Fact Check Retrieval v3 — Browser Run fallback

This version keeps the existing conservative fact-check gate and adds Cloudflare Browser Run as a last-resort retrieval layer.

## Required Cloudflare binding

Add a Browser Run binding named exactly:

`BROWSER`

The Worker compatibility date is already later than 2026-03-24, which is required for `quickAction()`.

## Retrieval order

1. GDELT discovery
2. Google News RSS publisher hints
3. GDELT domain resolution
4. Direct page fetch
5. Jina Reader fallback
6. Browser Run resolves Google News intermediary links
7. Browser Run Markdown extracts rendered article text
8. Publisher deduplication + story-match checks
9. AI claim verification

Browser Run is only used as a fallback to reduce free-plan usage.

## After deploying the v3 Worker

Run:

`supabase/migrations/005_fact_check_browser_run_retry.sql`

Then manually trigger one `/run` cycle and inspect `independentSourceCount`, `retrievalMethods`, and `evidenceDomains`.
