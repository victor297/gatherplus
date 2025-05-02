import { apiSlice } from "./apiSlice";
import { BASE_URL, USER_URL } from "../constants";


export const userApiSlice = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createvent: builder.mutation<any,any>({
      query: (data) => ({
        url: `${BASE_URL}/event`,
        method: "POST",
        body: data,
      }),
    }),
    updatevent: builder.mutation<any,any>({
      query: ({data,id}) => ({
        url: `${BASE_URL}/event/${id}`,
        method: "PUT",
        body: data,
      }),
    }),
    getcategories: builder.query({
      query: () => ({
        url: `${BASE_URL}/base/category`,
      }),
    }),
    getCountries: builder.query({
      query: () => ({
        url: `${BASE_URL}/base/country`,
      }),
     
    }),
    getStates: builder.query<any,any>({
      query: (country:any) => ({
        url: `${BASE_URL}/base/country/state/${country}`,
      }),
    }),
    getEvents: builder.query<any,any>({
      query: ({ category_id,country_code, state_id, city, type, search, sortBy, sortDirection,page,size,start_date,end_date } = {}) => {
        const params = new URLSearchParams();
        if (category_id) params.append("category_id", category_id);
        if (country_code) params.append("country_code", country_code);
        if (state_id) params.append("state_id", state_id);
        if (city) params.append("city", city);
        if (type) params.append("type", type);
        if (search) params.append("search", search);
        if (sortBy) params.append("sortBy", sortBy);
        if (sortDirection) params.append("sortDirection", sortDirection);
        if (page) params.append("page", page);
        if (size) params.append("size", size);
        if (start_date) params.append("start_date", start_date);
        if (end_date) params.append("end_date", end_date);
        return {
          url: `${BASE_URL}/event/list?${params.toString()}`,
        };
      },

    }),
    getEvent: builder.query({     
      query: ({id,user_id}) => ({
        url: `${BASE_URL}/event/${id}?user_id=${user_id}`,
      }),
    
    }),
    deleteEvent: builder.mutation({
      query: (id) => ({
        url: `${BASE_URL}/event/${id}`,
        method: 'DELETE',
      }),
    }),
    deleteBookmark: builder.mutation({
      query: (id) => ({
        url: `${BASE_URL}/event/bookmark/${id}`,
        method: 'DELETE',
      }),
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
          url: `${BASE_URL}/event/booking/event?${params.toString()}`,
        };
      },
  
    }),
    getMyEventBookings: builder.query<any,any>({
      query: ({id,  type } = {}) => {
        const params = new URLSearchParams();
  
        if (type) params.append("type", type);
  
  
        return {
          url: `${BASE_URL}/event/booking/${id}/booking?${params.toString()}`,
        }; 
      },
  
    }),
    getBookingDetails: builder.query({     
      query: (id) => ({
        url: `${BASE_URL}/event/booking/${id}/booking/me`,
      }),
   
    }),
    getMyEvents: builder.query<any,any>({
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
          url: `${BASE_URL}/event/me?${params.toString()}`,
        };
      },
      
    }),
  }),

});

export const {
useGetcategoriesQuery,
  useCreateventMutation,
  useUpdateventMutation, 
  useDeleteBookmarkMutation,
  useGetEventsQuery,
  useGetCountriesQuery,
  useGetStatesQuery,
  useGetEventQuery,
  useBookmarkeventMutation,
  useGetBookmarksQuery,
  useCreateBookingMutation,
  useGetBookingsQuery,
  useGetMyEventsQuery,
  useGetBookingDetailsQuery,
  useDeleteEventMutation,
  useGetMyEventBookingsQuery,
} = userApiSlice;
