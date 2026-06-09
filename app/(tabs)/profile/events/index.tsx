import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  FileText,
  Plus,
  Search,
  Ticket,
  Users,
  Wand2,
} from "lucide-react-native";
import ProfileFoundationScreen from "@/app/components/profile/ProfileFoundationScreen";
import {
  useGetMyNewEventsQuery,
  usePatchNewEventMutation,
} from "@/redux/api/newEventsApiSlice";
import { formatDate } from "@/utils/formatDate";
import { getApiErrorMessage } from "@/utils/api";

const PAGE_SIZE = 6;

export default function OrganizerEventsScreen() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");
  const [patchEvent, { isLoading: isPatching }] = usePatchNewEventMutation();

  const queryParams = useMemo(
    () => ({
      page,
      size: PAGE_SIZE,
      search,
      sortBy: "updated_at",
      sortDirection: "desc" as const,
      ...(status === "published" ? { published: "true" } : {}),
      ...(status === "draft" ? { published: "false" } : {}),
    }),
    [page, search, status]
  );

  const { data, isLoading, isFetching, refetch } = useGetMyNewEventsQuery(queryParams);
  const events = Array.isArray(data?.body?.result) ? data.body.result : [];
  const totalItems = data?.body?.totalItems || events.length || 0;
  const totalPages = Math.max(1, Number(data?.body?.totalPages || 1));
  const published = events.filter((event: any) => event?.published).length;
  const drafts = events.filter((event: any) => !event?.published).length;

  const handlePublish = async (event: any) => {
    Alert.alert(
      "Publish event?",
      "This will make the event visible if all required fields are valid.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Publish",
          onPress: async () => {
            try {
              await patchEvent({ id: event.id, data: { published: true } }).unwrap();
              refetch();
            } catch (error) {
              Alert.alert("Publish failed", getApiErrorMessage(error, "Please review the event first."));
            }
          },
        },
      ]
    );
  };

  return (
    <ProfileFoundationScreen
      isLoading={isLoading}
      title="Manage events"
      subtitle="Draft, preview, publish, and track every event."
      stats={[
        { label: "This page", value: events.length },
        { label: "Published", value: published },
        { label: "Drafts", value: drafts },
        { label: "Total", value: totalItems },
      ]}
    >
      <View className="flex-row gap-3 mb-4">
        <TouchableOpacity
          className="flex-1 bg-primary rounded-xl py-4 flex-row items-center justify-center"
          onPress={() => router.push("/create")}
        >
          <Plus size={18} color="#020e1e" />
          <Text className="text-background font-bold ml-2">Manual event</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-[#1A2432] border border-[#2E3A4D] rounded-xl py-4 flex-row items-center justify-center"
          onPress={() => router.push("/create/ai")}
        >
          <Wand2 size={18} color="#9EDD45" />
          <Text className="text-primary font-bold ml-2">AI draft</Text>
        </TouchableOpacity>
      </View>

      <View className="bg-[#111823] rounded-2xl border border-[#243044] overflow-hidden">
        <View className="p-4 border-b border-[#243044]">
          <Text className="text-white text-xl font-semibold">Event library</Text>
          <Text className="text-gray-400 mt-1">
            {totalItems} events available in your organizer workspace.
          </Text>
          <View className="flex-row items-center bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-3 mt-4">
            <Search color="#8B6BFF" size={18} />
            <TextInput
              className="flex-1 text-white py-3 ml-2"
              placeholder="Search events"
              placeholderTextColor="#728097"
              value={search}
              onChangeText={(value) => {
                setPage(1);
                setSearch(value);
              }}
            />
          </View>
          <View className="flex-row flex-wrap gap-2 mt-3">
            {(["all", "published", "draft"] as const).map((item) => (
              <TouchableOpacity
                key={item}
                className={`px-4 py-2 rounded-full border ${
                  status === item
                    ? "bg-primary border-primary"
                    : "bg-[#1A2432] border-[#2E3A4D]"
                }`}
                onPress={() => {
                  setStatus(item);
                  setPage(1);
                }}
              >
                <Text className={status === item ? "text-background font-semibold" : "text-white"}>
                  {item === "all" ? "All" : item === "published" ? "Published" : "Drafts"}
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

        {events.length ? (
          events.map((event: any) => (
            <View key={event.id} className="p-4 border-b border-[#243044]">
              <View className="flex-row">
                <Image
                  source={{
                    uri:
                      event?.images?.[0] ||
                      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622",
                  }}
                  className="w-20 h-20 rounded-xl bg-[#243044]"
                />
                <View className="flex-1 ml-3">
                  <View className="flex-row items-start justify-between">
                    <Text className="text-white text-lg font-semibold flex-1 pr-2">
                      {event.title || "Untitled event"}
                    </Text>
                    <View className={`rounded-full px-3 py-1 ${event.published ? "bg-primary/20" : "bg-[#8B6BFF]/20"}`}>
                      <Text className={event.published ? "text-primary text-xs font-bold" : "text-[#A993FF] text-xs font-bold"}>
                        {event.published ? "LIVE" : "DRAFT"}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center mt-2">
                    <Calendar color="#728097" size={15} />
                    <Text className="text-gray-400 ml-2">
                      {formatDate(event?.sessions?.[0]?.date || event?.start_date)}
                    </Text>
                  </View>
                  <View className="flex-row items-center mt-1">
                    <Ticket color="#728097" size={15} />
                    <Text className="text-gray-400 ml-2">
                      {event?.tickets?.length || 0} ticket types · {event?.sessions?.length || 0} sessions
                    </Text>
                  </View>
                </View>
              </View>

              <View className="flex-row flex-wrap gap-2 mt-4">
                <ActionButton
                  icon={<Eye color="#020e1e" size={16} />}
                  label="Preview"
                  primary
                  onPress={() => router.push(`/profile/events/${event.id}/preview`)}
                />
                <ActionButton
                  icon={<Edit3 color="#E5E7EB" size={16} />}
                  label="Edit"
                  onPress={() => router.push({ pathname: "/create", params: { eventId: String(event.id) } })}
                />
                <ActionButton
                  icon={<Users color="#E5E7EB" size={16} />}
                  label="People"
                  onPress={() => router.push(`/profile/events/${event.id}/participants`)}
                />
                <ActionButton
                  icon={<FileText color="#E5E7EB" size={16} />}
                  label="Responses"
                  onPress={() => router.push(`/profile/events/${event.id}/questionnaire-responses`)}
                />
                {!event.published ? (
                  <ActionButton
                    icon={<ChevronRight color="#020e1e" size={16} />}
                    label={isPatching ? "Saving" : "Publish"}
                    primary
                    onPress={() => handlePublish(event)}
                  />
                ) : null}
              </View>
            </View>
          ))
        ) : (
          <View className="p-8 items-center">
            <Ticket color="#7C5CFF" size={34} />
            <Text className="text-white text-lg font-semibold mt-3">No events found</Text>
            <Text className="text-gray-400 text-center mt-1">
              Create a manual event or generate a draft with AI.
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

function ActionButton({
  icon,
  label,
  onPress,
  primary = false,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <TouchableOpacity
      className={`rounded-xl px-3 py-3 flex-row items-center ${
        primary ? "bg-primary" : "bg-[#1A2432] border border-[#2E3A4D]"
      }`}
      onPress={onPress}
    >
      {icon}
      <Text className={primary ? "text-background font-bold ml-2" : "text-white font-semibold ml-2"}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
