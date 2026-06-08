import React from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import ProfileFoundationScreen from "@/app/components/profile/ProfileFoundationScreen";
import { useGetNewEventQuery } from "@/redux/api/newEventsApiSlice";
import { getStringParam } from "@/utils/routeParams";

export default function OrganizerEventPreviewFoundationScreen() {
  const { id } = useLocalSearchParams();
  const eventId = getStringParam(id);
  const { data, isLoading, isFetching } = useGetNewEventQuery(eventId, {
    skip: !eventId,
  });
  const event = data?.body;

  return (
    <ProfileFoundationScreen
      isLoading={isLoading || isFetching}
      title="Event preview"
      subtitle={event?.title || "Organizer workspace"}
      stats={[
        { label: "Sessions", value: event?.sessions?.length || 0 },
        { label: "Tickets", value: event?.tickets?.length || 0 },
        { label: "Status", value: event?.published ? "Live" : "Draft" },
      ]}
    >
      <View className="bg-[#1A2432] rounded-lg p-4">
        <Text className="text-white text-lg font-semibold">
          {event?.title || "Preview route ready"}
        </Text>
        <Text className="text-gray-400 mt-2">
          This route is wired to /new-events/:id for the full organizer preview.
        </Text>
      </View>
    </ProfileFoundationScreen>
  );
}
