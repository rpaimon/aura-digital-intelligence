import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { NewsFooter, NewsHeader } from "@/components/public-news/news-shell";
import { siteUrl } from "@/lib/news/public";

export const metadata: Metadata = { title: "Authors", description: "Meet the publication desk behind Aura Digital Intelligence.", alternates: { canonical: `${siteUrl()}/authors` } };

export default function AuthorsPage() {
  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <NewsHeader />
      <section className="adi-noise border-b border-white/10"><div className="mx-auto max-w-[1480px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">The people & systems behind the publication</p><h1 className="mt-3 text-6xl font-black uppercase leading-[.85] tracking-[-0.07em] sm:text-8xl lg:text-[8rem]">Authors</h1></div></section>
      <section className="mx-auto max-w-[1180px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-8 md:grid-cols-[280px_minmax(0,1fr)] md:items-start">
          <div className="grid aspect-square place-items-center bg-white text-6xl font-black text-black">ADI</div>
          <div className="border-t-4 border-white pt-5"><p className="text-[10px] font-black uppercase tracking-[0.17em] text-white/35">Publication desk</p><h2 className="mt-2 text-4xl font-black uppercase tracking-[-0.055em] sm:text-5xl">Aura Intelligence Desk</h2><p className="mt-5 max-w-2xl text-base leading-8 text-white/52">The organizational byline used for Aura Digital Intelligence's verification-first newsroom workflow. Published stories follow our evidence, originality and editorial standards.</p><Link href="/authors/aura-digital-intelligence" className="mt-6 inline-flex items-center gap-2 border-b-2 border-white pb-1 text-xs font-black uppercase tracking-[0.12em]">View author profile <ArrowUpRight size={13}/></Link></div>
        </div>
      </section>
      <NewsFooter />
    </main>
  );
}
