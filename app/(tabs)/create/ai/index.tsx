import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Wand2 } from "lucide-react-native";
import ProfileFoundationScreen from "@/app/components/profile/ProfileFoundationScreen";
import { useGetAiEventBuilderStatusQuery } from "@/redux/api/newEventsApiSlice";

export default function AiCreateFoundationScreen() {
  const router = useRouter();
  const { data, isLoading, isFetching } = useGetAiEventBuilderStatusQuery();
  const status = data?.body;

  return (
    <ProfileFoundationScreen
      isLoading={isLoading || isFetching}
      title="Create with AI"
      subtitle={status?.ready ? "AI builder ready" : "AI builder status"}
      stats={[
        { label: "Ready", value: status?.ready ? "Yes" : "No" },
        { label: "Model", value: status?.model || "Not set" },
        { label: "API key", value: status?.hasApiKey ? "Ready" : "Missing" },
      ]}
    >
      <View className="bg-[#1A2432] rounded-lg p-4">
        <View className="flex-row items-center">
          <Wand2 color="#9EDD45" size={22} />
          <Text className="text-white text-lg font-semibold ml-2">
            AI brief route ready
          </Text>
        </View>
        <Text className="text-gray-400 mt-2">
          {status?.ready
            ? "Next phase builds the mobile AI brief and review flow here."
            : status?.comingSoonMessage || "Manual event creation is still available."}
        </Text>
        <TouchableOpacity
          className="bg-primary rounded-lg px-4 py-3 mt-4"
          onPress={() => router.push("/create")}
        >
          <Text className="text-background text-center font-semibold">
            Manual builder
          </Text>
        </TouchableOpacity>
      </View>
    </ProfileFoundationScreen>
  );
}
