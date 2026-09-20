# Source Network v1 — Changelog

- Expanded the curated source registry to 28 feeds.
- Added Fiji/Pacific feeds: FBC News, The Fiji Times, Islands Business, RNZ Pacific and ABC News.
- Added official/primary technology feeds from Cloudflare, GitHub, Google, Microsoft, AWS, CISA and the Australian Cyber Security Centre.
- Added major technology/security publications for independent corroboration.
- Reworked discovery to scan only due sources instead of every active feed on every cron cycle.
- Added per-source scan intervals and first-run staggering.
- Added health states: awaiting check, healthy, warning, failing and auto-disabled.
- Added consecutive-failure tracking, exponential backoff and optional automatic disable.
- Added source success/failure/discovery metrics to `/admin/sources`.
- Reduced database chatter by preloading URL/hash/cluster duplicate sets per feed.
- Limited ingestion to recent stories to prevent a large historical backfill when the network is first seeded.
- Kept the Cloudflare Worker unchanged; the existing cron automatically benefits after Vercel + migration 011 are live.
