"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PageBanner } from "@/components/layout/page-banner";
import { LiveTrack } from "@/components/order/live-track";
import { PageLoader } from "@/components/ui";

export default function TrackOrderPage() {
  return (
    <>
      <PageBanner title="Live tracking" text="This page updates by itself. No need to refresh." />
      <div className="container-page py-8">
        <Suspense fallback={<PageLoader />}>
          <Content />
        </Suspense>
      </div>
    </>
  );
}

function Content() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const mobile = useSearchParams().get("mobile") ?? "";
  return <LiveTrack orderNumber={orderNumber} mobile={mobile} />;
}
