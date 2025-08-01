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
    applelogin: builder.mutation<{ token: string }, any>({
      query: (data) => ({
        url: `${USER_URL}/apple`,
        method: "POST",
        body: data,
      }),
    }),
    googlelogin: builder.mutation<{ token: string }, any>({
      query: (data) => ({
        url: `${USER_URL}/google`,
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
    }),

   //Profile
    getProfile: builder.query<any, any>({
      query: () => ({
        url: `${PROFILE_URL}`,
      }),
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

     deleteProfile: builder.mutation({
          query: (id) => ({
            url: `${PROFILE_URL}`,
            method: 'DELETE',
          }),
        }),
        followEventCreator: builder.mutation({     
          query: (id) => ({
            url: `${PROFILE_URL}/follow/${id}`,
            method: "GET",
    
          }),
       
        }),
    }),
 
});

export const {
  useLoginMutation,
  useAppleloginMutation,
  useGoogleloginMutation,
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
  useDeleteProfileMutation,
  useFollowEventCreatorMutation,
  
} = userApiSlice;
