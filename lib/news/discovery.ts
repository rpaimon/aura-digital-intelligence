import { createAdminClient } from "@/lib/supabase/admin";
import { canonicalizeUrl, contentHash, parseFeed, titleFingerprint } from "@/lib/news/rss";

type Source = {
  id: string;
  name: string;
  feed_url: string | null;
  category: string | null;
  country: string | null;
  trust_score: number;
};

type SourceResult = {
  sourceId: string;
  sourceName: string;
  checked: boolean;
  discovered: number;
  duplicates: number;
  skipped: number;
  error?: string;
};

async function fetchFeed(feedUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent": "AuraDigitalIntelligence/1.0 (+https://auradigitalfiji.com)",
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      },
      cache: "no-store",
      signal: controller.signal,
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

async function processSource(source: Source): Promise<SourceResult> {
  const supabase = createAdminClient();
  const result: SourceResult = {
    sourceId: source.id,
    sourceName: source.name,
    checked: false,
    discovered: 0,
    duplicates: 0,
    skipped: 0,
  };

  if (!source.feed_url) {
    result.error = "No feed URL";
    return result;
  }

  try {
    const xml = await fetchFeed(source.feed_url);
    const items = parseFeed(xml).slice(0, 75);
    result.checked = true;

    for (const item of items) {
      const canonical = canonicalizeUrl(item.url);
      const hash = contentHash(item.title, item.description);
      const cluster = titleFingerprint(item.title);

      const { data: sourceUrlExisting, error: sourceUrlError } = await supabase
        .from("stories")
        .select("id")
        .eq("source_url", canonical)
        .limit(1);

      if (sourceUrlError) throw sourceUrlError;
      if (sourceUrlExisting?.length) {
        result.skipped += 1;
        continue;
      }

      const { data: canonicalExisting, error: canonicalError } = await supabase
        .from("stories")
        .select("id")
        .eq("canonical_url", canonical)
        .limit(1);

      if (canonicalError) throw canonicalError;
      if (canonicalExisting?.length) {
        result.skipped += 1;
        continue;
      }

      const { data: duplicateExisting, error: duplicateError } = await supabase
        .from("stories")
        .select("id")
        .or(`content_hash.eq.${hash},cluster_key.eq.${cluster}`)
        .limit(1);

      if (duplicateError) throw duplicateError;
      const isDuplicate = Boolean(duplicateExisting?.length);

      const { error: insertError } = await supabase.from("stories").insert({
        source_id: source.id,
        source_url: canonical,
        canonical_url: canonical,
        title: item.title,
        description: item.description,
        published_at: item.publishedAt,
        category: source.category,
        content_hash: hash,
        cluster_key: cluster,
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

      if (isDuplicate) result.duplicates += 1;
      else result.discovered += 1;
    }

    await supabase
      .from("sources")
      .update({ last_checked_at: new Date().toISOString() })
      .eq("id", source.id);

    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : "Unknown discovery error";
    return result;
  }
}

export async function runDiscovery() {
  const supabase = createAdminClient();
  const startedAt = new Date().toISOString();

  const { data: sources, error } = await supabase
    .from("sources")
    .select("id,name,feed_url,category,country,trust_score")
    .eq("active", true)
    .not("feed_url", "is", null)
    .order("trust_score", { ascending: false });

  if (error) throw error;

  const results: SourceResult[] = [];
  // Sequential processing keeps network/database pressure predictable.
  for (const source of (sources ?? []) as Source[]) {
    results.push(await processSource(source));
  }

  const totals = results.reduce(
    (acc, item) => {
      acc.discovered += item.discovered;
      acc.duplicates += item.duplicates;
      acc.skipped += item.skipped;
      if (item.error) acc.failedSources += 1;
      return acc;
    },
    { discovered: 0, duplicates: 0, skipped: 0, failedSources: 0 }
  );

  const finishedAt = new Date().toISOString();
  await supabase.from("jobs").insert({
    job_type: "rss_discovery",
    status: totals.failedSources === results.length && results.length > 0 ? "failed" : "completed",
    priority: 80,
    attempts: 1,
    payload: { activeSources: results.length, startedAt },
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
    ...totals,
    sources: results,
  };
}
