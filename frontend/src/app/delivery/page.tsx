"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Phone } from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/auth/require-auth";
import { MobileShell } from "@/components/layout/mobile-shell";
import { EmptyState, PageLoader, StatusBadge } from "@/components/ui";
import { useMyDeliveriesQuery, useShareLocationMutation, useUpdateDeliveryMutation } from "@/features/orders/api";
import { money } from "@/lib/format";
import type { Order } from "@/lib/types";
import { errorMessage } from "@/store/api";

export default function DeliveryPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RequireAuth roles={["Delivery"]}>
        <MobileShell title="My deliveries">
          <Tasks />
        </MobileShell>
      </RequireAuth>
    </Suspense>
  );
}

function Tasks() {
  const { data, isLoading } = useMyDeliveriesQuery(undefined, { pollingInterval: 30_000 });
  if (isLoading) return <PageLoader />;
  if (!data?.length) return <EmptyState title="No deliveries assigned" text="New tasks show up here automatically." />;
  return <>{data.map((o) => <Task key={o.id} order={o} />)}</>;
}

function Task({ order }: { order: Order }) {
  const [update, { isLoading }] = useUpdateDeliveryMutation();
  const [otp, setOtp] = useState("");
  const sharing = useLocationSharing(order.status === "OutForDelivery" ? order.id : null);
  const address = `${order.addressLine}, ${order.city} ${order.pincode}`;

  const act = async (status: Order["status"], code?: string) => {
    try {
      await update({ id: order.id, status, otp: code }).unwrap();
      toast.success(status === "Delivered" ? "Delivered. Great job!" : "Updated");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div className="card space-y-3 p-5">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{order.orderNumber}</span>
        <StatusBadge value={order.status} />
      </div>
      <div>
        <div className="font-semibold">{order.customerName}</div>
        <div className="text-sm text-choco-light">{address}</div>
        {order.notes && <div className="mt-1 text-xs text-amber-800">Note: {order.notes}</div>}
      </div>
      <div className="flex items-center justify-between rounded-xl bg-cream px-3 py-2 text-sm">
        <span>{order.items.reduce((n, i) => n + i.quantity, 0)} items</span>
        <span className="font-bold">{order.paymentStatus === "Paid" ? "Paid" : `Collect ${money(order.grandTotal)}`}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <a href={`tel:${order.customerMobile}`} className="btn-outline btn-sm"><Phone className="size-4" /> Call</a>
        <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer" className="btn-outline btn-sm"><Navigation className="size-4" /> Navigate</a>
      </div>

      {order.status === "Packed" && <button disabled={isLoading} onClick={() => act("OutForDelivery")} className="btn-primary w-full py-3">Picked up, start delivery</button>}
      {["Confirmed", "InProduction"].includes(order.status) && <p className="text-center text-sm text-choco-light">Waiting for packing at the factory.</p>}
      {order.status === "OutForDelivery" && (
        <div className="space-y-2">
          <p className="flex items-center gap-1 text-xs text-emerald-700"><MapPin className="size-3.5" /> {sharing ? "Sharing live location with the customer" : "Allow location to share live tracking"}</p>
          <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" placeholder="Customer OTP" className="input text-center text-lg tracking-[0.4em]" aria-label="Customer OTP" />
          <button disabled={isLoading || otp.length !== 4} onClick={() => act("Delivered", otp)} className="btn-primary w-full py-3">Mark delivered</button>
          <button disabled={isLoading} onClick={() => confirm("Customer not available? Return this order to the factory.") && act("Returned")} className="btn-ghost btn-sm w-full text-red-600">Could not deliver</button>
        </div>
      )}
    </div>
  );
}

/** Sends the rider's GPS position every 15 seconds while an order is out for delivery. */
function useLocationSharing(orderId: number | null) {
  const [share] = useShareLocationMutation();
  const [active, setActive] = useState(false);
  const last = useRef(0);

  useEffect(() => {
    if (!orderId || !("geolocation" in navigator)) return;
    const watch = navigator.geolocation.watchPosition(
      (pos) => {
        setActive(true);
        if (Date.now() - last.current < 15_000) return;
        last.current = Date.now();
        void share({ id: orderId, latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      () => setActive(false),
      { enableHighAccuracy: true, maximumAge: 10_000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [orderId, share]);

  return active;
}
