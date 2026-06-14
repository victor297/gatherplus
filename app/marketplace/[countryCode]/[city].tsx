import React, { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Activity, Building2, CalendarDays, MapPin } from "lucide-react-native";

import {
  EmptyState,
  EventCard,
  FilterChip,
  LoadingState,
  MarketplaceHeader,
  PaginationControls,
  PlannerCard,
  SearchBox,
  SectionHeader,
  SegmentedTabs,
  StatCard,
  palette,
  plannerDetailId,
  safeDecode,
} from "@/components/marketplace/MobileMarketplace";
import {
  useGetMarketplaceCityDetailQuery,
  useGetMarketplaceCityEventsQuery,
  useGetMarketplaceCityPlannersQuery,
} from "@/redux/api/publicMarketplaceApiSlice";

type CityTab = "featured" | "planners" | "events";
type PlannerSort = "rating" | "newest";
type EventStatus = "" | "UPCOMING" | "LIVE" | "PAST";
type EventPrice = "" | "free" | "paid";

export default function MarketplaceCityScreen() {
  const router = useRouter();
  const { countryCode, city } = useLocalSearchParams<{
    countryCode: string;
    city: string;
  }>();
  const safeCountryCode = safeDecode(countryCode).toUpperCase();
  const safeCity = safeDecode(city);

  const [activeTab, setActiveTab] = useState<CityTab>("featured");
  const [plannerPage, setPlannerPage] = useState(1);
  const [plannerSearch, setPlannerSearch] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [plannerSort, setPlannerSort] = useState<PlannerSort>("rating");

  const [eventPage, setEventPage] = useState(1);
  const [eventSearch, setEventSearch] = useState("");
  const [eventStatus, setEventStatus] = useState<EventStatus>("");
  const [eventPrice, setEventPrice] = useState<EventPrice>("");

  const {
    data: detailData,
    isLoading: detailLoading,
    isFetching: detailFetching,
    isError: detailError,
    refetch: refetchDetail,
  } = useGetMarketplaceCityDetailQuery({
    city: safeCity,
    countryCode: safeCountryCode,
  });

  const {
    data: plannersData,
    isLoading: plannersLoading,
    isFetching: plannersFetching,
  } = useGetMarketplaceCityPlannersQuery(
    {
      city: safeCity,
      countryCode: safeCountryCode,
      params: {
        page: plannerPage,
        search: plannerSearch.trim() || undefined,
        size: 10,
        sortBy: plannerSort,
        sortDirection: "desc",
        verifiedOnly: verifiedOnly || undefined,
      },
    },
    { skip: activeTab !== "planners" }
  );

  const {
    data: eventsData,
    isLoading: eventsLoading,
    isFetching: eventsFetching,
  } = useGetMarketplaceCityEventsQuery(
    {
      city: safeCity,
      countryCode: safeCountryCode,
      params: {
        page: eventPage,
        price: eventPrice || undefined,
        search: eventSearch.trim() || undefined,
        size: 10,
        sortBy: "soonest",
        sortDirection: "asc",
        type: eventStatus || undefined,
      },
    },
    { skip: activeTab !== "events" }
  );

  const summary = detailData?.body?.summary;
  const featuredPlanners = detailData?.body?.featuredPlanners ?? [];
  const featuredEvents = detailData?.body?.featuredEvents ?? [];
  const planners = plannersData?.body?.result ?? [];
  const events = eventsData?.body?.result ?? [];
  const plannersTotalPages = Math.max(1, Number(plannersData?.body?.totalPages || 1));
  const eventsTotalPages = Math.max(1, Number(eventsData?.body?.totalPages || 1));

  const openPlanner = (id: string | number) => {
    router.push(`/(provider)/${id}/servicedetails` as any);
  };

  const openEvent = (id: string | number) => {
    router.push(`/(tabs)/home/event/${id}` as any);
  };

  return (
    <View className="flex-1 bg-background">
      <MarketplaceHeader
        eyebrow={summary ? `${summary.country} city guide` : safeCountryCode}
        title={summary ? `Explore ${summary.city}` : safeCity}
        subtitle={
          summary
            ? `Find public events and trusted event pros in ${summary.city}, ${summary.country}.`
            : "Discover public events and planners by city."
        }
        onBack={() => router.back()}
      />

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={detailFetching && !detailLoading}
            onRefresh={refetchDetail}
            tintColor={palette.primary}
          />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {detailLoading ? (
          <LoadingState label="Loading city marketplace" />
        ) : detailError || !summary ? (
          <EmptyState
            title="City unavailable"
            subtitle="We could not load this city marketplace right now."
          />
        ) : (
          <>
            <View className="flex-row gap-3">
              <StatCard
                label="Planners"
                value={summary.plannersCount}
                icon={<Building2 color={palette.primary} size={18} />}
              />
              <StatCard
                label="Events"
                value={summary.eventsCount}
                icon={<CalendarDays color={palette.primary} size={18} />}
              />
            </View>
            <View className="flex-row gap-3 mt-3">
              <StatCard
                label="Activity"
                value={summary.activityScore}
                icon={<Activity color={palette.primary} size={18} />}
              />
              <StatCard
                label="Location"
                value={summary.countryCode}
                icon={<MapPin color={palette.primary} size={18} />}
              />
            </View>

            <View className="mt-6">
              <SegmentedTabs<CityTab>
                active={activeTab}
                onChange={setActiveTab}
                tabs={[
                  { label: "Featured", value: "featured" },
                  {
                    label: "Planners",
                    value: "planners",
                    count: summary.plannersCount,
                  },
                  {
                    label: "Events",
                    value: "events",
                    count: summary.eventsCount,
                  },
                ]}
              />
            </View>

            {activeTab === "featured" ? (
              <View className="mt-5">
                <View className="mb-3">
                  <SectionHeader
                    title="Featured planners"
                    subtitle="Trusted providers with local activity."
                    actionLabel="View all"
                    onAction={() => setActiveTab("planners")}
                  />
                </View>

                {featuredPlanners.length ? (
                  featuredPlanners.map((planner) => (
                    <PlannerCard
                      key={planner.id}
                      planner={planner}
                      onPress={() => openPlanner(plannerDetailId(planner))}
                    />
                  ))
                ) : (
                  <EmptyState
                    title="No featured planners yet"
                    subtitle="Planner listings will appear here as this city grows."
                  />
                )}

                <View className="mt-6 mb-3">
                  <SectionHeader
                    title="Featured events"
                    subtitle="Public events currently listed in this city."
                    actionLabel="View all"
                    onAction={() => setActiveTab("events")}
                  />
                </View>

                {featuredEvents.length ? (
                  featuredEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onPress={() => openEvent(event.id)}
                    />
                  ))
                ) : (
                  <EmptyState
                    title="No featured events yet"
                    subtitle="Published events for this city will appear here."
                  />
                )}
              </View>
            ) : null}

            {activeTab === "planners" ? (
              <View className="mt-5">
                <SearchBox
                  value={plannerSearch}
                  onChangeText={(value) => {
                    setPlannerSearch(value);
                    setPlannerPage(1);
                  }}
                  placeholder="Search planners"
                />

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mt-4"
                >
                  <FilterChip
                    label="All planners"
                    active={!verifiedOnly}
                    onPress={() => {
                      setVerifiedOnly(false);
                      setPlannerPage(1);
                    }}
                  />
                  <FilterChip
                    label="Verified"
                    active={verifiedOnly}
                    onPress={() => {
                      setVerifiedOnly(true);
                      setPlannerPage(1);
                    }}
                  />
                  <FilterChip
                    label="Top rated"
                    active={plannerSort === "rating"}
                    onPress={() => {
                      setPlannerSort("rating");
                      setPlannerPage(1);
                    }}
                  />
                  <FilterChip
                    label="Newest"
                    active={plannerSort === "newest"}
                    onPress={() => {
                      setPlannerSort("newest");
                      setPlannerPage(1);
                    }}
                  />
                </ScrollView>

                <View className="mt-4">
                  {plannersLoading || plannersFetching ? (
                    <LoadingState label="Loading planners" />
                  ) : planners.length ? (
                    <>
                      {planners.map((planner) => (
                        <PlannerCard
                          key={planner.id}
                          planner={planner}
                          onPress={() => openPlanner(plannerDetailId(planner))}
                        />
                      ))}
                      <PaginationControls
                        page={plannerPage}
                        totalPages={plannersTotalPages}
                        onPrevious={() =>
                          setPlannerPage((current) => Math.max(1, current - 1))
                        }
                        onNext={() =>
                          setPlannerPage((current) =>
                            Math.min(plannersTotalPages, current + 1)
                          )
                        }
                      />
                    </>
                  ) : (
                    <EmptyState
                      title="No planners found"
                      subtitle="Try another search or remove the verified filter."
                    />
                  )}
                </View>
              </View>
            ) : null}

            {activeTab === "events" ? (
              <View className="mt-5">
                <SearchBox
                  value={eventSearch}
                  onChangeText={(value) => {
                    setEventSearch(value);
                    setEventPage(1);
                  }}
                  placeholder="Search events"
                />

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mt-4"
                >
                  {[
                    { label: "All events", value: "" as EventStatus },
                    { label: "Upcoming", value: "UPCOMING" as EventStatus },
                    { label: "Live", value: "LIVE" as EventStatus },
                    { label: "Past", value: "PAST" as EventStatus },
                  ].map((option) => (
                    <FilterChip
                      key={option.label}
                      label={option.label}
                      active={eventStatus === option.value}
                      onPress={() => {
                        setEventStatus(option.value);
                        setEventPage(1);
                      }}
                    />
                  ))}
                </ScrollView>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mt-3"
                >
                  {[
                    { label: "Any price", value: "" as EventPrice },
                    { label: "Free", value: "free" as EventPrice },
                    { label: "Paid", value: "paid" as EventPrice },
                  ].map((option) => (
                    <FilterChip
                      key={option.label}
                      label={option.label}
                      active={eventPrice === option.value}
                      onPress={() => {
                        setEventPrice(option.value);
                        setEventPage(1);
                      }}
                    />
                  ))}
                </ScrollView>

                <View className="mt-4">
                  {eventsLoading || eventsFetching ? (
                    <LoadingState label="Loading events" />
                  ) : events.length ? (
                    <>
                      {events.map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          onPress={() => openEvent(event.id)}
                        />
                      ))}
                      <PaginationControls
                        page={eventPage}
                        totalPages={eventsTotalPages}
                        onPrevious={() =>
                          setEventPage((current) => Math.max(1, current - 1))
                        }
                        onNext={() =>
                          setEventPage((current) =>
                            Math.min(eventsTotalPages, current + 1)
                          )
                        }
                      />
                    </>
                  ) : (
                    <EmptyState
                      title="No events found"
                      subtitle="Try another search, status, or price filter."
                    />
                  )}
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}
