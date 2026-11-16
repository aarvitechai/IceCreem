import { api } from "@/store/api";
import type { ApiResponse, AvailabilityDay, Booking, BookingStatus, EventType, Paged } from "@/lib/types";

export interface BookingInput {
  contactName: string;
  mobile: string;
  email?: string;
  eventType: EventType;
  eventDate: string;
  eventTimeSlot?: string;
  venueName: string;
  venueAddress: string;
  guestCount: number;
  packageId: number | null;
  specialRequest?: string;
}

const data = <T,>(r: ApiResponse<T>) => r.data;

const bookingsApi = api.injectEndpoints({
  endpoints: (b) => ({
    availability: b.query<AvailabilityDay[], { year: number; month: number }>({
      query: ({ year, month }) => `/bookings/availability?year=${year}&month=${month}`,
      transformResponse: data<AvailabilityDay[]>,
      providesTags: ["Bookings"],
    }),
    createBooking: b.mutation<Booking, BookingInput>({
      query: (body) => ({ url: "/bookings", method: "POST", body }),
      transformResponse: data<Booking>,
      invalidatesTags: ["Bookings"],
    }),
    myBookings: b.query<Paged<Booking>, void>({
      query: () => "/me/bookings?pageSize=50",
      transformResponse: data<Paged<Booking>>,
      providesTags: ["Bookings"],
    }),
    acceptQuote: b.mutation<Booking, number>({
      query: (id) => ({ url: `/bookings/${id}/accept-quote`, method: "POST" }),
      transformResponse: data<Booking>,
      invalidatesTags: ["Bookings"],
    }),

    // Admin
    adminBookings: b.query<Paged<Booking>, { status?: BookingStatus | ""; search?: string; page?: number }>({
      query: ({ status, search, page = 1 }) => ({
        url: "/admin/bookings",
        params: { page, pageSize: 20, ...(status ? { status } : {}), ...(search ? { search } : {}) },
      }),
      transformResponse: data<Paged<Booking>>,
      providesTags: ["Bookings"],
    }),
    quoteBooking: b.mutation<Booking, { id: number; amount: number; validTill: string; notes?: string }>({
      query: ({ id, ...body }) => ({ url: `/admin/bookings/${id}/quote`, method: "POST", body }),
      transformResponse: data<Booking>,
      invalidatesTags: ["Bookings", "Dashboard"],
    }),
    recordBookingPayment: b.mutation<Booking, { id: number; amount: number }>({
      query: ({ id, amount }) => ({ url: `/admin/bookings/${id}/payments`, method: "POST", body: { amount } }),
      transformResponse: data<Booking>,
      invalidatesTags: ["Bookings", "Dashboard"],
    }),
    changeBookingStatus: b.mutation<Booking, { id: number; status: BookingStatus }>({
      query: ({ id, status }) => ({ url: `/admin/bookings/${id}/status`, method: "PATCH", body: { status } }),
      transformResponse: data<Booking>,
      invalidatesTags: ["Bookings", "Dashboard"],
    }),
  }),
});

export const {
  useAvailabilityQuery, useCreateBookingMutation, useMyBookingsQuery, useAcceptQuoteMutation,
  useAdminBookingsQuery, useQuoteBookingMutation, useRecordBookingPaymentMutation, useChangeBookingStatusMutation,
} = bookingsApi;
