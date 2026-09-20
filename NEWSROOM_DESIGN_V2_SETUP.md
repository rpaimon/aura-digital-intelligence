# Newsroom Design v2 + Domain Plan

This update is presentation-only. It does not change the Worker, Supabase schema, discovery, scoring, fact checking, article writing, originality guard, quality gate, or publishing rules.

## What changes

- Complete redesign of `/news` into a premium dark editorial/magazine experience.
- Featured-story layout and latest-signal rail.
- Mobile-first responsive cards and category rail.
- Redesigned article page with reading progress, share/copy controls, evidence trail, publication-standard panel and related articles.
- Existing featured images are used when available; CSS-based editorial art is used when there is no image.
- No database migration is required.
- No Cloudflare Worker update is required.

## Recommended public domain

Primary recommendation: `intelligence.auradigitalfiji.com`

Reason: it matches the product name, keeps Aura Digital Fiji as the parent brand, and avoids buying another domain while the publication is being established.

Keep the Vercel `*.vercel.app` address as an infrastructure/fallback URL, not the public brand URL.

## Domain setup

1. In Vercel open the Aura Intelligence project -> Settings -> Domains.
2. Add `intelligence.auradigitalfiji.com` to Production.
3. Vercel will show the exact DNS record it expects. Use that exact target; modern Vercel projects can receive a project-specific CNAME target.
4. In Cloudflare -> `auradigitalfiji.com` -> DNS, create the record Vercel requests for the `intelligence` hostname.
5. Wait until Vercel says the domain has a valid configuration and SSL is issued.
6. In Vercel -> Settings -> Environment Variables, set Production:

   `NEXT_PUBLIC_SITE_URL=https://intelligence.auradigitalfiji.com`

7. Redeploy once after changing the environment variable so canonical URLs, Open Graph URLs, sitemap entries and article metadata use the custom domain.
8. Keep `NEXT_PUBLIC_PUBLIC_INDEXING_ENABLED=false` during private testing. When the newsroom is ready for public search discovery, change it to `true` and redeploy.

## Optional alias later

You can later also add `news.auradigitalfiji.com` and redirect it to `intelligence.auradigitalfiji.com`. Use only one canonical public hostname to avoid duplicate indexing.
