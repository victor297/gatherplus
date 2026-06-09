import React, { useMemo, useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Mail,
  Search,
  Ticket,
  User,
} from "lucide-react-native";
import ProfileFoundationScreen from "@/app/components/profile/ProfileFoundationScreen";
import { useGetMyEventBookingsQuery } from "@/redux/api/eventsApiSlice";
import { getStringParam } from "@/utils/routeParams";
import { formatDate } from "@/utils/formatDate";

const PAGE_SIZE = 12;

export default function EventParticipantsScreen() {
  const { id } = useLocalSearchParams();
  const eventId = getStringParam(id);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

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
  const participants = Array.isArray(body.result) ? body.result : [];
  const totalItems = Number(body.totalItems || participants.length || 0);
  const totalPages = Math.max(1, Number(body.totalPages || 1));
  const completed = participants.filter((item: any) => String(item.status || "").toUpperCase() === "COMPLETED").length;

  return (
    <ProfileFoundationScreen
      isLoading={isLoading}
      title="Event participants"
      subtitle="Orders, attendees, ticket status, and booking codes."
      stats={[
        { label: "This page", value: participants.length },
        { label: "Completed", value: completed },
        { label: "Total", value: totalItems },
      ]}
    >
      <View className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden">
        <View className="p-4 border-b border-[#243044]">
          <Text className="text-white text-xl font-semibold">Participant library</Text>
          <Text className="text-gray-400 mt-1">Search attendees by name, email, ticket, or booking code.</Text>
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
          <TouchableOpacity
            className="self-start bg-[#1A2432] border border-[#2E3A4D] rounded-full px-4 py-2 mt-3"
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

        {isFetching && !isLoading ? (
          <View className="py-3">
            <ActivityIndicator color="#9EDD45" />
          </View>
        ) : null}

        {participants.length ? (
          participants.map((participant: any, index: number) => (
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
                </View>
              </View>
            </View>
          ))
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
