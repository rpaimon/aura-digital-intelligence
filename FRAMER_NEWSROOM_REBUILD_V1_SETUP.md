# Aura Digital Intelligence — Framer Newsroom Rebuild v1

This package recreates the visual structure and interactions of the user's Framer newsroom inside the existing Next.js/Tailwind Aura Digital Intelligence project.

## What it changes

- Rebuilds `/` as a magazine-style editorial homepage with:
  - large TODAY'S UPDATE masthead
  - featured lead story
  - staff picks sidebar
  - Happening Today grid
  - topic sections
  - Fiji-focused commercial CTA
  - RSS follow block
- Rebuilds `/news` as the all-news archive with working search.
- Rebuilds `/news/[slug]` article pages with:
  - large editorial headline
  - author block
  - reading progress
  - share/copy actions
  - source/evidence cards
  - publication-standard sidebar
  - contextual Aura Digital Fiji CTA
  - related stories
- Rebuilds topic/category presentation.
- Adds `/categories`, `/authors`, `/career`, `/rss.xml`, and a branded 404 page.
- Restyles About, editorial policy, corrections, AI policy and fact-checking pages through the shared editorial shell.
- Adds responsive mobile navigation, search, category ribbon, hover transitions, image zoom effects, scroll-reveal animation and reduced-motion support.

## Important

This is a front-end/public-site update only.

It does NOT modify:
- Cloudflare Worker automation
- AI provider routing
- Supabase newsroom schema
- story scoring
- fact checking
- article writer
- originality guard
- publishing engine

No database migration is required.
No Cloudflare Worker update is required.

## Deployment

1. Extract this package over the current project.
2. Keep `.git` and `.env.local`.
3. Run `git status` and review the listed public-site files.
4. Commit and push to GitHub.
5. Wait for Vercel to become Ready.
6. Check `/`, `/news`, `/categories`, one topic page, and one article page.

## Source-code note

The implementation is clean Next.js/Tailwind code recreated from the rendered Framer design and public visual structure. It does not depend on Framer runtime code or require a Framer export.
