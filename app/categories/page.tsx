import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { NewsFooter, NewsHeader } from "@/components/public-news/news-shell";
import { categoryColor, StoryCard } from "@/components/public-news/framagz-ui";
import { getPublishedArticles, siteUrl, TOPIC_HUBS } from "@/lib/news/public";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Categories", description: "Browse Aura Digital Intelligence by topic.", alternates: { canonical: `${siteUrl()}/categories` } };

export default async function CategoriesPage() {
  const articles = await getPublishedArticles(120);
  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <NewsHeader />
      <section className="adi-noise border-b border-white/10"><div className="mx-auto max-w-[1480px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Explore the desk</p><h1 className="mt-3 text-6xl font-black uppercase leading-[.85] tracking-[-0.07em] sm:text-8xl lg:text-[8rem]">Categories</h1></div></section>
      <section className="mx-auto max-w-[1480px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="space-y-16">
          {TOPIC_HUBS.map((topic) => {
            const keys = topic.keywords.map((k) => k.toLowerCase());
            const topicArticles = articles.filter((article) => keys.some((k) => `${article.category || ""} ${article.title} ${article.excerpt || ""}`.toLowerCase().includes(k))).slice(0, 3);
            const accent = categoryColor(topic.label);
            return (
              <section key={topic.slug} className="adi-reveal">
                <div className="mb-6 flex items-end justify-between gap-4 border-t-4 border-white pt-5" style={{ borderTopColor: accent }}><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Topic desk</p><h2 className="mt-1 text-4xl font-black uppercase tracking-[-0.055em] sm:text-5xl">{topic.label}</h2></div><Link href={`/news/topic/${topic.slug}`} className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-white/50 hover:text-white">View all <ArrowUpRight size={13}/></Link></div>
                {topicArticles.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{topicArticles.map((article) => <StoryCard key={article.id} article={article} compact />)}</div> : <div className="border border-dashed border-white/15 bg-[#0c0c0c] p-8 text-sm text-white/38">This desk is monitoring new stories. Published coverage will appear here automatically.</div>}
              </section>
            );
          })}
        </div>
      </section>
      <NewsFooter />
    </main>
  );
}
