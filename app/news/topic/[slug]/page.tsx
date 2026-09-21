import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock3 } from "lucide-react";
import { NewsFooter, NewsHeader } from "@/components/public-news/news-shell";
import { getPublishedArticlesForTopic, readingTime, siteUrl, topicBySlug } from "@/lib/news/public";

export const dynamic = "force-dynamic";
type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const topic = topicBySlug(slug);
  if (!topic) return { title: "Topic not found" };
  const title = `${topic.label} News & Intelligence for Fiji`;
  const description = `Verified ${topic.label.toLowerCase()} news, analysis and practical business context for Fiji and the Pacific.`;
  return {
    title,
    description,
    alternates: { canonical: `${siteUrl()}/news/topic/${topic.slug}` },
    openGraph: { title, description, url: `${siteUrl()}/news/topic/${topic.slug}`, type: "website" },
  };
}

function date(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-FJ", { timeZone: "Pacific/Fiji", day: "numeric", month: "short", year: "numeric" });
}

export default async function TopicPage({ params }: { params: Params }) {
  const { slug } = await params;
  const topic = topicBySlug(slug);
  if (!topic) notFound();
  const articles = await getPublishedArticlesForTopic(slug, 36);

  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <NewsHeader />
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_12%_0%,rgba(190,242,100,.11),transparent_34%)]">
        <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-300">Topic intelligence</p>
          <h1 className="mt-4 text-5xl font-black tracking-[-0.055em] sm:text-7xl">{topic.label}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/55">Verified developments and practical context selected for Fiji businesses and the Pacific.</p>
        </div>
      </section>
      <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <article key={article.id} className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]">
              {article.featured_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={article.featured_image_url} alt={article.featured_image_alt || ""} className="aspect-[16/9] w-full object-cover" />
              )}
              <div className="p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lime-300">{article.category || topic.label}</p>
                <h2 className="mt-3 text-xl font-black leading-snug tracking-[-0.03em]"><Link href={`/news/${article.slug}`} className="group-hover:text-lime-200">{article.title}</Link></h2>
                {article.excerpt && <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/45">{article.excerpt}</p>}
                <div className="mt-5 flex items-center justify-between text-[11px] font-bold text-white/30"><span>{date(article.published_at)}</span><span className="inline-flex items-center gap-1"><Clock3 size={12} /> {readingTime(article.excerpt)} min</span></div>
                <Link href={`/news/${article.slug}`} className="mt-5 inline-flex items-center gap-2 text-xs font-black text-white group-hover:text-lime-200">Read analysis <ArrowRight size={13} /></Link>
              </div>
            </article>
          ))}
        </div>
        {!articles.length && <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center text-white/45">No published {topic.label.toLowerCase()} articles yet. The newsroom is monitoring this topic.</div>}
      </section>
      <NewsFooter />
    </main>
  );
}
