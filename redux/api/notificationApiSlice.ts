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

export type DeliveryRecipient = {
  bookingIds: number[];
  reason?: string;
  recipient: string;
  status: "queued" | "sent" | "skipped" | "failed" | string;
};

export type DeliveryChannelSummary = {
  failed: number;
  providerConfigured?: boolean;
  queued: number;
  recipients: DeliveryRecipient[];
  sent: number;
  skipped: number;
  skippedReason?: string;
};

export type NotificationDeliverySummary = {
  email: DeliveryChannelSummary;
  receiveUpdatesFalseCount: number;
  sms: DeliveryChannelSummary;
  totalBookings: number;
  uniqueEmailRecipients: number;
  uniqueSmsRecipients: number;
};

export type NotificationDeliveryChange = {
  after?: unknown;
  before?: unknown;
  field: string;
  label: string;
};

export type NotificationDeliveryBatch = {
  auditId: number;
  canRetry: boolean;
  changes: NotificationDeliveryChange[];
  created_at: string;
  delivery: NotificationDeliverySummary;
  event: {
    id: number;
    title: string;
    user_id?: number | null;
  };
  initialDelivery: NotificationDeliverySummary;
  retryCount: number;
  retryable: {
    emailBookingCount: number;
    smsBookingCount: number;
  };
  status: "failed" | "queued" | "sent" | "skipped" | "pending" | string;
  summary: string;
};

export type NotificationDeliveryMetrics = {
  batches: number;
  emailFailed: number;
  emailQueued: number;
  emailSent: number;
  emailSkipped: number;
  events: number;
  retryableBatches: number;
  smsFailed: number;
  smsSent: number;
  smsSkipped: number;
  totalBookings: number;
  uniqueEmailRecipients: number;
  uniqueSmsRecipients: number;
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

type NotificationDeliveryParams = {
  event_id?: number | string;
  page?: number;
  range?: string;
  search?: string;
  size?: number;
};

type NotificationDeliveryBody = {
  generated_at: string;
  metrics: NotificationDeliveryMetrics;
  pagination: {
    currentPage: number;
    totalItems: number;
    totalPages: number;
  };
  range: {
    days: number;
    label: string;
    start?: string | null;
    value: string;
  };
  result: NotificationDeliveryBatch[];
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
    getNotificationDelivery: builder.query<
      ApiEnvelope<NotificationDeliveryBody>,
      NotificationDeliveryParams | void
    >({
      query: (params) => {
        const safeParams = params || {};

        return {
          url: "/notifications/delivery",
          params: compactParams({
            page: safeParams.page ?? 1,
            range: safeParams.range ?? "30d",
            search: safeParams.search,
            size: safeParams.size ?? 12,
            event_id: safeParams.event_id,
          }),
        };
      },
      providesTags: ["Notifications"],
    }),
    retryNotificationDelivery: builder.mutation<
      ApiEnvelope<{ auditId: number; retry: Record<string, unknown> }>,
      { auditId: number; channels?: Array<"email" | "sms"> }
    >({
      query: ({ auditId, channels }) => ({
        body: channels ? { channels } : {},
        method: "POST",
        url: `/notifications/delivery/${auditId}/retry`,
      }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useArchiveNotificationMutation,
  useGetNotificationDeliveryQuery,
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useRetryNotificationDeliveryMutation,
} = notificationApiSlice;
