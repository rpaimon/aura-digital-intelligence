# Aura Digital Intelligence v2.15

This is the complete website + Cloudflare Worker package.

## What changed

### Publishing stability
- Recovery mode now includes selected `watch` stories when the normal `research` pool is empty.
- Standard recovery begins after 10:00 Fiji time while the 2-article target is unmet.
- Deep recovery begins after 14:00 Fiji time when 0 articles have published.
- Publication quality rules are unchanged: 2 independent sources, verification confidence >=75, writer quality >=85, originality checks, final quality >=90.
- `/diagnostics` now reports the recovery WATCH pool, recovery threshold and recovery tier.

### Aura Digital Fiji placement
Aura Digital Fiji is now visible throughout the public site through the global publisher strip, header, mobile menu, homepage studio card, news archive, topic pages, categories, article publisher card, contextual article placements, article sidebar, article bottom band and footer.

## Deploy

1. Replace your current project files with this package and push with GitHub Desktop. Vercel will deploy the website.
2. From this SAME package open `cloudflare-worker/src/index.ts`.
3. Copy the full file into your existing live Cloudflare Worker and click Save + Deploy.
4. Check `/health` — it should show `free-acquisition-engine-v2.15-candidate-recovery`.
5. Check `/diagnostics` to see the current pipeline state.

No Supabase SQL or migration is required for v2.15.
