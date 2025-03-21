import { apiSlice } from "./apiSlice";
import { PROFILE_URL, USER_URL } from "../constants";

interface LoginData {
  username: string;
  password: string;
}

interface SignupData {
  data:{
  name: string;
  email: string;
  password: string;
}
}

interface UpdateUserData {
  id: string;
  data: Record<string, any>;
}

export const userApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<{ token: string }, LoginData>({
      query: (data) => ({
        url: `${USER_URL}/token`,
        method: "POST",
        body: data,
      }),
    }),
    usersignup: builder.mutation<any,any>({
      query: (data) => ({
        url: `${USER_URL}`,
        method: "POST",
        body: data,
      }),
    }),
    verifyuser: builder.mutation<any,any>({
      query: (data) => ({
        url: `${USER_URL}/activate`,
        method: "POST",
        body: data,
      }),
    }),
    forgetpassword: builder.mutation<any,any>({
      query: (data) => ({
        url: `${USER_URL}/request-password-reset`,
        method: "POST",
        body: data,
      }),
    }),
    resetpassword: builder.mutation<any,any>({
      query: (data) => ({
        url: `${USER_URL}/reset-password`,
        method: "POST",
        body: data,
      }),
    }),
    logout: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `${USER_URL}/logout/${id}`,
        method: "GET",
      }),
    }),
    getUserDetails: builder.query<{ id: string; name: string; email: string }, any>({
      query: (id) => ({
        url: `${USER_URL}/${id}`,
      }),
      providesTags: ["User"],
      keepUnusedDataFor: 5,
    }),

   //Profile
    getProfile: builder.query<any, any>({
      query: () => ({
        url: `${PROFILE_URL}`,
      }),
      providesTags: ["User"],
      keepUnusedDataFor: 5,
    }),  
     updateProfile: builder.mutation<{ success: boolean }, any>({
      query: (data) => ({
        url: `${PROFILE_URL}`,
        method: "PATCH",
        body: data,
      }), }),
     updateEmail: builder.mutation<{ success: boolean }, any>({
      query: (data) => ({
        url: `${PROFILE_URL}/email`,
        method: "PUT",
        body: data,
      }), }),
     updatePassword: builder.mutation<{ success: boolean }, any>({
      query:(data) => ({
        url: `${PROFILE_URL}/password`,
        method: "PUT",
        body: data,
      }),
    }),
     updateInterest: builder.mutation<{ success: boolean }, any>({
      query: (data) => ({
        url: `${PROFILE_URL}`,
        method: "PUT",
        body: data,
      }),
    }),
    }),
 
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useUsersignupMutation,
  useGetUserDetailsQuery,
  useVerifyuserMutation,
  useForgetpasswordMutation,
  useResetpasswordMutation,
  useGetProfileQuery, 
  useUpdateProfileMutation,
  useUpdateEmailMutation,
  useUpdatePasswordMutation,
  
} = userApiSlice;
