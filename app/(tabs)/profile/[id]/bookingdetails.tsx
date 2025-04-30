import React, { useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Circle } from "react-native-svg";
import { useGetBookingDetailsQuery } from '@/redux/api/eventsApiSlice';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

const TicketScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { data: bookingData, isLoading, isError, error, refetch } = useGetBookingDetailsQuery(id);
  console.log(bookingData, "bookingData")
  // Create an array of refs upfront based on the maximum possible tickets
  const ticketRefs = useRef<(View | null)[]>([]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 justify-center items-center bg-black p-4">
        <Text className="text-red-500 text-center text-lg mb-4">
          Failed to load tickets. Please check your connection.
        </Text>
        <TouchableOpacity onPress={refetch} className="bg-white px-4 py-2 rounded">
          <Text className="text-black font-bold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const downloadTicket = async (index: number) => {
    try {
      const ticketRef = ticketRefs.current[index];
      if (!ticketRef) return;

      const uri = await captureRef(ticketRef, {
        format: 'png',
        quality: 1,
      });

      const permission = await MediaLibrary.requestPermissionsAsync();
      if (permission.granted) {
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert('Success', 'Ticket saved to gallery!');
      } else {
        Alert.alert('Permission Denied', 'Please allow photo permissions.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save the ticket. Try again.');
    }
  };

  return (
    <SafeAreaView className="bg-background flex-1">
      <View className="flex-row items-center px-4 pt-8 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 bg-[#1A2432] p-2 rounded-full">
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">Tickets</Text>
      </View>
      <ScrollView>

        {bookingData?.body?.map((booking: any, index: number) => {
          return (
            <View
              key={`${booking.ticket_id}-${index}`}
              className="mb-6 bg-white rounded-lg p-4"
              ref={ref => ticketRefs.current[index] = ref}
              collapsable={false}
            >
              <View className="relative w-[100%] m-1" >
                <Svg height="100" width="100%" viewBox="0 0 520 160">
                  <Rect x="0" y="0" width="520" height="160" rx="10" ry="10" fill="white" stroke="gray" strokeWidth="2" />
                  <Circle cx="0" cy="80" r="20" fill="#020e1e" stroke="#020e1e" strokeWidth="2" />
                  <Circle cx="520" cy="80" r="20" fill="#020e1e" stroke="#020e1e" strokeWidth="2" />
                </Svg>
                <View className="absolute top-0 left-0 w-full h-full flex justify-center items-center p-4">
                  <Text className="font-bold text-blue-600 text-center">{booking?.session?.name}-{booking?.session?.start_time}</Text>
                  <View className='flex-row justify-center gap-2 items-center'>
                    <QRCode value={`${booking.session_id}-${booking.ticket_id}-${index}`} size={50} />
                    <View>
                      <Text className="text-base text-gray-700">{booking.fullname}</Text>
                      <Text className="text-sm text-gray-500">{booking.email}</Text>
                      <Text className="text-sm text-gray-500">{booking?.ticket?.seat_type} </Text>
                    </View>
                    {/* Download Button */}

                    <TouchableOpacity
                      onPress={() => downloadTicket(index)}
                      className=" bg-gray-100 p-2 rounded-full"
                    >
                      <Ionicons name="download-outline" size={20} color="black" />
                    </TouchableOpacity>
                  </View>

                </View>

              </View>


            </View>
          );
        })}
      </ScrollView>

    </SafeAreaView>
  );
};

export default TicketScreen;