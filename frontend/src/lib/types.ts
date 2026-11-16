// Types that mirror the .NET API DTOs. Keep in sync with backend/src/IceCream.Application/Features.

export type UserRole = "SuperAdmin" | "Admin" | "Staff" | "Hawker" | "Delivery" | "Customer";

export type OrderStatus =
  | "Placed"
  | "Confirmed"
  | "InProduction"
  | "Packed"
  | "OutForDelivery"
  | "Delivered"
  | "Cancelled"
  | "Returned";

export type PaymentStatus = "Pending" | "Partial" | "Paid" | "Refunded";
export type PaymentMethod = "CashOnDelivery" | "Online";
export type EventType = "Wedding" | "Reception" | "Party" | "Birthday" | "Anniversary" | "Engagement" | "BabyShower" | "Corporate" | "Festival" | "KittyParty";
export type BookingStatus =
  | "Enquiry"
  | "Quoted"
  | "Confirmed"
  | "AdvancePaid"
  | "Scheduled"
  | "Delivered"
  | "Closed"
  | "Cancelled";
export type BatchStatus = "Planned" | "Running" | "Completed";
export type StockTxnType = "In" | "Out" | "Wastage" | "Adjust";

export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
  errors?: Record<string, string[]> | null;
}

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// ---------- Auth ----------
export interface User {
  id: number;
  fullName: string;
  email: string;
  mobile: string;
  role: UserRole;
}

export interface AuthResult {
  accessToken: string;
  expiresAt: string;
  user: User;
}

// ---------- Catalog ----------
export interface Category {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
}

export interface ProductCard {
  id: number;
  name: string;
  slug: string;
  shortDescription: string;
  categoryName: string;
  categorySlug: string;
  imageUrl: string | null;
  isVeg: boolean;
  isFeatured: boolean;
  price: number;
  mrp: number;
  inStock: boolean;
  /** Cheapest pack in stock, used by the card's Add to cart button. */
  quickVariantId: number | null;
  quickVariantName: string | null;
  quickVariantPrice: number;
  quickVariantAvailable: number;
}

export interface Variant {
  id: number;
  sku: string;
  name: string;
  mrp: number;
  sellingPrice: number;
  availableQty: number;
}

export interface ProductDetail {
  id: number;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  ingredients: string | null;
  categoryName: string;
  categorySlug: string;
  gstPercent: number;
  isVeg: boolean;
  images: { id: number; imageUrl: string; altText: string | null; isPrimary: boolean }[];
  variants: Variant[];
}

export interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  position: "Hero" | "Offer";
}

export interface WeddingPackage {
  id: number;
  name: string;
  description: string;
  minGuests: number;
  pricePerHead: number;
  imageUrl: string | null;
}

// ---------- Orders ----------
export interface CartLine {
  variantId: number;
  quantity: number;
}

export interface CheckoutSummary {
  lines: {
    variantId: number;
    productName: string;
    variantName: string;
    sku: string;
    imageUrl: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    availableQty: number;
  }[];
  subTotal: number;
  discount: number;
  gst: number;
  deliveryCharge: number;
  grandTotal: number;
  couponCode: string | null;
  couponMessage: string | null;
}

export interface Order {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  customerName: string;
  customerMobile: string;
  customerEmail: string | null;
  addressLine: string;
  city: string;
  pincode: string;
  subTotal: number;
  discount: number;
  gst: number;
  deliveryCharge: number;
  grandTotal: number;
  paidAmount: number;
  couponCode: string | null;
  notes: string | null;
  cancelReason: string | null;
  createdAt: string;
  deliveredAt: string | null;
  deliveryPartnerName: string | null;
  deliveryPartnerMobile: string | null;
  deliveryOtp: string | null;
  lastLatitude: number | null;
  lastLongitude: number | null;
  lastLocationAt: string | null;
  items: { variantId: number; productName: string; variantName: string; sku: string; quantity: number; unitPrice: number; lineTotal: number }[];
  history: { fromStatus: OrderStatus; toStatus: OrderStatus; changedAt: string; remark: string | null }[];
  nextStatuses: OrderStatus[];
}

export interface OrderRow {
  id: number;
  orderNumber: string;
  customerName: string;
  customerMobile: string;
  city: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  grandTotal: number;
  itemCount: number;
  createdAt: string;
  deliveryPartnerName: string | null;
}

// ---------- Bookings ----------
export interface AvailabilityDay {
  date: string;
  booked: number;
  max: number;
  available: boolean;
}

export interface Booking {
  id: number;
  bookingNumber: string;
  contactName: string;
  mobile: string;
  email: string | null;
  eventType: EventType;
  eventDate: string;
  eventTimeSlot: string | null;
  venueName: string;
  venueAddress: string;
  guestCount: number;
  packageId: number | null;
  packageName: string | null;
  estimatedAmount: number;
  status: BookingStatus;
  quotedAmount: number;
  quoteValidTill: string | null;
  advancePaid: number;
  balanceAmount: number;
  requiredAdvance: number;
  specialRequest: string | null;
  adminNotes: string | null;
  createdAt: string;
}
