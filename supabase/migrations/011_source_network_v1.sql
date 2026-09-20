-- Aura Digital Intelligence — Source Network v1
-- Adds source health monitoring, staggered scan scheduling and a curated source network.

alter table public.sources
  add column if not exists health_status text not null default 'unknown',
  add column if not exists last_success_at timestamptz,
  add column if not exists last_failure_at timestamptz,
  add column if not exists consecutive_failures integer not null default 0,
  add column if not exists total_checks integer not null default 0,
  add column if not exists total_successes integer not null default 0,
  add column if not exists total_failures integer not null default 0,
  add column if not exists last_error text,
  add column if not exists last_item_count integer not null default 0,
  add column if not exists last_discovered_count integer not null default 0,
  add column if not exists last_duplicate_count integer not null default 0,
  add column if not exists check_interval_minutes integer not null default 60,
  add column if not exists next_check_at timestamptz,
  add column if not exists auto_disable_on_failure boolean not null default true,
  add column if not exists auto_disabled_at timestamptz;

create index if not exists sources_discovery_schedule_idx
  on public.sources(active, next_check_at, trust_score desc);

insert into public.settings (key, value, updated_at) values
  ('discovery_sources_per_run', '6'::jsonb, now()),
  ('discovery_items_per_source', '30'::jsonb, now()),
  ('discovery_max_story_age_days', '14'::jsonb, now()),
  ('source_auto_disable_failures', '5'::jsonb, now())
on conflict (key) do update set value = excluded.value, updated_at = now();

insert into public.sources
  (name, url, feed_url, source_type, category, country, trust_score, active, check_interval_minutes, auto_disable_on_failure)
values
  ('TechCrunch', 'https://techcrunch.com/', 'https://techcrunch.com/feed/', 'publication', 'Technology', 'US / Global', 88, true, 60, true),
  ('The Verge', 'https://www.theverge.com/', 'https://www.theverge.com/rss/index.xml', 'publication', 'Technology', 'US / Global', 86, true, 60, true),
  ('Ars Technica', 'https://arstechnica.com/', 'https://feeds.arstechnica.com/arstechnica/index', 'publication', 'Technology', 'US / Global', 89, true, 60, true),
  ('WIRED', 'https://www.wired.com/', 'https://www.wired.com/feed/rss', 'publication', 'Technology', 'US / Global', 86, true, 90, true),
  ('MIT Technology Review', 'https://www.technologyreview.com/', 'https://www.technologyreview.com/feed/', 'publication', 'AI', 'US / Global', 91, true, 90, true),
  ('VentureBeat', 'https://venturebeat.com/', 'https://venturebeat.com/feed/', 'publication', 'AI', 'US / Global', 84, true, 90, true),
  ('Cloudflare Blog', 'https://blog.cloudflare.com/', 'https://blog.cloudflare.com/rss/', 'company', 'Cloud', 'Global', 96, true, 60, true),
  ('GitHub Blog', 'https://github.blog/', 'https://github.blog/feed/', 'company', 'Web Development', 'Global', 95, true, 90, true),
  ('GitHub Changelog', 'https://github.blog/changelog/', 'https://github.blog/changelog/feed/', 'company', 'Web Development', 'Global', 96, true, 60, true),
  ('Google AI Blog', 'https://blog.google/technology/ai/', 'https://blog.google/technology/ai/rss/', 'company', 'AI', 'Global', 96, true, 90, true),
  ('Google Developers Blog', 'https://developers.googleblog.com/', 'https://developers.googleblog.com/feeds/posts/default', 'company', 'Web Development', 'Global', 95, true, 90, true),
  ('Google Security Blog', 'https://security.googleblog.com/', 'https://security.googleblog.com/feeds/posts/default', 'company', 'Cybersecurity', 'Global', 97, true, 90, true),
  ('Microsoft Security Blog', 'https://www.microsoft.com/en-us/security/blog/', 'https://www.microsoft.com/en-us/security/blog/feed/', 'company', 'Cybersecurity', 'Global', 96, true, 90, true),
  ('AWS What''s New', 'https://aws.amazon.com/about-aws/whats-new/', 'https://aws.amazon.com/about-aws/whats-new/recent/feed/', 'company', 'Cloud', 'Global', 95, true, 60, true),
  ('AWS Security Blog', 'https://aws.amazon.com/blogs/security/', 'https://aws.amazon.com/blogs/security/feed/', 'company', 'Cybersecurity', 'Global', 96, true, 90, true),
  ('CISA Cybersecurity Advisories', 'https://www.cisa.gov/news-events/cybersecurity-advisories', 'https://www.cisa.gov/cybersecurity-advisories/all.xml', 'government', 'Cybersecurity', 'US', 99, true, 60, true),
  ('Australian Cyber Security Centre', 'https://www.cyber.gov.au/', 'https://www.cyber.gov.au/rss/advisories', 'government', 'Cybersecurity', 'Australia', 98, true, 90, true),
  ('BleepingComputer', 'https://www.bleepingcomputer.com/', 'https://www.bleepingcomputer.com/feed/', 'publication', 'Cybersecurity', 'US / Global', 89, true, 60, true),
  ('Krebs on Security', 'https://krebsonsecurity.com/', 'https://krebsonsecurity.com/feed/', 'publication', 'Cybersecurity', 'US / Global', 91, true, 120, true),
  ('SecurityWeek', 'https://www.securityweek.com/', 'https://www.securityweek.com/feed/', 'publication', 'Cybersecurity', 'US / Global', 88, true, 90, true),
  ('Dark Reading', 'https://www.darkreading.com/', 'https://www.darkreading.com/rss.xml', 'publication', 'Cybersecurity', 'US / Global', 87, true, 90, true),
  ('Mozilla Hacks', 'https://hacks.mozilla.org/', 'https://hacks.mozilla.org/feed/', 'company', 'Web Development', 'Global', 93, true, 180, true),
  ('web.dev', 'https://web.dev/', 'https://web.dev/feed.xml', 'company', 'Web Development', 'Global', 94, true, 180, true),
  ('FBC News', 'https://www.fbcnews.com.fj/', 'https://www.fbcnews.com.fj/feed', 'publication', 'Fiji & Pacific', 'Fiji', 86, true, 60, true),
  ('The Fiji Times', 'https://www.fijitimes.com.fj/', 'https://www.fijitimes.com.fj/feed', 'publication', 'Fiji & Pacific', 'Fiji', 88, true, 60, true),
  ('Islands Business', 'https://islandsbusiness.com/', 'https://islandsbusiness.com/category/islands-business/news-break/feed/gn', 'publication', 'Fiji & Pacific', 'Fiji / Pacific', 88, true, 90, true),
  ('RNZ Pacific', 'https://www.rnz.co.nz/news/pacific', 'https://www.rnz.co.nz/rss/pacific.xml', 'publication', 'Fiji & Pacific', 'New Zealand / Pacific', 91, true, 60, true),
  ('ABC News', 'https://www.abc.net.au/news/', 'https://www.abc.net.au/news/feed/45910/rss.xml', 'publication', 'Fiji & Pacific', 'Australia / Pacific', 90, true, 90, true)
on conflict (feed_url) where feed_url is not null do update set
  name = excluded.name,
  url = excluded.url,
  source_type = excluded.source_type,
  category = excluded.category,
  country = excluded.country,
  trust_score = excluded.trust_score,
  check_interval_minutes = excluded.check_interval_minutes,
  auto_disable_on_failure = excluded.auto_disable_on_failure;

-- Spread first-time scans across the next hour instead of hitting every new source at once.
with ranked as (
  select id, row_number() over (order by trust_score desc, name asc) as rn
  from public.sources
  where active = true and next_check_at is null
)
update public.sources s
set next_check_at = now() + ((ranked.rn - 1) % 4) * interval '15 minutes'
from ranked
where s.id = ranked.id;
