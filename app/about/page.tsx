import type { Metadata } from "next";
import { EditorialPage } from "@/components/public-news/editorial-page";
import { siteUrl } from "@/lib/news/public";
export const metadata: Metadata = { title: "About", description: "About Aura Digital Intelligence, a technology publication for Fiji and the Pacific.", alternates: { canonical: `${siteUrl()}/about` } };
export default function Page() { return <EditorialPage eyebrow="About the publication" title="Technology intelligence built for Fiji." intro="Aura Digital Intelligence is the editorial and research publication of Aura Digital Fiji. We turn significant technology developments into verified, practical context for Fiji businesses.">
  <section><h2>Our purpose</h2><p>Global technology moves quickly, but most coverage is written for much larger markets. Our purpose is to explain the developments that matter to Fiji businesses: AI, cybersecurity, websites, cloud infrastructure, ecommerce, payments, mobile technology and digital operations.</p></section>
  <section><h2>How the newsroom works</h2><p>Automation assists source discovery, prioritisation, evidence gathering, verification and drafting. Routine story scoring is rules-based rather than generative AI. Stories that reach publication must clear independent-source verification, an originality check and a final quality gate.</p></section>
  <section><h2>Publisher</h2><p>Aura Digital Intelligence is published by <a href="https://auradigitalfiji.com">Aura Digital Fiji</a>. Commercial links to Aura services are labelled by context and do not change the verification rules applied to news articles.</p></section>
</EditorialPage>; }
