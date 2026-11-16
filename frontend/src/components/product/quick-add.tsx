"use client";

import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import type { ProductCard } from "@/lib/types";
import { useHydrated } from "@/lib/use-hydrated";
import { addItem, removeItem, setQuantity } from "@/store/cartSlice";
import { useAppDispatch, useAppSelector } from "@/store/store";

/** Add to cart from the product card. Turns into a minus / plus stepper once the item is in the cart. */
export function QuickAdd({ product }: { product: ProductCard }) {
  const dispatch = useAppDispatch();
  const id = product.quickVariantId;
  const hydrated = useHydrated();
  const saved = useAppSelector((s) => s.cart.items.find((i) => i.variantId === id)?.quantity ?? 0);
  const inCart = hydrated ? saved : 0;

  if (!id || product.quickVariantAvailable <= 0) {
    return <span className="btn w-full cursor-not-allowed bg-cream-dark text-choco/50">Sold out</span>;
  }

  const max = Math.min(50, product.quickVariantAvailable);

  if (inCart === 0) {
    return (
      <button
        type="button"
        className="btn-primary w-full"
        onClick={() => {
          dispatch(addItem({
            variantId: id,
            slug: product.slug,
            productName: product.name,
            variantName: product.quickVariantName ?? "",
            price: product.quickVariantPrice,
            imageUrl: product.imageUrl,
            quantity: 1,
          }));
          toast.success(`${product.name} added to cart`);
        }}
      >
        Add to cart
      </button>
    );
  }

  return (
    <div className="flex w-full items-center justify-between rounded-full bg-berry text-white">
      <button
        type="button"
        className="p-2.5"
        aria-label={`One less ${product.name}`}
        onClick={() => dispatch(inCart <= 1 ? removeItem(id) : setQuantity({ variantId: id, quantity: inCart - 1 }))}
      >
        <Minus className="size-4" />
      </button>
      <span className="text-sm font-bold" aria-live="polite">{inCart} in cart</span>
      <button
        type="button"
        className="p-2.5 disabled:opacity-40"
        aria-label={`One more ${product.name}`}
        disabled={inCart >= max}
        onClick={() => dispatch(setQuantity({ variantId: id, quantity: inCart + 1 }))}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
