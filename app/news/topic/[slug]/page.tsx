import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { NewsFooter, NewsHeader } from "@/components/public-news/news-shell";
import { SectionHeading, StoryCard, StoryRow } from "@/components/public-news/framagz-ui";
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
  const [lead, ...rest] = articles;
  const gridStories = rest.slice(0, 4);
  const rowStories = rest.slice(4);

  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <NewsHeader />

      <section className="adi-noise border-b border-white/10">
        <div className="mx-auto max-w-[1480px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <p className="adi-kicker">Topic desk</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <h1 className="adi-hero-title font-black text-white">{topic.label}</h1>
            <p className="max-w-md text-sm leading-7 text-white/48 lg:text-right">Verified developments and practical context selected for Fiji businesses and the wider Pacific.</p>
          </div>
          <div className="mt-6 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link href="/news" className="adi-chip min-w-max transition hover:border-white/25 hover:bg-white hover:text-black">All News</Link>
            {TOPIC_HUBS.filter((t)=>t.slug!==slug).map((t)=><Link key={t.slug} href={`/news/topic/${t.slug}`} className="adi-chip min-w-max transition hover:border-white/25 hover:bg-white hover:text-black">{t.label}</Link>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1480px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {articles.length ? (
          <div className="space-y-8">
            {lead && (
              <div className="adi-panel p-4 sm:p-5">
                <SectionHeading eyebrow="Feature" title="Lead coverage" />
                <StoryCard article={lead} />
              </div>
            )}
            {gridStories.length > 0 && (
              <div className="adi-panel p-4 sm:p-5">
                <SectionHeading eyebrow="Explore" title="Featured stories" />
                <div className="adi-story-grid-dense">{gridStories.map((article)=><StoryCard key={article.id} article={article} compact />)}</div>
              </div>
            )}
            {rowStories.length > 0 && (
              <div className="adi-panel p-4 sm:p-5">
                <SectionHeading eyebrow="Latest" title="More from this desk" />
                <div className="space-y-3">{rowStories.map((article)=><StoryRow key={article.id} article={article} />)}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-[1.4rem] border border-dashed border-white/16 bg-[#0d1218] p-10 text-center"><h2 className="text-2xl font-black">Monitoring this desk</h2><p className="mt-3 text-sm text-white/40">No published stories yet. Verified coverage will appear here automatically.</p></div>
        )}
        <div className="mt-10 flex justify-end"><Link href="/categories" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-white/45 hover:text-white">Browse all categories <ArrowUpRight size={13}/></Link></div>
      </section>
      <NewsFooter />
    </main>
  );
}
