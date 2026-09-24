import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Rss, ShieldCheck } from "lucide-react";
import { NewsFooter, NewsHeader } from "@/components/public-news/news-shell";
import { NumberedPick, SectionHeading, StoryCard, StoryRow, CategoryChip, formatNewsDate } from "@/components/public-news/framagz-ui";
import { articleFallbackImage, articlePath, auraServiceForArticle, displayCategory, getPublishedArticles, siteUrl } from "@/lib/news/public";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fiji Technology News & Business Intelligence",
  description: "Verified AI, cybersecurity, cloud, ecommerce and digital-business news translated into practical context for Fiji businesses.",
  alternates: { canonical: siteUrl() },
  openGraph: { type: "website", title: "Aura Digital Intelligence", description: "Technology news and business intelligence for Fiji and the Pacific.", url: siteUrl() },
};

function topicArticles(articles: Awaited<ReturnType<typeof getPublishedArticles>>, matcher: RegExp, limit = 4) {
  return articles.filter((a) => matcher.test(`${a.category || ""} ${a.title} ${a.excerpt || ""}`.toLowerCase())).slice(0, limit);
}

function TopicBlock({ title, href, articles }: { title: string; href: string; articles: Awaited<ReturnType<typeof getPublishedArticles>> }) {
  if (!articles.length) return null;
  const [feature, ...rest] = articles;
  return (
    <section className="adi-reveal adi-panel p-4 sm:p-5">
      <SectionHeading eyebrow="Topic desk" title={title} href={href} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)]">
        <StoryCard article={feature} compact />
        <div className="space-y-3">
          {rest.map((article) => <StoryRow key={article.id} article={article} showExcerpt={false} />)}
        </div>
      </div>
    </section>
  );
}

function AuraPanel({ leadTitle }: { leadTitle?: string }) {
  const cta = auraServiceForArticle({ title: leadTitle || "", category: "Technology", excerpt: "" });
  return (
    <div className="adi-panel overflow-hidden p-6 text-white sm:p-7">
      <p className="adi-kicker">Powered by Aura Digital Fiji</p>
      <h3 className="mt-3 text-2xl font-black tracking-[-0.05em]">Need help applying these trends to your business?</h3>
      <p className="mt-3 text-sm leading-7 text-white/52">Aura Digital Fiji builds websites, ecommerce, mobile apps, business email, IT systems and website security for businesses in Fiji.</p>
      <a href="https://auradigitalfiji.com" className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-white">Visit Aura Digital Fiji <ArrowUpRight size={13}/></a>
      <div className="mt-6 border-t border-white/10 pt-4 text-xs text-white/45">Popular service: <span className="font-bold text-white/75">{cta.serviceName}</span></div>
    </div>
  );
}

export default async function Home() {
  const articles = await getPublishedArticles(60);
  const lead = articles[0];
  const sideLead = articles.slice(1, 5);
  const latestRows = articles.slice(5, 11);
  const staffPicks = articles.slice(0, 4);
  const ai = topicArticles(articles, /\bai\b|artificial intelligence|machine learning|gemini|openai|anthropic/);
  const cyber = topicArticles(articles, /cyber|security|privacy|phishing|ransomware|hack/);
  const business = topicArticles(articles, /business|commerce|payment|retail|productivity|digital transformation/);
  const fiji = topicArticles(articles, /fiji|pacific|samoa|tonga|vanuatu|papua new guinea/);

  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <NewsHeader />

      <section className="adi-noise border-b border-white/10">
        <div className="mx-auto max-w-[1480px] px-4 pb-8 pt-7 sm:px-6 lg:px-8 lg:pb-10 lg:pt-10">
          <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/38">
            <span>Fiji · Pacific · Global Technology</span>
            <span>Verification first · compact newsroom</span>
          </div>
          <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
            <div>
              <p className="adi-kicker">Verified technology intelligence · Fiji first</p>
              <h1 className="adi-hero-title mt-3 max-w-4xl font-black text-white">The smarter daily read for Fiji business.</h1>
            </div>
            <p className="max-w-md text-sm leading-7 text-white/50 lg:justify-self-end lg:text-right">Clear stories, clean design, practical context. Technology shifts explained for businesses operating in Fiji and the Pacific.</p>
          </div>

          {lead ? (
            <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_390px]">
              <article className="adi-panel group overflow-hidden p-3 sm:p-4">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,.92fr)] lg:items-stretch">
                  <Link href={articlePath(lead)} className="overflow-hidden rounded-[1.4rem] bg-[#0e1218]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={lead.featured_image_url || articleFallbackImage(lead)} alt={lead.featured_image_alt || lead.title} className="aspect-[16/11] h-full w-full object-cover transition duration-1000 group-hover:scale-[1.03]" />
                  </Link>
                  <div className="flex flex-col justify-between p-1 sm:p-3">
                    <div>
                      <CategoryChip label={displayCategory(lead)} />
                      <p className="mt-4 text-[11px] font-black uppercase tracking-[0.13em] text-white/38">{formatNewsDate(lead.published_at)}</p>
                      <h2 className="adi-title-balance mt-4 text-[2rem] font-black leading-[1] tracking-[-0.06em] text-white sm:text-[2.45rem] lg:text-[3rem]">
                        <Link href={articlePath(lead)}>{lead.title}</Link>
                      </h2>
                      {lead.excerpt && <p className="mt-4 max-w-2xl text-sm leading-7 text-white/54 sm:text-[0.98rem]">{lead.excerpt}</p>}
                    </div>
                    <div className="mt-6 flex flex-wrap items-center gap-4">
                      <Link href={articlePath(lead)} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-black">Read story <ArrowRight size={14}/></Link>
                      <Link href="/news" className="text-[11px] font-black uppercase tracking-[0.12em] text-white/50 hover:text-white">Open full newsroom</Link>
                    </div>
                  </div>
                </div>
              </article>

              <aside className="space-y-4">
                <div className="adi-panel p-4 sm:p-5">
                  <SectionHeading eyebrow="Fresh now" title="Latest radar" href="/news" />
                  <div className="space-y-3">
                    {sideLead.map((article) => <StoryRow key={article.id} article={article} showExcerpt={false} />)}
                  </div>
                </div>
                <AuraPanel leadTitle={lead.title} />
              </aside>
            </div>
          ) : (
            <div className="mt-8 grid min-h-[300px] place-items-center rounded-[1.5rem] border border-dashed border-white/16 bg-[#0d1218] p-8 text-center">
              <div className="max-w-xl"><ShieldCheck className="mx-auto" size={34}/><h2 className="mt-5 text-3xl font-black">The newsroom is working.</h2><p className="mt-3 text-sm leading-7 text-white/45">The first story will appear after it clears verification, originality and the final quality gate.</p></div>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-[1480px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="adi-panel-soft p-4"><p className="adi-kicker">What makes this different</p><h3 className="mt-2 text-lg font-black tracking-[-0.04em]">Verified before publish</h3><p className="mt-2 text-sm leading-6 text-white/48">Every article must clear sourcing and quality gates before publication.</p></div>
          <div className="adi-panel-soft p-4"><p className="adi-kicker">Made for mobile</p><h3 className="mt-2 text-lg font-black tracking-[-0.04em]">More stories, less scrolling</h3><p className="mt-2 text-sm leading-6 text-white/48">Compact cards and horizontal layouts help readers see more news at once.</p></div>
          <div className="adi-panel-soft p-4"><p className="adi-kicker">For Fiji business</p><h3 className="mt-2 text-lg font-black tracking-[-0.04em]">Global signals, local meaning</h3><p className="mt-2 text-sm leading-6 text-white/48">We focus on what new technology means in real business terms for Fiji and the Pacific.</p></div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1480px] gap-8 px-4 pb-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8 lg:pb-16">
        <div className="space-y-8">
          <section className="adi-panel p-4 sm:p-5">
            <SectionHeading eyebrow="Latest" title="Stories you should not miss" href="/news" />
            <div className="space-y-3">
              {latestRows.map((article) => <StoryRow key={article.id} article={article} />)}
            </div>
          </section>
          <div className="grid gap-8 xl:grid-cols-2">
            <TopicBlock title="Artificial Intelligence" href="/news/topic/ai" articles={ai} />
            <TopicBlock title="Cybersecurity" href="/news/topic/cybersecurity" articles={cyber} />
            <TopicBlock title="Business Technology" href="/news/topic/business-tech" articles={business} />
            <TopicBlock title="Fiji & Pacific" href="/news/topic/fiji-pacific" articles={fiji} />
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-32 lg:self-start">
          <div className="adi-panel p-5">
            <SectionHeading eyebrow="Trending" title="Reader picks" />
            <div className="mt-2">
              {staffPicks.map((article, index) => <NumberedPick key={article.id} article={article} index={index + 1} />)}
            </div>
          </div>
          <div className="adi-panel overflow-hidden p-6 text-white">
            <Rss size={24}/>
            <p className="mt-5 adi-kicker">Never miss a thing</p>
            <h3 className="mt-2 text-3xl font-black leading-none tracking-[-0.05em]">Follow every verified update.</h3>
            <p className="mt-4 text-sm leading-7 text-white/52">Add Aura Intelligence to your RSS reader and get every published story automatically.</p>
            <a href="/rss.xml" className="mt-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-white">Open RSS Feed <ArrowUpRight size={13}/></a>
          </div>
        </aside>
      </section>

      <NewsFooter />
    </main>
  );
}
