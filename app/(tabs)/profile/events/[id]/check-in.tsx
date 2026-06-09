import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldAlert,
  Ticket,
  Users,
} from "lucide-react-native";
import ProfileFoundationScreen from "@/app/components/profile/ProfileFoundationScreen";
import {
  useCheckInBookingMutation,
  useGetCheckInDashboardQuery,
} from "@/redux/api/eventsApiSlice";
import { formatDate } from "@/utils/formatDate";
import { getStringParam } from "@/utils/routeParams";

const PAGE_SIZE = 12;

const getArray = (value: unknown) => (Array.isArray(value) ? value : []);

export default function EventCheckInScreen() {
  const { id } = useLocalSearchParams();
  const eventId = getStringParam(id);
  const [code, setCode] = useState("");
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sessionId, setSessionId] = useState<string | number | undefined>();
  const { data, isFetching, isLoading, refetch } = useGetCheckInDashboardQuery(
    {
      eventId,
      page,
      search,
      session_id: sessionId,
      size: PAGE_SIZE,
    },
    { skip: !eventId }
  );
  const [checkInBooking, { isLoading: isCheckingIn }] = useCheckInBookingMutation();

  const body = data?.body || {};
  const metrics = body.metrics || {};
  const sessionStats = getArray(body.sessionStats);
  const history = body.history || {};
  const rows = getArray(history.result);
  const totalPages = Math.max(1, Number(history.totalPages || 1));
  const checkInRate = Number(metrics.checkInRate || 0);

  const selectedSessionName = useMemo(() => {
    if (!sessionId) return "All sessions";
    const match = sessionStats.find((item: any) => String(item.session?.id) === String(sessionId));
    return match?.session?.name || "Selected session";
  }, [sessionId, sessionStats]);

  const submitCheckIn = async (override = false) => {
    const normalizedCode = code.trim();
    if (!normalizedCode) {
      Alert.alert("Booking code required", "Enter or scan a booking code before checking in.");
      return;
    }

    try {
      const response = await checkInBooking({
        code: normalizedCode,
        event_id: Number(eventId),
        method: override ? "MANUAL_OVERRIDE" : "MANUAL",
        notes: notes.trim() || undefined,
        override,
        override_reason: override ? "Organizer manual duplicate override" : undefined,
        session_id: sessionId,
      }).unwrap();
      const booking = response?.body?.booking || {};
      setCode("");
      setNotes("");
      refetch();
      Alert.alert(
        response?.body?.duplicate ? "Duplicate override recorded" : "Checked in",
        `${booking.fullname || booking.email || "Attendee"} is now recorded for ${selectedSessionName}.`
      );
    } catch (error: any) {
      const bodyError = error?.data?.body;
      if (bodyError?.duplicate) {
        Alert.alert(
          "Already checked in",
          "This ticket has already been checked in. Only override if a trusted organizer verified the attendee.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Override", style: "destructive", onPress: () => submitCheckIn(true) },
          ]
        );
        return;
      }
      Alert.alert("Check-in failed", bodyError?.message || bodyError || "Please verify the booking code.");
    }
  };

  return (
    <ProfileFoundationScreen
      isLoading={isLoading}
      title="Smart check-in"
      subtitle="Verify tickets, prevent duplicates, and track arrivals in real time."
      stats={[
        { label: "Bookings", value: metrics.totalBookings || 0 },
        { label: "Checked in", value: metrics.checkedInCount || 0 },
        { label: "Remaining", value: metrics.remaining || 0 },
        { label: "Duplicates", value: metrics.duplicates || 0 },
      ]}
    >
      <View className="bg-[#111823] border border-[#243044] rounded-2xl p-4 mb-4">
        <View className="flex-row items-start">
          <View className="w-12 h-12 rounded-2xl bg-primary items-center justify-center">
            <CheckCircle2 color="#020817" size={24} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-white text-xl font-semibold">Manual / QR code check-in</Text>
            <Text className="text-gray-400 mt-1 leading-6">
              Scan support can pass the ticket code here. Duplicate check-ins are blocked unless you
              explicitly override.
            </Text>
          </View>
        </View>

        <View className="mt-5">
          <Text className="text-gray-300 font-semibold mb-2">Session</Text>
          <View className="flex-row flex-wrap gap-2">
            <TouchableOpacity
              className={`rounded-full px-4 py-2 border ${
                !sessionId ? "bg-primary border-primary" : "border-[#2E3A4D]"
              }`}
              onPress={() => {
                setPage(1);
                setSessionId(undefined);
              }}
            >
              <Text className={!sessionId ? "text-background font-bold" : "text-gray-300 font-semibold"}>
                All sessions
              </Text>
            </TouchableOpacity>
            {sessionStats.map((item: any) => (
              <TouchableOpacity
                key={item.session?.id}
                className={`rounded-full px-4 py-2 border ${
                  String(sessionId) === String(item.session?.id)
                    ? "bg-primary border-primary"
                    : "border-[#2E3A4D]"
                }`}
                onPress={() => {
                  setPage(1);
                  setSessionId(item.session?.id);
                }}
              >
                <Text
                  className={
                    String(sessionId) === String(item.session?.id)
                      ? "text-background font-bold"
                      : "text-gray-300 font-semibold"
                  }
                >
                  {item.session?.name || "Session"} · {item.checkedIn || 0}/{item.capacity || 0}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TextInput
          className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-4 text-white mt-5"
          placeholder="Enter booking code, for example GTP_..."
          placeholderTextColor="#728097"
          autoCapitalize="characters"
          value={code}
          onChangeText={(value) => setCode(value.trim())}
          onSubmitEditing={() => submitCheckIn(false)}
        />
        <TextInput
          className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white mt-3"
          placeholder="Optional staff note"
          placeholderTextColor="#728097"
          value={notes}
          onChangeText={setNotes}
        />
        <TouchableOpacity
          className="bg-primary rounded-xl py-4 mt-4 disabled:opacity-50"
          disabled={isCheckingIn}
          onPress={() => submitCheckIn(false)}
        >
          <Text className="text-background text-center font-bold">
            {isCheckingIn ? "Checking..." : "Check in attendee"}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="bg-[#111823] border border-[#243044] rounded-2xl p-4 mb-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-lg font-semibold">Arrival progress</Text>
            <Text className="text-gray-400 mt-1">{checkInRate}% checked in</Text>
          </View>
          <ShieldAlert color={metrics.duplicates ? "#F59E0B" : "#9EDD45"} size={24} />
        </View>
        <View className="bg-[#1A2432] h-3 rounded-full mt-4 overflow-hidden">
          <View className="bg-primary h-full rounded-full" style={{ width: `${Math.min(100, checkInRate)}%` }} />
        </View>
      </View>

      <View className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden">
        <View className="p-4 border-b border-[#243044]">
          <Text className="text-white text-xl font-semibold">Check-in history</Text>
          <Text className="text-gray-400 mt-1">Recent arrivals, duplicate overrides, and staff actions.</Text>
          <View className="flex-row items-center bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-3 mt-4">
            <Search color="#8B6BFF" size={18} />
            <TextInput
              className="flex-1 text-white py-3 ml-2"
              placeholder="Search booking code, name, or email"
              placeholderTextColor="#728097"
              value={search}
              onChangeText={(value) => {
                setPage(1);
                setSearch(value);
              }}
            />
          </View>
        </View>

        {isFetching && !isLoading ? (
          <View className="py-3">
            <ActivityIndicator color="#9EDD45" />
          </View>
        ) : null}

        {rows.length ? (
          <FlatList
            data={rows}
            keyExtractor={(item: any, index) => String(item.id || index)}
            scrollEnabled={false}
            renderItem={({ item }: { item: any }) => {
              const booking = item.booking || {};
              return (
                <View className="p-4 border-b border-[#243044]">
                  <View className="flex-row items-start">
                    <View className="w-12 h-12 rounded-xl bg-[#8B6BFF]/20 items-center justify-center">
                      <Ticket color="#A993FF" size={22} />
                    </View>
                    <View className="ml-3 flex-1">
                      <View className="flex-row justify-between">
                        <Text className="text-white font-semibold flex-1 pr-2">
                          {booking.fullname || booking.email || "Checked-in attendee"}
                        </Text>
                        <View className={item.duplicate ? "bg-amber-500/20 rounded-full px-3 py-1" : "bg-primary/20 rounded-full px-3 py-1"}>
                          <Text className={item.duplicate ? "text-amber-300 text-xs font-bold" : "text-primary text-xs font-bold"}>
                            {item.duplicate ? "OVERRIDE" : "VERIFIED"}
                          </Text>
                        </View>
                      </View>
                      <Info icon={<Ticket color="#728097" size={15} />} text={`${booking.ticket?.name || "Ticket"} · ${booking.code || "No code"}`} />
                      <Info icon={<CalendarDays color="#728097" size={15} />} text={`Checked in ${formatDate(item.checked_in_at)}`} />
                    </View>
                  </View>
                </View>
              );
            }}
          />
        ) : (
          <View className="p-8 items-center">
            <Users color="#8B6BFF" size={36} />
            <Text className="text-white text-lg font-semibold mt-3">No check-ins yet</Text>
            <Text className="text-gray-400 text-center mt-1">
              Arrivals will appear here as your team checks attendees in.
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
