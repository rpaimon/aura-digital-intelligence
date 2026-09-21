import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import type { PublicArticle } from "@/lib/news/public";
import { articlePath, displayCategory, readingTime } from "@/lib/news/public";

export const categoryPalette: Record<string, string> = {
  ai: "#26C6DA",
  cybersecurity: "#FF4F87",
  cloud: "#8BC34A",
  business: "#FF7043",
  ecommerce: "#F6C945",
  fiji: "#A36BFF",
  technology: "#26C6DA",
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
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function StoryCard({ article, compact = false }: { article: PublicArticle; compact?: boolean }) {
  const category = displayCategory(article);
  const color = categoryColor(category);
  return (
    <article className="adi-story-card group">
      <Link href={articlePath(article)} className="block overflow-hidden bg-[#151515]">
        {article.featured_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.featured_image_url} alt={article.featured_image_alt || article.title} className={`${compact ? "aspect-[16/10]" : "aspect-[4/3]"} w-full object-cover transition duration-700 group-hover:scale-[1.045]`} />
        ) : (
          <div className={`${compact ? "aspect-[16/10]" : "aspect-[4/3]"} w-full bg-[linear-gradient(135deg,#1d1d1d,#0b0b0b)]`} />
        )}
      </Link>
      <div className="pt-4">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-white/45">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
          <span>{category}</span>
          <span className="text-white/20">/</span>
          <span>{formatNewsDate(article.published_at)}</span>
        </div>
        <h3 className={`${compact ? "text-lg" : "text-2xl"} mt-3 font-black leading-[1.05] tracking-[-0.035em] text-white transition group-hover:text-white/70`}>
          <Link href={articlePath(article)}>{article.title}</Link>
        </h3>
        {!compact && article.excerpt && <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/48">{article.excerpt}</p>}
      </div>
    </article>
  );
}

export function NumberedPick({ article, index }: { article: PublicArticle; index: number }) {
  const category = displayCategory(article);
  const color = categoryColor(category);
  return (
    <Link href={articlePath(article)} className="group grid grid-cols-[34px_72px_1fr] items-center gap-3 border-b border-white/10 py-4 last:border-b-0">
      <span className="text-3xl font-black tracking-[-0.06em] text-white/16">{index}</span>
      <div className="overflow-hidden rounded-sm bg-[#151515]">
        {article.featured_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.featured_image_url} alt="" className="aspect-square h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : <div className="aspect-square bg-[#181818]" />}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-[0.14em]" style={{ color }}>{category}</p>
        <p className="mt-1 line-clamp-2 text-sm font-black leading-tight text-white/88 transition group-hover:text-white">{article.title}</p>
      </div>
    </Link>
  );
}

export function SectionHeading({ eyebrow, title, href, accent }: { eyebrow?: string; title: string; href?: string; accent?: string }) {
  return (
    <div className="relative mb-6 flex items-end justify-between gap-4 border-t-4 border-white pt-5">
      <div>
        {eyebrow && <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/38">{eyebrow}</p>}
        <h2 className="mt-1 text-3xl font-black uppercase leading-none tracking-[-0.055em] text-white sm:text-4xl">{title}</h2>
      </div>
      {href && <Link href={href} className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-white/48 transition hover:text-white">View all <ArrowUpRight size={13} /></Link>}
      <span className="absolute h-1 w-24 -translate-y-[28px]" style={{ backgroundColor: accent || "#fff" }} />
    </div>
  );
}

export function MetaLine({ article }: { article: PublicArticle }) {
  const category = displayCategory(article);
  return (
    <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.13em] text-white/45">
      <span>{category}</span><span>•</span><span>{formatNewsDate(article.published_at)}</span><span>•</span><span className="inline-flex items-center gap-1"><Clock3 size={11} /> {readingTime(article.excerpt || article.content)} min</span>
    </div>
  );
}
