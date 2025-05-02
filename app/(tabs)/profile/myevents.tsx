import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { RelativePathString, useRouter } from 'expo-router';
import { ArrowLeft, Search, Bell, Filter, Calendar, TimerIcon, TimerReset } from 'lucide-react-native';
import { useGetcategoriesQuery, useGetEventsQuery, useGetMyEventsQuery } from '@/redux/api/eventsApiSlice';
import { formatDate } from '@/utils/formatDate';
import { FlatList } from 'react-native';
import { useFocusEffect } from 'expo-router';

export default function MyEventsScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [size] = useState(10); // Number of items per page
  const [allEvents, setAllEvents] = useState<any>([]); // Store all loaded events
  
  const { data: categories, isLoading, error, } = useGetcategoriesQuery<any>({});
  
  const { 
    data: upcoming, 
    error: upcomingError, 
    isLoading: isupcomingLoading, 
    isFetching, 
    refetch: refetchUpcoming 
  } = useGetMyEventsQuery<any>({
    category_id: selectedCategory,
    search: searchTerm,
    page,
    size,
  },{ refetchOnMountOrArgChange: true,
    refetchOnFocus: true,});
console.log(upcoming,"upcoming")
  // Reset page and clear events when filters change
  useEffect(() => {
    setPage(1);
    setAllEvents([]);
  }, [selectedCategory, searchTerm]);

  // Append new events when data is loaded
  useEffect(() => {
    if (upcoming?.body?.result) {
      if (page === 1) {
        setAllEvents(upcoming.body.result);
      } else {
        setAllEvents((prev:any) => [...prev, ...upcoming.body.result]);
      }
    }
  }, [upcoming]);
  // useFocusEffect(() => {
  
  //   refetchUpcoming();
  // }, );

  const handleLoadMore = () => {
    if (!isFetching && upcoming?.body?.result?.length === size) {
      setPage((prev) => prev + 1);
    }
  };
  

  return (
    <View className=" bg-background flex-1">
      <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 bg-[#1A2432] p-2 rounded-full">
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
          <Text className="text-white text-xl font-semibold">My Events</Text>
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
        {isupcomingLoading||isLoading ? (
          <View className="text-white flex justify-center items-center py-4"><ActivityIndicator /></View>
        ) : upcomingError ? (
          <Text className="text-red-500 text-center py-4">Failed to load data. Please try again. {upcomingError?.data?.message}</Text>
        ) : [{ id: null, name: "All" }, ...(categories?.body || [])].map((category, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setSelectedCategory(category?.id)}
            className="bg-[#1A2432] max-h-8 px-6 py-2 rounded-full mr-3"
          >
            <Text className="text-white">{category?.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
  data={allEvents}
  keyExtractor={(item,index) => index.toString()}
  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
  ListEmptyComponent={() => (
    <View className="flex-1 bg-background justify-center items-center py-8">
      <Text className="text-gray-400 text-lg">No event under selected category</Text>
    </View>
  )}
  ListFooterComponent={() =>
    isFetching && page > 1 ? (
      <View className="py-4 flex justify-center items-center">
        <ActivityIndicator />
      </View>
    ) : null
  }
  onEndReached={handleLoadMore}
  onEndReachedThreshold={0.5} // Changed to trigger closer to the bottom
  renderItem={({ item: event }) => (
    <TouchableOpacity
      key={event.id}
      onPress={() => router.push(`/(tabs)/profile/${event.id}/myeventdetails` as RelativePathString)}
      className="bg-[#1A2432] rounded-lg mb-4"
    >
      <Image
        source={{ uri: event?.images?.[0] }}
        className="w-full h-48 rounded-lg"
        resizeMode="cover"
      />
      <View className="p-4">
        <View className="flex-row justify-between">
          <Text className="text-white text-lg font-bold mb-2">
            {event?.title}
          </Text>
          <View className="flex-row items-center">
            <Text className="text-amber-400 mr-2">★</Text>
            <Text className="text-gray-400 font-semibold">
              {event?.likes} interested
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-col">
            <View className="flex flex-row gap-2 items-center">
              <Calendar className="text-gray-400" size={20} />
              <Text className="text-gray-400 text-sm">
                {formatDate(event?.start_date).toString()}
              </Text>
            </View>
            <View className="flex flex-row gap-2 mt-1 items-center">
              <TimerReset className="text-gray-400" size={24} />
              <Text className="text-gray-400 text-sm">{event?.time}</Text>
            </View>
          </View>

          <View className="mt-2">
            {event?.is_free ? (
              <Text className="text-primary text-lg font-semibold">Free</Text>
            ) : (
              <Text className="text-primary text-lg font-semibold">
                {event?.currency?.split(' - ')[0] || '₦'} {event?.price}
              </Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )}
/>
    </View>
  );
}