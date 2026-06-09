import React, { useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Activity, Building2, CalendarDays, MapPin } from "lucide-react-native";

import {
  CityCard,
  EmptyState,
  LoadingState,
  MarketplaceHeader,
  PaginationControls,
  SearchBox,
  StatCard,
  palette,
  safeDecode,
} from "@/components/marketplace/MobileMarketplace";
import {
  MarketplaceCitySummary,
  useGetMarketplaceCountryDetailQuery,
} from "@/redux/api/publicMarketplaceApiSlice";

function cityRoute(city: MarketplaceCitySummary) {
  return `/marketplace/${encodeURIComponent(city.countryCode)}/${encodeURIComponent(
    city.city
  )}`;
}

export default function MarketplaceCountryScreen() {
  const router = useRouter();
  const { countryCode } = useLocalSearchParams<{ countryCode: string }>();
  const safeCountryCode = safeDecode(countryCode).toUpperCase();
  const [page, setPage] = useState(1);
  const [citySearch, setCitySearch] = useState("");

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetMarketplaceCountryDetailQuery({
    countryCode: safeCountryCode,
    params: {
      citySearch: citySearch.trim() || undefined,
      page,
      size: 18,
    },
  });

  const summary = data?.body?.summary;
  const cities = data?.body?.cities?.result ?? [];
  const totalPages = Math.max(1, Number(data?.body?.cities?.totalPages || 1));

  return (
    <View className="flex-1 bg-background">
      <MarketplaceHeader
        eyebrow="Country Marketplace"
        title={summary ? `Explore ${summary.country}` : safeCountryCode}
        subtitle={
          summary
            ? `Browse active GatherPlux cities across ${summary.country}.`
            : "Browse active cities, planners, and public events."
        }
        onBack={() => router.back()}
      />

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={palette.primary}
          />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <LoadingState label="Loading country marketplace" />
        ) : isError || !summary ? (
          <EmptyState
            title="Country unavailable"
            subtitle="We could not load this country marketplace right now."
          />
        ) : (
          <>
            <View className="flex-row gap-3">
              <StatCard
                label="Cities"
                value={summary.totalCities}
                icon={<MapPin color={palette.primary} size={18} />}
              />
              <StatCard
                label="Planners"
                value={summary.plannersCount}
                icon={<Building2 color={palette.primary} size={18} />}
              />
            </View>
            <View className="flex-row gap-3 mt-3">
              <StatCard
                label="Events"
                value={summary.eventsCount}
                icon={<CalendarDays color={palette.primary} size={18} />}
              />
              <StatCard
                label="Activity"
                value={summary.activityScore}
                icon={<Activity color={palette.primary} size={18} />}
              />
            </View>

            {!!summary.currency || !!summary.currency_symbol ? (
              <View className="bg-[#111823] border border-[#243044] rounded-2xl p-4 mt-4">
                <Text className="text-gray-500 text-xs uppercase font-bold">
                  Local Currency
                </Text>
                <Text className="text-white text-lg font-bold mt-1">
                  {[summary.currency_symbol, summary.currency].filter(Boolean).join(" ")}
                </Text>
              </View>
            ) : null}

            {!!summary.topCities?.length && (
              <View className="mt-7">
                <Text className="text-white text-xl font-bold">Top cities</Text>
                <Text className="text-gray-400 mt-1">
                  Highest activity city pages in {summary.country}.
                </Text>
                <View className="mt-4">
                  {summary.topCities.slice(0, 6).map((city) => (
                    <CityCard
                      key={`${city.countryCode}-${city.city}`}
                      city={city}
                      onPress={() => router.push(cityRoute(city) as any)}
                    />
                  ))}
                </View>
              </View>
            )}

            <View className="mt-5">
              <Text className="text-white text-xl font-bold">All cities</Text>
              <Text className="text-gray-400 mt-1 mb-4">
                Search and open city pages for local planners and events.
              </Text>
              <SearchBox
                value={citySearch}
                onChangeText={(value) => {
                  setCitySearch(value);
                  setPage(1);
                }}
                placeholder={`Search cities in ${summary.country}`}
              />
            </View>

            <View className="mt-4">
              {isFetching ? (
                <LoadingState label="Loading cities" />
              ) : cities.length ? (
                <>
                  {cities.map((city) => (
                    <CityCard
                      key={`${city.countryCode}-${city.city}`}
                      city={city}
                      onPress={() => router.push(cityRoute(city) as any)}
                    />
                  ))}
                  <PaginationControls
                    page={page}
                    totalPages={totalPages}
                    onPrevious={() => setPage((current) => Math.max(1, current - 1))}
                    onNext={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                  />
                </>
              ) : (
                <EmptyState
                  title="No cities found"
                  subtitle="Try another city name or clear your search."
                />
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
