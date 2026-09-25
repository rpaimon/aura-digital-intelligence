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
  const articles = query ? all.filter((a) => `${a.title} ${a.excerpt || ""} ${a.category || ""}`.toLowerCase().includes(query)) : all;
  const [lead, ...rest] = articles;
  const grid = rest.slice(0, 6);
  const rows = rest.slice(6);
  const staffPicks = all.slice(0, 4);

  return (
    <main className="min-h-screen bg-[#080a0d] text-white">
      <NewsHeader />

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-[1480px] px-4 py-9 sm:px-6 lg:px-8 lg:py-12">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
            <div><p className="adi-kicker">Newsroom archive</p><h1 className="adi-display mt-3 text-white">All news</h1></div>
            <form action="/news" method="get" className="flex items-center gap-3 border-b border-white/25 py-2">
              <Search size={17} className="text-white/40" />
              <input name="q" defaultValue={q} placeholder="Search stories..." className="min-w-0 flex-1 bg-transparent py-2 text-base font-bold text-white outline-none placeholder:text-white/28" />
              <button className="text-[10px] font-black uppercase tracking-[0.14em] text-white/55 hover:text-white">Search</button>
            </form>
          </div>
          <div className="mt-7 flex gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link href="/news" className="shrink-0 text-[10px] font-black uppercase tracking-[0.15em] text-white">All</Link>
            {TOPIC_HUBS.map((topic) => <Link key={topic.slug} href={`/news/topic/${topic.slug}`} className="shrink-0 text-[10px] font-black uppercase tracking-[0.15em] text-white/42 transition hover:text-white">{topic.label}</Link>)}
          </div>
          {query && <p className="mt-5 text-sm text-white/45">{articles.length} result{articles.length === 1 ? "" : "s"} for “{q}”.</p>}
        </div>
      </section>

      <section className="mx-auto max-w-[1480px] px-0 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
          <div className="min-w-0">
            {lead ? (
              <div className="border-b border-white/10 py-8 sm:py-10">
                <SectionHeading eyebrow={query ? "Best match" : "Newest"} title={query ? "Top result" : "Lead story"} />
                <StoryCard article={lead} />
              </div>
            ) : (
              <div className="px-4 py-16 text-center sm:px-0"><p className="text-2xl font-black">No stories found</p><p className="mt-3 text-sm text-white/45">Try a different search or explore a category.</p></div>
            )}

            {grid.length > 0 && (
              <div className="border-b border-white/10 py-8 sm:py-10">
                <SectionHeading eyebrow="Fresh" title="More from the newsroom" />
                <div className="adi-story-grid three">{grid.map((article) => <StoryCard key={article.id} article={article} compact />)}</div>
              </div>
            )}

            {rows.length > 0 && (
              <div className="py-8 sm:py-10"><SectionHeading eyebrow="Archive" title="Latest stream" /><div>{rows.map((article) => <StoryRow key={article.id} article={article} />)}</div></div>
            )}
          </div>

          <aside className="border-t border-white/10 px-4 py-8 sm:px-0 lg:sticky lg:top-32 lg:self-start lg:border-t-0 lg:py-10">
            <p className="adi-kicker">Trending</p><h2 className="mt-2 text-3xl font-black tracking-[-0.055em]">Reader picks</h2>
            <div className="mt-4">{staffPicks.map((article, index) => <NumberedPick key={article.id} article={article} index={index + 1} />)}</div>
            <div className="mt-10 border-t border-white/10 pt-7"><p className="adi-kicker">Why Aura Intelligence</p><p className="mt-3 text-sm leading-7 text-white/48">Global technology reporting filtered for practical relevance to businesses in Fiji and the Pacific.</p><Link href="/editorial-standards" className="mt-5 inline-block text-[10px] font-black uppercase tracking-[0.13em] text-white">How we publish →</Link></div>
          </aside>
        </div>
      </section>

      <NewsFooter />
    </main>
  );
}
