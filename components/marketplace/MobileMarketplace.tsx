import React, { ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Globe2,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Ticket,
  Users,
} from "lucide-react-native";

import type {
  MarketplaceCitySummary,
  MarketplaceCountrySummary,
  MarketplaceEvent,
  MarketplacePlanner,
} from "@/redux/api/publicMarketplaceApiSlice";

export const palette = {
  background: "#020E1E",
  surface: "#111823",
  mutedSurface: "#1A2432",
  border: "#243044",
  text: "#FFFFFF",
  mutedText: "#9CA3AF",
  dimText: "#6B7280",
  primary: "#9EDD45",
  warning: "#FBBF24",
};

const DEFAULT_EVENT_IMAGE =
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30";
const DEFAULT_PLANNER_IMAGE =
  "https://images.unsplash.com/photo-1519741497674-611481863552";
const DEFAULT_AVATAR =
  "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

export function numberLabel(value?: number | string | null) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return "0";
  if (numeric >= 1000) return `${(numeric / 1000).toFixed(1)}k`;
  return String(numeric);
}

export function safeDecode(value?: string | string[]) {
  const first = Array.isArray(value) ? value[0] : value;
  if (!first) return "";
  try {
    return decodeURIComponent(first);
  } catch {
    return first;
  }
}

export function plannerDisplayName(planner: MarketplacePlanner) {
  const profile = planner.user?.profile;
  return (
    planner.business_name ||
    profile?.name ||
    `${profile?.firstname || ""} ${profile?.lastname || ""}`.trim() ||
    planner.user?.username ||
    "Event planner"
  );
}

export function plannerDetailId(planner: MarketplacePlanner) {
  return (
    planner.user?.profile?.user_id ??
    planner.user?.id ??
    planner.user_id ??
    planner.id
  );
}

export function plannerImage(planner: MarketplacePlanner) {
  return (
    planner.profile_image ||
    planner.user?.profile?.image_url ||
    planner.cover_image ||
    DEFAULT_AVATAR
  );
}

export function plannerCover(planner: MarketplacePlanner) {
  return planner.cover_image || planner.profile_image || DEFAULT_PLANNER_IMAGE;
}

export function eventImage(event: MarketplaceEvent) {
  return event.images?.[0] || DEFAULT_EVENT_IMAGE;
}

export function formatDate(value?: string | null) {
  if (!value) return "Date TBA";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date TBA";
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function cleanText(value?: string | null) {
  return (value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function formatPrice(event: MarketplaceEvent) {
  if (event.is_free) return "Free";

  const amount = event.startingPrice ?? event.price;
  const numeric = typeof amount === "number" ? amount : Number(amount ?? 0);

  if (!Number.isFinite(numeric) || numeric <= 0) return "Paid";

  if (event.currency) {
    try {
      return new Intl.NumberFormat("en-US", {
        currency: event.currency,
        maximumFractionDigits: 0,
        style: "currency",
      }).format(numeric);
    } catch {
      return `${event.currency} ${numeric.toLocaleString()}`;
    }
  }

  return numeric.toLocaleString();
}

export function MarketplaceHeader({
  eyebrow,
  title,
  subtitle,
  onBack,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  onBack: () => void;
  right?: ReactNode;
}) {
  return (
    <View className="px-4 pt-12 pb-4 border-b border-[#142033]">
      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          className="h-11 w-11 rounded-full bg-[#1A2432] items-center justify-center"
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft color={palette.text} size={22} />
        </TouchableOpacity>

        {right || <View className="w-11" />}
      </View>

      {eyebrow ? (
        <Text className="text-primary text-xs font-bold mt-6 uppercase">
          {eyebrow}
        </Text>
      ) : null}
      <Text className="text-white text-3xl font-bold mt-2" numberOfLines={2}>
        {title}
      </Text>
      {subtitle ? (
        <Text className="text-gray-400 mt-2 leading-6">{subtitle}</Text>
      ) : null}
    </View>
  );
}

export function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <View className="flex-1 bg-[#111823] border border-[#243044] rounded-2xl p-3">
      <View className="h-9 w-9 rounded-full bg-[#1A2432] items-center justify-center mb-3">
        {icon}
      </View>
      <Text className="text-white text-xl font-bold" numberOfLines={1}>
        {numberLabel(value)}
      </Text>
      <Text className="text-gray-500 text-xs mt-1" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function SearchBox({
  value,
  onChangeText,
  onSubmit,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit?: () => void;
  placeholder: string;
}) {
  return (
    <View className="bg-[#1A2432] border border-[#2A3647] rounded-xl px-3 flex-row items-center">
      <Search color={palette.dimText} size={18} />
      <TextInput
        className="flex-1 text-white py-3 ml-2"
        placeholder={placeholder}
        placeholderTextColor="#728097"
        returnKeyType="search"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
      />
    </View>
  );
}

export function SegmentedTabs<T extends string>({
  active,
  tabs,
  onChange,
}: {
  active: T;
  tabs: Array<{ label: string; value: T; count?: number }>;
  onChange: (value: T) => void;
}) {
  return (
    <View className="bg-[#111823] border border-[#243044] rounded-2xl p-1 flex-row">
      {tabs.map((tab) => {
        const selected = active === tab.value;
        return (
          <TouchableOpacity
            key={tab.value}
            className={`flex-1 rounded-xl py-3 items-center ${
              selected ? "bg-primary" : ""
            }`}
            onPress={() => onChange(tab.value)}
          >
            <Text
              className={`font-bold ${selected ? "text-background" : "text-gray-300"}`}
              numberOfLines={1}
            >
              {tab.label}
              {typeof tab.count === "number" ? ` ${numberLabel(tab.count)}` : ""}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className={`rounded-full px-4 py-2 mr-2 border ${
        active ? "bg-primary border-primary" : "bg-[#1A2432] border-[#2A3647]"
      }`}
      onPress={onPress}
    >
      <Text
        className={active ? "text-background font-bold" : "text-white font-semibold"}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function EmptyState({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon?: ReactNode;
}) {
  return (
    <View className="bg-[#111823] border border-[#243044] rounded-2xl p-8 items-center">
      <View className="h-14 w-14 rounded-full bg-[#1A2432] items-center justify-center">
        {icon || <Sparkles color={palette.primary} size={26} />}
      </View>
      <Text className="text-white text-lg font-bold mt-4 text-center">
        {title}
      </Text>
      <Text className="text-gray-400 text-center mt-2 leading-5">
        {subtitle}
      </Text>
    </View>
  );
}

export function LoadingState({ label = "Loading marketplace" }: { label?: string }) {
  return (
    <View className="py-8 items-center">
      <ActivityIndicator color={palette.primary} />
      <Text className="text-gray-400 mt-3">{label}</Text>
    </View>
  );
}

export function PaginationControls({
  page,
  totalPages,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between mt-5">
      <TouchableOpacity
        className="bg-[#1A2432] rounded-xl px-4 py-3 flex-row items-center"
        disabled={page <= 1}
        onPress={onPrevious}
      >
        <ChevronLeft color={page <= 1 ? palette.dimText : palette.text} size={17} />
        <Text className={page <= 1 ? "text-gray-600 ml-1" : "text-white ml-1"}>
          Previous
        </Text>
      </TouchableOpacity>
      <Text className="text-gray-400">
        Page {page} of {Math.max(1, totalPages)}
      </Text>
      <TouchableOpacity
        className="bg-[#1A2432] rounded-xl px-4 py-3 flex-row items-center"
        disabled={page >= totalPages}
        onPress={onNext}
      >
        <Text className={page >= totalPages ? "text-gray-600 mr-1" : "text-white mr-1"}>
          Next
        </Text>
        <ChevronRight
          color={page >= totalPages ? palette.dimText : palette.text}
          size={17}
        />
      </TouchableOpacity>
    </View>
  );
}

export function CountryCard({
  country,
  onPress,
}: {
  country: MarketplaceCountrySummary;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className="bg-[#111823] border border-[#243044] rounded-2xl p-4 mb-4"
      onPress={onPress}
      accessibilityRole="button"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-row flex-1">
          <View className="h-12 w-12 rounded-2xl bg-[#1A2432] items-center justify-center mr-3">
            <Globe2 color={palette.primary} size={22} />
          </View>
          <View className="flex-1">
            <Text className="text-white text-lg font-bold" numberOfLines={1}>
              {country.country}
            </Text>
            <Text className="text-gray-500 mt-1">{country.countryCode}</Text>
          </View>
        </View>
        <View className="h-10 w-10 rounded-full bg-[#1A2432] items-center justify-center">
          <ArrowRight color={palette.primary} size={18} />
        </View>
      </View>

      <View className="flex-row flex-wrap mt-4">
        <Text className="text-gray-300 mr-4 mb-2">
          {numberLabel(country.totalCities)} cities
        </Text>
        <Text className="text-gray-300 mr-4 mb-2">
          {numberLabel(country.plannersCount)} planners
        </Text>
        <Text className="text-gray-300 mb-2">
          {numberLabel(country.eventsCount)} events
        </Text>
      </View>

      {!!country.topCities?.length && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-2"
        >
          {country.topCities.slice(0, 5).map((city) => (
            <View
              key={`${city.countryCode}-${city.city}`}
              className="bg-[#1A2432] rounded-full px-3 py-2 mr-2 flex-row items-center"
            >
              <MapPin color={palette.primary} size={13} />
              <Text className="text-gray-200 text-xs ml-1" numberOfLines={1}>
                {city.city}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </TouchableOpacity>
  );
}

export function CityCard({
  city,
  onPress,
}: {
  city: MarketplaceCitySummary;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className="bg-[#111823] border border-[#243044] rounded-2xl p-4 mb-4"
      onPress={onPress}
      accessibilityRole="button"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-row flex-1">
          <View className="h-12 w-12 rounded-2xl bg-[#1A2432] items-center justify-center mr-3">
            <MapPin color={palette.primary} size={22} />
          </View>
          <View className="flex-1">
            <Text className="text-white text-lg font-bold" numberOfLines={1}>
              {city.city}
            </Text>
            <Text className="text-gray-500 mt-1" numberOfLines={1}>
              {city.country}
            </Text>
          </View>
        </View>
        <View className="h-10 w-10 rounded-full bg-[#1A2432] items-center justify-center">
          <ArrowRight color={palette.primary} size={18} />
        </View>
      </View>

      <View className="flex-row mt-4">
        <View className="flex-1 flex-row items-center">
          <Building2 color={palette.primary} size={16} />
          <Text className="text-gray-300 ml-2">
            {numberLabel(city.plannersCount)} planners
          </Text>
        </View>
        <View className="flex-1 flex-row items-center">
          <CalendarDays color={palette.primary} size={16} />
          <Text className="text-gray-300 ml-2">
            {numberLabel(city.eventsCount)} events
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function PlannerCard({
  planner,
  onPress,
}: {
  planner: MarketplacePlanner;
  onPress: () => void;
}) {
  const name = plannerDisplayName(planner);
  const specialty =
    planner.category?.name || planner.specialties?.[0] || "Event planner";
  const rating = Number(planner.rating || 0);

  return (
    <TouchableOpacity
      className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden mb-4"
      onPress={onPress}
      accessibilityRole="button"
    >
      <Image
        source={{ uri: plannerCover(planner) }}
        className="w-full h-32 bg-[#1A2432]"
        resizeMode="cover"
      />
      <View className="p-4">
        <View className="flex-row">
          <Image
            source={{ uri: plannerImage(planner) }}
            className="h-14 w-14 rounded-2xl border-2 border-[#243044] bg-[#1A2432] mr-3"
            resizeMode="cover"
          />
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-white text-lg font-bold flex-1" numberOfLines={1}>
                {name}
              </Text>
              {planner.verified ? (
                <ShieldCheck color="#34D399" size={18} />
              ) : null}
            </View>
            <Text className="text-primary font-semibold mt-1" numberOfLines={1}>
              {specialty}
            </Text>
            <View className="flex-row items-center mt-2">
              <Star color={palette.warning} fill={palette.warning} size={15} />
              <Text className="text-gray-300 ml-1">
                {rating > 0 ? rating.toFixed(1) : "New"}
              </Text>
              <Text className="text-gray-500 ml-2">
                {numberLabel(planner.total_reviews)} reviews
              </Text>
            </View>
          </View>
        </View>

        {planner.bio ? (
          <Text className="text-gray-400 mt-3 leading-5" numberOfLines={2}>
            {planner.bio}
          </Text>
        ) : null}

        <View className="flex-row items-center justify-between mt-4">
          <View className="flex-row items-center flex-1">
            <MapPin color={palette.dimText} size={15} />
            <Text className="text-gray-400 ml-1 flex-1" numberOfLines={1}>
              {[planner.city, planner.country?.name].filter(Boolean).join(", ") ||
                "Marketplace location"}
            </Text>
          </View>
          <View className="bg-[#1A2432] rounded-full px-3 py-2 flex-row items-center ml-3">
            <Briefcase color={palette.primary} size={14} />
            <Text className="text-primary text-xs font-bold ml-1">
              {numberLabel(planner.servicesCount)} services
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function EventCard({
  event,
  onPress,
}: {
  event: MarketplaceEvent;
  onPress: () => void;
}) {
  const date = formatDate(event.primarySession?.date || event.start_date);
  const description = cleanText(event.description);

  return (
    <TouchableOpacity
      className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden mb-4"
      onPress={onPress}
      accessibilityRole="button"
    >
      <Image
        source={{ uri: eventImage(event) }}
        className="w-full h-40 bg-[#1A2432]"
        resizeMode="cover"
      />
      <View className="p-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-primary text-xs font-bold" numberOfLines={1}>
              {event.category?.name || "Event"}
            </Text>
            <Text className="text-white text-lg font-bold mt-1" numberOfLines={2}>
              {event.title}
            </Text>
          </View>
          <View className="bg-[#1A2432] rounded-full px-3 py-2">
            <Text className="text-primary font-bold">{formatPrice(event)}</Text>
          </View>
        </View>

        {description ? (
          <Text className="text-gray-400 mt-3 leading-5" numberOfLines={2}>
            {description}
          </Text>
        ) : null}

        <View className="flex-row flex-wrap mt-4">
          <View className="flex-row items-center mr-4 mb-2">
            <CalendarDays color={palette.dimText} size={15} />
            <Text className="text-gray-400 ml-1">{date}</Text>
          </View>
          {event.city ? (
            <View className="flex-row items-center mr-4 mb-2">
              <MapPin color={palette.dimText} size={15} />
              <Text className="text-gray-400 ml-1">{event.city}</Text>
            </View>
          ) : null}
          <View className="flex-row items-center mb-2">
            <Users color={palette.dimText} size={15} />
            <Text className="text-gray-400 ml-1">
              {numberLabel(event.interestedCount)} interested
            </Text>
          </View>
        </View>

        <View className="flex-row items-center mt-2">
          <Ticket color={palette.primary} size={16} />
          <Text className="text-primary font-bold ml-2">View details</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
