"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PartyPopper } from "lucide-react";
import { LiveTrack } from "@/components/order/live-track";
import { PageLoader } from "@/components/ui";

export default function OrderSuccessPage() {
  return (
    <div className="container-page py-8">
      <Suspense fallback={<PageLoader />}>
        <Content />
      </Suspense>
    </div>
  );
}

function Content() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const mobile = useSearchParams().get("mobile") ?? "";

  return (
    <>
      <div className="card mb-6 flex flex-col items-center gap-2 bg-mint-light p-8 text-center">
        <PartyPopper className="size-10 text-mint" />
        <h1 className="text-3xl font-bold">Thank you! Order placed.</h1>
        <p className="text-choco-light">We will confirm it shortly. Keep this page open to watch it live.</p>
        <Link href={`/track/${orderNumber}?mobile=${mobile}`} className="text-sm font-semibold text-berry">Save tracking link</Link>
      </div>
      <LiveTrack orderNumber={orderNumber} mobile={mobile} />
    </>
  );
}
