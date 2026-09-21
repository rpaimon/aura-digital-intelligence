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

function cleanHeading(value: string) {
  const trimmed = value.trim();
  if (/^opening$/i.test(trimmed)) return "What happened";
  return trimmed;
}

function headingKey(value: string) {
  return cleanHeading(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function ArticleMarkdown({
  content,
  afterSection,
}: {
  content: string;
  afterSection?: Record<string, React.ReactNode>;
}) {
  const lines = content.split(/\r?\n/);
  const nodes: React.ReactNode[] = [];
  let paragraph: string[] = [];
  let bullets: string[] = [];
  let numbered: string[] = [];
  let currentH2 = "";

  const maybeInsert = () => {
    const key = headingKey(currentH2);
    if (key && afterSection?.[key]) nodes.push(<React.Fragment key={`insert-${nodes.length}`}>{afterSection[key]}</React.Fragment>);
  };
  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = paragraph.join(" ").trim();
    if (text) nodes.push(<p key={`p-${nodes.length}`} className="adi-body-paragraph">{renderInline(text)}</p>);
    paragraph = [];
  };
  const flushBullets = () => {
    if (!bullets.length) return;
    nodes.push(<ul key={`ul-${nodes.length}`} className="adi-body-list">{bullets.map((item, index) => <li key={index}><span className="adi-body-list-dot"/><span>{renderInline(item)}</span></li>)}</ul>);
    bullets = [];
  };
  const flushNumbered = () => {
    if (!numbered.length) return;
    nodes.push(<ol key={`ol-${nodes.length}`} className="adi-body-numbered">{numbered.map((item, index) => <li key={index}><span className="adi-body-number">{String(index + 1).padStart(2, "0")}</span><span>{renderInline(item)}</span></li>)}</ol>);
    numbered = [];
  };
  const flushAll = () => { flushParagraph(); flushBullets(); flushNumbered(); };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushAll(); continue; }
    if (/^###\s+/.test(line)) {
      flushAll();
      nodes.push(<h3 key={`h3-${nodes.length}`} className="adi-body-h3">{renderInline(cleanHeading(line.replace(/^###\s+/, "")))}</h3>);
      continue;
    }
    if (/^##\s+/.test(line)) {
      flushAll();
      maybeInsert();
      currentH2 = cleanHeading(line.replace(/^##\s+/, ""));
      nodes.push(<h2 key={`h2-${nodes.length}`} className="adi-body-h2">{renderInline(currentH2)}</h2>);
      continue;
    }
    if (/^>\s+/.test(line)) {
      flushAll();
      nodes.push(<blockquote key={`q-${nodes.length}`}>{renderInline(line.replace(/^>\s+/, ""))}</blockquote>);
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      flushParagraph(); flushNumbered();
      bullets.push(line.replace(/^[-*]\s+/, ""));
      continue;
    }
    if (/^\d+[.)]\s+/.test(line)) {
      flushParagraph(); flushBullets();
      numbered.push(line.replace(/^\d+[.)]\s+/, ""));
      continue;
    }
    paragraph.push(line);
  }
  flushAll();
  maybeInsert();
  return <div className="adi-article-prose">{nodes}</div>;
}
