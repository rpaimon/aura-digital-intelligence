"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type HeroStory = {
  id: string;
  title: string;
  excerpt: string | null;
  category: string;
  date: string;
  href: string;
  image: string | null;
  color: string;
};

export function HeroRotator({ stories }: { stories: HeroStory[] }) {
  const usable = useMemo(() => stories.filter(Boolean).slice(0, 4), [stories]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (usable.length < 2) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % usable.length), 7200);
    return () => window.clearInterval(timer);
  }, [usable.length]);

  if (!usable.length) return null;
  const story = usable[index] || usable[0];

  return (
    <section className="adi-home-hero" aria-label="Featured stories">
      <div key={`${story.id}-${index}`} className="adi-home-hero-slide">
        {story.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={story.image} alt="" className="adi-home-hero-image" />
        ) : (
          <div className="adi-home-hero-fallback" style={{ background: `radial-gradient(circle at 68% 26%, ${story.color}80, transparent 25%), linear-gradient(135deg, ${story.color}30, #161616 45%, #050505 100%)` }}>
            <span className="adi-home-hero-monogram">ADI</span>
          </div>
        )}
        <div className="adi-home-hero-shade" />
        <div className="adi-home-hero-update">TODAY&apos;S UPDATE</div>
        <div className="adi-home-hero-copy">
          <p className="adi-hero-kicker">{story.date} <span>/</span> {story.category}</p>
          <h1 className="adi-hero-story-title"><Link href={story.href}>{story.title}</Link></h1>
          {story.excerpt && <p className="adi-hero-story-excerpt">{story.excerpt}</p>}
          <Link href={story.href} className="adi-hero-read">Read story <ArrowRight size={15} /></Link>
        </div>
        {usable.length > 1 && (
          <div className="adi-hero-dots" aria-label="Featured story selector">
            {usable.map((item, itemIndex) => (
              <button key={item.id} onClick={() => setIndex(itemIndex)} aria-label={`Show story ${itemIndex + 1}`} className={itemIndex === index ? "is-active" : ""} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
