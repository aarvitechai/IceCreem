import { api } from "@/store/api";
import type { ApiResponse, Paged } from "@/lib/types";

const data = <T,>(r: ApiResponse<T>) => r.data;

/** Topics a review can be about. Must match ReviewRequestValidator.Occasions in the API. */
export const reviewOccasions = ["Home delivery", "Wedding", "Birthday", "Anniversary", "Corporate", "Festival", "Other event", "Hawker cart"] as const;
export type ReviewOccasion = (typeof reviewOccasions)[number];
export type ReviewStatus = "Pending" | "Approved" | "Rejected";

export interface PublicReview {
  id: number;
  customerName: string;
  city: string | null;
  occasion: string;
  rating: number;
  comment: string;
  isFeatured: boolean;
  approvedAt: string;
}

export interface ReviewSummary {
  count: number;
  average: number;
  /** Counts for 5, 4, 3, 2 and 1 stars, in that order. */
  stars: number[];
}

export interface PublicReviewPage {
  summary: ReviewSummary;
  reviews: Paged<PublicReview>;
}

export interface AdminReview extends Omit<PublicReview, "approvedAt"> {
  mobile: string | null;
  status: ReviewStatus;
  createdAt: string;
  approvedAt: string | null;
}

export interface ReviewInput {
  customerName: string;
  city?: string;
  mobile?: string;
  occasion: ReviewOccasion;
  rating: number;
  comment: string;
  /** Honeypot: hidden from people, bots fill it in. */
  website?: string;
}

const reviewsApi = api.injectEndpoints({
  endpoints: (b) => ({
    reviews: b.query<PublicReviewPage, { page: number; pageSize?: number }>({
      query: ({ page, pageSize = 9 }) => `/reviews?page=${page}&pageSize=${pageSize}`,
      transformResponse: data<PublicReviewPage>,
      providesTags: ["Reviews"],
    }),
    submitReview: b.mutation<boolean, ReviewInput>({
      query: (body) => ({ url: "/reviews", method: "POST", body }),
      transformResponse: data<boolean>,
    }),
    adminReviews: b.query<Paged<AdminReview>, { status?: ReviewStatus; page: number }>({
      query: ({ status, page }) => `/admin/reviews?page=${page}&pageSize=20${status ? `&status=${status}` : ""}`,
      transformResponse: data<Paged<AdminReview>>,
      providesTags: ["Reviews"],
    }),
    moderateReview: b.mutation<AdminReview, { id: number; status: ReviewStatus; isFeatured: boolean }>({
      query: ({ id, ...body }) => ({ url: `/admin/reviews/${id}`, method: "PATCH", body }),
      transformResponse: data<AdminReview>,
      invalidatesTags: ["Reviews"],
    }),
    deleteReview: b.mutation<boolean, number>({
      query: (id) => ({ url: `/admin/reviews/${id}`, method: "DELETE" }),
      transformResponse: data<boolean>,
      invalidatesTags: ["Reviews"],
    }),
  }),
});

export const {
  useReviewsQuery, useSubmitReviewMutation, useAdminReviewsQuery, useModerateReviewMutation, useDeleteReviewMutation,
} = reviewsApi;
