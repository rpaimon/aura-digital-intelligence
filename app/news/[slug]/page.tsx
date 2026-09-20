import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3, ExternalLink, ShieldCheck } from "lucide-react";
import { ArticleMarkdown } from "@/components/public-news/article-markdown";
import { getPublishedArticleBySlug, readingTime, siteUrl, stripSourcesSection } from "@/lib/news/public";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) return { title: "Article not found" };

  const canonical = article.canonical_url || `${siteUrl()}/news/${article.slug}`;
  const title = article.seo_title || article.title;
  const description = article.seo_description || article.excerpt || "Verified technology intelligence from Aura Digital Intelligence.";

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      publishedTime: article.published_at || undefined,
      modifiedTime: article.updated_at || undefined,
      section: article.category || undefined,
      images: article.featured_image_url ? [{ url: article.featured_image_url }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: article.featured_image_url ? [article.featured_image_url] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) notFound();

  const content = stripSourcesSection(article.content);
  const canonical = article.canonical_url || `${siteUrl()}/news/${article.slug}`;
  const sources = article.article_sources ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.seo_description || article.excerpt || undefined,
    datePublished: article.published_at || undefined,
    dateModified: article.updated_at,
    mainEntityOfPage: canonical,
    articleSection: article.category || "Technology",
    author: {
      "@type": "Organization",
      name: article.authors?.name || "Aura Digital Intelligence",
      url: siteUrl(),
    },
    publisher: {
      "@type": "Organization",
      name: "Aura Digital Intelligence",
      url: siteUrl(),
    },
    image: article.featured_image_url ? [article.featured_image_url] : undefined,
  };

  return (
    <main className="min-h-screen bg-[#f7f5f2] text-[#101114]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <header className="border-b border-[#e5e1db] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
          <Link href="/news" className="inline-flex items-center gap-2 text-sm font-black"><ArrowLeft size={16} /> News</Link>
          <Link href="/" className="font-black tracking-tight">AURA <span className="font-normal">DIGITAL INTELLIGENCE</span></Link>
        </div>
      </header>

      <article className="mx-auto max-w-4xl px-6 pb-24 pt-14">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.13em] text-gray-500">
          <span>{article.category || "Technology"}</span>
          {article.published_at && <><span>•</span><time>{new Date(article.published_at).toLocaleDateString("en-FJ", { day: "numeric", month: "long", year: "numeric" })}</time></>}
          <span>•</span><span className="inline-flex items-center gap-1.5"><Clock3 size={13} /> {readingTime(content)} min read</span>
        </div>

        <h1 className="mt-5 text-4xl font-black tracking-[-0.05em] sm:text-6xl">{article.title}</h1>
        {article.subtitle && <p className="mt-5 text-xl font-bold leading-8 text-gray-600">{article.subtitle}</p>}
        {article.excerpt && <p className="mt-6 border-l-4 border-black pl-5 text-lg leading-8 text-gray-600">{article.excerpt}</p>}

        <div className="mt-8 flex items-center gap-2 rounded-2xl border border-[#ded9d2] bg-white px-4 py-3 text-sm font-bold text-gray-600">
          <ShieldCheck size={17} /> Published only after independent-source verification and final quality checks.
        </div>

        <div className="mt-12">
          <ArticleMarkdown content={content} />
        </div>

        {sources.length > 0 && (
          <section className="mt-14 border-t border-[#ded9d2] pt-8">
            <h2 className="text-2xl font-black">Sources</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">Independent coverage used by the fact-checking pipeline.</p>
            <div className="mt-5 space-y-3">
              {sources.map((source, index) => (
                <a key={source.id} href={source.source_url} target="_blank" rel="noreferrer noopener" className="flex items-start justify-between gap-4 rounded-2xl border border-[#e5e1db] bg-white p-4 hover:border-black/30">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-gray-500">Source {index + 1} · {source.source_name}</p>
                    <p className="mt-1 font-bold">{source.citation_text || "Independent reporting"}</p>
                  </div>
                  <ExternalLink size={16} className="mt-1 shrink-0" />
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="mt-14 rounded-3xl bg-[#111318] p-7 text-white">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-white/50">Aura Digital Fiji</p>
          <h2 className="mt-3 text-2xl font-black">Need help applying technology to your business?</h2>
          <p className="mt-3 max-w-2xl leading-7 text-white/65">Aura Digital Fiji builds websites, applications, ecommerce systems, business email, security and practical digital infrastructure for Fiji businesses.</p>
          <a href="https://auradigitalfiji.com" className="mt-5 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-black text-black">Visit Aura Digital Fiji</a>
        </section>
      </article>
    </main>
  );
}
