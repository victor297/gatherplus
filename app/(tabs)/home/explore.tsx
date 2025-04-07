import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Bell, Filter, Calendar, TimerIcon, TimerReset } from 'lucide-react-native';
import { useGetcategoriesQuery, useGetEventsQuery } from '@/redux/api/eventsApiSlice';
import { formatDate } from '@/utils/formatDate';
import { FlatList } from 'react-native';

export default function ExploreScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [size] = useState(4); // Number of items per page
  const [allEvents, setAllEvents] = useState<any>([]); // Store all loaded events
  
  const { data: categories, isLoading, error } = useGetcategoriesQuery({});
  
  const { 
    data: upcoming, 
    error: upcomingError, 
    isLoading: isupcomingLoading, 
    isFetching, 
    refetch: refetchUpcoming 
  } = useGetEventsQuery({
    city: null,
    type: "UPCOMING",
    category_id: selectedCategory,
    search: searchTerm,
    page,
    size,
  });

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

  const handleLoadMore = () => {
    if (!isFetching && upcoming?.body?.result?.length === size) {
      setPage((prev) => prev + 1);
    }
  };
  

  return (
    <View className=" bg-background flex-1">
      <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
          <Text className="text-white text-xl font-semibold">Explore</Text>
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
      {isupcomingLoading||isFetching ? (
          <View className="text-white flex justify-center items-center py-4"><ActivityIndicator /></View>
        ) : upcomingError ? (
          <Text className="text-red-500 text-center py-4">Failed to load data. Please try again.</Text>
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
  keyExtractor={(item) => item.id.toString()}
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
      className="bg-[#1A2432] rounded-lg overflow-hidden mb-4"
      onPress={() => router.push(`/(tabs)/home/event/${event.id}`)}
      >
      <Image
        source={{ uri: event?.images?.[0] }}
        className="w-full h-48 rounded-lg"
        resizeMode="cover"
      />
      <View className="p-4">
        <Text className="text-white text-xl font-semibold">{event.title}</Text>
        <Text className="text-gray-400 mb-4">
          {event?.address?.length > 25
            ? `${event.address.slice(0, 252)}...`
            : event?.address}
        </Text>
        <View className="flex-row items-center justify-between">
          <View className="flex-row">
            {[1, 2, 3].map((avatar) => (
              <Image
                key={avatar}
                source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde' }}
                className="w-8 h-8 rounded-full border-2 border-[#1A2432]  -ml-2 first:ml-0"
              />
            ))}
          </View>
          <TouchableOpacity className="bg-primary px-6 py-2 rounded-full">
            <Text className="text-background font-semibold">Join now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )}
/>
    </View>
  );
}