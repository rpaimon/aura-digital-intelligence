"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type TouchEvent } from "react";

export type LeadSlide = {
  id: string;
  href: string;
  category: string;
  date: string;
  title: string;
  imageUrl: string | null;
  imageAlt: string;
};

export function LeadCarousel({ slides }: { slides: LeadSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);
  const current = slides[index];

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  if (!current) return null;

  function previous() {
    setIndex((value) => (value - 1 + slides.length) % slides.length);
  }

  function next() {
    setIndex((value) => (value + 1) % slides.length);
  }

  function onTouchEnd(event: TouchEvent) {
    if (touchStart.current === null) return;
    const distance = event.changedTouches[0]?.clientX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(distance) < 45) return;
    event.preventDefault();
    if (distance < 0) next();
    else previous();
  }

  return (
    <section
      className="adi-lead-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={onTouchEnd}
    >
      <div className="adi-lead-carousel-grid">
        <Link href={current.href} className="adi-lead-carousel-media" aria-label={`Read ${current.title}`}>
          {current.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={current.imageUrl} src={current.imageUrl} alt={current.imageAlt} className="adi-lead-carousel-image" />
          ) : (
            <div className="adi-lead-carousel-fallback" role="img" aria-label={`${current.category} story from Aura Intelligence`}>
              <span>Aura Intelligence · Fiji</span>
              <strong>{current.category}</strong>
              <span>Verified technology intelligence</span>
            </div>
          )}
          <span className="adi-lead-carousel-count">{String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>
        </Link>

        <div className="adi-lead-carousel-copy">
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.14em] opacity-55">
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#ff7aa5]" />{current.category}</span>
            <span>{current.date}</span>
          </div>
          <p className="adi-kicker mt-4">Lead intelligence</p>
          <h1 className="adi-lead-carousel-title"><Link href={current.href}>{current.title}</Link></h1>
          <Link href={current.href} className="mt-5 inline-flex w-fit items-center gap-2 border-b border-current pb-1 text-[11px] font-black uppercase tracking-[0.13em]">Read the story <ArrowRight size={14}/></Link>

          {slides.length > 1 && (
            <div className="adi-lead-carousel-controls" aria-label="Lead story controls">
              <button type="button" onClick={previous} aria-label="Previous lead story"><ChevronLeft size={16}/></button>
              <div className="flex items-center gap-2" aria-hidden="true">
                {slides.map((slide, slideIndex) => <span key={slide.id} className={slideIndex === index ? "active" : ""} />)}
              </div>
              <button type="button" onClick={next} aria-label="Next lead story"><ChevronRight size={16}/></button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
