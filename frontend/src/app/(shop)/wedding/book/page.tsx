import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { PageBanner } from "@/components/layout/page-banner";
import { PageLoader } from "@/components/ui";
import { serverApi } from "@/lib/server-api";

export const metadata: Metadata = { title: "Book for your event" };

export default function WeddingBookPage() {
  return (
    <>
      <PageBanner title="Book for your event" text="Four quick steps. No payment now, our team sends you a quote first." />
      <div className="container-page py-10">
        <Suspense fallback={<PageLoader />}>
          <Wizard />
        </Suspense>
      </div>
    </>
  );
}

async function Wizard() {
  const packages = (await serverApi.packages()) ?? [];
  return <BookingWizard packages={packages} />;
}
