import type { Metadata } from "next";
import "./globals.css";
import "./newsroom.css";

const indexingEnabled = process.env.NEXT_PUBLIC_PUBLIC_INDEXING_ENABLED === "true";

export const metadata: Metadata = {
  title: { default: "Aura Digital Intelligence | Fiji Technology News & Business Intelligence", template: "%s | Aura Digital Intelligence" },
  description: "Verified technology, AI, cybersecurity, cloud, ecommerce and digital-business intelligence for Fiji and the Pacific.",
  applicationName: "Aura Digital Intelligence",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  robots: indexingEnabled ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } } : { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true, "max-image-preview": "none", "max-snippet": -1 } },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
