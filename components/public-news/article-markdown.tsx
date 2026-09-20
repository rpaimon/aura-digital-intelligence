import React from "react";

function renderInline(text: string) {
  const parts: React.ReactNode[] = [];
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[1] && match[2]) {
      parts.push(
        <a key={`${match.index}-${match[2]}`} href={match[2]} target="_blank" rel="noreferrer noopener" className="font-semibold text-white underline decoration-lime-300/40 underline-offset-4 transition hover:decoration-lime-300">
          {match[1]}
        </a>
      );
    } else if (match[3]) {
      parts.push(<strong key={`${match.index}-strong`} className="font-extrabold text-white">{match[3]}</strong>);
    }
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function ArticleMarkdown({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const nodes: React.ReactNode[] = [];
  let paragraph: string[] = [];
  let bullets: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = paragraph.join(" ").trim();
    if (text) nodes.push(<p key={`p-${nodes.length}`} className="text-[1.08rem] leading-[1.95] text-white/72 sm:text-[1.12rem]">{renderInline(text)}</p>);
    paragraph = [];
  };

  const flushBullets = () => {
    if (!bullets.length) return;
    nodes.push(
      <ul key={`ul-${nodes.length}`} className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-[1.02rem] leading-7 text-white/70 sm:p-6">
        {bullets.map((item, index) => <li key={index} className="flex gap-3"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lime-300" /><span>{renderInline(item)}</span></li>)}
      </ul>
    );
    bullets = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushParagraph();
      flushBullets();
      continue;
    }
    if (/^###\s+/.test(line)) {
      flushParagraph();
      flushBullets();
      nodes.push(<h3 key={`h3-${nodes.length}`} className="pt-5 text-2xl font-black tracking-[-0.035em] text-white sm:text-3xl">{renderInline(line.replace(/^###\s+/, ""))}</h3>);
      continue;
    }
    if (/^##\s+/.test(line)) {
      flushParagraph();
      flushBullets();
      nodes.push(<h2 key={`h2-${nodes.length}`} className="pt-8 text-3xl font-black tracking-[-0.045em] text-white sm:text-4xl">{renderInline(line.replace(/^##\s+/, ""))}</h2>);
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      bullets.push(line.replace(/^[-*]\s+/, ""));
      continue;
    }
    paragraph.push(line);
  }

  flushParagraph();
  flushBullets();

  return <div className="space-y-7">{nodes}</div>;
}
