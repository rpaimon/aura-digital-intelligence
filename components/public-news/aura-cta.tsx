import { ArrowRight, ShieldCheck } from "lucide-react";
import type { AuraServiceCTA } from "@/lib/news/public";

export function AuraInlineCTA({ cta, articleSlug, variant = "mid" }: { cta: AuraServiceCTA; articleSlug: string; variant?: "early" | "mid" | "final" }) {
  const href = `/go/aura?service=${encodeURIComponent(cta.key)}&article=${encodeURIComponent(articleSlug)}`;
  if (variant === "early") {
    return (
      <aside className="adi-aura-cta adi-aura-cta-early">
        <div className="adi-aura-cta-icon"><ShieldCheck size={18} /></div>
        <div className="min-w-0 flex-1">
          <p className="adi-aura-cta-eyebrow">{cta.eyebrow}</p>
          <p className="adi-aura-cta-title">{cta.title}</p>
          <p className="adi-aura-cta-copy">{cta.text}</p>
        </div>
        <a href={href} className="adi-aura-cta-link">{cta.label} <ArrowRight size={14} /></a>
      </aside>
    );
  }
  return (
    <aside className={`adi-aura-cta ${variant === "final" ? "adi-aura-cta-final" : "adi-aura-cta-mid"}`}>
      <p className="adi-aura-cta-eyebrow">Aura Digital Fiji · {cta.serviceName}</p>
      <div className="adi-aura-cta-grid">
        <div>
          <h3 className="adi-aura-cta-heading">{cta.title}</h3>
          <p className="adi-aura-cta-copy">{cta.text}</p>
        </div>
        <a href={href} className="adi-aura-cta-button">{cta.label} <ArrowRight size={15} /></a>
      </div>
    </aside>
  );
}
