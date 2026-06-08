import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import ProfileFoundationScreen from "@/app/components/profile/ProfileFoundationScreen";
import { useGetMyNewEventsQuery } from "@/redux/api/newEventsApiSlice";

export default function OrganizerEventsFoundationScreen() {
  const router = useRouter();
  const { data, isLoading, isFetching } = useGetMyNewEventsQuery({
    page: 1,
    size: 9,
    sortBy: "updated_at",
    sortDirection: "desc",
  });

  const events = Array.isArray(data?.body?.result) ? data.body.result : [];
  const totalItems = data?.body?.totalItems || events.length || 0;
  const published = events.filter((event: any) => event?.published).length;
  const drafts = events.filter((event: any) => !event?.published).length;

  return (
    <ProfileFoundationScreen
      isLoading={isLoading || isFetching}
      title="Manage events"
      subtitle="Organizer workspace"
      stats={[
        { label: "Total", value: totalItems },
        { label: "Published", value: published },
        { label: "Drafts", value: drafts },
      ]}
    >
      <View className="bg-[#1A2432] rounded-lg p-4">
        <Text className="text-white text-lg font-semibold">Event library</Text>
        <Text className="text-gray-400 mt-2">
          The full mobile organizer library will use this route and the
          /new-events/me contract.
        </Text>
        <View className="flex-row gap-3 mt-4">
          <TouchableOpacity
            className="bg-primary rounded-lg px-4 py-3 flex-row items-center"
            onPress={() => router.push("/create")}
          >
            <Plus size={18} color="#020e1e" />
            <Text className="text-background font-semibold ml-2">Create</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-background rounded-lg px-4 py-3"
            onPress={() => router.push("/profile/myevents")}
          >
            <Text className="text-white font-semibold">Open old view</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ProfileFoundationScreen>
  );
}
