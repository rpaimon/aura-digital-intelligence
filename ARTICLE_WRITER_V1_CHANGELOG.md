# What changed

## Fact checker
No v7 verification rules were loosened. APPROVE still requires the existing multi-source confidence gate. HOLD and REJECT never reach the writer.

## Automatic HOLD retry
HOLD stories now receive a delayed retry schedule instead of requiring manual SQL. Defaults are 6h, 12h, 24h, 48h with at most four retries. Only one due HOLD retry is queued per cycle.

## Article writer
An APPROVED fact check automatically creates a `write_article` job. The model receives verified `safe_facts` and writing constraints, not the unverified research narrative. Source links are appended by application code. Generated articles remain `draft` or `review`; this package does not auto-publish.

## SEO and first quality score
The writer stores SEO title, SEO description and keywords. Code calculates a first-pass quality score using fact-check approval/confidence, independent-source count, safe-fact count, article length and SEO completeness. This score is for the later publishing gate and does not publish by itself.

## Free-tier controls
At most one article is written per cycle, and the existing `max_articles_per_day` setting is enforced (fallback 8/day). Writer jobs retry automatically up to the job's `max_attempts` after transient failures.

## Admin
`/admin/articles` shows generated drafts, quality score, fact-check confidence, safe-fact/source counts, SEO preview and draft content. The dashboard links to it.
