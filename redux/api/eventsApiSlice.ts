import { apiSlice } from "./apiSlice";
import { BASE_URL, USER_URL } from "../constants";


export const userApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createvent: builder.mutation<any,any>({
      query: (data) => ({
        url: `${BASE_URL}/event`,
        method: "POST",
        body: data,
      }),
    }),
    getcategories: builder.query({
      query: () => ({
        url: `${BASE_URL}/base/category`,
      }),
      providesTags: ["Category"],
      keepUnusedDataFor: 5,
    }),
    getCountries: builder.query({
      query: () => ({
        url: `${BASE_URL}/base/country`,
      }),
      providesTags: ["Category"],
      keepUnusedDataFor: 5,
    }),
    getStates: builder.query<any,any>({
      query: (country:any) => ({
        url: `${BASE_URL}/base/country/state/${country}`,
      }),
      providesTags: ["Category"],
      keepUnusedDataFor: 5,
    }),
    getEvents: builder.query<any,any>({
      query: ({ category_id, state_id, city, type, search, sortBy, sortDirection,page,size } = {}) => {
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
          url: `${BASE_URL}/event?${params.toString()}`,
        };
      },
      providesTags: ["Event"],
      keepUnusedDataFor: 5,
    }),
    getEvent: builder.query({     
      query: ({id,user_id}) => ({
        url: `${BASE_URL}/event/${id}?user_id=${user_id}`,
      }),
      providesTags: ["Event"],
      keepUnusedDataFor: 5,
    }),
    deleteBookmark: builder.mutation({
      query: (id) => ({
        url: `${BASE_URL}/event/bookmark/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ["Event"],
    }),
    bookmarkevent: builder.mutation<any,any>({
      query: (data) => ({
        url: `${BASE_URL}/event/bookmark`,
        method: "POST",
        body: data,
      }),
    }),
    getBookmarks: builder.query({
      query: (id) => ({
        url: `${BASE_URL}/event/bookmark`,
      }),
      providesTags: ["Event"],
      keepUnusedDataFor: 5,
    }),
    createBooking: builder.mutation<any,any>({
      query: (data) => ({
        url: `${BASE_URL}/event/booking`,
        method: "POST",
        body: data,
      }),
    }),

    getBookings: builder.query<any,any>({
      query: ({  type } = {}) => {
        const params = new URLSearchParams();
  
        if (type) params.append("type", type);
  
  
        return {
          url: `${BASE_URL}/event/booking/me?${params.toString()}`,
        };
      },
      providesTags: ["Event"],
      keepUnusedDataFor: 5,
    }),
  }),

});

export const {
useGetcategoriesQuery,
  useCreateventMutation, 
  useDeleteBookmarkMutation,
  useGetEventsQuery,
  useGetCountriesQuery,
  useGetStatesQuery,
  useGetEventQuery,
  useBookmarkeventMutation,
  useGetBookmarksQuery,
  useCreateBookingMutation,
  useGetBookingsQuery
} = userApiSlice;
