import type { Metadata } from "next";
import { EditorialPage } from "@/components/public-news/editorial-page";
import { siteUrl } from "@/lib/news/public";
export const metadata: Metadata = { title: "Contact", description: "Contact Aura Digital Intelligence.", alternates: { canonical: `${siteUrl()}/contact` } };
export default function Page() { return <EditorialPage eyebrow="Contact" title="Talk to the newsroom." intro="For corrections, source questions, story tips or business enquiries, contact Aura Digital Fiji.">
  <section><h2>Email</h2><p><a href="mailto:contact@auradigitalfiji.com">contact@auradigitalfiji.com</a></p></section>
  <section><h2>Aura Digital Fiji</h2><p>For websites, ecommerce, apps, business email, security and IT services, visit <a href="https://auradigitalfiji.com">auradigitalfiji.com</a>.</p></section>
</EditorialPage>; }
