import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Mail,
  MessageSquare,
  Search,
  Send,
  StickyNote,
  Ticket,
  UserRound,
  Users,
  X,
} from "lucide-react-native";
import ProfileFoundationScreen from "@/app/components/profile/ProfileFoundationScreen";
import {
  useGetOrganizerAttendeesQuery,
  useSaveAttendeeNoteMutation,
} from "@/redux/api/eventsApiSlice";
import type { OrganizerAttendee } from "@/types/bookings";
import { formatDate } from "@/utils/formatDate";

const PAGE_SIZE = 12;
const segments = [
  { label: "All", value: "ALL" },
  { label: "Upcoming", value: "UPCOMING" },
  { label: "Repeat", value: "REPEAT" },
  { label: "Past", value: "PAST" },
  { label: "Pending", value: "PENDING" },
];

const sorts = [
  { label: "Recent", sortBy: "lastBookingAt", sortDirection: "desc" },
  { label: "Repeat", sortBy: "bookingCount", sortDirection: "desc" },
  { label: "Spend", sortBy: "totalSpend", sortDirection: "desc" },
] as const;

function parseBody(data: any) {
  const body = data?.body || {};
  return {
    currentPage: Number(body.currentPage || 1),
    metrics: body.metrics || {},
    rows: (Array.isArray(body.result) ? body.result : []) as OrganizerAttendee[],
    segmentCounts: body.segments || {},
    totalItems: Number(body.totalItems || 0),
    totalPages: Math.max(1, Number(body.totalPages || 1)),
  };
}

function money(value?: unknown) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function mailTemplate(attendee: OrganizerAttendee) {
  const name = attendee.name || "there";
  const eventTitle = attendee.lastEvent?.title || "your upcoming event";
  return `mailto:${encodeURIComponent(attendee.email || "")}?subject=${encodeURIComponent(
    `Update about ${eventTitle}`
  )}&body=${encodeURIComponent(
    `Hi ${name},\n\nThanks for being part of ${eventTitle}. We wanted to share a quick update with you.\n\nBest,\nGatherPlus organizer`
  )}`;
}

export default function OrganizerAttendeesScreen() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState("ALL");
  const [sort, setSort] = useState<(typeof sorts)[number]>(sorts[0]);
  const [selected, setSelected] = useState<OrganizerAttendee | null>(null);
  const [note, setNote] = useState("");
  const [pinned, setPinned] = useState(false);

  const { data, isFetching, isLoading, refetch } = useGetOrganizerAttendeesQuery({
    page,
    search,
    segment,
    size: PAGE_SIZE,
    sortBy: sort.sortBy,
    sortDirection: sort.sortDirection,
  });
  const [saveNote, { isLoading: isSavingNote }] = useSaveAttendeeNoteMutation();
  const { metrics, rows, segmentCounts, totalPages } = useMemo(() => parseBody(data), [data]);

  const handleOpenNote = (attendee: OrganizerAttendee) => {
    setSelected(attendee);
    setNote("");
    setPinned(false);
  };

  const handleSaveNote = async () => {
    if (!selected?.email || !note.trim()) {
      Alert.alert("Note required", "Choose an attendee and enter a private note.");
      return;
    }

    try {
      await saveNote({
        attendee_email: selected.email,
        attendee_name: selected.name,
        event_id: selected.lastEvent?.id || null,
        note,
        pinned,
      }).unwrap();
      setNote("");
      setPinned(false);
      setSelected(null);
      refetch();
      Alert.alert("Note saved", "The attendee note was saved privately.");
    } catch (error: any) {
      Alert.alert("Could not save note", error?.data?.body || "Please try again.");
    }
  };

  const handleMessage = async (attendee: OrganizerAttendee) => {
    if (!attendee.email) {
      Alert.alert("No email", "This attendee does not have a safe email address on file.");
      return;
    }
    const url = mailTemplate(attendee);
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert("Email unavailable", "No email app is available on this device.");
      return;
    }
    await Linking.openURL(url);
  };

  return (
    <ProfileFoundationScreen
      isLoading={isLoading}
      title="Attendee CRM"
      subtitle="Segment buyers, keep private notes, and follow up safely."
      stats={[
        { label: "Attendees", value: metrics.totalAttendees || 0 },
        { label: "Repeat", value: metrics.repeatAttendees || 0 },
        { label: "Bookings", value: metrics.totalBookings || 0 },
        { label: "Spend", value: money(metrics.totalSpend) },
      ]}
    >
      <View className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden">
        <View className="p-4 border-b border-[#243044]">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-white text-xl font-semibold">Attendee directory</Text>
              <Text className="text-gray-400 mt-1">
                Search by name, email, booking code, or event.
              </Text>
            </View>
            {isFetching ? <ActivityIndicator color="#9EDD45" /> : null}
          </View>

          <View className="flex-row items-center bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-3 mt-4">
            <Search color="#8B6BFF" size={18} />
            <TextInput
              className="flex-1 text-white py-3 ml-2"
              placeholder="Search attendees"
              placeholderTextColor="#728097"
              value={search}
              onChangeText={(value) => {
                setPage(1);
                setSearch(value);
              }}
            />
          </View>

          <View className="flex-row flex-wrap gap-2 mt-3">
            {segments.map((item) => (
              <TouchableOpacity
                key={item.value}
                className={`rounded-full px-4 py-2 border ${
                  segment === item.value ? "bg-primary border-primary" : "border-[#2E3A4D]"
                }`}
                onPress={() => {
                  setPage(1);
                  setSegment(item.value);
                }}
              >
                <Text className={segment === item.value ? "text-background font-bold" : "text-gray-300 font-semibold"}>
                  {item.label} {segmentCounts[item.value] ?? ""}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="flex-row flex-wrap gap-2 mt-3">
            {sorts.map((item) => (
              <TouchableOpacity
                key={item.label}
                className={`rounded-full px-4 py-2 border ${
                  sort.label === item.label ? "bg-[#8B6BFF] border-[#8B6BFF]" : "border-[#2E3A4D]"
                }`}
                onPress={() => {
                  setPage(1);
                  setSort(item);
                }}
              >
                <Text className={sort.label === item.label ? "text-white font-bold" : "text-gray-300 font-semibold"}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {rows.length ? (
          rows.map((attendee) => (
            <View key={attendee.key} className="p-4 border-b border-[#243044]">
              <TouchableOpacity
                className="flex-row items-start"
                onPress={() =>
                  router.push(
                    `/profile/attendees/${encodeURIComponent(attendee.email || attendee.key)}` as any
                  )
                }
              >
                <View className="w-12 h-12 rounded-xl bg-[#8B6BFF]/20 items-center justify-center">
                  <UserRound color="#A993FF" size={23} />
                </View>
                <View className="ml-3 flex-1">
                  <View className="flex-row items-start justify-between">
                    <Text className="text-white text-lg font-semibold flex-1 pr-2">
                      {attendee.name || "Guest attendee"}
                    </Text>
                    <View className="bg-primary/20 rounded-full px-3 py-1">
                      <Text className="text-primary text-xs font-bold">
                        {attendee.segment || "ATTENDEE"}
                      </Text>
                    </View>
                  </View>
                  <Info icon={<Mail color="#728097" size={15} />} text={attendee.email || "No email"} />
                  <Info
                    icon={<Ticket color="#728097" size={15} />}
                    text={`${attendee.bookingCount || 0} booking${attendee.bookingCount === 1 ? "" : "s"} · ${attendee.eventCount || 0} event${attendee.eventCount === 1 ? "" : "s"}`}
                  />
                  <Info
                    icon={<CalendarDays color="#728097" size={15} />}
                    text={`Last booking ${formatDate(attendee.lastBookingAt)}`}
                  />
                  {attendee.latestNote ? (
                    <View className="bg-[#0B1020] border border-[#2E3A4D] rounded-xl p-3 mt-3">
                      <Text className="text-[#A993FF] text-xs font-bold uppercase tracking-[2px]">
                        Latest note
                      </Text>
                      <Text className="text-gray-300 mt-1">{attendee.latestNote.note}</Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>

              <View className="flex-row gap-2 mt-4">
                <TouchableOpacity
                  className="bg-primary rounded-xl px-4 py-3 flex-row items-center"
                  onPress={() => handleOpenNote(attendee)}
                >
                  <StickyNote color="#020817" size={16} />
                  <Text className="text-background font-bold ml-2">Note</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 flex-row items-center"
                  onPress={() => handleMessage(attendee)}
                >
                  <MessageSquare color="#E5E7EB" size={16} />
                  <Text className="text-white font-semibold ml-2">Message</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 flex-row items-center"
                  onPress={() =>
                    router.push(
                      `/profile/attendees/${encodeURIComponent(attendee.email || attendee.key)}` as any
                    )
                  }
                >
                  <Text className="text-white font-semibold">Open</Text>
                  <ChevronRight color="#E5E7EB" size={17} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View className="p-8 items-center">
            <Users color="#8B6BFF" size={38} />
            <Text className="text-white text-lg font-semibold mt-4">No attendees found</Text>
            <Text className="text-gray-400 text-center mt-2">
              Attendees will appear here after people book tickets for your events.
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

      <NoteModal
        attendee={selected}
        isSaving={isSavingNote}
        note={note}
        pinned={pinned}
        onChangeNote={setNote}
        onClose={() => setSelected(null)}
        onSave={handleSaveNote}
        onTogglePinned={() => setPinned((current) => !current)}
      />
    </ProfileFoundationScreen>
  );
}

function NoteModal({
  attendee,
  isSaving,
  note,
  onChangeNote,
  onClose,
  onSave,
  onTogglePinned,
  pinned,
}: {
  attendee: OrganizerAttendee | null;
  isSaving: boolean;
  note: string;
  onChangeNote: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  onTogglePinned: () => void;
  pinned: boolean;
}) {
  return (
    <Modal animationType="fade" transparent visible={Boolean(attendee)} onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-center px-5">
        <View className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden">
          <View className="p-4 border-b border-[#243044] flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-white text-xl font-semibold">Private note</Text>
              <Text className="text-gray-400 mt-1">{attendee?.name || attendee?.email || "Attendee"}</Text>
            </View>
            <TouchableOpacity className="bg-[#1A2432] rounded-full p-2" onPress={onClose}>
              <X color="#E5E7EB" size={18} />
            </TouchableOpacity>
          </View>
          <View className="p-4">
            <TextInput
              className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white min-h-[130px]"
              multiline
              placeholder="Add context, follow-up needs, VIP signal, or staff instruction"
              placeholderTextColor="#728097"
              textAlignVertical="top"
              value={note}
              onChangeText={onChangeNote}
            />
            <TouchableOpacity
              className="border border-[#2E3A4D] rounded-xl px-4 py-3 mt-3 flex-row items-center"
              onPress={onTogglePinned}
            >
              <View className={`w-5 h-5 rounded-full mr-3 ${pinned ? "bg-primary" : "bg-[#0B1020]"}`} />
              <Text className="text-gray-300 font-semibold">Pin this note</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-primary rounded-xl py-4 mt-4 flex-row items-center justify-center disabled:opacity-60"
              disabled={isSaving}
              onPress={onSave}
            >
              {isSaving ? (
                <ActivityIndicator color="#020817" />
              ) : (
                <>
                  <Send color="#020817" size={17} />
                  <Text className="text-background font-bold ml-2">Save note</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
