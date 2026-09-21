# Aura Digital Intelligence — Master Project

This repository is the production master for **Aura Digital Intelligence** at `https://intelligence.auradigitalfiji.com`.

## Design freeze

The public layout is the **Framer Newsroom Rebuild v1** design. Do not redesign or replace the public layout unless explicitly requested. Functional changes should preserve the existing structure, spacing, typography, colors, navigation, cards, article layout and responsive behavior.

## Current production architecture

The newsroom uses a deterministic-first, AI-last pipeline designed to operate on free infrastructure and free AI allowances:

1. Curated RSS/Atom discovery and source-health monitoring.
2. URL normalization and duplicate protection.
3. Deterministic scoring for freshness, source trust, Fiji/Pacific relevance, business relevance and Aura service relevance.
4. Only the strongest candidates proceed to independent evidence retrieval.
5. Fixed-claim verification uses free AI providers through a provider router.
6. Application code validates evidence references and calculates confidence/verdict.
7. APPROVED stories are written from verified safe facts only.
8. Originality fingerprints block excessive phrase overlap and can trigger a rewrite.
9. Deterministic final quality gate checks evidence, originality, SEO and practical usefulness.
10. Eligible articles can publish automatically, capped at two per Fiji day.
11. Contextual Aura Digital Fiji links use first-party conversion tracking.

## Free AI provider router

Cloudflare Workers AI is **not required** for normal operation.

Recommended Worker secrets:

- `GROQ_API_KEY` — verification provider
- `GEMINI_API_KEY` — article-writing provider
- `PEXELS_API_KEY` — optional editorial imagery
- `CRON_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `VERCEL_SCOUT_URL`

Cloudflare AI remains an optional emergency fallback and is disabled by default. Provider quota/rate-limit errors defer jobs instead of permanently failing them.

## Vercel environment variables

Required production variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `CRON_SECRET`
- `NEXT_PUBLIC_SITE_URL=https://intelligence.auradigitalfiji.com`
- `NEXT_PUBLIC_PUBLIC_INDEXING_ENABLED=false` while the publication is still being reviewed

Never commit `.env.local` or any API key.

## Cloudflare schedule

The production Worker runs on:

```text
*/15 * * * *
```

The Worker processes approved writer jobs first, then discovery/scoring, candidate verification, quality gating and publishing.

## Database

Keep all files in `supabase/migrations/`. They are deployment history and should not be deleted even after they have been run.

Migration `013_free_acquisition_engine_v2.sql` contains the current acquisition-engine/security upgrade, including:

- explicit newsroom admin allow-list
- hardened RLS policies
- conversion tracking
- AI defer/retry fields
- article image attribution
- deterministic-first settings
- two-article daily target

## Security

- Admin routes require authenticated membership in `admin_users`.
- Feed testing blocks private/local targets and unsafe redirects.
- Service-role keys are server/Worker-only.
- Public article reads expose published content only.
- CTA click tracking is server-side and never blocks the destination.

## Public SEO/news infrastructure

- Canonical article URLs use clean SEO slugs.
- Existing stored legacy slugs remain resolvable and redirect to the clean public path.
- `NewsArticle` structured data is emitted on article pages.
- `/sitemap.xml` and `/news-sitemap.xml` use public clean article paths.
- `/rss.xml` uses public clean article paths.
- Topic hubs support AI, cybersecurity, cloud, business technology, ecommerce, and Fiji/Pacific coverage.
- Prominent public UI emphasizes verification, originality and editorial accountability; implementation details remain documented in the technology-use policy.

## Important editorial rules

- Event-specific factual statements must come from verified safe facts.
- Source names are not permission to invent or infer additional facts.
- Fiji implications must be framed as analysis/advice unless independently verified.
- A short accurate article is preferred over padded or invented detail.
- HOLD/REJECT stories do not enter the writer.
- Originality and final quality gates must pass before publishing.

## Main commands

```bash
npm install
npm run dev
npm run build
```

Cloudflare Worker:

```bash
cd cloudflare-worker
npm install
npm run dev
npm run deploy
```

## Current Worker health stage

Expected `/health` stage after deploying the Worker in this master:

```text
free-acquisition-engine-v2-framer-v1-stable
```
