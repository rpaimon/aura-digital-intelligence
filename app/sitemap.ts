import type { MetadataRoute } from "next";
import { getPublishedArticles, siteUrl } from "@/lib/news/public";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const articles = await getPublishedArticles(1000);
  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/news`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    ...articles.map((article) => ({
      url: `${base}/news/${article.slug}`,
      lastModified: new Date(article.updated_at || article.published_at || article.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
