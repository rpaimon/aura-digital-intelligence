# Launch privacy plan

## Current state

The short Vercel production URL is a public web address. Anyone who knows or receives the URL can open the public pages. Admin pages are still protected by Supabase authentication and cron/API operations use their own authorization.

This update changes search-engine behavior so public indexing is OFF by default.

### Default while building

Do not set `NEXT_PUBLIC_PUBLIC_INDEXING_ENABLED`, or set it to `false`.

Result:

- page metadata says `noindex, nofollow`
- `/robots.txt` disallows crawling
- `/sitemap.xml` is empty
- the URL still works for you, Cloudflare automation, and direct testing
- `/admin/*` continues to require authentication

This prevents normal search-engine discovery but is not access control. Someone with the exact public URL can still open public pages.

## Vercel deployment protection

Enable **Standard Protection** for previews so branch/preview deployment URLs require Vercel Authentication. Keep the current production URL public while Cloudflare is calling the Vercel RSS scout endpoint.

Do not switch the production deployment to full Vercel Authentication until the Cloudflare-to-Vercel automation has a supported bypass/trusted-source configuration, otherwise discovery can stop.

## Public launch

Recommended final public address:

- `intelligence.auradigitalfiji.com`, or
- `news.auradigitalfiji.com`

At launch:

1. connect the custom domain in Vercel
2. set `NEXT_PUBLIC_SITE_URL` to the final HTTPS domain
3. set `NEXT_PUBLIC_PUBLIC_INDEXING_ENABLED=true`
4. redeploy
5. verify `/robots.txt`, `/sitemap.xml`, `/news`, and one article page
6. only then consider enabling automatic publishing

The `.vercel.app` domain can remain as infrastructure; market and link the custom Aura Digital Fiji domain instead.
