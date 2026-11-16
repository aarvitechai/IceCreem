"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { ArrowLeft, Minus, Plus, ShieldCheck, Tag, Trash2, Truck } from "lucide-react";
import { PageBanner } from "@/components/layout/page-banner";
import { AppImage, EmptyState, PageLoader, Spinner } from "@/components/ui";
import { useCheckoutSummaryQuery } from "@/features/orders/api";
import { brand } from "@/lib/brand";
import { money } from "@/lib/format";
import { useHydrated } from "@/lib/use-hydrated";
import { removeItem, setCoupon, setQuantity } from "@/store/cartSlice";
import { useAppDispatch, useAppSelector } from "@/store/store";

export default function CartPage() {
  return (
    <>
      <PageBanner title="Your cart" step={1} />
      <Suspense fallback={<PageLoader />}>
        <CartContent />
      </Suspense>
    </>
  );
}

function CartContent() {
  const dispatch = useAppDispatch();
  const hydrated = useHydrated();
  const { items, couponCode } = useAppSelector((s) => s.cart);
  const [code, setCode] = useState(couponCode ?? "");
  const lines = items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
  const { data: summary, isFetching, error } = useCheckoutSummaryQuery({ items: lines, couponCode }, { skip: items.length === 0 });

  if (!hydrated) return <PageLoader />;

  if (items.length === 0) {
    return (
      <div className="container-page py-10">
        <EmptyState title="Your cart is empty" text="Add a scoop or two and come back here." action={<Link href="/products" className="btn-primary">Browse ice creams</Link>} />
      </div>
    );
  }

  const stockOf = (variantId: number) => summary?.lines.find((l) => l.variantId === variantId)?.availableQty;
  const hasStockIssue = items.some((i) => (stockOf(i.variantId) ?? Infinity) < i.quantity);
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <div className="container-page py-8">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-wider text-choco-light">{itemCount} {itemCount === 1 ? "item" : "items"}</p>
        <Link href="/products" className="flex items-center gap-1 text-sm font-semibold uppercase tracking-wider text-berry hover:underline">
          <ArrowLeft className="size-4" /> Keep shopping
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {summary && <FreeDeliveryBar subTotal={summary.subTotal} free={summary.deliveryCharge === 0} />}

          <ul className="space-y-3">
            {items.map((item) => {
              const stock = stockOf(item.variantId);
              return (
                <li key={item.variantId} className="flex gap-4 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-choco/5 sm:p-4">
                  <Link href={`/products/${item.slug}`} className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-pink-light sm:size-28">
                    <AppImage src={item.imageUrl} alt={item.productName} sizes="112px" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/products/${item.slug}`} className="font-display text-lg font-semibold uppercase leading-tight tracking-wide hover:text-berry">{item.productName}</Link>
                        <div className="text-xs text-choco-light">{item.variantName} · {money(item.price)} each</div>
                      </div>
                      <button onClick={() => dispatch(removeItem(item.variantId))} className="h-fit rounded-full p-2 text-choco/50 transition hover:bg-berry-light hover:text-berry" aria-label={`Remove ${item.productName}`}>
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full bg-berry text-white">
                        <button className="p-2 disabled:opacity-40" disabled={item.quantity <= 1} onClick={() => dispatch(setQuantity({ variantId: item.variantId, quantity: item.quantity - 1 }))} aria-label="Less"><Minus className="size-3.5" /></button>
                        <span className="w-7 text-center text-sm font-bold" aria-live="polite">{item.quantity}</span>
                        <button className="p-2" onClick={() => dispatch(setQuantity({ variantId: item.variantId, quantity: item.quantity + 1 }))} aria-label="More"><Plus className="size-3.5" /></button>
                      </div>
                      <span className="text-lg font-bold">{money(item.price * item.quantity)}</span>
                    </div>
                    {stock !== undefined && stock < item.quantity && (
                      <p className="text-xs font-medium text-red-600">Only {stock} available. Please reduce the quantity.</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <aside className="h-fit space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-choco/5 lg:sticky lg:top-24">
          <h2 className="font-display text-2xl font-semibold uppercase tracking-wide">Order summary</h2>
          <form
            className="flex gap-2"
            onSubmit={(e) => { e.preventDefault(); dispatch(setCoupon(code.trim().toUpperCase() || null)); }}
          >
            <label className="relative flex-1">
              <Tag className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-choco/40" />
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code" className="input rounded-full pl-9 uppercase" aria-label="Coupon code" />
            </label>
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
              <Row label="Delivery" value={summary.deliveryCharge === 0 ? "Free" : money(summary.deliveryCharge)} green={summary.deliveryCharge === 0} />
              <div className="flex items-baseline justify-between border-t border-dashed border-choco/15 pt-3">
                <dt className="font-display text-lg font-semibold uppercase tracking-wide">Total</dt>
                <dd className="flex items-center gap-2 text-2xl font-bold">{isFetching && <Spinner className="size-4" />}{money(summary.grandTotal)}</dd>
              </div>
              <p className="text-xs text-choco-light">Includes GST of {money(summary.gst)}</p>
            </dl>
          )}
          <Link
            href="/checkout"
            aria-disabled={hasStockIssue || !!error}
            className={`btn-primary w-full py-3.5 text-base ${hasStockIssue || error ? "pointer-events-none opacity-50" : ""}`}
          >
            Checkout
          </Link>
          <p className="flex items-center justify-center gap-1.5 text-xs text-choco-light">
            <ShieldCheck className="size-4 text-mint" /> Pay by cash or UPI when it arrives
          </p>
        </aside>
      </div>
    </div>
  );
}

/** Shows how far the cart is from free delivery. */
function FreeDeliveryBar({ subTotal, free }: { subTotal: number; free: boolean }) {
  const target = brand.freeDeliveryAbove;
  const pct = free ? 100 : Math.min(100, Math.round((subTotal / target) * 100));
  const left = Math.max(1, Math.ceil(target - subTotal));
  return (
    <div className="rounded-3xl bg-sun/30 p-4 ring-1 ring-sun">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Truck className="size-4 text-berry" />
        {free ? "Yay! You get free delivery." : <>Add <span className="text-berry">{money(left)}</span> more for free delivery</>}
      </p>
      <div className="h-2.5 overflow-hidden rounded-full bg-white" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Free delivery progress">
        <div className="h-full rounded-full bg-gradient-to-r from-berry to-pink transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Row({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div className={`flex justify-between ${green ? "text-emerald-700" : ""}`}>
      <dt className={green ? "" : "text-choco-light"}>{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
