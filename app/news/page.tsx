import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { NewsFooter, NewsHeader } from "@/components/public-news/news-shell";
import { NumberedPick, SectionHeading, StoryCard } from "@/components/public-news/framagz-ui";
import { getPublishedArticles, siteUrl, TOPIC_HUBS } from "@/lib/news/public";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All Technology News & Intelligence",
  description: "All verified technology, AI, cybersecurity, cloud and digital-business intelligence from Aura Digital Intelligence.",
  alternates: { canonical: `${siteUrl()}/news` },
  openGraph: { type: "website", title: "All News | Aura Digital Intelligence", description: "Verified technology intelligence for Fiji and the Pacific.", url: `${siteUrl()}/news` },
};

type SearchParams = Promise<{ q?: string }>;

export default async function NewsPage({ searchParams }: { searchParams: SearchParams }) {
  const { q = "" } = await searchParams;
  const all = await getPublishedArticles(120);
  const query = q.trim().toLowerCase();
  const articles = query
    ? all.filter((a) => `${a.title} ${a.excerpt || ""} ${a.category || ""}`.toLowerCase().includes(query))
    : all;
  const staffPicks = all.slice(0, 3);

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <NewsHeader />
      <section className="adi-noise border-b border-white/10">
        <div className="mx-auto max-w-[1480px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Aura Intelligence archive</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><h1 className="text-5xl font-black uppercase leading-[.9] tracking-[-0.06em] sm:text-7xl lg:text-[6.5rem]">All News</h1><p className="max-w-md text-sm leading-6 text-white/44 lg:pb-2 lg:text-right">Verified reporting across AI, cybersecurity, cloud, business technology and the Pacific.</p></div>
          <div className="mt-8 flex flex-wrap gap-2">
            <Link href="/news" className="bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-black">All</Link>
            {TOPIC_HUBS.map((topic) => <Link key={topic.slug} href={`/news/topic/${topic.slug}`} className="border border-white/12 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/56 transition hover:bg-white hover:text-black">{topic.label}</Link>)}
          </div>
          <form action="/news" method="get" className="mt-8 flex max-w-xl items-center gap-3 border-b-2 border-white pb-2">
            <Search size={17} className="text-white/40" />
            <input name="q" defaultValue={q} placeholder="Search stories..." className="min-w-0 flex-1 bg-transparent py-2 text-base font-bold text-white outline-none placeholder:text-white/28" />
            <button className="text-[10px] font-black uppercase tracking-[0.14em] text-white/55 hover:text-white">Search</button>
          </form>
          {query && <p className="mt-4 text-sm text-white/45">{articles.length} result{articles.length === 1 ? "" : "s"} for “{q}”.</p>}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1480px] gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8 lg:py-16">
        <div>
          <SectionHeading title={query ? "Search Results" : "Latest Stories"} accent="#25C8E0" />
          {articles.length ? (
            <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
              {articles.map((article) => <StoryCard key={article.id} article={article} />)}
            </div>
          ) : (
            <div className="border border-dashed border-white/16 bg-[#0c0c0c] p-10 text-center"><p className="text-2xl font-black uppercase">No stories found</p><p className="mt-3 text-sm text-white/45">Try a different search or explore a category.</p></div>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-32 lg:self-start">
          <div className="border border-white/12 bg-[#0c0c0c] p-5">
            <h2 className="border-b-4 border-white pb-4 text-xl font-black uppercase tracking-[-0.04em]">Staff Picks</h2>
            <div className="mt-2">{staffPicks.map((article, index) => <NumberedPick key={article.id} article={article} index={index + 1} />)}</div>
          </div>
          <div className="bg-[#FF4F87] p-6 text-black">
            <p className="text-[10px] font-black uppercase tracking-[0.17em]">Built for Fiji business</p>
            <h3 className="mt-3 text-3xl font-black uppercase leading-none tracking-[-0.05em]">Less noise. More useful context.</h3>
            <p className="mt-4 text-sm font-semibold leading-6 text-black/65">Every publishable story is filtered for relevance and verified before it reaches this page.</p>
            <Link href="/editorial-standards" className="mt-5 inline-block border-b-2 border-black pb-1 text-xs font-black uppercase tracking-[0.12em]">How we publish</Link>
          </div>
        </aside>
      </section>
      <NewsFooter />
    </main>
  );
}
