"use client";

import Link from "next/link";
import { PenLine, Star } from "lucide-react";
import { useReviewsQuery } from "@/features/reviews/api";
import { ReviewCard } from "./review-card";

/** Top three approved reviews for the home page, or an invite to write the first one. */
export function HomeReviews() {
  const { data } = useReviewsQuery({ page: 1, pageSize: 3 });
  const items = data?.reviews.items ?? [];

  if (!data) return <div className="h-40" aria-hidden />;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-choco/5 sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-4">
          <span className="hidden size-14 shrink-0 items-center justify-center rounded-full bg-sun sm:flex"><Star className="size-7 fill-choco text-choco" /></span>
          <div>
            <h3 className="font-display text-2xl font-bold uppercase tracking-wide">Loved our ice cream?</h3>
            <p className="text-sm text-choco-light">Tell others what you enjoyed. It takes one minute.</p>
          </div>
        </div>
        <Link href="/testimonials#write" className="btn-primary shrink-0"><PenLine className="size-4" /> Write a review</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-3">
        {items.map((r) => <ReviewCard key={r.id} review={r} />)}
      </div>
      <p className="text-center text-sm text-choco-light">
        Rated <span className="font-bold text-choco">{data.summary.average.toFixed(1)} / 5</span> from {data.summary.count} {data.summary.count === 1 ? "review" : "reviews"}.{" "}
        <Link href="/testimonials" className="font-semibold text-berry hover:underline">Read all</Link>
      </p>
    </div>
  );
}
