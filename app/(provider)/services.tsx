import React, { useState, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";

import { ArrowLeft, Search, Mic, Star } from "lucide-react-native";
import { useGetprovidersQuery } from "@/redux/api/providersApiSlice";

const colors = {
  primary: "#9EDD45",
  background: "#020E1E",
  textLight: "#E0E0E0",
  placeholder: "#888",
  cardBackground: "#0D1A2C",
  starGold: "#FFD700",
};

const Services = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [providersList, setProvidersList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();

  // Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // Reset to first page when search term changes
      setProvidersList([]); // Clear existing data
      setHasMore(true); // Reset hasMore when search changes
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const {
    data: providersData,
    error: providersError,
    isLoading: isprovidersLoading,
    isFetching: isFetchingproviders,
    refetch: refetchproviders,
  } = useGetprovidersQuery({
    city: null,
    page,
    size: 7,
    sortDirection,
    search: debouncedSearchTerm,
  });

  // Update providers list and hasMore state
  useEffect(() => {
    if (providersData?.body?.result) {
      const newProviders = providersData.body.result;

      if (page === 1) {
        // First page - replace the list
        setProvidersList(newProviders);
      } else {
        // Subsequent pages - append to list, avoiding duplicates
        setProvidersList((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const uniqueNewProviders = newProviders.filter(
            (p) => !existingIds.has(p.id)
          );
          return [...prev, ...uniqueNewProviders];
        });
      }

      // Update hasMore based on pagination info
      const currentPage = providersData.body.currentPage;
      const totalPages = providersData.body.totalPages;
      setHasMore(currentPage < totalPages);
    }
  }, [providersData, page]);

  const handleLoadMore = useCallback(() => {
    if (!isFetchingproviders && hasMore && providersList.length > 0) {
      setPage((prev) => prev + 1);
    }
  }, [isFetchingproviders, hasMore, providersList.length]);

  const handleSearch = (text) => {
    setSearchTerm(text);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setPage(1);
      setProvidersList([]);
      setHasMore(true);
      await refetchproviders();
    } finally {
      setRefreshing(false);
    }
  }, [refetchproviders]);

  const isCloseToBottom = useCallback(
    ({ layoutMeasurement, contentOffset, contentSize }) => {
      const paddingToBottom = 50; // Increased padding for better UX
      return (
        layoutMeasurement.height + contentOffset.y >=
        contentSize.height - paddingToBottom
      );
    },
    []
  );

  const handleScroll = useCallback(
    ({ nativeEvent }) => {
      if (isCloseToBottom(nativeEvent)) {
        handleLoadMore();
      }
    },
    [isCloseToBottom, handleLoadMore]
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-5 pt-2">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-5 mt-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4 bg-[#1A2432] p-2 rounded-full"
          >
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">
            Book Event Planners
          </Text>
          <View className="w-6" />
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-[#0D1A2C] rounded-lg px-4 mb-5 h-12">
          <Search size={20} color={colors.placeholder} className="mr-3" />
          <TextInput
            className="flex-1 text-white text-base"
            placeholder="Search for planners"
            placeholderTextColor={colors.placeholder}
            value={searchTerm}
            onChangeText={handleSearch}
          />
          <TouchableOpacity className="p-1">
            <Mic size={20} color={colors.placeholder} />
          </TouchableOpacity>
        </View>

        {/* Professionals Count */}
        <Text className="text-white text-sm mb-4">
          Showing {providersList.length} of{" "}
          {providersData?.body?.totalItems || 0} Professionals
        </Text>

        {/* Professionals List */}
        <ScrollView
          className="flex-1"
          onScroll={handleScroll}
          scrollEventThrottle={400}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
        >
          {providersList.map((provider) => (
            <TouchableOpacity
              onPress={() =>
                router.push(`/(provider)/${provider.user_id}/servicedetails`)
              }
              key={`${provider.id}-${provider.user_id}`} // More unique key
              className="flex-row bg-[#0D1A2C] rounded-2xl p-4 mb-4 items-center shadow-md"
            >
              <View className="mr-4">
                <Image
                  source={{
                    uri:
                      provider.profile_image ||
                      "https://placehold.co/100x100/9EDD45/020E1E?text=AC",
                  }}
                  className="w-16 h-16 rounded-full border-2 border-primary"
                />
              </View>
              <View className="flex-1 justify-center">
                <Text className="text-white text-lg font-bold mb-0.5">
                  {provider.business_name}
                </Text>
                <Text className="text-gray-400 text-sm mb-0.5">
                  {provider.specialties?.[0] || "Event Planner"}
                </Text>
                <Text className="text-gray-400 text-xs">
                  {provider.city}...
                </Text>
              </View>
              <View className="items-end justify-between self-stretch">
                <View className="flex-row items-center mb-1">
                  <Star size={16} color={colors.starGold} />
                  <Text className="text-yellow-400 text-sm ml-1 mr-2">
                    {provider.rating || 0}
                  </Text>
                  <Text className="text-[#9EDD45] text-base font-bold">
                    {provider.currency} {provider.price}
                  </Text>
                </View>
                <TouchableOpacity className="bg-[#9EDD45] py-2 px-4 rounded-lg mt-1">
                  <Text className="text-[#020E1E] text-sm font-bold">
                    Book Planner
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}

          {/* Loading indicator */}
          {isFetchingproviders && (
            <View className="py-4">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}

          {/* End of list message */}
          {!hasMore && providersList.length > 0 && (
            <View className="py-4 items-center">
              <Text className="text-gray-400">No more providers to load</Text>
            </View>
          )}

          {providersError && (
            <View className="py-4 items-center">
              <Text className="text-red-500">Error loading providers</Text>
              <TouchableOpacity
                onPress={onRefresh}
                className="mt-2 bg-primary py-2 px-4 rounded-lg"
              >
                <Text className="text-[#020E1E]">Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isprovidersLoading &&
            providersList.length === 0 &&
            !isFetchingproviders && (
              <View className="py-10 items-center">
                <Text className="text-white">No providers found</Text>
              </View>
            )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default Services;
