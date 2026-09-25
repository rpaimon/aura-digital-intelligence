import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { NewsFooter, NewsHeader } from "@/components/public-news/news-shell";
import { NumberedPick, SectionHeading, StoryCard, StoryRow, StoryVisual, CategoryChip, formatNewsDate, headlineLengthClass } from "@/components/public-news/framagz-ui";
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
    <section className="border-t border-white/10 py-7 sm:py-9">
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
  const heroSecondary = articles.slice(1, 3);
  const topStories = articles.slice(3, 7);
  const latest = articles.slice(7, 14);
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
          <div className="adi-wide-shell px-0 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-[minmax(0,1.12fr)_minmax(380px,.88fr)] lg:items-stretch">
              <Link href={articlePath(lead)} className="adi-story-media hidden min-h-[420px] sm:block lg:min-h-[520px]">
                <StoryVisual article={lead} className="h-full min-h-[420px] lg:min-h-[520px]" />
              </Link>

              <div className="flex min-w-0 flex-col px-4 py-6 sm:px-0 sm:py-8 lg:border-l lg:border-white/10 lg:px-9 lg:py-9">
                <div className="flex flex-wrap items-center gap-3">
                  <CategoryChip label={displayCategory(lead)} />
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/34">{formatNewsDate(lead.published_at)}</span>
                </div>
                <p className="adi-kicker mt-5">Lead intelligence</p>
                <h1 className={`adi-lead-title ${headlineLengthClass(lead.title)} adi-title-balance mt-2 text-white`}><Link href={articlePath(lead)}>{lead.title}</Link></h1>
                {lead.excerpt && <p className="mt-4 max-w-2xl text-[.94rem] leading-6 text-white/52 sm:text-[1rem] sm:leading-7">{lead.excerpt}</p>}
                <Link href={articlePath(lead)} className="mt-5 inline-flex w-fit items-center gap-2 border-b border-white pb-1 text-[11px] font-black uppercase tracking-[0.13em] text-white">Read the story <ArrowRight size={14}/></Link>

                {heroSecondary.length > 0 && (
                  <div className="mt-6 grid gap-0 border-t border-white/10 sm:grid-cols-2 lg:mt-auto lg:grid-cols-1">
                    {heroSecondary.map((article, index) => (
                      <Link key={article.id} href={articlePath(article)} className={`group grid grid-cols-[1fr_auto] gap-4 py-4 ${index ? "border-t sm:border-l sm:border-t-0 lg:border-l-0 lg:border-t" : ""} border-white/10 sm:px-4 lg:px-0`}>
                        <div className="min-w-0">
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/34">Also important · {displayCategory(article)}</p>
                          <h2 className={`${headlineLengthClass(article.title)} adi-secondary-title adi-title-balance mt-1.5 font-black text-white`}>{article.title}</h2>
                        </div>
                        <ArrowUpRight size={14} className="mt-1 shrink-0 text-white/32 transition group-hover:text-white" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="adi-noise border-b border-white/10 px-4 py-20 text-center"><h1 className="adi-display">Aura Intelligence</h1><p className="mt-4 text-white/45">Verified technology coverage will appear here automatically.</p></section>
      )}

      {topStories.length > 0 && (
        <section className="border-b border-white/10">
          <div className="adi-wide-shell px-0 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 xl:grid-cols-4">
              {topStories.map((article, index) => (
                <article key={article.id} className={`adi-story-card group px-4 py-4 sm:px-5 sm:py-5 ${index ? "border-t sm:border-l sm:border-t-0" : ""} border-white/10`}>
                  <div className="flex items-center justify-between gap-3"><span className="adi-kicker">Top {String(index + 1).padStart(2,"0")}</span><span className="text-[9px] font-black uppercase tracking-[0.13em] text-white/28">{displayCategory(article)}</span></div>
                  <h2 className={`${headlineLengthClass(article.title)} adi-topstory-title adi-title-balance mt-2 font-black`}><Link href={articlePath(article)}>{article.title}</Link></h2>
                  <Link href={articlePath(article)} className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.13em] text-white/55">Open story <ArrowUpRight size={12}/></Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="adi-wide-shell px-0 sm:px-6 lg:px-8">
        <div className="grid xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-10">
          <div className="min-w-0">
            {latest.length > 0 && (
              <section className="py-7 sm:py-9">
                <SectionHeading eyebrow="Now" title="Latest intelligence" href="/news" />
                <div>{latest.map((article) => <StoryRow key={article.id} article={article} />)}</div>
              </section>
            )}

            <TopicRail title="Artificial Intelligence" href="/news/topic/ai" articles={ai} />
            <TopicRail title="Cybersecurity" href="/news/topic/cybersecurity" articles={cyber} />
            <TopicRail title="Business Technology" href="/news/topic/business-tech" articles={business} />
            <TopicRail title="Fiji & Pacific" href="/news/topic/fiji-pacific" articles={fiji} />
          </div>

          <aside className="border-t border-white/10 px-4 py-8 sm:px-0 xl:sticky xl:top-32 xl:self-start xl:border-t-0 xl:py-9">
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
        <div className="adi-wide-shell flex flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div><p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">From insight to implementation</p><h2 className="mt-2 max-w-4xl text-3xl font-black leading-[.98] tracking-[-0.055em] sm:text-4xl">Aura Digital Fiji helps businesses build the systems behind the headlines.</h2></div>
          <a href="https://auradigitalfiji.com" className="inline-flex shrink-0 items-center gap-2 border-b-2 border-current pb-1 text-xs font-black uppercase tracking-[0.12em]">Explore Aura Digital Fiji <ArrowUpRight size={14}/></a>
        </div>
      </section>

      <NewsFooter />
    </main>
  );
}
