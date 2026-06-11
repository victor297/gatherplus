import { compactParams } from "@/utils/api";
import { ANALYTICS_URL } from "../constants";
import { apiSlice } from "./apiSlice";

interface RecommendedEventsParams {
  city?: string | null;
  country_code?: string | null;
  range?: string;
  region?: string | null;
  size?: number | string;
}

interface OrganizerRoiParams {
  event_id?: number | string;
  range?: string;
}

export const analyticsApiSlice = apiSlice.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    getRecommendedEvents: builder.query<any, RecommendedEventsParams | void>({
      query: (params = {}) => ({
        url: `${ANALYTICS_URL}/recommended-events`,
        params: compactParams({
          range: "30d",
          size: 8,
          ...params,
        }),
      }),
      providesTags: ["Event"],
    }),
    getOrganizerRoi: builder.query<any, OrganizerRoiParams | void>({
      query: (params = {}) => ({
        url: `${ANALYTICS_URL}/organizer/roi`,
        params: compactParams({
          range: "30d",
          ...params,
        }),
      }),
      providesTags: ["Event"],
    }),
  }),
});

export const { useGetOrganizerRoiQuery, useGetRecommendedEventsQuery } =
  analyticsApiSlice;
