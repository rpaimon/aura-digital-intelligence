# Originality Guard v1 changelog

- Added hashed source-phrase fingerprints generated during fact checking.
- Added deterministic article/source similarity analysis.
- Added automatic rewrite-and-recheck loop, maximum two rewrites by default.
- Added fail-closed behavior when source fingerprints are unavailable.
- Added originality score, status, diagnostics and rewrite count to articles.
- Added originality status to `/admin/articles`.
- Manual publish and scheduling now require originality PASS.
- Automatic publishing now requires originality PASS.
- Final quality gate now requires originality PASS.
- Added build-time public indexing switch; indexing is OFF by default.
- Added launch/privacy plan for the Vercel production URL and eventual custom domain.
