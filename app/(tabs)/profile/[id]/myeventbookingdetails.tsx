import React, { useRef, useState } from 'react';
import { 
  View, 
  Text, 
  ActivityIndicator, 
  TouchableOpacity, 
  FlatList,
  TextInput,
} from 'react-native';
import { useGetMyEventBookingsQuery } from '@/redux/api/eventsApiSlice';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native';
import { ArrowLeft, Search } from 'lucide-react-native';
import { Image } from 'react-native';
import { formatDate, formatTime } from '@/utils/formatDate';

const MyEventTicketScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [size] = useState(10); 
  const flatListRef = useRef<FlatList>(null);
  
  const { 
    data: bookingData, 
    isLoading, 
    isFetching, 
    isError, 
    error, 
    refetch 
  } = useGetMyEventBookingsQuery({
    id,  
    search: searchTerm,
    page,
    size,
  });

  const handleSearch = (text: string) => {
    setSearchTerm(text);
    setPage(1); // Reset to first page when searching
  };

  const handleLoadMore = () => {
    if (!isFetching && bookingData?.body?.result?.length === size) {
      setPage((prev) => prev + 1);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View className="mb-2 rounded-lg p-4 flex flex-row gap-4 items-center">
      <Image 
        source={{ uri: item?.image }} 
        className="w-16 h-16 rounded-full mb-2 border-2 bg-slate-500 border-primary"
      />
      <View className='flex flex-col justify-between my-4'>
        <Text className='text-white text-xl font-bold'>{item?.fullname}</Text>
        <Text className='text-gray-600'>
          Booked on {formatDate(item?.created_at)} at {formatTime(item?.created_at)}
        </Text>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!isFetching) return null;
    return (
      <View className="py-4">
<ActivityIndicator color="#9EDD45" />      </View>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
<ActivityIndicator color="#9EDD45" />      </View>
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

  return (
    <SafeAreaView className="bg-background flex-1">
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="mr-4 bg-[#1A2432] p-2 rounded-full"
        >
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">
          Participants ({bookingData?.body?.totalItems || 0})
        </Text>
      </View>

      {/* Search Input - Now without debounce */}
      <View className="px-4 pb-4">
        <View className="flex-row items-center bg-[#1A2432] rounded-lg px-3 py-2">
          <Search color="gray" size={20} />
          <TextInput
            placeholder="Search participants..."
            placeholderTextColor="gray"
            className="flex-1 text-white ml-2"
            onChangeText={handleSearch}
            value={searchTerm}
          />
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={bookingData?.body?.result || []}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshing={isFetching && page === 1}
        onRefresh={() => {
          setPage(1);
          refetch();
        }}
      />
    </SafeAreaView>
  );
};

export default MyEventTicketScreen;