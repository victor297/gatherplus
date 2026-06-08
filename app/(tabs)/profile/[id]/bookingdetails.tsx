import React, { useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { captureRef } from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Rect, Circle } from "react-native-svg";
import {
  useGetBookingByIdQuery,
  useGetBookingDetailsQuery,
} from "@/redux/api/eventsApiSlice";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { getStringParam } from "@/utils/routeParams";
import {
  canShowProtectedOnlineAccess,
  currencySymbol,
  eventHasOnlineAccess,
  formatEnumLabel,
  getAttendanceLabel,
  getOnlineRevealLabel,
} from "@/utils/eventHelpers";

const TicketCard = ({ booking, index }: { booking: any; index: number }) => {
  const ticketRef = useRef<View | null>(null);
  const { data: richBookingData, isFetching } = useGetBookingByIdQuery(
    booking?.id,
    {
      skip: !booking?.id,
    }
  );
  const richBooking = richBookingData?.body || booking;
  const event = richBooking?.event;
  const code = richBooking?.code || booking?.code || String(richBooking?.id || "");
  const hasOnlineAccess = eventHasOnlineAccess(event);
  const canShowJoinLink = canShowProtectedOnlineAccess(richBooking);
  const symbol = currencySymbol(event?.currency || richBooking?.ticket?.currency);

  const downloadTicket = async () => {
    try {
      if (!ticketRef.current) return;

      const uri = await captureRef(ticketRef.current, {
        format: "png",
        quality: 1,
      });

      const permission = await MediaLibrary.requestPermissionsAsync();
      if (permission.granted) {
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert("Success", "Ticket saved to gallery.");
      } else {
        Alert.alert("Permission denied", "Please allow photo permissions.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to save the ticket. Try again.");
    }
  };

  return (
    <View
      className="mb-6 bg-white rounded-lg p-4"
      ref={ticketRef}
      collapsable={false}
    >
      <View className="relative w-[100%] m-1">
        <Svg height="128" width="100%" viewBox="0 0 520 170">
          <Rect
            x="0"
            y="0"
            width="520"
            height="170"
            rx="10"
            ry="10"
            fill="white"
            stroke="gray"
            strokeWidth="2"
          />
          <Circle
            cx="0"
            cy="85"
            r="20"
            fill="#020e1e"
            stroke="#020e1e"
            strokeWidth="2"
          />
          <Circle
            cx="520"
            cy="85"
            r="20"
            fill="#020e1e"
            stroke="#020e1e"
            strokeWidth="2"
          />
        </Svg>
        <View className="absolute top-0 left-0 w-full h-full flex justify-center p-4">
          <Text className="font-bold text-blue-600 text-center mb-2">
            {event?.title || richBooking?.session?.name || `Ticket ${index + 1}`}
          </Text>
          <View className="flex-row justify-center gap-3 items-center">
            <QRCode value={code} size={64} />
            <View className="flex-1">
              <Text className="text-base text-gray-700">
                {richBooking?.fullname}
              </Text>
              <Text className="text-sm text-gray-500">{richBooking?.email}</Text>
              <Text className="text-sm text-gray-500">
                {richBooking?.ticket?.name || richBooking?.ticket?.seat_type}
              </Text>
              <Text className="text-xs text-gray-500 mt-1">Code: {code}</Text>
            </View>
            <TouchableOpacity
              onPress={downloadTicket}
              className="bg-gray-100 p-2 rounded-full"
            >
              <Ionicons name="download-outline" size={20} color="black" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View className="bg-gray-100 rounded-lg p-3 mt-3">
        <Text className="text-gray-800 font-semibold">
          {richBooking?.session?.name || "Session"}
        </Text>
        <Text className="text-gray-600 text-sm">
          {richBooking?.session?.start_time} - {richBooking?.session?.end_time}
        </Text>
        <Text className="text-gray-600 text-sm mt-1">
          Price:{" "}
          {Number(richBooking?.ticket?.price || 0) > 0
            ? `${symbol} ${Number(richBooking?.ticket?.price || 0).toLocaleString()}`
            : "Free"}
        </Text>
        <Text className="text-gray-600 text-sm mt-1">
          Updates: {richBooking?.receive_updates === false ? "Off" : "On"}
        </Text>
      </View>

      {isFetching && (
        <View className="py-3">
          <ActivityIndicator color="#9EDD45" />
        </View>
      )}

      {hasOnlineAccess && (
        <View className="bg-[#eef7df] rounded-lg p-3 mt-3">
          <Text className="text-gray-900 font-semibold">Online Access</Text>
          <Text className="text-gray-700 text-sm mt-2">
            Format: {getAttendanceLabel(event)}
          </Text>
          <Text className="text-gray-700 text-sm mt-1">
            Platform: {formatEnumLabel(event?.online_platform) || "Online"}
          </Text>
          <Text className="text-gray-700 text-sm mt-1">
            Timezone: {event?.online_timezone || "Event timezone"}
          </Text>
          <Text className="text-gray-700 text-sm mt-1">
            {getOnlineRevealLabel(event?.online_url_reveal)}
          </Text>
          {event?.online_access_instructions && (
            <Text className="text-gray-700 text-sm mt-2 leading-5">
              {event.online_access_instructions}
            </Text>
          )}
          {canShowJoinLink ? (
            <TouchableOpacity
              className="bg-primary rounded-lg py-3 mt-3"
              onPress={() => Linking.openURL(event.online_url)}
            >
              <Text className="text-background text-center font-semibold">
                Join online event
              </Text>
            </TouchableOpacity>
          ) : (
            <Text className="text-gray-600 text-sm mt-3">
              The join link is protected until it is available to confirmed
              attendees.
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const TicketScreen = () => {
  const { id } = useLocalSearchParams();
  const eventId = getStringParam(id);
  const router = useRouter();
  const {
    data: bookingData,
    isLoading,
    isError,
    refetch,
  } = useGetBookingDetailsQuery(eventId, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  const bookings = Array.isArray(bookingData?.body)
    ? bookingData.body
    : bookingData?.body?.result || [];

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator color="#9EDD45" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 justify-center items-center bg-black p-4">
        <Text className="text-red-500 text-center text-lg mb-4">
          Failed to load tickets. Please check your connection.
        </Text>
        <TouchableOpacity
          onPress={refetch}
          className="bg-white px-4 py-2 rounded"
        >
          <Text className="text-black font-bold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="bg-background flex-1">
      <View className="flex-row items-center px-4 pt-8 pb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-4 bg-[#1A2432] p-2 rounded-full"
        >
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">Tickets</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {bookings.length === 0 ? (
          <Text className="text-gray-400 text-center mt-8">
            No tickets found for this booking.
          </Text>
        ) : (
          bookings.map((booking: any, index: number) => (
            <TicketCard
              key={`${booking.id || booking.code}-${index}`}
              booking={booking}
              index={index}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default TicketScreen;
