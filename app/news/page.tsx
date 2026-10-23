import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { NewsFooter, NewsHeader } from "@/components/public-news/news-shell";
import { AuraStudioCompact } from "@/components/public-news/aura-placement";
import { EditorialLead, NumberedPick, SectionHeading, StoryCard, StoryRow } from "@/components/public-news/framagz-ui";
import { articlePath, getPublishedArticles, siteUrl, TOPIC_HUBS } from "@/lib/news/public";
import { readerHeadline } from "@/lib/news/editorial-presentation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All Technology News & Intelligence",
  description: "All technology, cybersecurity, cloud and digital-business reporting from Aura Digital Intelligence.",
  alternates: { canonical: `${siteUrl()}/news` },
  openGraph: { type: "website", siteName: "Aura Digital Intelligence", title: "All News | Aura Digital Intelligence", description: "Verified technology intelligence for Fiji and the Pacific.", url: `${siteUrl()}/news`, images: [{ url: `${siteUrl()}/opengraph-image`, width: 1200, height: 630, type: "image/png" }] },
  twitter: { card: "summary_large_image", title: "All News | Aura Digital Intelligence", description: "Verified technology intelligence for Fiji and the Pacific.", images: [`${siteUrl()}/opengraph-image`] },
};

type SearchParams = Promise<{ q?: string }>;

export default async function NewsPage({ searchParams }: { searchParams: SearchParams }) {
  const { q = "" } = await searchParams;
  const all = await getPublishedArticles(120);
  const query = q.trim().toLowerCase();
  const articles = query ? all.filter((a) => `${a.title} ${a.excerpt || ""} ${a.category || ""}`.toLowerCase().includes(query)) : all;
  const [lead, ...rest] = articles;
  const grid = rest.slice(0, 6);
  const rows = rest.slice(6);

  const fresh = !query ? articles.slice(0, 3) : [];
  const timestamp = new Intl.DateTimeFormat("en-FJ", { timeZone: "Pacific/Fiji", weekday: "short", day: "numeric", month: "long", year: "numeric" }).format(new Date());
  const sidebar = query ? articles.slice(0, 4) : all.slice(0, 5);

  return (
    <main className="adi-public-shell adi-live-newsroom min-h-screen">
      <NewsHeader />
      <div className="adi-newsroom-topline">
        <div className="adi-wide-shell flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6 lg:px-8">
          <span><span className="adi-newsroom-dot" /> THE NEWSROOM <span className="adi-newsroom-divider">/</span> FIJI & THE PACIFIC</span>
          <time>{timestamp} · FJT</time>
        </div>
      </div>
      <header className="adi-wide-shell px-4 pb-6 pt-9 sm:px-6 sm:pt-12 lg:px-8">
        <div className="adi-newsroom-intro">
          <div>
            <p className="adi-kicker">Independent technology reporting</p>
            <h1 className="adi-newsroom-masthead mt-2">The Newsroom<span>.</span></h1>
            <p className="adi-newsroom-subtitle mt-4">Clear headlines. Verified stories. The technology shaping our world—and what it means for Fiji.</p>
          </div>
          <div className="adi-newsroom-count"><span>ON THE DESK</span><strong>{articles.length}</strong><small>{query ? "search results" : "recent stories"}</small></div>
        </div>
        <div className="adi-newsroom-tools mt-7">
          <form action="/news" method="get" className="adi-newsroom-search"><Search size={19} aria-hidden="true"/><input aria-label="Search news articles" name="q" defaultValue={q} placeholder="Search the news..." /><button>Search →</button></form>
          <nav aria-label="Browse news desks" className="adi-newsroom-desks"><Link href="/news" className={!query ? "is-active" : ""}>All stories</Link>{TOPIC_HUBS.map(topic => <Link key={topic.slug} href={`/news/topic/${topic.slug}`}>{topic.shortLabel}</Link>)}</nav>
        </div>
        {query && <p className="mt-4 text-sm">Found {articles.length} result{articles.length === 1 ? "" : "s"} for “{q}”.</p>}
      </header>
      {!query && fresh.length > 1 && <section className="adi-newsroom-wire border-y border-white/10"><div className="adi-wide-shell flex items-center gap-4 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8"><span className="adi-newsroom-wire-label">LATEST</span>{fresh.map((a) => <Link key={a.id} href={articlePath(a)} className="adi-newsroom-wire-item">{readerHeadline(a)} <ArrowUpRight size={12}/></Link>)}</div></section>}
      <div className="adi-wide-shell grid gap-0 px-0 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12 lg:px-8">
        <div className="min-w-0">
          {lead ? <section className="px-4 pb-8 pt-8 sm:px-0"><SectionHeading eyebrow={query ? "Search results" : "Front page"} title={query ? "Stories found" : "Top story"} /><EditorialLead article={lead}/></section> : <section className="px-4 py-16 text-center"><h2 className="text-2xl font-black">No matching reports</h2><p className="mt-3 text-sm">Try a shorter search term or browse another desk.</p></section>}
          {grid.length > 0 && <section className="border-t border-white/10 pb-7 pt-8"><SectionHeading eyebrow="On the desk" title="Latest headlines"/><div className="adi-story-grid three">{grid.map((a) => <StoryCard key={a.id} article={a} compact />)}</div></section>}
          {rows.length > 0 && <section className="border-t border-white/10 py-8"><SectionHeading eyebrow="Continuing coverage" title="News feed"/><div>{rows.map((a) => <StoryRow key={a.id} article={a}/>)}</div></section>}
        </div>
        <aside className="adi-newsroom-sidebar border-t border-white/10 px-4 py-8 sm:px-0 lg:sticky lg:top-40 lg:self-start lg:border-t-0">
          <div className="adi-newsroom-sidebar-heading"><span>THE DAILY BRIEF</span><span>01 — 05</span></div>
          <h2 className="mt-5 text-2xl font-black tracking-[-.05em]">What to read now</h2>
          <div className="mt-5">{sidebar.map((a,index) => <NumberedPick key={a.id} article={a} index={index+1}/>)}</div>
          <div className="adi-newsroom-transparency mt-7"><p className="adi-kicker">Our approach</p><h3 className="mt-3 text-xl font-black">Explained, not exaggerated.</h3><p className="mt-3 text-sm leading-7">We explain cybersecurity and technology stories in everyday language, with linked sources and clear context for people and businesses in Fiji.</p><Link href="/editorial-standards" className="mt-4 inline-block text-sm font-bold underline underline-offset-4">Read our standards ↗</Link></div>
          <div className="mt-7"><AuraStudioCompact eyebrow="A publication by Aura Digital Fiji"/></div>
        </aside>
      </div>
      <div className="adi-wide-shell px-4 py-6 sm:px-6 lg:px-8"><div className="adi-newsroom-endnote"><span>STAY INFORMED</span><p>Good reporting begins with facts. Explore the full archive, or contact the editorial desk with a correction.</p><Link href="/corrections">Corrections policy ↗</Link></div></div>
      <NewsFooter />
    </main>
  );
}
