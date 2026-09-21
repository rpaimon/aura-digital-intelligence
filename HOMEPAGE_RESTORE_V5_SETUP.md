# Homepage Restore v5

Scope: homepage + shared public header only.

What this does:
- Restores the previous homepage hero and editorial layout (Today's Update, lead story, Staff Picks, Happening Today, What's Hot topic sections, right-side publication/RSS/Aura cards).
- Replaces the header with a Framer-inspired colored navigation bar on desktop and compact colored navigation buttons on mobile.
- Leaves article pages, /news layout, admin, Supabase, Worker, AI providers and automation untouched.
- No database migration.
- No Cloudflare Worker deployment.

If the local v4 experiment left unused `homepage-showcase.tsx` / `homepage-showcase.module.css` files, they are no longer imported. They may be removed later, but they do not affect runtime.
