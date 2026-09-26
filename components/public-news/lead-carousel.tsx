"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

export type LeadSlide = {
  id: string;
  href: string;
  category: string;
  date: string;
  title: string;
  summary?: string | null;
  imageUrl: string | null;
  imageAlt: string;
};

function titleLengthClass(title: string) {
  const length = title.trim().length;
  if (length > 92) return "adi-lead-carousel-title-xl";
  if (length > 70) return "adi-lead-carousel-title-long";
  if (length > 50) return "adi-lead-carousel-title-medium";
  return "adi-lead-carousel-title-short";
}

export function LeadCarousel({ slides }: { slides: LeadSlide[] }) {
  const [index, setIndex] = useState(0);
  const current = slides[index];

  useEffect(() => {
    if (slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!current) return null;

  return (
    <section className="adi-lead-carousel" aria-roledescription="carousel" aria-label="Lead intelligence">
      <div className="adi-lead-carousel-grid">
        <Link href={current.href} className="adi-lead-carousel-media" aria-label={`Read ${current.title}`}>
          <div key={`media-${current.id}`} className="adi-lead-carousel-media-frame">
            {current.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.imageUrl} alt={current.imageAlt} className="adi-lead-carousel-image" />
            ) : (
              <div className="adi-lead-carousel-fallback" role="img" aria-label={`${current.category} story from Aura Intelligence`}>
                <span>Aura Intelligence · Fiji</span>
                <strong>{current.category}</strong>
                <span>Verified technology intelligence</span>
              </div>
            )}
          </div>
          <span className="adi-lead-carousel-count">{String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>
        </Link>

        <div key={`copy-${current.id}`} className="adi-lead-carousel-copy adi-lead-carousel-copy-animate">
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.14em] opacity-55">
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#ff7aa5]" />{current.category}</span>
            <span>{current.date}</span>
          </div>
          <p className="adi-kicker mt-4">Lead intelligence</p>
          <h1 className={`adi-lead-carousel-title ${titleLengthClass(current.title)}`}>
            <Link href={current.href}>{current.title}</Link>
          </h1>
          {current.summary && <p className="adi-lead-carousel-summary">{current.summary}</p>}
          <Link href={current.href} className="adi-lead-carousel-readmore">Read more <ArrowRight size={15}/></Link>

          {slides.length > 1 && (
            <div className="adi-lead-progress" aria-hidden="true">
              {slides.map((slide, slideIndex) => <span key={slide.id} className={slideIndex === index ? "active" : ""} />)}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
