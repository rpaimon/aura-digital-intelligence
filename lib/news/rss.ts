import { createHash } from "node:crypto";

export type ParsedFeedItem = {
  title: string;
  url: string;
  description: string | null;
  publishedAt: string | null;
};

function fixMojibake(value: string) {
  if (!/[ÃÂâ]/.test(value)) return value;

  try {
    return decodeURIComponent(
      Array.from(value)
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    );
  } catch {
    return value;
  }
}

function decodeEntities(value: string) {
  const decoded = value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, num) =>
      String.fromCharCode(Number(num))
    );

  return fixMojibake(decoded);
}

function stripHtml(value: string) {
  return decodeEntities(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block: string, names: string[]) {
  for (const name of names) {
    const escaped = name.replace(":", "\\:");
    const match = block.match(new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, "i"));
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

function attrLink(block: string) {
  const alternate = block.match(/<link\b[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  if (alternate?.[1]) return alternate[1].trim();
  const href = block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/i);
  return href?.[1]?.trim() ?? "";
}

function parseDate(value: string) {
  if (!value) return null;
  const date = new Date(stripHtml(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function canonicalizeUrl(input: string) {
  const url = new URL(decodeEntities(input.trim()));
  url.hash = "";

  const removable = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "utm_id",
    "gclid",
    "fbclid",
    "mc_cid",
    "mc_eid",
  ];
  removable.forEach((key) => url.searchParams.delete(key));

  url.hostname = url.hostname.toLowerCase();
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "");
  url.searchParams.sort();
  return url.toString();
}

export function titleFingerprint(title: string) {
  const normalized = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(the|a|an|and|or|to|of|for|in|on|with|is|are|at|by|from)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 14)
    .join(" ");

  return createHash("sha256").update(normalized).digest("hex").slice(0, 24);
}

export function contentHash(title: string, description: string | null) {
  const normalized = `${title}\n${description ?? ""}`.toLowerCase().replace(/\s+/g, " ").trim();
  return createHash("sha256").update(normalized).digest("hex");
}

export function parseFeed(xml: string): ParsedFeedItem[] {
  const rssBlocks = xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) ?? [];
  const atomBlocks = xml.match(/<entry(?:\s[^>]*)?>[\s\S]*?<\/entry>/gi) ?? [];
  const blocks = rssBlocks.length ? rssBlocks : atomBlocks;

  const items: ParsedFeedItem[] = [];
  for (const block of blocks) {
    const titleRaw = tag(block, ["title"]);
    const title = stripHtml(titleRaw);
    const linkText = stripHtml(tag(block, ["link"]));
    const urlRaw = linkText || attrLink(block) || stripHtml(tag(block, ["guid", "id"]));

    if (!title || !urlRaw) continue;

    let url: string;
    try {
      url = canonicalizeUrl(urlRaw);
    } catch {
      continue;
    }

    const descriptionRaw = tag(block, ["description", "summary", "content:encoded", "content"]);
    const description = descriptionRaw ? stripHtml(descriptionRaw).slice(0, 4000) : null;
    const publishedAt = parseDate(tag(block, ["pubDate", "published", "updated", "dc:date"]));

    items.push({ title: title.slice(0, 700), url, description, publishedAt });
  }

  return items;
}
