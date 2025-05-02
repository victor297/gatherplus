import { fetchBaseQuery, createApi } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../constants";
import type { RootState } from "../store"; // Ensure you import RootState type

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth?.userInfo?.accessToken;
    console.log("Token in prepareHeaders:", token); // Debugging step
  
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  
    return headers;
  },
  
});

export const apiSlice = createApi({
  baseQuery,
  endpoints: () => ({}),
});

export type ApiSlice = typeof apiSlice;
