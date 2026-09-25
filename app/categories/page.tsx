import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { NewsFooter, NewsHeader } from "@/components/public-news/news-shell";
import { StoryCard } from "@/components/public-news/framagz-ui";
import { displayCategory, getPublishedArticles, siteUrl, topicCategory, TOPIC_HUBS } from "@/lib/news/public";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Categories", description: "Browse Aura Digital Intelligence by topic.", alternates: { canonical: `${siteUrl()}/categories` } };

export default async function CategoriesPage() {
  const articles = await getPublishedArticles(120);
  return <main className="adi-public-shell min-h-screen"><NewsHeader/>
    <section className="border-b border-white/10"><div className="mx-auto max-w-[1480px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14"><p className="adi-kicker">Explore the newsroom</p><h1 className="adi-display mt-3">Categories</h1></div></section>
    <section className="mx-auto max-w-[1480px] px-0 sm:px-6 lg:px-8">
      {TOPIC_HUBS.map((topic,index)=>{const category=topicCategory(topic.slug);const topicArticles=category?articles.filter((article)=>displayCategory(article)===category).slice(0,4):[];return <section key={topic.slug} className={`py-8 sm:py-10 ${index ? "border-t border-white/10" : ""}`}><div className="mb-5 flex items-end justify-between gap-4 px-4 sm:px-0"><div><p className="adi-kicker">Topic desk</p><h2 className="adi-section-title mt-1">{topic.label}</h2></div><Link href={`/news/topic/${topic.slug}`} className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/48 hover:text-white">View all <ArrowUpRight size={13}/></Link></div>{topicArticles.length?<div className="adi-topic-rail edge sm:px-0">{topicArticles.map((article)=><StoryCard key={article.id} article={article} compact/>)}</div>:<div className="px-4 text-sm text-white/38 sm:px-0">This desk is monitoring new stories. Published coverage will appear here automatically.</div>}</section>})}
    </section><NewsFooter/></main>;
}
