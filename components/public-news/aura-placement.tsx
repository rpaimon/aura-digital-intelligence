import { ArrowRight, ArrowUpRight, Mail, ShieldCheck, Smartphone, Wrench } from "lucide-react";

const services = [
  { key: "web", label: "Web & ecommerce", icon: Wrench },
  { key: "security", label: "Security & care", icon: ShieldCheck },
  { key: "email", label: "Business email", icon: Mail },
  { key: "apps", label: "Apps & systems", icon: Smartphone },
] as const;

function serviceHref(key: string) {
  return `/go/aura?service=${encodeURIComponent(key)}`;
}

export function AuraPublisherStrip() {
  return (
    <div className="adi-aura-publisher-strip border-t">
      <div className="mx-auto flex max-w-[1480px] items-center gap-4 overflow-x-auto px-4 py-2.5 sm:px-6 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <a href="https://auradigitalfiji.com" className="adi-aura-strip-brand shrink-0 font-black uppercase tracking-[0.12em]">
          <span className="opacity-45">Publisher</span> · Aura Digital Fiji <ArrowUpRight size={11}/>
        </a>
        <span className="adi-aura-strip-rule shrink-0" aria-hidden="true" />
        {services.map(({ key, label }) => (
          <a key={key} href={serviceHref(key)} className="adi-aura-strip-link shrink-0">{label}</a>
        ))}
        <a href="/go/aura?service=it" className="adi-aura-strip-link shrink-0">IT services</a>
      </div>
    </div>
  );
}

export function AuraStudioCompact({ eyebrow = "Digital partner" }: { eyebrow?: string }) {
  return (
    <aside className="adi-aura-studio adi-aura-studio-compact">
      <div className="adi-aura-studio-topline">
        <div><p className="adi-kicker">{eyebrow}</p><p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] opacity-45">Aura Digital Fiji</p></div>
        <span className="adi-aura-studio-mark" aria-hidden="true">ADF</span>
      </div>
      <h3 className="mt-4 text-[1.45rem] font-black leading-[1.04] tracking-[-0.05em]">Need the technology behind the idea?</h3>
      <p className="mt-3 text-sm leading-6 opacity-65">Websites, ecommerce, business email, security, apps and practical IT systems for Fiji businesses.</p>
      <div className="adi-aura-service-grid mt-4">
        {services.map(({ key, label, icon: Icon }, index) => <a key={key} href={serviceHref(key)}><Icon size={13}/><span>{String(index+1).padStart(2,"0")}</span>{label}</a>)}
      </div>
      <a href="https://auradigitalfiji.com" className="adi-aura-studio-cta">Visit Aura Digital Fiji <ArrowUpRight size={14}/></a>
    </aside>
  );
}

export function AuraWideBand({ title = "Read the change. Build the advantage." }: { title?: string }) {
  return (
    <section className="adi-aura-wide-band">
      <div className="adi-wide-shell grid gap-5 px-4 py-7 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center lg:px-8">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-55">Aura Digital Fiji · Digital services</p>
          <h2 className="mt-2 text-2xl font-black leading-[1.02] tracking-[-0.05em] sm:text-3xl">{title}</h2>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 opacity-65">Custom websites, ecommerce, business email, security, mobile apps and IT systems built for Fiji businesses.</p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-3 md:max-w-[380px] md:justify-end">
          {services.map(({ key, label }) => <a key={key} href={serviceHref(key)} className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.11em]">{label} <ArrowRight size={11}/></a>)}
          <a href="https://auradigitalfiji.com" className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.11em]">All services <ArrowUpRight size={11}/></a>
        </div>
      </div>
    </section>
  );
}
