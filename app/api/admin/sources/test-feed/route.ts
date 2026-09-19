import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function countFeedItems(xml: string) {
  const rssItems = xml.match(/<item(?:\s|>)/gi)?.length ?? 0;
  const atomEntries = xml.match(/<entry(?:\s|>)/gi)?.length ?? 0;
  return Math.max(rssItems, atomEntries);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  let feedUrl = "";
  try {
    const body = await request.json();
    feedUrl = typeof body.feedUrl === "string" ? body.feedUrl.trim() : "";
    const parsed = new URL(feedUrl);
    if (!/^https?:$/.test(parsed.protocol)) throw new Error("Unsupported protocol");
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid feed URL" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent": "AuraDigitalIntelligence/1.0 (+https://auradigitalfiji.com)",
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, message: `Feed returned HTTP ${response.status}` },
        { status: 400 }
      );
    }

    const text = await response.text();
    const looksLikeFeed = /<rss(?:\s|>)|<feed(?:\s|>)|<rdf:RDF(?:\s|>)/i.test(text);
    if (!looksLikeFeed) {
      return NextResponse.json(
        { ok: false, message: "URL responded, but it does not look like an RSS/Atom feed" },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, itemCount: countFeedItems(text) });
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError"
      ? "Feed request timed out"
      : "Could not reach this feed";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
