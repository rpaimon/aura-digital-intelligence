import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { NewsFooter, NewsHeader } from "@/components/public-news/news-shell";
import { siteUrl } from "@/lib/news/public";

export const metadata: Metadata = { title: "Authors", description: "Meet the publication desk behind Aura Digital Intelligence.", alternates: { canonical: `${siteUrl()}/authors` } };

export default function AuthorsPage() {
  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <NewsHeader />
      <section className="adi-noise border-b border-white/10"><div className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16"><p className="adi-kicker">The publication desk behind Aura Intelligence</p><h1 className="adi-hero-title mt-3 font-black text-white">Authors</h1></div></section>
      <section className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="adi-panel grid gap-6 p-6 md:grid-cols-[240px_minmax(0,1fr)] md:items-start">
          <div className="grid aspect-square place-items-center rounded-[1.5rem] bg-white text-6xl font-black text-black">ADI</div>
          <div><p className="adi-kicker">Publication desk</p><h2 className="mt-2 text-4xl font-black tracking-[-0.055em] sm:text-5xl">Aura Intelligence Desk</h2><p className="mt-5 max-w-2xl text-base leading-8 text-white/52">The organizational byline for Aura Digital Intelligence. The desk publishes evidence-led technology reporting and practical Fiji business analysis under our editorial standards.</p><Link href="/authors/aura-digital-intelligence" className="mt-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-white">View author profile <ArrowUpRight size={13}/></Link></div>
        </div>
      </section>
      <NewsFooter />
    </main>
  );
}
