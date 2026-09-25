import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { NewsFooter, NewsHeader } from "@/components/public-news/news-shell";
import { NumberedPick, SectionHeading, StoryCard, StoryRow, StoryVisual, CategoryChip, formatNewsDate } from "@/components/public-news/framagz-ui";
import { articlePath, displayCategory, getPublishedArticles, siteUrl } from "@/lib/news/public";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fiji Technology News & Business Intelligence",
  description: "Verified AI, cybersecurity, cloud, ecommerce and digital-business news translated into practical context for Fiji businesses.",
  alternates: { canonical: siteUrl() },
  openGraph: {
    type: "website",
    siteName: "Aura Digital Intelligence",
    title: "Aura Digital Intelligence",
    description: "Technology news and business intelligence for Fiji and the Pacific.",
    url: siteUrl(),
    images: [{ url: `${siteUrl()}/opengraph-image`, width: 1200, height: 630, type: "image/png", alt: "Aura Digital Intelligence" }],
  },
  twitter: { card: "summary_large_image", title: "Aura Digital Intelligence", description: "Technology news and business intelligence for Fiji and the Pacific.", images: [`${siteUrl()}/opengraph-image`] },
};

function topicArticles(articles: Awaited<ReturnType<typeof getPublishedArticles>>, category: ReturnType<typeof displayCategory>, limit = 4) {
  return articles.filter((article) => displayCategory(article) === category).slice(0, limit);
}

function TopicRail({ title, href, articles }: { title: string; href: string; articles: Awaited<ReturnType<typeof getPublishedArticles>> }) {
  if (!articles.length) return null;
  return (
    <section className="border-t border-white/10 py-8 sm:py-10">
      <SectionHeading eyebrow="Topic desk" title={title} href={href} />
      <div className="adi-topic-rail edge sm:px-0">
        {articles.map((article) => <StoryCard key={article.id} article={article} compact />)}
      </div>
    </section>
  );
}

export default async function Home() {
  const articles = await getPublishedArticles(60);
  const lead = articles[0];
  const topStories = articles.slice(1, 4);
  const latest = articles.slice(4, 11);
  const staffPicks = articles.slice(0, 4);
  const ai = topicArticles(articles, "Artificial Intelligence");
  const cyber = topicArticles(articles, "Cybersecurity");
  const business = topicArticles(articles, "Business");
  const fiji = topicArticles(articles, "Fiji + Pacific");

  return (
    <main className="adi-public-shell min-h-screen">
      <NewsHeader />

      {lead ? (
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-[1320px] px-0 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(400px,.95fr)] lg:items-stretch">
              <Link href={articlePath(lead)} className="adi-story-media block min-h-[280px] sm:min-h-[420px] lg:min-h-[500px]">
                <StoryVisual article={lead} className="h-full min-h-[280px] sm:min-h-[420px] lg:min-h-[500px]" />
              </Link>
              <div className="flex min-w-0 flex-col justify-between border-t border-white/10 px-4 py-6 sm:px-0 sm:py-8 lg:border-l lg:border-t-0 lg:border-white/10 lg:px-9 lg:py-10">
                <div>
                  <div className="flex flex-wrap items-center gap-3"><CategoryChip label={displayCategory(lead)} /><span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/34">{formatNewsDate(lead.published_at)}</span></div>
                  <p className="adi-kicker mt-6">Lead intelligence</p>
                  <h1 className="adi-lead-title adi-title-balance mt-3 text-white"><Link href={articlePath(lead)}>{lead.title}</Link></h1>
                  {lead.excerpt && <p className="mt-5 max-w-xl text-[.96rem] leading-7 text-white/52 sm:text-[1.02rem]">{lead.excerpt}</p>}
                </div>
                <Link href={articlePath(lead)} className="mt-6 inline-flex w-fit items-center gap-2 border-b border-white pb-1 text-[11px] font-black uppercase tracking-[0.13em] text-white">Read the story <ArrowRight size={14}/></Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="adi-noise border-b border-white/10 px-4 py-20 text-center"><h1 className="adi-display">Aura Intelligence</h1><p className="mt-4 text-white/45">Verified technology coverage will appear here automatically.</p></section>
      )}

      {topStories.length > 0 && (
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-[1320px] px-0 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3">
              {topStories.map((article, index) => (
                <article key={article.id} className={`adi-story-card group px-4 py-5 sm:px-5 md:py-7 ${index ? "border-t md:border-l md:border-t-0" : ""} border-white/10`}>
                  <div className="flex items-center justify-between gap-3"><span className="adi-kicker">Top story {String(index + 1).padStart(2,"0")}</span><span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/28">{displayCategory(article)}</span></div>
                  <h2 className="adi-title-balance mt-3 text-[1.35rem] font-black leading-[1.04] tracking-[-0.05em] sm:text-[1.55rem]"><Link href={articlePath(article)}>{article.title}</Link></h2>
                  {article.excerpt && <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/46">{article.excerpt}</p>}
                  <Link href={articlePath(article)} className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.13em] text-white/55">Open story <ArrowUpRight size={12}/></Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-[1320px] px-0 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
          <div className="min-w-0">
            {latest.length > 0 && (
              <section className="py-8 sm:py-10">
                <SectionHeading eyebrow="Now" title="Latest intelligence" href="/news" />
                <div>{latest.map((article) => <StoryRow key={article.id} article={article} />)}</div>
              </section>
            )}

            <TopicRail title="Artificial Intelligence" href="/news/topic/ai" articles={ai} />
            <TopicRail title="Cybersecurity" href="/news/topic/cybersecurity" articles={cyber} />
            <TopicRail title="Business Technology" href="/news/topic/business-tech" articles={business} />
            <TopicRail title="Fiji & Pacific" href="/news/topic/fiji-pacific" articles={fiji} />
          </div>

          <aside className="border-t border-white/10 px-4 py-8 sm:px-0 lg:sticky lg:top-32 lg:self-start lg:border-t-0 lg:py-10">
            <p className="adi-kicker">Trending</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.055em]">Reader picks</h2>
            <div className="mt-4">{staffPicks.map((article, index) => <NumberedPick key={article.id} article={article} index={index + 1} />)}</div>
            <div className="mt-8 border-t border-white/10 pt-7">
              <p className="adi-kicker">Aura Digital Fiji</p>
              <h3 className="mt-3 text-2xl font-black leading-tight tracking-[-0.045em]">Turn technology into something useful.</h3>
              <p className="mt-3 text-sm leading-7 text-white/48">Websites, ecommerce, mobile apps, business email, security and IT systems — built for businesses in Fiji.</p>
              <a href="https://auradigitalfiji.com" className="mt-5 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.13em] text-white">Visit Aura Digital Fiji <ArrowUpRight size={15}/></a>
            </div>
            <div className="mt-8 border-t border-white/10 pt-7">
              <p className="adi-kicker">Publication standard</p>
              <p className="mt-3 text-sm leading-7 text-white/48">Every published article passes independent-source verification, originality checks and a final quality gate.</p>
              <Link href="/editorial-standards" className="mt-4 inline-flex text-[10px] font-black uppercase tracking-[0.13em] text-white">Read our standards →</Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="adi-aura-band mt-2">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div><p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">From insight to implementation</p><h2 className="mt-2 max-w-3xl text-3xl font-black leading-[.98] tracking-[-0.055em] sm:text-4xl">Aura Digital Fiji helps businesses build the systems behind the headlines.</h2></div>
          <a href="https://auradigitalfiji.com" className="inline-flex shrink-0 items-center gap-2 border-b-2 border-current pb-1 text-xs font-black uppercase tracking-[0.12em]">Explore Aura Digital Fiji <ArrowUpRight size={14}/></a>
        </div>
      </section>

      <NewsFooter />
    </main>
  );
}
