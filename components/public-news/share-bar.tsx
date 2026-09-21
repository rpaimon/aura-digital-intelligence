"use client";

import { Check, Link2, Share2 } from "lucide-react";
import { useState } from "react";

export function ShareBar({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = window.location.href;
    if (navigator.share) { await navigator.share({ title, url }).catch(() => undefined); return; }
    await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 1600);
  }
  async function copy() { await navigator.clipboard.writeText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1600); }
  return <div className="flex flex-wrap items-center gap-2"><button onClick={share} className="inline-flex items-center gap-2 border border-white/14 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/68 transition hover:bg-white hover:text-black"><Share2 size={13}/> Share</button><button onClick={copy} className="inline-flex items-center gap-2 border border-white/14 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/68 transition hover:bg-white hover:text-black">{copied ? <Check size={13}/> : <Link2 size={13}/>} {copied ? "Copied" : "Copy link"}</button></div>;
}
