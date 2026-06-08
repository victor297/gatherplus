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
    "Base",
    "Booking",
    "Bookmark",
    "Event",
    "NewEvent",
    "Profile",
    "Provider",
    "Questionnaire",
    "Wallet",
  ],
  endpoints: () => ({}),
});

export type ApiSlice = typeof apiSlice;
