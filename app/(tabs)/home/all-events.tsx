import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Bell, Filter, Calendar as CalendarIcon, TimerReset, MapPin, ChevronDown, Share2Icon, HeartIcon, MessageSquareIcon } from 'lucide-react-native';
import { useGetcategoriesQuery, useGetEventsQuery, useGetCountriesQuery, useGetStatesQuery } from '@/redux/api/eventsApiSlice';
import { formatDate } from '@/utils/formatDate';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';

interface Country {
  code2: string;
  name: string;
}

interface State {
  id: number;
  name: string;
  country_code: string;
}

export default function ExploreScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [allEvents, setAllEvents] = useState<any>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
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

  // API Queries
  const { data: categories, isLoading: isCategoriesLoading } = useGetcategoriesQuery({});
  const { data: countriesResponse, isLoading: isCountriesLoading } = useGetCountriesQuery({});
  const { data: statesResponse, isLoading: isStatesLoading } = useGetStatesQuery(selectedCountry?.code2 || '', {
    skip: !selectedCountry?.code2
  });

  const countries = countriesResponse?.body || [];
  const states = statesResponse?.body || [];

  const { 
    data: upcoming, 
    error: upcomingError, 
    isLoading: isUpcomingLoading, 
    isFetching, 
    refetch: refetchUpcoming 
  } = useGetEventsQuery({
    city: city || null,
    country_code: selectedCountry?.code2 || null,
    state_id: selectedState?.id || null,
    type: "UPCOMING",  
    category_id: selectedCategory,
    search: searchTerm,
    page,
    size,
    sortBy,
    sortDirection,
    start_date: startDate?.toISOString().split('T')[0],
    end_date: endDate?.toISOString().split('T')[0],
  });
console.log(selectedCountry?.code2,allEvents,"selectedCountry?.code2")
  // Get user's current location on mount
  useEffect(() => {
    const getLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Permission denied. Enable location services in settings.');
          return;
        }

        let loc = await Location.getCurrentPositionAsync({});
        let reverseGeocode = await Location.reverseGeocodeAsync(loc.coords);
        
        if (reverseGeocode.length > 0) {
          const { city: geoCity, country, isoCountryCode } = reverseGeocode[0];
          setCity(geoCity || "");
          
          // Find matching country in our list
          const matchedCountry = countries.find((c: Country) => 
            c.code2 === isoCountryCode || c.name === country
          );
          
          if (matchedCountry) {
            setSelectedCountry(matchedCountry);
          }
        }
      } catch (error) {
        console.error("Location error:", error);
        setLocationError('Failed to get location. You can set location manually.');
      }
    };

    if (countries.length > 0) {
      getLocation();
    }
  }, [countries]);

  // Reset page and clear events when filters change
  useEffect(() => {
    setPage(1);
    setAllEvents([]);
  }, [selectedCategory, searchTerm, sortBy, sortDirection, startDate, endDate, city, selectedCountry, selectedState]);

  // Append new events when data is loaded
  useEffect(() => {
    if (upcoming?.body?.events?.result) {
      if (page === 1) {
        setAllEvents(upcoming.body.events.result);
      } else {
        setAllEvents((prev: any) => [...prev, ...upcoming.body.events.result]);
      }
    }
  }, [upcoming]);
  useEffect(() => {
    if (upcoming?.body?.events?.result) {
      if (page === 1) {
        setAllEvents(upcoming.body.events.result);
      } else {
        // Only append new events if they don't already exist
        setAllEvents((prev:any) => {
          const existingIds = new Set(prev.map((event:any) => event.id));
          const newEvents = upcoming.body.events.result.filter((event:any) => !existingIds.has(event.id));
          return [...prev, ...newEvents];
        });
      }
    } else if (page === 1) {
      // Clear events if no results on first page
      setAllEvents([]);
    }
  }, [upcoming, page]);

  const handleLoadMore = () => {
    if (!isFetching && upcoming?.body?.events?.result?.length === size) {
      setPage((prev) => prev + 1);
    }
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleSortByPrice = () => {
    if (sortBy === 'price') {
      toggleSortDirection();
    } else {
      setSortBy('price');
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setSortBy(null);
    setSortDirection('asc');
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
          <TouchableOpacity onPress={() => router.back()} className="mr-4 bg-[#1A2432] p-2 rounded-full">
                    <ArrowLeft color="white" size={24} />
                  </TouchableOpacity>
          <Text className="text-white text-xl font-semibold">Upcoming Events</Text>
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

            <ScrollView nestedScrollEnabled={true} >
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
                      {selectedCountry?.name || 'Select Country'}
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
                          keyExtractor={(item) => item.code2}
                          nestedScrollEnabled={true} 
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
                        {selectedState?.name || 'Select State'}
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
                  <Text className="text-red-500 text-sm mb-2">{locationError}</Text>
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
                  {sortBy === 'price' && (
                    <Text className="text-primary">
                      {sortDirection === 'asc' ? 'Low to High' : 'High to Low'}
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
                    {startDate ? formatDate(startDate) : 'Start Date'}
                  </Text>
                  <CalendarIcon color="#6B7280" size={20} />
                </TouchableOpacity>

                <TouchableOpacity 
                  className="flex-row items-center justify-between p-3 bg-[#2A3647] rounded-lg"
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text className="text-white">
                    {endDate ? formatDate(endDate) : 'End Date'}
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled={true}  className="px-4 h-12 mb-2">
        {isCategoriesLoading ? (
          <View className="text-white flex justify-center items-center py-4"><ActivityIndicator color="#9EDD45" /></View>
        ) : upcomingError ? (
          <Text className="text-red-500 text-center py-4">Failed to load data. Please try again.</Text>
        ) : (
          [{ id: null, name: "All" }, ...(categories?.body || [])].map((category) => (
            <TouchableOpacity
              key={category.id || 'all'}
              onPress={() => setSelectedCategory(category.id)}
              className={`max-h-8 px-6 py-2 rounded-full mr-3 ${
                selectedCategory === category.id ? 'bg-primary' : 'bg-[#1A2432]'
              }`}
            >
              <Text className="text-white">{category.name}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Current Location Display */}
      {(city || selectedState || selectedCountry) && (
        <View className="px-4 mb-2 flex-row flex  justify-center items-center">
          <MapPin size={16} color="#6B7280" />
          <Text className="text-gray-400 ">
            {[city, selectedState?.name, selectedCountry?.name].filter(Boolean).join(', ')}
          </Text>
        </View>
      )}

      {/* Events List */}
      <FlatList
  data={allEvents}
  nestedScrollEnabled={true} 
  keyExtractor={(item,index) => index.toString()}
  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
  ListEmptyComponent={() => (
    <View className="flex-1 bg-background justify-center items-center py-8">
      <Text className="text-gray-400 text-lg">
        {isUpcomingLoading ? <View className="py-4 flex justify-center items-center">
                      <ActivityIndicator color="#9EDD45" />
                    </View>  : 
         upcoming?.body?.events?.result?.length === 0 ? 'No events found matching your criteria' : 
         'No events available'}
      </Text>
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
    <View className="mb-4">
      <TouchableOpacity
        key={event.id}
        className="bg-[#1A2432] rounded-lg"
        onPress={() => router.push(`/(tabs)/home/event/${event.id}`)}
      >
        <Image
          source={{ uri: event?.images?.[0] }}
          className="w-full h-48 rounded-t-lg"
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
                <CalendarIcon className="text-gray-400" size={20} />
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

    
    </View>
  )}
/>
    </View>
  );
}