# Free Acquisition Engine v2 — Controlled Deployment

This is a one-time architecture upgrade. Do not manually run the old Worker repeatedly during the changeover.

## Before you start

Keep these existing items unchanged:

- `.git`
- `.env.local`
- Vercel Supabase variables
- `CRON_SECRET`
- Cloudflare `AI` binding
- Cloudflare `BROWSER` binding
- `VERCEL_SCOUT_URL`
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

Keep public indexing OFF during the first live-content check:

`NEXT_PUBLIC_PUBLIC_INDEXING_ENABLED=false`

## 1. Pause the Cloudflare schedule

In Cloudflare, open `aura-intelligence-worker` and temporarily disable/remove the `*/15 * * * *` Cron Trigger.

Do not delete the Worker. The pause prevents the old architecture from processing a job while the database is being upgraded.

## 2. Create the free AI API keys

Create your own keys; never paste them into chat or GitHub.

Gemini / Google AI Studio:

`https://aistudio.google.com/app/apikey`

Groq:

`https://console.groq.com/keys`

Optional Pexels imagery:

`https://www.pexels.com/api/`

At least one AI provider is required for writing/verification. Both Gemini and Groq are strongly recommended so the system has a free fallback.

## 3. Add Cloudflare secrets

Cloudflare → Worker → Settings → Variables and Secrets.

Add as **Secrets**:

- `GEMINI_API_KEY`
- `GROQ_API_KEY`
- optional `PEXELS_API_KEY`

Do not add quotes around the values.

Optional model overrides may remain normal variables:

- `GEMINI_MODEL=gemini-2.5-flash`
- `GROQ_MODEL=openai/gpt-oss-120b`

If the model variables are absent, those defaults are used automatically.

## 4. Run migration 013 in Supabase

Open:

`supabase/migrations/013_free_acquisition_engine_v2.sql`

Copy the entire file into Supabase SQL Editor and run it once.

Migration 013:

- adds deferred-job support
- makes article-per-story retries idempotent
- creates privacy-light conversion-event storage
- hardens admin RLS with an explicit admin allow-list
- snapshots existing Supabase Auth users as current admins
- removes the AI research stage
- disables automatic HOLD retries
- requeues jobs that failed only from the old Cloudflare AI quota
- resets the recent unverified backlog for free deterministic scoring
- enables automatic publishing with a target cap of 2/day

Do not create a new Supabase Auth user between this migration and your first admin-login test. Existing users at migration time are preserved as admins.

## 5. Install and push the application update

Extract this upgrade over the current project, keeping `.git` and `.env.local`.

Then:

```powershell
git add .
git commit -m "Rebuild newsroom as free acquisition engine v2"
git push
```

Wait for the newest Vercel deployment to show **Ready**.

If Vercel reports a build error, stop there and inspect that exact build error before changing the Worker or resuming Cron.

## 6. Deploy the new Worker

Copy the full contents of:

`cloudflare-worker/src/index.ts`

into the live Cloudflare `worker.js` and Deploy.

Open `/health`.

Expected stage:

`free-acquisition-engine-v2-two-a-day-seo`

Also confirm:

- `geminiConfigured: true`
- `groqConfigured: true`
- `cloudflareAIFallbackDefault: false`

`pexelsConfigured` may be false if you skipped the optional image API.

## 7. Resume Cron

Restore the Cloudflare Cron Trigger:

`*/15 * * * *`

Do not manually spam `/run`. The next scheduled cycle will:

- give any already-approved writer job first priority
- process routine scoring with zero AI
- select only the best candidate for verification
- defer AI work automatically if every free provider is temporarily unavailable

## 8. First production checks

Check these pages after the scheduled pipeline has had time to run:

- `/admin/dashboard`
- `/admin/fact-checks`
- `/admin/articles`
- `/news`

The first successful article should show evidence sources, Fiji business context, the originality/quality status and a contextual Aura CTA.

## 9. Turn on search indexing only after reviewing real output

After at least one or two production articles look strong, change this Vercel production variable:

`NEXT_PUBLIC_PUBLIC_INDEXING_ENABLED=true`

Redeploy once.

Then verify:

- `https://intelligence.auradigitalfiji.com/robots.txt`
- `https://intelligence.auradigitalfiji.com/sitemap.xml`
- `https://intelligence.auradigitalfiji.com/news-sitemap.xml`

## 10. Google Search Console

Create/verify a Google Search Console Domain property for:

`auradigitalfiji.com`

A Domain property covers the Intelligence subdomain too. Use the DNS TXT record Google provides in Cloudflare DNS.

Submit:

- `https://intelligence.auradigitalfiji.com/sitemap.xml`
- `https://intelligence.auradigitalfiji.com/news-sitemap.xml`

Google News no longer requires a manual Publisher Center publication application for normal eligibility; compliant publishers are considered automatically.

## Operating rule

Do not lower verification/originality/quality thresholds merely to force two articles on a weak news day. The target is two excellent daily opportunities, not two guaranteed low-value pages.
