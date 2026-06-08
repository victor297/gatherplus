import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Search,
  Calendar,
  TimerReset,
} from "lucide-react-native";
import {
  useGetcategoriesQuery,
} from "@/redux/api/eventsApiSlice";
import { useGetMyNewEventsQuery } from "@/redux/api/newEventsApiSlice";
import { formatDate } from "@/utils/formatDate";
import { FlatList } from "react-native";
import { getApiErrorMessage } from "@/utils/api";
import { mapNewEventToMobileForm } from "@/utils/newEventForm";

export default function MyEventsScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [size] = useState(10); // Number of items per page
  const [allEvents, setAllEvents] = useState<any>([]); // Store all loaded events
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  const { data: categories, isLoading, error } = useGetcategoriesQuery<any>({});

  const {
    data: upcoming,
    error: upcomingError,
    isLoading: isupcomingLoading,
    isFetching,
    refetch: refetchUpcoming,
  } = useGetMyNewEventsQuery(
    {
      category_id: selectedCategory,
      search: searchTerm,
      page,
      size,
    },
    { refetchOnMountOrArgChange: true, refetchOnFocus: true }
  );
  // Reset page and clear events when filters change
  useEffect(() => {
    setPage(1);
    setAllEvents([]);
  }, [selectedCategory, searchTerm, statusFilter]);

  // Append new events when data is loaded
  useEffect(() => {
    if (upcoming?.body?.result) {
      if (page === 1) {
        setAllEvents(upcoming.body.result);
      } else {
        setAllEvents((prev: any) => [...prev, ...upcoming.body.result]);
      }
    }
  }, [upcoming]);
  // useFocusEffect(() => {

  //   refetchUpcoming();
  // }, );

  const visibleEvents = allEvents.filter((event: any) => {
    if (statusFilter === "published") return Boolean(event.published);
    if (statusFilter === "draft") return !event.published;
    return true;
  });

  const firstSession = (event: any) => event?.sessions?.[0] || {};
  const firstTicket = (event: any) => event?.tickets?.[0] || {};

  const openEditWizard = (event: any) => {
    router.push({
      pathname: "/create",
      params: {
        eventId: String(event.id),
        formData: JSON.stringify(mapNewEventToMobileForm(event)),
      },
    });
  };

  const handleLoadMore = () => {
    if (!isFetching && upcoming?.body?.result?.length === size) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <View className=" bg-background flex-1">
      <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4 bg-[#1A2432] p-2 rounded-full"
          >
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

      <View className="flex-row px-4 mb-3 gap-2">
        {[
          { key: "all", label: "All" },
          { key: "published", label: "Published" },
          { key: "draft", label: "Drafts" },
        ].map((item) => (
          <TouchableOpacity
            key={item.key}
            className={`px-4 py-2 rounded-lg ${
              statusFilter === item.key ? "bg-primary" : "bg-[#1A2432]"
            }`}
            onPress={() => setStatusFilter(item.key as any)}
          >
            <Text
              className={
                statusFilter === item.key
                  ? "text-background font-semibold"
                  : "text-white"
              }
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 mx-auto h-12 mb-2"
      >
        {isupcomingLoading || isLoading ? (
          <View className="text-white flex justify-center mx-auto items-center py-4">
            <ActivityIndicator color="#9EDD45" />
          </View>
        ) : upcomingError ? (
          <Text className="text-red-500 text-center py-4">
            {getApiErrorMessage(upcomingError, "Failed to load data. Please try again.")}
          </Text>
        ) : (
          [{ id: null, name: "All" }, ...(categories?.body || [])].map(
            (category, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedCategory(category?.id)}
                className={`max-h-8 px-6 py-2 rounded-full mr-3 ${
                  selectedCategory === category.id
                    ? "bg-primary"
                    : "bg-[#1A2432]"
                }`}
              >
                <Text className="text-white">{category?.name}</Text>
              </TouchableOpacity>
            )
          )
        )}
      </ScrollView>

      <FlatList
        data={visibleEvents}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ListEmptyComponent={() => (
          <View className="flex-1 bg-background justify-center items-center py-8">
            <Text className="text-gray-400 text-lg">
              {isupcomingLoading || !visibleEvents || isFetching ? (
                <View className="py-4 flex justify-center items-center">
                  <ActivityIndicator color="#9EDD45" />
                </View>
              ) : (
                "No events match this view"
              )}
            </Text>
          </View>
        )}
        ListFooterComponent={() =>
          isFetching && page > 1 ? (
            <View className="py-4 flex justify-center mx-auto items-center">
              <ActivityIndicator color="#9EDD45" />
            </View>
          ) : null
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5} // Changed to trigger closer to the bottom
        renderItem={({ item: event }) => (
          <TouchableOpacity
            key={event.id}
            onPress={() => openEditWizard(event)}
            className="bg-[#1A2432] rounded-lg mb-4"
          >
            <Image
              source={{
                uri:
                  event?.images?.[0] ||
                  "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3",
              }}
              className="w-full h-48 rounded-lg"
              resizeMode="cover"
            />
            <View className="p-4">
              <View className="flex-row justify-between gap-3">
                <Text className="text-white text-lg font-bold mb-2 flex-1">
                  {event?.title}
                </Text>
                <View
                  className={`px-3 py-1 rounded-full h-8 ${
                    event?.published ? "bg-primary" : "bg-amber-500"
                  }`}
                >
                  <Text className="text-background font-semibold">
                    {event?.published ? "Published" : "Draft"}
                  </Text>
                </View>
              </View>
              {!!event?.summary && (
                <Text className="text-gray-400 mb-3">{event.summary}</Text>
              )}

              <View className="flex-row items-center justify-between">
                <View className="flex-col">
                  <View className="flex flex-row gap-2 items-center">
                    <Calendar className="text-gray-400" size={20} />
                    <Text className="text-gray-400 text-sm">
                      {firstSession(event)?.date
                        ? formatDate(firstSession(event).date).toString()
                        : "No session date"}
                    </Text>
                  </View>
                  <View className="flex flex-row gap-2 mt-1 items-center">
                    <TimerReset className="text-gray-400" size={24} />
                    <Text className="text-gray-400 text-sm">
                      {event?.attendance_mode || "VENUE"}
                    </Text>
                  </View>
                </View>

                <View className="mt-2">
                  {event?.is_free ? (
                    <Text className="text-primary text-lg font-semibold">
                      Free
                    </Text>
                  ) : (
                    <Text className="text-primary text-lg font-semibold">
                      {event?.currency?.split(" - ")[0] || "₦"}{" "}
                      {firstTicket(event)?.price || event?.price || 0}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                className="mt-4 bg-primary rounded-lg py-3"
                onPress={() => openEditWizard(event)}
              >
                <Text className="text-background text-center font-semibold">
                  Edit Event
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
