import { ImageResponse } from "next/og";
import { displayCategory, getPublishedArticleBySlug } from "@/lib/news/public";

export const runtime = "edge";
export const alt = "Aura Digital Intelligence article";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Params = Promise<{ slug: string }>;

export default async function Image({ params }: { params: Params }) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  const title = article?.title || "Aura Digital Intelligence";
  const category = article ? displayCategory(article) : "Technology Intelligence";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 58, background: "#080808", color: "white", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(31,183,211,.18),transparent 38%),linear-gradient(315deg,rgba(228,63,130,.14),transparent 42%)" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
          <div style={{ fontFamily: "serif", fontSize: 34, fontWeight: 700 }}>Aura Intelligence</div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "0.08em", opacity: .55 }}>FIJI · PACIFIC</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 1060, position: "relative" }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#f4c844", marginBottom: 18, textTransform: "uppercase", letterSpacing: "0.06em" }}>{category}</div>
          <div style={{ fontSize: title.length > 85 ? 54 : 64, lineHeight: .98, fontWeight: 900, letterSpacing: "-0.04em", textTransform: "uppercase" }}>{title}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, color: "rgba(255,255,255,.52)", position: "relative" }}>
          <span>Technology intelligence for Fiji & the Pacific</span>
          <span>intelligence.auradigitalfiji.com</span>
        </div>
      </div>
    ),
    size
  );
}
