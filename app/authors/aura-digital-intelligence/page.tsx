import type { Metadata } from "next";
import { EditorialPage } from "@/components/public-news/editorial-page";
import { siteUrl } from "@/lib/news/public";
export const metadata: Metadata = { title: "Aura Digital Intelligence Desk", description: "About the Aura Digital Intelligence publication desk.", alternates: { canonical: `${siteUrl()}/authors/aura-digital-intelligence` } };
export default function Page() { return <EditorialPage eyebrow="Publication desk" title="Aura Intelligence Desk" intro="The organizational byline behind Aura Digital Intelligence's verification-first newsroom.">
  <section><h2>What the byline means</h2><p>The desk is an organizational author responsible for stories published under Aura Digital Intelligence's evidence, originality and editorial standards.</p></section>
  <section><h2>Publisher</h2><p>Aura Digital Intelligence is published by <a href="https://auradigitalfiji.com">Aura Digital Fiji</a>, a Fiji-focused digital agency building websites, ecommerce, applications, business email, security and IT systems.</p></section>
  <section><h2>Editorial responsibility</h2><p>Publication rules are defined through our <a href="/editorial-standards">editorial standards</a>, <a href="/fact-checking">fact-checking policy</a>, <a href="/corrections">corrections policy</a> and <a href="/ai-policy">technology-use policy</a>.</p></section>
</EditorialPage>; }
