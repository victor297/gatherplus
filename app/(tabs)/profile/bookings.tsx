import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Layers,
  Link as LinkIcon,
  Printer,
  QrCode,
  Search,
  Ticket,
  Video,
} from "lucide-react-native";
import ProfileFoundationScreen from "@/app/components/profile/ProfileFoundationScreen";
import { useGetUserTicketBookingsQuery } from "@/redux/api/eventsApiSlice";
import {
  useCancelResaleListingMutation,
  useCreateResaleListingMutation,
  useGetMyTicketExchangeQuery,
} from "@/redux/api/ticketExchangeApiSlice";
import { formatDate } from "@/utils/formatDate";

type WalletBooking = {
  code?: string;
  created_at?: string;
  email?: string;
  event?: Record<string, any>;
  event_id?: number | string;
  fullname?: string;
  id: number;
  invoice?: Record<string, any>;
  questionnaire?: Record<string, any>[];
  questionnairePending?: boolean;
  secureBookingUrl?: string;
  session?: Record<string, any>;
  status?: string;
  ticket?: Record<string, any>;
};

type WalletGroup = {
  event?: Record<string, any>;
  invoiceTotal?: number;
  latestBookingAt?: string;
  questionnairePending?: number;
  ticketCount: number;
  tickets: WalletBooking[];
};

type BookingTab = "events" | "resale";

const PAGE_SIZE = 8;

const normalizeCurrency = (value?: unknown) =>
  String(value || "NGN").split(/[\s-]/)[0] || "NGN";

const money = (value?: unknown, currency?: unknown) => {
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
};

const getArray = (value: unknown) => (Array.isArray(value) ? value : []);

const getBookingQuestionnaire = (booking: WalletBooking) => {
  const items = Array.isArray(booking.questionnaire) ? booking.questionnaire : [];
  return items.find((item) => !item.completed) || items[0];
};

function groupBookings(bookings: WalletBooking[]): WalletGroup[] {
  const groups = new Map<string, WalletGroup>();

  bookings.forEach((booking) => {
    const event = booking.event || {};
    const key = String(event.id || booking.event_id || "unknown");
    const current = groups.get(key) || {
      event,
      invoiceTotal: 0,
      latestBookingAt: booking.created_at,
      questionnairePending: 0,
      ticketCount: 0,
      tickets: [],
    };

    current.tickets.push(booking);
    current.ticketCount = current.tickets.length;
    current.invoiceTotal =
      Number(current.invoiceTotal || 0) + Number(booking.invoice?.finalAmount || booking.ticket?.price || 0);
    current.questionnairePending =
      Number(current.questionnairePending || 0) + (booking.questionnairePending ? 1 : 0);

    const currentDate = current.latestBookingAt ? new Date(current.latestBookingAt).getTime() : 0;
    const bookingDate = booking.created_at ? new Date(booking.created_at).getTime() : 0;
    if (bookingDate > currentDate) current.latestBookingAt = booking.created_at;
    groups.set(key, current);
  });

  return [...groups.values()].sort((a, b) => {
    const left = a.latestBookingAt ? new Date(a.latestBookingAt).getTime() : 0;
    const right = b.latestBookingAt ? new Date(b.latestBookingAt).getTime() : 0;
    return right - left;
  });
}

function parseWallet(data: any) {
  const body = data?.body || {};
  const rawGroups = getArray(body.ticketGroups);
  const rawBookings = getArray(body.bookings).length
    ? getArray(body.bookings)
    : getArray(body.result).length
      ? getArray(body.result)
      : getArray(body);
  const groups = rawGroups.length ? rawGroups : groupBookings(rawBookings as WalletBooking[]);
  const bookings = rawBookings.length
    ? rawBookings
    : groups.flatMap((group: WalletGroup) => group.tickets || []);
  const metrics = body.metrics || {};

  return {
    bookings: bookings as WalletBooking[],
    groups: groups as WalletGroup[],
    metrics,
  };
}

export default function BookingsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<BookingTab>("events");
  const [expandedGroups, setExpandedGroups] = useState<(string | number)[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [resalePrices, setResalePrices] = useState<Record<string, string>>({});

  const { data, error, isFetching, isLoading, refetch } = useGetUserTicketBookingsQuery(
    { page: 1, size: 250 },
    {
      refetchOnFocus: true,
      refetchOnMountOrArgChange: true,
    }
  );
  const {
    data: resaleData,
    isFetching: resaleFetching,
    refetch: refetchResale,
  } = useGetMyTicketExchangeQuery(undefined, {
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
  });
  const [createListing, { isLoading: isListing }] = useCreateResaleListingMutation();
  const [cancelListing, { isLoading: isCancellingListing }] = useCancelResaleListingMutation();

  const wallet = useMemo(() => parseWallet(data), [data]);
  const resaleBody = resaleData?.body || {};
  const eligibleResale = getArray(resaleBody.eligibleBookings);
  const resaleListings = getArray(resaleBody.listings);
  const activeResaleListings = resaleListings.filter(
    (listing: any) => String(listing.status || "").toUpperCase() === "ACTIVE"
  );
  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return wallet.groups;
    return wallet.groups.filter((group) => {
      const title = String(group.event?.title || "").toLowerCase();
      const codes = (group.tickets || []).map((ticket) => ticket.code || "").join(" ").toLowerCase();
      return title.includes(query) || codes.includes(query);
    });
  }, [search, wallet.groups]);

  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / PAGE_SIZE));
  const pagedGroups = filteredGroups.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalTickets = wallet.bookings.length;
  const pendingQuestionnaires = wallet.bookings.filter((booking) => booking.questionnairePending).length;
  const onlineAccess = wallet.bookings.filter((booking) => booking.event?.online_access_available).length;

  const toggleGroup = (eventId: string | number) => {
    setExpandedGroups((current) =>
      current.includes(eventId)
        ? current.filter((id) => id !== eventId)
        : [...current, eventId]
    );
  };

  const handleListForResale = async (booking: any) => {
    const price = Number(resalePrices[String(booking.id)] || booking.ticket?.price || 0);
    if (!price || price <= 0) {
      Alert.alert("Price required", "Enter a resale price greater than zero.");
      return;
    }

    try {
      await createListing({ booking_id: booking.id, price }).unwrap();
      setResalePrices((current) => ({ ...current, [String(booking.id)]: "" }));
      refetchResale();
      refetch();
      Alert.alert("Ticket listed", "Your ticket is now available on the resale marketplace.");
    } catch (err: any) {
      Alert.alert("Could not list ticket", err?.data?.body || "Please try again.");
    }
  };

  const handleCancelListing = async (listingId: number | string) => {
    try {
      await cancelListing(listingId).unwrap();
      refetchResale();
      refetch();
      Alert.alert("Listing cancelled", "The resale listing has been removed.");
    } catch (err: any) {
      Alert.alert("Could not cancel listing", err?.data?.body || "Please try again.");
    }
  };

  return (
    <ProfileFoundationScreen
      isLoading={isLoading}
      title="My bookings"
      subtitle="Tickets, secure online links, invoices, and resale readiness."
      stats={[
        { label: "Tickets", value: totalTickets },
        { label: "Event groups", value: wallet.groups.length },
        { label: "Online access", value: onlineAccess },
        { label: "Forms due", value: pendingQuestionnaires },
      ]}
    >
      <View className="flex-row bg-[#111823] border border-[#243044] rounded-2xl p-1 mb-4">
        {[
          { key: "events", label: "Event tickets" },
          { key: "resale", label: "Resale" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            className={`flex-1 rounded-xl py-3 ${activeTab === tab.key ? "bg-primary" : ""}`}
            onPress={() => setActiveTab(tab.key as BookingTab)}
          >
            <Text
              className={`text-center font-semibold ${
                activeTab === tab.key ? "text-background" : "text-gray-300"
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "resale" ? (
        <View className="gap-4 mb-5">
          <View className="bg-[#111823] border border-[#243044] rounded-2xl p-5">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-white text-xl font-semibold">Ticket resale</Text>
                <Text className="text-gray-400 mt-2 leading-6">
                  Paid, unused, upcoming tickets can be listed. Free passes, checked-in tickets,
                  cancelled tickets, and tickets for events you organize are excluded.
                </Text>
              </View>
              {resaleFetching ? <ActivityIndicator color="#9EDD45" /> : null}
            </View>

            <View className="flex-row gap-3 mt-5">
              <View className="flex-1 bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-4">
                <Text className="text-white text-2xl font-bold">{eligibleResale.length}</Text>
                <Text className="text-gray-400 mt-1">Can list</Text>
              </View>
              <View className="flex-1 bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-4">
                <Text className="text-white text-2xl font-bold">{activeResaleListings.length}</Text>
                <Text className="text-gray-400 mt-1">Active</Text>
              </View>
            </View>

            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                className="bg-primary rounded-xl py-3 flex-1"
                onPress={() => router.push("/sell-tickets" as any)}
              >
                <Text className="text-background text-center font-bold">Seller workspace</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="border border-[#2E3A4D] rounded-xl py-3 flex-1"
                onPress={() => router.push("/ticket-exchange" as any)}
              >
                <Text className="text-white text-center font-semibold">Marketplace</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden">
            <View className="p-4 border-b border-[#243044]">
              <Text className="text-white text-lg font-semibold">Eligible tickets</Text>
              <Text className="text-gray-400 mt-1">
                {eligibleResale.length} paid ticket{eligibleResale.length === 1 ? "" : "s"} ready for resale.
              </Text>
            </View>
            {eligibleResale.slice(0, 4).map((booking: any) => (
              <View key={booking.id || booking.code} className="p-4 border-b border-[#243044]">
                <Text className="text-white font-semibold">{booking.event?.title || "Event ticket"}</Text>
                <Text className="text-gray-400 mt-1">
                  {booking.ticket?.name || "Ticket"} · {booking.code || "No code"} ·{" "}
                  {money(booking.ticket?.price || booking.invoice?.finalAmount || 0, booking.event?.currency)}
                </Text>
                <View className="flex-row gap-2 mt-3">
                  <TextInput
                    className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white flex-1"
                    keyboardType="decimal-pad"
                    placeholder="Resale price"
                    placeholderTextColor="#728097"
                    value={resalePrices[String(booking.id)] ?? String(booking.ticket?.price || "")}
                    onChangeText={(value) =>
                      setResalePrices((current) => ({ ...current, [String(booking.id)]: value }))
                    }
                  />
                  <TouchableOpacity
                    className="bg-primary rounded-xl px-4 justify-center disabled:opacity-50"
                    disabled={isListing}
                    onPress={() => handleListForResale(booking)}
                  >
                    <Text className="text-background font-bold">List</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {!eligibleResale.length ? (
              <View className="p-6">
                <Text className="text-gray-300 font-semibold">No eligible resale tickets right now.</Text>
                <Text className="text-gray-500 mt-2">
                  Paid tickets appear here only when they are unused, upcoming, not already listed,
                  and not from your own event.
                </Text>
              </View>
            ) : null}
          </View>

          <View className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden">
            <View className="p-4 border-b border-[#243044]">
              <Text className="text-white text-lg font-semibold">Your listings</Text>
              <Text className="text-gray-400 mt-1">Active and sold listings stay visible for audit.</Text>
            </View>
            {resaleListings.slice(0, 4).map((listing: any) => (
              <View key={listing.id} className="p-4 border-b border-[#243044]">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-white font-semibold">{listing.event?.title || "Resale ticket"}</Text>
                    <Text className="text-gray-400 mt-1">
                      {listing.ticket?.name || "Ticket"} · {money(listing.price, listing.currency)} ·{" "}
                      {listing.status || "Active"}
                    </Text>
                  </View>
                  {String(listing.status || "").toUpperCase() === "ACTIVE" ? (
                    <TouchableOpacity
                      className="border border-red-500/40 rounded-xl px-3 py-2 disabled:opacity-50"
                      disabled={isCancellingListing}
                      onPress={() => handleCancelListing(listing.id)}
                    >
                      <Text className="text-red-300 font-semibold">Cancel</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ))}
            {!resaleListings.length ? (
              <View className="p-6">
                <Text className="text-gray-300 font-semibold">No resale listings yet.</Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {activeTab === "events" ? (
      <View className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden">
        <View className="p-4 border-b border-[#243044]">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-white text-2xl font-semibold">Booking library</Text>
              <Text className="text-gray-400 mt-1">
                {filteredGroups.length} group{filteredGroups.length === 1 ? "" : "s"} with{" "}
                {totalTickets} ticket{totalTickets === 1 ? "" : "s"}.
              </Text>
            </View>
            <View className="rounded-full border border-[#2E3A4D] px-3 py-2 flex-row items-center">
              <QrCode color="#8B6BFF" size={15} />
              <Text className="text-gray-300 text-xs font-semibold ml-2">Secure</Text>
            </View>
          </View>

          <View className="flex-row items-center bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-3 mt-4">
            <Search color="#8B6BFF" size={18} />
            <TextInput
              className="flex-1 text-white py-3 ml-2"
              placeholder="Search event or booking code"
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

        {error ? (
          <View className="p-6 items-center">
            <Text className="text-red-400 text-center">Unable to load bookings.</Text>
            <TouchableOpacity className="bg-primary px-5 py-3 rounded-xl mt-4" onPress={refetch}>
              <Text className="text-background font-bold">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!error && pagedGroups.length ? (
          <FlatList
            data={pagedGroups}
            keyExtractor={(item, index) => String(item.event?.id || item.latestBookingAt || index)}
            scrollEnabled={false}
            renderItem={({ item }) => {
              const eventId = item.event?.id || item.latestBookingAt || "event";
              const expanded = expandedGroups.includes(eventId);
              return (
                <View className="border-b border-[#243044]">
                  <TouchableOpacity
                    className="p-4 flex-row items-center justify-between"
                    onPress={() => toggleGroup(eventId)}
                  >
                    <View className="flex-row items-center flex-1 pr-3">
                      <View className="w-12 h-12 rounded-full bg-white/10 items-center justify-center">
                        <Layers color="#A993FF" size={21} />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-white text-lg font-semibold">
                          {item.event?.title || "Untitled event"}
                        </Text>
                        <Text className="text-gray-400 mt-1">
                          {item.ticketCount} ticket{item.ticketCount === 1 ? "" : "s"} ·{" "}
                          {formatDate(item.event?.start_date)} · invoice{" "}
                          {money(item.invoiceTotal || 0, item.event?.currency)}
                        </Text>
                      </View>
                    </View>
                    <View className="rounded-full border border-[#2E3A4D] px-3 py-2 flex-row items-center">
                      <Text className="text-white text-sm font-semibold">
                        {expanded ? "Hide" : "View"}
                      </Text>
                      {expanded ? (
                        <ChevronDown color="#E5E7EB" size={16} />
                      ) : (
                        <ChevronRight color="#E5E7EB" size={16} />
                      )}
                    </View>
                  </TouchableOpacity>

                  {expanded ? (
                    <View className="px-4 pb-4">
                      {(item.tickets || []).map((booking) => {
                        const questionnaire = getBookingQuestionnaire(booking);
                        const questionnaireCompleted = Boolean(
                          questionnaire?.completed || questionnaire?.submittedAt
                        );

                        return (
                          <View key={booking.id || booking.code} className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-4 mb-3">
                            <View className="flex-row flex-wrap items-center gap-2">
                              <Text className="bg-primary/15 border border-primary/30 rounded-full px-3 py-1 text-primary font-mono text-xs">
                                {booking.code || "No code"}
                              </Text>
                              <Text className="bg-white/10 rounded-full px-3 py-1 text-gray-300 text-xs font-semibold">
                                {booking.status || "Booked"}
                              </Text>
                              {questionnaire?.id ? (
                                <Text
                                  className={
                                    questionnaireCompleted
                                      ? "bg-primary/15 rounded-full px-3 py-1 text-primary text-xs font-semibold"
                                      : "bg-amber-500/15 rounded-full px-3 py-1 text-amber-300 text-xs font-semibold"
                                  }
                                >
                                  {questionnaireCompleted ? "Form submitted" : "Questionnaire due"}
                                </Text>
                              ) : null}
                            </View>

                            <Text className="text-white text-base font-semibold mt-3">
                              {booking.fullname || "Guest attendee"}
                            </Text>
                            <Text className="text-gray-400 mt-1">
                              {booking.ticket?.name || "Ticket"} · {booking.session?.name || "General admission"}
                            </Text>

                            {booking.event?.online_access_available ? (
                              <View className="flex-row items-center mt-3">
                                <Video color="#9EDD45" size={16} />
                                <Text className="text-primary ml-2 font-semibold">Online access ready</Text>
                              </View>
                            ) : null}

                            {questionnaire?.id ? (
                              <TouchableOpacity
                                className="bg-[#111823] border border-[#2E3A4D] rounded-xl p-3 mt-4 flex-row items-center"
                                onPress={() => router.push(`/questionnaire/${questionnaire.id}` as any)}
                              >
                                <View className="w-9 h-9 rounded-full bg-[#8B6BFF]/20 items-center justify-center">
                                  <ClipboardList color="#A993FF" size={18} />
                                </View>
                                <View className="ml-3 flex-1">
                                  <Text className="text-white font-semibold">
                                    {questionnaireCompleted ? "Review questionnaire" : "Complete questionnaire"}
                                  </Text>
                                  <Text className="text-gray-500 mt-1">
                                    {questionnaireCompleted
                                      ? "Answers saved for organizer review."
                                      : "Action needed before the event."}
                                  </Text>
                                </View>
                                <ChevronRight color="#E5E7EB" size={18} />
                              </TouchableOpacity>
                            ) : null}

                            <View className="bg-[#111823] rounded-xl p-3 mt-4">
                              <Text className="text-gray-400 text-xs uppercase tracking-[2px]">Invoice</Text>
                              <Text className="text-white font-semibold mt-1">
                                {booking.invoice?.reference || "Free access"}
                              </Text>
                              <Text className="text-gray-400 mt-1">
                                {booking.invoice?.status || booking.status || "Booked"} ·{" "}
                                {money(booking.invoice?.finalAmount || booking.ticket?.price || 0, booking.event?.currency)}
                              </Text>
                            </View>

                            <View className="flex-row gap-2 mt-4">
                              <TouchableOpacity
                                className="bg-primary rounded-xl px-4 py-3 flex-row items-center"
                                onPress={() => router.push(`/profile/${booking.event?.id || booking.event_id}/bookingdetails` as any)}
                              >
                                <Ticket color="#020817" size={16} />
                                <Text className="text-background font-bold ml-2">View</Text>
                              </TouchableOpacity>
                              <TouchableOpacity className="bg-[#111823] border border-[#2E3A4D] rounded-xl px-4 py-3 flex-row items-center">
                                <LinkIcon color="#E5E7EB" size={16} />
                                <Text className="text-white font-semibold ml-2">Link</Text>
                              </TouchableOpacity>
                              <TouchableOpacity className="bg-[#111823] border border-[#2E3A4D] rounded-xl px-4 py-3 flex-row items-center">
                                <Printer color="#E5E7EB" size={16} />
                                <Text className="text-white font-semibold ml-2">Print</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              );
            }}
          />
        ) : null}

        {!error && !isLoading && !pagedGroups.length ? (
          <View className="p-8 items-center">
            <Ticket color="#8B6BFF" size={36} />
            <Text className="text-white text-lg font-semibold mt-4">No bookings yet</Text>
            <Text className="text-gray-400 text-center mt-2">
              Your tickets, invoices, online links, and forms will appear here after booking.
            </Text>
          </View>
        ) : null}

        <View className="flex-row items-center justify-between p-4">
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
      ) : null}
    </ProfileFoundationScreen>
  );
}
