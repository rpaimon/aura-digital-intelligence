# Aura Digital Intelligence

Phase 1 foundation for the AI-powered technology intelligence platform behind Aura Digital Fiji.

## Strategic goal

This is not designed as an AI content farm. The commercial goal is:

Global technology developments
→ useful research
→ Fiji/Pacific business relevance
→ organic discovery
→ trust
→ Aura service enquiries.

## Current phase

Included:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase SSR authentication
- Admin login
- Protected newsroom dashboard
- Phase 1 database schema
- Source/story/research/article/job tables
- Editorial topics
- Aura-specific automation settings
- Manual publishing mode by default
- Kill switch setting by default

Live now:

- RSS/news feed ingestion
- Duplicate protection
- AI relevance scoring
- Ignore / watch / research decisions
- Autonomous research packages
- Multi-source fact checking with APPROVE / HOLD / REJECT quality gates

Not yet enabled:

- AI article writing
- SEO generation
- Automatic publishing
- Public article pages
- Google Search Console automation
- Social publishing

Those are deliberate next phases.

## Local setup

1. Install Node.js LTS.
2. Create a new Supabase project.
3. Open Supabase SQL Editor.
4. Run `supabase/schema.sql`.
5. Create an admin user in Supabase Authentication.
6. Copy `.env.example` to `.env.local`.
7. Add your Supabase URL and publishable key.
8. Run:

```bash
npm install
npm run dev
```

9. Open `http://localhost:3000`.
10. Open `/admin/login`.

## Supabase authentication

This project uses `@supabase/ssr` with cookie-based authentication. Current Supabase guidance recommends this approach for Next.js SSR applications. See:

https://supabase.com/docs/guides/auth/server-side

## Important security note

Do not put `SUPABASE_SECRET_KEY`, `OPENAI_API_KEY`, or `CRON_SECRET` in client-side code.

Do not commit `.env.local`.

## Next build phase

The ingestion, scoring, research and verification gates are now implemented. The next stage is:

1. Article writer using only verified safe facts
2. SEO title / description / internal-link generation
3. Final quality score
4. Article editor / monitoring UI
5. Public article routes
6. Controlled automatic publishing after quality testing
7. Search and social distribution

## RSS automation block

The project now includes the first autonomous ingestion pipeline:

- Vercel Cron calls `/api/cron/discover` every 10 minutes.
- Active sources with a feed URL are fetched automatically.
- RSS and Atom entries are normalized.
- Tracking parameters are stripped from URLs.
- Exact repeats are skipped.
- Cross-source/title/content duplicates are marked with `status = duplicate`.
- New stories are stored with `status = discovered`.
- `sources.last_checked_at` is updated after a successful source check.
- Every discovery run is recorded in the `jobs` table.
- `/api/cron/maintenance` removes old completed/cancelled job logs after 14 days.

`automation_enabled=false` and `publishing_mode=manual` intentionally do not block RSS discovery. They are reserved for later AI/publishing stages.

### Required environment variables

Production requires:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `CRON_SECRET`

`SUPABASE_SECRET_KEY` is server-only and must never be exposed with a `NEXT_PUBLIC_` prefix.

## Decision + Research stage

Deterministic priority decisions (`ignore`, `watch`, `research`) and the preliminary autonomous research agent use Cloudflare Workers AI. Run `supabase/migrations/002_decision_research.sql` before this stage.

## Fact-check + verification stage

Run `supabase/migrations/003_fact_check_verification.sql` before deploying the latest Worker. The verifier searches for independent coverage, retrieves evidence from distinct publishers, compares claims using structured JSON output, and stores a conservative `approve`, `hold`, or `reject` verdict. Approval requires the configured independent-source count and confidence threshold. Public auto-publishing remains off.


## Fact-check retrieval v2

Independent-source verification now uses stronger GDELT multi-query discovery, publisher-domain resolution and a Jina Reader fallback for pages that cannot be cleanly fetched with plain HTTP. The verifier still requires at least two independent usable sources and the configured confidence threshold before APPROVE. See `FACT_CHECK_V2_SETUP.md`.

## Fact Check Retrieval v3

Browser Run is now used as a final fallback for JavaScript-mediated Google News URLs and publisher pages that ordinary fetch/Jina cannot read. The fact-check approval gate remains unchanged: multiple independent sources and the configured confidence threshold are still required.

## Fact Check v5 - deterministic confidence

The fact-check gate now calculates verification confidence from claim-level evidence rather than trusting the language model's self-reported confidence. Retrieval still requires independent publishers and approval remains conservative. See `FACT_CHECK_V5_SETUP.md`.

## Fact Check v6

v6 enforces claim-by-claim verification. It explicitly numbers research claims, requires non-empty claim checks, retries once if the structured model returns an empty claim-check array, and fails closed to HOLD if claim-level verification is still unavailable. Deterministic confidence continues to require independent evidence and now gives full support weight only to supported claims linked to at least two independent sources.

## Fact Check v7 — fixed claim verification

v7 is the core reliability fix. The worker no longer depends on the model producing a non-empty `claim_checks` array. Application code defines up to five fixed claim slots, validates all source indexes, repairs only missing claim slots, derives `safe_facts` from fully corroborated claims, and calculates the final confidence/verdict deterministically. The verification prompt now contains only claims plus independent evidence, not the unverified research narrative. See `FACT_CHECK_V7_FINAL_FIX.md` and `CORE_PROBLEM_REPORT.md`.

## Article Writer + Publishing Engine

Article Writer v1 generates drafts only from `safe_facts` belonging to APPROVED fact checks. HOLD/REJECT stories are blocked upstream and HOLD stories retry automatically on the configured schedule.

Publishing Engine v1 adds a deterministic final quality gate, public `/news` and `/news/[slug]` routes, source cards, NewsArticle structured data, sitemap/robots support, scheduling, audit logs and manual/automatic publication modes. Automatic publishing intentionally defaults to `manual` until public-page quality has been observed on real approved stories. See `PUBLISHING_ENGINE_V1_SETUP.md`.
