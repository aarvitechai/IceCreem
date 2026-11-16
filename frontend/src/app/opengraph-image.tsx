import { ImageResponse } from "next/og";
import { brand } from "@/lib/brand";

// Preview card for WhatsApp, Facebook and Google when someone shares the site link.
export const alt = `${brand.name}: fresh ice cream delivered`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "linear-gradient(135deg, #d63a6e 0%, #f4a51c 100%)", color: "white", padding: 72, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 24, flex: 1 }}>
          <div style={{ fontSize: 34, opacity: 0.9 }}>Fresh every morning</div>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1 }}>{brand.name}</div>
          <div style={{ fontSize: 40, opacity: 0.95 }}>Tubs, cones, kulfi and wedding counters</div>
          <div style={{ display: "flex", marginTop: 16, fontSize: 36, background: "white", color: "#b02a58", padding: "14px 28px", borderRadius: 999, alignSelf: "flex-start", fontWeight: 700 }}>
            Order: {brand.phoneDisplay}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 320 }}>
          <div style={{ display: "flex" }}>
            <div style={{ width: 130, height: 130, borderRadius: 999, background: "#f59ab5", marginRight: -30 }} />
            <div style={{ width: 130, height: 130, borderRadius: 999, background: "#fbe9b7" }} />
          </div>
          <div style={{ width: 0, height: 0, borderLeft: "110px solid transparent", borderRight: "110px solid transparent", borderTop: "220px solid #e8b166", marginTop: -40 }} />
        </div>
      </div>
    ),
    size,
  );
}
