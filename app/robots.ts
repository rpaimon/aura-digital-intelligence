import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/news/public";

const socialBots = [
  "facebookexternalhit",
  "Facebot",
  "WhatsApp",
  "Twitterbot",
  "LinkedInBot",
  "TelegramBot",
  "Discordbot",
  "Slackbot",
];

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  const indexingEnabled = process.env.NEXT_PUBLIC_PUBLIC_INDEXING_ENABLED === "true";

  if (!indexingEnabled) {
    return {
      rules: [
        ...socialBots.map((userAgent) => ({ userAgent, allow: "/" })),
        { userAgent: "*", disallow: "/" },
      ],
      host: base,
    };
  }

  return {
    rules: [
      ...socialBots.map((userAgent) => ({ userAgent, allow: "/" })),
      { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/go/"] },
    ],
    sitemap: [`${base}/sitemap.xml`, `${base}/news-sitemap.xml`],
    host: base,
  };
}
