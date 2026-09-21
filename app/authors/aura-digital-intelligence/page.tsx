import type { Metadata } from "next";
import { EditorialPage } from "@/components/public-news/editorial-page";
import { siteUrl } from "@/lib/news/public";
export const metadata: Metadata = { title: "Aura Digital Intelligence Desk", description: "About the Aura Digital Intelligence publication desk.", alternates: { canonical: `${siteUrl()}/authors/aura-digital-intelligence` } };
export default function Page() { return <EditorialPage eyebrow="Publication desk" title="Aura Digital Intelligence Desk" intro="The organizational byline used for Aura Digital Intelligence's automated, verification-first newsroom workflow.">
  <section><h2>What the byline means</h2><p>The desk is an organizational author, not a claim that one person manually wrote every article. Automation assists discovery, evidence gathering, verification and drafting under the publication rules described on this site.</p></section>
  <section><h2>Publisher</h2><p>Aura Digital Intelligence is published by <a href="https://auradigitalfiji.com">Aura Digital Fiji</a>.</p></section>
  <section><h2>Policies</h2><p>Read our <a href="/editorial-standards">editorial standards</a>, <a href="/fact-checking">fact-checking policy</a>, <a href="/corrections">corrections policy</a> and <a href="/ai-policy">AI & automation policy</a>.</p></section>
</EditorialPage>; }
