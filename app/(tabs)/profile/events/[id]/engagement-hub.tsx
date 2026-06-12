import React, { useMemo, useState } from "react";
import { Alert, Share, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Bell,
  CalendarDays,
  HelpCircle,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Users,
  Vote,
} from "lucide-react-native";
import ProfileFoundationScreen from "@/app/components/profile/ProfileFoundationScreen";
import {
  useAnswerEngagementQuestionMutation,
  useCreateEngagementAnnouncementMutation,
  useCreateEngagementPollMutation,
  useGetOrganizerEngagementHubQuery,
  useUpdateEngagementPollStatusMutation,
  useUpdateEngagementQuestionStatusMutation,
} from "@/redux/api/eventsApiSlice";
import { formatDate } from "@/utils/formatDate";
import { getStringParam } from "@/utils/routeParams";

const tabs = ["Updates", "Q&A", "Polls", "Agenda"] as const;
const getArray = (value: unknown) => (Array.isArray(value) ? value : []);
type PollType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "YES_NO" | "RATING" | "PERCENTAGE" | "COMPETITION";

const pollTypeOptions: Array<{ value: PollType; label: string; defaultOptions: string }> = [
  { value: "SINGLE_CHOICE", label: "Single", defaultOptions: "Yes\nNo" },
  { value: "MULTIPLE_CHOICE", label: "Multi", defaultOptions: "Option A\nOption B\nOption C" },
  { value: "YES_NO", label: "Yes / No", defaultOptions: "Yes\nNo" },
  { value: "RATING", label: "Rating", defaultOptions: "" },
  { value: "PERCENTAGE", label: "100%", defaultOptions: "Option A\nOption B\nOption C" },
  { value: "COMPETITION", label: "Award", defaultOptions: "Candidate A\nCandidate B\nCandidate C" },
];

function getPollTypeLabel(type?: string, fallback?: string) {
  if (fallback) return fallback;
  return pollTypeOptions.find((item) => item.value === type)?.label || "Single";
}

function parsePollOptionsInput(value: string, type: PollType) {
  return value
    .split("\n")
    .map((option) => option.trim())
    .filter(Boolean)
    .map((option) => {
      if (type !== "COMPETITION") return option;
      const [text, photo_url, bio] = option.split("|").map((part) => part.trim());
      return {
        text,
        ...(photo_url ? { photo_url } : {}),
        ...(bio ? { bio } : {}),
      };
    });
}

export default function OrganizerEngagementHubScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const eventId = getStringParam(id);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Updates");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");
  const [pollType, setPollType] = useState<PollType>("SINGLE_CHOICE");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState("Yes\nNo");
  const [pollMaxRating, setPollMaxRating] = useState(5);
  const [pollVoteLimit, setPollVoteLimit] = useState("3");
  const [pollClosesAt, setPollClosesAt] = useState("");
  const [allowRepeatCandidate, setAllowRepeatCandidate] = useState(false);
  const [allowExternalVoters, setAllowExternalVoters] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const { data, isFetching, isLoading, refetch } = useGetOrganizerEngagementHubQuery(
    eventId,
    {
      skip: !eventId,
      pollingInterval: 30000,
    }
  );
  const [createAnnouncement, { isLoading: isCreatingAnnouncement }] =
    useCreateEngagementAnnouncementMutation();
  const [createPoll, { isLoading: isCreatingPoll }] = useCreateEngagementPollMutation();
  const [answerQuestion, { isLoading: isAnswering }] =
    useAnswerEngagementQuestionMutation();
  const [updateQuestionStatus] = useUpdateEngagementQuestionStatusMutation();
  const [updatePollStatus] = useUpdateEngagementPollStatusMutation();

  const body = data?.body || {};
  const metrics = body.metrics || {};
  const announcements = getArray(body.announcements);
  const questions = getArray(body.questions);
  const polls = getArray(body.polls);
  const sessions = getArray(body.event?.sessions);

  const stats = useMemo(
    () => [
      { label: "Attendees", value: metrics.attendeeCount || 0 },
      { label: "Updates", value: metrics.announcementCount || 0 },
      { label: "Open Q&A", value: metrics.openQuestions || 0 },
      { label: "Live polls", value: metrics.livePollCount || 0 },
    ],
    [metrics]
  );

  const submitAnnouncement = async () => {
    try {
      await createAnnouncement({
        eventId,
        title: announcementTitle,
        body: announcementBody,
      }).unwrap();
      setAnnouncementTitle("");
      setAnnouncementBody("");
      refetch();
      Alert.alert("Published", "Announcement is now visible in the attendee hub.");
    } catch (error: any) {
      Alert.alert("Unable to publish", error?.data?.body || "Please check the update.");
    }
  };

  const submitPoll = async () => {
    try {
      const parsedDeadline = pollClosesAt ? new Date(pollClosesAt) : null;
      await createPoll({
        eventId,
        poll_type: pollType,
        question: pollQuestion,
        options: pollType === "RATING"
          ? []
          : parsePollOptionsInput(pollOptions, pollType),
        allow_multiple: pollType === "MULTIPLE_CHOICE",
        settings: pollType === "RATING"
          ? { max_rating: pollMaxRating }
          : pollType === "COMPETITION"
            ? {
                vote_limit_per_day: Number(pollVoteLimit) || 3,
                show_leaderboard: true,
                show_winner_badge: true,
                allow_repeat_candidate_per_day: allowRepeatCandidate,
                allow_external_voters: allowExternalVoters,
                external_voters_require_login: true,
              }
            : undefined,
        closes_at:
          parsedDeadline && !Number.isNaN(parsedDeadline.getTime())
            ? parsedDeadline.toISOString()
            : undefined,
        status: "LIVE",
      }).unwrap();
      setPollType("SINGLE_CHOICE");
      setPollQuestion("");
      setPollOptions("Yes\nNo");
      setPollMaxRating(5);
      setPollVoteLimit("3");
      setPollClosesAt("");
      setAllowRepeatCandidate(false);
      setAllowExternalVoters(false);
      refetch();
      Alert.alert("Poll launched", "Attendees can now vote with their booking code.");
    } catch (error: any) {
      Alert.alert("Unable to launch poll", error?.data?.body || "Please check the poll.");
    }
  };

  const submitAnswer = async (questionId: number) => {
    try {
      await answerQuestion({
        questionId,
        answer: answers[questionId] || "",
      }).unwrap();
      setAnswers((current) => ({ ...current, [questionId]: "" }));
      refetch();
      Alert.alert("Answer posted", "The attendee hub now shows your answer.");
    } catch (error: any) {
      Alert.alert("Unable to answer", error?.data?.body || "Please check the answer.");
    }
  };

  const shareCandidateLink = async (poll: any, option: any) => {
    const url = `https://www.gatherplux.com/event-engagement/${eventId}?poll=${poll.id}&candidate=${option.id}`;
    await Share.share({
      message: `Vote for ${option.text}: ${url}`,
      url,
      title: `${option.text} campaign profile`,
    });
  };

  return (
    <ProfileFoundationScreen
      isLoading={isLoading}
      title="Engagement Hub"
      subtitle={body.event?.title || "Attendee updates, Q&A, polls, and agenda"}
      stats={stats}
    >
      <View className="flex-row flex-wrap gap-2 mb-4">
        <TouchableOpacity
          className="bg-primary rounded-xl px-4 py-3 flex-row items-center"
          onPress={() => router.push(`/engagement/${eventId}` as any)}
        >
          <Sparkles color="#020817" size={17} />
          <Text className="text-background font-bold ml-2">Attendee view</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 flex-row items-center"
          onPress={() => refetch()}
        >
          <RefreshCw color="#E5E7EB" size={17} />
          <Text className="text-white font-semibold ml-2">
            {isFetching ? "Refreshing" : "Refresh"}
          </Text>
        </TouchableOpacity>
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
        <>
          <Section title="Publish update" icon={<Bell color="#9EDD45" size={20} />}>
            <TextInput
              className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white"
              placeholder="Title"
              placeholderTextColor="#728097"
              value={announcementTitle}
              onChangeText={setAnnouncementTitle}
            />
            <TextInput
              className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white mt-3 min-h-[120px]"
              placeholder="What should attendees know?"
              placeholderTextColor="#728097"
              value={announcementBody}
              onChangeText={setAnnouncementBody}
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity
              className="bg-primary rounded-xl py-4 mt-4 disabled:opacity-50"
              disabled={isCreatingAnnouncement}
              onPress={submitAnnouncement}
            >
              <Text className="text-background text-center font-bold">Publish update</Text>
            </TouchableOpacity>
          </Section>
          <Section title="Published updates" icon={<MessageSquare color="#8B6BFF" size={20} />}>
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
              <EmptyText text="No announcements yet." />
            )}
          </Section>
        </>
      ) : null}

      {activeTab === "Q&A" ? (
        <Section title="Live Q&A" icon={<HelpCircle color="#8B6BFF" size={20} />}>
          {questions.length ? (
            questions.map((question: any) => (
              <View key={question.id} className="border-b border-[#243044] pb-4 mb-4">
                <Text className="text-white font-semibold">{question.question}</Text>
                <Text className="text-gray-500 mt-1">
                  {question.attendee_name || question.attendee_email || "Attendee"} - {question.status}
                </Text>
                {question.answer ? (
                  <Text className="text-primary mt-3 leading-6">{question.answer}</Text>
                ) : (
                  <>
                    <TextInput
                      className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white mt-3"
                      placeholder="Answer"
                      placeholderTextColor="#728097"
                      value={answers[question.id] || ""}
                      onChangeText={(value) => setAnswers((current) => ({ ...current, [question.id]: value }))}
                    />
                    <View className="flex-row gap-2 mt-3">
                      <TouchableOpacity
                        className="bg-primary rounded-xl px-4 py-3 flex-1 disabled:opacity-50"
                        disabled={isAnswering}
                        onPress={() => submitAnswer(question.id)}
                      >
                        <Text className="text-background text-center font-bold">Answer</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3"
                        onPress={() => updateQuestionStatus({ questionId: question.id, status: "HIDDEN" })}
                      >
                        <Text className="text-red-300 font-bold">Hide</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            ))
          ) : (
            <EmptyText text="No attendee questions yet." />
          )}
        </Section>
      ) : null}

      {activeTab === "Polls" ? (
        <>
          <Section title="Launch poll" icon={<Vote color="#9EDD45" size={20} />}>
            <View className="flex-row flex-wrap gap-2 mb-3">
              {pollTypeOptions.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  className={`rounded-full px-3 py-2 border ${
                    pollType === type.value ? "bg-primary border-primary" : "bg-[#1A2432] border-[#2E3A4D]"
                  }`}
                  onPress={() => {
                    setPollType(type.value);
                    setPollOptions(type.defaultOptions);
                    if (type.value !== "COMPETITION") setAllowExternalVoters(false);
                  }}
                >
                  <Text className={pollType === type.value ? "text-background font-bold" : "text-gray-300 font-semibold"}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white"
              placeholder="Poll question"
              placeholderTextColor="#728097"
              value={pollQuestion}
              onChangeText={setPollQuestion}
            />
            {pollType === "RATING" ? (
              <View className="flex-row gap-2 mt-3">
                {[5, 7, 10].map((value) => (
                  <TouchableOpacity
                    key={value}
                    className={`rounded-xl px-4 py-3 border ${
                      pollMaxRating === value ? "bg-primary border-primary" : "bg-[#1A2432] border-[#2E3A4D]"
                    }`}
                    onPress={() => setPollMaxRating(value)}
                  >
                    <Text className={pollMaxRating === value ? "text-background font-bold" : "text-gray-300 font-semibold"}>
                      {value} point
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : pollType === "COMPETITION" ? (
              <>
                <TextInput
                  className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white mt-3 min-h-[130px]"
                  placeholder={"One candidate per line\nName | Photo URL | Short bio"}
                  placeholderTextColor="#728097"
                  value={pollOptions}
                  onChangeText={setPollOptions}
                  multiline
                  textAlignVertical="top"
                />
                <View className="flex-row gap-2 mt-3">
                  <TextInput
                    className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white flex-1"
                    placeholder="Votes/day"
                    placeholderTextColor="#728097"
                    value={pollVoteLimit}
                    onChangeText={setPollVoteLimit}
                    keyboardType="numeric"
                  />
                  <TextInput
                    className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white flex-[2]"
                    placeholder="Deadline ISO optional"
                    placeholderTextColor="#728097"
                    value={pollClosesAt}
                    onChangeText={setPollClosesAt}
                  />
                </View>
                <TouchableOpacity
                  className={`rounded-xl px-4 py-3 border mt-3 ${
                    allowRepeatCandidate ? "bg-primary border-primary" : "bg-[#1A2432] border-[#2E3A4D]"
                  }`}
                  onPress={() => setAllowRepeatCandidate((value) => !value)}
                >
                  <Text className={allowRepeatCandidate ? "text-background font-bold" : "text-gray-300 font-semibold"}>
                    {allowRepeatCandidate ? "Repeat candidate votes allowed" : "One vote per candidate per day"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`rounded-xl px-4 py-3 border mt-3 ${
                    allowExternalVoters ? "bg-primary border-primary" : "bg-[#1A2432] border-[#2E3A4D]"
                  }`}
                  onPress={() => setAllowExternalVoters((value) => !value)}
                >
                  <Text className={allowExternalVoters ? "text-background font-bold" : "text-gray-300 font-semibold"}>
                    {allowExternalVoters ? "Public campaign voting enabled" : "Attendee or ticket-holder voting only"}
                  </Text>
                  <Text className={allowExternalVoters ? "text-background mt-1" : "text-gray-500 mt-1"}>
                    Public visitors can view candidate pages, but must sign in or enter a booking code before voting.
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TextInput
                className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white mt-3 min-h-[110px]"
                placeholder={pollType === "PERCENTAGE" ? "One allocation choice per line" : "One option per line"}
                placeholderTextColor="#728097"
                value={pollOptions}
                onChangeText={setPollOptions}
                editable={pollType !== "YES_NO"}
                multiline
                textAlignVertical="top"
              />
            )}
            <TouchableOpacity
              className="bg-primary rounded-xl py-4 mt-4 disabled:opacity-50"
              disabled={isCreatingPoll}
              onPress={submitPoll}
            >
              <Text className="text-background text-center font-bold">Launch poll</Text>
            </TouchableOpacity>
          </Section>
          <Section title="Poll results" icon={<Vote color="#8B6BFF" size={20} />}>
            {polls.length ? (
              polls.map((poll: any) => (
                <View key={poll.id} className="border-b border-[#243044] pb-4 mb-4">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-white font-semibold">{poll.question}</Text>
                        <Text className="text-gray-500 mt-1">
                          {getPollTypeLabel(poll.poll_type, poll.typeLabel)} - {poll.totalVotes || 0} voters
                        </Text>
                        {poll.poll_type === "COMPETITION" ? (
                          <Text className="text-gray-500 mt-1">
                            {poll.summary?.allowExternalVoters ? "Public campaign enabled" : "Attendee voting only"} - {poll.summary?.voteLimitPerDay || 3} votes/day
                          </Text>
                        ) : null}
                      </View>
                    <TouchableOpacity
                      className={poll.status === "LIVE" ? "bg-red-500/20 rounded-full px-3 py-1" : "bg-primary/20 rounded-full px-3 py-1"}
                      onPress={() => updatePollStatus({ pollId: poll.id, status: poll.status === "LIVE" ? "CLOSED" : "LIVE" })}
                    >
                      <Text className={poll.status === "LIVE" ? "text-red-300 text-xs font-bold" : "text-primary text-xs font-bold"}>
                        {poll.status === "LIVE" ? "Close" : "Go live"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {poll.poll_type === "RATING" ? (
                    <View className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-3 mt-3">
                      <Text className="text-white font-bold">
                        {poll.summary?.averageRating || 0} average
                      </Text>
                      <Text className="text-gray-500 mt-1">Out of {poll.summary?.maxRating || 5}</Text>
                    </View>
                  ) : null}
                  {poll.poll_type === "COMPETITION" ? (
                    (poll.options || []).map((option: any) => (
                      <View key={option.id} className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-3 mt-3">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-white font-semibold flex-1 pr-3">
                            #{option.rank || "-"} {option.text}
                          </Text>
                          <Text className={option.isWinner || option.isLeader ? "text-primary font-bold" : "text-gray-400"}>
                            {option.isWinner ? "Winner" : option.isLeader ? "Leading" : `${option.percent || 0}%`}
                          </Text>
                        </View>
                        {!!option.bio && <Text className="text-gray-500 mt-1">{option.bio}</Text>}
                        <ProgressItem
                          title={`${option.votes || 0} votes`}
                          subtitle={`${option.percent || 0}% of competition votes`}
                          value={option.percent || 0}
                        />
                        {poll.summary?.allowExternalVoters ? (
                          <TouchableOpacity
                            className="bg-primary/15 border border-primary/30 rounded-xl px-4 py-3 mt-3"
                            onPress={() => shareCandidateLink(poll, option)}
                          >
                            <Text className="text-primary text-center font-bold">Share public profile</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    ))
                  ) : (
                    (poll.options || []).map((option: any) => (
                      <ProgressItem
                        key={option.id}
                        title={option.text}
                        subtitle={
                          poll.poll_type === "PERCENTAGE"
                            ? `${option.averageAllocation || option.percent || 0}% average allocation`
                            : `${option.votes} votes`
                        }
                        value={option.percent || 0}
                      />
                    ))
                  )}
                </View>
              ))
            ) : (
              <EmptyText text="No polls yet." />
            )}
          </Section>
        </>
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
            <EmptyText text="No agenda sessions yet." />
          )}
        </Section>
      ) : null}
    </ProfileFoundationScreen>
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

function ProgressItem({
  subtitle,
  title,
  value,
}: {
  subtitle: string;
  title: string;
  value: number;
}) {
  return (
    <View className="mt-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-white font-semibold flex-1 pr-3">{title}</Text>
        <Text className="text-gray-400">{Math.round(value)}%</Text>
      </View>
      <Text className="text-gray-500 mt-1">{subtitle}</Text>
      <View className="bg-[#1A2432] h-3 rounded-full mt-2 overflow-hidden">
        <View className="bg-[#8B6BFF] h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </View>
    </View>
  );
}

function EmptyText({ text }: { text: string }) {
  return (
    <View className="py-8 items-center">
      <Users color="#8B6BFF" size={32} />
      <Text className="text-gray-400 text-center mt-3">{text}</Text>
    </View>
  );
}
