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
import QRCode from "react-native-qrcode-svg";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  ClipboardList,
  Download,
  Mail,
  MapPin,
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

const money = (value?: unknown, currency?: unknown) => {
  const amount = Number(value || 0);
  const code = currencySymbol(String(currency || "NGN")) || "NGN";
  return amount > 0 ? `${code} ${amount.toLocaleString()}` : "Free";
};

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-4 flex-1 min-w-[46%]">
      <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center mb-3">
        {icon}
      </View>
      <Text className="text-gray-400 text-xs uppercase tracking-[2px]">{label}</Text>
      <Text className="text-white font-semibold mt-1">{value}</Text>
    </View>
  );
}

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
    <View
      ref={ticketRef}
      collapsable={false}
      className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden mb-5"
    >
      <View className="p-5 border-b border-[#243044]">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <View className="flex-row items-center">
              <View className="w-11 h-11 rounded-full bg-primary items-center justify-center">
                <Ticket color="#020817" size={21} />
              </View>
              <Text className="text-[#8B6BFF] font-bold tracking-[4px] uppercase ml-3">
                Secure pass
              </Text>
            </View>
            <Text className="text-white text-2xl font-bold mt-4">
              {event?.title || session?.name || `Ticket ${index + 1}`}
            </Text>
            <Text className="text-gray-400 mt-2">
              {ticket?.name || ticket?.seat_type || "General admission"}
            </Text>
          </View>
          <TouchableOpacity className="bg-[#1A2432] rounded-xl p-3" onPress={downloadTicket}>
            <Download color="#E5E7EB" size={19} />
          </TouchableOpacity>
        </View>
      </View>

      <View className="p-5">
        <View className="items-center bg-white rounded-2xl p-5 mb-5">
          <QRCode value={code} size={190} />
          <Text className="text-[#5B4DFF] font-mono font-bold tracking-[3px] mt-4">
            {code}
          </Text>
          <Text className="text-gray-500 text-center mt-2">
            Scan this QR or show the code at check-in.
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-3">
          <InfoTile
            icon={<CalendarDays color="#A993FF" size={19} />}
            label="Date"
            value={formatDate(session?.date || event?.start_date)}
          />
          <InfoTile
            icon={<Clock color="#A993FF" size={19} />}
            label="Time"
            value={`${session?.start_time || "Time"}${session?.end_time ? ` - ${session.end_time}` : ""}`}
          />
          <InfoTile
            icon={<MapPin color="#A993FF" size={19} />}
            label="Where"
            value={
              event?.attendance_mode === "ONLINE"
                ? "Online event"
                : event?.city || event?.address || getAttendanceLabel(event)
            }
          />
          <InfoTile
            icon={<Ticket color="#A993FF" size={19} />}
            label="Price"
            value={money(ticket?.price || richBooking?.final_amount, event?.currency || ticket?.currency)}
          />
        </View>

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
