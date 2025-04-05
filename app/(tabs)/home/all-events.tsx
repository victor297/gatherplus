import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Bell, Filter, Calendar, TimerIcon, TimerReset } from 'lucide-react-native';
import { useGetcategoriesQuery, useGetEventsQuery } from '@/redux/api/eventsApiSlice';
import { formatDate } from '@/utils/formatDate';



export default function AllEventsScreen() {
  const router = useRouter();
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
  const { data: categories, isLoading, error } = useGetcategoriesQuery({});
  const { data: upcoming, error: upcomingError, isLoading: isupcomingLoading, isFetching, refetch: refetchUpcoming } = useGetEventsQuery({
    city: null,
    type: "UPCOMING",
    category_id: selectedCategory,
    search: searchTerm,
  });
  return (
    <View className=" bg-background flex-1">
      <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
          <Text className="text-white text-xl font-semibold">Upcoming Events</Text>
        </View>
        <View className="flex-row items-center space-x-4">

          <TouchableOpacity>
            <Filter color="white" size={24} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Bell color="white" size={24} />
          </TouchableOpacity>
        </View>
      </View>
              <View className="flex-row mx-4 items-center bg-[#1A2432] rounded-lg px-4  mb-6">
                <Search size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-3 py-3 text-white"
                  placeholder="Search for events"
                  placeholderTextColor="#6B7280"
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                />
              </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 h-12 mb-2">
          {isupcomingLoading? (
                    <View className="text-white flex justify-center items-center py-4"><ActivityIndicator /></View>
                  ) : upcomingError  ? (
                    <Text className="text-red-500 text-center py-4">Failed to load data. Please try again.</Text>
                  ) :categories?.body?.map((category, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setSelectedCategory(category?.id)}
                      className="bg-[#1A2432] max-h-7 px-6 py-2 rounded-full mr-3"
                    >
                      <Text className="text-white">{category?.name}</Text>
                    </TouchableOpacity>
                  ))}
        </ScrollView>

      <ScrollView className=" mt-2 px-4 ">
            {isLoading ||isFetching?  <View className="text-white  bg-background flex justify-center items-center py-4"><ActivityIndicator /></View>
                               : error  ? 
        <View className="flex-1 bg-background justify-center items-center">
          <Text className="text-red-500">Failed to load data. Please try again.</Text>
        </View> : upcoming?.body?.result?.map((event) => (
          <TouchableOpacity
            key={event.id} onPress={() => router.push(`/(tabs)/home/event/${event.id}`)}
            className="bg-[#1A2432] rounded-lg mb-4"
          >
            <Image
              source={{ uri: event?.images?.[0] }}
              className="w-full h-48"
              resizeMode="cover"
            />
            <View className="p-4">
             <View className='flex-row justify-between'>
             <Text className="text-white text-lg font-bold mb-2">
                {event?.title}
              </Text>
              <View className="flex-row  items-center">
                  <Text className="text-amber-400 mr-2">★</Text>
                  <Text className="text-gray-400 font-semibold">{event?.likes} interested</Text>
                </View>
             </View>
              <View className="flex-row items-center justify-between">
                <View className="flex-col">
                <View className=" flex flex-row gap-2 items-center"><Calendar className='text-gray-400' size={20}/><Text className='text-gray-400 text-sm'>{formatDate(event?.start_date).toString()}</Text></View>
                  <View className=" flex flex-row gap-2 mt-1 items-center"><TimerReset className='text-gray-400' size={24}/><Text className='text-gray-400 text-sm'>{event?.time}</Text></View>
                </View>

                <View className="mt-2">
                <Text className="text-primary text-lg font-semibold">
                {event?.currency ||'₦'}  {event?.price}
                </Text>
              </View>
               
              </View>
             
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}