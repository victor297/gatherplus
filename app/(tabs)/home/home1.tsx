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
import {
  MapPin,
  Search,
  ChevronDown,
  StarIcon,
  Globe2,
  ArrowRight,
  BookOpenText,
} from "lucide-react-native";
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
import { useGetprovidersQuery } from "@/redux/api/providersApiSlice";
import { truncateAlphabet, truncateSentence } from "@/utils";
import NotificationBellButton from "@/app/components/NotificationBellButton";
import {
  BlogPost,
  useGetPublicBlogsQuery,
} from "@/redux/api/blogApiSlice";

const DEFAULT_BLOG_IMAGE =
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30";

function blogImage(post?: BlogPost) {
  return post?.cover_image_url || post?.hero_image_url || DEFAULT_BLOG_IMAGE;
}

function formatBlogDate(value?: string | null) {
  if (!value) return "GatherPlux";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "GatherPlux";

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

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
  const {
    data: providers,
    error: providersError,
    isLoading: isprovidersLoading,
    isFetching: isFetchingproviders,
    refetch: refetchproviders,
  } = useGetprovidersQuery({
    city: null,
    // type: "LIVE",
    page: 1,
    size: 4,
    sortDirection,
    // search: searchTerm,
  });
  const {
    data: blogData,
    isLoading: isBlogsLoading,
    isFetching: isFetchingBlogs,
    refetch: refetchBlogs,
  } = useGetPublicBlogsQuery({
    page: 1,
    size: 6,
  });

  const blogPosts = Array.isArray(blogData?.body?.result)
    ? blogData.body.result
    : [];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      refetchUpcoming(),
      refetchLive(),
      refetchproviders(),
      refetchBlogs(),
    ])
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
          <NotificationBellButton />
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
        ) : error || upcomingError || liveError || providersError ? (
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
              ) : (upcoming?.body?.events?.result?.length || 0) <= 0 ? (
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

            {/* Providers */}
            <View className="mb-6">
              <View className="flex-row justify-between items-center px-4 mb-4">
                <Text className="text-white text-xl font-bold">
                  Featured Planners and Pros{" "}
                </Text>
                <TouchableOpacity
                  className="p-2"
                  onPress={() => router.push("/marketplace" as any)}
                >
                  <Text className="text-primary">Marketplace</Text>
                </TouchableOpacity>
              </View>
              {isprovidersLoading || isFetchingproviders ? (
                <ActivityIndicator color="#9EDD45" />
              ) : (providers?.body?.result?.length || 0) <= 0 ? (
                <Text className="text-primary text-bold text-center">
                  No event found
                </Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="pl-4"
                >
                  {providers?.body?.result?.map((provider: any) => (
                    <TouchableOpacity
                      key={provider.id}
                      onPress={() =>
                        router.push(`/(provider)/${provider.id}/servicedetails`)
                      }
                      className="bg-[#1A2432] rounded-lg overflow-hidden p-2 mr-4 w-56 flex flex-row items-center"
                    >
                      <Image
                        source={{ uri: provider?.cover_image }}
                        className="w-20 rounded-full h-20 border-2 border-primary bg-white"
                        resizeMode="cover"
                      />
                      <View className="p-3">
                        <Text className="text-white font-semibold mb-1">
                          {provider?.business_name}
                        </Text>
                        <Text className="text-gray-400 text-sm">
                          {truncateAlphabet(provider?.specialties[0])}
                        </Text>
                        <Text className="text-gray-400 text-sm">
                          {truncateAlphabet(provider?.address)}
                        </Text>
                        <View className="flex flex-row items-center justify-between">
                          <Text className="text-primary text-sm font-bold">
                            {provider?.currency?.split(" - ")[0] || "₦"}{" "}
                            {provider?.price}
                          </Text>
                          <View className=" flex flex-row items-center">
                            <StarIcon color="orange" fill="orange" size={10} />
                            <Text className="text-white ml-1">
                              {provider?.total_reviews}
                            </Text>
                          </View>
                        </View>
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
              ) : (live?.body?.events?.result?.length || 0) <= 0 ? (
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

            <View className="px-4 mb-6">
              <TouchableOpacity
                className="bg-[#111823] border border-[#243044] rounded-2xl p-4"
                onPress={() => router.push("/marketplace" as any)}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="h-12 w-12 rounded-2xl bg-[#1A2432] items-center justify-center mr-3">
                      <Globe2 color="#9EDD45" size={22} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-lg font-bold">
                        Public Marketplace
                      </Text>
                      <Text className="text-gray-400 mt-1" numberOfLines={2}>
                        Explore active cities, planners, and public events.
                      </Text>
                    </View>
                  </View>
                  <View className="h-10 w-10 rounded-full bg-[#1A2432] items-center justify-center ml-3">
                    <ArrowRight color="#9EDD45" size={18} />
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Blog */}
            <View className="mb-8">
              <View className="flex-row justify-between items-center px-4 mb-3">
                <View className="flex-1 pr-3">
                  <Text className="text-white text-xl font-bold">
                    Latest from the blog
                  </Text>
                  <Text className="text-gray-400 mt-1">
                    Tips for hosts, buyers, and planners.
                  </Text>
                </View>
                <TouchableOpacity
                  className="bg-[#1A2432] border border-[#243044] rounded-full px-4 py-2"
                  onPress={() => router.push("/blog" as any)}
                >
                  <Text className="text-primary font-semibold">View all</Text>
                </TouchableOpacity>
              </View>

              {isBlogsLoading || isFetchingBlogs ? (
                <View className="py-4">
                  <ActivityIndicator color="#9EDD45" />
                </View>
              ) : blogPosts.length ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                >
                  {blogPosts.slice(0, 4).map((post) => (
                    <TouchableOpacity
                      key={post.id}
                      className="bg-[#111823] border border-[#243044] rounded-xl overflow-hidden mr-3 w-52"
                      onPress={() => router.push(`/blog/${post.slug}` as any)}
                    >
                      <Image
                        source={{ uri: blogImage(post) }}
                        className="w-full h-20 bg-[#1A2432]"
                        resizeMode="cover"
                      />
                      <View className="p-3">
                        <View className="flex-row items-center mb-2">
                          <BookOpenText color="#9EDD45" size={12} />
                          <Text
                            className="text-primary text-[11px] font-bold ml-2 flex-1"
                            numberOfLines={1}
                          >
                            {post.category || "Story"}
                          </Text>
                          <Text className="text-gray-500 text-[11px] ml-1">
                            {formatBlogDate(
                              post.published_at || post.created_at
                            )}
                          </Text>
                        </View>
                        <Text
                          className="text-white text-sm font-bold leading-5"
                          numberOfLines={2}
                        >
                          {post.title}
                        </Text>
                        {!!post.excerpt && (
                          <Text
                            className="text-gray-400 text-xs leading-4 mt-1"
                            numberOfLines={2}
                          >
                            {post.excerpt}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
