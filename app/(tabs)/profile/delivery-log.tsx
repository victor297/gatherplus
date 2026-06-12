import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock3,
  Mail,
  MessageSquare,
  RefreshCcw,
  RotateCcw,
  Search,
  Send,
} from "lucide-react-native";

import ProfileFoundationScreen from "@/app/components/profile/ProfileFoundationScreen";
import {
  NotificationDeliveryBatch,
  useGetNotificationDeliveryQuery,
  useRetryNotificationDeliveryMutation,
} from "@/redux/api/notificationApiSlice";
import { getApiErrorMessage } from "@/utils/api";

type DeliveryTab = "all" | "attention" | "email" | "sms";

const rangeOptions = [
  { label: "24H", value: "24h" },
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
];

const tabs: Array<{ label: string; value: DeliveryTab }> = [
  { label: "All", value: "all" },
  { label: "Retry", value: "attention" },
  { label: "Email", value: "email" },
  { label: "SMS", value: "sms" },
];

const emptyMetrics = {
  batches: 0,
  emailFailed: 0,
  emailQueued: 0,
  emailSent: 0,
  emailSkipped: 0,
  events: 0,
  retryableBatches: 0,
  smsFailed: 0,
  smsSent: 0,
  smsSkipped: 0,
  totalBookings: 0,
  uniqueEmailRecipients: 0,
  uniqueSmsRecipients: 0,
};

function numberText(value?: unknown) {
  return Number(value || 0).toLocaleString();
}

function dateText(value?: string | null) {
  if (!value) return "Unknown time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  });
}

function compactValue(value: unknown) {
  if (value === undefined || value === null || value === "") return "Not set";
  if (Array.isArray(value)) return `${value.length} item(s)`;
  if (typeof value === "object") return "Updated";
  const output = String(value);
  return output.length > 70 ? `${output.slice(0, 67)}...` : output;
}

function statusTone(status: string) {
  if (status === "failed") return "border-red-400/40 bg-red-500/10";
  if (status === "queued") return "border-amber-400/40 bg-amber-500/10";
  if (status === "sent") return "border-primary/40 bg-primary/10";
  if (status === "skipped") return "border-[#2E3A4D] bg-[#1A2432]";
  return "border-[#2E3A4D] bg-[#111823]";
}

function statusColor(status: string) {
  if (status === "failed") return "#F87171";
  if (status === "queued") return "#FBBF24";
  if (status === "sent") return "#9EDD45";
  return "#A8B3C7";
}

function filterBatches(batches: NotificationDeliveryBatch[], tab: DeliveryTab) {
  if (tab === "attention") return batches.filter((batch) => batch.canRetry);
  if (tab === "email") {
    return batches.filter((batch) => {
      const email = batch.delivery.email;
      return email.failed + email.queued + email.sent + email.skipped > 0;
    });
  }
  if (tab === "sms") {
    return batches.filter((batch) => {
      const sms = batch.delivery.sms;
      return sms.failed + sms.sent + sms.skipped > 0;
    });
  }
  return batches;
}

export default function DeliveryLogScreen() {
  const [activeTab, setActiveTab] = useState<DeliveryTab>("all");
  const [page, setPage] = useState(1);
  const [range, setRange] = useState("30d");
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [retryingId, setRetryingId] = useState<number | null>(null);

  const queryArgs = useMemo(
    () => ({
      page,
      range,
      search: submittedSearch,
      size: 12,
    }),
    [page, range, submittedSearch]
  );

  const { data, error, isFetching, isLoading, refetch } =
    useGetNotificationDeliveryQuery(queryArgs);
  const [retryDelivery] = useRetryNotificationDeliveryMutation();

  const body = data?.body;
  const metrics = body?.metrics || emptyMetrics;
  const batches = filterBatches(body?.result || [], activeTab);
  const totalPages = Math.max(1, Number(body?.pagination?.totalPages || 1));

  const submitSearch = () => {
    setPage(1);
    setSubmittedSearch(search.trim());
  };

  const retryBatch = async (batch: NotificationDeliveryBatch) => {
    if (!batch.canRetry) return;
    setRetryingId(batch.auditId);
    try {
      await retryDelivery({ auditId: batch.auditId }).unwrap();
      Alert.alert("Retry queued", "Failed attendee notifications were retried.");
      await refetch();
    } catch (requestError) {
      Alert.alert("Retry failed", getApiErrorMessage(requestError));
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <ProfileFoundationScreen
      isLoading={isLoading}
      title="Delivery Log"
      subtitle="Sold-event email and SMS delivery"
      stats={[
        { label: "Batches", value: numberText(metrics.batches) },
        { label: "Needs retry", value: numberText(metrics.retryableBatches) },
        { label: "Email failed", value: numberText(metrics.emailFailed) },
        { label: "SMS skipped", value: numberText(metrics.smsSkipped) },
      ]}
    >
      <View className="bg-[#111823] border border-[#243044] rounded-2xl p-4 mb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 pr-3">
            <Bell color="#8B6BFF" size={21} />
            <Text className="text-white text-xl font-semibold ml-2">
              Notification delivery
            </Text>
          </View>
          <TouchableOpacity
            className="bg-primary rounded-xl px-3 py-2 flex-row items-center"
            onPress={() => refetch()}
          >
            <RefreshCcw color="#101820" size={16} />
            <Text className="text-background font-bold ml-2">
              {isFetching ? "Sync" : "Refresh"}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row flex-wrap gap-2 mt-4">
          {rangeOptions.map((item) => (
            <TouchableOpacity
              key={item.value}
              className={`rounded-full px-4 py-2 border ${
                range === item.value
                  ? "bg-primary border-primary"
                  : "border-[#2E3A4D]"
              }`}
              onPress={() => {
                setPage(1);
                setRange(item.value);
              }}
            >
              <Text
                className={
                  range === item.value
                    ? "text-background font-bold"
                    : "text-gray-300 font-semibold"
                }
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="flex-row items-center bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-3 py-2 mt-4">
          <Search color="#6B7280" size={18} />
          <TextInput
            className="flex-1 text-white ml-2"
            placeholder="Search event or batch"
            placeholderTextColor="#6B7280"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            onSubmitEditing={submitSearch}
          />
          <TouchableOpacity
            className="bg-[#8B6BFF] rounded-lg px-3 py-2"
            onPress={submitSearch}
          >
            <Text className="text-white font-bold">Search</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 mt-4">
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.value}
                className={`rounded-full px-4 py-2 border ${
                  activeTab === tab.value
                    ? "bg-[#8B6BFF] border-[#8B6BFF]"
                    : "border-[#2E3A4D]"
                }`}
                onPress={() => setActiveTab(tab.value)}
              >
                <Text
                  className={
                    activeTab === tab.value
                      ? "text-white font-bold"
                      : "text-gray-300 font-semibold"
                  }
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {error ? (
          <View className="border border-red-400/40 bg-red-500/10 rounded-xl p-4 mt-4">
            <Text className="text-red-200 font-semibold">
              Unable to load delivery batches.
            </Text>
          </View>
        ) : null}
      </View>

      <View className="flex-row gap-3 mb-4">
        <MiniMetric
          icon={<Mail color="#9EDD45" size={17} />}
          label="Email sent"
          value={numberText(metrics.emailSent)}
          note={`${numberText(metrics.emailQueued)} queued`}
        />
        <MiniMetric
          icon={<MessageSquare color="#9EDD45" size={17} />}
          label="SMS sent"
          value={numberText(metrics.smsSent)}
          note={`${numberText(metrics.smsFailed)} failed`}
        />
      </View>

      {isFetching && !isLoading ? (
        <View className="py-3 items-center">
          <ActivityIndicator color="#9EDD45" />
        </View>
      ) : null}

      {batches.length ? (
        batches.map((batch) => (
          <DeliveryBatchCard
            key={batch.auditId}
            batch={batch}
            retrying={retryingId === batch.auditId}
            onRetry={retryBatch}
          />
        ))
      ) : (
        <View className="bg-[#111823] border border-[#243044] rounded-2xl p-8 items-center">
          <Send color="#6B7280" size={36} />
          <Text className="text-white text-lg font-bold mt-4">
            No delivery batches
          </Text>
          <Text className="text-gray-400 text-center mt-2">
            Sold-event edit notifications will appear here after an organizer
            updates an event with active bookings.
          </Text>
        </View>
      )}

      <View className="flex-row items-center justify-between mt-4">
        <TouchableOpacity
          className={`rounded-xl px-4 py-3 border ${
            page <= 1 ? "border-[#2E3A4D]" : "border-primary"
          }`}
          disabled={page <= 1}
          onPress={() => setPage((current) => Math.max(1, current - 1))}
        >
          <Text
            className={page <= 1 ? "text-gray-600 font-bold" : "text-primary font-bold"}
          >
            Previous
          </Text>
        </TouchableOpacity>

        <Text className="text-gray-400 font-semibold">
          Page {page} of {totalPages}
        </Text>

        <TouchableOpacity
          className={`rounded-xl px-4 py-3 border ${
            page >= totalPages ? "border-[#2E3A4D]" : "border-primary"
          }`}
          disabled={page >= totalPages}
          onPress={() => setPage((current) => current + 1)}
        >
          <Text
            className={
              page >= totalPages ? "text-gray-600 font-bold" : "text-primary font-bold"
            }
          >
            Next
          </Text>
        </TouchableOpacity>
      </View>
    </ProfileFoundationScreen>
  );
}

function MiniMetric({
  icon,
  label,
  note,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  note: string;
  value: string;
}) {
  return (
    <View className="flex-1 bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-3">
      <View className="flex-row items-center">
        {icon}
        <Text className="text-gray-400 text-xs ml-2">{label}</Text>
      </View>
      <Text className="text-white font-bold text-lg mt-2">{value}</Text>
      <Text className="text-gray-500 text-xs mt-1">{note}</Text>
    </View>
  );
}

function DeliveryBatchCard({
  batch,
  onRetry,
  retrying,
}: {
  batch: NotificationDeliveryBatch;
  onRetry: (batch: NotificationDeliveryBatch) => void;
  retrying: boolean;
}) {
  const status = batch.status || "pending";
  const StatusIcon =
    status === "failed"
      ? AlertCircle
      : status === "sent"
        ? CheckCircle2
        : status === "queued"
          ? Clock3
          : Bell;

  return (
    <View className="bg-[#111823] border border-[#243044] rounded-2xl p-4 mb-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <View className={`self-start rounded-full px-3 py-2 border flex-row items-center ${statusTone(status)}`}>
            <StatusIcon color={statusColor(status)} size={15} />
            <Text className="text-gray-100 text-xs font-bold capitalize ml-2">
              {status}
            </Text>
          </View>

          <Text className="text-white text-lg font-bold mt-3" numberOfLines={2}>
            {batch.event.title}
          </Text>
          <Text className="text-gray-500 text-xs mt-1">
            Batch #{batch.auditId} - {dateText(batch.created_at)}
          </Text>
        </View>

        <TouchableOpacity
          className={`rounded-xl px-3 py-2 flex-row items-center ${
            batch.canRetry ? "bg-primary" : "bg-[#1A2432]"
          }`}
          disabled={!batch.canRetry || retrying}
          onPress={() => onRetry(batch)}
        >
          <RotateCcw color={batch.canRetry ? "#101820" : "#6B7280"} size={15} />
          <Text
            className={`font-bold text-xs ml-2 ${
              batch.canRetry ? "text-background" : "text-gray-500"
            }`}
          >
            {retrying ? "Retrying" : "Retry"}
          </Text>
        </TouchableOpacity>
      </View>

      {batch.notificationReview && (
        <View className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-3 mt-4">
          <View className="flex-row flex-wrap items-center gap-2">
            {batch.notificationReview.urgent && (
              <View className="rounded-full bg-[#F59E0B]/15 px-3 py-1">
                <Text className="text-[#F59E0B] text-xs font-bold">Urgent</Text>
              </View>
            )}
            <View className="rounded-full bg-[#243044] px-3 py-1">
              <Text className="text-gray-300 text-xs font-bold">
                Channels:{" "}
                {(batch.notificationReview.channels || ["email", "sms"]).join(", ")}
              </Text>
            </View>
          </View>
          {!!batch.notificationReview.organizerNote && (
            <Text className="text-gray-300 text-sm mt-2">
              Organizer note: {batch.notificationReview.organizerNote}
            </Text>
          )}
        </View>
      )}

      <View className="flex-row gap-3 mt-4">
        <ChannelCard
          icon={<Mail color="#8B6BFF" size={17} />}
          label="Email"
          line={`${numberText(batch.delivery.email.queued)} queued`}
          value={`${numberText(batch.delivery.email.sent)} sent`}
          warning={`${numberText(batch.delivery.email.failed)} failed`}
        />
        <ChannelCard
          icon={<MessageSquare color="#8B6BFF" size={17} />}
          label="SMS"
          line={`${numberText(batch.delivery.sms.skipped)} skipped`}
          value={`${numberText(batch.delivery.sms.sent)} sent`}
          warning={`${numberText(batch.delivery.sms.failed)} failed`}
        />
      </View>

      <Text className="text-gray-500 text-xs mt-3">
        Retryable: {numberText(batch.retryable.emailBookingCount)} email,{" "}
        {numberText(batch.retryable.smsBookingCount)} SMS
      </Text>

      {batch.changes.length ? (
        <View className="mt-4">
          <Text className="text-gray-400 text-xs font-bold uppercase mb-2">
            Changed fields
          </Text>
          {batch.changes.slice(0, 3).map((change) => (
            <View
              key={`${batch.auditId}-${change.field}-${change.label}`}
              className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-3 mb-2"
            >
              <Text className="text-white font-semibold">{change.label}</Text>
              <View className="flex-row gap-2 mt-2">
                <View className="flex-1">
                  <Text className="text-gray-500 text-xs">Before</Text>
                  <Text className="text-gray-300 text-sm mt-1">
                    {compactValue(change.before)}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-500 text-xs">Now</Text>
                  <Text className="text-white text-sm font-semibold mt-1">
                    {compactValue(change.after)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ChannelCard({
  icon,
  label,
  line,
  value,
  warning,
}: {
  icon: React.ReactNode;
  label: string;
  line: string;
  value: string;
  warning: string;
}) {
  return (
    <View className="flex-1 bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-3">
      <View className="flex-row items-center">
        {icon}
        <Text className="text-gray-400 text-xs font-bold ml-2">{label}</Text>
      </View>
      <Text className="text-white font-bold mt-2">{value}</Text>
      <Text className="text-gray-400 text-xs mt-1">{line}</Text>
      <Text className="text-red-200 text-xs mt-1">{warning}</Text>
    </View>
  );
}
