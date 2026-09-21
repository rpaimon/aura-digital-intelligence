import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Globe2, Laptop2, ShieldCheck, Sparkles } from "lucide-react";
import { NewsFooter, NewsHeader } from "@/components/public-news/news-shell";
import { siteUrl } from "@/lib/news/public";

export const metadata: Metadata = { title: "Career", description: "Work, contribute or collaborate with Aura Digital Intelligence and Aura Digital Fiji.", alternates: { canonical: `${siteUrl()}/career` } };

const cards = [
  { icon: Globe2, title: "Fiji-first perspective", text: "We are interested in people who understand how global technology actually lands in Fiji and the Pacific." },
  { icon: ShieldCheck, title: "Evidence before hype", text: "Good reporting beats fast speculation. Sources, context and accuracy matter." },
  { icon: Laptop2, title: "Remote by default", text: "Digital collaboration lets contributors work from anywhere while serving a Fiji-focused audience." },
  { icon: Sparkles, title: "Editorial systems", text: "We use modern tooling to reduce repetitive work while keeping evidence and editorial standards strict." },
];

export default function CareerPage() {
  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <NewsHeader />
      <section className="adi-noise border-b border-white/10"><div className="mx-auto max-w-[1180px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Work with us</p><h1 className="mt-4 text-6xl font-black uppercase leading-[.86] tracking-[-0.07em] sm:text-8xl">Build the next Fiji technology publication.</h1><p className="mt-7 max-w-3xl text-lg leading-8 text-white/52">Aura Digital Intelligence is growing as a publication and as a customer-acquisition engine for Aura Digital Fiji. We welcome useful story tips, specialist contributors and future editorial collaborators.</p></div></section>
      <section className="mx-auto max-w-[1180px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20"><div className="grid gap-5 sm:grid-cols-2">{cards.map(({icon:Icon,title,text})=><article key={title} className="border border-white/12 bg-[#0c0c0c] p-6"><Icon size={22}/><h2 className="mt-5 text-2xl font-black uppercase tracking-[-0.04em]">{title}</h2><p className="mt-3 text-sm leading-7 text-white/46">{text}</p></article>)}</div><div className="mt-12 bg-[#25C8E0] p-7 text-black sm:p-10"><p className="text-[10px] font-black uppercase tracking-[0.17em]">Interested?</p><h2 className="mt-3 text-4xl font-black uppercase leading-none tracking-[-0.055em] sm:text-5xl">Start with a conversation.</h2><p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-black/65">We may not always have an open role, but relevant contributors, sources and collaborators are welcome to get in touch.</p><Link href="/contact" className="mt-6 inline-flex items-center gap-2 border-b-2 border-black pb-1 text-xs font-black uppercase tracking-[0.12em]">Contact the newsroom <ArrowUpRight size={13}/></Link></div></section>
      <NewsFooter />
    </main>
  );
}
