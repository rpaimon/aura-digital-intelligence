# Aura Digital Intelligence — Publishing Engine v1

This release adds the production-facing publishing layer after Article Writer v1.

## What it adds

- Deterministic final quality gate (no extra AI call)
- Public `/news` newsroom
- Public `/news/[slug]` article pages
- Source/citation display
- SEO metadata, canonical URLs, Open Graph metadata
- `NewsArticle` JSON-LD
- `sitemap.xml` and `robots.txt`
- Admin publish, schedule, unpublish controls
- Manual / automatic publishing mode
- Publication audit logging
- Scheduled publication processing in the existing Worker cron

## Safety defaults

Automatic publishing stays **OFF** after migration.

`publishing_mode = manual`

A generated article must pass the final deterministic quality gate before it can be published or scheduled. HOLD/REJECT fact checks never enter the writer, so they cannot reach this stage.

## Deployment order

1. Copy this package over the current master project.
2. Commit/push and wait for Vercel Ready.
3. Replace the live Cloudflare Worker code with `cloudflare-worker/src/index.ts`.
4. Confirm `/health` reports `publishing-engine-v1-quality-gate-public-news`.
5. Run `supabase/migrations/010_publishing_engine_v1.sql` once.
6. No repetitive manual Worker testing is required. The existing 15-minute cron will process future approved stories automatically.

## Before enabling automatic publishing

Keep Manual mode until at least a few approved articles have passed the final quality gate and look correct on the public article page. Then switch Publishing mode to Automatic from `/admin/articles`.
