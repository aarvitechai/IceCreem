"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LiveTrack } from "@/components/order/live-track";
import { PageLoader } from "@/components/ui";

export default function TrackOrderPage() {
  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-3xl font-bold">Order tracking</h1>
      <Suspense fallback={<PageLoader />}>
        <Content />
      </Suspense>
    </div>
  );
}

function Content() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const mobile = useSearchParams().get("mobile") ?? "";
  return <LiveTrack orderNumber={orderNumber} mobile={mobile} />;
}
