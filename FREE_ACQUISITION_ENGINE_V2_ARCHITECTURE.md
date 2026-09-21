# Free Acquisition Engine v2 — Architecture

## Business objective

Aura Digital Intelligence exists to create qualified awareness for Aura Digital Fiji, not to maximize article count.

Target path:

`Search / Google News / Discover → useful article → contextual Aura service CTA → auradigitalfiji.com → enquiry`

## Cost design

Routine work must remain non-AI:

- RSS discovery
- source health
- URL normalization
- deduplication
- freshness scoring
- source-trust weighting
- Fiji/Pacific relevance scoring
- business relevance scoring
- Aura service relevance scoring
- article originality comparison
- final publication quality gate

Generative AI is reserved for:

- claim classification for a small set of strong candidates
- final original article drafting
- originality rewrite only when needed

Default caps:

- 2 publishable articles per Fiji day
- at most 8 AI verification candidates per Fiji day
- 1 fact-check job per scheduled cycle
- 1 article-writing job per scheduled cycle

## Provider routing

Verification order:

`Groq → Gemini → optional Cloudflare Workers AI`

Writing order:

`Gemini → Groq → optional Cloudflare Workers AI`

Cloudflare Workers AI fallback is disabled by default. Provider quota/rate failures defer the job for later and do not consume a genuine content attempt.

## Verification contract

1. Retrieve independent evidence from different publisher domains.
2. Exclude the original publisher from the independent-source count.
3. Application code defines fixed claims.
4. AI classifies each fixed claim against numbered evidence sources.
5. Application code validates source indexes.
6. A claim requires two independent sources for full support.
7. Application code derives `safe_facts` and confidence.
8. APPROVE requires configured source and confidence thresholds with no unresolved conflicts.

The model does not get to declare its own publication confidence.

## Article contract

The writer receives verified safe facts and constraints, not permission to reproduce source articles.

A generated article is expected to provide:

- What happened
- Why it matters
- What this means for Fiji businesses
- What businesses should do now
- an evidence/source section

The Fiji section is analysis and practical guidance. It must not invent local statistics, adoption numbers, quotes or impacts.

## Copyright/originality guard

Independent evidence is converted into hashed word-shingle fingerprints. Publisher prose is not retained in the fingerprint field.

The draft is checked for excessive exact phrase overlap. A failure can trigger an automatic rewrite from the same verified facts. A persistent failure blocks publication.

## Quality gate

Automatic publication requires all of the following:

- fact-check verdict APPROVE
- required fact-check confidence
- required independent-source count
- at least one verified safe fact
- no unresolved conflicts
- originality PASS
- acceptable article length
- acceptable title/SEO metadata
- evidence/source section
- Fiji business context section
- practical action section
- configured final quality score

## Search/Google News foundations

The public site provides:

- permanent article URLs
- visible Fiji publication date/time
- organization byline and author page
- `NewsArticle` JSON-LD
- canonical URLs
- large social/article images
- topic hubs
- editorial standards
- fact-checking policy
- corrections policy
- AI disclosure
- privacy information
- contact/publisher information
- normal sitemap
- Google News sitemap containing only recent published articles

No system can guarantee Google News inclusion or a #1 ranking. The architecture is designed to maximize eligibility, usefulness, originality, transparency and local relevance instead of gaming search systems.
