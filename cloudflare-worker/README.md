# Aura Intelligence Cloudflare Automation Worker

This Worker replaces frequent Vercel Cron usage while keeping the existing Vercel RSS Scout.

Every 15 minutes it:

1. Calls the protected Vercel `/api/cron/discover` endpoint.
2. Loads a small batch of `discovered` stories from Supabase.
3. Scores them with Cloudflare Workers AI.
4. Scores importance, Fiji/Pacific, business and Aura-service relevance.
5. Calculates and stores a weighted priority score.
6. Automatically decides `ignore`, `watch`, or `research`.
7. Queues high-priority stories for research.
8. Fetches the original source page and creates a structured preliminary AI research package.
9. Stores research packages in `research` and logs all work in `jobs`.

## Required Cloudflare Worker secrets

- `VERCEL_SCOUT_URL`
- `CRON_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

Do not commit secret values.

## Non-secret configuration

`wrangler.jsonc` contains:

- `MAX_STORIES_PER_RUN=6`
- `AI_MODEL=@cf/zai-org/glm-4.7-flash`
- Cron schedule `*/15 * * * *`

The small batch is intentional to control free Workers AI usage.


## Database migration

Before deploying this Worker version, run `supabase/migrations/002_decision_research.sql` in the Supabase SQL Editor.

Research is intentionally preliminary. It does not claim multi-source verification; the fact-checking stage comes next.
