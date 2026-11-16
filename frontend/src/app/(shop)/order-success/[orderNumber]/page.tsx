"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PartyPopper } from "lucide-react";
import { PageBanner } from "@/components/layout/page-banner";
import { LiveTrack } from "@/components/order/live-track";
import { PageLoader } from "@/components/ui";

export default function OrderSuccessPage() {
  return (
    <>
      <PageBanner title="Order placed" step={3} />
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

  return (
    <>
      <div className="mb-6 flex flex-col items-center gap-2 rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-choco/5">
        <span className="flex size-16 items-center justify-center rounded-full bg-sun"><PartyPopper className="size-8 text-berry" /></span>
        <h2 className="font-display text-3xl font-bold uppercase tracking-wide">Thank you!</h2>
        <p className="text-choco-light">We will confirm it shortly. Keep this page open to watch it live.</p>
        <Link href={`/track/${orderNumber}?mobile=${mobile}`} className="text-sm font-semibold uppercase tracking-wider text-berry hover:underline">Save tracking link</Link>
      </div>
      <LiveTrack orderNumber={orderNumber} mobile={mobile} />
    </>
  );
}
