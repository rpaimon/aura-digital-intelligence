# Publishing Engine v1 — Changelog

## Added
- Deterministic final article quality gate
- Manual/automatic publishing mode
- Scheduled publishing and cron processing
- Manual publish/unpublish actions
- Publication audit logging
- Public `/news` index
- Public `/news/[slug]` pages
- Independent source cards
- NewsArticle JSON-LD
- Dynamic sitemap and robots directives
- Canonical/Open Graph/Twitter metadata
- Public RLS read policies for published content only

## Safety
- Automatic publishing defaults to OFF (`manual`)
- Only `final_quality_passed = true` articles can publish or schedule
- HOLD/REJECT stories remain upstream and cannot enter the publication path
- Final quality gate is deterministic and consumes no additional AI inference
