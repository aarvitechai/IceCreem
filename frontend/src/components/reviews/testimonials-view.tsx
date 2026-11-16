"use client";

import { useState } from "react";
import { MessageSquareHeart, PenLine } from "lucide-react";
import { PageLoader } from "@/components/ui";
import { useReviewsQuery, type PublicReview, type ReviewSummary } from "@/features/reviews/api";
import { ReviewCard, Stars } from "./review-card";
import { ReviewForm } from "./review-form";

/** Rating summary, approved reviews with "show more", and the form to write one. */
export function TestimonialsView() {
  const [pages, setPages] = useState(1);
  const { data, isLoading, isFetching } = useReviewsQuery({ page: 1, pageSize: 9 * pages });

  if (isLoading) return <PageLoader />;
  const summary = data?.summary ?? { count: 0, average: 0, stars: [0, 0, 0, 0, 0] };
  const items = data?.reviews.items ?? [];
  const [top, ...rest] = items;
  const more = (data?.reviews.totalCount ?? 0) > items.length;

  return (
    <div className="space-y-12">
      {summary.count > 0 ? (
        <>
          <div className="grid items-stretch gap-5 lg:grid-cols-[340px_1fr]">
            <Summary summary={summary} />
            {top && <ReviewCard review={top} big />}
          </div>
          {rest.length > 0 && <Grid reviews={rest} />}
          {more && (
            <div className="text-center">
              <button type="button" disabled={isFetching} onClick={() => setPages((p) => p + 1)} className="btn-outline">
                {isFetching ? "Loading..." : "Show more reviews"}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-[2rem] bg-white p-10 text-center shadow-sm ring-1 ring-choco/5">
          <span className="flex size-20 items-center justify-center rounded-full bg-pink-light text-berry"><MessageSquareHeart className="size-10" /></span>
          <h2 className="font-display text-3xl font-bold uppercase tracking-wide">Be the first to share</h2>
          <p className="max-w-md text-choco-light">Tried our ice cream or had us at your event? Tell others what you loved. Your review shows here after a quick check.</p>
          <a href="#write" className="btn-primary mt-2"><PenLine className="size-4" /> Write a review</a>
        </div>
      )}

      <section id="write" className="grid scroll-mt-24 items-start gap-8 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-choco/5 sm:p-10 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-3">
          <h2 className="section-title">Share your experience</h2>
          <span className="wave block" aria-hidden />
          <p className="text-choco-light">Your words help other families choose, and help us get better. Honest reviews only, good or bad.</p>
          <ul className="space-y-2 pt-2 text-sm text-choco-light">
            <li>✔ Takes one minute</li>
            <li>✔ No login needed</li>
            <li>✔ Mobile number stays private</li>
          </ul>
        </div>
        <ReviewForm />
      </section>
    </div>
  );
}

function Summary({ summary }: { summary: ReviewSummary }) {
  const max = Math.max(1, ...summary.stars);
  return (
    <div className="flex flex-col justify-center gap-4 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-choco/5 sm:p-8">
      <div className="flex items-end gap-3">
        <span className="font-display text-6xl font-bold leading-none">{summary.average.toFixed(1)}</span>
        <span className="pb-1 text-choco-light">out of 5</span>
      </div>
      <Stars rating={Math.round(summary.average)} size="size-6" />
      <p className="text-sm text-choco-light">Based on {summary.count} {summary.count === 1 ? "review" : "reviews"}</p>
      <ul className="space-y-1.5" aria-label="Reviews by star rating">
        {summary.stars.map((count, i) => {
          const star = 5 - i;
          return (
            <li key={star} className="flex items-center gap-2 text-xs">
              <span className="w-8 shrink-0 font-semibold">{star} ★</span>
              <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-cream-dark">
                <span className="block h-full rounded-full bg-berry" style={{ width: `${(count / max) * 100}%` }} />
              </span>
              <span className="w-6 shrink-0 text-right text-choco-light">{count}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Grid({ reviews }: { reviews: PublicReview[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
    </div>
  );
}
