import type { Metadata } from "next";
import { EditorialPage } from "@/components/public-news/editorial-page";
import { siteUrl } from "@/lib/news/public";
export const metadata: Metadata = { title: "Fact-checking Policy", description: "How Aura Digital Intelligence verifies technology news.", alternates: { canonical: `${siteUrl()}/fact-checking` } };
export default function Page() { return <EditorialPage eyebrow="Evidence gate" title="How we fact-check." intro="A high priority score gets a story investigated. It does not make the story true.">
  <section><h2>Independent corroboration</h2><p>The verification engine searches for independent coverage and excludes the original publisher from the independent-source count. Full support for a claim requires corroboration from at least two independent sources.</p></section>
  <section><h2>Claim-level decisions</h2><p>Claims can be supported, partially supported, conflicted or unverified. Publication confidence is calculated from those evidence-linked results rather than from a model simply declaring that it is confident.</p></section>
  <section><h2>Fail closed</h2><p>If source retrieval fails, evidence conflicts, structured verification is incomplete, or free AI providers are temporarily unavailable, the job waits or the story is held. The system does not publish by guessing.</p></section>
</EditorialPage>; }
