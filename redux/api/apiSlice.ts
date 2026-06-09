import { fetchBaseQuery, createApi } from "@reduxjs/toolkit/query/react";
import { appConfig } from "@/config/env";
import type { RootState } from "../store";

const baseQuery = fetchBaseQuery({
  baseUrl: appConfig.coreApiUrl,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth?.userInfo?.accessToken;
  
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  
    return headers;
  },
  
});

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: [
    "AiEventBuilder",
    "Agent",
    "Base",
    "Blog",
    "Booking",
    "Bookmark",
    "Event",
    "NewEvent",
    "Notifications",
    "PromoCode",
    "Profile",
    "Provider",
    "Questionnaire",
    "TicketExchange",
    "Wallet",
  ],
  endpoints: () => ({}),
});

export type ApiSlice = typeof apiSlice;
