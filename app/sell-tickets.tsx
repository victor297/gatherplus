import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ChevronRight,
  Search,
  ShieldCheck,
  Store,
  Ticket,
  TrendingUp,
  XCircle,
} from "lucide-react-native";
import { useSelector } from "react-redux";
import {
  useCancelResaleListingMutation,
  useCreateResaleListingMutation,
  useGetMyTicketExchangeQuery,
} from "@/redux/api/ticketExchangeApiSlice";
import { formatDate } from "@/utils/formatDate";

type WorkspaceTab = "home" | "eligible" | "listings";

const PAGE_SIZE = 8;

const money = (value?: unknown, currency?: unknown) => {
  const amount = Number(value || 0);
  const code = String(currency || "NGN").split(/[\s-]/)[0] || "NGN";
  try {
    return new Intl.NumberFormat("en-US", {
      currency: code,
      maximumFractionDigits: 2,
      style: "currency",
    }).format(amount);
  } catch {
    return `${code} ${amount.toLocaleString()}`;
  }
};

const list = (value: unknown) => (Array.isArray(value) ? value : []);

export default function SellTicketsScreen() {
  const router = useRouter();
  const { userInfo } = useSelector((state: any) => state.auth);
  const isLoggedIn = Boolean(userInfo?.accessToken || userInfo?.sub);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("home");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const { data, isFetching, isLoading, refetch } = useGetMyTicketExchangeQuery(undefined, {
    skip: !isLoggedIn,
  });
  const [createListing, { isLoading: isCreating }] = useCreateResaleListingMutation();
  const [cancelListing, { isLoading: isCancelling }] = useCancelResaleListingMutation();

  const body = data?.body || {};
  const eligible = list(body.eligibleBookings);
  const listings = list(body.listings);
  const settings = body.settings || {};
  const feePercent = Number(settings.resaleFeePercentage || 10);
  const activeListings = listings.filter((item: any) => String(item.status || "").toUpperCase() === "ACTIVE");
  const soldListings = listings.filter((item: any) => String(item.status || "").toUpperCase() === "SOLD");
  const payoutTotal = soldListings.reduce(
    (sum: number, listing: any) => sum + Number(listing.seller_payout_amount || listing.price || 0),
    0
  );

  const filtered = useMemo(() => {
    const source = activeTab === "listings" ? listings : eligible;
    const normalized = query.trim().toLowerCase();
    if (!normalized) return source;
    return source.filter((item: any) => {
      const haystack = [
        item.code,
        item.event?.title,
        item.ticket?.name,
        item.session?.name,
        item.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [activeTab, eligible, listings, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const switchTab = (tab: WorkspaceTab) => {
    setActiveTab(tab);
    setPage(1);
    setQuery("");
  };

  const handleCreate = async (booking: any) => {
    const price = Number(prices[String(booking.id)] || booking.ticket?.price || 0);
    if (!price || price <= 0) {
      Alert.alert("Price required", "Enter a resale price greater than zero.");
      return;
    }
    try {
      await createListing({ booking_id: booking.id, price }).unwrap();
      setPrices((current) => ({ ...current, [String(booking.id)]: "" }));
      refetch();
      Alert.alert("Listed", "Ticket listed on the resale marketplace.");
    } catch (error: any) {
      Alert.alert("Could not list ticket", error?.data?.body || "Please try again.");
    }
  };

  const handleCancel = async (id: number | string) => {
    try {
      await cancelListing(id).unwrap();
      refetch();
      Alert.alert("Cancelled", "Listing cancelled.");
    } catch (error: any) {
      Alert.alert("Could not cancel listing", error?.data?.body || "Please try again.");
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-12 pb-4 flex-row items-center justify-between">
        <TouchableOpacity className="bg-[#1A2432] rounded-full p-3" onPress={() => router.back()}>
          <ArrowLeft color="#E5E7EB" size={21} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">Sell tickets</Text>
        <TouchableOpacity className="bg-[#1A2432] rounded-full p-3" onPress={() => router.push("/ticket-exchange" as any)}>
          <Store color="#E5E7EB" size={20} />
        </TouchableOpacity>
      </View>

      {!isLoggedIn ? (
        <View className="flex-1 justify-center px-5">
          <View className="bg-[#111823] border border-[#243044] rounded-2xl p-7 items-center">
            <ShieldCheck color="#8B6BFF" size={42} />
            <Text className="text-white text-2xl font-semibold text-center mt-4">
              Sign in to manage resale
            </Text>
            <Text className="text-gray-400 text-center leading-6 mt-2">
              List paid, unused tickets and track resale payouts from your secure wallet.
            </Text>
            <TouchableOpacity className="bg-primary rounded-xl py-4 px-8 mt-6" onPress={() => router.push("/(auth)/login" as any)}>
              <Text className="text-background font-bold">Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
          <Text className="text-[#8B6BFF] text-xs font-bold tracking-[4px] uppercase">
            Ticket resale
          </Text>
          <Text className="text-white text-4xl font-bold mt-2">
            Sell tickets safely on GatherPlux
          </Text>
          <Text className="text-gray-400 leading-6 mt-3">
            Buyers pay through GatherPlux, your old ticket is retired, and the new buyer gets
            a fresh secure pass after payment.
          </Text>

          <View className="flex-row flex-wrap gap-3 mt-6">
            <Metric icon={<Ticket color="#8B6BFF" size={18} />} label="Can list" value={eligible.length} />
            <Metric icon={<TrendingUp color="#8B6BFF" size={18} />} label="Active" value={activeListings.length} />
            <Metric icon={<ShieldCheck color="#8B6BFF" size={18} />} label="Sold" value={soldListings.length} />
            <Metric icon={<Store color="#8B6BFF" size={18} />} label="Payout" value={money(payoutTotal)} />
          </View>

          <View className="bg-[#111823] border border-[#243044] rounded-2xl p-1 mt-6 flex-row">
            {[
              ["home", "Home"],
              ["eligible", "Eligible"],
              ["listings", "Listings"],
            ].map(([key, label]) => (
              <TouchableOpacity
                key={key}
                className={`flex-1 rounded-xl py-3 ${activeTab === key ? "bg-primary" : ""}`}
                onPress={() => switchTab(key as WorkspaceTab)}
              >
                <Text className={`text-center font-semibold ${activeTab === key ? "text-background" : "text-gray-300"}`}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === "home" ? (
            <View className="bg-[#111823] border border-[#243044] rounded-2xl p-5 mt-5">
              <Text className="text-white text-xl font-semibold">What qualifies?</Text>
              <Text className="text-gray-400 leading-6 mt-2">
                Paid, unused, upcoming tickets can be listed. Free passes, checked-in tickets,
                cancelled tickets, tickets already listed, and tickets for events you organize are
                excluded.
              </Text>
              <Text className="text-gray-400 leading-6 mt-4">
                GatherPlux adds a {feePercent}% buyer fee. Your resale price is the seller payout target.
              </Text>
            </View>
          ) : (
            <View className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden mt-5">
              <View className="p-4 border-b border-[#243044]">
                <Text className="text-white text-xl font-semibold">
                  {activeTab === "eligible" ? "Eligible tickets" : "Your listings"}
                </Text>
                <View className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-3 flex-row items-center mt-4">
                  <Search color="#8B6BFF" size={18} />
                  <TextInput
                    className="flex-1 text-white py-3 ml-2"
                    placeholder="Search tickets"
                    placeholderTextColor="#728097"
                    value={query}
                    onChangeText={(value) => {
                      setPage(1);
                      setQuery(value);
                    }}
                  />
                </View>
              </View>

              {isLoading || isFetching ? (
                <View className="py-5">
                  <ActivityIndicator color="#9EDD45" />
                </View>
              ) : null}

              <FlatList
                data={rows}
                scrollEnabled={false}
                keyExtractor={(item: any, index) => String(item.id || index)}
                ListEmptyComponent={
                  <View className="p-8 items-center">
                    <Ticket color="#8B6BFF" size={34} />
                    <Text className="text-white font-semibold mt-4">
                      {activeTab === "eligible" ? "No eligible tickets yet" : "No listings yet"}
                    </Text>
                    <Text className="text-gray-400 text-center mt-2">
                      {activeTab === "eligible"
                        ? "Paid, unused, upcoming tickets will appear here."
                        : "Active and sold resale listings will appear here."}
                    </Text>
                  </View>
                }
                renderItem={({ item }: { item: any }) =>
                  activeTab === "eligible" ? (
                    <View className="p-4 border-b border-[#243044]">
                      <Text className="text-white text-lg font-semibold">{item.event?.title || "Event ticket"}</Text>
                      <Text className="text-gray-400 mt-1">
                        {item.ticket?.name || "Ticket"} · {item.code || "No code"} · {formatDate(item.event?.start_date)}
                      </Text>
                      <View className="flex-row gap-2 mt-4">
                        <TextInput
                          className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white flex-1"
                          keyboardType="decimal-pad"
                          placeholder="Resale price"
                          placeholderTextColor="#728097"
                          value={prices[String(item.id)] ?? String(item.ticket?.price || "")}
                          onChangeText={(value) => setPrices((current) => ({ ...current, [String(item.id)]: value }))}
                        />
                        <TouchableOpacity
                          className="bg-primary rounded-xl px-5 justify-center disabled:opacity-50"
                          disabled={isCreating}
                          onPress={() => handleCreate(item)}
                        >
                          <Text className="text-background font-bold">List</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View className="p-4 border-b border-[#243044]">
                      <Text className="text-white text-lg font-semibold">{item.event?.title || "Resale ticket"}</Text>
                      <Text className="text-gray-400 mt-1">
                        {item.ticket?.name || "Ticket"} · {money(item.price, item.currency)} · {item.status || "Active"}
                      </Text>
                      {String(item.status || "").toUpperCase() === "ACTIVE" ? (
                        <TouchableOpacity
                          className="border border-red-500/40 rounded-xl px-4 py-3 mt-4 flex-row self-start disabled:opacity-50"
                          disabled={isCancelling}
                          onPress={() => handleCancel(item.id)}
                        >
                          <XCircle color="#F87171" size={17} />
                          <Text className="text-red-300 font-semibold ml-2">Cancel listing</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  )
                }
              />

              <View className="p-4 flex-row items-center justify-between">
                <TouchableOpacity
                  className="bg-[#1A2432] rounded-xl px-4 py-3 disabled:opacity-40"
                  disabled={page <= 1}
                  onPress={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <Text className="text-white font-semibold">Previous</Text>
                </TouchableOpacity>
                <Text className="text-gray-300">Page {page} of {totalPages}</Text>
                <TouchableOpacity
                  className="bg-[#1A2432] rounded-xl px-4 py-3 disabled:opacity-40"
                  disabled={page >= totalPages}
                  onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  <Text className="text-white font-semibold">Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity
            className="border border-[#243044] rounded-2xl p-5 mt-5 flex-row items-center justify-between"
            onPress={() => router.push("/ticket-exchange" as any)}
          >
            <View className="flex-1 pr-3">
              <Text className="text-white font-semibold">Browse resale marketplace</Text>
              <Text className="text-gray-400 mt-1">Review what buyers see.</Text>
            </View>
            <ChevronRight color="#E5E7EB" size={20} />
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <View className="bg-[#111823] border border-[#243044] rounded-2xl p-4 flex-1 min-w-[45%]">
      {icon}
      <Text className="text-white text-2xl font-bold mt-5">{value}</Text>
      <Text className="text-gray-400 mt-1">{label}</Text>
    </View>
  );
}
