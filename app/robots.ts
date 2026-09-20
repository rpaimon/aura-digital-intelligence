import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/news/public";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      { userAgent: "*", allow: ["/", "/news/"], disallow: ["/admin/", "/api/"] },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
