import { compactParams } from "@/utils/api";
import { apiSlice } from "./apiSlice";

export type NotificationItem = {
  id: number;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  action_label?: string | null;
  entity_type?: string | null;
  entity_id?: number | null;
  priority?: "low" | "normal" | "high" | "critical";
  read_at?: string | null;
  created_at: string;
  metadata?: Record<string, unknown> | null;
};

type ApiEnvelope<T> = {
  error?: number;
  body?: T;
  message?: string;
};

type NotificationListParams = {
  page?: number;
  size?: number;
  unreadOnly?: boolean;
};

type NotificationListBody = {
  result?: NotificationItem[];
  total?: number;
  page?: number;
  size?: number;
};

type UnreadCountBody = {
  count?: number;
};

export const notificationApiSlice = apiSlice.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    getNotifications: builder.query<
      ApiEnvelope<NotificationListBody>,
      NotificationListParams | void
    >({
      query: (params) => {
        const safeParams = params || {};

        return {
          url: "/notifications",
          params: compactParams({
            page: safeParams.page ?? 1,
            size: safeParams.size ?? 20,
            unread_only: safeParams.unreadOnly ? "true" : undefined,
          }),
        };
      },
      providesTags: ["Notifications"],
    }),
    getUnreadNotificationCount: builder.query<
      ApiEnvelope<UnreadCountBody>,
      void
    >({
      query: () => ({
        url: "/notifications/unread-count",
      }),
      providesTags: ["Notifications"],
    }),
    markNotificationRead: builder.mutation<
      ApiEnvelope<NotificationItem>,
      number
    >({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notifications"],
    }),
    markAllNotificationsRead: builder.mutation<ApiEnvelope<unknown>, void>({
      query: () => ({
        url: "/notifications/read-all",
        method: "PATCH",
      }),
      invalidatesTags: ["Notifications"],
    }),
    archiveNotification: builder.mutation<ApiEnvelope<unknown>, number>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useArchiveNotificationMutation,
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} = notificationApiSlice;
