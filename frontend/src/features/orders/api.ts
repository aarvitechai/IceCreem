import { api } from "@/store/api";
import type {
  ApiResponse, CartLine, CheckoutSummary, Order, OrderRow, OrderStatus, Paged, PaymentMethod,
} from "@/lib/types";

export interface PlaceOrderInput {
  items: CartLine[];
  couponCode: string | null;
  customerName: string;
  mobile: string;
  email?: string;
  addressLine: string;
  city: string;
  pincode: string;
  notes?: string;
  paymentMethod: PaymentMethod;
}

export interface OrderFilter {
  page?: number;
  status?: OrderStatus | "";
  search?: string;
}

export interface Coupon {
  id: number;
  code: string;
  isPercent: boolean;
  value: number;
  minOrderAmount: number;
  maxDiscount: number;
  validFrom: string;
  validTo: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

const data = <T,>(r: ApiResponse<T>) => r.data;
const clean = (o: object) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== "" && v !== undefined && v !== null));

const ordersApi = api.injectEndpoints({
  endpoints: (b) => ({
    checkoutSummary: b.query<CheckoutSummary, { items: CartLine[]; couponCode: string | null }>({
      query: (body) => ({ url: "/checkout/summary", method: "POST", body }),
      transformResponse: data<CheckoutSummary>,
    }),
    placeOrder: b.mutation<Order, PlaceOrderInput>({
      query: (body) => ({ url: "/orders", method: "POST", body }),
      transformResponse: data<Order>,
      invalidatesTags: ["Orders", "Dashboard"],
    }),
    trackOrder: b.query<Order, { orderNumber: string; mobile: string }>({
      query: ({ orderNumber, mobile }) => `/orders/track/${encodeURIComponent(orderNumber)}?mobile=${encodeURIComponent(mobile)}`,
      transformResponse: data<Order>,
      providesTags: (_r, _e, a) => [{ type: "Order", id: a.orderNumber }],
    }),
    myOrders: b.query<Paged<OrderRow>, number>({
      query: (page) => `/me/orders?page=${page}`,
      transformResponse: data<Paged<OrderRow>>,
      providesTags: ["Orders"],
    }),
    order: b.query<Order, number>({
      query: (id) => `/orders/${id}`,
      transformResponse: data<Order>,
      providesTags: (_r, _e, id) => [{ type: "Order", id }],
    }),
    cancelOrder: b.mutation<Order, { id: number; reason: string }>({
      query: ({ id, reason }) => ({ url: `/orders/${id}/cancel`, method: "POST", body: { reason } }),
      transformResponse: data<Order>,
      invalidatesTags: (_r, _e, a) => ["Orders", { type: "Order", id: a.id }],
    }),

    // Admin
    adminOrders: b.query<Paged<OrderRow>, OrderFilter>({
      query: (f) => ({ url: "/admin/orders", params: clean({ pageSize: 20, ...f }) }),
      transformResponse: data<Paged<OrderRow>>,
      providesTags: ["Orders"],
    }),
    adminOrder: b.query<Order, number>({
      query: (id) => `/admin/orders/${id}`,
      transformResponse: data<Order>,
      providesTags: (_r, _e, id) => [{ type: "Order", id }],
    }),
    changeOrderStatus: b.mutation<Order, { id: number; status: OrderStatus; remark?: string }>({
      query: ({ id, ...body }) => ({ url: `/admin/orders/${id}/status`, method: "PATCH", body }),
      transformResponse: data<Order>,
      invalidatesTags: (_r, _e, a) => ["Orders", "Dashboard", "Stock", { type: "Order", id: a.id }],
    }),
    assignDelivery: b.mutation<Order, { id: number; partnerId: number }>({
      query: ({ id, partnerId }) => ({ url: `/admin/orders/${id}/assign-delivery`, method: "POST", body: { partnerId } }),
      transformResponse: data<Order>,
      invalidatesTags: (_r, _e, a) => ["Orders", { type: "Order", id: a.id }],
    }),
    deliveryPartners: b.query<{ id: number; fullName: string; mobile: string }[], void>({
      query: () => "/admin/delivery-partners",
      transformResponse: data<{ id: number; fullName: string; mobile: string }[]>,
    }),
    coupons: b.query<Coupon[], void>({
      query: () => "/admin/coupons",
      transformResponse: data<Coupon[]>,
      providesTags: ["Coupons"],
    }),
    saveCoupon: b.mutation<number, Omit<Coupon, "id" | "usedCount"> & { id?: number }>({
      query: ({ id, ...body }) => ({ url: id ? `/admin/coupons/${id}` : "/admin/coupons", method: id ? "PUT" : "POST", body }),
      transformResponse: data<number>,
      invalidatesTags: ["Coupons"],
    }),
    deleteCoupon: b.mutation<boolean, number>({
      query: (id) => ({ url: `/admin/coupons/${id}`, method: "DELETE" }),
      invalidatesTags: ["Coupons"],
    }),

    // Delivery partner
    myDeliveries: b.query<Order[], void>({
      query: () => "/delivery/me/tasks",
      transformResponse: data<Order[]>,
      providesTags: ["Deliveries"],
    }),
    updateDelivery: b.mutation<Order, { id: number; status: OrderStatus; otp?: string }>({
      query: ({ id, ...body }) => ({ url: `/delivery/${id}/status`, method: "PATCH", body }),
      transformResponse: data<Order>,
      invalidatesTags: ["Deliveries"],
    }),
    shareLocation: b.mutation<boolean, { id: number; latitude: number; longitude: number }>({
      query: ({ id, ...body }) => ({ url: `/delivery/${id}/location`, method: "POST", body }),
    }),
  }),
});

export const {
  useCheckoutSummaryQuery, usePlaceOrderMutation, useTrackOrderQuery, useMyOrdersQuery, useOrderQuery,
  useCancelOrderMutation, useAdminOrdersQuery, useAdminOrderQuery, useChangeOrderStatusMutation,
  useAssignDeliveryMutation, useDeliveryPartnersQuery, useCouponsQuery, useSaveCouponMutation,
  useDeleteCouponMutation, useMyDeliveriesQuery, useUpdateDeliveryMutation, useShareLocationMutation,
} = ordersApi;
