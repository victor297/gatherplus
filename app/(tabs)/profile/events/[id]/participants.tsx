import React from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import ProfileFoundationScreen from "@/app/components/profile/ProfileFoundationScreen";
import { useGetMyEventBookingsQuery } from "@/redux/api/eventsApiSlice";
import { getStringParam } from "@/utils/routeParams";

export default function EventParticipantsFoundationScreen() {
  const { id } = useLocalSearchParams();
  const eventId = getStringParam(id);
  const { data, isLoading, isFetching } = useGetMyEventBookingsQuery(
    {
      id: eventId,
      page: 1,
      size: 10,
      sortBy: "created_at",
      sortDirection: "desc",
    },
    { skip: !eventId }
  );
  const body = data?.body || {};
  const participants = Array.isArray(body.result) ? body.result : [];

  return (
    <ProfileFoundationScreen
      isLoading={isLoading || isFetching}
      title="Event participants"
      subtitle="Participant library"
      stats={[
        { label: "On page", value: participants.length },
        { label: "Total", value: body.totalItems || participants.length },
        { label: "Pages", value: body.totalPages || 1 },
      ]}
    >
      <View className="bg-[#1A2432] rounded-lg p-4">
        <Text className="text-white text-lg font-semibold">
          Participant route ready
        </Text>
        <Text className="text-gray-400 mt-2">
          This route now calls event booking pagination with the Phase 1 query
          contract.
        </Text>
      </View>
    </ProfileFoundationScreen>
  );
}
