import { clientBaseAPISlice } from "../clientBaseAPI";

const extendApiSlice = clientBaseAPISlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllPublicEvents: builder.query({
      query: ({ page = 0, size = 9 }) => `event/list?page=${page}&size=${size}`,
    }),
    createEvent: builder.mutation({
      query: (eventDetails) => ({
        url: "event",
        method: "POST",
        body: eventDetails,
      }),
    }),
    getOneEvent: builder.query({
      query: (id) => `event/${id}`,
    }),
    getUpcomingEvents: builder.query({
      query: () => "event?type=UPCOMING",
    }),
    getUpcomingEventsByCategory: builder.query({
      query: ({ categoryID }) => `event?category_id=${categoryID}&type=UPCOMING`,
    }),
    getOneUpcomingEvent: builder.query({
      query: (id) => `event/${id}?type=UPCOMING`,
    }),
    searchEvents: builder.query({
      query: ({ query, page }) =>
        `event?search=${query}&page=${page}&size=12&sortDirection=desc`,
    }),
    filterEvents: builder.query({
      query: ({ category, price, start, end, page }) =>
        `event?category=${category}&price=${price}&start=${start}&end=${end}&page=${page}&size=12&sortDirection=desc`,
    }),
    sortEvents: builder.query({
      query: ({ sort, page }) =>
        `event?sortBy=${sort}&page=${page}&size=12&sortDirection=desc`,
    }),
    bookEvent: builder.mutation({
      query: (eventDetails) => ({
        url: "event/booking",
        method: "POST",
        body: eventDetails,
      }),
    }),
    getUserEvents: builder.query({
      query: () => "event/me",
    }),
    updateEvent: builder.mutation({
      query: ({ id, updatedEvent }) => ({
        url: `event/${id}`,
        method: "PATCH",
        body: updatedEvent,
      }),
    }),
    bookmarkEvent: builder.mutation({
      query: ({ event_id }) => ({
        url: `event/bookmark`,
        method: "POST",
        body: {
          event_id,
        },
      }),
    }),
    getBookmarkedEvents: builder.query({
      query: () => "event/bookmark",
    }),
    removeBookmarkEvent: builder.mutation({
      query: ({ id }) => ({
        url: `event/bookmark/${id}`,
        method: "DELETE",
      }),
    }),
    notifyUserAboutEvent: builder.mutation({
      query: ({ email }) => ({
        url: `subscribe`,
        method: "POST",
        body: {
          email,
        },
      })
    }),
    likeEvent: builder.query({
      query: ({ event_id }) => `event/${event_id}/like`,
    }),
    getEventComments: builder.query({
      query: ({ event_id }) => `event/${event_id}/comment`,
    }),
    likeEventComment: builder.mutation({
      query: ({ event_id, comment_id }) => ({
        url: `event/${event_id}/comment`,
        method: "PATCH",
        body: {
          comment_id,
        },
      }),
    }),
    getCommentReplies: builder.query({
      query: ({ event_id, comment_id }) =>
        `event/${event_id}/comment/${comment_id}`,
    }),
    commentOnEvent: builder.mutation({
      query: ({ event_id, comment }) => ({
        url: `event/${event_id}/comment`,
        method: "POST",
        body: {
          event_id,
          content: comment,
        },
      }),
    }),
    replyToComment: builder.mutation({
      query: ({ event_id, reply, parent_id }) => ({
        url: `event/${event_id}/comment`,
        method: "POST",
        body: {
          parent_id,
          content: reply,
        },
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllPublicEventsQuery,
  useLazyGetAllPublicEventsQuery,
  useCreateEventMutation,
  useLazyGetOneEventQuery,
  useGetUpcomingEventsQuery,
  useLazyGetUpcomingEventsByCategoryQuery,
  useLazyGetUpcomingEventsQuery,
  useLazyGetOneUpcomingEventQuery,
  useLazySearchEventsQuery,
  useLazyFilterEventsQuery,
  useLazySortEventsQuery,
  useBookEventMutation,
  useLazyGetUserEventsQuery,
  useUpdateEventMutation,
  useBookmarkEventMutation,
  useLazyGetBookmarkedEventsQuery,
  useRemoveBookmarkEventMutation,
  useNotifyUserAboutEventMutation,
  useLazyLikeEventQuery,
  useLazyGetEventCommentsQuery,
  useLikeEventCommentMutation,
  useLazyGetCommentRepliesQuery,
  useCommentOnEventMutation,
  useReplyToCommentMutation,
} = extendApiSlice;
