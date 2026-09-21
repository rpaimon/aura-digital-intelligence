import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { NewsFooter, NewsHeader } from "@/components/public-news/news-shell";
import { StoryCard, categoryColor } from "@/components/public-news/framagz-ui";
import { getPublishedArticlesForTopic, siteUrl, topicBySlug, TOPIC_HUBS } from "@/lib/news/public";

export const dynamic = "force-dynamic";
type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const topic = topicBySlug(slug);
  if (!topic) return { title: "Topic not found" };
  const title = `${topic.label} News & Intelligence for Fiji`;
  const description = `Verified ${topic.label.toLowerCase()} news, analysis and practical business context for Fiji and the Pacific.`;
  return { title, description, alternates: { canonical: `${siteUrl()}/news/topic/${topic.slug}` }, openGraph: { title, description, url: `${siteUrl()}/news/topic/${topic.slug}`, type: "website" } };
}

export default async function TopicPage({ params }: { params: Params }) {
  const { slug } = await params;
  const topic = topicBySlug(slug);
  if (!topic) notFound();
  const articles = await getPublishedArticlesForTopic(slug, 60);
  const accent = categoryColor(topic.label);
  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <NewsHeader />
      <section className="adi-noise border-b border-white/10"><div className="mx-auto max-w-[1480px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16"><p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: accent }}>Topic desk</p><h1 className="mt-3 max-w-6xl text-6xl font-black uppercase leading-[.86] tracking-[-0.07em] sm:text-8xl lg:text-[7.5rem]">{topic.label}</h1><p className="mt-6 max-w-2xl text-base leading-8 text-white/50">Verified developments and practical context selected for Fiji businesses and the wider Pacific.</p></div></section>
      <section className="mx-auto max-w-[1480px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-9 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"><Link href="/news" className="shrink-0 border border-white/12 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/55 hover:bg-white hover:text-black">All News</Link>{TOPIC_HUBS.filter((t)=>t.slug!==slug).map((t)=><Link key={t.slug} href={`/news/topic/${t.slug}`} className="shrink-0 border border-white/12 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/55 hover:bg-white hover:text-black">{t.label}</Link>)}</div>
        {articles.length ? <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{articles.map((article)=><StoryCard key={article.id} article={article}/>)}</div> : <div className="border border-dashed border-white/15 bg-[#0c0c0c] p-10 text-center"><h2 className="text-2xl font-black uppercase">Monitoring this desk</h2><p className="mt-3 text-sm text-white/40">No published stories yet. Verified coverage will appear here automatically.</p></div>}
        <div className="mt-12 flex justify-end"><Link href="/categories" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-white/45 hover:text-white">Browse all categories <ArrowUpRight size={13}/></Link></div>
      </section>
      <NewsFooter />
    </main>
  );
}
