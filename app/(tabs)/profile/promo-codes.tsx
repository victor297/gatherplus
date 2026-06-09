import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Archive,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Percent,
  Plus,
  Search,
  Tag,
  Ticket,
  X,
} from "lucide-react-native";

import ProfileFoundationScreen from "@/app/components/profile/ProfileFoundationScreen";
import {
  DiscountType,
  PromoCode,
  useArchivePromoCodeMutation,
  useBulkCreatePromoCodesMutation,
  useCreatePromoCodeMutation,
  useGetMyPromoCodesQuery,
  useGetPromoCodeAnalyticsQuery,
  useGetPromoCodeRedemptionsQuery,
  useUpdatePromoCodeMutation,
} from "@/redux/api/promoCodesApiSlice";
import { useGetMyNewEventsQuery } from "@/redux/api/newEventsApiSlice";
import { getApiErrorMessage } from "@/utils/api";
import type { EventV2 } from "@/types/events";

const initialForm = {
  code: "",
  discount_type: "PERCENTAGE" as DiscountType,
  discount_value: "",
  event_id: "",
  expires_at: "",
  min_order_amount: "",
  name: "",
  per_user_limit: "1",
  prefix: "",
  quantity: "25",
  usage_limit: "",
};

function normalizeCurrency(value?: unknown) {
  return String(value || "NGN").split(/[\s-]/)[0] || "NGN";
}

function money(value?: unknown, currency?: unknown) {
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
}

function formatDate(value?: string | null) {
  if (!value) return "No expiry";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No expiry";
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDiscount(code: PromoCode) {
  const value = Number(code.discount_value || 0);
  return code.discount_type === "PERCENTAGE"
    ? `${value}% off`
    : `${money(value, code.currency || code.event?.currency)} off`;
}

function toInputDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function normalizeExpiry(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.includes("T")) return trimmed;
  return `${trimmed}T23:59:59.000Z`;
}

function eventIsPaid(event: EventV2) {
  const eventPrice = Number(event.price || 0);
  const ticketPrices = Array.isArray(event.tickets)
    ? event.tickets.map((ticket) => Number(ticket.price || 0))
    : [];
  return !event.is_free && Math.max(eventPrice, ...ticketPrices, 0) > 0;
}

export default function PromoCodesScreen() {
  const [page, setPage] = useState(1);
  const [redemptionPage, setRedemptionPage] = useState(1);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [form, setForm] = useState(initialForm);
  const [formOpen, setFormOpen] = useState(false);
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data, isFetching, isLoading, refetch } = useGetMyPromoCodesQuery({
    page,
    search: submittedSearch,
    size: 10,
  });
  const { data: analyticsData, refetch: refetchAnalytics } =
    useGetPromoCodeAnalyticsQuery({ search: submittedSearch });
  const {
    data: redemptionsData,
    isFetching: redemptionsFetching,
    refetch: refetchRedemptions,
  } = useGetPromoCodeRedemptionsQuery({
    page: redemptionPage,
    search: submittedSearch,
    size: 8,
  });
  const { data: eventsData } = useGetMyNewEventsQuery({
    page: 1,
    size: 100,
    sortBy: "updated_at",
    sortDirection: "desc",
  });

  const [createPromoCode, { isLoading: isCreating }] =
    useCreatePromoCodeMutation();
  const [bulkCreatePromoCodes, { isLoading: isBulkCreating }] =
    useBulkCreatePromoCodesMutation();
  const [updatePromoCode, { isLoading: isUpdating }] =
    useUpdatePromoCodeMutation();
  const [archivePromoCode, { isLoading: isArchiving }] =
    useArchivePromoCodeMutation();

  const codes = Array.isArray(data?.body?.result) ? data.body.result : [];
  const totalItems = Number(data?.body?.totalItems || codes.length || 0);
  const totalPages = Math.max(1, Number(data?.body?.totalPages || 1));
  const analytics = analyticsData?.body || {};
  const metrics = analytics.metrics || {};
  const redemptions = Array.isArray(redemptionsData?.body?.result)
    ? redemptionsData.body.result
    : [];
  const redemptionTotalPages = Math.max(
    1,
    Number(redemptionsData?.body?.totalPages || 1)
  );
  const events = Array.isArray(eventsData?.body?.result)
    ? (eventsData.body.result as EventV2[])
    : [];
  const paidEvents = useMemo(() => events.filter(eventIsPaid), [events]);

  const activeCodes = Number(
    metrics.activeCodes ?? codes.filter((code) => code.active).length
  );
  const totalRedemptions = Number(
    metrics.totalRedemptions ??
      codes.reduce(
        (sum, code) => sum + Number(code._count?.redemptions || code.used_count || 0),
        0
      )
  );

  const refreshAll = () => {
    refetch();
    refetchAnalytics();
    refetchRedemptions();
  };

  const submitSearch = () => {
    setPage(1);
    setRedemptionPage(1);
    setSubmittedSearch(search.trim());
  };

  const updateForm = (key: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setMode("single");
    setFormOpen(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setMode("single");
    setForm(initialForm);
    setFormOpen(true);
  };

  const openEdit = (code: PromoCode) => {
    setMode("single");
    setEditingId(code.id);
    setForm({
      ...initialForm,
      code: code.code || "",
      discount_type: code.discount_type,
      discount_value: String(code.discount_value || ""),
      event_id: code.event_id ? String(code.event_id) : "",
      expires_at: toInputDate(code.expires_at),
      min_order_amount: code.min_order_amount
        ? String(code.min_order_amount)
        : "",
      name: code.name || "",
      usage_limit: code.usage_limit ? String(code.usage_limit) : "",
    });
    setFormOpen(true);
  };

  const buildPayload = () => ({
    active: true,
    code: form.code.trim().toUpperCase(),
    discount_type: form.discount_type,
    discount_value: Number(form.discount_value || 0),
    event_id: Number(form.event_id),
    expires_at: normalizeExpiry(form.expires_at),
    min_order_amount: form.min_order_amount
      ? Number(form.min_order_amount)
      : undefined,
    name: form.name.trim() || undefined,
    per_user_limit: form.per_user_limit
      ? Number(form.per_user_limit)
      : undefined,
    usage_limit: form.usage_limit ? Number(form.usage_limit) : undefined,
  });

  const submitForm = async () => {
    if (!form.event_id || !form.discount_value) {
      Alert.alert("Missing fields", "Select an event and enter a discount value.");
      return;
    }
    if (form.discount_type === "PERCENTAGE" && Number(form.discount_value) > 100) {
      Alert.alert("Invalid discount", "Percentage discounts cannot exceed 100%.");
      return;
    }
    if (mode === "single" && !form.code.trim()) {
      Alert.alert("Code required", "Enter a promo code.");
      return;
    }
    if (mode === "bulk" && !form.prefix.trim()) {
      Alert.alert("Prefix required", "Enter a prefix for generated codes.");
      return;
    }

    try {
      const payload = buildPayload();
      if (editingId) {
        await updatePromoCode({ id: editingId, payload }).unwrap();
        Alert.alert("Updated", "Promo code updated.");
      } else if (mode === "bulk") {
        const response = await bulkCreatePromoCodes({
          ...payload,
          code: form.prefix.trim().toUpperCase(),
          prefix: form.prefix.trim().toUpperCase(),
          quantity: Number(form.quantity || 1),
          usage_limit: payload.usage_limit || 1,
        }).unwrap();
        Alert.alert(
          "Generated",
          `${response.body?.totalCreated || 0} promo codes generated.`
        );
      } else {
        await createPromoCode(payload).unwrap();
        Alert.alert("Created", "Promo code created.");
      }
      resetForm();
      refreshAll();
    } catch (error) {
      Alert.alert(
        "Promo code failed",
        getApiErrorMessage(error, "Unable to save promo code.")
      );
    }
  };

  const archiveCode = (code: PromoCode) => {
    Alert.alert(
      "Archive promo code?",
      `${code.code} will stop working for future checkouts. Existing redemptions stay visible.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: async () => {
            try {
              await archivePromoCode(code.id).unwrap();
              refreshAll();
            } catch (error) {
              Alert.alert(
                "Archive failed",
                getApiErrorMessage(error, "Unable to archive promo code.")
              );
            }
          },
        },
      ]
    );
  };

  const saving = isCreating || isBulkCreating || isUpdating;

  return (
    <ProfileFoundationScreen
      isLoading={isLoading}
      title="Promo codes"
      subtitle="Create event discounts, control limits, and track redemptions."
      stats={[
        { label: "Total", value: metrics.totalCodes ?? totalItems },
        { label: "Active", value: activeCodes },
        { label: "Redemptions", value: totalRedemptions },
        {
          label: "Discount",
          value: money(metrics.totalDiscountAmount || 0),
        },
      ]}
    >
      <View className="flex-row gap-3 mb-5">
        <TouchableOpacity
          className="bg-primary rounded-xl py-4 px-4 flex-1 flex-row items-center justify-center"
          onPress={openCreate}
        >
          <Plus color="#020e1e" size={18} />
          <Text className="text-background font-bold ml-2">Create code</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-[#111823] border border-[#243044] rounded-xl py-4 px-4 flex-row items-center justify-center"
          onPress={refreshAll}
        >
          <BarChart3 color="#9EDD45" size={18} />
          <Text className="text-white font-bold ml-2">Refresh</Text>
        </TouchableOpacity>
      </View>

      <View className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden">
        <View className="p-4 border-b border-[#243044]">
          <Text className="text-white text-xl font-semibold">Code library</Text>
          <Text className="text-gray-400 mt-1">
            {totalItems} promo code{totalItems === 1 ? "" : "s"} available.
          </Text>
          <View className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-3 flex-row items-center mt-4">
            <Search color="#8B6BFF" size={18} />
            <TextInput
              className="flex-1 text-white py-3 ml-2"
              placeholder="Search codes or names"
              placeholderTextColor="#728097"
              returnKeyType="search"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={submitSearch}
            />
            <TouchableOpacity
              className="bg-primary rounded-lg px-3 py-2"
              onPress={submitSearch}
            >
              <Text className="text-background font-bold">Go</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isFetching && !isLoading ? (
          <View className="py-3">
            <ActivityIndicator color="#9EDD45" />
          </View>
        ) : null}

        {codes.length ? (
          codes.map((code) => (
            <View key={code.id} className="p-4 border-b border-[#243044]">
              <View className="flex-row items-start justify-between">
                <View className="flex-row flex-1 pr-3">
                  <View className="w-11 h-11 rounded-full bg-primary items-center justify-center">
                    <Tag color="#020e1e" size={20} />
                  </View>
                  <View className="ml-3 flex-1">
                    <View className="flex-row items-center flex-wrap">
                      <Text className="text-white text-lg font-bold tracking-[1px]">
                        {code.code}
                      </Text>
                      <Text
                        className={`ml-2 rounded-full px-2 py-1 text-xs font-bold ${
                          code.active
                            ? "bg-primary/15 text-primary"
                            : "bg-white/10 text-gray-300"
                        }`}
                      >
                        {code.active ? "ACTIVE" : "INACTIVE"}
                      </Text>
                    </View>
                    <Text className="text-gray-400 mt-1">
                      {code.name || code.event?.title || "Promo code"}
                    </Text>
                    <Text className="text-primary font-semibold mt-2">
                      {formatDiscount(code)}
                    </Text>
                    <Text className="text-gray-500 mt-1">
                      {Number(code.used_count || code._count?.redemptions || 0)} used
                      {code.usage_limit ? ` / ${code.usage_limit}` : ""} •{" "}
                      {formatDate(code.expires_at)}
                    </Text>
                  </View>
                </View>
              </View>
              <View className="flex-row flex-wrap gap-2 mt-4">
                <TouchableOpacity
                  className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 flex-row items-center"
                  onPress={() => openEdit(code)}
                >
                  <Edit3 color="#E5E7EB" size={16} />
                  <Text className="text-white font-semibold ml-2">Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="border border-red-500/40 rounded-xl px-4 py-3 flex-row items-center disabled:opacity-50"
                  disabled={isArchiving}
                  onPress={() => archiveCode(code)}
                >
                  <Archive color="#F87171" size={16} />
                  <Text className="text-red-300 font-semibold ml-2">Archive</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View className="p-8 items-center">
            <Percent color="#8B6BFF" size={34} />
            <Text className="text-white text-lg font-semibold mt-4">
              No promo codes yet
            </Text>
            <Text className="text-gray-400 text-center mt-2">
              Create a single discount code or generate bulk codes for a paid event.
            </Text>
          </View>
        )}

        <View className="p-4 flex-row items-center justify-between">
          <TouchableOpacity
            className="bg-[#1A2432] rounded-xl px-4 py-3 flex-row items-center disabled:opacity-40"
            disabled={page <= 1}
            onPress={() => setPage((current) => Math.max(1, current - 1))}
          >
            <ChevronLeft color="#E5E7EB" size={17} />
            <Text className="text-white ml-1">Previous</Text>
          </TouchableOpacity>
          <Text className="text-gray-300">Page {page} of {totalPages}</Text>
          <TouchableOpacity
            className="bg-[#1A2432] rounded-xl px-4 py-3 flex-row items-center disabled:opacity-40"
            disabled={page >= totalPages}
            onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            <Text className="text-white mr-1">Next</Text>
            <ChevronRight color="#E5E7EB" size={17} />
          </TouchableOpacity>
        </View>
      </View>

      <View className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden mt-5">
        <View className="p-4 border-b border-[#243044]">
          <Text className="text-white text-xl font-semibold">Redemptions</Text>
          <Text className="text-gray-400 mt-1">
            Checkout usage, attendee, discount, and final amount.
          </Text>
        </View>
        {redemptionsFetching ? (
          <View className="py-3">
            <ActivityIndicator color="#9EDD45" />
          </View>
        ) : null}
        {redemptions.length ? (
          redemptions.map((redemption) => (
            <View key={redemption.id} className="p-4 border-b border-[#243044]">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-white font-bold">
                    {redemption.code}
                  </Text>
                  <Text className="text-gray-400 mt-1">
                    {redemption.booking?.fullname ||
                      redemption.booking?.email ||
                      redemption.email ||
                      "Attendee"}{" "}
                    • {formatDate(redemption.created_at)}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-primary font-bold">
                    -{money(redemption.discount_amount)}
                  </Text>
                  <Text className="text-gray-400 mt-1">
                    Paid {money(redemption.final_amount)}
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text className="text-gray-400 p-5">No redemptions yet.</Text>
        )}
        <View className="p-4 flex-row items-center justify-between">
          <TouchableOpacity
            className="bg-[#1A2432] rounded-xl px-4 py-3 disabled:opacity-40"
            disabled={redemptionPage <= 1}
            onPress={() =>
              setRedemptionPage((current) => Math.max(1, current - 1))
            }
          >
            <Text className="text-white font-semibold">Previous</Text>
          </TouchableOpacity>
          <Text className="text-gray-300">
            Page {redemptionPage} of {redemptionTotalPages}
          </Text>
          <TouchableOpacity
            className="bg-[#1A2432] rounded-xl px-4 py-3 disabled:opacity-40"
            disabled={redemptionPage >= redemptionTotalPages}
            onPress={() =>
              setRedemptionPage((current) =>
                Math.min(redemptionTotalPages, current + 1)
              )
            }
          >
            <Text className="text-white font-semibold">Next</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="bg-[#111823] border border-[#243044] rounded-2xl p-5 mt-5">
        <View className="flex-row items-center">
          <View className="w-11 h-11 rounded-full bg-[#5B4DFF] items-center justify-center">
            <BarChart3 color="white" size={20} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-white text-xl font-semibold">Usage leaders</Text>
            <Text className="text-gray-400 mt-1">
              Codes creating the most checkout movement.
            </Text>
          </View>
        </View>

        <View className="mt-4 gap-3">
          {(analytics.breakdownByCode || analytics.usageLeaders || [])
            .slice(0, 6)
            .map((item) => {
              const used = "redemptions" in item ? item.redemptions : item.usedCount;
              return (
                <View
                  key={item.id}
                  className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-4"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-white font-bold">{item.code}</Text>
                      <Text className="text-gray-400 mt-1">
                        {item.name || "Promo code"}
                      </Text>
                    </View>
                    <Text className="text-primary font-bold">{used || 0} used</Text>
                  </View>
                </View>
              );
            })}
          {!(analytics.breakdownByCode || analytics.usageLeaders || []).length && (
            <Text className="text-gray-400">
              Usage data appears after attendees redeem promo codes.
            </Text>
          )}
        </View>
      </View>

      <Modal visible={formOpen} transparent animationType="slide">
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-[#111823] border border-[#243044] rounded-t-3xl max-h-[92%] overflow-hidden">
            <View className="p-5 border-b border-[#243044] flex-row justify-between items-center">
              <View>
                <Text className="text-white text-xl font-semibold">
                  {editingId ? "Edit promo code" : "Create promo code"}
                </Text>
                <Text className="text-gray-400 mt-1">
                  Attach discounts to paid events.
                </Text>
              </View>
              <TouchableOpacity onPress={resetForm}>
                <X color="#E5E7EB" size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
              {!editingId && (
                <View className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-1 flex-row mb-4">
                  {(["single", "bulk"] as const).map((item) => (
                    <TouchableOpacity
                      key={item}
                      className={`flex-1 rounded-lg py-3 ${
                        mode === item ? "bg-primary" : ""
                      }`}
                      onPress={() => setMode(item)}
                    >
                      <Text
                        className={`text-center font-bold ${
                          mode === item ? "text-background" : "text-white"
                        }`}
                      >
                        {item === "single" ? "Single" : "Bulk"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text className="text-gray-300 font-semibold mb-2">Event</Text>
              <View className="max-h-52 mb-4">
                <ScrollView nestedScrollEnabled>
                  {paidEvents.map((event) => (
                    <TouchableOpacity
                      key={String(event.id)}
                      className={`border rounded-xl p-3 mb-2 ${
                        form.event_id === String(event.id)
                          ? "border-primary bg-primary/10"
                          : "border-[#2E3A4D] bg-[#1A2432]"
                      }`}
                      onPress={() => updateForm("event_id", String(event.id))}
                    >
                      <Text className="text-white font-semibold">
                        {event.title || "Untitled event"}
                      </Text>
                      <Text className="text-gray-500 mt-1">
                        {normalizeCurrency(event.currency)} •{" "}
                        {event.tickets?.length || 0} ticket types
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {!paidEvents.length && (
                    <Text className="text-gray-400">
                      Promo codes are available for paid events only.
                    </Text>
                  )}
                </ScrollView>
              </View>

              <Text className="text-gray-300 font-semibold mb-2">
                {mode === "bulk" && !editingId ? "Prefix" : "Code"}
              </Text>
              <TextInput
                className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white mb-4"
                placeholder={mode === "bulk" && !editingId ? "VIP" : "EARLYBIRD"}
                placeholderTextColor="#728097"
                autoCapitalize="characters"
                value={mode === "bulk" && !editingId ? form.prefix : form.code}
                onChangeText={(value) =>
                  updateForm(
                    mode === "bulk" && !editingId ? "prefix" : "code",
                    value.toUpperCase()
                  )
                }
              />

              {mode === "bulk" && !editingId && (
                <>
                  <Text className="text-gray-300 font-semibold mb-2">Quantity</Text>
                  <TextInput
                    className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white mb-4"
                    keyboardType="number-pad"
                    value={form.quantity}
                    onChangeText={(value) => updateForm("quantity", value)}
                  />
                </>
              )}

              <Text className="text-gray-300 font-semibold mb-2">Display name</Text>
              <TextInput
                className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white mb-4"
                placeholder="Early bird discount"
                placeholderTextColor="#728097"
                value={form.name}
                onChangeText={(value) => updateForm("name", value)}
              />

              <Text className="text-gray-300 font-semibold mb-2">Discount type</Text>
              <View className="flex-row gap-2 mb-4">
                {(["PERCENTAGE", "FIXED_AMOUNT"] as DiscountType[]).map((item) => (
                  <TouchableOpacity
                    key={item}
                    className={`rounded-xl px-4 py-3 border ${
                      form.discount_type === item
                        ? "bg-primary border-primary"
                        : "bg-[#1A2432] border-[#2E3A4D]"
                    }`}
                    onPress={() => updateForm("discount_type", item)}
                  >
                    <Text
                      className={
                        form.discount_type === item
                          ? "text-background font-bold"
                          : "text-white font-semibold"
                      }
                    >
                      {item === "PERCENTAGE" ? "Percent" : "Fixed"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-gray-300 font-semibold mb-2">Discount value</Text>
              <TextInput
                className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white mb-4"
                keyboardType="decimal-pad"
                placeholder="20"
                placeholderTextColor="#728097"
                value={form.discount_value}
                onChangeText={(value) => updateForm("discount_value", value)}
              />

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-gray-300 font-semibold mb-2">Usage limit</Text>
                  <TextInput
                    className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white mb-4"
                    keyboardType="number-pad"
                    placeholder="100"
                    placeholderTextColor="#728097"
                    value={form.usage_limit}
                    onChangeText={(value) => updateForm("usage_limit", value)}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-300 font-semibold mb-2">Per buyer</Text>
                  <TextInput
                    className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white mb-4"
                    keyboardType="number-pad"
                    value={form.per_user_limit}
                    onChangeText={(value) => updateForm("per_user_limit", value)}
                  />
                </View>
              </View>

              <Text className="text-gray-300 font-semibold mb-2">Min order</Text>
              <TextInput
                className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white mb-4"
                keyboardType="decimal-pad"
                placeholder="Optional"
                placeholderTextColor="#728097"
                value={form.min_order_amount}
                onChangeText={(value) => updateForm("min_order_amount", value)}
              />

              <Text className="text-gray-300 font-semibold mb-2">Expiry date</Text>
              <TextInput
                className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white mb-5"
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#728097"
                value={form.expires_at}
                onChangeText={(value) => updateForm("expires_at", value)}
              />

              <TouchableOpacity
                className="bg-primary rounded-xl py-4 disabled:opacity-50"
                disabled={saving}
                onPress={submitForm}
              >
                <Text className="text-background text-center font-bold">
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update promo code"
                      : mode === "bulk"
                        ? "Generate codes"
                        : "Create promo code"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ProfileFoundationScreen>
  );
}
