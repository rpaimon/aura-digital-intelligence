import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { NewsFooter, NewsHeader } from "@/components/public-news/news-shell";
import { StoryCard } from "@/components/public-news/framagz-ui";
import { getPublishedArticles, siteUrl, TOPIC_HUBS } from "@/lib/news/public";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Categories", description: "Browse Aura Digital Intelligence by topic.", alternates: { canonical: `${siteUrl()}/categories` } };

export default async function CategoriesPage() {
  const articles = await getPublishedArticles(120);
  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <NewsHeader />
      <section className="adi-noise border-b border-white/10"><div className="mx-auto max-w-[1480px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16"><p className="adi-kicker">Explore the desk</p><h1 className="adi-hero-title mt-3 font-black text-white">Categories</h1></div></section>
      <section className="mx-auto max-w-[1480px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="space-y-8">
          {TOPIC_HUBS.map((topic) => {
            const keys = topic.keywords.map((k) => k.toLowerCase());
            const topicArticles = articles.filter((article) => keys.some((k) => `${article.category || ""} ${article.title} ${article.excerpt || ""}`.toLowerCase().includes(k))).slice(0, 4);
            return (
              <section key={topic.slug} className="adi-panel p-4 sm:p-5">
                <div className="mb-5 flex items-end justify-between gap-4"><div><p className="adi-kicker">Topic desk</p><h2 className="mt-1 text-[1.8rem] font-black tracking-[-0.055em] sm:text-[2.2rem]">{topic.label}</h2></div><Link href={`/news/topic/${topic.slug}`} className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-white/50 hover:text-white">View all <ArrowUpRight size={13}/></Link></div>
                {topicArticles.length ? <div className="adi-story-grid-dense">{topicArticles.map((article) => <StoryCard key={article.id} article={article} compact />)}</div> : <div className="rounded-2xl border border-dashed border-white/15 bg-[#0c0f15] p-8 text-sm text-white/38">This desk is monitoring new stories. Published coverage will appear here automatically.</div>}
              </section>
            );
          })}
        </div>
      </section>
      <NewsFooter />
    </main>
  );
}
