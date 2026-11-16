import { api } from "@/store/api";
import type { ApiResponse, BatchStatus, Category, Paged, StockTxnType, UserRole } from "@/lib/types";

const data = <T,>(r: ApiResponse<T>) => r.data;

// ---------- Types used only by admin screens ----------
export interface AdminProductRow {
  id: number;
  name: string;
  slug: string;
  categoryName: string;
  imageUrl: string | null;
  price: number;
  totalStock: number;
  variantCount: number;
  isActive: boolean;
  isFeatured: boolean;
}

export interface AdminVariant {
  id?: number;
  sku: string;
  name: string;
  mrp: number;
  sellingPrice: number;
  wholesalePrice: number;
  stockQty?: number;
  reservedQty?: number;
  isActive: boolean;
}

export interface AdminProduct {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  ingredients: string | null;
  hsnCode: string;
  gstPercent: number;
  isVeg: boolean;
  isFeatured: boolean;
  isActive: boolean;
  imageUrls: string[];
  variants: AdminVariant[];
}

export type SaveProductInput = Omit<AdminProduct, "id" | "slug" | "categoryName">;

export interface DashboardSummary {
  todayOrders: number;
  todayRevenue: number;
  monthRevenue: number;
  pendingOrders: number;
  outForDelivery: number;
  upcomingBookings: number;
  openEnquiries: number;
  lowStockItems: number;
  hawkerOutstanding: number;
  customers: number;
}
export interface TrendPoint { date: string; orders: number; revenue: number }
export interface NamedValue { name: string; value: number; count: number }

export interface RawMaterial { id: number; name: string; unit: string; minStockLevel: number; currentStock: number; isLow: boolean }
export interface RawTxn { id: number; type: StockTxnType; quantity: number; balanceAfter: number; remark: string | null; refNo: string | null; at: string }
export interface FinishedStock { variantId: number; productName: string; variantName: string; sku: string; stockQty: number; reservedQty: number; availableQty: number; sellingPrice: number }
export interface RecipeLine { rawMaterialId: number; rawMaterialName?: string; unit?: string; qtyPerUnit: number }
export interface Recipe { variantId: number; variantName: string; items: RecipeLine[] }
export interface Batch {
  id: number; batchNo: string; variantId: number; productName: string; variantName: string; plannedQty: number;
  producedQty: number; wastageQty: number; status: BatchStatus; createdAt: string; startedAt: string | null; completedAt: string | null;
}

export interface Hawker {
  id: number; userId: number | null; name: string; mobile: string; area: string; commissionPercent: number;
  creditLimit: number; outstandingAmount: number; isActive: boolean; hasOpenIssue: boolean;
}
export interface IssueItem { variantId: number; sku: string; name: string; issuedQty: number; soldQty: number; returnedQty: number; damagedQty: number; rate: number }
export interface StockIssue {
  id: number; hawkerId: number; hawkerName: string; issueDate: string; status: "Issued" | "Settled";
  issuedValue: number; totalSaleValue: number; commission: number; cashCollected: number; items: IssueItem[];
}
export interface HawkerDetail { hawker: Hawker; recentIssues: StockIssue[] }

export interface UserRow { id: number; fullName: string; email: string; mobile: string; role: UserRole; isActive: boolean; lastLoginAt: string | null; createdAt: string }
export interface AuditRow { id: number; userId: number | null; userName: string | null; action: string; entityName: string; entityId: string; changes: string | null; at: string }

export interface AdminBanner { id: number; title: string; subtitle: string | null; imageUrl: string; linkUrl: string | null; position: "Hero" | "Offer"; sortOrder: number; isActive: boolean }

const adminApi = api.injectEndpoints({
  endpoints: (b) => ({
    // Dashboard
    dashboardSummary: b.query<DashboardSummary, void>({ query: () => "/dashboard/admin/summary", transformResponse: data<DashboardSummary>, providesTags: ["Dashboard"] }),
    salesTrend: b.query<TrendPoint[], number>({ query: (days) => `/dashboard/admin/sales-trend?days=${days}`, transformResponse: data<TrendPoint[]>, providesTags: ["Dashboard"] }),
    topProducts: b.query<NamedValue[], void>({ query: () => "/dashboard/admin/top-products?limit=6", transformResponse: data<NamedValue[]>, providesTags: ["Dashboard"] }),
    categoryShare: b.query<NamedValue[], void>({ query: () => "/dashboard/admin/category-share", transformResponse: data<NamedValue[]>, providesTags: ["Dashboard"] }),
    orderStatusShare: b.query<NamedValue[], void>({ query: () => "/dashboard/admin/order-status", transformResponse: data<NamedValue[]>, providesTags: ["Dashboard"] }),

    // Catalog
    adminProducts: b.query<Paged<AdminProductRow>, { page: number; search?: string }>({
      query: ({ page, search }) => ({ url: "/admin/products", params: { page, pageSize: 20, ...(search ? { search } : {}) } }),
      transformResponse: data<Paged<AdminProductRow>>,
      providesTags: ["Products"],
    }),
    adminProduct: b.query<AdminProduct, number>({ query: (id) => `/admin/products/${id}`, transformResponse: data<AdminProduct>, providesTags: ["Products"] }),
    saveProduct: b.mutation<AdminProduct, { id?: number; body: SaveProductInput }>({
      query: ({ id, body }) => ({ url: id ? `/admin/products/${id}` : "/admin/products", method: id ? "PUT" : "POST", body }),
      transformResponse: data<AdminProduct>,
      invalidatesTags: ["Products", "Stock"],
    }),
    setProductStatus: b.mutation<boolean, { id: number; isActive: boolean }>({
      query: ({ id, isActive }) => ({ url: `/admin/products/${id}/status`, method: "PATCH", body: { isActive } }),
      invalidatesTags: ["Products"],
    }),
    deleteProduct: b.mutation<boolean, number>({ query: (id) => ({ url: `/admin/products/${id}`, method: "DELETE" }), invalidatesTags: ["Products", "Stock"] }),
    uploadImage: b.mutation<string, File>({
      query: (file) => {
        const form = new FormData();
        form.append("file", file);
        return { url: "/admin/uploads/images", method: "POST", body: form };
      },
      transformResponse: data<string>,
    }),
    adminCategories: b.query<Category[], void>({ query: () => "/admin/categories", transformResponse: data<Category[]>, providesTags: ["Categories"] }),
    saveCategory: b.mutation<Category, { id?: number; name: string; imageUrl?: string | null; sortOrder: number; isActive: boolean }>({
      query: ({ id, ...body }) => ({ url: id ? `/admin/categories/${id}` : "/admin/categories", method: id ? "PUT" : "POST", body }),
      transformResponse: data<Category>,
      invalidatesTags: ["Categories"],
    }),
    deleteCategory: b.mutation<boolean, number>({ query: (id) => ({ url: `/admin/categories/${id}`, method: "DELETE" }), invalidatesTags: ["Categories"] }),
    adminBanners: b.query<AdminBanner[], void>({ query: () => "/admin/banners", transformResponse: data<AdminBanner[]>, providesTags: ["Banners"] }),
    saveBanner: b.mutation<number, Omit<AdminBanner, "id"> & { id?: number }>({
      query: ({ id, ...body }) => ({ url: id ? `/admin/banners/${id}` : "/admin/banners", method: id ? "PUT" : "POST", body }),
      invalidatesTags: ["Banners"],
    }),
    deleteBanner: b.mutation<boolean, number>({ query: (id) => ({ url: `/admin/banners/${id}`, method: "DELETE" }), invalidatesTags: ["Banners"] }),

    // Inventory and production
    rawMaterials: b.query<RawMaterial[], void>({ query: () => "/admin/raw-materials", transformResponse: data<RawMaterial[]>, providesTags: ["RawMaterials"] }),
    saveRawMaterial: b.mutation<RawMaterial, { id?: number; name: string; unit: string; minStockLevel: number }>({
      query: ({ id, ...body }) => ({ url: id ? `/admin/raw-materials/${id}` : "/admin/raw-materials", method: id ? "PUT" : "POST", body }),
      invalidatesTags: ["RawMaterials", "Dashboard"],
    }),
    moveRawStock: b.mutation<RawMaterial, { id: number; type: StockTxnType; quantity: number; remark?: string }>({
      query: ({ id, ...body }) => ({ url: `/admin/raw-materials/${id}/stock`, method: "POST", body }),
      invalidatesTags: ["RawMaterials", "Dashboard"],
    }),
    rawLedger: b.query<RawTxn[], number>({ query: (id) => `/admin/raw-materials/${id}/ledger`, transformResponse: data<RawTxn[]>, providesTags: ["RawMaterials"] }),
    finishedStock: b.query<FinishedStock[], void>({ query: () => "/admin/stock/finished", transformResponse: data<FinishedStock[]>, providesTags: ["Stock"] }),
    adjustFinished: b.mutation<boolean, { variantId: number; quantity: number; reason: string }>({
      query: ({ variantId, ...body }) => ({ url: `/admin/stock/finished/${variantId}/adjust`, method: "POST", body }),
      invalidatesTags: ["Stock", "Dashboard"],
    }),
    recipe: b.query<Recipe, number>({ query: (variantId) => `/admin/recipes/${variantId}`, transformResponse: data<Recipe>, providesTags: ["Batches"] }),
    saveRecipe: b.mutation<Recipe, { variantId: number; items: RecipeLine[] }>({
      query: ({ variantId, items }) => ({ url: `/admin/recipes/${variantId}`, method: "PUT", body: items }),
      invalidatesTags: ["Batches"],
    }),
    batches: b.query<Paged<Batch>, void>({ query: () => "/admin/production/batches?pageSize=50", transformResponse: data<Paged<Batch>>, providesTags: ["Batches"] }),
    createBatch: b.mutation<number, { variantId: number; plannedQty: number }>({
      query: (body) => ({ url: "/admin/production/batches", method: "POST", body }),
      invalidatesTags: ["Batches"],
    }),
    startBatch: b.mutation<boolean, number>({
      query: (id) => ({ url: `/admin/production/batches/${id}/start`, method: "POST" }),
      invalidatesTags: ["Batches", "RawMaterials", "Dashboard"],
    }),
    completeBatch: b.mutation<boolean, { id: number; producedQty: number; wastageQty: number }>({
      query: ({ id, ...body }) => ({ url: `/admin/production/batches/${id}/complete`, method: "POST", body }),
      invalidatesTags: ["Batches", "Stock", "Dashboard"],
    }),

    // Hawkers
    hawkers: b.query<Hawker[], void>({ query: () => "/admin/hawkers", transformResponse: data<Hawker[]>, providesTags: ["Hawkers"] }),
    hawker: b.query<HawkerDetail, number>({ query: (id) => `/admin/hawkers/${id}`, transformResponse: data<HawkerDetail>, providesTags: ["Hawkers"] }),
    saveHawker: b.mutation<number, { id?: number; name: string; mobile: string; area: string; commissionPercent: number; creditLimit: number; isActive: boolean }>({
      query: ({ id, ...body }) => ({ url: id ? `/admin/hawkers/${id}` : "/admin/hawkers", method: id ? "PUT" : "POST", body }),
      invalidatesTags: ["Hawkers"],
    }),
    issueStock: b.mutation<StockIssue, { hawkerId: number; items: { variantId: number; quantity: number }[] }>({
      query: ({ hawkerId, items }) => ({ url: `/admin/hawkers/${hawkerId}/issue-stock`, method: "POST", body: { items } }),
      invalidatesTags: ["Hawkers", "Stock"],
    }),
    settleIssue: b.mutation<StockIssue, { issueId: number; items: { variantId: number; sold: number; returned: number; damaged: number }[]; cashCollected: number }>({
      query: ({ issueId, ...body }) => ({ url: `/admin/hawkers/issues/${issueId}/settle`, method: "POST", body }),
      invalidatesTags: ["Hawkers", "Stock", "Dashboard"],
    }),
    hawkerPayment: b.mutation<Hawker, { hawkerId: number; amount: number }>({
      query: ({ hawkerId, amount }) => ({ url: `/admin/hawkers/${hawkerId}/payments`, method: "POST", body: { amount } }),
      invalidatesTags: ["Hawkers", "Dashboard"],
    }),
    hawkerMe: b.query<HawkerDetail, void>({ query: () => "/hawker/me", transformResponse: data<HawkerDetail> }),

    // Super admin
    users: b.query<Paged<UserRow>, { page: number; role?: UserRole | ""; search?: string }>({
      query: ({ page, role, search }) => ({ url: "/superadmin/users", params: { page, pageSize: 20, ...(role ? { role } : {}), ...(search ? { search } : {}) } }),
      transformResponse: data<Paged<UserRow>>,
      providesTags: ["Users"],
    }),
    createUser: b.mutation<number, { fullName: string; email: string; mobile: string; role: UserRole; password: string }>({
      query: (body) => ({ url: "/superadmin/users", method: "POST", body }),
      invalidatesTags: ["Users"],
    }),
    updateUser: b.mutation<boolean, { id: number; fullName: string; role: UserRole; isActive: boolean }>({
      query: ({ id, ...body }) => ({ url: `/superadmin/users/${id}`, method: "PUT", body }),
      invalidatesTags: ["Users"],
    }),
    auditLogs: b.query<Paged<AuditRow>, { page: number; entity?: string }>({
      query: ({ page, entity }) => ({ url: "/superadmin/audit-logs", params: { page, pageSize: 25, ...(entity ? { entity } : {}) } }),
      transformResponse: data<Paged<AuditRow>>,
    }),
  }),
});

export const {
  useDashboardSummaryQuery, useSalesTrendQuery, useTopProductsQuery, useCategoryShareQuery, useOrderStatusShareQuery,
  useAdminProductsQuery, useAdminProductQuery, useSaveProductMutation, useSetProductStatusMutation, useDeleteProductMutation,
  useUploadImageMutation, useAdminCategoriesQuery, useSaveCategoryMutation, useDeleteCategoryMutation,
  useAdminBannersQuery, useSaveBannerMutation, useDeleteBannerMutation,
  useRawMaterialsQuery, useSaveRawMaterialMutation, useMoveRawStockMutation, useRawLedgerQuery,
  useFinishedStockQuery, useAdjustFinishedMutation, useRecipeQuery, useSaveRecipeMutation,
  useBatchesQuery, useCreateBatchMutation, useStartBatchMutation, useCompleteBatchMutation,
  useHawkersQuery, useHawkerQuery, useSaveHawkerMutation, useIssueStockMutation, useSettleIssueMutation,
  useHawkerPaymentMutation, useHawkerMeQuery, useUsersQuery, useCreateUserMutation, useUpdateUserMutation, useAuditLogsQuery,
} = adminApi;
