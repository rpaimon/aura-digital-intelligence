"use client";

import { Check, Copy, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";

export function ShareBar({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  function currentUrl() { return window.location.href; }

  async function nativeShare() {
    const url = currentUrl();
    if (navigator.share) {
      await navigator.share({ title, text: title, url }).catch(() => undefined);
      return;
    }
    await copy();
  }

  function whatsapp() {
    const text = encodeURIComponent(currentUrl());
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  function facebook() {
    const url = encodeURIComponent(currentUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "noopener,noreferrer,width=720,height=620");
  }

  async function copy() {
    await navigator.clipboard.writeText(currentUrl());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={nativeShare} className="adi-share-button"><Share2 size={13}/> Share</button>
      <button onClick={whatsapp} className="adi-share-button"><MessageCircle size={13}/> WhatsApp</button>
      <button onClick={facebook} className="adi-share-button hidden sm:inline-flex">Facebook</button>
      <button onClick={copy} className="adi-share-button">{copied ? <Check size={13}/> : <Copy size={13}/>} {copied ? "Copied" : "Copy"}</button>
    </div>
  );
}
