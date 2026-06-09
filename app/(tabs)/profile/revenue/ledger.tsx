import React, { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, CalendarDays, CreditCard, RefreshCcw, Search, Wallet } from "lucide-react-native";
import ProfileFoundationScreen from "@/app/components/profile/ProfileFoundationScreen";
import { useGetUserWalletLedgerQuery } from "@/redux/api/usersApiSlice";
import type { RevenueHistoryItem, WalletCreditItem } from "@/types/revenue";

type LedgerType = "available" | "pending" | "requested";

const PAGE_SIZE = 12;

const normalizeCurrency = (value?: unknown) =>
  String(value || "NGN").split(/[\s-]/)[0] || "NGN";

const money = (value?: unknown, currency?: unknown) => {
  const amount = Number(value || 0);
  const code = normalizeCurrency(currency);
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

const formatDate = (value?: string) => {
  if (!value) return "Date not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not available";
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getType = (value?: string | string[]): LedgerType => {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "pending" || raw === "requested" ? raw : "available";
};

export default function RevenueLedgerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const selectedType = getType(params.type as string | undefined);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isFetching, isLoading, refetch } = useGetUserWalletLedgerQuery({});
  const body = data?.body || {};

  const items = useMemo(() => {
    if (selectedType === "pending") return body.pendingCredits || [];
    if (selectedType === "requested") return body.payoutRequests || [];
    return body.availableCredits || [];
  }, [body.availableCredits, body.pendingCredits, body.payoutRequests, selectedType]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item: WalletCreditItem | RevenueHistoryItem) => {
      const credit = item as WalletCreditItem;
      const payout = item as RevenueHistoryItem;
      const booking = Array.isArray(credit.booking) ? credit.booking[0] : undefined;
      const haystack = [
        credit.event?.title,
        credit.txn_ref,
        booking?.code,
        (payout as any).reference,
        payout.status,
        item.status,
        credit.id ? `credit #${credit.id}` : "",
        payout.id ? `request #${payout.id}` : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pagedItems = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const copy = {
    available: {
      description: "Completed event credits that are eligible for withdrawal.",
      eyebrow: "Available ledger",
      title: "Available balance transactions",
    },
    pending: {
      description: "Event credits waiting for payout clearance.",
      eyebrow: "Pending ledger",
      title: "Pending balance transactions",
    },
    requested: {
      description: "Withdrawal requests created from your revenue wallet.",
      eyebrow: "Payout ledger",
      title: "Requested payout transactions",
    },
  }[selectedType];

  const renderItem = ({ item, index }: { item: WalletCreditItem | RevenueHistoryItem; index: number }) => {
    const isPayout = selectedType === "requested";
    const credit = item as WalletCreditItem;
    const payout = item as RevenueHistoryItem;
    const event = credit.event;
    const booking = Array.isArray(credit.booking) ? credit.booking[0] : undefined;
    const amount = isPayout ? payout.amount : credit.final_amount ?? credit.amount;
    const currency = isPayout ? payout.recipient?.currency : event?.currency;
    const source = isPayout ? "Payout request" : event?.title || "Event credit";
    const reference = isPayout
      ? `Request #${payout.id}`
      : credit.txn_ref || booking?.code || `Credit #${credit.id || index + 1}`;
    const date = isPayout ? payout.createdAt || payout.created_at : credit.created_at;

    return (
      <View className="p-4 border-b border-[#243044]">
        <View className="flex-row items-start justify-between">
          <View className="flex-row flex-1 pr-3">
            <View className="w-11 h-11 rounded-full bg-[#5B4DFF] items-center justify-center">
              {isPayout ? <CreditCard color="white" size={20} /> : <Wallet color="white" size={20} />}
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-white font-semibold">{source}</Text>
              <Text className="text-gray-400 mt-1">{reference}</Text>
              <View className="flex-row items-center mt-2">
                <CalendarDays color="#728097" size={15} />
                <Text className="text-gray-500 ml-2">{formatDate(date)}</Text>
              </View>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-white font-bold">{money(amount, currency)}</Text>
            <Text className="bg-primary/15 rounded-full px-3 py-1 text-primary text-xs font-semibold mt-2">
              {item.status || "Recorded"}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ProfileFoundationScreen isLoading={isLoading} title={copy.title} subtitle={copy.description} stats={[]}>
      <View className="flex-row justify-between items-center mb-5">
        <TouchableOpacity className="flex-row items-center" onPress={() => router.push("/profile/revenue" as any)}>
          <ArrowLeft color="#A993FF" size={18} />
          <Text className="text-gray-300 font-semibold ml-2">Back to revenue</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="border border-[#243044] rounded-xl px-4 py-3 flex-row items-center"
          onPress={refetch}
        >
          <RefreshCcw color="#E5E7EB" size={16} />
          <Text className="text-white font-semibold ml-2">Refresh</Text>
        </TouchableOpacity>
      </View>

      <Text className="text-[#8B6BFF] text-xs font-bold tracking-[4px] uppercase mb-2">
        {copy.eyebrow}
      </Text>

      <View className="flex-row gap-2 mb-5">
        {(["available", "pending", "requested"] as LedgerType[]).map((type) => (
          <TouchableOpacity
            key={type}
            className={`rounded-full px-4 py-3 border ${
              selectedType === type ? "bg-[#5B4DFF] border-[#5B4DFF]" : "bg-[#111823] border-[#243044]"
            }`}
            onPress={() => {
              setPage(1);
              setSearch("");
              router.setParams({ type });
            }}
          >
            <Text className="text-white font-semibold capitalize">{type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden">
        <View className="p-5 border-b border-[#243044]">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-white text-xl font-semibold">Transaction detail</Text>
              <Text className="text-gray-400 mt-1">
                {filteredItems.length} record{filteredItems.length === 1 ? "" : "s"} found.
              </Text>
            </View>
            <Text className="text-gray-500">
              Page {page} of {totalPages}
            </Text>
          </View>
          <View className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-3 flex-row items-center mt-4">
            <Search color="#8B6BFF" size={18} />
            <TextInput
              className="flex-1 text-white py-3 ml-2"
              placeholder="Search reference, event, or status"
              placeholderTextColor="#728097"
              value={search}
              onChangeText={(value) => {
                setPage(1);
                setSearch(value);
              }}
            />
          </View>
        </View>

        {isFetching && !isLoading ? (
          <View className="py-3">
            <ActivityIndicator color="#9EDD45" />
          </View>
        ) : null}

        {pagedItems.length ? (
          <FlatList
            data={pagedItems}
            keyExtractor={(item: any, index) => String(item.id || index)}
            renderItem={renderItem}
            scrollEnabled={false}
          />
        ) : (
          <View className="p-8 items-center">
            <Wallet color="#8B6BFF" size={34} />
            <Text className="text-white text-lg font-semibold mt-4">No transactions found</Text>
            <Text className="text-gray-400 text-center mt-2">
              Revenue movements for this balance will appear here as payments clear.
            </Text>
          </View>
        )}

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
    </ProfileFoundationScreen>
  );
}
