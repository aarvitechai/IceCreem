"use client";

import { Check, MapPin, Phone, Radio } from "lucide-react";
import { StatusBadge } from "@/components/ui";
import { dateTime, label, money } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";

const FLOW: OrderStatus[] = ["Placed", "Confirmed", "InProduction", "Packed", "OutForDelivery", "Delivered"];

/** Timeline, live map and bill for one order. Used by tracking, success and account pages. */
export function OrderTracker({ order, live }: { order: Order; live?: boolean }) {
  const stopped = order.status === "Cancelled" || order.status === "Returned";
  const reached = new Map(order.history.map((h) => [h.toStatus, h.changedAt]));
  reached.set("Placed", order.createdAt);
  const currentIndex = FLOW.indexOf(order.status);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <section className="card p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm text-choco-light">Order</div>
              <div className="font-display text-2xl font-bold">{order.orderNumber}</div>
            </div>
            <div className="flex items-center gap-2">
              {live && !stopped && order.status !== "Delivered" && (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700"><Radio className="size-3.5 animate-pulse" /> Live</span>
              )}
              <StatusBadge value={order.status} />
            </div>
          </div>

          {stopped ? (
            <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
              This order was {order.status.toLowerCase()}. {order.cancelReason && `Reason: ${order.cancelReason}`}
            </p>
          ) : (
            <ol className="space-y-0">
              {FLOW.filter((s) => s !== "InProduction" || reached.has("InProduction")).map((step, i, steps) => {
                const done = FLOW.indexOf(step) <= currentIndex;
                return (
                  <li key={step} className="relative flex gap-4 pb-6 last:pb-0">
                    {i < steps.length - 1 && <span className={`absolute left-[15px] top-8 h-full w-0.5 ${done ? "bg-berry" : "bg-choco/10"}`} />}
                    <span className={`relative z-10 flex size-8 items-center justify-center rounded-full border-2 ${done ? "border-berry bg-berry text-white" : "border-choco/15 bg-white"}`}>
                      {done ? <Check className="size-4" /> : <span className="size-2 rounded-full bg-choco/20" />}
                    </span>
                    <div>
                      <div className={`font-semibold ${done ? "" : "text-choco/40"}`}>{label(step)}</div>
                      {reached.get(step) && <div className="text-xs text-choco-light">{dateTime(reached.get(step)!)}</div>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {order.status === "OutForDelivery" && (
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div className="font-semibold">Your delivery is on the way</div>
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
        {order.deliveryOtp && order.status !== "Delivered" && !stopped && (
          <div className="card border-berry/30 bg-berry-light p-5 text-center">
            <div className="text-sm font-medium">Delivery OTP</div>
            <div className="my-1 font-display text-4xl font-bold tracking-[0.3em] text-berry">{order.deliveryOtp}</div>
            <div className="text-xs text-choco-light">Share this only with the delivery partner at your door.</div>
          </div>
        )}
        {order.deliveryPartnerName && (
          <div className="card flex items-center justify-between p-5">
            <div>
              <div className="text-xs text-choco-light">Delivery partner</div>
              <div className="font-semibold">{order.deliveryPartnerName}</div>
            </div>
            {order.deliveryPartnerMobile && (
              <a href={`tel:${order.deliveryPartnerMobile}`} className="btn-outline btn-sm"><Phone className="size-4" /> Call</a>
            )}
          </div>
        )}
        <div className="card p-5">
          <h3 className="mb-3 font-semibold">Bill</h3>
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
            <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd>{money(order.grandTotal)}</dd></div>
            <div className="flex justify-between text-xs text-choco-light"><dt>Payment</dt><dd>{label(order.paymentMethod)}, {label(order.paymentStatus)}</dd></div>
          </dl>
        </div>
        <div className="card p-5 text-sm">
          <h3 className="mb-1 font-semibold">Deliver to</h3>
          <p className="text-choco-light">{order.customerName}, {order.addressLine}, {order.city} {order.pincode}</p>
        </div>
      </aside>
    </div>
  );
}
