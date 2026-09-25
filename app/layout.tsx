import type { Metadata } from "next";
import "./globals.css";
import "./newsroom.css";

const indexingEnabled = process.env.NEXT_PUBLIC_PUBLIC_INDEXING_ENABLED === "true";

export const metadata: Metadata = {
  title: { default: "Aura Digital Intelligence | Fiji Technology News & Business Intelligence", template: "%s | Aura Digital Intelligence" },
  description: "Verified technology, AI, cybersecurity, cloud, ecommerce and digital-business intelligence for Fiji and the Pacific.",
  applicationName: "Aura Digital Intelligence",
  openGraph: { siteName: "Aura Digital Intelligence", locale: "en_FJ", type: "website", images: [{ url: "/opengraph-image", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", images: ["/opengraph-image"] },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://intelligence.auradigitalfiji.com"),
  robots: indexingEnabled ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } } : { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true, "max-image-preview": "none", "max-snippet": -1 } },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
