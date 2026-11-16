"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { AppImage, EmptyState, PageLoader, Spinner } from "@/components/ui";
import { useCheckoutSummaryQuery } from "@/features/orders/api";
import { money } from "@/lib/format";
import { removeItem, setCoupon, setQuantity } from "@/store/cartSlice";
import { useAppDispatch, useAppSelector } from "@/store/store";

export default function CartPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <CartContent />
    </Suspense>
  );
}

function CartContent() {
  const dispatch = useAppDispatch();
  const { items, couponCode } = useAppSelector((s) => s.cart);
  const [code, setCode] = useState(couponCode ?? "");
  const lines = items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
  const { data: summary, isFetching, error } = useCheckoutSummaryQuery({ items: lines, couponCode }, { skip: items.length === 0 });

  if (items.length === 0) {
    return (
      <div className="container-page py-12">
        <EmptyState title="Your cart is empty" text="Add a scoop or two and come back here." action={<Link href="/products" className="btn-primary">Browse ice creams</Link>} />
      </div>
    );
  }

  const stockOf = (variantId: number) => summary?.lines.find((l) => l.variantId === variantId)?.availableQty;
  const hasStockIssue = items.some((i) => (stockOf(i.variantId) ?? Infinity) < i.quantity);

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-3xl font-bold">Your cart</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <ul className="space-y-3">
          {items.map((item) => {
            const stock = stockOf(item.variantId);
            return (
              <li key={item.variantId} className="card flex gap-4 p-4">
                <Link href={`/products/${item.slug}`} className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-cream-dark">
                  <AppImage src={item.imageUrl} alt={item.productName} sizes="96px" />
                </Link>
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex justify-between gap-2">
                    <div>
                      <Link href={`/products/${item.slug}`} className="font-semibold hover:text-berry">{item.productName}</Link>
                      <div className="text-sm text-choco-light">{item.variantName}</div>
                    </div>
                    <button onClick={() => dispatch(removeItem(item.variantId))} className="btn-ghost btn-sm h-fit" aria-label="Remove">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center rounded-full border border-choco/15">
                      <button className="p-2" onClick={() => dispatch(setQuantity({ variantId: item.variantId, quantity: item.quantity - 1 }))} aria-label="Less"><Minus className="size-3.5" /></button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button className="p-2" onClick={() => dispatch(setQuantity({ variantId: item.variantId, quantity: item.quantity + 1 }))} aria-label="More"><Plus className="size-3.5" /></button>
                    </div>
                    <span className="font-semibold">{money(item.price * item.quantity)}</span>
                  </div>
                  {stock !== undefined && stock < item.quantity && (
                    <p className="text-xs font-medium text-red-600">Only {stock} available. Please reduce the quantity.</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="card h-fit space-y-4 p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <form
            className="flex gap-2"
            onSubmit={(e) => { e.preventDefault(); dispatch(setCoupon(code.trim().toUpperCase() || null)); }}
          >
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code" className="input" aria-label="Coupon code" />
            <button className="btn-outline">Apply</button>
          </form>
          {summary?.couponMessage && (
            <p className={`text-xs ${summary.couponCode ? "text-emerald-700" : "text-red-600"}`}>{summary.couponMessage}</p>
          )}
          {error ? (
            <p className="text-sm text-red-600">Some items are no longer available. Remove them to continue.</p>
          ) : !summary ? (
            <Spinner />
          ) : (
            <dl className="space-y-2 text-sm">
              <Row label="Items total" value={money(summary.subTotal)} />
              {summary.discount > 0 && <Row label={`Discount (${summary.couponCode})`} value={`- ${money(summary.discount)}`} green />}
              <Row label="Delivery" value={summary.deliveryCharge === 0 ? "Free" : money(summary.deliveryCharge)} />
              <div className="flex justify-between border-t border-choco/10 pt-3 text-base font-bold">
                <dt>Total</dt>
                <dd className="flex items-center gap-2">{isFetching && <Spinner className="size-4" />}{money(summary.grandTotal)}</dd>
              </div>
              <p className="text-xs text-choco-light">Includes GST of {money(summary.gst)}</p>
            </dl>
          )}
          <Link
            href="/checkout"
            aria-disabled={hasStockIssue || !!error}
            className={`btn-primary w-full py-3 ${hasStockIssue || error ? "pointer-events-none opacity-50" : ""}`}
          >
            Checkout
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div className={`flex justify-between ${green ? "text-emerald-700" : ""}`}>
      <dt className="text-choco-light">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
