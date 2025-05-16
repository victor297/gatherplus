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
  ChevronDown,
  BookmarkIcon,
  BookmarkCheck,
  HeartIcon,
  MessageSquareIcon,
  Share2Icon,
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
import MapView, { Marker } from "react-native-maps";
import { useFollowEventCreatorMutation } from "@/redux/api/usersApiSlice";
import CommentModal from "@/app/components/CommentModat";

interface TicketSelection {
  quantity: number;
  sessionId: number;
}

export default function EventDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const { userInfo } = useSelector((state: any) => state.auth);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isFollow, setIsFollowed] = useState<boolean>(false);
  const {
    data: event,
    isLoading,
    error,
    refetch,
  } = useGetEventQuery({ id, user_id: userInfo?.sub });
  const [ticketSelections, setTicketSelections] = useState<
    Record<number, TicketSelection>
  >({});
  const updateSession = (ticketId: number, newSessionId: number) => {
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
  } = useGetCommentsQuery(id, {
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
    const ticket = event?.body?.tickets.find((t: any) => t.id === ticketId);
    if (!ticket) return;

    setTicketSelections((prev) => {
      const current = prev[ticketId] || {
        quantity: 0,
        sessionId: event?.body?.sessions[0].id,
      };

      // Check if we've reached the ticket quantity limit
      if (current.quantity >= ticket.quantity) return prev;

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

  const totalAmount = event?.body?.tickets.reduce((sum: any, ticket: any) => {
    const selection = ticketSelections[ticket.id];
    return sum + (selection?.quantity || 0) * Number(ticket.price);
  }, 0);

  const handleBuyTickets = () => {
    // Check if event has tickets
    if (!event?.body?.tickets || event.body.tickets.length === 0) {
      // Event has no tickets at all - proceed directly
      const ticketData = {
        eventId: id,
        currency: event?.body?.currency,
        ticketInstances: [
          { name: "free", price: 0, sessionId: "", ticketId: "" },
        ], // No tickets needed
        totalAmount: 0, // Free event
        each_ticket_identity: event?.body?.each_ticket_identit,
      };

      return router.push({
        pathname: `/home/event/${id}/checkout` as RelativePathString,
        params: { data: JSON.stringify(ticketData) },
      });
    }

    // Event has tickets - verify at least one is selected
    const hasSelectedTickets = Object.values(ticketSelections).some(
      (selection) => selection?.quantity > 0
    );

    if (!hasSelectedTickets) {
      return Alert.alert("Please select at least one ticket to continue");
    }

    // Process selected tickets
    const ticketInstances = event.body.tickets.flatMap((ticket: any) => {
      const selection = ticketSelections[ticket.id];
      if (!selection || selection.quantity === 0) return [];

      return Array(selection.quantity).fill({
        ticketId: ticket.id,
        sessionId: selection.sessionId,
        price: Number(ticket.price),
        name: ticket.name,
      });
    });

    const ticketData = {
      eventId: id,
      currency: event.body.currency,
      ticketInstances,
      totalAmount,
      each_ticket_identity: event.body.each_ticket_identit,
    };

    router.push({
      pathname: `/home/event/${id}/checkout` as RelativePathString,
      params: { data: JSON.stringify(ticketData) },
    });
  };
  const handleBookmark = async () => {
    try {
      const res = await bookmarkevent({ event_id: Number(id) }).unwrap();
      // alert("Bookmarked")
      refetch();
    } catch (err) {
      console.log(err, "errrrrrrrrr");
    }
  };

  const handleBookmarkRemove = async () => {
    try {
      const res = await deleteBookmark(Number(id)).unwrap();
      // alert("Unbookmarked")
      refetch();
    } catch (err) {
      console.log(err, "errrrrrrrrr");
    }
  };
  const handleLike = async () => {
    try {
      const res = await likeEvent(Number(id)).unwrap();
      setIsLiked(true);
      refetch();
    } catch (err) {
      console.log(err, "errrrrrrrrr");
      alert("Error Liking");
    }
  };
  const handleFollowed = async (creatorid: any) => {
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

  return (
    <>
      {isLoading ? (
        <View className="text-white flex-1 bg-background flex justify-center items-center py-4">
          <ActivityIndicator color="#9EDD45" />
        </View>
      ) : error ? (
        <View className="flex-1 bg-background justify-center items-center">
          <Text className="text-red-500">
            Failed to load data. Please try again.
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
                {event?.body?.title}
              </Text>
              <View className="flex-row justify-between ">
                <Text className="text-gray-400 mb-2 flex flex-wrap w-64">
                  {event?.body?.address}
                </Text>
                <Text className="text-white">
                  {formatDate(event?.body?.start_date)}
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
                    eventId={Number(id)}
                    userId={userInfo?.sub}
                  />
                  <TouchableOpacity className="flex-row items-center space-x-2">
                    <Share2Icon className="text-gray-400" size={20} />
                    <Text className="text-gray-400">Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View className="bg-gray-800 rounded-lg p-3 mb-2">
                <Text className="text-white text-xl font-semibold mb-4">
                  About Event
                </Text>
                <Text className="text-gray-400 mb-6">
                  {event?.body?.description}
                </Text>
              </View>
              <View className="bg-[#1A2432] rounded-lg p-4 mb-6">
                <Text className="text-white text-xl font-semibold mb-4">
                  Location
                </Text>
                <Text className="text-white mb-2">{event?.body?.address}</Text>
                <Text className="text-gray-400 mb-4 ">
                  {event?.body?.country?.name}, {event?.body?.state?.name},{" "}
                  {event?.body?.city}
                </Text>
                <View className="w-full h-40 bg-gray-700 rounded-lg my-3 overflow-hidden">
                  {/* <MapView
                      style={{ flex: 1 }}
                      initialRegion={{
                        latitude: 51.5074, // Default to London coordinates
                        longitude: -0.1278,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                      }}
                    >
                      <Marker
                        coordinate={{ latitude: 51.5074, longitude: -0.1278 }}
                        title={event?.body?.address}
                        description={event?.body?.city}
                      />
                    </MapView> */}
                </View>
                <TouchableOpacity onPress={openMaps} className="self-end">
                  <Text className="text-primary">View map</Text>
                </TouchableOpacity>
              </View>
              <View className="bg-gray-800 rounded-lg p-3 mb-2">
                <Text className="text-white text-xl font-semibold mb-4">
                  Date and Time -- Presenter
                </Text>
                <View className="flex-row mb-6">
                  <View className="flex-col gap-2">
                    <View className="flex-row items-center mr-6">
                      <Calendar className="text-gray-400 mr-2" size={20} />
                      <Text className="text-gray-400">
                        {formatDate(event?.body?.start_date)}
                      </Text>
                    </View>
                    {event?.body?.sessions?.map(
                      (session: any, sessionIndex: any) => (
                        <View key={sessionIndex} className="mb-4">
                          <View className="flex-row items-center mb-2">
                            <Clock className="text-gray-400 mr-2" size={20} />
                            <Text className="text-gray-400">
                              {session?.start_time} - {session?.end_time}
                            </Text>
                            <Text className="text-primary ml-1">
                              {`(${session?.name || ""})`}
                            </Text>
                          </View>

                          {session?.participants?.map(
                            (participant: any, participantIndex: any) => (
                              <View
                                key={participantIndex}
                                className="flex-row items-start mb-3 "
                              >
                                {participant?.image ? (
                                  <Image
                                    source={{ uri: participant.image }}
                                    className="w-10 h-10 rounded-full mr-3"
                                    resizeMode="cover"
                                  />
                                ) : (
                                  <View className="w-10 h-10 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                                    <Text>No Image</Text>
                                  </View>
                                )}
                                <View className="flex-1">
                                  <Text className="font-bold text-primary text-lg">
                                    {participant.name}
                                  </Text>
                                  {participant.title && (
                                    <Text className="text-primary text-sm">
                                      {participant.title}
                                    </Text>
                                  )}
                                  <Text className="text-white mt-1">
                                    {participant.description}
                                  </Text>
                                </View>
                              </View>
                            )
                          )}
                        </View>
                      )
                    )}
                  </View>
                </View>
              </View>

              <View className="bg-gray-800 rounded-lg p-2 mb-2">
                <Text className="text-white text-xl font-semibold mb-4">
                  Ticket Information
                </Text>
                <View className="space-y-4">
                  {event?.body?.tickets.map((ticket: any, index: any) => {
                    const selection = ticketSelections[ticket.id] || {
                      quantity: 0,
                      sessionId: event?.body?.sessions[0].id,
                    };
                    const remainingTickets =
                      ticket.quantity - selection.quantity;

                    return (
                      <View key={index}>
                        <View className="flex-row items-center justify-between bg-[#1A2432] p-4 rounded-lg">
                          <View>
                            <Text className="text-white">{ticket.name}</Text>
                            <Text className="text-primary">
                              {event?.body?.currency?.split(" - ")[0]}{" "}
                              {ticket.price}
                            </Text>
                            <Text className="text-gray-400 text-sm">
                              {remainingTickets} tickets remaining
                            </Text>
                          </View>
                          <View className="flex-row items-center space-x-4">
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
                              disabled={remainingTickets === 0}
                            >
                              <Plus
                                size={20}
                                color={remainingTickets === 0 ? "#666" : "#fff"}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {selection.quantity > 0 && (
                          <View className="mt-2 mx-4">
                            <Text className="text-white mb-2">
                              Select Session for {ticket.name}
                            </Text>
                            <TouchableOpacity
                              className="flex-row items-center justify-between bg-[#1A2432] px-3 py-2 rounded-lg"
                              onPress={() => {
                                const currentIndex =
                                  event?.body?.sessions.findIndex(
                                    (s: any) => s.id === selection.sessionId
                                  );
                                const newIndex =
                                  (currentIndex + 1) %
                                  event?.body?.sessions.length;
                                updateSession(
                                  ticket.id,
                                  event?.body?.sessions[newIndex].id
                                );
                              }}
                            >
                              <View>
                                <Text className="text-white">
                                  {
                                    event?.body?.sessions.find(
                                      (s: any) => s.id === selection.sessionId
                                    )?.name
                                  }
                                </Text>
                                <Text className="text-gray-400">
                                  {
                                    event?.body?.sessions.find(
                                      (s: any) => s.id === selection.sessionId
                                    )?.start_time
                                  }{" "}
                                  -
                                  {
                                    event?.body?.sessions.find(
                                      (s: any) => s.id === selection.sessionId
                                    )?.end_time
                                  }
                                </Text>
                              </View>
                              <ChevronDown size={20} color="#fff" />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>

                <View className="mt-4 mb-4">
                  <Text className="text-gray-400">
                    Total Tickets:{" "}
                    {Object.values(ticketSelections).reduce(
                      (sum, s) => sum + s.quantity,
                      0
                    )}
                  </Text>
                  <Text className="text-white text-xl font-bold">
                    {event?.body?.currency?.split(" - ")[0]} {totalAmount}
                  </Text>
                  {event?.body?.age_restriction > 0 && (
                    <Text className="text-red-500 text-xs font-bold mt-2">
                      ⚠️ {event?.body?.age_restriction} + is required for this
                      event
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </ScrollView>

          <View className="p-4 border-t border-[#1A2432]">
            <TouchableOpacity
              className="bg-primary rounded-lg py-4"
              onPress={handleBuyTickets}
            >
              <Text className="text-background text-center font-semibold">
                Buy Tickets
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
}
