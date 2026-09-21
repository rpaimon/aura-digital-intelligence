import type { Metadata } from "next";
import Link from "next/link";
import { EditorialPage } from "@/components/public-news/editorial-page";
import { siteUrl } from "@/lib/news/public";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy information for Aura Digital Intelligence.",
  alternates: { canonical: `${siteUrl()}/privacy` },
};

export default function PrivacyPage() {
  return (
    <EditorialPage
      eyebrow="Privacy"
      title="A small-data newsroom."
      intro="Aura Digital Intelligence is designed to collect as little reader data as practical while still measuring whether our journalism helps people discover useful Aura Digital Fiji services."
    >
      <section>
        <h2>What this newsroom records</h2>
        <p>
          When a reader uses a contextual Aura Digital Fiji service link inside an article, we record an aggregate first-party conversion event containing the article, the service category and the destination URL. The newsroom conversion table does not intentionally store the reader&apos;s name, email address, IP address, full referrer or browser user-agent string.
        </p>
      </section>
      <section>
        <h2>What we do not use here</h2>
        <p>
          Aura Digital Intelligence does not require an advertising tracker to publish or read articles. We do not sell newsroom conversion-event data. Infrastructure providers such as Vercel, Cloudflare and Supabase may process technical request data as part of operating and securing the service under their own terms.
        </p>
      </section>
      <section>
        <h2>Links to Aura Digital Fiji</h2>
        <p>
          Articles may link to relevant Aura Digital Fiji services. Once you leave this newsroom, the destination website&apos;s own forms, cookies and privacy practices apply. You can visit <a href="https://auradigitalfiji.com">auradigitalfiji.com</a> for those services.
        </p>
      </section>
      <section>
        <h2>Corrections and contact</h2>
        <p>
          Questions about this privacy notice, editorial corrections or the operation of Aura Digital Intelligence can be sent through our <Link href="/contact">contact page</Link>.
        </p>
      </section>
    </EditorialPage>
  );
}
