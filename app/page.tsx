import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Rss, ShieldCheck } from "lucide-react";
import { NewsFooter, NewsHeader } from "@/components/public-news/news-shell";
import { NumberedPick, SectionHeading, StoryCard, categoryColor, formatNewsDate } from "@/components/public-news/framagz-ui";
import { getPublishedArticles, siteUrl } from "@/lib/news/public";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fiji Technology News & Business Intelligence",
  description: "Verified AI, cybersecurity, cloud, ecommerce and digital-business news translated into practical context for Fiji businesses.",
  alternates: { canonical: siteUrl() },
  openGraph: { type: "website", title: "Aura Digital Intelligence", description: "Technology news and business intelligence for Fiji and the Pacific.", url: siteUrl() },
};

function topicArticles(articles: Awaited<ReturnType<typeof getPublishedArticles>>, matcher: RegExp, limit = 3) {
  return articles.filter((a) => matcher.test(`${a.category || ""} ${a.title} ${a.excerpt || ""}`.toLowerCase())).slice(0, limit);
}

function HotSection({ title, href, articles, accent }: { title: string; href: string; articles: Awaited<ReturnType<typeof getPublishedArticles>>; accent: string }) {
  if (!articles.length) return null;
  return (
    <section className="adi-reveal">
      <SectionHeading title={`What's hot in ${title}`} href={href} accent={accent} />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {articles.map((article) => <StoryCard key={article.id} article={article} compact />)}
      </div>
    </section>
  );
}

export default async function Home() {
  const articles = await getPublishedArticles(60);
  const lead = articles[0];
  const happenings = articles.slice(1, 5);
  const staffPicks = articles.slice(0, 3);
  const ai = topicArticles(articles, /\bai\b|artificial intelligence|machine learning|gemini|openai|anthropic/);
  const cyber = topicArticles(articles, /cyber|security|privacy|phishing|ransomware|hack/);
  const business = topicArticles(articles, /business|commerce|payment|retail|productivity|digital transformation/);
  const fiji = topicArticles(articles, /fiji|pacific|samoa|tonga|vanuatu|papua new guinea/);

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <NewsHeader />

      <section className="adi-noise border-b border-white/10">
        <div className="mx-auto max-w-[1480px] px-4 pb-8 pt-7 sm:px-6 lg:px-8 lg:pb-12 lg:pt-10">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4 text-[10px] font-black uppercase tracking-[0.16em] text-white/38">
            <span>Fiji · Pacific · Global Technology</span>
            <span className="hidden sm:inline">Independent-source verification · Business context</span>
          </div>
          <h1 className="adi-hero-title mt-8 font-black uppercase text-white">Today&apos;s<br/>Update</h1>

          {lead ? (
            <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_360px]">
              <article className="group relative min-h-[500px] overflow-hidden border border-white/12 bg-[#111] sm:min-h-[610px]">
                {lead.featured_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={lead.featured_image_url} alt={lead.featured_image_alt || lead.title} className="absolute inset-0 h-full w-full object-cover transition duration-1000 group-hover:scale-[1.035]" />
                ) : <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(38,198,218,.25),transparent_30%),linear-gradient(135deg,#242424,#090909)]" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
                <div className="relative flex min-h-[500px] flex-col justify-end p-5 sm:min-h-[610px] sm:p-8 lg:p-10">
                  <div className="mb-auto flex items-center justify-between gap-3">
                    <span className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-black" style={{ backgroundColor: categoryColor(lead.category) }}>{lead.category || "Technology"}</span>
                    <span className="bg-black/70 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/70 backdrop-blur">{formatNewsDate(lead.published_at)}</span>
                  </div>
                  <h2 className="max-w-5xl text-4xl font-black uppercase leading-[.92] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl"><Link href={`/news/${lead.slug}`}>{lead.title}</Link></h2>
                  {lead.excerpt && <p className="mt-5 max-w-2xl text-sm leading-7 text-white/62 sm:text-base">{lead.excerpt}</p>}
                  <Link href={`/news/${lead.slug}`} className="mt-6 inline-flex w-fit items-center gap-2 border-b-2 border-white pb-1 text-xs font-black uppercase tracking-[0.12em]">Read story <ArrowRight size={14}/></Link>
                </div>
              </article>

              <aside className="border border-white/12 bg-[#0b0b0b] p-5 sm:p-6">
                <div className="flex items-center justify-between border-b-4 border-white pb-4"><h2 className="text-xl font-black uppercase tracking-[-0.04em]">Staff Picks</h2><span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/30">Editor&apos;s desk</span></div>
                <div className="mt-2">{staffPicks.map((article, index) => <NumberedPick key={article.id} article={article} index={index + 1} />)}</div>
                <div className="mt-8 border-t border-white/10 pt-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.17em] text-white/32">Top contributor</p>
                  <Link href="/authors/aura-digital-intelligence" className="mt-4 flex items-center gap-4 group">
                    <div className="grid h-14 w-14 place-items-center rounded-full border border-white/15 bg-white text-sm font-black text-black">ADI</div>
                    <div><p className="font-black uppercase tracking-[-0.02em] group-hover:text-white/70">Aura Intelligence Desk</p><p className="mt-1 text-xs text-white/35">Technology Editor · Fiji</p></div>
                  </Link>
                </div>
              </aside>
            </div>
          ) : (
            <div className="mt-8 grid min-h-[440px] place-items-center border border-dashed border-white/18 bg-[#0d0d0d] p-8 text-center">
              <div className="max-w-xl"><ShieldCheck className="mx-auto" size={34}/><h2 className="mt-5 text-3xl font-black uppercase">The newsroom is working.</h2><p className="mt-3 text-sm leading-7 text-white/45">The first story will appear after it clears verification, originality and the final quality gate.</p></div>
            </div>
          )}
        </div>
      </section>

      {happenings.length > 0 && (
        <section className="border-b border-white/10 bg-[#0a0a0a]">
          <div className="mx-auto max-w-[1480px] px-4 py-10 sm:px-6 lg:px-8">
            <SectionHeading title="Happening Today!" accent="#FF4F87" />
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {happenings.map((article) => <StoryCard key={article.id} article={article} compact />)}
            </div>
            <div className="mt-8 flex justify-end"><Link href="/news" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.13em] text-white/55 hover:text-white">Read all posts <ArrowUpRight size={14}/></Link></div>
          </div>
        </section>
      )}

      <section className="mx-auto grid max-w-[1480px] gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8 lg:py-16">
        <div className="space-y-16">
          <HotSection title="AI" href="/news/topic/ai" articles={ai} accent="#25C8E0" />
          <HotSection title="Cybersecurity" href="/news/topic/cybersecurity" articles={cyber} accent="#FF4F87" />
          <HotSection title="Business" href="/news/topic/business-tech" articles={business} accent="#FF7142" />
          <HotSection title="Fiji & Pacific" href="/news/topic/fiji-pacific" articles={fiji} accent="#9D67FF" />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-32 lg:self-start">
          <div className="border border-white/12 bg-[#0c0c0c] p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.17em] text-white/32">Why this publication</p>
            <h2 className="mt-3 text-3xl font-black uppercase leading-none tracking-[-0.05em]">Global tech.<br/>Fiji context.</h2>
            <p className="mt-4 text-sm leading-7 text-white/48">We filter technology news for what actually matters to Fiji businesses, verify the claims and explain the practical impact.</p>
            <Link href="/about" className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-white">About the newsroom <ArrowUpRight size={13}/></Link>
          </div>

          <div className="bg-[#F6C945] p-6 text-black">
            <Rss size={24}/><p className="mt-5 text-[10px] font-black uppercase tracking-[0.17em]">Never miss a thing</p><h3 className="mt-2 text-3xl font-black uppercase leading-none tracking-[-0.05em]">Follow every verified update.</h3><p className="mt-4 text-sm font-semibold leading-6 text-black/65">Add Aura Intelligence to your RSS reader and get every published story automatically.</p><a href="/rss.xml" className="mt-6 inline-flex items-center gap-2 border-b-2 border-black pb-1 text-xs font-black uppercase tracking-[0.12em]">Open RSS Feed <ArrowUpRight size={13}/></a>
          </div>

          <div className="border border-white/12 bg-[#0c0c0c] p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.17em] text-white/32">Need the technology implemented?</p><h3 className="mt-3 text-2xl font-black uppercase leading-tight tracking-[-0.04em]">Turn the insight into a better business system.</h3><p className="mt-3 text-sm leading-6 text-white/45">Aura Digital Fiji builds websites, ecommerce, apps, business email, security and IT systems.</p><a href="https://auradigitalfiji.com?utm_source=aura_intelligence&utm_medium=homepage&utm_campaign=editorial_to_client" className="mt-5 inline-flex items-center gap-2 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-black">Visit Aura Digital Fiji <ArrowUpRight size={13}/></a>
          </div>
        </aside>
      </section>

      <NewsFooter />
    </main>
  );
}
