import { compactParams } from "@/utils/api";
import type {
  AiEventBuilderRequest,
  AiEventBuilderStatus,
  AiEventDraft,
  AiSuggestRequest,
  AiSuggestResponse,
} from "@/types/aiEventBuilder";
import type { ApiSuccessResponse } from "@/types/api";
import type { CreateEventV2Payload, EventListParams } from "@/types/events";
import { NEW_EVENTS_URL } from "../constants";
import { apiSlice } from "./apiSlice";

type EventId = string | number;

export const newEventsApiSlice = apiSlice.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    getAiEventBuilderStatus: builder.query<ApiSuccessResponse<AiEventBuilderStatus>, void>({
      query: () => ({
        url: `${NEW_EVENTS_URL}/ai/status`,
        method: "GET",
      }),
      providesTags: ["AiEventBuilder"],
    }),
    generateAiEventDraft: builder.mutation<
      ApiSuccessResponse<AiEventDraft>,
      AiEventBuilderRequest
    >({
      query: (data) => ({
        url: `${NEW_EVENTS_URL}/ai/generate`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["AiEventBuilder"],
    }),
    suggestAiEventEdits: builder.mutation<ApiSuccessResponse<AiSuggestResponse>, AiSuggestRequest>({
      query: (data) => ({
        url: `${NEW_EVENTS_URL}/ai/suggest`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["AiEventBuilder"],
    }),
    getNewEvents: builder.query<any, EventListParams | void>({
      query: (params = {}) => ({
        url: NEW_EVENTS_URL,
        params: compactParams(params),
      }),
      providesTags: ["NewEvent"],
    }),
    getMyNewEvents: builder.query<any, EventListParams | void>({
      query: (params = {}) => ({
        url: `${NEW_EVENTS_URL}/me`,
        params: compactParams(params),
      }),
      providesTags: ["NewEvent"],
    }),
    getNewEvent: builder.query<any, EventId>({
      query: (id) => ({
        url: `${NEW_EVENTS_URL}/${id}`,
      }),
      providesTags: (_result, _error, id) => [{ type: "NewEvent", id }],
    }),
    createNewEvent: builder.mutation<any, CreateEventV2Payload>({
      query: (data) => ({
        url: NEW_EVENTS_URL,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["NewEvent", "Event"],
    }),
    updateNewEvent: builder.mutation<
      any,
      { data: Partial<CreateEventV2Payload>; id: EventId }
    >({
      query: ({ data, id }) => ({
        url: `${NEW_EVENTS_URL}/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "NewEvent", id },
        "Event",
      ],
    }),
    patchNewEvent: builder.mutation<any, { data: Partial<CreateEventV2Payload>; id: EventId }>({
      query: ({ data, id }) => ({
        url: `${NEW_EVENTS_URL}/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "NewEvent", id },
        "Event",
      ],
    }),
  }),
});

export const {
  useCreateNewEventMutation,
  useGenerateAiEventDraftMutation,
  useGetAiEventBuilderStatusQuery,
  useGetMyNewEventsQuery,
  useGetNewEventQuery,
  useGetNewEventsQuery,
  usePatchNewEventMutation,
  useSuggestAiEventEditsMutation,
  useUpdateNewEventMutation,
} = newEventsApiSlice;
