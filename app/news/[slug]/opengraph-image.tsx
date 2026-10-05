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
  const imageUrl = article?.featured_image_url || null;
  const fontSize = title.length >= 105 ? 44 : title.length >= 82 ? 49 : title.length >= 58 ? 55 : 61;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden", background: "#0a0d11", color: "#fff" }}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" width="1200" height="630" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        ) : null}
        <div style={{ position: "absolute", inset: 0, background: imageUrl ? "linear-gradient(90deg, rgba(8,10,13,.94) 0%, rgba(8,10,13,.83) 48%, rgba(8,10,13,.30) 100%)" : "linear-gradient(135deg, #0a0d11 0%, #141a21 100%)" }} />
        <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "54px 62px 48px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 15, letterSpacing: ".22em", fontWeight: 800, opacity: .66 }}>AURA DIGITAL FIJI</span>
              <span style={{ marginTop: 7, fontSize: 30, letterSpacing: "-.03em", fontWeight: 900 }}>AURA INTELLIGENCE</span>
            </div>
            <span style={{ padding: "8px 13px", border: "1px solid rgba(255,255,255,.28)", borderRadius: 999, fontSize: 13, fontWeight: 800, letterSpacing: ".10em" }}>FIJI · PACIFIC</span>
          </div>

          <div style={{ maxWidth: imageUrl ? 780 : 1030, display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 16, fontWeight: 900, letterSpacing: ".13em", color: "#b9ff66", textTransform: "uppercase" }}>{category}</span>
            <span style={{ marginTop: 16, fontSize, lineHeight: 1, fontWeight: 900, letterSpacing: "-.045em" }}>{title}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 15, color: "rgba(255,255,255,.64)" }}>
            <span>Technology reporting for Fiji business</span>
            <span>intelligence.auradigitalfiji.com</span>
          </div>
        </div>
      </div>
    ),
    size
  );
}
