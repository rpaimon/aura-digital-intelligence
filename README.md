# Aura Digital Intelligence — Clean Master

This repository is the production master for **Aura Digital Intelligence**, the technology publication and customer-acquisition engine of Aura Digital Fiji.

## Design baseline

The public layout/design is the **Framer Newsroom Rebuild v1** baseline. This clean-master pass does **not** redesign the homepage, news archive, article layout, mobile layout, typography, colors, spacing, or navigation structure.

## Production architecture

- Next.js 16 / React 19 on Vercel
- Supabase/Postgres for newsroom data and admin authentication
- Cloudflare Worker cron/orchestration
- Deterministic story scoring (zero AI for routine scoring)
- Groq + Gemini free-provider routing for the small number of stories that reach verification/writing
- Cloudflare Workers AI disabled as the normal fallback by default
- Independent-source fact checking and deterministic confidence
- Evidence-bounded article writing from verified safe facts
- Originality/copyright phrase-overlap guard
- Deterministic final publication quality gate
- Source-health monitoring and deduplication
- Automatic publishing target capped at two articles per Fiji day
- First-party Aura Digital Fiji conversion tracking
- Google News sitemap, sitemap.xml, NewsArticle structured data, canonical URLs, RSS and topic hubs

## Important environment variables

### Vercel

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `NEXT_PUBLIC_SITE_URL=https://intelligence.auradigitalfiji.com`
- `NEXT_PUBLIC_PUBLIC_INDEXING_ENABLED=false` until launch review is complete
- `CRON_SECRET` if used by the Vercel cron endpoints

### Cloudflare Worker secrets/bindings

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `VERCEL_SCOUT_URL`
- `CRON_SECRET`
- `GEMINI_API_KEY`
- `GROQ_API_KEY`
- `PEXELS_API_KEY` (optional)
- `AI` binding (optional fallback only)
- `BROWSER` binding

Never commit `.env.local`, `.dev.vars`, API keys, Supabase service-role keys, or cron secrets.

## Security

The project is pinned to Next.js `16.3.3`; the lockfile currently resolves React/React DOM `19.3.0`. Security response headers are configured in `next.config.ts`.

Migration `013_free_acquisition_engine_v2.sql` replaces the old permissive authenticated-user RLS model with an explicit `admin_users` allow-list. The feed-test endpoint validates newsroom admin membership and blocks local/private-network targets to reduce SSRF risk.

## Public URL behavior

Public articles use readable SEO slugs derived from the title. Old stored slugs remain resolvable and redirect to the clean public path, so existing links continue to work.

## Editorial/public trust

Public pages emphasize independent sourcing, originality and editorial standards. A separate `/ai-policy` remains available for transparency without advertising production mechanics throughout the publication.

## Database migrations

Migrations are stored in `supabase/migrations/` and must be kept in sequence. `supabase/bootstrap.sql` is only for a brand-new Supabase project; the production project should receive only new migrations. `014_clean_master_editorial_copy.sql` only updates the public organization-author bio and is safe to run after 013.

## Deployment

1. Keep your existing local `.git` and `.env.local`.
2. Replace source files with this clean master.
3. Run `npm install` (or `npm ci`) locally.
4. Run `npm run build`.
5. Run migration `014_clean_master_editorial_copy.sql` in Supabase.
6. Commit and push to GitHub; wait for Vercel Ready.
7. Replace the live Cloudflare `worker.js` with `cloudflare-worker/src/index.ts` only if the Worker file changed from your live version.
8. `/health` should report `free-acquisition-engine-v2-clean-master`.

## Launch indexing

Keep `NEXT_PUBLIC_PUBLIC_INDEXING_ENABLED=false` while reviewing output. When ready for Google Search/News discovery, change it to `true`, redeploy, verify `/robots.txt`, `/sitemap.xml`, `/news-sitemap.xml`, and then submit the domain in Google Search Console.
