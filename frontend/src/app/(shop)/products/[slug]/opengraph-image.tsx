import { ImageResponse } from "next/og";
import { brand } from "@/lib/brand";
import { OgTub } from "@/lib/og-art";
import { serverApi } from "@/lib/server-api";

// Share preview for one product: WhatsApp, Facebook and others show this card with the link.
export const alt = `${brand.name} product`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const money = (n: number) => `Rs ${Number.isInteger(n) ? n : n.toFixed(2)}`;

export default async function ProductShareImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await serverApi.product(slug).catch(() => null);
  const name = product?.name ?? brand.name;
  const line = product?.shortDescription ?? brand.tagline;
  const prices = product?.variants.map((v) => v.sellingPrice) ?? [];
  const from = prices.length ? Math.min(...prices) : null;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "linear-gradient(135deg, #d63a6e 0%, #f4a51c 100%)", color: "white", padding: 64, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, opacity: 0.95 }}>{brand.name}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontSize: 80, fontWeight: 800, lineHeight: 1.05 }}>{name}</div>
            <div style={{ fontSize: 34, opacity: 0.92, maxWidth: 680 }}>{line}</div>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {from !== null && (
              <div style={{ display: "flex", background: "white", color: "#b02a58", padding: "14px 28px", borderRadius: 999, fontSize: 36, fontWeight: 800 }}>
                from {money(from)}
              </div>
            )}
            <div style={{ display: "flex", border: "3px solid rgba(255,255,255,0.7)", padding: "12px 26px", borderRadius: 999, fontSize: 30 }}>
              Order: {brand.phoneDisplay}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <OgTub />
        </div>
      </div>
    ),
    size,
  );
}
