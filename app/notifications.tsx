import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Bell,
  CheckCheck,
  ExternalLink,
  Inbox,
  Trash2,
} from "lucide-react-native";
import { useSelector } from "react-redux";
import * as WebBrowser from "expo-web-browser";

import { appConfig } from "@/config/env";
import {
  NotificationItem,
  useArchiveNotificationMutation,
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/redux/api/notificationApiSlice";
import type { RootState } from "@/redux/store";

function relativeTime(value?: string | null) {
  if (!value) return "";

  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "";

  const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function absoluteWebUrl(link: string) {
  if (/^https?:\/\//i.test(link)) return link;
  const base = appConfig.webUrl.replace(/\/+$/, "");
  const path = link.startsWith("/") ? link : `/${link}`;
  return `${base}${path}`;
}

function mapNotificationLink(link?: string | null) {
  if (!link) return null;

  let path = link;
  try {
    path = new URL(link).pathname;
  } catch {
    path = link.split("?")[0];
  }

  const eventMatch = path.match(
    /^\/(?:upcoming-events\/eventDetails|tickets)\/([^/]+)/
  );
  if (eventMatch) return `/(tabs)/home/event/${eventMatch[1]}`;

  const checkInMatch = path.match(/^\/profile\/events\/check-in\/([^/]+)/);
  if (checkInMatch) return `/(tabs)/profile/events/${checkInMatch[1]}/check-in`;

  const participantsMatch = path.match(
    /^\/profile\/events\/event-participants\/([^/]+)/
  );
  if (participantsMatch) {
    return `/(tabs)/profile/events/${participantsMatch[1]}/participants`;
  }

  const previewMatch = path.match(
    /^\/profile\/events\/preview-event\/([^/]+)/
  );
  if (previewMatch) return `/(tabs)/profile/events/${previewMatch[1]}/preview`;

  const questionnaireMatch = path.match(
    /^\/profile\/events\/questionnaire-responses\/([^/]+)/
  );
  if (questionnaireMatch) {
    return `/(tabs)/profile/events/${questionnaireMatch[1]}/questionnaire-responses`;
  }

  if (path.startsWith("/profile/bookings")) return "/(tabs)/profile/bookings";
  if (path.startsWith("/profile/bookmark")) return "/(tabs)/profile/bookmarks";
  if (path.startsWith("/profile/events")) return "/(tabs)/profile/events";
  if (path.startsWith("/profile/revenue/ledger")) {
    return "/(tabs)/profile/revenue/ledger";
  }
  if (path.startsWith("/profile/revenue")) return "/(tabs)/profile/revenue";
  if (path === "/profile" || path === "/dashboard") return "/(tabs)/profile";
  if (path.startsWith("/ticket-exchange")) return "/ticket-exchange";
  if (path.startsWith("/sell-tickets")) return "/sell-tickets";
  if (path.startsWith("/new-create/ai")) return "/(tabs)/create/ai";
  if (path.startsWith("/new-create")) return "/(tabs)/create";

  return null;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const accessToken = useSelector(
    (state: RootState) => state.auth.userInfo?.accessToken
  );

  const {
    data,
    isLoading,
    isFetching,
    refetch: refetchNotifications,
  } = useGetNotificationsQuery(
    { page: 1, size: 30 },
    { skip: !accessToken }
  );
  const { data: unreadData, refetch: refetchUnread } =
    useGetUnreadNotificationCountQuery(undefined, { skip: !accessToken });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] =
    useMarkAllNotificationsReadMutation();
  const [archiveNotification] = useArchiveNotificationMutation();

  const notifications = useMemo(() => {
    const result = data?.body?.result;
    return Array.isArray(result) ? result : [];
  }, [data]);

  const unreadCount =
    Number(unreadData?.body?.count || 0) ||
    notifications.filter((notification) => !notification.read_at).length;

  const refresh = async () => {
    await Promise.all([refetchNotifications(), refetchUnread()]);
  };

  const openNotification = async (notification: NotificationItem) => {
    if (!notification.read_at) {
      try {
        await markRead(notification.id).unwrap();
      } catch {
        //
      }
    }

    if (!notification.link) return;

    const mobilePath = mapNotificationLink(notification.link);
    if (mobilePath) {
      router.push(mobilePath as any);
      return;
    }

    await WebBrowser.openBrowserAsync(absoluteWebUrl(notification.link));
  };

  const markAll = async () => {
    try {
      await markAllRead(undefined).unwrap();
    } catch {
      //
    }
  };

  const archive = async (notification: NotificationItem) => {
    try {
      await archiveNotification(notification.id).unwrap();
    } catch {
      //
    }
  };

  if (!accessToken) {
    return (
      <View className="flex-1 bg-background px-4 pt-12">
        <TouchableOpacity
          className="bg-[#1A2432] h-10 w-10 rounded-full items-center justify-center"
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft color="white" size={22} />
        </TouchableOpacity>

        <View className="flex-1 items-center justify-center">
          <Inbox color="#9EDD45" size={42} />
          <Text className="text-white text-xl font-bold mt-4">
            Sign in for updates
          </Text>
          <Text className="text-gray-400 text-center mt-2">
            Event, ticket, booking, and account updates will appear here.
          </Text>
          <TouchableOpacity
            className="bg-primary rounded-lg px-6 py-3 mt-6"
            onPress={() => router.push("/(auth)/login" as any)}
          >
            <Text className="text-background font-bold">Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-12 pb-4 border-b border-[#1A2432]">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity
              className="bg-[#1A2432] h-10 w-10 rounded-full items-center justify-center mr-3"
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft color="white" size={22} />
            </TouchableOpacity>
            <View>
              <Text className="text-white text-xl font-bold">
                Notifications
              </Text>
              <Text className="text-gray-400 text-xs mt-1">
                {unreadCount > 0
                  ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`
                  : "All caught up"}
              </Text>
            </View>
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity
              className="bg-[#1A2432] rounded-lg px-3 py-2 flex-row items-center"
              onPress={markAll}
              disabled={isMarkingAll}
              accessibilityRole="button"
              accessibilityLabel="Mark all notifications as read"
            >
              <CheckCheck color="#9EDD45" size={18} />
              <Text className="text-primary text-sm font-semibold ml-2">
                Read all
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#9EDD45" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refresh}
              tintColor="#9EDD45"
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Inbox color="#6B7280" size={42} />
              <Text className="text-white text-lg font-bold mt-4">
                No notifications yet
              </Text>
              <Text className="text-gray-400 text-center mt-2">
                Event, ticket, and security updates will appear here.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const unread = !item.read_at;

            return (
              <TouchableOpacity
                className={`rounded-lg p-4 mb-3 border ${
                  unread
                    ? "bg-[#142518] border-primary/50"
                    : "bg-[#1A2432] border-[#2A3647]"
                }`}
                onPress={() => openNotification(item)}
                accessibilityRole="button"
              >
                <View className="flex-row">
                  <View
                    className={`h-10 w-10 rounded-full items-center justify-center mr-3 ${
                      unread ? "bg-primary" : "bg-[#2A3647]"
                    }`}
                  >
                    <Bell
                      color={unread ? "#020E1E" : "#9EDD45"}
                      size={18}
                    />
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-start justify-between">
                      <Text className="text-white font-bold flex-1 pr-2">
                        {item.title}
                      </Text>
                      <Text className="text-gray-500 text-xs">
                        {relativeTime(item.created_at)}
                      </Text>
                    </View>

                    {!!item.body && (
                      <Text className="text-gray-400 text-sm mt-1 leading-5">
                        {item.body}
                      </Text>
                    )}

                    <View className="flex-row items-center justify-between mt-3">
                      <View className="flex-row items-center">
                        {!!item.action_label && (
                          <>
                            <Text className="text-primary text-xs font-bold">
                              {item.action_label}
                            </Text>
                            <ExternalLink
                              color="#9EDD45"
                              size={12}
                              style={{ marginLeft: 4 }}
                            />
                          </>
                        )}
                        {unread && (
                          <View className="h-2 w-2 rounded-full bg-primary ml-2" />
                        )}
                      </View>

                      <TouchableOpacity
                        className="h-9 w-9 rounded-full bg-[#2A3647] items-center justify-center"
                        onPress={() => archive(item)}
                        accessibilityRole="button"
                        accessibilityLabel="Archive notification"
                      >
                        <Trash2 color="#9CA3AF" size={16} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}
