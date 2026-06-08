import { apiSlice } from "./apiSlice";
import { PROVIDER_URL } from "../constants";

export const providerApiSlice = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getproviders: builder.query({
      query: () => ({
        url: `${PROVIDER_URL}`,
      }),
    }),
    getproviderdetails: builder.query({
      query: (id) => ({
        url: `${PROVIDER_URL}/${id}`,
      }),
    }),
    getservicecategories: builder.query({
      query: () => ({
        url: `${PROVIDER_URL}/service-category`,
      }),
    }),
    getPlans: builder.query({
      query: () => ({
        url: `${PROVIDER_URL}/plans`,
      }),
    }),
    initiateSub: builder.mutation<any, any>({
      query: (data) => ({
        url: `${PROVIDER_URL}/subscription/initiate`,
        method: "POST",
        body: data,
      }),
    }),
    completeSub: builder.mutation<any, any>({
      query: (data) => ({
        url: `${PROVIDER_URL}/subscription/complete`,
        method: "POST",
        body: data,
      }),
    }),
    completeProfile: builder.mutation<any, any>({
      query: (data) => ({
        url: `${PROVIDER_URL}`,
        method: "POST",
        body: data,
      }),
    }),
    createService: builder.mutation<any, any>({
      query: (data) => ({
        url: `${PROVIDER_URL}/services`,
        method: "POST",
        body: data,
      }),
    }),
    updateService: builder.mutation<any, any>({
      query: ({ data, id }) => ({
        url: `${PROVIDER_URL}/services/${id}`,
        method: "PATCH",
        body: data,
      }),
    }),
    createworkinghours: builder.mutation<any, any>({
      query: (data) => ({
        url: `${PROVIDER_URL}/working-hour/multiple`,
        method: "POST",
        body: data,
      }),
    }),
    deleteworkinghour: builder.mutation({
      query: (id) => ({
        url: `${PROVIDER_URL}/working-hour/${id}`,
        method: "DELETE",
      }),
    }),
    uploadGallery: builder.mutation<any, any>({
      query: (data) => ({
        url: `${PROVIDER_URL}/media/multiple`,
        method: "POST",
        body: data,
      }),
    }),
    createTimeslot: builder.mutation<any, any>({
      query: (data) => ({
        url: `${PROVIDER_URL}/timeslot`,
        method: "POST",
        body: data,
      }),
    }),

    getTimeslot: builder.query<any, any>({
      query: ({ id, day }) => {
        const params = new URLSearchParams();

        if (day) params.append("day", day);

        return {
          url: `${PROVIDER_URL}/timeslot/${id}/?${params.toString()}`,
        };
      },
    }),
    makeAppointment: builder.mutation<any, any>({
      query: (data) => ({
        url: `${PROVIDER_URL}/appointment`,
        method: "POST",
        body: data,
      }),
    }),
    createReview: builder.mutation<any, any>({
      query: (data) => ({
        url: `${PROVIDER_URL}/reviews`,
        method: "POST",
        body: data,
      }),
    }),
    getReviews: builder.query({
      query: (id) => ({
        url: `${PROVIDER_URL}/reviews/${id}`,
      }),
    }),
    createChat: builder.mutation<any, any>({
      query: (data) => ({
        url: `${PROVIDER_URL}/chat`,
        method: "POST",
        body: data,
      }),
    }),

    getAllChats: builder.query({
      query: (id) => ({
        url: `${PROVIDER_URL}/chat`,
      }),
    }),
    getChatDetails: builder.query({
      query: (id) => ({
        url: `${PROVIDER_URL}/chat/${id}`,
      }),
    }),
    getAppointment: builder.query({
      query: () => ({
        url: `${PROVIDER_URL}/appointment`,
      }),
    }),
    updateAppointment: builder.mutation<any, any>({
      query: ({ data, id }) => ({
        url: `${PROVIDER_URL}/appointment/${id}`,
        method: "PATCH",
        body: data,
      }),
    }),
    cancelAppointment: builder.mutation({
      query: (id) => ({
        url: `${PROVIDER_URL}/appointment/${id}`,
        method: "DELETE",
      }),
    }),
    getMedias: builder.query({
      query: (id) => ({
        url: `${PROVIDER_URL}/media/${id}`,
      }),
    }),

    // have  to replace all events mutations woth thwe providers

    deleteBookmark: builder.mutation({
      query: (id) => ({
        url: `${PROVIDER_URL}/event/bookmark/${id}`,
        method: "DELETE",
      }),
    }),

    getBookmarks: builder.query({
      query: (id) => ({
        url: `${PROVIDER_URL}/event/bookmark`,
      }),
    }),
    createBooking: builder.mutation<any, any>({
      query: (data) => ({
        url: `${PROVIDER_URL}/event/booking`,
        method: "POST",
        body: data,
      }),
    }),

    getBookings: builder.query<any, any>({
      query: ({ type } = {}) => {
        const params = new URLSearchParams();

        if (type) params.append("type", type);

        return {
          url: `${PROVIDER_URL}/event/booking/event?${params.toString()}`,
        };
      },
    }),
    getMyEventBookings: builder.query<any, any>({
      query: ({ id, type } = {}) => {
        const params = new URLSearchParams();

        if (type) params.append("type", type);

        return {
          url: `${PROVIDER_URL}/event/booking/${id}/booking?${params.toString()}`,
        };
      },
    }),
    getBookingDetails: builder.query({
      query: (id) => ({
        url: `${PROVIDER_URL}/event/booking/${id}/booking/me`,
      }),
    }),
    LikeEvent: builder.mutation({
      query: (id) => ({
        url: `${PROVIDER_URL}/event/${id}/like`,
        method: "GET",
      }),
    }),
    getMyEvents: builder.query<any, any>({
      query: ({
        category_id,
        state_id,
        city,
        type,
        search,
        sortBy,
        sortDirection,
        page,
        size,
      } = {}) => {
        const params = new URLSearchParams();
        if (category_id) params.append("category_id", category_id);
        if (state_id) params.append("state_id", state_id);
        if (city) params.append("city", city);
        if (type) params.append("type", type);
        if (search) params.append("search", search);
        if (sortBy) params.append("sortBy", sortBy);
        if (sortDirection) params.append("sortDirection", sortDirection);
        if (page) params.append("page", page);
        if (size) params.append("size", size);

        return {
          url: `${PROVIDER_URL}/event/me?${params.toString()}`,
        };
      },
    }),

    createComment: builder.mutation<any, any>({
      query: ({ data, user_id }) => ({
        url: `${PROVIDER_URL}/event/${user_id}/comment`,
        method: "POST",
        body: data,
      }),
    }),
    likeComment: builder.mutation<any, any>({
      query: ({ data, user_id }) => ({
        url: `${PROVIDER_URL}/event/${user_id}/comment`,
        method: "PATCH",
        body: data,
      }),
    }),

    getComments: builder.query({
      query: (event_id) => ({
        url: `${PROVIDER_URL}/event/${event_id}/comment`,
      }),
    }),
    getReplies: builder.query({
      query: ({ event_id, parent_id }) => ({
        url: `${PROVIDER_URL}/event/${event_id}/comment/${parent_id}`,
      }),
    }),
  }),
});

export const {
  useGetprovidersQuery,
  useGetproviderdetailsQuery,
  useGetservicecategoriesQuery,
  useGetPlansQuery,
  useCompleteProfileMutation,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useCreateworkinghoursMutation,
  useDeleteworkinghourMutation,
  useCreateTimeslotMutation,
  useUploadGalleryMutation,
  useGetTimeslotQuery,
  useMakeAppointmentMutation,
  useCreateReviewMutation,
  useGetReviewsQuery,
  useCreateChatMutation,
  useGetAllChatsQuery,
  useGetChatDetailsQuery,
  useGetAppointmentQuery,
  useUpdateAppointmentMutation,
  useCancelAppointmentMutation,
  useInitiateSubMutation,
  useCompleteSubMutation,

  useDeleteBookmarkMutation,
  useGetBookmarksQuery,
  useCreateBookingMutation,
  useGetBookingsQuery,
  useGetMyEventsQuery,
  useGetBookingDetailsQuery,
  useGetMyEventBookingsQuery,
  useLikeEventMutation,
  useCreateCommentMutation,
  useGetCommentsQuery,
  useGetRepliesQuery,
  useLikeCommentMutation,
  useGetMediasQuery,
} = providerApiSlice;
