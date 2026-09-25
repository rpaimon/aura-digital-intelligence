import { ImageResponse } from "next/og";
import { displayCategory, getPublishedArticleBySlug } from "@/lib/news/public";

export const runtime = "edge";
export const alt = "Aura Digital Intelligence article preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Params = Promise<{ slug: string }>;

export default async function Image({ params }: { params: Params }) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  const title = article?.title || "Aura Digital Intelligence";
  const category = article ? displayCategory(article) : "Technology";
  const fontSize = title.length >= 105 ? 48 : title.length >= 82 ? 54 : title.length >= 58 ? 61 : 68;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "58px 64px 52px", background: "#080a0d", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: 999, right: -130, top: -180, background: "rgba(185,255,102,.16)" }} />
        <div style={{ position: "absolute", width: 320, height: 320, borderRadius: 999, left: -120, bottom: -170, background: "rgba(255,122,165,.10)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,.035), transparent 40%)" }} />

        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 17, letterSpacing: ".22em", fontWeight: 800, opacity: .5 }}>AURA DIGITAL FIJI</span>
            <span style={{ marginTop: 8, fontSize: 34, letterSpacing: "-.03em", fontWeight: 900 }}>AURA INTELLIGENCE</span>
          </div>
          <span style={{ padding: "9px 14px", border: "1px solid rgba(255,255,255,.20)", borderRadius: 999, fontSize: 14, fontWeight: 800, letterSpacing: ".10em", opacity: .8 }}>FIJI · PACIFIC</span>
        </div>

        <div style={{ position: "relative", maxWidth: 1020, display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: ".13em", color: "#b9ff66", textTransform: "uppercase" }}>{category}</span>
          <span style={{ marginTop: 17, fontSize, lineHeight: .98, fontWeight: 900, letterSpacing: "-.045em" }}>{title}</span>
        </div>

        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 16, color: "rgba(255,255,255,.5)" }}>
          <span>Verified technology intelligence for Fiji business</span>
          <span>intelligence.auradigitalfiji.com</span>
        </div>
      </div>
    ),
    size
  );
}
