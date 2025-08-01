import {
  View,
  Text,
  TextInput,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from "react-native";
import { MapPin, Search, Bell, ChevronDown } from "lucide-react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import {
  useGetcategoriesQuery,
  useGetCountriesQuery,
  useGetEventsQuery,
  useGetStatesQuery,
} from "@/redux/api/eventsApiSlice";
import { useCallback, useEffect, useState } from "react";
import { formatDate } from "@/utils/formatDate";
import { useDispatch } from "react-redux";
import { checkTokenImmediately } from "@/redux/features/auth/authSlice";

export default function HomeScreen() {
  const router = useRouter();
  const dispatch: any = useDispatch();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [city, setCity] = useState("Fetching location...");
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [selectedState, setSelectedState] = useState<any>(null);
  useEffect(() => {
    dispatch(checkTokenImmediately());

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setCity("Permission denied. Enable location services in settings.");
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      let reverseGeocode = await Location.reverseGeocodeAsync(loc.coords);
      if (reverseGeocode.length > 0) {
        setCity(`${reverseGeocode[0].city}, ${reverseGeocode[0].region}`);
        setSelectedState({ name: reverseGeocode[0].city });
        setSelectedCountry({ name: reverseGeocode[0].region });
      } else {
        setCity("Location not found");
      }
    })();
  }, []);
  const { data: countryData, isLoading: countryLoading } = useGetCountriesQuery(
    {}
  );
  const { data: stateData, isLoading: stateLoading } = useGetStatesQuery(
    selectedCountry?.code2,
    {
      skip: !selectedCountry, // Fetch only when a country is selected
    }
  );
  const { data: categories, isLoading, error } = useGetcategoriesQuery({});
  const {
    data: upcoming,
    error: upcomingError,
    isLoading: isupcomingLoading,
    refetch: refetchUpcoming,
    isFetching,
  } = useGetEventsQuery({
    city: null,
    type: "UPCOMING",
    category_id: selectedCategory,
    page: 1,
    size: 3,
    sortDirection,
    search: searchTerm,
    country_code: selectedCountry?.code2 || null,
    state_id: selectedState?.id || null,
  });

  const {
    data: live,
    error: liveError,
    isLoading: isliveLoading,
    isFetching: isFetchinglive,
    refetch: refetchLive,
  } = useGetEventsQuery({
    city: null,
    type: "LIVE",
    category_id: selectedCategory,
    page: 1,
    size: 4,
    sortDirection,
    search: searchTerm,
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([refetchUpcoming(), refetchLive()])
      .then(() => setRefreshing(false))
      .catch(() => setRefreshing(false));
  }, []);

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-12">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <MapPin size={20} color="#9EDD45" />
            {/* Selected Location Display with Dropdown Icon */}
            <TouchableOpacity
              className="p-4  rounded-lg flex-row gap-1 items-center"
              onPress={() => setShowCountryModal(true)}
            >
              <Text className="text-white text-lg font-medium">
                {selectedCountry && selectedState
                  ? `${selectedState.name}, ${selectedCountry.name}`
                  : "Select Location"}
              </Text>
              <ChevronDown size={20} color="#9EDD45" />
            </TouchableOpacity>

            {/* Country Modal */}
            <Modal visible={showCountryModal} transparent animationType="slide">
              <TouchableOpacity
                activeOpacity={1}
                className="flex-1 justify-end bg-black/50"
                onPress={() => setShowCountryModal(false)}
              >
                <View className="bg-[#1A2432] rounded-t-3xl p-6">
                  <Text className="text-white text-xl font-semibold mb-4">
                    Select Country
                  </Text>
                  <ScrollView className="max-h-96">
                    {countryData?.body?.map((country: any) => (
                      <TouchableOpacity
                        key={country.code2}
                        className="py-4 border-b border-gray-700"
                        onPress={() => {
                          setSelectedCountry(country);
                          setSelectedState(null);
                          setShowCountryModal(false);
                          setShowStateModal(true);
                        }}
                      >
                        <Text className="text-white">{country.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </Modal>

            {/* State Modal */}
            <Modal visible={showStateModal} transparent animationType="slide">
              <TouchableOpacity
                activeOpacity={1}
                className="flex-1 justify-end bg-black/50"
                onPress={() => setShowStateModal(false)}
              >
                <View className="bg-[#1A2432] rounded-t-3xl p-6">
                  <Text className="text-white text-xl font-semibold mb-4">
                    Select State
                  </Text>
                  <ScrollView className="max-h-96">
                    {stateData?.body?.map((state: any) => (
                      <TouchableOpacity
                        key={state.id}
                        className="py-4 border-b border-gray-700"
                        onPress={() => {
                          setSelectedState(state);
                          setShowStateModal(false);
                        }}
                      >
                        <Text className="text-white">{state.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
          <TouchableOpacity>
            <Bell size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center bg-[#1A2432] rounded-lg px-4  mb-6">
          <Search size={20} color="#6B7280" />
          <TextInput
            className="flex-1 ml-3 py-3 text-white"
            placeholder="Search for events"
            placeholderTextColor="#6B7280"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Loading and Error Handling */}
        {isLoading ? (
          <View className="text-white flex items-center py-4">
            <ActivityIndicator color="#9EDD45" />
          </View>
        ) : error || upcomingError || liveError ? (
          <Text className="text-red-500 text-center py-4">
            Failed to load data. Please try again.
          </Text>
        ) : (
          <>
            {/* Categories */}
            <Text className="text-white text-xl font-bold px-4 mb-4">
              Categories
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="px-4 mb-6"
            >
              {[{ id: null, name: "All" }, ...(categories?.body || [])].map(
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
              )}
            </ScrollView>

            {searchTerm?.length <= 1 && !selectedCategory ? (
              <View className="px-4 mb-6">
                <View className="bg-[#1A2432] rounded-lg overflow-hidden">
                  <Image
                    source={require("../../../assets/images/landing.webp")}
                    className="w-full h-48"
                    resizeMode="cover"
                  />
                  <View className="p-4">
                    <Text className="text-white text-2xl font-bold">
                      Jazz Night Live
                    </Text>
                    <Text className="text-gray-400 mb-3">
                      Downtown Jazz Club
                    </Text>
                    <View className="bg-primary self-start px-4 py-2 rounded-full">
                      <Text className="text-background font-semibold">
                        $30 - $50
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : null}

            {/* Upcoming Events */}
            <View className="mb-6">
              <View className="flex-row justify-between items-center px-4 mb-4">
                <Text className="text-white text-xl font-bold">
                  Upcoming Events
                </Text>
                <TouchableOpacity
                  className="p-2"
                  onPress={() => router.push("/(tabs)/home/all-events")}
                >
                  <Text className="text-primary">See All</Text>
                </TouchableOpacity>
              </View>
              {isupcomingLoading || isFetching ? (
                <ActivityIndicator color="#9EDD45" />
              ) : upcoming?.body?.events?.result <= 0 ? (
                <Text className="text-primary text-bold text-center">
                  No event found
                </Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="pl-4"
                >
                  {upcoming?.body?.events?.result?.map((event: any) => (
                    <TouchableOpacity
                      key={event.id}
                      onPress={() =>
                        router.push(`/(tabs)/home/event/${event.id}`)
                      }
                      className="bg-[#1A2432] rounded-lg overflow-hidden mr-4 w-48"
                    >
                      <Image
                        source={{ uri: event?.images?.[0] }}
                        className="w-full h-32"
                        resizeMode="cover"
                      />
                      <View className="p-3">
                        <Text className="text-white font-semibold mb-1">
                          {event?.title}
                        </Text>
                        <Text className="text-gray-400 text-sm">
                          {formatDate(event?.start_date)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Live Events */}
            <View className="mb-6">
              <View className="flex-row justify-between items-center px-4 mb-4">
                <Text className="text-white text-xl font-bold">
                  Live Events
                </Text>
                <TouchableOpacity
                  className="p-2"
                  onPress={() => router.push("/(tabs)/home/explore")}
                >
                  <Text className="text-primary">Show All</Text>
                </TouchableOpacity>
              </View>
              {isliveLoading || isFetchinglive ? (
                <ActivityIndicator color="#9EDD45" />
              ) : live?.body?.events?.result <= 0 ? (
                <Text className="text-primary text-bold text-center">
                  No event found
                </Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="pl-4"
                >
                  <View className="px-4 flex-row gap-4">
                    {live?.body?.events?.result?.map((event: any) => (
                      <TouchableOpacity
                        key={event.id}
                        onPress={() =>
                          router.push(`/(tabs)/home/event/${event.id}`)
                        }
                        className="bg-[#1A2432] w-48 rounded-lg overflow-hidden mb-4"
                      >
                        <Image
                          source={{ uri: event?.images?.[0] }}
                          className="w-full h-32"
                          resizeMode="cover"
                        />
                        <View className="p-4">
                          <Text className="text-white text-xl font-semibold">
                            {event?.title}
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
                                  key={avatar}
                                  source={require("../../../assets/images/thumbnail.png")}
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
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
