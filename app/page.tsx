import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Radar, ShieldCheck, Sparkles, Target } from "lucide-react";
import { NewsFooter, NewsHeader } from "@/components/public-news/news-shell";
import { getPublishedArticles, readingTime, siteUrl, TOPIC_HUBS } from "@/lib/news/public";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fiji Technology News & Business Intelligence",
  description: "Verified AI, cybersecurity, cloud, ecommerce and digital-business intelligence translated into practical context for Fiji businesses.",
  alternates: { canonical: siteUrl() },
  openGraph: {
    type: "website",
    title: "Aura Digital Intelligence",
    description: "Global technology. Fiji business context.",
    url: siteUrl(),
  },
};

function date(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-FJ", { timeZone: "Pacific/Fiji", day: "numeric", month: "short", year: "numeric" });
}

export default async function Home() {
  const articles = await getPublishedArticles(7);
  const base = siteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", name: "Aura Digital Intelligence", alternateName: "ADI", url: base },
      { "@type": "Organization", name: "Aura Digital Intelligence", url: base, parentOrganization: { "@type": "Organization", name: "Aura Digital Fiji", url: "https://auradigitalfiji.com" } },
    ],
  };
  const lead = articles[0];
  const latest = articles.slice(1);

  return (
    <main className="min-h-screen overflow-hidden bg-[#07090d] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <NewsHeader />
      <section className="relative border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_5%,rgba(190,242,100,.13),transparent_31%),radial-gradient(circle_at_82%_35%,rgba(34,211,238,.07),transparent_34%)]" />
        <div className="relative mx-auto max-w-[1440px] px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          <div className="max-w-5xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/[0.07] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-lime-200"><Radar size={14} /> Fiji technology intelligence</div>
            <h1 className="mt-7 text-[3.6rem] font-black leading-[0.91] tracking-[-0.07em] sm:text-7xl lg:text-[7rem]">Global technology.<br/><span className="text-lime-300">Fiji business context.</span></h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/55">Aura Digital Intelligence filters the technology noise, verifies the claims and explains what significant AI, cybersecurity, cloud and digital-business developments mean for Fiji.</p>
            <div className="mt-9 flex flex-wrap gap-3"><Link href="/news" className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-6 py-3 text-sm font-black text-[#090b0e]">Read latest intelligence <ArrowRight size={16}/></Link><Link href="/editorial-standards" className="rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-black text-white/75">How we publish</Link></div>
          </div>

          <div className="mt-16 grid gap-3 sm:grid-cols-3">
            {[{icon:ShieldCheck,title:"Verified",text:"Independent evidence before publication."},{icon:Target,title:"Built for Fiji",text:"Business implications, not generic rewrites."},{icon:Sparkles,title:"Transparent automation",text:"Automation disclosed; publication gates stay strict."}].map((item)=>{const Icon=item.icon;return <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"><Icon className="text-lime-300" size={20}/><p className="mt-4 text-sm font-black">{item.title}</p><p className="mt-1.5 text-xs leading-5 text-white/42">{item.text}</p></div>})}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="flex gap-2 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{TOPIC_HUBS.map((topic)=><Link key={topic.slug} href={`/news/topic/${topic.slug}`} className="shrink-0 rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-xs font-black text-white/55 hover:border-lime-300/30 hover:text-lime-200">{topic.label}</Link>)}</div>

        {lead ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
            <article className="group relative min-h-[480px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#10141b]">
              {lead.featured_image_url ? <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={lead.featured_image_url} alt={lead.featured_image_alt || ""} className="absolute inset-0 h-full w-full object-cover opacity-50"/></> : <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(190,242,100,.2),transparent_35%),linear-gradient(135deg,#121822,#080b10)]"/>}
              <div className="absolute inset-0 bg-gradient-to-t from-[#07090d] via-[#07090d]/45 to-transparent"/>
              <div className="relative flex min-h-[480px] flex-col justify-end p-7 sm:p-10"><p className="text-xs font-black uppercase tracking-[0.17em] text-lime-300">Latest verified intelligence</p><h2 className="mt-4 max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.05em] sm:text-6xl"><Link href={`/news/${lead.slug}`}>{lead.title}</Link></h2>{lead.excerpt&&<p className="mt-5 max-w-2xl text-sm leading-7 text-white/58 sm:text-base">{lead.excerpt}</p>}<div className="mt-6 flex items-center gap-3 text-xs font-bold text-white/35"><span>{date(lead.published_at)}</span><span>•</span><span>{readingTime(lead.excerpt)} min</span></div></div>
            </article>
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6"><p className="text-xs font-black uppercase tracking-[0.18em] text-lime-300">Latest signals</p><div className="mt-3 divide-y divide-white/10">{latest.slice(0,4).map((a)=><article key={a.id} className="py-5"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/30">{a.category||"Technology"}</p><h3 className="mt-2 text-lg font-black leading-snug"><Link href={`/news/${a.slug}`} className="hover:text-lime-200">{a.title}</Link></h3><p className="mt-2 text-[11px] text-white/30">{date(a.published_at)} · {readingTime(a.excerpt)} min</p></article>)}</div><Link href="/news" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-lime-200">View all intelligence <ArrowRight size={14}/></Link></div>
          </div>
        ) : (
          <div className="mt-8 rounded-[2rem] border border-dashed border-white/15 bg-white/[0.03] p-12 text-center"><Radar className="mx-auto text-lime-300" size={34}/><h2 className="mt-5 text-3xl font-black">The newsroom is working.</h2><p className="mx-auto mt-3 max-w-xl leading-7 text-white/45">The first articles will appear only after independent-source verification, originality checks and the final quality gate.</p></div>
        )}
      </section>

      <section className="border-y border-white/10 bg-[#090c11]"><div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-lime-300">Need the technology implemented?</p><h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">Intelligence is useful. Execution creates results.</h2><p className="mt-4 max-w-2xl leading-7 text-white/48">Aura Digital Fiji builds websites, ecommerce, mobile apps, business email, security and digital infrastructure for Fiji businesses.</p></div><a href="https://auradigitalfiji.com?utm_source=aura_digital_intelligence&utm_medium=homepage&utm_campaign=news_to_client" className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-6 py-3 text-sm font-black text-[#090b0e]">Visit Aura Digital Fiji <ArrowRight size={15}/></a></div></section>
      <NewsFooter />
    </main>
  );
}
