"use client";

import { useState } from "react";
import { Check, Phone, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Stars } from "@/components/reviews/review-card";
import { EmptyState, PageLoader, Pager } from "@/components/ui";
import {
  useAdminReviewsQuery, useDeleteReviewMutation, useModerateReviewMutation, type AdminReview, type ReviewStatus,
} from "@/features/reviews/api";
import { dateTime } from "@/lib/format";
import { errorMessage } from "@/store/api";

const TABS: ReviewStatus[] = ["Pending", "Approved", "Rejected"];

export default function AdminReviewsPage() {
  const [status, setStatus] = useState<ReviewStatus>("Pending");
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useAdminReviewsQuery({ status, page });

  return (
    <div className="space-y-6">
      <div>
        <h1>Reviews</h1>
        <p className="text-sm text-choco-light">New reviews wait here. Only approved ones appear on the Testimonials page. Featured ones show first.</p>
      </div>

      <div className="flex gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-choco/5 w-fit" role="group" aria-label="Review status">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setStatus(t); setPage(1); }}
            aria-pressed={status === t}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${status === t ? "bg-berry text-white shadow" : "text-choco-light hover:text-berry"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading ? <PageLoader /> : !data?.items.length ? (
        <EmptyState title={status === "Pending" ? "No reviews waiting" : `No ${status.toLowerCase()} reviews`} text={status === "Pending" ? "New reviews from customers will show up here." : undefined} />
      ) : (
        <div className={`grid gap-4 lg:grid-cols-2 ${isFetching ? "opacity-60" : ""}`}>
          {data.items.map((r) => <ReviewRow key={r.id} review={r} />)}
        </div>
      )}
      {data && <Pager page={data.page} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}

function ReviewRow({ review: r }: { review: AdminReview }) {
  const [moderate, { isLoading }] = useModerateReviewMutation();
  const [remove, { isLoading: removing }] = useDeleteReviewMutation();

  const act = async (status: ReviewStatus, isFeatured: boolean, done: string) => {
    try {
      await moderate({ id: r.id, status, isFeatured }).unwrap();
      toast.success(done);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <article className="card flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{r.customerName}{r.city ? `, ${r.city}` : ""}</div>
          <div className="text-xs text-choco-light">{r.occasion} · {dateTime(r.createdAt)}</div>
        </div>
        <Stars rating={r.rating} />
      </div>
      <p className="rounded-2xl bg-cream p-3 text-sm leading-relaxed">{r.comment}</p>
      {r.mobile && (
        <a href={`tel:${r.mobile}`} className="flex w-fit items-center gap-1.5 text-xs font-semibold text-choco-light hover:text-berry">
          <Phone className="size-3.5" /> {r.mobile} (private)
        </a>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        {r.status !== "Approved" && (
          <button disabled={isLoading} onClick={() => act("Approved", false, "Approved. It is live on the site.")} className="btn-primary btn-sm"><Check className="size-4" /> Approve</button>
        )}
        {r.status === "Approved" && (
          <button disabled={isLoading} onClick={() => act("Approved", !r.isFeatured, r.isFeatured ? "Removed from top picks" : "Shown first on the page")} className={`btn btn-sm ${r.isFeatured ? "bg-sun text-choco" : "bg-cream text-choco-light hover:text-berry"}`}>
            <Star className={`size-4 ${r.isFeatured ? "fill-choco" : ""}`} /> {r.isFeatured ? "Featured" : "Feature"}
          </button>
        )}
        {r.status !== "Rejected" && (
          <button disabled={isLoading} onClick={() => act("Rejected", false, "Hidden from the site")} className="btn-outline btn-sm"><X className="size-4" /> {r.status === "Approved" ? "Hide" : "Reject"}</button>
        )}
        <button
          disabled={removing}
          onClick={async () => {
            if (!confirm("Delete this review for good?")) return;
            try { await remove(r.id).unwrap(); toast.success("Review deleted"); } catch (e) { toast.error(errorMessage(e)); }
          }}
          className="btn-ghost btn-sm ml-auto text-red-600"
          aria-label="Delete review"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </article>
  );
}
