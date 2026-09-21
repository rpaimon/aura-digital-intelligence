# Aura Digital Intelligence

Aura Digital Intelligence is the customer-acquisition publication of Aura Digital Fiji.

The commercial objective is simple:

**useful Fiji-focused technology intelligence → organic discovery → trust → relevant Aura Digital Fiji service → enquiry.**

This project is deliberately designed to run on free infrastructure and free AI allowances without processing every incoming story with an expensive language model.

## Current architecture — Free Acquisition Engine v2

1. Curated RSS/source discovery runs frequently.
2. URL normalization and duplicate protection run without generative AI.
3. Story importance, freshness, Fiji/Pacific relevance, business relevance and Aura service fit are scored deterministically in code.
4. Only the strongest small candidate set is sent to verification.
5. Independent evidence is retrieved from distinct publishers.
6. Free AI providers classify fixed claims; application code validates source indexes, derives safe facts and calculates the final confidence/verdict.
7. APPROVED stories are drafted from verified safe facts only.
8. Originality fingerprints detect excessive phrase overlap and can trigger an automatic rewrite.
9. A deterministic final quality gate checks evidence, originality, SEO, Fiji usefulness and practical business value.
10. Eligible articles are automatically published, capped at two per Fiji day.
11. Contextual Aura service CTAs record privacy-light first-party conversion events.

## Free AI provider router

The Worker does not require paid Cloudflare Workers AI for normal operation.

Recommended free providers:

- `GROQ_API_KEY` — verification primary (`openai/gpt-oss-120b` by default)
- `GEMINI_API_KEY` — article-writing primary (`gemini-2.5-flash` by default)
- `PEXELS_API_KEY` — optional article imagery

Cloudflare Workers AI is kept only as an optional emergency fallback and is disabled by database setting by default.

If all configured free AI providers are temporarily rate-limited or unavailable, jobs are **deferred**, not permanently failed and not downgraded to unsafe content.

## Public publication

Main domain:

`https://intelligence.auradigitalfiji.com`

Important routes:

- `/` — publication homepage
- `/news` — newsroom/archive
- `/news/[slug]` — individual articles
- `/news/topic/[slug]` — topic authority hubs
- `/about`
- `/editorial-standards`
- `/fact-checking`
- `/corrections`
- `/ai-policy`
- `/privacy`
- `/contact`
- `/authors/aura-digital-intelligence`
- `/news-sitemap.xml`

## Security model

Migration `013_free_acquisition_engine_v2.sql` replaces the old "every authenticated user is an admin" RLS model with an explicit `admin_users` allow-list. Existing Supabase Auth users are snapshotted as admins when migration 013 runs; future auth accounts are not admins automatically.

The feed-test endpoint also validates admin membership and blocks private/local network targets before fetching RSS/Atom URLs.

Never expose or commit:

- `SUPABASE_SECRET_KEY`
- `CRON_SECRET`
- `GEMINI_API_KEY`
- `GROQ_API_KEY`
- `PEXELS_API_KEY`
- `.env.local`
- Cloudflare `.dev.vars`

## Deployment

Use `FREE_ACQUISITION_ENGINE_V2_SETUP.md` for the one-time controlled upgrade.

## Indexing

Keep `NEXT_PUBLIC_PUBLIC_INDEXING_ENABLED=false` until at least one or two real articles have been inspected on the production domain.

When the publication is ready for discovery, change it to `true`, redeploy, verify `robots.txt` and the sitemaps, then connect the domain to Google Search Console.

## Editorial principle

The system is not designed to rewrite other publishers. It selects significant developments, verifies claims against independent evidence, writes from verified facts, adds Fiji business context and checks exact phrase overlap before publication.

A missing article is preferable to an inaccurate or low-value article.
