import React, { useMemo, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  QrCode,
  Radar,
  RefreshCw,
  ShieldAlert,
  Ticket,
  Users,
  Wifi,
} from "lucide-react-native";
import ProfileFoundationScreen from "@/app/components/profile/ProfileFoundationScreen";
import { useGetEventCommandCenterQuery } from "@/redux/api/eventsApiSlice";
import { formatDate } from "@/utils/formatDate";
import { getStringParam } from "@/utils/routeParams";

const tabs = ["Overview", "Scans", "Capacity", "Issues"] as const;

const getArray = (value: unknown) => (Array.isArray(value) ? value : []);
const getNumber = (value: unknown) => Number(value || 0);

function formatPercent(value: unknown) {
  return `${Math.round(getNumber(value) * 100) / 100}%`;
}

function formatMoney(value: unknown, currency?: string | null) {
  const amount = getNumber(value).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${currency || "USD"} ${amount}`.trim();
}

export default function EventCommandCenterScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const eventId = getStringParam(id);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");

  const { data, isFetching, isLoading, refetch } = useGetEventCommandCenterQuery(
    eventId,
    {
      skip: !eventId,
      pollingInterval: 15000,
    }
  );

  const body = data?.body || {};
  const event = body.event || {};
  const metrics = body.metrics || {};
  const alerts = getArray(body.alerts);
  const sessions = getArray(body.sessionStats);
  const tickets = getArray(body.ticketStats);
  const scans = getArray(body.recentScans);
  const blockedAttempts = getArray(body.recentBlockedAttempts);
  const issues = getArray(body.attendeeIssues);
  const checkInRate = getNumber(metrics.checkInRate);
  const capacityRate = getNumber(metrics.capacityUsedRate);

  const stats = useMemo(
    () => [
      {
        label: "Checked in",
        value: `${getNumber(metrics.checkedInCount)}/${getNumber(metrics.totalBookings)}`,
      },
      { label: "Outside", value: getNumber(metrics.remainingToCheckIn) },
      { label: "Duplicates", value: getNumber(metrics.duplicateOverrides) },
      { label: "Blocked", value: getNumber(metrics.blockedAttempts) },
    ],
    [metrics]
  );

  return (
    <ProfileFoundationScreen
      isLoading={isLoading}
      title="Command Center"
      subtitle={event.title || "Event-day operations"}
      stats={stats}
    >
      <View className="flex-row flex-wrap gap-2 mb-4">
        <TouchableOpacity
          className="bg-primary rounded-xl px-4 py-3 flex-row items-center"
          onPress={() => router.push(`/profile/events/${eventId}/check-in` as any)}
        >
          <QrCode color="#020817" size={17} />
          <Text className="text-background font-bold ml-2">Scanner</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 flex-row items-center"
          onPress={() => router.push(`/profile/events/${eventId}/participants` as any)}
        >
          <Users color="#E5E7EB" size={17} />
          <Text className="text-white font-semibold ml-2">Participants</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 flex-row items-center"
          onPress={() => refetch()}
        >
          {isFetching ? (
            <ActivityIndicator color="#9EDD45" size="small" />
          ) : (
            <RefreshCw color="#E5E7EB" size={17} />
          )}
          <Text className="text-white font-semibold ml-2">Refresh</Text>
        </TouchableOpacity>
      </View>

      <Section>
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-primary text-xs font-bold tracking-widest uppercase">
              Live status
            </Text>
            <Text className="text-white text-2xl font-semibold mt-1">
              {body.timing?.label || "Loading"}
            </Text>
            <Text className="text-gray-400 mt-2">
              {body.scannerHealth?.label || "Scanner waiting"}
            </Text>
          </View>
          <View className="w-12 h-12 rounded-2xl bg-primary/20 items-center justify-center">
            <Radar color="#9EDD45" size={24} />
          </View>
        </View>
        <ProgressBar label="Arrivals" value={checkInRate} color="#9EDD45" />
        <ProgressBar label="Capacity" value={capacityRate} color="#8B6BFF" />
        <View className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-3 mt-4">
          <View className="flex-row items-center">
            <Wifi color="#8B6BFF" size={18} />
            <Text className="text-white font-semibold ml-2">Scanner health</Text>
          </View>
          <Text className="text-gray-400 mt-2">
            Last scan: {body.scannerHealth?.lastScanAt ? formatDate(body.scannerHealth.lastScanAt) : "No scans yet"}
          </Text>
          <Text className="text-gray-500 mt-1">
            {body.scannerHealth?.minutesSinceLastScan == null
              ? "Waiting for first check-in."
              : `${body.scannerHealth.minutesSinceLastScan} minutes since last scan.`}
          </Text>
        </View>
      </Section>

      <View className="flex-row flex-wrap gap-2 mb-4">
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            className={`rounded-full px-4 py-2 border ${
              activeTab === tab ? "bg-primary border-primary" : "bg-[#111823] border-[#243044]"
            }`}
            onPress={() => setActiveTab(tab)}
          >
            <Text className={activeTab === tab ? "text-background font-bold" : "text-gray-300 font-semibold"}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "Overview" ? (
        <>
          <MetricGrid
            currency={event.currency}
            metrics={metrics}
          />
          <Section title="Operations alerts">
            {alerts.length ? (
              alerts.map((alert: any) => (
                <AlertCard key={alert.id || alert.title} alert={alert} />
              ))
            ) : (
              <EmptyState text="No alerts are active right now." />
            )}
          </Section>
        </>
      ) : null}

      {activeTab === "Scans" ? (
        <Section title="Recent scanner activity">
          {scans.length ? (
            scans.map((scan: any) => <ScanRow key={scan.id} scan={scan} />)
          ) : (
            <EmptyState text="Recent check-ins and duplicate overrides will appear here." />
          )}
          {blockedAttempts.length ? (
            <View className="mt-2 border-t border-[#243044] pt-4">
              <Text className="text-white text-lg font-semibold mb-3">Blocked attempts</Text>
              {blockedAttempts.map((attempt: any) => (
                <BlockedAttemptRow key={attempt.id} attempt={attempt} />
              ))}
            </View>
          ) : null}
        </Section>
      ) : null}

      {activeTab === "Capacity" ? (
        <>
          <Section title="Session run sheet">
            {sessions.length ? (
              sessions.map((session: any) => (
                <ProgressItem
                  key={session.session?.id}
                  title={session.session?.name || "Session"}
                  subtitle={`${session.checkedIn || 0}/${session.booked || 0} checked in`}
                  value={session.checkInRate || 0}
                  color="#9EDD45"
                />
              ))
            ) : (
              <EmptyState text="Session status appears here after sessions are added." />
            )}
          </Section>
          <Section title="Ticket capacity">
            {tickets.length ? (
              tickets.map((ticket: any) => (
                <ProgressItem
                  key={ticket.ticket?.id}
                  title={ticket.ticket?.name || "Ticket"}
                  subtitle={`${ticket.booked || 0} booked - ${ticket.remainingCapacity ?? "Open"} remaining`}
                  value={ticket.capacityUsedRate || 0}
                  color="#8B6BFF"
                />
              ))
            ) : (
              <EmptyState text="Ticket capacity appears here after ticket types are added." />
            )}
          </Section>
        </>
      ) : null}

      {activeTab === "Issues" ? (
        <Section title="Attendee issue notes">
          {issues.length ? (
            issues.map((issue: any) => (
              <View key={issue.id} className="border-b border-[#243044] pb-4 mb-4">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-white font-semibold">
                      {issue.attendee_name || issue.attendee_email || "Attendee"}
                    </Text>
                    <Text className="text-gray-500 mt-1">
                      {issue.attendee_email || "No email"} - {formatDate(issue.created_at)}
                    </Text>
                  </View>
                  {issue.pinned ? (
                    <View className="bg-primary/20 rounded-full px-3 py-1">
                      <Text className="text-primary text-xs font-bold">PINNED</Text>
                    </View>
                  ) : null}
                </View>
                <Text className="text-gray-300 mt-3 leading-6">{issue.note}</Text>
              </View>
            ))
          ) : (
            <EmptyState text="Attendee support notes will appear here when your team records them." />
          )}
        </Section>
      ) : null}
    </ProfileFoundationScreen>
  );
}

function MetricGrid({
  currency,
  metrics,
}: {
  currency?: string | null;
  metrics: Record<string, unknown>;
}) {
  const items = [
    {
      icon: <CheckCircle2 color="#9EDD45" size={21} />,
      label: "Arrival rate",
      value: formatPercent(metrics.checkInRate),
    },
    {
      icon: <ShieldAlert color="#F87171" size={21} />,
      label: "Duplicate risk",
      value: getNumber(metrics.duplicateOverrides),
    },
    {
      icon: <AlertTriangle color="#F59E0B" size={21} />,
      label: "Blocked",
      value: getNumber(metrics.blockedAttempts),
    },
    {
      icon: <Ticket color="#8B6BFF" size={21} />,
      label: "Capacity used",
      value: metrics.capacity ? formatPercent(metrics.capacityUsedRate) : "Open",
    },
    {
      icon: <Activity color="#9EDD45" size={21} />,
      label: "Revenue",
      value: formatMoney(metrics.revenue, currency),
    },
  ];

  return (
    <View className="flex-row flex-wrap gap-3 mb-4">
      {items.map((item) => (
        <View key={item.label} className="bg-[#111823] border border-[#243044] rounded-2xl p-4 flex-1 min-w-[45%]">
          <View className="w-10 h-10 rounded-xl bg-[#1A2432] items-center justify-center">
            {item.icon}
          </View>
          <Text className="text-white text-2xl font-semibold mt-5">{item.value}</Text>
          <Text className="text-gray-400 mt-1">{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

function Section({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <View className="bg-[#111823] border border-[#243044] rounded-2xl p-4 mb-4">
      {!!title && <Text className="text-white text-xl font-semibold mb-3">{title}</Text>}
      {children}
    </View>
  );
}

function ProgressBar({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <View className="mt-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-white font-semibold">{label}</Text>
        <Text className="text-gray-400">{formatPercent(value)}</Text>
      </View>
      <View className="bg-[#1A2432] h-3 rounded-full mt-2 overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }}
        />
      </View>
    </View>
  );
}

function AlertCard({ alert }: { alert: any }) {
  const color =
    alert.severity === "CRITICAL"
      ? "#F87171"
      : alert.severity === "WARNING"
        ? "#F59E0B"
        : alert.severity === "SUCCESS"
          ? "#9EDD45"
          : "#8B6BFF";

  return (
    <View className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-4 mb-3">
      <View className="flex-row items-start">
        <AlertTriangle color={color} size={21} />
        <View className="ml-3 flex-1">
          <Text className="text-white font-semibold">{alert.title}</Text>
          <Text className="text-gray-400 mt-1 leading-6">{alert.message}</Text>
          {!!alert.action && (
            <Text className="text-primary font-semibold mt-2">{alert.action}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

function ScanRow({ scan }: { scan: any }) {
  const booking = scan.booking || {};
  return (
    <View className="border-b border-[#243044] pb-4 mb-4">
      <View className="flex-row items-start">
        <View className={`w-11 h-11 rounded-xl items-center justify-center ${scan.duplicate ? "bg-red-500/20" : "bg-primary/20"}`}>
          <QrCode color={scan.duplicate ? "#F87171" : "#9EDD45"} size={20} />
        </View>
        <View className="ml-3 flex-1">
          <View className="flex-row items-start justify-between">
            <Text className="text-white font-semibold flex-1 pr-2">
              {booking.fullname || booking.email || "Guest attendee"}
            </Text>
            <View className={scan.duplicate ? "bg-red-500/20 rounded-full px-3 py-1" : "bg-primary/20 rounded-full px-3 py-1"}>
              <Text className={scan.duplicate ? "text-red-300 text-xs font-bold" : "text-primary text-xs font-bold"}>
                {scan.duplicate ? "OVERRIDE" : "VERIFIED"}
              </Text>
            </View>
          </View>
          <Text className="text-gray-400 mt-2">
            {booking.code || "No code"} - {booking.ticket?.name || "Ticket"}
          </Text>
          <Text className="text-gray-500 mt-1">
            {booking.session?.name || "Session"} - {scan.method || "QR"} - {formatDate(scan.checked_in_at)}
          </Text>
          {scan.duplicate && (scan.override_reason || scan.notes) ? (
            <Text className="text-amber-200 mt-1 leading-5">
              Manager note: {scan.override_reason || scan.notes}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function BlockedAttemptRow({ attempt }: { attempt: any }) {
  const booking = attempt.booking || {};
  return (
    <View className="border-b border-[#243044] pb-4 mb-4">
      <View className="flex-row items-start">
        <View className="w-11 h-11 rounded-xl bg-amber-500/20 items-center justify-center">
          <AlertTriangle color="#F59E0B" size={20} />
        </View>
        <View className="ml-3 flex-1">
          <View className="flex-row items-start justify-between">
            <Text className="text-white font-semibold flex-1 pr-2">
              {booking.fullname || booking.email || "Unknown attendee"}
            </Text>
            <View className="bg-amber-500/20 rounded-full px-3 py-1">
              <Text className="text-amber-300 text-xs font-bold">
                {attempt.status || "BLOCKED"}
              </Text>
            </View>
          </View>
          <Text className="text-gray-400 mt-2">
            {booking.code || "No code"} - {attempt.reason_code || "POLICY"}
          </Text>
          <Text className="text-gray-500 mt-1 leading-5">
            {attempt.reason_message || "This scan was blocked by event check-in policy."}
          </Text>
          <Text className="text-gray-500 mt-1">
            {attempt.method || "UNKNOWN"} - {formatDate(attempt.created_at)}
          </Text>
          <Text className="text-amber-300 mt-1">
            Override {attempt.override_requested ? "requested" : "not requested"}
          </Text>
        </View>
      </View>
    </View>
  );
}

function ProgressItem({
  color,
  subtitle,
  title,
  value,
}: {
  color: string;
  subtitle: string;
  title: string;
  value: number;
}) {
  return (
    <View className="border-b border-[#243044] pb-4 mb-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-white font-semibold">{title}</Text>
          <Text className="text-gray-400 mt-1">{subtitle}</Text>
        </View>
        <Text className="text-gray-300 font-semibold">{formatPercent(value)}</Text>
      </View>
      <View className="bg-[#1A2432] h-3 rounded-full mt-3 overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }}
        />
      </View>
    </View>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <View className="py-8 items-center">
      <ClipboardList color="#8B6BFF" size={34} />
      <Text className="text-gray-400 text-center mt-3 leading-6">{text}</Text>
    </View>
  );
}
