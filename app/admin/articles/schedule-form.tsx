"use client";

import { useState } from "react";
import { scheduleArticle } from "./actions";

export function ScheduleForm({ articleId }: { articleId: string }) {
  const [localTime, setLocalTime] = useState("");
  const iso = localTime ? new Date(localTime).toISOString() : "";

  return (
    <form action={scheduleArticle} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="articleId" value={articleId} />
      <input type="hidden" name="scheduledIso" value={iso} />
      <input
        type="datetime-local"
        value={localTime}
        onChange={(event) => setLocalTime(event.target.value)}
        required
        className="rounded-xl border border-[#ddd8d0] px-3 py-2 text-xs"
        aria-label="Schedule publication in your local time"
      />
      <button className="rounded-xl border border-[#ddd8d0] px-3 py-2 text-xs font-black">Schedule</button>
    </form>
  );
}
