import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import type { ApiResponse } from "@/lib/types";
import { signedIn, signedOut } from "./authSlice";
import { refreshSession } from "./session";

interface RootLike {
  auth: { accessToken: string | null };
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: "/api/v1",
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootLike).auth.accessToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

/** On 401, refresh the access token once using the httpOnly cookie, then retry. */
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extra) => {
  let result = await rawBaseQuery(args, api, extra);
  const url = typeof args === "string" ? args : args.url;

  if (result.error?.status === 401 && !url.startsWith("/auth/")) {
    // Shared with the page load refresh, so parallel 401s never send two refresh calls.
    const session = await refreshSession();
    if (session) {
      api.dispatch(signedIn(session));
      result = await rawBaseQuery(args, api, extra);
    } else {
      api.dispatch(signedOut());
    }
  }
  return result;
};

/** Every endpoint lives in features/<name>/api.ts and is injected here. */
export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Me", "Orders", "Order", "Bookings", "Booking", "Products", "Categories", "Banners", "Packages",
    "Coupons", "Stock", "RawMaterials", "Batches", "Hawkers", "Users", "Dashboard", "Deliveries", "Reviews",
  ],
  endpoints: () => ({}),
});

/** Reads the message from an API error so screens can show it in a toast. */
export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  const e = error as { status?: number | string; data?: Partial<ApiResponse<unknown>> };
  const fieldErrors = e?.data?.errors ? Object.values(e.data.errors).flat() : [];
  if (fieldErrors.length > 0) return fieldErrors[0];
  if (e?.data?.message) return e.data.message;
  if (e?.status === 429) return "Too many requests. Please wait a minute.";
  if (e?.status === "FETCH_ERROR") return "Cannot reach the server. Check your connection.";
  return fallback;
}
