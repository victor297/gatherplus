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

  }),
});

export const {
useGetcategoriesQuery,
  useCreateventMutation, 
} = userApiSlice;
