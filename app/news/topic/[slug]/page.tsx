import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NewsFooter, NewsHeader } from "@/components/public-news/news-shell";
import { EditorialLead, SectionHeading, StoryCard, StoryRow } from "@/components/public-news/framagz-ui";
import { getPublishedArticlesForTopic, siteUrl, topicBySlug, TOPIC_HUBS } from "@/lib/news/public";

export const dynamic = "force-dynamic";
type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const topic = topicBySlug(slug);
  if (!topic) return { title: "Topic not found" };
  const title = `${topic.label} News & Intelligence for Fiji`;
  const description = `Verified ${topic.label.toLowerCase()} news, analysis and practical business context for Fiji and the Pacific.`;
  return { title, description, alternates: { canonical: `${siteUrl()}/news/topic/${topic.slug}` }, openGraph: { title, description, url: `${siteUrl()}/news/topic/${topic.slug}`, type: "website", siteName: "Aura Digital Intelligence", images: [{ url: `${siteUrl()}/opengraph-image`, width: 1200, height: 630, type: "image/png" }] }, twitter: { card: "summary_large_image", title, description, images: [`${siteUrl()}/opengraph-image`] } };
}

export default async function TopicPage({ params }: { params: Params }) {
  const { slug } = await params;
  const topic = topicBySlug(slug);
  if (!topic) notFound();
  const articles = await getPublishedArticlesForTopic(slug, 60);
  const [lead, ...rest] = articles;
  const grid = rest.slice(0, 6);
  const rows = rest.slice(6);

  return (
    <main className="adi-public-shell min-h-screen">
      <NewsHeader />
      <section className="border-b border-white/10"><div className="adi-wide-shell px-4 py-9 sm:px-6 lg:px-8 lg:py-12"><p className="adi-kicker">Topic desk</p><h1 className="adi-display mt-3 max-w-5xl text-white">{topic.label}</h1><p className="mt-5 max-w-2xl text-sm leading-7 text-white/48">Verified developments and practical context selected for Fiji businesses and the wider Pacific.</p><div className="mt-7 flex gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"><Link href="/news" className="shrink-0 text-[10px] font-black uppercase tracking-[0.15em] text-white/42 hover:text-white">All News</Link>{TOPIC_HUBS.filter((t)=>t.slug!==slug).map((t)=><Link key={t.slug} href={`/news/topic/${t.slug}`} className="shrink-0 text-[10px] font-black uppercase tracking-[0.15em] text-white/42 hover:text-white">{t.label}</Link>)}</div></div></section>
      <section className="adi-wide-shell px-0 sm:px-6 lg:px-8">
        {articles.length ? <div>
          {lead && <div className="border-b border-white/10 py-8 sm:py-10"><SectionHeading eyebrow="Lead coverage" title="Start here" /><EditorialLead article={lead}/></div>}
          {grid.length > 0 && <div className="border-b border-white/10 py-8 sm:py-10"><SectionHeading eyebrow="Featured" title={`More ${topic.label}`} /><div className="adi-story-grid three">{grid.map((article)=><StoryCard key={article.id} article={article} compact />)}</div></div>}
          {rows.length > 0 && <div className="py-8 sm:py-10"><SectionHeading eyebrow="Latest" title="Full stream" /><div>{rows.map((article)=><StoryRow key={article.id} article={article}/>)}</div></div>}
        </div> : <div className="px-4 py-16 text-center sm:px-0"><h2 className="text-2xl font-black">Monitoring this desk</h2><p className="mt-3 text-sm text-white/40">No published stories yet. Verified coverage will appear here automatically.</p></div>}
      </section>
      <NewsFooter />
    </main>
  );
}
