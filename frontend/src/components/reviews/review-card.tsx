import { Quote, Star } from "lucide-react";
import type { PublicReview } from "@/features/reviews/api";
import { date } from "@/lib/format";

/** Five stars, filled up to the rating. Screen readers hear "4 out of 5 stars". */
export function Stars({ rating, size = "size-4" }: { rating: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} aria-hidden className={`${size} ${n <= rating ? "fill-sun text-sun" : "fill-cream-dark text-cream-dark"}`} />
      ))}
    </span>
  );
}

export function ReviewCard({ review, big = false }: { review: PublicReview; big?: boolean }) {
  return (
    <figure className={`relative flex h-full flex-col gap-4 rounded-[2rem] p-6 shadow-sm ring-1 transition hover:-translate-y-1 hover:shadow-lg ${big ? "bg-gradient-to-br from-berry to-pink text-white ring-transparent sm:p-10" : "bg-white ring-choco/5"}`}>
      <Quote aria-hidden className={`absolute right-6 top-6 size-10 ${big ? "text-white/25" : "text-berry/15"}`} />
      <div className="flex items-center gap-2">
        <Stars rating={review.rating} size={big ? "size-5" : "size-4"} />
        {review.isFeatured && !big && <span className="rounded-full bg-sun px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">Top pick</span>}
      </div>
      <blockquote className={`flex-1 ${big ? "font-display text-2xl uppercase leading-snug tracking-wide sm:text-3xl" : "text-[15px] leading-relaxed text-choco/90"}`}>
        &ldquo;{review.comment}&rdquo;
      </blockquote>
      <figcaption className="flex items-center gap-3">
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-full font-display text-lg font-bold ${big ? "bg-white text-berry" : "bg-sun text-choco"}`}>
          {review.customerName.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block font-semibold">{review.customerName}{review.city ? `, ${review.city}` : ""}</span>
          <span className={`block text-xs ${big ? "text-white/80" : "text-choco-light"}`}>{review.occasion} · {date(review.approvedAt)}</span>
        </span>
      </figcaption>
    </figure>
  );
}
