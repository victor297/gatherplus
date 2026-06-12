import React, { useMemo, useState } from "react";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  HelpCircle,
  Loader2,
  MessageSquare,
  Send,
  Ticket,
  Vote,
} from "lucide-react-native";
import {
  useGetAttendeeEngagementHubQuery,
  useSubmitEngagementQuestionMutation,
  useVoteEngagementPollMutation,
} from "@/redux/api/eventsApiSlice";
import { formatDate } from "@/utils/formatDate";
import { getStringParam } from "@/utils/routeParams";

const tabs = ["Updates", "Agenda", "Q&A", "Polls"] as const;
const getArray = (value: unknown) => (Array.isArray(value) ? value : []);
type PollType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "YES_NO" | "RATING" | "PERCENTAGE";

function getPollTypeLabel(type?: PollType | string, fallback?: string) {
  if (fallback) return fallback;
  if (type === "MULTIPLE_CHOICE") return "Multi-select";
  if (type === "YES_NO") return "Yes / No";
  if (type === "RATING") return "Rating";
  if (type === "PERCENTAGE") return "100% allocation";
  return "Single select";
}

export default function AttendeeEngagementScreen() {
  const router = useRouter();
  const { id, code } = useLocalSearchParams();
  const eventId = getStringParam(id);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Updates");
  const [bookingCode, setBookingCode] = useState(getStringParam(code));
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [selectedPollOptions, setSelectedPollOptions] = useState<Record<number, string[]>>({});
  const [pollAllocations, setPollAllocations] = useState<Record<number, Record<string, number>>>({});

  const { data, isFetching, isLoading, refetch } = useGetAttendeeEngagementHubQuery(
    { eventId, booking_code: bookingCode },
    {
      skip: !eventId,
      pollingInterval: 30000,
    }
  );
  const [submitQuestion, { isLoading: isSubmitting }] = useSubmitEngagementQuestionMutation();
  const [votePoll, { isLoading: isVoting }] = useVoteEngagementPollMutation();

  const body = data?.body || {};
  const event = body.event || {};
  const announcements = getArray(body.announcements);
  const sessions = getArray(event.sessions);
  const questions = getArray(body.questions);
  const polls = getArray(body.polls);
  const canParticipate = Boolean(body.attendeeContext?.canParticipate);

  const stats = useMemo(
    () => [
      { label: "Updates", value: announcements.length },
      { label: "Sessions", value: sessions.length },
      { label: "Q&A", value: questions.length },
      { label: "Polls", value: polls.length },
    ],
    [announcements.length, polls.length, questions.length, sessions.length]
  );

  const handleQuestionSubmit = async () => {
    try {
      await submitQuestion({
        eventId,
        booking_code: bookingCode || undefined,
        attendee_name: attendeeName || undefined,
        attendee_email: attendeeEmail || undefined,
        question,
      }).unwrap();
      setQuestion("");
      refetch();
      Alert.alert("Question submitted", "The organizer can now answer it in the hub.");
    } catch (error: any) {
      Alert.alert("Unable to submit", error?.data?.body || "Please check your question.");
    }
  };

  const togglePollOption = (poll: any, optionId: string) => {
    setSelectedPollOptions((current) => {
      const selected = current[poll.id] || poll.myVoteOptionIds || [];
      const next = selected.includes(optionId)
        ? selected.filter((id) => id !== optionId)
        : poll.poll_type === "MULTIPLE_CHOICE" || poll.allow_multiple
          ? [...selected, optionId]
          : [optionId];
      return { ...current, [poll.id]: next };
    });
  };

  const getAllocationDraft = (poll: any) => {
    return (pollAllocations[poll.id] || poll.myVoteResponse?.allocations || {}) as Record<string, number>;
  };

  const setAllocation = (poll: any, optionId: string, value: string) => {
    const parsed = Number(value);
    setPollAllocations((current) => ({
      ...current,
      [poll.id]: {
        ...getAllocationDraft(poll),
        [optionId]: Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 0,
      },
    }));
  };

  const submitVote = async (poll: any) => {
    try {
      const optionIds = selectedPollOptions[poll.id] || poll.myVoteOptionIds || [];
      const allocations = getAllocationDraft(poll);
      await votePoll({
        pollId: poll.id,
        booking_code: bookingCode,
        ...(poll.poll_type === "PERCENTAGE" ? { allocations } : { option_ids: optionIds }),
      }).unwrap();
      refetch();
      Alert.alert("Vote saved", "Your poll response has been recorded.");
    } catch (error: any) {
      Alert.alert("Unable to vote", error?.data?.body || "A valid booking code is required.");
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 bg-[#1A2432] p-2 rounded-full">
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-white text-xl font-semibold">Attendee Hub</Text>
          <Text className="text-gray-400 text-sm mt-1">{event.title || "Event engagement"}</Text>
        </View>
        {isFetching ? <Loader2 color="#9EDD45" size={22} /> : null}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {isLoading ? (
          <View className="py-8 items-center">
            <Loader2 color="#9EDD45" size={30} />
            <Text className="text-gray-400 mt-3">Loading engagement hub...</Text>
          </View>
        ) : null}

        <View className="bg-[#111823] border border-[#243044] rounded-2xl p-4 mb-4">
          <View className="flex-row items-start">
            <View className="w-12 h-12 rounded-2xl bg-primary/20 items-center justify-center">
              <Ticket color="#9EDD45" size={24} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-white text-lg font-semibold">Unlock attendee actions</Text>
              <Text className={canParticipate ? "text-primary mt-1" : "text-gray-400 mt-1"}>
                {canParticipate ? "Booking code accepted." : "Booking code is needed for polls and attendee-only actions."}
              </Text>
            </View>
          </View>
          <View className="flex-row gap-2 mt-4">
            <TextInput
              className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white flex-1"
              placeholder="Booking code"
              placeholderTextColor="#728097"
              value={bookingCode}
              onChangeText={setBookingCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity className="bg-primary rounded-xl px-4 justify-center" onPress={() => refetch()}>
              <Text className="text-background font-bold">Apply</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-3 mb-4">
          {stats.map((stat) => (
            <View key={stat.label} className="bg-[#1A2432] rounded-lg p-4 min-w-[45%] flex-1">
              <Text className="text-primary text-2xl font-bold">{stat.value}</Text>
              <Text className="text-gray-400 text-xs mt-1">{stat.label}</Text>
            </View>
          ))}
        </View>

        <View className="flex-row flex-wrap gap-2 mb-4">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              className={`rounded-full px-4 py-2 border ${
                activeTab === tab ? "bg-primary border-primary" : "bg-[#111823] border-[#243044]"
              }`}
              onPress={() => setActiveTab(tab)}
            >
              <Text className={activeTab === tab ? "text-background font-bold" : "text-gray-300 font-semibold"}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === "Updates" ? (
          <Section title="Event updates" icon={<Bell color="#9EDD45" size={20} />}>
            {announcements.length ? (
              announcements.map((item: any) => (
                <ContentBlock
                  key={item.id}
                  title={item.title}
                  subtitle={formatDate(item.published_at)}
                  body={item.body}
                />
              ))
            ) : (
              <EmptyText text="Organizer updates will appear here." />
            )}
          </Section>
        ) : null}

        {activeTab === "Agenda" ? (
          <Section title="Agenda" icon={<CalendarDays color="#8B6BFF" size={20} />}>
            {sessions.length ? (
              sessions.map((session: any, index: number) => (
                <ContentBlock
                  key={session.id || index}
                  title={session.name || `Session ${index + 1}`}
                  subtitle={`${formatDate(session.date)} - ${session.start_time || "Start"} to ${session.end_time || "End"}`}
                  body={
                    getArray(session.participants)
                      .map((participant: any) => participant.name || participant.title || participant.label)
                      .filter(Boolean)
                      .join(", ") || "Speakers will be announced."
                  }
                />
              ))
            ) : (
              <EmptyText text="Agenda sessions will appear here." />
            )}
          </Section>
        ) : null}

        {activeTab === "Q&A" ? (
          <>
            <Section title="Ask a question" icon={<Send color="#9EDD45" size={20} />}>
              <TextInput
                className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white"
                placeholder="Name"
                placeholderTextColor="#728097"
                value={attendeeName}
                onChangeText={setAttendeeName}
              />
              <TextInput
                className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white mt-3"
                placeholder="Email"
                placeholderTextColor="#728097"
                value={attendeeEmail}
                onChangeText={setAttendeeEmail}
              />
              <TextInput
                className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white mt-3 min-h-[120px]"
                placeholder="Question"
                placeholderTextColor="#728097"
                value={question}
                onChangeText={setQuestion}
                multiline
                textAlignVertical="top"
              />
              <TouchableOpacity
                className="bg-primary rounded-xl py-4 mt-4 disabled:opacity-50"
                disabled={isSubmitting}
                onPress={handleQuestionSubmit}
              >
                <Text className="text-background text-center font-bold">Submit question</Text>
              </TouchableOpacity>
            </Section>
            <Section title="Live Q&A" icon={<HelpCircle color="#8B6BFF" size={20} />}>
              {questions.length ? (
                questions.map((item: any) => (
                  <ContentBlock
                    key={item.id}
                    title={item.question}
                    subtitle={`${item.attendee_name || "Attendee"} - ${item.status}`}
                    body={item.answer || "Waiting for organizer answer."}
                  />
                ))
              ) : (
                <EmptyText text="Questions and organizer answers will appear here." />
              )}
            </Section>
          </>
        ) : null}

        {activeTab === "Polls" ? (
          <Section title="Live polls" icon={<Vote color="#8B6BFF" size={20} />}>
            {polls.length ? (
              polls.map((poll: any) => {
                const selected = selectedPollOptions[poll.id] || poll.myVoteOptionIds || [];
                const allocationDraft = getAllocationDraft(poll);
                const allocationTotal = Object.values(allocationDraft).reduce((sum, value) => sum + Number(value || 0), 0);
                return (
                  <View key={poll.id} className="border-b border-[#243044] pb-4 mb-4">
                    <Text className="text-white font-semibold">{poll.question}</Text>
                    <Text className="text-gray-500 mt-1">
                      {getPollTypeLabel(poll.poll_type, poll.typeLabel)} - {poll.totalVotes || 0} voters - {poll.status}
                    </Text>
                    {poll.poll_type === "RATING" ? (
                      <View className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-3 mt-3">
                        <Text className="text-white font-bold">{poll.summary?.averageRating || 0} average</Text>
                        <Text className="text-gray-500 mt-1">Out of {poll.summary?.maxRating || 5}</Text>
                      </View>
                    ) : null}
                    {poll.poll_type === "PERCENTAGE" ? (
                      <>
                        {(poll.options || []).map((option: any) => (
                          <View key={option.id} className="rounded-xl border border-[#2E3A4D] bg-[#1A2432] p-3 mt-3">
                            <View className="flex-row items-center justify-between">
                              <Text className="text-white font-semibold flex-1 pr-3">{option.text}</Text>
                              <Text className="text-gray-400">{option.averageAllocation || option.percent || 0}% avg</Text>
                            </View>
                            <TextInput
                              className="bg-[#0B1220] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white mt-3"
                              placeholder="0"
                              placeholderTextColor="#728097"
                              value={allocationDraft[option.id] === undefined ? "" : String(allocationDraft[option.id])}
                              onChangeText={(value) => setAllocation(poll, option.id, value)}
                              keyboardType="numeric"
                            />
                            <View className="bg-[#0B1220] h-3 rounded-full mt-3 overflow-hidden">
                              <View className="bg-[#8B6BFF] h-full rounded-full" style={{ width: `${Math.min(100, option.percent || 0)}%` }} />
                            </View>
                          </View>
                        ))}
                        <Text className={allocationTotal === 100 ? "text-primary font-bold mt-3" : "text-red-300 font-bold mt-3"}>
                          Allocation total: {allocationTotal}%
                        </Text>
                      </>
                    ) : (
                      (poll.options || []).map((option: any) => (
                        <TouchableOpacity
                          key={option.id}
                          className={`rounded-xl border p-3 mt-3 ${
                            selected.includes(option.id)
                              ? "border-primary bg-primary/10"
                              : "border-[#2E3A4D] bg-[#1A2432]"
                          }`}
                          onPress={() => togglePollOption(poll, option.id)}
                        >
                          <View className="flex-row items-center justify-between">
                            <Text className="text-white font-semibold flex-1 pr-3">{option.text}</Text>
                            <Text className="text-gray-400">{Math.round(option.percent || 0)}%</Text>
                          </View>
                          <View className="bg-[#0B1220] h-3 rounded-full mt-2 overflow-hidden">
                            <View className="bg-[#8B6BFF] h-full rounded-full" style={{ width: `${Math.min(100, option.percent || 0)}%` }} />
                          </View>
                        </TouchableOpacity>
                      ))
                    )}
                    <TouchableOpacity
                      className="bg-primary rounded-xl py-4 mt-4 disabled:opacity-50"
                      disabled={isVoting || poll.status !== "LIVE" || (poll.poll_type === "PERCENTAGE" && allocationTotal !== 100)}
                      onPress={() => submitVote(poll)}
                    >
                      <Text className="text-background text-center font-bold">Save vote</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            ) : (
              <EmptyText text="Live polls will appear here." />
            )}
          </Section>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Section({
  children,
  icon,
  title,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <View className="bg-[#111823] border border-[#243044] rounded-2xl p-4 mb-4">
      <View className="flex-row items-center mb-4">
        {icon}
        <Text className="text-white text-xl font-semibold ml-2">{title}</Text>
      </View>
      {children}
    </View>
  );
}

function ContentBlock({
  body,
  subtitle,
  title,
}: {
  body?: string;
  subtitle?: string;
  title: string;
}) {
  return (
    <View className="border-b border-[#243044] pb-4 mb-4">
      <Text className="text-white font-semibold">{title}</Text>
      {!!subtitle && <Text className="text-gray-500 mt-1">{subtitle}</Text>}
      {!!body && <Text className="text-gray-300 mt-3 leading-6">{body}</Text>}
    </View>
  );
}

function EmptyText({ text }: { text: string }) {
  return (
    <View className="py-8 items-center">
      <MessageSquare color="#8B6BFF" size={32} />
      <Text className="text-gray-400 text-center mt-3">{text}</Text>
    </View>
  );
}
