import { compactParams } from "@/utils/api";
import type { ParticipantBookingQuery } from "@/types/bookings";
import type { EventListParams } from "@/types/events";
import { BASE_RESOURCE_URL, EVENT_URL } from "../constants";
import { apiSlice } from "./apiSlice";

type EventId = string | number;

export const eventApiSlice = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createvent: builder.mutation<any, any>({
      query: (data) => ({
        url: EVENT_URL,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Event"],
    }),
    updatevent: builder.mutation<any, { data: any; id: EventId }>({
      query: ({ data, id }) => ({
        url: `${EVENT_URL}/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Event", id }],
    }),
    getcategories: builder.query<any, void | Record<string, never>>({
      query: () => ({
        url: `${BASE_RESOURCE_URL}/category`,
      }),
      providesTags: ["Base"],
    }),
    getCountries: builder.query<any, void | Record<string, never>>({
      query: () => ({
        url: `${BASE_RESOURCE_URL}/country`,
      }),
      providesTags: ["Base"],
    }),
    getMaxFreeTicket: builder.query<any, void | Record<string, never>>({
      query: () => ({
        url: `${BASE_RESOURCE_URL}/setting`,
      }),
      providesTags: ["Base"],
    }),
    getStates: builder.query<any, string | number>({
      query: (country) => ({
        url: `${BASE_RESOURCE_URL}/country/state/${country}`,
      }),
      providesTags: ["Base"],
    }),
    getEvents: builder.query<any, EventListParams | void>({
      query: (params = {}) => ({
        url: `${EVENT_URL}/list`,
        params: compactParams(params),
      }),
      providesTags: ["Event"],
    }),
    getEvent: builder.query<any, { id: EventId; user_id?: EventId }>({
      query: ({ id, user_id }) => ({
        url: `${EVENT_URL}/${id}`,
        params: compactParams({ user_id }),
      }),
      providesTags: (_result, _error, { id }) => [{ type: "Event", id }],
    }),
    deleteEvent: builder.mutation<any, EventId>({
      query: (id) => ({
        url: `${EVENT_URL}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Event"],
    }),
    deleteBookmark: builder.mutation<any, EventId>({
      query: (id) => ({
        url: `${EVENT_URL}/bookmark/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Bookmark", "Event"],
    }),
    bookmarkevent: builder.mutation<any, any>({
      query: (data) => ({
        url: `${EVENT_URL}/bookmark`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Bookmark", "Event"],
    }),
    getBookmarks: builder.query<any, void | EventId | Record<string, never>>({
      query: () => ({
        url: `${EVENT_URL}/bookmark`,
      }),
      providesTags: ["Bookmark"],
    }),
    createBooking: builder.mutation<any, any>({
      query: (data) => ({
        url: `${EVENT_URL}/booking`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Booking", "Event"],
    }),
    validatePromoCode: builder.mutation<any, any>({
      query: (data) => ({
        url: "/promo-codes/validate",
        method: "POST",
        body: data,
      }),
    }),
    getBookings: builder.query<any, Record<string, unknown> | void>({
      query: (params = {}) => ({
        url: `${EVENT_URL}/booking/event`,
        params: compactParams(params),
      }),
      providesTags: ["Booking"],
    }),
    getUserTicketBookings: builder.query<any, void | Record<string, unknown>>({
      query: (params = {}) => ({
        url: `${EVENT_URL}/booking/me`,
        params: compactParams(params),
      }),
      providesTags: ["Booking"],
    }),
    getMyEventBookings: builder.query<any, ParticipantBookingQuery>({
      query: ({ id, ...params }) => ({
        url: `${EVENT_URL}/booking/${id}/booking`,
        params: compactParams(params),
      }),
      providesTags: ["Booking"],
    }),
    getBookingDetails: builder.query<any, EventId>({
      query: (id) => ({
        url: `${EVENT_URL}/booking/${id}/booking/me`,
      }),
      providesTags: (_result, _error, id) => [{ type: "Booking", id }],
    }),
    getBookingById: builder.query<any, EventId>({
      query: (id) => ({
        url: `${EVENT_URL}/booking/${id}`,
      }),
      providesTags: (_result, _error, id) => [{ type: "Booking", id }],
    }),
    completeBookingPayment: builder.mutation<any, EventId>({
      query: (txnRef) => ({
        url: `${EVENT_URL}/booking/complete/${txnRef}`,
        method: "GET",
      }),
      invalidatesTags: ["Booking", "Event"],
    }),
    LikeEvent: builder.mutation<any, EventId>({
      query: (id) => ({
        url: `${EVENT_URL}/${id}/like`,
        method: "GET",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "Event", id }],
    }),
    unlikeEvent: builder.mutation<any, EventId>({
      query: (id) => ({
        url: `${EVENT_URL}/${id}/like`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "Event", id }],
    }),
    getMyEvents: builder.query<any, EventListParams | void>({
      query: (params = {}) => ({
        url: `${EVENT_URL}/me`,
        params: compactParams(params),
      }),
      providesTags: ["Event"],
    }),
    createComment: builder.mutation<any, { data: any; user_id: EventId }>({
      query: ({ data, user_id }) => ({
        url: `${EVENT_URL}/${user_id}/comment`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { user_id }) => [{ type: "Event", id: user_id }],
    }),
    likeComment: builder.mutation<any, { data: any; user_id: EventId }>({
      query: ({ data, user_id }) => ({
        url: `${EVENT_URL}/${user_id}/comment`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { user_id }) => [{ type: "Event", id: user_id }],
    }),
    getComments: builder.query<any, EventId>({
      query: (event_id) => ({
        url: `${EVENT_URL}/${event_id}/comment`,
      }),
      providesTags: (_result, _error, event_id) => [{ type: "Event", id: event_id }],
    }),
    getReplies: builder.query<any, { event_id: EventId; parent_id: EventId }>({
      query: ({ event_id, parent_id }) => ({
        url: `${EVENT_URL}/${event_id}/comment/${parent_id}`,
      }),
      providesTags: (_result, _error, { event_id }) => [{ type: "Event", id: event_id }],
    }),
  }),
});

export const userApiSlice = eventApiSlice;

export const {
  useBookmarkeventMutation,
  useCreateBookingMutation,
  useCompleteBookingPaymentMutation,
  useCreateCommentMutation,
  useCreateventMutation,
  useDeleteBookmarkMutation,
  useDeleteEventMutation,
  useGetBookingDetailsQuery,
  useGetBookingByIdQuery,
  useGetBookingsQuery,
  useGetBookmarksQuery,
  useGetCommentsQuery,
  useGetCountriesQuery,
  useGetEventQuery,
  useGetEventsQuery,
  useGetMaxFreeTicketQuery,
  useGetMyEventBookingsQuery,
  useGetMyEventsQuery,
  useGetRepliesQuery,
  useGetStatesQuery,
  useGetUserTicketBookingsQuery,
  useGetcategoriesQuery,
  useLikeCommentMutation,
  useLikeEventMutation,
  useUnlikeEventMutation,
  useUpdateventMutation,
  useValidatePromoCodeMutation,
} = eventApiSlice;
