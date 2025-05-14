import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Search,
  Bell,
  Filter,
  Calendar as CalendarIcon,
  TimerReset,
  MapPin,
  ChevronDown,
} from "lucide-react-native";
import {
  useGetcategoriesQuery,
  useGetEventsQuery,
  useGetCountriesQuery,
  useGetStatesQuery,
} from "@/redux/api/eventsApiSlice";
import { formatDate } from "@/utils/formatDate";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";

interface Country {
  code2: string;
  name: string;
  // other properties from your API response
}

interface State {
  id: number;
  name: string;
  country_code: string;
  // other properties from your API response
}

export default function ExploreScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [size] = useState(4);
  const [allEvents, setAllEvents] = useState<any>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [city, setCity] = useState<string>("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationDetermined, setLocationDetermined] = useState(false);

  // API Queries
  const {
    data: categories,
    isLoading: isCategoriesLoading,
    error: catError,
  } = useGetcategoriesQuery({});
  const { data: countriesResponse, isLoading: isCountriesLoading } =
    useGetCountriesQuery({});
  const { data: statesResponse, isLoading: isStatesLoading } =
    useGetStatesQuery(selectedCountry?.code2 || "", {
      skip: !selectedCountry?.code2,
    });
  console.log(allEvents?.[0]?.id, "allEvents");
  const countries = countriesResponse?.body || [];
  const states = statesResponse?.body || [];

  const {
    data: upcoming,
    error: upcomingError,
    isLoading: isUpcomingLoading,
    isFetching,
    refetch: refetchUpcoming,
  } = useGetEventsQuery({
    city: city || null,
    country_code: selectedCountry?.code2 || null,
    state_id: selectedState?.id || null,
    type: "LIVE",
    category_id: selectedCategory,
    search: searchTerm,
    page,
    size,
    sortBy,
    sortDirection,
    start_date: startDate?.toISOString().split("T")[0],
    end_date: endDate?.toISOString().split("T")[0],
  });

  // Get user's current location on mount
  // useEffect(() => {
  //   const getLocation = async () => {
  //     try {
  //       let { status } = await Location.requestForegroundPermissionsAsync();
  //       if (status !== "granted") {
  //         setLocationError(
  //           "Permission denied. Enable location services in settings."
  //         );
  //         setLocationDetermined(true); // Mark as determined even if failed
  //         return;
  //       }

  //       let loc = await Location.getCurrentPositionAsync({});
  //       let reverseGeocode = await Location.reverseGeocodeAsync(loc.coords);

  //       if (reverseGeocode.length > 0) {
  //         const { city: geoCity, country, isoCountryCode } = reverseGeocode[0];
  //         setCity(geoCity || "");

  //         // Find matching country in our list
  //         const matchedCountry = countries.find(
  //           (c: Country) => c.code2 === isoCountryCode || c.name === country
  //         );

  //         if (matchedCountry) {
  //           setSelectedCountry(matchedCountry);
  //         }
  //       }
  //     } catch (error) {
  //       console.error("Location error:", error);
  //       setLocationError(
  //         "Failed to get location. You can set location manually."
  //       );
  //     } finally {
  //       setLocationDetermined(true); // Mark as determined whether success or fail
  //     }
  //   };

  //   if (countries.length > 0) {
  //     getLocation();
  //   }
  // }, [countries]);

  // Reset page and clear events when filters change
  useEffect(() => {
    setPage(1);
    setAllEvents([]);
  }, [
    selectedCategory,
    searchTerm,
    sortBy,
    sortDirection,
    startDate,
    endDate,
    city,
    selectedCountry,
    selectedState,
  ]);

  // Append new events when data is loaded
  useEffect(() => {
    if (upcoming?.body?.events?.result) {
      if (page === 1) {
        setAllEvents(upcoming?.body?.events?.result);
      } else {
        setAllEvents((prev: any) => [
          ...prev,
          ...upcoming?.body?.events?.result,
        ]);
      }
    }
  }, [upcoming]);

  const handleLoadMore = () => {
    if (!isFetching && upcoming?.body?.events?.result?.length === size) {
      setPage((prev) => prev + 1);
    }
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const handleSortByPrice = () => {
    if (sortBy === "price") {
      toggleSortDirection();
    } else {
      setSortBy("price");
      setSortDirection("asc");
    }
  };

  const clearFilters = () => {
    setSortBy(null);
    setSortDirection("asc");
    setStartDate(null);
    setEndDate(null);
    setSelectedCountry(null);
    setSelectedState(null);
    setCity("");
    setShowFilters(false);
  };

  const applyFilters = () => {
    setPage(1);
    setAllEvents([]);
    setShowFilters(false);
  };

  return (
    <View className="bg-background flex-1">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4 bg-[#1A2432] p-2 rounded-full"
          >
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
          <Text className="text-white text-xl font-semibold">Explore</Text>
        </View>
        <View className="flex-row items-center space-x-4">
          <TouchableOpacity onPress={() => setShowFilters(true)}>
            <Filter color="white" size={24} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Bell color="white" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View className="flex-1 bg-black bg-opacity-50 justify-end">
          <View className="bg-[#1A2432] p-6 rounded-t-2xl max-h-[80vh]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white text-xl font-bold">Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Text className="text-primary">Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView nestedScrollEnabled={true}>
              {/* Location Filters */}
              <View className="mb-6">
                <Text className="text-white text-lg mb-3">Location</Text>

                {/* Country Dropdown */}
                <View className="mb-3">
                  <TouchableOpacity
                    className="flex-row items-center justify-between p-3 bg-[#2A3647] rounded-lg"
                    onPress={() => setShowCountryDropdown(!showCountryDropdown)}
                  >
                    <Text className="text-white">
                      {selectedCountry?.name || "Select Country"}
                    </Text>
                    <ChevronDown color="#6B7280" size={20} />
                  </TouchableOpacity>

                  {showCountryDropdown && (
                    <View className="mt-2 bg-[#2A3647] rounded-lg max-h-40">
                      {isCountriesLoading ? (
                        <ActivityIndicator color="#9EDD45" className="py-2" />
                      ) : (
                        <FlatList
                          data={countries}
                          nestedScrollEnabled={true}
                          keyExtractor={(item) => item.code2}
                          renderItem={({ item }) => (
                            <TouchableOpacity
                              className="p-3 border-b border-[#1A2432]"
                              onPress={() => {
                                setSelectedCountry(item);
                                setSelectedState(null);
                                setShowCountryDropdown(false);
                              }}
                            >
                              <Text className="text-white">{item.name}</Text>
                            </TouchableOpacity>
                          )}
                        />
                      )}
                    </View>
                  )}
                </View>

                {/* State Dropdown */}
                {selectedCountry && (
                  <View className="mb-3">
                    <TouchableOpacity
                      className="flex-row items-center justify-between p-3 bg-[#2A3647] rounded-lg"
                      onPress={() => setShowStateDropdown(!showStateDropdown)}
                    >
                      <Text className="text-white">
                        {selectedState?.name || "Select State"}
                      </Text>
                      <ChevronDown color="#6B7280" size={20} />
                    </TouchableOpacity>

                    {showStateDropdown && (
                      <View className="mt-2 bg-[#2A3647] rounded-lg max-h-40">
                        {isStatesLoading ? (
                          <ActivityIndicator color="#9EDD45" className="py-2" />
                        ) : (
                          <FlatList
                            data={states}
                            nestedScrollEnabled={true}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                              <TouchableOpacity
                                className="p-3 border-b border-[#1A2432]"
                                onPress={() => {
                                  setSelectedState(item);
                                  setShowStateDropdown(false);
                                }}
                              >
                                <Text className="text-white">{item.name}</Text>
                              </TouchableOpacity>
                            )}
                          />
                        )}
                      </View>
                    )}
                  </View>
                )}

                {/* City Input */}
                <View className="flex-row items-center bg-[#2A3647] rounded-lg px-4 mb-3">
                  <MapPin size={20} color="#6B7280" />
                  <TextInput
                    className="flex-1 ml-3 py-3 text-white"
                    placeholder="Enter city"
                    placeholderTextColor="#6B7280"
                    value={city}
                    onChangeText={setCity}
                  />
                </View>

                {locationError && (
                  <Text className="text-red-500 text-sm mb-2">
                    {locationError}
                  </Text>
                )}
              </View>

              {/* Sort by Price */}
              <View className="mb-6">
                <Text className="text-white text-lg mb-3">Sort By</Text>
                <TouchableOpacity
                  className="flex-row items-center justify-between p-3 bg-[#2A3647] rounded-lg"
                  onPress={handleSortByPrice}
                >
                  <Text className="text-white">Price</Text>
                  {sortBy === "price" && (
                    <Text className="text-primary">
                      {sortDirection === "asc" ? "Low to High" : "High to Low"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Date Range */}
              <View className="mb-6">
                <Text className="text-white text-lg mb-3">Date Range</Text>

                <TouchableOpacity
                  className="flex-row items-center justify-between p-3 bg-[#2A3647] rounded-lg mb-3"
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text className="text-white">
                    {startDate ? formatDate(startDate) : "Start Date"}
                  </Text>
                  <CalendarIcon color="#6B7280" size={20} />
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-row items-center justify-between p-3 bg-[#2A3647] rounded-lg"
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text className="text-white">
                    {endDate ? formatDate(endDate) : "End Date"}
                  </Text>
                  <CalendarIcon color="#6B7280" size={20} />
                </TouchableOpacity>

                {showStartDatePicker && (
                  <DateTimePicker
                    value={startDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowStartDatePicker(false);
                      if (selectedDate) {
                        setStartDate(selectedDate);
                      }
                    }}
                  />
                )}

                {showEndDatePicker && (
                  <DateTimePicker
                    value={endDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowEndDatePicker(false);
                      if (selectedDate) {
                        setEndDate(selectedDate);
                      }
                    }}
                    minimumDate={startDate || new Date()}
                  />
                )}
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View className="flex-row justify-between mt-4">
              <TouchableOpacity
                className="px-6 py-3 border border-primary rounded-lg"
                onPress={clearFilters}
              >
                <Text className="text-primary">Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-6 py-3 bg-primary rounded-lg"
                onPress={applyFilters}
              >
                <Text className="text-white">Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Search and Category Selection */}
      <View className="flex-row mx-4 items-center bg-[#1A2432] rounded-lg px-4 mb-6">
        <Search size={20} color="#6B7280" />
        <TextInput
          className="flex-1 ml-3 py-3 text-white"
          placeholder="Search for events"
          placeholderTextColor="#6B7280"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled={true}
        className="px-4 h-12 mb-2"
      >
        {isCategoriesLoading ? (
          <View className="text-white mx-auto flex justify-center items-center py-4">
            <ActivityIndicator color="#9EDD45" />
          </View>
        ) : catError ? (
          <Text className="text-red-500 text-center py-4">
            Failed to load data. Please try again.
          </Text>
        ) : (
          [{ id: null, name: "All" }, ...(categories?.body || [])].map(
            (category) => (
              <TouchableOpacity
                key={category.id || "all"}
                onPress={() => setSelectedCategory(category.id)}
                className={`max-h-8 px-6 py-2 rounded-full mr-3 ${
                  selectedCategory === category.id
                    ? "bg-primary"
                    : "bg-[#1A2432]"
                }`}
              >
                <Text className="text-white">{category.name}</Text>
              </TouchableOpacity>
            )
          )
        )}
      </ScrollView>

      {/* Current Location Display */}
      {(city || selectedState || selectedCountry) && (
        <View className="px-4 mb-2 flex-row flex  justify-center items-center">
          <MapPin size={16} color="#6B7280" />
          <Text className="text-gray-400 ml-1">
            {[city, selectedState?.name, selectedCountry?.name]
              .filter(Boolean)
              .join(", ")}
          </Text>
        </View>
      )}

      {/* Events List */}
      <FlatList
        data={allEvents}
        nestedScrollEnabled={true}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ListEmptyComponent={() => (
          <View className="flex-1 bg-background justify-center items-center py-8">
            {isUpcomingLoading ? (
              <View className="py-4 flex justify-center items-center">
                <ActivityIndicator color="#9EDD45" />
              </View>
            ) : allEvents.length === 0 ? (
              <Text className="text-gray-400 text-lg">
                No events found for location. Kindly adjust filter
              </Text>
            ) : null}
          </View>
        )}
        ListFooterComponent={() =>
          isFetching && page > 1 ? (
            <View className="py-4 flex justify-center items-center">
              <ActivityIndicator color="#9EDD45" />
            </View>
          ) : null
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
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
              <Text className="text-white text-xl font-semibold">
                {event.title}
              </Text>
              <Text className="text-gray-400 mb-4">
                {event?.address?.length > 25
                  ? `${event.address.slice(0, 25)}...`
                  : event?.address}
              </Text>
              <View className="flex-row items-center justify-between">
                <View className="flex-row">
                  {[1, 2, 3].map((avatar) => (
                    <Image
                      key={`avatar-${avatar}`}
                      source={{
                        uri: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde",
                      }}
                      className="w-8 h-8 rounded-full border-2 border-[#1A2432] -ml-2 first:ml-0"
                    />
                  ))}
                </View>
                <TouchableOpacity className="bg-primary px-6 py-2 rounded-full">
                  <Text className="text-background font-semibold">
                    Join now
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
