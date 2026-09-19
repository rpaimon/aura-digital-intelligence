"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Rss, XCircle } from "lucide-react";

type Props = {
  feedUrl: string | null;
};

export function FeedTestButton({ feedUrl }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function testFeed() {
    if (!feedUrl) {
      setState("error");
      setMessage("No RSS URL saved");
      return;
    }

    setState("loading");
    setMessage("");

    try {
      const response = await fetch("/api/admin/sources/test-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedUrl }),
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Feed test failed");
      }

      setState("success");
      setMessage(`${result.itemCount ?? 0} items detected`);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Feed test failed");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={testFeed}
        disabled={state === "loading"}
        className="inline-flex items-center gap-2 rounded-xl border border-[#ddd8d0] bg-white px-3 py-2 text-xs font-bold transition hover:bg-[#f7f5f2] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === "loading" ? <Loader2 size={14} className="animate-spin" /> : <Rss size={14} />}
        Test feed
      </button>
      {state === "success" && (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
          <CheckCircle2 size={14} /> {message}
        </span>
      )}
      {state === "error" && (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700">
          <XCircle size={14} /> {message}
        </span>
      )}
    </div>
  );
}
