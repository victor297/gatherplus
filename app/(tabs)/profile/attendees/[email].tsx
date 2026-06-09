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
import { useLocalSearchParams } from "expo-router";
import {
  CalendarDays,
  Mail,
  MessageSquare,
  Send,
  ShieldCheck,
  StickyNote,
  Ticket,
  UserRound,
  X,
} from "lucide-react-native";
import ProfileFoundationScreen from "@/app/components/profile/ProfileFoundationScreen";
import {
  useGetOrganizerAttendeesQuery,
  useSaveAttendeeNoteMutation,
} from "@/redux/api/eventsApiSlice";
import type { OrganizerAttendee } from "@/types/bookings";
import { getStringParam } from "@/utils/routeParams";
import { formatDate } from "@/utils/formatDate";

function parseAttendee(data: any): OrganizerAttendee | null {
  const rows = Array.isArray(data?.body?.result) ? data.body.result : [];
  return rows[0] || null;
}

function money(value?: unknown) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function buildMailUrl(attendee: OrganizerAttendee, template: string) {
  const eventTitle = attendee.lastEvent?.title || "your event";
  const name = attendee.name || "there";
  const bodies: Record<string, string> = {
    followup: `Hi ${name},\n\nThank you for joining ${eventTitle}. We wanted to follow up and make sure you had everything you needed.\n\nBest,\nGatherPlus organizer`,
    reminder: `Hi ${name},\n\nThis is a quick reminder about ${eventTitle}. Please check your ticket access and arrive with your booking code ready.\n\nBest,\nGatherPlus organizer`,
    questionnaire: `Hi ${name},\n\nPlease complete your event questionnaire for ${eventTitle} when you have a moment. It helps us prepare a better experience for you.\n\nBest,\nGatherPlus organizer`,
  };
  return `mailto:${encodeURIComponent(attendee.email || "")}?subject=${encodeURIComponent(
    `Update about ${eventTitle}`
  )}&body=${encodeURIComponent(bodies[template] || bodies.followup)}`;
}

export default function AttendeeDetailScreen() {
  const { email } = useLocalSearchParams();
  const attendeeKey = decodeURIComponent(getStringParam(email));
  const [note, setNote] = useState("");
  const [pinned, setPinned] = useState(false);
  const [showNote, setShowNote] = useState(false);

  const { data, isFetching, isLoading, refetch } = useGetOrganizerAttendeesQuery({
    page: 1,
    search: attendeeKey,
    segment: "ALL",
    size: 1,
  });
  const [saveNote, { isLoading: isSavingNote }] = useSaveAttendeeNoteMutation();
  const attendee = useMemo(() => parseAttendee(data), [data]);
  const bookings = attendee?.bookings || [];
  const notes = attendee?.notes || [];

  const handleMessage = async (template: string) => {
    if (!attendee?.email) {
      Alert.alert("No email", "This attendee does not have a safe email address on file.");
      return;
    }
    const url = buildMailUrl(attendee, template);
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert("Email unavailable", "No email app is available on this device.");
      return;
    }
    await Linking.openURL(url);
  };

  const handleSaveNote = async () => {
    if (!attendee?.email || !note.trim()) {
      Alert.alert("Note required", "Enter a private note before saving.");
      return;
    }
    try {
      await saveNote({
        attendee_email: attendee.email,
        attendee_name: attendee.name,
        event_id: attendee.lastEvent?.id || null,
        note,
        pinned,
      }).unwrap();
      setNote("");
      setPinned(false);
      setShowNote(false);
      refetch();
      Alert.alert("Note saved", "The attendee note was saved privately.");
    } catch (error: any) {
      Alert.alert("Could not save note", error?.data?.body || "Please try again.");
    }
  };

  return (
    <ProfileFoundationScreen
      isLoading={isLoading || isFetching}
      title="Attendee profile"
      subtitle={attendee?.email || attendeeKey}
      stats={[
        { label: "Bookings", value: attendee?.bookingCount || 0 },
        { label: "Events", value: attendee?.eventCount || 0 },
        { label: "Spend", value: money(attendee?.totalSpend) },
        { label: "Notes", value: notes.length },
      ]}
    >
      {!attendee && !isLoading ? (
        <View className="bg-[#111823] border border-[#243044] rounded-2xl p-8 items-center">
          <UserRound color="#8B6BFF" size={38} />
          <Text className="text-white text-lg font-semibold mt-4">Attendee not found</Text>
          <Text className="text-gray-400 text-center mt-2">
            This attendee may no longer be attached to your organizer account.
          </Text>
        </View>
      ) : null}

      {attendee ? (
        <>
          <View className="bg-[#111823] border border-[#243044] rounded-2xl p-5 mb-4">
            <View className="flex-row items-start">
              <View className="w-14 h-14 rounded-2xl bg-[#8B6BFF]/20 items-center justify-center">
                <UserRound color="#A993FF" size={28} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-white text-2xl font-bold">
                  {attendee.name || "Guest attendee"}
                </Text>
                <Text className="text-gray-400 mt-1">{attendee.email || "No email"}</Text>
                <View className="flex-row flex-wrap gap-2 mt-3">
                  <Badge label={attendee.segment || "ATTENDEE"} />
                  {attendee.bookingCount > 1 ? <Badge label="Repeat attendee" accent /> : null}
                  {attendee.phone ? <Badge label={attendee.phone} /> : null}
                </View>
              </View>
            </View>

            <View className="flex-row gap-2 mt-5">
              <TouchableOpacity
                className="bg-primary rounded-xl px-4 py-3 flex-row items-center"
                onPress={() => setShowNote(true)}
              >
                <StickyNote color="#020817" size={16} />
                <Text className="text-background font-bold ml-2">Add note</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 flex-row items-center"
                onPress={() => handleMessage("followup")}
              >
                <MessageSquare color="#E5E7EB" size={16} />
                <Text className="text-white font-semibold ml-2">Message</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="bg-[#111823] border border-[#243044] rounded-2xl p-4 mb-4">
            <Text className="text-white text-xl font-semibold">Message templates</Text>
            <Text className="text-gray-400 mt-1 mb-4">
              Opens your mail app with attendee-safe copy. No customer data is exposed publicly.
            </Text>
            <View className="gap-3">
              <TemplateButton title="Event reminder" onPress={() => handleMessage("reminder")} />
              <TemplateButton title="Questionnaire nudge" onPress={() => handleMessage("questionnaire")} />
              <TemplateButton title="Follow-up message" onPress={() => handleMessage("followup")} />
            </View>
          </View>

          <View className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden mb-4">
            <View className="p-4 border-b border-[#243044]">
              <Text className="text-white text-xl font-semibold">Booking history</Text>
              <Text className="text-gray-400 mt-1">
                {bookings.length} booking{bookings.length === 1 ? "" : "s"} from this attendee.
              </Text>
            </View>
            {bookings.length ? (
              bookings.map((booking: any) => (
                <View key={booking.id || booking.code} className="p-4 border-b border-[#243044]">
                  <Text className="text-white font-semibold">
                    {booking.event?.title || "Event booking"}
                  </Text>
                  <Info icon={<Ticket color="#728097" size={15} />} text={`${booking.ticket?.name || "Ticket"} · ${booking.code || "No code"}`} />
                  <Info icon={<CalendarDays color="#728097" size={15} />} text={`Booked ${formatDate(booking.created_at)} · ${booking.status || "Booked"}`} />
                </View>
              ))
            ) : (
              <View className="p-6">
                <Text className="text-gray-400">No booking rows available.</Text>
              </View>
            )}
          </View>

          <View className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden">
            <View className="p-4 border-b border-[#243044]">
              <Text className="text-white text-xl font-semibold">Private notes</Text>
              <Text className="text-gray-400 mt-1">Visible only to your organizer account.</Text>
            </View>
            {notes.length ? (
              notes.map((item) => (
                <View key={item.id} className="p-4 border-b border-[#243044]">
                  <View className="flex-row items-center">
                    <ShieldCheck color={item.pinned ? "#9EDD45" : "#8B6BFF"} size={17} />
                    <Text className="text-gray-400 ml-2">
                      {item.pinned ? "Pinned" : "Note"} · {formatDate(item.created_at)}
                    </Text>
                  </View>
                  <Text className="text-white mt-2">{item.note}</Text>
                  {item.event?.title ? (
                    <Text className="text-gray-500 mt-2">Event: {item.event.title}</Text>
                  ) : null}
                </View>
              ))
            ) : (
              <View className="p-6">
                <Text className="text-gray-400">No notes saved yet.</Text>
              </View>
            )}
          </View>

          <NoteModal
            isSaving={isSavingNote}
            note={note}
            pinned={pinned}
            visible={showNote}
            onChangeNote={setNote}
            onClose={() => setShowNote(false)}
            onSave={handleSaveNote}
            onTogglePinned={() => setPinned((current) => !current)}
          />
        </>
      ) : null}
    </ProfileFoundationScreen>
  );
}

function Badge({ accent, label }: { accent?: boolean; label: string }) {
  return (
    <View className={accent ? "bg-primary/20 rounded-full px-3 py-1" : "bg-[#8B6BFF]/20 rounded-full px-3 py-1"}>
      <Text className={accent ? "text-primary text-xs font-bold" : "text-[#A993FF] text-xs font-bold"}>
        {label}
      </Text>
    </View>
  );
}

function TemplateButton({ onPress, title }: { onPress: () => void; title: string }) {
  return (
    <TouchableOpacity
      className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-4 flex-row items-center"
      onPress={onPress}
    >
      <Mail color="#A993FF" size={18} />
      <Text className="text-white font-semibold ml-3 flex-1">{title}</Text>
      <Send color="#E5E7EB" size={16} />
    </TouchableOpacity>
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

function NoteModal({
  isSaving,
  note,
  onChangeNote,
  onClose,
  onSave,
  onTogglePinned,
  pinned,
  visible,
}: {
  isSaving: boolean;
  note: string;
  onChangeNote: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  onTogglePinned: () => void;
  pinned: boolean;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-center px-5">
        <View className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden">
          <View className="p-4 border-b border-[#243044] flex-row items-center justify-between">
            <Text className="text-white text-xl font-semibold">Add private note</Text>
            <TouchableOpacity className="bg-[#1A2432] rounded-full p-2" onPress={onClose}>
              <X color="#E5E7EB" size={18} />
            </TouchableOpacity>
          </View>
          <View className="p-4">
            <TextInput
              className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white min-h-[130px]"
              multiline
              placeholder="Add context, VIP signal, follow-up, or staff instruction"
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
