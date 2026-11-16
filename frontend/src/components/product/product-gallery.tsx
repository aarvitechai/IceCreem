"use client";

import { useState } from "react";
import { AppImage } from "@/components/ui";
import type { ProductDetail } from "@/lib/types";

/** Image slider with thumbnails and hover zoom. */
export function ProductGallery({ images, name }: { images: ProductDetail["images"]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const list = images.length > 0 ? images : [{ id: 0, imageUrl: "/images/products/placeholder.svg", altText: name, isPrimary: true }];
  const current = list[Math.min(active, list.length - 1)];

  return (
    <div className="space-y-3">
      <div
        className="card relative aspect-square cursor-zoom-in overflow-hidden"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseLeave={() => setZoom(null)}
      >
        <div
          className="absolute inset-0 transition-transform duration-200"
          style={zoom ? { transform: "scale(1.8)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
        >
          <AppImage src={current.imageUrl} alt={current.altText ?? name} priority sizes="(max-width: 1024px) 100vw, 50vw" />
        </div>
      </div>
      {list.length > 1 && (
        <div className="flex gap-3">
          {list.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              className={`relative size-20 overflow-hidden rounded-xl border-2 ${i === active ? "border-berry" : "border-transparent"}`}
              aria-label={`Show image ${i + 1}`}
            >
              <AppImage src={img.imageUrl} alt="" sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
