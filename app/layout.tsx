import type { Metadata } from "next";
import "./globals.css";
import "./newsroom.css";

const indexingEnabled = process.env.NEXT_PUBLIC_PUBLIC_INDEXING_ENABLED === "true";

export const metadata: Metadata = {
  title: { default: "Aura Digital Intelligence | Fiji Technology News & Business Intelligence", template: "%s | Aura Digital Intelligence" },
  description: "Verified technology, AI, cybersecurity, cloud, ecommerce and digital-business intelligence for Fiji and the Pacific.",
  applicationName: "Aura Digital Intelligence",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://intelligence.auradigitalfiji.com"),
  openGraph: {
    siteName: "Aura Digital Intelligence",
    locale: "en_FJ",
    type: "website",
    title: "Aura Digital Intelligence",
    description: "Verified technology intelligence and practical Fiji business context.",
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

const themeScript = `
(function(){
  try {
    var saved = localStorage.getItem('adi-theme');
    var systemLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    document.documentElement.dataset.theme = saved === 'light' || saved === 'dark' ? saved : (systemLight ? 'light' : 'dark');
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
