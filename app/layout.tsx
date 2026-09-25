import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./newsroom.css";

const indexingEnabled = process.env.NEXT_PUBLIC_PUBLIC_INDEXING_ENABLED !== "false";
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://intelligence.auradigitalfiji.com";

export const metadata: Metadata = {
  title: { default: "Aura Digital Intelligence | Fiji Technology News & Business Intelligence", template: "%s | Aura Digital Intelligence" },
  description: "Verified technology, AI, cybersecurity, cloud, ecommerce and digital-business intelligence for Fiji and the Pacific.",
  applicationName: "Aura Digital Intelligence",
  metadataBase: new URL(baseUrl),
  creator: "Aura Digital Fiji",
  publisher: "Aura Digital Fiji",
  category: "Technology News",
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": `${baseUrl.replace(/\/$/, "")}/rss.xml` },
  },
  openGraph: {
    siteName: "Aura Digital Intelligence",
    locale: "en_FJ",
    type: "website",
    title: "Aura Digital Intelligence",
    description: "Verified technology intelligence and practical Fiji business context.",
    url: baseUrl,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, type: "image/png", alt: "Aura Digital Intelligence" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aura Digital Intelligence",
    description: "Verified technology intelligence and practical Fiji business context.",
    images: ["/opengraph-image"],
  },
  robots: indexingEnabled
    ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } }
    : { index: false, follow: true, googleBot: { index: false, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark light",
  themeColor: "#080a0d",
};

const themeScript = `
(function(){
  try {
    var saved = localStorage.getItem('adi-theme');
    var theme = saved === 'light' || saved === 'dark' ? saved : 'dark';
    document.documentElement.dataset.theme = theme;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f6f3ec' : '#080a0d');
  } catch (_) {
    document.documentElement.dataset.theme = 'dark';
  }
})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>{children}</body>
    </html>
  );
}
