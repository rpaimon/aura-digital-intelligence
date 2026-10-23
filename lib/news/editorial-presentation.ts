import type { PublicArticle } from "./public";

/** Display-only editor overrides. Never changes the original article title or URL. */
export function readerHeadline(article: Pick<PublicArticle, "title" | "display_headline">): string {
  const custom = String(article.display_headline || "").trim();
  if (custom) return custom;
  const original = String(article.title || "");
  if (/Ahold Delhaize Restores European Sites After Cyberattack/i.test(original)) {
    return "Ahold Delhaize Restores European Websites After Cyberattack";
  }
  if (/Major Browsers Block Compromised eMudhra Certificates/i.test(original)) {
    return "Web Browsers Block Compromised eMudhra Security Certificates";
  }
  return original
    .replace(/^(?:Fiji Brief|Fiji Briefing)\s*[—–:-]\s*/i, "")
    .replace(/^[Ff]iji:\s+(?=(?:Major |Global |European |US |Tech |Browsers ))/, "")
    .replace(/\s*[–—-]\s*Implications for\s*[’']?s\s*$/i, "")
    .trim();
}

export function editorialPhotoKey(imageUrl: string | null | undefined): string {
  if (!imageUrl) return "";
  try { const u = new URL(imageUrl); return `${u.hostname}${u.pathname}`.toLowerCase(); }
  catch { return imageUrl.trim().toLowerCase(); }
}

/** When identical source images occur, keep the latest and show a unique visual for older stories. */
export function deduplicateVisiblePhotos<T extends {featured_image_url: string | null}>(items: T[]): T[] {
  const used = new Set<string>();
  return items.map((a) => {
    const key = editorialPhotoKey(a.featured_image_url);
    if (!key) return a;
    if (used.has(key)) return {...a, featured_image_url: null};
    used.add(key);
    return a;
  });
}
