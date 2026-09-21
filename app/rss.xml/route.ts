import { articlePath, getPublishedArticles, siteUrl } from "@/lib/news/public";

function esc(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export async function GET() {
  const articles = await getPublishedArticles(50);
  const base = siteUrl();
  const items = articles.map((a) => `\n<item>\n<title>${esc(a.title)}</title>\n<link>${base}${articlePath(a)}</link>\n<guid isPermaLink="true">${base}${articlePath(a)}</guid>\n<pubDate>${new Date(a.published_at || a.created_at).toUTCString()}</pubDate>\n<description>${esc(a.excerpt || "Verified technology intelligence from Aura Digital Intelligence.")}</description>\n${a.category ? `<category>${esc(a.category)}</category>` : ""}\n</item>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>Aura Digital Intelligence</title><link>${base}</link><description>Technology news and business intelligence for Fiji and the Pacific.</description><language>en-FJ</language>${items}\n</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=900" } });
}
