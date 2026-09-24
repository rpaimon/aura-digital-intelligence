import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Gauge, ShieldCheck, Target, Zap } from "lucide-react";
import { NewsFooter, NewsHeader } from "@/components/public-news/news-shell";
import { siteUrl } from "@/lib/news/public";

export const metadata: Metadata = { title: "About", description: "About Aura Digital Intelligence, a technology publication for Fiji and the Pacific.", alternates: { canonical: `${siteUrl()}/about` } };

const values=[
  {icon:Target,title:"Fiji relevance",text:"Global technology matters when it changes decisions for local businesses."},
  {icon:ShieldCheck,title:"Verification first",text:"Independent evidence gates publishable claims before they become articles."},
  {icon:Zap,title:"Fast, not careless",text:"We monitor a broad source network while keeping publication standards strict."},
  {icon:Gauge,title:"Commercial usefulness",text:"We explain practical consequences, not just repeat product announcements."}
];

export default function AboutPage(){
  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <NewsHeader/>
      <section className="adi-noise border-b border-white/10">
        <div className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <p className="adi-kicker">About the publication</p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
            <div>
              <h1 className="adi-hero-title max-w-4xl font-black text-white">Technology intelligence built for Fiji.</h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-white/54 sm:text-lg">Aura Digital Intelligence is the editorial and research publication of Aura Digital Fiji. We turn significant technology developments into verified, practical context for Fiji businesses.</p>
            </div>
            <div className="adi-panel p-5">
              <p className="adi-kicker">Publisher</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">Aura Digital Fiji</h2>
              <p className="mt-3 text-sm leading-7 text-white/48">The publication exists to build useful technology authority in Fiji while connecting businesses with practical digital services.</p>
              <a href="https://auradigitalfiji.com" className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-white">Visit Aura Digital Fiji <ArrowUpRight size={13}/></a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="adi-panel p-6"><p className="adi-kicker">Our vision</p><h2 className="mt-3 text-3xl font-black tracking-[-0.05em]">Make global technology useful locally.</h2><p className="mt-4 text-sm leading-7 text-white/52">Most global technology coverage is written for larger markets. We focus on what developments mean for businesses operating in Fiji and the Pacific.</p></div>
          <div className="adi-panel p-6"><p className="adi-kicker">Our mission</p><h2 className="mt-3 text-3xl font-black tracking-[-0.05em]">Filter noise. Verify claims. Explain impact.</h2><p className="mt-4 text-sm leading-7 text-white/52">We filter developments through independent evidence, originality checks and practical usefulness before publication.</p></div>
        </div>

        <div className="mt-8 adi-panel p-5 sm:p-6">
          <p className="adi-kicker">Why Aura Intelligence?</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">Our operating principles</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">{values.map(({icon:Icon,title,text})=><article key={title} className="adi-panel-soft p-5"><Icon size={22}/><h3 className="mt-4 text-2xl font-black tracking-[-0.04em]">{title}</h3><p className="mt-3 text-sm leading-7 text-white/48">{text}</p></article>)}</div>
        </div>

        <div className="mt-8 adi-panel p-6">
          <p className="adi-kicker">Editorial accountability</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">Trust systems behind the stories.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/52">The newsroom is built to publish only after verification, originality checks and editorial safeguards have been satisfied.</p>
          <Link href="/editorial-standards" className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-white">Read our editorial standards <ArrowUpRight size={13}/></Link>
        </div>
      </section>
      <NewsFooter/>
    </main>
  );
}
