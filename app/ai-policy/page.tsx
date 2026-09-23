import type { Metadata } from "next";
import { EditorialPage } from "@/components/public-news/editorial-page";
import { siteUrl } from "@/lib/news/public";

export const metadata: Metadata = {
  title: "Technology & AI Policy",
  description: "How Aura Digital Intelligence governs the use of technology-assisted tools in publishing.",
  alternates: { canonical: `${siteUrl()}/ai-policy` },
};

export default function Page() {
  return (
    <EditorialPage
      eyebrow="Editorial policy"
      title="Technology and AI policy."
      intro="Aura Digital Intelligence may use technology-assisted tools in its publishing workflow, but every published story remains subject to the same sourcing, originality, quality and corrections standards."
    >
      <section>
        <h2>Editorial standards come first</h2>
        <p>Technology-assisted tools may support newsroom work, but they do not replace independent evidence requirements, originality checks, publication standards or correction responsibilities.</p>
      </section>
      <section>
        <h2>Evidence before publication</h2>
        <p>Factual claims presented as established facts must be supported by the publication&apos;s verification process. Uncertain or unsupported material is held back rather than presented as confirmed reporting.</p>
      </section>
      <section>
        <h2>Accountability</h2>
        <p>Aura Digital Intelligence is responsible for what it publishes. Readers can review our editorial standards, fact-checking policy and corrections policy for more detail.</p>
      </section>
    </EditorialPage>
  );
}
