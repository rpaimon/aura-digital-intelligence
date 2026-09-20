"use client";

import { Check, Link2, Share2 } from "lucide-react";
import { useState } from "react";

export function ShareBar({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function copy() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={share} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2.5 text-xs font-black text-white/75 transition hover:border-lime-300/30 hover:text-white">
        <Share2 size={14} /> Share
      </button>
      <button onClick={copy} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2.5 text-xs font-black text-white/75 transition hover:border-lime-300/30 hover:text-white">
        {copied ? <Check size={14} className="text-lime-300" /> : <Link2 size={14} />} {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
