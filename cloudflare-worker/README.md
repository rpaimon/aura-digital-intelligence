# Aura Intelligence Cloudflare Automation Worker

This Worker replaces frequent Vercel Cron usage while keeping the existing Vercel RSS Scout.

Every 15 minutes it:

1. Calls the protected Vercel `/api/cron/discover` endpoint.
2. Loads a small batch of `discovered` stories from Supabase.
3. Scores them with Cloudflare Workers AI.
4. Writes importance, Fiji/Pacific, business and Aura-service relevance scores back to `stories`.
5. Calculates a weighted priority score for the automation log.
6. Marks successfully processed stories as `scored`.
7. Logs each cycle in `jobs`.

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
