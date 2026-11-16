"use client";

import Link from "next/link";
import { Bike, Check, ChefHat, ClipboardCheck, House, MapPin, Package, Phone, Radio, Star, ThumbsUp, type LucideIcon } from "lucide-react";
import { StatusBadge } from "@/components/ui";
import { dateTime, label, money } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";

const FLOW: OrderStatus[] = ["Placed", "Confirmed", "InProduction", "Packed", "OutForDelivery", "Delivered"];

const ICONS: Partial<Record<OrderStatus, LucideIcon>> = {
  Placed: ClipboardCheck,
  Confirmed: ThumbsUp,
  InProduction: ChefHat,
  Packed: Package,
  OutForDelivery: Bike,
  Delivered: House,
};

/** Timeline, live map and bill for one order. Used by tracking, success and account pages. */
export function OrderTracker({ order, live }: { order: Order; live?: boolean }) {
  const stopped = order.status === "Cancelled" || order.status === "Returned";
  const reached = new Map(order.history.map((h) => [h.toStatus, h.changedAt]));
  reached.set("Placed", order.createdAt);
  const currentIndex = FLOW.indexOf(order.status);
  const progress = Math.round((Math.max(0, currentIndex) / (FLOW.length - 1)) * 100);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <section className="surface p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-choco-light">Order</div>
              <div className="font-display text-3xl font-bold uppercase tracking-wide">{order.orderNumber}</div>
            </div>
            <div className="flex items-center gap-2">
              {live && !stopped && order.status !== "Delivered" && (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700"><Radio className="size-3.5 animate-pulse" /> Live</span>
              )}
              <StatusBadge value={order.status} />
            </div>
          </div>

          {!stopped && (
            <div className="mb-6 h-2.5 overflow-hidden rounded-full bg-cream-dark" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Order progress">
              <div className="h-full rounded-full bg-gradient-to-r from-berry to-pink transition-all duration-700" style={{ width: `${Math.max(progress, 6)}%` }} />
            </div>
          )}

          {stopped ? (
            <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
              This order was {order.status.toLowerCase()}. {order.cancelReason && `Reason: ${order.cancelReason}`}
            </p>
          ) : (
            <ol className="space-y-0">
              {FLOW.filter((s) => s !== "InProduction" || reached.has("InProduction")).map((step, i, steps) => {
                const done = FLOW.indexOf(step) <= currentIndex;
                const current = step === order.status;
                const Icon = ICONS[step] ?? Check;
                return (
                  <li key={step} className="relative flex gap-4 pb-6 last:pb-0">
                    {i < steps.length - 1 && <span className={`absolute left-[19px] top-10 h-full w-0.5 ${done ? "bg-berry" : "bg-choco/10"}`} />}
                    <span className={`relative z-10 flex size-10 items-center justify-center rounded-full ${current ? "bg-sun text-choco ring-4 ring-sun/30" : done ? "bg-berry text-white" : "bg-cream-dark text-choco/30"}`}>
                      <Icon className="size-5" />
                    </span>
                    <div className="pt-1.5">
                      <div className={`font-display text-lg font-semibold uppercase leading-tight tracking-wide ${done ? "" : "text-choco/40"}`}>{label(step)}</div>
                      {reached.get(step) && <div className="text-xs text-choco-light">{dateTime(reached.get(step)!)}</div>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {order.status === "OutForDelivery" && (
          <section className="surface overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div className="font-display text-lg font-semibold uppercase tracking-wide">Your delivery is on the way</div>
              {order.lastLocationAt && <div className="text-xs text-choco-light">Updated {dateTime(order.lastLocationAt)}</div>}
            </div>
            {order.lastLatitude && order.lastLongitude ? (
              <iframe
                title="Delivery location"
                className="h-72 w-full border-0"
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${order.lastLongitude - 0.01}%2C${order.lastLatitude - 0.01}%2C${order.lastLongitude + 0.01}%2C${order.lastLatitude + 0.01}&layer=mapnik&marker=${order.lastLatitude}%2C${order.lastLongitude}`}
              />
            ) : (
              <p className="flex items-center gap-2 px-4 pb-4 text-sm text-choco-light"><MapPin className="size-4" /> Live location will appear when the rider shares it.</p>
            )}
          </section>
        )}
      </div>

      <aside className="space-y-4">
        {order.status === "Delivered" && (
          <Link href="/testimonials#write" className="flex items-center gap-3 rounded-3xl bg-sun p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white"><Star className="size-6 fill-sun text-sun" /></span>
            <span>
              <span className="block font-display text-lg font-semibold uppercase tracking-wide">Enjoyed it?</span>
              <span className="block text-sm text-choco/80">Rate us and help other families choose.</span>
            </span>
          </Link>
        )}
        {order.deliveryOtp && order.status !== "Delivered" && !stopped && (
          <div className="rounded-3xl bg-sun p-5 text-center shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider">Delivery OTP</div>
            <div className="my-1 font-display text-5xl font-bold tracking-[0.3em] text-choco">{order.deliveryOtp}</div>
            <div className="text-xs text-choco-light">Share this only with the delivery partner at your door.</div>
          </div>
        )}
        {order.deliveryPartnerName && (
          <div className="surface flex items-center justify-between p-5">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-choco-light">Delivery partner</div>
              <div className="font-semibold">{order.deliveryPartnerName}</div>
            </div>
            {order.deliveryPartnerMobile && (
              <a href={`tel:${order.deliveryPartnerMobile}`} className="btn-outline btn-sm"><Phone className="size-4" /> Call</a>
            )}
          </div>
        )}
        <div className="surface p-5">
          <h3 className="mb-3 font-display text-xl font-semibold uppercase tracking-wide">Bill</h3>
          <ul className="space-y-1.5 text-sm">
            {order.items.map((i) => (
              <li key={i.variantId} className="flex justify-between gap-2">
                <span>{i.productName} <span className="text-choco-light">{i.variantName} x {i.quantity}</span></span>
                <span>{money(i.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1.5 border-t border-choco/10 pt-3 text-sm">
            {order.discount > 0 && <div className="flex justify-between text-emerald-700"><dt>Discount</dt><dd>- {money(order.discount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-choco-light">Delivery</dt><dd>{order.deliveryCharge ? money(order.deliveryCharge) : "Free"}</dd></div>
            <div className="flex items-baseline justify-between border-t border-dashed border-choco/15 pt-2"><dt className="font-display text-lg font-semibold uppercase tracking-wide">Total</dt><dd className="text-xl font-bold">{money(order.grandTotal)}</dd></div>
            <div className="flex justify-between text-xs text-choco-light"><dt>Payment</dt><dd>{label(order.paymentMethod)}, {label(order.paymentStatus)}</dd></div>
          </dl>
        </div>
        <div className="surface p-5 text-sm">
          <h3 className="mb-1 flex items-center gap-1.5 font-display text-lg font-semibold uppercase tracking-wide"><MapPin className="size-4 text-berry" /> Deliver to</h3>
          <p className="text-choco-light">{order.customerName}, {order.addressLine}, {order.city} {order.pincode}</p>
        </div>
      </aside>
    </div>
  );
}
