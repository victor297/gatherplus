import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Share,
} from "react-native";
import {
  useRouter,
  useLocalSearchParams,
  RelativePathString,
} from "expo-router";
import {
  ArrowLeft,
  Share2,
  MapPin,
  Calendar,
  Clock,
  Plus,
  Minus,
  BookmarkCheck,
  BookmarkIcon,
  ChevronDown,
  HeartIcon,
  Info,
  MessageSquareIcon,
  Monitor,
  Share2Icon,
  Tag,
  User,
} from "lucide-react-native";
import {
  useBookmarkeventMutation,
  useDeleteBookmarkMutation,
  useGetCommentsQuery,
  useGetEventQuery,
  useLikeEventMutation,
} from "@/redux/api/eventsApiSlice";
import { formatDate } from "@/utils/formatDate";
import { useSelector } from "react-redux";
import { useFollowEventCreatorMutation } from "@/redux/api/usersApiSlice";
import CommentModal from "@/app/components/CommentModat";
import EventMapPreview from "@/app/components/EventMapPreview";
import * as Sharing from "expo-sharing";
import * as ELinking from "expo-linking";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import { truncateSentence } from "@/utils";
import {
  buildEventShareUrl,
  cleanRichText,
  currencySymbol,
  eventHasOnlineAccess,
  eventNeedsVenue,
  formatEnumLabel,
  getAttendanceLabel,
  getOnlineRevealLabel,
  getTicketRemainingQuantity,
  getUpcomingSessions,
  isFreeEvent,
  isEventEnded,
  isEventSoldOut,
  isUpcomingSession,
} from "@/utils/eventHelpers";
import { getApiErrorMessage } from "@/utils/api";
import { getStringParam } from "@/utils/routeParams";

interface TicketSelection {
  quantity: number;
  sessionId: number | string;
}

export default function EventDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const eventId = getStringParam(id);
  const { userInfo, requireAuth } = useAuthCheck();
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isFollow, setIsFollowed] = useState<boolean>(false);
  const {
    data: event,
    isLoading,
    error,
    refetch,
  } = useGetEventQuery({ id: eventId, user_id: userInfo?.sub });
  const eventData = event?.body;
  const upcomingSessions = getUpcomingSessions(eventData?.sessions || []);
  const eventEnded = isEventEnded(eventData);
  const eventSoldOut = isEventSoldOut(eventData);
  const canBookEvent =
    Boolean(eventData?.published ?? true) &&
    !eventEnded &&
    !eventSoldOut &&
    upcomingSessions.length > 0;
  const attendanceLabel = getAttendanceLabel(eventData);
  const hasOnlineAccess = eventHasOnlineAccess(eventData);
  const hasVenue = eventNeedsVenue(eventData);
  const symbol = currencySymbol(eventData?.currency);
  const eventDescription = cleanRichText(eventData?.description);
  const freeEvent = isFreeEvent(eventData);
  const [ticketSelections, setTicketSelections] = useState<
    Record<number, TicketSelection>
  >({});
  const updateSession = (ticketId: number, newSessionId: number | string) => {
    setTicketSelections((prev) => ({
      ...prev,
      [ticketId]: {
        ...prev[ticketId],
        sessionId: newSessionId,
      },
    }));
  };
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const {
    data: commentsData,
    isLoading: commentsLoading,
    isError: commentsError,
    refetch: refetchComments,
  } = useGetCommentsQuery(eventId, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  const [bookmarkevent, { isLoading: isBookmarkLoading }] =
    useBookmarkeventMutation();
  const [
    deleteBookmark,
    { isLoading: isRemovingBookmarkLoading, isSuccess, isError },
  ] = useDeleteBookmarkMutation();
  const [likeEvent, { isLoading: isLikeLoading }] = useLikeEventMutation();
  const [followEventCreator, { isLoading: isfollowLoading }] =
    useFollowEventCreatorMutation();
  const addTicket = (ticketId: number) => {
    const ticket = eventData?.tickets?.find((t: any) => t.id === ticketId);
    if (!ticket) return;
    if (upcomingSessions.length === 0) {
      Alert.alert("Booking closed", "There are no upcoming sessions available for this event.");
      return;
    }

    setTicketSelections((prev) => {
      const current = prev[ticketId] || {
        quantity: 0,
        sessionId: upcomingSessions[0].id,
      };

      if (current.quantity >= getTicketRemainingQuantity(ticket)) return prev;

      return {
        ...prev,
        [ticketId]: {
          ...current,
          quantity: current.quantity + 1,
        },
      };
    });
  };
  console.log(commentsData?.body?.length || 0, "commentsDatacommentsData");
  const removeTicket = (ticketId: number) => {
    setTicketSelections((prev) => {
      const current = prev[ticketId];
      if (!current || current.quantity === 0) return prev;

      return {
        ...prev,
        [ticketId]: {
          ...current,
          quantity: current.quantity - 1,
        },
      };
    });
  };

  const totalAmount = eventData?.tickets?.reduce((sum: any, ticket: any) => {
    const selection = ticketSelections[ticket.id];
    return sum + (selection?.quantity || 0) * Number(ticket.price);
  }, 0) || 0;

  const shareEvent = async () => {
    try {
      const webUrl = buildEventShareUrl(eventId);
      const shareOptions = {
        message: `🔥 Something big is coming!
Don’t miss out on the *\`${event?.body?.title}\`* – a of non-stop Event, fun, and epic memories!

🎟️ Secure your spot now! Check out 👇 \n\n${webUrl}\n\n`,
        title: "Share Event",
      };

      await Share.share(shareOptions);
    } catch (error) {
      Alert.alert("Error", "Could not share. Please try again.");
    }
  };
  // const shareEvent = async () => {
  //   try {
  //     // Create a deep link that will open your app directly to the event
  //     const deepLink = ELinking.createURL(`/home/event/${id}`);

  //     // Prepare the share content
  //     const shareContent = {
  //       message: `Check out this event: ${event?.body?.title}\n\n${deepLink}`,
  //       title: "Share Event via", // Only used on Android
  //     };

  //     // Check if sharing is available
  //     if (await Sharing.isAvailableAsync()) {
  //       // Use Share API (works on both iOS and Android)
  //       await Share.share(shareContent);
  //     } else {
  //       // Fallback for web or unsupported platforms
  //       Alert.alert(
  //         "Share Event",
  //         `Check out this event: ${event?.body?.title}\n\n${deepLink}`,
  //         [
  //           { text: "OK", onPress: () => {} },
  //           {
  //             text: "Copy Link",
  //             onPress: () => Clipboard.setStringAsync(deepLink),
  //           },
  //         ]
  //       );
  //     }
  //   } catch (error) {
  //     console.error("Sharing failed:", error);
  //     Alert.alert("Error", "Failed to share the event. Please try again.");
  //   }
  // };

  const handleBuyTickets = () => {
    if (!requireAuth()) return;
    if (!canBookEvent) {
      const message = eventEnded
        ? "This event has ended."
        : eventSoldOut
        ? "This event is sold out."
        : "There are no upcoming sessions available for this event.";
      Alert.alert("Booking unavailable", message);
      return;
    }

    if (!eventData?.tickets || eventData.tickets.length === 0) {
      Alert.alert(
        "Tickets unavailable",
        "This event does not have bookable tickets right now."
      );
      return;
    }

    const hasSelectedTickets = Object.values(ticketSelections).some(
      (selection) => selection?.quantity > 0
    );

    if (!hasSelectedTickets) {
      return Alert.alert("Please select at least one ticket to continue");
    }

    // Process selected tickets
    const upcomingSessionIds = new Set(
      upcomingSessions.map((session: any) => String(session.id))
    );
    const ticketInstances = eventData.tickets.flatMap((ticket: any) => {
      const selection = ticketSelections[ticket.id];
      if (!selection || selection.quantity === 0) return [];
      if (!upcomingSessionIds.has(String(selection.sessionId))) return [];

      return Array(selection.quantity).fill({
        ticketId: ticket.id,
        sessionId: selection.sessionId,
        price: Number(ticket.price),
        name: ticket.name,
      });
    });

    if (ticketInstances.length === 0) {
      Alert.alert(
        "Session unavailable",
        "Please select an upcoming session before continuing."
      );
      return;
    }

    const ticketData = {
      eventId,
      currency: eventData.currency,
      ticketInstances,
      totalAmount,
      each_ticket_identity: eventData.each_ticket_identity,
      age_restriction: eventData.age_restriction || 0,
      guardian_required: Boolean(eventData.guardian_required),
      absorb_fee: Boolean(eventData.absorb_fee),
      attendance_mode: eventData.attendance_mode,
      online_url_reveal: eventData.online_url_reveal,
    };

    router.push({
      pathname: `/home/event/${eventId}/checkout` as RelativePathString,
      params: { data: JSON.stringify(ticketData) },
    });
  };
  const handleBookmark = async () => {
    if (!requireAuth()) return;
    try {
      const res = await bookmarkevent({ event_id: Number(eventId) }).unwrap();
      // alert("Bookmarked")
      refetch();
    } catch (err) {
      console.log(err, "errrrrrrrrr");
    }
  };

  const handleBookmarkRemove = async () => {
    if (!requireAuth()) return;
    try {
      const res = await deleteBookmark(Number(eventId)).unwrap();
      // alert("Unbookmarked")
      refetch();
    } catch (err) {
      console.log(err, "errrrrrrrrr");
    }
  };
  const handleLike = async () => {
    if (!requireAuth()) return;
    try {
      const res = await likeEvent(Number(eventId)).unwrap();
      setIsLiked(true);
      refetch();
    } catch (err) {
      console.log(err, "errrrrrrrrr");
      alert("Error Liking");
    }
  };
  const handleFollowed = async (creatorid: any) => {
    if (!requireAuth()) return;
    try {
      const res = await followEventCreator(Number(creatorid)).unwrap();
      setIsFollowed(true);
      refetch();
    } catch (err) {
      console.log(err, "errrrrrrrrr");
      alert("Error Following try again");
    }
  };
  const openMaps = () => {
    const address = encodeURIComponent(
      `${event?.body?.address}, ${event?.body?.city}, ${event?.body?.country?.name}`
    );
    const url = `https://www.google.com/maps/search/?api=1&query=${address}`;
    Linking.openURL(url).catch((err) =>
      console.error("Couldn't load page", err)
    );
  };
  console.log(error, "error");

  return (
    <>
      {isLoading ? (
        <View className="text-white flex-1 bg-background flex justify-center items-center py-4">
          <ActivityIndicator color="#9EDD45" />
        </View>
      ) : error ? (
        <View className="flex-1 bg-background justify-center items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4 bg-[#1A2432] p-2 rounded-full"
          >
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
          <Text className="text-red-500">
            {getApiErrorMessage(error, "Failed to load event")} Please try again.
          </Text>
        </View>
      ) : (
        <View className="flex-1 bg-background">
          <ScrollView className="flex-1">
            <Image
              source={{ uri: event?.body?.images?.[0] }}
              className="w-full h-72"
              resizeMode="cover"
            />

            <View className="absolute w-full flex-row justify-between items-center p-4 pt-12">
              <TouchableOpacity
                onPress={() => router.back()}
                className="mr-4 bg-[#1A2432] p-2 rounded-full"
              >
                <ArrowLeft color="white" size={24} />
              </TouchableOpacity>
              <TouchableOpacity>
                {isBookmarkLoading || isRemovingBookmarkLoading ? (
                  <ActivityIndicator color="#9EDD45" />
                ) : event?.body?.isBookmark ? (
                  <BookmarkCheck
                    color="white"
                    fill="#9EDD45"
                    className="p-5"
                    size={32}
                    onPress={handleBookmarkRemove}
                  />
                ) : (
                  <BookmarkIcon
                    className="p-5"
                    color="white"
                    size={32}
                    onPress={handleBookmark}
                  />
                )}
              </TouchableOpacity>
            </View>

            <View className="px-4 pt-4">
              <Text className="text-white text-2xl font-bold mb-2">
                {eventData?.title}
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-3">
                <View className="bg-primary/20 px-3 py-1 rounded-full">
                  <Text className="text-primary text-xs font-semibold">
                    {attendanceLabel}
                  </Text>
                </View>
                {eventEnded && (
                  <View className="bg-red-500/20 px-3 py-1 rounded-full">
                    <Text className="text-red-300 text-xs font-semibold">
                      Ended
                    </Text>
                  </View>
                )}
                {eventSoldOut && (
                  <View className="bg-amber-500/20 px-3 py-1 rounded-full">
                    <Text className="text-amber-300 text-xs font-semibold">
                      Sold out
                    </Text>
                  </View>
                )}
              </View>
              {eventData?.summary && (
                <Text className="text-gray-300 mb-3 leading-6">
                  {eventData.summary}
                </Text>
              )}
              <View className="flex-row justify-between ">
                <Text className="text-gray-400 mb-2 flex flex-wrap w-64">
                  {hasVenue ? eventData?.address : "Online event"}
                </Text>
                <Text className="text-white">
                  {formatDate(eventData?.start_date)}
                </Text>
              </View>

              {/* Creator section */}
              <View className=" rounded-b-lg px-2 bords mb-6 border-gray-700">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center space-x-2">
                    <Image
                      source={{
                        uri:
                          event?.body?.user?.profile?.image_url ||
                          "https://via.placeholder.com/40",
                      }}
                      className="w-10 h-10 bg-primary border border-gray-100 rounded-full"
                    />
                    <View>
                      <Text className="text-white font-medium">
                        {event?.body?.user?.profile?.name || "Anonymous"}
                      </Text>
                      <Text className="text-gray-400 text-xs">
                        {event?.body?.user?._count?.follower || "0"} followers
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      handleFollowed(event?.body?.user?.profile?.user_id)
                    }
                    className="bg-primary px-4 py-2 rounded-full"
                  >
                    {isfollowLoading ? (
                      <ActivityIndicator />
                    ) : (
                      <Text className="text-white font-medium">
                        {event?.body?.isFollowing ? "Following" : "Follow"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
                {/* Like and comment section */}
                <View className="flex-row justify-between my-2">
                  <TouchableOpacity
                    onPress={handleLike}
                    className="flex-row items-center space-x-2"
                  >
                    {isLikeLoading ? (
                      <ActivityIndicator />
                    ) : !event?.body?.isLike ? (
                      <HeartIcon className="text-gray-400" size={20} />
                    ) : (
                      <HeartIcon
                        className="text-red-400"
                        fill={"red"}
                        size={20}
                      />
                    )}
                    <Text className="text-gray-400">
                      {event?.body?._count?.eventLikes || 0}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setCommentModalVisible(true)}
                    className="flex-row items-center space-x-2"
                  >
                    <MessageSquareIcon className="text-gray-400" size={20} />
                    <Text className="text-gray-400">
                      {commentsData?.body?.length || 0}
                    </Text>
                  </TouchableOpacity>
                  <CommentModal
                    visible={commentModalVisible}
                    onClose={() => setCommentModalVisible(false)}
                    eventId={Number(eventId)}
                    userId={userInfo?.sub}
                  />
                  <TouchableOpacity
                    onPress={() => shareEvent()}
                    className="flex-row items-center space-x-2"
                  >
                    <Share2Icon className="text-gray-400" size={20} />
                    <Text className="text-gray-400">Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View className="bg-gray-800 rounded-lg p-3 mb-2">
                <Text className="text-white text-xl font-semibold mb-4">
                  About Event
                </Text>
                {eventDescription ? (
                  <Text className="text-gray-400 leading-6 mb-2">
                    {eventDescription}
                  </Text>
                ) : (
                  <Text className="text-gray-400 mb-6">No description available.</Text>
                )}
              </View>
              {hasOnlineAccess && (
                <View className="bg-[#1A2432] rounded-lg p-4 mb-4">
                  <View className="flex-row items-center mb-4">
                    <Monitor color="#9EDD45" size={20} />
                    <Text className="text-white text-xl font-semibold ml-2">
                      Online Access
                    </Text>
                  </View>
                  <View className="space-y-2">
                    <Text className="text-gray-300">
                      Format: {attendanceLabel}
                    </Text>
                    <Text className="text-gray-300">
                      Hosted on: {formatEnumLabel(eventData?.online_platform) || "Online"}
                    </Text>
                    <Text className="text-gray-300">
                      Timezone: {eventData?.online_timezone || "Event timezone"}
                    </Text>
                    <Text className="text-gray-300">
                      Access: {getOnlineRevealLabel(eventData?.online_url_reveal)}
                    </Text>
                  </View>
                  {eventData?.online_access_instructions && (
                    <Text className="text-gray-400 text-sm mt-4 leading-6">
                      Access instructions are shared securely with confirmed attendees.
                    </Text>
                  )}
                </View>
              )}

              {Array.isArray(eventData?.tags) && eventData.tags.length > 0 && (
                <View className="bg-gray-800 rounded-lg p-4 mb-4">
                  <View className="flex-row items-center mb-3">
                    <Tag color="#9EDD45" size={18} />
                    <Text className="text-white text-xl font-semibold ml-2">
                      Tags
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    {eventData.tags.map((tag: string) => (
                      <View key={tag} className="bg-[#1A2432] px-3 py-2 rounded-full">
                        <Text className="text-gray-300 text-sm">{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {(eventData?.door_time ||
                eventData?.parking_info ||
                eventData?.agenda_info ||
                eventData?.discount_info) && (
                <View className="bg-[#1A2432] rounded-lg p-4 mb-4">
                  <View className="flex-row items-center mb-3">
                    <Info color="#9EDD45" size={18} />
                    <Text className="text-white text-xl font-semibold ml-2">
                      Event Info
                    </Text>
                  </View>
                  {[
                    ["Door time", eventData?.door_time],
                    ["Parking", eventData?.parking_info],
                    ["Agenda", eventData?.agenda_info],
                    ["Lineup / extra info", eventData?.discount_info],
                  ]
                    .filter(([, value]) => Boolean(value))
                    .map(([label, value]) => (
                      <View key={label} className="mb-3">
                        <Text className="text-primary text-sm font-semibold">
                          {label}
                        </Text>
                        <Text className="text-gray-300 mt-1 leading-6">
                          {value}
                        </Text>
                      </View>
                    ))}
                </View>
              )}

              {hasVenue && (
                <View className="bg-[#1A2432] rounded-lg p-4 mb-6">
                  <Text className="text-white text-xl font-semibold mb-4">
                    Location
                  </Text>
                  <Text className="text-white mb-2">{eventData?.address}</Text>
                  <Text className="text-gray-400 mb-4 ">
                    {eventData?.country?.name}, {eventData?.state?.name},
                    {eventData?.city}
                  </Text>
                  <EventMapPreview
                    address={eventData?.address}
                    city={eventData?.city}
                  />
                  <TouchableOpacity onPress={openMaps} className="self-end">
                    <Text className="text-primary">View map</Text>
                  </TouchableOpacity>
                </View>
              )}
              <View className="bg-gray-800 rounded-lg p-4 mb-4">
                <Text className="text-white text-xl font-semibold mb-2">
                  Sessions & Presenters
                </Text>

                <View className="flex-row items-center mb-2">
                  <Calendar className="text-gray-400 mr-2" size={20} />
                  <Text className="text-gray-400 text-lg">
                    {formatDate(eventData?.start_date)}
                  </Text>
                </View>

                {eventData?.sessions?.map((session: any, sessionIndex: any) => (
                  <View
                    key={sessionIndex}
                    className="mb-4 bg-[#1A2432] p-4 rounded-xl border border-gray-700"
                  >
                    {/* Session Header */}
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center flex-1">
                        <Clock className="text-primary mr-2" size={18} />
                        <Text className="text-gray-300 font-medium">
                          {session?.start_time} - {session?.end_time}
                        </Text>
                      </View>
                      <View className="bg-primary/20 px-2 py-1 rounded-md">
                        <Text className="text-primary text-xs font-bold uppercase">
                          {isUpcomingSession(session)
                            ? `Session ${sessionIndex + 1}`
                            : "Ended"}
                        </Text>
                      </View>
                    </View>

                    <Text className="text-white text-sm font-bold mb-2">
                      {session?.name}
                    </Text>

                    {/* Speakers for this session */}
                    {session?.participants?.length > 0 && (
                      <View className="space-y-4">
                        {session?.participants?.map(
                          (participant: any, pIndex: any) => (
                            <View
                              key={pIndex}
                              className="flex-row items-center bg-gray-800/50 p-2 rounded-lg border border-gray-700/50"
                            >
                              {participant?.image ? (
                                <Image
                                  source={{ uri: participant.image }}
                                  className="w-12 h-12 rounded-full mr-4 border-2 border-primary/30"
                                  resizeMode="cover"
                                />
                              ) : (
                                <View className="w-12 h-12 rounded-full bg-gray-700 mr-4 flex items-center justify-center border-2 border-primary/30">
                                  <User color="#9EDD45" size={24} />
                                </View>
                              )}
                              <View className="flex-1">
                                <Text className="font-bold text-primary text-lg">
                                  {participant.name}
                                </Text>
                                {participant.title && (
                                  <Text className="text-gray-400 text-sm italic">
                                    {participant.title}
                                  </Text>
                                )}
                                {participant.description && (
                                  <Text className="text-gray-300 text-xs mt-1" numberOfLines={2}>
                                    {participant.description}
                                  </Text>
                                )}
                              </View>
                            </View>
                          )
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </View>

              {Array.isArray(eventData?.faqs) && eventData.faqs.length > 0 && (
                <View className="bg-[#1A2432] rounded-lg p-4 mb-4">
                  <Text className="text-white text-xl font-semibold mb-4">
                    FAQs
                  </Text>
                  {eventData.faqs.map((faq: any, index: number) => (
                    <View
                      key={faq.id || index}
                      className="border-b border-gray-700 pb-3 mb-3"
                    >
                      <Text className="text-white font-semibold">
                        {faq.question}
                      </Text>
                      <Text className="text-gray-400 mt-2 leading-6">
                        {faq.answer}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <View className="bg-gray-800 rounded-lg p-2 mb-2">
                <Text className="text-white text-xl font-semibold mb-4">
                  Ticket Information
                </Text>
                <View className="space-y-4">
                  {eventData?.tickets?.map((ticket: any, index: any) => {
                    const selection = ticketSelections[ticket.id] || {
                      quantity: 0,
                      sessionId: upcomingSessions[0]?.id,
                    };
                    const remainingTickets = Math.max(
                      getTicketRemainingQuantity(ticket) - selection.quantity,
                      0
                    );
                    const selectedSession =
                      upcomingSessions.find(
                        (s: any) => String(s.id) === String(selection.sessionId)
                      ) || upcomingSessions[0];

                    return (
                      <View key={index}>
                        <View className=" items-center justify-between bg-[#1A2432] p-4 rounded-lg">
                          <View>
                            <Text className="text-white">{truncateSentence(ticket.name)}</Text>
                            <Text className="text-primary">
                              {symbol}
                              {ticket.price}
                            </Text>
                            <Text className="text-gray-400 text-sm">
                              {getTicketRemainingQuantity(ticket)} tickets remaining
                            </Text>
                          </View>
                          <View className="flex-row items-center mt-2 space-x-4">
                            <TouchableOpacity
                              onPress={() => removeTicket(ticket.id)}
                              className="bg-background p-2 rounded-full"
                              disabled={selection.quantity === 0}
                            >
                              <Minus
                                size={20}
                                color={
                                  selection.quantity === 0 ? "#666" : "#fff"
                                }
                              />
                            </TouchableOpacity>

                            <Text className="text-white w-6 text-center">
                              {selection.quantity}
                            </Text>

                            <TouchableOpacity
                              onPress={() => addTicket(ticket.id)}
                              className="bg-background p-2 rounded-full"
                              disabled={remainingTickets === 0 || !canBookEvent}
                            >
                              <Plus
                                size={20}
                                color={
                                  remainingTickets === 0 || !canBookEvent
                                    ? "#666"
                                    : "#fff"
                                }
                              />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {selection.quantity > 0 && (
                          <View className="mt-2 mx-1">
                            <Text className="text-gray-400 my-2  px-1 text-xs uppercase font-bold">
                              Select Session for {ticket.name}
                            </Text>
                            <TouchableOpacity
                              className="flex-row items-center justify-between bg-[#0e1621] px-4 py-3 rounded-xl border border-gray-700"
                              activeOpacity={0.7}
                              onPress={() => {
                                if (upcomingSessions.length <= 1) return;
                                const currentIndex = upcomingSessions.findIndex(
                                  (s: any) =>
                                    String(s.id) === String(selection.sessionId)
                                );
                                const newIndex =
                                  (Math.max(currentIndex, 0) + 1) %
                                  upcomingSessions.length;
                                updateSession(
                                  ticket.id,
                                  upcomingSessions[newIndex].id
                                );
                              }}
                            >
                              <View className="flex-1">
                                <View className="flex-row items-center">
                                  <Text className="text-white font-semibold">
                                    {selectedSession?.name}
                                  </Text>
                                </View>
                                <View className="flex-row items-center mt-1">
                                  <Clock size={12} color="#9ca3af" className="mr-1" />
                                  <Text className="text-gray-400 text-xs">
                                    {selectedSession?.start_time} - {selectedSession?.end_time}
                                  </Text>
                                </View>
                              </View>
                              <ChevronDown size={20} color="#9EDD45" />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>

                <View className="mt-4 mb-4">
                  <Text className="text-gray-400">
                    Total Tickets:
                    {Object.values(ticketSelections).reduce(
                      (sum, s) => sum + s.quantity,
                      0
                    )}
                  </Text>
                  <Text className="text-white text-xl font-bold">
                    {symbol} {totalAmount}
                  </Text>
                  {eventData?.age_restriction > 0 && (
                    <Text className="text-red-500 text-xs font-bold mt-2">
                      {eventData?.age_restriction}+ is required for this
                      event
                    </Text>
                  )}
                  {!canBookEvent && (
                    <Text className="text-amber-300 text-xs font-semibold mt-2">
                      {eventEnded
                        ? "This event has ended."
                        : eventSoldOut
                        ? "All tickets are sold out."
                        : "No upcoming sessions are available."}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </ScrollView>

          <View className="p-4 border-t border-[#1A2432]">
            <TouchableOpacity
              className={`rounded-lg py-4 ${
                canBookEvent ? "bg-primary" : "bg-gray-600"
              }`}
              onPress={handleBuyTickets}
              disabled={!canBookEvent}
            >
              <Text className="text-background text-center font-semibold">
                {eventEnded
                  ? "Event Ended"
                  : eventSoldOut
                  ? "Sold Out"
                  : upcomingSessions.length === 0
                  ? "No Upcoming Sessions"
                  : freeEvent
                  ? "Reserve Free Tickets"
                  : "Buy Tickets"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
}
