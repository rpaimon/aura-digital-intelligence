import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { LeadCarousel } from "@/components/public-news/lead-carousel";
import { NewsFooter, NewsHeader } from "@/components/public-news/news-shell";
import { NumberedPick, SectionHeading, StoryCard, StoryRow, formatNewsDate, headlineLengthClass } from "@/components/public-news/framagz-ui";
import { articlePath, displayCategory, fijiLeadHeadline, getPublishedArticles, siteUrl } from "@/lib/news/public";

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
  const leadArticles = articles.slice(0, 3);
  const topStories = articles.slice(3, 7);
  const latest = articles.slice(7, 14);
  const staffPicks = articles.slice(0, 4);
  const ai = topicArticles(articles, "Artificial Intelligence");
  const cyber = topicArticles(articles, "Cybersecurity");
  const business = topicArticles(articles, "Business");
  const fiji = topicArticles(articles, "Fiji + Pacific");

  const leadSlides = leadArticles.map((article) => ({
    id: article.id,
    href: articlePath(article),
    category: displayCategory(article),
    date: formatNewsDate(article.published_at),
    title: fijiLeadHeadline(article),
    imageUrl: article.featured_image_url,
    imageAlt: article.featured_image_alt || article.title,
  }));

  return (
    <main className="adi-public-shell min-h-screen">
      <NewsHeader />

      {leadSlides.length > 0 ? (
        <section className="border-b border-white/10">
          <div className="adi-wide-shell px-0 sm:px-6 lg:px-8">
            <LeadCarousel slides={leadSlides} />
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
        <div className="grid xl:grid-cols-[minmax(0,1fr)_330px] xl:gap-10">
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

            <div className="adi-aura-editorial mt-8">
              <div className="flex items-center justify-between gap-3">
                <div><p className="adi-kicker">Published by</p><h3 className="mt-1 text-xl font-black tracking-[-0.045em]">Aura Digital Fiji</h3></div>
                <span className="adi-aura-monogram" aria-hidden="true">A</span>
              </div>
              <p className="mt-4 text-sm leading-7 opacity-65">Aura Intelligence explains the signal. Aura Digital Fiji helps businesses turn it into a working digital system.</p>
              <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] font-black uppercase tracking-[0.11em]">
                <a href="https://auradigitalfiji.com" className="border-t border-current/20 pt-2">Web & ecommerce</a>
                <a href="https://auradigitalfiji.com" className="border-t border-current/20 pt-2">Security & care</a>
                <a href="https://auradigitalfiji.com" className="border-t border-current/20 pt-2">Business email</a>
                <a href="https://auradigitalfiji.com" className="border-t border-current/20 pt-2">Apps & IT systems</a>
              </div>
              <a href="https://auradigitalfiji.com" className="mt-5 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.13em]">Visit Aura Digital Fiji <ArrowUpRight size={14}/></a>
            </div>

            <div className="mt-8 border-t border-white/10 pt-7">
              <p className="adi-kicker">Publication standard</p>
              <p className="mt-3 text-sm leading-7 text-white/48">Every published article passes independent-source verification, originality checks and a final quality gate.</p>
              <Link href="/editorial-standards" className="mt-4 inline-flex text-[10px] font-black uppercase tracking-[0.13em] text-white">Read our standards →</Link>
            </div>
          </aside>
        </div>
      </section>

      <NewsFooter />
    </main>
  );
}
