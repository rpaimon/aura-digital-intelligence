import { articlePath, getPublishedArticles, siteUrl } from "@/lib/news/public";

export const dynamic = "force-dynamic";

function xml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;");
}

export async function GET() {
  if (process.env.NEXT_PUBLIC_PUBLIC_INDEXING_ENABLED === "false") {
    return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300" },
    });
  }

  const cutoff = Date.now() - 2 * 24 * 60 * 60 * 1000;
  const articles = (await getPublishedArticles(200)).filter((article) => {
    const time = article.published_at ? new Date(article.published_at).getTime() : 0;
    return time >= cutoff;
  });
  const base = siteUrl();
  const urls = articles.map((article) => `
  <url>
    <loc>${xml(`${base}${articlePath(article)}`)}</loc>
    <news:news>
      <news:publication>
        <news:name>Aura Digital Intelligence</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${xml(article.published_at || article.created_at)}</news:publication_date>
      <news:title>${xml(article.title)}</news:title>
    </news:news>
  </url>`).join("");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${urls}
</urlset>`;
  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300, s-maxage=300" },
  });
}
