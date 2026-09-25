import React from "react";

function renderInline(text: string) {
  const parts: React.ReactNode[] = [];
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[1] && match[2]) parts.push(<a key={`${match.index}-${match[2]}`} href={match[2]} target="_blank" rel="noreferrer noopener" className="font-bold underline decoration-current/30 underline-offset-4 hover:decoration-current">{match[1]}</a>);
    else if (match[3]) parts.push(<strong key={`${match.index}-strong`} className="font-black">{match[3]}</strong>);
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function splitInlineOrderedList(text: string) {
  const markers = [...text.matchAll(/(?:^|\s)(\d+)\.\s+/g)];
  if (markers.length < 2) return null;
  const items: string[] = [];
  markers.forEach((marker, index) => {
    const start = (marker.index || 0) + marker[0].length;
    const end = index + 1 < markers.length ? (markers[index + 1].index || text.length) : text.length;
    const item = text.slice(start, end).trim();
    if (item) items.push(item);
  });
  return items.length >= 2 ? items : null;
}

export function ArticleMarkdown({ content, inserts = [] }: { content: string; inserts?: React.ReactNode[] }) {
  const lines = content.split(/\r?\n/);
  const nodes: React.ReactNode[] = [];
  let paragraph: string[] = [];
  let bullets: string[] = [];
  let ordered: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = paragraph.join(" ").trim();
    paragraph = [];
    if (!text) return;
    const inlineList = splitInlineOrderedList(text);
    if (inlineList) {
      nodes.push(<ol key={`ol-inline-${nodes.length}`} className="text-[1rem] leading-7">{inlineList.map((item,index)=><li key={index}>{renderInline(item)}</li>)}</ol>);
      return;
    }
    nodes.push(<p key={`p-${nodes.length}`} className="text-[1.03rem] leading-[1.88] sm:text-[1.08rem]">{renderInline(text)}</p>);
  };

  const flushBullets = () => {
    if (!bullets.length) return;
    nodes.push(<ul key={`ul-${nodes.length}`} className="space-y-3 border-y py-5 text-[1rem] leading-7" style={{ borderColor: "var(--adi-reading-line)" }}>{bullets.map((item,index)=><li key={index} className="flex gap-3"><span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--adi-reading-fg)" }}/><span>{renderInline(item)}</span></li>)}</ul>);
    bullets=[];
  };

  const flushOrdered = () => {
    if (!ordered.length) return;
    nodes.push(<ol key={`ol-${nodes.length}`} className="text-[1rem] leading-7">{ordered.map((item,index)=><li key={index}>{renderInline(item)}</li>)}</ol>);
    ordered=[];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushParagraph(); flushBullets(); flushOrdered(); continue; }
    if (/^###\s+/.test(line)) { flushParagraph(); flushBullets(); flushOrdered(); nodes.push(<h3 key={`h3-${nodes.length}`} className="pt-3 text-2xl font-black tracking-[-0.035em] sm:text-3xl">{renderInline(line.replace(/^###\s+/, ""))}</h3>); continue; }
    if (/^##\s+/.test(line)) { flushParagraph(); flushBullets(); flushOrdered(); nodes.push(<h2 key={`h2-${nodes.length}`} className="pt-5 text-[2rem] font-black leading-[1.02] tracking-[-0.05em] sm:text-[2.45rem]">{renderInline(line.replace(/^##\s+/, ""))}</h2>); continue; }
    if (/^>\s+/.test(line)) { flushParagraph(); flushBullets(); flushOrdered(); nodes.push(<blockquote key={`q-${nodes.length}`}>{renderInline(line.replace(/^>\s+/, ""))}</blockquote>); continue; }
    if (/^[-*]\s+/.test(line)) { flushParagraph(); flushOrdered(); bullets.push(line.replace(/^[-*]\s+/, "")); continue; }
    if (/^\d+\.\s+/.test(line)) { flushParagraph(); flushBullets(); ordered.push(line.replace(/^\d+\.\s+/, "")); continue; }
    paragraph.push(line);
  }
  flushParagraph(); flushBullets(); flushOrdered();

  // Insert Aura references only after real reading blocks, never directly after a heading.
  const enriched: React.ReactNode[] = [];
  let inserted = 0;
  let readingBlocks = 0;
  nodes.forEach((node, index) => {
    enriched.push(node);
    if (!React.isValidElement(node)) return;
    if (node.type === "p" || node.type === "ul" || node.type === "ol" || node.type === "blockquote") readingBlocks += 1;
    if (inserted < inserts.length && (readingBlocks === 2 || readingBlocks === 6)) {
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
