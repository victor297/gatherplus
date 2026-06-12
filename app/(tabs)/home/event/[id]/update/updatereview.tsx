import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Ticket,
  MapPin,
  AlertTriangle,
  Bell,
  Mail,
  MessageSquare,
} from "lucide-react-native";
import ProgressSteps from "@/app/components/create/ProgressSteps";
import {
  useGetNewEventQuery,
  useUpdateNewEventMutation,
} from "@/redux/api/newEventsApiSlice";
import EventMapPreview from "@/app/components/EventMapPreview";
import { getStringParam } from "@/utils/routeParams";
import { buildNewEventPayload } from "@/utils/newEventForm";
import { getApiErrorMessage } from "@/utils/api";

const legacyChanged = (before: unknown, after: unknown) =>
  String(before || "").trim().toLowerCase() !==
  String(after || "").trim().toLowerCase();

const legacySoldChangeLabels = (existing: any, draft: any) => {
  if (!existing) return [];
  const labels: string[] = [];
  const add = (label: string, before: unknown, after: unknown) => {
    if (legacyChanged(before, after) && !labels.includes(label)) labels.push(label);
  };

  add("Title", existing.title, draft.title);
  add("Description", existing.description, draft.description);
  add("Venue city", existing.city, draft.city);
  add("Venue address", existing.address, draft.address);
  add("Door time", existing.door_time, draft.door_time);
  add("Online access", existing.online_access_instructions, draft.online_access_instructions);

  if (
    JSON.stringify(existing.sessions || []) !== JSON.stringify(draft.sessions || [])
  ) {
    labels.push("Schedule/sessions");
  }

  return labels.slice(0, 8);
};

export default function ReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const eventId = getStringParam(params.id);
  const [updateevent, { isLoading, error }] = useUpdateNewEventMutation();
  const { data: currentEventResponse } = useGetNewEventQuery(eventId, {
    skip: !eventId,
  });
  const [soldNotifyEmail, setSoldNotifyEmail] = useState(true);
  const [soldNotifySms, setSoldNotifySms] = useState(true);
  const [soldUrgent, setSoldUrgent] = useState(false);
  const [soldOrganizerNote, setSoldOrganizerNote] = useState("");
  const [formData, setFormData] = useState(() => {
    try {
      return params.formData ? JSON.parse(params.formData as string) : {};
    } catch (error) {
      console.error("Error parsing formData:", error);
      return {};
    }
  });
  const currentEvent = currentEventResponse?.body || null;
  const soldEventAttendeeCount = Number(
    currentEvent?.totalTicketsSold ||
      currentEvent?.total_sold ||
      currentEvent?.sold ||
      0
  );
  const soldEventHasAttendees = soldEventAttendeeCount > 0;
  const soldChangeLabels = legacySoldChangeLabels(currentEvent, formData);
  const submitUpdate = async (payload: ReturnType<typeof buildNewEventPayload>) => {
    const res = await updateevent({ data: payload, id: eventId }).unwrap();
    if (res?.error) {
      throw new Error(String(res.body || "Failed to update event"));
    }
    router.replace("/success");
  };

  const handleSubmit = async () => {
    try {
      const channels = [
        soldNotifyEmail ? "email" : null,
        soldNotifySms ? "sms" : null,
      ].filter(Boolean) as Array<"email" | "sms">;
      if (soldEventHasAttendees && !channels.length) {
        Alert.alert(
          "Choose a channel",
          "Select email, SMS, or both before updating a sold event."
        );
        return;
      }

      const payload = {
        ...buildNewEventPayload(formData, true),
        ...(soldEventHasAttendees
          ? {
              sold_event_notification: {
                channels,
                organizer_note: soldOrganizerNote.trim() || undefined,
                source: "mobile_legacy_change_review",
                urgent: soldUrgent,
              },
            }
          : {}),
      };

      if (soldEventHasAttendees) {
        Alert.alert(
          "Notify attendees?",
          `${soldEventAttendeeCount.toLocaleString()} buyer${soldEventAttendeeCount === 1 ? "" : "s"} may be affected. The update will be audited and recorded in Delivery Log.`,
          [
            { text: "Keep reviewing", style: "cancel" },
            {
              text: "Save and notify",
              onPress: () => {
                void submitUpdate(payload);
              },
            },
          ]
        );
        return;
      }

      await submitUpdate(payload);
    } catch (error) {
      console.error("Event update failed:", error);
      Alert.alert("Event update failed", getApiErrorMessage(error, "Please check the event details and try again."));
    }
  };

  const openMaps = () => {
    const address = encodeURIComponent(
      `${formData.address}, ${formData.city}, ${formData.country_code}`
    );
    const url = `https://www.google.com/maps/search/?api=1&query=${address}`;
    Linking.openURL(url).catch((err) =>
      console.error("Couldn't load page", err)
    );
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-4 bg-[#1A2432] p-2 rounded-full"
        >
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">Update Event</Text>
      </View>

      <ProgressSteps currentStep={3} />

      {/* Content */}
      <ScrollView className="flex-1">
        <Image
          source={{
            uri:
              formData?.images?.[0] ||
              "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3",
          }}
          className="w-full h-48"
          resizeMode="cover"
        />

        <View className="p-4">
          {/* Event Header */}
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text className="text-white text-2xl font-bold">
                {formData?.title || "Event Title"}
              </Text>
              <Text className="text-gray-400">
                {formData?.address || "Event Venue"}
              </Text>
            </View>
            <View className="bg-[#1A2432] px-3 py-1 rounded-full">
              <Text className="text-white">
                {formData.eventCategory || "Category"}
              </Text>
            </View>
          </View>

          {/* About Event */}
          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-2">
              About Event
            </Text>
            <Text className="text-gray-400">
              {formData?.description || "Event description not provided"}
            </Text>
          </View>

          {/* Location */}
          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-2">
              Location
            </Text>
            <View className="bg-[#1A2432] rounded-lg p-4">
              <View className="flex-row items-start mb-2">
                <MapPin size={20} color="#6B7280" className="mr-2 mt-1" />
                <View>
                  <Text className="text-white">
                    {formData?.address || "Venue address"}
                  </Text>
                  <Text className="text-gray-400">
                    {formData?.city}, {formData?.country_code}
                  </Text>
                </View>
              </View>
              <EventMapPreview
                address={formData?.address}
                city={formData?.city}
              />
              <TouchableOpacity onPress={openMaps} className="self-end">
                <Text className="text-primary">View map</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date and Time */}
          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-2">
              Date and Time
            </Text>
            {formData?.sessions?.length > 0 && (
              <Text className="text-gray-400 mb-3">
                {formData.sessions.length > 1
                  ? "This is a multiple session event"
                  : "Single session event"}
              </Text>
            )}

            {formData?.sessions?.length > 0 ? (
              formData.sessions.map((session: any, index: any) => (
                <View key={index} className="bg-[#1A2432] rounded-lg p-4 mb-3">
                  <Text className="text-white mb-3">
                    {session.name || `Session ${index + 1}`}
                  </Text>
                  <View className="flex-row items-center mb-2">
                    <Calendar size={18} color="#6B7280" className="mr-2" />
                    <Text className="text-gray-400">
                      {session.date || "No date set"}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Clock size={18} color="#6B7280" className="mr-2" />
                    <Text className="text-gray-400">
                      {session.start_time || "--:--"} -
                      {session.end_time || "--:--"}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text className="text-gray-400">No sessions available</Text>
            )}
          </View>

          {/* Ticket Information */}
          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-2">
              Ticket Information
            </Text>
            {formData?.tickets?.length > 0 ? (
              <>
                <View className="flex-row justify-between mb-3">
                  <Text className="text-gray-400">Numbers of Tickets</Text>
                  <Text className="text-white">
                    {formData.tickets
                      .reduce(
                        (sum: number, ticket: any) =>
                          sum + (parseInt(ticket.quantity) || 0),
                        0
                      )
                      .toLocaleString()}
                  </Text>
                </View>

                {formData.tickets.map((ticket: any, index: any) => (
                  <View
                    key={index}
                    className="flex-row justify-between items-center bg-[#1A2432] p-4 rounded-lg mb-2"
                  >
                    <View className="flex-row items-center">
                      <Ticket size={18} color="#6B7280" className="mr-3" />
                      <Text className="text-white">
                        {ticket.name}
                        {ticket.seat_type ? `(${ticket.seat_type})` : ""}
                      </Text>
                    </View>
                    <Text className="text-primary">
                      {formData?.currency?.split(" - ")[0]}
                      {parseInt(ticket.price).toLocaleString()} each
                    </Text>
                  </View>
                ))}
              </>
            ) : (
              <Text className="text-gray-400">No tickets available</Text>
            )}
          </View>

          {soldEventHasAttendees && (
            <LegacySoldEventNotificationCard
              affectedAttendees={soldEventAttendeeCount}
              changeLabels={soldChangeLabels}
              emailSelected={soldNotifyEmail}
              note={soldOrganizerNote}
              onNoteChange={setSoldOrganizerNote}
              onToggleEmail={setSoldNotifyEmail}
              onToggleSms={setSoldNotifySms}
              onToggleUrgent={setSoldUrgent}
              smsSelected={soldNotifySms}
              urgent={soldUrgent}
            />
          )}
        </View>
      </ScrollView>

      {/* Error Message */}
      {error && (
        <View className="p-4">
          <Text className="text-red-500 text-center">
            {(error as any)?.data?.message || "Failed to create event"}
          </Text>
        </View>
      )}

      {/* Save & Continue Button */}
      <View className="p-4 border-t border-[#1A2432]">
        <TouchableOpacity
          className={`rounded-lg py-4 ${
            isLoading ? "bg-gray-500" : "bg-primary"
          }`}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#9EDD45" />
          ) : (
            <Text className="text-background text-center font-semibold">
              Save and continue
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function LegacySoldEventNotificationCard({
  affectedAttendees,
  changeLabels,
  emailSelected,
  note,
  onNoteChange,
  onToggleEmail,
  onToggleSms,
  onToggleUrgent,
  smsSelected,
  urgent,
}: {
  affectedAttendees: number;
  changeLabels: string[];
  emailSelected: boolean;
  note: string;
  onNoteChange: (value: string) => void;
  onToggleEmail: (value: boolean) => void;
  onToggleSms: (value: boolean) => void;
  onToggleUrgent: (value: boolean) => void;
  smsSelected: boolean;
  urgent: boolean;
}) {
  return (
    <View className="mb-6 bg-[#111823] border border-[#2E3A4D] rounded-2xl p-4">
      <View className="flex-row items-start">
        <View className="w-10 h-10 rounded-full bg-[#9EDD45]/15 items-center justify-center mr-3">
          <AlertTriangle color="#9EDD45" size={20} />
        </View>
        <View className="flex-1">
          <Text className="text-[#8B6BFF] text-xs font-bold tracking-[3px]">
            SOLD EVENT REVIEW
          </Text>
          <Text className="text-white text-lg font-semibold mt-1">
            Notify attendees before saving
          </Text>
          <Text className="text-gray-400 mt-2 leading-5">
            {affectedAttendees.toLocaleString()} buyer
            {affectedAttendees === 1 ? "" : "s"} may be affected. Ticket price,
            capacity, design, currency, and identity rules remain locked.
          </Text>
        </View>
      </View>

      <View className="mt-4 bg-[#1A2432] rounded-xl p-3">
        <Text className="text-white font-semibold mb-2">Detected changes</Text>
        {changeLabels.length ? (
          changeLabels.map((label) => (
            <Text key={label} className="text-gray-400 mb-1">
              - {label}
            </Text>
          ))
        ) : (
          <Text className="text-gray-500">No attendee-visible changes detected.</Text>
        )}
      </View>

      <View className="mt-4 gap-3">
        <LegacyReviewToggle
          checked={emailSelected}
          icon={<Mail color="#9EDD45" size={16} />}
          label="Email attendees"
          onPress={() => onToggleEmail(!emailSelected)}
          text="Recommended for every sold-event update."
        />
        <LegacyReviewToggle
          checked={smsSelected}
          icon={<MessageSquare color="#9EDD45" size={16} />}
          label="SMS for urgent changes"
          onPress={() => onToggleSms(!smsSelected)}
          text="Best for venue, time, and access corrections."
        />
        <LegacyReviewToggle
          checked={urgent}
          icon={<Bell color="#9EDD45" size={16} />}
          label="Mark urgent"
          onPress={() => onToggleUrgent(!urgent)}
          text="Adds urgency to attendee messages."
        />
      </View>

      <Text className="text-white font-semibold mt-4 mb-2">Organizer note</Text>
      <TextInput
        className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white min-h-[96px]"
        maxLength={600}
        multiline
        onChangeText={onNoteChange}
        placeholder="Example: Entrance changed to Hall B. Please arrive early."
        placeholderTextColor="#6B7280"
        textAlignVertical="top"
        value={note}
      />
      <Text className="text-gray-500 text-right mt-1">{note.length}/600</Text>
    </View>
  );
}

function LegacyReviewToggle({
  checked,
  icon,
  label,
  onPress,
  text,
}: {
  checked: boolean;
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  text: string;
}) {
  return (
    <TouchableOpacity
      className={`border rounded-xl p-3 flex-row items-start ${
        checked ? "border-primary bg-primary/10" : "border-[#2E3A4D] bg-[#1A2432]"
      }`}
      onPress={onPress}
    >
      <View className="mt-1 mr-3">{icon}</View>
      <View className="flex-1">
        <Text className="text-white font-semibold">{label}</Text>
        <Text className="text-gray-400 text-sm mt-1">{text}</Text>
      </View>
      <View
        className={`w-5 h-5 rounded-full border items-center justify-center ${
          checked ? "border-primary bg-primary" : "border-gray-500"
        }`}
      >
        {checked && <View className="w-2 h-2 rounded-full bg-background" />}
      </View>
    </TouchableOpacity>
  );
}
