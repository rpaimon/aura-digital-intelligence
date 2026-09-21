"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";

export function MobileAuraCTA({ href, label = "Aura Digital Fiji" }: { href: string; label?: string }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 620);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible || dismissed) return null;
  return (
    <div className="adi-mobile-cta">
      <a href={href} className="adi-mobile-cta-link"><span>Need help applying this?</span><strong>{label}</strong><ArrowUpRight size={15} /></a>
      <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="adi-mobile-cta-close"><X size={14} /></button>
    </div>
  );
}
