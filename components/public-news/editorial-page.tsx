import Link from "next/link";
import { NewsFooter, NewsHeader } from "@/components/public-news/news-shell";

export function EditorialPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <NewsHeader />
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_10%_0%,rgba(190,242,100,.10),transparent_32%)]">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-300">{eyebrow}</p>
          <h1 className="mt-5 text-5xl font-black tracking-[-0.055em] sm:text-7xl">{title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/58">{intro}</p>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="space-y-10 text-[15px] leading-8 text-white/64 [&_a]:font-bold [&_a]:text-lime-200 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:tracking-[-0.035em] [&_h2]:text-white [&_li]:mb-2 [&_strong]:text-white">
          {children}
        </div>
        <div className="mt-14 border-t border-white/10 pt-8 text-sm text-white/45">
          <Link href="/news" className="font-black text-lime-200">← Back to the newsroom</Link>
        </div>
      </section>
      <NewsFooter />
    </main>
  );
}
