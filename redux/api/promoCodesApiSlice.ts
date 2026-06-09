import { compactParams } from "@/utils/api";
import type { ApiSuccessResponse, PaginatedBody } from "@/types/api";
import { apiSlice } from "./apiSlice";

export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export type PromoCode = {
  id: number;
  active: boolean;
  code: string;
  currency?: string | null;
  discount_type: DiscountType;
  discount_value: number | string;
  event_id?: number | null;
  expires_at?: string | null;
  min_order_amount?: number | string | null;
  name?: string | null;
  per_user_limit?: number | null;
  usage_limit?: number | null;
  used_count?: number | null;
  event?: {
    id?: number;
    title?: string | null;
    currency?: string | null;
  } | null;
  _count?: {
    bookings?: number;
    redemptions?: number;
  };
};

export type PromoCodePayload = {
  active?: boolean;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  event_id: number;
  expires_at?: string;
  min_order_amount?: number;
  name?: string;
  per_user_limit?: number;
  usage_limit?: number;
};

export type BulkPromoCodePayload = PromoCodePayload & {
  prefix: string;
  quantity: number;
};

export type PromoAnalytics = {
  metrics?: {
    activeCodes?: number;
    expiredCodes?: number;
    totalCodes?: number;
    totalDiscountAmount?: number;
    totalFinalAmount?: number;
    totalRedemptions?: number;
  };
  breakdownByCode?: Array<{
    code: string;
    id: number;
    name?: string | null;
    redemptions: number;
    totalDiscount?: number;
    totalRevenue?: number;
  }>;
  usageLeaders?: Array<{
    code: string;
    id: number;
    name?: string | null;
    redemptions?: number;
    usageLimit?: number | null;
    usageRate?: number | null;
    usedCount?: number;
  }>;
};

export type PromoRedemption = {
  id: number;
  code: string;
  created_at: string;
  discount_amount: number | string;
  email?: string | null;
  final_amount: number | string;
  original_amount: number | string;
  booking?: {
    code?: string | null;
    email?: string | null;
    fullname?: string | null;
    status?: string | null;
  } | null;
  promoCode?: {
    code?: string | null;
    name?: string | null;
  } | null;
};

type ListParams = {
  event_id?: number | string;
  page?: number;
  search?: string;
  size?: number;
};

export const promoCodesApiSlice = apiSlice.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    getMyPromoCodes: builder.query<
      ApiSuccessResponse<PaginatedBody<PromoCode>>,
      ListParams | void
    >({
      query: (params) => {
        const safeParams = params || {};

        return {
          url: "/promo-codes",
          params: compactParams({
            page: safeParams.page ?? 1,
            size: safeParams.size ?? 10,
            search: safeParams.search,
            event_id: safeParams.event_id,
            sortBy: "created_at",
            sortDirection: "desc",
          }),
        };
      },
      providesTags: ["PromoCode"],
    }),
    getPromoCodeAnalytics: builder.query<
      ApiSuccessResponse<PromoAnalytics>,
      Pick<ListParams, "event_id" | "search"> | void
    >({
      query: (params) => {
        const safeParams = params || {};

        return {
          url: "/promo-codes/analytics",
          params: compactParams({
            event_id: safeParams.event_id,
            search: safeParams.search,
          }),
        };
      },
      providesTags: ["PromoCode"],
    }),
    getPromoCodeRedemptions: builder.query<
      ApiSuccessResponse<PaginatedBody<PromoRedemption>>,
      ListParams | void
    >({
      query: (params) => {
        const safeParams = params || {};

        return {
          url: "/promo-codes/redemptions",
          params: compactParams({
            page: safeParams.page ?? 1,
            size: safeParams.size ?? 8,
            event_id: safeParams.event_id,
            search: safeParams.search,
            sortBy: "created_at",
            sortDirection: "desc",
          }),
        };
      },
      providesTags: ["PromoCode"],
    }),
    createPromoCode: builder.mutation<
      ApiSuccessResponse<PromoCode>,
      PromoCodePayload
    >({
      query: (body) => ({
        url: "/promo-codes",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PromoCode"],
    }),
    bulkCreatePromoCodes: builder.mutation<
      ApiSuccessResponse<{ created: PromoCode[]; totalCreated: number }>,
      BulkPromoCodePayload
    >({
      query: (body) => ({
        url: "/promo-codes/bulk",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PromoCode"],
    }),
    updatePromoCode: builder.mutation<
      ApiSuccessResponse<PromoCode>,
      { id: number; payload: PromoCodePayload }
    >({
      query: ({ id, payload }) => ({
        url: `/promo-codes/${id}`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: ["PromoCode"],
    }),
    archivePromoCode: builder.mutation<ApiSuccessResponse<PromoCode>, number>({
      query: (id) => ({
        url: `/promo-codes/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PromoCode"],
    }),
  }),
});

export const {
  useArchivePromoCodeMutation,
  useBulkCreatePromoCodesMutation,
  useCreatePromoCodeMutation,
  useGetMyPromoCodesQuery,
  useGetPromoCodeAnalyticsQuery,
  useGetPromoCodeRedemptionsQuery,
  useUpdatePromoCodeMutation,
} = promoCodesApiSlice;
