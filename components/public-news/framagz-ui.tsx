import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import type { PublicArticle } from "@/lib/news/public";
import { articleFallbackImage, articlePath, displayCategory, readingTime } from "@/lib/news/public";

export const categoryPalette: Record<string, string> = {
  ai: "#9bdcff",
  cybersecurity: "#ff7aa5",
  cloud: "#98dc88",
  business: "#ff9d6d",
  ecommerce: "#f3d46b",
  fiji: "#b29aff",
  technology: "#9bdcff",
};

export function categoryColor(label?: string | null) {
  const text = String(label || "technology").toLowerCase();
  if (text.includes("cyber") || text.includes("security")) return categoryPalette.cybersecurity;
  if (text.includes("business")) return categoryPalette.business;
  if (text.includes("cloud") || text.includes("infrastructure")) return categoryPalette.cloud;
  if (text.includes("commerce") || text.includes("payment")) return categoryPalette.ecommerce;
  if (text.includes("fiji") || text.includes("pacific")) return categoryPalette.fiji;
  return categoryPalette.ai;
}

export function formatNewsDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-FJ", {
    timeZone: "Pacific/Fiji",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CategoryChip({ label }: { label?: string | null }) {
  const category = String(label || "Technology");
  return <span className="adi-chip"><span className="adi-chip-dot" style={{ backgroundColor: categoryColor(category) }} />{category}</span>;
}

export function StoryCard({ article, compact = false }: { article: PublicArticle; compact?: boolean }) {
  const category = displayCategory(article);
  return (
    <article className="adi-story-card group min-w-0">
      <Link href={articlePath(article)} className="adi-story-media block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={article.featured_image_url || articleFallbackImage(article)} alt={article.featured_image_alt || article.title} className={`${compact ? "aspect-[16/10]" : "aspect-[16/10] sm:aspect-[4/3]"} w-full object-cover`} />
      </Link>
      <div className="px-4 pb-2 pt-4 sm:px-0">
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.14em] text-white/42">
          <CategoryChip label={category} />
          <span>{formatNewsDate(article.published_at)}</span>
        </div>
        <h3 className={`${compact ? "text-[1.18rem] sm:text-[1.3rem]" : "text-[1.6rem] sm:text-[2rem]"} adi-title-balance mt-3 font-black leading-[1.06] tracking-[-0.045em] text-white transition group-hover:text-white/72`}>
          <Link href={articlePath(article)}>{article.title}</Link>
        </h3>
        {!compact && article.excerpt && <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/50">{article.excerpt}</p>}
      </div>
    </article>
  );
}

export function StoryRow({ article, showExcerpt = true }: { article: PublicArticle; showExcerpt?: boolean }) {
  const category = displayCategory(article);
  return (
    <article className="adi-story-card group">
      <div className="adi-story-row">
        <Link href={articlePath(article)} className="adi-story-media block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.featured_image_url || articleFallbackImage(article)} alt={article.featured_image_alt || article.title} className="aspect-[4/3] w-full object-cover" />
        </Link>
        <div className="min-w-0 pr-4 sm:pr-0">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/40">
            <span>{category}</span><span>•</span><span>{formatNewsDate(article.published_at)}</span>
          </div>
          <h3 className="adi-title-balance mt-2 text-[1.02rem] font-black leading-[1.12] tracking-[-0.035em] text-white transition group-hover:text-white/72 sm:text-[1.22rem]">
            <Link href={articlePath(article)}>{article.title}</Link>
          </h3>
          {showExcerpt && article.excerpt && <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/45">{article.excerpt}</p>}
        </div>
      </div>
    </article>
  );
}

export function NumberedPick({ article, index }: { article: PublicArticle; index: number }) {
  return (
    <Link href={articlePath(article)} className="group grid grid-cols-[28px_64px_1fr] items-center gap-3 border-t border-white/10 py-3 first:border-t-0">
      <span className="text-[1.7rem] font-black tracking-[-0.06em] text-white/16">{index}</span>
      <div className="adi-story-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={article.featured_image_url || articleFallbackImage(article)} alt="" className="aspect-square h-full w-full object-cover" />
      </div>
      <div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/36">{displayCategory(article)}</p><p className="mt-1 line-clamp-2 text-sm font-black leading-tight text-white/88 transition group-hover:text-white">{article.title}</p></div>
    </Link>
  );
}

export function SectionHeading({ eyebrow, title, href }: { eyebrow?: string; title: string; href?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 px-4 sm:px-0">
      <div>{eyebrow && <p className="adi-kicker">{eyebrow}</p>}<h2 className="adi-section-title mt-1 text-white">{title}</h2></div>
      {href && <Link href={href} className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/46 transition hover:text-white">View all <ArrowUpRight size={13} /></Link>}
    </div>
  );
}

export function MetaLine({ article }: { article: PublicArticle }) {
  const category = displayCategory(article);
  return <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.13em] text-white/45"><span>{category}</span><span>•</span><span>{formatNewsDate(article.published_at)}</span><span>•</span><span className="inline-flex items-center gap-1"><Clock3 size={11} /> {readingTime(article.excerpt || article.content)} min</span></div>;
}
