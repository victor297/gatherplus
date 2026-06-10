import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { BadgeCheck, Crown, Music2, Plane, Ticket } from "lucide-react-native";

export type TicketDesignKey =
  | "boarding_pass"
  | "classic_ticket"
  | "minimal"
  | "festival"
  | "vip_badge";

export type TicketDesignConfig = Record<string, unknown>;

export const DEFAULT_TICKET_DESIGN_KEY: TicketDesignKey = "boarding_pass";

export const TICKET_DESIGN_OPTIONS: Array<{
  description: string;
  icon: React.ComponentType<{ color?: string; size?: number }>;
  key: TicketDesignKey;
  label: string;
}> = [
  {
    description: "Clean event pass with QR focus.",
    icon: Plane,
    key: "boarding_pass",
    label: "Boarding pass",
  },
  {
    description: "Simple paper ticket feel.",
    icon: Ticket,
    key: "classic_ticket",
    label: "Classic ticket",
  },
  {
    description: "Quiet, professional, compact.",
    icon: BadgeCheck,
    key: "minimal",
    label: "Minimal",
  },
  {
    description: "High-energy music and culture style.",
    icon: Music2,
    key: "festival",
    label: "Festival",
  },
  {
    description: "Premium badge for VIP access.",
    icon: Crown,
    key: "vip_badge",
    label: "VIP badge",
  },
];

const VALID_TICKET_DESIGNS = new Set<TicketDesignKey>(
  TICKET_DESIGN_OPTIONS.map((option) => option.key)
);

const parseObject = (value: unknown): Record<string, unknown> => {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }

  return typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
};

export const normalizeTicketDesignKey = (value: unknown): TicketDesignKey => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_") as TicketDesignKey;

  return VALID_TICKET_DESIGNS.has(normalized)
    ? normalized
    : DEFAULT_TICKET_DESIGN_KEY;
};

export const normalizeTicketDesignConfig = (
  value: unknown
): TicketDesignConfig => parseObject(value);

export const getTicketDesignLabel = (value: unknown) => {
  const key = normalizeTicketDesignKey(value);
  return TICKET_DESIGN_OPTIONS.find((option) => option.key === key)?.label || "Boarding pass";
};

export const getTicketDesignFromBooking = (booking: Record<string, any> = {}) => {
  const snapshot = parseObject(booking.ticket_design_snapshot);
  const ticket = parseObject(booking.ticket);
  const snapshotDesign = parseObject(snapshot.design);
  const snapshotConfig =
    snapshot.config ||
    snapshot.ticket_design_config ||
    snapshotDesign.config ||
    booking.ticket_design_config ||
    ticket.ticket_design_config;

  return {
    designConfig: normalizeTicketDesignConfig(snapshotConfig),
    designKey: normalizeTicketDesignKey(
      snapshot.key ||
        snapshot.designKey ||
        snapshot.ticket_design_key ||
        snapshotDesign.key ||
        booking.ticket_design_key ||
        ticket.ticket_design_key
    ),
  };
};

type SelectorProps = {
  onChange: (key: TicketDesignKey) => void;
  value?: unknown;
};

export function TicketDesignSelector({ onChange, value }: SelectorProps) {
  const selected = normalizeTicketDesignKey(value);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.selectorTrack}
    >
      {TICKET_DESIGN_OPTIONS.map((option) => {
        const active = selected === option.key;
        const Icon = option.icon;

        return (
          <TouchableOpacity
            key={option.key}
            activeOpacity={0.85}
            onPress={() => onChange(option.key)}
            style={[styles.selectorCard, active && styles.selectorCardActive]}
          >
            <View style={[styles.selectorIcon, active && styles.selectorIconActive]}>
              <Icon color={active ? "#020817" : "#9EDD45"} size={18} />
            </View>
            <Text
              numberOfLines={1}
              style={[styles.selectorLabel, active && styles.selectorLabelActive]}
            >
              {option.label}
            </Text>
            <Text
              numberOfLines={2}
              style={[
                styles.selectorDescription,
                active && styles.selectorDescriptionActive,
              ]}
            >
              {option.description}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

type PassProps = {
  attendeeName?: string;
  bookingCode?: string;
  dateLabel?: string;
  designConfig?: TicketDesignConfig;
  designKey?: unknown;
  eventTitle?: string;
  locationLabel?: string;
  priceLabel?: string;
  sessionLabel?: string;
  statusLabel?: string;
  ticketName?: string;
  timeLabel?: string;
};

const text = (value: unknown, fallback: string) =>
  String(value || "").trim() || fallback;

const colorFromConfig = (
  config: TicketDesignConfig | undefined,
  keys: string[],
  fallback: string
) => {
  for (const key of keys) {
    const value = config?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
};

const themeFor = (
  key: TicketDesignKey,
  config: TicketDesignConfig | undefined
) => {
  const base = {
    accent: "#9EDD45",
    background: "#FFFFFF",
    border: "#D8E1EE",
    codeBackground: "#F7FAFC",
    codeForeground: "#020817",
    foreground: "#020817",
    muted: "#64748B",
    panel: "#F4F7FB",
    secondary: "#5B4DFF",
  };

  const variants: Record<TicketDesignKey, typeof base> = {
    boarding_pass: base,
    classic_ticket: {
      ...base,
      accent: "#111827",
      background: "#FFFDF7",
      panel: "#F7F2E7",
      secondary: "#9EDD45",
    },
    festival: {
      ...base,
      accent: "#9EDD45",
      background: "#170A2C",
      border: "#593BB4",
      codeBackground: "#FFFFFF",
      foreground: "#FFFFFF",
      muted: "#D8C8FF",
      panel: "#251044",
      secondary: "#FF6EA8",
    },
    minimal: {
      ...base,
      accent: "#5B4DFF",
      background: "#F8FAFC",
      panel: "#FFFFFF",
      secondary: "#0F172A",
    },
    vip_badge: {
      ...base,
      accent: "#F7C948",
      background: "#060A13",
      border: "#313A4F",
      codeBackground: "#FFFFFF",
      foreground: "#FFFFFF",
      muted: "#AAB4C5",
      panel: "#111827",
      secondary: "#9EDD45",
    },
  };

  const selected = variants[key];

  return {
    ...selected,
    accent: colorFromConfig(config, ["accentColor", "accent", "primaryColor"], selected.accent),
    background: colorFromConfig(config, ["backgroundColor", "background"], selected.background),
    foreground: colorFromConfig(config, ["textColor", "foreground"], selected.foreground),
  };
};

function MetaColumn({
  label,
  value,
  theme,
}: {
  label: string;
  theme: ReturnType<typeof themeFor>;
  value: string;
}) {
  return (
    <View style={styles.metaColumn}>
      <Text style={[styles.metaLabel, { color: theme.muted }]}>{label}</Text>
      <Text numberOfLines={2} style={[styles.metaValue, { color: theme.foreground }]}>
        {value}
      </Text>
    </View>
  );
}

function Barcode({ color }: { color: string }) {
  return (
    <View style={styles.barcode}>
      {[6, 2, 4, 8, 3, 5, 2, 7, 4, 2, 6, 3].map((width, index) => (
        <View
          key={`${width}-${index}`}
          style={[styles.barcodeLine, { backgroundColor: color, width }]}
        />
      ))}
    </View>
  );
}

export function MobileTicketPass({
  attendeeName,
  bookingCode,
  dateLabel,
  designConfig,
  designKey,
  eventTitle,
  locationLabel,
  priceLabel,
  sessionLabel,
  statusLabel,
  ticketName,
  timeLabel,
}: PassProps) {
  const key = normalizeTicketDesignKey(designKey);
  const config = normalizeTicketDesignConfig(designConfig);
  const theme = themeFor(key, config);
  const code = text(bookingCode, "GTP_PASS");
  const title = text(eventTitle, "GatherPlux event");
  const attendee = text(attendeeName, "Guest attendee");
  const ticket = text(ticketName, "General admission");
  const session = text(sessionLabel, "Main session");
  const date = text(dateLabel, "Event date");
  const time = text(timeLabel, "Event time");
  const location = text(locationLabel, "Event location");
  const price = text(priceLabel, "Free");
  const status = text(statusLabel, "Booked");
  const hasBarcode = key === "classic_ticket" || key === "festival";
  const isDark = key === "festival" || key === "vip_badge";

  return (
    <View
      style={[
        styles.pass,
        {
          backgroundColor: theme.background,
          borderColor: theme.border,
        },
      ]}
    >
      {key === "boarding_pass" ? (
        <View style={[styles.sideRail, { backgroundColor: theme.accent }]} />
      ) : null}

      <View style={styles.passBody}>
        <View style={styles.passHeader}>
          <View style={styles.passHeaderLeft}>
            <Text style={[styles.eyebrow, { color: theme.secondary }]}>
              {key === "vip_badge" ? "GATHERPLUX VIP PASS" : "GATHERPLUX EVENT PASS"}
            </Text>
            <Text numberOfLines={2} style={[styles.passTitle, { color: theme.foreground }]}>
              {title}
            </Text>
            <Text numberOfLines={1} style={[styles.passSubtitle, { color: theme.muted }]}>
              {attendee} - {ticket}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: theme.panel }]}>
            <Text style={[styles.statusText, { color: isDark ? theme.accent : theme.foreground }]}>
              {status.toUpperCase()}
            </Text>
          </View>
        </View>

        {key === "festival" ? (
          <View style={styles.festivalStrip}>
            <View style={[styles.festivalBlock, { backgroundColor: theme.secondary }]} />
            <View style={[styles.festivalBlock, { backgroundColor: theme.accent }]} />
            <View style={[styles.festivalBlock, { backgroundColor: "#38BDF8" }]} />
          </View>
        ) : null}

        <View style={styles.passContent}>
          <View style={styles.passDetails}>
            <View style={styles.metaGrid}>
              <MetaColumn label="Date" theme={theme} value={date} />
              <MetaColumn label="Time" theme={theme} value={time} />
              <MetaColumn label="Session" theme={theme} value={session} />
              <MetaColumn label="Price" theme={theme} value={price} />
            </View>
            <View style={[styles.locationBox, { borderColor: theme.border }]}>
              <Text style={[styles.metaLabel, { color: theme.muted }]}>Where</Text>
              <Text numberOfLines={2} style={[styles.locationValue, { color: theme.foreground }]}>
                {location}
              </Text>
            </View>
          </View>

          <View style={[styles.codePanel, { backgroundColor: theme.codeBackground }]}>
            <QRCode
              value={code}
              size={94}
              backgroundColor={theme.codeBackground}
              color="#020817"
            />
            <Text numberOfLines={1} style={[styles.codeText, { color: theme.codeForeground }]}>
              {code}
            </Text>
          </View>
        </View>

        {hasBarcode ? <Barcode color={isDark ? theme.accent : theme.foreground} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barcode: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 3,
    height: 34,
    marginTop: 14,
    overflow: "hidden",
  },
  barcodeLine: {
    borderRadius: 4,
    height: "100%",
  },
  codePanel: {
    alignItems: "center",
    borderRadius: 14,
    justifyContent: "center",
    padding: 10,
    width: 126,
  },
  codeText: {
    fontFamily: "monospace",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.3,
    marginTop: 9,
    maxWidth: 104,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2.4,
    textTransform: "uppercase",
  },
  festivalBlock: {
    borderRadius: 999,
    flex: 1,
    height: 5,
  },
  festivalStrip: {
    flexDirection: "row",
    gap: 6,
    marginTop: 14,
  },
  locationBox: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
    paddingTop: 10,
  },
  locationValue: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 3,
  },
  metaColumn: {
    width: "50%",
    paddingBottom: 10,
    paddingRight: 10,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.7,
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
    marginTop: 3,
  },
  pass: {
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    marginVertical: 10,
    overflow: "hidden",
  },
  passBody: {
    flex: 1,
    padding: 14,
  },
  passContent: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  passDetails: {
    flex: 1,
    minWidth: 0,
  },
  passHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  passHeaderLeft: {
    flex: 1,
    minWidth: 0,
  },
  passSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  passTitle: {
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 27,
    marginTop: 11,
  },
  selectorCard: {
    backgroundColor: "#111823",
    borderColor: "#2E3A4D",
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 10,
    padding: 12,
    width: 156,
  },
  selectorCardActive: {
    backgroundColor: "#9EDD45",
    borderColor: "#9EDD45",
  },
  selectorDescription: {
    color: "#728097",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 6,
  },
  selectorDescriptionActive: {
    color: "#243044",
  },
  selectorIcon: {
    alignItems: "center",
    backgroundColor: "rgba(158,221,69,0.12)",
    borderRadius: 12,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  selectorIconActive: {
    backgroundColor: "rgba(2,8,23,0.12)",
  },
  selectorLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 10,
  },
  selectorLabelActive: {
    color: "#020817",
  },
  selectorTrack: {
    paddingRight: 6,
  },
  sideRail: {
    width: 8,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
