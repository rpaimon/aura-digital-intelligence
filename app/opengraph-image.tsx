import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Aura Digital Intelligence — Fiji technology news and business intelligence";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, background: "#080a0d", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 78% 15%, rgba(185,255,102,.18), transparent 28%), linear-gradient(135deg, rgba(255,255,255,.04), transparent 38%)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 18, letterSpacing: ".22em", fontWeight: 800, opacity: .48 }}>AURA DIGITAL FIJI</span>
            <span style={{ marginTop: 10, fontSize: 36, fontWeight: 900 }}>AURA INTELLIGENCE</span>
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: ".12em", opacity: .5 }}>FIJI · PACIFIC</span>
        </div>
        <div style={{ maxWidth: 940, position: "relative", display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: ".15em", color: "#b9ff66" }}>VERIFIED TECHNOLOGY INTELLIGENCE</span>
          <span style={{ marginTop: 18, fontSize: 74, lineHeight: .96, letterSpacing: "-.045em", fontWeight: 900 }}>Technology news with practical Fiji business context.</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, opacity: .48, position: "relative" }}>
          <span>AI · Cybersecurity · Cloud · Business · Ecommerce</span>
          <span>intelligence.auradigitalfiji.com</span>
        </div>
      </div>
    ),
    size
  );
}
