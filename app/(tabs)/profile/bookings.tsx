import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Calendar, TimerReset } from 'lucide-react-native';
import { useGetBookingsQuery, useGetBookmarksQuery } from '@/redux/api/eventsApiSlice';
import { formatDate } from '@/utils/formatDate';

export default function BookingsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'PAST'|null>('UPCOMING');
  
  const { data: bookings, isLoading, error } = useGetBookingsQuery({
    type: activeTab
  });
console.log(bookings,activeTab)
  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 bg-[#1A2432] p-2 rounded-full">
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">My Bookings</Text>
      </View>

      <View className="flex-row px-4 border-b border-[#1A2432]">
        <TouchableOpacity
          className={`py-4 px-6 ${activeTab === 'UPCOMING' ? 'border-b-2 border-primary' : ''}`}
          onPress={() => setActiveTab('UPCOMING')}
        >
          <Text className={activeTab === 'UPCOMING' ? 'text-primary' : 'text-gray-400'}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`py-4 px-6 ${activeTab === 'PAST' ? 'border-b-2 border-primary' : ''}`}
          onPress={() => setActiveTab('PAST')}
        >
          <Text className={activeTab === 'PAST' ? 'text-primary' : 'text-gray-400'}>
            Past Events
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="mt-2 px-4">
        {isLoading ? (
          <View className="py-4">
            <ActivityIndicator color="#FFFFFF" />
          </View>
        ) : error ? (
          <View className="py-4 justify-center items-center">
            <Text className="text-red-500">Error loading events</Text>
          </View>
        ) : (
          bookings?.body?.map((event:any) => (
              <TouchableOpacity
                key={event.id}
                onPress={() => router.push(`/profile/${event.event_id}/bookingdetails`)}
                className="bg-[#1A2432] rounded-lg mb-4"
              >
                <Image
                  source={{ uri: event?.event?.images?.[0] }}
                  className="w-full h-48 rounded-t-lg"
                  resizeMode="cover"
                />
                <View className="p-4">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-white text-lg font-bold flex-shrink mr-2">
                      {event?.event?.title}
                    </Text>
                    <View className="flex-row items-center">
                      <Text className="text-amber-400 mr-1">★</Text>
                      <Text className="text-gray-400 text-sm">
                        {event?.event?.likes} interested
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <View className="flex-col gap-1">
                      <View className="flex-row items-center gap-2">
                        <Calendar color="#6B7280" size={18} />
                        <Text className="text-gray-400 text-sm">
                          {formatDate(event?.event?.start_date)}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <TimerReset color="#6B7280" size={18} />
                        <Text className="text-gray-400 text-sm">
                          {event?.event?.time}
                        </Text>
                      </View>
                    </View>

                   {event?.event?.is_free?<Text className="text-primary text-lg font-semibold">free</Text>: <Text className="text-primary text-lg font-semibold">
                                {event?.event?.currency?.split(' - ')[0] ||'₦'} {event?.event?.price}
                                </Text> }
                  </View>
                </View>
              </TouchableOpacity>
            ))
        )}
      </ScrollView>
    </View>
  );
}