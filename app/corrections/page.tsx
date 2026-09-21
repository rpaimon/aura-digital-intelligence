import type { Metadata } from "next";
import { EditorialPage } from "@/components/public-news/editorial-page";
import { siteUrl } from "@/lib/news/public";
export const metadata: Metadata = { title: "Corrections Policy", description: "Corrections policy for Aura Digital Intelligence.", alternates: { canonical: `${siteUrl()}/corrections` } };
export default function Page() { return <EditorialPage eyebrow="Accountability" title="Corrections policy." intro="If we get something materially wrong, we want to correct it clearly and quickly.">
  <section><h2>Report an issue</h2><p>Send the article URL and the specific issue to <a href="mailto:contact@auradigitalfiji.com">contact@auradigitalfiji.com</a>. Evidence or a primary source is helpful but not required to raise a concern.</p></section>
  <section><h2>What happens next</h2><p>Material factual errors are reviewed against the evidence trail. When a substantive correction is required, the article is updated rather than silently republished as a new story.</p></section>
</EditorialPage>; }
