import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Bell } from "lucide-react-native";
import { useSelector } from "react-redux";

import { useGetUnreadNotificationCountQuery } from "@/redux/api/notificationApiSlice";
import type { RootState } from "@/redux/store";

type NotificationBellButtonProps = {
  className?: string;
  iconColor?: string;
  size?: number;
};

export default function NotificationBellButton({
  className = "p-2",
  iconColor = "#fff",
  size = 24,
}: NotificationBellButtonProps) {
  const router = useRouter();
  const accessToken = useSelector(
    (state: RootState) => state.auth.userInfo?.accessToken
  );

  const { data } = useGetUnreadNotificationCountQuery(undefined, {
    skip: !accessToken,
    pollingInterval: accessToken ? 60000 : 0,
  });

  const unreadCount = Number(data?.body?.count || 0);

  return (
    <TouchableOpacity
      className={className}
      onPress={() =>
        router.push(accessToken ? ("/notifications" as any) : ("/(auth)/login" as any))
      }
      accessibilityRole="button"
      accessibilityLabel="Notifications"
    >
      <View>
        <Bell color={iconColor} size={size} />
        {unreadCount > 0 && (
          <View className="absolute -right-2 -top-2 min-w-[18px] h-[18px] rounded-full bg-primary items-center justify-center px-1 border border-background">
            <Text className="text-background text-[10px] font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
