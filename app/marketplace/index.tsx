import React, { useMemo, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Building2, CalendarDays, Globe2, MapPin } from "lucide-react-native";

import {
  CityCard,
  CountryCard,
  EmptyState,
  LoadingState,
  MarketplaceHeader,
  PaginationControls,
  SearchBox,
  SectionHeader,
  SegmentedTabs,
  StatCard,
  palette,
} from "@/components/marketplace/MobileMarketplace";
import {
  MarketplaceCitySummary,
  useGetMarketplaceCitiesQuery,
  useGetMarketplaceCountriesQuery,
  useGetMarketplaceOverviewQuery,
} from "@/redux/api/publicMarketplaceApiSlice";

type MarketplaceTab = "countries" | "cities";

function countryRoute(countryCode: string) {
  return `/marketplace/${encodeURIComponent(countryCode)}`;
}

function cityRoute(city: MarketplaceCitySummary) {
  return `/marketplace/${encodeURIComponent(city.countryCode)}/${encodeURIComponent(
    city.city
  )}`;
}

export default function MarketplaceScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<MarketplaceTab>("countries");
  const [countryPage, setCountryPage] = useState(1);
  const [cityPage, setCityPage] = useState(1);
  const [countrySearch, setCountrySearch] = useState("");
  const [citySearch, setCitySearch] = useState("");

  const {
    data: overviewData,
    isLoading: overviewLoading,
    isFetching: overviewFetching,
    refetch: refetchOverview,
  } = useGetMarketplaceOverviewQuery({
    limitCities: 8,
    limitCountries: 4,
  });

  const {
    data: countriesData,
    isLoading: countriesLoading,
    isFetching: countriesFetching,
    refetch: refetchCountries,
  } = useGetMarketplaceCountriesQuery({
    countrySearch: countrySearch.trim() || undefined,
    limitCities: 5,
    page: countryPage,
    size: 10,
  });

  const {
    data: citiesData,
    isLoading: citiesLoading,
    isFetching: citiesFetching,
    refetch: refetchCities,
  } = useGetMarketplaceCitiesQuery({
    page: cityPage,
    search: citySearch.trim() || undefined,
    size: 12,
  });

  const overview = overviewData?.body;
  const countries = countriesData?.body?.result ?? [];
  const cities = citiesData?.body?.result ?? [];

  const featuredCities = useMemo(() => {
    const seen = new Set<string>();
    const rows: MarketplaceCitySummary[] = [];

    for (const country of overview?.countries ?? []) {
      for (const city of country.topCities ?? []) {
        const key = `${city.countryCode}-${city.city.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          rows.push(city);
        }
      }
    }

    return rows.slice(0, 6);
  }, [overview]);

  const countriesTotalPages = Math.max(1, Number(countriesData?.body?.totalPages || 1));
  const citiesTotalPages = Math.max(1, Number(citiesData?.body?.totalPages || 1));
  const refreshing =
    overviewFetching || countriesFetching || citiesFetching;

  const refresh = async () => {
    await Promise.all([refetchOverview(), refetchCountries(), refetchCities()]);
  };

  return (
    <View className="flex-1 bg-background">
      <MarketplaceHeader
        eyebrow="Explore GatherPlux"
        title="Find events and planners by location"
        subtitle="Choose a country or city, then open local events, planners, and services near that place."
        onBack={() => router.back()}
      />

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing && !overviewLoading}
            onRefresh={refresh}
            tintColor={palette.primary}
          />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {overviewLoading ? (
          <LoadingState />
        ) : overview ? (
          <>
            <View className="flex-row gap-3">
              <StatCard
                label="Countries"
                value={overview.meta.totalCountries}
                icon={<Globe2 color={palette.primary} size={18} />}
              />
              <StatCard
                label="Cities"
                value={overview.meta.totalCities}
                icon={<MapPin color={palette.primary} size={18} />}
              />
            </View>
            <View className="flex-row gap-3 mt-3">
              <StatCard
                label="Planners"
                value={overview.meta.totalPlanners}
                icon={<Building2 color={palette.primary} size={18} />}
              />
              <StatCard
                label="Events"
                value={overview.meta.totalEvents}
                icon={<CalendarDays color={palette.primary} size={18} />}
              />
            </View>

            {overview.countries.length ? (
              <View className="mt-7">
                <SectionHeader
                  title="Active countries"
                  subtitle="Places with the strongest event and planner activity right now."
                />
                <View className="mt-4">
                  {overview.countries.map((country) => (
                    <CountryCard
                      key={country.countryCode}
                      country={country}
                      onPress={() => router.push(countryRoute(country.countryCode) as any)}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {featuredCities.length ? (
              <View className="mt-3">
                <SectionHeader
                  title="Cities worth opening"
                  subtitle="Jump straight into local events and providers."
                />
                <View className="mt-4">
                  {featuredCities.map((city) => (
                    <CityCard
                      key={`${city.countryCode}-${city.city}`}
                      city={city}
                      onPress={() => router.push(cityRoute(city) as any)}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </>
        ) : (
          <EmptyState
            title="Marketplace unavailable"
            subtitle="We could not load the public marketplace right now."
          />
        )}

        <View className="mt-5">
          <SegmentedTabs<MarketplaceTab>
            active={activeTab}
            onChange={setActiveTab}
            tabs={[
              {
                label: "Countries",
                value: "countries",
                count: countriesData?.body?.totalItems,
              },
              {
                label: "Cities",
                value: "cities",
                count: citiesData?.body?.totalItems,
              },
            ]}
          />

          <View className="mt-4">
            {activeTab === "countries" ? (
              <>
                <SearchBox
                  value={countrySearch}
                  onChangeText={(value) => {
                    setCountrySearch(value);
                    setCountryPage(1);
                  }}
                  placeholder="Search countries"
                />

                <View className="mt-4">
                  {countriesLoading || countriesFetching ? (
                    <LoadingState label="Loading countries" />
                  ) : countries.length ? (
                    <>
                      {countries.map((country) => (
                        <CountryCard
                          key={country.countryCode}
                          country={country}
                          onPress={() =>
                            router.push(countryRoute(country.countryCode) as any)
                          }
                        />
                      ))}
                      <PaginationControls
                        page={countryPage}
                        totalPages={countriesTotalPages}
                        onPrevious={() =>
                          setCountryPage((current) => Math.max(1, current - 1))
                        }
                        onNext={() =>
                          setCountryPage((current) =>
                            Math.min(countriesTotalPages, current + 1)
                          )
                        }
                      />
                    </>
                  ) : (
                    <EmptyState
                      title="No countries found"
                      subtitle="Try a different country name or clear the search."
                    />
                  )}
                </View>
              </>
            ) : (
              <>
                <SearchBox
                  value={citySearch}
                  onChangeText={(value) => {
                    setCitySearch(value);
                    setCityPage(1);
                  }}
                  placeholder="Search cities"
                />

                <View className="mt-4">
                  {citiesLoading || citiesFetching ? (
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
                        page={cityPage}
                        totalPages={citiesTotalPages}
                        onPrevious={() =>
                          setCityPage((current) => Math.max(1, current - 1))
                        }
                        onNext={() =>
                          setCityPage((current) =>
                            Math.min(citiesTotalPages, current + 1)
                          )
                        }
                      />
                    </>
                  ) : (
                    <EmptyState
                      title="No cities found"
                      subtitle="Try another city name or browse countries first."
                    />
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
