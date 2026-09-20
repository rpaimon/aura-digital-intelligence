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
        <a key={`${match.index}-${match[2]}`} href={match[2]} target="_blank" rel="noreferrer noopener" className="font-semibold underline decoration-black/20 underline-offset-4 hover:decoration-black">
          {match[1]}
        </a>
      );
    } else if (match[3]) {
      parts.push(<strong key={`${match.index}-strong`}>{match[3]}</strong>);
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
    if (text) nodes.push(<p key={`p-${nodes.length}`} className="text-[1.05rem] leading-8 text-[#353941]">{renderInline(text)}</p>);
    paragraph = [];
  };

  const flushBullets = () => {
    if (!bullets.length) return;
    nodes.push(
      <ul key={`ul-${nodes.length}`} className="space-y-2 pl-5 text-[1.02rem] leading-7 text-[#353941]">
        {bullets.map((item, index) => <li key={index} className="list-disc pl-1">{renderInline(item)}</li>)}
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
      nodes.push(<h3 key={`h3-${nodes.length}`} className="pt-4 text-2xl font-black tracking-[-0.02em]">{renderInline(line.replace(/^###\s+/, ""))}</h3>);
      continue;
    }

    if (/^##\s+/.test(line)) {
      flushParagraph();
      flushBullets();
      nodes.push(<h2 key={`h2-${nodes.length}`} className="pt-6 text-3xl font-black tracking-[-0.03em]">{renderInline(line.replace(/^##\s+/, ""))}</h2>);
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

  return <div className="space-y-6">{nodes}</div>;
}
