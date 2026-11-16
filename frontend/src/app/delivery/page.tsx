"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Bike, Clock, MapPin, Navigation, Package, Phone, Undo2 } from "lucide-react";
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
        <MobileShell title="My deliveries" subtitle="Pick up, deliver, collect the OTP. That's it.">
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

  const onRoad = data.filter((o) => o.status === "OutForDelivery").length;
  const toPick = data.filter((o) => o.status === "Packed").length;
  const waiting = data.length - onRoad - toPick;
  const cash = data.filter((o) => o.paymentStatus !== "Paid").reduce((n, o) => n + o.grandTotal, 0);

  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        <Chip icon={Package} label="To pick" value={toPick} />
        <Chip icon={Bike} label="On road" value={onRoad} />
        <Chip icon={Clock} label="Waiting" value={waiting} />
        <div className="flex flex-col items-center justify-center rounded-2xl bg-sun p-2 text-center shadow-sm">
          <span className="text-[10px] font-semibold uppercase tracking-wider">Collect</span>
          <span className="text-sm font-bold">{money(cash)}</span>
        </div>
      </div>
      {data.map((o) => <Task key={o.id} order={o} />)}
    </>
  );
}

function Chip({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-2 text-center shadow-sm ring-1 ring-choco/5">
      <Icon className="size-4 text-berry" />
      <span className="font-display text-xl font-bold leading-tight">{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-choco-light">{label}</span>
    </div>
  );
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
    <div className={`surface space-y-4 p-5 ${order.status === "OutForDelivery" ? "ring-2 ring-berry/40" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="font-display text-xl font-bold uppercase tracking-wide">{order.orderNumber}</span>
        <StatusBadge value={order.status} />
      </div>
      <div className="flex gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-pink-light text-berry"><MapPin className="size-5" /></span>
        <div>
          <div className="font-semibold">{order.customerName}</div>
          <div className="text-sm text-choco-light">{address}</div>
          {order.notes && <div className="mt-1 rounded-xl bg-sun/30 px-2 py-1 text-xs">Note: {order.notes}</div>}
        </div>
      </div>
      <div className="flex items-center justify-between rounded-2xl bg-cream px-4 py-3">
        <span className="text-sm font-medium">{order.items.reduce((n, i) => n + i.quantity, 0)} items</span>
        {order.paymentStatus === "Paid"
          ? <span className="rounded-full bg-mint-light px-3 py-1 text-sm font-bold text-emerald-800">Paid</span>
          : <span className="text-right"><span className="block text-[10px] font-semibold uppercase tracking-wider text-choco-light">Collect</span><span className="text-xl font-bold">{money(order.grandTotal)}</span></span>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <a href={`tel:${order.customerMobile}`} className="btn bg-[#25d366] py-3 text-white hover:brightness-95"><Phone className="size-4" /> Call</a>
        <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer" className="btn bg-choco py-3 text-white hover:bg-black"><Navigation className="size-4" /> Navigate</a>
      </div>

      {order.status === "Packed" && <button disabled={isLoading} onClick={() => act("OutForDelivery")} className="btn-primary w-full py-3.5 text-base"><Bike className="size-5" /> Picked up, start delivery</button>}
      {["Confirmed", "InProduction"].includes(order.status) && <p className="flex items-center justify-center gap-2 rounded-2xl bg-cream p-3 text-sm text-choco-light"><Clock className="size-4" /> Waiting for packing at the factory.</p>}
      {order.status === "OutForDelivery" && (
        <div className="space-y-2">
          <p className={`flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${sharing ? "bg-mint-light text-emerald-800" : "bg-sun/30 text-choco"}`}>
            <span className={`size-2 rounded-full ${sharing ? "animate-pulse bg-emerald-600" : "bg-choco/40"}`} />
            {sharing ? "Sharing live location with the customer" : "Allow location to share live tracking"}
          </p>
          <label htmlFor={`otp-${order.id}`} className="block pt-1 text-center text-xs font-semibold uppercase tracking-wider text-choco-light">Ask the customer for the 4 digit OTP</label>
          <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" id={`otp-${order.id}`} placeholder="• • • •" className="input rounded-2xl py-3 text-center font-display text-3xl tracking-[0.5em]" />
          <button disabled={isLoading || otp.length !== 4} onClick={() => act("Delivered", otp)} className="btn-primary w-full py-3.5 text-base">Mark delivered</button>
          <button disabled={isLoading} onClick={() => confirm("Customer not available? Return this order to the factory.") && act("Returned")} className="btn-ghost btn-sm w-full text-red-600"><Undo2 className="size-4" /> Could not deliver</button>
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
