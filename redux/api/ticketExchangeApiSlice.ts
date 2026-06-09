import { compactParams } from "@/utils/api";
import { apiSlice } from "./apiSlice";

type MarketplaceParams = {
  page?: number | string;
  search?: string;
  size?: number | string;
};

type AdminParams = MarketplaceParams & {
  status?: string;
};

export const ticketExchangeApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTicketExchangeMarketplace: builder.query<any, MarketplaceParams | void>({
      query: (params = {}) => ({
        url: "/ticket-exchange",
        params: compactParams({
          page: 1,
          size: 24,
          ...params,
        }),
      }),
      providesTags: ["TicketExchange"],
    }),
    getEventTicketExchange: builder.query<any, string | number>({
      query: (eventId) => ({
        url: `/ticket-exchange/event/${eventId}`,
      }),
      providesTags: ["TicketExchange"],
    }),
    getMyTicketExchange: builder.query<any, void | Record<string, never>>({
      query: () => ({
        url: "/ticket-exchange/me",
      }),
      providesTags: ["TicketExchange"],
    }),
    createResaleListing: builder.mutation<any, { booking_id: number | string; price: number }>({
      query: (body) => ({
        url: "/ticket-exchange/listings",
        method: "POST",
        body,
      }),
      invalidatesTags: ["TicketExchange", "Booking"],
    }),
    cancelResaleListing: builder.mutation<any, number | string>({
      query: (id) => ({
        url: `/ticket-exchange/listings/${id}/cancel`,
        method: "PATCH",
      }),
      invalidatesTags: ["TicketExchange", "Booking"],
    }),
    startResaleOrder: builder.mutation<any, Record<string, unknown>>({
      query: (body) => ({
        url: "/ticket-exchange/orders",
        method: "POST",
        body,
      }),
      invalidatesTags: ["TicketExchange", "Booking"],
    }),
    completeResaleOrder: builder.query<any, string | number>({
      query: (reference) => ({
        url: `/ticket-exchange/orders/complete/${reference}`,
      }),
      providesTags: ["TicketExchange", "Booking"],
    }),
    joinTicketWaitlist: builder.mutation<any, Record<string, unknown>>({
      query: (body) => ({
        url: "/ticket-exchange/waitlist",
        method: "POST",
        body,
      }),
      invalidatesTags: ["TicketExchange"],
    }),
    joinTicketWaitlistAuth: builder.mutation<any, Record<string, unknown>>({
      query: (body) => ({
        url: "/ticket-exchange/waitlist/auth",
        method: "POST",
        body,
      }),
      invalidatesTags: ["TicketExchange"],
    }),
    cancelTicketWaitlist: builder.mutation<any, number | string>({
      query: (id) => ({
        url: `/ticket-exchange/waitlist/${id}/cancel`,
        method: "PATCH",
      }),
      invalidatesTags: ["TicketExchange"],
    }),
    getAdminTicketExchange: builder.query<any, AdminParams | void>({
      query: (params = {}) => ({
        url: "/ticket-exchange/admin",
        params: compactParams({
          page: 1,
          size: 20,
          ...params,
        }),
      }),
      providesTags: ["TicketExchange"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCancelResaleListingMutation,
  useCancelTicketWaitlistMutation,
  useCompleteResaleOrderQuery,
  useCreateResaleListingMutation,
  useGetAdminTicketExchangeQuery,
  useGetEventTicketExchangeQuery,
  useGetMyTicketExchangeQuery,
  useGetTicketExchangeMarketplaceQuery,
  useJoinTicketWaitlistAuthMutation,
  useJoinTicketWaitlistMutation,
  useStartResaleOrderMutation,
} = ticketExchangeApiSlice;
