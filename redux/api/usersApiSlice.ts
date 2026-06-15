import { apiSlice } from "./apiSlice";
import { FILE_URL, PROFILE_URL, USER_URL } from "../constants";

interface LoginData {
  username: string;
  password: string;
  recaptcha_token?: string;
}

interface SignupData {
  name: string;
  email: string;
  password: string;
  recaptcha_token?: string;
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
    usersignup: builder.mutation<any, SignupData>({
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
      providesTags: ["Profile"],
    }),
    getUserWallet: builder.query<any, void | Record<string, never>>({
      query: () => ({
        url: `${PROFILE_URL}/wallet`,
        method: "GET",
      }),
      providesTags: ["Wallet"],
    }),
    getUserWalletDetails: builder.query<any, void | Record<string, never>>({
      query: () => ({
        url: `${PROFILE_URL}/wallet/details`,
        method: "GET",
      }),
      providesTags: ["Wallet", "Booking"],
    }),
    getUserWalletLedger: builder.query<any, void | Record<string, never>>({
      query: () => ({
        url: `${PROFILE_URL}/wallet/ledger`,
        method: "GET",
      }),
      providesTags: ["Wallet"],
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
    uploadFile: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: FILE_URL,
        method: "POST",
        body: formData,
      }),
    }),
    }),
 overrideExisting:true
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
  useGetUserWalletQuery,
  useGetUserWalletDetailsQuery,
  useGetUserWalletLedgerQuery,
  useUpdateProfileMutation,
  useUpdateEmailMutation,
  useUpdatePasswordMutation,
  useDeleteProfileMutation,
  useFollowEventCreatorMutation,
  useUploadFileMutation,
  
} = userApiSlice;
