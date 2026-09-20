# Source Network v1 — Setup

This update does **not** require a Cloudflare Worker code change. The existing 15-minute Worker cron continues calling the same Vercel discovery endpoint; the upgraded Vercel scout handles scheduling and source health.

## What migration 011 does

- adds source health/status fields
- adds staggered `next_check_at` scheduling
- adds feed failure backoff and auto-disable controls
- adds discovery settings for small free-tier batches
- seeds 28 curated sources across technology, AI, cloud, cybersecurity, Fiji and the Pacific
- keeps an existing source's active/inactive choice when the same feed already exists

## Safe deployment order

1. Copy this package over the current project.
2. Commit/push and wait for Vercel to become Ready.
3. Run `supabase/migrations/011_source_network_v1.sql` once in Supabase SQL Editor.
4. Open `/admin/sources` and let the existing 15-minute automation take over.

There is no need to manually run the Worker repeatedly. New sources are deliberately staggered across the first hour.

## Default discovery limits

- 6 due sources per 15-minute cycle
- 30 recent items inspected per source
- stories older than 14 days ignored during feed ingestion
- 5 consecutive feed failures before automatic disable
- source-specific scan intervals from 60 to 180 minutes

These values are stored in `settings` and can be changed later without rebuilding the app.
