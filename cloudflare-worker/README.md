# Aura Digital Intelligence — Free Acquisition Engine v2

The Worker is now **deterministic first, AI last**. The objective is not maximum article volume; it is two strong Fiji-relevant technology articles per day that can earn search visibility and send qualified readers to Aura Digital Fiji.

## Pipeline

1. Vercel RSS Scout discovers stories from the curated source network.
2. New stories are scored with deterministic code: freshness, source trust, Fiji/Pacific relevance, business usefulness and Aura service relevance. **No generative AI is used here.**
3. The best qualified story is queued for verification. The daily AI candidate cap is 8 and stops early once the daily publishable target is reached.
4. Independent evidence is discovered through the existing GDELT / Google News / Bing News chain and fetched by direct HTTP / Jina / Browser Run fallbacks.
5. Only this small candidate set uses generative AI for claim classification. Groq is preferred for verification, Gemini is the fallback.
6. Deterministic code validates source indexes, derives `safe_facts`, calculates confidence and decides APPROVE/HOLD.
7. APPROVED stories use Gemini for original article writing, with Groq fallback.
8. Originality and final quality gates run in code.
9. Automatic publication is capped at two articles per Fiji day.
10. Contextual article CTAs route readers to the relevant Aura Digital Fiji service and record privacy-light conversion events.

## Free provider router

Recommended secrets:

- `GEMINI_API_KEY` — final article writing primary
- `GROQ_API_KEY` — fact-check verification primary
- `PEXELS_API_KEY` — optional large article imagery

Existing secrets/bindings remain:

- `VERCEL_SCOUT_URL`
- `CRON_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `AI` binding (kept as an emergency fallback only)
- `BROWSER` binding

Cloudflare Workers AI fallback is **disabled by default** by database setting, so the old 10,000-neuron daily allowance is not consumed unless explicitly enabled later.

If all configured free AI providers are temporarily unavailable or rate-limited, the job is deferred and retried later. It does not consume a real attempt and it does not publish a lower-quality substitute.

## Deployment

See `FREE_ACQUISITION_ENGINE_V2_SETUP.md` in the project root. Migration `013_free_acquisition_engine_v2.sql` is required before enabling the new Worker.
