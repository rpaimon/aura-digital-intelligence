import type { Metadata } from "next";
import { EditorialPage } from "@/components/public-news/editorial-page";
import { siteUrl } from "@/lib/news/public";

export const metadata: Metadata = {
  title: "Technology Use Policy",
  description: "How Aura Digital Intelligence governs software and editorial tools used in publishing.",
  alternates: { canonical: `${siteUrl()}/ai-policy` },
};

export default function Page() {
  return (
    <EditorialPage
      eyebrow="Editorial policy"
      title="Technology use policy."
      intro="Aura Digital Intelligence uses software tools to support newsroom research and production, while every published story remains subject to the same sourcing, originality, quality and corrections standards."
    >
      <section>
        <h2>Editorial standards come first</h2>
        <p>Software-assisted newsroom tools do not replace independent evidence requirements, originality checks, publication standards or correction responsibilities.</p>
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
