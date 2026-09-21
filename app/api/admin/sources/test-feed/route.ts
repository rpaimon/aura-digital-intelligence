import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_REDIRECTS = 3;
const MAX_FEED_BYTES = 2 * 1024 * 1024;

function countFeedItems(xml: string) {
  const rssItems = xml.match(/<item(?:\s|>)/gi)?.length ?? 0;
  const atomEntries = xml.match(/<entry(?:\s|>)/gi)?.length ?? 0;
  return Math.max(rssItems, atomEntries);
}

function isPrivateIPv4(ip: string) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a >= 224
  );
}

function isPrivateIPv6(ip: string) {
  const normalized = ip.toLowerCase().split("%")[0];
  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) return true;
  if (normalized.startsWith("::ffff:")) {
    const mapped = normalized.slice("::ffff:".length);
    if (isIP(mapped) === 4) return isPrivateIPv4(mapped);
  }
  return false;
}

function isUnsafeIp(ip: string) {
  const version = isIP(ip);
  if (version === 4) return isPrivateIPv4(ip);
  if (version === 6) return isPrivateIPv6(ip);
  return true;
}

async function assertSafeHttpUrl(raw: string) {
  const parsed = new URL(raw);
  if (!/^https?:$/.test(parsed.protocol)) throw new Error("Unsupported protocol");
  if (parsed.username || parsed.password) throw new Error("Credentials in URLs are not allowed");
  if (parsed.port && !["80", "443"].includes(parsed.port)) throw new Error("Only standard HTTP/HTTPS ports are allowed");

  const hostname = parsed.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new Error("Local network addresses are not allowed");
  }

  if (isIP(hostname)) {
    if (isUnsafeIp(hostname)) throw new Error("Private network addresses are not allowed");
  } else {
    const addresses = await lookup(hostname, { all: true, verbatim: true });
    if (!addresses.length || addresses.some(({ address }) => isUnsafeIp(address))) {
      throw new Error("Feed host resolves to a private or unsafe address");
    }
  }

  return parsed;
}

async function readTextLimited(response: Response) {
  const declared = Number(response.headers.get("content-length") || 0);
  if (declared > MAX_FEED_BYTES) throw new Error("Feed response is too large");
  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > MAX_FEED_BYTES) {
      await reader.cancel();
      throw new Error("Feed response is too large");
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}

async function fetchFeedSafely(initialUrl: string) {
  let current = await assertSafeHttpUrl(initialUrl);

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let response: Response;
    try {
      response = await fetch(current, {
        headers: {
          "User-Agent": "AuraDigitalIntelligence/1.0 (+https://auradigitalfiji.com)",
          Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
        },
        cache: "no-store",
        redirect: "manual",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      if (redirect === MAX_REDIRECTS) throw new Error("Feed redirected too many times");
      const location = response.headers.get("location");
      if (!location) throw new Error("Feed returned an invalid redirect");
      current = await assertSafeHttpUrl(new URL(location, current).toString());
      continue;
    }

    return { response, finalUrl: current.toString() };
  }

  throw new Error("Feed could not be reached safely");
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_newsroom_admin");
  if (adminError || isAdmin !== true) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  let feedUrl = "";
  try {
    const body = await request.json();
    feedUrl = typeof body.feedUrl === "string" ? body.feedUrl.trim() : "";
    if (!feedUrl) throw new Error("Missing feed URL");
    await assertSafeHttpUrl(feedUrl);
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid or unsafe feed URL" }, { status: 400 });
  }

  try {
    const { response, finalUrl } = await fetchFeedSafely(feedUrl);
    if (!response.ok) {
      return NextResponse.json(
        { ok: false, message: `Feed returned HTTP ${response.status}` },
        { status: 400 }
      );
    }

    const text = await readTextLimited(response);
    const looksLikeFeed = /<rss(?:\s|>)|<feed(?:\s|>)|<rdf:RDF(?:\s|>)/i.test(text);
    if (!looksLikeFeed) {
      return NextResponse.json(
        { ok: false, message: "URL responded, but it does not look like an RSS/Atom feed" },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, itemCount: countFeedItems(text), finalUrl });
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError"
      ? "Feed request timed out"
      : error instanceof Error
        ? error.message
        : "Could not reach this feed";
    return NextResponse.json({ ok: false, message: message.slice(0, 180) }, { status: 400 });
  }
}
