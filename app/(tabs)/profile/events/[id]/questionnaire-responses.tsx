import React from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import ProfileFoundationScreen from "@/app/components/profile/ProfileFoundationScreen";
import { useGetQuestionnaireResponsesQuery } from "@/redux/api/questionnaireApiSlice";
import { getStringParam } from "@/utils/routeParams";

export default function QuestionnaireResponsesFoundationScreen() {
  const { id } = useLocalSearchParams();
  const eventId = getStringParam(id);
  const { data, isLoading, isFetching } = useGetQuestionnaireResponsesQuery(eventId, {
    skip: !eventId,
  });
  const analytics = data?.body?.analytics;

  return (
    <ProfileFoundationScreen
      isLoading={isLoading || isFetching}
      title="Response analytics"
      subtitle={data?.body?.event?.title || "Questionnaire responses"}
      stats={[
        { label: "Invites", value: analytics?.totalInvites || 0 },
        { label: "Submitted", value: analytics?.totalResponses || 0 },
        { label: "Pending", value: analytics?.pendingResponses || 0 },
        { label: "Completion", value: `${analytics?.completionRate || 0}%` },
      ]}
    >
      <View className="bg-[#1A2432] rounded-lg p-4">
        <Text className="text-white text-lg font-semibold">
          Questionnaire responses route ready
        </Text>
        <Text className="text-gray-400 mt-2">
          This route is wired to /questionnaire/event/:eventId/responses.
        </Text>
      </View>
    </ProfileFoundationScreen>
  );
}
