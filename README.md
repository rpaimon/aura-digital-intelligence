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

Not yet enabled:

- News feed ingestion
- AI research
- AI writing
- Fact checking
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

The next implementation should add:

1. Source Manager UI
2. RSS discovery worker
3. Canonical URL and content hashing
4. Duplicate clustering
5. Fiji relevance scoring
6. Aura-service relevance scoring
7. Research queue
8. AI research agent
9. Fact checker
10. Writer
11. SEO generator
12. Article editor
13. Public blog
14. Vercel Cron
15. Cost controls
16. Automatic publishing only after quality testing

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

The current automation stage adds deterministic priority decisions (`ignore`, `watch`, `research`) and a preliminary autonomous research agent using Cloudflare Workers AI. Before deploying this stage, run `supabase/migrations/002_decision_research.sql` in Supabase. Public auto-publishing remains off; fact checking is the next quality gate.
