"use client";

import Link from "next/link";
import { EmptyState, PageLoader } from "@/components/ui";
import { useTrackOrderQuery } from "@/features/orders/api";
import { useOrderHub } from "@/hooks/use-order-hub";
import { OrderTracker } from "./order-tracker";

/** Loads an order by number and mobile, then refreshes it whenever SignalR reports a change. */
export function LiveTrack({ orderNumber, mobile }: { orderNumber: string; mobile: string }) {
  const { data, isLoading, isError, refetch } = useTrackOrderQuery({ orderNumber, mobile }, { pollingInterval: 60_000 });

  useOrderHub(data ? data.orderNumber : null, {
    onStatus: () => void refetch(),
    onLocation: () => void refetch(),
  });

  if (isLoading) return <PageLoader />;
  if (isError || !data) {
    return <EmptyState title="Order not found" text="Check the order number and the mobile number used for the order." action={<Link href="/track" className="btn-primary">Try again</Link>} />;
  }
  return <OrderTracker order={data} live />;
}
