import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Calendar, TimerReset, Search } from 'lucide-react-native';
import { useGetBookingsQuery, useGetBookmarksQuery } from '@/redux/api/eventsApiSlice';
import { formatDate } from '@/utils/formatDate';
import { debounce } from 'lodash';

export default function BookingsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'PAST' | null>('UPCOMING');
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [allBookings, setAllBookings] = useState([]);

  const { data: bookings, isLoading, error, isFetching } = useGetBookingsQuery({
    type: activeTab,
    page,
    size,
    search: debouncedSearchQuery,
  });

  // Debounce search input
  const debouncedSearch = useCallback(
    debounce((query: any) => {
      setDebouncedSearchQuery(query);
      setPage(1); // Reset to first page when searching
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => debouncedSearch.cancel();
  }, [searchQuery]);

  // Handle pagination and data accumulation
  useEffect(() => {
    if (bookings?.body) {
      if (page === 1) {
        setAllBookings(bookings.body);
      } else {
        setAllBookings(prev => [...prev, ...bookings.body]);
      }
    }
  }, [bookings]);

  const loadMore = () => {
    if (!isFetching && bookings?.body?.length === size) {
      setPage(prev => prev + 1);
    }
  };

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    setPage(1);
    setAllBookings([]);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      key={item?.id}
      onPress={() => router.push(`/profile/${item?.id}/bookingdetails`)}
      className="bg-[#1A2432] rounded-lg mb-4"
    >
      <Image
        source={{ uri: item?.images?.[0] }}
        className="w-full h-48 rounded-t-lg"
        resizeMode="cover"
      />
      <View className="p-4">
        <View className="flex-row justify-between mb-2">
          <Text className="text-white text-lg font-bold flex-shrink mr-2">
            {item?.title}
          </Text>
          <View className="flex-row items-center">
            <Text className="text-amber-400 mr-1">★</Text>
            <Text className="text-gray-400 text-sm">
              {item?.likes} interested
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center">
          <View className="flex-col gap-1">
            <View className="flex-row items-center gap-2">
              <Calendar color="#6B7280" size={18} />
              <Text className="text-gray-400 text-sm">
                {formatDate(item?.start_date)}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <TimerReset color="#6B7280" size={18} />
              <Text className="text-gray-400 text-sm">
                {item?.time}
              </Text>
            </View>
          </View>

          {item?.is_free ? (
            <Text className="text-primary text-lg font-semibold">free</Text>
          ) : (
            <Text className="text-primary text-lg font-semibold">
              {item?.currency?.split(' - ')[0] || '₦'} {item?.price}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!isFetching) return null;
    return (
      <View className="py-4">
        <ActivityIndicator color="#9EDD45" />
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 bg-[#1A2432] p-2 rounded-full">
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">My Bookings</Text>
      </View>

      {/* Search Bar */}
      <View className="px-4 pb-4">
        <View className="flex-row items-center bg-[#1A2432] rounded-lg px-3 py-2">
          <Search color="#6B7280" size={20} />
          <TextInput
            className="flex-1 text-white ml-2"
            placeholder="Search bookings..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View className="flex-row px-4 border-b border-[#1A2432]">
        <TouchableOpacity
          className={`py-4 px-6 ${activeTab === 'UPCOMING' ? 'border-b-2 border-primary' : ''}`}
          onPress={() => handleTabChange('UPCOMING')}
        >
          <Text className={activeTab === 'UPCOMING' ? 'text-primary' : 'text-gray-400'}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`py-4 px-6 ${activeTab === 'PAST' ? 'border-b-2 border-primary' : ''}`}
          onPress={() => handleTabChange('PAST')}
        >
          <Text className={activeTab === 'PAST' ? 'text-primary' : 'text-gray-400'}>
            Past Events
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={allBookings}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          isLoading || isFetching ? (
            <View className="py-4">
              <ActivityIndicator color="#9EDD45" />
            </View>
          ) : error ? (
            <View className="py-4 justify-center items-center">
              <Text className="text-red-500">Error loading events</Text>
            </View>
          ) : (
            <View className="py-4 justify-center items-center">
              <Text className="text-gray-400">No bookings found</Text>
            </View>
          )
        }
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
}