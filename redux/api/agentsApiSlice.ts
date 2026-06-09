import { compactParams } from "@/utils/api";
import type { ApiSuccessResponse, PaginatedBody } from "@/types/api";
import { apiSlice } from "./apiSlice";

export type AgentDashboard = {
  agent?: {
    id: number;
    codes?: Array<{
      code: string;
      id?: number;
      name?: string | null;
    }>;
    currency?: string | null;
    display_name?: string | null;
    email?: string | null;
  } | null;
  metrics?: {
    availableBalance?: number;
    paidCommission?: number;
    pendingCommission?: number;
    redemptions?: number;
  };
};

export type AgentCommission = {
  id: number;
  code?: string | null;
  buyer_email_masked?: string | null;
  buyer_name_masked?: string | null;
  commission_amount?: number | string;
  status?: string | null;
  event?: { title?: string | null } | null;
  ticket?: { name?: string | null } | null;
};

export type AgentPayoutMethod = {
  id: number;
  account_name?: string | null;
  account_number_last4?: string | null;
  bank_code?: string | null;
  bank_name?: string | null;
  currency?: string | null;
};

export type AgentPayoutRequest = {
  id: number;
  amount?: number | string;
  currency?: string | null;
  created_at?: string | null;
  status?: string | null;
  payoutMethod?: AgentPayoutMethod | null;
};

type ListParams = {
  page?: number;
  search?: string;
  size?: number;
  status?: string;
};

export const agentsApiSlice = apiSlice.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    getAgentDashboard: builder.query<ApiSuccessResponse<AgentDashboard>, void>({
      query: () => ({
        url: "/agents/me",
      }),
      providesTags: ["Agent"],
    }),
    getAgentCommissions: builder.query<
      ApiSuccessResponse<PaginatedBody<AgentCommission>>,
      ListParams | void
    >({
      query: (params) => {
        const safeParams = params || {};

        return {
          url: "/agents/commissions",
          params: compactParams({
            page: safeParams.page ?? 1,
            size: safeParams.size ?? 10,
            search: safeParams.search,
            status: safeParams.status,
            sortBy: "created_at",
            sortDirection: "desc",
          }),
        };
      },
      providesTags: ["Agent"],
    }),
    getAgentPayoutMethods: builder.query<
      ApiSuccessResponse<AgentPayoutMethod[]>,
      void
    >({
      query: () => ({
        url: "/agents/payout-methods",
      }),
      providesTags: ["Agent"],
    }),
    addAgentPayoutMethod: builder.mutation<
      ApiSuccessResponse<AgentPayoutMethod>,
      {
        account_name: string;
        account_number: string;
        bank_code?: string;
        bank_name?: string;
        currency: string;
      }
    >({
      query: (body) => ({
        url: "/agents/payout-methods",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Agent"],
    }),
    getAgentPayoutRequests: builder.query<
      ApiSuccessResponse<PaginatedBody<AgentPayoutRequest>>,
      Pick<ListParams, "page" | "size" | "status"> | void
    >({
      query: (params) => {
        const safeParams = params || {};

        return {
          url: "/agents/payout-requests",
          params: compactParams({
            page: safeParams.page ?? 1,
            size: safeParams.size ?? 10,
            status: safeParams.status,
          }),
        };
      },
      providesTags: ["Agent"],
    }),
    requestAgentPayout: builder.mutation<
      ApiSuccessResponse<AgentPayoutRequest>,
      {
        amount: number;
        currency: string;
        payout_method_id?: number;
      }
    >({
      query: (body) => ({
        url: "/agents/payout-requests",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Agent"],
    }),
  }),
});

export const {
  useAddAgentPayoutMethodMutation,
  useGetAgentCommissionsQuery,
  useGetAgentDashboardQuery,
  useGetAgentPayoutMethodsQuery,
  useGetAgentPayoutRequestsQuery,
  useRequestAgentPayoutMutation,
} = agentsApiSlice;
