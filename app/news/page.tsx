import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock3, Radar, ShieldCheck, Sparkles } from "lucide-react";
import { NewsFooter, NewsHeader } from "@/components/public-news/news-shell";
import { getPublishedArticles, readingTime, siteUrl } from "@/lib/news/public";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Technology Intelligence for Fiji & the Pacific",
  description: "Verified AI, cybersecurity, cloud and digital-business intelligence for Fiji and the Pacific.",
  alternates: { canonical: `${siteUrl()}/news` },
  openGraph: {
    type: "website",
    title: "Aura Digital Intelligence",
    description: "Signals worth your attention. Verified technology intelligence for Fiji and the Pacific.",
    url: `${siteUrl()}/news`,
  },
};

function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-FJ", { day: "numeric", month: "short", year: "numeric" });
}

export default async function NewsPage() {
  const articles = await getPublishedArticles(36);
  const featured = articles[0];
  const latest = articles.slice(1, 4);
  const rest = articles.slice(4);
  const categories = Array.from(new Set(articles.map((article) => article.category).filter(Boolean))) as string[];

  return (
    <main className="min-h-screen overflow-hidden bg-[#07090d] text-white">
      <NewsHeader />

      <section className="relative border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-lime-300/10 blur-[110px]" />
          <div className="absolute right-[-8rem] top-[-4rem] h-96 w-96 rounded-full bg-cyan-300/[0.06] blur-[130px]" />
          <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.16)_1px,transparent_1px)] [background-size:64px_64px]" />
        </div>

        <div className="relative mx-auto max-w-[1440px] px-4 pb-12 pt-14 sm:px-6 sm:pb-16 sm:pt-20 lg:px-8 lg:pt-24">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/[0.07] px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-lime-200 sm:text-xs">
                <Radar size={14} /> Fiji · Pacific · Global Technology
              </div>
              <h1 className="mt-6 max-w-5xl text-[3.25rem] font-black leading-[0.92] tracking-[-0.065em] sm:text-7xl lg:text-[6.5rem]">
                Signals worth <span className="text-lime-300">your attention.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/55 sm:text-lg sm:leading-8">AI, cybersecurity, cloud, ecommerce and digital-business developments — filtered for relevance, independently checked and translated into useful context for Fiji and the Pacific.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur sm:p-5">
                <ShieldCheck className="text-lime-300" size={20} />
                <p className="mt-3 text-sm font-black">Verification before publication</p>
                <p className="mt-1.5 text-xs leading-5 text-white/45">Independent-source fact checks gate every publishable story.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur sm:p-5">
                <Sparkles className="text-lime-300" size={20} />
                <p className="mt-3 text-sm font-black">Original reporting synthesis</p>
                <p className="mt-1.5 text-xs leading-5 text-white/45">Articles are written from verified facts and checked for excessive phrase overlap.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur sm:p-5">
                <Radar className="text-lime-300" size={20} />
                <p className="mt-3 text-sm font-black">Pacific context</p>
                <p className="mt-1.5 text-xs leading-5 text-white/45">Global signals are scored for business and regional relevance.</p>
              </div>
            </div>
          </div>

          {categories.length > 0 && (
            <div className="mt-10 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <span className="shrink-0 rounded-full bg-white px-4 py-2 text-xs font-black text-black">All intelligence</span>
              {categories.slice(0, 8).map((category) => (
                <span key={category} className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/55">{category}</span>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {featured ? (
          <div className="grid gap-5 xl:grid-cols-[1.65fr_.85fr]">
            <article className="group relative min-h-[470px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#10141b] sm:min-h-[560px]">
              {featured.featured_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={featured.featured_image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55 transition duration-700 group-hover:scale-[1.025]" />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(190,242,100,.18),transparent_34%),radial-gradient(circle_at_80%_70%,rgba(34,211,238,.12),transparent_38%),linear-gradient(135deg,#111722,#080b10)]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#07090d] via-[#07090d]/45 to-transparent" />
              <div className="relative flex h-full min-h-[470px] flex-col justify-end p-6 sm:min-h-[560px] sm:p-10 lg:p-12">
                <div className="mb-auto flex items-center justify-between gap-4">
                  <span className="rounded-full border border-white/15 bg-black/25 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-lime-200 backdrop-blur">Featured signal</span>
                  <span className="text-xs font-bold text-white/55">{featured.category || "Technology"}</span>
                </div>
                <div className="max-w-4xl">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-white/45"><span>{formatDate(featured.published_at)}</span><span>•</span><span>{readingTime(featured.excerpt)} min read</span></div>
                  <h2 className="mt-4 text-3xl font-black leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-6xl"><Link href={`/news/${featured.slug}`}>{featured.title}</Link></h2>
                  {featured.excerpt && <p className="mt-5 max-w-2xl text-sm leading-6 text-white/60 sm:text-base sm:leading-7">{featured.excerpt}</p>}
                  <Link href={`/news/${featured.slug}`} className="mt-7 inline-flex items-center gap-2 rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-[#0a0c0f] transition hover:bg-lime-200">Read the intelligence <ArrowRight size={16} /></Link>
                </div>
              </div>
            </article>

            <aside className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-300">Latest</p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">Fresh signals</h2>
                </div>
                <Radar size={22} className="text-white/30" />
              </div>
              <div className="divide-y divide-white/10">
                {latest.length ? latest.map((article, index) => (
                  <article key={article.id} className="group py-5 first:pt-5">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/35"><span className="text-lime-300">0{index + 1}</span><span>{article.category || "Technology"}</span></div>
                    <h3 className="mt-2 text-lg font-black leading-snug tracking-[-0.025em] text-white/90 transition group-hover:text-lime-200"><Link href={`/news/${article.slug}`}>{article.title}</Link></h3>
                    <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-white/35"><Clock3 size={12} /> {readingTime(article.excerpt)} min · {formatDate(article.published_at)}</div>
                  </article>
                )) : <p className="py-8 text-sm leading-6 text-white/40">More verified signals will appear here as the newsroom clears them for publication.</p>}
              </div>
            </aside>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-[2rem] border border-dashed border-white/15 bg-white/[0.03] p-10 text-center sm:p-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(190,242,100,.08),transparent_38%)]" />
            <div className="relative mx-auto max-w-xl">
              <Radar className="mx-auto text-lime-300" size={34} />
              <h2 className="mt-5 text-3xl font-black tracking-[-0.04em]">The newsroom is listening.</h2>
              <p className="mt-3 leading-7 text-white/45">Stories will appear here only after they clear the verification, originality and quality gates.</p>
            </div>
          </div>
        )}
      </section>

      {rest.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-4 pb-20 pt-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-4 border-t border-white/10 pt-8">
            <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-300">Intelligence stream</p><h2 className="mt-2 text-3xl font-black tracking-[-0.045em] sm:text-4xl">More worth knowing</h2></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rest.map((article) => (
              <article key={article.id} className="group flex min-h-[300px] flex-col rounded-3xl border border-white/10 bg-white/[0.035] p-6 transition hover:-translate-y-1 hover:border-lime-300/20 hover:bg-white/[0.055]">
                <div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.14em] text-white/35"><span className="text-lime-300">{article.category || "Technology"}</span><span>{formatDate(article.published_at)}</span></div>
                <h3 className="mt-5 text-2xl font-black leading-tight tracking-[-0.035em] text-white/92"><Link href={`/news/${article.slug}`}>{article.title}</Link></h3>
                {article.excerpt && <p className="mt-4 line-clamp-3 text-sm leading-6 text-white/45">{article.excerpt}</p>}
                <div className="mt-auto flex items-center justify-between gap-3 pt-7 text-xs font-bold"><span className="inline-flex items-center gap-1.5 text-white/35"><Clock3 size={13} /> {readingTime(article.excerpt)} min</span><Link href={`/news/${article.slug}`} className="inline-flex items-center gap-1.5 text-white transition group-hover:text-lime-300">Read <ArrowRight size={14} /></Link></div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="border-t border-white/10 bg-[#090c11]">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-14 sm:px-6 md:grid-cols-[.85fr_1.15fr] lg:px-8 lg:py-20">
          <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-300">Why Aura Intelligence</p><h2 className="mt-3 text-3xl font-black tracking-[-0.045em] sm:text-4xl">Less noise. More signal.</h2></div>
          <p className="max-w-2xl text-base leading-8 text-white/48">This newsroom is designed to filter aggressively. Discovery does not equal publication. Stories are scored for importance and relevance, researched, independently fact-checked, checked for originality and sent through a final quality gate before they can appear here.</p>
        </div>
      </section>

      <NewsFooter />
    </main>
  );
}
