import React, { useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { captureRef } from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";
import {
  ArrowLeft,
  ClipboardList,
  Download,
  Mail,
  Monitor,
  Phone,
  RefreshCcw,
  Ticket,
  User,
} from "lucide-react-native";
import {
  useGetBookingByIdQuery,
  useGetBookingDetailsQuery,
} from "@/redux/api/eventsApiSlice";
import { getStringParam } from "@/utils/routeParams";
import {
  canShowProtectedOnlineAccess,
  currencySymbol,
  eventHasOnlineAccess,
  formatEnumLabel,
  getAttendanceLabel,
  getOnlineRevealLabel,
} from "@/utils/eventHelpers";
import { formatDate } from "@/utils/formatDate";
import {
  MobileTicketPass,
  getTicketDesignFromBooking,
} from "@/components/tickets/TicketTemplates";

const money = (value?: unknown, currency?: unknown) => {
  const amount = Number(value || 0);
  const code = currencySymbol(String(currency || "NGN")) || "NGN";
  return amount > 0 ? `${code} ${amount.toLocaleString()}` : "Free";
};

const formatTimeRange = (start?: unknown, end?: unknown) => {
  const startText = String(start || "").trim();
  const endText = String(end || "").trim();
  if (startText && endText) return `${startText} - ${endText}`;
  return startText || endText || "Event time";
};

const getBookingLocation = (event: Record<string, any> = {}) => {
  if (String(event.attendance_mode || "").toUpperCase() === "ONLINE") {
    return "Online event";
  }

  return (
    [event.city, event.country_code].filter(Boolean).join(", ") ||
    String(event.address || "").trim() ||
    getAttendanceLabel(event)
  );
};

function TicketPass({ booking, index }: { booking: any; index: number }) {
  const router = useRouter();
  const ticketRef = useRef<View | null>(null);
  const { data: richBookingData, isFetching } = useGetBookingByIdQuery(booking?.id, {
    skip: !booking?.id,
  });
  const richBooking = richBookingData?.body || booking;
  const event = richBooking?.event || booking?.event || {};
  const code = richBooking?.code || booking?.code || String(richBooking?.id || "");
  const hasOnlineAccess = eventHasOnlineAccess(event);
  const canShowJoinLink = canShowProtectedOnlineAccess(richBooking);
  const session = richBooking?.session || {};
  const ticket = richBooking?.ticket || {};
  const design = getTicketDesignFromBooking(richBooking);
  const questionnaireItems = Array.isArray(richBooking?.questionnaire)
    ? richBooking.questionnaire
    : Array.isArray(booking?.questionnaire)
      ? booking.questionnaire
      : [];
  const questionnaire = questionnaireItems.find((item: any) => !item.completed) || questionnaireItems[0];
  const hasQuestionnaire = Boolean(questionnaire?.id);
  const questionnaireCompleted = Boolean(questionnaire?.completed || questionnaire?.submittedAt);

  const downloadTicket = async () => {
    try {
      if (!ticketRef.current) return;
      const uri = await captureRef(ticketRef.current, {
        format: "png",
        quality: 1,
      });
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission needed", "Allow photo access to save this ticket.");
        return;
      }
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert("Ticket saved", "The ticket image was saved to your gallery.");
    } catch {
      Alert.alert("Download failed", "Please try again.");
    }
  };

  return (
    <View className="mb-5">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-white font-semibold">Pass {index + 1}</Text>
        <TouchableOpacity
          className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-3 py-2 flex-row items-center"
          onPress={downloadTicket}
        >
          <Download color="#E5E7EB" size={16} />
          <Text className="text-white font-semibold ml-2">Save</Text>
        </TouchableOpacity>
      </View>

      <View ref={ticketRef} collapsable={false}>
        <MobileTicketPass
          attendeeName={richBooking?.fullname}
          bookingCode={code}
          dateLabel={formatDate(session?.date || event?.start_date)}
          designConfig={design.designConfig}
          designKey={design.designKey}
          eventTitle={event?.title || session?.name || `Ticket ${index + 1}`}
          locationLabel={getBookingLocation(event)}
          priceLabel={money(ticket?.price || richBooking?.invoice?.finalAmount || richBooking?.final_amount, event?.currency || ticket?.currency)}
          sessionLabel={session?.name || "General admission"}
          statusLabel={richBooking?.status || "Booked"}
          ticketName={ticket?.name || ticket?.seat_type || "General admission"}
          timeLabel={formatTimeRange(session?.start_time, session?.end_time)}
        />
      </View>

      <View className="bg-[#111823] border border-[#243044] rounded-2xl p-5 mt-4">
        {hasOnlineAccess ? (
          <View className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-4 mt-4">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-[#5B4DFF] items-center justify-center">
                <Monitor color="white" size={20} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-white text-lg font-semibold">Online access</Text>
                <Text className="text-gray-400">
                  {formatEnumLabel(event?.online_platform) || "Online"} ·{" "}
                  {event?.online_timezone || "Event timezone"}
                </Text>
              </View>
            </View>
            <Text className="text-gray-400 leading-6 mt-3">
              {event?.online_access_instructions || getOnlineRevealLabel(event?.online_url_reveal)}
            </Text>
            {canShowJoinLink ? (
              <TouchableOpacity
                className="bg-primary rounded-xl py-3 mt-4"
                onPress={() => Linking.openURL(event.online_url)}
              >
                <Text className="text-background text-center font-bold">Join event</Text>
              </TouchableOpacity>
            ) : (
              <Text className="text-gray-500 mt-4">
                The private join link is protected until the organizer allows access.
              </Text>
            )}
          </View>
        ) : null}

        {hasQuestionnaire ? (
          <View className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-4 mt-4">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-[#8B6BFF]/20 items-center justify-center">
                <ClipboardList color="#A993FF" size={20} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-white text-lg font-semibold">Questionnaire</Text>
                <Text className="text-gray-400">
                  {questionnaireCompleted ? "Submitted" : "Action needed"}
                  {questionnaire?.answerCount ? ` · ${questionnaire.answerCount} answers` : ""}
                </Text>
              </View>
            </View>
            <Text className="text-gray-400 leading-6 mt-3">
              {questionnaireCompleted
                ? "Your answers are saved. You can review or update them before the event."
                : "The organizer needs a few details before the event."}
            </Text>
            <TouchableOpacity
              className={questionnaireCompleted ? "border border-[#2E3A4D] rounded-xl py-3 mt-4" : "bg-primary rounded-xl py-3 mt-4"}
              onPress={() => router.push(`/questionnaire/${questionnaire.id}` as any)}
            >
              <Text className={questionnaireCompleted ? "text-white text-center font-semibold" : "text-background text-center font-bold"}>
                {questionnaireCompleted ? "Review questionnaire" : "Complete questionnaire"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View className="mt-5">
          <Text className="text-white text-lg font-semibold mb-3">Attendee</Text>
          <View className="gap-3">
            <InfoRow icon={<User color="#A993FF" size={17} />} value={richBooking?.fullname || "Guest attendee"} />
            <InfoRow icon={<Mail color="#A993FF" size={17} />} value={richBooking?.email || "No email"} />
            <InfoRow icon={<Phone color="#A993FF" size={17} />} value={richBooking?.phone || "No phone"} />
          </View>
        </View>

        {isFetching ? (
          <View className="py-4">
            <ActivityIndicator color="#9EDD45" />
          </View>
        ) : null}
      </View>
    </View>
  );
}

function InfoRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <View className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-4 flex-row items-center">
      {icon}
      <Text className="text-gray-300 ml-3 flex-1">{value}</Text>
    </View>
  );
}

export default function BookingDetailsScreen() {
  const { id } = useLocalSearchParams();
  const eventId = getStringParam(id);
  const router = useRouter();
  const { data, isError, isLoading, refetch } = useGetBookingDetailsQuery(eventId, {
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
  });

  const bookings = Array.isArray(data?.body) ? data.body : data?.body?.result || [];

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator color="#9EDD45" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pt-4 pb-3 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-[#1A2432] border border-[#2E3A4D] rounded-full p-3"
        >
          <ArrowLeft color="#E5E7EB" size={21} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">Ticket access</Text>
        <TouchableOpacity
          onPress={refetch}
          className="bg-[#1A2432] border border-[#2E3A4D] rounded-full p-3"
        >
          <RefreshCcw color="#E5E7EB" size={19} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {isError ? (
          <View className="bg-[#111823] border border-[#243044] rounded-2xl p-8 items-center">
            <Text className="text-red-400 text-center">Failed to load tickets.</Text>
            <TouchableOpacity className="bg-primary px-5 py-3 rounded-xl mt-4" onPress={refetch}>
              <Text className="text-background font-bold">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!isError && bookings.length ? (
          bookings.map((booking: any, index: number) => (
            <TicketPass key={`${booking.id || booking.code}-${index}`} booking={booking} index={index} />
          ))
        ) : null}

        {!isError && !bookings.length ? (
          <View className="bg-[#111823] border border-[#243044] rounded-2xl p-8 items-center">
            <Ticket color="#8B6BFF" size={36} />
            <Text className="text-white text-lg font-semibold mt-4">No tickets found</Text>
            <Text className="text-gray-400 text-center mt-2">
              Tickets for this booking group will appear here when they are available.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
