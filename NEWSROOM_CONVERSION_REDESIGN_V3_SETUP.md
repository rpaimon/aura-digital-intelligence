# Aura Digital Intelligence — Newsroom Conversion Redesign v3

This is a combined public-design + editorial-conversion update based on the owner's Framer visual reference.

## What changes

### Public design
- Framer-style full-screen hero with full-bleed article imagery.
- Automatic featured-story rotation every ~7 seconds when 2+ stories exist.
- Ken Burns / slow zoom background animation.
- Sequential text reveal on each hero transition.
- Desktop color-block navigation and mobile icon-block navigation.
- Magazine-style Happening Today + Staff Picks layout.
- Empty and duplicate homepage sections are hidden instead of repeated.
- Much smaller, more readable mobile article headlines.
- Cleaner article body typography and numbered/bullet lists.
- Compact footer and share controls.

### Aura conversion
Each article now has:
1. an early contextual Aura Digital Fiji recommendation,
2. a mid-article CTA after the Fiji-business section,
3. a strong final CTA,
4. a dismissible sticky mobile Aura CTA,
5. the existing tracked `/go/aura` conversion route.

### Public trust language
Prominent public language about "automation" is removed. Readers see professional trust signals instead:
- Fact checked
- Independent evidence
- Originality checked
- Editorial standards
- Corrections policy

The separate AI policy page can remain available for transparency, but it is no longer promoted in article UI or the main footer.

### Editorial / SEO behavior
- Security stories are classified as Cybersecurity instead of generic Technology.
- New article slugs are short readable SEO slugs without a UUID unless a collision requires one.
- Existing ugly stored slugs continue working and redirect to the clean public slug.
- Sitemap, Google News sitemap, RSS and card links use the clean public URLs.
- Writer instructions are tightened so event-specific factual sentences must come from verified safe facts; analysis/recommendations must be framed as analysis.

### Article images
The existing Pexels integration is used for editorial photos. When `PEXELS_API_KEY` is configured, the Worker also backfills one missing article image per cycle, so older published articles can receive a real editorial image automatically.

## Deployment order

1. In `/admin/articles`, temporarily switch Publishing Mode to **Manual** while this redesign is being reviewed.
2. Extract this package over the current master project. Keep `.git` and `.env.local`.
3. Run `git status`, then commit/push and wait for Vercel Ready.
4. Replace the live Cloudflare `worker.js` with `cloudflare-worker/src/index.ts` and deploy.
5. Optional but strongly recommended for the photo-led hero: create a free Pexels API key and add it to the Worker as secret `PEXELS_API_KEY`.
6. `/health` should show stage `newsroom-conversion-v3-framer-editorial` and `pexelsConfigured: true` when the image key is configured.
7. No Supabase migration is required.
8. Do not manually spam `/run`; let the normal cron operate.
9. Review 1–2 generated articles before switching Publishing Mode back to Automatic.

## Important

This package keeps the Free Acquisition Engine v2 architecture. It does not return to the old AI-heavy scoring system.
