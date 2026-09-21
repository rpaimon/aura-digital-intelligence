import type { Metadata } from "next";
import { EditorialPage } from "@/components/public-news/editorial-page";
import { siteUrl } from "@/lib/news/public";
export const metadata: Metadata = { title: "AI & Automation Policy", description: "How Aura Digital Intelligence uses automation and AI.", alternates: { canonical: `${siteUrl()}/ai-policy` } };
export default function Page() { return <EditorialPage eyebrow="Automation disclosure" title="AI and automation policy." intro="Aura Digital Intelligence uses automation openly, but automation does not remove the evidence requirements for publication.">
  <section><h2>Where automation is used</h2><p>Software monitors selected feeds, removes duplicates, scores relevance, retrieves independent evidence, routes verification tasks, generates drafts from verified facts, checks originality and applies publication gates.</p></section>
  <section><h2>Where generative AI is used</h2><p>Generative AI is reserved for a small number of high-value verification and writing tasks. Routine feed scoring is deterministic and does not use generative AI. When an AI provider is unavailable, the job is deferred instead of inventing an answer.</p></section>
  <section><h2>What AI cannot do</h2><p>AI output cannot override the minimum independent-source rules, the deterministic verification score, originality checks or the final publication gate. Drafts may only state verified safe facts as established facts.</p></section>
</EditorialPage>; }
