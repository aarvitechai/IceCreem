"use client";

import Link from "next/link";
import { useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { discountPercent, money } from "@/lib/format";
import type { ProductDetail } from "@/lib/types";
import { addItem } from "@/store/cartSlice";
import { useAppDispatch } from "@/store/store";

export function AddToCart({ product }: { product: ProductDetail }) {
  const dispatch = useAppDispatch();
  const firstInStock = product.variants.find((v) => v.availableQty > 0) ?? product.variants[0];
  const [variantId, setVariantId] = useState(firstInStock?.id);
  const [qty, setQty] = useState(1);
  const variant = product.variants.find((v) => v.id === variantId);

  if (!variant) return <p className="text-choco-light">This product is not available right now.</p>;

  const max = Math.min(50, variant.availableQty);
  const off = discountPercent(variant.mrp, variant.sellingPrice);

  const add = () => {
    dispatch(addItem({
      variantId: variant.id,
      slug: product.slug,
      productName: product.name,
      variantName: variant.name,
      price: variant.sellingPrice,
      imageUrl: product.images[0]?.imageUrl ?? null,
      quantity: qty,
    }));
    toast.success(`${product.name} added to cart`, { action: { label: "View cart", onClick: () => (window.location.href = "/cart") } });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold">{money(variant.sellingPrice)}</span>
        {off > 0 && (
          <>
            <span className="text-lg text-choco/40 line-through">{money(variant.mrp)}</span>
            <span className="rounded-full bg-mint-light px-2 py-0.5 text-sm font-semibold text-emerald-800">{off}% off</span>
          </>
        )}
      </div>

      <div>
        <div className="label">Pack size</div>
        <div className="flex flex-wrap gap-2">
          {product.variants.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => { setVariantId(v.id); setQty(1); }}
              disabled={v.availableQty <= 0}
              className={`rounded-2xl border-2 px-4 py-2 text-left text-sm transition disabled:opacity-40 ${v.id === variantId ? "border-berry bg-berry-light" : "border-choco/10 bg-white hover:border-berry/50"}`}
            >
              <div className="font-semibold">{v.name}</div>
              <div className="text-xs text-choco-light">{v.availableQty > 0 ? money(v.sellingPrice) : "Out of stock"}</div>
            </button>
          ))}
        </div>
      </div>

      {max > 0 ? (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-full border border-choco/15 bg-white">
            <button className="p-3 disabled:opacity-40" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Less"><Minus className="size-4" /></button>
            <span className="w-10 text-center font-semibold" aria-live="polite">{qty}</span>
            <button className="p-3 disabled:opacity-40" onClick={() => setQty((q) => Math.min(max, q + 1))} disabled={qty >= max} aria-label="More"><Plus className="size-4" /></button>
          </div>
          <button onClick={add} className="btn-primary flex-1 py-3 sm:flex-none sm:px-10">
            <ShoppingBag className="size-4" /> Add to cart
          </button>
          <Link href="/cart" className="btn-outline py-3">Go to cart</Link>
          {variant.availableQty < 10 && <p className="w-full text-sm font-medium text-berry">Only {variant.availableQty} left</p>}
        </div>
      ) : (
        <p className="font-medium text-berry">Out of stock. Fresh batch coming soon.</p>
      )}
    </div>
  );
}
