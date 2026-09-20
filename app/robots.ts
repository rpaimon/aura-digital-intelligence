import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/news/public";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  const indexingEnabled = process.env.NEXT_PUBLIC_PUBLIC_INDEXING_ENABLED === "true";

  if (!indexingEnabled) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
      host: base,
    };
  }

  return {
    rules: [
      { userAgent: "*", allow: ["/", "/news/"], disallow: ["/admin/", "/api/"] },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
