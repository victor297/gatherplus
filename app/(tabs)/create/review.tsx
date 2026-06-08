import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Ticket,
  MapPin,
  Edit2,
} from "lucide-react-native";
import ProgressSteps from "@/app/components/create/ProgressSteps";
import {
  useCreateNewEventMutation,
  useUpdateNewEventMutation,
} from "@/redux/api/newEventsApiSlice";
import EventMapPreview from "@/app/components/EventMapPreview";
import { buildNewEventPayload, needsOnline, needsVenue } from "@/utils/newEventForm";
import { getApiErrorMessage } from "@/utils/api";

export default function ReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const eventId = Array.isArray(params.eventId) ? params.eventId[0] : params.eventId;
  const [createNewEvent, { isLoading, error }] = useCreateNewEventMutation();
  const [updateNewEvent, { isLoading: isUpdating, error: updateError }] =
    useUpdateNewEventMutation();
  const [submitMode, setSubmitMode] = useState<"draft" | "publish" | null>(null);

  const [formData, setFormData] = useState(() => {
    try {
      return params.formData ? JSON.parse(params.formData as string) : {};
    } catch (error) {
      console.error("Error parsing formData:", error);
      return {};
    }
  });

  const handleSubmit = async (published: boolean) => {
    try {
      setSubmitMode(published ? "publish" : "draft");
      const payload = buildNewEventPayload(formData, published);
      const res = eventId
        ? await updateNewEvent({ id: eventId, data: payload }).unwrap()
        : await createNewEvent(payload).unwrap();

      if (res?.error) {
        throw new Error(String(res.body || "Failed to create event"));
      }

      router.push("/success");
    } catch (error) {
      console.log("Event creation failed:", error);
      Alert.alert("Event creation failed", getApiErrorMessage(error, "Please check the event details and try again."));
    } finally {
      setSubmitMode(null);
    }
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

          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-2">
              Extra Details
            </Text>
            <View className="bg-[#1A2432] rounded-lg p-4">
              {!!formData.tags && (
                <Text className="text-gray-400 mb-2">Tags: {formData.tags}</Text>
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
              {formData?.faqs?.length > 0 && (
                <View className="mt-3">
                  {formData.faqs.map((faq: any, index: number) => (
                    <View key={index} className="mb-2">
                      <Text className="text-white">{faq.question}</Text>
                      <Text className="text-gray-400">{faq.answer}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
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
