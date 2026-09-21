import type { Metadata } from "next";
import { EditorialPage } from "@/components/public-news/editorial-page";
import { siteUrl } from "@/lib/news/public";
export const metadata: Metadata = { title: "Editorial Standards", description: "Editorial standards for Aura Digital Intelligence.", alternates: { canonical: `${siteUrl()}/editorial-standards` } };
export default function Page() { return <EditorialPage eyebrow="Trust & transparency" title="Editorial standards." intro="Our publication rules are designed to prefer a missing story over an inaccurate one.">
  <section><h2>Evidence before publication</h2><p>News claims must be corroborated by independent publisher evidence before they can be treated as verified facts. A story that does not meet the evidence threshold is held rather than automatically published.</p></section>
  <section><h2>Original value</h2><p>We do not publish simple article rewrites. Our articles are written from verified facts and add business-focused analysis for Fiji and the Pacific. Drafts are checked for excessive exact phrase overlap with source material.</p></section>
  <section><h2>Commercial independence</h2><p>Aura Digital Fiji owns this publication and relevant articles may link to Aura services. Those links are separate from the verification process. We do not change factual conclusions to make a service more attractive.</p></section>
  <section><h2>Updates</h2><p>We may update an article when meaningful new information becomes available. We do not change publication dates merely to make old material appear fresh.</p></section>
</EditorialPage>; }
