# Homepage Visual v4 — homepage-only redesign

This package intentionally redesigns **only the public homepage**.

It keeps the previously deployed desktop/mobile layouts for `/news`, article pages, categories, authors, about, contact, and admin pages.

## Homepage changes
- Full-viewport image-led `TODAY'S UPDATE` hero inspired by the supplied Framer reference.
- Automatic featured-story rotation every ~7.6 seconds when multiple published stories exist.
- Slow Ken Burns zoom on each hero image.
- Staggered date/category/headline entrance animation.
- Desktop colored navigation blocks and mobile colored icon navigation.
- Happening Today + Staff Picks editorial layout using unique stories only.
- Sections hide instead of duplicating the same article when the publication has too little content.
- Category-aware editorial photo fallbacks when an article has no featured image.
- Small homepage conversion band to Aura Digital Fiji.
- No database migration and no Cloudflare Worker change.

## Important if you previously extracted the uncommitted v3 test package
Safest workflow:
1. `git stash push -u -m "local-v3-design-test"`
2. Extract this v4 ZIP over the clean project.
3. Run `git status`.

This preserves the old local v3 experiment in Git stash rather than deleting it.
