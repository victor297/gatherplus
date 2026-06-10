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
  CalendarDays,
  MonitorPlay,
  ShieldCheck,
  Ticket,
  TrendingUp,
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
import { truncateAlphabet } from "@/utils";
import NotificationBellButton from "@/app/components/NotificationBellButton";
import {
  BlogPost,
  useGetPublicBlogsQuery,
} from "@/redux/api/blogApiSlice";
import { useGetTicketExchangeMarketplaceQuery } from "@/redux/api/ticketExchangeApiSlice";
import { useGetRecommendedEventsQuery } from "@/redux/api/analyticsApiSlice";

const WEB_ORIGIN = String(
  process.env.EXPO_PUBLIC_WEB_URL || "https://www.gatherplux.com"
).replace(/\/$/, "");
const DEFAULT_BLOG_IMAGE =
  `${WEB_ORIGIN}/gatherplux-default.jpg`;

function resolveImageUri(value?: unknown) {
  const uri = String(value || "").trim();
  if (!uri) return null;
  if (/^https?:\/\//i.test(uri)) return uri;
  if (uri.startsWith("//")) return `https:${uri}`;
  if (uri.startsWith("/")) return `${WEB_ORIGIN}${uri}`;
  return uri;
}

function blogImage(post?: BlogPost) {
  return (
    resolveImageUri(
      post?.cover_image_url ||
        post?.hero_image_url ||
        (post as any)?.image_url ||
        (post as any)?.cover_image
    ) || DEFAULT_BLOG_IMAGE
  );
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

const getArray = (value: unknown) => (Array.isArray(value) ? value : []);

const normalizeCurrency = (value?: unknown) =>
  String(value || "NGN").split(/[\s-]/)[0] || "NGN";

const money = (value?: unknown, currency?: unknown) => {
  const amount = Number(value || 0);
  const code = normalizeCurrency(currency);
  try {
    return new Intl.NumberFormat("en-US", {
      currency: code,
      maximumFractionDigits: amount % 1 ? 2 : 0,
      style: "currency",
    }).format(amount);
  } catch {
    return `${code} ${amount.toLocaleString()}`;
  }
};

const eventImage = (event: any) =>
  resolveImageUri(
    event?.images?.[0] || event?.image || event?.cover_image || null
  );

const resaleImage = (listing: any) =>
  eventImage(listing?.event) ||
  resolveImageUri(
    listing?.event_image ||
      listing?.image ||
      listing?.cover_image ||
      listing?.booking?.event?.images?.[0]
  );

const eventLocation = (event: any) => {
  const mode = String(event?.attendance_mode || "").toUpperCase();
  if (mode === "ONLINE") return "Online";
  return event?.city || event?.address || event?.state?.name || "Location TBA";
};

const eventPrice = (event: any) => {
  if (event?.is_free) return "Free";
  const ticketPrices = getArray(event?.tickets)
    .map((ticket: any) => Number(ticket?.price || 0))
    .filter((price) => price > 0);
  const price = Number(event?.price || ticketPrices[0] || 0);
  return price > 0 ? money(price, event?.currency) : "Free";
};

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
    data: online,
    isLoading: isOnlineLoading,
    isFetching: isFetchingOnline,
    refetch: refetchOnline,
  } = useGetEventsQuery({
    attendance_mode: "ONLINE",
    city: null,
    page: 1,
    search: searchTerm,
    size: 6,
    sortDirection,
    type: "UPCOMING",
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
  const {
    data: resaleData,
    isLoading: isResaleLoading,
    isFetching: isFetchingResale,
    refetch: refetchResale,
  } = useGetTicketExchangeMarketplaceQuery({
    page: 1,
    size: 6,
  });
  const {
    data: recommendedData,
    isLoading: isRecommendedLoading,
    isFetching: isFetchingRecommended,
    refetch: refetchRecommended,
  } = useGetRecommendedEventsQuery({
    city: selectedState?.name || null,
    country_code: selectedCountry?.code2 || null,
    range: "30d",
    region: selectedState?.name || null,
    size: 6,
  });

  const blogPosts = Array.isArray(blogData?.body?.result)
    ? blogData.body.result
    : [];
  const recommendedEvents = getArray(recommendedData?.body?.result)
    .filter((event: any) => event?.id)
    .slice(0, 6);
  const onlineEvents = getArray(online?.body?.events?.result).slice(0, 6);
  const resaleBody = resaleData?.body || {};
  const resaleListings = getArray(
    resaleBody.listings || resaleBody.result || resaleBody.data
  )
    .filter(
      (listing: any) =>
        String(listing.status || "ACTIVE").toUpperCase() === "ACTIVE"
    )
    .slice(0, 6);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      refetchUpcoming(),
      refetchLive(),
      refetchOnline(),
      refetchproviders(),
      refetchBlogs(),
      refetchResale(),
      refetchRecommended(),
    ])
      .then(() => setRefreshing(false))
      .catch(() => setRefreshing(false));
  }, [
    refetchBlogs,
    refetchLive,
    refetchOnline,
    refetchproviders,
    refetchRecommended,
    refetchResale,
    refetchUpcoming,
  ]);

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
                  className="bg-[#1A2432] border border-[#243044] rounded-full px-4 py-2"
                  onPress={() => router.push("/marketplace" as any)}
                >
                  <Text className="text-primary font-semibold">Marketplace</Text>
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
                  className="bg-[#1A2432] border border-[#243044] rounded-full px-4 py-2"
                  onPress={() => router.push("/(tabs)/home/explore")}
                >
                  <Text className="text-primary font-semibold">Show all</Text>
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
                        className="bg-[#1A2432] w-52 rounded-2xl overflow-hidden mb-4 border border-[#243044]"
                      >
                        <Image
                          source={{ uri: event?.images?.[0] }}
                          className="w-full h-32"
                          resizeMode="cover"
                        />
                        <View className="p-3">
                          <View className="self-start bg-primary/15 rounded-full px-3 py-1 mb-2">
                            <Text className="text-primary text-xs font-bold">
                              Live now
                            </Text>
                          </View>
                          <Text
                            className="text-white text-lg font-bold leading-6"
                            numberOfLines={2}
                          >
                            {event?.title}
                          </Text>
                          <Text className="text-gray-400 mt-1" numberOfLines={2}>
                            {event?.address?.length > 25
                              ? `${event.address.slice(0, 25)}...`
                              : event?.address}
                          </Text>
                          <View className="bg-primary rounded-xl py-3 mt-4 flex-row items-center justify-center">
                            <Text className="text-background font-black">
                              Join now
                            </Text>
                            <ArrowRight color="#06101F" size={16} />
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>

            {/* Events Worth Opening */}
            <View className="mb-6">
              <View className="flex-row justify-between items-center px-4 mb-4">
                <View className="flex-1 pr-3">
                  <Text className="text-white text-xl font-bold">
                    Events worth opening
                  </Text>
                  <Text className="text-gray-400 mt-1">
                    Standout events shaped by views, clicks, and bookings.
                  </Text>
                </View>
                <TouchableOpacity
                  className="bg-white rounded-full px-4 py-2"
                  onPress={() => router.push("/(tabs)/home/explore")}
                >
                  <Text className="text-background font-bold">Find</Text>
                </TouchableOpacity>
              </View>

              {isRecommendedLoading || isFetchingRecommended ? (
                <ActivityIndicator color="#9EDD45" />
              ) : recommendedEvents.length <= 0 ? (
                <View className="mx-4 bg-[#111823] border border-[#243044] rounded-2xl p-5">
                  <View className="h-12 w-12 rounded-2xl bg-primary/15 items-center justify-center mb-3">
                    <TrendingUp color="#9EDD45" size={24} />
                  </View>
                  <Text className="text-white text-lg font-bold">
                    Watch this shortlist
                  </Text>
                  <Text className="text-gray-400 mt-2 leading-5">
                    Events people open, view, and book most will appear here as
                    the marketplace gets more activity.
                  </Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                >
                  {recommendedEvents.map((event: any) => (
                    <TouchableOpacity
                      key={event.id}
                      onPress={() =>
                        router.push(`/(tabs)/home/event/${event.id}`)
                      }
                      className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden mr-3 w-56"
                    >
                      <Image
                        source={
                          eventImage(event)
                            ? { uri: eventImage(event) }
                            : require("../../../assets/images/landing.webp")
                        }
                        className="w-full h-28 bg-[#1A2432]"
                        resizeMode="cover"
                      />
                      <View className="p-3">
                        <View className="flex-row items-center justify-between mb-2">
                          <View className="bg-primary/15 rounded-full px-2.5 py-1">
                            <Text className="text-primary text-[11px] font-bold">
                              {event?.type || "Upcoming"}
                            </Text>
                          </View>
                          <Text className="text-primary text-xs font-black">
                            {eventPrice(event)}
                          </Text>
                        </View>
                        <Text
                          className="text-white text-base font-bold leading-5"
                          numberOfLines={2}
                        >
                          {event?.title}
                        </Text>
                        <View className="flex-row items-center mt-3">
                          <CalendarDays color="#94A3B8" size={13} />
                          <Text
                            className="text-gray-400 text-xs ml-2 flex-1"
                            numberOfLines={1}
                          >
                            {formatDate(event?.start_date)}
                          </Text>
                        </View>
                        <View className="flex-row items-center mt-2">
                          <MapPin color="#94A3B8" size={13} />
                          <Text
                            className="text-gray-400 text-xs ml-2 flex-1"
                            numberOfLines={1}
                          >
                            {eventLocation(event)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Online Events */}
            <View className="mb-6">
              <View className="flex-row justify-between items-center px-4 mb-4">
                <View className="flex-1 pr-3">
                  <Text className="text-white text-xl font-bold">
                    Online Events
                  </Text>
                  <Text className="text-gray-400 mt-1">
                    Join virtual sessions from anywhere.
                  </Text>
                </View>
                <TouchableOpacity
                  className="bg-[#1A2432] border border-[#243044] rounded-full px-4 py-2"
                  onPress={() => router.push("/marketplace" as any)}
                >
                  <Text className="text-primary font-semibold">More</Text>
                </TouchableOpacity>
              </View>

              {isOnlineLoading || isFetchingOnline ? (
                <ActivityIndicator color="#9EDD45" />
              ) : onlineEvents.length <= 0 ? (
                <View className="mx-4 bg-[#111823] border border-[#243044] rounded-2xl p-5">
                  <View className="h-12 w-12 rounded-2xl bg-primary/15 items-center justify-center mb-3">
                    <MonitorPlay color="#9EDD45" size={24} />
                  </View>
                  <Text className="text-white text-lg font-bold">
                    Online events are coming
                  </Text>
                  <Text className="text-gray-400 mt-2 leading-5">
                    Virtual workshops, streams, and remote sessions will show
                    here as organizers publish them.
                  </Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                >
                  {onlineEvents.map((event: any) => (
                    <TouchableOpacity
                      key={event.id}
                      onPress={() =>
                        router.push(`/(tabs)/home/event/${event.id}`)
                      }
                      className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden mr-3 w-56"
                    >
                      <Image
                        source={
                          event?.images?.[0]
                            ? { uri: event.images[0] }
                            : require("../../../assets/images/landing.webp")
                        }
                        className="w-full h-28 bg-[#1A2432]"
                        resizeMode="cover"
                      />
                      <View className="p-3">
                        <View className="flex-row items-center mb-2">
                          <MonitorPlay color="#9EDD45" size={14} />
                          <Text className="text-primary text-xs font-bold ml-2">
                            Online
                          </Text>
                        </View>
                        <Text
                          className="text-white text-base font-bold leading-5"
                          numberOfLines={2}
                        >
                          {event?.title}
                        </Text>
                        <Text className="text-gray-400 text-sm mt-1">
                          {formatDate(event?.start_date)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Resale Tickets */}
            <View className="mb-6">
              <View className="flex-row justify-between items-center px-4 mb-4">
                <View className="flex-1 pr-3">
                  <Text className="text-white text-xl font-bold">
                    Tickets for resale
                  </Text>
                  <Text className="text-gray-400 mt-1">
                    Verified tickets from other attendees.
                  </Text>
                </View>
                <TouchableOpacity
                  className="bg-[#1A2432] border border-[#243044] rounded-full px-4 py-2"
                  onPress={() => router.push("/ticket-exchange" as any)}
                >
                  <Text className="text-primary font-semibold">See all</Text>
                </TouchableOpacity>
              </View>

              {isResaleLoading || isFetchingResale ? (
                <ActivityIndicator color="#9EDD45" />
              ) : resaleListings.length <= 0 ? (
                <View className="mx-4 bg-[#111823] border border-[#243044] rounded-2xl p-5 overflow-hidden">
                  <View className="flex-row items-start">
                    <View className="h-12 w-12 rounded-2xl bg-primary/15 items-center justify-center mr-3">
                      <Ticket color="#9EDD45" size={24} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-lg font-bold">
                        Watch this space
                      </Text>
                      <Text className="text-gray-400 mt-2 leading-5">
                        Resale tickets will appear here when attendees list
                        verified tickets for sale.
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    className="bg-[#1A2432] border border-[#2A3546] rounded-xl py-3 mt-4 flex-row items-center justify-center"
                    onPress={() => router.push("/ticket-exchange" as any)}
                  >
                    <ShieldCheck color="#9EDD45" size={16} />
                    <Text className="text-white font-semibold ml-2">
                      Open resale market
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                >
                  {resaleListings.map((listing: any) => (
                    <TouchableOpacity
                      key={listing.id}
                      className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden mr-3 w-56"
                      onPress={() => router.push("/ticket-exchange" as any)}
                    >
                      <View className="relative">
                        <Image
                          source={
                            resaleImage(listing)
                              ? { uri: resaleImage(listing) as string }
                              : require("../../../assets/images/landing.webp")
                          }
                          className="w-full h-28 bg-[#1A2432]"
                          resizeMode="cover"
                        />
                        <View className="absolute left-3 top-3 bg-black/70 rounded-full px-3 py-1">
                          <Text className="text-primary text-xs font-bold">
                            Resale
                          </Text>
                        </View>
                        <View className="absolute right-3 top-3 h-8 w-8 rounded-full bg-primary/90 items-center justify-center">
                          <Ticket color="#06101F" size={16} />
                        </View>
                      </View>
                      <View className="p-3">
                        <Text
                          className="text-white text-base font-bold leading-5"
                          numberOfLines={2}
                        >
                          {listing.event?.title || "Resale ticket"}
                        </Text>
                        <Text
                          className="text-gray-400 text-sm mt-1"
                          numberOfLines={1}
                        >
                          {listing.ticket?.name || "Ticket"}
                        </Text>
                        <View className="flex-row items-center justify-between mt-3">
                          <Text className="text-primary text-lg font-black">
                            {money(
                              listing.buyer_total_amount || listing.price,
                              listing.currency || listing.event?.currency
                            )}
                          </Text>
                          <View className="bg-primary/15 rounded-full px-2.5 py-1">
                            <Text className="text-primary text-[11px] font-bold">
                              Verified
                            </Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
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
