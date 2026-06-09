import React, { useMemo, useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Calendar,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Mail,
  Search,
  ScanLine,
  Ticket,
  User,
} from "lucide-react-native";
import ProfileFoundationScreen from "@/app/components/profile/ProfileFoundationScreen";
import { useGetMyEventBookingsQuery } from "@/redux/api/eventsApiSlice";
import { getStringParam } from "@/utils/routeParams";
import { formatDate } from "@/utils/formatDate";

const PAGE_SIZE = 12;
type QuestionnaireFilter = "ALL" | "DUE" | "SUBMITTED";

const getQuestionnaireState = (participant: any) => {
  const items = Array.isArray(participant.questionnaire) ? participant.questionnaire : [];
  const item = items.find((entry: any) => !entry.completed) || items[0];
  const pending = Boolean(participant.questionnairePending || (item?.id && !item?.completed));
  const submitted = Boolean(item?.completed || item?.submittedAt);
  return { item, pending, submitted };
};

export default function EventParticipantsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const eventId = getStringParam(id);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "COMPLETED" | "PENDING">("ALL");
  const [questionnaireFilter, setQuestionnaireFilter] = useState<QuestionnaireFilter>("ALL");

  const query = useMemo(
    () => ({
      id: eventId,
      page,
      search,
      size: PAGE_SIZE,
      sortBy: "created_at",
      sortDirection,
    }),
    [eventId, page, search, sortDirection]
  );

  const { data, isLoading, isFetching } = useGetMyEventBookingsQuery(query, {
    skip: !eventId,
  });
  const body = data?.body || {};
  const allParticipants = useMemo(
    () => (Array.isArray(body.result) ? body.result : []),
    [body.result]
  );
  const emailCounts = useMemo(() => {
    const counts = new Map<string, number>();
    allParticipants.forEach((participant: any) => {
      const email = String(participant.email || "").trim().toLowerCase();
      if (email) counts.set(email, (counts.get(email) || 0) + 1);
    });
    return counts;
  }, [allParticipants]);
  const participants = allParticipants.filter((participant: any) => {
    const status = String(participant.status || "").toUpperCase();
    if (statusFilter === "COMPLETED" && status !== "COMPLETED") return false;
    if (statusFilter === "PENDING" && status === "COMPLETED") return false;
    const questionnaire = getQuestionnaireState(participant);
    if (questionnaireFilter === "DUE") return questionnaire.pending;
    if (questionnaireFilter === "SUBMITTED") return questionnaire.submitted;
    return true;
  });
  const totalItems = Number(body.totalItems || participants.length || 0);
  const totalPages = Math.max(1, Number(body.totalPages || 1));
  const completed = allParticipants.filter((item: any) => String(item.status || "").toUpperCase() === "COMPLETED").length;
  const formsDue = allParticipants.filter((item: any) => getQuestionnaireState(item).pending).length;
  const repeatAttendees = [...emailCounts.values()].filter((count) => count > 1).length;

  return (
    <ProfileFoundationScreen
      isLoading={isLoading}
      title="Event participants"
      subtitle="Orders, attendees, ticket status, and booking codes."
      stats={[
        { label: "This page", value: participants.length },
        { label: "Completed", value: completed },
        { label: "Forms due", value: formsDue },
        { label: "Repeat", value: repeatAttendees },
        { label: "Total", value: totalItems },
      ]}
    >
      <View className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden">
        <View className="p-4 border-b border-[#243044]">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-white text-xl font-semibold">Participant library</Text>
              <Text className="text-gray-400 mt-1">Search attendees by name, email, ticket, or booking code.</Text>
            </View>
            <TouchableOpacity
              className="bg-primary rounded-xl px-4 py-3 flex-row items-center"
              onPress={() => router.push(`/profile/events/${eventId}/check-in` as any)}
            >
              <ScanLine color="#020817" size={16} />
              <Text className="text-background font-bold ml-2">Check-in</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row items-center bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-3 mt-4">
            <Search color="#8B6BFF" size={18} />
            <TextInput
              className="flex-1 text-white py-3 ml-2"
              placeholder="Search participants"
              placeholderTextColor="#728097"
              value={search}
              onChangeText={(value) => {
                setPage(1);
                setSearch(value);
              }}
            />
          </View>
          <View className="flex-row flex-wrap gap-2 mt-3">
            {(["ALL", "COMPLETED", "PENDING"] as const).map((status) => (
              <TouchableOpacity
                key={status}
                className={`rounded-full px-4 py-2 border ${
                  statusFilter === status ? "bg-primary border-primary" : "border-[#2E3A4D]"
                }`}
                onPress={() => {
                  setPage(1);
                  setStatusFilter(status);
                }}
              >
                <Text className={statusFilter === status ? "text-background font-bold" : "text-gray-300 font-semibold"}>
                  {status === "ALL" ? "All" : status === "COMPLETED" ? "Completed" : "Pending"}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              className="bg-[#1A2432] border border-[#2E3A4D] rounded-full px-4 py-2"
              onPress={() => {
                setPage(1);
                setSortDirection((current) => (current === "desc" ? "asc" : "desc"));
              }}
            >
              <Text className="text-white font-semibold">
                {sortDirection === "desc" ? "Newest first" : "Oldest first"}
              </Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row flex-wrap gap-2 mt-3">
            {(["ALL", "DUE", "SUBMITTED"] as const).map((status) => (
              <TouchableOpacity
                key={status}
                className={`rounded-full px-4 py-2 border ${
                  questionnaireFilter === status ? "bg-[#8B6BFF] border-[#8B6BFF]" : "border-[#2E3A4D]"
                }`}
                onPress={() => {
                  setPage(1);
                  setQuestionnaireFilter(status);
                }}
              >
                <Text className={questionnaireFilter === status ? "text-white font-bold" : "text-gray-300 font-semibold"}>
                  {status === "ALL" ? "All forms" : status === "DUE" ? "Forms due" : "Forms submitted"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {isFetching && !isLoading ? (
          <View className="py-3">
            <ActivityIndicator color="#9EDD45" />
          </View>
        ) : null}

        {participants.length ? (
          participants.map((participant: any, index: number) => {
            const questionnaire = getQuestionnaireState(participant);
            const email = String(participant.email || "").trim().toLowerCase();
            const isRepeat = email ? (emailCounts.get(email) || 0) > 1 : false;

            return (
              <View key={`${participant.id}-${index}`} className="p-4 border-b border-[#243044]">
                <View className="flex-row items-start">
                  <View className="w-12 h-12 rounded-xl bg-[#8B6BFF]/20 items-center justify-center">
                    <User color="#A993FF" size={22} />
                  </View>
                  <View className="ml-3 flex-1">
                    <View className="flex-row justify-between">
                      <Text className="text-white text-lg font-semibold flex-1 pr-2">
                        {participant.fullname || participant.name || "Unnamed attendee"}
                      </Text>
                      <View className="bg-primary/20 rounded-full px-3 py-1">
                        <Text className="text-primary text-xs font-bold">
                          {participant.status || "Booked"}
                        </Text>
                      </View>
                    </View>
                    <Info icon={<Mail color="#728097" size={15} />} text={participant.email || "No email"} />
                    <Info icon={<Ticket color="#728097" size={15} />} text={`${participant.ticket?.name || participant.ticket_name || "Ticket"} · ${participant.code || participant.booking_code || "No code"}`} />
                    <Info icon={<Calendar color="#728097" size={15} />} text={`Booked ${formatDate(participant.created_at)}`} />
                    <View className="flex-row flex-wrap gap-2 mt-3">
                      {questionnaire.item?.id ? (
                        <View
                          className={
                            questionnaire.submitted
                              ? "bg-primary/15 rounded-full px-3 py-1 flex-row items-center"
                              : "bg-amber-500/15 rounded-full px-3 py-1 flex-row items-center"
                          }
                        >
                          <ClipboardList
                            color={questionnaire.submitted ? "#9EDD45" : "#FBBF24"}
                            size={13}
                          />
                          <Text
                            className={
                              questionnaire.submitted
                                ? "text-primary text-xs font-semibold ml-1"
                                : "text-amber-300 text-xs font-semibold ml-1"
                            }
                          >
                            {questionnaire.submitted ? "Form submitted" : "Form due"}
                          </Text>
                        </View>
                      ) : null}
                      {isRepeat ? (
                        <View className="bg-[#8B6BFF]/20 rounded-full px-3 py-1">
                          <Text className="text-[#A993FF] text-xs font-semibold">Repeat attendee</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View className="p-8 items-center">
            <UsersIcon />
            <Text className="text-white text-lg font-semibold mt-3">No participants found</Text>
            <Text className="text-gray-400 text-center mt-1">
              Bookings will appear here as attendees reserve tickets.
            </Text>
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

function Info({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View className="flex-row items-center mt-2">
      {icon}
      <Text className="text-gray-400 ml-2 flex-1">{text}</Text>
    </View>
  );
}

function UsersIcon() {
  return (
    <View className="w-14 h-14 rounded-2xl bg-[#8B6BFF]/20 items-center justify-center">
      <User color="#A993FF" size={28} />
    </View>
  );
}
