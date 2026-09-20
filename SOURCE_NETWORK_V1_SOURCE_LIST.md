# Source Network v1 — Curated feeds

The network deliberately mixes primary/official publishers with independent technology media and Fiji/Pacific reporting. Trust scores are inputs to prioritisation, not guarantees that every story is correct; the downstream multi-source fact-check gate still applies.

| Source | Category | Trust | Feed |
|---|---|---:|---|
| TechCrunch | Technology | 88 | https://techcrunch.com/feed/ |
| The Verge | Technology | 86 | https://www.theverge.com/rss/index.xml |
| Ars Technica | Technology | 89 | https://feeds.arstechnica.com/arstechnica/index |
| WIRED | Technology | 86 | https://www.wired.com/feed/rss |
| MIT Technology Review | AI | 91 | https://www.technologyreview.com/feed/ |
| VentureBeat | AI | 84 | https://venturebeat.com/feed/ |
| Cloudflare Blog | Cloud | 96 | https://blog.cloudflare.com/rss/ |
| GitHub Blog | Web Development | 95 | https://github.blog/feed/ |
| GitHub Changelog | Web Development | 96 | https://github.blog/changelog/feed/ |
| Google AI Blog | AI | 96 | https://blog.google/technology/ai/rss/ |
| Google Developers Blog | Web Development | 95 | https://developers.googleblog.com/feeds/posts/default |
| Google Security Blog | Cybersecurity | 97 | https://security.googleblog.com/feeds/posts/default |
| Microsoft Security Blog | Cybersecurity | 96 | https://www.microsoft.com/en-us/security/blog/feed/ |
| AWS What's New | Cloud | 95 | https://aws.amazon.com/about-aws/whats-new/recent/feed/ |
| AWS Security Blog | Cybersecurity | 96 | https://aws.amazon.com/blogs/security/feed/ |
| CISA Cybersecurity Advisories | Cybersecurity | 99 | https://www.cisa.gov/cybersecurity-advisories/all.xml |
| Australian Cyber Security Centre | Cybersecurity | 98 | https://www.cyber.gov.au/rss/advisories |
| BleepingComputer | Cybersecurity | 89 | https://www.bleepingcomputer.com/feed/ |
| Krebs on Security | Cybersecurity | 91 | https://krebsonsecurity.com/feed/ |
| SecurityWeek | Cybersecurity | 88 | https://www.securityweek.com/feed/ |
| Dark Reading | Cybersecurity | 87 | https://www.darkreading.com/rss.xml |
| Mozilla Hacks | Web Development | 93 | https://hacks.mozilla.org/feed/ |
| web.dev | Web Development | 94 | https://web.dev/feed.xml |
| FBC News | Fiji & Pacific | 86 | https://www.fbcnews.com.fj/feed |
| The Fiji Times | Fiji & Pacific | 88 | https://www.fijitimes.com.fj/feed |
| Islands Business | Fiji & Pacific | 88 | https://islandsbusiness.com/category/islands-business/news-break/feed/gn |
| RNZ Pacific | Fiji & Pacific | 91 | https://www.rnz.co.nz/rss/pacific.xml |
| ABC News | Fiji & Pacific | 90 | https://www.abc.net.au/news/feed/45910/rss.xml |

## Operational note

Some publishers periodically rate-limit bots or alter feed URLs. Source Network v1 treats that as an operational condition rather than a newsroom failure: repeated errors trigger backoff, appear in `/admin/sources`, and can auto-disable the broken feed after the configured threshold. One bad publisher therefore cannot block the rest of the pipeline.
