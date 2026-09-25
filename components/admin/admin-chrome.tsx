"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, FileText, Radio, Rss, SearchCheck, ExternalLink } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";


const routeMeta: Record<string, { title: string; description: string }> = {
  "/admin/dashboard": { title: "Overview", description: "Live newsroom health and daily publishing progress." },
  "/admin/stories": { title: "Story inbox", description: "Discovered stories, scoring, duplicate checks and verification status." },
  "/admin/fact-checks": { title: "Fact checks", description: "Claim-level evidence, confidence and approval decisions." },
  "/admin/articles": { title: "Articles", description: "Draft quality, scheduling and publication controls." },
  "/admin/sources": { title: "Sources", description: "Source network health, feeds and discovery inputs." },
  "/admin/research": { title: "Research archive", description: "Legacy research-stage visibility." },
};

const items = [
  { href: "/admin/dashboard", label: "Overview", icon: Activity },
  { href: "/admin/stories", label: "Stories", icon: Radio },
  { href: "/admin/fact-checks", label: "Checks", icon: SearchCheck },
  { href: "/admin/articles", label: "Articles", icon: FileText },
  { href: "/admin/sources", label: "Sources", icon: Rss },
];

export function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin/login") return <>{children}</>;

  const meta = routeMeta[pathname] || { title: "Newsroom", description: "Aura Digital Intelligence administration." };

  return (
    <div className="admin-root min-h-screen">
      <header className="admin-topbar">
        <div className="admin-topbar-inner">
          <Link href="/admin/dashboard" className="admin-brand">
            <span>Aura Digital Fiji</span>
            <strong>Intelligence Newsroom</strong>
          </Link>
          <nav className="admin-desktop-nav" aria-label="Admin navigation">
            {items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return <Link key={href} href={href} className={active ? "active" : ""}><Icon size={15}/><span>{label}</span></Link>;
            })}
          </nav>
          <div className="admin-actions">
            <Link href="/news" target="_blank" className="admin-public-link">Public site <ExternalLink size={13}/></Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="admin-route-head"><div><p>Admin newsroom</p><h1>{meta.title}</h1></div><span>{meta.description}</span></div>

      <div className="admin-content">{children}</div>

      <nav className="admin-mobile-nav" aria-label="Mobile admin navigation">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return <Link key={href} href={href} className={active ? "active" : ""}><Icon size={18}/><span>{label}</span></Link>;
        })}
      </nav>
    </div>
  );
}
