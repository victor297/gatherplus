import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import {
  ArrowLeft,
  CalendarDays,
  Filter,
  Search,
  ShieldCheck,
  Store,
  Ticket,
} from "lucide-react-native";
import { useSelector } from "react-redux";
import {
  useGetTicketExchangeMarketplaceQuery,
  useStartResaleOrderMutation,
} from "@/redux/api/ticketExchangeApiSlice";
import { formatDate } from "@/utils/formatDate";

const PAGE_SIZE = 10;

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

const getArray = (value: unknown) => (Array.isArray(value) ? value : []);

const WEB_ORIGIN = String(
  process.env.EXPO_PUBLIC_WEB_URL || "https://www.gatherplux.com"
).replace(/\/$/, "");

const resolveImageUri = (value?: unknown) => {
  const uri = String(value || "").trim();
  if (!uri) return null;
  if (/^https?:\/\//i.test(uri)) return uri;
  if (uri.startsWith("//")) return `https:${uri}`;
  if (uri.startsWith("/")) return `${WEB_ORIGIN}${uri}`;
  return uri;
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

export default function TicketExchangeScreen() {
  const router = useRouter();
  const { userInfo } = useSelector((state: any) => state.auth);
  const isLoggedIn = Boolean(userInfo?.accessToken || userInfo?.sub);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active">("active");
  const { data, isFetching, isLoading } = useGetTicketExchangeMarketplaceQuery({
    page,
    search: submittedSearch,
    size: PAGE_SIZE,
  });
  const [startOrder, { isLoading: isStartingOrder }] = useStartResaleOrderMutation();

  const body = data?.body || {};
  const listings = getArray(body.listings || body.result || body.data);
  const totalPages = Number(body.totalPages || body.total_pages || 1);
  const totalCount = Number(body.total || body.count || listings.length);

  const visibleListings = useMemo(() => {
    if (statusFilter === "all") return listings;
    return listings.filter((listing: any) => String(listing.status || "ACTIVE").toUpperCase() === "ACTIVE");
  }, [listings, statusFilter]);

  const handleSearch = () => {
    setPage(1);
    setSubmittedSearch(search.trim());
  };

  const handleBuy = async (listing: any) => {
    if (!isLoggedIn) {
      Alert.alert("Sign in required", "Sign in to buy a verified resale ticket.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign in", onPress: () => router.push("/(auth)/login" as any) },
      ]);
      return;
    }

    try {
      const response = await startOrder({
        callback_url: Linking.createURL("resale-callback"),
        channel: "PayStack",
        listing_id: listing.id,
      }).unwrap();
      const authorizationUrl = response?.body?.authorization_url || response?.body?.payment_url;
      if (authorizationUrl) {
        const result = await WebBrowser.openBrowserAsync(authorizationUrl);
        if (result.type === "cancel" || result.type === "dismiss") {
          Alert.alert(
            "Payment not confirmed",
            "If payment completed, the resale ticket will appear in your booking wallet after confirmation.",
            [
              { text: "Stay", style: "cancel" },
              { text: "View wallet", onPress: () => router.push("/profile/bookings" as any) },
            ]
          );
        }
      } else {
        Alert.alert("Order started", "Check your booking wallet after payment confirmation.");
      }
    } catch (error: any) {
      Alert.alert("Could not start resale checkout", error?.data?.body || "Please try again.");
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-12 pb-4 flex-row items-center justify-between">
        <TouchableOpacity className="bg-[#1A2432] rounded-full p-3" onPress={() => router.back()}>
          <ArrowLeft color="#E5E7EB" size={21} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">Resale market</Text>
        <TouchableOpacity className="bg-[#1A2432] rounded-full p-3" onPress={() => setShowFilters((value) => !value)}>
          <Filter color="#E5E7EB" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text className="text-[#8B6BFF] text-xs font-bold tracking-[4px] uppercase">
          Verified resale
        </Text>
        <Text className="text-white text-4xl font-bold mt-2">
          Buy verified tickets from other attendees
        </Text>
        <Text className="text-gray-400 leading-6 mt-3">
          Every resale checkout retires the seller&apos;s ticket and creates a fresh secure pass for
          the buyer after payment confirmation.
        </Text>

        <View className="flex-row gap-3 mt-6">
          <Metric icon={<Ticket color="#8B6BFF" size={18} />} label="Listings" value={totalCount} />
          <Metric icon={<ShieldCheck color="#8B6BFF" size={18} />} label="Verified" value="Secure" />
        </View>

        <View className="bg-[#111823] border border-[#243044] rounded-2xl mt-6 overflow-hidden">
          <View className="p-4 border-b border-[#243044]">
            <View className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-3 flex-row items-center">
              <Search color="#8B6BFF" size={18} />
              <TextInput
                className="flex-1 text-white py-3 ml-2"
                placeholder="Search events or tickets"
                placeholderTextColor="#728097"
                returnKeyType="search"
                value={search}
                onChangeText={setSearch}
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity className="bg-primary rounded-lg px-3 py-2" onPress={handleSearch}>
                <Text className="text-background font-bold">Search</Text>
              </TouchableOpacity>
            </View>

            {showFilters ? (
              <View className="flex-row gap-2 mt-3">
                {[
                  ["active", "Active"],
                  ["all", "All"],
                ].map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    className={`rounded-full px-4 py-2 border ${
                      statusFilter === key ? "bg-primary border-primary" : "border-[#2E3A4D]"
                    }`}
                    onPress={() => setStatusFilter(key as "all" | "active")}
                  >
                    <Text className={statusFilter === key ? "text-background font-bold" : "text-gray-300 font-semibold"}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>

          {isLoading || isFetching ? (
            <View className="py-4">
              <ActivityIndicator color="#9EDD45" />
            </View>
          ) : null}

          <FlatList
            data={visibleListings}
            scrollEnabled={false}
            keyExtractor={(item: any, index) => String(item.id || index)}
            ListEmptyComponent={
              <View className="p-8 items-center">
                <Store color="#8B6BFF" size={34} />
                <Text className="text-white font-semibold mt-4">No resale tickets found</Text>
                <Text className="text-gray-400 text-center mt-2">
                  Try another search, or check back when attendees list paid tickets.
                </Text>
              </View>
            }
            renderItem={({ item }: { item: any }) => (
              <View className="p-4 border-b border-[#243044]">
                <View className="relative mb-4 overflow-hidden rounded-2xl">
                  <Image
                    source={
                      resaleImage(item)
                        ? { uri: resaleImage(item) as string }
                        : require("../assets/images/landing.webp")
                    }
                    className="w-full h-40 bg-[#1A2432]"
                    resizeMode="cover"
                  />
                  <View className="absolute left-3 top-3 bg-black/70 rounded-full px-3 py-1">
                    <Text className="text-primary text-xs font-bold">
                      Verified resale
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-white text-lg font-semibold">{item.event?.title || "Resale ticket"}</Text>
                    <Text className="text-gray-400 mt-1">
                      {item.ticket?.name || "Ticket"} · {item.session?.name || "General admission"}
                    </Text>
                    <View className="flex-row items-center mt-3">
                      <CalendarDays color="#728097" size={15} />
                      <Text className="text-gray-400 ml-2">{formatDate(item.event?.start_date)}</Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-primary text-lg font-bold">
                      {money(item.buyer_total_amount || item.price, item.currency || item.event?.currency)}
                    </Text>
                    <Text className="text-gray-500 text-xs mt-1">buyer total</Text>
                  </View>
                </View>
                <TouchableOpacity
                  className="bg-primary rounded-xl py-3 mt-4 disabled:opacity-50"
                  disabled={isStartingOrder || String(item.status || "ACTIVE").toUpperCase() !== "ACTIVE"}
                  onPress={() => handleBuy(item)}
                >
                  <Text className="text-background font-bold text-center">
                    {isStartingOrder ? "Starting checkout..." : "Buy resale ticket"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />

          <View className="p-4 flex-row items-center justify-between">
            <TouchableOpacity
              className="bg-[#1A2432] rounded-xl px-4 py-3 disabled:opacity-40"
              disabled={page <= 1}
              onPress={() => setPage((current) => Math.max(1, current - 1))}
            >
              <Text className="text-white font-semibold">Previous</Text>
            </TouchableOpacity>
            <Text className="text-gray-300">Page {page} of {Math.max(1, totalPages)}</Text>
            <TouchableOpacity
              className="bg-[#1A2432] rounded-xl px-4 py-3 disabled:opacity-40"
              disabled={page >= totalPages}
              onPress={() => setPage((current) => Math.min(Math.max(1, totalPages), current + 1))}
            >
              <Text className="text-white font-semibold">Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <View className="bg-[#111823] border border-[#243044] rounded-2xl p-4 flex-1">
      {icon}
      <Text className="text-white text-2xl font-bold mt-5">{value}</Text>
      <Text className="text-gray-400 mt-1">{label}</Text>
    </View>
  );
}
