import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { PageLoader } from "@/components/ui";
import { serverApi } from "@/lib/server-api";

export const metadata: Metadata = { title: "Book for your event" };

export default function WeddingBookPage() {
  return (
    <div className="container-page py-8">
      <h1 className="mb-2 text-3xl font-bold">Book ice cream for your event</h1>
      <p className="mb-8 text-choco-light">Four quick steps. No payment now, our team sends you a quote first.</p>
      <Suspense fallback={<PageLoader />}>
        <Wizard />
      </Suspense>
    </div>
  );
}

async function Wizard() {
  const packages = (await serverApi.packages()) ?? [];
  return <BookingWizard packages={packages} />;
}
