import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CalendarRange,
  Eye,
  RefreshCcw,
  TicketCheck,
  Users,
  WalletCards,
} from "lucide-react-native";

import ProfileFoundationScreen from "@/app/components/profile/ProfileFoundationScreen";
import { useGetOrganizerRoiQuery } from "@/redux/api/analyticsApiSlice";

type OrganizerRecommendation = {
  action: string;
  detail: string;
  id: string;
  metric: number;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
};

type OrganizerTopEvent = {
  bookings: number;
  checkInRate: number;
  checkoutConversionRate: number;
  conversionRate: number;
  currency: string;
  grossRevenue: number;
  id: number;
  published: boolean;
  start_date?: string | null;
  title: string;
  views: number;
};

const rangeOptions = [
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
];

const emptyBody = {
  currency: "NGN",
  eventOptions: [] as Array<{
    id: number;
    published: boolean;
    start_date?: string | null;
    title: string;
  }>,
  funnel: [] as Array<{ count: number; key: string; label: string; rate: number }>,
  metrics: {
    avgTicketValue: 0,
    bookings: 0,
    checkInRate: 0,
    checkIns: 0,
    checkoutConversionRate: 0,
    checkoutStarts: 0,
    draftEvents: 0,
    freeBookings: 0,
    grossRevenue: 0,
    paidBookings: 0,
    pendingBookings: 0,
    publishedEvents: 0,
    repeatAttendees: 0,
    ticketsSold: 0,
    totalEvents: 0,
    totalViews: 0,
    uniqueVisitors: 0,
  },
  mixedCurrencies: false,
  recommendations: [] as OrganizerRecommendation[],
  revenueByCurrency: [] as Array<{
    bookings: number;
    currency: string;
    grossRevenue: number;
  }>,
  revenueByDay: [] as Array<{ bookings: number; label: string; revenue: number }>,
  topEvents: [] as OrganizerTopEvent[],
};

function numberText(value?: unknown) {
  return Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 1,
  });
}

function percent(value?: unknown) {
  return `${numberText(value)}%`;
}

function money(value?: unknown, currency?: unknown) {
  const amount = Number(value || 0);
  const code = String(currency || "NGN").split(/[\s-]/)[0] || "NGN";
  try {
    return new Intl.NumberFormat("en-US", {
      currency: code,
      maximumFractionDigits: amount % 1 ? 2 : 0,
      style: "currency",
    }).format(amount);
  } catch {
    return `${code} ${amount.toLocaleString(undefined, {
      maximumFractionDigits: amount % 1 ? 2 : 0,
    })}`;
  }
}

function dateText(value?: string | null) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function severityClass(severity: OrganizerRecommendation["severity"]) {
  if (severity === "critical") return "border-red-400/40 bg-red-500/10";
  if (severity === "high") return "border-amber-400/40 bg-amber-500/10";
  if (severity === "medium") return "border-sky-400/40 bg-sky-500/10";
  return "border-primary/40 bg-primary/10";
}

export default function OrganizerInsightsScreen() {
  const [range, setRange] = useState("30d");
  const [eventId, setEventId] = useState("all");
  const queryArgs = useMemo(
    () => ({
      event_id: eventId === "all" ? undefined : eventId,
      range,
    }),
    [eventId, range]
  );
  const { data, error, isFetching, isLoading, refetch } =
    useGetOrganizerRoiQuery(queryArgs);
  const body = data?.body || emptyBody;
  const metrics = body.metrics || emptyBody.metrics;
  const maxRevenue = Math.max(
    1,
    ...body.revenueByDay.map((item: any) => Number(item.revenue || 0))
  );

  return (
    <ProfileFoundationScreen
      isLoading={isLoading}
      title="Insights"
      subtitle="ROI, conversion, and event-day readiness"
      stats={[
        {
          label: body.mixedCurrencies ? "Revenue mixed" : "Revenue",
          value: money(metrics.grossRevenue, body.currency),
        },
        { label: "Bookings", value: numberText(metrics.bookings) },
        { label: "Views", value: numberText(metrics.totalViews) },
        { label: "Check-in", value: percent(metrics.checkInRate) },
      ]}
    >
      <View className="bg-[#111823] border border-[#243044] rounded-2xl p-4 mb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <BarChart3 color="#8B6BFF" size={21} />
            <Text className="text-white text-xl font-semibold ml-2">
              Command center
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
              onPress={() => setRange(item.value)}
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 mt-3">
            <TouchableOpacity
              className={`rounded-full px-4 py-2 border ${
                eventId === "all"
                  ? "bg-[#8B6BFF] border-[#8B6BFF]"
                  : "border-[#2E3A4D]"
              }`}
              onPress={() => setEventId("all")}
            >
              <Text
                className={
                  eventId === "all"
                    ? "text-white font-bold"
                    : "text-gray-300 font-semibold"
                }
              >
                All events
              </Text>
            </TouchableOpacity>
            {body.eventOptions.map((event: any) => (
              <TouchableOpacity
                key={event.id}
                className={`rounded-full px-4 py-2 border ${
                  eventId === String(event.id)
                    ? "bg-[#8B6BFF] border-[#8B6BFF]"
                    : "border-[#2E3A4D]"
                }`}
                onPress={() => setEventId(String(event.id))}
              >
                <Text
                  className={
                    eventId === String(event.id)
                      ? "text-white font-bold"
                      : "text-gray-300 font-semibold"
                  }
                  numberOfLines={1}
                >
                  {event.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {error ? (
          <Text className="text-red-300 font-semibold mt-4">
            Unable to load organizer insights.
          </Text>
        ) : null}
      </View>

      <View className="bg-[#111823] border border-[#243044] rounded-2xl p-4 mb-4">
        <View className="flex-row items-center mb-4">
          <TicketCheck color="#9EDD45" size={21} />
          <Text className="text-white text-xl font-semibold ml-2">
            Conversion funnel
          </Text>
        </View>
        {body.funnel.length ? (
          body.funnel.map((stage: any, index: number) => (
            <View key={stage.key} className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <View>
                  <Text className="text-white font-semibold">{stage.label}</Text>
                  <Text className="text-gray-400 text-xs">
                    {index === 0 ? "Top of funnel" : `${percent(stage.rate)} of views`}
                  </Text>
                </View>
                <Text className="text-white font-bold">
                  {numberText(stage.count)}
                </Text>
              </View>
              <View className="h-3 bg-[#1A2432] rounded-full overflow-hidden">
                <View
                  className={`h-3 rounded-full ${
                    index === 0
                      ? "bg-primary"
                      : index === 1
                        ? "bg-sky-400"
                        : index === 2
                          ? "bg-amber-400"
                          : "bg-emerald-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      Math.max(Number(stage.rate || (index === 0 ? 100 : 0)), 4),
                      100
                    )}%`,
                  }}
                />
              </View>
            </View>
          ))
        ) : (
          <EmptyText text="No funnel activity in this range." />
        )}
      </View>

      <View className="bg-[#111823] border border-[#243044] rounded-2xl p-4 mb-4">
        <View className="flex-row items-center mb-4">
          <CalendarRange color="#8B6BFF" size={21} />
          <Text className="text-white text-xl font-semibold ml-2">
            Revenue trend
          </Text>
        </View>
        <View className="h-44 flex-row items-end gap-2">
          {body.revenueByDay.slice(-12).map((item: any) => (
            <View key={item.label} className="flex-1 items-center">
              <View
                className="w-full bg-primary rounded-t-lg"
                style={{
                  height: Math.max(
                    8,
                    (Number(item.revenue || 0) / maxRevenue) * 150
                  ),
                }}
              />
              <Text className="text-gray-500 text-[10px] mt-2" numberOfLines={1}>
                {String(item.label || "").slice(-5)}
              </Text>
            </View>
          ))}
        </View>
        <View className="flex-row gap-2 mt-4">
          <MiniMetric
            icon={<WalletCards color="#9EDD45" size={17} />}
            label="Avg ticket"
            value={money(metrics.avgTicketValue, body.currency)}
          />
          <MiniMetric
            icon={<Users color="#9EDD45" size={17} />}
            label="Repeat"
            value={numberText(metrics.repeatAttendees)}
          />
        </View>
      </View>

      <View className="bg-[#111823] border border-[#243044] rounded-2xl p-4 mb-4">
        <View className="flex-row items-center mb-4">
          <ArrowUpRight color="#8B6BFF" size={21} />
          <Text className="text-white text-xl font-semibold ml-2">
            Top events
          </Text>
        </View>
        {isLoading ? <ActivityIndicator color="#9EDD45" /> : null}
        {body.topEvents.length ? (
          body.topEvents.map((event: OrganizerTopEvent) => (
            <View key={event.id} className="border-b border-[#243044] py-3">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-white font-semibold" numberOfLines={1}>
                    {event.title}
                  </Text>
                  <Text className="text-gray-500 text-xs mt-1">
                    {dateText(event.start_date)} ·{" "}
                    {event.published ? "Published" : "Draft"}
                  </Text>
                </View>
                <Text className="text-primary font-bold">
                  {money(event.grossRevenue, event.currency || body.currency)}
                </Text>
              </View>
              <View className="flex-row gap-2 mt-3">
                <Pill icon={<Eye color="#A8B3C7" size={14} />} text={`${numberText(event.views)} views`} />
                <Pill text={`${numberText(event.bookings)} bookings`} />
                <Pill text={`${percent(event.conversionRate)} conv.`} />
              </View>
            </View>
          ))
        ) : (
          <EmptyText text="No event activity in this range." />
        )}
      </View>

      <View className="bg-[#111823] border border-[#243044] rounded-2xl p-4 mb-4">
        <View className="flex-row items-center mb-4">
          <AlertTriangle color="#FBBF24" size={21} />
          <Text className="text-white text-xl font-semibold ml-2">
            Action queue
          </Text>
        </View>
        {body.recommendations.length ? (
          body.recommendations.map((item: OrganizerRecommendation) => (
            <View
              key={item.id}
              className={`rounded-xl border p-4 mb-3 ${severityClass(item.severity)}`}
            >
              <Text className="text-white font-bold">{item.title}</Text>
              <Text className="text-gray-300 text-sm mt-1">{item.detail}</Text>
              <Text className="text-primary font-bold mt-3">{item.action}</Text>
            </View>
          ))
        ) : (
          <EmptyText text="No urgent recommendations for this range." />
        )}
      </View>

      {body.revenueByCurrency.length ? (
        <View className="bg-[#111823] border border-[#243044] rounded-2xl p-4">
          <View className="flex-row items-center mb-4">
            <WalletCards color="#9EDD45" size={21} />
            <Text className="text-white text-xl font-semibold ml-2">
              Currency breakdown
            </Text>
          </View>
          {body.revenueByCurrency.map((item: any) => (
            <View
              key={item.currency}
              className="flex-row items-center justify-between py-3 border-b border-[#243044]"
            >
              <View>
                <Text className="text-white font-semibold">{item.currency}</Text>
                <Text className="text-gray-500 text-xs">
                  {numberText(item.bookings)} booking
                  {Number(item.bookings) === 1 ? "" : "s"}
                </Text>
              </View>
              <Text className="text-primary font-bold">
                {money(item.grossRevenue, item.currency)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </ProfileFoundationScreen>
  );
}

function MiniMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-1 bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-3">
      <View className="flex-row items-center">
        {icon}
        <Text className="text-gray-400 text-xs ml-2">{label}</Text>
      </View>
      <Text className="text-white font-bold text-lg mt-2">{value}</Text>
    </View>
  );
}

function Pill({ icon, text }: { icon?: React.ReactNode; text: string }) {
  return (
    <View className="bg-[#1A2432] rounded-full px-3 py-2 flex-row items-center">
      {icon}
      <Text className="text-gray-300 text-xs font-semibold ml-1">{text}</Text>
    </View>
  );
}

function EmptyText({ text }: { text: string }) {
  return (
    <View className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-6">
      <Text className="text-gray-400 text-center font-semibold">{text}</Text>
    </View>
  );
}
