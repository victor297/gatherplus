import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Calendar, TimerReset } from 'lucide-react-native';
import { useGetBookmarksQuery } from '@/redux/api/eventsApiSlice';
import { formatDate } from '@/utils/formatDate';



export default function BookmarksScreen() {
  const router = useRouter();
  const { data: bookmarks, isLoading, error } = useGetBookmarksQuery({});

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 bg-[#1A2432] p-2 rounded-full">
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">Bookmarks</Text>
      </View>
      <ScrollView className=" mt-2 px-4 ">
        {isLoading ? <View className="text-white  bg-background flex justify-center items-center py-4"><ActivityIndicator /></View>
          : error ?
            <View className="flex-1 bg-background justify-center items-center">
              <Text className="text-red-500">{error?.data.body}Failed to load data. Please try again.</Text>
            </View> : bookmarks?.body?.map((event: any) => (
              <TouchableOpacity
                key={event.id} onPress={() => router.push(`/(tabs)/home/event/${event.id}`)}
                className="bg-[#1A2432] rounded-lg mb-4"
              >
                <Image
                  source={{ uri: event?.event?.images?.[0] }}
                  className="w-full h-48"
                  resizeMode="cover"
                />
                <View className="p-4">
                  <View className='flex-row justify-between'>
                    <Text className="text-white text-lg font-bold mb-2">
                      {event?.event?.title}
                    </Text>
                    <View className="flex-row  items-center">
                      <Text className="text-amber-400 mr-2">★</Text>
                      <Text className="text-gray-400 font-semibold">{event?.event?.likes} interested</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-col">
                      <View className=" flex flex-row gap-2 items-center"><Calendar className='text-gray-400' size={20} /><Text className='text-gray-400 text-sm'>{formatDate(event?.event?.start_date).toString()}</Text></View>
                      <View className=" flex flex-row gap-2 mt-1 items-center"><TimerReset className='text-gray-400' size={24} /><Text className='text-gray-400 text-sm'>{event?.event?.time}</Text></View>
                    </View>

                    <View className="mt-2">
                      {event?.event?.is_free ? <Text className="text-primary text-lg font-semibold">free</Text> : <Text className="text-primary text-lg font-semibold">
                        {event?.event?.currency?.split(' - ')[0] || '₦'} {event?.event?.price}
                      </Text>}
                    </View>

                  </View>

                </View>
              </TouchableOpacity>
            ))}
      </ScrollView>

    </View>
  );
}