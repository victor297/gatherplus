import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import Svg, { Rect, Circle } from "react-native-svg";
import QRCode from "react-native-qrcode-svg";
import { useCreateBookingMutation } from '@/redux/api/eventsApiSlice';

export default function OrderSummaryScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams();
  const bookingData = JSON.parse(data as string);
  console.log(bookingData,"final")

      const [createBooking, { isLoading:isBookmarkLoading }] = useCreateBookingMutation();
  
  // Calculate ticket groups and totals
  const ticketGroups = bookingData.bookings.reduce((groups:any, booking:any) => {
    const name = booking.name;
    if (!groups[name]) {
      groups[name] = { count: 0, total: 0 };
    }
    groups[name].count++;
    groups[name].total += booking.price;
    return groups;
  }, {});

  const subtotal = bookingData.bookings.reduce((sum:any, booking:any) => sum + booking.price, 0);
  const tax = 0; // Add your tax calculation logic here if needed
  const total = subtotal + tax;
  const handleBookEvent = async()=>{
    try {
      const res = await createBooking(bookingData).unwrap();
      // console.log(res,"resresres")
router.push(`/home/event/${bookingData.event_id}/success`)
  } catch (err) {
    alert(err)

  console.log(err)
    }
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">Order Summary</Text>
      </View>

      <ScrollView className="flex-1 px-4">
        <Text className="text-white text-xl mb-4">Tickets</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="">
          {bookingData.bookings.map((booking:any, index:any) => (
            <View className="relative w-80 m-1" key={`${booking.ticket_id}-${index}`}>
              <Svg height="100" width="100%" viewBox="0 0 520 160">
                <Rect x="0" y="0" width="520" height="160" rx="10" ry="10" fill="white" stroke="gray" strokeWidth="2" />
                <Circle cx="0" cy="80" r="20" fill="#020e1e" stroke="#020e1e" strokeWidth="2" />
                <Circle cx="520" cy="80" r="20" fill="#020e1e" stroke="#020e1e" strokeWidth="2" />
              </Svg>

              <View className="absolute top-0 left-0 w-full h-full flex justify-center items-center p-4">
                <Text className="text-lg font-bold text-blue-600 text-center">{booking.name}</Text>
                <View className='flex-row justify-center gap-2 items-center'>
                  <QRCode value={`${booking.session_id}-${booking.ticket_id}-${index}`} size={50} />
                  <View>
                    <Text className="text-base text-gray-700 ">{booking.fullname}</Text>
                    <Text className="text-sm text-gray-500">{booking.email}</Text>
                  </View>
                  <Text className="text-white font-bold text-sm bg-blue-600 p-1 rounded-full">
  {booking?.price == 0
    ? 'Free'
    : `${bookingData?.currency?.split(' - ')[0]} ${booking.price.toLocaleString()}`}
</Text>

                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        <View className="mt-6">
          <Text className="text-white text-xl mb-4">Order Details</Text>
          
          <View className="space-y-3">
            {Object.entries(ticketGroups).map(([name, group]:any) => (
              <View className="flex-row justify-between" key={name}>
                <Text className="text-gray-400">{name}</Text>
                <Text className="text-white">
                  {group?.count} × {bookingData?.currency} {(group?.total / group?.count).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>

          <View className="h-[1px] bg-[#1A2432] my-4" />

          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-400">Sub-total</Text>
              <Text className="text-white">{bookingData?.currency} {subtotal.toLocaleString()}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-400">Tax</Text>
              <Text className="text-white"> {bookingData?.currency} {tax.toLocaleString()}</Text>
            </View>
          </View>

          <View className="h-[1px] bg-[#1A2432] my-4" />

          <View className="flex-row justify-between">
            <Text className="text-gray-400">Total</Text>
            <Text className="text-primary text-xl font-bold"> {bookingData?.currency} {total.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>

      <View className="p-4 border-t border-[#1A2432]">
        <TouchableOpacity
          className="bg-primary rounded-lg py-4"
          onPress={handleBookEvent}
        >
          <Text className="text-background text-center font-semibold">
            Pay Now
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}