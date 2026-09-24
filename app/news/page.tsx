import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { NewsFooter, NewsHeader } from "@/components/public-news/news-shell";
import { NumberedPick, SectionHeading, StoryCard, StoryRow } from "@/components/public-news/framagz-ui";
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

  const [lead, ...rest] = articles;
  const staffPicks = all.slice(0, 4);
  const gridStories = rest.slice(0, 6);
  const latestRows = rest.slice(6);

  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <NewsHeader />

      <section className="adi-noise border-b border-white/10">
        <div className="mx-auto max-w-[1480px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <p className="adi-kicker">Aura Intelligence archive</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <h1 className="adi-hero-title font-black text-white">All news</h1>
            <p className="max-w-md text-sm leading-7 text-white/48 lg:text-right">Verified reporting across AI, cybersecurity, cloud, business technology and the Pacific.</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/news" className="adi-chip border-white/24 bg-white text-black">All</Link>
            {TOPIC_HUBS.map((topic) => <Link key={topic.slug} href={`/news/topic/${topic.slug}`} className="adi-chip transition hover:border-white/25 hover:bg-white hover:text-black">{topic.label}</Link>)}
          </div>
          <form action="/news" method="get" className="adi-panel mt-6 flex max-w-2xl items-center gap-3 px-4 py-3">
            <Search size={17} className="text-white/40" />
            <input name="q" defaultValue={q} placeholder="Search stories..." className="min-w-0 flex-1 bg-transparent py-2 text-base font-bold text-white outline-none placeholder:text-white/28" />
            <button className="rounded-full bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-black">Search</button>
          </form>
          {query && <p className="mt-4 text-sm text-white/45">{articles.length} result{articles.length === 1 ? "" : "s"} for “{q}”.</p>}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1480px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8 lg:py-12">
        <div className="space-y-8">
          {lead ? (
            <div className="adi-panel p-4 sm:p-5">
              <SectionHeading eyebrow={query ? "Search result highlight" : "Lead story"} title={query ? "Best match" : "Latest story"} />
              <StoryCard article={lead} />
            </div>
          ) : (
            <div className="rounded-[1.4rem] border border-dashed border-white/16 bg-[#0d1218] p-10 text-center">
              <p className="text-2xl font-black">No stories found</p>
              <p className="mt-3 text-sm text-white/45">Try a different search or explore a category.</p>
            </div>
          )}

          {gridStories.length > 0 && (
            <div className="adi-panel p-4 sm:p-5">
              <SectionHeading eyebrow="Browse" title="Fresh from the newsroom" />
              <div className="adi-story-grid-dense">
                {gridStories.map((article) => <StoryCard key={article.id} article={article} compact />)}
              </div>
            </div>
          )}

          {latestRows.length > 0 && (
            <div className="adi-panel p-4 sm:p-5">
              <SectionHeading eyebrow="Latest list" title={query ? "More matches" : "More stories"} />
              <div className="space-y-3">
                {latestRows.map((article) => <StoryRow key={article.id} article={article} />)}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-32 lg:self-start">
          <div className="adi-panel p-5">
            <SectionHeading eyebrow="Trending" title="Staff picks" />
            <div className="mt-2">{staffPicks.map((article, index) => <NumberedPick key={article.id} article={article} index={index + 1} />)}</div>
          </div>
          <div className="adi-panel p-6">
            <p className="adi-kicker">Built for Fiji business</p>
            <h3 className="mt-3 text-3xl font-black leading-none tracking-[-0.05em]">Less noise. More useful context.</h3>
            <p className="mt-4 text-sm leading-7 text-white/52">Every publishable story is filtered for relevance and verified before it reaches this page.</p>
            <Link href="/editorial-standards" className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-white">How we publish</Link>
          </div>
        </aside>
      </section>

      <NewsFooter />
    </main>
  );
}
