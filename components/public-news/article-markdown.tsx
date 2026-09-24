import React from "react";

function renderInline(text: string) {
  const parts: React.ReactNode[] = [];
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[1] && match[2]) parts.push(<a key={`${match.index}-${match[2]}`} href={match[2]} target="_blank" rel="noreferrer noopener" className="font-bold text-white underline decoration-white/35 underline-offset-4 hover:decoration-white">{match[1]}</a>);
    else if (match[3]) parts.push(<strong key={`${match.index}-strong`} className="font-black text-white">{match[3]}</strong>);
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function ArticleMarkdown({ content, inserts = [] }: { content: string; inserts?: React.ReactNode[] }) {
  const lines = content.split(/\r?\n/);
  const nodes: React.ReactNode[] = [];
  let paragraph: string[] = [];
  let bullets: string[] = [];
  const flushParagraph = () => { if (!paragraph.length) return; const text = paragraph.join(" ").trim(); if (text) nodes.push(<p key={`p-${nodes.length}`} className="text-[1.02rem] leading-[1.86] text-white/74 sm:text-[1.08rem]">{renderInline(text)}</p>); paragraph=[]; };
  const flushBullets = () => { if (!bullets.length) return; nodes.push(<ul key={`ul-${nodes.length}`} className="space-y-3 border-y border-white/10 py-5 text-[1rem] leading-7 text-white/72">{bullets.map((item,index)=><li key={index} className="flex gap-3"><span className="mt-3 h-1.5 w-1.5 shrink-0 bg-white"/><span>{renderInline(item)}</span></li>)}</ul>); bullets=[]; };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushParagraph(); flushBullets(); continue; }
    if (/^###\s+/.test(line)) { flushParagraph(); flushBullets(); nodes.push(<h3 key={`h3-${nodes.length}`} className="pt-4 text-2xl font-black uppercase tracking-[-0.035em] text-white sm:text-3xl">{renderInline(line.replace(/^###\s+/, ""))}</h3>); continue; }
    if (/^##\s+/.test(line)) { flushParagraph(); flushBullets(); nodes.push(<h2 key={`h2-${nodes.length}`} className="pt-7 text-3xl font-black uppercase tracking-[-0.05em] text-white sm:text-[2.15rem]">{renderInline(line.replace(/^##\s+/, ""))}</h2>); continue; }
    if (/^>\s+/.test(line)) { flushParagraph(); flushBullets(); nodes.push(<blockquote key={`q-${nodes.length}`}>{renderInline(line.replace(/^>\s+/, ""))}</blockquote>); continue; }
    if (/^[-*]\s+/.test(line)) { flushParagraph(); bullets.push(line.replace(/^[-*]\s+/, "")); continue; }
    paragraph.push(line);
  }
  flushParagraph(); flushBullets();

  const enriched: React.ReactNode[] = [];
  let inserted = 0;
  nodes.forEach((node, index) => {
    enriched.push(node);
    if (inserted < inserts.length && (index === 2 || index === 6 || index === 10)) {
      enriched.push(<React.Fragment key={`insert-${index}`}>{inserts[inserted]}</React.Fragment>);
      inserted += 1;
    }
  });
  while (inserted < inserts.length) {
    enriched.push(<React.Fragment key={`insert-tail-${inserted}`}>{inserts[inserted]}</React.Fragment>);
    inserted += 1;
  }

  return <div className="space-y-7">{enriched}</div>;
}
