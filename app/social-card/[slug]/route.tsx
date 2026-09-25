import { ImageResponse } from "next/og";
import { displayCategory, getPublishedArticleBySlug } from "@/lib/news/public";

export const runtime = "edge";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  const title = article?.title || "Aura Digital Intelligence";
  const category = article ? displayCategory(article) : "Technology";
  const fontSize = title.length > 105 ? 48 : title.length > 80 ? 55 : title.length > 55 ? 62 : 70;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "58px 64px 52px", background: "#080a0d", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 430, height: 430, borderRadius: 999, right: -100, top: -140, background: "rgba(185,255,102,.16)" }} />
        <div style={{ position: "absolute", width: 260, height: 260, borderRadius: 999, left: -80, bottom: -120, background: "rgba(255,122,165,.12)" }} />
        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 17, letterSpacing: ".23em", fontWeight: 800, opacity: .48 }}>AURA DIGITAL FIJI</span>
            <span style={{ marginTop: 8, fontSize: 34, letterSpacing: "-.03em", fontWeight: 900 }}>AURA INTELLIGENCE</span>
          </div>
          <span style={{ padding: "10px 15px", border: "1px solid rgba(255,255,255,.22)", borderRadius: 999, fontSize: 15, fontWeight: 800, letterSpacing: ".09em" }}>FIJI · PACIFIC</span>
        </div>
        <div style={{ position: "relative", maxWidth: 1030, display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 19, fontWeight: 900, letterSpacing: ".13em", color: "#b9ff66", textTransform: "uppercase" }}>{category}</span>
          <span style={{ marginTop: 18, fontSize, lineHeight: .98, fontWeight: 900, letterSpacing: "-.045em" }}>{title}</span>
        </div>
        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 17, color: "rgba(255,255,255,.48)" }}>
          <span>Verified technology intelligence for Fiji business</span>
          <span>intelligence.auradigitalfiji.com</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
