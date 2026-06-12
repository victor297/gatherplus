import React, { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Linking,
  Alert,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Ticket,
  MapPin,
  Edit2,
  AlertTriangle,
  Bell,
  Mail,
  MessageSquare,
} from "lucide-react-native";
import ProgressSteps from "@/app/components/create/ProgressSteps";
import {
  useCreateNewEventMutation,
  useGetNewEventQuery,
  useUpdateNewEventMutation,
} from "@/redux/api/newEventsApiSlice";
import EventMapPreview from "@/app/components/EventMapPreview";
import { buildNewEventPayload, needsOnline, needsVenue } from "@/utils/newEventForm";
import { getApiErrorMessage } from "@/utils/api";
import type { CreateEventV2Payload } from "@/types/events";

const RECENT_EVENT_CREATE_KEY = "gatherplus.recentEventCreate.v1";
const DUPLICATE_CREATE_WINDOW_MS = 10 * 60 * 1000;

type RecentEventCreate = {
  createdAt: number;
  eventId?: number | string;
  fingerprint: string;
  title?: string;
};

const normalizeFingerprintText = (value: unknown) =>
  String(value || "").trim().toLowerCase().replace(/\s+/g, " ");

const hashText = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

const createEventFingerprint = (
  payload: CreateEventV2Payload,
  published: boolean
) => {
  const sessions = Array.isArray(payload.sessions)
    ? payload.sessions.map((session) => ({
        date: session.date,
        end_date: session.end_date,
        end_time: session.end_time,
        start_time: session.start_time,
      }))
    : [];
  const tickets = Array.isArray(payload.tickets)
    ? payload.tickets.map((ticket) => ({
        name: normalizeFingerprintText(ticket.name),
        price: Number(ticket.price || 0),
        quantity: Number(ticket.quantity || 0),
      }))
    : [];

  return JSON.stringify({
    address: normalizeFingerprintText(payload.address),
    attendance_mode: payload.attendance_mode,
    category_id: payload.category_id,
    city: normalizeFingerprintText(payload.city),
    country_code: normalizeFingerprintText(payload.country_code),
    online_platform: payload.online_platform,
    published,
    sessions,
    state_id: payload.state_id,
    tickets,
    title: normalizeFingerprintText(payload.title),
  });
};

const createIdempotencyKey = (fingerprint: string) =>
  `mobile-event-create-${hashText(fingerprint)}`;

const readRecentDuplicate = async (fingerprint: string) => {
  try {
    const raw = await AsyncStorage.getItem(RECENT_EVENT_CREATE_KEY);
    if (!raw) return null;

    const recent = JSON.parse(raw) as RecentEventCreate;
    const createdAt = Number(recent?.createdAt || 0);
    const isRecent = Date.now() - createdAt < DUPLICATE_CREATE_WINDOW_MS;

    return recent?.fingerprint === fingerprint && isRecent ? recent : null;
  } catch {
    return null;
  }
};

const rememberEventCreate = async (
  fingerprint: string,
  payload: CreateEventV2Payload,
  response: any
) => {
  try {
    const eventId = response?.body?.id || response?.body?.event?.id;
    const recent: RecentEventCreate = {
      createdAt: Date.now(),
      eventId,
      fingerprint,
      title: String(payload.title || ""),
    };
    await AsyncStorage.setItem(RECENT_EVENT_CREATE_KEY, JSON.stringify(recent));
  } catch {
    // Local duplicate warning is best-effort; saving the event must not fail here.
  }
};

const compactText = (value: unknown) =>
  String(value || "").trim().replace(/\s+/g, " ");

const changed = (before: unknown, after: unknown) =>
  compactText(before).toLowerCase() !== compactText(after).toLowerCase();

const mobileSoldEventChangeLabels = (existing: any, draft: any) => {
  if (!existing) return [];
  const labels: string[] = [];
  const add = (label: string, before: unknown, after: unknown) => {
    if (changed(before, after) && !labels.includes(label)) labels.push(label);
  };

  add("Title", existing.title, draft.title);
  add("Summary", existing.summary, draft.summary);
  add("Description", existing.description, draft.description);
  add("Event format", existing.attendance_mode, draft.attendance_mode);
  add("Venue city", existing.city, draft.city);
  add("Venue address", existing.address, draft.address);
  add("Online access", existing.online_access_instructions, draft.online_access_instructions);
  add("Online platform", existing.online_platform, draft.online_platform);
  add("Door time", existing.door_time, draft.door_time);
  add("Parking", existing.parking_info, draft.parking_info);

  if (
    JSON.stringify(existing.sessions || []) !== JSON.stringify(draft.sessions || [])
  ) {
    labels.push("Schedule/sessions");
  }

  if (JSON.stringify(existing.faqs || []) !== JSON.stringify(draft.faqs || [])) {
    labels.push("FAQs");
  }

  return labels.slice(0, 8);
};

export default function ReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const eventId = Array.isArray(params.eventId) ? params.eventId[0] : params.eventId;
  const [createNewEvent, { isLoading, error }] = useCreateNewEventMutation();
  const [updateNewEvent, { isLoading: isUpdating, error: updateError }] =
    useUpdateNewEventMutation();
  const [submitMode, setSubmitMode] = useState<"draft" | "publish" | null>(null);
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
  const { data: currentEventResponse } = useGetNewEventQuery(eventId || "", {
    skip: !eventId,
  });
  const currentEvent = currentEventResponse?.body || null;
  const soldEventAttendeeCount = Number(
    currentEvent?.totalTicketsSold ||
      currentEvent?.total_sold ||
      currentEvent?.sold ||
      0
  );
  const soldEventHasAttendees = Boolean(eventId && soldEventAttendeeCount > 0);
  const soldChangeLabels = mobileSoldEventChangeLabels(currentEvent, formData);
  const faqs = Array.isArray(formData?.faqs)
    ? formData.faqs.filter((faq: any) => faq?.question || faq?.answer)
    : [];
  const hasExtraDetails = Boolean(
    formData.tags ||
      formData.door_time ||
      formData.parking_info ||
      formData.discount_info ||
      formData.agenda_info ||
      faqs.length
  );

  const submitEvent = async (
    published: boolean,
    payload: CreateEventV2Payload,
    idempotencyKey: string,
    fingerprint: string,
    allowDuplicate = false
  ) => {
    try {
      setSubmitMode(published ? "publish" : "draft");
      const res = eventId
        ? await updateNewEvent({ id: eventId, data: payload }).unwrap()
        : await createNewEvent({
            allowDuplicate,
            data: payload,
            idempotencyKey,
          }).unwrap();

      if (res?.error) {
        throw new Error(String(res.body || "Failed to create event"));
      }

      if (!eventId) {
        await rememberEventCreate(fingerprint, payload, res);
      }

      router.push("/success");
    } catch (error) {
      console.log("Event creation failed:", error);
      Alert.alert("Event creation failed", getApiErrorMessage(error, "Please check the event details and try again."));
    } finally {
      setSubmitMode(null);
    }
  };

  const handleSubmit = async (published: boolean) => {
    if (submitMode || isLoading || isUpdating) return;

    const channels = [
      soldNotifyEmail ? "email" : null,
      soldNotifySms ? "sms" : null,
    ].filter(Boolean) as Array<"email" | "sms">;
    const payload = {
      ...buildNewEventPayload(formData, published),
      ...(eventId && soldEventHasAttendees && published
        ? {
            sold_event_notification: {
              channels,
              organizer_note: soldOrganizerNote.trim() || undefined,
              source: "mobile_change_review",
              urgent: soldUrgent,
            },
          }
        : {}),
    };
    const fingerprint = createEventFingerprint(payload, published);
    const idempotencyKey = createIdempotencyKey(fingerprint);

    if (eventId && soldEventHasAttendees && published) {
      if (!channels.length) {
        Alert.alert(
          "Choose a channel",
          "Select email, SMS, or both before updating a sold event."
        );
        return;
      }

      Alert.alert(
        "Notify attendees?",
        `${soldEventAttendeeCount.toLocaleString()} buyer${soldEventAttendeeCount === 1 ? "" : "s"} may be affected. The update will be audited and attendee notifications will be recorded in Delivery Log.`,
        [
          { text: "Keep reviewing", style: "cancel" },
          {
            text: "Save and notify",
            onPress: () =>
              void submitEvent(published, payload, idempotencyKey, fingerprint),
          },
        ]
      );
      return;
    }

    if (!eventId) {
      const recentDuplicate = await readRecentDuplicate(fingerprint);

      if (recentDuplicate) {
        Alert.alert(
          "Possible duplicate event",
          "You recently created an event with the same title, date, ticket setup, and location. Open your event list to edit it, or continue if you really need another copy.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Create anyway",
              style: "destructive",
              onPress: () =>
                void submitEvent(
                  published,
                  payload,
                  `${idempotencyKey}-${Date.now()}`,
                  fingerprint,
                  true
                ),
            },
          ]
        );
        return;
      }
    }

    await submitEvent(published, payload, idempotencyKey, fingerprint);
  };

  const handleEdit = () => {
    router.push({
      pathname: "/create",
      params: { formData: JSON.stringify(formData), eventId: eventId || "" },
    });
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
        <Text className="text-white text-xl font-semibold">
          {eventId ? "Edit Event" : "Create Event"}
        </Text>
        {/* <TouchableOpacity onPress={handleEdit} className="ml-auto">
          <Edit2 color="white" size={20} />
        </TouchableOpacity> */}
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
            <Text className="text-gray-300 mb-3">
              {formData?.summary || "Event summary not provided"}
            </Text>
            <Text className="text-gray-400">
              {formData?.description || "Event description not provided"}
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-2">
              Event Format
            </Text>
            <View className="bg-[#1A2432] rounded-lg p-4">
              <Text className="text-white">
                {formData.attendance_mode || "VENUE"}
              </Text>
              {needsOnline(formData.attendance_mode) && (
                <View className="mt-3">
                  <Text className="text-gray-400">
                    {formData.online_platform || "Online platform"}
                  </Text>
                  <Text className="text-gray-400 mt-1">
                    {formData.online_timezone || "Timezone not set"}
                  </Text>
                  <Text className="text-gray-400 mt-1">
                    {formData.online_access_instructions ||
                      "Access instructions not set"}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Location */}
          {needsVenue(formData.attendance_mode) && (
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
          )}

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

          {hasExtraDetails && (
            <View className="mb-6">
              <Text className="text-white text-lg font-semibold mb-2">
                Extra Details
              </Text>
              <View className="bg-[#1A2432] rounded-lg p-4">
                {!!formData.tags && (
                  <Text className="text-gray-400 mb-2">
                    Tags: {formData.tags}
                  </Text>
                )}
                {!!formData.door_time && (
                  <Text className="text-gray-400 mb-2">
                    Door: {formData.door_time}
                  </Text>
                )}
                {!!formData.parking_info && (
                  <Text className="text-gray-400 mb-2">
                    Parking: {formData.parking_info}
                  </Text>
                )}
                {!!formData.discount_info && (
                  <Text className="text-gray-400 mb-2">
                    Lineup: {formData.discount_info}
                  </Text>
                )}
                {!!formData.agenda_info && (
                  <Text className="text-gray-400">
                    Agenda: {formData.agenda_info}
                  </Text>
                )}
                {faqs.length > 0 && (
                  <View className="mt-3">
                    {faqs.map((faq: any, index: number) => (
                      <View key={index} className="mb-2">
                        <Text className="text-white">{faq.question}</Text>
                        <Text className="text-gray-400">{faq.answer}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {soldEventHasAttendees && (
            <SoldEventNotificationCard
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
      {(error || updateError) && (
        <View className="p-4">
          <Text className="text-red-500 text-center">
            {getApiErrorMessage(error || updateError, "Failed to save event")}
          </Text>
        </View>
      )}

      {/* Save & Continue Button */}
      <View className="p-4 border-t border-[#1A2432] gap-3">
        <TouchableOpacity
          className={`rounded-lg py-4 ${isLoading || isUpdating ? "bg-gray-500" : "bg-[#1A2432]"}`}
          onPress={() => handleSubmit(false)}
          disabled={isLoading || isUpdating}
        >
          {(isLoading || isUpdating) && submitMode === "draft" ? (
            <ActivityIndicator color="#9EDD45" />
          ) : (
            <Text className="text-white text-center font-semibold">
              {eventId ? "Update Draft" : "Save Draft"}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          className={`rounded-lg py-4 ${
            isLoading || isUpdating ? "bg-gray-500" : "bg-primary"
          }`}
          onPress={() => handleSubmit(true)}
          disabled={isLoading || isUpdating}
        >
          {(isLoading || isUpdating) && submitMode === "publish" ? (
            <ActivityIndicator color="#020E1E" />
          ) : (
            <Text className="text-background text-center font-semibold">
              {eventId ? "Update & Publish" : "Publish Event"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SoldEventNotificationCard({
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
            currency, capacity, ticket design, and ticket identity rules remain
            locked.
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
        <MobileReviewToggle
          checked={emailSelected}
          icon={<Mail color="#9EDD45" size={16} />}
          label="Email attendees"
          onPress={() => onToggleEmail(!emailSelected)}
          text="Recommended for every sold-event update."
        />
        <MobileReviewToggle
          checked={smsSelected}
          icon={<MessageSquare color="#9EDD45" size={16} />}
          label="SMS for urgent changes"
          onPress={() => onToggleSms(!smsSelected)}
          text="Best for venue, time, and access corrections."
        />
        <MobileReviewToggle
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

function MobileReviewToggle({
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
