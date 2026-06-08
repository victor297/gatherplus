import React from "react";
import { Text, View } from "react-native";
import ProfileFoundationScreen from "@/app/components/profile/ProfileFoundationScreen";

export default function AiReviewFoundationScreen() {
  return (
    <ProfileFoundationScreen title="Review AI draft" subtitle="AI event builder">
      <View className="bg-[#1A2432] rounded-lg p-4">
        <Text className="text-white text-lg font-semibold">
          AI draft review route ready
        </Text>
        <Text className="text-gray-400 mt-2">
          This route will review generated details, tickets, enhancements,
          quality, suggestions, and automation rules before importing into the
          manual builder.
        </Text>
      </View>
    </ProfileFoundationScreen>
  );
}
