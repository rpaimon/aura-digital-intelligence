import { ImageResponse } from "next/og";
import { getPublishedArticleBySlug } from "@/lib/news/public";

export const runtime = "edge";
export const alt = "Aura Digital Intelligence article";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Params = Promise<{ slug: string }>;

export default async function Image({ params }: { params: Params }) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  const title = article?.title || "Aura Digital Intelligence";
  const category = article?.category || "Technology Intelligence";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, background: "#07090d", color: "white", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 520, height: 520, borderRadius: 999, background: "rgba(190,242,100,.12)", filter: "blur(80px)", left: -180, top: -220 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 24, fontWeight: 800, letterSpacing: "0.08em", color: "#bef264" }}>
          <div style={{ width: 52, height: 52, border: "2px solid rgba(190,242,100,.45)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>A</div>
          AURA DIGITAL INTELLIGENCE
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 1040 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#bef264", marginBottom: 20 }}>{category}</div>
          <div style={{ fontSize: title.length > 85 ? 52 : 62, lineHeight: 1.02, fontWeight: 900, letterSpacing: "-0.04em" }}>{title}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "rgba(255,255,255,.55)" }}>
          <span>Technology intelligence for Fiji & the Pacific</span>
          <span>intelligence.auradigitalfiji.com</span>
        </div>
      </div>
    ),
    size
  );
}
