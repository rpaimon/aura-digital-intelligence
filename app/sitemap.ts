import type { MetadataRoute } from "next";
import { articlePath, getPublishedArticles, siteUrl, TOPIC_HUBS } from "@/lib/news/public";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (process.env.NEXT_PUBLIC_PUBLIC_INDEXING_ENABLED === "false") return [];
  const base = siteUrl();
  const articles = await getPublishedArticles(1000);
  const staticPages = [
    "",
    "/news",
    "/about",
    "/categories",
    "/authors",
    "/career",
    "/ai-policy",
    "/editorial-standards",
    "/fact-checking",
    "/corrections",
    "/privacy",
    "/contact",
    "/authors/aura-digital-intelligence",
  ];
  return [
    ...staticPages.map((path, index) => ({
      url: `${base}${path}`,
      changeFrequency: path === "/news" ? ("hourly" as const) : ("monthly" as const),
      priority: index === 0 ? 1 : path === "/news" ? 0.95 : 0.55,
    })),
    ...TOPIC_HUBS.map((topic) => ({
      url: `${base}/news/topic/${topic.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.75,
    })),
    ...articles.map((article) => ({
      url: `${base}${articlePath(article)}`,
      lastModified: new Date(article.updated_at || article.published_at || article.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
  ];
}
