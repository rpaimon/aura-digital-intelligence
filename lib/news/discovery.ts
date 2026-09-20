import { createAdminClient } from "@/lib/supabase/admin";
import { canonicalizeUrl, contentHash, parseFeed, titleFingerprint } from "@/lib/news/rss";

type Source = {
  id: string;
  name: string;
  feed_url: string | null;
  category: string | null;
  country: string | null;
  trust_score: number;
  active?: boolean;
  health_status?: string | null;
  consecutive_failures?: number | null;
  total_checks?: number | null;
  total_successes?: number | null;
  total_failures?: number | null;
  check_interval_minutes?: number | null;
  next_check_at?: string | null;
  auto_disable_on_failure?: boolean | null;
};

type DiscoverySettings = {
  sourcesPerRun: number;
  itemsPerSource: number;
  maxStoryAgeDays: number;
  autoDisableFailures: number;
};

type SourceResult = {
  sourceId: string;
  sourceName: string;
  checked: boolean;
  health: string;
  discovered: number;
  duplicates: number;
  skipped: number;
  items: number;
  autoDisabled?: boolean;
  nextCheckAt?: string;
  error?: string;
};

function safeNumber(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function getDiscoverySettings(): Promise<DiscoverySettings> {
  const supabase = createAdminClient();
  const defaults: DiscoverySettings = {
    sourcesPerRun: 6,
    itemsPerSource: 30,
    maxStoryAgeDays: 14,
    autoDisableFailures: 5,
  };

  const { data, error } = await supabase
    .from("settings")
    .select("key,value")
    .in("key", [
      "discovery_sources_per_run",
      "discovery_items_per_source",
      "discovery_max_story_age_days",
      "source_auto_disable_failures",
    ]);

  if (error || !data) return defaults;
  const map = Object.fromEntries(data.map((row: { key: string; value: unknown }) => [row.key, row.value]));

  return {
    sourcesPerRun: Math.max(1, Math.min(10, safeNumber(map.discovery_sources_per_run, defaults.sourcesPerRun))),
    itemsPerSource: Math.max(5, Math.min(50, safeNumber(map.discovery_items_per_source, defaults.itemsPerSource))),
    maxStoryAgeDays: Math.max(1, Math.min(45, safeNumber(map.discovery_max_story_age_days, defaults.maxStoryAgeDays))),
    autoDisableFailures: Math.max(2, Math.min(10, safeNumber(map.source_auto_disable_failures, defaults.autoDisableFailures))),
  };
}

async function fetchFeed(feedUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent": "AuraDigitalIntelligence/1.1 (+https://auradigitalfiji.com)",
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      },
      cache: "no-store",
      signal: controller.signal,
      redirect: "follow",
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    if (!/<rss(?:\s|>)|<feed(?:\s|>)|<rdf:RDF(?:\s|>)/i.test(text)) {
      throw new Error("Response is not an RSS/Atom feed");
    }
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

function nextCheckIso(minutes: number, multiplier = 1) {
  const safeMinutes = Math.max(15, Math.min(1440, minutes));
  return new Date(Date.now() + safeMinutes * multiplier * 60_000).toISOString();
}

async function updateSourceHealth(sourceId: string, payload: Record<string, unknown>, fallbackCheckedAt = true) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("sources").update(payload).eq("id", sourceId);

  // Backward-compatible during the short deployment window before migration 011.
  if (error && fallbackCheckedAt) {
    await supabase
      .from("sources")
      .update({ last_checked_at: new Date().toISOString() })
      .eq("id", sourceId);
  }
}

async function processSource(source: Source, settings: DiscoverySettings): Promise<SourceResult> {
  const supabase = createAdminClient();
  const result: SourceResult = {
    sourceId: source.id,
    sourceName: source.name,
    checked: false,
    health: source.health_status || "unknown",
    discovered: 0,
    duplicates: 0,
    skipped: 0,
    items: 0,
  };

  const interval = Math.max(15, safeNumber(source.check_interval_minutes, 60));

  if (!source.feed_url) {
    result.error = "No feed URL";
    result.health = "failing";
    return result;
  }

  try {
    const xml = await fetchFeed(source.feed_url);
    const parsed = parseFeed(xml).slice(0, settings.itemsPerSource);
    const cutoff = Date.now() - settings.maxStoryAgeDays * 86_400_000;
    const items = parsed.filter((item) => !item.publishedAt || Date.parse(item.publishedAt) >= cutoff);
    result.items = items.length;
    result.checked = true;

    const prepared = items.map((item) => ({
      ...item,
      canonical: canonicalizeUrl(item.url),
      hash: contentHash(item.title, item.description),
      cluster: titleFingerprint(item.title),
    }));

    const canonicals = [...new Set(prepared.map((item) => item.canonical))];
    const hashes = [...new Set(prepared.map((item) => item.hash))];
    const clusters = [...new Set(prepared.map((item) => item.cluster))];

    const [sourceUrlQuery, canonicalQuery, hashQuery, clusterQuery] = await Promise.all([
      canonicals.length
        ? supabase.from("stories").select("source_url").in("source_url", canonicals)
        : Promise.resolve({ data: [], error: null }),
      canonicals.length
        ? supabase.from("stories").select("canonical_url").in("canonical_url", canonicals)
        : Promise.resolve({ data: [], error: null }),
      hashes.length
        ? supabase.from("stories").select("content_hash").in("content_hash", hashes)
        : Promise.resolve({ data: [], error: null }),
      clusters.length
        ? supabase.from("stories").select("cluster_key").in("cluster_key", clusters)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const lookupError = sourceUrlQuery.error || canonicalQuery.error || hashQuery.error || clusterQuery.error;
    if (lookupError) throw lookupError;

    const existingUrls = new Set((sourceUrlQuery.data ?? []).map((row: { source_url: string | null }) => row.source_url).filter(Boolean));
    const existingCanonicals = new Set((canonicalQuery.data ?? []).map((row: { canonical_url: string | null }) => row.canonical_url).filter(Boolean));
    const existingHashes = new Set((hashQuery.data ?? []).map((row: { content_hash: string | null }) => row.content_hash).filter(Boolean));
    const existingClusters = new Set((clusterQuery.data ?? []).map((row: { cluster_key: string | null }) => row.cluster_key).filter(Boolean));

    for (const item of prepared) {
      if (existingUrls.has(item.canonical) || existingCanonicals.has(item.canonical)) {
        result.skipped += 1;
        continue;
      }

      const isDuplicate = existingHashes.has(item.hash) || existingClusters.has(item.cluster);
      const { error: insertError } = await supabase.from("stories").insert({
        source_id: source.id,
        source_url: item.canonical,
        canonical_url: item.canonical,
        title: item.title,
        description: item.description,
        published_at: item.publishedAt,
        category: source.category,
        content_hash: item.hash,
        cluster_key: item.cluster,
        duplicate_score: isDuplicate ? 100 : 0,
        status: isDuplicate ? "duplicate" : "discovered",
      });

      if (insertError) {
        if (insertError.code === "23505") {
          result.skipped += 1;
          continue;
        }
        throw insertError;
      }

      existingUrls.add(item.canonical);
      existingCanonicals.add(item.canonical);
      existingHashes.add(item.hash);
      existingClusters.add(item.cluster);

      if (isDuplicate) result.duplicates += 1;
      else result.discovered += 1;
    }

    const now = new Date().toISOString();
    const nextCheckAt = nextCheckIso(interval);
    result.health = "healthy";
    result.nextCheckAt = nextCheckAt;

    await updateSourceHealth(source.id, {
      last_checked_at: now,
      last_success_at: now,
      health_status: "healthy",
      consecutive_failures: 0,
      total_checks: safeNumber(source.total_checks, 0) + 1,
      total_successes: safeNumber(source.total_successes, 0) + 1,
      last_error: null,
      last_item_count: result.items,
      last_discovered_count: result.discovered,
      last_duplicate_count: result.duplicates,
      next_check_at: nextCheckAt,
      auto_disabled_at: null,
    });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown discovery error";
    const failures = safeNumber(source.consecutive_failures, 0) + 1;
    const shouldDisable = source.auto_disable_on_failure !== false && failures >= settings.autoDisableFailures;
    const multiplier = Math.min(8, 2 ** Math.min(failures, 3));
    const nextCheckAt = nextCheckIso(interval, multiplier);
    const now = new Date().toISOString();

    result.error = message;
    result.health = shouldDisable ? "disabled" : failures >= 3 ? "failing" : "warning";
    result.autoDisabled = shouldDisable;
    result.nextCheckAt = nextCheckAt;

    await updateSourceHealth(source.id, {
      last_checked_at: now,
      last_failure_at: now,
      health_status: result.health,
      consecutive_failures: failures,
      total_checks: safeNumber(source.total_checks, 0) + 1,
      total_failures: safeNumber(source.total_failures, 0) + 1,
      last_error: message.slice(0, 800),
      last_item_count: 0,
      last_discovered_count: 0,
      last_duplicate_count: 0,
      next_check_at: nextCheckAt,
      ...(shouldDisable ? { active: false, auto_disabled_at: now } : {}),
    });

    return result;
  }
}

export async function runDiscovery() {
  const supabase = createAdminClient();
  const startedAt = new Date().toISOString();
  const settings = await getDiscoverySettings();

  const { data: rawSources, error } = await supabase
    .from("sources")
    .select("*")
    .eq("active", true)
    .not("feed_url", "is", null)
    .order("trust_score", { ascending: false });

  if (error) throw error;

  const nowMs = Date.now();
  const dueSources = ((rawSources ?? []) as Source[])
    .filter((source) => !source.next_check_at || Date.parse(source.next_check_at) <= nowMs)
    .sort((a, b) => {
      const aDue = a.next_check_at ? Date.parse(a.next_check_at) : 0;
      const bDue = b.next_check_at ? Date.parse(b.next_check_at) : 0;
      if (aDue !== bDue) return aDue - bDue;
      return (b.trust_score ?? 0) - (a.trust_score ?? 0);
    })
    .slice(0, settings.sourcesPerRun);

  // Small parallel batches keep the 15-minute scout fast without hammering publishers.
  const results: SourceResult[] = [];
  const concurrency = 3;
  for (let i = 0; i < dueSources.length; i += concurrency) {
    const batch = dueSources.slice(i, i + concurrency);
    results.push(...(await Promise.all(batch.map((source) => processSource(source, settings)))));
  }

  const totals = results.reduce(
    (acc, item) => {
      acc.discovered += item.discovered;
      acc.duplicates += item.duplicates;
      acc.skipped += item.skipped;
      if (item.error) acc.failedSources += 1;
      if (item.autoDisabled) acc.autoDisabled += 1;
      return acc;
    },
    { discovered: 0, duplicates: 0, skipped: 0, failedSources: 0, autoDisabled: 0 }
  );

  const finishedAt = new Date().toISOString();
  await supabase.from("jobs").insert({
    job_type: "rss_discovery",
    status: totals.failedSources === results.length && results.length > 0 ? "failed" : "completed",
    priority: 80,
    attempts: 1,
    payload: {
      dueSources: dueSources.length,
      totalActiveSources: (rawSources ?? []).length,
      settings,
      startedAt,
    },
    result: { ...totals, sources: results, finishedAt },
    error_message: totals.failedSources ? `${totals.failedSources} source(s) failed` : null,
    started_at: startedAt,
    finished_at: finishedAt,
  });

  return {
    ok: true,
    startedAt,
    finishedAt,
    sourceCount: results.length,
    totalActiveSources: (rawSources ?? []).length,
    dueSourceCount: dueSources.length,
    ...totals,
    sourceNetwork: {
      sourcesPerRun: settings.sourcesPerRun,
      itemsPerSource: settings.itemsPerSource,
      maxStoryAgeDays: settings.maxStoryAgeDays,
      autoDisableFailures: settings.autoDisableFailures,
    },
    sources: results,
  };
}
