import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { appConfig } from "@/config/env";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  Bank,
  CreateTransferRecipientPayload,
  PaymentRequestPayload,
  RevenueHistoryItem,
  TransferRecipient,
  VerifyBankAccountPayload,
} from "@/types/revenue";
import type { RootState } from "../store";

export const paymentApiSlice = createApi({
  reducerPath: "paymentApi",
  baseQuery: fetchBaseQuery({
    baseUrl: appConfig.paymentApiUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth?.userInfo?.accessToken;

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Payment"],
  endpoints: (builder) => ({
    getBanks: builder.query<ApiSuccessResponse<Bank[] | { body?: Bank[] }>, void>({
      query: () => ({
        url: "banks",
        method: "GET",
      }),
      providesTags: ["Payment"],
    }),
    verifyBankAccount: builder.mutation<ApiSuccessResponse<unknown>, VerifyBankAccountPayload>({
      query: (data) => ({
        url: "verify-account",
        method: "POST",
        body: data,
      }),
    }),
    createTransferRecipient: builder.mutation<
      ApiSuccessResponse<TransferRecipient | TransferRecipient[] | { body?: TransferRecipient }>,
      CreateTransferRecipientPayload
    >({
      query: (data) => ({
        url: "transfer-recipient",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Payment"],
    }),
    getTransferRecipient: builder.query<
      ApiSuccessResponse<TransferRecipient | TransferRecipient[] | { body?: TransferRecipient }>,
      void
    >({
      query: () => ({
        url: "transfer-recipient",
        method: "GET",
      }),
      providesTags: ["Payment"],
    }),
    getTransferRequests: builder.query<
      ApiSuccessResponse<RevenueHistoryItem[] | { body?: RevenueHistoryItem[]; result?: RevenueHistoryItem[] }>,
      void
    >({
      query: () => ({
        url: "transfer-request",
        method: "GET",
      }),
      providesTags: ["Payment"],
    }),
    requestPayment: builder.mutation<ApiSuccessResponse<unknown>, PaymentRequestPayload>({
      query: (data) => ({
        url: "transfer-request",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Payment"],
    }),
  }),
});

export const {
  useCreateTransferRecipientMutation,
  useGetBanksQuery,
  useGetTransferRecipientQuery,
  useGetTransferRequestsQuery,
  useRequestPaymentMutation,
  useVerifyBankAccountMutation,
} = paymentApiSlice;
