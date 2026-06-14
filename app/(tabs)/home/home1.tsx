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
  useWindowDimensions,
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
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { formatDate } from "@/utils/formatDate";
import { useDispatch, useSelector } from "react-redux";
import { checkTokenImmediately } from "@/redux/features/auth/authSlice";
import {
  useGetproviderdetailsQuery,
  useGetprovidersQuery,
} from "@/redux/api/providersApiSlice";
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

const dateOnly = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (value?: unknown) => {
  if (!value) return null;
  const text = String(value);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getEventStartDate = (event: any) => {
  const dates = [
    parseLocalDate(event?.start_date),
    ...getArray(event?.sessions).map((session: any) =>
      parseLocalDate(session?.date || session?.end_date)
    ),
  ].filter((date): date is Date => Boolean(date));

  return dates.sort((a, b) => a.getTime() - b.getTime())[0] || null;
};

const isEventWithinWindow = (event: any, start: Date, end: Date) => {
  const eventDate = getEventStartDate(event);
  if (!eventDate) return false;

  return eventDate >= start && eventDate <= end;
};

function HomeEmptyState({
  icon,
  subtitle,
  title = "No records found",
}: {
  icon?: ReactNode;
  subtitle: string;
  title?: string;
}) {
  return (
    <View className="mx-4 rounded-2xl border border-[#243044] bg-[#111823] px-4 py-6 items-center">
      <View className="h-12 w-12 rounded-2xl bg-[#1A2432] items-center justify-center">
        {icon || <CalendarDays color="#9EDD45" size={22} />}
      </View>
      <Text className="text-white text-base font-bold mt-3 text-center">
        {title}
      </Text>
      <Text className="text-gray-400 text-center mt-1 leading-5">
        {subtitle}
      </Text>
    </View>
  );
}

const marketplaceSlides = [
  {
    accent: "#9EDD45",
    cta: "Explore",
    eyebrow: "Explore events",
    icon: Globe2,
    image: require("../../../assets/images/landing.webp"),
    route: "/(tabs)/home/explore",
    stat: "Events near you",
    subtitle:
      "Browse gatherings, social experiences, and public events around your location.",
    title: "Find your next event",
  },
  {
    accent: "#FBBF24",
    cta: "Resale",
    eyebrow: "Ticket resale",
    icon: Ticket,
    image: {
      uri: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=900&q=80",
    },
    route: "/ticket-exchange",
    stat: "Ticket market",
    subtitle:
      "Find attendee-listed tickets when original tickets are no longer easy to get.",
    title: "Browse resale tickets",
  },
  {
    accent: "#60A5FA",
    cta: "Online",
    eyebrow: "Online events",
    icon: MonitorPlay,
    image: {
      uri: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    },
    route: "/(tabs)/home/explore?attendance=ONLINE",
    stat: "Join anywhere",
    subtitle:
      "Find online and hybrid events you can join from wherever you are.",
    title: "Explore online events",
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const dispatch: any = useDispatch();
  const { userInfo } = useSelector((state: any) => state.auth);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [city, setCity] = useState("Fetching location...");
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [selectedState, setSelectedState] = useState<any>(null);
  const discoveryCardWidth = Math.max(300, Math.min(width - 32, 420));
  const eventWindow = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    end.setHours(23, 59, 59, 999);

    return {
      end,
      endDate: dateOnly(end),
      start,
      startDate: dateOnly(start),
    };
  }, []);

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
  const { data: categories, isLoading } = useGetcategoriesQuery({});
  const {
    data: upcoming,
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
    data: weekEventsData,
    isLoading: isWeekEventsLoading,
    isFetching: isFetchingWeekEvents,
    refetch: refetchWeekEvents,
  } = useGetEventsQuery({
    city: null,
    type: "UPCOMING",
    category_id: selectedCategory,
    page: 1,
    size: 50,
    sortBy: "start_date",
    sortDirection: "asc",
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
  const { data: currentProvider } = useGetproviderdetailsQuery(userInfo?.sub, {
    skip: !userInfo?.sub,
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
  const weekEvents = getArray(weekEventsData?.body?.events?.result)
    .filter((event: any) =>
      isEventWithinWindow(event, eventWindow.start, eventWindow.end)
    )
    .sort((a: any, b: any) => {
      const firstDate = getEventStartDate(a)?.getTime() || 0;
      const secondDate = getEventStartDate(b)?.getTime() || 0;
      return firstDate - secondDate;
    })
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
  const openPlannerWorkspace = () => {
    if (!userInfo?.sub) {
      router.push("/(auth)/login" as any);
      return;
    }

    router.push(
      (currentProvider?.body
        ? "/(provider)/profile"
        : "/(provider)/complete-profile") as any
    );
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      refetchUpcoming(),
      refetchWeekEvents(),
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
    refetchWeekEvents,
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
                <ScrollView
                  horizontal
                  pagingEnabled
                  snapToInterval={discoveryCardWidth + 12}
                  decelerationRate="fast"
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12, paddingRight: 4 }}
                >
                  {marketplaceSlides.map((slide) => {
                    const SlideIcon = slide.icon;

                    return (
                      <TouchableOpacity
                        key={slide.title}
                        activeOpacity={0.9}
                        className="overflow-hidden rounded-2xl border border-[#D7E8C8] bg-[#F1F8E8]"
                        style={{ width: discoveryCardWidth }}
                        onPress={() => router.push(slide.route as any)}
                      >
                        <View className="relative h-40 overflow-hidden">
                          <Image
                            source={slide.image}
                            className="h-full w-full"
                            resizeMode="cover"
                          />
                          <View className="absolute inset-0 bg-black/20" />
                          <View className="absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1">
                            <Text className="text-white text-[11px] font-black uppercase tracking-wider">
                              {slide.eyebrow}
                            </Text>
                          </View>
                          <View className="absolute bottom-4 right-4 h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-black/55">
                            <SlideIcon color={slide.accent} size={21} />
                          </View>
                        </View>
                        <View className="p-4">
                          <Text
                            className="text-[#07111F] text-xl font-black leading-6"
                            numberOfLines={2}
                          >
                            {slide.title}
                          </Text>
                          <Text
                            className="mt-2 text-[#536073] text-sm leading-5"
                            numberOfLines={2}
                          >
                            {slide.subtitle}
                          </Text>
                          <View className="mt-4 flex-row items-center justify-between">
                            <Text
                              className="text-[11px] font-black uppercase tracking-wider"
                              style={{ color: slide.accent }}
                            >
                              {slide.stat}
                            </Text>
                            <View className="flex-row items-center rounded-full bg-primary px-4 py-2">
                              <Text className="text-background text-sm font-black">
                                {slide.cta}
                              </Text>
                              <ArrowRight
                                color="#07111F"
                                size={15}
                                style={{ marginLeft: 6 }}
                              />
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
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
                <HomeEmptyState
                  subtitle="New public events will appear here as organizers publish them."
                  title="No upcoming events"
                />
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    gap: 12,
                    paddingLeft: 16,
                    paddingRight: 16,
                  }}
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
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    gap: 12,
                    paddingLeft: 16,
                    paddingRight: 16,
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    className="w-64 overflow-hidden rounded-2xl border border-primary/30 bg-[#F1F8E8] p-4"
                    onPress={openPlannerWorkspace}
                  >
                    <View className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-primary/25" />
                    <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#07111F]">
                      <ShieldCheck color="#9EDD45" size={23} />
                    </View>
                    <Text className="mt-4 text-[#07111F] text-xl font-black leading-6">
                      Offer your event services
                    </Text>
                    <Text className="mt-2 text-[#536073] text-sm leading-5">
                      Create a planner profile, list services, manage bookings,
                      and get discovered by event hosts.
                    </Text>
                    <View className="mt-4 flex-row items-center justify-between">
                      <View>
                        <Text className="text-[#07111F] text-xs font-black uppercase tracking-wider">
                          Planner dashboard
                        </Text>
                        <Text className="mt-1 text-[#536073] text-xs">
                          Profile, services, schedule
                        </Text>
                      </View>
                      <View className="h-10 w-10 items-center justify-center rounded-full bg-primary">
                        <ArrowRight color="#07111F" size={18} />
                      </View>
                    </View>
                  </TouchableOpacity>
                  {providers?.body?.result?.map((provider: any) => (
                    <TouchableOpacity
                      key={provider.id}
                      activeOpacity={0.9}
                      onPress={() =>
                        router.push(`/(provider)/${provider.id}/servicedetails`)
                      }
                      className="w-64 overflow-hidden rounded-2xl border border-[#2B384D] bg-[#111827]"
                    >
                      <View className="relative h-28 bg-[#0B1220]">
                        <Image
                          source={{
                            uri:
                              provider?.cover_image ||
                              provider?.profile_image ||
                              DEFAULT_BLOG_IMAGE,
                          }}
                          className="h-full w-full"
                          resizeMode="cover"
                        />
                        <View className="absolute inset-0 bg-black/25" />
                        <View className="absolute -bottom-8 left-4 h-16 w-16 overflow-hidden rounded-2xl border-2 border-[#111827] bg-white">
                          <Image
                            source={{
                              uri:
                                provider?.profile_image ||
                                provider?.cover_image ||
                                DEFAULT_BLOG_IMAGE,
                            }}
                            className="h-full w-full"
                            resizeMode="cover"
                          />
                        </View>
                        <View className="absolute right-3 top-3 rounded-full bg-black/55 px-3 py-1">
                          <Text className="text-primary text-[11px] font-black">
                            Pro
                          </Text>
                        </View>
                      </View>
                      <View className="px-4 pb-4 pt-10">
                        <Text className="text-white text-base font-black" numberOfLines={1}>
                          {provider?.business_name || "Event professional"}
                        </Text>
                        <Text className="mt-1 text-gray-400 text-xs" numberOfLines={1}>
                          {provider?.specialties?.[0] ||
                            provider?.category?.name ||
                            "Event planner"}
                        </Text>
                        <View className="mt-3 flex-row items-center">
                          <MapPin color="#94A3B8" size={13} />
                          <Text className="ml-1 flex-1 text-gray-400 text-xs" numberOfLines={1}>
                            {provider?.address || provider?.city || "Location available"}
                          </Text>
                        </View>
                        <View className="mt-4 flex-row items-center justify-between">
                          <Text className="text-primary text-sm font-black">
                            {provider?.currency?.split(" - ")[0] || "₦"}{" "}
                            {provider?.price}
                          </Text>
                          <View className="flex-row items-center rounded-full bg-[#1A2432] px-2 py-1">
                            <StarIcon color="#FBBF24" fill="#FBBF24" size={11} />
                            <Text className="ml-1 text-white text-xs font-bold">
                              {provider?.rating || provider?.total_reviews || "New"}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Events This Week */}
            <View className="mb-6">
              <View className="flex-row justify-between items-center px-4 mb-4">
                <Text className="text-white text-xl font-bold">
                  Events this week
                </Text>
                <TouchableOpacity
                  className="bg-[#1A2432] border border-[#243044] rounded-full px-4 py-2"
                  onPress={() => router.push("/(tabs)/home/explore")}
                >
                  <Text className="text-primary font-semibold">Show all</Text>
                </TouchableOpacity>
              </View>
              {isWeekEventsLoading || isFetchingWeekEvents ? (
                <ActivityIndicator color="#9EDD45" />
              ) : weekEvents.length <= 0 ? (
                <HomeEmptyState
                  subtitle="No public events are scheduled from today through the next 7 days. Browse all events to discover more options."
                  title="No records found"
                />
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="pl-4"
                >
                  <View className="pr-4 flex-row gap-3">
                    {weekEvents.map((event: any) => (
                      <TouchableOpacity
                        key={event.id}
                        onPress={() =>
                          router.push(`/(tabs)/home/event/${event.id}`)
                        }
                        className="bg-[#111823] w-80 rounded-2xl overflow-hidden mb-4 border border-[#243044] flex-row"
                      >
                        <View className="relative h-36 w-28 bg-[#1A2432]">
                          <Image
                            source={
                              eventImage(event)
                                ? { uri: eventImage(event) as string }
                                : require("../../../assets/images/logo.png")
                            }
                            className="h-full w-full"
                            resizeMode="cover"
                          />
                          <View className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-1">
                            <Text className="text-[10px] font-black uppercase text-background">
                              This week
                            </Text>
                          </View>
                        </View>

                        <View className="flex-1 p-3">
                          <Text className="text-primary text-xs font-black uppercase tracking-wide">
                            Next 7 days
                          </Text>
                          <Text
                            className="mt-1 text-white text-base font-black leading-5"
                            numberOfLines={2}
                          >
                            {event?.title}
                          </Text>

                          <View className="mt-2 gap-1">
                            <View className="flex-row items-center">
                              <CalendarDays color="#94A3B8" size={13} />
                              <Text
                                className="ml-1.5 flex-1 text-xs font-semibold text-gray-400"
                                numberOfLines={1}
                              >
                                {formatDate(event?.start_date)}
                              </Text>
                            </View>
                            <View className="flex-row items-center">
                              <MapPin color="#94A3B8" size={13} />
                              <Text
                                className="ml-1.5 flex-1 text-xs font-semibold text-gray-400"
                                numberOfLines={1}
                              >
                                {eventLocation(event)}
                              </Text>
                            </View>
                          </View>

                          <View className="mt-auto flex-row items-center justify-between pt-2">
                            <Text
                              className="max-w-[80px] text-xs font-black text-primary"
                              numberOfLines={1}
                            >
                              {eventPrice(event)}
                            </Text>
                            <View className="bg-primary rounded-full px-3 py-2 flex-row items-center justify-center">
                              <Text className="text-background text-xs font-black">
                                Join
                              </Text>
                              <ArrowRight color="#06101F" size={14} />
                            </View>
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
                  onPress={() =>
                    router.push("/(tabs)/home/explore?attendance=ONLINE" as any)
                  }
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
                activeOpacity={0.9}
                className="rounded-2xl border border-[#D7E8C8] bg-[#F1F8E8] p-4"
                onPress={() => router.push("/marketplace" as any)}
              >
                <View className="flex-row items-center justify-between">
                  <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white">
                    <MapPin color="#9EDD45" size={21} />
                  </View>
                  <View className="mx-3 flex-1">
                    <Text className="text-[#07111F] text-base font-black">
                      Find events & planners near you
                    </Text>
                    <Text className="mt-1 text-[#536073] text-xs leading-4">
                      Search local events, event planners, vendors, and trusted
                      ticket access.
                    </Text>
                  </View>
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-primary">
                    <ArrowRight color="#07111F" size={18} />
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
