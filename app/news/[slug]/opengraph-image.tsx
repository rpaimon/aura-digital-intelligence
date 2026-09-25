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
  const image = article?.featured_image_url || null;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#080a0d", color: "white", position: "relative", overflow: "hidden" }}>
        <div style={{ width: "46%", height: "100%", background: "#11161d", position: "relative", overflow: "hidden" }}>
          {image ? <img src={image} alt="" width="552" height="630" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent 68%, rgba(8,10,13,.75) 100%)" }} />
        </div>
        <div style={{ width: "54%", height: "100%", padding: "52px 58px 48px 34px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 15, letterSpacing: ".2em", fontWeight: 800, opacity: .42 }}>AURA DIGITAL FIJI</span>
              <span style={{ marginTop: 8, fontSize: 28, fontWeight: 900 }}>AURA INTELLIGENCE</span>
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: ".1em", opacity: .42 }}>FIJI · PACIFIC</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 19, fontWeight: 900, letterSpacing: ".1em", color: "#b9ff66", textTransform: "uppercase" }}>{category}</span>
            <span style={{ marginTop: 16, fontSize: title.length > 96 ? 45 : title.length > 70 ? 50 : 57, lineHeight: .98, fontWeight: 900, letterSpacing: "-.04em" }}>{title}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 16, color: "rgba(255,255,255,.46)" }}>
            <span>Verified technology intelligence</span>
            <span>intelligence.auradigitalfiji.com</span>
          </div>
        </div>
      </div>
    ),
    size
  );
}
