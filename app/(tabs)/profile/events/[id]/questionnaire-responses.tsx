import React, { useMemo, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  HelpCircle,
  Mail,
  Search,
  Ticket,
} from "lucide-react-native";
import ProfileFoundationScreen from "@/app/components/profile/ProfileFoundationScreen";
import { useGetQuestionnaireResponsesQuery } from "@/redux/api/questionnaireApiSlice";
import { getStringParam } from "@/utils/routeParams";
import { formatDate } from "@/utils/formatDate";
import type {
  QuestionnaireAnswerRow,
  QuestionnaireQuestionInsight,
} from "@/types/questionnaire";

const PAGE_SIZE = 8;
type ResponseFilter = "ALL" | "SUBMITTED" | "PENDING";

export default function QuestionnaireResponsesScreen() {
  const { id } = useLocalSearchParams();
  const eventId = getStringParam(id);
  const [filter, setFilter] = useState<ResponseFilter>("ALL");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading, isFetching } = useGetQuestionnaireResponsesQuery(eventId, {
    skip: !eventId,
  });
  const body = data?.body;
  const analytics = body?.analytics;
  const responses = useMemo(() => body?.responses || [], [body?.responses]);
  const questions = analytics?.questions || [];
  const filteredResponses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return responses.filter((response) => {
      const status = String(response.status || "PENDING").toUpperCase();
      if (filter !== "ALL" && status !== filter) return false;
      if (!query) return true;
      const answerText = Object.values(response.answers || {})
        .map((value) => (Array.isArray(value) ? value.join(" ") : String(value ?? "")))
        .join(" ")
        .toLowerCase();
      return [
        response.user?.name,
        response.user?.email,
        response.ticket?.name,
        status,
        answerText,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [filter, responses, search]);
  const totalPages = Math.max(1, Math.ceil(filteredResponses.length / PAGE_SIZE));
  const pagedResponses = filteredResponses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <ProfileFoundationScreen
      isLoading={isLoading || isFetching}
      title="Response analytics"
      subtitle={body?.event?.title || "Questionnaire responses"}
      stats={[
        { label: "Invites", value: analytics?.totalInvites || 0 },
        { label: "Submitted", value: analytics?.totalResponses || 0 },
        { label: "Pending", value: analytics?.pendingResponses || 0 },
        { label: "Completion", value: `${analytics?.completionRate || 0}%` },
      ]}
    >
      <View className="bg-[#111823] border border-[#243044] rounded-2xl p-4 mb-4">
        <View className="flex-row items-center">
          <BarChart3 color="#8B6BFF" size={22} />
          <Text className="text-white text-xl font-semibold ml-2">Question insights</Text>
        </View>
        <Text className="text-gray-400 mt-1 mb-4">
          Completion, top answers, and per-question signal for this event.
        </Text>

        {questions.length ? (
          questions.map((question) => <QuestionInsight key={question.id} question={question} />)
        ) : (
          <EmptyText text="No questionnaire answers have been submitted yet." />
        )}
      </View>

      <View className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden">
        <View className="p-4 border-b border-[#243044]">
          <Text className="text-white text-xl font-semibold">Response library</Text>
          <Text className="text-gray-400 mt-1">
            {filteredResponses.length} response row{filteredResponses.length === 1 ? "" : "s"} found.
          </Text>
          <View className="flex-row items-center bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-3 mt-4">
            <Search color="#8B6BFF" size={18} />
            <TextInput
              className="flex-1 text-white py-3 ml-2"
              placeholder="Search attendee, ticket, status, or answer"
              placeholderTextColor="#728097"
              value={search}
              onChangeText={(value) => {
                setPage(1);
                setSearch(value);
              }}
            />
          </View>
          <View className="flex-row flex-wrap gap-2 mt-3">
            {(["ALL", "SUBMITTED", "PENDING"] as const).map((status) => (
              <TouchableOpacity
                key={status}
                className={`rounded-full px-4 py-2 border ${
                  filter === status ? "bg-primary border-primary" : "border-[#2E3A4D]"
                }`}
                onPress={() => {
                  setPage(1);
                  setFilter(status);
                }}
              >
                <Text className={filter === status ? "text-background font-bold" : "text-gray-300 font-semibold"}>
                  {status === "ALL" ? "All" : status === "SUBMITTED" ? "Submitted" : "Pending"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {pagedResponses.length ? (
          pagedResponses.map((response) => <ResponseRow key={response.id} response={response} />)
        ) : (
          <View className="p-8">
            <EmptyText text="Responses will appear here after attendees submit their questionnaire." />
          </View>
        )}

        <View className="flex-row items-center justify-between p-4">
          <TouchableOpacity
            className="bg-[#1A2432] rounded-xl px-4 py-3 flex-row items-center disabled:opacity-40"
            disabled={page <= 1}
            onPress={() => setPage((current) => Math.max(1, current - 1))}
          >
            <ChevronLeft color="#E5E7EB" size={17} />
            <Text className="text-white ml-1">Previous</Text>
          </TouchableOpacity>
          <Text className="text-gray-300">Page {page} of {totalPages}</Text>
          <TouchableOpacity
            className="bg-[#1A2432] rounded-xl px-4 py-3 flex-row items-center disabled:opacity-40"
            disabled={page >= totalPages}
            onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            <Text className="text-white mr-1">Next</Text>
            <ChevronRight color="#E5E7EB" size={17} />
          </TouchableOpacity>
        </View>
      </View>
    </ProfileFoundationScreen>
  );
}

function QuestionInsight({ question }: { question: QuestionnaireQuestionInsight }) {
  const topAnswers = question.topAnswers || [];
  return (
    <View className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-4 mb-3">
      <View className="flex-row items-start">
        <HelpCircle color="#8B6BFF" size={18} />
        <View className="ml-3 flex-1">
          <Text className="text-white font-semibold">{question.label || "Question"}</Text>
          <Text className="text-gray-400 mt-1">
            {question.totalAnswers || 0} answers · {question.responseRate || 0}% response rate
          </Text>
        </View>
      </View>

      {question.numericSummary ? (
        <View className="flex-row gap-2 mt-3">
          <MiniMetric label="Average" value={question.numericSummary.average} />
          <MiniMetric label="Low" value={question.numericSummary.min} />
          <MiniMetric label="High" value={question.numericSummary.max} />
        </View>
      ) : null}

      {topAnswers.length ? (
        <View className="mt-3">
          {topAnswers.slice(0, 3).map((answer) => (
            <View key={`${question.id}-${answer.value}`} className="mb-2">
              <View className="flex-row justify-between mb-1">
                <Text className="text-gray-200 flex-1 pr-2">{answer.value || "No answer"}</Text>
                <Text className="text-gray-400">{answer.percentage}%</Text>
              </View>
              <View className="h-2 bg-[#0B1020] rounded-full overflow-hidden">
                <View
                  className="h-2 bg-primary rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, answer.percentage || 0))}%` }}
                />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text className="text-gray-500 mt-3">No answer breakdown yet.</Text>
      )}
    </View>
  );
}

function ResponseRow({ response }: { response: QuestionnaireAnswerRow }) {
  const answered = `${response.answeredCount || 0}/${response.totalQuestions || 0}`;
  const answerEntries = Object.entries(response.answers || {}).slice(0, 3);
  const submitted = response.status === "SUBMITTED";

  return (
    <View className="p-4 border-b border-[#243044]">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-white text-lg font-semibold">
            {response.user?.name || "Attendee"}
          </Text>
          <Info icon={<Mail color="#728097" size={15} />} text={response.user?.email || "No email"} />
          <Info icon={<Ticket color="#728097" size={15} />} text={`${response.ticket?.name || "Ticket"} · ${answered} answered`} />
          <Info icon={<Clock color="#728097" size={15} />} text={response.submittedAt ? formatDate(response.submittedAt) : "Not submitted"} />
        </View>
        <View className={submitted ? "bg-primary/20 rounded-full px-3 py-1" : "bg-[#8B6BFF]/20 rounded-full px-3 py-1"}>
          <Text className={submitted ? "text-primary text-xs font-bold" : "text-[#A993FF] text-xs font-bold"}>
            {response.status || "PENDING"}
          </Text>
        </View>
      </View>

      {answerEntries.length ? (
        <View className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-3 mt-3">
          {answerEntries.map(([key, value]) => (
            <Text key={key} className="text-gray-300 mb-1">
              <Text className="text-white font-semibold">{key}: </Text>
              {Array.isArray(value) ? value.join(", ") : String(value ?? "No answer")}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Info({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View className="flex-row items-center mt-2">
      {icon}
      <Text className="text-gray-400 ml-2 flex-1">{text}</Text>
    </View>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-1 bg-[#0B1020] rounded-xl p-3">
      <Text className="text-white font-semibold">{value}</Text>
      <Text className="text-gray-500 text-xs mt-1">{label}</Text>
    </View>
  );
}

function EmptyText({ text }: { text: string }) {
  return (
    <View className="items-center py-5">
      <CheckCircle2 color="#8B6BFF" size={28} />
      <Text className="text-gray-400 text-center mt-3">{text}</Text>
    </View>
  );
}
