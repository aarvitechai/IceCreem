import type { Metadata } from "next";
import { Suspense } from "react";
import { PageBanner } from "@/components/layout/page-banner";
import { TestimonialsView } from "@/components/reviews/testimonials-view";
import { PageLoader } from "@/components/ui";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Customer reviews",
  description: `What customers say about ${brand.name}: home delivery, weddings, birthdays and more. Share your own review.`,
  alternates: { canonical: "/testimonials" },
};

export default function TestimonialsPage() {
  return (
    <>
      <PageBanner title="Sweet words" text="Real reviews from our customers, checked by our team before they appear." />
      <div className="container-page py-10">
        <Suspense fallback={<PageLoader />}>
          <TestimonialsView />
        </Suspense>
      </div>
    </>
  );
}
